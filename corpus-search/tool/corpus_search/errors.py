from __future__ import annotations

from typing import Any


class CorpusSearchError(Exception):
    def __init__(
        self,
        message: str,
        *,
        code: str = "corpus_search_error",
        exit_code: int = 1,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.exit_code = exit_code
        self.details = details or {}


class SecureFetchError(CorpusSearchError):
    def __init__(
        self,
        message: str,
        *,
        code: str = "secure_fetch_error",
        status: int | None = None,
    ) -> None:
        details = {"status": status} if status is not None else {}
        super().__init__(message, code=code, exit_code=4, details=details)
        self.status = status
