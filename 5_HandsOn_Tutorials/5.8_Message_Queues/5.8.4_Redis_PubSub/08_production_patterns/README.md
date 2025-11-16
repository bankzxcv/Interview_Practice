# Redis Tutorial 08: Production Messaging Patterns

## Overview
Production-ready Redis messaging patterns, best practices, and operational guidelines.

## When to Use What

### Core PubSub
- Real-time notifications
- Cache invalidation
- Live updates
- OK to lose messages

### Redis Streams
- Event sourcing
- Task queues
- Audit logs
- Need reliability

## Production Checklist

### Infrastructure
- [ ] High availability (Sentinel/Cluster)
- [ ] Persistence (AOF + RDB)
- [ ] Resource limits
- [ ] Monitoring

### Configuration
- [ ] Max memory policy
- [ ] Eviction policy
- [ ] Connection limits
- [ ] Timeout settings

### Security
- [ ] Authentication (requirepass/ACLs)
- [ ] TLS encryption
- [ ] Network isolation
- [ ] Key expiration

### Monitoring
- [ ] Memory usage
- [ ] Connected clients
- [ ] Command stats
- [ ] Slowlog

## Patterns

### 1. Reliable Task Queue
Use Streams with consumer groups

### 2. Rate Limiting
Use sorted sets with timestamps

### 3. Message Deduplication
Use sets with TTL

### 4. Priority Queue
Multiple streams/lists

## Best Practices
1. Choose right tool (PubSub vs Streams)
2. Monitor memory closely
3. Configure persistence
4. Implement retry logic
5. Use connection pooling
6. Set appropriate TTLs
