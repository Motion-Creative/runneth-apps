from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from typing import Any

from .constants import PACKAGE_VERSION, STATE_SCHEMA_VERSION
from .paths import WorkspacePaths


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def read_state(paths: WorkspacePaths) -> dict[str, Any] | None:
    try:
        parsed = json.loads(paths.state.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None
    except (OSError, json.JSONDecodeError):
        return {"phase": "degraded", "stateError": "state_file_unreadable"}
    return parsed if isinstance(parsed, dict) else {"phase": "degraded", "stateError": "state_file_invalid"}


def write_state(paths: WorkspacePaths, phase: str, **updates: Any) -> dict[str, Any]:
    paths.root.mkdir(parents=True, exist_ok=True)
    current = read_state(paths) or {}
    state: dict[str, Any] = {
        **current,
        "schemaVersion": STATE_SCHEMA_VERSION,
        "packageVersion": PACKAGE_VERSION,
        "workspaceId": paths.workspace_id,
        "phase": phase,
        "updatedAt": _now(),
        **updates,
    }
    fd, temp_path = tempfile.mkstemp(prefix="state-", suffix=".json", dir=paths.root)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(state, handle, indent=2, sort_keys=True)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_path, paths.state)
    finally:
        try:
            os.unlink(temp_path)
        except FileNotFoundError:
            pass
    return state
