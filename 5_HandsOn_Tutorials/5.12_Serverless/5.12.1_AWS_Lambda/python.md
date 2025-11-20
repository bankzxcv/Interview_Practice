# AWS Lambda with Python

Complete guide to building serverless functions with AWS Lambda using Python.

## Why Python for Lambda?

- **Quick development**: Rapid prototyping and development
- **Rich ecosystem**: Extensive libraries for data processing, ML, etc.
- **Easy to learn**: Simple syntax, great for beginners
- **AWS native support**: First-class Lambda runtime support
- **Data science friendly**: Perfect for ML/AI workloads

## Prerequisites

```bash
# Install Python 3.9+
python3 --version

# Install pip
pip3 --version

# Install AWS CLI
aws --version

# Install AWS SAM CLI
sam --version

# Install virtualenv
pip3 install virtualenv
```

## Project Setup

```bash
mkdir aws-lambda-python
cd aws-lambda-python

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install boto3 requests python-dotenv

# Create requirements.txt
pip freeze > requirements.txt
```

## Project Structure

```
aws-lambda-python/
├── handlers/
│   ├── __init__.py
│   ├── hello.py
│   ├── users.py
│   ├── dynamodb_handler.py
│   ├── s3_processor.py
│   └── sqs_processor.py
├── lib/
│   ├── __init__.py
│   ├── config.py
│   └── utils.py
├── tests/
│   └── test_handlers.py
├── requirements.txt
└── template.yaml
```

## Basic Lambda Function

### Simple Handler

```python
# handlers/hello.py
import json
from datetime import datetime
from typing import Any, Dict

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Simple Lambda handler

    Args:
        event: Lambda event data
        context: Lambda context object

    Returns:
        Response dictionary
    """
    print(f"Event: {json.dumps(event)}")
    print(f"Request ID: {context.request_id}")

    return {
        'message': 'Hello from Lambda with Python!',
        'timestamp': datetime.utcnow().isoformat(),
        'requestId': context.request_id,
        'functionName': context.function_name,
        'memoryLimit': context.memory_limit_in_mb
    }
```

### API Gateway Handler

```python
# handlers/api_hello.py
import json
from datetime import datetime
from typing import Any, Dict

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API Gateway Lambda handler
    """
    print(f"Received {event['httpMethod']} request to {event['path']}")

    # Parse query parameters
    query_params = event.get('queryStringParameters') or {}
    name = query_params.get('name', 'World')

    response_body = {
        'message': f'Hello, {name}!',
        'path': event['path'],
        'method': event['httpMethod'],
        'timestamp': datetime.utcnow().isoformat()
    }

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response_body)
    }
```

## REST API with CRUD Operations

```python
# handlers/users.py
import json
import uuid
from typing import Any, Dict, List, Optional

# In-memory storage (use DynamoDB in production)
users_db: Dict[str, Dict[str, str]] = {
    '1': {'id': '1', 'name': 'John Doe', 'email': 'john@example.com'},
    '2': {'id': '2', 'name': 'Jane Smith', 'email': 'jane@example.com'}
}

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main router for user API
    """
    http_method = event['httpMethod']
    path_params = event.get('pathParameters') or {}

    try:
        if http_method == 'GET':
            if 'id' in path_params:
                return get_user(path_params['id'])
            return list_users()
        elif http_method == 'POST':
            return create_user(event)
        elif http_method == 'PUT':
            return update_user(event, path_params['id'])
        elif http_method == 'DELETE':
            return delete_user(path_params['id'])
        else:
            return error_response(405, 'Method not allowed')
    except Exception as e:
        print(f"Error: {str(e)}")
        return error_response(500, f'Internal server error: {str(e)}')

def get_user(user_id: str) -> Dict[str, Any]:
    """Get a single user"""
    user = users_db.get(user_id)

    if not user:
        return error_response(404, 'User not found')

    return json_response(200, user)

def list_users() -> Dict[str, Any]:
    """List all users"""
    return json_response(200, {
        'users': list(users_db.values())
    })

def create_user(event: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new user"""
    try:
        body = json.loads(event['body'])
    except json.JSONDecodeError:
        return error_response(400, 'Invalid JSON body')

    name = body.get('name')
    email = body.get('email')

    if not name or not email:
        return error_response(400, 'Name and email are required')

    user_id = str(uuid.uuid4())
    user = {
        'id': user_id,
        'name': name,
        'email': email
    }

    users_db[user_id] = user
    return json_response(201, user)

def update_user(event: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """Update an existing user"""
    if user_id not in users_db:
        return error_response(404, 'User not found')

    try:
        body = json.loads(event['body'])
    except json.JSONDecodeError:
        return error_response(400, 'Invalid JSON body')

    user = users_db[user_id]

    if 'name' in body:
        user['name'] = body['name']
    if 'email' in body:
        user['email'] = body['email']

    users_db[user_id] = user
    return json_response(200, user)

def delete_user(user_id: str) -> Dict[str, Any]:
    """Delete a user"""
    if user_id not in users_db:
        return error_response(404, 'User not found')

    del users_db[user_id]
    return json_response(204, None)

def json_response(status_code: int, data: Optional[Any]) -> Dict[str, Any]:
    """Create a JSON response"""
    response = {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json'
        }
    }

    if data is not None:
        response['body'] = json.dumps(data)
    else:
        response['body'] = ''

    return response

def error_response(status_code: int, message: str) -> Dict[str, Any]:
    """Create an error response"""
    return json_response(status_code, {'error': message})
```

## DynamoDB Integration

```python
# handlers/dynamodb_handler.py
import json
import os
from datetime import datetime
from typing import Any, Dict
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'Users')
table = dynamodb.Table(table_name)

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to int/float for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Main router for DynamoDB operations"""
    http_method = event['httpMethod']
    path_params = event.get('pathParameters') or {}

    try:
        if http_method == 'GET':
            if 'userId' in path_params:
                return get_item(path_params['userId'])
            return list_items()
        elif http_method == 'POST':
            return create_item(event)
        elif http_method == 'PUT':
            return update_item(event, path_params['userId'])
        elif http_method == 'DELETE':
            return delete_item(path_params['userId'])
        else:
            return error_response(405, 'Method not allowed')
    except Exception as e:
        print(f"Error: {str(e)}")
        return error_response(500, f'Internal server error: {str(e)}')

def create_item(event: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new item in DynamoDB"""
    try:
        body = json.loads(event['body'])
    except json.JSONDecodeError:
        return error_response(400, 'Invalid JSON body')

    user_id = body.get('userId')
    name = body.get('name')
    email = body.get('email')

    if not all([user_id, name, email]):
        return error_response(400, 'userId, name, and email are required')

    now = datetime.utcnow().isoformat()
    item = {
        'userId': user_id,
        'name': name,
        'email': email,
        'createdAt': now,
        'updatedAt': now
    }

    try:
        table.put_item(Item=item)
        return json_response(201, item)
    except Exception as e:
        print(f"DynamoDB error: {str(e)}")
        return error_response(500, 'Failed to create item')

def get_item(user_id: str) -> Dict[str, Any]:
    """Get a single item from DynamoDB"""
    try:
        response = table.get_item(Key={'userId': user_id})

        if 'Item' not in response:
            return error_response(404, 'User not found')

        return json_response(200, response['Item'])
    except Exception as e:
        print(f"DynamoDB error: {str(e)}")
        return error_response(500, 'Failed to get item')

def list_items() -> Dict[str, Any]:
    """List all items from DynamoDB"""
    try:
        response = table.scan(Limit=100)
        items = response.get('Items', [])

        return json_response(200, {'users': items})
    except Exception as e:
        print(f"DynamoDB error: {str(e)}")
        return error_response(500, 'Failed to list items')

def update_item(event: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """Update an item in DynamoDB"""
    try:
        body = json.loads(event['body'])
    except json.JSONDecodeError:
        return error_response(400, 'Invalid JSON body')

    name = body.get('name')
    email = body.get('email')

    if not name and not email:
        return error_response(400, 'At least one field (name or email) is required')

    update_expression = 'SET updatedAt = :updatedAt'
    expression_values = {
        ':updatedAt': datetime.utcnow().isoformat()
    }

    if name:
        update_expression += ', #name = :name'
        expression_values[':name'] = name

    if email:
        update_expression += ', email = :email'
        expression_values[':email'] = email

    try:
        response = table.update_item(
            Key={'userId': user_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames={'#name': 'name'} if name else None,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )

        return json_response(200, response['Attributes'])
    except Exception as e:
        print(f"DynamoDB error: {str(e)}")
        return error_response(500, 'Failed to update item')

def delete_item(user_id: str) -> Dict[str, Any]:
    """Delete an item from DynamoDB"""
    try:
        table.delete_item(Key={'userId': user_id})
        return json_response(204, None)
    except Exception as e:
        print(f"DynamoDB error: {str(e)}")
        return error_response(500, 'Failed to delete item')

def json_response(status_code: int, data: Any) -> Dict[str, Any]:
    """Create a JSON response with Decimal handling"""
    response = {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json'}
    }

    if data is not None:
        response['body'] = json.dumps(data, cls=DecimalEncoder)
    else:
        response['body'] = ''

    return response

def error_response(status_code: int, message: str) -> Dict[str, Any]:
    """Create an error response"""
    return json_response(status_code, {'error': message})
```

## S3 Event Processing

```python
# handlers/s3_processor.py
import json
import urllib.parse
from typing import Any, Dict

import boto3

s3_client = boto3.client('s3')

def lambda_handler(event: Dict[str, Any], context: Any) -> None:
    """
    Process S3 events (file uploads)
    """
    print(f"Received {len(event['Records'])} S3 events")

    for record in event['Records']:
        # Get bucket and key
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        size = record['s3']['object']['size']

        print(f"Processing file: {key} from bucket: {bucket} ({size} bytes)")

        try:
            # Get object from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            content = response['Body'].read()

            # Process based on file type
            if key.endswith('.json'):
                process_json_file(content)
            elif key.endswith('.csv'):
                process_csv_file(content)
            elif key.endswith('.txt'):
                process_text_file(content)
            else:
                print(f"Unsupported file type: {key}")

            print(f"Successfully processed: {key}")

        except Exception as e:
            print(f"Error processing {key}: {str(e)}")
            raise

def process_json_file(content: bytes) -> None:
    """Process JSON file"""
    try:
        data = json.loads(content.decode('utf-8'))
        print(f"JSON data: {json.dumps(data, indent=2)}")

        # Process JSON data
        # Example: validate schema, transform data, save to database

    except json.JSONDecodeError as e:
        print(f"Invalid JSON: {str(e)}")
        raise

def process_csv_file(content: bytes) -> None:
    """Process CSV file"""
    import csv
    import io

    text = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(text))

    rows = list(reader)
    print(f"CSV has {len(rows)} rows")

    # Process CSV data
    for row in rows:
        print(f"Row: {row}")

def process_text_file(content: bytes) -> None:
    """Process text file"""
    text = content.decode('utf-8')
    lines = text.split('\n')

    print(f"Text file has {len(lines)} lines")
    print(f"First 100 characters: {text[:100]}")
```

## SQS Message Processing

```python
# handlers/sqs_processor.py
import json
from typing import Any, Dict, List

def lambda_handler(event: Dict[str, Any], context: Any) -> None:
    """
    Process SQS messages
    """
    records = event['Records']
    print(f"Processing {len(records)} messages")

    failed_messages = []

    for record in records:
        try:
            process_message(record)
        except Exception as e:
            print(f"Failed to process message {record['messageId']}: {str(e)}")
            failed_messages.append(record['messageId'])

    if failed_messages:
        # Messages will be retried or sent to DLQ
        raise Exception(f"Failed to process {len(failed_messages)} messages")

    print("All messages processed successfully")

def process_message(record: Dict[str, Any]) -> None:
    """Process a single SQS message"""
    message_id = record['messageId']
    body = json.loads(record['body'])

    print(f"Processing message {message_id}")
    print(f"Message body: {json.dumps(body, indent=2)}")

    # Extract order information
    order_id = body.get('orderId')
    customer_id = body.get('customerId')
    items = body.get('items', [])
    total_amount = body.get('totalAmount')

    print(f"Order ID: {order_id}")
    print(f"Customer ID: {customer_id}")
    print(f"Total Amount: ${total_amount}")

    # Process the order
    process_order(order_id, customer_id, items, total_amount)

    print(f"Message {message_id} processed successfully")

def process_order(order_id: str, customer_id: str, items: List[Dict], total_amount: float) -> None:
    """Business logic for processing orders"""
    print(f"Processing order {order_id} for customer {customer_id}")

    # Validate order
    # Update inventory
    # Send confirmation email
    # Update database
    # etc.

    print(f"Order {order_id} completed")
```

## Scheduled Events (Cron)

```python
# handlers/scheduled.py
import json
from datetime import datetime
from typing import Any, Dict

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Scheduled Lambda function (cron job)
    """
    print(f"Running scheduled job at: {datetime.utcnow().isoformat()}")
    print(f"Event: {json.dumps(event, indent=2)}")

    try:
        # Generate daily report
        report = generate_daily_report()

        # Send report (email, S3, etc.)
        send_report(report)

        return {
            'statusCode': 200,
            'message': 'Daily report generated successfully',
            'report': report
        }

    except Exception as e:
        print(f"Error generating report: {str(e)}")
        raise

def generate_daily_report() -> Dict[str, Any]:
    """Generate daily business report"""
    # Fetch data from database
    # Calculate metrics

    report = {
        'date': datetime.utcnow().date().isoformat(),
        'metrics': {
            'totalOrders': 150,
            'revenue': 15000.00,
            'newCustomers': 25,
            'averageOrderValue': 100.00
        }
    }

    print(f"Report generated: {json.dumps(report, indent=2)}")
    return report

def send_report(report: Dict[str, Any]) -> None:
    """Send report via email or save to S3"""
    import boto3

    # Example: Save to S3
    s3_client = boto3.client('s3')
    bucket = 'my-reports-bucket'
    key = f"reports/{report['date']}/daily-report.json"

    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=json.dumps(report, indent=2),
        ContentType='application/json'
    )

    print(f"Report saved to s3://{bucket}/{key}")
```

## Lambda Layers for Dependencies

```python
# Create a layer for common dependencies
mkdir -p layer/python
pip install requests boto3 -t layer/python/
cd layer
zip -r layer.zip python/

# Upload layer
aws lambda publish-layer-version \
  --layer-name python-dependencies \
  --zip-file fileb://layer.zip \
  --compatible-runtimes python3.9 python3.10 python3.11
```

## SAM Template

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: AWS Lambda Python Functions

Globals:
  Function:
    Timeout: 30
    MemorySize: 256
    Runtime: python3.11
    Architectures:
      - x86_64
    Environment:
      Variables:
        LOG_LEVEL: INFO

Resources:
  HelloFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: .
      Handler: handlers.hello.lambda_handler
      Events:
        HelloApi:
          Type: Api
          Properties:
            Path: /hello
            Method: get

  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: Users
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH

  DynamoDBFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: .
      Handler: handlers.dynamodb_handler.lambda_handler
      Environment:
        Variables:
          TABLE_NAME: !Ref UsersTable
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref UsersTable
      Events:
        GetUser:
          Type: Api
          Properties:
            Path: /users/{userId}
            Method: get
        CreateUser:
          Type: Api
          Properties:
            Path: /users
            Method: post

  ProcessingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-processing-bucket'

  S3ProcessorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: .
      Handler: handlers.s3_processor.lambda_handler
      Policies:
        - S3ReadPolicy:
            BucketName: !Ref ProcessingBucket
      Events:
        S3Event:
          Type: S3
          Properties:
            Bucket: !Ref ProcessingBucket
            Events: s3:ObjectCreated:*

  OrderQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: OrderQueue
      VisibilityTimeout: 180

  SQSProcessorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: .
      Handler: handlers.sqs_processor.lambda_handler
      Policies:
        - SQSPollerPolicy:
            QueueName: !GetAtt OrderQueue.QueueName
      Events:
        SQSEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt OrderQueue.Arn
            BatchSize: 10

  DailyReportFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: .
      Handler: handlers.scheduled.lambda_handler
      Events:
        DailySchedule:
          Type: Schedule
          Properties:
            Schedule: cron(0 9 * * ? *)  # 9 AM UTC daily

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/'
```

## Deployment

```bash
# Install dependencies
pip install -r requirements.txt -t .

# Deploy with SAM
sam build
sam deploy --guided

# Or package and deploy manually
zip -r function.zip . -x "*.git*" "tests/*" "*.pyc"

aws lambda create-function \
  --function-name my-python-function \
  --runtime python3.11 \
  --handler handlers.hello.lambda_handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-role
```

## Testing

```python
# tests/test_handlers.py
import json
import pytest
from handlers import hello, users

def test_hello_handler():
    """Test hello handler"""
    class MockContext:
        request_id = 'test-request-id'
        function_name = 'test-function'
        memory_limit_in_mb = 256

    result = hello.lambda_handler({}, MockContext())

    assert result['message'] == 'Hello from Lambda with Python!'
    assert result['requestId'] == 'test-request-id'

def test_create_user():
    """Test create user"""
    event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'name': 'Test User',
            'email': 'test@example.com'
        })
    }

    class MockContext:
        pass

    result = users.lambda_handler(event, MockContext())

    assert result['statusCode'] == 201
    body = json.loads(result['body'])
    assert body['name'] == 'Test User'
    assert body['email'] == 'test@example.com'
```

```bash
# Run tests
pip install pytest
pytest tests/

# With coverage
pip install pytest-cov
pytest --cov=handlers tests/
```

## Best Practices

1. **Use virtual environments** to manage dependencies
2. **Keep handler functions small** and focused
3. **Initialize clients outside handler** for reuse
4. **Use environment variables** for configuration
5. **Implement proper error handling** and logging
6. **Use type hints** for better code quality
7. **Package only necessary dependencies** to reduce size
8. **Use Lambda Layers** for shared dependencies
9. **Monitor with CloudWatch** for logs and metrics
10. **Set appropriate timeout** and memory limits
