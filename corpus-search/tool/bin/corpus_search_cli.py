#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

TOOL_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(TOOL_DIR))

from corpus_search.cli import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
