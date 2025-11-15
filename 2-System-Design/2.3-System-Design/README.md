# System Design Interview Preparation

## Overview

This comprehensive guide contains detailed system design problems with in-depth analysis of architectural decisions, trade-offs, and engineering considerations. Each problem includes:

- ✅ **Design critiques** - WHY we make each decision
- ✅ **Pros and cons** - Specific conditions and constraints
- ✅ **Multiple approaches** - Comparing alternatives
- ✅ **Real-world examples** - What companies actually use
- ✅ **Capacity estimation** - Concrete calculations
- ✅ **Interview talking points** - How to present your design

## Quick Start

**New to system design?** Start with these problems in order:

1. [URL Shortener](./problems/03-url-shortener.md) - Learn key generation, caching, analytics
2. [Twitter](./problems/01-twitter.md) - Master fan-out strategies, timeline generation
3. [Instagram](./problems/02-instagram.md) - Understand async processing, feed ranking
4. [Multi-Tenant SaaS](./problems/16-multi-tenant-saas.md) - Learn data isolation strategies

**For interviews tomorrow?** Focus on:
- Twitter (most commonly asked)
- URL Shortener (often used as warmup)
- Your domain-specific problem (e.g., if interviewing at Uber, study ride-sharing)

## All Problems

**→ [See Complete Problem List & Learning Path](./problems/README.md)**

### Available Problems (Detailed)

#### Social Media & Content
- [Twitter](./problems/01-twitter.md) - Timeline, follows, fan-out strategies
- [Instagram](./problems/02-instagram.md) - Photo sharing, feed ranking, async processing

#### Infrastructure & Cloud
- [Multi-Tenant SaaS Platform](./problems/16-multi-tenant-saas.md) ⭐ NEW - Tenant isolation, data partitioning, tiered architecture

#### Utilities
- [URL Shortener](./problems/03-url-shortener.md) - Key generation, redirects, analytics

### Coming Soon

Additional problems with full detail (check [problems directory](./problems/)):
- Uber/Lyft - Geospatial, real-time matching
- Netflix - Video streaming, CDN
- WhatsApp - Real-time messaging, E2E encryption
- YouTube - Video transcoding, storage
- Google Drive - File sync, conflict resolution
- Ticketmaster - Concurrency, inventory
- Web Crawler - Distributed crawling, politeness
- Distributed Cache - Consistency, eviction
- Yelp - Geospatial search
- Rate Limiter - Token bucket, distributed
- Notification System - Multi-channel delivery
- And many more...

## What Makes This Guide Different?

### 1. Deep Dive into Design Decisions

Instead of just saying "use Redis for caching," we explain:

**Example from Twitter:**
```
Decision: Use hybrid fan-out (write for regular users, read for celebrities)

Why?
- Regular users have < 10K followers → fan-out on write is fast
- Celebrities have 100M+ followers → fan-out would take hours
- 90% of users are regular → optimize for common case

Pros:
✅ Fast reads for 90% of users
✅ Avoids celebrity fan-out storm
✅ Best of both worlds

Cons:
❌ More complex implementation
❌ Celebrity followers have slower reads
❌ Need to maintain celebrity threshold

Constraints that drive this:
- Timeline must load in < 500ms (product requirement)
- Cannot fan-out to 100M timelines on every tweet
- Storage duplication acceptable (cheaper than compute)

This is what Twitter actually uses in production.
```

### 2. Multiple Approaches with Trade-offs

**Example from Multi-Tenant SaaS:**

We compare THREE database strategies:
1. **Separate database per tenant** (highest isolation, highest cost)
2. **Separate schema per tenant** (medium isolation, medium cost)
3. **Shared schema with tenant_id** (lowest isolation, lowest cost)

With detailed cost analysis, security implications, and when to use each.

### 3. Real Numbers and Calculations

Not just "millions of users" - we calculate:
```
100M DAU × 2 tweets/day = 200M tweets/day
200M / 86,400 sec = 2,300 tweets/sec
Peak (3x) = 7,000 tweets/sec

This tells us:
- Need message queue (Kafka) to handle spikes
- Database must support 7K writes/sec
- Can't use single MySQL instance (limits at ~2K writes/sec)
→ Must use Cassandra or sharded setup
```

### 4. Engineering Context

Every decision includes:
- **Why it's needed** (constraints, requirements)
- **When to use it** (specific conditions)
- **Alternatives considered** (what else we could do)
- **Real-world usage** (what companies actually use)

## Interview Framework

### The 6-Step Approach

Use this framework for ANY system design problem:

#### 1. Requirements (5 min)
```
Functional: What features?
Non-functional: Scale, latency, availability?
Out of scope: What are we NOT building?
```

#### 2. Capacity Estimation (5 min)
```
Traffic: Read QPS? Write QPS?
Storage: How much data over time?
Bandwidth: Upload/download rates?
Memory: Cache size needed?
```

#### 3. High-Level Design (10 min)
```
Draw main components
Explain data flow
Identify bottlenecks
```

#### 4. Deep Dives (15-20 min)
```
Database schema & choice (SQL vs NoSQL, why?)
API design
Critical algorithms
Trade-off analysis with pros/cons
```

#### 5. Scalability (5 min)
```
How to shard/partition?
Caching strategy?
Load balancing approach?
```

#### 6. Wrap-up (5 min)
```
Bottlenecks and solutions
Monitoring strategy
Trade-offs made
```

## Key Concepts Reference

### When to Use What Database

```
PostgreSQL:
✅ Complex queries, joins
✅ ACID transactions required
✅ Moderate scale (< 1B rows)
❌ Don't use for: time-series data, massive scale

Cassandra:
✅ Time-series data (tweets, events)
✅ Massive write throughput
✅ Linear scalability
❌ Don't use for: complex queries, strong consistency

DynamoDB:
✅ Key-value lookups
✅ Unpredictable traffic (auto-scaling)
✅ Serverless architecture
❌ Don't use for: complex queries, cost-sensitive apps

Redis:
✅ Caching
✅ Real-time leaderboards
✅ Pub/sub
❌ Don't use for: primary data store (not durable)

Neo4j:
✅ Complex graph queries
✅ Social networks, recommendations
❌ Don't use for: simple relationships (PostgreSQL fine)
```

### Caching Strategies

```
Cache-Aside (Lazy Loading):
- Read from cache
- On miss: read DB, write to cache
- Use when: read-heavy, ok with cache misses

Write-Through:
- Write to cache AND DB synchronously
- Use when: need consistency, can't tolerate stale data

Write-Behind (Write-Back):
- Write to cache, async write to DB
- Use when: write-heavy, eventual consistency ok
```

### Fan-out Strategies

```
Fan-out on Write (Push):
- Pre-compute results on write
- Fast reads, slow writes
- Use when: read >> writes (100:1 ratio)

Fan-out on Read (Pull):
- Compute on-demand on read
- Fast writes, slow reads
- Use when: writes >> reads, or too many recipients

Hybrid:
- Push for most users, pull for celebrities
- Best of both worlds
- Use in production (Twitter, Instagram)
```

## Common Patterns

### 1. Async Processing with Message Queue

**When to use:** Operation takes > 1 second, user doesn't need immediate result

```
User request → API (return immediately) → Queue → Worker (process async)

Examples:
- Image resizing (Instagram)
- Video transcoding (YouTube)
- Email sending (notifications)
- Feed fan-out (Twitter)
```

### 2. CDN for Media

**When to use:** Serving static content (images, videos, CSS/JS)

```
Without CDN: All requests → Origin (slow, expensive)
With CDN: 90%+ requests → Edge locations (fast, cheap)

ROI: 3-10x latency improvement, 40% cost reduction
```

### 3. Rate Limiting

**When to use:** Prevent abuse, ensure fair usage

```
Token Bucket (most common):
- Refill N tokens per second
- Request consumes 1 token
- Reject if no tokens available

Use: APIs, user actions
```

### 4. Sharding

**When to use:** Single database can't handle load

```
Shard by user_id: All user's data in same shard
Shard by geography: EU data in EU, US data in US
Shard by time: Last 7 days hot, older data cold

Choose based on access patterns!
```

## Interview Tips

### DO ✅

1. **Ask clarifying questions** - "What's the expected scale? Is real-time required?"
2. **Think out loud** - Explain your reasoning
3. **Draw diagrams** - Visual > verbal
4. **Discuss trade-offs** - "Approach A is faster but costs more..."
5. **Mention real examples** - "This is what Netflix does..."
6. **Start simple, then scale** - Don't over-engineer
7. **Consider failures** - "What if the database goes down?"

### DON'T ❌

1. **Jump to solution** - Clarify requirements first
2. **Ignore scale** - Always do capacity estimation
3. **Memorize solutions** - Understand principles
4. **Forget monitoring** - How do you know it's working?
5. **Avoid saying "I don't know"** - Better to reason through it
6. **Get stuck in details** - Stay high-level initially
7. **Design in isolation** - Engage interviewer in discussion

## Study Plan

### Week 1: Fundamentals
- Read about CAP theorem, consistency models
- Study caching strategies (cache-aside, write-through)
- Learn database types (SQL, NoSQL, when to use each)
- Practice: URL Shortener, Rate Limiter

### Week 2: Common Patterns
- Fan-out strategies (push, pull, hybrid)
- Sharding and partitioning
- Load balancing and CDN
- Practice: Twitter, Instagram

### Week 3: Advanced Topics
- Geospatial indexing (QuadTree, Geohash)
- Real-time systems (WebSocket, SSE)
- Consistency and distributed transactions
- Practice: Uber, Google Docs

### Week 4: Mock Interviews
- Do 2-3 problems under time pressure (45 min each)
- Practice explaining trade-offs
- Focus on communication, not perfection

## Resources

### Books
- **Designing Data-Intensive Applications** by Martin Kleppmann (MUST READ)
- **System Design Interview** by Alex Xu

### Blogs
- High Scalability (highscalability.com)
- Engineering blogs: Netflix, Uber, Airbnb, LinkedIn, Meta

### Practice
- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- Pramp (mock interviews)
- interviewing.io

## Contributing

When adding new problems, ensure you include:
1. **Design critiques** - WHY, not just WHAT
2. **Pros and cons** - With specific conditions
3. **Multiple approaches** - Compare alternatives
4. **Real numbers** - Capacity estimation
5. **Engineering context** - Constraints that drive decisions

See [problems/README.md](./problems/README.md) for the full template.

---

**Remember:** Interviewers want to see how you think, not just what you know. Discussing trade-offs and explaining your reasoning is more important than having the "right" answer.

Good luck with your interviews! 🚀
