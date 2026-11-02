import datetime
from typing import Optional
import bcrypt
from jose import JWTError, jwt

from app.config import settings


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(
    user_id: int, expires_delta: Optional[datetime.timedelta] = None
) -> str:
    """Create a signed JWT access token for the given user."""
    now = datetime.datetime.now(datetime.timezone.utc)
    if expires_delta is None:
        expires_delta = datetime.timedelta(
            minutes=settings.access_token_expire_minutes
        )
    expire = now + expires_delta
    payload = {"sub": str(user_id), "exp": expire, "iat": now}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> Optional[int]:
    """Decode a JWT and return the user_id, or None if invalid."""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            return None
        return int(user_id_str)
    except (JWTError, ValueError):
        return None
