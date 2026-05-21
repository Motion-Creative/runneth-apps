# Claude extraction prompt

## What this is

A single-shot prompt the user pastes into Claude. Claude walks its Project knowledge, custom instructions, and observed patterns and packages everything into one structured JSON file using the analysis tool.

## How the user should use it

1. Open Claude in a new conversation.
2. If the user has a key Project, run the prompt inside that Project so Claude can read its knowledge base. Otherwise run it from the main interface.
3. Paste the prompt below.
4. Claude will produce a downloadable JSON file (or ZIP if attachments exist).
5. Save the file, upload it back to Runneth.

Claude's memory model is different from ChatGPT's: there is no "saved memories" feature. Instead, durable context lives in Projects (knowledge base + custom instructions) and in user-provided context within the current conversation. The prompt accounts for this.

---

## The prompt (copy from here down)

```
I'm moving from Claude to a new AI assistant called Runneth and I need you to package everything important you know about me so I can carry it over.

Walk through everything in this order. Be thorough. I'd rather have too much than too little, and the receiving system will sort the noise out.

1. **Project knowledge** — if we're inside a Project, dump the entire knowledge base content for that Project, every file and instruction. List each file by name and include its full content where you can read it.
2. **Project custom instructions** — the Project's custom instructions field, verbatim.
3. **Account-level custom instructions** — if you can see any account-wide preferences or system prompts the user has set, include them.
4. **Other Projects I have** — names, descriptions, and a one-paragraph summary of what we usually work on in each. If I'm inside this specific Project, mention the others I have but skip their knowledge base content unless I tell you otherwise.
5. **Recurring preferences observed in this conversation and any prior ones I share** — tone preferences, format preferences, the kinds of feedback I give, things I keep correcting, things I keep praising.
6. **Voice patterns** — how I write: vocabulary, sentence length, signature phrasings, opinions I've expressed strongly.
7. **Key decisions and stances** — strong opinions, decisions, principles I've expressed. Things I've said "I believe X" or "I always do Y" or "I never want Z" about.
8. **Working sessions worth carrying** — substantive multi-turn artifacts: documents we built together, frameworks we developed, briefs we iterated on. For each: title, summary, the resulting artifact or decision.

Output everything as a single JSON object matching this exact schema:

{
  "schema_version": "1.0",
  "source_provider": "claude",
  "exported_at": "<ISO 8601 timestamp>",
  "items": [
    {
      "id": "<short slug, e.g. proj-001, ci-001, pref-001>",
      "category": "project_knowledge" | "custom_instruction" | "project" | "recurring_preference" | "voice_pattern" | "key_decision" | "working_session",
      "title": "<short label>",
      "content": "<the actual content, verbatim where possible>",
      "confidence": "high" | "medium" | "low",
      "source": "<where this came from: project name, file name, conversation, etc.>",
      "last_referenced": "<approximate date or null>",
      "attachments": []
    }
  ]
}

Use the analysis tool to write the JSON to a file called `claude-export.json`, then give me the download link.

If Project knowledge files have re-creatable content (text, markdown, configs), write each one to disk alongside the JSON and zip everything as `claude-export.zip` instead. If a file is binary or you can't re-create it, list the filename in `attachments` only.

Be exhaustive on custom instructions and Project knowledge — those are exact, copy them as written. Be selective on working sessions: only include ones that represent real work, not "explain X to me" one-offs.

If you start running out of room, stop cleanly at the end of the last complete item, set `"truncated": true` at the top level, and tell me which category you stopped in. I have a follow-up prompt to continue.

Start now. Output only the file (or zip) and the download link. No preamble, no commentary.
```

---

## Continuation prompt (if Claude truncated)

```
That export was truncated. Continue from where you stopped, in the same schema, but only output items you haven't already included. Save the new file as `claude-export-part2.json` and give me the download link. If you finish this time, set `"truncated": false`.
```

---

## Notes for the parser

- Claude's analysis tool produces `.json` or `.zip` outputs.
- If the user runs the prompt outside a Project, the `project_knowledge` array will be empty. That's expected.
- Claude is generally better than ChatGPT at following strict JSON output. Truncation usually shows up as a missing closing brace, not as prose interrupting the JSON.
- The parser should still tolerate markdown wrapping the JSON output.
