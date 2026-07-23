from app.constants import DISCLOSURE_CLAIM, DISCLOSURE_CONNECTED, DISCLOSURE_MATCH, DISCLOSURE_PUBLIC
from app.models import ClaimRequest, ClaimStatus, Item, Match, User


def mask_name(full_name: str) -> str:
    parts = full_name.strip().split()
    if not parts:
        return "Student"
    first = parts[0]
    if len(parts) == 1:
        return f"{first[:1]}***"
    return f"{first} {parts[-1][:1]}***"


def user_public(user: User, disclosure: str) -> dict:
    if disclosure == DISCLOSURE_PUBLIC:
        return {"vtu_id": user.vtu_id}
    if disclosure == DISCLOSURE_MATCH:
        return {"vtu_id": user.vtu_id, "department": user.department}
    if disclosure == DISCLOSURE_CLAIM:
        return {
            "vtu_id": user.vtu_id,
            "department": user.department,
            "full_name": mask_name(user.full_name),
        }
    if disclosure == DISCLOSURE_CONNECTED:
        return {
            "vtu_id": user.vtu_id,
            "department": user.department,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": user.role,
        }
    return {"vtu_id": user.vtu_id}


def disclosure_for_viewer(item: Item, viewer: User | None, claim: ClaimRequest | None) -> str:
    if claim and claim.status == ClaimStatus.ACCEPTED and viewer and viewer.id in {
        claim.claimer_id,
        claim.finder_id,
    }:
        return DISCLOSURE_CONNECTED
    if claim and claim.status == ClaimStatus.PENDING and viewer and viewer.id in {
        claim.claimer_id,
        claim.finder_id,
    }:
        return DISCLOSURE_CLAIM
    if viewer and viewer.id == item.user_id:
        return DISCLOSURE_CONNECTED
    return DISCLOSURE_PUBLIC


def disclosure_for_match(viewer: User | None, match: Match, claim: ClaimRequest | None) -> str:
    if not viewer:
        return DISCLOSURE_PUBLIC
    if claim and claim.status == ClaimStatus.ACCEPTED and viewer.id in {
        claim.claimer_id,
        claim.finder_id,
    }:
        return DISCLOSURE_CONNECTED
    if claim and claim.status == ClaimStatus.PENDING and viewer.id in {
        claim.claimer_id,
        claim.finder_id,
    }:
        return DISCLOSURE_CLAIM
    if viewer.id in {match.lost_item.user_id, match.found_item.user_id}:
        return DISCLOSURE_MATCH
    return DISCLOSURE_PUBLIC


def serialize_item(item: Item, viewer: User | None, claim: ClaimRequest | None = None) -> dict:
    from app.constants import VALUABLE_CATEGORIES

    disclosure = disclosure_for_viewer(item, viewer, claim)
    reporter = user_public(item.user, disclosure)
    return {
        "id": item.id,
        "item_type": item.item_type.value,
        "category": item.category,
        "category_label": VALUABLE_CATEGORIES.get(item.category, item.category),
        "title": item.title,
        "description": item.description,
        "location": item.location,
        "status": item.status.value,
        "is_urgent": item.is_urgent,
        "image_url": f"/uploads/{item.image_path}",
        "reporter_vtu_id": reporter.get("vtu_id"),
        "reporter_department": reporter.get("department"),
        "reporter_name": reporter.get("full_name"),
        "reporter_phone": reporter.get("phone"),
        "created_at": item.created_at,
    }
