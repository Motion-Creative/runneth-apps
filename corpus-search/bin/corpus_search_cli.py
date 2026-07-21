#!/usr/bin/env python3
"""corpus-search CLI entrypoint."""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

# Resolve the tool dir from this script's location.
TOOL_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(TOOL_DIR))

from lib import store as store_mod
from lib import markdown_ingest
from lib import embed_chunks
from lib import refresh as refresh_mod
from lib import search as search_mod
from lib import embed as embed_mod
from lib import config as config_mod


def cmd_status(args):
    con = store_mod.connect()
    info = store_mod.db_stats(con)
    print(json.dumps(info, indent=2))


def cmd_init(args):
    store_mod.connect()
    print(f"schema applied. db at {store_mod.DB_PATH}")


def cmd_check_endpoint(args):
    """Verify the configured embedding endpoint is reachable with current auth.

    The auth value itself never enters this process; secure-fetch injects it
    at the network layer. We do not echo the env var name in the output so
    misconfigured logs never carry it.
    """
    cfg = config_mod.load(TOOL_DIR)["embed"]
    ok, msg = store_mod.probe_endpoint(cfg["auth_env"])
    # Build the report from constants on the success path so CodeQL taint
    # analysis does not flag downstream printing.
    if ok:
        out = {"endpoint": cfg["endpoint"], "ok": True, "message": "ok"}
    else:
        out = {"endpoint": cfg["endpoint"], "ok": False, "message": str(msg)}
    print(json.dumps(out, indent=2))
    sys.exit(0 if ok else 1)


def cmd_index_markdown(args):
    con = store_mod.connect()
    source = Path(args.source).expanduser().resolve()
    if not source.exists() or not source.is_dir():
        print(f"source not found or not a directory: {source}", file=sys.stderr)
        sys.exit(2)
    t0 = time.time()
    counts = markdown_ingest.ingest_folder(
        con, source, args.kind,
        default_tenant=args.tenant, pattern=args.pattern,
        limit=args.limit, verbose=not args.quiet,
    )
    counts["elapsed_s"] = round(time.time() - t0, 1)
    print(json.dumps(counts, indent=2))


def cmd_embed(args):
    con = store_mod.connect()
    res = embed_chunks.embed_pending(
        con, model=args.model, dim=args.dim,
        batch_size=args.batch_size, max_chunks=args.max_chunks,
        verbose=not args.quiet,
    )
    print(json.dumps(res, indent=2))


def _print_hits(query, hits, timings):
    print(f"\nquery: {query!r}")
    print(f"timings: {timings}\n")
    for i, h in enumerate(hits, 1):
        ts = ""
        if h.t_start_s is not None:
            if h.t_end_s is not None and h.t_end_s != h.t_start_s:
                ts = f"  @{h.t_start_s:.0f}-{h.t_end_s:.0f}s"
            else:
                ts = f"  @{h.t_start_s:.0f}s"
        line = (
            f"{i:>2}. [{h.asset_kind}] {h.asset_title or '(untitled)'}{ts}"
            f"  ({h.asset_workspace or '-'} | {h.asset_user or '-'} | {h.asset_event_at or '-'})"
        )
        print(line)
        rank_bits = []
        if h.bm25_rank is not None: rank_bits.append(f"bm25#{h.bm25_rank}")
        if h.vec_rank is not None: rank_bits.append(f"vec#{h.vec_rank}")
        rank_bits.append(f"rrf={h.score:.4f}")
        rerank_reason = (h.extra or {}).get("rerank_reason") if getattr(h, "extra", None) else None
        print(f"     role={h.role or '-'}  {'  '.join(rank_bits)}")
        if rerank_reason:
            print(f"     why: {rerank_reason}")
        snippet = h.text.replace("\n", " ")
        if len(snippet) > 220: snippet = snippet[:220] + "..."
        print(f"     {snippet}")
        print(f"     {h.asset_raw_path}")
        print()


def cmd_query(args):
    con = store_mod.connect()
    t0 = time.time()
    cfg_rerank = config_mod.load(TOOL_DIR)["rerank"]
    # CLI flag wins; otherwise fall back to config.json default.
    rerank_flag = getattr(args, "rerank", None)
    use_rerank = cfg_rerank.get("default_on", True) if rerank_flag is None else rerank_flag
    hits, timings = search_mod.search(
        con, args.query, top_k=args.top, kind=args.kind, role=args.role,
        workspace=args.workspace, user=args.user, since=args.since, until=args.until,
        use_vector=not args.no_vector, candidate_pool=args.pool,
        use_rerank=use_rerank,
        rerank_pool=getattr(args, "rerank_pool", None) or cfg_rerank["input_pool"],
        rerank_top_k=args.top,
    )
    timings["total_ms"] = round((time.time() - t0) * 1000, 1)

    # Capture for future eval
    try:
        store_mod.log_query(
            con, query_text=args.query, kind_filter=args.kind, role_filter=args.role,
            top_k=args.top, timings=timings,
            result_chunk_ids=[h.chunk_id for h in hits],
        )
    except Exception:
        pass  # logging is best-effort

    if args.format == "json":
        out = {
            "query": args.query,
            "filters": {k: getattr(args, k) for k in ("kind", "role", "workspace", "user", "since", "until")},
            "timings": timings,
            "hits": [search_mod.hit_to_dict(h) for h in hits],
        }
        print(json.dumps(out, indent=2))
        return
    _print_hits(args.query, hits, timings)


def cmd_refresh(args):
    """Re-index every source listed in sources.json, then embed any new chunks."""
    con = store_mod.connect()
    try:
        report = refresh_mod.refresh(con, embed_after=not args.no_embed,
                                     verbose=not args.quiet)
    except FileNotFoundError as e:
        print(json.dumps({"error": str(e)}, indent=2))
        sys.exit(2)
    except Exception as e:
        print(json.dumps({"error": str(e)}, indent=2))
        sys.exit(1)
    print(json.dumps(report, indent=2))
    # Exit 3 (distinct from 0/1/2) when at least one source errored, so a
    # routine can detect partial failures without parsing JSON.
    if any(s.get("error") for s in report["per_source"]):
        sys.exit(3)


def cmd_demo(args):
    """Smoke test: run the canned demo queries against whatever's indexed."""
    con = store_mod.connect()
    info = store_mod.db_stats(con)
    if info["chunks_total"] == 0:
        print("no chunks indexed yet. run `index markdown` first.")
        sys.exit(2)

    cfg = config_mod.load(TOOL_DIR)["demo"]
    queries = args.queries or cfg["queries"]
    print(f"running {len(queries)} demo queries against {info['chunks_total']:,} chunks "
          f"({info['assets_total']:,} assets, {info['chunks_embedded']:,} embedded)...")
    for q in queries:
        hits, timings = search_mod.search(con, q, top_k=3)
        timings["total_ms"] = round(
            (timings.get("bm25_ms", 0) + timings.get("vec_ms", 0)
             + timings.get("embed_ms", 0) + timings.get("fuse_ms", 0)), 1
        )
        _print_hits(q, hits, timings)


def main(argv=None):
    p = argparse.ArgumentParser(prog="corpus-search")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init", help="apply schema, create empty DB").set_defaults(func=cmd_init)
    sub.add_parser("status", help="db health snapshot").set_defaults(func=cmd_status)
    sub.add_parser("check-endpoint", help="verify the embedding endpoint is reachable with current auth").set_defaults(func=cmd_check_endpoint)

    pi = sub.add_parser("index", help="ingest a corpus")
    pi_sub = pi.add_subparsers(dest="kind_cmd", required=True)
    pi_md = pi_sub.add_parser("markdown", help="ingest a folder of markdown files")
    pi_md.add_argument("--source", required=True, help="folder of .md files")
    pi_md.add_argument("--kind", required=True, help="asset kind tag (free-form, e.g. video-summary, brief, gong-call)")
    pi_md.add_argument("--tenant", default=None, help="optional tenant_id stamp")
    pi_md.add_argument("--pattern", default="**/*.md", help="glob pattern relative to --source")
    pi_md.add_argument("--limit", type=int, default=None)
    pi_md.add_argument("--quiet", action="store_true")
    pi_md.set_defaults(func=cmd_index_markdown)

    pe = sub.add_parser("embed", help="embed any unembedded chunks")
    pe.add_argument("--model", default=None, help="override config embed.model")
    pe.add_argument("--dim", type=int, default=None, help="override config embed.dim")
    pe.add_argument("--batch-size", type=int, default=None, help="override config embed.batch_size")
    pe.add_argument("--max-chunks", type=int, default=None)
    pe.add_argument("--quiet", action="store_true")
    pe.set_defaults(func=cmd_embed)

    pq = sub.add_parser("query", help="hybrid search")
    pq.add_argument("query", type=str)
    pq.add_argument("--top", type=int, default=15)
    pq.add_argument("--kind", default=None)
    pq.add_argument("--role", default=None)
    pq.add_argument("--workspace", default=None)
    pq.add_argument("--user", default=None)
    pq.add_argument("--since", default=None, help="ISO date, asset.event_at >= since")
    pq.add_argument("--until", default=None)
    pq.add_argument("--pool", type=int, default=None, help="candidate pool size per leg")
    pq.add_argument("--no-vector", action="store_true", help="BM25 only")
    # Rerank is on by default (config rerank.default_on). --rerank forces on,
    # --no-rerank forces off. If neither is set, the config default applies.
    pq.add_argument("--rerank", dest="rerank", action="store_true", default=None,
                    help="force the LLM rerank pass on (default already on per config)")
    pq.add_argument("--no-rerank", dest="rerank", action="store_false",
                    help="skip the LLM rerank pass for this query (faster, free, less precise)")
    pq.add_argument("--rerank-pool", type=int, default=None,
                    help="how many hybrid candidates to feed the reranker (default: config rerank.input_pool)")
    pq.add_argument("--format", choices=["human", "json"], default="human")
    pq.set_defaults(func=cmd_query)

    pr = sub.add_parser("refresh", help="index every source in sources.json, then embed (idempotent)")
    pr.add_argument("--no-embed", action="store_true", help="only re-ingest, skip the embed pass")
    pr.add_argument("--quiet", action="store_true")
    pr.set_defaults(func=cmd_refresh)

    pd = sub.add_parser("demo", help="run sample queries to smoke-test the install")
    pd.add_argument("--queries", nargs="*", default=None, help="override the canned queries")
    pd.set_defaults(func=cmd_demo)

    args = p.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
