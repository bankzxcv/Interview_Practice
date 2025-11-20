# Tutorial 03: Advanced Routing Patterns

## Objectives

By the end of this tutorial, you will:
- Implement advanced routing scenarios with topic patterns
- Master wildcard routing with * and # operators
- Build multi-tenant routing systems
- Implement log aggregation with severity filtering
- Use alternate exchanges for unrouted messages
- Create composite routing patterns
- Understand exchange-to-exchange bindings
- Build a complete event routing architecture

## Prerequisites

- Completed Tutorial 01: RabbitMQ Basic Setup
- Completed Tutorial 02: Exchanges
- Understanding of exchange types and routing keys
- Python 3.8+ installed
- Docker and Docker Compose running

## What are Routing Patterns?

Routing patterns are sophisticated configurations that combine exchange types, binding rules, and routing keys to create complex message distribution systems. They enable:

- **Multi-criteria filtering**: Route based on multiple attributes
- **Hierarchical routing**: Organize messages by category/subcategory
- **Dynamic routing**: Change routing without code changes
- **Fail-safe routing**: Handle unroutable messages gracefully

### Common Routing Patterns

1. **Log Aggregation**: Route logs by severity and source
2. **Multi-tenant Routing**: Isolate messages by tenant/customer
3. **Geo-routing**: Route by region/datacenter/zone
4. **Service Mesh**: Route between microservices
5. **Event Sourcing**: Distribute domain events

## When to Use Advanced Routing?

### Use Advanced Routing When:
- Multiple consumers need different message subsets
- Messages have hierarchical relationships
- Dynamic routing rules are required
- Different priority levels exist
- Multi-tenant isolation is needed
- Geographic distribution is required

### Don't Use Advanced Routing When:
- Simple point-to-point communication suffices
- All consumers need all messages (use fanout)
- Routing logic is complex enough to need a separate service

## Step-by-Step Instructions

### Step 1: Create Docker Compose File

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3.12-management
    container_name: rabbitmq_routing
    hostname: rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
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

### Step 3: Log Aggregation Pattern

Create `log_aggregation_producer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys
import random
from datetime import datetime

def send_log(service, severity, message):
    """Send log message with hierarchical routing key: service.severity"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare topic exchange for logs
    exchange_name = 'logs_aggregation'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='topic',
        durable=True
    )

    # Routing key format: <service>.<severity>
    routing_key = f"{service}.{severity}"

    log_entry = {
        'service': service,
        'severity': severity,
        'message': message,
        'timestamp': datetime.now().isoformat(),
        'routing_key': routing_key
    }

    channel.basic_publish(
        exchange=exchange_name,
        routing_key=routing_key,
        body=json.dumps(log_entry),
        properties=pika.BasicProperties(
            delivery_mode=2,
            content_type='application/json'
        )
    )

    print(f"✓ Sent [{routing_key}]: {message}")
    connection.close()

def generate_sample_logs():
    """Generate sample log messages"""
    services = ['auth', 'payment', 'inventory', 'notification']
    severities = ['debug', 'info', 'warning', 'error', 'critical']

    messages = {
        'auth': ['User login successful', 'Invalid password attempt', 'Token expired'],
        'payment': ['Payment processed', 'Card declined', 'Payment gateway timeout'],
        'inventory': ['Stock updated', 'Low inventory warning', 'Inventory sync failed'],
        'notification': ['Email sent', 'SMS delivery failed', 'Push notification queued']
    }

    for _ in range(10):
        service = random.choice(services)
        severity = random.choice(severities)
        message = random.choice(messages[service])
        send_log(service, severity, message)

if __name__ == '__main__':
    if len(sys.argv) > 3:
        service = sys.argv[1]
        severity = sys.argv[2]
        message = ' '.join(sys.argv[3:])
        send_log(service, severity, message)
    else:
        print("Generating sample logs...")
        generate_sample_logs()
```

Create `log_aggregation_consumer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys

def callback(ch, method, properties, body):
    """Process log message"""
    log_entry = json.loads(body)
    severity = log_entry['severity']

    # Color code by severity
    colors = {
        'debug': '\033[36m',    # Cyan
        'info': '\033[32m',     # Green
        'warning': '\033[33m',  # Yellow
        'error': '\033[31m',    # Red
        'critical': '\033[35m'  # Magenta
    }
    reset = '\033[0m'

    color = colors.get(severity, '')
    print(f"{color}✓ [{log_entry['routing_key']}] {log_entry['message']}{reset}")
    print(f"  Service: {log_entry['service']} | Time: {log_entry['timestamp']}")

    ch.basic_ack(delivery_tag=method.delivery_tag)

def consume_logs(patterns, consumer_name):
    """Consume logs matching routing patterns"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    exchange_name = 'logs_aggregation'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='topic',
        durable=True
    )

    # Create exclusive queue
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue

    # Bind queue to each pattern
    print(f"=== {consumer_name} ===")
    for pattern in patterns:
        channel.queue_bind(
            exchange=exchange_name,
            queue=queue_name,
            routing_key=pattern
        )
        print(f"Listening to: {pattern}")

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=False
    )

    print(f"\n⏳ {consumer_name} waiting for logs. Press CTRL+C to exit\n")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print(f'\n✓ {consumer_name} stopped')
        channel.stop_consuming()

    connection.close()

if __name__ == '__main__':
    # Predefined consumer profiles
    profiles = {
        'errors': (['*.error', '*.critical'], 'Error Monitor'),
        'auth': (['auth.*'], 'Auth Service Monitor'),
        'critical': (['*.critical'], 'Critical Alerts'),
        'payment': (['payment.#'], 'Payment Monitor'),
        'all': (['#'], 'All Logs Monitor')
    }

    if len(sys.argv) < 2:
        print("Usage: python log_aggregation_consumer.py <profile>")
        print("\nAvailable profiles:")
        for name, (patterns, desc) in profiles.items():
            print(f"  {name:10} - {desc:30} - Patterns: {patterns}")
        sys.exit(1)

    profile = sys.argv[1]
    if profile in profiles:
        patterns, name = profiles[profile]
        consume_logs(patterns, name)
    else:
        # Custom patterns
        patterns = sys.argv[1:]
        consume_logs(patterns, 'Custom Consumer')
```

### Step 4: Multi-Tenant Routing Pattern

Create `multitenant_producer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys
from datetime import datetime

def send_tenant_message(tenant_id, resource, action, data):
    """Send message with tenant isolation: tenant.resource.action"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    exchange_name = 'multitenant_events'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='topic',
        durable=True
    )

    # Routing key: <tenant_id>.<resource>.<action>
    routing_key = f"{tenant_id}.{resource}.{action}"

    message = {
        'tenant_id': tenant_id,
        'resource': resource,
        'action': action,
        'data': data,
        'timestamp': datetime.now().isoformat(),
        'routing_key': routing_key
    }

    channel.basic_publish(
        exchange=exchange_name,
        routing_key=routing_key,
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=2,
            content_type='application/json',
            headers={'tenant_id': tenant_id}
        )
    )

    print(f"✓ Sent [{routing_key}]: {data}")
    connection.close()

if __name__ == '__main__':
    # Example usage
    examples = [
        ('tenant1', 'user', 'created', {'user_id': 123, 'email': 'user@tenant1.com'}),
        ('tenant1', 'order', 'placed', {'order_id': 456, 'amount': 99.99}),
        ('tenant2', 'user', 'created', {'user_id': 789, 'email': 'user@tenant2.com'}),
        ('tenant2', 'order', 'cancelled', {'order_id': 101, 'reason': 'out of stock'}),
        ('tenant3', 'invoice', 'paid', {'invoice_id': 999, 'amount': 1500.00}),
    ]

    if len(sys.argv) > 1:
        for example in examples:
            send_tenant_message(*example)
        print(f"\n✓ Sent {len(examples)} tenant messages")
    else:
        print("Usage: python multitenant_producer.py run")
        print("\nThis will send sample multi-tenant events:")
        for tenant, resource, action, data in examples:
            print(f"  {tenant}.{resource}.{action}")
```

Create `multitenant_consumer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys

def callback(ch, method, properties, body):
    """Process tenant-specific message"""
    message = json.loads(body)
    print(f"✓ [{message['routing_key']}]")
    print(f"  Tenant: {message['tenant_id']}")
    print(f"  Resource: {message['resource']}")
    print(f"  Action: {message['action']}")
    print(f"  Data: {message['data']}")
    print(f"  Time: {message['timestamp']}\n")

    ch.basic_ack(delivery_tag=method.delivery_tag)

def consume_tenant_events(tenant_id=None, resource=None, action=None):
    """Consume events with flexible tenant/resource/action filtering"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    exchange_name = 'multitenant_events'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='topic',
        durable=True
    )

    # Create queue
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue

    # Build routing pattern
    parts = [
        tenant_id or '*',
        resource or '*',
        action or '*'
    ]
    pattern = '.'.join(parts)

    channel.queue_bind(
        exchange=exchange_name,
        queue=queue_name,
        routing_key=pattern
    )

    print(f"=== Multi-Tenant Consumer ===")
    print(f"Pattern: {pattern}")
    print(f"Filtering - Tenant: {tenant_id or 'ALL'}, "
          f"Resource: {resource or 'ALL'}, "
          f"Action: {action or 'ALL'}\n")

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=False
    )

    print("⏳ Waiting for events. Press CTRL+C to exit\n")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print('\n✓ Consumer stopped')
        channel.stop_consuming()

    connection.close()

if __name__ == '__main__':
    # Parse command line arguments
    tenant = sys.argv[1] if len(sys.argv) > 1 else None
    resource = sys.argv[2] if len(sys.argv) > 2 else None
    action = sys.argv[3] if len(sys.argv) > 3 else None

    if not any([tenant, resource, action]):
        print("Usage: python multitenant_consumer.py [tenant] [resource] [action]")
        print("\nExamples:")
        print("  python multitenant_consumer.py tenant1          # All tenant1 events")
        print("  python multitenant_consumer.py tenant1 user     # All tenant1 user events")
        print("  python multitenant_consumer.py tenant1 user created  # Specific event")
        print("  python multitenant_consumer.py - order          # All order events")
        print("  python multitenant_consumer.py - - created      # All created events")
        sys.exit(1)

    # Convert '-' to None for wildcards
    tenant = None if tenant == '-' else tenant
    resource = None if resource == '-' else resource
    action = None if action == '-' else action

    consume_tenant_events(tenant, resource, action)
```

### Step 5: Alternate Exchange Pattern

Create `alternate_exchange_setup.py`:

```python
#!/usr/bin/env python3
import pika
import json
from datetime import datetime

def setup_alternate_exchange():
    """Set up main exchange with alternate exchange for unrouted messages"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # 1. Create alternate exchange (fanout to catch all unrouted)
    alternate_exchange = 'unrouted_messages'
    channel.exchange_declare(
        exchange=alternate_exchange,
        exchange_type='fanout',
        durable=True
    )

    # 2. Create queue for unrouted messages
    unrouted_queue = 'unrouted_queue'
    channel.queue_declare(
        queue=unrouted_queue,
        durable=True
    )

    # 3. Bind unrouted queue to alternate exchange
    channel.queue_bind(
        exchange=alternate_exchange,
        queue=unrouted_queue
    )

    # 4. Create main exchange with alternate exchange
    main_exchange = 'orders'
    channel.exchange_declare(
        exchange=main_exchange,
        exchange_type='topic',
        durable=True,
        arguments={
            'alternate-exchange': alternate_exchange
        }
    )

    # 5. Create normal queues
    queues_and_bindings = [
        ('priority_orders', 'order.*.high'),
        ('normal_orders', 'order.*.normal'),
    ]

    for queue_name, binding_key in queues_and_bindings:
        channel.queue_declare(queue=queue_name, durable=True)
        channel.queue_bind(
            exchange=main_exchange,
            queue=queue_name,
            routing_key=binding_key
        )

    connection.close()

    print("✓ Alternate exchange setup complete!")
    print(f"\nConfiguration:")
    print(f"  Main exchange: {main_exchange} (topic)")
    print(f"  Alternate exchange: {alternate_exchange} (fanout)")
    print(f"  Unrouted queue: {unrouted_queue}")
    print(f"\nBindings:")
    for queue, binding in queues_and_bindings:
        print(f"  {queue:20} ← {binding}")
    print(f"  {unrouted_queue:20} ← (unrouted messages)")

def send_test_messages():
    """Send test messages including unrouted ones"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    test_messages = [
        ('order.123.high', 'High priority order'),
        ('order.456.normal', 'Normal priority order'),
        ('order.789.low', 'Low priority order - UNROUTED!'),
        ('invoice.111.high', 'Invoice - UNROUTED!'),
    ]

    for routing_key, description in test_messages:
        message = {
            'routing_key': routing_key,
            'description': description,
            'timestamp': datetime.now().isoformat()
        }

        channel.basic_publish(
            exchange='orders',
            routing_key=routing_key,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )

        print(f"✓ Sent [{routing_key}]: {description}")

    connection.close()

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'setup':
        setup_alternate_exchange()
    elif len(sys.argv) > 1 and sys.argv[1] == 'send':
        send_test_messages()
    else:
        print("Usage:")
        print("  python alternate_exchange_setup.py setup  # Setup exchanges")
        print("  python alternate_exchange_setup.py send   # Send test messages")
```

Create `unrouted_consumer.py`:

```python
#!/usr/bin/env python3
import pika
import json

def callback(ch, method, properties, body):
    """Process unrouted messages"""
    message = json.loads(body)
    print(f"⚠️  UNROUTED MESSAGE DETECTED!")
    print(f"  Routing Key: {message['routing_key']}")
    print(f"  Description: {message['description']}")
    print(f"  Timestamp: {message['timestamp']}")
    print(f"  → This message had no matching binding\n")

    ch.basic_ack(delivery_tag=method.delivery_tag)

def consume_unrouted():
    """Consume messages from unrouted queue"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    queue_name = 'unrouted_queue'

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=False
    )

    print("=== Unrouted Message Monitor ===")
    print("⏳ Monitoring unrouted messages. Press CTRL+C to exit\n")

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print('\n✓ Monitor stopped')
        channel.stop_consuming()

    connection.close()

if __name__ == '__main__':
    consume_unrouted()
```

### Step 6: Composite Routing Pattern

Create `composite_routing.py`:

```python
#!/usr/bin/env python3
import pika
import json
from datetime import datetime

def setup_composite_routing():
    """
    Setup composite routing with exchange-to-exchange bindings

    Architecture:
    Producer → Main Exchange → Regional Exchanges → Service Queues
    """

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Main exchange
    channel.exchange_declare(
        exchange='global_events',
        exchange_type='topic',
        durable=True
    )

    # Regional exchanges
    regions = ['us', 'eu', 'asia']
    for region in regions:
        exchange_name = f'events_{region}'
        channel.exchange_declare(
            exchange=exchange_name,
            exchange_type='topic',
            durable=True
        )

        # Bind regional exchange to main exchange
        channel.exchange_bind(
            destination=exchange_name,
            source='global_events',
            routing_key=f'{region}.#'
        )

        # Create service queues for each region
        for service in ['auth', 'payment']:
            queue_name = f'{region}_{service}_queue'
            channel.queue_declare(queue=queue_name, durable=True)
            channel.queue_bind(
                exchange=exchange_name,
                queue=queue_name,
                routing_key=f'{region}.{service}.#'
            )

    connection.close()
    print("✓ Composite routing setup complete!")
    print("\nArchitecture:")
    print("  global_events (main)")
    print("  ├── events_us")
    print("  │   ├── us_auth_queue")
    print("  │   └── us_payment_queue")
    print("  ├── events_eu")
    print("  │   ├── eu_auth_queue")
    print("  │   └── eu_payment_queue")
    print("  └── events_asia")
    print("      ├── asia_auth_queue")
    print("      └── asia_payment_queue")

def send_composite_message(region, service, action, data):
    """Send message through composite routing"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    routing_key = f'{region}.{service}.{action}'
    message = {
        'region': region,
        'service': service,
        'action': action,
        'data': data,
        'timestamp': datetime.now().isoformat()
    }

    channel.basic_publish(
        exchange='global_events',
        routing_key=routing_key,
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=2,
            content_type='application/json'
        )
    )

    print(f"✓ Sent [{routing_key}]")
    connection.close()

if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == 'setup':
        setup_composite_routing()
    elif len(sys.argv) > 1 and sys.argv[1] == 'send':
        # Send test messages
        examples = [
            ('us', 'auth', 'login', {'user_id': 123}),
            ('eu', 'payment', 'process', {'amount': 99.99}),
            ('asia', 'auth', 'logout', {'user_id': 456}),
        ]
        for args in examples:
            send_composite_message(*args)
    else:
        print("Usage:")
        print("  python composite_routing.py setup  # Setup composite routing")
        print("  python composite_routing.py send   # Send test messages")
```

## Expected Output

### Log Aggregation Output:
```
=== Error Monitor ===
Listening to: *.error
Listening to: *.critical

⏳ Error Monitor waiting for logs. Press CTRL+C to exit

✓ [payment.error] Card declined
  Service: payment | Time: 2024-01-15T10:30:00.123456
✓ [auth.critical] System breach detected
  Service: auth | Time: 2024-01-15T10:30:05.234567
```

### Multi-Tenant Output:
```
=== Multi-Tenant Consumer ===
Pattern: tenant1.*.*
Filtering - Tenant: tenant1, Resource: ALL, Action: ALL

✓ [tenant1.user.created]
  Tenant: tenant1
  Resource: user
  Action: created
  Data: {'user_id': 123, 'email': 'user@tenant1.com'}
```

### Alternate Exchange Output:
```
⚠️  UNROUTED MESSAGE DETECTED!
  Routing Key: order.789.low
  Description: Low priority order - UNROUTED!
  Timestamp: 2024-01-15T10:35:00.123456
  → This message had no matching binding
```

## Explanation

### Wildcard Patterns

**Single word (* wildcard):**
```
Pattern: "*.critical.memory"
Matches:
  ✓ "app.critical.memory"
  ✓ "sys.critical.memory"
Doesn't match:
  ✗ "app.service.critical.memory"  (too many words)
  ✗ "critical.memory"              (too few words)
```

**Multiple words (# wildcard):**
```
Pattern: "app.#.error"
Matches:
  ✓ "app.error"
  ✓ "app.service.error"
  ✓ "app.service.database.error"
Doesn't match:
  ✗ "sys.error"
  ✗ "app.warning"
```

### Alternate Exchange Flow

```
Message: routing_key="order.789.low"
    ↓
Main Exchange (orders)
    ↓
Check bindings: priority_orders(order.*.high), normal_orders(order.*.normal)
    ↓
NO MATCH FOUND
    ↓
Alternate Exchange (unrouted_messages)
    ↓
Fanout to all bound queues
    ↓
unrouted_queue
```

## Verification Steps

### 1. Test Wildcard Patterns
```bash
# Terminal 1: Subscribe to *.critical
python log_aggregation_consumer.py critical

# Terminal 2: Send various severities
python log_aggregation_producer.py auth critical "Critical error"
python log_aggregation_producer.py payment error "Normal error"
```

### 2. Verify Alternate Exchange
```bash
# Setup
python alternate_exchange_setup.py setup

# Start unrouted consumer
python unrouted_consumer.py

# Send messages (some will be unrouted)
python alternate_exchange_setup.py send
```

### 3. Check Exchange Bindings
```bash
docker exec rabbitmq_routing rabbitmqctl list_bindings
```

## Troubleshooting

### Issue: Pattern Not Matching

**Common mistakes:**
```python
# ✗ Wrong: Mixed wildcards don't work as expected
"app.*.#.error"  # Problematic pattern

# ✓ Correct: Use consistent hierarchy
"app.#"          # All app messages
"app.*.*"        # Exactly 2 levels under app
```

### Issue: Duplicate Deliveries

**Cause:** Overlapping patterns
```python
# These patterns overlap:
"app.*"          # Matches: app.error
"*.error"        # Matches: app.error
# Result: Message delivered twice!
```

**Solution:** Design mutually exclusive patterns

## Best Practices

### 1. Routing Key Naming Convention
```python
# ✅ Good: Consistent hierarchy
"<region>.<service>.<action>"
"us.auth.login"
"eu.payment.process"

# ✅ Good: Hierarchical categories
"<system>.<component>.<severity>"
"backend.database.error"
"frontend.api.warning"
```

### 2. Pattern Design
```python
# ✅ Good: Specific patterns
"region.us.#"           # All US messages
"*.*.error"             # All errors from any region/service

# ❌ Bad: Overlapping patterns
"#"                     # Everything
"*.*.*"                 # Also everything (if 3-level keys)
```

### 3. Error Handling
```python
# ✅ Good: Always use alternate exchange
channel.exchange_declare(
    exchange='main',
    exchange_type='topic',
    arguments={'alternate-exchange': 'unrouted'}
)
```

## Key Takeaways

1. ✅ **Wildcards**: * matches one word, # matches zero or more words
2. ✅ **Hierarchical routing keys** enable flexible filtering
3. ✅ **Alternate exchanges** catch unrouted messages
4. ✅ **Exchange-to-exchange bindings** create routing hierarchies
5. ✅ **Pattern overlaps** cause duplicate deliveries
6. ✅ **Multi-tenant isolation** uses routing key prefixes
7. ✅ Design patterns to be **mutually exclusive** when possible

## Next Steps

After completing this tutorial:
1. Combine multiple routing patterns in production systems
2. Implement geographic routing with failover
3. Design custom routing for your use case
4. Move on to **Tutorial 04: Dead Letter Queues** for error handling
5. Explore priority queues and message TTL

## Additional Resources

- [RabbitMQ Topic Exchange](https://www.rabbitmq.com/tutorials/tutorial-five-python.html)
- [Routing Patterns Guide](https://www.cloudamqp.com/blog/part4-rabbitmq-for-beginners-exchanges-routing-keys-bindings.html)
- [Alternate Exchanges](https://www.rabbitmq.com/ae.html)

---

**Congratulations!** You've mastered advanced RabbitMQ routing patterns! 🎉
