# Tutorial 04: JetStream - Persistence and Guaranteed Delivery

## Overview

JetStream is NATS's distributed persistence layer that provides at-least-once and exactly-once delivery semantics, message replay, and durable storage. Unlike Core NATS's fire-and-forget model, JetStream stores messages in streams and allows consumers to process them at their own pace with acknowledgments.

JetStream transforms NATS from a pure messaging system into a complete event streaming platform while maintaining NATS's simplicity and performance.

## Learning Objectives

- Enable and configure JetStream
- Create and manage streams
- Understand stream retention policies
- Implement push and pull consumers
- Handle message acknowledgment and replay
- Configure delivery guarantees (at-least-once, exactly-once)
- Monitor JetStream metrics
- Design stream architectures

## Prerequisites

- Completed Tutorials 01-03
- Docker and Docker Compose
- Python 3.8+ with nats-py
- Basic understanding of event streaming concepts

## Core NATS vs JetStream

| Feature | Core NATS | JetStream |
|---------|-----------|-----------|
| **Delivery** | At-most-once | At-least-once / Exactly-once |
| **Storage** | In-memory only | Persistent (file/memory) |
| **Replay** | No | Yes |
| **Acknowledgment** | None | Required |
| **Message Retention** | Until delivered | Configurable (limits, age, interest) |
| **Consumer Types** | Subscription only | Push, Pull, Ordered |
| **Performance** | <1ms | 1-5ms |

## Architecture

```
┌──────────────┐
│  Publisher   │
└──────┬───────┘
       │ publish
       ▼
┌─────────────────────────────────────┐
│      JetStream Stream (Durable)     │
│  ┌───────────────────────────────┐  │
│  │ [1][2][3][4][5][6][7][8][9]   │  │
│  │    Message Log (Persistent)   │  │
│  └───────────────────────────────┘  │
│                                     │
│  Retention: Limits, Age, Interest   │
│  Subjects: orders.*, events.>       │
└─────────────────────────────────────┘
       │
       ├─────────────┬─────────────┐
       ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│Consumer 1│  │Consumer 2│  │Consumer 3│
│  (Push)  │  │  (Pull)  │  │(Ordered) │
└──────────┘  └──────────┘  └──────────┘
   ACK           ACK           ACK
```

## Step 1: Start NATS with JetStream

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  nats:
    image: nats:2.10-alpine
    container_name: nats-jetstream
    ports:
      - "4222:4222"    # Client port
      - "8222:8222"    # HTTP monitoring
      - "6222:6222"    # Cluster routing
    command:
      - "--name=nats-js"
      - "--jetstream"              # Enable JetStream
      - "--store_dir=/data"        # Data directory
      - "--max_memory_store=1GB"   # Memory limit
      - "--max_file_store=10GB"    # File storage limit
      - "--http_port=8222"
      - "-V"
    volumes:
      - nats-data:/data
    restart: unless-stopped
    networks:
      - nats-network

volumes:
  nats-data:
    driver: local

networks:
  nats-network:
    driver: bridge
```

Start the server:

```bash
docker-compose up -d

# Verify JetStream is enabled
curl -s http://localhost:8222/jsz | jq

# Should show JetStream statistics
```

## Step 2: Create Your First Stream

### Using NATS CLI

```bash
# Install NATS CLI
brew install nats-io/nats-tools/nats  # macOS
# OR
curl -sf https://binaries.nats.dev/nats-io/natscli/nats@latest | sh

# Create stream
nats stream add ORDERS \
  --subjects "orders.*" \
  --storage file \
  --retention limits \
  --max-msgs 10000 \
  --max-age 24h \
  --max-bytes 1GB \
  --replicas 1

# View stream info
nats stream info ORDERS

# List all streams
nats stream list
```

### Using Python

Create `create_stream.py`:

```python
import asyncio
import nats
from nats.js.api import StreamConfig, RetentionPolicy, StorageType

async def main():
    nc = await nats.connect("nats://localhost:4222")

    # Access JetStream context
    js = nc.jetstream()

    # Create stream configuration
    stream_config = StreamConfig(
        name="ORDERS",
        subjects=["orders.*"],
        retention=RetentionPolicy.LIMITS,  # Limits-based retention
        storage=StorageType.FILE,          # File storage
        max_msgs=10000,                    # Max messages
        max_bytes=1024 * 1024 * 100,       # 100MB max
        max_age=86400,                      # 24 hours in seconds
        max_msg_size=1024 * 1024,          # 1MB per message
        num_replicas=1,                     # Single replica (for now)
    )

    # Create or update stream
    try:
        await js.add_stream(stream_config)
        print("✓ Stream 'ORDERS' created successfully")
    except Exception as e:
        print(f"Error creating stream: {e}")

    # Get stream info
    stream_info = await js.stream_info("ORDERS")
    print(f"\nStream Info:")
    print(f"  Name: {stream_info.config.name}")
    print(f"  Subjects: {stream_info.config.subjects}")
    print(f"  Storage: {stream_info.config.storage}")
    print(f"  Messages: {stream_info.state.messages}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 3: Publishing to JetStream

Create `js_publisher.py`:

```python
import asyncio
import nats
import json
from datetime import datetime

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    print("Publishing to JetStream stream 'ORDERS'...")

    for i in range(1, 11):
        order = {
            "order_id": f"ORD-{i:05d}",
            "customer": f"Customer-{i}",
            "amount": 100.0 * i,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Publish and get acknowledgment
        ack = await js.publish(
            "orders.created",
            json.dumps(order).encode()
        )

        print(f"Published {order['order_id']}")
        print(f"  Stream: {ack.stream}")
        print(f"  Sequence: {ack.seq}")
        print(f"  Duplicate: {ack.duplicate}\n")

        await asyncio.sleep(0.5)

    await nc.close()

    print("All messages published and acknowledged!")

if __name__ == '__main__':
    asyncio.run(main())
```

Run it:

```bash
python js_publisher.py

# Check stream messages
nats stream info ORDERS
```

## Step 4: Pull Consumer

Pull consumers fetch messages on demand, giving consumers full control over message processing rate.

Create `pull_consumer.py`:

```python
import asyncio
import nats
import json

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    # Create pull-based consumer
    consumer_config = {
        "durable_name": "orders-processor",
        "ack_policy": "explicit",  # Explicit acknowledgment
        "max_deliver": 3,          # Max redelivery attempts
        "ack_wait": 30,            # 30 seconds to ack
    }

    # Subscribe as pull consumer
    psub = await js.pull_subscribe(
        "orders.*",
        "orders-processor",
        config=consumer_config
    )

    print("Pull Consumer started - 'orders-processor'")
    print("Fetching messages...\n")

    processed = 0

    while processed < 10:  # Process 10 messages
        try:
            # Fetch up to 5 messages
            messages = await psub.fetch(batch=5, timeout=5)

            for msg in messages:
                # Process message
                data = json.loads(msg.data.decode())
                print(f"Processing: {data['order_id']}")
                print(f"  Metadata: Stream={msg.metadata.stream}, "
                      f"Seq={msg.metadata.sequence.stream}")

                # Simulate processing
                await asyncio.sleep(0.5)

                # Acknowledge message
                await msg.ack()
                print(f"  ✓ Acknowledged\n")

                processed += 1

        except asyncio.TimeoutError:
            print("No messages available, waiting...\n")
        except Exception as e:
            print(f"Error: {e}")
            break

    await nc.close()

    print(f"Processed {processed} messages")

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 5: Push Consumer

Push consumers receive messages automatically as they arrive.

Create `push_consumer.py`:

```python
import asyncio
import nats
import json

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    print("Push Consumer started")

    processed = 0

    async def message_handler(msg):
        nonlocal processed

        # Process message
        data = json.loads(msg.data.decode())
        print(f"Received: {data['order_id']}")
        print(f"  Sequence: {msg.metadata.sequence.stream}")
        print(f"  Delivered: {msg.metadata.num_delivered} time(s)")

        # Simulate processing
        await asyncio.sleep(0.5)

        # Acknowledge
        await msg.ack()
        print(f"  ✓ Acknowledged\n")

        processed += 1

    # Subscribe as push consumer
    await js.subscribe(
        "orders.*",
        durable="orders-push-consumer",
        cb=message_handler,
        manual_ack=True  # Manual acknowledgment
    )

    print("Waiting for messages (Ctrl+C to exit)...\n")

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print(f"\nProcessed {processed} messages")
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 6: Message Replay

One of JetStream's killer features: replay messages from the beginning!

Create `replay_consumer.py`:

```python
import asyncio
import nats
from nats.js.api import DeliverPolicy

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    print("Replaying ALL messages from the beginning...\n")

    count = 0

    async def handler(msg):
        nonlocal count
        count += 1
        data = msg.data.decode()
        print(f"[{count}] Seq {msg.metadata.sequence.stream}: {data}")
        await msg.ack()

    # Subscribe with DeliverPolicy.ALL to replay from start
    await js.subscribe(
        "orders.*",
        durable="replay-consumer",
        cb=handler,
        config={
            "deliver_policy": DeliverPolicy.ALL,  # Start from beginning
            "ack_policy": "explicit"
        }
    )

    # Let it run for 10 seconds
    await asyncio.sleep(10)

    await nc.close()

    print(f"\nReplayed {count} messages")

if __name__ == '__main__':
    asyncio.run(main())
```

Other delivery policies:

```python
DeliverPolicy.ALL         # From the beginning
DeliverPolicy.LAST        # Only the last message
DeliverPolicy.NEW         # Only new messages
DeliverPolicy.BY_START_SEQUENCE  # From specific sequence
DeliverPolicy.BY_START_TIME      # From specific time
```

## Step 7: Retention Policies

JetStream supports three retention policies:

### 1. Limits-based (default)

```python
StreamConfig(
    retention=RetentionPolicy.LIMITS,
    max_msgs=1000,      # Max 1000 messages
    max_bytes=1048576,  # Max 1MB
    max_age=3600,       # Max 1 hour
)
# Messages deleted when ANY limit is reached
```

### 2. Interest-based

```python
StreamConfig(
    retention=RetentionPolicy.INTEREST,
)
# Messages deleted when ALL consumers have acknowledged
```

### 3. Work Queue

```python
StreamConfig(
    retention=RetentionPolicy.WORKQUEUE,
)
# Messages deleted as soon as ANY consumer acknowledges
```

Create `retention_demo.py`:

```python
import asyncio
import nats
from nats.js.api import StreamConfig, RetentionPolicy, StorageType

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    # Create work queue stream
    work_queue_config = StreamConfig(
        name="WORKQUEUE",
        subjects=["work.*"],
        retention=RetentionPolicy.WORKQUEUE,
        storage=StorageType.MEMORY,
    )

    try:
        await js.add_stream(work_queue_config)
        print("✓ Created WORKQUEUE stream")
    except:
        print("✓ WORKQUEUE stream already exists")

    # Publish 10 messages
    print("\nPublishing 10 work items...")
    for i in range(1, 11):
        await js.publish("work.task", f"Task {i}".encode())
        print(f"  Published: Task {i}")

    # Check stream
    info = await js.stream_info("WORKQUEUE")
    print(f"\nMessages in stream: {info.state.messages}")

    # Consume messages
    print("\nConsuming messages...")
    psub = await js.pull_subscribe("work.*", "worker")

    messages = await psub.fetch(batch=10, timeout=5)
    for msg in messages:
        print(f"  Received: {msg.data.decode()}")
        await msg.ack()
        print(f"    Acknowledged")

    # Check stream again - should be empty (work queue)
    info = await js.stream_info("WORKQUEUE")
    print(f"\nMessages in stream after consumption: {info.state.messages}")
    print("(Work queue deletes messages after ack)")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 8: Acknowledgment Strategies

Create `ack_strategies.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    # Publish a message
    await js.publish("orders.test", b"Test message")

    # Pull subscribe
    psub = await js.pull_subscribe("orders.test", "ack-demo")
    messages = await psub.fetch(batch=1, timeout=5)
    msg = messages[0]

    print(f"Message: {msg.data.decode()}")
    print(f"Delivered: {msg.metadata.num_delivered} time(s)\n")

    print("Acknowledgment options:")

    # 1. ACK - Message processed successfully
    # await msg.ack()
    print("1. msg.ack() - Success, remove from stream")

    # 2. NAK - Redelivery with delay
    # await msg.nak(delay=5)
    print("2. msg.nak(delay=5) - Failed, redeliver in 5 seconds")

    # 3. TERM - Don't redeliver, mark as terminated
    # await msg.term()
    print("3. msg.term() - Terminate, don't redeliver")

    # 4. IN_PROGRESS - Extend ack wait time
    # await msg.in_progress()
    print("4. msg.in_progress() - Still processing, extend timeout")

    # For demo, just ack
    await msg.ack()

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 9: Exactly-Once Semantics

JetStream can provide exactly-once semantics using message deduplication.

Create `exactly_once_publisher.py`:

```python
import asyncio
import nats
import json
from datetime import datetime
import hashlib

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    print("Publishing with exactly-once semantics...\n")

    # Simulate publishing the same message twice
    for attempt in range(1, 3):
        order = {
            "order_id": "ORD-UNIQUE-001",
            "amount": 500.0,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Use message ID for deduplication
        msg_id = hashlib.sha256(order["order_id"].encode()).hexdigest()[:16]

        print(f"Attempt {attempt}:")
        print(f"  Publishing order: {order['order_id']}")
        print(f"  Message ID: {msg_id}")

        ack = await js.publish(
            "orders.created",
            json.dumps(order).encode(),
            headers={"Nats-Msg-Id": msg_id}  # Deduplication ID
        )

        print(f"  Stream seq: {ack.seq}")
        print(f"  Duplicate: {ack.duplicate}")
        print()

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Run it twice - second attempt will be marked as duplicate!

## Step 10: Monitoring JetStream

### CLI Monitoring

```bash
# Stream info
nats stream info ORDERS

# Consumer info
nats consumer info ORDERS orders-processor

# Account info
nats account info

# Real-time monitoring
watch -n 1 'nats stream info ORDERS | grep -A 5 "State"'
```

### HTTP Monitoring

```bash
# JetStream general stats
curl -s http://localhost:8222/jsz | jq

# Account stats
curl -s http://localhost:8222/jsz?acc=\$G | jq

# Detailed stream stats
curl -s http://localhost:8222/jsz?streams=true | jq
```

### Python Monitoring

Create `js_monitor.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    # List all streams
    streams = await js.streams_info()
    print(f"Total streams: {len(streams)}\n")

    for stream in streams:
        print(f"Stream: {stream.config.name}")
        print(f"  Subjects: {stream.config.subjects}")
        print(f"  Storage: {stream.config.storage}")
        print(f"  Retention: {stream.config.retention}")
        print(f"  Messages: {stream.state.messages}")
        print(f"  Bytes: {stream.state.bytes:,}")
        print(f"  First Seq: {stream.state.first_seq}")
        print(f"  Last Seq: {stream.state.last_seq}")
        print(f"  Consumers: {stream.state.consumer_count}")
        print()

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Common Patterns

### Pattern 1: Event Sourcing

```python
# Store all events in order
stream = StreamConfig(
    name="EVENTS",
    subjects=["events.>"],
    retention=RetentionPolicy.LIMITS,
    max_age=365 * 24 * 3600,  # 1 year
)
```

### Pattern 2: Message Queue

```python
# Work queue pattern
stream = StreamConfig(
    name="JOBS",
    subjects=["jobs.*"],
    retention=RetentionPolicy.WORKQUEUE,
)
```

### Pattern 3: Caching / Last Value

```python
# Keep only last message per subject
stream = StreamConfig(
    name="CACHE",
    subjects=["cache.*"],
    max_msgs_per_subject=1,
)
```

## Best Practices

1. **Stream Design**
   - Use descriptive stream names
   - Plan subject hierarchies carefully
   - Set appropriate retention limits
   - Use file storage for durability

2. **Consumer Design**
   - Use durable consumers in production
   - Set appropriate ack_wait timeouts
   - Handle redeliveries gracefully
   - Monitor consumer lag

3. **Performance**
   - Use batch fetching with pull consumers
   - Tune max_ack_pending for throughput
   - Monitor memory/disk usage
   - Use memory storage for non-critical data

4. **Reliability**
   - Enable message deduplication
   - Use explicit acknowledgments
   - Implement retry logic
   - Monitor redelivery counts

## Troubleshooting

### Stream Not Created
```bash
# Check JetStream is enabled
curl http://localhost:8222/jsz

# Check NATS logs
docker logs nats-jetstream
```

### Messages Not Persisting
- Verify stream storage type is FILE
- Check disk space
- Verify stream limits aren't exceeded

### Consumer Not Receiving Messages
- Check consumer deliver policy
- Verify subject matches stream subjects
- Check if messages exist: `nats stream info STREAMNAME`

## Summary

You've learned:
- ✅ JetStream setup and configuration
- ✅ Stream creation and management
- ✅ Push and pull consumers
- ✅ Message acknowledgment strategies
- ✅ Retention policies (limits, interest, work queue)
- ✅ Message replay and delivery policies
- ✅ Exactly-once semantics
- ✅ Monitoring and debugging

## Next Steps

- **Tutorial 05**: Key-Value Store built on JetStream
- **Tutorial 06**: Object Store for large files
- **Tutorial 07**: JetStream clustering

---

**Estimated Time**: 3-4 hours
**Difficulty**: Intermediate to Advanced
