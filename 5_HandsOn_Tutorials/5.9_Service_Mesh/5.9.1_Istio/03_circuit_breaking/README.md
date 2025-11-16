# Istio Tutorial 03: Circuit Breaking

## Overview

Learn to implement circuit breakers and outlier detection in Istio to prevent cascade failures and improve system resilience. Circuit breakers automatically stop sending traffic to unhealthy instances.

## Learning Objectives

- Understand circuit breaker patterns
- Configure connection pool settings
- Implement outlier detection
- Handle partial failures gracefully
- Monitor circuit breaker status
- Test failure scenarios
- Implement bulkhead patterns

## Prerequisites

- Completed Tutorial 02 (Traffic Management)
- Understanding of HTTP connection pools
- Basic knowledge of service resilience patterns

## Key Concepts

### Circuit Breaker Pattern

```
┌─────────────────────────────────────┐
│         Circuit States              │
│                                     │
│  Closed ──[failures]──> Open       │
│    ↑                      │         │
│    │                      │         │
│    │                 [timeout]      │
│    │                      │         │
│    │                      ↓         │
│    └───[success]─── Half-Open      │
│                                     │
└─────────────────────────────────────┘
```

**States:**
- **Closed**: Normal operation, requests flow
- **Open**: Too many failures, requests blocked
- **Half-Open**: Testing if service recovered

### Outlier Detection

Automatically removes unhealthy instances from the load balancing pool:
- Monitors consecutive errors (5xx)
- Ejects failing instances
- Periodically tests ejected instances
- Returns them to pool when healthy

### Connection Pool Settings

Limits concurrent connections and requests:
- Max connections per instance
- Max pending requests
- Max requests per connection
- Idle timeout

## Architecture

```
┌────────────────────────────────────────────┐
│           Client Service                    │
└──────────────┬─────────────────────────────┘
               │
               ↓
┌────────────────────────────────────────────┐
│      Circuit Breaker (DestinationRule)     │
│  • Connection Pool Limits                  │
│  • Outlier Detection                       │
│  • Load Balancing                          │
└──────────────┬─────────────────────────────┘
               │
         ┌─────┴─────┬─────────┬─────────┐
         ↓           ↓         ↓         ↓
    ┌────────┐  ┌────────┐ ┌────────┐ ┌────────┐
    │Pod 1   │  │Pod 2   │ │Pod 3   │ │Pod 4   │
    │Healthy │  │Healthy │ │Failed  │ │Slow    │
    │        │  │        │ │(Ejected)│ │(Ejected)│
    └────────┘  └────────┘ └────────┘ └────────┘
```

## Tutorial Exercises

### Exercise 1: Basic Circuit Breaker

**Deploy Test Application:**
```bash
kubectl apply -f 01-httpbin-app.yaml
```

**Configure Circuit Breaker:**
```bash
kubectl apply -f 02-circuit-breaker-basic.yaml
```

This limits:
- Max 1 connection per instance
- Max 1 pending request
- Ejects instance after 1 consecutive error

**Test Circuit Breaker:**
```bash
# Generate traffic to trigger circuit breaker
kubectl apply -f 03-load-generator.yaml

# Watch for circuit breaker activation
kubectl logs -n test -l app=fortio-client -f
```

### Exercise 2: Connection Pool Limits

**Configure Connection Pool:**
```bash
kubectl apply -f 04-connection-pool.yaml
```

**Test with Concurrent Requests:**
```bash
# Send concurrent requests
kubectl exec -n test deploy/fortio-client -- \
  fortio load -c 10 -qps 0 -n 100 -loglevel Warning \
  http://httpbin:8000/get

# Check for 503 errors (circuit breaker open)
```

Expected: Some requests fail with 503 when pool is exhausted.

### Exercise 3: Outlier Detection

**Configure Outlier Detection:**
```bash
kubectl apply -f 05-outlier-detection.yaml
```

**Simulate Failures:**
```bash
# Deploy flaky service version
kubectl apply -f 06-flaky-service.yaml

# Generate traffic
for i in {1..100}; do
  kubectl exec -n test deploy/curl-client -- \
    curl -s -o /dev/null -w "%{http_code}\n" httpbin:8000/status/500
  sleep 0.1
done
```

**Monitor Ejections:**
```bash
# Check proxy stats
istioctl proxy-config endpoints deploy/curl-client -n test

# Look for HEALTHY vs UNHEALTHY status
```

### Exercise 4: Progressive Circuit Breaker

**Configure Progressive Settings:**
```bash
kubectl apply -f 07-progressive-cb.yaml
```

This implements:
- 3 consecutive errors before ejection
- 30s ejection time
- 50% max ejection percentage
- 10s scan interval

**Test:**
```bash
# Run load test
kubectl exec -n test deploy/fortio-client -- \
  fortio load -c 5 -qps 100 -t 60s -loglevel Info \
  http://httpbin:8000/status/500
```

### Exercise 5: Bulkhead Pattern

**Configure Bulkheads:**
```bash
kubectl apply -f 08-bulkhead-pattern.yaml
```

Isolates different clients:
- Premium users: dedicated connection pool
- Regular users: shared connection pool

**Test:**
```bash
# Premium user traffic
kubectl exec -n test deploy/premium-client -- \
  fortio load -c 10 -qps 0 -n 100 http://httpbin:8000/get

# Regular user traffic (should not affect premium)
kubectl exec -n test deploy/regular-client -- \
  fortio load -c 50 -qps 0 -n 500 http://httpbin:8000/get
```

### Exercise 6: Panic Threshold

**Configure Panic Threshold:**
```bash
kubectl apply -f 09-panic-threshold.yaml
```

When more than 50% of instances are unhealthy, Envoy enters "panic mode" and load balances across all instances.

**Test:**
```bash
# Scale down to trigger panic mode
kubectl scale deployment httpbin-v1 -n test --replicas=2

# Cause failures in 1 instance
kubectl exec -n test <pod-name> -- pkill -9 httpbin

# Monitor behavior
istioctl proxy-status
```

### Exercise 7: Circuit Breaker with Retries

**Combine Circuit Breaker with Retry Policy:**
```bash
kubectl apply -f 10-cb-with-retries.yaml
```

**Test:**
```bash
# Generate intermittent failures
kubectl apply -f 11-intermittent-failures.yaml

# Send requests and observe retry behavior
kubectl exec -n test deploy/curl-client -- \
  curl -v http://httpbin:8000/status/503
```

### Exercise 8: Monitoring Circuit Breakers

**Access Metrics:**
```bash
# Port-forward Prometheus
kubectl port-forward -n istio-system svc/prometheus 9090:9090

# Query circuit breaker metrics
# URL: http://localhost:9090
# Query: envoy_cluster_upstream_rq_pending_overflow
```

**Grafana Dashboard:**
```bash
# Port-forward Grafana
kubectl port-forward -n istio-system svc/grafana 3000:3000

# Open Istio Mesh Dashboard
# URL: http://localhost:3000
```

## Configuration Reference

### Connection Pool Settings

```yaml
trafficPolicy:
  connectionPool:
    tcp:
      maxConnections: 100        # Max TCP connections
      connectTimeout: 30s        # Connection timeout
      tcpKeepalive:
        time: 7200s
        interval: 75s
    http:
      http1MaxPendingRequests: 50      # Max pending HTTP/1.1 requests
      http2MaxRequests: 100            # Max HTTP/2 requests
      maxRequestsPerConnection: 2      # Max requests per connection
      maxRetries: 3                    # Max retry requests
      idleTimeout: 60s                 # Idle connection timeout
```

### Outlier Detection Settings

```yaml
trafficPolicy:
  outlierDetection:
    consecutive5xxErrors: 5           # Errors before ejection
    consecutiveGatewayErrors: 3       # Gateway errors before ejection
    interval: 10s                     # Detection interval
    baseEjectionTime: 30s             # Min ejection duration
    maxEjectionPercent: 50            # Max % of hosts ejected
    minHealthPercent: 10              # Min % of hosts that must be healthy
```

## Verification

### Check Circuit Breaker Status

```bash
# Get proxy configuration
istioctl proxy-config cluster deploy/curl-client -n test --fqdn httpbin.test.svc.cluster.local -o json

# Look for circuit_breakers section
```

### Monitor Metrics

```bash
# Envoy stats
kubectl exec -n test deploy/curl-client -c istio-proxy -- \
  curl localhost:15000/stats | grep -i circuit

# Key metrics:
# - upstream_rq_pending_overflow: Requests rejected due to circuit breaker
# - upstream_rq_retry_overflow: Retries rejected
# - outlier_detection.ejections_active: Currently ejected hosts
```

### Test Circuit Breaker

```bash
# Generate load that triggers circuit breaker
kubectl exec -n test deploy/fortio-client -- \
  fortio load -c 20 -qps 0 -n 200 -loglevel Warning \
  http://httpbin:8000/delay/3

# Check for 503 errors indicating circuit breaker activation
```

## Troubleshooting

### Circuit Breaker Not Activating

```bash
# Verify DestinationRule is applied
kubectl get destinationrule -n test

# Check configuration
istioctl analyze -n test

# Verify connection pool settings in proxy
istioctl proxy-config cluster deploy/curl-client -n test -o json | jq '.[] | select(.name | contains("httpbin")) | .circuitBreakers'
```

### Too Many Ejections

```bash
# Increase maxEjectionPercent
# Increase baseEjectionTime
# Decrease consecutive5xxErrors threshold

# Check current ejections
istioctl proxy-config endpoints deploy/curl-client -n test
```

### No Metrics Available

```bash
# Ensure Prometheus is installed
kubectl get svc -n istio-system prometheus

# Check Envoy admin interface
kubectl exec -n test deploy/curl-client -c istio-proxy -- \
  curl localhost:15000/stats
```

## Best Practices

1. **Set Realistic Limits**: Based on service capacity and SLOs
2. **Test Thoroughly**: Use load testing to find right thresholds
3. **Monitor Actively**: Watch circuit breaker metrics
4. **Gradual Ejection**: Don't eject all instances at once
5. **Combine with Retries**: But avoid retry storms
6. **Use Timeouts**: Prevent slow responses from blocking pools
7. **Implement Fallbacks**: Graceful degradation when circuit is open
8. **Document Thresholds**: Explain why specific values were chosen

## Common Patterns

### Conservative Circuit Breaker
```yaml
consecutive5xxErrors: 10
baseEjectionTime: 60s
maxEjectionPercent: 20
```

### Aggressive Circuit Breaker
```yaml
consecutive5xxErrors: 3
baseEjectionTime: 30s
maxEjectionPercent: 75
```

### Balanced Approach
```yaml
consecutive5xxErrors: 5
baseEjectionTime: 30s
maxEjectionPercent: 50
```

## Cleanup

```bash
kubectl delete namespace test
```

## Next Steps

- [04_mtls](../04_mtls/): Implement mutual TLS security
- Integrate circuit breakers with monitoring alerts
- Implement custom fallback logic in applications
- Test chaos engineering scenarios

## Resources

- [Istio Circuit Breaking](https://istio.io/latest/docs/tasks/traffic-management/circuit-breaking/)
- [Envoy Circuit Breaking](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/circuit_breaking)
- [Outlier Detection](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/outlier)
