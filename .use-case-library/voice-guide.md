# Use Case Library — Voice Guide

Every `marketing.md` file in this repo follows the rules below. The Use Case Library renders these files directly. If a marketer wouldn't say it out loud, it doesn't belong here.

---

## Tone

- Plain Motion English. Direct, warm, useful.
- Specific beats abstract. Outcome beats mechanism.
- Short sentences. One idea per sentence.
- No em-dash showpieces. Use periods, commas, or parentheses.
- Real example or it isn't ready.

## Banned words

These words signal generic SaaS copy. Don't use them:

`AI-powered`, `leverage`, `harness`, `empower`, `seamlessly`, `intelligently`, `supercharge`, `transform`, `robust`, `scalable`, `enterprise-grade`, `workflow`, `ecosystem`, `paradigm`.

## What customer-facing means here

- Talk about the user's Runneth, not the agent in the abstract.
- Talk about the outcomes a marketer or strategist gets, not the files, paths, or skill names that produce them.
- Mechanism details belong in the README, not here.

---

## `marketing.md` schema

Every file uses this exact shape:

```markdown
---
hero_headline: "<7-12 word promise>"
hero_subhead: "<one-sentence pitch>"
install_time: "<from install-config or estimate>"
requires: "<Nothing | dependency name>"
status: "proven" | "experimental"
---

## Super powers this unlocks

4 bullets. Each one is a concrete new behavior the user's Runneth gets the
moment they install. Customer outcomes only. No mechanism.

## How it works

2 sentences. Skip file paths, tokens, skill names.

## A real example

One scenario. Named person, real situation, specific outcome. 4-5 sentences.
```

## Sections in detail

**`hero_headline`** — Lead with an outcome the marketer wants to be true. 7-12 words. Active voice. No abstract verbs. Mechanism words ("semantic search," "OAuth," "index") don't belong here.
Good: "Stop re-introducing yourself to your agent." Bad: "AI-powered teammate context retrieval."

**`hero_subhead`** — One sentence. Names the audience and the outcome. Bad: same sentence reworded.

**`install_time`** — Pull from `install-config.json` when present. Estimate plainly when not ("~2 minutes", "~10 minutes including OAuth setup").

**`requires`** — `Nothing` when it works in a fresh sandbox. Otherwise name the exact dependency in plain English ("An OpenAI API key", "Access to the Runneth-test Meta app", "The `landing-page-summary` skill").

**`status`** — `proven` means Motion has shipped this with customers and it holds up. `experimental` means it's working but the pattern is still evolving. Don't soften `experimental` with marketing language — the badge does the work.

**Super powers** — Four to six bullets. Each one starts with a verb. Each one names a thing the user can now do, not a thing the agent has internally. "Find every clip where the founder says the price." beats "AI-powered video search."

**How it works** — Two to four sentences. The mental model, not the implementation. A marketer should be able to read this and understand why the result is trustworthy without hearing the words "embedding" or "schema."

**A real example** — Named person. Real situation. A specific result. Four to six sentences. This is the section that gets read. Make it concrete enough that the marketer can picture themselves doing the same thing.

---

## Editing rules

- If you find yourself writing "leverage" or "workflow," stop and name the actual thing.
- If a bullet describes a file path, rewrite it as the outcome the file produces.
- If the example uses placeholder names like "John from Acme," it isn't done. Use real Motion customers or named hypotheticals the team would recognize.
- Length cap: ~160 words across all sections combined. Premium copy is short copy. If a draft runs past 170, cut a bullet or shorten the example.
