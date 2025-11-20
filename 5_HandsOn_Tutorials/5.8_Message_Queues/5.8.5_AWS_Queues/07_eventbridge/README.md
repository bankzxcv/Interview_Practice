# Tutorial 07: EventBridge for Event Routing

## Overview

Amazon EventBridge is a serverless event bus service that makes it easy to build event-driven applications at scale. It provides advanced routing, transformation, and integration capabilities beyond traditional message queues.

## Table of Contents
1. [EventBridge Fundamentals](#eventbridge-fundamentals)
2. [Event Buses](#event-buses)
3. [Event Patterns and Rules](#event-patterns-and-rules)
4. [Integration with SQS/SNS/Lambda](#integration-with-sqssns-lambda)
5. [Schema Registry](#schema-registry)
6. [Event Transformation](#event-transformation)
7. [Archive and Replay](#archive-and-replay)
8. [Event-Driven Architecture](#event-driven-architecture)
9. [Terraform Configuration](#terraform-configuration)

## EventBridge Fundamentals

### What is EventBridge?

EventBridge is a serverless event bus that routes events from various sources to targets using rules and patterns.

**Key Concepts:**
- **Event Bus**: Receives events from sources
- **Rules**: Define which events to route where
- **Targets**: Destinations for events (Lambda, SQS, SNS, Step Functions, etc.)
- **Event Patterns**: Filter events based on content
- **Schema Registry**: Discover and manage event schemas

### EventBridge vs SNS vs SQS

| Feature | EventBridge | SNS | SQS |
|---------|------------|-----|-----|
| **Pattern** | Event routing | Pub/sub | Queue |
| **Filtering** | Advanced pattern matching | Basic filter policies | No filtering |
| **Targets** | 20+ AWS services | Limited protocols | Point-to-point |
| **Schema** | Built-in schema registry | No schema support | No schema support |
| **Replay** | Archive and replay | No replay | No replay |
| **SaaS Integration** | 90+ partners | No SaaS integration | No SaaS integration |
| **Transformation** | Input transformation | No transformation | No transformation |
| **Cost** | $1.00/million events | $0.50/million publishes | $0.40/million requests |

### When to Use EventBridge

**Use EventBridge When:**
- Complex event routing logic needed
- Integration with AWS services or SaaS apps
- Event schema management required
- Archive/replay capability needed
- Event transformation needed
- Building event-driven architectures

**Use SNS/SQS When:**
- Simple pub/sub or queuing
- Cost optimization is critical
- High throughput (millions per second)
- Simpler requirements

## Event Buses

### Default Event Bus

Every AWS account has a default event bus that receives events from AWS services.

```python
import boto3
import json

eventbridge = boto3.client('events', region_name='us-east-1')

# Put event to default bus
response = eventbridge.put_events(
    Entries=[
        {
            'Source': 'my.application',
            'DetailType': 'order.created',
            'Detail': json.dumps({
                'order_id': '12345',
                'customer': 'john@example.com',
                'total': 99.99
            }),
            'EventBusName': 'default'
        }
    ]
)

print(f"Event ID: {response['Entries'][0]['EventId']}")
```

### Custom Event Bus

Create custom event buses for organizational boundaries or application separation.

```python
import boto3

eventbridge = boto3.client('events', region_name='us-east-1')

# Create custom event bus
response = eventbridge.create_event_bus(
    Name='order-events-bus'
)

event_bus_arn = response['EventBusArn']
print(f"Event Bus ARN: {event_bus_arn}")

# Set event bus policy (allow other accounts)
policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowAccountToPutEvents",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::123456789012:root"
            },
            "Action": "events:PutEvents",
            "Resource": event_bus_arn
        }
    ]
}

eventbridge.put_permission(
    EventBusName='order-events-bus',
    Policy=json.dumps(policy)
)
```

### Partner Event Bus

EventBridge integrates with SaaS providers like Zendesk, Datadog, Auth0, etc.

```python
# List partner event sources
response = eventbridge.list_event_sources(
    NamePrefix='aws.partner'
)

for source in response['EventSources']:
    print(f"Partner: {source['Name']}")
    print(f"ARN: {source['Arn']}")
```

## Event Patterns and Rules

### Create Rules with Event Patterns

```python
import boto3
import json

eventbridge = boto3.client('events', region_name='us-east-1')

# Create rule with event pattern
rule_name = 'order-created-rule'

event_pattern = {
    "source": ["my.application"],
    "detail-type": ["order.created"]
}

response = eventbridge.put_rule(
    Name=rule_name,
    EventPattern=json.dumps(event_pattern),
    State='ENABLED',
    Description='Route order.created events to processor',
    EventBusName='order-events-bus'
)

rule_arn = response['RuleArn']
print(f"Rule ARN: {rule_arn}")
```

### Advanced Event Patterns

```python
import json

# Match specific values
pattern_specific = {
    "source": ["my.application"],
    "detail-type": ["order.created"],
    "detail": {
        "status": ["pending"]
    }
}

# Match numeric ranges
pattern_numeric = {
    "source": ["my.application"],
    "detail-type": ["order.created"],
    "detail": {
        "total": [{"numeric": [">", 100]}]
    }
}

# Match array elements
pattern_array = {
    "source": ["my.application"],
    "detail-type": ["order.created"],
    "detail": {
        "items": {
            "product_id": ["PROD-001"]
        }
    }
}

# Exists check
pattern_exists = {
    "source": ["my.application"],
    "detail-type": ["order.created"],
    "detail": {
        "discount": [{"exists": True}]
    }
}

# Prefix matching
pattern_prefix = {
    "source": ["my.application"],
    "detail-type": ["order.created"],
    "detail": {
        "customer_id": [{"prefix": "VIP-"}]
    }
}

# Multiple conditions (AND logic)
pattern_complex = {
    "source": ["my.application"],
    "detail-type": ["order.created", "order.updated"],
    "detail": {
        "status": ["pending", "processing"],
        "total": [{"numeric": [">=", 50, "<=", 500]}],
        "customer_tier": ["premium", "vip"]
    }
}

# Anything-but (NOT logic)
pattern_anything_but = {
    "source": ["my.application"],
    "detail-type": ["order.created"],
    "detail": {
        "status": [{"anything-but": ["cancelled", "failed"]}]
    }
}
```

### Add Targets to Rules

```python
import boto3
import json

eventbridge = boto3.client('events', region_name='us-east-1')

# Add Lambda target
eventbridge.put_targets(
    Rule='order-created-rule',
    EventBusName='order-events-bus',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:lambda:us-east-1:123456789012:function:process-order',
            'RetryPolicy': {
                'MaximumRetryAttempts': 2,
                'MaximumEventAge': 3600
            },
            'DeadLetterConfig': {
                'Arn': 'arn:aws:sqs:us-east-1:123456789012:eventbridge-dlq'
            }
        }
    ]
)

# Add SQS target
eventbridge.put_targets(
    Rule='order-created-rule',
    EventBusName='order-events-bus',
    Targets=[
        {
            'Id': '2',
            'Arn': 'arn:aws:sqs:us-east-1:123456789012:order-queue',
            'SqsParameters': {
                'MessageGroupId': 'orders'  # For FIFO queues
            }
        }
    ]
)

# Add SNS target
eventbridge.put_targets(
    Rule='order-created-rule',
    EventBusName='order-events-bus',
    Targets=[
        {
            'Id': '3',
            'Arn': 'arn:aws:sns:us-east-1:123456789012:order-notifications'
        }
    ]
)

# Add Step Functions target
eventbridge.put_targets(
    Rule='order-created-rule',
    EventBusName='order-events-bus',
    Targets=[
        {
            'Id': '4',
            'Arn': 'arn:aws:states:us-east-1:123456789012:stateMachine:order-workflow',
            'RoleArn': 'arn:aws:iam::123456789012:role/eventbridge-stepfunctions-role'
        }
    ]
)
```

## Integration with SQS/SNS/Lambda

### Complete Integration Example

```python
import boto3
import json

class EventBridgeIntegration:
    """EventBridge integration with SQS, SNS, and Lambda"""

    def __init__(self, event_bus_name='order-events-bus'):
        self.eventbridge = boto3.client('events', region_name='us-east-1')
        self.sqs = boto3.client('sqs', region_name='us-east-1')
        self.sns = boto3.client('sns', region_name='us-east-1')
        self.lambda_client = boto3.client('lambda', region_name='us-east-1')
        self.event_bus_name = event_bus_name

    def setup_order_processing_pipeline(self):
        """Setup complete event-driven order processing"""

        # Create event bus
        self.eventbridge.create_event_bus(Name=self.event_bus_name)

        # Create SQS queue for processing
        queue_response = self.sqs.create_queue(
            QueueName='order-processing-queue',
            Attributes={'VisibilityTimeout': '300'}
        )
        queue_url = queue_response['QueueUrl']
        queue_attrs = self.sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['QueueArn']
        )
        queue_arn = queue_attrs['Attributes']['QueueArn']

        # Create SNS topic for notifications
        topic_response = self.sns.create_topic(Name='order-notifications')
        topic_arn = topic_response['TopicArn']

        # Allow EventBridge to publish to SQS
        self.allow_eventbridge_to_sqs(queue_url, queue_arn)

        # Allow EventBridge to publish to SNS
        self.allow_eventbridge_to_sns(topic_arn)

        # Create rules and targets
        self.create_processing_rule(queue_arn)
        self.create_notification_rule(topic_arn)
        self.create_high_value_rule(queue_arn)

        print("EventBridge integration setup complete")

    def allow_eventbridge_to_sqs(self, queue_url, queue_arn):
        """Grant EventBridge permission to send to SQS"""
        policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "events.amazonaws.com"},
                "Action": "sqs:SendMessage",
                "Resource": queue_arn
            }]
        }

        self.sqs.set_queue_attributes(
            QueueUrl=queue_url,
            Attributes={'Policy': json.dumps(policy)}
        )

    def allow_eventbridge_to_sns(self, topic_arn):
        """Grant EventBridge permission to publish to SNS"""
        policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "events.amazonaws.com"},
                "Action": "sns:Publish",
                "Resource": topic_arn
            }]
        }

        self.sns.set_topic_attributes(
            TopicArn=topic_arn,
            AttributeName='Policy',
            AttributeValue=json.dumps(policy)
        )

    def create_processing_rule(self, queue_arn):
        """Create rule for all order events to SQS"""
        event_pattern = {
            "source": ["order.service"],
            "detail-type": ["order.created", "order.updated"]
        }

        self.eventbridge.put_rule(
            Name='order-processing-rule',
            EventPattern=json.dumps(event_pattern),
            State='ENABLED',
            EventBusName=self.event_bus_name
        )

        self.eventbridge.put_targets(
            Rule='order-processing-rule',
            EventBusName=self.event_bus_name,
            Targets=[{'Id': '1', 'Arn': queue_arn}]
        )

    def create_notification_rule(self, topic_arn):
        """Create rule for customer notifications to SNS"""
        event_pattern = {
            "source": ["order.service"],
            "detail-type": ["order.shipped", "order.delivered"]
        }

        self.eventbridge.put_rule(
            Name='order-notification-rule',
            EventPattern=json.dumps(event_pattern),
            State='ENABLED',
            EventBusName=self.event_bus_name
        )

        self.eventbridge.put_targets(
            Rule='order-notification-rule',
            EventBusName=self.event_bus_name,
            Targets=[{'Id': '1', 'Arn': topic_arn}]
        )

    def create_high_value_rule(self, queue_arn):
        """Create rule for high-value orders"""
        event_pattern = {
            "source": ["order.service"],
            "detail-type": ["order.created"],
            "detail": {
                "total": [{"numeric": [">", 1000]}]
            }
        }

        self.eventbridge.put_rule(
            Name='high-value-order-rule',
            EventPattern=json.dumps(event_pattern),
            State='ENABLED',
            EventBusName=self.event_bus_name
        )

        self.eventbridge.put_targets(
            Rule='high-value-order-rule',
            EventBusName=self.event_bus_name,
            Targets=[{'Id': '1', 'Arn': queue_arn}]
        )

    def publish_event(self, detail_type, detail):
        """Publish event to EventBridge"""
        response = self.eventbridge.put_events(
            Entries=[
                {
                    'Source': 'order.service',
                    'DetailType': detail_type,
                    'Detail': json.dumps(detail),
                    'EventBusName': self.event_bus_name
                }
            ]
        )

        return response['Entries'][0]['EventId']

# Usage
integration = EventBridgeIntegration()
integration.setup_order_processing_pipeline()

# Publish events
order_data = {
    'order_id': '12345',
    'customer': 'john@example.com',
    'total': 1500.00,
    'items': [{'product': 'Widget', 'quantity': 10}]
}

event_id = integration.publish_event('order.created', order_data)
print(f"Event published: {event_id}")
```

## Schema Registry

### Discover and Register Schemas

```python
import boto3
import json

schemas = boto3.client('schemas', region_name='us-east-1')

# Create schema registry
registry_response = schemas.create_registry(
    RegistryName='order-schemas',
    Description='Schemas for order events'
)

# Define schema
order_schema = {
    "openapi": "3.0.0",
    "info": {
        "version": "1.0.0",
        "title": "OrderCreated"
    },
    "paths": {},
    "components": {
        "schemas": {
            "OrderCreated": {
                "type": "object",
                "required": ["order_id", "customer", "total"],
                "properties": {
                    "order_id": {"type": "string"},
                    "customer": {"type": "string", "format": "email"},
                    "total": {"type": "number", "minimum": 0},
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "product_id": {"type": "string"},
                                "quantity": {"type": "integer"}
                            }
                        }
                    }
                }
            }
        }
    }
}

# Create schema
schema_response = schemas.create_schema(
    RegistryName='order-schemas',
    SchemaName='OrderCreated',
    Type='OpenApi3',
    Content=json.dumps(order_schema)
)

print(f"Schema ARN: {schema_response['SchemaArn']}")

# Enable schema discovery on event bus
eventbridge = boto3.client('events', region_name='us-east-1')

eventbridge.put_rule(
    Name='schema-discovery-rule',
    EventPattern=json.dumps({"source": ["order.service"]}),
    State='ENABLED'
)
```

### Use Schema for Code Generation

```python
import boto3

schemas = boto3.client('schemas', region_name='us-east-1')

# Get schema code binding (generates code)
response = schemas.get_code_binding_source(
    RegistryName='order-schemas',
    SchemaName='OrderCreated',
    Language='Python3.6'
)

# Download generated code
code = response['Body'].read()
print(code.decode('utf-8'))
```

## Event Transformation

### Input Transformer

```python
import boto3
import json

eventbridge = boto3.client('events', region_name='us-east-1')

# Create rule with input transformation
eventbridge.put_rule(
    Name='order-transform-rule',
    EventPattern=json.dumps({
        "source": ["order.service"],
        "detail-type": ["order.created"]
    }),
    State='ENABLED'
)

# Add target with input transformation
eventbridge.put_targets(
    Rule='order-transform-rule',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:lambda:us-east-1:123456789012:function:processor',
            'InputTransformer': {
                'InputPathsMap': {
                    'orderId': '$.detail.order_id',
                    'customer': '$.detail.customer',
                    'total': '$.detail.total',
                    'timestamp': '$.time'
                },
                'InputTemplate': json.dumps({
                    "message": "Order <orderId> from <customer>",
                    "amount": "<total>",
                    "processed_at": "<timestamp>"
                })
            }
        }
    ]
)
```

## Archive and Replay

### Create Event Archive

```python
import boto3

eventbridge = boto3.client('events', region_name='us-east-1')

# Create archive
archive_response = eventbridge.create_archive(
    ArchiveName='order-events-archive',
    EventSourceArn='arn:aws:events:us-east-1:123456789012:event-bus/order-events-bus',
    Description='Archive all order events',
    EventPattern=json.dumps({
        "source": ["order.service"]
    }),
    RetentionDays=30  # Keep for 30 days
)

archive_arn = archive_response['ArchiveArn']
print(f"Archive ARN: {archive_arn}")
```

### Replay Events

```python
import boto3
from datetime import datetime, timedelta

eventbridge = boto3.client('events', region_name='us-east-1')

# Replay last 24 hours of events
start_time = datetime.utcnow() - timedelta(days=1)
end_time = datetime.utcnow()

replay_response = eventbridge.start_replay(
    ReplayName='order-events-replay-20240101',
    EventSourceArn='arn:aws:events:us-east-1:123456789012:event-bus/order-events-bus',
    EventStartTime=start_time,
    EventEndTime=end_time,
    Destination={
        'Arn': 'arn:aws:events:us-east-1:123456789012:event-bus/replay-bus',
        'FilterArns': [
            'arn:aws:events:us-east-1:123456789012:rule/replay-rule'
        ]
    }
)

print(f"Replay ARN: {replay_response['ReplayArn']}")

# Check replay status
status_response = eventbridge.describe_replay(
    ReplayName='order-events-replay-20240101'
)

print(f"State: {status_response['State']}")
print(f"Progress: {status_response.get('EventLastReplayedTime')}")
```

## Event-Driven Architecture

### Microservices Event Router

```python
"""
Event-driven microservices architecture with EventBridge

Services:
- Order Service: Creates orders
- Payment Service: Processes payments
- Inventory Service: Manages inventory
- Notification Service: Sends notifications
"""

import boto3
import json

class EventDrivenArchitecture:
    """Setup event-driven microservices"""

    def __init__(self):
        self.eventbridge = boto3.client('events', region_name='us-east-1')
        self.event_bus_name = 'microservices-bus'

    def setup_architecture(self):
        """Create event bus and routing rules"""

        # Create central event bus
        self.eventbridge.create_event_bus(Name=self.event_bus_name)

        # Setup service-specific routing
        self.setup_payment_routing()
        self.setup_inventory_routing()
        self.setup_notification_routing()

    def setup_payment_routing(self):
        """Route payment events"""
        # Route order.created to payment service
        event_pattern = {
            "source": ["order.service"],
            "detail-type": ["order.created"]
        }

        self.create_rule_with_lambda_target(
            rule_name='route-to-payment',
            event_pattern=event_pattern,
            lambda_arn='arn:aws:lambda:us-east-1:123456789012:function:payment-processor'
        )

    def setup_inventory_routing(self):
        """Route inventory events"""
        # Route order.created and order.cancelled to inventory
        event_pattern = {
            "source": ["order.service"],
            "detail-type": ["order.created", "order.cancelled"]
        }

        self.create_rule_with_lambda_target(
            rule_name='route-to-inventory',
            event_pattern=event_pattern,
            lambda_arn='arn:aws:lambda:us-east-1:123456789012:function:inventory-updater'
        )

    def setup_notification_routing(self):
        """Route notification events"""
        # Route all order events to notification service
        event_pattern = {
            "source": ["order.service", "payment.service", "inventory.service"],
            "detail-type": [
                "order.created", "order.updated",
                "payment.completed", "payment.failed",
                "inventory.updated"
            ]
        }

        self.create_rule_with_lambda_target(
            rule_name='route-to-notifications',
            event_pattern=event_pattern,
            lambda_arn='arn:aws:lambda:us-east-1:123456789012:function:notification-sender'
        )

    def create_rule_with_lambda_target(self, rule_name, event_pattern, lambda_arn):
        """Helper to create rule with Lambda target"""
        self.eventbridge.put_rule(
            Name=rule_name,
            EventPattern=json.dumps(event_pattern),
            State='ENABLED',
            EventBusName=self.event_bus_name
        )

        self.eventbridge.put_targets(
            Rule=rule_name,
            EventBusName=self.event_bus_name,
            Targets=[{
                'Id': '1',
                'Arn': lambda_arn,
                'RetryPolicy': {
                    'MaximumRetryAttempts': 2
                }
            }]
        )
```

## Terraform Configuration

```hcl
# terraform/eventbridge.tf

# Event Bus
resource "aws_cloudwatch_event_bus" "main" {
  name = "order-events-bus"
}

# Rule: Route order.created to Lambda
resource "aws_cloudwatch_event_rule" "order_created" {
  name           = "order-created-rule"
  description    = "Route order.created events to processor"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source      = ["order.service"]
    detail-type = ["order.created"]
    detail = {
      total = [{
        numeric = [">", 100]
      }]
    }
  })
}

# Target: Lambda function
resource "aws_cloudwatch_event_target" "lambda" {
  rule           = aws_cloudwatch_event_rule.order_created.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  arn            = aws_lambda_function.processor.arn

  retry_policy {
    maximum_retry_attempts = 2
    maximum_event_age      = 3600
  }

  dead_letter_config {
    arn = aws_sqs_queue.dlq.arn
  }
}

# Target: SQS queue
resource "aws_cloudwatch_event_target" "sqs" {
  rule           = aws_cloudwatch_event_rule.order_created.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  arn            = aws_sqs_queue.orders.arn
}

# SQS Queue
resource "aws_sqs_queue" "orders" {
  name = "order-processing-queue"
}

# SQS Queue Policy
resource "aws_sqs_queue_policy" "orders" {
  queue_url = aws_sqs_queue.orders.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.orders.arn
    }]
  })
}

# Archive
resource "aws_cloudwatch_event_archive" "orders" {
  name             = "order-events-archive"
  event_source_arn = aws_cloudwatch_event_bus.main.arn
  retention_days   = 30

  event_pattern = jsonencode({
    source = ["order.service"]
  })
}

# Schema Registry
resource "aws_schemas_registry" "orders" {
  name        = "order-schemas"
  description = "Schemas for order events"
}

resource "aws_schemas_schema" "order_created" {
  name          = "OrderCreated"
  registry_name = aws_schemas_registry.orders.name
  type          = "OpenApi3"
  description   = "Schema for order.created event"

  content = file("${path.module}/schemas/order-created.json")
}
```

## Summary

In this tutorial, you learned:
- EventBridge fundamentals and event buses
- Advanced event pattern matching
- Integration with SQS, SNS, and Lambda
- Schema registry for event discovery
- Event transformation and input mapping
- Archive and replay capabilities
- Event-driven architecture patterns

**Key Takeaways:**
- EventBridge provides advanced event routing
- Use event patterns for complex filtering
- Schema registry helps with event discovery
- Archive enables event replay for testing
- Ideal for event-driven microservices

**Next Steps:**
- [Tutorial 08: Production Patterns](../08_production_patterns/README.md) - Production best practices
