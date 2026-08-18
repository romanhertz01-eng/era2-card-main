import asyncio
import json
import logging

import httpx

logger = logging.getLogger(__name__)

KIE_BASE = "https://api.kie.ai/api/v1"
POLL_INTERVAL = 15  # seconds
MAX_POLLS = 50      # ~12 min max


def _safe_resolution(aspect_ratio: str) -> str:
    """Return max allowed resolution for the given aspect ratio."""
    if aspect_ratio in ("auto", "1:1"):
        return "1K"
    return "2K"


async def create_task(
    api_key: str,
    prompt: str,
    image_urls: list[str] | None = None,
    aspect_ratio: str = "auto",
) -> str:
    """Submit GPT Image 2 task to kie.ai. Returns taskId."""
    model = "gpt-image-2-image-to-image" if image_urls else "gpt-image-2-text-to-image"
    resolution = _safe_resolution(aspect_ratio)
    inp: dict = {
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "resolution": resolution,
    }
    if image_urls:
        inp["input_urls"] = image_urls

    payload = {"model": model, "input": inp}
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{KIE_BASE}/jobs/createTask",
                    json=payload,
                    headers={"Authorization": f"Bearer {api_key}"},
                )
                resp.raise_for_status()
                data = resp.json()
                logger.info("GPT Image createTask response: %s", data)
                code = data.get("code")
                if code is not None and code != 200:
                    raise ValueError(f"kie.ai error code={code}: {data.get('msg')}")
                task_id = (data.get("data") or {}).get("taskId")
                if not task_id:
                    raise ValueError(f"No taskId in response: {data}")
                return task_id
        except Exception as e:
            last_exc = e
            if attempt == 0:
                logger.warning("GPT Image createTask attempt 1 failed (%s), retrying in 5s…", e)
                await asyncio.sleep(5)
    raise RuntimeError(f"GPT Image createTask failed after 2 attempts: {last_exc}") from last_exc


async def poll_task(api_key: str, task_id: str) -> str:
    """Poll until image is ready. Returns image URL."""
    for _ in range(MAX_POLLS):
        await asyncio.sleep(POLL_INTERVAL)
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(
                    f"{KIE_BASE}/jobs/recordInfo",
                    params={"taskId": task_id},
                    headers={"Authorization": f"Bearer {api_key}"},
                )
                resp.raise_for_status()
                body = resp.json()
        except Exception as e:
            logger.warning("GPT Image poll transient error for %s (%s), continuing…", task_id, e)
            continue

        logger.info("GPT Image poll %s: %s", task_id, body)
        code = body.get("code")
        if code is not None and code != 200:
            raise ValueError(f"GPT Image poll error code={code}: {body.get('msg')}")

        info = body.get("data") or {}
        state = info.get("state", "") if isinstance(info, dict) else ""
        logger.info("GPT Image task %s state=%s", task_id, state)

        if state == "success":
            result_json = info.get("resultJson", "{}")
            urls = json.loads(result_json).get("resultUrls", [])
            if not urls:
                raise ValueError("GPT Image success but no resultUrls")
            return urls[0]

        if state == "fail":
            raise ValueError(f"GPT Image task {task_id} failed")

    raise TimeoutError(f"GPT Image task {task_id} did not finish in time")
