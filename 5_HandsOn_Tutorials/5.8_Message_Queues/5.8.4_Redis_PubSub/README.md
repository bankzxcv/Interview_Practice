# Redis Pub/Sub and Streams

Complete guide to Redis messaging patterns including Pub/Sub and Streams with real-world examples and production deployments.

## Table of Contents
- [Overview](#overview)
- [Core Pub/Sub vs Streams](#core-pubsub-vs-streams)
- [When to Use Redis Messaging](#when-to-use-redis-messaging)
- [Tutorials](#tutorials)
- [Quick Reference](#quick-reference)
- [Architecture Overview](#architecture-overview)
- [Best Practices](#best-practices)

## Overview

Redis provides two main messaging patterns:

### Redis Pub/Sub
- Fire-and-forget messaging
- No message persistence
- Pattern-based subscriptions
- Low latency, high throughput
- Ideal for real-time notifications

### Redis Streams
- Append-only log structure
- Message persistence
- Consumer groups with acknowledgments
- Message claiming and replay
- Ideal for event sourcing and durable messaging

## Core Pub/Sub vs Streams

### Pub/Sub Characteristics

**Advantages:**
- Extremely low latency (sub-millisecond)
- Simple API (PUBLISH, SUBSCRIBE, PSUBSCRIBE)
- Pattern matching support
- No storage overhead

**Limitations:**
- No message persistence
- Subscribers must be active
- No message history
- No guaranteed delivery
- No acknowledgments

**Use Cases:**
- Real-time notifications
- Chat applications
- Live dashboards
- Event broadcasting
- Cache invalidation

### Streams Characteristics

**Advantages:**
- Message persistence and durability
- Consumer groups for load distribution
- Message acknowledgment (XACK)
- Historical message replay
- Pending entries tracking
- Message claiming for fault tolerance

**Limitations:**
- Higher latency than Pub/Sub
- Storage overhead
- More complex API
- Requires cleanup/trimming

**Use Cases:**
- Event sourcing
- Activity streams
- Task queues with reliability
- Audit logs
- Data pipeline ingestion

## When to Use Redis Messaging

### Choose Redis Pub/Sub When:
- Messages can be lost without major consequences
- Subscribers are always active
- Ultra-low latency is critical
- Simple broadcasting is sufficient
- No need for message replay

### Choose Redis Streams When:
- Messages must be persisted
- Multiple consumers need to share work
- Message acknowledgment is required
- Historical data access is needed
- Exactly-once processing is important

### Choose Other Solutions When:
- **RabbitMQ**: Need complex routing, multiple protocols, AMQP compliance
- **Kafka**: Need multi-datacenter replication, long-term storage, high durability
- **NATS**: Need multi-tenancy, distributed systems, JetStream persistence
- **SQS/SNS**: Need managed cloud service, serverless integration

## Tutorials

### [Tutorial 01: Basic Pub/Sub](./01_basic_pubsub/README.md)
Learn Redis Pub/Sub fundamentals with Docker setup, basic publishing and subscribing, channel management, and Python redis-py library usage.

**Key Topics:**
- Redis Docker setup
- PUBLISH and SUBSCRIBE commands
- Multiple subscribers
- Fire-and-forget messaging
- Python redis-py integration

### [Tutorial 02: Pattern Matching Subscriptions](./02_pattern_subscriptions/README.md)
Master pattern-based subscriptions with glob patterns, dynamic channel subscriptions, and multi-channel patterns.

**Key Topics:**
- PSUBSCRIBE with glob patterns
- Wildcard matching (*, ?)
- Multiple pattern subscriptions
- Dynamic subscription management
- Pattern use cases

### [Tutorial 03: Redis Streams](./03_redis_streams/README.md)
Understand Redis Streams fundamentals including message addition, reading, stream IDs, and persistence advantages.

**Key Topics:**
- XADD for message addition
- XREAD for message consumption
- Stream IDs and ordering
- Range queries (XRANGE, XREVRANGE)
- Stream persistence

### [Tutorial 04: Consumer Groups](./04_consumer_groups/README.md)
Implement consumer groups for distributed message processing with acknowledgments, pending entries, and message claiming.

**Key Topics:**
- XGROUP CREATE for group setup
- XREADGROUP for group consumption
- XACK for acknowledgments
- XPENDING for tracking
- XCLAIM for message ownership

### [Tutorial 05: Combining with Redis Data Structures](./05_data_structures/README.md)
Combine Pub/Sub and Streams with Redis data structures for advanced patterns like task queues, unique events, and priority messaging.

**Key Topics:**
- Pub/Sub + Lists (RPUSH/BLPOP)
- Pub/Sub + Sets (SADD for deduplication)
- Pub/Sub + Sorted Sets (ZADD for priority)
- Pub/Sub + Hashes (HSET for metadata)
- Hybrid architectural patterns

### [Tutorial 06: Persistence and Reliability](./06_persistence/README.md)
Configure Redis persistence with RDB snapshots, AOF logs, durability settings, and backup strategies.

**Key Topics:**
- RDB snapshot configuration
- AOF append-only file
- Persistence trade-offs
- Backup and restore procedures
- Docker volumes for persistence

### [Tutorial 07: Sentinel and Cluster](./07_sentinel_cluster/README.md)
Deploy high-availability Redis with Sentinel for automatic failover and Redis Cluster for horizontal scaling.

**Key Topics:**
- Redis Sentinel setup (3 sentinels)
- Automatic failover
- Redis Cluster architecture
- 3 masters + 3 replicas
- Client-side failover handling

### [Tutorial 08: Kubernetes Deployment](./08_kubernetes_deployment/README.md)
Deploy production-ready Redis on Kubernetes with operators, StatefulSets, persistence, and monitoring.

**Key Topics:**
- Redis Operator installation
- StatefulSet with PersistentVolumes
- Redis Cluster on K8s
- Sentinel HA setup
- Prometheus monitoring

## Quick Reference

### Python Installation
```bash
pip install redis
```

### Basic Pub/Sub Example
```python
import redis

# Publisher
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
r.publish('news', 'Breaking news!')

# Subscriber
pubsub = r.pubsub()
pubsub.subscribe('news')

for message in pubsub.listen():
    if message['type'] == 'message':
        print(f"Received: {message['data']}")
```

### Pattern Subscription
```python
pubsub = r.pubsub()
pubsub.psubscribe('events:*')  # Match events:user, events:system, etc.

for message in pubsub.listen():
    if message['type'] == 'pmessage':
        print(f"Channel: {message['channel']}, Data: {message['data']}")
```

### Redis Streams Example
```python
# Add to stream
r.xadd('mystream', {'sensor': 'temp', 'value': '22.5'})

# Read from stream
messages = r.xread({'mystream': '0'}, count=10)
for stream, msgs in messages:
    for msg_id, data in msgs:
        print(f"{msg_id}: {data}")
```

### Consumer Group Example
```python
# Create consumer group
r.xgroup_create('mystream', 'mygroup', id='0', mkstream=True)

# Consume as group member
messages = r.xreadgroup('mygroup', 'consumer1', {'mystream': '>'}, count=1)
for stream, msgs in messages:
    for msg_id, data in msgs:
        print(f"Processing: {msg_id}: {data}")
        r.xack('mystream', 'mygroup', msg_id)  # Acknowledge
```

## Architecture Overview

### Pub/Sub Architecture
```
┌─────────────┐
│ Publisher 1 │────┐
└─────────────┘    │
                   ▼
┌─────────────┐  ┌──────────┐  ┌──────────────┐
│ Publisher 2 │─▶│  Redis   │─▶│ Subscriber 1 │
└─────────────┘  │  Pub/Sub │  └──────────────┘
                 └──────────┘
┌─────────────┐    │          ┌──────────────┐
│ Publisher 3 │────┘          │ Subscriber 2 │
└─────────────┘               └──────────────┘

                              ┌──────────────┐
                              │ Subscriber 3 │
                              └──────────────┘
```

### Streams with Consumer Groups
```
                        ┌─────────────────┐
                        │  Redis Stream   │
                        │  (Persisted)    │
                        └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │                         │
            ┌───────▼───────┐         ┌───────▼───────┐
            │ Consumer      │         │ Consumer      │
            │ Group A       │         │ Group B       │
            └───────┬───────┘         └───────┬───────┘
                    │                         │
        ┌───────────┼──────────┐    ┌─────────┼──────────┐
        │           │          │    │         │          │
    ┌───▼───┐   ┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
    │Cons-  │   │Cons-  │  │Cons-  │  │Cons-  │  │Cons-  │
    │umer 1 │   │umer 2 │  │umer 3 │  │umer 1 │  │umer 2 │
    └───────┘   └───────┘  └───────┘  └───────┘  └───────┘
```

## Best Practices

### Pub/Sub Best Practices

1. **Connection Management**
   - Use connection pooling
   - Implement automatic reconnection
   - Handle network failures gracefully

2. **Subscriber Patterns**
   - Keep message handlers lightweight
   - Process messages asynchronously
   - Avoid blocking operations

3. **Channel Naming**
   - Use hierarchical naming (app:component:event)
   - Plan for pattern subscriptions
   - Document channel conventions

4. **Monitoring**
   - Track PUBSUB CHANNELS and PUBSUB NUMSUB
   - Monitor client connections
   - Alert on subscriber disconnections

### Streams Best Practices

1. **Stream Trimming**
   - Use MAXLEN or MINID to limit size
   - Implement automatic trimming
   - Balance retention vs storage

2. **Consumer Groups**
   - Name consumers uniquely
   - Handle pending entries on startup
   - Implement message timeouts

3. **Acknowledgments**
   - XACK after successful processing
   - Handle processing failures
   - Implement retry logic

4. **ID Management**
   - Use auto-generated IDs for ordering
   - Use custom IDs for idempotency
   - Understand ID format (timestamp-sequence)

### Performance Optimization

1. **Batching**
   - Read multiple messages per call
   - Batch acknowledgments
   - Use pipelines for multiple operations

2. **Persistence Configuration**
   - Choose appropriate AOF/RDB settings
   - Balance durability vs performance
   - Use replication for reliability

3. **Memory Management**
   - Monitor memory usage
   - Set maxmemory policies
   - Implement stream trimming

4. **Network Optimization**
   - Minimize round trips
   - Use pipelining
   - Consider Redis Cluster for scale

### Production Considerations

1. **High Availability**
   - Deploy with Redis Sentinel
   - Use Redis Cluster for partitioning
   - Implement client-side failover

2. **Monitoring and Alerting**
   - Track key metrics (latency, throughput)
   - Monitor stream lengths
   - Alert on consumer lag

3. **Security**
   - Enable Redis authentication (requirepass)
   - Use TLS for encryption
   - Implement network isolation

4. **Backup and Recovery**
   - Regular RDB snapshots
   - AOF for point-in-time recovery
   - Test restore procedures

## Getting Started

1. Start with [Tutorial 01: Basic Pub/Sub](./01_basic_pubsub/README.md) for fundamentals
2. Progress to [Tutorial 03: Redis Streams](./03_redis_streams/README.md) for persistence
3. Implement [Tutorial 04: Consumer Groups](./04_consumer_groups/README.md) for reliability
4. Deploy with [Tutorial 08: Kubernetes Deployment](./08_kubernetes_deployment/README.md) for production

## Additional Resources

- [Redis Documentation](https://redis.io/docs/)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [Redis Streams](https://redis.io/docs/data-types/streams/)
- [redis-py Documentation](https://redis-py.readthedocs.io/)
- [Redis University](https://university.redis.com/)

## Summary

Redis provides flexible messaging patterns suitable for various use cases:
- **Pub/Sub** for real-time, fire-and-forget messaging
- **Streams** for persistent, reliable message processing
- **Hybrid patterns** combining messaging with data structures

Choose the right pattern based on your reliability, latency, and persistence requirements.
