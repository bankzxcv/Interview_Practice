# GCP Pub/Sub TypeScript Examples

This directory contains comprehensive TypeScript implementations for all 8 GCP Pub/Sub tutorials.

## Prerequisites

- Node.js 18+ and npm
- TypeScript 5.0+
- Google Cloud SDK (gcloud)
- GCP account with billing enabled

## Setup

### 1. Install Dependencies

Each tutorial directory has its own `package.json`. Navigate to a tutorial directory and run:

```bash
cd 01_basic_setup
npm install
```

### 2. Authentication

Set up GCP authentication:

```bash
# Option 1: Service Account (Recommended for production)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Option 2: User Credentials (For development)
gcloud auth application-default login
```

### 3. Set Project ID

```bash
export GCP_PROJECT_ID="your-project-id"
```

## Running Examples

Each TypeScript file can be run directly using `ts-node`:

```bash
# Navigate to tutorial directory
cd 01_basic_setup

# Run example
npm run create-topic
# or
ts-node create-topic.ts
```

## Tutorial Overview

### Tutorial 01: Basic Pub/Sub Setup and Publishing
**Location:** `01_basic_setup/`

**Files:**
- `test-auth.ts` - Authentication verification
- `verify-install.ts` - Installation verification
- `create-topic.ts` - Topic creation and management
- `publish-basic.ts` - Basic message publishing
- `publish-with-attributes.ts` - Publishing with attributes
- `publish-batched.ts` - Batch publishing with flow control
- `emulator-example.ts` - Using Pub/Sub emulator

**Key Features:**
- Proper TypeScript types from `@google-cloud/pubsub`
- Interface definitions for message types
- Async/await patterns throughout
- Comprehensive error handling
- Buffer usage for message data
- GCP credential handling

### Tutorial 02: Pull and Push Subscriptions
**Location:** `02_subscriptions/`

**Files:**
- `create-subscription.ts` - Subscription creation and filtering
- `sync-pull.ts` - Synchronous pull operations
- `async-pull.ts` - Asynchronous streaming pull
- `flow-control.ts` - Flow control configuration

**Key Features:**
- Type-safe message handling
- Event-based message listeners
- Acknowledgment and nack patterns
- Flow control configuration
- Error handling with retries

### Tutorial 03: Message Ordering and Exactly-Once Delivery
**Location:** `03_ordering_delivery/`

**Files:**
- `publish-ordered.ts` - Publishing with ordering keys
- `exactly-once.ts` - Exactly-once delivery implementation

**Key Features:**
- Message ordering with ordering keys
- Exactly-once delivery configuration
- Idempotent processing patterns
- Type-safe event handling

### Tutorial 04: Dead Letter Topics and Retry Policies
**Location:** `04_dead_letter/`

**Files:**
- `setup-dead-letter.ts` - DLT setup and configuration
- `process-dead-letters.ts` - Processing failed messages

**Key Features:**
- Dead letter topic configuration
- Retry policy with exponential backoff
- Failed message analysis
- Reprocessing strategies

### Tutorial 05: Schema Validation
**Location:** `05_schema_validation/`

**Files:**
- `avro-schema.ts` - Avro schema management
- `publish-with-schema.ts` - Schema-validated publishing

**Key Features:**
- Schema creation and management
- Type-safe message validation
- JSON and binary encoding support
- Schema evolution patterns

### Tutorial 06: Cloud Functions and Dataflow Integration
**Location:** `06_dataflow_integration/`

**Files:**
- `cloud-function.ts` - Cloud Function triggered by Pub/Sub
- `fan-out-pattern.ts` - Event-driven fan-out pattern

**Key Features:**
- Cloud Functions integration
- Type definitions for Cloud Function events
- Event-driven architecture patterns
- Fan-out and chaining patterns

### Tutorial 07: BigQuery and Data Pipeline Integration
**Location:** `07_bigquery_integration/`

**Files:**
- `bigquery-subscription.ts` - BigQuery subscription setup
- `publish-to-bigquery.ts` - Publishing data to BigQuery

**Key Features:**
- BigQuery subscription configuration
- Type-safe message schemas
- Data pipeline patterns
- Real-time analytics integration

### Tutorial 08: Global Deployment and Monitoring
**Location:** `08_global_deployment/`

**Files:**
- `global-architecture.ts` - Multi-region architecture
- `monitoring.ts` - Cloud Monitoring integration

**Key Features:**
- Global and regional topic patterns
- Cloud Monitoring integration
- Type-safe metric retrieval
- Health monitoring patterns

## TypeScript Best Practices

### 1. Type Safety

All examples use proper TypeScript types:

```typescript
import { PubSub, Topic, Subscription, Message } from '@google-cloud/pubsub';

interface OrderData {
  order_id: string;
  amount: number;
  currency: string;
}
```

### 2. Async/Await

Consistent use of async/await for better readability:

```typescript
async function publishMessage(
  projectId: string,
  topicId: string,
  data: OrderData
): Promise<string> {
  const pubsub = new PubSub({ projectId });
  const topic = pubsub.topic(topicId);

  const dataBuffer = Buffer.from(JSON.stringify(data), 'utf-8');
  const messageId = await topic.publishMessage({ data: dataBuffer });

  return messageId;
}
```

### 3. Error Handling

Comprehensive error handling with TypeScript:

```typescript
try {
  const messageId = await topic.publishMessage({ data: dataBuffer });
  console.log(`✓ Published: ${messageId}`);
} catch (error: any) {
  if (error.code === 6) { // ALREADY_EXISTS
    console.log('Resource already exists');
  } else {
    console.error('Error:', error.message);
    throw error;
  }
}
```

### 4. Buffer Usage

Proper Buffer handling for message data:

```typescript
// Publishing
const dataBuffer = Buffer.from(JSON.stringify(data), 'utf-8');
await topic.publishMessage({ data: dataBuffer });

// Consuming
const data = JSON.parse(message.data.toString('utf-8'));
```

### 5. Interface Definitions

Clear interface definitions for data structures:

```typescript
interface MessageAttributes {
  [key: string]: string;
}

interface OrderMessage {
  order_id: string;
  customer_id: string;
  amount: number;
  items: OrderItem[];
  metadata: OrderMetadata;
}
```

## Common Patterns

### Publishing Pattern

```typescript
const pubsub = new PubSub({ projectId });
const topic = pubsub.topic(topicId);

const data = { /* your data */ };
const dataBuffer = Buffer.from(JSON.stringify(data), 'utf-8');

const messageId = await topic.publishMessage({
  data: dataBuffer,
  attributes: { key: 'value' },
});
```

### Subscribing Pattern

```typescript
const pubsub = new PubSub({ projectId });
const subscription = pubsub.subscription(subscriptionId);

subscription.on('message', (message: Message) => {
  const data = JSON.parse(message.data.toString('utf-8'));

  // Process message
  console.log('Received:', data);

  // Acknowledge
  message.ack();
});
```

### Error Handling Pattern

```typescript
try {
  const result = await operation();
  console.log('✓ Success:', result);
} catch (error: any) {
  console.error('✗ Error:', error.message);
  // Handle specific error codes
  if (error.code === 6) {
    // Handle ALREADY_EXISTS
  }
  throw error;
}
```

## Additional Resources

- [Google Cloud Pub/Sub Node.js Client](https://github.com/googleapis/nodejs-pubsub)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [GCP Pub/Sub Documentation](https://cloud.google.com/pubsub/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## License

MIT
