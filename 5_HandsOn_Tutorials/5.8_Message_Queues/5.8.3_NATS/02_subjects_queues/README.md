# NATS Tutorial 02: Subject Hierarchies & Queue Groups

## Overview
Advanced subject patterns with wildcards and queue groups for load balancing.

## Key Concepts
- **Subject Tokens**: Hierarchical namespacing (foo.bar.baz)
- **Wildcards**:
  - `*` matches one token (foo.*.baz)
  - `>` matches multiple tokens (foo.>)
- **Queue Groups**: Load balance among subscribers

## Quick Start
```bash
docker-compose up -d

# Wildcard subscriber
python wildcard_sub.py

# Queue group workers
python queue_worker.py group1 &
python queue_worker.py group1 &
python queue_worker.py group1 &

# Publisher
python subject_pub.py
```

## Subject Examples
```
events.user.login
events.user.logout
events.system.startup
events.system.shutdown
```

## Wildcards
```python
# Subscribe to all user events
nc.subscribe("events.user.*", ...)

# Subscribe to all events
nc.subscribe("events.>", ...)
```

## Queue Groups
Load balance messages among group members:
```python
nc.subscribe("tasks", queue="workers", cb=handler)
```

Next: Tutorial 03 - JetStream
