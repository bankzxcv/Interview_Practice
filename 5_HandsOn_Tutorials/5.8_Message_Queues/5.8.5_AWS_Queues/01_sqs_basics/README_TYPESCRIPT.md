# TypeScript Examples for SQS Basics

This directory contains TypeScript implementations of all SQS examples using AWS SDK v3.

## Prerequisites

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

## Files

- **create-queue.ts** - Create Standard and FIFO SQS queues
- **send-messages.ts** - Send single and batch messages to SQS
- **receive-messages.ts** - Receive and process messages from SQS
- **producer.ts** - Command-line producer script
- **consumer.ts** - Command-line consumer script
- **localstack-example.ts** - LocalStack development examples
- **package.json** - Dependencies and npm scripts
- **tsconfig.json** - TypeScript configuration

## Quick Start

### 1. Create a Queue

```bash
ts-node create-queue.ts
```

### 2. Send Messages

```bash
# Send single message
ts-node send-messages.ts

# Or use the producer script
ts-node producer.ts --queue-url <your-queue-url> --count 10
```

### 3. Receive Messages

```bash
# Receive and process messages once
ts-node receive-messages.ts

# Or start continuous consumer
ts-node consumer.ts --queue-url <your-queue-url>
```

## LocalStack Development

### Start LocalStack

```bash
# Using Docker
docker run -d -p 4566:4566 localstack/localstack

# Or using Docker Compose (see localstack-example.ts --help)
docker-compose up -d
```

### Run LocalStack Example

```bash
# Run the complete LocalStack workflow
ts-node localstack-example.ts

# With LocalStack flag in producer/consumer
ts-node producer.ts --queue-url http://localhost:4566/000000000000/test-queue --local
ts-node consumer.ts --queue-url http://localhost:4566/000000000000/test-queue --local
```

## Environment Variables

```bash
# AWS Region (default: us-east-1)
export AWS_REGION=us-east-1

# Queue URL for quick testing
export QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/my-queue
```

## AWS SDK v3 TypeScript Best Practices

### 1. Type Safety

All examples use proper TypeScript types from AWS SDK v3:

```typescript
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
  SendMessageCommandOutput,
} from '@aws-sdk/client-sqs';
```

### 2. Interface Definitions

Custom interfaces for message payloads:

```typescript
interface OrderMessage {
  order_id: string;
  customer: string;
  total: number;
  timestamp: string;
}
```

### 3. Error Handling

Comprehensive try-catch blocks with type-safe error handling:

```typescript
try {
  const response = await sqsClient.send(command);
  // Handle success
} catch (error) {
  console.error('Error:', error);
  throw error;
}
```

### 4. Async/Await

All AWS operations use async/await pattern:

```typescript
export async function sendMessage(
  queueUrl: string,
  message: OrderMessage
): Promise<string> {
  const command = new SendMessageCommand({...});
  const response = await sqsClient.send(command);
  return response.MessageId!;
}
```

### 5. Proper Credential Handling

```typescript
// Use default credential chain (recommended)
const sqsClient = new SQSClient({
  region: 'us-east-1',
});

// Or explicit credentials for LocalStack
const localClient = new SQSClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});
```

## Key Features

### Batch Operations

```typescript
// Send up to 10 messages in one API call
await sendMessageBatch(queueUrl, messages);
```

### Long Polling

```typescript
// Reduce costs by up to 90%
const response = await sqsClient.send(
  new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    WaitTimeSeconds: 20, // Long polling
  })
);
```

### FIFO Queues

```typescript
// Guaranteed ordering and exactly-once processing
await sendFifoMessage(
  queueUrl,
  message,
  'order-group-1', // MessageGroupId
  'unique-id-12345' // MessageDeduplicationId
);
```

## Build and Deploy

```bash
# Compile TypeScript to JavaScript
npm run build

# Run compiled JavaScript
node dist/producer.js --queue-url <url> --count 10

# Lint code
npm run lint

# Format code
npm run format
```

## Common Patterns

### Consumer Loop with Graceful Shutdown

```typescript
let running = true;

process.on('SIGINT', () => {
  running = false;
});

while (running) {
  const messages = await receiveMessages(queueUrl);
  // Process messages...
}
```

### Visibility Timeout Extension

```typescript
// Extend timeout for long-running operations
await extendVisibilityTimeout(queueUrl, receiptHandle, 300);
```

### Message Attributes

```typescript
// Add metadata without parsing message body
MessageAttributes: {
  Priority: {
    DataType: 'String',
    StringValue: 'high',
  },
  OrderType: {
    DataType: 'String',
    StringValue: 'standard',
  },
}
```

## Troubleshooting

### Authentication Errors

```bash
# Configure AWS credentials
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=us-east-1
```

### LocalStack Connection Issues

```bash
# Check LocalStack is running
curl http://localhost:4566/_localstack/health

# Restart LocalStack
docker restart <container-id>
```

## Additional Resources

- [AWS SDK for JavaScript v3 Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [SQS Developer Guide](https://docs.aws.amazon.com/sqs/latest/dg/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [LocalStack Documentation](https://docs.localstack.cloud/)

## Next Steps

- [Tutorial 02: SNS Basics](../02_sns_basics/README_TYPESCRIPT.md)
- [Tutorial 04: Dead Letter Queues](../04_dlq_visibility/README_TYPESCRIPT.md)
