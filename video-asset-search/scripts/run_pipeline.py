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
from asset_db import init_db, get_stats
from fetch_drive import fetch
from process_video import process_video


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
