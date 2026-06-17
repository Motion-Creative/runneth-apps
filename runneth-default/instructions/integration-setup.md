Use `/agent/brain/integrations/` for organization-specific integration knowledge.

Platform-level integration knowledge belongs in Runneth's protected integration guidance and registered app skills. Do not copy API documentation, generic endpoint lists, OAuth instructions, or universal platform facts into the customer's integration notes.

Before suggesting, connecting, or using an integration, check the available connection context and integration catalogue first. Use first-class/native flows when they exist, registered connected-app guidance when the app is available through the integrations catalogue, and secure secret collection for API-key or credential-backed services.

When a task depends on a connected integration, check whether there is a relevant note or folder in `/agent/brain/integrations/` before relying on the integration for analysis, reporting, or routing. Use that customer-owned context for customer-specific definitions, preferences, and gotchas.

When a user gives standing instructions about an integration, save or update the matching file or folder under `/agent/brain/integrations/`. Use `/agent/brain/integrations/_templates/integration-map.md` as the shape for new maps when it exists. Save only durable customer-specific knowledge, such as:

- how they want the integration used
- source-of-truth rules
- KPI definitions and attribution windows
- naming conventions
- important objects, fields, lists, folders, channels, reports, pipelines, or databases
- reporting and deliverable preferences
- known gotchas and exclusions

If a connected integration has no customer-specific note yet and the current task would be more accurate with that context, ask one short setup question instead of giving the user a blank form. For example: "How do you want me to use Klaviyo when I answer email or retention questions for this account?" If the user answers, save the answer in the matching integration note.

After a user connects an integration or asks Runneth to use one for the first time, offer to create the first integration map only when it would help future work. Keep this lightweight: one useful question in context, not a setup wizard and not a repeated pitch.

Do not block simple tasks on setup. If the user asks for a concrete answer and the available data is enough, answer first, then ask the one setup question only if it will improve future work.

Use the richer setup files only when they are useful:

- `capabilities-and-scopes.md` for what access exists, what is verified, and what is still theoretical
- `activation.md` for the setup context, source-of-truth rules, business logic, and first useful workflows
- `practical-guide.md` for the practical "how this actually works here" layer that goes beyond generic API docs
- `quirks.md` for platform surprises, corrections, and never-twice gotchas
- `usage-patterns.md` for repeated defaults, preferred metrics, date windows, outputs, and person-specific usage patterns

Use `_protocols/integration-types.md` before deep setup so Runneth does not treat every integration as the same kind of data pipe. If one app could support different setup shapes, ask one specific clarification question before creating deep setup files.

Use `_protocols/quirks.md` and `_protocols/usage-feedback.md` to decide what to preserve after real usage. Corrections should improve future behavior, not only the current answer.
