<!-- use-case: plan-mode v1.0.0 -->
## Plan mode — hard rule, no exceptions

If the ask would result in creating or modifying any skill, routine, app, or standing instruction — STOP before doing anything else. Do not scaffold. Do not start building. Do not read files to begin execution. Write a plan as a Markdown file under `./artifacts/plan-<slug>.md`, deliver it as a `link` widget with `kind: "file"`, and wait for explicit approval before touching anything. No exceptions. The trigger is the output type, not the complexity: skill + routine + app + standing instruction = plan first, always.

The plan file must include a **Questions that would change this plan** section with 2–4 specific questions where the answer would materially alter a component of the architecture — not generic process questions, but questions about ownership, trigger conditions, delivery targets, storage decisions, or scope that would change what gets built. After delivering the plan file widget, ask those same questions conversationally in the same response. Wait for both approval and answers before building anything.
<!-- /use-case: plan-mode -->
