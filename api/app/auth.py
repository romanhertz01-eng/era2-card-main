from datetime import datetime, timedelta

import bcrypt
from jose import jwt

from app.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(user_id: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expire_hours)
    return jwt.encode(
        {"sub": user_id, "email": email, "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def create_reset_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=1)
    return jwt.encode(
        {"sub": user_id, "purpose": "reset", "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_reset_token(token: str) -> str:
    """Returns user_id if the token is a valid, non-expired reset token."""
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    if payload.get("purpose") != "reset":
        raise ValueError("Invalid token purpose")
    return payload["sub"]
