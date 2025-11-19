# Tutorial 05: Combining with Redis Data Structures

Combine Redis Pub/Sub and Streams with Redis data structures for advanced patterns including task queues with Lists, unique events with Sets, priority messaging with Sorted Sets, and structured data with Hashes.

## Table of Contents
- [Introduction](#introduction)
- [Pub/Sub + Lists](#pubsub--lists)
- [Pub/Sub + Sets](#pubsub--sets)
- [Pub/Sub + Sorted Sets](#pubsub--sorted-sets)
- [Pub/Sub + Hashes](#pubsub--hashes)
- [Streams + Data Structures](#streams--data-structures)
- [Hybrid Architectural Patterns](#hybrid-architectural-patterns)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)

## Introduction

While Pub/Sub and Streams are powerful on their own, combining them with Redis data structures (Lists, Sets, Sorted Sets, Hashes) unlocks advanced messaging patterns with additional capabilities like deduplication, priority queuing, and metadata storage.

### Why Combine?

**Enhanced Capabilities:**
- Deduplication with Sets
- Priority ordering with Sorted Sets
- Metadata storage with Hashes
- Reliable queuing with Lists
- Rate limiting and throttling

**Architectural Benefits:**
- Flexible message routing
- Multiple consumption patterns
- Complex workflows
- Better observability

## Pub/Sub + Lists

### Pattern: Reliable Task Queue

Combine Pub/Sub notifications with List-based queuing for reliable task processing.

**Architecture:**
```
Publisher ──PUBLISH──▶ Channel ──▶ Subscriber
    │                                  │
    └──────RPUSH──▶ List ◀──BLPOP──────┘
                     (Backup)
```

### Implementation

Create `pubsub_list_queue.py`:

```python
#!/usr/bin/env python3
import redis
import json
import threading
import time

class PubSubListQueue:
    """Task queue with Pub/Sub notifications + List persistence."""

    def __init__(self, channel_name, list_name):
        self.r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.channel = channel_name
        self.list_name = list_name
        self.pubsub = None

    def publish_task(self, task_data):
        """Publish task via both Pub/Sub and List."""
        task = json.dumps(task_data)

        # Add to list (persistent backup)
        self.r.rpush(self.list_name, task)

        # Publish notification (real-time)
        subscribers = self.r.publish(self.channel, task)

        print(f"Published task: {task_data['id']}")
        print(f"  List length: {self.r.llen(self.list_name)}")
        print(f"  Active subscribers: {subscribers}")

        return task_data['id']

    def consume_tasks_realtime(self, callback):
        """Consume tasks via Pub/Sub (real-time)."""
        self.pubsub = self.r.pubsub()
        self.pubsub.subscribe(self.channel)

        print(f"Listening for real-time tasks on '{self.channel}'")

        for message in self.pubsub.listen():
            if message['type'] == 'message':
                task = json.loads(message['data'])
                callback(task)

    def consume_tasks_reliable(self, callback):
        """Consume tasks via List (reliable, persistent)."""
        print(f"Processing tasks from list '{self.list_name}'")

        while True:
            # BLPOP blocks until a task is available
            result = self.r.blpop(self.list_name, timeout=1)

            if result:
                _, task_json = result
                task = json.loads(task_json)
                callback(task)

    def hybrid_consumer(self, callback):
        """Consume via Pub/Sub with List fallback."""

        def pubsub_listener():
            """Listen to Pub/Sub channel."""
            self.pubsub = self.r.pubsub()
            self.pubsub.subscribe(self.channel)

            for message in self.pubsub.listen():
                if message['type'] == 'message':
                    task = json.loads(message['data'])

                    # Process task
                    callback(task)

                    # Remove from list (if present)
                    self.r.lrem(self.list_name, 1, message['data'])

        # Start Pub/Sub listener in thread
        thread = threading.Thread(target=pubsub_listener, daemon=True)
        thread.start()

        # Also process from list (for missed messages)
        while True:
            result = self.r.blpop(self.list_name, timeout=5)
            if result:
                _, task_json = result
                task = json.loads(task_json)
                print(f"[Fallback] Processing: {task['id']}")
                callback(task)

def process_task(task):
    """Task processor."""
    print(f"Processing task {task['id']}: {task['type']}")
    time.sleep(0.5)

def main():
    queue = PubSubListQueue('tasks:notifications', 'tasks:queue')

    # Producer
    def producer():
        for i in range(10):
            task = {
                'id': f'task-{i+1}',
                'type': 'process_order',
                'data': {'order_id': i+1}
            }
            queue.publish_task(task)
            time.sleep(1)

    # Consumer
    def consumer():
        time.sleep(2)  # Start after some tasks are published
        queue.hybrid_consumer(process_task)

    # Run in threads
    threading.Thread(target=producer, daemon=True).start()
    consumer()

if __name__ == "__main__":
    main()
```

### Use Cases

1. **Task Queue with Notifications**
   - Real-time processing via Pub/Sub
   - Reliable fallback via List
   - No lost tasks

2. **Email Queue**
   - Fast delivery when workers active
   - Queue when workers offline
   - Guaranteed delivery

## Pub/Sub + Sets

### Pattern: Unique Event Deduplication

Use Sets to deduplicate events before processing.

Create `pubsub_set_dedup.py`:

```python
#!/usr/bin/env python3
import redis
import json
import hashlib

class DeduplicatedEventBus:
    """Event bus with automatic deduplication using Sets."""

    def __init__(self, channel_name, seen_set_name, ttl=3600):
        self.r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.channel = channel_name
        self.seen_set = seen_set_name
        self.ttl = ttl

    def publish_event(self, event_data):
        """Publish event only if not seen recently."""
        # Create event fingerprint
        fingerprint = self._fingerprint(event_data)

        # Check if already published
        if self.r.sismember(self.seen_set, fingerprint):
            print(f"⊘ Duplicate event detected: {event_data.get('id', 'unknown')}")
            return None

        # Add to seen set
        self.r.sadd(self.seen_set, fingerprint)

        # Set expiration on the set (sliding window)
        self.r.expire(self.seen_set, self.ttl)

        # Publish event
        event_json = json.dumps(event_data)
        subscribers = self.r.publish(self.channel, event_json)

        print(f"✓ Published unique event: {event_data.get('id', 'unknown')}")
        print(f"  Seen events: {self.r.scard(self.seen_set)}")

        return fingerprint

    def _fingerprint(self, event_data):
        """Create unique fingerprint for event."""
        # Hash based on critical fields
        key_fields = {
            'type': event_data.get('type'),
            'entity_id': event_data.get('entity_id'),
            'action': event_data.get('action')
        }

        fingerprint_str = json.dumps(key_fields, sort_keys=True)
        return hashlib.md5(fingerprint_str.encode()).hexdigest()

    def subscribe(self, callback):
        """Subscribe to unique events."""
        pubsub = self.r.pubsub()
        pubsub.subscribe(self.channel)

        for message in pubsub.listen():
            if message['type'] == 'message':
                event = json.loads(message['data'])
                callback(event)

def main():
    bus = DeduplicatedEventBus('events', 'seen:events', ttl=60)

    # Publish events (including duplicates)
    events = [
        {'id': 1, 'type': 'user', 'entity_id': 'user-123', 'action': 'login'},
        {'id': 2, 'type': 'user', 'entity_id': 'user-456', 'action': 'login'},
        {'id': 3, 'type': 'user', 'entity_id': 'user-123', 'action': 'login'},  # Duplicate!
        {'id': 4, 'type': 'order', 'entity_id': 'order-789', 'action': 'created'},
        {'id': 5, 'type': 'user', 'entity_id': 'user-123', 'action': 'login'},  # Duplicate!
    ]

    for event in events:
        bus.publish_event(event)

if __name__ == "__main__":
    main()
```

### Use Cases

1. **Webhook Deduplication**
   - Prevent duplicate webhook deliveries
   - Handle retries gracefully

2. **Alert Deduplication**
   - Send each alert only once per window
   - Reduce notification spam

3. **Event Sourcing**
   - Ensure event uniqueness
   - Prevent duplicate processing

## Pub/Sub + Sorted Sets

### Pattern: Priority Message Queue

Use Sorted Sets to add priority ordering to messages.

Create `pubsub_priority_queue.py`:

```python
#!/usr/bin/env python3
import redis
import json
import time
import threading

class PriorityMessageQueue:
    """Message queue with priority using Sorted Sets."""

    def __init__(self, channel_name, zset_name):
        self.r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.channel = channel_name
        self.zset = zset_name

    def publish_message(self, message_data, priority=0):
        """
        Publish message with priority.
        Lower priority value = higher priority (processed first)
        """
        message_json = json.dumps(message_data)
        timestamp = time.time()

        # Score: priority (millions) + timestamp (for FIFO within priority)
        score = priority * 1000000 + timestamp

        # Add to sorted set
        self.r.zadd(self.zset, {message_json: score})

        # Publish notification
        notification = {
            'action': 'new_message',
            'priority': priority,
            'message_id': message_data.get('id')
        }
        self.r.publish(self.channel, json.dumps(notification))

        print(f"Published message {message_data.get('id')} with priority {priority}")
        print(f"  Queue size: {self.r.zcard(self.zset)}")

    def consume_by_priority(self, callback):
        """Consume messages in priority order."""
        print(f"Consuming messages by priority from '{self.zset}'")

        while True:
            # Get highest priority message (lowest score)
            messages = self.r.zrange(self.zset, 0, 0)

            if messages:
                message_json = messages[0]
                message = json.loads(message_json)

                # Process message
                callback(message)

                # Remove from sorted set
                self.r.zrem(self.zset, message_json)
            else:
                time.sleep(0.5)

    def hybrid_priority_consumer(self, callback):
        """Listen to notifications + process by priority."""

        def notification_listener():
            """Listen for new message notifications."""
            pubsub = self.r.pubsub()
            pubsub.subscribe(self.channel)

            for msg in pubsub.listen():
                if msg['type'] == 'message':
                    # Just a notification, actual message in sorted set
                    print("New message notification received")

        # Start notification listener
        threading.Thread(target=notification_listener, daemon=True).start()

        # Process from sorted set
        self.consume_by_priority(callback)

    def get_queue_stats(self):
        """Get queue statistics by priority."""
        total = self.r.zcard(self.zset)

        # Count by priority ranges
        priority_ranges = {
            'critical': (0, 999999),
            'high': (1000000, 1999999),
            'normal': (2000000, 2999999),
            'low': (3000000, float('inf'))
        }

        stats = {'total': total}
        for name, (min_score, max_score) in priority_ranges.items():
            count = self.r.zcount(self.zset, min_score, max_score)
            stats[name] = count

        return stats

def process_message(message):
    """Process a message."""
    print(f">>> Processing: {message}")
    time.sleep(0.3)

def main():
    queue = PriorityMessageQueue('priority:notifications', 'priority:queue')

    # Producer
    def producer():
        messages = [
            ({'id': 'msg-1', 'text': 'Normal task'}, 2),          # Normal
            ({'id': 'msg-2', 'text': 'Critical alert!'}, 0),      # Critical
            ({'id': 'msg-3', 'text': 'Low priority task'}, 3),    # Low
            ({'id': 'msg-4', 'text': 'High priority task'}, 1),   # High
            ({'id': 'msg-5', 'text': 'Another critical'}, 0),     # Critical
            ({'id': 'msg-6', 'text': 'Normal task 2'}, 2),        # Normal
        ]

        for message, priority in messages:
            queue.publish_message(message, priority)
            time.sleep(0.5)

        # Show queue stats
        print("\nQueue Statistics:")
        stats = queue.get_queue_stats()
        for priority, count in stats.items():
            print(f"  {priority}: {count}")

    # Consumer
    def consumer():
        time.sleep(3)  # Wait for messages to be published
        queue.consume_by_priority(process_message)

    # Run
    threading.Thread(target=producer, daemon=True).start()
    consumer()

if __name__ == "__main__":
    main()
```

### Use Cases

1. **Alert Processing**
   - Critical alerts first
   - Normal alerts later
   - Low priority notifications last

2. **Task Scheduling**
   - Urgent tasks prioritized
   - Background tasks queued
   - Fair processing within priority

3. **Rate-Limited APIs**
   - Premium requests prioritized
   - Free tier requests queued
   - SLA-based processing

## Pub/Sub + Hashes

### Pattern: Metadata Storage

Use Hashes to store message metadata and state.

Create `pubsub_hash_metadata.py`:

```python
#!/usr/bin/env python3
import redis
import json
import time
from datetime import datetime

class MetadataMessageBus:
    """Message bus with rich metadata stored in Hashes."""

    def __init__(self, channel_name):
        self.r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.channel = channel_name

    def publish_with_metadata(self, message_data):
        """Publish message and store metadata in hash."""
        message_id = f"msg:{int(time.time() * 1000)}"

        # Store metadata in hash
        metadata = {
            'id': message_id,
            'type': message_data.get('type', 'unknown'),
            'timestamp': datetime.now().isoformat(),
            'status': 'published',
            'retry_count': '0',
            'data': json.dumps(message_data)
        }

        self.r.hset(message_id, mapping=metadata)
        self.r.expire(message_id, 3600)  # Expire after 1 hour

        # Publish notification with ID
        notification = {
            'message_id': message_id,
            'type': message_data.get('type')
        }

        self.r.publish(self.channel, json.dumps(notification))
        print(f"Published {message_id}")

        return message_id

    def get_message_metadata(self, message_id):
        """Retrieve message metadata."""
        return self.r.hgetall(message_id)

    def update_status(self, message_id, status):
        """Update message processing status."""
        self.r.hset(message_id, 'status', status)
        self.r.hset(message_id, 'updated_at', datetime.now().isoformat())

    def increment_retry(self, message_id):
        """Increment retry counter."""
        return self.r.hincrby(message_id, 'retry_count', 1)

    def subscribe_with_metadata(self, callback):
        """Subscribe and process with metadata."""
        pubsub = self.r.pubsub()
        pubsub.subscribe(self.channel)

        for message in pubsub.listen():
            if message['type'] == 'message':
                notification = json.loads(message['data'])
                message_id = notification['message_id']

                # Fetch full metadata
                metadata = self.get_message_metadata(message_id)

                if metadata:
                    # Update status to processing
                    self.update_status(message_id, 'processing')

                    # Parse data
                    data = json.loads(metadata['data'])

                    # Process with callback
                    try:
                        callback(message_id, data, metadata)
                        self.update_status(message_id, 'completed')
                    except Exception as e:
                        self.update_status(message_id, 'failed')
                        self.increment_retry(message_id)
                        print(f"Error processing {message_id}: {e}")

    def get_statistics(self):
        """Get message processing statistics."""
        # Find all message keys
        message_keys = self.r.keys('msg:*')

        stats = {
            'total': len(message_keys),
            'published': 0,
            'processing': 0,
            'completed': 0,
            'failed': 0
        }

        for key in message_keys:
            status = self.r.hget(key, 'status')
            if status:
                stats[status] = stats.get(status, 0) + 1

        return stats

def process_message(message_id, data, metadata):
    """Process message with metadata."""
    print(f"\nProcessing {message_id}")
    print(f"  Type: {metadata.get('type')}")
    print(f"  Data: {data}")
    print(f"  Retry count: {metadata.get('retry_count')}")
    time.sleep(0.5)

def main():
    bus = MetadataMessageBus('messages')

    # Publisher
    messages = [
        {'type': 'order', 'order_id': 123, 'amount': 99.99},
        {'type': 'user', 'user_id': 456, 'action': 'login'},
        {'type': 'payment', 'payment_id': 789, 'status': 'completed'},
    ]

    for msg in messages:
        bus.publish_with_metadata(msg)
        time.sleep(0.3)

    # Wait a bit
    time.sleep(1)

    # Show statistics
    print("\nStatistics:")
    stats = bus.get_statistics()
    for key, value in stats.items():
        print(f"  {key}: {value}")

if __name__ == "__main__":
    main()
```

### Use Cases

1. **Message Tracking**
   - Track processing state
   - Monitor retry counts
   - Audit message lifecycle

2. **Debugging**
   - Store detailed metadata
   - Trace message flow
   - Troubleshoot failures

## Streams + Data Structures

### Pattern: Stream Index with Sets

Create `stream_index_pattern.py`:

```python
#!/usr/bin/env python3
import redis
import json

class IndexedStream:
    """Stream with indexes using Sets for efficient queries."""

    def __init__(self, stream_name):
        self.r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.stream = stream_name

    def add_event(self, event_type, entity_id, data):
        """Add event to stream and update indexes."""
        # Add to stream
        event_data = {
            'event_type': event_type,
            'entity_id': entity_id,
            'data': json.dumps(data)
        }

        message_id = self.r.xadd(self.stream, event_data)

        # Update indexes (Sets)
        self.r.sadd(f"idx:type:{event_type}", message_id)
        self.r.sadd(f"idx:entity:{entity_id}", message_id)

        print(f"Added event {message_id}: {event_type} for {entity_id}")
        return message_id

    def get_events_by_type(self, event_type):
        """Query events by type using index."""
        message_ids = self.r.smembers(f"idx:type:{event_type}")

        events = []
        for msg_id in message_ids:
            result = self.r.xrange(self.stream, msg_id, msg_id)
            if result:
                events.append(result[0])

        return events

    def get_events_by_entity(self, entity_id):
        """Query events by entity using index."""
        message_ids = self.r.smembers(f"idx:entity:{entity_id}")

        events = []
        for msg_id in message_ids:
            result = self.r.xrange(self.stream, msg_id, msg_id)
            if result:
                events.append(result[0])

        return events

def main():
    stream = IndexedStream('events')

    # Add events
    stream.add_event('user_login', 'user-123', {'ip': '192.168.1.1'})
    stream.add_event('user_logout', 'user-123', {'duration': 3600})
    stream.add_event('user_login', 'user-456', {'ip': '192.168.1.2'})
    stream.add_event('order_created', 'user-123', {'amount': 99.99})

    # Query by type
    print("\nLogin events:")
    logins = stream.get_events_by_type('user_login')
    for msg_id, fields in logins:
        print(f"  {msg_id}: {fields}")

    # Query by entity
    print("\nEvents for user-123:")
    user_events = stream.get_events_by_entity('user-123')
    for msg_id, fields in user_events:
        print(f"  {msg_id}: {fields}")

if __name__ == "__main__":
    main()
```

## Hybrid Architectural Patterns

### Pattern 1: Fast Path + Reliable Path

```python
class HybridMessageBus:
    """Combine Pub/Sub (fast) with Streams (reliable)."""

    def publish(self, event):
        # Fast path: Pub/Sub notification
        self.r.publish('events:realtime', json.dumps(event))

        # Reliable path: Stream persistence
        self.r.xadd('events:stream', event)

    def subscribe_fast(self):
        """Real-time consumption via Pub/Sub."""
        pubsub = self.r.pubsub()
        pubsub.subscribe('events:realtime')
        # Process in real-time

    def subscribe_reliable(self):
        """Reliable consumption via Streams."""
        self.r.xreadgroup('group', 'consumer', {'events:stream': '>'})
        # Process with acknowledgments
```

### Pattern 2: Command Query Responsibility Segregation (CQRS)

```python
class CQRSPattern:
    """Separate write (commands) and read (queries) paths."""

    def execute_command(self, command):
        # Write to stream (command log)
        self.r.xadd('commands', command)

        # Publish event
        self.r.publish('events', json.dumps(command))

        # Update read model (Hash/Set/etc)
        self._update_read_model(command)

    def query_state(self, entity_id):
        # Read from optimized data structure
        return self.r.hgetall(f"entity:{entity_id}")
```

## Real-World Examples

### Example: Rate-Limited Webhook Delivery

Create `rate_limited_webhooks.py`:

```python
#!/usr/bin/env python3
import redis
import json
import time

class RateLimitedWebhookQueue:
    """Webhook queue with rate limiting using Sorted Sets."""

    def __init__(self):
        self.r = redis.Redis(host='localhost', port=6379, decode_responses=True)

    def queue_webhook(self, url, payload, priority=1):
        """Queue webhook with rate limiting."""
        webhook = {
            'url': url,
            'payload': payload,
            'queued_at': time.time()
        }

        # Add to sorted set with priority
        score = priority * 1000000 + time.time()
        self.r.zadd('webhooks:queue', {json.dumps(webhook): score})

        # Track per-URL rate limit (using list length as simple counter)
        self.r.lpush(f"rate:{url}", time.time())
        self.r.ltrim(f"rate:{url}", 0, 99)  # Keep last 100
        self.r.expire(f"rate:{url}", 60)  # 1 minute window

    def can_send_webhook(self, url, limit=10):
        """Check if URL is within rate limit."""
        count = self.r.llen(f"rate:{url}")
        return count < limit

    def process_webhooks(self):
        """Process webhooks respecting rate limits."""
        while True:
            # Get next webhook
            webhooks = self.r.zrange('webhooks:queue', 0, 0)

            if webhooks:
                webhook_json = webhooks[0]
                webhook = json.loads(webhook_json)

                if self.can_send_webhook(webhook['url']):
                    # Send webhook
                    print(f"Sending webhook to {webhook['url']}")
                    # ... actual HTTP request ...

                    # Remove from queue
                    self.r.zrem('webhooks:queue', webhook_json)
                else:
                    print(f"Rate limited: {webhook['url']}")
                    time.sleep(1)
            else:
                time.sleep(0.1)

def main():
    queue = RateLimitedWebhookQueue()

    # Queue multiple webhooks
    for i in range(15):
        queue.queue_webhook(
            'https://example.com/webhook',
            {'event': 'order.created', 'id': i},
            priority=0 if i < 5 else 1
        )

    # Process (will be rate limited)
    queue.process_webhooks()

if __name__ == "__main__":
    main()
```

## Best Practices

### 1. Choose the Right Structure

```python
# Lists: FIFO queues, stacks
# Sets: Deduplication, membership
# Sorted Sets: Priority, ranking, time-series
# Hashes: Object storage, metadata
```

### 2. Clean Up Old Data

```python
# Use TTL on temporary data
r.expire('temp:data', 3600)

# Periodic cleanup
def cleanup_old_messages():
    cutoff = time.time() - 86400  # 24 hours ago
    r.zremrangebyscore('messages', '-inf', cutoff)
```

### 3. Atomic Operations

```python
# Use pipeline for atomic multi-operation
pipe = r.pipeline()
pipe.rpush('queue', message)
pipe.publish('channel', 'new_message')
pipe.execute()
```

### 4. Monitor Memory Usage

```python
def check_memory():
    info = r.info('memory')
    used_mb = info['used_memory'] / 1024 / 1024
    print(f"Memory used: {used_mb:.2f} MB")
```

## Summary

In this tutorial, you learned:

1. Combining Pub/Sub with Lists for reliable queuing
2. Using Sets for event deduplication
3. Sorted Sets for priority message queues
4. Hashes for metadata storage
5. Indexing Streams with Sets
6. Hybrid architectural patterns (CQRS, fast/reliable paths)
7. Real-world examples (rate limiting, webhooks)
8. Best practices for combining structures

**Key Takeaways:**
- Data structures enhance messaging patterns
- Combine patterns for specific requirements
- Use the right structure for each use case
- Clean up temporary data proactively
- Monitor memory usage

**Next Steps:**
- [Tutorial 06: Persistence and Reliability](../06_persistence/README.md) for production durability
- [Tutorial 07: Sentinel and Cluster](../07_sentinel_cluster/README.md) for high availability
