"""Hybrid retrieval: BM25 (FTS5) + vector (sqlite-vec) fused with RRF."""
from __future__ import annotations

import json
import sqlite3
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Sequence

from lib import embed as embed_mod
from lib import config as config_mod
from lib import rerank as rerank_mod

TOOL_DIR = Path(__file__).resolve().parent.parent
_CFG = config_mod.load(TOOL_DIR)["search"]
DEFAULT_POOL = _CFG["candidate_pool"]
DEFAULT_RRF_K = _CFG["rrf_k"]
DEFAULT_TOP_K = _CFG["top_k_default"]


@dataclass
class SearchHit:
    chunk_id: int
    asset_id: int
    score: float
    bm25_rank: int | None
    vec_rank: int | None
    bm25_score: float | None
    vec_distance: float | None
    role: str | None
    text: str
    asset_kind: str
    asset_title: str | None
    asset_user: str | None
    asset_workspace: str | None
    asset_event_at: str | None
    asset_source_id: str | None
    asset_raw_path: str | None
    t_start_s: float | None
    t_end_s: float | None
    extra: dict = field(default_factory=dict)


def _build_filters(kind, role, workspace, user, since, until) -> tuple[str, list[Any]]:
    where, params = [], []
    if kind: where.append("a.kind = ?"); params.append(kind)
    if role: where.append("c.role = ?"); params.append(role)
    if workspace: where.append("a.workspace = ?"); params.append(workspace)
    if user: where.append("a.user_email = ?"); params.append(user)
    if since: where.append("a.event_at >= ?"); params.append(since)
    if until: where.append("a.event_at <= ?"); params.append(until)
    return (" AND ".join(where) if where else "1=1"), params


def _bm25_search(con, query, k, filters_sql, filters_params):
    sql = f"""
        SELECT c.chunk_id, c.asset_id, c.role, c.text, c.t_start_s, c.t_end_s, f.rank AS bm25_score
        FROM chunk_fts f
        JOIN chunk c ON c.chunk_id = f.rowid
        JOIN asset a ON a.asset_id = c.asset_id
        WHERE f.text MATCH ? AND {filters_sql}
        ORDER BY f.rank LIMIT ?
    """
    return [dict(r) for r in con.execute(sql, (query, *filters_params, k)).fetchall()]


def _vec_search(con, qvec, k, filters_sql, filters_params):
    qblob = embed_mod.to_blob(qvec)
    fetch = max(k * 5, 200)
    base = con.execute(
        "SELECT rowid AS chunk_id, distance FROM chunk_vec WHERE embedding MATCH ? AND k = ? ORDER BY distance",
        (qblob, fetch),
    ).fetchall()
    if not base: return []
    ids = [r["chunk_id"] for r in base]
    placeholders = ",".join("?" * len(ids))
    sql = f"""
        SELECT c.chunk_id, c.asset_id, c.role, c.text, c.t_start_s, c.t_end_s
        FROM chunk c JOIN asset a ON a.asset_id = c.asset_id
        WHERE c.chunk_id IN ({placeholders}) AND {filters_sql}
    """
    meta = {row["chunk_id"]: dict(row) for row in con.execute(sql, (*ids, *filters_params)).fetchall()}
    out = []
    for row in base:
        cid = row["chunk_id"]
        if cid in meta:
            entry = meta[cid]; entry["distance"] = row["distance"]; out.append(entry)
        if len(out) >= k: break
    return out


def _rrf_fuse(bm25_hits, vec_hits, k_rrf=DEFAULT_RRF_K):
    fused: dict[int, dict] = {}
    for rank, h in enumerate(bm25_hits, 1):
        cid = h["chunk_id"]
        e = fused.setdefault(cid, {
            "chunk_id": cid, "asset_id": h["asset_id"], "role": h.get("role"),
            "text": h["text"], "t_start_s": h.get("t_start_s"), "t_end_s": h.get("t_end_s"),
            "bm25_rank": None, "vec_rank": None, "bm25_score": None, "vec_distance": None,
            "fused": 0.0,
        })
        e["bm25_rank"] = rank; e["bm25_score"] = h.get("bm25_score")
        e["fused"] += 1.0 / (k_rrf + rank)
    for rank, h in enumerate(vec_hits, 1):
        cid = h["chunk_id"]
        e = fused.setdefault(cid, {
            "chunk_id": cid, "asset_id": h["asset_id"], "role": h.get("role"),
            "text": h["text"], "t_start_s": h.get("t_start_s"), "t_end_s": h.get("t_end_s"),
            "bm25_rank": None, "vec_rank": None, "bm25_score": None, "vec_distance": None,
            "fused": 0.0,
        })
        e["vec_rank"] = rank; e["vec_distance"] = h.get("distance")
        e["fused"] += 1.0 / (k_rrf + rank)
    return fused


def _hydrate_asset(con, asset_ids):
    if not asset_ids: return {}
    placeholders = ",".join("?" * len(asset_ids))
    rows = con.execute(
        f"SELECT asset_id, kind, title, user_email, workspace, event_at, source_id, raw_path "
        f"FROM asset WHERE asset_id IN ({placeholders})",
        list(asset_ids),
    ).fetchall()
    return {r["asset_id"]: r for r in rows}


def search(con, query_text, *, top_k=None, kind=None, role=None, workspace=None,
           user=None, since=None, until=None, use_vector=True,
           candidate_pool=None, use_rerank=False, rerank_pool=None,
           rerank_top_k=None) -> tuple[list[SearchHit], dict]:
    top_k = top_k or DEFAULT_TOP_K
    candidate_pool = candidate_pool or DEFAULT_POOL
    timings: dict[str, Any] = {"bm25_ms": 0.0, "vec_ms": 0.0, "embed_ms": 0.0, "fuse_ms": 0.0, "rerank_ms": 0.0}
    filters_sql, filters_params = _build_filters(kind, role, workspace, user, since, until)

    t0 = time.time()
    bm25_query = _to_fts_match(query_text)
    bm25_hits = _bm25_search(con, bm25_query, candidate_pool, filters_sql, filters_params)
    timings["bm25_ms"] = round((time.time() - t0) * 1000, 1)

    vec_hits = []
    if use_vector:
        t0 = time.time()
        try:
            qvec = embed_mod.embed_batch([query_text])[0]
            timings["embed_ms"] = round((time.time() - t0) * 1000, 1)
        except Exception as e:
            timings["embed_error"] = str(e); qvec = None

        if qvec is not None:
            t0 = time.time()
            try:
                vec_hits = _vec_search(con, qvec, candidate_pool, filters_sql, filters_params)
            except sqlite3.OperationalError as e:
                timings["vec_error"] = str(e)
            timings["vec_ms"] = round((time.time() - t0) * 1000, 1)

    t0 = time.time()
    fused = _rrf_fuse(bm25_hits, vec_hits)
    # When rerank is on, fetch a larger ranked window so the reranker has
    # something to choose from. The final returned slice still respects top_k.
    pre_rerank_k = max(top_k, rerank_pool or 0) if use_rerank else top_k
    ranked = sorted(fused.values(), key=lambda x: x["fused"], reverse=True)[:pre_rerank_k]
    timings["fuse_ms"] = round((time.time() - t0) * 1000, 1)

    assets = _hydrate_asset(con, [r["asset_id"] for r in ranked])
    hits: list[SearchHit] = []
    for r in ranked:
        a = assets.get(r["asset_id"])
        hits.append(SearchHit(
            chunk_id=r["chunk_id"], asset_id=r["asset_id"],
            score=round(r["fused"], 6),
            bm25_rank=r["bm25_rank"], vec_rank=r["vec_rank"],
            bm25_score=r["bm25_score"], vec_distance=r["vec_distance"],
            role=r["role"], text=r["text"],
            t_start_s=r.get("t_start_s"), t_end_s=r.get("t_end_s"),
            asset_kind=a["kind"] if a else "",
            asset_title=a["title"] if a else None,
            asset_user=a["user_email"] if a else None,
            asset_workspace=a["workspace"] if a else None,
            asset_event_at=a["event_at"] if a else None,
            asset_source_id=a["source_id"] if a else None,
            asset_raw_path=a["raw_path"] if a else None,
        ))

    timings["bm25_candidates"] = len(bm25_hits)
    timings["vec_candidates"] = len(vec_hits)
    timings["fused_unique"] = len(fused)

    if use_rerank and hits:
        reranked, outcome = rerank_mod.rerank_hits(
            query_text, hits, top_k=rerank_top_k or top_k,
        )
        timings["rerank_ms"] = outcome.elapsed_ms
        timings["rerank_used"] = outcome.used
        timings["rerank_model"] = outcome.model
        if outcome.error:
            timings["rerank_error"] = outcome.error
        if outcome.used:
            hits = reranked
        else:
            hits = hits[:top_k]
    else:
        hits = hits[:top_k]

    return hits, timings


# FTS5 query escaping: strip operators, OR-split tokens.
_FTS_KEEP = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-'"


def _to_fts_match(s: str) -> str:
    cleaned = "".join(ch if ch in _FTS_KEEP else " " for ch in s)
    tokens = [t for t in cleaned.split() if t]
    if not tokens:
        return '""'
    return " OR ".join(f'"{t.replace(chr(34), "")}"' for t in tokens)


def hit_to_dict(h: SearchHit) -> dict:
    return asdict(h)
