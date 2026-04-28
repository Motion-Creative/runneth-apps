# Brief QA Rubric
*Version: v0 (starter template — initialize with customer examples before first run)*
*Last updated: —*

---

## Purpose

This rubric defines how Runneth evaluates creative briefs. It starts generic and evolves through
accepted/rejected feedback signals. The goal is to match the reviewer's creative standards, not
enforce abstract rules.

For brief generation guidance, see `brief-saving-convention.md`.
For audience-specific evaluation criteria, see the brain README.

---

## Brief Template

Every brief follows this structure. Use it as the reference when evaluating section quality.

```
# [Brief Title]: [Brand Name]
**For: [Creator type / ad format]**
**Goal: [Campaign goal]**
**Landing page: [URL]**

---

## CONCEPT OVERVIEW
[2-4 sentence summary of the ad concept. What it opens on, how it's structured,
what throughline carries the whole thing. Should make the brief legible at a glance.]

---

## COPY

### Hook (0:00–0:03)
[The opening moment. Include timing, visual direction, and the hook text as a blockquote.
For video: specify visual hook AND spoken/text hook. Offer 2 options where relevant.
Explain which element is non-negotiable.]

> **"[Hook text]"**

### Body (0:03–[timestamp])
[The numbered points or narrative core of the ad. Each point should include:
- Spoken copy
- Text overlay instruction (bold, numbered)
- Brief direction note if needed]

**[Text overlay: #1]**
> "[Point copy]"

### CTA ([timestamp]–end)
[Closing moment. Tone direction (e.g., low energy, direct). Exact CTA language.
Text overlay instruction.]

---

## VISUAL APPROACH

**Opening visual:** [Specific direction for the first shot. What to find, what to avoid,
why it matters.]

**Body structure:** [Multi-clip, single location, talking head, etc. What to mix in and why.]

**Text overlays:** [Formatting, contrast, timing guidance.]

**Energy / tone:** [How the creator should feel on camera. The energy to bring.]

**Pacing:** [Edit rhythm, cut frequency, breathing room guidance.]

---

## DELIVERABLES

- [Format, aspect ratio, duration range]
- [Caption requirements]
- [Number of hook variations + what they are]

---

## GUARDRAILS

- [Claim restrictions]
- [Mandatory inclusions]
- [Off-limits language, topics, comparisons]
- [Brand-specific rules]
```

---

## Evaluation Prompt

Use this prompt to evaluate each brief. Assess all six dimensions and post 3–6 comments,
each tagged to the section it addresses.

---

**BRIEF EVALUATION PROMPT**

You are evaluating a creative brief against a set of quality criteria. Your job is to give
the brief strategist specific, actionable feedback — not generic praise or vague concern.

Read the full brief carefully. Then evaluate it across these six dimensions:

### 1. Strategic Clarity (section: concept)
- Does the concept overview communicate the ad's logic in 2–4 sentences?
- Is the messaging angle (core truth) visible in the concept, body, and CTA — or does it drift?
- Is the awareness stage served by what the ad says and how it says it?
- Is there a clear through-line from hook to body to CTA, or do the parts feel disconnected?

Flag: concept that's too vague to brief a creator from, or one that contradicts its own metadata.

### 2. Hook Quality (section: hook)
- Does the hook use a specific, recognizable tactic (not just "be interesting")?
- Is the psychological trigger clear? (Pattern interrupt, pain agitation, identity callout, etc.)
- Does the hook express the messaging angle — or could it belong to any ad in the category?
- For video hooks: is the visual direction specific enough that a creator could execute it without guessing?
- Are multiple hook options genuinely differentiated (different tactics, not just different words)?

Flag: generic hooks that could apply to any product, hooks that don't serve the awareness stage,
visual direction so vague it gives the creator no real guidance.

### 3. Copy Execution (sections: body, cta)
- Is the body copy written in the reader's voice, not brand voice?
- Are numbered points or beats specific, not vague ("tell them it works" is not a direction)?
- Does the CTA match the funnel stage? (Awareness-stage briefs should not lead with hard CTAs.)
- Is the copy genuinely different from what you'd find in any ad for this category?

Flag: corporate language, softened truths, CTAs that mismatch the awareness stage.

### 4. Visual Direction Specificity (section: visual)
- Could a creator open this brief and immediately know what to film?
- Is the opening visual specific (not just "find something interesting")?
- Are energy and pacing directions concrete or aspirational/vague?
- Is the visual direction aligned with the mechanic? (A Reframe brief should not give static-product direction.)

Flag: visual sections that give the creator no real constraint, energy descriptions that are interchangeable.

### 5. Deliverables Completeness (section: deliverables)
- Are all specs present: format, aspect ratio, duration range, caption requirements?
- Are hook variations clearly defined and genuinely different?
- Are there any gaps a creator would have to guess on?

Flag: missing specs, hook variations that are too similar to be useful test splits.

### 6. Guardrails Coverage (section: guardrails)
- Are brand-specific constraints captured (claims, comparisons, tone)?
- Are platform-specific restrictions noted where relevant (Meta health claims, before/after rules)?
- Is the list complete enough that a creator can work confidently within it?

Flag: missing constraints that a creator would be likely to violate, obvious category restrictions not captured.

---

After evaluating, post 3–5 comments. Priority order:
1. The most impactful weakness — something that would cause the brief to underperform in production
2. The second most impactful weakness
3. Any other notable issue
4. One genuine strength worth naming (if present)
5. One additional observation if budget allows

Each comment must:
- Be 3 lines or fewer — lead with the issue, follow with the fix, stop
- Name the specific issue, not just the category
- If flagging a weakness, say what to change instead
- Be grounded in the rubric criteria, not generic taste
- Never pad to fill space — if the point is made in one line, leave it there

---

## What Good Looks Like

These are signals that a brief is strong across dimensions. The judge should learn to recognize these
from accepted comments and annotated feedback.

**Strategic layer:**
- Messaging angle is specific enough to be inimitable — not interchangeable with a competitor's brief
- The awareness stage is served by the copy strategy (e.g., unaware briefs don't mention the product in the hook)
- The mechanic is visible in the concept — you can see HOW the ad creates meaning, not just WHAT it says

**Hook:**
- Uses a named tactic with a clear trigger
- Visual direction gives a creator a concrete starting point, not an aspiration
- Hook variations test genuinely different tactics or triggers, not just different phrasings of the same tactic

**Copy:**
- Speaks in the persona's voice, not marketing voice
- Pain is specific, not generalized ("you've been canceled on because of your skin" beats "skin issues")
- CTA is low-pressure and matches funnel stage

**Visual:**
- A creator could read it and start filming with zero follow-up questions
- Energy direction is behavioral ("conspiratorial, knowledgeable friend") not aspirational ("authentic")
- Pacing notes are specific (cut every 2-4 seconds) not general (fast paced)

---

## Learning Notes

*This section is updated during rubric refinement cycles. Runneth records patterns from accepted/rejected
signals to calibrate what the reviewer values.*

*(Empty at initialization — will populate through training.)*

---

## Open Questions / Assumptions

- Rubric is generic until initialized with customer-specific examples
- Hook quality standards will vary by platform (TikTok vs. Meta static) — surface this during first calibration
- The reviewer's tolerance for visual vagueness vs. specificity should emerge in first 20 signals
