"""Embedding helpers, configurable via config.json.

Calls the embeddings endpoint (default OpenAI) through `secure-fetch`, which
keeps the API key out of process memory. Captured stdout is written to a
temp file rather than `subprocess.run(capture_output=True)` because the
sandbox harness throttles subprocess pipes.
"""
from __future__ import annotations

import json
import os
import struct
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Sequence

# Resolve config from the same TOOL_DIR as store.py.
TOOL_DIR = Path(__file__).resolve().parent.parent

from lib import config as config_mod  # noqa: E402

_CFG = config_mod.load(TOOL_DIR)["embed"]
DEFAULT_MODEL = _CFG["model"]
DEFAULT_DIM = _CFG["dim"]
DEFAULT_BATCH = _CFG["batch_size"]
ENDPOINT = _CFG["endpoint"]
SECRET_KEY = _CFG["secret_key"]
MAX_RESPONSE_BYTES = _CFG["max_response_bytes"]


def embed_batch(texts: Sequence[str], *, model: str | None = None,
                dim: int | None = None, max_retries: int = 3) -> list[list[float]]:
    """Embed up to a batch of texts. Returns list of float vectors."""
    if not texts:
        return []
    model = model or DEFAULT_MODEL
    dim = dim or DEFAULT_DIM
    payload = {"model": model, "input": list(texts), "dimensions": dim}
    body = json.dumps(payload)

    last_err: str | None = None
    for attempt in range(1, max_retries + 1):
        with tempfile.NamedTemporaryFile("w+b", delete=False, suffix=".sf.json") as tf:
            stdout_path = tf.name
        try:
            with open(stdout_path, "wb") as out_f:
                rc = subprocess.run(
                    [
                        "secure-fetch", "run",
                        "--url", ENDPOINT,
                        "--method", "POST",
                        "--secret-key", SECRET_KEY,
                        "--header", "Content-Type: application/json",
                        "--body", body,
                        "--timeout-ms", "120000",
                        "--max-response-bytes", str(MAX_RESPONSE_BYTES),
                    ],
                    stdout=out_f, stderr=subprocess.PIPE,
                ).returncode
            with open(stdout_path, "r") as f:
                raw = f.read()
        finally:
            try: os.unlink(stdout_path)
            except OSError: pass

        if rc != 0:
            last_err = f"secure-fetch exit={rc}: {raw[:500]}"
            if attempt == max_retries:
                raise RuntimeError(last_err)
            time.sleep(1.5 * attempt); continue

        try:
            resp = json.loads(raw)
        except json.JSONDecodeError as e:
            last_err = f"could not parse secure-fetch output: {e}\n{raw[:500]}"
            if attempt == max_retries:
                raise RuntimeError(last_err)
            time.sleep(1.5 * attempt); continue

        if resp.get("bodyTruncated"):
            raise RuntimeError(
                f"secure-fetch truncated the response (batch too large for cap). "
                f"reduce embed.batch_size or embed.dim in config.json."
            )
        if not resp.get("ok"):
            raise RuntimeError(
                f"upstream not ok: status={resp.get('status')} body={str(resp.get('body'))[:300]}"
            )

        body_raw = resp.get("body")
        body_obj = None
        if isinstance(body_raw, dict):
            body_obj = body_raw
        elif isinstance(body_raw, str):
            try:
                body_obj = json.loads(body_raw)
            except Exception:
                body_obj = None
        if body_obj is None and "data" in resp:
            body_obj = resp
        if not isinstance(body_obj, dict) or "data" not in body_obj:
            raise RuntimeError(f"unexpected embeddings response shape: {str(resp)[:500]}")

        return [row["embedding"] for row in body_obj["data"]]
    raise RuntimeError("unreachable")


def to_blob(vec: Sequence[float]) -> bytes:
    return struct.pack(f"{len(vec)}f", *vec)
