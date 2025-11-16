# Istio Tutorial 06: Resilience Patterns

## Overview

Implement resilience patterns including retries, timeouts, and fault injection. Learn to build robust microservices that gracefully handle failures and network issues.

## Learning Objectives

- Configure retry policies
- Set appropriate timeouts
- Implement fault injection for chaos testing
- Handle partial failures
- Test resilience strategies
- Avoid retry storms
- Implement fallback patterns

## Key Patterns

### Retry Policy
Automatically retry failed requests with configurable attempts and conditions.

### Timeout
Set maximum wait time for responses to prevent resource exhaustion.

### Fault Injection
Intentionally inject faults to test system resilience:
- **Delay**: Add latency
- **Abort**: Return error codes

## Tutorial Exercises

### Exercise 1: Basic Retry Configuration

**Deploy Application:**
```bash
kubectl apply -f 01-retry-demo-app.yaml
```

**Configure Retries:**
```bash
kubectl apply -f 02-retry-policy.yaml
```

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
    - reviews
  http:
    - route:
        - destination:
            host: reviews
      retries:
        attempts: 3
        perTryTimeout: 2s
        retryOn: 5xx,reset,connect-failure
```

**Test:**
```bash
# Simulate intermittent failures
kubectl apply -f 03-flaky-service.yaml

# Send requests and watch retries
kubectl exec deploy/curl-client -- sh -c \
  'for i in {1..20}; do curl -s reviews:9080 || echo "failed"; sleep 1; done'
```

### Exercise 2: Timeout Configuration

**Set Timeouts:**
```bash
kubectl apply -f 04-timeout-policy.yaml
```

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ratings
spec:
  hosts:
    - ratings
  http:
    - route:
        - destination:
            host: ratings
      timeout: 3s
```

**Test:**
```bash
# Deploy slow service
kubectl apply -f 05-slow-service.yaml

# Request with timeout
kubectl exec deploy/curl-client -- \
  curl -v http://ratings:9080/slow
# Should timeout after 3 seconds
```

### Exercise 3: Delay Fault Injection

**Inject Delays:**
```bash
kubectl apply -f 06-fault-delay.yaml
```

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
    - reviews
  http:
    - fault:
        delay:
          percentage:
            value: 50.0
          fixedDelay: 5s
      route:
        - destination:
            host: reviews
```

**Test Impact:**
```bash
# Send requests and measure latency
kubectl exec deploy/curl-client -- sh -c \
  'for i in {1..10}; do
    time curl -s http://reviews:9080 > /dev/null
  done'
```

### Exercise 4: Abort Fault Injection

**Inject Errors:**
```bash
kubectl apply -f 07-fault-abort.yaml
```

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
    - reviews
  http:
    - fault:
        abort:
          percentage:
            value: 10.0
          httpStatus: 503
      route:
        - destination:
            host: reviews
```

**Test:**
```bash
# Send 100 requests, expect ~10 failures
kubectl exec deploy/curl-client -- sh -c \
  'for i in {1..100}; do
    curl -s -o /dev/null -w "%{http_code}\n" http://reviews:9080
  done | sort | uniq -c'
```

### Exercise 5: Combined Resilience

**Retries + Timeouts + Circuit Breaker:**
```bash
kubectl apply -f 08-combined-resilience.yaml
```

**Test Cascade Failure Prevention:**
```bash
# Generate load
kubectl apply -f 09-load-generator.yaml

# Monitor metrics
kubectl exec deploy/prometheus -- \
  curl -s 'http://localhost:9090/api/v1/query?query=istio_requests_total'
```

### Exercise 6: Chaos Testing

**Comprehensive Chaos Scenarios:**
```bash
# Scenario 1: Network partition
kubectl apply -f 10-chaos-network-partition.yaml

# Scenario 2: Pod failure
kubectl apply -f 11-chaos-pod-failure.yaml

# Scenario 3: Resource exhaustion
kubectl apply -f 12-chaos-resource-exhaustion.yaml
```

## Best Practices

1. **Set Realistic Timeouts**: Based on P99 latency + buffer
2. **Limit Retry Attempts**: Typically 2-3 attempts
3. **Use Exponential Backoff**: Avoid retry storms
4. **Retry Only Idempotent Operations**: GET, PUT (not POST)
5. **Test with Fault Injection**: Before production
6. **Monitor Retry Metrics**: Watch for excessive retries
7. **Implement Circuit Breakers**: Complement retries

## Verification

```bash
# Check retry metrics
kubectl exec deploy/prometheus -n istio-system -- \
  curl -s 'http://localhost:9090/api/v1/query?query=istio_request_retries_total'

# View timeout metrics
kubectl exec deploy/prometheus -n istio-system -- \
  curl -s 'http://localhost:9090/api/v1/query?query=istio_request_timeout_total'
```

## Next Steps

- [07_multi_cluster](../07_multi_cluster/): Deploy multi-cluster service mesh
- Implement bulkhead pattern
- Add fallback services
- Configure health checks

## Resources

- [Istio Fault Injection](https://istio.io/latest/docs/tasks/traffic-management/fault-injection/)
- [Retry and Timeout](https://istio.io/latest/docs/concepts/traffic-management/#retries)
- [Chaos Engineering](https://principlesofchaos.org/)
