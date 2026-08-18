import asyncio
import logging

import yookassa
from sqlmodel import Session, select

from app.config import settings
from app.database import engine
from app.models import Payment, User
from app.services import payment_events

logger = logging.getLogger(__name__)

POLL_INTERVAL = 40


async def run():
    if not settings.yookassa_shop_id or not settings.yookassa_secret_key:
        logger.info("YooKassa not configured — payment poller disabled")
        return

    yookassa.Configuration.account_id = settings.yookassa_shop_id
    yookassa.Configuration.secret_key = settings.yookassa_secret_key
    logger.info("Payment poller started (interval=%ds)", POLL_INTERVAL)

    while True:
        await asyncio.sleep(POLL_INTERVAL)
        try:
            await asyncio.to_thread(_check_pending)
        except Exception:
            logger.exception("Payment poller iteration failed")


def _check_pending():
    with Session(engine) as db:
        pending = db.exec(
            select(Payment).where(Payment.status == "pending")
        ).all()

        if not pending:
            return

        logger.info("Checking %d pending payment(s)…", len(pending))

        for payment in pending:
            try:
                yk = yookassa.Payment.find_one(payment.yookassa_id)
                payment.status = yk.status

                if yk.status == "succeeded" and not payment.credited:
                    payment.credited = True
                    user = db.get(User, payment.user_id)
                    if user:
                        user.balance += payment.charges
                        db.add(user)
                        logger.info(
                            "Credited %d charges to user %s (payment %s)",
                            payment.charges, payment.user_id, payment.id,
                        )
                    payment_events.notify(payment.id)

                db.add(payment)
            except Exception as e:
                logger.warning("Failed to check payment %s: %s", payment.id, e)

        db.commit()
