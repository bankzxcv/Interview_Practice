# Kafka Tutorial 03: Partitions & Replication

## Overview
Understand partitioning strategy, replication, and ISR (In-Sync Replicas).

## Key Concepts
- Partition assignment strategies
- Replication factor and ISR
- Leader election
- Min in-sync replicas

## Quick Start
```bash
docker-compose up -d  # 3-broker cluster

# Create replicated topic
docker exec kafka1 kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic replicated-topic \
  --partitions 6 \
  --replication-factor 3 \
  --config min.insync.replicas=2

python partition_producer.py
python partition_consumer.py
```

## Verification
```bash
# Describe topic
docker exec kafka1 kafka-topics --describe \
  --topic replicated-topic \
  --bootstrap-server localhost:9092
```

## Best Practices
- Replication factor: 3 for production
- min.insync.replicas: 2 for durability
- Partition count: based on throughput needs
- Use partition keys for ordering

Next: Tutorial 04 - Consumer groups
