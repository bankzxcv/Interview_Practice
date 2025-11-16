# Kafka Tutorial 05: Kafka Streams

## Overview
Stream processing with Kafka Streams API - filtering, mapping, aggregation.

## Use Cases
- Real-time ETL
- Stream transformations
- Aggregations and windowing
- Join streams

## Quick Start (Java)
```bash
docker-compose up -d
cd stream-app
./gradlew build
./gradlew run
```

## Python Alternative (Faust)
```bash
pip install faust-streaming
python faust_app.py worker
```

## Key Operations
- map/filter - Transform/filter events
- groupBy - Group by key
- aggregate - Count, sum, etc.
- join - Combine streams
- windowing - Time-based grouping

Next: Tutorial 06 - Kafka Connect
