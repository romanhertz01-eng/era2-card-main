import asyncio

_events: dict[str, asyncio.Event] = {}


def get(payment_id: str) -> asyncio.Event:
    if payment_id not in _events:
        _events[payment_id] = asyncio.Event()
    return _events[payment_id]


def notify(payment_id: str) -> None:
    if payment_id in _events:
        _events[payment_id].set()


def cleanup(payment_id: str) -> None:
    _events.pop(payment_id, None)
