from __future__ import annotations

import importlib.metadata
import sqlite3
import struct
from pathlib import Path
from typing import Iterable

from .constants import DB_SCHEMA_VERSION, EMBED_DIM, EMBED_MODEL, SQLITE_VEC_VERSION
from .errors import CorpusSearchError
from .paths import WorkspacePaths


SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def connect(paths: WorkspacePaths, *, create: bool = True) -> sqlite3.Connection:
    if create:
        paths.root.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(paths.db)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 5000")
    connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
    version = connection.execute(
        "SELECT schema_version FROM schema_meta WHERE id = 1"
    ).fetchone()[0]
    if version != DB_SCHEMA_VERSION:
        connection.close()
        raise CorpusSearchError(
            f"unsupported corpus database schema {version}",
            code="unsupported_schema",
        )
    return connection


def sqlite_vec_installed_version() -> str | None:
    try:
        return importlib.metadata.version("sqlite-vec")
    except importlib.metadata.PackageNotFoundError:
        return None


def load_sqlite_vec(connection: sqlite3.Connection) -> str:
    try:
        import sqlite_vec  # type: ignore
    except ImportError as exc:
        raise CorpusSearchError(
            "sqlite-vec is not installed; lexical search remains available",
            code="sqlite_vec_missing",
            exit_code=4,
        ) from exc
    if not hasattr(connection, "enable_load_extension"):
        raise CorpusSearchError(
            "this Python SQLite build does not support extension loading; lexical search remains available",
            code="sqlite_extension_loading_unavailable",
            exit_code=4,
        )
    connection.enable_load_extension(True)
    try:
        sqlite_vec.load(connection)
    finally:
        connection.enable_load_extension(False)
    row = connection.execute("SELECT vec_version()").fetchone()
    return str(row[0]) if row else SQLITE_VEC_VERSION


def vec_table_exists(connection: sqlite3.Connection) -> bool:
    return (
        connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='chunk_vec'"
        ).fetchone()
        is not None
    )


def ensure_vec_table(
    connection: sqlite3.Connection,
    *,
    model: str = EMBED_MODEL,
    dimensions: int = EMBED_DIM,
) -> str:
    version = load_sqlite_vec(connection)
    configured = connection.execute(
        "SELECT model, dimensions FROM embedding_config WHERE id = 1"
    ).fetchone()
    if configured is not None and (
        configured["model"] != model or configured["dimensions"] != dimensions
    ):
        raise CorpusSearchError(
            "embedding model or dimension differs from the existing store; run embeddings rebuild --yes",
            code="embedding_config_mismatch",
            exit_code=4,
            details={
                "storedModel": configured["model"],
                "storedDimensions": configured["dimensions"],
                "requestedModel": model,
                "requestedDimensions": dimensions,
            },
        )
    connection.execute(
        "INSERT INTO embedding_config(id, model, dimensions) VALUES (1, ?, ?) "
        "ON CONFLICT(id) DO NOTHING",
        (model, dimensions),
    )
    connection.execute(
        f"CREATE VIRTUAL TABLE IF NOT EXISTS chunk_vec USING vec0(embedding float[{dimensions}])"
    )
    connection.commit()
    return version


def vector_blob(values: Iterable[float]) -> bytes:
    vector = list(values)
    return struct.pack(f"<{len(vector)}f", *vector)


def delete_vectors_for_chunks(
    connection: sqlite3.Connection, chunk_ids: Iterable[int]
) -> None:
    ids = list(chunk_ids)
    if not ids or not vec_table_exists(connection):
        return
    load_sqlite_vec(connection)
    connection.executemany("DELETE FROM chunk_vec WHERE rowid = ?", ((item,) for item in ids))


def rebuild_embeddings(connection: sqlite3.Connection) -> dict[str, int | str]:
    load_sqlite_vec(connection)
    if vec_table_exists(connection):
        connection.execute("DROP TABLE chunk_vec")
    connection.execute("DELETE FROM embedding_config")
    changed = connection.execute(
        "UPDATE chunk SET embedded_at = NULL, embed_model = NULL, embed_dim = NULL"
    ).rowcount
    connection.commit()
    ensure_vec_table(connection)
    return {"chunksReset": changed, "model": EMBED_MODEL, "dimensions": EMBED_DIM}


def stats(connection: sqlite3.Connection, paths: WorkspacePaths) -> dict[str, object]:
    sources = connection.execute(
        "SELECT count(*) AS total, "
        "sum(CASE WHEN enabled=1 THEN 1 ELSE 0 END) AS enabled, "
        "sum(CASE WHEN enabled=1 AND (last_refresh_status IS NULL OR last_refresh_status!='ok') "
        "THEN 1 ELSE 0 END) AS pending FROM source"
    ).fetchone()
    chunks = connection.execute(
        "SELECT count(*) AS total, sum(CASE WHEN embedded_at IS NOT NULL THEN 1 ELSE 0 END) AS embedded FROM chunk"
    ).fetchone()
    enabled_chunks = connection.execute(
        "SELECT count(*) AS total, "
        "sum(CASE WHEN c.embedded_at IS NOT NULL THEN 1 ELSE 0 END) AS embedded "
        "FROM chunk c JOIN asset a ON a.asset_id=c.asset_id "
        "JOIN source s ON s.source_id=a.source_id WHERE s.enabled=1"
    ).fetchone()
    per_kind = {
        row["kind"]: row["count"]
        for row in connection.execute(
            "SELECT s.kind, count(a.asset_id) AS count FROM source s "
            "LEFT JOIN asset a ON a.source_id=s.source_id GROUP BY s.kind ORDER BY s.kind"
        )
    }
    return {
        "workspaceId": paths.workspace_id,
        "dbPath": str(paths.db),
        "dbSizeBytes": paths.db.stat().st_size if paths.db.exists() else 0,
        "sourcesTotal": int(sources["total"] or 0),
        "sourcesEnabled": int(sources["enabled"] or 0),
        "sourcesPendingRefresh": int(sources["pending"] or 0),
        "assetsTotal": int(connection.execute("SELECT count(*) FROM asset").fetchone()[0]),
        "chunksTotal": int(chunks["total"] or 0),
        "chunksEmbedded": int(chunks["embedded"] or 0),
        "enabledChunksTotal": int(enabled_chunks["total"] or 0),
        "enabledChunksEmbedded": int(enabled_chunks["embedded"] or 0),
        "vectorTable": vec_table_exists(connection),
        "sqliteVecInstalledVersion": sqlite_vec_installed_version(),
        "perKind": per_kind,
    }
