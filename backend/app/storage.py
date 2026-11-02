import os
import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile

from app.config import settings


def get_upload_dir() -> Path:
    """Ensure upload directory exists and return its absolute path."""
    return settings.get_upload_dir()


async def save_uploaded_file(upload_file: UploadFile, meeting_id: int) -> str:
    """Save an incoming audio stream or file to disk and return its absolute path."""
    upload_dir = get_upload_dir()
    original_extension = Path(upload_file.filename or "audio.webm").suffix
    if not original_extension:
        original_extension = ".webm"

    filename = f"meeting_{meeting_id}_{uuid.uuid4().hex[:8]}{original_extension}"
    target_path = (upload_dir / filename).resolve()

    with target_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return str(target_path)


def delete_file_if_exists(file_path: str) -> None:
    """Remove a stored file if it exists."""
    try:
        p = Path(file_path)
        if not p.is_absolute():
            candidate = get_upload_dir() / p.name
            if candidate.exists():
                p = candidate
        if p.exists() and p.is_file():
            p.unlink()
    except OSError:
        pass
