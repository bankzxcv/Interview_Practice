# AWS Lambda with TypeScript

Complete guide to building serverless functions with AWS Lambda using TypeScript.

## Prerequisites

```bash
# Install Node.js and npm
node --version  # v18+ recommended

# Install AWS CLI
aws --version

# Install AWS SAM CLI (optional but recommended)
sam --version

# Install Serverless Framework (alternative)
npm install -g serverless
```

## Project Setup

### 1. Initialize TypeScript Project

```bash
mkdir aws-lambda-typescript
cd aws-lambda-typescript
npm init -y

# Install TypeScript and AWS types
npm install --save-dev typescript @types/node @types/aws-lambda

# Install AWS SDK v3
npm install @aws-sdk/client-s3 @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

# Initialize TypeScript
npx tsc --init
```

### 2. Configure tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Basic Lambda Function

### Simple HTTP Handler

```typescript
// src/handlers/hello.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'Hello from Lambda!',
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
    }),
  };
};
```

### REST API with Path Parameters

```typescript
// src/handlers/users.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

interface User {
  id: string;
  name: string;
  email: string;
}

const users: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

export const getUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.pathParameters?.id;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
    };
  }

  const user = users.find(u => u.id === userId);

  if (!user) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'User not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  };
};

export const listUsers = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ users }),
  };
};

export const createUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  const newUser: User = JSON.parse(event.body);

  // Validate user data
  if (!newUser.name || !newUser.email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Name and email are required' }),
    };
  }

  newUser.id = String(users.length + 1);
  users.push(newUser);

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser),
  };
};
```

## DynamoDB Integration

```typescript
// src/handlers/dynamodb-handler.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'Users';

interface UserItem {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export const createItem = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { userId, name, email } = body;

    const item: UserItem = {
      userId,
      name,
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create item' }),
    };
  }
};

export const getItem = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Item not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get item' }),
    };
  }
};

export const updateItem = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;
    const body = JSON.parse(event.body || '{}');
    const { name, email } = body;

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId },
        UpdateExpression: 'SET #name = :name, email = :email, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#name': 'name',
        },
        ExpressionAttributeValues: {
          ':name': name,
          ':email': email,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update item' }),
    };
  }
};
```

## S3 Event Processing

```typescript
// src/handlers/s3-processor.ts
import { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});

export const processS3Event: S3Handler = async (event: S3Event) => {
  console.log('S3 Event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const size = record.s3.object.size;

    console.log(`Processing file: ${key} from bucket: ${bucket} (${size} bytes)`);

    try {
      // Get object from S3
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      // Read the file content
      const content = await response.Body?.transformToString();
      console.log('File content:', content?.substring(0, 100));

      // Process the file (example: count lines)
      if (content) {
        const lines = content.split('\n').length;
        console.log(`File has ${lines} lines`);
      }

      // You could:
      // - Process image (resize, convert)
      // - Parse CSV/JSON
      // - Trigger other workflows
      // - Store metadata in DynamoDB

    } catch (error) {
      console.error('Error processing S3 object:', error);
      throw error;
    }
  }
};
```

## SQS Message Processing

```typescript
// src/handlers/sqs-processor.ts
import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';

interface OrderMessage {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  totalAmount: number;
}

export const processSQSMessages: SQSHandler = async (event: SQSEvent) => {
  console.log(`Processing ${event.Records.length} messages`);

  const results = await Promise.allSettled(
    event.Records.map(record => processMessage(record))
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.error(`${failed.length} messages failed to process`);
    // Messages will be retried or sent to DLQ based on configuration
    throw new Error('Some messages failed to process');
  }

  console.log('All messages processed successfully');
};

async function processMessage(record: SQSRecord): Promise<void> {
  try {
    const message: OrderMessage = JSON.parse(record.body);
    console.log('Processing order:', message.orderId);

    // Simulate order processing
    await processOrder(message);

    console.log('Order processed successfully:', message.orderId);
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}

async function processOrder(order: OrderMessage): Promise<void> {
  // Business logic here
  console.log(`Processing order ${order.orderId} for customer ${order.customerId}`);
  console.log(`Total amount: $${order.totalAmount}`);

  // Example: Save to database, send notification, etc.
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

## Scheduled Events (Cron)

```typescript
// src/handlers/scheduled.ts
import { ScheduledHandler } from 'aws-lambda';

export const dailyReport: ScheduledHandler = async (event) => {
  console.log('Running daily report at:', new Date().toISOString());
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Generate report
    const report = await generateDailyReport();

    // Send to S3 or email
    console.log('Report generated:', report);

    return {
      statusCode: 200,
      message: 'Daily report generated successfully',
    };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

async function generateDailyReport() {
  // Fetch data from database
  // Generate report
  return {
    date: new Date().toISOString(),
    metrics: {
      totalOrders: 150,
      revenue: 15000,
      newCustomers: 25,
    },
  };
}
```

## Deployment with AWS SAM

### template.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: AWS Lambda TypeScript Functions

Globals:
  Function:
    Timeout: 30
    MemorySize: 256
    Runtime: nodejs18.x
    Architectures:
      - x86_64
    Environment:
      Variables:
        NODE_ENV: production

Resources:
  HelloFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: handlers/hello.handler
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

  UserFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: handlers/dynamodb-handler.getItem
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

  ProcessingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-processing-bucket'

  S3ProcessorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: handlers/s3-processor.processS3Event
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
      MessageRetentionPeriod: 1209600

  SQSProcessorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: handlers/sqs-processor.processSQSMessages
      Policies:
        - SQSPollerPolicy:
            QueueName: !GetAtt OrderQueue.QueueName
      Events:
        SQSEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt OrderQueue.Arn
            BatchSize: 10

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/'
```

### Build and Deploy

```bash
# Build TypeScript
npm run build

# Or with build script in package.json
```

```json
{
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "deploy": "npm run build && sam deploy"
  }
}
```

```bash
# Build and deploy with SAM
sam build
sam deploy --guided

# For subsequent deploys
sam deploy
```

## Deployment with Serverless Framework

### serverless.yml

```yaml
service: aws-lambda-typescript

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  memorySize: 256
  timeout: 30
  environment:
    TABLE_NAME: ${self:service}-users-${sls:stage}
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:*
          Resource: !GetAtt UsersTable.Arn

plugins:
  - serverless-plugin-typescript
  - serverless-offline

functions:
  hello:
    handler: src/handlers/hello.handler
    events:
      - http:
          path: hello
          method: get
          cors: true

  getUser:
    handler: src/handlers/dynamodb-handler.getItem
    events:
      - http:
          path: users/{userId}
          method: get

  createUser:
    handler: src/handlers/dynamodb-handler.createItem
    events:
      - http:
          path: users
          method: post

  s3Processor:
    handler: src/handlers/s3-processor.processS3Event
    events:
      - s3:
          bucket: my-processing-bucket
          event: s3:ObjectCreated:*

resources:
  Resources:
    UsersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:service}-users-${sls:stage}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: userId
            AttributeType: S
        KeySchema:
          - AttributeName: userId
            KeyType: HASH
```

```bash
# Install plugins
npm install --save-dev serverless-plugin-typescript serverless-offline

# Deploy
serverless deploy

# Test locally
serverless offline

# Invoke function
serverless invoke -f hello
```

## Testing

```typescript
// tests/handlers/hello.test.ts
import { handler } from '../../src/handlers/hello';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:test',
  memoryLimitInMB: '256',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test',
  logStreamName: 'test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('Hello Handler', () => {
  it('should return 200 with message', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/hello',
      headers: {},
      queryStringParameters: null,
      body: null,
    };

    const result = await handler(event as APIGatewayProxyEvent, mockContext);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Hello from Lambda!');
    expect(body.requestId).toBe('test-request-id');
  });
});
```

## Environment Variables

```typescript
// src/config/environment.ts
interface Config {
  tableName: string;
  region: string;
  logLevel: string;
}

export const config: Config = {
  tableName: process.env.TABLE_NAME || 'Users',
  region: process.env.AWS_REGION || 'us-east-1',
  logLevel: process.env.LOG_LEVEL || 'info',
};
```

## Best Practices

1. **Use TypeScript strict mode** for type safety
2. **Minimize cold starts**: Keep dependencies small, use Lambda Layers
3. **Error handling**: Always wrap in try-catch, return proper HTTP codes
4. **Logging**: Use structured logging with CloudWatch
5. **Environment variables**: Never hardcode secrets
6. **Connection reuse**: Initialize AWS SDK clients outside handler
7. **Async/await**: Use proper async patterns
8. **Bundle optimization**: Use esbuild or webpack for smaller bundles
