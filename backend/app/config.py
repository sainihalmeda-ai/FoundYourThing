from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./foundyourthing.db"
    secret_key: str = "dev-secret-change-in-production"
    access_token_expire_minutes: int = 10
    cors_origins: str = "*"
    upload_dir: str = "./uploads"
    match_image_weight: float = 0.85
    match_text_weight: float = 0.15
    match_threshold: float = 0.55
    # LiveGo: require found reports to carry a fresh camera photo. Off until asked for.
    livego_enabled: bool = False
    # How fresh a found-report photo must be, in minutes, when LiveGo is on.
    live_photo_max_age_minutes: int = 30

    class Config:
        env_file = ".env"


settings = Settings()

# Refuse to boot in production-shaped deploys with the default JWT secret.
_using_postgres = settings.database_url.startswith(("postgres://", "postgresql://"))
if _using_postgres and settings.secret_key in {
    "dev-secret-change-in-production",
    "change-this-to-a-long-random-string-in-production",
}:
    raise RuntimeError(
        "SECRET_KEY must be set to a long random value when DATABASE_URL is Postgres. "
        "Generate one (e.g. python -c \"import secrets; print(secrets.token_urlsafe(48))\") "
        "and set it in the host environment / Render dashboard."
    )
