# Creative QA

Source-agnostic, self-improving QA for ad creatives (video and static). One shared core
— rubric, training log, backtest, naming — with swappable adapters for where assets come
from and where feedback goes.

## Why it is shaped this way

Generalized from five real customer setups:

1. **Harry's / Flamingo** — deterministic pre/post-render gates on generated statics
   (placeholder, banned claims, aspect, dedup) plus a 3-layer AI fidelity gate graded
   against real product photos. Lessons: deterministic first, AI second; grade against
   reality; normalize model verdict outputs; block, don't fix.
2. **Cozy Earth** — scheduled Frame.io link scan from a Slack channel, rubric-based video
   QA, timestamped comments back into the review tool, training log with rubric rewrite
   thresholds, token health checks, loud failure alerts. Lessons: deterministic link
   detection with a state file; a failed read is a failure, not a quiet run; weak feedback
   signal is the loop's main risk.
3. **Spot & Tango** — Asana board watch, QA posted as task comments, rubric seeded by
   harvesting the reviewer's historical feedback and watching the flagged videos, rubric
   self-update every 10 reviewer comments. Lessons: seed from real approver judgment;
   backtest before going live; deliver where the review already happens.
4. **Manychat** — installed the original video-qa app, brought their own rubric, needed
   image + video support; the file-drop trigger failed silently. Lessons: rubric import
   path; multi-format; triggers must be deterministic and alert on failure.
5. **Dose** — checklist-driven QA with naming conventions, trigger phrases, and status
   watches. Lessons: naming is part of QA; one canonical rubric the live workflow actually
   points at (their skill rubric and real checklists had drifted apart); stale triggers
   need a drift check.

## What installs

- `instructions/behavior.md` — standing routing and safety rules.
- `skills/setup-creative-qa` — plain-question interview: process, naming, routing,
  backtest, lock-in.
- `skills/creative-qa-review` — one QA pass: deterministic gates, AI evidence capture,
  verdict, 3-6 comments, rename, delivery, state record.
- `skills/creative-qa-calibrate` — signal collection, rubric refresh with versioned
  history, agreement score toward 90-100%.

Per-workspace state lives at `/agent/brain/creative-qa/<scope>/`.

## v1 boundaries

- Intake adapters: Slack channel scan, PM-tool watch (Asana/Notion/Monday/Trello/etc.),
  review-tool or Drive links inside messages and tasks, direct upload.
- Drive **folder-watching** as a trigger is out of v1 (links are in).
- Reference-photo fidelity grading activates only when the workspace stores reference
  assets.
- Runneth never auto-approves; the reviewer of record owns the ship call.
