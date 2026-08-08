import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.constants import VALUABLE_CATEGORIES

_NAME_RE = re.compile(r"^[A-Za-z][A-Za-z .'-]{1,118}[A-Za-z.]$|^[A-Za-z]{2,120}$")
_DEPT_RE = re.compile(r"^[A-Za-z][A-Za-z0-9 &/\-]{1,39}$")
_PHONE_RE = re.compile(r"^[6-9]\d{9}$")
_BAD_PHONES = {
    "1234567890",
    "0123456789",
    "9876543210",
    "9999999999",
    "8888888888",
    "7777777777",
    "6666666666",
}


class UserRegister(BaseModel):
    vtu_id: str = Field(..., min_length=5, max_length=20, examples=["VTU27680"])
    full_name: str = Field(..., min_length=2, max_length=120)
    department: str = Field(..., min_length=2, max_length=40)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6, max_length=128)

    @field_validator("vtu_id")
    @classmethod
    def normalize_vtu(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        name = " ".join(value.strip().split())
        if len(name) < 2 or not _NAME_RE.match(name):
            raise ValueError("Enter a real full name (letters only).")
        if len(set(name.lower().replace(" ", ""))) < 2:
            raise ValueError("Enter a real full name.")
        return name

    @field_validator("department")
    @classmethod
    def validate_department(cls, value: str) -> str:
        dept = value.strip().upper()
        if not _DEPT_RE.match(dept):
            raise ValueError("Enter a valid department code (e.g. CSE, ECE).")
        return dept

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        phone = re.sub(r"\D", "", value.strip())
        if phone.startswith("91") and len(phone) == 12:
            phone = phone[2:]
        if phone in _BAD_PHONES or not _PHONE_RE.match(phone):
            raise ValueError("Enter a valid 10-digit Indian mobile number.")
        return phone


class UserLogin(BaseModel):
    vtu_id: str
    password: str

    @field_validator("vtu_id")
    @classmethod
    def normalize_vtu(cls, value: str) -> str:
        return value.strip().upper()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserPublic"


class UserPublic(BaseModel):
    vtu_id: str
    department: str | None = None
    full_name: str | None = None
    phone: str | None = None
    role: str | None = None

    model_config = {"from_attributes": True}


class ItemCreate(BaseModel):
    item_type: Literal["lost", "found"]
    category: str
    title: str = Field(..., min_length=2, max_length=120)
    description: str = Field(default="", max_length=500)
    location: str
    is_urgent: bool = False

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in VALUABLE_CATEGORIES:
            allowed = ", ".join(VALUABLE_CATEGORIES.keys())
            raise ValueError(f"Only valuable items are allowed. Choose from: {allowed}")
        return value


class ItemPublic(BaseModel):
    id: int
    item_type: str
    category: str
    category_label: str
    title: str
    description: str
    location: str
    status: str
    is_urgent: bool
    image_url: str
    reporter_vtu_id: str
    reporter_department: str | None = None
    reporter_name: str | None = None
    reporter_phone: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchPublic(BaseModel):
    id: int
    combined_score: float
    image_score: float
    text_score: float
    lost_item: ItemPublic
    found_item: ItemPublic
    claim_status: str | None = None


class ClaimCreate(BaseModel):
    match_id: int
    message: str = Field(default="", max_length=300)


class ClaimAgainstFound(BaseModel):
    found_item_id: int
    lost_item_id: int
    message: str = Field(default="", max_length=300)


class FoundAgainstLost(BaseModel):
    lost_item_id: int
    found_item_id: int
    message: str = Field(default="", max_length=300)


class ClaimRespond(BaseModel):
    accept: bool


class ClaimPublic(BaseModel):
    id: int
    status: str
    message: str
    match: MatchPublic
    counterparty: UserPublic
    created_at: datetime
    responded_at: datetime | None = None


class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: datetime


TokenResponse.model_rebuild()
