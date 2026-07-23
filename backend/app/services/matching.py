from sqlalchemy.orm import Session

from app.config import settings
from app.models import Item, ItemStatus, ItemType, Match
from app.services.embeddings import cosine_similarity


def find_matches_for_item(db: Session, item: Item) -> list[Match]:
    if item.item_type == ItemType.LOST:
        candidates = (
            db.query(Item)
            .filter(
                Item.item_type == ItemType.FOUND,
                Item.status.in_([ItemStatus.OPEN, ItemStatus.MATCHED]),
                Item.id != item.id,
            )
            .all()
        )
        target = item
        pair = lambda lost, found: (lost, found)
    else:
        candidates = (
            db.query(Item)
            .filter(
                Item.item_type == ItemType.LOST,
                Item.status.in_([ItemStatus.OPEN, ItemStatus.MATCHED, ItemStatus.CLAIM_PENDING]),
                Item.id != item.id,
            )
            .all()
        )
        target = item
        pair = lambda found, lost: (lost, found)

    created: list[Match] = []
    for candidate in candidates:
        if item.item_type == ItemType.LOST:
            lost_item, found_item = item, candidate
        else:
            lost_item, found_item = candidate, item

        existing = (
            db.query(Match)
            .filter(
                Match.lost_item_id == lost_item.id,
                Match.found_item_id == found_item.id,
            )
            .first()
        )
        if existing:
            continue

        img_score = cosine_similarity(target.image_embedding, candidate.image_embedding)
        txt_score = cosine_similarity(target.text_embedding, candidate.text_embedding)
        combined = (
            settings.match_image_weight * img_score
            + settings.match_text_weight * txt_score
        )

        if combined < settings.match_threshold:
            continue

        match = Match(
            lost_item_id=lost_item.id,
            found_item_id=found_item.id,
            image_score=img_score,
            text_score=txt_score,
            combined_score=combined,
        )
        db.add(match)
        created.append(match)

        if lost_item.status == ItemStatus.OPEN:
            lost_item.status = ItemStatus.MATCHED
        if found_item.status == ItemStatus.OPEN:
            found_item.status = ItemStatus.MATCHED

    if created:
        db.commit()
        for match in created:
            db.refresh(match)

    return created


def get_matches_for_item(db: Session, item_id: int) -> list[Match]:
    return (
        db.query(Match)
        .filter((Match.lost_item_id == item_id) | (Match.found_item_id == item_id))
        .order_by(Match.combined_score.desc())
        .all()
    )
