"""Hostel complaint box — students report hostel problems with photo evidence."""

import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.constants import (
    HOSTEL_COMPLAINT_CATEGORIES,
    HOSTELS,
    MAX_COMPLAINT_WORDS,
    MIN_COMPLAINT_WORDS,
)
from app.database import get_db
from app.models import HostelComplaint, HostelComplaintStatus, User
from app.schemas import (
    HostelComplaintOptions,
    HostelComplaintPublic,
    HostelComplaintStaffView,
    HostelComplaintStatusUpdate,
    HostelOption,
)
from app.services.complaint_text import complaint_text_problem, count_words
from app.services.hostel_staff import is_hostel_staff
from app.services.storage import public_image_url, save_item_photo

router = APIRouter(prefix="/hostel-complaints", tags=["hostel-complaints"])

ALLOWED_ATTACHMENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024


def _to_public(c: HostelComplaint) -> HostelComplaintPublic:
    return HostelComplaintPublic(
        id=c.id,
        hostel=c.hostel,
        hostel_label=HOSTELS.get(c.hostel, {}).get("label", c.hostel),
        block=c.block,
        room=c.room,
        category=c.category,
        category_label=HOSTEL_COMPLAINT_CATEGORIES.get(c.category, c.category),
        description=c.description,
        word_count=count_words(c.description),
        attachment_url=public_image_url(c.attachment_path),
        status=c.status.value,
        staff_note=c.staff_note,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


def _to_staff_view(c: HostelComplaint) -> HostelComplaintStaffView:
    return HostelComplaintStaffView(
        **_to_public(c).model_dump(),
        reporter_vtu_id=c.reporter.vtu_id,
        reporter_name=c.reporter.full_name,
        reporter_phone=c.reporter.phone,
        reporter_department=c.reporter.department,
    )


def _require_staff(user: User) -> None:
    if not is_hostel_staff(user.vtu_id):
        raise HTTPException(status_code=403, detail="Only hostel staff can do this.")


@router.get("/options", response_model=HostelComplaintOptions)
def complaint_options(current_user: User = Depends(get_current_user)):
    """Hostels, blocks and categories for the form — one source of truth."""
    return HostelComplaintOptions(
        hostels=[
            HostelOption(id=key, label=h["label"], blocks=h["blocks"])
            for key, h in HOSTELS.items()
        ],
        categories=[{"id": k, "label": v} for k, v in HOSTEL_COMPLAINT_CATEGORIES.items()],
        min_words=MIN_COMPLAINT_WORDS,
        max_words=MAX_COMPLAINT_WORDS,
        is_hostel_staff=is_hostel_staff(current_user.vtu_id),
    )


@router.post("", response_model=HostelComplaintPublic, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    hostel: str = Form(...),
    block: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    room: str = Form(""),
    # Optional at the framework level only so a missing photo gets a clear
    # message instead of a raw 422 — it is still required below.
    attachment: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if hostel not in HOSTELS:
        raise HTTPException(status_code=400, detail="Choose your hostel.")
    if block not in HOSTELS[hostel]["blocks"]:
        raise HTTPException(status_code=400, detail="Choose a block in that hostel.")
    if category not in HOSTEL_COMPLAINT_CATEGORIES:
        raise HTTPException(status_code=400, detail="Choose what the complaint is about.")
    room = room.strip()
    if len(room) > 20:
        raise HTTPException(status_code=400, detail="Room number is too long.")

    description = description.strip()
    problem = complaint_text_problem(description)
    if problem:
        raise HTTPException(status_code=400, detail=problem)

    if attachment is None:
        raise HTTPException(status_code=400, detail="Attach a photo of the problem.")
    if attachment.content_type not in ALLOWED_ATTACHMENT_TYPES:
        raise HTTPException(status_code=400, detail="Attach a JPG, PNG, or WEBP photo of the problem.")
    content = await attachment.read()
    if not content:
        raise HTTPException(status_code=400, detail="The attached photo is empty.")
    if len(content) > MAX_ATTACHMENT_BYTES:
        raise HTTPException(status_code=400, detail="Photo must be under 5 MB.")

    ext = Path(attachment.filename or "photo.jpg").suffix.lower() or ".jpg"
    filename = f"complaint-{uuid.uuid4().hex}{ext}"
    try:
        save_item_photo(filename, content, attachment.content_type or "image/jpeg")
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    complaint = HostelComplaint(
        reporter_id=current_user.id,
        hostel=hostel,
        block=block,
        room=room,
        category=category,
        description=description,
        attachment_path=filename,
        attachment_data=content,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return _to_public(complaint)


@router.get("/mine", response_model=list[HostelComplaintPublic])
def list_my_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(HostelComplaint)
        .filter(HostelComplaint.reporter_id == current_user.id)
        .order_by(HostelComplaint.created_at.desc())
        .all()
    )
    return [_to_public(c) for c in rows]


@router.get("", response_model=list[HostelComplaintStaffView])
def list_all_complaints(
    hostel: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_staff(current_user)
    query = db.query(HostelComplaint)
    if hostel:
        query = query.filter(HostelComplaint.hostel == hostel)
    return [_to_staff_view(c) for c in query.order_by(HostelComplaint.created_at.desc()).all()]


@router.get("/{complaint_id}", response_model=HostelComplaintStaffView)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = db.get(HostelComplaint, complaint_id)
    # 404 rather than 403 for someone else's complaint, so ids can't be probed.
    if not complaint or (
        complaint.reporter_id != current_user.id and not is_hostel_staff(current_user.vtu_id)
    ):
        raise HTTPException(status_code=404, detail="Complaint not found.")
    return _to_staff_view(complaint)


@router.patch("/{complaint_id}", response_model=HostelComplaintStaffView)
def update_complaint(
    complaint_id: int,
    payload: HostelComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_staff(current_user)
    complaint = db.get(HostelComplaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    complaint.status = HostelComplaintStatus(payload.status)
    complaint.staff_note = payload.staff_note.strip()
    complaint.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(complaint)
    return _to_staff_view(complaint)
