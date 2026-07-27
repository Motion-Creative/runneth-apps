# Template: support conversation file

Path: `/agent/brain/data-sources/voc/<platform>/ticket-<external_id>.md`
(keyed by ticket id so re-pulls overwrite the same file).

Layout: H1 headline, bold-label human header (two trailing spaces end every label line;
every `custom` key becomes its own label - that is where org-specific lines like
`Category` / `Customer tier` come from), the full conversation between `---` rules (one
`###` section per message, in order), then the collapsed metadata block.

Every metadata field is always present; `null` when the source lacks the concept. `custom`
passes platform custom fields through as-is (Gorgias `custom_fields`, Intercom
`custom_attributes`) - do not rename or enumerate its keys. `reply_count` counts messages
beyond the root (`messages_count` 4 -> `reply_count` 3). `author_contact` stays null (PII
policy pending) and raw platform payloads are never written into the file.

````markdown
# Ticket #88213307 — Re: Order 4821 arrived with the wrong size

**Platform:** Gorgias  
**Date:** 2026-07-18  
**Status:** Closed  
**Channel:** Email  
**Customer:** Priya S.  
**Category:** Order issue  
**Detail:** Wrong size shipped  
**Customer tier:** Repeat  
**Tags:** sizing, csat_excluded  
**Messages:** 4 (last activity 2026-07-19)  

---

### Priya S. (customer) — 2026-07-18 14:02

Hi - my order 4821 arrived today but it's a medium, I ordered a small. Can you swap it?

### Support (agent) — 2026-07-18 15:30

So sorry about that, Priya! I've set up a replacement in a small shipping out today -
keep or donate the medium, no return needed.

### Priya S. (customer) — 2026-07-19 10:02

That's amazing, thank you! You've made a customer for life.

### Support (agent) — 2026-07-19 10:44

So happy to hear it, Priya! Closing this out - reach back any time.

---

<details>
<summary>Metadata (unified VoC record)</summary>

```yaml
source_platform: gorgias_oauth
source_type: support_conversation
external_id: "88213307"
created_at: "2026-07-18T14:02:11Z"
title: "Order 4821 arrived with the wrong size"
author_name: "Priya S."
author_contact: null
reply_count: 3
parent_ref: null
source_url: "https://example.gorgias.com/app/ticket/88213307"
rating: null
product_ref: null
verified: null
status: "closed"
channel: "email"
tags:
  - "sizing"
  - "csat_excluded"
updated_at: "2026-07-19T10:44:03Z"
custom:
  Category: "Order issue"
  Detail: "Wrong size shipped"
  Customer tier: "Repeat"
reactions_total: null
```

</details>
````

Notes:

- For Intercom, `rating` carries the CSAT (`conversation_rating`) when present - add a
  `**CSAT:**` label to the header when it is populated.
- Support tickets live over time: re-pulls overwrite the ticket file with the fresher
  `updated_at`, header, and any new messages.
