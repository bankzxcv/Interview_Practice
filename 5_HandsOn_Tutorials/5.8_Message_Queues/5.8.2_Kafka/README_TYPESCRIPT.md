# Kafka Tutorials - TypeScript Examples

This directory contains TypeScript implementations of all Kafka tutorials using **KafkaJS**, the most popular Kafka client for Node.js/TypeScript.

## Overview

TypeScript code examples have been added to the following tutorials:

1. **01_basic_setup** - Basic producer and consumer with manual offset control
2. **02_consumer_groups** - Consumer groups, partitioning, and offset strategies
3. **03_kafka_connect** - Kafka Connect REST API management
4. **04_kafka_streams** - (Python/Java only - KafkaJS doesn't support Kafka Streams)
5. **05_schema_registry** - Avro serialization with Schema Registry
6. **06_exactly_once** - Transactional producer and consumer
7. **07_monitoring** - (Configuration-based, no code examples)
8. **08_kubernetes_deployment** - (YAML-based, no code examples)

## Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose (for running Kafka)
- **TypeScript** knowledge
- Running Kafka cluster (see individual tutorial READMEs)

## Installation

Navigate to any tutorial directory and install dependencies:

```bash
cd 01_basic_setup
npm install
```

This will install:
- `kafkajs` - Kafka client library
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution environment
- Additional libraries as needed (axios, schema registry, etc.)

## Running TypeScript Examples

Each tutorial has npm scripts configured. Examples:

### Tutorial 01 - Basic Setup

```bash
cd 01_basic_setup

# Install dependencies
npm install

# Run producer
npm run producer

# Run consumer (in another terminal)
npm run consumer

# Manual offset control example
npm run manual-offset
```

### Tutorial 02 - Consumer Groups

```bash
cd 02_consumer_groups

npm install

# Run producer
npm run producer

# Run consumer (multiple terminals with different IDs)
npm run consumer -- 1  # Consumer 1
npm run consumer -- 2  # Consumer 2
npm run consumer -- 3  # Consumer 3

# Test offset strategies
npm run offset-strategies
```

### Tutorial 03 - Kafka Connect

```bash
cd 03_kafka_connect

npm install

# Run connector manager
npm run manager
```

### Tutorial 05 - Schema Registry

```bash
cd 05_schema_registry

npm install

# Ensure Schema Registry is running
# Run producer
npm run producer

# Run consumer
npm run consumer
```

### Tutorial 06 - Exactly-Once Semantics

```bash
cd 06_exactly_once

npm install

# Run transactional producer
npm run transactional-producer

# Run transactional consumer
npm run transactional-consumer
```

## TypeScript Features

All TypeScript examples include:

### ✅ Proper Type Annotations

```typescript
interface UserEvent {
  user_id: string;
  event_id: number;
  event_type: 'login' | 'logout';
  timestamp: string;
  metadata: {
    ip_address: string;
    device: 'mobile' | 'web';
  };
}
```

### ✅ Interface Definitions

```typescript
interface ProducerConfig {
  brokers: string[];
  topic: string;
  numMessages: number;
}
```

### ✅ Error Handling with Try/Catch

```typescript
try {
  await producer.send(record);
} catch (error) {
  console.error('Error sending message:', error);
  throw error;
}
```

### ✅ Async/Await Patterns

```typescript
async function sendMessages(producer: Producer): Promise<void> {
  const metadata = await producer.send(record);
  console.log(`Offset: ${metadata[0].offset}`);
}
```

### ✅ Type Imports from KafkaJS

```typescript
import {
  Kafka,
  Producer,
  Consumer,
  EachMessagePayload,
  ProducerRecord,
  RecordMetadata
} from 'kafkajs';
```

### ✅ Graceful Shutdown Handlers

```typescript
async function shutdown(producer: Producer, signal: string): Promise<void> {
  console.log(`${signal} received. Shutting down...`);
  await producer.disconnect();
  process.exit(0);
}

process.on('SIGINT', () => shutdown(producer, 'SIGINT'));
process.on('SIGTERM', () => shutdown(producer, 'SIGTERM'));
```

### ✅ Proper Kafka Configuration Types

```typescript
const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionalId: undefined,
  maxInFlightRequests: 1,
  idempotent: true,
  compression: CompressionTypes.GZIP,
});
```

## Code Quality

All TypeScript code follows best practices:

- **Strict type checking** enabled in tsconfig.json
- **No implicit any** types
- **Null safety** with strict null checks
- **Immutability** where appropriate
- **Clear error messages** and logging
- **Production-ready** patterns
- **Well-commented** code
- **Modular design** with exportable functions and classes

## Building TypeScript

To compile TypeScript to JavaScript:

```bash
# In any tutorial directory
npm run build

# Compiled files will be in the dist/ directory
```

To clean build artifacts:

```bash
npm run clean
```

## Direct Execution

You can also run TypeScript files directly:

```bash
# Using ts-node
npx ts-node producer.ts

# Or make executable and run
chmod +x producer.ts
./producer.ts
```

## KafkaJS vs Python Client

| Feature | KafkaJS (TypeScript) | kafka-python |
|---------|---------------------|--------------|
| Type Safety | ✅ Full TypeScript support | ❌ No typing |
| Async/Await | ✅ Native promises | ❌ Sync callbacks |
| Transactions | ✅ Full support | ✅ Supported |
| Schema Registry | ✅ Via @kafkajs/confluent-schema-registry | ✅ Via confluent-kafka |
| Streams | ❌ Not supported | ❌ Not supported |
| Performance | ⚡ Very fast | ⚡ Fast |
| Production Ready | ✅ Yes | ✅ Yes |

## Common Issues

### Port Already in Use

```bash
# Check what's using port 9092
lsof -i :9092

# Or change Kafka port in docker-compose.yml
```

### Type Errors

```bash
# Make sure all dependencies are installed
npm install

# Check TypeScript version
npx tsc --version
```

### Module Not Found

```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Additional Resources

- [KafkaJS Documentation](https://kafka.js.org/)
- [KafkaJS GitHub](https://github.com/tulios/kafkajs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Confluent Schema Registry Client](https://github.com/kafkajs/confluent-schema-registry)

## Contributing

When adding new TypeScript examples:

1. Follow the existing code structure
2. Include proper type definitions
3. Add npm scripts to package.json
4. Test with actual Kafka cluster
5. Document usage in comments

---

**Note**: Tutorial 04 (Kafka Streams) doesn't have TypeScript examples because KafkaJS doesn't support Kafka Streams API. For stream processing in Node.js/TypeScript, consider using:
- Kafka Streams via Java interop
- Custom stream processing with KafkaJS consumers
- Alternative frameworks like Apache Flink

**Note**: Tutorials 07 and 08 are primarily configuration-based and don't require application code examples.
