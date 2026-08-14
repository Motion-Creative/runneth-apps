# 02 - The Ideation Engine

The engine is an ordered set of decisions that turn inputs into a finished ad concept. It is deliberately linear so the output is explainable: every concept can be traced back to the decision that produced it.

**This file is the default engine.** It is the starting-out path from the sophistication gate (`04`): every brand gets this out of the box. When the extraction interview (`03`) detects an expert or partial path, this order gets reconfigured to match how that team actually thinks. The reconfigured version lives in the brand's own workspace folder as its own file, never edited into this package file.

## Inputs

1. **Product facts** - what the product is and does. No spin, just truth. From the product bible.
2. **Customer insight** - how real customers talk about the problem and the win, in their words. From the VoC audit and ongoing social listening.

If either input is thin, say so before running. A thin insight input is the single biggest cause of generic output.

## The ordered decisions

```
1. Anchor (pain or desire; default to pain when both are plausible)
   -> 2. Persona (who feels it, and what she wants out of it - the benefit lives here, not as its own step)
      -> 3. Micro-moment (the exact moment and context where the problem or want shows up)
         -> 4. Messaging angle (DERIVED from steps 1-3, not picked from a bank)
            -> 5. Awareness stage (how much she already knows; the angle stays constant, the expression changes)
               [CONCEPT - steps 1-5 together form the concept]
               -> 6. Creative mechanic (chosen from the mechanics bank)
                  -> 7. Hook (chosen from the hooks/headlines bank, triggers the mechanic)
                     -> 8. Visual format (chosen from the formats bank, video or static stated explicitly)
```

### 1. Anchor
Does this idea start from a problem the customer has, or something they want? Default to pain when either could work; pain is more universally legible than desire. Pull from the product bible and customer insight.

### 2. Persona
Who feels the anchor, and why she buys. Include what she wants out of resolving it (the benefit) as part of describing her, not as a separate decision. Persona = the anchor plus the outcome she's after.

### 3. Micro-moment
The context layer. When and where the problem or want shows up in this person's day. This is where specificity comes from. Pull from customer insight (VoC audit, social listening) and, if the brand has one, existing persona documentation.

### 4. Messaging angle
DERIVED from the intersection of the anchor, the persona, and the micro-moment. Not picked from a bank. Written the way a real person would say it. The angle stays constant across awareness stages; only the expression of it changes.

### 5. Awareness stage
How much the viewer already knows. The persona, micro-moment, and angle stay the same across stages; the expression changes to match what she already knows.

### [CONCEPT]
Steps 1-5 together form the concept: anchor + persona + micro-moment + messaging angle + awareness stage. Once the concept exists, it can be brought to life in multiple formats. The concept is the deliverable; steps 6-8 are execution options for bringing it to life, not additional required decisions.

### 6. Creative mechanic
Chosen from the creative mechanics bank. The mechanic defines how the viewer arrives at the angle's truth. See `05-bank-building-process.md` for how the bank is built.

### 7. Hook
Chosen from the hooks and headlines bank. The hook triggers the mechanic. Spoken-shaped = hook; written-shaped = headline. See `05-bank-building-process.md` for how the bank is built.

### 8. Visual format
Chosen from the visual formats bank. The container that delivers the mechanic and hook together. Always state video or static explicitly, never "both." See `05-bank-building-process.md` for how the bank is built.

## The three banks

The engine pulls from three banks for steps 6-8:

- **Creative Mechanics** - the cognitive or emotional move that makes the concept land
- **Hooks and Headlines** - the opening line, spoken or written
- **Visual Formats** - the container, the shape of the content

Each bank can hold two kinds of entries:
- **Owned-evidence entries**, built from this brand's own tested ad library (see `05-bank-building-process.md`), carrying spend and performance evidence.
- **Confirmed-external entries**, fed in by the hook-script-mining package from competitor ads, creator posts, and adjacent-brand examples, carrying source and taste-note evidence instead of spend. Hook-script-mining is the research side that keeps these three banks growing over time; the ideation engine is the assembly side that draws from them. When a concept surfaces a confirmed-external entry, label it as external, not yet run as this brand's own ad, so it's never mistaken for owned performance evidence.

Messaging angle is NOT a bank. It is derived from steps 1-3, and stays anchored to this brand's own product facts, customer insight, and persona work, never to external inspiration. Tested messaging angles are kept as a reference list (see `05-bank-building-process.md`), not a bank to pick from. Elements of Value serves as a scoring lens after the concept is assembled, not as a strategy selector before it.

## The rule that keeps it honest

Every decision cites the input it came from. This rule governs the concept-level decisions only (steps 1-5: anchor, persona, micro-moment, messaging angle, awareness stage). If one of those cannot be traced to a product fact, a customer insight, or a named persona, it is a guess and gets flagged as one. A concept that is not grounded in data does not go to a brief.

Steps 6-8 (mechanic, hook, format) are bank-pulled execution choices, not concept-level decisions, so they trace to their bank entry's own evidence instead of a product fact, customer insight, or persona. That evidence can be this brand's own tested ad performance or a confirmed-external pattern from hook-script-mining; either is a legitimate trace, not a guess. What must never happen is the reverse: an external pattern influencing anchor, persona, micro-moment, or messaging angle. Those four stay anchored to this brand's own evidence, full stop.

## Why this differs from a reconfigured expert engine

Reconfiguration can reorder these steps (for example, moving awareness stage earlier), merge steps (for example, folding a bucket system into the persona step), or add a brand-specific floor (for example, a minimum awareness stage a brand never targets below). None of that changes what this default file contains; it changes what gets generated for that one brand's workspace, based on what the interview actually revealed about how they think.
