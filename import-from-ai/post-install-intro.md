# Import from another AI

## What just opened up
You can now pull months or years of saved memories, custom instructions, projects, and recurring preferences out of ChatGPT, Claude, or Gemini in one paste. Runneth normalizes the export, dedupes against what it already knows, triages every item against your existing brain, and writes only what you explicitly approve. Ramp-up collapses from weeks to one review session.

## Try this now
1. **Start the import**: `Import my context from ChatGPT.`
   _You'll get back:_ a provider-specific extraction prompt to paste into ChatGPT, plain-language instructions, and what to do with the file that comes back.
2. **Switch providers**: `Import from Claude instead.`
   _You'll get back:_ the Claude-specific prompt and the same flow, normalized to the same canonical schema on Runneth's side.
3. **Resume after upload**: `I uploaded the file, walk me through the review.`
   _You'll get back:_ an HTML review at `./artifacts/import-review-<id>.html` with every item bucketed (behavioral or contextual), categorized, and flagged for conflicts; approve in chat with ranges and overrides.

## Compounds with
- **add-roles-permissions:** Imports write into your permissions home base, so identity must resolve before this can run.
- **team-member-memory:** Behavioral items from imports land in your profile so Runneth adapts to you from turn one.
