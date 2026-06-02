#!/usr/bin/env bash
# motion-whoami.sh — Motion-side identity resolver for team-member-memory.
#
# Lightweight identity → handle → home_base. No scope rules, no write blocking.
# Reads userEmail from conversation_json in the local SQLite DB and resolves
# against /agent/brain/admin/organization-map.json.
# Returns JSON: { "handle", "home_base", "status" }.
#
# Status values mirror slack-whoami.sh: resolved | provisioned.
#
# Must be run from within a conversation directory.
#
# Usage:
#   motion-whoami.sh [<display_name>]

set -euo pipefail

MAP_FILE="${RUNNETH_ORG_MAP:-/agent/brain/admin/organization-map.json}"
CONV_DIR="/agent/conversations"
LIVE_DB="/agent/.runtime/conversations.db"
SNAPSHOT_DB="/tmp/motion_whoami_session.db"
DISPLAY_NAME="${1:-}"

CWD="$(pwd -P)"
if [[ "$CWD" != "$CONV_DIR/"* ]]; then
  echo '{"error":"not in a conversation directory","cwd":"'"$CWD"'"}' >&2
  exit 1
fi

CONV_ID="$(basename "$CWD")"

if ! cp "$LIVE_DB" "$SNAPSHOT_DB" 2>/dev/null; then
  echo '{"error":"failed to snapshot conversations.db","conversation_id":"'"$CONV_ID"'"}' >&2
  exit 1
fi

USER_EMAIL="$(sqlite3 "$SNAPSHOT_DB" \
  "SELECT json_extract(conversation_json,'\$.userEmail') FROM conversations WHERE conversation_id='$CONV_ID'" \
  2>/dev/null)"

if [[ -z "$USER_EMAIL" ]]; then
  echo '{"error":"userEmail not found for conversation","conversation_id":"'"$CONV_ID"'"}' >&2
  exit 1
fi

if [ ! -f "$MAP_FILE" ]; then
  echo '{"error": "organization-map.json not found", "path": "'"$MAP_FILE"'"}' >&2
  exit 1
fi

REF=$(jq -r --arg email "$USER_EMAIL" '.motionUserEmails[$email] // empty' "$MAP_FILE")

if [ -n "$REF" ]; then
  HANDLE="${REF#member:}"
  jq -c --arg h "$HANDLE" '
    .members[$h]
    | { handle: .handle,
        home_base: ("/agent/brain/members/" + .handle + "/"),
        status: "resolved" }
  ' "$MAP_FILE"
  exit 0
fi

# Unknown email — auto-provision.
EMAIL_LOCAL="${USER_EMAIL%@*}"
NAME_FOR_HANDLE="${DISPLAY_NAME:-$EMAIL_LOCAL}"
HANDLE=$(echo "$NAME_FOR_HANDLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')

# Scaffold home base: <handle>.md stub + brain/ subfolder + conversations/
HOME_BASE="/agent/brain/members/$HANDLE"
mkdir -p "$HOME_BASE/brain"
mkdir -p "$HOME_BASE/conversations"

STUB_FILE="$HOME_BASE/$HANDLE.md"
TEMPLATE="${RUNNETH_MEMBER_TEMPLATE:-/agent/brain/members/TEMPLATE.md}"
DISPLAY_FOR_STUB="${DISPLAY_NAME:-$EMAIL_LOCAL}"
if [ ! -f "$STUB_FILE" ]; then
  if [ -f "$TEMPLATE" ]; then
    sed "s/\[Name\]/$DISPLAY_FOR_STUB/" "$TEMPLATE" > "$STUB_FILE"
  else
    cat > "$STUB_FILE" <<STUB
# $DISPLAY_FOR_STUB

- **First seen:** $(date -u +%Y-%m-%d)
- **Email:** $USER_EMAIL

---

## Who they are
[To be filled in as Runneth learns more about this person.]
STUB
  fi
fi

tmp=$(mktemp)
jq --arg email "$USER_EMAIL" --arg h "$HANDLE" --arg name "$DISPLAY_FOR_STUB" '
  .motionUserEmails[$email] = ("member:" + $h)
  | .members[$h] = { "name": $name, "handle": $h, "email": $email }
' "$MAP_FILE" > "$tmp" && mv "$tmp" "$MAP_FILE"

echo "{\"handle\": \"$HANDLE\", \"home_base\": \"$HOME_BASE/\", \"status\": \"provisioned\"}"
