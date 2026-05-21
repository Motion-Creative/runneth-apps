---
hero_headline: "Stop reading ad metrics. Start reading ads."
hero_subhead: "Nine diagnostic skills installed as independent top-level capabilities, plus an orchestrator that runs them as one mechanism-level teardown."
install_time: "~60 seconds"
requires: "brand-audit (recommended for richer Strategic Layer)"
status: "proven"
---

## Super powers this unlocks

- Diagnoses any ad at the strategy, hook, mechanic, format, and body layers in one pass.
- Names the actual technique that's working ("Pain Agitation + Identity Callout in the first 8 seconds") instead of horoscope-grade observations.
- Reads the workspace's brand-audit bundle for the Strategic Layer — no re-mining reviews on every creative review.
- Runs the full diagnostic on every creative in a test, then surfaces the dimension that actually drove the win.
- Recommendations are executable — a creator could shoot the variant tomorrow.
- Every underlying skill is independently callable. "Evaluate this hook," "what tactic is this," "score this body" — single-skill invocations work without the orchestrator.

## How it works

Point Runneth at a creative ID and the orchestrator pulls the full creative summary from Motion, reads the workspace's `brand-audit/strategy.md` for upstream persona × pain × angle context, runs the 8-section diagnostic with hook-analysis as a sub-component, references the mechanics and format libraries, and writes a per-creative deep-dive markdown file.

Point it at a test and it runs the workflow on every creative in the set, then writes a cross-creative comparison that names which test variable actually correlates with the winner.

Point any standalone skill ("evaluate this hook") at its own input and it runs in isolation — same skill file, narrower scope.

## A real example

Justin at Hungryroot has a $190K creator-led ad with double-account-average thumbstop and above-average hold rate. He runs `creative-deep-dive`. The orchestrator reads `brand-audit/strategy.md`, finds the "Unconfident Home Cook × evening-rush panic × first-delivery framing" cell, names it as the strategy match. Then it runs the 8-section diagnostic on the ad itself: names the tactic (Relatability with embedded Identity Callout), the psychological trigger (Pain Agitation), the mechanic (Trojan Horse via first-delivery framing), the format (UGC walkthrough), and quotes the line that's landing verbatim: "It is 5:30 and I just got my very first delivery from Hungryroot. It is perfect because guess what, like usual, I have nothing planned and everybody's hungry."

Recommendation: hold the tonal register but vary the daypart anchor away from 5pm to isolate whether the panic-window framing is what's actually carrying.

The next day, Justin asks Runneth "evaluate this hook" with the spoken line of a new variant. `hook-evaluator` runs standalone, scores it 4/5, calls out the missing visual-channel alignment. No orchestrator involvement — just the one skill.
