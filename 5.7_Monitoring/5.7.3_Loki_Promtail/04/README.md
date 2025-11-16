# Tutorial 04: Grafana Integration - Dashboards and Exploration

## Topics Covered
- Loki datasource configuration
- Logs panel and explore mode
- Creating log dashboards
- Combining metrics and logs
- Variables and templating
- Derived fields and trace correlation

## Key Dashboard Patterns

```json
// Log Volume Panel
{
  "targets": [{
    "expr": "sum by (level) (count_over_time({job=\"app\"}[1m]))"
  }],
  "type": "graph"
}

// Logs Table
{
  "targets": [{
    "expr": "{job=\"app\", level=\"ERROR\"}"
  }],
  "type": "logs"
}

// Error Rate
{
  "targets": [{
    "expr": "sum(rate({job=\"app\", level=\"ERROR\"}[5m])) / sum(rate({job=\"app\"}[5m])) * 100"
  }],
  "type": "stat"
}
```

Full tutorial includes dashboard JSON, explore mode usage, and best practices.
