from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .constants import CHUNK_OVERLAP_CHARS, MAX_CHUNK_CHARS, MIN_CHUNK_CHARS


FRONTMATTER_RE = re.compile(r"\A---[ \t]*\r?\n(.*?)\r?\n---[ \t]*\r?\n", re.DOTALL)
HEADER_RE = re.compile(r"^(#{1,6})[ \t]+(.+?)[ \t]*$", re.MULTILINE)
TIMESTAMP_RE = re.compile(
    r"\[(\d{1,2}(?::\d{2}){0,2})(?:\s*[-\u2013]\s*(\d{1,2}(?::\d{2}){0,2}))?\]"
)
ROLE_HEADING_RE = re.compile(r"^(role|speaker)\s*:\s*(.+)$", re.IGNORECASE)
SAFE_META_KEY_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_.-]{0,127}$")


@dataclass(frozen=True)
class ParsedDocument:
    content_hash: str
    title: str | None
    event_at: str | None
    user_name: str | None
    document_role: str | None
    metadata: dict[str, Any]
    chunks: list[dict[str, Any]]


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def parse_scalar(raw: str) -> str | int | float | bool | None:
    value = raw.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    lowered = value.lower()
    if lowered in {"null", "~"}:
        return None
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    if re.fullmatch(r"[-+]?\d+", value):
        try:
            return int(value)
        except ValueError:
            pass
    if re.fullmatch(r"[-+]?(?:\d+\.\d*|\d*\.\d+)(?:[eE][-+]?\d+)?", value):
        try:
            return float(value)
        except ValueError:
            pass
    return value


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    """Parse the documented top-level scalar YAML subset.

    Nested values, block scalars, and arrays are deliberately ignored rather than
    mis-parsed. This keeps v1 dependency-free and makes --meta equality predictable.
    """
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {}, text
    metadata: dict[str, Any] = {}
    for raw_line in match.group(1).splitlines():
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue
        if raw_line[:1].isspace() or ":" not in raw_line:
            continue
        key, raw_value = raw_line.split(":", 1)
        key = key.strip()
        if not SAFE_META_KEY_RE.fullmatch(key):
            continue
        if not raw_value.strip() or raw_value.lstrip().startswith(("|", ">", "[", "{")):
            continue
        metadata[key] = parse_scalar(raw_value)
    return metadata, text[match.end() :]


def _timestamp_seconds(value: str | None) -> float | None:
    if value is None:
        return None
    try:
        parts = [int(part) for part in value.split(":")]
    except ValueError:
        return None
    if len(parts) == 1:
        return float(parts[0])
    if len(parts) == 2:
        return float(parts[0] * 60 + parts[1])
    if len(parts) == 3:
        return float(parts[0] * 3600 + parts[1] * 60 + parts[2])
    return None


def _timestamps(text: str) -> tuple[float | None, float | None]:
    match = TIMESTAMP_RE.search(text[:240])
    if not match:
        return None, None
    return _timestamp_seconds(match.group(1)), _timestamp_seconds(match.group(2))


def _role_from_heading(heading: str, default_role: str | None) -> str | None:
    match = ROLE_HEADING_RE.match(heading.strip())
    if not match:
        return default_role
    value = TIMESTAMP_RE.sub("", match.group(2)).strip()
    return f"speaker:{value}" if match.group(1).lower() == "speaker" else value


def _split_large(text: str) -> list[str]:
    if len(text) <= MAX_CHUNK_CHARS:
        return [text]
    pieces: list[str] = []
    step = MAX_CHUNK_CHARS - CHUNK_OVERLAP_CHARS
    for start in range(0, len(text), step):
        piece = text[start : start + MAX_CHUNK_CHARS].strip()
        if piece:
            pieces.append(piece)
        if start + MAX_CHUNK_CHARS >= len(text):
            break
    return pieces


def _sections(body: str) -> list[tuple[str, str]]:
    matches = list(HEADER_RE.finditer(body))
    if not matches:
        paragraphs = [part.strip() for part in re.split(r"\n\s*\n", body) if part.strip()]
        sections: list[tuple[str, str]] = []
        buffer = ""
        for paragraph in paragraphs:
            candidate = f"{buffer}\n\n{paragraph}".strip() if buffer else paragraph
            if len(candidate) > MAX_CHUNK_CHARS and buffer:
                sections.append(("", buffer))
                buffer = f"{buffer[-CHUNK_OVERLAP_CHARS:]}\n\n{paragraph}".strip()
            else:
                buffer = candidate
        if buffer:
            sections.append(("", buffer))
        return sections or [("", body.strip())]

    sections = []
    prelude = body[: matches[0].start()].strip()
    if prelude:
        sections.append(("", prelude))
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(body)
        sections.append((match.group(2).strip(), body[match.start() : end].strip()))
    return sections


def chunk_markdown(body: str, default_role: str | None = None) -> list[dict[str, Any]]:
    merged: list[tuple[str, str]] = []
    pending_heading = ""
    pending_text = ""
    for heading, section in _sections(body):
        carries_structured_boundary = bool(
            ROLE_HEADING_RE.match(heading.strip()) or TIMESTAMP_RE.search(heading)
        )
        if len(section) < MIN_CHUNK_CHARS and not carries_structured_boundary:
            if not pending_heading:
                pending_heading = heading
            pending_text = f"{pending_text}\n\n{section}".strip()
            if len(pending_text) >= MIN_CHUNK_CHARS:
                merged.append((pending_heading, pending_text))
                pending_heading = ""
                pending_text = ""
            continue
        if pending_text:
            if carries_structured_boundary:
                merged.append((pending_heading, pending_text))
            else:
                section = f"{pending_text}\n\n{section}".strip()
                heading = pending_heading or heading
            pending_heading = ""
            pending_text = ""
        merged.append((heading, section))
    if pending_text:
        merged.append((pending_heading, pending_text))

    chunks: list[dict[str, Any]] = []
    for heading, section in merged:
        for piece in _split_large(section):
            start, end = _timestamps(piece)
            chunks.append(
                {
                    "chunk_index": len(chunks),
                    "heading": heading or None,
                    "role": _role_from_heading(heading, default_role),
                    "t_start_s": start,
                    "t_end_s": end,
                    "text": piece,
                    "text_hash": text_hash(piece),
                }
            )
    return chunks


def parse_document(path: Path) -> ParsedDocument:
    raw = path.read_text(encoding="utf-8", errors="replace")
    metadata, body = parse_frontmatter(raw)
    title_value = metadata.get("title")
    if not isinstance(title_value, str) or not title_value.strip():
        first_heading = HEADER_RE.search(body)
        title_value = first_heading.group(2).strip() if first_heading else path.stem
    event_value = metadata.get("event_at", metadata.get("date"))
    user_value = metadata.get("user", metadata.get("user_email"))
    role_value = metadata.get("role")
    document_role = str(role_value) if role_value is not None else None
    return ParsedDocument(
        content_hash=content_hash(raw),
        title=str(title_value),
        event_at=str(event_value) if event_value is not None else None,
        user_name=str(user_value) if user_value is not None else None,
        document_role=document_role,
        metadata=metadata,
        chunks=chunk_markdown(body, document_role),
    )


def metadata_json(metadata: dict[str, Any]) -> str:
    return json.dumps(metadata, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
