---
name: setup-competitor-intel
description: >
  First-time setup and reconfiguration skill for the competitor-intel use case.
  Walks through selecting competitor brands, resolving them in Motion's ad library,
  configuring Slack delivery, and scheduling the weekly routine. Safe to re-run at any time.
triggers:
  phrases:
    - "set up competitor watch"
    - "configure competitor watch"
    - "add a competitor"
    - "remove a competitor"
    - "change my competitors"
    - "update my watchlist"
    - "reconfigure competitor watch"
    - "personalize competitor watch"
  intent: "User wants to configure or update the competitor inspo brands file for this workspace"
  excludes:
    - "run competitor watch"
    - "competitor scan"
    - "competitive intel"
---

# Setup: Competitor Intel Alerts

Configures the competitor inspo brands file and delivery settings for this workspace.
Runs automatically on first install and can be re-invoked any time to add, remove, or change competitors.

**Writes to:** `/agent/brain/competitor-intel/{{WORKSPACE_SLUG}}/inspoBrands.json`

---

## Step 1 — Resolve workspace

Run `motion workspace-goal`. Capture workspaceId and workspace name.
Derive `WORKSPACE_SLUG`: lowercase workspace name, hyphens for spaces, strip special chars.

Check if `/agent/brain/competitor-intel/{{WORKSPACE_SLUG}}/inspoBrands.json` already exists.

If it exists, read it and load the existing brands list. Tell the person:
> "You already have [N] competitors tracked: [names]. Want to add, remove, or change them?
> Or just update the Slack channel?"

Let them answer before continuing. If adding/removing, proceed to Step 2 targeting only the change.
If only updating the Slack channel, skip to Step 4.

If no inspo brands file exists, this is a fresh setup. Continue to Step 2.

---

## Step 2 — Collect competitor brands

Ask one focused question:

> "Who are the 3–5 brands you want to track weekly? You can give me names, website domains, or both."

Wait for the response. Accept any mix of brand names and domains.

For each brand provided, resolve it in Motion's ad library:

```bash
motion search-brands --search-term "{name or domain}" --limit 5 --with-brand-context
```

Read the returned results. For each brand:
- If one clear match: confirm it: "Found [Brand Name] — is that the one?"
- If multiple close matches: list them (name + brief description) and ask which
- If no match: tell the person the brand isn't in Motion's ad library yet. Offer to try a
  different search term. If still not found, skip and note it.

Do not move to the next brand until the current one is resolved or explicitly skipped.

After all brands are resolved, confirm the full list before writing:

> "Here's your inspo brands file:
> • [Brand 1] (brandId: ...)
> • [Brand 2] (brandId: ...)
> • [Brand 3] (brandId: ...)
>
> Look right?"

Wait for confirmation before writing.

---

## Step 3 — Write the inspo brands file

Once brands are confirmed, write to `/agent/brain/competitor-intel/{{WORKSPACE_SLUG}}/inspoBrands.json`:

```json
{
  "workspaceId": "{{WORKSPACE_ID}}",
  "workspaceName": "{{WORKSPACE_NAME}}",
  "createdDate": "YYYY-MM-DD",
  "updatedDate": "YYYY-MM-DD",
  "slackChannelId": null,
  "scheduleDay": "monday",
  "scheduleTime": "09:00",
  "ownBrandId": null,
  "brands": [
    {
      "name": "Brand Name",
      "brandId": "motion-brand-id",
      "slug": "brand-slug",
      "addedDate": "YYYY-MM-DD"
    }
  ]
}
```

`slug` is the brand name lowercased, hyphens for spaces, stripped of special chars.
`slackChannelId` stays null until Step 4.

---

## Step 3b — Resolve own brand (optional)

Run `motion search-brands` using the workspace name as a search term to find the workspace's own brand in Motion's ad library:

```bash
motion search-brands --search-term "{workspaceName}" --limit 5
```

Read the results.

- **If one clear match:** Confirm: "I found [Brand Name] in the ad library — is that your brand?"
  If yes, store the `brandId` as `ownBrandId` in the inspo brands file.
- **If multiple matches:** List them and ask which is theirs.
- **If no match:** Ask: "What's the name your brand uses in advertising? I'll search for it."
  Try one more search with the provided name.
  If still not found, set `ownBrandId` to null and note:
  > "No problem — your brand comparison table will be skipped until we can locate you in the ad library."

**If the user wants to skip own-brand comparison:** Set `ownBrandId` to null.

Update `ownBrandId` in the inspo brands file.

---

## Step 4 — Slack delivery

Ask:

> "Which Slack channel should the weekly competitor report go to?
> Paste the channel name or ID and I'll set it up."

If they provide a channel name (e.g. `#competitive-intel`), search for it:
```bash
slack search channels {channel name}
```
Confirm the match and extract the channel ID.

If they skip or say "not yet," set `slackChannelId` to null and note:
> "No problem — reports will appear in your chat thread until you configure a channel.
> Just say 'set up competitor watch' any time to add one."

Update `slackChannelId` in the inspo brands file.

---

## Step 5 — Schedule

Ask:

> "What day and time should this run each week?
> Default is Monday at 9am in your workspace timezone."

If they accept the default or don't specify, use `monday` at `09:00`.
If they specify a day and/or time, parse and confirm: "Got it — every [day] at [time]."

Update `scheduleDay` and `scheduleTime` in the inspo brands file.

Derive the workspace timezone from the sandbox runtime:
```bash
WORKSPACE_TIMEZONE=$(cat /agent/.runtime/timezone 2>/dev/null || echo "America/New_York")
```

Then create the reminder:

```bash
reminder add --recurrence "every {scheduleDay} at {scheduleTime} {WORKSPACE_TIMEZONE}" \
  --message "Run competitor watch for {{WORKSPACE_SLUG}}" \
  --conversation-id {currentConversationId}
```

Read the returned reminder shortId. Store it in the inspo brands file as `reminderId`.

---

## Step 6 — Confirm and offer first run

Summary message:

> "You're set up. I'll scan [brand names] every [day] at [time] and post to [#channel / this thread].
>
> Want me to run the first scan now to establish baselines? The first run won't produce a delta
> report — it just captures current state so next week's run has something to compare against."

If yes, immediately invoke the `competitor-intel` skill.
If no: "No problem — I'll run it automatically on [next scheduled day]."

---

## Inspo brands update flows

**Adding a brand:** Resolve the new brand (Step 2 single-brand flow), append to `brands` array,
update `updatedDate`, confirm. Do not touch other fields.

**Removing a brand:** Confirm the removal ("Remove [Brand Name] from your inspo brands file?"),
remove from `brands` array, delete their baseline file at `baselines/{slug}.json`,
update `updatedDate`.

**Changing Slack channel:** Skip to Step 4 only.

**Changing schedule:** Skip to Step 5 only. Delete the old reminder (by stored `reminderId`) before
creating the new one.


