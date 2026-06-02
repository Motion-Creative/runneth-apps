#!/usr/bin/env python3
"""motion-whoami-neon.py — Resolve user_email from the Neon agent_conversation table.

Usage:
  secret run --env DATABASE_URL=NEON_DATABASE_URL -- \
    python3 motion-whoami-neon.py <conversation_id>

Output (stdout, success):
  {"user_email": "...", "workspace_id": "...", "organization_id": "...", "mondrian_user_id": "..."}

Exit codes:
  0 - success, prints JSON
  1 - missing args or DATABASE_URL not in env
  7 - conversation row not found or user_email is empty (recoverable miss)
  8 - Neon connection or query failed

Read-only by intent. Same query shape as /agent/tools/admin/_neon_resolve_conv.py
but returns only the identity columns without doing the workspace-map join, so
the calling shell script can do its own light or strict resolution on top.
"""
import os
import sys
import json

sys.path.insert(0, "/daemon/cache/python/user-base/lib/python3.11/site-packages")
try:
    import psycopg
except ImportError as e:
    print(json.dumps({"error": f"psycopg not available: {e}"}), file=sys.stderr)
    sys.exit(1)

if len(sys.argv) < 2:
    print(json.dumps({"error": "conversation_id required"}), file=sys.stderr)
    sys.exit(1)
conv_id = sys.argv[1].strip()

if not os.environ.get("DATABASE_URL"):
    print(
        json.dumps({
            "error": "DATABASE_URL not in env",
            "hint": "invoke via: secret run --env DATABASE_URL=NEON_DATABASE_URL -- python3 motion-whoami-neon.py <conversation_id>",
        }),
        file=sys.stderr,
    )
    sys.exit(1)

try:
    with psycopg.connect(os.environ["DATABASE_URL"], connect_timeout=3) as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT user_email, workspace_id, organization_id, mondrian_user_id "
            "FROM agent_conversation WHERE id = %s",
            (conv_id,),
        )
        row = cur.fetchone()
except Exception as e:
    print(json.dumps({"error": f"Neon query failed: {e}"}), file=sys.stderr)
    sys.exit(8)

if not row:
    sys.exit(7)

user_email, ws_id, org_id, mondrian_user_id = row
if not user_email:
    sys.exit(7)

print(json.dumps({
    "user_email": user_email,
    "workspace_id": ws_id,
    "organization_id": org_id,
    "mondrian_user_id": mondrian_user_id,
}))
