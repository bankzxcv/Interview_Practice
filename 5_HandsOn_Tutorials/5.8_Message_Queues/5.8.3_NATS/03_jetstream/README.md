# NATS Tutorial 03: JetStream

## Overview
JetStream adds persistence, replay, and guaranteed delivery to NATS.

## Key Features
- **Persistence**: Messages stored on disk
- **Replay**: Consumers can replay from any point
- **Acknowledgments**: At-least-once delivery
- **Retention**: Time/size/message count policies
- **Deduplication**: Window-based message deduplication

## Quick Start
```bash
docker-compose up -d

# Create stream
nats stream add ORDERS \
  --subjects "orders.*" \
  --retention limits \
  --max-msgs=-1 \
  --max-age=24h

# Publish & consume
python js_publisher.py
python js_consumer.py
```

## Stream vs Core NATS
- **Core**: Fire-and-forget, no persistence
- **JetStream**: Persistent, replay, acks

## Consumer Types
- **Push**: Server pushes messages
- **Pull**: Client pulls on demand

## Best Practices
- Use JetStream for critical data
- Configure appropriate retention
- Monitor stream metrics
- Use ack timeouts

Next: Tutorial 04 - NATS clustering
