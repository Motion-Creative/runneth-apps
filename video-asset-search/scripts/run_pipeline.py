"""
run_pipeline.py — Batch pipeline orchestrator.

Downloads all videos from a Google Drive URL and processes each one.
Must be run from within a Runneth conversation (motion analyze-media
requires ./uploads/ relative to the active conversation directory).

Usage:
    python3 run_pipeline.py --drive-url <url> [--folder-name "Concept"] [--uploads-dir <path>]
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import sqlite3
import subprocess
from asset_db import init_db, get_stats, update_clip_path
from fetch_drive import fetch
from process_video import process_video

CLIPS_DIR = Path("{{BRAIN_PATH}}/clips")


def cut_clips_for_video(source_filename: str) -> tuple[int, int]:
    """Cut ffmpeg clips for all shots of a given video that don't have one yet.
    Returns (cut, skipped).
    """
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect("{{BRAIN_PATH}}/{{DB_FILENAME}}")
    db.row_factory = sqlite3.Row
    shots = db.execute(
        "SELECT id, source_video, timecode_start, timecode_end FROM shots "
        "WHERE source_filename=? AND clip_path IS NULL",
        (source_filename,)
    ).fetchall()
    db.close()

    cut = skipped = 0
    for s in shots:
        src = Path(s["source_video"])
        if not src.exists():
            skipped += 1
            continue
        start, end = s["timecode_start"], s["timecode_end"]
        clip_name = f"{src.stem}_{start:.1f}-{end:.1f}{src.suffix}"
        clip_path = CLIPS_DIR / clip_name
        if clip_path.exists():
            update_clip_path(s["id"], str(clip_path))
            skipped += 1
            continue
        result = subprocess.run(
            ["ffmpeg", "-y", "-ss", str(start), "-i", str(src),
             "-t", str(end - start), "-c", "copy",
             "-avoid_negative_ts", "1", str(clip_path)],
            capture_output=True, timeout=60
        )
        if result.returncode == 0 and clip_path.exists():
            update_clip_path(s["id"], str(clip_path))
            cut += 1
        else:
            skipped += 1
    return cut, skipped


def run(drive_url: str, folder_name: str = None, uploads_dir: str = None):
    init_db()

    sources_path = Path("{{BRAIN_PATH}}/sources")
    uploads_path = Path(uploads_dir) if uploads_dir else None

    print(f"Downloading videos from Drive...")
    video_paths = fetch(drive_url, dest_dir=sources_path)

    if not video_paths:
        print("ERROR: No videos downloaded. Check the Drive URL and permissions.")
        sys.exit(1)

    print(f"Downloaded {len(video_paths)} video(s).\n")

    total_shots = 0
    errors = []
    for i, video_path in enumerate(video_paths, 1):
        print(f"\nVideo {i}/{len(video_paths)}: {video_path.name}")
        try:
            n = process_video(video_path=video_path, folder_name=folder_name,
                              uploads_dir=uploads_path)
            total_shots += n
            if n > 0:
                cut, skipped = cut_clips_for_video(video_path.name)
                print(f"  Clips: {cut} cut, {skipped} skipped")
        except Exception as e:
            print(f"  ERROR: {e}", file=sys.stderr)
            errors.append(video_path.name)

    print(f"\n{'='*60}")
    print(f"Pipeline complete.")
    print(f"Videos processed: {len(video_paths) - len(errors)}/{len(video_paths)}")
    print(f"Total shots: {total_shots}")
    if errors:
        print(f"Errors: {', '.join(errors)}")
    print(f"\nDB stats: {get_stats()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--drive-url", required=True)
    parser.add_argument("--folder-name", default=None)
    parser.add_argument("--uploads-dir", default=None)
    args = parser.parse_args()
    run(args.drive_url, args.folder_name, args.uploads_dir)
