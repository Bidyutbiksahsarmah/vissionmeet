from pathlib import Path
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    secret_key: str = "dev-secret-key-change-in-production"
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'visionmeet.db').as_posix()}"
    upload_dir: str = str((BACKEND_DIR / "uploads").resolve())
    gemini_api_key: str = ""
    access_token_expire_minutes: int = 1440
    algorithm: str = "HS256"

    model_config = {
        "env_file": str(BACKEND_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    def get_database_url(self) -> str:
        if self.database_url.startswith("sqlite:///./"):
            rel = self.database_url[len("sqlite:///./") :]
            abs_p = (BACKEND_DIR / rel).resolve().as_posix()
            return f"sqlite:///{abs_p}"
        return self.database_url

    def get_upload_dir(self) -> Path:
        p = Path(self.upload_dir)
        if not p.is_absolute():
            p = (BACKEND_DIR / p).resolve()
        p.mkdir(parents=True, exist_ok=True)
        return p


settings = Settings()
