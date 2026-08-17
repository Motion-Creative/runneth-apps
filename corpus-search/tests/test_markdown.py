from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path


TOOL_ROOT = Path(__file__).resolve().parents[1] / "tool"
sys.path.insert(0, str(TOOL_ROOT))

from corpus_search.markdown_ingest import (  # noqa: E402
    chunk_markdown,
    parse_document,
    parse_frontmatter,
    parse_scalar,
)


class MarkdownTests(unittest.TestCase):
    def test_scalar_frontmatter_preserves_supported_types(self) -> None:
        metadata, body = parse_frontmatter(
            """---
title: "Launch brief"
brand: Acme
score: 3.5
approved: true
empty: null
nested:
  child: ignored
tags: [one, two]
---
# Body
"""
        )
        self.assertEqual(
            metadata,
            {
                "title": "Launch brief",
                "brand": "Acme",
                "score": 3.5,
                "approved": True,
                "empty": None,
            },
        )
        self.assertTrue(body.startswith("# Body"))

    def test_scalar_parser_does_not_coerce_dates(self) -> None:
        self.assertEqual(parse_scalar("2026-08-14"), "2026-08-14")
        self.assertEqual(parse_scalar("42"), 42)
        self.assertIs(parse_scalar("false"), False)

    def test_roles_and_timestamps_are_chunk_metadata(self) -> None:
        chunks = chunk_markdown(
            """## Role: user [00:10-00:18]
The launch brief missed the brand voice and needs more concrete examples. This
paragraph is deliberately long enough to avoid being merged into an empty scrap.

## Speaker: Alice [01:02]
We should rewrite the first section around customer language. This paragraph also
contains enough detail to form a useful independent retrieval chunk for the test.
"""
        )
        self.assertEqual(len(chunks), 2)
        self.assertEqual(chunks[0]["role"], "user")
        self.assertEqual(chunks[0]["t_start_s"], 10.0)
        self.assertEqual(chunks[0]["t_end_s"], 18.0)
        self.assertEqual(chunks[1]["role"], "speaker:Alice")
        self.assertEqual(chunks[1]["t_start_s"], 62.0)

    def test_document_defaults_title_to_first_heading(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "note.md"
            path.write_text(
                "---\nbrand: Acme\nevent_at: 2026-08-01\n---\n# Customer language\n\nUseful detail.",
                encoding="utf-8",
            )
            parsed = parse_document(path)
        self.assertEqual(parsed.title, "Customer language")
        self.assertEqual(parsed.event_at, "2026-08-01")
        self.assertEqual(parsed.metadata["brand"], "Acme")
        self.assertTrue(parsed.content_hash)


if __name__ == "__main__":
    unittest.main()
