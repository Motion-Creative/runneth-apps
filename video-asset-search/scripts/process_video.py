"""
process_video.py — Single-video processor.

Copies a video to the conversation uploads directory, calls motion analyze-media
with the shot segmentation prompt, parses the JSON response, writes shots to the
database, and embeds each description inline.

Must be run from within a Runneth conversation — motion analyze-media requires
the file to exist at ./uploads/ relative to the active conversation directory.

Usage:
    python3 process_video.py <video_path> [--folder-name "Concept Name"] [--uploads-dir <path>]
"""

import sys
import os
import json
import subprocess
import argparse
import re
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent))
from asset_db import init_db, insert_shot, register_source_video, update_source_video_status

# ─── Prompt template ─────────────────────────────────────────────────────────

_PROMPT_TEMPLATE = """CRITICAL TIMECODE RULE: ALL timecode values MUST be in decimal seconds. A 4-second
video ends at 4.0. A 90-second video ends at 90.0. Never use MM:SS notation. Use 4.0
not 0.04 when you mean 4 seconds.

You are analyzing a video asset. This video is from the concept: "{folder_name}"

Analyze this video and identify every individual shot. A "shot" is a continuous
unbroken camera angle. A new shot begins when:
(1) there is a hard cut (instant change to different camera angle or subject), or
(2) there is a dissolve, fade, or wipe to different content, or
(3) the camera continues rolling but the framing changes so significantly that an
    editor would treat the segments as different shots.

A camera that subtly reframes within the same shot (handheld drift, small follow
movements) is still one shot. A continuous take where the subject does something
new without a cut is still one shot.

For each shot, you must be able to say what visually distinguishes it from the
adjacent shots. If you cannot identify a clear visual boundary, extend the previous
shot rather than splitting arbitrarily.

For EACH shot, output a JSON object with these exact keys:

{{
  "timecode_start": <float — decimal seconds from video start, e.g. 0.0>,
  "timecode_end":   <float — decimal seconds from video start>,

  "description": <2-4 sentences of natural flowing prose that a video editor could
    use to find this specific shot. Begin with what visually defines THIS shot as
    distinct — what the camera is showing during these exact frames, what changed
    from the previous shot, and what ends this shot. Then weave in the remaining
    dimensions naturally:

    1. WHAT IS ON SCREEN — describe only what appears in these specific frames.
       Do not describe what happens in adjacent shots.

    2. PRODUCTION STYLE — characterize how the shot was made, e.g. "shot on iPhone
       in a handheld UGC style with natural home lighting," or "DSLR studio
       production with controlled lighting and a clean background."

    3. AUDIENCE ORIENTATION — who this message is directed at and what the emotional
       or commercial intent is. Infer from script content, framing, and messaging.

    4. CAMPAIGN CONTEXT — reference the concept this shot comes from using the
       concept name provided above.

    Write as natural flowing prose. No bullet points, labels, or section headers.
    For very short shots (under 5 seconds) or simple single-element shots, a concise
    1-2 sentence description is preferable to padded prose.

    Before finalizing, check: does my description match only this timecode range?>,

  "shot_type": <visual framing — pick the closest:
    closeup, hero_shot, detail_shot, b_roll, or montage>,

  "people_in_frame": <who appears: man, woman, couple, or none;
    comma-separated if multiple>,

  "product_in_frame": <{object_taxonomy_instruction}>,

  "talking_direction": <M2M, M2W, W2W, W2M, voiceover, or no_dialogue —
    infer TARGET audience from messaging and script, not just speaker appearance>,

  "shooting_style": <iphone_ugc_raw or dslr_studio_high_quality>,

  "concept_action_type": <content purpose — pick the closest:
    durability, us_vs_them_comparison, product_demo, lifestyle, montage,
    or couples_moment>
}}

Rules:
- timecode_start of shot N+1 must equal timecode_end of shot N (no gaps)
- First shot starts at 0.0; last shot ends at the video's total duration
- Place each timecode boundary at the exact frame where the visual content changes.
  Prefer LATE boundaries over early ones — better for the previous shot to run
  slightly long than for the next shot to start in the previous clip.
- No shot shorter than 1.0 seconds unless part of a deliberate rapid-cut montage
- Group cuts shorter than 1.5 seconds into a single montage shot when the editing
  is intentionally rapid
- Return ONLY a valid JSON array. No markdown, no explanation, no code fences.
  Begin with [ and end with ]."""

# Default object_taxonomy_instruction when {{OBJECT_TAXONOMY}} is not configured
_DEFAULT_OBJECT_INSTRUCTION = (
    "describe any notable objects, products, or items visible in these specific "
    "frames, or 'none' if nothing notable is present"
)


def build_prompt(folder_name: str, object_taxonomy: str = None) -> str:
    instruction = object_taxonomy if object_taxonomy else _DEFAULT_OBJECT_INSTRUCTION
    safe_folder = (folder_name or "unknown concept").replace("{", "").replace("}", "")
    return _PROMPT_TEMPLATE.format(
        folder_name=safe_folder,
        object_taxonomy_instruction=instruction
    )


# ─── Parser utilities ─────────────────────────────────────────────────────────

def _clean_analysis_string(s: str) -> str:
    """Strip markdown fences and fix malformed number literals."""
    s = re.sub(r"```(?:json)?\s*", "", s).strip()
    # Fix leading-zero floats like 01.049 → 1.049
    s = re.sub(r":\s*0+(\d+\.\d+)", r": \1", s)
    return s


def _extract_first_json_array(text: str) -> list | None:
    """Bracket-match to find the first complete JSON array (ignores trailing prose)."""
    text = re.sub(r"```(?:json)?\s*", "", text).strip()
    start = text.find("[")
    if start == -1:
        return None
    depth = 0
    in_string = False
    escape_next = False
    for i, ch in enumerate(text[start:], start=start):
        if escape_next:
            escape_next = False
            continue
        if ch == "\\" and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0:
                try:
                    parsed = json.loads(text[start:i + 1])
                    if isinstance(parsed, list):
                        return parsed
                except json.JSONDecodeError:
                    pass
                break
    return None


def extract_json_from_response(text: str) -> list | None:
    """Extract shot JSON from motion analyze-media response."""
    text = text.strip()
    try:
        outer = json.loads(text)
        if isinstance(outer, dict) and "analysis" in outer:
            analysis = outer["analysis"]
            if isinstance(analysis, list):
                return analysis
            if isinstance(analysis, str):
                clean = _clean_analysis_string(analysis)
                try:
                    parsed = json.loads(clean)
                    if isinstance(parsed, list):
                        return parsed
                except json.JSONDecodeError:
                    pass
                return _extract_first_json_array(clean)
    except (json.JSONDecodeError, TypeError):
        pass
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
    except json.JSONDecodeError:
        pass
    return _extract_first_json_array(text)


def detect_summary_rows(shots: list[dict]) -> list[int]:
    """Return indices of shots that subsume 2+ subsequent shots (bogus summary rows)."""
    flagged = []
    for i, shot in enumerate(shots):
        subsumed = 0
        for j in range(i + 1, len(shots)):
            nxt = shots[j]
            if (nxt["timecode_start"] >= shot["timecode_start"] and
                    nxt["timecode_end"] <= shot["timecode_end"]):
                subsumed += 1
                if subsumed >= 2:
                    flagged.append(i)
                    break
    return flagged


def _fix_mss_timecodes(ts: float, te: float, duration: float) -> tuple[float, float]:
    """Correct M.SS timecode format (e.g. Gemini returns 0.06 meaning 6 seconds)."""
    if duration > 1.0 and te < 1.0 and te > 0:
        ts_conv = int(ts) * 60 + round((ts % 1) * 100, 1)
        te_conv = int(te) * 60 + round((te % 1) * 100, 1)
        if 0 <= te_conv <= max(duration * 1.5, duration + 15):
            return ts_conv, te_conv
    return ts, te


def normalize_shot(shot: dict, source_video: str, source_filename: str,
                   source_folder: str, duration: float) -> dict | None:
    """Validate and normalize a raw shot dict from Gemini."""
    try:
        ts = float(shot.get("timecode_start", 0))
        te = float(shot.get("timecode_end", 0))
    except (TypeError, ValueError):
        return None
    ts, te = _fix_mss_timecodes(ts, te, duration)
    if duration > 0:
        ts = max(0.0, min(ts, duration))
        te = max(0.0, min(te, duration))
    if te <= ts:
        return None
    return {
        "source_video":        source_video,
        "source_filename":     source_filename,
        "source_folder":       source_folder or "",
        "timecode_start":      round(ts, 3),
        "timecode_end":        round(te, 3),
        "shot_type":           (shot.get("shot_type")           or "").strip() or None,
        "people_in_frame":     (shot.get("people_in_frame")     or "").strip() or None,
        "product_in_frame":    (shot.get("product_in_frame")    or "").strip() or None,
        "talking_direction":   (shot.get("talking_direction")   or "").strip() or None,
        "shooting_style":      (shot.get("shooting_style")      or "").strip() or None,
        "concept_action_type": (shot.get("concept_action_type") or "").strip() or None,
        "description":         (shot.get("description")         or "").strip() or None,
        "processed_at":        datetime.now(timezone.utc).isoformat(),
    }


def get_video_duration(video_path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(video_path)],
        capture_output=True, text=True
    )
    try:
        return float(result.stdout.strip())
    except (ValueError, AttributeError):
        return 0.0


# ─── Main processing function ─────────────────────────────────────────────────

def process_video(video_path: Path, folder_name: str = None,
                  uploads_dir: Path = None,
                  object_taxonomy: str = None) -> int:
    """
    Process one video: segment into shots, tag, embed, store.
    Returns number of shots written to DB.

    Must be called from within a Runneth conversation context so that
    motion analyze-media can find the file in ./uploads/.
    """
    if uploads_dir is None:
        uploads_dir = Path(os.environ.get("UPLOADS_DIR", "./uploads"))

    if not video_path.exists():
        print(f"ERROR: Video not found: {video_path}", file=sys.stderr)
        return 0

    source_filename = video_path.name
    print(f"\n{'='*60}")
    print(f"Processing: {source_filename}")
    if folder_name:
        print(f"Concept: {folder_name}")

    duration = get_video_duration(video_path)
    print(f"Duration: {duration:.1f}s")

    register_source_video(filename=source_filename, file_path=str(video_path),
                          folder_name=folder_name)

    uploads_copy = Path(uploads_dir) / source_filename
    with open(str(video_path), 'rb') as src, open(str(uploads_copy), 'wb') as dst:
        while chunk := src.read(8 * 1024 * 1024):
            dst.write(chunk)

    # Write 'processing' status so the app status header can surface it
    update_source_video_status(source_filename, "processing")

    try:
        prompt = build_prompt(folder_name or "", object_taxonomy)
        print("Running shot segmentation via analyze-media...")
        result = subprocess.run(
            ["motion", "analyze-media", "--filename", source_filename, "--prompt", prompt],
            capture_output=True, text=True, timeout=300
        )
        if result.returncode != 0:
            print(f"ERROR: analyze-media failed:\n{result.stderr}", file=sys.stderr)
            update_source_video_status(source_filename, "error")
            return 0

        raw_output = result.stdout.strip()
        print(f"Got response ({len(raw_output)} chars). Parsing shots...")
        shots_raw = extract_json_from_response(raw_output)

        if shots_raw is None:
            debug_path = Path("{{BRAIN_PATH}}") / f"debug_{source_filename}.txt"
            debug_path.write_text(raw_output)
            print(f"ERROR: Could not parse JSON. Raw response saved to {debug_path}",
                  file=sys.stderr)
            update_source_video_status(source_filename, "parse_error")
            return 0

        print(f"Parsed {len(shots_raw)} shot(s). Validating...")

        normalized = []
        for raw in shots_raw:
            n = normalize_shot(raw, str(video_path), source_filename,
                               folder_name or "", duration)
            if n:
                normalized.append(n)
            else:
                print(f"  Skipped malformed shot: {raw}", file=sys.stderr)

        normalized.sort(key=lambda s: s["timecode_start"])
        bogus = detect_summary_rows(normalized)
        if bogus:
            for idx in bogus:
                s = normalized[idx]
                print(f"  SUMMARY-ROW DETECTED and discarded: "
                      f"{s['timecode_start']:.1f}s–{s['timecode_end']:.1f}s subsumes "
                      f"2+ subsequent shots")
            normalized = [s for i, s in enumerate(normalized) if i not in bogus]

        # Import here to avoid circular imports
        from embed_onnx import embed as onnx_embed
        import numpy as np

        written = 0
        for shot in normalized:
            shot_id = insert_shot(shot)
            if shot.get("description"):
                try:
                    vec = onnx_embed(shot["description"])
                    conn = __import__('asset_db').get_conn()
                    conn.execute("UPDATE shots SET embedding=? WHERE id=?",
                                 (vec.tobytes(), shot_id))
                    conn.commit()
                    conn.close()
                except Exception as e:
                    print(f"  Embedding failed for shot {shot_id}: {e}", file=sys.stderr)
            written += 1

        print(f"Wrote {written} shots.")
        update_source_video_status(source_filename, "done", written)
        return written

    finally:
        if uploads_copy.exists():
            uploads_copy.unlink()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("video_path")
    parser.add_argument("--folder-name", default=None)
    parser.add_argument("--uploads-dir", default=None)
    parser.add_argument("--object-taxonomy", default=None)
    args = parser.parse_args()

    init_db()
    count = process_video(
        video_path=Path(args.video_path),
        folder_name=args.folder_name,
        uploads_dir=Path(args.uploads_dir) if args.uploads_dir else None,
        object_taxonomy=args.object_taxonomy,
    )
    print(f"\nDone. {count} shots written.")
