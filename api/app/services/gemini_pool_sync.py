import asyncio
import json
import logging
from pathlib import Path

import httpx

from app.config import settings
from app.services.gemini import reset_key_cycle

logger = logging.getLogger(__name__)

SA_KEYS_DIR = Path("data/sa_keys")


def _is_valid_sa(data: bytes) -> bool:
    try:
        obj = json.loads(data)
        return isinstance(obj, dict) and obj.get("type") == "service_account"
    except Exception:
        return False


async def _sync_once() -> None:
    list_url = settings.gemini_pool_list_url
    download_url = settings.gemini_pool_download_url
    token = settings.gemini_pool_token

    if not list_url or not download_url:
        return

    headers = {"Authorization": f"Bearer {token}"} if token else {}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(list_url, headers=headers)
            resp.raise_for_status()
            body = resp.json()
    except Exception as e:
        logger.warning("SA pool sync: list fetch failed: %s", e)
        return

    keys = body.get("keys", [])
    if not isinstance(keys, list) or not keys:
        logger.warning("SA pool sync: empty or invalid keys list, skipping")
        return

    filenames = [k["file"] for k in keys if isinstance(k, dict) and k.get("file")]
    if not filenames:
        return

    # Download all files into memory first (all-or-nothing)
    staged: dict[str, bytes] = {}
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            for filename in filenames:
                url = download_url.replace("{file}", filename)
                resp = await client.get(url, headers=headers)
                resp.raise_for_status()
                content = resp.content
                if not _is_valid_sa(content):
                    logger.warning("SA pool sync: %s is not a valid SA JSON, aborting sync", filename)
                    return
                staged[filename] = content
    except Exception as e:
        logger.warning("SA pool sync: download failed: %s", e)
        return

    # Write to disk then reset in-memory cycle
    SA_KEYS_DIR.mkdir(parents=True, exist_ok=True)
    paths: list[str] = []
    for filename, content in staged.items():
        path = SA_KEYS_DIR / filename
        path.write_bytes(content)
        paths.append(str(path))

    reset_key_cycle(paths)
    logger.info("SA pool sync: loaded %d keys", len(paths))


def _load_cached() -> None:
    if not SA_KEYS_DIR.exists():
        return
    paths = [
        str(p) for p in sorted(SA_KEYS_DIR.glob("*.json"))
        if _is_valid_sa(p.read_bytes())
    ]
    if paths:
        reset_key_cycle(paths)
        logger.info("SA pool sync: loaded %d cached keys from disk", len(paths))


async def run() -> None:
    poll_seconds = max(30, settings.gemini_pool_poll_seconds)
    logger.info("SA pool sync: started (interval=%ds)", poll_seconds)
    _load_cached()
    await _sync_once()
    while True:
        await asyncio.sleep(poll_seconds)
        try:
            await _sync_once()
        except Exception as e:
            logger.exception("SA pool sync: unexpected error: %s", e)
