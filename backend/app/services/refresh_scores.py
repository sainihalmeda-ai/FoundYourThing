"""One-shot refresh of image embeddings + match scores after algorithm changes."""

from __future__ import annotations

from pathlib import Path

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Item, Match
from app.services.embeddings import (
    IMAGE_EMBED_DIM,
    TEXT_EMBED_DIM,
    cosine_similarity,
    image_embedding_from_bytes,
    text_embedding_from_string,
)
from app.services.matching import _combined_score


def refresh_embeddings_and_scores(db: Session) -> dict[str, int]:
    """Re-fingerprint anything stored under an older scheme, then rescore.

    Vectors of the wrong length are from a previous algorithm and would score
    0 against new ones, so old reports are rebuilt from their saved photo.
    """
    upload_dir = Path(settings.upload_dir)
    updated_items = 0
    updated_matches = 0

    items = db.query(Item).all()
    for item in items:
        stale_image = len(item.image_embedding or []) != IMAGE_EMBED_DIM
        stale_text = len(item.text_embedding or []) != TEXT_EMBED_DIM
        if not stale_image and not stale_text:
            continue

        if stale_text:
            item.text_embedding = text_embedding_from_string(
                f"{item.category} {item.title} {item.description} {item.location}"
            )

        if stale_image:
            path = upload_dir / item.image_path
            if not path.is_file():
                continue
            try:
                item.image_embedding = image_embedding_from_bytes(path.read_bytes())
            except Exception:
                continue

        updated_items += 1

    db.flush()

    dropped = 0
    for match in db.query(Match).all():
        lost = match.lost_item
        found = match.found_item
        if not lost or not found:
            continue
        img_score = cosine_similarity(lost.image_embedding, found.image_embedding)
        txt_score = cosine_similarity(lost.text_embedding, found.text_embedding)
        match.image_score = img_score
        match.text_score = txt_score
        match.combined_score = _combined_score(img_score, txt_score)
        updated_matches += 1

        # Suggestions the old algorithm invented out of nothing. A pair someone
        # actually claimed is kept — those two people are already talking.
        if match.claim is None and match.combined_score < settings.match_threshold:
            db.delete(match)
            dropped += 1

    db.commit()
    return {"items": updated_items, "matches": updated_matches, "dropped": dropped}
