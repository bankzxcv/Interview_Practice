# 5.8 Message Queues - Hands-On Tutorials

## Overview

Master asynchronous messaging with 4 popular message broker systems. Learn from basic pub/sub to advanced distributed streaming platforms.

## Message Brokers Covered

### [5.8.1 RabbitMQ](./5.8.1_RabbitMQ/)
**Pattern**: Traditional message broker
**Best For**: Task queues, work distribution, RPC
- **Tutorial 01**: Basic setup, queues, publish/consume
- **Tutorial 02**: Exchanges (direct, topic, fanout, headers)
- **Tutorial 03**: Routing patterns
- **Tutorial 04**: Dead letter queues, TTL
- **Tutorial 05**: Clustering and high availability
- **Tutorial 06**: Federation and shovel
- **Tutorial 07**: Monitoring and management
- **Tutorial 08**: Kubernetes deployment

### [5.8.2 Apache Kafka](./5.8.2_Kafka/)
**Pattern**: Distributed streaming platform
**Best For**: Event streaming, log aggregation, real-time analytics
- **Tutorial 01**: Basic setup, topics, producers, consumers
- **Tutorial 02**: Consumer groups, partitions
- **Tutorial 03**: Kafka Connect
- **Tutorial 04**: Kafka Streams
- **Tutorial 05**: Schema Registry (Avro)
- **Tutorial 06**: Exactly-once semantics
- **Tutorial 07**: Monitoring with JMX
- **Tutorial 08**: Kubernetes deployment (Strimzi)

### [5.8.3 NATS](./5.8.3_NATS/)
**Pattern**: Lightweight, cloud-native messaging
**Best For**: Microservices communication, edge computing
- **Tutorial 01**: Basic pub/sub
- **Tutorial 02**: Request-reply pattern
- **Tutorial 03**: Queue groups
- **Tutorial 04**: JetStream (persistence)
- **Tutorial 05**: Key-Value store
- **Tutorial 06**: Object store
- **Tutorial 07**: Clustering and supercluster
- **Tutorial 08**: Kubernetes deployment

### [5.8.4 Redis Pub/Sub](./5.8.4_Redis_PubSub/)
**Pattern**: In-memory pub/sub
**Best For**: Real-time notifications, chat, caching with notifications
- **Tutorial 01**: Basic pub/sub
- **Tutorial 02**: Pattern matching subscriptions
- **Tutorial 03**: Redis Streams
- **Tutorial 04**: Consumer groups
- **Tutorial 05**: Combining with Redis data structures
- **Tutorial 06**: Persistence and reliability
- **Tutorial 07**: Sentinel and cluster
- **Tutorial 08**: Kubernetes deployment

### [5.8.5 AWS Queue Services](./5.8.5_AWS_Queues/)
**Pattern**: Managed cloud messaging services
**Best For**: Cloud-native applications, serverless architectures, AWS ecosystem
- **Tutorial 01**: Amazon SQS - Standard and FIFO queues
- **Tutorial 02**: Amazon SNS - Topics and subscriptions
- **Tutorial 03**: SQS + SNS integration (fanout pattern)
- **Tutorial 04**: Dead letter queues and message visibility
- **Tutorial 05**: Amazon MQ (managed RabbitMQ/ActiveMQ)
- **Tutorial 06**: Lambda integration with SQS/SNS
- **Tutorial 07**: EventBridge for event routing
- **Tutorial 08**: Production patterns and cost optimization

### [5.8.6 Azure Queue Services](./5.8.6_Azure_Queues/)
**Pattern**: Microsoft Azure managed messaging
**Best For**: Azure cloud applications, enterprise integration, .NET applications
- **Tutorial 01**: Azure Queue Storage basics
- **Tutorial 02**: Azure Service Bus queues
- **Tutorial 03**: Service Bus topics and subscriptions
- **Tutorial 04**: Message sessions and ordering
- **Tutorial 05**: Dead lettering and auto-forwarding
- **Tutorial 06**: Azure Functions integration
- **Tutorial 07**: Service Bus with Event Grid
- **Tutorial 08**: Production deployment and monitoring

### [5.8.7 Google Cloud Pub/Sub](./5.8.7_GCP_PubSub/)
**Pattern**: Google Cloud managed pub/sub
**Best For**: GCP applications, real-time analytics, global distribution
- **Tutorial 01**: Basic Pub/Sub setup and publishing
- **Tutorial 02**: Pull and push subscriptions
- **Tutorial 03**: Message ordering and exactly-once delivery
- **Tutorial 04**: Dead letter topics and retry policies
- **Tutorial 05**: Schema validation
- **Tutorial 06**: Cloud Functions and Dataflow integration
- **Tutorial 07**: BigQuery and data pipeline integration
- **Tutorial 08**: Global deployment and monitoring

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

### Simple Producer (TypeScript)

```typescript
import amqp, { Connection, Channel } from 'amqplib';

interface TaskMessage {
  task: string;
  timestamp: number;
}

async function sendMessage(): Promise<void> {
  let connection: Connection | null = null;
  let channel: Channel | null = null;

  try {
    connection = await amqp.connect('amqp://admin:password@localhost');
    channel = await connection.createChannel();

    const queue = 'tasks';
    await channel.assertQueue(queue, { durable: true });

    const message: TaskMessage = { task: 'process data', timestamp: Date.now() };
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });

    console.log('Sent:', message);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  } finally {
    if (channel) await channel.close();
    if (connection) await connection.close();
  }
}

sendMessage().catch(console.error);
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

### Simple Consumer (TypeScript)

```typescript
import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';

interface TaskMessage {
  task: string;
  timestamp: number;
}

async function receiveMessages(): Promise<void> {
  try {
    const connection: Connection = await amqp.connect('amqp://admin:password@localhost');
    const channel: Channel = await connection.createChannel();

    const queue = 'tasks';
    await channel.assertQueue(queue, { durable: true });
    channel.prefetch(1); // Process one message at a time

    console.log('Waiting for messages...');

    await channel.consume(queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const message: TaskMessage = JSON.parse(msg.content.toString());
        console.log('Received:', message);

        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Acknowledge message
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing message:', error);
        // Reject and requeue the message
        channel.nack(msg, false, true);
      }
    });
  } catch (error) {
    console.error('Error in consumer:', error);
    throw error;
  }
}

receiveMessages().catch(console.error);
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

| Feature | RabbitMQ | Kafka | NATS | Redis | AWS SQS/SNS | Azure Service Bus | GCP Pub/Sub |
|---------|----------|-------|------|-------|-------------|-------------------|-------------|
| **Pattern** | Message Queue | Event Stream | Pub/Sub | Pub/Sub | Queue/Pub-Sub | Queue/Topic | Pub/Sub |
| **Persistence** | ✅ Optional | ✅ Always | ✅ JetStream | ⚠️ Optional | ✅ Always | ✅ Always | ✅ Always |
| **Ordering** | ✅ Per queue | ✅ Per partition | ❌ | ❌ | ⚠️ FIFO only | ✅ Sessions | ✅ Per key |
| **Replay** | ❌ | ✅ | ✅ JetStream | ✅ Streams | ❌ | ❌ | ✅ Snapshots |
| **Throughput** | Medium | Very High | High | Very High | High | High | Very High |
| **Latency** | Low | Medium | Very Low | Very Low | Medium | Medium | Low |
| **Complexity** | Medium | High | Low | Low | Very Low | Low | Low |
| **Hosting** | Self-hosted | Self-hosted | Self-hosted | Self-hosted | Managed | Managed | Managed |
| **Cost** | Free | Free | Free | Free | Pay-per-use | Pay-per-use | Pay-per-use |
| **Best For** | Task queues | Event streaming | Microservices | Real-time | Serverless | Enterprise | Analytics |
| **Protocol** | AMQP | Custom | Custom | Redis | HTTPS/SDK | AMQP/SDK | gRPC/SDK |

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

### 2. Idempotent Consumer (TypeScript)

```typescript
import { Channel, ConsumeMessage } from 'amqplib';

class IdempotentConsumer {
  private processedIds: Set<string> = new Set();
  private channel: Channel;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  async processMessage(msg: ConsumeMessage): Promise<void> {
    const messageId = msg.properties.messageId as string;

    // Check if already processed
    if (this.processedIds.has(messageId)) {
      console.log('Duplicate message, skipping');
      this.channel.ack(msg);
      return;
    }

    try {
      // Process message
      await this.doWork(msg.content);

      // Mark as processed
      this.processedIds.add(messageId);

      // Acknowledge
      this.channel.ack(msg);
    } catch (error) {
      console.error('Error processing message:', error);
      this.channel.nack(msg, false, true);
    }
  }

  private async doWork(content: Buffer): Promise<void> {
    // Your work here
    const data = JSON.parse(content.toString());
    console.log('Processing:', data);
  }
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

### 3. Kafka Consumer with Error Handling (TypeScript)

```typescript
import { Kafka, Consumer, EachMessagePayload, KafkaMessage } from 'kafkajs';

interface Event {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
}

class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(clientId: string, brokers: string[], groupId: string) {
    this.kafka = new Kafka({
      clientId,
      brokers
    });
    this.consumer = this.kafka.consumer({ groupId });
  }

  async run(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'events', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        try {
          if (!message.value) {
            console.warn('Received empty message');
            return;
          }

          const event: Event = JSON.parse(message.value.toString());
          await this.processEvent(event);
        } catch (error) {
          console.error('Processing error:', error);
          // Send to dead letter topic
          await this.sendToDeadLetter(message);
        }
      },
    });
  }

  private async processEvent(event: Event): Promise<void> {
    console.log('Processing event:', event);
    // Your event processing logic here
  }

  private async sendToDeadLetter(message: KafkaMessage): Promise<void> {
    const producer = this.kafka.producer();
    await producer.connect();

    try {
      await producer.send({
        topic: 'events-dead-letter',
        messages: [{
          key: message.key,
          value: message.value,
          headers: {
            ...message.headers,
            'original-topic': 'events',
            'error-timestamp': Date.now().toString()
          }
        }]
      });
    } finally {
      await producer.disconnect();
    }
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }
}

// Usage
const service = new KafkaConsumerService('my-app', ['localhost:9092'], 'my-group');
service.run().catch(console.error);
```

## Prerequisites

```bash
# Docker
brew install --cask docker

# Language clients (choose your language)

# JavaScript/Node.js
npm install amqplib kafkajs nats redis

# TypeScript
npm install amqplib kafkajs nats redis
npm install --save-dev @types/amqplib typescript ts-node

# or Python
pip install pika kafka-python nats-py redis

# Optional: CLI tools
brew install kafka
brew install rabbitmq
```

## Recommended Study Path

### Week 1-2: Open Source Brokers (Self-Hosted)
**Week 1: Traditional Queues**
- Days 1-4: RabbitMQ (all 8 tutorials)
- Day 5: Build a task queue application
- Weekend: Review and experiment

**Week 2: Event Streaming**
- Days 1-5: Kafka (all 8 tutorials)
- Weekend: Build a streaming application

### Week 3-4: Lightweight Messaging
**Week 3: Cloud-Native & In-Memory**
- Days 1-3: NATS (all 8 tutorials)
- Days 4-5: Redis Pub/Sub (tutorials 1-5)
- Weekend: Compare patterns

**Week 4: Complete Open Source**
- Days 1-2: Complete Redis Pub/Sub (tutorials 6-8)
- Days 3-5: Build multi-broker application
- Weekend: Architecture comparison

### Week 5-6: Cloud Provider Queues (Managed Services)
**Week 5: AWS Ecosystem**
- Days 1-3: AWS SQS/SNS (tutorials 1-4)
- Days 4-5: Amazon MQ & Lambda integration (tutorials 5-6)
- Weekend: EventBridge & cost optimization (tutorials 7-8)

**Week 6: Azure & GCP**
- Days 1-2: Azure Queue Storage & Service Bus (tutorials 1-4)
- Days 3-5: Azure Functions & Event Grid (tutorials 5-8)
- Weekend: GCP Pub/Sub quickstart

### Week 7: Google Cloud & Integration
- Days 1-3: GCP Pub/Sub complete (all 8 tutorials)
- Days 4-5: Cross-cloud comparison project
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

**AWS SQS/SNS**: Serverless order processing
```
API Gateway → Lambda → [SNS: order.created] → [SQS: inventory-queue] → Lambda (Inventory)
                                            → [SQS: email-queue] → Lambda (Email)
                                            → [SQS: analytics-queue] → Lambda (Analytics)
```

**Azure Service Bus**: Enterprise integration
```
CRM System → [Service Bus Topic: customer.updated] → Subscription (Marketing) → Marketing App
                                                   → Subscription (Support) → Support App
                                                   → Subscription (Analytics) → Data Warehouse
```

**GCP Pub/Sub**: Real-time data pipeline
```
IoT Devices → [Pub/Sub: sensor-data] → Dataflow → BigQuery
                                     → Cloud Functions → Firestore
                                     → Cloud Run → Monitoring Dashboard
```

## Additional Resources

### Open Source Brokers
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [NATS Documentation](https://docs.nats.io/)
- [Redis Pub/Sub](https://redis.io/topics/pubsub)

### Cloud Providers
- [AWS SQS Documentation](https://docs.aws.amazon.com/sqs/)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [Amazon MQ Documentation](https://docs.aws.amazon.com/amazon-mq/)
- [Azure Service Bus](https://docs.microsoft.com/en-us/azure/service-bus-messaging/)
- [Azure Queue Storage](https://docs.microsoft.com/en-us/azure/storage/queues/)
- [Google Cloud Pub/Sub](https://cloud.google.com/pubsub/docs)

### Patterns & Best Practices
- [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/)
- [Cloud Design Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/)

## Next Steps

### For Self-Hosted Solutions:
1. Start with RabbitMQ (easiest to learn)
2. Learn Kafka for event streaming
3. Explore NATS for cloud-native
4. Use Redis Pub/Sub for simple use cases

### For Cloud Solutions:
1. AWS SQS/SNS for serverless architectures
2. Azure Service Bus for enterprise integration
3. GCP Pub/Sub for real-time analytics
4. Amazon MQ when you need managed RabbitMQ

### General Path:
1. Learn one open-source broker deeply (RabbitMQ recommended)
2. Understand event streaming with Kafka
3. Explore cloud-managed services for your cloud provider
4. Build event-driven applications
5. Compare costs and choose the right tool

---

**Total Tutorials**: 56 (7 message systems × 8 tutorials)
**Estimated Time**: 90-110 hours
**Difficulty**: Intermediate to Advanced
**Cost**:
- Open source brokers: Free (runs locally)
- Cloud services: Pay-per-use (free tier available for learning)
