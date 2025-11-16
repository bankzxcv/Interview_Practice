# Apache Kafka - Distributed Event Streaming Platform

## Overview

Apache Kafka is a **distributed event streaming platform** designed for high-throughput, fault-tolerant, and scalable data pipelines. Unlike traditional message queues, Kafka is built around the concept of an **immutable event log**.

**Key Difference from RabbitMQ**:
- **RabbitMQ**: Message broker (delete after consumption)
- **Kafka**: Event log (keep events, allow replay)

**When to Use Kafka**:
- ✅ Event sourcing and event-driven architecture
- ✅ High throughput (millions of messages/sec)
- ✅ Need to replay events
- ✅ Stream processing (real-time analytics)
- ✅ Log aggregation and metrics
- ✅ Data pipelines (CDC, ETL)

**When NOT to Use**:
- ❌ Simple task queues (use RabbitMQ or SQS)
- ❌ Low message volume (< 1000 msg/sec)
- ❌ Complex routing (use RabbitMQ)
- ❌ Request-reply pattern (use RabbitMQ)
- ❌ Don't need event replay

---

## Core Architecture

### Key Components

```
┌────────────┐
│  Producer  │
└──────┬─────┘
       │ 1. Publish events
       ↓
┌─────────────────────────────────────────────────────┐
│              Kafka Cluster                          │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Topic: "orders"                             │  │
│  │                                              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────┐ │  │
│  │  │ Partition 0│  │ Partition 1│  │Partition│ │  │
│  │  │            │  │            │  │   2    │ │  │
│  │  │ [E][E][E] │  │ [E][E][E] │  │ [E][E] │ │  │
│  │  │  ↑  ↑  ↑  │  │  ↑  ↑  ↑  │  │  ↑  ↑  │ │  │
│  │  │ Offset→   │  │ Offset→   │  │ Offset │ │  │
│  │  └────────────┘  └────────────┘  └────────┘ │  │
│  │                                              │  │
│  │  Replicated across brokers                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Broker 1 │  │ Broker 2 │  │ Broker 3 │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
       │
       │ 2. Consume events
       ↓
┌────────────────┐
│  Consumer      │
│  Group         │
│  ┌──────────┐  │
│  │Consumer 1│  │ (reads Partition 0)
│  │Consumer 2│  │ (reads Partition 1)
│  │Consumer 3│  │ (reads Partition 2)
│  └──────────┘  │
└────────────────┘
```

### 1. **Producer**
- Publishes events to topics
- Chooses partition (by key or round-robin)
- Fire-and-forget or wait for acknowledgment

### 2. **Topic**
- Category/feed of events
- Logical grouping (e.g., "orders", "user-events")
- Divided into **partitions** for scalability

### 3. **Partition**
- Ordered, immutable sequence of events
- Each event has an **offset** (position)
- Distributed across brokers
- **Unit of parallelism**

### 4. **Broker**
- Kafka server
- Stores partitions
- Handles read/write requests
- Cluster of brokers for HA

### 5. **Consumer**
- Reads events from topics
- Tracks offset (position in partition)
- Part of **consumer group** for load balancing

### 6. **ZooKeeper** (being replaced by KRaft)
- Metadata management
- Leader election
- Cluster coordination

---

## Topics and Partitions

### Partitioning Strategy

```
Topic: "orders"

Partition 0: [Order-1] [Order-4] [Order-7] ...
Partition 1: [Order-2] [Order-5] [Order-8] ...
Partition 2: [Order-3] [Order-6] [Order-9] ...

Partitioning by key (user_id):
- All orders from user_123 → same partition (ordered!)
- Different users → different partitions (parallel!)
```

**Benefits**:
- **Scalability**: Add partitions to handle more load
- **Parallelism**: Multiple consumers read different partitions
- **Ordering**: Events within a partition are ordered

**Code Example**:
```python
from kafka import KafkaProducer
import json

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Option 1: Partition by key (user_id)
# All events for same user go to same partition → ordered
producer.send(
    topic='orders',
    key=b'user_123',  # Hashed to determine partition
    value={'order_id': 1, 'amount': 50}
)

# Option 2: Round-robin (no key)
# Events distributed evenly across partitions → no ordering
producer.send(
    topic='orders',
    value={'order_id': 2, 'amount': 30}
)

producer.flush()
producer.close()
```

---

## Consumer Groups

### How Consumer Groups Work

```
Topic "orders" with 3 partitions:

Consumer Group A:
┌──────────────────────────────────────────┐
│  Consumer 1 ─── reads ──> Partition 0   │
│  Consumer 2 ─── reads ──> Partition 1   │
│  Consumer 3 ─── reads ──> Partition 2   │
└──────────────────────────────────────────┘
Each consumer reads from 1 partition

Consumer Group B (different application):
┌──────────────────────────────────────────┐
│  Consumer 1 ─── reads ──> Part 0, 1, 2  │
└──────────────────────────────────────────┘
One consumer reads all partitions (slower)

Consumer Group C:
┌──────────────────────────────────────────┐
│  Consumer 1 ─── reads ──> Partition 0   │
│  Consumer 2 ─── reads ──> Partition 1   │
│  Consumer 3 ─── reads ──> Partition 2   │
│  Consumer 4 ─── (idle, no partition)    │
└──────────────────────────────────────────┘
Max consumers = # of partitions
```

**Key Points**:
- Each partition consumed by **exactly one consumer** in a group
- Multiple consumer groups can read the **same topic**
- Max parallelism = number of partitions
- Add partitions to scale consumers

**Code Example**:
```python
from kafka import KafkaConsumer
import json

# Consumer in group "inventory-service"
consumer = KafkaConsumer(
    'orders',
    bootstrap_servers=['localhost:9092'],
    group_id='inventory-service',  # Consumer group ID
    auto_offset_reset='earliest',  # Start from beginning if no offset
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

for message in consumer:
    order = message.value
    print(f"Partition: {message.partition}, Offset: {message.offset}")
    print(f"Order: {order}")

    # Process order
    decrease_stock(order['items'])

    # Offset committed automatically (or manually with consumer.commit())
```

---

## Offsets and Delivery Guarantees

### What is an Offset?

```
Partition 0:
┌────┬────┬────┬────┬────┬────┬────┐
│ E1 │ E2 │ E3 │ E4 │ E5 │ E6 │ E7 │
└────┴────┴────┴────┴────┴────┴────┘
  ↑    ↑    ↑    ↑
  0    1    2    3  ← Offsets

Consumer reads offset 0, 1, 2, ...
Tracks: "I've processed up to offset 2"
```

**Offset Commit**:
- Consumer tells Kafka: "I've processed offset X"
- If consumer crashes, restart from last committed offset

### Delivery Semantics

**1. At-Most-Once** (may lose messages)
```python
# Auto-commit before processing
consumer = KafkaConsumer(
    enable_auto_commit=True,
    auto_commit_interval_ms=5000
)

for message in consumer:
    # Offset committed before processing
    # If crash here → message lost!
    process(message)
```

**2. At-Least-Once** (may duplicate) ⭐ Recommended
```python
# Manual commit after processing
consumer = KafkaConsumer(
    enable_auto_commit=False
)

for message in consumer:
    process(message)
    consumer.commit()  # Commit after processing
    # If crash before commit → reprocess (duplicate)
```

**3. Exactly-Once** (Kafka Streams or Transactions)
```python
# Requires Kafka Transactions (complex)
producer = KafkaProducer(
    transactional_id='my-transactional-id',
    enable_idempotence=True
)

producer.init_transactions()
producer.begin_transaction()
producer.send('output-topic', value=processed_data)
producer.send_offsets_to_transaction(offsets, consumer_group_metadata)
producer.commit_transaction()
```

---

## Replication and Fault Tolerance

### Replication Factor

```
Topic: "orders", Replication Factor: 3

Partition 0:
  Broker 1 (Leader)   ← Handles all reads/writes
  Broker 2 (Follower) ← Syncs from leader
  Broker 3 (Follower) ← Syncs from leader

If Broker 1 fails:
  Broker 2 becomes new leader ← Automatic failover!
```

**Configuration**:
```bash
kafka-topics.sh --create \
  --topic orders \
  --partitions 3 \
  --replication-factor 3 \
  --bootstrap-server localhost:9092
```

**Code** (Producer Acknowledgments):
```python
producer = KafkaProducer(
    acks='all'  # Wait for all replicas to acknowledge
    # acks=0: Fire-and-forget (fastest, may lose data)
    # acks=1: Wait for leader only (faster, may lose on leader failure)
    # acks='all': Wait for all replicas (safest, slower)
)
```

### In-Sync Replicas (ISR)

```
Partition 0:
  Leader: Broker 1 (ISR)
  Follower: Broker 2 (ISR) ← Fully caught up
  Follower: Broker 3 (out of sync) ← Lagging

Producer with acks='all':
  Waits for Leader + Broker 2 (ISR members)
  Doesn't wait for Broker 3 (not in ISR)
```

**min.insync.replicas**:
```bash
# Require at least 2 replicas in-sync
kafka-configs.sh --alter \
  --topic orders \
  --add-config min.insync.replicas=2
```

---

## Retention and Compaction

### Time-Based Retention

```
Partition 0:
┌────┬────┬────┬────┬────┬────┬────┐
│ E1 │ E2 │ E3 │ E4 │ E5 │ E6 │ E7 │
└────┴────┴────┴────┴────┴────┴────┘
  ↑                            ↑
7 days ago                   now

After 7 days: E1 deleted
```

**Configuration**:
```bash
# Retain for 7 days
kafka-configs.sh --alter \
  --topic orders \
  --add-config retention.ms=604800000
```

### Size-Based Retention

```bash
# Retain max 1GB per partition
kafka-configs.sh --alter \
  --topic orders \
  --add-config retention.bytes=1073741824
```

### Log Compaction

**Use case**: Store latest state per key (e.g., user profiles)

```
Before compaction:
Key | Value        | Offset
----|--------------|-------
123 | {name: Bob}  | 0
456 | {name: Sue}  | 1
123 | {name: Robert} | 2  ← Latest for key 123
456 | {name: Susan}  | 3  ← Latest for key 456
123 | {name: Rob}    | 4  ← Latest for key 123

After compaction:
Key | Value        | Offset
----|--------------|-------
456 | {name: Susan}  | 3
123 | {name: Rob}    | 4

Only keeps latest value per key!
```

**Configuration**:
```bash
kafka-configs.sh --alter \
  --topic user-profiles \
  --add-config cleanup.policy=compact
```

---

## Kafka Streams (Stream Processing)

### What is Kafka Streams?

Library for building stream processing applications.

**Example**: Real-time order analytics

```python
from kafka import KafkaConsumer, KafkaProducer
import json

consumer = KafkaConsumer('orders', group_id='analytics')
producer = KafkaProducer()

# Simple aggregation
total_revenue = 0

for message in consumer:
    order = json.loads(message.value)
    total_revenue += order['amount']

    # Publish aggregate
    producer.send('order-stats', json.dumps({
        'total_revenue': total_revenue,
        'timestamp': time.time()
    }))
```

**Advanced**: Windowed aggregations, joins, stateful processing

---

## Performance Tuning

### Producer Optimization

**1. Batching**:
```python
producer = KafkaProducer(
    batch_size=16384,  # Batch size in bytes
    linger_ms=10       # Wait 10ms to batch messages
)
```
- Trade-off: Latency vs Throughput

**2. Compression**:
```python
producer = KafkaProducer(
    compression_type='snappy'  # or 'gzip', 'lz4', 'zstd'
)
```
- Reduces network bandwidth
- CPU vs Network trade-off

**3. Idempotence**:
```python
producer = KafkaProducer(
    enable_idempotence=True  # Prevents duplicates on retry
)
```

### Consumer Optimization

**1. Fetch Size**:
```python
consumer = KafkaConsumer(
    fetch_min_bytes=1024,      # Wait for 1KB before fetch
    fetch_max_wait_ms=500      # Or wait max 500ms
)
```

**2. Parallelism**:
```
# Add more partitions
kafka-topics.sh --alter --topic orders --partitions 10

# Add more consumers (up to # of partitions)
```

**3. Batch Processing**:
```python
batch = []
for message in consumer:
    batch.append(message)

    if len(batch) >= 100:
        process_batch(batch)
        consumer.commit()
        batch = []
```

---

## Common Use Cases

### 1. Event Sourcing
```
[User Service] ──(UserCreated)──> Kafka ──> [Topic: users]
                                              ↓
                                          [Consumers rebuild state from events]
```

### 2. Log Aggregation
```
[App1] ─┐
[App2] ─┼──(logs)──> Kafka ──> [Topic: logs] ──> Elasticsearch
[App3] ─┘
```

### 3. Metrics Pipeline
```
[Servers] ──(metrics)──> Kafka ──> [Topic: metrics] ──┬──> Prometheus
                                                       ├──> Grafana
                                                       └──> S3 (archive)
```

### 4. Change Data Capture (CDC)
```
[Database] ──(changes)──> Kafka Connect ──> [Topic: db-changes] ──> [Data Warehouse]
```

### 5. Stream Processing
```
[Raw Events] ──> Kafka Streams ──(filter, aggregate, join)──> [Processed Events]
```

---

## Kafka vs RabbitMQ

| Feature | Kafka | RabbitMQ |
|---------|-------|----------|
| **Model** | Event log | Message broker |
| **Retention** | Days/weeks | Until consumed |
| **Replay** | Yes | No |
| **Throughput** | 1M+ msg/sec | 10K-50K msg/sec |
| **Latency** | Low (ms) | Very low (ms) |
| **Routing** | Topics/partitions | Exchanges (complex) |
| **Ordering** | Per partition | Per queue |
| **Use case** | Event streaming | Task queues, RPC |
| **Complexity** | High | Medium |

---

## Monitoring

**Key Metrics**:
- **Under-replicated partitions**: Replica lag
- **Consumer lag**: How far behind consumers are
- **Request latency**: Producer/consumer latency
- **Throughput**: Messages/bytes per second
- **ISR shrink/expand**: Replica health

**Tools**:
- Kafka Manager / Conduktor
- Prometheus + Grafana
- Confluent Control Center

**Commands**:
```bash
# Check consumer lag
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group my-group --describe

# Topic details
kafka-topics.sh --describe --topic orders

# Broker metrics
kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

---

## Best Practices

✅ **DO**:
- Use consumer groups for parallelism
- Partition by key for ordering
- Enable replication (RF >= 3)
- Monitor consumer lag
- Use compression
- Tune batch size for throughput

❌ **DON'T**:
- Create too many topics (overhead)
- Use Kafka for request-reply (use RabbitMQ)
- Ignore consumer lag
- Store large messages (> 1MB)
- Skip monitoring

---

## Interview Questions

**Q: "When would you choose Kafka over RabbitMQ?"**
- Need event replay
- High throughput (millions/sec)
- Event sourcing
- Stream processing
- Log aggregation

**Q: "How does Kafka achieve high throughput?"**
- Sequential disk I/O
- Zero-copy
- Batching
- Compression
- Partition parallelism

**Q: "Explain Kafka consumer groups"**
- Load balancing mechanism
- Each partition → one consumer in group
- Multiple groups can read same topic
- Max consumers = partitions

**Q: "How to ensure message ordering in Kafka?"**
- Use partition key (same key → same partition → ordered)
- Single partition (no parallelism)
- Application-level sequencing

---

## Summary

**Kafka is best for**:
- Event streaming and event sourcing
- High throughput workloads
- Data pipelines and ETL
- Stream processing

**Key strengths**:
- Immutable event log (replay)
- Horizontal scalability
- High throughput
- Fault tolerance

**Limitations**:
- Complex to operate
- Not for simple queues
- Not for low latency RPC

**Next**: Compare with [RabbitMQ](./rabbitmq.md) or [AWS SQS](./aws-sqs-sns.md)
