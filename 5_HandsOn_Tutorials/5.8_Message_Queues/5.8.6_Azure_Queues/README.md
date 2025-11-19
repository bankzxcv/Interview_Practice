# 5.8.6 Azure Queue Services - Hands-On Tutorials

## Overview

Master Microsoft Azure's messaging services with comprehensive tutorials covering Azure Queue Storage, Service Bus, and Event Grid. Learn from basic queue operations to advanced enterprise integration patterns with managed cloud messaging.

Azure provides three main messaging services:
- **Azure Queue Storage**: Simple, reliable message queuing for task distribution
- **Azure Service Bus**: Enterprise messaging with advanced features (sessions, transactions, duplicate detection)
- **Azure Event Grid**: Event routing service for reactive programming

## When to Use Each Service

### Azure Queue Storage
**Pattern**: Simple message queue
**Best For**: Basic task queues, asynchronous processing, simple work distribution
**Max Message Size**: 64 KB
**Pricing**: Very low cost ($0.0004 per 10,000 operations)

**Use When**:
- Simple point-to-point messaging
- Large queue volumes (millions of messages)
- Messages accessed via REST API
- Cost is primary concern
- No need for advanced features

### Azure Service Bus
**Pattern**: Enterprise message broker
**Best For**: Complex routing, enterprise integration, reliable messaging
**Max Message Size**: 256 KB (Standard), 1 MB (Premium)
**Pricing**: Medium cost (starts at ~$10/month)

**Use When**:
- Need FIFO guarantees
- Require duplicate detection
- Need message sessions
- Complex routing with topics
- Enterprise reliability requirements
- Transactions required

### Azure Event Grid
**Pattern**: Event routing
**Best For**: Reactive programming, event-driven architectures
**Max Message Size**: 1 MB
**Pricing**: Pay per event ($0.60 per million operations)

**Use When**:
- Event-driven architectures
- Reacting to Azure service events
- Fan-out to multiple handlers
- Serverless event routing
- Need filtering and routing

## Tutorial Structure

### [Tutorial 01: Azure Queue Storage Basics](./01_queue_storage/)
Introduction to Azure Queue Storage with Azurite local development
- Storage account setup and connection
- Queue creation and management
- Sending and receiving messages
- Message TTL and visibility timeout
- Python with azure-storage-queue
- Local development with Azurite

### [Tutorial 02: Azure Service Bus Queues](./02_service_bus_queues/)
Enterprise messaging with Service Bus queues
- Service Bus namespace creation
- Queue properties and configuration
- Send and receive patterns
- Message sessions for FIFO
- Dead letter queue handling
- Auto-forwarding between queues
- Python with azure-servicebus

### [Tutorial 03: Service Bus Topics and Subscriptions](./03_topics_subscriptions/)
Publish-subscribe pattern with filtering
- Topic creation and management
- Multiple subscriptions
- SQL filters and actions
- Correlation filters
- Fanout messaging pattern
- Python publisher and subscriber code

### [Tutorial 04: Message Sessions and Ordering](./04_sessions_ordering/)
Guaranteed message ordering with sessions
- Session-based messaging
- FIFO guarantees per session
- Session state management
- Partitioned vs non-partitioned
- Python session handling
- Use cases and patterns

### [Tutorial 05: Dead Lettering and Auto-Forwarding](./05_dead_lettering/)
Advanced message handling and routing
- Dead letter queue configuration
- Auto-forwarding rules
- Message deferral
- Peek-lock pattern
- Monitoring dead letters
- Python examples for all patterns

### [Tutorial 06: Azure Functions Integration](./06_functions_integration/)
Serverless message processing
- Queue Storage triggers
- Service Bus triggers
- Output bindings
- Batch processing
- Error handling and retries
- Python Azure Functions

### [Tutorial 07: Service Bus with Event Grid](./07_event_grid/)
Event-driven integration patterns
- Event Grid overview
- Custom topics and subscriptions
- Service Bus integration
- Event filtering and routing
- CloudEvents schema
- Python event handlers

### [Tutorial 08: Production Deployment and Monitoring](./08_production_deployment/)
Production-ready deployment and operations
- ARM templates and Bicep
- Geo-disaster recovery
- Premium tier features
- Azure Monitor integration
- Application Insights
- Managed Identity security
- Cost optimization strategies

## Quick Reference

### Azure Queue Storage (Python)

```python
from azure.storage.queue import QueueClient

# Create queue client
queue_client = QueueClient.from_connection_string(
    conn_str="DefaultEndpointsProtocol=https;...",
    queue_name="myqueue"
)

# Create queue
queue_client.create_queue()

# Send message
queue_client.send_message("Hello Azure Queue!")

# Receive message
messages = queue_client.receive_messages(messages_per_page=1)
for message in messages:
    print(f"Message: {message.content}")
    # Delete message after processing
    queue_client.delete_message(message)
```

### Azure Service Bus Queue (Python)

```python
from azure.servicebus import ServiceBusClient, ServiceBusMessage

# Create client
servicebus_client = ServiceBusClient.from_connection_string(
    conn_str="Endpoint=sb://...",
    logging_enable=True
)

# Send message
with servicebus_client:
    sender = servicebus_client.get_queue_sender(queue_name="myqueue")
    with sender:
        message = ServiceBusMessage("Hello Service Bus!")
        sender.send_messages(message)

# Receive message
with servicebus_client:
    receiver = servicebus_client.get_queue_receiver(queue_name="myqueue")
    with receiver:
        messages = receiver.receive_messages(max_wait_time=5)
        for message in messages:
            print(f"Message: {str(message)}")
            receiver.complete_message(message)
```

### Service Bus Topic (Python)

```python
from azure.servicebus import ServiceBusClient, ServiceBusMessage

# Send to topic
with servicebus_client:
    sender = servicebus_client.get_topic_sender(topic_name="events")
    with sender:
        message = ServiceBusMessage(
            body="Event occurred",
            application_properties={"event_type": "user.signup"}
        )
        sender.send_messages(message)

# Receive from subscription
with servicebus_client:
    receiver = servicebus_client.get_subscription_receiver(
        topic_name="events",
        subscription_name="email-handler"
    )
    with receiver:
        messages = receiver.receive_messages(max_wait_time=5)
        for message in messages:
            print(f"Received: {str(message)}")
            receiver.complete_message(message)
```

## Architecture Patterns

### Pattern 1: Simple Task Queue (Queue Storage)

```
Producer → [Azure Queue Storage] → Consumer (Worker)
          ↓ (if processing fails)
          [Poison Queue]
```

**Use Case**: Image processing, email sending, background jobs

### Pattern 2: Enterprise Integration (Service Bus)

```
Order Service → [Service Bus Queue] → Inventory Service
                                    → Payment Service (via auto-forward)
                                    → Dead Letter Queue (on failure)
```

**Use Case**: Order processing, financial transactions

### Pattern 3: Pub/Sub with Filtering (Service Bus Topics)

```
Event Producer → [Topic: user-events]
                   ├─ [Subscription: email] (filter: event_type='signup')
                   ├─ [Subscription: analytics] (filter: all)
                   └─ [Subscription: crm] (filter: event_type='profile_update')
```

**Use Case**: Microservices event distribution, notifications

### Pattern 4: Event-Driven (Event Grid)

```
Blob Storage → Event Grid → [Function 1: Resize image]
                           → [Function 2: Update database]
                           → [Service Bus: archive-queue]
```

**Use Case**: Reactive workflows, serverless automation

### Pattern 5: Session-Based Ordering (Service Bus)

```
Producer → [Service Bus Queue with Sessions]
           ├─ Session A → Consumer 1 (processes A messages in order)
           ├─ Session B → Consumer 2 (processes B messages in order)
           └─ Session C → Consumer 1 (processes C messages in order)
```

**Use Case**: Order processing per customer, chat messages per room

## Cost Comparison

### Queue Storage
```
Operations: $0.0004 per 10,000 operations
Storage: $0.06 per GB/month
Example: 1M messages/day = ~$1.20/month
```

**Best For**: High volume, cost-sensitive workloads

### Service Bus (Standard Tier)
```
Base: $10/month
Operations: $0.05 per million operations
Relay Hours: $0.013 per hour
Example: 1M messages/day = ~$11.50/month
```

**Best For**: Enterprise reliability requirements

### Service Bus (Premium Tier)
```
Messaging Unit: $677/month (1 MU)
- 1000 msg/sec throughput
- 1 GB storage
- No operation charges
Example: High throughput = $677+/month
```

**Best For**: High throughput, predictable costs, VNet integration

### Event Grid
```
Operations: $0.60 per million operations
Example: 1M events/day = ~$18/month
```

**Best For**: Event-driven architectures

## Service Feature Comparison

| Feature | Queue Storage | Service Bus | Event Grid |
|---------|--------------|-------------|------------|
| **Max Message Size** | 64 KB | 256 KB / 1 MB | 1 MB |
| **Max Queue Size** | 500 TB | 80 GB / 1 TB | N/A |
| **Ordering** | ❌ | ✅ Sessions | ❌ |
| **Duplicate Detection** | ❌ | ✅ | ❌ |
| **Transactions** | ❌ | ✅ | ❌ |
| **Topics/Subscriptions** | ❌ | ✅ | ✅ |
| **Message TTL** | ✅ | ✅ | ✅ |
| **Dead Lettering** | ❌ Manual | ✅ Automatic | ✅ |
| **Batching** | ✅ | ✅ | ✅ |
| **Sessions** | ❌ | ✅ | ❌ |
| **Scheduled Delivery** | ❌ | ✅ | ❌ |
| **Protocol** | REST/HTTP | AMQP/HTTP | HTTP/Webhook |
| **At-least-once** | ✅ | ✅ | ✅ |
| **At-most-once** | ❌ | ❌ | ✅ Option |

## Best Practices

### Message Design
```python
# Good: Small, focused message
{
    "order_id": "123",
    "action": "process",
    "timestamp": "2025-01-15T10:30:00Z"
}

# Bad: Large payload in message
{
    "order_data": { /* MB of data */ }
}

# Better: Reference to data
{
    "order_id": "123",
    "blob_url": "https://storage.../order-123.json"
}
```

### Reliability
- Use Peek-Lock instead of Receive-Delete
- Set appropriate message TTL
- Configure dead letter queues
- Implement idempotent processing
- Use duplicate detection (Service Bus)

### Performance
- Batch message operations
- Reuse client connections
- Use async operations
- Enable prefetching (Service Bus)
- Consider partitioning (Service Bus)

### Security
- Use Managed Identity (avoid connection strings)
- Enable TLS/HTTPS only
- Use SAS tokens with minimal permissions
- Implement VNet integration (Premium)
- Enable diagnostic logging

## Local Development with Azurite

```bash
# Install Azurite (Azure Storage Emulator)
npm install -g azurite

# Start Azurite
azurite-queue --location /tmp/azurite

# Connection string for Azurite
DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;
AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;
QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;
```

## Prerequisites

### Python Dependencies

```bash
# Azure Queue Storage
pip install azure-storage-queue

# Azure Service Bus
pip install azure-servicebus

# Azure Event Grid
pip install azure-eventgrid

# Azure Identity (for Managed Identity)
pip install azure-identity

# Azure Functions (for Tutorial 06)
pip install azure-functions
```

### Azure CLI

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Create resource group
az group create --name rg-messaging --location eastus

# Create storage account (Queue Storage)
az storage account create \
  --name stmessaging123 \
  --resource-group rg-messaging \
  --location eastus \
  --sku Standard_LRS

# Create Service Bus namespace
az servicebus namespace create \
  --name sb-messaging-123 \
  --resource-group rg-messaging \
  --location eastus \
  --sku Standard
```

## Recommended Study Path

### Week 1: Queue Storage Foundation
- **Day 1-2**: Tutorial 01 - Queue Storage basics
- **Day 3**: Build a task queue application
- **Day 4-5**: Tutorial 02 - Service Bus queues
- **Weekend**: Compare Queue Storage vs Service Bus

### Week 2: Advanced Service Bus
- **Day 1-2**: Tutorial 03 - Topics and subscriptions
- **Day 3**: Tutorial 04 - Sessions and ordering
- **Day 4-5**: Tutorial 05 - Dead lettering
- **Weekend**: Build pub/sub application

### Week 3: Integration and Production
- **Day 1-3**: Tutorial 06 - Azure Functions
- **Day 4**: Tutorial 07 - Event Grid
- **Day 5**: Tutorial 08 - Production deployment
- **Weekend**: Deploy complete solution

## What You'll Learn

After completing all tutorials:
- ✅ Understand Azure messaging service differences
- ✅ Choose the right service for your use case
- ✅ Implement reliable message processing
- ✅ Configure dead letter queues
- ✅ Use topics and subscriptions
- ✅ Guarantee message ordering with sessions
- ✅ Integrate with Azure Functions
- ✅ Implement event-driven architectures
- ✅ Monitor and troubleshoot messaging
- ✅ Deploy production-ready solutions
- ✅ Optimize costs and performance
- ✅ Secure messaging with Managed Identity

## Real-World Use Cases

### E-Commerce Order Processing
```
Order API → [Service Bus Topic: orders]
              ├─ Inventory Subscription → Update stock
              ├─ Payment Subscription → Process payment
              ├─ Email Subscription → Send confirmation
              └─ Analytics Subscription → Track metrics
```

### Image Processing Pipeline
```
Upload → Blob Storage → Event Grid → [Function: Resize]
                                   → [Queue: Thumbnail jobs]
                                   → [Function: Extract metadata]
```

### IoT Data Processing
```
IoT Hub → Event Grid → [Service Bus Topic]
                         ├─ Real-time alerts
                         ├─ Database storage
                         └─ Analytics pipeline
```

## Additional Resources

### Official Documentation
- [Azure Queue Storage](https://docs.microsoft.com/en-us/azure/storage/queues/)
- [Azure Service Bus](https://docs.microsoft.com/en-us/azure/service-bus-messaging/)
- [Azure Event Grid](https://docs.microsoft.com/en-us/azure/event-grid/)
- [Azure Functions](https://docs.microsoft.com/en-us/azure/azure-functions/)

### SDK Documentation
- [azure-storage-queue Python](https://docs.microsoft.com/en-us/python/api/azure-storage-queue/)
- [azure-servicebus Python](https://docs.microsoft.com/en-us/python/api/azure-servicebus/)
- [azure-eventgrid Python](https://docs.microsoft.com/en-us/python/api/azure-eventgrid/)

### Tools
- [Azurite (Local Emulator)](https://docs.microsoft.com/en-us/azure/storage/common/storage-use-azurite)
- [Service Bus Explorer](https://github.com/paolosalvatori/ServiceBusExplorer)
- [Azure Storage Explorer](https://azure.microsoft.com/en-us/features/storage-explorer/)

---

**Total Tutorials**: 8
**Estimated Time**: 35-45 hours
**Difficulty**: Intermediate
**Prerequisites**: Python basics, Azure account (free tier available)
**Cost**: Free tier sufficient for learning
