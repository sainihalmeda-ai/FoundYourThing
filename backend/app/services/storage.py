"""Item photo storage — local disk, optionally mirrored to Supabase Storage."""

from __future__ import annotations

import logging
from pathlib import Path

import httpx

from app.config import settings

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
    return f"/uploads/{image_path}"


def save_item_photo(filename: str, content: bytes, content_type: str) -> None:
    """Write to local disk; also upload to Supabase when credentials are set."""
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
            # Ensure public bucket exists (idempotent-ish; ignore "already exists").
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
                # Some Storage versions prefer PUT for upsert.
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
