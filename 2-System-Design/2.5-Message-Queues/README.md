# Message Queues & Message Brokers

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Message Queue Technologies](#message-queue-technologies)
4. [Choosing the Right Message Queue](#choosing-the-right-message-queue)
5. [Common Patterns](#common-patterns)
6. [Interview Topics](#interview-topics)

---

## Overview

Message queues are fundamental building blocks in distributed systems that enable **asynchronous communication** between services. They decouple producers (senders) from consumers (receivers), allowing systems to scale independently and handle failures gracefully.

### Why Use Message Queues?

**Without Message Queue**:
```
[Service A] ──(HTTP call)──> [Service B]
   ↑                              ↓
   └──────(waits for response)────┘

Problems:
- Service A blocks waiting for Service B
- If Service B is down, request fails
- Traffic spikes overwhelm Service B
- Tight coupling between services
```

**With Message Queue**:
```
[Service A] ──(publish)──> [Queue] ──> [Service B]
   ↓                                      ↓
(continues immediately)          (processes when ready)

Benefits:
✅ Service A doesn't wait
✅ Survives Service B downtime
✅ Absorbs traffic spikes
✅ Loose coupling
```

### Key Benefits

1. **Decoupling**: Services don't need to know about each other
2. **Reliability**: Messages persist until processed
3. **Scalability**: Add more consumers to handle load
4. **Load Leveling**: Smooth out traffic spikes
5. **Fault Tolerance**: Retry failed messages
6. **Async Processing**: Don't block user-facing requests

---

## Core Concepts

### 1. Message Queue vs Message Broker

**Message Queue**:
- Simple point-to-point communication
- One producer → Queue → One consumer
- FIFO (First In, First Out) ordering
- Examples: AWS SQS, Azure Storage Queue

**Message Broker**:
- Advanced routing and pub/sub patterns
- Multiple producers → Exchange/Topic → Multiple consumers
- Flexible routing rules
- Examples: RabbitMQ, Apache Kafka

### 2. Communication Patterns

#### Point-to-Point (Queue)
```
Producer 1 ─┐
            ├─> [Queue] ──> Consumer
Producer 2 ─┘
```
- One message consumed by **one** consumer
- Messages removed after consumption
- **Use case**: Task distribution, job processing

#### Publish-Subscribe (Topic)
```
Producer ──> [Topic] ──┬──> Consumer 1
                       ├──> Consumer 2
                       └──> Consumer 3
```
- One message delivered to **all** subscribers
- Multiple consumers get the same message
- **Use case**: Event broadcasting, notifications

#### Request-Reply
```
Client ──(request + reply_queue)──> [Queue] ──> Server
   ↑                                              ↓
   └──────────────[Reply Queue]──────────────────┘
```
- Async version of HTTP request-response
- **Use case**: RPC-style communication

### 3. Message Properties

**Basic Structure**:
```json
{
  "message_id": "uuid-12345",
  "timestamp": "2024-01-01T12:00:00Z",
  "payload": {
    "user_id": 123,
    "action": "send_email",
    "data": { ... }
  },
  "metadata": {
    "priority": "high",
    "correlation_id": "correlation-xyz",
    "reply_to": "response_queue",
    "ttl": 3600,
    "retry_count": 0
  }
}
```

**Key Properties**:
- **Message ID**: Unique identifier for deduplication
- **Timestamp**: When message was created
- **Payload**: Actual data
- **Priority**: High/medium/low
- **TTL**: Time to live (expiry)
- **Correlation ID**: Link related messages
- **Reply-to**: For request-reply pattern

### 4. Delivery Guarantees

#### At-Most-Once
- Message delivered **0 or 1 times**
- May be lost, never duplicated
- **Fast, no guarantees**
- Use case: Metrics, logs (okay to lose some)

#### At-Least-Once ⭐ Most Common
- Message delivered **1 or more times**
- Never lost, may duplicate
- **Reliable, need idempotent consumers**
- Use case: Most production systems

#### Exactly-Once (Very Hard!)
- Message delivered **exactly 1 time**
- No loss, no duplicates
- **Expensive, complex**
- Use case: Financial transactions

**Reality Check**:
```
True exactly-once is nearly impossible in distributed systems!

Most systems use at-least-once + idempotent handlers:
- Message may deliver twice
- Consumer handles duplicates gracefully
- Check: "Have I already processed message ID xyz?"
```

### 5. Message Ordering

**FIFO (First In, First Out)**:
```
Send: [A] [B] [C]
Receive: [A] [B] [C]  ✅ Ordered
```
- Guarantees order
- Usually slower (sequential processing)
- Use: When order matters (bank transactions)

**Non-FIFO**:
```
Send: [A] [B] [C]
Receive: [B] [A] [C]  ⚠️  May be out of order
```
- No order guarantee
- Faster (parallel processing)
- Use: When order doesn't matter (independent tasks)

### 6. Acknowledgments

**Auto-Ack** (acknowledge immediately):
```
Queue ──(message)──> Consumer
                       ↓
                   (ack sent automatically)
```
- Fast, but risky
- Message lost if consumer crashes

**Manual-Ack** (acknowledge after processing):
```
Queue ──(message)──> Consumer
                       ↓
                   (process)
                       ↓
                   (send ack)
```
- Safer, message redelivered if consumer crashes
- Recommended for production

### 7. Dead Letter Queue (DLQ)

```
[Queue] ──(failed after 3 retries)──> [Dead Letter Queue]
                                              ↓
                                       (manual inspection)
```

When a message fails repeatedly:
1. Try processing (fail)
2. Retry with backoff (fail)
3. Retry again (fail)
4. Move to DLQ for investigation

**DLQ Purpose**:
- Prevent poison pills from blocking queue
- Store failed messages for debugging
- Alert team to investigate

---

## Message Queue Technologies

### Quick Comparison

| Feature | RabbitMQ | Kafka | AWS SQS | Azure Queue | Redis Streams |
|---------|----------|-------|---------|-------------|---------------|
| **Type** | Broker | Event Stream | Queue | Queue | Stream |
| **Throughput** | Medium | Very High | Medium | Medium | High |
| **Latency** | Low (ms) | Low (ms) | Higher (100ms+) | Higher (100ms+) | Very Low (μs) |
| **Persistence** | Yes | Yes | Yes | Yes | Optional |
| **Ordering** | Per Queue | Per Partition | FIFO Queue | No | Yes |
| **Delivery** | At-least-once | At-least-once | At-least-once | At-least-once | At-least-once |
| **Use Case** | General | Event Streaming | AWS Users | Azure Users | Lightweight |
| **Complexity** | Medium | High | Low | Low | Low |
| **Cost** | Self-hosted | Self-hosted | Pay per request | Pay per request | Self-hosted |

### Detailed Documentation

Each technology has detailed documentation:

1. **[RabbitMQ](./rabbitmq.md)**
   - Traditional message broker
   - Flexible routing (exchanges)
   - Perfect for microservices
   - AMQP protocol

2. **[Apache Kafka](./kafka.md)**
   - Distributed event streaming platform
   - High throughput (millions/sec)
   - Event sourcing & stream processing
   - Built for scale

3. **[AWS SQS & SNS](./aws-sqs-sns.md)**
   - Managed AWS services
   - SQS: Simple Queue Service
   - SNS: Simple Notification Service
   - Zero ops, pay-per-use

4. **[Azure Storage Queue & Service Bus](./azure-storage-queue.md)**
   - Managed Azure services
   - Storage Queue: Simple, cheap
   - Service Bus: Advanced features
   - Azure ecosystem integration

5. **[Redis Streams](./redis-streams.md)**
   - Lightweight message queue
   - In-memory, very fast
   - Good for caching + messaging
   - Simpler than RabbitMQ/Kafka

6. **[Technology Comparison](./comparison.md)**
   - Side-by-side comparison
   - Decision matrix
   - When to use what

---

## Choosing the Right Message Queue

### Decision Tree

```
START
  ↓
Are you on AWS? ──Yes──> Use SQS/SNS (easiest)
  ↓ No
Are you on Azure? ──Yes──> Use Azure Service Bus
  ↓ No
Need millions of messages/sec? ──Yes──> Use Kafka
  ↓ No
Need event streaming / replay? ──Yes──> Use Kafka
  ↓ No
Need complex routing? ──Yes──> Use RabbitMQ
  ↓ No
Already using Redis? ──Yes──> Use Redis Streams
  ↓ No
Want simplest solution? ──Yes──> Use Redis Streams or RabbitMQ
  ↓
Default: RabbitMQ (good balance)
```

### Use Case Mapping

**Event Streaming** (logs, analytics, event sourcing)
→ **Kafka**
- Retain events for days/weeks
- Multiple consumers replay events
- High throughput needed

**Microservices Communication** (async RPC)
→ **RabbitMQ** or **AWS SQS**
- Request-reply pattern
- Flexible routing
- Lower throughput okay

**Task Queue** (background jobs, emails)
→ **AWS SQS**, **Redis Streams**, or **RabbitMQ**
- Point-to-point
- At-least-once delivery
- Simple queue operations

**Pub/Sub Notifications** (user notifications, webhooks)
→ **AWS SNS**, **RabbitMQ**, or **Kafka**
- Fan-out to multiple subscribers
- Fire-and-forget
- Broadcast messages

**Real-Time Data Pipeline** (IoT, metrics, logs)
→ **Kafka** or **Redis Streams**
- High throughput
- Low latency
- Stream processing

**Cloud Native (AWS)** → **SQS/SNS**
**Cloud Native (Azure)** → **Azure Service Bus**
**Self-Hosted** → **RabbitMQ** or **Kafka**
**Lightweight** → **Redis Streams**

---

## Common Patterns

### 1. Task Queue Pattern
```
┌──────────┐
│  Web App │ (User uploads image)
└─────┬────┘
      │ 1. Quick response to user
      ↓
   [Queue]
      ↓
┌─────┴─────┐ 2. Process async
│  Workers  │ (Resize, compress, store)
└───────────┘
```

**Use case**: Email sending, image processing, report generation

**Code Example**:
```python
# Producer
def upload_image(image):
    # Save original
    image_url = storage.save(image)

    # Queue processing job
    queue.publish({
        'task': 'process_image',
        'image_url': image_url,
        'sizes': ['thumbnail', 'medium', 'large']
    })

    return {'status': 'processing', 'url': image_url}

# Consumer
def process_image_worker():
    while True:
        message = queue.consume()

        image = download(message['image_url'])
        for size in message['sizes']:
            resized = resize(image, size)
            storage.save(resized, f'{size}_{message["image_url"]}')

        queue.ack(message)
```

### 2. Event-Driven Architecture
```
Order Service ──(OrderCreated)──┬──> [Event Bus] ──┬──> Inventory (decrease stock)
                                                    ├──> Shipping (create shipment)
                                                    ├──> Email (send confirmation)
                                                    └──> Analytics (track metrics)
```

**Use case**: Microservices, domain events, CQRS

### 3. Saga Pattern (Distributed Transactions)
```
Step 1: Reserve Inventory ──success──> Step 2: Process Payment ──success──> Step 3: Ship
   ↓ failure                               ↓ failure                           ↓ failure
Compensate: (nothing)                   Compensate: Unreserve                Compensate: Refund + Unreserve
```

**Use case**: Multi-step workflows, booking systems

### 4. Priority Queue Pattern
```
[High Priority Queue]    ──> Workers (process first)
[Medium Priority Queue]  ──> Workers (process second)
[Low Priority Queue]     ──> Workers (process last)
```

**Use case**: SLA-based processing, paid vs free users

### 5. Competing Consumers Pattern
```
                       ┌──> Consumer 1
[Queue] ──(messages)───┼──> Consumer 2
                       ├──> Consumer 3
                       └──> Consumer 4
```

**Benefits**:
- Horizontal scaling
- Load balancing
- Fault tolerance

### 6. Dead Letter Queue Pattern
```
[Main Queue] ──(fail 3x)──> [DLQ] ──(manual review)──> Fix & Requeue
```

---

## Interview Topics

### Common Interview Questions

**Q1: "Design a notification system using message queues"**

**Answer approach**:
1. **Requirements**: Email, SMS, push? Scale? Delivery guarantee?
2. **Architecture**:
   ```
   API ──> SNS Topic ──┬──> Email Queue ──> Email Workers
                       ├──> SMS Queue ──> SMS Workers
                       └──> Push Queue ──> Push Workers
   ```
3. **Trade-offs**: Pub/sub (SNS) for fan-out, separate queues per channel
4. **Scale**: Independent scaling per channel

---

**Q2: "How would you handle message ordering?"**

**Answer**:
- **Option 1**: FIFO queue (AWS SQS FIFO, Kafka partitions)
  - Pros: Guaranteed order
  - Cons: Lower throughput (sequential processing)

- **Option 2**: Partition by key (Kafka)
  - Order within partition (e.g., all user 123 messages in order)
  - Parallel processing across partitions

- **Option 3**: Application-level sequencing
  - Add sequence number to message
  - Consumer buffers and reorders

**Trade-off**: Order vs Throughput

---

**Q3: "How do you prevent duplicate message processing?"**

**Answer**:
1. **Idempotent Operations**: Design handlers to be safe to retry
   ```python
   def process_payment(message):
       # Check if already processed
       if redis.exists(f'processed:{message.id}'):
           return  # Skip duplicate

       # Process
       payment_gateway.charge(message.amount)

       # Mark as processed
       redis.setex(f'processed:{message.id}', 86400, '1')
   ```

2. **Database Constraints**: Unique constraints prevent duplicates
3. **Transaction Logs**: Check if message ID already in log

---

**Q4: "What's the difference between Kafka and RabbitMQ?"**

**Answer**:

| Aspect | RabbitMQ | Kafka |
|--------|----------|-------|
| **Model** | Message Broker | Event Stream |
| **Delete** | After consumption | After retention period |
| **Replay** | No | Yes (consumers seek) |
| **Use case** | Task queues, RPC | Event logs, analytics |
| **Speed** | 10K-50K msg/sec | 100K-1M msg/sec |
| **Routing** | Complex (exchanges) | Simple (topics) |

**When to use**:
- RabbitMQ: Microservices, task queues, flexible routing
- Kafka: Event streaming, high throughput, replay needed

---

**Q5: "How would you handle poison pills?"**

**Poison pill**: Message that always fails (bad data, bug)

**Solutions**:
1. **Max Retry Count**:
   ```python
   if message.retry_count >= 3:
       move_to_dlq(message)
   ```

2. **Exponential Backoff**: Wait longer between retries
3. **Circuit Breaker**: Stop processing if too many failures
4. **Dead Letter Queue**: Separate queue for failed messages
5. **Monitoring**: Alert on high DLQ depth

---

**Q6: "Design a rate-limited task queue"**

**Answer**:
```python
# Use token bucket + message queue

class RateLimitedQueue:
    def consume(self):
        # Check rate limit
        if not self.rate_limiter.allow():
            time.sleep(1)  # Back off
            return None

        # Consume message
        message = queue.get()

        # Process
        process(message)

        # Consume token
        self.rate_limiter.consume()
```

**Use case**: API rate limits, third-party service limits

---

## Best Practices

### 1. Message Design
✅ Keep messages small (< 256KB)
✅ Include message ID for idempotency
✅ Add timestamp for debugging
✅ Use JSON for readability (or Protobuf for performance)
✅ Include correlation ID for tracing
❌ Don't include large payloads (use reference/URL instead)

### 2. Consumer Design
✅ Make consumers **idempotent** (safe to retry)
✅ Use **manual acknowledgment** (not auto-ack)
✅ Implement **timeout** for long-running jobs
✅ Set **max retry count** (then DLQ)
✅ Use **exponential backoff** for retries
❌ Don't silently swallow errors

### 3. Monitoring
Track these metrics:
- Queue depth (messages waiting)
- Processing time (p50, p95, p99)
- Error rate
- DLQ depth (alert if growing!)
- Consumer lag (Kafka)
- Throughput (messages/sec)

### 4. Scaling
- **Scale consumers horizontally** (add more workers)
- **Partition queues** for parallelism
- **Use competing consumers** pattern
- **Monitor queue depth** to trigger scaling

### 5. Reliability
- **Enable persistence** (disk-backed)
- **Use replication** (multi-node)
- **Set up DLQ** for failures
- **Implement circuit breaker** for downstream services
- **Test failure scenarios**

---

## Resources for Learning

**Books**:
- "Enterprise Integration Patterns" by Gregor Hohpe
- "Designing Data-Intensive Applications" by Martin Kleppmann

**Online**:
- RabbitMQ Tutorials: https://www.rabbitmq.com/getstarted.html
- Kafka Documentation: https://kafka.apache.org/documentation/
- AWS SQS Best Practices: https://docs.aws.amazon.com/sqs/

**Practice**:
- Build a simple task queue
- Implement pub/sub notification system
- Create event-driven microservices

---

## Summary

Message queues are essential for:
- ✅ Decoupling services
- ✅ Handling async workloads
- ✅ Scaling independently
- ✅ Building resilient systems

**For interviews**:
1. Understand **use cases** (when to use message queues)
2. Know **trade-offs** (ordering vs throughput, consistency vs availability)
3. Practice **system design** problems using message queues
4. Explain **failure handling** (retries, DLQ, idempotency)

**Next Steps**: Dive into specific technologies:
- [RabbitMQ](./rabbitmq.md)
- [Kafka](./kafka.md)
- [AWS SQS/SNS](./aws-sqs-sns.md)
- [Azure Storage Queue](./azure-storage-queue.md)
- [Redis Streams](./redis-streams.md)
- [Comparison Guide](./comparison.md)
