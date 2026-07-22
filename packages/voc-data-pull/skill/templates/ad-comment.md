# Template: ad comment file

Path: `/agent/brain/data-sources/voc/meta-ads/comment-<external_id>.md`

Layout: H1 headline, bold-label human header (two trailing spaces end every label line),
the comment text between `---` rules, then the collapsed metadata block.

Every metadata field is always present; `null` when the source lacks the concept. Replies
are **their own files**, not nested blobs: a reply file sets `parent_ref` to the parent
comment's `external_id` and adds an `**In reply to:**` header label. Root comments have
`parent_ref: null`. Raw platform payloads are never written into the file.

````markdown
# Ad comment #17912345678901234

**Platform:** Instagram  
**Author:** jess.outdoors  
**Date:** 2026-07-15  
**Reactions:** 41  
**Replies:** 2  

---

Bought this after seeing the ad three times. It actually holds up on long hikes - wish I'd
found it years ago.

---

<details>
<summary>Metadata (unified VoC record)</summary>

```yaml
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
```

</details>
````

A reply to that comment is a separate file (`comment-<reply_id>.md`) with
`parent_ref: "17912345678901234"`, an `**In reply to:** #17912345678901234` header label,
its own `reactions_total`, and `reply_count: 0` unless the platform reports nested replies.
