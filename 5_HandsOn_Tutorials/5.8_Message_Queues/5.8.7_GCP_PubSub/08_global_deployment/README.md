# Tutorial 08: Global Deployment and Monitoring

## Overview

This tutorial covers deploying Google Cloud Pub/Sub at scale with multi-region architecture, comprehensive monitoring, and production-ready configurations. You'll learn Infrastructure as Code with Terraform, implement observability best practices, and build robust global messaging systems.

## Prerequisites

- Completed all previous tutorials (01-07)
- Understanding of infrastructure as code concepts
- Terraform installed (v1.0+)
- Production deployment experience (helpful)

## Learning Objectives

By the end of this tutorial, you will be able to:

1. Design multi-region Pub/Sub architectures
2. Implement global message routing patterns
3. Set up comprehensive monitoring with Cloud Monitoring
4. Create alerting policies and SLOs
5. Configure logging and distributed tracing
6. Use Terraform for infrastructure provisioning
7. Implement production deployment best practices

## Table of Contents

1. [Multi-Region Architecture](#multi-region-architecture)
2. [Terraform Infrastructure](#terraform-infrastructure)
3. [Monitoring and Metrics](#monitoring-and-metrics)
4. [Alerting and SLOs](#alerting-and-slos)
5. [Logging and Tracing](#logging-and-tracing)
6. [Performance Optimization](#performance-optimization)
7. [Disaster Recovery](#disaster-recovery)
8. [Production Best Practices](#production-best-practices)

## Multi-Region Architecture

### Understanding Global Pub/Sub

Pub/Sub is **globally distributed by default**:
- Topics and subscriptions are global resources
- Messages automatically replicated across regions
- No need to configure regional endpoints
- Built-in cross-region redundancy

### Multi-Region Patterns

```python
# global_architecture.py
"""
Multi-region Pub/Sub architecture patterns.

Pattern 1: Single Global Topic
  Publisher (US) ─┐
  Publisher (EU) ─┤→ Global Topic → Subscriber (US)
  Publisher (APAC)─┘              → Subscriber (EU)
                                  → Subscriber (APAC)

Pattern 2: Regional Topics with Aggregation
  Regional Topic (US) ─┐
  Regional Topic (EU) ─┤→ Aggregator → Global Analytics Topic
  Regional Topic (APAC)┘

Pattern 3: Active-Active with Regional Processing
  Publisher → Regional Topic (nearest) → Regional Processor → Global Store
"""

from google.cloud import pubsub_v1

def create_global_architecture(project_id: str):
    """
    Create global Pub/Sub architecture.

    Args:
        project_id: Your GCP project ID
    """
    publisher = pubsub_v1.PublisherClient()
    subscriber = pubsub_v1.SubscriberClient()

    # Global topic for events
    global_topic_path = publisher.topic_path(project_id, 'global-events')

    try:
        topic = publisher.create_topic(request={"name": global_topic_path})
        print(f"✓ Global topic created: {topic.name}")

        # Create regional subscriptions
        regions = ['us-central1', 'europe-west1', 'asia-east1']

        for region in regions:
            subscription_id = f'events-processor-{region}'
            subscription_path = subscriber.subscription_path(project_id, subscription_id)

            subscription = subscriber.create_subscription(
                request={
                    "name": subscription_path,
                    "topic": global_topic_path,
                    "ack_deadline_seconds": 60,
                    "message_retention_duration": {"seconds": 604800},
                }
            )
            print(f"✓ Regional subscription created: {subscription.name}")
            print(f"  Region: {region}")

    except Exception as e:
        print(f"✗ Error: {e}")
        raise

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    create_global_architecture(PROJECT_ID)
```

### Geographic Data Residency

```python
# data_residency.py
"""
Implement data residency requirements using regional topics.
"""

def create_regional_topics(project_id: str, regions: list):
    """
    Create regional topics for data residency.

    Args:
        project_id: Your GCP project ID
        regions: List of regions (e.g., ['us', 'eu', 'asia'])
    """
    publisher = pubsub_v1.PublisherClient()

    for region in regions:
        topic_id = f'orders-{region}'
        topic_path = publisher.topic_path(project_id, topic_id)

        try:
            topic = publisher.create_topic(request={"name": topic_path})
            print(f"✓ Regional topic created: {topic.name}")
            print(f"  Region: {region}")

            # Add labels for organization
            publisher.update_topic(
                request={
                    "topic": {
                        "name": topic_path,
                        "labels": {
                            "region": region,
                            "purpose": "data-residency"
                        }
                    },
                    "update_mask": {"paths": ["labels"]}
                }
            )

        except Exception as e:
            print(f"✗ Error creating topic for {region}: {e}")

def route_to_regional_topic(project_id: str, data: dict, user_region: str):
    """
    Route message to appropriate regional topic.

    Args:
        project_id: Your GCP project ID
        data: Message data
        user_region: User's region (us, eu, asia)
    """
    import json
    publisher = pubsub_v1.PublisherClient()

    topic_id = f'orders-{user_region}'
    topic_path = publisher.topic_path(project_id, topic_id)

    message = json.dumps(data).encode('utf-8')
    future = publisher.publish(topic_path, message)
    message_id = future.result()

    print(f"✓ Published to {user_region} topic: {message_id}")
    return message_id

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    REGIONS = ['us', 'eu', 'asia']

    create_regional_topics(PROJECT_ID, REGIONS)
```

## Terraform Infrastructure

### Complete Terraform Configuration

```hcl
# terraform/main.tf

terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "your-terraform-state-bucket"
    prefix = "pubsub/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.default_region
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "default_region" {
  description = "Default region for resources"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

# Topics
resource "google_pubsub_topic" "orders" {
  name = "${var.environment}-orders"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    team        = "platform"
  }

  message_retention_duration = "86400s" # 24 hours

  schema_settings {
    schema   = google_pubsub_schema.order_schema.id
    encoding = "JSON"
  }
}

resource "google_pubsub_topic" "orders_dlq" {
  name = "${var.environment}-orders-dlq"

  labels = {
    environment = var.environment
    type        = "dead-letter"
  }
}

# Schema
resource "google_pubsub_schema" "order_schema" {
  name = "${var.environment}-order-schema"
  type = "AVRO"

  definition = file("${path.module}/schemas/order.avsc")
}

# Subscriptions
resource "google_pubsub_subscription" "orders_processor" {
  name  = "${var.environment}-orders-processor"
  topic = google_pubsub_topic.orders.id

  ack_deadline_seconds = 60
  message_retention_duration = "604800s" # 7 days

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.orders_dlq.id
    max_delivery_attempts = 5
  }

  expiration_policy {
    ttl = "" # Never expire
  }

  enable_exactly_once_delivery = var.environment == "prod" ? true : false
  enable_message_ordering      = false

  labels = {
    environment = var.environment
    team        = "platform"
  }

  depends_on = [
    google_pubsub_topic_iam_member.dlq_publisher,
    google_pubsub_subscription_iam_member.dlq_subscriber
  ]
}

# IAM for Dead Letter Topic
data "google_project" "project" {
  project_id = var.project_id
}

resource "google_pubsub_topic_iam_member" "dlq_publisher" {
  project = var.project_id
  topic   = google_pubsub_topic.orders_dlq.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

resource "google_pubsub_subscription_iam_member" "dlq_subscriber" {
  project      = var.project_id
  subscription = google_pubsub_subscription.orders_processor.name
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

# Service Account for Pub/Sub Publishers
resource "google_service_account" "pubsub_publisher" {
  account_id   = "${var.environment}-pubsub-publisher"
  display_name = "Pub/Sub Publisher Service Account (${var.environment})"
}

resource "google_pubsub_topic_iam_member" "publisher" {
  project = var.project_id
  topic   = google_pubsub_topic.orders.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.pubsub_publisher.email}"
}

# Service Account for Pub/Sub Subscribers
resource "google_service_account" "pubsub_subscriber" {
  account_id   = "${var.environment}-pubsub-subscriber"
  display_name = "Pub/Sub Subscriber Service Account (${var.environment})"
}

resource "google_pubsub_subscription_iam_member" "subscriber" {
  project      = var.project_id
  subscription = google_pubsub_subscription.orders_processor.name
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:${google_service_account.pubsub_subscriber.email}"
}

# BigQuery Subscription
resource "google_pubsub_subscription" "orders_to_bigquery" {
  name  = "${var.environment}-orders-to-bigquery"
  topic = google_pubsub_topic.orders.id

  bigquery_config {
    table            = "${var.project_id}:${var.environment}_analytics.orders"
    use_topic_schema = true
    write_metadata   = true
  }

  labels = {
    environment = var.environment
    type        = "bigquery"
  }
}

# Monitoring Alerts
resource "google_monitoring_alert_policy" "high_message_backlog" {
  display_name = "${var.environment} - High Message Backlog"
  combiner     = "OR"

  conditions {
    display_name = "Message backlog exceeds threshold"

    condition_threshold {
      filter          = "resource.type = \"pubsub_subscription\" AND resource.labels.subscription_id = \"${google_pubsub_subscription.orders_processor.name}\" AND metric.type = \"pubsub.googleapis.com/subscription/num_undelivered_messages\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 1000

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = var.notification_channels

  alert_strategy {
    auto_close = "86400s" # 24 hours
  }
}

# Outputs
output "topic_name" {
  value = google_pubsub_topic.orders.name
}

output "subscription_name" {
  value = google_pubsub_subscription.orders_processor.name
}

output "publisher_service_account_email" {
  value = google_service_account.pubsub_publisher.email
}

output "subscriber_service_account_email" {
  value = google_service_account.pubsub_subscriber.email
}
```

### Terraform Variables

```hcl
# terraform/variables.tf

variable "notification_channels" {
  description = "Notification channels for alerts"
  type        = list(string)
  default     = []
}

# terraform/terraform.tfvars
project_id     = "your-project-id"
environment    = "prod"
default_region = "us-central1"

notification_channels = [
  "projects/your-project-id/notificationChannels/12345",
]
```

### Terraform Modules

```hcl
# terraform/modules/pubsub-topic/main.tf

resource "google_pubsub_topic" "topic" {
  name = var.topic_name

  labels = merge(
    var.labels,
    {
      managed_by = "terraform"
    }
  )

  message_retention_duration = var.message_retention_duration

  dynamic "schema_settings" {
    for_each = var.schema_id != null ? [1] : []
    content {
      schema   = var.schema_id
      encoding = var.schema_encoding
    }
  }
}

resource "google_pubsub_subscription" "subscriptions" {
  for_each = var.subscriptions

  name  = each.key
  topic = google_pubsub_topic.topic.id

  ack_deadline_seconds       = each.value.ack_deadline_seconds
  message_retention_duration = each.value.message_retention_duration

  retry_policy {
    minimum_backoff = each.value.min_backoff
    maximum_backoff = each.value.max_backoff
  }

  dynamic "dead_letter_policy" {
    for_each = each.value.dead_letter_topic != null ? [1] : []
    content {
      dead_letter_topic     = each.value.dead_letter_topic
      max_delivery_attempts = each.value.max_delivery_attempts
    }
  }

  labels = var.labels
}

# Variables
variable "topic_name" {
  type = string
}

variable "labels" {
  type    = map(string)
  default = {}
}

variable "message_retention_duration" {
  type    = string
  default = "86400s"
}

variable "schema_id" {
  type    = string
  default = null
}

variable "schema_encoding" {
  type    = string
  default = "JSON"
}

variable "subscriptions" {
  type = map(object({
    ack_deadline_seconds       = number
    message_retention_duration = string
    min_backoff                = string
    max_backoff                = string
    dead_letter_topic          = string
    max_delivery_attempts      = number
  }))
  default = {}
}
```

## Monitoring and Metrics

### Cloud Monitoring Setup

```python
# monitoring.py
from google.cloud import monitoring_v3
from google.api_core import protobuf_helpers
import time

class PubSubMonitor:
    """Monitor Pub/Sub metrics."""

    def __init__(self, project_id: str):
        self.project_id = project_id
        self.client = monitoring_v3.MetricServiceClient()
        self.project_name = f"projects/{project_id}"

    def get_subscription_metrics(self, subscription_id: str):
        """
        Get comprehensive metrics for a subscription.

        Args:
            subscription_id: The subscription to monitor
        """
        metrics = {
            'num_undelivered_messages': self._get_metric(
                'pubsub.googleapis.com/subscription/num_undelivered_messages',
                subscription_id
            ),
            'oldest_unacked_message_age': self._get_metric(
                'pubsub.googleapis.com/subscription/oldest_unacked_message_age',
                subscription_id
            ),
            'pull_request_count': self._get_metric(
                'pubsub.googleapis.com/subscription/pull_request_count',
                subscription_id
            ),
            'push_request_count': self._get_metric(
                'pubsub.googleapis.com/subscription/push_request_count',
                subscription_id
            ),
        }

        return metrics

    def get_topic_metrics(self, topic_id: str):
        """
        Get metrics for a topic.

        Args:
            topic_id: The topic to monitor
        """
        metrics = {
            'send_request_count': self._get_metric(
                'pubsub.googleapis.com/topic/send_request_count',
                topic_id,
                resource_type='pubsub_topic'
            ),
            'message_sizes': self._get_metric(
                'pubsub.googleapis.com/topic/message_sizes',
                topic_id,
                resource_type='pubsub_topic'
            ),
        }

        return metrics

    def _get_metric(
        self,
        metric_type: str,
        resource_id: str,
        resource_type: str = 'pubsub_subscription'
    ):
        """Fetch metric from Cloud Monitoring."""
        now = time.time()
        seconds = int(now)
        nanos = int((now - seconds) * 10 ** 9)

        interval = monitoring_v3.TimeInterval({
            "end_time": {"seconds": seconds, "nanos": nanos},
            "start_time": {"seconds": (seconds - 3600), "nanos": nanos},
        })

        resource_label = 'subscription_id' if resource_type == 'pubsub_subscription' else 'topic_id'

        results = self.client.list_time_series(
            request={
                "name": self.project_name,
                "filter": f'metric.type="{metric_type}" '
                         f'AND resource.type="{resource_type}" '
                         f'AND resource.labels.{resource_label}="{resource_id}"',
                "interval": interval,
                "view": monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.FULL,
            }
        )

        values = []
        for result in results:
            for point in result.points:
                values.append({
                    'timestamp': point.interval.end_time,
                    'value': point.value.int64_value or point.value.double_value
                })

        return values

    def print_subscription_health(self, subscription_id: str):
        """Print health summary for subscription."""
        print(f"\n{'='*60}")
        print(f"Subscription Health: {subscription_id}")
        print(f"{'='*60}")

        metrics = self.get_subscription_metrics(subscription_id)

        # Undelivered messages
        undelivered = metrics.get('num_undelivered_messages', [])
        if undelivered:
            latest = undelivered[-1]['value']
            print(f"Undelivered messages: {latest}")

            if latest > 10000:
                print(f"  ⚠️ WARNING: High backlog!")
            elif latest > 1000:
                print(f"  ⚠️ CAUTION: Increasing backlog")
            else:
                print(f"  ✓ Healthy backlog")

        # Oldest unacked message
        oldest = metrics.get('oldest_unacked_message_age', [])
        if oldest:
            age_seconds = oldest[-1]['value']
            age_minutes = age_seconds / 60

            print(f"Oldest unacked message: {age_minutes:.1f} minutes")

            if age_minutes > 60:
                print(f"  ⚠️ WARNING: Messages stuck!")
            elif age_minutes > 30:
                print(f"  ⚠️ CAUTION: Slow processing")
            else:
                print(f"  ✓ Processing is current")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "orders-processor"

    monitor = PubSubMonitor(PROJECT_ID)
    monitor.print_subscription_health(SUBSCRIPTION_ID)
```

### Custom Metrics

```python
# custom_metrics.py
from google.cloud import monitoring_v3
import time

def write_custom_metric(project_id: str, metric_value: float):
    """
    Write custom metric for Pub/Sub processing.

    Args:
        project_id: Your GCP project ID
        metric_value: The metric value to write
    """
    client = monitoring_v3.MetricServiceClient()
    project_name = f"projects/{project_id}"

    # Define custom metric
    series = monitoring_v3.TimeSeries()
    series.metric.type = "custom.googleapis.com/pubsub/processing_latency"
    series.resource.type = "global"

    # Add data point
    now = time.time()
    seconds = int(now)
    nanos = int((now - seconds) * 10 ** 9)

    interval = monitoring_v3.TimeInterval({
        "end_time": {"seconds": seconds, "nanos": nanos}
    })

    point = monitoring_v3.Point({
        "interval": interval,
        "value": {"double_value": metric_value}
    })

    series.points = [point]

    # Write to Cloud Monitoring
    client.create_time_series(name=project_name, time_series=[series])
    print(f"✓ Custom metric written: {metric_value}")

class MetricsCollector:
    """Collect and publish custom Pub/Sub metrics."""

    def __init__(self, project_id: str):
        self.project_id = project_id
        self.client = monitoring_v3.MetricServiceClient()
        self.project_name = f"projects/{project_id}"

    def record_processing_latency(self, latency_ms: float, subscription_id: str):
        """Record message processing latency."""
        series = monitoring_v3.TimeSeries()
        series.metric.type = "custom.googleapis.com/pubsub/processing_latency_ms"
        series.metric.labels['subscription_id'] = subscription_id
        series.resource.type = "global"

        point = self._create_point(latency_ms)
        series.points = [point]

        self.client.create_time_series(name=self.project_name, time_series=[series])

    def record_processing_errors(self, error_count: int, error_type: str):
        """Record processing errors."""
        series = monitoring_v3.TimeSeries()
        series.metric.type = "custom.googleapis.com/pubsub/processing_errors"
        series.metric.labels['error_type'] = error_type
        series.resource.type = "global"

        point = self._create_point(error_count)
        series.points = [point]

        self.client.create_time_series(name=self.project_name, time_series=[series])

    def _create_point(self, value: float):
        """Create a monitoring point."""
        now = time.time()
        seconds = int(now)
        nanos = int((now - seconds) * 10 ** 9)

        return monitoring_v3.Point({
            "interval": monitoring_v3.TimeInterval({
                "end_time": {"seconds": seconds, "nanos": nanos}
            }),
            "value": {"double_value": value}
        })
```

## Alerting and SLOs

### Alert Policies

```python
# alerting.py
from google.cloud import monitoring_v3

def create_alert_policies(project_id: str, subscription_id: str, notification_channels: list):
    """
    Create comprehensive alert policies.

    Args:
        project_id: Your GCP project ID
        subscription_id: Subscription to monitor
        notification_channels: List of notification channel IDs
    """
    client = monitoring_v3.AlertPolicyServiceClient()
    project_name = f"projects/{project_id}"

    # Alert 1: High message backlog
    backlog_policy = monitoring_v3.AlertPolicy(
        display_name=f"High Message Backlog - {subscription_id}",
        combiner=monitoring_v3.AlertPolicy.ConditionCombinerType.OR,
        conditions=[
            monitoring_v3.AlertPolicy.Condition(
                display_name="Backlog exceeds 10,000 messages",
                condition_threshold=monitoring_v3.AlertPolicy.Condition.MetricThreshold(
                    filter=f'resource.type="pubsub_subscription" '
                           f'AND resource.labels.subscription_id="{subscription_id}" '
                           f'AND metric.type="pubsub.googleapis.com/subscription/num_undelivered_messages"',
                    comparison=monitoring_v3.ComparisonType.COMPARISON_GT,
                    threshold_value=10000,
                    duration={"seconds": 300},
                    aggregations=[
                        monitoring_v3.Aggregation(
                            alignment_period={"seconds": 60},
                            per_series_aligner=monitoring_v3.Aggregation.Aligner.ALIGN_MEAN,
                        )
                    ],
                ),
            )
        ],
        notification_channels=notification_channels,
        alert_strategy=monitoring_v3.AlertPolicy.AlertStrategy(
            auto_close={"seconds": 86400}
        ),
    )

    policy = client.create_alert_policy(
        name=project_name,
        alert_policy=backlog_policy
    )
    print(f"✓ Alert policy created: {policy.name}")

    # Alert 2: Old unacked messages
    age_policy = monitoring_v3.AlertPolicy(
        display_name=f"Old Unacked Messages - {subscription_id}",
        combiner=monitoring_v3.AlertPolicy.ConditionCombinerType.OR,
        conditions=[
            monitoring_v3.AlertPolicy.Condition(
                display_name="Messages unacked for > 30 minutes",
                condition_threshold=monitoring_v3.AlertPolicy.Condition.MetricThreshold(
                    filter=f'resource.type="pubsub_subscription" '
                           f'AND resource.labels.subscription_id="{subscription_id}" '
                           f'AND metric.type="pubsub.googleapis.com/subscription/oldest_unacked_message_age"',
                    comparison=monitoring_v3.ComparisonType.COMPARISON_GT,
                    threshold_value=1800,  # 30 minutes in seconds
                    duration={"seconds": 300},
                    aggregations=[
                        monitoring_v3.Aggregation(
                            alignment_period={"seconds": 60},
                            per_series_aligner=monitoring_v3.Aggregation.Aligner.ALIGN_MAX,
                        )
                    ],
                ),
            )
        ],
        notification_channels=notification_channels,
    )

    policy = client.create_alert_policy(
        name=project_name,
        alert_policy=age_policy
    )
    print(f"✓ Alert policy created: {policy.name}")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "orders-processor"
    NOTIFICATION_CHANNELS = [
        "projects/your-project-id/notificationChannels/12345"
    ]

    create_alert_policies(PROJECT_ID, SUBSCRIPTION_ID, NOTIFICATION_CHANNELS)
```

### Service Level Objectives (SLOs)

```python
# slos.py
"""
Define SLOs for Pub/Sub services.

Example SLOs:
- 99.9% of messages processed within 1 minute
- 99.95% availability for message ingestion
- < 100ms publish latency at p99
"""

from google.cloud import monitoring_v3

def create_slo(project_id: str, service_id: str):
    """
    Create SLO for Pub/Sub service.

    Args:
        project_id: Your GCP project ID
        service_id: Service identifier
    """
    client = monitoring_v3.ServiceMonitoringServiceClient()
    parent = f"projects/{project_id}"

    # Create service
    service = monitoring_v3.Service(
        display_name=f"Pub/Sub Service - {service_id}",
        custom=monitoring_v3.Service.Custom(),
    )

    service = client.create_service(parent=parent, service=service)
    print(f"✓ Service created: {service.name}")

    # Create SLO: 99.9% of messages processed within 60 seconds
    slo = monitoring_v3.ServiceLevelObjective(
        display_name="Message Processing Latency SLO",
        goal=0.999,  # 99.9%
        rolling_period={"seconds": 2592000},  # 30 days
        service_level_indicator=monitoring_v3.ServiceLevelIndicator(
            request_based=monitoring_v3.RequestBasedSli(
                good_total_ratio=monitoring_v3.TimeSeriesRatio(
                    good_service_filter=f'metric.type="custom.googleapis.com/pubsub/processing_latency_ms" '
                                       f'AND metric.value < 60000',
                    total_service_filter=f'metric.type="custom.googleapis.com/pubsub/processing_latency_ms"',
                )
            )
        ),
    )

    slo = client.create_service_level_objective(
        parent=service.name,
        service_level_objective=slo
    )
    print(f"✓ SLO created: {slo.name}")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SERVICE_ID = "orders-processing"

    create_slo(PROJECT_ID, SERVICE_ID)
```

## Logging and Tracing

### Cloud Logging

```python
# logging_setup.py
from google.cloud import logging as cloud_logging
import logging
import json

class PubSubLogger:
    """Structured logging for Pub/Sub operations."""

    def __init__(self, project_id: str, log_name: str = "pubsub-operations"):
        self.client = cloud_logging.Client(project=project_id)
        self.logger = self.client.logger(log_name)

        # Also log to stdout
        logging.basicConfig(level=logging.INFO)

    def log_publish(self, topic_id: str, message_id: str, attributes: dict):
        """Log message publication."""
        self.logger.log_struct(
            {
                "operation": "publish",
                "topic_id": topic_id,
                "message_id": message_id,
                "attributes": attributes,
            },
            severity="INFO"
        )

    def log_processing_start(self, subscription_id: str, message_id: str):
        """Log message processing start."""
        self.logger.log_struct(
            {
                "operation": "processing_start",
                "subscription_id": subscription_id,
                "message_id": message_id,
            },
            severity="INFO"
        )

    def log_processing_complete(
        self,
        subscription_id: str,
        message_id: str,
        duration_ms: float
    ):
        """Log successful message processing."""
        self.logger.log_struct(
            {
                "operation": "processing_complete",
                "subscription_id": subscription_id,
                "message_id": message_id,
                "duration_ms": duration_ms,
            },
            severity="INFO"
        )

    def log_processing_error(
        self,
        subscription_id: str,
        message_id: str,
        error: str,
        stack_trace: str
    ):
        """Log processing error."""
        self.logger.log_struct(
            {
                "operation": "processing_error",
                "subscription_id": subscription_id,
                "message_id": message_id,
                "error": error,
                "stack_trace": stack_trace,
            },
            severity="ERROR"
        )

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    logger = PubSubLogger(PROJECT_ID)

    # Example usage
    logger.log_publish(
        "orders-topic",
        "msg-12345",
        {"event_type": "order.created", "priority": "high"}
    )
```

### Distributed Tracing

```python
# tracing.py
from opencensus.ext.stackdriver import trace_exporter
from opencensus.trace import tracer as tracer_module
from google.cloud import pubsub_v1
import json

def setup_tracing(project_id: str):
    """Set up distributed tracing for Pub/Sub."""
    exporter = trace_exporter.StackdriverExporter(
        project_id=project_id
    )
    tracer = tracer_module.Tracer(exporter=exporter)

    return tracer

def publish_with_tracing(project_id: str, topic_id: str, data: dict):
    """Publish message with distributed tracing."""
    tracer = setup_tracing(project_id)

    with tracer.span(name='publish_message') as span:
        span.add_attribute('topic_id', topic_id)

        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(project_id, topic_id)

        message = json.dumps(data).encode('utf-8')

        with tracer.span(name='pubsub_publish'):
            future = publisher.publish(topic_path, message)
            message_id = future.result()

        span.add_attribute('message_id', message_id)
        print(f"✓ Published with tracing: {message_id}")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "orders-topic"

    publish_with_tracing(PROJECT_ID, TOPIC_ID, {"order_id": "ORD-123"})
```

## Performance Optimization

### Publisher Optimization

```python
# optimization.py
"""Performance optimization strategies."""

from google.cloud import pubsub_v1

# 1. Optimize batch settings
optimal_batch_settings = pubsub_v1.types.BatchSettings(
    max_messages=1000,  # Maximum messages per batch
    max_bytes=10 * 1024 * 1024,  # 10 MB
    max_latency=0.01,  # 10ms - balance between latency and throughput
)

# 2. Connection pooling
publisher = pubsub_v1.PublisherClient(
    batch_settings=optimal_batch_settings
)

# 3. Compression for large messages
import gzip

def publish_compressed(data: bytes):
    compressed = gzip.compress(data)
    publisher.publish(
        topic_path,
        compressed,
        compression="gzip"  # Add attribute for subscriber
    )

# 4. Use message deduplication
def publish_with_dedup_id(data: dict):
    import hashlib
    import json

    # Generate deterministic ID from content
    content_hash = hashlib.sha256(
        json.dumps(data, sort_keys=True).encode()
    ).hexdigest()

    publisher.publish(
        topic_path,
        json.dumps(data).encode('utf-8'),
        dedup_id=content_hash
    )
```

### Subscriber Optimization

```python
# subscriber_optimization.py

# 1. Optimize flow control
flow_control = pubsub_v1.types.FlowControl(
    max_messages=1000,  # Concurrent messages
    max_bytes=100 * 1024 * 1024,  # 100 MB
)

# 2. Use appropriate concurrency
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=10)
scheduler = pubsub_v1.subscriber.scheduler.ThreadScheduler(executor)

# 3. Batch acknowledgments
class BatchAcker:
    def __init__(self, subscriber, subscription_path, batch_size=100):
        self.subscriber = subscriber
        self.subscription_path = subscription_path
        self.batch_size = batch_size
        self.ack_ids = []

    def ack(self, ack_id):
        self.ack_ids.append(ack_id)

        if len(self.ack_ids) >= self.batch_size:
            self.flush()

    def flush(self):
        if self.ack_ids:
            self.subscriber.acknowledge(
                request={
                    "subscription": self.subscription_path,
                    "ack_ids": self.ack_ids
                }
            )
            self.ack_ids = []
```

## Disaster Recovery

### Backup and Recovery

```python
# disaster_recovery.py
"""Disaster recovery strategies for Pub/Sub."""

def backup_configuration(project_id: str, output_file: str):
    """Backup Pub/Sub configuration."""
    import json
    from google.cloud import pubsub_v1

    publisher = pubsub_v1.PublisherClient()
    subscriber = pubsub_v1.SubscriberClient()

    config = {
        "topics": [],
        "subscriptions": []
    }

    # Backup topics
    for topic in publisher.list_topics(request={"project": f"projects/{project_id}"}):
        config["topics"].append({
            "name": topic.name,
            "labels": dict(topic.labels),
        })

    # Backup subscriptions
    for sub in subscriber.list_subscriptions(request={"project": f"projects/{project_id}"}):
        config["subscriptions"].append({
            "name": sub.name,
            "topic": sub.topic,
            "ack_deadline_seconds": sub.ack_deadline_seconds,
        })

    # Save to file
    with open(output_file, 'w') as f:
        json.dump(config, f, indent=2)

    print(f"✓ Configuration backed up to {output_file}")

def restore_configuration(project_id: str, config_file: str):
    """Restore Pub/Sub configuration from backup."""
    import json
    from google.cloud import pubsub_v1

    with open(config_file, 'r') as f:
        config = json.load(f)

    publisher = pubsub_v1.PublisherClient()
    subscriber = pubsub_v1.SubscriberClient()

    # Restore topics
    for topic_config in config["topics"]:
        try:
            publisher.create_topic(request={"name": topic_config["name"]})
            print(f"✓ Restored topic: {topic_config['name']}")
        except Exception as e:
            print(f"✗ Failed to restore topic: {e}")

    # Restore subscriptions
    for sub_config in config["subscriptions"]:
        try:
            subscriber.create_subscription(request=sub_config)
            print(f"✓ Restored subscription: {sub_config['name']}")
        except Exception as e:
            print(f"✗ Failed to restore subscription: {e}")
```

## Production Best Practices

### Deployment Checklist

```python
# deployment_checklist.py
"""
Production Deployment Checklist for Pub/Sub

□ Infrastructure
  ✓ Topics created with appropriate retention
  ✓ Subscriptions configured with retry policies
  ✓ Dead letter topics set up
  ✓ IAM permissions configured
  ✓ Service accounts created with minimal permissions

□ Monitoring
  ✓ Alert policies created
  ✓ SLOs defined and monitored
  ✓ Dashboards created
  ✓ Logging configured
  ✓ Tracing enabled

□ Resilience
  ✓ Idempotent message processing
  ✓ Error handling implemented
  ✓ Circuit breakers in place
  ✓ Rate limiting configured
  ✓ Disaster recovery plan

□ Performance
  ✓ Batch settings optimized
  ✓ Flow control configured
  ✓ Partitioning strategy (if using BigQuery)
  ✓ Message compression (for large payloads)

□ Security
  ✓ Encryption at rest enabled
  ✓ Encryption in transit (default)
  ✓ VPC Service Controls (if needed)
  ✓ Audit logging enabled
  ✓ Secret management (for credentials)

□ Testing
  ✓ Load testing completed
  ✓ Failure scenarios tested
  ✓ Recovery procedures validated
  ✓ Performance benchmarks established

□ Documentation
  ✓ Architecture diagrams
  ✓ Runbooks for common issues
  ✓ SLO documentation
  ✓ On-call procedures
"""
```

## Summary

In this tutorial, you learned:

- Designing multi-region Pub/Sub architectures
- Using Terraform for infrastructure as code
- Implementing comprehensive monitoring and metrics
- Creating alerting policies and SLOs
- Configuring logging and distributed tracing
- Optimizing performance for production workloads
- Planning for disaster recovery
- Following production deployment best practices

## Congratulations!

You've completed the comprehensive Google Cloud Pub/Sub tutorial series. You now have the knowledge to:

- Build production-ready Pub/Sub systems
- Implement event-driven architectures at scale
- Integrate with Cloud Functions, Dataflow, and BigQuery
- Monitor and optimize Pub/Sub deployments
- Handle failures gracefully with dead letter topics
- Deploy globally with infrastructure as code

## Next Steps

- Review [all tutorials](../README.md) for reference
- Explore the [official Pub/Sub documentation](https://cloud.google.com/pubsub/docs)
- Join the [Google Cloud community](https://cloud.google.com/community)
- Share your Pub/Sub implementations and learnings

## Additional Resources

- [Pub/Sub Architecture Guide](https://cloud.google.com/architecture/designing-pub-sub)
- [Best Practices](https://cloud.google.com/pubsub/docs/publisher)
- [Quotas and Limits](https://cloud.google.com/pubsub/quotas)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [API Reference](https://googleapis.dev/python/pubsub/latest/)
