# NoSQL Databases Cheatsheet - Complete Reference Guide

> **Official Documentation:**
> - [MongoDB Docs](https://docs.mongodb.com/) | [Redis Docs](https://redis.io/docs/) | [Cassandra Docs](https://cassandra.apache.org/doc/) | [DynamoDB Docs](https://docs.aws.amazon.com/dynamodb/)

Comprehensive guide covering MongoDB, Redis, Cassandra, DynamoDB with indexing, sharding, replication, and real-world patterns.

---

## Table of Contents

1. [MongoDB](#mongodb)
2. [Redis](#redis)
3. [Cassandra](#cassandra)
4. [DynamoDB](#dynamodb)
5. [NoSQL Patterns](#nosql-patterns)
6. [Sharding & Replication](#sharding--replication)
7. [CAP Theorem](#cap-theorem)
8. [Project Setup Tutorials](#project-setup-tutorials)

---

## MongoDB

> **Reference:** [MongoDB Official Documentation](https://docs.mongodb.com/)
> **Drivers:** [Node.js](https://docs.mongodb.com/drivers/node/) | [Python](https://docs.mongodb.com/drivers/python/) | [Java](https://docs.mongodb.com/drivers/java/)

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

> **Reference:** [MongoDB Sharding Documentation](https://docs.mongodb.com/manual/sharding/)

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

> **Reference:** [Official Redis Documentation](https://redis.io/docs/)
> **Commands:** [Redis Commands Reference](https://redis.io/commands/)
> **Clients:** [Node.js](https://github.com/redis/node-redis) | [Python](https://github.com/redis/redis-py) | [Java](https://github.com/redis/jedis)

### Installation & Setup

```bash
# Install
brew install redis                  # macOS
sudo apt-get install redis-server   # Ubuntu
docker run -d -p 6379:6379 redis    # Docker

# Start
redis-server                        # Start server
redis-cli                           # Start CLI client

# Test connection
redis-cli ping
# Output: PONG
```

### Redis Data Types & Commands with Outputs

#### 1. Strings (Simple key-value pairs)

> **Reference:** [Redis Strings](https://redis.io/docs/data-types/strings/)

```bash
# Basic operations
127.0.0.1:6379> SET user:1:name "John Doe"
OK

127.0.0.1:6379> GET user:1:name
"John Doe"

127.0.0.1:6379> SET session:abc123 "user_data" EX 3600
OK

127.0.0.1:6379> SETEX cache:page1 3600 "cached_html"
OK

127.0.0.1:6379> SETNX lock:resource1 "locked"
(integer) 1
# 1 = success (key didn't exist), 0 = key already exists

# Numeric operations
127.0.0.1:6379> SET counter 0
OK

127.0.0.1:6379> INCR counter
(integer) 1

127.0.0.1:6379> INCRBY counter 5
(integer) 6

127.0.0.1:6379> DECR counter
(integer) 5

127.0.0.1:6379> DECRBY counter 3
(integer) 2

# String manipulation
127.0.0.1:6379> SET message "Hello"
OK

127.0.0.1:6379> APPEND message " World"
(integer) 11
# Returns new length

127.0.0.1:6379> GET message
"Hello World"

127.0.0.1:6379> GETRANGE message 0 4
"Hello"

127.0.0.1:6379> STRLEN message
(integer) 11

# Multiple operations
127.0.0.1:6379> MSET key1 "value1" key2 "value2" key3 "value3"
OK

127.0.0.1:6379> MGET key1 key2 key3
1) "value1"
2) "value2"
3) "value3"
```

#### 2. Lists (Ordered collections, allows duplicates)

> **Reference:** [Redis Lists](https://redis.io/docs/data-types/lists/)
> **Use case:** Activity feeds, queues, stacks, real-time logs

```bash
# Push operations
127.0.0.1:6379> LPUSH mylist "first"
(integer) 1

127.0.0.1:6379> RPUSH mylist "second" "third"
(integer) 3

127.0.0.1:6379> RPUSH mylist "fourth"
(integer) 4

# Get list content
127.0.0.1:6379> LRANGE mylist 0 -1
1) "first"
2) "second"
3) "third"
4) "fourth"

# Pop operations
127.0.0.1:6379> LPOP mylist
"first"

127.0.0.1:6379> RPOP mylist
"fourth"

127.0.0.1:6379> LRANGE mylist 0 -1
1) "second"
2) "third"

# Get by index
127.0.0.1:6379> LINDEX mylist 0
"second"

127.0.0.1:6379> LINDEX mylist 1
"third"

# List length
127.0.0.1:6379> LLEN mylist
(integer) 2

# Trim list (keep only specified range)
127.0.0.1:6379> RPUSH logs "log1" "log2" "log3" "log4" "log5"
(integer) 5

127.0.0.1:6379> LTRIM logs 0 2
OK

127.0.0.1:6379> LRANGE logs 0 -1
1) "log1"
2) "log2"
3) "log3"

# Blocking operations (for job queues)
127.0.0.1:6379> BLPOP queue 30
# Waits up to 30 seconds for an element
# Output when element available: 1) "queue"  2) "job_data"
# Output when timeout: (nil)

127.0.0.1:6379> BRPOP queue 30
# Same as BLPOP but from right side
```

#### 3. Sets (Unordered collections, unique elements)

> **Reference:** [Redis Sets](https://redis.io/docs/data-types/sets/)
> **Use case:** Tags, unique visitors, relationships, online users

```bash
# Add members
127.0.0.1:6379> SADD fruits "apple"
(integer) 1

127.0.0.1:6379> SADD fruits "banana" "orange" "apple"
(integer) 2
# "apple" already exists, only "banana" and "orange" added

# Get all members
127.0.0.1:6379> SMEMBERS fruits
1) "apple"
2) "banana"
3) "orange"

# Check membership
127.0.0.1:6379> SISMEMBER fruits "apple"
(integer) 1
# 1 = exists, 0 = doesn't exist

127.0.0.1:6379> SISMEMBER fruits "grape"
(integer) 0

# Set size
127.0.0.1:6379> SCARD fruits
(integer) 3

# Remove member
127.0.0.1:6379> SREM fruits "banana"
(integer) 1

# Set operations
127.0.0.1:6379> SADD set1 "a" "b" "c"
(integer) 3

127.0.0.1:6379> SADD set2 "b" "c" "d"
(integer) 3

127.0.0.1:6379> SINTER set1 set2
1) "b"
2) "c"

127.0.0.1:6379> SUNION set1 set2
1) "a"
2) "b"
3) "c"
4) "d"

127.0.0.1:6379> SDIFF set1 set2
1) "a"

# Random member
127.0.0.1:6379> SRANDMEMBER fruits 2
1) "apple"
2) "orange"

127.0.0.1:6379> SPOP fruits
"orange"
# Removes and returns random member

127.0.0.1:6379> SMEMBERS fruits
1) "apple"
```

#### 4. Sorted Sets (Ordered by score, unique members)

> **Reference:** [Redis Sorted Sets](https://redis.io/docs/data-types/sorted-sets/)
> **Use case:** Leaderboards, priority queues, time-series data, trending items

```bash
# Add members with scores
127.0.0.1:6379> ZADD leaderboard 100 "player1"
(integer) 1

127.0.0.1:6379> ZADD leaderboard 200 "player2" 150 "player3"
(integer) 2

# Get range by rank (ascending)
127.0.0.1:6379> ZRANGE leaderboard 0 -1
1) "player1"
2) "player3"
3) "player2"

127.0.0.1:6379> ZRANGE leaderboard 0 -1 WITHSCORES
1) "player1"
2) "100"
3) "player3"
4) "150"
5) "player2"
6) "200"

# Get range by rank (descending)
127.0.0.1:6379> ZREVRANGE leaderboard 0 2
1) "player2"
2) "player3"
3) "player1"

# Get rank
127.0.0.1:6379> ZRANK leaderboard "player1"
(integer) 0
# 0-indexed rank (ascending order)

127.0.0.1:6379> ZREVRANK leaderboard "player1"
(integer) 2
# 0-indexed rank (descending order)

# Get score
127.0.0.1:6379> ZSCORE leaderboard "player1"
"100"

# Increment score
127.0.0.1:6379> ZINCRBY leaderboard 50 "player1"
"150"

127.0.0.1:6379> ZSCORE leaderboard "player1"
"150"

# Count in score range
127.0.0.1:6379> ZCOUNT leaderboard 100 200
(integer) 3

# Get by score range
127.0.0.1:6379> ZRANGEBYSCORE leaderboard 100 200
1) "player3"
2) "player1"
3) "player2"

127.0.0.1:6379> ZRANGEBYSCORE leaderboard 150 200
1) "player1"
2) "player2"

# Remove member
127.0.0.1:6379> ZREM leaderboard "player3"
(integer) 1

# Remove by rank
127.0.0.1:6379> ZREMRANGEBYRANK leaderboard 0 0
(integer) 1
# Removes lowest ranked member

# Remove by score
127.0.0.1:6379> ZREMRANGEBYSCORE leaderboard 0 100
(integer) 0
# Removes members with score 0-100

# Cardinality
127.0.0.1:6379> ZCARD leaderboard
(integer) 2
```

#### 5. Hashes (Field-value pairs within a key)

> **Reference:** [Redis Hashes](https://redis.io/docs/data-types/hashes/)
> **Use case:** User profiles, object storage, session data, product catalogs

```bash
# Set single field
127.0.0.1:6379> HSET user:1000 name "Alice"
(integer) 1

127.0.0.1:6379> HSET user:1000 email "alice@example.com"
(integer) 1

# Get single field
127.0.0.1:6379> HGET user:1000 name
"Alice"

# Set multiple fields (modern syntax)
127.0.0.1:6379> HSET user:1000 age 30 city "New York" country "USA"
(integer) 3

# Get multiple fields
127.0.0.1:6379> HMGET user:1000 name email age
1) "Alice"
2) "alice@example.com"
3) "30"

# Get all fields and values
127.0.0.1:6379> HGETALL user:1000
 1) "name"
 2) "Alice"
 3) "email"
 4) "alice@example.com"
 5) "age"
 6) "30"
 7) "city"
 8) "New York"
 9) "country"
10) "USA"

# Get all keys
127.0.0.1:6379> HKEYS user:1000
1) "name"
2) "email"
3) "age"
4) "city"
5) "country"

# Get all values
127.0.0.1:6379> HVALS user:1000
1) "Alice"
2) "alice@example.com"
3) "30"
4) "New York"
5) "USA"

# Check if field exists
127.0.0.1:6379> HEXISTS user:1000 email
(integer) 1

127.0.0.1:6379> HEXISTS user:1000 phone
(integer) 0

# Delete field
127.0.0.1:6379> HDEL user:1000 city
(integer) 1

# Increment field value
127.0.0.1:6379> HINCRBY user:1000 age 1
(integer) 31

127.0.0.1:6379> HSET user:1000 balance 100.50
(integer) 1

127.0.0.1:6379> HINCRBYFLOAT user:1000 balance 10.25
"110.75"

# Get number of fields
127.0.0.1:6379> HLEN user:1000
(integer) 5
```

### Key Management & Expiration

> **Reference:** [Redis Key Expiration](https://redis.io/commands/expire/)

```bash
# Set expiration
127.0.0.1:6379> SET session:abc "data"
OK

127.0.0.1:6379> EXPIRE session:abc 3600
(integer) 1
# Returns 1 if timeout was set, 0 if key doesn't exist

127.0.0.1:6379> EXPIREAT session:abc 1893456000
(integer) 1
# Expire at Unix timestamp

# Check TTL (Time To Live)
127.0.0.1:6379> TTL session:abc
(integer) 3598
# Seconds remaining. Returns -1 if no expiry, -2 if key doesn't exist

# Remove expiration
127.0.0.1:6379> PERSIST session:abc
(integer) 1

127.0.0.1:6379> TTL session:abc
(integer) -1
# -1 means no expiration set

# Key exists
127.0.0.1:6379> EXISTS user:1000
(integer) 1

127.0.0.1:6379> EXISTS user:9999
(integer) 0

# Delete keys
127.0.0.1:6379> DEL user:1000 session:abc
(integer) 2
# Returns number of keys deleted

# Get key type
127.0.0.1:6379> TYPE user:1000
hash

127.0.0.1:6379> TYPE leaderboard
zset

127.0.0.1:6379> TYPE mylist
list

# Rename key
127.0.0.1:6379> RENAME oldkey newkey
OK

127.0.0.1:6379> RENAMENX oldkey newkey
(integer) 1
# Only rename if newkey doesn't exist

# Scan keys (production-safe alternative to KEYS)
127.0.0.1:6379> SCAN 0 MATCH user:* COUNT 100
1) "0"
2) 1) "user:1"
   2) "user:2"
   3) "user:3"
# Returns cursor and matching keys
```

### Pub/Sub (Publish/Subscribe)

> **Reference:** [Redis Pub/Sub Documentation](https://redis.io/docs/interact/pubsub/)
> **Use case:** Real-time notifications, chat systems, event broadcasting

```bash
# Terminal 1: Subscribe to channel
127.0.0.1:6379> SUBSCRIBE notifications
Reading messages... (press Ctrl-C to quit)
1) "subscribe"
2) "notifications"
3) (integer) 1

# Terminal 2: Publish message
127.0.0.1:6379> PUBLISH notifications "New order #1234 received"
(integer) 1
# Returns number of clients that received the message

# Terminal 1 receives:
1) "message"
2) "notifications"
3) "New order #1234 received"

# Pattern subscribe (wildcard)
127.0.0.1:6379> PSUBSCRIBE news:*
Reading messages...
1) "psubscribe"
2) "news:*"
3) (integer) 1

# Publish to pattern
127.0.0.1:6379> PUBLISH news:tech "AI breakthrough announced"
(integer) 1

# Subscriber receives:
1) "pmessage"
2) "news:*"
3) "news:tech"
4) "AI breakthrough announced"

# List active channels
127.0.0.1:6379> PUBSUB CHANNELS
1) "notifications"
2) "news:tech"

# Number of subscribers for channel
127.0.0.1:6379> PUBSUB NUMSUB notifications
1) "notifications"
2) (integer) 2

# Number of pattern subscriptions
127.0.0.1:6379> PUBSUB NUMPAT
(integer) 1
```

### Transactions

> **Reference:** [Redis Transactions](https://redis.io/docs/interact/transactions/)
> **Note:** Redis transactions are atomic but not isolated

```bash
# Basic transaction
127.0.0.1:6379> MULTI
OK

127.0.0.1:6379> SET account:1 100
QUEUED

127.0.0.1:6379> SET account:2 200
QUEUED

127.0.0.1:6379> EXEC
1) OK
2) OK

# Transaction with DISCARD
127.0.0.1:6379> MULTI
OK

127.0.0.1:6379> SET key1 "value1"
QUEUED

127.0.0.1:6379> SET key2 "value2"
QUEUED

127.0.0.1:6379> DISCARD
OK
# Transaction cancelled, no commands executed

# Watch for optimistic locking
127.0.0.1:6379> WATCH balance:1000
OK

127.0.0.1:6379> GET balance:1000
"1000"

127.0.0.1:6379> MULTI
OK

127.0.0.1:6379> DECRBY balance:1000 50
QUEUED

127.0.0.1:6379> EXEC
1) (integer) 950
# If another client modifies balance:1000 between WATCH and EXEC, returns (nil)
```

### Lua Scripts (Atomic operations)

> **Reference:** [Redis Lua Scripting](https://redis.io/docs/interact/programmability/eval-intro/)
> **Use case:** Complex atomic operations, rate limiting, conditional updates

```bash
# Simple Lua script
127.0.0.1:6379> EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 mykey myvalue
OK

# Increment multiple keys atomically
127.0.0.1:6379> EVAL "redis.call('INCR', KEYS[1]); redis.call('INCR', KEYS[2]); return redis.call('GET', KEYS[1])" 2 counter1 counter2
"1"

# Rate limiting script
127.0.0.1:6379> EVAL "local current = redis.call('INCR', KEYS[1]); if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return current" 1 rate:limit:user123 60
(integer) 1

127.0.0.1:6379> EVAL "local current = redis.call('INCR', KEYS[1]); if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return current" 1 rate:limit:user123 60
(integer) 2

# Get-and-set script
127.0.0.1:6379> EVAL "local old = redis.call('GET', KEYS[1]); redis.call('SET', KEYS[1], ARGV[1]); return old" 1 mykey newvalue
"myvalue"

# Conditional update
127.0.0.1:6379> EVAL "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('SET', KEYS[1], ARGV[2]) else return 0 end" 1 mykey oldvalue newvalue
OK
```

### Persistence

> **Reference:** [Redis Persistence](https://redis.io/docs/management/persistence/)
> **Types:** RDB (snapshots) and AOF (append-only file)

```bash
# Manual save (synchronous - blocks server)
127.0.0.1:6379> SAVE
OK

# Background save (asynchronous - non-blocking)
127.0.0.1:6379> BGSAVE
Background saving started

# Last save time
127.0.0.1:6379> LASTSAVE
(integer) 1700000000
# Unix timestamp of last successful save

# Configuration
127.0.0.1:6379> CONFIG GET save
1) "save"
2) "3600 1 300 100 60 10000"
# Save after: 3600s if 1 change, 300s if 100 changes, 60s if 10000 changes

# Get AOF rewrite status
127.0.0.1:6379> BGREWRITEAOF
Background append only file rewriting started
```

### Redis Cluster Commands

> **Reference:** [Redis Cluster Tutorial](https://redis.io/docs/management/scaling/)
> **Use case:** Horizontal scaling, high availability

```bash
# Cluster information
127.0.0.1:6379> CLUSTER INFO
cluster_state:ok
cluster_slots_assigned:16384
cluster_slots_ok:16384
cluster_slots_pfail:0
cluster_slots_fail:0
cluster_known_nodes:6
cluster_size:3

# List nodes
127.0.0.1:6379> CLUSTER NODES
07c37dfeb235213a872192d90877d0cd55635b91 127.0.0.1:30001@31001 master - 0 1426238316232 0 connected 0-5460
67ed2db8d677e59ec4a4cefb06858cf2a1a89fa1 127.0.0.1:30002@31002 master - 0 1426238318243 0 connected 5461-10922
292f8b365bb7edb5e285caf0b7e6ddc7265d2f4f 127.0.0.1:30003@31003 master - 0 1426238319252 0 connected 10923-16383

# Cluster slots distribution
127.0.0.1:6379> CLUSTER SLOTS
1) 1) (integer) 0
   2) (integer) 5460
   3) 1) "127.0.0.1"
      2) (integer) 30001
      3) "07c37dfeb235213a872192d90877d0cd55635b91"

# Cluster keyslot
127.0.0.1:6379> CLUSTER KEYSLOT mykey
(integer) 14687
```

### Redis Patterns

> **Reference:** [Redis Patterns & Best Practices](https://redis.io/docs/manual/patterns/)

```javascript
// Rate Limiting (Fixed Window)
const isAllowed = async (userId, limit = 100, window = 60) => {
    const key = `rate_limit:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) {
        await redis.expire(key, window);
    }
    return count <= limit;
};

// Distributed Lock (Redlock Algorithm)
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

// Leaderboard Management
const addScore = (leaderboard, player, score) => {
    return redis.zadd(leaderboard, score, player);
};

const getTopPlayers = (leaderboard, count = 10) => {
    return redis.zrevrange(leaderboard, 0, count - 1, 'WITHSCORES');
};

const getPlayerRank = (leaderboard, player) => {
    return redis.zrevrank(leaderboard, player);
};

// Session Store
const saveSession = async (sessionId, data, ttl = 3600) => {
    const key = `session:${sessionId}`;
    await redis.hmset(key, data);
    await redis.expire(key, ttl);
};

const getSession = async (sessionId) => {
    const key = `session:${sessionId}`;
    return redis.hgetall(key);
};

// Job Queue (using Lists)
const enqueue = async (queue, job) => {
    return redis.rpush(queue, JSON.stringify(job));
};

const dequeue = async (queue, timeout = 30) => {
    const result = await redis.blpop(queue, timeout);
    return result ? JSON.parse(result[1]) : null;
};
```

---

## Cassandra

> **Reference:** [Apache Cassandra Documentation](https://cassandra.apache.org/doc/)
> **Drivers:** [Node.js](https://docs.datastax.com/en/developer/nodejs-driver/) | [Python](https://docs.datastax.com/en/developer/python-driver/) | [Java](https://docs.datastax.com/en/developer/java-driver/)

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

> **Reference:** [Cassandra Data Modeling](https://cassandra.apache.org/doc/latest/cassandra/data_modeling/)

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

> **Reference:** [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
> **SDK:** [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)

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

> **Reference:** [NoSQL Data Modeling](https://www.mongodb.com/nosql-explained/data-modeling)

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

> **Reference:** [Database Sharding](https://www.mongodb.com/features/database-sharding-explained)

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

> **Reference:** [CAP Theorem Explained](https://www.ibm.com/topics/cap-theorem)

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

## Project Setup Tutorials

### 1. Redis + Node.js Setup (Express API with Caching)

> **End-to-End Tutorial:** Build a complete caching layer

```bash
# Initialize project
mkdir redis-api && cd redis-api
npm init -y
npm install express redis dotenv

# Project structure
redis-api/
├── src/
│   ├── config/
│   │   └── redis.js
│   ├── routes/
│   │   └── users.js
│   ├── middleware/
│   │   └── cache.js
│   └── app.js
├── .env
└── package.json
```

**File: src/config/redis.js**
```javascript
const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
    }
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Redis Connected'));

(async () => {
    await client.connect();
})();

module.exports = client;
```

**File: src/middleware/cache.js**
```javascript
const client = require('../config/redis');

const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        const key = `cache:${req.originalUrl}`;

        try {
            const cachedData = await client.get(key);
            if (cachedData) {
                return res.json({
                    source: 'cache',
                    data: JSON.parse(cachedData)
                });
            }

            // Store original send function
            const originalSend = res.json;
            res.json = function(data) {
                res.json = originalSend;
                client.setEx(key, duration, JSON.stringify(data));
                return res.json({ source: 'database', data });
            };

            next();
        } catch (error) {
            next();
        }
    };
};

module.exports = cacheMiddleware;
```

**File: src/routes/users.js**
```javascript
const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middleware/cache');

// Mock database
const users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
];

// Get all users (with 5-minute cache)
router.get('/', cacheMiddleware(300), (req, res) => {
    // Simulate database delay
    setTimeout(() => {
        res.json(users);
    }, 1000);
});

module.exports = router;
```

**File: src/app.js**
```javascript
const express = require('express');
require('dotenv').config();

const app = express();
const usersRouter = require('./routes/users');

app.use(express.json());
app.use('/api/users', usersRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

**File: .env**
```
PORT=3000
REDIS_URL=redis://localhost:6379
```

**Run the project:**
```bash
# Start Redis (if not running)
redis-server

# Start application
node src/app.js

# Test endpoints
curl http://localhost:3000/api/users
# First request: 1000ms (from "database")
# Second request: <10ms (from cache)
```

### 2. MongoDB + Express CRUD Application

> **Full-Stack Setup:** Complete REST API with MongoDB

```bash
mkdir mongodb-crud && cd mongodb-crud
npm init -y
npm install express mongoose dotenv cors

# Project structure
mongodb-crud/
├── src/
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── users.js
│   ├── config/
│   │   └── database.js
│   └── app.js
├── .env
└── package.json
```

**File: src/config/database.js**
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
```

**File: src/models/User.js**
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    age: {
        type: Number,
        min: [0, 'Age must be positive']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
```

**File: src/routes/users.js**
```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Create user
router.post('/', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
router.patch('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

**File: .env**
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/crud_app
```

### 3. Serverless Redis Function (AWS Lambda)

> **Serverless Setup:** Deploy Redis-backed Lambda function

```bash
mkdir serverless-redis && cd serverless-redis
npm init -y
npm install serverless redis aws-sdk
npx serverless create --template aws-nodejs
```

**File: serverless.yml**
```yaml
service: redis-lambda

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    REDIS_HOST: ${env:REDIS_HOST}
    REDIS_PORT: ${env:REDIS_PORT}
  vpc:
    securityGroupIds:
      - sg-xxxxx
    subnetIds:
      - subnet-xxxxx

functions:
  getUser:
    handler: handler.getUser
    events:
      - http:
          path: users/{id}
          method: get

  setUser:
    handler: handler.setUser
    events:
      - http:
          path: users
          method: post

plugins:
  - serverless-offline
```

**File: handler.js**
```javascript
const redis = require('redis');

let client;

const getRedisClient = async () => {
    if (!client) {
        client = redis.createClient({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        });
        await client.connect();
    }
    return client;
};

module.exports.getUser = async (event) => {
    const client = await getRedisClient();
    const userId = event.pathParameters.id;

    try {
        const userData = await client.get(`user:${userId}`);

        if (!userData) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'User not found' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(JSON.parse(userData))
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

module.exports.setUser = async (event) => {
    const client = await getRedisClient();
    const userData = JSON.parse(event.body);

    try {
        await client.set(
            `user:${userData.id}`,
            JSON.stringify(userData),
            'EX',
            3600
        );

        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'User created successfully' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

### 4. Docker Compose Multi-Database Stack

> **Infrastructure Setup:** Complete development environment

**File: docker-compose.yml**
```yaml
version: '3.8'

services:
  # MongoDB
  mongodb:
    image: mongo:latest
    container_name: dev-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    networks:
      - app-network

  # Redis
  redis:
    image: redis:alpine
    container_name: dev-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - app-network

  # Redis Commander (GUI)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: redis-gui
    ports:
      - "8081:8081"
    environment:
      REDIS_HOSTS: local:redis:6379
    networks:
      - app-network
    depends_on:
      - redis

  # Mongo Express (GUI)
  mongo-express:
    image: mongo-express:latest
    container_name: mongo-gui
    ports:
      - "8082:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: password
      ME_CONFIG_MONGODB_URL: mongodb://admin:password@mongodb:27017/
    networks:
      - app-network
    depends_on:
      - mongodb

  # Cassandra
  cassandra:
    image: cassandra:latest
    container_name: dev-cassandra
    ports:
      - "9042:9042"
    environment:
      CASSANDRA_CLUSTER_NAME: DevCluster
      CASSANDRA_DC: dc1
      CASSANDRA_RACK: rack1
    volumes:
      - cassandra_data:/var/lib/cassandra
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongodb_data:
  redis_data:
  cassandra_data:
```

**Usage:**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access GUIs
# Redis Commander: http://localhost:8081
# Mongo Express: http://localhost:8082

# Stop all services
docker-compose down

# Remove volumes (data)
docker-compose down -v
```

---

## Quick Reference Summary

| Database   | Type          | Use Case                          | Consistency | Scalability |
|------------|---------------|-----------------------------------|-------------|-------------|
| MongoDB    | Document      | Flexible schema, complex queries  | CP          | Horizontal  |
| Redis      | Key-Value     | Caching, sessions, real-time      | CP          | Horizontal  |
| Cassandra  | Wide-Column   | Time-series, high write throughput| AP          | Horizontal  |
| DynamoDB   | Key-Value     | Serverless, auto-scaling          | AP          | Horizontal  |

**Performance Comparison:**
- **Read Speed:** Redis > MongoDB > DynamoDB > Cassandra
- **Write Speed:** Cassandra > Redis > DynamoDB > MongoDB
- **Query Flexibility:** MongoDB > DynamoDB > Cassandra > Redis
- **Operational Complexity:** DynamoDB (managed) < Redis < MongoDB < Cassandra

---

**Last updated:** 2025-11-15
