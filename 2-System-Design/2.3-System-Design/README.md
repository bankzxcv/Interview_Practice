# Complete System Design Problems

## Table of Contents
1. [Design Twitter](#1-design-twitter)
2. [Design Instagram](#2-design-instagram)
3. [Design URL Shortener](#3-design-url-shortener)
4. [Design Uber/Lyft](#4-design-uberlyft)
5. [Design Netflix](#5-design-netflix)
6. [Design WhatsApp/Messenger](#6-design-whatsappmessenger)
7. [Design YouTube](#7-design-youtube)
8. [Design Google Drive/Dropbox](#8-design-google-drivedropbox)
9. [Design Ticketmaster](#9-design-ticketmaster)
10. [Design Web Crawler](#10-design-web-crawler)
11. [Design Distributed Cache](#11-design-distributed-cache)
12. [Design Yelp/Nearby Places](#12-design-yelp-nearby-places)
13. [Design Rate Limiter (System Level)](#13-design-rate-limiter-system-level)
14. [Design Notification System](#14-design-notification-system)
15. [Design News Feed (System Level)](#15-design-news-feed-system-level)

---

## 1. Design Twitter

### Requirements Clarification

**Functional Requirements**:
- Post tweets (280 characters, images, videos)
- Follow other users
- Home timeline (tweets from people you follow)
- User timeline (tweets from specific user)
- Like and retweet
- Search tweets

**Non-Functional Requirements**:
- High availability (99.99%)
- Low latency (timeline loads in < 500ms)
- Eventual consistency acceptable
- Scale: 300M users, 100M DAU
- Heavy read (100:1 read/write ratio)

**Out of Scope** (clarify in interview):
- Direct messages
- Trending topics
- Notifications

### Capacity Estimation

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
- Tweets: 100M users * 2 tweets/day = 200M tweets/day
- Per second: 200M / 86,400 = ~2,300 tweets/sec
- Peak (3x): ~7,000 tweets/sec

Read Traffic:
- Timeline views: 100M users * 10 views/day = 1B views/day
- Tweets read: 1B views * 20 tweets = 20B tweet reads/day
- Per second: 20B / 86,400 = ~231,000 reads/sec
- Peak (3x): ~700,000 reads/sec

Ratio: 100:1 read-heavy (as expected)

Storage (5 years):
- Tweets per day: 200M
- Total tweets: 200M * 365 * 5 = 365B tweets

Tweet Storage:
- Text: 280 chars * 2 bytes = 560 bytes
- Metadata (user_id, timestamp, etc.): 200 bytes
- Average per tweet: ~1KB (conservative)

Total tweet data: 365B * 1KB = 365TB

Media Storage:
- 20% of tweets have media
- Average media size: 200KB (compressed image)
- Media tweets: 365B * 0.2 = 73B
- Total media: 73B * 200KB = 14.6PB

Total Storage: ~15PB (with 3x replication: ~45PB)

User Data:
- 300M users * 10KB (profile, bio, etc.) = 3TB (negligible)

Follow Relationships:
- Average user follows 200 people
- 300M users * 200 follows * 8 bytes (user_id) = 480GB (negligible)

Timeline Cache:
- 100M active users * 20 tweets * 1KB = 2TB in memory (manageable)

Bandwidth:
- Write: 2,300 tweets/sec * 1KB = 2.3MB/sec (negligible)
- Media uploads: 2,300 * 0.2 * 200KB = 92MB/sec
- Read: 231,000 reads/sec * 1KB = 231MB/sec
- Media downloads: 231,000 * 0.2 * 200KB = 9.2GB/sec

Total bandwidth: ~10GB/sec (need CDN!)
```

### High-Level Architecture

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

### API Design

```
POST /api/v1/tweets
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
  "tweets": [
    {
      "tweet_id": "...",
      "user": {...},
      "text": "...",
      "created_at": "...",
      "like_count": 42,
      "retweet_count": 10
    },
    ...
  ],
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

### Database Design

**User Service (PostgreSQL)**:

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

**Tweet Service (Cassandra)** - Optimized for time-series data:

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

-- Why this schema?
-- - Partition key: user_id (all tweets by user in same partition)
-- - Clustering key: created_at (sorted by time, newest first)
-- - Efficient query: "Give me latest 20 tweets by user X"

-- Home timeline (precomputed fan-out)
CREATE TABLE timeline (
  user_id UUID,
  tweet_id UUID,
  created_at TIMESTAMP,
  tweet_user_id UUID,
  PRIMARY KEY (user_id, created_at, tweet_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Why precompute?
-- Read-heavy system: compute once on write, read many times
```

**Follow Graph (PostgreSQL or Neo4j)**:

```sql
-- PostgreSQL approach
CREATE TABLE follows (
  follower_id UUID,  -- User who follows
  followee_id UUID,  -- User being followed
  created_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (follower_id, followee_id),
  INDEX idx_follower (follower_id),
  INDEX idx_followee (followee_id)
);

-- Queries:
-- Get followers: SELECT follower_id FROM follows WHERE followee_id = ?
-- Get following: SELECT followee_id FROM follows WHERE follower_id = ?
-- Check if following: SELECT * FROM follows WHERE follower_id = ? AND followee_id = ?

-- For large graphs (celebrities with millions of followers),
-- use Neo4j for better performance on graph queries
```

**Likes (Cassandra)**:

```cql
CREATE TABLE likes (
  tweet_id UUID,
  user_id UUID,
  created_at TIMESTAMP,
  PRIMARY KEY (tweet_id, user_id)
);

-- Check if user liked tweet: O(1)
-- Get all users who liked tweet: scan partition (for display)
```

### Timeline Generation: Fan-out Approaches

**The Core Challenge**: When user posts tweet, who sees it in their timeline?

---

**Approach 1: Fan-out on Write (Twitter's Original Approach)**

```
User A posts tweet
→ Find all followers of User A (say 1000 followers)
→ Write tweet to each follower's timeline
→ Result: 1000 writes

When follower opens timeline:
→ Read from their precomputed timeline
→ Fast read! (O(1) query)
```

**Implementation**:

```python
def post_tweet(user_id, tweet_content):
    # 1. Create tweet
    tweet = {
        'tweet_id': generate_uuid(),
        'user_id': user_id,
        'text': tweet_content,
        'created_at': now()
    }

    # 2. Save to database
    cassandra.execute("""
        INSERT INTO tweets (tweet_id, user_id, text, created_at)
        VALUES (?, ?, ?, ?)
    """, tweet['tweet_id'], user_id, tweet_content, now())

    # 3. Get all followers
    followers = graph_db.query("""
        SELECT follower_id FROM follows WHERE followee_id = ?
    """, user_id)

    # 4. Fan out to followers' timelines (async via message queue)
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

**Pros**:
- ✅ Fast reads (critical for user experience)
- ✅ Simple query (single partition read)
- ✅ Timeline available immediately

**Cons**:
- ❌ Slow writes (if user has 1M followers)
- ❌ Storage intensive (duplicate data)
- ❌ Celebrity problem (Justin Bieber has 100M followers!)

**When**: Most users (< 10K followers)

---

**Approach 2: Fan-out on Read (Pull Model)**

```
User opens timeline
→ Find all users they follow (say 500)
→ Fetch latest tweets from each (500 queries)
→ Merge and sort by timestamp
→ Return top 20
```

**Implementation**:

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

**Pros**:
- ✅ Fast writes (just save tweet)
- ✅ No storage duplication
- ✅ Always up-to-date

**Cons**:
- ❌ Slow reads (500 queries + merge)
- ❌ High latency (unacceptable for Twitter)
- ❌ Database load (every timeline view)

**When**: User follows many people, writes more critical than reads

---

**Approach 3: Hybrid (Twitter's Current Approach)** ⭐ BEST

```
Regular users (< 10K followers):
  → Fan-out on write

Celebrities (> 10K followers):
  → Fan-out on read (lazy loading)

Timeline = Precomputed timeline + Celebrity tweets (merged on read)
```

**Implementation**:

```python
CELEBRITY_THRESHOLD = 10000

def post_tweet(user_id, tweet_content):
    tweet = create_tweet(user_id, tweet_content)

    followers = get_followers(user_id)

    if len(followers) < CELEBRITY_THRESHOLD:
        # Regular user: fan-out on write
        for follower_id in followers:
            kafka.publish('timeline-update', {
                'user_id': follower_id,
                'tweet': tweet
            })
    else:
        # Celebrity: skip fan-out
        # Followers will fetch celebrity tweets on read
        pass

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
        AND followee_id IN (SELECT user_id FROM users WHERE follower_count > ?)
    """, user_id, CELEBRITY_THRESHOLD)

    # 3. Fetch recent tweets from celebrities
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

**Pros**:
- ✅ Fast for most users (precomputed)
- ✅ Scales for celebrities (no fan-out storm)
- ✅ Best of both worlds

**Cons**:
- ❌ More complex
- ❌ Slight latency for celebrity followers

**When**: Production at scale (Twitter's actual approach)

---

**Optimization: Redis Cache Layer**

```python
def get_timeline(user_id, limit=20):
    # 1. Check Redis cache
    cache_key = f"timeline:{user_id}"
    cached = redis.get(cache_key)

    if cached:
        return json.loads(cached)

    # 2. Cache miss: compute timeline
    timeline = compute_timeline(user_id, limit)

    # 3. Store in cache (5 minutes TTL)
    redis.setex(cache_key, 300, json.dumps(timeline))

    return timeline

# Invalidation on new tweet
def post_tweet(user_id, tweet_content):
    tweet = create_tweet(user_id, tweet_content)

    followers = get_followers(user_id)

    # Invalidate cache for followers
    for follower_id in followers:
        redis.delete(f"timeline:{follower_id}")

    return tweet
```

**Performance Impact**:
- Cache hit rate: ~80%
- 80% of timeline requests: <5ms (Redis)
- 20% cache misses: ~50ms (Cassandra)
- Average latency: 0.8 * 5ms + 0.2 * 50ms = 14ms
- **10x faster than no cache!**

### Scaling Strategies

**1. Database Sharding**

**Tweets Sharded by User ID**:

```
Shard 1: user_id hash % 4 == 0
Shard 2: user_id hash % 4 == 1
Shard 3: user_id hash % 4 == 2
Shard 4: user_id hash % 4 == 3

# Route tweets to shard
def get_shard(user_id):
    return hash(user_id) % NUM_SHARDS

# Write tweet
shard = get_shard(user_id)
shards[shard].execute("INSERT INTO tweets ...")

# Read user's tweets
shard = get_shard(user_id)
tweets = shards[shard].execute("SELECT * FROM tweets WHERE user_id = ?")
```

**Pros**:
- Even distribution
- Each shard handles 25% of load

**Cons**:
- Can't do cross-shard queries easily
- Resharding is hard (need consistent hashing)

---

**2. Replication**

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

# Write to master
master.execute("INSERT INTO tweets ...")

# Read from slaves (distribute load)
slave = random.choice(slaves)
slave.execute("SELECT * FROM tweets ...")
```

**Pros**:
- Read scalability (100:1 ratio benefits)
- Fault tolerance

**Cons**:
- Replication lag (eventual consistency)
- Master is single point of failure (use master-master)

---

**3. CDN for Media**

```
# Upload flow
User → API Server → S3 → CloudFront (CDN)

# Download flow
User → CloudFront (cached) → Fast!

# 95% of media served from CDN edge locations
# Reduces origin server load by 95%
```

---

**4. Load Balancing**

```
┌──────────┐
│   User   │
└─────┬────┘
      │
┌─────▼────────┐
│Load Balancer │  (AWS ELB / nginx)
└─────┬────────┘
      │
  ┌───┴────┬────────┬────────┐
  │        │        │        │
┌─▼──┐  ┌─▼──┐  ┌─▼──┐  ┌─▼──┐
│API1│  │API2│  │API3│  │API4│  (Auto-scaled)
└────┘  └────┘  └────┘  └────┘

# Health checks
# Remove failed instances
# Distribute load evenly
```

### Deep Dives

**1. Search (Elasticsearch)**

```javascript
// Index tweets
PUT /tweets/_doc/tweet123
{
  "user_id": "user456",
  "username": "johndoe",
  "text": "Hello world from Twitter!",
  "created_at": "2024-01-01T12:00:00Z",
  "hashtags": ["hello", "twitter"],
  "like_count": 42
}

// Search query
GET /tweets/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text": "hello world" } }
      ],
      "filter": [
        { "range": { "created_at": { "gte": "now-7d" } } }
      ]
    }
  },
  "sort": [
    { "created_at": { "order": "desc" } }
  ],
  "size": 20
}
```

**Ranking**:
- Recency (recent tweets ranked higher)
- Engagement (likes, retweets)
- User reputation (verified, follower count)
- Personalization (based on user's interests)

---

**2. Real-Time Updates (WebSocket)**

```javascript
// Client
const ws = new WebSocket('wss://stream.twitter.com');

ws.onmessage = (event) => {
  const tweet = JSON.parse(event.data);
  // Show "New tweets available" banner
  showNotification(tweet);
};

// Server (pub/sub with Redis)
def on_new_tweet(tweet):
    # Publish to followers' channels
    followers = get_followers(tweet['user_id'])

    for follower_id in followers:
        redis.publish(f"user:{follower_id}:feed", json.dumps(tweet))

# WebSocket server subscribes to user's channel
def handle_websocket(user_id, websocket):
    pubsub = redis.pubsub()
    pubsub.subscribe(f"user:{user_id}:feed")

    for message in pubsub.listen():
        websocket.send(message['data'])
```

---

**3. Rate Limiting**

```python
# Prevent spam
# Limit: 300 tweets per 3 hours

def can_post_tweet(user_id):
    key = f"ratelimit:tweet:{user_id}"
    current = redis.get(key) or 0

    if int(current) >= 300:
        return False

    # Increment and set expiry
    pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, 3 * 3600)  # 3 hours
    pipeline.execute()

    return True
```

### Bottlenecks and Solutions

**Bottleneck 1: Celebrity Writes**

**Problem**: Justin Bieber tweets → 100M timeline updates → hours to complete

**Solution**: Hybrid fan-out (covered above)

---

**Bottleneck 2: Database Hotspots**

**Problem**: Everyone queries tweets from same celebrity → one shard overloaded

**Solution**:
- Cache celebrity tweets aggressively (Redis)
- Replicate celebrity data across multiple shards
- Use CDN for celebrity profiles

---

**Bottleneck 3: Timeline Lag**

**Problem**: Post tweet → followers see it 10 minutes later

**Solution**:
- Async fan-out via Kafka (1M messages/sec)
- Multiple worker pools
- Prioritize: friends' tweets > acquaintances

### Monitoring

**Key Metrics**:

```
Availability:
- Uptime: 99.99% (4 nines)
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
- Cache hit rate: 80%
- CDN hit rate: 95%

Business:
- DAU: 100M
- Tweets per day: 200M
- Average timeline load time: 300ms
```

**Alerting**:
- Error rate > 1% for 5 minutes
- Latency p99 > 2s for 5 minutes
- Cache hit rate < 70%
- Database connection pool > 80%

### Security

**1. Authentication**: JWT tokens
**2. Authorization**: Check user can view tweet (public vs protected accounts)
**3. Rate Limiting**: Prevent spam and abuse
**4. Content Moderation**: ML models to detect spam, hate speech
**5. DDoS Protection**: CloudFlare, rate limiting
**6. Data Encryption**: HTTPS, encrypted at rest

### Cost Estimation (AWS)

```
Compute:
- EC2 instances: 500 servers * $100/month = $50,000/month
- Auto-scaling for peak

Storage:
- S3: 15PB * $0.023/GB = $345,000/month
- With lifecycle policies (cold storage): ~$200,000/month

Database:
- DynamoDB/Cassandra: $100,000/month

Cache:
- ElastiCache (Redis): 50 nodes * $200/month = $10,000/month

CDN:
- CloudFront: 10TB/day * 30 days * $0.085/GB = $25,500/month

Load Balancers:
- $1,000/month

Total: ~$390,000/month (~$4.7M/year)

Per user cost: $4.7M / 100M DAU = $0.047/user/year
```

### Interview Talking Points

**"I would start by asking..."**
- What's the expected scale? (100M DAU)
- Read/write ratio? (100:1 read-heavy)
- Consistency requirements? (eventual consistency ok)
- Latency requirements? (<500ms for timeline)

**"The key trade-off is..."**
- **Fan-out on write vs read**: Write complexity vs read performance
  - I'd choose hybrid: write for regular users, read for celebrities
- **SQL vs NoSQL**: ACID vs scale
  - I'd use PostgreSQL for users, Cassandra for tweets (time-series)
- **Consistency vs Availability**: CAP theorem
  - I'd choose AP (availability + partition tolerance), eventual consistency

**"To handle scale..."**
- Shard database by user_id (even distribution)
- Cache timelines in Redis (80% hit rate)
- Use CDN for media (95% offload)
- Async fan-out via Kafka (1M msgs/sec)

**"For reliability..."**
- Multi-region deployment
- Database replication (master-slave)
- Circuit breakers for failing services
- Graceful degradation (show cached timeline if DB down)

**"I would monitor..."**
- Latency (p50, p95, p99)
- Error rate
- QPS (writes, reads)
- Cache hit rate
- Database query time

---

## 2. Design Instagram

### Requirements Clarification

**Functional Requirements**:
- Upload photos/videos
- Follow users
- News feed (posts from followed users)
- Like and comment on posts
- Direct messaging
- Stories (24-hour expiry)

**Non-Functional Requirements**:
- High availability
- Low latency for feed
- Eventual consistency ok
- 500M DAU
- Photo-heavy (100MB photos)

### Capacity Estimation

```
Users:
- 1B total users
- 500M daily active users (DAU)

Traffic:
- Each user uploads 2 photos/day
- Each user views feed 20 times/day

Uploads:
- 500M * 2 = 1B photos/day
- Per second: 1B / 86,400 = ~11,500 uploads/sec
- Peak (3x): ~35,000 uploads/sec

Feed Views:
- 500M * 20 = 10B feed views/day
- Per second: 10B / 86,400 = ~115,700 views/sec
- Peak: ~350,000 views/sec

Storage (5 years):
- Photos: 1B/day * 365 * 5 = 1.825 trillion photos

Photo Size:
- Original: 5MB (average)
- Thumbnail: 50KB
- Multiple resolutions: 200KB (mobile), 500KB (web), 5MB (original)
- Total per photo: ~6MB

Total storage: 1.825T * 6MB = ~11 petabytes (PB)
With 3x replication: ~33PB

Bandwidth:
- Upload: 11,500/sec * 5MB = 57.5GB/sec
- Download: 115,700/sec * 500KB (web) = 57.85GB/sec
- Total: ~115GB/sec (CDN essential!)
```

### High-Level Architecture

```
┌────────────────────────────────────────────────┐
│              Client (Mobile/Web)               │
└────────────┬───────────────────────────────────┘
             │
┌────────────▼───────────────────────────────────┐
│                    CDN                         │
│  (Serve images, videos, static assets)        │
│  Cache hit rate: 90%+                          │
└────────────┬───────────────────────────────────┘
             │
┌────────────▼───────────────────────────────────┐
│              Load Balancer                     │
└────────────┬───────────────────────────────────┘
             │
        ┌────┴────┐
        │         │
┌───────▼────┐ ┌──▼────────┐
│  Upload    │ │   Feed    │
│  Service   │ │  Service  │
└───────┬────┘ └──┬────────┘
        │         │
        │    ┌────▼────────────┐
        │    │  Redis Cache    │
        │    │  (Feed cache)   │
        │    └─────────────────┘
        │
┌───────▼──────────────────────────────┐
│      Object Storage (S3)             │
│  ┌────────────────────────────────┐  │
│  │  Images (original + resized)   │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
        │
┌───────▼──────────────────────────────┐
│         Message Queue                │
│  ┌──────────┐  ┌──────────────┐     │
│  │Image     │  │ Feed         │     │
│  │Processing│  │ Fan-out      │     │
│  └──────────┘  └──────────────┘     │
└──────────────────────────────────────┘
        │
┌───────▼──────────────────────────────┐
│            Databases                 │
│  ┌──────────┐  ┌──────────────┐     │
│  │ User DB  │  │  Post DB     │     │
│  │(Postgres)│  │ (Cassandra)  │     │
│  └──────────┘  └──────────────┘     │
│  ┌──────────┐  ┌──────────────┐     │
│  │ Graph DB │  │  Analytics   │     │
│  │(follows) │  │  (ClickHouse)│     │
│  └──────────┘  └──────────────┘     │
└──────────────────────────────────────┘
```

### Database Design

**Users (PostgreSQL)**:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  profile_pic_url VARCHAR(500),
  follower_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Posts (Cassandra)**:

```cql
-- Posts by ID
CREATE TABLE posts (
  post_id UUID PRIMARY KEY,
  user_id UUID,
  image_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  location TEXT,
  like_count COUNTER,
  comment_count COUNTER,
  created_at TIMESTAMP
);

-- User's posts (for profile page)
CREATE TABLE posts_by_user (
  user_id UUID,
  post_id UUID,
  created_at TIMESTAMP,
  thumbnail_url TEXT,
  PRIMARY KEY (user_id, created_at, post_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Feed (precomputed)
CREATE TABLE feed (
  user_id UUID,
  post_id UUID,
  post_user_id UUID,
  created_at TIMESTAMP,
  PRIMARY KEY (user_id, created_at, post_id)
) WITH CLUSTERING ORDER BY (created_at DESC);
```

### Image Upload Flow

```python
def upload_image(user_id, image_file):
    # 1. Generate unique ID
    image_id = generate_uuid()

    # 2. Upload to S3 (original)
    s3_key = f"images/original/{image_id}.jpg"
    s3.upload(s3_key, image_file)

    # 3. Queue image processing
    kafka.publish('image-processing', {
        'image_id': image_id,
        's3_key': s3_key,
        'user_id': user_id
    })

    # 4. Return immediately (async processing)
    return {
        'image_id': image_id,
        'status': 'processing'
    }

# Worker: Image processing
def process_image():
    message = kafka.consume('image-processing')

    # Download original
    image = s3.download(message['s3_key'])

    # Generate multiple sizes
    sizes = {
        'thumbnail': (150, 150),
        'mobile': (640, 640),
        'web': (1080, 1080)
    }

    for name, (width, height) in sizes.items():
        resized = resize_image(image, width, height)
        s3_key = f"images/{name}/{message['image_id']}.jpg"
        s3.upload(s3_key, resized)

    # Update database
    db.execute("""
        INSERT INTO posts (post_id, user_id, image_url, thumbnail_url, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, ...)

    # Trigger feed fan-out
    kafka.publish('feed-fanout', {
        'post_id': message['image_id'],
        'user_id': message['user_id']
    })
```

**Why async processing?**
- Upload 5MB → ~1 second
- Process 4 sizes → ~5 seconds
- Total: 6 seconds if synchronous

With async:
- User experience: 1 second (upload)
- Background processing: 5 seconds
- **6x faster perceived latency!**

### Feed Generation

Similar to Twitter's hybrid approach:

```python
def generate_feed(user_id, limit=20):
    # 1. Get from cache
    cache_key = f"feed:{user_id}"
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)

    # 2. Get precomputed feed
    feed = cassandra.execute("""
        SELECT * FROM feed
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, user_id, limit)

    # 3. Cache for 5 minutes
    redis.setex(cache_key, 300, json.dumps(feed))

    return feed

# Fan-out on write (async)
def fanout_post(post_id, user_id):
    followers = graph_db.get_followers(user_id)

    # Batch insert
    batch_size = 1000
    for i in range(0, len(followers), batch_size):
        batch = followers[i:i+batch_size]

        cassandra.execute_batch([
            f"INSERT INTO feed (user_id, post_id, created_at) VALUES ('{f}', '{post_id}', NOW())"
            for f in batch
        ])
```

### Ranking Algorithm

Instagram doesn't show chronological feed. It ranks posts by:

```python
def rank_feed(posts, user_id):
    user_interests = get_user_interests(user_id)  # ML model

    scored_posts = []
    for post in posts:
        score = (
            0.5 * engagement_score(post) +  # likes, comments
            0.3 * recency_score(post) +     # newer = higher
            0.2 * interest_match(post, user_interests)  # personalization
        )
        scored_posts.append((post, score))

    # Sort by score
    scored_posts.sort(key=lambda x: x[1], reverse=True)

    return [post for post, score in scored_posts]

def engagement_score(post):
    # Normalize by post age
    age_hours = (now() - post.created_at).hours
    return (post.like_count + post.comment_count * 2) / max(age_hours, 1)
```

### Stories (24-hour Expiry)

```python
# Stories stored separately (expire after 24 hours)

CREATE TABLE stories (
  story_id UUID,
  user_id UUID,
  media_url TEXT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  PRIMARY KEY (user_id, created_at, story_id)
) WITH default_time_to_live = 86400;  -- 24 hours

# Get active stories
def get_stories(user_id):
    following = get_following(user_id)

    stories = cassandra.execute("""
        SELECT * FROM stories
        WHERE user_id IN ?
        AND created_at > ?
    """, following, now() - timedelta(hours=24))

    return stories

# Cassandra TTL automatically deletes expired stories
# No manual cleanup needed!
```

### Optimization: Image CDN

```
┌──────────┐
│  Client  │
└─────┬────┘
      │
      │ Request: GET /images/web/abc123.jpg
      │
┌─────▼──────────────┐
│  CloudFront (CDN)  │
│  ┌──────────────┐  │
│  │ Edge Cache   │  │ ← 90% served from here (< 50ms)
│  └──────────────┘  │
└─────┬──────────────┘
      │ 10% cache miss
┌─────▼──────────────┐
│   S3 (Origin)      │
│                    │ ← 10% from origin (~200ms)
└────────────────────┘

# Performance improvement:
# Before CDN: 100% from S3, avg latency = 200ms
# After CDN: 90% from edge (50ms) + 10% from S3 (200ms)
# Avg latency: 0.9 * 50 + 0.1 * 200 = 65ms
# 3x faster!

# Cost improvement:
# S3 bandwidth: $0.09/GB
# CloudFront: $0.085/GB (cheaper at scale!)
# Plus 90% less S3 egress
```

---

## Quick Reference: Remaining System Design Problems

### 3. URL Shortener
- **Hash function**: MD5 → Base62
- **Key generation service**: Pre-generate keys
- **Database**: key-value store (DynamoDB)
- **Analytics**: Click tracking, geolocation
- **Custom URLs**: Reservation system
- **Scale**: 1B URLs, 100K QPS

### 4. Uber/Lyft
- **Geospatial indexing**: Geohash, QuadTree
- **Real-time matching**: Redis Geo, WebSocket
- **ETA calculation**: Routing algorithms
- **Surge pricing**: Demand/supply algorithm
- **Driver location**: Stream processing (Kafka)

### 5. Netflix
- **Video encoding**: Multiple resolutions (4K, 1080p, 720p)
- **Adaptive bitrate**: HLS, DASH
- **CDN**: 95% traffic served from edge
- **Recommendation**: Collaborative filtering, ML
- **Download**: Encrypted offline viewing

### 6. WhatsApp/Messenger
- **Message delivery**: XMPP, WebSocket
- **Read receipts**: Ack system
- **Group chat**: Message broadcasting
- **Media sharing**: S3 + CDN
- **End-to-end encryption**: Signal protocol
- **Online status**: Presence service

### 7. YouTube
- **Video upload**: Chunked upload, resumable
- **Transcoding**: FFmpeg, multiple formats
- **CDN**: Distributed edge servers
- **View count**: Eventually consistent counters
- **Recommendations**: Collaborative filtering
- **Comments**: Nested threading

### 8. Google Drive/Dropbox
- **File sync**: Delta sync, merkle trees
- **Conflict resolution**: Last-write-wins, CRDTs
- **Chunking**: 4MB blocks
- **Deduplication**: Hash-based
- **Versioning**: Copy-on-write
- **Sharing**: Access control lists

### 9. Ticketmaster
- **Inventory management**: Pessimistic locking
- **Concurrency**: ACID transactions
- **Queue system**: Virtual waiting room
- **Scalping prevention**: CAPTCHA, rate limiting
- **Payment**: Two-phase commit
- **High traffic**: 100K concurrent users

### 10. Web Crawler
- **URL frontier**: Priority queue
- **Politeness**: Rate limit per domain
- **Deduplication**: Bloom filter
- **Distributed**: Consistent hashing
- **Storage**: Distributed file system
- **Scale**: 1B pages/day

### 11. Distributed Cache
- **Consistency**: Strong vs eventual
- **Eviction**: LRU, LFU
- **Replication**: Master-slave
- **Partitioning**: Consistent hashing
- **Failure handling**: Cache aside
- **Hot keys**: Local cache

### 12. Yelp/Nearby Places
- **Geospatial**: Geohash, QuadTree, R-tree
- **Search**: Elasticsearch with geo queries
- **Ranking**: Distance + rating + reviews
- **Real-time updates**: WebSocket
- **Aggregation**: Pre-compute popular areas

### 13. Rate Limiter (System Level)
- **Algorithms**: Token bucket, leaky bucket
- **Distributed**: Redis
- **Granularity**: User, IP, API key
- **Rules engine**: Dynamic configuration
- **Bypass**: Whitelist for premium users

### 14. Notification System
- **Channels**: Email, SMS, push, in-app
- **Priority**: High, medium, low queues
- **Delivery**: At-least-once guarantee
- **Preferences**: User settings
- **Analytics**: Delivery rate, open rate

### 15. News Feed (System Level)
- **Fan-out**: Write vs read vs hybrid
- **Ranking**: ML-based
- **Real-time**: WebSocket updates
- **Pagination**: Cursor-based
- **A/B testing**: Experimentation platform

---

**Each of these problems follows the same framework**:
1. **Requirements** (functional, non-functional)
2. **Capacity estimation** (users, QPS, storage, bandwidth)
3. **High-level design** (components, data flow)
4. **API design** (RESTful endpoints)
5. **Database schema** (SQL vs NoSQL choice)
6. **Deep dives** (specific challenging aspects)
7. **Bottlenecks** (identify and solve)
8. **Monitoring** (metrics, alerts)

---

**End of System Design Section**
