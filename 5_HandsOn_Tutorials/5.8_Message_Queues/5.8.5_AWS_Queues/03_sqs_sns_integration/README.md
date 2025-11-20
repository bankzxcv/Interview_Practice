# Tutorial 03: SQS + SNS Integration (Fanout Pattern)

## Overview

The fanout pattern combines SNS (pub/sub) with SQS (queuing) to deliver messages from a single publisher to multiple independent consumers. This pattern provides reliable, asynchronous processing with buffering and independent scaling for each consumer.

## Table of Contents
1. [Fanout Pattern Architecture](#fanout-pattern-architecture)
2. [Benefits of SNS + SQS](#benefits-of-sns--sqs)
3. [Implementation Steps](#implementation-steps)
4. [Message Filtering](#message-filtering)
5. [Order Processing Example](#order-processing-example)
6. [Terraform Configuration](#terraform-configuration)
7. [Testing and Monitoring](#testing-and-monitoring)
8. [Complete Application](#complete-application)

## Fanout Pattern Architecture

### Basic Architecture

```
┌──────────┐
│ Producer │
└────┬─────┘
     │
     ▼
┌─────────────┐
│  SNS Topic  │
└─────┬───────┘
      │
      ├────────────────────┬────────────────────┐
      ▼                    ▼                    ▼
┌──────────┐         ┌──────────┐         ┌──────────┐
│ SQS Q1   │         │ SQS Q2   │         │ SQS Q3   │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     ▼                    ▼                    ▼
┌──────────┐         ┌──────────┐         ┌──────────┐
│Consumer1 │         │Consumer2 │         │Consumer3 │
└──────────┘         └──────────┘         └──────────┘
```

### Real-World Example: E-commerce Order Processing

```
Order Created Event
        │
        ▼
   SNS Topic (orders)
        │
        ├──────────────────────┬────────────────────┬─────────────────┐
        ▼                      ▼                    ▼                 ▼
  Payment Queue         Inventory Queue      Email Queue      Analytics Queue
        │                      │                    │                 │
        ▼                      ▼                    ▼                 ▼
  Payment Service      Inventory Service    Email Service    Analytics Service
```

## Benefits of SNS + SQS

### Why Not Use SNS Alone?

| Challenge with SNS Only | Solution with SQS |
|------------------------|-------------------|
| No buffering if consumer down | Messages persist in queue |
| No retry mechanism | Automatic retries via visibility timeout |
| Synchronous delivery | Asynchronous processing |
| No backpressure handling | Queue depth controls processing rate |
| Different processing speeds | Each queue processes independently |

### Advantages

1. **Decoupling**: Publishers don't know about subscribers
2. **Reliability**: Messages persist even if consumers are down
3. **Scalability**: Each consumer scales independently
4. **Flexibility**: Add/remove subscribers without affecting others
5. **Buffering**: Queues smooth out traffic spikes
6. **Retry Logic**: Failed messages automatically retry

## Implementation Steps

### Step 1: Create SNS Topic

```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')

# Create topic
response = sns.create_topic(
    Name='order-events',
    Attributes={
        'DisplayName': 'Order Events Topic'
    }
)

topic_arn = response['TopicArn']
print(f"Topic ARN: {topic_arn}")
```

### Step 2: Create SQS Queues

```python
import boto3

sqs = boto3.client('sqs', region_name='us-east-1')

# Create multiple queues for different purposes
queues = {}

queue_configs = [
    {
        'name': 'order-payment-queue',
        'purpose': 'Process payments'
    },
    {
        'name': 'order-inventory-queue',
        'purpose': 'Update inventory'
    },
    {
        'name': 'order-notification-queue',
        'purpose': 'Send customer notifications'
    },
    {
        'name': 'order-analytics-queue',
        'purpose': 'Track analytics'
    }
]

for config in queue_configs:
    response = sqs.create_queue(
        QueueName=config['name'],
        Attributes={
            'VisibilityTimeout': '30',
            'MessageRetentionPeriod': '345600',  # 4 days
            'ReceiveMessageWaitTimeSeconds': '20'  # Long polling
        }
    )

    queue_url = response['QueueUrl']

    # Get queue ARN
    attrs = sqs.get_queue_attributes(
        QueueUrl=queue_url,
        AttributeNames=['QueueArn']
    )
    queue_arn = attrs['Attributes']['QueueArn']

    queues[config['name']] = {
        'url': queue_url,
        'arn': queue_arn,
        'purpose': config['purpose']
    }

    print(f"Created: {config['name']} - {config['purpose']}")
```

### Step 3: Configure Queue Policies

```python
import boto3
import json

sqs = boto3.client('sqs', region_name='us-east-1')

def allow_sns_to_write_to_sqs(queue_url, queue_arn, topic_arn):
    """Grant SNS permission to send messages to SQS queue"""

    policy = {
        "Version": "2012-10-17",
        "Id": f"{queue_arn}/SQSDefaultPolicy",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "sns.amazonaws.com"
                },
                "Action": "sqs:SendMessage",
                "Resource": queue_arn,
                "Condition": {
                    "ArnEquals": {
                        "aws:SourceArn": topic_arn
                    }
                }
            }
        ]
    }

    sqs.set_queue_attributes(
        QueueUrl=queue_url,
        Attributes={
            'Policy': json.dumps(policy)
        }
    )

    print(f"Updated policy for queue: {queue_url}")

# Apply to all queues
topic_arn = 'arn:aws:sns:us-east-1:123456789012:order-events'

for queue_name, queue_info in queues.items():
    allow_sns_to_write_to_sqs(
        queue_info['url'],
        queue_info['arn'],
        topic_arn
    )
```

### Step 4: Subscribe Queues to Topic

```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')

topic_arn = 'arn:aws:sns:us-east-1:123456789012:order-events'

# Subscribe each queue to the topic
subscriptions = {}

for queue_name, queue_info in queues.items():
    response = sns.subscribe(
        TopicArn=topic_arn,
        Protocol='sqs',
        Endpoint=queue_info['arn'],
        ReturnSubscriptionArn=True
    )

    subscription_arn = response['SubscriptionArn']
    subscriptions[queue_name] = subscription_arn

    print(f"Subscribed {queue_name}: {subscription_arn}")
```

## Message Filtering

Different queues can receive different subsets of messages using subscription filter policies.

### Filter by Event Type

```python
import boto3
import json

sns = boto3.client('sns', region_name='us-east-1')

# Payment queue only receives order.created and order.cancelled
payment_filter = {
    'event_type': ['order.created', 'order.cancelled']
}

sns.set_subscription_attributes(
    SubscriptionArn=subscriptions['order-payment-queue'],
    AttributeName='FilterPolicy',
    AttributeValue=json.dumps(payment_filter)
)

# Inventory queue receives created, updated, and cancelled
inventory_filter = {
    'event_type': ['order.created', 'order.updated', 'order.cancelled']
}

sns.set_subscription_attributes(
    SubscriptionArn=subscriptions['order-inventory-queue'],
    AttributeName='FilterPolicy',
    AttributeValue=json.dumps(inventory_filter)
)

# Notification queue receives all order events
notification_filter = {
    'event_type': [
        'order.created', 'order.updated',
        'order.shipped', 'order.delivered',
        'order.cancelled'
    ]
}

sns.set_subscription_attributes(
    SubscriptionArn=subscriptions['order-notification-queue'],
    AttributeName='FilterPolicy',
    AttributeValue=json.dumps(notification_filter)
)

# Analytics queue receives everything (no filter)
# No filter policy needed - receives all messages
```

### Filter by Order Value

```python
import boto3
import json

sns = boto3.client('sns', region_name='us-east-1')

# High-value orders queue (orders over $100)
high_value_filter = {
    'event_type': ['order.created'],
    'order_value': [{'numeric': ['>', 100]}]
}

# Create high-value queue
sqs = boto3.client('sqs', region_name='us-east-1')
response = sqs.create_queue(QueueName='high-value-orders-queue')
queue_url = response['QueueUrl']

attrs = sqs.get_queue_attributes(
    QueueUrl=queue_url,
    AttributeNames=['QueueArn']
)
queue_arn = attrs['Attributes']['QueueArn']

# Subscribe with filter
subscription = sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sqs',
    Endpoint=queue_arn
)

sns.set_subscription_attributes(
    SubscriptionArn=subscription['SubscriptionArn'],
    AttributeName='FilterPolicy',
    AttributeValue=json.dumps(high_value_filter)
)
```

### Combined Filters

```python
import json

# Premium customers AND high value orders
premium_high_value_filter = {
    'event_type': ['order.created'],
    'customer_tier': ['premium', 'vip'],
    'order_value': [{'numeric': ['>=', 100]}]
}

# International orders requiring special handling
international_filter = {
    'event_type': ['order.created'],
    'shipping_country': [{'anything-but': ['US']}]
}

# Urgent orders (express or same-day shipping)
urgent_filter = {
    'event_type': ['order.created'],
    'shipping_speed': ['express', 'same-day']
}
```

## Order Processing Example

### Complete Order Processing System

```python
import boto3
import json
from datetime import datetime
from decimal import Decimal

class OrderEventPublisher:
    """Publish order events to SNS"""

    def __init__(self, topic_arn):
        self.sns = boto3.client('sns', region_name='us-east-1')
        self.topic_arn = topic_arn

    def publish_order_event(self, event_type, order_data):
        """Publish order event with attributes"""

        message = {
            'event_id': f"{event_type}-{order_data['order_id']}-{int(datetime.utcnow().timestamp())}",
            'event_type': event_type,
            'timestamp': datetime.utcnow().isoformat(),
            'order': order_data
        }

        response = self.sns.publish(
            TopicArn=self.topic_arn,
            Message=json.dumps(message, default=str),
            Subject=f"Order Event: {event_type}",
            MessageAttributes={
                'event_type': {
                    'DataType': 'String',
                    'StringValue': event_type
                },
                'order_value': {
                    'DataType': 'Number',
                    'StringValue': str(order_data.get('total', 0))
                },
                'customer_tier': {
                    'DataType': 'String',
                    'StringValue': order_data.get('customer_tier', 'standard')
                },
                'shipping_country': {
                    'DataType': 'String',
                    'StringValue': order_data.get('shipping_country', 'US')
                }
            }
        )

        print(f"Published {event_type} for order {order_data['order_id']}: {response['MessageId']}")
        return response['MessageId']

# Usage example
publisher = OrderEventPublisher('arn:aws:sns:us-east-1:123456789012:order-events')

# Create order event
order = {
    'order_id': 'ORD-12345',
    'customer_id': 'CUST-001',
    'customer_tier': 'premium',
    'items': [
        {'product_id': 'PROD-001', 'quantity': 2, 'price': 29.99},
        {'product_id': 'PROD-002', 'quantity': 1, 'price': 49.99}
    ],
    'subtotal': 109.97,
    'tax': 9.90,
    'total': 119.87,
    'shipping_country': 'US',
    'shipping_speed': 'standard'
}

publisher.publish_order_event('order.created', order)
```

### Payment Service Consumer

```python
import boto3
import json
import time

class PaymentService:
    """Process payments from SQS queue"""

    def __init__(self, queue_url):
        self.sqs = boto3.client('sqs', region_name='us-east-1')
        self.queue_url = queue_url

    def process_payment(self, order_data):
        """Process payment for order"""
        print(f"Processing payment for order: {order_data['order_id']}")
        print(f"Amount: ${order_data['total']}")

        # Simulate payment processing
        time.sleep(1)

        # Return success
        return {
            'status': 'success',
            'transaction_id': f"TXN-{int(time.time())}",
            'order_id': order_data['order_id']
        }

    def consume_messages(self):
        """Consume and process payment messages"""
        print(f"Payment service listening on: {self.queue_url}")

        while True:
            response = self.sqs.receive_message(
                QueueUrl=self.queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=20,
                MessageAttributeNames=['All']
            )

            messages = response.get('Messages', [])

            for message in messages:
                try:
                    # Parse SNS message
                    sns_message = json.loads(message['Body'])
                    event_data = json.loads(sns_message['Message'])

                    # Process only order.created events
                    if event_data['event_type'] == 'order.created':
                        result = self.process_payment(event_data['order'])

                        if result['status'] == 'success':
                            print(f"Payment successful: {result['transaction_id']}")

                            # Delete message after successful processing
                            self.sqs.delete_message(
                                QueueUrl=self.queue_url,
                                ReceiptHandle=message['ReceiptHandle']
                            )

                except Exception as e:
                    print(f"Error processing message: {e}")
                    # Message will reappear after visibility timeout

# Run payment service
if __name__ == '__main__':
    queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/order-payment-queue'
    service = PaymentService(queue_url)
    service.consume_messages()
```

### Inventory Service Consumer

```python
import boto3
import json

class InventoryService:
    """Update inventory from SQS queue"""

    def __init__(self, queue_url):
        self.sqs = boto3.client('sqs', region_name='us-east-1')
        self.queue_url = queue_url
        self.inventory = {}  # Simulated inventory database

    def update_inventory(self, order_data, event_type):
        """Update inventory based on order event"""
        print(f"Inventory update for {event_type}: {order_data['order_id']}")

        for item in order_data['items']:
            product_id = item['product_id']
            quantity = item['quantity']

            if event_type == 'order.created':
                # Reserve inventory
                print(f"Reserving {quantity}x {product_id}")

            elif event_type == 'order.cancelled':
                # Release inventory
                print(f"Releasing {quantity}x {product_id}")

            elif event_type == 'order.updated':
                # Adjust inventory
                print(f"Adjusting inventory for {product_id}")

        return True

    def consume_messages(self):
        """Consume and process inventory messages"""
        print(f"Inventory service listening on: {self.queue_url}")

        while True:
            response = self.sqs.receive_message(
                QueueUrl=self.queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=20
            )

            messages = response.get('Messages', [])

            for message in messages:
                try:
                    sns_message = json.loads(message['Body'])
                    event_data = json.loads(sns_message['Message'])

                    success = self.update_inventory(
                        event_data['order'],
                        event_data['event_type']
                    )

                    if success:
                        self.sqs.delete_message(
                            QueueUrl=self.queue_url,
                            ReceiptHandle=message['ReceiptHandle']
                        )

                except Exception as e:
                    print(f"Error: {e}")
```

## Terraform Configuration

### Complete Infrastructure as Code

```hcl
# terraform/main.tf

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# SNS Topic
resource "aws_sns_topic" "order_events" {
  name         = "order-events"
  display_name = "Order Events Topic"

  tags = {
    Environment = var.environment
    Application = "order-processing"
  }
}

# SQS Queues
resource "aws_sqs_queue" "payment_queue" {
  name                       = "order-payment-queue"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600  # 4 days
  receive_wait_time_seconds  = 20      # Long polling

  tags = {
    Environment = var.environment
    Purpose     = "payment-processing"
  }
}

resource "aws_sqs_queue" "inventory_queue" {
  name                       = "order-inventory-queue"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20

  tags = {
    Environment = var.environment
    Purpose     = "inventory-management"
  }
}

resource "aws_sqs_queue" "notification_queue" {
  name                       = "order-notification-queue"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20

  tags = {
    Environment = var.environment
    Purpose     = "customer-notifications"
  }
}

resource "aws_sqs_queue" "analytics_queue" {
  name                       = "order-analytics-queue"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20

  tags = {
    Environment = var.environment
    Purpose     = "analytics"
  }
}

# Queue Policies
resource "aws_sqs_queue_policy" "payment_queue_policy" {
  queue_url = aws_sqs_queue.payment_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.payment_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.order_events.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "inventory_queue_policy" {
  queue_url = aws_sqs_queue.inventory_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.inventory_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.order_events.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "notification_queue_policy" {
  queue_url = aws_sqs_queue.notification_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.notification_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.order_events.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "analytics_queue_policy" {
  queue_url = aws_sqs_queue.analytics_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.analytics_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.order_events.arn
          }
        }
      }
    ]
  })
}

# SNS Subscriptions
resource "aws_sns_topic_subscription" "payment_subscription" {
  topic_arn = aws_sns_topic.order_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.payment_queue.arn

  filter_policy = jsonencode({
    event_type = ["order.created", "order.cancelled"]
  })
}

resource "aws_sns_topic_subscription" "inventory_subscription" {
  topic_arn = aws_sns_topic.order_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.inventory_queue.arn

  filter_policy = jsonencode({
    event_type = ["order.created", "order.updated", "order.cancelled"]
  })
}

resource "aws_sns_topic_subscription" "notification_subscription" {
  topic_arn = aws_sns_topic.order_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.notification_queue.arn

  filter_policy = jsonencode({
    event_type = [
      "order.created",
      "order.updated",
      "order.shipped",
      "order.delivered",
      "order.cancelled"
    ]
  })
}

resource "aws_sns_topic_subscription" "analytics_subscription" {
  topic_arn = aws_sns_topic.order_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.analytics_queue.arn
  # No filter - receives all messages
}

# Outputs
output "sns_topic_arn" {
  value       = aws_sns_topic.order_events.arn
  description = "ARN of the order events SNS topic"
}

output "payment_queue_url" {
  value       = aws_sqs_queue.payment_queue.url
  description = "URL of the payment processing queue"
}

output "inventory_queue_url" {
  value       = aws_sqs_queue.inventory_queue.url
  description = "URL of the inventory management queue"
}

output "notification_queue_url" {
  value       = aws_sqs_queue.notification_queue.url
  description = "URL of the notification queue"
}

output "analytics_queue_url" {
  value       = aws_sqs_queue.analytics_queue.url
  description = "URL of the analytics queue"
}
```

### Variables

```hcl
# terraform/variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}
```

### Deploy with Terraform

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply configuration
terraform apply

# Get outputs
terraform output sns_topic_arn
terraform output payment_queue_url

# Destroy resources
terraform destroy
```

## Testing and Monitoring

### Integration Test

```python
#!/usr/bin/env python3
"""
Integration test for SNS + SQS fanout
"""
import boto3
import json
import time

def test_fanout():
    """Test message delivery to all queues"""
    sns = boto3.client('sns', region_name='us-east-1')
    sqs = boto3.client('sqs', region_name='us-east-1')

    topic_arn = 'arn:aws:sns:us-east-1:123456789012:order-events'

    # Publish test message
    test_order = {
        'order_id': 'TEST-001',
        'total': 150.00,
        'customer_tier': 'premium'
    }

    print("Publishing test message...")
    sns.publish(
        TopicArn=topic_arn,
        Message=json.dumps(test_order),
        MessageAttributes={
            'event_type': {'DataType': 'String', 'StringValue': 'order.created'},
            'order_value': {'DataType': 'Number', 'StringValue': '150.00'}
        }
    )

    # Wait for message propagation
    time.sleep(2)

    # Check all queues
    queues = [
        'order-payment-queue',
        'order-inventory-queue',
        'order-notification-queue',
        'order-analytics-queue'
    ]

    for queue_name in queues:
        queue_url = f'https://sqs.us-east-1.amazonaws.com/123456789012/{queue_name}'

        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1
        )

        if 'Messages' in response:
            print(f"✓ {queue_name}: Message received")
            sqs.delete_message(
                QueueUrl=queue_url,
                ReceiptHandle=response['Messages'][0]['ReceiptHandle']
            )
        else:
            print(f"✗ {queue_name}: No message")

if __name__ == '__main__':
    test_fanout()
```

### CloudWatch Monitoring

```python
import boto3

cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

# Create alarm for queue depth
cloudwatch.put_metric_alarm(
    AlarmName='order-payment-queue-depth',
    ComparisonOperator='GreaterThanThreshold',
    EvaluationPeriods=1,
    MetricName='ApproximateNumberOfMessagesVisible',
    Namespace='AWS/SQS',
    Period=300,
    Statistic='Average',
    Threshold=1000,
    ActionsEnabled=True,
    AlarmDescription='Alert when payment queue has too many messages',
    Dimensions=[
        {
            'Name': 'QueueName',
            'Value': 'order-payment-queue'
        }
    ]
)
```

## Complete Application

See the `examples/` directory for complete working applications:
- `publisher.py` - Order event publisher
- `payment_consumer.py` - Payment service
- `inventory_consumer.py` - Inventory service
- `notification_consumer.py` - Notification service
- `docker-compose.yml` - LocalStack setup

## Summary

In this tutorial, you learned:
- Implementing the fanout pattern with SNS + SQS
- Setting up message filtering for selective delivery
- Building a complete order processing system
- Infrastructure as Code with Terraform
- Testing and monitoring the integration

**Key Takeaways:**
- SNS + SQS provides reliable, scalable fanout
- Message filtering reduces unnecessary processing
- Each consumer scales independently
- Terraform simplifies infrastructure management

**Next Steps:**
- [Tutorial 04: Dead Letter Queues](../04_dlq_visibility/README.md) - Handle failures
- [Tutorial 06: Lambda Integration](../06_lambda_integration/README.md) - Serverless consumers
