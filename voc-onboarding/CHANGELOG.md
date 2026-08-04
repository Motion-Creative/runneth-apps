# Changelog

## v1 (August 2026)

Initial release: the Voice of Customer half of `meta-and-voc-onboarding`, extracted as-is
at parent commit `bce9619` and isolated from the Meta onboarding work.

- **Fully human-triggered lifecycle.** Install stages files and announces the trigger
  phrase — nothing else runs at install time. "Run voice of customer onboarding" invokes
  the new `voc-onboarding-walkthrough` skill, which owns the whole sequence: workspace
  resolution from the conversation's own Motion context, VoC reachability probes (OAuth +
  stored keys + Meta connection), human-confirmed account pinning, one daily
  `voc-sync-<workspace>-<platform>` routine per reachable platform with the first run
  kicked, then — once data lands — the per-integration Voice of Customer summary and the
  explained audit offer (method preview, additions and reference docs invited).
- **No guards, no roster, no `/agent/user.md` writes.** Because nothing self-fires, the
  package needs no activation gate: idempotency comes from routine existence and files on
  disk, per the voc-data-pull skill's resume rules.
- **`voc-data-pull` and `voc-audit` copied verbatim** from the parent snapshot, including
  the Meta ad-comments integration (one file per creative under `voc/meta-ad-comments/`,
  `motion meta creative-comments`), the audit's numbered standalone findings with verbatim
  attributed quotes inline and explicit no-signal lines, and the reference-docs intake.
  One substitution in `voc-data-pull/SKILL.md`: the setup trigger names this package's
  walkthrough instead of the parent's install. The full substitutions list lives in the
  README's "Provenance and divergence" section.
