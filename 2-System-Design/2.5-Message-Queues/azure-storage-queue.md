# Azure Storage Queue & Service Bus

## Overview

Azure provides two managed messaging services:

1. **Azure Storage Queue**: Simple, cheap message queue
2. **Azure Service Bus**: Advanced message broker (like RabbitMQ)

**When to Use Azure Messaging**:
- ✅ Already using Azure ecosystem
- ✅ Want fully managed service
- ✅ .NET/C# applications
- ✅ Enterprise features (Service Bus)

**When NOT to Use**:
- ❌ Need event streaming (use Event Hubs/Kafka)
- ❌ On-premise deployment
- ❌ Multi-cloud strategy

---

## Azure Storage Queue

### What is it?

Simple, reliable message queue built on **Azure Storage**.

**Characteristics**:
- Very **cheap** ($0.01 per million operations)
- **Simple** (basic queue operations)
- **Scalable** (millions of messages)
- **At-least-once** delivery
- Max message size: **64 KB**

**Use when**: Need simple, cheap queue

---

### Basic Operations

**Create queue**:
```csharp
using Azure.Storage.Queues;

// Connection string from Azure Portal
string connectionString = "DefaultEndpointsProtocol=https;...";

// Create queue client
QueueClient queueClient = new QueueClient(connectionString, "myqueue");
await queueClient.CreateIfNotExistsAsync();
```

**Send message**:
```csharp
// Send message (string)
await queueClient.SendMessageAsync("Hello from Azure Queue!");

// Send JSON
var order = new { OrderId = 123, Amount = 99.99 };
string messageBody = JsonSerializer.Serialize(order);
await queueClient.SendMessageAsync(messageBody);
```

**Receive and delete message**:
```csharp
// Receive message (becomes invisible for 30 seconds)
QueueMessage message = await queueClient.ReceiveMessageAsync();

if (message != null)
{
    Console.WriteLine($"Message: {message.MessageText}");

    // Process message
    ProcessOrder(message.MessageText);

    // Delete message (success)
    await queueClient.DeleteMessageAsync(message.MessageId, message.PopReceipt);
}
```

**Peek message** (without making invisible):
```csharp
PeekedMessage peekedMessage = await queueClient.PeekMessageAsync();
Console.WriteLine($"Peeked: {peekedMessage.MessageText}");
```

---

### Key Concepts

#### Visibility Timeout

```
1. Receive message → invisible for 30s (default)
2. Process message
3. Delete message (success)
   OR
   30s expires → visible again (automatic retry)
```

**Extend visibility timeout** (if need more time):
```csharp
await queueClient.UpdateMessageAsync(
    message.MessageId,
    message.PopReceipt,
    visibilityTimeout: TimeSpan.FromSeconds(60)
);
```

#### Message Properties

```csharp
// Send with properties
await queueClient.SendMessageAsync(
    messageText: "Process order",
    visibilityTimeout: TimeSpan.Zero,  // Immediately visible
    timeToLive: TimeSpan.FromDays(7)   // Expire after 7 days
);

// Received message properties
QueueMessage message = await queueClient.ReceiveMessageAsync();
Console.WriteLine($"Dequeue count: {message.DequeueCount}");  // Retry count
Console.WriteLine($"Inserted: {message.InsertedOn}");
Console.WriteLine($"Expires: {message.ExpiresOn}");
```

#### Batch Operations

```csharp
// Receive multiple messages (max 32)
var messages = await queueClient.ReceiveMessagesAsync(maxMessages: 10);

foreach (var msg in messages.Value)
{
    ProcessMessage(msg);
    await queueClient.DeleteMessageAsync(msg.MessageId, msg.PopReceipt);
}
```

---

### Limitations

| Aspect | Limit |
|--------|-------|
| **Message size** | 64 KB |
| **Queue size** | Unlimited |
| **Message TTL** | 7 days (default), max 7 days |
| **Visibility timeout** | 30 seconds (default), max 12 hours |
| **Batch size** | 32 messages |

**Workaround for large messages**: Store in Blob Storage, send reference
```csharp
// Upload to Blob Storage
BlobClient blob = blobContainer.GetBlobClient("order-123.json");
await blob.UploadAsync(largeData);

// Send reference in queue
await queueClient.SendMessageAsync(blob.Uri.ToString());

// Consumer downloads from blob
string blobUrl = message.MessageText;
BlobClient blob = new BlobClient(new Uri(blobUrl));
var data = await blob.DownloadContentAsync();
```

---

### Pricing

**Very Cheap**:
- $0.01 per million operations
- Storage: $0.045 per GB/month

**Example**:
```
10 million messages/month
= 10M send + 10M receive + 10M delete
= 30M operations
= $0.30/month

Extremely cheap!
```

---

## Azure Service Bus

### What is it?

Enterprise-grade **message broker** with advanced features (similar to RabbitMQ).

**Characteristics**:
- **Rich features**: Topics, subscriptions, transactions, sessions
- **Reliable**: AMQP protocol
- **Larger messages**: Up to 256 KB (1 MB premium)
- **Advanced routing**: Filters, rules
- **Guaranteed ordering**: With sessions

**Use when**: Need advanced features

---

### Queues

#### Basic Queue Operations

**Create queue**:
```csharp
using Azure.Messaging.ServiceBus;

string connectionString = "Endpoint=sb://...";
ServiceBusClient client = new ServiceBusClient(connectionString);

// Send messages
ServiceBusSender sender = client.CreateSender("myqueue");

await sender.SendMessageAsync(new ServiceBusMessage("Hello!"));
```

**Receive messages**:
```csharp
// Create processor
ServiceBusProcessor processor = client.CreateProcessor("myqueue");

// Handler for received messages
processor.ProcessMessageAsync += async args =>
{
    string body = args.Message.Body.ToString();
    Console.WriteLine($"Received: {body}");

    // Complete message (delete)
    await args.CompleteMessageAsync(args.Message);
};

// Error handler
processor.ProcessErrorAsync += args =>
{
    Console.WriteLine($"Error: {args.Exception}");
    return Task.CompletedTask;
};

// Start processing
await processor.StartProcessingAsync();
```

#### Sessions (Guaranteed Ordering)

**Use case**: Process all messages for a user in order

```csharp
// Send with session ID
await sender.SendMessageAsync(new ServiceBusMessage("Order 1")
{
    SessionId = "user-123"  // All messages for this user ordered
});

await sender.SendMessageAsync(new ServiceBusMessage("Order 2")
{
    SessionId = "user-123"
});

// Receive session messages
ServiceBusSessionProcessor sessionProcessor =
    client.CreateSessionProcessor("myqueue");

sessionProcessor.ProcessMessageAsync += async args =>
{
    Console.WriteLine($"Session: {args.SessionId}");
    Console.WriteLine($"Message: {args.Message.Body}");

    await args.CompleteMessageAsync(args.Message);
};

await sessionProcessor.StartProcessingAsync();
```

**Benefits**:
- Messages with same session ID processed in order
- Different sessions processed in parallel

---

### Topics and Subscriptions (Pub/Sub)

```
┌──────────┐
│ Publisher│
└─────┬────┘
      │
      ↓
┌────────────┐
│   Topic    │
└─────┬──────┘
      │
  ┌───┼────────┬───────────┐
  │   │        │           │
  ↓   ↓        ↓           ↓
[Sub1] [Sub2] [Sub3]    [Sub4]
  │     │       │          │
  ↓     ↓       ↓          ↓
App1  App2    App3       App4
```

**Create and publish**:
```csharp
// Send to topic
ServiceBusSender sender = client.CreateSender("order-events");

await sender.SendMessageAsync(new ServiceBusMessage(
    JsonSerializer.Serialize(new { OrderId = 123, Amount = 99.99 })
)
{
    Subject = "order.created",  // For filtering
    ApplicationProperties =
    {
        ["Priority"] = "high",
        ["Region"] = "us-east"
    }
});
```

**Subscribe with filter**:
```csharp
// Subscription 1: High priority only
// (configured in Azure Portal or CLI)
az servicebus topic subscription rule create \
  --resource-group mygroup \
  --namespace-name mynamespace \
  --topic-name order-events \
  --subscription-name high-priority-sub \
  --name HighPriorityFilter \
  --filter-sql-expression "Priority = 'high'"

// Subscription 2: Specific regions
az servicebus topic subscription rule create \
  --name RegionFilter \
  --filter-sql-expression "Region IN ('us-east', 'us-west')"

// Receive from subscription
ServiceBusProcessor processor = client.CreateProcessor(
    "order-events",
    "high-priority-sub"
);

processor.ProcessMessageAsync += async args =>
{
    var order = JsonSerializer.Deserialize<Order>(args.Message.Body);
    Console.WriteLine($"High priority order: {order.OrderId}");
    await args.CompleteMessageAsync(args.Message);
};

await processor.StartProcessingAsync();
```

**SQL Filters**:
```sql
-- Exact match
Priority = 'high'

-- Multiple conditions
Priority = 'high' AND Region = 'us-east'

-- IN clause
EventType IN ('order.created', 'order.updated')

-- Numeric comparison
Amount > 100

-- Pattern matching
Subject LIKE 'order.%'
```

---

### Advanced Features

#### Dead Letter Queue (DLQ)

```
[Queue/Subscription] ──(failed 10x)──> [Dead Letter Queue]
```

**Automatic DLQ** (built-in):
```csharp
// Message automatically moves to DLQ after max delivery count
// (configured in queue settings, default: 10)

// Read from DLQ
ServiceBusReceiver dlqReceiver = client.CreateReceiver(
    "myqueue",
    new ServiceBusReceiverOptions
    {
        SubQueue = SubQueue.DeadLetter
    }
);

var dlqMessage = await dlqReceiver.ReceiveMessageAsync();
Console.WriteLine($"DLQ Message: {dlqMessage.Body}");
Console.WriteLine($"Reason: {dlqMessage.DeadLetterReason}");
```

**Manual DLQ** (move to DLQ explicitly):
```csharp
processor.ProcessMessageAsync += async args =>
{
    try
    {
        ProcessMessage(args.Message);
        await args.CompleteMessageAsync(args.Message);
    }
    catch (Exception ex)
    {
        // Move to DLQ with reason
        await args.DeadLetterMessageAsync(
            args.Message,
            deadLetterReason: "Processing failed",
            deadLetterErrorDescription: ex.Message
        );
    }
};
```

#### Transactions

**Atomic operations**:
```csharp
using var transaction = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

// Send multiple messages atomically
await sender.SendMessageAsync(message1);
await sender.SendMessageAsync(message2);
await sender.SendMessageAsync(message3);

transaction.Complete();  // All or nothing
```

#### Scheduled Messages

```csharp
// Schedule message for future delivery
await sender.ScheduleMessageAsync(
    new ServiceBusMessage("Reminder: Meeting in 1 hour"),
    scheduledEnqueueTime: DateTimeOffset.UtcNow.AddHours(1)
);

// Cancel scheduled message
long sequenceNumber = await sender.ScheduleMessageAsync(...);
await sender.CancelScheduledMessageAsync(sequenceNumber);
```

#### Message Deferral

```csharp
// Defer message for later processing
processor.ProcessMessageAsync += async args =>
{
    if (!CanProcessNow())
    {
        // Defer message (remove from queue but keep reference)
        await args.DeferMessageAsync(args.Message);

        // Store sequence number to retrieve later
        long seqNum = args.Message.SequenceNumber;
    }
};

// Later: Retrieve deferred message
var deferredMessage = await receiver.ReceiveDeferredMessageAsync(sequenceNumber);
```

---

### Tiers

| Feature | Basic | Standard | Premium |
|---------|-------|----------|---------|
| **Max message size** | 256 KB | 256 KB | 1 MB |
| **Queues** | ✅ | ✅ | ✅ |
| **Topics** | ❌ | ✅ | ✅ |
| **Transactions** | ❌ | ✅ | ✅ |
| **Sessions** | ❌ | ✅ | ✅ |
| **Geo-disaster recovery** | ❌ | ✅ | ✅ |
| **Throughput** | Shared | Shared | Dedicated |
| **Price** | ~$0.05/million | ~$0.10/million | Fixed (e.g., $670/month) |

---

### Pricing

**Standard Tier**:
- Base: $10/month
- Operations: $0.05 per million
- Connections: $0.03 per million

**Premium Tier**:
- Fixed price: $670+/month (dedicated resources)
- Unlimited operations

**Example**:
```
10 million messages/month (Standard)
= $10 base
+ 10M * $0.05 = $0.50
= $10.50/month

Much cheaper than AWS SQS... wait, no!
AWS SQS: $3.60/month for same volume
```

---

## Azure Event Hubs (Alternative for Streaming)

**Not a queue, but worth mentioning**: Azure's answer to Kafka

**Use when**:
- Need event streaming
- High throughput (millions/sec)
- Event replay
- Log aggregation

**Pricing**: Fixed (e.g., $100/month for Standard)

---

## Comparison: Storage Queue vs Service Bus

| Feature | Storage Queue | Service Bus |
|---------|---------------|-------------|
| **Message size** | 64 KB | 256 KB (1 MB premium) |
| **Ordering** | No | Yes (with sessions) |
| **Delivery** | At-least-once | At-least-once (exactly-once with sessions) |
| **Pub/Sub** | No | Yes (topics) |
| **Transactions** | No | Yes |
| **Dead letter** | No (manual) | Yes (built-in) |
| **Price** | Very cheap ($0.01/M) | More expensive ($0.05/M+) |
| **Use case** | Simple queue | Enterprise features |

**Decision**:
- **Storage Queue**: Simple, cheap, no advanced features needed
- **Service Bus**: Need pub/sub, ordering, transactions, enterprise features

---

## Common Patterns

### 1. Work Queue (Storage Queue)
```csharp
// Simple task queue
await queueClient.SendMessageAsync("Process image: photo.jpg");

// Worker
while (true)
{
    var message = await queueClient.ReceiveMessageAsync();
    if (message != null)
    {
        ProcessImage(message.MessageText);
        await queueClient.DeleteMessageAsync(message.MessageId, message.PopReceipt);
    }
}
```

### 2. Pub/Sub (Service Bus Topic)
```csharp
// Publisher
await sender.SendMessageAsync(new ServiceBusMessage("Order created"));

// Multiple subscribers
// Sub1: Inventory service
// Sub2: Shipping service
// Sub3: Analytics service
```

### 3. Competing Consumers (Service Bus Queue)
```csharp
// Multiple workers read from same queue
// Load balanced automatically
```

### 4. Priority Queue (Multiple Queues)
```csharp
// High priority queue
await highPriorityQueue.SendMessageAsync("Urgent task");

// Low priority queue
await lowPriorityQueue.SendMessageAsync("Regular task");

// Workers poll high priority first
```

---

## Best Practices

### Storage Queue

✅ **DO**:
- Use for simple, cheap queues
- Store large messages in Blob Storage (send reference)
- Batch operations (up to 32)
- Delete messages after processing

❌ **DON'T**:
- Use for complex routing (use Service Bus)
- Store > 64 KB messages
- Expect ordering
- Use for pub/sub

### Service Bus

✅ **DO**:
- Use sessions for ordering
- Configure DLQ
- Use filters for subscriptions
- Monitor metrics

❌ **DON'T**:
- Use for simple queues (too expensive, use Storage Queue)
- Store large payloads (use Blob reference)
- Ignore DLQ

---

## Monitoring

**Azure Monitor metrics**:

**Storage Queue**:
- `MessageCount`: Messages in queue
- `Transactions`: Operations per second

**Service Bus**:
- `ActiveMessages`: Messages in queue/subscription
- `DeadLetterMessages`: DLQ count
- `IncomingMessages`: Messages received
- `OutgoingMessages`: Messages delivered

**Alerts**:
```bash
# Alert if queue depth > 1000
az monitor metrics alert create \
  --name HighQueueDepth \
  --resource myqueue \
  --metric MessageCount \
  --operator GreaterThan \
  --threshold 1000
```

---

## Interview Questions

**Q: "Storage Queue vs Service Bus?"**
- Storage Queue: Simple, cheap, no advanced features
- Service Bus: Enterprise features (pub/sub, ordering, transactions)

**Q: "How to ensure ordering in Service Bus?"**
- Use sessions (SessionId)
- Messages with same session ID processed in order

**Q: "Service Bus vs AWS SQS?"**
- Service Bus: More features (topics, sessions, transactions)
- SQS: Simpler, cheaper, better AWS integration

**Q: "How to handle large messages?"**
- Store in Blob Storage
- Send reference (URL) in queue
- Consumer downloads from Blob

---

## Summary

**Use Storage Queue when**:
- Simple queue needed
- Low cost important
- Azure ecosystem

**Use Service Bus when**:
- Need pub/sub (topics)
- Need ordering (sessions)
- Enterprise features (transactions, DLQ)

**Use Event Hubs when**:
- Event streaming
- High throughput
- Kafka alternative

**Next**: Compare with [AWS SQS](./aws-sqs-sns.md) or [RabbitMQ](./rabbitmq.md)
