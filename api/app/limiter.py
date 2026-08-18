from fastapi import Request
from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_user_id(request: Request) -> str:
    try:
        auth = request.headers.get("Authorization", "")
        token = auth.removeprefix("Bearer ").strip()
        if token:
            from app.config import settings
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            return f"user:{payload['sub']}"
    except (JWTError, KeyError, Exception):
        pass
    return get_remote_address(request)


limiter = Limiter(key_func=get_remote_address)
