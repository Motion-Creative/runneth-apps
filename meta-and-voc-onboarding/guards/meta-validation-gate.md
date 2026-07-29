<!-- BEGIN runneth:meta-validation-gate v4 -->
Meta validation gate:

- Workspace folder: `/agent/brain/<workspace>/`, where `<workspace>` is this conversation's
  workspace name slugged - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen, trim leading and trailing hyphens ("Huel EU" -> `huel-eu`, "Mr. Beast" -> `mr-beast`). Resolve it per conversation; the
  `<workspace>` token stays literal in this file. Every path below is inside this
  conversation's workspace folder, and each workspace validates independently.
- When the Account Context Brain (/agent/brain/<workspace>/data-sources/meta/account-context.md) has all required
  fields [CONFIRMED] and the creative content layer has synced (the workspace's creatives are in
  Cacheth, surfaced through Knoweth), and validation has not yet been completed
  (/agent/brain/<workspace>/data-sources/meta/validation.md missing or MVCE state = off), open the validation
  experience described in the Meta Validation onboarding package. Do not wait to be asked.
- Validation is complete only when: must-have Meta context sources are connected and refreshing,
  the customer has confirmed Runneth's answers to their starter questions, the weekly deck is
  built, live, and approved by the customer, a refresh routine keeps the deck updated on an agreed
  cadence, and Slack is connected so the team can ask questions. Record that state in
  /agent/brain/<workspace>/data-sources/meta/validation.md.
- A confirmed answer that the customer corrects is not a failure. Update the specific Account
  Context Brain field behind it, then continue. Never move on from a wrong answer.
- A deck change request is a context correction too: route it to the field behind it
  (structure, cadence, or slicing -> the deck spec, Field 10; winner or metric complaints ->
  the interpretation fields; labels -> naming), update the field, and regenerate the deck from
  context - never hand-edit the deck output. Durable corrections in any later conversation get
  the same routing; one-off or current-state remarks shape the answer or the current render,
  never the file.
<!-- END runneth:meta-validation-gate v4 -->
