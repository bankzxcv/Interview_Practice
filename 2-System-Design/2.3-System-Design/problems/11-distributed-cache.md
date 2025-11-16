# Design Distributed Cache (Redis/Memcached)

## Problem Statement

Design a distributed in-memory cache system like Redis or Memcached that provides low-latency key-value storage, handles cache eviction, supports replication, and scales horizontally.

## Requirements

### Functional
- GET/SET/DELETE operations
- TTL (time-to-live) support
- Cache eviction policies (LRU, LFU)
- Data persistence (optional)
- Replication for high availability

### Non-Functional
- **Latency**: p99 < 5ms
- **Throughput**: 1M ops/sec per node
- **Availability**: 99.99%
- **Scale**: 100TB total cache, 1000 nodes
- **Consistency**: Eventual

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Clients                            │
│  (Application servers)                               │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│            Client Library (Smart Client)             │
│  - Consistent hashing                                │
│  - Connection pooling                                │
│  - Retry logic                                       │
└────────────┬────────────────────────────────────────┘
             │
        ┌────┴────┬────────┬────────┬────────┐
        │         │        │        │        │
   ┌────▼───┐ ┌──▼───┐ ┌──▼───┐ ┌──▼───┐ ┌──▼───┐
   │ Node 1 │ │Node 2│ │Node 3│ │Node 4│ │ ...  │
   │(Master)│ │      │ │      │ │      │ │      │
   └────┬───┘ └──────┘ └──────┘ └──────┘ └──────┘
        │
   ┌────▼───┐
   │Replica │
   │(Slave) │
   └────────┘
```

## Design Decisions

### Decision 1: Consistent Hashing for Distribution

**Why?**
- Distribute keys across nodes
- Minimize data movement when nodes added/removed
- Load balancing

**Implementation:**

```python
import hashlib

class ConsistentHash:
    def __init__(self, nodes, virtual_nodes=150):
        self.virtual_nodes = virtual_nodes
        self.ring = {}  # hash → node mapping
        self.sorted_keys = []

        for node in nodes:
            self.add_node(node)

    def add_node(self, node):
        # Add virtual nodes for better distribution
        for i in range(self.virtual_nodes):
            virtual_key = f"{node}:{i}"
            hash_val = self.hash(virtual_key)
            self.ring[hash_val] = node
            self.sorted_keys.append(hash_val)

        self.sorted_keys.sort()

    def remove_node(self, node):
        for i in range(self.virtual_nodes):
            virtual_key = f"{node}:{i}"
            hash_val = self.hash(virtual_key)
            del self.ring[hash_val]
            self.sorted_keys.remove(hash_val)

    def get_node(self, key):
        if not self.ring:
            return None

        hash_val = self.hash(key)

        # Find first node >= hash_val (clockwise)
        for ring_hash in self.sorted_keys:
            if ring_hash >= hash_val:
                return self.ring[ring_hash]

        # Wrap around to first node
        return self.ring[self.sorted_keys[0]]

    def hash(self, key):
        return int(hashlib.md5(key.encode()).hexdigest(), 16)
```

**Example:**

```python
nodes = ["server1", "server2", "server3"]
ch = ConsistentHash(nodes)

ch.get_node("user:123")  # → server2
ch.get_node("user:456")  # → server1
ch.get_node("user:789")  # → server3

# Add node
ch.add_node("server4")
# Only ~25% of keys move (to server4)
# vs 50% if using modulo hashing
```

**Pros:**
- ✅ Minimal key redistribution when scaling (only K/n keys move)
- ✅ Load balancing with virtual nodes
- ✅ Decentralized (no coordination needed)

**Cons:**
- ❌ Hotspots if keys not uniformly distributed
- ❌ Complexity in client library

### Decision 2: LRU Eviction Policy

**Problem:** Cache full, need to evict items

**LRU (Least Recently Used):**

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity

    def get(self, key):
        if key not in self.cache:
            return None

        # Move to end (most recently used)
        self.cache.move_to_end(key)
        return self.cache[key]

    def set(self, key, value):
        if key in self.cache:
            # Update existing key
            self.cache.move_to_end(key)
        else:
            # New key
            if len(self.cache) >= self.capacity:
                # Evict least recently used (first item)
                self.cache.popitem(last=False)

        self.cache[key] = value
```

**Time Complexity:**
- GET: O(1)
- SET: O(1)

**Pros:**
- ✅ Simple to implement
- ✅ Good hit rate for temporal locality
- ✅ O(1) operations

**Cons:**
- ❌ Not optimal for all access patterns
- ❌ Doesn't consider frequency

**Alternative: LFU (Least Frequently Used):**

```python
class LFUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = {}  # key → value
        self.freq = {}   # key → frequency
        self.min_freq = 0

    def get(self, key):
        if key not in self.cache:
            return None

        # Increment frequency
        self.freq[key] += 1
        return self.cache[key]

    def set(self, key, value):
        if key in self.cache:
            self.cache[key] = value
            self.freq[key] += 1
        else:
            if len(self.cache) >= self.capacity:
                # Evict least frequently used
                lfu_key = min(self.freq, key=self.freq.get)
                del self.cache[lfu_key]
                del self.freq[lfu_key]

            self.cache[key] = value
            self.freq[key] = 1
```

**Pros:**
- ✅ Better for skewed access patterns (80/20 rule)
- ✅ Popular items stay cached

**Cons:**
- ❌ More complex
- ❌ Old popular items hard to evict

### Decision 3: Replication (Master-Slave)

**Why?**
- High availability (master fails → promote slave)
- Read scalability (distribute reads)
- Data durability

**Architecture:**

```
Master (writes) → Replicate → Slave1, Slave2, Slave3 (reads)
```

**Replication Modes:**

**1. Synchronous (Strong Consistency):**

```python
def set(key, value):
    # Write to master
    master.write(key, value)

    # Wait for all replicas to acknowledge
    for slave in slaves:
        slave.write(key, value)
        slave.ack()  # Block until ACK

    return "OK"
```

**Pros:**
- ✅ Strong consistency (all replicas up-to-date)
- ✅ No data loss

**Cons:**
- ❌ Slow (wait for all replicas)
- ❌ Unavailable if slave down

**2. Asynchronous (Eventual Consistency):**

```python
def set(key, value):
    # Write to master
    master.write(key, value)

    # Async replicate (don't wait)
    for slave in slaves:
        async_replicate(slave, key, value)

    return "OK"  # Return immediately
```

**Pros:**
- ✅ Fast (don't wait for replicas)
- ✅ Available even if slaves down

**Cons:**
- ❌ Eventual consistency (slaves lag)
- ❌ Possible data loss if master fails before replication

**Production Choice:** Async replication for cache (eventual consistency acceptable)

## Cache Server Implementation

```python
import socket
import threading

class CacheServer:
    def __init__(self, port):
        self.port = port
        self.cache = LRUCache(capacity=1000000)  # 1M keys
        self.lock = threading.Lock()

    def start(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.bind(('0.0.0.0', self.port))
        server.listen(1000)

        while True:
            conn, addr = server.accept()
            threading.Thread(target=self.handle_client, args=(conn,)).start()

    def handle_client(self, conn):
        while True:
            data = conn.recv(1024)
            if not data:
                break

            # Parse command: "GET key" or "SET key value"
            parts = data.decode().strip().split()
            command = parts[0]

            if command == "GET":
                key = parts[1]
                value = self.get(key)
                conn.send((value or "NULL").encode())

            elif command == "SET":
                key = parts[1]
                value = parts[2]
                self.set(key, value)
                conn.send(b"OK")

            elif command == "DELETE":
                key = parts[1]
                self.delete(key)
                conn.send(b"OK")

        conn.close()

    def get(self, key):
        with self.lock:
            return self.cache.get(key)

    def set(self, key, value):
        with self.lock:
            self.cache.set(key, value)

    def delete(self, key):
        with self.lock:
            self.cache.cache.pop(key, None)
```

## Data Persistence (Optional)

**Problem:** Cache restarted → all data lost

**Solution 1: RDB (Redis Database) - Snapshots**

```python
import pickle
import time

def save_snapshot():
    """Save cache to disk periodically."""
    while True:
        time.sleep(3600)  # Every hour

        with open('dump.rdb', 'wb') as f:
            pickle.dump(cache.cache, f)

        logger.info("Snapshot saved")

def load_snapshot():
    """Load cache from disk on startup."""
    try:
        with open('dump.rdb', 'rb') as f:
            cache.cache = pickle.load(f)
        logger.info("Snapshot loaded")
    except FileNotFoundError:
        logger.info("No snapshot found, starting fresh")
```

**Pros:**
- ✅ Fast (bulk write)
- ✅ Small file size

**Cons:**
- ❌ Data loss window (last hour)
- ❌ Large snapshot blocks server

**Solution 2: AOF (Append-Only File) - Write-Ahead Log**

```python
def set_with_aof(key, value):
    # Write to cache
    cache.set(key, value)

    # Append to log
    with open('appendonly.aof', 'a') as f:
        f.write(f"SET {key} {value}\n")

def load_aof():
    """Replay log on startup."""
    with open('appendonly.aof', 'r') as f:
        for line in f:
            parts = line.strip().split()
            command = parts[0]

            if command == "SET":
                key, value = parts[1], parts[2]
                cache.set(key, value)
```

**Pros:**
- ✅ Minimal data loss (every write logged)
- ✅ Can replay log for recovery

**Cons:**
- ❌ Slower (write to disk on every SET)
- ❌ Large log file

**Production:** Hybrid (RDB + AOF) - periodic snapshots + recent changes in AOF

## Scaling Patterns

### 1. Sharding

```
1 cache server: 10 GB, 100K ops/sec
100 cache servers: 1 TB, 10M ops/sec

Shard by key using consistent hashing.
```

### 2. Read Replicas

```
Master (writes): 1 server
Slaves (reads): 10 servers

Read throughput: 10x
```

### 3. Multi-Layer Caching

```
Client → L1 (Local cache - app memory)
       → L2 (Redis cluster)
       → L3 (Database)

L1 hit: 1ms
L2 hit: 5ms
L3 hit (miss): 50ms
```

## Monitoring

```
Performance:
- GET latency: p50 < 1ms, p99 < 5ms
- SET latency: p50 < 2ms, p99 < 10ms
- Throughput: 1M ops/sec per node

Cache Effectiveness:
- Hit rate: > 90%
- Eviction rate: < 10% of operations
- Memory utilization: 70-90% (sweet spot)

Availability:
- Uptime: 99.99%
- Replication lag: < 100ms
```

## Interview Talking Points

"Distributed cache key challenges are partitioning (use consistent hashing to minimize data movement when scaling), eviction (LRU for temporal locality, LFU for skewed access), and availability (master-slave replication). For 1M ops/sec, use async replication (eventual consistency OK for cache). Monitor hit rate (>90%) and eviction rate (<10%). For persistence, hybrid RDB snapshots + AOF for durability."
