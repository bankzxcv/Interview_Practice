# Tutorial 02: Amazon SNS - Topics and Subscriptions

## Overview

Amazon Simple Notification Service (SNS) is a fully managed pub/sub messaging service that enables you to decouple microservices, distributed systems, and serverless applications. SNS provides topics for high-throughput, push-based, many-to-many messaging.

## Table of Contents
1. [SNS Fundamentals](#sns-fundamentals)
2. [Creating Topics](#creating-topics)
3. [Subscription Protocols](#subscription-protocols)
4. [Publishing Messages](#publishing-messages)
5. [Message Filtering](#message-filtering)
6. [Message Attributes](#message-attributes)
7. [Fanout Pattern](#fanout-pattern)
8. [FIFO Topics](#fifo-topics)
9. [Complete Examples](#complete-examples)

## SNS Fundamentals

### What is SNS?

SNS is a pub/sub messaging service where publishers send messages to topics, and all subscribers to that topic receive the messages.

**Key Characteristics:**
- **Pub/Sub Model**: One-to-many message distribution
- **Multiple Protocols**: SQS, Lambda, HTTP/S, Email, SMS, Mobile Push
- **Fan-out**: Deliver to multiple endpoints simultaneously
- **Message Filtering**: Subscribers receive only relevant messages
- **Durability**: Messages stored across multiple availability zones

### Message Flow

1. **Publisher** sends message to SNS topic
2. SNS stores message redundantly across multiple AZs
3. SNS delivers message to **all subscribers**
4. Each subscriber receives a copy independently
5. Subscribers process messages asynchronously

### Use Cases

- **Application Integration**: Decouple microservices
- **Fan-out**: One message to multiple processing pipelines
- **Mobile Notifications**: Push notifications to mobile devices
- **SMS/Email Alerts**: Send notifications to users
- **Event-Driven Architecture**: Trigger multiple workflows from single event

## Creating Topics

### Standard Topics

Standard topics provide best-effort message ordering and can deliver messages to all supported protocols.

#### AWS CLI

```bash
# Create standard topic
aws sns create-topic --name my-standard-topic

# Create topic with display name
aws sns create-topic \
  --name my-notification-topic \
  --attributes DisplayName="My Notifications"

# Get topic ARN
aws sns list-topics
```

#### Python (boto3)

```python
import boto3

# Create SNS client
sns = boto3.client('sns', region_name='us-east-1')

# Create topic
response = sns.create_topic(
    Name='my-standard-topic',
    Attributes={
        'DisplayName': 'My Standard Topic',
        'FifoTopic': 'false'
    }
)

topic_arn = response['TopicArn']
print(f"Topic ARN: {topic_arn}")
# Output: arn:aws:sns:us-east-1:123456789012:my-standard-topic
```

### FIFO Topics

FIFO topics provide strict message ordering and exactly-once message delivery.

```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')

# Create FIFO topic (must end with .fifo)
response = sns.create_topic(
    Name='my-fifo-topic.fifo',
    Attributes={
        'FifoTopic': 'true',
        'ContentBasedDeduplication': 'true'
    }
)

fifo_topic_arn = response['TopicArn']
print(f"FIFO Topic ARN: {fifo_topic_arn}")
```

### Topic Attributes

```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')

# Set topic attributes
sns.set_topic_attributes(
    TopicArn='arn:aws:sns:us-east-1:123456789012:my-topic',
    AttributeName='DisplayName',
    AttributeValue='Production Alerts'
)

# Get topic attributes
response = sns.get_topic_attributes(
    TopicArn='arn:aws:sns:us-east-1:123456789012:my-topic'
)

print(response['Attributes'])
```

## Subscription Protocols

SNS supports multiple subscription protocols for different use cases.

### Supported Protocols

| Protocol | Use Case | Delivery Method |
|----------|----------|-----------------|
| **sqs** | Queue-based processing | Message to SQS queue |
| **lambda** | Serverless processing | Invoke Lambda function |
| **http/https** | Webhooks | POST to HTTP endpoint |
| **email** | Human notifications | Email message |
| **email-json** | Structured emails | JSON format email |
| **sms** | Mobile alerts | SMS text message |
| **application** | Mobile push | Push notification |

### SQS Subscription

```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')
sqs = boto3.client('sqs', region_name='us-east-1')

topic_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic'

# Get queue ARN
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'
queue_attrs = sqs.get_queue_attributes(
    QueueUrl=queue_url,
    AttributeNames=['QueueArn']
)
queue_arn = queue_attrs['Attributes']['QueueArn']

# Subscribe SQS queue to SNS topic
response = sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sqs',
    Endpoint=queue_arn
)

subscription_arn = response['SubscriptionArn']
print(f"Subscription ARN: {subscription_arn}")

# Update queue policy to allow SNS
queue_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "sns.amazonaws.com"},
        "Action": "sqs:SendMessage",
        "Resource": queue_arn,
        "Condition": {
            "ArnEquals": {"aws:SourceArn": topic_arn}
        }
    }]
}

import json
sqs.set_queue_attributes(
    QueueUrl=queue_url,
    Attributes={'Policy': json.dumps(queue_policy)}
)
```

### Lambda Subscription

```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')

topic_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic'
lambda_arn = 'arn:aws:lambda:us-east-1:123456789012:function:my-function'

# Subscribe Lambda function
response = sns.subscribe(
    TopicArn=topic_arn,
    Protocol='lambda',
    Endpoint=lambda_arn
)

# Note: Lambda must have permission for SNS to invoke it
# Add permission using Lambda API or AWS console
```

### HTTP/HTTPS Subscription

```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')

topic_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic'

# Subscribe HTTP endpoint
response = sns.subscribe(
    TopicArn=topic_arn,
    Protocol='https',
    Endpoint='https://api.example.com/webhook'
)

# SNS sends confirmation request to endpoint
# Endpoint must confirm subscription by visiting SubscribeURL
print(f"Subscription pending confirmation: {response['SubscriptionArn']}")
```

### Email Subscription

```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')

topic_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic'

# Subscribe email address
response = sns.subscribe(
    TopicArn=topic_arn,
    Protocol='email',
    Endpoint='user@example.com'
)

# User must confirm subscription via email
print("Confirmation email sent")
```

### SMS Subscription

```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')

topic_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic'

# Subscribe phone number
response = sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sms',
    Endpoint='+1234567890'  # E.164 format
)
```

## Publishing Messages

### Basic Publishing

```python
import boto3
import json

sns = boto3.client('sns', region_name='us-east-1')

topic_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic'

# Publish simple message
response = sns.publish(
    TopicArn=topic_arn,
    Message='Hello from SNS!',
    Subject='Test Message'
)

message_id = response['MessageId']
print(f"Published message: {message_id}")
```

### Publishing JSON Messages

```python
import boto3
import json

sns = boto3.client('sns', region_name='us-east-1')

topic_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic'

# Structured message
message_data = {
    'order_id': '12345',
    'customer': 'john@example.com',
    'total': 99.99,
    'items': [
        {'product': 'Widget', 'quantity': 2},
        {'product': 'Gadget', 'quantity': 1}
    ]
}

response = sns.publish(
    TopicArn=topic_arn,
    Message=json.dumps(message_data),
    Subject='New Order Created'
)
```

### Protocol-Specific Messages

Different subscribers may need different message formats.

```python
import boto3
import json

sns = boto3.client('sns', region_name='us-east-1')

topic_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic'

# Define different messages for different protocols
message = {
    'default': 'New order received',
    'email': 'You have a new order: #12345\nTotal: $99.99',
    'sms': 'New order #12345',
    'sqs': json.dumps({
        'order_id': '12345',
        'total': 99.99,
        'timestamp': '2024-01-01T12:00:00Z'
    }),
    'lambda': json.dumps({
        'event_type': 'order.created',
        'order_id': '12345'
    })
}

response = sns.publish(
    TopicArn=topic_arn,
    Message=json.dumps(message),
    Subject='New Order',
    MessageStructure='json'  # Important for protocol-specific messages
)
```

### FIFO Topic Publishing

```python
import boto3
import json

sns = boto3.client('sns', region_name='us-east-1')

fifo_topic_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic.fifo'

# Publish to FIFO topic
response = sns.publish(
    TopicArn=fifo_topic_arn,
    Message=json.dumps({'order_id': '12345', 'action': 'create'}),
    MessageGroupId='order-group-1',  # Required for FIFO
    MessageDeduplicationId='unique-id-12345'  # Required if not using content-based deduplication
)

print(f"Message ID: {response['MessageId']}")
print(f"Sequence Number: {response['SequenceNumber']}")
```

## Message Filtering

Subscription filter policies allow subscribers to receive only messages they're interested in.

### Filter Policy Structure

```python
import boto3
import json

sns = boto3.client('sns', region_name='us-east-1')

# Subscribe with filter policy
subscription_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic:abc123'

# Filter policy: only receive messages where event_type is "order.created" or "order.updated"
filter_policy = {
    'event_type': ['order.created', 'order.updated']
}

sns.set_subscription_attributes(
    SubscriptionArn=subscription_arn,
    AttributeName='FilterPolicy',
    AttributeValue=json.dumps(filter_policy)
)
```

### Complex Filter Policies

```python
import boto3
import json

sns = boto3.client('sns', region_name='us-east-1')

subscription_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic:abc123'

# Complex filter: orders over $100 with high priority
filter_policy = {
    'event_type': ['order.created'],
    'priority': ['high', 'critical'],
    'total': [{'numeric': ['>=', 100]}]
}

sns.set_subscription_attributes(
    SubscriptionArn=subscription_arn,
    AttributeName='FilterPolicy',
    AttributeValue=json.dumps(filter_policy)
)
```

### Filter Policy Examples

```python
# String matching
{'event_type': ['order.created']}

# Multiple values (OR logic)
{'status': ['pending', 'processing']}

# Numeric comparisons
{'total': [{'numeric': ['>', 100]}]}
{'quantity': [{'numeric': ['>=', 10, '<=', 100]}]}

# Existence check
{'discount': [{'exists': True}]}

# Prefix matching
{'customer_id': [{'prefix': 'VIP-'}]}

# Anything-but
{'status': [{'anything-but': ['cancelled', 'failed']}]}

# Multiple conditions (AND logic)
{
    'event_type': ['order.created'],
    'priority': ['high'],
    'total': [{'numeric': ['>', 50]}]
}
```

## Message Attributes

Message attributes provide metadata that can be used for filtering and routing.

### Publishing with Attributes

```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')

topic_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic'

response = sns.publish(
    TopicArn=topic_arn,
    Message='Order processing message',
    MessageAttributes={
        'event_type': {
            'DataType': 'String',
            'StringValue': 'order.created'
        },
        'priority': {
            'DataType': 'String',
            'StringValue': 'high'
        },
        'total': {
            'DataType': 'Number',
            'StringValue': '150.50'
        },
        'customer_type': {
            'DataType': 'String',
            'StringValue': 'premium'
        }
    }
)
```

### Receiving Attributes in SQS

When SNS delivers to SQS, message attributes are preserved:

```python
import boto3
import json

sqs = boto3.client('sqs', region_name='us-east-1')
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'

response = sqs.receive_message(
    QueueUrl=queue_url,
    MessageAttributeNames=['All']
)

for message in response.get('Messages', []):
    # SNS wraps the message
    sns_message = json.loads(message['Body'])

    # Original message
    original_message = sns_message['Message']

    # Message attributes are in MessageAttributes
    attrs = sns_message.get('MessageAttributes', {})
    event_type = attrs.get('event_type', {}).get('Value')
    priority = attrs.get('priority', {}).get('Value')

    print(f"Event: {event_type}, Priority: {priority}")
    print(f"Message: {original_message}")
```

## Fanout Pattern

The fanout pattern delivers one message to multiple subscribers for parallel processing.

### Architecture

```
Publisher → SNS Topic → [SQS Queue 1 → Consumer 1]
                     → [SQS Queue 2 → Consumer 2]
                     → [Lambda Function]
                     → [HTTP Endpoint]
```

### Implementation

```python
import boto3
import json

sns = boto3.client('sns', region_name='us-east-1')
sqs = boto3.client('sqs', region_name='us-east-1')

# Create SNS topic
topic_response = sns.create_topic(Name='order-events')
topic_arn = topic_response['TopicArn']

# Create multiple SQS queues
queues = []
for queue_name in ['order-processing', 'order-analytics', 'order-notifications']:
    queue_response = sqs.create_queue(QueueName=queue_name)
    queue_url = queue_response['QueueUrl']

    # Get queue ARN
    attrs = sqs.get_queue_attributes(
        QueueUrl=queue_url,
        AttributeNames=['QueueArn']
    )
    queue_arn = attrs['Attributes']['QueueArn']

    # Update queue policy
    policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "sns.amazonaws.com"},
            "Action": "sqs:SendMessage",
            "Resource": queue_arn,
            "Condition": {"ArnEquals": {"aws:SourceArn": topic_arn}}
        }]
    }

    sqs.set_queue_attributes(
        QueueUrl=queue_url,
        Attributes={'Policy': json.dumps(policy)}
    )

    # Subscribe queue to topic
    subscription = sns.subscribe(
        TopicArn=topic_arn,
        Protocol='sqs',
        Endpoint=queue_arn
    )

    queues.append({
        'name': queue_name,
        'url': queue_url,
        'arn': queue_arn,
        'subscription_arn': subscription['SubscriptionArn']
    })

    print(f"Created and subscribed: {queue_name}")

# Publish message - goes to all queues
sns.publish(
    TopicArn=topic_arn,
    Message=json.dumps({
        'order_id': '12345',
        'customer': 'john@example.com',
        'total': 99.99
    }),
    Subject='New Order Created'
)

print("Message sent to all subscribers")
```

## FIFO Topics

FIFO topics provide ordered message delivery and exactly-once message delivery.

### Key Features
- Strict message ordering within message groups
- Exactly-once message delivery
- Can only subscribe FIFO SQS queues
- Up to 300 TPS (3,000 with batching)

### Example

```python
import boto3
import json

sns = boto3.client('sns', region_name='us-east-1')
sqs = boto3.client('sqs', region_name='us-east-1')

# Create FIFO topic
topic_response = sns.create_topic(
    Name='orders.fifo',
    Attributes={
        'FifoTopic': 'true',
        'ContentBasedDeduplication': 'false'
    }
)
fifo_topic_arn = topic_response['TopicArn']

# Create FIFO queue
queue_response = sqs.create_queue(
    QueueName='order-processing.fifo',
    Attributes={'FifoQueue': 'true'}
)
queue_url = queue_response['QueueUrl']

# Get queue ARN
attrs = sqs.get_queue_attributes(
    QueueUrl=queue_url,
    AttributeNames=['QueueArn']
)
queue_arn = attrs['Attributes']['QueueArn']

# Subscribe FIFO queue to FIFO topic
sns.subscribe(
    TopicArn=fifo_topic_arn,
    Protocol='sqs',
    Endpoint=queue_arn
)

# Publish to FIFO topic
for i in range(5):
    response = sns.publish(
        TopicArn=fifo_topic_arn,
        Message=json.dumps({'order_id': f'ORD-{i}', 'sequence': i}),
        MessageGroupId='order-group-1',
        MessageDeduplicationId=f'dedup-{i}'
    )
    print(f"Published message {i}: {response['SequenceNumber']}")
```

## Complete Examples

### Publisher Application

```python
#!/usr/bin/env python3
"""
SNS Publisher - Send events to topic
"""
import boto3
import json
import argparse
from datetime import datetime

def create_sns_client(local=False):
    """Create SNS client for AWS or LocalStack"""
    if local:
        return boto3.client(
            'sns',
            endpoint_url='http://localhost:4566',
            region_name='us-east-1',
            aws_access_key_id='test',
            aws_secret_access_key='test'
        )
    return boto3.client('sns', region_name='us-east-1')

def publish_event(topic_arn, event_type, data, local=False):
    """Publish event to SNS topic"""
    sns = create_sns_client(local)

    message = {
        'event_type': event_type,
        'timestamp': datetime.utcnow().isoformat(),
        'data': data
    }

    response = sns.publish(
        TopicArn=topic_arn,
        Message=json.dumps(message),
        Subject=f'Event: {event_type}',
        MessageAttributes={
            'event_type': {
                'DataType': 'String',
                'StringValue': event_type
            }
        }
    )

    print(f"Published {event_type}: {response['MessageId']}")
    return response['MessageId']

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--topic-arn', required=True)
    parser.add_argument('--event-type', default='order.created')
    parser.add_argument('--local', action='store_true')

    args = parser.parse_args()

    # Example event
    event_data = {
        'order_id': '12345',
        'customer': 'john@example.com',
        'total': 99.99
    }

    publish_event(args.topic_arn, args.event_type, event_data, args.local)
```

### Multi-Subscriber Setup

```python
#!/usr/bin/env python3
"""
Setup SNS fanout with multiple SQS subscribers
"""
import boto3
import json

def setup_fanout():
    """Create topic and subscribe multiple queues"""
    sns = boto3.client('sns', region_name='us-east-1')
    sqs = boto3.client('sqs', region_name='us-east-1')

    # Create topic
    topic = sns.create_topic(Name='order-events')
    topic_arn = topic['TopicArn']
    print(f"Created topic: {topic_arn}")

    # Define subscribers with filter policies
    subscribers = [
        {
            'name': 'order-processing',
            'filter': {'event_type': ['order.created', 'order.updated']}
        },
        {
            'name': 'order-analytics',
            'filter': {'event_type': ['order.created', 'order.completed']}
        },
        {
            'name': 'high-value-orders',
            'filter': {
                'event_type': ['order.created'],
                'total': [{'numeric': ['>=', 100]}]
            }
        }
    ]

    for sub in subscribers:
        # Create queue
        queue = sqs.create_queue(QueueName=sub['name'])
        queue_url = queue['QueueUrl']

        # Get queue ARN
        attrs = sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['QueueArn']
        )
        queue_arn = attrs['Attributes']['QueueArn']

        # Set queue policy
        policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "sns.amazonaws.com"},
                "Action": "sqs:SendMessage",
                "Resource": queue_arn,
                "Condition": {"ArnEquals": {"aws:SourceArn": topic_arn}}
            }]
        }

        sqs.set_queue_attributes(
            QueueUrl=queue_url,
            Attributes={'Policy': json.dumps(policy)}
        )

        # Subscribe to topic
        subscription = sns.subscribe(
            TopicArn=topic_arn,
            Protocol='sqs',
            Endpoint=queue_arn
        )

        subscription_arn = subscription['SubscriptionArn']

        # Set filter policy
        sns.set_subscription_attributes(
            SubscriptionArn=subscription_arn,
            AttributeName='FilterPolicy',
            AttributeValue=json.dumps(sub['filter'])
        )

        print(f"Subscribed {sub['name']} with filter: {sub['filter']}")

if __name__ == '__main__':
    setup_fanout()
```

## Summary

In this tutorial, you learned:
- SNS fundamentals and pub/sub messaging
- Creating and managing topics
- Multiple subscription protocols
- Message filtering with filter policies
- Message attributes and structured messages
- Fanout pattern for parallel processing
- FIFO topics for ordered delivery

**Key Takeaways:**
- SNS delivers to multiple subscribers (fanout)
- Use filter policies to route messages selectively
- Message attributes enable flexible filtering
- FIFO topics guarantee order (with FIFO queues only)

**Next Steps:**
- [Tutorial 03: SQS + SNS Integration](../03_sqs_sns_integration/README.md) - Complete fanout implementation
- [Tutorial 06: Lambda Integration](../06_lambda_integration/README.md) - Serverless event processing
