# Redis Tutorial 04: Consumer Groups with Streams

## Overview
Scale message processing with Redis Streams consumer groups.

## Consumer Groups
- Multiple consumers in a group
- Each message delivered to one consumer
- Load balancing
- Acknowledgments
- Pending messages tracking

## Quick Start
```bash
docker-compose up -d

# Create consumer group
python create_group.py

# Start multiple consumers
python consumer.py worker1 &
python consumer.py worker2 &
python consumer.py worker3 &

# Produce messages
python producer.py
```

## Workflow
```
Stream --> Consumer Group
           ├── Consumer 1 (processes msgs 1,4,7...)
           ├── Consumer 2 (processes msgs 2,5,8...)
           └── Consumer 3 (processes msgs 3,6,9...)
```

## Best Practices
- Monitor pending messages
- Implement claim mechanism for stale messages
- Use appropriate block timeouts
- Handle consumer failures

Next: Tutorial 05 - Persistence
