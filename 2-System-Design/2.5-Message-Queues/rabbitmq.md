# RabbitMQ - Message Broker

## Overview

RabbitMQ is a mature, robust **message broker** that implements the **Advanced Message Queuing Protocol (AMQP)**. It acts as a middleman for message passing, providing reliable delivery, flexible routing, and powerful features for distributed systems.

**When to Use RabbitMQ**:
- ✅ Microservices communication
- ✅ Task queues and background jobs
- ✅ Complex routing requirements
- ✅ Need for reliability and delivery guarantees
- ✅ Request-reply patterns (async RPC)

**When NOT to Use**:
- ❌ Need to store/replay events (use Kafka)
- ❌ Need millions of messages/sec (use Kafka)
- ❌ Simple use case on AWS (use SQS)
- ❌ Event sourcing (use Kafka)

---

## Core Architecture

### Key Components

```
┌──────────┐                      ┌──────────┐
│ Producer │                      │ Consumer │
└─────┬────┘                      └────▲─────┘
      │                                │
      │ 1. Publish message             │ 5. Deliver message
      ↓                                │
┌─────────────────────────────────────────────┐
│         RabbitMQ Broker                     │
│                                             │
│  ┌──────────┐  2. Route   ┌──────────┐    │
│  │ Exchange │──────────────>│  Queue   │    │
│  └──────────┘              └──────────┘    │
│      ↑                          │          │
│      │                          │          │
│      │ 3. Binding rules         │ 4. Store │
│      │    (routing key)         │  messages│
│                                             │
└─────────────────────────────────────────────┘
```

### 1. **Producer**
- Application that sends messages
- Publishes to an **exchange**
- Doesn't know which queue will receive

### 2. **Exchange**
- Routes messages to queues
- Types: Direct, Topic, Fanout, Headers
- Uses **routing keys** and **bindings**

### 3. **Binding**
- Link between exchange and queue
- Defines routing rules
- Specified by **binding key**

### 4. **Queue**
- Buffer that stores messages
- FIFO (First In, First Out)
- Can be durable (survives restarts)

### 5. **Consumer**
- Application that receives messages
- Subscribes to **queues** (not exchanges!)
- Acknowledges messages after processing

---

## Exchange Types

### 1. Direct Exchange

Routes messages based on **exact routing key match**.

```
Producer ──(routing_key="error")──> [Direct Exchange]
                                          │
                     ┌────────────────────┼────────────────────┐
                     │                    │                    │
                routing_key="error"  routing_key="info"  routing_key="warning"
                     │                    │                    │
                     ↓                    ↓                    ↓
               [Error Queue]         [Info Queue]       [Warning Queue]
                     │                    │                    │
                     ↓                    ↓                    ↓
              Error Consumer         Info Consumer      Warning Consumer
```

**Use case**: Log levels, task types

**Example**:
```python
# Producer
channel.basic_publish(
    exchange='logs',
    routing_key='error',  # Exact match
    body='Database connection failed'
)

# Consumer (binds queue to exchange with routing key)
channel.queue_bind(
    exchange='logs',
    queue='error_queue',
    routing_key='error'  # Only receive 'error' messages
)
```

**When to use**:
- Clear, distinct categories
- One-to-one routing
- Simple filtering

---

### 2. Topic Exchange

Routes based on **pattern matching** (wildcards).

**Wildcards**:
- `*` (star) = matches exactly one word
- `#` (hash) = matches zero or more words

```
Producer ──(routing_key="order.created.us")──> [Topic Exchange]
                                                      │
                        ┌─────────────────────────────┼─────────────────────┐
                        │                             │                     │
                   pattern="order.*"            pattern="*.created.*"  pattern="order.#"
                        │                             │                     │
                        ↓                             ↓                     ↓
                [All Orders Queue]           [Created Events Queue]  [Order Events Queue]
                        │                             │                     │
                        ↓                             ↓                     ↓
                  All orders                   All created           All order events
               (order.created.us)              events                 (any pattern)
               (order.updated.eu)        (user.created.us)
```

**Examples**:
```
Routing Key: "user.created.us"
- Matches: "user.*.*", "*.created.*", "user.#", "#.us", "#"
- Doesn't match: "user.created", "user.*.eu"

Routing Key: "order.updated.eu.premium"
- Matches: "order.#", "#.eu.#", "*.updated.#"
- Doesn't match: "order.*.eu", "*.updated.eu"
```

**Code Example**:
```python
# Producer
channel.basic_publish(
    exchange='events',
    routing_key='user.created.us',
    body=json.dumps({'user_id': 123})
)

# Consumer 1: All user events
channel.queue_bind(
    exchange='events',
    queue='user_events_queue',
    routing_key='user.#'  # user.created.us, user.updated.eu, etc.
)

# Consumer 2: All created events
channel.queue_bind(
    exchange='events',
    queue='created_events_queue',
    routing_key='*.created.*'  # user.created.us, order.created.eu
)
```

**Use case**: Event-driven architectures, multi-tenant systems, geo-routing

---

### 3. Fanout Exchange

Broadcasts message to **all bound queues** (ignores routing key).

```
Producer ──(routing_key ignored)──> [Fanout Exchange]
                                          │
                     ┌────────────────────┼────────────────────┐
                     │                    │                    │
                     ↓                    ↓                    ↓
               [Queue 1]              [Queue 2]           [Queue 3]
                     │                    │                    │
                     ↓                    ↓                    ↓
              Consumer 1            Consumer 2           Consumer 3
           (all get the same message)
```

**Use case**: Broadcasting, notifications, pub/sub

**Example**:
```python
# Producer
channel.basic_publish(
    exchange='notifications',
    routing_key='',  # Ignored
    body='System maintenance at 2 AM'
)

# Consumer 1: Email notifications
channel.queue_bind(exchange='notifications', queue='email_queue')

# Consumer 2: SMS notifications
channel.queue_bind(exchange='notifications', queue='sms_queue')

# Consumer 3: Push notifications
channel.queue_bind(exchange='notifications', queue='push_queue')

# All three consumers receive the same message!
```

---

### 4. Headers Exchange

Routes based on **message headers** (not routing key).

```
Producer ──(headers: {type:"pdf", priority:"high"})──> [Headers Exchange]
                                                              │
                                     ┌────────────────────────┼──────────────────────┐
                              headers match:               headers match:         headers match:
                           {type:"pdf", x-match:"all"}  {priority:"high"}     {type:"pdf", priority:"high"}
                                     │                        │                      │
                                     ↓                        ↓                      ↓
                              [PDF Queue]              [High Priority]       [High Priority PDFs]
```

**Example**:
```python
# Producer
properties = pika.BasicProperties(
    headers={
        'type': 'pdf',
        'priority': 'high',
        'region': 'us-east'
    }
)
channel.basic_publish(
    exchange='tasks',
    routing_key='',
    body='Generate report',
    properties=properties
)

# Consumer: Match ALL headers
channel.queue_bind(
    exchange='tasks',
    queue='pdf_high_queue',
    arguments={
        'x-match': 'all',  # All headers must match
        'type': 'pdf',
        'priority': 'high'
    }
)

# Consumer: Match ANY header
channel.queue_bind(
    exchange='tasks',
    queue='any_pdf_queue',
    arguments={
        'x-match': 'any',  # Any header matches
        'type': 'pdf'
    }
)
```

**Use case**: Complex routing based on multiple criteria

---

## Message Flow Example

### Scenario: E-commerce Order Processing

```
┌────────────────┐
│  Order Service │ (Producer)
└────────┬───────┘
         │
         │ Publishes: routing_key="order.created"
         │ Body: {"order_id": 123, "user_id": 456}
         ↓
    ┌────────────┐
    │   Topic    │
    │  Exchange  │
    │  "orders"  │
    └─────┬──────┘
          │
          ├─────────────────────────────────────────────┐
          │                                             │
    pattern="order.created"                      pattern="order.#"
          │                                             │
          ↓                                             ↓
    ┌──────────────┐                           ┌────────────────┐
    │ Inventory    │                           │ Analytics      │
    │ Queue        │                           │ Queue          │
    └──────┬───────┘                           └────────┬───────┘
           │                                            │
           ↓                                            ↓
    ┌──────────────┐                           ┌────────────────┐
    │ Inventory    │                           │ Analytics      │
    │ Service      │ (Consumer)                │ Service        │ (Consumer)
    │              │                           │                │
    │ - Decrease   │                           │ - Track sales  │
    │   stock      │                           │ - Update       │
    │ - Reserve    │                           │   dashboard    │
    └──────────────┘                           └────────────────┘
```

**Code**:
```python
# Order Service (Producer)
import pika
import json

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# Declare exchange
channel.exchange_declare(exchange='orders', exchange_type='topic')

# Publish order created event
order = {'order_id': 123, 'user_id': 456, 'items': [...]}
channel.basic_publish(
    exchange='orders',
    routing_key='order.created',
    body=json.dumps(order)
)

print("Order created event published")
connection.close()


# Inventory Service (Consumer)
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# Declare queue
channel.queue_declare(queue='inventory_queue', durable=True)

# Bind queue to exchange
channel.queue_bind(
    exchange='orders',
    queue='inventory_queue',
    routing_key='order.created'
)

# Consume messages
def callback(ch, method, properties, body):
    order = json.loads(body)
    print(f"Processing order {order['order_id']}")

    # Decrease stock
    decrease_stock(order['items'])

    # Acknowledge
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(
    queue='inventory_queue',
    on_message_callback=callback,
    auto_ack=False  # Manual acknowledgment
)

print("Waiting for orders...")
channel.start_consuming()


# Analytics Service (Consumer)
channel.queue_declare(queue='analytics_queue', durable=True)
channel.queue_bind(
    exchange='orders',
    queue='analytics_queue',
    routing_key='order.#'  # All order events
)

def analytics_callback(ch, method, properties, body):
    order = json.loads(body)
    # Track metrics
    track_sale(order)
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='analytics_queue', on_message_callback=analytics_callback)
channel.start_consuming()
```

---

## Advanced Features

### 1. Message Acknowledgments

**Auto-Ack** (dangerous):
```python
channel.basic_consume(
    queue='tasks',
    on_message_callback=callback,
    auto_ack=True  # Message deleted immediately
)
```
- Fast, but message lost if consumer crashes

**Manual-Ack** (recommended):
```python
def callback(ch, method, properties, body):
    try:
        process(body)
        ch.basic_ack(delivery_tag=method.delivery_tag)  # Success
    except Exception as e:
        ch.basic_nack(
            delivery_tag=method.delivery_tag,
            requeue=True  # Put back in queue
        )

channel.basic_consume(
    queue='tasks',
    on_message_callback=callback,
    auto_ack=False  # Manual control
)
```

**Negative Acknowledgment**:
```python
# Reject and requeue
ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

# Reject and discard (send to DLQ if configured)
ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
```

---

### 2. Message Persistence

**Durable Queue** (survives broker restart):
```python
channel.queue_declare(
    queue='tasks',
    durable=True  # Queue persists
)
```

**Persistent Messages** (survives broker restart):
```python
channel.basic_publish(
    exchange='',
    routing_key='tasks',
    body='Important task',
    properties=pika.BasicProperties(
        delivery_mode=2  # Persistent message
    )
)
```

**Both needed for full persistence**:
- Durable queue + persistent messages = survives crash

---

### 3. Prefetch (Fair Dispatch)

**Problem**: One consumer gets all messages while others idle

```
Consumer 1: [■■■■■■■■■■] (processing 10 slow messages)
Consumer 2: [□□□□□□□□□□] (idle)
Consumer 3: [□□□□□□□□□□] (idle)
```

**Solution**: Prefetch count
```python
channel.basic_qos(prefetch_count=1)
# Each consumer gets max 1 unacknowledged message
# Distributes load evenly

Consumer 1: [■] (processing 1, will get next when done)
Consumer 2: [■] (processing 1)
Consumer 3: [■] (processing 1)
```

**Code**:
```python
channel.basic_qos(prefetch_count=1)  # Fair dispatch
channel.basic_consume(queue='tasks', on_message_callback=callback, auto_ack=False)
```

---

### 4. TTL (Time To Live)

**Message TTL** (expires after N ms):
```python
channel.basic_publish(
    exchange='',
    routing_key='notifications',
    body='Limited offer!',
    properties=pika.BasicProperties(
        expiration='60000'  # 60 seconds in milliseconds
    )
)
```

**Queue TTL** (all messages expire):
```python
channel.queue_declare(
    queue='temp_queue',
    arguments={
        'x-message-ttl': 60000  # 60 seconds
    }
)
```

**Use case**: Temporary notifications, cache invalidation

---

### 5. Dead Letter Exchange (DLQ)

```
[Main Queue] ──(rejected/expired/max retries)──> [Dead Letter Exchange] ──> [DLQ]
```

**Setup**:
```python
# Declare DLX
channel.exchange_declare(exchange='dlx', exchange_type='direct')

# Declare DLQ
channel.queue_declare(queue='dead_letter_queue')
channel.queue_bind(exchange='dlx', queue='dead_letter_queue', routing_key='failed')

# Declare main queue with DLX
channel.queue_declare(
    queue='main_queue',
    arguments={
        'x-dead-letter-exchange': 'dlx',
        'x-dead-letter-routing-key': 'failed'
    }
)
```

**Messages go to DLQ when**:
- Rejected with `requeue=False`
- TTL expired
- Queue length exceeded

---

### 6. Priority Queues

```python
# Declare queue with max priority
channel.queue_declare(
    queue='priority_queue',
    arguments={'x-max-priority': 10}
)

# Publish high priority message
channel.basic_publish(
    exchange='',
    routing_key='priority_queue',
    body='Urgent task',
    properties=pika.BasicProperties(priority=9)
)

# Publish low priority message
channel.basic_publish(
    exchange='',
    routing_key='priority_queue',
    body='Regular task',
    properties=pika.BasicProperties(priority=1)
)

# High priority processed first!
```

---

## High Availability & Clustering

### 1. Clustering

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│ RabbitMQ 1 │────-│ RabbitMQ 2 │────-│ RabbitMQ 3 │
└────────────┘     └────────────┘     └────────────┘
      │                  │                  │
   (node 1)           (node 2)           (node 3)
```

**Benefits**:
- High availability
- Load distribution
- Failover

**Setup**:
```bash
# Node 1
rabbitmqctl stop_app
rabbitmqctl reset
rabbitmqctl start_app

# Node 2 (join cluster)
rabbitmqctl stop_app
rabbitmqctl reset
rabbitmqctl join_cluster rabbit@node1
rabbitmqctl start_app

# Node 3 (join cluster)
rabbitmqctl stop_app
rabbitmqctl reset
rabbitmqctl join_cluster rabbit@node1
rabbitmqctl start_app
```

---

### 2. Mirrored Queues (Deprecated → Quorum Queues)

**Old: Mirrored Queues**
```python
channel.queue_declare(
    queue='ha_queue',
    arguments={
        'x-ha-policy': 'all'  # Replicate to all nodes
    }
)
```

**New: Quorum Queues** (Recommended)
```python
channel.queue_declare(
    queue='quorum_queue',
    arguments={
        'x-queue-type': 'quorum'  # Raft-based replication
    }
)
```

**Benefits**:
- Data safety (replicated across nodes)
- Automatic leader election
- Better performance than mirrored queues

---

## Performance Optimization

### 1. Connection Pooling

❌ **Bad**: Create connection per message
```python
for i in range(1000):
    connection = pika.BlockingConnection(...)  # Expensive!
    channel = connection.channel()
    channel.basic_publish(...)
    connection.close()
```

✅ **Good**: Reuse connection
```python
connection = pika.BlockingConnection(...)
channel = connection.channel()

for i in range(1000):
    channel.basic_publish(...)  # Reuse channel

connection.close()
```

---

### 2. Batch Publishing

```python
# Batch 100 messages, then confirm
for i in range(1000):
    channel.basic_publish(...)

    if i % 100 == 0:
        channel.confirm_delivery()  # Wait for batch confirmation
```

---

### 3. Consumer Prefetch

```python
# Tune based on processing time
channel.basic_qos(prefetch_count=10)  # Fetch 10 at a time
```

**Guideline**:
- Fast tasks (< 1s): Higher prefetch (10-100)
- Slow tasks (> 10s): Lower prefetch (1-5)

---

## Monitoring

**Key Metrics**:
- **Queue Depth**: Messages waiting (alert if too high)
- **Message Rate**: Messages/sec (publish + deliver)
- **Consumer Count**: Active consumers
- **Unacknowledged**: Messages in-flight
- **Connection Count**: Active connections

**Tools**:
```bash
# Management UI
http://localhost:15672

# CLI
rabbitmqctl list_queues name messages consumers
rabbitmqctl list_exchanges
rabbitmqctl list_bindings
```

---

## Common Patterns

### 1. Work Queue (Competing Consumers)
```
[Producer] ──> [Queue] ──┬──> Consumer 1
                         ├──> Consumer 2
                         └──> Consumer 3
```

### 2. Pub/Sub (Fanout)
```
[Publisher] ──> [Fanout Exchange] ──┬──> Queue 1 ──> Sub 1
                                    ├──> Queue 2 ──> Sub 2
                                    └──> Queue 3 ──> Sub 3
```

### 3. Routing (Direct)
```
[Producer] ──> [Direct Exchange] ──┬── (error) ──> Error Queue
                                   ├── (info) ──> Info Queue
                                   └── (warning) ──> Warning Queue
```

### 4. Topics (Pattern Matching)
```
[Producer] ──> [Topic Exchange] ──┬── (*.critical.*) ──> Critical Queue
                                  ├── (app.*) ──> App Logs Queue
                                  └── (#.error) ──> All Errors Queue
```

### 5. RPC (Request-Reply)
```
Client ──(request + reply_queue)──> [Request Queue] ──> Server
   ↑                                                      │
   └──────────[Reply Queue]─────────────────────────────-┘
```

---

## Interview Questions

**Q: "How does RabbitMQ ensure message delivery?"**
- Durable queues + persistent messages
- Manual acknowledgments
- Dead letter queues
- Clustering/quorum queues

**Q: "Difference between Direct and Topic exchange?"**
- Direct: Exact routing key match
- Topic: Pattern matching with wildcards (*, #)

**Q: "How to handle poison pills in RabbitMQ?"**
- Max retry with counter in message headers
- Dead letter exchange for failed messages
- Circuit breaker pattern

---

## Best Practices

✅ **DO**:
- Use manual acknowledgments
- Enable persistence for important messages
- Set prefetch count for fair dispatch
- Use quorum queues for HA
- Monitor queue depth
- Implement DLQ

❌ **DON'T**:
- Use auto-ack for important messages
- Create connection per message
- Forget to close connections
- Ignore unacknowledged messages
- Skip error handling

---

## Summary

**RabbitMQ is best for**:
- Microservices communication
- Task queues with flexible routing
- Request-reply patterns
- Reliable message delivery

**Key strengths**:
- Flexible routing (exchanges)
- Mature and battle-tested
- Great documentation
- Management UI

**Limitations**:
- Not for event streaming (use Kafka)
- Lower throughput than Kafka
- More complex than SQS

**Next**: Compare with [Kafka](./kafka.md) or [AWS SQS](./aws-sqs-sns.md)
