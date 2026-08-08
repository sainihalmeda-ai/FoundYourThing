"""Lightweight column patches for deploys that only use create_all."""

from __future__ import annotations

from sqlalchemy import inspect, text

from app.database import engine, is_sqlite


def ensure_schema() -> None:
    """Add columns that create_all will not add on an existing table."""
    try:
        insp = inspect(engine)
        if "items" not in insp.get_table_names():
            return
        cols = {c["name"] for c in insp.get_columns("items")}
        if "image_data" in cols:
            return
        ddl = (
            "ALTER TABLE items ADD COLUMN image_data BLOB"
            if is_sqlite
            else "ALTER TABLE items ADD COLUMN image_data BYTEA"
        )
        with engine.begin() as conn:
            conn.execute(text(ddl))
        print("[startup] added items.image_data column")
    except Exception as exc:
        print(f"[startup] schema patch skipped: {exc}")
