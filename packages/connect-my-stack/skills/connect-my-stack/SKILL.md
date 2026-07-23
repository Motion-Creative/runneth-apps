---
name: connect-my-stack
description: |
  THE onboarding flow for a customer connecting their own tools to Runneth. A customer
  shares their website URL and wants to see their stack and connect it. This skill owns
  that intent and internally calls the tech-stack-scanner engine to do the detection.
  Use this (not tech-stack-scanner) whenever the customer is talking about their OWN
  site and connecting their OWN tools. Trigger on: "connect my stack", "scan my site",
  "scan my website", "what tools am I running", "set up my integrations", "help me
  connect", "help me connect them to Runneth", "connect my tools", or a URL shared with
  intent to onboard or connect integrations. If the request is about a competitor's or
  prospect's stack instead, that is tech-stack-scanner, not this.
  Triggers: "connect my stack", "scan my site", "scan my website", "what tools am I running", "set up my integrations", "help me connect them to Runneth", "connect my tools"
user-invocable: false
---

# Connect My Stack

A guided integration onboarding flow. The customer drops a URL, Runneth scans
their site, confirms what it found, checks what is already connected, and walks
them through connecting the rest one at a time. The customer never sees how
connections work under the hood.

**This skill owns the customer's own-stack onboarding intent.** It uses the
tech-stack-scanner as an engine (Step 2), but this flow governs the whole
interaction. Do not hand the turn to the raw scanner; its raw output is not the
customer-facing answer.

## Non-negotiables (read first)

1. **Confirm before connecting.** Present the detected list, ask what is right and
   what is missing, then STOP and wait. Never reveal connection status or start a
   connection in the same message as the detected list.
2. **One connection at a time.** Never present more than one connect action or
   widget in a single message. One tool, one action, wait for the result.
3. **Never expose scan mechanics.** Do not mention fetch mode, headless browser,
   Playwright, HTML pattern matches, network calls, confidence internals, or any
   scan plumbing to the customer. Ever.
4. **Marketer language only.** No technical or connection-mechanism terms (see
   Language Rules). Ad platforms are "Meta ads", "TikTok ads", never "Pixel".

## References

- Tech stack scanner (engine this flow calls): `/agent/.agents/skills/tech-stack-scanner/SKILL.md`
- Integrations CLI (connection status, connectable-app lookup, registration): `/runneth/skills/integrations-cli/SKILL.md`
- Secret collection (secure key input, never in chat): `/runneth/skills/secret-collection/SKILL.md`

## Language Rules

These apply to every customer-facing message in this flow.

- Speak to a marketer, not a developer. Use everyday language.
- Never use these terms in customer-facing copy: OAuth, Pipedream, API key, secret, token, credential, webhook, client ID, integration type, fetch mode, headless browser, HTML, network request, pixel, tag, insight tag.
- Never show credential key names, internal IDs, account email addresses, connection tier labels, or the scanner's raw category names.
- Name ad platforms the way marketers say them: "Meta ads", "TikTok ads", "Google ads", "LinkedIn ads". Never "Meta Pixel", "TikTok Pixel", "LinkedIn Insight Tag".
- If you need to describe how a connection works, say "connect [tool] to Runneth" or "link your [tool] account." Nothing more technical than that.
- A scan is a fingerprint, not proof. If something is uncertain, say "I think I spotted [tool]" rather than asserting it as fact. Confirm before connecting.

## Step 1: Get the URL

Extract the website URL from the customer's message. If no URL is present, ask
for one. Accept a bare domain or full URL.

## Step 2: Scan the Site (silently)

Run the tech stack scanner on the domain. Follow the scanner skill's Phase 0
through Phase 2: attempt browser capture first, fall back to fetch capture if
the browser is unavailable, then run detection **in customer mode** by passing
`--customer` to `detect.mjs`. Customer mode returns Runneth's canonical
categories and ads-language names already (for example "Meta ads", not "Meta
Pixel") and drops infra noise into "Other". Present its groupings and tool names
as returned. Do not relabel them or reach back for the raw scanner categories.

**Engine check (required).** Before scanning, confirm the scanner's engine files
exist at `/agent/.agents/skills/tech-stack-scanner/lib/` (`fetch-capture.mjs`,
`detect.mjs`, `signatures.json`). If they are missing, STOP, tell the customer
you hit a setup issue on your side, and flag it for the team. Never improvise a
replacement scanner inline.

Do all of this silently. Do not narrate the scan or how it ran. If the scan was
limited in any way, do not explain the mechanism to the customer.

## Step 3: Present Findings for Confirmation (then STOP)

Present the detected tools as a simple, scannable list grouped under the
customer-mode categories (Voice of customer, Email & SMS, Paid channels, etc.).
Use the customer's language for every tool.

**Ad platforms:**
- **Meta and TikTok** are not connected here; their ad data comes through Motion
  directly (see Step 4). At most, one optional plain-language aside: "I can also
  see you're running Meta ads and TikTok ads. That data comes through Motion
  directly, so there's nothing to connect here." Never call them pixels.
- **Google ads and LinkedIn ads** are connectable; include them under "Paid
  channels" in ads language.

For each tool, use natural confidence language: name it if confident, or "I think
I spotted [tool]" if not.

Then ask the customer to confirm, and STOP:
"Does this look right? Correct me on anything I got wrong, and add any tools I
missed. Think about the platforms you log into every day, even if they are not on
your website."

**Hard stop.** This message does exactly one job: show the detected list and ask
for confirmation. Do NOT in this message: check connections, list what is already
connected, list what is ready to connect, present a widget, or suggest a first
connection. All of that waits until the customer replies. One decision at a time.

## Step 4: Check What Is Already Connected

Only after the customer confirms the list, check connection status for each tool.

**Use the right check per tool. This matters, getting it wrong reports a
connected tool as not connected:**
- **Native integrations (Slack, Google, Notion, GitHub):** check with their own
  tooling (for example `slack memberships list` / `slack membership check`,
  `google doctor`, the Notion and GitHub CLIs). NEVER check these with
  `integrations status --app <slack|google|notion|github>`, that path errors on
  native integrations and will make a connected tool look disconnected.
- **Connected apps (Pipedream):** use `integrations status --app <app>` and
  `integrations accounts --app <app>`.
- **Key-based tools:** check whether a stored secret for that service exists.

**Never claim a tool cannot be connected without checking the live connectable
list first** (`integrations list --with-creative-strategy --query <tool>`). If it
is connectable, it belongs in "Ready to connect". Only say a tool has no path
after that check comes back empty.

**Meta ads and TikTok ads** are not part of this flow; their data connects through
Motion's data source settings. Do not put them in "Ready to connect". Google ads
and LinkedIn ads are connectable and are treated as normal tools.

Present two short groups: "Already connected" (one line each, do not ask them to
reconnect anything working) and "Ready to connect" (everything else that passed
the connectable check, excluding Meta/TikTok ads).

## Step 5: Guide Connections One at a Time

Work through the "Ready to connect" tools one at a time. Silently follow this
priority order when choosing which to offer next, and never name these tiers:

1. Native OAuth integrations (Slack, Google, Notion, GitHub)
2. Pipedream connected apps
3. API key or secret-based tools
4. Custom or manual setup

**One tool, one message, one connect action.** Never present two connect actions
or two widgets at once. Offer the next tool, present its single connect action,
and wait for the result before moving on.

For each tool:

**Before offering the connect:** look up its real requirements with the
integrations CLI (`integrations list --with-creative-strategy --query <app>`) so
you guide accurately, but translate to plain steps ("I'll need you to sign in to
your [tool] account"). Never expose credential mechanics.

**Presenting the connect:** say what the tool is, ask if they want to connect it
now, and present the single appropriate connect action for the surface (native
OAuth connect, Pipedream connect, or secure secret input). Never ask the customer
to paste a key or secret into chat.

**After a successful connection:**
1. Confirm it in one short line.
2. Ask how they use that tool at their company (one natural, casual question).
3. Based on their answer, give a brief, casual "here's what that unlocks" note,
   one or two sentences, specific not generic.

**After a failed connection:** say it did not go through in plain language (no
error details). Offer to try again or park it and move on. Never let a failure
block the rest. Circle back to parked tools at the end before closing.

**Between connections:** move to the next tool in the silent priority order. Ask
"Want to keep going with [next tool]?" Keep momentum without rushing.

## Step 6: Close

1. Summarize what is connected now in a short list.
2. List anything still pending (including parked failures); offer to revisit now
   or next time.
3. Orient them: they can ask what Runneth can do with any connected tool anytime,
   and they can connect more later via the integrations page in Motion or by just
   asking in a chat.
4. Suggest one or two concrete first things to try with what was connected,
   specific to their tools.

Keep the close short.

## Constraints

- Confirm the detected list first (Step 3) and STOP. Never reveal connection
  status, list ready-to-connect, or present a widget in the confirmation message.
- One connection action / widget per message. Never batch multiple connects.
- Never expose scan mechanics (fetch mode, headless browser, HTML matching,
  network calls, confidence internals) or connection mechanics (OAuth, Pipedream,
  API key, secret, token) to the customer.
- Never show credential key names, internal IDs, email addresses, or the scanner's
  raw category names.
- Check native integrations (Slack, Google, Notion, GitHub) with their own tooling,
  never with `integrations status --app`. That wrong check is what reports a
  connected native tool as "not connected".
- Name ad platforms in ads language. Never "Pixel", "Insight Tag", or similar.
- Meta ads and TikTok ads are never a tool to connect here; at most one optional
  aside. Google ads and LinkedIn ads are connectable.
- Never ask for secrets in chat. Always use secure collection.
- Never claim a tool has no connection path without checking the live connectable
  list first.
- If the scanner engine files are missing, stop and flag it. Never rebuild a
  replacement scanner inline.
- Do not ask the customer to reconnect something already connected.
- Keep every message short. The customer is onboarding, not reading a manual.
