# Design Distributed Message Queue (Kafka/RabbitMQ)

## Problem Statement
Design a distributed message queue system like Kafka or RabbitMQ that provides reliable, ordered, high-throughput message delivery with at-least-once/exactly-once semantics.

## Architecture
```
Producers → Brokers (Partitioned Topics) → Consumer Groups
                ↓
          Zookeeper (Coordination)
```

## Key Designs
```python
# Topic with partitions
topic = "user-events"
partitions = 10

# Producer sends to partition (by key hash)
def send_message(key, value):
    partition = hash(key) % partitions
    broker = get_leader(topic, partition)
    broker.append(partition, value)

# Consumer group (parallel consumption)
consumer_group = "analytics"
for partition in partitions:
    assign_partition_to_consumer(partition, consumer_group)

# Each partition consumed by exactly one consumer in group
# Different groups can consume same topic independently
```

## Guarantees
- **At-least-once**: Ack after processing (may see duplicates on failure)
- **Exactly-once**: Idempotent producer + transactional consumer
- **Ordering**: Per-partition ordering guaranteed

## Interview Talking Points
"Message queue needs high throughput and ordering. Use partitioned topics (like Kafka) for parallelism while maintaining per-key ordering. Consumer groups for load balancing. Replicate partitions 3x for fault tolerance. At-least-once delivery by default, exactly-once with transactions. Monitor lag (consumer offset - producer offset)."
