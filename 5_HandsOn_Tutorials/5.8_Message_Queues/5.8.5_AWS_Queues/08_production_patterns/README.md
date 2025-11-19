# Tutorial 08: Production Patterns and Cost Optimization

## Overview

This tutorial covers production-ready patterns, cost optimization strategies, security best practices, and comprehensive monitoring for AWS messaging services (SQS, SNS, EventBridge, and Amazon MQ).

## Table of Contents
1. [Message Batching](#message-batching)
2. [Auto-Scaling Consumers](#auto-scaling-consumers)
3. [Cross-Account Messaging](#cross-account-messaging)
4. [Encryption and Security](#encryption-and-security)
5. [Cost Optimization Strategies](#cost-optimization-strategies)
6. [Monitoring with CloudWatch](#monitoring-with-cloudwatch)
7. [Performance Optimization](#performance-optimization)
8. [Infrastructure as Code](#infrastructure-as-code)
9. [Disaster Recovery](#disaster-recovery)

## Message Batching

### SQS Batch Operations

Batching reduces API calls and costs by up to 90%.

```python
import boto3
import json
from typing import List, Dict

class SQSBatchProcessor:
    """Efficient batch processing for SQS"""

    def __init__(self, queue_url):
        self.sqs = boto3.client('sqs', region_name='us-east-1')
        self.queue_url = queue_url
        self.batch_size = 10  # Maximum for SQS

    def send_messages_batch(self, messages: List[Dict]) -> Dict:
        """Send messages in batches of 10"""
        results = {'successful': 0, 'failed': 0}

        # Process in chunks of 10
        for i in range(0, len(messages), self.batch_size):
            batch = messages[i:i + self.batch_size]

            entries = [
                {
                    'Id': str(idx),
                    'MessageBody': json.dumps(msg),
                    'MessageAttributes': msg.get('attributes', {})
                }
                for idx, msg in enumerate(batch)
            ]

            try:
                response = self.sqs.send_message_batch(
                    QueueUrl=self.queue_url,
                    Entries=entries
                )

                results['successful'] += len(response.get('Successful', []))
                results['failed'] += len(response.get('Failed', []))

                # Handle failures
                for failure in response.get('Failed', []):
                    print(f"Failed: {failure['Id']} - {failure['Message']}")

            except Exception as e:
                print(f"Batch send error: {e}")
                results['failed'] += len(batch)

        return results

    def receive_messages_batch(self, max_messages=10) -> List[Dict]:
        """Receive multiple messages at once"""
        response = self.sqs.receive_message(
            QueueUrl=self.queue_url,
            MaxNumberOfMessages=max_messages,
            WaitTimeSeconds=20,  # Long polling
            MessageAttributeNames=['All']
        )

        return response.get('Messages', [])

    def delete_messages_batch(self, messages: List[Dict]) -> Dict:
        """Delete messages in batches"""
        results = {'successful': 0, 'failed': 0}

        for i in range(0, len(messages), self.batch_size):
            batch = messages[i:i + self.batch_size]

            entries = [
                {
                    'Id': str(idx),
                    'ReceiptHandle': msg['ReceiptHandle']
                }
                for idx, msg in enumerate(batch)
            ]

            try:
                response = self.sqs.delete_message_batch(
                    QueueUrl=self.queue_url,
                    Entries=entries
                )

                results['successful'] += len(response.get('Successful', []))
                results['failed'] += len(response.get('Failed', []))

            except Exception as e:
                print(f"Batch delete error: {e}")
                results['failed'] += len(batch)

        return results

# Usage
processor = SQSBatchProcessor('https://sqs.us-east-1.amazonaws.com/123456789012/my-queue')

# Send 100 messages in batches
messages = [{'order_id': i, 'total': 10.0 * i} for i in range(100)]
results = processor.send_messages_batch(messages)
print(f"Sent: {results['successful']}, Failed: {results['failed']}")
```

### SNS Batch Publishing

```python
import boto3
import json
from typing import List

class SNSBatchPublisher:
    """Batch publishing for SNS"""

    def __init__(self, topic_arn):
        self.sns = boto3.client('sns', region_name='us-east-1')
        self.topic_arn = topic_arn
        self.batch_size = 10

    def publish_batch(self, messages: List[Dict]) -> Dict:
        """Publish messages in batches (SNS supports up to 10)"""
        results = {'successful': 0, 'failed': 0}

        for i in range(0, len(messages), self.batch_size):
            batch = messages[i:i + self.batch_size]

            entries = [
                {
                    'Id': str(idx),
                    'Message': json.dumps(msg['message']),
                    'Subject': msg.get('subject', 'Notification'),
                    'MessageAttributes': msg.get('attributes', {})
                }
                for idx, msg in enumerate(batch)
            ]

            try:
                response = self.sns.publish_batch(
                    TopicArn=self.topic_arn,
                    PublishBatchRequestEntries=entries
                )

                results['successful'] += len(response.get('Successful', []))
                results['failed'] += len(response.get('Failed', []))

            except Exception as e:
                print(f"Batch publish error: {e}")
                results['failed'] += len(batch)

        return results
```

## Auto-Scaling Consumers

### ECS Task Auto-Scaling Based on Queue Depth

```python
import boto3
import json

class QueueBasedAutoScaling:
    """Auto-scale ECS tasks based on SQS queue depth"""

    def __init__(self, cluster_name, service_name, queue_name):
        self.ecs = boto3.client('ecs', region_name='us-east-1')
        self.cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')
        self.autoscaling = boto3.client('application-autoscaling', region_name='us-east-1')
        self.cluster_name = cluster_name
        self.service_name = service_name
        self.queue_name = queue_name

    def setup_autoscaling(self):
        """Configure auto-scaling for ECS service"""

        # Register scalable target
        resource_id = f'service/{self.cluster_name}/{self.service_name}'

        self.autoscaling.register_scalable_target(
            ServiceNamespace='ecs',
            ResourceId=resource_id,
            ScalableDimension='ecs:service:DesiredCount',
            MinCapacity=1,
            MaxCapacity=10
        )

        # Create scaling policy
        self.autoscaling.put_scaling_policy(
            PolicyName='queue-depth-scaling',
            ServiceNamespace='ecs',
            ResourceId=resource_id,
            ScalableDimension='ecs:service:DesiredCount',
            PolicyType='TargetTrackingScaling',
            TargetTrackingScalingPolicyConfiguration={
                'TargetValue': 100.0,  # Target: 100 messages per task
                'CustomizedMetricSpecification': {
                    'MetricName': 'ApproximateNumberOfMessagesVisible',
                    'Namespace': 'AWS/SQS',
                    'Dimensions': [
                        {'Name': 'QueueName', 'Value': self.queue_name}
                    ],
                    'Statistic': 'Average'
                },
                'ScaleInCooldown': 300,
                'ScaleOutCooldown': 60
            }
        )

        print(f"Auto-scaling configured for {self.service_name}")

# Usage
autoscaling = QueueBasedAutoScaling(
    cluster_name='my-cluster',
    service_name='message-processor',
    queue_name='order-processing-queue'
)
autoscaling.setup_autoscaling()
```

### Lambda Concurrency Management

```python
import boto3

def configure_lambda_concurrency():
    """Configure Lambda concurrency for SQS processing"""
    lambda_client = boto3.client('lambda', region_name='us-east-1')

    # Set reserved concurrency (max concurrent executions)
    lambda_client.put_function_concurrency(
        FunctionName='sqs-processor',
        ReservedConcurrentExecutions=100  # Maximum 100 concurrent executions
    )

    # Configure provisioned concurrency (pre-warmed instances)
    lambda_client.put_provisioned_concurrency_config(
        FunctionName='sqs-processor',
        ProvisionedConcurrentExecutions=10,  # Keep 10 instances warm
        Qualifier='$LATEST'
    )

    print("Lambda concurrency configured")
```

## Cross-Account Messaging

### Cross-Account SQS Access

```python
import boto3
import json

def setup_cross_account_sqs(queue_url, trusted_account_id):
    """Allow another account to send messages to queue"""
    sqs = boto3.client('sqs', region_name='us-east-1')

    # Get queue ARN
    attrs = sqs.get_queue_attributes(
        QueueUrl=queue_url,
        AttributeNames=['QueueArn']
    )
    queue_arn = attrs['Attributes']['QueueArn']

    # Create cross-account policy
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "AWS": f"arn:aws:iam::{trusted_account_id}:root"
                },
                "Action": [
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage"
                ],
                "Resource": queue_arn
            }
        ]
    }

    sqs.set_queue_attributes(
        QueueUrl=queue_url,
        Attributes={
            'Policy': json.dumps(policy)
        }
    )

    print(f"Cross-account access granted to {trusted_account_id}")
```

### Cross-Account SNS Publishing

```python
import boto3
import json

def setup_cross_account_sns(topic_arn, trusted_account_id):
    """Allow another account to publish to SNS topic"""
    sns = boto3.client('sns', region_name='us-east-1')

    # Create cross-account policy
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "AWS": f"arn:aws:iam::{trusted_account_id}:root"
                },
                "Action": "sns:Publish",
                "Resource": topic_arn
            }
        ]
    }

    sns.set_topic_attributes(
        TopicArn=topic_arn,
        AttributeName='Policy',
        AttributeValue=json.dumps(policy)
    )

    print(f"Cross-account publishing enabled for {trusted_account_id}")
```

### Cross-Account EventBridge

```python
import boto3
import json

def setup_cross_account_eventbridge(event_bus_name, trusted_account_id):
    """Allow another account to send events to event bus"""
    events = boto3.client('events', region_name='us-east-1')

    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "AllowAccountToPutEvents",
                "Effect": "Allow",
                "Principal": {
                    "AWS": f"arn:aws:iam::{trusted_account_id}:root"
                },
                "Action": "events:PutEvents",
                "Resource": f"arn:aws:events:us-east-1:123456789012:event-bus/{event_bus_name}"
            }
        ]
    }

    events.put_permission(
        EventBusName=event_bus_name,
        Policy=json.dumps(policy)
    )

    print(f"Cross-account EventBridge access granted")
```

## Encryption and Security

### SQS Encryption at Rest

```python
import boto3

def create_encrypted_queue():
    """Create SQS queue with encryption"""
    sqs = boto3.client('sqs', region_name='us-east-1')
    kms = boto3.client('kms', region_name='us-east-1')

    # Create KMS key
    key_response = kms.create_key(
        Description='SQS encryption key',
        KeyUsage='ENCRYPT_DECRYPT'
    )
    kms_key_id = key_response['KeyMetadata']['KeyId']

    # Create queue with encryption
    response = sqs.create_queue(
        QueueName='encrypted-queue',
        Attributes={
            'KmsMasterKeyId': kms_key_id,
            'KmsDataKeyReusePeriodSeconds': '300'  # 5 minutes
        }
    )

    print(f"Encrypted queue created: {response['QueueUrl']}")
    return response['QueueUrl']
```

### SNS Encryption

```python
import boto3

def create_encrypted_topic():
    """Create SNS topic with encryption"""
    sns = boto3.client('sns', region_name='us-east-1')
    kms = boto3.client('kms', region_name='us-east-1')

    # Create KMS key
    key_response = kms.create_key(
        Description='SNS encryption key',
        KeyUsage='ENCRYPT_DECRYPT'
    )
    kms_key_id = key_response['KeyMetadata']['KeyId']

    # Create encrypted topic
    response = sns.create_topic(
        Name='encrypted-topic',
        Attributes={
            'KmsMasterKeyId': kms_key_id
        }
    )

    print(f"Encrypted topic created: {response['TopicArn']}")
    return response['TopicArn']
```

### VPC Endpoints for Private Access

```python
import boto3

def create_vpc_endpoints():
    """Create VPC endpoints for SQS and SNS"""
    ec2 = boto3.client('ec2', region_name='us-east-1')

    vpc_id = 'vpc-12345678'
    subnet_ids = ['subnet-12345678', 'subnet-87654321']
    security_group_id = 'sg-12345678'

    # SQS VPC endpoint
    sqs_endpoint = ec2.create_vpc_endpoint(
        VpcId=vpc_id,
        ServiceName='com.amazonaws.us-east-1.sqs',
        VpcEndpointType='Interface',
        SubnetIds=subnet_ids,
        SecurityGroupIds=[security_group_id],
        PrivateDnsEnabled=True
    )

    # SNS VPC endpoint
    sns_endpoint = ec2.create_vpc_endpoint(
        VpcId=vpc_id,
        ServiceName='com.amazonaws.us-east-1.sns',
        VpcEndpointType='Interface',
        SubnetIds=subnet_ids,
        SecurityGroupIds=[security_group_id],
        PrivateDnsEnabled=True
    )

    print(f"SQS endpoint: {sqs_endpoint['VpcEndpoint']['VpcEndpointId']}")
    print(f"SNS endpoint: {sns_endpoint['VpcEndpoint']['VpcEndpointId']}")
```

## Cost Optimization Strategies

### 1. Use Long Polling

```python
# Cost reduction: Up to 90% fewer API calls

# Bad: Short polling (expensive)
response = sqs.receive_message(
    QueueUrl=queue_url,
    MaxNumberOfMessages=1
)  # Returns immediately, may be empty

# Good: Long polling (cost-effective)
response = sqs.receive_message(
    QueueUrl=queue_url,
    MaxNumberOfMessages=10,  # Batch processing
    WaitTimeSeconds=20  # Wait for messages
)  # Reduces empty receives by 90%
```

### 2. Optimize Message Size

```python
import boto3
import json
import gzip
import base64

class OptimizedMessageSender:
    """Optimize message size to reduce costs"""

    def __init__(self, queue_url):
        self.sqs = boto3.client('sqs', region_name='us-east-1')
        self.s3 = boto3.client('s3', region_name='us-east-1')
        self.queue_url = queue_url
        self.bucket = 'message-overflow-bucket'

    def send_message_optimized(self, message_data):
        """Send message, using S3 for large payloads"""
        message_json = json.dumps(message_data)

        # SQS charges in 64KB chunks
        if len(message_json) > 256 * 1024:  # 256KB limit
            # Store in S3 and send reference
            s3_key = f"messages/{uuid.uuid4()}.json"

            self.s3.put_object(
                Bucket=self.bucket,
                Key=s3_key,
                Body=message_json
            )

            # Send S3 reference
            message_body = {
                'type': 's3_reference',
                's3_bucket': self.bucket,
                's3_key': s3_key
            }
        elif len(message_json) > 64 * 1024:
            # Compress large messages
            compressed = gzip.compress(message_json.encode())
            message_body = {
                'type': 'compressed',
                'data': base64.b64encode(compressed).decode()
            }
        else:
            # Send directly
            message_body = {
                'type': 'direct',
                'data': message_data
            }

        self.sqs.send_message(
            QueueUrl=self.queue_url,
            MessageBody=json.dumps(message_body)
        )
```

### 3. Right-Size Retention Periods

```python
import boto3

def optimize_retention():
    """Set appropriate retention based on use case"""
    sqs = boto3.client('sqs', region_name='us-east-1')

    # High-volume, short retention (reduce storage costs)
    sqs.set_queue_attributes(
        QueueUrl='high-volume-queue-url',
        Attributes={
            'MessageRetentionPeriod': '86400'  # 1 day
        }
    )

    # Critical data, long retention
    sqs.set_queue_attributes(
        QueueUrl='critical-queue-url',
        Attributes={
            'MessageRetentionPeriod': '1209600'  # 14 days
        }
    )
```

### 4. Cost Monitoring

```python
import boto3
from datetime import datetime, timedelta

class CostMonitor:
    """Monitor messaging costs"""

    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')
        self.ce = boto3.client('ce', region_name='us-east-1')

    def get_sqs_usage_metrics(self, queue_name, days=7):
        """Get SQS usage metrics"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=days)

        # Number of messages sent
        sent_response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/SQS',
            MetricName='NumberOfMessagesSent',
            Dimensions=[{'Name': 'QueueName', 'Value': queue_name}],
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,  # 1 day
            Statistics=['Sum']
        )

        # Number of messages received
        received_response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/SQS',
            MetricName='NumberOfMessagesReceived',
            Dimensions=[{'Name': 'QueueName', 'Value': queue_name}],
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,
            Statistics=['Sum']
        )

        # Calculate estimated cost
        total_sent = sum(dp['Sum'] for dp in sent_response['Datapoints'])
        total_received = sum(dp['Sum'] for dp in received_response['Datapoints'])
        total_requests = total_sent + total_received

        # SQS pricing: ~$0.40 per million requests
        estimated_cost = (total_requests / 1_000_000) * 0.40

        print(f"Queue: {queue_name}")
        print(f"Messages sent: {total_sent:,.0f}")
        print(f"Messages received: {total_received:,.0f}")
        print(f"Estimated cost: ${estimated_cost:.2f}")

        return estimated_cost

    def get_monthly_messaging_costs(self):
        """Get actual monthly costs from Cost Explorer"""
        end_date = datetime.utcnow().strftime('%Y-%m-%d')
        start_date = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')

        response = self.ce.get_cost_and_usage(
            TimePeriod={
                'Start': start_date,
                'End': end_date
            },
            Granularity='MONTHLY',
            Filter={
                'Dimensions': {
                    'Key': 'SERVICE',
                    'Values': ['Amazon Simple Queue Service', 'Amazon Simple Notification Service']
                }
            },
            Metrics=['UnblendedCost']
        )

        for result in response['ResultsByTime']:
            cost = result['Total']['UnblendedCost']['Amount']
            print(f"Messaging costs: ${float(cost):.2f}")

# Usage
monitor = CostMonitor()
monitor.get_sqs_usage_metrics('order-processing-queue', days=7)
monitor.get_monthly_messaging_costs()
```

## Monitoring with CloudWatch

### Comprehensive Monitoring Dashboard

```python
import boto3
import json

class MessagingMonitoring:
    """Create comprehensive CloudWatch dashboard"""

    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

    def create_monitoring_dashboard(self, queue_name, topic_arn):
        """Create CloudWatch dashboard for messaging"""

        dashboard_body = {
            "widgets": [
                # SQS Queue Depth
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/SQS", "ApproximateNumberOfMessagesVisible",
                             {"stat": "Average", "label": "Messages in Queue"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "Queue Depth",
                        "yAxis": {"left": {"min": 0}}
                    }
                },
                # Message Age
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/SQS", "ApproximateAgeOfOldestMessage",
                             {"stat": "Maximum", "label": "Oldest Message Age"}]
                        ],
                        "period": 300,
                        "stat": "Maximum",
                        "region": "us-east-1",
                        "title": "Message Age (seconds)"
                    }
                },
                # Throughput
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/SQS", "NumberOfMessagesSent", {"stat": "Sum"}],
                            [".", "NumberOfMessagesReceived", {"stat": "Sum"}],
                            [".", "NumberOfMessagesDeleted", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": "us-east-1",
                        "title": "Message Throughput"
                    }
                },
                # SNS Metrics
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/SNS", "NumberOfMessagesPublished", {"stat": "Sum"}],
                            [".", "NumberOfNotificationsDelivered", {"stat": "Sum"}],
                            [".", "NumberOfNotificationsFailed", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": "us-east-1",
                        "title": "SNS Metrics"
                    }
                }
            ]
        }

        self.cloudwatch.put_dashboard(
            DashboardName='messaging-dashboard',
            DashboardBody=json.dumps(dashboard_body)
        )

        print("Dashboard created: messaging-dashboard")

    def create_alarms(self, queue_name):
        """Create CloudWatch alarms"""

        # Alarm: Queue depth too high
        self.cloudwatch.put_metric_alarm(
            AlarmName=f'{queue_name}-depth-high',
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=2,
            MetricName='ApproximateNumberOfMessagesVisible',
            Namespace='AWS/SQS',
            Period=300,
            Statistic='Average',
            Threshold=1000,
            ActionsEnabled=True,
            AlarmDescription='Queue depth exceeds 1000 messages',
            Dimensions=[{'Name': 'QueueName', 'Value': queue_name}]
        )

        # Alarm: Old messages stuck
        self.cloudwatch.put_metric_alarm(
            AlarmName=f'{queue_name}-age-high',
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=1,
            MetricName='ApproximateAgeOfOldestMessage',
            Namespace='AWS/SQS',
            Period=300,
            Statistic='Maximum',
            Threshold=3600,  # 1 hour
            ActionsEnabled=True,
            AlarmDescription='Messages stuck for over 1 hour',
            Dimensions=[{'Name': 'QueueName', 'Value': queue_name}]
        )

        # Alarm: DLQ has messages
        self.cloudwatch.put_metric_alarm(
            AlarmName=f'{queue_name}-dlq-messages',
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=1,
            MetricName='ApproximateNumberOfMessagesVisible',
            Namespace='AWS/SQS',
            Period=60,
            Statistic='Average',
            Threshold=0,
            ActionsEnabled=True,
            AlarmDescription='Messages in DLQ - investigate failures',
            Dimensions=[{'Name': 'QueueName', 'Value': f'{queue_name}-dlq'}]
        )

        print(f"Alarms created for {queue_name}")
```

## Performance Optimization

### Parallel Processing

```python
import boto3
from concurrent.futures import ThreadPoolExecutor, as_completed
import json

class ParallelConsumer:
    """High-performance parallel message consumer"""

    def __init__(self, queue_url, num_workers=10):
        self.sqs = boto3.client('sqs', region_name='us-east-1')
        self.queue_url = queue_url
        self.num_workers = num_workers

    def consume_parallel(self):
        """Consume messages in parallel"""

        with ThreadPoolExecutor(max_workers=self.num_workers) as executor:
            futures = []

            # Submit worker tasks
            for _ in range(self.num_workers):
                future = executor.submit(self.worker)
                futures.append(future)

            # Wait for completion
            for future in as_completed(futures):
                try:
                    result = future.result()
                    print(f"Worker completed: {result}")
                except Exception as e:
                    print(f"Worker error: {e}")

    def worker(self):
        """Individual worker processing messages"""
        processed = 0

        while True:
            # Receive batch
            response = self.sqs.receive_message(
                QueueUrl=self.queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=20
            )

            messages = response.get('Messages', [])

            if not messages:
                break

            # Process messages
            for message in messages:
                try:
                    self.process_message(message)
                    self.sqs.delete_message(
                        QueueUrl=self.queue_url,
                        ReceiptHandle=message['ReceiptHandle']
                    )
                    processed += 1
                except Exception as e:
                    print(f"Processing error: {e}")

        return processed

    def process_message(self, message):
        """Process individual message"""
        body = json.loads(message['Body'])
        # Process...
```

## Infrastructure as Code

### Complete Terraform Configuration

```hcl
# terraform/production.tf

# SQS Queue with DLQ
resource "aws_sqs_queue" "main" {
  name                       = "${var.environment}-order-queue"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20  # Long polling

  kms_master_key_id                 = aws_kms_key.sqs.id
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Dead Letter Queue
resource "aws_sqs_queue" "dlq" {
  name                      = "${var.environment}-order-dlq"
  message_retention_seconds = 1209600  # 14 days

  tags = {
    Environment = var.environment
    Purpose     = "dead-letter-queue"
  }
}

# KMS Key for Encryption
resource "aws_kms_key" "sqs" {
  description             = "SQS encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

# SNS Topic with Encryption
resource "aws_sns_topic" "main" {
  name              = "${var.environment}-order-events"
  kms_master_key_id = aws_kms_key.sns.id

  tags = {
    Environment = var.environment
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "queue_depth" {
  alarm_name          = "${var.environment}-queue-depth-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "Queue depth exceeds threshold"

  dimensions = {
    QueueName = aws_sqs_queue.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.environment}-dlq-has-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "DLQ has messages - investigate"

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.processor.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_policy" {
  name               = "queue-based-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 100.0

    customized_metric_specification {
      metric_name = "ApproximateNumberOfMessagesVisible"
      namespace   = "AWS/SQS"
      statistic   = "Average"

      dimensions {
        name  = "QueueName"
        value = aws_sqs_queue.main.name
      }
    }

    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

## Disaster Recovery

### Backup and Recovery Strategy

```python
import boto3
import json
from datetime import datetime

class DisasterRecovery:
    """Backup and recovery for messaging infrastructure"""

    def __init__(self):
        self.sqs = boto3.client('sqs', region_name='us-east-1')
        self.sns = boto3.client('sns', region_name='us-east-1')
        self.s3 = boto3.client('s3', region_name='us-east-1')
        self.backup_bucket = 'messaging-backups'

    def backup_queue_configuration(self, queue_url):
        """Backup queue configuration"""
        # Get queue attributes
        attrs = self.sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )

        backup = {
            'queue_url': queue_url,
            'attributes': attrs['Attributes'],
            'timestamp': datetime.utcnow().isoformat()
        }

        # Save to S3
        key = f"queue-configs/{queue_url.split('/')[-1]}/{datetime.utcnow().date()}.json"

        self.s3.put_object(
            Bucket=self.backup_bucket,
            Key=key,
            Body=json.dumps(backup, indent=2)
        )

        print(f"Queue config backed up to s3://{self.backup_bucket}/{key}")

    def backup_messages_from_dlq(self, dlq_url):
        """Backup DLQ messages for analysis"""
        messages = []

        while True:
            response = self.sqs.receive_message(
                QueueUrl=dlq_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=5,
                AttributeNames=['All'],
                MessageAttributeNames=['All']
            )

            batch = response.get('Messages', [])
            if not batch:
                break

            messages.extend(batch)

        # Save to S3
        key = f"dlq-backups/{dlq_url.split('/')[-1]}/{datetime.utcnow().isoformat()}.json"

        self.s3.put_object(
            Bucket=self.backup_bucket,
            Key=key,
            Body=json.dumps(messages, indent=2, default=str)
        )

        print(f"Backed up {len(messages)} DLQ messages to S3")
```

## Summary

In this tutorial, you learned:
- Message batching for cost reduction
- Auto-scaling consumers based on queue depth
- Cross-account messaging patterns
- Encryption and security best practices
- Cost optimization strategies
- Comprehensive monitoring with CloudWatch
- Performance optimization techniques
- Infrastructure as Code with Terraform
- Disaster recovery and backup strategies

**Key Takeaways:**
- Always use batching and long polling
- Monitor queue depth and message age
- Implement encryption for sensitive data
- Auto-scale consumers to handle load
- Set up comprehensive alarms
- Use IaC for reproducible infrastructure
- Track costs and optimize regularly

**Production Checklist:**
- [ ] Enable encryption at rest and in transit
- [ ] Configure DLQs with monitoring
- [ ] Set up CloudWatch alarms
- [ ] Implement auto-scaling
- [ ] Use long polling
- [ ] Batch operations where possible
- [ ] Set appropriate retention periods
- [ ] Configure VPC endpoints
- [ ] Implement cost monitoring
- [ ] Test disaster recovery procedures
- [ ] Document architecture and runbooks

This completes the AWS Queue Services tutorial series!
