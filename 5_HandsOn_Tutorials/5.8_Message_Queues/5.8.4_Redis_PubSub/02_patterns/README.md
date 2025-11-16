# Redis PubSub Tutorial 02: Patterns

## Overview
Advanced pub/sub with pattern matching and multiple channel subscriptions.

## Pattern Matching
Use PSUBSCRIBE for wildcard patterns:
- `*` - Match any characters
- `?` - Match single character
- `[abc]` - Match a, b, or c

## Examples
```
PSUBSCRIBE news.*      # news.sports, news.tech
PSUBSCRIBE user:*      # user:login, user:logout
PSUBSCRIBE *.critical  # app.critical, db.critical
```

## Quick Start
```bash
docker-compose up -d
python pattern_subscriber.py
python multi_publisher.py
```

## Use Cases
- Event routing by category
- Multi-tenant notifications
- Hierarchical topics

## Best Practices
- Use specific patterns
- Avoid overly broad wildcards
- Monitor pattern subscriptions

Next: Tutorial 03 - Redis Streams
