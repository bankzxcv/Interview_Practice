# Tutorial 04: Storage Backends - Cassandra, Elasticsearch, Badger

## Topics
- Storage options comparison
- Cassandra setup for production
- Elasticsearch integration
- Badger for development
- Memory storage

## Elasticsearch Backend

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m

  jaeger-collector:
    image: jaegertracing/jaeger-collector
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
      - ES_NUM_SHARDS=5
      - ES_NUM_REPLICAS=1

  jaeger-query:
    image: jaegertracing/jaeger-query
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
    ports:
      - "16686:16686"
```

Complete setup for all storage backends with performance tuning.
