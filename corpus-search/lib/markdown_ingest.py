"""Generic markdown ingestor for corpus-search.

Walks a folder of `.md` files and ingests each one as an asset with chunks.
The tool makes no assumption about what's inside the markdown — could be a
video summary, a research note, a Gong transcript already converted, anything.

Conventions the parser tries to honor when present (and ignores when absent):

- **YAML frontmatter** at the top of the file (between `---` lines) becomes
  asset metadata. Recognized keys: `title`, `brand`, `event_at`, `duration_s`,
  `user_email`, `org`, `workspace`, `source_id`. Anything else lands in
  `asset.extra_json` so it is preserved and can be filtered with SQL.
- **Markdown headers** (`#`, `##`, `###`) are the chunk boundaries. The first
  level deeper than the document title (usually `##`) is the primary cut; we
  also split on `###` inside long sections.
- **Timestamp markers** like `[00:00]`, `[00:00:00]`, `[00:00-00:05]`,
  `[00:00 - 00:05]` at the start of a section heading or paragraph populate
  `chunk.t_start_s` / `chunk.t_end_s`. Otherwise time fields stay null.
- **Tiny sections** (under MIN_CHUNK_CHARS) are merged with the next one so
  retrieval doesn't return one-line scraps.
- **Huge sections** (over MAX_CHUNK_CHARS) are split with overlap so each
  embedding has enough context.

The parser is deliberately permissive: any well-formed markdown file works.
A team that needs different chunking writes their own ingestor next to this one.
"""
from __future__ import annotations

import glob
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Iterable

# Tunables. Override via config.json -> markdown_ingest section if needed later.
MIN_CHUNK_CHARS = 200
MAX_CHUNK_CHARS = 4000
OVERLAP_CHARS = 250

# Recognized YAML frontmatter keys that map onto first-class asset columns.
# Anything not in this set goes into asset.extra_json.
ASSET_FIELDS = {
    "title": "title",
    "brand": "brand",
    "event_at": "event_at",
    "date": "event_at",
    "duration_s": "duration_s",
    "duration": "duration_s",
    "user_email": "user_email",
    "user": "user_email",
    "org": "org",
    "workspace": "workspace",
    "source_id": "source_id",
    "tenant_id": "tenant_id",
}

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
HEADER_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*$", re.MULTILINE)
TIMESTAMP_RE = re.compile(
    r"\[(\d{1,2}(?::\d{2}){0,2})(?:\s*[-\u2013]\s*(\d{1,2}(?::\d{2}){0,2}))?\]"
)


def _sha1(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()


def _parse_frontmatter(text: str) -> tuple[dict, str]:
    """Return (frontmatter_dict, body_text). frontmatter_dict is empty if none."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, text
    raw = m.group(1)
    body = text[m.end():]
    fm: dict = {}
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        k, v = k.strip(), v.strip()
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        fm[k] = v
    return fm, body


def _parse_timestamp(s: str) -> float | None:
    """Parse 'MM:SS', 'HH:MM:SS', or just 'SS' into seconds."""
    parts = s.split(":")
    try:
        nums = [int(p) for p in parts]
    except ValueError:
        return None
    if len(nums) == 1:
        return float(nums[0])
    if len(nums) == 2:
        return float(nums[0] * 60 + nums[1])
    if len(nums) == 3:
        return float(nums[0] * 3600 + nums[1] * 60 + nums[2])
    return None


def _extract_timestamps(text: str) -> tuple[float | None, float | None]:
    """Look at the first 200 chars for a timestamp marker."""
    m = TIMESTAMP_RE.search(text[:200])
    if not m:
        return None, None
    t0 = _parse_timestamp(m.group(1))
    t1 = _parse_timestamp(m.group(2)) if m.group(2) else None
    return t0, t1


def _split_into_sections(body: str) -> list[tuple[int, str, str]]:
    """Cut the body at markdown headers. Returns list of (level, heading, content)."""
    matches = list(HEADER_RE.finditer(body))
    if not matches:
        return [(0, "", body.strip())]
    sections: list[tuple[int, str, str]] = []
    prelude = body[: matches[0].start()].strip()
    if prelude:
        sections.append((0, "", prelude))
    for i, m in enumerate(matches):
        level = len(m.group(1))
        heading = m.group(2).strip()
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        content = body[start:end].strip()
        sections.append((level, heading, content))
    return sections


def _merge_and_split(sections: list[tuple[int, str, str]]) -> list[str]:
    """Merge tiny sections forward; split huge sections with overlap."""
    out: list[str] = []
    buf = ""
    for _, _, content in sections:
        if len(content) < MIN_CHUNK_CHARS:
            buf = (buf + "\n\n" + content).strip() if buf else content
            if len(buf) >= MIN_CHUNK_CHARS:
                out.append(buf)
                buf = ""
            continue
        if buf:
            out.append((buf + "\n\n" + content).strip())
            buf = ""
            continue
        if len(content) <= MAX_CHUNK_CHARS:
            out.append(content)
            continue
        step = MAX_CHUNK_CHARS - OVERLAP_CHARS
        for start in range(0, len(content), step):
            piece = content[start : start + MAX_CHUNK_CHARS]
            if piece.strip():
                out.append(piece.strip())
            if start + MAX_CHUNK_CHARS >= len(content):
                break
    if buf:
        out.append(buf)
    return out


def _split_unheaded(body: str) -> list[str]:
    """Fallback when there are no headers: paragraph-aware sliding window."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", body) if p.strip()]
    out: list[str] = []
    buf = ""
    for p in paragraphs:
        cand = (buf + "\n\n" + p).strip() if buf else p
        if len(cand) > MAX_CHUNK_CHARS and buf:
            out.append(buf)
            tail = buf[-OVERLAP_CHARS:]
            buf = (tail + "\n\n" + p).strip()
        else:
            buf = cand
    if buf:
        out.append(buf)
    return out or [body.strip()]


def chunk_markdown(body: str) -> list[dict]:
    """Return a list of {chunk_idx, text, t_start_s, t_end_s} dicts."""
    sections = _split_into_sections(body)
    if len(sections) <= 1 and not any(level > 0 for level, _, _ in sections):
        texts = _split_unheaded(body)
    else:
        texts = _merge_and_split(sections)

    chunks: list[dict] = []
    for i, t in enumerate(texts):
        if not t.strip():
            continue
        t0, t1 = _extract_timestamps(t)
        chunks.append({
            "chunk_idx": i,
            "text": t.strip(),
            "t_start_s": t0,
            "t_end_s": t1,
        })
    return chunks


def ingest_file(con, path: Path, kind: str, default_tenant: str | None = None) -> tuple[int, int]:
    """Ingest one markdown file. Returns (asset_id, n_chunks_inserted_or_zero)."""
    text = path.read_text(encoding="utf-8", errors="replace")
    file_hash = _sha1(text)
    fm, body = _parse_frontmatter(text)

    asset_cols: dict = {
        "kind": kind, "title": "", "user_email": "", "org": "",
        "workspace": "", "brand": "", "event_at": "",
        "duration_s": None, "tenant_id": default_tenant,
        "source_id": str(path.resolve()),
    }
    extra: dict = {"file_hash": file_hash, "source_path": str(path.resolve())}
    for k, v in fm.items():
        if k in ASSET_FIELDS:
            col = ASSET_FIELDS[k]
            if col == "duration_s":
                try:
                    asset_cols[col] = float(v)
                except (TypeError, ValueError):
                    extra[k] = v
            else:
                asset_cols[col] = v
        else:
            extra[k] = v

    source_id = asset_cols["source_id"]

    existing = con.execute(
        "SELECT asset_id, extra_json FROM asset WHERE kind=? AND source_id=?",
        (kind, source_id),
    ).fetchone()
    if existing:
        existing_extra = json.loads(existing["extra_json"] or "{}")
        if existing_extra.get("file_hash") == file_hash:
            return (existing["asset_id"], 0)
        asset_id = existing["asset_id"]
        con.execute("DELETE FROM chunk WHERE asset_id = ?", (asset_id,))
        con.execute(
            "UPDATE asset SET title=?, user_email=?, org=?, workspace=?, brand=?, "
            "event_at=?, duration_s=?, tenant_id=?, raw_path=?, extra_json=?, "
            "indexed_at=datetime('now') WHERE asset_id=?",
            (asset_cols["title"], asset_cols["user_email"], asset_cols["org"],
             asset_cols["workspace"], asset_cols["brand"], asset_cols["event_at"],
             asset_cols["duration_s"], asset_cols["tenant_id"], str(path),
             json.dumps(extra), asset_id),
        )
    else:
        cur = con.execute(
            "INSERT INTO asset(kind, source_id, tenant_id, title, user_email, org, "
            "workspace, brand, event_at, duration_s, raw_path, extra_json, indexed_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))",
            (kind, source_id, asset_cols["tenant_id"], asset_cols["title"],
             asset_cols["user_email"], asset_cols["org"], asset_cols["workspace"],
             asset_cols["brand"], asset_cols["event_at"], asset_cols["duration_s"],
             str(path), json.dumps(extra)),
        )
        asset_id = cur.lastrowid

    chunks = chunk_markdown(body)
    n = 0
    for c in chunks:
        con.execute(
            "INSERT INTO chunk(asset_id, chunk_idx, role, t_start_s, t_end_s, text, text_hash, extra_json) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (asset_id, c["chunk_idx"], None, c["t_start_s"], c["t_end_s"],
             c["text"], _sha1(c["text"]), None),
        )
        n += 1
    return (asset_id, n)


def ingest_folder(con, root: Path, kind: str, *, default_tenant: str | None = None,
                  pattern: str = "**/*.md", limit: int | None = None,
                  verbose: bool = True) -> dict:
    files = sorted(glob.glob(str(root / pattern), recursive=True))
    if limit:
        files = files[:limit]
    counts = {"files_seen": 0, "files_changed": 0, "chunks_inserted": 0,
              "files_skipped": 0, "kind": kind, "source": str(root)}
    for i, path in enumerate(files, 1):
        counts["files_seen"] += 1
        try:
            with con:
                _, n = ingest_file(con, Path(path), kind, default_tenant=default_tenant)
            if n == 0:
                counts["files_skipped"] += 1
            else:
                counts["files_changed"] += 1
                counts["chunks_inserted"] += n
        except Exception as e:
            print(f"  ! {path}: {e}", file=sys.stderr)
        if verbose and i % 100 == 0:
            print(
                f"  {i}/{len(files)} processed "
                f"(changed={counts['files_changed']} skipped={counts['files_skipped']} "
                f"chunks={counts['chunks_inserted']})",
                file=sys.stderr,
            )
    return counts
