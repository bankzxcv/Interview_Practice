# Tutorial 03: Kibana - Dashboards and Visualizations

## Learning Objectives
- Install and configure Kibana
- Create visualizations
- Build interactive dashboards
- Use Discover for log exploration
- Set up saved searches and filters

## Complete ELK Stack

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
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - elk

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5000:5000"
      - "9600:9600"
    environment:
      - "LS_JAVA_OPTS=-Xms256m -Xmx256m"
    networks:
      - elk
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - SERVER_NAME=kibana
      - SERVER_HOST=0.0.0.0
    ports:
      - "5601:5601"
    networks:
      - elk
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:

networks:
  elk:
    driver: bridge
```

## Access Kibana

```bash
# Start stack
docker-compose up -d

# Access Kibana
open http://localhost:5601

# Wait for Kibana to be ready (may take 1-2 minutes)
```

## Creating Index Patterns

1. Navigate to **Stack Management → Index Patterns**
2. Click **Create index pattern**
3. Enter pattern: `logs-*`
4. Select time field: `@timestamp`
5. Click **Create index pattern**

## Discover Interface

```
Features:
- Search bar (KQL or Lucene)
- Time picker
- Field list
- Document table
- Histogram
```

### KQL Query Examples

```kql
# Simple match
level: ERROR

# Wildcard
message: *timeout*

# Boolean
level: ERROR and service: api

# Range
status_code >= 400

# Exists
_exists_: user_id

# Complex
(level: ERROR or level: WARN) and service: (api or worker) and @timestamp >= "now-1h"
```

## Visualization Types

### 1. Line Chart - Requests Over Time

```json
{
  "title": "Requests Over Time",
  "visState": {
    "type": "line",
    "aggs": [
      {
        "id": "1",
        "type": "count"
      },
      {
        "id": "2",
        "type": "date_histogram",
        "params": {
          "field": "@timestamp",
          "interval": "auto"
        }
      }
    ]
  }
}
```

### 2. Pie Chart - Log Levels Distribution

```json
{
  "title": "Log Levels",
  "visState": {
    "type": "pie",
    "aggs": [
      {
        "id": "1",
        "type": "count"
      },
      {
        "id": "2",
        "type": "terms",
        "params": {
          "field": "level.keyword",
          "size": 10
        }
      }
    ]
  }
}
```

### 3. Data Table - Top Error Messages

```json
{
  "title": "Top Errors",
  "visState": {
    "type": "table",
    "aggs": [
      {
        "id": "1",
        "type": "count"
      },
      {
        "id": "2",
        "type": "terms",
        "params": {
          "field": "message.keyword",
          "size": 20
        }
      }
    ]
  }
}
```

### 4. Metric - Total Errors

```json
{
  "title": "Error Count",
  "visState": {
    "type": "metric",
    "aggs": [
      {
        "id": "1",
        "type": "count"
      }
    ]
  }
}
```

### 5. Tag Cloud - Services

```json
{
  "title": "Services",
  "visState": {
    "type": "tagcloud",
    "aggs": [
      {
        "id": "1",
        "type": "count"
      },
      {
        "id": "2",
        "type": "terms",
        "params": {
          "field": "service.keyword"
        }
      }
    ]
  }
}
```

### 6. Heatmap - Errors by Hour and Day

```json
{
  "title": "Error Heatmap",
  "visState": {
    "type": "heatmap",
    "aggs": [
      {
        "id": "1",
        "type": "count"
      },
      {
        "id": "2",
        "type": "date_histogram",
        "params": {
          "field": "@timestamp",
          "interval": "1h"
        }
      },
      {
        "id": "3",
        "type": "terms",
        "params": {
          "field": "service.keyword"
        }
      }
    ]
  }
}
```

### 7. TSVB - Multi-metric Time Series

```
- Requests per second
- Error rate
- Average response time
- 95th percentile latency
```

### 8. Lens - Interactive Analysis

Modern drag-and-drop visualization builder.

## Dashboard Creation

### Application Monitoring Dashboard

```yaml
Panels:
  - Request Rate (Line)
  - Error Rate (Line)
  - Status Code Distribution (Pie)
  - Response Time Percentiles (Line)
  - Top Endpoints (Table)
  - Error Messages (Table)
  - Service Health (Metric)
  - Geo Map (if GeoIP data)
```

### System Logs Dashboard

```yaml
Panels:
  - Log Volume (Line)
  - Log Levels (Pie)
  - Top Hosts (Bar)
  - Recent Errors (Table)
  - Error Trend (TSVB)
```

## Saved Searches

```kql
# Critical Errors
level: ERROR and severity: critical

# Slow Requests
duration_ms > 5000

# Failed Logins
message: "login failed" or message: "authentication failed"

# 5xx Errors
status_code >= 500
```

## Filters and Time Ranges

```javascript
# Add filter
{
  "query": {
    "match_phrase": {
      "service": "api"
    }
  }
}

# Time ranges
- Last 15 minutes
- Last 1 hour
- Last 24 hours
- Last 7 days
- Custom: now-1h to now
- Absolute: 2024-01-01 to 2024-01-31
```

## Dashboard Variables

```json
{
  "controls": [
    {
      "id": "environment",
      "type": "list",
      "field": "environment.keyword",
      "label": "Environment"
    },
    {
      "id": "service",
      "type": "list",
      "field": "service.keyword",
      "label": "Service"
    },
    {
      "id": "level",
      "type": "list",
      "field": "level.keyword",
      "label": "Log Level"
    }
  ]
}
```

## Alerts in Kibana

```json
{
  "name": "High Error Rate",
  "schedule": {
    "interval": "1m"
  },
  "conditions": [
    {
      "type": "index_threshold",
      "params": {
        "index": "logs-*",
        "timeField": "@timestamp",
        "aggType": "count",
        "groupBy": "all",
        "threshold": [100],
        "timeWindow": "5m"
      }
    }
  ],
  "actions": [
    {
      "type": "slack",
      "params": {
        "message": "High error rate detected: {{context.value}}"
      }
    }
  ]
}
```

## Canvas - Custom Presentations

```yaml
# Create pixel-perfect dashboards
Features:
  - Custom layouts
  - Markdown elements
  - Images and logos
  - Live data integration
  - Presentation mode
```

## Machine Learning

```yaml
# Anomaly Detection
- Create ML job
- Select index pattern
- Choose aggregation
- Set bucket span (15m)
- Configure detectors
- Run job
- View anomalies in dashboard
```

## Export/Import Dashboards

```bash
# Export dashboard
curl -X GET "http://localhost:5601/api/kibana/dashboards/export?dashboard=DASHBOARD_ID" > dashboard.json

# Import dashboard
curl -X POST "http://localhost:5601/api/kibana/dashboards/import" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d @dashboard.json
```

## Kibana Best Practices

1. **Index Patterns**: Use wildcards for daily indices
2. **Time Fields**: Always specify time field
3. **Field Types**: Ensure proper mapping (keyword vs text)
4. **Filters**: Use filters instead of query for exact matches
5. **Saved Searches**: Save common queries
6. **Dashboard Organization**: Group related visualizations
7. **Refresh Interval**: Set appropriate refresh rates
8. **Export**: Regularly export dashboard configurations

## Sample Dashboard JSON

```json
{
  "title": "Application Monitoring",
  "hits": 0,
  "description": "Monitor application health and performance",
  "panelsJSON": "[{\"panelIndex\":\"1\",\"gridData\":{\"x\":0,\"y\":0,\"w\":24,\"h\":15},\"version\":\"8.11.0\",\"type\":\"visualization\",\"id\":\"request-rate\"}]",
  "optionsJSON": "{\"darkTheme\":false}",
  "version": 1,
  "timeRestore": true,
  "timeTo": "now",
  "timeFrom": "now-15m",
  "refreshInterval": {
    "pause": false,
    "value": 30000
  }
}
```

## Exercises

1. **Create Dashboard**: Build comprehensive monitoring dashboard
2. **Custom Visualization**: Create TSVB with multiple metrics
3. **Saved Searches**: Create and organize saved searches
4. **Alerting**: Set up alert for error rate
5. **Canvas**: Design custom report with Canvas

## Key Takeaways

- ✅ Kibana provides powerful visualization
- ✅ Discover for log exploration
- ✅ Multiple visualization types available
- ✅ Dashboards combine multiple visualizations
- ✅ KQL for querying data
- ✅ Alerting for proactive monitoring

## Next Steps

Continue to **Tutorial 04: Beats** to learn about:
- Filebeat for log shipping
- Metricbeat for metrics collection
- Heartbeat for uptime monitoring
- Custom beat configuration

## Additional Resources

- [Kibana Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
- [KQL Syntax](https://www.elastic.co/guide/en/kibana/current/kuery-query.html)
- [Visualizations](https://www.elastic.co/guide/en/kibana/current/visualize.html)
- [Dashboards](https://www.elastic.co/guide/en/kibana/current/dashboard.html)
