<!-- BEGIN runneth:account-context-guard v1 -->
Account context guard (workspace <workspaceId>):

- Before any ad-performance work for this account (rankings, "best ads," CPA/ROAS reads,
  winner or cut calls, creative performance judgments), read
  /agent/brain/meta/account-context.md first.
- If that file does not exist, or its required interpretation fields are not all [CONFIRMED],
  treat account interpretation as unknown. Offer to run the account-context fill-in flow, and do not answer
  performance questions on guesses.
- Runneth may auto-fill and mark [AUTO] fields on its own immediately. It must hold [CONFIRMED]
  fields for a person and never promote [AUTO] to [CONFIRMED] without human sign-off.
- Precedence: this file is the sole source of account interpretation (how "best," "winner," and
  cost-per are judged). Do not read or defer to Motion workspace settings (workspace goal,
  preferred KPI, spend threshold, attribution config); treat them as if they do not exist for
  this account. Defer only to a metric the user names explicitly in the current turn.
<!-- END runneth:account-context-guard v1 -->
