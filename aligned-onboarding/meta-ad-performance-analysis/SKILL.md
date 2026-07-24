---
name: meta-ad-performance-analysis
description: "Generalized framework for analyzing the performance of any individual ad in any Meta ad account — e-commerce, SaaS, lead gen, or service. Use this skill whenever evaluating how an ad is performing, diagnosing why an ad is or isn't working based on its metrics, or comparing ads within an account. Trigger for any request involving 'analyze this ad's performance,' 'how is this ad doing,' 'read these metrics,' 'is this ad working,' or any variation of interpreting Meta ad data. The core method: identify the ad's primary KPI first, judge efficiency through cost-per (or ROAS) against the account's own averages, then use supporting metrics — first frame retention, thumbstop rate, hold rate, engagement, CTR outbound, conversion rate, and AOV — to locate exactly where in the funnel the ad is winning or losing."
---

# Meta Ad Performance Analysis

This skill defines how to read the performance of a single ad in a Meta ad account. It is account-agnostic — the metrics are universal, but the benchmarks mostly are not.

**The rule that governs everything: compare against the account's own averages.** With one exception (first frame retention), there are no universal benchmarks in this framework. An ad is only "good" or "bad" relative to the other ads in its account — ideally ads with the same optimization goal and a similar format. Never judge a metric in a vacuum.

## Account grounding (read this before pulling anything)

This skill runs inside the Meta onboarding package's contracts:

- **Read `/agent/brain/meta/account-context.md` first.** The account-context guard requires it before any performance work. It is the sole source of account interpretation — the winner metric, targets, naming decode, and spend floor all come from it. Never read or defer to Motion workspace settings (workspace goal, preferred KPI, spend threshold, attribution config); treat them as if they do not exist. Where this skill says "account average," the account's own confirmed winner metric and targets from account-context.md take precedence for the verdict; the averages are the comparison fabric underneath.
- **Pull metrics live via the `motion` CLI**, per the Motion CLI Data-Query Guide installed beside the package docs. Performance metrics are never stored to files — every read is a fresh pull.
- **Resolve the workspace explicitly.** Every pull passes `--workspace-id <id>`; never assume the default workspace.
- **Decode names before filtering by them.** Before filtering by campaign, ad set, or ad name, read the account's naming decode — Field 4 of account-context.md and its operational appendix `/agent/brain/meta/naming-decoder.json`. Wrap filter values in underscores (`_VALUE_`, not `VALUE`) when filtering `adName`; use `adsetName`/`campaignName` for those levels, per the Data-Query Guide's name-level rules.
- **Per-creative content lives in Cacheth** (the local creative cache), surfaced through Knoweth or the `motion cache` CLI. This skill writes nothing to brain files.
- **Answer transparently.** Every analysis states which filter was applied, which signal was read, and what couldn't be confirmed.

---

## Step 1 — Identify the Primary KPI

Every ad runs inside a campaign that is optimizing for one specific conversion event. That event is the ad's **primary KPI** — it's what the algorithm was trained to chase, and it's the lens every other metric gets read through.

How to identify it:

- **Account context.** `/agent/brain/meta/account-context.md` is read first (per the guard above) and defines how this account judges performance; if it names the KPI, that is the answer.
- **The campaign's optimization event setting.** The definitive source in the Meta ad data itself.
- **Campaign naming conventions.** Most accounts encode the optimization goal in the campaign name — decode it through the account's confirmed naming decode (Field 4 / `naming-decoder.json`), never by guessing at the pattern.

Common primary KPIs by account type: Purchases / ROAS (e-commerce), lead form completions, demo or call bookings, trial signups or activation events, event registrations.

Judge the ad on the job it was given. Conversions against other events are secondary signal — worth noting, but never the verdict.

---

## Step 2 — Primary KPI Volume and Cost Per KPI

Once the primary KPI is identified, look at two numbers:

- **Volume** — how many of that conversion event the ad drove.
- **Cost per KPI** — spend ÷ conversions. This is the efficiency lens.

Compare cost per KPI against the account average for ads with the same optimization goal. Is this ad converting cheaper or more expensively than its peers?

In purchase-optimized accounts, **ROAS** (revenue ÷ spend) plays the efficiency role instead of cost-per. Same logic: compare against account average.

One caution: low conversion counts are noisy. A handful of conversions can swing cost-per wildly in either direction — hold off on verdicts until there's meaningful volume. The account's confirmed spend floor in account-context.md defines "meaningful" for this account; below it, report the read as provisional.

---

## Step 3 — Supporting Metrics

### First Frame Retention (video only)

**Benchmark: 90%+ (industry standard — the one hardcoded benchmark in this skill)**
The percentage of people who watched past the first frame. This measures whether the ad stopped the scroll at all. Read it against both the 90% standard and the account average: is this ad's first frame doing better or worse than the account's norm?

### Thumbstop Rate (video only)

**No universal benchmark — read against account average**
The percentage of people who stopped and watched at least the first 3 seconds. This is the primary hook metric. Above or below the account average is the question.

### Hold Rate (video only)

**No universal benchmark — read against account average**
The percentage of people who watched the first 15 seconds. This measures whether the concept sustains attention after the hook has done its job. Hold rate is influenced by ad length and format, so only compare against similar creative types.

### Reading the Three Video Metrics Together

The three video metrics form a funnel: first frame → 3 seconds → 15 seconds. The individual numbers matter less than **where the drop-off happens** — that's the diagnosis.

| Pattern | Read |
|---|---|
| Low first frame retention | The scroll was never stopped. Fix the opening first — nothing downstream is readable until people stop. |
| High first frame retention, low thumbstop | The first frame grabs the eye but doesn't earn 3 seconds. The visual flashes, but there's no reason to stay. |
| High first frame retention / thumbstop, low hold rate | The hook works, the story doesn't. The first frame and opening seconds are getting attention, but the concept that follows isn't strong enough to hold it. Hook/story mismatch. |
| All three above average | The hook matches the story. The ad is working end to end. |

The principle underneath all of this: **the hook has to match the story of the ad.** Strong hook metrics paired with weak conversions can mean the ad is stopping the *wrong* people — that's clickbait, not creative strategy. The goal is getting the right person's attention with a hook whose promise the rest of the ad actually pays off.

### Engagement — Comments, Likes, Shares (all ads)

**No specific goals — high counts are a flag to investigate**

- **Comments** mean something in the creative provoked enough of a reaction for someone to stop and write. Read them — positive, negative, and confused all carry signal about how the ad is landing.
- **Shares** are rare on paid ads. People don't usually send sponsored content to a friend, so meaningful share volume means the creative did something genuinely shareable.
- **Likes** are the lightest signal, but they contribute to the overall engagement picture.

Cross-check engagement against performance. Typically, an ad getting commented on, liked, and shared should see a performance boost — Meta's auction rewards engagement with better delivery, which often shows up as lower CPMs. If engagement is high but conversions are weak, people are reacting to the ad but it isn't selling — the comments usually tell you why.

### CTR Outbound (all ads)

**No universal benchmark — read against account average**
The percentage of people who clicked the ad and went to the landing page.

Then take it one step further: calculate the **conversion rate** — primary KPI conversions ÷ outbound clicks. This measures how many of the people who clicked actually converted, and it locates *where* in the funnel a problem lives:

| Pattern | Read |
|---|---|
| High CTR, high conversion rate | Creative and landing page are congruent. This is what to scale. |
| High CTR, low conversion rate | People click but don't convert. The ad may be over-promising, or the landing page has too much friction. Likely a landing page problem, not a creative problem. |
| Low CTR, high conversion rate | The creative isn't pulling volume, but the people it does pull are well-matched. Work on the hook and the click, not the page. |
| Low CTR, low conversion rate | The whole funnel is misaligned. Start with the creative — the click is the upstream step. |

### ROAS + Average Order Value (purchase-optimized ads only)

If the primary KPI is ROAS and order value data exists, calculate the ad's **AOV** (revenue ÷ purchases) and compare it to the account's average AOV.

This tells you whether the ad is bringing in higher- or lower-value orders than average. Two ads with identical ROAS can have completely different economics underneath — one might drive fewer, bigger carts while the other drives volume at low order values. AOV tells you *what kind of buyer* the creative is attracting, not just whether it's efficient.

---

## The Analysis Flow

After the efficiency read, steps 3–6 trace the viewer's path through the ad: stop and watch → react → click → convert, and what that conversion was worth.

1. Identify the primary KPI the ad is optimizing for.
2. Read volume and cost per KPI (or ROAS) against the account average.
3. For video: read first frame retention (vs. 90% and the account average), thumbstop rate, and hold rate — then read where the drop-off happens across the three.
4. Cross-check engagement against performance.
5. Read CTR outbound and conversion rate to locate creative vs. landing page problems.
6. If purchase-optimized: compare the ad's AOV to the account average.

The output of a good analysis isn't a list of numbers — it's a diagnosis of where in the funnel this ad wins, where it loses, and what to fix first. And it shows its work: which filter was applied, which signal was read, and what couldn't be confirmed.
