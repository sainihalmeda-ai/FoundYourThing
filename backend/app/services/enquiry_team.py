"""Who can see safety/ragging reports.

Deliberately an env-configured allowlist rather than a `role` a user could
ever set on themselves — access to other people's harassment/ragging
reports must be something the institution grants explicitly, not app logic.
"""

from __future__ import annotations

from app.config import settings


def _allowlist() -> set[str]:
    return {v.strip().upper() for v in settings.enquiry_team_vtu_ids.split(",") if v.strip()}


def is_enquiry_team(vtu_id: str) -> bool:
    return vtu_id.strip().upper() in _allowlist()
