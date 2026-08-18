from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlmodel import Session, select

from app.database import get_session
from app.deps import get_current_user
from app.models import User

router = APIRouter()


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "balance": current_user.balance,
        "generated_count": current_user.generated_count,
        "created_at": current_user.created_at,
        "is_guest": current_user.is_guest,
    }


class UpdateMeBody(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None


@router.patch("/me")
def update_me(
    body: UpdateMeBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    if body.email and body.email != current_user.email:
        from sqlmodel import select as sel
        existing = db.exec(sel(User).where(User.email == body.email)).first()
        if existing:
            raise HTTPException(409, "Email уже используется")
        current_user.email = body.email
    if body.name:
        current_user.name = body.name
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name}


@router.get("/me/balance")
def get_balance(current_user: User = Depends(get_current_user)):
    return {"balance": current_user.balance}


@router.get("/me/referral")
def get_referral(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    referred_count = db.exec(
        select(func.count(User.id)).where(User.referred_by_id == current_user.id)
    ).one()
    return {
        "referral_code": current_user.id,
        "referred_count": referred_count,
        "bonus_per_referral": 20,
    }
