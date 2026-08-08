from datetime import datetime
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine, get_db
from app.routers import auth, claims, items
from app.schemas import HealthResponse
from app.services.refresh_scores import refresh_embeddings_and_scores
from app.services.schema_migrate import ensure_schema
from app.services.storage import media_response

Base.metadata.create_all(bind=engine)
ensure_schema()

# Recompute visual fingerprints + match % after embedding upgrades.
try:
    with SessionLocal() as db:
        stats = refresh_embeddings_and_scores(db)
    if any(stats.values()):
        print(
            f"[startup] re-fingerprinted {stats['items']} items, "
            f"rescored {stats['matches']} matches, dropped {stats['dropped']} weak ones"
        )
except Exception as exc:  # never block boot on a bad photo file
    print(f"[startup] embedding refresh skipped: {exc}")

app = FastAPI(
    title="FoundYourThing API",
    description="Campus AI-powered lost & found with privacy-first contact sharing.",
    version="0.1.0",
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = Path(settings.upload_dir)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

app.include_router(auth.router, prefix="/api")
app.include_router(items.router, prefix="/api")
app.include_router(claims.router, prefix="/api")


@app.get("/api/media/{filename}")
def serve_item_photo(filename: str, db: Session = Depends(get_db)):
    """Public item photos — loaded from Postgres so free Render disk wipes don't blank them."""
    return media_response(filename, db)


@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        message="FoundYourThing server is running.",
        timestamp=datetime.utcnow(),
    )


@app.get("/")
def root():
    return {
        "app": "FoundYourThing",
        "docs": "/docs",
        "health": "/api/health",
    }
