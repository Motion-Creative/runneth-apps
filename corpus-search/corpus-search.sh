#!/bin/bash
# corpus-search wrapper. Persistent tool entry point.
# Usage: bash /agent/tools/corpus-search/corpus-search.sh <command> ...
# See README.md for usage. Run install.sh first.
set -euo pipefail
TOOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$TOOL_DIR/bin/corpus_search_cli.py" "$@"
