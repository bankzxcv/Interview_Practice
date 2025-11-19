# Tutorial 05: RabbitMQ Clustering and High Availability

## Objectives

By the end of this tutorial, you will:
- Set up a 3-node RabbitMQ cluster using Docker Compose
- Configure HAProxy for load balancing
- Understand classic queue mirroring vs. quorum queues
- Implement quorum queues (recommended approach)
- Test node failure scenarios and recovery
- Handle network partition situations
- Build cluster-aware client applications
- Implement automatic reconnection strategies

## Prerequisites

- Docker and Docker Compose installed
- Python 3.8+ installed
- Completed Tutorial 01 (Basic Setup)
- Understanding of RabbitMQ queues and exchanges
- 8GB RAM minimum for running 3-node cluster
- Basic networking knowledge

## What is RabbitMQ Clustering?

RabbitMQ clustering allows multiple RabbitMQ nodes to form a single logical broker. Clustering provides:
- **High Availability**: Service continues if nodes fail
- **Load Distribution**: Spread connections across nodes
- **Horizontal Scaling**: Add capacity by adding nodes
- **Data Replication**: Replicate queues across nodes

### Cluster Architecture

```
                     ┌─────────────┐
                     │   HAProxy   │  (Load Balancer)
                     │  :5672/:15672│
                     └──────┬──────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐       ┌────▼─────┐       ┌────▼─────┐
   │ rabbit1  │◄─────►│ rabbit2  │◄─────►│ rabbit3  │
   │  :5672   │       │  :5673   │       │  :5674   │
   │  :15672  │       │  :15673  │       │  :15674  │
   └──────────┘       └──────────┘       └──────────┘
   Disc Node          RAM Node          Disc Node
```

### Queue Types Comparison

| Feature | Classic Queue | Mirrored Queue | Quorum Queue |
|---------|---------------|----------------|--------------|
| Replication | No | Yes (legacy) | Yes (Raft) |
| Performance | Fast | Moderate | Good |
| Data Safety | Low | Medium | High |
| Recommended | No | Deprecated | YES |

## Step-by-Step Instructions

### Step 1: Create Network and Erlang Cookie

Create `.erlang.cookie` file:
```bash
echo "RABBITMQ_CLUSTER_COOKIE_SECRET" > .erlang.cookie
chmod 400 .erlang.cookie
```

### Step 2: Create Docker Compose File

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # RabbitMQ Node 1 (Disc Node)
  rabbit1:
    image: rabbitmq:3.12-management
    container_name: rabbit1
    hostname: rabbit1
    environment:
      RABBITMQ_ERLANG_COOKIE: 'RABBITMQ_CLUSTER_COOKIE_SECRET'
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
      RABBITMQ_DEFAULT_VHOST: /
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbit1_data:/var/lib/rabbitmq
      - ./rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
    networks:
      - rabbitmq_cluster
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # RabbitMQ Node 2 (RAM Node)
  rabbit2:
    image: rabbitmq:3.12-management
    container_name: rabbit2
    hostname: rabbit2
    environment:
      RABBITMQ_ERLANG_COOKIE: 'RABBITMQ_CLUSTER_COOKIE_SECRET'
    ports:
      - "5673:5672"
      - "15673:15672"
    volumes:
      - rabbit2_data:/var/lib/rabbitmq
      - ./rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
    networks:
      - rabbitmq_cluster
    depends_on:
      rabbit1:
        condition: service_healthy

  # RabbitMQ Node 3 (Disc Node)
  rabbit3:
    image: rabbitmq:3.12-management
    container_name: rabbit3
    hostname: rabbit3
    environment:
      RABBITMQ_ERLANG_COOKIE: 'RABBITMQ_CLUSTER_COOKIE_SECRET'
    ports:
      - "5674:5672"
      - "15674:15672"
    volumes:
      - rabbit3_data:/var/lib/rabbitmq
      - ./rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
    networks:
      - rabbitmq_cluster
    depends_on:
      rabbit1:
        condition: service_healthy

  # HAProxy Load Balancer
  haproxy:
    image: haproxy:2.8-alpine
    container_name: haproxy
    ports:
      - "5671:5672"   # AMQP load balanced
      - "15671:15672" # Management UI load balanced
      - "8404:8404"   # HAProxy stats
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
    networks:
      - rabbitmq_cluster
    depends_on:
      - rabbit1
      - rabbit2
      - rabbit3

volumes:
  rabbit1_data:
  rabbit2_data:
  rabbit3_data:

networks:
  rabbitmq_cluster:
    driver: bridge
```

### Step 3: Create RabbitMQ Configuration

Create `rabbitmq.conf`:

```ini
# Clustering
cluster_formation.peer_discovery_backend = rabbit_peer_discovery_classic_config
cluster_formation.classic_config.nodes.1 = rabbit@rabbit1
cluster_formation.classic_config.nodes.2 = rabbit@rabbit2
cluster_formation.classic_config.nodes.3 = rabbit@rabbit3

# Network partition handling
cluster_partition_handling = autoheal

# Memory and disk thresholds
vm_memory_high_watermark.relative = 0.6
disk_free_limit.absolute = 2GB

# Queue defaults
queue_master_locator = min-masters

# Logging
log.console.level = info
log.file.level = info

# Heartbeat
heartbeat = 60

# TCP listeners
listeners.tcp.default = 5672
management.tcp.port = 15672
```

### Step 4: Create HAProxy Configuration

Create `haproxy.cfg`:

```cfg
global
    log stdout format raw local0 info
    maxconn 4096
    daemon

defaults
    log     global
    mode    tcp
    option  tcplog
    option  dontlognull
    retries 3
    timeout connect 5s
    timeout client  30s
    timeout server  30s

# HAProxy Stats Page
listen stats
    bind *:8404
    mode http
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if TRUE

# RabbitMQ AMQP Load Balancer
listen rabbitmq_amqp
    bind *:5672
    mode tcp
    balance roundrobin
    option tcplog
    option clitcpka
    timeout client 3h
    timeout server 3h
    server rabbit1 rabbit1:5672 check inter 5s rise 2 fall 3
    server rabbit2 rabbit2:5672 check inter 5s rise 2 fall 3
    server rabbit3 rabbit3:5672 check inter 5s rise 2 fall 3

# RabbitMQ Management UI Load Balancer
listen rabbitmq_management
    bind *:15672
    mode http
    balance roundrobin
    option httplog
    option httpchk GET /api/health/checks/alarms
    http-check expect status 200
    server rabbit1 rabbit1:15672 check inter 5s rise 2 fall 3
    server rabbit2 rabbit2:15672 check inter 5s rise 2 fall 3
    server rabbit3 rabbit3:15672 check inter 5s rise 2 fall 3
```

### Step 5: Start the Cluster

```bash
# Create necessary files
echo "RABBITMQ_CLUSTER_COOKIE_SECRET" > .erlang.cookie
chmod 400 .erlang.cookie

# Start all services
docker-compose up -d

# Wait for services to be healthy
sleep 30

# Check cluster status
docker exec rabbit1 rabbitmqctl cluster_status
```

### Step 6: Form the Cluster

```bash
# Join rabbit2 to cluster (as RAM node)
docker exec rabbit2 rabbitmqctl stop_app
docker exec rabbit2 rabbitmqctl reset
docker exec rabbit2 rabbitmqctl join_cluster --ram rabbit@rabbit1
docker exec rabbit2 rabbitmqctl start_app

# Join rabbit3 to cluster (as disc node)
docker exec rabbit3 rabbitmqctl stop_app
docker exec rabbit3 rabbitmqctl reset
docker exec rabbit3 rabbitmqctl join_cluster rabbit@rabbit1
docker exec rabbit3 rabbitmqctl start_app

# Verify cluster
docker exec rabbit1 rabbitmqctl cluster_status
```

Expected output:
```
Cluster status of node rabbit@rabbit1 ...
Basics
Cluster name: rabbit@rabbit1
Disk Nodes: rabbit@rabbit1, rabbit@rabbit3
RAM nodes: rabbit@rabbit2
Running Nodes: rabbit@rabbit1, rabbit@rabbit2, rabbit@rabbit3
```

### Step 7: Create Quorum Queue Setup Script

Create `setup_quorum_queues.py`:

```python
#!/usr/bin/env python3
import pika
import requests
from requests.auth import HTTPBasicAuth

def setup_quorum_queues():
    """Set up quorum queues via Management API"""

    base_url = "http://localhost:15671/api"
    auth = HTTPBasicAuth('admin', 'password')
    headers = {'content-type': 'application/json'}

    # Create quorum queue
    queue_config = {
        "auto_delete": False,
        "durable": True,
        "arguments": {
            "x-queue-type": "quorum",
            "x-quorum-initial-group-size": 3,  # Replicate to 3 nodes
            "x-max-length": 10000,
            "x-overflow": "reject-publish"
        }
    }

    # Create quorum queue
    response = requests.put(
        f"{base_url}/queues/%2F/ha_queue",
        json=queue_config,
        auth=auth,
        headers=headers
    )

    if response.status_code in [201, 204]:
        print("✓ Quorum queue 'ha_queue' created successfully")
    else:
        print(f"✗ Failed to create queue: {response.text}")
        return False

    # Create exchange
    exchange_config = {
        "type": "direct",
        "auto_delete": False,
        "durable": True
    }

    response = requests.put(
        f"{base_url}/exchanges/%2F/ha_exchange",
        json=exchange_config,
        auth=auth,
        headers=headers
    )

    if response.status_code in [201, 204]:
        print("✓ Exchange 'ha_exchange' created successfully")

    # Bind queue to exchange
    binding_config = {
        "routing_key": "ha_route"
    }

    response = requests.post(
        f"{base_url}/bindings/%2F/e/ha_exchange/q/ha_queue",
        json=binding_config,
        auth=auth,
        headers=headers
    )

    if response.status_code in [201, 204]:
        print("✓ Binding created successfully")

    return True

if __name__ == '__main__':
    setup_quorum_queues()
```

### Step 8: Create Cluster-Aware Producer

Create `cluster_producer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import time
from datetime import datetime
import random

class ClusterProducer:
    """Cluster-aware producer with automatic reconnection"""

    def __init__(self, hosts):
        self.hosts = hosts
        self.connection = None
        self.channel = None
        self.connect()

    def connect(self):
        """Connect to RabbitMQ cluster with retry"""
        credentials = pika.PlainCredentials('admin', 'password')

        # Try each host until one connects
        for host in self.hosts:
            try:
                parameters = pika.ConnectionParameters(
                    host=host['host'],
                    port=host['port'],
                    virtual_host='/',
                    credentials=credentials,
                    heartbeat=60,
                    blocked_connection_timeout=300,
                    connection_attempts=3,
                    retry_delay=2
                )

                self.connection = pika.BlockingConnection(parameters)
                self.channel = self.connection.channel()
                print(f"✓ Connected to {host['host']}:{host['port']}")
                return True

            except pika.exceptions.AMQPConnectionError as e:
                print(f"✗ Failed to connect to {host['host']}: {e}")
                continue

        raise Exception("Could not connect to any RabbitMQ node")

    def send_message(self, exchange, routing_key, message):
        """Send message with automatic reconnection"""
        max_retries = 3

        for attempt in range(max_retries):
            try:
                if not self.connection or self.connection.is_closed:
                    self.connect()

                self.channel.basic_publish(
                    exchange=exchange,
                    routing_key=routing_key,
                    body=json.dumps(message),
                    properties=pika.BasicProperties(
                        delivery_mode=2,  # Persistent
                        content_type='application/json',
                        timestamp=int(time.time())
                    ),
                    mandatory=True  # Return if unroutable
                )

                return True

            except (pika.exceptions.AMQPError,
                    pika.exceptions.ChannelClosedByBroker,
                    pika.exceptions.ConnectionClosedByBroker) as e:
                print(f"✗ Error sending message (attempt {attempt + 1}): {e}")

                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    try:
                        self.connect()
                    except:
                        pass

        return False

    def close(self):
        """Close connection"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            print("✓ Connection closed")

def main():
    # Cluster nodes (HAProxy in this case, but could be direct nodes)
    cluster_hosts = [
        {'host': 'localhost', 'port': 5671},  # HAProxy
    ]

    # Alternative: Direct connection to nodes
    # cluster_hosts = [
    #     {'host': 'localhost', 'port': 5672},  # rabbit1
    #     {'host': 'localhost', 'port': 5673},  # rabbit2
    #     {'host': 'localhost', 'port': 5674},  # rabbit3
    # ]

    producer = ClusterProducer(cluster_hosts)

    try:
        print("\nSending messages to quorum queue...")

        for i in range(1, 101):
            message = {
                'id': i,
                'text': f'Cluster message #{i}',
                'timestamp': datetime.now().isoformat(),
                'priority': random.randint(1, 10)
            }

            success = producer.send_message(
                exchange='ha_exchange',
                routing_key='ha_route',
                message=message
            )

            if success:
                print(f"✓ Sent message #{i}")
            else:
                print(f"✗ Failed to send message #{i}")

            time.sleep(0.1)

    except KeyboardInterrupt:
        print("\n✓ Stopped by user")

    finally:
        producer.close()

if __name__ == '__main__':
    main()
```

### Step 9: Create Cluster-Aware Consumer

Create `cluster_consumer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import time
import signal
import sys

class ClusterConsumer:
    """Cluster-aware consumer with automatic reconnection"""

    def __init__(self, hosts):
        self.hosts = hosts
        self.connection = None
        self.channel = None
        self.should_stop = False

        # Setup signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

    def signal_handler(self, sig, frame):
        """Handle shutdown signals"""
        print('\n✓ Shutting down gracefully...')
        self.should_stop = True
        if self.channel:
            self.channel.stop_consuming()

    def connect(self):
        """Connect to RabbitMQ cluster"""
        credentials = pika.PlainCredentials('admin', 'password')

        for host in self.hosts:
            try:
                parameters = pika.ConnectionParameters(
                    host=host['host'],
                    port=host['port'],
                    virtual_host='/',
                    credentials=credentials,
                    heartbeat=60,
                    blocked_connection_timeout=300
                )

                self.connection = pika.BlockingConnection(parameters)
                self.channel = self.connection.channel()

                # Set QoS
                self.channel.basic_qos(prefetch_count=1)

                print(f"✓ Connected to {host['host']}:{host['port']}")
                return True

            except pika.exceptions.AMQPConnectionError as e:
                print(f"✗ Failed to connect to {host['host']}: {e}")
                continue

        return False

    def callback(self, ch, method, properties, body):
        """Process received message"""
        try:
            message = json.loads(body)
            print(f"✓ Received: {message['text']} (ID: {message['id']})")

            # Simulate processing
            time.sleep(0.5)

            # Acknowledge message
            ch.basic_ack(delivery_tag=method.delivery_tag)

        except Exception as e:
            print(f"✗ Error processing message: {e}")
            # Negative acknowledge - requeue if first attempt
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def start_consuming(self):
        """Start consuming messages with auto-reconnect"""
        while not self.should_stop:
            try:
                if not self.connection or self.connection.is_closed:
                    if not self.connect():
                        print("✗ Could not connect to any node, retrying in 5s...")
                        time.sleep(5)
                        continue

                # Start consuming
                self.channel.basic_consume(
                    queue='ha_queue',
                    on_message_callback=self.callback,
                    auto_ack=False
                )

                print('⏳ Waiting for messages. Press CTRL+C to exit')
                self.channel.start_consuming()

            except pika.exceptions.AMQPConnectionError as e:
                print(f"✗ Connection lost: {e}")
                print("✓ Reconnecting in 5 seconds...")
                time.sleep(5)

            except pika.exceptions.ChannelClosedByBroker as e:
                print(f"✗ Channel closed: {e}")
                break

            except Exception as e:
                print(f"✗ Unexpected error: {e}")
                break

    def close(self):
        """Close connection"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            print("✓ Connection closed")

def main():
    cluster_hosts = [
        {'host': 'localhost', 'port': 5671},  # HAProxy
    ]

    consumer = ClusterConsumer(cluster_hosts)

    try:
        consumer.start_consuming()
    finally:
        consumer.close()

if __name__ == '__main__':
    main()
```

### Step 10: Test Node Failure

Create `test_node_failure.sh`:

```bash
#!/bin/bash

echo "=== Testing Node Failure Scenarios ==="
echo

echo "Step 1: Check initial cluster status"
docker exec rabbit1 rabbitmqctl cluster_status
echo

echo "Step 2: Stopping rabbit2 (RAM node)..."
docker-compose stop rabbit2
sleep 5
echo

echo "Step 3: Cluster status after rabbit2 stopped"
docker exec rabbit1 rabbitmqctl cluster_status
echo

echo "Step 4: Check if queue is still accessible"
docker exec rabbit1 rabbitmqctl list_queues name type durable arguments
echo

echo "Step 5: Restart rabbit2..."
docker-compose start rabbit2
sleep 10
echo

echo "Step 6: Check cluster status after restart"
docker exec rabbit1 rabbitmqctl cluster_status
echo

echo "Step 7: Test stopping rabbit1 (disc node)..."
docker-compose stop rabbit1
sleep 5
echo

echo "Step 8: Cluster status from rabbit3"
docker exec rabbit3 rabbitmqctl cluster_status
echo

echo "Step 9: Restart rabbit1..."
docker-compose start rabbit1
sleep 10
echo

echo "Step 10: Final cluster status"
docker exec rabbit1 rabbitmqctl cluster_status
echo

echo "=== Test Complete ==="
```

### Step 11: Create Network Partition Test

Create `test_network_partition.py`:

```python
#!/usr/bin/env python3
import subprocess
import time
import requests
from requests.auth import HTTPBasicAuth

def run_command(cmd):
    """Execute shell command"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode == 0, result.stdout, result.stderr

def check_cluster_status(node='rabbit1'):
    """Check cluster status"""
    success, stdout, stderr = run_command(
        f"docker exec {node} rabbitmqctl cluster_status"
    )
    print(stdout)
    return success

def create_network_partition():
    """Simulate network partition between rabbit1 and rabbit2"""
    print("Creating network partition (blocking rabbit1 <-> rabbit2)...")

    # Block traffic between rabbit1 and rabbit2
    commands = [
        "docker exec rabbit1 iptables -A INPUT -s rabbit2 -j DROP",
        "docker exec rabbit1 iptables -A OUTPUT -d rabbit2 -j DROP",
        "docker exec rabbit2 iptables -A INPUT -s rabbit1 -j DROP",
        "docker exec rabbit2 iptables -A OUTPUT -d rabbit1 -j DROP"
    ]

    for cmd in commands:
        run_command(cmd)

    print("✓ Network partition created")

def heal_network_partition():
    """Heal network partition"""
    print("Healing network partition...")

    # Flush iptables rules
    commands = [
        "docker exec rabbit1 iptables -F",
        "docker exec rabbit2 iptables -F"
    ]

    for cmd in commands:
        run_command(cmd)

    print("✓ Network partition healed")

def main():
    print("=== Network Partition Test ===\n")

    print("Step 1: Initial cluster status")
    check_cluster_status('rabbit1')
    print()

    print("Step 2: Creating network partition")
    create_network_partition()
    time.sleep(10)
    print()

    print("Step 3: Cluster status from rabbit1 (partition detected)")
    check_cluster_status('rabbit1')
    print()

    print("Step 4: Cluster status from rabbit3 (still connected to both)")
    check_cluster_status('rabbit3')
    print()

    print("Step 5: Waiting 30 seconds for partition handling...")
    time.sleep(30)
    print()

    print("Step 6: Healing network partition")
    heal_network_partition()
    time.sleep(10)
    print()

    print("Step 7: Final cluster status (should be healed)")
    check_cluster_status('rabbit1')
    print()

    print("=== Test Complete ===")

if __name__ == '__main__':
    main()
```

## Verification and Testing

### 1. Verify Cluster Formation

```bash
# Check cluster status
docker exec rabbit1 rabbitmqctl cluster_status

# Check all nodes
docker exec rabbit1 rabbitmqctl list_nodes

# Check queue replication
docker exec rabbit1 rabbitmqctl list_queues name type durable arguments
```

### 2. Test Load Balancing

```bash
# Check HAProxy stats
curl http://localhost:8404/stats

# Open in browser
open http://localhost:8404/stats
```

### 3. Monitor Queue Distribution

```bash
# Check queue leader
docker exec rabbit1 rabbitmqctl list_queues name pid slave_pids synchronised_slave_pids

# Check queue members for quorum queue
docker exec rabbit1 rabbitmqctl list_queues name members online
```

### 4. Test Message Persistence

```bash
# Send messages
python3 cluster_producer.py &
PRODUCER_PID=$!

# Stop a node
docker-compose stop rabbit2

# Messages should still be sent
wait $PRODUCER_PID

# Restart node
docker-compose start rabbit2

# Verify messages are replicated
docker exec rabbit2 rabbitmqctl list_queues
```

## Performance Testing

Create `performance_test.py`:

```python
#!/usr/bin/env python3
import pika
import time
import threading
from datetime import datetime
import statistics

def measure_throughput(host, port, num_messages=1000):
    """Measure message throughput"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host=host,
        port=port,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Start time
    start_time = time.time()

    # Send messages
    for i in range(num_messages):
        channel.basic_publish(
            exchange='ha_exchange',
            routing_key='ha_route',
            body=f'Message {i}'
        )

    # End time
    end_time = time.time()
    elapsed = end_time - start_time

    connection.close()

    throughput = num_messages / elapsed
    return throughput, elapsed

def main():
    print("=== RabbitMQ Cluster Performance Test ===\n")

    # Test through HAProxy
    print("Testing throughput via HAProxy...")
    throughput, elapsed = measure_throughput('localhost', 5671, 10000)
    print(f"Messages sent: 10000")
    print(f"Time taken: {elapsed:.2f} seconds")
    print(f"Throughput: {throughput:.2f} messages/second")
    print()

    # Test direct connection to nodes
    nodes = [
        ('rabbit1', 5672),
        ('localhost', 5673),  # rabbit2
        ('localhost', 5674),  # rabbit3
    ]

    print("Testing throughput to individual nodes...")
    for name, port in nodes:
        host = 'localhost'
        print(f"\nNode: {name}")
        throughput, elapsed = measure_throughput(host, port, 5000)
        print(f"Throughput: {throughput:.2f} messages/second")

if __name__ == '__main__':
    main()
```

## Troubleshooting

### Issue 1: Cluster Formation Fails

**Symptoms:**
```
Error: {inconsistent_cluster,"Node 'rabbit@rabbit2' thinks it's clustered with node 'rabbit@rabbit1', but 'rabbit@rabbit1' disagrees"}
```

**Solution:**
```bash
# Reset all nodes
docker exec rabbit2 rabbitmqctl stop_app
docker exec rabbit2 rabbitmqctl reset
docker exec rabbit2 rabbitmqctl start_app

# Re-join cluster
docker exec rabbit2 rabbitmqctl stop_app
docker exec rabbit2 rabbitmqctl join_cluster rabbit@rabbit1
docker exec rabbit2 rabbitmqctl start_app
```

### Issue 2: Erlang Cookie Mismatch

**Symptoms:**
```
Error: nodedown - rabbit@rabbit1
```

**Solution:**
```bash
# Ensure same Erlang cookie on all nodes
docker exec rabbit1 cat /var/lib/rabbitmq/.erlang.cookie
docker exec rabbit2 cat /var/lib/rabbitmq/.erlang.cookie
docker exec rabbit3 cat /var/lib/rabbitmq/.erlang.cookie

# Should all be identical
```

### Issue 3: Queue Not Replicating

**Symptoms:**
Queue exists on only one node

**Solution:**
```bash
# Check queue type
docker exec rabbit1 rabbitmqctl list_queues name type arguments

# For quorum queue, ensure x-queue-type is set
# Recreate queue with correct arguments if needed
```

### Issue 4: Split Brain After Network Partition

**Symptoms:**
```
Partitions detected: [{rabbit@rabbit1,rabbit@rabbit2}]
```

**Solution:**
```bash
# Wait for autoheal (configured in rabbitmq.conf)
# Or manually restart the losing node

# Check partition status
docker exec rabbit1 rabbitmqctl cluster_status

# Restart losing partition node
docker-compose restart rabbit2
```

## Best Practices

### 1. Use Quorum Queues (Not Classic Mirroring)

```python
# ✅ Good: Quorum queue
arguments = {
    "x-queue-type": "quorum",
    "x-quorum-initial-group-size": 3
}

# ❌ Bad: Classic mirrored queue (deprecated)
arguments = {
    "x-ha-policy": "all"
}
```

### 2. Proper Node Types

- **Disc nodes**: Store metadata on disk (majority needed)
- **RAM nodes**: Store metadata in RAM (faster, but risk data loss)
- **Recommendation**: At least 2 disc nodes, RAM nodes optional

### 3. Use HAProxy for Load Balancing

```
✅ Clients connect to HAProxy
✅ HAProxy distributes connections
✅ Automatic failover
```

### 4. Implement Client Reconnection Logic

```python
# Always implement:
# - Connection retry with exponential backoff
# - Multiple host endpoints
# - Heartbeat monitoring
# - Graceful shutdown
```

### 5. Monitor Cluster Health

```bash
# Key metrics to monitor:
# - Node status (up/down)
# - Queue synchronization
# - Memory usage per node
# - Disk space
# - Network partitions
```

### 6. Network Partition Handling

Configure in `rabbitmq.conf`:
```ini
# Options: ignore, pause_minority, autoheal
cluster_partition_handling = autoheal  # Recommended
```

### 7. Resource Management

```ini
# Set memory limits
vm_memory_high_watermark.relative = 0.6

# Set disk limits
disk_free_limit.absolute = 2GB

# Connection limits
connection_max = 4096
```

## Advanced Topics

### Cluster Maintenance

```bash
# Add new node to cluster
docker exec rabbit4 rabbitmqctl stop_app
docker exec rabbit4 rabbitmqctl join_cluster rabbit@rabbit1
docker exec rabbit4 rabbitmqctl start_app

# Remove node from cluster
docker exec rabbit2 rabbitmqctl stop_app
docker exec rabbit1 rabbitmqctl forget_cluster_node rabbit@rabbit2

# Change node type (disc <-> ram)
docker exec rabbit2 rabbitmqctl stop_app
docker exec rabbit2 rabbitmqctl change_cluster_node_type disc
docker exec rabbit2 rabbitmqctl start_app
```

### Monitoring Commands

```bash
# Check memory usage
docker exec rabbit1 rabbitmqctl status | grep -A 10 memory

# Check connections per node
docker exec rabbit1 rabbitmqctl list_connections peer_host peer_port node

# Check queue distribution
docker exec rabbit1 rabbitmqctl list_queues name node pid

# Check quorum queue members
docker exec rabbit1 rabbitmqctl list_queues name leader members
```

## Key Takeaways

1. ✅ Use **quorum queues** for high availability (not classic mirroring)
2. ✅ Deploy at least **3 nodes** (2 disc, 1 optional RAM)
3. ✅ Use **HAProxy** for load balancing and failover
4. ✅ Configure **autoheal** for network partition handling
5. ✅ Implement **client reconnection** logic
6. ✅ Set **memory and disk thresholds**
7. ✅ Monitor **cluster health** continuously
8. ✅ Test **failure scenarios** regularly

## Next Steps

1. Implement the complete cluster setup
2. Run failure simulation tests
3. Monitor cluster performance under load
4. Explore **Tutorial 06: Federation and Shovel** for multi-datacenter setups
5. Learn **Tutorial 07: Monitoring and Management** for production observability

## Additional Resources

- [RabbitMQ Clustering Guide](https://www.rabbitmq.com/clustering.html)
- [Quorum Queues](https://www.rabbitmq.com/quorum-queues.html)
- [Network Partitions](https://www.rabbitmq.com/partitions.html)
- [HAProxy Configuration](https://www.haproxy.com/documentation/)

---

**Congratulations!** You've mastered RabbitMQ clustering and high availability!
