from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import ClaimRequest, ClaimStatus, Item, ItemStatus, Match, User
from app.schemas import ClaimCreate, ClaimPublic, ClaimRespond
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
