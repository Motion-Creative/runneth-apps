```yaml
triggers:
  phrases:
    - "publish * to Meta"
    - "launch * ad"
    - "stage * campaign"
    - "create * ad set"
    - "push * to Meta"
    - "upload * to Meta"
    - "check Meta connection"
    - "refresh Meta token"
  intent: "User wants to publish, stage, or manage ads in Meta Ads Manager, or check/refresh the Meta connection."
  excludes:
    - "analyze Meta ads"
    - "Meta performance"
    - "how are my Meta ads doing"
```

---

# Skill: meta-connect

Manages the persistent Meta Ads connection and handles ad publishing from chat.

---

## When to use

- Publishing creatives, campaigns, ad sets, or ads to Meta
- Checking the status of the Meta OAuth connection
- Refreshing an expiring token
- Building and staging a campaign structure for user review

---

## Before any Meta API call

1. Read `/agent/brain/integrations/meta-token.json`
2. Check `expires_at` (Unix timestamp). If within 7 days of expiry, remind the user to open the meta-connect app and hit Refresh.
3. Extract `access_token` for all API calls.
4. Use `urllib.request` in Python for all Graph API calls. Do not use `secure-fetch` for Meta.

```python
import urllib.request, json

token_data = json.load(open('/agent/brain/integrations/meta-token.json'))
token = token_data['access_token']
```

---

## Operating rules (enforced on every turn)

- **Meta API = publishing only.** Never pull performance data via Meta API.
- **Motion CLI = all performance and analysis work.**
- **All objects created as `PAUSED`.** Never set `ACTIVE`.
- **User launches. Runneth stages.**

---

## Publishing flow

### 1. Confirm campaign destination
Ask which campaign and ad set to publish into, or confirm creation of a new one. Always show the user what will be created before doing it.

### 2. Download assets
If assets are in Google Drive, use the service account at `/agent/brain/integrations/google-drive-service-account.json`. See `/agent/brain/integrations/google-drive-HOW-TO.md` for the auth pattern.

### 3. Make assets publicly accessible (for Meta upload)
Temporarily set Drive file permissions to `anyoneWithLink`. Upload to Meta. Revoke immediately after.

### 4. Upload creatives to Meta
```
POST https://graph.facebook.com/v21.0/act_{AD_ACCOUNT_ID}/adimages
POST https://graph.facebook.com/v21.0/act_{AD_ACCOUNT_ID}/advideos
```

### 5. Create ad creatives
```
POST https://graph.facebook.com/v21.0/act_{AD_ACCOUNT_ID}/adcreatives
```

### 6. Create ads — always PAUSED
```
POST https://graph.facebook.com/v21.0/act_{AD_ACCOUNT_ID}/ads
body: { ..., "status": "PAUSED" }
```

### 7. Confirm to user
Report what was created with IDs. Tell the user to go into Meta Ads Manager to activate.

---

## Token refresh

If the user asks to refresh or the token is near expiry:
1. Surface a link to the meta-connect app
2. User clicks Refresh Token in the app
3. Token file updates automatically

---

## Changelog

| Version | Date | Notes |
|---|---|---|
| 1.0.0 | 2026-05-07 | Initial release |
