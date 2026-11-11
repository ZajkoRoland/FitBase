from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    database_url: str = (
        "postgresql+psycopg://fitbase:fitbase_local_secret_2026@127.0.0.1:5432/fitbase"
    )
    jwt_secret: str = Field(
        default="fitbase_thesis_local_secret_key_2026_super_secure_32chars",
        min_length=32,
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    google_client_id: str = (
        "137401623780-j7r0vep09glhjbmg23766ah8hloust41.apps.googleusercontent.com"
    )
    cors_origins: str = "http://localhost:8081,http://127.0.0.1:8081,*"
    groq_api_key: str = ""
    groq_model: str = "qwen/qwen3.8-27b"
    # Google Gemini AI configuration (Primary high-availability engine)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    # Transactional Email configuration (HTTPS API recommended on Render Free Tier; SMTP for local/VPS)
    brevo_api_key: str = ""
    resend_api_key: str = ""
    email_from: str = "fitbase.support@gmail.com"
    email_from_name: str = "FitBase Support"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_tls: bool = True
    # Exercise images. The database only stores relative paths ('images/flat/x.webp').
    # Empty media_base_url = this server serves them under /media/; set it to a full URL
    media_dir: Path = (
        BACKEND_DIR / "images"
        if (BACKEND_DIR / "images").is_dir()
        else BACKEND_DIR.parent / "Gyakorlatok" / "images"
    )
    media_base_url: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
