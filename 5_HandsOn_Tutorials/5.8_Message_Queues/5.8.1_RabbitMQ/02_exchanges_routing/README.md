# RabbitMQ Tutorial 02: Exchanges and Routing

## Overview
This tutorial explores RabbitMQ exchanges and routing mechanisms. You'll learn about different exchange types and how to route messages to multiple queues.

## Learning Objectives
- Understand exchange types (direct, topic, fanout, headers)
- Implement routing patterns
- Bind queues to exchanges
- Use routing keys effectively
- Handle multiple consumers

## Prerequisites
- Completed Tutorial 01 (Basic Setup)
- RabbitMQ running via Docker
- Python pika library installed

## Exchange Types

### 1. Direct Exchange
Routes messages to queues based on exact routing key match.

```
Producer --[routing_key: "error"]--> Exchange ---> Queue (binding: "error")
```

### 2. Topic Exchange
Routes messages based on routing key patterns (wildcards).

```
Producer --[routing_key: "logs.error.database"]--> Exchange
    ---> Queue 1 (binding: "logs.error.*")
    ---> Queue 2 (binding: "logs.*.database")
```

### 3. Fanout Exchange
Broadcasts messages to all bound queues (ignores routing key).

```
Producer --> Exchange ---> Queue 1
                      ---> Queue 2
                      ---> Queue 3
```

### 4. Headers Exchange
Routes based on message header attributes instead of routing key.

```
Producer --[headers: {type: "pdf", size: "large"}]--> Exchange
    ---> Queue (binding: {type: "pdf"})
```

## Setup Instructions

### Step 1: Start RabbitMQ

```bash
docker-compose up -d
```

### Step 2: Run Exchange Examples

**Direct Exchange:**
```bash
# Terminal 1: Consumer
python direct_consumer.py

# Terminal 2: Producer
python direct_producer.py
```

**Topic Exchange:**
```bash
# Terminal 1: Consumer
python topic_consumer.py

# Terminal 2: Producer
python topic_producer.py
```

**Fanout Exchange:**
```bash
# Terminal 1: Multiple consumers
python fanout_consumer.py service1
python fanout_consumer.py service2

# Terminal 2: Producer
python fanout_producer.py
```

**Headers Exchange:**
```bash
# Terminal 1: Consumer
python headers_consumer.py

# Terminal 2: Producer
python headers_producer.py
```

## Code Examples Explanation

### Direct Exchange
- Best for: Point-to-point messaging with exact matching
- Use case: Route tasks to specific workers based on task type
- Routing: Exact match between routing_key and binding_key

### Topic Exchange
- Best for: Publish/subscribe with filtering
- Use case: Logging systems, event distribution
- Routing: Pattern matching with wildcards (* and #)
  - `*` matches exactly one word
  - `#` matches zero or more words

### Fanout Exchange
- Best for: Broadcasting to all subscribers
- Use case: Notifications, cache invalidation
- Routing: No routing key needed, all queues receive all messages

### Headers Exchange
- Best for: Complex routing based on multiple attributes
- Use case: Message filtering based on metadata
- Routing: Match message headers against binding arguments

## Verification Steps

1. **Check Exchanges Created**
   ```bash
   docker exec rabbitmq rabbitmqadmin list exchanges
   ```

2. **Check Bindings**
   ```bash
   docker exec rabbitmq rabbitmqadmin list bindings
   ```

3. **Monitor Message Flow**
   - Open Management UI: http://localhost:15672
   - Go to "Exchanges" tab
   - Click on each exchange to see bindings and message rates

4. **Test Routing Scenarios**

   **Direct:**
   ```bash
   # Only error consumer should receive
   python direct_producer.py error "Critical error!"
   ```

   **Topic:**
   ```bash
   # Both consumers should receive
   python topic_producer.py logs.error.database "DB error"
   ```

   **Fanout:**
   ```bash
   # All consumers should receive
   python fanout_producer.py "Broadcast message"
   ```

## Routing Patterns

### Common Topic Patterns

```
logs.*            # Matches logs.error, logs.info
logs.#            # Matches logs, logs.error, logs.error.database
*.critical        # Matches logs.critical, app.critical
#.error.#         # Matches any path containing 'error'
```

### Binding Examples

```python
# Bind queue to receive all error logs
channel.queue_bind(
    exchange='topic_logs',
    queue='error_queue',
    routing_key='*.error.*'
)

# Bind queue to receive all database-related messages
channel.queue_bind(
    exchange='topic_logs',
    queue='database_queue',
    routing_key='#.database.#'
)
```

## Best Practices

1. **Choose the Right Exchange Type**
   - Direct: Simple routing, high performance
   - Topic: Flexible routing, moderate complexity
   - Fanout: Broadcast, highest performance
   - Headers: Complex routing, lowest performance

2. **Naming Conventions**
   - Use descriptive exchange names: `logs_topic`, `tasks_direct`
   - Use hierarchical routing keys: `service.level.component`
   - Be consistent across your application

3. **Error Handling**
   - Declare exchanges as durable
   - Use alternate exchanges for unroutable messages
   - Implement dead letter exchanges

4. **Performance Considerations**
   - Fanout is fastest (no routing logic)
   - Headers is slowest (complex matching)
   - Direct and topic are in between

## Common Issues

### Messages Not Routed
- Check routing key matches binding key
- Verify exchange and queue bindings
- Check exchange type is correct

### Multiple Message Copies
- Fanout sends to all bound queues (expected)
- Topic might match multiple patterns
- Check your binding patterns

### Performance Issues
- Too many bindings on one exchange
- Complex topic patterns
- Headers exchange with many attributes

## Advanced Patterns

### Alternate Exchange
Handle unroutable messages:

```python
channel.exchange_declare(
    exchange='main_exchange',
    exchange_type='direct',
    arguments={'alternate-exchange': 'unrouted_exchange'}
)
```

### Exchange-to-Exchange Binding
Route between exchanges:

```python
channel.exchange_bind(
    source='source_exchange',
    destination='destination_exchange',
    routing_key='pattern'
)
```

## Next Steps

- Tutorial 03: Advanced consumer/producer patterns
- Implement custom routing strategies
- Experiment with exchange-to-exchange bindings
- Build a multi-service event distribution system

## Additional Resources

- [RabbitMQ Exchange Types](https://www.rabbitmq.com/tutorials/amqp-concepts.html#exchanges)
- [Routing Topology Examples](https://www.rabbitmq.com/tutorials/tutorial-four-python.html)
- [Topic Exchange Tutorial](https://www.rabbitmq.com/tutorials/tutorial-five-python.html)
