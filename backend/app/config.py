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

    class Config:
        env_file = ".env"


settings = Settings()
