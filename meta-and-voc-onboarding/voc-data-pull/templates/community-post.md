# Template: community post file (Reddit)

Paths: `/agent/brain/<workspace>/data-sources/voc/reddit/post-<external_id>.md` for posts,
`/agent/brain/<workspace>/data-sources/voc/reddit/comment-<external_id>.md` for pulled comments
(each comment is its own file with `parent_ref` set - never nested blobs).

Every metadata field is always present; `null` when the source lacks the concept. The
subreddit rides in `custom`. `author_name` is the Reddit username; `author_contact` stays
null. Raw platform payloads are never written into the file.

````markdown
# Reddit post — "Anyone else's strapless actually stay up?"

**Subreddit:** r/braadvice  
**Author:** u/wardrobe_wins  
**Date:** 2026-07-10  
**Upvotes:** 214  
**Replies:** 37  

---

Serious question - I've bought four different strapless bras this year and every single
one slides by mid-afternoon. Saw an ad for one that claims it grips differently. Has
anyone actually found one that survives a full workday?

---

<details>
<summary>Metadata (unified VoC record)</summary>

```yaml
source_platform: reddit
source_type: community_post
external_id: "t3_1abcd2e"
created_at: "2026-07-10T16:41:22Z"
title: "Anyone else's strapless actually stay up?"
author_name: "wardrobe_wins"
author_contact: null
reply_count: 37
parent_ref: null
source_url: "https://www.reddit.com/r/braadvice/comments/1abcd2e/anyone_elses_strapless_actually_stay_up/"
rating: null
product_ref: null
verified: null
status: null
channel: null
tags: null
updated_at: null
custom:
  subreddit: "braadvice"
reactions_total: 214
```

</details>
````

A pulled reply is a separate file (`comment-<id>.md`) with `title: null`,
`parent_ref: "t3_1abcd2e"`, an `**In reply to:**` header label, its own `reactions_total`
(comment score), and the comment text as the body.
