# Tutorial 03: Message Ordering and Exactly-Once Delivery

## Overview

This tutorial explores two critical features of Google Cloud Pub/Sub: message ordering and exactly-once delivery. You'll learn when and how to enable these features, their performance implications, and best practices for building reliable message-driven systems.

## Prerequisites

- Completed [Tutorial 02: Pull and Push Subscriptions](../02_subscriptions/README.md)
- Understanding of distributed systems concepts
- Knowledge of idempotency patterns

## Learning Objectives

By the end of this tutorial, you will be able to:

1. Enable and use message ordering with ordering keys
2. Configure exactly-once delivery for subscriptions
3. Understand ordering guarantees and limitations
4. Implement idempotent message processing
5. Handle ordering keys in high-throughput scenarios
6. Measure and optimize performance with ordering

## Table of Contents

1. [Message Ordering Basics](#message-ordering-basics)
2. [Enabling Message Ordering](#enabling-message-ordering)
3. [Publishing with Ordering Keys](#publishing-with-ordering-keys)
4. [Exactly-Once Delivery](#exactly-once-delivery)
5. [Idempotent Processing](#idempotent-processing)
6. [Performance Considerations](#performance-considerations)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Message Ordering Basics

### Understanding Ordering in Pub/Sub

By default, Pub/Sub does **not** guarantee message order. Messages may be delivered out of sequence due to:

- Parallel processing in the system
- Retries and redeliveries
- Network variations
- Multiple publishers

### When You Need Ordering

**Use message ordering when:**
- Processing financial transactions sequentially
- Maintaining state machines (e.g., order status: created → paid → shipped)
- Event sourcing with chronological event replay
- Database change data capture (CDC)

**Don't use ordering when:**
- Messages are independent
- Performance is more important than order
- You can handle out-of-order messages in application logic

### How Ordering Works

Pub/Sub provides **per-key ordering**:
- Messages with the same ordering key are delivered in publish order
- Messages with different keys may be delivered out of order
- Ordering is guaranteed within a single publisher session

```
Publisher A: [user:123] msg1 → msg2 → msg3  (ordered)
Publisher A: [user:456] msg1 → msg2         (ordered, independent of user:123)
Publisher B: [user:123] msg4 → msg5         (ordered, may interleave with Publisher A)
```

## Enabling Message Ordering

### Creating Topics with Ordering

```python
# create_ordered_topic.py
from google.cloud import pubsub_v1

def create_topic_with_ordering(project_id: str, topic_id: str):
    """
    Create a topic that supports message ordering.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic ID
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    try:
        topic = publisher.create_topic(request={"name": topic_path})
        print(f"✓ Topic created: {topic.name}")
        print(f"  Message ordering: Supported (enable per subscription)")
        return topic
    except Exception as e:
        print(f"✗ Error creating topic: {e}")
        raise

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "ordered-topic"

    create_topic_with_ordering(PROJECT_ID, TOPIC_ID)
```

### Creating Subscriptions with Ordering

```python
# create_ordered_subscription.py
from google.cloud import pubsub_v1

def create_subscription_with_ordering(
    project_id: str,
    topic_id: str,
    subscription_id: str
):
    """
    Create a subscription with message ordering enabled.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to subscribe to
        subscription_id: The subscription ID
    """
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    try:
        subscription = subscriber.create_subscription(
            request={
                "name": subscription_path,
                "topic": topic_path,
                "enable_message_ordering": True,
                "ack_deadline_seconds": 60,
            }
        )
        print(f"✓ Subscription created: {subscription.name}")
        print(f"  Message ordering: Enabled")
        return subscription
    except Exception as e:
        print(f"✗ Error creating subscription: {e}")
        raise

def update_subscription_ordering(project_id: str, subscription_id: str):
    """
    Enable message ordering on an existing subscription.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to update
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    subscription = subscriber.update_subscription(
        request={
            "subscription": {
                "name": subscription_path,
                "enable_message_ordering": True,
            },
            "update_mask": {"paths": ["enable_message_ordering"]},
        }
    )
    print(f"✓ Updated subscription: {subscription.name}")
    print(f"  Message ordering: {subscription.enable_message_ordering}")
    return subscription

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "ordered-topic"
    SUBSCRIPTION_ID = "ordered-subscription"

    create_subscription_with_ordering(PROJECT_ID, TOPIC_ID, SUBSCRIPTION_ID)
```

## Publishing with Ordering Keys

### Basic Ordered Publishing

```python
# publish_ordered.py
from google.cloud import pubsub_v1
import time

def publish_messages_with_ordering_key(
    project_id: str,
    topic_id: str,
    ordering_key: str,
    messages: list
):
    """
    Publish messages with an ordering key.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to publish to
        ordering_key: The ordering key (e.g., user ID, session ID)
        messages: List of messages to publish
    """
    # Enable message ordering in publisher
    publisher_options = pubsub_v1.types.PublisherOptions(
        enable_message_ordering=True
    )
    publisher = pubsub_v1.PublisherClient(publisher_options=publisher_options)
    topic_path = publisher.topic_path(project_id, topic_id)

    publish_futures = []

    print(f"Publishing {len(messages)} messages with ordering key: {ordering_key}")

    for i, message in enumerate(messages):
        # Publish with ordering key
        data = message.encode("utf-8")
        future = publisher.publish(
            topic_path,
            data,
            ordering_key=ordering_key
        )
        publish_futures.append(future)
        print(f"  Queued message {i + 1}: {message}")

    # Wait for all messages to be published
    for future in publish_futures:
        message_id = future.result()
        print(f"  ✓ Published: {message_id}")

    print(f"✓ All messages published in order")

def publish_user_events_ordered(project_id: str, topic_id: str):
    """
    Publish user events with ordering by user ID.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to publish to
    """
    publisher_options = pubsub_v1.types.PublisherOptions(
        enable_message_ordering=True
    )
    publisher = pubsub_v1.PublisherClient(publisher_options=publisher_options)
    topic_path = publisher.topic_path(project_id, topic_id)

    # Events for user 123 (must be in order)
    user_123_events = [
        {"event": "login", "user_id": "123", "timestamp": time.time()},
        {"event": "view_product", "user_id": "123", "product": "A"},
        {"event": "add_to_cart", "user_id": "123", "product": "A"},
        {"event": "checkout", "user_id": "123", "amount": 99.99},
        {"event": "logout", "user_id": "123"},
    ]

    # Events for user 456 (must be in order, independent of user 123)
    user_456_events = [
        {"event": "login", "user_id": "456", "timestamp": time.time()},
        {"event": "view_product", "user_id": "456", "product": "B"},
        {"event": "logout", "user_id": "456"},
    ]

    import json

    # Publish user 123 events
    print("Publishing events for user 123...")
    for event in user_123_events:
        data = json.dumps(event).encode("utf-8")
        future = publisher.publish(
            topic_path,
            data,
            ordering_key="user:123"
        )
        message_id = future.result()
        print(f"  ✓ {event['event']}: {message_id}")

    # Publish user 456 events (can interleave with user 123)
    print("\nPublishing events for user 456...")
    for event in user_456_events:
        data = json.dumps(event).encode("utf-8")
        future = publisher.publish(
            topic_path,
            data,
            ordering_key="user:456"
        )
        message_id = future.result()
        print(f"  ✓ {event['event']}: {message_id}")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "ordered-topic"

    # Publish messages with ordering
    messages = ["Message 1", "Message 2", "Message 3", "Message 4", "Message 5"]
    publish_messages_with_ordering_key(
        PROJECT_ID, TOPIC_ID, "session:abc123", messages
    )

    # Publish user events
    publish_user_events_ordered(PROJECT_ID, TOPIC_ID)
```

### Ordered Publishing with Error Handling

```python
# publish_ordered_robust.py
from google.cloud import pubsub_v1
from google.api_core import exceptions
import time

class OrderedPublisher:
    """Publisher with ordering and error handling."""

    def __init__(self, project_id: str, topic_id: str):
        self.project_id = project_id
        self.topic_id = topic_id

        # Enable ordering
        publisher_options = pubsub_v1.types.PublisherOptions(
            enable_message_ordering=True
        )
        self.publisher = pubsub_v1.PublisherClient(
            publisher_options=publisher_options
        )
        self.topic_path = self.publisher.topic_path(project_id, topic_id)

    def publish_with_retry(self, message: str, ordering_key: str, max_retries: int = 3):
        """
        Publish message with retry logic.

        Args:
            message: The message to publish
            ordering_key: The ordering key
            max_retries: Maximum number of retries

        Returns:
            Message ID or None on failure
        """
        data = message.encode("utf-8")

        for attempt in range(max_retries):
            try:
                future = self.publisher.publish(
                    self.topic_path,
                    data,
                    ordering_key=ordering_key
                )
                message_id = future.result(timeout=10)
                print(f"✓ Published: {message_id}")
                return message_id

            except exceptions.InvalidArgument as e:
                print(f"✗ Invalid argument: {e}")
                return None  # Don't retry on invalid arguments

            except exceptions.NotFound as e:
                print(f"✗ Topic not found: {e}")
                return None

            except Exception as e:
                print(f"✗ Attempt {attempt + 1}/{max_retries} failed: {e}")

                if attempt < max_retries - 1:
                    # Resume publishing for this ordering key
                    self.resume_ordering_key(ordering_key)
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    print(f"✗ Max retries reached for message: {message}")
                    return None

        return None

    def resume_ordering_key(self, ordering_key: str):
        """
        Resume publishing for an ordering key after error.

        Args:
            ordering_key: The ordering key to resume
        """
        try:
            self.publisher.resume_publish(self.topic_path, ordering_key)
            print(f"  Resumed publishing for key: {ordering_key}")
        except Exception as e:
            print(f"  ✗ Failed to resume: {e}")

    def publish_batch_ordered(self, messages: list, ordering_key: str):
        """
        Publish a batch of messages with the same ordering key.

        Args:
            messages: List of messages
            ordering_key: The ordering key for all messages
        """
        print(f"Publishing {len(messages)} messages with key: {ordering_key}")

        for i, message in enumerate(messages):
            message_id = self.publish_with_retry(message, ordering_key)
            if not message_id:
                print(f"✗ Failed to publish message {i + 1}")
                # Decide whether to continue or stop
                break

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "ordered-topic"

    publisher = OrderedPublisher(PROJECT_ID, TOPIC_ID)

    # Publish batch
    messages = [f"Order event {i}" for i in range(10)]
    publisher.publish_batch_ordered(messages, "order:12345")
```

### Receiving Ordered Messages

```python
# receive_ordered.py
from google.cloud import pubsub_v1
from collections import defaultdict
import time

def receive_ordered_messages(project_id: str, subscription_id: str):
    """
    Receive and process ordered messages.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription (must have ordering enabled)
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    # Track order per key
    message_counts = defaultdict(int)
    last_timestamps = defaultdict(float)

    def callback(message):
        """Process ordered message."""
        ordering_key = message.ordering_key
        data = message.data.decode("utf-8")

        # Track order
        message_counts[ordering_key] += 1
        count = message_counts[ordering_key]

        # Verify ordering
        current_time = time.time()
        if ordering_key in last_timestamps:
            time_diff = current_time - last_timestamps[ordering_key]
            print(f"[{ordering_key}] Message #{count}: {data} (Δt: {time_diff:.3f}s)")
        else:
            print(f"[{ordering_key}] Message #{count}: {data}")

        last_timestamps[ordering_key] = current_time

        # Process message
        process_ordered_message(data, ordering_key, count)

        # Acknowledge
        message.ack()

    # Subscribe
    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback
    )

    print(f"Listening for ordered messages on {subscription_path}...")
    print("Press Ctrl+C to stop\n")

    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()
        print("\n✓ Stopped subscriber")

def process_ordered_message(data: str, ordering_key: str, sequence: int):
    """
    Process message with ordering awareness.

    Args:
        data: Message data
        ordering_key: The ordering key
        sequence: Sequence number for this key
    """
    # Your business logic here
    # You can maintain state per ordering key
    time.sleep(0.1)  # Simulate processing

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "ordered-subscription"

    receive_ordered_messages(PROJECT_ID, SUBSCRIPTION_ID)
```

## Exactly-Once Delivery

### What is Exactly-Once Delivery?

**At-least-once** (default):
- Messages delivered at least once
- May be delivered multiple times (duplicates)
- Application must be idempotent

**Exactly-once** (optional):
- Messages delivered exactly once
- Pub/Sub deduplicates on client behalf
- Higher latency and cost
- Perfect for financial transactions

### Enabling Exactly-Once Delivery

```python
# exactly_once.py
from google.cloud import pubsub_v1

def create_subscription_with_exactly_once(
    project_id: str,
    topic_id: str,
    subscription_id: str
):
    """
    Create a subscription with exactly-once delivery.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to subscribe to
        subscription_id: The subscription ID
    """
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    try:
        subscription = subscriber.create_subscription(
            request={
                "name": subscription_path,
                "topic": topic_path,
                "enable_exactly_once_delivery": True,
                "ack_deadline_seconds": 60,
            }
        )
        print(f"✓ Subscription created: {subscription.name}")
        print(f"  Exactly-once delivery: {subscription.enable_exactly_once_delivery}")
        return subscription
    except Exception as e:
        print(f"✗ Error creating subscription: {e}")
        raise

def update_subscription_exactly_once(project_id: str, subscription_id: str):
    """
    Enable exactly-once delivery on existing subscription.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to update
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    subscription = subscriber.update_subscription(
        request={
            "subscription": {
                "name": subscription_path,
                "enable_exactly_once_delivery": True,
            },
            "update_mask": {"paths": ["enable_exactly_once_delivery"]},
        }
    )
    print(f"✓ Updated subscription: {subscription.name}")
    print(f"  Exactly-once: {subscription.enable_exactly_once_delivery}")
    return subscription

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "my-topic"
    SUBSCRIPTION_ID = "exactly-once-sub"

    create_subscription_with_exactly_once(PROJECT_ID, TOPIC_ID, SUBSCRIPTION_ID)
```

### Using Exactly-Once Delivery

```python
# exactly_once_consumer.py
from google.cloud import pubsub_v1
from google.api_core import exceptions
import time

def consume_with_exactly_once(project_id: str, subscription_id: str):
    """
    Consume messages with exactly-once delivery.

    Args:
        project_id: Your GCP project ID
        subscription_id: Subscription with exactly-once enabled
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    processed_messages = set()  # Track processed messages

    def callback(message):
        """Process with exactly-once semantics."""
        message_id = message.message_id

        # Check if already processed (shouldn't happen with exactly-once)
        if message_id in processed_messages:
            print(f"⚠ Duplicate detected: {message_id}")
            message.ack()
            return

        try:
            # Process message
            data = message.data.decode("utf-8")
            print(f"Processing: {message_id}")
            print(f"  Data: {data}")

            # Your business logic (doesn't need to be idempotent with exactly-once)
            process_exactly_once(data)

            # Acknowledge
            message.ack()
            processed_messages.add(message_id)
            print(f"  ✓ Processed and acknowledged")

        except exceptions.AcknowledgeError as e:
            # Exactly-once acknowledgment failed
            print(f"  ✗ Acknowledgment error: {e}")
            # Message will be redelivered

        except Exception as e:
            print(f"  ✗ Processing error: {e}")
            message.nack()

    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback
    )

    print(f"Listening with exactly-once delivery...")

    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()

def process_exactly_once(data: str):
    """Process message (doesn't need to be idempotent)."""
    # Example: Credit account (critical operation)
    print(f"  Crediting account based on: {data}")
    time.sleep(0.1)

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "exactly-once-sub"

    consume_with_exactly_once(PROJECT_ID, SUBSCRIPTION_ID)
```

## Idempotent Processing

Even with exactly-once delivery, implementing idempotency is a best practice.

```python
# idempotent_processing.py
from google.cloud import pubsub_v1
import hashlib
import json
from datetime import datetime, timedelta

class IdempotentProcessor:
    """Process messages idempotently."""

    def __init__(self):
        # In production, use Redis, Memcached, or database
        self.processed_message_ids = set()
        self.message_timestamps = {}

        # Clean up old entries periodically
        self.cleanup_interval = timedelta(hours=24)

    def is_duplicate(self, message_id: str) -> bool:
        """Check if message was already processed."""
        return message_id in self.processed_message_ids

    def mark_processed(self, message_id: str):
        """Mark message as processed."""
        self.processed_message_ids.add(message_id)
        self.message_timestamps[message_id] = datetime.now()

    def cleanup_old_entries(self):
        """Remove old processed message IDs."""
        cutoff = datetime.now() - self.cleanup_interval
        to_remove = [
            msg_id for msg_id, timestamp in self.message_timestamps.items()
            if timestamp < cutoff
        ]
        for msg_id in to_remove:
            self.processed_message_ids.discard(msg_id)
            del self.message_timestamps[msg_id]

        if to_remove:
            print(f"Cleaned up {len(to_remove)} old message IDs")

    def process_message_idempotent(self, message):
        """Process message with idempotency guarantee."""
        message_id = message.message_id

        # Check for duplicate
        if self.is_duplicate(message_id):
            print(f"⚠ Skipping duplicate: {message_id}")
            message.ack()
            return

        try:
            # Process message
            data = message.data.decode("utf-8")
            print(f"Processing: {message_id}")

            # Your business logic
            result = self.process_business_logic(data)

            # Mark as processed
            self.mark_processed(message_id)

            # Acknowledge
            message.ack()
            print(f"  ✓ Processed: {result}")

        except Exception as e:
            print(f"  ✗ Error: {e}")
            message.nack()

    def process_business_logic(self, data: str) -> str:
        """Your business logic here."""
        # Example: Database update
        return f"Processed: {data}"

def consume_idempotent(project_id: str, subscription_id: str):
    """
    Consume messages with idempotent processing.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    processor = IdempotentProcessor()

    def callback(message):
        processor.process_message_idempotent(message)

    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback
    )

    print("Listening with idempotent processing...")

    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()

# Advanced: Content-based deduplication
def generate_content_hash(data: dict) -> str:
    """Generate hash from message content for deduplication."""
    # Sort keys for consistent hashing
    content = json.dumps(data, sort_keys=True)
    return hashlib.sha256(content.encode()).hexdigest()

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "my-subscription"

    consume_idempotent(PROJECT_ID, SUBSCRIPTION_ID)
```

## Performance Considerations

### Ordering Impact on Throughput

```python
# performance_comparison.py
from google.cloud import pubsub_v1
import time

def benchmark_unordered_publishing(project_id: str, topic_id: str, count: int):
    """Benchmark publishing without ordering."""
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    start = time.time()
    futures = []

    for i in range(count):
        data = f"Message {i}".encode("utf-8")
        future = publisher.publish(topic_path, data)
        futures.append(future)

    # Wait for all
    for future in futures:
        future.result()

    elapsed = time.time() - start
    throughput = count / elapsed

    print(f"Unordered publishing:")
    print(f"  Messages: {count}")
    print(f"  Time: {elapsed:.2f}s")
    print(f"  Throughput: {throughput:.2f} msg/s")

    return throughput

def benchmark_ordered_publishing(project_id: str, topic_id: str, count: int, num_keys: int):
    """Benchmark publishing with ordering."""
    publisher_options = pubsub_v1.types.PublisherOptions(
        enable_message_ordering=True
    )
    publisher = pubsub_v1.PublisherClient(publisher_options=publisher_options)
    topic_path = publisher.topic_path(project_id, topic_id)

    start = time.time()
    futures = []

    for i in range(count):
        data = f"Message {i}".encode("utf-8")
        # Distribute across keys
        ordering_key = f"key:{i % num_keys}"
        future = publisher.publish(topic_path, data, ordering_key=ordering_key)
        futures.append(future)

    # Wait for all
    for future in futures:
        future.result()

    elapsed = time.time() - start
    throughput = count / elapsed

    print(f"\nOrdered publishing ({num_keys} keys):")
    print(f"  Messages: {count}")
    print(f"  Time: {elapsed:.2f}s")
    print(f"  Throughput: {throughput:.2f} msg/s")

    return throughput

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "ordered-topic"
    MESSAGE_COUNT = 1000

    # Benchmark
    unordered_tput = benchmark_unordered_publishing(PROJECT_ID, TOPIC_ID, MESSAGE_COUNT)
    ordered_tput_10 = benchmark_ordered_publishing(PROJECT_ID, TOPIC_ID, MESSAGE_COUNT, 10)
    ordered_tput_100 = benchmark_ordered_publishing(PROJECT_ID, TOPIC_ID, MESSAGE_COUNT, 100)

    print(f"\n Performance Impact:")
    print(f"  Unordered: {unordered_tput:.2f} msg/s")
    print(f"  Ordered (10 keys): {ordered_tput_10:.2f} msg/s ({ordered_tput_10/unordered_tput*100:.1f}%)")
    print(f"  Ordered (100 keys): {ordered_tput_100:.2f} msg/s ({ordered_tput_100/unordered_tput*100:.1f}%)")
```

## Best Practices

### 1. Choose Ordering Keys Wisely

```python
# Good: High cardinality
ordering_key = f"user:{user_id}"  # Millions of users
ordering_key = f"session:{session_id}"  # Many concurrent sessions

# Bad: Low cardinality
ordering_key = "region:us-east"  # Only a few regions (bottleneck)
ordering_key = "all"  # Single key (no parallelism)
```

### 2. Combine Ordering with Exactly-Once When Needed

```python
def create_subscription_ordered_exactly_once(
    project_id: str,
    topic_id: str,
    subscription_id: str
):
    """Best of both worlds for critical workflows."""
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    subscription = subscriber.create_subscription(
        request={
            "name": subscription_path,
            "topic": topic_path,
            "enable_message_ordering": True,
            "enable_exactly_once_delivery": True,
            "ack_deadline_seconds": 60,
        }
    )
    print(f"✓ Created subscription with ordering + exactly-once")
    return subscription
```

### 3. Monitor Ordering Key Distribution

```python
from collections import Counter

def analyze_ordering_key_distribution(project_id: str, subscription_id: str, duration: int = 60):
    """Analyze distribution of ordering keys."""
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    key_counter = Counter()

    def callback(message):
        ordering_key = message.ordering_key
        if ordering_key:
            key_counter[ordering_key] += 1
        message.ack()

    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)

    try:
        streaming_pull_future.result(timeout=duration)
    except:
        streaming_pull_future.cancel()

    print(f"\nOrdering Key Distribution:")
    for key, count in key_counter.most_common(10):
        print(f"  {key}: {count} messages")

    print(f"\nTotal unique keys: {len(key_counter)}")
```

## Troubleshooting

### Common Issues

**1. Ordering key mismatch**
```python
# Error: Publishing without ordering enabled
publisher = pubsub_v1.PublisherClient()  # ✗ Wrong
topic_path = publisher.topic_path(project_id, topic_id)
publisher.publish(topic_path, b"data", ordering_key="key1")  # Will fail

# Fix: Enable ordering in publisher
publisher_options = pubsub_v1.types.PublisherOptions(enable_message_ordering=True)
publisher = pubsub_v1.PublisherClient(publisher_options=publisher_options)  # ✓
```

**2. Performance degradation**
- Too few ordering keys cause bottlenecks
- Solution: Increase key cardinality

**3. Exactly-once acknowledgment errors**
- Network issues can cause ack failures
- Messages will be redelivered
- Implement idempotency as backup

## Summary

In this tutorial, you learned:

- How to enable and use message ordering with ordering keys
- Configuring exactly-once delivery for critical workflows
- Implementing idempotent message processing
- Performance implications of ordering and exactly-once delivery
- Best practices for choosing ordering keys
- Troubleshooting common issues

## Next Steps

- Continue to [Tutorial 04: Dead Letter Topics and Retry Policies](../04_dead_letter/README.md)
- Learn about [Schema Validation](../05_schema_validation/README.md)
- Review [Ordering and Delivery Guarantees](https://cloud.google.com/pubsub/docs/ordering)
