# Chain: feedback_qa

Theme triggered: user shares creative (uploaded video, image, or pasted script) and asks for evaluation. "Is this good," "what do you think," "review this," "rate this."

## Skill sequence

```
1. Step 0 re-anchor
   ├── /agent/brain/brand-audit/<workspace>/strategy.md  (persona context for the eval)
   └── /agent/brain/brand-audit/<workspace>/  (winning patterns to compare against)

2. Performance retrieval (almost always)
   Pull the account's top performers so the eval grounds in real patterns.
   Use the analyze chain's tool sequence.

3. Pattern extraction
   What's working in the account? What format / hook / messaging patterns?

4. Creative analysis (the uploaded creative)
   ├── For uploaded video: motion analyze-media + transcript review
   ├── For uploaded image: direct image read
   └── For pasted script: parse the script as written

5. Comparative interpretation
   How does the creative compare to the account's winning patterns?
   How does it perform against the Persuasive Attribute Standard from hook-writing?

6. Synthesis
   Launch Decision (clear call) → What's Working → What's Not Working → Biggest Leverage Fix.
```

## Plan mode contract

```
Here's the plan:
- Creative under review: <uploaded file or pasted script>
- Compare against: your account's top performers from <date range>
- Output: launch decision (Ready / Needs iteration / Don't run), what's working,
  what's not, single biggest leverage fix

Sound right?
```

## Output format

```
**Launch decision: [✅ Ready to test | ⚠️ Needs iteration | ❌ Do not run as-is]**

**What's working:**
- [Specific element]
- [Specific element]

**What's not working:**
- [Specific element + why]
- [Specific element + why]

**Biggest leverage fix:**
If you change one thing, change [X] because [Y].
```

## Critical rules

### The launch decision is a clear call

Don't hedge. Pick one of the three. Base it on:

- Will this stop the scroll?
- Does it tap into a real pain, desire, or motivation?
- Does it communicate a clear idea quickly?
- Does it give the viewer a reason to care or act?

If the ad mostly describes the product or idea without pressure, tension, or persuasion, mark it ⚠️ or ❌. Not ✅.

### Single biggest leverage fix

One change. Not three options, not "you could also try X." Frame it as: "If you change one thing, change [specific element] because [specific reason]."

### Reference specific elements

Don't say "the hook is weak." Say "the hook 'Are you a busy mom?' is weak because it asks a question with no implied tension — the viewer says 'yes' and keeps scrolling."

### What's working / not working sections

- Focus on impact, not personal preference
- Be specific and concise
- Only the most important points (3 each max)

## Gallery rendering

If the user uploaded a video or image, render it as a single-creative gallery card alongside the feedback. The user sees what's being evaluated.

## Constraint

- No budget, targeting, or landing-page recommendations.
- No "you should A/B test against X" unless the user asks for variations.

## Always end with

Single yes/no Next steps question: "Want me to write 3 variations that address the biggest leverage fix?" or "Want me to compare this directly against your highest-spend ad?"
