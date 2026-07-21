"""Run all configured sources from sources.json.

The user maintains a manifest of folders they want indexed. `corpus-search refresh`
reads it, runs `index markdown` for each source (idempotent via content hash), and
runs `embed` once at the end against the union of new chunks. Designed to be
called from a single daily Runneth reminder so a workspace can keep its corpus
current with one schedule, not one schedule per folder.
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

from lib import markdown_ingest
from lib import embed_chunks
from lib import store as store_mod

# Resolve the tool dir from this file's location.
TOOL_DIR = Path(__file__).resolve().parent.parent
SOURCES_PATH = TOOL_DIR / "sources.json"
SOURCES_EXAMPLE_PATH = TOOL_DIR / "sources.example.json"


def _strip_comments(d):
    """Drop keys starting with `_` so the example file's inline comments don't break."""
    if isinstance(d, dict):
        return {k: _strip_comments(v) for k, v in d.items() if not k.startswith("_")}
    if isinstance(d, list):
        return [_strip_comments(x) for x in d]
    return d


def load_sources(path: Path = SOURCES_PATH) -> list[dict]:
    """Return the cleaned `sources` list. Raises if the file is missing or malformed."""
    if not path.exists():
        raise FileNotFoundError(
            f"{path} not found. copy sources.example.json to sources.json and "
            f"edit it to point at the folders you want indexed."
        )
    try:
        raw = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        raise RuntimeError(f"invalid JSON in {path}: {e}")
    cleaned = _strip_comments(raw)
    sources = cleaned.get("sources", [])
    if not isinstance(sources, list):
        raise RuntimeError(f"{path}: top-level `sources` must be a list")
    out = []
    for i, s in enumerate(sources):
        if not isinstance(s, dict):
            raise RuntimeError(f"{path}: sources[{i}] must be an object")
        if not s.get("source"):
            raise RuntimeError(f"{path}: sources[{i}] missing required field `source`")
        if not s.get("kind"):
            raise RuntimeError(f"{path}: sources[{i}] missing required field `kind`")
        out.append({
            "name": s.get("name") or s["kind"],
            "source": os.path.expanduser(s["source"]),
            "kind": s["kind"],
            "pattern": s.get("pattern", "**/*.md"),
            "tenant": s.get("tenant"),
            "enabled": s.get("enabled", True),
        })
    return out


def refresh(con, *, sources_path: Path = SOURCES_PATH, embed_after: bool = True,
            verbose: bool = True) -> dict:
    """Index every enabled source, then embed any new chunks. Returns a per-source report."""
    t_total = time.time()
    sources = load_sources(sources_path)
    report = {
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "sources_total": len(sources),
        "sources_skipped": 0,
        "sources_with_changes": 0,
        "files_changed_total": 0,
        "chunks_inserted_total": 0,
        "per_source": [],
    }

    for s in sources:
        if not s["enabled"]:
            report["sources_skipped"] += 1
            continue

        src_path = Path(s["source"])
        entry = {
            "name": s["name"],
            "source": str(src_path),
            "kind": s["kind"],
            "files_seen": 0,
            "files_changed": 0,
            "chunks_inserted": 0,
            "files_skipped": 0,
            "elapsed_s": 0.0,
            "error": None,
        }

        if not src_path.exists() or not src_path.is_dir():
            entry["error"] = f"source folder not found: {src_path}"
            report["per_source"].append(entry)
            if verbose:
                print(f"  ! {s['name']}: {entry['error']}", file=sys.stderr)
            continue

        t0 = time.time()
        try:
            counts = markdown_ingest.ingest_folder(
                con, src_path, s["kind"],
                default_tenant=s["tenant"],
                pattern=s["pattern"],
                verbose=False,
            )
            entry["files_seen"] = counts["files_seen"]
            entry["files_changed"] = counts["files_changed"]
            entry["files_skipped"] = counts["files_skipped"]
            entry["chunks_inserted"] = counts["chunks_inserted"]
            entry["elapsed_s"] = round(time.time() - t0, 1)
            report["files_changed_total"] += counts["files_changed"]
            report["chunks_inserted_total"] += counts["chunks_inserted"]
            if counts["files_changed"] > 0:
                report["sources_with_changes"] += 1
        except Exception as e:
            entry["error"] = str(e)

        if verbose:
            if entry["error"]:
                print(f"  ! {s['name']} ({s['kind']}): {entry['error']}", file=sys.stderr)
            else:
                print(
                    f"  - {s['name']} ({s['kind']}): "
                    f"seen={entry['files_seen']} changed={entry['files_changed']} "
                    f"chunks+={entry['chunks_inserted']} ({entry['elapsed_s']}s)",
                    file=sys.stderr,
                )
        report["per_source"].append(entry)

    embed_result = None
    if embed_after and report["chunks_inserted_total"] > 0:
        if verbose:
            print(f"  embedding {report['chunks_inserted_total']:,} new chunks...",
                  file=sys.stderr)
        embed_result = embed_chunks.embed_pending(con, verbose=False)
    report["embed"] = embed_result
    report["elapsed_s"] = round(time.time() - t_total, 1)
    return report
