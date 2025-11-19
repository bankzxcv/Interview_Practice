# Tutorial 07: BigQuery and Data Pipeline Integration

## Overview

This tutorial explores integrating Google Cloud Pub/Sub with BigQuery for real-time analytics and data warehousing. You'll learn to stream data directly from Pub/Sub to BigQuery, create data transformation pipelines, and build real-time analytics dashboards.

## Prerequisites

- Completed [Tutorial 06: Cloud Functions and Dataflow Integration](../06_dataflow_integration/README.md)
- Understanding of SQL and data warehousing concepts
- Basic knowledge of BigQuery

## Learning Objectives

By the end of this tutorial, you will be able to:

1. Create BigQuery subscriptions for direct streaming
2. Stream data from Pub/Sub to BigQuery using Dataflow
3. Design schemas and partition strategies
4. Transform and enrich data during ingestion
5. Build real-time analytics queries
6. Optimize BigQuery for streaming workloads
7. Implement cost-effective data pipelines

## Table of Contents

1. [BigQuery Subscriptions](#bigquery-subscriptions)
2. [Dataflow to BigQuery](#dataflow-to-bigquery)
3. [Schema Design](#schema-design)
4. [Data Transformation](#data-transformation)
5. [Real-Time Analytics](#real-time-analytics)
6. [Cost Optimization](#cost-optimization)
7. [Best Practices](#best-practices)
8. [Advanced Patterns](#advanced-patterns)

## BigQuery Subscriptions

### What are BigQuery Subscriptions?

BigQuery subscriptions allow you to write messages from a Pub/Sub topic directly into a BigQuery table without writing any code. This is the simplest way to get streaming data into BigQuery.

### Creating BigQuery Tables

```sql
-- create_tables.sql
-- Create dataset
CREATE SCHEMA IF NOT EXISTS analytics
OPTIONS(
  description="Analytics data from Pub/Sub",
  location="US"
);

-- Create orders table
CREATE TABLE IF NOT EXISTS analytics.orders (
  order_id STRING NOT NULL,
  customer_id STRING NOT NULL,
  amount FLOAT64 NOT NULL,
  currency STRING NOT NULL,
  status STRING NOT NULL,
  created_at TIMESTAMP NOT NULL,
  items ARRAY<STRUCT<
    product_id STRING,
    quantity INT64,
    price FLOAT64
  >>,
  metadata STRUCT<
    source STRING,
    version STRING,
    ip_address STRING
  >,
  -- Pub/Sub metadata
  publish_time TIMESTAMP,
  message_id STRING,
  attributes JSON
)
PARTITION BY DATE(created_at)
CLUSTER BY customer_id, status
OPTIONS(
  description="Orders streamed from Pub/Sub",
  require_partition_filter=true
);

-- Create events table for raw events
CREATE TABLE IF NOT EXISTS analytics.events (
  event_id STRING NOT NULL,
  event_type STRING NOT NULL,
  user_id STRING,
  event_data JSON,
  timestamp TIMESTAMP NOT NULL,
  publish_time TIMESTAMP,
  message_id STRING
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_type, user_id;
```

### Creating BigQuery Subscription

```python
# bigquery_subscription.py
from google.cloud import pubsub_v1

def create_bigquery_subscription(
    project_id: str,
    topic_id: str,
    subscription_id: str,
    dataset_id: str,
    table_id: str
):
    """
    Create a BigQuery subscription.

    Args:
        project_id: Your GCP project ID
        topic_id: Source Pub/Sub topic
        subscription_id: Subscription ID
        dataset_id: BigQuery dataset
        table_id: BigQuery table
    """
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    # Configure BigQuery settings
    bigquery_config = pubsub_v1.types.BigQueryConfig(
        table=f"{project_id}.{dataset_id}.{table_id}",
        use_topic_schema=True,
        write_metadata=True,  # Include publish_time, message_id, attributes
    )

    try:
        subscription = subscriber.create_subscription(
            request={
                "name": subscription_path,
                "topic": topic_path,
                "bigquery_config": bigquery_config,
            }
        )
        print(f"✓ BigQuery subscription created: {subscription.name}")
        print(f"  Writing to: {bigquery_config.table}")
        return subscription
    except Exception as e:
        print(f"✗ Error creating subscription: {e}")
        raise

def update_bigquery_subscription(
    project_id: str,
    subscription_id: str,
    use_table_schema: bool = True
):
    """
    Update BigQuery subscription configuration.

    Args:
        project_id: Your GCP project ID
        subscription_id: Subscription to update
        use_table_schema: Use table schema instead of message schema
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    subscription = subscriber.update_subscription(
        request={
            "subscription": {
                "name": subscription_path,
                "bigquery_config": {
                    "use_table_schema": use_table_schema,
                },
            },
            "update_mask": {"paths": ["bigquery_config.use_table_schema"]},
        }
    )
    print(f"✓ Subscription updated")
    return subscription

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "orders-topic"
    SUBSCRIPTION_ID = "orders-to-bigquery"
    DATASET_ID = "analytics"
    TABLE_ID = "orders"

    create_bigquery_subscription(
        PROJECT_ID, TOPIC_ID, SUBSCRIPTION_ID, DATASET_ID, TABLE_ID
    )
```

### Using gcloud CLI

```bash
# Create BigQuery subscription
gcloud pubsub subscriptions create orders-to-bigquery \
    --topic=orders-topic \
    --bigquery-table=your-project-id:analytics.orders \
    --use-topic-schema \
    --write-metadata

# Grant BigQuery permissions
gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:service-PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com" \
    --role="roles/bigquery.dataEditor"
```

### Publishing Compatible Messages

```python
# publish_to_bigquery.py
from google.cloud import pubsub_v1
import json
from datetime import datetime
import uuid

def publish_order_to_bigquery(project_id: str, topic_id: str):
    """
    Publish order message compatible with BigQuery schema.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic with BigQuery subscription
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    # Create order message matching BigQuery schema
    order = {
        "order_id": f"ORD-{uuid.uuid4().hex[:8]}",
        "customer_id": f"CUST-{uuid.uuid4().hex[:8]}",
        "amount": 299.99,
        "currency": "USD",
        "status": "PENDING",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "items": [
            {
                "product_id": "PROD-001",
                "quantity": 2,
                "price": 99.99
            },
            {
                "product_id": "PROD-002",
                "quantity": 1,
                "price": 99.99
            }
        ],
        "metadata": {
            "source": "web_app",
            "version": "1.0",
            "ip_address": "192.168.1.1"
        }
    }

    # Publish
    message_json = json.dumps(order)
    message_bytes = message_json.encode("utf-8")

    future = publisher.publish(topic_path, message_bytes)
    message_id = future.result()

    print(f"✓ Published order: {order['order_id']}")
    print(f"  Message ID: {message_id}")
    print(f"  Will appear in BigQuery shortly")

    return message_id

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "orders-topic"

    # Publish multiple orders
    for i in range(10):
        publish_order_to_bigquery(PROJECT_ID, TOPIC_ID)
```

## Dataflow to BigQuery

### Dataflow Pipeline for BigQuery

```python
# dataflow_to_bigquery.py
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.io.gcp.bigquery import WriteToBigQuery, BigQueryDisposition
import json
from datetime import datetime

class ParseAndEnrich(beam.DoFn):
    """Parse Pub/Sub message and enrich for BigQuery."""

    def process(self, element):
        try:
            # Parse JSON
            data = json.loads(element.decode('utf-8'))

            # Enrich with processing metadata
            enriched = {
                **data,
                'processed_at': datetime.utcnow().isoformat(),
                'pipeline_version': '1.0'
            }

            yield enriched

        except json.JSONDecodeError as e:
            # Log error and skip
            print(f"Failed to parse: {e}")

def run_pubsub_to_bigquery_pipeline():
    """Run Dataflow pipeline from Pub/Sub to BigQuery."""

    # BigQuery table schema
    table_schema = {
        'fields': [
            {'name': 'order_id', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'customer_id', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'amount', 'type': 'FLOAT64', 'mode': 'REQUIRED'},
            {'name': 'currency', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'status', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'created_at', 'type': 'TIMESTAMP', 'mode': 'REQUIRED'},
            {'name': 'items', 'type': 'RECORD', 'mode': 'REPEATED', 'fields': [
                {'name': 'product_id', 'type': 'STRING'},
                {'name': 'quantity', 'type': 'INT64'},
                {'name': 'price', 'type': 'FLOAT64'},
            ]},
            {'name': 'processed_at', 'type': 'TIMESTAMP', 'mode': 'NULLABLE'},
            {'name': 'pipeline_version', 'type': 'STRING', 'mode': 'NULLABLE'},
        ]
    }

    # Pipeline options
    options = PipelineOptions([
        '--streaming',
        '--project=your-project-id',
        '--region=us-central1',
        '--temp_location=gs://your-bucket/temp',
    ])

    with beam.Pipeline(options=options) as pipeline:
        orders = (
            pipeline
            | 'Read from Pub/Sub' >> beam.io.ReadFromPubSub(
                topic='projects/your-project-id/topics/orders-topic'
            )
            | 'Parse and Enrich' >> beam.ParDo(ParseAndEnrich())
            | 'Write to BigQuery' >> WriteToBigQuery(
                table='your-project-id:analytics.orders',
                schema=table_schema,
                write_disposition=BigQueryDisposition.WRITE_APPEND,
                create_disposition=BigQueryDisposition.CREATE_IF_NEEDED,
            )
        )

if __name__ == '__main__':
    run_pubsub_to_bigquery_pipeline()
```

### Advanced Dataflow Pipeline with Transformations

```python
# advanced_dataflow_bigquery.py
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.transforms.window import FixedWindows
from apache_beam.io.gcp.bigquery import WriteToBigQuery
import json

class TransformOrder(beam.DoFn):
    """Transform and validate order data."""

    def process(self, element):
        data = json.loads(element.decode('utf-8'))

        # Validation
        if not data.get('order_id'):
            yield beam.pvalue.TaggedOutput('errors', {
                'error': 'Missing order_id',
                'data': data
            })
            return

        # Calculate derived fields
        total_items = sum(item['quantity'] for item in data.get('items', []))
        tax = data['amount'] * 0.1
        total = data['amount'] + tax

        # Transform
        transformed = {
            'order_id': data['order_id'],
            'customer_id': data['customer_id'],
            'amount': data['amount'],
            'tax': tax,
            'total': total,
            'currency': data['currency'],
            'status': data['status'],
            'total_items': total_items,
            'created_at': data['created_at'],
        }

        yield transformed

def run_advanced_pipeline():
    """Advanced pipeline with validation and multiple outputs."""

    options = PipelineOptions(['--streaming'])

    with beam.Pipeline(options=options) as pipeline:
        # Read messages
        messages = (
            pipeline
            | 'Read' >> beam.io.ReadFromPubSub(
                topic='projects/your-project-id/topics/orders-topic'
            )
        )

        # Transform with error handling
        transformed = (
            messages
            | 'Transform' >> beam.ParDo(TransformOrder()).with_outputs(
                'errors', main='main'
            )
        )

        # Write valid orders to main table
        transformed.main | 'Write Orders' >> WriteToBigQuery(
            table='your-project-id:analytics.orders_transformed',
            write_disposition=WriteToBigQuery.WRITE_APPEND,
        )

        # Write errors to error table
        transformed.errors | 'Write Errors' >> WriteToBigQuery(
            table='your-project-id:analytics.order_errors',
            write_disposition=WriteToBigQuery.WRITE_APPEND,
        )
```

## Schema Design

### Partitioning and Clustering

```sql
-- partitioning_clustering.sql

-- Time-series data with daily partitions
CREATE TABLE analytics.orders_partitioned (
  order_id STRING,
  customer_id STRING,
  amount FLOAT64,
  created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY customer_id, amount
OPTIONS(
  partition_expiration_days=365,
  require_partition_filter=true
);

-- Integer range partitioning
CREATE TABLE analytics.orders_by_amount (
  order_id STRING,
  amount FLOAT64,
  created_at TIMESTAMP
)
PARTITION BY RANGE_BUCKET(amount, GENERATE_ARRAY(0, 1000, 100))
CLUSTER BY created_at;

-- Ingestion-time partitioning
CREATE TABLE analytics.events_ingestion (
  event_id STRING,
  event_type STRING,
  event_data JSON,
  created_at TIMESTAMP
)
PARTITION BY _PARTITIONDATE
OPTIONS(
  partition_expiration_days=90
);
```

### Nested and Repeated Fields

```sql
-- nested_schema.sql

-- Complex nested structure
CREATE TABLE analytics.orders_nested (
  order_id STRING,
  customer STRUCT<
    customer_id STRING,
    name STRING,
    email STRING,
    address STRUCT<
      street STRING,
      city STRING,
      state STRING,
      zip STRING
    >
  >,
  items ARRAY<STRUCT<
    product_id STRING,
    name STRING,
    quantity INT64,
    price FLOAT64,
    metadata STRUCT<
      category STRING,
      brand STRING,
      tags ARRAY<STRING>
    >
  >>,
  payment STRUCT<
    method STRING,
    amount FLOAT64,
    currency STRING,
    transaction_id STRING
  >,
  created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY customer.customer_id;
```

## Data Transformation

### Using SQL for Transformation

```sql
-- transformations.sql

-- Create view with transformations
CREATE OR REPLACE VIEW analytics.orders_analytics AS
SELECT
  order_id,
  customer_id,
  amount,
  currency,
  status,
  created_at,
  DATE(created_at) as order_date,
  EXTRACT(HOUR FROM created_at) as order_hour,
  EXTRACT(DAYOFWEEK FROM created_at) as day_of_week,
  ARRAY_LENGTH(items) as item_count,
  (SELECT SUM(quantity) FROM UNNEST(items)) as total_quantity,
  ROUND(amount * 1.1, 2) as amount_with_tax,
  CASE
    WHEN amount < 50 THEN 'Small'
    WHEN amount < 200 THEN 'Medium'
    ELSE 'Large'
  END as order_size
FROM analytics.orders;

-- Materialized view for better performance
CREATE MATERIALIZED VIEW analytics.daily_order_summary
PARTITION BY order_date
AS
SELECT
  DATE(created_at) as order_date,
  COUNT(*) as order_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  COUNT(DISTINCT customer_id) as unique_customers
FROM analytics.orders
GROUP BY order_date;

-- Refresh materialized view (can be automated)
-- No explicit refresh needed for BigQuery materialized views
```

### Data Enrichment in Dataflow

```python
# enrichment.py
import apache_beam as beam
from apache_beam.io.gcp.bigquery import ReadFromBigQuery

class EnrichWithCustomerData(beam.DoFn):
    """Enrich orders with customer data from BigQuery."""

    def process(self, element, customer_data):
        """
        Args:
            element: Order data
            customer_data: Side input with customer information
        """
        customer_id = element['customer_id']

        # Lookup customer data
        customer_map = {c['customer_id']: c for c in customer_data}
        customer = customer_map.get(customer_id, {})

        # Enrich order
        enriched = {
            **element,
            'customer_name': customer.get('name'),
            'customer_email': customer.get('email'),
            'customer_segment': customer.get('segment'),
            'customer_lifetime_value': customer.get('lifetime_value')
        }

        yield enriched

def enrichment_pipeline():
    """Pipeline with data enrichment."""

    with beam.Pipeline() as pipeline:
        # Read customer data as side input
        customers = (
            pipeline
            | 'Read Customers' >> ReadFromBigQuery(
                query='SELECT customer_id, name, email, segment, lifetime_value '
                      'FROM `analytics.customers`'
            )
        )

        # Read orders from Pub/Sub
        orders = (
            pipeline
            | 'Read Orders' >> beam.io.ReadFromPubSub(topic='...')
            | 'Parse' >> beam.Map(lambda x: json.loads(x.decode('utf-8')))
        )

        # Enrich orders with customer data
        enriched_orders = (
            orders
            | 'Enrich' >> beam.ParDo(
                EnrichWithCustomerData(),
                customer_data=beam.pvalue.AsList(customers)
            )
            | 'Write' >> beam.io.WriteToBigQuery(
                table='analytics.orders_enriched'
            )
        )
```

## Real-Time Analytics

### Real-Time Dashboard Queries

```sql
-- analytics_queries.sql

-- Orders in last hour
SELECT
  COUNT(*) as order_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  COUNT(DISTINCT customer_id) as unique_customers
FROM analytics.orders
WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR);

-- Top products by revenue (last 24 hours)
SELECT
  item.product_id,
  COUNT(*) as order_count,
  SUM(item.quantity) as total_quantity,
  SUM(item.quantity * item.price) as total_revenue
FROM analytics.orders,
UNNEST(items) as item
WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
GROUP BY item.product_id
ORDER BY total_revenue DESC
LIMIT 10;

-- Customer segmentation
WITH customer_metrics AS (
  SELECT
    customer_id,
    COUNT(*) as order_count,
    SUM(amount) as total_spent,
    AVG(amount) as avg_order_value,
    MAX(created_at) as last_order_date,
    DATE_DIFF(CURRENT_DATE(), DATE(MAX(created_at)), DAY) as days_since_last_order
  FROM analytics.orders
  WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
  GROUP BY customer_id
)
SELECT
  CASE
    WHEN total_spent > 1000 AND days_since_last_order < 30 THEN 'VIP Active'
    WHEN total_spent > 500 AND days_since_last_order < 30 THEN 'High Value Active'
    WHEN days_since_last_order > 60 THEN 'At Risk'
    ELSE 'Regular'
  END as segment,
  COUNT(*) as customer_count,
  AVG(total_spent) as avg_total_spent
FROM customer_metrics
GROUP BY segment;

-- Time series analysis
SELECT
  TIMESTAMP_TRUNC(created_at, HOUR) as hour,
  COUNT(*) as order_count,
  SUM(amount) as revenue
FROM analytics.orders
WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY hour
ORDER BY hour;
```

### Streaming Analytics

```sql
-- streaming_analytics.sql

-- Create streaming analytics table
CREATE TABLE analytics.order_metrics (
  metric_timestamp TIMESTAMP,
  window_duration_minutes INT64,
  order_count INT64,
  total_amount FLOAT64,
  avg_amount FLOAT64,
  unique_customers INT64
)
PARTITION BY DATE(metric_timestamp);

-- Scheduled query to aggregate streaming data
-- (Set up in BigQuery console or via API)
INSERT INTO analytics.order_metrics
SELECT
  TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), MINUTE) as metric_timestamp,
  5 as window_duration_minutes,
  COUNT(*) as order_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  COUNT(DISTINCT customer_id) as unique_customers
FROM analytics.orders
WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 5 MINUTE);
```

## Cost Optimization

### Strategies for Cost Reduction

```sql
-- cost_optimization.sql

-- 1. Use partitioning to reduce data scanned
-- Good: Scans only one partition
SELECT COUNT(*)
FROM analytics.orders
WHERE DATE(created_at) = '2024-01-15';

-- Bad: Full table scan
SELECT COUNT(*)
FROM analytics.orders
WHERE created_at >= '2024-01-15';

-- 2. Use clustering for frequent filters
-- Efficient with customer_id clustering
SELECT *
FROM analytics.orders
WHERE customer_id = 'CUST-123';

-- 3. Limit columns selected
-- Good: Only needed columns
SELECT order_id, amount, created_at
FROM analytics.orders;

-- Bad: All columns
SELECT *
FROM analytics.orders;

-- 4. Use approximate aggregations for large datasets
SELECT
  APPROX_COUNT_DISTINCT(customer_id) as approx_customers,
  APPROX_QUANTILES(amount, 100)[OFFSET(50)] as median_amount
FROM analytics.orders;

-- 5. Set partition expiration
ALTER TABLE analytics.orders
SET OPTIONS (partition_expiration_days=365);
```

### Optimizing Streaming Inserts

```python
# optimize_streaming.py

# Use BigQuery Storage Write API for better performance
from google.cloud import bigquery_storage_v1
from google.cloud.bigquery_storage_v1 import types
from google.cloud.bigquery_storage_v1 import writer
import json

def write_to_bigquery_storage_api(project_id: str, dataset_id: str, table_id: str, rows: list):
    """
    Write to BigQuery using Storage Write API for better performance.

    Args:
        project_id: Your GCP project ID
        dataset_id: Dataset ID
        table_id: Table ID
        rows: List of dictionaries to write
    """
    client = bigquery_storage_v1.BigQueryWriteClient()

    # Create write stream
    parent = f"projects/{project_id}/datasets/{dataset_id}/tables/{table_id}"
    write_stream = types.WriteStream()

    stream = client.create_write_stream(
        parent=parent,
        write_stream=write_stream
    )

    # Serialize rows
    serialized_rows = []
    for row in rows:
        serialized_rows.append(json.dumps(row).encode('utf-8'))

    # Write rows
    request = types.AppendRowsRequest()
    request.write_stream = stream.name
    request.rows = types.AppendRowsRequest.ProtoData()

    # Send request
    response = client.append_rows(iter([request]))

    print(f"✓ Wrote {len(rows)} rows to BigQuery")
```

## Best Practices

### Schema Evolution

```sql
-- schema_evolution.sql

-- Add new column (safe)
ALTER TABLE analytics.orders
ADD COLUMN IF NOT EXISTS discount_amount FLOAT64;

-- Modify column type (requires recreation)
-- 1. Create new table with new schema
CREATE TABLE analytics.orders_v2 AS
SELECT
  order_id,
  customer_id,
  CAST(amount AS NUMERIC) as amount,  -- Changed from FLOAT64
  -- ... other columns
FROM analytics.orders;

-- 2. Update references
-- 3. Delete old table when safe
```

### Error Handling

```python
# bigquery_error_handling.py
from google.cloud import bigquery
from google.api_core import exceptions

def insert_with_error_handling(client: bigquery.Client, table_id: str, rows: list):
    """Insert rows with comprehensive error handling."""

    try:
        errors = client.insert_rows_json(table_id, rows)

        if errors:
            print(f"Encountered errors:")
            for error in errors:
                print(f"  Row: {error['index']}")
                print(f"  Errors: {error['errors']}")
        else:
            print(f"✓ Inserted {len(rows)} rows")

    except exceptions.BadRequest as e:
        print(f"✗ Bad request: {e}")
        # Handle schema mismatch, etc.

    except exceptions.Forbidden as e:
        print(f"✗ Permission denied: {e}")

    except Exception as e:
        print(f"✗ Unexpected error: {e}")
```

## Advanced Patterns

### Change Data Capture (CDC)

```python
# cdc_pattern.py
"""
Implement CDC pattern using Pub/Sub and BigQuery.

Database → Change Stream → Pub/Sub → BigQuery
"""

def publish_database_change(change_type: str, table: str, data: dict):
    """Publish database change event."""
    from google.cloud import pubsub_v1
    import json

    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path('project-id', 'database-changes')

    event = {
        'change_type': change_type,  # INSERT, UPDATE, DELETE
        'table': table,
        'data': data,
        'timestamp': datetime.utcnow().isoformat()
    }

    message = json.dumps(event).encode('utf-8')
    publisher.publish(topic_path, message)
```

### Multi-Table Ingestion

```python
# multi_table.py
"""Route messages to different BigQuery tables based on content."""

class RouteToBigQuery(beam.DoFn):
    """Route messages to appropriate BigQuery tables."""

    def process(self, element):
        data = json.loads(element.decode('utf-8'))
        event_type = data.get('event_type')

        # Route based on event type
        if event_type == 'order':
            yield beam.pvalue.TaggedOutput('orders', data)
        elif event_type == 'customer':
            yield beam.pvalue.TaggedOutput('customers', data)
        elif event_type == 'product':
            yield beam.pvalue.TaggedOutput('products', data)

def multi_table_pipeline():
    """Pipeline writing to multiple BigQuery tables."""

    with beam.Pipeline() as pipeline:
        messages = (
            pipeline
            | 'Read' >> beam.io.ReadFromPubSub(topic='...')
            | 'Route' >> beam.ParDo(RouteToBigQuery()).with_outputs(
                'orders', 'customers', 'products'
            )
        )

        # Write to respective tables
        messages.orders | 'Write Orders' >> beam.io.WriteToBigQuery(
            table='analytics.orders'
        )

        messages.customers | 'Write Customers' >> beam.io.WriteToBigQuery(
            table='analytics.customers'
        )

        messages.products | 'Write Products' >> beam.io.WriteToBigQuery(
            table='analytics.products'
        )
```

## Summary

In this tutorial, you learned:

- Creating BigQuery subscriptions for direct Pub/Sub streaming
- Building Dataflow pipelines to BigQuery
- Designing efficient schemas with partitioning and clustering
- Transforming and enriching streaming data
- Running real-time analytics queries
- Optimizing costs for streaming workloads
- Implementing advanced patterns like CDC and multi-table ingestion

## Next Steps

- Continue to [Tutorial 08: Global Deployment and Monitoring](../08_global_deployment/README.md)
- Explore [BigQuery Best Practices](https://cloud.google.com/bigquery/docs/best-practices)
- Review [Streaming Ingestion Patterns](https://cloud.google.com/architecture/streaming-data-into-bigquery)
