# Tutorial 07: Advanced PromQL Queries - Complex Queries and Optimization

## Learning Objectives
- Master advanced PromQL techniques
- Use subqueries and nested aggregations
- Optimize query performance
- Understand vector matching
- Work with time series manipulation

## Advanced PromQL Concepts

```
PromQL Query Types:
├── Instant Vector (single value per series)
├── Range Vector (multiple values over time)
├── Scalar (single numeric value)
└── String (string value)
```

## Step 1: Aggregation Operators

### Basic Aggregations

```promql
# Sum across all dimensions
sum(http_requests_total)

# Sum by specific labels
sum by (job, instance) (http_requests_total)

# Sum without specific labels (keep all except)
sum without (status_code) (http_requests_total)

# Average
avg(http_request_duration_seconds)
avg by (job) (http_request_duration_seconds)

# Min/Max
min(http_request_duration_seconds)
max by (endpoint) (http_request_duration_seconds)

# Count
count(http_requests_total)
count by (status_code) (http_requests_total)

# Standard deviation
stddev(http_request_duration_seconds)

# Quantile (across series, not histogram)
quantile(0.95, http_request_duration_seconds)

# Top K
topk(5, sum by (endpoint) (rate(http_requests_total[5m])))

# Bottom K
bottomk(3, avg by (instance) (node_memory_MemAvailable_bytes))

# Count values
count_values("status", http_requests_total)
```

## Step 2: Vector Matching

### One-to-One Matching

```promql
# Automatic matching on same labels
http_requests_total / http_requests_duration_total

# Explicit matching with ON
http_requests_total / on(job, instance) http_requests_duration_total

# Ignore specific labels
http_requests_total / ignoring(status_code) http_requests_duration_total
```

### Many-to-One Matching

```promql
# Group left (many on left side)
http_requests_total * on(job) group_left(team) team_info

# Group right (many on right side)
team_info * on(job) group_right http_requests_total
```

### Example: Enrich Metrics with Metadata

```promql
# Add team information to request metrics
sum by (job) (rate(http_requests_total[5m]))
  * on(job) group_left(team, oncall)
  team_metadata{job!=""}

# Calculate percentage of total
sum by (endpoint) (rate(http_requests_total[5m]))
  /
  ignoring(endpoint) group_left
  sum(rate(http_requests_total[5m]))
  * 100
```

## Step 3: Subqueries

```promql
# Basic subquery syntax
metric[5m:1m]  # Last 5 minutes, resolution 1 minute

# Max rate over last hour
max_over_time(rate(http_requests_total[5m])[1h:1m])

# Average of 95th percentile over 24h
avg_over_time(
  histogram_quantile(0.95,
    rate(http_request_duration_seconds_bucket[5m])
  )[24h:5m]
)

# Detect anomalies: current vs last week
rate(http_requests_total[5m])
  /
rate(http_requests_total[5m] offset 7d)

# Standard deviation of request rate
stddev_over_time(
  (sum by (job) (rate(http_requests_total[5m])))[1h:1m]
)
```

## Step 4: Rate and Increase

```promql
# Rate: per-second average over time range
rate(http_requests_total[5m])

# Increase: total increase over time range
increase(http_requests_total[1h])

# irate: instantaneous rate (last two points)
irate(http_requests_total[5m])

# delta: difference between first and last
delta(cpu_temp_celsius[10m])

# idelta: difference between last two samples
idelta(cpu_temp_celsius[10m])

# Practical example: requests in last hour
sum(increase(http_requests_total[1h]))

# Requests per minute
sum(rate(http_requests_total[5m])) * 60
```

## Step 5: Histogram and Quantiles

```promql
# Calculate 95th percentile from histogram
histogram_quantile(0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m]))
)

# Multiple percentiles
histogram_quantile(0.50,
  sum by (job, le) (rate(http_request_duration_seconds_bucket[5m]))
)
histogram_quantile(0.95,
  sum by (job, le) (rate(http_request_duration_seconds_bucket[5m]))
)
histogram_quantile(0.99,
  sum by (job, le) (rate(http_request_duration_seconds_bucket[5m]))
)

# Average from histogram
rate(http_request_duration_seconds_sum[5m])
/
rate(http_request_duration_seconds_count[5m])

# Apdex score (Application Performance Index)
(
  sum(rate(http_request_duration_seconds_bucket{le="0.3"}[5m]))
  +
  sum(rate(http_request_duration_seconds_bucket{le="1.2"}[5m])) / 2
)
/
sum(rate(http_request_duration_seconds_count[5m]))
```

## Step 6: Time Functions

```promql
# Current Unix timestamp
time()

# Day of week (0-6, 0 is Sunday)
day_of_week()

# Day of month (1-31)
day_of_month()

# Month (1-12)
month()

# Year
year()

# Hour (0-23)
hour()

# Minute (0-59)
minute()

# Alert only during business hours
ALERTS{severity="warning"}
  and on() (hour() >= 9 and hour() < 17)
  and on() (day_of_week() >= 1 and day_of_week() <= 5)

# Compare current value to same time yesterday
http_requests_total
  /
http_requests_total offset 24h

# Week-over-week growth
(rate(http_requests_total[1h])
  -
rate(http_requests_total[1h] offset 7d))
/
rate(http_requests_total[1h] offset 7d)
* 100
```

## Step 7: Absent and Present

```promql
# Alert when metric is missing
absent(up{job="api"})

# Alert when metric has no series
absent_over_time(http_requests_total[5m])

# Check if metric exists
count(http_requests_total) > 0

# Default value if metric absent
up{job="api"} or vector(0)

# Alert if service missing for 5 minutes
absent_over_time(up{job="critical-service"}[5m])
```

## Step 8: Label Manipulation

```promql
# Label replace (regex)
label_replace(
  http_requests_total,
  "env", "$1", "instance", "([^.]+).*"
)

# Label join (combine labels)
label_join(
  http_requests_total,
  "full_path", "/", "job", "endpoint"
)

# Example: Extract region from instance name
label_replace(
  up,
  "region", "$1", "instance", ".*-([a-z]{2}-[a-z]+-[0-9]).*"
)
```

## Step 9: Complex Real-World Queries

### SLI/SLO Calculations

```promql
# Availability SLI (99.9% target)
sum(rate(http_requests_total{status_code!~"5.."}[30d]))
/
sum(rate(http_requests_total[30d]))

# Error budget remaining (percentage)
(
  1 - (
    sum(rate(http_requests_total{status_code!~"5.."}[30d]))
    /
    sum(rate(http_requests_total[30d]))
  )
)
/
(1 - 0.999)
* 100

# Latency SLI (95% of requests < 500ms)
sum(rate(http_request_duration_seconds_bucket{le="0.5"}[30d]))
/
sum(rate(http_request_duration_seconds_count[30d]))

# Multi-window burn rate alert (Google SRE book)
# Fast burn (2% error budget in 1 hour)
(
  1 - (
    sum(rate(http_requests_total{status_code!~"5.."}[1h]))
    /
    sum(rate(http_requests_total[1h]))
  )
)
/
(1 - 0.999)
> 14.4

# Slow burn (10% error budget in 24 hours)
(
  1 - (
    sum(rate(http_requests_total{status_code!~"5.."}[24h]))
    /
    sum(rate(http_requests_total[24h]))
  )
)
/
(1 - 0.999)
> 1
```

### Capacity Planning

```promql
# Predict when disk will be full (linear regression)
predict_linear(
  node_filesystem_free_bytes{mountpoint="/"}[1h],
  4 * 3600
)

# CPU saturation (queue length)
node_load5 / count without(cpu) (node_cpu_seconds_total{mode="idle"})

# Memory saturation
1 - (
  node_memory_MemAvailable_bytes
  /
  node_memory_MemTotal_bytes
)

# Network saturation
rate(node_network_receive_bytes_total[5m])
/
(node_network_speed_bytes * 0.8)  # 80% of link speed
```

### RED Method (Rate, Errors, Duration)

```promql
# Rate
sum by (job) (rate(http_requests_total[5m]))

# Errors
sum by (job) (rate(http_requests_total{status_code=~"5.."}[5m]))
/
sum by (job) (rate(http_requests_total[5m]))

# Duration (P50, P95, P99)
histogram_quantile(0.50,
  sum by (job, le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

### USE Method (Utilization, Saturation, Errors)

```promql
# CPU Utilization
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# CPU Saturation
node_load5 / count without(cpu) (node_cpu_seconds_total{mode="idle"})

# CPU Errors
rate(node_cpu_guest_seconds_total[5m])

# Memory Utilization
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Memory Saturation
rate(node_vmstat_pgmajfault[5m])

# Disk Utilization
100 - ((node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100)

# Disk Saturation
rate(node_disk_io_time_weighted_seconds_total[5m])
```

## Step 10: Query Optimization

### Use Recording Rules

```promql
# Before (slow)
sum by (job) (rate(http_requests_total[5m]))

# After (fast - use recording rule)
job:http_requests:rate5m
```

### Limit Label Cardinality

```promql
# ❌ Bad: High cardinality
sum by (user_id) (rate(http_requests_total[5m]))

# ✅ Good: Aggregate by service
sum by (service) (rate(http_requests_total[5m]))
```

### Optimize Time Ranges

```promql
# ❌ Bad: Very large range
rate(http_requests_total[24h])

# ✅ Good: Use appropriate range
rate(http_requests_total[5m])

# Or use recording rule for long ranges
job:http_requests:rate1h
```

### Use Aggregation

```promql
# ❌ Bad: Query all series
http_requests_total

# ✅ Good: Aggregate first
sum by (job) (http_requests_total)
```

## Step 11: Query Examples by Use Case

### Detect Traffic Spikes

```promql
# Current rate vs average over last 24h
rate(http_requests_total[5m])
/
avg_over_time(rate(http_requests_total[5m])[24h:5m])
> 2
```

### Find Slow Endpoints

```promql
# Endpoints with P95 > 1s
topk(10,
  histogram_quantile(0.95,
    sum by (endpoint, le) (rate(http_request_duration_seconds_bucket[5m]))
  ) > 1
)
```

### Calculate Uptime Percentage

```promql
# Uptime in last 30 days
avg_over_time(up[30d]) * 100
```

### Detect Memory Leaks

```promql
# Memory growth rate
deriv(process_resident_memory_bytes[1h])
```

### Cache Hit Rate Trending

```promql
# Cache hit rate over time
sum(rate(cache_hits_total[5m]))
/
(sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))
```

## Exercises

1. **Complex SLO**: Build 4-window multi-burn rate SLO
2. **Capacity Planning**: Predict when disk fills up
3. **Anomaly Detection**: Detect traffic anomalies
4. **Query Optimization**: Convert slow query to recording rule
5. **Custom Metrics**: Create RED dashboard for your service

## Query Performance Tips

1. **Limit time range** - Use smallest range needed
2. **Use recording rules** - Pre-compute expensive queries
3. **Aggregate early** - Use `sum by` before expensive operations
4. **Avoid high cardinality** - Don't query by user_id, session_id
5. **Use instant queries** - For current values, use instant not range

## Key Takeaways

- ✅ Master aggregation operators and vector matching
- ✅ Use subqueries for advanced time-based analysis
- ✅ Implement SLI/SLO with multi-window burn rates
- ✅ Apply RED and USE methods consistently
- ✅ Optimize queries with recording rules
- ✅ Understand query performance implications

## Next Steps

Continue to **Tutorial 08: Production Stack** to learn about:
- High availability setup
- Federation and scaling
- Long-term storage
- Security and authentication
- Production best practices

## Additional Resources

- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [PromQL Operators](https://prometheus.io/docs/prometheus/latest/querying/operators/)
- [Query Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Best Practices](https://prometheus.io/docs/practices/histograms/)
