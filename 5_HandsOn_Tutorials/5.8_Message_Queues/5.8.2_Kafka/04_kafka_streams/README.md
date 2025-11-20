# Tutorial 04: Kafka Streams

## Objectives

By the end of this tutorial, you will:
- Understand Kafka Streams architecture and concepts
- Build stream processing topologies
- Implement stateless transformations (map, filter, flatMap)
- Implement stateful operations (aggregations, joins, windowing)
- Use KStream and KTable abstractions
- Implement windowing operations (tumbling, hopping, session)
- Monitor and debug Kafka Streams applications
- Build real-time analytics pipelines

## Prerequisites

- Completed Tutorials 01, 02, and 03
- Docker and Docker Compose running
- Python 3.8+ or Java 11+ installed
- Understanding of stream processing concepts
- At least 4GB RAM available

## What is Kafka Streams?

Kafka Streams is a client library for building real-time streaming applications and microservices. Unlike other stream processing frameworks (Spark Streaming, Flink), it's:

- **Lightweight**: No separate cluster required, just a library
- **Scalable**: Scales elastically by adding instances
- **Fault-tolerant**: Automatic state recovery and rebalancing
- **Exactly-once**: Exactly-once processing semantics
- **Integrated**: Native Kafka integration, no external dependencies

### Core Concepts

**Stream**: Unbounded, continuously updating dataset
**Table**: Snapshot of latest state (changelog stream)
**Topology**: DAG of stream processing operations
**State Store**: Local, fault-tolerant storage for stateful operations
**Windowing**: Group events by time boundaries

### Kafka Streams DSL

```
Stream Processing Topology:

Source Topic ──▶ [Filter] ──▶ [Map] ──▶ [GroupBy] ──▶ [Aggregate] ──▶ Sink Topic
                                              │
                                              ▼
                                        [State Store]
```

## Step-by-Step Instructions

### Step 1: Setup Docker Environment

Use the Docker Compose from Tutorial 01, or create a new one:

```bash
# Start Kafka
docker-compose up -d

# Create input topics
docker exec -it kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --create --topic user-clicks \
  --partitions 3 --replication-factor 1

docker exec -it kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --create --topic user-purchases \
  --partitions 3 --replication-factor 1
```

### Step 2: Install Kafka Streams Libraries

**For Python (using kafka-python for basic streaming):**
```bash
pip install kafka-python faust-streaming
```

**For Java (full Kafka Streams API):**
```xml
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-streams</artifactId>
    <version>3.6.0</version>
</dependency>
```

### Step 3: Stateless Transformations - Python

Create `stateless_transforms.py`:

```python
#!/usr/bin/env python3
from kafka import KafkaProducer, KafkaConsumer
import json
import time
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simulated stream processing with Python
# (For production, use Faust or ksqlDB)

def produce_click_events():
    """Produce sample click events"""
    producer = KafkaProducer(
        bootstrap_servers=['localhost:9092'],
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )

    events = [
        {'user_id': 'user1', 'page': '/home', 'duration': 5, 'timestamp': datetime.now().isoformat()},
        {'user_id': 'user2', 'page': '/products', 'duration': 10, 'timestamp': datetime.now().isoformat()},
        {'user_id': 'user1', 'page': '/cart', 'duration': 3, 'timestamp': datetime.now().isoformat()},
        {'user_id': 'user3', 'page': '/checkout', 'duration': 8, 'timestamp': datetime.now().isoformat()},
        {'user_id': 'user2', 'page': '/home', 'duration': 2, 'timestamp': datetime.now().isoformat()},
    ]

    for event in events:
        producer.send('user-clicks', value=event)
        logger.info(f"Produced: {event}")
        time.sleep(1)

    producer.flush()
    producer.close()

def filter_transform():
    """Filter: Keep only events with duration > 5"""
    consumer = KafkaConsumer(
        'user-clicks',
        bootstrap_servers=['localhost:9092'],
        auto_offset_reset='earliest',
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        consumer_timeout_ms=10000
    )

    producer = KafkaProducer(
        bootstrap_servers=['localhost:9092'],
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )

    logger.info("\n=== FILTER: duration > 5 ===")
    for message in consumer:
        event = message.value

        # Filter transformation
        if event['duration'] > 5:
            logger.info(f"✓ Passed filter: {event}")
            producer.send('filtered-clicks', value=event)
        else:
            logger.info(f"✗ Filtered out: {event}")

    consumer.close()
    producer.close()

def map_transform():
    """Map: Transform event structure"""
    consumer = KafkaConsumer(
        'filtered-clicks',
        bootstrap_servers=['localhost:9092'],
        auto_offset_reset='earliest',
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        consumer_timeout_ms=10000
    )

    producer = KafkaProducer(
        bootstrap_servers=['localhost:9092'],
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )

    logger.info("\n=== MAP: Transform structure ===")
    for message in consumer:
        event = message.value

        # Map transformation
        transformed = {
            'user': event['user_id'],
            'location': event['page'],
            'engagement_score': event['duration'] * 10,
            'processed_at': datetime.now().isoformat()
        }

        logger.info(f"Original: {event}")
        logger.info(f"Mapped:   {transformed}\n")
        producer.send('mapped-clicks', value=transformed)

    consumer.close()
    producer.close()

def flatmap_transform():
    """FlatMap: One input → multiple outputs"""
    consumer = KafkaConsumer(
        'user-clicks',
        bootstrap_servers=['localhost:9092'],
        auto_offset_reset='earliest',
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        consumer_timeout_ms=10000
    )

    producer = KafkaProducer(
        bootstrap_servers=['localhost:9092'],
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )

    logger.info("\n=== FLATMAP: Split into multiple events ===")
    for message in consumer:
        event = message.value

        # FlatMap: Create multiple events from one
        events = [
            {'type': 'page_view', 'user': event['user_id'], 'page': event['page']},
            {'type': 'engagement', 'user': event['user_id'], 'duration': event['duration']}
        ]

        logger.info(f"Input:  {event}")
        for out_event in events:
            logger.info(f"Output: {out_event}")
            producer.send('flatmapped-clicks', value=out_event)
        logger.info("")

    consumer.close()
    producer.close()

if __name__ == '__main__':
    # Run transformations
    produce_click_events()
    time.sleep(2)
    filter_transform()
    time.sleep(1)
    map_transform()
    time.sleep(1)
    flatmap_transform()
```

### Step 4: Stateful Operations - Aggregations

Create `stateful_aggregations.py`:

```python
#!/usr/bin/env python3
from kafka import KafkaConsumer, KafkaProducer
import json
from collections import defaultdict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def count_by_user():
    """Count events per user (stateful aggregation)"""
    consumer = KafkaConsumer(
        'user-clicks',
        bootstrap_servers=['localhost:9092'],
        auto_offset_reset='earliest',
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        consumer_timeout_ms=10000
    )

    # State: in-memory count (in production, use state store)
    user_counts = defaultdict(int)

    logger.info("\n=== COUNT BY USER (Aggregation) ===")
    for message in consumer:
        event = message.value
        user_id = event['user_id']

        # Update state
        user_counts[user_id] += 1

        logger.info(f"User: {user_id} | Count: {user_counts[user_id]}")

    logger.info("\n=== Final Counts ===")
    for user, count in user_counts.items():
        logger.info(f"{user}: {count} clicks")

    consumer.close()

def sum_duration_by_user():
    """Sum duration per user"""
    consumer = KafkaConsumer(
        'user-clicks',
        bootstrap_servers=['localhost:9092'],
        auto_offset_reset='earliest',
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        consumer_timeout_ms=10000
    )

    # State: total duration per user
    user_durations = defaultdict(float)

    logger.info("\n=== SUM DURATION BY USER ===")
    for message in consumer:
        event = message.value
        user_id = event['user_id']
        duration = event['duration']

        # Update state
        user_durations[user_id] += duration

        logger.info(f"User: {user_id} | Total Duration: {user_durations[user_id]}s")

    consumer.close()

def group_by_page():
    """Group events by page"""
    consumer = KafkaConsumer(
        'user-clicks',
        bootstrap_servers=['localhost:9092'],
        auto_offset_reset='earliest',
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        consumer_timeout_ms=10000
    )

    # State: events grouped by page
    page_groups = defaultdict(list)

    logger.info("\n=== GROUP BY PAGE ===")
    for message in consumer:
        event = message.value
        page = event['page']

        # Add to group
        page_groups[page].append(event)

    logger.info("\n=== Grouped Results ===")
    for page, events in page_groups.items():
        logger.info(f"\nPage: {page} ({len(events)} events)")
        for event in events:
            logger.info(f"  - User: {event['user_id']}, Duration: {event['duration']}s")

    consumer.close()

if __name__ == '__main__':
    count_by_user()
    sum_duration_by_user()
    group_by_page()
```

### Step 5: Kafka Streams with Faust (Python)

Install Faust:
```bash
pip install faust-streaming
```

Create `faust_streams.py`:

```python
#!/usr/bin/env python3
import faust
from datetime import timedelta

# Define Faust app
app = faust.App(
    'click-analytics',
    broker='kafka://localhost:9092',
    value_serializer='json',
)

# Define record schema
class ClickEvent(faust.Record):
    user_id: str
    page: str
    duration: int
    timestamp: str

class PageStats(faust.Record):
    page: str
    total_views: int
    total_duration: int
    avg_duration: float

# Define topics
clicks_topic = app.topic('user-clicks', value_type=ClickEvent)
stats_topic = app.topic('page-stats', value_type=PageStats)

# Define table for stateful aggregation
page_stats_table = app.Table(
    'page_stats',
    default=PageStats,
    partitions=3
)

@app.agent(clicks_topic)
async def process_clicks(clicks):
    """Process click events and compute statistics"""
    async for click in clicks:
        print(f"Processing click: {click.user_id} → {click.page}")

        # Get current stats for page
        stats = page_stats_table.get(click.page, PageStats(
            page=click.page,
            total_views=0,
            total_duration=0,
            avg_duration=0.0
        ))

        # Update stats
        stats.total_views += 1
        stats.total_duration += click.duration
        stats.avg_duration = stats.total_duration / stats.total_views

        # Save to table
        page_stats_table[click.page] = stats

        # Emit updated stats
        await stats_topic.send(value=stats)

        print(f"  Stats: {stats.page} - Views: {stats.total_views}, Avg Duration: {stats.avg_duration:.2f}s")

@app.page('/stats/')
async def get_stats(web, request):
    """Web endpoint to view current stats"""
    stats = {page: stats.asdict() for page, stats in page_stats_table.items()}
    return web.json(stats)

# To run: faust -A faust_streams worker -l info
```

### Step 6: Windowing Operations

Create `windowing_example.py`:

```python
#!/usr/bin/env python3
import faust
from datetime import timedelta

app = faust.App('windowing-demo', broker='kafka://localhost:9092')

class ClickEvent(faust.Record):
    user_id: str
    page: str
    timestamp: str

clicks = app.topic('user-clicks', value_type=ClickEvent)

# Tumbling Window: Fixed, non-overlapping windows
@app.agent(clicks)
async def tumbling_window_count(stream):
    """Count clicks in 30-second tumbling windows"""
    async for window, count in stream.tumbling(timedelta(seconds=30)).count():
        print(f"Tumbling Window {window}: {count} clicks")

# Hopping Window: Fixed, overlapping windows
@app.agent(clicks)
async def hopping_window_count(stream):
    """Count clicks in 1-minute windows, advancing every 30 seconds"""
    async for window, count in stream.hopping(
        size=timedelta(minutes=1),
        step=timedelta(seconds=30)
    ).count():
        print(f"Hopping Window {window}: {count} clicks")

# Session Window: Dynamic windows based on inactivity
@app.agent(clicks)
async def session_window_count(stream):
    """Count clicks in session windows (5-second gap timeout)"""
    async for window, events in stream.group_by(ClickEvent.user_id).items():
        # Session window: new window after 5 seconds of inactivity
        print(f"Session for {window}: {len(list(events))} clicks")
```

### Step 7: Join Operations

Create `stream_joins.py`:

```python
#!/usr/bin/env python3
import faust
from datetime import timedelta

app = faust.App('join-demo', broker='kafka://localhost:9092')

class ClickEvent(faust.Record):
    user_id: str
    page: str
    timestamp: str

class PurchaseEvent(faust.Record):
    user_id: str
    product: str
    amount: float
    timestamp: str

clicks = app.topic('user-clicks', value_type=ClickEvent)
purchases = app.topic('user-purchases', value_type=PurchaseEvent)

# Stream-Stream Join
@app.agent(clicks)
async def join_clicks_purchases(click_stream):
    """Join clicks with purchases within time window"""
    # Create table from purchases
    purchase_table = app.Table('recent_purchases', default=list)

    async for click in click_stream:
        user_id = click.user_id

        # Check if user made recent purchase
        recent_purchases = purchase_table.get(user_id, [])

        if recent_purchases:
            print(f"User {user_id} clicked {click.page} after purchasing {recent_purchases}")
        else:
            print(f"User {user_id} clicked {click.page} (no recent purchases)")

@app.agent(purchases)
async def track_purchases(purchase_stream):
    """Track recent purchases in table"""
    purchase_table = app.Table('recent_purchases', default=list)

    async for purchase in purchase_stream:
        user_purchases = purchase_table.get(purchase.user_id, [])
        user_purchases.append(purchase.product)

        # Keep only last 5 purchases
        purchase_table[purchase.user_id] = user_purchases[-5:]
```

### Step 8: Java Kafka Streams (Optional)

Create `StreamsExample.java`:

```java
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.StreamsConfig;
import org.apache.kafka.streams.kstream.*;

import java.time.Duration;
import java.util.Properties;

public class StreamsExample {

    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "click-analytics");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

        StreamsBuilder builder = new StreamsBuilder();

        // Create KStream from topic
        KStream<String, String> clicks = builder.stream("user-clicks");

        // Stateless: Filter, Map
        KStream<String, String> filteredClicks = clicks
            .filter((key, value) -> value.contains("duration"))
            .mapValues(value -> value.toUpperCase());

        // Stateful: Count by key
        KTable<String, Long> clickCounts = clicks
            .groupByKey()
            .count(Materialized.as("click-counts"));

        // Windowed aggregation
        KTable<Windowed<String>, Long> windowedCounts = clicks
            .groupByKey()
            .windowedBy(TimeWindows.of(Duration.ofMinutes(1)))
            .count();

        // Write to output topic
        filteredClicks.to("filtered-clicks");

        // Start streams
        KafkaStreams streams = new KafkaStreams(builder.build(), props);
        streams.start();

        // Graceful shutdown
        Runtime.getRuntime().addShutdownHook(new Thread(streams::close));
    }
}
```

### Step 9: Monitoring Kafka Streams

Create `monitor_streams.py`:

```python
#!/usr/bin/env python3
import requests
from kafka import KafkaConsumer
import json
import time

def monitor_state_stores():
    """Monitor state store sizes"""
    # This would connect to Kafka Streams interactive queries
    # For Faust, use the web endpoint
    try:
        response = requests.get('http://localhost:6066/stats/')
        stats = response.json()

        print("\n=== State Store Statistics ===")
        for page, page_stats in stats.items():
            print(f"\nPage: {page}")
            print(f"  Total Views: {page_stats['total_views']}")
            print(f"  Avg Duration: {page_stats['avg_duration']:.2f}s")

    except Exception as e:
        print(f"Error monitoring: {e}")

def monitor_processing_lag():
    """Monitor stream processing lag"""
    consumer = KafkaConsumer(
        bootstrap_servers=['localhost:9092'],
        group_id='click-analytics'
    )

    # Get lag information
    partitions = consumer.partitions_for_topic('user-clicks')
    if partitions:
        print("\n=== Processing Lag ===")
        for partition in partitions:
            # This is simplified - actual implementation would check committed offsets
            print(f"Partition {partition}: Monitoring...")

if __name__ == '__main__':
    while True:
        monitor_state_stores()
        time.sleep(5)
```

## Key Concepts Explained

### KStream vs KTable

**KStream**: Unbounded stream of records
- Each record is independent
- Represents INSERT operations
- Example: Click events, transactions

**KTable**: Changelog stream (latest value per key)
- Updates replace previous values
- Represents current state
- Example: User profiles, inventory

### Windowing Types

**Tumbling Windows**:
```
[0-30s] [30-60s] [60-90s]
  ■■■     ■■■      ■■■
```
- Fixed size, non-overlapping
- Use: Periodic aggregations

**Hopping Windows**:
```
[0-60s]
    [30-90s]
        [60-120s]
```
- Fixed size, overlapping
- Use: Moving averages

**Session Windows**:
```
[User1: 0-15s] .... [User1: 40-65s]
```
- Dynamic size based on inactivity
- Use: User sessions, burst detection

## Best Practices

### 1. Topology Design
```python
# ✅ Good: Clear, linear topology
stream.filter(...).map(...).to(output_topic)

# ❌ Bad: Complex branching without documentation
stream.branch(...)[0].filter(...).branch(...)[1].map(...)
```

### 2. State Management
```python
# Use changelog topics for recovery
table = app.Table('user_state', changelog_topic='state-changelog')
```

### 3. Error Handling
```python
try:
    process_event(event)
except Exception as e:
    logger.error(f"Processing failed: {e}")
    # Send to DLQ
    await dlq_topic.send(value=event)
```

### 4. Testing
```python
# Use test fixtures
from faust import EventStream

async def test_processing():
    app = create_app()
    async with app.test_context() as context:
        event = ClickEvent(user_id='test', page='/home')
        await process_clicks.send(event)
```

## Key Takeaways

1. ✅ Kafka Streams enables **real-time stream processing**
2. ✅ **Stateless operations** don't require state storage
3. ✅ **Stateful operations** use local state stores with changelog
4. ✅ **Windowing** groups events by time boundaries
5. ✅ **KStream** represents event streams, **KTable** represents state
6. ✅ **Exactly-once** semantics prevent duplicate processing
7. ✅ **Fault tolerance** through state replication
8. ✅ **Horizontal scaling** by adding application instances

## Next Steps

After completing this tutorial:
1. Build a real-time analytics dashboard
2. Implement complex event processing (CEP)
3. Explore ksqlDB for SQL-based streaming
4. Deploy streams app on Kubernetes
5. Study exactly-once semantics in depth
6. Implement custom state stores
7. Learn about interactive queries

## Additional Resources

- [Kafka Streams Documentation](https://kafka.apache.org/documentation/streams/)
- [Faust Documentation](https://faust.readthedocs.io/)
- [ksqlDB](https://ksqldb.io/)
- [Kafka Streams Examples](https://github.com/confluentinc/kafka-streams-examples)

---

**Congratulations!** You can now build real-time stream processing applications with Kafka Streams!
