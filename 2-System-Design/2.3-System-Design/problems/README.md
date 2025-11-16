# System Design Problems - Comprehensive Collection

This directory contains detailed system design problems with in-depth analysis, architectural decisions, pros/cons, and engineering trade-offs.

## How to Use This Guide

Each problem includes:
- **Requirements clarification** (functional & non-functional)
- **Capacity estimation** (traffic, storage, bandwidth)
- **High-level architecture** with diagrams
- **Design decisions with critiques** - WHY we make each choice
- **Pros and cons** with specific conditions/constraints
- **Database design** with trade-off analysis
- **API design**
- **Scalability strategies**
- **Monitoring and alerting**
- **Interview talking points**

## Problems by Category

### Social Media & Content Platforms
1. [Twitter](./01-twitter.md) - Social media with timeline, follows, real-time updates
2. [Instagram](./02-instagram.md) - Photo/video sharing with feed ranking
3. [News Feed](./15-news-feed.md) - ML-based ranking, fan-out strategies
4. [YouTube](./07-youtube.md) - Video streaming, transcoding, CDN
5. [WhatsApp/Messenger](./06-whatsapp.md) - Real-time messaging, E2E encryption

### Infrastructure & Cloud Services
6. [Multi-Tenant SaaS Platform](./16-multi-tenant-saas.md) - Tenant isolation, data partitioning
7. [Distributed Cache](./11-distributed-cache.md) - Consistency, eviction, partitioning
8. [API Gateway](./38-api-gateway.md) - Rate limiting, authentication, routing
9. [Log Aggregation](./34-log-aggregation.md) - ELK stack, time-series data
10. [Service Mesh](./36-service-mesh.md) - Istio, circuit breaking, mutual TLS

### Marketplace & E-commerce
11. [Uber/Lyft](./04-uber.md) - Geospatial indexing, real-time matching
12. [Ticketmaster](./09-ticketmaster.md) - Concurrency control, seat locking

### Utilities & Tools
13. [URL Shortener](./03-url-shortener.md) - Key generation, analytics, redirects
14. [Web Crawler](./10-web-crawler.md) - Politeness, deduplication, distributed crawling
15. [Notification System](./14-notification-system.md) - Multi-channel, priority queues
16. [Rate Limiter](./13-rate-limiter.md) - Token bucket, distributed coordination

### Media & Streaming
17. [Netflix](./05-netflix.md) - Adaptive bitrate, CDN, recommendations

### Collaboration & Productivity
18. [Google Drive/Dropbox](./08-dropbox.md) - File sync, delta sync, conflict resolution

### Data & Search
19. [Yelp/Nearby Places](./12-yelp.md) - Geohashing, QuadTree, R-tree
20. [Search Engine](./19-search-engine.md) - Crawling, indexing, ranking

### Financial & Trading
21. [Stock Trading Platform](./17-stock-trading.md) - Low latency, ACID, order matching
22. [Payment Processing System](./18-payment-processing.md) - Idempotency, 2-phase commit

### Advanced Problems
23. [Global CDN](./29-global-cdn.md) - Edge caching, DDoS protection, anycast routing
24. [ML Training Platform](./30-ml-training-platform.md) - Distributed training, hyperparameter tuning
25. [Real-Time Multiplayer Game](./31-realtime-multiplayer-game.md) - Authoritative server, lag compensation
26. [Distributed File System](./32-distributed-file-system.md) - HDFS/GFS, replication, fault tolerance
27. [Blockchain/Cryptocurrency](./33-blockchain-cryptocurrency.md) - Proof of Work, consensus
28. [Messaging Queue](./35-messaging-queue.md) - Kafka, at-least-once/exactly-once delivery
29. [Real-Time Analytics](./37-real-time-analytics.md) - Stream processing, time-series DB

## Learning Path

### Beginner (Start Here)
1. URL Shortener - Learn about key generation, caching, analytics
2. Rate Limiter - Token bucket, sliding window algorithms
3. Notification System - Message queues, fan-out patterns
4. Yelp - Geospatial indexing basics

### Intermediate
5. Twitter - Fan-out on write vs read, cache strategies
6. Instagram - Image processing pipeline, feed ranking
7. News Feed - Ranking algorithms, hybrid fan-out
8. Web Crawler - Distributed systems, politeness
9. Ticketmaster - Concurrency control, pessimistic locking
10. Netflix - Adaptive bitrate, CDN strategies
11. Dropbox - File chunking, delta sync
12. Payment Processing - Idempotency, distributed transactions

### Advanced
13. Multi-Tenant SaaS - Data isolation strategies, per-tenant resources
14. Stock Trading Platform - Low latency, high throughput, ACID
15. Global CDN - Edge caching, DDoS protection, anycast
16. ML Training Platform - Distributed training, GPU scheduling
17. Real-Time Multiplayer Game - Authoritative server, lag compensation
18. Distributed File System - Replication, fault tolerance, HDFS
19. Blockchain - Consensus mechanisms, Proof of Work
20. Real-Time Analytics - Stream processing, time-series optimization

## Key Concepts Covered

### Data Storage
- **SQL vs NoSQL**: When to use each
- **Sharding strategies**: Hash-based, range-based, geography-based
- **Replication**: Master-slave, master-master, quorum
- **Partitioning**: Horizontal vs vertical
- **Data models**: Document, key-value, column-family, graph

### Caching
- **Cache strategies**: Cache-aside, write-through, write-behind
- **Eviction policies**: LRU, LFU, FIFO
- **Distributed caching**: Consistent hashing, replication
- **Cache invalidation**: TTL, event-based

### Scalability
- **Load balancing**: Round-robin, least connections, IP hash
- **CDN**: Edge caching, origin shield
- **Async processing**: Message queues, pub/sub
- **Auto-scaling**: Horizontal vs vertical

### Consistency & Availability
- **CAP theorem**: Consistency, Availability, Partition tolerance
- **Consistency models**: Strong, eventual, causal
- **Distributed transactions**: 2PC, Saga pattern
- **Idempotency**: Handling duplicate requests

### Real-time Systems
- **WebSocket**: Bidirectional communication
- **Server-Sent Events**: One-way updates
- **Long polling**: Legacy real-time
- **Pub/Sub**: Redis, Kafka

### Geospatial
- **Geohashing**: Proximity search
- **QuadTree**: Spatial indexing
- **R-tree**: Range queries
- **S2 Geometry**: Google's geospatial library

## Interview Framework

For EVERY problem, follow this structure:

### 1. Requirements (5 minutes)
- Clarify functional requirements
- Define non-functional requirements (scale, latency, availability)
- Identify out-of-scope items

### 2. Capacity Estimation (5 minutes)
- Traffic (QPS: reads, writes)
- Storage (data size × time)
- Bandwidth (traffic × data size)
- Memory (for caching)

### 3. High-Level Design (10 minutes)
- Draw main components
- Explain data flow
- Identify bottlenecks

### 4. Deep Dives (15-20 minutes)
- Database schema
- API design
- Critical algorithms
- Trade-off analysis with pros/cons

### 5. Scalability (5 minutes)
- Sharding strategy
- Caching strategy
- Load balancing
- Monitoring

### 6. Discussion (5 minutes)
- Bottlenecks and solutions
- Trade-offs made
- Alternative approaches
- Future improvements

## Common Mistakes to Avoid

1. **Jumping to solution too quickly** - Always clarify requirements first
2. **Ignoring scale** - Always do capacity estimation
3. **Over-engineering** - Start simple, then scale
4. **Forgetting monitoring** - Always discuss metrics and alerts
5. **Not explaining trade-offs** - Every decision has pros and cons
6. **Ignoring edge cases** - Discuss failures, race conditions
7. **Skipping API design** - Interfaces matter

## Tips for Success

1. **Think out loud** - Explain your reasoning
2. **Draw diagrams** - Visual communication is key
3. **Ask clarifying questions** - Better to ask than assume
4. **Discuss trade-offs** - Show you understand pros/cons
5. **Start high-level, then drill down** - Don't get lost in details
6. **Mention real-world examples** - "This is what Netflix does..."
7. **Be honest** - Say "I don't know" if you don't, then reason through it

## Additional Resources

- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [Designing Data-Intensive Applications](https://dataintensive.net/) by Martin Kleppmann
- [High Scalability Blog](http://highscalability.com/)
- Engineering blogs: Netflix, Uber, Airbnb, LinkedIn

## Contributing

Each problem follows this template:
- Problem statement
- Requirements clarification
- Capacity estimation
- High-level architecture
- Design decisions WITH critiques (pros/cons/constraints)
- Database design
- API design
- Deep dives
- Scalability
- Monitoring
- Interview talking points

When adding a new problem, ensure you explain WHY each design decision is made, not just WHAT the decision is.

---

**Remember:** In interviews, the journey matters more than the destination. Showing your thought process, discussing trade-offs, and explaining why you make certain decisions is more valuable than having a "perfect" solution.

Good luck! 🚀
