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
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = process.env.BUILDETH_APP_ROOT || path.join(__dirname, "../..");
const DB_PATH = path.join(APP_ROOT, "brief-qa.db");

const db = new DatabaseSync(DB_PATH);

// ── Migrations ────────────────────────────────────────────────────────────────
const commentCols = (db.prepare("PRAGMA table_info(comments)").all() as any[]).map((c) => c.name);
if (commentCols.length > 0) {
  if (!commentCols.includes("source"))
    db.exec(`ALTER TABLE comments ADD COLUMN source TEXT NOT NULL DEFAULT 'human';`);
  db.prepare(`UPDATE comments SET source = 'runneth' WHERE user_name = 'Runneth' AND source = 'human'`).run();
  if (!commentCols.includes("rejected"))
    db.exec(`ALTER TABLE comments ADD COLUMN rejected INTEGER DEFAULT 0;`);
  if (!commentCols.includes("annotation"))
    db.exec(`ALTER TABLE comments ADD COLUMN annotation TEXT;`);
  if (!commentCols.includes("section"))
    db.exec(`ALTER TABLE comments ADD COLUMN section TEXT DEFAULT 'overall';`);
}

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS briefs (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    brand_name   TEXT,
    for_context  TEXT,
    goal         TEXT,
    landing_page TEXT,
    full_brief   TEXT NOT NULL,
    metadata     TEXT,
    workflow_status TEXT DEFAULT 'pending_review',
    created_at   INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id         TEXT PRIMARY KEY,
    brief_id   TEXT NOT NULL,
    user_name  TEXT NOT NULL DEFAULT 'Anonymous',
    source     TEXT NOT NULL DEFAULT 'human',
    text       TEXT NOT NULL,
    section    TEXT DEFAULT 'overall',
    resolved   INTEGER DEFAULT 0,
    rejected   INTEGER DEFAULT 0,
    annotation TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );
`);

// ── Config helpers ───────────────────────────────────────────────────────────
const getConfig = () => {
  const rows = db.prepare("SELECT key, value FROM config").all() as { key: string; value: string }[];
  return rows.reduce((acc, r) => {
    try { acc[r.key] = JSON.parse(r.value); } catch { acc[r.key] = r.value; }
    return acc;
  }, {} as Record<string, any>);
};

const setConfig = (key: string, value: unknown) => {
  const v = typeof value === "string" ? value : JSON.stringify(value);
  db.prepare(`INSERT INTO config (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=strftime('%s','now')*1000`).run(key, v);
};

// ── App ───────────────────────────────────────────────────────────────────────
const app = Fastify({ logger: false });

app.addHook("onRequest", async (req, reply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type,X-User-Name");
  if (req.method === "OPTIONS") reply.code(204).send();
});

const who = (req: any) => (req.headers["x-user-name"] as string) || "Anonymous";

// ── CONFIG ───────────────────────────────────────────────────────────────────
app.get("/api/config", async () => ({ config: getConfig() }));

app.post("/api/config", async (req, reply) => {
  const body = req.body as Record<string, unknown>;
  if (!body || typeof body !== "object") return reply.code(400).send({ error: "body required" });
  for (const [k, v] of Object.entries(body)) setConfig(k, v);
  return { config: getConfig() };
});

app.patch("/api/config/:key", async (req, reply) => {
  const { key } = req.params as any;
  const { value } = req.body as any;
  if (value === undefined) return reply.code(400).send({ error: "value required" });
  setConfig(key, value);
  return { config: getConfig() };
});

// ── BRIEFS ────────────────────────────────────────────────────────────────────
app.get("/api/briefs", async () => ({
  briefs: db
    .prepare(
      `SELECT b.*,
        SUM(CASE WHEN c.source = 'runneth' THEN 1 ELSE 0 END)                                    AS runneth_count,
        SUM(CASE WHEN c.source = 'runneth' AND c.resolved = 1 THEN 1 ELSE 0 END)                 AS accepted_count,
        SUM(CASE WHEN c.source = 'runneth' AND c.rejected = 1 THEN 1 ELSE 0 END)                 AS rejected_count,
        SUM(CASE WHEN c.source = 'runneth' AND c.resolved = 0 AND c.rejected = 0 THEN 1 ELSE 0 END) AS unreviewed_count
       FROM briefs b
       LEFT JOIN comments c ON c.brief_id = b.id
       GROUP BY b.id
       ORDER BY b.created_at DESC`
    )
    .all(),
}));

app.post("/api/briefs", async (req, reply) => {
  const { title, brand_name, for_context, goal, landing_page, full_brief, metadata } = req.body as any;
  if (!title || !full_brief) return reply.code(400).send({ error: "title and full_brief required" });
  const id = randomUUID();
  db.prepare(
    `INSERT INTO briefs (id, title, brand_name, for_context, goal, landing_page, full_brief, metadata)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(
    id,
    title,
    brand_name || null,
    for_context || null,
    goal || null,
    landing_page || null,
    full_brief,
    metadata ? (typeof metadata === "string" ? metadata : JSON.stringify(metadata)) : null
  );
  return { brief: db.prepare("SELECT * FROM briefs WHERE id = ?").get(id) };
});

app.get("/api/briefs/:id", async (req, reply) => {
  const { id } = req.params as any;
  const b = db.prepare("SELECT * FROM briefs WHERE id = ?").get(id);
  if (!b) return reply.code(404).send({ error: "Not found" });
  return { brief: b };
});

app.patch("/api/briefs/:id", async (req, reply) => {
  const { id } = req.params as any;
  const { workflow_status, title, full_brief, metadata } = req.body as any;
  if (workflow_status) db.prepare("UPDATE briefs SET workflow_status = ? WHERE id = ?").run(workflow_status, id);
  if (title) db.prepare("UPDATE briefs SET title = ? WHERE id = ?").run(title, id);
  if (full_brief) db.prepare("UPDATE briefs SET full_brief = ? WHERE id = ?").run(full_brief, id);
  if (metadata)
    db.prepare("UPDATE briefs SET metadata = ? WHERE id = ?").run(
      typeof metadata === "string" ? metadata : JSON.stringify(metadata),
      id
    );
  return { brief: db.prepare("SELECT * FROM briefs WHERE id = ?").get(id) };
});

app.delete("/api/briefs/:id", async (req, reply) => {
  const { id } = req.params as any;
  if (!db.prepare("SELECT id FROM briefs WHERE id = ?").get(id))
    return reply.code(404).send({ error: "Not found" });
  db.prepare("DELETE FROM comments WHERE brief_id = ?").run(id);
  db.prepare("DELETE FROM briefs WHERE id = ?").run(id);
  return { ok: true };
});

// ── COMMENTS ──────────────────────────────────────────────────────────────────
app.get("/api/briefs/:id/comments", async (req) => {
  const { id } = req.params as any;
  return {
    comments: db
      .prepare("SELECT * FROM comments WHERE brief_id = ? ORDER BY created_at ASC")
      .all(id),
  };
});

app.post("/api/briefs/:id/comments", async (req, reply) => {
  const { id } = req.params as any;
  const { text, user_name, source, section } = req.body as any;
  if (!text) return reply.code(400).send({ error: "text required" });
  const cid = randomUUID();
  const name = user_name || who(req);
  const src = source === "runneth" ? "runneth" : "human";
  const sec = section || "overall";
  db.prepare(
    "INSERT INTO comments (id, brief_id, user_name, source, text, section) VALUES (?,?,?,?,?,?)"
  ).run(cid, id, name, src, text, sec);
  return { comment: db.prepare("SELECT * FROM comments WHERE id = ?").get(cid) };
});

app.patch("/api/comments/:cid", async (req) => {
  const { cid } = req.params as any;
  const { resolved, rejected, annotation } = req.body as any;
  if (resolved !== undefined)
    db.prepare("UPDATE comments SET resolved = ?, rejected = 0 WHERE id = ?").run(resolved ? 1 : 0, cid);
  if (rejected !== undefined)
    db.prepare("UPDATE comments SET rejected = ?, resolved = 0 WHERE id = ?").run(rejected ? 1 : 0, cid);
  if (annotation !== undefined)
    db.prepare("UPDATE comments SET annotation = ? WHERE id = ?").run(annotation || null, cid);
  return { comment: db.prepare("SELECT * FROM comments WHERE id = ?").get(cid) };
});

app.delete("/api/comments/:cid", async (req) => {
  const { cid } = req.params as any;
  db.prepare("DELETE FROM comments WHERE id = ?").run(cid);
  return { ok: true };
});

// ── TRAINING DATA ─────────────────────────────────────────────────────────────
app.get("/api/training-data", async () => {
  const signals = db
    .prepare(
      `SELECT c.id, c.brief_id, c.user_name, c.text, c.section,
              c.resolved, c.rejected, c.annotation, c.created_at,
              b.title as brief_title, b.brand_name, b.metadata
       FROM comments c
       JOIN briefs b ON b.id = c.brief_id
       WHERE c.source = 'runneth' AND (c.resolved = 1 OR c.rejected = 1)
       ORDER BY c.created_at ASC`
    )
    .all();

  const humanComments = db
    .prepare(
      `SELECT c.id, c.brief_id, c.user_name, c.text, c.section, c.created_at,
              b.title as brief_title, b.brand_name
       FROM comments c
       JOIN briefs b ON b.id = c.brief_id
       WHERE c.source = 'human'
       ORDER BY c.created_at ASC`
    )
    .all();

  const r = (sql: string) => (db.prepare(sql).get() as any).n;
  const stats = {
    total_runneth:    r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth'`),
    accepted:         r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND resolved=1`),
    rejected:         r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND rejected=1`),
    unreviewed:       r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND resolved=0 AND rejected=0`),
    annotated:        r(`SELECT COUNT(*) as n FROM comments WHERE source='runneth' AND annotation IS NOT NULL`),
    human_comments:   r(`SELECT COUNT(*) as n FROM comments WHERE source='human'`),
    briefs_reviewed:  r(`SELECT COUNT(DISTINCT brief_id) as n FROM comments WHERE source='human'`),
  };

  return { stats, signals, human_comments: humanComments };
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
  return (["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"] as InjectMethod[]).includes(
    u as InjectMethod
  )
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
