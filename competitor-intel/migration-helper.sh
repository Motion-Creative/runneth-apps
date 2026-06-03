#!/usr/bin/env bash
#
# competitor-intel migration helper
#
# Migrates brain data from /agent/brain/competitor-intel/<workspace-slug>/ to
# /agent/brain/competition/<workspace-slug>/ so competitor watch output sits
# inside the Competition brain domain instead of a sibling root.
#
# IMPORTANT: This migrates BRAIN DATA only. The skill install path stays at
# /agent/.agents/skills/competitor-intel/ and is not affected by this helper.
#
# Safe to run multiple times. Idempotent. Preserves accumulated weekly
# snapshots, baselines, and any user edits.

set -euo pipefail

OLD_ROOT="/agent/brain/competitor-intel"
NEW_ROOT="/agent/brain/competition"
TODAY="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
STUB_EXPIRY_DAYS=30

log() {
    echo "[$TODAY] competitor-intel migration-helper: $*" >&2
}

# --- precondition checks --------------------------------------------------

if [ ! -d "$OLD_ROOT" ]; then
    log "no migration needed: $OLD_ROOT does not exist"
    exit 0
fi

# Check if already migrated
if [ -f "$OLD_ROOT/_MIGRATED.md" ]; then
    log "no migration needed: already migrated previously"
    exit 0
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

    # Skip migration marker if it exists
    [ "$name" = "_MIGRATED.md" ] && continue

    # If target exists with content, merge carefully
    if [ -e "$target" ] && [ -n "$(ls -A "$target" 2>/dev/null || true)" ]; then
        # Try to merge sub-folders (baselines/ etc.) rather than skip wholesale
        if [ -d "$entry" ] && [ -d "$target" ]; then
            log "merging: $name (target already has content, merging non-conflicting files)"
            merged=0
            for sub in "$entry"/*; do
                [ -e "$sub" ] || continue
                subname="$(basename "$sub")"
                subtarget="$target/$subname"
                if [ -e "$subtarget" ]; then
                    log "  skip sub: $subname already exists in target"
                else
                    mv "$sub" "$subtarget"
                    merged=$((merged + 1))
                fi
            done
            log "  merged $merged sub-entries from $name"
            if [ "$merged" -gt 0 ]; then
                MOVED=$((MOVED + 1))
            else
                SKIPPED=$((SKIPPED + 1))
            fi
            continue
        fi
        log "skip: $target already exists, not overwriting"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    mv "$entry" "$target"
    MOVED=$((MOVED + 1))
    log "moved: $name from $OLD_ROOT/ to $NEW_ROOT/"
done

# --- leave migration marker at old root ---------------------------------

mkdir -p "$OLD_ROOT"
cat > "$OLD_ROOT/_MIGRATED.md" <<STUB_EOF
---
domain: competition
ownership: system
substance: facts
managed_by: competitor-intel:migration-helper
sources:
  - { layer: migration, ref: "competitor-intel v1.1.0 path migration" }
refresh_cadence: never
last_refreshed: $TODAY
confidence: high
expires_after_days: $STUB_EXPIRY_DAYS
---

# Moved

The competitor-intel brain data has moved to $NEW_ROOT/.

The competitor-intel skill (v1.1.0) consolidated its brain data under
the Competition brain domain. This stub will be safe to delete after
$STUB_EXPIRY_DAYS days.

The skill itself still lives at /agent/.agents/skills/competitor-intel/.
Only the brain data path moved.

No action needed unless you have hardcoded references to the old path.
STUB_EOF

# --- summary --------------------------------------------------------------

log "done. moved=$MOVED skipped=$SKIPPED"

if [ "$SKIPPED" -gt 0 ] && [ "$MOVED" -gt 0 ]; then
    exit 2
fi
exit 0
