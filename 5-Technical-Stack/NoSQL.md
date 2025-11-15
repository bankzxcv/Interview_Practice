# NoSQL Databases Cheatsheet - Quick Reference

Comprehensive guide covering MongoDB, Redis, Cassandra, DynamoDB with indexing, sharding, and replication.

---

## Table of Contents

1. [MongoDB](#mongodb)
2. [Redis](#redis)
3. [Cassandra](#cassandra)
4. [DynamoDB](#dynamodb)
5. [NoSQL Patterns](#nosql-patterns)
6. [Sharding & Replication](#sharding--replication)
7. [CAP Theorem](#cap-theorem)

---

## MongoDB

```javascript
// Connect
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');

// Create/Select Database
use mydb

// CRUD Operations

// Insert
db.users.insertOne({ name: "John", age: 30, email: "john@example.com" })
db.users.insertMany([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 35 }
])

// Find
db.users.find()                                  // All documents
db.users.find({ age: { $gt: 25 } })              // Age > 25
db.users.find({ age: { $gte: 25, $lte: 35 } })   // 25 <= age <= 35
db.users.find({ name: /^J/ })                    // Regex: starts with J
db.users.find({ tags: { $in: ["mongodb", "nosql"] } })  // Array contains
db.users.findOne({ email: "john@example.com" })

// Projection (select specific fields)
db.users.find({}, { name: 1, email: 1, _id: 0 })  // Include only name, email

// Update
db.users.updateOne(
    { email: "john@example.com" },
    { $set: { age: 31 } }
)
db.users.updateMany(
    { age: { $lt: 18 } },
    { $set: { category: "minor" } }
)
db.users.updateOne(
    { email: "john@example.com" },
    { $inc: { age: 1 } }                         // Increment
)
db.users.updateOne(
    { email: "john@example.com" },
    { $push: { tags: "mongodb" } }               // Add to array
)

// Delete
db.users.deleteOne({ email: "john@example.com" })
db.users.deleteMany({ age: { $lt: 18 } })

// Indexes
db.users.createIndex({ email: 1 })               // Ascending
db.users.createIndex({ name: 1, age: -1 })       // Compound index
db.users.createIndex({ email: 1 }, { unique: true })  // Unique
db.users.createIndex(
    { location: "2dsphere" }                     // Geospatial
)
db.users.createIndex(
    { content: "text" }                          // Text search
)
db.users.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 3600 }                 // TTL index
)

// List indexes
db.users.getIndexes()

// Drop index
db.users.dropIndex("email_1")

// Aggregation Pipeline
db.orders.aggregate([
    { $match: { status: "completed" } },         // Filter
    { $group: {                                  // Group by
        _id: "$userId",
        totalSpent: { $sum: "$amount" },
        orderCount: { $sum: 1 }
    }},
    { $sort: { totalSpent: -1 } },               // Sort
    { $limit: 10 },                              // Limit
    { $lookup: {                                 // Join
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userDetails"
    }},
    { $unwind: "$userDetails" },                 // Flatten array
    { $project: {                                // Select fields
        name: "$userDetails.name",
        totalSpent: 1,
        orderCount: 1
    }}
])

// Common aggregation operators
$match      // Filter documents
$group      // Group by field
$sort       // Sort
$limit      // Limit results
$skip       // Skip results
$project    // Select/transform fields
$unwind     // Flatten array
$lookup     // Left outer join
$addFields  // Add new fields
$count      // Count documents
$facet      // Multiple pipelines

// Transactions (MongoDB 4.0+)
const session = client.startSession();
session.startTransaction();
try {
    db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session });
    db.accounts.updateOne({ _id: 2 }, { $inc: { balance: 100 } }, { session });
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
} finally {
    session.endSession();
}

// Schema Validation
db.createCollection("users", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "email"],
            properties: {
                name: {
                    bsonType: "string",
                    description: "must be a string"
                },
                email: {
                    bsonType: "string",
                    pattern: "^.+@.+$"
                },
                age: {
                    bsonType: "int",
                    minimum: 0,
                    maximum: 150
                }
            }
        }
    }
})
```

### MongoDB Sharding

```javascript
// Enable sharding on database
sh.enableSharding("mydb")

// Shard collection
sh.shardCollection("mydb.users", { userId: "hashed" })  // Hashed sharding
sh.shardCollection("mydb.orders", { region: 1 })        // Range sharding
sh.shardCollection("mydb.logs", { timestamp: 1, _id: 1 })  // Compound shard key

// Check shard status
sh.status()

// Shard key strategies:
// 1. Hashed - Even distribution, no range queries
// 2. Range - Range queries, possible hotspots
// 3. Compound - Balance between distribution and queries
```

### Visual: MongoDB Sharding

```
SHARDING ARCHITECTURE:

┌──────────────────────────────────────────────────┐
│              mongos (Router)                     │
└─────────┬────────────────────┬───────────────────┘
          │                    │
    ┌─────▼─────┐        ┌─────▼─────┐
    │  Shard 1  │        │  Shard 2  │
    │ userId:   │        │ userId:   │
    │  0-499    │        │ 500-999   │
    └───────────┘        └───────────┘

HASHED SHARDING:
userId → hash() → shard
Pros: Even distribution
Cons: No range queries

RANGE SHARDING:
userId: 0-499 → Shard 1
userId: 500-999 → Shard 2
Pros: Range queries supported
Cons: Possible hotspots
```

---

## Redis

```bash
# Install
brew install redis                  # macOS
sudo apt-get install redis-server   # Ubuntu

# Start
redis-server
redis-cli

# Strings
SET key value                       # Set value
GET key                             # Get value
SETEX key 3600 value                # Set with expiry (seconds)
SETNX key value                     # Set if not exists
INCR counter                        # Increment
DECR counter                        # Decrement
INCRBY counter 5                    # Increment by value
APPEND key " more"                  # Append to string
GETRANGE key 0 5                    # Substring
STRLEN key                          # String length

# Lists (ordered, duplicates allowed)
LPUSH mylist "first"                # Push left
RPUSH mylist "last"                 # Push right
LPOP mylist                         # Pop left
RPOP mylist                         # Pop right
LRANGE mylist 0 -1                  # Get all
LLEN mylist                         # Length
LINDEX mylist 0                     # Get by index
LTRIM mylist 0 99                   # Keep only first 100

# Sets (unordered, unique)
SADD myset "apple"                  # Add to set
SREM myset "apple"                  # Remove from set
SMEMBERS myset                      # Get all members
SISMEMBER myset "apple"             # Check membership
SCARD myset                         # Cardinality (size)
SINTER set1 set2                    # Intersection
SUNION set1 set2                    # Union
SDIFF set1 set2                     # Difference

# Sorted Sets (ordered by score)
ZADD leaderboard 100 "player1"      # Add with score
ZADD leaderboard 200 "player2"
ZRANGE leaderboard 0 -1             # Get all (by rank)
ZRANGE leaderboard 0 -1 WITHSCORES  # With scores
ZREVRANGE leaderboard 0 9           # Top 10 (descending)
ZRANK leaderboard "player1"         # Get rank
ZSCORE leaderboard "player1"        # Get score
ZINCRBY leaderboard 10 "player1"    # Increment score
ZREM leaderboard "player1"          # Remove
ZCOUNT leaderboard 100 200          # Count in range

# Hashes (field-value pairs)
HSET user:1 name "John"             # Set field
HGET user:1 name                    # Get field
HMSET user:1 name "John" age 30     # Set multiple
HMGET user:1 name age               # Get multiple
HGETALL user:1                      # Get all fields
HDEL user:1 name                    # Delete field
HEXISTS user:1 name                 # Field exists
HKEYS user:1                        # Get all keys
HVALS user:1                        # Get all values
HINCRBY user:1 age 1                # Increment field

# Expiration
EXPIRE key 3600                     # Expire in seconds
EXPIREAT key 1609459200             # Expire at timestamp
TTL key                             # Time to live
PERSIST key                         # Remove expiration

# Pub/Sub
SUBSCRIBE channel1                  # Subscribe to channel
PUBLISH channel1 "message"          # Publish message
PSUBSCRIBE news.*                   # Pattern subscribe

# Transactions
MULTI                               # Start transaction
SET key1 "value1"
SET key2 "value2"
EXEC                                # Execute all
DISCARD                             # Cancel transaction

# Lua Scripts (atomic operations)
EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 mykey myvalue

# Persistence
SAVE                                # Synchronous save
BGSAVE                              # Background save

# Cluster commands
CLUSTER INFO                        # Cluster information
CLUSTER NODES                       # List nodes
```

### Redis Patterns

```javascript
// Rate Limiting
const isAllowed = async (userId, limit = 100, window = 60) => {
    const key = `rate_limit:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) {
        await redis.expire(key, window);
    }
    return count <= limit;
};

// Distributed Lock
const acquireLock = async (lockName, timeout = 10) => {
    const lockKey = `lock:${lockName}`;
    const identifier = uuid();
    const acquired = await redis.set(lockKey, identifier, 'NX', 'EX', timeout);
    return acquired ? identifier : null;
};

const releaseLock = async (lockName, identifier) => {
    const lockKey = `lock:${lockName}`;
    const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
    `;
    return redis.eval(script, 1, lockKey, identifier);
};

// Caching with TTL
const getWithCache = async (key, fetchFunction, ttl = 3600) => {
    let value = await redis.get(key);
    if (value) {
        return JSON.parse(value);
    }
    value = await fetchFunction();
    await redis.setex(key, ttl, JSON.stringify(value));
    return value;
};

// Leaderboard
const addScore = (leaderboard, player, score) => {
    return redis.zadd(leaderboard, score, player);
};

const getTopPlayers = (leaderboard, count = 10) => {
    return redis.zrevrange(leaderboard, 0, count - 1, 'WITHSCORES');
};

const getPlayerRank = (leaderboard, player) => {
    return redis.zrevrank(leaderboard, player);
};
```

---

## Cassandra

```sql
-- Create Keyspace (database)
CREATE KEYSPACE myapp
WITH replication = {
    'class': 'SimpleStrategy',
    'replication_factor': 3
};

USE myapp;

-- Create Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email TEXT,
    name TEXT,
    created_at TIMESTAMP
);

-- Composite Primary Key
CREATE TABLE user_activity (
    user_id UUID,
    timestamp TIMESTAMP,
    activity TEXT,
    PRIMARY KEY (user_id, timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);

-- Insert
INSERT INTO users (user_id, email, name, created_at)
VALUES (uuid(), 'john@example.com', 'John', toTimestamp(now()));

-- Select
SELECT * FROM users;
SELECT * FROM users WHERE user_id = ?;
SELECT * FROM user_activity WHERE user_id = ? AND timestamp > ?;

-- Update
UPDATE users SET name = 'John Doe' WHERE user_id = ?;

-- Delete
DELETE FROM users WHERE user_id = ?;

-- Secondary Index
CREATE INDEX ON users (email);

-- Materialized View
CREATE MATERIALIZED VIEW users_by_email AS
    SELECT * FROM users
    WHERE email IS NOT NULL AND user_id IS NOT NULL
    PRIMARY KEY (email, user_id);

-- Time To Live (TTL)
INSERT INTO logs (id, message) VALUES (uuid(), 'log message') USING TTL 86400;
UPDATE logs USING TTL 3600 SET message = 'updated' WHERE id = ?;

-- Batch
BEGIN BATCH
    INSERT INTO users (user_id, email) VALUES (?, ?);
    INSERT INTO user_activity (user_id, timestamp, activity) VALUES (?, ?, ?);
APPLY BATCH;

-- Collections
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    emails SET<TEXT>,                -- Set
    phone_numbers LIST<TEXT>,        -- List
    metadata MAP<TEXT, TEXT>         -- Map
);

-- Counters
CREATE TABLE page_views (
    page_id UUID PRIMARY KEY,
    views COUNTER
);

UPDATE page_views SET views = views + 1 WHERE page_id = ?;
```

### Cassandra Data Modeling

```
DENORMALIZATION IS KEY:
- Design tables for queries, not normalization
- Duplicate data across tables
- No joins - embed related data

PARTITION KEY:
- Determines node placement
- Must be in WHERE clause
- Should distribute data evenly

CLUSTERING KEY:
- Determines order within partition
- Allows range queries
- Default: ascending order

Example:
PRIMARY KEY (user_id, timestamp)
             ↑         ↑
      Partition    Clustering
         Key          Key

WRITE PATH:
Client → Coordinator → Replicas
All writes go to commit log (WAL) + memtable
Memtable → SSTable (immutable, on disk)

READ PATH:
1. Check memtable
2. Check bloom filter → SSTable
3. Merge results
4. Return to client

REPLICATION:
RF = 3 (Replication Factor)
Data copied to 3 nodes

CONSISTENCY LEVELS:
ONE     - 1 replica responds
QUORUM  - Majority (RF/2 + 1)
ALL     - All replicas respond

Read + Write > RF = Strong consistency
```

---

## DynamoDB

```javascript
// Create Table
const params = {
    TableName: 'Users',
    KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },  // Partition key
        { AttributeName: 'timestamp', KeyType: 'RANGE' }  // Sort key (optional)
    ],
    AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'N' }
    ],
    BillingMode: 'PAY_PER_REQUEST'  // or PROVISIONED
};

await dynamodb.createTable(params).promise();

// Put Item
await docClient.put({
    TableName: 'Users',
    Item: {
        userId: '123',
        timestamp: Date.now(),
        name: 'John',
        email: 'john@example.com'
    }
}).promise();

// Get Item
const result = await docClient.get({
    TableName: 'Users',
    Key: { userId: '123', timestamp: 1234567890 }
}).promise();

// Query (efficient, uses partition key)
const result = await docClient.query({
    TableName: 'Users',
    KeyConditionExpression: 'userId = :userId AND timestamp > :ts',
    ExpressionAttributeValues: {
        ':userId': '123',
        ':ts': 1234567890
    }
}).promise();

// Scan (inefficient, scans entire table)
const result = await docClient.scan({
    TableName: 'Users',
    FilterExpression: 'age > :age',
    ExpressionAttributeValues: {
        ':age': 25
    }
}).promise();

// Update
await docClient.update({
    TableName: 'Users',
    Key: { userId: '123' },
    UpdateExpression: 'SET age = age + :inc',
    ExpressionAttributeValues: { ':inc': 1 }
}).promise();

// Delete
await docClient.delete({
    TableName: 'Users',
    Key: { userId: '123' }
}).promise();

// Batch Write (up to 25 items)
await docClient.batchWrite({
    RequestItems: {
        'Users': [
            { PutRequest: { Item: { userId: '1', name: 'Alice' } } },
            { PutRequest: { Item: { userId: '2', name: 'Bob' } } },
            { DeleteRequest: { Key: { userId: '3' } } }
        ]
    }
}).promise();

// Transactions
await docClient.transactWrite({
    TransactItems: [
        {
            Put: {
                TableName: 'Users',
                Item: { userId: '1', balance: 100 }
            }
        },
        {
            Update: {
                TableName: 'Users',
                Key: { userId: '2' },
                UpdateExpression: 'SET balance = balance - :val',
                ExpressionAttributeValues: { ':val': 100 }
            }
        }
    ]
}).promise();

// Global Secondary Index (GSI)
await dynamodb.updateTable({
    TableName: 'Users',
    AttributeDefinitions: [
        { AttributeName: 'email', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexUpdates: [{
        Create: {
            IndexName: 'EmailIndex',
            KeySchema: [
                { AttributeName: 'email', KeyType: 'HASH' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }
    }]
}).promise();

// Query GSI
await docClient.query({
    TableName: 'Users',
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': 'john@example.com' }
}).promise();
```

---

## NoSQL Patterns

### Data Modeling

```
SQL vs NoSQL:

SQL:
- Normalize data
- Use joins
- ACID transactions
- Schema on write

NoSQL:
- Denormalize data
- Embed related data
- Eventually consistent
- Schema on read

EMBEDDING vs REFERENCING:

Embedding (one-to-few):
{
  userId: 1,
  name: "John",
  addresses: [
    { street: "123 Main", city: "NYC" },
    { street: "456 Oak", city: "LA" }
  ]
}

Referencing (one-to-many, many-to-many):
// Users collection
{ userId: 1, name: "John" }

// Orders collection
{ orderId: 1, userId: 1, total: 100 }
{ orderId: 2, userId: 1, total: 200 }

WHEN TO EMBED:
- Small subdocuments
- Data doesn't change often
- Need atomic updates
- Always accessed together

WHEN TO REFERENCE:
- Large subdocuments
- Data changes frequently
- Need to access independently
- Many-to-many relationships
```

---

## Sharding & Replication

```
SHARDING (Horizontal Partitioning):

┌────────────────────────────────────┐
│          Application               │
└───────────┬────────────────────────┘
            │
┌───────────▼───────────────┐
│      Shard Router         │
└──┬────────┬─────────┬─────┘
   │        │         │
   ▼        ▼         ▼
┌────┐  ┌────┐   ┌────┐
│Sh 1│  │Sh 2│   │Sh 3│
│A-H │  │I-P │   │Q-Z │
└────┘  └────┘   └────┘

SHARD KEY STRATEGIES:

1. Hash-based:
   shard = hash(key) % num_shards
   ✓ Even distribution
   ✗ No range queries
   ✗ Difficult to add shards

2. Range-based:
   A-H → Shard 1, I-P → Shard 2, Q-Z → Shard 3
   ✓ Range queries
   ✗ Hotspots possible
   ✓ Easy to add shards

3. Geography-based:
   US-East → Shard 1, US-West → Shard 2, EU → Shard 3
   ✓ Latency optimization
   ✗ Uneven distribution


REPLICATION:

PRIMARY-REPLICA (Master-Slave):
┌─────────┐
│ Primary │ ←────── Writes
└────┬────┘
     │ replicate
     ├──────┐
     ▼      ▼
 ┌──────┐ ┌──────┐
 │Rep 1 │ │Rep 2 │ ←── Reads
 └──────┘ └──────┘

MULTI-PRIMARY (Multi-Master):
┌──────┐ ←──→ ┌──────┐
│Pri 1 │      │Pri 2 │
└──────┘      └──────┘
Both accept writes, synchronize

CONSISTENCY MODELS:

Strong Consistency:
- Read always returns latest write
- Higher latency
- Example: SQL databases with ACID

Eventual Consistency:
- Reads may return stale data
- Lower latency, higher availability
- Eventually all replicas converge
- Example: DynamoDB, Cassandra

Read-Your-Writes:
- User sees their own writes immediately
- May not see others' writes

Monotonic Reads:
- If user reads value v1, subsequent reads ≥ v1
```

---

## CAP Theorem

```
CAP THEOREM:
You can only guarantee 2 of 3:

┌─────────────────────────────────┐
│         Consistency             │ ← All nodes see same data
│                                 │   at same time
└───────────┬─────────────────────┘
            │
            │
┌───────────▼──────┐   ┌──────────▼─────────┐
│   Availability   │   │   Partition        │
│                  │   │   Tolerance        │
│ Every request    │   │ System works       │
│ gets response    │   │ despite network    │
│                  │   │ failures           │
└──────────────────┘   └────────────────────┘

COMBINATIONS:

CA (Consistency + Availability):
- Traditional RDBMS
- Single-node systems
- Not partition-tolerant
- Example: PostgreSQL (single instance)

CP (Consistency + Partition Tolerance):
- Wait for all nodes or fail
- Sacrifice availability during partition
- Example: MongoDB, HBase, Redis

AP (Availability + Partition Tolerance):
- Always available
- May return stale data
- Eventual consistency
- Example: Cassandra, DynamoDB, CouchDB

IN PRACTICE:
Most distributed systems choose AP or CP
Network partitions are inevitable → must be partition-tolerant
Choice: Consistency (CP) vs Availability (AP)

BASE (Alternative to ACID):
- Basically Available: Always returns response
- Soft state: State may change without input (eventual consistency)
- Eventually consistent: System becomes consistent over time
```

---

**Last updated:** 2025-11-15
