```yaml
triggers:
  phrases:
    - "set up meta-connect"
    - "connect Meta"
    - "reconnect Meta"
    - "set up Meta connection"
    - "personalize meta-connect"
    - "reconfigure meta-connect"
  intent: "User wants to configure or re-configure the Meta OAuth connection for this sandbox."
```

---

# Skill: setup-meta-connect

Walks through the one-time setup required to activate the Meta connection on a new sandbox.

---

## When to use

- First time setting up the Meta connection on a new VM
- Re-connecting after a token is revoked or the connection breaks
- Reconfiguring after a Meta app change

---

## Steps

### Step 1 — Get the VM's redirect URI

Run:
```bash
echo $SPAWNETH_HOST
```

Tell the user:

> Your redirect URI for this sandbox is:
> `https://{SPAWNETH_HOST}/meta-connect/api/callback`
>
> You need to add this to the Runneth-test Meta app before connecting. Here's how:
> 1. Go to [developers.facebook.com](https://developers.facebook.com) → Runneth-test app
> 2. Use Cases → Facebook Login → Customize → Settings
> 3. Paste the URI above into **Valid OAuth Redirect URIs**
> 4. Also add `{SPAWNETH_HOST}` to **App Settings → Basic → App Domains**
> 5. Save Changes
>
> Let me know when that's done.

Wait for confirmation before Step 2.

### Step 2 — Open the connection app

Surface the meta-connect app link:
```
app list  # get the route
```
Build the URL: `https://{SPAWNETH_HOST}/meta-connect`

Tell the user:
> Open the app and click **Connect with Meta**. A popup will open — authorize with the account that has access to the ad account. The app will detect when you're connected and update automatically.

Wait for confirmation that the connection succeeded.

### Step 3 — Verify

Read `/agent/brain/integrations/meta-token.json`. Confirm:
- `access_token` is present
- `expires_at` is in the future
- `name` shows the expected user

Report back:
> Connected as {name}. Token valid until {date}. You're ready to publish ads from chat.

---

## Writes to

- `/agent/brain/integrations/meta-token.json` — written by the meta-connect app during OAuth
