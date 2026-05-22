# Plan mode

## What just opened up
Runneth now writes a plan before it builds anything that lasts. Any time you ask for a new skill, routine, app, or standing instruction, it stops, asks 2-4 sharp clarifying questions in chat, then drafts an openable plan file you sign off on before any file gets written. Big builds stop being silent surprises.

## Try this now
1. **Trigger a plan with a real request**: `Build me a routine that posts top performing ads to Slack every Monday morning.`
   _You'll get back:_ a short list of clarifying questions, then a plan file at `./artifacts/plan-<slug>.md` to review before anything ships.
2. **Test it on a skill ask**: `I want a skill that turns any Loom into a brief.`
   _You'll get back:_ Runneth's read on the trigger conditions, inputs, outputs, and storage decisions, then a plan file with the proposed shape.
3. **See where it draws the line**: `Is plan mode going to fire for everything I ask?`
   _You'll get back:_ a plain answer covering what triggers a plan (skills, routines, apps, standing instructions) and what doesn't (one-off deliverables, reads, ad-hoc analysis).

## Compounds with
- **self-iteration-loop:** Every routine or app a plan produces gets a feedback loop wired in by default, so the plan becomes a system that gets sharper over time.
