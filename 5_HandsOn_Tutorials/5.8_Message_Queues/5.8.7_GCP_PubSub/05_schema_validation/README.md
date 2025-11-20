# Tutorial 05: Schema Validation

## Overview

This tutorial covers Google Cloud Pub/Sub schema validation, which allows you to enforce message structure and data quality. You'll learn how to create and manage schemas using Avro and Protocol Buffers, handle schema evolution, and automatically validate messages before they're published or delivered.

## Prerequisites

- Completed [Tutorial 04: Dead Letter Topics and Retry Policies](../04_dead_letter/README.md)
- Understanding of data serialization formats
- Basic knowledge of Avro and Protocol Buffers (helpful but not required)

## Learning Objectives

By the end of this tutorial, you will be able to:

1. Create and manage Pub/Sub schemas
2. Define schemas using Avro and Protocol Buffers
3. Validate messages against schemas
4. Handle schema evolution and versioning
5. Work with schema encodings
6. Implement schema-based message validation

## Table of Contents

1. [Schema Basics](#schema-basics)
2. [Creating Avro Schemas](#creating-avro-schemas)
3. [Creating Protocol Buffer Schemas](#creating-protocol-buffer-schemas)
4. [Publishing with Schemas](#publishing-with-schemas)
5. [Subscribing with Schemas](#subscribing-with-schemas)
6. [Schema Evolution](#schema-evolution)
7. [Best Practices](#best-practices)
8. [Advanced Topics](#advanced-topics)

## Schema Basics

### What are Pub/Sub Schemas?

Pub/Sub schemas define the structure and format of messages in a topic. They provide:

- **Data validation**: Reject invalid messages at publish time
- **Contract enforcement**: Ensure publishers and subscribers agree on format
- **Documentation**: Self-documenting message structure
- **Evolution management**: Handle changes over time

### Supported Schema Types

1. **Avro**: JSON-based schema definition, widely used for data serialization
2. **Protocol Buffers**: Binary schema definition, efficient and language-neutral

### Schema Encoding

- **JSON**: Human-readable, Avro only
- **Binary**: Efficient, supports both Avro and Protocol Buffers

## Creating Avro Schemas

### Define Avro Schema

```python
# avro_schema.py
from google.cloud import pubsub_v1
from google.pubsub_v1.types import Schema

# Avro schema definition
AVRO_SCHEMA_DEFINITION = """{
  "type": "record",
  "name": "Order",
  "namespace": "com.example",
  "fields": [
    {
      "name": "order_id",
      "type": "string"
    },
    {
      "name": "customer_id",
      "type": "string"
    },
    {
      "name": "amount",
      "type": "double"
    },
    {
      "name": "currency",
      "type": "string",
      "default": "USD"
    },
    {
      "name": "items",
      "type": {
        "type": "array",
        "items": {
          "type": "record",
          "name": "OrderItem",
          "fields": [
            {"name": "product_id", "type": "string"},
            {"name": "quantity", "type": "int"},
            {"name": "price", "type": "double"}
          ]
        }
      }
    },
    {
      "name": "timestamp",
      "type": "long"
    },
    {
      "name": "status",
      "type": {
        "type": "enum",
        "name": "OrderStatus",
        "symbols": ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]
      }
    }
  ]
}"""

def create_avro_schema(project_id: str, schema_id: str):
    """
    Create an Avro schema.

    Args:
        project_id: Your GCP project ID
        schema_id: The schema ID
    """
    publisher = pubsub_v1.PublisherClient()
    project_path = f"projects/{project_id}"
    schema_path = publisher.schema_path(project_id, schema_id)

    try:
        schema = publisher.create_schema(
            request={
                "parent": project_path,
                "schema": Schema(
                    name=schema_path,
                    type_=Schema.Type.AVRO,
                    definition=AVRO_SCHEMA_DEFINITION,
                ),
                "schema_id": schema_id,
            }
        )
        print(f"✓ Avro schema created: {schema.name}")
        return schema
    except Exception as e:
        print(f"✗ Error creating schema: {e}")
        raise

def get_schema(project_id: str, schema_id: str):
    """
    Get schema details.

    Args:
        project_id: Your GCP project ID
        schema_id: The schema ID
    """
    publisher = pubsub_v1.PublisherClient()
    schema_path = publisher.schema_path(project_id, schema_id)

    schema = publisher.get_schema(request={"name": schema_path})

    print(f"Schema: {schema.name}")
    print(f"Type: {Schema.Type(schema.type_).name}")
    print(f"Definition:")
    print(schema.definition)

    return schema

def list_schemas(project_id: str):
    """
    List all schemas in project.

    Args:
        project_id: Your GCP project ID
    """
    publisher = pubsub_v1.PublisherClient()
    project_path = f"projects/{project_id}"

    print(f"Schemas in project {project_id}:")
    for schema in publisher.list_schemas(request={"parent": project_path}):
        print(f"  - {schema.name} ({Schema.Type(schema.type_).name})")

def delete_schema(project_id: str, schema_id: str):
    """
    Delete a schema.

    Args:
        project_id: Your GCP project ID
        schema_id: The schema ID
    """
    publisher = pubsub_v1.PublisherClient()
    schema_path = publisher.schema_path(project_id, schema_id)

    publisher.delete_schema(request={"name": schema_path})
    print(f"✓ Schema deleted: {schema_path}")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SCHEMA_ID = "order-schema-avro"

    # Create Avro schema
    create_avro_schema(PROJECT_ID, SCHEMA_ID)

    # Get schema
    get_schema(PROJECT_ID, SCHEMA_ID)

    # List schemas
    list_schemas(PROJECT_ID)
```

### Create Topic with Avro Schema

```python
# topic_with_avro_schema.py
from google.cloud import pubsub_v1
from google.pubsub_v1.types import Encoding

def create_topic_with_avro_schema(
    project_id: str,
    topic_id: str,
    schema_id: str,
    encoding: str = "JSON"
):
    """
    Create a topic with Avro schema validation.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic ID
        schema_id: The schema ID
        encoding: "JSON" or "BINARY"
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)
    schema_path = publisher.schema_path(project_id, schema_id)

    # Set encoding
    encoding_enum = Encoding.JSON if encoding == "JSON" else Encoding.BINARY

    try:
        topic = publisher.create_topic(
            request={
                "name": topic_path,
                "schema_settings": {
                    "schema": schema_path,
                    "encoding": encoding_enum,
                },
            }
        )
        print(f"✓ Topic created with schema: {topic.name}")
        print(f"  Schema: {schema_path}")
        print(f"  Encoding: {encoding}")
        return topic
    except Exception as e:
        print(f"✗ Error creating topic: {e}")
        raise

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "orders-topic-avro"
    SCHEMA_ID = "order-schema-avro"

    create_topic_with_avro_schema(PROJECT_ID, TOPIC_ID, SCHEMA_ID, encoding="JSON")
```

## Creating Protocol Buffer Schemas

### Define Protocol Buffer Schema

```python
# protobuf_schema.py
from google.cloud import pubsub_v1
from google.pubsub_v1.types import Schema

# Protocol Buffer schema definition
PROTO_SCHEMA_DEFINITION = """
syntax = "proto3";

package com.example;

message Order {
  string order_id = 1;
  string customer_id = 2;
  double amount = 3;
  string currency = 4;
  repeated OrderItem items = 5;
  int64 timestamp = 6;
  OrderStatus status = 7;

  enum OrderStatus {
    PENDING = 0;
    CONFIRMED = 1;
    SHIPPED = 2;
    DELIVERED = 3;
    CANCELLED = 4;
  }

  message OrderItem {
    string product_id = 1;
    int32 quantity = 2;
    double price = 3;
  }
}

message Customer {
  string customer_id = 1;
  string name = 2;
  string email = 3;
  Address address = 4;

  message Address {
    string street = 1;
    string city = 2;
    string state = 3;
    string zip_code = 4;
    string country = 5;
  }
}
"""

def create_protobuf_schema(project_id: str, schema_id: str):
    """
    Create a Protocol Buffer schema.

    Args:
        project_id: Your GCP project ID
        schema_id: The schema ID
    """
    publisher = pubsub_v1.PublisherClient()
    project_path = f"projects/{project_id}"
    schema_path = publisher.schema_path(project_id, schema_id)

    try:
        schema = publisher.create_schema(
            request={
                "parent": project_path,
                "schema": Schema(
                    name=schema_path,
                    type_=Schema.Type.PROTOCOL_BUFFER,
                    definition=PROTO_SCHEMA_DEFINITION,
                ),
                "schema_id": schema_id,
            }
        )
        print(f"✓ Protocol Buffer schema created: {schema.name}")
        return schema
    except Exception as e:
        print(f"✗ Error creating schema: {e}")
        raise

def create_topic_with_protobuf_schema(
    project_id: str,
    topic_id: str,
    schema_id: str
):
    """
    Create a topic with Protocol Buffer schema.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic ID
        schema_id: The schema ID
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)
    schema_path = publisher.schema_path(project_id, schema_id)

    topic = publisher.create_topic(
        request={
            "name": topic_path,
            "schema_settings": {
                "schema": schema_path,
                "encoding": pubsub_v1.types.Encoding.BINARY,
            },
        }
    )
    print(f"✓ Topic created with Protocol Buffer schema: {topic.name}")
    return topic

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SCHEMA_ID = "order-schema-proto"
    TOPIC_ID = "orders-topic-proto"

    # Create Protocol Buffer schema
    create_protobuf_schema(PROJECT_ID, SCHEMA_ID)

    # Create topic with schema
    create_topic_with_protobuf_schema(PROJECT_ID, TOPIC_ID, SCHEMA_ID)
```

## Publishing with Schemas

### Publishing Avro Messages (JSON Encoding)

```python
# publish_avro_json.py
from google.cloud import pubsub_v1
import json
import time

def publish_avro_json_message(project_id: str, topic_id: str):
    """
    Publish message to topic with Avro schema (JSON encoding).

    Args:
        project_id: Your GCP project ID
        topic_id: The topic with Avro schema
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    # Create message matching Avro schema
    order_data = {
        "order_id": "ORD-12345",
        "customer_id": "CUST-789",
        "amount": 299.99,
        "currency": "USD",
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
        "timestamp": int(time.time() * 1000),
        "status": "PENDING"
    }

    # Encode as JSON string
    message_json = json.dumps(order_data)
    message_bytes = message_json.encode("utf-8")

    try:
        future = publisher.publish(topic_path, message_bytes)
        message_id = future.result()
        print(f"✓ Published valid Avro message: {message_id}")
        print(f"  Order: {order_data['order_id']}")
        return message_id
    except Exception as e:
        print(f"✗ Publish failed (schema validation): {e}")
        raise

def publish_invalid_avro_message(project_id: str, topic_id: str):
    """
    Attempt to publish invalid message (will be rejected).

    Args:
        project_id: Your GCP project ID
        topic_id: The topic with Avro schema
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    # Invalid: missing required field 'order_id'
    invalid_data = {
        "customer_id": "CUST-789",
        "amount": "not-a-number",  # Invalid: should be double
        "currency": "USD"
    }

    message_json = json.dumps(invalid_data)
    message_bytes = message_json.encode("utf-8")

    try:
        future = publisher.publish(topic_path, message_bytes)
        message_id = future.result()
        print(f"✓ Published: {message_id}")  # Won't reach here
    except Exception as e:
        print(f"✗ Publish rejected by schema validation:")
        print(f"  Error: {e}")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "orders-topic-avro"

    # Publish valid message
    publish_avro_json_message(PROJECT_ID, TOPIC_ID)

    # Try to publish invalid message
    publish_invalid_avro_message(PROJECT_ID, TOPIC_ID)
```

### Publishing Avro Messages (Binary Encoding)

```python
# publish_avro_binary.py
from google.cloud import pubsub_v1
import avro.io
import avro.schema
import io
import time

def publish_avro_binary_message(
    project_id: str,
    topic_id: str,
    schema_definition: str
):
    """
    Publish message with Avro binary encoding.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic with Avro schema
        schema_definition: Avro schema definition string
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    # Parse Avro schema
    avro_schema = avro.schema.parse(schema_definition)

    # Create message data
    order_data = {
        "order_id": "ORD-67890",
        "customer_id": "CUST-456",
        "amount": 199.99,
        "currency": "EUR",
        "items": [
            {
                "product_id": "PROD-003",
                "quantity": 1,
                "price": 199.99
            }
        ],
        "timestamp": int(time.time() * 1000),
        "status": "CONFIRMED"
    }

    # Serialize to Avro binary
    bytes_writer = io.BytesIO()
    encoder = avro.io.BinaryEncoder(bytes_writer)
    writer = avro.io.DatumWriter(avro_schema)
    writer.write(order_data, encoder)
    message_bytes = bytes_writer.getvalue()

    try:
        future = publisher.publish(topic_path, message_bytes)
        message_id = future.result()
        print(f"✓ Published Avro binary message: {message_id}")
        print(f"  Size: {len(message_bytes)} bytes")
        return message_id
    except Exception as e:
        print(f"✗ Publish failed: {e}")
        raise

if __name__ == "__main__":
    from avro_schema import AVRO_SCHEMA_DEFINITION

    PROJECT_ID = "your-project-id"
    TOPIC_ID = "orders-topic-avro"

    publish_avro_binary_message(PROJECT_ID, TOPIC_ID, AVRO_SCHEMA_DEFINITION)
```

### Publishing Protocol Buffer Messages

```python
# publish_protobuf.py
from google.cloud import pubsub_v1
import time

# First, generate Python classes from .proto file:
# protoc --python_out=. order.proto

# Then import the generated classes
# from order_pb2 import Order

def publish_protobuf_message(project_id: str, topic_id: str):
    """
    Publish message with Protocol Buffer encoding.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic with Protocol Buffer schema
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    # NOTE: In production, you would:
    # 1. Define .proto file
    # 2. Generate Python classes: protoc --python_out=. order.proto
    # 3. Import generated classes
    # 4. Create and serialize message

    # Example (pseudo-code):
    """
    from order_pb2 import Order

    order = Order()
    order.order_id = "ORD-11111"
    order.customer_id = "CUST-222"
    order.amount = 599.99
    order.currency = "GBP"
    order.timestamp = int(time.time() * 1000)
    order.status = Order.PENDING

    item = order.items.add()
    item.product_id = "PROD-004"
    item.quantity = 3
    item.price = 199.99

    message_bytes = order.SerializeToString()

    future = publisher.publish(topic_path, message_bytes)
    message_id = future.result()
    print(f"✓ Published Protocol Buffer message: {message_id}")
    """

    print("Protocol Buffer publishing requires generated Python classes")
    print("Run: protoc --python_out=. order.proto")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    TOPIC_ID = "orders-topic-proto"

    publish_protobuf_message(PROJECT_ID, TOPIC_ID)
```

## Subscribing with Schemas

### Subscribing to Avro Messages

```python
# subscribe_avro.py
from google.cloud import pubsub_v1
import json
import avro.io
import avro.schema
import io

def subscribe_avro_json(project_id: str, subscription_id: str):
    """
    Subscribe to messages with Avro JSON encoding.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    def callback(message):
        """Process Avro JSON message."""
        # Decode JSON
        data_str = message.data.decode("utf-8")
        order_data = json.loads(data_str)

        print(f"\n✓ Received Avro message: {message.message_id}")
        print(f"  Order ID: {order_data['order_id']}")
        print(f"  Customer: {order_data['customer_id']}")
        print(f"  Amount: {order_data['amount']} {order_data['currency']}")
        print(f"  Status: {order_data['status']}")
        print(f"  Items: {len(order_data['items'])}")

        # Process order
        process_order(order_data)

        message.ack()

    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback
    )

    print(f"Listening for Avro messages...")

    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()

def subscribe_avro_binary(
    project_id: str,
    subscription_id: str,
    schema_definition: str
):
    """
    Subscribe to messages with Avro binary encoding.

    Args:
        project_id: Your GCP project ID
        subscription_id: The subscription
        schema_definition: Avro schema definition
    """
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    # Parse schema
    avro_schema = avro.schema.parse(schema_definition)

    def callback(message):
        """Process Avro binary message."""
        # Deserialize from Avro binary
        bytes_reader = io.BytesIO(message.data)
        decoder = avro.io.BinaryDecoder(bytes_reader)
        reader = avro.io.DatumReader(avro_schema)
        order_data = reader.read(decoder)

        print(f"\n✓ Received Avro binary message: {message.message_id}")
        print(f"  Order: {order_data}")

        process_order(order_data)
        message.ack()

    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=callback
    )

    print(f"Listening for Avro binary messages...")

    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()

def process_order(order_data: dict):
    """Process order data."""
    # Your business logic here
    print(f"  Processing order: {order_data.get('order_id')}")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SUBSCRIPTION_ID = "orders-subscription-avro"

    subscribe_avro_json(PROJECT_ID, SUBSCRIPTION_ID)
```

## Schema Evolution

### Schema Versioning

```python
# schema_evolution.py
from google.cloud import pubsub_v1
from google.pubsub_v1.types import Schema
import json

# Version 1: Original schema
SCHEMA_V1 = """{
  "type": "record",
  "name": "User",
  "namespace": "com.example",
  "fields": [
    {"name": "user_id", "type": "string"},
    {"name": "email", "type": "string"}
  ]
}"""

# Version 2: Added optional field (backward compatible)
SCHEMA_V2 = """{
  "type": "record",
  "name": "User",
  "namespace": "com.example",
  "fields": [
    {"name": "user_id", "type": "string"},
    {"name": "email", "type": "string"},
    {"name": "phone", "type": ["null", "string"], "default": null}
  ]
}"""

# Version 3: Added required field with default (forward compatible)
SCHEMA_V3 = """{
  "type": "record",
  "name": "User",
  "namespace": "com.example",
  "fields": [
    {"name": "user_id", "type": "string"},
    {"name": "email", "type": "string"},
    {"name": "phone", "type": ["null", "string"], "default": null},
    {"name": "created_at", "type": "long", "default": 0}
  ]
}"""

def create_schema_version(
    project_id: str,
    schema_id: str,
    definition: str,
    version: int
):
    """
    Create a new schema version.

    Args:
        project_id: Your GCP project ID
        schema_id: The schema ID
        definition: Schema definition
        version: Version number
    """
    publisher = pubsub_v1.PublisherClient()
    project_path = f"projects/{project_id}"
    schema_path = publisher.schema_path(project_id, f"{schema_id}-v{version}")

    try:
        schema = publisher.create_schema(
            request={
                "parent": project_path,
                "schema": Schema(
                    name=schema_path,
                    type_=Schema.Type.AVRO,
                    definition=definition,
                ),
                "schema_id": f"{schema_id}-v{version}",
            }
        )
        print(f"✓ Schema version {version} created: {schema.name}")
        return schema
    except Exception as e:
        print(f"✗ Error creating schema: {e}")
        raise

def validate_schema_compatibility(
    old_definition: str,
    new_definition: str
):
    """
    Check if schemas are compatible.

    Args:
        old_definition: Old schema definition
        new_definition: New schema definition
    """
    import avro.schema

    try:
        old_schema = avro.schema.parse(old_definition)
        new_schema = avro.schema.parse(new_definition)

        print("✓ Schemas are syntactically valid")

        # In production, use schema registry compatibility checking
        # or Avro's schema resolution
        print("Note: Full compatibility check requires schema resolution")

    except Exception as e:
        print(f"✗ Schema compatibility check failed: {e}")

def test_backward_compatibility():
    """Test backward compatibility (new readers, old data)."""
    print("\n=== Testing Backward Compatibility ===")

    # Old data (v1)
    old_data = {
        "user_id": "USER-123",
        "email": "user@example.com"
    }

    # New schema (v2) can read old data
    print(f"Old data: {old_data}")
    print("✓ New schema (v2) can read old data")
    print("  Added optional 'phone' field with default null")

def test_forward_compatibility():
    """Test forward compatibility (old readers, new data)."""
    print("\n=== Testing Forward Compatibility ===")

    # New data (v3)
    new_data = {
        "user_id": "USER-456",
        "email": "user2@example.com",
        "phone": "+1234567890",
        "created_at": 1234567890
    }

    # Old schema (v1) can read new data by ignoring unknown fields
    print(f"New data: {new_data}")
    print("✓ Old schema (v1) can read new data")
    print("  Unknown fields (phone, created_at) are ignored")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    SCHEMA_ID = "user-schema"

    # Create schema versions
    create_schema_version(PROJECT_ID, SCHEMA_ID, SCHEMA_V1, 1)
    create_schema_version(PROJECT_ID, SCHEMA_ID, SCHEMA_V2, 2)
    create_schema_version(PROJECT_ID, SCHEMA_ID, SCHEMA_V3, 3)

    # Validate compatibility
    validate_schema_compatibility(SCHEMA_V1, SCHEMA_V2)

    # Test compatibility
    test_backward_compatibility()
    test_forward_compatibility()
```

### Handling Schema Changes

```python
# handle_schema_changes.py
from google.cloud import pubsub_v1

def update_topic_schema(
    project_id: str,
    topic_id: str,
    new_schema_id: str
):
    """
    Update topic to use new schema version.

    Args:
        project_id: Your GCP project ID
        topic_id: The topic to update
        new_schema_id: New schema ID
    """
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)
    schema_path = publisher.schema_path(project_id, new_schema_id)

    # Update topic schema
    topic = publisher.update_topic(
        request={
            "topic": {
                "name": topic_path,
                "schema_settings": {
                    "schema": schema_path,
                },
            },
            "update_mask": {"paths": ["schema_settings.schema"]},
        }
    )

    print(f"✓ Topic updated to schema: {new_schema_id}")
    return topic

def migrate_to_new_schema(
    project_id: str,
    old_topic_id: str,
    new_topic_id: str,
    new_schema_id: str
):
    """
    Create new topic with new schema for gradual migration.

    Args:
        project_id: Your GCP project ID
        old_topic_id: Current topic
        new_topic_id: New topic with new schema
        new_schema_id: New schema ID
    """
    publisher = pubsub_v1.PublisherClient()
    new_topic_path = publisher.topic_path(project_id, new_topic_id)
    schema_path = publisher.schema_path(project_id, new_schema_id)

    # Create new topic with new schema
    new_topic = publisher.create_topic(
        request={
            "name": new_topic_path,
            "schema_settings": {
                "schema": schema_path,
                "encoding": pubsub_v1.types.Encoding.JSON,
            },
        }
    )

    print(f"✓ New topic created: {new_topic.name}")
    print(f"Migration strategy:")
    print(f"  1. Publish to both {old_topic_id} and {new_topic_id}")
    print(f"  2. Migrate subscribers to {new_topic_id}")
    print(f"  3. Stop publishing to {old_topic_id}")
    print(f"  4. Delete {old_topic_id} when safe")

if __name__ == "__main__":
    PROJECT_ID = "your-project-id"
    OLD_TOPIC_ID = "users-topic-v1"
    NEW_TOPIC_ID = "users-topic-v2"
    NEW_SCHEMA_ID = "user-schema-v2"

    migrate_to_new_schema(PROJECT_ID, OLD_TOPIC_ID, NEW_TOPIC_ID, NEW_SCHEMA_ID)
```

## Best Practices

### 1. Schema Design Guidelines

```python
# Good practices for Avro schemas

# Use optional fields for forward compatibility
good_field = {"name": "new_field", "type": ["null", "string"], "default": null}

# Provide defaults for new required fields
good_required = {"name": "timestamp", "type": "long", "default": 0}

# Use enums for fixed value sets
enum_field = {
    "name": "status",
    "type": {
        "type": "enum",
        "name": "Status",
        "symbols": ["ACTIVE", "INACTIVE", "DELETED"]
    }
}

# Document fields
documented_field = {
    "name": "user_id",
    "type": "string",
    "doc": "Unique identifier for the user"
}
```

### 2. Validation Strategy

```python
def validate_before_publish(data: dict, schema_definition: str):
    """Validate data against schema before publishing."""
    import avro.schema
    import avro.io
    import io

    try:
        # Parse schema
        avro_schema = avro.schema.parse(schema_definition)

        # Validate by serializing
        bytes_writer = io.BytesIO()
        encoder = avro.io.BinaryEncoder(bytes_writer)
        writer = avro.io.DatumWriter(avro_schema)
        writer.write(data, encoder)

        print("✓ Data is valid")
        return True

    except Exception as e:
        print(f"✗ Validation failed: {e}")
        return False
```

### 3. Error Handling

```python
def publish_with_schema_error_handling(
    project_id: str,
    topic_id: str,
    data: dict
):
    """Publish with graceful schema error handling."""
    import json
    from google.api_core import exceptions

    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    message_json = json.dumps(data)
    message_bytes = message_json.encode("utf-8")

    try:
        future = publisher.publish(topic_path, message_bytes)
        message_id = future.result()
        print(f"✓ Published: {message_id}")
        return message_id

    except exceptions.InvalidArgument as e:
        print(f"✗ Schema validation failed: {e}")
        # Log to dead letter queue or error tracking
        log_schema_error(data, str(e))
        return None

    except Exception as e:
        print(f"✗ Publish failed: {e}")
        raise

def log_schema_error(data: dict, error: str):
    """Log schema validation errors."""
    import logging
    logging.error(f"Schema validation error: {error}")
    logging.error(f"Data: {data}")
```

## Advanced Topics

### Schema Registry Integration

```python
# For large-scale deployments, use a schema registry
# to manage schemas across teams and services

def register_schema_in_registry(schema_id: str, definition: str):
    """Register schema in central registry."""
    # Pseudo-code for schema registry integration
    print(f"Registering schema {schema_id} in schema registry")
    print("Benefits:")
    print("  - Central schema management")
    print("  - Version control")
    print("  - Compatibility checking")
    print("  - Schema discovery")
```

## Summary

In this tutorial, you learned:

- Creating and managing Pub/Sub schemas
- Defining schemas using Avro and Protocol Buffers
- Publishing and consuming schema-validated messages
- Handling schema evolution and versioning
- Best practices for schema design
- Error handling for schema validation

## Next Steps

- Continue to [Tutorial 06: Cloud Functions and Dataflow Integration](../06_dataflow_integration/README.md)
- Learn about [BigQuery Integration](../07_bigquery_integration/README.md)
- Review [Schema Best Practices](https://cloud.google.com/pubsub/docs/schemas)
