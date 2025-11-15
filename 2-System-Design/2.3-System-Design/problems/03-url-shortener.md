# Design URL Shortener (like bit.ly or TinyURL)

## Problem Statement

Design a service that takes long URLs and converts them to short URLs. When users visit the short URL, they should be redirected to the original long URL. The system should also provide analytics like click tracking and geographic data.

## Requirements Clarification

### Functional Requirements

- Generate short URL from long URL
- Redirect short URL to original URL
- Custom short URLs (optional, premium feature)
- TTL/expiration for URLs (optional)
- Analytics: click count, referrers, locations, devices

### Non-Functional Requirements

- **High availability**: 99.99% uptime
- **Low latency**: Redirect in < 100ms
- **Scale**: 100M new URLs/month, 10B redirects/month
- **Durability**: URLs never lost
- **Short**: URLs should be as short as possible

### Out of Scope

- User accounts and authentication
- QR code generation
- Link in bio pages

## Capacity Estimation

### Traffic

```
Write (URL shortening):
- 100M new URLs/month
- Per second: 100M / (30 × 86,400) = ~39 writes/sec
- Peak (3x): ~120 writes/sec
- Very manageable write load

Read (URL redirection):
- 10B redirects/month
- Per second: 10B / (30 × 86,400) = ~3,900 redirects/sec
- Peak: ~12,000 redirects/sec

Read/Write Ratio: 3,900 / 39 = 100:1 (read-heavy)
```

### Storage (10 Years)

```
New URLs per month: 100M
Total URLs: 100M × 12 × 10 = 12 billion URLs

Storage per URL:
- Short key: 7 characters = 7 bytes
- Long URL: avg 100 characters = 200 bytes
- Created timestamp: 8 bytes
- User ID: 8 bytes (optional)
- Click count: 8 bytes
- Total: ~230 bytes per URL

Total storage: 12B × 230 bytes = 2.76 TB

Analytics data (clicks):
- 10B clicks/month × 12 months × 10 years = 1.2 trillion clicks
- Per click: 50 bytes (timestamp, IP, referrer, user_agent)
- Total: 1.2T × 50 bytes = 60 TB

Total storage: ~63 TB (very manageable!)
```

### Bandwidth

```
Write: 39 URLs/sec × 230 bytes = 9KB/sec (negligible)
Read: 3,900 redirects/sec × 230 bytes = 897KB/sec (negligible)

Bandwidth is not a concern for this system.
```

## High-Level Architecture

```
┌───────────────┐
│    Client     │
└───────┬───────┘
        │
        │ GET bit.ly/abc123
        ▼
┌────────────────────┐
│   Load Balancer    │
│   (AWS ALB)        │
└────────┬───────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ API  │  │ API  │
│Server│  │Server│
└───┬──┘  └──┬───┘
    │        │
    └────┬───┘
         │
    ┌────▼───────────┐
    │  Redis Cache   │  ← Check here first (cache hit = fast!)
    │  short → long  │
    └────┬───────────┘
         │ Cache miss
         ▼
┌─────────────────────┐
│   Database          │
│   (PostgreSQL       │
│    or DynamoDB)     │
│                     │
│  urls table         │
│  analytics table    │
└─────────────────────┘
```

## Design Decisions & Critiques

### Decision 1: How to Generate Short Keys?

This is the CORE challenge of URL shortener design.

#### Option 1: Hash Function (MD5/SHA)

```python
import hashlib

def generate_short_url_hash(long_url):
    # MD5 produces 128-bit hash (32 hex chars)
    hash_result = hashlib.md5(long_url.encode()).hexdigest()

    # Take first 7 characters
    short_key = hash_result[:7]

    return short_key

# Example:
long_url = "https://www.example.com/very/long/url/path"
short_key = generate_short_url_hash(long_url)
# Result: "a4f8b3c" (7 chars)
```

**Pros:**
- ✅ Deterministic (same URL → same short key)
- ✅ Can detect duplicates easily
- ✅ No database lookup needed to generate
- ✅ Distributed generation (no coordination)

**Cons:**
- ❌ **Collision handling required** (two URLs → same hash)
- ❌ Can't guarantee unique without checking database
- ❌ Collision probability increases with more URLs (birthday paradox)
- ❌ No control over generated keys

**Collision Resolution:**
```python
def generate_with_collision_handling(long_url):
    attempt = 0
    while True:
        # Add salt to avoid collisions
        salted_url = f"{long_url}_{attempt}"
        short_key = hashlib.md5(salted_url.encode()).hexdigest()[:7]

        # Check if key exists
        if not db.exists(short_key):
            return short_key

        attempt += 1

    # Worst case: may need multiple attempts
```

**When to use:**
- Same URL should always map to same short URL
- Duplicate detection is important
- Can tolerate occasional collision checks

---

#### Option 2: Base62 Encoding of Auto-Increment ID

```python
BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def encode_base62(num):
    if num == 0:
        return BASE62[0]

    result = []
    while num > 0:
        remainder = num % 62
        result.append(BASE62[remainder])
        num //= 62

    return ''.join(reversed(result))

def decode_base62(short_key):
    num = 0
    for char in short_key:
        num = num * 62 + BASE62.index(char)
    return num

# Example:
id = 12345678
short_key = encode_base62(id)
# Result: "KSH2" (4 chars)

# Capacity:
# 6 chars: 62^6 = 56 billion URLs
# 7 chars: 62^7 = 3.5 trillion URLs
```

**Pros:**
- ✅ **Guaranteed unique** (auto-increment IDs are unique)
- ✅ **No collisions** (one-to-one mapping)
- ✅ Predictable URL length
- ✅ Can decode short key → ID (no DB lookup)
- ✅ Shorter URLs than hash (4-6 chars vs 7 chars)

**Cons:**
- ❌ **Predictable URLs** (security concern: abc123 → try abc124)
- ❌ Reveals number of URLs created (competitive intel)
- ❌ Same long URL → different short URLs (duplicates)
- ❌ Single point of failure (need distributed ID generator)

**Constraints:**
- Need globally unique IDs across multiple servers
- Auto-increment won't work in distributed system

**Solution: Use database sequence or distributed ID generator (Snowflake)**

---

#### Option 3: Pre-generated Key Range (Recommended for Scale) ⭐

```
┌──────────────────────────────────────┐
│    Key Generation Service (KGS)      │
│                                      │
│  Pre-generates millions of keys      │
│  Stores in database                  │
│  Hands out unused keys to API        │
└──────────────────────────────────────┘
         │
         │ Request 1000 keys
         ▼
┌──────────────────────────────────────┐
│         API Server 1                 │
│  In-memory key pool: [abc123, def456,│
│                       ghi789, ...]   │
└──────────────────────────────────────┘
```

**Implementation:**

```python
# Key Generation Service (KGS)
class KeyGenerationService:
    def __init__(self):
        self.db = connect_to_db()

    def generate_keys(self, count=1000000):
        keys = []
        for _ in range(count):
            key = self.generate_random_key(length=7)
            keys.append(key)

        # Store in database
        self.db.execute("""
            INSERT INTO unused_keys (short_key, created_at)
            VALUES (?, ?)
        """, keys)

    def generate_random_key(self, length=7):
        import random
        return ''.join(random.choice(BASE62) for _ in range(length))

    def get_keys(self, count=1000):
        # Get batch of unused keys
        keys = self.db.execute("""
            SELECT short_key FROM unused_keys
            LIMIT ?
        """, count)

        # Mark as used
        self.db.execute("""
            DELETE FROM unused_keys
            WHERE short_key IN (?)
        """, keys)

        return keys

# API Server
class URLShortener:
    def __init__(self):
        self.key_pool = []
        self.refill_threshold = 100

    def shorten_url(self, long_url):
        # Refill key pool if low
        if len(self.key_pool) < self.refill_threshold:
            self.key_pool.extend(kgs.get_keys(1000))

        # Pop a key from pool
        short_key = self.key_pool.pop()

        # Store mapping
        db.execute("""
            INSERT INTO urls (short_key, long_url, created_at)
            VALUES (?, ?, NOW())
        """, short_key, long_url)

        return f"https://bit.ly/{short_key}"
```

**Pros:**
- ✅ **Guaranteed unique** (keys pre-generated and marked as used)
- ✅ **No collisions** (keys removed from pool after use)
- ✅ **Fast generation** (no DB check during shortening)
- ✅ **Random keys** (unpredictable, more secure)
- ✅ **Distributed-friendly** (each server has its own key pool)

**Cons:**
- ❌ Additional service to maintain (KGS)
- ❌ Wasted keys if server crashes (keys in memory pool lost)
- ❌ Need to pre-generate keys (background job)

**When to use:**
- High scale (millions of URLs/day)
- Security important (unpredictable URLs)
- Need distributed generation without coordination

**This is the recommended approach for production at scale.**

---

### Comparison Table

| Approach | Uniqueness | Performance | Predictable | Duplicates | Scalability |
|----------|------------|-------------|-------------|------------|-------------|
| Hash | ❌ (collisions) | ✅ Fast | ✅ Same URL → same key | ✅ Detected | ⚠️ Need collision check |
| Base62 ID | ✅ Unique | ✅ Very fast | ❌ Sequential | ❌ Same URL → diff keys | ⚠️ Need distributed ID |
| Pre-generated | ✅ Unique | ✅ Fastest | ❌ Random | ❌ Same URL → diff keys | ✅ Excellent |

**Recommendation for Interview:**
- **Start with Base62 encoding** (simple, easy to explain)
- **Mention pre-generated keys** as optimization for scale
- **Discuss trade-offs** of each approach

---

### Decision 2: Cache Layer is Critical

**Why?**
- 100:1 read/write ratio
- Same popular URLs accessed frequently
- Redirect latency must be < 100ms

**Without Cache:**
```
Every redirect → Database query
- Latency: 50-100ms
- Database load: 3,900 QPS (manageable but suboptimal)
```

**With Redis Cache:**
```python
def redirect(short_key):
    # 1. Check cache first
    cache_key = f"url:{short_key}"
    long_url = redis.get(cache_key)

    if long_url:
        # Cache hit (90% of requests)
        increment_click_count_async(short_key)
        return redirect_response(long_url)

    # 2. Cache miss - query database
    result = db.execute("""
        SELECT long_url FROM urls WHERE short_key = ?
    """, short_key)

    if not result:
        return 404_not_found()

    long_url = result['long_url']

    # 3. Store in cache (1 hour TTL)
    redis.setex(cache_key, 3600, long_url)

    # 4. Async analytics
    increment_click_count_async(short_key)

    return redirect_response(long_url)
```

**Performance Impact:**
```
Cache hit rate: 90% (popular URLs cached)

Without cache:
- Average latency: 50ms (database)

With cache:
- Cache hit: 1ms (Redis)
- Cache miss: 51ms (1ms Redis + 50ms DB)
- Average: 0.9 × 1ms + 0.1 × 51ms = 6ms
- 8x faster!
```

**Pros:**
- ✅ 8x latency improvement
- ✅ 90% reduction in database load
- ✅ Can handle traffic spikes

**Cons:**
- ❌ Additional infrastructure (Redis)
- ❌ Cache invalidation if URL updated (rare)
- ❌ Memory cost (but small: 3,900 QPS × 100 bytes = 390KB/sec)

**This is essential for meeting < 100ms latency requirement.**

---

### Decision 3: Async Analytics Collection

**Why?**
- Don't slow down redirect for analytics
- Click tracking can tolerate eventual consistency
- 10B clicks/month = high write volume

**Synchronous (BAD):**
```python
def redirect(short_key):
    long_url = get_long_url(short_key)

    # This slows down redirect!
    db.execute("""
        INSERT INTO analytics (short_key, timestamp, ip, user_agent, referrer)
        VALUES (?, ?, ?, ?, ?)
    """, short_key, now(), request.ip, request.user_agent, request.referrer)

    return redirect_response(long_url)
    # Total latency: ~60ms (cache) + 10ms (analytics write) = 70ms
```

**Asynchronous (GOOD):**
```python
def redirect(short_key):
    long_url = get_long_url(short_key)  # 1ms (cache hit)

    # Publish to queue (non-blocking, < 1ms)
    kafka.publish('analytics', {
        'short_key': short_key,
        'timestamp': now(),
        'ip': request.ip,
        'user_agent': request.user_agent,
        'referrer': request.referrer
    })

    return redirect_response(long_url)
    # Total latency: ~2ms (much faster!)

# Background worker
def analytics_worker():
    while True:
        event = kafka.consume('analytics')
        db.execute("INSERT INTO analytics ...")
        update_click_count(event['short_key'])
```

**Pros:**
- ✅ Redirect latency: 2ms vs 70ms (35x faster!)
- ✅ Decouple redirect from analytics
- ✅ Can batch analytics writes (efficiency)
- ✅ Analytics failures don't affect redirects

**Cons:**
- ❌ Click counts not immediately accurate (eventual consistency)
- ❌ Need message queue infrastructure
- ❌ More complex error handling

**Constraints that drive this:**
- Latency requirement: < 100ms (need every ms we can get)
- High analytics volume: 3,900 writes/sec
- Analytics less critical than redirect (eventual consistency ok)

## Database Design

### Option 1: PostgreSQL (Relational)

```sql
CREATE TABLE urls (
  id BIGSERIAL PRIMARY KEY,
  short_key VARCHAR(10) UNIQUE NOT NULL,
  long_url TEXT NOT NULL,
  user_id BIGINT,  -- Optional: if users can manage URLs
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,  -- Optional: TTL feature
  click_count BIGINT DEFAULT 0,

  INDEX idx_short_key (short_key),  -- Most important index!
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
);

CREATE TABLE analytics (
  id BIGSERIAL PRIMARY KEY,
  short_key VARCHAR(10) NOT NULL,
  clicked_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(2),  -- Derived from IP
  device_type VARCHAR(20),  -- 'mobile', 'desktop', 'tablet'

  INDEX idx_short_key (short_key),
  INDEX idx_clicked_at (clicked_at),

  FOREIGN KEY (short_key) REFERENCES urls(short_key) ON DELETE CASCADE
);
```

**Pros:**
- ✅ ACID transactions
- ✅ Complex queries for analytics
- ✅ Familiar and well-understood
- ✅ Good for moderate scale (< 100M URLs)

**Cons:**
- ❌ Vertical scaling limits
- ❌ Analytics table grows large (needs partitioning)

---

### Option 2: DynamoDB (NoSQL, Recommended for Scale)

```python
# URLs table
{
  "short_key": "abc123",  # Partition key
  "long_url": "https://www.example.com/long/url",
  "created_at": 1640000000,
  "expires_at": 1650000000,  # TTL
  "click_count": 42,
  "user_id": "user_456"
}

# Analytics table (time-series data)
{
  "short_key": "abc123",  # Partition key
  "clicked_at": 1640000000,  # Sort key
  "ip": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "referrer": "https://twitter.com",
  "country": "US",
  "device": "mobile"
}
```

**Pros:**
- ✅ Scales horizontally (no limits)
- ✅ Single-digit ms latency (perfect for redirects)
- ✅ TTL built-in (auto-delete expired URLs)
- ✅ No server management

**Cons:**
- ❌ Limited query patterns (need indexes)
- ❌ Analytics queries more complex

**Recommended for production at scale.**

## API Design

```
POST /api/v1/shorten
Authorization: Bearer <token> (optional)
Request:
{
  "long_url": "https://www.example.com/very/long/url/path",
  "custom_key": "mylink",  // Optional
  "expires_at": "2025-12-31T23:59:59Z"  // Optional
}
Response:
{
  "short_url": "https://bit.ly/abc123",
  "short_key": "abc123",
  "long_url": "https://www.example.com/very/long/url/path",
  "created_at": "2024-01-01T12:00:00Z",
  "expires_at": "2025-12-31T23:59:59Z"
}

GET /{short_key}
Response: 302 Redirect to long_url
Location: https://www.example.com/very/long/url/path

GET /api/v1/analytics/{short_key}
Authorization: Bearer <token>
Response:
{
  "short_key": "abc123",
  "long_url": "https://www.example.com/very/long/url/path",
  "total_clicks": 1523,
  "clicks_by_day": [
    {"date": "2024-01-01", "clicks": 42},
    {"date": "2024-01-02", "clicks": 38}
  ],
  "top_referrers": [
    {"referrer": "twitter.com", "clicks": 345},
    {"referrer": "facebook.com", "clicks": 234}
  ],
  "top_countries": [
    {"country": "US", "clicks": 456},
    {"country": "UK", "clicks": 234}
  ],
  "devices": {
    "mobile": 800,
    "desktop": 500,
    "tablet": 223
  }
}

DELETE /api/v1/urls/{short_key}
Authorization: Bearer <token>
```

## Deep Dive: Custom URLs

**Challenge:** User wants `bit.ly/mycompany` instead of `bit.ly/abc123`

**Constraints:**
- Custom keys must be unique
- Check availability before creating
- Prevent abuse (no profanity, no impersonation)

```python
def create_custom_short_url(long_url, custom_key):
    # 1. Validate custom key
    if not is_valid_custom_key(custom_key):
        return error("Invalid custom key")

    # 2. Check if available (with locking to prevent race condition)
    with db.transaction():
        exists = db.execute("""
            SELECT 1 FROM urls WHERE short_key = ? FOR UPDATE
        """, custom_key)

        if exists:
            return error("Custom key already taken")

        # 3. Create URL
        db.execute("""
            INSERT INTO urls (short_key, long_url, custom, created_at)
            VALUES (?, ?, true, NOW())
        """, custom_key, long_url)

    return success(f"https://bit.ly/{custom_key}")

def is_valid_custom_key(key):
    # Length: 3-20 characters
    if len(key) < 3 or len(key) > 20:
        return False

    # Only alphanumeric and hyphens
    if not re.match(r'^[a-zA-Z0-9-]+$', key):
        return False

    # Check against blacklist
    if key.lower() in BLACKLIST:
        return False

    return True
```

## Scaling Strategies

### 1. Read Replicas for Analytics

```
Master (Writes) ← All URL creation
  │
  ├─→ Replica 1 (Reads) ← Analytics queries
  ├─→ Replica 2 (Reads) ← Analytics queries
  └─→ Replica 3 (Reads) ← Analytics queries
```

**Why?**
- Analytics queries are complex and slow
- Separate analytics reads from redirect reads
- Redirects read from cache (not DB)
- Analytics need to scan large dataset

### 2. Partition Analytics Table by Time

```sql
-- Monthly partitions
CREATE TABLE analytics_2024_01 PARTITION OF analytics
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE analytics_2024_02 PARTITION OF analytics
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Archive old partitions to S3
-- Drop very old partitions
```

**Pros:**
- ✅ Faster queries (scan only relevant partition)
- ✅ Easy to archive old data
- ✅ Can drop old partitions to save space

## Security Considerations

1. **Rate Limiting:** Max 100 URL shortenings/hour per IP
2. **Malicious URL Detection:** Check against blacklists
3. **Prevent Abuse:** CAPTCHA for public API
4. **Access Control:** Users can only delete their own URLs
5. **DDoS Protection:** CloudFlare + rate limiting

## Monitoring

```
Performance:
- Redirect latency: p50 < 10ms, p99 < 100ms
- Shorten latency: p50 < 50ms, p99 < 200ms
- Cache hit rate: 90%+

Availability:
- Uptime: 99.99%
- Error rate: < 0.01%

Business:
- URLs created/day
- Redirects/day
- Top URLs by clicks
```

## Interview Talking Points

**"The key decision is how to generate short keys"**
- "I'd use Base62 encoding of auto-increment IDs for simplicity"
- "For scale, pre-generated key pool is more robust"
- "Trade-off: predictable vs random, duplicates vs unique"

**"Cache is essential for meeting latency requirements"**
- "90% cache hit rate → 8x latency improvement"
- "Popular URLs served from Redis (< 1ms)"
- "Cache hit rate directly impacts user experience"

**"Async analytics keeps redirects fast"**
- "Decouple redirect from analytics write"
- "Analytics can tolerate eventual consistency"
- "Redirect latency must be < 100ms"

