from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import User
from app.schemas import TokenResponse, UserLogin, UserPublic, UserRegister
from app.services.campus_email import validate_campus_email
from app.services.campus_id import (
    CAMPUS_ID_ERROR,
    is_campus_id,
    normalize_campus_id,
    role_for_campus_id,
)
from app.services.storage import public_image_url, save_item_photo

router = APIRouter(prefix="/auth", tags=["auth"])

_PHOTO_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


def _user_public(user: User, **overrides) -> UserPublic:
    return UserPublic(
        vtu_id=user.vtu_id,
        department=user.department,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        photo_url=public_image_url(user.photo_path) if user.photo_path else None,
        **overrides,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if not is_campus_id(payload.vtu_id):
        raise HTTPException(status_code=400, detail=CAMPUS_ID_ERROR)
    email_error = validate_campus_email(str(payload.email), payload.vtu_id)
    if email_error:
        raise HTTPException(status_code=400, detail=email_error)
    if db.query(User).filter(User.vtu_id == payload.vtu_id).first():
        raise HTTPException(status_code=400, detail="This ID is already registered.")
    if db.query(User).filter(User.email == str(payload.email).strip().lower()).first():
        raise HTTPException(status_code=400, detail="This email is already registered.")

    user = User(
        vtu_id=payload.vtu_id,
        full_name=payload.full_name,
        department=payload.department,
        email=str(payload.email).strip().lower(),
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=role_for_campus_id(payload.vtu_id),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=_user_public(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    if not is_campus_id(payload.vtu_id):
        raise HTTPException(status_code=400, detail=CAMPUS_ID_ERROR)
    user = db.query(User).filter(User.vtu_id == payload.vtu_id).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid ID or password.")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=_user_public(user))


@router.post("/token", response_model=TokenResponse, include_in_schema=False)
def login_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.vtu_id == normalize_campus_id(form.username)).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid ID or password.")
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=_user_public(user))


@router.post("/refresh", response_model=TokenResponse)
def refresh(current_user: User = Depends(get_current_user)):
    """Extend the session by issuing a fresh access token."""
    token = create_access_token(current_user.id)
    return TokenResponse(access_token=token, user=_user_public(current_user))


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return _user_public(current_user)


@router.post("/me/photo", response_model=UserPublic)
async def upload_profile_photo(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if photo.content_type not in _PHOTO_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, or WEBP photo.")

    content = await photo.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB.")

    ext = Path(photo.filename or "photo.jpg").suffix.lower() or ".jpg"
    filename = f"profile-{current_user.id}-{uuid4().hex}{ext}"
    try:
        save_item_photo(filename, content, photo.content_type or "image/jpeg")
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    current_user.photo_path = filename
    current_user.photo_data = content
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return _user_public(current_user)
