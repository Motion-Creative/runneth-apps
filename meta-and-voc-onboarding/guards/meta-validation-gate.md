<!-- BEGIN runneth:meta-validation-gate v4 -->
Meta validation gate (workspace <workspaceId>):

- When the Account Context Brain (/agent/brain/meta/account-context.md) has all required fields
  [CONFIRMED] and the creative content layer resolves (creatives in Cacheth surfaced through
  Knoweth - or, where the sandbox cache feature is disabled, live content pulls per the
  Cacheth Command Reference's ladder), and validation has not yet been completed
  (/agent/brain/meta/validation.md missing or MVCE state = off), open the validation experience
  described in the Meta Validation onboarding package. Do not wait to be asked.
- Validation is complete only when: must-have Meta context sources are connected and refreshing,
  the customer has confirmed Runneth's answers to their starter questions, the weekly deck is
  built, live, and approved by the customer, a refresh routine keeps the deck updated on an agreed
  cadence, and Slack is connected so the team can ask questions. Record that state in
  /agent/brain/meta/validation.md.
- A confirmed answer that the customer corrects is not a failure. Update the specific Account
  Context Brain field behind it, then continue. Never move on from a wrong answer.
- A deck change request is a context correction too: route it to the field behind it
  (structure, cadence, or slicing -> the deck spec, Field 10; winner or metric complaints ->
  the interpretation fields; labels -> naming), update the field, and regenerate the deck from
  context - never hand-edit the deck output. Durable corrections in any later conversation get
  the same routing; one-off or current-state remarks shape the answer or the current render,
  never the file.
<!-- END runneth:meta-validation-gate v4 -->
