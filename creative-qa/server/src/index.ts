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
import {
  createWriteStream,
  createReadStream,
  readFileSync,
  writeFileSync,
  appendFileSync,
  renameSync,
  mkdirSync,
  existsSync,
  statSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = process.env.BUILDETH_APP_ROOT || path.join(__dirname, "../..");
const UPLOADS_DIR = path.join(APP_ROOT, "uploads");
const DB_PATH = path.join(APP_ROOT, "creative-qa.db");

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

// ── Migrations ───────────────────────────────────────────────────────────────

const assetCols = (db.prepare("PRAGMA table_info(assets)").all() as any[]).map((c) => c.name);

// Add asset_type if missing on existing installs
if (assetCols.length > 0 && !assetCols.includes("asset_type")) {
  db.exec(`ALTER TABLE assets ADD COLUMN asset_type TEXT NOT NULL DEFAULT 'video';`);
}

const commentCols = (db.prepare("PRAGMA table_info(comments)").all() as any[]).map((c) => c.name);

if (commentCols.length > 0 && !commentCols.includes("source")) {
  db.exec(`ALTER TABLE comments ADD COLUMN source TEXT NOT NULL DEFAULT 'human';`);
}
if (commentCols.length > 0) {
  db.prepare(`UPDATE comments SET source = 'runneth' WHERE user_name = 'Runneth' AND source = 'human'`).run();
}
if (commentCols.length > 0 && !commentCols.includes("rejected")) {
  db.exec(`ALTER TABLE comments ADD COLUMN rejected INTEGER DEFAULT 0;`);
}
if (commentCols.length > 0 && !commentCols.includes("annotation")) {
  db.exec(`ALTER TABLE comments ADD COLUMN annotation TEXT;`);
}
if (commentCols.length > 0 && !commentCols.includes("routing")) {
  db.exec(`ALTER TABLE comments ADD COLUMN routing TEXT NOT NULL DEFAULT 'objective';`);
}
if (commentCols.length > 0 && !commentCols.includes("pin_x")) {
  db.exec(`ALTER TABLE comments ADD COLUMN pin_x REAL;`);
}
if (commentCols.length > 0 && !commentCols.includes("pin_y")) {
  db.exec(`ALTER TABLE comments ADD COLUMN pin_y REAL;`);
}

// ── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS assets (
    id           TEXT PRIMARY KEY,
    uploader_name TEXT NOT NULL DEFAULT 'Anonymous',
    title        TEXT NOT NULL,
    asset_type   TEXT NOT NULL DEFAULT 'video',
    file_path    TEXT,
    file_name    TEXT,
    file_size    INTEGER,
    content_type TEXT,
    duration     REAL,
    workflow_status TEXT DEFAULT 'review',
    created_at   INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id               TEXT PRIMARY KEY,
    asset_id         TEXT NOT NULL,
    user_name        TEXT NOT NULL DEFAULT 'Anonymous',
    source           TEXT NOT NULL DEFAULT 'human',
    routing          TEXT NOT NULL DEFAULT 'objective',
    text             TEXT NOT NULL,
    timestamp_seconds REAL NOT NULL DEFAULT 0,
    pin_x            REAL,
    pin_y            REAL,
    resolved         INTEGER DEFAULT 0,
    rejected         INTEGER DEFAULT 0,
    annotation       TEXT,
    created_at       INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS share_links (
    id             TEXT PRIMARY KEY,
    asset_id       TEXT NOT NULL,
    token          TEXT UNIQUE NOT NULL,
    created_by_name TEXT NOT NULL DEFAULT 'Anonymous',
    password       TEXT,
    allow_download INTEGER DEFAULT 0,
    view_count     INTEGER DEFAULT 0,
    created_at     INTEGER DEFAULT (strftime('%s','now') * 1000)
  );
`);

// ── Helpers ──────────────────────────────────────────────────────────────────

const app = Fastify({ logger: false });

app.addHook("onRequest", async (req, reply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type,X-User-Name");
  if (req.method === "OPTIONS") reply.code(204).send();
});

app.addContentTypeParser(
  "application/octet-stream",
  { parseAs: "buffer", bodyLimit: 500 * 1024 * 1024 },
  (_req, payload, done) => done(null, payload)
);

const who = (req: any) => (req.headers["x-user-name"] as string) || "Anonymous";

const resolveAssetType = (contentType: string): "video" | "image" => {
  if (contentType.startsWith("image/")) return "image";
  return "video";
};

// ── ASSETS ───────────────────────────────────────────────────────────────────

app.get("/api/assets", async () => ({
  assets: db
    .prepare(
      `SELECT a.*,
        SUM(CASE WHEN c.source = 'runneth' THEN 1 ELSE 0 END) AS runneth_count,
        SUM(CASE WHEN c.source = 'runneth' AND c.resolved = 1 THEN 1 ELSE 0 END) AS accepted_count,
        SUM(CASE WHEN c.source = 'runneth' AND c.rejected = 1 THEN 1 ELSE 0 END) AS rejected_count,
        SUM(CASE WHEN c.source = 'runneth' AND c.resolved = 0 AND c.rejected = 0 THEN 1 ELSE 0 END) AS unreviewed_count
       FROM assets a
       LEFT JOIN comments c ON c.asset_id = a.id
       GROUP BY a.id
       ORDER BY a.created_at DESC`
    )
    .all(),
}));

// Step 1: create record, get ID
app.post("/api/assets", async (req, reply) => {
  const { title, contentType, fileName, fileSize, duration } = req.body as any;
  if (!title && !fileName) return reply.code(400).send({ error: "title required" });
  const id = randomUUID();
  const ct = contentType || "video/mp4";
  const assetType = resolveAssetType(ct);
  const ext = (fileName || "").split(".").pop() || (assetType === "image" ? "jpg" : "mp4");
  db.prepare(
    `INSERT INTO assets (id, uploader_name, title, asset_type, file_path, file_name, file_size, content_type, duration)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(
    id, who(req), title || fileName, assetType,
    `${id}.${ext}`, fileName || `asset.${ext}`, fileSize || null, ct, duration || null
  );
  return { asset: db.prepare("SELECT * FROM assets WHERE id = ?").get(id) };
});

// Step 2: upload file — accepts base64 JSON (browser) or raw binary (agent shell)
// bodyLimit raised to 150 MB to cover base64 overhead (~33%) on source files up to ~110 MB
app.put("/api/assets/:id/upload", { bodyLimit: 150 * 1024 * 1024 }, async (req, reply) => {
  const { id } = req.params as any;
  const asset = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as any;
  if (!asset) return reply.code(404).send({ error: "Not found" });

  let raw: Buffer | null = null;
  const body = req.body as any;

  if (Buffer.isBuffer(body) && body.length > 0) {
    // Raw binary from agent shell
    raw = body;
  } else if (body && typeof body === "object" && typeof body.data === "string") {
    // Base64 JSON from browser
    raw = Buffer.from(body.data, "base64");
  }

  if (!raw || raw.length === 0) return reply.code(400).send({ error: "Empty body" });

  const filePath = path.join(UPLOADS_DIR, asset.file_path);
  const ws = createWriteStream(filePath);
  ws.write(raw);
  await new Promise<void>((res, rej) => {
    ws.end();
    ws.on("finish", res);
    ws.on("error", rej);
  });
  db.prepare("UPDATE assets SET file_size = ? WHERE id = ?").run(raw.length, id);
  return { ok: true };
});

// Chunked upload — each chunk is base64 JSON, proxy-safe at any file size
// POST /chunk  { index, total, data: base64 }  — write/append chunk to .tmp file
// POST /complete { total }                    — rename .tmp to final path, update DB
app.post("/api/assets/:id/upload/chunk", async (req, reply) => {
  const { id } = req.params as any;
  const asset = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as any;
  if (!asset) return reply.code(404).send({ error: "Not found" });
  const { index, data } = req.body as any;
  if (typeof data !== "string" || !data.length) return reply.code(400).send({ error: "Missing data" });
  const raw = Buffer.from(data, "base64");
  const tmpPath = path.join(UPLOADS_DIR, `${id}.tmp`);
  if (index === 0) {
    writeFileSync(tmpPath, raw);
  } else {
    appendFileSync(tmpPath, raw);
  }
  return { ok: true, index };
});

app.post("/api/assets/:id/upload/complete", async (req, reply) => {
  const { id } = req.params as any;
  const asset = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as any;
  if (!asset) return reply.code(404).send({ error: "Not found" });
  const tmpPath = path.join(UPLOADS_DIR, `${id}.tmp`);
  if (!existsSync(tmpPath)) return reply.code(400).send({ error: "No upload in progress" });
  const finalPath = path.join(UPLOADS_DIR, asset.file_path);
  renameSync(tmpPath, finalPath);
  const size = statSync(finalPath).size;
  db.prepare("UPDATE assets SET file_size = ? WHERE id = ?").run(size, id);
  return { ok: true, size };
});

app.get("/api/assets/:id", async (req, reply) => {
  const { id } = req.params as any;
  const a = db.prepare("SELECT * FROM assets WHERE id = ?").get(id);
  if (!a) return reply.code(404).send({ error: "Not found" });
  return { asset: a };
});

app.patch("/api/assets/:id", async (req, reply) => {
  const { id } = req.params as any;
  const { workflow_status, title } = req.body as any;
  if (workflow_status) db.prepare("UPDATE assets SET workflow_status = ? WHERE id = ?").run(workflow_status, id);
  if (title) db.prepare("UPDATE assets SET title = ? WHERE id = ?").run(title, id);
  return { asset: db.prepare("SELECT * FROM assets WHERE id = ?").get(id) };
});

app.delete("/api/assets/:id", async (req, reply) => {
  const { id } = req.params as any;
  const a = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as any;
  if (!a) return reply.code(404).send({ error: "Not found" });
  if (a.file_path) try { unlinkSync(path.join(UPLOADS_DIR, a.file_path)); } catch {}
  db.prepare("DELETE FROM comments WHERE asset_id = ?").run(id);
  db.prepare("DELETE FROM share_links WHERE asset_id = ?").run(id);
  db.prepare("DELETE FROM assets WHERE id = ?").run(id);
  return { ok: true };
});

// Stream video (range-request supported)
app.get("/api/assets/:id/stream", async (req, reply) => {
  const { id } = req.params as any;
  const token = (req.query as any).token;
  const a = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as any;
  if (!a?.file_path) return reply.code(404).send({ error: "Not found" });
  if (token) {
    const link = db.prepare("SELECT asset_id FROM share_links WHERE token = ?").get(token) as any;
    if (!link || link.asset_id !== id) return reply.code(403).send({ error: "Forbidden" });
  }
  const filePath = path.join(UPLOADS_DIR, a.file_path);
  if (!existsSync(filePath)) return reply.code(404).send({ error: "File missing" });
  const size = statSync(filePath).size;
  const range = req.headers.range;
  reply.header("Accept-Ranges", "bytes").header("Content-Type", a.content_type || "video/mp4");
  if (range) {
    const [s, e] = range.replace("bytes=", "").split("-");
    const start = parseInt(s, 10);
    const end = e ? parseInt(e, 10) : Math.min(start + 5 * 1024 * 1024, size - 1);
    reply.code(206)
      .header("Content-Range", `bytes ${start}-${end}/${size}`)
      .header("Content-Length", end - start + 1);
    return reply.send(createReadStream(filePath, { start, end }));
  }
  return reply.header("Content-Length", size).send(createReadStream(filePath));
});

// Return image as base64 JSON — proxy-safe for browser display
app.get("/api/assets/:id/data", async (req, reply) => {
  const { id } = req.params as any;
  const a = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as any;
  if (!a?.file_path) return reply.code(404).send({ error: "Not found" });
  const filePath = path.join(UPLOADS_DIR, a.file_path);
  if (!existsSync(filePath)) return reply.code(404).send({ error: "File missing" });
  const data = readFileSync(filePath).toString("base64");
  return { data, mimeType: a.content_type || "image/jpeg" };
});

// Serve image (simple file read, no range needed)
app.get("/api/assets/:id/serve", async (req, reply) => {
  const { id } = req.params as any;
  const token = (req.query as any).token;
  const a = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as any;
  if (!a?.file_path) return reply.code(404).send({ error: "Not found" });
  if (token) {
    const link = db.prepare("SELECT asset_id FROM share_links WHERE token = ?").get(token) as any;
    if (!link || link.asset_id !== id) return reply.code(403).send({ error: "Forbidden" });
  }
  const filePath = path.join(UPLOADS_DIR, a.file_path);
  if (!existsSync(filePath)) return reply.code(404).send({ error: "File missing" });
  reply.header("Content-Type", a.content_type || "image/jpeg");
  reply.header("Cache-Control", "public, max-age=3600");
  return reply.send(createReadStream(filePath));
});

// ── COMMENTS ─────────────────────────────────────────────────────────────────

app.get("/api/assets/:id/comments", async (req) => {
  const { id } = req.params as any;
  return {
    comments: db
      .prepare("SELECT * FROM comments WHERE asset_id = ? ORDER BY timestamp_seconds ASC, created_at ASC")
      .all(id),
  };
});

app.post("/api/assets/:id/comments", async (req, reply) => {
  const { id } = req.params as any;
  const { text, timestamp_seconds, user_name, source, routing, pin_x, pin_y } = req.body as any;
  if (!text) return reply.code(400).send({ error: "text required" });
  const cid = randomUUID();
  const name = user_name || who(req);
  const src = source === "runneth" ? "runneth" : "human";
  const route = routing === "subjective" ? "subjective" : "objective";
  const ts = timestamp_seconds ?? 0;
  const px = pin_x ?? null;
  const py = pin_y ?? null;
  db.prepare(
    `INSERT INTO comments (id, asset_id, user_name, source, routing, text, timestamp_seconds, pin_x, pin_y)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(cid, id, name, src, route, text, ts, px, py);
  return { comment: db.prepare("SELECT * FROM comments WHERE id = ?").get(cid) };
});

app.patch("/api/comments/:cid", async (req) => {
  const { cid } = req.params as any;
  const { resolved, rejected, annotation, routing } = req.body as any;
  if (resolved !== undefined)
    db.prepare("UPDATE comments SET resolved = ?, rejected = 0 WHERE id = ?").run(resolved ? 1 : 0, cid);
  if (rejected !== undefined)
    db.prepare("UPDATE comments SET rejected = ?, resolved = 0 WHERE id = ?").run(rejected ? 1 : 0, cid);
  if (annotation !== undefined)
    db.prepare("UPDATE comments SET annotation = ? WHERE id = ?").run(annotation || null, cid);
  if (routing !== undefined)
    db.prepare("UPDATE comments SET routing = ? WHERE id = ?").run(
      routing === "subjective" ? "subjective" : "objective", cid
    );
  return { comment: db.prepare("SELECT * FROM comments WHERE id = ?").get(cid) };
});

app.delete("/api/comments/:cid", async (req) => {
  const { cid } = req.params as any;
  db.prepare("DELETE FROM comments WHERE id = ?").run(cid);
  return { ok: true };
});

// ── SHARE ─────────────────────────────────────────────────────────────────────

app.get("/api/assets/:id/share-links", async (req) => {
  const { id } = req.params as any;
  return { links: db.prepare("SELECT * FROM share_links WHERE asset_id = ? ORDER BY created_at DESC").all(id) };
});

app.post("/api/assets/:id/share-links", async (req, reply) => {
  const { id } = req.params as any;
  if (!db.prepare("SELECT id FROM assets WHERE id = ?").get(id)) return reply.code(404).send({ error: "Not found" });
  const { allow_download, password } = req.body as any;
  const lid = randomUUID();
  const token = randomUUID().replace(/-/g, "");
  db.prepare(
    "INSERT INTO share_links (id, asset_id, token, created_by_name, allow_download, password) VALUES (?,?,?,?,?,?)"
  ).run(lid, id, token, who(req), allow_download ? 1 : 0, password || null);
  return { link: db.prepare("SELECT * FROM share_links WHERE id = ?").get(lid) };
});

app.delete("/api/share-links/:lid", async (req) => {
  db.prepare("DELETE FROM share_links WHERE id = ?").run((req.params as any).lid);
  return { ok: true };
});

app.get("/api/share/:token", async (req, reply) => {
  const { token } = req.params as any;
  const { password } = req.query as any;
  const link = db.prepare("SELECT * FROM share_links WHERE token = ?").get(token) as any;
  if (!link) return reply.code(404).send({ error: "Not found" });
  if (link.password && password !== link.password)
    return reply.code(401).send({ error: "Password required", passwordRequired: true });
  db.prepare("UPDATE share_links SET view_count = view_count + 1 WHERE id = ?").run(link.id);
  return {
    asset: db
      .prepare(
        "SELECT id, title, uploader_name, asset_type, duration, content_type, workflow_status FROM assets WHERE id = ?"
      )
      .get(link.asset_id),
    link: { token: link.token, allow_download: link.allow_download, created_by_name: link.created_by_name },
  };
});

// ── TRAINING DATA ─────────────────────────────────────────────────────────────

app.get("/api/training-data", async () => {
  const signals = db
    .prepare(
      `SELECT c.id, c.asset_id, c.user_name, c.text, c.timestamp_seconds, c.pin_x, c.pin_y,
              c.routing, c.resolved, c.rejected, c.annotation, c.created_at,
              a.title as asset_title, a.asset_type, a.duration as asset_duration
       FROM comments c
       JOIN assets a ON a.id = c.asset_id
       WHERE c.source = 'runneth' AND (c.resolved = 1 OR c.rejected = 1)
       ORDER BY c.created_at ASC`
    )
    .all();

  const humanComments = db
    .prepare(
      `SELECT c.id, c.asset_id, c.user_name, c.text, c.timestamp_seconds, c.pin_x, c.pin_y,
              c.routing, c.created_at, a.title as asset_title, a.asset_type
       FROM comments c
       JOIN assets a ON a.id = c.asset_id
       WHERE c.source = 'human'
       ORDER BY c.created_at ASC`
    )
    .all();

  const r = (sql: string) => (db.prepare(sql).get() as any).n;
  const stats = {
    total_runneth: r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth'`),
    accepted: r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND resolved=1`),
    rejected: r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND rejected=1`),
    unreviewed: r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND resolved=0 AND rejected=0`),
    annotated: r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND annotation IS NOT NULL`),
    human_comments: r(`SELECT COUNT(*) as n FROM comments WHERE source='human'`),
    assets_reviewed: r(`SELECT COUNT(DISTINCT asset_id) as n FROM comments WHERE source='human'`),
    objective_signals: r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND routing='objective' AND (resolved=1 OR rejected=1)`),
    subjective_signals: r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND routing='subjective' AND (resolved=1 OR rejected=1)`),
  };

  return { stats, signals, human_comments: humanComments };
});

// Assets with no Runneth comments yet — used by the QA auto-runner monitor
app.get("/api/pending-qa", async () => {
  const pending = db
    .prepare(
      `SELECT a.id, a.title, a.asset_type, a.file_path, a.content_type
       FROM assets a
       WHERE a.file_path IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM comments c
           WHERE c.asset_id = a.id AND c.source = 'runneth'
         )
       ORDER BY a.created_at ASC`
    )
    .all();
  return { count: (pending as any[]).length, pending };
});

app.get("/api/health", async () => ({ ok: true }));

// ── handleRequest ─────────────────────────────────────────────────────────────

export type BuildethBackendRequest = Readonly<{
  method: string;
  path: string;
  headers: Readonly<Record<string, string>>;
  body?: unknown;
  runtime: any;
}>;

export type BuildethBackendResponse = Readonly<{
  status: number;
  headers?: Readonly<Record<string, string>>;
  body?: unknown;
}>;

type InjectMethod = "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";

const toHdrs = (h: Record<string, any>): Record<string, string> => {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(h))
    if (v !== undefined) r[k] = Array.isArray(v) ? v.join(", ") : String(v);
  return r;
};

const toMethod = (m: string): InjectMethod => {
  const u = m.toUpperCase();
  return (["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"] as InjectMethod[]).includes(u as InjectMethod)
    ? (u as InjectMethod)
    : "GET";
};

const toPayload = (p: unknown): any => {
  if (p == null) return undefined;
  if (typeof p === "string" || p instanceof Uint8Array || Array.isArray(p)) return p;
  if (typeof p === "object") return p as any;
  return String(p);
};

export {
  loadBuildethMemoryTools,
  loadBuildethMotionTools,
  loadBuildethReminderTools,
  runWithBuildethToolRuntime,
} from "./buildeth-tools.js";

export {
  buildBuildethCliInvocation,
  execBuildethCli,
  getBuildethRuntime,
  type BuildethCliInput,
  type BuildethCliInvocation,
  type BuildethCliName,
  type BuildethCliResult,
  type BuildethRuntimeContext,
} from "./runtime.js";

const ready = app.ready();

export const handleRequest = async (req: BuildethBackendRequest): Promise<BuildethBackendResponse> => {
  await ready;
  const res = await app.inject({
    method: toMethod(req.method),
    url: req.path,
    headers: req.headers as Record<string, string>,
    payload: toPayload(req.body),
  });
  return {
    status: res.statusCode,
    headers: toHdrs(res.headers as Record<string, any>),
    body: res.rawPayload,
  };
};
