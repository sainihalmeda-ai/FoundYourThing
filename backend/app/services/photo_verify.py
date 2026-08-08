"""Live-photo verification for found reports.

A photo saved from the internet is either stripped of EXIF entirely (social
media, messaging apps, screenshots) or carries a capture timestamp from long
before the report. A phone that just photographed the item carries both a
camera make/model and a timestamp from moments ago, so we require both.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from io import BytesIO

from PIL import Image

# Standard EXIF tag ids (see EXIF 2.3 spec).
TAG_MAKE = 271
TAG_MODEL = 272
TAG_SOFTWARE = 305
TAG_DATETIME = 306
TAG_DATETIME_ORIGINAL = 36867
TAG_DATETIME_DIGITIZED = 36868

_DATETIME_KEYS = ("DateTimeOriginal", "DateTimeDigitized", "DateTime")
_EXIF_DATETIME_FORMATS = ("%Y:%m:%d %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y:%m:%d %H:%M")

# Software tags left behind by editors and AI generators.
_EDITOR_HINTS = (
    "photoshop",
    "lightroom",
    "gimp",
    "canva",
    "picsart",
    "snapseed",
    "pixlr",
    "midjourney",
    "dall",
    "stable diffusion",
    "screenshot",
)


@dataclass
class PhotoCheck:
    ok: bool
    reason: str = ""


def _clean(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        value = value.decode("utf-8", "ignore")
    return str(value).strip().strip("\x00")


def _parse_datetime(value) -> datetime | None:
    text = _clean(value)
    if not text:
        return None
    for fmt in _EXIF_DATETIME_FORMATS:
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    # ISO strings sent by the mobile client.
    try:
        return datetime.fromisoformat(text.replace("Z", "")).replace(tzinfo=None)
    except ValueError:
        return None


def exif_from_bytes(content: bytes) -> dict:
    """Camera fields from the uploaded file, keyed by readable name."""
    try:
        with Image.open(BytesIO(content)) as image:
            raw = image.getexif()
    except Exception:
        return {}
    if not raw:
        return {}

    data = {
        "Make": _clean(raw.get(TAG_MAKE)),
        "Model": _clean(raw.get(TAG_MODEL)),
        "Software": _clean(raw.get(TAG_SOFTWARE)),
        "DateTime": _clean(raw.get(TAG_DATETIME)),
    }
    try:
        sub = raw.get_ifd(0x8769)
    except Exception:
        sub = {}
    if sub:
        data["DateTimeOriginal"] = _clean(sub.get(TAG_DATETIME_ORIGINAL))
        data["DateTimeDigitized"] = _clean(sub.get(TAG_DATETIME_DIGITIZED))
    return {key: value for key, value in data.items() if value}


def parse_client_exif(payload: str) -> dict:
    """EXIF reported by the picker, used when re-encoding drops it from the file."""
    if not payload:
        return {}
    try:
        data = json.loads(payload)
    except (ValueError, TypeError):
        return {}
    if not isinstance(data, dict):
        return {}
    return {key: _clean(value) for key, value in data.items() if _clean(value)}


def _capture_time(exif: dict) -> datetime | None:
    for key in _DATETIME_KEYS:
        parsed = _parse_datetime(exif.get(key))
        if parsed:
            return parsed
    return None


def looks_like_web_image(content: bytes) -> str:
    """Why the pixels look like a download rather than a camera frame."""
    try:
        with Image.open(BytesIO(content)) as image:
            fmt = (image.format or "").upper()
            width, height = image.size
    except Exception:
        return "the file could not be read as a photo"

    if fmt in {"PNG", "WEBP", "GIF"}:
        return "it is a screenshot or web graphic, not a camera photo"

    pixels = max(width * height, 1)
    if pixels < 300_000:
        return f"it is only {width}x{height} — far smaller than any phone camera photo"
    if width % 10 == 0 and height % 10 == 0:
        return f"its {width}x{height} size is a rounded web size, not a camera size"
    if len(content) / pixels < 0.08:
        return "it was heavily re-compressed for the web"

    return "it carries no camera information"


def verify_live_capture(
    content: bytes,
    client_exif: str = "",
    client_now: str = "",
    max_age_minutes: int = 30,
) -> PhotoCheck:
    """Accept only photos a camera produced within the last `max_age_minutes`."""
    exif = exif_from_bytes(content)
    fallback = parse_client_exif(client_exif)
    for key, value in fallback.items():
        exif.setdefault(key, value)

    software = exif.get("Software", "").lower()
    if any(hint in software for hint in _EDITOR_HINTS):
        return PhotoCheck(
            False,
            "This photo was edited or is a screenshot. Use an unedited photo taken "
            "with your camera.",
        )

    if not exif.get("Make") and not exif.get("Model"):
        return PhotoCheck(
            False,
            f"This looks like a downloaded image — {looks_like_web_image(content)}. "
            "Use a photo you just took of the item with your camera.",
        )

    captured = _capture_time(exif)
    if not captured:
        return PhotoCheck(
            False,
            "This photo has no capture time, so we cannot confirm it is live. "
            "Take a fresh photo of the item.",
        )

    # EXIF times are device-local with no zone, so compare against the device
    # clock when the client sends it. Falls back to server time.
    reference = _parse_datetime(client_now) or datetime.now()
    age = reference - captured

    if age > timedelta(minutes=max_age_minutes):
        return PhotoCheck(
            False,
            f"This photo was taken on {captured.strftime('%d %b %Y, %I:%M %p')}, not just now. "
            "Found reports need a live photo of the item in front of you.",
        )
    if age < timedelta(hours=-12):
        return PhotoCheck(
            False,
            "This photo's capture time is invalid. Check your device clock and retake it.",
        )

    return PhotoCheck(True)
