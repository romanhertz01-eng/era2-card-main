import asyncio
import hashlib
import hmac
import json
import logging
from typing import Optional
from uuid import uuid4

import yookassa
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select

from app.config import settings
from app.database import get_session
from app.deps import get_current_user
from app.models import Payment, User
from app.services import payment_events
from app.services.analytics.metrika import send_yandex_metrika_order, store_payment_identifiers

logger = logging.getLogger(__name__)

router = APIRouter()

CREDIT_PACKS = {
    "p50":   {"charges": 50,   "bonus": 0,   "amount": "390.00",  "label": "50 зарядов ERA2 Card"},
    "p150":  {"charges": 150,  "bonus": 15,  "amount": "990.00",  "label": "150 зарядов ERA2 Card (+15 бонус)"},
    "p450":  {"charges": 450,  "bonus": 60,  "amount": "2490.00", "label": "450 зарядов ERA2 Card (+60 бонус)"},
    "p1300": {"charges": 1300, "bonus": 200, "amount": "6490.00", "label": "1300 зарядов ERA2 Card (+200 бонус)"},
}


def _yk():
    yookassa.Configuration.account_id = settings.yookassa_shop_id
    yookassa.Configuration.secret_key = settings.yookassa_secret_key


class CreatePaymentBody(BaseModel):
    pack_id: str
    metrika_client_id: Optional[str] = None
    metrika_yclid: Optional[str] = None


@router.post("/payments/create")
def create_payment(
    body: CreatePaymentBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    pack = CREDIT_PACKS.get(body.pack_id)
    if not pack:
        raise HTTPException(400, "Unknown pack")

    if not settings.yookassa_shop_id or not settings.yookassa_secret_key:
        raise HTTPException(503, "Payments not configured")

    _yk()
    total_charges = pack["charges"] + pack["bonus"]

    try:
        payment_data: dict = {
            "amount": {"value": pack["amount"], "currency": "RUB"},
            "confirmation": {
                "type": "redirect",
                "return_url": f"{settings.frontend_url}/billing?paid=1",
            },
            "description": f"{pack['label']} · {current_user.id}",
            "metadata": {
                "user_id": current_user.id,
                "pack_id": body.pack_id,
                **({"ym_client_id": body.metrika_client_id} if body.metrika_client_id else {}),
                **({"yclid": body.metrika_yclid} if body.metrika_yclid else {}),
            },
            "capture": True,
        }
        if current_user.email:
            payment_data["receipt"] = {
                "customer": {"email": current_user.email},
                "items": [{
                    "description": pack["label"],
                    "quantity": "1.00",
                    "amount": {"value": pack["amount"], "currency": "RUB"},
                    "vat_code": 1,
                    "payment_mode": "full_payment",
                    "payment_subject": "service",
                }],
            }
        yk_payment = yookassa.Payment.create(payment_data, str(uuid4()))
    except Exception as e:
        logger.exception("YooKassa create payment failed")
        raise HTTPException(502, f"Payment gateway error: {e}")

    payment = Payment(
        user_id=current_user.id,
        pack_id=body.pack_id,
        yookassa_id=yk_payment.id,
        amount_rub=pack["amount"],
        charges=total_charges,
        status="pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "payment_id": payment.id,
        "confirmation_url": yk_payment.confirmation.confirmation_url,
    }


@router.get("/payments")
def list_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    return db.exec(
        select(Payment)
        .where(Payment.user_id == current_user.id, Payment.credited == True)
        .order_by(Payment.created_at.desc())
        .limit(50)
    ).all()


@router.get("/payments/{payment_id}/wait")
async def wait_payment(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    payment = db.exec(
        select(Payment).where(Payment.id == payment_id, Payment.user_id == current_user.id)
    ).first()
    if not payment:
        raise HTTPException(404, "Payment not found")

    if payment.credited:
        return {"status": "succeeded", "charges": payment.charges}

    event = payment_events.get(payment_id)
    try:
        await asyncio.wait_for(event.wait(), timeout=55)
    except asyncio.TimeoutError:
        pass
    finally:
        payment_events.cleanup(payment_id)

    db.refresh(payment)
    return {
        "status": "succeeded" if payment.credited else payment.status,
        "charges": payment.charges if payment.credited else 0,
    }


@router.post("/payments/webhook")
async def yookassa_webhook(request: Request, db: Session = Depends(get_session)):
    body = await request.body()

    # Проверка подписи если задан секрет
    if settings.yookassa_webhook_secret:
        sig = request.headers.get("X-YooMoney-Hmac-Sha256", "")
        expected = hmac.new(
            settings.yookassa_webhook_secret.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(sig, expected):
            raise HTTPException(400, "Invalid signature")

    try:
        event = json.loads(body)
    except Exception:
        raise HTTPException(400, "Invalid JSON")

    if event.get("event") != "payment.succeeded":
        return {"ok": True}

    yk_id = event.get("object", {}).get("id")
    if not yk_id:
        raise HTTPException(400, "Missing payment id")

    payment = db.exec(select(Payment).where(Payment.yookassa_id == yk_id)).first()
    if not payment:
        logger.warning("Webhook: payment not found for yookassa_id=%s", yk_id)
        return {"ok": True}

    if not payment.credited:
        payment.credited = True
        payment.status = "succeeded"
        user = db.get(User, payment.user_id)
        if user:
            user.balance += payment.charges
            db.add(user)
            logger.info(
                "Webhook: credited %d charges to user %s (payment %s)",
                payment.charges, payment.user_id, payment.id,
            )
        event_metadata = event.get("object", {}).get("metadata") or {}
        store_payment_identifiers(
            payment,
            client_id=event_metadata.get("ym_client_id"),
            yclid=event_metadata.get("yclid"),
        )
        db.add(payment)
        db.commit()
        payment_events.notify(payment.id)

        try:
            await send_yandex_metrika_order(db, payment=payment)
        except Exception:
            logger.exception("Yandex Metrika upload failed for payment=%s", payment.id)

    return {"ok": True}


@router.get("/payments/{payment_id}/status")
def check_payment(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    payment = db.exec(
        select(Payment).where(
            Payment.id == payment_id,
            Payment.user_id == current_user.id,
        )
    ).first()

    if not payment:
        raise HTTPException(404, "Payment not found")

    return {
        "status": "succeeded" if payment.credited else payment.status,
        "charges": payment.charges if payment.credited else 0,
    }
