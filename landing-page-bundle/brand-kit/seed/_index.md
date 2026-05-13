# Brand Kits — Local Index

This is the local routing index for brand kits saved under `/agent/brain/brand-kit/`. The user.md `runneth-apps:brand-kit:usage v1` instruction reads this file on every branded output to choose the right kit.

Sort: most-recently updated first.

Row format:

```
- {{Brand}} — `<slug>` — last updated {{ISO date}}
  - Source: {{landing pages used}} + computed DOM + screenshots
  - Confidence: {{high|medium|low}} for visual system; {{high|medium|low}} for voice
  - Markdown source of truth: /agent/brain/brand-kit/<slug>--brand-kit.md
  - HTML deliverable: ./artifacts/<slug>--brand-kit.html
  - History: /agent/brain/brand-kit/_history/<slug>/
  - One-line voice: {{e.g. "Confident, conversational, never corporate. Short imperative headlines."}}
  - Primary CTA color: {{hex}}
  - Type pairing: {{e.g. "Inter / Inter"}}
```

For per-brand history files see `/agent/brain/brand-kit/_history/<slug>/`.

---

(No brand kits built yet.)
