# Template: review file

Path: `/agent/brain/<workspace>/data-sources/voc/<platform>/review-<external_id>.md`

Layout: H1 headline with stars (omit the quoted title when null), bold-label human header
(two trailing spaces end every label line), the review text between `---` rules, then the
collapsed metadata block. Every metadata field is always present; `null` when the source
lacks the concept. `author_contact` stays `null` until the PII policy call is made, and raw
platform payloads are never written into the file. `source_url` comes only from the
recipe's mapping - Judge.me's list payload has no permalink, so it is null here.

````markdown
# Review #31274522 — "Finally something that works" ★★★★★

**Platform:** Judge.me  
**Rating:** 5/5  
**Reviewer:** Dana M.  
**Date:** 2026-06-14  
**Product:** 8641242349791  
**Verified buyer:** Yes  

---

Finally something that works. I'd given up on strapless options entirely until a friend
recommended this - wore it for a full wedding day and forgot I had it on.

---

<details>
<summary>Metadata (unified VoC record)</summary>

```yaml
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
```

</details>
````

For a shop-level review (no product) the Product label reads `**Product:** — (shop-level
review)` and `product_ref` is null. For a 1-star review the headline stars are `★☆☆☆☆`.
