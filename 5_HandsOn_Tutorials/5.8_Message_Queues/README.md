# 5.8 Message Queues - Hands-On Tutorials

## Overview

Master asynchronous messaging with 4 popular message broker systems. Learn from basic pub/sub to advanced distributed streaming platforms.

## Message Brokers Covered

### [5.8.1 RabbitMQ](./5.8.1_RabbitMQ/)
**Pattern**: Traditional message broker
**Best For**: Task queues, work distribution, RPC
- **Tutorial 01**: Basic setup - Installation, first queue, producers/consumers
- **Tutorial 02**: Exchanges & routing - Direct, topic, fanout, headers exchanges
- **Tutorial 03**: Consumer/producer patterns - Work queues, priorities, TTL, DLX
- **Tutorial 04**: Clustering - Multi-node RabbitMQ cluster setup
- **Tutorial 05**: High availability - Quorum queues, mirrored queues, failover
- **Tutorial 06**: Monitoring - Management UI, Prometheus, Grafana
- **Tutorial 07**: Kubernetes deployment - RabbitMQ Operator, StatefulSets
- **Tutorial 08**: Production patterns - Reliable delivery, error handling, best practices

### [5.8.2 Apache Kafka](./5.8.2_Kafka/)
**Pattern**: Distributed streaming platform
**Best For**: Event streaming, log aggregation, real-time analytics
- **Tutorial 01**: Basic setup - Kafka installation, topics, first producer/consumer
- **Tutorial 02**: Producers & consumers - Advanced configs, idempotence, compression
- **Tutorial 03**: Partitions & replication - Partitioning strategy, ISR, replication
- **Tutorial 04**: Consumer groups - Parallel processing, rebalancing, lag monitoring
- **Tutorial 05**: Kafka Streams - Stream processing with Faust
- **Tutorial 06**: Kafka Connect - JDBC, S3, Elasticsearch connectors
- **Tutorial 07**: Kubernetes deployment - Strimzi operator, scaling
- **Tutorial 08**: Production cluster - 3-node cluster, monitoring, best practices

### [5.8.3 NATS](./5.8.3_NATS/)
**Pattern**: Lightweight, cloud-native messaging
**Best For**: Microservices communication, edge computing
- **Tutorial 01**: Basic setup - NATS installation, pub/sub, subjects
- **Tutorial 02**: Subject hierarchies & queue groups - Wildcards, load balancing
- **Tutorial 03**: JetStream - Persistence, replay, acknowledgments
- **Tutorial 04**: Clustering - Multi-node cluster, full mesh topology
- **Tutorial 05**: Security - Authentication, authorization, TLS, ACLs
- **Tutorial 06**: Monitoring - HTTP endpoints, Prometheus, metrics
- **Tutorial 07**: Kubernetes deployment - Helm, StatefulSets, scaling
- **Tutorial 08**: Production deployment - 3-node cluster, best practices

### [5.8.4 Redis Pub/Sub](./5.8.4_Redis_PubSub/)
**Pattern**: In-memory pub/sub
**Best For**: Real-time notifications, chat, caching with notifications
- **Tutorial 01**: Basic setup - Redis pub/sub, channels, fire-and-forget
- **Tutorial 02**: Patterns - PSUBSCRIBE, wildcard matching, multi-channel
- **Tutorial 03**: Redis Streams - Persistence, replay, consumer groups
- **Tutorial 04**: Consumer groups - Load balancing, acknowledgments, pending messages
- **Tutorial 05**: Persistence - RDB, AOF, durability for messaging
- **Tutorial 06**: Clustering - Redis Cluster, Sentinel for HA
- **Tutorial 07**: Kubernetes deployment - StatefulSets, Sentinel, scaling
- **Tutorial 08**: Production patterns - Reliable task queues, monitoring, best practices

## Quick Start: RabbitMQ

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"    # AMQP
      - "15672:15672"  # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

volumes:
  rabbitmq-data:
```

```bash
# Start RabbitMQ
docker-compose up -d

# Access Management UI
# http://localhost:15672 (admin/password)
```

### Simple Producer (Node.js)

```javascript
const amqp = require('amqplib');

async function sendMessage() {
  const connection = await amqp.connect('amqp://admin:password@localhost');
  const channel = await connection.createChannel();

  const queue = 'tasks';
  await channel.assertQueue(queue, { durable: true });

  const message = { task: 'process data', timestamp: Date.now() };
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true
  });

  console.log('Sent:', message);
  await channel.close();
  await connection.close();
}

sendMessage();
```

### Simple Consumer (Node.js)

```javascript
const amqp = require('amqplib');

async function receiveMessages() {
  const connection = await amqp.connect('amqp://admin:password@localhost');
  const channel = await connection.createChannel();

  const queue = 'tasks';
  await channel.assertQueue(queue, { durable: true });
  channel.prefetch(1); // Process one message at a time

  console.log('Waiting for messages...');

  channel.consume(queue, async (msg) => {
    const message = JSON.parse(msg.content.toString());
    console.log('Received:', message);

    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Acknowledge message
    channel.ack(msg);
  });
}

receiveMessages();
```

## Messaging Patterns

### 1. Point-to-Point (Queue)

```
Producer → [Queue] → Consumer
```

**Use Case**: Task distribution, work queues
**Example**: Image processing, email sending

### 2. Publish-Subscribe (Topic/Fanout)

```
Producer → [Topic] → Consumer 1
                   → Consumer 2
                   → Consumer 3
```

**Use Case**: Event broadcasting, notifications
**Example**: User signup notifications, system events

### 3. Request-Reply (RPC)

```
Client → [Request Queue] → Server
       ← [Reply Queue]   ←
```

**Use Case**: Synchronous-like async calls
**Example**: API gateway to microservices

### 4. Routing (Topic Exchange)

```
Producer → [Exchange] → Queue 1 (logs.error)
                      → Queue 2 (logs.*)
                      → Queue 3 (*.critical)
```

**Use Case**: Selective message delivery
**Example**: Log aggregation, event routing

### 5. Streaming (Kafka-style)

```
Producer → [Topic/Partition 0] → Consumer Group A
        → [Topic/Partition 1] → Consumer Group B
```

**Use Case**: Event sourcing, real-time analytics
**Example**: Click streams, IoT data

## Broker Comparison

| Feature | RabbitMQ | Kafka | NATS | Redis Pub/Sub |
|---------|----------|-------|------|---------------|
| **Pattern** | Message Queue | Event Stream | Pub/Sub | Pub/Sub |
| **Persistence** | ✅ Optional | ✅ Always | ✅ JetStream | ⚠️ Optional |
| **Ordering** | ✅ Per queue | ✅ Per partition | ❌ | ❌ |
| **Replay** | ❌ | ✅ | ✅ JetStream | ✅ Streams |
| **Throughput** | Medium | Very High | High | Very High |
| **Latency** | Low | Medium | Very Low | Very Low |
| **Complexity** | Medium | High | Low | Low |
| **Best For** | Task queues | Event streaming | Microservices | Real-time |
| **Protocol** | AMQP | Custom | Custom | Redis |

## Best Practices Covered

### Message Design
- ✅ Small, focused messages
- ✅ Schema versioning
- ✅ Idempotent processing
- ✅ Message expiration (TTL)
- ✅ Dead letter handling

### Reliability
- ✅ Message persistence
- ✅ Acknowledgments
- ✅ Retry mechanisms
- ✅ Duplicate detection
- ✅ Exactly-once semantics (where supported)

### Performance
- ✅ Batching messages
- ✅ Connection pooling
- ✅ Prefetch limits
- ✅ Partition strategies
- ✅ Compression

### Monitoring
- ✅ Queue depth monitoring
- ✅ Consumer lag tracking
- ✅ Message rate metrics
- ✅ Error rate tracking
- ✅ Alerting on anomalies

### Security
- ✅ Authentication
- ✅ Authorization (ACLs)
- ✅ Encryption in transit (TLS)
- ✅ Message encryption
- ✅ Network segmentation

## Common Patterns in Code

### 1. Producer with Retry (Python)

```python
import pika
import time

def send_with_retry(message, max_retries=3):
    for attempt in range(max_retries):
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters('localhost')
            )
            channel = connection.channel()
            channel.queue_declare(queue='tasks', durable=True)

            channel.basic_publish(
                exchange='',
                routing_key='tasks',
                body=message,
                properties=pika.BasicProperties(delivery_mode=2)
            )

            connection.close()
            return True
        except Exception as e:
            print(f'Attempt {attempt + 1} failed: {e}')
            time.sleep(2 ** attempt)  # Exponential backoff

    return False
```

### 2. Idempotent Consumer (Node.js)

```javascript
const processedIds = new Set();

async function processMessage(msg) {
  const messageId = msg.properties.messageId;

  // Check if already processed
  if (processedIds.has(messageId)) {
    console.log('Duplicate message, skipping');
    return;
  }

  // Process message
  await doWork(msg.content);

  // Mark as processed
  processedIds.add(messageId);

  // Acknowledge
  channel.ack(msg);
}
```

### 3. Kafka Consumer with Error Handling

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'my-group' });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        await processEvent(event);
      } catch (error) {
        console.error('Processing error:', error);
        // Send to dead letter topic
        await sendToDeadLetter(message);
      }
    },
  });
}
```

## Prerequisites

```bash
# Docker
brew install --cask docker

# Language clients (choose your language)
npm install amqplib kafkajs nats redis

# or
pip install pika kafka-python nats-py redis

# Optional: CLI tools
brew install kafka
brew install rabbitmq
```

## Recommended Study Path

### Week 1: Traditional Queues
- Days 1-4: RabbitMQ (all 8 tutorials)
- Day 5: Build a task queue application
- Weekend: Review and experiment

### Week 2: Event Streaming
- Days 1-5: Kafka (all 8 tutorials)
- Weekend: Build a streaming application

### Week 3: Lightweight Messaging
- Days 1-3: NATS (all 8 tutorials)
- Days 4-5: Redis Pub/Sub (tutorials 1-5)
- Weekend: Compare patterns

### Week 4: Integration
- Days 1-2: Complete Redis Pub/Sub
- Days 3-5: Build multi-broker application
- Weekend: Choose right tool for use cases

## What You'll Master

After completing all tutorials:
- ✅ Understand messaging patterns
- ✅ Choose the right message broker
- ✅ Implement producers and consumers
- ✅ Handle failures and retries
- ✅ Ensure message reliability
- ✅ Monitor message systems
- ✅ Scale message brokers
- ✅ Deploy on Kubernetes
- ✅ Implement event-driven architecture
- ✅ Design for high throughput

## Use Case Examples

**RabbitMQ**: E-commerce order processing
```
Order Service → [order.created queue] → Inventory Service
                                      → Payment Service
                                      → Notification Service
```

**Kafka**: Real-time analytics
```
Website → [clickstream topic] → Analytics Service
                              → Recommendation Service
                              → Data Lake
```

**NATS**: Microservices communication
```
API Gateway → [user.login] → Auth Service → [user.validated] → API Gateway
```

**Redis Pub/Sub**: Real-time notifications
```
Comment Service → [post.123.comments] → Notification Service → WebSocket → User
```

## Additional Resources

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [NATS Documentation](https://docs.nats.io/)
- [Redis Pub/Sub](https://redis.io/topics/pubsub)
- [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/)

## Next Steps

1. Start with RabbitMQ (easiest to learn)
2. Learn Kafka for event streaming
3. Explore NATS for cloud-native
4. Use Redis Pub/Sub for simple use cases
5. Build event-driven applications

---

**Total Tutorials**: 32 (4 brokers × 8 tutorials)
**Estimated Time**: 50-70 hours
**Difficulty**: Intermediate to Advanced
**Cost**: Free (runs locally)
