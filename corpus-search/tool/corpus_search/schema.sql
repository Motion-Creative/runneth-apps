PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  schema_version INTEGER NOT NULL
);

INSERT INTO schema_meta(id, schema_version) VALUES (1, 1)
ON CONFLICT(id) DO NOTHING;

CREATE TABLE IF NOT EXISTS source (
  source_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  root_path TEXT NOT NULL,
  kind TEXT NOT NULL,
  pattern TEXT NOT NULL DEFAULT '**/*.md',
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_refresh_at TEXT,
  last_refresh_status TEXT
);

CREATE TABLE IF NOT EXISTS source_refresh_progress (
  source_id INTEGER PRIMARY KEY REFERENCES source(source_id) ON DELETE CASCADE,
  file_list_hash TEXT NOT NULL,
  last_path TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset (
  asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL REFERENCES source(source_id) ON DELETE CASCADE,
  relative_path TEXT NOT NULL,
  raw_path TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  title TEXT,
  event_at TEXT,
  user_name TEXT,
  document_role TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  indexed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_id, relative_path)
);

CREATE TABLE IF NOT EXISTS chunk (
  chunk_id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL REFERENCES asset(asset_id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  heading TEXT,
  role TEXT,
  t_start_s REAL,
  t_end_s REAL,
  text TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  embedded_at TEXT,
  embed_model TEXT,
  embed_dim INTEGER,
  UNIQUE(asset_id, chunk_index)
);

CREATE VIRTUAL TABLE IF NOT EXISTS chunk_fts USING fts5(
  text,
  content='chunk',
  content_rowid='chunk_id',
  tokenize='unicode61'
);

CREATE TRIGGER IF NOT EXISTS chunk_ai AFTER INSERT ON chunk BEGIN
  INSERT INTO chunk_fts(rowid, text) VALUES (new.chunk_id, new.text);
END;

CREATE TRIGGER IF NOT EXISTS chunk_ad AFTER DELETE ON chunk BEGIN
  INSERT INTO chunk_fts(chunk_fts, rowid, text) VALUES ('delete', old.chunk_id, old.text);
END;

CREATE TRIGGER IF NOT EXISTS chunk_au AFTER UPDATE OF text ON chunk BEGIN
  INSERT INTO chunk_fts(chunk_fts, rowid, text) VALUES ('delete', old.chunk_id, old.text);
  INSERT INTO chunk_fts(rowid, text) VALUES (new.chunk_id, new.text);
END;

CREATE TABLE IF NOT EXISTS embedding_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  model TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  configured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS asset_source_idx ON asset(source_id);
CREATE INDEX IF NOT EXISTS asset_event_idx ON asset(event_at);
CREATE INDEX IF NOT EXISTS chunk_asset_idx ON chunk(asset_id);
CREATE INDEX IF NOT EXISTS chunk_role_idx ON chunk(role);
CREATE INDEX IF NOT EXISTS chunk_embedded_idx ON chunk(embedded_at);
