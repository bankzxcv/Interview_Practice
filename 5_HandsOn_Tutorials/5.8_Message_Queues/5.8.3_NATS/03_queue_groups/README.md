# Tutorial 03: Queue Groups

## Overview

Queue groups in NATS enable load balancing and work distribution across multiple subscribers. Unlike regular pub/sub where every subscriber receives every message, queue groups ensure that only ONE subscriber in the group receives each message. This is essential for horizontal scaling and building fault-tolerant microservices.

## Learning Objectives

- Understand queue group load balancing mechanics
- Implement work distribution patterns
- Scale services horizontally with multiple workers
- Compare queue groups vs regular subscriptions
- Handle worker failures gracefully
- Monitor queue group performance
- Build production-ready worker pools

## Prerequisites

- Completed Tutorial 01 (Basic Pub/Sub)
- Completed Tutorial 02 (Request-Reply)
- NATS server running
- Python 3.8+ with nats-py

## Architecture

### Regular Subscription (Fan-Out)

```
                        ┌─────────────┐
                    ┌──▶│Subscriber 1 │ (receives ALL)
                    │   └─────────────┘
Publisher ──msg────┤   ┌─────────────┐
                    ├──▶│Subscriber 2 │ (receives ALL)
                    │   └─────────────┘
                    │   ┌─────────────┐
                    └──▶│Subscriber 3 │ (receives ALL)
                        └─────────────┘

Result: 3 subscribers = 3 copies of each message
```

### Queue Group (Load Balancing)

```
                        ┌─────────────┐
                    ┌──▶│  Worker 1   │ (receives 1/3)
                    │   └─────────────┘
Publisher ──msg────┤   ┌─────────────┐
  (NATS picks      ├──▶│  Worker 2   │ (receives 1/3)
   one worker)     │   └─────────────┘
                    │   ┌─────────────┐
                    └──▶│  Worker 3   │ (receives 1/3)
                        └─────────────┘
                        Queue Group: "workers"

Result: 3 workers = each message goes to ONE worker
```

## Step 1: Basic Queue Group

Create `worker.py`:

```python
import asyncio
import nats
import sys
import json
from datetime import datetime

async def main():
    worker_id = sys.argv[1] if len(sys.argv) > 1 else "1"

    nc = await nats.connect("nats://localhost:4222")

    print(f"[Worker {worker_id}] Started")
    print(f"[Worker {worker_id}] Joined queue group: 'processors'")

    message_count = 0

    async def process_message(msg):
        nonlocal message_count
        message_count += 1

        data = json.loads(msg.data.decode())
        print(f"[Worker {worker_id}] Processing message #{message_count}")
        print(f"  Task ID: {data['task_id']}")
        print(f"  Timestamp: {data['timestamp']}")

        # Simulate work
        await asyncio.sleep(1)

        print(f"[Worker {worker_id}] Completed task {data['task_id']}")

    # Subscribe with queue group name
    await nc.subscribe(
        "tasks.process",
        queue="processors",  # Queue group name
        cb=process_message
    )

    print(f"[Worker {worker_id}] Waiting for tasks...\n")

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print(f"\n[Worker {worker_id}] Shutting down...")
        print(f"[Worker {worker_id}] Processed {message_count} messages")
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Create `task_publisher.py`:

```python
import asyncio
import nats
import json
from datetime import datetime

async def main():
    nc = await nats.connect("nats://localhost:4222")

    print("Publishing 20 tasks to queue group...")

    for i in range(1, 21):
        task = {
            "task_id": f"TASK-{i:03d}",
            "timestamp": datetime.utcnow().isoformat(),
            "data": f"Process this task"
        }

        await nc.publish(
            "tasks.process",
            json.dumps(task).encode()
        )

        print(f"Published: {task['task_id']}")
        await asyncio.sleep(0.2)

    await nc.flush()
    await nc.close()

    print("\nAll tasks published!")

if __name__ == '__main__':
    asyncio.run(main())
```

Test it:

```bash
# Terminal 1 - Worker 1
python worker.py 1

# Terminal 2 - Worker 2
python worker.py 2

# Terminal 3 - Worker 3
python worker.py 3

# Terminal 4 - Publish tasks
python task_publisher.py
```

You'll see tasks distributed evenly across workers!

## Step 2: Queue Groups vs Regular Subscriptions

Create `comparison_demo.py` to see the difference:

```python
import asyncio
import nats

async def regular_subscriber(subscriber_id):
    """Regular subscriber - receives ALL messages"""
    nc = await nats.connect("nats://localhost:4222")

    count = 0

    async def handler(msg):
        nonlocal count
        count += 1
        print(f"[Regular Sub {subscriber_id}] Message #{count}: {msg.data.decode()}")

    await nc.subscribe("demo.topic", cb=handler)
    print(f"[Regular Sub {subscriber_id}] Started (no queue group)")

    await asyncio.Future()

async def queue_subscriber(subscriber_id):
    """Queue subscriber - receives SOME messages"""
    nc = await nats.connect("nats://localhost:4222")

    count = 0

    async def handler(msg):
        nonlocal count
        count += 1
        print(f"[Queue Sub {subscriber_id}] Message #{count}: {msg.data.decode()}")

    await nc.subscribe("demo.topic", queue="workers", cb=handler)
    print(f"[Queue Sub {subscriber_id}] Started (queue: workers)")

    await asyncio.Future()

async def main():
    mode = input("Choose mode (1=Regular, 2=Queue): ")

    if mode == "1":
        # Start 3 regular subscribers
        print("\nStarting 3 REGULAR subscribers...\n")
        await asyncio.gather(
            regular_subscriber("A"),
            regular_subscriber("B"),
            regular_subscriber("C")
        )
    else:
        # Start 3 queue subscribers
        print("\nStarting 3 QUEUE subscribers...\n")
        await asyncio.gather(
            queue_subscriber("A"),
            queue_subscriber("B"),
            queue_subscriber("C")
        )

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutdown complete")
```

Publish messages to test:

```bash
# Terminal 1
python comparison_demo.py
# Choose 1 for regular, 2 for queue

# Terminal 2 - Publish 10 messages
for i in {1..10}; do nats pub demo.topic "Message $i"; sleep 0.5; done
```

## Step 3: Horizontal Scaling Demo

Create `scalable_processor.py`:

```python
import asyncio
import nats
import json
import time
from datetime import datetime

async def main():
    import sys
    worker_id = sys.argv[1] if len(sys.argv) > 1 else "1"
    processing_time = float(sys.argv[2]) if len(sys.argv) > 2 else 2.0

    nc = await nats.connect("nats://localhost:4222")

    print(f"[Worker {worker_id}] Started")
    print(f"[Worker {worker_id}] Processing time: {processing_time}s per task")

    stats = {"processed": 0, "total_time": 0}

    async def process_task(msg):
        start = time.time()
        data = json.loads(msg.data.decode())

        print(f"[Worker {worker_id}] Processing {data['task_id']}...")

        # Simulate CPU-intensive work
        await asyncio.sleep(processing_time)

        elapsed = time.time() - start
        stats["processed"] += 1
        stats["total_time"] += elapsed

        avg_time = stats["total_time"] / stats["processed"]
        print(f"[Worker {worker_id}] ✓ {data['task_id']} done in {elapsed:.2f}s "
              f"(avg: {avg_time:.2f}s, total: {stats['processed']})")

    await nc.subscribe("tasks.heavy", queue="heavy-workers", cb=process_task)

    print(f"[Worker {worker_id}] Ready for tasks\n")

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print(f"\n[Worker {worker_id}] Stats:")
        print(f"  Processed: {stats['processed']}")
        print(f"  Avg time: {stats['total_time']/max(stats['processed'], 1):.2f}s")
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Create `load_generator.py`:

```python
import asyncio
import nats
import json
import time
from datetime import datetime

async def main():
    nc = await nats.connect("nats://localhost:4222")

    task_count = 50
    print(f"Generating {task_count} heavy tasks...")

    start_time = time.time()

    for i in range(1, task_count + 1):
        task = {
            "task_id": f"HEAVY-{i:03d}",
            "timestamp": datetime.utcnow().isoformat()
        }

        await nc.publish("tasks.heavy", json.dumps(task).encode())

        if i % 10 == 0:
            print(f"Published {i}/{task_count} tasks...")

    await nc.flush()

    total_time = time.time() - start_time
    print(f"\nAll tasks published in {total_time:.2f}s")
    print(f"Rate: {task_count/total_time:.1f} tasks/sec")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Test scaling:

```bash
# Test 1: Single worker (slow)
# Terminal 1
python scalable_processor.py 1 2.0

# Terminal 2
python load_generator.py
# Note the completion time

# Test 2: Five workers (faster)
# Start 5 workers in different terminals
python scalable_processor.py 1 2.0
python scalable_processor.py 2 2.0
python scalable_processor.py 3 2.0
python scalable_processor.py 4 2.0
python scalable_processor.py 5 2.0

# Run load generator again - tasks complete 5x faster!
python load_generator.py
```

## Step 4: Worker Failure and Recovery

Create `resilient_worker.py`:

```python
import asyncio
import nats
import json
import random

async def main():
    import sys
    worker_id = sys.argv[1] if len(sys.argv) > 1 else "1"
    failure_rate = 0.2  # 20% chance of simulated failure

    nc = await nats.connect("nats://localhost:4222")

    stats = {"success": 0, "failed": 0}

    async def process_with_failures(msg):
        data = json.loads(msg.data.decode())

        # Simulate random failures
        if random.random() < failure_rate:
            stats["failed"] += 1
            print(f"[Worker {worker_id}] ✗ Failed processing {data['task_id']} "
                  f"(failures: {stats['failed']})")
            # In production, you'd publish to a dead letter queue
            return

        # Successful processing
        await asyncio.sleep(0.5)
        stats["success"] += 1
        print(f"[Worker {worker_id}] ✓ Completed {data['task_id']} "
              f"(success: {stats['success']})")

    await nc.subscribe("tasks.risky", queue="risky-workers", cb=process_with_failures)

    print(f"[Worker {worker_id}] Started (failure rate: {failure_rate*100}%)\n")

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print(f"\n[Worker {worker_id}] Final Stats:")
        print(f"  Success: {stats['success']}")
        print(f"  Failed: {stats['failed']}")
        total = stats['success'] + stats['failed']
        if total > 0:
            print(f"  Success rate: {stats['success']/total*100:.1f}%")
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 5: Mixed Subscriptions

You can combine regular and queue subscriptions on the same subject!

Create `mixed_subscriptions.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")

    # Regular subscriber - gets ALL messages
    async def logger(msg):
        print(f"[LOGGER] Logged: {msg.data.decode()}")

    # Queue subscriber 1 - gets SOME messages
    async def worker1(msg):
        print(f"[WORKER-1] Processing: {msg.data.decode()}")

    # Queue subscriber 2 - gets SOME messages
    async def worker2(msg):
        print(f"[WORKER-2] Processing: {msg.data.decode()}")

    # Regular subscription (no queue) - receives ALL
    await nc.subscribe("events.order", cb=logger)

    # Queue subscriptions - each receives subset
    await nc.subscribe("events.order", queue="processors", cb=worker1)
    await nc.subscribe("events.order", queue="processors", cb=worker2)

    print("Setup:")
    print("  1 Logger (regular) - receives ALL messages")
    print("  2 Workers (queue 'processors') - each receives SOME messages")
    print("\nWaiting for messages...\n")

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print("\nShutdown")
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Test it:

```bash
# Terminal 1
python mixed_subscriptions.py

# Terminal 2 - Send 10 messages
for i in {1..10}; do
    nats pub events.order "Order-$i"
    sleep 0.5
done
```

You'll see:
- Logger receives ALL 10 messages
- Worker-1 and Worker-2 split the 10 messages between them

## Step 6: Monitoring Queue Groups

Create `queue_monitor.py`:

```python
import asyncio
import aiohttp
import json

async def monitor_queue_groups():
    """Monitor NATS queue groups via HTTP monitoring endpoint"""

    while True:
        try:
            async with aiohttp.ClientSession() as session:
                # Get subscription details
                async with session.get('http://localhost:8222/subsz') as resp:
                    if resp.status == 200:
                        data = await resp.json()

                        print("\n" + "="*60)
                        print("NATS Queue Groups Status")
                        print("="*60)

                        if 'subscriptions' in data:
                            queue_groups = {}

                            for sub in data['subscriptions']:
                                subject = sub.get('subject', '')
                                queue = sub.get('queue', None)

                                if queue:
                                    if queue not in queue_groups:
                                        queue_groups[queue] = []
                                    queue_groups[queue].append(subject)

                            if queue_groups:
                                for queue_name, subjects in queue_groups.items():
                                    print(f"\nQueue Group: {queue_name}")
                                    print(f"  Subjects: {', '.join(set(subjects))}")
                                    print(f"  Workers: {len(subjects)}")
                            else:
                                print("\nNo active queue groups")

                        print("\n" + "="*60)

        except Exception as e:
            print(f"Error: {e}")

        await asyncio.sleep(5)  # Update every 5 seconds

if __name__ == '__main__':
    print("Starting NATS Queue Group Monitor...")
    print("(Make sure NATS server is running on localhost:8222)")

    try:
        asyncio.run(monitor_queue_groups())
    except KeyboardInterrupt:
        print("\nMonitor stopped")
```

## Use Cases for Queue Groups

### 1. Background Job Processing

```python
# Job queue with multiple workers
await nc.subscribe("jobs.email", queue="email-workers", cb=send_email)
await nc.subscribe("jobs.email", queue="email-workers", cb=send_email)
await nc.subscribe("jobs.email", queue="email-workers", cb=send_email)

# Each email job goes to ONE worker
```

### 2. Load Balanced Microservices

```python
# API services with automatic load balancing
await nc.subscribe("api.users.get", queue="user-service", cb=get_user)

# Multiple instances share the load
```

### 3. Stream Processing Pipeline

```python
# Stage 1: Data ingestion (queue group)
await nc.subscribe("data.raw", queue="ingest", cb=ingest_data)

# Stage 2: Processing (queue group)
await nc.subscribe("data.processed", queue="transform", cb=transform_data)

# Stage 3: Storage (queue group)
await nc.subscribe("data.final", queue="store", cb=store_data)
```

## Best Practices

1. **Queue Naming**
   - Use descriptive names: `email-workers`, `api-processors`
   - Keep names consistent across deployments
   - Don't change queue names in production

2. **Worker Count**
   - Start with 2-3 workers minimum for HA
   - Scale based on queue depth and latency
   - Monitor CPU/memory per worker

3. **Error Handling**
   - Log all errors with context
   - Implement retry logic
   - Use dead letter queues for failed messages

4. **Monitoring**
   - Track messages processed per worker
   - Monitor processing time
   - Alert on worker failures

## Queue Groups vs Request-Reply

| Feature | Queue Groups | Request-Reply |
|---------|--------------|---------------|
| **Pattern** | Pub/Sub with load balancing | RPC/Sync request |
| **Response** | No automatic response | Response required |
| **Use Case** | Background jobs | API calls |
| **Timeout** | Not applicable | Yes |
| **Load Balance** | Automatic | Automatic |

Both use queue groups under the hood, but request-reply adds response handling.

## Exercises

### Exercise 1: Image Processing Pipeline
Build an image processing system with queue groups:
- Upload service publishes to `images.upload`
- Resize workers (queue: `resize`) process images
- Thumbnail workers (queue: `thumbnail`) create thumbnails
- Storage workers (queue: `storage`) save results

### Exercise 2: Multi-Stage Processing
Create a 3-stage pipeline where each stage uses queue groups and passes results to the next stage. Add monitoring for each stage.

### Exercise 3: Dynamic Scaling
Write a script that starts/stops workers based on queue depth (simulate auto-scaling).

## Troubleshooting

### Uneven Load Distribution
- NATS distributes messages as they arrive
- If workers have different processing times, load may seem uneven
- Use more workers to improve distribution

### Messages Not Being Processed
- Verify queue group name matches exactly
- Check that workers are subscribed before publishing
- Look for worker errors in logs

## Summary

You've learned:
- ✅ Queue group load balancing mechanics
- ✅ Work distribution patterns
- ✅ Horizontal scaling with multiple workers
- ✅ Difference between regular and queue subscriptions
- ✅ Worker failure handling
- ✅ Monitoring queue groups
- ✅ Production-ready patterns

## Next Steps

- **Tutorial 04**: JetStream for guaranteed delivery and persistence
- **Tutorial 05**: Key-Value store for distributed state

---

**Estimated Time**: 2-3 hours
**Difficulty**: Intermediate
