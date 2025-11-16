# Redis Tutorial 03: Redis Streams

## Overview
Redis Streams provide persistent, log-based messaging with consumer groups.

## Key Features
- **Persistence**: Messages stored on disk
- **Replay**: Read from any point
- **Consumer Groups**: Multiple consumers, load balancing
- **Acknowledgments**: Track processed messages
- **IDs**: Automatic, time-based unique IDs

## Quick Start
```bash
docker-compose up -d
python stream_producer.py
python stream_consumer.py
```

## Commands
```bash
XADD stream * field value      # Add message
XREAD STREAMS stream 0          # Read from beginning
XGROUP CREATE stream group $ MKSTREAM
XREADGROUP GROUP group consumer STREAMS stream >
XACK stream group id            # Acknowledge
```

## vs PubSub
| Feature | PubSub | Streams |
|---------|--------|---------|
| Persistence | No | Yes |
| Replay | No | Yes |
| ACKs | No | Yes |
| Consumer Groups | No | Yes |

## Best Practices
- Use streams for critical data
- Configure max length
- Monitor pending messages
- Claim abandoned messages

Next: Tutorial 04 - Consumer groups
