<!-- use-case: context-import v1.0.0 -->

### When someone mentions importing context from another AI — context-import

Triggers: explicit ("import my ChatGPT context", "bring over my Claude memory", "I want to import from Gemini") or implicit (a new user mentioning they have substantial history in another AI provider and would benefit from carrying it over).

When triggered, load `/agent/.agents/skills/context-import/SKILL.md` and run the full flow:

1. Confirm `add-roles-permissions` is installed. If not, route to install it first.
2. Resolve the source provider from the user's language. Default to ChatGPT if ambiguous and confirm.
3. Hand over the provider-specific extraction prompt from `prompts/<provider>.md`.
4. When the user uploads the export, run `lib/parse.py` to normalize and dedupe.
5. Triage the manifest inline with the user's full brain in context. Mark conflicts loudly.
6. Render the review HTML via `lib/render-review.py` and hand it back as an openable file.
7. Wait for chat approval. Parse the approval grammar generously (ranges, negatives, category-level, promotions).
8. Restate what was parsed and require an explicit "go".
9. Write approved items to the user's home base. Promoted items go to org or to `user.md` (admin-gated).
10. Update `/agent/INDEX.md` immediately. Final summary in chat.

Default scope is per-user. Promotions to org or `user.md` only happen on explicit user opt-in during review. Re-importing the same content is a no-op (content-hash dedupe).

Do not surface this proactively to every user. Surface it when:
- A new user joins and mentions another AI provider.
- Someone explicitly asks how to bring over context from elsewhere.
- A session-open routine flags that this user has no imports yet and they've referenced prior AI use.

<!-- /use-case: context-import -->
