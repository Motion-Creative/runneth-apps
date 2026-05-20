# ChatGPT extraction prompt

## What this is

A single-shot prompt the user pastes into ChatGPT. It instructs ChatGPT to walk its own memory (saved memories, custom instructions, Projects, recurring patterns observed across conversations) and package everything into one structured JSON file, then use Code Interpreter to bundle it for download.

## How the user should use it

1. Open ChatGPT in a fresh conversation (anything paid tier so Code Interpreter / "Advanced Data Analysis" is available).
2. Paste the prompt below into the chat.
3. ChatGPT will produce a download link for a single JSON file (or a ZIP if attachments exist).
4. Save the file, then upload it back to Runneth.

If ChatGPT runs out of room and the output is truncated, Runneth will hand over a continuation prompt that resumes from where it stopped.

---

## The prompt (copy from here down)

```
I'm moving from ChatGPT to a new AI assistant called Runneth and I need you to package everything important you know about me so I can carry it over.

Walk through everything in this order. Be thorough. I'd rather have too much than too little, and the receiving system will sort the noise out.

1. **Saved memories** — every entry in your memory about me, exactly as stored.
2. **Custom instructions** — both the "what I want you to know about me" and "how I want you to respond" fields, verbatim.
3. **Projects** — every Project I have. For each one: name, description, custom instructions, attached files (list filenames), and one or two sentences summarizing what we usually work on inside it.
4. **Recurring preferences** — patterns you've noticed across our conversations: tone preferences, format preferences (markdown vs prose, lists vs paragraphs, brevity vs depth), the kinds of feedback I give you, things I keep correcting you on, things I keep praising.
5. **Voice patterns** — observations about how I write: vocabulary, sentence length, signature phrasings, how I open and close messages, opinions I've expressed strongly.
6. **Key decisions and stances** — strong opinions, decisions, principles I've expressed across conversations. Things I've said "I believe X" or "I always do Y" or "I never want Z" about.
7. **Working sessions** — substantive multi-turn conversations (10+ turns) that look like real work, not throwaway Q&A. For each one: title, one-paragraph summary, the actual artifacts or decisions that came out of it, approximate date.

Output everything as a single JSON object matching this exact schema:

{
  "schema_version": "1.0",
  "source_provider": "chatgpt",
  "exported_at": "<ISO 8601 timestamp>",
  "items": [
    {
      "id": "<short slug, e.g. mem-001, ci-001, proj-001>",
      "category": "saved_memory" | "custom_instruction" | "project" | "recurring_preference" | "voice_pattern" | "key_decision" | "working_session",
      "title": "<short label>",
      "content": "<the actual content, verbatim where possible>",
      "confidence": "high" | "medium" | "low",
      "source": "<where this came from: memory entry, conversation title, project name, etc.>",
      "last_referenced": "<approximate date or null>",
      "attachments": []
    }
  ]
}

Write the JSON to a file called `chatgpt-export.json` using Code Interpreter, then give me the download link.

If any Project has attached files I uploaded to it, also include those filenames in the `attachments` array on the project item. If you can re-create the file content (because it's in our conversation history), write each one to disk alongside the JSON and zip everything as `chatgpt-export.zip` instead. If you can't, just list the filenames in `attachments` and leave it as JSON only.

Be exhaustive on saved memories and custom instructions — those are exact, copy them as written. Be selective on working sessions: only include ones that actually represent real work, not "explain X to me" one-offs. Skip code debugging chats, recipe asks, and generic Q&A unless they led to a decision I'd want to remember.

If you start running out of room before you finish, stop cleanly at the end of the last complete item, set `"truncated": true` at the top level of the JSON, and tell me which category you stopped in. I have a follow-up prompt ready to continue.

Start now. Output only the file (or zip) and the download link. No commentary, no preamble.
```

---

## Continuation prompt (if ChatGPT truncated)

```
That export was truncated. Continue from where you stopped, in the same schema, but only output items you haven't already included. Save the new file as `chatgpt-export-part2.json` and give me the download link. If you finish this time, set `"truncated": false`. If not, repeat with part3.
```

---

## Notes for the parser

- ChatGPT's Code Interpreter typically produces a `.json` file. Some users will get a `.zip` if attachments were re-created.
- The `truncated: true` flag at the top level is the signal to surface the continuation prompt.
- ChatGPT sometimes adds a markdown preamble despite the "no commentary" instruction. The parser should be tolerant: strip non-JSON content before the first `{` and after the last `}`.
- The `confidence` field is the source AI's own confidence, not Runneth's. Runneth's inline triage overrides this.
