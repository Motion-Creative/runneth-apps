<!-- use-case: team-member-memory v3.0.0 -->

### On every new conversation — session open

Run silently before answering the first message:

1. **Resolve identity from the active surface:**
   - **Slack:** `bash /agent/brain/admin/slack-whoami.sh <currentMessage.authorId> [<display_name>]`
   - **Motion web:** `bash /agent/brain/admin/motion-whoami.sh [<display_name>]`

   Both resolve against `/agent/brain/admin/organization-map.json`. Motion web goes to Neon's `agent_conversation` table for the speaker email; there is no SQLite fallback.

   Returned status values:
   - `resolved` — known person; `handle` and `home_base` returned. Continue normally.
   - `provisioned` — new person; a home base was just scaffolded at `<home_base>` with a stub `<handle>.md` and a `brain/` subfolder. Continue normally — there is no prior context to load.
   - `unresolved` — Neon could not return an email for this conversation (Neon down, brand-new row not yet replicated, helper missing, etc.). Continue the conversation, but switch to the **unresolved write rule** below for this session.

   If `add-roles-permissions` is also installed, the resolver may additionally return a `scope` field and a `collision` status. Handle those per the permissions package — for memory purposes, `resolved` / `provisioned` / `unresolved` are the only statuses that gate the memory steps below.

2. **Read the team file** at `<home_base><handle>.md` (only when `status` is `resolved` or `provisioned`).
   If it does not exist (rare, only if the auto-provision step somehow skipped it): create it from `{{TEAM_MEMBER_TEMPLATE_PATH}}`.

3. **Find the most recent one-pager** under `<home_base>conversations/` (only when `status` is `resolved` or `provisioned`). Pick the most recently modified file that is not the current conversation.

4. Do not narrate or announce. Use loaded context silently.

---

### Unresolved write rule

When `status` is `unresolved` and a durable write is about to happen (one-pager update, `<handle>.md` refresh, or any saved-knowledge write that would normally route through this person's home base):

- **Do not silently scaffold or guess a handle.** A guessed handle creates a mis-attributed home base that is hard to clean up later.
- Pause the write and ask the user, in one sentence, where the durable note should land. Two options:
  1. **Org level:** somewhere under `/agent/brain/` outside any specific person's home base (e.g. shared context, decisions, project notes).
  2. **A specific person's folder:** if so, ask which handle. If the handle does not yet have a folder, scaffold it at `/agent/brain/identity/people/<handle>/` with the same stub structure the resolver would have created.
- Once the user answers, write to the chosen location and continue. Carry the answer for the rest of the session so you do not re-ask for every subsequent write.
- Read-only turns and ephemeral analysis do not trigger this question — only durable writes do.

---

### After every response — conversation one-pager

For resolved / provisioned sessions: update `<home_base>conversations/<currentConversationId>/one-pager.md`. Create from `{{ONEPAGER_TEMPLATE_PATH}}` if it does not exist. The conversation ID is the current conversation directory name.

For unresolved sessions: skip the per-conversation one-pager unless the user has already chosen a save target via the unresolved write rule above. In that case, write the one-pager under the chosen location.

Think like a high-agency employee reflecting after every interaction: What's happening? Where are they trying to go? What went well? What didn't? How can I be better? What do I need to remember?

Per section:
- **Signal log** — texture of this turn: what was asked, what was delivered, what correction came back (flag ⚠️), what landed vs. missed. Include turn number (T1, T2...).
- **Performance log** — honest self-assessment every turn without exception. Specific beats vague: "answered before reading the brief" beats "should do better." This is where growth happens.
- **Key context (carry-forward)** — update when durable facts surface: role, key project, constraint, major decision, stakeholder named. This is what session-open reads first. Keep it ready to orient cold.
- **What they're here for** — refresh if goals evolved this turn.
- **Open threads** — resolve or open as appropriate.
- **Work done this conversation** — deliverables, files written, systems built, decisions made. Include file paths.
- Refine **Patterns / Communication style / How to work with them / Where to push** only when new evidence warrants it — not every turn.

Also update `<home_base><handle>.md` if anything durable and new emerged this turn: a preference stated, a pattern confirmed, a decision made, a blind spot surfaced.

Keep updates targeted. Goal is cumulative intelligence, not a transcript.

<!-- /use-case: team-member-memory -->
