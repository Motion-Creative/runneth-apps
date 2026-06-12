#!/usr/bin/env bash
# motion-whoami.sh — Motion-side identity resolver for team-member-memory.
#
# Lightweight identity → handle → home_base. No scope rules, no write blocking.
#
# Resolution path: the local daemon conversation store at
#   /daemon/conversation-store/conversations.db
# read with `sqlite3 -readonly -json`, keyed by the $CONVERSATION_ID env var
# the runtime injects. Fully local: no network, no runtime secrets.
#
# On any resolution failure ($CONVERSATION_ID unset, daemon DB missing, no
# userEmail for the conversation) this script returns a clean 'unresolved'
# JSON so the calling logic (behavior-snippet) can ask the user at write time
# where to save instead of guessing a handle.
#
# Returns JSON, exit 0 in all non-fatal cases:
#   { "handle", "home_base", "status": "resolved",   "resolution": "daemon-db" }
#   { "handle", "home_base", "status": "provisioned","resolution": "daemon-db" }
#   { "status": "unresolved", "reason": "<text>", "conversation_id": "..." }
#
# Accepts CONVERSATION_ID from env (the runtime sets it); falls back to the
# cwd basename when not set.
#
# Usage:
#   motion-whoami.sh [<display_name>]

set -euo pipefail

MAP_FILE="${RUNNETH_ORG_MAP:-/agent/brain/admin/organization-map.json}"
CONV_DB="/daemon/conversation-store/conversations.db"
CONV_DIR="/agent/conversations"
DISPLAY_NAME="${1:-}"

# Resolve conversation_id: env var first, cwd basename fallback.
if [[ -n "${CONVERSATION_ID:-}" ]]; then
  CONV_ID="$CONVERSATION_ID"
else
  CWD="$(pwd -P)"
  if [[ "$CWD" != "$CONV_DIR/"* ]]; then
    echo '{"status":"unresolved","reason":"no CONVERSATION_ID in env and not in a conversation directory","cwd":"'"$CWD"'"}'
    exit 0
  fi
  CONV_ID="$(basename "$CWD")"
fi

if [[ ! -f "$CONV_DB" ]]; then
  echo '{"status":"unresolved","reason":"daemon conversations.db missing","path":"'"$CONV_DB"'","conversation_id":"'"$CONV_ID"'"}'
  exit 0
fi

RAW=$(sqlite3 -readonly -json "$CONV_DB" \
  -cmd ".timeout 3000" \
  "SELECT json_extract(conversation_json,'\$.userEmail') as userEmail FROM conversations WHERE conversation_id='$CONV_ID' LIMIT 1" \
  2>/dev/null || true)

USER_EMAIL=""
if [[ -n "$RAW" ]]; then
  USER_EMAIL=$(echo "$RAW" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['userEmail'] if d and d[0]['userEmail'] else '')" 2>/dev/null || true)
fi

if [[ -z "$USER_EMAIL" ]]; then
  echo '{"status":"unresolved","reason":"daemon conversation-store lookup failed or returned no userEmail","conversation_id":"'"$CONV_ID"'"}'
  exit 0
fi

if [ ! -f "$MAP_FILE" ]; then
  echo '{"status":"unresolved","reason":"organization-map.json missing","path":"'"$MAP_FILE"'","user_email":"'"$USER_EMAIL"'"}'
  exit 0
fi

REF=$(jq -r --arg email "$USER_EMAIL" '(.motionUserEmails[$email] // .motionEmails[$email] // empty)' "$MAP_FILE")

if [ -n "$REF" ]; then
  HANDLE="${REF#member:}"
  jq -c --arg h "$HANDLE" '
    .members[$h]
    | { handle: .handle,
        home_base: ("/agent/brain/identity/people/" + .handle + "/"),
        status: "resolved",
        resolution: "daemon-db" }
  ' "$MAP_FILE"
  exit 0
fi

# Unknown email — auto-provision.
EMAIL_LOCAL="${USER_EMAIL%@*}"
NAME_FOR_HANDLE="${DISPLAY_NAME:-$EMAIL_LOCAL}"
HANDLE=$(echo "$NAME_FOR_HANDLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')

# Scaffold home base: <handle>.md stub + brain/ subfolder + conversations/
HOME_BASE="/agent/brain/identity/people/$HANDLE"
mkdir -p "$HOME_BASE/brain"
mkdir -p "$HOME_BASE/conversations"

STUB_FILE="$HOME_BASE/$HANDLE.md"
TEMPLATE="${RUNNETH_MEMBER_TEMPLATE:-/agent/brain/identity/people/TEMPLATE.md}"
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
  .motionUserEmails = (.motionUserEmails // {}) |
  .motionUserEmails[$email] = ("member:" + $h) |
  (if has("motionEmails") then .motionEmails[$email] = ("member:" + $h) else . end) |
  .members[$h] = { "name": $name, "handle": $h, "email": $email }
' "$MAP_FILE" > "$tmp" && mv "$tmp" "$MAP_FILE"

echo "{\"handle\": \"$HANDLE\", \"home_base\": \"$HOME_BASE/\", \"status\": \"provisioned\", \"resolution\": \"daemon-db\"}"
