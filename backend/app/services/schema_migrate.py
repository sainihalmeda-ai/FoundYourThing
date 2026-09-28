"""Lightweight column patches for deploys that only use create_all."""

from __future__ import annotations

from sqlalchemy import inspect, text

from app.database import engine, is_sqlite


def _add_column_if_missing(insp, table: str, column: str, sqlite_type: str, pg_type: str) -> None:
    if table not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns(table)}
    if column in cols:
        return
    ddl_type = sqlite_type if is_sqlite else pg_type
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))
    print(f"[startup] added {table}.{column} column")


def ensure_schema() -> None:
    """Add columns that create_all will not add on an existing table."""
    try:
        insp = inspect(engine)
        _add_column_if_missing(insp, "items", "image_data", "BLOB", "BYTEA")
        # Re-inspect: the columns just added above aren't visible on the
        # inspector snapshot taken before them.
        insp = inspect(engine)
        _add_column_if_missing(insp, "users", "photo_path", "VARCHAR(255)", "VARCHAR(255)")
        _add_column_if_missing(insp, "users", "photo_data", "BLOB", "BYTEA")
    except Exception as exc:
        print(f"[startup] schema patch skipped: {exc}")
