import time
from uuid import uuid4
from dataclasses import dataclass
from threading import Lock

from fastapi import HTTPException, Request, status
from redis import Redis
from redis.exceptions import RedisError

from app.core.config import settings


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


class RedisRateLimiter:
    def __init__(self, url: str) -> None:
        self.redis = Redis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=0.1,
            socket_timeout=0.1,
        )

    def check(self, key: str, rule: RateLimitRule) -> None:
        if rule.limit <= 0:
            return

        now = time.time()
        window_start = now - rule.window_seconds
        redis_key = f"rate-limit:{key}"
        pipe = self.redis.pipeline()
        pipe.zremrangebyscore(redis_key, 0, window_start)
        pipe.zcard(redis_key)
        pipe.zadd(redis_key, {f"{now}:{uuid4()}": now})
        pipe.expire(redis_key, rule.window_seconds)
        _removed, count, *_rest = pipe.execute()
        if int(count) >= rule.limit:
            raise RateLimitExceeded

    def clear(self) -> None:
        for key in self.redis.scan_iter("rate-limit:*"):
            self.redis.delete(key)


redis_rate_limiter = RedisRateLimiter(settings.redis_url)


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
        try:
            redis_rate_limiter.check(key, rule)
        except RedisError:
            rate_limiter.check(key, rule)
    except RateLimitExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait before trying again.",
        ) from exc
