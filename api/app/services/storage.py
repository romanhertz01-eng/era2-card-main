import logging
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

STATIC_DIR = Path("static/generations")


def _s3_enabled() -> bool:
    from app.config import settings
    return bool(settings.s3_endpoint and settings.s3_bucket and settings.s3_access_key)


def _get_client():
    import boto3
    from botocore.config import Config
    from app.config import settings
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=Config(connect_timeout=10, read_timeout=20),
    )


def upload_file(data: bytes, ext: str = "jpg") -> str:
    """Upload bytes to S3/MinIO or local static dir. Returns public URL."""
    mime = "video/mp4" if ext == "mp4" else f"image/{ext}"
    filename = f"{uuid.uuid4()}.{ext}"

    if _s3_enabled():
        from app.config import settings
        client = _get_client()
        key = f"generations/{filename}"
        client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=data,
            ContentType=mime,
            ACL='public-read',
        )
        public_base = (settings.s3_public_url or settings.s3_endpoint).rstrip("/")
        url = f"{public_base}/{settings.s3_bucket}/{key}"
        logger.info("Uploaded to S3: %s", url)
        return url

    # Fallback: local static directory
    STATIC_DIR.mkdir(parents=True, exist_ok=True)
    (STATIC_DIR / filename).write_bytes(data)
    from app.config import settings
    url = f"{settings.api_base_url}/static/generations/{filename}"
    logger.info("Saved locally: %s", url)
    return url


def upload_image(image_bytes: bytes, ext: str = "jpg") -> str:
    """Compatibility wrapper — delegates to upload_file."""
    return upload_file(image_bytes, ext)
