# Tutorial 05: Dead Lettering and Auto-Forwarding

## Overview

Dead letter queues (DLQ) and auto-forwarding are advanced Service Bus features for handling failed messages and chaining queues. Dead letter queues automatically capture messages that can't be processed, while auto-forwarding enables message routing between queues and topics.

**Key Features**:
- **Dead Letter Queue**: Automatic sub-queue for failed messages
- **Auto-Forwarding**: Chain queues and topics together
- **Message Deferral**: Postpone message processing
- **Peek-Lock Pattern**: Safe message processing with timeout

**Common Scenarios**:
- Messages that exceed max delivery count
- Messages that expire (TTL exceeded)
- Manually dead-lettered messages (business logic failures)
- Routing messages through multiple processing stages
- Error handling and recovery

## Architecture

```
┌──────────────┐         ┌─────────────────────────┐         ┌──────────────┐
│   Producer   │────────>│   Primary Queue         │────────>│   Consumer   │
└──────────────┘         │                         │         └──────────────┘
                         │  Messages (active)      │                │
                         └─────────────────────────┘                │
                                     │                              │
                                     │ (on failure)                 │
                                     ↓                              │
                         ┌─────────────────────────┐                │
                         │   Dead Letter Queue     │                │
                         │   (automatic sub-queue) │                │
                         │                         │                │
                         │  - Max delivery exceeded│←───────────────┘
                         │  - Message expired      │    (abandon/dead-letter)
                         │  - Manual dead-letter   │
                         └─────────────────────────┘
                                     │
                                     ↓
                         ┌─────────────────────────┐
                         │   DLQ Monitor/Handler   │
                         │  (repair & resubmit)    │
                         └─────────────────────────┘
```

## Prerequisites

```bash
# Install Python SDK
pip install azure-servicebus azure-identity

# Azure CLI
az login

# Variables
RESOURCE_GROUP="rg-dlq-tutorial"
LOCATION="eastus"
NAMESPACE="sb-dlq-$(date +%s)"
```

## Part 1: Dead Letter Queue Setup

### Create Queue with DLQ Configuration

```bash
# Create resource group and namespace
az group create --name $RESOURCE_GROUP --location $LOCATION

az servicebus namespace create \
  --name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard

# Create queue with dead lettering enabled
az servicebus queue create \
  --name orders \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --max-delivery-count 3 \
  --enable-dead-lettering-on-message-expiration true \
  --default-message-time-to-live PT1H \
  --lock-duration PT1M

# Dead letter queue is automatically created as a sub-queue
# Path: orders/$deadletterqueue
```

### Configure DLQ Programmatically

```python
# configure_dlq.py
from azure.servicebus.management import (
    ServiceBusAdministrationClient,
    QueueProperties
)
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")

def create_queue_with_dlq(queue_name):
    """Create queue with dead letter configuration"""
    admin_client = ServiceBusAdministrationClient.from_connection_string(
        CONNECTION_STRING
    )

    queue_properties = QueueProperties(
        max_delivery_count=3,  # Move to DLQ after 3 failed attempts
        dead_lettering_on_message_expiration=True,  # DLQ expired messages
        default_message_time_to_live="PT1H",  # 1 hour TTL
        lock_duration="PT1M"  # 1 minute processing lock
    )

    try:
        queue = admin_client.create_queue(queue_name, queue=queue_properties)
        print(f"Created queue: {queue.name}")
        print(f"  Max delivery count: {queue.max_delivery_count}")
        print(f"  Dead letter on expiration: {queue.dead_lettering_on_message_expiration}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_queue_with_dlq("orders")
```

## Part 2: Scenarios That Trigger Dead Lettering

### Scenario 1: Max Delivery Count Exceeded

```python
# max_delivery_exceeded.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import json
import os
import time

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders"

def send_message():
    """Send a message that will fail processing"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        sender = servicebus_client.get_queue_sender(queue_name=QUEUE_NAME)

        with sender:
            message = ServiceBusMessage(
                json.dumps({"order_id": "FAIL-001", "will_fail": True})
            )
            sender.send_messages(message)
            print("Sent message that will fail processing")

def failing_consumer():
    """Consumer that always fails (simulates processing error)"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        receiver = servicebus_client.get_queue_receiver(queue_name=QUEUE_NAME)

        with receiver:
            for attempt in range(5):
                messages = receiver.receive_messages(max_wait_time=5)

                for message in messages:
                    print(f"\nAttempt {message.delivery_count + 1}")
                    print(f"Message: {str(message)}")

                    # Simulate processing failure
                    try:
                        raise Exception("Simulated processing error")
                    except Exception as e:
                        print(f"Error: {e}")

                        # Abandon message (returns to queue)
                        receiver.abandon_message(message)
                        print("Message abandoned, will retry")

                time.sleep(2)  # Wait before next attempt

            print("\nMessage should now be in dead letter queue")

if __name__ == "__main__":
    send_message()
    time.sleep(1)
    failing_consumer()
```

### Scenario 2: Message Expiration (TTL)

```python
# message_expiration.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import os
import time

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders"

def send_short_lived_message():
    """Send message with short TTL"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        sender = servicebus_client.get_queue_sender(queue_name=QUEUE_NAME)

        with sender:
            message = ServiceBusMessage(
                body="Short-lived message",
                time_to_live=10  # 10 seconds TTL
            )

            sender.send_messages(message)
            print("Sent message with 10 second TTL")
            print("Waiting for expiration...")

    # Wait for message to expire
    time.sleep(15)
    print("Message should now be in dead letter queue (expired)")

if __name__ == "__main__":
    send_short_lived_message()
```

### Scenario 3: Manual Dead Lettering

```python
# manual_dead_letter.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import json
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders"

def send_invalid_message():
    """Send message with invalid data"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        sender = servicebus_client.get_queue_sender(queue_name=QUEUE_NAME)

        with sender:
            # Invalid order (missing required fields)
            message = ServiceBusMessage(
                json.dumps({"order_id": "INVALID-001"})
            )
            sender.send_messages(message)
            print("Sent invalid message")

def consumer_with_validation():
    """Consumer that validates and dead letters invalid messages"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        receiver = servicebus_client.get_queue_receiver(queue_name=QUEUE_NAME)

        with receiver:
            messages = receiver.receive_messages(max_wait_time=5)

            for message in messages:
                body = json.loads(str(message))

                # Validate message
                if not validate_order(body):
                    print(f"Invalid order: {body}")

                    # Manually dead letter with reason
                    receiver.dead_letter_message(
                        message,
                        reason="ValidationFailed",
                        error_description="Missing required fields: customer_id, amount"
                    )
                    print("Message moved to dead letter queue")
                else:
                    # Process valid message
                    receiver.complete_message(message)

def validate_order(order):
    """Validate order has required fields"""
    required_fields = ["order_id", "customer_id", "amount"]
    return all(field in order for field in required_fields)

if __name__ == "__main__":
    send_invalid_message()
    time.sleep(1)
    consumer_with_validation()
```

## Part 3: Processing Dead Letter Queue

### Monitor Dead Letter Queue

```python
# dlq_monitor.py
from azure.servicebus import ServiceBusClient
import json
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders"

def monitor_dead_letter_queue():
    """Check dead letter queue for failed messages"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    print("=== Dead Letter Queue Monitor ===\n")

    with servicebus_client:
        # Receive from dead letter sub-queue
        receiver = servicebus_client.get_queue_receiver(
            queue_name=QUEUE_NAME,
            sub_queue="deadletter",  # or ServiceBusClient.SUB_QUEUE.DEAD_LETTER
            max_wait_time=5
        )

        with receiver:
            messages = receiver.peek_messages(max_message_count=32)

            if not messages:
                print("No messages in dead letter queue")
                return

            for i, message in enumerate(messages, 1):
                print(f"\n--- Dead Letter Message {i} ---")
                print(f"Message ID: {message.id}")
                print(f"Body: {str(message)}")
                print(f"Delivery Count: {message.delivery_count}")
                print(f"Enqueued Time: {message.enqueued_time_utc}")

                # Dead letter specific properties
                print(f"\nDead Letter Info:")
                print(f"  Reason: {message.dead_letter_reason}")
                print(f"  Error: {message.dead_letter_error_description}")
                print(f"  Source: {message.dead_letter_source}")

                # Custom properties
                if message.application_properties:
                    print(f"\nApplication Properties:")
                    for key, value in message.application_properties.items():
                        print(f"  {key}: {value}")

def get_dlq_count():
    """Get count of messages in dead letter queue"""
    from azure.servicebus.management import ServiceBusAdministrationClient

    admin_client = ServiceBusAdministrationClient.from_connection_string(
        CONNECTION_STRING
    )

    queue_props = admin_client.get_queue_runtime_properties(QUEUE_NAME)

    print(f"Queue: {QUEUE_NAME}")
    print(f"  Active messages: {queue_props.active_message_count}")
    print(f"  Dead letter messages: {queue_props.dead_letter_message_count}")

if __name__ == "__main__":
    get_dlq_count()
    print()
    monitor_dead_letter_queue()
```

### Resubmit Messages from DLQ

```python
# dlq_resubmit.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import json
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders"

def resubmit_dead_letter_messages():
    """Resubmit messages from dead letter queue to main queue"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        # Receive from DLQ
        dlq_receiver = servicebus_client.get_queue_receiver(
            queue_name=QUEUE_NAME,
            sub_queue="deadletter"
        )

        # Send to main queue
        sender = servicebus_client.get_queue_sender(queue_name=QUEUE_NAME)

        with dlq_receiver, sender:
            messages = dlq_receiver.receive_messages(max_wait_time=5)

            for message in messages:
                print(f"\nProcessing DLQ message: {message.id}")
                print(f"Original reason: {message.dead_letter_reason}")

                # Check if message can be repaired
                if can_repair_message(message):
                    # Repair message
                    repaired_data = repair_message(message)

                    # Create new message
                    new_message = ServiceBusMessage(
                        body=json.dumps(repaired_data)
                    )

                    # Send to main queue
                    sender.send_messages(new_message)
                    print(f"✓ Resubmitted repaired message")

                    # Remove from DLQ
                    dlq_receiver.complete_message(message)
                else:
                    print(f"✗ Cannot repair, keeping in DLQ")

def can_repair_message(message):
    """Check if message can be repaired"""
    # Example: Can repair validation failures, not processing errors
    return message.dead_letter_reason == "ValidationFailed"

def repair_message(message):
    """Repair message by adding missing fields"""
    body = json.loads(str(message))

    # Add missing fields with defaults
    if "customer_id" not in body:
        body["customer_id"] = "UNKNOWN"
    if "amount" not in body:
        body["amount"] = 0

    return body

def move_to_archive(archive_queue_name="orders-archive"):
    """Move dead letters to archive queue instead of resubmitting"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        dlq_receiver = servicebus_client.get_queue_receiver(
            queue_name=QUEUE_NAME,
            sub_queue="deadletter"
        )

        archive_sender = servicebus_client.get_queue_sender(
            queue_name=archive_queue_name
        )

        with dlq_receiver, archive_sender:
            messages = dlq_receiver.receive_messages(max_wait_time=5)

            for message in messages:
                # Archive with metadata
                archive_data = {
                    "original_message": str(message),
                    "dead_letter_reason": message.dead_letter_reason,
                    "dead_letter_error": message.dead_letter_error_description,
                    "delivery_count": message.delivery_count
                }

                archive_message = ServiceBusMessage(json.dumps(archive_data))
                archive_sender.send_messages(archive_message)

                dlq_receiver.complete_message(message)
                print(f"Archived message: {message.id}")

if __name__ == "__main__":
    resubmit_dead_letter_messages()
```

## Part 4: Auto-Forwarding

### Setup Auto-Forwarding

```bash
# Create source and destination queues
az servicebus queue create \
  --name orders-stage1 \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP

az servicebus queue create \
  --name orders-stage2 \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP

# Configure auto-forward from stage1 to stage2
az servicebus queue update \
  --name orders-stage1 \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --forward-to orders-stage2

# Check configuration
az servicebus queue show \
  --name orders-stage1 \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --query "{name:name, forwardTo:forwardTo}"
```

### Auto-Forward Example

```python
# auto_forward_example.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
from azure.servicebus.management import ServiceBusAdministrationClient
import json
import os
import time

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")

def setup_auto_forward_chain():
    """Setup chain of queues with auto-forwarding"""
    admin_client = ServiceBusAdministrationClient.from_connection_string(
        CONNECTION_STRING
    )

    # Create queues
    queues = ["stage1", "stage2", "stage3"]

    for queue_name in queues:
        try:
            admin_client.create_queue(queue_name)
            print(f"Created queue: {queue_name}")
        except:
            print(f"Queue exists: {queue_name}")

    # Setup auto-forwarding chain
    admin_client.update_queue("stage1", forward_to="stage2")
    admin_client.update_queue("stage2", forward_to="stage3")

    print("\nAuto-forward chain: stage1 → stage2 → stage3")

def send_to_stage1():
    """Send message to first stage"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        sender = servicebus_client.get_queue_sender(queue_name="stage1")

        with sender:
            message = ServiceBusMessage(
                json.dumps({
                    "order_id": "ORD-001",
                    "status": "received"
                })
            )

            sender.send_messages(message)
            print("\nSent message to stage1")
            print("Message will auto-forward through: stage1 → stage2 → stage3")

def receive_from_stage3():
    """Receive message from final stage"""
    time.sleep(2)  # Wait for auto-forwarding

    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        receiver = servicebus_client.get_queue_receiver(queue_name="stage3")

        with receiver:
            messages = receiver.receive_messages(max_wait_time=5)

            for message in messages:
                print(f"\nReceived at stage3: {str(message)}")
                receiver.complete_message(message)

if __name__ == "__main__":
    setup_auto_forward_chain()
    send_to_stage1()
    receive_from_stage3()
```

### Auto-Forward with Processing

```python
# auto_forward_with_processing.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import json
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")

def process_stage(stage_name, next_stage=None):
    """Process messages at a stage and forward if needed"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        receiver = servicebus_client.get_queue_receiver(queue_name=stage_name)

        with receiver:
            messages = receiver.receive_messages(max_wait_time=5)

            for message in messages:
                body = json.loads(str(message))

                print(f"\nProcessing at {stage_name}:")
                print(f"  Order: {body['order_id']}")

                # Process message
                body['processed_by'] = stage_name
                body['status'] = f'completed_{stage_name}'

                # If not using auto-forward, manually send to next stage
                if next_stage:
                    sender = servicebus_client.get_queue_sender(
                        queue_name=next_stage
                    )
                    with sender:
                        new_message = ServiceBusMessage(json.dumps(body))
                        sender.send_messages(new_message)
                        print(f"  Forwarded to {next_stage}")

                receiver.complete_message(message)

if __name__ == "__main__":
    # Process each stage
    process_stage("stage1", next_stage="stage2")
    process_stage("stage2", next_stage="stage3")
    process_stage("stage3")  # Final stage
```

## Part 5: Message Deferral

### Defer and Process Later

```python
# message_deferral.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import json
import os
import time

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders"

def send_orders_with_dependencies():
    """Send orders where some depend on others"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    orders = [
        {"order_id": "ORD-001", "depends_on": None},
        {"order_id": "ORD-002", "depends_on": "ORD-001"},  # Must wait
        {"order_id": "ORD-003", "depends_on": None},
        {"order_id": "ORD-004", "depends_on": "ORD-002"},  # Must wait
    ]

    with servicebus_client:
        sender = servicebus_client.get_queue_sender(queue_name=QUEUE_NAME)

        with sender:
            for order in orders:
                message = ServiceBusMessage(json.dumps(order))
                sender.send_messages(message)
                print(f"Sent: {order['order_id']}")

def process_with_deferral():
    """Process orders, deferring those with unmet dependencies"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    processed_orders = set()
    deferred_sequence_numbers = []

    with servicebus_client:
        receiver = servicebus_client.get_queue_receiver(queue_name=QUEUE_NAME)

        with receiver:
            # First pass
            messages = receiver.receive_messages(max_wait_time=5)

            for message in messages:
                body = json.loads(str(message))
                depends_on = body.get("depends_on")

                # Check if dependency is met
                if depends_on and depends_on not in processed_orders:
                    print(f"Deferring {body['order_id']} (waiting for {depends_on})")
                    receiver.defer_message(message)
                    deferred_sequence_numbers.append(message.sequence_number)
                else:
                    print(f"Processing {body['order_id']}")
                    processed_orders.add(body['order_id'])
                    receiver.complete_message(message)

            # Process deferred messages
            if deferred_sequence_numbers:
                print("\nProcessing deferred messages...")
                deferred_messages = receiver.receive_deferred_messages(
                    sequence_numbers=deferred_sequence_numbers
                )

                for message in deferred_messages:
                    body = json.loads(str(message))
                    print(f"Processing deferred: {body['order_id']}")
                    processed_orders.add(body['order_id'])
                    receiver.complete_message(message)

if __name__ == "__main__":
    send_orders_with_dependencies()
    time.sleep(1)
    process_with_deferral()
```

## Best Practices

### 1. Dead Letter Queue Monitoring

```python
# Monitor DLQ regularly
def monitor_dlq_metrics():
    """Alert when DLQ has messages"""
    from azure.servicebus.management import ServiceBusAdministrationClient

    admin_client = ServiceBusAdministrationClient.from_connection_string(
        CONNECTION_STRING
    )

    queue_props = admin_client.get_queue_runtime_properties(QUEUE_NAME)

    if queue_props.dead_letter_message_count > 0:
        print(f"⚠️  Alert: {queue_props.dead_letter_message_count} messages in DLQ")
        # Send alert, log, etc.
```

### 2. Proper Error Categorization

```python
# Categorize errors appropriately
try:
    process_message(message)
    receiver.complete_message(message)
except ValidationError as e:
    # Business logic error - dead letter
    receiver.dead_letter_message(message, reason="ValidationError")
except TransientError as e:
    # Temporary error - abandon to retry
    receiver.abandon_message(message)
except Exception as e:
    # Unknown error - abandon with limited retries
    if message.delivery_count >= 3:
        receiver.dead_letter_message(message, reason="MaxRetriesExceeded")
    else:
        receiver.abandon_message(message)
```

### 3. Auto-Forward Considerations

```python
# Be aware of message limits
# Total forwards per message: 4
# Don't create long chains
# stage1 → stage2 → stage3 → stage4 (OK)
# stage1 → stage2 → ... → stage10 (Too many)
```

## Cleanup

```bash
# Delete queues
for QUEUE in orders orders-stage1 orders-stage2 stage1 stage2 stage3; do
  az servicebus queue delete \
    --name $QUEUE \
    --namespace-name $NAMESPACE \
    --resource-group $RESOURCE_GROUP 2>/dev/null
done

# Delete namespace
az servicebus namespace delete \
  --name $NAMESPACE \
  --resource-group $RESOURCE_GROUP

# Delete resource group
az group delete --name $RESOURCE_GROUP --yes
```

## Key Takeaways

- ✅ Dead letter queue automatically captures failed messages
- ✅ Messages move to DLQ after max delivery count exceeded
- ✅ Manually dead letter for business logic failures
- ✅ Monitor DLQ regularly and handle appropriately
- ✅ Auto-forwarding chains queues together
- ✅ Message deferral for dependency handling
- ✅ Use peek-lock pattern for safe processing
- ✅ Categorize errors (transient vs permanent)

## Next Steps

Continue to [Tutorial 06: Azure Functions Integration](../06_functions_integration/) to learn:
- Queue Storage triggers
- Service Bus triggers
- Input and output bindings
- Batch processing
- Error handling in Functions
- Serverless message processing
