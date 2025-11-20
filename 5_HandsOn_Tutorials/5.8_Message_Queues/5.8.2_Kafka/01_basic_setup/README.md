# Tutorial 01: Kafka Basic Setup

## Objectives

By the end of this tutorial, you will:
- Set up Kafka using Docker Compose with Zookeeper and KRaft mode
- Create and configure Kafka topics
- Implement a Python producer to send messages
- Implement a Python consumer to receive messages
- Understand offset management and commit strategies
- Use Kafka CLI tools for topic administration
- Monitor topics and consumer groups

## Prerequisites

- Docker and Docker Compose installed
- Python 3.8+ installed
- Basic understanding of message queues
- Text editor or IDE
- Terminal/command line access
- At least 4GB RAM available

## What is Apache Kafka?

Apache Kafka is a distributed streaming platform that provides:
- **Publish-Subscribe**: Send and receive streams of records
- **Storage**: Store streams durably and reliably
- **Processing**: Process streams in real-time

Unlike traditional message brokers, Kafka:
- Stores messages in a distributed commit log
- Allows consumers to replay messages
- Scales horizontally with partitions
- Provides ordering guarantees within partitions

### Key Features

- **High Throughput**: Handle millions of messages per second
- **Scalability**: Horizontal scaling with partitions
- **Durability**: Persistent storage with replication
- **Fault Tolerance**: Automatic failover with replicas
- **Real-time**: Low-latency message delivery
- **Replay Capability**: Consumers can rewind and reprocess

## When to Use Kafka?

Kafka excels at:
- **Event Streaming**: Real-time event pipelines
- **Log Aggregation**: Centralized logging
- **Metrics Collection**: System and application metrics
- **Data Integration**: Connect disparate systems
- **Stream Processing**: Real-time transformations
- **Event Sourcing**: Capture state changes as events

## Step-by-Step Instructions

### Step 1: Create Docker Compose File (Zookeeper Mode)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"
    networks:
      - kafka-network

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "9093:9093"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'
      KAFKA_LOG_RETENTION_HOURS: 168
    volumes:
      - kafka-data:/var/lib/kafka/data
    networks:
      - kafka-network
    healthcheck:
      test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
      interval: 10s
      timeout: 5s
      retries: 5

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:29092
      KAFKA_CLUSTERS_0_ZOOKEEPER: zookeeper:2181
    networks:
      - kafka-network

volumes:
  kafka-data:

networks:
  kafka-network:
    driver: bridge
```

### Step 2: Create Docker Compose File (KRaft Mode - No Zookeeper)

For a modern setup without Zookeeper, create `docker-compose-kraft.yml`:

```yaml
version: '3.8'

services:
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka-kraft
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_LOG_DIRS: /tmp/kraft-combined-logs
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
    volumes:
      - kafka-kraft-data:/tmp/kraft-combined-logs
    networks:
      - kafka-network

volumes:
  kafka-kraft-data:

networks:
  kafka-network:
    driver: bridge
```

### Step 3: Start Kafka

```bash
# Start Kafka with Zookeeper
docker-compose up -d

# OR start Kafka with KRaft mode
docker-compose -f docker-compose-kraft.yml up -d

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f kafka
```

Wait for the message: `[KafkaServer id=1] started`

### Step 4: Access Kafka UI

Open your browser and navigate to:
```
http://localhost:8080
```

Explore the UI:
- **Brokers**: View cluster information
- **Topics**: List and manage topics
- **Consumers**: Monitor consumer groups
- **Messages**: View and produce messages

### Step 5: Create Topic Using CLI

```bash
# Create a topic with 3 partitions
docker exec -it kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --create \
  --topic user-events \
  --partitions 3 \
  --replication-factor 1

# List all topics
docker exec -it kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --list

# Describe the topic
docker exec -it kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --describe \
  --topic user-events
```

### Step 6: Install Python Client Library

```bash
# Install kafka-python
pip install kafka-python

# Or install confluent-kafka (alternative, more performant)
pip install confluent-kafka
```

### Step 7: Create Python Producer

Create `producer.py`:

```python
#!/usr/bin/env python3
from kafka import KafkaProducer
import json
import time
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_producer():
    """Create and configure Kafka producer"""
    try:
        producer = KafkaProducer(
            bootstrap_servers=['localhost:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
            acks='all',  # Wait for all replicas to acknowledge
            retries=3,
            max_in_flight_requests_per_connection=1,  # Ensure ordering
            compression_type='gzip',
            linger_ms=10,  # Batch messages for better throughput
            batch_size=16384
        )
        logger.info("Producer created successfully")
        return producer
    except Exception as e:
        logger.error(f"Failed to create producer: {e}")
        raise

def send_messages(producer, topic='user-events', num_messages=10):
    """Send messages to Kafka topic"""
    try:
        for i in range(1, num_messages + 1):
            # Create message
            user_id = f"user-{i % 3}"  # Distribute across 3 users
            message = {
                'user_id': user_id,
                'event_id': i,
                'event_type': 'login' if i % 2 == 0 else 'logout',
                'timestamp': datetime.now().isoformat(),
                'metadata': {
                    'ip_address': f'192.168.1.{i}',
                    'device': 'mobile' if i % 2 == 0 else 'web'
                }
            }

            # Send message with key for partition assignment
            future = producer.send(
                topic,
                key=user_id,
                value=message
            )

            # Wait for acknowledgment
            record_metadata = future.get(timeout=10)

            logger.info(
                f"✓ Sent message {i}/{num_messages} | "
                f"Key: {user_id} | "
                f"Partition: {record_metadata.partition} | "
                f"Offset: {record_metadata.offset}"
            )

            time.sleep(0.5)

        # Flush remaining messages
        producer.flush()
        logger.info(f"\n✓ Successfully sent {num_messages} messages")

    except Exception as e:
        logger.error(f"Error sending messages: {e}")
        raise
    finally:
        producer.close()

if __name__ == '__main__':
    producer = create_producer()
    send_messages(producer, num_messages=10)
```

### Step 8: Create Python Consumer

Create `consumer.py`:

```python
#!/usr/bin/env python3
from kafka import KafkaConsumer
import json
import logging
import signal
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global consumer for graceful shutdown
consumer = None

def signal_handler(sig, frame):
    """Handle graceful shutdown"""
    logger.info('\n\nShutting down gracefully...')
    if consumer:
        consumer.close()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def create_consumer(group_id='consumer-group-1'):
    """Create and configure Kafka consumer"""
    try:
        consumer = KafkaConsumer(
            'user-events',
            bootstrap_servers=['localhost:9092'],
            group_id=group_id,
            auto_offset_reset='earliest',  # Start from beginning if no offset
            enable_auto_commit=False,  # Manual commit for reliability
            max_poll_records=10,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            key_deserializer=lambda k: k.decode('utf-8') if k else None,
            session_timeout_ms=30000,
            heartbeat_interval_ms=10000
        )
        logger.info(f"Consumer created with group_id: {group_id}")
        return consumer
    except Exception as e:
        logger.error(f"Failed to create consumer: {e}")
        raise

def consume_messages():
    """Consume and process messages from Kafka"""
    global consumer
    consumer = create_consumer()

    logger.info("⏳ Waiting for messages. Press CTRL+C to exit\n")

    try:
        message_count = 0
        for message in consumer:
            message_count += 1

            # Display message details
            logger.info(
                f"📨 Message {message_count} | "
                f"Partition: {message.partition} | "
                f"Offset: {message.offset} | "
                f"Key: {message.key}"
            )
            logger.info(f"   Value: {json.dumps(message.value, indent=2)}")

            # Process message (simulate work)
            process_message(message.value)

            # Manually commit offset after successful processing
            consumer.commit()
            logger.info(f"   ✓ Committed offset {message.offset}\n")

    except Exception as e:
        logger.error(f"Error consuming messages: {e}")
    finally:
        consumer.close()
        logger.info(f"\n✓ Processed {message_count} messages")

def process_message(message):
    """Process individual message (business logic here)"""
    event_type = message.get('event_type')
    user_id = message.get('user_id')

    if event_type == 'login':
        logger.info(f"   Processing login for {user_id}")
    elif event_type == 'logout':
        logger.info(f"   Processing logout for {user_id}")

if __name__ == '__main__':
    consume_messages()
```

### Step 9: Run Producer and Consumer

**Terminal 1 - Start Consumer:**
```bash
python consumer.py
```

**Terminal 2 - Run Producer:**
```bash
python producer.py
```

### Step 10: Verify in Kafka UI

1. Go to http://localhost:8080
2. Click on **Topics** → **user-events**
3. View:
   - Message count per partition
   - Consumer group offset
   - Message details
4. Click on **Consumers** to see consumer group lag

### Step 11: Test Offset Management

Create `consumer_manual_offset.py`:

```python
#!/usr/bin/env python3
from kafka import KafkaConsumer, TopicPartition
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def consume_with_manual_offset():
    """Consume messages with manual offset control"""
    consumer = KafkaConsumer(
        bootstrap_servers=['localhost:9092'],
        group_id='manual-offset-group',
        enable_auto_commit=False,
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )

    # Manually assign partitions
    topic = 'user-events'
    partitions = [TopicPartition(topic, p) for p in range(3)]
    consumer.assign(partitions)

    # Seek to specific offset (e.g., start from offset 5 in partition 0)
    consumer.seek(TopicPartition(topic, 0), 5)

    logger.info("Reading from offset 5 in partition 0...")

    for i, message in enumerate(consumer):
        if i >= 5:  # Read only 5 messages
            break

        logger.info(
            f"Partition: {message.partition}, "
            f"Offset: {message.offset}, "
            f"Value: {message.value}"
        )

    consumer.close()

if __name__ == '__main__':
    consume_with_manual_offset()
```

## Expected Output

### Producer Output:
```
2024-01-15 10:30:00 - INFO - Producer created successfully
2024-01-15 10:30:01 - INFO - ✓ Sent message 1/10 | Key: user-1 | Partition: 0 | Offset: 0
2024-01-15 10:30:02 - INFO - ✓ Sent message 2/10 | Key: user-2 | Partition: 1 | Offset: 0
2024-01-15 10:30:03 - INFO - ✓ Sent message 3/10 | Key: user-0 | Partition: 2 | Offset: 0
...
2024-01-15 10:30:10 - INFO - ✓ Successfully sent 10 messages
```

### Consumer Output:
```
2024-01-15 10:30:00 - INFO - Consumer created with group_id: consumer-group-1
2024-01-15 10:30:00 - INFO - ⏳ Waiting for messages. Press CTRL+C to exit

2024-01-15 10:30:01 - INFO - 📨 Message 1 | Partition: 0 | Offset: 0 | Key: user-1
2024-01-15 10:30:01 - INFO -    Value: {
  "user_id": "user-1",
  "event_id": 1,
  "event_type": "logout",
  ...
}
2024-01-15 10:30:01 - INFO -    Processing logout for user-1
2024-01-15 10:30:01 - INFO -    ✓ Committed offset 0
...
```

## Explanation

### How It Works

1. **Producer** serializes messages and sends to Kafka broker
2. **Broker** appends messages to partition log based on key hash
3. **Consumer** polls broker for new messages
4. **Offset** tracks consumer position in partition
5. **Commit** persists offset to Kafka for recovery

### Key Concepts

**Bootstrap Servers**: Initial broker list for connection
- Used for discovery of all brokers
- Can provide one or more brokers

**Topic**: Logical channel for messages
- Divided into partitions for scalability
- Messages ordered within partition

**Partition**: Ordered, immutable log
- Unit of parallelism
- Messages assigned based on key

**Offset**: Sequential message ID
- Unique per partition
- Managed by consumer group

**Consumer Group**: Set of consumers
- Each partition consumed by one consumer
- Enables parallel processing

**Commit**: Save current offset
- Auto-commit: Automatic periodic save
- Manual: Explicit control (more reliable)

**Replication**: Partition copies
- Leader handles reads/writes
- Followers replicate for fault tolerance

## Verification Steps

### 1. Check Topic Details
```bash
docker exec -it kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --describe --topic user-events
```

### 2. Check Consumer Group
```bash
docker exec -it kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe --group consumer-group-1
```

### 3. Read Messages with Console Consumer
```bash
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic user-events \
  --from-beginning \
  --max-messages 5
```

### 4. Produce Message via Console
```bash
docker exec -it kafka kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic user-events
```

## Troubleshooting

### Issue: Connection Timeout

**Symptoms:**
```
NoBrokersAvailable: NoBrokersAvailable
```

**Solution:**
```bash
# Check if Kafka is running
docker-compose ps

# Check logs
docker-compose logs kafka

# Verify port is accessible
telnet localhost 9092
```

### Issue: Topic Not Found

**Symptoms:**
```
UnknownTopicOrPartitionError
```

**Solution:**
```bash
# List topics
docker exec -it kafka kafka-topics --bootstrap-server localhost:9092 --list

# Create topic if missing
docker exec -it kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --create --topic user-events \
  --partitions 3 --replication-factor 1
```

### Issue: Consumer Not Receiving Messages

**Possible Causes:**
1. Consumer started before messages sent
2. Offset already committed past current messages
3. Consumer group has wrong configuration

**Debug:**
```bash
# Check consumer group status
docker exec -it kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe --group consumer-group-1

# Reset offsets to beginning
docker exec -it kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --group consumer-group-1 \
  --reset-offsets --to-earliest \
  --topic user-events --execute
```

## Best Practices

### 1. Error Handling
```python
from kafka.errors import KafkaError

try:
    future = producer.send('topic', value=message)
    record_metadata = future.get(timeout=10)
except KafkaError as e:
    logger.error(f"Failed to send message: {e}")
    # Implement retry logic or dead letter queue
```

### 2. Batch Processing
```python
# Consumer batch processing
messages = consumer.poll(timeout_ms=1000, max_records=100)
for topic_partition, records in messages.items():
    for record in records:
        process_message(record)
    # Commit after batch
    consumer.commit()
```

### 3. Message Serialization
```python
# Use Avro or Protobuf for production
from confluent_kafka import avro
from confluent_kafka.avro import AvroProducer

value_schema = avro.loads(schema_str)
producer = AvroProducer({
    'bootstrap.servers': 'localhost:9092',
    'schema.registry.url': 'http://localhost:8081'
}, default_value_schema=value_schema)
```

## Key Takeaways

1. ✅ Kafka stores messages in **partitioned topics** for scalability
2. ✅ **Message keys** determine partition assignment for ordering
3. ✅ **Consumer groups** enable parallel processing
4. ✅ **Offsets** track consumer position in each partition
5. ✅ **Manual commits** provide better reliability than auto-commit
6. ✅ **Replication** ensures fault tolerance
7. ✅ Messages are **retained** even after consumption
8. ✅ **Kafka UI** provides excellent visibility into cluster state

## Next Steps

After completing this tutorial:
1. Experiment with different partition counts
2. Try multiple consumers in the same group
3. Test consumer rebalancing by stopping/starting consumers
4. Explore message compression options
5. Move on to **Tutorial 02: Consumer Groups and Partitions**

## Additional Resources

- [Kafka Quick Start](https://kafka.apache.org/quickstart)
- [kafka-python Documentation](https://kafka-python.readthedocs.io/)
- [Confluent Developer](https://developer.confluent.io/)
- [Kafka CLI Reference](https://kafka.apache.org/documentation/#basic_ops)

---

**Congratulations!** You've successfully set up Kafka and built your first producer and consumer!
