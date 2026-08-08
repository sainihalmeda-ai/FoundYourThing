"""Critical-path API QA: register x2, lost+found, match, claim, accept."""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"


def req(method, path, data=None, token=None, multipart=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None
    if multipart:
        boundary = "----FYT" + str(int(time.time() * 1000))
        parts = []
        for k, v in multipart.items():
            if isinstance(v, tuple):
                filename, content, ctype = v
                parts.append(
                    (
                        f"--{boundary}\r\n"
                        f'Content-Disposition: form-data; name="{k}"; filename="{filename}"\r\n'
                        f"Content-Type: {ctype}\r\n\r\n"
                    ).encode()
                    + content
                    + b"\r\n"
                )
            else:
                parts.append(
                    (
                        f"--{boundary}\r\n"
                        f'Content-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'
                    ).encode()
                )
        parts.append(f"--{boundary}--\r\n".encode())
        body = b"".join(parts)
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
    elif data is not None:
        body = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=90) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            payload = json.loads(raw)
        except Exception:
            payload = raw
        return e.code, payload


def tiny_jpeg(seed: int = 0) -> bytes:
    return bytes(
        [
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
            0x7F, 0x40 + (seed % 10), 0xFF, 0xD9,
        ]
    )


def main() -> None:
    status, _ = req("GET", "/api/health")
    assert status == 200, "health failed"
    print("OK health")

    suffix = str(int(time.time()))[-6:]
    user_a = {
        "vtu_id": f"VTUQA{suffix}A",
        "full_name": "QA User A",
        "department": "CSE",
        "email": f"qa_a_{suffix}@college.edu",
        "phone": "9876543210",
        "password": "testpass123",
    }
    user_b = {
        "vtu_id": f"VTUQA{suffix}B",
        "full_name": "QA User B",
        "department": "CSE",
        "email": f"qa_b_{suffix}@college.edu",
        "phone": "9876543211",
        "password": "testpass123",
    }

    status, ra = req("POST", "/api/auth/register", user_a)
    assert status in (200, 201), ra
    status, rb = req("POST", "/api/auth/register", user_b)
    assert status in (200, 201), rb
    token_a, token_b = ra["access_token"], rb["access_token"]
    print("OK register A/B")

    jpeg = tiny_jpeg(1)
    status, lost = req(
        "POST",
        "/api/items",
        token=token_a,
        multipart={
            "item_type": "lost",
            "category": "watch",
            "title": "Black smartwatch QA",
            "description": "Black digital watch with metal strap near library",
            "location": "Library",
            "is_urgent": "false",
            "image": ("watch.jpg", jpeg, "image/jpeg"),
        },
    )
    assert status in (200, 201), lost
    lost_id = lost["id"]
    print("OK lost", lost_id)

    status, found = req(
        "POST",
        "/api/items",
        token=token_b,
        multipart={
            "item_type": "found",
            "category": "watch",
            "title": "Black smartwatch found QA",
            "description": "Black digital watch with metal strap near library",
            "location": "Library",
            "is_urgent": "false",
            "image": ("watch2.jpg", jpeg, "image/jpeg"),
        },
    )
    assert status in (200, 201), found
    found_id = found["id"]
    print("OK found", found_id)

    status, matches = req("GET", f"/api/items/{lost_id}/matches", token=token_a)
    assert status == 200, matches
    print("OK matches", len(matches) if isinstance(matches, list) else matches)

    claim = None
    status = 400
    if isinstance(matches, list) and matches:
        status, claim = req(
            "POST",
            "/api/claims",
            token=token_a,
            data={"match_id": matches[0]["id"], "message": "I think this is mine"},
        )
    if status not in (200, 201):
        status, claim = req(
            "POST",
            "/api/claims/against-found",
            token=token_a,
            data={
                "found_item_id": found_id,
                "lost_item_id": lost_id,
                "message": "I think this is mine",
            },
        )
    assert status in (200, 201), claim
    claim_id = claim["id"]
    print("OK claim", claim_id)

    status, resp = req(
        "POST",
        f"/api/claims/{claim_id}/respond",
        token=token_b,
        data={"accept": True},
    )
    assert status in (200, 201), resp
    counter = resp.get("counterparty") if isinstance(resp, dict) else None
    phone = (counter or {}).get("phone") if isinstance(counter, dict) else None
    print("OK accept; phone revealed:", phone)
    assert phone, "phone should be visible after accept"

    status, feed = req("GET", "/api/items", token=token_a)
    assert status == 200, feed
    print("OK feed", len(feed) if isinstance(feed, list) else feed)
    print("CRITICAL PATH API QA PASSED")


if __name__ == "__main__":
    main()
