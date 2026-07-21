# Template: review file

Path: `/agent/brain/data-sources/<platform>/reviews/review-<external_id>.md`

Every frontmatter field is always present; `null` when the source lacks the concept.
`author_contact` stays `null` until the PII policy call is made (the raw payload still
carries source PII - that is part of the same pending policy call, see SKILL.md).
`source_url` comes only from the recipe's mapping - Judge.me's list payload has no
permalink, so it is null here.

````markdown
---
source_platform: judge_me
source_type: review
external_id: "31274522"
created_at: "2026-06-14T09:12:44Z"
title: "Finally something that works"
author_name: "Dana M."
author_contact: null
reply_count: 0
parent_ref: null
source_url: null
rating: 5
product_ref: "8641242349791"
verified: true
status: null
channel: null
tags: null
updated_at: null
custom: null
reactions_total: null
---

## Content

Finally something that works. I'd given up on strapless options entirely until a friend
recommended this - wore it for a full wedding day and forgot I had it on.

## Raw payload

```json
{
  "id": 31274522,
  "rating": 5,
  "title": "Finally something that works",
  "body": "Finally something that works. I'd given up on strapless options entirely...",
  "product_external_id": 8641242349791,
  "reviewer": { "name": "Dana M.", "email": "dana@example.com" },
  "created_at": "2026-06-14T09:12:44Z",
  "verified": "buyer",
  "pictures": []
}
```
````
