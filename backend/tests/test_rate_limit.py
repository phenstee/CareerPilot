import pytest

from app.core.rate_limit import RateLimitExceeded, RateLimitRule, RedisRateLimiter


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, dict[str, float]] = {}

    def pipeline(self):
        return FakePipeline(self)

    def scan_iter(self, pattern: str):
        prefix = pattern.removesuffix("*")
        return (key for key in list(self.values) if key.startswith(prefix))

    def delete(self, key: str) -> None:
        self.values.pop(key, None)


class FakePipeline:
    def __init__(self, redis: FakeRedis) -> None:
        self.redis = redis
        self.operations = []

    def zremrangebyscore(self, key: str, minimum: float, maximum: float):
        self.operations.append(("zremrangebyscore", key, minimum, maximum))
        return self

    def zcard(self, key: str):
        self.operations.append(("zcard", key))
        return self

    def zadd(self, key: str, values: dict[str, float]):
        self.operations.append(("zadd", key, values))
        return self

    def expire(self, key: str, seconds: int):
        self.operations.append(("expire", key, seconds))
        return self

    def execute(self):
        results = []
        for operation in self.operations:
            name = operation[0]
            key = operation[1]
            bucket = self.redis.values.setdefault(key, {})
            if name == "zremrangebyscore":
                _name, _key, minimum, maximum = operation
                for member, score in list(bucket.items()):
                    if minimum <= score <= maximum:
                        bucket.pop(member)
                results.append(1)
            elif name == "zcard":
                results.append(len(bucket))
            elif name == "zadd":
                _name, _key, values = operation
                bucket.update(values)
                results.append(1)
            elif name == "expire":
                results.append(True)
        return results


def _redis_limiter(fake_redis: FakeRedis) -> RedisRateLimiter:
    limiter = RedisRateLimiter.__new__(RedisRateLimiter)
    limiter.redis = fake_redis
    return limiter


def test_redis_rate_limiter_enforces_shared_threshold(monkeypatch) -> None:
    fake_redis = FakeRedis()
    limiter_one = _redis_limiter(fake_redis)
    limiter_two = _redis_limiter(fake_redis)
    rule = RateLimitRule(limit=2, window_seconds=60)

    monkeypatch.setattr("app.core.rate_limit.time.time", lambda: 1000.0)
    limiter_one.check("user:one:ai", rule)
    limiter_two.check("user:one:ai", rule)

    with pytest.raises(RateLimitExceeded):
        limiter_one.check("user:one:ai", rule)


def test_redis_rate_limiter_keeps_users_isolated(monkeypatch) -> None:
    fake_redis = FakeRedis()
    limiter = _redis_limiter(fake_redis)
    rule = RateLimitRule(limit=1, window_seconds=60)

    monkeypatch.setattr("app.core.rate_limit.time.time", lambda: 1000.0)
    limiter.check("user:one:ai", rule)
    limiter.check("user:two:ai", rule)

    with pytest.raises(RateLimitExceeded):
        limiter.check("user:one:ai", rule)


def test_redis_rate_limiter_window_expiry(monkeypatch) -> None:
    fake_redis = FakeRedis()
    limiter = _redis_limiter(fake_redis)
    rule = RateLimitRule(limit=1, window_seconds=60)

    monkeypatch.setattr("app.core.rate_limit.time.time", lambda: 1000.0)
    limiter.check("user:one:ai", rule)

    monkeypatch.setattr("app.core.rate_limit.time.time", lambda: 1061.0)
    limiter.check("user:one:ai", rule)
