# Template: support conversation file

Path: `/agent/brain/data-sources/<platform>/daily/<pull-date>/ticket-<external_id>.md`
(the Ramy Brook Gorgias precedent - metadata top, full conversation below).

Every frontmatter field is always present; `null` when the source lacks the concept.
`custom` passes platform custom fields through as-is (Gorgias `custom_fields`, Intercom
`custom_attributes`) - this is where org-specific headers like Category / Detail /
Customer tier come from. Do not rename or enumerate its keys.

````markdown
---
source_platform: gorgias_oauth
source_type: support_conversation
external_id: "88213307"
created_at: "2026-07-18T14:02:11Z"
title: "Order 4821 arrived with the wrong size"
author_name: "Priya S."
author_contact: null
reply_count: 4
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
---

## Content

### Priya S. (customer) - 2026-07-18T14:02:11Z

Hi - my order 4821 arrived today but it's a medium, I ordered a small. Can you swap it?

### Support (agent) - 2026-07-18T15:30:47Z

So sorry about that, Priya! I've set up a replacement in a small shipping out today -
keep or donate the medium, no return needed.

### Priya S. (customer) - 2026-07-19T10:44:03Z

That's amazing, thank you! You've made a customer for life.

## Raw payload

```json
{
  "id": 88213307,
  "status": "closed",
  "channel": "email",
  "via": "email",
  "customer": { "id": 5512, "email": "priya@example.com", "name": "Priya S." },
  "subject": "Order 4821 arrived with the wrong size",
  "tags": [{ "name": "sizing" }, { "name": "csat_excluded" }],
  "messages_count": 4,
  "created_datetime": "2026-07-18T14:02:11Z",
  "updated_datetime": "2026-07-19T10:44:03Z",
  "custom_fields": {
    "Category": "Order issue",
    "Detail": "Wrong size shipped",
    "Customer tier": "Repeat"
  }
}
```
````

Notes:

- For Intercom, `rating` carries the CSAT (`conversation_rating`) when present - it is the
  one support field that maps into the review group.
- Support tickets live over time: re-pulls overwrite the ticket file with the fresher
  `updated_at` and any new messages.
