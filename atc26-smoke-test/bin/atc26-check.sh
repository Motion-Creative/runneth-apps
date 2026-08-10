#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
marker_file=${ATC26_MARKER_FILE:-"$script_dir/../smoke-marker.md"}
version=$(sed -n 's/.*\(ATC26_SMOKE_V[0-9][0-9]*\).*/\1/p' "$marker_file" | head -n 1)

if [ -z "$version" ]; then
  printf 'No ATC26 smoke marker found in %s\n' "$marker_file" >&2
  exit 1
fi

printf '%s\n' "$version"
