# Tutorial 01: Basic Redis Pub/Sub

Learn Redis Pub/Sub fundamentals with Docker setup, basic publishing and subscribing, channel management, and Python redis-py library integration.

## Table of Contents
- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Redis Setup with Docker](#redis-setup-with-docker)
- [Understanding Pub/Sub](#understanding-pubsub)
- [Basic Pub/Sub Operations](#basic-pub-sub-operations)
- [Python Implementation](#python-implementation)
- [Multiple Subscribers](#multiple-subscribers)
- [Error Handling](#error-handling)
- [Testing and Verification](#testing-and-verification)
- [Best Practices](#best-practices)

## Introduction

Redis Pub/Sub (Publish/Subscribe) is a messaging pattern where publishers send messages to channels without knowledge of subscribers, and subscribers listen to channels without knowledge of publishers. This decoupling makes it ideal for real-time notifications and event broadcasting.

### Key Characteristics

**Fire-and-Forget:**
- Messages are not stored
- Only active subscribers receive messages
- No delivery guarantees
- Extremely low latency

**Use Cases:**
- Real-time notifications
- Chat applications
- Live dashboards
- Cache invalidation
- Event broadcasting

## Prerequisites

**Required Software:**
- Docker and Docker Compose
- Python 3.8+
- redis-py library

**Installation:**
```bash
# Install Python Redis library
pip install redis

# Verify installation
python -c "import redis; print(redis.__version__)"
```

## Redis Setup with Docker

### Single Redis Instance

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7.2-alpine
    container_name: redis-pubsub
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - redis-network

volumes:
  redis-data:
    driver: local

networks:
  redis-network:
    driver: bridge
```

### Start Redis

```bash
# Start Redis
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f redis

# Connect with redis-cli
docker exec -it redis-pubsub redis-cli
```

### Verify Installation

```bash
# Test connection
redis-cli ping
# Expected output: PONG

# Check info
redis-cli INFO server

# Test Pub/Sub
redis-cli PUBLISH test "Hello"
```

## Understanding Pub/Sub

### Architecture

```
Publisher 1 ────┐
                │
Publisher 2 ────┼───▶ Channel "news" ────┼───▶ Subscriber 1
                │                         │
Publisher 3 ────┘                         ├───▶ Subscriber 2
                                          │
                                          └───▶ Subscriber 3
```

### Key Concepts

**Channels:**
- Named message routes
- No pre-configuration needed
- Created on first publish
- Destroyed when empty

**Publishers:**
- Send messages to channels
- Don't know about subscribers
- Non-blocking operation
- Return number of subscribers

**Subscribers:**
- Listen to one or more channels
- Blocking operation
- Receive messages in real-time
- Can subscribe/unsubscribe dynamically

### Message Flow

1. Publisher sends message to channel
2. Redis delivers to all active subscribers
3. Message is discarded (not stored)
4. Subscribers not active miss the message

## Basic Pub/Sub Operations

### Redis CLI Commands

**PUBLISH** - Send message to channel:
```bash
PUBLISH channel message
```

**SUBSCRIBE** - Listen to channels:
```bash
SUBSCRIBE channel [channel ...]
```

**UNSUBSCRIBE** - Stop listening:
```bash
UNSUBSCRIBE [channel ...]
```

**PUBSUB CHANNELS** - List active channels:
```bash
PUBSUB CHANNELS [pattern]
```

**PUBSUB NUMSUB** - Get subscriber count:
```bash
PUBSUB NUMSUB channel [channel ...]
```

### Hands-On Examples

**Terminal 1 - Subscriber:**
```bash
redis-cli SUBSCRIBE news sports
# Reading messages... (press Ctrl-C to quit)
# 1) "subscribe"
# 2) "news"
# 3) (integer) 1
```

**Terminal 2 - Publisher:**
```bash
redis-cli PUBLISH news "Breaking: Redis is awesome!"
# (integer) 1  # Number of subscribers that received the message

redis-cli PUBLISH sports "Game starts at 8 PM"
# (integer) 1
```

**Terminal 1 Output:**
```
1) "message"
2) "news"
3) "Breaking: Redis is awesome!"

1) "message"
2) "sports"
3) "Game starts at 8 PM"
```

### Inspect Channels

```bash
# List all active channels
redis-cli PUBSUB CHANNELS

# List channels matching pattern
redis-cli PUBSUB CHANNELS "news*"

# Get subscriber count
redis-cli PUBSUB NUMSUB news sports
# 1) "news"
# 2) (integer) 1
# 3) "sports"
# 4) (integer) 1
```

## Python Implementation

### Basic Publisher

Create `publisher.py`:

```python
#!/usr/bin/env python3
import redis
import time
import json
from datetime import datetime

def create_redis_client():
    """Create Redis client with connection pooling."""
    return redis.Redis(
        host='localhost',
        port=6379,
        db=0,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_keepalive=True,
        health_check_interval=30
    )

def publish_message(r, channel, message):
    """Publish message to channel and return subscriber count."""
    try:
        num_subscribers = r.publish(channel, message)
        print(f"Published to '{channel}': {message}")
        print(f"Received by {num_subscribers} subscriber(s)")
        return num_subscribers
    except redis.RedisError as e:
        print(f"Error publishing message: {e}")
        return 0

def main():
    # Connect to Redis
    r = create_redis_client()

    # Test connection
    try:
        r.ping()
        print("Connected to Redis successfully!")
    except redis.ConnectionError:
        print("Failed to connect to Redis")
        return

    # Publish simple messages
    publish_message(r, 'news', 'Hello from Python!')
    time.sleep(1)

    # Publish JSON data
    data = {
        'event': 'user_login',
        'user_id': 12345,
        'timestamp': datetime.now().isoformat()
    }
    publish_message(r, 'events', json.dumps(data))

    # Publish multiple messages
    for i in range(5):
        message = f"Message {i+1} at {datetime.now().strftime('%H:%M:%S')}"
        publish_message(r, 'updates', message)
        time.sleep(0.5)

    print("\nPublishing complete!")

if __name__ == "__main__":
    main()
```

### Basic Subscriber

Create `subscriber.py`:

```python
#!/usr/bin/env python3
import redis
import signal
import sys
import json

# Global flag for graceful shutdown
running = True

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully."""
    global running
    print("\nShutting down subscriber...")
    running = False

def create_redis_client():
    """Create Redis client."""
    return redis.Redis(
        host='localhost',
        port=6379,
        db=0,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_keepalive=True
    )

def message_handler(message):
    """Process received message."""
    msg_type = message['type']

    if msg_type == 'subscribe':
        print(f"Subscribed to channel: {message['channel']}")
        print(f"Total subscriptions: {message['data']}")

    elif msg_type == 'message':
        channel = message['channel']
        data = message['data']

        print(f"\n[{channel}] Received message:")

        # Try to parse as JSON
        try:
            parsed_data = json.loads(data)
            print(json.dumps(parsed_data, indent=2))
        except (json.JSONDecodeError, TypeError):
            print(data)

def subscribe_to_channels(r, channels):
    """Subscribe to channels and listen for messages."""
    pubsub = r.pubsub()
    pubsub.subscribe(*channels)

    print(f"Listening to channels: {', '.join(channels)}")
    print("Press Ctrl+C to stop\n")

    global running
    while running:
        try:
            message = pubsub.get_message(timeout=1.0)
            if message:
                message_handler(message)
        except redis.RedisError as e:
            print(f"Redis error: {e}")
            break
        except KeyboardInterrupt:
            break

    pubsub.unsubscribe()
    pubsub.close()

def main():
    # Setup signal handler
    signal.signal(signal.SIGINT, signal_handler)

    # Connect to Redis
    r = create_redis_client()

    try:
        r.ping()
        print("Connected to Redis successfully!\n")
    except redis.ConnectionError:
        print("Failed to connect to Redis")
        return

    # Subscribe to multiple channels
    channels = ['news', 'events', 'updates']
    subscribe_to_channels(r, channels)

    print("Subscriber stopped.")

if __name__ == "__main__":
    main()
```

### Run the Examples

**Terminal 1 - Start Subscriber:**
```bash
python subscriber.py
```

**Terminal 2 - Run Publisher:**
```bash
python publisher.py
```

**Expected Output (Subscriber):**
```
Connected to Redis successfully!

Subscribed to channel: news
Total subscriptions: 1
Subscribed to channel: events
Total subscriptions: 2
Subscribed to channel: updates
Total subscriptions: 3
Listening to channels: news, events, updates
Press Ctrl+C to stop

[news] Received message:
Hello from Python!

[events] Received message:
{
  "event": "user_login",
  "user_id": 12345,
  "timestamp": "2025-11-19T10:30:45.123456"
}

[updates] Received message:
Message 1 at 10:30:45
```

## Multiple Subscribers

### Load Balancing Consideration

**Important:** Redis Pub/Sub delivers messages to ALL subscribers. For load balancing, use Redis Streams with Consumer Groups (Tutorial 04).

Create `subscriber_multiple.py`:

```python
#!/usr/bin/env python3
import redis
import sys
import time

def subscriber_worker(subscriber_id, channels):
    """Individual subscriber worker."""
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    pubsub = r.pubsub()
    pubsub.subscribe(*channels)

    print(f"Subscriber {subscriber_id} started")

    for message in pubsub.listen():
        if message['type'] == 'message':
            print(f"[Subscriber {subscriber_id}] Channel: {message['channel']}, "
                  f"Data: {message['data']}")

            # Simulate processing
            time.sleep(0.1)

def main():
    if len(sys.argv) < 2:
        print("Usage: python subscriber_multiple.py <subscriber_id>")
        sys.exit(1)

    subscriber_id = sys.argv[1]
    channels = ['notifications', 'alerts']

    try:
        subscriber_worker(subscriber_id, channels)
    except KeyboardInterrupt:
        print(f"\nSubscriber {subscriber_id} stopped")

if __name__ == "__main__":
    main()
```

**Run Multiple Subscribers:**

```bash
# Terminal 1
python subscriber_multiple.py 1

# Terminal 2
python subscriber_multiple.py 2

# Terminal 3
python subscriber_multiple.py 3

# Terminal 4 - Publisher
redis-cli PUBLISH notifications "Important update"
```

**Result:** All three subscribers receive the same message.

## Error Handling

### Connection Resilience

Create `resilient_subscriber.py`:

```python
#!/usr/bin/env python3
import redis
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResilientSubscriber:
    def __init__(self, host='localhost', port=6379, max_retries=5):
        self.host = host
        self.port = port
        self.max_retries = max_retries
        self.client = None
        self.pubsub = None

    def connect(self):
        """Connect to Redis with retries."""
        for attempt in range(self.max_retries):
            try:
                self.client = redis.Redis(
                    host=self.host,
                    port=self.port,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_keepalive=True,
                    health_check_interval=30
                )
                self.client.ping()
                logger.info("Connected to Redis")
                return True
            except redis.ConnectionError as e:
                logger.error(f"Connection attempt {attempt + 1} failed: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
        return False

    def subscribe(self, channels):
        """Subscribe to channels with error handling."""
        if not self.connect():
            logger.error("Failed to connect to Redis")
            return

        self.pubsub = self.client.pubsub()
        self.pubsub.subscribe(*channels)
        logger.info(f"Subscribed to: {', '.join(channels)}")

        while True:
            try:
                message = self.pubsub.get_message(timeout=1.0)
                if message and message['type'] == 'message':
                    self.handle_message(message)
            except redis.ConnectionError as e:
                logger.error(f"Connection lost: {e}")
                self.reconnect(channels)
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                time.sleep(1)

    def reconnect(self, channels):
        """Reconnect and resubscribe."""
        logger.info("Attempting to reconnect...")
        if self.pubsub:
            try:
                self.pubsub.close()
            except:
                pass

        if self.connect():
            self.pubsub = self.client.pubsub()
            self.pubsub.subscribe(*channels)
            logger.info("Reconnected and resubscribed")

    def handle_message(self, message):
        """Process message."""
        logger.info(f"[{message['channel']}] {message['data']}")

def main():
    subscriber = ResilientSubscriber()
    subscriber.subscribe(['system', 'alerts'])

if __name__ == "__main__":
    main()
```

## Testing and Verification

### Test Script

Create `test_pubsub.py`:

```python
#!/usr/bin/env python3
import redis
import time
import threading

def test_basic_pubsub():
    """Test basic publish/subscribe."""
    print("Test 1: Basic Pub/Sub")

    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    pubsub = r.pubsub()

    received_messages = []

    def subscriber():
        pubsub.subscribe('test-channel')
        for message in pubsub.listen():
            if message['type'] == 'message':
                received_messages.append(message['data'])
                if len(received_messages) >= 3:
                    break

    # Start subscriber in thread
    thread = threading.Thread(target=subscriber)
    thread.start()

    time.sleep(1)  # Wait for subscription

    # Publish messages
    r.publish('test-channel', 'Message 1')
    r.publish('test-channel', 'Message 2')
    r.publish('test-channel', 'Message 3')

    thread.join(timeout=5)

    assert len(received_messages) == 3, f"Expected 3 messages, got {len(received_messages)}"
    print("✓ Test passed\n")

    pubsub.close()

def test_channel_info():
    """Test PUBSUB commands."""
    print("Test 2: Channel Information")

    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    pubsub = r.pubsub()
    pubsub.subscribe('test1', 'test2')

    time.sleep(0.5)

    # Check channels
    channels = r.pubsub_channels()
    assert 'test1' in channels, "test1 channel not found"
    assert 'test2' in channels, "test2 channel not found"

    # Check subscriber count
    numsub = r.pubsub_numsub('test1', 'test2')
    assert numsub[b'test1'] == 1, "Expected 1 subscriber on test1"

    print("✓ Test passed\n")

    pubsub.close()

def main():
    print("Running Pub/Sub Tests\n")
    test_basic_pubsub()
    test_channel_info()
    print("All tests passed!")

if __name__ == "__main__":
    main()
```

## Best Practices

### 1. Connection Management

```python
# Use connection pooling
pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    max_connections=10,
    decode_responses=True
)
r = redis.Redis(connection_pool=pool)
```

### 2. Message Serialization

```python
import json
import pickle

# JSON for interoperability
data = {'user': 'john', 'action': 'login'}
r.publish('events', json.dumps(data))

# Pickle for Python-only
import pickle
data = {'complex': [1, 2, 3], 'object': True}
r.publish('internal', pickle.dumps(data))
```

### 3. Channel Naming Conventions

```python
# Hierarchical naming
r.publish('app:user:login', 'user123')
r.publish('app:order:created', 'order456')
r.publish('system:health:cpu', '85%')

# Environment prefixing
r.publish('prod:alerts:critical', 'Database down')
r.publish('dev:debug:trace', 'Step 1 complete')
```

### 4. Graceful Shutdown

```python
import signal

running = True

def signal_handler(sig, frame):
    global running
    running = False

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# In main loop
while running:
    message = pubsub.get_message(timeout=1.0)
    if message:
        handle_message(message)
```

## Summary

In this tutorial, you learned:

1. Redis Pub/Sub fundamentals and architecture
2. Docker setup for Redis
3. Basic PUBLISH and SUBSCRIBE operations
4. Python redis-py library usage
5. Multiple subscriber patterns
6. Error handling and reconnection
7. Testing and verification
8. Production best practices

**Key Takeaways:**
- Pub/Sub is fire-and-forget (no persistence)
- Messages only reach active subscribers
- All subscribers receive all messages (no load balancing)
- Ideal for real-time notifications and broadcasting

**Next Steps:**
- [Tutorial 02: Pattern Matching Subscriptions](../02_pattern_subscriptions/README.md) for advanced subscription patterns
- [Tutorial 03: Redis Streams](../03_redis_streams/README.md) for persistent messaging

## Cleanup

```bash
# Stop Redis
docker-compose down

# Remove volumes
docker-compose down -v
```
