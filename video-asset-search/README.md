# Video Asset Search

**Natural language search over a video asset library, with shareable deep-linked clips.**

Editors describe what they need — "woman demonstrating a product on iPhone" or "closeup of hands in outdoor lighting" — and the system finds the right footage, surfaces it as clickable clip links, and makes every action (download, copy timecode, open source video) available in one place.

---

## What this enables

- Search a video library in natural language from a browser or directly via Runneth
- Results appear as deep-linked clips that open a full-context viewer
- Clips are cut automatically — editors don't touch source files
- The same library is searchable by Runneth and by team members in the browser

**Install time:** ~5 minutes active + ~3 minutes for model download (one-time)

**Requires:** Python 3.10+, Node 22, a Runneth sandbox

---

## Setup steps

Run these in order from within a Runneth conversation:

```bash
# Dependencies (handled by post-install)
pip3 install onnxruntime tokenizers gdown --break-system-packages

# The ONNX embedding model is downloaded automatically (~133 MB, one-time)
# The database is initialized automatically

# After install, confirm the app is live:
app list
```

**Processing your first videos:** When you have a Google Drive folder ready, share it with Runneth and ask it to process. Runneth runs:

```bash
python3 {{BRAIN_PATH}}/scripts/run_pipeline.py \
  --drive-url "https://drive.google.com/drive/folders/..." \
  --folder-name "Campaign Name" \
  --uploads-dir ./uploads
```

Two requirements for the pipeline:
- **Pipeline runs must happen inside a Runneth conversation.** The video analysis step requires videos to exist in the conversation's uploads directory.
- **Drive folders must be shared as "Anyone with the link can view."**

**Disk space:** Expect ~1–3 GB for 50 source videos plus their pre-cut clips.

---

## What gets installed

```
{{BRAIN_PATH}}/
├── {{DB_FILENAME}}              ← SQLite database (shots, embeddings, FTS5 index)
├── models/
│   └── bge-small-en-v1.5/      ← ONNX embedding model (downloaded at install)
├── scripts/
│   ├── asset_db.py              ← DB utilities
│   ├── process_video.py         ← Single-video processor
│   ├── run_pipeline.py          ← Batch orchestrator
│   ├── fetch_drive.py           ← Drive downloader
│   ├── embed_onnx.py            ← Embedding + similarity utilities
│   └── query_shots.py           ← Agent-path search
├── sources/                     ← Downloaded source videos
└── clips/                       ← Pre-cut clip files

/agent/apps/{{APP_NAME}}/        ← Browser app
user.md                          ← Updated with clip-sharing behavior
```

---

## Tokens

| Token | Required | Default | Controls |
|---|---|---|---|
| `APP_NAME` | Yes | `asset-search` | App identifier |
| `APP_ROUTE` | Yes | `/asset-search` | URL mount point |
| `BRAIN_PATH` | Yes | `/agent/brain/assets` | DB, scripts, clips, sources |
| `DB_FILENAME` | Yes | `assets.db` | SQLite filename |
| `ORGANIZATION_NAME` | Yes | `Asset Search` | App header display name |
| `BG_COLOR` | No | `#0a0a0a` | App background color |
| `FG_COLOR` | No | `#ffffff` | App text color |
| `OBJECT_TAXONOMY` | No | *(none — model describes objects freely)* | Structured tag values in prompt |

---

## How Runneth uses this

**Searching the library:**
```python
import sys
sys.path.insert(0, '{{BRAIN_PATH}}/scripts')
from query_shots import search_and_clip

results = search_and_clip("woman demonstrating a product", limit=5, threshold=0.65)
for r in results:
    print(f"[{r['score']:.3f}] {r['source_filename']} {r['timecode_start']:.1f}s–{r['timecode_end']:.1f}s")
    print(f"  {r['description'][:100]}")
```

**Clip-sharing default (from user.md):**
When a user asks for a clip, Runneth runs the search above and returns results as `link` widgets pointing to the app. The app provides download, copy timecode, and source video player.

**Processing new videos:**
```bash
python3 {{BRAIN_PATH}}/scripts/run_pipeline.py \
  --drive-url "<drive_url>" \
  --folder-name "Concept Name" \
  --uploads-dir ./uploads
```

**Health check:**
```python
from asset_db import get_stats
print(get_stats())
# → {'total_shots': N, 'total_videos': N, 'processed': N, 'clips_cut': N}
```

---

## Key API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/status` | Shot count, video count, in-progress processing |
| GET | `/api/shots` | Browse all shots (params: `limit`, `offset`, `sort`) |
| GET | `/api/shots/:id` | Single shot by UUID |
| POST | `/api/search-vector` | Semantic search. Body: `{vector: number[384], query: string, limit?, threshold?}` |
| GET | `/api/media/source/:shotId` | Stream source video with range-request support |
| GET | `/api/media/clips/:filename` | Serve pre-cut clip file |

---

## Database schema

The pipeline writes to a SQLite database. Key table:

```sql
shots (
  id TEXT PRIMARY KEY,           -- UUID
  source_filename TEXT,          -- original video filename
  source_folder TEXT,            -- concept or campaign name
  timecode_start REAL,           -- seconds from video start
  timecode_end REAL,             -- seconds from video start
  description TEXT,              -- natural language description (drives all search)
  shot_type TEXT,                -- closeup | hero_shot | detail_shot | b_roll | montage
  people_in_frame TEXT,          -- man | woman | couple | none
  product_in_frame TEXT,         -- configurable via OBJECT_TAXONOMY token
  talking_direction TEXT,        -- M2M | M2W | W2W | W2M | voiceover | no_dialogue
  shooting_style TEXT,           -- iphone_ugc_raw | dslr_studio_high_quality
  concept_action_type TEXT,      -- durability | us_vs_them | product_demo | lifestyle | ...
  clip_path TEXT,                -- absolute path to pre-cut clip file
  embedding BLOB                 -- float32[384] L2-normalised vector
)
```

---

## Ongoing maintenance

After any pipeline re-run that changes shot descriptions, re-embed:

```python
import sys; sys.path.insert(0, '{{BRAIN_PATH}}/scripts')
from embed_onnx import embed
from asset_db import get_conn, init_db
init_db()  # also rebuilds FTS5 index
conn = get_conn()
rows = conn.execute('SELECT id, description FROM shots WHERE description IS NOT NULL').fetchall()
for shot_id, desc in rows:
    vec = embed(desc)
    conn.execute('UPDATE shots SET embedding=? WHERE id=?', (vec.tobytes(), shot_id))
conn.commit()
print(f'Re-embedded {len(rows)} shots')
```

---

## Fallbacks

- **No results above threshold:** Returns an empty result set. The 0.65 threshold is calibrated for this embedding model.
- **Drive download fails:** Confirm the folder is shared as "Anyone with the link can view."
- **Gemini returns malformed JSON:** The parser handles markdown fences, M.SS timecodes, and leading-zero floats automatically. If parsing still fails, a debug file is saved to `{{BRAIN_PATH}}/debug_{filename}.txt`.
- **Model not found:** Re-run the ONNX model download step from the post-install sequence.

---

## Version history

| Version | Date | Notes |
|---|---|---|
| 1.1.1 | 2026-05-13 | Cut clips at ingest in `run_pipeline.py` so the browser download button works without a separate clipping pass. |
| 1.1.0 | 2026-05-12 | Drop Tailwind CDN runtime dependency in favor of inline CSS; make token substitution explicit in install step. |
| 1.0.0 | 2026-05-11 | Initial release. Hybrid BM25+cosine search, ONNX embeddings, browser app, agent-path search. |
