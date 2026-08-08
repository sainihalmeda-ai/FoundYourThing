from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
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

router = APIRouter(prefix="/auth", tags=["auth"])


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
    return TokenResponse(
        access_token=token,
        user=UserPublic(vtu_id=user.vtu_id, department=user.department),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    if not is_campus_id(payload.vtu_id):
        raise HTTPException(status_code=400, detail=CAMPUS_ID_ERROR)
    user = db.query(User).filter(User.vtu_id == payload.vtu_id).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid ID or password.")

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserPublic(vtu_id=user.vtu_id, department=user.department),
    )


@router.post("/token", response_model=TokenResponse, include_in_schema=False)
def login_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.vtu_id == normalize_campus_id(form.username)).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid ID or password.")
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserPublic(vtu_id=user.vtu_id, department=user.department),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(current_user: User = Depends(get_current_user)):
    """Extend the session by issuing a fresh access token."""
    token = create_access_token(current_user.id)
    return TokenResponse(
        access_token=token,
        user=UserPublic(
            vtu_id=current_user.vtu_id,
            department=current_user.department,
            full_name=current_user.full_name,
            phone=current_user.phone,
            role=current_user.role,
        ),
    )


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return UserPublic(
        vtu_id=current_user.vtu_id,
        department=current_user.department,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
    )
