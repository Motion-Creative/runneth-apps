#!/usr/bin/env bash
# motion-whoami.sh — Motion-side identity resolver for team-member-memory.
#
# Lightweight identity → handle → home_base. No scope rules, no write blocking.
#
# Resolution order:
#   1. Neon agent_conversation table (authoritative, zero-lag). Requires the
#      NEON_DATABASE_URL runtime secret. Read via:
#        secret run --env DATABASE_URL=NEON_DATABASE_URL -- \
#          python3 /agent/brain/admin/motion-whoami-neon.py <conversation_id>
#   2. Local SQLite conversations.db snapshot (fallback when Neon is unreachable).
#
# Then resolves user_email against /agent/brain/admin/organization-map.json,
# auto-provisioning a new entry + home base on first message.
#
# Returns JSON: { "handle", "home_base", "status" }
# Status values: resolved | provisioned
#
# Must be run from within a conversation directory, OR with CONVERSATION_ID
# in env (the runtime sets this).
#
# Usage:
#   motion-whoami.sh [<display_name>]

set -euo pipefail

MAP_FILE="${RUNNETH_ORG_MAP:-/agent/brain/admin/organization-map.json}"
NEON_HELPER="${RUNNETH_MOTION_WHOAMI_NEON:-/agent/brain/admin/motion-whoami-neon.py}"
CONV_DIR="/agent/conversations"
LIVE_DB="/agent/.runtime/conversations.db"
BACKUP_DIR="/agent/.runtime/conversation-db-backups"
SNAPSHOT_DB="/tmp/motion_whoami_session_$$.db"
DISPLAY_NAME="${1:-}"

# Resolve conversation_id: env var first (runtime sets it), cwd basename fallback.
if [[ -n "${CONVERSATION_ID:-}" ]]; then
  CONV_ID="$CONVERSATION_ID"
else
  CWD="$(pwd -P)"
  if [[ "$CWD" != "$CONV_DIR/"* ]]; then
    echo '{"error":"no CONVERSATION_ID in env and not in a conversation directory","cwd":"'"$CWD"'"}' >&2
    exit 1
  fi
  CONV_ID="$(basename "$CWD")"
fi

USER_EMAIL=""
RESOLUTION=""

# 1. Try Neon (authoritative).
if [[ -x "$NEON_HELPER" ]] || [[ -f "$NEON_HELPER" ]]; then
  NEON_OUT=$(timeout 6 secret run --env DATABASE_URL=NEON_DATABASE_URL -- \
    python3 "$NEON_HELPER" "$CONV_ID" 2>/dev/null || true)
  if [[ -n "$NEON_OUT" ]]; then
    USER_EMAIL=$(echo "$NEON_OUT" | jq -r '.user_email // empty' 2>/dev/null || true)
    if [[ -n "$USER_EMAIL" ]]; then
      RESOLUTION="neon"
    fi
  fi
fi

# 2. Fallback to local SQLite snapshot (live or latest backup).
if [[ -z "$USER_EMAIL" ]]; then
  DB_USED=""
  if cp "$LIVE_DB" "$SNAPSHOT_DB" 2>/dev/null && [[ -s "$SNAPSHOT_DB" ]]; then
    DB_USED="live"
  else
    LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/*.db 2>/dev/null | head -1)
    if [[ -n "$LATEST_BACKUP" ]] && cp "$LATEST_BACKUP" "$SNAPSHOT_DB" 2>/dev/null; then
      DB_USED="backup"
    fi
  fi

  if [[ -n "$DB_USED" ]]; then
    USER_EMAIL=$(sqlite3 "$SNAPSHOT_DB" \
      "SELECT json_extract(conversation_json,'\$.userEmail') FROM conversations WHERE conversation_id='$CONV_ID'" \
      2>/dev/null || true)
    rm -f "$SNAPSHOT_DB"
    if [[ -n "$USER_EMAIL" && "$USER_EMAIL" != "null" ]]; then
      RESOLUTION="sqlite-$DB_USED"
    else
      USER_EMAIL=""
    fi
  fi
fi

if [[ -z "$USER_EMAIL" ]]; then
  echo '{"error":"userEmail not found for conversation in Neon or local SQLite","conversation_id":"'"$CONV_ID"'"}' >&2
  exit 1
fi

if [ ! -f "$MAP_FILE" ]; then
  echo '{"error": "organization-map.json not found", "path": "'"$MAP_FILE"'"}' >&2
  exit 1
fi

REF=$(jq -r --arg email "$USER_EMAIL" '.motionUserEmails[$email] // empty' "$MAP_FILE")

if [ -n "$REF" ]; then
  HANDLE="${REF#member:}"
  jq -c --arg h "$HANDLE" --arg res "$RESOLUTION" '
    .members[$h]
    | { handle: .handle,
        home_base: ("/agent/brain/members/" + .handle + "/"),
        status: "resolved",
        resolution: $res }
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

echo "{\"handle\": \"$HANDLE\", \"home_base\": \"$HOME_BASE/\", \"status\": \"provisioned\", \"resolution\": \"$RESOLUTION\"}"
