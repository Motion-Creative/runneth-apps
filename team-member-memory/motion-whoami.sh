#!/usr/bin/env bash
# motion-whoami.sh — Motion-side identity resolver for team-member-memory.
#
# Lightweight identity → handle → home_base. No scope rules, no write blocking.
#
# Resolution path: Neon agent_conversation table (authoritative, zero-lag) via
# the motion-whoami-neon.py helper, invoked through:
#   secret run --env DATABASE_URL=NEON_DATABASE_URL -- \
#     python3 /agent/brain/admin/motion-whoami-neon.py <conversation_id>
#
# There is no SQLite fallback. The local conversations.db is unreliable for
# brand-new conversations (live DB is a 0-byte placeholder; backups lag 30 min),
# and the case where Neon is down AND the conversation is older than 30 min is
# too narrow to design around. On Neon failure this script returns a clean
# 'unresolved' JSON so the calling logic (behavior-snippet) can ask the user
# at write time where to save instead of guessing.
#
# Returns JSON, exit 0 in all non-fatal cases:
#   { "handle", "home_base", "status": "resolved",   "resolution": "neon" }
#   { "handle", "home_base", "status": "provisioned","resolution": "neon" }
#   { "status": "unresolved", "reason": "<text>", "conversation_id": "..." }
#
# Accepts CONVERSATION_ID from env (the runtime sets it); falls back to the
# cwd basename when not set.
#
# Usage:
#   motion-whoami.sh [<display_name>]

set -euo pipefail

MAP_FILE="${RUNNETH_ORG_MAP:-/agent/brain/admin/organization-map.json}"
NEON_HELPER="${RUNNETH_MOTION_WHOAMI_NEON:-/agent/brain/admin/motion-whoami-neon.py}"
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

if [[ ! -f "$NEON_HELPER" ]]; then
  echo '{"status":"unresolved","reason":"motion-whoami-neon.py helper missing","conversation_id":"'"$CONV_ID"'"}'
  exit 0
fi

NEON_OUT=$(timeout 6 secret run --env DATABASE_URL=NEON_DATABASE_URL -- \
  python3 "$NEON_HELPER" "$CONV_ID" 2>/dev/null || true)
USER_EMAIL=""
if [[ -n "$NEON_OUT" ]]; then
  USER_EMAIL=$(echo "$NEON_OUT" | jq -r '.user_email // empty' 2>/dev/null || true)
fi

if [[ -z "$USER_EMAIL" ]]; then
  echo '{"status":"unresolved","reason":"Neon agent_conversation lookup failed or returned no user_email","conversation_id":"'"$CONV_ID"'"}'
  exit 0
fi

if [ ! -f "$MAP_FILE" ]; then
  echo '{"status":"unresolved","reason":"organization-map.json missing","path":"'"$MAP_FILE"'","user_email":"'"$USER_EMAIL"'"}'
  exit 0
fi

REF=$(jq -r --arg email "$USER_EMAIL" '.motionUserEmails[$email] // empty' "$MAP_FILE")

if [ -n "$REF" ]; then
  HANDLE="${REF#member:}"
  jq -c --arg h "$HANDLE" '
    .members[$h]
    | { handle: .handle,
        home_base: ("/agent/brain/identity/people/" + .handle + "/"),
        status: "resolved",
        resolution: "neon" }
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
  .motionUserEmails[$email] = ("member:" + $h)
  | .members[$h] = { "name": $name, "handle": $h, "email": $email }
' "$MAP_FILE" > "$tmp" && mv "$tmp" "$MAP_FILE"

echo "{\"handle\": \"$HANDLE\", \"home_base\": \"$HOME_BASE/\", \"status\": \"provisioned\", \"resolution\": \"neon\"}"
