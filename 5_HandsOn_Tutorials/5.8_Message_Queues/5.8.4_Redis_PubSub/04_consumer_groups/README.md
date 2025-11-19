# Tutorial 04: Consumer Groups

Implement Redis Streams consumer groups for distributed message processing with XGROUP, XREADGROUP, acknowledgments, pending entries tracking, and message claiming for fault tolerance.

## Table of Contents
- [Introduction](#introduction)
- [Consumer Group Concepts](#consumer-group-concepts)
- [Creating Consumer Groups](#creating-consumer-groups)
- [Reading as a Group](#reading-as-a-group)
- [Acknowledgments](#acknowledgments)
- [Pending Entries](#pending-entries)
- [Claiming Messages](#claiming-messages)
- [Python Implementation](#python-implementation)
- [Multiple Consumers](#multiple-consumers)
- [Error Handling and Recovery](#error-handling-and-recovery)
- [Best Practices](#best-practices)

## Introduction

Consumer Groups enable multiple consumers to cooperatively process messages from a Redis Stream. Unlike Pub/Sub where all subscribers receive all messages, consumer groups distribute messages among members for load balancing.

### Key Features

**Load Distribution:**
- Messages delivered to only one consumer in the group
- Automatic load balancing
- Horizontal scaling

**Reliability:**
- Message acknowledgment (XACK)
- Pending entries tracking
- Message claiming for failed consumers
- No message loss

**Multiple Groups:**
- Different groups read the same stream independently
- Each group maintains its own position
- Enables multiple processing pipelines

## Consumer Group Concepts

### Architecture

```
Stream: orders
┌──────────────────────────┐
│ 1001-0: {order: "A"}    │
│ 1002-0: {order: "B"}    │
│ 1003-0: {order: "C"}    │
│ 1004-0: {order: "D"}    │
└──────────┬───────────────┘
           │
           ├──────────────────────────────────┐
           │                                  │
    ┌──────▼──────┐                   ┌──────▼──────┐
    │ Group: processors              │ Group: analytics │
    │ Last ID: 1003-0                │ Last ID: 1002-0   │
    └──────┬──────┘                   └──────┬──────┘
           │                                  │
    ┌──────┴──────┬──────┐            ┌──────┴──────┐
    │             │      │            │             │
┌───▼───┐  ┌──────▼──┐ ┌─▼────┐  ┌───▼───┐  ┌──────▼──┐
│Consumer│  │Consumer │ │Consumer│ │Consumer│ │Consumer │
│   1   │  │   2    │ │   3   │ │   1   │  │   2    │
└───────┘  └─────────┘ └───────┘ └───────┘  └─────────┘
```

### Key Terms

**Consumer Group:**
- Named collection of consumers
- Shares position in stream
- Tracks pending entries

**Consumer:**
- Individual worker in a group
- Must have unique name
- Receives subset of messages

**Pending Entries List (PEL):**
- Messages delivered but not acknowledged
- Per-consumer tracking
- Used for failure recovery

**Last Delivered ID:**
- Group's position in stream
- Advances with XREADGROUP
- Independent per group

## Creating Consumer Groups

### XGROUP CREATE

Create a new consumer group:

```bash
XGROUP CREATE stream_name group_name start_id [MKSTREAM]
```

**Parameters:**
- `stream_name`: The stream to read from
- `group_name`: Name for the consumer group
- `start_id`: Where to start reading (`0`, `$`, or specific ID)
- `MKSTREAM`: Create stream if it doesn't exist

### Start ID Options

| ID | Description | Use Case |
|----|-------------|----------|
| `0` | Beginning of stream | Process all historical data |
| `$` | End of stream (only new) | Process only new messages |
| `<specific-id>` | Custom position | Resume from checkpoint |

### Examples

**Create group from beginning:**
```bash
# Process all existing messages
redis-cli XGROUP CREATE mystream mygroup 0
```

**Create group for new messages only:**
```bash
# Process only new messages
redis-cli XGROUP CREATE mystream mygroup $
```

**Create group and stream:**
```bash
# Create stream if it doesn't exist
redis-cli XGROUP CREATE mystream mygroup 0 MKSTREAM
```

### Manage Groups

**List groups:**
```bash
redis-cli XINFO GROUPS mystream
```

**Delete group:**
```bash
redis-cli XGROUP DESTROY mystream mygroup
```

**Set group position:**
```bash
redis-cli XGROUP SETID mystream mygroup $
```

## Reading as a Group

### XREADGROUP Syntax

```bash
XREADGROUP GROUP group_name consumer_name [COUNT count] [BLOCK ms] [NOACK]
          STREAMS stream_name [stream_name ...] ID [ID ...]
```

### Special IDs for XREADGROUP

| ID | Meaning |
|----|---------|
| `>` | Next undelivered message |
| `0` | Pending messages for this consumer |
| `<specific-id>` | Messages after this ID |

### Basic Examples

**Read new messages:**
```bash
# Consumer "worker1" in group "processors"
redis-cli XREADGROUP GROUP processors worker1 COUNT 1 STREAMS orders >
```

**Block waiting for messages:**
```bash
# Wait up to 5 seconds for new messages
redis-cli XREADGROUP GROUP processors worker1 BLOCK 5000 COUNT 1 STREAMS orders >
```

**Read pending messages:**
```bash
# Get messages this consumer hasn't acknowledged
redis-cli XREADGROUP GROUP processors worker1 STREAMS orders 0
```

### Hands-On Example

**Setup:**
```bash
# Create stream with messages
redis-cli XADD tasks * task "process-order-1"
redis-cli XADD tasks * task "process-order-2"
redis-cli XADD tasks * task "process-order-3"

# Create consumer group from beginning
redis-cli XGROUP CREATE tasks workers 0
```

**Consumer 1:**
```bash
redis-cli XREADGROUP GROUP workers worker1 COUNT 1 STREAMS tasks >
# Returns: task "process-order-1"
```

**Consumer 2:**
```bash
redis-cli XREADGROUP GROUP workers worker2 COUNT 1 STREAMS tasks >
# Returns: task "process-order-2"
```

**Consumer 1 again:**
```bash
redis-cli XREADGROUP GROUP workers worker1 COUNT 1 STREAMS tasks >
# Returns: task "process-order-3"
```

Each consumer gets different messages!

## Acknowledgments

### XACK - Acknowledge Messages

Signal successful processing:

```bash
XACK stream_name group_name ID [ID ...]
```

**Example:**
```bash
# Acknowledge single message
redis-cli XACK tasks workers 1637012345678-0

# Acknowledge multiple messages
redis-cli XACK tasks workers 1637012345678-0 1637012345679-0
```

### Importance of Acknowledgments

**Without XACK:**
- Message stays in Pending Entries List (PEL)
- Consumer appears to be processing
- Message can't be reassigned
- Memory accumulates

**With XACK:**
- Message removed from PEL
- Consumer freed for next message
- Proper progress tracking
- Clean failure recovery

### NOACK Option

Auto-acknowledge messages (use with caution):

```bash
redis-cli XREADGROUP GROUP processors worker1 NOACK STREAMS orders >
```

**When to use NOACK:**
- Messages can be lost without consequences
- Performance critical
- Fire-and-forget processing

**When NOT to use:**
- Messages must not be lost
- Need failure recovery
- Tracking is important

## Pending Entries

### XPENDING - Check Pending Messages

View pending entries list:

```bash
# Summary of pending messages
XPENDING stream_name group_name

# Detailed pending info
XPENDING stream_name group_name [IDLE min_idle_time] [start end count] [consumer_name]
```

### Examples

**Get summary:**
```bash
redis-cli XPENDING tasks workers
# 1) (integer) 3              # Total pending
# 2) "1637012345678-0"         # Smallest ID
# 3) "1637012345680-0"         # Largest ID
# 4) 1) 1) "worker1"           # Consumer name
#       2) "2"                 # Pending count
#    2) 1) "worker2"
#       2) "1"
```

**Get detailed info:**
```bash
redis-cli XPENDING tasks workers - + 10
# 1) 1) "1637012345678-0"      # Message ID
#    2) "worker1"              # Consumer
#    3) (integer) 30000        # Idle time (ms)
#    4) (integer) 1            # Delivery count
```

**Get pending for specific consumer:**
```bash
redis-cli XPENDING tasks workers - + 10 worker1
```

**Get idle messages:**
```bash
# Messages idle for more than 60 seconds
redis-cli XPENDING tasks workers IDLE 60000 - + 10
```

### Monitoring Pending Messages

Create `check_pending.py`:

```python
#!/usr/bin/env python3
import redis

def check_pending(r, stream_name, group_name):
    """Check pending messages for a consumer group."""
    pending = r.xpending(stream_name, group_name)

    print(f"Pending Messages for '{group_name}':")
    print(f"  Total: {pending['pending']}")

    if pending['pending'] > 0:
        print(f"  Range: {pending['min']} to {pending['max']}")
        print(f"\n  By Consumer:")
        for consumer_info in pending['consumers']:
            consumer_name = consumer_info['name']
            count = consumer_info['pending']
            print(f"    {consumer_name}: {count} messages")

        # Get detailed info
        print(f"\n  Details:")
        details = r.xpending_range(stream_name, group_name, '-', '+', count=10)
        for msg in details:
            print(f"    ID: {msg['message_id']}")
            print(f"      Consumer: {msg['consumer']}")
            print(f"      Idle: {msg['time_since_delivered']}ms")
            print(f"      Deliveries: {msg['times_delivered']}")

def main():
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    check_pending(r, 'tasks', 'workers')

if __name__ == "__main__":
    main()
```

## Claiming Messages

### XCLAIM - Take Ownership

Claim messages from idle/failed consumers:

```bash
XCLAIM stream_name group_name consumer_name min_idle_time ID [ID ...]
       [IDLE ms] [TIME ms] [RETRYCOUNT count] [FORCE] [JUSTID]
```

**Parameters:**
- `min_idle_time`: Minimum idle time (ms) to claim
- `consumer_name`: New owner
- `ID`: Message IDs to claim

### When to Claim

**Reasons:**
- Consumer crashed
- Consumer is slow
- Rebalancing load
- Manual intervention

### Examples

**Claim idle messages:**
```bash
# Claim messages idle for more than 60 seconds
redis-cli XCLAIM tasks workers worker2 60000 1637012345678-0
```

**Force claim:**
```bash
# Claim regardless of idle time
redis-cli XCLAIM tasks workers worker2 0 1637012345678-0 FORCE
```

**Claim multiple:**
```bash
redis-cli XCLAIM tasks workers worker2 60000 1637012345678-0 1637012345679-0
```

### XAUTOCLAIM

Automatic claiming (Redis 6.2+):

```bash
XAUTOCLAIM stream_name group_name consumer_name min_idle_time start [COUNT count]
```

**Example:**
```bash
# Automatically claim up to 10 messages idle for 60+ seconds
redis-cli XAUTOCLAIM tasks workers worker2 60000 0 COUNT 10
```

## Python Implementation

### Basic Consumer

Create `consumer.py`:

```python
#!/usr/bin/env python3
import redis
import time
import signal
import sys
import json

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

def setup_consumer_group(r, stream_name, group_name):
    """Create consumer group if it doesn't exist."""
    try:
        r.xgroup_create(stream_name, group_name, id='0', mkstream=True)
        print(f"Created consumer group '{group_name}'")
    except redis.ResponseError as e:
        if 'BUSYGROUP' in str(e):
            print(f"Consumer group '{group_name}' already exists")
        else:
            raise

def process_message(message_id, fields):
    """Process a message (simulate work)."""
    print(f"\n{'='*60}")
    print(f"Processing message: {message_id}")
    print(f"Fields: {fields}")

    # Simulate processing time
    time.sleep(1)

    # Try to parse JSON data
    if 'data' in fields:
        try:
            data = json.loads(fields['data'])
            print(f"Parsed data: {data}")
        except json.JSONDecodeError:
            pass

    print(f"Completed processing: {message_id}")
    print('='*60)
    return True

def consume_messages(r, stream_name, group_name, consumer_name):
    """Consume messages from stream as part of group."""
    print(f"Consumer '{consumer_name}' starting...")
    print(f"Stream: {stream_name}, Group: {group_name}\n")

    global running
    while running:
        try:
            # Read messages (block for 1 second)
            messages = r.xreadgroup(
                groupname=group_name,
                consumername=consumer_name,
                streams={stream_name: '>'},
                count=1,
                block=1000
            )

            if not messages:
                continue

            for stream, entries in messages:
                for message_id, fields in entries:
                    # Process message
                    success = process_message(message_id, fields)

                    if success:
                        # Acknowledge message
                        r.xack(stream_name, group_name, message_id)
                        print(f"✓ Acknowledged: {message_id}\n")
                    else:
                        print(f"✗ Failed to process: {message_id}\n")

        except redis.RedisError as e:
            print(f"Redis error: {e}")
            time.sleep(1)
        except Exception as e:
            print(f"Processing error: {e}")
            time.sleep(1)

def main():
    signal.signal(signal.SIGINT, signal_handler)

    if len(sys.argv) < 4:
        print("Usage: python consumer.py <stream> <group> <consumer_name>")
        sys.exit(1)

    stream_name = sys.argv[1]
    group_name = sys.argv[2]
    consumer_name = sys.argv[3]

    r = create_redis_client()

    try:
        r.ping()
        print("Connected to Redis\n")
    except redis.ConnectionError:
        print("Failed to connect to Redis")
        return

    # Setup consumer group
    setup_consumer_group(r, stream_name, group_name)

    # Start consuming
    consume_messages(r, stream_name, group_name, consumer_name)

    print(f"Consumer '{consumer_name}' stopped")

if __name__ == "__main__":
    main()
```

### Producer for Testing

Create `producer.py`:

```python
#!/usr/bin/env python3
import redis
import json
import time
from datetime import datetime

def create_redis_client():
    return redis.Redis(
        host='localhost',
        port=6379,
        decode_responses=True
    )

def publish_task(r, stream_name, task_type, data):
    """Publish task to stream."""
    message = {
        'task_type': task_type,
        'data': json.dumps(data),
        'timestamp': datetime.now().isoformat()
    }

    message_id = r.xadd(stream_name, message)
    print(f"Published task {message_id}: {task_type}")
    return message_id

def main():
    r = create_redis_client()

    stream_name = 'tasks'

    print(f"Publishing tasks to stream '{stream_name}'...\n")

    # Publish various tasks
    tasks = [
        ('process_order', {'order_id': 101, 'amount': 99.99}),
        ('send_email', {'to': 'user@example.com', 'subject': 'Welcome'}),
        ('generate_report', {'report_type': 'monthly', 'month': 11}),
        ('process_payment', {'payment_id': 202, 'amount': 49.99}),
        ('update_inventory', {'product_id': 303, 'quantity': -5}),
        ('send_notification', {'user_id': 404, 'message': 'Order shipped'}),
        ('backup_database', {'database': 'production'}),
        ('cleanup_temp', {'older_than_days': 7}),
    ]

    for task_type, data in tasks:
        publish_task(r, stream_name, task_type, data)
        time.sleep(0.5)

    print("\nPublishing complete!")
    print(f"Stream length: {r.xlen(stream_name)}")

if __name__ == "__main__":
    main()
```

### Run the Examples

**Terminal 1 - Producer:**
```bash
python producer.py
```

**Terminal 2 - Consumer 1:**
```bash
python consumer.py tasks workers consumer1
```

**Terminal 3 - Consumer 2:**
```bash
python consumer.py tasks workers consumer2
```

**Terminal 4 - Consumer 3:**
```bash
python consumer.py tasks workers consumer3
```

You'll see tasks distributed among the three consumers!

## Multiple Consumers

### Load Balancing Example

Create `load_balancer.py`:

```python
#!/usr/bin/env python3
import redis
import multiprocessing
import time
import signal

def consumer_worker(consumer_id, stream_name, group_name):
    """Individual consumer process."""
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    consumer_name = f"worker-{consumer_id}"

    print(f"[{consumer_name}] Starting...")

    while True:
        try:
            messages = r.xreadgroup(
                groupname=group_name,
                consumername=consumer_name,
                streams={stream_name: '>'},
                count=1,
                block=1000
            )

            if messages:
                for stream, entries in messages:
                    for msg_id, fields in entries:
                        print(f"[{consumer_name}] Processing {msg_id}: {fields}")
                        time.sleep(0.5)  # Simulate work
                        r.xack(stream_name, group_name, msg_id)
                        print(f"[{consumer_name}] ✓ Done {msg_id}")

        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"[{consumer_name}] Error: {e}")
            time.sleep(1)

    print(f"[{consumer_name}] Stopped")

def main():
    stream_name = 'jobs'
    group_name = 'processors'
    num_consumers = 4

    # Create consumer group
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    try:
        r.xgroup_create(stream_name, group_name, id='$', mkstream=True)
    except redis.ResponseError:
        pass

    # Start multiple consumer processes
    processes = []
    for i in range(num_consumers):
        p = multiprocessing.Process(
            target=consumer_worker,
            args=(i+1, stream_name, group_name)
        )
        p.start()
        processes.append(p)

    print(f"Started {num_consumers} consumers")

    # Wait for Ctrl+C
    try:
        for p in processes:
            p.join()
    except KeyboardInterrupt:
        print("\nTerminating consumers...")
        for p in processes:
            p.terminate()

if __name__ == "__main__":
    main()
```

## Error Handling and Recovery

### Recover Pending Messages

Create `recovery.py`:

```python
#!/usr/bin/env python3
import redis
import time

def recover_pending_messages(r, stream_name, group_name, idle_threshold_ms=60000):
    """Recover messages pending for too long."""
    print(f"Checking for messages idle > {idle_threshold_ms}ms...\n")

    # Get pending messages
    pending = r.xpending_range(
        stream_name,
        group_name,
        '-', '+',
        count=100
    )

    recovered = 0
    for msg in pending:
        msg_id = msg['message_id']
        consumer = msg['consumer']
        idle_time = msg['time_since_delivered']

        if idle_time > idle_threshold_ms:
            print(f"Recovering {msg_id} from {consumer} (idle: {idle_time}ms)")

            # Claim message to recovery consumer
            try:
                r.xclaim(
                    stream_name,
                    group_name,
                    'recovery-worker',
                    idle_threshold_ms,
                    [msg_id]
                )

                # Process and acknowledge
                print(f"  Processing recovered message...")
                time.sleep(0.1)  # Simulate work

                r.xack(stream_name, group_name, msg_id)
                print(f"  ✓ Recovered and acknowledged {msg_id}")

                recovered += 1
            except Exception as e:
                print(f"  ✗ Failed to recover {msg_id}: {e}")

    print(f"\nRecovered {recovered} messages")
    return recovered

def main():
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)

    stream_name = 'tasks'
    group_name = 'workers'

    # Run recovery continuously
    while True:
        recovered = recover_pending_messages(r, stream_name, group_name)
        if recovered == 0:
            print("No messages to recover")
        time.sleep(10)

if __name__ == "__main__":
    main()
```

### Dead Letter Queue Pattern

Create `dlq_handler.py`:

```python
#!/usr/bin/env python3
import redis
import json

def move_to_dlq(r, stream_name, group_name, max_deliveries=3):
    """Move repeatedly failed messages to dead letter queue."""
    dlq_stream = f"{stream_name}:dlq"

    pending = r.xpending_range(stream_name, group_name, '-', '+', count=100)

    moved = 0
    for msg in pending:
        msg_id = msg['message_id']
        deliveries = msg['times_delivered']

        if deliveries >= max_deliveries:
            # Read original message
            messages = r.xrange(stream_name, msg_id, msg_id)
            if messages:
                _, fields = messages[0]

                # Add to DLQ with metadata
                dlq_entry = {
                    **fields,
                    'original_id': msg_id,
                    'original_stream': stream_name,
                    'delivery_count': str(deliveries),
                    'reason': 'max_deliveries_exceeded'
                }

                r.xadd(dlq_stream, dlq_entry)
                r.xack(stream_name, group_name, msg_id)

                print(f"Moved {msg_id} to DLQ (deliveries: {deliveries})")
                moved += 1

    return moved

def main():
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    moved = move_to_dlq(r, 'tasks', 'workers', max_deliveries=3)
    print(f"Moved {moved} messages to DLQ")

if __name__ == "__main__":
    main()
```

## Best Practices

### 1. Consumer Naming

```python
# Include hostname and process ID for uniqueness
import socket
import os

consumer_name = f"{socket.gethostname()}-{os.getpid()}"
```

### 2. Graceful Shutdown

```python
import signal

def graceful_shutdown(signum, frame):
    global running
    running = False
    print("Finishing current message before shutdown...")

signal.signal(signal.SIGTERM, graceful_shutdown)
signal.signal(signal.SIGINT, graceful_shutdown)
```

### 3. Pending Message Monitoring

```python
def monitor_pending(r, stream_name, group_name, threshold=100):
    """Alert if pending messages exceed threshold."""
    pending = r.xpending(stream_name, group_name)
    count = pending['pending']

    if count > threshold:
        print(f"WARNING: {count} pending messages (threshold: {threshold})")
        # Send alert to monitoring system
```

### 4. Idempotent Processing

```python
def process_message_idempotent(r, msg_id, fields):
    """Process message with idempotency check."""
    # Use message ID as idempotency key
    key = f"processed:{msg_id}"

    # Check if already processed
    if r.exists(key):
        print(f"Message {msg_id} already processed, skipping")
        return True

    # Process message
    result = do_work(fields)

    # Mark as processed (expires in 24 hours)
    r.setex(key, 86400, '1')

    return result
```

### 5. Batch Processing

```python
# Read multiple messages at once
messages = r.xreadgroup(
    groupname='workers',
    consumername='worker1',
    streams={'tasks': '>'},
    count=10  # Process in batches of 10
)

# Batch acknowledge
message_ids = [msg_id for _, entries in messages for msg_id, _ in entries]
if message_ids:
    r.xack('tasks', 'workers', *message_ids)
```

## Summary

In this tutorial, you learned:

1. Consumer group architecture and benefits
2. Creating groups with XGROUP CREATE
3. Reading messages with XREADGROUP
4. Acknowledging messages with XACK
5. Tracking pending entries with XPENDING
6. Claiming messages with XCLAIM/XAUTOCLAIM
7. Python implementation with redis-py
8. Multiple consumer load balancing
9. Error handling and recovery patterns
10. Production best practices

**Key Takeaways:**
- Consumer groups enable distributed message processing
- Messages are delivered to only one consumer per group
- Acknowledgments are critical for reliability
- Pending entries tracking enables failure recovery
- Message claiming handles consumer failures
- Multiple groups can process the same stream independently

**Next Steps:**
- [Tutorial 05: Combining with Redis Data Structures](../05_data_structures/README.md) for advanced patterns
- [Tutorial 06: Persistence and Reliability](../06_persistence/README.md) for production durability
