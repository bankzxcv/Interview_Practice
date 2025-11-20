# 5.8.2 Apache Kafka - Distributed Streaming Platform

## Overview

Apache Kafka is a distributed streaming platform designed for high-throughput, fault-tolerant, and scalable event streaming. Unlike traditional message brokers, Kafka stores streams of records in a durable, replicated log that can be replayed, making it ideal for event sourcing, log aggregation, and real-time data pipelines.

## Why Kafka?

### Strengths
- **High Throughput**: Millions of messages per second
- **Scalability**: Horizontal scaling with partitions
- **Durability**: Persistent, replicated commit log
- **Replay Capability**: Consumers can rewind and reprocess messages
- **Stream Processing**: Built-in Kafka Streams API
- **Distributed**: Fault-tolerant clustering out of the box
- **Long-term Storage**: Messages retained based on policy (not just until consumed)
- **Zero-copy**: Efficient data transfer using OS-level optimizations

### Use Cases
- Real-time data pipelines and streaming applications
- Event sourcing and CQRS architectures
- Log aggregation and centralized logging
- Metrics collection and monitoring
- Change data capture (CDC)
- Microservices event bus
- IoT data ingestion
- Activity tracking and analytics

## Kafka vs RabbitMQ

| Feature | Kafka | RabbitMQ |
|---------|-------|----------|
| **Architecture** | Distributed log | Traditional broker |
| **Message Retention** | Configurable (hours to years) | Until consumed |
| **Throughput** | Very high (100K+ msg/sec) | Moderate (10-20K msg/sec) |
| **Message Replay** | Yes (offset-based) | No |
| **Routing** | Topic-based | Exchange-based (complex routing) |
| **Message Ordering** | Per-partition guarantee | Per-queue (not distributed) |
| **Use Case** | Event streaming, big data | Task queues, RPC patterns |
| **Consumer Model** | Pull-based | Push-based |
| **Protocol** | Binary over TCP | AMQP, STOMP, MQTT |

**Choose Kafka when:**
- You need to process millions of events per second
- Messages need to be replayed or stored long-term
- You're building event-driven architectures
- You need stream processing capabilities

**Choose RabbitMQ when:**
- You need complex routing logic
- You want request-reply (RPC) patterns
- Messages are consumed once and deleted
- You need support for multiple protocols

## Tutorials

### [01 - Basic Setup](./01_basic_setup/)
Set up Kafka with Docker, create topics, and implement basic producers and consumers.

**What you'll learn:**
- Docker Compose with Kafka and Zookeeper (or KRaft mode)
- Topic creation and configuration
- Python producer with kafka-python
- Python consumer with offset management
- Message serialization (JSON, Avro basics)
- CLI tools for topic management

**Time**: 2-3 hours

---

### [02 - Consumer Groups and Partitions](./02_consumer_groups/)
Master Kafka's partitioning strategy and consumer group coordination.

**What you'll learn:**
- Partition strategies and key-based partitioning
- Consumer group coordination and rebalancing
- Parallel processing with multiple consumers
- Offset commit strategies (auto vs manual)
- Partition assignment strategies
- Handling rebalancing scenarios
- Performance optimization

**Time**: 3-4 hours

---

### [03 - Kafka Connect](./03_kafka_connect/)
Build data pipelines with Kafka Connect framework for seamless integration.

**What you'll learn:**
- Kafka Connect framework overview
- Source connectors (file, JDBC, Debezium)
- Sink connectors (Elasticsearch, S3, MongoDB)
- Connector configuration and deployment
- Standalone vs distributed mode
- Custom connector development basics
- Error handling and dead letter queues

**Time**: 3-4 hours

---

### [04 - Kafka Streams](./04_kafka_streams/)
Build real-time stream processing applications with Kafka Streams API.

**What you'll learn:**
- Kafka Streams API fundamentals
- Stream processing topology
- Stateless transformations (map, filter, flatMap)
- Stateful operations (aggregations, joins)
- Windowing operations (tumbling, hopping, session)
- State stores and fault tolerance
- Python and Java examples

**Time**: 4-5 hours

---

## Quick Reference

### Basic Commands

```bash
# Start Kafka with Docker Compose
docker-compose up -d

# Create a topic
kafka-topics --bootstrap-server localhost:9092 \
  --create --topic my-topic \
  --partitions 3 --replication-factor 1

# List topics
kafka-topics --bootstrap-server localhost:9092 --list

# Describe topic
kafka-topics --bootstrap-server localhost:9092 \
  --describe --topic my-topic

# Produce messages (console)
kafka-console-producer --bootstrap-server localhost:9092 \
  --topic my-topic

# Consume messages (console)
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic my-topic --from-beginning

# Consumer groups
kafka-consumer-groups --bootstrap-server localhost:9092 --list
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe --group my-group
```

### Python Producer Example

```python
from kafka import KafkaProducer
import json

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    acks='all',  # Wait for all replicas
    retries=3
)

# Send message
message = {'user_id': 123, 'action': 'login', 'timestamp': '2024-01-15T10:30:00'}
future = producer.send('user-events', value=message, key=b'user-123')

# Wait for acknowledgment
record_metadata = future.get(timeout=10)
print(f"Sent to partition {record_metadata.partition} at offset {record_metadata.offset}")

producer.close()
```

### Python Consumer Example

```python
from kafka import KafkaConsumer
import json

consumer = KafkaConsumer(
    'user-events',
    bootstrap_servers=['localhost:9092'],
    group_id='my-group',
    auto_offset_reset='earliest',
    enable_auto_commit=False,
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

for message in consumer:
    print(f"Partition: {message.partition}, Offset: {message.offset}")
    print(f"Key: {message.key}, Value: {message.value}")

    # Process message
    # ...

    # Manually commit offset
    consumer.commit()
```

## Architecture Concepts

### Core Components

```
┌──────────────┐        ┌─────────────────────────────┐
│   Producer   │───────▶│         Kafka Cluster        │
└──────────────┘        │  ┌─────────┐  ┌─────────┐  │
                        │  │ Broker 1│  │ Broker 2│  │
┌──────────────┐        │  └─────────┘  └─────────┘  │
│   Producer   │───────▶│         Topic: users        │
└──────────────┘        │  ┌──────┐┌──────┐┌──────┐  │
                        │  │Part 0││Part 1││Part 2│  │
                        │  └──────┘└──────┘└──────┘  │
                        └─────────────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        ▼                       ▼
                ┌──────────────┐        ┌──────────────┐
                │  Consumer 1  │        │  Consumer 2  │
                │ (Group: app) │        │ (Group: app) │
                └──────────────┘        └──────────────┘
```

### Key Concepts

1. **Broker**: Kafka server that stores data and serves clients
2. **Topic**: Category or feed name to which records are published
3. **Partition**: Ordered, immutable sequence of records (topic subdivision)
4. **Offset**: Unique sequential ID of each record within a partition
5. **Producer**: Publishes records to topics
6. **Consumer**: Subscribes to topics and processes records
7. **Consumer Group**: Group of consumers that cooperatively consume a topic
8. **Replication**: Copies of partitions for fault tolerance
9. **Leader**: Broker handling all reads/writes for a partition
10. **Follower**: Broker that replicates the leader

### Partition Strategy

```
Topic: user-events (3 partitions)

Key: user-123 ──▶ hash(user-123) % 3 = 0 ──▶ Partition 0
Key: user-456 ──▶ hash(user-456) % 3 = 1 ──▶ Partition 1
Key: user-789 ──▶ hash(user-789) % 3 = 2 ──▶ Partition 2
No Key       ──▶ Round-robin           ──▶ Partition 0,1,2
```

## Best Practices

### Topic Design
- Use descriptive topic names (e.g., `user.signup.v1`)
- Plan partition count based on throughput requirements
- Set replication factor to at least 3 for production
- Configure retention based on use case (hours to months)
- Use compacted topics for changelog streams
- Version your message schemas

### Producer Best Practices
- Use message keys for ordering guarantees
- Set `acks=all` for critical data
- Enable idempotence to prevent duplicates
- Batch messages for better throughput
- Use compression (lz4, snappy, gzip)
- Implement proper error handling and retries
- Monitor producer metrics

### Consumer Best Practices
- Use consumer groups for horizontal scaling
- Commit offsets after successful processing
- Handle rebalancing gracefully
- Set appropriate `max.poll.interval.ms`
- Process messages idempotently
- Monitor consumer lag
- Use manual offset management for exactly-once processing

### Performance
- Partition based on expected throughput
- Use batch sizes appropriately
- Enable compression
- Tune `linger.ms` for batching
- Increase `buffer.memory` for high throughput
- Monitor disk I/O and network
- Use SSDs for broker storage

### Security
- Enable SSL/TLS for encryption
- Use SASL for authentication
- Implement ACLs for authorization
- Secure Zookeeper (or use KRaft mode)
- Encrypt sensitive data in messages
- Rotate credentials regularly

## Common Patterns

### Event Sourcing
```
User Actions ──▶ [Events Topic] ──▶ Event Store
                       │
                       ├──▶ Materialized View 1
                       ├──▶ Materialized View 2
                       └──▶ Analytics Pipeline
```
**Use**: Capture all changes as immutable events

### Log Aggregation
```
App Server 1 ──▶
App Server 2 ──▶ [Logs Topic] ──▶ Kafka Streams ──▶ Elasticsearch
App Server 3 ──▶
```
**Use**: Centralized logging from distributed systems

### CDC (Change Data Capture)
```
Database ──▶ Debezium ──▶ [CDC Topic] ──▶ Downstream Services
                                      └──▶ Data Lake
```
**Use**: Stream database changes in real-time

### Stream Processing
```
[Input Topic] ──▶ Kafka Streams ──▶ [Output Topic]
                  (filter, map,
                   aggregate)
```
**Use**: Real-time data transformations

## Prerequisites

- Docker and Docker Compose
- Python 3.8+ or Java 11+
- Basic understanding of distributed systems
- 8GB RAM minimum (16GB recommended)
- Understanding of message queues concepts

### Install Client Libraries

**Python:**
```bash
pip install kafka-python confluent-kafka
```

**Java:**
```xml
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-clients</artifactId>
    <version>3.6.0</version>
</dependency>
```

**Node.js:**
```bash
npm install kafkajs
```

## Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Documentation](https://docs.confluent.io/)
- [Kafka: The Definitive Guide (Book)](https://www.confluent.io/resources/kafka-the-definitive-guide/)
- [kafka-python Documentation](https://kafka-python.readthedocs.io/)
- [Kafka Streams Documentation](https://kafka.apache.org/documentation/streams/)

## Troubleshooting

### Common Issues

**Broker Not Starting**
```bash
# Check logs
docker-compose logs kafka

# Common issue: Port already in use
lsof -i :9092
```

**Consumer Lag**
```bash
# Check consumer group lag
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe --group my-group
```

**Messages Not Arriving**
- Verify topic exists and has correct partitions
- Check producer acknowledgment settings
- Verify consumer is subscribed to correct topic
- Check for consumer rebalancing issues

**Out of Memory**
- Increase broker memory allocation
- Reduce batch sizes
- Enable compression
- Tune retention policies

## Next Steps

After completing all Kafka tutorials:
1. Build a real-time data pipeline
2. Implement event sourcing in a microservice
3. Explore Kafka Streams for complex processing
4. Learn about Schema Registry (Avro, Protobuf)
5. Study KSQL for SQL-based stream processing
6. Deploy Kafka on Kubernetes
7. Compare with other streaming platforms (Pulsar, Kinesis)

---

**Total Time**: 12-16 hours
**Difficulty**: Intermediate to Advanced
**Prerequisite**: Understanding of distributed systems and message queues
