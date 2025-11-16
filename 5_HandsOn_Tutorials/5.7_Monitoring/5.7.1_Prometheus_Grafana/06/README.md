# Tutorial 06: Grafana Dashboards - Visualization and Analytics

## Learning Objectives
- Install and configure Grafana
- Create dashboards from scratch
- Use different visualization types
- Implement dashboard variables
- Set up dashboard alerts
- Share and export dashboards

## Step 1: Grafana Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./rules:/etc/prometheus/rules
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:10.2.2
    container_name: grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=http://localhost:3000
      - GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-clock-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    ports:
      - "3000:3000"
    networks:
      - monitoring
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: node-exporter
    ports:
      - "9100:9100"
    networks:
      - monitoring

  sample-app:
    build: .
    container_name: sample-app
    ports:
      - "8080:8080"
    networks:
      - monitoring

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

## Step 2: Grafana Provisioning

Auto-configure Grafana datasources and dashboards:

```yaml
# grafana/provisioning/datasources/prometheus.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: "15s"
```

```yaml
# grafana/provisioning/dashboards/dashboard.yml
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: true
```

## Step 3: System Metrics Dashboard

```json
{
  "dashboard": {
    "title": "System Metrics Dashboard",
    "tags": ["system", "monitoring"],
    "timezone": "browser",
    "refresh": "30s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "CPU Usage",
        "type": "graph",
        "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "{{ instance }}",
            "refId": "A"
          }
        ],
        "yaxes": [
          {
            "format": "percent",
            "min": 0,
            "max": 100
          }
        ],
        "alert": {
          "conditions": [
            {
              "evaluator": {
                "params": [80],
                "type": "gt"
              },
              "query": {
                "params": ["A", "5m", "now"]
              },
              "type": "query"
            }
          ],
          "executionErrorState": "alerting",
          "frequency": "1m",
          "handler": 1,
          "name": "High CPU Usage",
          "noDataState": "no_data"
        }
      },
      {
        "id": 2,
        "title": "Memory Usage",
        "type": "graph",
        "gridPos": { "x": 12, "y": 0, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "{{ instance }}",
            "refId": "A"
          }
        ],
        "yaxes": [
          {
            "format": "percent",
            "min": 0,
            "max": 100
          }
        ]
      },
      {
        "id": 3,
        "title": "Disk Usage",
        "type": "gauge",
        "gridPos": { "x": 0, "y": 8, "w": 6, "h": 8 },
        "targets": [
          {
            "expr": "100 - ((node_filesystem_avail_bytes{mountpoint=\"/\"} / node_filesystem_size_bytes{mountpoint=\"/\"}) * 100)",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "value": 0, "color": "green" },
                { "value": 70, "color": "yellow" },
                { "value": 85, "color": "red" }
              ]
            },
            "unit": "percent",
            "min": 0,
            "max": 100
          }
        }
      },
      {
        "id": 4,
        "title": "Network Traffic",
        "type": "graph",
        "gridPos": { "x": 6, "y": 8, "w": 18, "h": 8 },
        "targets": [
          {
            "expr": "rate(node_network_receive_bytes_total[5m])",
            "legendFormat": "RX {{ device }}",
            "refId": "A"
          },
          {
            "expr": "rate(node_network_transmit_bytes_total[5m])",
            "legendFormat": "TX {{ device }}",
            "refId": "B"
          }
        ],
        "yaxes": [
          {
            "format": "Bps"
          }
        ]
      },
      {
        "id": 5,
        "title": "System Load",
        "type": "stat",
        "gridPos": { "x": 0, "y": 16, "w": 8, "h": 4 },
        "targets": [
          {
            "expr": "node_load1",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                { "value": 0, "color": "green" },
                { "value": 2, "color": "yellow" },
                { "value": 4, "color": "red" }
              ]
            }
          }
        }
      }
    ]
  }
}
```

## Step 4: Application Performance Dashboard

Create a comprehensive application performance monitoring dashboard:

```json
{
  "dashboard": {
    "title": "Application Performance",
    "tags": ["application", "performance"],
    "templating": {
      "list": [
        {
          "name": "job",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(http_requests_total, job)",
          "refresh": 1,
          "multi": true,
          "includeAll": true
        },
        {
          "name": "instance",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(http_requests_total{job=~\"$job\"}, instance)",
          "refresh": 1,
          "multi": true,
          "includeAll": true
        }
      ]
    },
    "panels": [
      {
        "id": 1,
        "title": "Request Rate (QPS)",
        "type": "graph",
        "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "sum by (job) (rate(http_requests_total{job=~\"$job\",instance=~\"$instance\"}[5m]))",
            "legendFormat": "{{ job }}",
            "refId": "A"
          }
        ]
      },
      {
        "id": 2,
        "title": "Error Rate (%)",
        "type": "graph",
        "gridPos": { "x": 12, "y": 0, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "sum by (job) (rate(http_requests_total{job=~\"$job\",instance=~\"$instance\",status_code=~\"5..\"}[5m])) / sum by (job) (rate(http_requests_total{job=~\"$job\",instance=~\"$instance\"}[5m])) * 100",
            "legendFormat": "{{ job }}",
            "refId": "A"
          }
        ],
        "yaxes": [
          {
            "format": "percent"
          }
        ]
      },
      {
        "id": 3,
        "title": "Latency Percentiles",
        "type": "graph",
        "gridPos": { "x": 0, "y": 8, "w": 24, "h": 8 },
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum by (job, le) (rate(http_request_duration_seconds_bucket{job=~\"$job\",instance=~\"$instance\"}[5m])))",
            "legendFormat": "p50 {{ job }}",
            "refId": "A"
          },
          {
            "expr": "histogram_quantile(0.95, sum by (job, le) (rate(http_request_duration_seconds_bucket{job=~\"$job\",instance=~\"$instance\"}[5m])))",
            "legendFormat": "p95 {{ job }}",
            "refId": "B"
          },
          {
            "expr": "histogram_quantile(0.99, sum by (job, le) (rate(http_request_duration_seconds_bucket{job=~\"$job\",instance=~\"$instance\"}[5m])))",
            "legendFormat": "p99 {{ job }}",
            "refId": "C"
          }
        ],
        "yaxes": [
          {
            "format": "s"
          }
        ]
      },
      {
        "id": 4,
        "title": "Status Code Distribution",
        "type": "piechart",
        "gridPos": { "x": 0, "y": 16, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "sum by (status_code) (rate(http_requests_total{job=~\"$job\",instance=~\"$instance\"}[5m]))",
            "legendFormat": "{{ status_code }}",
            "refId": "A"
          }
        ]
      },
      {
        "id": 5,
        "title": "Top Endpoints by Traffic",
        "type": "table",
        "gridPos": { "x": 12, "y": 16, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "topk(10, sum by (endpoint) (rate(http_requests_total{job=~\"$job\",instance=~\"$instance\"}[5m])))",
            "format": "table",
            "instant": true,
            "refId": "A"
          }
        ],
        "transformations": [
          {
            "id": "organize",
            "options": {
              "excludeByName": {
                "Time": true,
                "__name__": true
              },
              "indexByName": {},
              "renameByName": {
                "endpoint": "Endpoint",
                "Value": "Requests/sec"
              }
            }
          }
        ]
      }
    ]
  }
}
```

## Step 5: Database Dashboard

```json
{
  "dashboard": {
    "title": "Database Metrics",
    "panels": [
      {
        "title": "Active Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_activity_count{state=\"active\"}",
            "legendFormat": "Active",
            "refId": "A"
          },
          {
            "expr": "pg_stat_activity_count{state=\"idle\"}",
            "legendFormat": "Idle",
            "refId": "B"
          }
        ]
      },
      {
        "title": "Query Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(pg_stat_database_xact_commit[5m])",
            "legendFormat": "Commits",
            "refId": "A"
          },
          {
            "expr": "rate(pg_stat_database_xact_rollback[5m])",
            "legendFormat": "Rollbacks",
            "refId": "B"
          }
        ]
      },
      {
        "title": "Cache Hit Ratio",
        "type": "gauge",
        "targets": [
          {
            "expr": "sum(pg_stat_database_blks_hit) / (sum(pg_stat_database_blks_hit) + sum(pg_stat_database_blks_read)) * 100",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                { "value": 0, "color": "red" },
                { "value": 90, "color": "yellow" },
                { "value": 95, "color": "green" }
              ]
            }
          }
        }
      }
    ]
  }
}
```

## Step 6: Dashboard Variables

```json
{
  "templating": {
    "list": [
      {
        "name": "datasource",
        "type": "datasource",
        "query": "prometheus"
      },
      {
        "name": "environment",
        "type": "query",
        "datasource": "$datasource",
        "query": "label_values(up, environment)",
        "refresh": 1,
        "multi": false,
        "includeAll": false
      },
      {
        "name": "job",
        "type": "query",
        "datasource": "$datasource",
        "query": "label_values(up{environment=\"$environment\"}, job)",
        "refresh": 1,
        "multi": true,
        "includeAll": true
      },
      {
        "name": "instance",
        "type": "query",
        "datasource": "$datasource",
        "query": "label_values(up{environment=\"$environment\",job=~\"$job\"}, instance)",
        "refresh": 2,
        "multi": true,
        "includeAll": true
      },
      {
        "name": "interval",
        "type": "interval",
        "query": "1m,5m,10m,30m,1h,6h,12h,1d,7d",
        "auto": true,
        "auto_count": 30,
        "auto_min": "1m"
      }
    ]
  }
}
```

## Step 7: Advanced Visualization Types

### Heatmap

```json
{
  "type": "heatmap",
  "targets": [
    {
      "expr": "sum by (le) (rate(http_request_duration_seconds_bucket[5m]))",
      "format": "heatmap",
      "legendFormat": "{{le}}"
    }
  ]
}
```

### Bar Gauge

```json
{
  "type": "bargauge",
  "targets": [
    {
      "expr": "sum by (service) (rate(http_requests_total[5m]))"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "thresholds": {
        "steps": [
          { "value": 0, "color": "green" },
          { "value": 50, "color": "yellow" },
          { "value": 100, "color": "red" }
        ]
      }
    }
  }
}
```

### Stat Panel with Sparkline

```json
{
  "type": "stat",
  "targets": [
    {
      "expr": "sum(rate(http_requests_total[5m]))"
    }
  ],
  "options": {
    "graphMode": "area",
    "colorMode": "value",
    "textMode": "value_and_name"
  }
}
```

## Step 8: Grafana API Usage

```bash
# Create API key
curl -X POST http://admin:admin@localhost:3000/api/auth/keys \
  -H "Content-Type: application/json" \
  -d '{"name":"api-key","role":"Admin"}'

# Get all dashboards
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/search?query=&

# Export dashboard
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/dashboards/uid/DASHBOARD_UID \
  | jq .dashboard > dashboard.json

# Import dashboard
curl -X POST http://localhost:3000/api/dashboards/db \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @dashboard.json
```

## Step 9: Dashboard Alerts in Grafana

```json
{
  "alert": {
    "name": "High Error Rate",
    "message": "Error rate above 5%",
    "conditions": [
      {
        "evaluator": {
          "params": [5],
          "type": "gt"
        },
        "operator": {
          "type": "and"
        },
        "query": {
          "params": ["A", "5m", "now"]
        },
        "reducer": {
          "params": [],
          "type": "avg"
        },
        "type": "query"
      }
    ],
    "executionErrorState": "alerting",
    "for": "5m",
    "frequency": "1m",
    "handler": 1,
    "noDataState": "no_data",
    "notifications": [
      {
        "uid": "slack-channel"
      }
    ]
  }
}
```

## Step 10: Best Practices

### Dashboard Organization

```
├── General/
│   ├── System Overview
│   └── Service Health
├── Applications/
│   ├── API Performance
│   ├── Frontend Metrics
│   └── Background Jobs
├── Infrastructure/
│   ├── Node Metrics
│   ├── Network
│   └── Storage
└── Business/
    ├── Revenue
    ├── Users
    └── Conversions
```

### Dashboard Tips

1. **Use consistent time ranges**
2. **Limit panels to 12-15 per dashboard**
3. **Use variables for flexibility**
4. **Set appropriate refresh rates**
5. **Add descriptions to panels**
6. **Use consistent color schemes**
7. **Create row separators for organization**

## Exercises

1. **Create Custom Dashboard**: Build dashboard for your service
2. **Use Variables**: Implement multi-select variables
3. **Create Alert**: Set up Grafana alerts
4. **Import Dashboard**: Import community dashboard
5. **Export/Share**: Export dashboard as JSON

## Key Takeaways

- ✅ Grafana provides powerful visualization
- ✅ Use variables for dynamic dashboards
- ✅ Organize dashboards by purpose
- ✅ Set appropriate thresholds and alerts
- ✅ Use provisioning for GitOps
- ✅ Explore community dashboards

## Next Steps

Continue to **Tutorial 07: Advanced PromQL** to learn about:
- Complex PromQL queries
- Subqueries
- Aggregation operators
- Query optimization

## Additional Resources

- [Grafana Documentation](https://grafana.com/docs/)
- [Dashboard Best Practices](https://grafana.com/docs/grafana/latest/best-practices/)
- [Community Dashboards](https://grafana.com/grafana/dashboards/)
