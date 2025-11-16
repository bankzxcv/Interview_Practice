# Design News Feed

## Problem Statement

Design a news feed system like Facebook/LinkedIn that displays personalized content from friends and followed pages with ranking, real-time updates, and efficient delivery.

## Requirements

- Generate personalized feed for users
- Rank content by relevance (not just chronological)
- Real-time updates (new posts appear)
- Handle millions of DAU
- Support different content types (text, images, videos)

## Architecture

```
User → API → Feed Service → [Fan-out Service, Ranking Engine] → Cache → Storage
```

## Fan-Out Approaches

### 1. Fan-Out on Write (Push)

```python
def create_post(user_id, content):
    # 1. Save post
    post_id = db.insert_post(user_id, content)

    # 2. Get followers
    followers = db.get_followers(user_id)  # e.g., 5000 followers

    # 3. Push to each follower's feed
    for follower_id in followers:
        redis.zadd(f"feed:{follower_id}", {post_id: timestamp})

# Read feed (fast!)
def get_feed(user_id, limit=20):
    post_ids = redis.zrevrange(f"feed:{user_id}", 0, limit-1)
    posts = db.get_posts(post_ids)
    return posts
```

**Pros**: ✅ Fast reads, **Cons**: ❌ Slow writes for celebrities

### 2. Fan-Out on Read (Pull)

```python
def get_feed(user_id, limit=20):
    # 1. Get followed users
    following = db.get_following(user_id)

    # 2. Fetch posts from each
    all_posts = []
    for followed_id in following:
        posts = db.get_posts_by_user(followed_id, limit=50)
        all_posts.extend(posts)

    # 3. Merge and sort
    all_posts.sort(key=lambda p: p.timestamp, reverse=True)
    return all_posts[:limit]
```

**Pros**: ✅ Fast writes, **Cons**: ❌ Slow reads

### 3. Hybrid (Production)

```python
def create_post(user_id, content):
    follower_count = db.get_follower_count(user_id)

    if follower_count < 10000:
        # Regular user: fan-out on write
        fan_out_to_followers(user_id, post_id)
    else:
        # Celebrity: skip fan-out, pull on read
        mark_as_celebrity(user_id)

def get_feed(user_id):
    # Get precomputed feed
    feed = redis.zrevrange(f"feed:{user_id}", 0, 19)

    # Merge with celebrity posts
    celebrities = db.get_followed_celebrities(user_id)
    for celeb_id in celebrities:
        recent_posts = db.get_recent_posts(celeb_id, limit=10)
        feed.extend(recent_posts)

    # Rank and return
    feed.sort(key=rank_score, reverse=True)
    return feed[:20]
```

## Ranking Algorithm

```python
def rank_score(post):
    # Factors:
    # 1. Recency (decay over time)
    age_hours = (now() - post.created_at).total_seconds() / 3600
    time_score = 1 / (age_hours + 2) ** 1.5

    # 2. Engagement (likes, comments, shares)
    engagement_score = (
        post.like_count * 1.0 +
        post.comment_count * 2.0 +
        post.share_count * 3.0
    )

    # 3. Content type (video > image > text)
    type_score = {'video': 1.5, 'image': 1.2, 'text': 1.0}[post.type]

    # 4. Creator affinity (close friends > acquaintances)
    affinity = get_user_affinity(current_user, post.author)

    # Combined score
    return time_score * engagement_score * type_score * affinity
```

## Database Design

```sql
CREATE TABLE posts (
  post_id UUID PRIMARY KEY,
  user_id UUID,
  content TEXT,
  type VARCHAR(20),  -- text, image, video
  media_url TEXT,
  created_at TIMESTAMP,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,

  INDEX idx_user_time (user_id, created_at DESC)
);

CREATE TABLE follows (
  follower_id UUID,
  followee_id UUID,
  created_at TIMESTAMP,
  PRIMARY KEY (follower_id, followee_id)
);

CREATE TABLE feed_cache (
  user_id UUID,
  post_id UUID,
  score DECIMAL,
  inserted_at TIMESTAMP,
  PRIMARY KEY (user_id, score DESC, post_id)
);
```

## Real-Time Updates

```python
# WebSocket for live updates
def on_new_post(post):
    # Notify online followers
    followers = get_online_followers(post.user_id)

    for follower_id in followers:
        websocket.send(follower_id, {
            "type": "new_post",
            "post": serialize(post)
        })
```

## Scaling

1. **Cache Feeds**: Redis (hot data), Cassandra (cold data)
2. **Shard by User**: user_id → shard
3. **Read Replicas**: 10 slaves for read queries
4. **CDN**: Media files on CloudFront

## Interview Talking Points

"News feed key challenge is fan-out problem. Use hybrid: push for regular users (<10K followers), pull for celebrities. Rank by engagement + recency + affinity. Cache feeds in Redis. For real-time, WebSocket to notify online users. Scale with sharding by user_id and read replicas."
