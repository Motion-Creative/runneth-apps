# Creative QA

Source-agnostic, self-improving QA for ad creatives (video and static). One shared core
— rubric, training log, calibration, naming — with swappable adapters for where assets come
from and where feedback goes.

## Why it is shaped this way

Generalized from five real production deployments:

1. **Generated-statics pipeline** — deterministic pre/post-render gates on generated
   statics (placeholder, banned claims, aspect, dedup) plus a 3-layer AI fidelity gate
   graded against real product photos. Lessons: deterministic first, AI second; grade
   against reality; normalize model verdict outputs; block, don't fix.
2. **Review-tool link scan from Slack** — scheduled Frame.io link scan from a Slack
   channel, rubric-based video QA, timestamped comments back into the review tool,
   training log with rubric rewrite thresholds, token health checks, loud failure
   alerts. Lessons: deterministic link detection with a state file; a failed read is a
   failure, not a quiet run; weak feedback signal is the loop's main risk.
3. **PM-board watch** — Asana board watch, QA posted as task comments, rubric seeded by
   harvesting the reviewer's historical feedback and watching the flagged videos, rubric
   self-update every 10 reviewer comments. Lessons: seed from real approver judgment;
   calibrate before going live; deliver where the review already happens.
4. **Bring-your-own-rubric install** — installed the original video-qa app, brought
   their own rubric, needed image + video support; the file-drop trigger failed
   silently. Lessons: rubric import path; multi-format; triggers must be deterministic
   and alert on failure.
5. **Checklist-and-naming workflow** — checklist-driven QA with naming conventions,
   trigger phrases, and status watches. Lessons: naming is part of QA; one canonical
   rubric the live workflow actually points at (their skill rubric and real checklists
   had drifted apart); stale triggers need a drift check.

## What installs

- `instructions/behavior.md` — standing routing and safety rules.
- `skills/setup-creative-qa` — plain-question interview: process, taste dimensions,
  naming, routing, live calibration, lock-in.
- `skills/creative-qa-review` — one QA pass: deterministic gates, AI evidence capture,
  verdict, 3-6 comments, rename, delivery, state record.
- `skills/creative-qa-calibrate` — signal collection, rubric refresh with versioned
  history, agreement score toward 90-100%.

Per-workspace state lives at `/agent/brain/creative-qa/<scope>/`.

## Before install — what the team should have on hand

The setup interview goes fastest when the customer arrives with:

- The exact board or channel where finished ads land (a link, not a description), and
  which field or comment carries the actual file.
- The reviewer of record's name and their handle in that tool.
- Any written rules: brand guidelines, claims/legal restrictions, do-not-say lists, QA
  checklists, per-product specs — any form counts, even a single slide.
- Three recent file names, if naming wasn't already captured by Meta onboarding.
- Where feedback should go and how the reviewer wants to be notified.
- Access: expect a "how do I get in" moment per tool (an OAuth connect or a token
  walkthrough) before any watch can run.

Expect the rubric to be incomplete at install. In every production setup it was built
from the team's artifacts plus their historical feedback plus adjudication during
calibration — never from the interview alone.

## v1 boundaries

- Intake adapters: Slack channel scan, PM-tool watch (Asana/Notion/Monday/Trello/etc.),
  review-tool or Drive links inside messages and tasks, direct upload.
- Drive **folder-watching** as a trigger is out of v1 (links are in).
- Reference-photo fidelity grading activates only when the workspace stores reference
  assets.
- Runneth never auto-approves; the reviewer of record owns the ship call.
