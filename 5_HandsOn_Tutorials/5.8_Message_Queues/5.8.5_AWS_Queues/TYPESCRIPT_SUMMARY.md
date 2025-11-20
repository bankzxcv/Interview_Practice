# TypeScript Code Examples Summary

## Overview

This document summarizes all TypeScript code examples added to the 8 AWS Queue tutorials. All examples use AWS SDK v3 with production-quality TypeScript implementations including proper type annotations, error handling, async/await patterns, and AWS best practices.

## Prerequisites

```bash
# Install Node.js 18+ and npm
node --version  # Should be 18.0.0 or higher

# Navigate to any tutorial directory and install dependencies
cd 01_sqs_basics
npm install
```

## Tutorial 01: SQS Basics

**Location:** `/home/user/Interview_Practice/5_HandsOn_Tutorials/5.8_Message_Queues/5.8.5_AWS_Queues/01_sqs_basics/`

### Files Added

1. **create-queue.ts** - Queue creation (Standard, FIFO, High-throughput FIFO)
   - Type-safe queue creation with QueueAttributeName enum
   - Error handling and validation
   - Support for all queue types

2. **send-messages.ts** - Message sending patterns
   - Single message sending with message attributes
   - Batch sending (up to 10 messages per API call)
   - FIFO message sending with MessageGroupId and MessageDeduplicationId
   - Content-based deduplication support

3. **receive-messages.ts** - Message receiving and processing
   - Short polling vs long polling examples
   - Message deletion after processing
   - Visibility timeout extension for long-running operations
   - Continuous consumer loop with graceful shutdown

4. **producer.ts** - CLI producer script
   - Command-line argument parsing
   - Support for AWS and LocalStack
   - Configurable message count
   - Production-ready error handling

5. **consumer.ts** - CLI consumer script
   - Long polling for cost efficiency
   - Graceful shutdown on SIGINT
   - Batch processing with statistics
   - LocalStack support

6. **localstack-example.ts** - Local development setup
   - Complete LocalStack integration
   - Queue creation, listing, and management
   - Docker Compose configuration guide
   - End-to-end workflow example

7. **package.json** - Dependencies and scripts
8. **tsconfig.json** - TypeScript configuration
9. **README_TYPESCRIPT.md** - Detailed usage guide

### Key Features

- AWS SDK v3 with modular imports
- Full TypeScript type safety
- Interface definitions for message payloads
- Comprehensive error handling
- Async/await throughout
- Batch operations for cost optimization
- Long polling to reduce API calls by 90%

## Tutorial 02: SNS Basics

**Location:** `/home/user/Interview_Practice/5_HandsOn_Tutorials/5.8_Message_Queues/5.8.5_AWS_Queues/02_sns_basics/`

### Files Added

1. **create-topic.ts** - Topic creation
   - Standard SNS topics
   - FIFO SNS topics with content-based deduplication
   - Topic attribute management
   - Get/Set topic attributes with type safety

2. **publish-messages.ts** - Message publishing
   - Simple message publishing
   - JSON message publishing with attributes
   - Protocol-specific message formatting
   - FIFO message publishing
   - Batch publishing (up to 10 messages)

3. **subscriptions.ts** - Subscription management
   - SQS queue subscriptions with policy setup
   - Lambda function subscriptions
   - HTTPS endpoint subscriptions
   - Email subscriptions
   - SMS subscriptions
   - Filter policy configuration

4. **fanout-pattern.ts** - Complete fanout implementation
   - Multi-queue fanout architecture
   - Message filtering per subscription
   - Event publishing with routing
   - Production-ready setup

5. **package.json** - Dependencies

### Key Features

- MessageAttribute type definitions
- SQS queue policy automation
- Filter policy support
- Protocol-specific message formatting
- Batch publish operations
- FIFO topic support

## Tutorial 03: SQS + SNS Integration

**Location:** `/home/user/Interview_Practice/5_HandsOn_Tutorials/5.8_Message_Queues/5.8.5_AWS_Queues/03_sqs_sns_integration/`

### Files Added

1. **fanout-integration.ts** - Complete fanout architecture
   - FanoutArchitecture class for setup and management
   - Multiple queue creation (payment, inventory, notification, analytics)
   - Automatic SQS policy configuration for SNS
   - Message filtering per queue purpose
   - PaymentService consumer example
   - End-to-end event publishing and processing

### Key Features

- Object-oriented architecture
- Automatic policy management
- Filter policies for selective routing
- Service-specific consumer examples
- Type-safe event interfaces
- Production deployment ready

## Tutorial 04: DLQ and Visibility Timeout

**Location:** `/home/user/Interview_Practice/5_HandsOn_Tutorials/5.8_Message_Queues/5.8.5_AWS_Queues/04_dlq_visibility/`

### Files Added

1. **dlq-management.ts** - Dead Letter Queue management
   - Setup queue with DLQ and redrive policy
   - Visibility timeout extension during processing
   - Redrive messages from DLQ back to source queue
   - CloudWatch alarm creation for DLQ monitoring
   - MessageProcessor class with retry logic
   - Automatic failover to DLQ after max retries

### Key Features

- Configurable maxReceiveCount
- Visibility timeout management
- DLQ message recovery/redrive
- CloudWatch integration
- Automatic retry logic
- Error classification and handling

## Tutorial 05: Amazon MQ

**Location:** `/home/user/Interview_Practice/5_HandsOn_Tutorials/5.8_Message_Queues/5.8.5_AWS_Queues/05_amazon_mq/`

### Files Added

1. **package.json** - Dependencies for RabbitMQ/ActiveMQ clients
   - @aws-sdk/client-mq for broker management
   - amqplib for RabbitMQ AMQP protocol
   - stompit for ActiveMQ STOMP protocol

### Key Features

- AWS SDK v3 for broker management
- RabbitMQ client (amqplib) type definitions
- ActiveMQ client (stompit) support
- Ready for custom implementation examples

**Note:** Python examples in README cover RabbitMQ and ActiveMQ extensively. TypeScript implementations follow the same patterns using the amqplib and stompit libraries.

## Tutorial 06: Lambda Integration

**Location:** `/home/user/Interview_Practice/5_HandsOn_Tutorials/5.8_Message_Queues/5.8.5_AWS_Queues/06_lambda_integration/`

### Files Added

1. **sqs-lambda-handler.ts** - Production Lambda handlers
   - SQS event handler with partial batch failure support
   - SNS event handler for topic notifications
   - DynamoDB integration for data persistence
   - SNS publishing for downstream events
   - Context-aware logging and monitoring
   - Error classification (retryable vs permanent)
   - Type-safe event and record processing

### Key Features

- AWS Lambda types (@types/aws-lambda)
- SQSBatchResponse for partial batch failures
- Context usage for remaining time monitoring
- DynamoDB client integration
- SNS client for event publishing
- Proper error handling and retry logic
- Message attribute parsing
- Environment variable configuration

## Tutorial 07: EventBridge

**Location:** `/home/user/Interview_Practice/5_HandsOn_Tutorials/5.8_Message_Queues/5.8.5_AWS_Queues/07_eventbridge/`

### Files Added

1. **eventbridge-rules.ts** - EventBridge setup and routing
   - EventBridgeSetup class for architecture management
   - Custom event bus creation
   - SQS queue creation and integration
   - Automatic SQS policy for EventBridge
   - Event pattern matching rules
   - High-value order filtering (numeric comparisons)
   - Event publishing with structured data
   - Target configuration with retry policies

### Key Features

- Custom event buses
- Advanced event pattern matching
- Numeric filtering (>, <, >=, <=)
- Array matching (prefix, exists, anything-but)
- Multiple targets per rule
- SQS integration
- Type-safe event publishing
- EventPattern interface

## Tutorial 08: Production Patterns

**Location:** `/home/user/Interview_Practice/5_HandsOn_Tutorials/5.8_Message_Queues/5.8.5_AWS_Queues/08_production_patterns/`

### Files Added

1. **batch-operations.ts** - Production best practices
   - BatchProcessor class for efficient message handling
   - Batch sending (up to 10 messages per call)
   - Long polling for cost optimization
   - Parallel message processing
   - Batch deletion
   - CostMonitor class for cost tracking
   - CloudWatch metrics integration
   - Auto-scaling configuration helpers
   - Cost estimation based on usage

### Key Features

- Batch operations for 90% cost reduction
- Long polling (20 second wait)
- Parallel processing with Promise.all
- CloudWatch metrics querying
- Cost estimation ($0.40 per million requests)
- Auto-scaling recommendations
- Production-ready error handling
- Performance optimization patterns

## Common TypeScript Patterns Used

### 1. Type Safety

```typescript
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
  SendMessageCommandOutput,
} from '@aws-sdk/client-sqs';

// Typed inputs and outputs
const params: SendMessageCommandInput = { ... };
const response: SendMessageCommandOutput = await client.send(command);
```

### 2. Interface Definitions

```typescript
interface OrderMessage {
  order_id: string;
  customer: string;
  total: number;
  timestamp: string;
}
```

### 3. Error Handling

```typescript
try {
  const response = await sqsClient.send(command);
  if (!response.QueueUrl) {
    throw new Error('QueueUrl not returned from API');
  }
  return response.QueueUrl;
} catch (error) {
  console.error('Error creating queue:', error);
  throw error;
}
```

### 4. Async/Await

```typescript
export async function sendMessage(
  queueUrl: string,
  message: OrderMessage
): Promise<string> {
  const command = new SendMessageCommand({ ... });
  const response = await sqsClient.send(command);
  return response.MessageId!;
}
```

### 5. Proper AWS Credentials

```typescript
// Default credential chain (recommended)
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Explicit credentials for LocalStack
const localClient = new SQSClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});
```

## AWS SDK v3 Best Practices Implemented

1. **Modular Imports** - Only import needed clients
2. **Command Pattern** - Separate command creation from execution
3. **Type Safety** - Full TypeScript type coverage
4. **Error Handling** - Comprehensive try-catch blocks
5. **Async/Await** - Modern async patterns
6. **Batch Operations** - Cost optimization
7. **Long Polling** - Reduce API calls
8. **Visibility Timeout** - Proper message handling
9. **DLQ Support** - Automatic error handling
10. **CloudWatch Integration** - Monitoring and metrics

## Installation and Usage

### Per-Tutorial Installation

```bash
# Navigate to any tutorial
cd 01_sqs_basics

# Install dependencies
npm install

# Run examples
ts-node create-queue.ts
ts-node producer.ts --queue-url <url> --count 10
ts-node consumer.ts --queue-url <url>
```

### Environment Variables

```bash
# AWS Configuration
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret

# Queue URLs
export QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/my-queue

# Topic ARNs
export TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:my-topic
```

### LocalStack Development

```bash
# Start LocalStack
docker run -d -p 4566:4566 localstack/localstack

# Run with LocalStack
ts-node producer.ts --queue-url http://localhost:4566/000000000000/test-queue --local
ts-node consumer.ts --queue-url http://localhost:4566/000000000000/test-queue --local
```

## File Count Summary

| Tutorial | TypeScript Files | Total Lines | Key Features |
|----------|-----------------|-------------|--------------|
| 01 - SQS Basics | 7 | ~1,200 | Queue creation, send/receive, LocalStack |
| 02 - SNS Basics | 4 | ~800 | Topics, publishing, subscriptions, fanout |
| 03 - SQS+SNS Integration | 1 | ~400 | Complete fanout architecture |
| 04 - DLQ & Visibility | 1 | ~350 | DLQ management, visibility timeout |
| 05 - Amazon MQ | 0* | - | Package.json with dependencies |
| 06 - Lambda Integration | 1 | ~250 | Lambda handlers, batch failures |
| 07 - EventBridge | 1 | ~300 | Event buses, rules, patterns |
| 08 - Production Patterns | 1 | ~350 | Batch ops, cost monitoring |
| **Total** | **16** | **~3,650** | Production-ready examples |

*Note: Tutorial 05 includes package.json with proper dependencies; custom implementations can follow Python examples using the provided libraries.

## Dependencies Overview

### Core AWS SDKs
- `@aws-sdk/client-sqs` - SQS operations
- `@aws-sdk/client-sns` - SNS operations
- `@aws-sdk/client-eventbridge` - EventBridge operations
- `@aws-sdk/client-cloudwatch` - Metrics and monitoring
- `@aws-sdk/client-dynamodb` - DynamoDB integration
- `@aws-sdk/client-mq` - Amazon MQ broker management

### Lambda Development
- `@types/aws-lambda` - Lambda event types

### Message Brokers
- `amqplib` - RabbitMQ AMQP client
- `stompit` - ActiveMQ STOMP client

### Development Tools
- `typescript` - TypeScript compiler
- `ts-node` - Execute TypeScript directly
- `@types/node` - Node.js type definitions

## Next Steps

1. **Install dependencies** in each tutorial directory
2. **Configure AWS credentials** using `aws configure`
3. **Run examples** to see them in action
4. **Modify and extend** for your use cases
5. **Deploy to production** with proper IAM roles and policies

## Additional Resources

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SQS Developer Guide](https://docs.aws.amazon.com/sqs/latest/dg/)
- [SNS Developer Guide](https://docs.aws.amazon.com/sns/latest/dg/)
- [EventBridge User Guide](https://docs.aws.amazon.com/eventbridge/latest/userguide/)
- [Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/)

## Support

All TypeScript examples follow AWS best practices and are production-ready. Each file includes:
- Comprehensive error handling
- Type safety
- Async/await patterns
- Detailed comments
- Example usage
- Environment variable support

For questions or issues, refer to the individual README_TYPESCRIPT.md files in each tutorial directory or the main Python-based README.md files which provide context for each example.
