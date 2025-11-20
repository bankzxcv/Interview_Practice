# Tutorial 04: Dead Letter Queues and Message Visibility

## Overview

Dead Letter Queues (DLQs) and visibility timeout are essential mechanisms for handling failures and ensuring reliable message processing in SQS. This tutorial covers how to configure DLQs, manage message visibility, and implement robust error handling patterns.

## Table of Contents
1. [Dead Letter Queue Fundamentals](#dead-letter-queue-fundamentals)
2. [Configuring DLQs](#configuring-dlqs)
3. [Visibility Timeout Patterns](#visibility-timeout-patterns)
4. [Message Retention](#message-retention)
5. [Redrive Policy](#redrive-policy)
6. [Monitoring and Alerts](#monitoring-and-alerts)
7. [DLQ Processing Strategies](#dlq-processing-strategies)
8. [Best Practices](#best-practices)

## Dead Letter Queue Fundamentals

### What is a Dead Letter Queue?

A Dead Letter Queue (DLQ) is a special SQS queue that receives messages that cannot be processed successfully after a specified number of attempts.

**Key Concepts:**
- **Source Queue**: The main queue where messages are initially sent
- **Dead Letter Queue**: The queue that receives failed messages
- **Max Receive Count**: Number of receive attempts before sending to DLQ
- **Redrive Policy**: Configuration linking source queue to DLQ

### Why Use DLQs?

| Problem | Solution with DLQ |
|---------|------------------|
| Poison messages block the queue | Isolate problematic messages |
| Hard to debug failures | Analyze failed messages separately |
| Retry forever | Stop retrying after N attempts |
| Lost messages | Preserve failed messages for investigation |

### Message Lifecycle with DLQ

```
┌─────────────┐
│   Producer  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Source Queue│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Consumer   │
└──────┬──────┘
       │
       ├─── Success ──→ Delete Message
       │
       └─── Failure ──→ Message becomes visible again
                         │
                         ├─── Retry (< maxReceiveCount)
                         │
                         └─── Send to DLQ (≥ maxReceiveCount)
```

## Configuring DLQs

### Create DLQ and Source Queue

```python
import boto3
import json

sqs = boto3.client('sqs', region_name='us-east-1')

# Step 1: Create Dead Letter Queue
dlq_response = sqs.create_queue(
    QueueName='order-processing-dlq',
    Attributes={
        'MessageRetentionPeriod': '1209600'  # 14 days (maximum)
    }
)

dlq_url = dlq_response['QueueUrl']
print(f"DLQ URL: {dlq_url}")

# Get DLQ ARN
dlq_attrs = sqs.get_queue_attributes(
    QueueUrl=dlq_url,
    AttributeNames=['QueueArn']
)
dlq_arn = dlq_attrs['Attributes']['QueueArn']
print(f"DLQ ARN: {dlq_arn}")

# Step 2: Create Source Queue with Redrive Policy
redrive_policy = {
    'deadLetterTargetArn': dlq_arn,
    'maxReceiveCount': '3'  # Send to DLQ after 3 failed attempts
}

source_response = sqs.create_queue(
    QueueName='order-processing-queue',
    Attributes={
        'VisibilityTimeout': '30',
        'MessageRetentionPeriod': '345600',  # 4 days
        'RedrivePolicy': json.dumps(redrive_policy)
    }
)

source_url = source_response['QueueUrl']
print(f"Source Queue URL: {source_url}")
```

### AWS CLI Configuration

```bash
# Create DLQ
aws sqs create-queue \
  --queue-name order-processing-dlq \
  --attributes MessageRetentionPeriod=1209600

# Get DLQ ARN
DLQ_ARN=$(aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/order-processing-dlq \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' \
  --output text)

# Create source queue with redrive policy
aws sqs create-queue \
  --queue-name order-processing-queue \
  --attributes '{
    "VisibilityTimeout": "30",
    "RedrivePolicy": "{\"deadLetterTargetArn\":\"'$DLQ_ARN'\",\"maxReceiveCount\":\"3\"}"
  }'
```

### Update Existing Queue with DLQ

```python
import boto3
import json

sqs = boto3.client('sqs', region_name='us-east-1')

queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/existing-queue'
dlq_arn = 'arn:aws:sqs:us-east-1:123456789012:existing-queue-dlq'

# Add redrive policy to existing queue
redrive_policy = {
    'deadLetterTargetArn': dlq_arn,
    'maxReceiveCount': '5'
}

sqs.set_queue_attributes(
    QueueUrl=queue_url,
    Attributes={
        'RedrivePolicy': json.dumps(redrive_policy)
    }
)

print("Redrive policy updated")
```

## Visibility Timeout Patterns

### Understanding Visibility Timeout

When a consumer receives a message, it becomes invisible to other consumers for the visibility timeout duration.

**Default**: 30 seconds
**Range**: 0 seconds to 12 hours
**Best Practice**: Set to 6x your average processing time

### Set at Queue Level

```python
import boto3

sqs = boto3.client('sqs', region_name='us-east-1')

# Create queue with visibility timeout
response = sqs.create_queue(
    QueueName='my-queue',
    Attributes={
        'VisibilityTimeout': '300'  # 5 minutes
    }
)

# Update existing queue
sqs.set_queue_attributes(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    Attributes={
        'VisibilityTimeout': '600'  # 10 minutes
    }
)
```

### Dynamic Visibility Timeout

```python
import boto3
import time

sqs = boto3.client('sqs', region_name='us-east-1')
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'

# Receive message
response = sqs.receive_message(
    QueueUrl=queue_url,
    MaxNumberOfMessages=1
)

message = response['Messages'][0]
receipt_handle = message['ReceiptHandle']

# Process with timeout extension for long-running tasks
def process_long_running_task(message, receipt_handle):
    """Process task with periodic visibility timeout extensions"""

    for step in range(5):
        print(f"Processing step {step + 1}/5...")
        time.sleep(30)  # Simulate work

        # Extend visibility timeout every 30 seconds
        sqs.change_message_visibility(
            QueueUrl=queue_url,
            ReceiptHandle=receipt_handle,
            VisibilityTimeout=60  # Extend by another 60 seconds
        )

    # Delete after successful processing
    sqs.delete_message(
        QueueUrl=queue_url,
        ReceiptHandle=receipt_handle
    )

process_long_running_task(message, receipt_handle)
```

### Visibility Timeout Best Practices

```python
import boto3
import time
from datetime import datetime

class MessageProcessor:
    """Process messages with intelligent visibility timeout management"""

    def __init__(self, queue_url, base_timeout=30, max_timeout=300):
        self.sqs = boto3.client('sqs', region_name='us-east-1')
        self.queue_url = queue_url
        self.base_timeout = base_timeout
        self.max_timeout = max_timeout

    def process_with_heartbeat(self, message, process_func):
        """Process message with periodic heartbeat to extend visibility"""
        receipt_handle = message['ReceiptHandle']
        start_time = time.time()

        try:
            # Start processing in background
            result = process_func(message['Body'])

            # Delete on success
            self.sqs.delete_message(
                QueueUrl=self.queue_url,
                ReceiptHandle=receipt_handle
            )

            elapsed = time.time() - start_time
            print(f"Processed successfully in {elapsed:.2f}s")
            return result

        except Exception as e:
            # On error, make message immediately visible for retry
            self.sqs.change_message_visibility(
                QueueUrl=self.queue_url,
                ReceiptHandle=receipt_handle,
                VisibilityTimeout=0  # Make visible immediately
            )

            print(f"Error processing message: {e}")
            raise

    def extend_visibility(self, receipt_handle, seconds):
        """Extend visibility timeout"""
        timeout = min(seconds, self.max_timeout)

        self.sqs.change_message_visibility(
            QueueUrl=self.queue_url,
            ReceiptHandle=receipt_handle,
            VisibilityTimeout=timeout
        )
```

## Message Retention

### Retention Settings

```python
import boto3

sqs = boto3.client('sqs', region_name='us-east-1')

# Configure message retention
sqs.set_queue_attributes(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    Attributes={
        'MessageRetentionPeriod': '345600'  # 4 days (in seconds)
    }
)

# Retention options:
# Minimum: 60 seconds (1 minute)
# Maximum: 1209600 seconds (14 days)
# Default: 345600 seconds (4 days)
```

### Best Practices

| Queue Type | Recommended Retention | Reason |
|------------|---------------------|---------|
| **Production Queue** | 4 days | Balance between cost and recovery time |
| **Dead Letter Queue** | 14 days | Maximum time for investigation |
| **High-Volume Queue** | 1-2 days | Reduce storage costs |
| **Critical Queue** | 7-14 days | Ensure no data loss |

## Redrive Policy

### Configure Max Receive Count

```python
import boto3
import json

sqs = boto3.client('sqs', region_name='us-east-1')

# Different maxReceiveCount for different scenarios

# Aggressive retry (good for transient errors)
aggressive_policy = {
    'deadLetterTargetArn': 'arn:aws:sqs:us-east-1:123456789012:my-dlq',
    'maxReceiveCount': '10'  # More retries
}

# Conservative retry (good for expensive operations)
conservative_policy = {
    'deadLetterTargetArn': 'arn:aws:sqs:us-east-1:123456789012:my-dlq',
    'maxReceiveCount': '2'  # Fewer retries
}

# Standard retry
standard_policy = {
    'deadLetterTargetArn': 'arn:aws:sqs:us-east-1:123456789012:my-dlq',
    'maxReceiveCount': '5'  # Balanced
}

# Apply policy
sqs.set_queue_attributes(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    Attributes={
        'RedrivePolicy': json.dumps(standard_policy)
    }
)
```

### Redrive Messages from DLQ

```python
import boto3
import json

def redrive_messages_from_dlq(dlq_url, target_queue_url, max_messages=10):
    """Move messages from DLQ back to source queue"""
    sqs = boto3.client('sqs', region_name='us-east-1')

    moved_count = 0

    while True:
        # Receive messages from DLQ
        response = sqs.receive_message(
            QueueUrl=dlq_url,
            MaxNumberOfMessages=max_messages,
            WaitTimeSeconds=5
        )

        messages = response.get('Messages', [])

        if not messages:
            break

        for message in messages:
            try:
                # Send to target queue
                sqs.send_message(
                    QueueUrl=target_queue_url,
                    MessageBody=message['Body'],
                    MessageAttributes=message.get('MessageAttributes', {})
                )

                # Delete from DLQ
                sqs.delete_message(
                    QueueUrl=dlq_url,
                    ReceiptHandle=message['ReceiptHandle']
                )

                moved_count += 1
                print(f"Moved message: {message['MessageId']}")

            except Exception as e:
                print(f"Error moving message: {e}")

    print(f"Total messages moved: {moved_count}")
    return moved_count

# Usage
dlq_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-dlq'
source_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'

redrive_messages_from_dlq(dlq_url, source_url)
```

## Monitoring and Alerts

### CloudWatch Metrics

```python
import boto3

cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

# Create alarm for DLQ messages
cloudwatch.put_metric_alarm(
    AlarmName='dlq-messages-alert',
    ComparisonOperator='GreaterThanThreshold',
    EvaluationPeriods=1,
    MetricName='ApproximateNumberOfMessagesVisible',
    Namespace='AWS/SQS',
    Period=300,  # 5 minutes
    Statistic='Average',
    Threshold=1.0,  # Alert on any message in DLQ
    ActionsEnabled=True,
    AlarmDescription='Alert when messages appear in DLQ',
    AlarmActions=[
        'arn:aws:sns:us-east-1:123456789012:alerts'
    ],
    Dimensions=[
        {
            'Name': 'QueueName',
            'Value': 'order-processing-dlq'
        }
    ]
)

print("DLQ alarm created")

# Create alarm for high age of oldest message
cloudwatch.put_metric_alarm(
    AlarmName='queue-age-alert',
    ComparisonOperator='GreaterThanThreshold',
    EvaluationPeriods=2,
    MetricName='ApproximateAgeOfOldestMessage',
    Namespace='AWS/SQS',
    Period=300,
    Statistic='Maximum',
    Threshold=3600,  # 1 hour
    ActionsEnabled=True,
    AlarmDescription='Alert when messages are stuck in queue',
    Dimensions=[
        {
            'Name': 'QueueName',
            'Value': 'order-processing-queue'
        }
    ]
)
```

### Monitor Queue Metrics

```python
import boto3
from datetime import datetime, timedelta

def get_queue_metrics(queue_name, hours=1):
    """Get queue metrics for the last N hours"""
    cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)

    metrics = [
        'ApproximateNumberOfMessagesVisible',
        'ApproximateNumberOfMessagesNotVisible',
        'ApproximateAgeOfOldestMessage',
        'NumberOfMessagesSent',
        'NumberOfMessagesReceived',
        'NumberOfMessagesDeleted'
    ]

    for metric_name in metrics:
        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/SQS',
            MetricName=metric_name,
            Dimensions=[
                {
                    'Name': 'QueueName',
                    'Value': queue_name
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,  # 5 minutes
            Statistics=['Average', 'Sum', 'Maximum']
        )

        datapoints = response['Datapoints']
        if datapoints:
            latest = max(datapoints, key=lambda x: x['Timestamp'])
            print(f"{metric_name}:")
            print(f"  Average: {latest.get('Average', 'N/A')}")
            print(f"  Maximum: {latest.get('Maximum', 'N/A')}")
            print(f"  Sum: {latest.get('Sum', 'N/A')}")
        else:
            print(f"{metric_name}: No data")

# Usage
get_queue_metrics('order-processing-queue', hours=1)
get_queue_metrics('order-processing-dlq', hours=24)
```

## DLQ Processing Strategies

### Analyze DLQ Messages

```python
import boto3
import json
from collections import Counter

def analyze_dlq_messages(dlq_url):
    """Analyze messages in DLQ to identify patterns"""
    sqs = boto3.client('sqs', region_name='us-east-1')

    error_types = Counter()
    message_count = 0

    while True:
        response = sqs.receive_message(
            QueueUrl=dlq_url,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=5,
            AttributeNames=['All'],
            MessageAttributeNames=['All']
        )

        messages = response.get('Messages', [])
        if not messages:
            break

        for message in messages:
            message_count += 1

            # Try to extract error information
            try:
                body = json.loads(message['Body'])
                error_type = body.get('error_type', 'unknown')
                error_types[error_type] += 1
            except:
                error_types['parse_error'] += 1

            # Put message back for reprocessing later
            # (Don't delete during analysis)

    print(f"\nDLQ Analysis for: {dlq_url}")
    print(f"Total messages: {message_count}")
    print("\nError types:")
    for error_type, count in error_types.most_common():
        print(f"  {error_type}: {count}")

    return error_types

# Usage
dlq_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/order-processing-dlq'
analyze_dlq_messages(dlq_url)
```

### Automated DLQ Processor

```python
import boto3
import json
import time
from datetime import datetime

class DLQProcessor:
    """Process and handle messages from Dead Letter Queue"""

    def __init__(self, dlq_url, source_url):
        self.sqs = boto3.client('sqs', region_name='us-east-1')
        self.dlq_url = dlq_url
        self.source_url = source_url

    def process_dlq_messages(self, action='log'):
        """
        Process DLQ messages with different strategies

        action:
        - 'log': Log and delete
        - 'redrive': Move back to source queue
        - 'archive': Save to S3 and delete
        """
        while True:
            response = self.sqs.receive_message(
                QueueUrl=self.dlq_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=20,
                AttributeNames=['All'],
                MessageAttributeNames=['All']
            )

            messages = response.get('Messages', [])

            if not messages:
                print("No more messages in DLQ")
                break

            for message in messages:
                try:
                    if action == 'log':
                        self.log_and_delete(message)
                    elif action == 'redrive':
                        self.redrive_message(message)
                    elif action == 'archive':
                        self.archive_message(message)

                except Exception as e:
                    print(f"Error processing DLQ message: {e}")

    def log_and_delete(self, message):
        """Log message details and delete from DLQ"""
        print(f"\n--- DLQ Message ---")
        print(f"MessageId: {message['MessageId']}")
        print(f"Body: {message['Body']}")
        print(f"Attributes: {message.get('Attributes', {})}")

        # Delete from DLQ
        self.sqs.delete_message(
            QueueUrl=self.dlq_url,
            ReceiptHandle=message['ReceiptHandle']
        )

        print("Message logged and deleted from DLQ")

    def redrive_message(self, message):
        """Move message back to source queue"""
        # Send to source queue
        self.sqs.send_message(
            QueueUrl=self.source_url,
            MessageBody=message['Body'],
            MessageAttributes=message.get('MessageAttributes', {})
        )

        # Delete from DLQ
        self.sqs.delete_message(
            QueueUrl=self.dlq_url,
            ReceiptHandle=message['ReceiptHandle']
        )

        print(f"Message {message['MessageId']} moved back to source queue")

    def archive_message(self, message):
        """Archive message to S3 and delete from DLQ"""
        s3 = boto3.client('s3')

        # Save to S3
        timestamp = datetime.utcnow().isoformat()
        key = f"dlq-messages/{timestamp}-{message['MessageId']}.json"

        s3.put_object(
            Bucket='my-dlq-archive-bucket',
            Key=key,
            Body=json.dumps({
                'MessageId': message['MessageId'],
                'Body': message['Body'],
                'Attributes': message.get('Attributes', {}),
                'MessageAttributes': message.get('MessageAttributes', {}),
                'ArchivedAt': timestamp
            })
        )

        # Delete from DLQ
        self.sqs.delete_message(
            QueueUrl=self.dlq_url,
            ReceiptHandle=message['ReceiptHandle']
        )

        print(f"Message archived to S3: {key}")

# Usage
dlq_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-dlq'
source_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'

processor = DLQProcessor(dlq_url, source_url)

# Log and delete all DLQ messages
processor.process_dlq_messages(action='log')

# Or redrive them back to source
# processor.process_dlq_messages(action='redrive')
```

## Best Practices

### 1. Set Appropriate Max Receive Count

```python
# For transient errors (network issues, timeouts)
max_receive_count = 10

# For validation errors (bad data format)
max_receive_count = 2

# For external API calls (rate limits)
max_receive_count = 5
```

### 2. Monitor DLQ Depth

```python
import boto3

def check_dlq_depth(queue_name, threshold=10):
    """Alert if DLQ has too many messages"""
    sqs = boto3.client('sqs', region_name='us-east-1')
    cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

    queue_url = f'https://sqs.us-east-1.amazonaws.com/123456789012/{queue_name}'

    attrs = sqs.get_queue_attributes(
        QueueUrl=queue_url,
        AttributeNames=['ApproximateNumberOfMessages']
    )

    message_count = int(attrs['Attributes']['ApproximateNumberOfMessages'])

    if message_count >= threshold:
        print(f"⚠️  WARNING: DLQ has {message_count} messages")
        # Send alert, page on-call, etc.
    else:
        print(f"✓ DLQ OK: {message_count} messages")

    return message_count
```

### 3. Implement Idempotency

```python
import boto3
import hashlib
import json

class IdempotentProcessor:
    """Process messages idempotently to handle duplicates"""

    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        self.processed_table = self.dynamodb.Table('processed-messages')

    def is_processed(self, message_id):
        """Check if message already processed"""
        try:
            response = self.processed_table.get_item(
                Key={'message_id': message_id}
            )
            return 'Item' in response
        except:
            return False

    def mark_processed(self, message_id):
        """Mark message as processed"""
        self.processed_table.put_item(
            Item={
                'message_id': message_id,
                'processed_at': int(time.time())
            }
        )

    def process_message(self, message):
        """Process message idempotently"""
        message_id = message['MessageId']

        if self.is_processed(message_id):
            print(f"Message {message_id} already processed, skipping")
            return

        # Process message
        print(f"Processing message {message_id}")

        # Mark as processed
        self.mark_processed(message_id)
```

### 4. Use Separate DLQs for Different Failure Types

```python
# Create specialized DLQs
dlq_configs = [
    {'name': 'validation-errors-dlq', 'retention': 604800},  # 7 days
    {'name': 'processing-errors-dlq', 'retention': 1209600},  # 14 days
    {'name': 'timeout-errors-dlq', 'retention': 345600}  # 4 days
]
```

## Summary

In this tutorial, you learned:
- Configuring Dead Letter Queues for failure isolation
- Managing visibility timeout for reliable processing
- Setting up message retention policies
- Monitoring and alerting on DLQ metrics
- Processing and recovering from DLQ messages

**Key Takeaways:**
- DLQs prevent poison messages from blocking queues
- Set maxReceiveCount based on error type (2-10)
- Always monitor DLQ depth with CloudWatch alarms
- Implement idempotency for at-least-once delivery
- Use long retention periods for DLQs (14 days)

**Next Steps:**
- [Tutorial 06: Lambda Integration](../06_lambda_integration/README.md) - Serverless error handling
- [Tutorial 08: Production Patterns](../08_production_patterns/README.md) - Advanced monitoring
