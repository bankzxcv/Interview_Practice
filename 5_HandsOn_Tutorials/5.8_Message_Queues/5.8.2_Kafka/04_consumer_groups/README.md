# Kafka Tutorial 04: Consumer Groups

## Overview
Scale consumers with consumer groups, understand rebalancing, and partition assignment.

## Key Concepts
- Consumer groups for parallel processing
- Partition assignment (range, round-robin, sticky)
- Rebalancing triggers and process
- Consumer lag monitoring

## Quick Start
```bash
docker-compose up -d

# Start multiple consumers in same group
python consumer.py group1 &
python consumer.py group1 &
python consumer.py group1 &

python producer.py
```

## Consumer Group Commands
```bash
# List consumer groups
docker exec kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 --list

# Describe group
docker exec kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --group group1 --describe
```

## Best Practices
- Consumers ≤ Partitions
- Monitor consumer lag
- Handle rebalancing gracefully
- Use static membership for stability

Next: Tutorial 05 - Kafka Streams
