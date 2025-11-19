# Tutorial 07: Redis Sentinel and Cluster

Deploy high-availability Redis with Sentinel for automatic failover, Redis Cluster for horizontal scaling, failover testing, and client-side configuration for production-ready messaging systems.

## Table of Contents
- [Introduction](#introduction)
- [Redis Sentinel](#redis-sentinel)
- [Sentinel Setup](#sentinel-setup)
- [Sentinel Failover](#sentinel-failover)
- [Redis Cluster](#redis-cluster)
- [Cluster Setup](#cluster-setup)
- [Client Configuration](#client-configuration)
- [Testing and Validation](#testing-and-validation)
- [Monitoring](#monitoring)
- [Best Practices](#best-practices)

## Introduction

For production messaging systems, you need high availability and horizontal scalability. Redis provides two solutions: Sentinel for automatic failover and Cluster for data partitioning.

### Sentinel vs Cluster

| Feature | Sentinel | Cluster |
|---------|----------|---------|
| Purpose | High availability | Horizontal scaling + HA |
| Data distribution | Single master (all data) | Sharded across nodes |
| Automatic failover | Yes | Yes |
| Read scaling | Replicas | Replicas per shard |
| Write scaling | No | Yes (sharding) |
| Complexity | Lower | Higher |
| Min nodes | 3 (1 master, 2 sentinels) | 6 (3 masters, 3 replicas) |

### When to Use What

**Use Sentinel:**
- Single Redis instance capacity sufficient
- Simple HA requirement
- Read scaling via replicas
- Easier operations

**Use Cluster:**
- Dataset exceeds single node capacity
- Need write scaling
- Horizontal scaling required
- Can handle operational complexity

## Redis Sentinel

### Architecture

```
         Sentinel 1           Sentinel 2           Sentinel 3
              │                    │                    │
              └────────────┬───────┴────────┬───────────┘
                          │                │
                    ┌─────▼─────┐    ┌─────▼─────┐
                    │   Master  │───▶│  Replica  │
                    └───────────┘    └───────────┘
```

### How Sentinel Works

1. **Monitoring:** Sentinels monitor master and replicas
2. **Notification:** Alert on state changes
3. **Automatic Failover:** Promote replica to master on failure
4. **Configuration Provider:** Clients discover current master

**Quorum:** Minimum sentinels agreeing on failure (typically majority)

## Sentinel Setup

### Docker Compose Configuration

Create `docker-compose-sentinel.yml`:

```yaml
version: '3.8'

services:
  # Redis Master
  redis-master:
    image: redis:7.2-alpine
    container_name: redis-master
    ports:
      - "6379:6379"
    command: >
      redis-server
      --appendonly yes
      --appendfsync everysec
      --requirepass redis_password
      --masterauth redis_password
    volumes:
      - redis-master-data:/data
    networks:
      - redis-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "redis_password", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # Redis Replica 1
  redis-replica-1:
    image: redis:7.2-alpine
    container_name: redis-replica-1
    ports:
      - "6380:6379"
    command: >
      redis-server
      --appendonly yes
      --appendfsync everysec
      --requirepass redis_password
      --masterauth redis_password
      --replicaof redis-master 6379
    volumes:
      - redis-replica-1-data:/data
    depends_on:
      - redis-master
    networks:
      - redis-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "redis_password", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # Redis Replica 2
  redis-replica-2:
    image: redis:7.2-alpine
    container_name: redis-replica-2
    ports:
      - "6381:6379"
    command: >
      redis-server
      --appendonly yes
      --appendfsync everysec
      --requirepass redis_password
      --masterauth redis_password
      --replicaof redis-master 6379
    volumes:
      - redis-replica-2-data:/data
    depends_on:
      - redis-master
    networks:
      - redis-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "redis_password", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # Sentinel 1
  sentinel-1:
    image: redis:7.2-alpine
    container_name: sentinel-1
    ports:
      - "26379:26379"
    command: redis-sentinel /etc/redis/sentinel.conf
    volumes:
      - ./sentinel-1.conf:/etc/redis/sentinel.conf
      - sentinel-1-data:/data
    depends_on:
      - redis-master
      - redis-replica-1
      - redis-replica-2
    networks:
      - redis-network

  # Sentinel 2
  sentinel-2:
    image: redis:7.2-alpine
    container_name: sentinel-2
    ports:
      - "26380:26379"
    command: redis-sentinel /etc/redis/sentinel.conf
    volumes:
      - ./sentinel-2.conf:/etc/redis/sentinel.conf
      - sentinel-2-data:/data
    depends_on:
      - redis-master
      - redis-replica-1
      - redis-replica-2
    networks:
      - redis-network

  # Sentinel 3
  sentinel-3:
    image: redis:7.2-alpine
    container_name: sentinel-3
    ports:
      - "26381:26379"
    command: redis-sentinel /etc/redis/sentinel.conf
    volumes:
      - ./sentinel-3.conf:/etc/redis/sentinel.conf
      - sentinel-3-data:/data
    depends_on:
      - redis-master
      - redis-replica-1
      - redis-replica-2
    networks:
      - redis-network

volumes:
  redis-master-data:
  redis-replica-1-data:
  redis-replica-2-data:
  sentinel-1-data:
  sentinel-2-data:
  sentinel-3-data:

networks:
  redis-network:
    driver: bridge
```

### Sentinel Configuration

Create `sentinel-1.conf`, `sentinel-2.conf`, `sentinel-3.conf`:

```conf
# Sentinel Configuration

# Port
port 26379

# Working directory
dir /data

# Monitor master
# sentinel monitor <master-name> <ip> <port> <quorum>
sentinel monitor mymaster redis-master 6379 2

# Authentication
sentinel auth-pass mymaster redis_password

# Timeouts
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 10000

# Notification scripts (optional)
# sentinel notification-script mymaster /path/to/notify.sh
# sentinel client-reconfig-script mymaster /path/to/reconfig.sh

# Logging
loglevel notice
logfile /data/sentinel.log
```

### Start Sentinel Cluster

```bash
# Start all services
docker-compose -f docker-compose-sentinel.yml up -d

# Check status
docker-compose -f docker-compose-sentinel.yml ps

# View sentinel logs
docker logs sentinel-1 -f
```

### Verify Sentinel Setup

```bash
# Connect to sentinel
docker exec -it sentinel-1 redis-cli -p 26379

# Check master info
SENTINEL master mymaster

# Check replicas
SENTINEL replicas mymaster

# Check sentinels
SENTINEL sentinels mymaster

# Monitor failover events
SENTINEL ckquorum mymaster
```

## Sentinel Failover

### Manual Failover Testing

**Test failover:**
```bash
# Stop master
docker-compose -f docker-compose-sentinel.yml stop redis-master

# Watch sentinel logs
docker logs sentinel-1 -f
# You'll see:
# +sdown master mymaster 172.18.0.2 6379
# +odown master mymaster 172.18.0.2 6379
# +failover-triggered master mymaster 172.18.0.2 6379
# +promoted-slave replica 172.18.0.3:6379 172.18.0.3 6379
```

**Verify new master:**
```bash
# Check sentinel for new master
docker exec -it sentinel-1 redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster

# Connect to new master
docker exec -it redis-replica-1 redis-cli -a redis_password INFO replication
```

### Python Client with Sentinel

Create `sentinel_client.py`:

```python
#!/usr/bin/env python3
import redis
from redis.sentinel import Sentinel
import time

def create_sentinel_connection():
    """Create Redis connection via Sentinel."""
    # Sentinel addresses
    sentinel_list = [
        ('localhost', 26379),
        ('localhost', 26380),
        ('localhost', 26381)
    ]

    # Create Sentinel instance
    sentinel = Sentinel(
        sentinel_list,
        socket_timeout=5,
        password='redis_password'
    )

    # Discover master
    master = sentinel.master_for(
        'mymaster',
        socket_timeout=5,
        password='redis_password',
        decode_responses=True
    )

    # Discover slave for reads
    slave = sentinel.slave_for(
        'mymaster',
        socket_timeout=5,
        password='redis_password',
        decode_responses=True
    )

    return master, slave, sentinel

def test_failover_resilience():
    """Test automatic failover handling."""
    master, slave, sentinel = create_sentinel_connection()

    print("Testing Sentinel failover resilience\n")

    # Write data
    print("1. Writing to master...")
    for i in range(100):
        try:
            master.xadd('test:stream', {'id': i, 'data': f'message-{i}'})
            print(f"   Written: {i}", end='\r')
            time.sleep(0.1)
        except redis.ConnectionError as e:
            print(f"\n   Connection lost at message {i}: {e}")
            print("   Waiting for failover...")
            time.sleep(5)

            # Reconnect (Sentinel will discover new master)
            master, slave, sentinel = create_sentinel_connection()
            print("   Reconnected to new master, continuing...")

    print("\n2. Verifying data...")
    length = master.xlen('test:stream')
    print(f"   Stream length: {length}")

    # Cleanup
    master.delete('test:stream')

def monitor_sentinel_status():
    """Monitor Sentinel status continuously."""
    master, slave, sentinel = create_sentinel_connection()

    while True:
        try:
            # Get master info
            master_info = sentinel.sentinel_master('mymaster')

            print("\n" + "="*60)
            print(f"Sentinel Status - {time.strftime('%H:%M:%S')}")
            print("="*60)
            print(f"Master: {master_info['ip']}:{master_info['port']}")
            print(f"Status: {master_info['flags']}")
            print(f"Replicas: {master_info['num-slaves']}")
            print(f"Sentinels: {master_info['num-other-sentinels']}")

            time.sleep(5)
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(1)

def main():
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == 'monitor':
        monitor_sentinel_status()
    else:
        test_failover_resilience()

if __name__ == "__main__":
    main()
```

**Run:**
```bash
# Test failover
python sentinel_client.py

# Monitor status
python sentinel_client.py monitor
```

## Redis Cluster

### Architecture

```
Slot 0-5460        Slot 5461-10922      Slot 10923-16383
┌──────────┐       ┌──────────┐         ┌──────────┐
│ Master 1 │       │ Master 2 │         │ Master 3 │
└────┬─────┘       └────┬─────┘         └────┬─────┘
     │                  │                     │
┌────▼─────┐       ┌────▼─────┐         ┌────▼─────┐
│Replica 1 │       │Replica 2 │         │Replica 3 │
└──────────┘       └──────────┘         └──────────┘
```

**Key Concepts:**
- **Hash Slots:** 16384 slots distributed across masters
- **Sharding:** Keys distributed by hash slot
- **Replication:** Each master has replicas
- **Automatic Failover:** Like Sentinel, but built-in

## Cluster Setup

### Docker Compose for Cluster

Create `docker-compose-cluster.yml`:

```yaml
version: '3.8'

services:
  # Master 1
  redis-master-1:
    image: redis:7.2-alpine
    container_name: redis-master-1
    ports:
      - "7001:6379"
      - "17001:16379"
    command: >
      redis-server
      --port 6379
      --cluster-enabled yes
      --cluster-config-file nodes.conf
      --cluster-node-timeout 5000
      --appendonly yes
      --appendfsync everysec
      --requirepass cluster_password
      --masterauth cluster_password
    volumes:
      - redis-master-1-data:/data
    networks:
      redis-cluster:
        ipv4_address: 172.20.0.11

  # Master 2
  redis-master-2:
    image: redis:7.2-alpine
    container_name: redis-master-2
    ports:
      - "7002:6379"
      - "17002:16379"
    command: >
      redis-server
      --port 6379
      --cluster-enabled yes
      --cluster-config-file nodes.conf
      --cluster-node-timeout 5000
      --appendonly yes
      --appendfsync everysec
      --requirepass cluster_password
      --masterauth cluster_password
    volumes:
      - redis-master-2-data:/data
    networks:
      redis-cluster:
        ipv4_address: 172.20.0.12

  # Master 3
  redis-master-3:
    image: redis:7.2-alpine
    container_name: redis-master-3
    ports:
      - "7003:6379"
      - "17003:16379"
    command: >
      redis-server
      --port 6379
      --cluster-enabled yes
      --cluster-config-file nodes.conf
      --cluster-node-timeout 5000
      --appendonly yes
      --appendfsync everysec
      --requirepass cluster_password
      --masterauth cluster_password
    volumes:
      - redis-master-3-data:/data
    networks:
      redis-cluster:
        ipv4_address: 172.20.0.13

  # Replica 1
  redis-replica-1:
    image: redis:7.2-alpine
    container_name: redis-replica-1
    ports:
      - "7004:6379"
      - "17004:16379"
    command: >
      redis-server
      --port 6379
      --cluster-enabled yes
      --cluster-config-file nodes.conf
      --cluster-node-timeout 5000
      --appendonly yes
      --appendfsync everysec
      --requirepass cluster_password
      --masterauth cluster_password
    volumes:
      - redis-replica-1-data:/data
    networks:
      redis-cluster:
        ipv4_address: 172.20.0.14

  # Replica 2
  redis-replica-2:
    image: redis:7.2-alpine
    container_name: redis-replica-2
    ports:
      - "7005:6379"
      - "17005:16379"
    command: >
      redis-server
      --port 6379
      --cluster-enabled yes
      --cluster-config-file nodes.conf
      --cluster-node-timeout 5000
      --appendonly yes
      --appendfsync everysec
      --requirepass cluster_password
      --masterauth cluster_password
    volumes:
      - redis-replica-2-data:/data
    networks:
      redis-cluster:
        ipv4_address: 172.20.0.15

  # Replica 3
  redis-replica-3:
    image: redis:7.2-alpine
    container_name: redis-replica-3
    ports:
      - "7006:6379"
      - "17006:16379"
    command: >
      redis-server
      --port 6379
      --cluster-enabled yes
      --cluster-config-file nodes.conf
      --cluster-node-timeout 5000
      --appendonly yes
      --appendfsync everysec
      --requirepass cluster_password
      --masterauth cluster_password
    volumes:
      - redis-replica-3-data:/data
    networks:
      redis-cluster:
        ipv4_address: 172.20.0.16

  # Cluster initialization
  cluster-init:
    image: redis:7.2-alpine
    container_name: cluster-init
    command: >
      sh -c "
        sleep 10 &&
        redis-cli -a cluster_password --cluster create
        172.20.0.11:6379
        172.20.0.12:6379
        172.20.0.13:6379
        172.20.0.14:6379
        172.20.0.15:6379
        172.20.0.16:6379
        --cluster-replicas 1
        --cluster-yes
      "
    depends_on:
      - redis-master-1
      - redis-master-2
      - redis-master-3
      - redis-replica-1
      - redis-replica-2
      - redis-replica-3
    networks:
      - redis-cluster

volumes:
  redis-master-1-data:
  redis-master-2-data:
  redis-master-3-data:
  redis-replica-1-data:
  redis-replica-2-data:
  redis-replica-3-data:

networks:
  redis-cluster:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Initialize Cluster

```bash
# Start cluster
docker-compose -f docker-compose-cluster.yml up -d

# Check cluster status
docker exec -it redis-master-1 redis-cli -a cluster_password cluster info

# Check nodes
docker exec -it redis-master-1 redis-cli -a cluster_password cluster nodes
```

### Python Client with Cluster

Create `cluster_client.py`:

```python
#!/usr/bin/env python3
from redis.cluster import RedisCluster

def create_cluster_connection():
    """Create Redis Cluster connection."""
    startup_nodes = [
        {"host": "localhost", "port": 7001},
        {"host": "localhost", "port": 7002},
        {"host": "localhost", "port": 7003},
    ]

    rc = RedisCluster(
        startup_nodes=startup_nodes,
        password='cluster_password',
        decode_responses=True,
        skip_full_coverage_check=True
    )

    return rc

def test_cluster_operations():
    """Test cluster operations."""
    rc = create_cluster_connection()

    print("Testing Redis Cluster\n")

    # Write data (automatically sharded)
    print("1. Writing data to cluster...")
    for i in range(100):
        rc.set(f"key:{i}", f"value-{i}")
        print(f"   Written: {i}", end='\r')

    print(f"\n2. Keys written: {rc.dbsize()}")

    # Read data
    print("\n3. Reading sample data...")
    for i in range(0, 100, 10):
        value = rc.get(f"key:{i}")
        print(f"   key:{i} = {value}")

    # Streams work too (but note sharding)
    print("\n4. Testing streams...")
    stream_name = "{user:123}:events"  # Hash tag for same slot
    for i in range(10):
        rc.xadd(stream_name, {'event': f'event-{i}'})

    length = rc.xlen(stream_name)
    print(f"   Stream length: {length}")

    # Cleanup
    for i in range(100):
        rc.delete(f"key:{i}")
    rc.delete(stream_name)

    print("\n✓ Cluster test complete")

def show_cluster_info():
    """Display cluster information."""
    rc = create_cluster_connection()

    print("Redis Cluster Information\n")
    print("="*60)

    # Cluster info
    info = rc.cluster_info()
    for key, value in info.items():
        print(f"{key}: {value}")

    print("\n" + "="*60)
    print("Cluster Nodes:\n")

    # Node info
    nodes = rc.cluster_nodes()
    for node_id, node_info in nodes.items():
        print(f"Node: {node_info['host']}:{node_info['port']}")
        print(f"  Role: {node_info['flags']}")
        print(f"  Slots: {node_info.get('slots', 'N/A')}")
        print()

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == 'info':
        show_cluster_info()
    else:
        test_cluster_operations()
```

## Client Configuration

### Connection Pooling

```python
from redis.sentinel import Sentinel
from redis import ConnectionPool

# Sentinel with pool
sentinel = Sentinel([
    ('localhost', 26379),
    ('localhost', 26380),
    ('localhost', 26381)
])

# Get master with pool
master = sentinel.master_for(
    'mymaster',
    socket_timeout=0.1,
    socket_connect_timeout=0.1,
    socket_keepalive=True,
    connection_pool_kwargs={
        'max_connections': 50
    }
)
```

### Retry Logic

```python
from redis.retry import Retry
from redis.backoff import ExponentialBackoff

retry = Retry(ExponentialBackoff(), retries=3)

rc = RedisCluster(
    startup_nodes=nodes,
    retry=retry,
    retry_on_timeout=True,
    retry_on_error=[ConnectionError, TimeoutError]
)
```

## Testing and Validation

### Failover Test Script

Create `test_failover.sh`:

```bash
#!/bin/bash

echo "Starting failover test..."

# Start writing data in background
python -c "
import redis
from redis.sentinel import Sentinel
import time

sentinel = Sentinel([('localhost', 26379)], socket_timeout=0.1)
master = sentinel.master_for('mymaster', password='redis_password')

for i in range(1000):
    try:
        master.set(f'test:{i}', f'value-{i}')
        print(f'Written: {i}', end='\r')
        time.sleep(0.1)
    except Exception as e:
        print(f'\nError at {i}: {e}')
        time.sleep(2)
        master = sentinel.master_for('mymaster', password='redis_password')
" &

WRITER_PID=$!

# Wait a bit
sleep 5

# Trigger failover
echo "\nTriggering failover by stopping master..."
docker-compose -f docker-compose-sentinel.yml stop redis-master

# Wait for writer to finish
wait $WRITER_PID

echo "\nFailover test complete"
```

## Monitoring

### Monitoring Script

Create `monitor_cluster.py`:

```python
#!/usr/bin/env python3
from redis.cluster import RedisCluster
import time

def monitor_cluster():
    """Monitor Redis Cluster health."""
    rc = RedisCluster(
        startup_nodes=[{"host": "localhost", "port": 7001}],
        password='cluster_password',
        decode_responses=True,
        skip_full_coverage_check=True
    )

    while True:
        print("\n" + "="*60)
        print(f"Cluster Status - {time.strftime('%H:%M:%S')}")
        print("="*60)

        # Cluster state
        info = rc.cluster_info()
        print(f"State: {info['cluster_state']}")
        print(f"Slots assigned: {info['cluster_slots_assigned']}")
        print(f"Slots ok: {info['cluster_slots_ok']}")
        print(f"Known nodes: {info['cluster_known_nodes']}")
        print(f"Size: {info['cluster_size']}")

        # Check each node
        print("\nNode Health:")
        nodes = rc.cluster_nodes()
        for node_id, node_info in list(nodes.items())[:3]:  # First 3 nodes
            print(f"  {node_info['host']}:{node_info['port']} - {node_info['flags']}")

        time.sleep(5)

if __name__ == "__main__":
    monitor_cluster()
```

## Best Practices

### 1. Quorum Configuration

```conf
# Sentinel quorum (majority)
# For 3 sentinels: quorum = 2
sentinel monitor mymaster redis-master 6379 2

# For 5 sentinels: quorum = 3
sentinel monitor mymaster redis-master 6379 3
```

### 2. Hash Tags for Cluster

```python
# Keep related keys on same slot using hash tags
stream_name = "{user:123}:events"  # Hash tag: user:123
metadata = "{user:123}:metadata"   # Same slot as stream
```

### 3. Connection Retry

```python
def get_redis_connection(max_retries=3):
    """Get connection with retry."""
    for attempt in range(max_retries):
        try:
            master, _, _ = create_sentinel_connection()
            master.ping()
            return master
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)
```

### 4. Monitor Replication Lag

```python
def check_replication_lag(slave):
    """Check replication lag."""
    info = slave.info('replication')
    lag = info.get('master_last_io_seconds_ago', 0)

    if lag > 10:
        print(f"WARNING: Replication lag is {lag} seconds")
```

## Summary

In this tutorial, you learned:

1. Redis Sentinel for automatic failover
2. Sentinel configuration and setup
3. Manual and automatic failover testing
4. Redis Cluster for horizontal scaling
5. Cluster configuration (3 masters, 3 replicas)
6. Python clients for Sentinel and Cluster
7. Connection pooling and retry logic
8. Testing and validation procedures
9. Monitoring cluster health
10. Production best practices

**Key Takeaways:**
- Sentinel provides HA for single Redis instance
- Cluster provides HA + horizontal scaling
- Minimum 3 sentinels/nodes for quorum
- Client libraries handle failover automatically
- Use hash tags to keep related keys together in cluster
- Monitor replication lag and cluster health

**Next Steps:**
- [Tutorial 08: Kubernetes Deployment](../08_kubernetes_deployment/README.md) for container orchestration
