# 5.8.1 RabbitMQ - Traditional Message Broker

## Overview

RabbitMQ is a robust, mature message broker that implements the Advanced Message Queuing Protocol (AMQP). It's perfect for task distribution, work queues, and reliable message delivery patterns.

## Why RabbitMQ?

### Strengths
- ✅ **Mature & Stable**: Battle-tested since 2007
- ✅ **Flexible Routing**: Multiple exchange types (direct, topic, fanout, headers)
- ✅ **Reliable Delivery**: Acknowledgments, persistence, confirms
- ✅ **Management UI**: Built-in web interface for monitoring
- ✅ **Multi-Protocol**: AMQP, MQTT, STOMP support
- ✅ **Clustering**: Built-in high availability
- ✅ **Federation**: Distributed messaging across data centers

### Use Cases
- Task queues and work distribution
- Request-reply (RPC) patterns
- Event broadcasting with routing
- Delayed message processing
- Priority queues
- Microservices communication

## Tutorials

### [01 - Basic Setup](./01_basic_setup/)
Learn to set up RabbitMQ with Docker, create your first queue, and implement basic producer/consumer patterns.

**What you'll learn:**
- Docker Compose setup with management UI
- Queue declaration and properties
- Basic publish and consume operations
- Message acknowledgment
- Connection and channel management

**Time**: 1-2 hours

---

### [02 - Exchanges](./02_exchanges/)
Master the four exchange types and understand how RabbitMQ routes messages.

**What you'll learn:**
- Direct exchange (point-to-point routing)
- Topic exchange (pattern matching)
- Fanout exchange (broadcasting)
- Headers exchange (attribute routing)
- Binding queues to exchanges
- Routing keys and patterns

**Time**: 2-3 hours

---

### [03 - Routing Patterns](./03_routing_patterns/)
Implement advanced routing scenarios and message flow patterns.

**What you'll learn:**
- Log routing by severity
- Multi-tenant message routing
- Composite routing patterns
- Alternative exchanges
- Topic wildcards (* and #)
- Dynamic routing

**Time**: 2-3 hours

---

### [04 - Dead Letter Queues](./04_dead_letter_queues/)
Handle message failures, TTL, and poison messages with dead letter exchanges.

**What you'll learn:**
- Dead letter exchange (DLX) configuration
- Message TTL (time-to-live)
- Queue TTL
- Message rejection handling
- Retry mechanisms with exponential backoff
- Poison message patterns

**Time**: 2-3 hours

---

### [05 - Clustering and High Availability](./05_clustering_ha/)
Build fault-tolerant RabbitMQ clusters with replicated queues.

**What you'll learn:**
- RabbitMQ clustering basics
- Classic queue mirroring
- Quorum queues (recommended for HA)
- Node failure handling
- Network partitions
- Load balancing strategies

**Time**: 3-4 hours

---

### [06 - Federation and Shovel](./06_federation_shovel/)
Connect RabbitMQ instances across data centers and regions.

**What you'll learn:**
- Federation plugin setup
- Exchange federation
- Queue federation
- Shovel plugin for message forwarding
- Multi-datacenter architectures
- Topology patterns

**Time**: 2-3 hours

---

### [07 - Monitoring and Management](./07_monitoring_management/)
Monitor RabbitMQ with built-in tools, Prometheus, and Grafana.

**What you'll learn:**
- Management UI features
- HTTP API usage
- Prometheus metrics exporter
- Grafana dashboards
- Key metrics to monitor
- Alerting strategies

**Time**: 2-3 hours

---

### [08 - Kubernetes Deployment](./08_kubernetes_deployment/)
Deploy production-ready RabbitMQ on Kubernetes with the RabbitMQ Cluster Operator.

**What you'll learn:**
- RabbitMQ Cluster Operator installation
- StatefulSet deployment
- Persistent volume configuration
- Service and ingress setup
- Monitoring integration
- Backup and restore

**Time**: 3-4 hours

---

## Quick Reference

### Basic Commands

```bash
# Start RabbitMQ with management UI
docker run -d --name rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=password \
  rabbitmq:3-management

# Access management UI
open http://localhost:15672

# List queues
docker exec rabbitmq rabbitmqctl list_queues

# List exchanges
docker exec rabbitmq rabbitmqctl list_exchanges

# List bindings
docker exec rabbitmq rabbitmqctl list_bindings
```

### Python Producer Example

```python
import pika
import json

connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost')
)
channel = connection.channel()

# Declare queue
channel.queue_declare(queue='tasks', durable=True)

# Publish message
message = {'task': 'process_image', 'image_id': 123}
channel.basic_publish(
    exchange='',
    routing_key='tasks',
    body=json.dumps(message),
    properties=pika.BasicProperties(
        delivery_mode=2,  # make message persistent
    ))

print(f"Sent: {message}")
connection.close()
```

### Python Consumer Example

```python
import pika
import json

def callback(ch, method, properties, body):
    message = json.loads(body)
    print(f"Received: {message}")

    # Process message
    # ...

    # Acknowledge
    ch.basic_ack(delivery_tag=method.delivery_tag)

connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost')
)
channel = connection.channel()

channel.queue_declare(queue='tasks', durable=True)
channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue='tasks', on_message_callback=callback)

print('Waiting for messages...')
channel.start_consuming()
```

## Prerequisites

- Docker and Docker Compose
- Python 3.8+ or Node.js 14+
- Basic understanding of message queues
- 8GB RAM (for clustering tutorials)

### Install Client Libraries

**Python:**
```bash
pip install pika
```

**Node.js:**
```bash
npm install amqplib
```

**Go:**
```bash
go get github.com/rabbitmq/amqp091-go
```

## Architecture Concepts

### Core Components

```
┌─────────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
│  Producer   │────▶│ Exchange │────▶│   Queue   │────▶│ Consumer │
└─────────────┘     └──────────┘     └───────────┘     └──────────┘
                          │
                          │ (Binding)
                          ▼
                    ┌───────────┐
                    │   Queue   │
                    └───────────┘
```

### Key Concepts

1. **Producer**: Application that sends messages
2. **Consumer**: Application that receives messages
3. **Queue**: Buffer that stores messages
4. **Exchange**: Routes messages to queues based on rules
5. **Binding**: Link between exchange and queue
6. **Routing Key**: Message attribute used for routing
7. **Virtual Host**: Logical grouping (like namespaces)

## Best Practices

### Message Design
- Keep messages small and focused
- Use JSON for message format
- Include message ID for idempotency
- Add timestamps for debugging
- Version your message schemas

### Reliability
- Use durable queues for critical messages
- Enable publisher confirms
- Implement consumer acknowledgments
- Set appropriate prefetch counts
- Handle connection failures gracefully

### Performance
- Use connection pooling
- Batch publish when possible
- Set appropriate TTL on messages
- Monitor queue depth
- Scale consumers based on load

### Security
- Change default credentials
- Use TLS for connections
- Implement authentication and authorization
- Use virtual hosts for isolation
- Limit management UI access

## Common Patterns

### Work Queue Pattern
```
Producer ─┐
Producer ─┼──▶ [Queue] ──┬──▶ Worker 1
Producer ─┘              ├──▶ Worker 2
                         └──▶ Worker 3
```
**Use**: Distribute time-consuming tasks

### Pub/Sub Pattern
```
                    ┌──▶ Queue A ──▶ Consumer A
Publisher ──▶ Fanout Exchange ─┼──▶ Queue B ──▶ Consumer B
                    └──▶ Queue C ──▶ Consumer C
```
**Use**: Broadcast events to multiple consumers

### Routing Pattern
```
                    ┌──▶ Queue (error) ──▶ Consumer
Logger ──▶ Topic Exchange ─┼──▶ Queue (warn) ───▶ Consumer
                    └──▶ Queue (info) ───▶ Consumer
```
**Use**: Selective message delivery

### RPC Pattern
```
Client ──[request]──▶ [RPC Queue] ──▶ Server
       ◀─[reply]────  [Reply Queue] ◀─
```
**Use**: Synchronous-like request-reply

## Resources

- [Official RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [Pika Documentation](https://pika.readthedocs.io/)
- [amqplib Documentation](https://amqp-node.github.io/amqplib/)
- [CloudAMQP Blog](https://www.cloudamqp.com/blog/)

## Troubleshooting

### Common Issues

**Connection Refused**
```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# Check logs
docker logs rabbitmq
```

**Queue Not Found**
- Ensure queue is declared before publishing
- Check queue name spelling
- Verify virtual host

**Messages Not Being Consumed**
- Check consumer is running
- Verify queue binding
- Check basic_consume call
- Look for unacked messages

**High Memory Usage**
- Check queue depths
- Implement TTL on messages
- Add more consumers
- Enable lazy queues for large backlogs

## Next Steps

After completing all RabbitMQ tutorials:
1. Build a real-world application (e.g., image processing pipeline)
2. Compare with Kafka for your use case
3. Explore RabbitMQ Streams for Kafka-like functionality
4. Learn about CloudAMQP for managed RabbitMQ
5. Study event-driven architecture patterns

---

**Total Time**: 18-25 hours
**Difficulty**: Intermediate
**Prerequisite**: Basic understanding of message queues
