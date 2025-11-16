# Kafka Tutorial 06: Kafka Connect

## Overview
Integrate Kafka with external systems using Kafka Connect framework.

## Connectors
- **Source**: Pull data into Kafka (DB, files, APIs)
- **Sink**: Push data from Kafka (DB, S3, Elasticsearch)

## Quick Start
```bash
docker-compose up -d

# Create JDBC source connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @jdbc-source.json

# List connectors
curl http://localhost:8083/connectors
```

## Popular Connectors
- JDBC (databases)
- S3
- Elasticsearch
- MongoDB
- HDFS

## Best Practices
- Use distributed mode for production
- Monitor connector health
- Configure error handling
- Use Single Message Transforms (SMT)

Next: Tutorial 07 - Kubernetes deployment
