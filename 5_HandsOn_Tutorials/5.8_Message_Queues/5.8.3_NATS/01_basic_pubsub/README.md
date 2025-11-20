# Tutorial 01: Basic Pub/Sub with NATS

## Overview

This tutorial introduces Core NATS publish/subscribe patterns, the foundation of all NATS messaging. You'll learn to set up a NATS server, understand subject hierarchies, use wildcards, and build Python publishers and subscribers. Core NATS provides at-most-once delivery with minimal latency, making it perfect for real-time, ephemeral messaging.

## Learning Objectives

- Set up NATS server using Docker
- Understand NATS subject naming and hierarchies
- Use wildcards (* and >) for flexible subscriptions
- Implement Python publishers and subscribers with nats-py
- Handle connections, reconnections, and errors
- Understand at-most-once delivery semantics
- Test different subject patterns

## Prerequisites

- Docker installed
- Python 3.8+
- Basic async/await knowledge
- Text editor or IDE

## Architecture

```
┌─────────────┐                  ┌─────────────┐
│ Publisher 1 │─────┐            │Subscriber A │
└─────────────┘     │            └─────────────┘
                    │                    ▲
                    │                    │
                    ▼                    │
              ┌──────────────┐           │
              │ NATS Server  │───────────┤
              │  (In-Memory) │           │
              └──────────────┘           │
                    ▲                    │
                    │                    │
                    │                    ▼
┌─────────────┐     │            ┌─────────────┐
│ Publisher 2 │─────┘            │Subscriber B │
└─────────────┘                  └─────────────┘

Subject: "orders.created"
Delivery: At-most-once (fire and forget)
Storage: In-memory only
```

## Step 1: Start NATS Server with Docker

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  nats:
    image: nats:2.10-alpine
    container_name: nats-server
    ports:
      - "4222:4222"    # Client connections
      - "8222:8222"    # HTTP monitoring
      - "6222:6222"    # Cluster routing (for future use)
    command:
      - "--name=nats-01"
      - "--http_port=8222"
      - "-V"           # Verbose logging
    restart: unless-stopped
    networks:
      - nats-network

networks:
  nats-network:
    driver: bridge
```

Start the server:

```bash
docker-compose up -d

# Verify server is running
docker ps | grep nats

# Check server info via HTTP monitoring
curl http://localhost:8222/varz
```

Expected output includes server uptime, connections, and configuration.

## Step 2: Install Python Client

```bash
pip install nats-py asyncio
```

## Step 3: Understanding NATS Subjects

NATS uses subject-based addressing. Subjects are case-sensitive strings that form hierarchies using dots.

### Subject Examples

```
orders.created                    # Specific event
users.registered
products.inventory.updated
sensor.temperature.warehouse.1
api.v1.users.login
```

### Wildcard Patterns

1. **`*` (single token wildcard)**: Matches exactly one token

```
orders.*        matches: orders.created, orders.updated
                does NOT match: orders.shipped.confirmed
```

2. **`>` (multi-token wildcard)**: Matches one or more tokens

```
orders.>        matches: orders.created
                         orders.updated
                         orders.shipped.confirmed
                         orders.cancelled.refund.processed
```

### Best Practices

- Use lowercase with dots: `service.action.resource`
- Keep subjects under 128 characters
- Plan for hierarchy: `<namespace>.<service>.<action>.<resource>`
- Version when needed: `api.v1.users.created`

## Step 4: Basic Publisher

Create `publisher.py`:

```python
import asyncio
import nats
from datetime import datetime
import json

async def main():
    # Connect to NATS server
    nc = await nats.connect("nats://localhost:4222")

    print("Connected to NATS")
    print("Publishing messages to 'orders.created'...")

    # Publish 10 messages
    for i in range(10):
        message = {
            "order_id": f"ORD-{i:05d}",
            "product": "Widget",
            "quantity": i + 1,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Publish message
        await nc.publish(
            "orders.created",
            json.dumps(message).encode()
        )
        print(f"Published: {message['order_id']}")

        await asyncio.sleep(1)  # 1 message per second

    # Flush to ensure all messages are sent
    await nc.flush()

    # Close connection
    await nc.close()
    print("Connection closed")

if __name__ == '__main__':
    asyncio.run(main())
```

Run the publisher:

```bash
python publisher.py
```

## Step 5: Basic Subscriber

Create `subscriber.py`:

```python
import asyncio
import nats
import json

async def main():
    # Connect to NATS
    nc = await nats.connect("nats://localhost:4222")

    print("Connected to NATS")
    print("Listening on 'orders.created'...")

    # Message handler
    async def message_handler(msg):
        subject = msg.subject
        data = msg.data.decode()
        message = json.loads(data)

        print(f"\n[Received] Subject: {subject}")
        print(f"  Order ID: {message['order_id']}")
        print(f"  Product: {message['product']}")
        print(f"  Quantity: {message['quantity']}")
        print(f"  Timestamp: {message['timestamp']}")

    # Subscribe to subject
    await nc.subscribe("orders.created", cb=message_handler)

    print("\nWaiting for messages (Ctrl+C to exit)...")

    # Keep running indefinitely
    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Run the subscriber (in a new terminal):

```bash
python subscriber.py
```

## Step 6: Wildcard Subscriptions

Create `wildcard_subscriber.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")

    print("Connected to NATS")

    # Handler for all order events
    async def order_handler(msg):
        print(f"\n[Order Handler] Subject: {msg.subject}")
        print(f"  Data: {msg.data.decode()}")

    # Handler for shipped events specifically
    async def shipped_handler(msg):
        print(f"\n[Shipped Handler] Subject: {msg.subject}")
        print(f"  Data: {msg.data.decode()}")

    # Subscribe with wildcards
    await nc.subscribe("orders.*", cb=order_handler)
    await nc.subscribe("orders.shipped.>", cb=shipped_handler)

    print("\nSubscribed to:")
    print("  1. orders.* (single-level wildcard)")
    print("  2. orders.shipped.> (multi-level wildcard)")
    print("\nWaiting for messages (Ctrl+C to exit)...")

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Create `wildcard_publisher.py` to test different subjects:

```python
import asyncio
import nats
import json

async def main():
    nc = await nats.connect("nats://localhost:4222")

    subjects = [
        "orders.created",              # Matches orders.*
        "orders.updated",              # Matches orders.*
        "orders.shipped.confirmed",    # Matches orders.shipped.>
        "orders.shipped.tracking",     # Matches orders.shipped.>
        "orders.cancelled",            # Matches orders.*
    ]

    for subject in subjects:
        message = {"event": subject, "data": "test"}
        await nc.publish(subject, json.dumps(message).encode())
        print(f"Published to: {subject}")
        await asyncio.sleep(0.5)

    await nc.flush()
    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 7: Connection Handling and Reconnection

Create `resilient_subscriber.py` with proper error handling:

```python
import asyncio
import nats
from nats.errors import ConnectionClosedError, TimeoutError, NoServersError

async def main():
    async def error_cb(e):
        print(f"Error: {e}")

    async def disconnected_cb():
        print("Disconnected from NATS")

    async def reconnected_cb():
        print("Reconnected to NATS")

    async def closed_cb():
        print("Connection closed")

    # Connect with options
    nc = await nats.connect(
        servers=["nats://localhost:4222"],
        error_cb=error_cb,
        disconnected_cb=disconnected_cb,
        reconnected_cb=reconnected_cb,
        closed_cb=closed_cb,
        max_reconnect_attempts=10,
        reconnect_time_wait=2,  # 2 seconds between attempts
        name="resilient-subscriber"
    )

    print(f"Connected to NATS: {nc.connected_url}")

    async def message_handler(msg):
        print(f"Received on {msg.subject}: {msg.data.decode()}")

    await nc.subscribe("test.>", cb=message_handler)

    print("Listening for messages...")
    print("Try stopping and restarting NATS server to test reconnection")

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print("\nShutting down gracefully...")
    finally:
        # Drain connection (finish processing pending messages)
        await nc.drain()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 8: Testing Multiple Subscribers

NATS Core delivers each message to ALL matching subscribers (fan-out pattern).

Create `multiple_subscribers.py`:

```python
import asyncio
import nats

async def run_subscriber(name, subject):
    nc = await nats.connect("nats://localhost:4222")

    async def handler(msg):
        print(f"[{name}] Received on {msg.subject}: {msg.data.decode()}")

    await nc.subscribe(subject, cb=handler)
    print(f"[{name}] Subscribed to {subject}")

    # Keep running
    await asyncio.Future()

async def main():
    # Run 3 subscribers in parallel
    await asyncio.gather(
        run_subscriber("Subscriber-1", "events.>"),
        run_subscriber("Subscriber-2", "events.user.*"),
        run_subscriber("Subscriber-3", "events.user.login")
    )

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutdown complete")
```

Run it and publish messages:

```bash
# Terminal 1
python multiple_subscribers.py

# Terminal 2
nats pub events.user.login "User logged in"
nats pub events.user.logout "User logged out"
nats pub events.system.startup "System started"
```

## Step 9: Monitoring and Debugging

### Check Server Status

```bash
# Server info
curl -s http://localhost:8222/varz | jq

# Connections
curl -s http://localhost:8222/connz | jq

# Subscriptions
curl -s http://localhost:8222/subsz | jq

# Routing information
curl -s http://localhost:8222/routez | jq
```

### NATS CLI Tools

```bash
# Install NATS CLI
brew install nats-io/nats-tools/nats  # macOS
# OR
curl -sf https://binaries.nats.dev/nats-io/natscli/nats@latest | sh

# Publish from CLI
nats pub test.subject "Hello from CLI"

# Subscribe from CLI
nats sub test.subject

# Subscribe with wildcards
nats sub "test.>"

# Bench testing (performance)
nats bench test.subject --pub 2 --sub 2 --msgs 10000
```

## Understanding At-Most-Once Delivery

Core NATS provides **at-most-once** delivery semantics:

```
Publisher ──┬──> Message ──> [NATS Server] ──┬──> Subscriber A
            │                                 │
            └──> (no retry if fails)         └──> Subscriber B
                                                   (if B is offline,
                                                    message is lost)
```

**Key Points:**
- No persistence: messages are in-memory only
- No acknowledgments required
- Messages are lost if no subscriber is listening
- Extremely fast (sub-millisecond latency)
- Perfect for telemetry, logs, real-time updates

**When you need guarantees**, use JetStream (covered in Tutorial 04).

## Common Patterns

### Pattern 1: Fan-Out (Broadcast)

```python
# Multiple subscribers receive the same message
# Subscriber 1: orders.created
# Subscriber 2: orders.created
# Subscriber 3: orders.created

# Publisher sends once -> All 3 receive it
```

### Pattern 2: Subject Filtering

```python
# Different services subscribe to different subjects
# Analytics: orders.>
# Email Service: orders.created
# Inventory: orders.updated, orders.cancelled
```

### Pattern 3: Namespace Isolation

```python
# Separate environments/tenants by prefix
# tenant1.orders.created
# tenant2.orders.created
# Production: prod.orders.created
# Development: dev.orders.created
```

## Exercises

### Exercise 1: Temperature Monitoring
Create a temperature sensor simulator that publishes to `sensor.temperature.{location}` and multiple subscribers that:
- One subscribes to all sensors: `sensor.temperature.>`
- One subscribes to warehouse only: `sensor.temperature.warehouse`
- One subscribes to datacenter only: `sensor.temperature.datacenter`

### Exercise 2: Hierarchical Logging
Build a logging system with subjects: `logs.{level}.{service}` (e.g., `logs.error.api`, `logs.info.database`). Create subscribers that:
- Monitor all errors: `logs.error.>`
- Monitor specific service: `logs.*.api`
- Monitor all logs: `logs.>`

### Exercise 3: Reconnection Testing
Write a script that:
1. Connects to NATS
2. Subscribes to a subject
3. Automatically detects disconnection
4. Attempts reconnection with exponential backoff
5. Logs all connection state changes

## Best Practices

1. **Connection Management**
   - Always handle disconnection callbacks
   - Implement proper shutdown with `drain()`
   - Use connection pooling for high-throughput apps

2. **Subject Design**
   - Plan hierarchy before implementation
   - Use consistent naming conventions
   - Document subject patterns

3. **Error Handling**
   - Catch connection errors
   - Handle timeout scenarios
   - Log all errors for debugging

4. **Performance**
   - Keep message payloads reasonable (<1MB)
   - Use `flush()` when immediate delivery is required
   - Don't create excessive subscriptions

## Troubleshooting

### Messages Not Received
- Ensure subscriber is running BEFORE publishing
- Check subject names match exactly (case-sensitive)
- Verify NATS server is running: `docker ps`

### Connection Refused
```bash
# Check if port is open
telnet localhost 4222

# Check Docker container
docker logs nats-server
```

### Slow Performance
- Check network latency
- Monitor server stats: `curl http://localhost:8222/varz`
- Reduce message size if possible

## Summary

You've learned:
- ✅ NATS server setup with Docker
- ✅ Subject hierarchies and naming
- ✅ Wildcard subscriptions (* and >)
- ✅ Python publishers and subscribers
- ✅ Connection handling and reconnection
- ✅ At-most-once delivery semantics
- ✅ Monitoring and debugging

## Next Steps

- **Tutorial 02**: Learn request-reply patterns for RPC-style communication
- **Tutorial 03**: Master queue groups for load balancing
- **Tutorial 04**: Enable persistence with JetStream

## Resources

- [NATS Subjects Documentation](https://docs.nats.io/nats-concepts/subjects)
- [nats-py GitHub](https://github.com/nats-io/nats.py)
- [NATS by Example - Pub/Sub](https://natsbyexample.com/)

---

**Estimated Time**: 2-3 hours
**Difficulty**: Beginner
