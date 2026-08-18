import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

logging.getLogger("app").setLevel(logging.INFO)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import init_db
from app.limiter import limiter
from app.routes import admin, auth, generations, me, payments, projects
from app.services import gemini_pool_sync, payment_poller


async def _register_tg_webhook() -> None:
    if not settings.telegram_bot_token or not settings.api_base_url:
        return
    import httpx
    webhook_url = f"{settings.api_base_url}/api/auth/tg-webhook"
    payload: dict = {"url": webhook_url}
    if settings.telegram_webhook_secret:
        payload["secret_token"] = settings.telegram_webhook_secret
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"https://api.telegram.org/bot{settings.telegram_bot_token}/setWebhook",
                json=payload,
                timeout=10,
            )
        logging.getLogger("app").info("TG webhook set: %s", r.json())
    except Exception as e:
        logging.getLogger("app").warning("TG webhook setup failed: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    Path("static/generations").mkdir(parents=True, exist_ok=True)
    await _register_tg_webhook()
    tasks = [asyncio.create_task(payment_poller.run())]
    if settings.gemini_pool_enabled:
        tasks.append(asyncio.create_task(gemini_pool_sync.run()))
    yield
    for task in tasks:
        task.cancel()


app = FastAPI(title="ERA2 Card API", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(me.router, prefix="/api", tags=["me"])
app.include_router(projects.router, prefix="/api", tags=["projects"])
app.include_router(generations.router, prefix="/api", tags=["generations"])
app.include_router(payments.router, prefix="/api", tags=["payments"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/health")
def health():
    return {"status": "ok"}
