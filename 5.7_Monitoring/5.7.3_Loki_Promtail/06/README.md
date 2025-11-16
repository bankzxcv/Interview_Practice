# Tutorial 06: Alerting - Loki Ruler and Alert Rules

## Topics Covered
- Loki Ruler configuration
- LogQL alert rules
- Alert annotations and labels
- Alertmanager integration
- Alert templates

## Alert Rule Example

```yaml
groups:
  - name: logs
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate({job="app", level="ERROR"}[5m]))
          /
          sum(rate({job="app"}[5m]))
          > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"
```

Full tutorial with Ruler setup, multiple alert examples, and testing procedures.
