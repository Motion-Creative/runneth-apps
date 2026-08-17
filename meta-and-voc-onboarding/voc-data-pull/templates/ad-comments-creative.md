# Template: Meta ad-comments file (one per creative)

Path: `/agent/brain/<brand>/integrations/voice-of-customer/meta-ad-comments/creative-<creative_asset_id>.md`

Layout: H1 headline, bold-label human header (two trailing spaces end every label line),
every comment on the creative between `---` rules - one `###` section per comment, newest
root first, each reply directly under its parent - then the collapsed metadata block.

The creative is the unit: a sync run that pulls comments for a creative regenerates this
file whole (full comment set, updated totals and engagement), never appends. Comment text
lives only in the body sections; the metadata block carries one entry per comment without
the text. `author_contact` stays null (PII policy pending). Raw platform payloads are never
written into the file.

````markdown
# Ad comments - creative 120212345678901234

**Creative asset id:** 120212345678901234  
**Preview file URL:** —  
**Ad name:** UGC-hiking-testimonial-v3  
**Total comments:** 2  
**Newest comment:** 2026-07-15  

---

### jess.outdoors - 2026-07-15 (41 reactions, 1 reply)

Bought this after seeing the ad three times. It actually holds up on long hikes - wish I'd
found it years ago.

### trailco - 2026-07-15 (in reply to jess.outdoors, 3 reactions)

That's what we love to hear - happy hiking!

---

<details>
<summary>Metadata (per-creative ad-comments record)</summary>

```yaml
source_platform: meta-ad-comments
source_type: ad_comments
creative_asset_id: "120212345678901234"
preview_file_url: null
comment_count: 2
newest_comment_at: "2026-07-15T18:40:12Z"
oldest_comment_at: "2026-07-15T18:22:05Z"
custom:
  ad_name: "UGC-hiking-testimonial-v3"
comments:
  - id: "17912345678901234"
    created_at: "2026-07-15T18:22:05Z"
    author_name: "jess.outdoors"
    author_contact: null
    platform: instagram
    reactions_total: 41
    reply_count: 1
    parent_ref: null
  - id: "17912345678905678"
    created_at: "2026-07-15T18:40:12Z"
    author_name: "trailco"
    author_contact: null
    platform: instagram
    reactions_total: 3
    reply_count: 0
    parent_ref: "17912345678901234"
```

</details>
````

Field names map 1:1 from the pull's payload (the recipe in
`references/platform-recipes.md` spells out the mapping): `preview_file_url` is the
payload's `previewFileUrl` - the only URL it carries, a creative preview link, not a post
permalink. Every other group-level field the payload returns (`adName`, the
coverage-reported cached total when it exceeds `comment_count`) rides in `custom` -
capture everything the tool gives, invent nothing.
