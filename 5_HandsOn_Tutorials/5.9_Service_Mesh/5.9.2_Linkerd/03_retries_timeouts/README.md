# Linkerd Tutorial 03: Retries and Timeouts

## Overview

Configure automatic retries and timeouts in Linkerd using ServiceProfiles. Learn to implement retry budgets to prevent retry storms and set appropriate timeouts.

## Learning Objectives

- Configure per-route retries
- Set request timeouts
- Implement retry budgets
- Monitor retry metrics
- Prevent retry storms

## ServiceProfile Configuration

### Retry Configuration

**Create ServiceProfile with Retries:**
```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: backend.default.svc.cluster.local
spec:
  routes:
    - name: GET /api/data
      condition:
        method: GET
        pathRegex: /api/data
      # Enable retries for this route
      isRetryable: true
      # Timeout per request
      timeout: 3s

  # Retry budget: limits total retries
  retryBudget:
    retryRatio: 0.2        # Max 20% additional requests
    minRetriesPerSecond: 10  # Minimum guaranteed retries
    ttl: 10s               # Time window
```

**Apply:**
```bash
kubectl apply -f 01-retry-config.yaml
```

### Timeout Configuration

**Set Timeouts:**
```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: slow-service.default.svc.cluster.local
spec:
  routes:
    - name: GET /slow
      condition:
        method: GET
        pathRegex: /slow
      timeout: 5s  # Timeout after 5 seconds
```

**Test:**
```bash
# Deploy slow service
kubectl apply -f 02-slow-service.yaml

# Send request (should timeout)
kubectl exec deploy/curl-client -- \
  time curl -s http://slow-service:8080/slow
```

## Tutorial Exercises

### Exercise 1: Basic Retry

**Deploy Flaky Service:**
```bash
kubectl apply -f 03-flaky-service.yaml
# Fails 50% of requests
```

**Configure Retries:**
```bash
kubectl apply -f 04-retry-profile.yaml
```

**Test:**
```bash
# Most requests should succeed after retries
for i in {1..20}; do
  kubectl exec deploy/curl-client -- curl -s http://flaky-service:8080/api
done
```

**Monitor:**
```bash
# View retry stats
linkerd viz routes deploy/flaky-service --to svc/flaky-service

# Shows: actual_success_rate vs effective_success_rate
```

### Exercise 2: Retry Budget

**Purpose:** Prevent retry storms that amplify failures.

**Configure:**
```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: backend.default.svc.cluster.local
spec:
  routes:
    - name: GET /api
      condition:
        method: GET
        pathRegex: /api
      isRetryable: true

  retryBudget:
    retryRatio: 0.2         # Allow 20% extra traffic for retries
    minRetriesPerSecond: 10  # Always allow at least 10 retries/sec
    ttl: 10s
```

**Explanation:**
- If receiving 100 RPS, max retry traffic = 20 RPS
- Prevents cascading failures
- Guarantees minimum retries for low-traffic services

### Exercise 3: Timeout Configuration

**Fast Timeout:**
```yaml
routes:
  - name: GET /api/fast
    timeout: 1s

  - name: GET /api/slow
    timeout: 10s
```

**Test:**
```bash
# Fast endpoint
kubectl exec deploy/curl-client -- \
  curl -w "Time: %{time_total}s\n" http://backend:8080/api/fast

# Slow endpoint
kubectl exec deploy/curl-client -- \
  curl -w "Time: %{time_total}s\n" http://backend:8080/api/slow
```

### Exercise 4: Combined Retry + Timeout

**Optimal Configuration:**
```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: production-api.default.svc.cluster.local
spec:
  routes:
    - name: GET /api/users
      condition:
        method: GET
        pathRegex: /api/users
      isRetryable: true
      timeout: 2s

    - name: POST /api/users
      condition:
        method: POST
        pathRegex: /api/users
      isRetryable: false  # POST is not idempotent
      timeout: 5s

  retryBudget:
    retryRatio: 0.15
    minRetriesPerSecond: 5
    ttl: 10s
```

## Verification

```bash
# View route metrics with retry info
linkerd viz routes deploy/backend

# Key metrics:
# - EFFECTIVE_SUCCESS: Success rate after retries
# - ACTUAL_SUCCESS: Success rate before retries
# - EFFECTIVE_RPS: Including retry traffic
# - ACTUAL_RPS: Original requests only

# Tap to see retries
linkerd viz tap deploy/backend | grep retry
```

## Best Practices

1. **Only Retry Idempotent Operations**: GET, PUT, DELETE (not POST)
2. **Set Retry Budgets**: Prevent retry storms
3. **Use Realistic Timeouts**: Based on P99 latency
4. **Monitor Retry Ratios**: High ratios indicate problems
5. **Test Failure Scenarios**: Ensure retries work
6. **Combine with Circuit Breakers**: Defense in depth

## Troubleshooting

### Too Many Retries

```bash
# Check retry budget
kubectl get serviceprofile backend.default.svc.cluster.local -o yaml

# Lower retryRatio
retryRatio: 0.1  # 10% instead of 20%
```

### Timeouts Too Aggressive

```bash
# Check actual latency
linkerd viz routes deploy/backend

# Adjust timeout to P99 + buffer
timeout: 3s  # If P99 is 2s
```

## Next Steps

- [04_mtls](../04_mtls/): Automatic mutual TLS
- Implement circuit breakers
- Add fallback services
- Configure health checks

## Resources

- [Linkerd Retries](https://linkerd.io/2/features/retries-and-timeouts/)
- [ServiceProfile Spec](https://linkerd.io/2/reference/service-profiles/)
- [Retry Budgets](https://linkerd.io/2/tasks/configuring-retries/)
