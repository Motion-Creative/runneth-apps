"""Low-level store primitives: open the DB, load sqlite-vec, ensure schema."""
from __future__ import annotations

import os
import sqlite3
import sys
from pathlib import Path

# Resolve the tool dir from this file's location so the module is relocatable.
TOOL_DIR = Path(__file__).resolve().parent.parent
DB_PATH = TOOL_DIR / "corpus.db"
PKGS_DIR = TOOL_DIR / "pkgs"
SCHEMA_PATH = TOOL_DIR / "lib" / "schema.sql"

if str(PKGS_DIR) not in sys.path:
    sys.path.insert(0, str(PKGS_DIR))

import sqlite_vec  # noqa: E402


def connect(db_path: Path = DB_PATH) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(db_path))
    con.row_factory = sqlite3.Row
    con.enable_load_extension(True)
    sqlite_vec.load(con)
    con.enable_load_extension(False)
    _apply_schema(con)
    return con


def _apply_schema(con: sqlite3.Connection) -> None:
    sql = SCHEMA_PATH.read_text()
    con.executescript(sql)
    con.commit()


def ensure_vec_table(con: sqlite3.Connection, dim: int, model: str) -> None:
    row = con.execute("SELECT embed_dim, embed_model FROM embed_config WHERE id = 1").fetchone()
    if row is None:
        con.execute(
            "INSERT INTO embed_config(id, embed_model, embed_dim, set_at) "
            "VALUES (1, ?, ?, datetime('now'))",
            (model, dim),
        )
    elif row["embed_dim"] != dim:
        raise RuntimeError(
            f"embedding dim mismatch: store is {row['embed_dim']}, request is {dim}. "
            f"either revert config to dim={row['embed_dim']}, or drop chunk_vec + "
            f"reset embed_config and re-embed."
        )

    con.execute(
        f"CREATE VIRTUAL TABLE IF NOT EXISTS chunk_vec USING vec0(embedding float[{dim}])"
    )
    con.commit()


def vec_table_exists(con: sqlite3.Connection) -> bool:
    row = con.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='chunk_vec'"
    ).fetchone()
    return row is not None


def db_stats(con: sqlite3.Connection) -> dict:
    out = {"db_path": str(DB_PATH), "db_size_mb": 0.0}
    if DB_PATH.exists():
        out["db_size_mb"] = round(DB_PATH.stat().st_size / 1024 / 1024, 1)
    out["assets_total"] = con.execute("SELECT count(*) FROM asset").fetchone()[0]
    out["chunks_total"] = con.execute("SELECT count(*) FROM chunk").fetchone()[0]
    out["chunks_embedded"] = con.execute(
        "SELECT count(*) FROM chunk WHERE embedded_at IS NOT NULL"
    ).fetchone()[0]
    out["per_kind"] = {
        row["kind"]: row["n"]
        for row in con.execute("SELECT kind, count(*) AS n FROM asset GROUP BY kind")
    }
    cfg = con.execute("SELECT embed_model, embed_dim FROM embed_config WHERE id = 1").fetchone()
    out["embed_model"] = cfg["embed_model"] if cfg else None
    out["embed_dim"] = cfg["embed_dim"] if cfg else None
    out["vec_table"] = vec_table_exists(con)
    return out


def log_query(con, *, query_text: str, kind_filter: str | None,
              role_filter: str | None, top_k: int, timings: dict,
              result_chunk_ids: list[int]) -> None:
    """Append one row to query_log for future eval / debugging."""
    import json
    con.execute(
        "INSERT INTO query_log(asked_at, query_text, kind_filter, role_filter, top_k, "
        "bm25_ms, vec_ms, rerank_ms, total_ms, result_chunk_ids) "
        "VALUES (datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            query_text, kind_filter, role_filter, top_k,
            timings.get("bm25_ms"), timings.get("vec_ms"),
            timings.get("rerank_ms"), timings.get("total_ms"),
            json.dumps(result_chunk_ids),
        ),
    )
    con.commit()


def secret_probe(auth_env: str = "OPENAI_API_KEY") -> tuple[bool, str]:
    """Return (ok, message). True iff secure-fetch can use the secret against OpenAI."""
    import subprocess
    import tempfile
    with tempfile.NamedTemporaryFile("w+b", delete=False, suffix=".probe.json") as tf:
        out_path = tf.name
    try:
        with open(out_path, "wb") as fh:
            rc = subprocess.run(
                [
                    "secure-fetch", "run",
                    "--url", "https://api.openai.com/v1/models",
                    "--secret-key", auth_env,
                    "--timeout-ms", "10000",
                    "--max-response-bytes", "100000",
                ],
                stdout=fh, stderr=subprocess.PIPE,
                timeout=20,
            ).returncode
        with open(out_path) as f:
            raw = f.read(2000)
    except Exception as e:
        return False, f"probe failed: {e}"
    finally:
        try:
            os.unlink(out_path)
        except OSError:
            pass

    if rc != 0:
        return False, f"secure-fetch exit={rc}: {raw[:300]}"
    if '"successful": true' in raw and '"status": 200' in raw:
        return True, "ok"
    if '"status": 401' in raw or '"status": 403' in raw:
        return False, "secret rejected by OpenAI (401/403)"
    return False, f"unexpected probe response: {raw[:300]}"
