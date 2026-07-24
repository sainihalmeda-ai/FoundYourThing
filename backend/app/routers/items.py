import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import settings
from app.constants import CAMPUS_LOCATIONS, VALUABLE_CATEGORIES
from app.database import get_db
from app.models import ClaimRequest, ClaimStatus, Item, ItemStatus, ItemType, Match, User
from app.services.embeddings import image_embedding_from_bytes, text_embedding_from_string
from app.services.matching import find_matches_for_item, get_matches_for_item
from app.services.privacy import serialize_item
from app.schemas import ItemPublic

router = APIRouter(prefix="/items", tags=["items"])

UPLOAD_PATH = Path(settings.upload_dir)
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


def _claim_for_viewer_item(db: Session, item: Item, viewer: User) -> ClaimRequest | None:
    """Best claim linking this item to the viewer (prefer accepted, then pending)."""
    matches = (
        db.query(Match)
        .filter((Match.lost_item_id == item.id) | (Match.found_item_id == item.id))
        .all()
    )
    claims = [m.claim for m in matches if m.claim]
    relevant = [
        c
        for c in claims
        if viewer.id in {c.claimer_id, c.finder_id}
    ]
    if not relevant:
        return None
    for status in (ClaimStatus.ACCEPTED, ClaimStatus.PENDING, ClaimStatus.REJECTED, ClaimStatus.CANCELLED):
        for claim in relevant:
            if claim.status == status:
                return claim
    return relevant[0]


@router.get("/meta")
def get_metadata():
    return {
        "categories": [
            {"id": key, "label": label} for key, label in VALUABLE_CATEGORIES.items()
        ],
        "locations": CAMPUS_LOCATIONS,
        "policy": {
            "valuables_only": True,
            "rejected_examples": ["pen", "pencil", "eraser", "small stationery"],
            "privacy": "Only VTU ID is public until a claim is mutually accepted.",
        },
    }


@router.get("", response_model=list[ItemPublic])
def list_items(
    item_type: str | None = None,
    mine: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Campus feed.

    - Active Lost/Found: open, matched, claim_pending
    - Found trust history: recovered *found* reports stay visible (returned to owner)
    - Lost history is removed after recovery (closed) — not shown anywhere public
    - `mine=true`: your active reports + your recovered found success stories
    """
    query = db.query(Item)
    if mine:
        query = query.filter(
            Item.user_id == current_user.id,
            Item.status.notin_([ItemStatus.CLOSED]),
        )
        # Hide recovered *lost* reports (privacy). Keep recovered *found* for trust.
        query = query.filter(
            ~((Item.item_type == ItemType.LOST) & (Item.status == ItemStatus.RECOVERED))
        )
    else:
        active = [ItemStatus.OPEN, ItemStatus.MATCHED, ItemStatus.CLAIM_PENDING]
        if item_type == "found":
            # Active founds + successfully returned founds (campus trust history).
            query = query.filter(
                Item.item_type == ItemType.FOUND,
                Item.status.in_([*active, ItemStatus.RECOVERED]),
            )
        elif item_type == "lost":
            query = query.filter(
                Item.item_type == ItemType.LOST,
                Item.status.in_(active),
            )
        else:
            # Mixed campus list: active items + recovered found history only.
            query = query.filter(
                (
                    (Item.item_type == ItemType.LOST) & Item.status.in_(active)
                )
                | (
                    (Item.item_type == ItemType.FOUND)
                    & Item.status.in_([*active, ItemStatus.RECOVERED])
                )
            )

    items = query.order_by(Item.created_at.desc()).limit(100).all()
    return [serialize_item(item, current_user) for item in items]


@router.get("/{item_id}", response_model=ItemPublic)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    claim = _claim_for_viewer_item(db, item, current_user)
    return serialize_item(item, current_user, claim)


@router.post("", response_model=ItemPublic, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_type: str = Form(...),
    category: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    location: str = Form(...),
    is_urgent: bool = Form(False),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if category not in VALUABLE_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail="Only valuable items are accepted. Pens and pencils are not allowed.",
        )
    if item_type not in {"lost", "found"}:
        raise HTTPException(status_code=400, detail="item_type must be lost or found.")
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, or WEBP photo.")

    content = await image.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB.")

    ext = Path(image.filename or "photo.jpg").suffix.lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_PATH / filename
    file_path.write_bytes(content)

    text_blob = f"{category} {title} {description} {location}"
    item = Item(
        user_id=current_user.id,
        item_type=ItemType(item_type),
        category=category,
        title=title.strip(),
        description=description.strip(),
        location=location,
        image_path=filename,
        image_embedding=image_embedding_from_bytes(content),
        text_embedding=text_embedding_from_string(text_blob),
        is_urgent=is_urgent,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    find_matches_for_item(db, item)
    return serialize_item(item, current_user)


@router.get("/{item_id}/matches")
def item_matches(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")

    matches = get_matches_for_item(db, item_id)
    from app.services.privacy import disclosure_for_match, serialize_item, user_public

    payload = []
    for match in matches:
        claim = match.claim
        # Hide cancelled / rejected pairs from the main AI list.
        if claim and claim.status in {ClaimStatus.CANCELLED, ClaimStatus.REJECTED}:
            continue
        disclosure = disclosure_for_match(current_user, match, claim)
        other_item = match.found_item if item.item_type == ItemType.LOST else match.lost_item
        other_user = other_item.user

        claim_status = claim.status.value if claim else None
        # After successful return, show "done" instead of raw accepted.
        if (
            claim
            and claim.status == ClaimStatus.ACCEPTED
            and (
                match.lost_item.status == ItemStatus.CLOSED
                or match.found_item.status == ItemStatus.RECOVERED
            )
        ):
            claim_status = "done"

        payload.append(
            {
                "id": match.id,
                "combined_score": round(match.combined_score * 100, 1),
                "image_score": round(match.image_score * 100, 1),
                "text_score": round(match.text_score * 100, 1),
                "counterparty": user_public(other_user, disclosure),
                "counterparty_item": serialize_item(other_item, current_user, claim),
                "claim_status": claim_status,
                "claim_id": claim.id if claim else None,
            }
        )
    return payload
