# Design Twitter

## Problem Statement

Design a social media platform like Twitter that allows users to post short messages (tweets), follow other users, and view a personalized timeline of tweets from people they follow.

## Requirements Clarification

### Functional Requirements

- Post tweets (280 characters, images, videos)
- Follow/unfollow other users
- Home timeline (tweets from people you follow)
- User timeline (tweets from specific user)
- Like and retweet functionality
- Search tweets

### Non-Functional Requirements

- **High availability**: 99.99% uptime
- **Low latency**: Timeline loads in < 500ms
- **Eventual consistency**: Acceptable for likes/retweets
- **Scale**: 300M users, 100M DAU
- **Read-heavy**: 100:1 read/write ratio

### Out of Scope (Clarify in Interview)

- Direct messages
- Trending topics
- Notifications
- Tweet replies (threading)

## Capacity Estimation

### Users & Traffic

```
Users:
- 300M total users
- 100M daily active users (DAU)
- 200M monthly active users (MAU)

Traffic:
- Each user posts 2 tweets/day on average
- Each user views timeline 10 times/day
- Each timeline view loads 20 tweets

Write Traffic:
- Tweets: 100M users × 2 tweets/day = 200M tweets/day
- Per second: 200M ÷ 86,400 = ~2,300 tweets/sec
- Peak (3x): ~7,000 tweets/sec

Read Traffic:
- Timeline views: 100M users × 10 views/day = 1B views/day
- Tweets read: 1B views × 20 tweets = 20B tweet reads/day
- Per second: 20B ÷ 86,400 = ~231,000 reads/sec
- Peak (3x): ~700,000 reads/sec

Ratio: 100:1 read-heavy (as expected)
```

### Storage (5 Years)

```
Tweets per day: 200M
Total tweets: 200M × 365 × 5 = 365B tweets

Tweet Storage:
- Text: 280 chars × 2 bytes = 560 bytes
- Metadata (user_id, timestamp, etc.): 200 bytes
- Average per tweet: ~1KB (conservative)

Total tweet data: 365B × 1KB = 365TB

Media Storage:
- 20% of tweets have media
- Average media size: 200KB (compressed image)
- Media tweets: 365B × 0.2 = 73B
- Total media: 73B × 200KB = 14.6PB

Total Storage: ~15PB (with 3x replication: ~45PB)

User Data:
- 300M users × 10KB (profile, bio, etc.) = 3TB (negligible)

Follow Relationships:
- Average user follows 200 people
- 300M users × 200 follows × 8 bytes (user_id) = 480GB (negligible)

Timeline Cache:
- 100M active users × 20 tweets × 1KB = 2TB in memory (manageable)
```

### Bandwidth

```
Write: 2,300 tweets/sec × 1KB = 2.3MB/sec (negligible)
Media uploads: 2,300 × 0.2 × 200KB = 92MB/sec
Read: 231,000 reads/sec × 1KB = 231MB/sec
Media downloads: 231,000 × 0.2 × 200KB = 9.2GB/sec

Total bandwidth: ~10GB/sec (CDN is essential!)
```

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Web, iOS, Android)                                         │
└────────────────┬─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                           CDN                                │
│  (CloudFront / Akamai) - Serve static assets & media         │
└────────────────┬─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                     Load Balancer                            │
│  (AWS ELB / nginx) - Distribute traffic                      │
└────────────────┬─────────────────────────────────────────────┘
                 │
       ┌─────────┴─────────┐
       │                   │
┌──────▼──────┐     ┌──────▼──────┐
│  API Gateway│     │  API Gateway│
│             │     │             │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
       ┌─────────┴─────────────────────────────────┐
       │                                            │
┌──────▼──────────┐                    ┌───────────▼──────────┐
│  Write Service  │                    │   Read Service       │
│  (Post Tweet)   │                    │   (Get Timeline)     │
└──────┬──────────┘                    └───────────┬──────────┘
       │                                            │
       │                                    ┌───────▼──────────┐
       │                                    │  Redis Cache     │
       │                                    │  (Timelines)     │
       │                                    └───────┬──────────┘
       │                                            │
┌──────▼─────────────────────────────────────┐     │
│          Message Queue (Kafka)             │     │
│  Topics: tweet-posted, timeline-update     │     │
└──────┬─────────────────────────────────────┘     │
       │                                            │
       │                                            │
┌──────▼──────────────────────────────┐            │
│  Fan-out Service (Workers)          │────────────┘
│  (Update follower timelines)        │
└──────┬──────────────────────────────┘
       │
       │
┌──────┴──────────────────────────────────────────────────────┐
│                    Data Layer                                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   User DB    │  │   Tweet DB   │  │   Graph DB   │      │
│  │ (PostgreSQL) │  │ (Cassandra)  │  │   (Neo4j)    │      │
│  │              │  │              │  │  (follows)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Search DB   │  │  Media Store │                        │
│  │(Elasticsearch│  │     (S3)     │                        │
│  └──────────────┘  └──────────────┘                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   Analytics & Monitoring                     │
│  (Prometheus, Grafana, ELK Stack)                           │
└──────────────────────────────────────────────────────────────┘
```

## Design Decisions & Critiques

### Decision 1: Separate Read and Write Services

**Why?**
- Different scaling requirements (100:1 read/write ratio)
- Different optimization strategies
- Independent scaling and deployment

**Pros:**
- ✅ Read service can scale independently to handle high traffic
- ✅ Write service can optimize for consistency and durability
- ✅ Failures isolated between read and write paths
- ✅ Different caching strategies for each service

**Cons:**
- ❌ Additional complexity in managing two service types
- ❌ Need synchronization between read and write data stores
- ❌ Potential for inconsistency during propagation

**When to use:**
- Read/write ratio > 10:1
- Different latency requirements for reads vs writes
- Need to scale reads and writes independently

**Alternative:**
- Single unified service if read/write ratio is balanced or scale is small

### Decision 2: Message Queue (Kafka) for Fan-out

**Why?**
- Decouple tweet posting from timeline updates
- Handle traffic spikes without overloading database
- Guarantee eventual delivery with retry mechanism
- Scale fan-out workers independently

**Pros:**
- ✅ Asynchronous processing improves write latency
- ✅ Can handle bursts (celebrity tweets)
- ✅ Retry failed timeline updates automatically
- ✅ Easy to add new consumers (analytics, notifications)
- ✅ Persistent queue prevents data loss

**Cons:**
- ❌ Eventual consistency (delay before tweet appears in timeline)
- ❌ Additional infrastructure to maintain
- ❌ Message ordering complexity for concurrent tweets
- ❌ Need dead-letter queue for failed messages

**When to use:**
- High write throughput with async processing acceptable
- Need decoupling between services
- Reliability more important than immediate consistency

**Alternative:**
- Synchronous fan-out if immediate consistency required (not recommended at scale)

### Decision 3: PostgreSQL for Users, Cassandra for Tweets

**Why choose PostgreSQL for users?**
- User data has relationships (follows, blocks)
- ACID transactions needed for account operations
- Moderate scale (300M users fits in sharded PostgreSQL)
- Need complex queries (search users, recommendations)

**Why choose Cassandra for tweets?**
- Time-series data (sorted by timestamp)
- Massive write throughput (2,300 tweets/sec)
- Linear scalability
- Excellent for append-only workloads
- No complex joins needed

**Pros:**
- ✅ Each database optimized for its use case
- ✅ PostgreSQL provides strong consistency for critical user data
- ✅ Cassandra provides high write throughput for tweets
- ✅ Independent scaling of user vs tweet data

**Cons:**
- ❌ Complexity of managing multiple database types
- ❌ Need to join data across systems in application layer
- ❌ Different backup/recovery procedures
- ❌ Team needs expertise in multiple databases

**When to use:**
- Different data access patterns (relational vs time-series)
- One dataset much larger than the other
- Different consistency requirements

**Alternative:**
- Single database (e.g., PostgreSQL with partitioning) if scale is moderate
- NoSQL only (e.g., DynamoDB) if strong consistency not required

## Database Design

### User Service (PostgreSQL)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  verified BOOLEAN DEFAULT FALSE,
  follower_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  tweet_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_username (username),
  INDEX idx_email (email)
);

-- Materialized view for search
CREATE MATERIALIZED VIEW user_search AS
SELECT id, username, display_name, bio, verified, follower_count
FROM users;

CREATE INDEX idx_user_search_name ON user_search
USING gin(to_tsvector('english', display_name || ' ' || username));
```

**Design Critique:**

**Why denormalize counts (follower_count, following_count)?**
- ✅ Avoid expensive COUNT() queries on follows table
- ✅ Display counts on every profile view (very frequent)
- ❌ Need to maintain consistency when follows change
- ❌ Potential race conditions with concurrent updates

**Solution:** Use database triggers or application-level transactions to update counts atomically.

### Tweet Service (Cassandra)

```cql
-- Primary table: tweets by ID
CREATE TABLE tweets (
  tweet_id UUID PRIMARY KEY,
  user_id UUID,
  text TEXT,
  media_urls LIST<TEXT>,
  reply_to UUID,
  created_at TIMESTAMP,
  like_count COUNTER,
  retweet_count COUNTER,
  reply_count COUNTER
);

-- User timeline (all tweets by a user)
CREATE TABLE tweets_by_user (
  user_id UUID,
  tweet_id UUID,
  created_at TIMESTAMP,
  PRIMARY KEY (user_id, created_at, tweet_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Home timeline (precomputed fan-out)
CREATE TABLE timeline (
  user_id UUID,
  tweet_id UUID,
  created_at TIMESTAMP,
  tweet_user_id UUID,
  PRIMARY KEY (user_id, created_at, tweet_id)
) WITH CLUSTERING ORDER BY (created_at DESC);
```

**Design Critique:**

**Why partition tweets_by_user by user_id?**
- ✅ All tweets from one user in same partition (fast queries)
- ✅ Clustering by created_at enables efficient time-range queries
- ❌ Hot partitions for celebrities (millions of tweets)
- ❌ Large partitions can cause performance issues

**Solution:** For celebrities, shard by (user_id, year) or (user_id, month) to limit partition size.

**Why precompute timelines?**
- ✅ Reads are 100x more frequent than writes
- ✅ O(1) query to fetch timeline (single partition read)
- ❌ Storage duplication (same tweet in many timelines)
- ❌ Slow writes for users with many followers

**This leads to the fan-out problem...**

### Follow Graph (PostgreSQL)

```sql
CREATE TABLE follows (
  follower_id UUID,  -- User who follows
  followee_id UUID,  -- User being followed
  created_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (follower_id, followee_id),
  INDEX idx_follower (follower_id),
  INDEX idx_followee (followee_id)
);
```

**Design Critique:**

**Why PostgreSQL instead of Neo4j for graph?**

**PostgreSQL:**
- ✅ Simple bidirectional queries (get followers, get following)
- ✅ Familiarity and existing infrastructure
- ✅ Good performance with proper indexing
- ❌ Poor for complex graph queries (friends of friends)
- ❌ Limited graph algorithms

**Neo4j:**
- ✅ Excellent for complex graph queries
- ✅ Built-in graph algorithms (PageRank, community detection)
- ✅ Better for "friends of friends" queries
- ❌ Another database to manage
- ❌ Overkill for simple follow relationships

**Recommendation:** Start with PostgreSQL, migrate to Neo4j if complex graph queries needed (recommendations, influence analysis).

## API Design

```
POST /api/v1/tweets
Authorization: Bearer <token>
Request:
{
  "text": "Hello World!",
  "media_ids": ["abc123"],  // optional
  "reply_to": null  // optional
}
Response:
{
  "tweet_id": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "id": "user123",
    "username": "johndoe",
    "avatar": "https://cdn.example.com/avatar.jpg"
  },
  "text": "Hello World!",
  "media": [],
  "created_at": "2024-01-01T12:00:00Z",
  "like_count": 0,
  "retweet_count": 0
}

GET /api/v1/timeline/home?cursor={cursor}&limit=20
Response:
{
  "tweets": [...],
  "next_cursor": "xyz789",
  "has_more": true
}

GET /api/v1/timeline/user/{user_id}?cursor={cursor}&limit=20

POST /api/v1/tweets/{tweet_id}/like
DELETE /api/v1/tweets/{tweet_id}/like

POST /api/v1/tweets/{tweet_id}/retweet

POST /api/v1/users/{user_id}/follow
DELETE /api/v1/users/{user_id}/follow

GET /api/v1/search/tweets?q={query}&cursor={cursor}
```

**Design Critique:**

**Why cursor-based pagination instead of offset?**
- ✅ Consistent results even when new tweets added
- ✅ Better performance (no need to skip N rows)
- ✅ Works well with Cassandra's clustering columns
- ❌ Can't jump to arbitrary page
- ❌ Slightly more complex to implement

**Why include user data in tweet response?**
- ✅ Reduces client requests (no need to fetch user separately)
- ✅ Better mobile performance (fewer round trips)
- ❌ Data duplication in responses
- ❌ Larger response size

## Timeline Generation: The Fan-out Problem

This is the most challenging part of Twitter's design.

### Approach 1: Fan-out on Write (Push Model)

```python
def post_tweet(user_id, tweet_content):
    # 1. Create tweet
    tweet = create_tweet(user_id, tweet_content)

    # 2. Get all followers
    followers = graph_db.query("""
        SELECT follower_id FROM follows WHERE followee_id = ?
    """, user_id)

    # 3. Fan out to followers' timelines (async via Kafka)
    for follower_id in followers:
        kafka.publish('timeline-update', {
            'user_id': follower_id,
            'tweet_id': tweet['tweet_id'],
            'created_at': tweet['created_at']
        })

    return tweet

# Worker processing timeline updates
def timeline_update_worker():
    while True:
        message = kafka.consume('timeline-update')

        cassandra.execute("""
            INSERT INTO timeline (user_id, tweet_id, created_at)
            VALUES (?, ?, ?)
        """, message['user_id'], message['tweet_id'], message['created_at'])

# Reading timeline is simple
def get_timeline(user_id, limit=20):
    return cassandra.execute("""
        SELECT * FROM timeline
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, user_id, limit)
```

**Pros:**
- ✅ **Fast reads** (critical for user experience)
- ✅ **Simple query** (single partition read in Cassandra)
- ✅ **Timeline available immediately** when user opens app
- ✅ **Predictable read latency** (always O(1))

**Cons:**
- ❌ **Slow writes** if user has many followers
- ❌ **Storage intensive** (same tweet duplicated in millions of timelines)
- ❌ **Celebrity problem**: If user has 100M followers:
  - 100M timeline writes per tweet
  - Hours to complete fan-out
  - Wasted effort if followers never check timeline

**When to use:**
- User has < 10,000 followers
- Read latency is critical
- Storage is cheap

### Approach 2: Fan-out on Read (Pull Model)

```python
def get_timeline(user_id, limit=20):
    # 1. Get all users this user follows
    following = graph_db.query("""
        SELECT followee_id FROM follows WHERE follower_id = ?
    """, user_id)

    # 2. Fetch tweets from each
    all_tweets = []
    for followee_id in following:
        tweets = cassandra.execute("""
            SELECT * FROM tweets_by_user
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, followee_id, limit)
        all_tweets.extend(tweets)

    # 3. Merge and sort
    all_tweets.sort(key=lambda t: t['created_at'], reverse=True)

    # 4. Return top N
    return all_tweets[:limit]
```

**Pros:**
- ✅ **Fast writes** (just save tweet, no fan-out)
- ✅ **No storage duplication**
- ✅ **Always up-to-date** (no stale timelines)
- ✅ **No wasted work** (only compute when user requests)

**Cons:**
- ❌ **Slow reads** (N queries where N = number of people you follow)
- ❌ **High latency** (if you follow 500 people, need 500 queries + merge)
- ❌ **Database load** (every timeline view hits database)
- ❌ **Unpredictable latency** (depends on how many people you follow)

**When to use:**
- User follows many people (> 5,000)
- Writes more critical than reads
- Storage expensive

### Approach 3: Hybrid (Twitter's Production Approach) ⭐

```python
CELEBRITY_THRESHOLD = 10000

def post_tweet(user_id, tweet_content):
    tweet = create_tweet(user_id, tweet_content)

    follower_count = get_follower_count(user_id)

    if follower_count < CELEBRITY_THRESHOLD:
        # Regular user: fan-out on write
        followers = get_followers(user_id)
        for follower_id in followers:
            kafka.publish('timeline-update', {
                'user_id': follower_id,
                'tweet': tweet
            })
    else:
        # Celebrity: skip fan-out
        # Followers will fetch celebrity tweets on read
        mark_as_celebrity(user_id)

    return tweet

def get_timeline(user_id, limit=20):
    # 1. Get precomputed timeline (regular users)
    precomputed = cassandra.execute("""
        SELECT * FROM timeline
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, user_id, limit * 2)  # Fetch extra for merging

    # 2. Get celebrities this user follows
    celebrities = graph_db.query("""
        SELECT followee_id FROM follows
        WHERE follower_id = ?
        AND followee_id IN (SELECT user_id FROM celebrities)
    """, user_id)

    # 3. Fetch recent tweets from celebrities (on-demand)
    celebrity_tweets = []
    for celeb_id in celebrities:
        tweets = cassandra.execute("""
            SELECT * FROM tweets_by_user
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, celeb_id, limit)
        celebrity_tweets.extend(tweets)

    # 4. Merge precomputed + celebrity tweets
    all_tweets = precomputed + celebrity_tweets
    all_tweets.sort(key=lambda t: t['created_at'], reverse=True)

    # 5. Return top N
    return all_tweets[:limit]
```

**Pros:**
- ✅ **Fast for most users** (90%+ have precomputed timeline)
- ✅ **Scales for celebrities** (no 100M fan-out)
- ✅ **Best of both worlds**
- ✅ **Flexible threshold** (can adjust based on metrics)

**Cons:**
- ❌ **More complex** implementation and testing
- ❌ **Slight latency increase** for users following celebrities
- ❌ **Need to maintain celebrity list**
- ❌ **Edge cases** when user crosses threshold

**Why this is optimal:**
- 90% of users have < 10K followers → fast writes
- 90% of users follow < 1K people → fast reads from cache
- 10% celebrities → no fan-out waste
- Trade-off: 10% of users have slightly slower reads (but still < 500ms)

### Cache Layer (Redis)

```python
def get_timeline(user_id, limit=20):
    # 1. Check cache
    cache_key = f"timeline:{user_id}"
    cached = redis.get(cache_key)

    if cached:
        return json.loads(cached)

    # 2. Cache miss: compute timeline
    timeline = compute_timeline(user_id, limit)

    # 3. Store in cache (5 minutes TTL)
    redis.setex(cache_key, 300, json.dumps(timeline))

    return timeline

# Invalidation strategy
def post_tweet(user_id, tweet_content):
    tweet = create_tweet(user_id, tweet_content)

    # Async invalidation
    followers = get_followers(user_id)
    for follower_id in followers:
        redis.delete(f"timeline:{follower_id}")

    return tweet
```

**Performance Impact:**
```
Without cache:
- Every timeline request hits Cassandra
- Latency: ~50ms

With cache (80% hit rate):
- 80% requests: Redis (5ms)
- 20% requests: Cassandra (50ms)
- Average: 0.8 × 5ms + 0.2 × 50ms = 14ms
- Result: 3.5x faster!
```

**Design Critique:**

**Why 5-minute TTL instead of longer?**
- ✅ Balance between freshness and cache efficiency
- ✅ New tweets appear within reasonable time
- ❌ Invalidation still needed for real-time updates

**Why invalidate on write instead of update?**
- ✅ Simpler (no need to construct updated timeline)
- ✅ Lazy load on next request
- ❌ Cache miss on next read

## Scaling Strategies

### 1. Database Sharding

**Shard by user_id (consistent hashing):**

```python
def get_shard(user_id):
    return hash(user_id) % NUM_SHARDS

# Write tweet
shard = get_shard(tweet.user_id)
shards[shard].execute("INSERT INTO tweets ...")

# Read user's tweets
shard = get_shard(user_id)
tweets = shards[shard].execute("SELECT * FROM tweets WHERE user_id = ?")
```

**Pros:**
- ✅ Even distribution of data
- ✅ Each shard handles 1/N of load
- ✅ Linear scalability

**Cons:**
- ❌ Can't do cross-shard queries easily
- ❌ Resharding is complex (need consistent hashing)
- ❌ Hotspots if hash function not uniform

**When to use:**
- Single database can't handle load
- Data can be partitioned by a key (user_id, tweet_id)
- Cross-shard queries not critical

### 2. Replication (Master-Slave)

```
┌─────────────┐
│   Master    │  (Writes)
└──────┬──────┘
       │
  ┌────┴────┐
  │         │
┌─▼───┐  ┌─▼───┐
│Slave│  │Slave│  (Reads)
└─────┘  └─────┘
```

**Pros:**
- ✅ Read scalability (distribute reads across slaves)
- ✅ Fault tolerance (if master fails, promote slave)
- ✅ Backup for disaster recovery

**Cons:**
- ❌ Replication lag (slaves slightly behind master)
- ❌ Master is single point of failure (need master-master)
- ❌ Write scalability limited by master

**When to use:**
- Read-heavy workload (Twitter is 100:1)
- Need high availability
- Can tolerate eventual consistency

### 3. CDN for Media

```
Upload: User → API → S3 → CloudFront invalidation
Download: User → CloudFront (edge) → S3 (origin, if cache miss)

Performance:
- 95% cache hit rate
- 95% requests served from edge (< 50ms)
- 5% from S3 origin (< 200ms)
- Average: 0.95 × 50 + 0.05 × 200 = 57.5ms

Cost savings:
- Without CDN: 10TB/day × $0.09/GB = $900/day
- With CDN: 10TB × $0.085/GB (CloudFront) = $850/day
- Plus 95% less S3 egress
- Total savings: ~40%
```

## Bottlenecks & Solutions

### Bottleneck 1: Celebrity Tweet Storm

**Problem:** Celebrity posts tweet → 100M follower timelines need updating → hours to complete

**Solution:** Hybrid fan-out (skip fan-out for celebrities, lazy load on read)

### Bottleneck 2: Database Hotspots

**Problem:** Millions of users request same celebrity's tweets → one shard overloaded

**Solutions:**
- Cache celebrity tweets aggressively (Redis with 1-hour TTL)
- Replicate celebrity data across multiple shards (denormalization)
- Use read replicas for popular user queries

### Bottleneck 3: Timeline Generation Lag

**Problem:** Post tweet → followers see it 10 minutes later

**Solutions:**
- Scale up Kafka throughput (1M messages/sec)
- Add more fan-out worker pools
- Prioritize close friends' tweets over acquaintances

## Monitoring & Metrics

### Key Metrics

```
Availability:
- Uptime: 99.99% (4 nines = 52 min downtime/year)
- Error rate: < 0.01%

Performance:
- Tweet post latency: p50 < 100ms, p99 < 500ms
- Timeline load latency: p50 < 200ms, p99 < 1s
- Search latency: p50 < 300ms, p99 < 2s

Throughput:
- Write QPS: ~2,300/sec (peak: 7,000)
- Read QPS: ~231,000/sec (peak: 700,000)

Data:
- Database size: 15PB
- Cache hit rate: 80%+
- CDN hit rate: 95%+

Business:
- DAU: 100M
- Tweets per day: 200M
- Average timeline load time: < 300ms
```

### Alerts

- Error rate > 1% for 5 minutes
- Latency p99 > 2s for 5 minutes
- Cache hit rate < 70%
- Database connection pool > 80%
- Kafka consumer lag > 10,000 messages

## Security Considerations

1. **Authentication:** JWT tokens with short expiry (15 min)
2. **Authorization:** Check user can view tweet (public vs protected)
3. **Rate Limiting:** Prevent spam (300 tweets per 3 hours)
4. **Content Moderation:** ML models to detect spam/hate speech
5. **DDoS Protection:** CloudFlare + rate limiting at load balancer
6. **Data Encryption:** HTTPS in transit, AES-256 at rest

## Cost Estimation (AWS)

```
Compute:
- EC2 instances: 500 servers × $100/month = $50,000/month
- Auto-scaling for peak traffic

Storage:
- S3: 15PB × $0.023/GB = $345,000/month
- With lifecycle policies (cold storage): ~$200,000/month

Database:
- Managed Cassandra: $100,000/month
- RDS PostgreSQL: $20,000/month

Cache:
- ElastiCache (Redis): 50 nodes × $200/month = $10,000/month

CDN:
- CloudFront: 10TB/day × 30 days × $0.085/GB = $25,500/month

Message Queue:
- Kafka (MSK): $15,000/month

Load Balancers: $1,000/month

Total: ~$420,000/month (~$5M/year)
Per user: $5M ÷ 100M DAU = $0.05/user/year
```

## Interview Talking Points

### Start with Questions

"Before I start designing, let me clarify a few things:"
- Expected scale? (Daily/monthly active users)
- Read/write ratio?
- Consistency requirements? (Eventual ok?)
- Latency requirements? (What's acceptable for timeline?)
- What features are in scope? (DMs? Notifications?)

### Highlight Key Trade-offs

**Fan-out approach:**
- "The key trade-off is write complexity vs read performance"
- "I'd choose hybrid: push for regular users, pull for celebrities"
- "This optimizes for the common case while handling edge cases"

**Database choice:**
- "SQL vs NoSQL depends on data access patterns"
- "I'd use PostgreSQL for users (ACID), Cassandra for tweets (time-series)"
- "This is polyglot persistence - right tool for right job"

**Consistency:**
- "Based on CAP theorem, I'd choose AP (availability + partition tolerance)"
- "Eventual consistency is acceptable for likes/retweets"
- "But user authentication needs strong consistency"

### Demonstrate Depth

"To handle scale, I would:"
- Shard database by user_id for even distribution
- Cache timelines in Redis (80%+ hit rate)
- Use CDN for media (95% offload)
- Async fan-out via Kafka (prevents write bottlenecks)

"For reliability, I would:"
- Multi-region deployment (disaster recovery)
- Database replication (master-slave for reads)
- Circuit breakers (prevent cascading failures)
- Graceful degradation (show cached timeline if DB down)

"I would monitor:"
- Latency percentiles (p50, p95, p99)
- Error rates by endpoint
- QPS (reads vs writes)
- Cache hit rates
- Database query performance
- Queue depth (Kafka lag)

