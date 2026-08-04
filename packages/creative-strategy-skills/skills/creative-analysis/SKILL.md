---
name: creative-analysis
description: Analyzes a video ad (via transcript + visual/audio description) or a static ad (via uploaded image) to diagnose why it is or isn't working. Use this skill whenever a user wants to break down an existing ad — their own or a competitor's — to understand the strategic and executional decisions behind it. Trigger for any request involving "analyze this ad," "break down this creative," "why is this ad working," "what's this ad doing," "reverse engineer this," "critique this ad," "what's the strategy here," or any variation of evaluating existing ad creative. Works for both video and static. For video, the user provides a transcript + description of visuals, text overlays, and audio. For static, the user uploads the image directly. Always calls the hook-analysis skill as a sub-component.
---

# Creative Analysis Skill

This skill diagnoses **why an ad is or isn't working** — strategically and executionally.

It is a diagnostic skill. It does not create new ads or hooks. It takes an existing ad and reverse-engineers every meaningful decision that went into it.

---

## Skill Dependencies

This skill calls the following skills as sub-components:
- **hook-analysis** — always called; handles the hook layer in depth
- **creative-strategy-engine** — for strategic context (messaging angle, awareness stage, persona)
- **visual-formats** — for identifying and evaluating the format choice
- **creative-mechanics** — for identifying the underlying cognitive/emotional mechanism
- **hook-tactics** + **hook-writing** — called by hook-analysis, but useful here for context

You don't need to explicitly load all of these — pull from them as needed when their frameworks are relevant.

---

## Input Formats

### Video Ad Input
Because videos cannot be uploaded directly, the user provides a written summary that includes:
1. **Transcript** — everything spoken (VO, on-screen talent, dialogue)
2. **Visual description** — what's happening on screen, scene by scene
3. **Text overlays** — any words that appear on screen
4. **Audio description** — music, sound effects, tone

If the summary is incomplete, ask for what's missing before analyzing. The quality of the analysis depends directly on the quality of the input.

**Minimum viable input for a video:** transcript + visual description of the hook (first 3 seconds). Everything else improves the analysis.

### Static Ad Input
The user uploads the image directly. You can see it. Analyze it visually.

If no image is present and the user says "here's a static," ask them to upload it.

---

## Analysis Framework

Run the following sections in order. Depth per section should scale to what the user asks for — a quick breakdown needs less than a full strategic teardown.

---

### SECTION 1: AD AT A GLANCE

Open with a plain-language summary of what this ad is doing at the highest level:
- What product/service is being advertised?
- What is the core message being communicated?
- Who is it clearly talking to?
- Where does it likely run? (feed, story, reel, etc.) — infer from format/aspect ratio if static
- What action is it driving toward?

Keep this tight — 3–5 sentences. This is the "before we get into the weeds" snapshot.

---

### SECTION 2: STRATEGIC LAYER

This is the Creative Strategy Engine layer. Reverse-engineer the strategic intent.

#### 2a. Messaging Angle
What is the **core truth** this ad is built around? State it as a messaging angle — a specific, strategic claim about what this product does for this specific type of person.

Not: "This ad is about skincare."
Yes: "This ad is built on the messaging angle that your dermatologist's prescription is making your cystic acne worse, not better — and there's a natural alternative."

#### 2b. Pain or Desire Anchor
Is this ad pain-first or desire-first? What specific pain or desire is it anchored in?
- Name the pain/desire precisely (not "skin issues" — "cystic acne that won't respond to prescriptions")
- Is the pain/desire anchor clear and immediately legible to the target viewer? Or is it buried?

#### 2c. Persona
Who is this ad clearly speaking to? Define the persona not just demographically but by **life context** — what situation are they in, what are they feeling, what does their day look like that makes this pain/desire relevant to them right now?

If the persona is unclear or generic, call that out — it's a strategic weakness.

#### 2d. Awareness Stage
What awareness stage is this ad calibrated for?
- Unaware / Problem-Aware / Solution-Aware / Product-Aware / Most-Aware

Is the calibration **appropriate** for where this ad is likely placed?
- TOF creative should be Unaware–Problem-Aware
- Retargeting/BOF should be Product-Aware–Most-Aware

Mismatched awareness stage is one of the most common reasons an ad underperforms.

#### 2e. Strategic Diagnosis
Step back: is the strategic foundation of this ad **sound**?
- Does it have a clear, specific messaging angle?
- Does it speak to a real, specific pain or desire?
- Is the persona legible?
- Is the awareness stage right for its placement?

Flag any strategic gaps here. These are upstream problems that no amount of execution polish can fix.

---

### SECTION 3: HOOK ANALYSIS

Call the **hook-analysis** skill here. Output its full analysis as a labeled section.

For video: analyze spoken hook + visual hook + text overlay hook together.
For static: analyze the headline/primary text + primary visual as the hook.

---

### SECTION 4: CREATIVE MECHANIC

Identify the **creative mechanic** — the underlying cognitive or emotional mechanism the ad uses to make the viewer arrive at the core message.

Reference the **creative-mechanics** skill for the library. Name the mechanic and explain:
- What is it? (name + one-line definition)
- How is this ad executing it? (specific, concrete — reference actual elements of the ad)
- Is it working? (is the mechanic landing cleanly, or is it muddled or incomplete?)

---

### SECTION 5: VISUAL FORMAT

Identify the **visual format** this ad is using. Reference the **visual-formats** skill.

Assess:
- What format is it? (name it precisely)
- Is it the **right format** for the messaging angle, mechanic, and awareness stage?
- Is the format being executed well? What's working visually? What's creating friction?

For static ads, also assess:
- Visual hierarchy — where does the eye go first, second, third?
- Does the visual hierarchy serve the message, or fight it?
- Text-to-visual balance
- Scroll-stop power of the primary visual

---

### SECTION 6: BODY ANALYSIS (Video only)

For video ads, analyze what happens after the hook:

#### 6a. Structure
Map the narrative/structural shape of the ad:
- What happens in each beat? (Hook → Middle → CTA)
- Is there a clear logical or emotional progression?
- Does each section earn the next?

#### 6b. Retention Mechanics
What is the ad doing (or failing to do) to keep the viewer watching?
- Open loops being created and closed
- Curiosity sustained or dropped
- Pacing and energy
- Any points where a viewer would likely drop off — and why

#### 6c. The Middle
The hook earns the watch. The middle does the persuasion work. Assess:
- Is the core claim being made clearly?
- Is proof being provided? (demo, testimonial, data, authority, social proof)
- Is the pain or desire being agitated enough to motivate action, or does it resolve too quickly?

#### 6d. The CTA
What action is being requested? Is the CTA:
- Specific and clear?
- Consistent with the awareness stage? (a cold audience shouldn't be hit with a hard "buy now")
- Earning its placement, or feeling tacked on?

---

### SECTION 7: OVERALL DIAGNOSIS

Synthesize everything into a verdict. Three parts:

**What this ad is doing well:**
Specific, mechanism-level observations. Not "the hook is good" — "the hook's identity callout creates immediate self-identification for the problem-aware persona, which means the viewer instantly knows this ad is for them."

**What's not working (or could be stronger):**
Same level of specificity. Root cause diagnosis. If the ad is underperforming, what's the most likely reason?

**Highest-leverage fix:**
If you could change one thing about this ad to meaningfully improve performance, what would it be? And why that over everything else?

---

### SECTION 8: STRATEGIC OPPORTUNITY (Optional)

Only include this section if there's something meaningful to say beyond diagnosing the existing ad.

Examples of when to include:
- The ad is built on a strong mechanic but deployed at the wrong awareness stage — here's where it should run instead
- The messaging angle is strong but the persona is too broad — here's how to sharpen it
- There's an untapped pain/desire angle this brand is leaving on the table that this ad hints at

Skip this section for straightforward analysis requests. Include it when the diagnosis reveals a strategic insight worth surfacing.

---

## Output Format

**Default format when no specific format is requested:**

Use the section headers above as your structure. Depth should scale to the complexity of the ad and the request:
- "Quick breakdown" → cover every section but keep each one tight (1–3 sentences per finding)
- "Full teardown" or "deep dive" → go deep on all sections, especially Sections 2, 3, and 7
- "Just the hook" → run Section 3 (hook-analysis) only
- "Strategic layer" → run Sections 1 and 2 only

**When the user specifies a different format (scorecard, bullet list, narrative, etc.):** Use that instead. The analytical frameworks still run — just present findings in the requested format.

---

## Quality Standards

A good creative analysis:
- Names things precisely — not "the ad is emotional" but "the ad uses a Pain Agitation trigger in the first 8 seconds to activate shame around [specific pain], which creates urgency to resolve it"
- Separates strategic problems from executional problems — a bad messaging angle is a different problem than a bad hook
- Is honest about what's working — analysis that only finds problems is incomplete and less useful than one that identifies the actual strengths
- Makes a clear judgment — avoids hedging into "it depends" without explaining what it depends on and why

---

## Important: What This Skill Does Not Do

- Does not write new ads, hooks, or scripts (use hook-writing or creative-strategy-engine)
- Does not assess paid media performance data (metrics, ROAS, CTR) — this is creative quality analysis only
- Does not diagnose targeting, budget, or bidding strategy
- Does not know why an ad performed a certain way from data alone — it can only analyze the creative quality and make inferences
