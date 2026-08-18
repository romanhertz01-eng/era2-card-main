import asyncio
import logging
from datetime import datetime

import httpx
from sqlalchemy import update as sa_update
from sqlmodel import Session, select

from app.database import engine
from app.models import Generation, User

logger = logging.getLogger(__name__)

KLING_BASE = "https://api.kie.ai/api/v1"
KIE_CDN_BASE = "https://kieai.redpandaai.co"
MODEL = "kling-3.0/video"

# Poll interval and max wait time (Kling can take several minutes)
POLL_INTERVAL = 10  # seconds
MAX_POLLS = 60      # 10 min


async def upload_file(api_key: str, image_bytes: bytes, filename: str = "product.jpg") -> str:
    """Upload image to kie.ai CDN. Returns public fileUrl."""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{KIE_CDN_BASE}/api/file-stream-upload",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": (filename, image_bytes, "image/jpeg")},
            data={"uploadPath": "era2-card"},
        )
        resp.raise_for_status()
        body = resp.json()
        logger.info("kie.ai upload response: %s", body)
        if not body.get("success"):
            raise ValueError(f"kie.ai upload failed: {body.get('msg')}")
        data = body.get("data") or {}
        url = data.get("downloadUrl") or data.get("fileUrl")
        if not url:
            raise ValueError(f"No downloadUrl in upload response: {body}")
        return url


QUALITY_TO_MODE = {"720p": "std", "1080p": "pro"}


async def create_task(
    api_key: str,
    prompt: str,
    image_url: str | None = None,
    duration: int = 5,
    quality: str = "1080p",
    audio_enabled: bool = False,
) -> str:
    """Submit text-to-video task to Kling 3.0. Returns taskId."""
    inp: dict = {
        "prompt": prompt,
        "duration": str(duration),
        "aspect_ratio": "9:16",
        "mode": QUALITY_TO_MODE.get(quality, "std"),
        "sound": audio_enabled,
        "multi_shots": False,
    }
    if image_url:
        inp["image_urls"] = [image_url]

    payload = {"model": MODEL, "input": inp}
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{KLING_BASE}/jobs/createTask",
                    json=payload,
                    headers={"Authorization": f"Bearer {api_key}"},
                )
                resp.raise_for_status()
                data = resp.json()
                logger.info("Kling createTask response: %s", data)

                if not isinstance(data, dict):
                    raise ValueError(f"Unexpected Kling response type: {data!r}")

                code = data.get("code")
                if code is not None and code != 200:
                    raise ValueError(f"Kling API error code={code}: {data.get('msg')}")

                inner = data.get("data") or {}
                task_id = inner.get("taskId") if isinstance(inner, dict) else None
                if not task_id:
                    raise ValueError(f"No taskId in Kling response: {data}")
                return task_id
        except Exception as e:
            last_exc = e
            if attempt == 0:
                logger.warning("Kling createTask attempt 1 failed (%s), retrying in 5s…", e)
                await asyncio.sleep(5)
    raise RuntimeError(f"Kling createTask failed after 2 attempts: {last_exc}") from last_exc


async def poll_task(api_key: str, task_id: str) -> str:
    """Poll until video is ready. Returns video URL."""
    for _ in range(MAX_POLLS):
        await asyncio.sleep(POLL_INTERVAL)
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(
                    f"{KLING_BASE}/jobs/recordInfo",
                    params={"taskId": task_id},
                    headers={"Authorization": f"Bearer {api_key}"},
                )
                resp.raise_for_status()
                body = resp.json()
        except Exception as e:
            logger.warning("Kling poll transient error for %s (%s), continuing…", task_id, e)
            continue

        logger.info("Kling poll response for %s: %s", task_id, body)
        if not isinstance(body, dict):
            logger.warning("Kling poll unexpected response type for %s, continuing…", task_id)
            continue

        code = body.get("code")
        if code is not None and code != 200:
            raise ValueError(f"Kling poll error code={code}: {body.get('msg')}")

        info = body.get("data") or {}
        state = info.get("state", "") if isinstance(info, dict) else ""
        logger.info("Kling task %s state=%s progress=%s", task_id, state, info.get("progress"))

        if state == "success":
            import json as _json
            result_json = info.get("resultJson", "{}")
            urls = _json.loads(result_json).get("resultUrls", [])
            if not urls:
                raise ValueError("Kling success but no resultUrls")
            return urls[0]

        if state == "fail":
            raise ValueError(f"Kling task {task_id} failed")

    raise TimeoutError(f"Kling task {task_id} did not finish in time")


async def generate_and_update(
    generation_id: str,
    api_key: str,
    prompt: str,
    image_url: str | None = None,
    duration: int = 5,
    quality: str = "1080p",
    audio_enabled: bool = False,
) -> None:
    """Background task: submit to Kling (with optional image reference), poll, update Generation row."""
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            task_id = await create_task(api_key, prompt, image_url, duration, quality, audio_enabled)
            logger.info("Kling task created: %s for generation %s (attempt %d)", task_id, generation_id, attempt + 1)
            kling_url = await poll_task(api_key, task_id)

            # Download from Kling CDN and re-upload to MinIO
            from app.services.storage import upload_file
            try:
                async with httpx.AsyncClient(timeout=120) as client:
                    resp = await client.get(kling_url)
                    resp.raise_for_status()
                    video_url = await asyncio.to_thread(upload_file, resp.content, "mp4")
                    logger.info("Video re-uploaded to S3: %s", video_url)
            except Exception as e:
                logger.warning("Failed to re-upload video to S3, using Kling URL: %s", e)
                video_url = kling_url

            with Session(engine) as db:
                gen = db.get(Generation, generation_id)
                if gen:
                    gen.status = "completed"
                    gen.output_url = video_url
                    gen.completed_at = datetime.utcnow()
                    db.add(gen)
                    db.commit()
                    logger.info("Generation %s completed: %s", generation_id, video_url)
            return

        except Exception as e:
            last_exc = e
            if attempt == 0:
                logger.warning("Kling attempt 1 failed for %s (%s), retrying…", generation_id, e)
                await asyncio.sleep(5)

    logger.exception("Kling generation failed for %s after 2 attempts: %s", generation_id, last_exc)
    with Session(engine) as db:
        gen = db.get(Generation, generation_id)
        if gen:
            gen.status = "failed"
            db.exec(sa_update(User).where(User.id == gen.user_id).values(balance=User.balance + gen.charges_spent))
            db.add(gen)
            db.commit()
