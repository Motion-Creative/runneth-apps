# Gemini extraction prompt

## What this is

A single-shot prompt the user pastes into Gemini. Gemini does not have a Code Interpreter equivalent that produces downloadable files in the same way ChatGPT and Claude do, so this prompt asks Gemini to output the JSON inline in the chat. The user then copies the output and saves it as a `.json` file.

## How the user should use it

1. Open Gemini (gemini.google.com).
2. Paste the prompt below.
3. Gemini will output a JSON block inline.
4. Copy the JSON, save it as `gemini-export.json` somewhere local, then upload that file back to Runneth.

Gemini's durable memory lives in two places: "Saved Info" (the user's personal facts saved in settings) and "Gems" (custom personas / prompts the user has built). The prompt covers both.

---

## The prompt (copy from here down)

```
I'm moving from Gemini to a new AI assistant called Runneth and I need you to package everything important you know about me so I can carry it over.

Walk through everything in this order. Be thorough. I'd rather have too much than too little, and the receiving system will sort the noise out.

1. **Saved Info** — every entry in my Saved Info, exactly as stored. If you cannot read Saved Info directly, ask me to paste it and wait.
2. **Gems** — every Gem I've created. For each one: name, description, the full instruction set, and one-paragraph summary of what I use it for.
3. **Recurring preferences observed in our conversations** — tone, format, the kinds of feedback I give, things I correct, things I praise.
4. **Voice patterns** — how I write: vocabulary, sentence length, signature phrasings, strong opinions.
5. **Key decisions and stances** — strong opinions, decisions, principles I've expressed across conversations.
6. **Working sessions worth carrying** — substantive multi-turn artifacts: documents we built, frameworks we developed, briefs we iterated on. For each: title, summary, the resulting artifact or decision.

Output everything as a single JSON object matching this exact schema. Print the JSON inline in this chat inside a code block. Do not split it across multiple messages unless absolutely necessary.

{
  "schema_version": "1.0",
  "source_provider": "gemini",
  "exported_at": "<ISO 8601 timestamp>",
  "items": [
    {
      "id": "<short slug, e.g. info-001, gem-001, pref-001>",
      "category": "saved_info" | "gem" | "recurring_preference" | "voice_pattern" | "key_decision" | "working_session",
      "title": "<short label>",
      "content": "<the actual content, verbatim where possible>",
      "confidence": "high" | "medium" | "low",
      "source": "<where this came from: Saved Info, Gem name, conversation, etc.>",
      "last_referenced": "<approximate date or null>",
      "attachments": []
    }
  ]
}

Be exhaustive on Saved Info and Gems. Be selective on working sessions: only include ones that represent real work, not "explain X" one-offs.

If you start running out of room, stop cleanly at the end of the last complete item, set `"truncated": true` at the top level, and tell me which category you stopped in. I have a follow-up prompt to continue.

Start now. Output only the JSON code block. No preamble, no commentary.
```

---

## Continuation prompt (if Gemini truncated)

```
That export was truncated. Continue from where you stopped, in the same schema and same JSON code block format, but only output items you haven't already included. If you finish this time, set `"truncated": false`.
```

---

## Notes for the parser

- Gemini outputs inline. The user copies and saves manually, so the parser should accept plain `.json` files only (no ZIP for Gemini).
- Gemini sometimes wraps the JSON in markdown code fences (```json ... ```). The parser must strip those before parsing.
- If the user has multiple parts (Gemini truncated and they continued), the user is instructed to save them as separate files. The parser accepts a directory of part files and merges them by `items[].id` (last write wins on conflicts).
- Saved Info access varies by account region and Gemini tier. If a user cannot see Saved Info in their settings, they should paste it inline when Gemini asks.
