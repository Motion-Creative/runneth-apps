from __future__ import annotations

import argparse
import importlib
import os
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock


TOOL_ROOT = Path(__file__).resolve().parents[1] / "tool"
sys.path.insert(0, str(TOOL_ROOT))

from corpus_search import cli  # noqa: E402
from corpus_search.errors import CorpusSearchError  # noqa: E402
from corpus_search.paths import WorkspacePaths  # noqa: E402
from corpus_search.refresh import refresh_all, refresh_source  # noqa: E402
from corpus_search.search import search  # noqa: E402
from corpus_search.store import connect, ensure_vec_table, stats, vector_blob  # noqa: E402


search_module = importlib.import_module("corpus_search.search")


class WorkspaceCorpusTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.state_root = self.root / "state"
        self.legacy = self.root / "legacy" / "corpus.db"
        self.env = mock.patch.dict(
            os.environ,
            {
                "CORPUS_SEARCH_STATE_ROOT": str(self.state_root),
                "CORPUS_SEARCH_LEGACY_DB": str(self.legacy),
            },
            clear=False,
        )
        self.env.start()

    def tearDown(self) -> None:
        self.env.stop()
        self.temp.cleanup()

    def _source_dir(self, name: str) -> Path:
        path = self.root / name
        path.mkdir()
        return path

    def _add_source(self, workspace_id: str, source: Path, *, name: str = "notes", kind: str = "note") -> None:
        cli.cmd_source_add(
            argparse.Namespace(
                workspace_id=workspace_id,
                name=name,
                path=str(source),
                kind=kind,
                pattern="**/*.md",
            )
        )

    def test_workspace_stores_and_queries_are_isolated(self) -> None:
        alpha_source = self._source_dir("alpha")
        beta_source = self._source_dir("beta")
        alpha_source.joinpath("alpha.md").write_text(
            "# Alpha\n\nThe cobalt launch uses a lighthouse visual and a bright bottle.",
            encoding="utf-8",
        )
        beta_source.joinpath("beta.md").write_text(
            "# Beta\n\nThe saffron retention plan focuses on subscription pauses.",
            encoding="utf-8",
        )
        self._add_source("workspace-alpha", alpha_source)
        self._add_source("workspace-beta", beta_source)
        for workspace_id in ("workspace-alpha", "workspace-beta"):
            paths = WorkspacePaths.resolve(workspace_id, create=True)
            connection = connect(paths)
            refresh_all(connection, paths, embed=False)
            connection.close()

        alpha_paths = WorkspacePaths.resolve("workspace-alpha")
        beta_paths = WorkspacePaths.resolve("workspace-beta")
        self.assertNotEqual(alpha_paths.db, beta_paths.db)
        alpha_db = connect(alpha_paths)
        beta_db = connect(beta_paths)
        alpha_result = search(alpha_db, alpha_paths, "cobalt lighthouse", top_k=5, mode="lexical", rerank_mode="off")
        beta_result = search(beta_db, beta_paths, "cobalt lighthouse", top_k=5, mode="lexical", rerank_mode="off")
        alpha_db.close()
        beta_db.close()
        self.assertEqual(len(alpha_result["hits"]), 1)
        self.assertEqual(beta_result["hits"], [])

    def test_metadata_filter_disable_and_stale_pruning(self) -> None:
        source = self._source_dir("library")
        first = source / "first.md"
        second = source / "second.md"
        first.write_text(
            "---\nbrand: Acme\nevent_at: 2026-08-01\n---\n# Hook\n\nGolden hour bottle close-up with a strong opening line.",
            encoding="utf-8",
        )
        second.write_text(
            "---\nbrand: Other\n---\n# Hook\n\nA studio product shot with a quiet voiceover.",
            encoding="utf-8",
        )
        self._add_source("workspace", source, name="creative", kind="video-summary")
        paths = WorkspacePaths.resolve("workspace")
        connection = connect(paths)
        report, code = refresh_all(connection, paths, embed=False)
        self.assertEqual(code, 0)
        self.assertFalse(report["partial"])
        initial_chunks = stats(connection, paths)["chunksTotal"]
        unchanged, code = refresh_all(connection, paths, embed=False)
        self.assertEqual(code, 0)
        self.assertEqual(unchanged["sources"][0]["filesChanged"], 0)
        self.assertEqual(unchanged["sources"][0]["filesSkipped"], 2)
        self.assertEqual(stats(connection, paths)["chunksTotal"], initial_chunks)
        filtered = search(
            connection,
            paths,
            "bottle opening",
            top_k=10,
            metadata=(("brand", "Acme"),),
            mode="lexical",
            rerank_mode="off",
        )
        self.assertEqual([hit["relativePath"] for hit in filtered["hits"]], ["first.md"])

        first.unlink()
        report, code = refresh_all(connection, paths, embed=False)
        self.assertEqual(code, 0)
        self.assertEqual(report["sources"][0]["assetsDeleted"], 1)
        self.assertEqual(stats(connection, paths)["assetsTotal"], 1)

        connection.execute("UPDATE source SET enabled=0 WHERE name='creative'")
        connection.commit()
        disabled = search(connection, paths, "studio product", top_k=10, mode="lexical", rerank_mode="off")
        self.assertEqual(disabled["hits"], [])
        connection.close()

    def test_missing_source_preserves_last_good_index(self) -> None:
        source = self._source_dir("temporary")
        source.joinpath("note.md").write_text("# Keep me\n\nDurable indexed content.", encoding="utf-8")
        self._add_source("workspace", source)
        paths = WorkspacePaths.resolve("workspace")
        connection = connect(paths)
        refresh_all(connection, paths, embed=False)
        source.rename(self.root / "moved")
        report, code = refresh_all(connection, paths, embed=False)
        self.assertEqual(code, 3)
        self.assertEqual(report["sources"][0]["errors"], ["source directory is missing or unreadable"])
        self.assertEqual(stats(connection, paths)["assetsTotal"], 1)
        connection.close()

    def test_expired_deadline_is_resumable_and_does_not_prune(self) -> None:
        source = self._source_dir("deadline")
        source.joinpath("note.md").write_text("# Note\n\nContent remains available.", encoding="utf-8")
        self._add_source("workspace", source)
        paths = WorkspacePaths.resolve("workspace")
        connection = connect(paths)
        source_row = connection.execute("SELECT * FROM source").fetchone()
        partial = refresh_source(connection, source_row, deadline=time.monotonic() - 1)
        self.assertFalse(partial["complete"])
        self.assertEqual(partial["pendingReason"], "runtime_deadline")
        complete = refresh_source(connection, source_row, deadline=None)
        self.assertTrue(complete["complete"])
        connection.close()

    def test_source_remove_needs_confirmation_and_never_deletes_markdown(self) -> None:
        source = self._source_dir("remove")
        markdown = source / "note.md"
        markdown.write_text("# Note\n\nSearchable content.", encoding="utf-8")
        self._add_source("workspace", source)
        paths = WorkspacePaths.resolve("workspace")
        connection = connect(paths)
        refresh_all(connection, paths, embed=False)
        connection.close()
        with self.assertRaisesRegex(Exception, "confirmation"):
            cli.cmd_source_remove(argparse.Namespace(workspace_id="workspace", name="notes", yes=False))
        result, code = cli.cmd_source_remove(
            argparse.Namespace(workspace_id="workspace", name="notes", yes=True)
        )
        self.assertEqual(code, 0)
        self.assertEqual(result["sourceFilesDeleted"], 0)
        self.assertTrue(markdown.exists())

    def test_auto_query_falls_back_to_bm25(self) -> None:
        source = self._source_dir("fallback")
        source.joinpath("note.md").write_text("# Insight\n\nCustomers wanted a softer onboarding email.", encoding="utf-8")
        self._add_source("workspace", source)
        paths = WorkspacePaths.resolve("workspace")
        connection = connect(paths)
        refresh_all(connection, paths, embed=False)
        result = search(connection, paths, "softer onboarding", top_k=5, mode="auto", rerank_mode="auto")
        connection.close()
        self.assertEqual(result["effectiveMode"], "bm25")
        self.assertTrue(result["degraded"])
        self.assertEqual(result["degradedReasons"][0]["code"], "vector_index_missing")
        self.assertEqual(len(result["hits"]), 1)

    def test_hybrid_search_uses_rrf_and_keeps_lexical_fallback_independent(self) -> None:
        source = self._source_dir("hybrid")
        source.joinpath("lexical.md").write_text(
            "# Exact\n\nThe lexicalneedle appears in this passage.", encoding="utf-8"
        )
        source.joinpath("semantic.md").write_text(
            "# Meaning\n\nA conceptually related passage without the literal term.", encoding="utf-8"
        )
        self._add_source("workspace", source)
        paths = WorkspacePaths.resolve("workspace")
        connection = connect(paths)
        refresh_all(connection, paths, embed=False)
        rows = connection.execute(
            "SELECT c.chunk_id, a.relative_path FROM chunk c "
            "JOIN asset a ON a.asset_id=c.asset_id ORDER BY a.relative_path"
        ).fetchall()
        lexical_id = next(int(row["chunk_id"]) for row in rows if row["relative_path"] == "lexical.md")
        semantic_id = next(int(row["chunk_id"]) for row in rows if row["relative_path"] == "semantic.md")
        connection.execute(
            "UPDATE chunk SET embedded_at=CURRENT_TIMESTAMP, embed_model='test', embed_dim=256"
        )
        connection.commit()

        vector_rows = [
            {"chunk_id": lexical_id, "distance": 0.1},
            {"chunk_id": semantic_id, "distance": 0.2},
        ]
        with (
            mock.patch.object(search_module, "vec_table_exists", return_value=True),
            mock.patch.object(search_module, "load_sqlite_vec", return_value="0.1.9"),
            mock.patch.object(search_module, "embed_texts", return_value=[[0.0] * 256]),
            mock.patch.object(search_module, "_vector", return_value=vector_rows),
        ):
            result = search(
                connection,
                paths,
                "lexicalneedle",
                top_k=5,
                mode="hybrid",
                rerank_mode="off",
            )
        connection.close()
        self.assertEqual(result["effectiveMode"], "hybrid")
        self.assertFalse(result["degraded"])
        self.assertEqual([hit["relativePath"] for hit in result["hits"]], ["lexical.md", "semantic.md"])
        self.assertEqual(result["hits"][0]["bm25Rank"], 1)
        self.assertEqual(result["hits"][0]["vectorRank"], 1)
        self.assertIsNone(result["hits"][1]["bm25Rank"])
        self.assertEqual(result["hits"][1]["vectorRank"], 2)

    def test_embedding_dimension_mismatch_requires_explicit_rebuild(self) -> None:
        paths = WorkspacePaths.resolve("workspace", create=True)
        connection = connect(paths)
        connection.execute(
            "INSERT INTO embedding_config(id, model, dimensions) VALUES (1, 'old-model', 99)"
        )
        connection.commit()
        with mock.patch("corpus_search.store.load_sqlite_vec", return_value="0.1.9"):
            with self.assertRaisesRegex(Exception, "embeddings rebuild") as error:
                ensure_vec_table(connection)
        connection.close()
        self.assertEqual(error.exception.code, "embedding_config_mismatch")

    def test_dependency_loss_preserves_bm25_results(self) -> None:
        source = self._source_dir("dependency-loss")
        source.joinpath("note.md").write_text(
            "# Durable\n\nThe local fallback keeps this amber signal searchable.",
            encoding="utf-8",
        )
        self._add_source("workspace", source)
        paths = WorkspacePaths.resolve("workspace")
        connection = connect(paths)
        refresh_all(connection, paths, embed=False)
        connection.execute(
            "UPDATE chunk SET embedded_at=CURRENT_TIMESTAMP, embed_model='test', embed_dim=256"
        )
        connection.commit()
        with (
            mock.patch.object(search_module, "vec_table_exists", return_value=True),
            mock.patch.object(
                search_module,
                "load_sqlite_vec",
                side_effect=CorpusSearchError(
                    "sqlite-vec cache is unavailable",
                    code="sqlite_vec_missing",
                    exit_code=4,
                ),
            ),
        ):
            result = search(
                connection,
                paths,
                "amber signal",
                top_k=5,
                mode="auto",
                rerank_mode="auto",
            )
        connection.close()
        self.assertEqual(result["effectiveMode"], "bm25")
        self.assertEqual(result["degradedReasons"][0]["code"], "sqlite_vec_missing")
        self.assertEqual(len(result["hits"]), 1)

    def test_doctor_reports_legacy_database_without_modifying_it(self) -> None:
        self.legacy.parent.mkdir(parents=True)
        self.legacy.write_bytes(b"archive-era-database")
        before = self.legacy.read_bytes()
        result, code = cli.cmd_doctor(
            argparse.Namespace(workspace_id="workspace", repair=False)
        )
        self.assertEqual(code, 0)
        self.assertTrue(result["checks"]["legacyDatabaseDetected"])
        self.assertEqual(result["checks"]["legacyDatabasePath"], str(self.legacy.resolve()))
        self.assertEqual(self.legacy.read_bytes(), before)

    def test_no_query_log_table_exists(self) -> None:
        paths = WorkspacePaths.resolve("workspace", create=True)
        connection = connect(paths)
        table = connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='query_log'"
        ).fetchone()
        connection.close()
        self.assertIsNone(table)


@unittest.skipUnless(__import__("importlib").util.find_spec("sqlite_vec"), "sqlite-vec is not installed")
class VectorIntegrationTests(unittest.TestCase):
    def test_sqlite_vec_table_accepts_pinned_dimension(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir, mock.patch.dict(
            os.environ,
            {"CORPUS_SEARCH_STATE_ROOT": str(Path(temp_dir) / "state")},
            clear=False,
        ):
            paths = WorkspacePaths.resolve("workspace", create=True)
            connection = connect(paths)
            if not hasattr(connection, "enable_load_extension"):
                connection.close()
                self.skipTest("this host Python cannot load SQLite extensions")
            version = ensure_vec_table(connection)
            row = connection.execute(
                "SELECT model, dimensions FROM embedding_config WHERE id=1"
            ).fetchone()
            connection.execute(
                "INSERT INTO chunk_vec(rowid, embedding) VALUES (?, ?)",
                (1, vector_blob([0.0] * 256)),
            )
            nearest = connection.execute(
                "SELECT rowid, distance FROM chunk_vec "
                "WHERE embedding MATCH ? AND k=1 ORDER BY distance",
                (vector_blob([0.0] * 256),),
            ).fetchone()
            connection.close()
        self.assertTrue(version)
        self.assertEqual(row["dimensions"], 256)
        self.assertEqual(nearest["rowid"], 1)
        self.assertAlmostEqual(nearest["distance"], 0.0)


if __name__ == "__main__":
    unittest.main()
