# 05 - Bank Building Process

The engine pulls from three banks: Creative Mechanics, Hooks and Headlines, and Visual Formats. This document defines how those banks are built from a brand's real ad evidence, not from interview recall.

Messaging angle is NOT a bank. It is derived from the intersection of the anchor, the persona, and the micro-moment (see `02-ideation-engine.md`).

---

## Prerequisite: naming conventions

Bank building reads product tags from ad names (Step 3 below) and depends on knowing the brand's naming convention. If naming conventions are already confirmed in this workspace's Meta account context (from the onboarding package), use that convention, but confirm it with the team rather than assuming it still holds. If naming conventions are not yet confirmed, confirm them with the team as the first part of bank building, before reading product tags from ad names.

---

## Where the libraries live

**Workspace-scoped (never crosses workspace boundaries):**
```
/agent/brain/<workspace>/creative-strategy-library/
├── visual-formats/
│   ├── index.md
│   └── entries/<slug>.md
├── creative-mechanics/
│   ├── index.md
│   └── entries/<slug>.md
└── hooks-and-headlines/
    ├── index.md
    ├── entries/hook-tactics/<slug>.md
    └── entries/headline-tactics/<slug>.md
```

Every index and entry at this location records the stable Motion workspace ID. Before
reading, writing, or recommending anything from a bank, verify that its workspace ID
matches the `Default workspace:` bound to the current conversation. A missing or
mismatched ID is a blocker: never read, copy, merge, rename, or reuse a different
workspace's entries to fill this one.

This location can be used by multiple packages only when they are operating on this
same workspace. For example, confirmed-external patterns from this workspace's
hook-script-mining library can be proposed as entries here, with their source and
taste-note evidence preserved, and saved only after the normal confirmation gate.
Cross-package reuse never means cross-workspace reuse.

**Other workspace-specific inputs:**
- Engine configuration
- Persona documentation
- Product bible
- VoC audit
- Tested messaging angles (reference list, not a bank)

---

## Prerequisite: check for an existing bank before building

Before running Steps 1-5 below, check whether `index.md` already exists under each
bank folder in the current workspace's location above. A bank can already be seeded,
in whole or in part, by an earlier run of this same process or by another package
operating on this same workspace.

- If a bank already has entries and its recorded workspace ID matches the current workspace, use them directly. Do not re-pull or re-derive that bank from scratch. Only add to it going forward, through Step 7's nomination routine (owned-evidence entries) or through a same-workspace package's confirmed process (see `02-ideation-engine.md`'s note on owned-evidence vs. confirmed-external entries).
- If a bank is empty, run Steps 1-5 for that bank as normal. Once confirmed, it becomes the seed that another package may use for this workspace only.
- Check each of the three banks independently. It's normal for one to already exist while the other two are still empty.
- Never search another workspace's folder for a substitute bank, even when this workspace's bank is empty.

---

## The three component types

### Visual Format
The container the ad comes in: the recognizable shape of the video or static, separate from what it says.

**Test:** if you stripped out the specific words and the specific persuasion technique, what's left is the *shape* of the content. Would this shape work with completely different copy and a completely different argument? Then it's a format.

### Creative Mechanic
The cognitive or emotional move that makes a concept land: how the viewer arrives at the truth. Not what you say (angle) and not what it looks like (format): the mechanism between them.

**Test:** if you swapped out the specific subject but kept the *underlying move*, would it still work the same way in a totally different niche? Mechanics are about how the persuasion or humor actually functions, separate from both the visual shape (format) and the argument being made (angle).

**Stack position:** the mechanic is chosen AFTER the angle and BEFORE the hook. The hook triggers the mechanic; the format delivers it.

### Hook
The opening line, visual, or moment of a video ad, meant to stop the scroll and earn the next few seconds.

**Test:** would this sound natural if a person spoke it out loud at the very start of a video? A hook is spoken-shaped.

### Headline
The primary written line of an ad, or an on-screen title/text overlay used in place of a spoken hook.

**Test:** would this sound unnatural or stiff if spoken out loud, but work well written down? Headlines are written-shaped.

**Hook vs. headline default:** on-screen text overlay with no spoken line is a headline; a line the creator says out loud is a hook.

**Save patterns, not lines.** Hook and headline entries are saved as reusable *patterns* with one example fill from the source, never as verbatim lines to reuse.

---

## How to build the banks (step by step)

### Step 1: Pull the brand's full creative library

Only run this step for a bank that came back empty in the prerequisite check above. Pull all creatives with delivery in the last 365 days, with glossary tags and metrics:

```
motion meta insights --workspace-id <id> --date-range last_365d --include-metrics \
  --glossary-category visual-format --glossary-category hook-tactic \
  --glossary-category headline-tactic --glossary-category asset-type \
  --glossary-category messaging-angle --sort topSpend
```

This returns the full creative set with AI tags for every glossary category. Record totalCount and providerTotalCount to confirm completeness.

### Step 2: Get the glossary vocabulary

```
motion ai-glossary
```

This returns every category and every value within it, with definitions. Use this as the classification vocabulary for formats, hook tactics, and headline tactics.

### Step 3: Build the Visual Formats bank

For each visual-format tag value in the pull:
1. Count creatives and sum spend
2. Identify the asset type (video, static, etc.) for each creative carrying that format
3. Note which product each creative belongs to (from the ad name's product tag, confirmed with the team)
4. Find the top-spend creative for that format and pull its summary (`--summary-sections adDescription`)
5. For statics, verify the actual image layout by opening the creative URL directly
6. Write one entry file per format with: workspace ID, what it is, medium (video/static/both), tested product(s), evidence (creative IDs + spend), and cross-references
7. Add one row to the index

**Standing rule:** when a format's medium is "both," always state the exact asset type (video or static) actually being proposed in any concept. Never leave it as "both" in a recommendation.

**Standing rule:** never use "Other" as a category. If Motion tagged something "Other," pull the actual creative content and reclassify it.

### Step 4: Build the Hooks and Headlines bank

For each hook-tactic and headline-tactic tag value:
1. Count creatives and sum spend
2. Find the top-spend creative and pull its transcript and hook summary (`--include-transcript --summary-sections hookOrHeadline`)
3. Extract the verbatim spoken hook or written headline
4. Extract the visual description (what's on screen during the hook/headline)
5. Write one entry file per tactic with: workspace ID, verbatim line, visual description, evidence, and cross-references to mechanics and formats
6. Add rows to the index (separate tables for hook tactics and headline tactics)

**Standing rule:** every hook or headline entry must include both the verbatim line AND a visual description. A verbatim line alone is not a complete entry.

**Standing rule:** whenever a headline entry's extracted text has no natural line breaks, verify the actual creative image before treating it as a compact, reusable headline pattern. Some "headlines" are actually full testimonials rendered at scale on a quote-card layout.

### Step 5: Build the Creative Mechanics bank

Motion has no AI tag for creative mechanics. This bank is built by reading the actual creative breakdowns and identifying the structural device.

**Tier 1: Universal presets.** Every brand starts with these 8 presets (from the creative mechanics teaching layer):

1. The Implied Answer - hook poses a question, visuals silently answer
2. The Social Witness - someone else notices the change
3. The Overheard Conversation - framed as a text thread or DM
4. The Reframe - validates a belief, then flips it
5. The Borrowed Enemy - describes a competitor without naming them
6. The Trojan Horse - looks like content until the final 20%
7. The Contrast Without Comment - two realities side by side, no voiceover
8. This and a... - product placed next to something aspirational

For each preset, check whether the brand's ad library contains a real example. Mark as "tested" or "not confirmed."

**Tier 2: Brand-discovered mechanics.** Pull creative breakdowns (`--summary-sections creativeBreakdown`) for a stratified sample of the brand's ads. Read the storyline to identify the structural device. For each new mechanic found:
1. Describe what you saw (the hook, the visual, the structure)
2. Name the cognitive move (what did the viewer have to do to get the point?)
3. Identify why it bypassed ad resistance
4. Tag awareness-stage fit
5. Add an example

Write one entry file per mechanic with: workspace ID, what it is, why it works, awareness-stage fit, evidence, and cross-references.

### Step 6: Confirm with the team

Present all proposed entries grouped by bank. The team approves all, approves per bank, or strikes individual entries. Nothing saves without a human yes (per `06-library-confirmation.md`).

### Step 7: Set up the weekly nominations routine

After banks are confirmed, create a weekly routine that:
1. Pulls the last 7 days of top-performing creatives using this workspace's stable ID
2. Compares their tags against what's already in this workspace's three banks, after verifying the recorded workspace ID
3. Proposes any new patterns as nominations
4. Delivers to the team for approval

This is the Analysis-feeds-banks loop, operationalized.

---

## Tracking used status

Every bank entry, owned-evidence or confirmed-external, carries a used-status field alongside its evidence:

- **Never surfaced** - confirmed in the bank, never chosen for a generated concept yet.
- **Surfaced, not launched** - recommended in a generated concept, but not yet confirmed as an actual ad that ran.
- **Launched** - confirmed by the team as an actual ad that ran, with the launch date.

New entries start at "never surfaced." Confirmed-external entries (per `02-ideation-engine.md`) always start here too, being untested as this brand's own ad is their defining trait. An entry only moves to "launched" when someone explicitly confirms it, being recommended in a concept is not the same as being run, and that confirmation never happens automatically.

Keep this status on the entry file itself, not a separate rollup, so it travels with the evidence. When asked "what haven't we tried" (or a person wants to browse never-surfaced or surfaced-not-launched entries directly), read that status straight off the entries across the three banks rather than re-deriving it by rescanning full evidence history each time.

---

## The "Tested on" product tag

Every entry in every bank carries a "Tested on" line naming which product(s) the evidence actually belongs to. This is read from the ad name's product tag, confirmed with the team during the naming-convention walkthrough. If a format is tested on Product A but not Product B, that's stated explicitly, not assumed to transfer.

---

## Multi-library saves

One creative can produce more than one bank entry. A testimonial video might earn a format entry (testimonial), a mechanic entry (confession-pivot), and a hook entry (the specific opening line). Save each aspect to its own bank and cross-reference them back to each other.

Never force a save into one library when two aspects were genuinely present, and never pad into extra libraries when only one thing was actually there.

---

## The trends exception

A trend is a time-bound viral package tied to a specific cultural moment. Its elements are one inseparable unit. Something is only filed as a trend when the person explicitly says it's a trend. If they don't say it, classify it through the normal libraries.
