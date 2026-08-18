import asyncio
import hashlib
import io
import json
import logging
import time
from pathlib import Path
from typing import Any

import httpx
from PIL import Image

from app.services import kling as kling_service

logger = logging.getLogger(__name__)

KIE_CHAT_URL = "https://api.kie.ai/gemini-2.5-flash/v1/chat/completions"

# Кэш результатов распознавания по sha256 уменьшенного фото — люди часто
# перезагружают одно и то же изображение (передумал/удалил/вернул), без
# кэша это платный вызов к kie.ai на каждый такой цикл. Файл, не БД: это
# вспомогательные, легко пересчитываемые данные, отдельная таблица избыточна.
CACHE_PATH = Path("data/recognition_cache.json")
CACHE_TTL_SECONDS = 30 * 24 * 3600  # 30 дней
_cache_lock = asyncio.Lock()

# Тот же справочник категорий, что в lib/mockData.ts productCategories —
# чтобы распознанная категория всегда была валидным пунктом <select>.
CATEGORIES = [
    "Косметика", "Одежда", "Обувь", "Электроника", "Товары для дома",
    "Детские товары", "Еда и напитки", "Ювелирные украшения", "Спорт",
    "Авто", "Зоотовары", "Другое",
]

RECOGNIZE_SCHEMA = {
    "type": "object",
    "title": "Product recognition",
    "description": "Recognized product name and category from a marketplace product photo",
    "properties": {
        "name": {
            "type": "string",
            "maxLength": 40,
            "description": "Generic product name in Russian, 2-4 words, nominative case",
        },
        "category": {"type": "string", "enum": CATEGORIES},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
    },
    "required": ["name", "category", "confidence"],
}

RECOGNIZE_SYSTEM_PROMPT = (
    "You determine a product from its photo for a marketplace listing card.\n\n"
    "NAME\nGeneric product name in Russian, 2-4 words, nominative case. "
    "Examples: «Беспроводные наушники», «Сыворотка для лица», «Керамическая кружка». "
    "Do not include brand or model names, even if visible "
    "on the photo. Do not add evaluative adjectives (premium, stylish, high quality).\n\n"
    "CATEGORY\nExactly one value from the provided enum list. If the product does not "
    "clearly fit any specific category, use «Другое» (\"Other\"). "
    "Do not guess the closest one if unsure — use «Другое» instead.\n\n"
    "CONFIDENCE\n0.9-1.0 the product is obvious and unambiguous; 0.5-0.9 understandable "
    "but with some ambiguity; below 0.5 a poor photo, several different products in "
    "frame, or an unclear subject."
)


def resize_for_recognition(data: bytes) -> bytes:
    """Downscale to a small JPEG before sending — recognition doesn't need a full-size photo."""
    img = Image.open(io.BytesIO(data)).convert("RGB")
    img.thumbnail((768, 768))
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=80)
    return out.getvalue()


def _load_cache() -> dict[str, Any]:
    try:
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_cache(cache: dict[str, Any]) -> None:
    try:
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        logger.warning("Recognition cache write failed: %s", e)


async def _get_cached(key: str) -> dict[str, Any] | None:
    async with _cache_lock:
        cache = _load_cache()
    entry = cache.get(key)
    if not entry:
        return None
    if time.time() - entry.get("cachedAt", 0) > CACHE_TTL_SECONDS:
        return None
    return entry.get("result")


async def _set_cached(key: str, result: dict[str, Any]) -> None:
    async with _cache_lock:
        cache = _load_cache()
        cache[key] = {"result": result, "cachedAt": time.time()}
        _save_cache(cache)


async def recognize_product(api_key: str, image_url: str, timeout_seconds: float = 6.0) -> dict[str, Any] | None:
    """Calls Gemini 2.5 Flash (via kie.ai) for structured product recognition.

    Returns None on any failure (timeout, transport error, malformed response) —
    the caller falls back to empty, user-editable fields, never blocks generation.
    """
    payload = {
        "messages": [
            {"role": "system", "content": [{"type": "text", "text": RECOGNIZE_SYSTEM_PROMPT}]},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Определи товар на фото."},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            },
        ],
        "stream": False,
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "structured_output", "strict": True, "schema": RECOGNIZE_SCHEMA},
        },
    }
    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            resp = await client.post(
                KIE_CHAT_URL,
                json=payload,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        if not isinstance(parsed, dict) or "name" not in parsed:
            raise ValueError(f"Unexpected recognition payload: {parsed!r}")
        return parsed
    except Exception as e:
        logger.warning("Product recognition failed: %s", e)
        return None


async def recognize_product_from_bytes(api_key: str, raw_bytes: bytes) -> dict[str, Any] | None:
    """Resize → cache lookup → (upload + recognize on miss) → cache store.

    This is the single entry point routes should call. Returns None only on
    genuine failure (bad image, upload/API error) — the caller falls back to
    empty, user-editable fields.
    """
    try:
        small = await asyncio.to_thread(resize_for_recognition, raw_bytes)
    except Exception as e:
        logger.warning("Recognition resize failed: %s", e)
        return None

    cache_key = hashlib.sha256(small).hexdigest()
    cached = await _get_cached(cache_key)
    if cached is not None:
        logger.info("Recognition cache hit: %s", cache_key[:12])
        return cached

    try:
        cdn_url = await kling_service.upload_file(api_key, small, "recognize.jpg")
    except Exception as e:
        logger.warning("Recognition image upload failed: %s", e)
        return None

    result = await recognize_product(api_key, cdn_url)
    if result is not None:
        await _set_cached(cache_key, result)
    return result
