#!/usr/bin/env bash
#
# team-member-memory migration helper
#
# Migrates per-person home bases from /agent/brain/members/<handle>/ to
# /agent/brain/identity/people/<handle>/ so per-person scope sits under the
# Identity domain instead of a sibling brain root.
#
# Safe to run multiple times. Idempotent. Preserves user-edited content.
#
# Exit codes:
#   0 = success (or no migration needed)
#   1 = unrecoverable error
#   2 = partial migration (some files moved, some skipped; details in stderr)

set -euo pipefail

OLD_ROOT="/agent/brain/members"
NEW_ROOT="/agent/brain/identity/people"
ORG_MAP="/agent/brain/admin/organization-map.json"
TODAY="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
STUB_EXPIRY_DAYS=30

log() {
    echo "[$TODAY] migration-helper: $*" >&2
}

# --- precondition checks --------------------------------------------------

if [ ! -d "$OLD_ROOT" ]; then
    log "no migration needed: $OLD_ROOT does not exist"
    exit 0
fi

# Check whether new root already has migrated content (idempotency)
if [ -d "$NEW_ROOT" ] && [ -n "$(ls -A "$NEW_ROOT" 2>/dev/null || true)" ]; then
    if [ -z "$(ls -A "$OLD_ROOT" 2>/dev/null || true)" ]; then
        log "no migration needed: $OLD_ROOT is empty, $NEW_ROOT already populated"
        exit 0
    fi
    log "warn: both $OLD_ROOT and $NEW_ROOT have content. Will merge with old-root taking precedence on conflicts."
fi

# --- prepare new root -----------------------------------------------------

mkdir -p "$NEW_ROOT"

# --- move contents --------------------------------------------------------

MOVED=0
SKIPPED=0
for entry in "$OLD_ROOT"/*; do
    [ -e "$entry" ] || continue
    name="$(basename "$entry")"
    target="$NEW_ROOT/$name"

    if [ -f "$entry/_MIGRATED.md" ]; then
        log "skip: $name already migrated previously"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    if [ -e "$target" ] && [ -n "$(ls -A "$target" 2>/dev/null || true)" ]; then
        log "skip: $target already exists with content, not overwriting"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    mv "$entry" "$target"
    MOVED=$((MOVED + 1))
    log "moved: $name from $OLD_ROOT to $NEW_ROOT"

    mkdir -p "$entry"
    cat > "$entry/_MIGRATED.md" <<STUB_EOF
---
domain: identity
ownership: system
substance: facts
managed_by: team-member-memory:migration-helper
sources:
  - { layer: migration, ref: "team-member-memory v3.1.0 path migration" }
refresh_cadence: never
last_refreshed: $TODAY
confidence: high
expires_after_days: $STUB_EXPIRY_DAYS
---

# Moved

This home base has moved to $target.

The team-member-memory skill (v3.1.0) consolidated all per-person scopes under
the Identity brain domain. This stub will be safe to delete after $STUB_EXPIRY_DAYS days.

All resolvers (slack-whoami.sh, motion-whoami.sh) now write to the new path.
No action needed unless you have hardcoded references to the old path.
STUB_EOF
done

# --- update organization-map.json -----------------------------------------

if [ -f "$ORG_MAP" ]; then
    cp "$ORG_MAP" "${ORG_MAP}.pre-migration-$(date -u +%Y%m%dT%H%M%SZ).bak"

    python3 - <<PYEOF
import json
p = "$ORG_MAP"
d = json.load(open(p))
changed = 0
people = d.get("people", {})
for handle, entry in people.items():
    if isinstance(entry, dict):
        hb = entry.get("home_base", "")
        if hb.startswith("/agent/brain/members/"):
            entry["home_base"] = hb.replace("/agent/brain/members/", "/agent/brain/identity/people/", 1)
            changed += 1
json.dump(d, open(p, "w"), indent=2)
print(f"organization-map.json: updated {changed} home_base entries", end="")
PYEOF
    echo "" >&2
else
    log "no $ORG_MAP found, skipping map update"
fi

# --- summary --------------------------------------------------------------

log "done. moved=$MOVED skipped=$SKIPPED"

if [ "$SKIPPED" -gt 0 ] && [ "$MOVED" -gt 0 ]; then
    exit 2
fi
exit 0
