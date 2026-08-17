from __future__ import annotations

import json
import math
import sqlite3
import time
from dataclasses import dataclass
from typing import Any, Sequence

from .constants import (
    EMBED_BATCH_SIZE,
    EMBED_DIM,
    EMBED_ENDPOINT,
    EMBED_MAX_CHARS,
    EMBED_MODEL,
    RERANK_CHAR_BUDGET,
    RERANK_ENDPOINT,
    RERANK_MODEL,
)
from .errors import CorpusSearchError, SecureFetchError
from .paths import WorkspacePaths
from .secure_fetch import post_json
from .store import ensure_vec_table, vector_blob


@dataclass(frozen=True)
class SemanticOutcome:
    used: bool
    error_code: str | None = None
    error_message: str | None = None


def _truncate(text: str, limit: int = EMBED_MAX_CHARS) -> str:
    if len(text) <= limit:
        return text
    head = text[: int(limit * 0.7)]
    tail = text[-int(limit * 0.3) :]
    return f"{head}\n...[truncated for embedding]...\n{tail}"


def embed_texts(paths: WorkspacePaths, texts: Sequence[str]) -> list[list[float]]:
    if not texts:
        return []
    response = post_json(
        paths,
        url=EMBED_ENDPOINT,
        payload={
            "model": EMBED_MODEL,
            "input": [_truncate(text) for text in texts],
            "dimensions": EMBED_DIM,
            "encoding_format": "float",
        },
    )
    data = response.get("data")
    if not isinstance(data, list) or len(data) != len(texts):
        raise CorpusSearchError(
            "OpenAI returned the wrong number of embeddings",
            code="embedding_count_mismatch",
            exit_code=4,
        )
    ordered: list[list[float] | None] = [None] * len(texts)
    for item in data:
        if not isinstance(item, dict) or not isinstance(item.get("index"), int):
            raise CorpusSearchError("OpenAI returned malformed embedding data", code="embedding_malformed", exit_code=4)
        index = item["index"]
        values = item.get("embedding")
        if index < 0 or index >= len(ordered) or not isinstance(values, list) or len(values) != EMBED_DIM:
            raise CorpusSearchError("OpenAI returned an invalid embedding vector", code="embedding_malformed", exit_code=4)
        vector: list[float] = []
        for value in values:
            if not isinstance(value, (int, float)) or not math.isfinite(float(value)):
                raise CorpusSearchError("OpenAI returned a non-finite embedding", code="embedding_malformed", exit_code=4)
            vector.append(float(value))
        ordered[index] = vector
    if any(vector is None for vector in ordered):
        raise CorpusSearchError("OpenAI omitted an embedding vector", code="embedding_malformed", exit_code=4)
    return [vector for vector in ordered if vector is not None]


def embed_pending(
    connection,
    paths: WorkspacePaths,
    *,
    deadline: float | None = None,
    batch_size: int = EMBED_BATCH_SIZE,
) -> dict[str, Any]:
    ensure_vec_table(connection)
    pending_before = int(
        connection.execute(
            "SELECT count(*) FROM chunk c JOIN asset a ON a.asset_id=c.asset_id "
            "JOIN source s ON s.source_id=a.source_id "
            "WHERE s.enabled=1 AND c.embedded_at IS NULL"
        ).fetchone()[0]
    )
    embedded = 0
    started = time.monotonic()
    while deadline is None or time.monotonic() < deadline:
        rows = connection.execute(
            "SELECT c.chunk_id, c.text FROM chunk c "
            "JOIN asset a ON a.asset_id=c.asset_id JOIN source s ON s.source_id=a.source_id "
            "WHERE s.enabled=1 AND c.embedded_at IS NULL ORDER BY c.chunk_id LIMIT ?",
            (batch_size,),
        ).fetchall()
        if not rows:
            break
        vectors = embed_texts(paths, [row["text"] for row in rows])
        with connection:
            for row, vector in zip(rows, vectors, strict=True):
                connection.execute(
                    "INSERT OR REPLACE INTO chunk_vec(rowid, embedding) VALUES (?, ?)",
                    (row["chunk_id"], vector_blob(vector)),
                )
                connection.execute(
                    "UPDATE chunk SET embedded_at=CURRENT_TIMESTAMP, embed_model=?, embed_dim=? WHERE chunk_id=?",
                    (EMBED_MODEL, EMBED_DIM, row["chunk_id"]),
                )
        embedded += len(rows)
    pending_after = int(
        connection.execute(
            "SELECT count(*) FROM chunk c JOIN asset a ON a.asset_id=c.asset_id "
            "JOIN source s ON s.source_id=a.source_id "
            "WHERE s.enabled=1 AND c.embedded_at IS NULL"
        ).fetchone()[0]
    )
    return {
        "embedded": embedded,
        "pendingBefore": pending_before,
        "pendingAfter": pending_after,
        "complete": pending_after == 0,
        "model": EMBED_MODEL,
        "dimensions": EMBED_DIM,
        "elapsedMs": round((time.monotonic() - started) * 1000, 1),
    }


def try_embed_pending(connection, paths: WorkspacePaths, *, deadline: float | None = None) -> dict[str, Any]:
    try:
        result = embed_pending(connection, paths, deadline=deadline)
        return {"used": True, **result}
    except (CorpusSearchError, SecureFetchError, sqlite3.Error) as exc:
        if isinstance(exc, CorpusSearchError):
            code = exc.code
            message = exc.message
            details = exc.details
        else:
            code = "semantic_sqlite_error"
            message = "the vector store is unavailable; lexical search remains available"
            details = {}
        return {
            "used": False,
            "embedded": 0,
            "complete": False,
            "errorCode": code,
            "error": message,
            **details,
        }


def _response_output_text(response: dict[str, Any]) -> str:
    direct = response.get("output_text")
    if isinstance(direct, str):
        return direct
    output = response.get("output")
    if not isinstance(output, list):
        raise CorpusSearchError("OpenAI response omitted output", code="rerank_malformed", exit_code=4)
    for item in output:
        if not isinstance(item, dict) or item.get("type") != "message":
            continue
        content = item.get("content")
        if not isinstance(content, list):
            continue
        for part in content:
            if isinstance(part, dict) and part.get("type") == "output_text" and isinstance(part.get("text"), str):
                return part["text"]
    raise CorpusSearchError("OpenAI response contained no output text", code="rerank_malformed", exit_code=4)


def rerank(
    paths: WorkspacePaths,
    query: str,
    candidates: Sequence[dict[str, Any]],
    *,
    top_k: int,
) -> tuple[list[dict[str, Any]], SemanticOutcome]:
    if not candidates:
        return [], SemanticOutcome(used=False)
    compact = []
    for index, hit in enumerate(candidates, 1):
        compact.append(
            {
                "i": index,
                "kind": hit.get("kind"),
                "source": hit.get("source"),
                "role": hit.get("role"),
                "event_at": hit.get("eventAt"),
                "text": str(hit.get("text") or "")[:RERANK_CHAR_BUDGET],
            }
        )
    schema = {
        "type": "object",
        "properties": {
            "results": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "i": {"type": "integer", "minimum": 1, "maximum": len(candidates)},
                        "reason": {"type": "string", "maxLength": 300},
                    },
                    "required": ["i", "reason"],
                    "additionalProperties": False,
                },
                "maxItems": top_k,
            }
        },
        "required": ["results"],
        "additionalProperties": False,
    }
    try:
        response = post_json(
            paths,
            url=RERANK_ENDPOINT,
            payload={
                "model": RERANK_MODEL,
                "store": False,
                "input": [
                    {
                        "role": "system",
                        "content": [
                            {
                                "type": "input_text",
                                "text": "Rerank retrieval candidates by how directly they answer the query. Prefer intent match over shared vocabulary. Skip duplicates and weak matches.",
                            }
                        ],
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": json.dumps(
                                    {"query": query, "top_k": top_k, "candidates": compact},
                                    ensure_ascii=False,
                                    separators=(",", ":"),
                                ),
                            }
                        ],
                    },
                ],
                "text": {
                    "format": {
                        "type": "json_schema",
                        "name": "corpus_search_rerank",
                        "strict": True,
                        "schema": schema,
                    }
                },
            },
        )
        parsed = json.loads(_response_output_text(response))
        entries = parsed.get("results") if isinstance(parsed, dict) else None
        if not isinstance(entries, list):
            raise CorpusSearchError("rerank output did not match its schema", code="rerank_malformed", exit_code=4)
        selected: list[dict[str, Any]] = []
        seen: set[int] = set()
        for rank, entry in enumerate(entries, 1):
            if not isinstance(entry, dict) or not isinstance(entry.get("i"), int):
                continue
            index = entry["i"] - 1
            if index < 0 or index >= len(candidates) or index in seen:
                continue
            seen.add(index)
            hit = dict(candidates[index])
            hit["rerankRank"] = rank
            hit["rerankReason"] = str(entry.get("reason") or "")[:300]
            selected.append(hit)
        return selected, SemanticOutcome(used=True)
    except (CorpusSearchError, SecureFetchError, json.JSONDecodeError) as exc:
        code = exc.code if isinstance(exc, CorpusSearchError) else "rerank_malformed"
        message = exc.message if isinstance(exc, CorpusSearchError) else "rerank returned malformed JSON"
        return list(candidates[:top_k]), SemanticOutcome(used=False, error_code=code, error_message=message)
