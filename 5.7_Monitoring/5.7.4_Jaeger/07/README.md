# Tutorial 07: Advanced Queries - Search and Analysis

## Topics
- Trace search strategies
- Operation filtering
- Tag-based queries
- Duration thresholds
- Error traces

## Query Examples

```
// Find slow traces
service:api operation:get-user minDuration:500ms

// Find errors
service:api tags:"error:true"

// Specific HTTP codes
service:api tags:"http.status_code:500"

// Tag combinations
service:api tags:"http.method:POST" AND tags:"http.status_code:200"

// By span count
service:api minSpans:10

// Time range
service:api start:2024-01-15T00:00:00Z end:2024-01-15T23:59:59Z
```

Complete guide to Jaeger UI and API queries with advanced filtering.
