from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.constants import VALUABLE_CATEGORIES


class UserRegister(BaseModel):
    vtu_id: str = Field(..., min_length=5, max_length=20, examples=["VTU27680"])
    full_name: str = Field(..., min_length=2, max_length=120)
    department: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6, max_length=128)

    @field_validator("vtu_id")
    @classmethod
    def normalize_vtu(cls, value: str) -> str:
        return value.strip().upper()


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
