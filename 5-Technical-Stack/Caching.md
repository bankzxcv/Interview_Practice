# Caching Cheatsheet - Quick Reference

Comprehensive caching strategies, Redis, Memcached, and distributed caching patterns.

---

## Table of Contents

1. [Caching Strategies](#caching-strategies)
2. [Cache Invalidation](#cache-invalidation)
3. [Redis for Caching](#redis-for-caching)
4. [Memcached](#memcached)
5. [Application-Level Caching](#application-level-caching)
6. [CDN Caching](#cdn-caching)

---

## Caching Strategies

### Cache-Aside (Lazy Loading)

```
READ:
1. Check cache
2. If cache hit: return data
3. If cache miss:
   - Read from database
   - Write to cache
   - Return data

┌──────────┐    1. Get key     ┌───────┐
│   App    │ ───────────────> │ Cache │
└────┬─────┘    2. Miss        └───────┘
     │ 3. Read from DB
     ▼
┌──────────┐
│ Database │
└────┬─────┘
     │ 4. Write to cache
     ▼
┌───────┐
│ Cache │
└───────┘

PROS:
✓ Only requested data is cached
✓ Cache failure doesn't break app
✓ Good for read-heavy workloads

CONS:
✗ First request is slow (cache miss)
✗ Stale data possible
✗ Cache/DB can be inconsistent
```

```python
# Python example
def get_user(user_id):
    # Try cache first
    user = cache.get(f"user:{user_id}")
    if user:
        return user

    # Cache miss - read from DB
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)

    # Update cache
    cache.set(f"user:{user_id}", user, ttl=3600)

    return user
```

### Write-Through Cache

```
WRITE:
1. Write to cache
2. Cache writes to database
3. Return success

┌──────────┐  1. Write  ┌───────┐  2. Write  ┌──────────┐
│   App    │ ────────> │ Cache │ ─────────> │ Database │
└──────────┘            └───────┘            └──────────┘

PROS:
✓ Cache always consistent with DB
✓ No stale data
✓ Good for write-heavy workloads

CONS:
✗ Higher write latency (2 writes)
✗ Cache may fill with unused data
✗ Cache failure breaks writes
```

```python
def update_user(user_id, data):
    # Write to cache first
    cache.set(f"user:{user_id}", data)

    # Cache writes through to DB
    db.query("UPDATE users SET ... WHERE id = ?", user_id)
```

### Write-Behind (Write-Back) Cache

```
WRITE:
1. Write to cache
2. Return success immediately
3. Cache asynchronously writes to DB

┌──────────┐  1. Write  ┌───────┐
│   App    │ ────────> │ Cache │
└──────────┘  2. Success└───┬───┘
                           │ 3. Async write
                           ▼
                      ┌──────────┐
                      │ Database │
                      └──────────┘

PROS:
✓ Fast writes (async)
✓ Batching possible
✓ Reduces DB load

CONS:
✗ Data loss risk if cache fails
✗ Complexity
✗ Eventual consistency
```

### Read-Through Cache

```
READ:
1. App requests from cache
2. Cache loads from DB if miss
3. Cache returns data

┌──────────┐   1. Read    ┌───────┐
│   App    │ ──────────> │ Cache │
└──────────┘              └───┬───┘
                              │ 2. If miss, read from DB
                              ▼
                         ┌──────────┐
                         │ Database │
                         └──────────┘

PROS:
✓ App logic simplified
✓ Automatic cache population

CONS:
✗ First access is slow
✗ Requires cache library support
```

### Refresh-Ahead

```
PATTERN:
1. Predict items that will be accessed soon
2. Refresh cache proactively before expiry

PROS:
✓ Reduced latency
✓ No cold cache

CONS:
✗ Difficult to predict correctly
✗ Wasted resources if prediction wrong
```

---

## Cache Invalidation

> "There are only two hard things in Computer Science: cache invalidation and naming things." - Phil Karlton

### Time-To-Live (TTL)

```javascript
// Set with expiry
cache.set('key', value, { ttl: 3600 });  // 1 hour

// Good for:
// - Slowly changing data
// - Acceptable staleness
// - Simple implementation

// Cons:
// - May serve stale data
// - May evict before needed
```

### Event-Based Invalidation

```python
# Invalidate when data changes
def update_user(user_id, data):
    db.update(user_id, data)
    cache.delete(f"user:{user_id}")
    cache.delete(f"user_list")  # Invalidate related caches

# Good for:
# - Strong consistency needs
# - Predictable access patterns

# Cons:
# - Cascading invalidations
# - Complex dependencies
```

### Cache Stampede Prevention

```python
# Problem: Many requests fetch same data simultaneously after cache miss

# Solution 1: Lock-based
def get_with_lock(key):
    data = cache.get(key)
    if data:
        return data

    # Try to acquire lock
    if cache.setnx(f"lock:{key}", 1, ttl=10):
        try:
            # Fetch from DB
            data = fetch_from_db(key)
            cache.set(key, data, ttl=3600)
            return data
        finally:
            cache.delete(f"lock:{key}")
    else:
        # Wait for other request to populate cache
        time.sleep(0.1)
        return get_with_lock(key)

# Solution 2: Probabilistic early expiration
def get_with_early_expiration(key):
    data, expiry = cache.get_with_expiry(key)
    if not data:
        return fetch_and_cache(key)

    # Refresh if close to expiry (with probability)
    time_to_expiry = expiry - time.now()
    if time_to_expiry < 0.1 * TTL and random() < 0.1:
        # Asynchronously refresh
        asyncio.create_task(fetch_and_cache(key))

    return data
```

---

## Redis for Caching

```python
import redis

# Connect
r = redis.Redis(host='localhost', port=6379, db=0)

# Basic operations
r.set('key', 'value')
r.set('key', 'value', ex=3600)  # With TTL
value = r.get('key')
r.delete('key')
exists = r.exists('key')

# Cache object (serialize)
import json
user = {'id': 1, 'name': 'John'}
r.set('user:1', json.dumps(user), ex=3600)
user = json.loads(r.get('user:1'))

# Multiple keys
r.mset({'key1': 'val1', 'key2': 'val2'})
values = r.mget(['key1', 'key2'])

# Increment/Decrement
r.incr('counter')
r.incrby('counter', 5)
r.decr('counter')

# Hash for objects (more efficient than JSON)
r.hset('user:1', mapping={'name': 'John', 'age': 30})
r.hget('user:1', 'name')
r.hgetall('user:1')
r.hincrby('user:1', 'age', 1)

# Lists (for queues, recent items)
r.lpush('recent_items', 'item1')
r.lpush('recent_items', 'item2')
r.lrange('recent_items', 0, 9)  # Get 10 most recent
r.ltrim('recent_items', 0, 99)  # Keep only 100

# Sorted Sets (for leaderboards, rankings)
r.zadd('leaderboard', {'user1': 100, 'user2': 200})
r.zrevrange('leaderboard', 0, 9, withscores=True)  # Top 10
r.zincrby('leaderboard', 10, 'user1')

# Pipelines (batch operations)
pipe = r.pipeline()
pipe.set('key1', 'val1')
pipe.set('key2', 'val2')
pipe.incr('counter')
pipe.execute()

# Pub/Sub (cache invalidation across instances)
# Subscriber
pubsub = r.pubsub()
pubsub.subscribe('cache_invalidation')
for message in pubsub.listen():
    if message['type'] == 'message':
        key = message['data']
        local_cache.delete(key)

# Publisher
r.publish('cache_invalidation', 'user:1')

# Lua scripts (atomic operations)
lua_script = """
local current = redis.call('get', KEYS[1])
if current == false then
    redis.call('set', KEYS[1], ARGV[1], 'EX', ARGV[2])
    return 1
else
    return 0
end
"""
script = r.register_script(lua_script)
script(keys=['key'], args=['value', 3600])
```

### Redis Cache Patterns

```python
# 1. Session storage
def save_session(session_id, data, ttl=1800):
    r.setex(f"session:{session_id}", ttl, json.dumps(data))

def get_session(session_id):
    data = r.get(f"session:{session_id}")
    return json.loads(data) if data else None

# 2. Rate limiting (sliding window)
def is_rate_limited(user_id, limit=100, window=60):
    key = f"rate_limit:{user_id}"
    now = time.time()

    pipe = r.pipeline()
    pipe.zadd(key, {now: now})
    pipe.zremrangebyscore(key, 0, now - window)
    pipe.zcard(key)
    pipe.expire(key, window)
    results = pipe.execute()

    request_count = results[2]
    return request_count > limit

# 3. Distributed lock (Redlock)
def acquire_lock(resource, ttl=10):
    identifier = str(uuid.uuid4())
    if r.set(f"lock:{resource}", identifier, nx=True, ex=ttl):
        return identifier
    return None

def release_lock(resource, identifier):
    script = """
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
    else
        return 0
    end
    """
    return r.eval(script, 1, f"lock:{resource}", identifier)

# 4. Caching with tags (group invalidation)
def cache_with_tags(key, value, tags, ttl=3600):
    pipe = r.pipeline()
    pipe.setex(key, ttl, value)
    for tag in tags:
        pipe.sadd(f"tag:{tag}", key)
        pipe.expire(f"tag:{tag}", ttl)
    pipe.execute()

def invalidate_by_tag(tag):
    keys = r.smembers(f"tag:{tag}")
    if keys:
        r.delete(*keys)
        r.delete(f"tag:{tag}")
```

---

## Memcached

```python
import memcache

# Connect
mc = memcache.Client(['127.0.0.1:11211'])

# Basic operations
mc.set('key', 'value')
mc.set('key', 'value', time=3600)  # TTL
value = mc.get('key')
mc.delete('key')

# Multiple keys
mc.set_multi({'key1': 'val1', 'key2': 'val2'})
values = mc.get_multi(['key1', 'key2'])

# Increment/Decrement
mc.incr('counter')
mc.decr('counter')

# Compare and Swap (optimistic locking)
mc.set('key', 'value')
value, cas = mc.gets('key')  # Get with CAS token
success = mc.cas('key', 'new_value', cas)  # Only succeeds if not modified

# Consistent hashing (multiple servers)
mc = memcache.Client([
    '192.168.1.1:11211',
    '192.168.1.2:11211',
    '192.168.1.3:11211'
])
```

### Redis vs Memcached

```
┌─────────────────────────┬────────────────┬─────────────┐
│ Feature                 │ Redis          │ Memcached   │
├─────────────────────────┼────────────────┼─────────────┤
│ Data Types              │ Rich (12+)     │ Strings only│
│ Persistence             │ Yes            │ No          │
│ Replication             │ Yes            │ No          │
│ Transactions            │ Yes            │ No          │
│ Pub/Sub                 │ Yes            │ No          │
│ Lua Scripting           │ Yes            │ No          │
│ Multi-threading         │ No (single)    │ Yes         │
│ Memory Usage            │ Higher         │ Lower       │
│ Max Value Size          │ 512MB          │ 1MB         │
│ Use Case                │ General cache  │ Simple cache│
│                         │ Session store  │ High speed  │
│                         │ Message queue  │ Large scale │
└─────────────────────────┴────────────────┴─────────────┘

CHOOSE REDIS:
- Need data structures
- Need persistence
- Need pub/sub
- Complex caching logic

CHOOSE MEMCACHED:
- Simple key-value
- Pure speed
- Multi-core scaling
- Large horizontal scale
```

---

## Application-Level Caching

### In-Memory Caching (Single Instance)

```python
# Python LRU Cache
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_function(n):
    # Computed result cached
    return n * n

# Manual cache with TTL
from cachetools import TTLCache
cache = TTLCache(maxsize=100, ttl=300)

def get_user(user_id):
    if user_id in cache:
        return cache[user_id]

    user = db.get_user(user_id)
    cache[user_id] = user
    return user
```

```javascript
// Node.js in-memory cache
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 });

function getUser(userId) {
    let user = cache.get(userId);
    if (user == undefined) {
        user = await db.getUser(userId);
        cache.set(userId, user);
    }
    return user;
}
```

### Multi-Layer Caching

```
┌────────────────────────────────────────┐
│           Application                  │
│  ┌──────────────────────────────┐     │
│  │   L1: In-Memory Cache        │     │
│  │   (100ms expiry)             │     │
│  └───────────┬──────────────────┘     │
└──────────────┼────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│   L2: Redis/Memcached (10min expiry)   │
└───────────────┬────────────────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│   L3: Database                         │
└────────────────────────────────────────┘

BENEFITS:
- Reduced network calls
- Lower latency
- Scalability

CONSIDERATIONS:
- Cache coherence
- Memory usage
- Complexity
```

```python
class MultiLevelCache:
    def __init__(self):
        self.l1_cache = {}  # In-memory
        self.redis = redis.Redis()

    def get(self, key):
        # Try L1 first
        if key in self.l1_cache:
            return self.l1_cache[key]

        # Try L2 (Redis)
        value = self.redis.get(key)
        if value:
            # Populate L1
            self.l1_cache[key] = value
            return value

        # Cache miss - fetch from DB
        value = db.get(key)

        # Populate both caches
        self.l1_cache[key] = value
        self.redis.setex(key, 600, value)

        return value
```

---

## CDN Caching

```
CDN EDGE LOCATIONS:

User (LA) ────> CDN Edge (LA) ────> Origin (NY)
                     ↑
                   Cache
                  (images, static files)

CACHE-CONTROL HEADERS:

Cache-Control: public, max-age=31536000
- Cacheable by anyone
- Cache for 1 year

Cache-Control: private, max-age=3600
- Cacheable by browser only
- Cache for 1 hour

Cache-Control: no-cache
- Must revalidate with server

Cache-Control: no-store
- Never cache

ETAG / If-None-Match:
1. Client requests /image.jpg
2. Server responds with ETag: "abc123"
3. Client caches with ETag
4. Client requests again with If-None-Match: "abc123"
5. Server responds 304 Not Modified (if unchanged)

CACHE PURGING:
- Soft purge: Mark as stale, serve while revalidating
- Hard purge: Remove immediately
- Tag-based purge: Invalidate by tag/group

CDN PROVIDERS:
- Cloudflare
- AWS CloudFront
- Fastly
- Akamai
```

```javascript
// Set cache headers
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
res.setHeader('ETag', generateETag(content));

// Check ETag
if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
} else {
    res.send(content);
}
```

---

**Last updated:** 2025-11-15
