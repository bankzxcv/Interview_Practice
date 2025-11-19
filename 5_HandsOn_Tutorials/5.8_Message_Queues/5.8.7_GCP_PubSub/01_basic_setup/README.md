# Tutorial 01: Basic Pub/Sub Setup and Publishing

## Overview

This tutorial covers the fundamentals of Google Cloud Pub/Sub, including setting up your development environment, creating topics, and publishing messages. You'll learn how to authenticate with GCP, use the Python client library, work with message attributes, and leverage the Pub/Sub emulator for local development.

## Prerequisites

- Python 3.7 or higher
- Google Cloud account with billing enabled
- `gcloud` CLI installed
- Basic understanding of Python and cloud concepts

## Learning Objectives

By the end of this tutorial, you will be able to:

1. Set up a GCP project and configure authentication
2. Create and manage Pub/Sub topics
3. Publish single and batch messages using Python
4. Work with message attributes and metadata
5. Use the Pub/Sub emulator for local development
6. Understand message publishing best practices

## Table of Contents

1. [GCP Project Setup](#gcp-project-setup)
2. [Authentication Configuration](#authentication-configuration)
3. [Installing Dependencies](#installing-dependencies)
4. [Creating Topics](#creating-topics)
5. [Publishing Messages](#publishing-messages)
6. [Message Attributes](#message-attributes)
7. [Batch Publishing](#batch-publishing)
8. [Pub/Sub Emulator](#pubsub-emulator)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## GCP Project Setup

### Step 1: Create a GCP Project

```bash
# Set variables
PROJECT_ID="my-pubsub-project-$(date +%s)"
PROJECT_NAME="PubSub Tutorial"

# Create project
gcloud projects create $PROJECT_ID --name="$PROJECT_NAME"

# Set as active project
gcloud config set project $PROJECT_ID

# Verify
gcloud config get-value project
```

### Step 2: Enable Billing

```bash
# List billing accounts
gcloud billing accounts list

# Link billing account to project
BILLING_ACCOUNT_ID="YOUR_BILLING_ACCOUNT_ID"
gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID
```

### Step 3: Enable Pub/Sub API

```bash
# Enable the Pub/Sub API
gcloud services enable pubsub.googleapis.com

# Verify API is enabled
gcloud services list --enabled | grep pubsub
```

## Authentication Configuration

### Option 1: Service Account (Recommended for Production)

```bash
# Create a service account
SERVICE_ACCOUNT_NAME="pubsub-tutorial-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --display-name="Pub/Sub Tutorial Service Account"

# Grant Pub/Sub Publisher role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/pubsub.publisher"

# Grant Pub/Sub Subscriber role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/pubsub.subscriber"

# Grant Pub/Sub Admin role (for creating topics/subscriptions)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/pubsub.admin"

# Create and download service account key
gcloud iam service-accounts keys create ~/pubsub-key.json \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/pubsub-key.json"

# Add to your shell profile
echo 'export GOOGLE_APPLICATION_CREDENTIALS="$HOME/pubsub-key.json"' >> ~/.bashrc
```

### Option 2: User Credentials (For Development)

```bash
# Authenticate with your user account
gcloud auth application-default login

# This creates credentials at ~/.config/gcloud/application_default_credentials.json
```

### Verify Authentication

```python
# test_auth.py
from google.cloud import pubsub_v1
from google.api_core import exceptions

def test_authentication():
    try:
        publisher = pubsub_v1.PublisherClient()
        project_path = f"projects/{publisher.project_path.split('/')[1]}"
        print(f"✓ Authentication successful!")
        print(f"Project: {project_path}")
        return True
    except exceptions.DefaultCredentialsError as e:
        print(f"✗ Authentication failed: {e}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    test_authentication()
```

## Installing Dependencies

### Create a Virtual Environment

```bash
# Create virtual environment
python3 -m venv pubsub-env

# Activate virtual environment
source pubsub-env/bin/activate  # Linux/Mac
# pubsub-env\Scripts\activate  # Windows

# Upgrade pip
pip install --upgrade pip
```

### Install Required Packages

```bash
# Install Google Cloud Pub/Sub client
pip install google-cloud-pubsub

# Install additional helpful packages
pip install google-auth google-auth-oauthlib google-auth-httplib2

# Create requirements.txt
cat > requirements.txt << EOF
google-cloud-pubsub==2.18.4
google-auth==2.23.4
google-auth-oauthlib==1.1.0
google-auth-httplib2==0.1.1
EOF

# Install from requirements
pip install -r requirements.txt
```

### Verify Installation

```python
# verify_install.py
import google.cloud.pubsub_v1 as pubsub

def verify_installation():
    print(f"✓ google-cloud-pubsub version: {pubsub.__version__}")
    print(f"✓ Publisher client available: {hasattr(pubsub, 'PublisherClient')}")
    print(f"✓ Subscriber client available: {hasattr(pubsub, 'SubscriberClient')}")

if __name__ == "__main__":
    verify_installation()
```

## Creating Topics

### Using gcloud CLI

```bash
# Create a simple topic
gcloud pubsub topics create my-first-topic

# Create a topic with message retention
gcloud pubsub topics create my-topic-with-retention \
    --message-retention-duration=7d

# List all topics
gcloud pubsub topics list

# Describe a topic
gcloud pubsub topics describe my-first-topic

# Delete a topic
gcloud pubsub topics delete my-first-topic
```

### Using Python

```python
# create_topic.py
from google.cloud import pubsub_v1
from google.api_core.exceptions import AlreadyExists

def create_topic(project_id: str, topic_id: str):
    """
    Create a new Pub/Sub topic.

    Args:
        project_id: Your GCP project ID
        topic_id: The ID of the topic to create
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    try:
        topic = publisher.create_topic(request={"name": topic_path})
        print(f"✓ Topic created: {topic.name}")
        return topic
    except AlreadyExists:
        print(f"Topic {topic_path} already exists")
        return None
    except Exception as e:
        print(f"✗ Error creating topic: {e}")
        raise

def list_topics(project_id: str):
    """List all topics in the project."""
    publisher = pubsub_v1.PublisherClient()
    project_path = f"projects/{project_id}"

    print(f"\nTopics in project {project_id}:")
    for topic in publisher.list_topics(request={"project": project_path}):
        print(f"  - {topic.name}")

def delete_topic(project_id: str, topic_id: str):
    """Delete a Pub/Sub topic."""
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    try:
        publisher.delete_topic(request={"topic": topic_path})
        print(f"✓ Topic deleted: {topic_path}")
    except Exception as e:
        print(f"✗ Error deleting topic: {e}")
        raise

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "my-first-topic"

    # Create topic
    create_topic(PROJECT_ID, TOPIC_ID)

    # List topics
    list_topics(PROJECT_ID)

    # Delete topic (uncomment to test)
    # delete_topic(PROJECT_ID, TOPIC_ID)
```

## Publishing Messages

### Basic Publishing

```python
# publish_basic.py
from google.cloud import pubsub_v1
import time

def publish_message(project_id: str, topic_id: str, message: str):
    """
    Publish a single message to a Pub/Sub topic.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to publish to
        message: The message to publish

    Returns:
        The message ID
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    # Data must be a bytestring
    data = message.encode("utf-8")

    # Publish the message
    future = publisher.publish(topic_path, data)

    # Wait for the message to be published
    message_id = future.result()

    print(f"✓ Published message ID: {message_id}")
    return message_id

def publish_messages_with_callback(project_id: str, topic_id: str, messages: list):
    """
    Publish multiple messages with callback handlers.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to publish to
        messages: List of messages to publish
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)
    publish_futures = []

    def get_callback(future, message):
        """Callback to handle publish result."""
        def callback(future):
            try:
                message_id = future.result()
                print(f"✓ Message published: {message} (ID: {message_id})")
            except Exception as e:
                print(f"✗ Failed to publish {message}: {e}")
        return callback

    # Publish messages
    for message in messages:
        data = message.encode("utf-8")
        future = publisher.publish(topic_path, data)
        future.add_done_callback(get_callback(future, message))
        publish_futures.append(future)

    # Wait for all messages to be published
    for future in publish_futures:
        future.result()

def publish_messages_sync(project_id: str, topic_id: str, count: int):
    """
    Publish messages synchronously (blocking).

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to publish to
        count: Number of messages to publish
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    start_time = time.time()

    for i in range(count):
        message = f"Message {i}"
        data = message.encode("utf-8")
        future = publisher.publish(topic_path, data)
        message_id = future.result()  # Blocking call

        if i % 100 == 0:
            print(f"Published {i} messages...")

    elapsed = time.time() - start_time
    print(f"\n✓ Published {count} messages in {elapsed:.2f} seconds")
    print(f"Average: {count/elapsed:.2f} messages/second")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "my-first-topic"

    # Publish a single message
    publish_message(PROJECT_ID, TOPIC_ID, "Hello, Pub/Sub!")

    # Publish multiple messages with callbacks
    messages = [f"Message {i}" for i in range(10)]
    publish_messages_with_callback(PROJECT_ID, TOPIC_ID, messages)

    # Publish many messages synchronously
    publish_messages_sync(PROJECT_ID, TOPIC_ID, 1000)
```

## Message Attributes

Message attributes are key-value pairs that provide metadata about the message without parsing the payload.

```python
# publish_with_attributes.py
from google.cloud import pubsub_v1
import json
from datetime import datetime
import uuid

def publish_with_attributes(project_id: str, topic_id: str):
    """
    Publish messages with custom attributes.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to publish to
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    # Message payload
    message_data = {
        "user_id": "user_123",
        "action": "purchase",
        "amount": 99.99,
        "currency": "USD"
    }
    data = json.dumps(message_data).encode("utf-8")

    # Message attributes (metadata)
    attributes = {
        "origin": "web_app",
        "version": "1.0",
        "timestamp": datetime.utcnow().isoformat(),
        "correlation_id": str(uuid.uuid4()),
        "content_type": "application/json",
        "priority": "high"
    }

    # Publish with attributes
    future = publisher.publish(topic_path, data, **attributes)
    message_id = future.result()

    print(f"✓ Published message ID: {message_id}")
    print(f"  Data: {message_data}")
    print(f"  Attributes: {attributes}")

    return message_id

def publish_with_routing_key(project_id: str, topic_id: str, event_type: str, data: dict):
    """
    Publish message with routing attributes for filtering.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to publish to
        event_type: Type of event (for subscription filtering)
        data: Message payload
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    message_data = json.dumps(data).encode("utf-8")

    # Routing attributes
    attributes = {
        "event_type": event_type,
        "source": "order_service",
        "timestamp": datetime.utcnow().isoformat()
    }

    future = publisher.publish(topic_path, message_data, **attributes)
    message_id = future.result()

    print(f"✓ Published {event_type} event (ID: {message_id})")
    return message_id

def publish_various_events(project_id: str, topic_id: str):
    """Publish different types of events with routing attributes."""

    # Order created event
    publish_with_routing_key(
        project_id, topic_id, "order.created",
        {"order_id": "ORD-001", "amount": 99.99}
    )

    # Order shipped event
    publish_with_routing_key(
        project_id, topic_id, "order.shipped",
        {"order_id": "ORD-001", "tracking": "TRACK-123"}
    )

    # Order cancelled event
    publish_with_routing_key(
        project_id, topic_id, "order.cancelled",
        {"order_id": "ORD-002", "reason": "customer_request"}
    )

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "events-topic"

    # Create topic if it doesn't exist
    from create_topic import create_topic
    create_topic(PROJECT_ID, TOPIC_ID)

    # Publish with attributes
    publish_with_attributes(PROJECT_ID, TOPIC_ID)

    # Publish various events
    publish_various_events(PROJECT_ID, TOPIC_ID)
```

## Batch Publishing

Batch publishing improves throughput and reduces costs by grouping multiple messages together.

```python
# publish_batched.py
from google.cloud import pubsub_v1
from concurrent import futures
import time

def publish_with_batch_settings(project_id: str, topic_id: str, message_count: int):
    """
    Publish messages with optimized batch settings.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to publish to
        message_count: Number of messages to publish
    """
    # Configure batch settings
    batch_settings = pubsub_v1.types.BatchSettings(
        max_messages=100,  # Maximum messages per batch
        max_bytes=1024 * 1024,  # Maximum batch size in bytes (1 MB)
        max_latency=0.1,  # Maximum time to wait (seconds)
    )

    # Create publisher with batch settings
    publisher = pubsub_v1.PublisherClient(batch_settings=batch_settings)
    topic_path = publisher.topic_path(project_id, topic_id)

    publish_futures = []
    start_time = time.time()

    # Publish messages
    for i in range(message_count):
        data = f"Batched message {i}".encode("utf-8")
        future = publisher.publish(topic_path, data)
        publish_futures.append(future)

        if (i + 1) % 1000 == 0:
            print(f"Queued {i + 1} messages...")

    # Wait for all messages to be published
    futures.wait(publish_futures, return_when=futures.ALL_COMPLETED)

    elapsed = time.time() - start_time
    print(f"\n✓ Published {message_count} messages in {elapsed:.2f} seconds")
    print(f"Throughput: {message_count/elapsed:.2f} messages/second")

    # Check for any errors
    for future in publish_futures:
        try:
            future.result()
        except Exception as e:
            print(f"✗ Error publishing message: {e}")

def publish_with_custom_retry(project_id: str, topic_id: str):
    """
    Publish with custom retry settings.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to publish to
    """
    from google.api_core import retry

    # Custom retry settings
    custom_retry = retry.Retry(
        initial=0.1,  # Initial delay (seconds)
        maximum=60.0,  # Maximum delay (seconds)
        multiplier=2.0,  # Exponential backoff multiplier
        deadline=300.0,  # Total retry deadline (seconds)
    )

    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    data = b"Message with custom retry"
    future = publisher.publish(topic_path, data, retry=custom_retry)

    message_id = future.result()
    print(f"✓ Published with custom retry (ID: {message_id})")

def publish_with_flow_control(project_id: str, topic_id: str):
    """
    Publish with flow control to limit memory usage.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to publish to
    """
    # Flow control settings
    flow_control = pubsub_v1.types.PublishFlowControl(
        max_messages=1000,  # Maximum outstanding messages
        max_bytes=10 * 1024 * 1024,  # Maximum outstanding bytes (10 MB)
        limit_exceeded_behavior=pubsub_v1.types.LimitExceededBehavior.BLOCK,
    )

    publisher = pubsub_v1.PublisherClient(
        publisher_options=pubsub_v1.types.PublisherOptions(
            flow_control=flow_control
        )
    )

    topic_path = publisher.topic_path(project_id, topic_id)

    # Publish many messages - will block when limit reached
    for i in range(5000):
        data = f"Flow controlled message {i}".encode("utf-8")
        future = publisher.publish(topic_path, data)

        if i % 500 == 0:
            print(f"Published {i} messages (with flow control)...")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "batched-topic"

    # Create topic
    from create_topic import create_topic
    create_topic(PROJECT_ID, TOPIC_ID)

    # Publish with batch settings
    publish_with_batch_settings(PROJECT_ID, TOPIC_ID, 10000)

    # Publish with custom retry
    publish_with_custom_retry(PROJECT_ID, TOPIC_ID)

    # Publish with flow control
    # publish_with_flow_control(PROJECT_ID, TOPIC_ID)
```

## Pub/Sub Emulator

The Pub/Sub emulator allows you to develop and test locally without using actual GCP resources.

### Install and Start Emulator

```bash
# Install the emulator
gcloud components install pubsub-emulator

# Start the emulator
gcloud beta emulators pubsub start --project=test-project

# The emulator will output something like:
# [pubsub] This is the Google Pub/Sub fake.
# [pubsub] Implementation may be incomplete or differ from the real system.
# [pubsub] Listening on http://localhost:8085
```

### Configure Environment

```bash
# In a new terminal, set environment variable
export PUBSUB_EMULATOR_HOST=localhost:8085

# Or get the environment setup from gcloud
$(gcloud beta emulators pubsub env-init)

# Verify
echo $PUBSUB_EMULATOR_HOST
```

### Using Emulator in Python

```python
# emulator_example.py
import os
from google.cloud import pubsub_v1

# Set emulator host
os.environ["PUBSUB_EMULATOR_HOST"] = "localhost:8085"

def test_emulator():
    """Test publishing and subscribing with emulator."""
    project_id = "test-project"
    topic_id = "test-topic"
    subscription_id = "test-subscription"

    # Create publisher and subscriber clients
    publisher = pubsub_v1.PublisherClient()
    subscriber = pubsub_v1.SubscriberClient()

    # Create topic
    topic_path = publisher.topic_path(project_id, topic_id)
    try:
        topic = publisher.create_topic(request={"name": topic_path})
        print(f"✓ Created topic: {topic.name}")
    except Exception as e:
        print(f"Topic may already exist: {e}")

    # Create subscription
    subscription_path = subscriber.subscription_path(project_id, subscription_id)
    try:
        subscription = subscriber.create_subscription(
            request={"name": subscription_path, "topic": topic_path}
        )
        print(f"✓ Created subscription: {subscription.name}")
    except Exception as e:
        print(f"Subscription may already exist: {e}")

    # Publish message
    message = b"Hello from emulator!"
    future = publisher.publish(topic_path, message)
    message_id = future.result()
    print(f"✓ Published message ID: {message_id}")

    # Pull message
    response = subscriber.pull(
        request={"subscription": subscription_path, "max_messages": 1}
    )

    if response.received_messages:
        for received_message in response.received_messages:
            print(f"✓ Received: {received_message.message.data.decode('utf-8')}")

            # Acknowledge message
            subscriber.acknowledge(
                request={
                    "subscription": subscription_path,
                    "ack_ids": [received_message.ack_id]
                }
            )
            print("✓ Message acknowledged")

if __name__ == "__main__":
    test_emulator()
```

### Docker Compose for Emulator

```yaml
# docker-compose.yml
version: '3.8'

services:
  pubsub-emulator:
    image: gcr.io/google.com/cloudsdktool/cloud-sdk:latest
    command: gcloud beta emulators pubsub start --host-port=0.0.0.0:8085
    ports:
      - "8085:8085"
    environment:
      - PUBSUB_PROJECT_ID=test-project
```

```bash
# Start emulator with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f pubsub-emulator

# Stop emulator
docker-compose down
```

## Best Practices

### 1. Error Handling

```python
from google.api_core import exceptions
from google.api_core import retry

def publish_with_error_handling(project_id: str, topic_id: str, message: str):
    """Publish with comprehensive error handling."""
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    try:
        data = message.encode("utf-8")
        future = publisher.publish(topic_path, data)
        message_id = future.result(timeout=30)
        print(f"✓ Published: {message_id}")
        return message_id

    except exceptions.NotFound:
        print(f"✗ Topic not found: {topic_path}")
    except exceptions.PermissionDenied:
        print(f"✗ Permission denied for topic: {topic_path}")
    except exceptions.DeadlineExceeded:
        print(f"✗ Timeout publishing message")
    except Exception as e:
        print(f"✗ Unexpected error: {e}")

    return None
```

### 2. Message Size Optimization

```python
import json
import gzip

def publish_large_message(project_id: str, topic_id: str, large_data: dict):
    """Compress large messages before publishing."""
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    # Serialize data
    json_data = json.dumps(large_data)

    # Compress if large
    if len(json_data) > 10240:  # 10 KB
        compressed = gzip.compress(json_data.encode("utf-8"))
        attributes = {"compressed": "true", "encoding": "gzip"}
        print(f"Compressed {len(json_data)} → {len(compressed)} bytes")
    else:
        compressed = json_data.encode("utf-8")
        attributes = {"compressed": "false"}

    future = publisher.publish(topic_path, compressed, **attributes)
    return future.result()
```

### 3. Graceful Shutdown

```python
import signal
import sys

class GracefulPublisher:
    """Publisher with graceful shutdown."""

    def __init__(self, project_id: str):
        self.project_id = project_id
        self.publisher = pubsub_v1.PublisherClient()
        self.futures = []

        # Register signal handlers
        signal.signal(signal.SIGINT, self.shutdown)
        signal.signal(signal.SIGTERM, self.shutdown)

    def publish(self, topic_id: str, message: str):
        """Publish a message and track the future."""
        topic_path = self.publisher.topic_path(self.project_id, topic_id)
        data = message.encode("utf-8")
        future = self.publisher.publish(topic_path, data)
        self.futures.append(future)
        return future

    def shutdown(self, signum, frame):
        """Wait for pending messages before shutdown."""
        print(f"\nShutting down gracefully...")
        print(f"Waiting for {len(self.futures)} pending messages...")

        for future in self.futures:
            try:
                future.result(timeout=10)
            except Exception as e:
                print(f"Error: {e}")

        print("✓ All messages published")
        sys.exit(0)
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
```bash
# Verify credentials
gcloud auth application-default login

# Check service account key
cat $GOOGLE_APPLICATION_CREDENTIALS
```

2. **Permission Denied**
```bash
# Check IAM permissions
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:YOUR_SA_EMAIL"
```

3. **Quota Exceeded**
```bash
# Check quotas
gcloud pubsub topics list --limit=100
gcloud pubsub subscriptions list --limit=100
```

4. **Network Issues**
```python
# Test connectivity
from google.cloud import pubsub_v1

def test_connection(project_id):
    try:
        publisher = pubsub_v1.PublisherClient()
        project_path = f"projects/{project_id}"
        list(publisher.list_topics(request={"project": project_path}))
        print("✓ Connection successful")
    except Exception as e:
        print(f"✗ Connection failed: {e}")
```

## Summary

In this tutorial, you learned:

- How to set up a GCP project and configure authentication
- Creating and managing Pub/Sub topics
- Publishing single and batch messages
- Using message attributes for metadata and routing
- Leveraging the Pub/Sub emulator for local development
- Best practices for error handling and optimization

## Next Steps

- Proceed to [Tutorial 02: Pull and Push Subscriptions](../02_subscriptions/README.md)
- Explore the [official Pub/Sub documentation](https://cloud.google.com/pubsub/docs)
- Review [Python client library samples](https://github.com/googleapis/python-pubsub)

## Additional Resources

- [Pub/Sub Quickstart](https://cloud.google.com/pubsub/docs/quickstart-client-libraries)
- [Publisher Best Practices](https://cloud.google.com/pubsub/docs/publisher)
- [API Reference](https://googleapis.dev/python/pubsub/latest/)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
