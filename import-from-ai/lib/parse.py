#!/usr/bin/env python3
"""
parse.py — Normalize an AI provider export into the canonical import manifest.

Accepts JSON files or ZIPs (and folders of JSON parts, for Gemini continuations).
Content-hash dedupes against existing items in the user's home base imports tree.
Detects source-AI truncation and surfaces it via manifest.truncated = true.

Usage:
    python3 parse.py \
        --input ./uploads/chatgpt-export.json \
        --output ./workdir/imports/<import-id>/manifest.json \
        --user-handle <handle> \
        --home-base /agent/brain/users/<handle>/ \
        --provider chatgpt \
        --import-id chatgpt-20260520T143052Z
"""

import argparse
import hashlib
import json
import os
import re
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path


VALID_PROVIDERS = {"chatgpt", "claude", "gemini"}


def normalize_text(s: str) -> str:
    """Lowercase, collapse whitespace, strip. Used for content-hashing only."""
    return re.sub(r"\s+", " ", s.strip().lower())


def content_hash(text: str) -> str:
    return hashlib.sha256(normalize_text(text).encode("utf-8")).hexdigest()


def strip_markdown_fences(raw: str) -> str:
    """Tolerate Gemini-style ```json ... ``` wrappers and stray prose."""
    raw = raw.strip()
    fence_match = re.search(r"```(?:json)?\s*\n(.*?)\n```", raw, re.DOTALL)
    if fence_match:
        return fence_match.group(1).strip()
    first = raw.find("{")
    last = raw.rfind("}")
    if first >= 0 and last > first:
        return raw[first : last + 1]
    return raw


def load_source_json(input_path: Path) -> tuple[dict, list[str]]:
    """Return (parsed_top_level, list_of_attachment_filenames)."""
    if input_path.is_dir():
        # Gemini multi-part: merge JSON files by items[].id, last write wins.
        merged_items_by_id: dict[str, dict] = {}
        merged_top: dict = {}
        for jf in sorted(input_path.glob("*.json")):
            with open(jf, "r", encoding="utf-8") as fh:
                data = json.loads(strip_markdown_fences(fh.read()))
            if not merged_top:
                merged_top = {k: v for k, v in data.items() if k != "items"}
            for item in data.get("items", []):
                merged_items_by_id[item.get("id", f"unknown-{len(merged_items_by_id)}")] = item
        merged_top["items"] = list(merged_items_by_id.values())
        return merged_top, []

    if input_path.suffix.lower() == ".zip":
        with zipfile.ZipFile(input_path, "r") as zf:
            json_names = [n for n in zf.namelist() if n.endswith(".json")]
            if not json_names:
                raise ValueError("ZIP contains no .json manifest file.")
            with zf.open(json_names[0]) as fh:
                data = json.loads(strip_markdown_fences(fh.read().decode("utf-8")))
            attachments = [n for n in zf.namelist() if not n.endswith(".json") and not n.endswith("/")]
        return data, attachments

    with open(input_path, "r", encoding="utf-8") as fh:
        data = json.loads(strip_markdown_fences(fh.read()))
    return data, []


def existing_content_hashes(home_base: Path, provider: str) -> set[str]:
    """Collect content hashes of items already imported for this user + provider."""
    imports_root = home_base / "imports" / provider
    if not imports_root.exists():
        return set()
    hashes: set[str] = set()
    for md_file in imports_root.rglob("*.md"):
        try:
            text = md_file.read_text(encoding="utf-8")
        except OSError:
            continue
        # Front-matter may carry the original content_hash; check that first.
        fm_match = re.search(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
        if fm_match:
            fm_hash_match = re.search(r"content_hash:\s*([a-f0-9]{64})", fm_match.group(1))
            if fm_hash_match:
                hashes.add(fm_hash_match.group(1))
                continue
        # Fall back to hashing the body below the front-matter.
        body = re.sub(r"^---.*?---\s*", "", text, count=1, flags=re.DOTALL).strip()
        hashes.add(content_hash(body))
    return hashes


def detect_truncation(top_level: dict) -> bool:
    if top_level.get("truncated") is True:
        return True
    # Heuristic: trailing item with content suspiciously cut off.
    items = top_level.get("items") or []
    if items:
        last = items[-1]
        body = last.get("content", "")
        if body.endswith(("...", "…")) or re.search(r"and so on\.?$", body.strip(), re.IGNORECASE):
            return True
    return False


def main() -> int:
    p = argparse.ArgumentParser(description="Parse an AI provider export into the canonical manifest.")
    p.add_argument("--input", required=True, help="Path to uploaded JSON file, ZIP, or folder of parts.")
    p.add_argument("--output", required=True, help="Destination manifest.json path.")
    p.add_argument("--user-handle", required=True)
    p.add_argument("--home-base", required=True, help="User's home base directory.")
    p.add_argument("--provider", required=True, choices=sorted(VALID_PROVIDERS))
    p.add_argument("--import-id", required=True)
    args = p.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"ERROR: input not found: {input_path}", file=sys.stderr)
        return 2

    try:
        top_level, attachments = load_source_json(input_path)
    except (json.JSONDecodeError, ValueError, zipfile.BadZipFile) as exc:
        print(f"ERROR: could not parse input as JSON or ZIP. {exc}", file=sys.stderr)
        return 2

    home_base = Path(args.home_base)
    seen_hashes = existing_content_hashes(home_base, args.provider)

    items_in: list[dict] = top_level.get("items") or []
    items_out: list[dict] = []
    by_category: dict[str, int] = {}
    deduped = 0
    number = 0

    for raw in items_in:
        body = raw.get("content", "")
        if not isinstance(body, str) or not body.strip():
            continue
        h = content_hash(body)
        if h in seen_hashes:
            deduped += 1
            continue
        seen_hashes.add(h)
        number += 1
        category = raw.get("category", "unknown")
        by_category[category] = by_category.get(category, 0) + 1
        item = {
            "number": number,
            "source_id": raw.get("id") or f"item-{number:04d}",
            "category": category,
            "title": (raw.get("title") or "").strip() or f"Untitled {number}",
            "content": body,
            "source_confidence": raw.get("confidence", "medium"),
            "source": raw.get("source", ""),
            "last_referenced": raw.get("last_referenced"),
            "attachments": raw.get("attachments") or [],
            "content_hash": h,
        }
        items_out.append(item)

    manifest = {
        "schema_version": "1.0",
        "import_id": args.import_id,
        "source_provider": args.provider,
        "imported_at": datetime.now(timezone.utc).isoformat(),
        "user_handle": args.user_handle,
        "home_base": str(home_base),
        "truncated": detect_truncation(top_level),
        "stats": {
            "total_items": len(items_out),
            "deduped_items": deduped,
            "by_category": by_category,
        },
        "items": items_out,
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)

    print(json.dumps({
        "ok": True,
        "manifest_path": str(out_path),
        "total_items": len(items_out),
        "deduped_items": deduped,
        "truncated": manifest["truncated"],
        "by_category": by_category,
        "attachments_in_zip": attachments,
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
