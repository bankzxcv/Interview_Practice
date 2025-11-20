# Azure Functions with Python

Complete guide to building serverless functions with Azure Functions using Python.

## Prerequisites

```bash
# Install Python 3.9+
python3 --version

# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Install Azure CLI
az --version

# Login to Azure
az login
```

## Project Setup

```bash
# Create a new Azure Functions project
func init azure-functions-python --python

cd azure-functions-python

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install azure-functions azure-storage-blob azure-cosmos
```

## Project Structure

```
azure-functions-python/
├── function_app.py
├── requirements.txt
├── host.json
├── local.settings.json
└── tests/
    └── test_functions.py
```

## Basic HTTP Trigger

```python
# function_app.py
import azure.functions as func
import logging
import json
from datetime import datetime

app = func.FunctionApp()

@app.function_name(name="HttpTrigger")
@app.route(route="hello", methods=["GET", "POST"], auth_level=func.AuthLevel.ANONYMOUS)
def http_trigger(req: func.HttpRequest) -> func.HttpResponse:
    """
    Simple HTTP trigger function
    """
    logging.info('Python HTTP trigger function processed a request.')

    name = req.params.get('name')
    if not name:
        try:
            req_body = req.get_json()
            name = req_body.get('name')
        except ValueError:
            pass

    if name:
        response = {
            'message': f'Hello, {name}!',
            'timestamp': datetime.utcnow().isoformat(),
            'method': req.method
        }
        return func.HttpResponse(
            json.dumps(response),
            status_code=200,
            mimetype="application/json"
        )
    else:
        return func.HttpResponse(
            json.dumps({"error": "Please pass a name"}),
            status_code=400,
            mimetype="application/json"
        )
```

## REST API with CRUD Operations

```python
# function_app.py
import azure.functions as func
import logging
import json
from typing import Dict, Any
import uuid

app = func.FunctionApp()

# In-memory storage (use Cosmos DB in production)
users_db: Dict[str, Dict[str, Any]] = {
    '1': {'id': '1', 'name': 'John Doe', 'email': 'john@example.com'},
    '2': {'id': '2', 'name': 'Jane Smith', 'email': 'jane@example.com'}
}

@app.route(route="users", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def list_users(req: func.HttpRequest) -> func.HttpResponse:
    """List all users"""
    logging.info('Getting all users')

    return func.HttpResponse(
        json.dumps({'users': list(users_db.values())}),
        status_code=200,
        mimetype="application/json"
    )

@app.route(route="users/{id}", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_user(req: func.HttpRequest) -> func.HttpResponse:
    """Get a single user"""
    user_id = req.route_params.get('id')
    logging.info(f'Getting user: {user_id}')

    user = users_db.get(user_id)

    if not user:
        return func.HttpResponse(
            json.dumps({'error': 'User not found'}),
            status_code=404,
            mimetype="application/json"
        )

    return func.HttpResponse(
        json.dumps(user),
        status_code=200,
        mimetype="application/json"
    )

@app.route(route="users", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def create_user(req: func.HttpRequest) -> func.HttpResponse:
    """Create a new user"""
    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({'error': 'Invalid JSON body'}),
            status_code=400,
            mimetype="application/json"
        )

    name = req_body.get('name')
    email = req_body.get('email')

    if not name or not email:
        return func.HttpResponse(
            json.dumps({'error': 'Name and email are required'}),
            status_code=400,
            mimetype="application/json"
        )

    user_id = str(uuid.uuid4())
    user = {
        'id': user_id,
        'name': name,
        'email': email
    }

    users_db[user_id] = user

    logging.info(f'Created user: {user_id}')

    return func.HttpResponse(
        json.dumps(user),
        status_code=201,
        mimetype="application/json"
    )

@app.route(route="users/{id}", methods=["PUT"], auth_level=func.AuthLevel.ANONYMOUS)
def update_user(req: func.HttpRequest) -> func.HttpResponse:
    """Update an existing user"""
    user_id = req.route_params.get('id')

    if user_id not in users_db:
        return func.HttpResponse(
            json.dumps({'error': 'User not found'}),
            status_code=404,
            mimetype="application/json"
        )

    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({'error': 'Invalid JSON body'}),
            status_code=400,
            mimetype="application/json"
        )

    user = users_db[user_id]

    if 'name' in req_body:
        user['name'] = req_body['name']
    if 'email' in req_body:
        user['email'] = req_body['email']

    users_db[user_id] = user

    logging.info(f'Updated user: {user_id}')

    return func.HttpResponse(
        json.dumps(user),
        status_code=200,
        mimetype="application/json"
    )

@app.route(route="users/{id}", methods=["DELETE"], auth_level=func.AuthLevel.ANONYMOUS)
def delete_user(req: func.HttpRequest) -> func.HttpResponse:
    """Delete a user"""
    user_id = req.route_params.get('id')

    if user_id not in users_db:
        return func.HttpResponse(
            json.dumps({'error': 'User not found'}),
            status_code=404,
            mimetype="application/json"
        )

    del users_db[user_id]

    logging.info(f'Deleted user: {user_id}')

    return func.HttpResponse(status_code=204)
```

## Cosmos DB Integration

```python
# function_app.py
import azure.functions as func
import logging
import json
import os
from azure.cosmos import CosmosClient, exceptions
from datetime import datetime

app = func.FunctionApp()

# Initialize Cosmos DB client
endpoint = os.environ.get('COSMOS_ENDPOINT')
key = os.environ.get('COSMOS_KEY')
client = CosmosClient(endpoint, key)
database = client.get_database_client('SampleDB')
container = database.get_container_client('Users')

@app.route(route="cosmos/users", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def create_user_cosmos(req: func.HttpRequest) -> func.HttpResponse:
    """Create a user in Cosmos DB"""
    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({'error': 'Invalid JSON body'}),
            status_code=400,
            mimetype="application/json"
        )

    user_id = req_body.get('userId', str(uuid.uuid4()))
    now = datetime.utcnow().isoformat()

    user_doc = {
        'id': user_id,
        'userId': user_id,
        'name': req_body.get('name'),
        'email': req_body.get('email'),
        'createdAt': now,
        'updatedAt': now
    }

    try:
        created_user = container.create_item(body=user_doc)
        logging.info(f'Created user in Cosmos DB: {user_id}')

        return func.HttpResponse(
            json.dumps(created_user),
            status_code=201,
            mimetype="application/json"
        )
    except exceptions.CosmosHttpResponseError as e:
        logging.error(f'Error creating user: {str(e)}')
        return func.HttpResponse(
            json.dumps({'error': str(e)}),
            status_code=500,
            mimetype="application/json"
        )

@app.route(route="cosmos/users/{userId}", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_user_cosmos(req: func.HttpRequest) -> func.HttpResponse:
    """Get a user from Cosmos DB"""
    user_id = req.route_params.get('userId')

    try:
        user = container.read_item(item=user_id, partition_key=user_id)

        return func.HttpResponse(
            json.dumps(user),
            status_code=200,
            mimetype="application/json"
        )
    except exceptions.CosmosResourceNotFoundError:
        return func.HttpResponse(
            json.dumps({'error': 'User not found'}),
            status_code=404,
            mimetype="application/json"
        )
    except exceptions.CosmosHttpResponseError as e:
        logging.error(f'Error getting user: {str(e)}')
        return func.HttpResponse(
            json.dumps({'error': str(e)}),
            status_code=500,
            mimetype="application/json"
        )
```

## Blob Storage Trigger

```python
# function_app.py
import azure.functions as func
import logging
import json

app = func.FunctionApp()

@app.blob_trigger(
    arg_name="myblob",
    path="uploads/{name}",
    connection="AzureWebJobsStorage"
)
def blob_trigger(myblob: func.InputStream):
    """
    Process blob uploads
    """
    logging.info(f"Blob trigger function processed blob")
    logging.info(f"Name: {myblob.name}")
    logging.info(f"Blob Size: {myblob.length} bytes")

    # Read blob content
    content = myblob.read()

    # Process based on file type
    if myblob.name.endswith('.json'):
        data = json.loads(content.decode('utf-8'))
        logging.info(f"JSON data: {data}")
        process_json_data(data)

    elif myblob.name.endswith('.csv'):
        text = content.decode('utf-8')
        lines = text.split('\n')
        logging.info(f"CSV has {len(lines)} rows")
        process_csv_data(text)

    elif myblob.name.endswith('.txt'):
        text = content.decode('utf-8')
        lines = text.split('\n')
        logging.info(f"Text file has {len(lines)} lines")

    logging.info("Blob processing completed")

def process_json_data(data):
    """Process JSON data"""
    logging.info("Processing JSON data...")
    # Your business logic here

def process_csv_data(content):
    """Process CSV data"""
    import csv
    import io

    logging.info("Processing CSV data...")
    reader = csv.DictReader(io.StringIO(content))
    for row in reader:
        logging.info(f"Row: {row}")
```

## Queue Trigger

```python
# function_app.py
import azure.functions as func
import logging
import json

app = func.FunctionApp()

@app.queue_trigger(
    arg_name="msg",
    queue_name="orders",
    connection="AzureWebJobsStorage"
)
def queue_trigger(msg: func.QueueMessage):
    """
    Process queue messages
    """
    logging.info('Queue trigger function processed a message')

    try:
        message_body = msg.get_body().decode('utf-8')
        order = json.loads(message_body)

        logging.info(f"Processing order: {order.get('orderId')}")
        logging.info(f"Customer: {order.get('customerId')}")
        logging.info(f"Total: ${order.get('totalAmount')}")

        # Process the order
        process_order(order)

        logging.info(f"Order {order.get('orderId')} processed successfully")

    except Exception as e:
        logging.error(f"Error processing queue message: {str(e)}")
        raise  # Will retry or move to poison queue

def process_order(order):
    """Business logic for processing orders"""
    logging.info(f"Processing {len(order.get('items', []))} items")

    # Update inventory
    # Send confirmation email
    # Update database
    # etc.
```

## Timer Trigger

```python
# function_app.py
import azure.functions as func
import logging
import json
from datetime import datetime

app = func.FunctionApp()

@app.schedule(
    schedule="0 0 9 * * *",  # 9 AM every day
    arg_name="myTimer",
    run_on_startup=False
)
def timer_trigger(myTimer: func.TimerRequest):
    """
    Scheduled function (cron job)
    """
    logging.info('Timer trigger function ran at: %s', datetime.utcnow().isoformat())

    if myTimer.past_due:
        logging.info('The timer is past due!')

    try:
        # Generate daily report
        report = generate_daily_report()

        logging.info(f'Daily report generated: {report}')

        # Send report
        send_report(report)

        logging.info('Report sent successfully')

    except Exception as e:
        logging.error(f'Error in timer function: {str(e)}')
        raise

def generate_daily_report():
    """Generate daily business report"""
    report = {
        'date': datetime.utcnow().date().isoformat(),
        'metrics': {
            'totalOrders': 150,
            'revenue': 15000.00,
            'newCustomers': 25
        }
    }
    return report

def send_report(report):
    """Send report via email or storage"""
    logging.info('Sending report...')
    # Implementation here
```

## Event Hub Trigger

```python
# function_app.py
import azure.functions as func
import logging
import json

app = func.FunctionApp()

@app.event_hub_message_trigger(
    arg_name="events",
    event_hub_name="telemetry",
    connection="EventHubConnection"
)
def event_hub_trigger(events: func.EventHubEvent):
    """
    Process Event Hub events
    """
    logging.info('Event Hub trigger function processed events')

    for event in events:
        telemetry = json.loads(event.get_body().decode('utf-8'))

        logging.info(f"Device: {telemetry.get('deviceId')}")
        logging.info(f"Temperature: {telemetry.get('temperature')}°C")
        logging.info(f"Humidity: {telemetry.get('humidity')}%")

        # Process telemetry
        process_telemetry(telemetry)

def process_telemetry(telemetry):
    """Process telemetry data"""
    if telemetry.get('temperature', 0) > 100:
        logging.warning(f"High temperature alert: {telemetry.get('temperature')}°C")
        # Send alert

    # Store in database
    # Update dashboard
```

## Configuration Files

### requirements.txt

```
azure-functions
azure-storage-blob
azure-cosmos
azure-identity
requests
```

### host.json

```json
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
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
```

### local.settings.json

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "COSMOS_ENDPOINT": "https://your-cosmos-account.documents.azure.com:443/",
    "COSMOS_KEY": "your-cosmos-key",
    "EventHubConnection": "your-event-hub-connection-string"
  }
}
```

## Local Development

```bash
# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Azurite (Azure Storage Emulator)
azurite --silent --location azurite

# Start Functions locally
func start

# Test HTTP endpoint
curl http://localhost:7071/api/hello?name=Azure
```

## Deployment

```bash
# Create resource group
az group create --name rg-functions --location eastus

# Create storage account
az storage account create \
  --name stfunctionsapp \
  --resource-group rg-functions \
  --location eastus \
  --sku Standard_LRS

# Create function app
az functionapp create \
  --name my-python-functions \
  --resource-group rg-functions \
  --storage-account stfunctionsapp \
  --consumption-plan-location eastus \
  --runtime python \
  --runtime-version 3.11 \
  --functions-version 4 \
  --os-type Linux

# Deploy
func azure functionapp publish my-python-functions
```

## Testing

```python
# tests/test_functions.py
import unittest
import azure.functions as func
from function_app import http_trigger

class TestHttpTrigger(unittest.TestCase):
    def test_http_trigger_with_name(self):
        """Test HTTP trigger with name parameter"""
        req = func.HttpRequest(
            method='GET',
            url='/api/hello',
            params={'name': 'Test'}
        )

        response = http_trigger(req)

        self.assertEqual(response.status_code, 200)
        self.assertIn('Test', response.get_body().decode())

    def test_http_trigger_without_name(self):
        """Test HTTP trigger without name parameter"""
        req = func.HttpRequest(
            method='GET',
            url='/api/hello',
            params={}
        )

        response = http_trigger(req)

        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main()
```

```bash
# Run tests
python -m pytest tests/

# With coverage
pip install pytest-cov
pytest --cov=. tests/
```

## Best Practices

1. **Use virtual environments** for dependency management
2. **Keep functions stateless** and idempotent
3. **Use Application Insights** for monitoring
4. **Implement proper error handling** and logging
5. **Use environment variables** for configuration
6. **Set appropriate timeout values**
7. **Use async/await** for I/O operations when possible
8. **Cache connections** to external services
9. **Use managed identities** instead of connection strings
10. **Monitor cold start times** and optimize dependencies
