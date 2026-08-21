# Creative QA platform recipes

Per-platform intake and delivery mechanics, with evidence levels: **live-verified**
(ran in production on a real customer account), **registry-verified** (paths and connect
mechanics confirmed in the Builder integration registry, not run on a customer account),
and **doc-grounded** (provider docs, unprobed - verify with a bounded call first).

Recipes are best-effort guidance, not law: the live API is the truth and adaptation is
expected. **The recipe list is not the scope - creative assets are the scope.** Any
reachable platform that carries ad assets or review feedback is in scope with no recipe
at all: resolve its connection path in the standard priority order (native integration,
then registry connected app, then stored-secret + secure-fetch), make one bounded
discovery call, then run the same review contract. A missing or stale recipe must never
stop a QA pass.

Shared contract for every scheduled intake, regardless of platform:
read the source live, diff against the processed ledger in `state.json`, treat a failed
read as a failure that alerts the configured owner, and skip anything already processed
or already human-approved. Newness is never eyeballed.

---

## slack (native CLI) - live-verified

- Intake: scheduled read of the configured channel; new assets arrive as uploaded files
  or links (Drive, Frame.io, DAM) in messages. Diff message timestamps against the
  processed ledger. Skip threads that already carry a reviewer checkmark or an existing
  Runneth QA reply.
- Delivery: reply in the asset's thread tagging the reviewer of record; channel-root
  summary only if config says so. End with the standing feedback out ("reply no if ...").

## asana (stored secret or registry app) - live-verified

Ran in production for months on a creator-briefs board (30-min and 2-h watches).

- Discovery: project GID, reviewer's user GID, any custom field GIDs config needs.
- Intake: `GET /api/1.0/tasks?project={projectGid}&assignee={reviewerGid}&opt_fields=gid,name,completed&completed_since=now`
  then per task `GET /api/1.0/tasks/{gid}/stories?opt_fields=gid,text,created_by.gid,created_by.name,type,resource_subtype,created_at`.
  Skip when any story author is Runneth's own Asana identity (already reviewed). The
  asset link usually rides in a teammate's comment (often a Drive URL) or a custom field.
- Delivery: `POST /api/1.0/tasks/{gid}/stories` with `{"data":{"text":"<QA comment>"}}`.
  Reviewer replies on the same task are the calibration signal source.

## frame_io (registry app) - registry-verified, verify v4 on first connect

- Connect through the registry (`frame_io`). One production deployment needed the v4
  content endpoints for asset download and found legacy v2 tokens unusable there;
  verify v4 coverage with a bounded call on first connect before promising downloads.
- Intake: review links posted in Slack or a PM tool; resolve the short link to the asset
  and file id, pull the download URL and name, download, delete after the pass.
- Delivery: one comment per finding plus a verdict comment at 0:00, then the Slack
  summary. Reviewer replies in the Slack thread are the signal source.

## notion (native CLI) - live-verified pattern

- Intake: query the configured data source for pages entering the ready-for-review
  status (`notion query <data-source-id> --filter-json '{"property":"Status","status":{"equals":"<ready status>"}}'`),
  diff page ids against the processed ledger so pages re-prompt only when they re-enter
  the status. Asset links ride in page properties or body.
- Drift check: status-driven watches go stale when teams move their pipeline to another
  tool. If the watched status returns nothing for a configured span while assets keep
  arriving elsewhere, flag the config to the owner instead of silently idling.
- Delivery: page comment, or the configured Slack channel.

## google drive links (native CLI) - live-verified

- Intake transport only: assets referenced by Drive URL inside messages or task
  comments. Download by link, QA, delete the local copy. Renaming to convention happens
  on the QA output (proposed name in feedback, or rename via the Drive connection when
  the workspace granted edit access to the file).
- Folder-watching as a trigger is out of v1.

## direct upload / app drop - live-verified failure mode, in-turn path only

- "QA this" with an uploaded file processes immediately in the conversation turn.
- A scheduled watcher over an app upload folder is allowed only with the shared
  deterministic contract; one production install failed silently here, so a watcher that
  cannot prove it read the folder must alert, never report a quiet run.

## monday / trello / clickup / air / other PM and DAM tools - doc-grounded

No recipe yet. Use the no-recipe path: registry connect (`integrations list --with-creative-strategy --query <tool>`),
read its setup requirements before offering the connect, one bounded discovery call to
map boards/statuses, then apply the shared intake contract. Add what was learned to this
file's evidence levels via the normal package update flow.
