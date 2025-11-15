# Design Instagram

## Problem Statement

Design a photo and video sharing social media platform where users can upload media, follow other users, view a personalized feed, like/comment on posts, and share stories that expire after 24 hours.

## Requirements Clarification

### Functional Requirements

- Upload photos and videos
- Follow/unfollow users
- News feed (posts from followed users)
- Like and comment on posts
- Direct messaging
- Stories (24-hour expiry)
- User profiles
- Search users and hashtags

### Non-Functional Requirements

- **High availability**: 99.9% uptime
- **Low latency**: Feed loads in < 1s
- **Eventual consistency**: Acceptable for likes/comments
- **Scale**: 1B users, 500M DAU
- **Storage-intensive**: Photos/videos dominate storage
- **Read-heavy**: 100:1 read/write ratio

### Out of Scope

- Reels/short videos
- Shopping features
- Live streaming
- Augmented reality filters

## Capacity Estimation

### Traffic

```
Users:
- 1B total users
- 500M daily active users (DAU)

Upload Traffic:
- Each user uploads 2 photos/day on average
- 500M × 2 = 1B photos/day
- Per second: 1B ÷ 86,400 = ~11,500 uploads/sec
- Peak (3x): ~35,000 uploads/sec

Read Traffic:
- Each user views feed 20 times/day
- Each feed view loads 20 posts
- 500M × 20 × 20 = 200B post views/day
- Per second: ~2.3M views/sec
- Peak: ~7M views/sec
```

### Storage (5 Years)

```
Photos per day: 1B
Total photos: 1B × 365 × 5 = 1.825 trillion photos

Photo sizes (multiple resolutions):
- Thumbnail: 50KB
- Mobile (640×640): 200KB
- Web (1080×1080): 500KB
- Original (high-res): 5MB
- Total per photo: ~6MB

Total storage: 1.825T × 6MB = 10.95 PB ≈ 11PB
With 3x replication: ~33PB

Videos (20% of uploads):
- Average video: 30 seconds, 10MB
- Video uploads: 1B × 0.2 = 200M/day
- 5 years: 200M × 365 × 5 = 365B videos
- Total: 365B × 10MB = 3.65PB
- With replication: ~11PB

Total Storage: ~44PB

Metadata (posts, users, likes, comments):
- ~50TB (negligible compared to media)
```

### Bandwidth

```
Upload:
- Photos: 11,500/sec × 5MB = 57.5GB/sec
- Videos: 2,300/sec × 10MB = 23GB/sec
- Total upload: ~80GB/sec

Download:
- Feed views: 2.3M/sec × 500KB (avg) = 1.15TB/sec
- CDN is absolutely critical!
- CDN hit rate 95% → origin load: 57.5GB/sec
```

## High-Level Architecture

```
┌────────────────────────────────────────────────┐
│         Client (Mobile App / Web)              │
└────────────────┬───────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────┐
│              CDN (CloudFront)                  │
│  - Serve images/videos (95% cache hit)        │
│  - Edge locations worldwide                    │
└────────────────┬───────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────┐
│           Load Balancer (ALB)                  │
│  - SSL termination                             │
│  - Route to services                           │
└────────────────┬───────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐   ┌──────▼────────┐
│Upload Service│   │ Feed Service  │
│              │   │               │
└───────┬──────┘   └──────┬────────┘
        │                 │
        │          ┌──────▼────────┐
        │          │ Redis Cache   │
        │          │ - Feed cache  │
        │          │ - User cache  │
        │          └───────────────┘
        │
┌───────▼─────────────────────────────────────┐
│          Object Storage (S3)                │
│  ┌────────────────────────────────────┐    │
│  │ Buckets:                           │    │
│  │ - images-original/                 │    │
│  │ - images-thumbnail/                │    │
│  │ - images-mobile/                   │    │
│  │ - images-web/                      │    │
│  │ - videos/                          │    │
│  └────────────────────────────────────┘    │
└───────┬─────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────┐
│       Message Queue (Kafka / SQS)           │
│  Topics:                                    │
│  - image-processing                         │
│  - feed-fanout                              │
│  - notification                             │
└───────┬─────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────┐
│           Worker Services                   │
│  ┌──────────────┐  ┌─────────────────┐     │
│  │Image Resize  │  │ Feed Fanout     │     │
│  │Workers       │  │ Workers         │     │
│  └──────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────┐
│              Databases                      │
│  ┌──────────────┐  ┌─────────────────┐     │
│  │  User DB     │  │   Post DB       │     │
│  │ (PostgreSQL) │  │  (Cassandra)    │     │
│  └──────────────┘  └─────────────────┘     │
│  ┌──────────────┐  ┌─────────────────┐     │
│  │  Graph DB    │  │  Analytics DB   │     │
│  │  (Neo4j)     │  │  (ClickHouse)   │     │
│  └──────────────┘  └─────────────────┘     │
│  ┌──────────────┐                          │
│  │  Search      │                          │
│  │(Elasticsearch│                          │
│  └──────────────┘                          │
└─────────────────────────────────────────────┘
```

## Design Decisions & Critiques

### Decision 1: Async Image Processing Pipeline

**Why?**
- Uploading 5MB original takes ~1 second
- Processing 4 sizes (thumbnail, mobile, web, original) takes ~5 seconds
- Synchronous total: 6 seconds (poor UX)

**Architecture:**

```python
# Synchronous (BAD):
def upload_photo_sync(image):
    s3.upload(image)  # 1 sec
    resize_thumbnail(image)  # 1 sec
    resize_mobile(image)  # 1 sec
    resize_web(image)  # 1 sec
    save_to_db(image)  # 1 sec
    return success
    # Total: 5-6 seconds

# Asynchronous (GOOD):
def upload_photo_async(image):
    s3.upload(image)  # 1 sec
    queue.publish('image-processing', {image_id})
    return {status: 'processing'}
    # User sees response in 1 second!

# Background worker:
def process_image_worker():
    message = queue.consume()
    image = s3.download(message.image_id)
    parallel_process([thumbnail, mobile, web])  # 2 sec (parallel)
    s3.upload_all(resized_images)
    db.update(message.image_id, {status: 'ready'})
```

**Pros:**
- ✅ User perceives 1-second upload (vs 6 seconds)
- ✅ **6x better perceived performance**
- ✅ Decouple upload from processing
- ✅ Can scale workers independently
- ✅ Retry failed processing automatically

**Cons:**
- ❌ Image not immediately available (eventual consistency)
- ❌ Need status polling or push notifications
- ❌ Additional infrastructure (queue, workers)
- ❌ Complexity in error handling

**When to use:**
- Processing time > 1 second
- User doesn't need immediate result
- Can tolerate eventual consistency

**Constraints that drive this:**
- Mobile users on slow networks (can't wait 6 seconds)
- Need to support 35,000 uploads/sec at peak
- Processing CPU-intensive (can't block upload servers)

### Decision 2: CDN is Mandatory

**Why?**
- Downloading 1.15TB/sec from origin is impossible
- Global users need low-latency access
- Media files are immutable (perfect for caching)

**Without CDN:**
```
All requests → Origin servers
- Latency: 200-500ms (varies by location)
- Bandwidth cost: 1.15TB/sec × $0.09/GB = $9M/month
- Server load: Overwhelming
```

**With CDN (95% hit rate):**
```
95% requests → CDN edge (< 50ms)
5% requests → Origin (200ms)

Average latency:
- 0.95 × 50ms + 0.05 × 200ms = 57.5ms
- 4x faster than without CDN

Bandwidth cost:
- CDN: 1.15TB/sec × $0.085/GB = $8.5M/month
- Origin: 57.5GB/sec × $0.09/GB = $450K/month
- Total: $8.95M/month (vs $9M direct)
- Plus: Reduced server load, better UX
```

**Pros:**
- ✅ 4x faster for users
- ✅ Reduced origin load (95% offload)
- ✅ Global scalability
- ✅ DDoS protection

**Cons:**
- ❌ Cache invalidation complexity
- ❌ Additional cost (but necessary)
- ❌ Debugging more complex

**This is non-negotiable at Instagram's scale.**

### Decision 3: Feed Ranking Algorithm (Not Chronological)

**Why?**
- Users follow 500+ accounts
- Too many posts to show all
- Need to show "best" content first

**Chronological (Instagram pre-2016):**
```python
def get_feed_chronological(user_id):
    following = get_following(user_id)
    posts = get_posts_from_users(following, limit=100)
    return posts.sort_by('created_at', desc=True)[:20]
```

**Ranked (Current):**
```python
def get_feed_ranked(user_id):
    # 1. Get candidate posts (chronological)
    following = get_following(user_id)
    posts = get_recent_posts(following, limit=500)

    # 2. Score each post
    user_interests = get_user_interests(user_id)  # ML model
    scored_posts = []

    for post in posts:
        score = (
            0.4 × engagement_score(post) +      # likes, comments, shares
            0.3 × recency_score(post) +         # posted in last 24h
            0.2 × interest_match(post, user_interests) +  # ML
            0.1 × relationship_score(post.user_id, user_id)  # close friend?
        )
        scored_posts.append((post, score))

    # 3. Sort by score
    scored_posts.sort(key=lambda x: x[1], reverse=True)

    # 4. Return top 20
    return [post for post, _ in scored_posts[:20]]

def engagement_score(post):
    age_hours = (now() - post.created_at).total_seconds() / 3600
    decay = 1 / (1 + age_hours)  # Decay over time
    return (post.likes + post.comments × 2 + post.shares × 3) × decay

def interest_match(post, user_interests):
    post_tags = extract_hashtags(post) + ml_classify(post.image)
    return cosine_similarity(post_tags, user_interests)
```

**Pros:**
- ✅ Higher engagement (users see content they care about)
- ✅ Better for business (ads perform better)
- ✅ Personalization improves over time

**Cons:**
- ❌ Users complain about "missing posts"
- ❌ ML model complexity
- ❌ Computational overhead
- ❌ "Filter bubble" concerns

**Constraints:**
- Average user follows 500+ accounts
- 500 accounts × 2 posts/day = 1,000 posts/day
- User can't consume 1,000 posts → need ranking

**This decision directly addresses the information overload constraint.**

## Database Design

### User Service (PostgreSQL)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  profile_pic_url VARCHAR(500),
  follower_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  private BOOLEAN DEFAULT FALSE,  -- Private account feature
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_username (username),
  INDEX idx_email (email)
);

CREATE TABLE follows (
  follower_id UUID,
  followee_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (follower_id, followee_id),
  INDEX idx_follower (follower_id),
  INDEX idx_followee (followee_id),

  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Design Critique:**

**Why denormalize follower_count?**
- ✅ Profile page shows count (very frequent query)
- ✅ Avoid expensive `COUNT(*)` on follows table
- ❌ Must maintain consistency with triggers

**PostgreSQL trigger:**
```sql
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET follower_count = follower_count + 1
    WHERE id = NEW.followee_id;
    UPDATE users SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET follower_count = follower_count - 1
    WHERE id = OLD.followee_id;
    UPDATE users SET following_count = following_count - 1
    WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follow_count_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION update_follower_count();
```

### Post Service (Cassandra)

```cql
-- Posts by ID (primary lookup)
CREATE TABLE posts (
  post_id UUID PRIMARY KEY,
  user_id UUID,
  caption TEXT,
  image_urls MAP<TEXT, TEXT>,  -- {thumbnail: url, mobile: url, web: url, original: url}
  location TEXT,
  hashtags LIST<TEXT>,
  like_count COUNTER,
  comment_count COUNTER,
  created_at TIMESTAMP,
  status TEXT  -- 'processing', 'ready', 'failed'
);

-- User's posts (profile page)
CREATE TABLE posts_by_user (
  user_id UUID,
  post_id UUID,
  created_at TIMESTAMP,
  thumbnail_url TEXT,
  PRIMARY KEY (user_id, created_at, post_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Feed (precomputed for non-celebrities)
CREATE TABLE feed (
  user_id UUID,
  post_id UUID,
  post_user_id UUID,
  created_at TIMESTAMP,
  thumbnail_url TEXT,
  PRIMARY KEY (user_id, created_at, post_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Likes
CREATE TABLE likes (
  post_id UUID,
  user_id UUID,
  created_at TIMESTAMP,
  PRIMARY KEY (post_id, user_id)
);

-- Check if user liked post: O(1)
-- Get all users who liked post: scan partition

-- Reverse index for "user's liked posts"
CREATE TABLE likes_by_user (
  user_id UUID,
  post_id UUID,
  created_at TIMESTAMP,
  PRIMARY KEY (user_id, created_at, post_id)
) WITH CLUSTERING ORDER BY (created_at DESC);
```

**Design Critique:**

**Why store image_urls as MAP instead of separate columns?**
- ✅ Flexible (can add new sizes without schema change)
- ✅ Clean data model
- ❌ Slightly harder to query specific size

**Why both likes and likes_by_user tables?**
- Two access patterns:
  1. "Did user X like post Y?" → likes table (fast lookup)
  2. "What posts did user X like?" → likes_by_user table

**Trade-off:**
- ✅ Both queries are O(1)
- ❌ Double storage (but negligible: 2 × 8 bytes per like)
- ❌ Need to write to both tables (use batch insert)

**This is a classic denormalization for query performance.**

### Stories (with TTL)

```cql
CREATE TABLE stories (
  story_id UUID,
  user_id UUID,
  media_url TEXT,
  media_type TEXT,  -- 'photo' or 'video'
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  view_count COUNTER,
  PRIMARY KEY (user_id, created_at, story_id)
) WITH CLUSTERING ORDER BY (created_at DESC)
  AND default_time_to_live = 86400;  -- 24 hours

-- Cassandra automatically deletes expired rows!
```

**Why Cassandra TTL is perfect for Stories:**
- ✅ Automatic deletion after 24 hours (no cron jobs)
- ✅ Space reclaimed automatically
- ✅ No manual cleanup logic
- ✅ Tombstones handled by compaction

**Constraints:**
- Stories must expire after 24 hours (product requirement)
- Need to store billions of stories daily
- Automatic cleanup is essential (can't afford manual deletion)

## Deep Dive: Image Upload Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ 1. Request upload URL
     ▼
┌─────────────┐
│ Upload API  │───────────┐
└────┬────────┘           │
     │                    │ 2. Generate signed URL
     │                    ▼
     │              ┌──────────┐
     │              │    S3    │
     │              └──────────┘
     │                    ▲
     │                    │
     │ 3. Return signed   │ 4. Client uploads
     │    URL to client   │    directly to S3
     │                    │
     ▼                    │
┌─────────┐              │
│ Client  │──────────────┘
└────┬────┘
     │
     │ 5. Notify upload complete
     ▼
┌─────────────┐
│ Upload API  │
└────┬────────┘
     │
     │ 6. Publish to queue
     ▼
┌─────────────────┐
│  Kafka Queue    │
│ image-processing│
└────┬────────────┘
     │
     │ 7. Worker consumes message
     ▼
┌─────────────────┐
│ Image Processor │
│    Worker       │
└────┬────────────┘
     │
     │ 8. Download original
     │ 9. Generate sizes (parallel)
     │ 10. Upload all sizes
     │ 11. Update DB status
     │ 12. Publish to fanout queue
     ▼
```

**Why signed URL instead of uploading through API server?**

**Option 1: Upload through API server**
```
Client → API Server → S3
- API server handles 5MB upload
- Uses server bandwidth and CPU
- API server becomes bottleneck
```

**Option 2: Signed URL (current approach)**
```
Client → API (get signed URL) → Client → S3 directly
- API server only generates URL (< 1ms)
- S3 handles upload directly
- No API server bottleneck
```

**Pros of signed URL:**
- ✅ API servers not bottlenecked by uploads
- ✅ Direct upload to S3 (faster)
- ✅ Scales independently
- ✅ Security via time-limited signed URLs

**Cons:**
- ❌ Two-step process (get URL, then upload)
- ❌ Client needs to handle S3 upload
- ❌ Need to secure signed URL generation

## Deep Dive: Feed Generation

Similar to Twitter's hybrid approach, but with ranking:

```python
CELEBRITY_THRESHOLD = 100000  # Higher than Twitter (Instagram skews more)

def generate_feed(user_id, limit=20):
    # 1. Check cache
    cache_key = f"feed:{user_id}"
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)

    # 2. Get candidate posts
    candidates = get_candidate_posts(user_id, limit=500)

    # 3. Rank posts
    ranked = rank_posts(candidates, user_id)

    # 4. Cache result (5 minutes)
    redis.setex(cache_key, 300, json.dumps(ranked))

    return ranked

def get_candidate_posts(user_id, limit):
    # Hybrid approach
    following = get_following(user_id)

    regular_users = [u for u in following if not is_celebrity(u)]
    celebrities = [u for u in following if is_celebrity(u)]

    # Precomputed feed for regular users
    precomputed = cassandra.execute("""
        SELECT * FROM feed WHERE user_id = ? LIMIT ?
    """, user_id, limit)

    # On-demand fetch for celebrities
    celeb_posts = []
    for celeb_id in celebrities:
        posts = cassandra.execute("""
            SELECT * FROM posts_by_user
            WHERE user_id = ? LIMIT ?
        """, celeb_id, 50)
        celeb_posts.extend(posts)

    return precomputed + celeb_posts
```

## Scaling: Sharding Strategy

**Shard posts by user_id:**

```
Shard 0: users with hash(user_id) % 16 == 0
Shard 1: users with hash(user_id) % 16 == 1
...
Shard 15: users with hash(user_id) % 16 == 15
```

**Pros:**
- ✅ All posts from one user in same shard (efficient profile queries)
- ✅ Even distribution

**Cons:**
- ❌ Celebrity shards become hot
- ❌ Feed generation requires querying multiple shards

**Solution for celebrity hotspot:**
- Replicate celebrity posts across all shards
- Cache celebrity posts aggressively
- Use read replicas for celebrity shards

## Monitoring & Alerts

### Key Metrics

```
Performance:
- Upload latency: p50 < 1s, p99 < 3s
- Feed load latency: p50 < 500ms, p99 < 2s
- Image processing time: p50 < 30s, p99 < 2min

Availability:
- Uptime: 99.9% (43min downtime/month acceptable)
- Error rate: < 0.1%

Data:
- Storage: 44PB and growing
- Daily uploads: 1B photos/videos
- CDN hit rate: 95%+
- Cache hit rate: 80%+

Business:
- DAU: 500M
- Posts per day: 1B
- Stories per day: 500M
```

## Security

1. **Image validation:** Check file type, size, content (no malware)
2. **Rate limiting:** Max 100 uploads/day per user
3. **Content moderation:** ML models for inappropriate content
4. **Access control:** Private accounts, blocked users
5. **Signed URLs:** Time-limited (15 min expiry)

## Interview Talking Points

**"The key challenge with Instagram is storage and bandwidth"**
- "We're dealing with 44PB of media and 1.15TB/sec download"
- "CDN is non-negotiable at this scale"
- "Async image processing critical for UX"

**"Feed ranking is essential due to content overload"**
- "Users follow 500+ accounts producing 1,000+ posts/day"
- "Can't show all posts → need intelligent ranking"
- "ML models balance engagement, recency, and personalization"

**"Hybrid fan-out optimizes for common case"**
- "90% of users get precomputed feed (fast)"
- "Celebrity posts fetched on-demand (avoid fan-out storm)"
- "Trade-off: slight latency increase for celebrity followers"

