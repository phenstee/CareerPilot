import time
from dataclasses import dataclass
from threading import Lock

from fastapi import HTTPException, Request, status


@dataclass(frozen=True)
class RateLimitRule:
    limit: int
    window_seconds: int


class RateLimitExceeded(Exception):
    pass


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._buckets: dict[str, list[float]] = {}
        self._lock = Lock()

    def check(self, key: str, rule: RateLimitRule) -> None:
        if rule.limit <= 0:
            return

        now = time.monotonic()
        cutoff = now - rule.window_seconds
        with self._lock:
            entries = [timestamp for timestamp in self._buckets.get(key, []) if timestamp > cutoff]
            if len(entries) >= rule.limit:
                self._buckets[key] = entries
                raise RateLimitExceeded
            entries.append(now)
            self._buckets[key] = entries

    def clear(self) -> None:
        with self._lock:
            self._buckets.clear()


rate_limiter = InMemoryRateLimiter()


def client_ip(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def enforce_ip_rate_limit(request: Request, bucket: str, rule: RateLimitRule) -> None:
    _enforce_rate_limit(f"ip:{client_ip(request)}:{bucket}", rule)


def enforce_user_rate_limit(user_id: str, bucket: str, rule: RateLimitRule) -> None:
    _enforce_rate_limit(f"user:{user_id}:{bucket}", rule)


def _enforce_rate_limit(key: str, rule: RateLimitRule) -> None:
    try:
        rate_limiter.check(key, rule)
    except RateLimitExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait before trying again.",
        ) from exc
