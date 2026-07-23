"""Embedding generation — lightweight MVP using image/text features.

Replace with CLIP + sentence-transformers when GPU/heavier deps are available.
"""

from __future__ import annotations

import hashlib
import re
from io import BytesIO

import numpy as np
from PIL import Image

EMBED_DIM = 64


def _normalize(vec: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(vec)
    if norm == 0:
        return vec
    return vec / norm


def _hash_seed(text: str) -> np.ndarray:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    values = np.frombuffer(digest, dtype=np.uint8).astype(np.float32)
    repeated = np.tile(values, int(np.ceil(EMBED_DIM / len(values))))[:EMBED_DIM]
    return _normalize(repeated)


def image_embedding_from_bytes(content: bytes) -> list[float]:
    image = Image.open(BytesIO(content)).convert("RGB")
    image = image.resize((64, 64))
    arr = np.asarray(image, dtype=np.float32).flatten()
    if arr.size < EMBED_DIM:
        arr = np.pad(arr, (0, EMBED_DIM - arr.size))
    vec = _normalize(arr[:EMBED_DIM])
    return vec.tolist()


def text_embedding_from_string(text: str) -> list[float]:
    cleaned = re.sub(r"\s+", " ", text.strip().lower())
    if not cleaned:
        return [0.0] * EMBED_DIM
    return _hash_seed(cleaned).tolist()


def cosine_similarity(a: list[float] | None, b: list[float] | None) -> float:
    if not a or not b:
        return 0.0
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    if denom == 0:
        return 0.0
    return float(np.dot(va, vb) / denom)
