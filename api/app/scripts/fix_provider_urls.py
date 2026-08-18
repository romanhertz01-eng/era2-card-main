"""One-off backfill: re-upload generations whose output_url still points at the
kie.ai/Kling CDN (e.g. tempfile.aiquickdraw.com) instead of our own S3, and fix
the stored output_url. Happens when the original re-upload-to-S3 step failed
and the code fell back to the provider URL (see generations.py / kling.py).

Run inside the API container, where DATABASE_URL and S3_* are already set:

    python -m app.scripts.fix_provider_urls --dry-run
    python -m app.scripts.fix_provider_urls --limit 5
    python -m app.scripts.fix_provider_urls
"""
import argparse
import logging

import httpx
from sqlalchemy import and_
from sqlmodel import Session, select

from app.database import engine
from app.models import Generation
from app.services.storage import upload_file

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("fix_provider_urls")

BROKEN_FILTER = and_(
    Generation.output_url.is_not(None),
    Generation.status == "completed",
    Generation.output_url.notlike("https://card.era2.ai/%"),
    Generation.output_url.notlike("https://s3.firstvds.ru/%"),
    Generation.output_url.notlike("%/static/generations/%"),
    Generation.output_url.notlike("https://picsum.photos/%"),
    Generation.output_url.notlike("%BigBuckBunny%"),
)


def find_broken(db: Session) -> list[Generation]:
    stmt = select(Generation).where(BROKEN_FILTER).order_by(Generation.created_at.desc())
    return list(db.exec(stmt))


def fix_one(db: Session, gen: Generation) -> str:
    """Download + re-upload one row. Returns a short status tag for the summary."""
    original_url = gen.output_url
    ext = "mp4" if (gen.ai_model or "").startswith("kling") else "jpg"

    try:
        with httpx.Client(timeout=120 if ext == "mp4" else 60) as client:
            resp = client.get(original_url)
            resp.raise_for_status()
            data = resp.content
    except Exception as e:
        logger.warning("[%s] download failed: %s", gen.id, e)
        return "download_failed"

    try:
        new_url = upload_file(data, ext)
    except Exception as e:
        logger.warning("[%s] upload to S3 failed: %s", gen.id, e)
        return "upload_failed"

    db.refresh(gen)
    if gen.output_url != original_url:
        logger.warning("[%s] row changed since selection, skipping write", gen.id)
        return "changed"

    gen.output_url = new_url
    db.add(gen)
    db.commit()
    logger.info("[%s] fixed: %s -> %s", gen.id, original_url, new_url)
    return "fixed"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="only list broken rows, change nothing")
    parser.add_argument("--limit", type=int, default=None, help="process at most N rows")
    args = parser.parse_args()

    with Session(engine) as db:
        broken = find_broken(db)
        logger.info("Found %d broken rows", len(broken))

        if args.limit:
            broken = broken[: args.limit]

        if args.dry_run:
            for g in broken:
                print(f"{g.id}\t{g.ai_model}\t{g.created_at}\t{g.output_url}")
            return

        counts = {"fixed": 0, "download_failed": 0, "upload_failed": 0, "changed": 0}
        for g in broken:
            counts[fix_one(db, g)] += 1

        logger.info("Done. %s", counts)


if __name__ == "__main__":
    main()
