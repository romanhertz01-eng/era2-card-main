import asyncio
import logging
import os
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel
from sqlalchemy import update
from sqlmodel import Session, select

from app.config import settings
from app.database import get_session
from app.deps import get_current_user
from app.limiter import limiter, get_user_id
from app.models import Generation, User
from app.services import gemini
from app.services import gpt_image as gpt_image_service
from app.services import kling as kling_service
from app.services import vision

logger = logging.getLogger(__name__)

router = APIRouter()


def _local_path_for_url(url: str):
    """Return local Path if url points to our static dir, else None (use HTTP)."""
    from pathlib import Path
    base = settings.api_base_url.rstrip("/")
    prefix = base + "/static/"
    if url.startswith(prefix):
        return Path("static") / url[len(prefix):]
    return None

COSTS = {"photo": 5, "card": 5, "video": 20}
REFERENCE_COST = 5

MOCK_URLS = {
    "photo": "https://picsum.photos/seed/era2ph/800/1000",
    "card": "https://picsum.photos/seed/era2card/900/1200",
    "video": "https://picsum.photos/seed/era2vid/1080/1080",
}


def _gemini_enabled() -> bool:
    return bool(settings.google_cloud_project)


def _deduct_balance(db: Session, user_id: str, amount: int) -> bool:
    """Atomically deduct `amount` from user balance. Returns False if insufficient funds."""
    result = db.exec(
        update(User)
        .where(User.id == user_id, User.balance >= amount)
        .values(balance=User.balance - amount)
    )
    db.flush()
    return result.rowcount == 1


_IMAGE_MAGIC = [
    b"\xff\xd8\xff",        # JPEG
    b"\x89PNG",             # PNG
    b"RIFF",                # WebP (RIFF....WEBP)
]
_MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB


def _validate_image(data: bytes, filename: str) -> None:
    """Raises HTTPException(400) if data is not a recognised image or too large."""
    if len(data) > _MAX_IMAGE_BYTES:
        raise HTTPException(400, detail={"error": "Image too large", "max_mb": 10})
    if not any(data.startswith(magic) for magic in _IMAGE_MAGIC):
        raise HTTPException(400, detail={"error": "Invalid image format", "filename": filename,
                                         "accepted": ["jpeg", "png", "webp"]})


def _maybe_convert_heic(data: bytes, content_type: str | None) -> tuple[bytes, str]:
    """Convert HEIC/HEIF bytes to JPEG. Returns (bytes, mime_type)."""
    if content_type not in ("image/heic", "image/heif"):
        return data, content_type or "image/jpeg"
    try:
        import io
        import pillow_heif
        from PIL import Image
        pillow_heif.register_heif_opener()
        img = Image.open(io.BytesIO(data))
        out = io.BytesIO()
        img.convert("RGB").save(out, format="JPEG", quality=90)
        logger.info("HEIC converted to JPEG (%d → %d bytes)", len(data), out.tell())
        return out.getvalue(), "image/jpeg"
    except Exception as e:
        logger.warning("HEIC conversion failed: %s", e)
        raise HTTPException(400, detail={"error": "HEIC conversion failed", "detail": str(e)})


@router.post("/generations/recognize-product")
@limiter.limit("20/hour", key_func=get_user_id)
async def recognize_product(
    request: Request,
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Best-effort product recognition. Never blocks the studio flow — any
    failure (no kie key, bad image, timeout, malformed model response) just
    returns an empty/low-confidence result for the frontend to fall back on.
    """
    empty = {"name": "", "category": None, "confidence": 0.0}
    if not settings.kling_api_key:
        return empty

    b = await image.read()
    try:
        b, _mime = _maybe_convert_heic(b, image.content_type)
        _validate_image(b, image.filename or "image.jpg")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Recognition preprocessing failed: %s", e)
        return empty

    result = await vision.recognize_product_from_bytes(settings.kling_api_key, b)
    return result or empty


@router.post("/generations/image", status_code=201)
@limiter.limit("20/minute", key_func=get_user_id)
async def create_generation(
    request: Request,
    task: str = Form(...),
    marketplace: str = Form(...),
    project_id: Optional[str] = Form(None),
    wish: Optional[str] = Form(None),
    photos: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    cost = COSTS.get(task, 3)

    image_bytes_list: list[bytes] = []
    image_mime_types: list[str] = []
    for upload in photos[:2]:
        if upload and upload.filename:
            b = await upload.read()
            b, mime = _maybe_convert_heic(b, upload.content_type)
            _validate_image(b, upload.filename)
            image_bytes_list.append(b)
            image_mime_types.append(mime)
            logger.info("Photo received: %s, size=%d bytes", upload.filename, len(b))

    if not image_bytes_list:
        logger.info("No photos provided, text-only generation")

    logger.info("Generation request: task=%s marketplace=%s wish=%r photos=%d", task, marketplace, wish, len(image_bytes_list))

    ai_model: str | None = None
    if settings.kling_api_key:
        try:
            image_urls: list[str] = []
            for i, b in enumerate(image_bytes_list):
                url = await kling_service.upload_file(settings.kling_api_key, b, f"product_{i+1}.jpg")
                image_urls.append(url)
            prompt = gemini._build_prompt(task, marketplace, wish or "")
            task_id = await gpt_image_service.create_task(
                settings.kling_api_key, prompt, image_urls or None,
            )
            kie_url = await gpt_image_service.poll_task(settings.kling_api_key, task_id)
            import httpx as _httpx
            from app.services.storage import upload_image as _upload_image
            try:
                async with _httpx.AsyncClient(timeout=60) as client:
                    r = await client.get(kie_url)
                    r.raise_for_status()
                    output_url = await asyncio.to_thread(_upload_image, r.content, "jpg")
            except Exception:
                output_url = kie_url
            ai_model = "gpt-image-2"
        except Exception as e:
            logger.exception("GPT Image generation failed")
            raise HTTPException(500, detail={"error": "Generation failed", "detail": str(e)})
    else:
        output_url = MOCK_URLS.get(task, MOCK_URLS["photo"])

    if not _deduct_balance(db, current_user.id, cost):
        raise HTTPException(
            402,
            detail={"error": "Insufficient balance", "required": cost, "current": current_user.balance},
        )
    db.exec(update(User).where(User.id == current_user.id).values(generated_count=User.generated_count + 1))
    db.flush()

    generation = Generation(
        user_id=current_user.id,
        project_id=project_id,
        task=task,
        marketplace=marketplace,
        status="completed",
        output_url=output_url,
        charges_spent=cost,
        ai_model=ai_model,
        completed_at=datetime.utcnow(),
    )
    db.add(generation)
    db.commit()
    db.refresh(generation)
    return generation


MOCK_BATCH_SEEDS = {
    "photo": ["era2ph1", "era2ph2", "era2ph3", "era2ph4"],
    "card":  ["era2cd1", "era2cd2", "era2cd3", "era2cd4"],
}


async def _run_batch(
    gen_ids: list[str],
    task: str,
    marketplace: str,
    wish: str,
    image_bytes_list: list[bytes],
    concept_id: str = "",
    product_name: str = "",
    card_about: str = "",
    card_benefits: str = "",
    card_text: str = "",
    image_mime_types: list[str] | None = None,
    aspect_ratio: str | None = None,
    reference_bytes_list: list[bytes] | None = None,
) -> None:
    """Background task: run N GPT Image 2 generations in parallel via kie.ai, update DB.

    If `reference_bytes_list` is given, each gen_id gets its own independent call:
    product photo + its own reference image + the reference-card prompt. Otherwise
    all gen_ids share the same prompt and inputs (regular variant batch).
    """
    import httpx as _httpx
    from app.database import engine
    from app.services.storage import upload_image as _upload_image
    from sqlmodel import Session as SyncSession

    kie_ratio = aspect_ratio or "auto"

    # Upload product photo(s) once, get CDN URLs for kie.ai
    image_urls: list[str] = []
    if image_bytes_list and settings.kling_api_key:
        for i, b in enumerate(image_bytes_list):
            try:
                cdn_url = await kling_service.upload_file(settings.kling_api_key, b, f"product_{i+1}.jpg")
                image_urls.append(cdn_url)
            except Exception as e:
                logger.warning("Photo upload failed for batch (index %d): %s", i, e)

    if reference_bytes_list:
        prompt = gemini._build_reference_prompt(product_name, wish, aspect_ratio)

        async def _upload_reference(b: bytes, idx: int) -> str | None:
            try:
                return await kling_service.upload_file(settings.kling_api_key, b, f"reference_{idx+1}.jpg")
            except Exception as e:
                logger.warning("Reference upload failed (index %d): %s", idx, e)
                return None

        reference_urls = await asyncio.gather(
            *[_upload_reference(b, i) for i, b in enumerate(reference_bytes_list)]
        )

        async def _create_ref(idx: int) -> str | None:
            ref_url = reference_urls[idx]
            if ref_url is None:
                return None
            try:
                return await gpt_image_service.create_task(
                    settings.kling_api_key, prompt, [*image_urls, ref_url], kie_ratio,
                )
            except Exception:
                logger.exception("GPT Image createTask failed for reference index %d", idx)
                return None

        task_ids = await asyncio.gather(*[_create_ref(i) for i in range(len(gen_ids))])
    else:
        # Build prompt once (aspect_ratio goes as API param, not in text)
        prompt = gemini._build_prompt(
            task, marketplace, wish, concept_id, product_name,
            card_about, card_benefits, card_text,
        )
        reference_urls = [None] * len(gen_ids)

        async def _create(gen_id: str) -> str | None:
            try:
                return await gpt_image_service.create_task(
                    settings.kling_api_key, prompt, image_urls or None, kie_ratio,
                )
            except Exception:
                logger.exception("GPT Image createTask failed for %s", gen_id)
                return None

        task_ids = await asyncio.gather(*[_create(gid) for gid in gen_ids])

    # Poll all sequentially and update DB
    async def _poll_and_update(gen_id: str, task_id: str | None, reference_url: str | None) -> None:
        if task_id is None:
            with SyncSession(engine) as db:
                gen = db.get(Generation, gen_id)
                if gen:
                    gen.status = "failed"
                    db.exec(update(User).where(User.id == gen.user_id).values(balance=User.balance + gen.charges_spent))
                    db.add(gen)
                    db.commit()
            return
        try:
            kie_url = await gpt_image_service.poll_task(settings.kling_api_key, task_id)
            try:
                async with _httpx.AsyncClient(timeout=60) as client:
                    r = await client.get(kie_url)
                    r.raise_for_status()
                    output_url = await asyncio.to_thread(_upload_image, r.content, "jpg")
            except Exception as e:
                logger.warning("Re-upload to storage failed, using kie.ai URL: %s", e)
                output_url = kie_url
            with SyncSession(engine) as db:
                gen = db.get(Generation, gen_id)
                if gen:
                    gen.status = "completed"
                    gen.output_url = output_url
                    gen.ai_model = "gpt-image-2"
                    if reference_url:
                        gen.reference_url = reference_url
                    gen.completed_at = datetime.utcnow()
                    db.add(gen)
                    db.commit()
        except Exception:
            logger.exception("GPT Image poll/update failed for %s", gen_id)
            with SyncSession(engine) as db:
                gen = db.get(Generation, gen_id)
                if gen:
                    gen.status = "failed"
                    db.exec(update(User).where(User.id == gen.user_id).values(balance=User.balance + gen.charges_spent))
                    db.add(gen)
                    db.commit()

    for gid, tid, ref_url in zip(gen_ids, task_ids, reference_urls):
        await _poll_and_update(gid, tid, ref_url)


async def _run_improve(
    gen_id: str,
    source_url: str,
    improve_prompt_raw: str,
    marketplace: str,
    product_name: str,
) -> None:
    """Background task: run KIE improve, update DB on finish, refund on failure."""
    import httpx as _httpx
    from app.database import engine
    from app.services.storage import upload_image as _upload_image
    from sqlmodel import Session as SyncSession

    try:
        improve_prompt = gemini._build_prompt(
            "improve", marketplace, improve_prompt_raw, product_name=product_name,
        )
        local_path = _local_path_for_url(source_url)
        if local_path is not None:
            try:
                image_bytes = local_path.read_bytes()
            except Exception as e:
                logger.warning("Could not read local image for improve: %s", e)
                raise
            cdn_url = await kling_service.upload_file(settings.kling_api_key, image_bytes, "source.jpg")
        else:
            cdn_url = source_url

        task_id = await gpt_image_service.create_task(settings.kling_api_key, improve_prompt, [cdn_url])
        kie_url = await gpt_image_service.poll_task(settings.kling_api_key, task_id)

        try:
            async with _httpx.AsyncClient(timeout=60) as client:
                r = await client.get(kie_url)
                r.raise_for_status()
                output_url = await asyncio.to_thread(_upload_image, r.content, "jpg")
        except Exception:
            output_url = kie_url

        with SyncSession(engine) as db:
            gen = db.get(Generation, gen_id)
            if gen:
                gen.status = "completed"
                gen.output_url = output_url
                gen.completed_at = datetime.utcnow()
                db.add(gen)
                db.commit()

    except Exception:
        logger.exception("GPT Image improve background task failed for %s", gen_id)
        with SyncSession(engine) as db:
            gen = db.get(Generation, gen_id)
            if gen:
                gen.status = "failed"
                db.exec(
                    update(User)
                    .where(User.id == gen.user_id)
                    .values(balance=User.balance + gen.charges_spent)
                )
                db.add(gen)
                db.commit()


@router.post("/generations/batch", status_code=201)
@limiter.limit("20/minute", key_func=get_user_id)
async def create_batch_generation(
    request: Request,
    task: str = Form(...),
    marketplace: str = Form(...),
    project_id: Optional[str] = Form(None),
    wish: Optional[str] = Form(None),
    product_name: Optional[str] = Form(None),
    concept_id: Optional[str] = Form(None),
    card_about: Optional[str] = Form(None),
    card_benefits: Optional[str] = Form(None),
    card_text: Optional[str] = Form(None),
    aspect_ratio: Optional[str] = Form(None),
    count: int = Form(4),
    photos: List[UploadFile] = File(default=[]),
    references: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    is_reference = task == "reference" and len(references) > 0
    COUNT = max(1, min(len(references), 6)) if is_reference else max(1, min(count, 4))
    cost = REFERENCE_COST if is_reference else COSTS.get(task, 3)
    total_cost = cost * COUNT

    image_bytes_list: list[bytes] = []
    image_mime_types: list[str] = []
    for upload in photos[:2]:
        if upload and upload.filename:
            b = await upload.read()
            b, mime = _maybe_convert_heic(b, upload.content_type)
            _validate_image(b, upload.filename)
            image_bytes_list.append(b)
            image_mime_types.append(mime)

    reference_bytes_list: list[bytes] = []
    if is_reference:
        for upload in references[:6]:
            if upload and upload.filename:
                b = await upload.read()
                b, _mime = _maybe_convert_heic(b, upload.content_type)
                _validate_image(b, upload.filename)
                reference_bytes_list.append(b)
        COUNT = len(reference_bytes_list) or 1

    if not _deduct_balance(db, current_user.id, total_cost):
        raise HTTPException(
            402,
            detail={"error": "Insufficient balance", "required": total_cost, "current": current_user.balance},
        )
    db.exec(update(User).where(User.id == current_user.id).values(generated_count=User.generated_count + COUNT))
    db.flush()

    seeds = MOCK_BATCH_SEEDS.get(task, MOCK_BATCH_SEEDS["photo"])
    gpt_enabled = bool(settings.kling_api_key)
    generations: list[Generation] = []
    for i in range(COUNT):
        if gpt_enabled:
            status, output_url = "pending", None
        else:
            status = "completed"
            output_url = f"https://picsum.photos/seed/{seeds[i]}/800/1000"

        gen = Generation(
            user_id=current_user.id,
            project_id=project_id,
            task=task,
            marketplace=marketplace,
            status=status,
            output_url=output_url,
            charges_spent=cost,
            wish=wish,
            product_name=product_name,
            concept_id=concept_id,
            completed_at=datetime.utcnow() if status == "completed" else None,
        )
        db.add(gen)
        generations.append(gen)

    db.commit()
    for gen in generations:
        db.refresh(gen)

    if gpt_enabled:
        asyncio.create_task(
            _run_batch(
                [g.id for g in generations],
                task, marketplace, wish or "", image_bytes_list,
                concept_id or "",
                product_name=product_name or "",
                card_about=card_about or "",
                card_benefits=card_benefits or "",
                card_text=card_text or "",
                image_mime_types=image_mime_types,
                aspect_ratio=aspect_ratio,
                reference_bytes_list=reference_bytes_list if is_reference else None,
            )
        )

    return {"ids": [g.id for g in generations], "total_cost": total_cost}


@router.get("/generations/{generation_id}")
def get_generation(
    generation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    gen = db.exec(
        select(Generation).where(
            Generation.id == generation_id, Generation.user_id == current_user.id
        )
    ).first()
    if not gen:
        raise HTTPException(404, "Not found")
    return gen


class ImproveRequest(BaseModel):
    generation_id: str
    improve_prompt: str


@router.post("/generations/improve", status_code=201)
async def improve_generation(
    body: ImproveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    IMPROVE_COST = 3

    parent = db.exec(
        select(Generation).where(
            Generation.id == body.generation_id,
            Generation.user_id == current_user.id,
            Generation.status == "completed",
        )
    ).first()
    if not parent:
        raise HTTPException(404, "Generation not found")
    if not parent.output_url:
        raise HTTPException(400, "Generation has no output image")

    if not _deduct_balance(db, current_user.id, IMPROVE_COST):
        raise HTTPException(
            402,
            detail={"error": "Insufficient balance", "required": IMPROVE_COST, "current": current_user.balance},
        )

    gpt_enabled = bool(settings.kling_api_key)
    generation = Generation(
        user_id=current_user.id,
        project_id=parent.project_id,
        parent_id=parent.id,
        improve_prompt=body.improve_prompt,
        task=parent.task,
        marketplace=parent.marketplace,
        status="pending" if gpt_enabled else "completed",
        output_url=None if gpt_enabled else parent.output_url,
        charges_spent=IMPROVE_COST,
        ai_model="gpt-image-2" if gpt_enabled else None,
        completed_at=None if gpt_enabled else datetime.utcnow(),
    )
    db.add(generation)
    db.commit()
    db.refresh(generation)

    if gpt_enabled:
        asyncio.create_task(
            _run_improve(
                generation.id,
                parent.output_url,
                body.improve_prompt,
                parent.marketplace,
                parent.product_name or "",
            )
        )

    return generation


class LikeRequest(BaseModel):
    liked: Optional[bool] = None


@router.patch("/generations/{generation_id}/like", status_code=200)
def like_generation(
    generation_id: str,
    body: LikeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    gen = db.exec(
        select(Generation).where(
            Generation.id == generation_id,
            Generation.user_id == current_user.id,
        )
    ).first()
    if not gen:
        raise HTTPException(404, "Not found")
    gen.liked = body.liked
    db.add(gen)
    db.commit()
    return {"id": gen.id, "liked": gen.liked}


@router.get("/generations/{generation_id}/versions")
def list_generation_versions(
    generation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    parent = db.exec(
        select(Generation).where(
            Generation.id == generation_id,
            Generation.user_id == current_user.id,
        )
    ).first()
    if not parent:
        raise HTTPException(404, "Not found")

    def collect_descendants(parent_id: str) -> list:
        children = db.exec(
            select(Generation)
            .where(Generation.parent_id == parent_id)
            .order_by(Generation.created_at.asc())
        ).all()
        result = []
        for child in children:
            result.append(child)
            result.extend(collect_descendants(child.id))
        return result

    return collect_descendants(generation_id)


@router.get("/generations")
def list_generations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    return db.exec(
        select(Generation)
        .where(Generation.user_id == current_user.id)
        .order_by(Generation.created_at.desc())
        .limit(50)
    ).all()


# ── Video generation (Kling 3.0) ──────────────────────────────────────────────

VIDEO_COST = 12
MOCK_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"


MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload image to kie.ai CDN and return public URL."""
    if not settings.kling_api_key:
        raise HTTPException(503, detail="File upload not configured")
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, detail="Only JPEG, PNG and WebP images are allowed")
    image_bytes = await file.read()
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, detail="File too large (max 10 MB)")
    safe_name = os.path.basename(file.filename or "product.jpg").replace("..", "")
    try:
        url = await kling_service.upload_file(settings.kling_api_key, image_bytes, safe_name)
        return {"url": url}
    except Exception as e:
        logger.exception("File upload failed")
        raise HTTPException(500, detail={"error": "Upload failed", "detail": str(e)})


VIDEO_COST_MATRIX = {
    ("720p",  5,  False): 20,
    ("720p",  5,  True):  25,
    ("720p",  10, False): 40,
    ("720p",  10, True):  50,
    ("1080p", 5,  False): 25,
    ("1080p", 5,  True):  35,
    ("1080p", 10, False): 50,
    ("1080p", 10, True):  70,
}


def _video_cost(quality: str, duration: int, audio: bool) -> int:
    return VIDEO_COST_MATRIX.get((quality, duration, audio), 25)


class VideoRequest(BaseModel):
    prompt: str
    marketplace: str = "wb"
    project_id: Optional[str] = None
    image_url: Optional[str] = None
    duration: int = 5
    quality: str = "1080p"
    audio_enabled: bool = False
    wish: Optional[str] = None
    product_name: Optional[str] = None
    concept_id: Optional[str] = None


@router.post("/generations/video", status_code=201)
@limiter.limit("20/minute", key_func=get_user_id)
async def create_video_generation(
    request: Request,
    body: VideoRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    cost = _video_cost(body.quality, body.duration, body.audio_enabled)

    if not _deduct_balance(db, current_user.id, cost):
        raise HTTPException(
            402,
            detail={"error": "Insufficient balance", "required": cost, "current": current_user.balance},
        )
    db.exec(update(User).where(User.id == current_user.id).values(generated_count=User.generated_count + 1))
    db.flush()

    generation = Generation(
        user_id=current_user.id,
        project_id=body.project_id,
        task="video",
        marketplace=body.marketplace,
        status="pending",
        output_url=None,
        charges_spent=cost,
        wish=body.wish,
        product_name=body.product_name,
        concept_id=body.concept_id,
        ai_model="kling-3.0",
    )
    db.add(generation)
    db.commit()
    db.refresh(generation)

    if settings.kling_api_key:
        asyncio.create_task(
            kling_service.generate_and_update(
                generation.id,
                settings.kling_api_key,
                body.prompt,
                image_url=body.image_url,
                duration=body.duration,
                quality=body.quality,
                audio_enabled=body.audio_enabled,
            )
        )
        logger.info("Kling task started for generation %s", generation.id)
    else:
        generation.status = "completed"
        generation.output_url = MOCK_VIDEO_URL
        generation.completed_at = datetime.utcnow()
        db.add(generation)
        db.commit()
        db.refresh(generation)
        logger.info("Kling not configured, using mock video for generation %s", generation.id)

    return generation
