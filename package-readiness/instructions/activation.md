# Package Readiness activation

Package installation only stages the evaluator, contract schema, and this
instruction. It does not authorize a scan, routine creation, state persistence,
or relay publication.

Apply this instruction only when a person explicitly installs, reinstalls, or
asks to configure `package-readiness`. Do not interrupt ordinary conversations
or automatic package updates with a readiness offer.

On an explicit install or configuration request, explain:

> Package Readiness is installed. A scan reads only the status metadata named by
> packages that explicitly opt in, then sends stage and reason codes to the
> existing package-state relay. Packages without a readiness contract are
> ignored. Would you like me to run the first scan and create one hourly
> script-only readiness routine?

Offer at most once in that conversation. Do nothing unless the person explicitly
agrees.

After approval, first check whether the local package CLI exposes the
agent-builder readiness runner. If it does not, say that this VM does not yet
have readiness runtime support and stop without creating a routine or writing
state. Never work around missing runtime support by editing `/agent/.runtime` or
`/agent/.runneth` directly.

When the runner is available:

1. Run one readiness scan through that runner. The runner owns workspace
   inventory, current installation binding, persistence, and relay publication.
2. List routines and look for the exact active name `package-readiness-hourly`.
3. If it already exists, do not create another.
4. Otherwise create one hourly script-mode routine with that exact name. Its
   script invokes only the readiness runner in publish mode. It sends no
   conversation, Slack, or email delivery.
5. Report only whether the scan published and whether the routine was created,
   already present, or unavailable. Do not surface file contents or assertion
   values.
