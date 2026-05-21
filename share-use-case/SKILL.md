# Skill: share-use-case

Guides a user to build a new use case from scratch and share it with the marketplace as a zip ready to submit. One conversation, start to finish. No prerequisite skills required.

---

## When to use

When anyone wants to share a capabilitiy or successful outcome with the marketplace so others can discover and install it.

---

## Core principle

**Use case first. Always.**

Before generating any file, the use case must be named as a job: what does this enable for someone? If the answer is vague or structural ("I want a skill that does X"), push back and find the human outcome first. Do not proceed until the use case is clear.

If the user skips straight to implementation, reframe: "What does that enable for the team? What can someone do tomorrow that they can't do today?"

---

## Execution

### Phase 1 — Route: improvement or new?

Before asking anything:

1. Check `/agent/brain/use-cases/` for existing staged use cases
2. Read what the user is describing or working on in this conversation
3. Compare the two — do any staged use cases match what the user is describing?

**If a match is found:**

Load every file in that use case folder. Read all of them. Identify specifically what is different between the existing version and what the user is describing. Then tell the user — do not ask:

> "Looks like you're improving `<id>` (currently v<version>) — it looks like you're [specific description of the changes]. I'll go ahead and make a new version for you."

Then follow exactly one of these paths — no other phases apply:

| What changed | Start here | Then | Then | Then |
|---|---|---|---|---|
| Text only — wording, docs, clarifications | Phase 4 (edit files) | Phase 5 (validate) | Phase 6 (share) | — |
| New or changed token | Phase 3 (update tokens) | Phase 4 (update files) | Phase 5 (validate) | Phase 6 (share) |
| New install step, new file, renamed file, new app or brain seed | Phase 2 (re-map inventory) | Phase 3 (re-check tokens) | Phase 4 (update files) | Phase 5 then Phase 6 |

Before Phase 6, bump the version:
- Text-only fix → **patch** (1.0.0 → 1.0.1)
- New optional capability or token with fallback → **minor** (1.0.0 → 1.1.0)
- Breaking change — path moves, token renamed, install step removed → **major** (1.0.0 → 2.0.0)

**If no match is found → go to Phase 1b.**

---

### Phase 1b — Name the use case

Ask: **"What does this enable for the team?"**

Push for one clear sentence naming the human outcome — not the mechanism:
- "The agent remembers who it's talking to across sessions."
- "CSMs can see at a glance which sandboxes are healthy."
- "The agent tracks ad account performance daily without being asked."

If the answer names a mechanism, reflect it back as a job and confirm before continuing.

Once confirmed:
- Derive a kebab-case `id` from the outcome
- Confirm the ID with the user
- Create the folder: `/agent/brain/use-cases/<id>/`

---

### Phase 2 — Map the install inventory

Walk through each install type and ask whether this use case needs it.

**2a. Behavior snippet** — Does this change how the agent behaves in every conversation?

First, identify the trigger type:

- **Session-open** — runs once at the start of every conversation. Belongs in `user.md`.
- **Per-turn** — runs after every response. Belongs in `user.md`.
- **Event-triggered** — fires when a specific message, phrase, or condition occurs. **Does not belong in `user.md`. Route to Phase 2b as a skill instead.**

If the trigger is session-open or per-turn, continue here. If the trigger is event-based, stop and go to Phase 2b.

**For session-open and per-turn snippets:**
- What should the agent do?
- What section of `user.md` does it extend?
- Draft in plain language first, then format as a `user.md` section.
- Identify `insert-after` target. Default: `## System routines`. If none fits, use `insert-fallback: append`.

Before finalising, check all of the following:
- **Write operations show exact format** — show the JSON shape, field names, values. Never just say "add the mapping."
- **Not-found paths are explicit** — specify what to do when a lookup fails. Don't leave it to inference.
- **Per-turn updates have a mindset frame** — include the reflective framing, not just which sections to fill.
- **Reflection instructions are specific** — "answered before reading the brief" beats "do better next time."
- **Entity file update triggers are named** — preference stated, pattern confirmed, decision made, blind spot surfaced. Not just "if anything new came up."

**2b. Skill** — Does this need a new reusable workflow the agent follows on demand, or is there an event-triggered behavior from 2a that routes here?

For every skill, capture:
- What are the inputs?
- What are the key steps?
- What does it produce or write?

**Trigger description (required for event-triggered skills):**

Every event-triggered skill must include a YAML trigger block at the top of its SKILL.md. This is how Runneth knows to invoke the skill when a matching message comes in, without relying on `user.md` to catch it.

Format:

```yaml
triggers:
  phrases:
    - "save * to <use case name>"
    - "<use case action> the * <entity>"
  intent: "<plain English description of what the user is trying to do>"
  context: "<any conversation state that must be true for this to fire>"
  excludes:
    - "<phrases that look similar but should not trigger this skill>"
```

Rules for the trigger block:
- `phrases` uses `*` as a wildcard. Be specific enough to avoid false positives.
- `intent` is a plain-English sentence describing the user’s goal. This is the primary match signal.
- `context` is optional. Use it when the skill should only fire given a specific prior state (e.g. "user has just saved a brief").
- `excludes` is optional. Use it when a phrase pattern would otherwise collide with another skill or general conversation.
- The trigger block must be the first section of SKILL.md, before any other content.

Draft the full SKILL.md including: trigger block, when to use, inputs, execution steps, outputs, changelog.

**2c. Brain seeds** — Does this need files to exist in the brain before it works?

If yes, for each seed file:
- What is the file path?
- What format? (JSON, Markdown, other)
- What is the starting content?
- Skip if exists? (almost always yes — `if-not-exists: true`)
- Merge strategy if exists? (`preserve-keys` is the safe default for JSON)

**Folder seed check** — does this need an entire directory seeded, not just individual files? (e.g. a brain template folder with multiple files.) If yes, include the full folder in the use case and note it as a `folder-copy` in the install-config rather than individual file entries.

**Entity template check** — does this use case create new entity files at runtime? If yes, there must be a seed template for that entity. Add it as a brain seed and reference it in the behavior snippet.

**2d. App** — Does this include a running sandbox app?

If yes:
- What is the app name? (used for `app create <name>`)
- What source files does it need? (server/, frontend/ or similar)
- Does it have a build step? (almost always yes — `app build`, `app verify`)
- Does the app URL need to be surfaced after install? (`app list` to get the route)
- Are there post-build onboarding steps the user or Runneth needs to take?

For app use cases, capture the full sequential setup in the README as numbered steps (see install order below). The install-config `installs` array handles file copies; app create/build/verify and post-install steps go in a `post-install` section of the install-config.

**2f. Setup skill** — Does this use case need significant per-sandbox personalization?

Ask: are there things a user must provide for this use case to work well for their specific sandbox that go beyond simple token substitution? Examples:
- Org-specific context the agent needs to know (brand voice, product descriptions, team structure, naming conventions)
- Choices that affect how the behavior snippet or skill behaves
- Multiple required tokens with no sensible universal fallback
- Configuration decisions a new user would be confused about without guidance

If yes, create a `setup-<id>` skill as part of the use case package.

**The setup skill:**
- Named `setup-<id>/SKILL.md` in the use case folder
- Runs automatically as the final post-install step
- Can also be re-invoked later via a YAML trigger (e.g. `"set up <id>"`, `"personalize <id>"`, `"reconfigure <id>"`)
- Walks the user through every key personalization point with targeted questions
- After each answer, writes it to the right place — brain seed file, token substitution, or behavior snippet update
- Ends with a summary of what was configured and confirms the use case is ready

**Setup skill structure:**

```yaml
triggers:
  phrases:
    - "set up <id>"
    - "personalize <id>"
    - "reconfigure <id>"
  intent: "User wants to configure or re-configure <id> for their sandbox"
```

Then, for each personalization point:
1. Ask one focused question
2. Explain why it matters and how it will be used
3. Offer a sensible default they can accept or override
4. Write the answer to the right place immediately after they respond
5. Move to the next point

Do not ask all questions upfront as a list. One at a time, in dependency order.

Add the setup skill to the `post-install` array in `install-config.json` as the final step:
```json
{
  "action": "skill-invoke",
  "skill": "setup-<id>",
  "name": "Personalize for this sandbox",
  "description": "Guides the user through configuring this use case for their specific context",
  "manual": false
}
```

**2e. Post-install steps** — Are there steps that must run after files are copied?

Examples: `app build`, `app verify`, getting the app URL, running an onboarding command, seeding a database.

For each post-install step:
- What command or action?
- What does it produce that later steps depend on?
- Is it automated or does it require a human action?

Post-install steps go in `post-install` in the install-config. Steps that require human action are flagged as `manual: true`.

**2g. Post-install intro** — required for every use case.

The last thing every install does is surface a short intro that tells the user what just opened up and gives them 3-5 paste-ready prompts to try right now. Without this, installs end in silence and the user has to figure out what changed.

For every use case, capture:
- **What just opened up** — 2-3 sentences in present tense naming the human outcome, not the mechanism. The "moment it clicks" reframe.
- **Try this now** — 3-5 concrete prompts the user can paste into chat immediately, each with a one-line "you'll get back" description. Every prompt must actually work in a fresh sandbox with this use case installed.
- **Compounds with** (optional) — 0-2 entries naming other use cases or integrations this stacks with, one sentence each on the stack.

Draft `post-install-intro.md` with the three sections using the exact headings: `## What just opened up`, `## Try this now`, `## Compounds with`. Voice is "smart colleague handing off a tool," not marketing. Total prose under 250 words. No em or en dashes.

The matching install-config step is the **final** entry in `post-install[]`:

```json
{
  "action": "show-intro",
  "name": "Introduce the new capability",
  "file": "post-install-intro.md",
  "description": "Read post-install-intro.md from this use case folder. After all prior install and post-install steps complete, surface the file's sections to the user in chat as the closing message of the install turn: '## What just opened up' as prose, '## Try this now' as a numbered prompt list, '## Compounds with' only when present and at least one named use case is installed in the sandbox. Resolve any {{TOKEN}} placeholders using the same customize map applied during install."
}
```

The `description` field is the instruction the agent follows; the action label is a tag, not a code path.

See `.use-case-library/post-install-intro-spec.md` in the repo for the full convention, voice guidance, and worked examples.

A use case may legitimately skip the intro only when it is pure plumbing (e.g. `authenticate-apps` is consumed by other apps, never installed directly by humans). Document the skip in the README under "Why no post-install intro." Skipping is rare; default is to ship one.

---

### Phase 3 — Surface the tokens

For every file, identify every value that will differ between orgs:
- File paths that assume a specific brain structure
- Names, emails, IDs, or org-specific references
- Any value a CSM might reasonably need to change

For each token:
- Name it in double-brace UPPER_SNAKE_CASE format
- Write a plain-language description for CSMs
- Required or optional?
- If optional, set a sensible fallback that works for 90% of sandboxes

Explicit check: read every drafted file line by line for hardcoded values that should be tokens. Universal paths (e.g. `/agent/.runtime/conversations.db`) do not need tokens.

---

### Phase 4 — Generate the files

Generate all files into `/agent/brain/use-cases/<id>/`.

**`install-config.json`** — build from `/agent/brain/use-cases/schema/install-config.schema.json`:
- `schema`: `"1.0"`, `id`, `version`: `"1.0.0"`, `description`, `installs` (brain seeds and folder copies before app steps before behavior snippets), `changelog` (one entry, today, type `major`)
- Include `customize` and `depends` when applicable
- For folder copies: use `"type": "folder-copy"` with `src` and `dest`
- For apps: add a `post-install` array with ordered steps. Each step has `action` (e.g. `app-create`, `app-build`, `app-verify`, `app-url`, `manual`), `name`, and `description`. Flag human steps with `"manual": true`.

**Content files** — apply all tokens as double-brace TOKEN_NAME placeholders:
- Behavior snippets: include sentinel `<!-- use-case: <id> v<version> -->` at top and `<!-- /use-case: <id> -->` at bottom
- Skill stubs: all sections filled in
- Brain seeds: correct starting content
- Folder seeds: include the full folder structure in the use case share
- Setup skill: if a setup skill was identified in Phase 2f, generate `setup-<id>/SKILL.md` with the full YAML trigger block and one-question-at-a-time personalization flow. Every question must name the brain file or config path it writes to after the user answers.

**`README.md`** — the README serves two audiences: CSMs installing the use case and Runneth operating it at runtime. Include all sections that apply.

*Always include:*
1. Use case name (h1) — human outcome
2. What this enables — 2–3 sentences
3. Install time and requirements
4. Setup steps — numbered, sequential. For simple use cases: "Install via INSTALL-PROTOCOL.md." For app use cases: full step-by-step setup commands the installer runs in order.
5. What this creates — file tree of everything that lands in the sandbox after install
6. What to customize — token table (omit if no tokens)
7. Fallbacks
8. Version history

*Include for app use cases:*
- **How Runneth uses this** — the exact commands or phrases that trigger each capability, what Runneth reads/writes, and what it produces. This is what Runneth reads at runtime to know what to do.
- **Key API endpoints** — table of method, path, and description for every endpoint Runneth calls
- **Ongoing maintenance** — any cadences Runneth should follow (e.g. rubric refinement triggers, score thresholds, archival rules)
- **Agent shell notes** — any encoding constraints, curl patterns, or runtime quirks the agent needs to know (e.g. ASCII-only payloads, chunked transfer for large posts)

---

### Phase 5 — Validation

#### 5a — Mechanical checks

Run programmatically. Surface all failures before 5b.

**Structural:**
- `install-config.json` schema-valid, `id` matches folder name, valid semver, non-empty description
- Every `installs[*].file` exists in the folder
- `changelog[0].version` matches `version`
- `README.md` present

**Org-agnostic:**
- No emails, org names, org IDs, or org-specific paths in any file
- Every token in content files declared in `customize`
- Every token in `customize` used at least once in a content file
- Required tokens have no `null` fallback

**Install order:**
- Brain seeds before behavior snippets in `installs`
- `depends` IDs are real use cases that exist in the library

**Setup skill checks (if present):**
- `setup-<id>/SKILL.md` exists in the folder
- YAML trigger block is the first section
- Every personalization question names the file or path it writes to
- Setup skill runs before the intro in `post-install`
- Setup skill can be re-invoked after install (trigger covers `set up`, `personalize`, `reconfigure`)

**Post-install intro checks:**
- `post-install-intro.md` exists at the use case root (or README documents "Why no post-install intro")
- Three sections present with exact headings: `## What just opened up`, `## Try this now`, `## Compounds with` (last optional)
- "What just opened up" is 2-3 sentences, present tense, names the human outcome
- "Try this now" has 3-5 numbered entries, each with paste-ready prompt + "you'll get back" line
- Every `{{TOKEN}}` in the intro is declared in `install-config.json` `customize`
- `install-config.json` has the `show-intro` step as the **final** entry in `post-install[]`
- Total prose under 250 words; no marketing voice; no em or en dashes

#### 5b — Staff designer review

You are a world-class product designer who has shipped experiences used by millions of people. You have strong opinions and you share them. Your job is not to find minor issues — it is to make the experience of installing and using this use case feel remarkable. Mediocre is not acceptable. If something is confusing, say it bluntly. If something is missing, name exactly what it should be. If the first-time experience would make a user feel lost or stupid, call it out and say what would make them feel smart and capable instead.

Work through every dimension below. For each one, give a verdict and specific, actionable feedback. Do not hedge.

---

**App-specific checks** — run these first if the use case includes an app:
- Does the README give Runneth enough to operate the app cold, without re-reading setup?
- Are API endpoints documented precisely enough to construct a correct call without guessing?
- Are encoding constraints and runtime quirks explicit? A silent failure here destroys trust.
- Does the post-install sequence surface the app URL clearly?
- If the app has a maintenance loop, is the trigger condition unambiguous?

---

**First-time install experience**

Put yourself in the shoes of someone installing this for the first time in a fresh sandbox. They have never seen this use case before. Walk through every step:
- Is the first thing they read clear enough that they know exactly what to do?
- Is the setup sequence obvious, or does it require them to infer order?
- Are there moments where they have to stop and figure something out? Every one of those moments is a failure.
- Does the setup skill (if present) feel like a helpful guide or an interrogation? One question at a time. Each one should feel natural, not bureaucratic.
- What does success feel like at the end of install? Is there a clear moment where they know it worked?

**Verdict:** Would a non-technical CSM get through this install without asking for help? If not, what specifically would stop them?

---

**Clarity of language**

Read every instruction, label, fallback message, and question out loud as if you are the user:
- Are there any instructions where the user has to re-read to understand what action to take?
- Are there any technical terms that a non-technical user would not know?
- Are error messages and fallbacks written in human language, or in system language?
- Are token names and descriptions written for a CSM, not a developer?

**Verdict:** Rewrite anything that required more than one read to understand.

---

**State coverage**

Map every state the sandbox could be in at install time and at first use:
- Fresh sandbox, partially set up, already running with existing data, migrated, Slack-connected, no Slack
- For each: does install succeed? Does the first interaction work? What breaks silently?
- Are empty states handled? What does the user see before any data exists?
- Are error states handled? What happens when something goes wrong?

**Verdict:** Every state that produces a silent failure or a blank experience is a design defect. Name each one and say what the user should see instead.

---

**The moment it clicks**

The best experiences have a moment where the user thinks “oh, this is going to be useful.” Find that moment in this use case:
- When does the user first see the value of what they installed?
- Is that moment as early as it could be? If not, what would make it happen sooner?
- Is there anything that gets in the way of that moment?

**Verdict:** Name the moment and say whether the current design gets the user there fast enough.

---

**Output of 5b — Staff designer:**

For each finding:
- **What’s wrong or missing** — be direct
- **Why it matters** — what does the user experience as a result
- **Exactly what to change** — specific, not directional
- **Priority:** fix now / next version / future

---

#### 5c — Staff PM review

You are a senior PM who has built products people love and products that failed. You know the difference. Your job is not to validate what’s been built — it is to pressure-test whether this is the right thing to build, whether it solves the right problem, and whether it will actually get used. You have opinions and you back them with reasoning. If something is wrong, say so. If something is missing that would make this indispensable, name it. If something is there that nobody will use, say cut it.

Work through every dimension below. Give a verdict on each. Be opinionated.

---

**Does this solve the right problem?**

- What is the actual job this use case does for the customer?
- Is that the most important version of that job, or is there a sharper version?
- Would a customer who installed this and used it for a month feel like it solved their problem, or feel like it got them partway there?
- Is the scope too narrow (misses what they actually need) or too broad (tries to do too much and does nothing well)?

**Verdict:** Does this nail the job, partially address it, or miss it?

---

**Who actually uses this?**

Be precise about the real user:
- **Solo operator**, **small team**, **agency**, **large org**, **non-technical team**, **security-conscious org** — which of these is the primary customer?
- Is the use case designed for that customer, or for an imagined average user?
- Where does it break down for the primary customer?
- Does it accidentally exclude a high-value customer type through a bad default or missing fallback?

**Verdict:** Name the primary customer and say whether this use case serves them or assumes someone else.

---

**What’s missing?**

Set aside what’s built. Think about what would make this use case indispensable:
- What would a power user want that isn’t here?
- What would a CSM wish existed after watching a customer struggle with this for a month?
- What would make someone tell a colleague “you have to install this”?
- Is there a feature that would take this from useful to essential?

**Verdict:** Name the one thing most likely to be missing. Label it fix now, next version, or future.

---

**What should be cut?**

- Is there anything in the current use case that nobody will actually use?
- Is there a token, setting, fallback, or section that adds complexity without adding value?
- Is there anything that sounds good in theory but creates friction in practice?

**Verdict:** Name anything that should be cut or simplified. Explain why keeping it makes the use case worse.

---

**Adoption risk**

- What is the most likely reason a customer installs this and then stops using it?
- What is the most likely reason a CSM recommends against it?
- Is there a step in the setup or usage flow that is likely to cause drop-off?
- Is the value visible quickly enough, or does it require weeks of use before the customer sees the payoff?

**Verdict:** Name the highest adoption risk and say what would reduce it.

---

**Output of 5c — Staff PM:**

For each finding:
- **What’s wrong, missing, or at risk** — be direct
- **Why it matters for adoption or value** — specific reasoning
- **Exactly what to change or add** — not directional, prescriptive
- **Priority:** fix now / next version / future

---

#### 5d — Staff engineer review

You are a product-minded staff engineer. You have broken enough systems to know exactly where these things fail, and you care deeply about the user experience because you know that engineering decisions directly cause product outcomes. You are not here to nitpick code style. You are here to find the places where this use case will silently corrupt data, grind to a halt, or produce nonsense — and tell the builder exactly what to do about it before it ships to a real customer.

You think about two time horizons: day one (does it work?) and month six (is it still working, or has it quietly become a liability?). Most use cases are only designed for day one. Your job is to make sure month six is equally considered.

Work through every dimension below. Give a verdict. Be specific. If something will break, say when and under what conditions.

---

**Failure surface audit**

Walk through every operation the use case performs — every file read, file write, API call, DB query, skill invocation, and user.md insert — and for each one ask: what happens when this fails?

- Does it fail loudly with a clear error, or silently produce a wrong result?
- Is the failure recoverable without data loss?
- Is there a retry or fallback, or does the whole flow stop?
- Are there race conditions? (Two conversations running session-open at the same time, both trying to write to user-map.json — what happens?)
- Are there partial-write risks? (Install starts, writes three files, then fails on the fourth — is the sandbox left in a broken half-installed state?)

**Verdict:** Name every operation with no failure handling. Say what the user experiences when it fails and what the fix is.

---

**Scalability: what happens at month six?**

This is where most use cases are under-designed. A use case that works beautifully on day one can become unusable after sustained real-world use. Think through:

- **Data accumulation:** what files grow unboundedly? (conversation one-pagers, team files, logs, training data, score histories.) At what size does reading or writing them start to degrade? Is there any cleanup, archival, or rotation mechanism? If not, what is the realistic time-to-pain for a typical customer?
- **Index and lookup performance:** if a JSON map grows to hundreds of entries, does the lookup still work? If the brain directory fills with thousands of files, can the agent still navigate it reliably?
- **Brain bloat:** are there files that accumulate noise over time and reduce signal quality rather than improving it? A team file that grows to 10,000 words is not more useful than one that is 500 words — it is less useful. Is there any mechanism to keep signal density high?
- **Token and context limits:** as files grow, they consume more of the agent’s context window on every session-open. At what file size does this start crowding out the actual conversation? Is there a size budget?

**Verdict:** Name every unbounded data accumulation path. For each one, say when it becomes a problem and what the mitigation is — archival cadence, size cap, summarization trigger, or explicit “not a problem because X”.

---

**Engineering-product alignment**

This is where you think like both an engineer and a PM. The product intent is clear — now ask whether the technical design actually delivers it:

- Are there places where the engineering approach will produce a worse user experience than a simpler approach would?
- Are there abstractions that made sense architecturally but will confuse or frustrate the user in practice?
- Are there cases where the system will technically “work” but produce output that is wrong or misleading for the user?
- Is the install-config structure actually the right level of abstraction for what this use case is doing, or is it fighting the format?
- If the behavior snippet or skill is doing too many things in one step, will it be unreliable in practice even if each step is individually correct?

**Verdict:** Name any place where the engineering choices undermine the product intent. Be specific about the user-facing consequence.

---

**Missing infrastructure**

Think about what every production system needs that this use case may not have:

- **Health check:** after install, is there any way to verify the use case is working correctly? Or does the user only find out something is broken when it fails in a real conversation?
- **Migration path:** when v1.1.0 ships with a changed schema, is there a way to migrate existing data? Or does every upgrade leave old-format data that silently breaks the new version?
- **Rollback:** if the install goes wrong halfway through, can the sandbox be restored to its pre-install state? Are there destructive steps with no undo?
- **Observability:** if the use case is running but producing bad output, is there any signal the user or CSM can look at to diagnose it?

**Verdict:** Name any missing infrastructure that would be required for a production system. Label each as fix now, next version, or acceptable risk with documented trade-off.

---

**Output of 5d — Staff engineer:**

For each finding:
- **What will break or degrade** — be specific about the condition, not just the symptom
- **When it happens** — day one, after N uses, at scale, under a specific condition
- **User-facing consequence** — what does the user actually experience?
- **Fix** — specific, not directional
- **Priority:** fix now / next version / acceptable risk

---

**Resolving 5b, 5c, and 5d findings:**

Fix all “fix now” findings before Phase 6. Surface “next version” and “acceptable risk” findings to the user and let them decide. Document any accepted trade-offs explicitly in the README so the next person who reads it understands what was intentional.

---

### Phase 6 — Export

Show a summary:
- Use case ID and description
- Files created with one-line descriptions
- Tokens and fallbacks
- Decisions made on the user's behalf

**README confirmation** — before producing the zip, show the full README content inline and ask:

> "Here's the README that will be included. This is what CSMs and customers will read. Does this look right, or anything to change before I package it?"

Wait for explicit confirmation. If the user requests changes, update the README and show it again. Do not produce the zip until the user confirms the README is correct.

**Repo diff check** — before producing the zip, check what files currently exist in the repo for this use case:

```
GET https://api.github.com/repos/Motion-Creative/runneth-apps/contents/use-cases/<id>
```
Headers: `Accept: application/vnd.github+json`, `User-Agent: runneth-agent`

- If the request returns 404, this is a new use case — no diff needed, continue.
- If the request returns a file listing, compare the filenames against the files in the current use case folder.
- If any files exist in the repo but are **not** in the new version, surface them clearly:

> "Heads up — these files exist in the repo for `<id>` but are not in this version and won't be replaced by the upload: `[filename, filename]`. You'll need to delete them manually in GitHub after uploading."

Wait for acknowledgment before continuing.

Produce a zip at `./artifacts/<id>-v<version>.zip`. The zip is just the use case folder:

```
<id>/
  README.md
  install-config.json
  <all content files>
```

Print submission instructions:

1. Download and extract the zip — you'll get an `<id>/` folder
2. Go to `github.com/Motion-Creative/runneth-apps`
3. Create a new branch: `feat/<id>-v<version>`
4. Navigate to `use-cases/` in the repo
5. Click **Add file → Upload files**
6. Drag the extracted `<id>/` folder into the upload area
7. Commit message: `feat(<id>): <description from install-config>`
8. If any files were flagged above as needing manual deletion, delete them in the repo before or after uploading
9. Open a pull request and paste the PR description below

**PR description (copy and paste):**

```
## Use case: <id> v<version>

### What this enables
<description from install-config>

### What's included
<list each file from installs with one line on what it does>

### Tokens and defaults
<for each token: name, default, what it controls>

### Tested states
- [ ] Fresh sandbox install
- [ ] Sandbox with existing brain structure
- [ ] New user first encounter
- [ ] Null or non-human email (e.g. Slack threads)

### Known limitations
<degrading findings from 5b, or "None identified">

### Checklist
- [ ] Passes structural validation
- [ ] Passes org-agnostic validation
- [ ] All tokens have fallbacks
- [ ] README is CSM-readable
```

---


## What good looks like

- README a non-technical CSM can read and immediately understand
- `install-config.json` with zero ambiguity about where each file goes
- Zero hardcoded org-specific values
- Tokens with fallbacks that work for 90% of sandboxes without customization
- Passes all validation on the first attempt
- Built and shared in one conversation

---

## Skill changelog

| Date | Change |
|---|---|
| 2026-05-06 | Initial version. Full end-to-end flow: build phases 1–5 merged with share phases (zip, submission instructions, PR description). No prerequisite skills required. |
