# Tutorial 02: Pattern Matching Subscriptions

Master pattern-based subscriptions with glob patterns, dynamic channel subscriptions, multi-channel patterns, and wildcard matching for scalable Redis Pub/Sub systems.

## Table of Contents
- [Introduction](#introduction)
- [Pattern Matching Basics](#pattern-matching-basics)
- [PSUBSCRIBE Command](#psubscribe-command)
- [Glob Patterns](#glob-patterns)
- [Python Implementation](#python-implementation)
- [Multi-Pattern Subscriptions](#multi-pattern-subscriptions)
- [Dynamic Subscriptions](#dynamic-subscriptions)
- [Real-World Use Cases](#real-world-use-cases)
- [Performance Considerations](#performance-considerations)
- [Best Practices](#best-practices)

## Introduction

Pattern subscriptions allow you to subscribe to multiple channels using wildcard patterns instead of explicit channel names. This is powerful for scalable architectures where channel names are dynamic or hierarchical.

### Why Use Pattern Subscriptions?

**Advantages:**
- Subscribe to channels without knowing exact names
- Handle dynamic channel creation
- Reduce subscription management overhead
- Support hierarchical channel structures
- Enable flexible routing

**Use Cases:**
- Multi-tenant applications (tenant:*)
- Microservices events (service:*:events)
- Geographic routing (region:*:updates)
- Log aggregation (app:*:logs)
- IoT sensor data (sensor:*:temperature)

## Pattern Matching Basics

### Regular vs Pattern Subscriptions

**SUBSCRIBE** - Explicit channels:
```bash
SUBSCRIBE channel1 channel2 channel3
```

**PSUBSCRIBE** - Pattern matching:
```bash
PSUBSCRIBE channel*        # Matches channel1, channel2, channelX
PSUBSCRIBE user:*:events   # Matches user:123:events, user:456:events
PSUBSCRIBE logs:?:critical # Matches logs:1:critical, logs:A:critical
```

### Pattern Matching Rules

Redis uses glob-style patterns:

| Pattern | Meaning | Example | Matches |
|---------|---------|---------|---------|
| `*` | Zero or more characters | `news:*` | `news:sports`, `news:world`, `news:` |
| `?` | Exactly one character | `log:?` | `log:1`, `log:A` but not `log:12` |
| `[abc]` | One character from set | `type:[abc]` | `type:a`, `type:b`, `type:c` |
| `[a-z]` | One character from range | `level:[0-9]` | `level:1`, `level:5` |
| `[^a]` | One character not in set | `tag:[^x]` | `tag:a`, `tag:b` but not `tag:x` |

### Message Structure

Pattern subscription messages include:
- `type`: 'pmessage' (vs 'message')
- `pattern`: The pattern that matched
- `channel`: The actual channel name
- `data`: The message content

## PSUBSCRIBE Command

### Basic Syntax

```bash
PSUBSCRIBE pattern [pattern ...]
```

### Command Examples

**Subscribe to all channels in a namespace:**
```bash
redis-cli PSUBSCRIBE "app:*"
```

**Subscribe to multiple patterns:**
```bash
redis-cli PSUBSCRIBE "user:*" "order:*" "product:*"
```

**Hierarchical patterns:**
```bash
redis-cli PSUBSCRIBE "system:server:*:cpu"
redis-cli PSUBSCRIBE "events:*:*:created"
```

### Hands-On Example

**Terminal 1 - Pattern Subscriber:**
```bash
redis-cli PSUBSCRIBE "news:*"
# Reading messages... (press Ctrl-C to quit)
# 1) "psubscribe"
# 2) "news:*"
# 3) (integer) 1
```

**Terminal 2 - Publishers:**
```bash
# These all match the pattern news:*
redis-cli PUBLISH news:sports "Lakers win!"
redis-cli PUBLISH news:world "Breaking news"
redis-cli PUBLISH news:tech "AI breakthrough"

# This doesn't match
redis-cli PUBLISH sports "Game on"  # No message received
```

**Terminal 1 Output:**
```
1) "pmessage"
2) "news:*"
3) "news:sports"
4) "Lakers win!"

1) "pmessage"
2) "news:*"
3) "news:world"
4) "Breaking news"

1) "pmessage"
2) "news:*"
3) "news:tech"
4) "AI breakthrough"
```

## Glob Patterns

### Wildcard Examples

**Single-level wildcard (*):**
```bash
# Pattern: user:*
# Matches: user:123, user:abc, user:john
# Doesn't match: user:123:profile (multiple levels)

PSUBSCRIBE "user:*"
```

**Multi-level wildcard (*):**
```bash
# Pattern: events:*:*
# Matches: events:user:login, events:order:created
# Doesn't match: events:user (missing second level)

PSUBSCRIBE "events:*:*"
```

**Character class patterns:**
```bash
# Match priority levels 0-9
PSUBSCRIBE "priority:[0-9]:task"

# Match log levels
PSUBSCRIBE "log:[DIWEF]:*"  # Debug, Info, Warning, Error, Fatal
```

### Complex Pattern Examples

**Geographic routing:**
```bash
# All regions
PSUBSCRIBE "region:*:sales"

# Specific regions
PSUBSCRIBE "region:us-*:sales"      # us-east, us-west
PSUBSCRIBE "region:eu-*:sales"      # eu-central, eu-west
```

**Multi-tenant systems:**
```bash
# All tenants
PSUBSCRIBE "tenant:*:notifications"

# Specific tenant types
PSUBSCRIBE "tenant:enterprise:*:notifications"
PSUBSCRIBE "tenant:free:*:notifications"
```

**Microservices events:**
```bash
# All service events
PSUBSCRIBE "service:*:events"

# Specific event types
PSUBSCRIBE "service:*:error"
PSUBSCRIBE "service:*:health"
```

## Python Implementation

### Basic Pattern Subscriber

Create `pattern_subscriber.py`:

```python
#!/usr/bin/env python3
import redis
import json
import signal
import sys

running = True

def signal_handler(sig, frame):
    global running
    print("\nShutting down...")
    running = False

def create_redis_client():
    return redis.Redis(
        host='localhost',
        port=6379,
        decode_responses=True
    )

def handle_pattern_message(message):
    """Handle pattern subscription message."""
    if message['type'] == 'psubscribe':
        print(f"✓ Subscribed to pattern: {message['pattern']}")
        return

    if message['type'] == 'pmessage':
        pattern = message['pattern']
        channel = message['channel']
        data = message['data']

        print(f"\n{'='*60}")
        print(f"Pattern:  {pattern}")
        print(f"Channel:  {channel}")
        print(f"Message:  {data}")

        # Extract info from channel name
        parts = channel.split(':')
        if len(parts) >= 2:
            print(f"Namespace: {parts[0]}")
            print(f"Resource:  {parts[1]}")

        # Try to parse JSON
        try:
            parsed = json.loads(data)
            print(f"Data (parsed):")
            print(json.dumps(parsed, indent=2))
        except (json.JSONDecodeError, TypeError):
            pass

        print('='*60)

def main():
    signal.signal(signal.SIGINT, signal_handler)

    r = create_redis_client()

    try:
        r.ping()
        print("Connected to Redis\n")
    except redis.ConnectionError:
        print("Failed to connect to Redis")
        return

    # Create PubSub instance
    pubsub = r.pubsub()

    # Subscribe to patterns
    patterns = [
        'user:*',
        'order:*',
        'events:*:*'
    ]

    pubsub.psubscribe(*patterns)
    print(f"Listening to patterns: {', '.join(patterns)}\n")

    global running
    while running:
        try:
            message = pubsub.get_message(timeout=1.0)
            if message:
                handle_pattern_message(message)
        except Exception as e:
            print(f"Error: {e}")
            break

    pubsub.punsubscribe()
    pubsub.close()
    print("Subscriber stopped")

if __name__ == "__main__":
    main()
```

### Pattern Publisher

Create `pattern_publisher.py`:

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

def publish_event(r, channel, event_type, data):
    """Publish structured event."""
    message = {
        'event': event_type,
        'timestamp': datetime.now().isoformat(),
        'data': data
    }

    num_subs = r.publish(channel, json.dumps(message))
    print(f"Published to '{channel}': {event_type} ({num_subs} subscribers)")
    return num_subs

def main():
    r = create_redis_client()

    print("Publishing to various channels...\n")

    # User events (matches user:*)
    publish_event(r, 'user:123', 'login', {'username': 'john_doe'})
    time.sleep(0.5)

    publish_event(r, 'user:456', 'logout', {'username': 'jane_smith'})
    time.sleep(0.5)

    # Order events (matches order:*)
    publish_event(r, 'order:789', 'created', {
        'order_id': '789',
        'total': 99.99,
        'items': 3
    })
    time.sleep(0.5)

    publish_event(r, 'order:790', 'shipped', {
        'order_id': '790',
        'tracking': 'TRACK123'
    })
    time.sleep(0.5)

    # Hierarchical events (matches events:*:*)
    publish_event(r, 'events:user:registered', 'user_registered', {
        'user_id': 999,
        'plan': 'premium'
    })
    time.sleep(0.5)

    publish_event(r, 'events:payment:completed', 'payment_completed', {
        'amount': 49.99,
        'method': 'card'
    })
    time.sleep(0.5)

    # Events that don't match any pattern
    publish_event(r, 'system:health', 'heartbeat', {'status': 'ok'})

    print("\nPublishing complete!")

if __name__ == "__main__":
    main()
```

### Run the Examples

**Terminal 1:**
```bash
python pattern_subscriber.py
```

**Terminal 2:**
```bash
python pattern_publisher.py
```

## Multi-Pattern Subscriptions

### Overlapping Patterns

When a channel matches multiple patterns, you receive multiple messages.

Create `multi_pattern_test.py`:

```python
#!/usr/bin/env python3
import redis

def test_overlapping_patterns():
    """Test behavior with overlapping patterns."""
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    pubsub = r.pubsub()

    # Subscribe to overlapping patterns
    pubsub.psubscribe('*', 'user:*', 'user:*:*')

    print("Subscribed to patterns: *, user:*, user:*:*")
    print("\nPublishing to 'user:123:profile'...\n")

    # In another connection, publish
    import time
    time.sleep(1)

    publisher = redis.Redis(host='localhost', port=6379, decode_responses=True)
    publisher.publish('user:123:profile', 'Hello')

    # Receive messages
    count = 0
    while count < 4:  # 3 patterns + 1 subscribe
        message = pubsub.get_message(timeout=2.0)
        if message:
            print(f"Type: {message['type']}, Pattern: {message.get('pattern', 'N/A')}, "
                  f"Channel: {message.get('channel', 'N/A')}")
            count += 1

    pubsub.close()

if __name__ == "__main__":
    test_overlapping_patterns()
```

**Output:**
```
Type: psubscribe, Pattern: N/A, Channel: N/A
Type: psubscribe, Pattern: N/A, Channel: N/A
Type: psubscribe, Pattern: N/A, Channel: N/A
Type: pmessage, Pattern: *, Channel: user:123:profile
Type: pmessage, Pattern: user:*, Channel: user:123:profile
Type: pmessage, Pattern: user:*:*, Channel: user:123:profile
```

### Combining SUBSCRIBE and PSUBSCRIBE

Create `combined_subscriptions.py`:

```python
#!/usr/bin/env python3
import redis
import json

def handle_message(message):
    """Handle both exact and pattern messages."""
    msg_type = message['type']

    if msg_type == 'subscribe':
        print(f"✓ Subscribed to channel: {message['channel']}")
    elif msg_type == 'psubscribe':
        print(f"✓ Subscribed to pattern: {message['pattern']}")
    elif msg_type == 'message':
        print(f"\n[EXACT] {message['channel']}: {message['data']}")
    elif msg_type == 'pmessage':
        print(f"\n[PATTERN: {message['pattern']}] {message['channel']}: {message['data']}")

def main():
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    pubsub = r.pubsub()

    # Mix exact and pattern subscriptions
    pubsub.subscribe('critical')  # Exact channel
    pubsub.psubscribe('alerts:*')  # Pattern

    print("Listening to:")
    print("  - Exact: critical")
    print("  - Pattern: alerts:*")
    print()

    # Listen for messages
    for message in pubsub.listen():
        handle_message(message)

if __name__ == "__main__":
    main()
```

## Dynamic Subscriptions

### Add/Remove Patterns Dynamically

Create `dynamic_patterns.py`:

```python
#!/usr/bin/env python3
import redis
import threading
import time

class DynamicPatternSubscriber:
    def __init__(self):
        self.r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.pubsub = self.r.pubsub()
        self.running = True
        self.current_patterns = set()

    def add_pattern(self, pattern):
        """Dynamically add a pattern subscription."""
        if pattern not in self.current_patterns:
            self.pubsub.psubscribe(pattern)
            self.current_patterns.add(pattern)
            print(f"✓ Added pattern: {pattern}")

    def remove_pattern(self, pattern):
        """Dynamically remove a pattern subscription."""
        if pattern in self.current_patterns:
            self.pubsub.punsubscribe(pattern)
            self.current_patterns.remove(pattern)
            print(f"✗ Removed pattern: {pattern}")

    def listen(self):
        """Listen for messages."""
        while self.running:
            message = self.pubsub.get_message(timeout=1.0)
            if message and message['type'] == 'pmessage':
                print(f"[{message['pattern']}] {message['channel']}: {message['data']}")

    def stop(self):
        """Stop listening."""
        self.running = False
        self.pubsub.punsubscribe()
        self.pubsub.close()

def main():
    subscriber = DynamicPatternSubscriber()

    # Start listener in thread
    listener_thread = threading.Thread(target=subscriber.listen)
    listener_thread.start()

    # Dynamically manage subscriptions
    print("Managing subscriptions dynamically...\n")

    subscriber.add_pattern('events:*')
    time.sleep(2)

    subscriber.add_pattern('logs:*')
    time.sleep(2)

    subscriber.remove_pattern('events:*')
    time.sleep(2)

    subscriber.add_pattern('metrics:*')
    time.sleep(2)

    print("\nStopping subscriber...")
    subscriber.stop()
    listener_thread.join()

if __name__ == "__main__":
    main()
```

## Real-World Use Cases

### Use Case 1: Multi-Tenant Event System

Create `multitenant_events.py`:

```python
#!/usr/bin/env python3
import redis
import json

class TenantEventSubscriber:
    """Subscribe to events for specific tenants."""

    def __init__(self, tenant_ids):
        self.r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.pubsub = self.r.pubsub()
        self.tenant_ids = tenant_ids

        # Subscribe to tenant patterns
        patterns = [f'tenant:{tid}:*' for tid in tenant_ids]
        self.pubsub.psubscribe(*patterns)

        print(f"Subscribed to tenants: {', '.join(tenant_ids)}")

    def process_events(self):
        """Process tenant events."""
        for message in self.pubsub.listen():
            if message['type'] == 'pmessage':
                self.handle_event(message)

    def handle_event(self, message):
        """Handle individual tenant event."""
        channel = message['channel']
        parts = channel.split(':')

        tenant_id = parts[1]
        event_type = parts[2] if len(parts) > 2 else 'unknown'

        try:
            data = json.loads(message['data'])
        except json.JSONDecodeError:
            data = message['data']

        print(f"\nTenant: {tenant_id}")
        print(f"Event:  {event_type}")
        print(f"Data:   {data}")

def main():
    # Subscribe to specific tenants
    subscriber = TenantEventSubscriber(['acme', 'globex', 'initech'])
    subscriber.process_events()

if __name__ == "__main__":
    main()
```

### Use Case 2: Geographic Event Routing

Create `geo_routing.py`:

```python
#!/usr/bin/env python3
import redis
import json

class GeoEventRouter:
    """Route events by geographic region."""

    def __init__(self, regions):
        self.r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.pubsub = self.r.pubsub()
        self.regions = regions

        # Subscribe to region patterns
        patterns = [f'region:{region}:*' for region in regions]
        self.pubsub.psubscribe(*patterns)

        print(f"Routing events for regions: {', '.join(regions)}")

    def route_events(self):
        """Route events to region-specific handlers."""
        handlers = {
            'us-east': self.handle_us_east,
            'us-west': self.handle_us_west,
            'eu-central': self.handle_eu_central,
        }

        for message in self.pubsub.listen():
            if message['type'] == 'pmessage':
                channel = message['channel']
                region = channel.split(':')[1]

                handler = handlers.get(region)
                if handler:
                    handler(message)

    def handle_us_east(self, message):
        print(f"[US-EAST] Processing: {message['channel']}")

    def handle_us_west(self, message):
        print(f"[US-WEST] Processing: {message['channel']}")

    def handle_eu_central(self, message):
        print(f"[EU-CENTRAL] Processing: {message['channel']}")

def main():
    router = GeoEventRouter(['us-east', 'us-west', 'eu-central'])
    router.route_events()

if __name__ == "__main__":
    main()
```

### Use Case 3: Log Aggregation

Create `log_aggregator.py`:

```python
#!/usr/bin/env python3
import redis
import json
from datetime import datetime

class LogAggregator:
    """Aggregate logs from multiple services."""

    def __init__(self, log_levels):
        self.r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.pubsub = self.r.pubsub()
        self.log_levels = log_levels

        # Subscribe to log patterns by level
        patterns = [f'logs:*:{level}' for level in log_levels]
        self.pubsub.psubscribe(*patterns)

        print(f"Aggregating log levels: {', '.join(log_levels)}")

    def aggregate(self):
        """Aggregate and format logs."""
        for message in self.pubsub.listen():
            if message['type'] == 'pmessage':
                self.format_log(message)

    def format_log(self, message):
        """Format log entry."""
        channel = message['channel']
        parts = channel.split(':')

        service = parts[1] if len(parts) > 1 else 'unknown'
        level = parts[2] if len(parts) > 2 else 'info'

        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Color coding
        colors = {
            'debug': '\033[37m',    # White
            'info': '\033[32m',     # Green
            'warning': '\033[33m',  # Yellow
            'error': '\033[31m',    # Red
            'critical': '\033[35m'  # Magenta
        }
        reset = '\033[0m'

        color = colors.get(level, '')

        print(f"{timestamp} {color}[{level.upper():8}]{reset} "
              f"[{service:12}] {message['data']}")

def main():
    aggregator = LogAggregator(['warning', 'error', 'critical'])
    aggregator.aggregate()

if __name__ == "__main__":
    main()
```

## Performance Considerations

### Pattern Matching Overhead

Pattern matching has O(N*M) complexity where:
- N = number of active channels
- M = number of pattern subscriptions

**Optimization Tips:**
1. Use specific patterns over broad wildcards
2. Limit number of pattern subscriptions
3. Combine related patterns when possible
4. Monitor PUBSUB NUMPAT for pattern count

### Benchmarking

Create `pattern_benchmark.py`:

```python
#!/usr/bin/env python3
import redis
import time
import threading

def benchmark_patterns():
    """Compare exact vs pattern subscription performance."""
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)

    # Test 1: Exact subscriptions
    pubsub1 = r.pubsub()
    channels = [f'channel{i}' for i in range(100)]
    pubsub1.subscribe(*channels)

    start = time.time()
    for _ in range(1000):
        r.publish('channel50', 'test')
    exact_time = time.time() - start

    pubsub1.close()

    # Test 2: Pattern subscription
    pubsub2 = r.pubsub()
    pubsub2.psubscribe('channel*')

    start = time.time()
    for _ in range(1000):
        r.publish('channel50', 'test')
    pattern_time = time.time() - start

    pubsub2.close()

    print(f"Exact subscriptions: {exact_time:.3f}s")
    print(f"Pattern subscription: {pattern_time:.3f}s")
    print(f"Difference: {((pattern_time - exact_time) / exact_time * 100):.1f}%")

if __name__ == "__main__":
    benchmark_patterns()
```

## Best Practices

### 1. Pattern Design

```python
# Good: Specific, hierarchical patterns
pubsub.psubscribe('app:user:events:*')
pubsub.psubscribe('app:order:status:*')

# Avoid: Overly broad patterns
pubsub.psubscribe('*')  # Matches everything!
```

### 2. Pattern Organization

```python
# Organize by domain
patterns = {
    'user_domain': ['user:*:login', 'user:*:logout'],
    'order_domain': ['order:*:created', 'order:*:shipped'],
    'payment_domain': ['payment:*:processed']
}

for domain, domain_patterns in patterns.items():
    pubsub.psubscribe(*domain_patterns)
```

### 3. Resource Cleanup

```python
try:
    pubsub.psubscribe('events:*')
    for message in pubsub.listen():
        process(message)
finally:
    pubsub.punsubscribe()  # Clean up patterns
    pubsub.close()
```

### 4. Monitoring

```python
def monitor_patterns(r):
    """Monitor pattern subscriptions."""
    # Number of pattern subscriptions
    numpat = r.execute_command('PUBSUB NUMPAT')
    print(f"Active patterns: {numpat}")

    # Active channels
    channels = r.pubsub_channels()
    print(f"Active channels: {len(channels)}")
```

## Summary

In this tutorial, you learned:

1. Pattern subscription fundamentals with PSUBSCRIBE
2. Glob pattern syntax (*, ?, [])
3. Handling pattern messages in Python
4. Multi-pattern and overlapping subscriptions
5. Dynamic subscription management
6. Real-world use cases (multi-tenant, geo-routing, logs)
7. Performance considerations
8. Pattern design best practices

**Key Takeaways:**
- Pattern subscriptions enable dynamic channel management
- Use specific patterns to minimize overhead
- Pattern messages include pattern, channel, and data
- Overlapping patterns deliver multiple messages
- Ideal for hierarchical and multi-tenant architectures

**Next Steps:**
- [Tutorial 03: Redis Streams](../03_redis_streams/README.md) for persistent messaging
- [Tutorial 04: Consumer Groups](../04_consumer_groups/README.md) for distributed processing
