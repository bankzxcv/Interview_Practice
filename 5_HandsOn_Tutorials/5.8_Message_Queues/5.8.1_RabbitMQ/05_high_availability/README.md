# RabbitMQ Tutorial 05: High Availability

## Overview
Configure RabbitMQ for high availability with queue mirroring and quorum queues.

## Learning Objectives
- Configure mirrored queues
- Use quorum queues (Raft-based)
- Implement policies for HA
- Handle node failures

## HA Strategies

### 1. Classic Mirrored Queues (Legacy)
```bash
rabbitmqctl set_policy ha-all "^ha\." '{"ha-mode":"all"}'
```

### 2. Quorum Queues (Recommended)
```python
channel.queue_declare(
    queue='quorum.queue',
    durable=True,
    arguments={'x-queue-type': 'quorum'}
)
```

## Quick Start

```bash
docker-compose up -d
python ha_producer.py
python ha_consumer.py

# Test failover: stop a node
docker stop rabbitmq2

# Consumer should continue working
```

## Key Concepts

- **Quorum Queues**: Raft consensus, better data safety
- **Mirrored Queues**: Legacy, replicated across nodes
- **Leader Election**: Automatic on node failure
- **Synchronization**: Queue data copied to replicas

## Best Practices

1. Use quorum queues for critical data
2. Set appropriate replication factor (odd numbers)
3. Monitor queue synchronization status
4. Plan for graceful node shutdowns

## Next Steps
- Tutorial 06: Monitoring and observability
