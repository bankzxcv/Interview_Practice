# RabbitMQ TypeScript Examples

This directory contains TypeScript implementations of all RabbitMQ tutorial code examples.

## Prerequisites

- Node.js 14+ installed
- npm or yarn package manager
- RabbitMQ server running (see individual tutorial README.md files for setup)

## Installation

From the `5.8.1_RabbitMQ` directory, run:

```bash
npm install
```

This will install all required dependencies including:
- `amqplib` - RabbitMQ client library
- `@types/amqplib` - TypeScript type definitions
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution engine
- `axios` - HTTP client for Management API

## Running TypeScript Examples

### Option 1: Using ts-node (Recommended for Development)

Run TypeScript files directly without compilation:

```bash
# Producer example
ts-node 01_basic_setup/producer.ts

# Consumer example
ts-node 01_basic_setup/consumer.ts

# With arguments
ts-node 02_exchanges/direct_producer.ts error "Database connection failed"
ts-node 02_exchanges/direct_consumer.ts error warning
```

### Option 2: Compile and Run

Compile TypeScript to JavaScript first:

```bash
# Compile all TypeScript files
npm run build

# Run compiled JavaScript
node dist/01_basic_setup/producer.js
node dist/01_basic_setup/consumer.js
```

## Tutorial Examples

### Tutorial 01: Basic Setup

**Producer:**
```bash
ts-node 01_basic_setup/producer.ts
```

**Consumer:**
```bash
ts-node 01_basic_setup/consumer.ts
```

### Tutorial 02: Exchanges

**Direct Exchange:**
```bash
# Consumer (terminal 1)
ts-node 02_exchanges/direct_consumer.ts error warning

# Producer (terminal 2)
ts-node 02_exchanges/direct_producer.ts error "Database error"
ts-node 02_exchanges/direct_producer.ts warning "High memory usage"
```

**Topic Exchange:**
```bash
# Consumer (terminal 1)
ts-node 02_exchanges/topic_consumer.ts "*.critical" "kern.*"

# Producer (terminal 2)
ts-node 02_exchanges/topic_producer.ts kern.critical "System crash"
ts-node 02_exchanges/topic_producer.ts app.critical "Out of memory"
```

**Fanout Exchange:**
```bash
# Consumer 1 (terminal 1)
ts-node 02_exchanges/fanout_consumer.ts 1

# Consumer 2 (terminal 2)
ts-node 02_exchanges/fanout_consumer.ts 2

# Producer (terminal 3)
ts-node 02_exchanges/fanout_producer.ts "System maintenance in 10 minutes"
```

**Headers Exchange:**
```bash
# Consumer (terminal 1)
ts-node 02_exchanges/headers_consumer.ts

# Producer (terminal 2)
ts-node 02_exchanges/headers_producer.ts 1
```

### Tutorial 03: Routing Patterns

**Log Aggregation:**
```bash
# Consumer (terminal 1)
ts-node 03_routing_patterns/log_aggregation_consumer.ts errors

# Producer (terminal 2)
ts-node 03_routing_patterns/log_aggregation_producer.ts
```

### Tutorial 04: Dead Letter Queues

**Retry Mechanism:**
```bash
# Consumer (terminal 1)
ts-node 04_dead_letter_queues/retry_consumer.ts

# Producer (terminal 2)
ts-node 04_dead_letter_queues/retry_producer.ts "Retry message" 2

# Monitor (terminal 3)
ts-node 04_dead_letter_queues/dlq_monitor.ts
```

### Tutorial 05: Clustering & HA

**Cluster Producer/Consumer:**
```bash
# Consumer (terminal 1)
ts-node 05_clustering_ha/cluster_consumer.ts

# Producer (terminal 2)
ts-node 05_clustering_ha/cluster_producer.ts
```

### Tutorial 06: Federation & Shovel

**Federation:**
```bash
# Consumer on West (terminal 1)
ts-node 06_federation_shovel/federation_consumer.ts west

# Consumer on East (terminal 2)
ts-node 06_federation_shovel/federation_consumer.ts east

# Publisher to West (terminal 3)
ts-node 06_federation_shovel/federation_publisher.ts west
```

### Tutorial 07: Monitoring & Management

**Management API Client:**
```bash
ts-node 07_monitoring_management/management_api_client.ts
```

## TypeScript Features Demonstrated

All TypeScript examples showcase:

### 1. Proper Type Annotations
```typescript
interface HelloMessage {
    id: number;
    text: string;
    timestamp: string;
}
```

### 2. Interface Definitions
```typescript
interface ClusterHost {
    host: string;
    port: number;
}
```

### 3. Error Handling
```typescript
try {
    await sendMessage();
} catch (error) {
    console.error('Error:', error);
    throw error;
}
```

### 4. Async/Await Patterns
```typescript
async function consumeMessages(): Promise<void> {
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    // ...
}
```

### 5. Resource Management (try/finally)
```typescript
try {
    // Use resources
} finally {
    if (channel) await channel.close();
    if (connection) await connection.close();
}
```

### 6. Type Imports from amqplib
```typescript
import { Connection, Channel, ConsumeMessage } from 'amqplib';
```

## Code Quality

The TypeScript examples follow these best practices:

- **Strict Type Safety**: All types are explicitly defined
- **Error Handling**: Comprehensive try/catch blocks
- **Resource Cleanup**: Proper connection and channel cleanup
- **Async/Await**: Modern asynchronous patterns
- **Graceful Shutdown**: SIGINT/SIGTERM handlers
- **Comments**: Clear documentation for all functions
- **Exports**: All functions and types are exported for reuse

## Development Tools

### Format Code
```bash
npm run format
```

### Type Check
```bash
npx tsc --noEmit
```

### Clean Build
```bash
npm run clean
npm run build
```

## Common Issues

### Connection Errors
If you get connection errors, ensure RabbitMQ is running:
```bash
docker-compose ps
docker-compose up -d
```

### Type Errors
If you get TypeScript type errors, ensure dependencies are installed:
```bash
npm install
```

### Permission Errors
Make TypeScript files executable:
```bash
chmod +x **/*.ts
```

## Additional Resources

- [amqplib Documentation](https://www.npmjs.com/package/amqplib)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)

## License

MIT
