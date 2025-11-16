# AWS SQS & SNS - Managed Message Services

## Overview

AWS provides two managed messaging services that require **zero operations** and scale automatically:

1. **SQS (Simple Queue Service)**: Message queue
2. **SNS (Simple Notification Service)**: Pub/sub

**When to Use AWS SQS/SNS**:
- ✅ Already using AWS ecosystem
- ✅ Want fully managed service (no ops)
- ✅ Pay-per-use model
- ✅ Simple use cases
- ✅ Need auto-scaling

**When NOT to Use**:
- ❌ Need event replay (use Kafka)
- ❌ Complex routing (use RabbitMQ)
- ❌ On-premise deployment
- ❌ Multi-cloud strategy
- ❌ Very high throughput (millions/sec → Kafka)

---

## AWS SQS (Simple Queue Service)

### What is SQS?

Fully managed **message queue** for decoupling distributed systems.

```
┌──────────┐
│ Producer │ (sends messages)
└─────┬────┘
      │
      ↓
┌──────────────────┐
│    SQS Queue     │
│  ┌────┐┌────┐    │
│  │ M1 ││ M2 │... │
│  └────┘└────┘    │
└──────────────────┘
      │
      ↓
┌──────────┐
│ Consumer │ (polls for messages)
└──────────┘
```

### Two Queue Types

#### 1. Standard Queue (Default)

**Features**:
- **Unlimited throughput**: No limit on messages/sec
- **At-least-once delivery**: Message may be delivered more than once
- **Best-effort ordering**: Messages may arrive out of order

**Use case**: High throughput, order doesn't matter

```python
import boto3

sqs = boto3.client('sqs', region_name='us-east-1')

# Send message
response = sqs.send_message(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789/my-queue',
    MessageBody='Hello from SQS!'
)

print(f"Message ID: {response['MessageId']}")
```

#### 2. FIFO Queue (First-In-First-Out)

**Features**:
- **Guaranteed ordering**: Messages delivered in exact order sent
- **Exactly-once processing**: No duplicates
- **Limited throughput**: 300 msg/sec (or 3000 with batching)

**Use case**: Order matters (bank transactions, inventory)

**Queue name must end in `.fifo`**:
```python
# Send to FIFO queue
response = sqs.send_message(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789/orders.fifo',
    MessageBody='Order #123',
    MessageGroupId='user-456',  # Required for FIFO
    MessageDeduplicationId='unique-id-123'  # Prevents duplicates
)
```

**Message Group ID**:
- Messages with same group ID → processed in order
- Different group IDs → processed in parallel

```
FIFO Queue:
  Group "user-123": [M1] [M2] [M3] (ordered)
  Group "user-456": [M4] [M5] [M6] (ordered)

Groups processed in parallel!
```

---

### Core Concepts

#### Visibility Timeout

```
1. Consumer receives message from queue
2. Message becomes "invisible" to other consumers for X seconds
3. Consumer processes message
4. Consumer deletes message (success)
   OR
   Visibility timeout expires → message becomes visible again (retry)
```

**Example**:
```python
# Receive message (default visibility timeout: 30s)
messages = sqs.receive_message(
    QueueUrl=queue_url,
    MaxNumberOfMessages=1,
    VisibilityTimeout=60  # 60 seconds to process
)

for message in messages.get('Messages', []):
    try:
        # Process message
        process(message['Body'])

        # Delete message (success)
        sqs.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=message['ReceiptHandle']
        )
    except Exception as e:
        # Don't delete → becomes visible again after timeout
        print(f"Error: {e}")
```

**Change visibility timeout** (if need more time):
```python
sqs.change_message_visibility(
    QueueUrl=queue_url,
    ReceiptHandle=receipt_handle,
    VisibilityTimeout=120  # Extend to 2 minutes
)
```

#### Message Retention

- **Default**: 4 days
- **Max**: 14 days
- **Min**: 1 minute

```python
# Set retention period
sqs.set_queue_attributes(
    QueueUrl=queue_url,
    Attributes={
        'MessageRetentionPeriod': '1209600'  # 14 days in seconds
    }
)
```

#### Long Polling

**Problem**: Short polling wastes API calls

```
Short polling (default):
  Consumer → SQS: "Any messages?" → Empty
  (waits 1 second)
  Consumer → SQS: "Any messages?" → Empty
  ... (many empty API calls = expensive!)

Long polling:
  Consumer → SQS: "Wait up to 20 seconds for messages"
  (SQS holds connection until message arrives or timeout)
  → More efficient, lower cost
```

**Enable long polling**:
```python
messages = sqs.receive_message(
    QueueUrl=queue_url,
    WaitTimeSeconds=20  # Long poll for up to 20 seconds
)
```

#### Dead Letter Queue (DLQ)

```
[Main Queue] ──(failed 3x)──> [Dead Letter Queue]
```

**Setup**:
```python
# Create DLQ
dlq = sqs.create_queue(QueueName='my-dlq')
dlq_arn = sqs.get_queue_attributes(
    QueueUrl=dlq['QueueUrl'],
    AttributeNames=['QueueArn']
)['Attributes']['QueueArn']

# Configure main queue to use DLQ
sqs.set_queue_attributes(
    QueueUrl=main_queue_url,
    Attributes={
        'RedrivePolicy': json.dumps({
            'deadLetterTargetArn': dlq_arn,
            'maxReceiveCount': '3'  # After 3 failures → DLQ
        })
    }
)
```

---

### Message Attributes

```python
sqs.send_message(
    QueueUrl=queue_url,
    MessageBody='Process order',
    MessageAttributes={
        'Priority': {
            'StringValue': 'high',
            'DataType': 'String'
        },
        'OrderValue': {
            'StringValue': '199.99',
            'DataType': 'Number'
        },
        'Timestamp': {
            'StringValue': str(time.time()),
            'DataType': 'Number'
        }
    }
)

# Consumer filters by attribute
messages = sqs.receive_message(
    QueueUrl=queue_url,
    MessageAttributeNames=['Priority', 'OrderValue']
)
```

---

### Batch Operations

**Send batch** (up to 10 messages):
```python
sqs.send_message_batch(
    QueueUrl=queue_url,
    Entries=[
        {
            'Id': '1',
            'MessageBody': 'Message 1'
        },
        {
            'Id': '2',
            'MessageBody': 'Message 2'
        },
        # ... up to 10
    ]
)
```

**Benefits**:
- Reduce API calls (cost savings)
- Higher throughput

---

### Pricing

**Standard Queue**:
- First 1 million requests/month: FREE
- $0.40 per million requests after

**FIFO Queue**:
- First 1 million requests/month: FREE
- $0.50 per million requests after

**Example**:
```
10 million messages/month
= 10M requests
= 9M paid requests (1M free)
= 9 * $0.40 = $3.60/month

Very cheap for most use cases!
```

---

## AWS SNS (Simple Notification Service)

### What is SNS?

Fully managed **pub/sub** service for fan-out messaging.

```
┌──────────┐
│ Publisher│
└─────┬────┘
      │ Publish
      ↓
┌─────────────┐
│  SNS Topic  │
└──────┬──────┘
       │
       ├──────────┬──────────┬──────────┐
       │          │          │          │
       ↓          ↓          ↓          ↓
   [SQS Queue] [Lambda]  [Email]  [HTTP/S]
       │
       ↓
   [Consumer]
```

### Use Cases

1. **Fan-out**: One message → Multiple destinations
2. **Notifications**: Email, SMS, push notifications
3. **Event-driven**: Trigger Lambda functions
4. **Decoupling**: Pub/sub between services

---

### Creating and Using Topics

**Create topic**:
```python
sns = boto3.client('sns', region_name='us-east-1')

response = sns.create_topic(Name='order-events')
topic_arn = response['TopicArn']
print(f"Topic ARN: {topic_arn}")
```

**Publish message**:
```python
sns.publish(
    TopicArn=topic_arn,
    Message=json.dumps({
        'order_id': 123,
        'user_id': 456,
        'amount': 99.99
    }),
    Subject='New Order',
    MessageAttributes={
        'event_type': {
            'DataType': 'String',
            'StringValue': 'order.created'
        }
    }
)
```

---

### Subscription Types

#### 1. SQS (Queue)
```python
# Subscribe SQS queue to SNS topic
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sqs',
    Endpoint='arn:aws:sqs:us-east-1:123456789:my-queue'
)
```

**Benefit**: Reliable delivery, consumers poll at their own pace

#### 2. Lambda
```python
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='lambda',
    Endpoint='arn:aws:lambda:us-east-1:123456789:function:process-order'
)
```

**Benefit**: Serverless, auto-scaling

#### 3. HTTP/HTTPS
```python
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='https',
    Endpoint='https://myapp.com/webhook'
)
```

**Benefit**: Integrate with external services

#### 4. Email
```python
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='email',
    Endpoint='admin@example.com'
)
```

**Benefit**: Human notifications

#### 5. SMS
```python
sns.publish(
    PhoneNumber='+1234567890',
    Message='Your order has shipped!'
)
```

---

### Message Filtering

**Problem**: All subscribers get all messages

**Solution**: Filter policies

```python
# Subscribe with filter
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sqs',
    Endpoint=queue_arn,
    Attributes={
        'FilterPolicy': json.dumps({
            'event_type': ['order.created', 'order.updated']
            # Only receive these event types
        })
    }
)

# Another subscriber with different filter
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sqs',
    Endpoint=another_queue_arn,
    Attributes={
        'FilterPolicy': json.dumps({
            'priority': ['high']
            # Only receive high priority
        })
    }
)
```

**Filters**:
```json
{
  "event_type": ["order.created"],           // Exact match
  "amount": [{"numeric": [">", 100]}],      // Numeric comparison
  "region": ["us-east", "us-west"],         // Multiple values (OR)
  "priority": [{"exists": true}]            // Attribute exists
}
```

---

### FIFO Topics

**Features** (like FIFO queues):
- Ordered delivery
- Exactly-once processing
- Deduplication

**Create FIFO topic**:
```python
sns.create_topic(
    Name='orders.fifo',  # Must end in .fifo
    Attributes={
        'FifoTopic': 'true',
        'ContentBasedDeduplication': 'true'
    }
)
```

**Publish to FIFO topic**:
```python
sns.publish(
    TopicArn=fifo_topic_arn,
    Message='Order created',
    MessageGroupId='user-123',  # Required
    MessageDeduplicationId='unique-id'  # Required (or use content-based)
)
```

**Important**: FIFO topic can only subscribe to FIFO SQS queues!

---

### Pricing

**Standard Topics**:
- First 1 million publishes/month: FREE
- $0.50 per million publishes after
- Delivery varies by protocol (SQS free, SMS expensive)

**Example**:
```
Publish to 1 SNS topic → 3 SQS queues
= 1 publish + 3 deliveries
= 1 SNS request + 3 SQS requests

Cost:
  SNS: $0.50 per 1M publishes
  SQS: $0.40 per 1M requests (per queue)
```

---

## SNS + SQS Fan-Out Pattern

### Architecture

```
┌──────────────┐
│  Publisher   │
└──────┬───────┘
       │
       ↓
┌────────────────┐
│   SNS Topic    │
└────────┬───────┘
         │
    ┌────┼─────────┬──────────┐
    │    │         │          │
    ↓    ↓         ↓          ↓
 [Queue1] [Queue2] [Queue3] [Lambda]
    │      │         │
    ↓      ↓         ↓
[Consumer1] [Consumer2] [Consumer3]
(Inventory) (Shipping)  (Analytics)
```

**Benefits**:
- One publish → multiple consumers
- Each service has own queue (decoupled)
- Consumers process at own pace
- Easy to add new consumers (subscribe new queue)

**Setup**:
```python
# 1. Create SNS topic
topic = sns.create_topic(Name='order-events')
topic_arn = topic['TopicArn']

# 2. Create SQS queues
inventory_queue = sqs.create_queue(QueueName='inventory-queue')
shipping_queue = sqs.create_queue(QueueName='shipping-queue')

# 3. Subscribe queues to topic
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sqs',
    Endpoint=inventory_queue_arn
)
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sqs',
    Endpoint=shipping_queue_arn
)

# 4. Set SQS policy to allow SNS to send messages
sqs.set_queue_attributes(
    QueueUrl=inventory_queue['QueueUrl'],
    Attributes={
        'Policy': json.dumps({
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "sns.amazonaws.com"},
                "Action": "sqs:SendMessage",
                "Resource": inventory_queue_arn,
                "Condition": {
                    "ArnEquals": {"aws:SourceArn": topic_arn}
                }
            }]
        })
    }
)

# 5. Publish to SNS (all queues receive)
sns.publish(
    TopicArn=topic_arn,
    Message=json.dumps({'order_id': 123})
)
```

---

## Common Patterns

### 1. Work Queue (SQS)
```
[API] ──> [SQS Queue] ──> [Workers (Lambda/EC2)]
```

**Use case**: Background jobs, async processing

### 2. Pub/Sub (SNS)
```
[Event] ──> [SNS Topic] ──┬──> Service 1
                          ├──> Service 2
                          └──> Service 3
```

**Use case**: Event broadcasting

### 3. Fan-Out (SNS + SQS)
```
[Event] ──> [SNS] ──┬──> [Queue 1] ──> Consumer 1
                    ├──> [Queue 2] ──> Consumer 2
                    └──> [Queue 3] ──> Consumer 3
```

**Use case**: Microservices, parallel processing

### 4. Priority Queue (Multiple SQS Queues)
```
[API] ──┬──> [High Priority Queue] ──> Workers (poll frequently)
        ├──> [Medium Queue] ──> Workers
        └──> [Low Queue] ──> Workers (poll less frequently)
```

### 5. Dead Letter Queue
```
[Main Queue] ──(failed)──> [DLQ] ──> [Alarm/Manual Review]
```

---

## Best Practices

### SQS Best Practices

✅ **DO**:
- Use long polling (reduce costs)
- Batch operations (higher throughput)
- Set appropriate visibility timeout
- Use DLQ for failed messages
- Delete messages after processing
- Use FIFO when order matters

❌ **DON'T**:
- Use short polling (expensive)
- Process message without deleting (infinite loop!)
- Set visibility timeout too low (message re-delivered prematurely)
- Store large messages (use S3 reference instead)

### SNS Best Practices

✅ **DO**:
- Use message filtering (reduce unnecessary deliveries)
- Fan-out with SQS (reliable delivery)
- Set retry policies
- Monitor delivery failures
- Use message attributes for metadata

❌ **DON'T**:
- Subscribe HTTP endpoints without verification
- Ignore failed deliveries
- Send large messages (max 256 KB)

---

## Monitoring

**CloudWatch Metrics**:

**SQS**:
- `ApproximateNumberOfMessagesVisible`: Messages in queue
- `ApproximateAgeOfOldestMessage`: Queue backlog
- `NumberOfMessagesSent`: Throughput
- `NumberOfMessagesDeleted`: Consumption rate

**SNS**:
- `NumberOfMessagesPublished`: Publish rate
- `NumberOfNotificationsFailed`: Delivery failures
- `NumberOfNotificationsDelivered`: Success rate

**Alarms**:
```python
cloudwatch = boto3.client('cloudwatch')

# Alert if queue depth > 1000
cloudwatch.put_metric_alarm(
    AlarmName='SQS-Queue-Depth',
    MetricName='ApproximateNumberOfMessagesVisible',
    Namespace='AWS/SQS',
    Statistic='Average',
    Period=300,
    EvaluationPeriods=1,
    Threshold=1000,
    ComparisonOperator='GreaterThanThreshold'
)
```

---

## Cost Optimization

1. **Use batching**: 10 messages in 1 request vs 10 requests
2. **Long polling**: Reduce empty API calls
3. **Delete processed messages**: Don't let them expire (still counts as request)
4. **Right-size retention**: Don't keep messages longer than needed

**Example**:
```
Without batching: 10M messages = 10M requests = $3.60
With batching (10/batch): 10M messages = 1M requests = $0 (free tier!)
```

---

## Interview Questions

**Q: "SQS Standard vs FIFO?"**
- Standard: Unlimited throughput, at-least-once, best-effort ordering
- FIFO: 300 msg/sec, exactly-once, guaranteed ordering

**Q: "How to ensure exactly-once processing with SQS?"**
- Use FIFO queue (exactly-once delivery)
- Idempotent handlers (safe to retry)
- Deduplication ID

**Q: "SNS vs SQS?"**
- SNS: Pub/sub, fan-out, push
- SQS: Queue, point-to-point, pull

**Q: "How to handle poison pills in SQS?"**
- Set maxReceiveCount
- Configure DLQ
- Monitor DLQ depth
- Manual review/reprocessing

---

## Summary

**Use SQS when**:
- Need message queue
- Decoupling services
- Background jobs

**Use SNS when**:
- Need pub/sub
- Fan-out to multiple subscribers
- Notifications

**Use SNS + SQS when**:
- Fan-out with reliable delivery
- Each consumer needs own pace

**Key benefits**:
- Zero operations
- Auto-scaling
- Pay-per-use
- AWS integration

**Next**: Compare with [RabbitMQ](./rabbitmq.md) or [Kafka](./kafka.md)
