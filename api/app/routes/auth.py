import base64
import hashlib
import hmac
import logging
import os
import secrets as _secrets
import time
from datetime import datetime, timedelta

import httpx

logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select
from typing import Optional

from app.auth import create_reset_token, create_token, decode_reset_token, hash_password, verify_password
from app.config import settings
from app.database import get_session
from app.limiter import limiter
from app.models import GuestIP, User
from app.services.email import send_email

router = APIRouter()

# In-memory store for pending Telegram bot auth tokens: token -> {created_at, state, jwt}
_tg_pending: dict[str, dict] = {}
_TG_TOKEN_TTL = 600  # 10 minutes

YANDEX_AUTH_URL = "https://oauth.yandex.ru/authorize"
YANDEX_TOKEN_URL = "https://oauth.yandex.ru/token"
YANDEX_USER_URL = "https://login.yandex.ru/info"

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

VK_AUTH_URL = "https://id.vk.com/authorize"
VK_TOKEN_URL = "https://id.vk.com/oauth2/auth"
VK_USER_URL = "https://id.vk.com/oauth2/user_info"


def _pkce_pair() -> tuple[str, str]:
    """Generate (code_verifier, code_challenge) for PKCE."""
    verifier = base64.urlsafe_b64encode(os.urandom(32)).rstrip(b"=").decode()
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return verifier, challenge

REFERRAL_BONUS = 20


def _encode_state(ref: Optional[str], guest_id: Optional[str]) -> Optional[str]:
    if not ref and not guest_id:
        return None
    return f"{ref or ''}|{guest_id or ''}"


def _decode_state(state: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    if not state:
        return None, None
    if '|' not in state:
        return state, None  # backward compat: old format was just ref_code
    ref, _, guest_id = state.partition('|')
    return ref or None, guest_id or None


def _convert_or_create_oauth_user(
    db: Session,
    *,
    email: Optional[str],
    name: str,
    password_hash: str,
    vk_id: Optional[str] = None,
    tg_id: Optional[str] = None,
    google_id: Optional[str] = None,
    ref_code: Optional[str],
    guest_id: Optional[str],
) -> 'User':
    """Find existing user or convert guest or create new for OAuth flows."""
    # 1. Look up by OAuth-specific ID
    existing = None
    if google_id:
        existing = db.exec(select(User).where(User.google_id == google_id)).first()
    if not existing and vk_id:
        existing = db.exec(select(User).where(User.vk_id == vk_id)).first()
    if not existing and tg_id:
        existing = db.exec(select(User).where(User.tg_id == tg_id)).first()
    if not existing and email:
        existing = db.exec(select(User).where(User.email == email)).first()

    if existing:
        changed = False
        if google_id and not existing.google_id:
            existing.google_id = google_id
            changed = True
        if vk_id and not existing.vk_id:
            existing.vk_id = vk_id
            changed = True
        if not existing.email and email:
            existing.email = email
            changed = True
        if changed:
            db.add(existing)
            db.commit()
            db.refresh(existing)
        return existing

    # 2. Try to convert guest
    guest = db.get(User, guest_id) if guest_id else None
    if guest and guest.is_guest:
        guest.email = email
        guest.name = name
        guest.password_hash = password_hash
        guest.is_guest = False
        if vk_id:
            guest.vk_id = vk_id
        if tg_id:
            guest.tg_id = tg_id
        if google_id:
            guest.google_id = google_id
        guest.referred_by_id = _credit_referrer(db, ref_code, guest.id)
        db.add(guest)
        db.commit()
        db.refresh(guest)
        return guest

    # 3. Create new user
    user = User(email=email, name=name, password_hash=password_hash,
                vk_id=vk_id, tg_id=tg_id, google_id=google_id)
    db.add(user)
    db.flush()
    user.referred_by_id = _credit_referrer(db, ref_code, user.id)
    db.commit()
    db.refresh(user)
    return user


def _credit_referrer(db: Session, ref_code: Optional[str], new_user_id: str) -> Optional[str]:
    """Find referrer by user id, credit bonus, return referrer id or None."""
    if not ref_code:
        return None
    referrer = db.get(User, ref_code)
    if not referrer or referrer.id == new_user_id:
        return None
    referrer.balance += REFERRAL_BONUS
    db.add(referrer)
    return referrer.id


class RegisterBody(BaseModel):
    email: EmailStr
    password: str
    name: str
    ref_code: Optional[str] = None


class LoginBody(BaseModel):
    email: str
    password: str


def _user_response(user: User, token: str) -> dict:
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "name": user.name, "balance": user.balance},
    }


@router.post("/guest", status_code=201)
def create_guest(request: Request, db: Session = Depends(get_session)):
    ip = (
        request.headers.get("x-real-ip")
        or (request.client.host if request.client else "unknown")
    )
    since = datetime.utcnow() - timedelta(hours=24)
    if db.exec(select(GuestIP).where(GuestIP.ip == ip, GuestIP.created_at >= since)).first():
        raise HTTPException(429, "Попробуйте завтра")

    user = User(name="Гость", password_hash="guest", is_guest=True)
    db.add(user)
    db.flush()
    db.add(GuestIP(ip=ip))
    db.commit()
    db.refresh(user)
    return _user_response(user, create_token(user.id, ""))


@router.post("/register", status_code=201)
def register(body: RegisterBody, request: Request, db: Session = Depends(get_session)):
    # Конвертация гостевого аккаунта если запрос с гостевым токеном
    guest_user = None
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            from app.auth import decode_token
            payload = decode_token(auth_header[7:])
            candidate = db.get(User, payload["sub"])
            if candidate and candidate.is_guest:
                guest_user = candidate
        except Exception:
            pass

    if guest_user:
        if db.exec(select(User).where(User.email == body.email, User.id != guest_user.id)).first():
            raise HTTPException(409, "Такой email уже зарегистрирован")
        guest_user.email = body.email
        guest_user.name = body.name
        guest_user.password_hash = hash_password(body.password)
        guest_user.is_guest = False
        if body.ref_code:
            guest_user.referred_by_id = _credit_referrer(db, body.ref_code, guest_user.id)
        db.add(guest_user)
        db.commit()
        db.refresh(guest_user)
        return _user_response(guest_user, create_token(guest_user.id, guest_user.email))

    if db.exec(select(User).where(User.email == body.email)).first():
        raise HTTPException(409, "Такой email уже зарегистрирован")

    user = User(email=body.email, name=body.name, password_hash=hash_password(body.password))
    db.add(user)
    db.flush()
    user.referred_by_id = _credit_referrer(db, body.ref_code, user.id)
    db.commit()
    db.refresh(user)
    return _user_response(user, create_token(user.id, user.email))


OAUTH_PASSWORD_PLACEHOLDERS = {
    "google_oauth": "Google",
    "vk_oauth": "VK",
    "tg_oauth": "Telegram",
    "yandex_oauth": "Яндекс",
}
# Провайдеры, вход через которые отключён — таким юзерам нужно предлагать
# восстановление пароля, а не "войдите через этот способ".
DISABLED_OAUTH_PROVIDERS: set[str] = {"google_oauth"}


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, body: LoginBody, db: Session = Depends(get_session)):
    user = db.exec(select(User).where(User.email == body.email)).first()
    if not user:
        raise HTTPException(401, "Неверный email или пароль")
    if user.password_hash in DISABLED_OAUTH_PROVIDERS:
        raise HTTPException(401, "Этот аккаунт был привязан к Google. Восстановите пароль, чтобы войти.")
    provider = OAUTH_PASSWORD_PLACEHOLDERS.get(user.password_hash)
    if provider:
        raise HTTPException(401, f"Этот аккаунт зарегистрирован через {provider}. Войдите через этот способ.")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Неверный email или пароль")
    return _user_response(user, create_token(user.id, user.email))


class ForgotPasswordBody(BaseModel):
    email: EmailStr


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, body: ForgotPasswordBody, db: Session = Depends(get_session)):
    user = db.exec(select(User).where(User.email == body.email)).first()
    if user:
        token = create_reset_token(user.id)
        link = f"{settings.frontend_url}/auth/reset-password?token={token}"
        send_email(
            user.email,
            "Восстановление пароля — ERA2 Card",
            f"<p>Чтобы установить новый пароль, перейдите по ссылке (действует 1 час):</p>"
            f'<p><a href="{link}">{link}</a></p>'
            f"<p>Если вы не запрашивали восстановление пароля, просто игнорируйте это письмо.</p>",
        )
    # Не показываем, существует ли email в базе.
    return {"ok": True}


class ResetPasswordBody(BaseModel):
    token: str
    new_password: str


@router.post("/reset-password")
@limiter.limit("10/minute")
def reset_password(request: Request, body: ResetPasswordBody, db: Session = Depends(get_session)):
    try:
        user_id = decode_reset_token(body.token)
    except Exception:
        raise HTTPException(400, "Ссылка недействительна или устарела")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Пользователь не найден")

    if len(body.new_password) < 6:
        raise HTTPException(400, "Пароль слишком короткий")

    user.password_hash = hash_password(body.new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_response(user, create_token(user.id, user.email or ""))


@router.get("/yandex")
def yandex_login(ref: Optional[str] = None, guest_id: Optional[str] = None):
    if not settings.yandex_client_id:
        raise HTTPException(503, "Yandex OAuth not configured")
    redirect_uri = f"{settings.api_base_url}/api/auth/yandex/callback"
    state = _encode_state(ref, guest_id)
    url = (
        f"{YANDEX_AUTH_URL}"
        f"?response_type=code"
        f"&client_id={settings.yandex_client_id}"
        f"&redirect_uri={redirect_uri}"
        + (f"&state={state}" if state else "")
    )
    return RedirectResponse(url)


@router.get("/yandex/callback")
async def yandex_callback(code: str, state: Optional[str] = None, db: Session = Depends(get_session)):
    if not settings.yandex_client_id or not settings.yandex_client_secret:
        raise HTTPException(503, "Yandex OAuth not configured")

    redirect_uri = f"{settings.api_base_url}/api/auth/yandex/callback"
    frontend_url = settings.frontend_url

    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_resp = await client.post(
            YANDEX_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": settings.yandex_client_id,
                "client_secret": settings.yandex_client_secret,
                "redirect_uri": redirect_uri,
            },
        )
        if token_resp.status_code != 200:
            return RedirectResponse(f"{frontend_url}/auth?error=yandex_token_failed")
        access_token = token_resp.json().get("access_token")

        # Get user profile
        user_resp = await client.get(
            YANDEX_USER_URL,
            headers={"Authorization": f"OAuth {access_token}"},
            params={"format": "json"},
        )
        if user_resp.status_code != 200:
            return RedirectResponse(f"{frontend_url}/auth?error=yandex_user_failed")
        yandex_data = user_resp.json()

    email = yandex_data.get("default_email") or yandex_data.get("emails", [None])[0]
    name = yandex_data.get("real_name") or yandex_data.get("login") or "Пользователь"

    if not email:
        return RedirectResponse(f"{frontend_url}/auth?error=no_email")

    ref_code, guest_id = _decode_state(state)
    user = _convert_or_create_oauth_user(
        db, email=email, name=name, password_hash="yandex_oauth",
        ref_code=ref_code, guest_id=guest_id,
    )

    token = create_token(user.id, user.email or "")
    return RedirectResponse(f"{frontend_url}/auth/callback?token={token}")


@router.get("/vk")
def vk_login(ref: Optional[str] = None, guest_id: Optional[str] = None):
    if not settings.vk_client_id:
        raise HTTPException(503, "VK OAuth not configured")
    redirect_uri = f"{settings.api_base_url}/api/auth/vk/callback"
    verifier, challenge = _pkce_pair()
    state = _encode_state(ref, guest_id)
    url = (
        f"{VK_AUTH_URL}"
        f"?response_type=code"
        f"&client_id={settings.vk_client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=email"
        f"&code_challenge={challenge}"
        f"&code_challenge_method=S256"
        + (f"&state={state}" if state else "")
    )
    response = RedirectResponse(url)
    response.set_cookie("vk_cv", verifier, httponly=True, secure=True, max_age=600, samesite="lax")
    return response


@router.get("/vk/callback")
async def vk_callback(
    request: Request,
    code: str,
    state: Optional[str] = None,
    device_id: Optional[str] = None,
    db: Session = Depends(get_session),
):
    if not settings.vk_client_id or not settings.vk_client_secret:
        raise HTTPException(503, "VK OAuth not configured")

    redirect_uri = f"{settings.api_base_url}/api/auth/vk/callback"
    frontend_url = settings.frontend_url
    code_verifier = request.cookies.get("vk_cv", "")

    async with httpx.AsyncClient() as client:
        # Exchange code for token (VK ID: query params + code in body)
        token_params = {
            "grant_type": "authorization_code",
            "client_id": settings.vk_client_id,
            "redirect_uri": redirect_uri,
            "code_verifier": code_verifier,
        }
        if device_id:
            token_params["device_id"] = device_id
        if state:
            token_params["state"] = state
        token_resp = await client.post(
            VK_TOKEN_URL,
            params=token_params,
            data={"code": code},
        )
        if token_resp.status_code != 200:
            logger.error("VK token exchange failed: %s %s", token_resp.status_code, token_resp.text)
            return RedirectResponse(f"{frontend_url}/auth?error=vk_token_failed")
        token_data = token_resp.json()
        if "error" in token_data:
            logger.error("VK token error: %s", token_data)
            return RedirectResponse(f"{frontend_url}/auth?error=vk_token_failed")

        access_token = token_data["access_token"]
        vk_user_id = str(token_data["user_id"])

        # Get user info (VK ID: access_token in body, client_id in query)
        user_resp = await client.post(
            VK_USER_URL,
            params={"client_id": settings.vk_client_id},
            data={"access_token": access_token},
        )
        vk_profile = user_resp.json().get("user", {})
        first = vk_profile.get("first_name", "")
        last = vk_profile.get("last_name", "")
        name = f"{first} {last}".strip() or "Пользователь"
        email = vk_profile.get("email") or None

    ref_code, guest_id = _decode_state(state)
    user = _convert_or_create_oauth_user(
        db, email=email, name=name, password_hash="vk_oauth",
        vk_id=vk_user_id, ref_code=ref_code, guest_id=guest_id,
    )

    token = create_token(user.id, user.email or "")
    return RedirectResponse(f"{frontend_url}/auth/callback?token={token}")


class VKSdkRequest(BaseModel):
    code: str
    device_id: str
    state: Optional[str] = None
    ref: Optional[str] = None
    guest_id: Optional[str] = None


@router.post("/vk/sdk")
async def vk_sdk_callback(body: VKSdkRequest, db: Session = Depends(get_session)):
    """Token exchange for VK ID SDK (OneTap) redirect flow — uses device_id instead of PKCE."""
    if not settings.vk_client_id:
        raise HTTPException(503, "VK OAuth not configured")

    redirect_uri = f"{settings.frontend_url}/auth/vk-callback"

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            VK_TOKEN_URL,
            params={
                "grant_type": "authorization_code",
                "client_id": settings.vk_client_id,
                "redirect_uri": redirect_uri,
                "device_id": body.device_id,
                **({"state": body.state} if body.state else {}),
            },
            data={"code": body.code},
        )
        if token_resp.status_code != 200:
            logger.error("VK SDK token exchange failed: %s %s", token_resp.status_code, token_resp.text)
            raise HTTPException(400, "VK token exchange failed")
        token_data = token_resp.json()
        if "error" in token_data:
            logger.error("VK SDK token error: %s", token_data)
            raise HTTPException(400, token_data.get("error_description", "VK auth error"))

        access_token = token_data["access_token"]
        vk_user_id = str(token_data["user_id"])

        user_resp = await client.post(
            VK_USER_URL,
            params={"client_id": settings.vk_client_id},
            data={"access_token": access_token},
        )
        vk_profile = user_resp.json().get("user", {})
        first = vk_profile.get("first_name", "")
        last = vk_profile.get("last_name", "")
        name = f"{first} {last}".strip() or "Пользователь"
        email = vk_profile.get("email") or None

    user = _convert_or_create_oauth_user(
        db, email=email, name=name, password_hash="vk_oauth",
        vk_id=vk_user_id, ref_code=body.ref, guest_id=body.guest_id,
    )
    return {"token": create_token(user.id, user.email or "")}


@router.get("/google")
def google_login(ref: Optional[str] = None, guest_id: Optional[str] = None):
    if not settings.google_oauth_client_id:
        raise HTTPException(503, "Google OAuth not configured")
    redirect_uri = f"{settings.api_base_url}/api/auth/google/callback"
    state = _encode_state(ref, guest_id)
    params = (
        f"?response_type=code"
        f"&client_id={settings.google_oauth_client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
        + (f"&state={state}" if state else "")
    )
    return RedirectResponse(GOOGLE_AUTH_URL + params)


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: Optional[str] = None,
    db: Session = Depends(get_session),
):
    if not settings.google_oauth_client_id or not settings.google_oauth_client_secret:
        raise HTTPException(503, "Google OAuth not configured")

    redirect_uri = f"{settings.api_base_url}/api/auth/google/callback"
    frontend_url = settings.frontend_url

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": settings.google_oauth_client_id,
                "client_secret": settings.google_oauth_client_secret,
                "redirect_uri": redirect_uri,
            },
        )
        if token_resp.status_code != 200:
            return RedirectResponse(f"{frontend_url}/auth?error=google_token_failed")
        access_token = token_resp.json().get("access_token")

        user_resp = await client.get(
            GOOGLE_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_resp.status_code != 200:
            return RedirectResponse(f"{frontend_url}/auth?error=google_user_failed")
        google_data = user_resp.json()

    google_id = google_data.get("sub")
    email = google_data.get("email")
    name = google_data.get("name") or google_data.get("given_name") or "Пользователь"

    if not google_id:
        return RedirectResponse(f"{frontend_url}/auth?error=google_no_id")

    ref_code, guest_id = _decode_state(state)
    user = _convert_or_create_oauth_user(
        db, email=email, name=name, password_hash="google_oauth",
        google_id=google_id, ref_code=ref_code, guest_id=guest_id,
    )

    token = create_token(user.id, user.email or "")
    return RedirectResponse(f"{frontend_url}/auth/callback?token={token}")


@router.get("/tg-init")
def tg_init(ref: Optional[str] = None, guest_id: Optional[str] = None):
    if not settings.telegram_bot_token:
        raise HTTPException(503, "Telegram bot not configured")
    token = _secrets.token_urlsafe(24)
    state = _encode_state(ref, guest_id)
    _tg_pending[token] = {"created_at": time.time(), "state": state, "jwt": None}
    bot_url = f"https://t.me/{settings.telegram_bot_username}?start={token}"
    return {"token": token, "bot_url": bot_url}


@router.post("/tg-webhook")
async def tg_webhook(request: Request, db: Session = Depends(get_session)):
    if settings.telegram_webhook_secret:
        header = request.headers.get("x-telegram-bot-api-secret-token", "")
        if header != settings.telegram_webhook_secret:
            raise HTTPException(403, "Invalid webhook secret")

    data = await request.json()
    message = data.get("message")
    if not message:
        return {"ok": True}

    text = message.get("text", "")
    if not text.startswith("/start"):
        return {"ok": True}

    parts = text.split(maxsplit=1)
    auth_token = parts[1].strip() if len(parts) > 1 else ""
    chat_id = message["chat"]["id"]
    bot_token = settings.telegram_bot_token

    if not auth_token or auth_token not in _tg_pending:
        _send_tg_message(bot_token, chat_id, "Ссылка недействительна или устарела. Попробуйте снова на сайте.")
        return {"ok": True}

    pending = _tg_pending[auth_token]
    if time.time() - pending["created_at"] > _TG_TOKEN_TTL:
        _tg_pending.pop(auth_token, None)
        _send_tg_message(bot_token, chat_id, "Ссылка устарела. Попробуйте снова на сайте.")
        return {"ok": True}

    from_user = message.get("from", {})
    tg_id = str(from_user.get("id", ""))
    first_name = from_user.get("first_name", "Пользователь")
    last_name = from_user.get("last_name")
    name = f"{first_name} {last_name or ''}".strip()

    ref_code, guest_id = _decode_state(pending.get("state"))
    user = _convert_or_create_oauth_user(
        db, email=None, name=name, password_hash="tg_oauth",
        tg_id=tg_id, ref_code=ref_code, guest_id=guest_id,
    )

    jwt = create_token(user.id, user.email or "")
    _tg_pending[auth_token]["jwt"] = jwt

    return_url = f"{settings.frontend_url}/auth/callback?token={jwt}"
    _send_tg_message(
        bot_token,
        chat_id,
        f"✅ Вы авторизованы в ERA2 Card!\n\nВернитесь в браузер — он обновится автоматически.\n\nИли перейдите по ссылке:\n{return_url}",
    )
    return {"ok": True}


@router.get("/tg-status")
def tg_status(token: str):
    pending = _tg_pending.get(token)
    if not pending:
        return {"status": "expired"}
    if time.time() - pending["created_at"] > _TG_TOKEN_TTL:
        _tg_pending.pop(token, None)
        return {"status": "expired"}
    if pending.get("jwt"):
        jwt = pending.pop("jwt")
        _tg_pending.pop(token, None)
        return {"status": "ok", "token": jwt}
    return {"status": "pending"}


def _send_tg_message(bot_token: str, chat_id: int, text: str) -> None:
    try:
        httpx.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": chat_id, "text": text},
            timeout=5,
        )
    except Exception as e:
        logger.warning("Failed to send TG message: %s", e)
