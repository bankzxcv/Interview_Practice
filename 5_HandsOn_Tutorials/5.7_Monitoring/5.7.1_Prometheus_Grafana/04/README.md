# Tutorial 04: Recording Rules - Aggregation and Performance

## Learning Objectives
- Understand recording rules
- Pre-compute expensive queries
- Create aggregation rules
- Optimize query performance
- Manage rule files

## What are Recording Rules?

Recording rules pre-compute frequently used or expensive queries and save results as new time series.

**Benefits:**
- Faster dashboard loads
- Consistent calculations
- Reduced query load
- Enable complex aggregations

## Step 1: Basic Recording Rules

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - '/etc/prometheus/rules/*.yml'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'sample-app'
    static_configs:
      - targets: ['sample-app:8080']
```

## Step 2: Create Recording Rules

```yaml
# rules/recording-rules.yml
groups:
  - name: performance_metrics
    interval: 30s
    rules:
      # Record request rate per service
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))

      # Record request rate per endpoint
      - record: job:http_requests:rate5m:by_endpoint
        expr: sum by (job, endpoint) (rate(http_requests_total[5m]))

      # Record error rate percentage
      - record: job:http_errors:rate5m
        expr: |
          sum by (job) (rate(http_requests_total{status_code=~"5.."}[5m]))
          /
          sum by (job) (rate(http_requests_total[5m]))
          * 100

      # Record 95th percentile latency
      - record: job:http_latency:p95
        expr: |
          histogram_quantile(0.95,
            sum by (job, le) (rate(http_request_duration_seconds_bucket[5m]))
          )

      # Record 99th percentile latency
      - record: job:http_latency:p99
        expr: |
          histogram_quantile(0.99,
            sum by (job, le) (rate(http_request_duration_seconds_bucket[5m]))
          )

  - name: resource_metrics
    interval: 30s
    rules:
      # Record CPU usage by instance
      - record: instance:cpu_usage:rate5m
        expr: |
          100 - (
            avg by (instance) (
              rate(node_cpu_seconds_total{mode="idle"}[5m])
            ) * 100
          )

      # Record memory usage percentage
      - record: instance:memory_usage:percentage
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

      # Record disk usage percentage
      - record: instance:disk_usage:percentage
        expr: |
          100 - (
            (node_filesystem_avail_bytes{mountpoint="/"} /
             node_filesystem_size_bytes{mountpoint="/"}) * 100
          )

      # Record network traffic (bytes/sec)
      - record: instance:network_receive:rate5m
        expr: rate(node_network_receive_bytes_total[5m])

      - record: instance:network_transmit:rate5m
        expr: rate(node_network_transmit_bytes_total[5m])

  - name: business_metrics
    interval: 1m
    rules:
      # Record total revenue (example)
      - record: business:revenue:total
        expr: sum(transaction_amount_total)

      # Record revenue rate (per second)
      - record: business:revenue:rate5m
        expr: sum(rate(transaction_amount_total[5m]))

      # Record active users
      - record: business:users:active
        expr: count(user_last_seen_timestamp > (time() - 300))

      # Record conversion rate
      - record: business:conversion:rate
        expr: |
          sum(rate(purchases_total[5m])) /
          sum(rate(page_views_total[5m])) * 100

  - name: sli_metrics
    interval: 30s
    rules:
      # Availability SLI (percentage of successful requests)
      - record: sli:availability:ratio
        expr: |
          sum(rate(http_requests_total{status_code!~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))

      # Latency SLI (percentage under 500ms)
      - record: sli:latency:good_ratio
        expr: |
          sum(rate(http_request_duration_seconds_bucket{le="0.5"}[5m]))
          /
          sum(rate(http_request_duration_seconds_count[5m]))

      # Error budget burn rate (how fast we're consuming error budget)
      - record: sli:error_budget:burn_rate
        expr: |
          (1 - sli:availability:ratio) / (1 - 0.999)

  - name: aggregations
    interval: 1m
    rules:
      # Aggregate metrics across all instances
      - record: cluster:cpu_usage:avg
        expr: avg(instance:cpu_usage:rate5m)

      - record: cluster:memory_usage:avg
        expr: avg(instance:memory_usage:percentage)

      # Top 5 endpoints by traffic
      - record: endpoint:traffic:top5
        expr: topk(5, sum by (endpoint) (rate(http_requests_total[5m])))

      # Service-level aggregations
      - record: service:requests:rate1h
        expr: sum by (service) (rate(http_requests_total[1h]))

      - record: service:errors:rate1h
        expr: sum by (service) (rate(http_requests_total{status_code=~"5.."}[1h]))
```

## Step 3: Rule Naming Conventions

Follow this pattern: `level:metric:operations`

```yaml
# ✅ Good examples:
job:http_requests:rate5m                    # Aggregated by job
instance:cpu_usage:rate5m                   # Per instance
cluster:memory_usage:avg                    # Cluster-wide average
job:http_requests:rate5m:by_endpoint       # Multiple dimensions

# ❌ Bad examples:
request_rate                                # Too vague
http_requests_per_second_by_job            # Inconsistent format
cpu                                         # Not descriptive
```

## Step 4: Docker Compose Setup

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
      - '--web.enable-lifecycle'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./rules:/etc/prometheus/rules
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - monitoring

  sample-app:
    build: .
    container_name: sample-app
    ports:
      - "8080:8080"
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: node-exporter
    ports:
      - "9100:9100"
    networks:
      - monitoring

volumes:
  prometheus-data:

networks:
  monitoring:
    driver: bridge
```

## Step 5: Validate and Reload Rules

```bash
# Validate rules syntax
docker exec prometheus promtool check rules /etc/prometheus/rules/*.yml

# Reload configuration (without restart)
curl -X POST http://localhost:9090/-/reload

# Or with docker exec
docker exec prometheus kill -HUP 1
```

## Step 6: Query Recording Rules

```promql
# Use pre-computed metrics in queries
job:http_requests:rate5m

# Compare with original (slower)
sum by (job) (rate(http_requests_total[5m]))

# Use in dashboards
job:http_latency:p95
instance:cpu_usage:rate5m

# Combine recording rules
job:http_errors:rate5m > 1  # Alert when error rate > 1%
```

## Step 7: Advanced Recording Rules

```yaml
# rules/advanced-rules.yml
groups:
  - name: multi_level_aggregation
    interval: 30s
    rules:
      # Level 1: Per-instance metrics
      - record: instance:requests:rate5m
        expr: sum by (instance) (rate(http_requests_total[5m]))

      # Level 2: Per-cluster metrics (uses Level 1)
      - record: cluster:requests:rate5m
        expr: sum(instance:requests:rate5m)

      # Level 3: Multi-cluster aggregation
      - record: global:requests:rate5m
        expr: sum by (region) (cluster:requests:rate5m)

  - name: derived_metrics
    interval: 30s
    rules:
      # Calculate request distribution
      - record: job:http_requests:distribution
        expr: |
          sum by (job, status_code) (rate(http_requests_total[5m]))
          / ignoring(status_code)
          group_left sum by (job) (rate(http_requests_total[5m]))

      # Calculate cache hit ratio
      - record: cache:hit_ratio
        expr: |
          sum(rate(cache_hits_total[5m]))
          /
          (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))

      # Database connection pool utilization
      - record: db:connection_pool:utilization
        expr: |
          db_connections_active / db_connections_max * 100

  - name: time_based_aggregations
    interval: 5m
    rules:
      # Hourly request count
      - record: job:http_requests:count1h
        expr: sum by (job) (increase(http_requests_total[1h]))

      # Daily active users
      - record: business:users:daily_active
        expr: count(user_last_seen_timestamp > (time() - 86400))

      # Weekly revenue
      - record: business:revenue:weekly
        expr: sum(increase(transaction_amount_total[7d]))
```

## Step 8: Monitoring Recording Rules

```promql
# Check rule evaluation time
prometheus_rule_evaluation_duration_seconds

# Number of rules
count(prometheus_rule_group_rules)

# Failed rule evaluations
rate(prometheus_rule_evaluation_failures_total[5m])

# Rule group execution time
prometheus_rule_group_duration_seconds
```

## Step 9: Best Practices

### 1. Optimize Expensive Queries

```yaml
# Before: Expensive query run every dashboard refresh
histogram_quantile(0.95,
  sum by (service, le) (
    rate(http_request_duration_seconds_bucket[5m])
  )
)

# After: Pre-computed, fast lookup
service:http_latency:p95
```

### 2. Hierarchical Aggregations

```yaml
# Build metrics in layers
rules:
  # Layer 1: Instance level
  - record: instance:cpu:usage
    expr: rate(cpu_seconds_total[5m])

  # Layer 2: Node level
  - record: node:cpu:usage
    expr: avg by (node) (instance:cpu:usage)

  # Layer 3: Cluster level
  - record: cluster:cpu:usage
    expr: avg(node:cpu:usage)
```

### 3. Retention Considerations

```yaml
# Short-term, detailed metrics (7 days)
- record: job:http_requests:rate1m
  expr: sum by (job) (rate(http_requests_total[1m]))

# Long-term, aggregated metrics (90 days)
- record: job:http_requests:rate1h
  expr: sum by (job) (rate(http_requests_total[1h]))
```

## Exercises

1. **Create Business Metrics**: Record revenue, conversions, signups
2. **SLI Metrics**: Build availability and latency SLIs
3. **Performance Test**: Compare query time before/after recording rules
4. **Multi-level Aggregation**: Build 3-level metric hierarchy
5. **Optimize Dashboard**: Convert slow dashboard to use recording rules

## Performance Comparison

```promql
# Original query (slow on large datasets)
sum by (job) (
  rate(http_requests_total[5m])
) > 100

# Recording rule (pre-computed, fast)
job:http_requests:rate5m > 100

# Typical speedup: 10-100x faster
```

## Rule Management

```bash
# List all rules
curl http://localhost:9090/api/v1/rules | jq

# Check specific rule group
curl http://localhost:9090/api/v1/rules?type=record&rule_group=performance_metrics | jq

# Validate before deployment
promtool check rules rules/*.yml
```

## Key Takeaways

- ✅ Recording rules pre-compute expensive queries
- ✅ Follow naming convention: `level:metric:operations`
- ✅ Use hierarchical aggregations for efficiency
- ✅ Validate rules before deployment
- ✅ Monitor rule evaluation performance
- ✅ Balance detail vs retention

## Next Steps

Continue to **Tutorial 05: Alerting Rules** to learn about:
- Creating alert rules
- Alert routing
- Alertmanager configuration
- Notification channels

## Additional Resources

- [Recording Rules](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/)
- [Rule Best Practices](https://prometheus.io/docs/practices/rules/)
- [PromQL Performance](https://prometheus.io/docs/practices/histograms/)
