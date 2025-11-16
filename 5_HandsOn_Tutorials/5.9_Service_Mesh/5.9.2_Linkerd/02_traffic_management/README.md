# Linkerd Tutorial 02: Traffic Management

## Overview

Learn traffic management in Linkerd using TrafficSplits for canary deployments, A/B testing, and blue-green deployments. Linkerd's approach is simpler than Istio but covers essential use cases.

## Learning Objectives

- Use TrafficSplit for weighted routing
- Implement canary deployments
- Configure A/B testing
- Monitor traffic distribution
- Use ServiceProfiles for per-route metrics

## Key Concepts

### TrafficSplit
SMI (Service Mesh Interface) resource for traffic splitting:
- Weight-based routing
- Gradual rollouts
- Canary deployments

### ServiceProfile
Linkerd-specific resource:
- Per-route metrics
- Retry budgets
- Timeout configuration

## Tutorial Exercises

### Exercise 1: Basic Traffic Split (50/50)

**Deploy Two Versions:**
```bash
kubectl apply -f 01-app-versions.yaml
```

**Create TrafficSplit:**
```bash
kubectl apply -f - <<EOF
apiVersion: split.smi-spec.io/v1alpha1
kind: TrafficSplit
metadata:
  name: backend-split
spec:
  service: backend
  backends:
    - service: backend-v1
      weight: 500m  # 50%
    - service: backend-v2
      weight: 500m  # 50%
EOF
```

**Test:**
```bash
# Send 100 requests
for i in {1..100}; do
  kubectl exec deploy/curl-client -- curl -s backend:8080/version
done | sort | uniq -c
```

### Exercise 2: Canary Deployment

**Progressive Rollout:**
```bash
# Start: 95% v1, 5% v2 (canary)
kubectl apply -f 02-canary-5-95.yaml

# Monitor for issues
linkerd viz stat trafficsplit

# Increase canary
kubectl apply -f 03-canary-25-75.yaml

# Full rollout
kubectl apply -f 04-canary-100.yaml
```

**Example TrafficSplit:**
```yaml
apiVersion: split.smi-spec.io/v1alpha1
kind: TrafficSplit
metadata:
  name: backend-canary
spec:
  service: backend
  backends:
    - service: backend-stable
      weight: 900m  # 90%
    - service: backend-canary
      weight: 100m  # 10%
```

### Exercise 3: ServiceProfile for Route Metrics

**Create ServiceProfile:**
```bash
# Auto-generate from running traffic
linkerd viz profile --tap deploy/backend --tap-duration 30s backend.default.svc.cluster.local

# Or manually create
kubectl apply -f 05-service-profile.yaml
```

```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: backend.default.svc.cluster.local
spec:
  routes:
    - name: GET /api/users
      condition:
        method: GET
        pathRegex: /api/users
      isRetryable: true
      timeout: 10s
    - name: POST /api/users
      condition:
        method: POST
        pathRegex: /api/users
      isRetryable: false
```

**View Route Metrics:**
```bash
linkerd viz routes deploy/backend

# Shows per-route success rates and latency
```

### Exercise 4: Blue-Green Deployment

**Setup:**
```bash
# All traffic to blue
kubectl apply -f 06-blue-green-blue.yaml

# Instant switch to green
kubectl apply -f 07-blue-green-green.yaml

# Rollback if needed
kubectl apply -f 06-blue-green-blue.yaml
```

## Verification

```bash
# Monitor traffic split
linkerd viz stat trafficsplit

# Check routes
linkerd viz routes deploy/backend

# Tap live traffic
linkerd viz tap deploy/backend --to deploy/backend-v1
linkerd viz tap deploy/backend --to deploy/backend-v2
```

## Best Practices

1. **Start with Small Canary**: 5-10%
2. **Monitor Metrics**: Watch error rates
3. **Use ServiceProfiles**: For detailed metrics
4. **Gradual Rollout**: Don't rush to 100%
5. **Have Rollback Plan**: Quick revert capability

## Next Steps

- [03_retries_timeouts](../03_retries_timeouts/): Configure retries and timeouts
- Implement automated canary analysis
- Integrate with Flagger for progressive delivery

## Resources

- [Linkerd Traffic Split](https://linkerd.io/2/tasks/traffic-split/)
- [ServiceProfile Guide](https://linkerd.io/2/features/service-profiles/)
- [SMI TrafficSplit Spec](https://github.com/servicemeshinterface/smi-spec/blob/main/apis/traffic-split/v1alpha4/traffic-split.md)
