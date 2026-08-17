from __future__ import annotations

import bisect
import hashlib
import sqlite3
import time
from pathlib import Path
from typing import Any

from .constants import DEFAULT_PATTERN, SQLITE_VEC_VERSION
from .errors import CorpusSearchError
from .markdown_ingest import metadata_json, parse_document
from .paths import WorkspacePaths, state_root
from .semantic import try_embed_pending
from .state import write_state
from .store import delete_vectors_for_chunks, stats


def validate_pattern(pattern: str) -> str:
    candidate = pattern.strip()
    if not candidate or Path(candidate).is_absolute() or ".." in Path(candidate).parts:
        raise CorpusSearchError(
            "source pattern must be a non-empty relative glob without '..'",
            code="invalid_source_pattern",
            exit_code=2,
        )
    return candidate


def canonical_source_path(raw_path: str) -> Path:
    path = Path(raw_path).expanduser().resolve()
    if not path.is_dir():
        raise CorpusSearchError(
            f"source path is not a readable directory: {path}",
            code="invalid_source_path",
            exit_code=2,
        )
    try:
        path.relative_to(state_root())
    except ValueError:
        pass
    else:
        raise CorpusSearchError(
            "a corpus source cannot be inside corpus-search generated state",
            code="unsafe_source_path",
            exit_code=2,
        )
    return path


def _safe_markdown_files(root: Path, pattern: str) -> tuple[list[Path], list[str]]:
    files: list[Path] = []
    warnings: list[str] = []
    try:
        candidates = sorted(root.glob(pattern))
    except (OSError, ValueError) as exc:
        raise CorpusSearchError(
            f"source glob failed: {exc}",
            code="source_scan_failed",
        ) from exc
    for candidate in candidates:
        try:
            if candidate.is_symlink() or not candidate.is_file() or candidate.suffix.lower() != ".md":
                continue
            resolved = candidate.resolve()
            resolved.relative_to(root)
        except (OSError, ValueError):
            warnings.append(f"skipped path outside source root: {candidate}")
            continue
        files.append(candidate)
    return files, warnings


def _relative_paths(root: Path, files: list[Path]) -> list[str]:
    return [path.relative_to(root).as_posix() for path in files]


def _file_list_hash(root: Path, pattern: str, relative_paths: list[str]) -> str:
    joined = "\0".join((str(root), pattern, *relative_paths))
    return hashlib.sha256(joined.encode("utf-8")).hexdigest()


def _resume_after(connection, source_id: int, file_list_hash: str) -> str | None:
    row = connection.execute(
        "SELECT file_list_hash, last_path FROM source_refresh_progress WHERE source_id=?",
        (source_id,),
    ).fetchone()
    if row is not None and row["file_list_hash"] == file_list_hash:
        return row["last_path"]
    with connection:
        connection.execute(
            "INSERT INTO source_refresh_progress(source_id, file_list_hash, last_path) "
            "VALUES (?, ?, NULL) ON CONFLICT(source_id) DO UPDATE SET "
            "file_list_hash=excluded.file_list_hash, last_path=NULL, "
            "started_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP",
            (source_id, file_list_hash),
        )
    return None


def _save_progress(connection, source_id: int, file_list_hash: str, last_path: str) -> None:
    with connection:
        connection.execute(
            "INSERT INTO source_refresh_progress(source_id, file_list_hash, last_path) "
            "VALUES (?, ?, ?) ON CONFLICT(source_id) DO UPDATE SET "
            "file_list_hash=excluded.file_list_hash, last_path=excluded.last_path, "
            "updated_at=CURRENT_TIMESTAMP",
            (source_id, file_list_hash, last_path),
        )


def _clear_progress(connection, source_id: int) -> None:
    with connection:
        connection.execute(
            "DELETE FROM source_refresh_progress WHERE source_id=?", (source_id,)
        )


def _delete_asset_chunks(connection, asset_id: int) -> None:
    chunk_ids = [
        int(row[0])
        for row in connection.execute(
            "SELECT chunk_id FROM chunk WHERE asset_id=?", (asset_id,)
        ).fetchall()
    ]
    try:
        delete_vectors_for_chunks(connection, chunk_ids)
    except CorpusSearchError:
        # The vector extension lives in an optional daemon cache. Lexical refresh
        # must remain available if that cache is missing; orphan vectors cannot be
        # returned because vector hits are hydrated through the chunk table.
        pass
    connection.execute("DELETE FROM chunk WHERE asset_id=?", (asset_id,))


def _upsert_file(connection, source, root: Path, path: Path) -> str:
    relative_path = path.relative_to(root).as_posix()
    document = parse_document(path)
    existing = connection.execute(
        "SELECT asset_id, content_hash, raw_path FROM asset "
        "WHERE source_id=? AND relative_path=?",
        (source["source_id"], relative_path),
    ).fetchone()
    if existing is not None and existing["content_hash"] == document.content_hash:
        if str(path) != existing["raw_path"]:
            with connection:
                connection.execute(
                    "UPDATE asset SET raw_path=? WHERE asset_id=?",
                    (str(path), existing["asset_id"]),
                )
        return "skipped"

    with connection:
        if existing is None:
            cursor = connection.execute(
                "INSERT INTO asset(source_id, relative_path, raw_path, content_hash, title, event_at, "
                "user_name, document_role, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    source["source_id"],
                    relative_path,
                    str(path),
                    document.content_hash,
                    document.title,
                    document.event_at,
                    document.user_name,
                    document.document_role,
                    metadata_json(document.metadata),
                ),
            )
            asset_id = int(cursor.lastrowid)
        else:
            asset_id = int(existing["asset_id"])
            _delete_asset_chunks(connection, asset_id)
            connection.execute(
                "UPDATE asset SET raw_path=?, content_hash=?, title=?, event_at=?, user_name=?, "
                "document_role=?, metadata_json=?, indexed_at=CURRENT_TIMESTAMP WHERE asset_id=?",
                (
                    str(path),
                    document.content_hash,
                    document.title,
                    document.event_at,
                    document.user_name,
                    document.document_role,
                    metadata_json(document.metadata),
                    asset_id,
                ),
            )
        connection.executemany(
            "INSERT INTO chunk(asset_id, chunk_index, heading, role, t_start_s, t_end_s, text, text_hash) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                (
                    asset_id,
                    chunk["chunk_index"],
                    chunk["heading"],
                    chunk["role"],
                    chunk["t_start_s"],
                    chunk["t_end_s"],
                    chunk["text"],
                    chunk["text_hash"],
                )
                for chunk in document.chunks
            ),
        )
    return "changed"


def _prune_missing(connection, source_id: int, seen_paths: set[str]) -> int:
    existing = connection.execute(
        "SELECT asset_id, relative_path FROM asset WHERE source_id=?", (source_id,)
    ).fetchall()
    stale = [row for row in existing if row["relative_path"] not in seen_paths]
    with connection:
        for row in stale:
            _delete_asset_chunks(connection, int(row["asset_id"]))
            connection.execute("DELETE FROM asset WHERE asset_id=?", (row["asset_id"],))
    return len(stale)


def refresh_source(connection, source, *, deadline: float | None) -> dict[str, Any]:
    report: dict[str, Any] = {
        "name": source["name"],
        "kind": source["kind"],
        "path": source["root_path"],
        "filesSeen": 0,
        "filesChanged": 0,
        "filesSkipped": 0,
        "assetsDeleted": 0,
        "complete": False,
        "warnings": [],
        "errors": [],
    }
    root = Path(source["root_path"])
    if not root.is_dir():
        report["errors"].append("source directory is missing or unreadable")
        return report
    try:
        files, warnings = _safe_markdown_files(root, source["pattern"])
    except CorpusSearchError as exc:
        report["errors"].append(exc.message)
        return report
    report["warnings"].extend(warnings)
    relative_paths = _relative_paths(root, files)
    seen_paths = set(relative_paths)
    file_list_hash = _file_list_hash(root, source["pattern"], relative_paths)
    source_id = int(source["source_id"])
    last_path = _resume_after(connection, source_id, file_list_hash)
    start_index = bisect.bisect(relative_paths, last_path) if last_path else 0
    if start_index:
        report["resumedAfter"] = last_path
    report["filesRemainingAtStart"] = len(files) - start_index
    deadline_hit = False
    scan_error = False
    for path, relative_path in zip(files[start_index:], relative_paths[start_index:], strict=True):
        if deadline is not None and time.monotonic() >= deadline:
            deadline_hit = True
            break
        report["filesSeen"] += 1
        try:
            outcome = _upsert_file(connection, source, root, path)
        except (OSError, UnicodeError, CorpusSearchError, ValueError, sqlite3.Error) as exc:
            report["errors"].append(f"{path.relative_to(root)}: {exc}")
            report["failedPath"] = relative_path
            scan_error = True
            break
        if outcome == "changed":
            report["filesChanged"] += 1
        else:
            report["filesSkipped"] += 1
        _save_progress(connection, source_id, file_list_hash, relative_path)

    scan_complete = not deadline_hit and not scan_error and (
        start_index + report["filesSeen"] == len(files)
    )
    if scan_complete and not report["errors"]:
        report["assetsDeleted"] = _prune_missing(
            connection, source_id, seen_paths
        )
        _clear_progress(connection, source_id)
        report["complete"] = True
    elif deadline_hit:
        report["pendingReason"] = "runtime_deadline"
    return report


def refresh_all(
    connection,
    paths: WorkspacePaths,
    *,
    max_runtime_seconds: int | None = None,
    embed: bool = True,
) -> tuple[dict[str, Any], int]:
    started = time.monotonic()
    deadline = started + max_runtime_seconds if max_runtime_seconds else None
    sources = connection.execute(
        "SELECT * FROM source WHERE enabled=1 ORDER BY name"
    ).fetchall()
    reports: list[dict[str, Any]] = []
    for source in sources:
        if deadline is not None and time.monotonic() >= deadline:
            reports.append(
                {
                    "name": source["name"],
                    "kind": source["kind"],
                    "path": source["root_path"],
                    "complete": False,
                    "pendingReason": "runtime_deadline",
                    "errors": [],
                    "warnings": [],
                }
            )
            continue
        report = refresh_source(connection, source, deadline=deadline)
        reports.append(report)
        status = "ok" if report["complete"] else "partial"
        connection.execute(
            "UPDATE source SET last_refresh_at=CURRENT_TIMESTAMP, last_refresh_status=?, "
            "updated_at=CURRENT_TIMESTAMP "
            "WHERE source_id=?",
            (status, source["source_id"]),
        )
        connection.commit()

    embedding: dict[str, Any] = {"used": False, "skipped": True}
    if embed and (deadline is None or time.monotonic() < deadline):
        embedding = try_embed_pending(connection, paths, deadline=deadline)

    snapshot = stats(connection, paths)
    has_errors = any(report.get("errors") for report in reports)
    source_pending = any(not report.get("complete", False) for report in reports)
    semantic_pending = bool(embed) and (
        int(snapshot["enabledChunksEmbedded"]) < int(snapshot["enabledChunksTotal"])
    )
    pending = source_pending or semantic_pending
    semantic_error = embedding.get("errorCode")
    if snapshot["sourcesTotal"] == 0:
        phase = "awaiting_sources"
    elif snapshot["sourcesEnabled"] == 0:
        phase = "sources_disabled"
    elif semantic_error in {"credential_needed", "credential_rejected"}:
        phase = "credential_needed"
    elif source_pending and snapshot["enabledChunksTotal"] == 0:
        phase = "awaiting_refresh"
    elif snapshot["enabledChunksTotal"] and (
        snapshot["enabledChunksEmbedded"] == snapshot["enabledChunksTotal"]
    ) and snapshot["vectorTable"] and (
        snapshot["sqliteVecInstalledVersion"] == SQLITE_VEC_VERSION
    ):
        phase = "ready_hybrid"
    else:
        phase = "ready_lexical"
    write_state(
        paths,
        phase,
        lastRefresh={
            "completedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "partial": pending,
            "sourceErrors": has_errors,
            "semanticErrorCode": semantic_error,
        },
        sourcesConfigured=bool(snapshot["sourcesTotal"]),
    )
    result = {
        "workspaceId": paths.workspace_id,
        "phase": phase,
        "sources": reports,
        "embedding": embedding,
        "partial": pending,
        "elapsedMs": round((time.monotonic() - started) * 1000, 1),
        "stats": snapshot,
    }
    return result, 3 if has_errors else 0
