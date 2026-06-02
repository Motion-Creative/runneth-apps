# brain-onboard

Customer-side use case that turns a brain package prepared by a Motion CSM
into a populated ten-domain org brain.

## Architecture

This is the customer-side half of a two-skill pair:

- **`prep-customer-brain`** (Motion-internal, CSM-side): runs in the CSM's
  Motion Runneth. Discovers what Motion already knows about the customer,
  audits what's wired vs missing, plans the harvest, executes Layer 1 pulls
  (HubSpot, Gong, Granola, Intercom, Stripe, BQ events) plus the narrow Layer
  2B slice that requires Motion's keys (Apollo for lens, X for public brand
  posts, AthenaHQ when applicable). Bundles outputs into two trees:
  `_runneth-package/<ts>/` (customer-facing) and `_internal-context/<ts>/`
  (CSM-side lens, never ships). Tars the customer-facing tree and pushes to
  whatever transport the CSM picks. Lives in Motion-internal infra, not here.
- **`brain-onboard`** (this use case): runs in the customer's Runneth. Reads
  the package the CSM uploaded, runs live workspace pulls (motion CLI),
  live web crawl, Apify scrapers (Reddit, Instagram, TikTok, etc.), and
  customer-wired integrations (Yotpo, Shopify, etc.), then synthesizes the
  ten brain domains with source citations.

## The principle

Everything in the customer brain is something the org has actively put into
the world: things they told us at signup, things they made public on their
own brand channels, things their customers wrote about them on public review
surfaces, and what their own Motion workspace data shows. No third-party
scraping of individuals, no curated competitor suggestions from outside
knowledge, no Motion-internal observations.

The CSM-side skill enforces this on the way out. The customer-side skill
enforces it on the way in.

## Trigger

Phrases like "build my brain," "run brain-onboard," "set up my Runneth from
the uploaded package," "synthesize the brain." Auto-detection of package
arrival is not implemented; the user invokes the skill explicitly.

## Files

- `SKILL.md` — the core skill, gets installed at
  `/agent/.agents/skills/brain-onboard/SKILL.md`
- `marketing.md` — customer-facing copy for the library UI
- `use-case.json` — registration metadata
- `install-config.json` — install conversation config
- `post-install-intro.md` — shown to the user immediately after install
- `seed/HOW-TO-USE.md` — plain-language guide that lands in the customer's
  brain folder

## Status

Experimental. v1.0.0 ships after the Printfresh pilot. Production-ready once
the engineering team ships it in the runneth-volume so it auto-installs in
every customer Runneth (instead of going through the per-install library
install flow).

## Companion docs

- The CSM-side `prep-customer-brain` skill (Motion-internal) is the pair to
  this one.
- The brand-agnostic CSM brief at
  `csm-brain-package-brief.html` walks through the conceptual model.
- The Aarke onboarding walkthrough deck at
  `runneth-onboarding-walkthrough.html` shows the customer experience.
