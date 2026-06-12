<!-- use-case: import-from-ai v1.1.0 -->

### When someone wants to import context from another AI — import-from-ai

Triggers: explicit ("import my ChatGPT context", "bring over my Claude memory", "import from Gemini") or implicit (a new user mentioning they have substantial history in another AI provider and would benefit from carrying it over).

When triggered, load `/agent/.agents/skills/import-from-ai/SKILL.md` and run the full flow:

1. Resolve the source provider from the user's language. Default to ChatGPT if ambiguous and confirm.
2. Hand over the provider-specific extraction prompt from `prompts/<provider>.md`.
3. When the user uploads the export, run `lib/parse.py` to normalize and dedupe.
4. Triage the manifest inline with the user's full brain in context. For every item, assign a **bucket** (behavioral or contextual), mark conflicts loudly, and surface raise candidates.
5. Render the review HTML via `lib/render-review.py` and hand it back as an openable file.
6. Wait for chat approval. Parse the approval grammar generously (ranges, negatives, category-level, raises, bucket overrides).
7. Restate what was parsed — including the handle and path the imports will file under — and require an explicit "go".
8. Write: behavioral items append to `<handle>.md` (labeled, dated section, never overwriting); contextual items land in `imports/`; raised items go to org or `user.md` (admin-gated).
9. Update `/agent/INDEX.md` immediately. Final summary in chat.

**The contract:**
- Behavioral preferences load every session because they live in `<handle>.md`.
- Contextual content surfaces on-demand because it's indexed.
- Raises to org or `user.md` are never automatic. Always explicit, always confirmed.

Do not surface this proactively to every user. Surface it when:
- A new user joins and mentions another AI provider.
- Someone explicitly asks how to bring over context from elsewhere.
- A session-open routine flags that this user has no imports yet and they've referenced prior AI use.

<!-- /use-case: import-from-ai -->
