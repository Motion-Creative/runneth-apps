<!-- BEGIN runneth:meta-validation-gate v8 -->
Meta validation gate:

- Workspace folder: `/agent/brain/<brand>/`, where `<brand>` is this conversation's
  brand name (the workspace's name) slugged - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen, trim leading and trailing hyphens ("Bramblewick NYC" -> `bramblewick-nyc`, "St. Fig & Co." -> `st-fig-co`). Resolve it per conversation; the
  `<brand>` token stays literal in this file. Every path below is inside this
  conversation's workspace folder, and each workspace validates independently.
- When the Account Context Brain (/agent/brain/<brand>/integrations/meta/account-context.md) has all required
  fields [CONFIRMED] and the creative content layer resolves (the workspace's creatives in
  Cacheth, surfaced through Knoweth - or, where the sandbox cache feature is disabled, live
  content pulls per the Cacheth Command Reference's ladder), and validation has not yet been
  completed (/agent/brain/<brand>/integrations/meta/validation.md missing or MVCE state = off), open the validation
  experience described in the Meta Validation onboarding package. Do not wait to be asked.
- Validation is complete only when: must-have Meta context sources are connected and refreshing,
  the customer has confirmed Runneth's answers through the question loop, the weekly report is
  built, live, and approved by the customer (in the form they picked — deck, dashboard, or
  document), a refresh routine keeps the report updated on an agreed cadence, and Slack is
  connected so the team can ask questions. Record that state in
  /agent/brain/<brand>/integrations/meta/validation.md.
- The question loop always runs first. Never proactively offer or lead with the weekly report
  before the question set has been run and confirmed - the report is a soft offer at the end.
  A person who explicitly asks for a report in any form (deck, dashboard, or document) still
  gets one (Field 10 confirmed first), but the question loop still runs to complete validation.
- Whenever the weekly report's chosen form is a dashboard, invoke the installed
  `dashboard-design` skill immediately when the customer selects dashboard, then use it for the
  initial build, every regeneration, and every scheduled refresh. The customer never has to
  name or request the skill. Do not hand-roll a dashboard when that skill or one of its required
  references is unavailable.
- A confirmed answer that the customer corrects is not a failure. Update the specific Account
  Context Brain field behind it, then continue. Never move on from a wrong answer.
- A report change request is a context correction too: route it to the field behind it
  (structure, cadence, or slicing -> Field 10, the report spec; winner or metric complaints ->
  the interpretation fields; labels -> naming), update the field, and regenerate the report
  from context - never hand-edit the report output. Durable corrections in any later
  conversation get the same routing; one-off or current-state remarks shape the answer or the
  current render, never the file.
<!-- END runneth:meta-validation-gate v8 -->
