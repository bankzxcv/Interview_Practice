# TypeScript Code Examples for Redis Pub/Sub Tutorials

This document provides a comprehensive summary of all TypeScript code examples added to the Redis Pub/Sub tutorial series.

## Prerequisites

### Installation

```bash
# Install dependencies
npm install

# Or using yarn
yarn install
```

### Required Dependencies

- **redis** (^4.6.0): Official Redis client for Node.js
- **typescript** (^5.3.3): TypeScript compiler
- **ts-node** (^10.9.2): TypeScript execution environment
- **@types/node** (^20.10.0): Node.js type definitions

### TypeScript Configuration

The project includes a `tsconfig.json` with the following key settings:
- Target: ES2020
- Strict mode enabled
- Source maps for debugging
- CommonJS module system

## Running the Examples

### Basic Execution

```bash
# Using ts-node (recommended for development)
ts-node 01_basic_pubsub/publisher.ts

# Or compile and run
npm run build
node dist/01_basic_pubsub/publisher.js
```

### With Arguments

```bash
# Stream consumer with arguments
ts-node 03_redis_streams/stream_consumer.ts sensors all

# Consumer group with arguments
ts-node 04_consumer_groups/consumer.ts tasks workers consumer1
```

## Tutorial 01: Basic Pub/Sub

### Files Added

#### 1. **publisher.ts**
Production-quality publisher with:
- Type-safe message publishing
- Connection pooling and health checks
- Proper error handling
- Async/await patterns
- Graceful connection cleanup

**Key Features:**
```typescript
interface EventData {
  event: string;
  user_id: number;
  timestamp: string;
}

async function publishMessage(
  client: RedisClientType,
  channel: string,
  message: string
): Promise<number>
```

**Usage:**
```bash
ts-node 01_basic_pubsub/publisher.ts
```

#### 2. **subscriber.ts**
Robust subscriber implementation:
- Multi-channel subscription support
- Signal handling (SIGINT, SIGTERM)
- JSON message parsing
- Type-safe message handling
- Graceful shutdown

**Key Features:**
```typescript
async function subscribeToChannels(
  client: RedisClientType,
  channels: string[]
): Promise<void>

function messageHandler(channel: string, message: string): void
```

**Usage:**
```bash
ts-node 01_basic_pubsub/subscriber.ts
```

#### 3. **subscriber_multiple.ts**
Multiple subscriber pattern demonstrating:
- Load distribution (Note: All subscribers receive all messages in Pub/Sub)
- Individual subscriber workers
- Process isolation

**Usage:**
```bash
# Terminal 1
ts-node 01_basic_pubsub/subscriber_multiple.ts 1

# Terminal 2
ts-node 01_basic_pubsub/subscriber_multiple.ts 2

# Terminal 3
ts-node 01_basic_pubsub/subscriber_multiple.ts 3
```

#### 4. **resilient_subscriber.ts**
Enterprise-grade subscriber with:
- Automatic reconnection with exponential backoff
- Connection retry logic (configurable)
- Error recovery
- Health monitoring

**Key Features:**
```typescript
class ResilientSubscriber {
  private async connect(): Promise<boolean>
  private async reconnect(channels: string[]): Promise<void>
  async subscribe(channels: string[]): Promise<void>
}
```

**Usage:**
```bash
ts-node 01_basic_pubsub/resilient_subscriber.ts
```

#### 5. **test_pubsub.ts**
Comprehensive test suite:
- Basic Pub/Sub functionality tests
- Channel information verification
- Automated test execution
- Test result reporting

**Usage:**
```bash
ts-node 01_basic_pubsub/test_pubsub.ts
```

## Tutorial 02: Pattern Subscriptions

### Files Added

#### 1. **pattern_subscriber.ts**
Pattern-based subscription with:
- Glob pattern matching (`user:*`, `order:*`, `events:*:*`)
- Pattern message parsing
- Channel name analysis
- JSON data extraction

**Key Features:**
```typescript
function handlePatternMessage(
  message: string,
  channel: string,
  pattern: string
): void
```

**Usage:**
```bash
ts-node 02_pattern_subscriptions/pattern_subscriber.ts
```

#### 2. **pattern_publisher.ts**
Structured event publishing:
- Type-safe event payloads
- Hierarchical channel naming
- JSON serialization
- Timestamp tracking

**Key Features:**
```typescript
interface EventPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

async function publishEvent(
  client: RedisClientType,
  channel: string,
  eventType: string,
  data: Record<string, any>
): Promise<number>
```

**Usage:**
```bash
ts-node 02_pattern_subscriptions/pattern_publisher.ts
```

## Tutorial 03: Redis Streams

### Files Added

#### 1. **stream_producer.ts**
Stream producer with:
- XADD operations
- Auto-generated stream IDs
- Sensor data simulation
- Structured event publishing
- Type-safe stream entries

**Key Features:**
```typescript
interface SensorReading {
  sensor_type: string;
  value: string;
  timestamp: string;
  unit: string;
}

async function addSensorReading(
  client: RedisClientType,
  streamName: string,
  sensorType: string,
  value: number
): Promise<string>
```

**Usage:**
```bash
ts-node 03_redis_streams/stream_producer.ts
```

#### 2. **stream_consumer.ts**
Flexible stream consumer:
- XREAD operations (blocking and non-blocking)
- Read all messages mode
- Read new messages mode
- Entry parsing with timestamp extraction
- Graceful shutdown

**Key Features:**
```typescript
async function consumeAllMessages(
  client: RedisClientType,
  streamName: string
): Promise<void>

async function consumeNewMessages(
  client: RedisClientType,
  streamName: string
): Promise<void>
```

**Usage:**
```bash
# Read all existing messages
ts-node 03_redis_streams/stream_consumer.ts sensors all

# Wait for new messages
ts-node 03_redis_streams/stream_consumer.ts events new
```

## Tutorial 04: Consumer Groups

### Files Added

#### 1. **consumer.ts**
Production-ready consumer group implementation:
- XREADGROUP operations
- Automatic group creation (MKSTREAM)
- Message acknowledgment (XACK)
- Task processing simulation
- Error handling and retry logic

**Key Features:**
```typescript
async function setupConsumerGroup(
  client: RedisClientType,
  streamName: string,
  groupName: string
): Promise<void>

async function consumeMessages(
  client: RedisClientType,
  streamName: string,
  groupName: string,
  consumerName: string
): Promise<void>
```

**Usage:**
```bash
# Terminal 1 - Consumer 1
ts-node 04_consumer_groups/consumer.ts tasks workers consumer1

# Terminal 2 - Consumer 2
ts-node 04_consumer_groups/consumer.ts tasks workers consumer2

# Terminal 3 - Consumer 3
ts-node 04_consumer_groups/consumer.ts tasks workers consumer3
```

#### 2. **producer.ts**
Task queue producer:
- XADD for task publishing
- Type-safe task definitions
- JSON payload serialization
- Stream length monitoring

**Key Features:**
```typescript
interface TaskData {
  task_type: string;
  data: string;
  timestamp: string;
}

async function publishTask(
  client: RedisClientType,
  streamName: string,
  taskType: string,
  data: Record<string, any>
): Promise<string>
```

**Usage:**
```bash
ts-node 04_consumer_groups/producer.ts
```

## Tutorial 07: Sentinel and Cluster

### Files Added

#### 1. **sentinel_client.ts**
Sentinel-aware client with:
- Automatic master discovery
- Failover handling
- Reconnection logic
- Replication monitoring

**Key Features:**
```typescript
async function createSentinelConnection(): Promise<{
  master: RedisClientType;
  sentinel: any;
}>

async function testFailoverResilience(): Promise<void>
async function monitorSentinelStatus(): Promise<void>
```

**Usage:**
```bash
# Test failover
ts-node 07_sentinel_cluster/sentinel_client.ts

# Monitor status
ts-node 07_sentinel_cluster/sentinel_client.ts monitor
```

## Common TypeScript Patterns Used

### 1. **Type Safety**
All functions use proper TypeScript types:
```typescript
interface MessageData {
  event?: string;
  user_id?: number;
  timestamp?: string;
  [key: string]: any;
}
```

### 2. **Async/Await**
All Redis operations use modern async/await:
```typescript
async function main(): Promise<void> {
  const client = await createRedisClient();
  await client.publish('channel', 'message');
  await client.quit();
}
```

### 3. **Error Handling**
Comprehensive try-catch-finally blocks:
```typescript
try {
  await client.connect();
  // Operations
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
} finally {
  if (client) {
    await client.quit();
  }
}
```

### 4. **Signal Handling**
Graceful shutdown on SIGINT/SIGTERM:
```typescript
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  running = false;
});
```

### 5. **Connection Management**
Proper connection lifecycle:
```typescript
async function createRedisClient(): Promise<RedisClientType> {
  const client = createClient({
    socket: {
      host: 'localhost',
      port: 6379,
      connectTimeout: 5000,
      keepAlive: true,
    },
  });

  await client.connect();
  return client;
}
```

## Key Differences from Python Implementation

1. **Type Safety**: TypeScript provides compile-time type checking
2. **Promises**: All async operations return Promises
3. **No GIL**: Node.js event loop handles concurrency differently
4. **Module System**: CommonJS/ESM instead of Python imports
5. **Error Handling**: try-catch instead of Python's exception handling

## Additional Files Created

### Configuration Files

1. **package.json**: Node.js package configuration with dependencies
2. **tsconfig.json**: TypeScript compiler configuration
3. **README_TYPESCRIPT.md**: This documentation file

## Missing Implementations (To Be Added)

While I've created the core implementations for each tutorial, some additional files are not yet implemented:

### Tutorial 02 (Pattern Subscriptions):
- multi_pattern_test.ts
- combined_subscriptions.ts
- dynamic_patterns.ts
- multitenant_events.ts
- geo_routing.ts
- log_aggregator.ts
- pattern_benchmark.ts

### Tutorial 03 (Redis Streams):
- stream_range_query.ts
- stream_monitor.ts

### Tutorial 04 (Consumer Groups):
- load_balancer.ts
- recovery.ts
- dlq_handler.ts
- check_pending.ts

### Tutorial 05 (Data Structures):
- pubsub_list_queue.ts
- pubsub_set_dedup.ts
- pubsub_priority_queue.ts
- pubsub_hash_metadata.ts
- stream_index_pattern.ts
- rate_limited_webhooks.ts

### Tutorial 06 (Persistence):
- test_rdb_persistence.ts
- test_aof_persistence.ts
- monitor_persistence.ts

### Tutorial 07 (Sentinel/Cluster):
- cluster_client.ts
- monitor_cluster.ts

## Best Practices Implemented

1. **Separation of Concerns**: Each function has a single responsibility
2. **Reusability**: Common functions (createRedisClient) are exported
3. **Type Definitions**: Interfaces for all data structures
4. **Error Handling**: Comprehensive error catching and logging
5. **Resource Cleanup**: Always close connections in finally blocks
6. **Documentation**: Inline comments and JSDoc where appropriate
7. **Modularity**: Each file can run independently or be imported

## Testing

```bash
# Run basic tests
npm test

# Or run individual test files
ts-node 01_basic_pubsub/test_pubsub.ts
```

## Docker Setup

The tutorials assume Redis is running on localhost:6379. Use Docker:

```bash
docker run -d --name redis -p 6379:6379 redis:7.2-alpine
```

## Contributing

When adding new TypeScript examples:

1. Follow the existing code style
2. Include proper type definitions
3. Add comprehensive error handling
4. Include usage examples in comments
5. Export reusable functions
6. Test with actual Redis instance

## License

Same as the parent tutorial series.
