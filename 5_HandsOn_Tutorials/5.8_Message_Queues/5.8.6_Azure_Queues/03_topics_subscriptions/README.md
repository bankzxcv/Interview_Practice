# Tutorial 03: Service Bus Topics and Subscriptions

## Overview

Azure Service Bus Topics implement the publish-subscribe messaging pattern. Unlike queues (one consumer), topics allow multiple subscriptions to receive copies of messages. Each subscription can have filters to selectively receive messages.

**Key Concepts**:
- **Topic**: Message destination for publishers
- **Subscription**: Independent message queue for each subscriber
- **Filter**: Rules to selectively receive messages
- **Action**: Transform or modify messages in subscription

**Use Cases**:
- Event broadcasting to multiple services
- Microservices communication
- Notification systems
- Event-driven architectures

## Architecture

```
                                  ┌─────────────────────────┐
                                  │  Subscription 1         │
                                  │  (Filter: priority=high)│──> Consumer 1
                                  └─────────────────────────┘
                                           ↑
┌───────────┐       ┌──────────────────────┴──────────────────────┐
│ Producer  │──────>│       Service Bus Topic: events              │
└───────────┘       └──────────────────────┬──────────────────────┘
                                           ↓
                                  ┌─────────────────────────┐
                                  │  Subscription 2         │
                                  │  (Filter: type='order') │──> Consumer 2
                                  └─────────────────────────┘
                                           ↓
                                  ┌─────────────────────────┐
                                  │  Subscription 3         │
                                  │  (No filter - all msgs) │──> Consumer 3
                                  └─────────────────────────┘
```

## Prerequisites

```bash
# Install Python SDK
pip install azure-servicebus azure-identity

# Azure CLI login
az login

# Variables
RESOURCE_GROUP="rg-topics-tutorial"
LOCATION="eastus"
NAMESPACE="sb-topics-$(date +%s)"
TOPIC_NAME="events"
```

## Part 1: Topic and Subscription Setup

### Create Topic

```bash
# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create Service Bus namespace
az servicebus namespace create \
  --name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard

# Create topic
az servicebus topic create \
  --name $TOPIC_NAME \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --max-size 1024 \
  --default-message-time-to-live P14D \
  --enable-duplicate-detection true

# List topics
az servicebus topic list \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --output table
```

### Create Subscriptions

```bash
# Subscription 1: All messages (no filter)
az servicebus topic subscription create \
  --name all-events \
  --topic-name $TOPIC_NAME \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP

# Subscription 2: High priority only (SQL filter)
az servicebus topic subscription create \
  --name high-priority \
  --topic-name $TOPIC_NAME \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP

az servicebus topic subscription rule create \
  --name HighPriorityRule \
  --topic-name $TOPIC_NAME \
  --subscription-name high-priority \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --filter-sql-expression "priority='high'"

# Subscription 3: Orders only (SQL filter)
az servicebus topic subscription create \
  --name orders \
  --topic-name $TOPIC_NAME \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP

az servicebus topic subscription rule create \
  --name OrdersRule \
  --topic-name $TOPIC_NAME \
  --subscription-name orders \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --filter-sql-expression "event_type='order.created' OR event_type='order.updated'"

# List subscriptions
az servicebus topic subscription list \
  --topic-name $TOPIC_NAME \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --output table
```

## Part 2: Publish Messages to Topic

### Basic Publisher

```python
# publisher.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import json
import os
from datetime import datetime

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
TOPIC_NAME = "events"

def publish_message(event_type, data, priority="normal"):
    """Publish a message to the topic"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        sender = servicebus_client.get_topic_sender(topic_name=TOPIC_NAME)

        with sender:
            # Create message with properties
            message = ServiceBusMessage(
                body=json.dumps(data),
                content_type="application/json",
                message_id=f"{event_type}-{datetime.utcnow().timestamp()}"
            )

            # Add application properties for filtering
            message.application_properties = {
                "event_type": event_type,
                "priority": priority,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "api-service"
            }

            # Send to topic
            sender.send_messages(message)
            print(f"Published: {event_type} (priority: {priority})")

def publish_batch(events):
    """Publish multiple events in a batch"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        sender = servicebus_client.get_topic_sender(topic_name=TOPIC_NAME)

        with sender:
            batch = sender.create_message_batch()

            for event in events:
                message = ServiceBusMessage(
                    body=json.dumps(event['data'])
                )

                message.application_properties = {
                    "event_type": event['type'],
                    "priority": event.get('priority', 'normal')
                }

                try:
                    batch.add_message(message)
                except ValueError:
                    # Batch full, send and create new batch
                    sender.send_messages(batch)
                    print(f"Sent batch of messages")
                    batch = sender.create_message_batch()
                    batch.add_message(message)

            # Send remaining messages
            if len(batch) > 0:
                sender.send_messages(batch)
                print(f"Sent final batch")

if __name__ == "__main__":
    # Publish different types of events

    # Order created (normal priority)
    publish_message(
        event_type="order.created",
        data={
            "order_id": "ORD-001",
            "customer_id": "CUST-123",
            "amount": 99.99
        },
        priority="normal"
    )

    # Order updated (high priority)
    publish_message(
        event_type="order.updated",
        data={
            "order_id": "ORD-001",
            "status": "shipped"
        },
        priority="high"
    )

    # User signup (normal priority)
    publish_message(
        event_type="user.signup",
        data={
            "user_id": "USER-456",
            "email": "user@example.com"
        },
        priority="normal"
    )

    # Critical alert (high priority)
    publish_message(
        event_type="alert.critical",
        data={
            "message": "System error detected",
            "severity": "critical"
        },
        priority="high"
    )
```

## Part 3: Subscribe and Receive Messages

### Subscriber for All Events

```python
# subscriber_all.py
from azure.servicebus import ServiceBusClient
import json
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
TOPIC_NAME = "events"
SUBSCRIPTION_NAME = "all-events"

def subscribe_all_events():
    """Subscribe to all events"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    print(f"Subscribing to: {SUBSCRIPTION_NAME}")
    print("Will receive ALL messages\n")

    with servicebus_client:
        receiver = servicebus_client.get_subscription_receiver(
            topic_name=TOPIC_NAME,
            subscription_name=SUBSCRIPTION_NAME
        )

        with receiver:
            messages = receiver.receive_messages(
                max_message_count=10,
                max_wait_time=5
            )

            for message in messages:
                print(f"\n--- Message Received ---")
                print(f"Message ID: {message.message_id}")

                # Get properties
                props = message.application_properties
                print(f"Event Type: {props.get('event_type')}")
                print(f"Priority: {props.get('priority')}")
                print(f"Timestamp: {props.get('timestamp')}")

                # Get body
                body = json.loads(str(message))
                print(f"Data: {json.dumps(body, indent=2)}")

                # Process and complete
                receiver.complete_message(message)

if __name__ == "__main__":
    subscribe_all_events()
```

### Subscriber for High Priority Only

```python
# subscriber_high_priority.py
from azure.servicebus import ServiceBusClient
import json
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
TOPIC_NAME = "events"
SUBSCRIPTION_NAME = "high-priority"

def subscribe_high_priority():
    """Subscribe to high priority messages only"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    print(f"Subscribing to: {SUBSCRIPTION_NAME}")
    print("Will receive only HIGH PRIORITY messages\n")

    with servicebus_client:
        receiver = servicebus_client.get_subscription_receiver(
            topic_name=TOPIC_NAME,
            subscription_name=SUBSCRIPTION_NAME
        )

        with receiver:
            messages = receiver.receive_messages(
                max_message_count=10,
                max_wait_time=5
            )

            for message in messages:
                props = message.application_properties
                print(f"\n🔴 HIGH PRIORITY: {props.get('event_type')}")

                body = json.loads(str(message))
                print(f"Data: {json.dumps(body, indent=2)}")

                # Handle high priority message
                handle_high_priority(body, props)

                receiver.complete_message(message)

def handle_high_priority(data, props):
    """Handle high priority messages immediately"""
    print(f"⚡ Processing with high priority...")
    # Send alert, escalate, etc.

if __name__ == "__main__":
    subscribe_high_priority()
```

### Subscriber for Orders Only

```python
# subscriber_orders.py
from azure.servicebus import ServiceBusClient
import json
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
TOPIC_NAME = "events"
SUBSCRIPTION_NAME = "orders"

def subscribe_orders():
    """Subscribe to order events only"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    print(f"Subscribing to: {SUBSCRIPTION_NAME}")
    print("Will receive only ORDER messages\n")

    with servicebus_client:
        receiver = servicebus_client.get_subscription_receiver(
            topic_name=TOPIC_NAME,
            subscription_name=SUBSCRIPTION_NAME
        )

        with receiver:
            messages = receiver.receive_messages(
                max_message_count=10,
                max_wait_time=5
            )

            for message in messages:
                props = message.application_properties
                event_type = props.get('event_type')

                print(f"\n📦 ORDER EVENT: {event_type}")

                body = json.loads(str(message))

                if event_type == "order.created":
                    handle_order_created(body)
                elif event_type == "order.updated":
                    handle_order_updated(body)

                receiver.complete_message(message)

def handle_order_created(data):
    """Handle new order"""
    print(f"  New order: {data.get('order_id')}")
    print(f"  Amount: ${data.get('amount')}")

def handle_order_updated(data):
    """Handle order update"""
    print(f"  Order updated: {data.get('order_id')}")
    print(f"  Status: {data.get('status')}")

if __name__ == "__main__":
    subscribe_orders()
```

## Part 4: Advanced Filters

### SQL Filters

```python
# create_advanced_filters.py
from azure.servicebus.management import (
    ServiceBusAdministrationClient,
    SqlRuleFilter,
    SqlRuleAction,
    CorrelationRuleFilter
)
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
TOPIC_NAME = "events"

def create_subscription_with_sql_filter():
    """Create subscription with complex SQL filter"""
    admin_client = ServiceBusAdministrationClient.from_connection_string(
        CONNECTION_STRING
    )

    subscription_name = "complex-filter"

    # Create subscription
    admin_client.create_subscription(
        topic_name=TOPIC_NAME,
        subscription_name=subscription_name
    )

    # Delete default rule
    admin_client.delete_rule(
        topic_name=TOPIC_NAME,
        subscription_name=subscription_name,
        rule_name="$Default"
    )

    # Create SQL filter rule
    sql_filter = SqlRuleFilter(
        sql_expression="""
        (priority='high' AND event_type LIKE 'order.%')
        OR
        (priority='critical')
        """
    )

    admin_client.create_rule(
        topic_name=TOPIC_NAME,
        subscription_name=subscription_name,
        rule_name="ComplexRule",
        filter=sql_filter
    )

    print(f"Created subscription with SQL filter: {subscription_name}")

def create_subscription_with_action():
    """Create subscription with SQL filter and action"""
    admin_client = ServiceBusAdministrationClient.from_connection_string(
        CONNECTION_STRING
    )

    subscription_name = "with-action"

    # Create subscription
    admin_client.create_subscription(
        topic_name=TOPIC_NAME,
        subscription_name=subscription_name
    )

    # Delete default rule
    admin_client.delete_rule(
        topic_name=TOPIC_NAME,
        subscription_name=subscription_name,
        rule_name="$Default"
    )

    # SQL filter
    sql_filter = SqlRuleFilter(
        sql_expression="event_type='order.created'"
    )

    # SQL action (modify message properties)
    sql_action = SqlRuleAction(
        sql_expression="SET processed='true'; SET handler='order-service'"
    )

    admin_client.create_rule(
        topic_name=TOPIC_NAME,
        subscription_name=subscription_name,
        rule_name="OrderCreatedRule",
        filter=sql_filter,
        action=sql_action
    )

    print(f"Created subscription with filter and action: {subscription_name}")

def create_correlation_filter_subscription():
    """Create subscription with correlation filter (faster than SQL)"""
    admin_client = ServiceBusAdministrationClient.from_connection_string(
        CONNECTION_STRING
    )

    subscription_name = "correlation-filter"

    # Create subscription
    admin_client.create_subscription(
        topic_name=TOPIC_NAME,
        subscription_name=subscription_name
    )

    # Delete default rule
    admin_client.delete_rule(
        topic_name=TOPIC_NAME,
        subscription_name=subscription_name,
        rule_name="$Default"
    )

    # Correlation filter (equality checks only, but faster)
    correlation_filter = CorrelationRuleFilter(
        correlation_id="order-service",
        properties={
            "event_type": "order.created",
            "priority": "high"
        }
    )

    admin_client.create_rule(
        topic_name=TOPIC_NAME,
        subscription_name=subscription_name,
        rule_name="CorrelationRule",
        filter=correlation_filter
    )

    print(f"Created subscription with correlation filter: {subscription_name}")

if __name__ == "__main__":
    create_subscription_with_sql_filter()
    create_subscription_with_action()
    create_correlation_filter_subscription()
```

### Available SQL Filter Operators

```sql
-- Comparison operators
priority = 'high'
amount > 100
amount >= 100
amount < 50
amount <= 50
event_type != 'test'

-- Logical operators
priority = 'high' AND event_type = 'order'
priority = 'high' OR priority = 'critical'
NOT (event_type = 'test')

-- IN operator
event_type IN ('order.created', 'order.updated', 'order.deleted')

-- LIKE operator (pattern matching)
event_type LIKE 'order.%'
event_type LIKE '%created'
event_type LIKE '%order%'

-- IS NULL / IS NOT NULL
customer_id IS NOT NULL
description IS NULL

-- Functions
-- None available in Service Bus SQL filters
```

## Part 5: Complete Pub/Sub Example

### Microservices Event System

```python
# event_system.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
from azure.servicebus.management import ServiceBusAdministrationClient, SqlRuleFilter
import json
import os
from datetime import datetime
import threading
import time

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
TOPIC_NAME = "events"

def setup_subscriptions():
    """Setup subscriptions for different services"""
    admin_client = ServiceBusAdministrationClient.from_connection_string(
        CONNECTION_STRING
    )

    # Email service subscription
    try:
        admin_client.create_subscription(TOPIC_NAME, "email-service")
        admin_client.delete_rule(TOPIC_NAME, "email-service", "$Default")
        admin_client.create_rule(
            TOPIC_NAME,
            "email-service",
            "EmailEvents",
            filter=SqlRuleFilter("event_type IN ('user.signup', 'order.created', 'password.reset')")
        )
        print("Created email-service subscription")
    except:
        print("email-service subscription already exists")

    # Analytics service subscription
    try:
        admin_client.create_subscription(TOPIC_NAME, "analytics-service")
        # Keep default rule (receives all messages)
        print("Created analytics-service subscription")
    except:
        print("analytics-service subscription already exists")

    # Inventory service subscription
    try:
        admin_client.create_subscription(TOPIC_NAME, "inventory-service")
        admin_client.delete_rule(TOPIC_NAME, "inventory-service", "$Default")
        admin_client.create_rule(
            TOPIC_NAME,
            "inventory-service",
            "InventoryEvents",
            filter=SqlRuleFilter("event_type LIKE 'order.%'")
        )
        print("Created inventory-service subscription")
    except:
        print("inventory-service subscription already exists")

def event_producer():
    """Simulate event producer"""
    servicebus_client = ServiceBusClient.from_connection_string(CONNECTION_STRING)

    events = [
        {"type": "user.signup", "data": {"user_id": "U001", "email": "user@example.com"}},
        {"type": "order.created", "data": {"order_id": "O001", "amount": 99.99}},
        {"type": "order.updated", "data": {"order_id": "O001", "status": "shipped"}},
        {"type": "password.reset", "data": {"user_id": "U001"}},
        {"type": "user.login", "data": {"user_id": "U001"}},
    ]

    with servicebus_client:
        sender = servicebus_client.get_topic_sender(topic_name=TOPIC_NAME)

        with sender:
            for event in events:
                message = ServiceBusMessage(json.dumps(event['data']))
                message.application_properties = {
                    "event_type": event['type'],
                    "timestamp": datetime.utcnow().isoformat()
                }

                sender.send_messages(message)
                print(f"📤 Published: {event['type']}")
                time.sleep(1)

def event_consumer(subscription_name, service_name):
    """Generic event consumer"""
    servicebus_client = ServiceBusClient.from_connection_string(CONNECTION_STRING)

    print(f"🎧 {service_name} listening...")

    with servicebus_client:
        receiver = servicebus_client.get_subscription_receiver(
            topic_name=TOPIC_NAME,
            subscription_name=subscription_name
        )

        with receiver:
            while True:
                messages = receiver.receive_messages(max_wait_time=5)

                for message in messages:
                    props = message.application_properties
                    body = json.loads(str(message))

                    print(f"📥 {service_name} received: {props['event_type']}")
                    print(f"   Data: {body}")

                    receiver.complete_message(message)

                if not messages:
                    break

if __name__ == "__main__":
    # Setup subscriptions
    setup_subscriptions()

    print("\n=== Starting Event System ===\n")

    # Start consumers in threads
    consumers = [
        ("email-service", "Email Service"),
        ("analytics-service", "Analytics Service"),
        ("inventory-service", "Inventory Service")
    ]

    threads = []
    for sub_name, service_name in consumers:
        thread = threading.Thread(
            target=event_consumer,
            args=(sub_name, service_name)
        )
        thread.daemon = True
        thread.start()
        threads.append(thread)

    time.sleep(2)  # Let consumers start

    # Publish events
    event_producer()

    time.sleep(3)  # Let consumers process

    print("\n=== Event System Complete ===")
```

## Part 6: Monitoring and Management

### Get Subscription Metrics

```python
# subscription_metrics.py
from azure.servicebus.management import ServiceBusAdministrationClient
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
TOPIC_NAME = "events"

def get_subscription_info():
    """Get information about all subscriptions"""
    admin_client = ServiceBusAdministrationClient.from_connection_string(
        CONNECTION_STRING
    )

    print(f"=== Subscriptions for Topic: {TOPIC_NAME} ===\n")

    subscriptions = admin_client.list_subscriptions(TOPIC_NAME)

    for subscription in subscriptions:
        print(f"Subscription: {subscription.name}")
        print(f"  Status: {subscription.status}")
        print(f"  Message count: {subscription.message_count}")
        print(f"  Active messages: {subscription.active_message_count}")
        print(f"  Dead letter count: {subscription.dead_letter_message_count}")
        print(f"  Max delivery count: {subscription.max_delivery_count}")

        # Get rules
        rules = admin_client.list_rules(TOPIC_NAME, subscription.name)
        print(f"  Rules:")
        for rule in rules:
            print(f"    - {rule.name}")
            if hasattr(rule.filter, 'sql_expression'):
                print(f"      Filter: {rule.filter.sql_expression}")

        print()

if __name__ == "__main__":
    get_subscription_info()
```

## Best Practices

### 1. Filter Performance

```python
# Correlation filters are faster than SQL filters
# Use correlation filters when possible for simple equality checks

# Fast: Correlation filter
correlation_filter = CorrelationRuleFilter(
    properties={"event_type": "order.created"}
)

# Slower: SQL filter
sql_filter = SqlRuleFilter("event_type = 'order.created'")
```

### 2. Subscription Management

```python
# Delete unused subscriptions to reduce costs
# Each subscription stores a copy of messages

# Check subscription metrics regularly
# Remove subscriptions with no consumers
```

### 3. Message Design

```python
# Use clear event types
# Good: "order.created", "user.signup"
# Bad: "event1", "type_a"

# Use properties for filtering, not message body
message.application_properties = {
    "event_type": "order.created",  # Can filter on this
    "priority": "high"              # Can filter on this
}
# Don't parse body for filtering
```

## Cleanup

```bash
# Delete subscriptions
for SUB in all-events high-priority orders; do
  az servicebus topic subscription delete \
    --name $SUB \
    --topic-name $TOPIC_NAME \
    --namespace-name $NAMESPACE \
    --resource-group $RESOURCE_GROUP
done

# Delete topic
az servicebus topic delete \
  --name $TOPIC_NAME \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP

# Delete namespace
az servicebus namespace delete \
  --name $NAMESPACE \
  --resource-group $RESOURCE_GROUP

# Delete resource group
az group delete --name $RESOURCE_GROUP --yes
```

## Key Takeaways

- ✅ Topics enable publish-subscribe pattern
- ✅ Multiple subscriptions receive copies of messages
- ✅ SQL filters provide flexible message routing
- ✅ Correlation filters are faster for simple equality checks
- ✅ Actions can modify message properties
- ✅ Each subscription is independent queue
- ✅ Use for microservices event distribution
- ✅ Monitor subscription metrics to avoid backlogs

## Next Steps

Continue to [Tutorial 04: Message Sessions and Ordering](../04_sessions_ordering/) to learn:
- Session-based message processing
- FIFO guarantees per session
- Session state management
- Partitioned queues
- Concurrent session processing
