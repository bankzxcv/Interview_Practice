# Design Log Aggregation System (ELK Stack)

## Problem Statement
Design a centralized log aggregation and analysis system like ELK (Elasticsearch, Logstash, Kibana) that collects logs from thousands of servers, indexes them, and provides search/visualization.

## Architecture
```
Servers → Log Shipper (Filebeat) → Message Queue (Kafka) → Logstash (Parse) → Elasticsearch (Index) → Kibana (Visualize)
```

## Key Designs
```python
# Log ingestion pipeline
def process_log(log_line):
    # 1. Parse (extract timestamp, level, message)
    parsed = parse_log(log_line)

    # 2. Enrich (add metadata)
    parsed['hostname'] = get_hostname()
    parsed['environment'] = 'production'

    # 3. Index in Elasticsearch
    es.index(index='logs-2024-01', document=parsed)

# Search logs
GET /logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        {"match": {"level": "ERROR"}},
        {"range": {"@timestamp": {"gte": "now-1h"}}}
      ]
    }
  }
}
```

## Scaling
- Kafka for buffering (handle bursts)
- Elasticsearch sharding by date
- Hot-warm-cold storage tiers
- Retention policy (delete after 30 days)

## Interview Talking Points
"Log aggregation needs high throughput (1M logs/sec), search capability, and retention. Use Kafka for buffering, Elasticsearch for indexing with date-based shards. Hot-warm-cold tiers for cost (recent logs on SSD, old on HDD). Parse logs with Logstash/Fluentd. Visualize with Kibana dashboards."
