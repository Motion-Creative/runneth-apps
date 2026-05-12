"""
asset_db.py — Database utilities for the video asset search pipeline.

DB lives at {{BRAIN_PATH}}/{{DB_FILENAME}}
All pipeline writes go through here. The app backend reads via node:sqlite.
"""

import sqlite3
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

DB_PATH    = "{{BRAIN_PATH}}/{{DB_FILENAME}}"
SOURCES_DIR = "{{BRAIN_PATH}}/sources"
CLIPS_DIR   = "{{BRAIN_PATH}}/clips"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables and FTS5 index if they don't exist. Idempotent."""
    Path(SOURCES_DIR).mkdir(parents=True, exist_ok=True)
    Path(CLIPS_DIR).mkdir(parents=True, exist_ok=True)

    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS shots (
            id                  TEXT PRIMARY KEY,
            source_video        TEXT NOT NULL,
            source_filename     TEXT NOT NULL,
            source_folder       TEXT,
            timecode_start      REAL NOT NULL,
            timecode_end        REAL NOT NULL,
            duration            REAL NOT NULL,
            shot_type           TEXT,
            people_in_frame     TEXT,
            product_in_frame    TEXT,
            talking_direction   TEXT,
            shooting_style      TEXT,
            concept_action_type TEXT,
            description         TEXT,
            clip_path           TEXT,
            processed_at        TEXT,
            embedding           BLOB
        );

        CREATE TABLE IF NOT EXISTS source_videos (
            id              TEXT PRIMARY KEY,
            filename        TEXT NOT NULL,
            original_url    TEXT,
            folder_name     TEXT,
            file_path       TEXT NOT NULL,
            shot_count      INTEGER DEFAULT 0,
            processed_at    TEXT,
            status          TEXT DEFAULT 'pending'
        );

        CREATE INDEX IF NOT EXISTS idx_shots_source   ON shots(source_filename);
        CREATE INDEX IF NOT EXISTS idx_shots_type     ON shots(shot_type);
        CREATE INDEX IF NOT EXISTS idx_shots_style    ON shots(shooting_style);
        CREATE INDEX IF NOT EXISTS idx_shots_people   ON shots(people_in_frame);
        CREATE INDEX IF NOT EXISTS idx_shots_product  ON shots(product_in_frame);
        CREATE INDEX IF NOT EXISTS idx_shots_concept  ON shots(concept_action_type);
        CREATE INDEX IF NOT EXISTS idx_shots_talk     ON shots(talking_direction);

        -- FTS5 full-text index over descriptions (BM25 keyword leg of hybrid search)
        CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
            shot_id     UNINDEXED,
            description
        );
    """)
    conn.commit()

    # Populate FTS5 if behind (idempotent via delete+reinsert)
    fts_count  = conn.execute("SELECT COUNT(*) FROM chunks_fts").fetchone()[0]
    shot_count = conn.execute("SELECT COUNT(*) FROM shots WHERE description IS NOT NULL").fetchone()[0]
    if fts_count != shot_count and shot_count > 0:
        conn.execute("DELETE FROM chunks_fts")
        conn.execute("""
            INSERT INTO chunks_fts(shot_id, description)
            SELECT id, description FROM shots WHERE description IS NOT NULL
        """)
        conn.commit()

    conn.close()


def insert_shot(shot: dict) -> str:
    """Insert or replace a shot record. Returns the shot id."""
    shot_id = shot.get("id") or str(uuid.uuid4())
    conn = get_conn()
    conn.execute("""
        INSERT OR REPLACE INTO shots
            (id, source_video, source_filename, source_folder,
             timecode_start, timecode_end, duration,
             shot_type, people_in_frame, product_in_frame,
             talking_direction, shooting_style, concept_action_type,
             description, clip_path, processed_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        shot_id,
        shot["source_video"], shot["source_filename"], shot.get("source_folder"),
        shot["timecode_start"], shot["timecode_end"],
        shot["timecode_end"] - shot["timecode_start"],
        shot.get("shot_type"), shot.get("people_in_frame"),
        shot.get("product_in_frame"), shot.get("talking_direction"),
        shot.get("shooting_style"), shot.get("concept_action_type"),
        shot.get("description"), shot.get("clip_path"),
        shot.get("processed_at", datetime.now(timezone.utc).isoformat()),
    ))
    # Keep FTS5 in sync
    conn.execute("DELETE FROM chunks_fts WHERE shot_id=?", (shot_id,))
    if shot.get("description"):
        conn.execute("INSERT INTO chunks_fts(shot_id, description) VALUES (?,?)",
                     (shot_id, shot["description"]))
    conn.commit()
    conn.close()
    return shot_id


def update_clip_path(shot_id: str, clip_path: str):
    conn = get_conn()
    conn.execute("UPDATE shots SET clip_path=? WHERE id=?", (clip_path, shot_id))
    conn.commit()
    conn.close()


def register_source_video(filename: str, file_path: str,
                           original_url: str = None, folder_name: str = None) -> str:
    vid_id = str(uuid.uuid4())
    conn = get_conn()
    conn.execute("""
        INSERT OR IGNORE INTO source_videos
            (id, filename, original_url, folder_name, file_path, processed_at, status)
        VALUES (?,?,?,?,?,?,?)
    """, (vid_id, filename, original_url, folder_name, file_path,
          datetime.now(timezone.utc).isoformat(), "pending"))
    conn.commit()
    conn.close()
    return vid_id


def update_source_video_status(filename: str, status: str, shot_count: int = 0):
    conn = get_conn()
    conn.execute(
        "UPDATE source_videos SET status=?, shot_count=?, processed_at=? WHERE filename=?",
        (status, shot_count, datetime.now(timezone.utc).isoformat(), filename)
    )
    conn.commit()
    conn.close()


def get_stats() -> dict:
    conn = get_conn()
    stats = {
        "total_shots":   conn.execute("SELECT COUNT(*) FROM shots").fetchone()[0],
        "total_videos":  conn.execute("SELECT COUNT(*) FROM source_videos").fetchone()[0],
        "processed":     conn.execute("SELECT COUNT(*) FROM source_videos WHERE status='done'").fetchone()[0],
        "clips_cut":     conn.execute("SELECT COUNT(*) FROM shots WHERE clip_path IS NOT NULL").fetchone()[0],
    }
    conn.close()
    return stats


if __name__ == "__main__":
    init_db()
    print("DB initialized at", DB_PATH)
    print("Stats:", get_stats())
