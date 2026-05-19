<!-- use-case: team-member-memory v2.0.0 -->

### On every new conversation — session open

Run silently before answering the first message:

1. **Pre-flight — check add-permissions is installed:**
   ```bash
   [ -f /agent/brain/admin/workspace-map.json ] && echo "OK" || echo "MISSING"
   ```
   If MISSING: reply with exactly this and stop all other session-open steps:
   > "Team Member Memory requires Add Permissions to be set up first. Run the `add-permissions` skill, complete its setup, then start a new conversation."

2. **Resolve identity from the active surface:**
   - **Slack:** `bash /agent/brain/admin/slack-whoami.sh <currentMessage.authorId> [<display_name>]`
   - **Motion web:** extract `userEmail` from the conversations DB:
     ```sql
     SELECT json_extract(conversation_json, '$.userEmail')
     FROM conversations
     WHERE conversation_id = '<currentConversationId>'
     ```
     Then: `bash /agent/brain/admin/motion-whoami.sh <userEmail> [<display_name>]`

   Both return `{ scope, handle, home_base, status }`.

   - If `status: "collision"`: follow the permissions collision flow — block writes, do not proceed with memory steps.
   - If `status: "provisioned"`: new member, no team file yet. Proceed normally.

3. **Read the team file** at `<home_base><handle>.md`.
   If it does not exist: create it from `{{TEAM_MEMBER_TEMPLATE_PATH}}`.

4. **Find the most recent one-pager** under `<home_base>conversations/`. Pick the most recently modified file that is not the current conversation.

5. Do not narrate or announce. Use loaded context silently.

---

### After every response — conversation one-pager

Update `<home_base>conversations/<currentConversationId>/one-pager.md`. Create from `{{ONEPAGER_TEMPLATE_PATH}}` if it does not exist. The conversation ID is the current conversation directory name.

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
