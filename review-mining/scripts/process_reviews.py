#!/usr/bin/env python3
"""
process_reviews.py — review-mining-init
=========================================
Reads paginated JSON pages from /tmp/rl_page_N.json, scores and tags every
review, writes markdown files to BRAIN_PATH/product-slug/review_id.md,
writes _meta.json and _index.md, and emits a JSON summary to stdout.

Optionally writes an app cache JSON when --cache-output is supplied.

Usage:
    python3 process_reviews.py --config /tmp/rl_config.json
    python3 process_reviews.py --config /tmp/rl_config.json \
        --cache-output /agent/apps/review-library/server/src/reviews-cache.json
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, date as date_type


# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------

def get_path(obj, path):
    """Walk a dotted path into a nested dict safely. Returns None on any miss."""
    if not path:
        return None
    cur = obj
    for part in path.split('.'):
        if not isinstance(cur, dict):
            return None
        cur = cur.get(part)
    return cur


# ---------------------------------------------------------------------------
# Product slug / display
# ---------------------------------------------------------------------------

def make_product_slug(raw_name):
    base = (raw_name or '').split(' - ')[0].split(' | ')[0].strip().lower()
    slug = re.sub(r'[^a-z0-9]+', '-', base).strip('-')
    return slug[:40] or 'other'


def make_product_display(raw_name):
    return (raw_name or '').split(' - ')[0].split(' | ')[0].strip() or 'Other'


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def score_body(body):
    """Return integer score 1-5. Score 1 means skip."""
    if not body or not body.strip():
        return 1
    n = len(body.strip())
    if n < 20:
        return 1
    if n < 60:
        return 2
    if n < 150:
        return 3
    if n < 400:
        return 4
    return 5


# ---------------------------------------------------------------------------
# Tagging
# ---------------------------------------------------------------------------

TAGS_KEYWORDS = {
    'pain-point': [
        'struggling', 'tried everything', 'for years', "couldn't",
        'suffering', 'chronic', 'desperate', 'nothing worked',
        'painful', 'miserable', 'never been able',
    ],
    'trigger-moment': [
        'decided to try', 'gave it a try', 'heard about', 'saw it on',
        'recommended', 'podcast', 'instagram', 'finally decided',
        'after my', 'last resort',
    ],
    'objection': [
        'skeptical', "wasn't sure", "almost didn't", 'hesitant',
        'wasted money', "thought it wouldn't", "didn't believe",
        'gimmick', 'overpriced', 'too expensive',
    ],
    'transformation': [
        'since starting', 'noticed a difference', 'changed my',
        'no longer', 'improved', 'helped me', 'game changer',
        'never going back', 'feel like myself', 'so much better',
        'life changing',
    ],
    'standout-language': [
        'like a weed', 'could cry', 'never turned off',
        'sleep like the dead', 'first time in years',
        'will never be without', 'i never leave reviews',
        'changed my life',
    ],
}


def tag_review(body, score):
    """Return list of tag strings. Falls back to ['untagged']."""
    lower = body.lower()
    tags = []

    # Score-5 automatically gets standout-language
    if score == 5:
        tags.append('standout-language')

    for tag, keywords in TAGS_KEYWORDS.items():
        if tag == 'standout-language' and 'standout-language' in tags:
            continue
        for kw in keywords:
            if kw in lower:
                tags.append(tag)
                break

    return tags if tags else ['untagged']


# ---------------------------------------------------------------------------
# Utility sentence
# ---------------------------------------------------------------------------

def utility_sentence(tags, score, body):
    if score == 5 and 'standout-language' in tags:
        excerpt = body.strip()[:80]
        return f'Verbatim hook candidate -- ad-ready language; excerpt: "{excerpt}..."'
    if score >= 4 and 'transformation' in tags:
        return 'Strong transformation proof -- feeds before/after hook structures.'
    if score >= 4 and 'pain-point' in tags:
        return 'High-signal pain-point -- useful for hook and audience framing.'
    if 'trigger-moment' in tags:
        return 'Trigger-moment signal -- captures purchase catalyst.'
    if 'objection' in tags:
        return 'Objection signal -- feeds risk-reversal and objection-handling copy.'
    return 'Pattern confirmation signal -- useful for validating existing creative angles.'


# ---------------------------------------------------------------------------
# Date parsing
# ---------------------------------------------------------------------------

def parse_date(value):
    """Return YYYY-MM-DD string or None."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        try:
            return datetime.utcfromtimestamp(value).strftime('%Y-%m-%d')
        except Exception:
            return None
    s = str(value).strip()
    try:
        return datetime.fromisoformat(s[:19]).strftime('%Y-%m-%d')
    except Exception:
        pass
    for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d'):
        try:
            return datetime.strptime(s, fmt).strftime('%Y-%m-%d')
        except Exception:
            pass
    return s[:10] if len(s) >= 10 else None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Process review JSON pages into scored/tagged markdown files.'
    )
    parser.add_argument('--config', required=True, help='Path to JSON config file')
    parser.add_argument(
        '--cache-output', default=None,
        help='Optional path to write app reviews-cache.json'
    )
    args = parser.parse_args()

    with open(args.config) as f:
        cfg = json.load(f)

    brain_path              = cfg['BRAIN_PATH']
    date_cutoff             = cfg.get('DATE_CUTOFF', 'all')
    source_label            = cfg.get('SOURCE_LABEL', 'unknown')
    api_base_url            = cfg.get('API_BASE_URL', '')
    reviews_list_path       = cfg.get('REVIEWS_LIST_PATH', 'data')
    field_id                = cfg.get('FIELD_ID', 'id')
    field_body              = cfg.get('FIELD_BODY', 'body')
    field_rating            = cfg.get('FIELD_RATING', 'rating')
    field_date              = cfg.get('FIELD_DATE', 'created_at')
    field_product_name      = cfg.get('FIELD_PRODUCT_NAME', 'product.name')
    field_product_fallback  = cfg.get('FIELD_PRODUCT_FALLBACK', 'target_title')
    field_verified          = cfg.get('FIELD_VERIFIED', 'verified_buyer')
    field_state             = cfg.get('FIELD_STATE', '')

    today = date_type.today().strftime('%Y-%m-%d')

    # Parse cutoff date
    cutoff = None
    if date_cutoff and date_cutoff.lower() != 'all':
        try:
            cutoff = datetime.fromisoformat(date_cutoff).date()
        except Exception:
            pass

    # Load all page files written by SKILL.md pagination loop
    all_reviews = []
    page_num = 1
    while True:
        page_file = f'/tmp/rl_page_{page_num}.json'
        if not os.path.exists(page_file):
            break
        with open(page_file) as f:
            data = json.load(f)
        chunk = get_path(data, reviews_list_path)
        if not chunk or not isinstance(chunk, list):
            break
        all_reviews.extend(chunk)
        page_num += 1

    # -----------------------------------------------------------------------
    # Process reviews
    # -----------------------------------------------------------------------

    written          = 0
    skipped_score    = 0
    skipped_state    = 0
    skipped_existing = 0
    missing_ids      = []
    cache_rows       = []

    score_dist    = {}
    tag_dist      = {}
    product_stats = {}   # slug -> {display, total, quality (score >= 3)}
    standout_count = 0
    dates_seen    = []

    for r in all_reviews:

        # State filter
        if field_state:
            sv = get_path(r, field_state)
            if sv is not None and str(sv).lower() != 'published':
                skipped_state += 1
                continue

        # Required fields
        review_id = get_path(r, field_id)
        body      = get_path(r, field_body)
        rating    = get_path(r, field_rating)
        date_raw  = get_path(r, field_date)

        if not review_id or body is None or rating is None:
            missing_ids.append(str(review_id or 'unknown'))
            continue

        body_str    = str(body).strip()
        review_date = parse_date(date_raw)

        # Date cutoff
        if cutoff and review_date:
            try:
                if datetime.fromisoformat(review_date).date() < cutoff:
                    continue
            except Exception:
                pass

        # Score
        sc = score_body(body_str)
        if sc <= 1:
            skipped_score += 1
            continue

        # Product
        raw_pname = (
            get_path(r, field_product_name)
            or get_path(r, field_product_fallback)
            or ''
        ).strip()
        pslug = make_product_slug(raw_pname)
        pdisp = make_product_display(raw_pname)

        # Tags + utility
        tags    = tag_review(body_str, sc)
        utility = utility_sentence(tags, sc, body_str)

        # Verified buyer
        verified_val = get_path(r, field_verified) if field_verified else False
        verified     = bool(verified_val)

        # File path
        file_dir  = os.path.join(brain_path, pslug)
        file_path = os.path.join(file_dir, f'{review_id}.md')

        if os.path.exists(file_path):
            skipped_existing += 1
            continue

        os.makedirs(file_dir, exist_ok=True)

        tags_yaml = '[' + ', '.join(tags) + ']'
        content = (
            f'---\n'
            f'score: {sc}\n'
            f'tags: {tags_yaml}\n'
            f'product: {pdisp}\n'
            f'source: {source_label}\n'
            f'review_date: {review_date or "unknown"}\n'
            f'date_ingested: {today}\n'
            f'rating: {int(float(str(rating)))}\n'
            f'verified_buyer: {str(verified).lower()}\n'
            f'---\n\n'
            f'{body_str}\n\n'
            f'{utility}\n'
        )

        with open(file_path, 'w', encoding='utf-8') as fh:
            fh.write(content)

        written += 1

        score_dist[sc] = score_dist.get(sc, 0) + 1
        for tag in tags:
            tag_dist[tag] = tag_dist.get(tag, 0) + 1
        if 'standout-language' in tags:
            standout_count += 1
        if review_date:
            dates_seen.append(review_date)

        if pslug not in product_stats:
            product_stats[pslug] = {'display': pdisp, 'total': 0, 'quality': 0}
        product_stats[pslug]['total'] += 1
        if sc >= 3:
            product_stats[pslug]['quality'] += 1

        if args.cache_output:
            cache_rows.append({
                'id':            str(review_id),
                'product':       pdisp,
                'productSlug':   pslug,
                'score':         sc,
                'tags':          tags,
                'rating':        int(float(str(rating))),
                'verifiedBuyer': verified,
                'reviewDate':    review_date or 'unknown',
                'dateIngested':  today,
                'body':          body_str,
                'utility':       utility,
            })

    # -----------------------------------------------------------------------
    # _meta.json
    # -----------------------------------------------------------------------

    dates_seen.sort()
    last_review_date = dates_seen[-1] if dates_seen else today

    meta = {
        'last_run':         today,
        'last_review_date': last_review_date,
        'total_files':      written,
        'date_cutoff':      date_cutoff,
        'source':           source_label,
        'api_base_url':     api_base_url,
        'note':             f'Initialised by review-mining-init on {today}.',
    }
    os.makedirs(brain_path, exist_ok=True)
    with open(os.path.join(brain_path, '_meta.json'), 'w') as fh:
        json.dump(meta, fh, indent=2)

    # -----------------------------------------------------------------------
    # _index.md
    # -----------------------------------------------------------------------

    date_range_str = (
        f'{dates_seen[0]} to {dates_seen[-1]}' if dates_seen else 'n/a'
    )

    folder_rows = '| Slug | Display Name | Files |\n|---|---|---|\n'
    for slug, info in sorted(product_stats.items()):
        folder_rows += f'| `{slug}` | {info["display"]} | {info["total"]} |\n'

    score_rows = '| Score | Count |\n|---|---|\n'
    for sc in sorted(score_dist.keys()):
        score_rows += f'| {sc} | {score_dist[sc]} |\n'

    tag_rows = '| Tag | Count |\n|---|---|\n'
    for tag, count in sorted(tag_dist.items(), key=lambda x: -x[1]):
        tag_rows += f'| {tag} | {count} |\n'

    index_md = f"""# Review Mining Index

**Source:** {source_label}
**API Base URL:** {api_base_url}
**Date range ingested:** {date_range_str}
**Total files:** {written}
**Last run:** {today}

---

## Folder Structure

{folder_rows}
## Score Distribution

{score_rows}
## Tag Distribution

{tag_rows}---

## File Format

Each review file lives at `product-slug/review_id.md` and contains:

- **YAML frontmatter:** `score`, `tags`, `product`, `source`, `review_date`, `date_ingested`, `rating`, `verified_buyer`
- **Full verbatim review body** -- never edited or paraphrased
- **One utility sentence** indicating the creative signal type

---

## Retrieval Guide

To pull reviews for a creative brief, filter frontmatter by:

| Goal | Filter |
|---|---|
| Ad-ready copy | `score: 5` + `tags: standout-language` |
| Before/after hooks | `tags: transformation` |
| Audience framing | `tags: pain-point` |
| Purchase catalyst | `tags: trigger-moment` |
| Objection copy | `tags: objection` |

---

## Weekly Refresh

Run the **Weekly Review Sync** reminder. It will:
1. Read `_meta.json` for `last_review_date` and connection details
2. Pull only reviews newer than `last_review_date`
3. Score, tag, and write new files -- no overwrites of existing files
4. Update `_meta.json` and `_index.md`
5. Rebuild the app cache if an app is configured
6. Report new reviews added, score breakdown, and any score-5 or standout-language reviews verbatim
"""

    with open(os.path.join(brain_path, '_index.md'), 'w') as fh:
        fh.write(index_md)

    # -----------------------------------------------------------------------
    # App cache (optional)
    # -----------------------------------------------------------------------

    if args.cache_output and cache_rows:
        cache_dir = os.path.dirname(args.cache_output)
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)
        with open(args.cache_output, 'w') as fh:
            json.dump(cache_rows, fh, indent=2)

    # -----------------------------------------------------------------------
    # Summary to stdout (read by SKILL.md for Step 10 report)
    # -----------------------------------------------------------------------

    low_volume = [
        slug for slug, info in product_stats.items()
        if info['quality'] < 5
    ]

    summary = {
        'written':               written,
        'skipped_score':         skipped_score,
        'skipped_state':         skipped_state,
        'skipped_existing':      skipped_existing,
        'skipped_missing_count': len(missing_ids),
        'skipped_missing_ids':   missing_ids[:20],
        'score_dist':            {str(k): v for k, v in sorted(score_dist.items())},
        'tag_dist':              tag_dist,
        'product_stats':         product_stats,
        'standout_count':        standout_count,
        'date_range': {
            'earliest': dates_seen[0] if dates_seen else None,
            'latest':   dates_seen[-1] if dates_seen else None,
        },
        'low_volume_products':   low_volume,
        'total_loaded':          len(all_reviews),
        'last_review_date':      last_review_date,
    }

    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
