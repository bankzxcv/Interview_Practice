# Tutorial 04: Dead Letter Topics and Retry Policies

## Overview

This tutorial covers error handling in Google Cloud Pub/Sub using dead letter topics (DLT) and configurable retry policies. You'll learn how to handle failed messages gracefully, configure exponential backoff, monitor undeliverable messages, and build resilient messaging systems.

## Prerequisites

- Completed [Tutorial 03: Message Ordering and Exactly-Once Delivery](../03_ordering_delivery/README.md)
- Understanding of error handling patterns
- Knowledge of exponential backoff algorithms

## Learning Objectives

By the end of this tutorial, you will be able to:

1. Configure dead letter topics for failed messages
2. Set up retry policies with exponential backoff
3. Monitor and process dead letter messages
4. Implement reprocessing strategies
5. Build robust error handling pipelines
6. Set appropriate maximum delivery attempts

## Table of Contents

1. [Dead Letter Topics Overview](#dead-letter-topics-overview)
2. [Creating Dead Letter Topics](#creating-dead-letter-topics)
3. [Configuring Retry Policies](#configuring-retry-policies)
4. [Processing Dead Letters](#processing-dead-letters)
5. [Reprocessing Strategies](#reprocessing-strategies)
6. [Monitoring](#monitoring)
7. [Best Practices](#best-practices)
8. [Advanced Patterns](#advanced-patterns)

## Dead Letter Topics Overview

### What is a Dead Letter Topic?

A **dead letter topic** (DLT) is a special Pub/Sub topic that receives messages that cannot be successfully processed after multiple delivery attempts.

### Why Use Dead Letter Topics?

- **Prevent message loss**: Messages don't disappear when processing fails
- **Isolate problematic messages**: Separate failed messages from healthy traffic
- **Enable investigation**: Analyze failures without blocking normal processing
- **Implement retry logic**: Reprocess messages after fixing issues
- **Monitor system health**: Track failure rates and patterns

### How It Works

```
Publisher → Main Topic → Subscription → Consumer
                              ↓ (failed after max attempts)
                         Dead Letter Topic → DLT Subscription → Error Handler
```

## Creating Dead Letter Topics

### Basic Setup

```python
# setup_dead_letter.py
from google.cloud import pubsub_v1

def create_dead_letter_topic(project_id: str, dead_letter_topic_id: str):
    """
    Create a topic to receive dead letter messages.

    Args:
        project_id: Your GCP project ID
        dead_letter_topic_id: The dead letter topic ID
    """
    publisher = pubsub_v1.PublisherClient()
    dead_letter_topic_path = publisher.topic_path(project_id, dead_letter_topic_id)

    try:
        topic = publisher.create_topic(request={"name": dead_letter_topic_path})
        print(f"✓ Dead letter topic created: {topic.name}")
        return topic
    except Exception as e:
        print(f"✗ Error creating topic: {e}")
        raise

def create_subscription_with_dead_letter(
    project_id: str,
    topic_id: str,
    subscription_id: str,
    dead_letter_topic_id: str,
    max_delivery_attempts: int = 5
):
    """
    Create a subscription with dead letter topic.

    Args:
        project_id: Your GCP project ID
        topic_id: The main topic
        subscription_id: The subscription ID
        dead_letter_topic_id: The dead letter topic ID
        max_delivery_attempts: Max attempts before sending to DLT (5-100)
    """
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)
    dead_letter_topic_path = subscriber.topic_path(project_id, dead_letter_topic_id)

    try:
        subscription = subscriber.create_subscription(
            request={
                "name": subscription_path,
                "topic": topic_path,
                "ack_deadline_seconds": 60,
                "dead_letter_policy": {
                    "dead_letter_topic": dead_letter_topic_path,
                    "max_delivery_attempts": max_delivery_attempts,
                },
            }
        )
        print(f"✓ Subscription created: {subscription.name}")
        print(f"  Dead letter topic: {dead_letter_topic_path}")
        print(f"  Max delivery attempts: {max_delivery_attempts}")
        return subscription
    except Exception as e:
        print(f"✗ Error creating subscription: {e}")
        raise

def grant_dead_letter_permissions(
    project_id: str,
    topic_id: str,
    subscription_id: str
):
    """
    Grant necessary IAM permissions for dead letter functionality.

    Args:
        project_id: Your GCP project ID
        topic_id: The dead letter topic
        subscription_id: The main subscription
    """
    from google.cloud import pubsub_v1
    from google.iam.v1 import iam_policy_pb2, policy_pb2

    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    # The Pub/Sub service account needs permission to publish to the dead letter topic
    # and acknowledge messages on the main subscription

    print(f"✓ Grant permissions manually via console or gcloud:")
    print(f"  1. Grant pubsub.publisher role on dead letter topic")
    print(f"  2. Grant pubsub.subscriber role on main subscription")
    print(f"  Service account: service-PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "main-topic"
    SUBSCRIPTION_ID = "main-subscription"
    DLT_TOPIC_ID = "dead-letter-topic"

    # Create dead letter topic
    create_dead_letter_topic(PROJECT_ID, DLT_TOPIC_ID)

    # Create subscription with DLT
    create_subscription_with_dead_letter(
        PROJECT_ID,
        TOPIC_ID,
        SUBSCRIPTION_ID,
        DLT_TOPIC_ID,
        max_delivery_attempts=5
    )

    # Note about permissions
    grant_dead_letter_permissions(PROJECT_ID, DLT_TOPIC_ID, SUBSCRIPTION_ID)
```

### Using gcloud CLI

```bash
# Create dead letter topic
gcloud pubsub topics create dead-letter-topic

# Get project number (needed for service account)
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com"

# Grant publisher permission on dead letter topic
gcloud pubsub topics add-iam-policy-binding dead-letter-topic \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/pubsub.publisher"

# Grant subscriber permission on main subscription
gcloud pubsub subscriptions add-iam-policy-binding main-subscription \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/pubsub.subscriber"

# Create subscription with dead letter policy
gcloud pubsub subscriptions create main-subscription \
    --topic=main-topic \
    --dead-letter-topic=dead-letter-topic \
    --max-delivery-attempts=5 \
    --ack-deadline=60
```

## Configuring Retry Policies

### Exponential Backoff Configuration

```python
# retry_policy.py
from google.cloud import pubsub_v1

def create_subscription_with_retry_policy(
    project_id: str,
    topic_id: str,
    subscription_id: str,
    min_backoff_seconds: int = 10,
    max_backoff_seconds: int = 600
):
    """
    Create a subscription with exponential backoff retry policy.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to subscribe to
        subscription_id: The subscription ID
        min_backoff_seconds: Minimum backoff (10-600)
        max_backoff_seconds: Maximum backoff (10-600)
    """
    from google.protobuf.duration_pb2 import Duration

    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    retry_policy = pubsub_v1.types.RetryPolicy(
        minimum_backoff=Duration(seconds=min_backoff_seconds),
        maximum_backoff=Duration(seconds=max_backoff_seconds),
    )

    try:
        subscription = subscriber.create_subscription(
            request={
                "name": subscription_path,
                "topic": topic_path,
                "ack_deadline_seconds": 60,
                "retry_policy": retry_policy,
            }
        )
        print(f"✓ Subscription created: {subscription.name}")
        print(f"  Retry policy:")
        print(f"    Min backoff: {min_backoff_seconds}s")
        print(f"    Max backoff: {max_backoff_seconds}s")
        return subscription
    except Exception as e:
        print(f"✗ Error creating subscription: {e}")
        raise

def create_subscription_with_dlt_and_retry(
    project_id: str,
    topic_id: str,
    subscription_id: str,
    dead_letter_topic_id: str,
    max_delivery_attempts: int = 5,
    min_backoff: int = 10,
    max_backoff: int = 600
):
    """
    Create subscription with both DLT and retry policy.

    Args:
        project_id: Your GCP project ID
        topic_id: The main topic
        subscription_id: The subscription ID
        dead_letter_topic_id: The dead letter topic
        max_delivery_attempts: Maximum delivery attempts
        min_backoff: Minimum backoff seconds
        max_backoff: Maximum backoff seconds
    """
    from google.protobuf.duration_pb2 import Duration

    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)
    dead_letter_topic_path = subscriber.topic_path(project_id, dead_letter_topic_id)

    retry_policy = pubsub_v1.types.RetryPolicy(
        minimum_backoff=Duration(seconds=min_backoff),
        maximum_backoff=Duration(seconds=max_backoff),
    )

    subscription = subscriber.create_subscription(
        request={
            "name": subscription_path,
            "topic": topic_path,
            "ack_deadline_seconds": 60,
            "retry_policy": retry_policy,
            "dead_letter_policy": {
                "dead_letter_topic": dead_letter_topic_path,
                "max_delivery_attempts": max_delivery_attempts,
            },
        }
    )

    print(f"✓ Subscription created with DLT and retry policy")
    print(f"  Max attempts: {max_delivery_attempts}")
    print(f"  Backoff: {min_backoff}s - {max_backoff}s")
    return subscription

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "main-topic"
    SUBSCRIPTION_ID = "retry-subscription"
    DLT_TOPIC_ID = "dead-letter-topic"

    create_subscription_with_dlt_and_retry(
        PROJECT_ID,
        TOPIC_ID,
        SUBSCRIPTION_ID,
        DLT_TOPIC_ID,
        max_delivery_attempts=5,
        min_backoff=10,
        max_backoff=600
    )
```

### Simulating Failures

```python
# simulate_failures.py
from google.cloud import pubsub_v1
import random
import time

def simulate_flaky_consumer(project_id: str, subscription_id: str):
    """
    Simulate a consumer that sometimes fails.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to consume from
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    failure_rate = 0.7  # 70% of messages will fail

    def callback(message):
        """Process with simulated failures."""
        delivery_attempt = message.delivery_attempt if hasattr(message, 'delivery_attempt') else 1

        print(f"\n[Attempt #{delivery_attempt}] Processing message: {message.message_id}")
        print(f"  Data: {message.data.decode('utf-8')}")

        # Simulate processing
        time.sleep(0.5)

        # Random failure
        if random.random() < failure_rate:
            print(f"  ✗ Processing failed! Message will be retried")
            message.nack()
        else:
            print(f"  ✓ Processing succeeded")
            message.ack()

    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback
    )

    print(f"Simulating flaky consumer (failure rate: {failure_rate*100}%)")
    print("Messages will be retried with exponential backoff")
    print("Failed messages will eventually go to dead letter topic\n")

    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "main-subscription"

    simulate_flaky_consumer(PROJECT_ID, SUBSCRIPTION_ID)
```

## Processing Dead Letters

### Dead Letter Subscription

```python
# process_dead_letters.py
from google.cloud import pubsub_v1
import json
from datetime import datetime

def create_dead_letter_subscription(
    project_id: str,
    dead_letter_topic_id: str,
    dlt_subscription_id: str
):
    """
    Create a subscription to process dead letter messages.

    Args:
        project_id: Your GCP project ID
        dead_letter_topic_id: The dead letter topic
        dlt_subscription_id: Subscription ID for DLT
    """
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, dead_letter_topic_id)
    subscription_path = subscriber.subscription_path(project_id, dlt_subscription_id)

    try:
        subscription = subscriber.create_subscription(
            request={
                "name": subscription_path,
                "topic": topic_path,
                "ack_deadline_seconds": 300,  # Longer deadline for investigation
            }
        )
        print(f"✓ Dead letter subscription created: {subscription.name}")
        return subscription
    except Exception as e:
        print(f"✗ Error: {e}")
        raise

def process_dead_letter_messages(project_id: str, dlt_subscription_id: str):
    """
    Process messages from dead letter topic.

    Args:
        project_id: Your GCP project ID
        dlt_subscription_id: The dead letter subscription
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, dlt_subscription_id)

    def callback(message):
        """Handle dead letter message."""
        print(f"\n{'='*60}")
        print(f"DEAD LETTER MESSAGE")
        print(f"{'='*60}")
        print(f"Message ID: {message.message_id}")
        print(f"Publish time: {message.publish_time}")
        print(f"Data: {message.data.decode('utf-8')}")
        print(f"Attributes: {dict(message.attributes)}")

        # Check delivery attempt attribute
        if 'googclient_deliveryattempt' in message.attributes:
            attempts = message.attributes['googclient_deliveryattempt']
            print(f"Delivery attempts: {attempts}")

        # Analyze the failure
        analyze_failure(message)

        # Log to monitoring system
        log_dead_letter(message)

        # Acknowledge to remove from DLT
        message.ack()
        print(f"✓ Dead letter message logged and acknowledged")

    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback
    )

    print(f"Monitoring dead letter topic: {dlt_subscription_id}")
    print("Press Ctrl+C to stop\n")

    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()

def analyze_failure(message):
    """Analyze why message failed."""
    data = message.data.decode('utf-8')

    # Check for common failure patterns
    if "error" in data.lower():
        print(f"⚠ Failure pattern: Message contains 'error'")
    if len(data) > 1000000:
        print(f"⚠ Failure pattern: Message too large ({len(data)} bytes)")

    # Add your custom analysis logic
    print(f"Analysis: Review message content and logs")

def log_dead_letter(message):
    """Log dead letter message to monitoring/alerting system."""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "message_id": message.message_id,
        "publish_time": str(message.publish_time),
        "data_length": len(message.data),
        "attributes": dict(message.attributes),
    }

    # In production: Send to Cloud Logging, BigQuery, or alerting system
    print(f"Logged to monitoring: {json.dumps(log_entry, indent=2)}")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    DLT_TOPIC_ID = "dead-letter-topic"
    DLT_SUBSCRIPTION_ID = "dead-letter-subscription"

    # Create DLT subscription
    create_dead_letter_subscription(PROJECT_ID, DLT_TOPIC_ID, DLT_SUBSCRIPTION_ID)

    # Process dead letters
    process_dead_letter_messages(PROJECT_ID, DLT_SUBSCRIPTION_ID)
```

## Reprocessing Strategies

### Republishing Dead Letters

```python
# reprocess_dead_letters.py
from google.cloud import pubsub_v1
import time

def reprocess_dead_letters(
    project_id: str,
    dlt_subscription_id: str,
    target_topic_id: str,
    max_messages: int = 100
):
    """
    Pull dead letters and republish to original topic for reprocessing.

    Args:
        project_id: Your GCP project ID
        dlt_subscription_id: Dead letter subscription
        target_topic_id: Topic to republish to (usually the original topic)
        max_messages: Maximum messages to reprocess
    """
    subscriber = pubsub_v1.SubscriberClient()
    publisher = pubsub_v1.PublisherClient()

    dlt_subscription_path = subscriber.subscription_path(project_id, dlt_subscription_id)
    target_topic_path = publisher.topic_path(project_id, target_topic_id)

    # Pull dead letters
    response = subscriber.pull(
        request={
            "subscription": dlt_subscription_path,
            "max_messages": max_messages,
        }
    )

    if not response.received_messages:
        print("No dead letter messages to reprocess")
        return

    print(f"Reprocessing {len(response.received_messages)} dead letter messages")

    reprocessed = 0
    failed = 0
    ack_ids = []

    for received_message in response.received_messages:
        message = received_message.message

        try:
            # Optional: Transform or fix message before republishing
            data = message.data
            attributes = dict(message.attributes)

            # Add reprocessing metadata
            attributes["reprocessed"] = "true"
            attributes["reprocess_time"] = str(time.time())
            attributes["original_message_id"] = message.message_id

            # Republish
            future = publisher.publish(
                target_topic_path,
                data,
                **attributes
            )
            new_message_id = future.result()

            print(f"✓ Reprocessed: {message.message_id} → {new_message_id}")

            # Mark for acknowledgment
            ack_ids.append(received_message.ack_id)
            reprocessed += 1

        except Exception as e:
            print(f"✗ Failed to reprocess {message.message_id}: {e}")
            failed += 1

    # Acknowledge successfully reprocessed messages
    if ack_ids:
        subscriber.acknowledge(
            request={
                "subscription": dlt_subscription_path,
                "ack_ids": ack_ids
            }
        )

    print(f"\nReprocessing complete:")
    print(f"  Reprocessed: {reprocessed}")
    print(f"  Failed: {failed}")

def selective_reprocessing(
    project_id: str,
    dlt_subscription_id: str,
    target_topic_id: str,
    filter_func
):
    """
    Reprocess only messages that match a filter.

    Args:
        project_id: Your GCP project ID
        dlt_subscription_id: Dead letter subscription
        target_topic_id: Topic to republish to
        filter_func: Function to determine if message should be reprocessed
    """
    subscriber = pubsub_v1.SubscriberClient()
    publisher = pubsub_v1.PublisherClient()

    dlt_subscription_path = subscriber.subscription_path(project_id, dlt_subscription_id)
    target_topic_path = publisher.topic_path(project_id, target_topic_id)

    response = subscriber.pull(
        request={
            "subscription": dlt_subscription_path,
            "max_messages": 100,
        }
    )

    reprocessed = 0
    skipped = 0

    for received_message in response.received_messages:
        message = received_message.message

        # Apply filter
        if filter_func(message):
            # Republish
            future = publisher.publish(
                target_topic_path,
                message.data,
                **dict(message.attributes)
            )
            future.result()

            # Acknowledge
            subscriber.acknowledge(
                request={
                    "subscription": dlt_subscription_path,
                    "ack_ids": [received_message.ack_id]
                }
            )

            print(f"✓ Reprocessed: {message.message_id}")
            reprocessed += 1
        else:
            print(f"⊘ Skipped: {message.message_id}")
            skipped += 1

    print(f"\nSelective reprocessing:")
    print(f"  Reprocessed: {reprocessed}")
    print(f"  Skipped: {skipped}")

# Example filters
def filter_by_attribute(message):
    """Reprocess only messages with specific attribute."""
    return message.attributes.get("priority") == "high"

def filter_by_date(message):
    """Reprocess only recent messages."""
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() - timedelta(hours=24)
    return message.publish_time.timestamp() > cutoff.timestamp()

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    DLT_SUBSCRIPTION_ID = "dead-letter-subscription"
    TARGET_TOPIC_ID = "main-topic"

    # Reprocess all dead letters
    reprocess_dead_letters(PROJECT_ID, DLT_SUBSCRIPTION_ID, TARGET_TOPIC_ID)

    # Selective reprocessing
    # selective_reprocessing(
    #     PROJECT_ID,
    #     DLT_SUBSCRIPTION_ID,
    #     TARGET_TOPIC_ID,
    #     filter_by_attribute
    # )
```

### Automated Reprocessing

```python
# automated_reprocessing.py
from google.cloud import pubsub_v1
from datetime import datetime, timedelta
import time

class DeadLetterReprocessor:
    """Automated reprocessing of dead letters."""

    def __init__(
        self,
        project_id: str,
        dlt_subscription_id: str,
        target_topic_id: str,
        reprocess_delay_hours: int = 1
    ):
        self.project_id = project_id
        self.dlt_subscription_id = dlt_subscription_id
        self.target_topic_id = target_topic_id
        self.reprocess_delay = timedelta(hours=reprocess_delay_hours)

        self.subscriber = pubsub_v1.SubscriberClient()
        self.publisher = pubsub_v1.PublisherClient()

    def should_reprocess(self, message) -> bool:
        """Determine if message should be reprocessed."""
        # Wait before reprocessing (give time to fix the issue)
        age = datetime.utcnow() - message.publish_time.replace(tzinfo=None)
        if age < self.reprocess_delay:
            return False

        # Don't reprocess if already attempted multiple times
        reprocess_count = int(message.attributes.get("reprocess_count", 0))
        if reprocess_count >= 3:
            print(f"Message {message.message_id} exceeded reprocess limit")
            return False

        return True

    def run(self, interval_seconds: int = 300):
        """
        Run automated reprocessing loop.

        Args:
            interval_seconds: How often to check for dead letters
        """
        print(f"Starting automated dead letter reprocessor")
        print(f"Checking every {interval_seconds} seconds")
        print(f"Reprocessing messages older than {self.reprocess_delay}")

        while True:
            try:
                self.process_batch()
                time.sleep(interval_seconds)
            except KeyboardInterrupt:
                print("\nStopping reprocessor")
                break
            except Exception as e:
                print(f"Error in reprocessor: {e}")
                time.sleep(60)

    def process_batch(self):
        """Process one batch of dead letters."""
        dlt_subscription_path = self.subscriber.subscription_path(
            self.project_id,
            self.dlt_subscription_id
        )
        target_topic_path = self.publisher.topic_path(
            self.project_id,
            self.target_topic_id
        )

        # Pull dead letters
        response = self.subscriber.pull(
            request={
                "subscription": dlt_subscription_path,
                "max_messages": 50,
            }
        )

        if not response.received_messages:
            return

        print(f"\nProcessing {len(response.received_messages)} dead letters")

        for received_message in response.received_messages:
            message = received_message.message

            if self.should_reprocess(message):
                # Increment reprocess counter
                attributes = dict(message.attributes)
                reprocess_count = int(attributes.get("reprocess_count", 0)) + 1
                attributes["reprocess_count"] = str(reprocess_count)

                # Republish
                future = self.publisher.publish(
                    target_topic_path,
                    message.data,
                    **attributes
                )
                future.result()

                print(f"✓ Reprocessed: {message.message_id} (attempt #{reprocess_count})")

                # Acknowledge
                self.subscriber.acknowledge(
                    request={
                        "subscription": dlt_subscription_path,
                        "ack_ids": [received_message.ack_id]
                    }
                )

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    DLT_SUBSCRIPTION_ID = "dead-letter-subscription"
    TARGET_TOPIC_ID = "main-topic"

    reprocessor = DeadLetterReprocessor(
        PROJECT_ID,
        DLT_SUBSCRIPTION_ID,
        TARGET_TOPIC_ID,
        reprocess_delay_hours=1
    )

    # Run automated reprocessing
    reprocessor.run(interval_seconds=300)  # Check every 5 minutes
```

## Monitoring

### Dead Letter Metrics

```python
# monitor_dead_letters.py
from google.cloud import monitoring_v3
from google.cloud import pubsub_v1
import time

def get_dead_letter_metrics(project_id: str, subscription_id: str):
    """
    Get metrics for dead letter topic.

    Args:
        project_id: Your GCP project ID
        subscription_id: The main subscription (with DLT configured)
    """
    client = monitoring_v3.MetricServiceClient()
    project_name = f"projects/{project_id}"

    # Time range: last hour
    now = time.time()
    seconds = int(now)
    nanos = int((now - seconds) * 10 ** 9)

    interval = monitoring_v3.TimeInterval(
        {
            "end_time": {"seconds": seconds, "nanos": nanos},
            "start_time": {"seconds": (seconds - 3600), "nanos": nanos},
        }
    )

    # Query dead letter publish count
    results = client.list_time_series(
        request={
            "name": project_name,
            "filter": f'metric.type="pubsub.googleapis.com/subscription/dead_letter_message_count" '
                     f'AND resource.labels.subscription_id="{subscription_id}"',
            "interval": interval,
            "view": monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.FULL,
        }
    )

    print(f"Dead Letter Metrics for subscription: {subscription_id}")
    for result in results:
        for point in result.points:
            print(f"  Dead letters: {point.value.int64_value}")

def check_subscription_health(project_id: str, subscription_id: str):
    """
    Check overall subscription health.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription to check
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    # Get subscription details
    subscription = subscriber.get_subscription(
        request={"subscription": subscription_path}
    )

    print(f"\nSubscription Health: {subscription_id}")
    print(f"  Dead letter topic: {subscription.dead_letter_policy.dead_letter_topic if subscription.dead_letter_policy else 'None'}")
    print(f"  Max delivery attempts: {subscription.dead_letter_policy.max_delivery_attempts if subscription.dead_letter_policy else 'N/A'}")

    if subscription.retry_policy:
        print(f"  Retry policy:")
        print(f"    Min backoff: {subscription.retry_policy.minimum_backoff.seconds}s")
        print(f"    Max backoff: {subscription.retry_policy.maximum_backoff.seconds}s")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "main-subscription"

    get_dead_letter_metrics(PROJECT_ID, SUBSCRIPTION_ID)
    check_subscription_health(PROJECT_ID, SUBSCRIPTION_ID)
```

## Best Practices

### 1. Choose Appropriate Max Delivery Attempts

```python
# Different scenarios require different attempt counts

# Fast-failing (quick feedback, minimal cost)
max_delivery_attempts = 3

# Standard (balanced)
max_delivery_attempts = 5

# Aggressive retry (transient errors expected)
max_delivery_attempts = 10
```

### 2. Set Reasonable Backoff Ranges

```python
from google.protobuf.duration_pb2 import Duration

# Short-lived transient errors (network blips)
retry_policy = pubsub_v1.types.RetryPolicy(
    minimum_backoff=Duration(seconds=10),
    maximum_backoff=Duration(seconds=60),
)

# Longer-lived issues (downstream service recovery)
retry_policy = pubsub_v1.types.RetryPolicy(
    minimum_backoff=Duration(seconds=60),
    maximum_backoff=Duration(seconds=600),
)
```

### 3. Monitor Dead Letter Queues

```python
# Set up alerting
def setup_dead_letter_alert(project_id: str, subscription_id: str):
    """Alert when dead letters exceed threshold."""
    print(f"Create Cloud Monitoring alert:")
    print(f"  Metric: pubsub.googleapis.com/subscription/dead_letter_message_count")
    print(f"  Condition: > 10 messages in 5 minutes")
    print(f"  Notification: Email, PagerDuty, etc.")
```

## Advanced Patterns

### Cascading Dead Letter Topics

```python
# Primary → DLT1 → DLT2 (for multi-level error handling)

def create_cascading_dlt(project_id: str):
    """Create multiple levels of dead letter topics."""
    publisher = pubsub_v1.PublisherClient()
    subscriber = pubsub_v1.SubscriberClient()

    # Create DLT levels
    dlt1_path = publisher.topic_path(project_id, "dlt-level-1")
    dlt2_path = publisher.topic_path(project_id, "dlt-level-2")

    # Level 1: Quick failures
    subscriber.create_subscription(
        request={
            "name": subscriber.subscription_path(project_id, "main-sub"),
            "topic": publisher.topic_path(project_id, "main-topic"),
            "dead_letter_policy": {
                "dead_letter_topic": dlt1_path,
                "max_delivery_attempts": 3,
            },
        }
    )

    # Level 2: Reprocessed failures
    subscriber.create_subscription(
        request={
            "name": subscriber.subscription_path(project_id, "dlt1-sub"),
            "topic": dlt1_path,
            "dead_letter_policy": {
                "dead_letter_topic": dlt2_path,
                "max_delivery_attempts": 5,
            },
        }
    )

    print("✓ Created cascading dead letter topics")
```

## Summary

In this tutorial, you learned:

- Setting up dead letter topics for failed messages
- Configuring retry policies with exponential backoff
- Processing and analyzing dead letter messages
- Implementing reprocessing strategies
- Monitoring dead letter queues
- Best practices for error handling in Pub/Sub

## Next Steps

- Continue to [Tutorial 05: Schema Validation](../05_schema_validation/README.md)
- Learn about [Cloud Functions Integration](../06_dataflow_integration/README.md)
- Review [Error Handling Best Practices](https://cloud.google.com/pubsub/docs/handling-failures)
