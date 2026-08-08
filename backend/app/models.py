import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    LargeBinary,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ItemType(str, enum.Enum):
    LOST = "lost"
    FOUND = "found"


class ItemStatus(str, enum.Enum):
    OPEN = "open"
    MATCHED = "matched"
    CLAIM_PENDING = "claim_pending"
    CONNECTED = "connected"
    RECOVERED = "recovered"
    CLOSED = "closed"


class ClaimStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


def _enum_values(enum_cls: type[enum.Enum]) -> list[str]:
    """Store enum *values* in Postgres, not member names like LOST/OPEN."""
    return [member.value for member in enum_cls]


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    vtu_id: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    department: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(20))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="student")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    items: Mapped[list["Item"]] = relationship(back_populates="user")
    claims_made: Mapped[list["ClaimRequest"]] = relationship(
        back_populates="claimer", foreign_keys="ClaimRequest.claimer_id"
    )
    claims_received: Mapped[list["ClaimRequest"]] = relationship(
        back_populates="finder", foreign_keys="ClaimRequest.finder_id"
    )


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    item_type: Mapped[ItemType] = mapped_column(
        Enum(ItemType, values_callable=_enum_values, name="itemtype")
    )
    category: Mapped[str] = mapped_column(String(40), index=True)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    location: Mapped[str] = mapped_column(String(80))
    image_path: Mapped[str] = mapped_column(String(255))
    # Survives Render free-tier disk wipes (ephemeral /uploads).
    image_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    image_embedding: Mapped[list | None] = mapped_column(JSON, nullable=True)
    text_embedding: Mapped[list | None] = mapped_column(JSON, nullable=True)
    status: Mapped[ItemStatus] = mapped_column(
        Enum(ItemStatus, values_callable=_enum_values, name="itemstatus"),
        default=ItemStatus.OPEN,
    )
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship(back_populates="items")
    matches_as_lost: Mapped[list["Match"]] = relationship(
        back_populates="lost_item", foreign_keys="Match.lost_item_id"
    )
    matches_as_found: Mapped[list["Match"]] = relationship(
        back_populates="found_item", foreign_keys="Match.found_item_id"
    )


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lost_item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), index=True)
    found_item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), index=True)
    image_score: Mapped[float] = mapped_column(Float, default=0.0)
    text_score: Mapped[float] = mapped_column(Float, default=0.0)
    combined_score: Mapped[float] = mapped_column(Float, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lost_item: Mapped["Item"] = relationship(
        back_populates="matches_as_lost", foreign_keys=[lost_item_id]
    )
    found_item: Mapped["Item"] = relationship(
        back_populates="matches_as_found", foreign_keys=[found_item_id]
    )
    claim: Mapped["ClaimRequest | None"] = relationship(back_populates="match", uselist=False)


class ClaimRequest(Base):
    __tablename__ = "claim_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id"), unique=True)
    claimer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    finder_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[ClaimStatus] = mapped_column(
        Enum(ClaimStatus, values_callable=_enum_values, name="claimstatus"),
        default=ClaimStatus.PENDING,
    )
    message: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    match: Mapped["Match"] = relationship(back_populates="claim")
    claimer: Mapped["User"] = relationship(back_populates="claims_made", foreign_keys=[claimer_id])
    finder: Mapped["User"] = relationship(back_populates="claims_received", foreign_keys=[finder_id])
