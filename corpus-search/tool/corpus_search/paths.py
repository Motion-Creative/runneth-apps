from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path

from .errors import CorpusSearchError


_WORKSPACE_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")


def validate_workspace_id(workspace_id: str) -> str:
    if not _WORKSPACE_ID_RE.fullmatch(workspace_id):
        raise CorpusSearchError(
            "workspace id must be 1-128 safe characters: letters, digits, dot, underscore, or hyphen",
            code="invalid_workspace_id",
            exit_code=2,
        )
    return workspace_id


def state_root() -> Path:
    configured = os.environ.get("CORPUS_SEARCH_STATE_ROOT")
    return Path(configured).expanduser().resolve() if configured else Path(
        "/agent/tools/corpus-search-data/workspaces"
    )


def legacy_db_path() -> Path:
    configured = os.environ.get("CORPUS_SEARCH_LEGACY_DB")
    return Path(configured).expanduser().resolve() if configured else Path(
        "/agent/tools/corpus-search/corpus.db"
    )


@dataclass(frozen=True)
class WorkspacePaths:
    workspace_id: str
    root: Path
    db: Path
    state: Path
    temp: Path

    @classmethod
    def resolve(cls, workspace_id: str, *, create: bool = False) -> "WorkspacePaths":
        safe_id = validate_workspace_id(workspace_id)
        root = state_root() / safe_id
        paths = cls(
            workspace_id=safe_id,
            root=root,
            db=root / "corpus.db",
            state=root / "state.json",
            temp=root / "tmp",
        )
        if create:
            paths.root.mkdir(parents=True, exist_ok=True)
            paths.temp.mkdir(parents=True, exist_ok=True)
        return paths
