from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


def _normalize_database_url(url: str) -> str:
    """Accept a Supabase/Postgres URI and force the psycopg2 SQLAlchemy driver."""
    if url.startswith("postgres://"):
        return "postgresql+psycopg2://" + url[len("postgres://") :]
    if url.startswith("postgresql://") and "+psycopg" not in url:
        return "postgresql+psycopg2://" + url[len("postgresql://") :]
    return url


DATABASE_URL = _normalize_database_url(settings.database_url)
is_sqlite = DATABASE_URL.startswith("sqlite")
# `timeout` makes a busy SQLite database wait instead of failing the request.
connect_args = {"check_same_thread": False, "timeout": 30} if is_sqlite else {}
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    # Persistent FastAPI process: keep a small pool; Supabase free tier is tight.
    pool_size=5 if not is_sqlite else 5,
    max_overflow=5 if not is_sqlite else 10,
)


if is_sqlite:

    @event.listens_for(engine, "connect")
    def _apply_sqlite_pragmas(dbapi_connection, _record):
        """Let many students read while one writes.

        The default rollback journal locks the whole file for every write, so a
        single upload blocks every other request. WAL keeps readers running, and
        busy_timeout retries briefly instead of raising "database is locked".
        """
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=10000")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
