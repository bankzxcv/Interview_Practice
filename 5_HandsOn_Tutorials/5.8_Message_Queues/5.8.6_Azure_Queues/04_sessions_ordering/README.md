# Tutorial 04: Message Sessions and Ordering

## Overview

Message sessions in Azure Service Bus provide FIFO (First-In-First-Out) ordering guarantees and enable stateful processing of related messages. Sessions are essential when you need guaranteed message order within a group of messages.

**Key Features**:
- **FIFO Ordering**: Messages with the same session ID are delivered in order
- **Session State**: Store state associated with a session
- **Concurrent Processing**: Different sessions can be processed in parallel
- **Single Consumer per Session**: Only one receiver processes a session at a time

**Use Cases**:
- Order processing per customer
- Chat messages per room
- Document processing per user
- Financial transactions per account
- Workflow steps per instance

## Architecture

```
┌──────────────┐                         ┌────────────────────────────┐
│   Producer   │                         │  Service Bus Queue         │
│              │                         │  (Sessions Enabled)        │
└──────┬───────┘                         └────────────┬───────────────┘
       │                                              │
       │ Session A (Customer 1)                       │ Session A
       │  └─ Message 1 ───────────────────────────> ├─ Message 1
       │  └─ Message 2 ───────────────────────────> ├─ Message 2  ──> Consumer 1
       │  └─ Message 3 ───────────────────────────> └─ Message 3  (processes A)
       │
       │ Session B (Customer 2)                       │ Session B
       │  └─ Message 1 ───────────────────────────> ├─ Message 1
       │  └─ Message 2 ───────────────────────────> └─ Message 2  ──> Consumer 2
       │                                                             (processes B)
       │ Session C (Customer 3)                       │ Session C
       └─  └─ Message 1 ───────────────────────────> └─ Message 1  ──> Consumer 3
                                                                      (processes C)
```

## Prerequisites

```bash
# Install Python SDK
pip install azure-servicebus azure-identity

# Azure CLI
az login

# Variables
RESOURCE_GROUP="rg-sessions-tutorial"
LOCATION="eastus"
NAMESPACE="sb-sessions-$(date +%s)"
QUEUE_NAME="orders-per-customer"
```

## Part 1: Session-Enabled Queue Setup

### Create Queue with Sessions

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

# Create queue with sessions enabled
az servicebus queue create \
  --name $QUEUE_NAME \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --enable-session true \
  --lock-duration PT5M \
  --max-delivery-count 10

# Verify queue properties
az servicebus queue show \
  --name $QUEUE_NAME \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --query "{name:name, requiresSession:requiresSession}"
```

### Using Management SDK

```python
# create_session_queue.py
from azure.servicebus.management import (
    ServiceBusAdministrationClient,
    QueueProperties
)
import os

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")

def create_session_queue(queue_name):
    """Create a queue with sessions enabled"""
    admin_client = ServiceBusAdministrationClient.from_connection_string(
        CONNECTION_STRING
    )

    queue_properties = QueueProperties(
        requires_session=True,
        lock_duration="PT5M",  # 5 minutes lock duration
        max_delivery_count=10,
        default_message_time_to_live="P14D",  # 14 days
        enable_dead_lettering_on_message_expiration=True
    )

    try:
        queue = admin_client.create_queue(queue_name, queue=queue_properties)
        print(f"Created session queue: {queue.name}")
        print(f"  Requires session: {queue.requires_session}")
        print(f"  Lock duration: {queue.lock_duration}")
    except Exception as e:
        print(f"Queue already exists or error: {e}")

if __name__ == "__main__":
    create_session_queue("orders-per-customer")
```

## Part 2: Send Session Messages

### Send Messages with Session ID

```python
# session_producer.py
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import json
import os
from datetime import datetime

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders-per-customer"

def send_customer_orders(customer_id, orders):
    """Send orders for a specific customer (same session)"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        sender = servicebus_client.get_queue_sender(queue_name=QUEUE_NAME)

        with sender:
            print(f"\nSending orders for session: {customer_id}")

            for i, order in enumerate(orders, 1):
                # Create message with session ID
                message = ServiceBusMessage(
                    body=json.dumps(order),
                    session_id=customer_id,  # All messages for this customer
                    message_id=f"{customer_id}-{order['order_id']}"
                )

                message.application_properties = {
                    "customer_id": customer_id,
                    "order_sequence": i,
                    "timestamp": datetime.utcnow().isoformat()
                }

                sender.send_messages(message)
                print(f"  ✓ Sent order {i}/{len(orders)}: {order['order_id']}")

def send_multiple_customer_orders():
    """Send orders for multiple customers"""
    # Customer 1 orders
    customer1_orders = [
        {"order_id": "ORD-001", "product": "Laptop", "amount": 1200},
        {"order_id": "ORD-002", "product": "Mouse", "amount": 25},
        {"order_id": "ORD-003", "product": "Keyboard", "amount": 75}
    ]

    # Customer 2 orders
    customer2_orders = [
        {"order_id": "ORD-004", "product": "Monitor", "amount": 400},
        {"order_id": "ORD-005", "product": "Webcam", "amount": 80}
    ]

    # Customer 3 orders
    customer3_orders = [
        {"order_id": "ORD-006", "product": "Headphones", "amount": 150},
        {"order_id": "ORD-007", "product": "Microphone", "amount": 100},
        {"order_id": "ORD-008", "product": "Speakers", "amount": 200},
        {"order_id": "ORD-009", "product": "Desk", "amount": 500}
    ]

    # Send orders for each customer
    send_customer_orders("customer-1", customer1_orders)
    send_customer_orders("customer-2", customer2_orders)
    send_customer_orders("customer-3", customer3_orders)

    print("\n✓ All orders sent")
    print("  - Each customer's orders will be processed in order")
    print("  - Different customers can be processed in parallel")

if __name__ == "__main__":
    send_multiple_customer_orders()
```

## Part 3: Receive Session Messages

### Process Specific Session

```python
# session_consumer_specific.py
from azure.servicebus import ServiceBusClient
import json
import os
import time

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders-per-customer"

def process_customer_session(customer_id):
    """Process all orders for a specific customer (session)"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    print(f"\n=== Processing Session: {customer_id} ===")

    with servicebus_client:
        # Get receiver for specific session
        receiver = servicebus_client.get_queue_receiver(
            queue_name=QUEUE_NAME,
            session_id=customer_id,  # Specify exact session
            max_wait_time=5
        )

        with receiver:
            print(f"Locked session: {receiver.session_id}")

            # Get session state
            session_state = receiver.get_session_state()
            if session_state:
                state_data = json.loads(session_state)
                print(f"Session state: {state_data}")
            else:
                print("No previous session state")

            # Process all messages in session
            messages = receiver.receive_messages(max_wait_time=5)

            total_amount = 0
            order_count = 0

            for message in messages:
                body = json.loads(str(message))
                props = message.application_properties

                print(f"\n  Order #{props['order_sequence']}")
                print(f"    Order ID: {body['order_id']}")
                print(f"    Product: {body['product']}")
                print(f"    Amount: ${body['amount']}")

                # Process order
                process_order(body)

                # Update totals
                total_amount += body['amount']
                order_count += 1

                # Complete message
                receiver.complete_message(message)

            # Save session state
            session_state_data = {
                "total_amount": total_amount,
                "order_count": order_count,
                "last_processed": datetime.utcnow().isoformat()
            }

            receiver.set_session_state(json.dumps(session_state_data))
            print(f"\n✓ Session complete:")
            print(f"  Orders processed: {order_count}")
            print(f"  Total amount: ${total_amount}")

def process_order(order_data):
    """Simulate order processing"""
    time.sleep(0.1)  # Simulate work

if __name__ == "__main__":
    # Process specific customer's orders
    process_customer_session("customer-1")
```

### Process Next Available Session

```python
# session_consumer_next.py
from azure.servicebus import ServiceBusClient, NEXT_AVAILABLE_SESSION
import json
import os
import time

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders-per-customer"

def process_next_available_session():
    """Process next available session (any customer)"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    print("Waiting for next available session...")

    with servicebus_client:
        # Accept next available session
        receiver = servicebus_client.get_queue_receiver(
            queue_name=QUEUE_NAME,
            session_id=NEXT_AVAILABLE_SESSION,  # Get any available session
            max_wait_time=10
        )

        with receiver:
            session_id = receiver.session_id
            print(f"\n=== Accepted Session: {session_id} ===")

            # Process messages
            messages = receiver.receive_messages(max_wait_time=5)

            for message in messages:
                body = json.loads(str(message))
                print(f"  Processing: {body['order_id']}")
                receiver.complete_message(message)

            print(f"✓ Session {session_id} complete")

def continuous_session_processor():
    """Continuously process sessions as they become available"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    print("Starting continuous session processor (Ctrl+C to stop)...")
    print("Will process sessions as they become available\n")

    try:
        while True:
            try:
                with servicebus_client:
                    receiver = servicebus_client.get_queue_receiver(
                        queue_name=QUEUE_NAME,
                        session_id=NEXT_AVAILABLE_SESSION,
                        max_wait_time=5
                    )

                    with receiver:
                        session_id = receiver.session_id
                        print(f"\n📦 Processing session: {session_id}")

                        messages = receiver.receive_messages(max_wait_time=5)

                        for message in messages:
                            body = json.loads(str(message))
                            print(f"  ✓ {body['order_id']}")
                            receiver.complete_message(message)

                        print(f"✓ Completed session: {session_id}")

            except Exception as e:
                print(f"No sessions available, waiting...")
                time.sleep(2)

    except KeyboardInterrupt:
        print("\nStopped processor")

if __name__ == "__main__":
    # Process one session
    # process_next_available_session()

    # Or run continuous processor
    continuous_session_processor()
```

## Part 4: Parallel Session Processing

### Multiple Concurrent Workers

```python
# parallel_session_workers.py
from azure.servicebus import ServiceBusClient, NEXT_AVAILABLE_SESSION
import json
import os
import time
import threading
from datetime import datetime

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders-per-customer"

def session_worker(worker_id, duration=30):
    """Worker that processes sessions for specified duration"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    start_time = time.time()
    sessions_processed = 0

    print(f"[Worker {worker_id}] Started")

    while time.time() - start_time < duration:
        try:
            with servicebus_client:
                receiver = servicebus_client.get_queue_receiver(
                    queue_name=QUEUE_NAME,
                    session_id=NEXT_AVAILABLE_SESSION,
                    max_wait_time=5
                )

                with receiver:
                    session_id = receiver.session_id
                    print(f"[Worker {worker_id}] Processing session: {session_id}")

                    messages = receiver.receive_messages(max_wait_time=5)
                    message_count = 0

                    for message in messages:
                        body = json.loads(str(message))
                        # Simulate processing
                        time.sleep(0.5)
                        receiver.complete_message(message)
                        message_count += 1

                    sessions_processed += 1
                    print(f"[Worker {worker_id}] ✓ Session {session_id} complete ({message_count} messages)")

        except Exception as e:
            # No sessions available
            time.sleep(1)

    print(f"[Worker {worker_id}] Finished - processed {sessions_processed} sessions")

def run_parallel_workers(num_workers=3, duration=30):
    """Run multiple session workers in parallel"""
    print(f"Starting {num_workers} parallel workers for {duration} seconds...\n")

    threads = []

    for i in range(num_workers):
        thread = threading.Thread(
            target=session_worker,
            args=(i+1, duration)
        )
        thread.start()
        threads.append(thread)

    # Wait for all workers to complete
    for thread in threads:
        thread.join()

    print("\nAll workers finished")

if __name__ == "__main__":
    run_parallel_workers(num_workers=3, duration=30)
```

## Part 5: Session State Management

### Advanced Session State

```python
# session_state_management.py
from azure.servicebus import ServiceBusClient, NEXT_AVAILABLE_SESSION
import json
import os
from datetime import datetime

CONNECTION_STRING = os.getenv("AZURE_SERVICEBUS_CONNECTION_STRING")
QUEUE_NAME = "orders-per-customer"

class SessionStateManager:
    """Manage session state for order processing"""

    def __init__(self, receiver):
        self.receiver = receiver
        self.session_id = receiver.session_id
        self.state = self._load_state()

    def _load_state(self):
        """Load existing session state"""
        state_data = self.receiver.get_session_state()

        if state_data:
            return json.loads(state_data)
        else:
            # Initialize new state
            return {
                "session_id": self.session_id,
                "created_at": datetime.utcnow().isoformat(),
                "orders_processed": 0,
                "total_amount": 0,
                "items": [],
                "status": "processing"
            }

    def save_state(self):
        """Save current state"""
        self.state["updated_at"] = datetime.utcnow().isoformat()
        self.receiver.set_session_state(json.dumps(self.state))

    def process_order(self, order_data):
        """Process order and update state"""
        self.state["orders_processed"] += 1
        self.state["total_amount"] += order_data.get("amount", 0)
        self.state["items"].append(order_data.get("product"))

    def complete_session(self):
        """Mark session as complete"""
        self.state["status"] = "completed"
        self.state["completed_at"] = datetime.utcnow().isoformat()
        self.save_state()

def process_session_with_state():
    """Process session using state manager"""
    servicebus_client = ServiceBusClient.from_connection_string(
        conn_str=CONNECTION_STRING
    )

    with servicebus_client:
        receiver = servicebus_client.get_queue_receiver(
            queue_name=QUEUE_NAME,
            session_id=NEXT_AVAILABLE_SESSION,
            max_wait_time=10
        )

        with receiver:
            # Initialize state manager
            state_mgr = SessionStateManager(receiver)

            print(f"Processing session: {state_mgr.session_id}")
            print(f"Previous state: {state_mgr.state}")

            # Process messages
            messages = receiver.receive_messages(max_wait_time=5)

            for message in messages:
                body = json.loads(str(message))

                # Process and update state
                state_mgr.process_order(body)

                # Save state periodically
                state_mgr.save_state()

                # Complete message
                receiver.complete_message(message)

                print(f"Processed: {body['order_id']}")

            # Mark session complete
            state_mgr.complete_session()

            print(f"\nFinal state:")
            print(f"  Orders: {state_mgr.state['orders_processed']}")
            print(f"  Total: ${state_mgr.state['total_amount']}")
            print(f"  Items: {state_mgr.state['items']}")

if __name__ == "__main__":
    process_session_with_state()
```

## Part 6: Partitioned Queues vs Sessions

### Comparison

```python
# partitioned_vs_sessions.py

"""
PARTITIONED QUEUES:
- Multiple partitions for parallelism
- No ordering guarantees
- Higher throughput
- Use for: High volume, order doesn't matter

az servicebus queue create \
  --name high-throughput-queue \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --enable-partitioning true

SESSION QUEUES:
- FIFO ordering per session
- Parallel processing across sessions
- Stateful processing
- Use for: Order matters within groups

az servicebus queue create \
  --name ordered-queue \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --enable-session true
"""

# Partitioned Queue (high throughput, no order)
def send_to_partitioned_queue():
    """High throughput, messages can arrive in any order"""
    # Messages distributed across partitions
    # Faster, but no ordering
    pass

# Session Queue (ordered per session)
def send_to_session_queue():
    """FIFO per session, multiple sessions in parallel"""
    # Messages with same session_id are ordered
    # Different sessions can process concurrently
    pass
```

## Best Practices

### 1. Session ID Design

```python
# Good session IDs
session_id = f"customer-{customer_id}"
session_id = f"order-{order_id}"
session_id = f"conversation-{room_id}"

# Bad: Too granular (one message per session)
session_id = f"message-{unique_id}"

# Bad: Too broad (all messages in one session)
session_id = "default"
```

### 2. Session Duration

```python
# Keep sessions short
# Long-running sessions block other consumers

# Process and complete quickly
with receiver:
    messages = receiver.receive_messages(max_wait_time=5)
    for message in messages:
        process_quickly(message)  # Don't take hours
        receiver.complete_message(message)
```

### 3. Error Handling

```python
# Abandon failed messages to retry
try:
    process_message(message)
    receiver.complete_message(message)
except RetryableError:
    receiver.abandon_message(message)  # Retry in same session
except FatalError:
    receiver.dead_letter_message(message)  # Don't block session
```

### 4. State Management

```python
# Save state frequently
for message in messages:
    process(message)
    update_state()
    save_state()  # Save after each message
    complete_message(message)
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

- ✅ Sessions provide FIFO ordering per session ID
- ✅ Different sessions can process in parallel
- ✅ Only one consumer processes a session at a time
- ✅ Session state enables stateful processing
- ✅ Use sessions when order matters within a group
- ✅ Use partitioning for high throughput without ordering
- ✅ Keep session processing duration short
- ✅ Save state frequently during processing

## Next Steps

Continue to [Tutorial 05: Dead Lettering and Auto-Forwarding](../05_dead_lettering/) to learn:
- Dead letter queue configuration
- Auto-forwarding between queues
- Message deferral patterns
- Peek-lock best practices
- Monitoring and recovering failed messages
