# Design Netflix

## Problem Statement

Design a video streaming platform like Netflix that allows users to browse, search, and stream video content with adaptive bitrate streaming, personalized recommendations, and global content delivery.

## Requirements Clarification

### Functional Requirements

- Browse and search video catalog
- Stream videos with adaptive bitrate
- Resume playback from last position
- Personalized recommendations
- User profiles and watch history
- Content ratings and reviews
- Download for offline viewing

### Non-Functional Requirements

- **High availability**: 99.99% uptime
- **Low latency**: Video start time < 2 seconds
- **Smooth playback**: No buffering after initial load
- **Scale**: 200M users, 100M concurrent streams (peak)
- **Bandwidth**: 15 Petabytes/day
- **Global**: Serve users in 190+ countries

### Out of Scope

- Content production/studio management
- Live streaming
- User-generated content
- Social features (sharing, comments)

## Capacity Estimation

### Users & Traffic

```
Users:
- 200M total subscribers
- 100M daily active users (DAU)
- 50M concurrent viewers (peak evening)

Viewing:
- Average 2 hours per user per day
- Total: 100M users × 2 hours = 200M hours/day

Concurrent Streams:
- Peak: 50M concurrent
- Average bitrate: 5 Mbps (1080p adaptive)
- Peak bandwidth: 50M × 5 Mbps = 250 Terabits/sec = 31 TB/sec
```

### Storage

```
Content Library:
- 10,000 titles (movies + TV shows)
- Average movie: 2 hours
- Average TV show: 10 episodes × 45 min = 7.5 hours
- Assume 7,000 movies + 3,000 shows

Total Hours:
- Movies: 7,000 × 2 = 14,000 hours
- Shows: 3,000 × 7.5 = 22,500 hours
- Total: 36,500 hours

Encoding:
Each video encoded in multiple bitrates:
- 4K (25 Mbps) - 11.25 GB/hour
- 1080p (5 Mbps) - 2.25 GB/hour
- 720p (2.5 Mbps) - 1.125 GB/hour
- 480p (1 Mbps) - 450 MB/hour
- 360p (500 Kbps) - 225 MB/hour

Total per hour: ~15 GB (all bitrates)

Total Storage:
- 36,500 hours × 15 GB = 547 TB (just video)
- With metadata, thumbnails, subtitles: ~600 TB
- With 3x replication: ~1.8 PB

Daily Bandwidth:
- 200M hours/day × 5 Mbps average = 1B Mbps-hours
- = 450 PB transmitted per day
- With CDN 95% cache hit: ~23 PB from origin/day
```

### User Data

```
User Profiles:
- 200M users × 10 KB = 2 TB

Watch History:
- 200M users × 100 watch records × 500 bytes = 10 TB

Recommendations (Precomputed):
- 200M users × 1000 recommendations × 50 bytes = 10 TB

Total: ~25 TB (negligible compared to video)
```

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Devices                             │
│  (Smart TV, Web, iOS, Android, Game Console)                 │
└────────────────┬─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                  CDN (Content Delivery Network)               │
│  (AWS CloudFront + Open Connect Appliances)                  │
│  - 95% of video traffic                                      │
│  - Edge servers in ISPs                                      │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ (5% cache misses)
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                       API Gateway                             │
│  (AWS ELB + API Gateway)                                     │
└────────────────┬─────────────────────────────────────────────┘
                 │
       ┌─────────┴─────────────────────────────────────┐
       │                                                │
┌──────▼──────────┐                          ┌─────────▼─────────┐
│  Video Metadata │                          │  User Service     │
│  Service        │                          │  (Auth, Profiles) │
└──────┬──────────┘                          └─────────┬─────────┘
       │                                                │
┌──────▼──────────┐                          ┌─────────▼─────────┐
│  Recommendation │                          │  Playback Service │
│  Service        │                          │  (Resume, Track)  │
└──────┬──────────┘                          └─────────┬─────────┘
       │                                                │
       │                                                │
┌──────▼────────────────────────────────────────────────▼─────────┐
│                     Message Queue (Kafka)                        │
│  Topics: video-viewed, recommendation-needed, encoding-done     │
└──────┬─────────────────────────────────────────────────────────┘
       │
       ├─────────────┬─────────────────┬──────────────────┐
       │             │                 │                  │
┌──────▼──────┐ ┌────▼──────┐  ┌──────▼─────────┐  ┌────▼───────┐
│  Analytics  │ │  Encoding │  │ Recommendation │  │  Billing   │
│  Service    │ │  Pipeline │  │  ML Engine     │  │  Service   │
└─────────────┘ └───────────┘  └────────────────┘  └────────────┘
                     │
              ┌──────▼──────┐
              │  S3 Origin  │
              │  (Master    │
              │   Videos)   │
              └─────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        Data Layer                             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │   Cassandra  │  │  Redis Cache │       │
│  │ (Users, Subs)│  │ (Watch Hist, │  │ (Sessions,   │       │
│  │              │  │  Metadata)   │  │  Hot Data)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ Elasticsearch│  │  S3 (Videos, │                         │
│  │ (Search)     │  │  Thumbnails) │                         │
│  └──────────────┘  └──────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

## Design Decisions & Critiques

### Decision 1: Adaptive Bitrate Streaming (ABR)

**Why?**
- Users have varying bandwidth (1 Mbps to 100 Mbps)
- Bandwidth fluctuates during playback
- Want smooth experience without buffering
- Maximize quality for each user's connection

**How it works:**

```
1. Encode video in multiple bitrates:
   - 4K: 25 Mbps
   - 1080p: 5 Mbps
   - 720p: 2.5 Mbps
   - 480p: 1 Mbps
   - 360p: 500 Kbps

2. Split each bitrate into 4-second chunks (HLS/DASH)

3. Client measures bandwidth continuously

4. Client requests next chunk at appropriate bitrate:
   Bandwidth > 10 Mbps → Request 1080p chunk
   Bandwidth drops to 3 Mbps → Request 720p chunk
```

**Pros:**
- ✅ Smooth playback (no buffering)
- ✅ Maximizes quality for each user
- ✅ Adapts to network fluctuations
- ✅ Works on any device/connection

**Cons:**
- ❌ 5x storage (multiple bitrates)
- ❌ More complex encoding pipeline
- ❌ Initial encoding time longer

**When to use:**
- Video streaming platforms
- Diverse user base (mobile to smart TV)
- Varying network conditions

**Alternative:**
- Single bitrate (simple, poor UX)
- Manual quality selection (user burden)

### Decision 2: CDN + Open Connect Appliances

**Why Netflix built Open Connect:**

Netflix delivers 15 PB/day. At $0.085/GB (CloudFront), that's:
```
15,000 TB × $0.085 = $1.275M per day = $465M per year
```

**Netflix's approach:**
1. **Edge servers (Open Connect)** in ISPs (free hosting for ISP)
2. **CDN (CloudFront)** as fallback
3. **Origin (S3)** for rare content

**Pros:**
- ✅ Massive cost savings (95% traffic on free Open Connect)
- ✅ Better performance (content inside ISP network)
- ✅ ISPs benefit (reduced peering costs)
- ✅ Control over caching logic

**Cons:**
- ❌ Infrastructure management (ship physical appliances)
- ❌ Relationships with ISPs required
- ❌ Only viable at Netflix scale (>1 PB/day)

**When to use:**
- Extreme scale (>1 PB/day)
- Predictable traffic patterns
- Long-tail content (90% views on 10% content)

**For most companies:**
- Use managed CDN (CloudFront, Cloudflare)
- Open Connect only at Netflix scale

### Decision 3: Cassandra for Watch History & Metadata

**Why Cassandra?**
- Time-series data (watch history)
- Massive write throughput (100M users × 10 views/day)
- Partition tolerance (global scale)
- No complex joins needed

**Schema:**

```cql
CREATE TABLE watch_history (
  user_id UUID,
  video_id UUID,
  watched_at TIMESTAMP,
  position_seconds INT,  -- Resume position
  completed BOOLEAN,

  PRIMARY KEY (user_id, watched_at, video_id)
) WITH CLUSTERING ORDER BY (watched_at DESC);

CREATE TABLE video_metadata (
  video_id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  duration_seconds INT,
  release_year INT,
  genres LIST<TEXT>,
  thumbnail_url TEXT,
  video_urls MAP<TEXT, TEXT>,  -- {"1080p": "s3://...", "720p": "s3://..."}

  INDEX idx_release_year (release_year)
);
```

**Pros:**
- ✅ Linear scalability (add nodes)
- ✅ Always-on availability (no single point of failure)
- ✅ Tunable consistency
- ✅ Great for time-series

**Cons:**
- ❌ No joins (need application-level)
- ❌ Limited query flexibility
- ❌ Eventual consistency (default)

**When to use:**
- Time-series data
- Append-heavy workload
- Global scale with multi-region
- High availability > consistency

**Alternative:**
- PostgreSQL: simpler but doesn't scale to Netflix size
- DynamoDB: fully managed, higher cost

## Video Encoding Pipeline

### Step 1: Upload Master Video

```
Content Studio → S3 (Master Quality)
- Original format (e.g., 4K ProRes, 100 GB)
- Stored in "raw" bucket
```

### Step 2: Encoding Jobs

```python
def encode_video(video_id, source_s3_path):
    """
    Trigger encoding pipeline.
    Produces multiple bitrate versions.
    """

    # Define bitrate ladder
    bitrates = [
        {"name": "4k", "resolution": "3840x2160", "bitrate": "25M"},
        {"name": "1080p", "resolution": "1920x1080", "bitrate": "5M"},
        {"name": "720p", "resolution": "1280x720", "bitrate": "2.5M"},
        {"name": "480p", "resolution": "854x480", "bitrate": "1M"},
        {"name": "360p", "resolution": "640x360", "bitrate": "500K"},
    ]

    # Start encoding jobs (parallel on AWS Batch / MediaConvert)
    for bitrate_config in bitrates:
        job_id = aws_mediaconvert.create_job({
            "input": source_s3_path,
            "output": {
                "destination": f"s3://netflix-encoded/{video_id}/{bitrate_config['name']}/",
                "video_codec": "H.264",
                "resolution": bitrate_config["resolution"],
                "bitrate": bitrate_config["bitrate"],
                "format": "HLS",  # HTTP Live Streaming
                "segment_duration": 4  # 4-second chunks
            }
        })

        kafka.publish("encoding-started", {
            "video_id": video_id,
            "job_id": job_id,
            "bitrate": bitrate_config["name"]
        })

    return {"status": "encoding", "video_id": video_id}
```

**Time to encode:**
```
1-hour video:
- 5 bitrates × 1 hour encoding (parallelized) = 1 hour
- With 100 instances: can encode 100 videos/hour
```

**Cost:**
```
AWS MediaConvert: $0.0075 per minute of output
1-hour video × 5 bitrates × 60 min × $0.0075 = $2.25 per video

For 10,000 titles: ~$22,500 one-time
```

### Step 3: HLS Manifest Generation

```
# master.m3u8 (playlist of playlists)
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=25000000,RESOLUTION=3840x2160
4k/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p/index.m3u8

# 1080p/index.m3u8 (chunks for 1080p)
#EXTM3U
#EXT-X-TARGETDURATION:4
#EXTINF:4.0,
segment0.ts
#EXTINF:4.0,
segment1.ts
...
```

**Client playback:**
```javascript
// Client downloads master.m3u8
// Measures bandwidth
// Decides to start with 720p
// Downloads 720p/index.m3u8
// Starts fetching segment0.ts, segment1.ts, ...
// If bandwidth increases, switches to 1080p/index.m3u8
```

### Step 4: Distribute to CDN

```
S3 Origin → CloudFront → Edge Locations → Open Connect Appliances → User
```

**Caching strategy:**
- Popular content (top 10%): cached at all edges
- Long-tail content: cached on-demand
- Cache TTL: 30 days (content immutable)

## Recommendation Engine

### Collaborative Filtering

```python
# Find users similar to you who watched similar content
def recommend(user_id, limit=20):
    # 1. Get user's watch history
    user_history = cassandra.execute("""
        SELECT video_id, completed FROM watch_history
        WHERE user_id = ?
        LIMIT 100
    """, user_id)

    watched_videos = {v['video_id'] for v in user_history if v['completed']}

    # 2. Find similar users (cosine similarity on watch vectors)
    similar_users = find_similar_users(user_id, limit=1000)

    # 3. Get what they watched that you haven't
    recommendations = {}
    for similar_user in similar_users:
        their_history = get_watch_history(similar_user.id)

        for video in their_history:
            if video.id not in watched_videos:
                recommendations[video.id] = recommendations.get(video.id, 0) + 1

    # 4. Rank by frequency
    ranked = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)

    return [video_id for video_id, count in ranked[:limit]]
```

**Pros:**
- ✅ Personalized to user
- ✅ Discovers unexpected content

**Cons:**
- ❌ Cold start (new users)
- ❌ Computational cost (O(n²) similarities)

### Content-Based Filtering

```python
def recommend_similar(video_id, limit=10):
    # 1. Get video metadata
    video = cassandra.execute("""
        SELECT genres, actors, director FROM video_metadata
        WHERE video_id = ?
    """, video_id)

    # 2. Find videos with similar metadata (ML embeddings)
    similar = elasticsearch.search({
        "query": {
            "more_like_this": {
                "fields": ["genres", "actors", "director"],
                "like": video,
                "min_term_freq": 1,
                "max_query_terms": 12
            }
        },
        "size": limit
    })

    return similar['hits']
```

**Pros:**
- ✅ Works for new users (no history needed)
- ✅ Explainable ("because you watched X")

**Cons:**
- ❌ Limited diversity (filter bubble)
- ❌ Requires good metadata

### Netflix Production (Hybrid)

```
1. Multiple models:
   - Collaborative filtering
   - Content-based
   - Trending (time-decayed popularity)
   - Context-aware (device, time of day)

2. Ensemble model (combine outputs):
   - Weight by user segment
   - A/B test weights continuously

3. Precompute top 1000 recommendations per user:
   - Run batch job nightly
   - Store in Cassandra
   - Serve from cache

4. Real-time personalization:
   - Rerank based on recent views
   - Inject trending content (10%)
```

## Playback Service

### Resume Functionality

```python
def get_playback_position(user_id, video_id):
    """Get resume position for user."""
    position = redis.get(f"playback:{user_id}:{video_id}")

    if position:
        return int(position)

    # Fallback to database
    result = cassandra.execute("""
        SELECT position_seconds FROM watch_history
        WHERE user_id = ? AND video_id = ?
        LIMIT 1
    """, user_id, video_id)

    if result:
        return result[0]['position_seconds']

    return 0  # Start from beginning

def update_playback_position(user_id, video_id, position_seconds):
    """Update resume position (called every 10 seconds during playback)."""

    # Update cache (fast)
    redis.setex(f"playback:{user_id}:{video_id}", 3600, position_seconds)

    # Async write to database (via Kafka)
    kafka.publish("playback-update", {
        "user_id": user_id,
        "video_id": video_id,
        "position_seconds": position_seconds,
        "timestamp": now()
    })
```

**Why Redis + Cassandra?**
- Redis: low-latency reads (5ms) for resume position
- Cassandra: durable storage for history
- Kafka: decouple playback updates from database writes

### Client-Side Logic

```javascript
// Video player reports position every 10 seconds
setInterval(() => {
  const position = player.getCurrentTime();

  fetch('/api/playback/update', {
    method: 'POST',
    body: JSON.stringify({
      video_id: currentVideo,
      position_seconds: Math.floor(position)
    })
  });
}, 10000);  // 10 seconds

// On load, resume from last position
const resumePosition = await fetch(`/api/playback/position?video_id=${videoId}`);
player.seekTo(resumePosition.position_seconds);
```

## API Design

```
GET /api/v1/videos?genre=action&limit=20&offset=0
Response:
{
  "videos": [
    {
      "video_id": "abc123",
      "title": "Inception",
      "thumbnail": "https://cdn.netflix.com/thumb/abc123.jpg",
      "duration_seconds": 8880,
      "genres": ["Action", "Sci-Fi"],
      "release_year": 2010,
      "rating": "PG-13"
    },
    ...
  ],
  "total": 150,
  "has_more": true
}

GET /api/v1/videos/{video_id}
Response:
{
  "video_id": "abc123",
  "title": "Inception",
  "description": "...",
  "manifest_url": "https://cdn.netflix.com/abc123/master.m3u8",
  "resume_position": 1234
}

POST /api/v1/playback/update
Request:
{
  "video_id": "abc123",
  "position_seconds": 1234
}

GET /api/v1/recommendations?limit=20
Response:
{
  "recommendations": [...],
  "reason": "Because you watched Inception"
}

GET /api/v1/search?q=inception&limit=10
Response:
{
  "results": [...],
  "suggestions": ["inception 2010", "inception explained"]
}
```

## Scaling Strategies

### 1. Global Content Distribution

```
- US West (Origin): S3 bucket
- US East: CloudFront edge
- Europe: CloudFront edge + Open Connect (London, Frankfurt)
- Asia: CloudFront edge + Open Connect (Tokyo, Singapore)
- Cache popular content at all edges
- Long-tail content pulled from nearest origin
```

### 2. Database Sharding

```python
# Shard Cassandra by user_id
def get_shard(user_id):
    return hash(user_id) % NUM_SHARDS

# Each shard handles 1/N of users
# Watch history queries confined to single shard
```

### 3. Read Replicas for Metadata

```
Master (writes) → Video metadata updates
  ↓
Slaves (reads) → Browse, search queries
```

## Bottlenecks & Solutions

### Bottleneck 1: Encoding Backlog

**Problem:** New releases need encoding fast (launch day)

**Solutions:**
- Pre-encode popular titles
- Scale AWS Batch to 10,000 instances for releases
- Prioritize encoding queue (new releases first)

### Bottleneck 2: CDN Cache Misses (New Releases)

**Problem:** New popular movie → millions request → origin overload

**Solutions:**
- Pre-warm CDN cache before launch
- Over-provision origin capacity for launch day
- Use origin shield (CloudFront → Shield → S3)

### Bottleneck 3: Thundering Herd (Popular Show Release)

**Problem:** 10M users start watching at midnight → spike

**Solutions:**
- Gradually release (time zones)
- Auto-scale infrastructure
- CDN handles 95%+ of load

## Monitoring & Metrics

```
Performance:
- Video start time: p50 < 1s, p99 < 3s
- Buffering ratio: < 0.1% of playback time
- CDN cache hit rate: > 95%
- Search latency: p50 < 100ms

Quality:
- Bitrate distribution (% at 1080p, 720p, etc.)
- Resolution switches per session (lower = better)

Business:
- Watch time per user per day: ~2 hours
- Completion rate: % who finish video
- Recommendation CTR: % who click recommended

Alerts:
- Video start time p99 > 5s
- Buffering ratio > 1%
- CDN cache hit < 90%
- Origin bandwidth > 10 TB/day (should be < 5%)
```

## Security

1. **DRM:** Widevine, FairPlay (encrypt video, decrypt on device)
2. **Authentication:** JWT tokens, device registration
3. **Geo-blocking:** Restrict content by region (licensing)
4. **Rate limiting:** Prevent scraping
5. **Content protection:** Watermarking to trace leaks

## Cost Estimation (AWS)

```
Storage:
- S3: 1.8 PB × $0.023/GB = $41,400/month
- Intelligent Tiering (cold content): ~$25,000/month

CDN:
- CloudFront: 15 PB/day × 30 days = 450 PB/month
- At $0.085/GB = $38M/month
- With Open Connect (95% offload): ~$2M/month

Compute:
- EC2: 1,000 servers × $200/month = $200,000/month

Database:
- Cassandra: 100 nodes × $500/month = $50,000/month

Encoding:
- MediaConvert: $2.25/video × 100 new videos/month = $225/month

Total: ~$2.3M/month (~$28M/year) with Open Connect
Without Open Connect: ~$40M/month
Savings from Open Connect: ~$450M/year
```

## Interview Talking Points

### Adaptive Bitrate Streaming

"The key challenge is varying user bandwidth. I'd use HLS with 5 bitrates from 360p to 4K, split into 4-second chunks. Client measures bandwidth and switches bitrates dynamically. Trade-off is 5x storage, but essential for good UX."

### CDN Strategy

"At Netflix scale (15 PB/day), CDN costs are prohibitive ($465M/year). They built Open Connect - appliances in ISPs. Benefits ISPs (reduced peering) and Netflix (free hosting). Only viable at extreme scale."

### Recommendation Engine

"I'd use hybrid approach: collaborative filtering for personalization, content-based for cold start, trending for discovery. Precompute top 1000 per user nightly, then rerank real-time. Trade-off is compute cost vs recommendation quality."

### Database Choice

"Cassandra for watch history - time-series data, massive writes (1B/day), global scale. PostgreSQL for billing - ACID for payments. This is polyglot persistence."
