# Tutorial 01: Amazon SQS - Standard and FIFO Queues

## Overview

Amazon Simple Queue Service (SQS) is a fully managed message queuing service that enables you to decouple and scale microservices, distributed systems, and serverless applications. This tutorial covers the fundamentals of SQS, including both Standard and FIFO queue types.

## Table of Contents
1. [SQS Fundamentals](#sqs-fundamentals)
2. [Standard vs FIFO Queues](#standard-vs-fifo-queues)
3. [Queue Creation](#queue-creation)
4. [Sending Messages](#sending-messages)
5. [Receiving Messages](#receiving-messages)
6. [Message Attributes](#message-attributes)
7. [Visibility Timeout](#visibility-timeout)
8. [Long Polling vs Short Polling](#long-polling-vs-short-polling)
9. [LocalStack Development](#localstack-development)
10. [Complete Examples](#complete-examples)

## SQS Fundamentals

### What is SQS?

SQS is a distributed queue system that enables web service applications to quickly and reliably queue messages that one component in the application generates to be consumed by another component.

**Key Characteristics:**
- **Fully Managed**: No administrative overhead
- **Highly Scalable**: Unlimited throughput, unlimited number of messages
- **Reliable**: Messages stored redundantly across multiple availability zones
- **Secure**: Encryption at rest and in transit
- **Cost-Effective**: Pay only for what you use

### Message Lifecycle

1. **Producer** sends message to queue
2. Message stored across multiple servers (redundancy)
3. **Consumer** retrieves message
4. Message becomes invisible to other consumers (visibility timeout)
5. Consumer processes message
6. Consumer deletes message from queue
7. If not deleted, message becomes visible again after timeout

### Key Concepts

- **Message**: Up to 256 KB of text data
- **Queue**: Temporary repository for messages
- **Producer**: Component that sends messages
- **Consumer**: Component that receives and processes messages
- **Receipt Handle**: Token for deleting or changing message visibility
- **Message ID**: Unique identifier assigned by SQS

## Standard vs FIFO Queues

### Standard Queues

**Characteristics:**
- **Unlimited Throughput**: Nearly unlimited number of transactions per second
- **At-Least-Once Delivery**: Message delivered at least once, but occasionally duplicates
- **Best-Effort Ordering**: Messages generally delivered in the same order as sent, but not guaranteed

**Use Cases:**
- High throughput requirements
- Duplicate messages acceptable (idempotent processing)
- Order not critical
- Examples: Log processing, batch jobs, IoT data ingestion

**Advantages:**
- Maximum throughput
- Lower latency
- No limit on transactions per second

**Limitations:**
- Possible duplicates (implement idempotency)
- No guaranteed ordering

### FIFO Queues

**Characteristics:**
- **Exactly-Once Processing**: Message delivered once and remains available until consumer deletes it
- **First-In-First-Out Ordering**: Strict preservation of message order
- **Limited Throughput**:
  - Without batching: 300 transactions per second (TPS)
  - With batching: 3,000 messages per second
- **Message Groups**: Process messages in different groups independently

**Use Cases:**
- Order matters (financial transactions, user commands)
- Duplicate messages unacceptable
- Sequential processing required
- Examples: E-commerce order processing, stock trading, command execution

**Advantages:**
- Guaranteed ordering within message groups
- Exactly-once processing
- Message deduplication

**Limitations:**
- Lower throughput (3,000 TPS with batching)
- Must end with `.fifo` suffix
- Only available in some regions

### Comparison Table

| Feature | Standard Queue | FIFO Queue |
|---------|---------------|------------|
| Throughput | Unlimited | 3,000 msg/sec (with batching) |
| Delivery | At-least-once | Exactly-once |
| Ordering | Best-effort | Guaranteed |
| Duplicates | Possible | Not possible |
| Message Groups | No | Yes |
| Naming | Any valid name | Must end with `.fifo` |
| Use Case | High throughput, duplicates OK | Ordering required, no duplicates |

## Queue Creation

### Using AWS CLI

#### Create Standard Queue

```bash
# Basic standard queue
aws sqs create-queue --queue-name my-standard-queue

# With attributes
aws sqs create-queue \
  --queue-name my-standard-queue \
  --attributes '{
    "DelaySeconds": "0",
    "MessageRetentionPeriod": "345600",
    "VisibilityTimeout": "30",
    "ReceiveMessageWaitTimeSeconds": "20"
  }'
```

#### Create FIFO Queue

```bash
# Basic FIFO queue
aws sqs create-queue \
  --queue-name my-fifo-queue.fifo \
  --attributes '{
    "FifoQueue": "true",
    "ContentBasedDeduplication": "true"
  }'

# FIFO with high throughput mode
aws sqs create-queue \
  --queue-name my-high-throughput.fifo \
  --attributes '{
    "FifoQueue": "true",
    "ContentBasedDeduplication": "true",
    "DeduplicationScope": "messageGroup",
    "FifoThroughputLimit": "perMessageGroupId"
  }'
```

### Using boto3 (Python)

#### Standard Queue

```python
import boto3

# Create SQS client
sqs = boto3.client('sqs', region_name='us-east-1')

# Create standard queue
response = sqs.create_queue(
    QueueName='my-standard-queue',
    Attributes={
        'DelaySeconds': '0',
        'MessageRetentionPeriod': '345600',  # 4 days
        'VisibilityTimeout': '30',
        'ReceiveMessageWaitTimeSeconds': '20'  # Long polling
    }
)

queue_url = response['QueueUrl']
print(f"Queue created: {queue_url}")
```

#### FIFO Queue

```python
import boto3

sqs = boto3.client('sqs', region_name='us-east-1')

# Create FIFO queue
response = sqs.create_queue(
    QueueName='my-fifo-queue.fifo',
    Attributes={
        'FifoQueue': 'true',
        'ContentBasedDeduplication': 'true',
        'MessageRetentionPeriod': '345600',
        'VisibilityTimeout': '30'
    }
)

queue_url = response['QueueUrl']
print(f"FIFO Queue created: {queue_url}")
```

## Sending Messages

### Standard Queue Messages

```python
import boto3
import json
from datetime import datetime

sqs = boto3.client('sqs', region_name='us-east-1')
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-standard-queue'

# Send single message
response = sqs.send_message(
    QueueUrl=queue_url,
    MessageBody=json.dumps({
        'order_id': '12345',
        'customer': 'john@example.com',
        'total': 99.99,
        'timestamp': datetime.utcnow().isoformat()
    }),
    MessageAttributes={
        'OrderType': {
            'StringValue': 'standard',
            'DataType': 'String'
        },
        'Priority': {
            'StringValue': 'high',
            'DataType': 'String'
        }
    }
)

print(f"Message ID: {response['MessageId']}")
```

### Batch Send (Standard Queue)

```python
import boto3
import json

sqs = boto3.client('sqs', region_name='us-east-1')
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-standard-queue'

# Send up to 10 messages in one batch
response = sqs.send_message_batch(
    QueueUrl=queue_url,
    Entries=[
        {
            'Id': '1',
            'MessageBody': json.dumps({'order_id': '001', 'total': 10.00}),
            'MessageAttributes': {
                'Type': {'StringValue': 'order', 'DataType': 'String'}
            }
        },
        {
            'Id': '2',
            'MessageBody': json.dumps({'order_id': '002', 'total': 20.00}),
            'MessageAttributes': {
                'Type': {'StringValue': 'order', 'DataType': 'String'}
            }
        },
        {
            'Id': '3',
            'MessageBody': json.dumps({'order_id': '003', 'total': 30.00})
        }
    ]
)

# Check results
for success in response.get('Successful', []):
    print(f"Success: {success['Id']} - {success['MessageId']}")

for failed in response.get('Failed', []):
    print(f"Failed: {failed['Id']} - {failed['Message']}")
```

### FIFO Queue Messages

```python
import boto3
import json
import hashlib

sqs = boto3.client('sqs', region_name='us-east-1')
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-fifo-queue.fifo'

# Send message with Message Group ID and Deduplication ID
response = sqs.send_message(
    QueueUrl=queue_url,
    MessageBody=json.dumps({
        'order_id': '12345',
        'action': 'create',
        'customer': 'john@example.com'
    }),
    MessageGroupId='order-group-1',  # Messages with same group ID processed in order
    MessageDeduplicationId='unique-id-12345'  # Prevents duplicates within 5 minutes
)

print(f"FIFO Message ID: {response['MessageId']}")
print(f"Sequence Number: {response['SequenceNumber']}")
```

### FIFO with Content-Based Deduplication

```python
import boto3
import json

sqs = boto3.client('sqs', region_name='us-east-1')
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-fifo-queue.fifo'

# No need for MessageDeduplicationId when ContentBasedDeduplication is enabled
response = sqs.send_message(
    QueueUrl=queue_url,
    MessageBody=json.dumps({
        'order_id': '12345',
        'action': 'create'
    }),
    MessageGroupId='order-group-1'
    # MessageDeduplicationId automatically generated from message body hash
)
```

## Receiving Messages

### Standard Queue - Short Polling

```python
import boto3
import json

sqs = boto3.client('sqs', region_name='us-east-1')
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-standard-queue'

# Short polling (returns immediately, may return empty)
response = sqs.receive_message(
    QueueUrl=queue_url,
    MaxNumberOfMessages=10,  # Max 10
    MessageAttributeNames=['All'],
    AttributeNames=['All']
)

messages = response.get('Messages', [])
for message in messages:
    body = json.loads(message['Body'])
    print(f"Message ID: {message['MessageId']}")
    print(f"Body: {body}")
    print(f"Receipt Handle: {message['ReceiptHandle']}")

    # Delete message after processing
    sqs.delete_message(
        QueueUrl=queue_url,
        ReceiptHandle=message['ReceiptHandle']
    )
```

### Long Polling (Recommended)

```python
import boto3
import json

sqs = boto3.client('sqs', region_name='us-east-1')
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-standard-queue'

# Long polling - waits up to 20 seconds for messages
response = sqs.receive_message(
    QueueUrl=queue_url,
    MaxNumberOfMessages=10,
    WaitTimeSeconds=20,  # Long polling (1-20 seconds)
    MessageAttributeNames=['All']
)

messages = response.get('Messages', [])
print(f"Received {len(messages)} messages")

for message in messages:
    try:
        body = json.loads(message['Body'])
        print(f"Processing: {body}")

        # Process message...

        # Delete after successful processing
        sqs.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=message['ReceiptHandle']
        )
    except Exception as e:
        print(f"Error processing message: {e}")
        # Message will become visible again after visibility timeout
```

### Consumer Loop

```python
import boto3
import json
import time

def process_message(message_body):
    """Process the message"""
    print(f"Processing: {message_body}")
    time.sleep(1)  # Simulate processing

def consume_messages(queue_url, max_messages=10):
    """Continuously consume messages from queue"""
    sqs = boto3.client('sqs', region_name='us-east-1')

    while True:
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=max_messages,
            WaitTimeSeconds=20,  # Long polling
            MessageAttributeNames=['All']
        )

        messages = response.get('Messages', [])

        if not messages:
            print("No messages, waiting...")
            continue

        print(f"Received {len(messages)} messages")

        for message in messages:
            try:
                body = json.loads(message['Body'])
                process_message(body)

                # Delete message
                sqs.delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=message['ReceiptHandle']
                )
                print(f"Message {message['MessageId']} deleted")

            except Exception as e:
                print(f"Error: {e}")
                # Message will reappear after visibility timeout

# Run consumer
if __name__ == '__main__':
    queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-standard-queue'
    consume_messages(queue_url)
```

## Message Attributes

Message attributes allow you to provide structured metadata about the message without parsing the message body.

### Supported Data Types
- `String`
- `Number`
- `Binary`
- `String.Array` (for SNS compatibility)

### Example with Attributes

```python
import boto3
import json

sqs = boto3.client('sqs', region_name='us-east-1')

# Send message with various attribute types
response = sqs.send_message(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    MessageBody=json.dumps({'order_id': '12345'}),
    MessageAttributes={
        'Priority': {
            'StringValue': 'high',
            'DataType': 'String'
        },
        'RetryCount': {
            'StringValue': '3',
            'DataType': 'Number'
        },
        'Timestamp': {
            'StringValue': '1634567890',
            'DataType': 'Number'
        },
        'SourceSystem': {
            'StringValue': 'web-app',
            'DataType': 'String'
        }
    }
)

# Receive and read attributes
response = sqs.receive_message(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    MessageAttributeNames=['All']  # or ['Priority', 'RetryCount']
)

for message in response.get('Messages', []):
    attributes = message.get('MessageAttributes', {})
    priority = attributes.get('Priority', {}).get('StringValue')
    retry_count = attributes.get('RetryCount', {}).get('StringValue')

    print(f"Priority: {priority}, Retry: {retry_count}")
```

## Visibility Timeout

When a consumer receives a message, it becomes temporarily invisible to other consumers. This prevents multiple consumers from processing the same message simultaneously.

### Default Behavior
- Default timeout: 30 seconds
- Range: 0 seconds to 12 hours
- Set at queue level or per-message

### Change Visibility Timeout

```python
import boto3

sqs = boto3.client('sqs', region_name='us-east-1')

# Receive message
response = sqs.receive_message(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    MaxNumberOfMessages=1
)

message = response['Messages'][0]
receipt_handle = message['ReceiptHandle']

# Extend visibility timeout (e.g., for long-running tasks)
sqs.change_message_visibility(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    ReceiptHandle=receipt_handle,
    VisibilityTimeout=300  # Extend to 5 minutes
)

# Process message...
```

### Best Practices
- Set timeout longer than your average processing time
- Extend timeout for long-running operations
- Delete message immediately after successful processing
- Let message reappear if processing fails (for retry)

## Long Polling vs Short Polling

### Short Polling
- Returns immediately (even if empty)
- Queries subset of servers
- More API calls = higher costs
- May return empty responses

### Long Polling (Recommended)
- Waits up to 20 seconds for messages
- Queries all servers
- Reduces empty responses by up to 90%
- Lower costs and latency

### Enable Long Polling

```python
import boto3

sqs = boto3.client('sqs', region_name='us-east-1')

# Method 1: Set at queue level
sqs.set_queue_attributes(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    Attributes={
        'ReceiveMessageWaitTimeSeconds': '20'
    }
)

# Method 2: Set per receive request
response = sqs.receive_message(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    WaitTimeSeconds=20  # Enable long polling for this request
)
```

## LocalStack Development

LocalStack allows you to develop and test SQS applications locally without AWS costs.

### Setup LocalStack

```bash
# Install LocalStack
pip install localstack

# Start LocalStack
localstack start

# Or with Docker
docker run -d --name localstack \
  -p 4566:4566 \
  -e SERVICES=sqs \
  localstack/localstack

# Install awslocal
pip install awscli-local
```

### Using LocalStack with boto3

```python
import boto3

# Connect to LocalStack
sqs = boto3.client(
    'sqs',
    endpoint_url='http://localhost:4566',
    region_name='us-east-1',
    aws_access_key_id='test',
    aws_secret_access_key='test'
)

# Create queue
response = sqs.create_queue(QueueName='local-test-queue')
queue_url = response['QueueUrl']
print(f"Local Queue: {queue_url}")

# Send message
sqs.send_message(
    QueueUrl=queue_url,
    MessageBody='Hello from LocalStack!'
)

# Receive message
response = sqs.receive_message(QueueUrl=queue_url)
print(response['Messages'][0]['Body'])
```

### LocalStack with AWS CLI

```bash
# Create queue
awslocal sqs create-queue --queue-name local-queue

# Send message
awslocal sqs send-message \
  --queue-url http://localhost:4566/000000000000/local-queue \
  --message-body "Test message"

# Receive messages
awslocal sqs receive-message \
  --queue-url http://localhost:4566/000000000000/local-queue
```

## Complete Examples

### Producer Script

```python
#!/usr/bin/env python3
"""
SQS Producer - Send messages to queue
"""
import boto3
import json
import argparse
from datetime import datetime

def create_sqs_client(local=False):
    """Create SQS client for AWS or LocalStack"""
    if local:
        return boto3.client(
            'sqs',
            endpoint_url='http://localhost:4566',
            region_name='us-east-1',
            aws_access_key_id='test',
            aws_secret_access_key='test'
        )
    return boto3.client('sqs', region_name='us-east-1')

def send_messages(queue_url, count=10, local=False):
    """Send multiple messages to queue"""
    sqs = create_sqs_client(local)

    for i in range(count):
        message = {
            'message_id': i,
            'data': f'Message {i}',
            'timestamp': datetime.utcnow().isoformat()
        }

        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message),
            MessageAttributes={
                'MessageNumber': {
                    'StringValue': str(i),
                    'DataType': 'Number'
                }
            }
        )

        print(f"Sent message {i}: {response['MessageId']}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--queue-url', required=True)
    parser.add_argument('--count', type=int, default=10)
    parser.add_argument('--local', action='store_true')

    args = parser.parse_args()
    send_messages(args.queue_url, args.count, args.local)
```

### Consumer Script

```python
#!/usr/bin/env python3
"""
SQS Consumer - Process messages from queue
"""
import boto3
import json
import argparse
import time

def create_sqs_client(local=False):
    """Create SQS client for AWS or LocalStack"""
    if local:
        return boto3.client(
            'sqs',
            endpoint_url='http://localhost:4566',
            region_name='us-east-1',
            aws_access_key_id='test',
            aws_secret_access_key='test'
        )
    return boto3.client('sqs', region_name='us-east-1')

def process_message(message):
    """Process individual message"""
    body = json.loads(message['Body'])
    print(f"Processing: {body}")
    time.sleep(0.5)  # Simulate work

def consume_messages(queue_url, local=False):
    """Consume messages from queue"""
    sqs = create_sqs_client(local)

    print(f"Starting consumer for queue: {queue_url}")

    while True:
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=20,  # Long polling
            MessageAttributeNames=['All']
        )

        messages = response.get('Messages', [])

        if not messages:
            print("No messages, waiting...")
            continue

        print(f"\nReceived {len(messages)} messages")

        for message in messages:
            try:
                process_message(message)

                sqs.delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=message['ReceiptHandle']
                )
                print(f"Deleted message: {message['MessageId']}")

            except Exception as e:
                print(f"Error processing message: {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--queue-url', required=True)
    parser.add_argument('--local', action='store_true')

    args = parser.parse_args()
    consume_messages(args.queue_url, args.local)
```

### Usage

```bash
# With LocalStack
python producer.py --queue-url http://localhost:4566/000000000000/test-queue --count 20 --local
python consumer.py --queue-url http://localhost:4566/000000000000/test-queue --local

# With AWS
python producer.py --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/my-queue --count 20
python consumer.py --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/my-queue
```

## Summary

In this tutorial, you learned:
- Differences between Standard and FIFO queues
- How to create queues with AWS CLI and boto3
- Sending and receiving messages
- Message attributes and visibility timeout
- Long polling for cost optimization
- Local development with LocalStack

**Key Takeaways:**
- Use Standard queues for high throughput, FIFO when order matters
- Always use long polling (WaitTimeSeconds=20)
- Delete messages after processing
- Test locally with LocalStack before deploying

**Next Steps:**
- [Tutorial 02: Amazon SNS](../02_sns_basics/README.md) - Learn pub/sub messaging
- [Tutorial 04: Dead Letter Queues](../04_dlq_visibility/README.md) - Handle failures
