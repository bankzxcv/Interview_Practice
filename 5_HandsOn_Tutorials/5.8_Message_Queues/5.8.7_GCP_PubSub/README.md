# Google Cloud Pub/Sub Tutorial Series

## Overview

Google Cloud Pub/Sub is a fully-managed, real-time messaging service that allows you to send and receive messages between independent applications. It's designed for building event-driven systems and streaming analytics pipelines with global scale and reliability.

Pub/Sub is a **serverless** messaging service that automatically scales to handle any volume of messages, from a few per second to millions per second. It's globally available by default, meaning you don't need to configure regions or manage infrastructure.

## Key Features

### 1. **Global by Default**
- Topics and subscriptions are global resources
- Messages can be published and consumed from anywhere
- No need to manage regional endpoints or replication
- Built-in cross-region redundancy

### 2. **Auto-Scaling**
- Automatically scales to handle message volume
- No capacity planning required
- Seamlessly handles traffic spikes
- Pay only for what you use

### 3. **Exactly-Once Delivery**
- Guarantees each message is delivered exactly once
- Prevents duplicate processing
- Configurable at the subscription level
- Ideal for financial transactions and critical workflows

### 4. **Message Ordering**
- Maintains order within a message group using ordering keys
- Guarantees FIFO delivery for ordered messages
- Per-key ordering within a topic
- Essential for sequential processing requirements

### 5. **High Durability**
- Messages stored redundantly across multiple zones
- 99.95% availability SLA
- At-least-once delivery guarantee by default
- Configurable message retention (up to 31 days)

### 6. **Schema Validation**
- Enforce message structure with schemas
- Support for Avro and Protocol Buffers
- Schema evolution and versioning
- Prevent invalid messages from entering the system

### 7. **Flexible Subscriptions**
- **Pull**: Application pulls messages on demand
- **Push**: Pub/Sub pushes messages to HTTP endpoints
- Multiple subscriptions per topic
- Independent message consumption patterns

### 8. **Dead Letter Topics**
- Handle undeliverable messages
- Configurable retry policies
- Maximum delivery attempts
- Separate processing for failed messages

## When to Use Google Cloud Pub/Sub

### Ideal Use Cases

1. **Event-Driven Architectures**
   - Microservices communication
   - Event sourcing patterns
   - Decoupling application components
   - Serverless workflows with Cloud Functions

2. **Real-Time Analytics**
   - Streaming data pipelines
   - Log aggregation and analysis
   - IoT sensor data processing
   - Real-time dashboards

3. **Data Integration**
   - ETL/ELT pipelines
   - Database change data capture (CDC)
   - Multi-cloud data synchronization
   - Legacy system integration

4. **Async Processing**
   - Background job processing
   - Email/notification delivery
   - Image/video processing
   - Batch operations

5. **Global Applications**
   - Multi-region deployments
   - Global event distribution
   - Disaster recovery scenarios
   - Geo-distributed workloads

### When NOT to Use Pub/Sub

- **Request-response patterns**: Use REST/gRPC APIs instead
- **Temporary message queues**: Use Cloud Tasks for simple task queues
- **Direct service-to-service calls**: Use direct HTTP/gRPC when appropriate
- **Ultra-low latency requirements**: Consider alternative solutions for sub-millisecond needs

## Tutorial Listing

### [Tutorial 01: Basic Pub/Sub Setup and Publishing](./01_basic_setup/README.md)
Learn the fundamentals of Google Cloud Pub/Sub including project setup, creating topics, and publishing messages. Covers authentication, message attributes, batch publishing, and local development with the Pub/Sub emulator.

**Topics Covered:**
- GCP project and service account setup
- Creating and managing topics
- Publishing single and batch messages
- Message attributes and metadata
- Using the Pub/Sub emulator for local development
- Python client library basics

### [Tutorial 02: Pull and Push Subscriptions](./02_subscriptions/README.md)
Deep dive into Pub/Sub subscription types with practical examples of both pull and push subscriptions. Learn about message acknowledgment, flow control, and implementing robust consumers.

**Topics Covered:**
- Creating pull and push subscriptions
- Synchronous and asynchronous pull
- Message acknowledgment and deadlines
- Push endpoints and webhook configuration
- Flow control and concurrency
- Error handling and exponential backoff

### [Tutorial 03: Message Ordering and Exactly-Once Delivery](./03_ordering_delivery/README.md)
Master message ordering guarantees and exactly-once delivery semantics. Learn when and how to use ordering keys and configure exactly-once delivery for critical workflows.

**Topics Covered:**
- Enabling message ordering with ordering keys
- Exactly-once delivery configuration
- Idempotent message processing
- Ordering guarantees and limitations
- Performance implications
- Best practices for ordered messages

### [Tutorial 04: Dead Letter Topics and Retry Policies](./04_dead_letter/README.md)
Implement robust error handling with dead letter topics and configurable retry policies. Learn to handle failed messages gracefully and build resilient messaging systems.

**Topics Covered:**
- Dead letter topic setup and configuration
- Retry policies (min/max backoff)
- Maximum delivery attempts
- Monitoring and processing dead letters
- Reprocessing strategies
- Best practices for error handling

### [Tutorial 05: Schema Validation](./05_schema_validation/README.md)
Enforce message structure and data quality using Pub/Sub schemas. Learn to define Avro and Protocol Buffer schemas, handle schema evolution, and validate messages automatically.

**Topics Covered:**
- Creating and managing schemas
- Avro schema definitions
- Protocol Buffers integration
- Schema evolution strategies
- Message validation and encoding
- Version management

### [Tutorial 06: Cloud Functions and Dataflow Integration](./06_dataflow_integration/README.md)
Build serverless event-driven applications by integrating Pub/Sub with Cloud Functions. Create sophisticated stream processing pipelines using Apache Beam and Dataflow for real-time data transformation.

**Topics Covered:**
- Cloud Functions triggered by Pub/Sub
- Event-driven architectures
- Apache Beam basics
- Dataflow pipeline creation
- Windowing and aggregations
- Stream processing patterns

### [Tutorial 07: BigQuery and Data Pipeline Integration](./07_bigquery_integration/README.md)
Stream data directly from Pub/Sub to BigQuery for real-time analytics. Learn about BigQuery subscriptions, data transformation, and building complete data pipelines for business intelligence.

**Topics Covered:**
- BigQuery subscription setup
- Direct Pub/Sub to BigQuery streaming
- Data transformation and enrichment
- Schema mapping and evolution
- Real-time analytics queries
- Cost optimization strategies

### [Tutorial 08: Global Deployment and Monitoring](./08_global_deployment/README.md)
Deploy Pub/Sub at scale with multi-region architecture, comprehensive monitoring, and production-ready configurations. Learn Infrastructure as Code with Terraform and implement observability best practices.

**Topics Covered:**
- Multi-region architecture
- Global message routing
- Cloud Monitoring integration
- Alerting policies and SLOs
- Logging and distributed tracing
- Terraform infrastructure provisioning
- Production deployment best practices

## Quick Reference

### Installation

```bash
# Install Python client library
pip install google-cloud-pubsub

# Install Pub/Sub emulator (requires Java)
gcloud components install pubsub-emulator

# Install Terraform (for infrastructure management)
# Download from https://www.terraform.io/downloads
```

### Python Quick Start

```python
from google.cloud import pubsub_v1

# Publisher
publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path('your-project-id', 'your-topic')
future = publisher.publish(topic_path, b'Hello, Pub/Sub!')
message_id = future.result()

# Subscriber (Pull)
subscriber = pubsub_v1.SubscriberClient()
subscription_path = subscriber.subscription_path('your-project-id', 'your-subscription')

def callback(message):
    print(f"Received: {message.data}")
    message.ack()

streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
streaming_pull_future.result()
```

### Common gcloud Commands

```bash
# Create a topic
gcloud pubsub topics create my-topic

# Create a subscription
gcloud pubsub subscriptions create my-subscription --topic=my-topic

# Publish a message
gcloud pubsub topics publish my-topic --message="Hello World"

# Pull messages
gcloud pubsub subscriptions pull my-subscription --auto-ack

# List topics
gcloud pubsub topics list

# List subscriptions
gcloud pubsub subscriptions list

# Delete a topic
gcloud pubsub topics delete my-topic

# Delete a subscription
gcloud pubsub subscriptions delete my-subscription
```

## Architecture Patterns

### 1. **Fan-Out Pattern**
One publisher sends messages to a topic, multiple subscriptions consume independently.

```
Publisher → Topic → Subscription 1 → Consumer 1
                 → Subscription 2 → Consumer 2
                 → Subscription 3 → Consumer 3
```

**Use Cases:** Event broadcasting, multi-stage processing, parallel workflows

### 2. **Work Queue Pattern**
Multiple workers consume from a single subscription for load balancing.

```
Publisher → Topic → Subscription → Consumer 1
                                → Consumer 2
                                → Consumer 3
```

**Use Cases:** Task distribution, parallel processing, load balancing

### 3. **Dead Letter Pattern**
Failed messages route to a dead letter topic for separate processing.

```
Publisher → Topic → Subscription → Consumer
                                → (failures) → DLT → Error Handler
```

**Use Cases:** Error handling, retry logic, message inspection

### 4. **Aggregation Pattern**
Multiple publishers send to one topic, single consumer aggregates.

```
Publisher 1 → Topic → Subscription → Aggregator
Publisher 2 →
Publisher 3 →
```

**Use Cases:** Log aggregation, metrics collection, event consolidation

### 5. **Chain Pattern**
Process messages in stages, each stage publishes to next topic.

```
Stage 1 → Topic 1 → Sub 1 → Processor → Topic 2 → Sub 2 → Processor → Topic 3
```

**Use Cases:** Multi-step workflows, data transformation pipelines, ETL

## Cost Optimization

### Pricing Overview

- **Message ingress**: Free
- **Message throughput**: $40 per TiB after first 10 GiB
- **Message storage**: $0.27 per GiB-month for retained messages
- **Egress**: Standard GCP egress pricing

### Optimization Strategies

1. **Batch Publishing**
   ```python
   # Batch settings for better throughput
   batch_settings = pubsub_v1.types.BatchSettings(
       max_messages=100,
       max_bytes=1024 * 1024,  # 1 MB
       max_latency=0.1,  # 100ms
   )
   publisher = pubsub_v1.PublisherClient(batch_settings=batch_settings)
   ```

2. **Message Retention**
   - Reduce retention period if messages don't need long storage
   - Default is 7 days, can be reduced to minutes

3. **Compression**
   - Compress large payloads before publishing
   - Use efficient serialization formats (Protocol Buffers vs JSON)

4. **Right-Size Subscriptions**
   - Use pull subscriptions for better control
   - Adjust flow control settings to match processing capacity

5. **Regional Deployment**
   - Keep Pub/Sub close to consumers
   - Minimize cross-region egress charges

## Best Practices

### 1. **Message Design**
- Keep messages small (< 10 MB limit, aim for < 1 MB)
- Use message attributes for metadata, not in payload
- Include idempotency keys for exactly-once processing
- Add timestamps and correlation IDs for tracing

### 2. **Error Handling**
- Always configure dead letter topics for production
- Set appropriate retry policies (exponential backoff)
- Implement idempotent consumers
- Log unprocessable messages for investigation

### 3. **Scaling**
- Use multiple subscriptions for parallel processing
- Configure flow control to prevent overload
- Monitor subscription lag and backlog
- Scale consumers based on metrics

### 4. **Security**
- Use service accounts with minimal permissions
- Implement IAM roles (Publisher, Subscriber, Viewer)
- Enable VPC Service Controls for enterprise security
- Encrypt sensitive data before publishing

### 5. **Monitoring**
- Track subscription backlog and age
- Monitor publish latency and throughput
- Set up alerts for message delivery failures
- Use Cloud Trace for distributed tracing

### 6. **Testing**
- Use Pub/Sub emulator for local development
- Implement integration tests with test projects
- Test error scenarios and retry logic
- Validate schema changes before production

### 7. **Operational Excellence**
- Tag resources appropriately
- Document message schemas and flows
- Implement gradual rollouts for changes
- Have runbooks for common issues

## Resources

- **Official Documentation**: https://cloud.google.com/pubsub/docs
- **Python Client Library**: https://googleapis.dev/python/pubsub/latest/
- **Pricing Calculator**: https://cloud.google.com/products/calculator
- **Quotas and Limits**: https://cloud.google.com/pubsub/quotas
- **Architecture Guide**: https://cloud.google.com/architecture/designing-pub-sub
- **Best Practices**: https://cloud.google.com/pubsub/docs/publisher
- **Samples Repository**: https://github.com/googleapis/python-pubsub

## Getting Started

1. Start with [Tutorial 01](./01_basic_setup/README.md) to set up your environment
2. Progress through tutorials 02-05 to learn core Pub/Sub features
3. Explore tutorials 06-07 for integration with other GCP services
4. Complete [Tutorial 08](./08_global_deployment/README.md) for production deployment

Each tutorial includes complete working code examples, Terraform configurations, and hands-on exercises to reinforce learning.

---

**Next:** Begin with [Tutorial 01: Basic Pub/Sub Setup and Publishing](./01_basic_setup/README.md)
