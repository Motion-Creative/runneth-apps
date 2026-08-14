# Changelog

## v16 (2026-08-12)
- **Question 14 reworded.** "What little moves do you use to hold attention once you have it?" was vague enough to need explaining live during a walkthrough test. Replaced with "How do you decide what to do next after the hook to actually hold attention?", drawn from the person's own phrasing, no jargon, and the line against the hook is now built into the question itself instead of needing a separate explanation.

## v15 (2026-08-12)
- **Question 11 trimmed back down.** Overcorrected in v14 by spelling out a full definition for every stage, unnecessary for an Expert-path person who already knows the term. Shortened to a brief parenthetical of stage names as examples, not full definitions.

## v14 (2026-08-12)
- **Question 11 tightened.** Swapped "awareness ladder" for the standard term "awareness stage," and gave each named stage a short example in parentheses (unaware, problem aware, solution aware, product aware, most aware) instead of describing them only in a run-on sentence.

## v13 (2026-08-12)
- **Question 11 rewritten for clarity.** "Does the ad change based on how much the viewer already knows?" was too terse, caught live during a walkthrough test when it read as ambiguous between viewer awareness and something about the ad itself being aware of the product. Rewrote it to spell out the actual awareness ladder (not yet realizing the problem, knowing the problem, knowing solutions exist, knowing your specific product, ready to buy) so the question is unambiguous about what it's asking.

## v12 (2026-08-12)
- **Simplified the multi-product rule from v11, which overcorrected.** Naming a product is right, bundling a second product's example and a meta-question about future pacing into the same turn is not, that turns one simple content question into three. Rewrote the rule to ground each question in one product's clearest finding, ask it as the single question it originally was, and only raise cross-product variation later, as its own short follow-up, if it actually comes up. Also added the standing check: know what a question is actually trying to learn (question 8 feeds the micro-moment input, not a product-comparison exercise) before writing it.

## v11 (2026-08-12)
- **New rule for multi-product accounts.** `03-extraction-interview.md` never blended findings across products before, which meant an audit-woven question could quietly mix two products' pain points into one ambiguous illustration (nighttime sleep disruption and pre-trip bathroom anxiety are different Jude products, and got folded into one generic "the product" question during a walkthrough test). Added an explicit rule: check the product bible for multiple products before the interview starts, name the specific product behind any woven-in finding, and ask per-product when the honest answer actually varies by product instead of guessing at a blend.

## v10 (2026-08-12)
- **Fixed a real mismatch, not just a wording issue.** The audit-first pairing for questions 3 and 8 predates this session (present since the original "Before you start" note) and question 3 never actually fit it. Question 3 asks about product knowledge, formulation, claims, where that documentation lives, which a Voice of Customer audit (customer language) cannot answer. Question 8 (where the product shows up in the customer's day) does fit, that's exactly what pain points and trigger moments speak to. Caught live during a walkthrough test when the woven-in audit context for question 3 didn't make sense. Removed question 3 from audit-first treatment entirely; it now always asks cold, as originally written. Question 8 keeps the audit-first treatment.

## v9 (2026-08-12)
- **Added the missing "why this exists" framing.** `03-extraction-interview.md` now states plainly, before question 1, that this puts how the team actually thinks about creative onto paper so real decisions can be made about what to do next in the ideation stage of the flywheel, not a survey answered for its own sake. That framing was never written anywhere, it only ever lived in someone's head going into the conversation.
- **Sophistication-path reveal rewritten to be warm and personal, not clinical.** `04-sophistication-gate.md`'s "how the gate is applied" now gives the actual line for each path, addressed to the person directly (by name when known): genuine credit when the answer sounds like a real system, and an equally direct, non-judgmental "that's completely fine" when it doesn't. `03`'s qualification-pause instruction now points at this exact wording instead of a single generic example.

## v8 (2026-08-12)
- **Questions 1 and 2 are now their own qualification pacing group**, separate from the printed Openers/Inputs section split. They're the exact pair the sophistication gate reads, so they get asked and gated together; question 3 no longer rides along with question 2 just because they share a printed section.
- **Dropped the rigid section-announcement pattern.** `03` no longer instructs announcing section names as a formal transition every turn, that's mechanical and unnecessary most of the time. Structure gets referenced only when it actually helps orient the person.
- **New formatting rule: multiple questions in one turn must be visibly separate**, each on its own line, not run together in a paragraph a person has to parse apart themselves. Caught live, during a walkthrough test, when questions 2 and 3 went out as one dense block.

## v7 (2026-08-12)
- **Fixed a real terminology error, not a real gap.** `04-sophistication-gate.md`'s Partial and Starting-out paths referenced "starter banks" as if they'd been removed in v3. They weren't removed, they're the same three shared banks (`creative-strategy-library/`), just built from real ad evidence per `05` instead of being separately seeded files. Corrected `04` to point at the actual mechanism: whatever's already confirmed in the shared banks, including entries seeded by a check-before-building step or by another package, rather than a nonexistent starter-bank file.
- **New "how this gets run" section in `03-extraction-interview.md`.** The interview is now explicitly paced by its existing 11 section headers, not handed over as a form or fired one question per message. Hard pause after Openers/Inputs (questions 1-2) to state the detected sophistication path out loud before continuing, per `04`, and that detected path carries forward as the tone for every later section.
- **Existing-context dependencies now get woven into the question itself.** Questions 3 and 8, which already had a documented VoC-audit-first rule, now ask with the audit's finding stated directly inside the question ("your VoC audit points to X, does that match...") instead of asking cold and cross-checking afterward as a separate step.

## v6 (2026-08-12)
- **New used-status tracking per bank entry.** `05-bank-building-process.md` adds a used-status field to every entry, owned-evidence or confirmed-external: never surfaced, surfaced-not-launched, or launched (with date). Confirmed-external entries always start never-surfaced, since untested-as-your-own-ad is their defining trait. Status lives on the entry file itself so it travels with the evidence.
- **Proactive untested surfacing.** `07-concept-output-spec.md` now requires "ways to bring it to life" to include at least one never-surfaced option, clearly labeled, whenever the person doesn't name specific constraints, instead of always defaulting to the safest proven combination. Added a direct "what haven't we tried" path that reads never-surfaced/surfaced-not-launched entries straight off the banks, mirroring the pattern hook-script-mining already uses for its own swipe-file library.
- **Launch confirmation is explicit, never automatic.** Same rule as hook-script-mining: being recommended in a concept never counts as being run; an entry only moves to "launched" when a person confirms a real ad went out.

## v5 (2026-08-12)
- **Banks are now explicitly shared across packages, not just workspaces.** `05-bank-building-process.md`'s "where the libraries live" section now states plainly that other packages (hook-script-mining specifically) build and extend the same three banks at the same shared path, and this engine is not assumed to be first to seed them.
- **New prerequisite: check before building.** Added a check-for-existing-bank step ahead of Steps 1-5: if a bank already has entries (seeded by this engine previously, or by another package), use it directly instead of re-pulling or re-deriving it from scratch. Each of the three banks is checked independently, since one can be seeded while the others are still empty. This is the ideation-package half of the "separate packages, one shared bank" decision; the hook-script-mining side of the same reconciliation is being handled separately.

## v4 (2026-08-12)
- **Banks can now hold confirmed-external entries.** `02-ideation-engine.md`'s "the three banks" section now recognizes two entry types per bank: owned-evidence entries (built from this brand's own ad library, per `05`) and confirmed-external entries (fed in by the hook-script-mining package from competitor/creator/adjacent-brand sources). Hook-script-mining is the research side, the ideation engine is the assembly side; external entries get labeled as such whenever a concept surfaces one, so they're never confused with owned performance evidence.
- **Honesty rule scoped explicitly to steps 1-5.** Clarified that "the rule that keeps it honest" only governs concept-level decisions (anchor, persona, micro-moment, messaging angle, awareness stage), which must trace to a product fact, customer insight, or persona and never to external inspiration. Steps 6-8 (mechanic, hook, format) trace to their bank entry's evidence instead, which can legitimately be owned or confirmed-external. This was a clarification of intent, not a loosening: banks were never required to trace to product fact/customer insight/persona, the rule just hadn't said so explicitly.
- Messaging angle's reference-list note (tested angles, not a pick-from bank) reaffirmed as already covering the "know what's been tried" need without reopening it as a bank.

## v3 (2026-08-07)
- **Default engine restored to brand-agnostic.** `02-ideation-engine.md` had drifted into one early test brand's specific configured engine (awareness stage as step 2, a two-bucket persona system, an explicit Benefit step). Restored the original default: Anchor -> Persona -> Micro-moment -> Messaging angle -> Awareness stage -> [Concept] -> Mechanic -> Hook -> Format. A reconfigured expert engine stays in that brand's own workspace folder, not in the package.
- **No standalone Benefit step.** Naming the outcome someone wants sharpens the persona, but it is not its own decision, it is folded into how the persona is described (step 2), not a numbered step 4.
- Concept vs. execution split carried into the default: concept = steps 1-5 (anchor, persona, micro-moment, angle, awareness stage). Mechanic, hook, and format are execution options chosen after the concept exists, not additional required steps.
- Stack order for execution options corrected to Mechanic -> Hook -> Format (mechanic chosen before hook), matching the corrected order already in `05`.
- `07-concept-output-spec.md` required-fields table genericized to match the restored default (anchor, persona, micro-moment, awareness stage, angle, source trace), with a note that a reconfigured expert-path engine uses its own field set instead.
- New presentation rule in `07`: present the concept (required fields) first, then a separate "ways to bring it to life" section for execution options. Source trace is reference material, collapsed or on request, not displayed inline with every field.
- New prerequisite in `03-extraction-interview.md`: if a Voice of Customer audit already exists, attempt VoC-answerable questions (3 and 8) from the audit first, then confirm with the strategist rather than asking cold or assuming the audit answer is correct.
- New prerequisite in `05-bank-building-process.md`: if naming conventions are already confirmed in the workspace's Meta account context, use them but confirm with the team rather than assuming; if not yet confirmed, confirm them as the first part of bank building.
- Removed the stale `05-starter-banks.md` (v1's 4 seeded banks, including a messaging-angles bank). It was superseded by `05-bank-building-process.md` in v2 but never deleted, and it contradicted the current 3-bank, evidence-built model.

## v2 (2026-08-06)
- Interview reduced from 30 to 17 questions.
- Banks reduced from 4 to 3: removed messaging strategies bank. Messaging angle is now derived from product + awareness stage + persona + micro-moment + benefit, not picked from a bank.
- New file: `05-bank-building-process.md`. Banks are now built from real ad evidence (Motion AI tags, transcripts, creative breakdowns, verified images), not from interview recall. Includes categorization rules, creative mechanics teaching layer (8 universal presets), verification rules, shared vs brand-specific split, and the weekly nominations routine as standard setup.
- Stack order corrected: Angle -> Creative Mechanic -> Hook -> Visual Format. The mechanic is chosen before the hook.
- Concept vs. execution split: concept = steps 1-6 (product, awareness stage, persona, micro-moment, benefit, derived angle). Format, hook, and mechanic are execution options, one concept can produce multiple.
- Research upgraded from "input only" to active, ongoing step in the flywheel.
- Standing rules baked in: always state video vs static (never "both"); verify actual creative images before treating extracted text as a layout pattern; never use "Other" as a category.
- `06-library-confirmation.md` updated to reference 3 banks instead of 4.
- `07-concept-output-spec.md` updated to reflect concept vs. execution split.
- Removed reference to `08-worked-example.md` (not included, not needed).
- Elements of Value framework retained as scoring lens after concept assembly, not as a strategy selector.

## v1 (2026-08-05)
- First build. Scope: ideation only.
- Includes flywheel scaffold, ideation engine, extraction interview (30 questions), sophistication gate, four seeded starter banks, library confirmation gate, concept output spec, and one worked example.
- Authored from scratch. No prior internal documents included.
- Other flywheel stages (brief, production, QA, launch, analysis) are named slots, not yet built.
