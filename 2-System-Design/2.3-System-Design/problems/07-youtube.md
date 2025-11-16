# Design YouTube

## Problem Statement

Design a video sharing platform like YouTube that allows users to upload, process, store, and stream videos, with features including search, recommendations, comments, and view count tracking.

## Requirements Clarification

### Functional Requirements

- Upload videos (creators)
- Watch videos with smooth streaming
- Search videos
- View count and analytics
- Comments and likes
- Subscribe to channels
- Personalized recommendations

### Non-Functional Requirements

- **High availability**: 99.9% uptime
- **Low latency**: Video start time < 2 seconds
- **Scale**: 2B users, 500M hours watched/day
- **Storage**: 500 hours of video uploaded/minute
- **Bandwidth**: Petabytes per day
- **Consistency**: Eventual for views/likes, strong for uploads

### Out of Scope

- Live streaming
- YouTube Premium/ads
- Content moderation details
- Monetization

## Capacity Estimation

### Users & Traffic

```
Users:
- 2B total users
- 500M daily active users (DAU)
- 100M concurrent viewers (peak)

Video Watching:
- 500M hours watched per day
- Average video length: 10 minutes
- Videos watched: 500M hours ÷ (10 min / 60) = 3B videos/day
- Per second: 3B ÷ 86,400 = ~35,000 videos/sec

Video Uploads:
- 500 hours uploaded per minute
- = 30,000 hours/hour = 720,000 hours/day
- Average 10 minutes → 4.32M videos/day
- Per second: 50 videos/sec
```

### Storage

```
Video Uploads (per day): 720,000 hours = 43.2M minutes

Encoding (multiple bitrates):
- 4K: 20 Mbps → 9 GB/hour
- 1080p: 5 Mbps → 2.25 GB/hour
- 720p: 2.5 Mbps → 1.125 GB/hour
- 480p: 1 Mbps → 450 MB/hour
- 360p: 500 Kbps → 225 MB/hour

Total per hour: ~13 GB (all bitrates)

Daily Storage:
- 720,000 hours × 13 GB = 9.36 PB/day
- Per year: 9.36 PB × 365 = 3.4 EB/year
- 10 years: ~34 EB

Metadata:
- 4.32M videos/day × 10 KB = 43 GB/day (negligible)

With 3x replication: ~100 EB over 10 years
```

### Bandwidth

```
Watching (500M hours/day):
- Average bitrate: 3 Mbps
- Total: 500M hours × 3 Mbps = 1.5B Mbps-hours
- Per second: 1.5B ÷ 24 ÷ 3600 = ~17,000 Mbps = 17 Tbps
- Daily transfer: ~6.75 PB/day

Uploading (720K hours/day):
- Average original: 50 Mbps (high quality)
- Total: 720K hours × 50 Mbps = 36M Mbps-hours
- Daily transfer: ~160 TB/day

Total: ~7 PB/day (downloads dominate)
```

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Applications                        │
│  (Web, iOS, Android, Smart TV, Gaming Consoles)              │
└────────────────┬─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                  CDN (Akamai, CloudFront)                     │
│  - Serves 90% of video traffic                               │
│  - Edge caching for popular videos                           │
└────────────────┬─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                     API Gateway / LB                          │
└────────────────┬─────────────────────────────────────────────┘
                 │
       ┌─────────┴─────────────────────────────────────┐
       │                                                │
┌──────▼──────────┐                          ┌─────────▼─────────┐
│  Upload Service │                          │  Streaming Service│
│  (Presigned S3) │                          │  (Video Playback) │
└──────┬──────────┘                          └─────────┬─────────┘
       │                                                │
       │                                        ┌───────▼──────────┐
       │                                        │  Metadata Service│
       │                                        │  (Video Info)    │
       │                                        └──────────────────┘
       │
┌──────▼─────────────────────────────────────────────────────────┐
│               Encoding Pipeline (AWS Elastic Transcoder)        │
│  - Receives upload events                                      │
│  - Transcodes to multiple bitrates                             │
│  - Generates thumbnails                                        │
└──────┬─────────────────────────────────────────────────────────┘
       │
┌──────▼─────────────────────────────────────────────────────────┐
│                    Message Queue (SQS/Kafka)                    │
│  Topics: video-uploaded, encoding-complete, view-event         │
└──────┬─────────────────────────────────────────────────────────┘
       │
       ├─────────────┬─────────────────┬──────────────────┐
       │             │                 │                  │
┌──────▼──────┐ ┌────▼──────┐  ┌──────▼─────────┐  ┌────▼───────┐
│  View Count │ │  Search   │  │ Recommendation │  │  Comment   │
│  Service    │ │  Indexer  │  │  Engine        │  │  Service   │
└─────────────┘ └───────────┘  └────────────────┘  └────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        Data Layer                             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │   Cassandra  │  │  Redis       │       │
│  │ (Users,      │  │ (Views,      │  │ (Trending,   │       │
│  │  Channels)   │  │  Comments)   │  │  Cache)      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ Elasticsearch│  │  S3 / Blob   │                         │
│  │ (Search)     │  │  (Videos)    │                         │
│  └──────────────┘  └──────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

## Design Decisions & Critiques

### Decision 1: Separate Upload and Streaming Paths

**Why?**
- Different characteristics (upload = POST, stream = GET)
- Different scaling requirements (99:1 read/write ratio)
- Different optimization strategies

**Upload Flow:**
```
Client → Presigned S3 URL → S3 → Event → Encoding Pipeline → CDN
```

**Streaming Flow:**
```
Client → CDN (hit) → Video chunk
Client → CDN (miss) → Origin (S3) → CDN → Client
```

**Pros:**
- ✅ Optimized independently
- ✅ Uploads don't affect streaming performance
- ✅ Can scale each path separately

**Cons:**
- ❌ More complex architecture
- ❌ Two code paths to maintain

### Decision 2: Asynchronous Encoding Pipeline

**Why?**
- Video encoding is CPU-intensive (1 hour video = 2 hours encoding time)
- Users don't wait for encoding to complete
- Can batch and optimize encoding jobs

**Flow:**
```
1. User uploads video → S3 (original)
2. S3 triggers Lambda → SQS queue
3. Worker pool pulls from queue
4. Encoding (AWS Elemental MediaConvert):
   - Multiple bitrates (360p to 4K)
   - Generate thumbnails (0s, 25%, 50%, 75%)
   - Extract audio for subtitles
5. Output → S3 (encoded) → CDN
6. Update database: status = "ready"
7. Notify user
```

**Pros:**
- ✅ Non-blocking upload (user gets instant confirmation)
- ✅ Scale encoding workers independently
- ✅ Retry failed encodings
- ✅ Priority queue (verified creators first)

**Cons:**
- ❌ Video not immediately available
- ❌ Complex pipeline with failure modes

**When to use:**
- Heavy computation (encoding, ML)
- Can tolerate delay (eventual consistency)

**Alternative:**
- Synchronous: user waits (bad UX at scale)

### Decision 3: View Count Architecture (Challenging!)

**Problem:** 35,000 video views/second. Cannot write to database for each view.

**Naive Approach (Breaks):**
```sql
UPDATE videos SET view_count = view_count + 1 WHERE video_id = ?
-- 35,000 updates/sec → database dies
```

**Production Approach: Buffered Writes**

```python
# Step 1: Log view events to Kafka
def record_view(video_id, user_id):
    kafka.publish("view-events", {
        "video_id": video_id,
        "user_id": user_id,
        "timestamp": now()
    })

# Step 2: Aggregate in memory (streaming)
# Flink / Spark Streaming
view_counts = {}

def process_view_stream():
    for message in kafka.consume("view-events"):
        video_id = message['video_id']
        view_counts[video_id] = view_counts.get(video_id, 0) + 1

    # Every 10 seconds, flush to database
    every(10 seconds):
        for video_id, count in view_counts.items():
            cassandra.execute("""
                UPDATE video_stats SET view_count = view_count + ?
                WHERE video_id = ?
            """, count, video_id)

        view_counts.clear()

# Result: 35,000 writes/sec → 1,000 batched writes/sec (35x reduction)
```

**Pros:**
- ✅ Database load reduced 10-100x
- ✅ Eventual consistency acceptable for view counts
- ✅ Can compute additional metrics (views per hour, unique viewers)

**Cons:**
- ❌ View counts delayed by ~10 seconds
- ❌ More complex (streaming pipeline)
- ❌ Need to handle failures (checkpoint state)

**When to use:**
- High-frequency counters (views, likes, impressions)
- Eventual consistency acceptable
- Need real-time analytics

**Alternative:**
- Write to Redis (in-memory) then batch to DB
- Use database with better write throughput (Cassandra counters)

## Database Design

### PostgreSQL (Users, Videos, Channels)

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE channels (
  channel_id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(user_id),
  name VARCHAR(100),
  description TEXT,
  subscriber_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE videos (
  video_id UUID PRIMARY KEY,
  channel_id UUID REFERENCES channels(channel_id),
  title VARCHAR(200),
  description TEXT,
  duration_seconds INT,
  upload_time TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20), -- processing, ready, failed

  -- Denormalized for performance
  view_count BIGINT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,

  -- URLs
  thumbnail_url TEXT,
  video_manifest_url TEXT, -- HLS manifest

  INDEX idx_channel (channel_id, upload_time DESC),
  INDEX idx_status (status)
);

CREATE TABLE subscriptions (
  user_id UUID REFERENCES users(user_id),
  channel_id UUID REFERENCES channels(channel_id),
  subscribed_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (user_id, channel_id),
  INDEX idx_user (user_id)
);
```

**Design Critique:**

**Why denormalize view_count, like_count in videos table?**
- ✅ Display on every video page (very frequent read)
- ✅ Avoid JOIN or separate query
- ❌ Need to keep in sync (eventual consistency via batch updates)

### Cassandra (Comments, View Logs)

```cql
CREATE TABLE comments (
  video_id UUID,
  comment_id UUID,
  user_id UUID,
  text TEXT,
  like_count INT,
  created_at TIMESTAMP,

  PRIMARY KEY (video_id, created_at, comment_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

CREATE TABLE view_logs (
  video_id UUID,
  user_id UUID,
  viewed_at TIMESTAMP,
  watch_duration_seconds INT,

  PRIMARY KEY (video_id, viewed_at, user_id)
) WITH default_time_to_live = 2592000; -- 30 days TTL
```

**Why Cassandra for comments?**
- ✅ High write volume (1000s of comments/sec)
- ✅ Partition by video_id (all comments for video together)
- ✅ Time-ordered (latest comments first)

## Search (Elasticsearch)

```javascript
// Index structure
{
  "video_id": "abc123",
  "title": "How to Design YouTube",
  "description": "A comprehensive guide...",
  "tags": ["system design", "tutorial", "youtube"],
  "channel_name": "Tech Interviews",
  "view_count": 1000000,
  "upload_time": "2024-01-01T00:00:00Z",
  "duration_seconds": 1200
}

// Search query
GET /videos/_search
{
  "query": {
    "multi_match": {
      "query": "system design tutorial",
      "fields": ["title^3", "description", "tags^2", "channel_name"]
    }
  },
  "sort": [
    {"view_count": "desc"},  // Boost popular videos
    "_score"
  ],
  "size": 20
}
```

**Why Elasticsearch?**
- ✅ Full-text search with relevance scoring
- ✅ Faceting (filter by upload date, duration, etc.)
- ✅ Autocomplete (suggest as you type)

**Indexing Pipeline:**
```
Video uploaded → Kafka → Search indexer → Elasticsearch
```

## Recommendation Engine

### 1. Collaborative Filtering

```python
# "Users who watched this also watched..."
def recommend_similar_videos(video_id):
    # Get users who watched this video
    users = cassandra.execute("""
        SELECT DISTINCT user_id FROM view_logs
        WHERE video_id = ?
        LIMIT 10000
    """, video_id)

    # Get what else they watched
    related_videos = {}
    for user in users:
        their_history = get_watch_history(user.id, limit=50)

        for other_video in their_history:
            if other_video.id != video_id:
                related_videos[other_video.id] = \
                    related_videos.get(other_video.id, 0) + 1

    # Sort by co-occurrence count
    ranked = sorted(related_videos.items(),
                    key=lambda x: x[1], reverse=True)

    return ranked[:10]
```

### 2. Content-Based

```python
# Similar by metadata (tags, category, channel)
def recommend_by_content(video_id):
    video = get_video_metadata(video_id)

    similar = elasticsearch.search({
        "query": {
            "more_like_this": {
                "fields": ["tags", "category", "title"],
                "like": {
                    "_id": video_id
                }
            }
        },
        "size": 10
    })

    return similar
```

### 3. Trending

```python
# Videos with recent high engagement
def get_trending():
    # Time-decay weighted view count
    # Recent views weighted higher

    trending = redis.zrevrange("trending:videos", 0, 20)

    # Background job updates trending every 5 minutes
    def update_trending():
        videos = cassandra.execute("""
            SELECT video_id, view_count, upload_time
            FROM videos
            WHERE upload_time > ?
        """, now() - timedelta(days=7))

        for video in videos:
            # Score = view_count × time_decay
            age_hours = (now() - video.upload_time).total_seconds() / 3600
            decay = 1 / (1 + age_hours / 24)  # Decay over days

            score = video.view_count * decay

            redis.zadd("trending:videos", {video.video_id: score})
```

### Production: Ensemble Model

```
1. Personalized (collaborative filtering): 60%
2. Content-based (similar videos): 20%
3. Trending: 10%
4. Subscribed channels (new uploads): 10%

Combine and rerank based on user history.
```

## API Design

```
POST /api/v1/videos/upload-url
Response:
{
  "upload_url": "https://s3.amazonaws.com/presigned...",
  "video_id": "abc123"
}

GET /api/v1/videos/{video_id}
Response:
{
  "video_id": "abc123",
  "title": "How to Design YouTube",
  "description": "...",
  "view_count": 1000000,
  "like_count": 50000,
  "manifest_url": "https://cdn.youtube.com/abc123/master.m3u8",
  "thumbnails": ["https://cdn.../thumb1.jpg", ...]
}

POST /api/v1/videos/{video_id}/view
# Logs view event

GET /api/v1/search?q=system+design&limit=20
Response:
{
  "results": [...],
  "total": 1500
}

GET /api/v1/recommendations?limit=20
Response:
{
  "videos": [...]
}

POST /api/v1/videos/{video_id}/comments
Request:
{
  "text": "Great video!"
}

GET /api/v1/videos/{video_id}/comments?limit=50&offset=0
```

## Scaling Strategies

### 1. CDN Caching Strategy

```
Popular videos (top 10%): cached at all edges (months)
Medium popularity: cached on-demand (weeks)
Long-tail: pulled from origin on first request (days)

Cache invalidation: never (videos immutable)
```

### 2. Database Sharding

```python
# Shard by channel_id
def get_shard(channel_id):
    return hash(channel_id) % NUM_SHARDS

# All videos from one channel on same shard
# Optimizes channel page queries
```

### 3. Read Replicas

```
Master (writes) → Video uploads, metadata updates
Slaves (reads) → Search, recommendations, comments
```

## Bottlenecks & Solutions

### Bottleneck 1: Encoding Backlog

**Problem:** 50 videos/sec to encode, each takes 2x real-time

**Solutions:**
- Massive parallel workers (1000+ EC2 instances)
- Priority queue (verified creators first)
- Adaptive bitrate ladder (skip 4K for short videos)

### Bottleneck 2: Trending Calculation

**Problem:** Recompute trending every 5 min across billions of videos

**Solutions:**
- Only consider recent videos (last 7 days)
- Incremental updates (not full recompute)
- Cache top 100 trending

### Bottleneck 3: Popular Video Surge

**Problem:** New viral video → 1M requests/min

**Solutions:**
- CDN absorbs traffic
- Origin shield (reduce origin requests)
- Pre-warm cache for anticipated viral content

## Monitoring

```
Performance:
- Video start time: p50 < 1s, p99 < 3s
- Search latency: p50 < 100ms
- Encoding time: p50 < 2x video duration

Availability:
- Uptime: 99.9%
- CDN cache hit rate: > 90%

Business:
- Hours watched per day: 500M
- Upload rate: 500 hours/min
- DAU: 500M

Alerts:
- Encoding queue depth > 10,000
- Video start time p99 > 5s
- Database write lag > 1 minute
```

## Cost Estimation

```
Storage (S3): 34 EB × $0.023/GB = ~$780M/year

CDN: 6.75 PB/day × 30 × $0.02/GB = ~$4M/month = $48M/year

Encoding: 4.32M videos/day × $0.0075/min × 10 min = $324K/day = $118M/year

Database: $500K/month = $6M/year

Compute: $2M/month = $24M/year

Total: ~$1B/year (YouTube's actual infrastructure cost)
```

## Interview Talking Points

"YouTube's key challenges are storage (34 EB), encoding (50 videos/sec), and bandwidth (7 PB/day). I'd use S3 for storage, AWS MediaConvert for encoding, CDN for delivery. For view counts, buffered writes via Kafka to reduce database load from 35K writes/sec to 1K. For search, Elasticsearch with multi-field matching. Recommendations use collaborative filtering + content-based + trending ensemble."
