import secrets
import string
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

_ALPHABET = string.ascii_lowercase + string.digits  # a-z 0-9


def gen_id() -> str:
    return ''.join(secrets.choice(_ALPHABET) for _ in range(16))


class User(SQLModel, table=True):
    id: str = Field(default_factory=gen_id, primary_key=True)
    email: Optional[str] = Field(default=None, unique=True, index=True)
    vk_id: Optional[str] = Field(default=None, unique=True, index=True)
    tg_id: Optional[str] = Field(default=None, unique=True, index=True)
    google_id: Optional[str] = Field(default=None, unique=True, index=True)
    name: str
    password_hash: str
    balance: int = 15
    is_guest: bool = False
    generated_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    referred_by_id: Optional[str] = Field(default=None)


class Project(SQLModel, table=True):
    id: str = Field(default_factory=gen_id, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    name: str
    category: str
    marketplace: str = "wb"
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Payment(SQLModel, table=True):
    id: str = Field(default_factory=gen_id, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    pack_id: str
    yookassa_id: str = Field(index=True)
    amount_rub: str
    charges: int
    status: str = "pending"  # pending / succeeded / canceled
    credited: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    raw_json: Optional[dict] = Field(default=None, sa_column=Column(JSON))


class GuestIP(SQLModel, table=True):
    id: str = Field(default_factory=gen_id, primary_key=True)
    ip: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Generation(SQLModel, table=True):
    id: str = Field(default_factory=gen_id, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    project_id: Optional[str] = Field(default=None, foreign_key="project.id")
    parent_id: Optional[str] = Field(default=None, foreign_key="generation.id")
    improve_prompt: Optional[str] = Field(default=None)
    task: str
    marketplace: str
    status: str = "pending"
    output_url: Optional[str] = None
    charges_spent: int
    wish: Optional[str] = Field(default=None)
    product_name: Optional[str] = Field(default=None)
    concept_id: Optional[str] = Field(default=None)
    liked: Optional[bool] = Field(default=None)
    ai_model: Optional[str] = Field(default=None)  # gpt-image-2 / kling-3.0 / gemini
    reference_url: Optional[str] = Field(default=None)  # исходный референс для task=reference
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
