"""Visual and text fingerprints used to score a lost report against a found one.

Students see these numbers as a match percentage and decide whether to hand over
a phone, so a wrong item must score low. Every block below is mean-centred
before it is normalised: plain cosine over raw pixel brightness is always high
because photographs are all-positive vectors pointing the same way, which is
what made two different watches read 91%. Mean-centring turns the score into a
correlation, so unrelated photos land near zero.

This is still a lightweight fingerprint, not a neural network. It is strong at
"is this the same photo / same object shot the same way" and deliberately
modest elsewhere. Swap in CLIP when heavier dependencies are acceptable.
"""

from __future__ import annotations

import hashlib
import re
from io import BytesIO

import numpy as np
from PIL import Image

# Thumbnail correlation — catches the same picture and the same object framed alike.
THUMB_GRID = 16
THUMB_DIM = THUMB_GRID * THUMB_GRID
# Edge-orientation histogram — shape and texture, tolerant of lighting shifts.
HOG_CELLS = 4
HOG_BINS = 8
HOG_DIM = HOG_CELLS * HOG_CELLS * HOG_BINS
# Colour spread of the photo.
COLOR_BINS = 8
COLOR_DIM = COLOR_BINS * 3

IMAGE_EMBED_DIM = THUMB_DIM + HOG_DIM + COLOR_DIM
TEXT_EMBED_DIM = 128

# Each block contributes this share of the final similarity.
THUMB_WEIGHT = 0.40
HOG_WEIGHT = 0.35
COLOR_WEIGHT = 0.25

_TOKEN_STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "was", "has", "had", "its",
    "near", "from", "have", "lost", "found", "item", "items", "please", "my",
    "a", "an", "of", "in", "on", "at", "is", "it", "i",
}


def _centred_unit(values: np.ndarray) -> np.ndarray:
    """Remove the mean, then scale to unit length so cosine == correlation."""
    centred = values - values.mean()
    norm = np.linalg.norm(centred)
    if norm == 0:
        return np.zeros_like(centred)
    return centred / norm


def _thumbnail_block(image: Image.Image) -> np.ndarray:
    grey = image.convert("L").resize((THUMB_GRID, THUMB_GRID), Image.Resampling.BILINEAR)
    return _centred_unit(np.asarray(grey, dtype=np.float32).flatten() / 255.0)


def _edge_block(image: Image.Image) -> np.ndarray:
    """Gradient orientations pooled over a 4x4 grid (a compact HOG)."""
    size = 64
    grey = np.asarray(
        image.convert("L").resize((size, size), Image.Resampling.BILINEAR),
        dtype=np.float32,
    ) / 255.0

    dy, dx = np.gradient(grey)
    magnitude = np.hypot(dx, dy)
    # Unsigned orientation: a dark-on-light edge matches its light-on-dark twin.
    angle = np.mod(np.arctan2(dy, dx), np.pi)
    bins = np.minimum((angle / np.pi * HOG_BINS).astype(int), HOG_BINS - 1)

    cell = size // HOG_CELLS
    histogram = np.zeros(HOG_DIM, dtype=np.float32)
    for row in range(HOG_CELLS):
        for col in range(HOG_CELLS):
            rows = slice(row * cell, (row + 1) * cell)
            cols = slice(col * cell, (col + 1) * cell)
            cell_bins = bins[rows, cols].ravel()
            cell_mag = magnitude[rows, cols].ravel()
            counts = np.bincount(cell_bins, weights=cell_mag, minlength=HOG_BINS)
            total = counts.sum()
            if total > 0:
                counts = counts / total
            base = (row * HOG_CELLS + col) * HOG_BINS
            histogram[base : base + HOG_BINS] = counts
    return _centred_unit(histogram)


def _colour_block(image: Image.Image) -> np.ndarray:
    small = np.asarray(
        image.resize((64, 64), Image.Resampling.BILINEAR), dtype=np.float32
    ) / 255.0
    channels = [
        np.histogram(small[:, :, channel], bins=COLOR_BINS, range=(0.0, 1.0))[0]
        for channel in range(3)
    ]
    return _centred_unit(np.concatenate(channels).astype(np.float32))


def image_embedding_from_bytes(content: bytes) -> list[float]:
    """Fingerprint whose dot product with another is a weighted correlation."""
    image = Image.open(BytesIO(content)).convert("RGB")
    blocks = (
        np.sqrt(THUMB_WEIGHT) * _thumbnail_block(image),
        np.sqrt(HOG_WEIGHT) * _edge_block(image),
        np.sqrt(COLOR_WEIGHT) * _colour_block(image),
    )
    return np.concatenate(blocks).astype(np.float32).tolist()


def text_embedding_from_string(text: str) -> list[float]:
    """Signed token hashing — unrelated wording scores ~0, not ~0.75.

    Hashing the whole string gave every pair of reports a high score because the
    digest bytes are all positive. Signing each token spreads them around zero.
    """
    tokens = {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if len(token) > 1 and token not in _TOKEN_STOPWORDS
    }
    if not tokens:
        return [0.0] * TEXT_EMBED_DIM

    vector = np.zeros(TEXT_EMBED_DIM, dtype=np.float32)
    for token in tokens:
        digest = hashlib.sha1(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:4], "big") % TEXT_EMBED_DIM
        vector[index] += 1.0 if digest[4] % 2 == 0 else -1.0

    norm = np.linalg.norm(vector)
    if norm == 0:
        return [0.0] * TEXT_EMBED_DIM
    return (vector / norm).tolist()


def cosine_similarity(a: list[float] | None, b: list[float] | None) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    if denom == 0:
        return 0.0
    return float(np.dot(va, vb) / denom)
