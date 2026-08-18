import threading
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import Date, cast
from sqlmodel import Session, func, select

from app.config import settings
from app.database import get_session
from app.models import Generation, Payment, User

router = APIRouter()

_failed: dict[str, list[datetime]] = defaultdict(list)
_lock = threading.Lock()
_BLOCK_AFTER = 3
_BLOCK_WINDOW = timedelta(minutes=1)


def _auth(request: Request, x_admin_secret: str = Header(...)):
    ip = request.client.host if request.client else "unknown"
    now = datetime.utcnow()

    with _lock:
        _failed[ip] = [t for t in _failed[ip] if now - t < _BLOCK_WINDOW]
        if len(_failed[ip]) >= _BLOCK_AFTER:
            raise HTTPException(429, "Слишком много неудачных попыток, подождите минуту")

    if not settings.admin_secret or x_admin_secret != settings.admin_secret:
        with _lock:
            _failed[ip].append(now)
        raise HTTPException(403, "Forbidden")

    with _lock:
        _failed[ip] = []


@router.get("/stats")
def stats(db: Session = Depends(get_session), _: str = Depends(_auth)):
    total_gen = db.exec(select(func.count(Generation.id))).one()
    total_users = db.exec(select(func.count(User.id))).one()

    task_rows = db.exec(
        select(Generation.task, func.count(Generation.id), func.sum(Generation.charges_spent))
        .group_by(Generation.task)
    ).all()
    task_breakdown = {
        r[0]: {"count": int(r[1] or 0), "charges": int(r[2] or 0)}
        for r in task_rows
    }

    return {"total_generations": total_gen, "total_users": total_users, "task_breakdown": task_breakdown}


@router.get("/users")
def search_users(q: str = "", db: Session = Depends(get_session), _: str = Depends(_auth)):
    stmt = select(User)
    if q:
        stmt = stmt.where(
            User.email.ilike(f"%{q}%") | User.name.ilike(f"%{q}%") | User.id.ilike(f"%{q}%")
        )
    return db.exec(stmt.limit(20)).all()


@router.get("/charts")
def charts(db: Session = Depends(get_session), _: str = Depends(_auth)):
    today = datetime.utcnow().date()
    since = today - timedelta(days=6)

    topup_rows = db.exec(
        select(cast(Payment.created_at, Date), func.sum(Payment.charges))
        .where(Payment.credited == True)
        .where(cast(Payment.created_at, Date) >= since)
        .group_by(cast(Payment.created_at, Date))
        .order_by(cast(Payment.created_at, Date))
    ).all()

    spend_rows = db.exec(
        select(cast(Generation.created_at, Date), func.sum(Generation.charges_spent))
        .where(cast(Generation.created_at, Date) >= since)
        .group_by(cast(Generation.created_at, Date))
        .order_by(cast(Generation.created_at, Date))
    ).all()

    def fill_days(rows):
        data = {str(r[0]): int(r[1] or 0) for r in rows}
        return [
            {"day": str(since + timedelta(days=i)), "total": data.get(str(since + timedelta(days=i)), 0)}
            for i in range(7)
        ]

    return {"topups": fill_days(topup_rows), "spend": fill_days(spend_rows)}


@router.get("/top-users")
def top_users(db: Session = Depends(get_session), _: str = Depends(_auth)):
    top_topup = db.exec(
        select(User.id, User.name, User.email, func.sum(Payment.charges))
        .join(Payment, Payment.user_id == User.id)
        .where(Payment.credited == True)
        .group_by(User.id, User.name, User.email)
        .order_by(func.sum(Payment.charges).desc())
        .limit(5)
    ).all()

    top_spend = db.exec(
        select(User.id, User.name, User.email, func.sum(Generation.charges_spent))
        .join(Generation, Generation.user_id == User.id)
        .group_by(User.id, User.name, User.email)
        .order_by(func.sum(Generation.charges_spent).desc())
        .limit(5)
    ).all()

    def to_list(rows):
        return [
            {"id": r[0], "name": r[1] or r[2].split("@")[0], "email": r[2], "total": int(r[3] or 0)}
            for r in rows
        ]

    return {"top_topup": to_list(top_topup), "top_spend": to_list(top_spend)}


@router.get("/payments")
def list_payments(db: Session = Depends(get_session), _: str = Depends(_auth)):
    rows = db.exec(
        select(
            Payment.id,
            Payment.pack_id,
            Payment.amount_rub,
            Payment.charges,
            Payment.created_at,
            User.id.label("user_id"),
            User.name.label("user_name"),
            User.email.label("user_email"),
        )
        .join(User, User.id == Payment.user_id)
        .where(Payment.credited == True)
        .order_by(Payment.created_at.desc())
        .limit(100)
    ).all()
    return [
        {
            "id": r[0],
            "pack_id": r[1],
            "amount_rub": r[2],
            "charges": r[3],
            "created_at": r[4],
            "user_id": r[5],
            "user_name": r[6],
            "user_email": r[7],
        }
        for r in rows
    ]


class TopupBody(BaseModel):
    amount: int


@router.post("/users/{user_id}/topup")
def topup(
    user_id: str,
    body: TopupBody,
    db: Session = Depends(get_session),
    _: str = Depends(_auth),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.balance += body.amount
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
