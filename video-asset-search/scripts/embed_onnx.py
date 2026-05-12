"""
embed_onnx.py — ONNX-unified embedding for bge-small-en-v1.5.

Uses the same ONNX model file that @xenova/transformers loads in the browser,
so Python-side and WASM-side vectors are computed by the same graph and are
bit-identical. Suitable for both agent-path query embedding and pipeline
backfill embedding.

Model files must exist at {{BRAIN_PATH}}/models/bge-small-en-v1.5/
(downloaded automatically during post-install).
"""

import os
import warnings
import numpy as np
from pathlib import Path

os.environ["ORT_LOGGING_LEVEL"] = "3"
warnings.filterwarnings("ignore")

MODEL_DIR      = "{{BRAIN_PATH}}/models/bge-small-en-v1.5"
ONNX_PATH      = f"{MODEL_DIR}/onnx/model.onnx"
TOKENIZER_PATH = f"{MODEL_DIR}/tokenizer.json"

_session   = None
_tokenizer = None
_db_path   = "{{BRAIN_PATH}}/{{DB_FILENAME}}"


def _get_session():
    global _session
    if _session is None:
        import onnxruntime as ort
        opts = ort.SessionOptions()
        opts.log_severity_level = 3
        _session = ort.InferenceSession(ONNX_PATH, sess_options=opts)
    return _session


def _get_tokenizer():
    global _tokenizer
    if _tokenizer is None:
        from tokenizers import Tokenizer
        tok = Tokenizer.from_file(TOKENIZER_PATH)
        tok.enable_truncation(max_length=512)
        tok.no_padding()
        _tokenizer = tok
    return _tokenizer


def embed(text: str) -> np.ndarray:
    """
    Embed a single string. Returns a float32 numpy array of shape (384,),
    L2-normalised. Matches the output of @xenova/transformers with
    { pooling: 'mean', normalize: true } on the same model.
    """
    tok     = _get_tokenizer()
    session = _get_session()
    enc = tok.encode(text)

    input_ids      = np.array([enc.ids],           dtype=np.int64)
    attention_mask = np.array([enc.attention_mask], dtype=np.int64)
    token_type_ids = np.zeros_like(input_ids)

    outputs = session.run(None, {
        "input_ids":      input_ids,
        "attention_mask": attention_mask,
        "token_type_ids": token_type_ids,
    })

    token_embeddings = outputs[0]
    mask    = attention_mask[..., np.newaxis].astype(np.float32)
    mean_emb = (np.sum(token_embeddings * mask, axis=1) / np.sum(mask, axis=1))[0]
    norm = np.linalg.norm(mean_emb)
    return (mean_emb / norm).astype(np.float32)


def load_all_embeddings() -> tuple[list[str], np.ndarray]:
    """
    Load all shot IDs and their stored embeddings from the DB.
    Returns (ids, matrix) where matrix is shape (N, 384), float32.
    Used by query_shots for bulk cosine similarity.
    """
    import sqlite3
    conn = sqlite3.connect(_db_path)
    rows = conn.execute(
        "SELECT id, embedding FROM shots WHERE embedding IS NOT NULL"
    ).fetchall()
    conn.close()

    if not rows:
        return [], np.empty((0, 384), dtype=np.float32)

    ids    = [r[0] for r in rows]
    matrix = np.stack([
        np.frombuffer(r[1], dtype=np.float32) for r in rows
    ]).astype(np.float32)
    return ids, matrix


if __name__ == "__main__":
    import sys
    text = sys.argv[1] if len(sys.argv) > 1 else "A test sentence."
    vec = embed(text)
    print(f"shape={vec.shape}  norm={np.linalg.norm(vec):.6f}")
    print(f"first 5 dims: {vec[:5]}")
