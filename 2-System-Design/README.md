# System Design Interview Guide

## Table of Contents
1. [Overview](#overview)
2. [Approaching System Design Questions](#approaching-system-design-questions)
3. [Key Concepts](#key-concepts)
4. [Interview Framework](#interview-framework)
5. [Subsections](#subsections)

---

## Overview

System design interviews evaluate your ability to design scalable, reliable, and maintainable systems. Unlike coding interviews, there's no single "correct" answer. Interviewers assess:

- **Problem-solving ability**: How you break down complex problems
- **Communication skills**: How you articulate trade-offs and decisions
- **Technical breadth**: Knowledge of various technologies and patterns
- **Practical experience**: Real-world engineering judgment
- **Scalability thinking**: How you handle growth from 100 to 100M users

**Key mindset**: System design is about **trade-offs**, not perfect solutions. Every decision has pros and cons.

---

## Approaching System Design Questions

### The Golden Rule
**ASK QUESTIONS FIRST** - Never jump into designing without understanding requirements.

### Common Pitfalls to Avoid
- ❌ Jumping to solutions immediately
- ❌ Focusing on one aspect and ignoring others
- ❌ Not discussing trade-offs
- ❌ Using buzzwords without explaining them
- ❌ Not considering scale and numbers
- ❌ Ignoring failure scenarios

### What Interviewers Look For
- ✅ Systematic approach to problem-solving
- ✅ Ability to handle ambiguity
- ✅ Deep understanding of fundamentals
- ✅ Practical engineering judgment
- ✅ Communication and collaboration
- ✅ Awareness of real-world constraints

---

## Key Concepts

### 1. Scalability
The ability of a system to handle increased load.

**Vertical Scaling (Scale Up)**
- Add more power to existing machines (CPU, RAM, disk)
- **Pros**: Simple, no code changes, strong consistency
- **Cons**: Hardware limits, single point of failure, expensive
- **When to use**: Early stages, simpler applications, strong consistency needs

**Horizontal Scaling (Scale Out)**
- Add more machines to distribute load
- **Pros**: No theoretical limit, fault-tolerant, cost-effective
- **Cons**: Complex, eventual consistency, more coordination
- **When to use**: Large scale, high availability requirements

### 2. Reliability
The probability that a system performs correctly over time.

**Key Metrics**:
- **MTBF (Mean Time Between Failures)**: Average time between failures
- **MTTR (Mean Time To Repair)**: Average time to recover from failure
- **Availability = MTBF / (MTBF + MTTR)**

**Techniques**:
- Redundancy (no single point of failure)
- Replication (data and services)
- Failover mechanisms
- Circuit breakers
- Graceful degradation

### 3. Availability
The percentage of time a system is operational.

**SLA Levels**:
```
99% (2 nines)      = 3.65 days downtime/year
99.9% (3 nines)    = 8.76 hours downtime/year
99.99% (4 nines)   = 52.56 minutes downtime/year
99.999% (5 nines)  = 5.26 minutes downtime/year
```

**Achieving High Availability**:
- Eliminate single points of failure
- Use load balancers
- Deploy across multiple regions/zones
- Implement health checks and auto-recovery
- Plan for disaster recovery

### 4. CAP Theorem
You can only guarantee **2 out of 3**:

**C (Consistency)**: All nodes see the same data at the same time
**A (Availability)**: Every request receives a response
**P (Partition Tolerance)**: System continues despite network partitions

**In Practice** (network partitions WILL happen):
- **CP Systems**: Sacrifice availability for consistency (banking systems, inventory)
  - Examples: MongoDB (configurable), HBase, Redis (single instance)
- **AP Systems**: Sacrifice consistency for availability (social media, analytics)
  - Examples: Cassandra, DynamoDB, Couchbase

**Reality**: Most systems choose **eventual consistency** - AP with eventually consistent data.

### 5. Consistency Models

**Strong Consistency**
- Reads always return latest write
- High latency, lower availability
- Use when: Financial transactions, inventory management

**Eventual Consistency**
- Reads may return stale data temporarily
- Low latency, high availability
- Use when: Social media feeds, analytics, caching

**Causal Consistency**
- Related operations are seen in order
- Middle ground between strong and eventual

### 6. Latency vs Throughput

**Latency**: Time to perform a single operation
- Measured in: milliseconds (ms)
- User-facing impact: Response time

**Throughput**: Number of operations per time unit
- Measured in: requests/second (QPS/RPS)
- System capacity impact

**Trade-off**: Optimizing for one may hurt the other
- Example: Batching increases throughput but adds latency

### 7. Load Balancing

Distributes traffic across multiple servers.

**Algorithms**:
- **Round Robin**: Distribute evenly in order
- **Least Connections**: Send to server with fewest active connections
- **Least Response Time**: Send to fastest responding server
- **IP Hash**: Consistent hashing based on client IP
- **Weighted**: Based on server capacity

**Layers**:
- **L4 (Transport Layer)**: Based on IP/port, faster
- **L7 (Application Layer)**: Based on content, more flexible

### 8. Caching

Store frequently accessed data for faster retrieval.

**Cache Invalidation Strategies**:
- **TTL (Time To Live)**: Expire after fixed time
- **Write-through**: Write to cache and DB simultaneously
- **Write-back**: Write to cache, async write to DB
- **Write-around**: Write to DB, invalidate cache

**Cache Eviction Policies**:
- **LRU (Least Recently Used)**: Evict least recently accessed
- **LFU (Least Frequently Used)**: Evict least frequently accessed
- **FIFO**: Evict oldest entries

**Levels**:
```
Client → CDN → API Gateway → Application Cache → Database Cache → Database
         (ms)    (ms)          (ms)                (ms)            (10-100ms)
```

### 9. Database Strategies

**Replication**:
- **Master-Slave**: One writer, multiple readers
  - Pros: Read scalability, backups
  - Cons: Write bottleneck, replication lag
- **Master-Master**: Multiple writers
  - Pros: Better write performance, no single point of failure
  - Cons: Conflict resolution complexity

**Partitioning/Sharding**:
Divide data across multiple databases.

- **Horizontal**: Split rows (user 1-1000 on DB1, 1001-2000 on DB2)
- **Vertical**: Split columns (user profile vs. user posts)

**Sharding Strategies**:
- **Range-based**: Shard by ID ranges (1-1M, 1M-2M)
  - Pro: Simple, range queries easy
  - Con: Uneven distribution, hot shards
- **Hash-based**: Shard by hash(key) % N
  - Pro: Even distribution
  - Con: Range queries hard, resharding expensive
- **Directory-based**: Lookup table for shard location
  - Pro: Flexible
  - Con: Extra lookup, single point of failure

### 10. SQL vs NoSQL

**SQL (Relational)**:
- **When to use**: ACID compliance, complex queries, relational data
- **Examples**: PostgreSQL, MySQL, Oracle
- **Pros**: Strong consistency, mature ecosystem, complex joins
- **Cons**: Harder to scale horizontally, schema changes costly

**NoSQL**:
- **Document**: MongoDB, CouchDB (flexible schema, nested data)
- **Key-Value**: Redis, DynamoDB (simple, fast, high throughput)
- **Column-Family**: Cassandra, HBase (time-series, wide columns)
- **Graph**: Neo4j (relationships, social networks)

**Decision Framework**:
```
Need ACID + Complex Joins + Structured? → SQL
Need Scale + Flexibility + High Throughput? → NoSQL
Need Both? → Polyglot persistence (use both)
```

### 11. Message Queues

Asynchronous communication between services.

**Benefits**:
- Decoupling of services
- Load leveling (absorb traffic spikes)
- Reliability (retry failed tasks)
- Scalability (process jobs in parallel)

**Patterns**:
- **Point-to-Point**: One producer → Queue → One consumer
- **Pub/Sub**: Publisher → Topic → Multiple subscribers

**Technologies**:
- **RabbitMQ**: Flexible routing, AMQP protocol
- **Kafka**: High throughput, event streaming, retention
- **SQS/SNS**: Managed AWS service
- **Redis Streams**: Lightweight, in-memory

### 12. Microservices vs Monolith

**Monolith**:
- **Pros**: Simple to develop/deploy/test, no network overhead, strong consistency
- **Cons**: Hard to scale independently, long deployment cycles, technology lock-in

**Microservices**:
- **Pros**: Independent scaling/deployment, technology flexibility, fault isolation
- **Cons**: Complex operations, network overhead, eventual consistency, distributed debugging

**When to use**:
- Start with **monolith** for MVPs and small teams
- Move to **microservices** when: multiple teams, different scaling needs, independent releases

### 13. API Design

**REST**:
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Stateless, cacheable
- Simple, widely adopted

**GraphQL**:
- Query exactly what you need
- Single endpoint
- Reduces over/under-fetching
- More complex to implement

**gRPC**:
- Binary protocol, faster than JSON
- Strong typing (protobuf)
- Bidirectional streaming
- Less human-readable

### 14. Rate Limiting

Protect services from overload.

**Algorithms**:
- **Token Bucket**: Tokens added at fixed rate, consumed per request
- **Leaky Bucket**: Process requests at fixed rate
- **Fixed Window**: X requests per time window
- **Sliding Window**: Rolling time window

**Implementation Levels**:
- User level (prevent abuse)
- IP level (DDoS protection)
- API level (protect backend)

---

## Interview Framework

Follow this systematic approach in every system design interview:

### Step 1: Clarify Requirements (5 minutes)

**Functional Requirements**:
- "What are the core features we need to support?"
- "Who are the users and how will they interact?"
- "What's in scope vs out of scope?"

**Non-Functional Requirements**:
- "How many users do we expect?"
- "What's the read/write ratio?"
- "What's the expected latency?"
- "Do we need high availability?"
- "What's the consistency requirement?"

**Example Questions**:
```
- "Should this support mobile, web, or both?"
- "Do we need real-time updates or is eventual consistency okay?"
- "What's more important: consistency or availability?"
- "Are there any specific compliance requirements (GDPR, HIPAA)?"
```

### Step 2: Capacity Estimation (5 minutes)

Always do **back-of-the-envelope calculations**.

**Framework**:
```
1. Daily Active Users (DAU)
2. Requests per user per day
3. Total requests = DAU * requests/user
4. QPS = Total requests / 86,400 seconds
5. Peak QPS = QPS * 2-3x
6. Storage per user
7. Total storage = Users * storage/user * growth factor
8. Bandwidth = Data size * QPS
```

**Example (Twitter-like app)**:
```
Assumptions:
- 300M total users
- 100M DAU
- Each user: 2 tweets/day, 20 reads/day

Write Traffic:
- 100M users * 2 tweets/day = 200M tweets/day
- 200M / 86,400 = ~2,300 writes/sec
- Peak: 7,000 writes/sec

Read Traffic:
- 100M users * 20 reads/day = 2B reads/day
- 2B / 86,400 = ~23,000 reads/sec
- Peak: 70,000 reads/sec

Storage (5 years):
- 200M tweets/day * 365 days * 5 years = 365B tweets
- Average tweet: 280 chars * 2 bytes = 560 bytes
- Metadata: 200 bytes
- Total per tweet: ~1KB
- Total storage: 365B * 1KB = 365TB
- With replication (3x): ~1.1PB

Bandwidth:
- Writes: 2,300 req/s * 1KB = 2.3MB/s
- Reads: 23,000 req/s * 1KB = 23MB/s
```

**Always state assumptions clearly!**

### Step 3: High-Level Design (10-15 minutes)

Draw a box diagram with major components.

**Typical Components**:
```
┌──────────┐
│  Client  │
└────┬─────┘
     │
┌────▼────────────┐
│   CDN / Cache   │
└────┬────────────┘
     │
┌────▼────────────┐
│ Load Balancer   │
└────┬────────────┘
     │
┌────▼────────────┐
│  API Gateway    │
└────┬────────────┘
     │
┌────▼────────────┐    ┌──────────────┐
│  App Servers    ├────► Message Queue│
└────┬────────────┘    └──────────────┘
     │
┌────▼────────────┐
│  Cache Layer    │
└────┬────────────┘
     │
┌────▼────────────┐
│   Databases     │
└─────────────────┘
```

**Discuss**:
- Client-server interaction
- Data flow (read path vs write path)
- Where to cache
- How to scale each component

### Step 4: API Design (5 minutes)

Define key APIs.

**Example (URL Shortener)**:
```
POST /api/v1/shorten
Request: { "long_url": "https://..." }
Response: { "short_url": "https://short.ly/abc123" }

GET /api/v1/{short_code}
Response: 302 Redirect to long_url

GET /api/v1/stats/{short_code}
Response: { "clicks": 1234, "created_at": "..." }
```

**Considerations**:
- RESTful conventions
- Versioning (/v1/, /v2/)
- Authentication
- Rate limiting
- Pagination

### Step 5: Database Design (5 minutes)

Design schema based on requirements.

**Questions to Ask Yourself**:
- SQL or NoSQL?
- What are the access patterns?
- Do we need ACID?
- How to partition/shard?

**Example (URL Shortener)**:
```sql
Table: urls
┌────────────┬──────────────┬─────────────┬─────────────┐
│ short_code │  long_url    │  user_id    │ created_at  │
├────────────┼──────────────┼─────────────┼─────────────┤
│  abc123    │ https://...  │    12345    │ 2024-01-01  │
└────────────┴──────────────┴─────────────┴─────────────┘
Primary Key: short_code
Index: user_id, created_at

Table: analytics
┌────────────┬───────────┬────────────┬──────────┐
│ short_code │  clicks   │  last_used │    ...   │
└────────────┴───────────┴────────────┴──────────┘
```

### Step 6: Deep Dive (15-20 minutes)

Interviewer will ask to go deeper on specific areas.

**Common Deep Dive Topics**:
- **Scaling**: "How would you handle 10x traffic?"
- **Failure scenarios**: "What if the database goes down?"
- **Consistency**: "How do you ensure data consistency?"
- **Performance**: "How would you optimize latency?"
- **Security**: "How do you prevent abuse?"

**Approach**:
1. Identify bottlenecks
2. Propose solutions
3. Discuss trade-offs
4. Choose best approach with reasoning

### Step 7: Wrap Up (5 minutes)

**Discuss**:
- **Monitoring**: What metrics to track?
  - QPS, latency (p50, p95, p99), error rate, CPU/memory
- **Alerting**: When to alert?
- **Logging**: What to log?
- **Future enhancements**: What would you add next?

---

## Subsections

### [2.1 Backend Design](./2.1-Backend-Design/README.md)
- REST API design
- Rate limiting
- Caching systems
- Job queues
- Authentication systems
- 10+ backend-focused problems with detailed solutions

### [2.2 Frontend Design](./2.2-Frontend-Design/README.md)
- Component architecture
- State management
- Real-time features
- Performance optimization
- 10+ frontend-focused problems with multiple approaches

### [2.3 System Design](./2.3-System-Design/README.md)
- Complete end-to-end system designs
- Twitter, Instagram, Uber, Netflix, etc.
- Detailed capacity planning
- Trade-off analysis
- 10+ comprehensive system design problems

### [2.4 Cloud Integration](./2.4-Cloud-Integration/README.md)
- AWS, GCP, Azure services
- Cloud vs on-premise
- Cost estimation
- Serverless architectures
- Container orchestration

---

## General Tips for Success

### Communication
- **Think out loud**: Interviewers want to understand your thought process
- **Ask clarifying questions**: Shows you don't make assumptions
- **Discuss trade-offs**: There's no perfect solution
- **Be open to feedback**: Adjust based on hints

### Technical Approach
- **Start simple, then optimize**: Don't over-engineer initially
- **Use numbers**: Always back up decisions with calculations
- **Know your fundamentals**: Deep understanding > buzzwords
- **Be practical**: Real-world constraints matter

### Time Management
- Don't get stuck on one component
- Cover breadth first, depth second
- Leave time for discussion
- Practice with a timer

### Red Flags to Avoid
- "I would use Kafka" → **Why?** What's the trade-off?
- Designing without asking questions
- Ignoring scale considerations
- Not discussing failures
- Using technologies you don't understand

---

## Recommended Study Path

1. **Week 1-2**: Master fundamentals (all key concepts above)
2. **Week 3-4**: Backend design problems (start simple)
3. **Week 5-6**: Frontend design problems
4. **Week 7-8**: Complete system designs
5. **Week 9-10**: Cloud integration and advanced topics
6. **Week 11-12**: Mock interviews and practice

**Practice Routine**:
- 2-3 problems per week minimum
- Do calculations on paper
- Draw diagrams
- Time yourself (45 minutes)
- Review solutions and alternatives

---

## Resources

**Books**:
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "System Design Interview" by Alex Xu (Volumes 1 & 2)

**Online**:
- ByteByteGo (YouTube channel)
- systemdesignprimer on GitHub
- High Scalability blog

**Practice**:
- Pramp (free mock interviews)
- interviewing.io
- Exponent

---

**Remember**: System design is as much about the **journey** as the destination. Interviewers care more about **how you think** than the final diagram. Show your reasoning, acknowledge trade-offs, and communicate clearly.

Good luck!
