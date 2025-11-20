# Tutorial 07: Service Bus with Event Grid

## Overview

Azure Event Grid is a fully managed event routing service that enables event-driven, reactive programming. It integrates seamlessly with Service Bus, allowing you to build sophisticated event-driven architectures with message queues and publish-subscribe patterns.

**Key Features**:
- **Event Routing**: Route events to multiple subscribers
- **Event Filtering**: Filter events based on subject, type, or data
- **Schema Validation**: Support for CloudEvents schema
- **Built-in Azure Events**: React to Azure service events
- **Custom Topics**: Publish your own events
- **Delivery Guarantees**: At-least-once delivery with retries

**Event Grid vs Service Bus**:
- Event Grid: For event notification and routing
- Service Bus: For reliable message delivery and processing

## Architecture

```
┌─────────────────────┐
│  Event Publishers   │
│                     │
│  - Blob Storage     │
│  - Service Bus      │
│  - Custom App       │
└──────────┬──────────┘
           │
           │ publish events
           ↓
┌─────────────────────────────────────────┐
│         Azure Event Grid                │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   Custom Topic: "orders"         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Filter & Route                         │
└──────┬──────────┬──────────┬───────────┘
       │          │          │
       │          │          │
       ↓          ↓          ↓
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Function │ │   Queue  │ │ Webhook  │
│ Handler  │ │ Storage  │ │   HTTP   │
└──────────┘ └──────────┘ └──────────┘
```

## Prerequisites

```bash
# Install Python SDK
pip install azure-eventgrid azure-identity azure-servicebus

# Azure CLI
az login

# Register Event Grid provider
az provider register --namespace Microsoft.EventGrid

# Variables
RESOURCE_GROUP="rg-eventgrid-tutorial"
LOCATION="eastus"
TOPIC_NAME="orders-events"
```

## Part 1: Event Grid Custom Topics

### Create Event Grid Topic

```bash
# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Event Grid topic
az eventgrid topic create \
  --name $TOPIC_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Get topic endpoint and key
TOPIC_ENDPOINT=$(az eventgrid topic show \
  --name $TOPIC_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "endpoint" \
  --output tsv)

TOPIC_KEY=$(az eventgrid topic key list \
  --name $TOPIC_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "key1" \
  --output tsv)

echo "Topic Endpoint: $TOPIC_ENDPOINT"
echo "Topic Key: $TOPIC_KEY"
```

### Publish Events to Topic

```python
# event_publisher.py
from azure.eventgrid import EventGridPublisherClient
from azure.core.credentials import AzureKeyCredential
from azure.eventgrid import EventGridEvent
import os
from datetime import datetime
import uuid

TOPIC_ENDPOINT = os.getenv("EVENT_GRID_TOPIC_ENDPOINT")
TOPIC_KEY = os.getenv("EVENT_GRID_TOPIC_KEY")

def create_publisher():
    """Create Event Grid publisher client"""
    credential = AzureKeyCredential(TOPIC_KEY)
    return EventGridPublisherClient(TOPIC_ENDPOINT, credential)

def publish_order_event(order_data):
    """Publish order event to Event Grid"""
    client = create_publisher()

    # Create event
    event = EventGridEvent(
        event_type="Orders.OrderCreated",
        data={
            "order_id": order_data["order_id"],
            "customer_id": order_data["customer_id"],
            "amount": order_data["amount"],
            "items": order_data["items"]
        },
        subject=f"orders/{order_data['order_id']}",
        data_version="1.0",
        id=str(uuid.uuid4())
    )

    # Send event
    client.send(event)
    print(f"Published event: {event.event_type}")
    print(f"Event ID: {event.id}")

def publish_multiple_events(events):
    """Publish multiple events in batch"""
    client = create_publisher()

    event_list = []
    for event_data in events:
        event = EventGridEvent(
            event_type=event_data["type"],
            data=event_data["data"],
            subject=event_data["subject"],
            data_version="1.0",
            id=str(uuid.uuid4())
        )
        event_list.append(event)

    # Send batch
    client.send(event_list)
    print(f"Published {len(event_list)} events")

if __name__ == "__main__":
    # Publish single event
    order = {
        "order_id": "ORD-001",
        "customer_id": "CUST-123",
        "amount": 99.99,
        "items": ["item1", "item2"]
    }
    publish_order_event(order)

    # Publish multiple events
    events = [
        {
            "type": "Orders.OrderCreated",
            "subject": "orders/ORD-002",
            "data": {"order_id": "ORD-002", "amount": 50.00}
        },
        {
            "type": "Orders.OrderShipped",
            "subject": "orders/ORD-001",
            "data": {"order_id": "ORD-001", "tracking": "TRACK123"}
        }
    ]
    publish_multiple_events(events)
```

## Part 2: Event Grid Subscriptions

### Create Event Subscription (Webhook)

```bash
# Create webhook endpoint (for testing, use ngrok or Azure Function)
WEBHOOK_URL="https://your-endpoint.azurewebsites.net/api/eventhandler"

# Create event subscription
az eventgrid event-subscription create \
  --name orders-webhook-sub \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.EventGrid/topics/$TOPIC_NAME" \
  --endpoint $WEBHOOK_URL \
  --endpoint-type webhook \
  --included-event-types Orders.OrderCreated Orders.OrderUpdated
```

### Create Event Subscription (Queue Storage)

```bash
# Create storage account and queue
STORAGE_ACCOUNT="stevents$(date +%s)"

az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

az storage queue create \
  --name event-queue \
  --account-name $STORAGE_ACCOUNT

# Create subscription to storage queue
az eventgrid event-subscription create \
  --name orders-queue-sub \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.EventGrid/topics/$TOPIC_NAME" \
  --endpoint-type storagequeue \
  --endpoint "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Storage/storageAccounts/$STORAGE_ACCOUNT/queueservices/default/queues/event-queue"
```

### Create Event Subscription (Service Bus)

```bash
# Create Service Bus namespace and queue
NAMESPACE="sb-events-$(date +%s)"

az servicebus namespace create \
  --name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard

az servicebus queue create \
  --name event-queue \
  --namespace-name $NAMESPACE \
  --resource-group $RESOURCE_GROUP

# Create subscription to Service Bus
az eventgrid event-subscription create \
  --name orders-servicebus-sub \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.EventGrid/topics/$TOPIC_NAME" \
  --endpoint-type servicebusqueue \
  --endpoint "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ServiceBus/namespaces/$NAMESPACE/queues/event-queue"
```

## Part 3: Event Filtering

### Subject Filtering

```bash
# Subscribe to specific order events only
az eventgrid event-subscription create \
  --name high-value-orders \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.EventGrid/topics/$TOPIC_NAME" \
  --endpoint $WEBHOOK_URL \
  --endpoint-type webhook \
  --subject-begins-with "orders/high-value" \
  --subject-ends-with ".json"
```

### Advanced Filtering

```bash
# Filter by event data (amount > 100)
az eventgrid event-subscription create \
  --name high-amount-orders \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.EventGrid/topics/$TOPIC_NAME" \
  --endpoint $WEBHOOK_URL \
  --endpoint-type webhook \
  --advanced-filter data.amount NumberGreaterThan 100
```

### Python: Create Subscription with Filters

```python
# create_subscription_with_filters.py
from azure.mgmt.eventgrid import EventGridManagementClient
from azure.mgmt.eventgrid.models import (
    EventSubscription,
    WebHookEventSubscriptionDestination,
    EventSubscriptionFilter,
    StringInAdvancedFilter,
    NumberGreaterThanAdvancedFilter
)
from azure.identity import DefaultAzureCredential
import os

SUBSCRIPTION_ID = os.getenv("AZURE_SUBSCRIPTION_ID")
RESOURCE_GROUP = "rg-eventgrid-tutorial"
TOPIC_NAME = "orders-events"

def create_filtered_subscription():
    """Create event subscription with advanced filters"""
    credential = DefaultAzureCredential()
    client = EventGridManagementClient(credential, SUBSCRIPTION_ID)

    # Define filters
    event_filter = EventSubscriptionFilter(
        included_event_types=["Orders.OrderCreated"],
        subject_begins_with="orders/",
        advanced_filters=[
            # Filter: amount > 100
            NumberGreaterThanAdvancedFilter(
                key="data.amount",
                value=100
            ),
            # Filter: priority in ['high', 'critical']
            StringInAdvancedFilter(
                key="data.priority",
                values=["high", "critical"]
            )
        ]
    )

    # Define destination
    destination = WebHookEventSubscriptionDestination(
        endpoint_url="https://your-endpoint/api/events"
    )

    # Create subscription
    subscription = EventSubscription(
        destination=destination,
        filter=event_filter
    )

    scope = f"/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RESOURCE_GROUP}/providers/Microsoft.EventGrid/topics/{TOPIC_NAME}"

    result = client.event_subscriptions.begin_create_or_update(
        scope=scope,
        event_subscription_name="filtered-orders",
        event_subscription_info=subscription
    ).result()

    print(f"Created subscription: {result.name}")

if __name__ == "__main__":
    create_filtered_subscription()
```

## Part 4: Event Handlers

### Webhook Event Handler

```python
# event_handler.py (Azure Function or Flask app)
from flask import Flask, request, jsonify
import json

app = Flask(__name__)

@app.route('/api/eventhandler', methods=['POST'])
def handle_event():
    """Handle Event Grid webhook"""

    # Validation handshake
    if request.args.get('validationToken'):
        validation_token = request.args.get('validationToken')
        return jsonify({
            'validationResponse': validation_token
        })

    # Process events
    events = request.json

    for event in events:
        event_type = event.get('eventType')
        data = event.get('data')
        subject = event.get('subject')

        print(f"\n=== Event Received ===")
        print(f"Type: {event_type}")
        print(f"Subject: {subject}")
        print(f"Data: {json.dumps(data, indent=2)}")

        # Route based on event type
        if event_type == "Orders.OrderCreated":
            handle_order_created(data)
        elif event_type == "Orders.OrderShipped":
            handle_order_shipped(data)

    return jsonify({'status': 'success'}), 200

def handle_order_created(data):
    """Handle new order event"""
    print(f"Processing new order: {data.get('order_id')}")
    # Send email, update inventory, etc.

def handle_order_shipped(data):
    """Handle order shipped event"""
    print(f"Order shipped: {data.get('order_id')}")
    # Send tracking notification

if __name__ == '__main__':
    app.run(port=5000)
```

### Azure Function Event Handler

```python
# EventGridTrigger/__init__.py
import logging
import json
import azure.functions as func

def main(event: func.EventGridEvent) -> None:
    """
    Azure Function triggered by Event Grid
    Automatically handles validation
    """
    logging.info('Event Grid trigger function processed an event')

    # Get event properties
    event_id = event.id
    event_type = event.event_type
    subject = event.subject
    data = event.get_json()

    logging.info(f'Event ID: {event_id}')
    logging.info(f'Event Type: {event_type}')
    logging.info(f'Subject: {subject}')
    logging.info(f'Data: {json.dumps(data, indent=2)}')

    # Process based on event type
    if event_type == "Orders.OrderCreated":
        process_order_created(data)
    elif event_type == "Orders.OrderUpdated":
        process_order_updated(data)

def process_order_created(data):
    """Process new order"""
    logging.info(f"New order: {data.get('order_id')}")

def process_order_updated(data):
    """Process order update"""
    logging.info(f"Order updated: {data.get('order_id')}")
```

## Part 5: CloudEvents Schema

### Publish CloudEvents

```python
# cloudevents_publisher.py
from azure.eventgrid import EventGridPublisherClient
from azure.core.credentials import AzureKeyCredential
from azure.eventgrid import CloudEvent
import os
import uuid
from datetime import datetime

TOPIC_ENDPOINT = os.getenv("EVENT_GRID_TOPIC_ENDPOINT")
TOPIC_KEY = os.getenv("EVENT_GRID_TOPIC_KEY")

def publish_cloudevent(order_data):
    """Publish event using CloudEvents 1.0 schema"""
    credential = AzureKeyCredential(TOPIC_KEY)
    client = EventGridPublisherClient(TOPIC_ENDPOINT, credential)

    # Create CloudEvent
    event = CloudEvent(
        type="com.example.orders.created",
        source="/orders/api",
        data={
            "order_id": order_data["order_id"],
            "customer_id": order_data["customer_id"],
            "amount": order_data["amount"]
        },
        id=str(uuid.uuid4()),
        time=datetime.utcnow(),
        datacontenttype="application/json"
    )

    # Send event
    client.send(event)
    print(f"Published CloudEvent: {event.type}")
    print(f"Event ID: {event.id}")

if __name__ == "__main__":
    order = {
        "order_id": "ORD-001",
        "customer_id": "CUST-123",
        "amount": 99.99
    }
    publish_cloudevent(order)
```

### Receive CloudEvents

```python
# cloudevents_handler.py
from flask import Flask, request
from cloudevents.http import from_http
import json

app = Flask(__name__)

@app.route('/api/cloudevents', methods=['POST'])
def handle_cloudevent():
    """Handle CloudEvents format"""

    # Parse CloudEvent
    event = from_http(request.headers, request.get_data())

    print(f"\n=== CloudEvent Received ===")
    print(f"Type: {event['type']}")
    print(f"Source: {event['source']}")
    print(f"ID: {event['id']}")
    print(f"Time: {event['time']}")
    print(f"Data: {json.dumps(event.data, indent=2)}")

    # Process event
    if event['type'] == "com.example.orders.created":
        process_order(event.data)

    return '', 200

def process_order(data):
    """Process order event"""
    print(f"Processing order: {data.get('order_id')}")

if __name__ == '__main__':
    app.run(port=5000)
```

## Part 6: Service Bus Integration

### Service Bus as Event Source

```bash
# Enable Event Grid on Service Bus namespace
az servicebus namespace update \
  --name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --enable-kafka false

# Get namespace resource ID
NAMESPACE_ID=$(az servicebus namespace show \
  --name $NAMESPACE \
  --resource-group $RESOURCE_GROUP \
  --query id \
  --output tsv)

# Subscribe to Service Bus events
az eventgrid event-subscription create \
  --name servicebus-events \
  --source-resource-id $NAMESPACE_ID \
  --endpoint $WEBHOOK_URL \
  --endpoint-type webhook \
  --included-event-types Microsoft.ServiceBus.ActiveMessagesAvailableWithNoListeners
```

### React to Service Bus Events

```python
# servicebus_event_handler.py
import logging
import json
import azure.functions as func

def main(event: func.EventGridEvent) -> None:
    """
    React to Service Bus events
    Useful for auto-scaling or monitoring
    """
    event_type = event.event_type
    data = event.get_json()

    logging.info(f'Service Bus Event: {event_type}')

    if event_type == "Microsoft.ServiceBus.ActiveMessagesAvailableWithNoListeners":
        # Messages in queue with no listeners
        namespace = data.get('namespaceName')
        queue = data.get('queueName')
        message_count = data.get('messageCount')

        logging.warning(f"Messages available with no listeners:")
        logging.warning(f"  Namespace: {namespace}")
        logging.warning(f"  Queue: {queue}")
        logging.warning(f"  Count: {message_count}")

        # Take action: Start consumers, send alert, etc.
        alert_operations_team(namespace, queue, message_count)

def alert_operations_team(namespace, queue, count):
    """Send alert to operations team"""
    logging.info(f"Sending alert for {queue} with {count} messages")
    # Send email, SMS, create ticket, etc.
```

## Part 7: Event Grid with Dead Letter

### Configure Dead Letter Destination

```bash
# Create storage account for dead letters
DEADLETTER_STORAGE="stdletter$(date +%s)"

az storage account create \
  --name $DEADLETTER_STORAGE \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

# Create container
az storage container create \
  --name deadletters \
  --account-name $DEADLETTER_STORAGE

# Get storage account resource ID
STORAGE_ID=$(az storage account show \
  --name $DEADLETTER_STORAGE \
  --resource-group $RESOURCE_GROUP \
  --query id \
  --output tsv)

# Create subscription with dead letter destination
az eventgrid event-subscription create \
  --name with-deadletter \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.EventGrid/topics/$TOPIC_NAME" \
  --endpoint $WEBHOOK_URL \
  --endpoint-type webhook \
  --deadletter-endpoint "$STORAGE_ID/blobServices/default/containers/deadletters" \
  --max-delivery-attempts 3 \
  --event-ttl 1440
```

## Part 8: Monitoring

### View Event Grid Metrics

```bash
# View delivery success rate
az monitor metrics list \
  --resource "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.EventGrid/topics/$TOPIC_NAME" \
  --metric "PublishSuccessCount" \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z

# View failed deliveries
az monitor metrics list \
  --resource "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.EventGrid/topics/$TOPIC_NAME" \
  --metric "DeliveryFailedCount"
```

### List Event Subscriptions

```python
# list_subscriptions.py
from azure.mgmt.eventgrid import EventGridManagementClient
from azure.identity import DefaultAzureCredential
import os

def list_topic_subscriptions():
    """List all subscriptions for a topic"""
    credential = DefaultAzureCredential()
    client = EventGridManagementClient(credential, SUBSCRIPTION_ID)

    scope = f"/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RESOURCE_GROUP}/providers/Microsoft.EventGrid/topics/{TOPIC_NAME}"

    subscriptions = client.event_subscriptions.list_by_resource(
        resource_group_name=RESOURCE_GROUP,
        provider_namespace="Microsoft.EventGrid",
        resource_type_name="topics",
        resource_name=TOPIC_NAME
    )

    print(f"=== Event Subscriptions for {TOPIC_NAME} ===\n")

    for sub in subscriptions:
        print(f"Name: {sub.name}")
        print(f"  Endpoint: {sub.destination}")
        print(f"  Status: {sub.provisioning_state}")
        print(f"  Filters: {sub.filter.included_event_types}")
        print()

if __name__ == "__main__":
    list_topic_subscriptions()
```

## Best Practices

### 1. Event Design

```python
# Good: Use descriptive event types
event_type = "Orders.OrderCreated"
event_type = "Inventory.StockLow"

# Bad: Generic types
event_type = "Event"
event_type = "Message"

# Include version in event type or data
event_type = "Orders.OrderCreated.v1"
# Or in data
data = {"version": "1.0", "order_id": "123"}
```

### 2. Idempotent Handlers

```python
# Handle duplicate events (at-least-once delivery)
processed_events = set()

def handle_event(event):
    event_id = event.id

    if event_id in processed_events:
        print(f"Duplicate event {event_id}, skipping")
        return

    process_event(event)
    processed_events.add(event_id)
```

### 3. Error Handling

```python
# Return 200 even if processing fails internally
# Use dead letter for true failures
try:
    process_event(event)
except RecoverableError:
    # Log and return 500 to retry
    return '', 500
except FatalError:
    # Log and return 200 (will go to dead letter after retries)
    return '', 200
```

## Cleanup

```bash
# Delete subscriptions
az eventgrid event-subscription delete \
  --name orders-webhook-sub \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.EventGrid/topics/$TOPIC_NAME"

# Delete topic
az eventgrid topic delete \
  --name $TOPIC_NAME \
  --resource-group $RESOURCE_GROUP

# Delete resource group
az group delete --name $RESOURCE_GROUP --yes
```

## Key Takeaways

- ✅ Event Grid routes events to multiple subscribers
- ✅ Advanced filtering reduces unnecessary processing
- ✅ CloudEvents standard for interoperability
- ✅ Integrates with Service Bus for reliable delivery
- ✅ Dead letter support for failed deliveries
- ✅ Webhook validation for security
- ✅ At-least-once delivery guarantee
- ✅ Use for event-driven reactive architectures

## Next Steps

Continue to [Tutorial 08: Production Deployment and Monitoring](../08_production_deployment/) to learn:
- ARM templates and Bicep
- Geo-disaster recovery
- Premium tier features
- Monitoring with Azure Monitor
- Application Insights integration
- Security with Managed Identity
- Cost optimization strategies
