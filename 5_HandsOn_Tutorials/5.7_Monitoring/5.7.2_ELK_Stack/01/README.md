# Tutorial 01: Elasticsearch Setup - Installation and First Index

## Learning Objectives
- Install and configure Elasticsearch
- Understand Elasticsearch architecture
- Create and manage indices
- Perform basic CRUD operations
- Query data with Query DSL

## Architecture

```
┌──────────────┐
│ Elasticsearch│  (Search & Analytics Engine)
│   Cluster    │
└──────────────┘
       │
       ├─→ Node 1 (Master eligible, Data)
       ├─→ Node 2 (Data)
       └─→ Node 3 (Data)
```

## Step 1: Single Node Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - elk

volumes:
  elasticsearch-data:

networks:
  elk:
    driver: bridge
```

## Step 2: Start Elasticsearch

```bash
# Start Elasticsearch
docker-compose up -d

# Check cluster health
curl http://localhost:9200/_cluster/health?pretty

# Get cluster info
curl http://localhost:9200/

# Expected output:
# {
#   "name" : "elasticsearch",
#   "cluster_name" : "docker-cluster",
#   "version" : {
#     "number" : "8.11.0"
#   }
# }
```

## Step 3: Create Your First Index

```bash
# Create index with explicit mappings
curl -X PUT "http://localhost:9200/logs" -H 'Content-Type: application/json' -d'
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "properties": {
      "timestamp": {
        "type": "date"
      },
      "level": {
        "type": "keyword"
      },
      "message": {
        "type": "text"
      },
      "service": {
        "type": "keyword"
      },
      "user_id": {
        "type": "keyword"
      },
      "duration_ms": {
        "type": "integer"
      },
      "status_code": {
        "type": "integer"
      }
    }
  }
}
'

# Check index exists
curl http://localhost:9200/_cat/indices?v

# Get index mapping
curl http://localhost:9200/logs/_mapping?pretty
```

## Step 4: Index Documents

```bash
# Index single document
curl -X POST "http://localhost:9200/logs/_doc" -H 'Content-Type: application/json' -d'
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "message": "User login successful",
  "service": "auth-service",
  "user_id": "user123",
  "duration_ms": 45,
  "status_code": 200
}
'

# Index with custom ID
curl -X PUT "http://localhost:9200/logs/_doc/1" -H 'Content-Type: application/json' -d'
{
  "timestamp": "2024-01-15T10:31:00Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "service": "api-service",
  "duration_ms": 5000,
  "status_code": 500
}
'

# Bulk index multiple documents
curl -X POST "http://localhost:9200/logs/_bulk" -H 'Content-Type: application/json' -d'
{"index":{}}
{"timestamp":"2024-01-15T10:32:00Z","level":"WARN","message":"High memory usage","service":"worker","duration_ms":100,"status_code":200}
{"index":{}}
{"timestamp":"2024-01-15T10:33:00Z","level":"INFO","message":"Job completed","service":"worker","duration_ms":2500,"status_code":200}
{"index":{}}
{"timestamp":"2024-01-15T10:34:00Z","level":"ERROR","message":"API timeout","service":"api-service","duration_ms":30000,"status_code":504}
'
```

## Step 5: Retrieve Documents

```bash
# Get document by ID
curl http://localhost:9200/logs/_doc/1?pretty

# Get all documents
curl "http://localhost:9200/logs/_search?pretty"

# Get specific fields
curl "http://localhost:9200/logs/_search?pretty&_source=level,message,service"
```

## Step 6: Update and Delete

```bash
# Update document
curl -X POST "http://localhost:9200/logs/_update/1" -H 'Content-Type: application/json' -d'
{
  "doc": {
    "level": "CRITICAL"
  }
}
'

# Delete document
curl -X DELETE "http://localhost:9200/logs/_doc/1"

# Delete by query
curl -X POST "http://localhost:9200/logs/_delete_by_query" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "level": "ERROR"
    }
  }
}
'
```

## Step 7: Basic Queries

### Match Query

```bash
curl -X GET "http://localhost:9200/logs/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "message": "failed"
    }
  }
}
'
```

### Term Query (exact match)

```bash
curl -X GET "http://localhost:9200/logs/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "term": {
      "level": "ERROR"
    }
  }
}
'
```

### Range Query

```bash
curl -X GET "http://localhost:9200/logs/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "range": {
      "duration_ms": {
        "gte": 1000,
        "lte": 10000
      }
    }
  }
}
'
```

### Bool Query (combining conditions)

```bash
curl -X GET "http://localhost:9200/logs/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"term": {"level": "ERROR"}}
      ],
      "filter": [
        {"range": {"timestamp": {"gte": "2024-01-15T00:00:00Z"}}}
      ],
      "must_not": [
        {"term": {"service": "test-service"}}
      ]
    }
  }
}
'
```

## Step 8: Aggregations

```bash
# Count by log level
curl -X GET "http://localhost:9200/logs/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "levels": {
      "terms": {
        "field": "level"
      }
    }
  }
}
'

# Average duration by service
curl -X GET "http://localhost:9200/logs/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "by_service": {
      "terms": {
        "field": "service"
      },
      "aggs": {
        "avg_duration": {
          "avg": {
            "field": "duration_ms"
          }
        }
      }
    }
  }
}
'

# Time-based histogram
curl -X GET "http://localhost:9200/logs/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "logs_over_time": {
      "date_histogram": {
        "field": "timestamp",
        "fixed_interval": "1h"
      }
    }
  }
}
'
```

## Step 9: Index Templates

```bash
# Create index template
curl -X PUT "http://localhost:9200/_index_template/logs_template" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0
    },
    "mappings": {
      "properties": {
        "timestamp": {"type": "date"},
        "level": {"type": "keyword"},
        "message": {"type": "text"},
        "service": {"type": "keyword"}
      }
    }
  }
}
'

# Create index using template
curl -X PUT "http://localhost:9200/logs-2024-01-15"
```

## Step 10: Monitor Cluster

```bash
# Cluster health
curl http://localhost:9200/_cluster/health?pretty

# Node stats
curl http://localhost:9200/_nodes/stats?pretty

# Index stats
curl http://localhost:9200/logs/_stats?pretty

# Cat APIs (human-readable)
curl http://localhost:9200/_cat/indices?v
curl http://localhost:9200/_cat/nodes?v
curl http://localhost:9200/_cat/health?v
curl http://localhost:9200/_cat/shards?v
```

## Step 11: Python Client Example

```python
# app.py
from elasticsearch import Elasticsearch
from datetime import datetime
import json

# Connect to Elasticsearch
es = Elasticsearch(['http://localhost:9200'])

# Create index
index_name = 'logs'

# Index document
doc = {
    'timestamp': datetime.now().isoformat(),
    'level': 'INFO',
    'message': 'Application started',
    'service': 'python-app',
    'duration_ms': 10,
    'status_code': 200
}

response = es.index(index=index_name, document=doc)
print(f"Indexed document: {response['_id']}")

# Search
search_body = {
    'query': {
        'match': {
            'level': 'INFO'
        }
    }
}

results = es.search(index=index_name, body=search_body)
print(f"\nFound {results['hits']['total']['value']} documents:")
for hit in results['hits']['hits']:
    print(json.dumps(hit['_source'], indent=2))

# Aggregation
agg_body = {
    'size': 0,
    'aggs': {
        'levels': {
            'terms': {
                'field': 'level'
            }
        }
    }
}

results = es.search(index=index_name, body=agg_body)
print("\nLog level distribution:")
for bucket in results['aggregations']['levels']['buckets']:
    print(f"{bucket['key']}: {bucket['doc_count']}")
```

## Exercises

1. **Create E-commerce Index**: Design mapping for products (name, price, category, stock)
2. **Bulk Import**: Import 1000+ documents using bulk API
3. **Complex Query**: Combine multiple bool queries
4. **Aggregation**: Calculate revenue by category by day
5. **Index Template**: Create template for daily indices

## Common Data Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | Full-text search | "This is a message" |
| `keyword` | Exact match, aggregations | "ERROR", "user123" |
| `integer` | Whole numbers | 42, 1000 |
| `long` | Large whole numbers | 9223372036854775807 |
| `float` | Decimal numbers | 3.14 |
| `date` | Timestamps | "2024-01-15T10:30:00Z" |
| `boolean` | True/False | true, false |
| `ip` | IP addresses | "192.168.1.1" |
| `geo_point` | Latitude/Longitude | {"lat": 41.12, "lon": -71.34} |
| `object` | Nested JSON | {"user": {"name": "John"}} |

## Key Takeaways

- ✅ Elasticsearch stores data in indices
- ✅ Documents are JSON objects
- ✅ Mappings define field types
- ✅ Query DSL is powerful and flexible
- ✅ Aggregations enable analytics
- ✅ Bulk API for high-throughput indexing

## Next Steps

Continue to **Tutorial 02: Logstash** to learn about:
- Logstash pipeline architecture
- Input, filter, and output plugins
- Grok patterns for log parsing
- Data enrichment and transformation

## Additional Resources

- [Elasticsearch Reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)
- [Mapping](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html)
- [Aggregations](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html)
