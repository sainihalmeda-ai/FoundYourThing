"""College email rules — block personal Gmail and require campus-shaped addresses.

Students:  {VTUid}@….edu.in          e.g. vtu27680@vtu.edu.in
Faculty:   {name}{number}@….edu.in   e.g. nihal27680@vtu.edu.in
           (name letters, then the digits from their TTS staff ID)
"""

from __future__ import annotations

import re

from app.services.campus_id import (
    STAFF_PREFIX,
    STUDENT_PREFIX,
    normalize_campus_id,
    role_for_campus_id,
)

EDU_IN = re.compile(r"^[^\s@]+@[^\s@]+\.edu\.in$", re.IGNORECASE)
PERSONAL_DOMAINS = {
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.in",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "icloud.com",
    "proton.me",
    "protonmail.com",
    "rediffmail.com",
}


def _local_and_domain(email: str) -> tuple[str, str]:
    local, _, domain = email.strip().lower().partition("@")
    return local, domain


def validate_campus_email(email: str, campus_id: str) -> str | None:
    """Return an error message, or None if the email is allowed."""
    raw = (email or "").strip()
    if not raw:
        return "College email is required."

    local, domain = _local_and_domain(raw)
    if not local or not domain:
        return "Enter a valid college email."

    if domain in PERSONAL_DOMAINS or not domain.endswith(".edu.in"):
        return "Use your college email ending in .edu.in (Gmail and personal mail are not allowed)."

    if not EDU_IN.match(raw):
        return "Use your college email ending in .edu.in."

    cid = normalize_campus_id(campus_id)
    role = role_for_campus_id(cid)
    # Digits/alnum tail after VTU / TTS prefix.
    tail = re.sub(rf"^({STUDENT_PREFIX}|{STAFF_PREFIX})", "", cid, flags=re.IGNORECASE)

    if role == "student":
        # Local part must be the VTU id (with or without separators).
        compact = re.sub(r"[._\-]", "", local)
        if compact != cid.lower() and compact != f"vtu{tail.lower()}":
            return (
                f"Student email must start with your VTU ID, e.g. {cid.lower()}@college.edu.in"
            )
        return None

    # Faculty / staff: name letters, then the staff number digits.
    if not re.match(r"^[a-z][a-z._\-]*\d{3,}$", local):
        return (
            "Faculty email must be your name followed by your staff number, "
            f"e.g. nihal{tail.lower()}@college.edu.in"
        )
    if not local.endswith(tail.lower()):
        return (
            f"Faculty email must end with your staff number ({tail}), "
            f"e.g. name{tail.lower()}@college.edu.in"
        )
    return None
