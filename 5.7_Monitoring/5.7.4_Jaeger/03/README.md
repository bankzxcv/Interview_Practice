# Tutorial 03: Sampling - Strategies and Configuration

## Topics
- Sampling types (const, probabilistic, rate limiting, adaptive)
- Remote sampling
- Per-operation sampling
- Performance impact

## Sampling Strategies

```json
{
  "service_strategies": [
    {
      "service": "frontend",
      "type": "probabilistic",
      "param": 0.5  // 50% sampling
    },
    {
      "service": "critical-service",
      "type": "const",
      "param": 1  // 100% sampling
    },
    {
      "service": "batch-job",
      "type": "rate_limiting",
      "param": 10  // 10 traces/second
    }
  ],
  "default_strategy": {
    "type": "probabilistic",
    "param": 0.1  // 10% default
  },
  "per_operation_strategies": [
    {
      "service": "api",
      "operation": "health-check",
      "type": "probabilistic",
      "param": 0.01  // 1% for health checks
    }
  ]
}
```

Full configuration with adaptive sampling and performance tuning.
