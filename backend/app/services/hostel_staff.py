"""Who can see and update every hostel complaint (wardens / hostel office).

Same env-allowlist approach as enquiry_team.py: access to other students'
complaints is granted by the institution, never set by a user on themselves.
"""

from __future__ import annotations

from app.config import settings


def _allowlist() -> set[str]:
    return {v.strip().upper() for v in settings.hostel_staff_vtu_ids.split(",") if v.strip()}


def is_hostel_staff(vtu_id: str) -> bool:
    return vtu_id.strip().upper() in _allowlist()
