---
triggers:
  phrases:
    - "set up ugc creator programme"
    - "personalize ugc creator programme"
    - "reconfigure ugc creator programme"
    - "set up the creator programme app"
    - "add creators to the app"
    - "populate the creator programme"
  intent: "User wants to configure or populate the ugc-creator-programme app for their brand"
---

# Skill: setup-ugc-creator-programme

Guides the user through populating the creator programme app for their brand. Checks the brain for existing context before asking anything, then only asks about gaps. Writes directly to `/agent/brain/ugc-creator-programme/creators.json` after each answer.

---

## When to use

- Automatically after install (final post-install step)
- Any time the user wants to add, update, or reconfigure the creator programme
- When the user wants to populate VIP relationships, ambassador programme data, or sourcing targets

---

## What this writes to

All answers write to: `/agent/brain/ugc-creator-programme/creators.json`

The app reads from this file on every page load. Changes take effect immediately — no rebuild required.

---

## Execution

### Step 0 — Pre-flight: read the brain before asking anything

Do all of this silently before showing the user anything.

**0a. Check for an existing `creators.json`**

Read `/agent/brain/ugc-creator-programme/creators.json`.

- If it exists and has real data (`brandName` is not `{{BRAND_NAME}}`, `personas` has keys, or arrays have entries): this is a reconfigure. Jump to Step 9 and offer to update specific sections rather than starting over.
- If it exists but is still template/empty: continue setup using whatever is already filled in.
- If it doesn't exist: create it from the empty template shape and continue.

**0b. Check `/agent/INDEX.md` for relevant saved knowledge**

Read the index. Look for entries related to:
- Brand context, brand name, brand platform, product positioning
- Audience personas, persona map, audience brain, audience segments
- Ambassador programme, creator tracking, influencer roster, gifting tracker
- Creative principles, ad performance learnings, selection criteria, graveyard patterns
- VIP relationships, investors, brand partners, key talent

Note the paths to any relevant files. You will read these in 0c.

**0c. Read the relevant brain files**

For each relevant file found, read it and extract:

| What you're looking for | Where it typically lives |
|---|---|
| Brand name | Brand context file — company name, brand name, product name |
| Audience personas / segments | Audience map or persona index — named audience types |
| VIP relationships, investors, partners | Ambassador programme file, brand context, investment proposal notes |
| Active ambassador programme | Ambassador tracking file — names, handles, codes, content counts |
| Existing creator roster or past UGC work | Creator lists, influencer trackers, past campaign notes, gifting records |
| Creator selection criteria | Creative principles file — what makes a good creator, ad performance patterns |
| Disqualifiers | Graveyard section, failed creative patterns, messaging fatigue notes |

**0d. Build a pre-populated draft**

From everything found, assemble a draft `creators.json` with as much pre-filled as possible:
- `brandName` — from brand context
- `personas` — map each known audience segment to a kebab-case key and label
- `selectionCriteria` — from creative principles and performance learnings
- `disqualifiers` — from graveyard patterns or failed messaging notes
- `vipCreators` — from investor, partner, or VIP relationship data
- `ambassadors` — from active ambassador programme data
- `creators` — from any existing creator roster or past UGC campaign lists

**0e. Show what was found — one clear message before asking anything**

> "Before I ask you anything, I checked what's already in the brain. Here's what I found:
>
> ✓ **Brand name:** [value] or — not found
> ✓ **Audience personas:** [N found — e.g. Strava Millennial, Sporty Dad...] or — none found
> ✓ **Selection criteria:** [N derived from creative principles] or — none found
> ✓ **VIP relationships:** [names] or — none found
> ✓ **Ambassadors:** [N found] or — none found
> ✓ **Existing creators / roster:** [N found] or — none found
>
> I'll only ask you about the gaps. If anything pre-filled looks wrong, just tell me."

Then proceed — **skip any step where the answer was already found and confirmed**. For steps with partial data, show what was found and ask only for what's missing.

---

### Step 1 — Brand name and subtitle

**Skip if found in Step 0.** If brand name was found, confirm:
> "I'll use '[brand name]' — correct?"

If not found, ask:
> "What's your brand name? This appears in the app header."

Write `brandName` in the JSON after confirmation.

For the subtitle — show the default and ask only if not already set:
> "What's the one-line subtitle? Sits under the brand name in the header. Something like 'Find the right creator for every campaign' — or leave it as 'Creator Programme'."

Write `brandSubtitle`.

---

### Step 2 — Audience personas

**Skip if found in Step 0.** If personas were found in the brain, show them and ask for confirmation:
> "I found these audience segments: [list]. I'll use these as the filter tabs — anything to add, remove, or rename?"

If not found, ask:
> "What are the core audience types you're targeting with creators? Give me a short name for each segment — for example 'Weekend Runner', 'New Mum', 'Golf Enthusiast'. These become the filter tabs in the app."

For each segment (confirmed or new):
- Generate a lowercase hyphen-separated key (e.g. `weekend-runner`)
- Use the full name as the label

Write to `personas` as `{ "weekend-runner": "Weekend Runner", ... }`.

---

### Step 3 — Creator selection criteria

**Skip if found in Step 0.** If criteria were derived from creative principles or performance data, show them:
> "I pulled these creator criteria from your brand's creative learnings: [list]. I'll use these in the app — anything to add or change?"

If not found, ask:
> "What makes a creator a good fit for your brand? Give me your 3–6 must-have criteria — a short rule and a sentence on why it matters for each."

Do the same for disqualifiers — **skip if found in Step 0**, otherwise ask:
> "What are your instant disqualifiers — creator traits that mean you'd remove someone from the list regardless of fit?"

Format each as `{ "main": "...", "sub": "..." }`. Write to `selectionCriteria` and `disqualifiers`.

---

### Step 4 — Tier definitions

Show defaults and ask for confirmation only:
> "Here are the tier definitions I'll use — these explain what each badge means to anyone using the app:
> - **Tier 1:** Reach out this week — accessible rate, strong fit, direct DM appropriate
> - **Tier 2:** Second wave — needs one verification step or rate negotiation first
> - **Tier 3:** Bigger campaign — agent/formal process, save for a larger budget
>
> Keep these or tell me what to change."

If changes requested, update `tierDescriptions.tier1`, `tier2`, `tier3`.

---

### Step 5 — VIP relationships

**Skip if found in Step 0.** If VIP relationships were found in the brain, show them:
> "I found these key relationships in the brain: [names + roles]. I'll pre-fill them with brief recommendations — want to review or add anyone?"

If not found, ask:
> "Do you have key people you already have direct access to — investors, brand partners, or commercial relationships with specific brief opportunities? For each, give me: name, handle, their role, which product to promote, urgency (urgent / normal / low), and the best brief angle."

For each, add to `vipCreators`:
```json
{
  "id": "<kebab-case-name>",
  "name": "...",
  "handle": "@...",
  "handleUrl": "https://...",
  "role": "...",
  "product": "...",
  "urgency": "urgent | normal | low",
  "urgencyNote": "...",
  "briefAngle": "...",
  "strategicNote": "...",
  "doNotDo": "..."
}
```

Ask "Anyone else?" after each before moving on.

---

### Step 6 — Active ambassador programme

**Skip if found in Step 0.** If an active ambassador programme was found in the brain, show a summary:
> "I found [N] active ambassadors in the brain — I'll pre-fill them. Want to review first, or add any new ones?"

If not found, ask:
> "Do you have an active ambassador or affiliate programme? If so, I can add those creators here so the team can see brief recommendations, discount codes, and content tracking in one place.
>
> For each ambassador: name, handle, niche, follower count, discount code (if they have one), how much content they've posted, when they were last active, and any notes."

For each, add to `ambassadors`:
```json
{
  "name": "...",
  "handle": "@...",
  "handleUrl": "https://...",
  "niche": "...",
  "followers": "...",
  "code": "...",
  "contentCount": "2 Reels + 3 Stories",
  "lastActive": "...",
  "notes": "...",
  "nextBrief": "..."
}
```

Then ask:
> "Any priority callouts to pin at the top of the ambassador section? For example: '[Name] has 100K followers and hasn't posted yet — chase this week.'"

Add to `priorityCallouts` as plain strings.

---

### Step 7 — Existing creator roster and past UGC work

**Check Step 0 first.** If an existing creator roster or past UGC campaign lists were found in the brain, show them:
> "I found [N] creators from your existing roster/past work in the brain — I'll add them to the sourcing tab. Want to review first?"

Whether or not anything was pre-filled, also ask:
> "Do you have any other creators you've already worked with, vetted, or have on your radar — outside of the ambassador programme? This could be past UGC creators, previous campaign talent, or people you're tracking.
>
> If you have a list — a spreadsheet, a doc, or even just names — share it and I'll format everything for the app. Or skip and add them later one by one."

**If they share a list:**
Parse each entry. For each creator, extract or ask for:
- Name, platform handle(s) + URL(s)
- Audience persona — must match a key from the personas defined in Step 2. If unclear, ask.
- Tier (1, 2, or 3) — if unclear, default to Tier 2
- Follower count
- Engagement signal (one key fact, e.g. "8.5% engagement, 90% male")
- Estimated rate (or "Verify before estimating")
- Video confidence: `confirmed` / `likely` / `verify`
- Video evidence — what you know about their on-camera style
- Why they fit the brand
- Best brief angle
- Any caveats
- Outreach DM — the first message to send

If a field is missing and can be reasonably inferred from what's known about the creator, infer it and note you've done so. Only ask if inference isn't possible.

If the DM starts with `N/A —`, the card shows it as a sourcing note rather than a copyable DM. Use this for platform entries (e.g. Insense, JoinBrands).

**If they want to skip:**
Confirm they can say "add [name] to the creator programme" at any point to add creators individually.

---

### Step 8 — Creator sourcing platform (optional)

Ask:
> "Do you use a creator sourcing platform — like Insense, JoinBrands, Billo, or similar? This is completely optional. If you do, I can save the platform name so you can easily import new creators later.
>
> a) Yes — save the platform name
> b) No — I'll manage everything manually
> c) Not yet, but I'm curious what's out there"

**If yes:** Ask which platform. Save:
```json
"sourcingPlatform": {
  "name": "Insense",
  "importNote": "Export creator list and share it — I'll format and add to the sourcing tab."
}
```

**If no:** Save `"sourcingPlatform": null` and move on.

**If exploring:** Briefly mention that Insense, Twirl, JoinBrands, and Billo are popular UGC-focused platforms. All support manual export which this app can ingest. The app works entirely without one. Save `null` and move on.

---

### Step 9 — Confirm

After all data is written, confirm:
> "Creator programme is set up. Here's a summary:
>
> - **Brand:** [brandName]
> - **Personas:** [N] audience segments
> - **Selection criteria:** [N] / disqualifiers: [N]
> - **VIP relationships:** [N]
> - **Active ambassadors:** [N]
> - **Existing roster / past UGC:** [N]
> - **Sourcing platform:** [name or 'none — managing manually']
>
> The app is reading live from the data file — no rebuild needed. Open it to verify everything looks right."

Surface the app URL if available.

---

## How to add a single creator later

If the user says "add [name] to the creator programme" at any time:
1. Ask for the details (persona, tier, handles, followers, rate, video confidence, brief angle, DM)
2. Read the current JSON from `/agent/brain/ugc-creator-programme/creators.json`
3. Append to `creators` array
4. Write the updated JSON back
5. Confirm: "Added [name] to the sourcing list. The app will show them immediately."

---

## How to import from a creator platform later

If the user says "import creators from [platform]" or "add creators from my platform":
1. Ask them to share the list — CSV, spreadsheet paste, or plain text per creator
2. Parse each entry into the standard creator format
3. Ask which persona each belongs to (reference the defined personas)
4. Write to `creators` array in the JSON
5. Confirm the count added

---

## Fallbacks

- **`creators.json` missing:** Create it from the empty template shape, then continue setup
- **User wants to reset:** Ask for confirmation, then overwrite with the empty template
- **App returns 404 on `/api/creators`:** The JSON file is missing or was moved — re-run setup to restore it
- **Persona key mismatch:** If a creator's `arch` value doesn't match a key in `personas`, it will still render with a default colour — just won't have a filter button. Add the missing key to `personas` to fix.
- **Brain files not found:** Proceed with blank slate — do not guess or assume brand context. Ask the user directly.
