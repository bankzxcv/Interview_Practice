# Tutorial 02: Pull and Push Subscriptions

## Overview

This tutorial covers Google Cloud Pub/Sub subscriptions in depth, including both pull and push subscription models. You'll learn how to create subscriptions, consume messages reliably, handle acknowledgments, configure flow control, and implement robust error handling patterns.

## Prerequisites

- Completed [Tutorial 01: Basic Pub/Sub Setup and Publishing](../01_basic_setup/README.md)
- Python 3.7 or higher with `google-cloud-pubsub` installed
- Active GCP project with Pub/Sub API enabled
- Understanding of asynchronous programming concepts

## Learning Objectives

By the end of this tutorial, you will be able to:

1. Create and configure pull and push subscriptions
2. Implement synchronous and asynchronous pull subscribers
3. Configure push subscriptions with HTTP endpoints
4. Handle message acknowledgments and deadlines
5. Implement flow control and concurrency
6. Build robust error handling with exponential backoff
7. Monitor subscription metrics and health

## Table of Contents

1. [Subscription Types Overview](#subscription-types-overview)
2. [Pull Subscriptions](#pull-subscriptions)
3. [Push Subscriptions](#push-subscriptions)
4. [Message Acknowledgment](#message-acknowledgment)
5. [Flow Control](#flow-control)
6. [Error Handling](#error-handling)
7. [Advanced Patterns](#advanced-patterns)
8. [Monitoring](#monitoring)

## Subscription Types Overview

### Pull vs Push

| Feature | Pull Subscription | Push Subscription |
|---------|------------------|-------------------|
| **Control** | Consumer controls rate | Pub/Sub pushes messages |
| **Scalability** | Horizontal scaling of consumers | Endpoint must handle load |
| **Latency** | Slightly higher | Lower latency |
| **Use Case** | Batch processing, worker pools | Webhooks, serverless functions |
| **Authentication** | Service account, user credentials | Endpoint authentication |
| **Cost** | Lower (no egress for pull) | Higher (HTTP egress) |

### Creating Subscriptions with gcloud

```bash
# Create a pull subscription
gcloud pubsub subscriptions create my-pull-sub \
    --topic=my-topic \
    --ack-deadline=60 \
    --message-retention-duration=7d

# Create a push subscription
gcloud pubsub subscriptions create my-push-sub \
    --topic=my-topic \
    --push-endpoint=https://example.com/webhook \
    --ack-deadline=30

# List subscriptions
gcloud pubsub subscriptions list

# Describe a subscription
gcloud pubsub subscriptions describe my-pull-sub

# Delete a subscription
gcloud pubsub subscriptions delete my-pull-sub
```

## Pull Subscriptions

### Creating Pull Subscriptions

```python
# create_subscription.py
from google.cloud import pubsub_v1
from google.api_core.exceptions import AlreadyExists

def create_pull_subscription(
    project_id: str,
    topic_id: str,
    subscription_id: str,
    ack_deadline_seconds: int = 60
):
    """
    Create a pull subscription.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to subscribe to
        subscription_id: ID for the new subscription
        ack_deadline_seconds: Acknowledgment deadline (10-600 seconds)
    """
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    try:
        subscription = subscriber.create_subscription(
            request={
                "name": subscription_path,
                "topic": topic_path,
                "ack_deadline_seconds": ack_deadline_seconds,
                "message_retention_duration": {"seconds": 604800},  # 7 days
                "retain_acked_messages": False,
                "enable_message_ordering": False,
            }
        )
        print(f"✓ Subscription created: {subscription.name}")
        return subscription
    except AlreadyExists:
        print(f"Subscription {subscription_path} already exists")
        return None
    except Exception as e:
        print(f"✗ Error creating subscription: {e}")
        raise

def create_subscription_with_filter(
    project_id: str,
    topic_id: str,
    subscription_id: str,
    filter_string: str
):
    """
    Create a subscription with message filtering.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to subscribe to
        subscription_id: ID for the new subscription
        filter_string: Filter expression (e.g., 'attributes.event_type="order.created"')
    """
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    try:
        subscription = subscriber.create_subscription(
            request={
                "name": subscription_path,
                "topic": topic_path,
                "filter": filter_string,
            }
        )
        print(f"✓ Filtered subscription created: {subscription.name}")
        print(f"  Filter: {filter_string}")
        return subscription
    except Exception as e:
        print(f"✗ Error creating subscription: {e}")
        raise

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "my-topic"

    # Create basic subscription
    create_pull_subscription(PROJECT_ID, TOPIC_ID, "basic-sub")

    # Create filtered subscriptions
    create_subscription_with_filter(
        PROJECT_ID, TOPIC_ID, "order-created-sub",
        'attributes.event_type="order.created"'
    )

    create_subscription_with_filter(
        PROJECT_ID, TOPIC_ID, "high-priority-sub",
        'attributes.priority="high"'
    )
```

### Synchronous Pull

```python
# sync_pull.py
from google.cloud import pubsub_v1
from concurrent.futures import TimeoutError
import time

def synchronous_pull(project_id: str, subscription_id: str, max_messages: int = 10):
    """
    Pull messages synchronously (blocking).

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to pull from
        max_messages: Maximum number of messages to pull
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    # Pull messages
    response = subscriber.pull(
        request={
            "subscription": subscription_path,
            "max_messages": max_messages,
        }
    )

    print(f"Received {len(response.received_messages)} messages")

    ack_ids = []
    for received_message in response.received_messages:
        message = received_message.message
        print(f"\nMessage ID: {message.message_id}")
        print(f"Data: {message.data.decode('utf-8')}")
        print(f"Attributes: {dict(message.attributes)}")
        print(f"Publish time: {message.publish_time}")

        ack_ids.append(received_message.ack_id)

    # Acknowledge all messages
    if ack_ids:
        subscriber.acknowledge(
            request={
                "subscription": subscription_path,
                "ack_ids": ack_ids
            }
        )
        print(f"\n✓ Acknowledged {len(ack_ids)} messages")

def pull_with_timeout(project_id: str, subscription_id: str, timeout: int = 10):
    """
    Pull messages with a timeout.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to pull from
        timeout: Timeout in seconds
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    try:
        response = subscriber.pull(
            request={
                "subscription": subscription_path,
                "max_messages": 10,
            },
            timeout=timeout
        )

        print(f"Received {len(response.received_messages)} messages")
        # Process messages...

    except TimeoutError:
        print("No messages received within timeout")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "basic-sub"

    synchronous_pull(PROJECT_ID, SUBSCRIPTION_ID)
```

### Asynchronous Pull (Streaming)

```python
# async_pull.py
from google.cloud import pubsub_v1
from concurrent.futures import TimeoutError
import time
import signal
import sys

def async_pull_with_callback(
    project_id: str,
    subscription_id: str,
    timeout: float = None
):
    """
    Pull messages asynchronously with a callback.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to pull from
        timeout: How long to listen (None = indefinitely)
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    def callback(message):
        """Process received message."""
        print(f"\n✓ Received message: {message.message_id}")
        print(f"  Data: {message.data.decode('utf-8')}")
        print(f"  Attributes: {dict(message.attributes)}")
        print(f"  Publish time: {message.publish_time}")

        # Simulate processing
        try:
            # Process the message
            process_message(message)

            # Acknowledge successful processing
            message.ack()
            print(f"  ✓ Acknowledged: {message.message_id}")

        except Exception as e:
            print(f"  ✗ Error processing message: {e}")
            # Don't acknowledge - message will be redelivered
            message.nack()

    def process_message(message):
        """Simulate message processing."""
        # Your business logic here
        time.sleep(0.1)  # Simulate work

    # Start streaming pull
    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback
    )

    print(f"Listening for messages on {subscription_path}...")
    print("Press Ctrl+C to stop\n")

    # Keep the main thread alive
    try:
        if timeout:
            streaming_pull_future.result(timeout=timeout)
        else:
            streaming_pull_future.result()
    except TimeoutError:
        streaming_pull_future.cancel()
        print("\nTimeout reached, stopping subscriber")
    except KeyboardInterrupt:
        streaming_pull_future.cancel()
        print("\nStopping subscriber...")

def async_pull_with_error_handling(project_id: str, subscription_id: str):
    """
    Async pull with comprehensive error handling.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to pull from
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    def callback(message):
        """Process message with error handling."""
        try:
            print(f"Processing: {message.message_id}")

            # Attempt to process
            data = message.data.decode('utf-8')

            # Simulate processing that might fail
            if "error" in data.lower():
                raise ValueError("Simulated processing error")

            # Success
            message.ack()
            print(f"  ✓ Success: {message.message_id}")

        except ValueError as e:
            print(f"  ✗ Business logic error: {e}")
            # Nack - message will be redelivered
            message.nack()

        except Exception as e:
            print(f"  ✗ Unexpected error: {e}")
            # Don't ack or nack - let deadline expire
            pass

    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback
    )

    print(f"Listening with error handling on {subscription_path}...")

    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "basic-sub"

    # Async pull with callback
    async_pull_with_callback(PROJECT_ID, SUBSCRIPTION_ID, timeout=60)

    # Async pull with error handling
    # async_pull_with_error_handling(PROJECT_ID, SUBSCRIPTION_ID)
```

## Push Subscriptions

### Creating Push Subscriptions

```python
# push_subscription.py
from google.cloud import pubsub_v1

def create_push_subscription(
    project_id: str,
    topic_id: str,
    subscription_id: str,
    push_endpoint: str
):
    """
    Create a push subscription.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to subscribe to
        subscription_id: ID for the new subscription
        push_endpoint: HTTPS endpoint to receive messages
    """
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    push_config = pubsub_v1.types.PushConfig(
        push_endpoint=push_endpoint
    )

    try:
        subscription = subscriber.create_subscription(
            request={
                "name": subscription_path,
                "topic": topic_path,
                "push_config": push_config,
                "ack_deadline_seconds": 30,
            }
        )
        print(f"✓ Push subscription created: {subscription.name}")
        print(f"  Endpoint: {push_endpoint}")
        return subscription
    except Exception as e:
        print(f"✗ Error creating subscription: {e}")
        raise

def create_push_subscription_with_auth(
    project_id: str,
    topic_id: str,
    subscription_id: str,
    push_endpoint: str,
    service_account_email: str
):
    """
    Create a push subscription with authentication.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to subscribe to
        subscription_id: ID for the new subscription
        push_endpoint: HTTPS endpoint to receive messages
        service_account_email: Service account for authenticating push requests
    """
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    push_config = pubsub_v1.types.PushConfig(
        push_endpoint=push_endpoint,
        oidc_token=pubsub_v1.types.PushConfig.OidcToken(
            service_account_email=service_account_email
        )
    )

    subscription = subscriber.create_subscription(
        request={
            "name": subscription_path,
            "topic": topic_path,
            "push_config": push_config,
        }
    )
    print(f"✓ Authenticated push subscription created: {subscription.name}")
    return subscription

def update_push_endpoint(
    project_id: str,
    subscription_id: str,
    new_endpoint: str
):
    """
    Update the push endpoint of an existing subscription.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to update
        new_endpoint: New HTTPS endpoint
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    push_config = pubsub_v1.types.PushConfig(
        push_endpoint=new_endpoint
    )

    subscription = subscriber.update_subscription(
        request={
            "subscription": {
                "name": subscription_path,
                "push_config": push_config
            },
            "update_mask": {"paths": ["push_config"]}
        }
    )
    print(f"✓ Updated push endpoint: {new_endpoint}")
    return subscription

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "my-topic"
    PUSH_ENDPOINT = "https://example.com/webhook"

    # Create push subscription
    create_push_subscription(
        PROJECT_ID, TOPIC_ID, "my-push-sub", PUSH_ENDPOINT
    )
```

### Push Endpoint (Flask Example)

```python
# push_handler.py
from flask import Flask, request, jsonify
import base64
import json
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route('/webhook', methods=['POST'])
def pubsub_push():
    """
    Handle Pub/Sub push messages.

    Request format:
    {
        "message": {
            "data": "base64-encoded-data",
            "messageId": "message-id",
            "attributes": {...},
            "publishTime": "2023-01-01T00:00:00Z"
        },
        "subscription": "projects/PROJECT/subscriptions/SUBSCRIPTION"
    }
    """
    try:
        # Verify the request is from Pub/Sub
        if not request.is_json:
            return jsonify({"error": "Invalid content type"}), 400

        envelope = request.get_json()
        if not envelope:
            return jsonify({"error": "No message received"}), 400

        # Extract message
        if 'message' not in envelope:
            return jsonify({"error": "Invalid message format"}), 400

        message = envelope['message']
        message_id = message.get('messageId')
        publish_time = message.get('publishTime')
        attributes = message.get('attributes', {})

        # Decode data
        if 'data' in message:
            data = base64.b64decode(message['data']).decode('utf-8')
        else:
            data = None

        logging.info(f"Received message: {message_id}")
        logging.info(f"Data: {data}")
        logging.info(f"Attributes: {attributes}")

        # Process the message
        process_push_message(data, attributes, message_id)

        # Return 200 to acknowledge
        return jsonify({"status": "success"}), 200

    except Exception as e:
        logging.error(f"Error processing message: {e}")
        # Return 200 even on error to prevent retry
        # Or return 4xx/5xx to trigger retry
        return jsonify({"error": str(e)}), 500

def process_push_message(data: str, attributes: dict, message_id: str):
    """Process the received message."""
    # Your business logic here
    logging.info(f"Processing message {message_id}")

    # Example: Parse JSON data
    if data:
        try:
            payload = json.loads(data)
            logging.info(f"Parsed payload: {payload}")
        except json.JSONDecodeError:
            logging.warning(f"Data is not JSON: {data}")

    # Example: Route based on attributes
    event_type = attributes.get('event_type')
    if event_type == 'order.created':
        handle_order_created(data)
    elif event_type == 'order.shipped':
        handle_order_shipped(data)

def handle_order_created(data: str):
    """Handle order created event."""
    logging.info(f"Handling order.created: {data}")

def handle_order_shipped(data: str):
    """Handle order shipped event."""
    logging.info(f"Handling order.shipped: {data}")

if __name__ == '__main__':
    # Run Flask app
    app.run(host='0.0.0.0', port=8080)
```

### Push Endpoint Security

```python
# secure_push_handler.py
from flask import Flask, request, jsonify, abort
import base64
import logging
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Your Pub/Sub service account email
EXPECTED_AUDIENCE = "https://example.com/webhook"

@app.route('/webhook', methods=['POST'])
def secure_pubsub_push():
    """
    Handle Pub/Sub push messages with authentication.
    """
    try:
        # Verify JWT token
        bearer_token = request.headers.get('Authorization')
        if not bearer_token:
            logging.error("Missing Authorization header")
            abort(401)

        token = bearer_token.split(' ')[1] if ' ' in bearer_token else bearer_token

        try:
            # Verify the token
            claim = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                EXPECTED_AUDIENCE
            )

            # Verify the token is from Pub/Sub
            if claim.get('email_verified'):
                logging.info(f"Authenticated request from: {claim.get('email')}")
            else:
                logging.error("Email not verified")
                abort(401)

        except Exception as e:
            logging.error(f"Token verification failed: {e}")
            abort(401)

        # Process message (same as before)
        envelope = request.get_json()
        message = envelope['message']
        data = base64.b64decode(message['data']).decode('utf-8')

        logging.info(f"Processing authenticated message: {message['messageId']}")

        # Process the message
        process_message(data)

        return jsonify({"status": "success"}), 200

    except Exception as e:
        logging.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

def process_message(data: str):
    """Process the message."""
    logging.info(f"Processing: {data}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, ssl_context='adhoc')
```

## Message Acknowledgment

### Acknowledgment Deadlines

```python
# acknowledgment.py
from google.cloud import pubsub_v1
import time

def modify_ack_deadline(
    project_id: str,
    subscription_id: str,
    ack_id: str,
    ack_deadline_seconds: int
):
    """
    Modify the acknowledgment deadline for a message.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription
        ack_id: The acknowledgment ID of the message
        ack_deadline_seconds: New deadline (0-600 seconds)
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    subscriber.modify_ack_deadline(
        request={
            "subscription": subscription_path,
            "ack_ids": [ack_id],
            "ack_deadline_seconds": ack_deadline_seconds,
        }
    )
    print(f"✓ Extended deadline to {ack_deadline_seconds} seconds")

def pull_with_deadline_extension(project_id: str, subscription_id: str):
    """
    Pull message and extend deadline during processing.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to pull from
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    # Pull one message
    response = subscriber.pull(
        request={
            "subscription": subscription_path,
            "max_messages": 1,
        }
    )

    if not response.received_messages:
        print("No messages available")
        return

    received_message = response.received_messages[0]
    message = received_message.message
    ack_id = received_message.ack_id

    print(f"Processing message: {message.message_id}")

    # Simulate long processing
    for i in range(5):
        print(f"  Step {i+1}/5...")
        time.sleep(10)

        # Extend deadline every 10 seconds
        modify_ack_deadline(
            project_id, subscription_id, ack_id, 60
        )

    # Acknowledge after processing complete
    subscriber.acknowledge(
        request={
            "subscription": subscription_path,
            "ack_ids": [ack_id]
        }
    )
    print("✓ Processing complete, message acknowledged")

def callback_with_manual_ack_extension(project_id: str, subscription_id: str):
    """
    Async subscriber with manual acknowledgment extension.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to pull from
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    def callback(message):
        """Process message with deadline extensions."""
        print(f"Processing: {message.message_id}")

        # Long processing
        for i in range(3):
            print(f"  Step {i+1}/3...")
            time.sleep(15)

            # Extend deadline
            message.modify_ack_deadline(60)
            print(f"  Extended deadline")

        # Acknowledge
        message.ack()
        print(f"✓ Done: {message.message_id}")

    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback
    )

    try:
        streaming_pull_future.result(timeout=120)
    except KeyboardInterrupt:
        streaming_pull_future.cancel()

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "basic-sub"

    pull_with_deadline_extension(PROJECT_ID, SUBSCRIPTION_ID)
```

## Flow Control

```python
# flow_control.py
from google.cloud import pubsub_v1
import time

def subscribe_with_flow_control(project_id: str, subscription_id: str):
    """
    Subscribe with flow control settings.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to pull from
    """
    # Configure flow control
    flow_control = pubsub_v1.types.FlowControl(
        max_messages=100,  # Max outstanding messages
        max_bytes=10 * 1024 * 1024,  # Max outstanding bytes (10 MB)
    )

    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    def callback(message):
        """Process message."""
        print(f"Processing: {message.message_id}")
        time.sleep(0.5)  # Simulate processing
        message.ack()

    # Subscribe with flow control
    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback,
        flow_control=flow_control,
    )

    print(f"Listening with flow control...")
    print(f"  Max messages: {flow_control.max_messages}")
    print(f"  Max bytes: {flow_control.max_bytes}")

    try:
        streaming_pull_future.result(timeout=60)
    except KeyboardInterrupt:
        streaming_pull_future.cancel()

def subscribe_with_concurrency_control(project_id: str, subscription_id: str):
    """
    Subscribe with concurrency control using thread pool.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to pull from
    """
    from concurrent.futures import ThreadPoolExecutor

    # Create custom thread pool
    executor = ThreadPoolExecutor(max_workers=5)

    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    def callback(message):
        """Process message."""
        print(f"[Thread-{message.message_id[:8]}] Processing...")
        time.sleep(1)  # Simulate work
        message.ack()
        print(f"[Thread-{message.message_id[:8]}] Done")

    # Subscribe with custom executor
    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback,
        flow_control=pubsub_v1.types.FlowControl(max_messages=10),
        scheduler=pubsub_v1.subscriber.scheduler.ThreadScheduler(executor)
    )

    print("Listening with concurrency control (5 workers)...")

    try:
        streaming_pull_future.result(timeout=60)
    except KeyboardInterrupt:
        streaming_pull_future.cancel()
    finally:
        executor.shutdown(wait=True)

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "basic-sub"

    subscribe_with_flow_control(PROJECT_ID, SUBSCRIPTION_ID)
    # subscribe_with_concurrency_control(PROJECT_ID, SUBSCRIPTION_ID)
```

## Error Handling

```python
# error_handling.py
from google.cloud import pubsub_v1
from google.api_core import retry
import time
import logging

logging.basicConfig(level=logging.INFO)

def subscribe_with_exponential_backoff(project_id: str, subscription_id: str):
    """
    Subscribe with exponential backoff on errors.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to pull from
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    def callback(message):
        """Process with exponential backoff."""
        max_retries = 5
        base_delay = 1

        for attempt in range(max_retries):
            try:
                # Attempt processing
                process_with_potential_failure(message.data)

                # Success - acknowledge
                message.ack()
                logging.info(f"✓ Success: {message.message_id}")
                return

            except Exception as e:
                delay = base_delay * (2 ** attempt)
                logging.warning(
                    f"Attempt {attempt + 1}/{max_retries} failed: {e}"
                )

                if attempt < max_retries - 1:
                    logging.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
                else:
                    logging.error("Max retries reached, nacking message")
                    message.nack()

    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback
    )

    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()

def process_with_potential_failure(data: bytes):
    """Simulate processing that might fail."""
    import random
    if random.random() < 0.3:  # 30% failure rate
        raise Exception("Simulated processing failure")
    # Otherwise succeed
    time.sleep(0.1)

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "basic-sub"

    subscribe_with_exponential_backoff(PROJECT_ID, SUBSCRIPTION_ID)
```

## Advanced Patterns

### Batch Processing

```python
# batch_processing.py
from google.cloud import pubsub_v1
import time

def batch_process_messages(
    project_id: str,
    subscription_id: str,
    batch_size: int = 100
):
    """
    Process messages in batches.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to pull from
        batch_size: Number of messages to process per batch
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    batch = []
    batch_ack_ids = []

    def callback(message):
        """Collect messages into batches."""
        batch.append(message.data)
        batch_ack_ids.append(message.ack_id)

        if len(batch) >= batch_size:
            # Process batch
            process_batch(batch)

            # Acknowledge all messages in batch
            subscriber.acknowledge(
                request={
                    "subscription": subscription_path,
                    "ack_ids": batch_ack_ids
                }
            )

            print(f"✓ Processed and acknowledged batch of {len(batch)}")

            # Clear batch
            batch.clear()
            batch_ack_ids.clear()

    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback
    )

    try:
        streaming_pull_future.result(timeout=60)
    finally:
        # Process remaining messages
        if batch:
            process_batch(batch)
            subscriber.acknowledge(
                request={
                    "subscription": subscription_path,
                    "ack_ids": batch_ack_ids
                }
            )
        streaming_pull_future.cancel()

def process_batch(messages: list):
    """Process a batch of messages."""
    print(f"Processing batch of {len(messages)} messages")
    # Bulk processing logic here
    time.sleep(0.5)

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "basic-sub"

    batch_process_messages(PROJECT_ID, SUBSCRIPTION_ID, batch_size=50)
```

## Monitoring

```python
# monitoring.py
from google.cloud import pubsub_v1
from google.cloud import monitoring_v3
import time

def get_subscription_metrics(project_id: str, subscription_id: str):
    """
    Get metrics for a subscription.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to monitor
    """
    client = monitoring_v3.MetricServiceClient()
    project_name = f"projects/{project_id}"

    # Query for backlog messages
    now = time.time()
    seconds = int(now)
    nanos = int((now - seconds) * 10 ** 9)
    interval = monitoring_v3.TimeInterval(
        {
            "end_time": {"seconds": seconds, "nanos": nanos},
            "start_time": {"seconds": (seconds - 3600), "nanos": nanos},
        }
    )

    results = client.list_time_series(
        request={
            "name": project_name,
            "filter": f'metric.type="pubsub.googleapis.com/subscription/num_undelivered_messages" '
                     f'AND resource.labels.subscription_id="{subscription_id}"',
            "interval": interval,
            "view": monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.FULL,
        }
    )

    for result in results:
        print(f"Subscription: {subscription_id}")
        for point in result.points:
            print(f"  Backlog: {point.value.int64_value} messages")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "basic-sub"

    get_subscription_metrics(PROJECT_ID, SUBSCRIPTION_ID)
```

## Summary

In this tutorial, you learned:

- Creating and configuring pull and push subscriptions
- Implementing synchronous and asynchronous message consumption
- Handling acknowledgments and deadline extensions
- Configuring flow control and concurrency
- Implementing robust error handling with exponential backoff
- Monitoring subscription health and metrics

## Next Steps

- Continue to [Tutorial 03: Message Ordering and Exactly-Once Delivery](../03_ordering_delivery/README.md)
- Explore [Dead Letter Topics](../04_dead_letter/README.md)
- Review the [Subscriber Best Practices](https://cloud.google.com/pubsub/docs/subscriber)
