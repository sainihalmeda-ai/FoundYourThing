from datetime import datetime
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import auth, claims, items
from app.schemas import HealthResponse
from app.services.refresh_scores import refresh_embeddings_and_scores

Base.metadata.create_all(bind=engine)

# Recompute visual fingerprints + match % after embedding upgrades.
try:
    with SessionLocal() as db:
        refresh_embeddings_and_scores(db)
except Exception:
    pass

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
