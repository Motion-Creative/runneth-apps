"""
query_shots.py — Agent-path semantic search over the video asset library.

Embeds a natural language query using the same ONNX model as the browser,
runs cosine similarity against stored embeddings, and returns ranked results.
Optionally cuts clips on demand via ffmpeg.

Usage (as a library — the preferred agent path):
    from query_shots import search_and_clip
    results = search_and_clip("silicone ring being stretched", limit=5)

Usage (CLI):
    python3 query_shots.py "silicone ring being stretched" [--limit 5] [--cut-clips]
"""

import sys
import subprocess
import argparse
import sqlite3
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from embed_onnx import embed, load_all_embeddings

DB_PATH   = "{{BRAIN_PATH}}/{{DB_FILENAME}}"
CLIPS_DIR = Path("{{BRAIN_PATH}}/clips")
CLIPS_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_THRESHOLD = 0.65


def _cut_clip(shot: dict) -> str | None:
    """Cut a clip from source video using ffmpeg stream-copy. Returns path or None."""
    source = Path(shot["source_video"])
    if not source.exists():
        return None
    start    = shot["timecode_start"]
    end      = shot["timecode_end"]
    duration = end - start
    clip_name = f"{source.stem}_{start:.1f}-{end:.1f}{source.suffix}"
    clip_path = CLIPS_DIR / clip_name

    if clip_path.exists():
        return str(clip_path)

    result = subprocess.run(
        ["ffmpeg", "-y", "-ss", str(start), "-i", str(source),
         "-t", str(duration), "-c", "copy", "-avoid_negative_ts", "1", str(clip_path)],
        capture_output=True, text=True
    )
    if result.returncode == 0 and clip_path.exists():
        # Update clip_path in DB
        conn = sqlite3.connect(DB_PATH)
        conn.execute("UPDATE shots SET clip_path=? WHERE id=?",
                     (str(clip_path), shot["id"]))
        conn.commit()
        conn.close()
        return str(clip_path)
    return None


def search_and_clip(
    query: str,
    limit: int = 20,
    threshold: float = DEFAULT_THRESHOLD,
    cut_clips: bool = False,
) -> list[dict]:
    """
    Semantic search over the video asset library.

    Args:
        query:     Natural language query string.
        limit:     Maximum number of results to return.
        threshold: Minimum cosine similarity (default 0.65).
        cut_clips: If True, cut clip files on demand for each result.

    Returns:
        List of shot dicts with score, timecodes, description, clip_path, etc.
        Sorted by similarity score descending.
    """
    query_vec = embed(query)
    ids, matrix = load_all_embeddings()

    if len(ids) == 0:
        return []

    scores = matrix @ query_vec
    ranked = np.argsort(scores)[::-1]

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    results = []
    for idx in ranked:
        score = float(scores[idx])
        if score < threshold:
            break
        if len(results) >= limit:
            break

        shot_id = ids[idx]
        row = conn.execute("SELECT * FROM shots WHERE id=?", (shot_id,)).fetchone()
        if not row:
            continue

        shot = dict(row)
        shot["score"] = round(score, 4)

        if cut_clips:
            clip_path = shot.get("clip_path")
            if not clip_path or not Path(clip_path).exists():
                clip_path = _cut_clip(shot)
                shot["clip_path"] = clip_path

        results.append(shot)

    conn.close()
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("query")
    parser.add_argument("--limit",     type=int,   default=10)
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    parser.add_argument("--cut-clips", action="store_true")
    args = parser.parse_args()

    results = search_and_clip(args.query, args.limit, args.threshold, args.cut_clips)
    if not results:
        print(f"No results above threshold {args.threshold}.")
    else:
        print(f"\n{len(results)} result(s) for: '{args.query}'\n")
        for i, r in enumerate(results, 1):
            print(f"{i:2d}. [{r['score']:.4f}] {r['source_filename']}  "
                  f"{r['timecode_start']:.1f}s–{r['timecode_end']:.1f}s")
            print(f"     \"{(r['description'] or '')[:100]}\"")
            if r.get("clip_path"):
                print(f"     clip: {r['clip_path']}")
