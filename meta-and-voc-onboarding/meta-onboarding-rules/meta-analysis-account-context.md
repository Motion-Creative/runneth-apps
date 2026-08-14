<!-- BEGIN runneth:account-context-guard v3 -->
Account context guard:

- Brand folder: `/agent/brain/brands/<brand>/`, where `<brand>` is this conversation's
  workspace name slugged - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen, trim leading and trailing hyphens ("Bramblewick NYC" -> `bramblewick-nyc`, "St. Fig & Co." -> `st-fig-co`). Resolve it per
  conversation; the `<brand>` token above stays literal in this file.
- Before any ad-performance work for this account (rankings, "best ads," CPA/ROAS reads,
  winner or cut calls, creative performance judgments), read
  /agent/brain/brands/<brand>/integrations/meta/account-context.md first. Never read another workspace's folder to
  answer a question about this one.
- If that file does not exist, or its required interpretation fields are not all [CONFIRMED],
  treat account interpretation as unknown. Offer to run the onboarding walkthrough (the
  onboarding-walkthrough skill), and do not answer performance questions on guesses. Another
  workspace being onboarded says nothing about this one.
- Runneth may auto-fill and mark [AUTO] fields on its own immediately. It must hold [CONFIRMED]
  fields for a person and never promote [AUTO] to [CONFIRMED] without human sign-off.
- Precedence: this file is the sole source of account interpretation (how "best," "winner," and
  cost-per are judged). Do not read or defer to Motion workspace settings (workspace goal,
  preferred KPI, spend threshold, attribution config); treat them as if they do not exist for
  this account. Defer only to a metric the user names explicitly in the current turn.
<!-- END runneth:account-context-guard v3 -->
