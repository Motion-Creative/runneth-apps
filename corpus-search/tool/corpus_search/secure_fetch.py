from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from .constants import (
    SECURE_FETCH_MAX_RESPONSE_BYTES,
    SECURE_FETCH_SECRET_KEY,
    SECURE_FETCH_TIMEOUT_MS,
)
from .errors import SecureFetchError
from .paths import WorkspacePaths
from .state import write_state


def _read_json_file(path: Path, max_bytes: int) -> dict[str, Any]:
    if not path.is_file():
        raise SecureFetchError("secure-fetch did not create its result file", code="secure_fetch_missing_file")
    if path.stat().st_size > max_bytes + 262_144:
        raise SecureFetchError("secure-fetch result exceeded the configured byte limit", code="secure_fetch_oversize")
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SecureFetchError("secure-fetch returned malformed result JSON", code="secure_fetch_malformed") from exc
    if not isinstance(value, dict):
        raise SecureFetchError("secure-fetch result was not an object", code="secure_fetch_malformed")
    return value


def post_json(
    paths: WorkspacePaths,
    *,
    url: str,
    payload: dict[str, Any],
    timeout_ms: int = SECURE_FETCH_TIMEOUT_MS,
    max_response_bytes: int = SECURE_FETCH_MAX_RESPONSE_BYTES,
) -> dict[str, Any]:
    paths.temp.mkdir(parents=True, exist_ok=True)
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    with tempfile.TemporaryDirectory(prefix="secure-fetch-", dir=paths.temp) as temp_dir:
        working = Path(temp_dir)
        try:
            completed = subprocess.run(
                [
                    "secure-fetch",
                    "run",
                    "--url",
                    url,
                    "--method",
                    "POST",
                    "--secret-key",
                    SECURE_FETCH_SECRET_KEY,
                    "--header",
                    "Content-Type: application/json",
                    "--body",
                    body,
                    "--timeout-ms",
                    str(timeout_ms),
                    "--max-response-bytes",
                    str(max_response_bytes),
                ],
                cwd=working,
                capture_output=True,
                text=True,
                timeout=max(5, timeout_ms // 1000 + 10),
                check=False,
            )
        except FileNotFoundError as exc:
            raise SecureFetchError("secure-fetch is not available in this runtime", code="secure_fetch_missing") from exc
        except subprocess.TimeoutExpired as exc:
            raise SecureFetchError("secure-fetch timed out", code="secure_fetch_timeout") from exc

        try:
            envelope = json.loads(completed.stdout)
        except json.JSONDecodeError as exc:
            raise SecureFetchError("secure-fetch returned malformed shell JSON", code="secure_fetch_malformed") from exc
        if not isinstance(envelope, dict) or not isinstance(envelope.get("file"), str):
            raise SecureFetchError("secure-fetch returned an invalid shell envelope", code="secure_fetch_malformed")

        result_path = (working / envelope["file"]).resolve()
        try:
            result_path.relative_to(working.resolve())
        except ValueError as exc:
            raise SecureFetchError("secure-fetch result path escaped the invocation directory", code="secure_fetch_unsafe_file") from exc
        result = _read_json_file(result_path, max_response_bytes)

        if completed.returncode != 0 or envelope.get("successful") is not True or result.get("successful") is not True:
            message = result.get("message")
            safe_message = str(message)[:300] if isinstance(message, str) else "secure-fetch request failed"
            code = "credential_needed" if "secret" in safe_message.lower() else "secure_fetch_failed"
            if code == "credential_needed":
                write_state(paths, "credential_needed", credentialErrorCode=code)
            raise SecureFetchError(safe_message, code=code)

        status = result.get("status")
        if not isinstance(status, int):
            raise SecureFetchError("secure-fetch omitted the HTTP status", code="secure_fetch_malformed")
        if result.get("bodyTruncated") is True:
            raise SecureFetchError("secure-fetch truncated the upstream response", code="secure_fetch_truncated", status=status)
        if result.get("ok") is not True:
            code = "credential_rejected" if status in {401, 403} else "openai_http_error"
            if code == "credential_rejected":
                write_state(
                    paths,
                    "credential_needed",
                    credentialErrorCode=code,
                    credentialHttpStatus=status,
                )
            raise SecureFetchError(f"OpenAI returned HTTP {status}", code=code, status=status)

        response_body = result.get("body")
        try:
            parsed = response_body if isinstance(response_body, dict) else json.loads(str(response_body))
        except json.JSONDecodeError as exc:
            raise SecureFetchError("OpenAI returned malformed JSON", code="openai_malformed") from exc
        if not isinstance(parsed, dict):
            raise SecureFetchError("OpenAI returned an unexpected JSON value", code="openai_malformed")
        return parsed
