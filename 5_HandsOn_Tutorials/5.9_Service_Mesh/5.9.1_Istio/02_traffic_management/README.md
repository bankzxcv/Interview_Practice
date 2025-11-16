# Istio Tutorial 02: Traffic Management

## Overview

Master Istio's traffic management capabilities using VirtualServices and DestinationRules. Learn to implement canary deployments, A/B testing, traffic splitting, and header-based routing.

## Learning Objectives

- Understand VirtualService and DestinationRule resources
- Implement traffic splitting and weighted routing
- Configure canary deployments
- Route traffic based on headers and URI
- Implement A/B testing
- Configure load balancing strategies
- Use traffic mirroring for testing

## Prerequisites

- Completed Tutorial 01 (Istio Installation)
- Kubernetes cluster with Istio installed
- Sample application deployed
- kubectl and istioctl configured

## Key Concepts

### VirtualService

Defines how requests are routed to services. Key features:
- Match conditions (headers, URI, method)
- Routing rules and destinations
- Traffic splitting with weights
- Retry and timeout policies
- Fault injection

### DestinationRule

Defines policies that apply to traffic after routing. Key features:
- Subsets (versions) of a service
- Load balancing strategies
- Connection pool settings
- Circuit breaker configuration
- TLS settings

### Traffic Flow

```
Request → Gateway → VirtualService → DestinationRule → Service → Pods
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Istio Gateway                    │
│      (External Entry Point)              │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│        VirtualService                    │
│    (Routing Rules & Logic)               │
│  • Match: headers, URI, method           │
│  • Route: destinations, weights          │
│  • Modify: headers, URIs                 │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│       DestinationRule                    │
│   (Traffic Policy & Subsets)             │
│  • Subsets: v1, v2, v3                   │
│  • Load Balancing: Round Robin, Random   │
│  • Circuit Breaker: Timeout, Retries     │
└──────────────┬──────────────────────────┘
               ↓
┌──────────────┴──────────────────────────┐
│                                          │
│   ┌─────────┐         ┌─────────┐      │
│   │ Pod v1  │         │ Pod v2  │      │
│   └─────────┘         └─────────┘      │
└─────────────────────────────────────────┘
```

## Tutorial Exercises

### Exercise 1: Basic Traffic Splitting (50/50)

**Deploy Application:**
```bash
kubectl apply -f 01-bookinfo-app.yaml
```

**Configure Traffic Splitting:**
```bash
kubectl apply -f 02-traffic-split-50-50.yaml
```

**Test:**
```bash
# Send 100 requests
for i in {1..100}; do
  kubectl exec -n bookinfo deploy/curl-client -- curl -s productpage:9080/productpage | grep -o "Reviews served by: reviews-v[12]"
done | sort | uniq -c
```

Expected: ~50 requests to v1, ~50 to v2

### Exercise 2: Canary Deployment (90/10)

**Deploy Canary Configuration:**
```bash
kubectl apply -f 03-canary-deployment.yaml
```

This routes 90% traffic to stable (v1) and 10% to canary (v2).

**Monitor:**
```bash
# Watch traffic distribution
watch -n 1 'kubectl exec -n bookinfo deploy/curl-client -- curl -s productpage:9080/productpage | grep -o "Reviews served by: reviews-v[12]"'
```

**Gradually Increase Canary:**
```bash
# Update to 20/80
kubectl apply -f 04-canary-20-80.yaml

# Then 50/50
kubectl apply -f 02-traffic-split-50-50.yaml

# Finally 100% canary
kubectl apply -f 05-canary-100.yaml
```

### Exercise 3: Header-Based Routing (A/B Testing)

**Configure Header Routing:**
```bash
kubectl apply -f 06-header-routing.yaml
```

**Test:**
```bash
# Regular users get v1
kubectl exec -n bookinfo deploy/curl-client -- curl -s productpage:9080/productpage

# Beta users get v2
kubectl exec -n bookinfo deploy/curl-client -- curl -s -H "x-user-group: beta" productpage:9080/productpage
```

### Exercise 4: URI-Based Routing

**Configure URI Routing:**
```bash
kubectl apply -f 07-uri-routing.yaml
```

**Test:**
```bash
# API v1 endpoint
kubectl exec -n bookinfo deploy/curl-client -- curl -s productpage:9080/api/v1/data

# API v2 endpoint
kubectl exec -n bookinfo deploy/curl-client -- curl -s productpage:9080/api/v2/data
```

### Exercise 5: Load Balancing Strategies

**Round Robin (Default):**
```bash
kubectl apply -f 08-lb-round-robin.yaml
```

**Random:**
```bash
kubectl apply -f 09-lb-random.yaml
```

**Least Request:**
```bash
kubectl apply -f 10-lb-least-request.yaml
```

**Consistent Hash (Session Affinity):**
```bash
kubectl apply -f 11-lb-consistent-hash.yaml
```

### Exercise 6: Traffic Mirroring

**Mirror 100% traffic to v2 for testing:**
```bash
kubectl apply -f 12-traffic-mirror.yaml
```

All production traffic goes to v1, but v2 receives a copy for testing (responses discarded).

**Monitor Mirrored Traffic:**
```bash
kubectl logs -n bookinfo -l version=v2 -f
```

### Exercise 7: Timeout Configuration

**Set Timeouts:**
```bash
kubectl apply -f 13-timeout.yaml
```

**Test Timeout:**
```bash
# This should timeout after 2 seconds
kubectl exec -n bookinfo deploy/curl-client -- curl -s -w "\nTime: %{time_total}s\n" productpage:9080/slow-endpoint
```

### Exercise 8: Retry Policy

**Configure Retries:**
```bash
kubectl apply -f 14-retry-policy.yaml
```

**Test:**
```bash
# Simulate failures and watch retries
kubectl logs -n bookinfo -l app=reviews -f
```

## Verification

### Check VirtualServices

```bash
# List all VirtualServices
kubectl get virtualservice -A

# Describe specific VirtualService
kubectl describe virtualservice reviews -n bookinfo

# Validate configuration
istioctl analyze -n bookinfo
```

### Check DestinationRules

```bash
# List all DestinationRules
kubectl get destinationrule -A

# Describe specific DestinationRule
kubectl describe destinationrule reviews -n bookinfo
```

### Monitor Traffic

```bash
# Proxy status
istioctl proxy-status

# Proxy configuration
istioctl proxy-config routes deploy/productpage-v1 -n bookinfo

# Test traffic flow
for i in {1..20}; do
  kubectl exec -n bookinfo deploy/curl-client -- curl -s productpage:9080/productpage
  sleep 0.5
done
```

## Common Patterns

### Blue-Green Deployment

All traffic to blue, instant switch to green:

```yaml
# Blue
weight: 100
# Green
weight: 0
```

Then update to:

```yaml
# Blue
weight: 0
# Green
weight: 100
```

### Progressive Canary

Gradually increase canary traffic:
- Week 1: 5%
- Week 2: 25%
- Week 3: 50%
- Week 4: 100%

### Feature Flags

Route based on user attributes:
- Internal users → v2 (new features)
- External users → v1 (stable)

## Troubleshooting

### Traffic Not Routing Correctly

```bash
# Check VirtualService configuration
istioctl analyze -n bookinfo

# Verify routes
istioctl proxy-config routes deploy/productpage-v1 -n bookinfo -o json

# Check logs
kubectl logs -n bookinfo -l app=productpage -c istio-proxy
```

### Subset Not Found Error

```bash
# Ensure DestinationRule defines the subset
kubectl get destinationrule reviews -n bookinfo -o yaml

# Verify pod labels match subset selectors
kubectl get pods -n bookinfo -l version=v1 --show-labels
```

### No Response from Service

```bash
# Check service exists
kubectl get svc reviews -n bookinfo

# Check endpoint has pods
kubectl get endpoints reviews -n bookinfo

# Verify proxy can reach service
istioctl proxy-config endpoints deploy/productpage-v1 -n bookinfo
```

## Best Practices

1. **Always Define DestinationRule First**: Before creating VirtualService
2. **Use Consistent Labels**: Match subset selectors with pod labels
3. **Test Configuration**: Use `istioctl analyze` before applying
4. **Monitor Metrics**: Watch traffic distribution in Kiali or Prometheus
5. **Gradual Rollouts**: Use small increments for canary deployments
6. **Set Timeouts**: Prevent cascading failures
7. **Configure Retries**: But be careful of retry storms
8. **Use Traffic Mirroring**: Test new versions with production traffic

## Cleanup

```bash
# Remove all VirtualServices and DestinationRules
kubectl delete virtualservice --all -n bookinfo
kubectl delete destinationrule --all -n bookinfo

# Or delete entire namespace
kubectl delete namespace bookinfo
```

## Next Steps

- [03_circuit_breaking](../03_circuit_breaking/): Implement circuit breakers and outlier detection
- Explore advanced routing with regex
- Implement multi-cluster traffic management
- Integrate with CI/CD for automated canary deployments

## Resources

- [Istio Traffic Management](https://istio.io/latest/docs/concepts/traffic-management/)
- [VirtualService Reference](https://istio.io/latest/docs/reference/config/networking/virtual-service/)
- [DestinationRule Reference](https://istio.io/latest/docs/reference/config/networking/destination-rule/)
