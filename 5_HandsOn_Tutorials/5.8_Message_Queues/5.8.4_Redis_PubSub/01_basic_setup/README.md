# Redis PubSub Tutorial 01: Basic Setup

## Overview
Learn Redis Pub/Sub fundamentals - publish and subscribe to channels.

## Learning Objectives
- Install and run Redis
- Understand publish/subscribe pattern
- Use channels for messaging
- Work with Redis CLI and Python client

## Architecture
```
Publisher --> Channel --> Subscriber(s)
   PUBLISH    channel      SUBSCRIBE
```

## Quick Start
```bash
docker-compose up -d

# Redis CLI
docker exec -it redis redis-cli
SUBSCRIBE mychannel
# In another terminal:
PUBLISH mychannel "Hello Redis"

# Python
python publisher.py
python subscriber.py
```

## Key Concepts
- **Fire-and-forget**: Messages not persisted
- **At-most-once**: No delivery guarantees
- **Fan-out**: All subscribers receive messages
- **No replay**: Can't retrieve past messages

## Commands
```bash
PUBLISH channel message
SUBSCRIBE channel [channel ...]
PSUBSCRIBE pattern [pattern ...]  # Pattern matching
UNSUBSCRIBE [channel ...]
```

## Limitations
- No message persistence
- No acknowledgments
- Lost messages if no subscribers

## Best Practices
- Use for notifications, not critical data
- Consider Redis Streams for persistence
- Monitor subscriber count

Next: Tutorial 02 - PubSub patterns
