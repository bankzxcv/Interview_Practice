# Tutorial 01: Azure Queue Storage Basics

## Overview

Azure Queue Storage is a simple, cost-effective service for storing large numbers of messages. It's part of Azure Storage (alongside Blobs, Tables, and Files) and provides reliable message queuing for asynchronous processing.

**Key Features**:
- Store millions of messages (up to 500 TB total)
- Access via REST API or SDKs
- Message size up to 64 KB
- Time-to-live (TTL) configuration
- Visibility timeout for message processing
- Very low cost ($0.0004 per 10,000 operations)

**When to Use**:
- Simple task queues
- Background job processing
- Decoupling application components
- Cost-sensitive high-volume messaging

## Architecture

```
┌─────────────┐         ┌──────────────────────┐         ┌──────────────┐
│  Producer   │────────>│  Azure Queue Storage │────────>│   Consumer   │
│ Application │  Send   │                      │ Receive │   Worker     │
└─────────────┘         │  - myqueue           │         └──────────────┘
                        │    └─ Message 1      │
                        │    └─ Message 2      │              │
                        │    └─ Message 3      │              │
                        └──────────────────────┘              │
                                                              │
                        ┌──────────────────────┐              │
                        │   Poison Queue       │<─────────────┘
                        │  (failed messages)   │   On failure
                        └──────────────────────┘
```

## Prerequisites

```bash
# Install Python SDK
pip install azure-storage-queue azure-identity

# Install Azurite for local development
npm install -g azurite

# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az login
```

## Part 1: Local Development with Azurite

### Start Azurite

```bash
# Create directory for Azurite data
mkdir -p /tmp/azurite

# Start Azurite queue service
azurite-queue --location /tmp/azurite --debug /tmp/azurite/debug.log

# Azurite will run on:
# - Queue service: http://127.0.0.1:10001
```

### Python: Connect to Azurite

```python
# local_queue_test.py
from azure.storage.queue import QueueClient
import json
from datetime import datetime

# Azurite connection string
AZURITE_CONNECTION_STRING = (
    "DefaultEndpointsProtocol=http;"
    "AccountName=devstoreaccount1;"
    "AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;"
    "QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;"
)

def create_queue_client(queue_name):
    """Create a queue client for Azurite"""
    return QueueClient.from_connection_string(
        conn_str=AZURITE_CONNECTION_STRING,
        queue_name=queue_name
    )

def test_queue_operations():
    """Test basic queue operations with Azurite"""
    queue_name = "test-queue"
    queue_client = create_queue_client(queue_name)

    # Create queue
    print(f"Creating queue: {queue_name}")
    queue_client.create_queue()

    # Send message
    message = {
        "task": "process_image",
        "image_id": "12345",
        "timestamp": datetime.utcnow().isoformat()
    }

    print(f"Sending message: {message}")
    queue_client.send_message(json.dumps(message))

    # Receive message
    print("Receiving messages...")
    messages = queue_client.receive_messages(messages_per_page=1)

    for msg in messages:
        print(f"Message ID: {msg.id}")
        print(f"Content: {msg.content}")
        print(f"Dequeue count: {msg.dequeue_count}")

        # Delete message after processing
        queue_client.delete_message(msg)
        print("Message deleted")

    # Clean up
    queue_client.delete_queue()
    print("Queue deleted")

if __name__ == "__main__":
    test_queue_operations()
```

Run the test:

```bash
python local_queue_test.py
```

## Part 2: Azure Cloud Setup

### Create Storage Account

```bash
# Variables
RESOURCE_GROUP="rg-queue-tutorial"
LOCATION="eastus"
STORAGE_ACCOUNT="stqueue$(date +%s)"  # Must be globally unique

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Get connection string
az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --output tsv
```

### Create Queue

```bash
# Using Azure CLI
QUEUE_NAME="tasks"

az storage queue create \
  --name $QUEUE_NAME \
  --account-name $STORAGE_ACCOUNT

# List queues
az storage queue list \
  --account-name $STORAGE_ACCOUNT \
  --output table
```

## Part 3: Basic Message Operations

### Send Messages

```python
# producer.py
from azure.storage.queue import QueueClient
import json
import os
from datetime import datetime

# Get connection string from environment
CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

def send_message(queue_name, message_data):
    """Send a message to the queue"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    # Ensure queue exists
    queue_client.create_queue()

    # Send message
    message = json.dumps(message_data)
    response = queue_client.send_message(message)

    print(f"Message sent:")
    print(f"  Message ID: {response.id}")
    print(f"  Insertion time: {response.insertion_time}")
    print(f"  Expiration time: {response.expiration_time}")

    return response

def send_multiple_messages(queue_name, count=10):
    """Send multiple messages"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    queue_client.create_queue()

    for i in range(count):
        message = {
            "id": i,
            "task": "process_data",
            "data": f"item_{i}",
            "timestamp": datetime.utcnow().isoformat()
        }

        queue_client.send_message(json.dumps(message))
        print(f"Sent message {i+1}/{count}")

    print(f"\nSent {count} messages to queue '{queue_name}'")

if __name__ == "__main__":
    # Send single message
    message_data = {
        "task": "resize_image",
        "image_url": "https://example.com/image.jpg",
        "width": 800,
        "height": 600
    }

    send_message("tasks", message_data)

    # Send multiple messages
    send_multiple_messages("tasks", 10)
```

### Receive Messages

```python
# consumer.py
from azure.storage.queue import QueueClient
import json
import os
import time

CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

def receive_messages(queue_name, max_messages=1):
    """Receive messages from queue"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    print(f"Receiving messages from '{queue_name}'...")

    # Receive messages (they become invisible to other consumers)
    messages = queue_client.receive_messages(
        messages_per_page=max_messages,
        visibility_timeout=30  # Message invisible for 30 seconds
    )

    for message in messages:
        print(f"\n--- Message Received ---")
        print(f"Message ID: {message.id}")
        print(f"Insertion Time: {message.insertion_time}")
        print(f"Expiration Time: {message.expiration_time}")
        print(f"Dequeue Count: {message.dequeue_count}")
        print(f"Content: {message.content}")

        # Process message
        try:
            data = json.loads(message.content)
            process_message(data)

            # Delete message after successful processing
            queue_client.delete_message(message)
            print("Message processed and deleted")

        except Exception as e:
            print(f"Error processing message: {e}")
            # Message will become visible again after timeout

def process_message(data):
    """Simulate message processing"""
    print(f"Processing: {data.get('task', 'unknown')}")
    time.sleep(1)  # Simulate work

def continuous_consumer(queue_name, poll_interval=5):
    """Continuously poll for messages"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    print(f"Starting continuous consumer for '{queue_name}'")
    print(f"Poll interval: {poll_interval} seconds")
    print("Press Ctrl+C to stop\n")

    try:
        while True:
            messages = queue_client.receive_messages(
                messages_per_page=5,
                visibility_timeout=60
            )

            message_count = 0
            for message in messages:
                message_count += 1
                try:
                    data = json.loads(message.content)
                    print(f"Processing: {data}")
                    process_message(data)
                    queue_client.delete_message(message)
                except Exception as e:
                    print(f"Error: {e}")

            if message_count == 0:
                print("No messages, waiting...")

            time.sleep(poll_interval)

    except KeyboardInterrupt:
        print("\nConsumer stopped")

if __name__ == "__main__":
    # Receive single batch
    receive_messages("tasks", max_messages=5)

    # Or run continuous consumer
    # continuous_consumer("tasks")
```

## Part 4: Message TTL and Visibility

### Set Message Time-to-Live

```python
# ttl_example.py
from azure.storage.queue import QueueClient
import os
from datetime import timedelta

CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

def send_with_ttl(queue_name, message, ttl_seconds=60):
    """Send message with custom TTL"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    queue_client.create_queue()

    # Send message with TTL
    response = queue_client.send_message(
        content=message,
        time_to_live=ttl_seconds  # Message expires after this time
    )

    print(f"Message sent with {ttl_seconds}s TTL")
    print(f"Expiration time: {response.expiration_time}")

def send_with_visibility_timeout(queue_name, message, visibility_timeout=10):
    """Send message with initial visibility timeout"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    queue_client.create_queue()

    # Send message with visibility timeout
    response = queue_client.send_message(
        content=message,
        visibility_timeout=visibility_timeout  # Message invisible initially
    )

    print(f"Message sent, invisible for {visibility_timeout}s")
    print(f"Message ID: {response.id}")

if __name__ == "__main__":
    # Message expires after 60 seconds
    send_with_ttl("tasks", "Short-lived task", ttl_seconds=60)

    # Message invisible for 10 seconds after sending
    send_with_visibility_timeout("tasks", "Delayed task", visibility_timeout=10)
```

### Update Message Visibility

```python
# visibility_update.py
from azure.storage.queue import QueueClient
import os
import time

CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

def extend_processing_time(queue_name):
    """Extend message visibility while processing"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    messages = queue_client.receive_messages(
        messages_per_page=1,
        visibility_timeout=30
    )

    for message in messages:
        print(f"Processing message: {message.id}")

        # Start long-running task
        for i in range(5):
            print(f"  Step {i+1}/5...")
            time.sleep(10)

            # Extend visibility timeout
            updated = queue_client.update_message(
                message=message,
                visibility_timeout=30  # Extend for another 30 seconds
            )
            print(f"  Visibility extended until: {updated.next_visible_on}")

        # Complete processing and delete
        queue_client.delete_message(message)
        print("Message completed and deleted")

if __name__ == "__main__":
    extend_processing_time("tasks")
```

## Part 5: Peek and Queue Metadata

### Peek Messages (Without Receiving)

```python
# peek_example.py
from azure.storage.queue import QueueClient
import os

CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

def peek_messages(queue_name, max_messages=5):
    """Peek at messages without making them invisible"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    print(f"Peeking at messages in '{queue_name}'...")

    # Peek doesn't change message visibility
    peeked_messages = queue_client.peek_messages(max_messages=max_messages)

    for i, message in enumerate(peeked_messages, 1):
        print(f"\n--- Peeked Message {i} ---")
        print(f"Message ID: {message.id}")
        print(f"Insertion Time: {message.insertion_time}")
        print(f"Expiration Time: {message.expiration_time}")
        print(f"Dequeue Count: {message.dequeue_count}")
        print(f"Content: {message.content}")

def get_queue_properties(queue_name):
    """Get queue metadata and properties"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    properties = queue_client.get_queue_properties()

    print(f"\n=== Queue Properties: {queue_name} ===")
    print(f"Approximate message count: {properties.approximate_message_count}")

    # Get metadata if any
    if properties.metadata:
        print("Metadata:")
        for key, value in properties.metadata.items():
            print(f"  {key}: {value}")

def set_queue_metadata(queue_name):
    """Set custom metadata on queue"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    # Set metadata
    metadata = {
        'purpose': 'image-processing',
        'environment': 'production',
        'owner': 'data-team'
    }

    queue_client.set_queue_metadata(metadata=metadata)
    print(f"Metadata set on queue '{queue_name}'")

    # Verify
    properties = queue_client.get_queue_properties()
    print("Current metadata:")
    for key, value in properties.metadata.items():
        print(f"  {key}: {value}")

if __name__ == "__main__":
    queue_name = "tasks"

    # Peek at messages
    peek_messages(queue_name)

    # Get properties
    get_queue_properties(queue_name)

    # Set metadata
    set_queue_metadata(queue_name)
```

## Part 6: Error Handling and Poison Messages

### Handle Failed Messages

```python
# poison_queue_handler.py
from azure.storage.queue import QueueClient
import json
import os

CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
MAX_DEQUEUE_COUNT = 3

def process_with_poison_queue(queue_name, poison_queue_name="poison-messages"):
    """Process messages with poison queue for failures"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    poison_queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=poison_queue_name
    )

    # Ensure poison queue exists
    poison_queue_client.create_queue()

    messages = queue_client.receive_messages(
        messages_per_page=10,
        visibility_timeout=60
    )

    for message in messages:
        # Check dequeue count
        if message.dequeue_count >= MAX_DEQUEUE_COUNT:
            print(f"Message {message.id} exceeded max retries, moving to poison queue")

            # Move to poison queue
            poison_data = {
                'original_message': message.content,
                'message_id': message.id,
                'dequeue_count': message.dequeue_count,
                'error': 'Exceeded max retry count'
            }
            poison_queue_client.send_message(json.dumps(poison_data))

            # Delete from main queue
            queue_client.delete_message(message)
            continue

        # Try to process
        try:
            data = json.loads(message.content)
            process_task(data)

            # Success - delete message
            queue_client.delete_message(message)
            print(f"Successfully processed message {message.id}")

        except Exception as e:
            print(f"Error processing message {message.id}: {e}")
            # Message will reappear after visibility timeout
            # Dequeue count will increment

def process_task(data):
    """Simulate task processing that might fail"""
    task_type = data.get('task')

    # Simulate failure for specific task types
    if task_type == 'failing_task':
        raise Exception("Task processing failed")

    print(f"Processing task: {task_type}")

def review_poison_queue(poison_queue_name="poison-messages"):
    """Review and handle poison messages"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=poison_queue_name
    )

    print(f"\n=== Poison Queue Review ===")

    messages = queue_client.peek_messages(max_messages=32)

    for message in messages:
        data = json.loads(message.content)
        print(f"\nPoison Message ID: {message.id}")
        print(f"Original content: {data['original_message']}")
        print(f"Dequeue count: {data['dequeue_count']}")
        print(f"Error: {data['error']}")

if __name__ == "__main__":
    process_with_poison_queue("tasks")
    review_poison_queue()
```

## Part 7: Batch Operations

### Batch Send and Receive

```python
# batch_operations.py
from azure.storage.queue import QueueClient
import json
import os
import time

CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

def batch_send(queue_name, messages_count=100):
    """Send messages in batches"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    queue_client.create_queue()

    start_time = time.time()

    for i in range(messages_count):
        message = {
            'id': i,
            'task': 'batch_process',
            'data': f'item_{i}'
        }
        queue_client.send_message(json.dumps(message))

    elapsed = time.time() - start_time
    print(f"Sent {messages_count} messages in {elapsed:.2f} seconds")
    print(f"Rate: {messages_count/elapsed:.2f} msg/sec")

def batch_receive(queue_name, batch_size=32):
    """Receive and process messages in batches"""
    queue_client = QueueClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        queue_name=queue_name
    )

    total_processed = 0
    start_time = time.time()

    while True:
        messages = queue_client.receive_messages(
            messages_per_page=batch_size,
            visibility_timeout=60
        )

        batch_count = 0
        for message in messages:
            # Process message
            data = json.loads(message.content)
            # Simulate processing

            # Delete message
            queue_client.delete_message(message)
            batch_count += 1
            total_processed += 1

        if batch_count == 0:
            break

        print(f"Processed batch of {batch_count} messages")

    elapsed = time.time() - start_time
    if total_processed > 0:
        print(f"\nProcessed {total_processed} messages in {elapsed:.2f} seconds")
        print(f"Rate: {total_processed/elapsed:.2f} msg/sec")

if __name__ == "__main__":
    queue_name = "batch-test"

    # Send batch
    batch_send(queue_name, 100)

    # Receive batch
    batch_receive(queue_name, batch_size=32)
```

## Best Practices

### 1. Connection Management

```python
# Use context manager for automatic cleanup
with QueueClient.from_connection_string(CONNECTION_STRING, "myqueue") as queue_client:
    queue_client.send_message("Hello")

# Reuse client instances
queue_client = QueueClient.from_connection_string(CONNECTION_STRING, "myqueue")
# Use queue_client for multiple operations
```

### 2. Message Design

```python
# Good: Small, structured message
message = {
    'type': 'resize_image',
    'blob_url': 'https://storage.../image.jpg',
    'params': {'width': 800, 'height': 600}
}

# Bad: Large payload (max 64KB)
# Don't embed large data in messages
```

### 3. Error Handling

```python
from azure.core.exceptions import ResourceNotFoundError, ResourceExistsError

try:
    queue_client.create_queue()
except ResourceExistsError:
    print("Queue already exists")

try:
    message = queue_client.receive_message()
except ResourceNotFoundError:
    print("Queue not found")
```

### 4. Monitoring

```bash
# Check queue length
az storage queue metadata show \
  --name tasks \
  --account-name $STORAGE_ACCOUNT \
  --query approximateMessageCount
```

## Cleanup

```bash
# Delete queue
az storage queue delete \
  --name tasks \
  --account-name $STORAGE_ACCOUNT

# Delete storage account
az storage account delete \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --yes

# Delete resource group
az group delete \
  --name $RESOURCE_GROUP \
  --yes
```

## Key Takeaways

- ✅ Azure Queue Storage is simple and cost-effective
- ✅ Use Azurite for local development
- ✅ Messages have TTL and visibility timeout
- ✅ Implement poison queue for failed messages
- ✅ Peek doesn't affect message visibility
- ✅ Max message size is 64 KB
- ✅ Connection string contains credentials
- ✅ Consider Service Bus for advanced features

## Next Steps

Continue to [Tutorial 02: Azure Service Bus Queues](../02_service_bus_queues/) to learn:
- Enterprise messaging features
- Message sessions and ordering
- Dead letter queues
- Duplicate detection
- Larger message sizes (up to 1 MB)
