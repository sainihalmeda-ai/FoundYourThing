"""Item photo storage — Postgres bytes (durable) + local disk + optional Supabase."""

from __future__ import annotations

import logging
import mimetypes
from pathlib import Path

import httpx
from fastapi import HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Item

log = logging.getLogger(__name__)


def local_upload_path(filename: str) -> Path:
    root = Path(settings.upload_dir)
    root.mkdir(parents=True, exist_ok=True)
    return root / filename


def supabase_configured() -> bool:
    return bool(settings.supabase_url and settings.supabase_service_role_key)


def public_image_url(image_path: str) -> str:
    """URL the mobile app should load for an item photo."""
    if not image_path:
        return ""
    if image_path.startswith("http://") or image_path.startswith("https://"):
        return image_path
    if supabase_configured():
        base = settings.supabase_url.rstrip("/")
        bucket = settings.supabase_storage_bucket
        return f"{base}/storage/v1/object/public/{bucket}/{image_path}"
    # Served from DB (or disk fallback) — survives Render free-disk wipes.
    return f"/api/media/{image_path}"


def save_item_photo(filename: str, content: bytes, content_type: str) -> None:
    """Write to local disk; optionally mirror to Supabase Storage."""
    path = local_upload_path(filename)
    path.write_bytes(content)

    if not supabase_configured():
        return

    base = settings.supabase_url.rstrip("/")
    bucket = settings.supabase_storage_bucket
    url = f"{base}/storage/v1/object/{bucket}/{filename}"
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
        "Content-Type": content_type or "application/octet-stream",
        "x-upsert": "true",
    }
    try:
        with httpx.Client(timeout=60.0) as client:
            client.post(
                f"{base}/storage/v1/bucket",
                headers={
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                    "apikey": settings.supabase_service_role_key,
                    "Content-Type": "application/json",
                },
                json={
                    "id": bucket,
                    "name": bucket,
                    "public": True,
                    "file_size_limit": 5_242_880,
                    "allowed_mime_types": [
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                    ],
                },
            )
            resp = client.post(url, content=content, headers=headers)
            if resp.status_code >= 400:
                resp = client.put(url, content=content, headers=headers)
            if resp.status_code >= 400:
                log.error(
                    "Supabase Storage upload failed (%s): %s",
                    resp.status_code,
                    resp.text[:300],
                )
                raise RuntimeError(
                    f"Could not store photo in Supabase Storage ({resp.status_code})."
                )
    except httpx.HTTPError as exc:
        log.exception("Supabase Storage request failed")
        raise RuntimeError("Could not reach Supabase Storage for photo upload.") from exc


def media_response(filename: str, db: Session) -> Response:
    """Return photo bytes from Postgres first, then local disk."""
    safe = Path(filename).name
    if not safe or safe != filename or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=404, detail="Photo not found.")

    item = db.query(Item).filter(Item.image_path == safe).first()
    if item and item.image_data:
        mime = mimetypes.guess_type(safe)[0] or "image/jpeg"
        return Response(
            content=bytes(item.image_data),
            media_type=mime,
            headers={"Cache-Control": "public, max-age=86400"},
        )

    path = local_upload_path(safe)
    if path.is_file():
        mime = mimetypes.guess_type(safe)[0] or "image/jpeg"
        return Response(
            content=path.read_bytes(),
            media_type=mime,
            headers={"Cache-Control": "public, max-age=86400"},
        )

    raise HTTPException(status_code=404, detail="Photo not found.")
