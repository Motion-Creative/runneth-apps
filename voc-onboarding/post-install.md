# Post-install: announce and wait

Installing the voc-onboarding package stages files and does nothing else. There is no
install-time sequence: no reachability checks, no routines, no pulls, no writes to
`/agent/user.md`, no workspace resolution. Everything runs later, when a person asks.

When this package's files land, close the installing turn with exactly this:

> voc-onboarding - installed
>
> Say "run voice of customer onboarding" whenever you're ready and I'll find your
> voice-of-customer integrations, set up the syncs, and take it from there.

Nothing follows that line. The trigger phrase (or any ask to begin, resume, or check on
Voice of Customer onboarding) invokes the `voc-onboarding-walkthrough` skill - that skill,
and only that skill, owns the sequence: workspace resolution, reachability, account
pinning, sync routine creation, the Voice of Customer summary, and the audit offer. The
audit itself (`voc-audit` skill) runs only on a person's yes to that offer or an explicit
request, and only after its data gate is met.

What lands where, once the walkthrough runs:

- Raw VoC items: `/agent/brain/<workspace>/data-sources/voc/<platform>/` (one file per
  item; Meta ad comments one file per creative under `voc/meta-ad-comments/`).
- The compiled audit (later, human-gated):
  `/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md`.

The README's "Install and run order" describes this same lifecycle for humans; this file,
`post-install.md`, is the executable version. If the two ever disagree, fix them together -
do not improvise.
