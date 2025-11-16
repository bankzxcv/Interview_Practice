# Design Real-Time Analytics Platform

## Problem Statement
Design a real-time analytics platform that processes streaming data (clickstreams, logs, events) and provides dashboards with sub-second latency.

## Architecture
```
Events → Kafka → Stream Processor (Flink/Spark) → Time-Series DB (InfluxDB) → Dashboard (Grafana)
                                ↓
                        OLAP DB (ClickHouse/Druid)
```

## Key Designs
```python
# Stream processing (Apache Flink)
stream = env.add_source(kafka_consumer)

# Window aggregations
result = (stream
    .key_by(lambda event: event['user_id'])
    .window(TumblingWindow.of(Time.minutes(1)))
    .aggregate(
        lambda events: {
            'count': len(events),
            'sum': sum(e['value'] for e in events)
        }
    ))

# Real-time metrics
def update_dashboard():
    # Page views per second
    pv_per_sec = redis.get('pv_count_last_sec')

    # Active users (HyperLogLog for cardinality)
    active_users = redis.pfcount('active_users')

    # Top pages (sorted set)
    top_pages = redis.zrevrange('page_views', 0, 9, withscores=True)
```

## Time-Series Optimization
```sql
-- ClickHouse (columnar storage, high compression)
CREATE TABLE page_views (
    timestamp DateTime,
    user_id UInt64,
    page_path String,
    session_id String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, user_id);

-- Query: Page views in last hour
SELECT page_path, count() as views
FROM page_views
WHERE timestamp >= now() - INTERVAL 1 HOUR
GROUP BY page_path
ORDER BY views DESC
LIMIT 10;
```

## Interview Talking Points
"Real-time analytics needs stream processing for windowed aggregations. Use Kafka for event ingestion, Flink/Spark Streaming for processing (tumbling/sliding windows), and time-series DB (InfluxDB/ClickHouse) for storage. HyperLogLog for unique counts. Pre-aggregate common queries. Dashboard updates via WebSocket. For scale, partition by time + entity_id."
