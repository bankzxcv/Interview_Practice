# Kafka Tutorial 01: Basic Setup

## Overview
Install Kafka, create your first topic, and understand Kafka architecture.

## Learning Objectives
- Install and run Kafka with Docker
- Understand Kafka architecture (brokers, topics, partitions)
- Create topics
- Produce and consume messages
- Use command-line tools

## Architecture

```
Producer --> Topic (Partitions) --> Consumer Group
              /  |  \
        Partition Partition Partition
             0      1      2
```

## Quick Start

```bash
# Start Kafka + Zookeeper
docker-compose up -d

# Create topic
docker exec kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic first-topic \
  --partitions 3 \
  --replication-factor 1

# Produce messages
python producer.py

# Consume messages
python consumer.py
```

## Verification

```bash
# List topics
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Describe topic
docker exec kafka kafka-topics --describe \
  --topic first-topic \
  --bootstrap-server localhost:9092

# Console consumer
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic first-topic \
  --from-beginning
```

## Key Concepts

- **Broker**: Kafka server that stores data
- **Topic**: Category for messages
- **Partition**: Ordered, immutable sequence of messages
- **Offset**: Unique ID for each message in partition
- **Consumer Group**: Group of consumers sharing work

## Best Practices

1. Choose partition count based on throughput needs
2. Use meaningful topic names
3. Set appropriate replication factor (3 for production)
4. Monitor lag and throughput
5. Plan partition key strategy

## Next Steps
- Tutorial 02: Advanced producer/consumer patterns
