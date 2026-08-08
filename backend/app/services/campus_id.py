"""Who is allowed on the app at all.

The college issues two kinds of identity numbers: students carry a VTU number
and staff carry a TTS number. Anything else belongs to an outsider, so it is
refused at registration rather than filtered out later.
"""

import re

STUDENT_PREFIX = "VTU"
STAFF_PREFIX = "TTS"

CAMPUS_ID_PATTERN = re.compile(rf"^({STUDENT_PREFIX}|{STAFF_PREFIX})[A-Z0-9]{{3,17}}$")

CAMPUS_ID_ERROR = (
    "Use your college ID: VTU number for students, TTS number for staff. "
    "No other ID can register."
)


def normalize_campus_id(value: str) -> str:
    return value.strip().upper()


def is_campus_id(value: str) -> bool:
    return bool(CAMPUS_ID_PATTERN.match(normalize_campus_id(value)))


def role_for_campus_id(value: str) -> str:
    """Staff numbers grant the staff role; everything else is a student."""
    return "staff" if normalize_campus_id(value).startswith(STAFF_PREFIX) else "student"
