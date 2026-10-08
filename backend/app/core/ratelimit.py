"""Small in-memory sliding-window rate limiter.

Fine for a single server (Render free tier). If you later run several instances,
move the counters to Redis. Counters reset when the server restarts.
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from .config import TRUST_PROXY

_lock = threading.Lock()
_hits: dict[str, deque] = defaultdict(deque)


def client_ip(request: Request) -> str:
    """Behind Render/Vercel proxies the real IP is in X-Forwarded-For."""
    if TRUST_PROXY:
        xff = request.headers.get("x-forwarded-for", "")
        if xff:
            return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _prune(q: deque, window: int, now: float) -> None:
    while q and now - q[0] > window:
        q.popleft()


def _too_many(q: deque, window: int, now: float) -> HTTPException:
    wait = int(window - (now - q[0])) + 1
    return HTTPException(
        429, f"Too many attempts. Please try again in {wait}s.", headers={"Retry-After": str(wait)}
    )


def check(key: str, limit: int, window: int) -> None:
    """Raise 429 if the key already used up its limit. Does not record a hit."""
    now = time.monotonic()
    with _lock:
        q = _hits[key]
        _prune(q, window, now)
        if len(q) >= limit:
            raise _too_many(q, window, now)


def record(key: str, window: int) -> None:
    now = time.monotonic()
    with _lock:
        q = _hits[key]
        _prune(q, window, now)
        q.append(now)
        if len(_hits) > 20000:          # keep memory bounded
            for k in [k for k, v in _hits.items() if not v][:5000]:
                _hits.pop(k, None)


def hit(key: str, limit: int, window: int) -> None:
    """check + record in one step."""
    check(key, limit, window)
    record(key, window)


def clear(key: str) -> None:
    with _lock:
        _hits.pop(key, None)