from __future__ import annotations

import logging
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Any
from zoneinfo import ZoneInfo

import httpx
from sqlalchemy.orm.attributes import flag_modified
from sqlmodel import Session

from app.config import settings
from app.models import Payment, User

logger = logging.getLogger(__name__)

YANDEX_METRIKA_API_BASE = "https://api-metrika.yandex.net"
_METRIKA_COUNTER_TIMEZONE = ZoneInfo("Europe/Moscow")


class YandexMetrikaConfigurationError(RuntimeError):
    """Raised when Metrika credentials are not configured."""


def _coerce_raw(raw_data: Any) -> dict[str, Any]:
    return dict(raw_data) if isinstance(raw_data, dict) else {}


def _normalize(value: Any, *, max_length: int = 200) -> str | None:
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized[:max_length] if normalized else None


def _normalize_numeric(value: str | None) -> int | None:
    normalized = _normalize(value, max_length=64)
    if not normalized or not normalized.isdigit():
        return None
    try:
        return int(normalized)
    except ValueError:
        return None


def _merge_payment_raw(
    raw_data: Any,
    *,
    identifiers: dict[str, str] | None = None,
    order_upload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    merged = _coerce_raw(raw_data)
    metrika_data = merged.get("metrika")
    if not isinstance(metrika_data, dict):
        metrika_data = {}

    if identifiers is not None:
        stored = metrika_data.get("identifiers")
        if not isinstance(stored, dict):
            stored = {}
        stored.update({key: value for key, value in identifiers.items() if value})
        if stored:
            metrika_data["identifiers"] = stored

    if order_upload is not None:
        metrika_data["order_upload"] = dict(order_upload)

    if metrika_data:
        merged["metrika"] = metrika_data
    return merged


def store_payment_identifiers(payment: Payment, *, client_id: str | None, yclid: str | None) -> None:
    """Persists Metrika identifiers on the payment. Call once at webhook time, before uploading."""
    if not client_id and not yclid:
        return
    payment.raw_json = _merge_payment_raw(
        payment.raw_json,
        identifiers={"client_id": client_id or "", "yclid": yclid or ""},
    )
    flag_modified(payment, "raw_json")


def _get_credentials() -> tuple[str, int]:
    token = (settings.yandex_metrika_token or "").strip()
    counter_id = settings.yandex_metrika_counter_id
    if not token or not counter_id:
        raise YandexMetrikaConfigurationError("Yandex Metrika token/counter is not configured")
    return token, int(counter_id)


def _format_datetime(value: datetime | None) -> str:
    source = value or datetime.now(timezone.utc)
    if source.tzinfo is None:
        source = source.replace(tzinfo=timezone.utc)
    return source.astimezone(_METRIKA_COUNTER_TIMEZONE).strftime("%Y-%m-%d %H:%M:%S")


def _resolve_order_status(payment: Payment) -> str:
    if payment.status == "succeeded":
        return "PAID"
    if payment.status == "canceled":
        return "CANCELLED"
    return "IN_PROGRESS"


def _build_contact_payload(*, payment: Payment, user: User | None, identifiers: dict[str, str]) -> dict[str, Any]:
    client_id = _normalize_numeric(identifiers.get("client_id"))
    name = ((user.name if user else "") or str(payment.user_id))[:255]
    contact: dict[str, Any] = {
        "uniq_id": str(payment.user_id),
        "name": name,
        "create_date_time": _format_datetime(payment.created_at),
        "update_date_time": _format_datetime(payment.created_at),
        "user_comment": "",
    }
    if client_id is not None:
        contact["client_ids"] = [client_id]
    if user and user.email:
        contact["emails"] = [user.email]
    return {"contacts": [contact]}


def _build_order_payload(*, payment: Payment, identifiers: dict[str, str], order_status: str) -> dict[str, Any]:
    amount = Decimal(str(payment.amount_rub)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    order: dict[str, Any] = {
        "id": payment.yookassa_id,
        "purchase_id": payment.id,
        "client_uniq_id": str(payment.user_id),
        "client_type": "CONTACT",
        "create_date_time": _format_datetime(payment.created_at),
        "update_date_time": _format_datetime(payment.created_at),
        "order_status": order_status,
        "revenue": float(f"{amount:.2f}"),
        "currency": "RUB",
        "user_comment": "",
    }
    if order_status == "PAID":
        order["finish_date_time"] = _format_datetime(payment.created_at)
    yclid = _normalize_numeric(identifiers.get("yclid"))
    if yclid is not None:
        order["yclid"] = yclid
    return {"orders": [order]}


async def _metrika_request(
    *,
    method: str,
    path: str,
    token: str,
    params: dict[str, Any] | None = None,
    json_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    timeout = httpx.Timeout(settings.yandex_metrika_timeout_seconds)
    headers = {"Authorization": f"OAuth {token}"}
    async with httpx.AsyncClient(base_url=YANDEX_METRIKA_API_BASE, timeout=timeout) as client:
        response = await client.request(
            method=method.upper(), url=path, params=params, json=json_data, headers=headers
        )
        response.raise_for_status()
        return response.json()


async def send_yandex_metrika_order(db: Session, *, payment: Payment) -> bool:
    """Uploads the payment as a CDP contact + order to Yandex Metrika.

    Idempotent per order status: a webhook retry that doesn't change the
    payment's status (e.g. duplicate `payment.succeeded` notifications from
    YooKassa) won't re-upload the same order.
    """
    try:
        token, counter_id = _get_credentials()
    except YandexMetrikaConfigurationError:
        logger.warning("Yandex Metrika upload skipped for payment=%s: not configured", payment.id)
        return False

    raw_data = _coerce_raw(payment.raw_json)
    metrika_data = raw_data.get("metrika") if isinstance(raw_data.get("metrika"), dict) else {}
    identifiers = metrika_data.get("identifiers") if isinstance(metrika_data.get("identifiers"), dict) else {}
    order_upload = metrika_data.get("order_upload") if isinstance(metrika_data.get("order_upload"), dict) else None

    order_status = _resolve_order_status(payment)
    if order_upload and order_upload.get("status") == order_status:
        return False

    if not identifiers.get("client_id"):
        logger.warning(
            "Yandex Metrika CDP upload for payment=%s has no client_id; attribution will be unavailable",
            payment.id,
        )

    user = db.get(User, payment.user_id)

    try:
        await _metrika_request(
            method="POST",
            path=f"/cdp/api/v1/counter/{counter_id}/data/contacts/json",
            token=token,
            params={"merge_mode": "UPDATE"},
            json_data=_build_contact_payload(payment=payment, user=user, identifiers=identifiers),
        )
        order_response = await _metrika_request(
            method="POST",
            path=f"/cdp/api/v1/counter/{counter_id}/data/orders/json",
            token=token,
            params={"merge_mode": "UPDATE"},
            json_data=_build_order_payload(payment=payment, identifiers=identifiers, order_status=order_status),
        )
    except Exception:
        logger.exception("Yandex Metrika CDP upload failed for payment=%s", payment.id)
        return False

    payment.raw_json = _merge_payment_raw(
        payment.raw_json,
        order_upload={
            "uploadedAt": datetime.now(timezone.utc).isoformat(),
            "counterId": counter_id,
            "status": order_status,
            "clientId": identifiers.get("client_id"),
            "response": order_response,
        },
    )
    flag_modified(payment, "raw_json")
    db.add(payment)
    db.commit()
    logger.info("Yandex Metrika CDP order uploaded for payment=%s status=%s", payment.id, order_status)
    return True
