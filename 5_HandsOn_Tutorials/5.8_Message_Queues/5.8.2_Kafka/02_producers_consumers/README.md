# Kafka Tutorial 02: Advanced Producers & Consumers

## Overview
Advanced producer configurations, consumer patterns, and message handling.

## Topics Covered
- Producer configurations (acks, batching, compression)
- Consumer patterns (manual commit, seek, rebalancing)
- Error handling and retries
- Idempotence and transactions

## Quick Start
```bash
docker-compose up -d
pip install -r requirements.txt
python advanced_producer.py
python advanced_consumer.py
```

## Key Configs

**Producer:**
- acks: all (durability)
- compression: snappy/lz4/gzip
- batch.size, linger.ms (throughput)
- enable.idempotence (exactly-once)

**Consumer:**
- enable.auto.commit: false (manual control)
- isolation.level: read_committed (transactions)
- max.poll.records (batch size)

## Next Steps
Tutorial 03: Partitions and replication
