---
name: hook-analysis
description: Analyzes the hook of a video ad or static ad to diagnose what's working, what's not, and why. Use this skill whenever you need to evaluate the opening of an ad — the first 1–3 seconds of a video or the primary attention-grabbing element of a static. Trigger when a user says "analyze this hook," "is this hook good," "why is this hook working," "what tactic is this hook using," or any time hook performance or hook quality is being assessed. Also called automatically as a sub-component of the creative-analysis skill whenever a video or static ad is being analyzed. This is a diagnostic skill, not a generative one — it evaluates existing hooks, it does not write new ones.
---

# Hook Analysis Skill

This skill dissects an existing hook to diagnose **what it's doing, why it's doing it, and whether it's doing it well.**

It does not write new hooks. For hook writing, use the **hook-writing** skill.

---

## What Is a Hook (Precisely)

A hook is not just the first line of copy. It is the complete attention-capture system at the start of an ad — the combination of:

- **Spoken hook** (video): the first words out of someone's mouth, or the first VO line
- **Visual hook** (video): what's on screen in the first 1–3 seconds before the viewer decides to keep watching
- **Text overlay hook** (video or static): the first headline or text element the eye lands on
- **Primary visual** (static): the image, graphic, or visual composition that stops the scroll

All of these work together (or against each other). Great hooks have alignment across all elements. Weak hooks often have friction between them — the visual promises one thing, the copy says another.

---

## Hook Analysis Framework

When analyzing a hook, evaluate all of the following:

---

### 1. Hook Identification

State clearly what the hook **is**:
- For video: what is the spoken hook? What is the visual hook? Is there a text overlay hook?
- For static: what is the headline/primary text? What is the primary visual doing?

---

### 2. Tactic Classification

Identify the **hook tactic** being used. Reference the **hook-tactics** skill for the full library. Common examples:
- Contrarian, Demographic Callout, Question, Pain Agitation, Social Proof, Curiosity Gap, Authority, Storytelling, Urgency, Transformation, etc.

Name the tactic and briefly explain how this hook is executing it.

---

### 3. Psychological Trigger

Identify the **psychological trigger** the hook is activating. Reference the **hook-writing** skill's 8 trigger categories:
1. Pattern Interrupt
2. Pain Agitation
3. Curiosity Gap
4. Identity Call-Out
5. Social Proof / Credibility
6. Aspiration / Desire
7. Urgency / Stakes
8. Contrarian / Myth-Busting

Multiple triggers can be active simultaneously. Name all that apply and explain how each shows up.

---

### 4. Awareness Stage Calibration

Determine what **awareness stage** this hook is calibrated for:
- **Unaware** — speaks to a situation or desire without naming the problem or product
- **Problem-Aware** — names the pain, agitates it, creates urgency around solving it
- **Solution-Aware** — references solutions category, positions against alternatives
- **Product-Aware** — names or implies the product, addresses objections or FOMO
- **Most-Aware** — direct offer, price, CTA-forward

Then assess: **Is the awareness stage match appropriate?** If this ad is running cold traffic, is the hook calibrated for cold? If retargeting, is it calibrated for warm?

---

### 5. Hook-Visual Alignment (Video only)

For video ads, assess whether the spoken hook and visual hook are **working together or creating friction**:

- **Aligned:** Visual reinforces or amplifies what's being said → viewer gets a double signal
- **Complementary:** Visual and audio each add something different, but together they're stronger
- **Misaligned:** Visual and audio are sending different messages → cognitive friction, likely increases drop-off

Rate the alignment and explain why.

---

### 6. The 1–3 Second Test

Ask: **Would someone keep watching (or stop scrolling) after the first 1–3 seconds?**

Diagnose:
- Does it create an **open loop** (unresolved tension the viewer needs to close)?
- Does it trigger a **self-relevant response** ("this is about me")?
- Does it deliver a **pattern interrupt** (something unexpected that breaks autopilot scrolling)?
- Does it make a **clear promise** about what the next 30 seconds will deliver?

At least one of these needs to be firing for the hook to work. Name which are present and which are missing.

---

### 7. Clarity vs. Curiosity Balance

Every hook lives on a spectrum:

```
Pure Clarity ←————————————————————→ Pure Curiosity
"Here's exactly what this is"        "Wait, what does that mean?"
```

**Too much clarity** = no intrigue, viewer already knows what's coming, no reason to watch
**Too much curiosity** = feels like clickbait, viewer doesn't know what they're getting into and may distrust it
**Sweet spot** = enough clarity to feel relevant + enough curiosity to feel unresolved

Assess where this hook lands and whether it's in the effective range for this product/audience.

---

### 8. Hook Diagnosis: What's Working and What's Not

Synthesize the above into a clear verdict:

**What's working:**
- List the specific elements that are doing their job (be precise — not "the hook is engaging" but "the pain agitation in the second sentence creates an immediate self-identification moment")

**What's not working (if anything):**
- List specific weaknesses with a diagnosis of *why* — don't just say it's weak, explain the mechanism that makes it weak

**Friction points (if any):**
- Identify any specific moments where the hook loses the viewer or creates confusion

---

### 9. Hook Strength Rating

Rate the hook on a 1–5 scale:

| Score | What It Means |
|-------|--------------|
| 5 | Exceptional — fires multiple triggers, perfect awareness stage match, visual and audio aligned, strong open loop |
| 4 | Strong — most elements working, maybe one gap or minor friction point |
| 3 | Functional — does its job but no standout moment, likely average performance |
| 2 | Weak — misses on awareness stage, creates friction, or fails the 1–3 second test |
| 1 | Ineffective — does not create an open loop, not self-relevant, no pattern interrupt |

Provide a score and a one-sentence justification.

---

## Output Format

Default output when called standalone:

```
HOOK ANALYSIS

Hook Identification
[What the hook is, stated plainly]

Tactic: [Name] — [One-line explanation of how it's being executed]

Psychological Triggers: [List] — [Brief explanation for each]

Awareness Stage: [Stage] — [Is this the right calibration for this ad's placement?]

Hook-Visual Alignment: [Aligned / Complementary / Misaligned] — [Why]

1–3 Second Test: [Which of the four conditions are firing]

Clarity vs. Curiosity: [Where it sits on the spectrum and whether that's appropriate]

What's Working:
- [Specific, mechanism-level observations]

What's Not Working:
- [Specific, mechanism-level observations — omit section if nothing material]

Hook Strength: [Score]/5 — [One-sentence justification]
```

When called as a **sub-component of creative-analysis**, output only a labeled `HOOK ANALYSIS` section — no need to re-introduce the framework.

When the user specifies a different output format, use that instead.

---

## Important: What This Skill Does Not Do

- It does not write replacement hooks (use hook-writing skill)
- It does not analyze the body of the ad beyond the hook (use creative-analysis skill)
- It does not assess performance data — it assesses creative quality only
- It does not diagnose audience targeting or bid strategy
