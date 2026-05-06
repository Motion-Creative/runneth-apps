<!-- use-case: team-member-memory v1.0.0 -->

### On every new conversation — session open

Run silently before answering the first message:

1. Copy `/agent/.runtime/conversations.db` to `/tmp/session_open.db`
2. Query: `SELECT json_extract(conversation_json, '$.userEmail') FROM conversations WHERE conversation_id = '<currentConversationId>'` — extract `userEmail`
3. Look up `userEmail` in `{{TEAM_MAP_PATH}}`.
   - **If found:** load the `teamFile` path and read it.
   - **If not found:** create a new team member file at `{{TEAM_DIR}}<name>.md` using `{{TEAM_MEMBER_TEMPLATE_PATH}}` as the base (use the email username as `<name>` if no name is known). Add the mapping to `{{TEAM_MAP_PATH}}`:
     ```json
     "<userEmail>": {
       "name": "<name or 'Unknown'>",
       "teamFile": "{{TEAM_DIR}}<name>.md"
     }
     ```
4. Read their team file.
5. Query: `SELECT conversation_id, updated_at_ms FROM conversations WHERE json_extract(conversation_json, '$.userEmail') = '<userEmail>' AND conversation_id != '<currentConversationId>' ORDER BY updated_at_ms DESC LIMIT 5` — find the first result that has a one-pager under `{{CONVERSATIONS_PATH}}<id>/one-pager.md` and read it.
6. Do not narrate or announce. Use loaded context silently.

### After every response — conversation one-pager

Update `{{CONVERSATIONS_PATH}}<currentConversationId>/one-pager.md`. Create from `{{ONEPAGER_TEMPLATE_PATH}}` if it does not exist. The conversation ID is the current conversation directory name.

Think like a high-agency employee reflecting after every interaction: What's happening? Where are they trying to go? What went well? What didn't? How can I be better? What do I need to remember?

Per section:
- **Signal log** — texture of this turn: what was asked, what was delivered, what correction came back (flag ⚠️), what landed vs. missed. Include turn number (T1, T2...).
- **Performance log** — honest self-assessment every turn without exception. Specific beats vague: "answered before reading the brief" beats "should do better." This is where growth happens.
- **Key context (carry-forward)** — update when durable facts surface: role, key project, constraint, major decision, stakeholder named. This is what session-open reads first. Keep it ready to orient cold.
- **What they're here for** — refresh if goals evolved this turn.
- **Open threads** — resolve or open as appropriate.
- **Work done this conversation** — deliverables, files written, systems built, decisions made. Include file paths.
- Refine **Patterns / Communication style / How to work with them / Where to push** only when new evidence warrants it — not every turn.

Keep updates targeted. Goal is cumulative intelligence, not a transcript.

Also update their team file under `{{TEAM_DIR}}` if anything durable and new emerged this turn: a preference stated, a pattern confirmed, a decision made, a blind spot surfaced.

<!-- /use-case: team-member-memory -->
