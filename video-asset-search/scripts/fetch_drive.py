"""
fetch_drive.py — Download videos from a Google Drive URL (file or folder).

The Drive folder/file must be shared as "Anyone with the link can view."

Usage:
    python3 fetch_drive.py <drive_url> [--dest <directory>]

Outputs downloaded file paths to stdout, one per line.
"""

import sys
import re
import subprocess
import argparse
from pathlib import Path

GDOWN = "gdown"  # installed as part of post-install pip step
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".mts", ".3gp"}


def extract_file_id(url: str) -> str | None:
    for pattern in [r"/file/d/([a-zA-Z0-9_-]+)", r"[?&]id=([a-zA-Z0-9_-]+)",
                    r"/d/([a-zA-Z0-9_-]+)"]:
        m = re.search(pattern, url)
        if m:
            return m.group(1)
    return None


def extract_folder_id(url: str) -> str | None:
    m = re.search(r"/folders/([a-zA-Z0-9_-]+)", url)
    return m.group(1) if m else None


def is_video(path: Path) -> bool:
    return path.suffix.lower() in VIDEO_EXTENSIONS


def download_file(file_id: str, dest_dir: Path) -> list[Path]:
    result = subprocess.run(
        [GDOWN, f"https://drive.google.com/uc?id={file_id}",
         "--output", str(dest_dir) + "/"],
        capture_output=True, text=True
    )
    return [p for p in dest_dir.iterdir() if is_video(p)]


def download_folder(folder_id: str, dest_dir: Path) -> list[Path]:
    folder_dest = dest_dir / folder_id
    folder_dest.mkdir(exist_ok=True)
    subprocess.run(
        [GDOWN, "--folder",
         f"https://drive.google.com/drive/folders/{folder_id}",
         "--output", str(folder_dest)],
        capture_output=True, text=True
    )
    return [p for p in folder_dest.rglob("*") if is_video(p)]


def fetch(url: str, dest_dir: Path) -> list[Path]:
    folder_id = extract_folder_id(url)
    if folder_id:
        return download_folder(folder_id, dest_dir)
    file_id = extract_file_id(url)
    if file_id:
        return download_file(file_id, dest_dir)
    print(f"ERROR: Could not parse Drive URL: {url}", file=sys.stderr)
    return []


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--dest", default="{{BRAIN_PATH}}/sources")
    args = parser.parse_args()

    paths = fetch(args.url, Path(args.dest))
    if not paths:
        print("No videos downloaded.", file=sys.stderr)
        sys.exit(1)
    for p in paths:
        print(str(p))
