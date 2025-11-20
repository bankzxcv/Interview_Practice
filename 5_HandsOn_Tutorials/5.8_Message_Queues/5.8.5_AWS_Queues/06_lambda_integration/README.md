# Tutorial 06: Lambda Integration with SQS/SNS

## Overview

AWS Lambda provides serverless event-driven processing for SQS and SNS messages. This tutorial covers Lambda triggers, batch processing, error handling, and deployment with SAM and Serverless Framework.

## Table of Contents
1. [Lambda Event Sources](#lambda-event-sources)
2. [SQS Lambda Trigger](#sqs-lambda-trigger)
3. [SNS Lambda Trigger](#sns-lambda-trigger)
4. [Batch Processing](#batch-processing)
5. [Error Handling and Retries](#error-handling-and-retries)
6. [Partial Batch Failures](#partial-batch-failures)
7. [SAM Deployment](#sam-deployment)
8. [Serverless Framework](#serverless-framework)
9. [Best Practices](#best-practices)

## Lambda Event Sources

### Overview

Lambda can be triggered by both SQS and SNS, enabling serverless message processing without managing infrastructure.

| Event Source | Invocation Type | Polling | Concurrency |
|-------------|----------------|---------|-------------|
| **SQS** | Poll-based | Lambda polls queue | Scales up to 1000 concurrent executions |
| **SNS** | Push-based | SNS pushes to Lambda | Per-message invocation |

### Event Source Mapping

```python
import boto3

lambda_client = boto3.client('lambda', region_name='us-east-1')

# Create event source mapping for SQS
response = lambda_client.create_event_source_mapping(
    EventSourceArn='arn:aws:sqs:us-east-1:123456789012:my-queue',
    FunctionName='my-processor-function',
    Enabled=True,
    BatchSize=10,  # Process up to 10 messages at once
    MaximumBatchingWindowInSeconds=5  # Wait up to 5 seconds to batch
)

mapping_uuid = response['UUID']
print(f"Event source mapping created: {mapping_uuid}")
```

## SQS Lambda Trigger

### Basic Lambda Handler

```python
# lambda_function.py
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Process messages from SQS queue

    Event structure:
    {
        "Records": [
            {
                "messageId": "...",
                "receiptHandle": "...",
                "body": "...",
                "attributes": {...},
                "messageAttributes": {...},
                "md5OfBody": "...",
                "eventSource": "aws:sqs",
                "eventSourceARN": "arn:aws:sqs:...",
                "awsRegion": "us-east-1"
            }
        ]
    }
    """

    logger.info(f"Received {len(event['Records'])} messages")

    for record in event['Records']:
        try:
            # Parse message body
            message_body = json.loads(record['body'])

            logger.info(f"Processing message: {record['messageId']}")
            logger.info(f"Message content: {message_body}")

            # Process message
            process_message(message_body)

            logger.info(f"Successfully processed: {record['messageId']}")

        except Exception as e:
            logger.error(f"Error processing message {record['messageId']}: {e}")
            # Raise exception to trigger retry
            raise

    return {
        'statusCode': 200,
        'body': json.dumps(f'Processed {len(event["Records"])} messages')
    }

def process_message(message):
    """Process individual message"""
    # Your business logic here
    order_id = message.get('order_id')
    customer = message.get('customer')

    print(f"Processing order {order_id} for {customer}")
    # ... process order ...
```

### Configure SQS Trigger (AWS CLI)

```bash
# Create Lambda function
aws lambda create-function \
  --function-name sqs-processor \
  --runtime python3.11 \
  --role arn:aws:iam::123456789012:role/lambda-sqs-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip

# Create event source mapping
aws lambda create-event-source-mapping \
  --function-name sqs-processor \
  --event-source-arn arn:aws:sqs:us-east-1:123456789012:my-queue \
  --batch-size 10 \
  --maximum-batching-window-in-seconds 5
```

### IAM Role for SQS Lambda

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:ChangeMessageVisibility"
      ],
      "Resource": "arn:aws:sqs:us-east-1:123456789012:my-queue"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### Advanced SQS Processing

```python
# lambda_function.py
import json
import logging
import boto3
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def lambda_handler(event, context):
    """Process SQS messages with advanced features"""

    logger.info(f"Function: {context.function_name}, Version: {context.function_version}")
    logger.info(f"Request ID: {context.request_id}")
    logger.info(f"Remaining time: {context.get_remaining_time_in_millis()} ms")

    success_count = 0
    failure_count = 0

    for record in event['Records']:
        try:
            # Extract message details
            message_id = record['messageId']
            message_body = json.loads(record['body'])
            message_attributes = record.get('messageAttributes', {})

            # Get custom attributes
            priority = None
            if 'Priority' in message_attributes:
                priority = message_attributes['Priority']['stringValue']

            logger.info(f"Processing {message_id} (Priority: {priority})")

            # Process based on message type
            message_type = message_body.get('type')

            if message_type == 'order':
                process_order(message_body)
            elif message_type == 'payment':
                process_payment(message_body)
            else:
                logger.warning(f"Unknown message type: {message_type}")

            success_count += 1

        except Exception as e:
            logger.error(f"Error processing {record['messageId']}: {e}")
            failure_count += 1

            # Send to DLQ manually or re-raise for automatic retry
            raise

    logger.info(f"Success: {success_count}, Failures: {failure_count}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': success_count,
            'failed': failure_count
        })
    }

def process_order(message):
    """Process order message"""
    table = dynamodb.Table('orders')

    table.put_item(
        Item={
            'order_id': message['order_id'],
            'customer': message['customer'],
            'total': message['total'],
            'status': 'processing',
            'timestamp': datetime.utcnow().isoformat()
        }
    )

    logger.info(f"Order {message['order_id']} saved to DynamoDB")

def process_payment(message):
    """Process payment message"""
    logger.info(f"Processing payment for order {message['order_id']}")
    # Payment processing logic...
```

## SNS Lambda Trigger

### Basic SNS Handler

```python
# lambda_function.py
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Process messages from SNS topic

    Event structure:
    {
        "Records": [
            {
                "EventSource": "aws:sns",
                "EventVersion": "1.0",
                "EventSubscriptionArn": "arn:aws:sns:...",
                "Sns": {
                    "Type": "Notification",
                    "MessageId": "...",
                    "TopicArn": "arn:aws:sns:...",
                    "Subject": "...",
                    "Message": "...",
                    "Timestamp": "...",
                    "MessageAttributes": {...}
                }
            }
        ]
    }
    """

    logger.info(f"Received {len(event['Records'])} SNS notifications")

    for record in event['Records']:
        try:
            sns_message = record['Sns']

            message_id = sns_message['MessageId']
            subject = sns_message.get('Subject', 'No Subject')
            message = sns_message['Message']
            message_attributes = sns_message.get('MessageAttributes', {})

            logger.info(f"Processing SNS message: {message_id}")
            logger.info(f"Subject: {subject}")

            # Parse JSON message
            message_data = json.loads(message)

            # Process message
            process_notification(message_data, message_attributes)

            logger.info(f"Successfully processed: {message_id}")

        except Exception as e:
            logger.error(f"Error processing SNS message: {e}")
            raise

    return {
        'statusCode': 200,
        'body': json.dumps('SNS messages processed')
    }

def process_notification(message, attributes):
    """Process notification"""
    event_type = attributes.get('event_type', {}).get('Value')

    logger.info(f"Event type: {event_type}")
    logger.info(f"Message: {message}")

    # Process based on event type
    if event_type == 'order.created':
        send_order_confirmation(message)
    elif event_type == 'order.shipped':
        send_shipping_notification(message)

def send_order_confirmation(message):
    """Send order confirmation email"""
    logger.info(f"Sending confirmation for order {message['order_id']}")

def send_shipping_notification(message):
    """Send shipping notification"""
    logger.info(f"Sending shipping notification for order {message['order_id']}")
```

### Subscribe Lambda to SNS

```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')
lambda_client = boto3.client('lambda', region_name='us-east-1')

topic_arn = 'arn:aws:sns:us-east-1:123456789012:my-topic'
lambda_arn = 'arn:aws:lambda:us-east-1:123456789012:function:my-function'

# Add permission for SNS to invoke Lambda
lambda_client.add_permission(
    FunctionName='my-function',
    StatementId='sns-invoke-permission',
    Action='lambda:InvokeFunction',
    Principal='sns.amazonaws.com',
    SourceArn=topic_arn
)

# Subscribe Lambda to SNS topic
response = sns.subscribe(
    TopicArn=topic_arn,
    Protocol='lambda',
    Endpoint=lambda_arn
)

print(f"Subscription ARN: {response['SubscriptionArn']}")
```

## Batch Processing

### Configure Batch Settings

```python
import boto3

lambda_client = boto3.client('lambda', region_name='us-east-1')

# Update event source mapping for optimal batching
lambda_client.update_event_source_mapping(
    UUID='event-source-mapping-uuid',
    BatchSize=100,  # Maximum batch size (1-10000 for Standard queue)
    MaximumBatchingWindowInSeconds=10,  # Wait up to 10 seconds
    FunctionResponseTypes=['ReportBatchItemFailures']  # Enable partial batch failure
)
```

### Batch Processing Handler

```python
# lambda_function.py
import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Process batch of SQS messages efficiently"""

    records = event['Records']
    batch_size = len(records)

    logger.info(f"Processing batch of {batch_size} messages")

    # Process messages in parallel
    results = process_batch_parallel(records)

    # Count results
    successful = sum(1 for r in results if r['success'])
    failed = sum(1 for r in results if not r['success'])

    logger.info(f"Batch complete: {successful} succeeded, {failed} failed")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'batchSize': batch_size,
            'successful': successful,
            'failed': failed
        })
    }

def process_batch_parallel(records, max_workers=10):
    """Process messages in parallel using ThreadPoolExecutor"""

    results = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_record = {
            executor.submit(process_single_message, record): record
            for record in records
        }

        # Collect results as they complete
        for future in as_completed(future_to_record):
            record = future_to_record[future]
            try:
                result = future.result()
                results.append({
                    'message_id': record['messageId'],
                    'success': True,
                    'result': result
                })
            except Exception as e:
                logger.error(f"Failed to process {record['messageId']}: {e}")
                results.append({
                    'message_id': record['messageId'],
                    'success': False,
                    'error': str(e)
                })

    return results

def process_single_message(record):
    """Process individual message"""
    message = json.loads(record['body'])

    # Your processing logic
    logger.info(f"Processing {message.get('order_id')}")

    # Simulate work
    import time
    time.sleep(0.1)

    return {'status': 'processed'}
```

## Error Handling and Retries

### Retry Configuration

```python
import boto3

sqs = boto3.client('sqs', region_name='us-east-1')
lambda_client = boto3.client('lambda', region_name='us-east-1')

# Configure queue with DLQ for failed Lambda processing
dlq_arn = 'arn:aws:sqs:us-east-1:123456789012:lambda-dlq'

sqs.set_queue_attributes(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    Attributes={
        'RedrivePolicy': json.dumps({
            'deadLetterTargetArn': dlq_arn,
            'maxReceiveCount': '3'  # Retry 3 times before DLQ
        })
    }
)

# Configure Lambda retry attempts
lambda_client.update_event_source_mapping(
    UUID='event-source-mapping-uuid',
    MaximumRetryAttempts=2  # Lambda will retry failed batches 2 times
)
```

### Error Handling Patterns

```python
# lambda_function.py
import json
import logging
import traceback
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    """Lambda with comprehensive error handling"""

    processed = []
    failed = []

    for record in event['Records']:
        try:
            message_id = record['messageId']

            # Process message
            result = process_message_with_retry(record)

            processed.append(message_id)
            logger.info(f"Success: {message_id}")

        except RetryableError as e:
            # Transient error - let Lambda retry
            logger.warning(f"Retryable error for {message_id}: {e}")
            raise  # Re-raise to trigger Lambda retry

        except PermanentError as e:
            # Permanent error - don't retry
            logger.error(f"Permanent error for {message_id}: {e}")
            failed.append({
                'messageId': message_id,
                'error': str(e)
            })

            # Send alert
            send_error_alert(message_id, e)

        except Exception as e:
            # Unknown error - log and decide
            logger.error(f"Unknown error for {message_id}: {e}")
            logger.error(traceback.format_exc())

            # Publish metric
            publish_error_metric('UnknownError')

            # Re-raise for retry
            raise

    logger.info(f"Processed: {len(processed)}, Failed: {len(failed)}")

    return {
        'statusCode': 200 if not failed else 207,
        'body': json.dumps({
            'processed': processed,
            'failed': failed
        })
    }

class RetryableError(Exception):
    """Transient error that should be retried"""
    pass

class PermanentError(Exception):
    """Permanent error that should not be retried"""
    pass

def process_message_with_retry(record, max_retries=3):
    """Process message with exponential backoff retry"""
    import time

    for attempt in range(max_retries):
        try:
            return process_message(record)

        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt)  # Exponential backoff
                logger.info(f"Retry {attempt + 1}/{max_retries} after {wait_time}s")
                time.sleep(wait_time)
            else:
                raise

def process_message(record):
    """Process individual message"""
    message = json.loads(record['body'])

    # Validation
    if not message.get('order_id'):
        raise PermanentError("Missing order_id")

    # External API call (might fail transiently)
    try:
        response = call_external_api(message)
        return response
    except ConnectionError:
        raise RetryableError("API connection failed")

def call_external_api(message):
    """Call external API"""
    # Simulated API call
    return {'status': 'ok'}

def send_error_alert(message_id, error):
    """Send error notification via SNS"""
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789012:alerts',
        Subject='Lambda Processing Error',
        Message=f"Failed to process message {message_id}: {error}"
    )

def publish_error_metric(error_type):
    """Publish custom CloudWatch metric"""
    cloudwatch.put_metric_data(
        Namespace='Lambda/Processing',
        MetricData=[
            {
                'MetricName': 'ProcessingErrors',
                'Value': 1,
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'ErrorType', 'Value': error_type}
                ]
            }
        ]
    )
```

## Partial Batch Failures

### Report Batch Item Failures

```python
# lambda_function.py
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Process batch with partial failure support

    Return failed message IDs to retry only those messages
    """

    batch_item_failures = []

    for record in event['Records']:
        try:
            message_id = record['messageId']
            message = json.loads(record['body'])

            logger.info(f"Processing {message_id}")

            # Process message
            process_message(message)

            logger.info(f"Success: {message_id}")

        except Exception as e:
            logger.error(f"Error processing {record['messageId']}: {e}")

            # Add to batch item failures
            batch_item_failures.append({
                'itemIdentifier': record['messageId']
            })

    # Return failed message IDs
    # Lambda will retry only these messages
    return {
        'batchItemFailures': batch_item_failures
    }

def process_message(message):
    """Process message - raises exception on failure"""
    if not message.get('valid'):
        raise ValueError("Invalid message")

    # Process...
    return True
```

### Configure Partial Batch Response

```python
import boto3

lambda_client = boto3.client('lambda', region_name='us-east-1')

# Enable partial batch failure reporting
lambda_client.update_event_source_mapping(
    UUID='event-source-mapping-uuid',
    FunctionResponseTypes=['ReportBatchItemFailures']
)
```

## SAM Deployment

### SAM Template

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: SQS Lambda Integration

Resources:
  # SQS Queue
  OrderQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: order-processing-queue
      VisibilityTimeout: 300
      MessageRetentionPeriod: 345600
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt OrderDLQ.Arn
        maxReceiveCount: 3

  # Dead Letter Queue
  OrderDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: order-processing-dlq
      MessageRetentionPeriod: 1209600

  # Lambda Function
  OrderProcessor:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: order-processor
      Runtime: python3.11
      Handler: lambda_function.lambda_handler
      CodeUri: ./src
      MemorySize: 512
      Timeout: 300
      Environment:
        Variables:
          TABLE_NAME: !Ref OrdersTable
      Policies:
        - SQSPollerPolicy:
            QueueName: !GetAtt OrderQueue.QueueName
        - DynamoDBCrudPolicy:
            TableName: !Ref OrdersTable
      Events:
        SQSEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt OrderQueue.Arn
            BatchSize: 10
            MaximumBatchingWindowInSeconds: 5
            FunctionResponseTypes:
              - ReportBatchItemFailures

  # DynamoDB Table
  OrdersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: orders
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: order_id
          AttributeType: S
      KeySchema:
        - AttributeName: order_id
          KeyType: HASH

  # SNS Topic
  OrderEventsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: order-events

  # Lambda for SNS
  NotificationProcessor:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: notification-processor
      Runtime: python3.11
      Handler: notification.lambda_handler
      CodeUri: ./src
      Events:
        SNSEvent:
          Type: SNS
          Properties:
            Topic: !Ref OrderEventsTopic

Outputs:
  QueueUrl:
    Description: URL of the SQS Queue
    Value: !Ref OrderQueue

  QueueArn:
    Description: ARN of the SQS Queue
    Value: !GetAtt OrderQueue.Arn

  TopicArn:
    Description: ARN of the SNS Topic
    Value: !Ref OrderEventsTopic
```

### Deploy with SAM

```bash
# Build
sam build

# Deploy
sam deploy --guided

# Test locally
sam local invoke OrderProcessor --event events/sqs-event.json

# Tail logs
sam logs -n OrderProcessor --tail
```

## Serverless Framework

### serverless.yml

```yaml
service: sqs-lambda-integration

provider:
  name: aws
  runtime: python3.11
  region: us-east-1
  memorySize: 512
  timeout: 300

  environment:
    ORDERS_TABLE: ${self:service}-orders-${self:provider.stage}

  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - sqs:ReceiveMessage
            - sqs:DeleteMessage
            - sqs:GetQueueAttributes
          Resource: !GetAtt OrderQueue.Arn
        - Effect: Allow
          Action:
            - dynamodb:PutItem
            - dynamodb:GetItem
          Resource: !GetAtt OrdersTable.Arn

functions:
  orderProcessor:
    handler: handler.process_orders
    events:
      - sqs:
          arn: !GetAtt OrderQueue.Arn
          batchSize: 10
          maximumBatchingWindowInSeconds: 5
          functionResponseType: ReportBatchItemFailures

  notificationProcessor:
    handler: handler.process_notifications
    events:
      - sns:
          arn: !Ref OrderEventsTopic
          topicName: order-events

resources:
  Resources:
    OrderQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: ${self:service}-orders-${self:provider.stage}
        VisibilityTimeout: 300

    OrderEventsTopic:
      Type: AWS::SNS::Topic
      Properties:
        TopicName: ${self:service}-events-${self:provider.stage}

    OrdersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:service}-orders-${self:provider.stage}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: order_id
            AttributeType: S
        KeySchema:
          - AttributeName: order_id
            KeyType: HASH
```

### Deploy with Serverless

```bash
# Deploy
serverless deploy

# Deploy function only
serverless deploy function -f orderProcessor

# Invoke function
serverless invoke -f orderProcessor -l

# Tail logs
serverless logs -f orderProcessor -t

# Remove
serverless remove
```

## Best Practices

### 1. Right-Size Lambda Configuration

```python
# Memory: 512 MB - 3008 MB (more memory = more CPU)
# Timeout: Set to 6x average processing time
# Batch size: Balance throughput vs timeout

# For CPU-intensive tasks
MemorySize: 1024

# For I/O-intensive tasks
MemorySize: 512

# For large batches
Timeout: 300  # 5 minutes
BatchSize: 100
```

### 2. Idempotent Processing

```python
# Always design Lambda functions to be idempotent
# Same input should produce same result

def lambda_handler(event, context):
    for record in event['Records']:
        message_id = record['messageId']

        # Check if already processed
        if is_already_processed(message_id):
            logger.info(f"Skipping duplicate: {message_id}")
            continue

        # Process
        process_message(record)

        # Mark as processed
        mark_as_processed(message_id)
```

### 3. Monitor and Alert

```python
# CloudWatch metrics
- Duration
- Errors
- Throttles
- IteratorAge (SQS)
- DeadLetterErrors

# Custom metrics
cloudwatch.put_metric_data(
    Namespace='Lambda/Processing',
    MetricData=[{
        'MetricName': 'MessagesProcessed',
        'Value': len(event['Records']),
        'Unit': 'Count'
    }]
)
```

## Summary

In this tutorial, you learned:
- Lambda integration with SQS and SNS
- Batch processing and parallel execution
- Error handling and retry strategies
- Partial batch failure reporting
- Deployment with SAM and Serverless Framework

**Key Takeaways:**
- Lambda provides serverless message processing
- Use batch processing for efficiency
- Implement partial batch failures to avoid reprocessing successes
- Monitor with CloudWatch metrics and logs
- Design idempotent functions

**Next Steps:**
- [Tutorial 07: EventBridge](../07_eventbridge/README.md) - Advanced event routing
- [Tutorial 08: Production Patterns](../08_production_patterns/README.md) - Production best practices
