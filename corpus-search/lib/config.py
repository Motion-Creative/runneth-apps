"""Load corpus-search configuration with sensible defaults.

Reads `<TOOL_DIR>/config.json` if present; falls back to `config.example.json`;
falls back to hardcoded defaults if both are missing. Comment fields (keys
starting with `_`) are ignored. Allows either nested config or flat overrides.
"""
from __future__ import annotations

import json
from pathlib import Path

DEFAULTS = {
    "embed": {
        "model": "text-embedding-3-small",
        "dim": 256,
        "batch_size": 24,
        "endpoint": "https://api.openai.com/v1/embeddings",
        "secret_key": "OPENAI_API_KEY",
        "max_response_bytes": 1990000,
    },
    "search": {
        "candidate_pool": 120,
        "rrf_k": 60,
        "top_k_default": 15,
    },
    "demo": {
        "queries": [
            "summary",
            "key insight",
            "result",
        ],
    },
}


def _strip_comments(d):
    """Remove keys whose names start with `_` (treated as comments)."""
    if isinstance(d, dict):
        return {k: _strip_comments(v) for k, v in d.items() if not k.startswith("_")}
    if isinstance(d, list):
        return [_strip_comments(x) for x in d]
    return d


def _merge(base: dict, over: dict) -> dict:
    out = dict(base)
    for k, v in over.items():
        if k in out and isinstance(out[k], dict) and isinstance(v, dict):
            out[k] = _merge(out[k], v)
        else:
            out[k] = v
    return out


def load(tool_dir: Path) -> dict:
    cfg = json.loads(json.dumps(DEFAULTS))  # deep copy
    for name in ("config.example.json", "config.json"):
        p = tool_dir / name
        if p.exists():
            try:
                file_cfg = _strip_comments(json.loads(p.read_text()))
                cfg = _merge(cfg, file_cfg)
            except json.JSONDecodeError as e:
                raise RuntimeError(f"invalid JSON in {p}: {e}")
    return cfg
