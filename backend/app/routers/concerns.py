from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.constants import CONCERN_CATEGORIES
from app.database import get_db
from app.models import Concern, ConcernStatus, User
from app.schemas import (
    ConcernCreate,
    ConcernPublic,
    ConcernStatusUpdate,
    ConcernTeamView,
    TeamAccess,
)
from app.services.enquiry_team import is_enquiry_team

router = APIRouter(prefix="/concerns", tags=["concerns"])


def _to_public(concern: Concern) -> ConcernPublic:
    return ConcernPublic(
        id=concern.id,
        category=concern.category,
        category_label=CONCERN_CATEGORIES.get(concern.category, concern.category),
        description=concern.description,
        location=concern.location,
        status=concern.status.value,
        team_note=concern.team_note,
        created_at=concern.created_at,
        updated_at=concern.updated_at,
    )


def _to_team_view(concern: Concern) -> ConcernTeamView:
    return ConcernTeamView(
        **_to_public(concern).model_dump(),
        reporter_vtu_id=concern.reporter.vtu_id,
        reporter_name=concern.reporter.full_name,
        reporter_phone=concern.reporter.phone,
        reporter_department=concern.reporter.department,
    )


def _require_enquiry_team(current_user: User) -> None:
    if not is_enquiry_team(current_user.vtu_id):
        raise HTTPException(status_code=403, detail="Not authorized to view safety reports.")


@router.get("/team-access", response_model=TeamAccess)
def team_access(current_user: User = Depends(get_current_user)):
    """Lets the app decide whether to show the enquiry-team inbox entry point."""
    return TeamAccess(is_enquiry_team=is_enquiry_team(current_user.vtu_id))


@router.post("", response_model=ConcernPublic, status_code=status.HTTP_201_CREATED)
def create_concern(
    payload: ConcernCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    concern = Concern(
        reporter_id=current_user.id,
        category=payload.category,
        description=payload.description,
        location=payload.location,
    )
    db.add(concern)
    db.commit()
    db.refresh(concern)
    return _to_public(concern)


@router.get("/mine", response_model=list[ConcernPublic])
def list_my_concerns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Concern)
        .filter(Concern.reporter_id == current_user.id)
        .order_by(Concern.created_at.desc())
        .all()
    )
    return [_to_public(c) for c in rows]


@router.get("", response_model=list[ConcernTeamView])
def list_all_concerns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_enquiry_team(current_user)
    rows = db.query(Concern).order_by(Concern.created_at.desc()).all()
    return [_to_team_view(c) for c in rows]


@router.get("/{concern_id}", response_model=ConcernTeamView)
def get_concern(
    concern_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_enquiry_team(current_user)
    concern = db.get(Concern, concern_id)
    if not concern:
        raise HTTPException(status_code=404, detail="Not found.")
    return _to_team_view(concern)


@router.patch("/{concern_id}", response_model=ConcernTeamView)
def update_concern(
    concern_id: int,
    payload: ConcernStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_enquiry_team(current_user)
    concern = db.get(Concern, concern_id)
    if not concern:
        raise HTTPException(status_code=404, detail="Not found.")
    concern.status = ConcernStatus(payload.status)
    concern.team_note = payload.team_note
    concern.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(concern)
    return _to_team_view(concern)
