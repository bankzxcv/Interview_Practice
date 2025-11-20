# Tutorial 02: Consumer Groups and Partitions

## Objectives

By the end of this tutorial, you will:
- Understand Kafka's partitioning strategy
- Master key-based partitioning for message ordering
- Implement consumer groups for parallel processing
- Handle consumer rebalancing scenarios
- Compare auto vs manual offset commit strategies
- Explore partition assignment strategies
- Build scalable consumer applications
- Monitor consumer lag and performance

## Prerequisites

- Completed Tutorial 01: Basic Setup
- Docker and Docker Compose running
- Python 3.8+ with kafka-python installed
- Understanding of Kafka topics and offsets
- Kafka cluster running from Tutorial 01

## What Are Partitions?

Partitions are Kafka's fundamental unit of parallelism. Each topic is divided into one or more partitions, which are ordered, immutable sequences of messages.

### Why Partitions Matter

- **Scalability**: Distribute data across multiple brokers
- **Parallelism**: Multiple consumers can read different partitions
- **Ordering**: Guarantee message order within a partition
- **Throughput**: Higher throughput through parallel writes/reads
- **Fault Tolerance**: Each partition can be replicated

### Partition Distribution

```
Topic: orders (3 partitions, replication-factor: 2)

Broker 1:  [Partition 0 - Leader]  [Partition 1 - Follower]
Broker 2:  [Partition 0 - Follower] [Partition 2 - Leader]
Broker 3:  [Partition 1 - Leader]  [Partition 2 - Follower]
```

## What Are Consumer Groups?

A consumer group is a set of consumers that cooperatively consume topics. Each partition is consumed by exactly one consumer within a group.

### Consumer Group Benefits

- **Load Balancing**: Distribute partitions among consumers
- **Fault Tolerance**: Automatic rebalancing on consumer failure
- **Scalability**: Add consumers to increase throughput
- **Independent Processing**: Different groups consume independently

### Consumer Group Example

```
Topic: orders (3 partitions)
Consumer Group: order-processors

Consumer 1 ──▶ Partition 0
Consumer 2 ──▶ Partition 1
Consumer 3 ──▶ Partition 2

If Consumer 2 fails:
Consumer 1 ──▶ Partition 0, Partition 1
Consumer 3 ──▶ Partition 2
```

## Step-by-Step Instructions

### Step 1: Create Multi-Partition Topic

```bash
# Create topic with 6 partitions
docker exec -it kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --create \
  --topic order-events \
  --partitions 6 \
  --replication-factor 1

# Describe the topic
docker exec -it kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --describe \
  --topic order-events
```

### Step 2: Producer with Key-Based Partitioning

Create `producer_with_keys.py`:

```python
#!/usr/bin/env python3
from kafka import KafkaProducer
import json
import time
from datetime import datetime
import random
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

def create_producer():
    """Create Kafka producer with custom partitioner"""
    return KafkaProducer(
        bootstrap_servers=['localhost:9092'],
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        key_serializer=lambda k: k.encode('utf-8'),
        acks='all',
        compression_type='snappy'
    )

def send_order_events(producer, num_orders=30):
    """Send order events with customer_id as key"""
    customers = [f'customer-{i}' for i in range(1, 6)]  # 5 customers
    order_types = ['created', 'confirmed', 'shipped', 'delivered', 'cancelled']

    partition_stats = {}

    for order_id in range(1, num_orders + 1):
        customer_id = random.choice(customers)

        order = {
            'order_id': f'order-{order_id}',
            'customer_id': customer_id,
            'order_type': random.choice(order_types),
            'amount': round(random.uniform(10.0, 1000.0), 2),
            'timestamp': datetime.now().isoformat()
        }

        # Key ensures all orders for same customer go to same partition
        future = producer.send(
            'order-events',
            key=customer_id,
            value=order
        )

        record_metadata = future.get(timeout=10)

        # Track partition distribution
        partition = record_metadata.partition
        partition_stats[partition] = partition_stats.get(partition, 0) + 1

        logger.info(
            f"Order {order_id:02d} | Customer: {customer_id} | "
            f"Type: {order['order_type']:10s} | "
            f"Partition: {partition} | Offset: {record_metadata.offset}"
        )

        time.sleep(0.1)

    producer.flush()
    producer.close()

    # Display partition distribution
    logger.info("\n" + "="*60)
    logger.info("Partition Distribution:")
    for partition in sorted(partition_stats.keys()):
        count = partition_stats[partition]
        bar = "█" * count
        logger.info(f"Partition {partition}: {count:3d} messages {bar}")
    logger.info("="*60)

if __name__ == '__main__':
    producer = create_producer()
    send_order_events(producer, num_orders=30)
```

### Step 3: Single Consumer

Create `single_consumer.py`:

```python
#!/usr/bin/env python3
from kafka import KafkaConsumer
import json
import logging
import signal
import sys

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

consumer = None

def signal_handler(sig, frame):
    logger.info('\n\nShutting down...')
    if consumer:
        consumer.close()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def consume_orders():
    """Single consumer handling all partitions"""
    global consumer

    consumer = KafkaConsumer(
        'order-events',
        bootstrap_servers=['localhost:9092'],
        group_id='order-processing-group',
        auto_offset_reset='earliest',
        enable_auto_commit=False,
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        key_deserializer=lambda k: k.decode('utf-8') if k else None
    )

    logger.info("Single consumer started")
    logger.info(f"Assigned partitions: {consumer.assignment()}")
    logger.info("Waiting for messages...\n")

    partition_counts = {}

    try:
        for message in consumer:
            partition = message.partition
            partition_counts[partition] = partition_counts.get(partition, 0) + 1

            logger.info(
                f"📦 Partition: {partition} | Offset: {message.offset:3d} | "
                f"Customer: {message.key} | Order: {message.value['order_id']}"
            )

            # Process order
            process_order(message.value)

            # Commit after processing
            consumer.commit()

    except KeyboardInterrupt:
        pass
    finally:
        logger.info("\n" + "="*60)
        logger.info("Messages consumed per partition:")
        for partition in sorted(partition_counts.keys()):
            logger.info(f"Partition {partition}: {partition_counts[partition]} messages")
        logger.info("="*60)

def process_order(order):
    """Simulate order processing"""
    pass  # Business logic here

if __name__ == '__main__':
    consume_orders()
```

### Step 4: Multiple Consumers in Same Group

Create `consumer_group.py`:

```python
#!/usr/bin/env python3
from kafka import KafkaConsumer
import json
import logging
import signal
import sys
import argparse
import time

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [Consumer-%(consumer_id)s] - %(message)s'
)

consumer = None

def signal_handler(sig, frame):
    if consumer:
        consumer.close()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def consume_orders(consumer_id):
    """Consumer as part of a group"""
    global consumer

    # Create logger with consumer_id
    logger = logging.LoggerAdapter(
        logging.getLogger(__name__),
        {'consumer_id': consumer_id}
    )

    consumer = KafkaConsumer(
        'order-events',
        bootstrap_servers=['localhost:9092'],
        group_id='order-processing-group',
        auto_offset_reset='earliest',
        enable_auto_commit=False,
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        key_deserializer=lambda k: k.decode('utf-8') if k else None,
        session_timeout_ms=30000,
        heartbeat_interval_ms=10000,
        max_poll_interval_ms=300000
    )

    logger.info("Consumer started, waiting for partition assignment...")

    # Track assignments
    partition_counts = {}
    message_count = 0

    try:
        for message in consumer:
            # Log partition assignment on first message
            if message_count == 0:
                partitions = [tp.partition for tp in consumer.assignment()]
                logger.info(f"Assigned partitions: {sorted(partitions)}")

            partition = message.partition
            partition_counts[partition] = partition_counts.get(partition, 0) + 1
            message_count += 1

            logger.info(
                f"📦 P{partition} | Offset: {message.offset:3d} | "
                f"Customer: {message.key} | Order: {message.value['order_id']}"
            )

            # Simulate processing time
            time.sleep(0.5)

            # Commit offset
            consumer.commit()

    except KeyboardInterrupt:
        pass
    finally:
        logger.info(f"\nProcessed {message_count} messages from partitions: {partition_counts}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--id', type=int, required=True, help='Consumer ID')
    args = parser.parse_args()

    consume_orders(args.id)
```

### Step 5: Test Consumer Group Scaling

**Terminal 1 - Producer:**
```bash
python producer_with_keys.py
```

**Terminal 2 - Consumer 1:**
```bash
python consumer_group.py --id 1
```

**Terminal 3 - Consumer 2:**
```bash
python consumer_group.py --id 2
```

**Terminal 4 - Consumer 3:**
```bash
python consumer_group.py --id 3
```

Observe how partitions are distributed among consumers!

### Step 6: Monitor Consumer Group

```bash
# Check consumer group status
docker exec -it kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe \
  --group order-processing-group

# Output shows:
# - Consumer members
# - Partition assignments
# - Current offsets
# - Lag per partition
```

### Step 7: Partition Assignment Strategies

Create `custom_assignment.py`:

```python
#!/usr/bin/env python3
from kafka import KafkaConsumer
from kafka.coordinator.assignors.range import RangePartitionAssignor
from kafka.coordinator.assignors.roundrobin import RoundRobinPartitionAssignor
from kafka.coordinator.assignors.sticky import StickyPartitionAssignor
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_assignment_strategy(strategy_name, assignor_class):
    """Test different partition assignment strategies"""
    logger.info(f"\n{'='*60}")
    logger.info(f"Testing {strategy_name} Strategy")
    logger.info(f"{'='*60}")

    consumer = KafkaConsumer(
        'order-events',
        bootstrap_servers=['localhost:9092'],
        group_id=f'test-{strategy_name.lower()}-group',
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        partition_assignment_strategy=[assignor_class],
        consumer_timeout_ms=5000
    )

    # Wait for assignment
    consumer.poll(timeout_ms=1000)

    partitions = [tp.partition for tp in consumer.assignment()]
    logger.info(f"Assigned partitions: {sorted(partitions)}")

    consumer.close()

if __name__ == '__main__':
    # Test different strategies
    test_assignment_strategy('Range', RangePartitionAssignor)
    test_assignment_strategy('RoundRobin', RoundRobinPartitionAssignor)
    test_assignment_strategy('Sticky', StickyPartitionAssignor)
```

### Step 8: Manual Offset Commit Strategies

Create `offset_strategies.py`:

```python
#!/usr/bin/env python3
from kafka import KafkaConsumer, TopicPartition
import json
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def auto_commit_consumer():
    """Auto-commit offsets (less control, simpler)"""
    logger.info("\n=== AUTO COMMIT STRATEGY ===")

    consumer = KafkaConsumer(
        'order-events',
        bootstrap_servers=['localhost:9092'],
        group_id='auto-commit-group',
        auto_offset_reset='earliest',
        enable_auto_commit=True,  # Auto commit enabled
        auto_commit_interval_ms=5000,  # Commit every 5 seconds
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )

    for i, message in enumerate(consumer):
        if i >= 5:
            break
        logger.info(f"Consumed: {message.value['order_id']} (offset auto-committed)")

    consumer.close()

def manual_commit_sync():
    """Manual synchronous commit (reliable but slower)"""
    logger.info("\n=== MANUAL SYNC COMMIT STRATEGY ===")

    consumer = KafkaConsumer(
        'order-events',
        bootstrap_servers=['localhost:9092'],
        group_id='manual-sync-group',
        auto_offset_reset='earliest',
        enable_auto_commit=False,
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )

    for i, message in enumerate(consumer):
        if i >= 5:
            break

        logger.info(f"Processing: {message.value['order_id']}")

        # Process message
        time.sleep(0.1)

        # Commit after successful processing (blocks)
        consumer.commit()
        logger.info(f"  ✓ Committed offset {message.offset}")

    consumer.close()

def manual_commit_async():
    """Manual asynchronous commit (faster but may lose commits)"""
    logger.info("\n=== MANUAL ASYNC COMMIT STRATEGY ===")

    def commit_callback(offsets, exception):
        if exception:
            logger.error(f"Commit failed: {exception}")
        else:
            logger.info(f"  ✓ Async committed: {offsets}")

    consumer = KafkaConsumer(
        'order-events',
        bootstrap_servers=['localhost:9092'],
        group_id='manual-async-group',
        auto_offset_reset='earliest',
        enable_auto_commit=False,
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )

    for i, message in enumerate(consumer):
        if i >= 5:
            break

        logger.info(f"Processing: {message.value['order_id']}")

        # Process message
        time.sleep(0.1)

        # Commit asynchronously (non-blocking)
        consumer.commit_async(callback=commit_callback)

    # Final synchronous commit before closing
    consumer.commit()
    consumer.close()

def batch_commit():
    """Commit in batches for better performance"""
    logger.info("\n=== BATCH COMMIT STRATEGY ===")

    consumer = KafkaConsumer(
        'order-events',
        bootstrap_servers=['localhost:9092'],
        group_id='batch-commit-group',
        auto_offset_reset='earliest',
        enable_auto_commit=False,
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )

    batch = []
    batch_size = 3

    for i, message in enumerate(consumer):
        if i >= 10:
            break

        batch.append(message)
        logger.info(f"Buffered: {message.value['order_id']} ({len(batch)}/{batch_size})")

        # Commit when batch is full
        if len(batch) >= batch_size:
            logger.info(f"  ✓ Processing batch of {len(batch)} messages")
            # Process batch
            time.sleep(0.2)

            # Commit after batch processing
            consumer.commit()
            logger.info(f"  ✓ Committed batch\n")
            batch = []

    # Commit remaining messages
    if batch:
        consumer.commit()
        logger.info(f"  ✓ Committed final batch of {len(batch)} messages")

    consumer.close()

if __name__ == '__main__':
    auto_commit_consumer()
    time.sleep(2)

    manual_commit_sync()
    time.sleep(2)

    manual_commit_async()
    time.sleep(2)

    batch_commit()
```

### Step 9: Test Rebalancing

Create `rebalance_listener.py`:

```python
#!/usr/bin/env python3
from kafka import KafkaConsumer
from kafka.coordinator.assignors.range import RangePartitionAssignor
import json
import logging
import argparse

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [C-%(consumer_id)s] - %(message)s')

class RebalanceListener:
    """Listen to rebalance events"""

    def __init__(self, consumer_id):
        self.consumer_id = consumer_id
        self.logger = logging.LoggerAdapter(
            logging.getLogger(__name__),
            {'consumer_id': consumer_id}
        )

    def on_partitions_revoked(self, revoked):
        """Called before rebalancing starts"""
        if revoked:
            partitions = [p.partition for p in revoked]
            self.logger.warning(f"⚠️  REVOKED partitions: {sorted(partitions)}")

    def on_partitions_assigned(self, assigned):
        """Called after rebalancing completes"""
        if assigned:
            partitions = [p.partition for p in assigned]
            self.logger.info(f"✓ ASSIGNED partitions: {sorted(partitions)}")

def consume_with_rebalance_listener(consumer_id):
    """Consumer with rebalance listener"""
    logger = logging.LoggerAdapter(
        logging.getLogger(__name__),
        {'consumer_id': consumer_id}
    )

    rebalance_listener = RebalanceListener(consumer_id)

    consumer = KafkaConsumer(
        'order-events',
        bootstrap_servers=['localhost:9092'],
        group_id='rebalance-test-group',
        auto_offset_reset='earliest',
        enable_auto_commit=False,
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )

    # Subscribe with rebalance listener
    consumer.subscribe(
        ['order-events'],
        listener=rebalance_listener
    )

    logger.info("Consumer started, waiting for assignment...")

    try:
        for message in consumer:
            logger.info(
                f"P{message.partition} | Offset: {message.offset} | "
                f"Order: {message.value['order_id']}"
            )
            consumer.commit()

    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        consumer.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--id', type=int, required=True)
    args = parser.parse_args()

    consume_with_rebalance_listener(args.id)
```

**Test Rebalancing:**
```bash
# Terminal 1 - Start consumer 1
python rebalance_listener.py --id 1

# Terminal 2 - Start consumer 2 (observe rebalance)
python rebalance_listener.py --id 2

# Terminal 3 - Start consumer 3 (observe rebalance)
python rebalance_listener.py --id 3

# Stop consumer 2 and observe rebalance in other consumers
```

## Expected Behavior

### Partition Assignment (3 consumers, 6 partitions)

```
Consumer 1: [Partition 0, Partition 1]
Consumer 2: [Partition 2, Partition 3]
Consumer 3: [Partition 4, Partition 5]
```

### After Consumer 2 Fails

```
Consumer 1: [Partition 0, Partition 1, Partition 2]
Consumer 3: [Partition 3, Partition 4, Partition 5]
```

### Consumer Group Lag

```bash
GROUP               TOPIC          PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
order-group         order-events   0          150             150             0
order-group         order-events   1          148             150             2
order-group         order-events   2          150             150             0
```

## Explanation

### Key-Based Partitioning

Messages with the same key always go to the same partition:
```
hash(key) % num_partitions = partition_id
```

This ensures:
- **Order guarantee**: All messages for a customer are ordered
- **Affinity**: Related messages processed together
- **Statefulness**: Stateful processing per key

### Consumer Group Coordination

1. **Join Group**: Consumer sends JoinGroup request
2. **Leader Election**: Coordinator elects group leader
3. **Assignment**: Leader assigns partitions using strategy
4. **Sync**: Assignment distributed to all members
5. **Heartbeats**: Consumers send heartbeats to stay alive

### Rebalancing Triggers

- Consumer joins group
- Consumer leaves group (gracefully or crashes)
- Consumer stops sending heartbeats
- Topic partition count changes
- Timeout in processing (max.poll.interval.ms exceeded)

### Partition Assignment Strategies

**Range Assignor** (default):
- Assigns consecutive partitions
- Can cause uneven distribution

**RoundRobin Assignor**:
- Distributes partitions evenly
- Better load balancing

**Sticky Assignor**:
- Minimizes partition movement during rebalance
- Better for stateful processing

**Cooperative Sticky**:
- Incremental rebalancing
- Reduces stop-the-world pauses

## Best Practices

### 1. Choose Right Partition Count

```python
# Rule of thumb: partitions >= max concurrent consumers
# Consider future scaling
partitions = max(current_consumers, expected_peak_consumers) * 2
```

### 2. Use Meaningful Keys

```python
# ✅ Good: Consistent key for ordering
producer.send('orders', key=customer_id, value=order)

# ❌ Bad: Random key breaks ordering
producer.send('orders', key=random_uuid, value=order)

# ⚠️ Careful: No key = round-robin (no ordering)
producer.send('orders', value=order)
```

### 3. Monitor Consumer Lag

```bash
# Set up alerting for lag > threshold
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe --group my-group | grep LAG
```

### 4. Handle Rebalancing Gracefully

```python
# Commit offsets before partitions are revoked
def on_partitions_revoked(self, revoked):
    consumer.commit()  # Commit current position
    # Clean up state for revoked partitions
```

### 5. Tune Consumer Configuration

```python
consumer = KafkaConsumer(
    # Prevent rebalance if processing takes time
    max_poll_interval_ms=300000,  # 5 minutes

    # Faster rebalance detection
    session_timeout_ms=30000,     # 30 seconds
    heartbeat_interval_ms=10000,  # 10 seconds

    # Batch processing
    max_poll_records=100
)
```

## Key Takeaways

1. ✅ **Partitions** enable parallelism and scalability
2. ✅ **Message keys** ensure ordering within partitions
3. ✅ **Consumer groups** distribute partitions among consumers
4. ✅ **Rebalancing** happens automatically but causes brief pause
5. ✅ **Partition count** should match or exceed consumer count
6. ✅ **Manual commits** provide better control than auto-commit
7. ✅ **Sticky assignor** minimizes partition movement
8. ✅ **Monitor lag** to detect consumer performance issues

## Next Steps

After completing this tutorial:
1. Experiment with different partition counts
2. Test rebalancing under various scenarios
3. Implement custom partition assignment logic
4. Build a stateful consumer using local storage
5. Move on to **Tutorial 03: Kafka Connect**

## Additional Resources

- [Kafka Consumer Group Protocol](https://kafka.apache.org/documentation/#consumerconfigs)
- [Partition Assignment Strategies](https://www.confluent.io/blog/cooperative-rebalancing-in-kafka-streams-consumer-ksqldb/)
- [Consumer Lag Monitoring](https://www.datadoghq.com/blog/monitoring-kafka-performance-metrics/)

---

**Congratulations!** You now understand Kafka's partitioning and consumer group mechanisms!
