---
name: ad-naming
description: Builds the account's naming decoder, per-campaign KPI map, and Motion query contract. Triggers on "build my naming decoder", "decode my ad names", "set up ad naming", "build the query contract", "what's my naming convention", "what are my campaign KPIs", "set up ad naming", "decode this ad name".
---

# Ad Naming skill

Build the three account intelligence files from live Motion data. These underpin precise analysis, corpus decoding, and correct Motion CLI usage.

## Step 0 — Load state

Read `/agent/brain/ad-naming/ad-naming-state.json`. If `lastBuildDate` exists, the files are already built — offer to refresh instead.

## Step 0b — Register Knoweth lane (first run only)

If `lanesRegistered` is absent or false:
1. Call ContextConfig to register the `ad-naming` lane at `/agent/brain/ad-naming/` covering `naming-decoder.md`, `kpi-map.md`, `query-contract.md`.
2. Set `lanesRegistered: true` in state.

## Step 0c — Keep Motion work in the agent turn

Run every `motion` command directly in this agent turn. Do not put Motion calls in
`task.bash` or script-mode routines: task-scoped broker tokens cannot access the
trusted Motion tool. Deterministic local file processing may use bash.

## Step 1 — Build the naming decoder

1. Pull a sample of ad names:
   ```
   motion meta ads --grain adnames --date-range last_90d --sort-by spend --sort-direction desc --limit 200
   ```
   Capture the envelope, parse `.file`, read `.data.summaryRows[].adName` or `.data.result.adnames[].adName`.

2. Inspect the ad names. Identify repeating delimited patterns (prefixes, separators, values). Common patterns: `p-`, `fs-`, `as-`, `ex-`, `hto-`, `afs-`, `cn-`, `o-`.

3. Write `/agent/brain/ad-naming/naming-decoder.md`:
   ```markdown
   # Naming Decoder

   ## System: <System A / System B>

   | Prefix | Dimension | Observed values (plain meaning) |
   |--------|-----------|--------------------------------|
   | p-     | Platform  | fb (Facebook), ig (Instagram)  |
   | fs-    | Format    | vid (video), img (image)       |
   ...

   ## Decode template
   `{platform}-{format}-{angle}-{hook}-...` → decoded meaning

   ## Worked example
   `p-fb_fs-vid_as-fear_hto-hook1` decodes as:
   - Platform: Facebook
   - Format: video
   - Angle: fear-based
   - Hook tactic: hook variant 1
   ```

4. Status `drafted` if built from real data, `inferred` if pattern was unclear.
5. Update state. Tell the user: "I built the naming decoder from 200 top-spend ad names. Click to review — let me know if any dimensions are wrong."

## Step 2 — Build the per-campaign KPI map

1. Read the naming decoder (just built or already on file).
2. Pull campaign context:
   ```
   motion workspace-goal
   motion meta custom-conversion-metrics
   ```
   Capture envelopes, parse file paths, read data.

3. Identify campaign segments from the naming decoder's campaign dimension (if present) and from `motion meta insights --date-range last_30d --sort topSpend --limit 100` campaign name field.

4. For each segment, determine:
   - Primary optimization target (from naming + workspace goal)
   - Dominant conversion event (from custom-conversion-metrics cross-referenced with campaign names)
   - Testing cut threshold (from spend-threshold or workspace goal)
   - Graduation threshold

5. Write `/agent/brain/ad-naming/kpi-map.md`:
   ```markdown
   # Per-Campaign KPI Map

   | Campaign segment | Optimization target | Primary conversion | Testing cut | Graduation |
   |---|---|---|---|---|
   | TOF-broad | Lowest cost | App signup | <£100 / 2wk | ≥£500 |
   | BOF-retarget | Cost cap | Calendly booked | <£50 / 1wk | ≥£300 |
   ```

6. Update state. Note if any segments could not be determined.

## Step 3 — Build the Motion query contract

Auto-discover and write the account's Motion CLI contract:

1. **Workspace ID**: from current workspace context.
2. **Attribution windows**: from `motion workspace-goal` → `conversionDetails[].attributionWindow.click` and `.view`.
3. **Conversion events**: from `motion meta custom-conversion-metrics` → each conversion's `id`, `name`, and derived metric keys (`{id}_count`, `{id}_cost`).
4. **Standard metrics**: check `motion meta metric-reference --query "appointments scheduled"` for any standard events that might apply.
5. **Thumbstop test**: run `motion meta insights --date-range last_30d --sort topSpend --limit 1 --table-kpi thumbstop_rate`. Note whether it returns a non-null value.
6. **Known data-layer gotchas** (encode as static rules):
   - `campaignName` is null in `--grain ads` → use `--grain adnames` or insights for campaign reads
   - `adType` may be null in ads grain → use `format` field instead
   - `roas` varies by account configuration → check workspace goal for the actual judgment metric
   - For creative text, use ID-scoped `--summary-sections` pulls; do not use the
     blocked `--include-transcript` fast path

7. Write `/agent/brain/ad-naming/query-contract.md`:
   ```markdown
   # Motion Query Contract

   ## Always include on every call
   - Workspace ID: <id> (use --workspace-id on commands that accept it)
   - Click attribution: <value> (--click-attribution-window)
   - View attribution: <value> (--view-attribution-window)

   ## Conversion events
   | Event | Count key | Cost key |
   |---|---|---|
   | <name> | <id>_count | <id>_cost |

   ## Thumbstop
   Available: yes/no — use --table-kpi thumbstop_rate

   ## Data-layer gotchas
   - ...
   ```

8. Update state. Tell the user: "I've built the query contract — this is what gets used on every Motion pull for this account. Review and correct anything that looks wrong."

## Step 4 — Update state and offer refresh routine

1. Set `lastBuildDate` in state. Mirror.
2. Refresh `/agent/INDEX.md` with entries for all three files.
3. Offer the weekly refresh routine:
   ```
   routine add \
     --name "Ad naming weekly refresh" \
     --cron "0 9 * * 1" \
     --delivery "Post a summary in a new web conversation." \
     --prompt "Start an agent turn and read the installed ad-naming skill. Refresh the naming decoder, KPI map, and query contract directly in that agent turn using live Motion tools; never call Motion from task.bash. Preserve customer corrections, update state, and open a new conversation with a brief summary of what changed."
   ```
4. Save the routine ID as `refreshRoutineId`.

## Rules
- Naming decoder built from real Motion data → status `drafted`.
- If no clear pattern found in ad names: say that, show examples, ask the customer to describe the convention. Do not invent dimensions.
- Query contract auto-discovery may miss edge cases — always ask the customer to review before treating as canonical.
- When the creative corpus is installed, the naming decoder path (`/agent/brain/ad-naming/naming-decoder.md`) is what corpus files reference for decoding.
