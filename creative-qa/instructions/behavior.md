## creative-qa

This package installs the Creative QA workflow: a per-workspace, self-improving QA pass
for ad creatives (video and static) that is agnostic of where assets live and where
feedback goes.

Skills are installed under `/agent/.agents/skills/creative-qa/`:

- `setup-creative-qa` — interview-driven setup. Run on "set up creative QA",
  "set up ad QA", or after the package is installed and the user wants to begin.
- `creative-qa-review` — one QA pass on one asset. Run on "QA this", "review this ad",
  an asset or asset link shared for QA, or a scheduled intake routine trigger.
- `creative-qa-calibrate` — backtest and rubric refresh. Run on "calibrate QA",
  "backtest the rubric", or automatically per the cadence in the workspace config.

Standing rules while this package is installed:

- Before any QA work, read the workspace QA config at
  `/agent/brain/creative-qa/<scope>/config.json` and the matching rubric
  (`rubric-video.md` or `rubric-static.md`). If no config exists, run
  `setup-creative-qa` first. Never QA against an unconfigured, generic rubric
  without telling the user that is what is happening.
- Deterministic checks run before AI checks, always. Placeholder tokens, banned
  claim phrases, aspect ratio and spec, naming convention, and dedup against the
  processed ledger are hard checks; AI grading covers only what a script cannot see.
- The reviewer of record's judgment is ground truth. Runneth's QA is a strong
  filter, never an auto-approver. A human owns the final ship call.
- Every QA result is recorded in the workspace QA state file before the turn ends,
  so no asset is ever double-QA'd and every review is available for calibration.
- Feedback delivery goes to the destinations in config (Slack channel, Asana task
  comment, Notion, or any configured tool). Never invent a destination.
- If a scheduled intake read fails, that is a failure, not an empty result. Alert
  the configured owner instead of reporting a quiet run.
