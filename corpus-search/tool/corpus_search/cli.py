from __future__ import annotations

import argparse
import json
import re
import shutil
import sqlite3
import subprocess
import sys
from typing import Any, Callable

from .constants import DEFAULT_PATTERN, DEFAULT_TOP_K, SQLITE_VEC_REQUIREMENT, SQLITE_VEC_VERSION
from .errors import CorpusSearchError
from .markdown_ingest import parse_scalar
from .paths import WorkspacePaths, legacy_db_path
from .refresh import canonical_source_path, refresh_all, validate_pattern
from .search import search
from .state import read_state, write_state
from .store import (
    connect,
    delete_vectors_for_chunks,
    load_sqlite_vec,
    rebuild_embeddings,
    sqlite_vec_installed_version,
    stats,
)


SAFE_LABEL_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")


class JsonArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> None:
        raise CorpusSearchError(message, code="invalid_arguments", exit_code=2)


def _paths(args, *, create: bool = False) -> WorkspacePaths:
    return WorkspacePaths.resolve(args.workspace_id, create=create)


def _require_label(value: str, label: str) -> str:
    if not SAFE_LABEL_RE.fullmatch(value):
        raise CorpusSearchError(
            f"{label} must use letters, digits, dot, underscore, or hyphen",
            code=f"invalid_{label.replace(' ', '_')}",
            exit_code=2,
        )
    return value


def _semantic_ready(snapshot: dict[str, object]) -> bool:
    return bool(
        snapshot["enabledChunksTotal"]
        and snapshot["enabledChunksEmbedded"] == snapshot["enabledChunksTotal"]
        and snapshot["vectorTable"]
        and snapshot["sqliteVecInstalledVersion"] == SQLITE_VEC_VERSION
    )


def cmd_workspace_init(args) -> tuple[dict[str, Any], int]:
    paths = _paths(args, create=True)
    connection = connect(paths)
    snapshot = stats(connection, paths)
    connection.close()
    if snapshot["sourcesTotal"] == 0:
        phase = "awaiting_sources"
    elif snapshot["sourcesEnabled"] == 0:
        phase = "sources_disabled"
    elif snapshot["sourcesPendingRefresh"] and snapshot["enabledChunksTotal"] == 0:
        phase = "awaiting_refresh"
    elif _semantic_ready(snapshot):
        phase = "ready_hybrid"
    else:
        phase = "ready_lexical"
    state = write_state(
        paths,
        phase,
        initialized=True,
        sourcesConfigured=bool(snapshot["sourcesTotal"]),
    )
    return {"workspaceId": paths.workspace_id, "state": state, "stats": snapshot}, 0


def cmd_source_add(args) -> tuple[dict[str, Any], int]:
    paths = _paths(args, create=True)
    name = _require_label(args.name, "source name")
    kind = _require_label(args.kind, "source kind")
    root = canonical_source_path(args.path)
    pattern = validate_pattern(args.pattern)
    connection = connect(paths)
    try:
        with connection:
            connection.execute(
                "INSERT INTO source(name, root_path, kind, pattern, enabled) VALUES (?, ?, ?, ?, 1)",
                (name, str(root), kind, pattern),
            )
    except sqlite3.IntegrityError as exc:
        raise CorpusSearchError(
            f"a source named {name!r} already exists",
            code="source_exists",
            exit_code=2,
        ) from exc
    row = connection.execute("SELECT * FROM source WHERE name=?", (name,)).fetchone()
    connection.close()
    write_state(paths, "awaiting_refresh", sourcesConfigured=True)
    return {"source": dict(row)}, 0


def cmd_source_list(args) -> tuple[dict[str, Any], int]:
    paths = _paths(args, create=True)
    connection = connect(paths)
    rows = [dict(row) for row in connection.execute("SELECT * FROM source ORDER BY name")]
    connection.close()
    return {"workspaceId": paths.workspace_id, "sources": rows}, 0


def _source_row(connection, name: str):
    row = connection.execute("SELECT * FROM source WHERE name=?", (name,)).fetchone()
    if row is None:
        raise CorpusSearchError(
            f"source not found: {name}", code="source_not_found", exit_code=2
        )
    return row


def cmd_source_update(args) -> tuple[dict[str, Any], int]:
    paths = _paths(args, create=True)
    name = _require_label(args.name, "source name")
    updates: list[str] = []
    values: list[Any] = []
    if args.path is not None:
        updates.append("root_path=?")
        values.append(str(canonical_source_path(args.path)))
    if args.kind is not None:
        updates.append("kind=?")
        values.append(_require_label(args.kind, "source kind"))
    if args.pattern is not None:
        updates.append("pattern=?")
        values.append(validate_pattern(args.pattern))
    if not updates:
        raise CorpusSearchError(
            "source update requires --path, --kind, or --pattern",
            code="no_source_updates",
            exit_code=2,
        )
    connection = connect(paths)
    _source_row(connection, name)
    values.append(name)
    with connection:
        connection.execute(
            f"UPDATE source SET {', '.join(updates)}, last_refresh_at=NULL, "
            "last_refresh_status=NULL, updated_at=CURRENT_TIMESTAMP WHERE name=?",
            values,
        )
    row = connection.execute("SELECT * FROM source WHERE name=?", (name,)).fetchone()
    connection.close()
    write_state(paths, "awaiting_refresh", sourcesConfigured=True)
    return {"source": dict(row), "refreshRequired": True}, 0


def cmd_source_toggle(args, enabled: bool) -> tuple[dict[str, Any], int]:
    paths = _paths(args, create=True)
    name = _require_label(args.name, "source name")
    connection = connect(paths)
    _source_row(connection, name)
    with connection:
        connection.execute(
            "UPDATE source SET enabled=?, updated_at=CURRENT_TIMESTAMP WHERE name=?",
            (1 if enabled else 0, name),
        )
    row = connection.execute("SELECT * FROM source WHERE name=?", (name,)).fetchone()
    snapshot = stats(connection, paths)
    connection.close()
    if snapshot["sourcesEnabled"] == 0:
        phase = "sources_disabled"
    elif enabled and row["last_refresh_status"] is None:
        phase = "awaiting_refresh"
    elif _semantic_ready(snapshot):
        phase = "ready_hybrid"
    else:
        phase = "ready_lexical"
    write_state(paths, phase, sourcesConfigured=True)
    return {"source": dict(row)}, 0


def cmd_source_enable(args) -> tuple[dict[str, Any], int]:
    return cmd_source_toggle(args, True)


def cmd_source_disable(args) -> tuple[dict[str, Any], int]:
    return cmd_source_toggle(args, False)


def cmd_source_remove(args) -> tuple[dict[str, Any], int]:
    if not args.yes:
        raise CorpusSearchError(
            "source removal deletes its generated index rows; pass --yes only after human confirmation",
            code="confirmation_required",
            exit_code=2,
        )
    paths = _paths(args, create=True)
    name = _require_label(args.name, "source name")
    connection = connect(paths)
    source = _source_row(connection, name)
    assets = int(
        connection.execute(
            "SELECT count(*) FROM asset WHERE source_id=?", (source["source_id"],)
        ).fetchone()[0]
    )
    chunk_ids = [
        int(row[0])
        for row in connection.execute(
            "SELECT c.chunk_id FROM chunk c JOIN asset a ON a.asset_id=c.asset_id WHERE a.source_id=?",
            (source["source_id"],),
        )
    ]
    try:
        delete_vectors_for_chunks(connection, chunk_ids)
    except CorpusSearchError:
        pass
    with connection:
        connection.execute("DELETE FROM source WHERE source_id=?", (source["source_id"],))
    snapshot = stats(connection, paths)
    connection.close()
    if snapshot["sourcesTotal"] == 0:
        phase = "awaiting_sources"
    elif snapshot["sourcesEnabled"] == 0:
        phase = "sources_disabled"
    elif _semantic_ready(snapshot):
        phase = "ready_hybrid"
    else:
        phase = "ready_lexical"
    write_state(paths, phase, sourcesConfigured=bool(snapshot["sourcesTotal"]))
    return {
        "removed": name,
        "generatedAssetsDeleted": assets,
        "generatedChunksDeleted": len(chunk_ids),
        "sourceFilesDeleted": 0,
    }, 0


def cmd_refresh(args) -> tuple[dict[str, Any], int]:
    if args.max_runtime_seconds is not None and args.max_runtime_seconds < 1:
        raise CorpusSearchError("--max-runtime-seconds must be positive", code="invalid_runtime_limit", exit_code=2)
    paths = _paths(args, create=True)
    connection = connect(paths)
    result, exit_code = refresh_all(
        connection,
        paths,
        max_runtime_seconds=args.max_runtime_seconds,
        embed=not args.no_embeddings,
    )
    connection.close()
    return result, exit_code


def _metadata_filters(values: list[str]) -> list[tuple[str, Any]]:
    filters: list[tuple[str, Any]] = []
    for value in values:
        if "=" not in value:
            raise CorpusSearchError(
                f"metadata filter must be key=value: {value}",
                code="invalid_metadata_filter",
                exit_code=2,
            )
        key, raw = value.split("=", 1)
        filters.append((key.strip(), parse_scalar(raw)))
    return filters


def cmd_query(args) -> tuple[dict[str, Any], int]:
    if args.top < 1 or args.top > 100:
        raise CorpusSearchError("--top must be between 1 and 100", code="invalid_top", exit_code=2)
    paths = _paths(args, create=True)
    connection = connect(paths)
    result = search(
        connection,
        paths,
        args.query,
        top_k=args.top,
        kind=args.kind,
        source=args.source,
        role=args.role,
        user=args.user,
        since=args.since,
        until=args.until,
        metadata=_metadata_filters(args.meta),
        mode=args.mode,
        rerank_mode=args.rerank,
    )
    connection.close()
    return result, 0


def cmd_status(args) -> tuple[dict[str, Any], int]:
    paths = _paths(args, create=True)
    connection = connect(paths)
    snapshot = stats(connection, paths)
    connection.close()
    return {"state": read_state(paths), "stats": snapshot}, 0


def _repair_sqlite_vec() -> dict[str, Any]:
    completed = subprocess.run(
        ["python3", "-m", "pip", "install", "--user", SQLITE_VEC_REQUIREMENT],
        capture_output=True,
        text=True,
        timeout=180,
        check=False,
    )
    if completed.returncode != 0:
        raise CorpusSearchError(
            "failed to install the pinned sqlite-vec dependency",
            code="dependency_install_failed",
            exit_code=4,
            details={"stderrTail": completed.stderr[-500:]},
        )
    installed = sqlite_vec_installed_version()
    if installed != SQLITE_VEC_VERSION:
        raise CorpusSearchError(
            f"sqlite-vec repair completed but version {installed!r} is active",
            code="dependency_version_mismatch",
            exit_code=4,
        )
    return {"repaired": True, "sqliteVecVersion": installed}


def cmd_doctor(args) -> tuple[dict[str, Any], int]:
    paths = _paths(args, create=True)
    installed = sqlite_vec_installed_version()
    repair: dict[str, Any] | None = None
    if args.repair and installed != SQLITE_VEC_VERSION:
        repair = _repair_sqlite_vec()
        installed = sqlite_vec_installed_version()
    connection = connect(paths)
    vector_load_ok = False
    vector_error: str | None = None
    if installed is not None:
        try:
            load_sqlite_vec(connection)
            vector_load_ok = True
        except (CorpusSearchError, sqlite3.Error) as exc:
            vector_error = str(exc)
    checks = {
        "database": paths.db.exists(),
        # Connecting executes schema.sql, including the FTS5 virtual table. Its
        # presence is a more reliable runtime check than compile-option metadata,
        # which some distributors omit even when FTS5 is available.
        "fts5": connection.execute(
            "SELECT 1 FROM sqlite_master WHERE name='chunk_fts' AND type='table'"
        ).fetchone()
        is not None,
        "secureFetch": shutil.which("secure-fetch") is not None,
        "sqliteVecVersion": installed,
        "sqliteVecPinned": installed == SQLITE_VEC_VERSION,
        "sqliteVecLoads": vector_load_ok,
        "legacyDatabaseDetected": legacy_db_path().is_file(),
        "legacyDatabasePath": str(legacy_db_path()) if legacy_db_path().is_file() else None,
    }
    connection.close()
    healthy_lexical = bool(checks["database"] and checks["fts5"])
    return {
        "workspaceId": paths.workspace_id,
        "healthyLexical": healthy_lexical,
        "healthySemantic": bool(healthy_lexical and checks["secureFetch"] and checks["sqliteVecPinned"] and vector_load_ok),
        "checks": checks,
        "vectorError": vector_error,
        "repair": repair,
        "note": "A detected legacy database is reported only; it is never modified or migrated automatically.",
    }, 0 if healthy_lexical else 1


def cmd_embeddings_rebuild(args) -> tuple[dict[str, Any], int]:
    if not args.yes:
        raise CorpusSearchError(
            "embedding rebuild deletes generated vectors and requires --yes after human confirmation",
            code="confirmation_required",
            exit_code=2,
        )
    paths = _paths(args, create=True)
    connection = connect(paths)
    result = rebuild_embeddings(connection)
    connection.close()
    write_state(paths, "ready_lexical", embeddingsRebuildPending=True)
    return result, 0


def _workspace_flag(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--workspace-id", required=True)


def build_parser() -> argparse.ArgumentParser:
    parser = JsonArgumentParser(prog="corpus-search")
    commands = parser.add_subparsers(dest="command", required=True)

    workspace = commands.add_parser("workspace")
    workspace_commands = workspace.add_subparsers(dest="workspace_command", required=True)
    workspace_init = workspace_commands.add_parser("init")
    _workspace_flag(workspace_init)
    workspace_init.set_defaults(func=cmd_workspace_init)

    source = commands.add_parser("source")
    source_commands = source.add_subparsers(dest="source_command", required=True)
    source_add = source_commands.add_parser("add")
    _workspace_flag(source_add)
    source_add.add_argument("--name", required=True)
    source_add.add_argument("--path", required=True)
    source_add.add_argument("--kind", required=True)
    source_add.add_argument("--pattern", default=DEFAULT_PATTERN)
    source_add.set_defaults(func=cmd_source_add)
    source_list = source_commands.add_parser("list")
    _workspace_flag(source_list)
    source_list.set_defaults(func=cmd_source_list)
    source_update = source_commands.add_parser("update")
    _workspace_flag(source_update)
    source_update.add_argument("--name", required=True)
    source_update.add_argument("--path")
    source_update.add_argument("--kind")
    source_update.add_argument("--pattern")
    source_update.set_defaults(func=cmd_source_update)
    for name, func in (("enable", cmd_source_enable), ("disable", cmd_source_disable)):
        sub = source_commands.add_parser(name)
        _workspace_flag(sub)
        sub.add_argument("--name", required=True)
        sub.set_defaults(func=func)
    source_remove = source_commands.add_parser("remove")
    _workspace_flag(source_remove)
    source_remove.add_argument("--name", required=True)
    source_remove.add_argument("--yes", action="store_true")
    source_remove.set_defaults(func=cmd_source_remove)

    refresh = commands.add_parser("refresh")
    _workspace_flag(refresh)
    refresh.add_argument("--max-runtime-seconds", type=int)
    refresh.add_argument("--no-embeddings", action="store_true")
    refresh.set_defaults(func=cmd_refresh)

    query = commands.add_parser("query")
    _workspace_flag(query)
    query.add_argument("query")
    query.add_argument("--top", type=int, default=DEFAULT_TOP_K)
    query.add_argument("--kind")
    query.add_argument("--source")
    query.add_argument("--role")
    query.add_argument("--user")
    query.add_argument("--since")
    query.add_argument("--until")
    query.add_argument("--meta", action="append", default=[])
    query.add_argument("--mode", choices=("auto", "lexical", "hybrid"), default="auto")
    query.add_argument("--rerank", choices=("auto", "on", "off"), default="auto")
    query.set_defaults(func=cmd_query)

    status = commands.add_parser("status")
    _workspace_flag(status)
    status.set_defaults(func=cmd_status)

    doctor = commands.add_parser("doctor")
    _workspace_flag(doctor)
    doctor.add_argument("--repair", action="store_true")
    doctor.set_defaults(func=cmd_doctor)

    embeddings = commands.add_parser("embeddings")
    embedding_commands = embeddings.add_subparsers(dest="embeddings_command", required=True)
    rebuild = embedding_commands.add_parser("rebuild")
    _workspace_flag(rebuild)
    rebuild.add_argument("--yes", action="store_true")
    rebuild.set_defaults(func=cmd_embeddings_rebuild)
    return parser


def main(argv: list[str] | None = None) -> int:
    try:
        args = build_parser().parse_args(argv)
        func: Callable[[Any], tuple[dict[str, Any], int]] = args.func
        result, exit_code = func(args)
        print(json.dumps({"ok": True, **result}, ensure_ascii=False, sort_keys=True))
        return exit_code
    except CorpusSearchError as exc:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": {"code": exc.code, "message": exc.message, **exc.details},
                },
                ensure_ascii=False,
                sort_keys=True,
            )
        )
        return exc.exit_code
    except BrokenPipeError:
        return 0
    except Exception as exc:  # Keep the public shell contract JSON even for defects.
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": {"code": "internal_error", "message": str(exc)[:500]},
                },
                ensure_ascii=False,
                sort_keys=True,
            )
        )
        return 1
