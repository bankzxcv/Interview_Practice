# Google Cloud Functions with Python

Build serverless functions on Google Cloud using Python.

## Prerequisites

```bash
# Install Python 3.9+
python3 --version

# Install Google Cloud SDK
gcloud --version

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## Project Setup

```bash
mkdir gcf-python
cd gcf-python

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install functions-framework
pip install google-cloud-storage google-cloud-firestore google-cloud-pubsub
pip freeze > requirements.txt
```

## HTTP Function

```python
# main.py
import functions_framework
from flask import Request
import json
from datetime import datetime

@functions_framework.http
def hello_http(request: Request):
    """
    HTTP Cloud Function
    """
    request_json = request.get_json(silent=True)
    request_args = request.args

    if request_json and 'name' in request_json:
        name = request_json['name']
    elif request_args and 'name' in request_args:
        name = request_args['name']
    else:
        name = 'World'

    response = {
        'message': f'Hello, {name}!',
        'timestamp': datetime.utcnow().isoformat(),
        'method': request.method
    }

    return json.dumps(response), 200, {'Content-Type': 'application/json'}
```

## REST API

```python
# users_api.py
import functions_framework
from flask import Request, jsonify
import uuid

# In-memory storage
users = {
    '1': {'id': '1', 'name': 'John Doe', 'email': 'john@example.com'},
    '2': {'id': '2', 'name': 'Jane Smith', 'email': 'jane@example.com'}
}

@functions_framework.http
def users_api(request: Request):
    """REST API for users"""

    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    if request.method == 'OPTIONS':
        return '', 204, headers

    path = request.path
    method = request.method

    try:
        if method == 'GET' and path == '/users':
            return list_users(), 200, headers
        elif method == 'GET' and path.startswith('/users/'):
            user_id = path.split('/')[-1]
            return get_user(user_id), 200, headers
        elif method == 'POST' and path == '/users':
            return create_user(request), 201, headers
        elif method == 'PUT' and path.startswith('/users/'):
            user_id = path.split('/')[-1]
            return update_user(user_id, request), 200, headers
        elif method == 'DELETE' and path.startswith('/users/'):
            user_id = path.split('/')[-1]
            return delete_user(user_id), 204, headers
        else:
            return jsonify({'error': 'Not found'}), 404, headers
    except Exception as e:
        return jsonify({'error': str(e)}), 500, headers

def list_users():
    return jsonify({'users': list(users.values())})

def get_user(user_id):
    user = users.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user)

def create_user(request):
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({'error': 'Name and email required'}), 400

    user_id = str(uuid.uuid4())
    user = {
        'id': user_id,
        'name': data['name'],
        'email': data['email']
    }
    users[user_id] = user
    return jsonify(user)

def update_user(user_id, request):
    if user_id not in users:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    user = users[user_id]

    if 'name' in data:
        user['name'] = data['name']
    if 'email' in data:
        user['email'] = data['email']

    users[user_id] = user
    return jsonify(user)

def delete_user(user_id):
    if user_id not in users:
        return jsonify({'error': 'User not found'}), 404

    del users[user_id]
    return ''
```

## Firestore Integration

```python
# firestore_handler.py
import functions_framework
from flask import Request, jsonify
from google.cloud import firestore
from datetime import datetime

db = firestore.Client()
collection = db.collection('users')

@functions_framework.http
def create_user_firestore(request: Request):
    """Create user in Firestore"""
    try:
        data = request.get_json()

        user_doc = {
            'userId': data.get('userId'),
            'name': data.get('name'),
            'email': data.get('email'),
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat()
        }

        doc_ref = collection.document(user_doc['userId'])
        doc_ref.set(user_doc)

        return jsonify(user_doc), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@functions_framework.http
def get_user_firestore(request: Request):
    """Get user from Firestore"""
    try:
        user_id = request.args.get('userId')

        doc_ref = collection.document(user_id)
        doc = doc_ref.get()

        if not doc.exists:
            return jsonify({'error': 'User not found'}), 404

        return jsonify(doc.to_dict()), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## Cloud Storage Trigger

```python
# storage_handler.py
import functions_framework
from google.cloud import storage
import json

@functions_framework.cloud_event
def process_file(cloud_event):
    """
    Process file uploads to Cloud Storage
    """
    data = cloud_event.data

    bucket_name = data['bucket']
    file_name = data['name']
    size = data['size']

    print(f"Processing file: {file_name} from bucket: {bucket_name} ({size} bytes)")

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_name)

    # Download content
    content = blob.download_as_text()

    # Process based on file type
    if file_name.endswith('.json'):
        data = json.loads(content)
        print(f"JSON data: {data}")
        process_json_data(data)

    elif file_name.endswith('.csv'):
        lines = content.split('\n')
        print(f"CSV has {len(lines)} rows")
        process_csv_data(content)

    print(f"File {file_name} processed successfully")

def process_json_data(data):
    """Process JSON data"""
    print("Processing JSON data...")

def process_csv_data(content):
    """Process CSV data"""
    import csv
    import io

    print("Processing CSV data...")
    reader = csv.DictReader(io.StringIO(content))
    for row in reader:
        print(f"Row: {row}")
```

## Pub/Sub Trigger

```python
# pubsub_handler.py
import functions_framework
import base64
import json

@functions_framework.cloud_event
def process_order(cloud_event):
    """
    Process Pub/Sub messages
    """
    pubsub_message = cloud_event.data['message']
    message_data = base64.b64decode(pubsub_message['data']).decode()

    print(f"Message ID: {pubsub_message['messageId']}")
    print(f"Published at: {pubsub_message['publishTime']}")

    try:
        order = json.loads(message_data)

        print(f"Processing order: {order['orderId']}")
        print(f"Customer: {order['customerId']}")
        print(f"Total: ${order['totalAmount']}")

        # Process order
        handle_order(order)

        print(f"Order {order['orderId']} processed successfully")

    except Exception as e:
        print(f"Error processing message: {e}")
        raise  # Will trigger retry

def handle_order(order):
    """Business logic for processing orders"""
    print(f"Processing {len(order.get('items', []))} items")

    # Update inventory
    # Send confirmation
    # etc.
```

## Scheduled Function

```python
# scheduled_handler.py
import functions_framework
from datetime import datetime

@functions_framework.cloud_event
def daily_report(cloud_event):
    """
    Scheduled function (cron job)
    """
    print(f"Running daily report at: {datetime.utcnow().isoformat()}")

    try:
        # Generate report
        report = generate_report()
        print(f"Report generated: {report}")

        # Send report
        send_report(report)

        print("Report sent successfully")

    except Exception as e:
        print(f"Error in scheduled function: {e}")
        raise

def generate_report():
    """Generate daily business report"""
    return {
        'date': datetime.utcnow().date().isoformat(),
        'metrics': {
            'totalOrders': 150,
            'revenue': 15000.00,
            'newCustomers': 25
        }
    }

def send_report(report):
    """Send report via email or storage"""
    print("Sending report...")
    # Implementation
```

## requirements.txt

```
functions-framework==3.*
google-cloud-storage==2.*
google-cloud-firestore==2.*
google-cloud-pubsub==2.*
flask==3.*
```

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Test HTTP function locally
functions-framework --target=hello_http --debug

# Test in browser
curl http://localhost:8080?name=Google
```

## Deployment

```bash
# Deploy HTTP function
gcloud functions deploy hello-http \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --entry-point=hello_http \
  --trigger-http \
  --allow-unauthenticated

# Deploy Storage trigger
gcloud functions deploy process-file \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --entry-point=process_file \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket=my-bucket"

# Deploy Pub/Sub trigger
gcloud functions deploy process-order \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --entry-point=process_order \
  --trigger-topic=orders

# Deploy scheduled function with Cloud Scheduler
gcloud functions deploy daily-report \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --entry-point=daily_report \
  --trigger-topic=daily-report-topic

gcloud scheduler jobs create pubsub daily-report-job \
  --location=us-central1 \
  --schedule="0 9 * * *" \
  --topic=daily-report-topic \
  --message-body="{}"
```

## Best Practices

1. Use virtual environments
2. Pin dependencies in requirements.txt
3. Use 2nd generation functions
4. Implement proper error handling
5. Use Cloud Logging for logs
6. Set appropriate timeout and memory
7. Use Secret Manager for secrets
8. Keep functions focused and small
9. Test locally with Functions Framework
10. Monitor with Cloud Monitoring
