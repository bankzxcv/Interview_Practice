# Design Rate Limiter

## Problem Statement

Design a distributed rate limiter that limits requests per user/IP to prevent abuse, DDoS attacks, and ensure fair resource usage.

## Requirements

- Limit requests per user (e.g., 100 req/min, 10000 req/day)
- Multiple algorithms (token bucket, sliding window)
- Distributed (works across multiple servers)
- Low latency (< 10ms overhead)
- Different limits per tier (free, premium, enterprise)

## Algorithms

### 1. Token Bucket (Best for Bursts)

```python
import time

class TokenBucket:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity  # Max tokens
        self.tokens = capacity    # Current tokens
        self.refill_rate = refill_rate  # Tokens per second
        self.last_refill = time.time()

    def allow_request(self):
        # Refill tokens based on time passed
        now = time.time()
        elapsed = now - self.last_refill
        tokens_to_add = elapsed * self.refill_rate

        self.tokens = min(self.capacity, self.tokens + tokens_to_add)
        self.last_refill = now

        if self.tokens >= 1:
            self.tokens -= 1
            return True  # Allow
        else:
            return False  # Reject

# Example: 10 requests/second, burst of 20
bucket = TokenBucket(capacity=20, refill_rate=10)
```

**Pros:**
- ✅ Handles bursts (can accumulate tokens)
- ✅ Smooth rate limiting
- ✅ Simple

**Cons:**
- ❌ Difficult to distribute (need shared state)

### 2. Fixed Window Counter

```python
import time

class FixedWindow:
    def __init__(self, limit, window_seconds):
        self.limit = limit
        self.window = window_seconds
        self.counter = 0
        self.window_start = time.time()

    def allow_request(self):
        now = time.time()

        # Reset window if expired
        if now - self.window_start > self.window:
            self.counter = 0
            self.window_start = now

        if self.counter < self.limit:
            self.counter += 1
            return True
        else:
            return False
```

**Pros:**
- ✅ Simple
- ✅ Memory efficient

**Cons:**
- ❌ Burst at boundary (59th sec + 0th sec of next = 2x limit)

### 3. Sliding Window Log

```python
from collections import deque
import time

class SlidingWindowLog:
    def __init__(self, limit, window_seconds):
        self.limit = limit
        self.window = window_seconds
        self.log = deque()  # Timestamps of requests

    def allow_request(self):
        now = time.time()

        # Remove old entries outside window
        while self.log and self.log[0] < now - self.window:
            self.log.popleft()

        if len(self.log) < self.limit:
            self.log.append(now)
            return True
        else:
            return False
```

**Pros:**
- ✅ Accurate (no boundary issues)
- ✅ True sliding window

**Cons:**
- ❌ Memory intensive (store all timestamps)

### 4. Sliding Window Counter (Best Trade-off)

```python
import time

class SlidingWindowCounter:
    def __init__(self, limit, window_seconds):
        self.limit = limit
        self.window = window_seconds
        self.prev_count = 0
        self.curr_count = 0
        self.prev_window_start = time.time() - window_seconds
        self.curr_window_start = time.time()

    def allow_request(self):
        now = time.time()

        # Check if need to roll windows
        if now - self.curr_window_start > self.window:
            self.prev_count = self.curr_count
            self.curr_count = 0
            self.prev_window_start = self.curr_window_start
            self.curr_window_start = now

        # Calculate weighted count
        elapsed_in_curr = now - self.curr_window_start
        weight_prev = (self.window - elapsed_in_curr) / self.window
        estimated_count = self.prev_count * weight_prev + self.curr_count

        if estimated_count < self.limit:
            self.curr_count += 1
            return True
        else:
            return False
```

**Pros:**
- ✅ Memory efficient (only 2 counters)
- ✅ Smooth rate limiting
- ✅ Production-ready

## Distributed Rate Limiter (Redis)

```python
import redis
import time

class DistributedRateLimiter:
    def __init__(self, redis_client, limit, window_seconds):
        self.redis = redis_client
        self.limit = limit
        self.window = window_seconds

    def allow_request(self, user_id):
        key = f"rate_limit:{user_id}"
        now = int(time.time())
        window_start = now - self.window

        # Remove old entries
        self.redis.zremrangebyscore(key, 0, window_start)

        # Count requests in current window
        count = self.redis.zcard(key)

        if count < self.limit:
            # Add current request
            self.redis.zadd(key, {now: now})
            # Set expiry
            self.redis.expire(key, self.window + 1)
            return True
        else:
            return False

# Usage
redis_client = redis.Redis()
limiter = DistributedRateLimiter(redis_client, limit=100, window_seconds=60)

if limiter.allow_request("user123"):
    # Process request
    pass
else:
    # Reject with 429 Too Many Requests
    pass
```

**Better: Redis INCR with TTL (Fixed Window)**

```python
def rate_limit_simple(user_id, limit=100, window=60):
    key = f"rate_limit:{user_id}:{int(time.time() // window)}"

    count = redis.incr(key)

    if count == 1:
        # First request in window, set expiry
        redis.expire(key, window)

    return count <= limit

# Atomic, fast, simple!
```

## Lua Script for Atomicity

```lua
-- Redis Lua script for sliding window rate limiter
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- Remove old entries
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

-- Count current requests
local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, now)
    redis.call('EXPIRE', key, window + 1)
    return 1  -- Allow
else
    return 0  -- Reject
end
```

```python
# Execute Lua script
script = redis.register_script(lua_script)
allowed = script(keys=[f"rate_limit:{user_id}"], args=[limit, window, int(time.time())])
```

## Multi-Tier Rate Limiting

```python
RATE_LIMITS = {
    'free': {'second': 1, 'minute': 20, 'hour': 1000, 'day': 10000},
    'premium': {'second': 10, 'minute': 500, 'hour': 10000, 'day': 100000},
    'enterprise': {'second': 100, 'minute': 5000, 'hour': 100000, 'day': 1000000}
}

def check_rate_limit(user_id, tier):
    limits = RATE_LIMITS[tier]

    for window, limit in limits.items():
        window_seconds = {'second': 1, 'minute': 60, 'hour': 3600, 'day': 86400}[window]

        if not rate_limit_simple(f"{user_id}:{window}", limit, window_seconds):
            return False, f"Rate limit exceeded: {limit} requests per {window}"

    return True, "OK"
```

## API Design

```
# Middleware
@app.before_request
def rate_limit():
    user_id = get_current_user_id()
    tier = get_user_tier(user_id)

    allowed, message = check_rate_limit(user_id, tier)

    if not allowed:
        return Response(message, status=429, headers={
            'X-RateLimit-Limit': str(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': str(next_window_time),
            'Retry-After': '60'
        })
```

## Scaling

1. **Redis Cluster**: Shard by user_id
2. **Rate Limit Headers**: Inform clients
3. **Exponential Backoff**: Client-side retries
4. **Allow Overages**: Premium users can burst briefly

## Monitoring

```
Metrics:
- Rate limit hit rate: % requests rejected
- Average requests per user
- Peak requests per second
- Tier distribution

Alerts:
- Sudden spike in rate limit rejections (DDoS?)
- Redis latency > 10ms
```

## Interview Talking Points

"Rate limiter needs distributed coordination. I'd use Redis with sliding window counter for accuracy + memory efficiency. For atomicity, use Lua scripts. Support multiple tiers (free/premium) with different limits. Monitor rejection rate (<5% normal, >50% = attack). Return 429 with Retry-After header. For scale, shard Redis by user_id."
