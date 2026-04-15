import Fastify from "fastify";
import {
  loadBuildethMemoryTools,
  loadBuildethMotionTools,
  loadBuildethReminderTools,
  runWithBuildethToolRuntime,
} from "./buildeth-tools.js";
import {
  buildBuildethCliInvocation,
  execBuildethCli,
  getBuildethRuntime,
  runWithBuildethRuntime,
  type BuildethCliInput,
  type BuildethCliInvocation,
  type BuildethCliName,
  type BuildethCliResult,
  type BuildethRuntimeContext,
} from "./runtime.js";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { createWriteStream, createReadStream, mkdirSync, existsSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = process.env.BUILDETH_APP_ROOT || path.join(__dirname, "../..");
const UPLOADS_DIR = path.join(APP_ROOT, "uploads");
const DB_PATH = path.join(APP_ROOT, "video-qa.db");

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

// Migrate: drop old schema if it has project_id (from prior version)
const videoCols = (db.prepare("PRAGMA table_info(videos)").all() as any[]).map(c => c.name);
if (videoCols.includes("project_id")) {
  db.exec(`DROP TABLE IF EXISTS videos; DROP TABLE IF EXISTS comments; DROP TABLE IF EXISTS share_links; DROP TABLE IF EXISTS teams; DROP TABLE IF EXISTS projects; DROP TABLE IF EXISTS team_members;`);
}
// Migrate: add source column to comments if missing
const commentCols = (db.prepare("PRAGMA table_info(comments)").all() as any[]).map(c => c.name);
if (commentCols.length > 0 && !commentCols.includes("source")) {
  db.exec(`ALTER TABLE comments ADD COLUMN source TEXT NOT NULL DEFAULT 'human';`);
}
// Migrate: fix any existing Runneth comments that got stamped 'human'
db.prepare(`UPDATE comments SET source = 'runneth' WHERE user_name = 'Runneth' AND source = 'human'`).run();
// Migrate: add rejected + annotation columns if missing
const commentColNames = (db.prepare("PRAGMA table_info(comments)").all() as any[]).map((c: any) => c.name);
if (!commentColNames.includes("rejected")) db.exec(`ALTER TABLE comments ADD COLUMN rejected INTEGER DEFAULT 0;`);
if (!commentColNames.includes("annotation")) db.exec(`ALTER TABLE comments ADD COLUMN annotation TEXT;`);

db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    uploader_name TEXT NOT NULL DEFAULT 'Anonymous',
    title TEXT NOT NULL,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    content_type TEXT,
    duration REAL,
    workflow_status TEXT DEFAULT 'review',
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    user_name TEXT NOT NULL DEFAULT 'Anonymous',
    source TEXT NOT NULL DEFAULT 'human',
    text TEXT NOT NULL,
    timestamp_seconds REAL NOT NULL,
    resolved INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );
  CREATE TABLE IF NOT EXISTS share_links (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_by_name TEXT NOT NULL DEFAULT 'Anonymous',
    password TEXT,
    allow_download INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );
`);

const app = Fastify({ logger: false });

app.addHook("onRequest", async (req, reply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type,X-User-Name");
  if (req.method === "OPTIONS") reply.code(204).send();
});

app.addContentTypeParser("application/octet-stream", { parseAs: "buffer", bodyLimit: 500 * 1024 * 1024 }, (_req, payload, done) => done(null, payload));

const who = (req: any) => (req.headers["x-user-name"] as string) || "Anonymous";

// ── VIDEOS ────────────────────────────────────────────────────────────────────

app.get("/api/videos", async () => ({
  videos: db.prepare("SELECT * FROM videos ORDER BY created_at DESC").all()
}));

// Step 1: create record, get ID
app.post("/api/videos", async (req, reply) => {
  const { title, contentType, fileName, fileSize, duration } = req.body as any;
  if (!title && !fileName) return reply.code(400).send({ error: "title required" });
  const id = randomUUID();
  const ext = (fileName || "").split(".").pop() || "mp4";
  db.prepare(`INSERT INTO videos (id, uploader_name, title, file_path, file_name, file_size, content_type, duration)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    id, who(req), title || fileName, `${id}.${ext}`,
    fileName || "video.mp4", fileSize || null, contentType || "video/mp4", duration || null
  );
  return { video: db.prepare("SELECT * FROM videos WHERE id = ?").get(id) };
});

// Step 2: upload raw binary
app.put("/api/videos/:id/upload", async (req, reply) => {
  const { id } = req.params as any;
  const video = db.prepare("SELECT * FROM videos WHERE id = ?").get(id) as any;
  if (!video) return reply.code(404).send({ error: "Not found" });
  const raw = req.body as Buffer;
  if (!raw?.length) return reply.code(400).send({ error: "Empty body" });
  const filePath = path.join(UPLOADS_DIR, video.file_path);
  const ws = createWriteStream(filePath);
  ws.write(raw);
  await new Promise<void>((res, rej) => { ws.end(); ws.on("finish", res); ws.on("error", rej); });
  db.prepare("UPDATE videos SET file_size = ? WHERE id = ?").run(statSync(filePath).size, id);
  return { ok: true };
});

app.get("/api/videos/:id", async (req, reply) => {
  const { id } = req.params as any;
  const v = db.prepare("SELECT * FROM videos WHERE id = ?").get(id);
  if (!v) return reply.code(404).send({ error: "Not found" });
  return { video: v };
});

app.patch("/api/videos/:id", async (req, reply) => {
  const { id } = req.params as any;
  const { workflow_status, title } = req.body as any;
  if (workflow_status) db.prepare("UPDATE videos SET workflow_status = ? WHERE id = ?").run(workflow_status, id);
  if (title) db.prepare("UPDATE videos SET title = ? WHERE id = ?").run(title, id);
  return { video: db.prepare("SELECT * FROM videos WHERE id = ?").get(id) };
});

app.delete("/api/videos/:id", async (req, reply) => {
  const { id } = req.params as any;
  const v = db.prepare("SELECT * FROM videos WHERE id = ?").get(id) as any;
  if (!v) return reply.code(404).send({ error: "Not found" });
  if (v.file_path) try { unlinkSync(path.join(UPLOADS_DIR, v.file_path)); } catch {}
  db.prepare("DELETE FROM comments WHERE video_id = ?").run(id);
  db.prepare("DELETE FROM share_links WHERE video_id = ?").run(id);
  db.prepare("DELETE FROM videos WHERE id = ?").run(id);
  return { ok: true };
});

// Stream
app.get("/api/videos/:id/stream", async (req, reply) => {
  const { id } = req.params as any;
  const token = (req.query as any).token;
  const v = db.prepare("SELECT * FROM videos WHERE id = ?").get(id) as any;
  if (!v?.file_path) return reply.code(404).send({ error: "Not found" });
  if (token) {
    const link = db.prepare("SELECT video_id FROM share_links WHERE token = ?").get(token) as any;
    if (!link || link.video_id !== id) return reply.code(403).send({ error: "Forbidden" });
  }
  const filePath = path.join(UPLOADS_DIR, v.file_path);
  if (!existsSync(filePath)) return reply.code(404).send({ error: "File missing" });
  const size = statSync(filePath).size;
  const range = req.headers.range;
  reply.header("Accept-Ranges", "bytes").header("Content-Type", v.content_type || "video/mp4");
  if (range) {
    const [s, e] = range.replace("bytes=", "").split("-");
    const start = parseInt(s, 10);
    const end = e ? parseInt(e, 10) : Math.min(start + 5 * 1024 * 1024, size - 1);
    reply.code(206).header("Content-Range", `bytes ${start}-${end}/${size}`).header("Content-Length", end - start + 1);
    return reply.send(createReadStream(filePath, { start, end }));
  }
  return reply.header("Content-Length", size).send(createReadStream(filePath));
});

// ── COMMENTS ─────────────────────────────────────────────────────────────────

app.get("/api/videos/:id/comments", async (req) => {
  const { id } = req.params as any;
  return { comments: db.prepare("SELECT * FROM comments WHERE video_id = ? ORDER BY timestamp_seconds ASC").all(id) };
});

app.post("/api/videos/:id/comments", async (req, reply) => {
  const { id } = req.params as any;
  const { text, timestamp_seconds, user_name, source } = req.body as any;
  if (!text || timestamp_seconds === undefined) return reply.code(400).send({ error: "text and timestamp_seconds required" });
  const cid = randomUUID();
  const name = user_name || who(req);
  const src = source === "runneth" ? "runneth" : "human";
  db.prepare("INSERT INTO comments (id, video_id, user_name, source, text, timestamp_seconds) VALUES (?,?,?,?,?,?)").run(cid, id, name, src, text, timestamp_seconds);
  return { comment: db.prepare("SELECT * FROM comments WHERE id = ?").get(cid) };
});

app.patch("/api/comments/:cid", async (req) => {
  const { cid } = req.params as any;
  const { resolved, rejected, annotation } = req.body as any;
  if (resolved !== undefined) db.prepare("UPDATE comments SET resolved = ?, rejected = 0 WHERE id = ?").run(resolved ? 1 : 0, cid);
  if (rejected !== undefined) db.prepare("UPDATE comments SET rejected = ?, resolved = 0 WHERE id = ?").run(rejected ? 1 : 0, cid);
  if (annotation !== undefined) db.prepare("UPDATE comments SET annotation = ? WHERE id = ?").run(annotation || null, cid);
  return { comment: db.prepare("SELECT * FROM comments WHERE id = ?").get(cid) };
});

app.delete("/api/comments/:cid", async (req) => {
  const { cid } = req.params as any;
  db.prepare("DELETE FROM comments WHERE id = ?").run(cid);
  return { ok: true };
});

// ── SHARE ─────────────────────────────────────────────────────────────────────

app.get("/api/videos/:id/share-links", async (req) => {
  const { id } = req.params as any;
  return { links: db.prepare("SELECT * FROM share_links WHERE video_id = ? ORDER BY created_at DESC").all(id) };
});

app.post("/api/videos/:id/share-links", async (req, reply) => {
  const { id } = req.params as any;
  if (!db.prepare("SELECT id FROM videos WHERE id = ?").get(id)) return reply.code(404).send({ error: "Not found" });
  const { allow_download, password } = req.body as any;
  const lid = randomUUID();
  const token = randomUUID().replace(/-/g, "");
  db.prepare("INSERT INTO share_links (id, video_id, token, created_by_name, allow_download, password) VALUES (?,?,?,?,?,?)").run(
    lid, id, token, who(req), allow_download ? 1 : 0, password || null
  );
  return { link: db.prepare("SELECT * FROM share_links WHERE id = ?").get(lid) };
});

app.delete("/api/share-links/:lid", async (req) => {
  db.prepare("DELETE FROM share_links WHERE id = ?").run((req.params as any).lid);
  return { ok: true };
});

// Public share
app.get("/api/share/:token", async (req, reply) => {
  const { token } = req.params as any;
  const { password } = req.query as any;
  const link = db.prepare("SELECT * FROM share_links WHERE token = ?").get(token) as any;
  if (!link) return reply.code(404).send({ error: "Not found" });
  if (link.password && password !== link.password) return reply.code(401).send({ error: "Password required", passwordRequired: true });
  db.prepare("UPDATE share_links SET view_count = view_count + 1 WHERE id = ?").run(link.id);
  return {
    video: db.prepare("SELECT id, title, uploader_name, duration, content_type, workflow_status FROM videos WHERE id = ?").get(link.video_id),
    link: { token: link.token, allow_download: link.allow_download, created_by_name: link.created_by_name },
  };
});

// Training data — read by Runneth to synthesize rubric and compute scores
app.get("/api/training-data", async () => {
  const signals = db.prepare(`
    SELECT c.id, c.video_id, c.user_name, c.text, c.timestamp_seconds,
           c.resolved, c.rejected, c.annotation, c.created_at,
           v.title as video_title, v.duration as video_duration
    FROM comments c JOIN videos v ON v.id = c.video_id
    WHERE c.source = 'runneth' AND (c.resolved = 1 OR c.rejected = 1)
    ORDER BY c.created_at ASC
  `).all();

  const humanComments = db.prepare(`
    SELECT c.id, c.video_id, c.user_name, c.text, c.timestamp_seconds, c.created_at,
           v.title as video_title
    FROM comments c JOIN videos v ON v.id = c.video_id
    WHERE c.source = 'human'
    ORDER BY c.created_at ASC
  `).all();

  const r = (sql: string) => (db.prepare(sql).get() as any).n;
  const stats = {
    total_runneth:    r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth'`),
    accepted:         r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND resolved=1`),
    rejected:         r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND rejected=1`),
    unreviewed:       r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND resolved=0 AND rejected=0`),
    annotated:        r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND annotation IS NOT NULL`),
    human_comments:   r(`SELECT COUNT(*) as n FROM comments WHERE source='human'`),
    videos_reviewed:  r(`SELECT COUNT(DISTINCT video_id) as n FROM comments WHERE source='human'`),
  };

  return { stats, signals, human_comments: humanComments };
});

app.get("/api/health", async () => ({ ok: true }));

// ── handleRequest ─────────────────────────────────────────────────────────────

export type BuildethBackendRequest = Readonly<{ method: string; path: string; headers: Readonly<Record<string, string>>; body?: unknown; runtime: any }>;
export type BuildethBackendResponse = Readonly<{ status: number; headers?: Readonly<Record<string, string>>; body?: unknown }>;
type InjectMethod = "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";

const toHdrs = (h: Record<string, any>): Record<string, string> => {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) if (v !== undefined) r[k] = Array.isArray(v) ? v.join(", ") : String(v);
  return r;
};
const toMethod = (m: string): InjectMethod => {
  const u = m.toUpperCase();
  return (["DELETE","GET","HEAD","OPTIONS","PATCH","POST","PUT"] as InjectMethod[]).includes(u as InjectMethod) ? u as InjectMethod : "GET";
};
const toPayload = (p: unknown): any => {
  if (p == null) return undefined;
  if (typeof p === "string" || p instanceof Uint8Array || Array.isArray(p)) return p;
  if (typeof p === "object") return p as any;
  return String(p);
};

export { loadBuildethMemoryTools, loadBuildethMotionTools, loadBuildethReminderTools, runWithBuildethToolRuntime } from "./buildeth-tools.js";
export { buildBuildethCliInvocation, execBuildethCli, getBuildethRuntime, type BuildethCliInput, type BuildethCliInvocation, type BuildethCliName, type BuildethCliResult, type BuildethRuntimeContext } from "./runtime.js";

const ready = app.ready();

export const handleRequest = async (req: BuildethBackendRequest): Promise<BuildethBackendResponse> => {
  await ready;
  const res = await app.inject({ headers: req.headers as Record<string, string>, method: toMethod(req.method), payload: toPayload(req.body), url: req.path });
  return { status: res.statusCode, headers: toHdrs(res.headers as any), body: res.rawPayload };
};
