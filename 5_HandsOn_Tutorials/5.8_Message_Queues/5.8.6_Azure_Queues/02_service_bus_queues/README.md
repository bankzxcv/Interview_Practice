# Tutorial 02: Azure Service Bus Queues

## Overview

Azure Service Bus is an enterprise-grade message broker with advanced features like message sessions, duplicate detection, transactions, and dead lettering. It's designed for reliable, ordered messaging in enterprise applications.

**Key Features**:
- Message size up to 256 KB (Standard) or 1 MB (Premium)
- FIFO ordering with sessions
- Duplicate detection
- Transactions and batch operations
- Dead letter queue (automatic)
- Scheduled message delivery
- Auto-forwarding between queues

**Advantages over Queue Storage**:
- ✅ Guaranteed FIFO ordering (with sessions)
- ✅ Automatic dead lettering
- ✅ Duplicate detection
- ✅ Larger message sizes
- ✅ Advanced routing
- ✅ Support for AMQP protocol

## Architecture

```
┌─────────────┐         ┌──────────────────────────────┐         ┌──────────────┐
│  Producer   │────────>│    Service Bus Queue         │────────>│   Consumer   │
│ Application │  Send   │                              │ Receive │   Worker     │
└─────────────┘         │  - Main Queue                │         └──────────────┘
                        │    └─ Message 1 (session A)  │
                        │    └─ Message 2 (session B)  │         ┌──────────────┐
                        │    └─ Message 3 (session A)  │         │ Dead Letter  │
                        │                              │────────>│    Queue     │
                        │  - Dead Letter Queue         │         └──────────────┘
                        │    └─ Failed messages        │         (automatic)
                        └──────────────────────────────┘
```

## Prerequisites

```bash
# Install Python SDK
pip install azure-servicebus azure-identity

# Install Azure CLI
az login

# Set variables
RESOURCE_GROUP="rg-servicebus-tutorial"
LOCATION="eastus"
NAMESPACE="sb-tutorial-$(date +%s)"  # Must be globally unique
QUEUE_NAME="orders"
```

## Part 1: Service Bus Namespace Setup

### Create Service Bus Namespace

```bash
# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create Service Bus namespace (Standard tier)
az servicebus namespace create \
  --name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard

# Get connection string
az servicebus namespace authorization-rule keys list \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $NAMESPACE \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString \
  --output tsv
```

### Create Queue with Azure CLI

```bash
# Create queue with properties
az servicebus queue create \
  --name $QUEUE_NAME \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --max-size 1024 \
  --default-message-time-to-live P14D \
  --lock-duration PT1M \
  --max-delivery-count 10 \
  --enable-dead-lettering-on-message-expiration true \
  --enable-duplicate-detection true \
  --duplicate-detection-history-time-window PT10M

# List queues
az servicebus queue list \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --output table
```

### Queue Properties Explained

```yaml
max-size: 1024                    # Max queue size in MB (1-5GB)
default-message-time-to-live: P14D # 14 days TTL (ISO 8601 duration)
lock-duration: PT1M                # Message lock duration (1 minute)
max-delivery-count: 10             # Max delivery attempts before DLQ
enable-dead-lettering: true        # Auto send failed messages to DLQ
enable-duplicate-detection: true   # Detect duplicate messages
duplicate-detection-window: PT10M  # 10 minutes duplicate detection window
```

## Part 2: Basic Send and Receive

### Send Messages

```python
# producer.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import json
import os
from datetime import datetime

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders"

def send_single_message(message_data):
    """Send a single message to queue"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        logging_enable=True
    )

    with servicebus_client:
        sender = servicebus_client.get_queue_sender(queue_name=QUEUE_NAME)

        with sender:
            # Create message
            message = ServiceBusMessage(
                body=json.dumps(message_data),
                content_type="application/json",
                message_id=f"msg-{datetime.utcnow().timestamp()}",
                time_to_live=3600  # 1 hour TTL
            )

            # Add custom properties
            message.application_properties = {
                "order_type": "standard",
                "priority": "normal",
                "timestamp": datetime.utcnow().isoformat()
            }

            # Send message
            sender.send_messages(message)
            print(f"Sent message: {message.message_id}")

def send_batch_messages(messages_data):
    """Send multiple messages in a batch"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        sender = servicebus_client.get_queue_sender(queue_name=QUEUE_NAME)

        with sender:
            # Create batch
            batch = sender.create_message_batch()

            for data in messages_data:
                message = ServiceBusMessage(
                    body=json.dumps(data),
                    message_id=data.get('id', 'unknown')
                )

                try:
                    batch.add_message(message)
                except ValueError:
                    # Batch is full, send it and create new batch
                    sender.send_messages(batch)
                    print(f"Sent batch of messages")
                    batch = sender.create_message_batch()
                    batch.add_message(message)

            # Send remaining messages
            if len(batch) > 0:
                sender.send_messages(batch)
                print(f"Sent final batch of {len(batch)} messages")

def send_scheduled_message(message_data, delay_seconds=60):
    """Send a message scheduled for future delivery"""
    from datetime import timedelta

    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        sender = servicebus_client.get_queue_sender(queue_name=QUEUE_NAME)

        with sender:
            # Schedule message for future
            scheduled_time = datetime.utcnow() + timedelta(seconds=delay_seconds)

            message = ServiceBusMessage(
                body=json.dumps(message_data),
                scheduled_enqueue_time_utc=scheduled_time
            )

            # Returns sequence number
            seq_num = sender.send_messages(message)
            print(f"Scheduled message for {scheduled_time}")
            print(f"Sequence number: {seq_num}")

if __name__ == "__main__":
    # Send single message
    order = {
        "order_id": "ORD-001",
        "customer_id": "CUST-123",
        "total": 99.99,
        "items": ["item1", "item2"]
    }
    send_single_message(order)

    # Send batch
    orders = [
        {"id": f"ORD-{i:03d}", "amount": i * 10}
        for i in range(1, 11)
    ]
    send_batch_messages(orders)

    # Send scheduled message
    reminder = {"type": "reminder", "message": "Process pending orders"}
    send_scheduled_message(reminder, delay_seconds=300)  # 5 minutes
```

### Receive Messages

```python
# consumer.py
from azure.servicebus import ServiceBusClient
import json
import os
import time

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders"

def receive_messages(max_messages=10):
    """Receive messages using Peek-Lock mode"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        receiver = servicebus_client.get_queue_receiver(queue_name=QUEUE_NAME)

        with receiver:
            # Receive messages (peek-lock mode by default)
            messages = receiver.receive_messages(
                max_message_count=max_messages,
                max_wait_time=5
            )

            for message in messages:
                print(f"\n--- Message Received ---")
                print(f"Message ID: {message.message_id}")
                print(f"Sequence #: {message.sequence_number}")
                print(f"Enqueued Time: {message.enqueued_time_utc}")
                print(f"Delivery Count: {message.delivery_count}")
                print(f"Content Type: {message.content_type}")
                print(f"Body: {str(message)}")

                # Custom properties
                if message.application_properties:
                    print("Properties:")
                    for key, value in message.application_properties.items():
                        print(f"  {key}: {value}")

                # Process message
                try:
                    body = json.loads(str(message))
                    process_order(body)

                    # Complete (delete) message
                    receiver.complete_message(message)
                    print("✓ Message completed")

                except Exception as e:
                    print(f"✗ Error processing: {e}")

                    # Abandon message (returns to queue)
                    receiver.abandon_message(message)
                    print("Message abandoned, will be retried")

def receive_and_defer(max_messages=5):
    """Receive messages and defer some for later processing"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        receiver = servicebus_client.get_queue_receiver(queue_name=QUEUE_NAME)

        with receiver:
            messages = receiver.receive_messages(
                max_message_count=max_messages,
                max_wait_time=5
            )

            deferred_sequence_numbers = []

            for message in messages:
                body = json.loads(str(message))

                # Defer messages that need prerequisite processing
                if body.get('requires_preprocessing'):
                    print(f"Deferring message {message.sequence_number}")
                    receiver.defer_message(message)
                    deferred_sequence_numbers.append(message.sequence_number)
                else:
                    process_order(body)
                    receiver.complete_message(message)

            return deferred_sequence_numbers

def receive_deferred_messages(sequence_numbers):
    """Receive previously deferred messages"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        receiver = servicebus_client.get_queue_receiver(queue_name=QUEUE_NAME)

        with receiver:
            # Receive deferred messages by sequence number
            messages = receiver.receive_deferred_messages(
                sequence_numbers=sequence_numbers
            )

            for message in messages:
                print(f"Processing deferred message: {message.sequence_number}")
                body = json.loads(str(message))
                process_order(body)
                receiver.complete_message(message)

def continuous_receiver():
    """Continuously receive messages"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    print("Starting continuous receiver (Ctrl+C to stop)...")

    with servicebus_client:
        receiver = servicebus_client.get_queue_receiver(queue_name=QUEUE_NAME)

        with receiver:
            while True:
                messages = receiver.receive_messages(
                    max_message_count=10,
                    max_wait_time=5
                )

                if not messages:
                    print("No messages, waiting...")
                    time.sleep(1)
                    continue

                for message in messages:
                    try:
                        body = json.loads(str(message))
                        print(f"Processing: {body}")
                        process_order(body)
                        receiver.complete_message(message)
                    except Exception as e:
                        print(f"Error: {e}")
                        receiver.abandon_message(message)

def process_order(order_data):
    """Simulate order processing"""
    print(f"Processing order: {order_data.get('order_id', 'unknown')}")
    time.sleep(0.5)  # Simulate work

if __name__ == "__main__":
    # Receive batch of messages
    receive_messages(max_messages=10)

    # Or run continuous receiver
    # continuous_receiver()
```

## Part 3: Message Sessions (FIFO Ordering)

### Send Session Messages

```python
# session_producer.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import json
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders-with-sessions"

def create_session_queue():
    """Create queue with sessions enabled"""
    # Use Azure CLI:
    # az servicebus queue create \
    #   --name orders-with-sessions \
    #   --namespace-name $NAMESPACE \
    #   --resource-group $RESOURCE_GROUP \
    #   --enable-session true
    pass

def send_session_messages(customer_id, orders):
    """Send messages with session ID (orders for same customer)"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        sender = servicebus_client.get_queue_sender(queue_name=QUEUE_NAME)

        with sender:
            for order in orders:
                message = ServiceBusMessage(
                    body=json.dumps(order),
                    session_id=customer_id  # Messages with same session_id are FIFO
                )

                sender.send_messages(message)
                print(f"Sent order {order['order_id']} for session {customer_id}")

if __name__ == "__main__":
    # All messages for customer-1 will be processed in order
    customer1_orders = [
        {"order_id": "ORD-001", "amount": 100},
        {"order_id": "ORD-002", "amount": 200},
        {"order_id": "ORD-003", "amount": 150}
    ]
    send_session_messages("customer-1", customer1_orders)

    # Messages for customer-2 can be processed in parallel
    customer2_orders = [
        {"order_id": "ORD-004", "amount": 300},
        {"order_id": "ORD-005", "amount": 250}
    ]
    send_session_messages("customer-2", customer2_orders)
```

### Receive Session Messages

```python
# session_consumer.py
from azure.servicebus import ServiceBusClient
import json
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders-with-sessions"

def receive_session_messages(session_id=None):
    """Receive messages from a specific session or next available"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        # Get session receiver
        if session_id:
            # Receive from specific session
            receiver = servicebus_client.get_queue_receiver(
                queue_name=QUEUE_NAME,
                session_id=session_id
            )
        else:
            # Accept next available session
            receiver = servicebus_client.get_queue_receiver(
                queue_name=QUEUE_NAME,
                session_id=servicebus_client.NEXT_AVAILABLE_SESSION,
                max_wait_time=5
            )

        with receiver:
            print(f"Processing session: {receiver.session_id}")

            # Get session state
            session_state = receiver.get_session_state()
            if session_state:
                print(f"Session state: {session_state}")

            # Receive all messages from this session
            messages = receiver.receive_messages(max_wait_time=5)

            for message in messages:
                body = json.loads(str(message))
                print(f"  Order: {body['order_id']}, Amount: {body['amount']}")

                # Process and complete
                receiver.complete_message(message)

            # Update session state
            new_state = json.dumps({"last_processed": body['order_id']})
            receiver.set_session_state(new_state)
            print(f"Updated session state")

def process_all_sessions():
    """Process all available sessions"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    while True:
        try:
            with servicebus_client:
                receiver = servicebus_client.get_queue_receiver(
                    queue_name=QUEUE_NAME,
                    session_id=servicebus_client.NEXT_AVAILABLE_SESSION,
                    max_wait_time=5
                )

                with receiver:
                    print(f"\n=== Processing Session: {receiver.session_id} ===")

                    messages = receiver.receive_messages(max_wait_time=5)

                    for message in messages:
                        body = json.loads(str(message))
                        print(f"Order: {body}")
                        receiver.complete_message(message)

        except Exception as e:
            print(f"No more sessions available: {e}")
            break

if __name__ == "__main__":
    # Process specific session
    # receive_session_messages(session_id="customer-1")

    # Process all sessions
    process_all_sessions()
```

## Part 4: Dead Letter Queue

### Monitor Dead Letter Queue

```python
# dead_letter_monitor.py
from azure.servicebus import ServiceBusClient
import json
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders"

def receive_from_dead_letter():
    """Receive messages from dead letter queue"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        # Dead letter queue path
        receiver = servicebus_client.get_queue_receiver(
            queue_name=QUEUE_NAME,
            sub_queue=ServiceBusClient.SUB_QUEUE.DEAD_LETTER
        )

        with receiver:
            messages = receiver.receive_messages(max_wait_time=5)

            print(f"=== Dead Letter Queue Messages ===")

            for message in messages:
                print(f"\nMessage ID: {message.message_id}")
                print(f"Body: {str(message)}")
                print(f"Delivery Count: {message.delivery_count}")
                print(f"Dead Letter Reason: {message.dead_letter_reason}")
                print(f"Dead Letter Error: {message.dead_letter_error_description}")

                # Optionally resubmit or delete
                # receiver.complete_message(message)  # Remove from DLQ

def resubmit_from_dead_letter():
    """Resubmit messages from dead letter queue"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        receiver = servicebus_client.get_queue_receiver(
            queue_name=QUEUE_NAME,
            sub_queue=ServiceBusClient.SUB_QUEUE.DEAD_LETTER
        )

        sender = servicebus_client.get_queue_sender(queue_name=QUEUE_NAME)

        with receiver, sender:
            messages = receiver.receive_messages(max_wait_time=5)

            for message in messages:
                print(f"Resubmitting message: {message.message_id}")

                # Create new message from dead letter message
                from azure.servicebus import ServiceBusMessage
                new_message = ServiceBusMessage(
                    body=str(message),
                    message_id=message.message_id
                )

                # Send to main queue
                sender.send_messages(new_message)

                # Remove from dead letter queue
                receiver.complete_message(message)
                print(f"Resubmitted and removed from DLQ")

if __name__ == "__main__":
    receive_from_dead_letter()
    # resubmit_from_dead_letter()
```

## Part 5: Auto-Forwarding

### Setup Auto-Forwarding

```bash
# Create secondary queue
az servicebus queue create \
  --name orders-processed \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP

# Configure auto-forward from orders to orders-processed
az servicebus queue update \
  --name orders \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --forward-to orders-processed
```

### Test Auto-Forwarding

```python
# auto_forward_test.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import json
import os
import time

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")

def send_to_source_queue():
    """Send message to source queue"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        sender = servicebus_client.get_queue_sender(queue_name="orders")

        with sender:
            message = ServiceBusMessage(json.dumps({
                "order_id": "ORD-999",
                "note": "This will be auto-forwarded"
            }))

            sender.send_messages(message)
            print("Sent message to 'orders' queue")

def receive_from_destination_queue():
    """Receive from destination queue"""
    time.sleep(2)  # Wait for auto-forward

    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        receiver = servicebus_client.get_queue_receiver(
            queue_name="orders-processed"
        )

        with receiver:
            messages = receiver.receive_messages(max_wait_time=5)

            for message in messages:
                print(f"Received from 'orders-processed': {str(message)}")
                receiver.complete_message(message)

if __name__ == "__main__":
    send_to_source_queue()
    receive_from_destination_queue()
```

## Part 6: Duplicate Detection

### Enable Duplicate Detection

```python
# duplicate_detection_test.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import os
import time

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders"  # Must have duplicate detection enabled

def send_duplicate_messages():
    """Send duplicate messages - only first will be queued"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        sender = servicebus_client.get_queue_sender(queue_name=QUEUE_NAME)

        with sender:
            # Use same message_id for duplicate detection
            message_id = "unique-order-123"

            for i in range(3):
                message = ServiceBusMessage(
                    body=f"Attempt {i+1}",
                    message_id=message_id  # Same ID = duplicate
                )

                sender.send_messages(message)
                print(f"Sent message attempt {i+1} with ID {message_id}")
                time.sleep(1)

            print("\nOnly first message should be in queue (duplicates dropped)")

if __name__ == "__main__":
    send_duplicate_messages()
```

## Best Practices

### 1. Message Handling

```python
# Always use Peek-Lock mode (default)
# Complete, Abandon, or Dead-letter each message

try:
    process_message(message)
    receiver.complete_message(message)  # Success
except RetryableError as e:
    receiver.abandon_message(message)  # Will retry
except FatalError as e:
    receiver.dead_letter_message(message, reason="Fatal error")  # Move to DLQ
```

### 2. Batching

```python
# Use batches for better performance
batch = sender.create_message_batch()
for data in large_dataset:
    try:
        batch.add_message(ServiceBusMessage(data))
    except ValueError:
        sender.send_messages(batch)
        batch = sender.create_message_batch()
```

### 3. Connection Management

```python
# Reuse ServiceBusClient
servicebus_client = ServiceBusClient.from_connection_string(CONNECTION_STRING)

# Use context managers
with servicebus_client.get_queue_sender(queue_name) as sender:
    sender.send_messages(message)
```

## Cleanup

```bash
# Delete queue
az servicebus queue delete \
  --name $QUEUE_NAME \
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

- ✅ Service Bus provides enterprise messaging features
- ✅ Sessions enable FIFO ordering per session
- ✅ Dead letter queue automatically handles failures
- ✅ Duplicate detection prevents message duplication
- ✅ Auto-forwarding chains queues together
- ✅ Scheduled messages for future delivery
- ✅ Peek-Lock ensures reliable processing
- ✅ Larger messages (256 KB - 1 MB)

## Next Steps

Continue to [Tutorial 03: Service Bus Topics and Subscriptions](../03_topics_subscriptions/) to learn:
- Publish-subscribe pattern
- Multiple subscriptions per topic
- SQL filters and correlation filters
- Message routing
- Fanout pattern
