#!/usr/bin/env bash
# slack-whoami.sh — Slack-side identity resolver for team-member-memory.
#
# Lightweight identity → handle → home_base. No scope rules, no write blocking.
# Resolves a Slack user ID against /agent/brain/admin/organization-map.json.
# Returns JSON: { "handle", "home_base", "status" }.
#
# Status values:
#   resolved    — known identifier; handle/home_base returned
#   provisioned — unknown identifier; auto-created a new member entry and home base
#
# If add-roles-permissions is also installed, its stricter resolver overwrites
# this one and adds scope and collision-detection on top of the same map shape.
#
# Usage:
#   slack-whoami.sh <slack_user_id> [<slack_display_name>]
#
# Auto-provisioning requires <slack_display_name> for handle derivation.

set -euo pipefail

MAP_FILE="${RUNNETH_ORG_MAP:-/agent/brain/admin/organization-map.json}"
SLACK_ID="${1:?slack_user_id required (e.g. U03XXXXXXXX)}"
DISPLAY_NAME="${2:-}"

if [ ! -f "$MAP_FILE" ]; then
  echo '{"error": "organization-map.json not found", "path": "'"$MAP_FILE"'"}' >&2
  exit 1
fi

REF=$(jq -r --arg id "$SLACK_ID" '.slackUserIds[$id] // empty' "$MAP_FILE")

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

# Unknown Slack ID — auto-provision.
if [ -z "$DISPLAY_NAME" ]; then
  echo '{"error": "unknown slack_id and no display_name provided for auto-provision", "slack_id": "'"$SLACK_ID"'"}' >&2
  exit 2
fi

HANDLE=$(echo "$DISPLAY_NAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')

# Scaffold home base: <handle>.md stub + brain/ subfolder + conversations/
HOME_BASE="/agent/brain/members/$HANDLE"
mkdir -p "$HOME_BASE/brain"
mkdir -p "$HOME_BASE/conversations"

STUB_FILE="$HOME_BASE/$HANDLE.md"
TEMPLATE="${RUNNETH_MEMBER_TEMPLATE:-/agent/brain/members/TEMPLATE.md}"
if [ ! -f "$STUB_FILE" ]; then
  if [ -f "$TEMPLATE" ]; then
    sed "s/\[Name\]/$DISPLAY_NAME/" "$TEMPLATE" > "$STUB_FILE"
  else
    cat > "$STUB_FILE" <<STUB
# $DISPLAY_NAME

- **First seen:** $(date -u +%Y-%m-%d)
- **Slack ID:** $SLACK_ID

---

## Who they are
[To be filled in as Runneth learns more about this person.]
STUB
  fi
fi

tmp=$(mktemp)
jq --arg id "$SLACK_ID" --arg h "$HANDLE" --arg name "$DISPLAY_NAME" '
  .slackUserIds[$id] = ("member:" + $h)
  | .members[$h] = { "name": $name, "handle": $h, "slack_id": $id }
' "$MAP_FILE" > "$tmp" && mv "$tmp" "$MAP_FILE"

echo "{\"handle\": \"$HANDLE\", \"home_base\": \"$HOME_BASE/\", \"status\": \"provisioned\"}"
