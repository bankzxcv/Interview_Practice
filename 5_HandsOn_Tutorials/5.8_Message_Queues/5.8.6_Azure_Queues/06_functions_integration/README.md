# Tutorial 06: Azure Functions Integration

## Overview

Azure Functions provides serverless message processing with built-in triggers and bindings for Queue Storage and Service Bus. Functions automatically scale based on queue depth and handle infrastructure management, making them ideal for event-driven architectures.

**Key Features**:
- **Queue Triggers**: Automatically invoke function when message arrives
- **Bindings**: Declarative input/output connections
- **Auto-scaling**: Scale out based on queue length
- **Managed Infrastructure**: No server management required
- **Pay-per-execution**: Cost-effective for variable workloads

**Supported Triggers**:
- Azure Queue Storage trigger
- Azure Service Bus Queue trigger
- Azure Service Bus Topic trigger

## Architecture

```
┌──────────────────┐         ┌────────────────────────┐
│  Queue Storage   │────────>│   Azure Function       │
│                  │ trigger │   (Queue Trigger)      │
│  - New message   │────────>│                        │
└──────────────────┘         │  - Process message     │
                             │  - Auto-scales         │
┌──────────────────┐         │  - Retry on failure    │
│  Service Bus     │────────>│                        │
│  Queue/Topic     │ trigger └────────────────────────┘
└──────────────────┘                     │
                                         │ output binding
                                         ↓
                             ┌────────────────────────┐
                             │  Output (optional)     │
                             │  - Another Queue       │
                             │  - Database            │
                             │  - HTTP endpoint       │
                             └────────────────────────┘
```

## Prerequisites

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Install Azure CLI
az login

# Install Python dependencies
pip install azure-functions

# Variables
RESOURCE_GROUP="rg-functions-tutorial"
LOCATION="eastus"
STORAGE_ACCOUNT="stfunc$(date +%s)"
FUNCTION_APP="func-queue-$(date +%s)"
NAMESPACE="sb-func-$(date +%s)"
```

## Part 1: Queue Storage Trigger

### Create Function App (Local)

```bash
# Create new function app
mkdir queue-function-app
cd queue-function-app

# Initialize function app (Python)
func init . --python

# Create Queue Storage triggered function
func new --name QueueProcessor --template "Azure Queue Storage trigger"
```

### Queue Storage Trigger Function

```python
# QueueProcessor/__init__.py
import logging
import json
import azure.functions as func

def main(msg: func.QueueMessage) -> None:
    """
    Process message from Azure Queue Storage
    Triggered automatically when message arrives
    """
    logging.info('Python Queue trigger function processed a message')

    # Get message content
    message_body = msg.get_body().decode('utf-8')
    logging.info(f'Message body: {message_body}')

    # Parse JSON message
    try:
        data = json.loads(message_body)
        process_order(data)
        logging.info('Message processed successfully')
    except json.JSONDecodeError as e:
        logging.error(f'Invalid JSON: {e}')
        raise  # Poison message will be moved to poison queue
    except Exception as e:
        logging.error(f'Processing error: {e}')
        raise  # Message will be retried

def process_order(order_data):
    """Process order business logic"""
    order_id = order_data.get('order_id')
    amount = order_data.get('amount')

    logging.info(f'Processing order {order_id}: ${amount}')

    # Business logic here
    # - Update database
    # - Call external API
    # - Send notification
```

### Function Configuration

```json
// QueueProcessor/function.json
{
  "scriptFile": "__init__.py",
  "bindings": [
    {
      "name": "msg",
      "type": "queueTrigger",
      "direction": "in",
      "queueName": "orders",
      "connection": "AzureWebJobsStorage"
    }
  ]
}
```

### Local Settings

```json
// local.settings.json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=https;AccountName=...",
    "FUNCTIONS_WORKER_RUNTIME": "python"
  }
}
```

### Test Locally

```bash
# Start function app locally
func start

# In another terminal, add message to queue
# (using Azure Storage Explorer or Python script)
```

## Part 2: Service Bus Queue Trigger

### Create Service Bus Triggered Function

```bash
# Create Service Bus triggered function
func new --name ServiceBusProcessor --template "Azure Service Bus Queue trigger"
```

### Service Bus Queue Trigger Function

```python
# ServiceBusProcessor/__init__.py
import logging
import json
import azure.functions as func

def main(msg: func.ServiceBusMessage) -> None:
    """
    Process message from Service Bus Queue
    Supports sessions, dead lettering, and auto-complete
    """
    logging.info('Service Bus Queue trigger function processed a message')

    # Get message body
    message_body = msg.get_body().decode('utf-8')
    logging.info(f'Message body: {message_body}')

    # Get message properties
    message_id = msg.message_id
    content_type = msg.content_type
    delivery_count = msg.delivery_count

    logging.info(f'Message ID: {message_id}')
    logging.info(f'Content Type: {content_type}')
    logging.info(f'Delivery Count: {delivery_count}')

    # Get custom properties
    user_properties = msg.user_properties
    if user_properties:
        logging.info(f'User Properties: {user_properties}')

    # Get session ID (if session-enabled queue)
    session_id = msg.session_id
    if session_id:
        logging.info(f'Session ID: {session_id}')

    # Process message
    try:
        data = json.loads(message_body)
        process_message(data)
        # Message auto-completes on success
    except Exception as e:
        logging.error(f'Error processing message: {e}')
        # Message will be retried (abandoned)
        # After max delivery count, moves to dead letter queue
        raise

def process_message(data):
    """Process message business logic"""
    logging.info(f'Processing: {data}')
```

### Service Bus Configuration

```json
// ServiceBusProcessor/function.json
{
  "scriptFile": "__init__.py",
  "bindings": [
    {
      "name": "msg",
      "type": "serviceBusTrigger",
      "direction": "in",
      "queueName": "orders",
      "connection": "ServiceBusConnection"
    }
  ]
}
```

### Connection String Configuration

```json
// local.settings.json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=https;...",
    "ServiceBusConnection": "Endpoint=sb://...;SharedAccessKeyName=...",
    "FUNCTIONS_WORKER_RUNTIME": "python"
  }
}
```

## Part 3: Service Bus Topic Trigger

### Topic Subscription Trigger

```bash
# Create Service Bus Topic trigger
func new --name TopicSubscriber --template "Azure Service Bus Topic trigger"
```

```python
# TopicSubscriber/__init__.py
import logging
import json
import azure.functions as func

def main(msg: func.ServiceBusMessage) -> None:
    """
    Process messages from Service Bus Topic subscription
    Only receives messages matching subscription filters
    """
    logging.info('Service Bus Topic trigger function processed a message')

    message_body = msg.get_body().decode('utf-8')
    data = json.loads(message_body)

    # Get event type from properties
    user_props = msg.user_properties
    event_type = user_props.get('event_type', 'unknown')

    logging.info(f'Event Type: {event_type}')
    logging.info(f'Data: {data}')

    # Route based on event type
    if event_type == 'order.created':
        handle_order_created(data)
    elif event_type == 'order.updated':
        handle_order_updated(data)
    else:
        logging.warning(f'Unknown event type: {event_type}')

def handle_order_created(data):
    """Handle new order event"""
    logging.info(f'New order: {data.get("order_id")}')
    # Send welcome email, update inventory, etc.

def handle_order_updated(data):
    """Handle order update event"""
    logging.info(f'Order updated: {data.get("order_id")}')
    # Update status, send notification, etc.
```

```json
// TopicSubscriber/function.json
{
  "scriptFile": "__init__.py",
  "bindings": [
    {
      "name": "msg",
      "type": "serviceBusTrigger",
      "direction": "in",
      "topicName": "events",
      "subscriptionName": "order-processor",
      "connection": "ServiceBusConnection"
    }
  ]
}
```

## Part 4: Output Bindings

### Function with Output Binding

```python
# OrderProcessor/__init__.py
import logging
import json
import azure.functions as func

def main(
    msg: func.QueueMessage,
    outputQueue: func.Out[str]
) -> None:
    """
    Process order and send result to another queue
    Uses output binding instead of SDK
    """
    logging.info('Processing order with output binding')

    # Parse input message
    order_data = json.loads(msg.get_body().decode('utf-8'))
    order_id = order_data.get('order_id')

    # Process order
    result = process_order(order_data)

    # Send to output queue using binding
    output_message = json.dumps({
        'order_id': order_id,
        'status': result['status'],
        'timestamp': result['timestamp']
    })

    outputQueue.set(output_message)
    logging.info(f'Sent result to output queue')

def process_order(order_data):
    """Process order and return result"""
    from datetime import datetime

    return {
        'status': 'completed',
        'timestamp': datetime.utcnow().isoformat()
    }
```

```json
// OrderProcessor/function.json
{
  "scriptFile": "__init__.py",
  "bindings": [
    {
      "name": "msg",
      "type": "queueTrigger",
      "direction": "in",
      "queueName": "orders",
      "connection": "AzureWebJobsStorage"
    },
    {
      "name": "outputQueue",
      "type": "queue",
      "direction": "out",
      "queueName": "processed-orders",
      "connection": "AzureWebJobsStorage"
    }
  ]
}
```

### Multiple Output Bindings

```python
# MultiOutputProcessor/__init__.py
import logging
import json
import azure.functions as func

def main(
    msg: func.ServiceBusMessage,
    emailQueue: func.Out[str],
    inventoryQueue: func.Out[str],
    analyticsQueue: func.Out[str]
) -> None:
    """
    Fan-out pattern: One input, multiple outputs
    Send to different queues based on business logic
    """
    logging.info('Processing with multiple outputs')

    order_data = json.loads(msg.get_body().decode('utf-8'))
    order_id = order_data.get('order_id')

    # Send email notification
    email_msg = json.dumps({
        'to': order_data.get('customer_email'),
        'subject': f'Order {order_id} confirmed'
    })
    emailQueue.set(email_msg)

    # Update inventory
    inventory_msg = json.dumps({
        'order_id': order_id,
        'items': order_data.get('items')
    })
    inventoryQueue.set(inventory_msg)

    # Send to analytics
    analytics_msg = json.dumps({
        'event': 'order.created',
        'order_id': order_id,
        'amount': order_data.get('amount')
    })
    analyticsQueue.set(analytics_msg)

    logging.info(f'Fanned out order {order_id} to 3 queues')
```

## Part 5: Batch Processing

### Batch Trigger

```python
# BatchProcessor/__init__.py
import logging
import json
import azure.functions as func
from typing import List

def main(messages: List[func.ServiceBusMessage]) -> None:
    """
    Process multiple messages in a batch
    More efficient for high-throughput scenarios
    """
    logging.info(f'Processing batch of {len(messages)} messages')

    results = []

    for message in messages:
        try:
            body = json.loads(message.get_body().decode('utf-8'))
            result = process_message(body)
            results.append(result)
        except Exception as e:
            logging.error(f'Error processing message {message.message_id}: {e}')
            # Individual message failure doesn't fail entire batch

    # Batch processing complete
    logging.info(f'Batch complete: {len(results)} processed')

def process_message(data):
    """Process individual message"""
    return {'order_id': data.get('order_id'), 'status': 'processed'}
```

```json
// BatchProcessor/function.json
{
  "scriptFile": "__init__.py",
  "bindings": [
    {
      "name": "messages",
      "type": "serviceBusTrigger",
      "direction": "in",
      "queueName": "orders",
      "connection": "ServiceBusConnection",
      "cardinality": "many",
      "maxMessageBatchSize": 32
    }
  ]
}
```

## Part 6: Error Handling and Retries

### Retry Policy

```python
# RobustProcessor/__init__.py
import logging
import json
import azure.functions as func
from datetime import datetime

def main(msg: func.ServiceBusMessage, context: func.Context) -> None:
    """
    Robust message processing with error handling
    """
    invocation_id = context.invocation_id
    delivery_count = msg.delivery_count

    logging.info(f'Invocation: {invocation_id}')
    logging.info(f'Delivery Count: {delivery_count}')

    try:
        # Parse message
        data = json.loads(msg.get_body().decode('utf-8'))

        # Validate
        if not validate_message(data):
            logging.error('Invalid message, will move to dead letter queue')
            raise ValueError('Invalid message format')

        # Process
        process_with_retry(data)

    except ValueError as e:
        # Validation error - don't retry
        logging.error(f'Validation error: {e}')
        raise  # Will dead letter after retries exhausted

    except ConnectionError as e:
        # Transient error - retry
        logging.warning(f'Connection error: {e}')
        if delivery_count < 5:
            raise  # Retry
        else:
            logging.error('Max retries exceeded')
            raise  # Will dead letter

    except Exception as e:
        # Unknown error
        logging.error(f'Unexpected error: {e}')
        raise

def validate_message(data):
    """Validate message structure"""
    required_fields = ['order_id', 'customer_id', 'amount']
    return all(field in data for field in required_fields)

def process_with_retry(data):
    """Process with internal retry logic"""
    import time

    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            # Actual processing
            result = process_order(data)
            return result
        except Exception as e:
            if attempt < max_attempts - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise

def process_order(data):
    """Business logic"""
    logging.info(f'Processing order: {data["order_id"]}')
    return {'status': 'success'}
```

### Host Configuration

```json
// host.json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20
      }
    }
  },
  "extensions": {
    "serviceBus": {
      "prefetchCount": 100,
      "messageHandlerOptions": {
        "autoComplete": true,
        "maxConcurrentCalls": 32,
        "maxAutoRenewDuration": "00:05:00"
      },
      "sessionHandlerOptions": {
        "autoComplete": false,
        "maxConcurrentSessions": 8,
        "messageWaitTimeout": "00:00:30"
      }
    },
    "queues": {
      "maxPollingInterval": "00:00:02",
      "visibilityTimeout": "00:00:30",
      "batchSize": 16,
      "maxDequeueCount": 5,
      "newBatchThreshold": 8
    }
  }
}
```

## Part 7: Deploy to Azure

### Create Resources

```bash
# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

# Create Function App
az functionapp create \
  --resource-group $RESOURCE_GROUP \
  --consumption-plan-location $LOCATION \
  --runtime python \
  --runtime-version 3.9 \
  --functions-version 4 \
  --name $FUNCTION_APP \
  --storage-account $STORAGE_ACCOUNT \
  --os-type Linux

# Get connection strings
STORAGE_CONN=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --output tsv)

SB_CONN=$(az servicebus namespace authorization-rule keys list \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $NAMESPACE \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString \
  --output tsv)

# Configure app settings
az functionapp config appsettings set \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    "AzureWebJobsStorage=$STORAGE_CONN" \
    "ServiceBusConnection=$SB_CONN"
```

### Deploy Function

```bash
# Build and deploy
func azure functionapp publish $FUNCTION_APP

# View logs
func azure functionapp logstream $FUNCTION_APP

# Check function status
az functionapp function show \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --function-name QueueProcessor
```

## Part 8: Monitoring

### Application Insights Integration

```python
# Add Application Insights logging
import logging
from opencensus.ext.azure.log_exporter import AzureLogHandler

# Configure Application Insights
logger = logging.getLogger(__name__)
logger.addHandler(AzureLogHandler(
    connection_string='InstrumentationKey=...'
))

def main(msg: func.ServiceBusMessage) -> None:
    """Function with Application Insights logging"""

    # Custom dimensions
    properties = {
        'message_id': msg.message_id,
        'delivery_count': msg.delivery_count
    }

    logger.info('Processing message', extra={'custom_dimensions': properties})

    # Custom metrics
    from opencensus.stats import aggregation as aggregation_module
    from opencensus.stats import measure as measure_module
    from opencensus.stats import stats as stats_module
    from opencensus.stats import view as view_module

    # Track processing time
    import time
    start_time = time.time()

    # Process message
    process_message(msg)

    duration = time.time() - start_time
    logger.info(f'Processing duration: {duration}s')
```

### View Metrics

```bash
# View Application Insights metrics
az monitor app-insights metrics show \
  --app $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --metrics requests/count

# View failures
az monitor app-insights metrics show \
  --app $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --metrics requests/failed
```

## Best Practices

### 1. Function Design

```python
# Keep functions small and focused
# ✅ Good: Single responsibility
def main(msg: func.QueueMessage) -> None:
    order = parse_message(msg)
    process_order(order)

# ❌ Bad: Too many responsibilities
def main(msg: func.QueueMessage) -> None:
    # Parse, validate, process, send email, update DB, call APIs...
    pass
```

### 2. Error Handling

```python
# Categorize errors for proper handling
try:
    process_message(msg)
except ValidationError:
    # Don't retry validation errors
    log_and_dead_letter(msg)
    raise
except TransientError:
    # Retry transient errors
    if msg.delivery_count < MAX_RETRIES:
        raise  # Will retry
```

### 3. Performance

```python
# Use batch processing for high throughput
# Use async/await for I/O operations
# Reuse connections (don't create per message)
# Monitor and tune host.json settings
```

## Cleanup

```bash
# Delete Function App
az functionapp delete \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP

# Delete resource group
az group delete --name $RESOURCE_GROUP --yes
```

## Key Takeaways

- ✅ Azure Functions provide serverless message processing
- ✅ Triggers automatically invoke functions on new messages
- ✅ Bindings simplify input/output operations
- ✅ Auto-scaling based on queue depth
- ✅ Built-in retry and dead letter handling
- ✅ Support for batch processing
- ✅ Integration with Application Insights
- ✅ Cost-effective pay-per-execution model

## Next Steps

Continue to [Tutorial 07: Service Bus with Event Grid](../07_event_grid/) to learn:
- Event Grid overview and topics
- Event subscriptions and filtering
- Service Bus integration
- CloudEvents schema
- Event handlers with Functions
- Reactive event-driven patterns
