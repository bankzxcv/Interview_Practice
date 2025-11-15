# Backend Design

## Table of Contents
1. [Design a REST API for a Social Media App](#1-design-a-rest-api-for-a-social-media-app)
2. [Design a Rate Limiter](#2-design-a-rate-limiter)
3. [Design a Caching System](#3-design-a-caching-system)
4. [Design a Job Queue System](#4-design-a-job-queue-system)
5. [Design an Authentication System](#5-design-an-authentication-system)
6. [Design a URL Shortener Backend](#6-design-a-url-shortener-backend)
7. [Design a Distributed Lock Service](#7-design-a-distributed-lock-service)
8. [Design a News Feed Ranking System](#8-design-a-news-feed-ranking-system)
9. [Design a Notification Service](#9-design-a-notification-service)
10. [Design a Search Autocomplete Backend](#10-design-a-search-autocomplete-backend)
11. [Design a Metrics Collection System](#11-design-a-metrics-collection-system)
12. [Design a File Upload Service](#12-design-a-file-upload-service)
13. [Design a Distributed Task Scheduler](#13-design-a-distributed-task-scheduler)
14. [Design an API Gateway](#14-design-an-api-gateway)
15. [Design a Webhook System](#15-design-a-webhook-system)

---

## 1. Design a REST API for a Social Media App

### Requirements Clarification
- **Q**: What features do we need? (posts, comments, likes, follows, timeline)
- **Q**: Scale expectations? (100K users? 100M users?)
- **Q**: Real-time or eventually consistent?
- **Q**: Mobile, web, or both?

**Assumptions**:
- 10M users, 1M DAU
- Features: posts, comments, likes, follows, timeline
- Mobile + Web clients

### Numerical Computations

```
Users & Traffic:
- 10M total users, 1M DAU
- Each user: 5 API calls/session, 2 sessions/day = 10 calls/day
- Total: 1M * 10 = 10M requests/day
- QPS: 10M / 86,400 = ~115 req/sec
- Peak QPS: 115 * 3 = ~350 req/sec

Storage:
- Posts: 1M users * 2 posts/month * 1KB = 2GB/month
- Comments: 5M comments/month * 500 bytes = 2.5GB/month
- User data: 10M * 2KB = 20GB
- Total (1 year): ~50GB (manageable with single DB)

Bandwidth:
- Average request: 2KB
- Average response: 5KB
- Ingress: 115 req/s * 2KB = 230KB/s
- Egress: 115 req/s * 5KB = 575KB/s
```

### API Design

```
Authentication:
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh

Users:
GET    /api/v1/users/{user_id}
PUT    /api/v1/users/{user_id}
GET    /api/v1/users/{user_id}/followers
GET    /api/v1/users/{user_id}/following
POST   /api/v1/users/{user_id}/follow
DELETE /api/v1/users/{user_id}/follow

Posts:
GET    /api/v1/posts/{post_id}
POST   /api/v1/posts
PUT    /api/v1/posts/{post_id}
DELETE /api/v1/posts/{post_id}
GET    /api/v1/posts?user_id={user_id}&limit=20&cursor={cursor}

Timeline:
GET    /api/v1/timeline/home?limit=20&cursor={cursor}
GET    /api/v1/timeline/user/{user_id}?limit=20&cursor={cursor}

Likes:
POST   /api/v1/posts/{post_id}/like
DELETE /api/v1/posts/{post_id}/like
GET    /api/v1/posts/{post_id}/likes?limit=100

Comments:
POST   /api/v1/posts/{post_id}/comments
GET    /api/v1/posts/{post_id}/comments?limit=20&cursor={cursor}
DELETE /api/v1/comments/{comment_id}
```

**API Design Principles**:
- Use nouns for resources, not verbs
- HTTP methods for actions (GET/POST/PUT/DELETE)
- Versioning: `/api/v1/` for backward compatibility
- Pagination: cursor-based for consistency
- Filtering: query parameters

### Database Schema

**Approach 1: SQL (PostgreSQL)**

```sql
users
├── id (PK, UUID)
├── username (UNIQUE)
├── email (UNIQUE)
├── password_hash
├── bio
├── created_at
├── updated_at
└── INDEX(username), INDEX(email)

posts
├── id (PK, UUID)
├── user_id (FK -> users.id)
├── content (TEXT)
├── media_urls (JSONB)
├── like_count
├── comment_count
├── created_at
├── updated_at
└── INDEX(user_id, created_at), INDEX(created_at)

follows
├── follower_id (FK -> users.id)
├── followee_id (FK -> users.id)
├── created_at
└── PRIMARY KEY(follower_id, followee_id)
   INDEX(follower_id), INDEX(followee_id)

likes
├── user_id (FK -> users.id)
├── post_id (FK -> posts.id)
├── created_at
└── PRIMARY KEY(user_id, post_id)
   INDEX(post_id, created_at)

comments
├── id (PK, UUID)
├── post_id (FK -> posts.id)
├── user_id (FK -> users.id)
├── content (TEXT)
├── created_at
└── INDEX(post_id, created_at)
```

**Pros**:
- ACID guarantees
- Complex queries (joins)
- Data integrity (foreign keys)
- Mature ecosystem

**Cons**:
- Harder to scale horizontally
- Schema changes expensive
- Join performance degrades at scale

**Approach 2: NoSQL (MongoDB)**

```javascript
users: {
  _id: ObjectId,
  username: String (indexed),
  email: String (indexed),
  password_hash: String,
  bio: String,
  followers_count: Number,
  following_count: Number,
  created_at: Date
}

posts: {
  _id: ObjectId,
  user_id: ObjectId (indexed),
  user_info: { username, avatar }, // denormalized
  content: String,
  media_urls: [String],
  like_count: Number,
  comment_count: Number,
  created_at: Date (indexed)
}

// Separate collection for relationships
follows: {
  _id: ObjectId,
  follower_id: ObjectId (indexed),
  followee_id: ObjectId (indexed),
  created_at: Date
}

// Store likes as array in posts or separate collection
likes: {
  post_id: ObjectId (indexed),
  user_id: ObjectId,
  created_at: Date
}
```

**Pros**:
- Flexible schema
- Horizontal scaling built-in
- Fast writes
- Document model matches objects

**Cons**:
- No joins (denormalize or multiple queries)
- Eventual consistency
- No foreign key constraints

**Recommendation**: Start with **PostgreSQL** for:
- Clear relationships (users, posts, follows)
- Need for data integrity
- Complex queries
- Scale is manageable (< 10M users)

### Multiple Solution Approaches

**Approach 1: Simple Monolith**
```
Client → Load Balancer → API Server (Node.js/Django) → PostgreSQL
                              ↓
                           Redis Cache
```

**Pros**:
- Simple to develop and deploy
- Low latency (no network hops)
- Easy debugging
- Strong consistency

**Cons**:
- Single point of failure
- Hard to scale independently
- Deployment requires full restart

**When**: MVP, < 1M users, single team

---

**Approach 2: Microservices**
```
Client → API Gateway → User Service → User DB
                    → Post Service → Post DB
                    → Timeline Service → Timeline DB
                    → Notification Service → Message Queue
```

**Pros**:
- Independent scaling (timeline service needs more resources)
- Independent deployment (update posts without touching users)
- Technology flexibility (use best tool per service)
- Fault isolation

**Cons**:
- Complex operations
- Network latency
- Distributed transactions hard
- Debugging harder

**When**: > 5M users, multiple teams, different scaling needs

---

**Approach 3: Hybrid (Modular Monolith)**
```
Single codebase with clear module boundaries
- User module
- Post module
- Timeline module

Can extract to microservices later
```

**Pros**:
- Simple deployment like monolith
- Clean architecture like microservices
- Easy to split later
- Good middle ground

**Cons**:
- Requires discipline
- Still shares resources

**When**: Growing startup, preparing for scale

### Bottlenecks and Solutions

**Bottleneck 1: Timeline Generation (N+1 Query Problem)**

**Problem**: To generate a timeline, we need:
1. Get list of users you follow
2. For each user, get their recent posts
3. Merge and sort by timestamp

```sql
-- This is slow!
SELECT followers FROM follows WHERE follower_id = ?
-- Then for each followee:
SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
```

**Solution 1: Fan-out on Write (Precompute)**
- When user posts, write to all followers' timelines
- Timeline read is simple: `SELECT * FROM timeline WHERE user_id = ? LIMIT 20`

**Pros**: Fast reads
**Cons**: Slow writes (if user has 1M followers), storage intensive
**When**: Most users have few followers (< 1000)

**Solution 2: Fan-out on Read (Compute on Request)**
- Read from multiple users and merge in-memory
- Use caching aggressively

**Pros**: Fast writes, less storage
**Cons**: Slow reads, complex queries
**When**: Users follow many people

**Solution 3: Hybrid**
- Fan-out on write for users with < 10K followers
- Fan-out on read for celebrities
- Merge results

**This is what Twitter uses!**

---

**Bottleneck 2: Hot Partition (Celebrity Problem)**

**Problem**: If Justin Bieber tweets:
- 100M followers need timeline updates
- Single database shard overwhelmed

**Solution**:
- Separate handling for power users
- Async processing via message queue
- Rate limit updates (not all 100M need instant update)
- Cache celebrity posts aggressively

---

**Bottleneck 3: Database Reads**

**Problem**: 80% reads, 20% writes → DB becomes bottleneck

**Solution**: Caching Strategy
```
Read Path:
1. Check Redis cache
2. If miss, query DB
3. Write to cache (TTL: 5 minutes)

Cache Keys:
- user:{user_id} → user object
- post:{post_id} → post object
- timeline:{user_id} → list of post IDs
- post_details:{post_id} → denormalized post with user info
```

**Cache Invalidation**:
- Update post → invalidate post:{post_id} and timeline of followers
- Update profile → invalidate user:{user_id}

### Technologies

**Backend Framework**:
- **Node.js + Express**: Fast, async I/O, JavaScript everywhere
- **Django + DRF**: Batteries included, admin panel, ORM
- **Spring Boot**: Enterprise-grade, type safety, mature
- **FastAPI**: Modern, async, auto-generated docs

**Database**:
- **PostgreSQL**: Primary choice (ACID, jsonb support)
- **MongoDB**: If need flexibility
- **MySQL**: Alternative to PostgreSQL

**Cache**:
- **Redis**: In-memory, pub/sub, data structures
- **Memcached**: Simple key-value, faster but less features

**Message Queue** (for async tasks):
- **RabbitMQ**: Flexible routing
- **Kafka**: High throughput, event log
- **AWS SQS**: Managed, simple

**Search** (for user/post search):
- **Elasticsearch**: Full-text search, analytics
- **Algolia**: Managed, fast

### Interview Talking Points

**"I would start by asking..."**
- What's the expected scale?
- What's more important: consistency or availability?
- Do we need real-time updates?

**"The key trade-off here is..."**
- Timeline: Read performance vs write performance (fan-out choice)
- Database: SQL (consistency) vs NoSQL (scale)
- Architecture: Monolith (simplicity) vs Microservices (scalability)

**"To handle scale, I would..."**
- Cache aggressively (Redis for hot data)
- Use CDN for static assets
- Implement pagination (cursor-based)
- Shard database by user_id if needed

**"For monitoring, I would track..."**
- API latency (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query time
- Cache hit rate
- QPS per endpoint

---

## 2. Design a Rate Limiter

### Requirements Clarification
- **Q**: Where to implement? (client, server, API gateway, middleware)
- **Q**: What to limit? (user, IP, API key)
- **Q**: Rules? (X requests per second/minute/hour)
- **Q**: Behavior when limit exceeded? (return 429, queue, drop)
- **Q**: Distributed system?

**Assumptions**:
- Server-side rate limiter
- Limit per user ID
- Different limits per API endpoint
- Distributed across multiple servers
- Return HTTP 429 when exceeded

### Numerical Computations

```
Scale:
- 100M users
- 1M active users per hour
- 10 req/sec per user max allowed

Storage (Fixed Window):
- Track count per user per window
- 1M users * (user_id: 8 bytes + count: 4 bytes) = 12MB
- Manageable in Redis

Storage (Sliding Window Log):
- Store timestamp per request
- 1M users * 10 req/sec * 60 sec = 600M entries
- 600M * 16 bytes (user_id + timestamp) = 9.6GB
- More expensive

Performance:
- Need to check limit on every request
- At 1M req/sec, need < 1ms overhead
- Redis GET/SET: ~0.1ms → acceptable
```

### Algorithm Approaches

**Approach 1: Fixed Window Counter**

```python
# Pseudocode
def is_allowed(user_id, limit):
    current_window = current_timestamp // window_size
    key = f"{user_id}:{current_window}"

    count = redis.get(key) or 0

    if count < limit:
        redis.incr(key)
        redis.expire(key, window_size)
        return True
    else:
        return False
```

**Pros**:
- Memory efficient (one counter per window)
- Fast O(1) operations
- Simple to implement

**Cons**:
- Burst at window boundaries
  - Example: 100 req at 10:00:59, 100 req at 10:01:00 = 200 req in 2 seconds!
- Not truly smooth rate limiting

**When**: Simple use cases, burst acceptable

---

**Approach 2: Sliding Window Log**

```python
def is_allowed(user_id, limit, window_ms):
    current_time = current_timestamp_ms()
    key = f"{user_id}:requests"

    # Remove old entries
    redis.zremrangebyscore(key, 0, current_time - window_ms)

    # Count requests in window
    count = redis.zcard(key)

    if count < limit:
        redis.zadd(key, current_time, f"{current_time}:{random_id}")
        redis.expire(key, window_ms // 1000)
        return True
    else:
        return False
```

**Pros**:
- Accurate rate limiting
- No burst issue
- True sliding window

**Cons**:
- Memory intensive (store every request)
- Slower (multiple Redis operations)

**When**: Strict rate limiting required, lower scale

---

**Approach 3: Sliding Window Counter (Hybrid)**

```python
def is_allowed(user_id, limit, window_size):
    current_time = current_timestamp()
    current_window = current_time // window_size
    previous_window = current_window - 1

    current_count = redis.get(f"{user_id}:{current_window}") or 0
    previous_count = redis.get(f"{user_id}:{previous_window}") or 0

    # Calculate position in current window (0.0 to 1.0)
    window_position = (current_time % window_size) / window_size

    # Weighted count
    estimated_count = (previous_count * (1 - window_position)) + current_count

    if estimated_count < limit:
        redis.incr(f"{user_id}:{current_window}")
        redis.expire(f"{user_id}:{current_window}", window_size * 2)
        return True
    else:
        return False
```

**Pros**:
- Memory efficient like fixed window
- Smooth like sliding window
- Good approximation

**Cons**:
- Not 100% accurate
- More complex

**When**: Best balance for most cases (recommended)

---

**Approach 4: Token Bucket**

```python
class TokenBucket:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity
        self.refill_rate = refill_rate  # tokens per second

    def is_allowed(self, user_id):
        # Get current state
        data = redis.hgetall(f"{user_id}:bucket")
        tokens = float(data.get('tokens', self.capacity))
        last_update = float(data.get('last_update', current_time()))

        # Refill tokens
        now = current_time()
        time_passed = now - last_update
        tokens = min(self.capacity, tokens + time_passed * self.refill_rate)

        if tokens >= 1:
            tokens -= 1
            redis.hset(f"{user_id}:bucket", {
                'tokens': tokens,
                'last_update': now
            })
            redis.expire(f"{user_id}:bucket", 3600)
            return True
        else:
            return False
```

**Pros**:
- Allows bursts up to capacity
- Smooth refill rate
- Flexible (can save unused capacity)

**Cons**:
- More complex state
- Requires atomic updates

**When**: Need burst allowance (e.g., API allows burst then throttle)

---

**Approach 5: Leaky Bucket**

Process requests at constant rate, queue excess.

```python
def is_allowed(user_id, rate):
    queue_key = f"{user_id}:queue"

    # Add to queue
    redis.rpush(queue_key, current_time())

    # Process at fixed rate
    # Background worker processes queue at 'rate' per second

    queue_size = redis.llen(queue_key)

    if queue_size > MAX_QUEUE_SIZE:
        return False  # Queue full, drop request
    else:
        return True  # Queued for processing
```

**Pros**:
- Smooths out traffic
- Constant processing rate

**Cons**:
- Adds latency (queuing)
- Complex to implement
- Needs background workers

**When**: Protecting slow downstream service

### API Design

```
Rate Limiter Service:

POST /api/v1/ratelimit/check
Request: {
  "user_id": "12345",
  "resource": "api.posts.create",
  "tokens": 1
}
Response: {
  "allowed": true,
  "remaining": 99,
  "reset_at": 1640000000,
  "retry_after": null
}

GET /api/v1/ratelimit/status/{user_id}/{resource}
Response: {
  "limit": 100,
  "remaining": 45,
  "reset_at": 1640000000
}
```

**Response Headers** (industry standard):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
Retry-After: 30 (if rate limited)
```

### Database Schema

**Redis Data Structures**:

```
Fixed Window:
Key: "ratelimit:user:12345:posts:1640000000"
Value: 45 (count)
TTL: window_size

Sliding Window Log:
Key: "ratelimit:user:12345:posts"
Value: Sorted Set {
  score: timestamp,
  member: request_id
}
TTL: window_size

Token Bucket:
Key: "ratelimit:bucket:12345:posts"
Value: Hash {
  tokens: 67.5,
  last_update: 1640000000.123
}
TTL: 3600

Configuration:
Key: "ratelimit:config:posts:create"
Value: Hash {
  limit: 100,
  window: 3600,
  algorithm: "sliding_window_counter"
}
```

### Architecture

**Single Server**:
```
┌─────────┐
│  Client │
└────┬────┘
     │
┌────▼────────────┐
│   API Server    │
│  ┌───────────┐  │
│  │Rate Limit │  │
│  │Middleware │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
    ┌────▼─────┐
    │  Redis   │
    └──────────┘
```

**Distributed System**:
```
┌─────────┐
│  Client │
└────┬────┘
     │
┌────▼────────────┐
│ Load Balancer   │
└────┬────────────┘
     │
  ┌──┴──┐
  │     │
┌─▼─┐ ┌─▼─┐
│API│ │API│
└─┬─┘ └─┬─┘
  │     │
  └──┬──┘
     │
┌────▼──────────┐
│  Redis Cluster│
│  (Sharded)    │
└───────────────┘
```

**Race Condition Solution**:
```lua
-- Redis Lua script (atomic)
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local current = redis.call('GET', key)
if current == false then
  redis.call('SET', key, 1, 'EX', window)
  return 1
end

if tonumber(current) < limit then
  redis.call('INCR', key)
  return tonumber(current) + 1
else
  return -1
end
```

### Bottlenecks and Solutions

**Bottleneck 1: Redis Single Point of Failure**

**Solution**:
- Redis Cluster for high availability
- Redis Sentinel for failover
- Fallback: Allow requests if Redis down (fail open)

```python
def is_allowed_safe(user_id):
    try:
        return is_allowed(user_id)
    except RedisConnectionError:
        logger.error("Redis down, allowing request")
        return True  # Fail open
```

---

**Bottleneck 2: Synchronization in Distributed System**

**Problem**: Multiple servers share same limits
- Server 1 sees count=50
- Server 2 sees count=50
- Both allow, total=102 (exceeded limit of 100)

**Solution 1: Centralized Redis** (used above)
- All servers check same Redis
- Atomic operations prevent race conditions

**Solution 2: Rate Limit Sharding**
- Shard users across Redis instances
- `user_id % num_redis_instances`

---

**Bottleneck 3: Redis Network Latency**

**Problem**: Every request requires Redis call (~1ms)

**Solution**:
- Local cache with lower limit
- Server 1: allows 25/sec locally
- Server 2: allows 25/sec locally
- Total: 50/sec (distributed limit)
- Reduces Redis calls by 90%

### Technologies

**Storage**:
- **Redis**: In-memory, fast, built-in expiry
- **Memcached**: Alternative, simpler
- **DynamoDB**: Managed, no ops

**Framework Integration**:
- **express-rate-limit** (Node.js)
- **django-ratelimit** (Python)
- **rack-attack** (Ruby)

**Managed Solutions**:
- **AWS API Gateway**: Built-in rate limiting
- **Kong**: API gateway with rate limiting
- **Nginx**: ngx_http_limit_req_module

### Interview Talking Points

**"I would start by clarifying..."**
- What's the SLA for rate limiting accuracy? (100% vs 95%)
- Can we have bursts?
- What happens when exceeded? (drop, queue, return error)

**"The key trade-off is..."**
- **Accuracy vs Memory**: Fixed window (memory efficient) vs Sliding log (accurate)
- **Complexity vs Performance**: Simple counter (fast) vs Token bucket (flexible)
- **Fail open vs Fail closed**: If Redis down, allow all (availability) or deny all (security)

**"For distributed systems, I would..."**
- Use Redis Cluster for scalability
- Use Lua scripts for atomic operations
- Implement local caching to reduce Redis calls
- Add monitoring for rate limit hits

**"I would measure..."**
- Rate limit hit rate (% of requests denied)
- Redis latency (p99)
- False positives (legitimate users blocked)
- System throughput with/without rate limiting

---

## 3. Design a Caching System

### Requirements Clarification
- **Q**: What to cache? (API responses, database queries, computed results)
- **Q**: Cache size limit?
- **Q**: Eviction policy? (LRU, LFU, TTL)
- **Q**: Single server or distributed?
- **Q**: Consistency requirements? (strong, eventual)
- **Q**: Read/write ratio?

**Assumptions**:
- Cache API responses and DB queries
- 10GB cache size limit
- LRU eviction policy
- Distributed system (multiple app servers)
- Eventual consistency acceptable
- Read-heavy (95% reads, 5% writes)

### Numerical Computations

```
Traffic:
- 10M requests/day
- 10M / 86,400 = ~115 req/sec
- Peak: 350 req/sec

Cache Performance:
- Without cache: DB query ~20ms
- With cache: Redis lookup ~1ms
- Improvement: 20x faster

Cache Hit Rate:
- Target: 80% cache hit rate
- Cache hits: 115 * 0.8 = 92 req/sec served from cache
- Cache misses: 115 * 0.2 = 23 req/sec hit database

Database Load Reduction:
- Before: 115 req/sec to DB
- After: 23 req/sec to DB
- Reduction: 80%

Storage:
- Average object size: 10KB
- Cache capacity: 10GB
- Number of objects: 10GB / 10KB = 1M objects
- Working set: 5GB (50M objects accessed frequently)

Memory Per Server:
- 3 cache servers
- 10GB / 3 = ~3.5GB per server
- With overhead: 4GB RAM per server
```

### API Design

```
Cache Service API:

GET /cache/{key}
Response: {
  "value": "cached_data",
  "hit": true,
  "ttl_remaining": 3600
}

PUT /cache/{key}
Request: {
  "value": "data_to_cache",
  "ttl": 3600  // seconds
}

DELETE /cache/{key}

POST /cache/batch/get
Request: {
  "keys": ["user:123", "post:456"]
}
Response: {
  "user:123": { "value": "...", "hit": true },
  "post:456": { "value": null, "hit": false }
}

GET /cache/stats
Response: {
  "total_keys": 50000,
  "memory_used": "3.2GB",
  "hit_rate": 0.82,
  "evictions": 1200
}
```

### Eviction Policies

**Approach 1: LRU (Least Recently Used)**

Evict least recently accessed items.

```python
class LRUCache:
    def __init__(self, capacity):
        self.cache = {}  # key -> node
        self.capacity = capacity
        self.head = Node(0, 0)  # dummy head
        self.tail = Node(0, 0)  # dummy tail
        self.head.next = self.tail
        self.tail.prev = self.head

    def get(self, key):
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._add(node)  # Move to front (most recent)
            return node.value
        return None

    def put(self, key, value):
        if key in self.cache:
            self._remove(self.cache[key])

        node = Node(key, value)
        self._add(node)
        self.cache[key] = node

        if len(self.cache) > self.capacity:
            # Remove LRU (tail.prev)
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add(self, node):
        # Add to front (after head)
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node
```

**Pros**:
- Simple to understand
- Works well for temporal locality
- Good for most use cases

**Cons**:
- Doesn't consider frequency
- May evict frequently accessed items

**When**: General purpose caching

---

**Approach 2: LFU (Least Frequently Used)**

Evict least frequently accessed items.

```python
class LFUCache:
    def __init__(self, capacity):
        self.cache = {}  # key -> (value, freq)
        self.freq_map = {}  # freq -> [keys]
        self.capacity = capacity
        self.min_freq = 0

    def get(self, key):
        if key not in self.cache:
            return None

        value, freq = self.cache[key]

        # Update frequency
        self.freq_map[freq].remove(key)
        if not self.freq_map[freq] and freq == self.min_freq:
            self.min_freq += 1

        new_freq = freq + 1
        self.cache[key] = (value, new_freq)
        self.freq_map[new_freq].append(key)

        return value

    def put(self, key, value):
        if self.capacity == 0:
            return

        if key in self.cache:
            _, freq = self.cache[key]
            self.cache[key] = (value, freq)
            self.get(key)  # Update frequency
            return

        if len(self.cache) >= self.capacity:
            # Evict LFU
            evict_key = self.freq_map[self.min_freq].pop(0)
            del self.cache[evict_key]

        self.cache[key] = (value, 1)
        self.freq_map[1].append(key)
        self.min_freq = 1
```

**Pros**:
- Retains frequently accessed items
- Good for skewed access patterns

**Cons**:
- More complex
- New items easily evicted
- Doesn't adapt to changing patterns

**When**: Access patterns heavily skewed (80/20 rule)

---

**Approach 3: TTL (Time To Live)**

Items expire after fixed time.

```python
class TTLCache:
    def __init__(self):
        self.cache = {}  # key -> (value, expiry_time)

    def get(self, key):
        if key not in self.cache:
            return None

        value, expiry = self.cache[key]

        if time.time() > expiry:
            del self.cache[key]
            return None

        return value

    def put(self, key, value, ttl_seconds):
        expiry = time.time() + ttl_seconds
        self.cache[key] = (value, expiry)

    def cleanup(self):
        # Periodically remove expired items
        current_time = time.time()
        expired_keys = [
            k for k, (v, exp) in self.cache.items()
            if current_time > exp
        ]
        for key in expired_keys:
            del self.cache[key]
```

**Pros**:
- Guarantees freshness
- Simple to reason about
- Automatic cleanup

**Cons**:
- Requires background cleanup
- Memory spikes if many items expire together

**When**: Data has natural expiry (session tokens, temporary results)

---

**Approach 4: Hybrid (LRU + TTL)** ⭐ Recommended

```python
class HybridCache:
    """
    Combines LRU eviction with TTL expiry
    Redis default behavior
    """
    def __init__(self, capacity):
        self.lru_cache = LRUCache(capacity)
        self.ttls = {}  # key -> expiry_time

    def get(self, key):
        if key in self.ttls and time.time() > self.ttls[key]:
            self.delete(key)
            return None

        return self.lru_cache.get(key)

    def put(self, key, value, ttl_seconds=None):
        self.lru_cache.put(key, value)

        if ttl_seconds:
            self.ttls[key] = time.time() + ttl_seconds
```

**Pros**:
- Best of both worlds
- Eviction for capacity + expiry for freshness
- Industry standard (Redis)

**Cons**:
- Slightly more complex

**When**: Production systems (recommended)

### Cache Strategies

**Strategy 1: Cache-Aside (Lazy Loading)**

```python
def get_user(user_id):
    # 1. Try cache first
    cache_key = f"user:{user_id}"
    user = cache.get(cache_key)

    if user:
        return user  # Cache hit

    # 2. Cache miss - query database
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)

    # 3. Write to cache
    cache.put(cache_key, user, ttl=3600)

    return user
```

**Pros**:
- Only cache what's needed
- Resilient (cache failure doesn't break app)
- Simple

**Cons**:
- Cache miss penalty (extra latency)
- Stale data possible

**When**: Read-heavy, cache misses acceptable

---

**Strategy 2: Read-Through**

Cache handles database queries.

```python
class ReadThroughCache:
    def get(self, key, load_function):
        value = self.cache.get(key)

        if value is None:
            value = load_function()
            self.cache.put(key, value)

        return value

# Usage
user = cache.get(
    f"user:{user_id}",
    lambda: db.query("SELECT * FROM users WHERE id = ?", user_id)
)
```

**Pros**:
- Simpler application code
- Consistent interface

**Cons**:
- Tight coupling with cache
- Cache becomes critical path

---

**Strategy 3: Write-Through**

Write to cache and database simultaneously.

```python
def update_user(user_id, data):
    # 1. Update database
    db.execute("UPDATE users SET ... WHERE id = ?", data, user_id)

    # 2. Update cache
    cache_key = f"user:{user_id}"
    cache.put(cache_key, data, ttl=3600)
```

**Pros**:
- Cache always fresh
- Consistent reads

**Cons**:
- Extra write latency
- Wasted writes (if data not read)

**When**: Read-heavy + strong consistency needed

---

**Strategy 4: Write-Back (Write-Behind)**

Write to cache, async write to database.

```python
def update_user(user_id, data):
    # 1. Update cache immediately
    cache_key = f"user:{user_id}"
    cache.put(cache_key, data)

    # 2. Queue database write
    queue.enqueue({
        'action': 'update_user',
        'user_id': user_id,
        'data': data
    })

# Background worker
def process_queue():
    while True:
        task = queue.dequeue()
        db.execute("UPDATE users SET ... WHERE id = ?",
                   task['data'], task['user_id'])
```

**Pros**:
- Fast writes (no DB wait)
- Can batch writes

**Cons**:
- Data loss risk (cache crash before DB write)
- Complex error handling

**When**: Write-heavy, can tolerate data loss

---

**Strategy 5: Refresh-Ahead**

Proactively refresh cache before expiry.

```python
def get_with_refresh(key, load_function, ttl):
    value, remaining_ttl = cache.get_with_ttl(key)

    if value is None:
        # Cache miss
        value = load_function()
        cache.put(key, value, ttl)
    elif remaining_ttl < ttl * 0.2:  # < 20% of TTL remaining
        # Async refresh in background
        background_task.run(lambda: cache.put(key, load_function(), ttl))

    return value
```

**Pros**:
- No cache miss latency for hot keys
- Always fresh data

**Cons**:
- Extra load (refreshing unused keys)
- Complex to implement

**When**: High traffic, latency-sensitive

### Distributed Caching

**Approach 1: Replicated Cache**

```
Server 1 Cache: Full copy
Server 2 Cache: Full copy
Server 3 Cache: Full copy
```

**Pros**:
- Fast local reads
- No network latency

**Cons**:
- 3x memory usage
- Consistency issues (different servers have different data)
- Invalidation complex

**When**: Small datasets, read-only

---

**Approach 2: Centralized Cache (Redis)**

```
┌────────┐  ┌────────┐  ┌────────┐
│Server 1│  │Server 2│  │Server 3│
└───┬────┘  └───┬────┘  └───┬────┘
    │           │           │
    └───────┬───┴───┬───────┘
            │       │
        ┌───▼───────▼───┐
        │  Redis Cluster│
        │  (Sharded)    │
        └───────────────┘
```

**Pros**:
- Single source of truth
- Consistent data
- Efficient memory usage

**Cons**:
- Network latency (~1ms)
- Redis becomes bottleneck
- Single point of failure (mitigated with clustering)

**When**: Most production systems ⭐

---

**Approach 3: Consistent Hashing**

Distribute cache across servers.

```python
class ConsistentHashRing:
    def __init__(self, nodes, virtual_nodes=150):
        self.ring = {}
        self.sorted_keys = []

        for node in nodes:
            for i in range(virtual_nodes):
                key = hash(f"{node}:{i}")
                self.ring[key] = node

        self.sorted_keys = sorted(self.ring.keys())

    def get_node(self, key):
        hash_key = hash(key)

        # Binary search for nearest node
        idx = bisect.bisect_right(self.sorted_keys, hash_key)
        if idx == len(self.sorted_keys):
            idx = 0

        return self.ring[self.sorted_keys[idx]]

# Usage
ring = ConsistentHashRing(['cache1', 'cache2', 'cache3'])
cache_server = ring.get_node('user:12345')
```

**Pros**:
- Distributes load evenly
- Adding/removing nodes only affects 1/N keys
- Scalable

**Cons**:
- Complex implementation
- Can't do range queries

**When**: Large scale, multiple cache servers

### Cache Invalidation

**The Two Hard Problems in CS**:
1. Naming things
2. **Cache invalidation** ← This one!
3. Off-by-one errors

**Problem**: How to keep cache consistent with database?

**Approach 1: TTL-Based**

```python
cache.put("user:123", user_data, ttl=300)  # 5 minutes
# Data gets stale for up to 5 minutes
```

**Pros**: Simple, automatic
**Cons**: Stale data, wastes memory
**When**: Staleness acceptable

---

**Approach 2: Write-Time Invalidation**

```python
def update_user(user_id, data):
    db.execute("UPDATE users SET ... WHERE id = ?", data, user_id)
    cache.delete(f"user:{user_id}")  # Invalidate
```

**Pros**: Always fresh
**Cons**: Must track all dependent keys
**When**: Strong consistency needed

---

**Approach 3: Event-Based Invalidation**

```python
# After DB write
event_bus.publish("user.updated", {"user_id": 123})

# Cache listener
@event_bus.subscribe("user.updated")
def invalidate_cache(event):
    cache.delete(f"user:{event['user_id']}")
    cache.delete(f"timeline:{event['user_id']}")  # Dependent data
```

**Pros**: Decoupled, handles dependencies
**Cons**: Complex, eventual consistency
**When**: Microservices, complex dependencies

### Bottlenecks and Solutions

**Bottleneck 1: Cache Stampede**

**Problem**: Cache expires, 1000 requests hit DB simultaneously

```
Time 0: Cache expires
Time 1: 1000 requests → all cache miss → all query DB → DB overload
```

**Solution 1: Locking**

```python
import threading

lock_map = {}  # key -> lock

def get_with_lock(key, load_function, ttl):
    value = cache.get(key)
    if value:
        return value

    # Get or create lock for this key
    if key not in lock_map:
        lock_map[key] = threading.Lock()

    lock = lock_map[key]

    with lock:
        # Double-check after acquiring lock
        value = cache.get(key)
        if value:
            return value

        # Only one thread loads from DB
        value = load_function()
        cache.put(key, value, ttl)
        return value
```

**Solution 2: Probabilistic Early Expiration**

```python
def get_with_early_refresh(key, load_function, ttl):
    value, remaining_ttl = cache.get_with_ttl(key)

    if value is None:
        value = load_function()
        cache.put(key, value, ttl)
        return value

    # Refresh early with probability based on time left
    refresh_probability = 1 - (remaining_ttl / ttl)

    if random.random() < refresh_probability:
        # This request refreshes cache
        value = load_function()
        cache.put(key, value, ttl)

    return value
```

---

**Bottleneck 2: Hot Key**

**Problem**: One key (celebrity profile) gets 100K req/sec

**Solution 1: Local Cache**

```python
# Local in-memory cache per server
local_cache = {}

def get_with_local_cache(key):
    # Check local first (microseconds)
    if key in local_cache:
        value, expiry = local_cache[key]
        if time.time() < expiry:
            return value

    # Check Redis (milliseconds)
    value = redis.get(key)

    # Store locally for 1 second
    local_cache[key] = (value, time.time() + 1)

    return value
```

**Solution 2: Replication**

```python
# Store hot keys on multiple Redis instances
def get_hot_key(key):
    # Randomly pick one of 5 replicas
    replica = random.randint(0, 4)
    return redis[replica].get(key)
```

---

**Bottleneck 3: Big Key**

**Problem**: Storing 10MB object in cache

**Solution**: Break into smaller chunks

```python
def put_large_object(key, obj, chunk_size=1MB):
    chunks = split(obj, chunk_size)

    for i, chunk in enumerate(chunks):
        cache.put(f"{key}:chunk:{i}", chunk)

    cache.put(f"{key}:metadata", {
        'num_chunks': len(chunks),
        'total_size': len(obj)
    })

def get_large_object(key):
    metadata = cache.get(f"{key}:metadata")
    chunks = []

    for i in range(metadata['num_chunks']):
        chunk = cache.get(f"{key}:chunk:{i}")
        chunks.append(chunk)

    return combine(chunks)
```

### Technologies

**In-Memory Cache**:
- **Redis**: Feature-rich, pub/sub, persistence
- **Memcached**: Simple, fast, less features
- **Hazelcast**: Distributed, Java-based

**CDN (Content Delivery Network)**:
- **CloudFlare**: Global, DDoS protection
- **AWS CloudFront**: Integrated with AWS
- **Akamai**: Enterprise-grade

**Application-Level**:
- **Guava Cache** (Java)
- **node-cache** (Node.js)
- **functools.lru_cache** (Python)

### Interview Talking Points

**"I would clarify..."**
- What's the acceptable staleness? (real-time vs 5 minutes)
- Read/write ratio? (determines strategy)
- Scale? (local cache vs distributed)

**"The key trade-off is..."**
- **Consistency vs Performance**: Fresh data (invalidate) vs fast (longer TTL)
- **Memory vs Latency**: Larger cache (more memory) vs smaller (more misses)
- **Complexity vs Reliability**: Simple cache-aside vs sophisticated write-through

**"To scale, I would..."**
- Use Redis Cluster (horizontal scaling)
- Implement local caching for hot keys
- Monitor cache hit rate (target 80%+)
- Set appropriate TTLs based on data freshness needs

**"I would measure..."**
- Cache hit rate
- Average latency (cache hit vs miss)
- Memory usage
- Eviction rate

---

## 4. Design a Job Queue System

### Requirements Clarification
- **Q**: What types of jobs? (emails, image processing, reports)
- **Q**: Priority levels needed?
- **Q**: Job execution time? (seconds, minutes, hours)
- **Q**: Failure handling? (retry, dead letter queue)
- **Q**: Exactly-once or at-least-once delivery?
- **Q**: Scale? (jobs/sec)

**Assumptions**:
- Email sending, image processing, report generation
- 3 priority levels (high, medium, low)
- Jobs: 1 sec to 10 minutes
- At-least-once delivery (retries)
- 1000 jobs/sec at peak

### Numerical Computations

```
Traffic:
- Average: 100 jobs/sec
- Peak: 1000 jobs/sec
- Daily: 100 * 86,400 = 8.6M jobs/day

Job Processing:
- Average duration: 30 seconds
- Workers needed: 100 jobs/sec * 30 sec = 3,000 concurrent jobs
- With safety margin (2x): 6,000 workers
- Distributed across: 100 servers * 60 workers/server

Storage (7-day retention):
- 8.6M jobs/day * 7 days = 60M jobs
- Average job payload: 10KB
- Total: 60M * 10KB = 600GB
- With metadata: ~1TB

Queue Depth:
- At steady state: ~3,000 jobs (in progress)
- At peak: ~30,000 jobs (backlog)
- Max acceptable delay: 5 minutes
- Max queue depth: 1000 jobs/sec * 300 sec = 300,000 jobs

Memory (Redis):
- Queue metadata: 60M * 1KB = 60GB
- Active jobs: 30,000 * 10KB = 300MB
- Total: ~65GB (distributed across cluster)
```

### API Design

```
Producer API:

POST /api/v1/jobs
Request: {
  "type": "send_email",
  "priority": "high",  // high, medium, low
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome!",
    "body": "..."
  },
  "max_retries": 3,
  "timeout": 60  // seconds
}
Response: {
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "position": 42
}

GET /api/v1/jobs/{job_id}
Response: {
  "job_id": "...",
  "status": "processing",  // queued, processing, completed, failed
  "progress": 0.75,
  "result": null,
  "created_at": "2024-01-01T00:00:00Z",
  "started_at": "2024-01-01T00:00:05Z",
  "attempts": 1
}

DELETE /api/v1/jobs/{job_id}

Worker API:

POST /api/v1/jobs/claim
Request: {
  "worker_id": "worker-123",
  "types": ["send_email", "process_image"]
}
Response: {
  "job_id": "...",
  "type": "send_email",
  "payload": {...},
  "timeout": 60
}

POST /api/v1/jobs/{job_id}/complete
Request: {
  "result": {...}
}

POST /api/v1/jobs/{job_id}/fail
Request: {
  "error": "SMTP connection failed",
  "retry": true
}

POST /api/v1/jobs/{job_id}/heartbeat
```

### Database Schema

**PostgreSQL (Job Metadata)**:

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(10) NOT NULL,  -- high, medium, low
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL,  -- queued, processing, completed, failed
  result JSONB,
  error TEXT,

  max_retries INT DEFAULT 3,
  attempts INT DEFAULT 0,
  timeout_seconds INT DEFAULT 300,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  queued_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  worker_id VARCHAR(100),
  last_heartbeat TIMESTAMP,

  INDEX idx_status_priority (status, priority, created_at),
  INDEX idx_worker (worker_id),
  INDEX idx_created_at (created_at)
);

CREATE TABLE job_logs (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  level VARCHAR(10),  -- info, warning, error
  message TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),

  INDEX idx_job_id (job_id, timestamp)
);

-- Dead letter queue
CREATE TABLE failed_jobs (
  id UUID PRIMARY KEY,
  job_id UUID,
  type VARCHAR(50),
  payload JSONB,
  error TEXT,
  attempts INT,
  failed_at TIMESTAMP DEFAULT NOW()
);
```

**Redis (Queue)**:

```
High Priority Queue:
Key: "queue:high"
Type: LIST
Value: [job_id_1, job_id_2, ...]

Medium Priority Queue:
Key: "queue:medium"
Type: LIST

Low Priority Queue:
Key: "queue:low"
Type: LIST

Job Data (temporary):
Key: "job:{job_id}"
Type: HASH
Value: {
  type: "send_email",
  payload: "...",
  timeout: 60,
  worker_id: "worker-123",
  claimed_at: 1640000000
}
TTL: 1 hour

Processing Set (for visibility timeout):
Key: "processing"
Type: SORTED SET
Value: {
  job_id: score = timeout_timestamp
}

Scheduled Jobs:
Key: "scheduled"
Type: SORTED SET
Value: {
  job_id: score = scheduled_timestamp
}
```

### Architecture Approaches

**Approach 1: Simple Pull-Based**

```
┌─────────────┐
│  Producer   │
└──────┬──────┘
       │ 1. Enqueue
   ┌───▼──────────┐
   │    Redis     │
   │   (Queue)    │
   └───▲──────────┘
       │ 2. Poll
   ┌───┴──────────┐
   │   Workers    │
   │   (polling)  │
   └──────────────┘
```

**Flow**:
1. Producer adds job to Redis list
2. Workers poll Redis every second
3. Worker claims job, processes, marks complete

**Pros**:
- Simple
- Workers control load (poll when ready)
- No message loss (Redis persistence)

**Cons**:
- Polling overhead (empty polls waste resources)
- Higher latency (polling interval delay)

**When**: Low to medium scale, simple requirements

---

**Approach 2: Push-Based (Pub/Sub)**

```
┌─────────────┐
│  Producer   │
└──────┬──────┘
       │ 1. Publish
   ┌───▼──────────┐
   │    Redis     │
   │   Pub/Sub    │
   └───┬──────────┘
       │ 2. Push
   ┌───▼──────────┐
   │   Workers    │
   │  (subscribed)│
   └──────────────┘
```

**Pros**:
- Low latency (instant delivery)
- No polling overhead

**Cons**:
- Message loss if worker offline
- No persistence (pub/sub doesn't store messages)
- No ordering guarantee

**When**: Real-time, can tolerate message loss

---

**Approach 3: Hybrid (Pull + Push)** ⭐ Recommended

```
┌─────────────┐
│  Producer   │
└──────┬──────┘
       │ 1. Enqueue to List
   ┌───▼──────────────┐
   │    Redis         │
   │  ┌────────────┐  │
   │  │   Queue    │  │
   │  │  (List)    │  │
   │  └────────────┘  │
   │  ┌────────────┐  │
   │  │   Pub/Sub  │──┼──┐
   │  │ (Notify)   │  │  │ 2. Notify
   │  └────────────┘  │  │
   └──────────────────┘  │
                         │
   ┌─────────────────────▼┐
   │   Workers            │
   │  - Subscribe to     │
   │    notifications    │
   │  - Pull from queue  │
   └─────────────────────┘
```

**Flow**:
1. Producer adds job to Redis list
2. Producer publishes notification on pub/sub channel
3. Worker receives notification, pulls from queue
4. If notification lost, workers fall back to polling

**Pros**:
- Low latency (push)
- No message loss (queue persistence)
- Best of both worlds

**Cons**:
- More complex

**When**: Production systems (recommended)

---

**Approach 4: Distributed with Message Broker**

```
┌─────────────┐
│  Producers  │
└──────┬──────┘
       │
   ┌───▼──────────┐
   │   RabbitMQ   │
   │   / Kafka    │
   │              │
   │ ┌──────────┐ │
   │ │  Queue 1 │ │
   │ │  Queue 2 │ │
   │ │  Queue 3 │ │
   │ └──────────┘ │
   └───┬──────────┘
       │
   ┌───▼──────────┐
   │  Worker Pool │
   │  (scaled)    │
   └──────────────┘
```

**Pros**:
- Battle-tested (RabbitMQ, Kafka)
- Advanced features (routing, priorities, dead letter)
- Built-in HA

**Cons**:
- Extra infrastructure
- Operational complexity

**When**: Enterprise scale, need advanced features

### Job Processing Patterns

**Pattern 1: At-Least-Once Delivery**

```python
def process_job():
    # Worker claims job
    job = redis.rpoplpush("queue:high", "processing")

    try:
        # Process job
        result = execute(job)

        # Mark complete in DB
        db.execute("""
            UPDATE jobs
            SET status = 'completed', result = ?, completed_at = NOW()
            WHERE id = ?
        """, result, job['id'])

        # Remove from processing list
        redis.lrem("processing", job)

    except Exception as e:
        # On failure, retry
        attempts = job['attempts'] + 1

        if attempts < job['max_retries']:
            # Re-queue with backoff
            delay = 2 ** attempts  # Exponential backoff
            redis.zadd("scheduled", job['id'], time.time() + delay)
        else:
            # Move to dead letter queue
            redis.lpush("dead_letter", job)

        redis.lrem("processing", job)
```

**Guarantees**:
- Job processed at least once
- May process multiple times (idempotency required!)

---

**Pattern 2: Exactly-Once (Best Effort)**

```python
def process_job_exactly_once():
    job = claim_job()

    # Check if already processed (deduplication)
    if redis.exists(f"processed:{job['id']}"):
        logger.info(f"Job {job['id']} already processed")
        return

    try:
        result = execute(job)

        # Atomic: mark processed + save result
        with db.transaction():
            db.execute("UPDATE jobs SET status = 'completed' WHERE id = ?", job['id'])
            redis.setex(f"processed:{job['id']}", 86400, "1")  # 24h dedup window

    except Exception as e:
        handle_failure(job, e)
```

**Note**: True exactly-once is hard in distributed systems. This provides:
- Deduplication (processed:{job_id} check)
- Idempotent handlers (safe to retry)

---

**Pattern 3: Visibility Timeout**

```python
def claim_job_with_timeout(timeout=60):
    # Atomically: pop from queue, add to processing set
    lua_script = """
        local job_id = redis.call('RPOP', KEYS[1])
        if job_id then
            redis.call('ZADD', KEYS[2], ARGV[1], job_id)
        end
        return job_id
    """

    timeout_timestamp = time.time() + timeout
    job_id = redis.eval(lua_script,
                        ["queue:high", "processing"],
                        [timeout_timestamp])

    return get_job(job_id)

# Background task to reclaim timed-out jobs
def reclaim_timeout_jobs():
    while True:
        current_time = time.time()

        # Find jobs with expired timeouts
        timed_out = redis.zrangebyscore("processing", 0, current_time)

        for job_id in timed_out:
            # Re-queue job
            redis.lpush("queue:high", job_id)
            redis.zrem("processing", job_id)

            logger.warning(f"Job {job_id} timed out, re-queued")

        time.sleep(10)
```

### Priority Queue Implementation

**Approach 1: Multiple Queues**

```python
def get_next_job():
    # Check high priority first
    job = redis.rpop("queue:high")
    if job:
        return job

    # Then medium
    job = redis.rpop("queue:medium")
    if job:
        return job

    # Finally low
    job = redis.rpop("queue:low")
    return job
```

**Pros**: Simple
**Cons**: Low priority can starve

---

**Approach 2: Weighted Round Robin**

```python
def get_next_job():
    # Process: 5 high, 3 medium, 1 low (repeating)
    priority_pattern = ['high']*5 + ['medium']*3 + ['low']*1

    for priority in priority_pattern:
        job = redis.rpop(f"queue:{priority}")
        if job:
            return job

    return None
```

**Pros**: Prevents starvation
**Cons**: Fixed ratio

---

**Approach 3: Sorted Set (Dynamic Priority)**

```python
def add_job(job, priority):
    # Higher priority = higher score
    score = priority + job['created_at']
    redis.zadd("queue", job['id'], score)

def get_next_job():
    # Pop highest score (highest priority, oldest first)
    result = redis.zpopmax("queue")
    if result:
        job_id, score = result[0]
        return get_job(job_id)
    return None
```

**Pros**: Flexible, dynamic priorities
**Cons**: More complex

### Retries and Failure Handling

**Exponential Backoff**:

```python
def retry_job(job, attempt):
    if attempt >= job['max_retries']:
        # Move to dead letter queue
        move_to_dlq(job)
        return

    # Calculate backoff: 2^attempt seconds
    # attempt 1: 2s, 2: 4s, 3: 8s, 4: 16s, ...
    backoff = min(2 ** attempt, 3600)  # Max 1 hour

    # Add jitter to prevent thundering herd
    jitter = random.uniform(0, backoff * 0.1)
    delay = backoff + jitter

    # Schedule retry
    schedule_at = time.time() + delay
    redis.zadd("scheduled", job['id'], schedule_at)

    logger.info(f"Job {job['id']} scheduled for retry {attempt} in {delay}s")
```

**Dead Letter Queue**:

```python
def move_to_dlq(job):
    failed_job = {
        'job_id': job['id'],
        'type': job['type'],
        'payload': job['payload'],
        'error': job['error'],
        'attempts': job['attempts'],
        'failed_at': time.time()
    }

    # Store in database for investigation
    db.execute("""
        INSERT INTO failed_jobs (job_id, type, payload, error, attempts)
        VALUES (?, ?, ?, ?, ?)
    """, ...)

    # Alert team
    alert("Job failed after max retries", job['id'])
```

**Circuit Breaker** (for failing downstream services):

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self.last_failure_time = None

    def call(self, func):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "HALF_OPEN"
            else:
                raise CircuitBreakerOpen("Service unavailable")

        try:
            result = func()
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
            return result

        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"

            raise

# Usage
email_circuit = CircuitBreaker()

def send_email(job):
    email_circuit.call(lambda: smtp.send(job['payload']))
```

### Bottlenecks and Solutions

**Bottleneck 1: Slow Poison Pill**

**Problem**: One bad job blocks entire queue

**Solution 1: Timeout**
```python
import signal

def timeout_handler(signum, frame):
    raise TimeoutError("Job execution timeout")

def process_with_timeout(job, timeout=60):
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(timeout)

    try:
        result = execute(job)
        signal.alarm(0)  # Cancel alarm
        return result
    except TimeoutError:
        logger.error(f"Job {job['id']} timed out")
        raise
```

**Solution 2: Separate Queues per Job Type**
```
queue:send_email (fast, 1 sec/job)
queue:generate_report (slow, 60 sec/job)
queue:process_video (very slow, 10 min/job)

Workers specialized per queue
```

---

**Bottleneck 2: Hot Queue**

**Problem**: One queue has 1M jobs, others empty

**Solution**: Dynamic worker allocation
```python
def auto_scale_workers():
    while True:
        # Check queue depths
        high_depth = redis.llen("queue:high")
        medium_depth = redis.llen("queue:medium")
        low_depth = redis.llen("queue:low")

        # Allocate workers proportionally
        total_depth = high_depth + medium_depth + low_depth

        if total_depth > 0:
            high_workers = int(TOTAL_WORKERS * (high_depth / total_depth))
            medium_workers = int(TOTAL_WORKERS * (medium_depth / total_depth))
            low_workers = TOTAL_WORKERS - high_workers - medium_workers

            adjust_worker_allocation(high_workers, medium_workers, low_workers)

        time.sleep(60)
```

---

**Bottleneck 3: Database Write Pressure**

**Problem**: 1000 workers updating job status → DB overload

**Solution**: Batch updates
```python
update_buffer = []

def mark_complete(job_id, result):
    update_buffer.append((job_id, result))

    if len(update_buffer) >= 100:
        flush_updates()

def flush_updates():
    # Batch update
    db.executemany("""
        UPDATE jobs
        SET status = 'completed', result = ?
        WHERE id = ?
    """, update_buffer)

    update_buffer.clear()

# Periodic flush
schedule.every(5).seconds.do(flush_updates)
```

### Technologies

**Message Brokers**:
- **RabbitMQ**: Flexible, reliable, AMQP protocol
- **Apache Kafka**: High throughput, event streaming
- **AWS SQS/SNS**: Managed, serverless
- **Redis**: Lightweight, fast

**Job Frameworks**:
- **Celery** (Python): Feature-rich, distributed
- **Bull** (Node.js): Redis-based, simple
- **Sidekiq** (Ruby): Redis-based, performant
- **Delayed Job**: Database-backed (simpler)

**Workflow Orchestration**:
- **Apache Airflow**: DAG-based workflows
- **Temporal**: Microservice orchestration
- **AWS Step Functions**: Managed workflows

### Interview Talking Points

**"I would start by asking..."**
- What's the scale? (jobs/sec)
- What are the job characteristics? (duration, failure rate)
- Do we need exactly-once or at-least-once?
- What's acceptable latency?

**"The key trade-offs are..."**
- **Pull vs Push**: Polling overhead vs instant delivery
- **At-least-once vs Exactly-once**: Simple retries vs complex deduplication
- **Immediate vs Delayed**: Fast processing vs exponential backoff

**"To handle scale, I would..."**
- Use Redis for queue (fast, persistent)
- Implement priority queues (multiple lists)
- Add visibility timeout (prevent lost jobs)
- Use exponential backoff (reduce retry storm)
- Monitor queue depth (alert on backlog)

**"I would measure..."**
- Queue depth (jobs waiting)
- Processing time (p50, p95, p99)
- Failure rate
- Retry rate
- Worker utilization

---

*[Continued in next part with problems 5-15...]*

**For brevity, I'll provide the remaining problems (5-15) in summary form with key points. Would you like me to expand any specific problem?**

## Quick Reference: Remaining Problems

### 5. Authentication System
- JWT vs Session-based
- OAuth 2.0 / OpenID Connect
- Refresh tokens
- Multi-factor authentication
- Password hashing (bcrypt, Argon2)

### 6. URL Shortener Backend
- Base62 encoding
- Auto-incrementing ID vs hash
- Database schema (key-value vs relational)
- Analytics tracking
- Custom short codes

### 7. Distributed Lock Service
- Redis SETNX
- Redlock algorithm
- Lease-based locking
- Fencing tokens
- ZooKeeper alternative

### 8. News Feed Ranking System
- Feed generation (fan-out on read vs write)
- Ranking algorithm (engagement, recency)
- Personalization
- A/B testing infrastructure
- Real-time updates

### 9. Notification Service
- Push (mobile), Email, SMS, In-app
- Template management
- Priority queues
- Rate limiting per user
- Delivery guarantees

### 10. Search Autocomplete Backend
- Trie data structure
- Elasticsearch implementation
- Prefix matching
- Ranking (popularity, personalization)
- Caching strategies

### 11. Metrics Collection System
- Time-series database (InfluxDB, Prometheus)
- Aggregation strategies
- Downsampling for long-term storage
- Query optimization
- Alerting

### 12. File Upload Service
- Multipart upload
- Resumable uploads
- Presigned URLs (S3)
- Virus scanning
- Thumbnail generation

### 13. Distributed Task Scheduler
- Cron vs event-driven
- Leader election
- Task distribution
- Failure handling
- Time zone handling

### 14. API Gateway
- Rate limiting
- Authentication/authorization
- Request routing
- Response caching
- Load balancing

### 15. Webhook System
- Delivery guarantees
- Retry logic
- Signature verification
- Event filtering
- Webhook management UI

---

**End of Backend Design Section**

Would you like me to expand any of these problems or move on to creating the Frontend Design section?
