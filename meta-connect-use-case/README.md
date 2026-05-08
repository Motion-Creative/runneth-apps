# Meta Connect

Stage and publish ads to Meta directly from chat, with a persistent OAuth connection that auto-refreshes every 60 days.

Once installed, you can say things like "push these assets to Meta as a new ad set" or "stage these creatives in the Oren Bootcamp campaign" and Runneth handles the upload, creative creation, and ad structure — all as drafts for you to activate in Ads Manager.

**Install time:** ~5 minutes (includes one manual step in Facebook Developers)
**Requires:** Access to the Runneth-test Meta app in Facebook Developers

---

## Setup steps

Run these in order after installing the use case files.

### 1. Create the app

```bash
app create meta-connect
```

### 2. Copy source files

```bash
cp -r server/* /agent/apps/meta-connect/server/
cp -r frontend/* /agent/apps/meta-connect/frontend/
cp buildeth.app.json /agent/apps/meta-connect/buildeth.app.json
```

### 3. Build and verify

```bash
app build meta-connect
app verify meta-connect
```

### 4. Get the app URL and redirect URI

```bash
app list
echo $SPAWNETH_HOST
```

Your redirect URI will be: `https://{SPAWNETH_HOST}/meta-connect/api/callback`

### 5. Register the redirect URI (manual — one-time per VM)

In [developers.facebook.com](https://developers.facebook.com) → Runneth-test app:
- Use Cases → Facebook Login → Customize → Settings → **Valid OAuth Redirect URIs** → add the URI from Step 4
- App Settings → Basic → **App Domains** → add `{SPAWNETH_HOST}`
- Save Changes

### 6. Connect

Open the meta-connect app and click **Connect with Meta**. Authorize with the account that has access to the Motion ad account. Token saves automatically.

---

## What this creates

```
/agent/.agents/skills/meta-connect/SKILL.md         # Ad publishing skill
/agent/.agents/skills/setup-meta-connect/SKILL.md   # Setup/reconnect skill
/agent/brain/integrations/meta-token.json           # Live OAuth token (written on connect)
/agent/brain/integrations/meta-app-secret.txt       # App secret for token exchange
/agent/brain/workspace-policies/meta-connection-operating-rules.md
/agent/apps/meta-connect/                           # OAuth connection app
user.md → Meta connection rules snippet             # Always-on guardrails
```

---

## What to customize

| Token | Description | Required |
|---|---|---|
| `{{META_APP_SECRET}}` | Secret for the Runneth-test Facebook app. From Facebook Developers → App Settings → Basic → Show. | Yes |

---

## How Runneth uses this

**Phrases that trigger ad publishing:**
- "Push these to Meta" / "Stage this campaign" / "Upload to Meta"
- "Create an ad set" / "Publish this creative"

**What Runneth reads:**
- `/agent/brain/integrations/meta-token.json` — access token for all API calls
- `/agent/brain/integrations/google-drive-service-account.json` — for Drive asset downloads

**What Runneth writes:**
- Meta Graph API (campaigns, ad sets, adcreatives, ads) — always `PAUSED`

**Key rule:** Motion CLI handles all performance analysis. Meta API handles publishing only.

---

## Key API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/v21.0/act_{id}/campaigns` | List campaigns |
| POST | `/v21.0/act_{id}/campaigns` | Create campaign (PAUSED) |
| POST | `/v21.0/act_{id}/adsets` | Create ad set (PAUSED) |
| POST | `/v21.0/act_{id}/adimages` | Upload image creative |
| POST | `/v21.0/act_{id}/advideos` | Upload video creative |
| POST | `/v21.0/act_{id}/adcreatives` | Create ad creative |
| POST | `/v21.0/act_{id}/ads` | Create ad (PAUSED) |

---

## Ongoing maintenance

- Token expires every 60 days. Refresh by opening meta-connect app → Refresh Token.
- If connection breaks, run `setup-meta-connect` or open the app and reconnect.
- If the VM IP changes, update the Server IP Allowlist in the Meta app (Settings → Advanced).

---

## Fallbacks

- **Token expired:** Open meta-connect app → Refresh Token. If fully expired, click Connect again.
- **IP blocked:** Get VM IP with `curl -s https://api.ipify.org`, add to Meta app Server IP Allowlist.
- **Redirect URI mismatch:** Re-add the URI for this VM to Facebook Login → Settings in the Meta app.

---

## Version history

| Version | Date | Notes |
|---|---|---|
| 1.0.0 | 2026-05-07 | Initial release. OAuth app, 60-day token, auto-refresh UI, operating guardrails. |
