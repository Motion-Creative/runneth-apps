"""LLM rerank pass over hybrid retrieval candidates.

Given a user query and the candidate hits returned by the hybrid search step,
ask a reasoning model (default: gpt-4.1-mini via OpenAI) to read each candidate
against the query and return the top K that actually match the user's intent.
This catches false positives that hybrid retrieval surfaces because of topic
or keyword similarity but that don't actually answer what was asked.

Configuration lives in `config.json -> rerank`. Off by default at the CLI;
turned on per-query via --rerank or programmatically via use_rerank=True.

If the rerank call fails for any reason (network, malformed JSON, timeout),
this module returns the original hits unchanged so a query never breaks
because of a flaky rerank.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Sequence

TOOL_DIR = Path(__file__).resolve().parent.parent

from lib import config as config_mod  # noqa: E402

_CFG = config_mod.load(TOOL_DIR)["rerank"]


@dataclass
class RerankOutcome:
    used: bool
    elapsed_ms: float
    error: str | None
    pre_count: int
    post_count: int
    model: str | None


def _fmt_candidate(idx: int, hit, char_budget: int) -> str:
    """Render one candidate compactly for the LLM prompt."""
    text = (hit.text or "").replace("\n", " ").strip()
    if len(text) > char_budget:
        text = text[:char_budget] + "..."
    bits = []
    bits.append(f"kind={hit.asset_kind or '-'}")
    if hit.role: bits.append(f"role={hit.role}")
    if hit.asset_workspace: bits.append(f"ws=\"{hit.asset_workspace}\"")
    if hit.asset_user: bits.append(f"user={hit.asset_user}")
    if hit.asset_event_at: bits.append(f"date={hit.asset_event_at}")
    if hit.t_start_s is not None: bits.append(f"t_start_s={hit.t_start_s:.0f}")
    header = " ".join(bits)
    return f"[{idx}] {header}\nTEXT: {text}"


def _build_prompt(query: str, hits, top_k: int, char_budget: int) -> tuple[str, str]:
    """Return (system_prompt, user_prompt)."""
    system = (
        "You are a retrieval reranker. Read each candidate against the user query "
        "and decide which best match the user's INTENT, not just topic similarity. "
        "Return strict JSON only."
    )
    candidates = "\n\n".join(_fmt_candidate(i + 1, h, char_budget) for i, h in enumerate(hits))
    user = (
        f"USER QUERY:\n{query}\n\n"
        f"You will see {len(hits)} numbered candidates. Pick the up to {top_k} that best "
        f"match the user's intent, in order of relevance. If fewer than {top_k} truly fit, "
        f"return only those (do not pad). Skip duplicates and templated near-duplicates.\n\n"
        f"Output ONLY a JSON array. Each element has:\n"
        f'  - "i" (the candidate number, integer)\n'
        f'  - "reason" (one short sentence explaining why this matches the intent)\n\n'
        f"Example: [{{\"i\": 7, \"reason\": \"User explicitly says the output was wrong.\"}}, ...]\n\n"
        f"CANDIDATES:\n{candidates}\n\n"
        f"Return ONLY the JSON array. No prose, no markdown fences, no commentary."
    )
    return system, user


_JSON_ARRAY_RE = re.compile(r"\[\s*\{.*?\}\s*\]", re.DOTALL)


def _parse_response(raw: str) -> list[dict] | None:
    """Try hard to find a JSON array of {i, reason} objects in the response."""
    raw = raw.strip()
    # Strip markdown code fences if the model added them despite our instructions.
    if raw.startswith("```"):
        raw = raw.split("```", 2)[-1].strip() if raw.count("```") >= 2 else raw
        if raw.endswith("```"):
            raw = raw[:-3].strip()
    try:
        out = json.loads(raw)
    except json.JSONDecodeError:
        m = _JSON_ARRAY_RE.search(raw)
        if not m:
            return None
        try:
            out = json.loads(m.group(0))
        except json.JSONDecodeError:
            return None
    if not isinstance(out, list):
        return None
    cleaned = []
    for entry in out:
        if not isinstance(entry, dict): continue
        i = entry.get("i")
        if isinstance(i, str):
            try: i = int(i)
            except ValueError: continue
        if not isinstance(i, int): continue
        cleaned.append({"i": i, "reason": str(entry.get("reason", ""))[:300]})
    return cleaned or None


def _call_chat_completions(system: str, user: str, model: str, timeout_ms: int) -> str:
    """Call OpenAI chat completions via secure-fetch and return the assistant content."""
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0,
        "response_format": {"type": "json_object"} if False else None,  # kept null; we parse loose JSON
    }
    # response_format with "json_object" needs the prompt to mention JSON; we prefer freeform array.
    payload = {k: v for k, v in payload.items() if v is not None}
    body = json.dumps(payload)

    with tempfile.NamedTemporaryFile("w+b", delete=False, suffix=".rerank.json") as tf:
        stdout_path = tf.name
    try:
        with open(stdout_path, "wb") as out_f:
            rc = subprocess.run(
                [
                    "secure-fetch", "run",
                    "--url", _CFG["endpoint"],
                    "--method", "POST",
                    "--secret-key", _CFG["auth_env"],
                    "--header", "Content-Type: application/json",
                    "--body", body,
                    "--timeout-ms", str(timeout_ms),
                    "--max-response-bytes", "1990000",
                ],
                stdout=out_f, stderr=subprocess.PIPE,
            ).returncode
        with open(stdout_path, "r") as f:
            raw = f.read()
    finally:
        try: os.unlink(stdout_path)
        except OSError: pass

    if rc != 0:
        raise RuntimeError(f"secure-fetch exit={rc}: {raw[:500]}")

    resp = json.loads(raw)
    if resp.get("bodyTruncated"):
        raise RuntimeError("secure-fetch truncated rerank response")
    if not resp.get("ok"):
        raise RuntimeError(f"upstream not ok: status={resp.get('status')} body={str(resp.get('body'))[:300]}")
    body_raw = resp.get("body")
    body_obj = body_raw if isinstance(body_raw, dict) else json.loads(body_raw)
    return body_obj["choices"][0]["message"]["content"]


def rerank_hits(query: str, hits, *, top_k: int | None = None,
                model: str | None = None, char_budget: int | None = None,
                timeout_ms: int | None = None) -> tuple[list, RerankOutcome]:
    """Rerank a list of SearchHit objects. Returns (reranked_hits, outcome).

    On any failure, returns the original hits unchanged with outcome.error set.
    Each surviving hit gets `extra["rerank_reason"]` and `extra["rerank_rank"]`.
    """
    import time
    top_k = top_k or _CFG["output_top_k"]
    model = model or _CFG["model"]
    char_budget = char_budget or _CFG["chunk_char_budget"]
    timeout_ms = timeout_ms or _CFG["timeout_ms"]
    pre = len(hits)
    start = time.time()

    if not hits:
        return list(hits), RerankOutcome(used=False, elapsed_ms=0.0, error=None,
                                         pre_count=0, post_count=0, model=model)

    try:
        system, user = _build_prompt(query, hits, top_k, char_budget)
        raw = _call_chat_completions(system, user, model, timeout_ms)
        parsed = _parse_response(raw)
        if not parsed:
            raise RuntimeError(f"could not parse rerank JSON from response: {raw[:300]}")
    except Exception as e:
        return list(hits), RerankOutcome(used=False,
                                         elapsed_ms=round((time.time() - start) * 1000, 1),
                                         error=str(e), pre_count=pre, post_count=pre, model=model)

    # Apply: hits are 1-indexed in the prompt
    out = []
    seen = set()
    for rank, entry in enumerate(parsed[:top_k], 1):
        idx = entry["i"] - 1
        if idx < 0 or idx >= len(hits): continue
        if idx in seen: continue
        seen.add(idx)
        h = hits[idx]
        # mutate dataclass extra dict
        if not isinstance(getattr(h, "extra", None), dict):
            h.extra = {}
        h.extra["rerank_reason"] = entry["reason"]
        h.extra["rerank_rank"] = rank
        out.append(h)

    return out, RerankOutcome(used=True,
                              elapsed_ms=round((time.time() - start) * 1000, 1),
                              error=None, pre_count=pre, post_count=len(out), model=model)
