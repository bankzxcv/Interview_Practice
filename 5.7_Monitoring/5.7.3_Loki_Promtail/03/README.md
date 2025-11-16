# Tutorial 03: LogQL - Advanced Queries and Metrics

## Topics Covered
- LogQL query syntax
- Log stream selectors
- Line filter expressions
- Parser expressions (JSON, logfmt, regex)
- Metrics queries and aggregations
- Unwrapping values for calculations

## LogQL Query Types

```logql
# 1. Log queries (return log lines)
{job="app"} |= "error"

# 2. Metric queries (return numbers)
rate({job="app"}[5m])

# 3. Combined queries
sum(rate({job="app"} |= "error" [5m])) by (service)
```

## Essential Query Patterns

```logql
# Parse JSON and filter
{job="app"} | json | level="ERROR" | status_code >= 500

# Extract metrics from logs
sum by (endpoint) (
  rate(
    {job="app"} | json | unwrap duration_ms [5m]
  )
)

# Calculate error rate
sum(rate({job="app", level="ERROR"}[5m]))
/
sum(rate({job="app"}[5m]))
* 100
```

Complete examples, dashboard queries, and performance optimization tips included in full tutorial.
