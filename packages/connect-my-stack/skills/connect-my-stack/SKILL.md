---
name: connect-my-stack
description: |
  Scans a customer's website to detect their tech stack, then guides them through
  connecting each tool to Runneth one at a time. Use when a customer shares a
  website URL and asks to scan it, identify their tools, connect their integrations,
  or set up their stack. Also triggers on "connect my stack", "scan my site",
  "what tools am I running", "set up my integrations", "help me connect", or when
  a URL is shared with clear intent to onboard integrations.
  Triggers: "scan my site", "connect my stack", "what tools am I running", "help me connect them to Runneth", "set up my integrations", "scan my website"
user-invocable: false
---

# Connect My Stack

A guided integration onboarding flow. The customer drops a URL, Runneth scans
their site, confirms what it found, checks what is already connected, and walks
them through connecting the rest one at a time. The customer never sees how
connections work under the hood.

## References

- Tech stack scanner: `/agent/.agents/skills/tech-stack-scanner/SKILL.md`
- Integrations CLI (connection status, connectable-app lookup, registration): `/runneth/skills/integrations-cli/SKILL.md`
- Secret collection (secure key input, never in chat): `/runneth/skills/secret-collection/SKILL.md`

## Language Rules

These apply to every customer-facing message in this flow.

- Speak to a marketer, not a developer. Use everyday language.
- Never use these terms in customer-facing copy: OAuth, Pipedream, API key, secret, token, credential, webhook, client ID, integration type.
- Never show credential key names, internal IDs, account email addresses, or connection tier labels.
- If you need to describe how a connection works, say "connect [tool] to Runneth" or "link your [tool] account." Nothing more technical than that.
- Group tools by what they do for the customer (ads, email, reviews, analytics, support, scheduling), never by how they connect.
- A scan is a fingerprint, not proof. If something is uncertain, say "I think I spotted [tool]" rather than asserting it as fact. Confirm before connecting.

## Step 1: Get the URL

Extract the website URL from the customer's message. If no URL is present, ask
for one. Accept a bare domain or full URL.

## Step 2: Scan the Site

Run the tech stack scanner on the domain. Follow the scanner skill's Phase 0
through Phase 2: attempt browser capture first, fall back to fetch capture if
the browser is unavailable, then run detection.

**Engine check (required).** Before scanning, confirm the scanner's engine files
exist at `/agent/.agents/skills/tech-stack-scanner/lib/` (`fetch-capture.mjs`,
`detect.mjs`, `signatures.json`). If they are missing, STOP. Do not improvise a
replacement scanner inline. Tell the customer you hit a setup issue on your side
and cannot complete the scan reliably right now, and flag it for the team. A
silently rebuilt scanner produces inconsistent detection and is not acceptable
for this flow.

From the scan result, collect:
- Confirmed technologies (high confidence matches)
- Likely technologies (HTML-only matches, treat as "I think I spotted")
- Recognized unmatched third-party hosts (name the tool, flag as observed)
- The full unmatched host list (your lead for tools the signature library does not cover yet)

## Step 3: Present Findings for Confirmation (then stop)

Present the detected tools in a simple, scannable list grouped by what they do.
Use plain labels:

- "Ad platforms" (Meta, TikTok, Google Ads, LinkedIn, etc.)
- "Email or SMS" (Klaviyo, Postscript, etc.)
- "Reviews" (Trustpilot, Yotpo, Judge.me, etc.)
- "Analytics" (GA4, Hotjar, Plausible, etc.)
- "Support or chat" (Gorgias, Intercom, etc.)
- "Scheduling" (Calendly, etc.)
- "Ecommerce" (Shopify, WooCommerce, etc.)
- "Design or assets" (Figma, Frame.io, etc.)
- "CRM" (HubSpot, Salesforce, etc.)
- "Anything else"

For each tool, use a natural confidence level in plain language:
- High confidence: just name it. "Klaviyo for email"
- Lower confidence: "I think I spotted [tool]" or "I'm seeing signs of [tool]"

Then ask the customer to confirm:
"Does this look right? Correct me on anything I got wrong, and add any tools
I missed. Think about the platforms you log into every day, even if they are
not on your website."

STOP here and wait for their reply. Do not preview what is connected, do not
list what is ready to connect, and do not suggest a first connection in this
message. This message does one job: confirm the list. Everything else comes
after they respond. One decision at a time.

## Step 4: Check What Is Already Connected

Only after the customer confirms the list, check whether each confirmed tool is
already connected to Runneth.

For native integrations (Slack, Google, Notion, GitHub), use the relevant CLI
doctor or status commands to verify connection state.

For connected apps, use `integrations status --app <app>` and
`integrations accounts --app <app>` to check whether an active account exists.

For key-based tools, check whether a stored secret matching that service already
exists.

**Never claim a tool cannot be connected without checking first.** Before telling
a customer any tool has "no connection path," verify it against the live list of
connectable apps (`integrations list --with-creative-strategy --query <tool>`).
If it is connectable, it goes in the "Ready to connect" group. Only say a tool
has no path after the live check actually comes back empty. Do not decide this
from memory.

Ad platforms (Meta, TikTok, Google Ads, LinkedIn Ads) are not part of this
connection flow. Their ad performance data is connected through Motion's data
source settings, not through Runneth's integration system. Do not include them
in the "Ready to connect" group and do not attempt a connection flow for them.
If the customer asks about connecting their ad platforms, say briefly: "Your ad
platforms like Meta and TikTok are connected through Motion directly, in your
data source settings. I can work with that ad data once it is set up there." Do
not proactively call this out unless the customer asks.

Present the results in two groups:
- "Already connected" with a one-line confirmation for each. Do not ask the
  customer to reconnect anything that is working.
- "Ready to connect" for everything else that passed the connectable check
  (excluding ad platforms).

## Step 5: Guide Connections One at a Time

For each tool in the "Ready to connect" group, guide the customer through
connecting it. Work through them one at a time. Silently follow this priority
order when choosing which to offer next:

1. Native OAuth integrations (Slack, Google, Notion, GitHub)
2. Pipedream connected apps
3. API key or secret-based tools
4. Custom or manual setup

Never name these tiers to the customer. Just present the next tool and guide
them through it. The customer should never think about what kind of connection
it is.

For each tool:

**Before offering the connect:**
- Look up its real connection requirements using the integrations CLI
  (`integrations list --with-creative-strategy --query <app>`). Know what the
  setup needs (credentials, account identifier) so you can guide accurately,
  but do not expose those requirements as technical terms. Translate them to
  plain steps: "I'll need you to sign in to your [tool] account" or "I'll need
  a small piece of info from your [tool] settings page."
- Check the integrations CLI skill for exact status, account selection, and
  registration steps.

**Presenting the connect:**
- Say what the tool is and ask if they want to connect it now.
- Present the appropriate connect action for the surface. For native OAuth,
  use the oauth-connect surface affordance. For Pipedream apps, use the
  Pipedream connect affordance. For API-key tools, use secure secret input.
- Never ask the customer to paste a key, token, or secret into chat. Always
  use the active surface's secure collection.
- Guide in plain language: where to go, what to click, what to expect.

**After a successful connection:**
1. Confirm it connected in one short line.
2. Ask how they use that tool at their company. One natural question, casual
   tone. Examples:
   - "How are you using Klaviyo today? Mainly lifecycle flows, campaign blasts,
     or both?"
   - "What is your team using Figma for? Creative review, ad mockups, or
     broader design work?"
3. Based on their answer, give a brief, casual explanation of what Runneth can
   now do with that connection. Frame it like a teammate who just unlocked
   something:
   - "Nice. Now that Klaviyo is connected, I can pull your lifecycle language
     and customer signal to help write hooks and angles that match how you
     actually talk to your audience."
   - "Cool, Figma is in. I can pull design files and creative assets when
     reviewing ads or building briefs, so you do not have to screenshot things
     into chat."
   Keep it to one or two sentences. Specific, not generic.

**After a failed connection:**
- Say it did not go through in plain language. Do not expose error details,
  status codes, or technical diagnostics.
- Offer two paths: try again right now (with one simple suggestion like
  "make sure you are signed in to the right account"), or park it and move
  on to the next tool.
- If they choose to park it, note it and continue with the rest of the
  flow. Do not let a failed connection block the rest of the onboarding.
- Circle back to all parked tools at the end of the flow, before closing.
  Offer one more attempt or suggest they try it later.

**Between connections:**
- After finishing one tool (connected or skipped), move to the next one in the
  silent priority order. Ask "Want to keep going with [next tool]?" Keep the
  momentum without rushing.

## Step 6: Close

After all connections are done (or the customer wants to stop):

1. Summarize what is connected now in a short list.
2. List anything still pending (including anything parked from a failed
   connection) in a separate short list. Offer to circle back to those now
   or next time.
3. Give a brief orientation on what they can do from here:
   - Tell them they can ask about any connected tool anytime: "You can ask
     me what I can do with any tool you have connected, whenever you want."
   - Tell them how to connect more tools later: "To connect more tools in
     the future, either use the integrations page in Motion or just start a
     chat and ask me to help you connect something."
4. Suggest one or two concrete first things they can ask Runneth to do with
   their new connections. Make these specific to what was connected, not
   generic. Example: "Now that Klaviyo and Trustpilot are connected, I can
   pull your review language and turn it into hook variants for your next
   Meta ad test. Want me to start with that?"

Keep the close short. Do not dump a long summary or repeat what was already
said during the flow.

## Constraints

- Never expose connection mechanics (OAuth, Pipedream, API key, secret, token,
  credential, webhook, client ID) in customer-facing copy.
- Never show credential key names, internal IDs, or email addresses.
- Never ask for secrets in chat. Always use secure collection.
- Never claim a tool has no connection path without checking the live list of
  connectable apps first.
- If the scanner engine files are missing, stop and flag it. Never rebuild a
  replacement scanner inline.
- Confirm the detected list first (Step 3) and stop. Do not reveal connection
  status or suggest a connect in the same message as the confirmation ask.
- One integration at a time. Never present multiple connect actions at once.
- Do not ask the customer to reconnect something that is already connected.
- Ad platforms (Meta, TikTok, Google Ads, LinkedIn Ads) are not part of this
  flow. Their data connects through Motion's data source settings, not Runneth.
  Do not attempt a connection flow for them. Mention this only if the customer
  asks.
- A failed connection should never block the rest of the onboarding. Park it
  and come back at the end.
- Keep every message short. The customer is onboarding, not reading a manual.
- If the scanner ran in fetch mode (no browser), the detection may miss
  runtime-injected tags. Handle this gracefully: the open-ended "did I miss
  anything?" ask in Step 3 is the safety net. Do not explain fetch mode to
  the customer.
