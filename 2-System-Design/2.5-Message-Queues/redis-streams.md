# Redis Streams - Lightweight Message Queue

## Overview

Redis Streams is a **lightweight message queue** and event streaming data structure built into Redis 5.0+.

**Think of it as**: Kafka-lite (simpler, less features, but still powerful)

**When to Use Redis Streams**:
- ✅ Already using Redis (cache + messaging)
- ✅ Need lightweight message queue
- ✅ Low latency required (microseconds)
- ✅ Simple event streaming
- ✅ Want to avoid Kafka complexity

**When NOT to Use**:
- ❌ Need Kafka-scale throughput (millions/sec)
- ❌ Need long retention (months/years)
- ❌ Need complex stream processing
- ❌ Multi-datacenter replication critical

---

## Core Concepts

### Stream as Append-Only Log

```
Stream "orders":
┌────────────────────────────────────────────────────┐
│ ID: 1609459200000-0  │ {order_id: 1, amount: 50} │
│ ID: 1609459201000-0  │ {order_id: 2, amount: 30} │
│ ID: 1609459202000-0  │ {order_id: 3, amount: 70} │
│ ID: 1609459203000-0  │ {order_id: 4, amount: 20} │
│         ... (append only, immutable)              │
└────────────────────────────────────────────────────┘

Entry ID format: <timestamp-ms>-<sequence>
```

**Key properties**:
- **Append-only**: Can't modify entries
- **Ordered**: By entry ID
- **Persisted**: Survives Redis restart (with AOF/RDB)
- **Retainable**: Keep events for replay

---

## Basic Operations

### Add to Stream (Producer)

```python
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Add entry to stream
entry_id = r.xadd(
    name='orders',  # Stream name
    fields={
        'order_id': 123,
        'user_id': 456,
        'amount': 99.99,
        'items': '["item1", "item2"]'
    }
)

print(f"Added entry: {entry_id}")
# Output: 1609459200000-0
```

**Auto-generate ID**:
```python
# Use '*' for auto-generated timestamp-based ID
entry_id = r.xadd('orders', {'order_id': 123}, id='*')
```

**Custom ID**:
```python
# Custom ID (must be greater than last ID)
entry_id = r.xadd('orders', {'order_id': 123}, id='1609459200000-0')
```

---

### Read from Stream (Consumer)

#### Simple Read (Blocking)

```python
# Read new entries (blocking)
while True:
    # Wait for new messages
    entries = r.xread(
        streams={'orders': '$'},  # '$' = only new entries
        block=5000,  # Block for 5 seconds
        count=10     # Read up to 10 entries
    )

    for stream_name, messages in entries:
        for message_id, fields in messages:
            print(f"ID: {message_id}")
            print(f"Data: {fields}")

            # Process order
            process_order(fields)
```

**Stream positions**:
- `$` = Only new entries (from now)
- `0` = From beginning
- `1609459200000-0` = From specific ID
- `>` = Only new entries (in consumer groups)

---

### Consumer Groups (Recommended)

**Like Kafka consumer groups**: Load balancing + fault tolerance

```
Stream "orders":
[E1][E2][E3][E4][E5][E6][E7][E8]
        ↓
Consumer Group "inventory-service":
  Consumer 1 ── reads ──> [E1][E3][E5]
  Consumer 2 ── reads ──> [E2][E4][E6]
  Consumer 3 ── reads ──> [E7][E8]

Load balanced across consumers!
```

**Create consumer group**:
```python
# Create group (start from beginning)
r.xgroup_create(
    name='orders',
    groupname='inventory-service',
    id='0',  # Start from beginning ('$' for new only)
    mkstream=True  # Create stream if doesn't exist
)
```

**Consume with group**:
```python
consumer_name = 'consumer-1'

while True:
    # Read new entries for this group
    entries = r.xreadgroup(
        groupname='inventory-service',
        consumername=consumer_name,
        streams={'orders': '>'},  # '>' = only new undelivered
        block=5000,
        count=10
    )

    for stream_name, messages in entries:
        for message_id, fields in messages:
            try:
                # Process
                process_order(fields)

                # Acknowledge (mark as processed)
                r.xack('orders', 'inventory-service', message_id)

            except Exception as e:
                print(f"Error processing {message_id}: {e}")
                # Will be retried (not acknowledged)
```

**Benefits**:
- Load balancing (multiple consumers)
- Fault tolerance (unacknowledged messages redelivered)
- No duplicates (each entry delivered to one consumer in group)

---

## Advanced Features

### Pending Entries List (PEL)

**Tracks unacknowledged messages**:

```
Consumer 1 claimed messages:
[E1] - pending (not yet acknowledged)
[E3] - pending
[E5] - acknowledged ✓

Consumer 2 claimed messages:
[E2] - pending
[E4] - acknowledged ✓
```

**View pending messages**:
```python
# See pending messages for group
pending = r.xpending('orders', 'inventory-service')
print(f"Pending count: {pending['pending']}")

# Detailed pending list
detailed = r.xpending_range(
    name='orders',
    groupname='inventory-service',
    min='-',
    max='+',
    count=10
)

for entry in detailed:
    print(f"ID: {entry['message_id']}")
    print(f"Consumer: {entry['consumer']}")
    print(f"Time elapsed: {entry['time_since_delivered']} ms")
```

**Claim stuck messages** (if consumer died):
```python
# Claim messages pending for > 60 seconds
claimed = r.xclaim(
    name='orders',
    groupname='inventory-service',
    consumername='consumer-2',  # Claiming consumer
    min_idle_time=60000,  # 60 seconds
    message_ids=['1609459200000-0', '1609459201000-0']
)

# Process claimed messages
for message_id, fields in claimed:
    process_order(fields)
    r.xack('orders', 'inventory-service', message_id)
```

**Auto-claim** (Redis 6.2+):
```python
# Automatically claim and read old pending messages
result = r.xautoclaim(
    name='orders',
    groupname='inventory-service',
    consumername='consumer-2',
    min_idle_time=60000,
    start_id='0-0',
    count=10
)

for message_id, fields in result[1]:
    process_order(fields)
    r.xack('orders', 'inventory-service', message_id)
```

---

### Trimming (Retention)

**Problem**: Stream grows forever

**Solution**: Trim old entries

```python
# Keep only last 1000 entries
r.xtrim('orders', maxlen=1000, approximate=True)

# Trim on add (efficient)
r.xadd(
    'orders',
    {'order_id': 123},
    maxlen=1000,  # Auto-trim to 1000 entries
    approximate=True  # Faster (not exact)
)

# Trim by time (Redis 6.2+)
# Keep only last 7 days
r.xtrim('orders', minid='-', limit=1000)  # Custom logic needed
```

**Approximate vs Exact**:
- `approximate=True`: Faster, trims roughly to maxlen (recommended)
- `approximate=False`: Slower, exact maxlen

---

### Stream Info

```python
# Stream info
info = r.xinfo_stream('orders')
print(f"Length: {info['length']}")
print(f"First entry: {info['first-entry']}")
print(f"Last entry: {info['last-entry']}")
print(f"Consumer groups: {info['groups']}")

# Consumer group info
group_info = r.xinfo_groups('orders')
for group in group_info:
    print(f"Group: {group['name']}")
    print(f"Consumers: {group['consumers']}")
    print(f"Pending: {group['pending']}")

# Consumer info
consumer_info = r.xinfo_consumers('orders', 'inventory-service')
for consumer in consumer_info:
    print(f"Consumer: {consumer['name']}")
    print(f"Pending: {consumer['pending']}")
    print(f"Idle: {consumer['idle']} ms")
```

---

## Common Patterns

### 1. Simple Pub/Sub

```python
# Producer
r.xadd('events', {'type': 'user.created', 'user_id': 123})

# Consumer (no groups, just read from end)
last_id = '$'
while True:
    entries = r.xread({'events': last_id}, block=1000)
    for stream, messages in entries:
        for msg_id, fields in messages:
            print(f"Event: {fields}")
            last_id = msg_id  # Track position
```

**Use case**: Simple event notifications

---

### 2. Work Queue (Consumer Groups)

```python
# Producer
r.xadd('tasks', {'task': 'send_email', 'to': 'user@example.com'})

# Workers (competing consumers)
# Worker 1, 2, 3 all consume from same group
# Each task processed by only one worker

while True:
    entries = r.xreadgroup('workers', 'worker-1', {'tasks': '>'}, count=1)
    for stream, messages in entries:
        for msg_id, fields in messages:
            execute_task(fields)
            r.xack('tasks', 'workers', msg_id)
```

**Use case**: Background job processing

---

### 3. Fan-Out (Multiple Consumer Groups)

```python
# Producer
r.xadd('orders', {'order_id': 123, 'amount': 99})

# Consumer Group 1: Inventory
# Consumer Group 2: Shipping
# Consumer Group 3: Analytics

# Each group gets all messages!
# Like SNS + SQS fan-out
```

**Use case**: Event-driven microservices

---

### 4. Event Sourcing (with Replay)

```python
# Write events to stream
r.xadd('user-events', {'event': 'created', 'user_id': 123})
r.xadd('user-events', {'event': 'updated', 'name': 'Alice'})
r.xadd('user-events', {'event': 'deleted', 'user_id': 123})

# Replay events from beginning
entries = r.xrange('user-events', min='-', max='+')
for msg_id, fields in entries:
    apply_event(fields)

# Rebuild state from events!
```

**Use case**: Audit logs, event sourcing, state replay

---

## Performance Tuning

### Pipeline (Batch Writes)

```python
# Slow: Individual writes
for i in range(1000):
    r.xadd('orders', {'order_id': i})

# Fast: Pipeline (batching)
pipe = r.pipeline()
for i in range(1000):
    pipe.xadd('orders', {'order_id': i})
pipe.execute()
```

**Improvement**: 100x faster

---

### Batch Reads

```python
# Read multiple entries at once
entries = r.xread({'orders': last_id}, count=100)  # Batch of 100
```

---

### Blocking vs Polling

```python
# Bad: Polling (wastes CPU)
while True:
    entries = r.xread({'orders': last_id}, count=10)
    time.sleep(0.1)  # Wasted time

# Good: Blocking (efficient)
while True:
    entries = r.xread({'orders': last_id}, block=5000, count=10)
    # Blocks until message arrives or 5s timeout
```

---

## Comparison

### Redis Streams vs Kafka

| Feature | Redis Streams | Kafka |
|---------|--------------|-------|
| **Throughput** | High (100K msg/sec) | Very high (1M+ msg/sec) |
| **Latency** | Very low (μs) | Low (ms) |
| **Persistence** | Redis (AOF/RDB) | Disk (distributed) |
| **Retention** | Manual trimming | Time-based |
| **Scaling** | Vertical (single Redis) | Horizontal (partitions) |
| **Complexity** | Simple | Complex |
| **Use case** | Lightweight streaming | Large-scale streaming |

**Use Redis Streams when**:
- Already using Redis
- Need low latency
- Moderate throughput
- Simple setup

**Use Kafka when**:
- Very high throughput
- Long retention (weeks/months)
- Multi-datacenter
- Complex stream processing

---

### Redis Streams vs RabbitMQ

| Feature | Redis Streams | RabbitMQ |
|---------|--------------|----------|
| **Routing** | Simple (streams) | Complex (exchanges) |
| **Replay** | Yes | No |
| **Persistence** | Yes | Yes |
| **Pub/Sub** | Yes (groups) | Yes (exchanges) |
| **Complexity** | Simple | Medium |

---

## Limitations

1. **Single Redis Instance**: No partitioning (unlike Kafka)
   - Solution: Redis Cluster (shard streams)

2. **Memory Bound**: All in RAM
   - Solution: Trim aggressively, use Redis on Flash

3. **No Strong Durability**: AOF can lose some data
   - Solution: Use AOF with fsync always (slower)

4. **Limited Throughput**: Not millions/sec like Kafka
   - Solution: Use Kafka for very high throughput

---

## Monitoring

**Stream metrics**:
```python
info = r.xinfo_stream('orders')
print(f"Stream length: {info['length']}")
print(f"Consumer groups: {len(info['groups'])}")

# Track lag
for group in r.xinfo_groups('orders'):
    pending = group['pending']
    if pending > 1000:
        alert(f"Group {group['name']} has {pending} pending messages!")
```

**Memory usage**:
```bash
redis-cli --bigkeys
redis-cli memory usage orders
```

---

## Best Practices

✅ **DO**:
- Use consumer groups (not simple read)
- Acknowledge messages after processing
- Trim streams regularly (prevent OOM)
- Use blocking reads (not polling)
- Monitor pending entries
- Claim stuck messages

❌ **DON'T**:
- Store huge messages (use reference)
- Let streams grow unbounded
- Poll instead of block
- Forget to acknowledge
- Use for very high throughput (use Kafka)

---

## Example: Complete Application

```python
import redis
import json
import time

r = redis.Redis(decode_responses=True)

# Producer
def publish_order(order_id, amount):
    r.xadd('orders', {
        'order_id': order_id,
        'amount': amount,
        'timestamp': time.time()
    }, maxlen=10000, approximate=True)  # Trim to 10K
    print(f"Published order {order_id}")

# Consumer (with group)
def consume_orders(consumer_name):
    # Create group (if not exists)
    try:
        r.xgroup_create('orders', 'inventory-service', id='0', mkstream=True)
    except redis.ResponseError:
        pass  # Group already exists

    while True:
        # Read with group
        entries = r.xreadgroup(
            'inventory-service',
            consumer_name,
            {'orders': '>'},
            block=5000,
            count=10
        )

        for stream, messages in entries:
            for msg_id, fields in messages:
                print(f"Processing: {fields}")

                try:
                    # Process order
                    process_order(fields)

                    # Acknowledge
                    r.xack('orders', 'inventory-service', msg_id)
                    print(f"✓ Acknowledged {msg_id}")

                except Exception as e:
                    print(f"✗ Failed {msg_id}: {e}")
                    # Not acknowledged → will be retried

        # Reclaim stuck messages (older than 60s)
        claimed = r.xautoclaim(
            'orders',
            'inventory-service',
            consumer_name,
            min_idle_time=60000,
            start_id='0-0',
            count=10
        )

        for msg_id, fields in claimed[1]:
            print(f"Reclaimed: {msg_id}")
            process_order(fields)
            r.xack('orders', 'inventory-service', msg_id)

def process_order(fields):
    # Simulate processing
    time.sleep(0.1)
    print(f"  Processed order {fields['order_id']}")

# Run
if __name__ == '__main__':
    import sys

    if sys.argv[1] == 'producer':
        for i in range(100):
            publish_order(i, 99.99)
            time.sleep(0.5)

    elif sys.argv[1] == 'consumer':
        consume_orders(f'consumer-{sys.argv[2]}')
```

**Run**:
```bash
# Terminal 1: Producer
python app.py producer

# Terminal 2: Consumer 1
python app.py consumer 1

# Terminal 3: Consumer 2
python app.py consumer 2

# Load balanced across consumers!
```

---

## Summary

**Redis Streams is best for**:
- Lightweight message queuing
- Low latency requirements
- Already using Redis
- Simple event streaming

**Key strengths**:
- Very low latency (microseconds)
- Simple to use
- Event replay capability
- Consumer groups (like Kafka)

**Limitations**:
- Not for very high throughput
- Memory bound
- No partitioning (single Redis)

**Next**: Compare with [Kafka](./kafka.md) or [RabbitMQ](./rabbitmq.md)
