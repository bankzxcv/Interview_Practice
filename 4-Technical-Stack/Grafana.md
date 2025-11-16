# Grafana Cheatsheet - Quick Reference

Monitoring and observability platform with beautiful dashboards.

---

## Concepts

```
DATA SOURCES:
- Prometheus
- Elasticsearch
- InfluxDB
- MySQL/PostgreSQL
- CloudWatch
- Loki

DASHBOARD:
- Panels (graphs, tables, stats)
- Variables (dropdowns, filters)
- Annotations (events)
- Time range

ALERTS:
- Alert rules
- Notification channels
- Alert states: OK, Pending, Alerting
```

## PromQL Queries

```promql
# Rate of requests per second
rate(http_requests_total[5m])

# Average response time
avg(http_request_duration_seconds)

# 95th percentile
histogram_quantile(0.95, rate(http_request_duration_bucket[5m]))

# CPU usage by pod
sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)

# Memory usage
container_memory_usage_bytes / container_spec_memory_limit_bytes

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

## Dashboard Variables

```
$instance - Instance dropdown
$namespace - Namespace filter
$pod - Pod selector

Query: label_values(up, instance)
Query: label_values(kube_pod_info, namespace)
```

## Common Panels

```
TIME SERIES (Graph):
- CPU usage
- Memory usage
- Request rate
- Response time

STAT (Single Number):
- Total requests
- Error count
- Uptime

TABLE:
- Log entries
- Query results
- Resource list

GAUGE:
- CPU percentage
- Disk usage
- Memory usage
```

---

**Last updated:** 2025-11-15
