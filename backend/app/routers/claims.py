from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import ClaimRequest, ClaimStatus, Item, ItemStatus, ItemType, Match, User
from app.schemas import ClaimAgainstFound, ClaimCreate, ClaimPublic, ClaimRespond
from app.services.embeddings import cosine_similarity
from app.services.matching import find_matches_for_item
from app.services.privacy import disclosure_for_match, serialize_item, user_public

router = APIRouter(prefix="/claims", tags=["claims"])


def _serialize_claim(claim: ClaimRequest, viewer: User) -> dict:
    disclosure = disclosure_for_match(viewer, claim.match, claim)
    if viewer.id == claim.claimer_id:
        counterparty = user_public(claim.finder, disclosure)
    else:
        counterparty = user_public(claim.claimer, disclosure)

    match = claim.match
    return {
        "id": claim.id,
        "status": claim.status.value,
        "message": claim.message,
        "created_at": claim.created_at,
        "responded_at": claim.responded_at,
        "counterparty": counterparty,
        "match": {
            "id": match.id,
            "combined_score": round(match.combined_score * 100, 1),
            "image_score": round(match.image_score * 100, 1),
            "text_score": round(match.text_score * 100, 1),
            "lost_item": serialize_item(match.lost_item, viewer, claim),
            "found_item": serialize_item(match.found_item, viewer, claim),
            "claim_status": claim.status.value,
        },
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_claim(
    payload: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = db.get(Match, payload.match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    lost_item = match.lost_item
    if current_user.id != lost_item.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the owner of the lost report can request contact.",
        )
    if match.claim:
        if match.claim.status in {ClaimStatus.CANCELLED, ClaimStatus.REJECTED}:
            db.delete(match.claim)
            db.flush()
        else:
            raise HTTPException(status_code=400, detail="A claim already exists for this match.")

    claim = ClaimRequest(
        match_id=match.id,
        claimer_id=current_user.id,
        finder_id=match.found_item.user_id,
        message=payload.message.strip(),
    )
    lost_item.status = ItemStatus.CLAIM_PENDING
    match.found_item.status = ItemStatus.CLAIM_PENDING
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return _serialize_claim(claim, current_user)


@router.post("/against-found", status_code=status.HTTP_201_CREATED)
def claim_against_found(
    payload: ClaimAgainstFound,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Raise a lost complaint against a found feed item (browse → claim)."""
    lost_item = db.get(Item, payload.lost_item_id)
    found_item = db.get(Item, payload.found_item_id)
    if not lost_item or not found_item:
        raise HTTPException(status_code=404, detail="Item not found.")
    if lost_item.item_type != ItemType.LOST or found_item.item_type != ItemType.FOUND:
        raise HTTPException(status_code=400, detail="Need one lost report and one found report.")
    if lost_item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only you can claim with your lost report.")
    if found_item.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot claim your own found report.")
    if found_item.status not in {ItemStatus.OPEN, ItemStatus.MATCHED}:
        raise HTTPException(
            status_code=400,
            detail="This found item is not available to claim right now.",
        )

    match = (
        db.query(Match)
        .filter(
            Match.lost_item_id == lost_item.id,
            Match.found_item_id == found_item.id,
        )
        .first()
    )
    if not match:
        img_score = cosine_similarity(lost_item.image_embedding, found_item.image_embedding)
        txt_score = cosine_similarity(lost_item.text_embedding, found_item.text_embedding)
        # User-asserted browse claim — keep a strong combined score for visibility.
        combined = max(0.75, 0.85 * img_score + 0.15 * txt_score)
        match = Match(
            lost_item_id=lost_item.id,
            found_item_id=found_item.id,
            image_score=img_score,
            text_score=txt_score,
            combined_score=combined,
        )
        db.add(match)
        db.flush()

    if match.claim:
        if match.claim.status in {ClaimStatus.CANCELLED, ClaimStatus.REJECTED}:
            db.delete(match.claim)
            db.flush()
        else:
            raise HTTPException(status_code=400, detail="A claim already exists for this pair.")

    claim = ClaimRequest(
        match_id=match.id,
        claimer_id=current_user.id,
        finder_id=found_item.user_id,
        message=(
            payload.message.strip()
            or "I saw this on the campus found feed and believe it is mine."
        ),
    )
    lost_item.status = ItemStatus.CLAIM_PENDING
    found_item.status = ItemStatus.CLAIM_PENDING
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return _serialize_claim(claim, current_user)


@router.get("/incoming")
def incoming_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claims = (
        db.query(ClaimRequest)
        .filter(
            ClaimRequest.finder_id == current_user.id,
            ClaimRequest.status == ClaimStatus.PENDING,
        )
        .order_by(ClaimRequest.created_at.desc())
        .all()
    )
    return [_serialize_claim(claim, current_user) for claim in claims]


@router.get("/mine")
def my_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claims = (
        db.query(ClaimRequest)
        .filter(ClaimRequest.claimer_id == current_user.id)
        .order_by(ClaimRequest.created_at.desc())
        .all()
    )
    return [_serialize_claim(claim, current_user) for claim in claims]


@router.post("/{claim_id}/respond")
def respond_to_claim(
    claim_id: int,
    payload: ClaimRespond,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = db.get(ClaimRequest, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    if current_user.id != claim.finder_id:
        raise HTTPException(status_code=403, detail="Only the finder can accept or reject.")
    if claim.status != ClaimStatus.PENDING:
        raise HTTPException(status_code=400, detail="This claim was already handled.")

    claim.responded_at = datetime.utcnow()
    if payload.accept:
        claim.status = ClaimStatus.ACCEPTED
        claim.match.lost_item.status = ItemStatus.CONNECTED
        claim.match.found_item.status = ItemStatus.CONNECTED
    else:
        claim.status = ClaimStatus.REJECTED
        claim.match.lost_item.status = ItemStatus.MATCHED
        claim.match.found_item.status = ItemStatus.MATCHED

    db.commit()
    db.refresh(claim)
    return _serialize_claim(claim, current_user)


@router.post("/{claim_id}/mismatch")
def report_mismatch(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Real-world check failed — reopen both reports on the campus feed."""
    claim = db.get(ClaimRequest, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    if current_user.id not in {claim.claimer_id, claim.finder_id}:
        raise HTTPException(status_code=403, detail="Only the lost or found party can reopen.")
    if claim.status != ClaimStatus.ACCEPTED:
        raise HTTPException(
            status_code=400,
            detail="Only an accepted claim can be marked as not a match.",
        )

    lost_item = claim.match.lost_item
    found_item = claim.match.found_item

    claim.status = ClaimStatus.CANCELLED
    claim.responded_at = datetime.utcnow()
    lost_item.status = ItemStatus.OPEN
    found_item.status = ItemStatus.OPEN
    db.commit()

    # Look for other possible matches; the cancelled pair stays blocked.
    find_matches_for_item(db, lost_item)
    find_matches_for_item(db, found_item)
    db.refresh(claim)
    return _serialize_claim(claim, current_user)


@router.post("/{claim_id}/confirm-recovered")
def confirm_recovered(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Item returned in person.

    - Lost report is closed and removed from history (privacy).
    - Found report stays as recovered history so campus can see the app works.
    """
    claim = db.get(ClaimRequest, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    if current_user.id not in {claim.claimer_id, claim.finder_id}:
        raise HTTPException(status_code=403, detail="Only the lost or found party can confirm.")
    if claim.status != ClaimStatus.ACCEPTED:
        raise HTTPException(
            status_code=400,
            detail="Only an accepted claim can be marked recovered.",
        )

    # Keep claim accepted (= done). Lost history goes away; found history remains.
    claim.match.lost_item.status = ItemStatus.CLOSED
    claim.match.found_item.status = ItemStatus.RECOVERED
    db.commit()
    db.refresh(claim)
    return _serialize_claim(claim, current_user)
