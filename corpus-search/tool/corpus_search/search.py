from __future__ import annotations

import json
import sqlite3
import time
from typing import Any, Sequence

from .constants import DEFAULT_CANDIDATE_POOL, DEFAULT_RRF_K, RERANK_POOL
from .errors import CorpusSearchError, SecureFetchError
from .markdown_ingest import SAFE_META_KEY_RE
from .paths import WorkspacePaths
from .semantic import embed_texts, rerank
from .store import load_sqlite_vec, vec_table_exists, vector_blob


def _fts_query(value: str) -> str | None:
    tokens = re_tokens(value)
    if not tokens:
        return None
    return " OR ".join(f'"{token}"' for token in tokens)


def re_tokens(value: str) -> list[str]:
    cleaned = "".join(character if character.isalnum() or character in "_-'" else " " for character in value)
    return [token.replace('"', "") for token in cleaned.split() if token]


def _filters(
    *,
    kind: str | None,
    source: str | None,
    role: str | None,
    user: str | None,
    since: str | None,
    until: str | None,
    metadata: Sequence[tuple[str, Any]],
) -> tuple[str, list[Any]]:
    clauses = ["s.enabled=1"]
    params: list[Any] = []
    for column, value in (
        ("s.kind", kind),
        ("s.name", source),
        ("c.role", role),
        ("a.user_name", user),
    ):
        if value is not None:
            clauses.append(f"{column}=?")
            params.append(value)
    if since is not None:
        clauses.append("a.event_at>=?")
        params.append(since)
    if until is not None:
        clauses.append("a.event_at<=?")
        params.append(until)
    for key, value in metadata:
        if not SAFE_META_KEY_RE.fullmatch(key):
            raise CorpusSearchError(
                f"invalid metadata key: {key}", code="invalid_metadata_filter", exit_code=2
            )
        path = f'$."{key}"'
        if value is None:
            clauses.append("json_type(a.metadata_json, ?)='null'")
            params.append(path)
        else:
            clauses.append("json_extract(a.metadata_json, ?)=?")
            params.extend((path, value))
    return " AND ".join(clauses), params


def _bm25(connection, query: str, limit: int, filters_sql: str, filters_params: Sequence[Any]):
    match = _fts_query(query)
    if match is None:
        return []
    return connection.execute(
        "SELECT c.chunk_id, bm25(chunk_fts) AS bm25_score "
        "FROM chunk_fts JOIN chunk c ON c.chunk_id=chunk_fts.rowid "
        "JOIN asset a ON a.asset_id=c.asset_id JOIN source s ON s.source_id=a.source_id "
        f"WHERE chunk_fts MATCH ? AND {filters_sql} ORDER BY bm25_score LIMIT ?",
        (match, *filters_params, limit),
    ).fetchall()


def _vector(connection, query_vector: Sequence[float], limit: int, filters_sql: str, filters_params: Sequence[Any]):
    # sqlite-vec applies an IN constraint on the vec0 rowid before scoring.
    # Keeping the relational filters in this subquery prevents disabled or
    # out-of-scope vectors from consuming the KNN limit ahead of valid hits.
    return connection.execute(
        "SELECT rowid AS chunk_id, distance FROM chunk_vec "
        "WHERE embedding MATCH ? AND k=? AND rowid IN ("
        "SELECT c.chunk_id FROM chunk c JOIN asset a ON a.asset_id=c.asset_id "
        "JOIN source s ON s.source_id=a.source_id "
        f"WHERE {filters_sql}) ORDER BY distance",
        (vector_blob(query_vector), limit, *filters_params),
    ).fetchall()


def _fuse(bm25_rows, vector_rows) -> list[dict[str, Any]]:
    fused: dict[int, dict[str, Any]] = {}
    for rank, row in enumerate(bm25_rows, 1):
        chunk_id = int(row["chunk_id"])
        entry = fused.setdefault(
            chunk_id,
            {"chunkId": chunk_id, "score": 0.0, "bm25Rank": None, "vectorRank": None, "bm25Score": None, "vectorDistance": None},
        )
        entry["bm25Rank"] = rank
        entry["bm25Score"] = row["bm25_score"]
        entry["score"] += 1.0 / (DEFAULT_RRF_K + rank)
    for rank, row in enumerate(vector_rows, 1):
        chunk_id = int(row["chunk_id"])
        entry = fused.setdefault(
            chunk_id,
            {"chunkId": chunk_id, "score": 0.0, "bm25Rank": None, "vectorRank": None, "bm25Score": None, "vectorDistance": None},
        )
        entry["vectorRank"] = rank
        entry["vectorDistance"] = row["distance"]
        entry["score"] += 1.0 / (DEFAULT_RRF_K + rank)
    return sorted(fused.values(), key=lambda item: item["score"], reverse=True)


def _hydrate(connection, ranked: Sequence[dict[str, Any]]) -> list[dict[str, Any]]:
    if not ranked:
        return []
    by_id = {int(item["chunkId"]): item for item in ranked}
    ids = list(by_id)
    placeholders = ",".join("?" for _ in ids)
    rows = connection.execute(
        "SELECT c.chunk_id, c.role, c.heading, c.t_start_s, c.t_end_s, c.text, "
        "a.asset_id, a.title, a.event_at, a.user_name, a.raw_path, a.relative_path, a.metadata_json, "
        "s.name AS source_name, s.kind "
        "FROM chunk c JOIN asset a ON a.asset_id=c.asset_id JOIN source s ON s.source_id=a.source_id "
        f"WHERE c.chunk_id IN ({placeholders})",
        ids,
    ).fetchall()
    hydrated: dict[int, dict[str, Any]] = {}
    for row in rows:
        rank = by_id[int(row["chunk_id"])]
        text = str(row["text"])
        hydrated[int(row["chunk_id"])] = {
            **rank,
            "score": round(float(rank["score"]), 8),
            "assetId": int(row["asset_id"]),
            "title": row["title"],
            "kind": row["kind"],
            "source": row["source_name"],
            "relativePath": row["relative_path"],
            "rawPath": row["raw_path"],
            "eventAt": row["event_at"],
            "user": row["user_name"],
            "role": row["role"],
            "heading": row["heading"],
            "tStartS": row["t_start_s"],
            "tEndS": row["t_end_s"],
            "text": text,
            "snippet": text.replace("\n", " ")[:500],
            "metadata": json.loads(row["metadata_json"] or "{}"),
        }
    return [hydrated[int(item["chunkId"])] for item in ranked if int(item["chunkId"]) in hydrated]


def search(
    connection,
    paths: WorkspacePaths,
    query: str,
    *,
    top_k: int,
    kind: str | None = None,
    source: str | None = None,
    role: str | None = None,
    user: str | None = None,
    since: str | None = None,
    until: str | None = None,
    metadata: Sequence[tuple[str, Any]] = (),
    mode: str = "auto",
    rerank_mode: str = "auto",
) -> dict[str, Any]:
    started = time.monotonic()
    filters_sql, filter_params = _filters(
        kind=kind,
        source=source,
        role=role,
        user=user,
        since=since,
        until=until,
        metadata=metadata,
    )
    timing: dict[str, float] = {}
    tick = time.monotonic()
    bm25_rows = _bm25(connection, query, DEFAULT_CANDIDATE_POOL, filters_sql, filter_params)
    timing["bm25Ms"] = round((time.monotonic() - tick) * 1000, 1)

    vector_rows = []
    degraded: list[dict[str, str]] = []
    semantic_available = False
    coverage = connection.execute(
        "SELECT count(*) AS total, "
        "sum(CASE WHEN c.embedded_at IS NOT NULL THEN 1 ELSE 0 END) AS embedded "
        "FROM chunk c JOIN asset a ON a.asset_id=c.asset_id "
        "JOIN source s ON s.source_id=a.source_id WHERE s.enabled=1"
    ).fetchone()
    enabled_chunks = int(coverage["total"] or 0)
    embedded_chunks = int(coverage["embedded"] or 0)
    if mode != "lexical":
        tick = time.monotonic()
        try:
            if not vec_table_exists(connection):
                raise CorpusSearchError("vector index has not been created", code="vector_index_missing", exit_code=4)
            if enabled_chunks == 0:
                raise CorpusSearchError("no chunks have embeddings yet", code="embeddings_missing", exit_code=4)
            if embedded_chunks != enabled_chunks:
                raise CorpusSearchError(
                    "embedding backfill is incomplete; lexical search remains available",
                    code="embedding_backfill_incomplete",
                    exit_code=4,
                )
            load_sqlite_vec(connection)
            query_vector = embed_texts(paths, [query])[0]
            vector_rows = _vector(
                connection, query_vector, DEFAULT_CANDIDATE_POOL, filters_sql, filter_params
            )
            semantic_available = True
        except (CorpusSearchError, SecureFetchError, sqlite3.Error) as exc:
            code = exc.code if isinstance(exc, CorpusSearchError) else "vector_query_failed"
            message = exc.message if isinstance(exc, CorpusSearchError) else "vector query failed"
            degraded.append({"code": code, "message": message})
        timing["vectorMs"] = round((time.monotonic() - tick) * 1000, 1)

    ranked = _fuse(bm25_rows, vector_rows)
    pre_rerank_limit = max(top_k, RERANK_POOL if rerank_mode != "off" else top_k)
    hits = _hydrate(connection, ranked[:pre_rerank_limit])
    used_rerank = False
    should_rerank = rerank_mode == "on" or (rerank_mode == "auto" and semantic_available)
    if should_rerank and hits:
        tick = time.monotonic()
        hits, outcome = rerank(paths, query, hits, top_k=top_k)
        timing["rerankMs"] = round((time.monotonic() - tick) * 1000, 1)
        used_rerank = outcome.used
        if not outcome.used and outcome.error_code:
            degraded.append({"code": outcome.error_code, "message": outcome.error_message or "rerank failed"})
    else:
        hits = hits[:top_k]

    if semantic_available and used_rerank:
        effective_mode = "hybrid_reranked"
    elif semantic_available:
        effective_mode = "hybrid"
    elif used_rerank:
        effective_mode = "bm25_reranked"
    else:
        effective_mode = "bm25"
    timing["totalMs"] = round((time.monotonic() - started) * 1000, 1)
    return {
        "workspaceId": paths.workspace_id,
        "query": query,
        "requestedMode": mode,
        "effectiveMode": effective_mode,
        "degraded": bool(degraded),
        "degradedReasons": degraded,
        "semanticCoverage": {
            "enabledChunks": enabled_chunks,
            "embeddedChunks": embedded_chunks,
            "complete": enabled_chunks > 0 and embedded_chunks == enabled_chunks,
        },
        "timings": timing,
        "hits": hits,
    }
