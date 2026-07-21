-- corpus-search: unified hybrid retrieval store
-- Single SQLite database for all corpus kinds:
--   runneth-conv, gong-call, video, image, markdown-doc
--
-- Conventions:
--   asset.kind   = corpus type discriminator
--   chunk.role   = 'user' | 'assistant' | 'speaker:<name>' | NULL
--   t_start_s    = float seconds, used by video/audio scenes
--   tenant_id    = workspace_id by default; '_org_' for org-wide
--
-- All embeddings are float32. Dimension is set at first index time and
-- stored on every chunk for forward-compat (model swaps, multi-model).

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456;

CREATE TABLE IF NOT EXISTS asset (
    asset_id      INTEGER PRIMARY KEY,
    kind          TEXT NOT NULL,           -- runneth-conv | gong-call | video | image | markdown-doc
    source_id     TEXT NOT NULL,           -- conv UUID, gong call id, file path, etc.
    tenant_id     TEXT,                    -- workspace_id or '_org_'
    title         TEXT,
    user_email    TEXT,                    -- conversation user / call owner
    org           TEXT,
    workspace     TEXT,
    brand         TEXT,
    event_at      TEXT,                    -- ISO8601 day or timestamp
    duration_s    REAL,                    -- video/audio
    raw_path      TEXT,                    -- on-disk path of the source file
    extra_json    TEXT,                    -- arbitrary per-kind metadata
    indexed_at    TEXT NOT NULL,           -- ISO8601 of last successful ingest
    UNIQUE (kind, source_id)
);

CREATE INDEX IF NOT EXISTS asset_kind_idx       ON asset(kind);
CREATE INDEX IF NOT EXISTS asset_tenant_idx     ON asset(tenant_id);
CREATE INDEX IF NOT EXISTS asset_event_at_idx   ON asset(event_at);

CREATE TABLE IF NOT EXISTS chunk (
    chunk_id      INTEGER PRIMARY KEY,
    asset_id      INTEGER NOT NULL REFERENCES asset(asset_id) ON DELETE CASCADE,
    chunk_idx     INTEGER NOT NULL,        -- order within the asset
    role          TEXT,                    -- user | assistant | speaker:<name> | NULL
    speaker       TEXT,                    -- gong/video specific speaker label
    t_start_s     REAL,
    t_end_s       REAL,
    text          TEXT NOT NULL,
    text_hash     TEXT NOT NULL,           -- sha1 of text, used for dedupe + change detection
    extra_json    TEXT,
    embed_model   TEXT,                    -- e.g. 'text-embedding-3-small'
    embed_dim     INTEGER,
    embedded_at   TEXT
);

CREATE INDEX IF NOT EXISTS chunk_asset_idx      ON chunk(asset_id);
CREATE INDEX IF NOT EXISTS chunk_role_idx       ON chunk(role);
CREATE INDEX IF NOT EXISTS chunk_hash_idx       ON chunk(text_hash);
CREATE INDEX IF NOT EXISTS chunk_embedded_idx   ON chunk(embed_model, embedded_at);

-- FTS5 full-text index over chunk.text for BM25.
-- External-content table keeps storage tight; chunk.text is the source of truth.
CREATE VIRTUAL TABLE IF NOT EXISTS chunk_fts
USING fts5(
    text,
    content='chunk',
    content_rowid='chunk_id',
    tokenize='porter unicode61 remove_diacritics 2'
);

-- Keep FTS in sync with chunk.
CREATE TRIGGER IF NOT EXISTS chunk_ai AFTER INSERT ON chunk BEGIN
    INSERT INTO chunk_fts(rowid, text) VALUES (new.chunk_id, new.text);
END;
CREATE TRIGGER IF NOT EXISTS chunk_ad AFTER DELETE ON chunk BEGIN
    INSERT INTO chunk_fts(chunk_fts, rowid, text) VALUES('delete', old.chunk_id, old.text);
END;
CREATE TRIGGER IF NOT EXISTS chunk_au AFTER UPDATE ON chunk BEGIN
    INSERT INTO chunk_fts(chunk_fts, rowid, text) VALUES('delete', old.chunk_id, old.text);
    INSERT INTO chunk_fts(rowid, text) VALUES (new.chunk_id, new.text);
END;

-- sqlite-vec virtual table for KNN. Created at runtime once embedding
-- dimension is known (depends on chosen embedding model).

-- Bookkeeping for the model in use; lets us refuse to mix dimensions.
CREATE TABLE IF NOT EXISTS embed_config (
    id             INTEGER PRIMARY KEY CHECK (id = 1),
    embed_model    TEXT NOT NULL,
    embed_dim      INTEGER NOT NULL,
    set_at         TEXT NOT NULL
);

-- Captured queries for future eval / regression testing.
CREATE TABLE IF NOT EXISTS query_log (
    id             INTEGER PRIMARY KEY,
    asked_at       TEXT NOT NULL,
    query_text     TEXT NOT NULL,
    kind_filter    TEXT,
    role_filter    TEXT,
    top_k          INTEGER,
    bm25_ms        REAL,
    vec_ms         REAL,
    rerank_ms      REAL,
    total_ms       REAL,
    result_chunk_ids TEXT      -- JSON array of returned chunk_ids in order
);
