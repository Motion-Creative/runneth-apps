# Template: ad comment file

Path: `/agent/brain/data-sources/meta-ads/comments/comment-<external_id>.md`

Every frontmatter field is always present; `null` when the source lacks the concept.
Replies are **their own files**, not nested blobs: a reply file sets `parent_ref` to the
parent comment's `external_id`. Root comments have `parent_ref: null`.

Root comment example:

````markdown
---
source_platform: meta-ads
source_type: ad_comment
external_id: "17912345678901234"
created_at: "2026-07-15T18:22:05Z"
title: null
author_name: "jess.outdoors"
author_contact: null
reply_count: 2
parent_ref: null
source_url: null
rating: null
product_ref: null
verified: null
status: null
channel: null
tags: null
updated_at: null
custom: null
reactions_total: 41
---

## Content

Bought this after seeing the ad three times. It actually holds up on long hikes - wish I'd
found it years ago.

## Raw payload

```json
{
  "id": "17912345678901234",
  "text": "Bought this after seeing the ad three times. It actually holds up on long hikes - wish I'd found it years ago.",
  "authorName": "jess.outdoors",
  "createdAt": "2026-07-15T18:22:05Z",
  "platform": "instagram",
  "reactions": { "like": 38, "love": 3, "total": 41 },
  "replyCount": 2,
  "adId": "120211234567890123"
}
```
````

A reply to that comment is a separate file (`comment-<reply_id>.md`) with
`parent_ref: "17912345678901234"`, its own `reactions_total`, and `reply_count: 0` unless
the platform reports nested replies.
