<!-- use-case: video-asset-search v1.0.0 -->
## Video asset search

When a user asks for a clip, a shot, or asks to find specific video content from
the asset library:

1. Run `search_and_clip(query, limit=5, threshold=0.65, cut_clips=False)` using the
   Python agent path (`{{BRAIN_PATH}}/scripts/query_shots.py`).
2. Get the app URL for this workspace and return results as deep links:
   `<app-url>{{APP_ROUTE}}?clip={shot_id}`
3. Present each result as a `link` widget (kind=app) labelled with source video + timecode
   (e.g. "interview-b-roll.mp4 · 17.0s–20.1s").

Always use the deep link. The app has download, copy timecode, and source video player
built in — editors can take any action they need from there.
<!-- /use-case: video-asset-search -->
