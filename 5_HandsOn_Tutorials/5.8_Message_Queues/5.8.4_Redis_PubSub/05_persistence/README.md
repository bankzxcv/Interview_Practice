# Redis Tutorial 05: Persistence for Messaging

## Overview
Configure Redis persistence (RDB, AOF) for message durability.

## Persistence Options

### RDB (Snapshots)
- Point-in-time snapshots
- Compact, fast restart
- Potential data loss

### AOF (Append-Only File)
- Log of all write operations
- Better durability
- Larger files

### Both
- Combine for best durability

## Quick Start
```bash
docker-compose up -d
python test_persistence.py
```

## Configuration
```conf
# RDB
save 900 1      # Save after 900s if 1 key changed
save 300 10     # Save after 300s if 10 keys changed

# AOF
appendonly yes
appendfsync everysec  # always|everysec|no
```

## Best Practices
- Use AOF for critical messages
- Configure save points appropriately
- Monitor disk usage
- Test recovery procedures

Next: Tutorial 06 - Clustering
