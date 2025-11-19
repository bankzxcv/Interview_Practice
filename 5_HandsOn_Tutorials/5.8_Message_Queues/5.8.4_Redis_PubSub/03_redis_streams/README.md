# Tutorial 03: Redis Streams

Master Redis Streams fundamentals including message addition with XADD, reading with XREAD, stream IDs, range queries, and the persistence advantages over Pub/Sub.

## Table of Contents
- [Introduction](#introduction)
- [Stream Basics](#stream-basics)
- [Stream IDs](#stream-ids)
- [XADD - Adding Messages](#xadd---adding-messages)
- [XREAD - Reading Messages](#xread---reading-messages)
- [Range Queries](#range-queries)
- [Python Implementation](#python-implementation)
- [Stream Management](#stream-management)
- [Persistence and Durability](#persistence-and-durability)
- [Best Practices](#best-practices)

## Introduction

Redis Streams is an append-only log data structure that provides message persistence, ordering guarantees, and historical replay capabilities. Unlike Pub/Sub's fire-and-forget model, Streams store messages durably.

### Streams vs Pub/Sub

| Feature | Pub/Sub | Streams |
|---------|---------|---------|
| Persistence | No | Yes |
| Message History | No | Yes |
| Multiple Consumers | All get same message | Consumer groups share load |
| Acknowledgments | No | Yes (with groups) |
| Replay | No | Yes |
| Latency | Ultra-low | Low |
| Storage | None | Configurable |

### When to Use Streams

**Use Streams When:**
- Messages must not be lost
- Multiple consumers need to share work
- Historical data access is needed
- Message acknowledgment is required
- Event sourcing is needed

**Use Pub/Sub When:**
- Messages can be lost
- Ultra-low latency is critical
- Simple broadcasting is sufficient
- No persistence needed

## Stream Basics

### What is a Stream?

A Stream is an ordered collection of entries where each entry:
- Has a unique auto-generated ID (timestamp-sequence)
- Contains field-value pairs (like a hash)
- Is immutable once added
- Is ordered by ID

### Stream Structure

```
Stream: mystream
┌─────────────────────────────────┐
│ ID: 1637012345000-0             │
│ {sensor: "temp", value: "22.5"} │
├─────────────────────────────────┤
│ ID: 1637012346000-0             │
│ {sensor: "temp", value: "23.1"} │
├─────────────────────────────────┤
│ ID: 1637012347000-0             │
│ {sensor: "humidity", value: "65"}│
└─────────────────────────────────┘
         ↓ (append-only)
```

### Basic Commands

**XADD** - Add entry to stream:
```bash
XADD stream_name ID field value [field value ...]
```

**XREAD** - Read entries from stream:
```bash
XREAD [COUNT count] [BLOCK milliseconds] STREAMS stream_name [stream_name ...] ID [ID ...]
```

**XLEN** - Get stream length:
```bash
XLEN stream_name
```

**XRANGE** - Read range of entries:
```bash
XRANGE stream_name start end [COUNT count]
```

## Stream IDs

### ID Format

Stream IDs follow the format: `<milliseconds-timestamp>-<sequence>`

**Examples:**
```
1637012345678-0  # First entry at timestamp 1637012345678
1637012345678-1  # Second entry at same timestamp
1637012345679-0  # First entry at next timestamp
```

### Auto-Generated IDs

Use `*` to let Redis generate the ID:

```bash
XADD mystream * temperature 22.5 humidity 65
# Returns: "1637012345678-0"

XADD mystream * temperature 23.1 humidity 67
# Returns: "1637012345679-0"
```

### Custom IDs

Provide explicit IDs (must be greater than previous):

```bash
XADD mystream 1000000000000-0 event "first"
XADD mystream 1000000000001-0 event "second"

# Error: ID must be greater than previous
XADD mystream 999999999999-0 event "invalid"
```

### Special IDs

| ID | Meaning |
|----|---------|
| `*` | Auto-generate (current time) |
| `-` | Minimum possible ID (0-0) |
| `+` | Maximum possible ID |
| `>` | Next undelivered message (consumer groups) |
| `$` | Latest ID in stream |

## XADD - Adding Messages

### Basic Syntax

```bash
XADD stream_name [MAXLEN [~] count] ID field value [field value ...]
```

### Hands-On Examples

**Add simple entry:**
```bash
redis-cli XADD sensors * sensor temp value 22.5
# "1637012345678-0"

redis-cli XADD sensors * sensor humidity value 65
# "1637012345679-0"
```

**Add multiple fields:**
```bash
redis-cli XADD weather * location "NYC" temp 22.5 humidity 65 pressure 1013
# "1637012346000-0"
```

**Add with JSON:**
```bash
redis-cli XADD events * type "user_login" data '{"user":"john","ip":"192.168.1.1"}'
# "1637012347000-0"
```

### Stream Trimming with MAXLEN

Limit stream size to prevent unbounded growth:

**Exact trimming:**
```bash
# Keep exactly 1000 entries
XADD mystream MAXLEN 1000 * event "data"
```

**Approximate trimming (~):**
```bash
# Keep approximately 1000 entries (faster, less precise)
XADD mystream MAXLEN ~ 1000 * event "data"
```

**Example:**
```bash
# Add entries and trim to 3
redis-cli XADD logs MAXLEN 3 * level info message "Log 1"
redis-cli XADD logs MAXLEN 3 * level info message "Log 2"
redis-cli XADD logs MAXLEN 3 * level info message "Log 3"
redis-cli XADD logs MAXLEN 3 * level info message "Log 4"

# Stream now contains only the last 3 entries
redis-cli XLEN logs
# (integer) 3
```

## XREAD - Reading Messages

### Basic Syntax

```bash
XREAD [COUNT count] [BLOCK milliseconds] STREAMS stream_name ID
```

### Reading Examples

**Read all messages:**
```bash
redis-cli XREAD COUNT 10 STREAMS mystream 0
```

**Read new messages:**
```bash
# Read messages after ID 1637012345678-0
redis-cli XREAD STREAMS mystream 1637012345678-0
```

**Read latest:**
```bash
# Read from the end of stream
redis-cli XREAD STREAMS mystream $
```

### Blocking Reads

Wait for new messages (like BLPOP for lists):

```bash
# Block for up to 5000ms (5 seconds) waiting for new messages
redis-cli XREAD BLOCK 5000 STREAMS mystream $
```

**Terminal 1 - Blocking Reader:**
```bash
redis-cli XREAD BLOCK 0 STREAMS notifications $
# (nil) - waiting...
```

**Terminal 2 - Publisher:**
```bash
redis-cli XADD notifications * type alert message "Server down"
```

**Terminal 1 Output:**
```
1) 1) "notifications"
   2) 1) 1) "1637012350000-0"
         2) 1) "type"
            2) "alert"
            3) "message"
            4) "Server down"
```

### Reading Multiple Streams

```bash
# Read from multiple streams simultaneously
redis-cli XREAD COUNT 5 STREAMS stream1 stream2 stream3 0 0 0
```

## Range Queries

### XRANGE - Forward Range

Read entries in chronological order:

```bash
XRANGE stream_name start end [COUNT count]
```

**Examples:**
```bash
# Read all entries
redis-cli XRANGE mystream - +

# Read first 10 entries
redis-cli XRANGE mystream - + COUNT 10

# Read specific range
redis-cli XRANGE mystream 1637012345000-0 1637012346000-0
```

### XREVRANGE - Reverse Range

Read entries in reverse chronological order:

```bash
XREVRANGE stream_name end start [COUNT count]
```

**Examples:**
```bash
# Read last 10 entries
redis-cli XREVRANGE mystream + - COUNT 10

# Read entries in reverse
redis-cli XREVRANGE mystream + -
```

### Practical Range Queries

**Get last hour of data:**
```bash
# Calculate timestamp for 1 hour ago
redis-cli XRANGE mystream $(date -d '1 hour ago' +%s)000 +
```

**Get entries from specific date:**
```bash
# From Nov 19, 2025 00:00:00
redis-cli XRANGE mystream 1731974400000 +
```

## Python Implementation

### Basic Producer

Create `stream_producer.py`:

```python
#!/usr/bin/env python3
import redis
import time
import json
from datetime import datetime
import random

def create_redis_client():
    return redis.Redis(
        host='localhost',
        port=6379,
        decode_responses=True
    )

def add_sensor_reading(r, stream_name, sensor_type, value):
    """Add sensor reading to stream."""
    entry = {
        'sensor_type': sensor_type,
        'value': str(value),
        'timestamp': datetime.now().isoformat(),
        'unit': 'celsius' if sensor_type == 'temperature' else 'percent'
    }

    # XADD returns the generated ID
    entry_id = r.xadd(stream_name, entry)
    print(f"Added entry {entry_id}: {sensor_type}={value}")
    return entry_id

def add_event(r, stream_name, event_type, data):
    """Add structured event to stream."""
    entry = {
        'event_type': event_type,
        'data': json.dumps(data),
        'timestamp': datetime.now().isoformat()
    }

    entry_id = r.xadd(stream_name, entry)
    print(f"Added event {entry_id}: {event_type}")
    return entry_id

def main():
    r = create_redis_client()

    print("Adding sensor readings...\n")

    # Add sensor data
    for i in range(10):
        # Temperature reading
        temp = round(20 + random.uniform(-2, 5), 1)
        add_sensor_reading(r, 'sensors', 'temperature', temp)

        # Humidity reading
        humidity = round(60 + random.uniform(-10, 15), 1)
        add_sensor_reading(r, 'sensors', 'humidity', humidity)

        time.sleep(0.5)

    print("\nAdding structured events...\n")

    # Add application events
    events = [
        ('user_login', {'user_id': 123, 'username': 'john'}),
        ('order_created', {'order_id': 456, 'total': 99.99}),
        ('payment_processed', {'order_id': 456, 'amount': 99.99}),
        ('order_shipped', {'order_id': 456, 'tracking': 'TRACK123'}),
    ]

    for event_type, data in events:
        add_event(r, 'events', event_type, data)
        time.sleep(0.3)

    # Get stream info
    sensor_len = r.xlen('sensors')
    events_len = r.xlen('events')

    print(f"\n{'='*60}")
    print(f"Stream 'sensors': {sensor_len} entries")
    print(f"Stream 'events': {events_len} entries")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
```

### Basic Consumer

Create `stream_consumer.py`:

```python
#!/usr/bin/env python3
import redis
import json
import signal
import sys

running = True

def signal_handler(sig, frame):
    global running
    print("\nShutting down consumer...")
    running = False

def create_redis_client():
    return redis.Redis(
        host='localhost',
        port=6379,
        decode_responses=True
    )

def parse_entry(entry_id, fields):
    """Parse stream entry."""
    print(f"\n{'='*60}")
    print(f"ID: {entry_id}")

    # Parse timestamp from ID
    timestamp_ms = int(entry_id.split('-')[0])
    from datetime import datetime
    dt = datetime.fromtimestamp(timestamp_ms / 1000.0)
    print(f"Time: {dt.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}")

    print("Fields:")
    for key, value in fields.items():
        print(f"  {key}: {value}")

        # Try to parse JSON data
        if key == 'data':
            try:
                parsed = json.loads(value)
                print(f"  Parsed data:")
                for k, v in parsed.items():
                    print(f"    {k}: {v}")
            except json.JSONDecodeError:
                pass

    print('='*60)

def consume_all_messages(r, stream_name):
    """Read all messages from beginning."""
    print(f"Reading all messages from '{stream_name}'...\n")

    # XREAD from beginning (ID 0)
    messages = r.xread({stream_name: '0'}, count=100)

    if not messages:
        print("No messages in stream")
        return

    for stream, entries in messages:
        print(f"Stream: {stream}")
        for entry_id, fields in entries:
            parse_entry(entry_id, fields)

def consume_new_messages(r, stream_name):
    """Block and wait for new messages."""
    print(f"Waiting for new messages on '{stream_name}'...")
    print("Press Ctrl+C to stop\n")

    # Start from the end
    last_id = '$'

    global running
    while running:
        try:
            # Block for up to 1 second
            messages = r.xread({stream_name: last_id}, block=1000, count=10)

            if messages:
                for stream, entries in messages:
                    for entry_id, fields in entries:
                        parse_entry(entry_id, fields)
                        last_id = entry_id  # Update last seen ID

        except redis.RedisError as e:
            print(f"Redis error: {e}")
            break

def main():
    signal.signal(signal.SIGINT, signal_handler)

    r = create_redis_client()

    if len(sys.argv) < 2:
        print("Usage: python stream_consumer.py <stream_name> [all|new]")
        print("  all - Read all existing messages")
        print("  new - Wait for new messages (blocking)")
        sys.exit(1)

    stream_name = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else 'all'

    try:
        r.ping()
        print(f"Connected to Redis\n")
    except redis.ConnectionError:
        print("Failed to connect to Redis")
        return

    # Check if stream exists
    if r.exists(stream_name) == 0 and mode == 'all':
        print(f"Stream '{stream_name}' does not exist")
        return

    if mode == 'all':
        consume_all_messages(r, stream_name)
    elif mode == 'new':
        consume_new_messages(r, stream_name)
    else:
        print(f"Unknown mode: {mode}")

if __name__ == "__main__":
    main()
```

### Run the Examples

**Terminal 1 - Producer:**
```bash
python stream_producer.py
```

**Terminal 2 - Consume All:**
```bash
python stream_consumer.py sensors all
```

**Terminal 3 - Wait for New:**
```bash
python stream_consumer.py events new
```

### Range Query Example

Create `stream_range_query.py`:

```python
#!/usr/bin/env python3
import redis
from datetime import datetime, timedelta

def create_redis_client():
    return redis.Redis(
        host='localhost',
        port=6379,
        decode_responses=True
    )

def query_time_range(r, stream_name, start_time, end_time):
    """Query stream by time range."""
    # Convert datetime to millisecond timestamps
    start_ms = int(start_time.timestamp() * 1000)
    end_ms = int(end_time.timestamp() * 1000)

    start_id = f"{start_ms}-0"
    end_id = f"{end_ms}-0"

    print(f"Querying {stream_name} from {start_time} to {end_time}")
    print(f"ID range: {start_id} to {end_id}\n")

    # XRANGE query
    entries = r.xrange(stream_name, start_id, end_id)

    if not entries:
        print("No entries found in range")
        return

    for entry_id, fields in entries:
        timestamp_ms = int(entry_id.split('-')[0])
        dt = datetime.fromtimestamp(timestamp_ms / 1000.0)
        print(f"{dt.strftime('%H:%M:%S.%f')[:-3]} - {fields}")

def get_last_n_entries(r, stream_name, count):
    """Get last N entries using XREVRANGE."""
    print(f"Getting last {count} entries from {stream_name}\n")

    # XREVRANGE from end to beginning
    entries = r.xrevrange(stream_name, '+', '-', count=count)

    for entry_id, fields in entries:
        print(f"{entry_id}: {fields}")

def main():
    r = create_redis_client()

    # Get last 5 entries
    get_last_n_entries(r, 'sensors', 5)

    print("\n" + "="*60 + "\n")

    # Query last minute
    end_time = datetime.now()
    start_time = end_time - timedelta(minutes=1)
    query_time_range(r, 'sensors', start_time, end_time)

if __name__ == "__main__":
    main()
```

## Stream Management

### XLEN - Get Length

```python
import redis
r = redis.Redis(host='localhost', port=6379)

# Get stream length
length = r.xlen('mystream')
print(f"Stream length: {length}")
```

### XTRIM - Trim Stream

Manually trim stream to limit size:

```bash
# Keep only last 1000 entries (exact)
redis-cli XTRIM mystream MAXLEN 1000

# Approximate trimming (faster)
redis-cli XTRIM mystream MAXLEN ~ 1000

# Trim by minimum ID
redis-cli XTRIM mystream MINID 1637012345000-0
```

**Python:**
```python
# Exact trim
r.xtrim('mystream', maxlen=1000)

# Approximate trim
r.xtrim('mystream', maxlen=1000, approximate=True)
```

### XDEL - Delete Entries

```bash
# Delete specific entries
redis-cli XDEL mystream 1637012345678-0 1637012345679-0
```

**Python:**
```python
r.xdel('mystream', '1637012345678-0', '1637012345679-0')
```

### Monitoring Script

Create `stream_monitor.py`:

```python
#!/usr/bin/env python3
import redis
import time

def monitor_streams(r, stream_names):
    """Monitor multiple streams."""
    while True:
        print("\n" + "="*60)
        print(f"Stream Status - {time.strftime('%H:%M:%S')}")
        print("="*60)

        for stream_name in stream_names:
            if r.exists(stream_name):
                length = r.xlen(stream_name)

                # Get first and last entry
                first = r.xrange(stream_name, '-', '+', count=1)
                last = r.xrevrange(stream_name, '+', '-', count=1)

                first_id = first[0][0] if first else 'N/A'
                last_id = last[0][0] if last else 'N/A'

                print(f"\n{stream_name}:")
                print(f"  Length: {length}")
                print(f"  First ID: {first_id}")
                print(f"  Last ID: {last_id}")
            else:
                print(f"\n{stream_name}: (does not exist)")

        time.sleep(5)

def main():
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    streams = ['sensors', 'events', 'logs']
    monitor_streams(r, streams)

if __name__ == "__main__":
    main()
```

## Persistence and Durability

### Persistence Benefits

Unlike Pub/Sub, Streams are persisted:

1. **Survive Redis Restarts**
   - Messages are not lost on restart
   - RDB snapshots save streams
   - AOF logs all stream operations

2. **Historical Replay**
   - Read old messages anytime
   - Replay from any point
   - Audit and debugging

3. **Multiple Read Passes**
   - Same data read by different consumers
   - No message loss
   - Independent consumer groups

### Configure Persistence

In `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7.2-alpine
    command: >
      redis-server
      --appendonly yes
      --appendfsync everysec
      --save 900 1
      --save 300 10
      --save 60 10000
    volumes:
      - ./redis-data:/data
```

### Verify Persistence

```bash
# Add data
redis-cli XADD persistent * data "important"

# Get stream info
redis-cli XLEN persistent
# (integer) 1

# Restart Redis
docker-compose restart redis

# Verify data persists
redis-cli XLEN persistent
# (integer) 1
```

## Best Practices

### 1. Stream Naming

```python
# Hierarchical naming
r.xadd('app:sensors:temperature', ...)
r.xadd('app:events:user:login', ...)
r.xadd('system:logs:error', ...)
```

### 2. Stream Trimming

```python
# Automatic trimming on add
r.xadd('logs', {'message': 'log'}, maxlen=10000, approximate=True)

# Periodic cleanup
def trim_old_streams():
    for stream in ['logs', 'events', 'metrics']:
        r.xtrim(stream, maxlen=100000, approximate=True)
```

### 3. ID Management

```python
# Use auto-generated IDs for time ordering
entry_id = r.xadd('stream', {'data': 'value'})  # Uses *

# Custom IDs for idempotency (rare)
custom_id = f"{int(time.time() * 1000)}-0"
r.xadd('stream', {'data': 'value'}, id=custom_id)
```

### 4. Error Handling

```python
try:
    entry_id = r.xadd('stream', {'data': 'value'})
except redis.ResponseError as e:
    if 'equal or smaller' in str(e):
        print("ID must be greater than previous")
    else:
        raise
```

## Summary

In this tutorial, you learned:

1. Redis Streams fundamentals and persistence model
2. Stream ID format and generation
3. XADD for adding messages with trimming
4. XREAD for consuming messages (blocking and non-blocking)
5. XRANGE/XREVRANGE for time-based queries
6. Python implementation with redis-py
7. Stream management (XLEN, XTRIM, XDEL)
8. Persistence and durability advantages
9. Production best practices

**Key Takeaways:**
- Streams provide persistent, ordered message storage
- Messages are never lost (with proper persistence)
- Time-based IDs enable range queries
- Streams support both real-time and historical access
- Use trimming to manage memory usage

**Next Steps:**
- [Tutorial 04: Consumer Groups](../04_consumer_groups/README.md) for distributed processing
- [Tutorial 06: Persistence and Reliability](../06_persistence/README.md) for production durability
