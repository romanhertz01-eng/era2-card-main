from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy import text

from app.config import settings

engine = create_engine(settings.database_url, echo=False)


def get_session():
    with Session(engine) as session:
        yield session


def init_db():
    SQLModel.metadata.create_all(engine)
    _run_migrations()


def _run_migrations():
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE generation ADD COLUMN IF NOT EXISTS parent_id VARCHAR REFERENCES generation(id)"
        ))
        conn.execute(text(
            "ALTER TABLE generation ADD COLUMN IF NOT EXISTS improve_prompt TEXT"
        ))
        conn.execute(text(
            "ALTER TABLE generation ADD COLUMN IF NOT EXISTS wish TEXT"
        ))
        conn.execute(text(
            "ALTER TABLE generation ADD COLUMN IF NOT EXISTS product_name TEXT"
        ))
        conn.execute(text(
            "ALTER TABLE generation ADD COLUMN IF NOT EXISTS concept_id TEXT"
        ))
        conn.execute(text(
            "ALTER TABLE generation ADD COLUMN IF NOT EXISTS liked BOOLEAN"
        ))
        conn.execute(text(
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS referred_by_id VARCHAR'
        ))
        conn.execute(text(
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS vk_id VARCHAR'
        ))
        conn.execute(text(
            'ALTER TABLE "user" ALTER COLUMN email DROP NOT NULL'
        ))
        conn.execute(text(
            'CREATE UNIQUE INDEX IF NOT EXISTS ix_user_vk_id ON "user" (vk_id) WHERE vk_id IS NOT NULL'
        ))
        conn.execute(text(
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS tg_id VARCHAR'
        ))
        conn.execute(text(
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE'
        ))
        conn.execute(text(
            'CREATE UNIQUE INDEX IF NOT EXISTS ix_user_tg_id ON "user" (tg_id) WHERE tg_id IS NOT NULL'
        ))
        conn.execute(text(
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS google_id VARCHAR'
        ))
        conn.execute(text(
            'CREATE UNIQUE INDEX IF NOT EXISTS ix_user_google_id ON "user" (google_id) WHERE google_id IS NOT NULL'
        ))
        conn.execute(text(
            'ALTER TABLE generation ADD COLUMN IF NOT EXISTS ai_model VARCHAR'
        ))
        conn.execute(text(
            'ALTER TABLE payment ADD COLUMN IF NOT EXISTS raw_json JSON'
        ))
        conn.execute(text(
            'ALTER TABLE generation ADD COLUMN IF NOT EXISTS reference_url VARCHAR'
        ))
        conn.commit()
