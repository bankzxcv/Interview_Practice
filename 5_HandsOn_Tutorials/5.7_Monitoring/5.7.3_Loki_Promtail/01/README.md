# Tutorial 01: Loki Setup - Lightweight Log Aggregation

## Learning Objectives
- Install and configure Loki
- Understand Loki architecture
- Set up Promtail for log collection
- Query logs with LogQL
- Compare Loki vs Elasticsearch

## What is Loki?

Loki is a horizontally-scalable, highly-available log aggregation system inspired by Prometheus. Unlike other logging systems, Loki indexes only metadata (labels) instead of full-text, making it cost-effective.

```
Key Principles:
- Index only labels, not log content
- Use the same labels as Prometheus
- Store logs in object storage (S3, GCS)
- Designed for Grafana integration
```

## Architecture

```
Application → Promtail → Loki → Grafana
                ↓
           (Labels)     (Chunks)
```

## Step 1: Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  loki:
    image: grafana/loki:2.9.3
    container_name: loki
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - ./loki/config.yaml:/etc/loki/local-config.yaml
      - loki-data:/loki
    networks:
      - monitoring

  promtail:
    image: grafana/promtail:2.9.3
    container_name: promtail
    volumes:
      - ./promtail/config.yaml:/etc/promtail/config.yaml
      - /var/log:/var/log:ro
      - ./logs:/logs:ro
    command: -config.file=/etc/promtail/config.yaml
    networks:
      - monitoring
    depends_on:
      - loki

  grafana:
    image: grafana/grafana:10.2.2
    container_name: grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    networks:
      - monitoring
    depends_on:
      - loki

volumes:
  loki-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

## Step 2: Loki Configuration

```yaml
# loki/config.yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093

# Retention (30 days)
limits_config:
  retention_period: 720h
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  max_query_length: 721h
  max_query_lookback: 0

chunk_store_config:
  max_look_back_period: 720h

table_manager:
  retention_deletes_enabled: true
  retention_period: 720h

compactor:
  working_directory: /loki/compactor
  shared_store: filesystem
  compaction_interval: 10m
  retention_enabled: true
  retention_delete_delay: 2h
  retention_delete_worker_count: 150
```

## Step 3: Promtail Configuration

```yaml
# promtail/config.yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # System logs
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: varlogs
          __path__: /var/log/*log

  # Application logs
  - job_name: application
    static_configs:
      - targets:
          - localhost
        labels:
          job: app
          environment: development
          __path__: /logs/*.log

  # JSON logs
  - job_name: json-logs
    pipeline_stages:
      - json:
          expressions:
            timestamp: timestamp
            level: level
            message: message
            service: service
      - labels:
          level:
          service:
      - timestamp:
          source: timestamp
          format: RFC3339
    static_configs:
      - targets:
          - localhost
        labels:
          job: json-app
          __path__: /logs/*.json

  # Multi-line logs (stack traces)
  - job_name: multiline
    pipeline_stages:
      - multiline:
          firstline: '^\d{4}-\d{2}-\d{2}'
          max_wait_time: 3s
      - regex:
          expression: '^(?P<timestamp>\S+) (?P<level>\S+) (?P<message>.*)'
      - labels:
          level:
      - timestamp:
          source: timestamp
          format: '2006-01-02 15:04:05'
    static_configs:
      - targets:
          - localhost
        labels:
          job: app-multiline
          __path__: /logs/app.log
```

## Step 4: LogQL Basics

### Simple Queries

```logql
# All logs from a job
{job="app"}

# Logs from specific service
{service="api"}

# Multiple labels
{job="app", environment="production"}

# Regex matching
{service=~"api|web"}

# Not equal
{service!="test"}
```

### Log Line Filtering

```logql
# Contains text
{job="app"} |= "error"

# Doesn't contain
{job="app"} != "debug"

# Regex match
{job="app"} |~ "error|failed"

# Regex doesn't match
{job="app"} !~ "debug|trace"

# Case-insensitive
{job="app"} |~ "(?i)error"
```

### Parsing and Filtering

```logql
# JSON parsing
{job="app"} | json | level="ERROR"

# Extract fields
{job="app"} | json | status_code >= 500

# Logfmt parsing
{job="app"} | logfmt | level="error"

# Regex extraction
{job="app"} | regexp "(?P<method>\\w+) (?P<path>/\\S+)"
```

## Step 5: LogQL Aggregations

```logql
# Count logs
count_over_time({job="app"}[5m])

# Rate of logs per second
rate({job="app"}[5m])

# Bytes rate
bytes_rate({job="app"}[5m])

# Bytes over time
bytes_over_time({job="app"}[5m])

# Sum by label
sum by (service) (rate({job="app"}[5m]))

# Average
avg by (service) (count_over_time({job="app"}[5m]))

# Top N services
topk(5, sum by (service) (rate({job="app"}[5m])))
```

## Step 6: Advanced Queries

### Error Rate

```logql
# Error rate percentage
sum(rate({job="app"} |= "error" [5m]))
/
sum(rate({job="app"} [5m]))
* 100
```

### 95th Percentile Response Time

```logql
# Extract duration and calculate p95
quantile_over_time(0.95,
  {job="app"}
  | json
  | unwrap duration_ms [5m]
) by (service)
```

### Pattern Extraction

```logql
# Extract HTTP status codes and count
{job="nginx"}
| regexp `(?P<status>\d{3})`
| status >= 400
| count_over_time({job="nginx"}[5m])
```

## Step 7: Grafana Datasource

```yaml
# grafana/provisioning/datasources/loki.yaml
apiVersion: 1

datasources:
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    jsonData:
      maxLines: 1000
      derivedFields:
        - datasourceUid: tempo
          matcherRegex: "traceID=(\\w+)"
          name: TraceID
          url: "$${__value.raw}"
```

## Step 8: Sample Application

```python
# app.py
import json
import logging
import random
import time
from datetime import datetime

# Configure JSON logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.FileHandler('/logs/app.json')
    ]
)

def log_event(level, message, **kwargs):
    log_data = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'level': level,
        'service': 'api',
        'message': message,
        **kwargs
    }
    logging.info(json.dumps(log_data))

while True:
    # Simulate requests
    status_code = random.choice([200, 200, 200, 400, 500])
    duration_ms = random.randint(10, 5000)

    log_event(
        'INFO' if status_code == 200 else 'ERROR',
        f'Request completed',
        status_code=status_code,
        duration_ms=duration_ms,
        endpoint='/api/users',
        method='GET'
    )

    time.sleep(1)
```

## Step 9: Dashboard Example

```json
{
  "panels": [
    {
      "title": "Log Volume",
      "targets": [
        {
          "expr": "sum by (level) (count_over_time({job=\"app\"}[1m]))"
        }
      ],
      "type": "graph"
    },
    {
      "title": "Error Logs",
      "targets": [
        {
          "expr": "{job=\"app\", level=\"ERROR\"}"
        }
      ],
      "type": "logs"
    },
    {
      "title": "Error Rate",
      "targets": [
        {
          "expr": "sum(rate({job=\"app\", level=\"ERROR\"}[5m])) / sum(rate({job=\"app\"}[5m])) * 100"
        }
      ],
      "type": "stat"
    }
  ]
}
```

## Step 10: Comparison: Loki vs Elasticsearch

| Feature | Loki | Elasticsearch |
|---------|------|---------------|
| **Indexing** | Labels only | Full-text |
| **Cost** | Very low | Higher |
| **Query Speed** | Fast for labeled data | Fast for full-text |
| **Storage** | Compressed chunks | Inverted index |
| **Best For** | Metrics-like logs | Full-text search |
| **Label Cardinality** | Limited | Unlimited |
| **Retention** | Long-term friendly | More expensive |
| **Integration** | Grafana native | Kibana |

## Exercises

1. **Setup Stack**: Deploy Loki, Promtail, and Grafana
2. **Collect Logs**: Configure Promtail for application logs
3. **LogQL Queries**: Write queries to find errors
4. **Dashboard**: Create log volume and error rate dashboard
5. **Labels**: Design efficient label strategy

## Key Takeaways

- ✅ Loki indexes labels, not log content
- ✅ Lower cost than full-text search systems
- ✅ Designed for Grafana integration
- ✅ LogQL similar to PromQL
- ✅ Best for structured, labeled logs
- ✅ Efficient for long-term retention

## Next Steps

Continue to **Tutorial 02: Promtail Advanced** to learn about:
- Pipeline stages
- Label extraction
- Structured metadata
- Service discovery

## Additional Resources

- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [LogQL](https://grafana.com/docs/loki/latest/logql/)
- [Promtail Configuration](https://grafana.com/docs/loki/latest/clients/promtail/configuration/)
- [Best Practices](https://grafana.com/docs/loki/latest/best-practices/)
