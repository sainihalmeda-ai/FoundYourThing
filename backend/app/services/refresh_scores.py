"""One-shot refresh of image embeddings + match scores after algorithm changes."""

from __future__ import annotations

from pathlib import Path

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Item, Match
from app.services.embeddings import cosine_similarity, image_embedding_from_bytes
from app.services.matching import _combined_score


def refresh_embeddings_and_scores(db: Session) -> dict[str, int]:
    upload_dir = Path(settings.upload_dir)
    updated_items = 0
    updated_matches = 0

    items = db.query(Item).all()
    for item in items:
        path = upload_dir / item.image_path
        if not path.is_file():
            continue
        try:
            content = path.read_bytes()
            item.image_embedding = image_embedding_from_bytes(content)
            updated_items += 1
        except Exception:
            continue

    db.flush()

    matches = db.query(Match).all()
    for match in matches:
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

    db.commit()
    return {"items": updated_items, "matches": updated_matches}
