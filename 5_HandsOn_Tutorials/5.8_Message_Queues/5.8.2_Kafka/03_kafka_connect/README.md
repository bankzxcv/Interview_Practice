# Tutorial 03: Kafka Connect

## Objectives

By the end of this tutorial, you will:
- Understand Kafka Connect framework and architecture
- Set up Kafka Connect in standalone and distributed modes
- Configure source connectors (File, JDBC, Debezium)
- Configure sink connectors (Elasticsearch, File, JDBC)
- Monitor and manage connectors via REST API
- Handle connector errors and dead letter queues
- Implement Single Message Transforms (SMTs)
- Build data pipelines without writing code

## Prerequisites

- Completed Tutorial 01 and 02
- Docker and Docker Compose running
- Python 3.8+ installed
- Basic understanding of databases and APIs
- At least 4GB RAM available

## What is Kafka Connect?

Kafka Connect is a framework for streaming data between Apache Kafka and other systems. It provides:

- **Scalability**: Distributed, fault-tolerant execution
- **Reliability**: Automatic offset management and retries
- **Reusability**: Library of pre-built connectors
- **Simplicity**: Configuration-based (no code required)
- **Integration**: Connect to databases, file systems, cloud storage, etc.

### Connector Types

**Source Connectors**: Import data INTO Kafka
- Database → Kafka (CDC with Debezium)
- File System → Kafka
- REST API → Kafka
- Cloud Storage → Kafka

**Sink Connectors**: Export data FROM Kafka
- Kafka → Database
- Kafka → Elasticsearch
- Kafka → S3
- Kafka → HDFS

### Standalone vs Distributed Mode

| Feature | Standalone | Distributed |
|---------|-----------|-------------|
| **Use Case** | Development, testing | Production |
| **Scalability** | Single process | Multiple workers |
| **Fault Tolerance** | No | Yes |
| **Configuration** | Property files | REST API |
| **Offset Storage** | Local file | Kafka topics |

## Step-by-Step Instructions

### Step 1: Create Docker Compose with Kafka Connect

Create `docker-compose-connect.yml`:

```yaml
version: '3.8'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    networks:
      - kafka-network

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    networks:
      - kafka-network

  kafka-connect:
    image: confluentinc/cp-kafka-connect:7.5.0
    container_name: kafka-connect
    depends_on:
      - kafka
    ports:
      - "8083:8083"
    environment:
      CONNECT_BOOTSTRAP_SERVERS: kafka:29092
      CONNECT_REST_PORT: 8083
      CONNECT_REST_ADVERTISED_HOST_NAME: kafka-connect
      CONNECT_GROUP_ID: connect-cluster
      CONNECT_CONFIG_STORAGE_TOPIC: connect-configs
      CONNECT_CONFIG_STORAGE_REPLICATION_FACTOR: 1
      CONNECT_OFFSET_STORAGE_TOPIC: connect-offsets
      CONNECT_OFFSET_STORAGE_REPLICATION_FACTOR: 1
      CONNECT_STATUS_STORAGE_TOPIC: connect-status
      CONNECT_STATUS_STORAGE_REPLICATION_FACTOR: 1
      CONNECT_KEY_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      CONNECT_VALUE_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      CONNECT_KEY_CONVERTER_SCHEMAS_ENABLE: "false"
      CONNECT_VALUE_CONVERTER_SCHEMAS_ENABLE: "false"
      CONNECT_PLUGIN_PATH: /usr/share/java,/usr/share/confluent-hub-components
    volumes:
      - ./data:/data
      - ./connectors:/usr/share/confluent-hub-components
    networks:
      - kafka-network

  postgres:
    image: postgres:15
    container_name: postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: testdb
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - kafka-network

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    networks:
      - kafka-network

volumes:
  postgres-data:

networks:
  kafka-network:
    driver: bridge
```

### Step 2: Start Kafka Connect Cluster

```bash
# Create data directory
mkdir -p data connectors

# Start all services
docker-compose -f docker-compose-connect.yml up -d

# Check Kafka Connect is running
curl http://localhost:8083/

# List connector plugins
curl http://localhost:8083/connector-plugins | jq
```

### Step 3: File Source Connector

Create `file-source-connector.json`:

```json
{
  "name": "file-source-connector",
  "config": {
    "connector.class": "org.apache.kafka.connect.file.FileStreamSourceConnector",
    "tasks.max": "1",
    "file": "/data/input.txt",
    "topic": "file-input-topic",
    "key.converter": "org.apache.kafka.connect.storage.StringConverter",
    "value.converter": "org.apache.kafka.connect.storage.StringConverter"
  }
}
```

**Deploy the connector:**

```bash
# Create sample input file
echo "Line 1: First message" > data/input.txt
echo "Line 2: Second message" >> data/input.txt
echo "Line 3: Third message" >> data/input.txt

# Deploy connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @file-source-connector.json

# Check connector status
curl http://localhost:8083/connectors/file-source-connector/status | jq

# Consume messages
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic file-input-topic \
  --from-beginning
```

### Step 4: File Sink Connector

Create `file-sink-connector.json`:

```json
{
  "name": "file-sink-connector",
  "config": {
    "connector.class": "org.apache.kafka.connect.file.FileStreamSinkConnector",
    "tasks.max": "1",
    "file": "/data/output.txt",
    "topics": "file-input-topic",
    "key.converter": "org.apache.kafka.connect.storage.StringConverter",
    "value.converter": "org.apache.kafka.connect.storage.StringConverter"
  }
}
```

**Deploy the connector:**

```bash
# Deploy connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @file-sink-connector.json

# Check output file
cat data/output.txt
```

### Step 5: JDBC Source Connector

First, install the JDBC connector plugin:

```bash
# Download JDBC connector
docker exec -it kafka-connect confluent-hub install \
  confluentinc/kafka-connect-jdbc:latest \
  --no-prompt

# Restart Kafka Connect
docker-compose -f docker-compose-connect.yml restart kafka-connect
```

Create sample database table:

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U postgres -d testdb

# Create table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# Insert sample data
INSERT INTO users (name, email) VALUES
    ('Alice', 'alice@example.com'),
    ('Bob', 'bob@example.com'),
    ('Charlie', 'charlie@example.com');

# Exit psql
\q
```

Create `jdbc-source-connector.json`:

```json
{
  "name": "jdbc-source-connector",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
    "tasks.max": "1",
    "connection.url": "jdbc:postgresql://postgres:5432/testdb",
    "connection.user": "postgres",
    "connection.password": "postgres",
    "table.whitelist": "users",
    "mode": "incrementing",
    "incrementing.column.name": "id",
    "topic.prefix": "postgres-",
    "poll.interval.ms": "5000"
  }
}
```

**Deploy JDBC source connector:**

```bash
# Deploy connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @jdbc-source-connector.json

# Check status
curl http://localhost:8083/connectors/jdbc-source-connector/status | jq

# Consume messages
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic postgres-users \
  --from-beginning
```

### Step 6: Elasticsearch Sink Connector

Install Elasticsearch connector:

```bash
# Install connector
docker exec -it kafka-connect confluent-hub install \
  confluentinc/kafka-connect-elasticsearch:latest \
  --no-prompt

# Restart
docker-compose -f docker-compose-connect.yml restart kafka-connect
```

Create `elasticsearch-sink-connector.json`:

```json
{
  "name": "elasticsearch-sink-connector",
  "config": {
    "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
    "tasks.max": "1",
    "topics": "postgres-users",
    "connection.url": "http://elasticsearch:9200",
    "type.name": "_doc",
    "key.ignore": "true",
    "schema.ignore": "true",
    "behavior.on.null.values": "delete"
  }
}
```

**Deploy Elasticsearch sink:**

```bash
# Deploy connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @elasticsearch-sink-connector.json

# Verify data in Elasticsearch
curl http://localhost:9200/postgres-users/_search?pretty
```

### Step 7: Single Message Transforms (SMTs)

Create connector with transformations:

```json
{
  "name": "jdbc-source-with-transforms",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
    "tasks.max": "1",
    "connection.url": "jdbc:postgresql://postgres:5432/testdb",
    "connection.user": "postgres",
    "connection.password": "postgres",
    "table.whitelist": "users",
    "mode": "incrementing",
    "incrementing.column.name": "id",
    "topic.prefix": "transformed-",
    "transforms": "addPrefix,maskEmail",
    "transforms.addPrefix.type": "org.apache.kafka.connect.transforms.InsertField$Value",
    "transforms.addPrefix.static.field": "source",
    "transforms.addPrefix.static.value": "postgres-db",
    "transforms.maskEmail.type": "org.apache.kafka.connect.transforms.MaskField$Value",
    "transforms.maskEmail.fields": "email"
  }
}
```

### Step 8: Connector Management via REST API

Create `connector_manager.py`:

```python
#!/usr/bin/env python3
import requests
import json
import time

CONNECT_URL = "http://localhost:8083"

def list_connectors():
    """List all deployed connectors"""
    response = requests.get(f"{CONNECT_URL}/connectors")
    connectors = response.json()
    print(f"\n📋 Active Connectors ({len(connectors)}):")
    for connector in connectors:
        print(f"  - {connector}")
    return connectors

def get_connector_status(connector_name):
    """Get connector status"""
    response = requests.get(f"{CONNECT_URL}/connectors/{connector_name}/status")
    status = response.json()

    print(f"\n📊 Connector: {connector_name}")
    print(f"  State: {status['connector']['state']}")
    print(f"  Worker: {status['connector']['worker_id']}")

    print(f"\n  Tasks:")
    for task in status['tasks']:
        print(f"    Task {task['id']}: {task['state']}")

    return status

def pause_connector(connector_name):
    """Pause a connector"""
    response = requests.put(f"{CONNECT_URL}/connectors/{connector_name}/pause")
    print(f"✓ Paused connector: {connector_name}")

def resume_connector(connector_name):
    """Resume a connector"""
    response = requests.put(f"{CONNECT_URL}/connectors/{connector_name}/resume")
    print(f"✓ Resumed connector: {connector_name}")

def restart_connector(connector_name):
    """Restart a connector"""
    response = requests.post(f"{CONNECT_URL}/connectors/{connector_name}/restart")
    print(f"✓ Restarted connector: {connector_name}")

def delete_connector(connector_name):
    """Delete a connector"""
    response = requests.delete(f"{CONNECT_URL}/connectors/{connector_name}")
    print(f"✓ Deleted connector: {connector_name}")

def get_connector_config(connector_name):
    """Get connector configuration"""
    response = requests.get(f"{CONNECT_URL}/connectors/{connector_name}/config")
    config = response.json()

    print(f"\n⚙️  Configuration for {connector_name}:")
    for key, value in config.items():
        print(f"  {key}: {value}")

    return config

def update_connector_config(connector_name, new_config):
    """Update connector configuration"""
    response = requests.put(
        f"{CONNECT_URL}/connectors/{connector_name}/config",
        headers={"Content-Type": "application/json"},
        data=json.dumps(new_config)
    )
    print(f"✓ Updated configuration for: {connector_name}")

def deploy_connector(config_file):
    """Deploy a new connector from JSON file"""
    with open(config_file, 'r') as f:
        config = json.load(f)

    response = requests.post(
        f"{CONNECT_URL}/connectors",
        headers={"Content-Type": "application/json"},
        data=json.dumps(config)
    )

    if response.status_code == 201:
        print(f"✓ Deployed connector: {config['name']}")
    else:
        print(f"✗ Failed to deploy: {response.text}")

def monitor_connector_metrics(connector_name, interval=5):
    """Monitor connector metrics"""
    print(f"\n📈 Monitoring {connector_name} (Ctrl+C to stop)...\n")

    try:
        while True:
            status = get_connector_status(connector_name)
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n✓ Stopped monitoring")

if __name__ == '__main__':
    # Demo usage
    connectors = list_connectors()

    if connectors:
        connector_name = connectors[0]
        get_connector_status(connector_name)
        get_connector_config(connector_name)
```

### Step 9: Error Handling and Dead Letter Queue

Create connector with DLQ configuration:

```json
{
  "name": "jdbc-source-with-dlq",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
    "tasks.max": "1",
    "connection.url": "jdbc:postgresql://postgres:5432/testdb",
    "connection.user": "postgres",
    "connection.password": "postgres",
    "table.whitelist": "users",
    "mode": "incrementing",
    "incrementing.column.name": "id",
    "topic.prefix": "postgres-",
    "errors.tolerance": "all",
    "errors.log.enable": "true",
    "errors.log.include.messages": "true",
    "errors.deadletterqueue.topic.name": "dlq-topic",
    "errors.deadletterqueue.topic.replication.factor": "1",
    "errors.deadletterqueue.context.headers.enable": "true"
  }
}
```

## Connector Configuration Best Practices

### 1. Connection Pooling
```json
{
  "connection.url": "jdbc:postgresql://host:5432/db",
  "connection.attempts": "3",
  "connection.backoff.ms": "10000"
}
```

### 2. Task Scaling
```json
{
  "tasks.max": "3",
  "max.poll.interval.ms": "300000",
  "max.poll.records": "500"
}
```

### 3. Error Handling
```json
{
  "errors.tolerance": "all",
  "errors.retry.timeout": "300000",
  "errors.retry.delay.max.ms": "60000",
  "errors.log.enable": "true"
}
```

### 4. Monitoring
```json
{
  "metrics.recording.level": "INFO",
  "metrics.jmx.enable": "true"
}
```

## Common Connector Configurations

### Debezium MySQL CDC

```json
{
  "name": "mysql-cdc-connector",
  "config": {
    "connector.class": "io.debezium.connector.mysql.MySqlConnector",
    "database.hostname": "mysql",
    "database.port": "3306",
    "database.user": "debezium",
    "database.password": "dbz",
    "database.server.id": "184054",
    "database.server.name": "mysql-server",
    "database.include.list": "inventory",
    "table.include.list": "inventory.customers,inventory.orders",
    "database.history.kafka.bootstrap.servers": "kafka:29092",
    "database.history.kafka.topic": "schema-changes.inventory"
  }
}
```

### S3 Sink Connector

```json
{
  "name": "s3-sink-connector",
  "config": {
    "connector.class": "io.confluent.connect.s3.S3SinkConnector",
    "tasks.max": "1",
    "topics": "user-events",
    "s3.region": "us-west-2",
    "s3.bucket.name": "my-kafka-bucket",
    "s3.part.size": "5242880",
    "flush.size": "1000",
    "storage.class": "io.confluent.connect.s3.storage.S3Storage",
    "format.class": "io.confluent.connect.s3.format.json.JsonFormat",
    "partitioner.class": "io.confluent.connect.storage.partitioner.TimeBasedPartitioner",
    "path.format": "YYYY/MM/dd",
    "partition.duration.ms": "3600000",
    "timezone": "UTC"
  }
}
```

## Verification Steps

### 1. Check Kafka Connect Health
```bash
curl http://localhost:8083/ | jq
```

### 2. List All Connectors
```bash
curl http://localhost:8083/connectors | jq
```

### 3. Monitor Connector Tasks
```bash
curl http://localhost:8083/connectors/file-source-connector/tasks | jq
```

### 4. View Connector Logs
```bash
docker-compose -f docker-compose-connect.yml logs -f kafka-connect
```

## Troubleshooting

### Issue: Connector Failed to Start

**Check connector status:**
```bash
curl http://localhost:8083/connectors/my-connector/status | jq
```

**Common causes:**
- Invalid configuration
- Missing connector plugin
- Connection issues to external system

### Issue: Data Not Flowing

**Check topics:**
```bash
docker exec -it kafka kafka-topics --bootstrap-server localhost:9092 --list
```

**Check connector offset:**
```bash
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic connect-offsets \
  --from-beginning
```

### Issue: Task Failures

**Restart task:**
```bash
curl -X POST http://localhost:8083/connectors/my-connector/tasks/0/restart
```

## Key Takeaways

1. ✅ Kafka Connect enables **codeless data integration**
2. ✅ **Source connectors** import data into Kafka
3. ✅ **Sink connectors** export data from Kafka
4. ✅ **Distributed mode** provides fault tolerance and scalability
5. ✅ **REST API** manages connector lifecycle
6. ✅ **SMTs** transform data without custom code
7. ✅ **Dead letter queues** handle errors gracefully
8. ✅ **Hundreds of connectors** available via Confluent Hub

## Next Steps

After completing this tutorial:
1. Explore Confluent Hub for more connectors
2. Implement custom connector for your use case
3. Set up connector monitoring with Prometheus
4. Build end-to-end data pipeline
5. Move on to **Tutorial 04: Kafka Streams**

## Additional Resources

- [Kafka Connect Documentation](https://kafka.apache.org/documentation/#connect)
- [Confluent Hub](https://www.confluent.io/hub/)
- [Debezium CDC](https://debezium.io/)
- [Connector Development Guide](https://docs.confluent.io/platform/current/connect/devguide.html)

---

**Congratulations!** You can now build data pipelines with Kafka Connect!
