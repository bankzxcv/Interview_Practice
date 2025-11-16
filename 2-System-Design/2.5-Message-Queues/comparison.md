# Message Queue Technology Comparison

## Quick Reference Table

| Feature | RabbitMQ | Kafka | AWS SQS | Azure Service Bus | Azure Storage Queue | Redis Streams |
|---------|----------|-------|---------|-------------------|---------------------|---------------|
| **Type** | Message Broker | Event Stream | Queue | Message Broker | Queue | Stream |
| **Model** | Push | Pull | Pull | Push/Pull | Pull | Pull |
| **Throughput** | 10K-50K msg/sec | 1M+ msg/sec | High | Medium | Medium | 100K+ msg/sec |
| **Latency** | Low (ms) | Low (ms) | Medium (100ms+) | Low (ms) | Medium | Very Low (μs) |
| **Message Size** | No limit | 1MB default | 256 KB | 256 KB (1MB premium) | 64 KB | Limited by RAM |
| **Ordering** | Per queue | Per partition | FIFO queue option | With sessions | No | Yes |
| **Delivery** | At-least-once | At-least-once | At-least-once (exactly-once with FIFO) | At-least-once | At-least-once | At-least-once |
| **Retention** | Until consumed | Days/weeks (configurable) | 14 days max | 14 days max | 7 days max | Manual trim |
| **Replay** | No | Yes | No | No | No | Yes |
| **Routing** | Complex (exchanges) | Simple (topics) | No | Filters | No | Simple |
| **Pub/Sub** | Yes (fanout) | Yes | SNS + SQS | Yes (topics) | No | Yes (groups) |
| **HA/Clustering** | Yes | Yes | Managed | Managed | Managed | Yes (Redis Cluster) |
| **Deployment** | Self-hosted | Self-hosted | Managed | Managed | Managed | Self-hosted |
| **Ops Complexity** | Medium | High | None | None | None | Low |
| **Cost** | Self-hosted | Self-hosted | $0.40/M requests | $10/month + $0.05/M | $0.01/M ops | Self-hosted |
| **Best For** | Microservices, RPC | Event streaming, analytics | AWS users, simple queues | Azure users, enterprise | Azure users, cheap queues | Low latency, Redis users |

---

## Detailed Comparisons

### 1. Message Model

#### RabbitMQ: Traditional Message Broker
```
Producer → Exchange (routing) → Queue → Consumer
                                  ↓
                         Message deleted after consumption
```
- Messages **deleted** after consumption
- Focus on **delivery** to consumer
- **Push model**: Broker pushes to consumers

**Use case**: Task queues, RPC, microservices

---

#### Kafka: Event Log
```
Producer → Topic/Partition → Consumers
                 ↓
          Events retained (not deleted)
```
- Events **retained** (days/weeks)
- Focus on **stream** of events
- **Pull model**: Consumers pull at own pace
- **Replay**: Consumers can re-read old events

**Use case**: Event sourcing, analytics, data pipelines

---

#### AWS SQS: Simple Queue
```
Producer → Queue → Consumer (poll)
             ↓
    Message deleted after processing
```
- Simple **point-to-point** queue
- **Pull model**: Consumers poll
- **Managed**: Zero ops

**Use case**: AWS ecosystem, simple async tasks

---

#### Redis Streams: Lightweight Stream
```
Producer → Stream (append-only) → Consumer Groups
                                     ↓
                            Messages retained
```
- **Append-only** log (like Kafka)
- **Consumer groups** for load balancing
- **In-memory**: Very fast

**Use case**: Low latency, already using Redis

---

### 2. Throughput & Latency

```
Throughput (messages/second):
─────────────────────────────────────────────────────────────
Kafka        ████████████████████████ 1,000,000+ msg/sec
Redis Streams██████████ 100,000 msg/sec
RabbitMQ     ████ 50,000 msg/sec
AWS SQS      ████ Variable (high, managed)
Azure SB     ███ 10,000-50,000 msg/sec
Azure Queue  ███ Variable

Latency (time per message):
─────────────────────────────────────────────────────────────
Redis Streams █ <1 ms (microseconds)
RabbitMQ      ██ 1-5 ms
Kafka         ██ 2-10 ms
Azure SB      ███ 5-20 ms
AWS SQS       █████ 10-100+ ms
Azure Queue   █████ 10-100+ ms
```

**Trade-off**: Latency vs Managed Service
- **Lowest latency**: Redis Streams (self-hosted)
- **Highest throughput**: Kafka (self-hosted)
- **Easiest ops**: AWS SQS / Azure (managed, higher latency)

---

### 3. Delivery Guarantees

| Technology | Default | Options |
|------------|---------|---------|
| **RabbitMQ** | At-least-once | Publisher confirms + consumer acks |
| **Kafka** | At-least-once | Exactly-once (with Kafka Streams/Transactions) |
| **AWS SQS** | At-least-once | Exactly-once (FIFO queues) |
| **Azure Service Bus** | At-least-once | Exactly-once (with sessions + transactions) |
| **Azure Storage Queue** | At-least-once | No exactly-once |
| **Redis Streams** | At-least-once | No built-in exactly-once |

**Reality**: Most systems use **at-least-once + idempotent handlers**
- Messages may be delivered multiple times
- Handlers designed to be safe to retry
- Check: "Have I already processed this message?"

---

### 4. Message Ordering

| Technology | Ordering Guarantee |
|------------|-------------------|
| **RabbitMQ** | ✅ Per queue (FIFO) |
| **Kafka** | ✅ Per partition (strong) |
| **AWS SQS Standard** | ❌ Best-effort (no guarantee) |
| **AWS SQS FIFO** | ✅ Strict FIFO |
| **Azure Service Bus** | ✅ With sessions |
| **Azure Storage Queue** | ❌ No guarantee |
| **Redis Streams** | ✅ Per stream |

**When order matters**:
- **Kafka**: Partition by key (e.g., user_id)
- **RabbitMQ**: Single queue per entity
- **AWS SQS**: Use FIFO queue (lower throughput)
- **Azure Service Bus**: Use sessions

---

### 5. Routing Capabilities

#### RabbitMQ: Advanced Routing
```
Producer → Direct Exchange → Queue (exact routing key)
        → Topic Exchange → Queue (pattern matching: *.error.*)
        → Fanout Exchange → All queues (broadcast)
        → Headers Exchange → Queue (match headers)
```
**Winner**: RabbitMQ (most flexible)

#### Kafka: Topic-Based
```
Producer → Topic (partitions) → Consumers
```
**Simple**: No routing, consumers filter

#### AWS SNS: Filtering
```
Publisher → Topic → Subscription (filter policy) → Queue
```
**Moderate**: Filter by message attributes

#### Others: Limited
- **SQS**: No routing
- **Azure Service Bus**: SQL filters on subscriptions
- **Redis Streams**: No routing

---

### 6. Pub/Sub Support

| Technology | Pub/Sub | Implementation |
|------------|---------|----------------|
| **RabbitMQ** | ✅ Yes | Fanout/Topic exchanges |
| **Kafka** | ✅ Yes | Topics with multiple consumer groups |
| **AWS** | ✅ Yes | SNS → SQS (fan-out) |
| **Azure Service Bus** | ✅ Yes | Topics/Subscriptions |
| **Azure Storage Queue** | ❌ No | Point-to-point only |
| **Redis Streams** | ✅ Yes | Multiple consumer groups |

---

### 7. Operations & Management

| Aspect | RabbitMQ | Kafka | AWS SQS/SNS | Azure | Redis Streams |
|--------|----------|-------|-------------|-------|---------------|
| **Setup** | Medium | Complex | Easy (console) | Easy (console) | Easy |
| **Scaling** | Manual | Manual | Auto | Auto | Manual |
| **Monitoring** | Management UI + metrics | Prometheus/Grafana | CloudWatch | Azure Monitor | Redis CLI + metrics |
| **Backups** | Manual | Manual | Managed | Managed | Redis backup |
| **Updates** | Manual | Manual | Managed | Managed | Manual |
| **Ops effort** | Medium | High | None | None | Low |

**Managed services win on ops**:
- AWS SQS/SNS: Zero ops
- Azure Storage Queue/Service Bus: Zero ops

**Self-hosted gives control**:
- RabbitMQ: Full control, medium ops
- Kafka: Full control, high ops
- Redis Streams: Full control, low ops

---

### 8. Cost Comparison

#### Example: 10 million messages/month

**AWS SQS**:
```
10M messages
= 10M send + 10M receive + 10M delete
= 30M requests
= 29M paid (1M free)
= 29 * $0.40 = $11.60/month
```

**Azure Storage Queue**:
```
30M operations
= $0.30/month

Winner: Cheapest!
```

**Azure Service Bus (Standard)**:
```
Base: $10/month
Operations: 30M * $0.05 = $1.50
= $11.50/month
```

**Self-Hosted (RabbitMQ/Kafka/Redis)**:
```
EC2 instance (t3.medium): $30/month
Storage: $5/month
= $35+/month

More expensive, but more control
```

**Cost-effectiveness**:
1. **Azure Storage Queue** (cheapest)
2. **AWS SQS** (cheap)
3. **Azure Service Bus** (moderate)
4. **Self-hosted** (more expensive, more control)

---

## Decision Matrix

### When to Use What?

```
Decision Tree:

START
  ↓
Already on AWS? ──Yes──> Use SQS/SNS
  ↓ No
Already on Azure? ──Yes──> Storage Queue (simple) or Service Bus (advanced)
  ↓ No
Need event replay? ──Yes──> Kafka or Redis Streams
  ↓ No
Need millions/sec throughput? ──Yes──> Kafka
  ↓ No
Need complex routing? ──Yes──> RabbitMQ
  ↓ No
Already using Redis? ──Yes──> Redis Streams
  ↓ No
Want managed service? ──Yes──> AWS SQS or Azure
  ↓ No
Default: RabbitMQ (good balance)
```

---

### By Use Case

#### 1. Microservices Communication
**Recommended**: RabbitMQ, AWS SQS + SNS, Azure Service Bus

**Why**:
- Need flexible routing
- Request-reply patterns
- Moderate throughput
- Don't need event replay

---

#### 2. Event-Driven Architecture
**Recommended**: Kafka, Redis Streams

**Why**:
- Need event replay
- Multiple consumers
- Stream processing
- Event sourcing

---

#### 3. Background Job Processing
**Recommended**: AWS SQS, Azure Storage Queue, RabbitMQ

**Why**:
- Simple queue operations
- Point-to-point
- Don't need ordering
- Cost-effective

---

#### 4. Real-Time Analytics / Metrics
**Recommended**: Kafka, Redis Streams

**Why**:
- High throughput
- Stream processing
- Low latency
- Retention for analysis

---

#### 5. IoT Data Ingestion
**Recommended**: Kafka, AWS IoT Core + Kinesis

**Why**:
- Very high throughput
- Time-series data
- Long retention
- Stream processing

---

#### 6. Notification System
**Recommended**: AWS SNS, Azure Service Bus Topics

**Why**:
- Pub/sub (fan-out)
- Multiple channels (email, SMS, push)
- Managed service
- Built-in integrations

---

#### 7. Order Processing (Strict Ordering)
**Recommended**: Kafka (partitioned), AWS SQS FIFO, Azure Service Bus (sessions)

**Why**:
- Guaranteed ordering
- Exactly-once delivery (optional)
- Reliable

---

#### 8. Log Aggregation
**Recommended**: Kafka, Redis Streams

**Why**:
- High throughput
- Retention
- Multiple consumers (e.g., Elasticsearch, S3)
- Stream processing

---

## Feature Matrix

### Messaging Patterns

| Pattern | RabbitMQ | Kafka | AWS SQS | AWS SNS | Azure SB | Azure Queue | Redis Streams |
|---------|----------|-------|---------|---------|----------|-------------|---------------|
| **Point-to-Point** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Pub/Sub** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Request-Reply** | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Fan-Out** | ✅ | ✅ | SNS+SQS | ✅ | ✅ | ❌ | ✅ |
| **Competing Consumers** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Message Replay** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Enterprise Features

| Feature | RabbitMQ | Kafka | AWS SQS | Azure SB | Redis Streams |
|---------|----------|-------|---------|----------|---------------|
| **Dead Letter Queue** | ✅ | ❌ (manual) | ✅ | ✅ | ❌ (manual) |
| **Message Priority** | ✅ | ❌ | ❌ (separate queues) | ✅ | ❌ |
| **Message TTL** | ✅ | ✅ | ✅ | ✅ | Manual trim |
| **Delayed Delivery** | ✅ (plugin) | ❌ | ✅ | ✅ | ❌ |
| **Transactions** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Message Deduplication** | ✅ | ✅ (idempotent) | ✅ (FIFO) | ✅ | ❌ (manual) |

---

## Strengths & Weaknesses

### RabbitMQ
**Strengths** ✅:
- Flexible routing (exchanges)
- Rich feature set
- Mature and stable
- Good documentation
- Active community

**Weaknesses** ❌:
- Lower throughput than Kafka
- No event replay
- Requires ops

**Best for**: Microservices, task queues, RPC

---

### Kafka
**Strengths** ✅:
- Very high throughput
- Event replay
- Stream processing
- Horizontal scaling
- Event sourcing

**Weaknesses** ❌:
- Complex to operate
- Higher latency for small messages
- Overkill for simple queues
- Steep learning curve

**Best for**: Event streaming, analytics, data pipelines

---

### AWS SQS/SNS
**Strengths** ✅:
- Zero ops (managed)
- Auto-scaling
- Cheap
- AWS integration
- Reliable

**Weaknesses** ❌:
- Higher latency
- No event replay
- Limited routing (SNS filters)
- Vendor lock-in

**Best for**: AWS ecosystem, simple queues, pub/sub

---

### Azure Service Bus
**Strengths** ✅:
- Enterprise features (topics, sessions, transactions)
- Managed service
- Good Azure integration
- AMQP protocol

**Weaknesses** ❌:
- More expensive than Storage Queue
- Azure only
- Smaller community than RabbitMQ

**Best for**: Azure ecosystem, enterprise features

---

### Azure Storage Queue
**Strengths** ✅:
- Very cheap
- Simple
- Managed
- Good for Azure

**Weaknesses** ❌:
- Basic features only
- Small message size (64 KB)
- No ordering
- No pub/sub

**Best for**: Azure ecosystem, simple cheap queues

---

### Redis Streams
**Strengths** ✅:
- Very low latency
- Event replay
- Simple to use
- Already have Redis

**Weaknesses** ❌:
- Memory bound
- No partitioning (single Redis)
- Lower throughput than Kafka
- Requires ops

**Best for**: Low latency, lightweight streaming

---

## Common Mistakes to Avoid

### 1. Using Kafka for Simple Queues
❌ **Bad**: Use Kafka for 10 messages/minute task queue
✅ **Good**: Use SQS or RabbitMQ

**Why**: Kafka overkill, complex ops for low volume

---

### 2. Using SQS for Ordered Processing
❌ **Bad**: Use SQS Standard, handle ordering in app
✅ **Good**: Use SQS FIFO or Kafka partitions

**Why**: SQS Standard doesn't guarantee order

---

### 3. Not Using Pub/Sub When Needed
❌ **Bad**: Multiple consumers polling same queue
✅ **Good**: Use pub/sub (SNS + SQS, RabbitMQ fanout, Kafka)

**Why**: Competing consumers vs broadcast

---

### 4. Ignoring Dead Letter Queues
❌ **Bad**: Failed messages retried forever
✅ **Good**: Configure DLQ, monitor and handle failures

**Why**: Poison pills block queue

---

### 5. Not Making Handlers Idempotent
❌ **Bad**: Assume exactly-once delivery
✅ **Good**: Design for at-least-once, make idempotent

**Why**: Most systems deliver at-least-once

---

## Interview Quick Reference

**Q: "RabbitMQ vs Kafka?"**
- RabbitMQ: Message broker, delete after consume, good routing
- Kafka: Event log, keep events, replay, high throughput

**Q: "When to use each?"**
- RabbitMQ: Microservices, RPC, task queues
- Kafka: Event streaming, analytics, high throughput
- SQS: AWS, simple queues, zero ops
- Redis Streams: Low latency, already have Redis

**Q: "How to ensure ordering?"**
- Kafka: Partition by key
- RabbitMQ: Single queue
- SQS: FIFO queue
- Azure SB: Sessions

**Q: "How to handle failures?"**
- Dead letter queue
- Exponential backoff
- Idempotent handlers
- Circuit breaker

---

## Summary

**No one-size-fits-all**:
- Choose based on **use case**
- Consider **ops complexity**
- Balance **features vs cost**
- Think about **scale**

**General recommendations**:
1. **On AWS?** → SQS/SNS
2. **On Azure?** → Storage Queue or Service Bus
3. **Need event streaming?** → Kafka
4. **Need low latency?** → Redis Streams
5. **Microservices?** → RabbitMQ
6. **Default choice?** → RabbitMQ (good balance)

**Remember**: Simplest solution that meets requirements wins!
