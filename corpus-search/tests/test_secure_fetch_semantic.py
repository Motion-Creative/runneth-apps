from __future__ import annotations

import json
import os
import stat
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


TOOL_ROOT = Path(__file__).resolve().parents[1] / "tool"
sys.path.insert(0, str(TOOL_ROOT))

from corpus_search.errors import CorpusSearchError, SecureFetchError  # noqa: E402
from corpus_search.paths import WorkspacePaths  # noqa: E402
from corpus_search.secure_fetch import post_json  # noqa: E402
from corpus_search.semantic import embed_texts, rerank  # noqa: E402
from corpus_search.state import read_state  # noqa: E402


FAKE_SECURE_FETCH = r'''#!/usr/bin/env python3
import json
import os
from pathlib import Path

mode = os.environ.get("FAKE_SECURE_MODE", "success")
workdir = Path.cwd() / "workdir"
workdir.mkdir(exist_ok=True)
result = workdir / "result.json"
if mode == "malformed-shell":
    print("not-json")
    raise SystemExit(0)
if mode == "failure":
    result.write_text(json.dumps({"successful": False, "message": "stored secret is missing"}))
    print(json.dumps({"successful": False, "file": "./workdir/result.json"}))
    raise SystemExit(1)
if mode in {"401", "403"}:
    status = int(mode)
    result.write_text(json.dumps({"successful": True, "status": status, "ok": False, "url": "https://api.openai.com", "body": "{}", "bodyTruncated": False}))
    print(json.dumps({"successful": True, "file": "./workdir/result.json", "data": {"status": status, "ok": False, "bodyTruncated": False}}))
    raise SystemExit(0)
if mode == "truncated":
    result.write_text(json.dumps({"successful": True, "status": 200, "ok": True, "url": "https://api.openai.com", "body": "{}", "bodyTruncated": True}))
    print(json.dumps({"successful": True, "file": "./workdir/result.json", "data": {"status": 200, "ok": True, "bodyTruncated": True}}))
    raise SystemExit(0)
if mode == "malformed-body":
    result.write_text(json.dumps({"successful": True, "status": 200, "ok": True, "url": "https://api.openai.com", "body": "{", "bodyTruncated": False}))
    print(json.dumps({"successful": True, "file": "./workdir/result.json", "data": {"status": 200, "ok": True, "bodyTruncated": False}}))
    raise SystemExit(0)
body = json.dumps({"data": [{"index": 0, "embedding": [0.0] * 256}]})
result.write_text(json.dumps({"successful": True, "status": 200, "ok": True, "url": "https://api.openai.com", "body": body, "bodyTruncated": False}))
print(json.dumps({"successful": True, "file": "./workdir/result.json", "data": {"status": 200, "ok": True, "bodyTruncated": False}}))
'''


class SecureFetchTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        root = Path(self.temp.name)
        bin_dir = root / "bin"
        bin_dir.mkdir()
        executable = bin_dir / "secure-fetch"
        executable.write_text(FAKE_SECURE_FETCH, encoding="utf-8")
        executable.chmod(executable.stat().st_mode | stat.S_IXUSR)
        self.env = mock.patch.dict(
            os.environ,
            {
                "PATH": f"{bin_dir}:{os.environ.get('PATH', '')}",
                "CORPUS_SEARCH_STATE_ROOT": str(root / "state"),
            },
            clear=False,
        )
        self.env.start()
        self.paths = WorkspacePaths.resolve("workspace", create=True)

    def tearDown(self) -> None:
        self.env.stop()
        self.temp.cleanup()

    def test_reads_body_from_result_file_not_shell_envelope(self) -> None:
        response = post_json(
            self.paths,
            url="https://api.openai.com/v1/embeddings",
            payload={"input": ["safe text"]},
        )
        self.assertEqual(len(response["data"][0]["embedding"]), 256)

    def test_missing_secret_and_rejected_secret_have_stable_codes(self) -> None:
        with mock.patch.dict(os.environ, {"FAKE_SECURE_MODE": "failure"}):
            with self.assertRaises(SecureFetchError) as missing:
                post_json(self.paths, url="https://api.openai.com/v1/embeddings", payload={})
        self.assertEqual(missing.exception.code, "credential_needed")
        self.assertEqual(read_state(self.paths)["phase"], "credential_needed")
        with mock.patch.dict(os.environ, {"FAKE_SECURE_MODE": "401"}):
            with self.assertRaises(SecureFetchError) as rejected:
                post_json(self.paths, url="https://api.openai.com/v1/embeddings", payload={})
        self.assertEqual(rejected.exception.code, "credential_rejected")
        self.assertEqual(rejected.exception.status, 401)
        self.assertEqual(read_state(self.paths)["credentialHttpStatus"], 401)
        with mock.patch.dict(os.environ, {"FAKE_SECURE_MODE": "403"}):
            with self.assertRaises(SecureFetchError) as forbidden:
                post_json(self.paths, url="https://api.openai.com/v1/embeddings", payload={})
        self.assertEqual(forbidden.exception.code, "credential_rejected")
        self.assertEqual(forbidden.exception.status, 403)
        self.assertEqual(read_state(self.paths)["credentialHttpStatus"], 403)

    def test_truncation_timeout_and_malformed_upstream_json(self) -> None:
        with mock.patch.dict(os.environ, {"FAKE_SECURE_MODE": "truncated"}):
            with self.assertRaises(SecureFetchError) as truncated:
                post_json(self.paths, url="https://api.openai.com/v1/embeddings", payload={})
        self.assertEqual(truncated.exception.code, "secure_fetch_truncated")

        with mock.patch.dict(os.environ, {"FAKE_SECURE_MODE": "malformed-body"}):
            with self.assertRaises(SecureFetchError) as malformed:
                post_json(self.paths, url="https://api.openai.com/v1/embeddings", payload={})
        self.assertEqual(malformed.exception.code, "openai_malformed")

        with mock.patch("corpus_search.secure_fetch.subprocess.run", side_effect=__import__("subprocess").TimeoutExpired("secure-fetch", 1)):
            with self.assertRaises(SecureFetchError) as timeout:
                post_json(self.paths, url="https://api.openai.com/v1/embeddings", payload={})
        self.assertEqual(timeout.exception.code, "secure_fetch_timeout")

    def test_malformed_shell_output_fails_without_echoing_payload(self) -> None:
        with mock.patch.dict(os.environ, {"FAKE_SECURE_MODE": "malformed-shell"}):
            with self.assertRaises(SecureFetchError) as error:
                post_json(
                    self.paths,
                    url="https://api.openai.com/v1/embeddings",
                    payload={"input": ["sensitive customer passage"]},
                )
        self.assertEqual(error.exception.code, "secure_fetch_malformed")
        self.assertNotIn("sensitive", error.exception.message)

    def test_embedding_shape_is_validated(self) -> None:
        vectors = embed_texts(self.paths, ["hello"])
        self.assertEqual(len(vectors), 1)
        self.assertEqual(len(vectors[0]), 256)
        with mock.patch("corpus_search.semantic.post_json", return_value={"data": [{"index": 0, "embedding": [0.0]}]}):
            with self.assertRaises(CorpusSearchError) as error:
                embed_texts(self.paths, ["hello"])
        self.assertEqual(error.exception.code, "embedding_malformed")

    def test_structured_rerank_and_fallback(self) -> None:
        response = {
            "output": [
                {
                    "type": "message",
                    "content": [
                        {
                            "type": "output_text",
                            "text": json.dumps({"results": [{"i": 2, "reason": "Direct match."}]}),
                        }
                    ],
                }
            ]
        }
        candidates = [
            {"text": "weak", "kind": "note", "source": "a"},
            {"text": "strong", "kind": "note", "source": "a"},
        ]
        with mock.patch("corpus_search.semantic.post_json", return_value=response):
            selected, outcome = rerank(self.paths, "strong", candidates, top_k=1)
        self.assertTrue(outcome.used)
        self.assertEqual(selected[0]["text"], "strong")
        self.assertEqual(selected[0]["rerankReason"], "Direct match.")

        with mock.patch("corpus_search.semantic.post_json", side_effect=SecureFetchError("timeout", code="secure_fetch_timeout")):
            selected, outcome = rerank(self.paths, "strong", candidates, top_k=1)
        self.assertFalse(outcome.used)
        self.assertEqual(selected, candidates[:1])


if __name__ == "__main__":
    unittest.main()
