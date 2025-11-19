# Tutorial 02: RabbitMQ Exchanges

## Objectives

By the end of this tutorial, you will:
- Understand the four exchange types: direct, topic, fanout, and headers
- Learn when to use each exchange type
- Implement producers and consumers for each exchange type
- Master routing keys and binding patterns
- Understand exchange-to-exchange bindings
- Learn exchange durability and auto-delete behavior
- Build a complete multi-exchange message routing system

## Prerequisites

- Completed Tutorial 01: RabbitMQ Basic Setup
- Docker and Docker Compose installed
- Python 3.8+ installed
- Basic understanding of message routing
- RabbitMQ Management UI access

## What are Exchanges?

Exchanges are routing components in RabbitMQ that receive messages from producers and route them to queues based on rules called bindings. Unlike the default exchange used in Tutorial 01, named exchanges provide powerful routing capabilities.

### Exchange Architecture

```
Producer → Exchange → [Bindings] → Queues → Consumer
                ↓
         Routing Rules
```

### Four Exchange Types

1. **Direct Exchange**: Routes messages with exact routing key match
2. **Topic Exchange**: Routes messages with pattern matching (* and #)
3. **Fanout Exchange**: Broadcasts messages to all bound queues
4. **Headers Exchange**: Routes based on message header attributes

## When to Use Each Exchange Type?

### Direct Exchange
- **Use when**: You need precise routing based on criteria
- **Examples**: Task distribution by priority, service-specific routing
- **Routing**: Exact match between routing key and binding key

### Topic Exchange
- **Use when**: You need pattern-based routing with wildcards
- **Examples**: Log aggregation, event categorization, multi-tenant systems
- **Routing**: Pattern matching with `*` (one word) and `#` (zero or more words)

### Fanout Exchange
- **Use when**: You need to broadcast messages to multiple consumers
- **Examples**: Cache invalidation, notifications, real-time updates
- **Routing**: Ignores routing key, sends to all bound queues

### Headers Exchange
- **Use when**: You need complex routing based on multiple attributes
- **Examples**: Content-based routing, multi-criteria filtering
- **Routing**: Matches message headers (x-match: all/any)

## Step-by-Step Instructions

### Step 1: Create Docker Compose File

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3.12-management
    container_name: rabbitmq_exchanges
    hostname: rabbitmq
    ports:
      - "5672:5672"    # AMQP protocol port
      - "15672:15672"  # Management UI port
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
      RABBITMQ_DEFAULT_VHOST: /
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
      - rabbitmq_logs:/var/log/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - rabbitmq_network

volumes:
  rabbitmq_data:
  rabbitmq_logs:

networks:
  rabbitmq_network:
    driver: bridge
```

### Step 2: Start RabbitMQ

```bash
docker-compose up -d
docker-compose logs -f rabbitmq
```

Wait for: `Server startup complete`

### Step 3: Direct Exchange Example

Create `direct_producer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys
from datetime import datetime

def send_direct_message(severity, message_text):
    """Send message to direct exchange with severity routing key"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare direct exchange
    exchange_name = 'logs_direct'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='direct',
        durable=True,
        auto_delete=False
    )

    message = {
        'severity': severity,
        'message': message_text,
        'timestamp': datetime.now().isoformat()
    }

    # Publish with routing key = severity
    channel.basic_publish(
        exchange=exchange_name,
        routing_key=severity,
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=2,  # Persistent
            content_type='application/json'
        )
    )

    print(f"✓ Sent [{severity}]: {message_text}")
    connection.close()

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python direct_producer.py <severity> <message>")
        print("Example: python direct_producer.py error 'Database connection failed'")
        sys.exit(1)

    severity = sys.argv[1]
    message = ' '.join(sys.argv[2:])
    send_direct_message(severity, message)
```

Create `direct_consumer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys

def callback(ch, method, properties, body):
    """Process received message"""
    message = json.loads(body)
    print(f"✓ [{message['severity']}] {message['message']}")
    print(f"  Timestamp: {message['timestamp']}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

def consume_direct_messages(severities):
    """Consume messages from direct exchange filtered by severity"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare exchange
    exchange_name = 'logs_direct'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='direct',
        durable=True
    )

    # Create exclusive queue
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue

    # Bind queue for each severity
    for severity in severities:
        channel.queue_bind(
            exchange=exchange_name,
            queue=queue_name,
            routing_key=severity
        )
        print(f"Bound to severity: {severity}")

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=False
    )

    print(f"\n⏳ Waiting for {severities} messages. Press CTRL+C to exit")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print('\n✓ Consumer stopped')
        channel.stop_consuming()

    connection.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python direct_consumer.py <severity1> [severity2] ...")
        print("Example: python direct_consumer.py error warning")
        sys.exit(1)

    severities = sys.argv[1:]
    consume_direct_messages(severities)
```

### Step 4: Topic Exchange Example

Create `topic_producer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys
from datetime import datetime

def send_topic_message(routing_key, message_text):
    """Send message to topic exchange with pattern-based routing key"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare topic exchange
    exchange_name = 'logs_topic'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='topic',
        durable=True
    )

    message = {
        'routing_key': routing_key,
        'message': message_text,
        'timestamp': datetime.now().isoformat()
    }

    channel.basic_publish(
        exchange=exchange_name,
        routing_key=routing_key,
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=2,
            content_type='application/json'
        )
    )

    print(f"✓ Sent [{routing_key}]: {message_text}")
    connection.close()

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python topic_producer.py <routing.key> <message>")
        print("Examples:")
        print("  python topic_producer.py kern.critical 'System crash'")
        print("  python topic_producer.py app.error 'Database error'")
        print("  python topic_producer.py app.info 'User logged in'")
        sys.exit(1)

    routing_key = sys.argv[1]
    message = ' '.join(sys.argv[2:])
    send_topic_message(routing_key, message)
```

Create `topic_consumer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys

def callback(ch, method, properties, body):
    """Process received message"""
    message = json.loads(body)
    print(f"✓ [{method.routing_key}] {message['message']}")
    print(f"  Timestamp: {message['timestamp']}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

def consume_topic_messages(binding_keys):
    """Consume messages from topic exchange with pattern matching"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare exchange
    exchange_name = 'logs_topic'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='topic',
        durable=True
    )

    # Create exclusive queue
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue

    # Bind queue with each pattern
    for binding_key in binding_keys:
        channel.queue_bind(
            exchange=exchange_name,
            queue=queue_name,
            routing_key=binding_key
        )
        print(f"Bound to pattern: {binding_key}")

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=False
    )

    print(f"\n⏳ Waiting for messages matching {binding_keys}. Press CTRL+C to exit")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print('\n✓ Consumer stopped')
        channel.stop_consuming()

    connection.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python topic_consumer.py <pattern1> [pattern2] ...")
        print("Patterns:")
        print("  * (star) - matches exactly one word")
        print("  # (hash) - matches zero or more words")
        print("\nExamples:")
        print("  python topic_consumer.py '*.critical'        # All critical messages")
        print("  python topic_consumer.py 'kern.*'           # All kernel messages")
        print("  python topic_consumer.py 'app.#'            # All app messages")
        print("  python topic_consumer.py '#'                # All messages")
        sys.exit(1)

    binding_keys = sys.argv[1:]
    consume_topic_messages(binding_keys)
```

### Step 5: Fanout Exchange Example

Create `fanout_producer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys
from datetime import datetime

def broadcast_message(message_text):
    """Broadcast message to all queues bound to fanout exchange"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare fanout exchange
    exchange_name = 'notifications'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='fanout',
        durable=True
    )

    message = {
        'message': message_text,
        'timestamp': datetime.now().isoformat()
    }

    # Routing key is ignored for fanout
    channel.basic_publish(
        exchange=exchange_name,
        routing_key='',  # Ignored
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=2,
            content_type='application/json'
        )
    )

    print(f"✓ Broadcasted: {message_text}")
    connection.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python fanout_producer.py <message>")
        print("Example: python fanout_producer.py 'System maintenance in 10 minutes'")
        sys.exit(1)

    message = ' '.join(sys.argv[1:])
    broadcast_message(message)
```

Create `fanout_consumer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys

def callback(ch, method, properties, body):
    """Process received broadcast message"""
    message = json.loads(body)
    consumer_id = sys.argv[1] if len(sys.argv) > 1 else "unknown"
    print(f"✓ [Consumer {consumer_id}] Received: {message['message']}")
    print(f"  Timestamp: {message['timestamp']}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

def consume_broadcasts(consumer_id):
    """Consume broadcast messages from fanout exchange"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare exchange
    exchange_name = 'notifications'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='fanout',
        durable=True
    )

    # Create exclusive queue (unique per consumer)
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue

    # Bind to fanout exchange (no routing key needed)
    channel.queue_bind(
        exchange=exchange_name,
        queue=queue_name
    )

    print(f"Consumer {consumer_id} bound to notifications exchange")

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=False
    )

    print(f"⏳ Waiting for broadcasts. Press CTRL+C to exit")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print('\n✓ Consumer stopped')
        channel.stop_consuming()

    connection.close()

if __name__ == '__main__':
    consumer_id = sys.argv[1] if len(sys.argv) > 1 else "1"
    consume_broadcasts(consumer_id)
```

### Step 6: Headers Exchange Example

Create `headers_producer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys
from datetime import datetime

def send_with_headers(headers, message_text):
    """Send message to headers exchange with custom headers"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare headers exchange
    exchange_name = 'headers_exchange'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='headers',
        durable=True
    )

    message = {
        'headers': headers,
        'message': message_text,
        'timestamp': datetime.now().isoformat()
    }

    channel.basic_publish(
        exchange=exchange_name,
        routing_key='',  # Ignored for headers exchange
        body=json.dumps(message),
        properties=pika.BasicProperties(
            headers=headers,
            delivery_mode=2,
            content_type='application/json'
        )
    )

    print(f"✓ Sent with headers {headers}: {message_text}")
    connection.close()

if __name__ == '__main__':
    # Example headers
    examples = {
        '1': ({'format': 'pdf', 'type': 'report'}, 'Q1 Financial Report'),
        '2': ({'format': 'json', 'type': 'log'}, 'Application logs'),
        '3': ({'format': 'xml', 'type': 'config'}, 'System configuration'),
    }

    if len(sys.argv) < 2:
        print("Usage: python headers_producer.py <example_number>")
        print("\nExamples:")
        for key, (headers, msg) in examples.items():
            print(f"  {key}: {headers} -> '{msg}'")
        sys.exit(1)

    choice = sys.argv[1]
    if choice in examples:
        headers, message = examples[choice]
        send_with_headers(headers, message)
    else:
        print(f"Invalid choice. Choose from: {list(examples.keys())}")
```

Create `headers_consumer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys

def callback(ch, method, properties, body):
    """Process received message based on headers"""
    message = json.loads(body)
    print(f"✓ Received: {message['message']}")
    print(f"  Headers: {message['headers']}")
    print(f"  Timestamp: {message['timestamp']}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

def consume_by_headers(match_headers, match_type='all'):
    """Consume messages from headers exchange based on header matching"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare exchange
    exchange_name = 'headers_exchange'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='headers',
        durable=True
    )

    # Create exclusive queue
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue

    # Prepare binding arguments
    binding_args = match_headers.copy()
    binding_args['x-match'] = match_type  # 'all' or 'any'

    # Bind queue with header matching rules
    channel.queue_bind(
        exchange=exchange_name,
        queue=queue_name,
        arguments=binding_args
    )

    print(f"Bound with headers: {match_headers}")
    print(f"Match type: {match_type}")

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=False
    )

    print(f"\n⏳ Waiting for messages. Press CTRL+C to exit")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print('\n✓ Consumer stopped')
        channel.stop_consuming()

    connection.close()

if __name__ == '__main__':
    # Example: Match messages with format=pdf
    match_headers = {'format': 'pdf'}
    match_type = 'all'  # Can be 'all' or 'any'

    if len(sys.argv) > 1:
        print("Consuming messages with format=pdf")

    consume_by_headers(match_headers, match_type)
```

### Step 7: Test Each Exchange Type

**Test Direct Exchange:**
```bash
# Terminal 1: Start error consumer
python direct_consumer.py error

# Terminal 2: Start warning consumer
python direct_consumer.py warning

# Terminal 3: Send messages
python direct_producer.py error "Database connection failed"
python direct_producer.py warning "High memory usage"
python direct_producer.py info "User logged in"
```

**Test Topic Exchange:**
```bash
# Terminal 1: All critical messages
python topic_consumer.py "*.critical"

# Terminal 2: All kernel messages
python topic_consumer.py "kern.*"

# Terminal 3: Send messages
python topic_producer.py kern.critical "System crash detected"
python topic_producer.py app.critical "Out of memory"
python topic_producer.py kern.info "Module loaded"
```

**Test Fanout Exchange:**
```bash
# Terminal 1: Consumer 1
python fanout_consumer.py 1

# Terminal 2: Consumer 2
python fanout_consumer.py 2

# Terminal 3: Send broadcast
python fanout_producer.py "System maintenance at 10 PM"
```

**Test Headers Exchange:**
```bash
# Terminal 1: Start consumer
python headers_consumer.py

# Terminal 2: Send messages
python headers_producer.py 1  # PDF report - will be received
python headers_producer.py 2  # JSON log - won't be received
```

## Expected Output

### Direct Exchange Output:
```
Error Consumer:
✓ [error] Database connection failed
  Timestamp: 2024-01-15T10:30:00.123456

Warning Consumer:
✓ [warning] High memory usage
  Timestamp: 2024-01-15T10:30:05.234567
```

### Topic Exchange Output:
```
Consumer (*.critical):
✓ [kern.critical] System crash detected
  Timestamp: 2024-01-15T10:35:00.123456
✓ [app.critical] Out of memory
  Timestamp: 2024-01-15T10:35:05.234567

Consumer (kern.*):
✓ [kern.critical] System crash detected
  Timestamp: 2024-01-15T10:35:00.123456
✓ [kern.info] Module loaded
  Timestamp: 2024-01-15T10:35:10.345678
```

### Fanout Exchange Output:
```
Consumer 1:
✓ [Consumer 1] Received: System maintenance at 10 PM
  Timestamp: 2024-01-15T10:40:00.123456

Consumer 2:
✓ [Consumer 2] Received: System maintenance at 10 PM
  Timestamp: 2024-01-15T10:40:00.123456
```

## Explanation

### Direct Exchange Routing

```
Producer --[severity=error]--> Direct Exchange
                                      |
                    +----------------+----------------+
                    |                                 |
            [key=error]                         [key=warning]
                    |                                 |
              Error Queue                       Warning Queue
```

- Routing key must **exactly match** binding key
- One-to-one or one-to-many routing
- Each queue can have multiple binding keys

### Topic Exchange Routing

```
Routing Key: "kern.critical.memory"

Patterns that match:
  ✓ "kern.critical.memory"    (exact)
  ✓ "kern.critical.*"         (* = one word)
  ✓ "kern.#"                  (# = zero or more words)
  ✓ "#.critical.#"
  ✓ "#"                       (all messages)

Patterns that don't match:
  ✗ "kern.*"                  (needs exactly one word after kern)
  ✗ "app.#"                   (different first word)
```

### Fanout Exchange Routing

- Ignores routing key completely
- Broadcasts to **all** bound queues
- Fastest exchange type (no routing logic)
- Perfect for pub/sub pattern

### Headers Exchange Routing

**x-match: all** - All headers must match
```python
Message headers: {'format': 'pdf', 'type': 'report'}
Binding args: {'format': 'pdf', 'type': 'report', 'x-match': 'all'}
Result: ✓ Match
```

**x-match: any** - At least one header must match
```python
Message headers: {'format': 'pdf', 'type': 'report'}
Binding args: {'format': 'pdf', 'x-match': 'any'}
Result: ✓ Match
```

## Verification Steps

### 1. Check Exchanges in Management UI
```
Navigate to: http://localhost:15672
Click: Exchanges tab
Verify: logs_direct, logs_topic, notifications, headers_exchange
```

### 2. View Bindings
```bash
docker exec rabbitmq_exchanges rabbitmqctl list_bindings
```

### 3. Check Exchange Details
```bash
docker exec rabbitmq_exchanges rabbitmqctl list_exchanges name type durable auto_delete
```

### 4. Monitor Message Rates
```
Management UI → Exchanges → Click exchange name
View: Message rates graph, incoming/outgoing rates
```

## Troubleshooting

### Issue: Messages Not Routed

**Direct/Topic Exchange:**
- Verify routing key matches binding pattern
- Check exchange exists and is correct type
- Confirm queue is bound to exchange

**Topic Exchange Specific:**
- Ensure pattern uses correct wildcards (* vs #)
- Remember: words are separated by dots
- Test with pattern `#` to receive all messages

**Headers Exchange:**
- Verify headers are set in message properties
- Check x-match type (all vs any)
- Confirm header keys and values match exactly

### Issue: Duplicate Messages

**Cause:** Multiple bindings match the same message

**Solution:**
```python
# This creates duplicate deliveries:
channel.queue_bind(exchange='logs_topic', queue='myqueue', routing_key='*.error')
channel.queue_bind(exchange='logs_topic', queue='myqueue', routing_key='app.*')
# Message with key 'app.error' will be delivered twice!
```

## Best Practices

### 1. Exchange Declaration
```python
# ✅ Good: Always declare exchange properties explicitly
channel.exchange_declare(
    exchange='my_exchange',
    exchange_type='topic',
    durable=True,      # Survives broker restart
    auto_delete=False, # Don't delete when unused
    internal=False     # Can receive from publishers
)

# ❌ Bad: Relying on defaults
channel.exchange_declare(exchange='my_exchange')
```

### 2. Routing Key Naming
```python
# ✅ Good: Hierarchical, descriptive
"service.component.severity"
"user.action.result"
"region.datacenter.server"

# ❌ Bad: Flat, unclear
"error1"
"msg"
"data"
```

### 3. Topic Pattern Design
```python
# ✅ Good: Specific patterns
"*.critical"        # Critical from any source
"app.error.*"       # App errors of any type
"region.us.#"       # All US region messages

# ❌ Bad: Too broad
"#"                 # Receives everything (use fanout instead)
```

### 4. Exchange Selection
```python
# Choose exchange type based on use case:

# Use Direct for:
task_router = 'direct'      # Task distribution
priority_queue = 'direct'   # Priority-based routing

# Use Topic for:
log_aggregator = 'topic'    # Log collection
event_bus = 'topic'         # Event distribution

# Use Fanout for:
cache_invalidation = 'fanout'  # Broadcast updates
notifications = 'fanout'       # Push notifications

# Use Headers for:
content_router = 'headers'  # Complex routing rules
```

## Key Takeaways

1. ✅ **Direct exchanges** route messages with exact routing key matches
2. ✅ **Topic exchanges** enable flexible pattern matching with * and #
3. ✅ **Fanout exchanges** broadcast to all bound queues (fastest)
4. ✅ **Headers exchanges** route based on message header attributes
5. ✅ One message can be routed to **multiple queues** via bindings
6. ✅ Exchange declarations are **idempotent** (safe to repeat)
7. ✅ Choose exchange type based on **routing requirements**
8. ✅ Routing keys should be **hierarchical and descriptive**

## Next Steps

After completing this tutorial:
1. Combine multiple exchange types in one application
2. Implement exchange-to-exchange bindings
3. Experiment with alternate exchanges for unrouted messages
4. Move on to **Tutorial 03: Routing Patterns** for advanced scenarios
5. Learn about exchange arguments and special features

## Additional Resources

- [RabbitMQ Exchanges Tutorial](https://www.rabbitmq.com/tutorials/tutorial-three-python.html)
- [Exchange Types Documentation](https://www.rabbitmq.com/tutorials/amqp-concepts.html#exchanges)
- [Topic Exchange Patterns](https://www.rabbitmq.com/tutorials/tutorial-five-python.html)
- [Headers Exchange Guide](https://www.rabbitmq.com/tutorials/amqp-concepts.html#exchange-headers)

---

**Congratulations!** You now understand all four RabbitMQ exchange types and can implement sophisticated message routing! 🎉
