# Apify actors for top creator similarity

Saved, verified-working Apify actors for the top-creator-similarity method. Use these; do not re-discover them each run unless they stop working.

All calls go through `secure-fetch` against `api.apify.com` with `--secret-key APIFY_API_KEY --auth-scheme Bearer`, `--header "Content-Type: application/json"`, and `--timeout-ms 120000` (secure-fetch caps at 120s, so run one profile set per call and keep counts modest).

## 1. Following scraper (the network walk)

- Actor: `datadoping/instagram-following-scraper` (no-cookie).
- Call: `POST /v2/acts/datadoping~instagram-following-scraper/run-sync-get-dataset-items`
- Body: `{"usernames":["<handle>"],"max_count":150}` (both required).
- Returns per followed account: `username`, `full_name`, `is_private`, `is_verified`, `profile_pic_url`. No follower count.
- Run once per seed. Evaluate every followed account against the target's niche/topic fit. Keep all that pass the niche filter as candidates; rank them by how many seeds' networks they appear in.

## 2. Profile scraper (enrichment: followers + bio)

- Actor: `apify/instagram-profile-scraper`.
- Call: `POST /v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?fields=username,followersCount,fullName,biography`
- Body: `{"usernames":["<handle>", ...]}` (batch the candidate handles in one call).
- Always pass the `fields` filter; the full output is huge (posts plus related profiles) and truncates.
- Use `followersCount` and `biography` to add follower counts and to write the reason each creator was selected.
