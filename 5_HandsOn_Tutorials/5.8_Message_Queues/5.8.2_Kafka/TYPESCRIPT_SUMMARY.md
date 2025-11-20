# TypeScript Code Examples - Summary

This document summarizes all TypeScript code examples added to the Kafka tutorials.

## Files Added

### Tutorial 01: Basic Setup (3 TypeScript files)

**Location**: `/5.8.2_Kafka/01_basic_setup/`

| File | Description | Key Features |
|------|-------------|--------------|
| `producer.ts` | Basic Kafka producer | - Proper type annotations for UserEvent<br/>- Compression (GZIP)<br/>- Idempotent producer<br/>- Graceful shutdown handling<br/>- Error handling with try/catch |
| `consumer.ts` | Basic Kafka consumer | - Manual offset commits<br/>- Type-safe message deserialization<br/>- Business logic processing<br/>- Graceful shutdown on SIGINT/SIGTERM |
| `consumer_manual_offset.ts` | Manual offset control | - Partition assignment<br/>- Seeking to specific offsets<br/>- Examples of seeking to beginning/end<br/>- Admin API usage for offset fetching |
| `package.json` | NPM configuration | - Scripts for running examples<br/>- kafkajs@^2.2.4 dependency |
| `tsconfig.json` | TypeScript configuration | - Strict mode enabled<br/>- ES2020 target<br/>- Source maps |

---

### Tutorial 02: Consumer Groups (3 TypeScript files)

**Location**: `/5.8.2_Kafka/02_consumer_groups/`

| File | Description | Key Features |
|------|-------------|--------------|
| `producer_with_keys.ts` | Key-based partitioning producer | - OrderEvent interface with union types<br/>- Customer ID as partition key<br/>- Partition distribution statistics<br/>- Visual bar chart in console |
| `consumer_group.ts` | Consumer group member | - Command-line consumer ID argument<br/>- Partition assignment tracking<br/>- Rebalance event listeners<br/>- Per-partition message counters |
| `offset_strategies.ts` | Offset commit strategies | - Auto-commit example<br/>- Manual sync commit<br/>- Batch commit with EachBatchPayload<br/>- Performance comparisons |
| `package.json` | NPM configuration | - Multiple run scripts<br/>- kafkajs dependency |
| `tsconfig.json` | TypeScript configuration | - Strict typing<br/>- No unused variables |

---

### Tutorial 03: Kafka Connect (1 TypeScript file)

**Location**: `/5.8.2_Kafka/03_kafka_connect/`

| File | Description | Key Features |
|------|-------------|--------------|
| `connector_manager.ts` | REST API connector management | - KafkaConnectManager class<br/>- Full CRUD operations on connectors<br/>- Type-safe REST API calls with axios<br/>- Connector status monitoring<br/>- Plugin listing<br/>- Async/await HTTP operations |
| `package.json` | NPM configuration | - axios@^1.6.2 for HTTP requests<br/>- Manager run script |
| `tsconfig.json` | TypeScript configuration | - Strict null checks<br/>- Module resolution |

**Interfaces**:
- `ConnectorConfig` - Connector configuration
- `ConnectorStatus` - Status response structure
- `ConnectorInfo` - Connector metadata
- `TaskInfo` - Task information

---

### Tutorial 05: Schema Registry (2 TypeScript files)

**Location**: `/5.8.2_Kafka/05_schema_registry/`

| File | Description | Key Features |
|------|-------------|--------------|
| `producer_avro.ts` | Avro serialization producer | - AvroProducerExample class<br/>- Schema Registry integration<br/>- Automatic schema registration<br/>- User interface with typed fields<br/>- Avro schema definition<br/>- Message encoding with schema ID |
| `consumer_avro.ts` | Avro deserialization consumer | - AvroConsumerExample class<br/>- Automatic schema resolution<br/>- Type-safe deserialization<br/>- Schema fetching by embedded ID<br/>- Graceful shutdown patterns |
| `package.json` | NPM configuration | - @kafkajs/confluent-schema-registry<br/>- avro-js@^1.11.3<br/>- Producer and consumer scripts |
| `tsconfig.json` | TypeScript configuration | - JSON module resolution<br/>- Declaration maps |

**Avro Schema**:
```typescript
{
  type: 'record',
  name: 'User',
  fields: [id: int, name: string, age: int, created_at: long]
}
```

---

### Tutorial 06: Exactly-Once Semantics (2 TypeScript files)

**Location**: `/5.8.2_Kafka/06_exactly_once/`

| File | Description | Key Features |
|------|-------------|--------------|
| `transactional_producer.ts` | Transactional producer | - TransactionalProducer class<br/>- Atomic multi-topic writes<br/>- Transaction begin/commit/abort<br/>- Failure simulation<br/>- Automatic idempotence<br/>- OrderMessage interface |
| `transactional_consumer.ts` | Exactly-once consumer | - TransactionalConsumer class<br/>- Read-committed isolation<br/>- Consume-transform-produce pattern<br/>- Offset commits in transactions<br/>- Atomic message + offset commits<br/>- Error handling with abort |
| `package.json` | NPM configuration | - Transactional scripts<br/>- kafkajs with transaction support |
| `tsconfig.json` | TypeScript configuration | - Strict function types<br/>- No implicit returns |

**Transaction Flow**:
1. Begin transaction
2. Send messages to multiple topics
3. Commit consumer offsets
4. Commit transaction (all or nothing)
5. Abort on any error

---

## Tutorial Coverage

| Tutorial | TypeScript Files | Python Equivalent | Status |
|----------|-----------------|-------------------|---------|
| 01. Basic Setup | 3 files | ✅ producer.py, consumer.py, consumer_manual_offset.py | ✅ Complete |
| 02. Consumer Groups | 3 files | ✅ producer_with_keys.py, consumer_group.py, offset_strategies.py | ✅ Complete |
| 03. Kafka Connect | 1 file | ✅ connector_manager.py | ✅ Complete |
| 04. Kafka Streams | N/A | ⚠️ Python examples only | ⚠️ KafkaJS doesn't support Streams API |
| 05. Schema Registry | 2 files | ✅ producer_avro.py, consumer_avro.py | ✅ Complete |
| 06. Exactly-Once | 2 files | ✅ transactional_producer.py, transactional_consumer.py | ✅ Complete |
| 07. Monitoring | N/A | ℹ️ Config files only | ℹ️ No code examples |
| 08. Kubernetes | N/A | ℹ️ YAML files only | ℹ️ No code examples |

**Total**: 11 TypeScript files + 6 package.json + 5 tsconfig.json + 2 README files = **24 files**

---

## TypeScript Advantages Over Python

### 1. Type Safety
```typescript
// TypeScript - Compile-time type checking
interface UserEvent {
  user_id: string;
  event_id: number;  // Must be a number
  event_type: 'login' | 'logout';  // Only these two values
}

// Python - Runtime errors only
user_event = {
    'user_id': 'user-1',
    'event_id': '123',  # String instead of int - no error until runtime
    'event_type': 'signin'  # Typo - no error until runtime
}
```

### 2. IDE Support
- **IntelliSense**: Auto-completion for all Kafka methods
- **Type Hints**: Hover to see parameter types
- **Refactoring**: Safe rename across project
- **Error Detection**: Catch errors before running

### 3. Async/Await
```typescript
// TypeScript - Clean async code
async function sendMessage() {
  const metadata = await producer.send(record);
  console.log(`Offset: ${metadata[0].offset}`);
}

// Python - Callback-based or sync
def send_message():
    future = producer.send(topic, value)
    metadata = future.get(timeout=10)
    print(f"Offset: {metadata.offset}")
```

### 4. Better Error Messages
```typescript
// TypeScript compiler error
Property 'ofset' does not exist on type 'RecordMetadata'. Did you mean 'offset'?

// Python runtime error
AttributeError: 'RecordMetadata' object has no attribute 'ofset'
```

---

## Code Quality Features

All TypeScript examples include:

### ✅ Strict Type Checking
- No `any` types
- Null safety with strict null checks
- Type inference where appropriate

### ✅ Interface-Driven Design
- Clear contracts for all data structures
- Reusable type definitions
- Self-documenting code

### ✅ Error Handling
- Try/catch blocks for all async operations
- Specific error types where possible
- Graceful degradation

### ✅ Resource Management
- Proper connection cleanup
- Graceful shutdown handlers
- SIGINT/SIGTERM signal handling

### ✅ Best Practices
- Idempotent producers by default
- Manual offset commits for reliability
- Transaction support for exactly-once
- Compression enabled
- Proper configuration

---

## Running the Examples

### Prerequisites
```bash
# Install Node.js 18+
node --version

# Verify npm
npm --version
```

### Quick Start
```bash
# Navigate to any tutorial
cd 01_basic_setup

# Install dependencies
npm install

# Run producer
npm run producer

# Run consumer (different terminal)
npm run consumer
```

### Build TypeScript
```bash
# Compile to JavaScript
npm run build

# Output in dist/ directory
ls dist/
```

---

## Dependencies

### Core Dependencies
- **kafkajs@^2.2.4** - Kafka client for Node.js
- **axios@^1.6.2** - HTTP client (Tutorial 03)
- **@kafkajs/confluent-schema-registry@^3.3.0** - Schema Registry (Tutorial 05)
- **avro-js@^1.11.3** - Avro serialization (Tutorial 05)

### Dev Dependencies
- **typescript@^5.3.2** - TypeScript compiler
- **ts-node@^10.9.1** - TypeScript executor
- **@types/node@^20.10.0** - Node.js type definitions

---

## File Structure

```
5.8.2_Kafka/
├── README_TYPESCRIPT.md          # Main TypeScript documentation
├── TYPESCRIPT_SUMMARY.md         # This file
│
├── 01_basic_setup/
│   ├── producer.ts
│   ├── consumer.ts
│   ├── consumer_manual_offset.ts
│   ├── package.json
│   └── tsconfig.json
│
├── 02_consumer_groups/
│   ├── producer_with_keys.ts
│   ├── consumer_group.ts
│   ├── offset_strategies.ts
│   ├── package.json
│   └── tsconfig.json
│
├── 03_kafka_connect/
│   ├── connector_manager.ts
│   ├── package.json
│   └── tsconfig.json
│
├── 05_schema_registry/
│   ├── producer_avro.ts
│   ├── consumer_avro.ts
│   ├── package.json
│   └── tsconfig.json
│
└── 06_exactly_once/
    ├── transactional_producer.ts
    ├── transactional_consumer.ts
    ├── package.json
    └── tsconfig.json
```

---

## Next Steps

After reviewing these examples:

1. **Install Dependencies**: Run `npm install` in each tutorial directory
2. **Start Kafka**: Use Docker Compose from tutorial READMEs
3. **Run Examples**: Try producer and consumer in separate terminals
4. **Modify Code**: Experiment with different configurations
5. **Build Projects**: Use `npm run build` to compile TypeScript
6. **Review Types**: Hover over variables in VS Code to see types

---

**Note**: All TypeScript examples are production-ready and follow KafkaJS best practices!
