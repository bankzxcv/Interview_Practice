# Tutorial 07: NATS Clustering and Supercluster

## Overview

NATS supports clustering for high availability and horizontal scaling. A NATS cluster consists of multiple servers that work together to provide fault tolerance and load balancing. Superclusters (using gateways) connect multiple clusters across regions or data centers, enabling global messaging networks.

## Learning Objectives

- Set up a 3-node NATS cluster
- Understand cluster routing and full mesh topology
- Configure JetStream in clustered mode
- Test failover and recovery scenarios
- Set up gateway connections for superclusters
- Monitor cluster health and performance
- Design multi-region architectures

## Prerequisites

- Completed Tutorial 04 (JetStream)
- Docker and Docker Compose
- Python 3.8+ with nats-py
- Understanding of distributed systems
- 8GB RAM recommended

## Architecture

### NATS Cluster (Full Mesh)

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  NATS-1  │◄───────►│  NATS-2  │◄───────►│  NATS-3  │
│   4222   │         │   4223   │         │   4224   │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     └────────────────────┴────────────────────┘
                    (Full Mesh)

Clients can connect to any node
Messages are routed across all nodes
Automatic failover if a node fails
```

### Supercluster (Gateways)

```
  Region 1 (US-East)          Region 2 (EU-West)
┌─────────────────┐         ┌─────────────────┐
│ NATS-1  NATS-2  │         │ NATS-4  NATS-5  │
│    └──┬──┘      │◄───────►│    └──┬──┘      │
│    Cluster A    │ Gateway │    Cluster B    │
└─────────────────┘         └─────────────────┘

Messages flow seamlessly across regions
Subjects are global across superclusters
```

## Step 1: Basic 3-Node Cluster

Create `docker-compose-cluster.yml`:

```yaml
version: '3.8'

services:
  nats-1:
    image: nats:2.10-alpine
    container_name: nats-1
    ports:
      - "4222:4222"   # Client
      - "8222:8222"   # Monitoring
    command:
      - "--name=nats-1"
      - "--cluster_name=my-cluster"
      - "--cluster=nats://0.0.0.0:6222"
      - "--routes=nats://nats-2:6222,nats://nats-3:6222"
      - "--http_port=8222"
      - "-V"
    networks:
      - nats-cluster

  nats-2:
    image: nats:2.10-alpine
    container_name: nats-2
    ports:
      - "4223:4222"
      - "8223:8222"
    command:
      - "--name=nats-2"
      - "--cluster_name=my-cluster"
      - "--cluster=nats://0.0.0.0:6222"
      - "--routes=nats://nats-1:6222,nats://nats-3:6222"
      - "--http_port=8222"
      - "-V"
    networks:
      - nats-cluster

  nats-3:
    image: nats:2.10-alpine
    container_name: nats-3
    ports:
      - "4224:4222"
      - "8224:8222"
    command:
      - "--name=nats-3"
      - "--cluster_name=my-cluster"
      - "--cluster=nats://0.0.0.0:6222"
      - "--routes=nats://nats-1:6222,nats://nats-2:6222"
      - "--http_port=8222"
      - "-V"
    networks:
      - nats-cluster

networks:
  nats-cluster:
    driver: bridge
```

Start the cluster:

```bash
docker-compose -f docker-compose-cluster.yml up -d

# Verify all nodes are running
docker ps | grep nats

# Check cluster routes
curl -s http://localhost:8222/routez | jq
curl -s http://localhost:8223/routez | jq
curl -s http://localhost:8224/routez | jq
```

## Step 2: Test Cluster Connectivity

Create `test_cluster.py`:

```python
import asyncio
import nats

async def main():
    # Connect to multiple servers (automatic failover)
    nc = await nats.connect(
        servers=[
            "nats://localhost:4222",
            "nats://localhost:4223",
            "nats://localhost:4224"
        ],
        name="cluster-client"
    )

    print(f"Connected to: {nc.connected_url}")
    print(f"Server ID: {nc.client_id}")

    # Subscribe
    async def handler(msg):
        print(f"Received: {msg.data.decode()} on {msg.subject}")

    await nc.subscribe("test.>", cb=handler)

    # Publish messages
    for i in range(10):
        await nc.publish("test.message", f"Message {i}".encode())
        print(f"Published: Message {i}")
        await asyncio.sleep(0.5)

    await asyncio.sleep(2)
    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 3: JetStream Clustered Setup

Create `docker-compose-cluster-js.yml`:

```yaml
version: '3.8'

services:
  nats-1:
    image: nats:2.10-alpine
    container_name: nats-js-1
    ports:
      - "4222:4222"
      - "8222:8222"
    command:
      - "--name=nats-1"
      - "--cluster_name=js-cluster"
      - "--cluster=nats://0.0.0.0:6222"
      - "--routes=nats://nats-2:6222,nats://nats-3:6222"
      - "--http_port=8222"
      - "--jetstream"
      - "--store_dir=/data"
      - "-V"
    volumes:
      - nats-1-data:/data
    networks:
      - nats-cluster

  nats-2:
    image: nats:2.10-alpine
    container_name: nats-js-2
    ports:
      - "4223:4222"
      - "8223:8222"
    command:
      - "--name=nats-2"
      - "--cluster_name=js-cluster"
      - "--cluster=nats://0.0.0.0:6222"
      - "--routes=nats://nats-1:6222,nats://nats-3:6222"
      - "--http_port=8222"
      - "--jetstream"
      - "--store_dir=/data"
      - "-V"
    volumes:
      - nats-2-data:/data
    networks:
      - nats-cluster

  nats-3:
    image: nats:2.10-alpine
    container_name: nats-js-3
    ports:
      - "4224:4222"
      - "8224:8222"
    command:
      - "--name=nats-3"
      - "--cluster_name=js-cluster"
      - "--cluster=nats://0.0.0.0:6222"
      - "--routes=nats://nats-1:6222,nats://nats-2:6222"
      - "--http_port=8222"
      - "--jetstream"
      - "--store_dir=/data"
      - "-V"
    volumes:
      - nats-3-data:/data
    networks:
      - nats-cluster

volumes:
  nats-1-data:
  nats-2-data:
  nats-3-data:

networks:
  nats-cluster:
    driver: bridge
```

Start JetStream cluster:

```bash
docker-compose -f docker-compose-cluster-js.yml up -d

# Wait for cluster to form
sleep 5

# Check JetStream cluster status
curl -s http://localhost:8222/jsz | jq
```

## Step 4: Replicated Streams

Create `replicated_stream.py`:

```python
import asyncio
import nats
from nats.js.api import StreamConfig, StorageType

async def main():
    nc = await nats.connect(
        servers=["nats://localhost:4222", "nats://localhost:4223", "nats://localhost:4224"]
    )

    js = nc.jetstream()

    print("Creating replicated stream...\n")

    # Create stream with 3 replicas
    stream_config = StreamConfig(
        name="REPLICATED_EVENTS",
        subjects=["events.*"],
        storage=StorageType.FILE,
        num_replicas=3,  # Replicate across 3 nodes
        max_msgs=10000
    )

    try:
        await js.add_stream(stream_config)
        print("✓ Created replicated stream with 3 replicas")
    except Exception as e:
        print(f"Stream exists or error: {e}")

    # Get stream info
    info = await js.stream_info("REPLICATED_EVENTS")
    print(f"\nStream: {info.config.name}")
    print(f"Replicas: {info.config.num_replicas}")
    print(f"Cluster:")
    if info.cluster:
        print(f"  Leader: {info.cluster.leader}")
        print(f"  Replicas:")
        for replica in info.cluster.replicas:
            print(f"    - {replica.name} (current: {replica.current}, active: {replica.active})")

    # Publish messages
    print("\nPublishing messages to replicated stream...")
    for i in range(10):
        ack = await js.publish("events.test", f"Message {i}".encode())
        print(f"Published message {i} to stream seq {ack.seq}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 5: Failover Testing

Create `test_failover.py`:

```python
import asyncio
import nats
import signal
import sys

async def main():
    # Connect to all nodes
    nc = await nats.connect(
        servers=[
            "nats://localhost:4222",
            "nats://localhost:4223",
            "nats://localhost:4224"
        ],
        max_reconnect_attempts=-1,  # Reconnect forever
        reconnect_time_wait=2,
        name="failover-test"
    )

    print(f"Connected to: {nc.connected_url}\n")

    # Connection event handlers
    async def disconnected_cb():
        print("⚠️  Disconnected from NATS")

    async def reconnected_cb():
        print(f"✓ Reconnected to: {nc.connected_url}")

    async def error_cb(e):
        print(f"Error: {e}")

    # Update handlers
    nc._disconnected_cb = disconnected_cb
    nc._reconnected_cb = reconnected_cb
    nc._error_cb = error_cb

    # Subscribe to messages
    message_count = 0

    async def handler(msg):
        nonlocal message_count
        message_count += 1
        print(f"[{message_count}] Received: {msg.data.decode()}")

    await nc.subscribe("test.failover", cb=handler)

    # Publish messages continuously
    count = 0
    try:
        while True:
            try:
                await nc.publish("test.failover", f"Message {count}".encode())
                count += 1
                await asyncio.sleep(2)
            except Exception as e:
                print(f"Publish error: {e}")
                await asyncio.sleep(1)

    except KeyboardInterrupt:
        print(f"\n\nTotal messages sent: {count}")
        print(f"Total messages received: {message_count}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Test failover:

```bash
# Terminal 1 - Run failover test
python test_failover.py

# Terminal 2 - Simulate node failure
docker stop nats-js-1

# Watch Terminal 1 - should reconnect to another node

# Restart node
docker start nats-js-1
```

## Step 6: Gateway Connections (Supercluster)

Create `docker-compose-supercluster.yml`:

```yaml
version: '3.8'

services:
  # Cluster A (Region 1)
  nats-a1:
    image: nats:2.10-alpine
    container_name: nats-a1
    ports:
      - "4222:4222"
      - "8222:8222"
    command:
      - "--name=nats-a1"
      - "--cluster_name=cluster-a"
      - "--cluster=nats://0.0.0.0:6222"
      - "--routes=nats://nats-a2:6222"
      - "--gateway=nats-a"
      - "--gateway=cluster-a; urls=nats://nats-a1:7222,nats://nats-a2:7222"
      - "--gateway=cluster-b; urls=nats://nats-b1:7222,nats://nats-b2:7222"
      - "--http_port=8222"
      - "-V"
    networks:
      - supercluster

  nats-a2:
    image: nats:2.10-alpine
    container_name: nats-a2
    ports:
      - "4223:4222"
      - "8223:8222"
    command:
      - "--name=nats-a2"
      - "--cluster_name=cluster-a"
      - "--cluster=nats://0.0.0.0:6222"
      - "--routes=nats://nats-a1:6222"
      - "--gateway=nats-a"
      - "--gateway=cluster-a; urls=nats://nats-a1:7222,nats://nats-a2:7222"
      - "--gateway=cluster-b; urls=nats://nats-b1:7222,nats://nats-b2:7222"
      - "--http_port=8222"
      - "-V"
    networks:
      - supercluster

  # Cluster B (Region 2)
  nats-b1:
    image: nats:2.10-alpine
    container_name: nats-b1
    ports:
      - "4224:4222"
      - "8224:8222"
    command:
      - "--name=nats-b1"
      - "--cluster_name=cluster-b"
      - "--cluster=nats://0.0.0.0:6222"
      - "--routes=nats://nats-b2:6222"
      - "--gateway=nats-b"
      - "--gateway=cluster-a; urls=nats://nats-a1:7222,nats://nats-a2:7222"
      - "--gateway=cluster-b; urls=nats://nats-b1:7222,nats://nats-b2:7222"
      - "--http_port=8222"
      - "-V"
    networks:
      - supercluster

  nats-b2:
    image: nats:2.10-alpine
    container_name: nats-b2
    ports:
      - "4225:4222"
      - "8225:8222"
    command:
      - "--name=nats-b2"
      - "--cluster_name=cluster-b"
      - "--cluster=nats://0.0.0.0:6222"
      - "--routes=nats://nats-b1:6222"
      - "--gateway=nats-b"
      - "--gateway=cluster-a; urls=nats://nats-a1:7222,nats://nats-a2:7222"
      - "--gateway=cluster-b; urls=nats://nats-b1:7222,nats://nats-b2:7222"
      - "--http_port=8222"
      - "-V"
    networks:
      - supercluster

networks:
  supercluster:
    driver: bridge
```

Start supercluster:

```bash
docker-compose -f docker-compose-supercluster.yml up -d

# Check gateway connections
curl -s http://localhost:8222/gatewayz | jq
```

## Step 7: Cluster Monitoring

Create `cluster_monitor.py`:

```python
import asyncio
import aiohttp
import json

async def monitor_cluster():
    """Monitor NATS cluster status"""

    nodes = [
        {"name": "nats-1", "port": 8222},
        {"name": "nats-2", "port": 8223},
        {"name": "nats-3", "port": 8224}
    ]

    async with aiohttp.ClientSession() as session:
        for node in nodes:
            url = f"http://localhost:{node['port']}/varz"

            try:
                async with session.get(url) as resp:
                    if resp.status == 200:
                        data = await resp.json()

                        print(f"\n{'='*50}")
                        print(f"Node: {node['name']}")
                        print(f"{'='*50}")
                        print(f"Server ID: {data.get('server_id')}")
                        print(f"Version: {data.get('version')}")
                        print(f"Uptime: {data.get('uptime')}")
                        print(f"Connections: {data.get('connections')}")
                        print(f"In Msgs: {data.get('in_msgs'):,}")
                        print(f"Out Msgs: {data.get('out_msgs'):,}")
                        print(f"In Bytes: {data.get('in_bytes'):,}")
                        print(f"Out Bytes: {data.get('out_bytes'):,}")

                        # Cluster info
                        if 'cluster' in data:
                            print(f"\nCluster: {data['cluster'].get('name')}")
                            print(f"Routes: {len(data['cluster'].get('routes', []))}")

            except Exception as e:
                print(f"\n{node['name']}: Error - {e}")

        # Check routes
        print(f"\n{'='*50}")
        print("Cluster Routes")
        print(f"{'='*50}")

        url = "http://localhost:8222/routez"
        try:
            async with session.get(url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    routes = data.get('routes', [])

                    print(f"Total routes: {len(routes)}\n")

                    for route in routes:
                        print(f"Route ID: {route.get('rid')}")
                        print(f"  Remote ID: {route.get('remote_id')}")
                        print(f"  IP: {route.get('ip')}")
                        print(f"  Port: {route.get('port')}")
                        print(f"  Pending: {route.get('pending_size')}")
                        print()

        except Exception as e:
            print(f"Error getting routes: {e}")

if __name__ == '__main__':
    asyncio.run(monitor_cluster())
```

## Cluster Configuration Best Practices

### 1. Cluster Sizing

```
Small: 3 nodes (minimum for HA)
Medium: 5 nodes (better fault tolerance)
Large: 7+ nodes (high throughput)

Odd numbers prevent split-brain scenarios
```

### 2. Network Configuration

```bash
# Client port: 4222
# Cluster port: 6222
# Monitoring: 8222
# Gateway port: 7222

Ensure all ports are accessible between nodes
```

### 3. JetStream Replication

```python
# For 3-node cluster: replicas=3
# For 5-node cluster: replicas=3 or 5
# For 7-node cluster: replicas=3, 5, or 7

num_replicas = (cluster_size // 2) + 1  # Quorum
```

## Cluster Troubleshooting

### Split Brain Prevention

```bash
# Check cluster connectivity
curl http://localhost:8222/routez | jq '.num_routes'

# Should equal (cluster_size - 1)
# 3-node cluster: 2 routes per node
```

### Route Verification

```bash
# All nodes should see same cluster
for port in 8222 8223 8224; do
    echo "Node on port $port:"
    curl -s http://localhost:$port/routez | jq '.routes[].remote_id'
done
```

### Performance Tuning

```yaml
command:
  - "--write_deadline=10s"    # Write timeout
  - "--max_payload=8MB"       # Max message size
  - "--max_connections=10000" # Connection limit
```

## Use Cases

### 1. High Availability
```
3-node cluster with replicated JetStream
Automatic failover on node failure
Zero-downtime deployments
```

### 2. Multi-Region Deployment
```
Cluster per region connected via gateways
Local latency, global reach
Disaster recovery across regions
```

### 3. Horizontal Scaling
```
Add nodes to handle more throughput
Load balancing across cluster
Scale JetStream storage
```

## Summary

You've learned:
- ✅ 3-node NATS cluster setup
- ✅ Full mesh routing topology
- ✅ JetStream clustering with replication
- ✅ Failover testing and recovery
- ✅ Gateway connections for superclusters
- ✅ Cluster monitoring and health checks
- ✅ Best practices for production clusters

## Next Steps

- **Tutorial 08**: Deploy NATS on Kubernetes with StatefulSets

---

**Estimated Time**: 3-4 hours
**Difficulty**: Advanced
