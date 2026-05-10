"""Compute embeddings for unembedded chunks and load them into chunk_vec."""
from __future__ import annotations

import sys
import time
from typing import Iterable

from lib import embed as embed_mod
from lib import store as store_mod


_MAX_CHARS = embed_mod.config_mod.load(embed_mod.TOOL_DIR)["embed"].get("max_chunk_chars", 6000)


def _truncate_for_embedding(text: str, max_chars: int | None = None) -> str:
    """Trim very long chunks; full text remains in the chunk row for retrieval."""
    cap = max_chars or _MAX_CHARS
    if len(text) <= cap:
        return text
    head = text[: int(cap * 0.7)]
    tail = text[-int(cap * 0.3):]
    return head + "\n...[truncated for embedding]...\n" + tail


def embed_pending(con, *, model: str | None = None, dim: int | None = None,
                  batch_size: int | None = None, max_chunks: int | None = None,
                  verbose: bool = True) -> dict:
    model = model or embed_mod.DEFAULT_MODEL
    dim = dim or embed_mod.DEFAULT_DIM
    batch_size = batch_size or embed_mod.DEFAULT_BATCH
    store_mod.ensure_vec_table(con, dim, model)

    pending = con.execute(
        "SELECT chunk_id, text FROM chunk WHERE embedded_at IS NULL ORDER BY chunk_id"
    ).fetchall()
    if max_chunks:
        pending = pending[:max_chunks]
    total = len(pending)
    if total == 0:
        return {"embedded": 0, "total_pending": 0, "elapsed_s": 0.0,
                "model": model, "dim": dim}

    if verbose:
        print(f"embedding {total:,} chunks via {model} (dim={dim})...", file=sys.stderr)

    t0 = time.time()
    n_done = 0
    for i in range(0, total, batch_size):
        batch = pending[i : i + batch_size]
        texts = [_truncate_for_embedding(r["text"]) for r in batch]
        ids = [r["chunk_id"] for r in batch]

        vecs = embed_mod.embed_batch(texts, model=model, dim=dim)
        if len(vecs) != len(ids):
            raise RuntimeError(f"embedding count mismatch: got {len(vecs)} for {len(ids)} chunks")

        with con:
            for cid, vec in zip(ids, vecs):
                blob = embed_mod.to_blob(vec)
                con.execute("INSERT OR REPLACE INTO chunk_vec(rowid, embedding) VALUES (?, ?)",
                            (cid, blob))
                con.execute(
                    "UPDATE chunk SET embed_model=?, embed_dim=?, embedded_at=datetime('now') "
                    "WHERE chunk_id=?", (model, dim, cid),
                )
        n_done += len(batch)
        if verbose and (i // batch_size) % 5 == 0:
            done_pct = round(100 * n_done / total, 1)
            rate = n_done / max(time.time() - t0, 0.1)
            eta = (total - n_done) / max(rate, 0.1)
            print(
                f"  {n_done:>6,}/{total:,} ({done_pct}%) "
                f"~{rate:.0f} chunks/s, eta ~{int(eta)}s",
                file=sys.stderr,
            )

    return {"embedded": n_done, "total_pending": total,
            "elapsed_s": round(time.time() - t0, 1),
            "model": model, "dim": dim}
