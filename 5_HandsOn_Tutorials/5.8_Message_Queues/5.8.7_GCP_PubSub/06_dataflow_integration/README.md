# Tutorial 06: Cloud Functions and Dataflow Integration

## Overview

This tutorial explores integrating Google Cloud Pub/Sub with Cloud Functions for serverless event-driven architectures and Apache Beam/Dataflow for stream processing pipelines. You'll learn to build scalable, real-time data processing systems that react to Pub/Sub messages.

## Prerequisites

- Completed [Tutorial 05: Schema Validation](../05_schema_validation/README.md)
- Understanding of serverless architectures
- Basic knowledge of Apache Beam (helpful but not required)
- Python 3.7+ and pip installed

## Learning Objectives

By the end of this tutorial, you will be able to:

1. Create Cloud Functions triggered by Pub/Sub
2. Build event-driven serverless applications
3. Develop Apache Beam pipelines for Pub/Sub
4. Deploy Dataflow jobs for stream processing
5. Implement windowing and aggregations
6. Handle errors in streaming pipelines
7. Monitor and optimize streaming jobs

## Table of Contents

1. [Cloud Functions with Pub/Sub](#cloud-functions-with-pubsub)
2. [Event-Driven Architectures](#event-driven-architectures)
3. [Apache Beam Basics](#apache-beam-basics)
4. [Dataflow Pipelines](#dataflow-pipelines)
5. [Windowing and Aggregations](#windowing-and-aggregations)
6. [Error Handling](#error-handling)
7. [Monitoring and Optimization](#monitoring-and-optimization)
8. [Advanced Patterns](#advanced-patterns)

## Cloud Functions with Pub/Sub

### Creating a Basic Cloud Function

```python
# main.py (Cloud Function)
import base64
import json
import logging

def process_pubsub_message(event, context):
    """
    Cloud Function triggered by Pub/Sub.

    Args:
        event (dict): Event payload containing Pub/Sub message
        context (google.cloud.functions.Context): Metadata for the event
    """
    # Get Pub/Sub message
    pubsub_message = base64.b64decode(event['data']).decode('utf-8')

    # Parse message
    try:
        message_data = json.loads(pubsub_message)
        logging.info(f"Processing message: {message_data}")

        # Your business logic here
        result = process_order(message_data)

        logging.info(f"Processing complete: {result}")

    except json.JSONDecodeError as e:
        logging.error(f"Invalid JSON: {e}")
        # Cloud Function will retry on error
        raise

    except Exception as e:
        logging.error(f"Processing error: {e}")
        raise

def process_order(order_data: dict) -> dict:
    """Process order data."""
    order_id = order_data.get('order_id')
    amount = order_data.get('amount')

    # Example: Update database, send notification, etc.
    logging.info(f"Processing order {order_id} for ${amount}")

    return {
        "order_id": order_id,
        "status": "processed",
        "amount": amount
    }
```

### Deploying Cloud Function

```bash
# requirements.txt
google-cloud-logging==3.5.0
google-cloud-pubsub==2.18.4

# Deploy Cloud Function
gcloud functions deploy process-pubsub-message \
    --runtime python39 \
    --trigger-topic=orders-topic \
    --entry-point=process_pubsub_message \
    --region=us-central1 \
    --memory=256MB \
    --timeout=60s \
    --max-instances=100

# View logs
gcloud functions logs read process-pubsub-message --limit=50

# Test function
gcloud pubsub topics publish orders-topic \
    --message='{"order_id": "ORD-123", "amount": 99.99}'
```

### Advanced Cloud Function

```python
# advanced_function.py
import base64
import json
import logging
from google.cloud import firestore
from google.cloud import pubsub_v1
import os

# Initialize clients
db = firestore.Client()
publisher = pubsub_v1.PublisherClient()
PROJECT_ID = os.environ.get('GCP_PROJECT')

def process_event(event, context):
    """
    Advanced Cloud Function with multiple integrations.

    Processes events, updates Firestore, and publishes results.
    """
    # Extract message
    pubsub_message = base64.b64decode(event['data']).decode('utf-8')
    message_data = json.loads(pubsub_message)

    # Get event metadata
    event_id = context.event_id
    event_type = context.event_type
    timestamp = context.timestamp

    logging.info(f"Event ID: {event_id}")
    logging.info(f"Event Type: {event_type}")
    logging.info(f"Timestamp: {timestamp}")

    try:
        # Process based on event type
        event_kind = message_data.get('event_type')

        if event_kind == 'order.created':
            handle_order_created(message_data)
        elif event_kind == 'order.shipped':
            handle_order_shipped(message_data)
        elif event_kind == 'order.cancelled':
            handle_order_cancelled(message_data)
        else:
            logging.warning(f"Unknown event type: {event_kind}")

        # Update Firestore
        save_event_to_firestore(event_id, message_data)

        # Publish result
        publish_result(message_data)

    except Exception as e:
        logging.error(f"Error: {e}")
        # Save failed event for debugging
        save_failed_event(event_id, message_data, str(e))
        raise

def handle_order_created(data: dict):
    """Handle order created event."""
    order_id = data['order_id']
    logging.info(f"Creating order: {order_id}")

    # Update inventory
    # Send confirmation email
    # Create shipping label
    pass

def handle_order_shipped(data: dict):
    """Handle order shipped event."""
    order_id = data['order_id']
    tracking = data['tracking_number']
    logging.info(f"Order {order_id} shipped: {tracking}")

    # Send tracking email
    # Update order status
    pass

def handle_order_cancelled(data: dict):
    """Handle order cancelled event."""
    order_id = data['order_id']
    logging.info(f"Cancelling order: {order_id}")

    # Refund payment
    # Restore inventory
    # Send cancellation email
    pass

def save_event_to_firestore(event_id: str, data: dict):
    """Save event to Firestore."""
    doc_ref = db.collection('events').document(event_id)
    doc_ref.set({
        'data': data,
        'processed_at': firestore.SERVER_TIMESTAMP
    })
    logging.info(f"Event saved to Firestore: {event_id}")

def save_failed_event(event_id: str, data: dict, error: str):
    """Save failed event for debugging."""
    doc_ref = db.collection('failed_events').document(event_id)
    doc_ref.set({
        'data': data,
        'error': error,
        'failed_at': firestore.SERVER_TIMESTAMP
    })

def publish_result(data: dict):
    """Publish processing result to another topic."""
    topic_path = publisher.topic_path(PROJECT_ID, 'order-results')

    result = {
        'order_id': data['order_id'],
        'processed': True,
        'timestamp': firestore.SERVER_TIMESTAMP
    }

    message_json = json.dumps(result, default=str)
    message_bytes = message_json.encode('utf-8')

    future = publisher.publish(topic_path, message_bytes)
    message_id = future.result()
    logging.info(f"Published result: {message_id}")
```

## Event-Driven Architectures

### Fan-Out Pattern with Cloud Functions

```python
# fan_out_pattern.py
"""
Deploy multiple Cloud Functions for different event types.

orders-topic → order-created-function
            → order-shipped-function
            → order-analytics-function
"""

# order_created_function/main.py
def handle_order_created(event, context):
    """Function specific to order created events."""
    import base64, json
    data = json.loads(base64.b64decode(event['data']).decode('utf-8'))

    if data.get('event_type') != 'order.created':
        return  # Ignore other events

    # Process order creation
    print(f"Order created: {data['order_id']}")

# order_shipped_function/main.py
def handle_order_shipped(event, context):
    """Function specific to order shipped events."""
    import base64, json
    data = json.loads(base64.b64decode(event['data']).decode('utf-8'))

    if data.get('event_type') != 'order.shipped':
        return  # Ignore other events

    # Send shipping notification
    print(f"Order shipped: {data['order_id']}")

# Deploy both functions
"""
gcloud functions deploy order-created-handler \
    --runtime python39 \
    --trigger-topic=orders-topic \
    --entry-point=handle_order_created

gcloud functions deploy order-shipped-handler \
    --runtime python39 \
    --trigger-topic=orders-topic \
    --entry-point=handle_order_shipped
"""
```

### Chaining Cloud Functions

```python
# chaining_functions.py
"""
Chain multiple processing steps using Pub/Sub.

Step 1 → process-topic-1 → Step 2 → process-topic-2 → Step 3
"""

# step1_function/main.py
from google.cloud import pubsub_v1
import base64, json, os

publisher = pubsub_v1.PublisherClient()
PROJECT_ID = os.environ.get('GCP_PROJECT')

def step1_process(event, context):
    """Step 1: Initial processing."""
    data = json.loads(base64.b64decode(event['data']).decode('utf-8'))

    # Process data
    processed_data = {
        'original': data,
        'step1_result': f"Processed by step 1",
        'timestamp': context.timestamp
    }

    # Publish to next step
    topic_path = publisher.topic_path(PROJECT_ID, 'process-topic-2')
    message = json.dumps(processed_data).encode('utf-8')
    publisher.publish(topic_path, message)

    print(f"Step 1 complete, published to topic-2")

# step2_function/main.py
def step2_process(event, context):
    """Step 2: Additional processing."""
    data = json.loads(base64.b64decode(event['data']).decode('utf-8'))

    # Continue processing
    processed_data = {
        **data,
        'step2_result': f"Processed by step 2"
    }

    # Publish to final step
    topic_path = publisher.topic_path(PROJECT_ID, 'process-topic-3')
    message = json.dumps(processed_data).encode('utf-8')
    publisher.publish(topic_path, message)

    print(f"Step 2 complete, published to topic-3")
```

## Apache Beam Basics

### Setting Up Apache Beam

```bash
# Install Apache Beam with GCP support
pip install apache-beam[gcp]==2.50.0

# Install additional dependencies
pip install google-cloud-pubsub==2.18.4
```

### Basic Beam Pipeline

```python
# beam_basic.py
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import json

def run_basic_pipeline():
    """Basic Apache Beam pipeline reading from Pub/Sub."""

    # Pipeline options
    options = PipelineOptions([
        '--streaming',
        '--project=your-project-id',
        '--region=us-central1',
        '--temp_location=gs://your-bucket/temp',
    ])

    # Create pipeline
    with beam.Pipeline(options=options) as pipeline:
        # Read from Pub/Sub
        messages = (
            pipeline
            | 'Read from Pub/Sub' >> beam.io.ReadFromPubSub(
                topic='projects/your-project-id/topics/orders-topic'
            )
        )

        # Parse JSON
        parsed = (
            messages
            | 'Parse JSON' >> beam.Map(lambda x: json.loads(x.decode('utf-8')))
        )

        # Extract order IDs
        order_ids = (
            parsed
            | 'Extract Order IDs' >> beam.Map(lambda x: x.get('order_id'))
        )

        # Log results
        order_ids | 'Log' >> beam.Map(print)

if __name__ == '__main__':
    run_basic_pipeline()
```

### Transforming Messages

```python
# beam_transform.py
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import json

class ParseMessage(beam.DoFn):
    """Parse and validate Pub/Sub messages."""

    def process(self, element):
        try:
            data = json.loads(element.decode('utf-8'))
            yield data
        except json.JSONDecodeError as e:
            # Log error
            print(f"Invalid JSON: {e}")

class EnrichOrder(beam.DoFn):
    """Enrich order data with additional information."""

    def process(self, order):
        # Add computed fields
        order['total_items'] = sum(item['quantity'] for item in order.get('items', []))
        order['processing_timestamp'] = beam.utils.timestamp.Timestamp.now()

        yield order

class FilterHighValue(beam.DoFn):
    """Filter high-value orders."""

    def process(self, order):
        if order.get('amount', 0) >= 100:
            yield order

def run_transform_pipeline():
    """Pipeline with transformations."""

    options = PipelineOptions([
        '--streaming',
        '--project=your-project-id',
        '--region=us-central1',
    ])

    with beam.Pipeline(options=options) as pipeline:
        orders = (
            pipeline
            | 'Read' >> beam.io.ReadFromPubSub(
                topic='projects/your-project-id/topics/orders-topic'
            )
            | 'Parse' >> beam.ParDo(ParseMessage())
            | 'Enrich' >> beam.ParDo(EnrichOrder())
            | 'Filter High Value' >> beam.ParDo(FilterHighValue())
            | 'Log' >> beam.Map(lambda x: print(f"High-value order: {x['order_id']}"))
        )

if __name__ == '__main__':
    run_transform_pipeline()
```

## Dataflow Pipelines

### Creating a Dataflow Pipeline

```python
# dataflow_pipeline.py
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions, StandardOptions
from apache_beam.transforms.window import FixedWindows
from apache_beam.transforms.trigger import AfterWatermark, AfterProcessingTime, AccumulationMode
import json
import logging

class DataflowOptions(PipelineOptions):
    """Custom options for Dataflow pipeline."""

    @classmethod
    def _add_argparse_args(cls, parser):
        parser.add_argument(
            '--input_topic',
            required=True,
            help='Input Pub/Sub topic'
        )
        parser.add_argument(
            '--output_topic',
            required=True,
            help='Output Pub/Sub topic'
        )

def run_dataflow_pipeline():
    """Run Dataflow pipeline for stream processing."""

    # Configure options
    options = DataflowOptions()
    options.view_as(StandardOptions).streaming = True

    with beam.Pipeline(options=options) as pipeline:
        # Read from Pub/Sub
        messages = (
            pipeline
            | 'Read Messages' >> beam.io.ReadFromPubSub(
                topic=options.input_topic
            )
        )

        # Parse and process
        processed = (
            messages
            | 'Decode' >> beam.Map(lambda x: x.decode('utf-8'))
            | 'Parse JSON' >> beam.Map(json.loads)
            | 'Process' >> beam.ParDo(ProcessOrder())
        )

        # Write results to output topic
        processed | 'Write Results' >> beam.io.WriteToPubSub(
            topic=options.output_topic
        )

class ProcessOrder(beam.DoFn):
    """Process order with state and timers."""

    def process(self, element):
        order_id = element.get('order_id')
        amount = element.get('amount')

        logging.info(f"Processing order {order_id}: ${amount}")

        # Transform data
        result = {
            'order_id': order_id,
            'original_amount': amount,
            'tax': amount * 0.1,
            'total': amount * 1.1,
            'processed': True
        }

        yield json.dumps(result).encode('utf-8')

if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run_dataflow_pipeline()
```

### Deploying to Dataflow

```bash
# Deploy Dataflow pipeline
python dataflow_pipeline.py \
    --runner=DataflowRunner \
    --project=your-project-id \
    --region=us-central1 \
    --temp_location=gs://your-bucket/temp \
    --staging_location=gs://your-bucket/staging \
    --input_topic=projects/your-project-id/topics/orders-topic \
    --output_topic=projects/your-project-id/topics/processed-orders \
    --job_name=order-processing-pipeline \
    --max_num_workers=10 \
    --autoscaling_algorithm=THROUGHPUT_BASED

# Monitor job
gcloud dataflow jobs list --region=us-central1

# View job details
gcloud dataflow jobs describe JOB_ID --region=us-central1

# Cancel job
gcloud dataflow jobs cancel JOB_ID --region=us-central1
```

## Windowing and Aggregations

### Fixed Windows

```python
# windowing.py
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.transforms.window import FixedWindows
from apache_beam.transforms import window
import json

def run_windowed_pipeline():
    """Pipeline with fixed windows for aggregation."""

    options = PipelineOptions([
        '--streaming',
        '--project=your-project-id',
    ])

    with beam.Pipeline(options=options) as pipeline:
        # Read and parse
        orders = (
            pipeline
            | 'Read' >> beam.io.ReadFromPubSub(
                topic='projects/your-project-id/topics/orders-topic'
            )
            | 'Parse' >> beam.Map(lambda x: json.loads(x.decode('utf-8')))
        )

        # Window into 60-second intervals
        windowed_orders = (
            orders
            | 'Window' >> beam.WindowInto(FixedWindows(60))
        )

        # Count orders per window
        order_counts = (
            windowed_orders
            | 'Count Orders' >> beam.combiners.Count.Globally().without_defaults()
        )

        # Sum amounts per window
        total_amounts = (
            windowed_orders
            | 'Extract Amounts' >> beam.Map(lambda x: x.get('amount', 0))
            | 'Sum Amounts' >> beam.CombineGlobally(sum).without_defaults()
        )

        # Log results
        order_counts | 'Log Counts' >> beam.Map(
            lambda count: print(f"Orders in window: {count}")
        )
        total_amounts | 'Log Totals' >> beam.Map(
            lambda total: print(f"Total amount in window: ${total:.2f}")
        )

if __name__ == '__main__':
    run_windowed_pipeline()
```

### Sliding Windows and Sessions

```python
# advanced_windowing.py
import apache_beam as beam
from apache_beam.transforms.window import SlidingWindows, Sessions
from apache_beam.transforms import window
import json

def sliding_window_pipeline():
    """Pipeline with sliding windows."""

    options = PipelineOptions(['--streaming'])

    with beam.Pipeline(options=options) as pipeline:
        orders = (
            pipeline
            | 'Read' >> beam.io.ReadFromPubSub(topic='...')
            | 'Parse' >> beam.Map(lambda x: json.loads(x.decode('utf-8')))
        )

        # Sliding window: 5-minute windows, every 1 minute
        windowed = (
            orders
            | 'Sliding Window' >> beam.WindowInto(
                SlidingWindows(size=300, period=60)  # seconds
            )
            | 'Count' >> beam.combiners.Count.Globally().without_defaults()
            | 'Log' >> beam.Map(print)
        )

def session_window_pipeline():
    """Pipeline with session windows."""

    options = PipelineOptions(['--streaming'])

    with beam.Pipeline(options=options) as pipeline:
        events = (
            pipeline
            | 'Read' >> beam.io.ReadFromPubSub(topic='...')
            | 'Parse' >> beam.Map(lambda x: json.loads(x.decode('utf-8')))
        )

        # Session window: group events within 10 minutes of each other
        sessions = (
            events
            | 'Add Key' >> beam.Map(lambda x: (x['user_id'], x))
            | 'Session Window' >> beam.WindowInto(
                Sessions(gap_size=600)  # 10 minutes
            )
            | 'Group by User' >> beam.GroupByKey()
            | 'Log Sessions' >> beam.Map(
                lambda x: print(f"User {x[0]} session: {len(x[1])} events")
            )
        )
```

### Complex Aggregations

```python
# aggregations.py
import apache_beam as beam
from apache_beam.transforms.window import FixedWindows
from apache_beam.transforms import combiners
import json

class CalculateStats(beam.CombineFn):
    """Calculate statistics for order amounts."""

    def create_accumulator(self):
        return (0, 0, float('inf'), float('-inf'), [])  # count, sum, min, max, values

    def add_input(self, accumulator, input):
        count, total, minimum, maximum, values = accumulator
        return (
            count + 1,
            total + input,
            min(minimum, input),
            max(maximum, input),
            values + [input]
        )

    def merge_accumulators(self, accumulators):
        counts, totals, minimums, maximums, all_values = zip(*accumulators)
        return (
            sum(counts),
            sum(totals),
            min(minimums),
            max(maximums),
            [v for values in all_values for v in values]
        )

    def extract_output(self, accumulator):
        count, total, minimum, maximum, values = accumulator
        avg = total / count if count > 0 else 0
        return {
            'count': count,
            'sum': total,
            'avg': avg,
            'min': minimum,
            'max': maximum
        }

def aggregation_pipeline():
    """Pipeline with complex aggregations."""

    options = PipelineOptions(['--streaming'])

    with beam.Pipeline(options=options) as pipeline:
        orders = (
            pipeline
            | 'Read' >> beam.io.ReadFromPubSub(topic='...')
            | 'Parse' >> beam.Map(lambda x: json.loads(x.decode('utf-8')))
            | 'Window' >> beam.WindowInto(FixedWindows(300))  # 5 minutes
        )

        # Calculate statistics
        stats = (
            orders
            | 'Extract Amounts' >> beam.Map(lambda x: x.get('amount', 0))
            | 'Calculate Stats' >> beam.CombineGlobally(
                CalculateStats()
            ).without_defaults()
            | 'Log Stats' >> beam.Map(
                lambda x: print(f"Window stats: {x}")
            )
        )

        # Group by category
        by_category = (
            orders
            | 'Key by Category' >> beam.Map(
                lambda x: (x.get('category', 'unknown'), x.get('amount', 0))
            )
            | 'Sum by Category' >> beam.CombinePerKey(sum)
            | 'Log by Category' >> beam.Map(
                lambda x: print(f"Category {x[0]}: ${x[1]:.2f}")
            )
        )
```

## Error Handling

### Handling Failed Messages

```python
# error_handling.py
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import json
import logging

class ParseWithErrorHandling(beam.DoFn):
    """Parse messages with error handling."""

    def process(self, element):
        try:
            data = json.loads(element.decode('utf-8'))
            yield beam.pvalue.TaggedOutput('success', data)
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse: {e}")
            yield beam.pvalue.TaggedOutput('errors', {
                'raw_data': element.decode('utf-8', errors='replace'),
                'error': str(e)
            })

def pipeline_with_error_handling():
    """Pipeline with error handling and dead letter queue."""

    options = PipelineOptions(['--streaming'])

    with beam.Pipeline(options=options) as pipeline:
        # Read messages
        messages = (
            pipeline
            | 'Read' >> beam.io.ReadFromPubSub(topic='...')
        )

        # Parse with error handling
        parsed = messages | 'Parse' >> beam.ParDo(
            ParseWithErrorHandling()
        ).with_outputs('success', 'errors')

        # Process successful messages
        processed = (
            parsed.success
            | 'Process' >> beam.Map(process_order)
            | 'Write Success' >> beam.io.WriteToPubSub(topic='...')
        )

        # Write errors to dead letter topic
        errors = (
            parsed.errors
            | 'Format Errors' >> beam.Map(lambda x: json.dumps(x).encode('utf-8'))
            | 'Write Errors' >> beam.io.WriteToPubSub(
                topic='projects/.../topics/dead-letter'
            )
        )

def process_order(order):
    """Process order with validation."""
    # Validate required fields
    required_fields = ['order_id', 'amount', 'customer_id']
    for field in required_fields:
        if field not in order:
            raise ValueError(f"Missing required field: {field}")

    # Process
    return {
        'order_id': order['order_id'],
        'processed': True
    }
```

## Monitoring and Optimization

### Monitoring Dataflow Jobs

```python
# monitoring.py
from google.cloud import monitoring_v3
import time

def get_dataflow_metrics(project_id: str, job_id: str):
    """Get metrics for Dataflow job."""

    client = monitoring_v3.MetricServiceClient()
    project_name = f"projects/{project_id}"

    # Query for system lag
    now = time.time()
    seconds = int(now)
    nanos = int((now - seconds) * 10 ** 9)

    interval = monitoring_v3.TimeInterval({
        "end_time": {"seconds": seconds, "nanos": nanos},
        "start_time": {"seconds": (seconds - 3600), "nanos": nanos},
    })

    results = client.list_time_series(
        request={
            "name": project_name,
            "filter": f'metric.type="dataflow.googleapis.com/job/system_lag" '
                     f'AND resource.labels.job_id="{job_id}"',
            "interval": interval,
        }
    )

    print(f"Dataflow Job Metrics ({job_id}):")
    for result in results:
        for point in result.points:
            print(f"  System lag: {point.value.int64_value}ms")
```

### Performance Optimization

```python
# optimization.py

# 1. Use efficient serialization
class EfficientDoFn(beam.DoFn):
    """Optimize DoFn performance."""

    def __init__(self):
        self._client = None

    def setup(self):
        """Initialize expensive resources once."""
        from google.cloud import firestore
        self._client = firestore.Client()

    def process(self, element):
        # Use initialized client
        result = self._client.collection('orders').document(element['order_id']).get()
        yield result.to_dict()

# 2. Batch operations
class BatchedWrite(beam.DoFn):
    """Batch writes for better performance."""

    def process_batch(self, batch):
        # Process entire batch at once
        results = process_batch_to_database(batch)
        for result in results:
            yield result

# 3. Use side inputs efficiently
def with_side_inputs():
    """Example using side inputs."""
    with beam.Pipeline() as pipeline:
        # Main data
        orders = pipeline | 'Read Orders' >> beam.io.ReadFromPubSub(topic='...')

        # Side input (lookup data)
        products = pipeline | 'Read Products' >> beam.io.ReadFromBigQuery(...)

        # Join using side input
        enriched = orders | 'Enrich' >> beam.ParDo(
            EnrichWithProducts(),
            products=beam.pvalue.AsList(products)
        )
```

## Advanced Patterns

### Stateful Processing

```python
# stateful_processing.py
import apache_beam as beam
from apache_beam.transforms import userstate

class StatefulDoFn(beam.DoFn):
    """DoFn with state for tracking order history."""

    ORDER_COUNT_STATE = userstate.CombiningValueStateSpec(
        'order_count', combine_fn=sum
    )

    def process(self, element, order_count=beam.DoFn.StateParam(ORDER_COUNT_STATE)):
        user_id = element['user_id']

        # Read current count
        current_count = order_count.read() or 0

        # Increment
        order_count.add(1)
        new_count = current_count + 1

        print(f"User {user_id} has placed {new_count} orders")

        yield {
            'user_id': user_id,
            'order_count': new_count,
            'order': element
        }
```

## Summary

In this tutorial, you learned:

- Creating Cloud Functions triggered by Pub/Sub
- Building event-driven serverless architectures
- Developing Apache Beam pipelines for stream processing
- Deploying and managing Dataflow jobs
- Implementing windowing and aggregations
- Handling errors in streaming pipelines
- Monitoring and optimizing Dataflow performance

## Next Steps

- Continue to [Tutorial 07: BigQuery and Data Pipeline Integration](../07_bigquery_integration/README.md)
- Learn about [Global Deployment and Monitoring](../08_global_deployment/README.md)
- Review [Dataflow Best Practices](https://cloud.google.com/dataflow/docs/guides/deploying-a-pipeline)
