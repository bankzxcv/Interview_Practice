# Linkerd Tutorial 05: Observability

## Overview

Explore Linkerd's built-in observability with the Linkerd Viz dashboard, Prometheus metrics, Grafana dashboards, and distributed tracing with Jaeger.

## Learning Objectives

- Use Linkerd Viz dashboard
- Access Grafana dashboards
- Configure distributed tracing
- Monitor service health and performance
- Debug issues with tap and top commands
- Create custom metrics

## Linkerd Observability Stack

```
┌──────────────────────────────────────────┐
│       Linkerd Data Plane                  │
│    (Proxies collect metrics/traces)       │
└──────────────┬───────────────────────────┘
               ↓
┌──────────────────────────────────────────┐
│      linkerd-viz (Observability)          │
│  ┌────────────────────────────────────┐  │
│  │  Prometheus (Metrics Storage)      │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Grafana (Visualization)           │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Web Dashboard (Linkerd UI)        │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Tap (Live Traffic)                │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Tutorial Exercises

### Exercise 1: Linkerd Dashboard

**Access Dashboard:**
```bash
linkerd viz dashboard

# Opens at: http://localhost:50750
```

**Dashboard Features:**
- Service topology graph
- Golden metrics (success rate, RPS, latency)
- Top routes
- Live traffic (tap)
- Service details

**Navigate:**
1. **Overview**: Cluster-wide metrics
2. **Namespaces**: Per-namespace view
3. **Deployments**: Service metrics
4. **Pods**: Individual pod stats
5. **Routes**: Per-route metrics (requires ServiceProfile)
6. **Tap**: Live request inspection

### Exercise 2: CLI Observability Commands

**Stat (Statistics):**
```bash
# Deployment stats
linkerd viz stat deployment -n emojivoto

# Shows: SUCCESS, RPS, P50, P95, P99 latency

# All namespaces
linkerd viz stat deployment -A

# Specific service
linkerd viz stat deploy/web -n emojivoto
```

**Routes (Per-Route Metrics):**
```bash
# Requires ServiceProfile
linkerd viz routes deploy/web -n emojivoto

# Shows per-route:
# - Success rate
# - RPS
# - Latencies
```

**Top (Real-Time Top Services):**
```bash
# Top services by RPS
linkerd viz top deploy/web -n emojivoto

# Shows live traffic like Unix 'top'
```

**Tap (Live Traffic):**
```bash
# Watch live requests
linkerd viz tap deploy/web -n emojivoto

# Filter by destination
linkerd viz tap deploy/web --to deploy/emoji

# Filter by path
linkerd viz tap deploy/web --path /api/vote
```

**Edges (Service Connections):**
```bash
# Show service-to-service connections
linkerd viz edges deployment -n emojivoto

# Shows: SRC, DST, CLIENT_ID, SERVER_ID, SECURED
```

### Exercise 3: Prometheus Metrics

**Access Prometheus:**
```bash
kubectl port-forward -n linkerd-viz svc/prometheus 9090:9090
# Open: http://localhost:9090
```

**Key Linkerd Metrics:**
```promql
# Request rate
sum(rate(request_total[5m])) by (dst_deployment)

# Success rate
sum(rate(response_total{classification="success"}[5m]))
/
sum(rate(response_total[5m]))

# P99 latency
histogram_quantile(0.99,
  sum(rate(response_latency_ms_bucket[5m])) by (le, dst_deployment)
)

# mTLS connections
sum(request_total{tls="true"}) by (dst_deployment)
```

### Exercise 4: Grafana Dashboards

**Access Grafana:**
```bash
kubectl port-forward -n linkerd-viz svc/grafana 3000:3000
# Open: http://localhost:3000
```

**Pre-built Dashboards:**
1. **Linkerd Top Line**: Overall mesh health
2. **Linkerd Deployment**: Per-deployment metrics
3. **Linkerd Pod**: Individual pod metrics
4. **Linkerd Service**: Service-level metrics
5. **Linkerd Route**: Per-route metrics
6. **Linkerd Authority**: Authority-level metrics

**Create Custom Dashboard:**
```bash
kubectl apply -f 01-custom-dashboard.json
```

### Exercise 5: Distributed Tracing

**Install Jaeger:**
```bash
# Install Jaeger in linkerd-viz namespace
kubectl apply -f 02-jaeger-install.yaml
```

**Configure Linkerd for Tracing:**
```bash
# Upgrade Linkerd with Jaeger integration
linkerd upgrade --set proxyInit.xtMountPath.mountPath=/run \
  --set proxy.trace.enabled=true \
  --set proxy.trace.collector=jaeger-collector.linkerd-viz:55678 \
  | kubectl apply -f -
```

**Access Jaeger:**
```bash
kubectl port-forward -n linkerd-viz svc/jaeger-query 16686:16686
# Open: http://localhost:16686
```

**View Traces:**
1. Select service
2. Find traces
3. Analyze request flow
4. Identify latency bottlenecks

### Exercise 6: ServiceProfile for Detailed Metrics

**Auto-Generate from Traffic:**
```bash
# Capture live traffic for 1 minute
linkerd viz profile --tap deploy/web -n emojivoto --tap-duration 60s web.emojivoto.svc.cluster.local > web-profile.yaml

# Apply
kubectl apply -f web-profile.yaml
```

**Manual ServiceProfile:**
```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: web.emojivoto.svc.cluster.local
  namespace: emojivoto
spec:
  routes:
    - name: GET /api/list
      condition:
        method: GET
        pathRegex: /api/list
    - name: POST /api/vote
      condition:
        method: POST
        pathRegex: /api/vote
```

**View Route Metrics:**
```bash
linkerd viz routes deploy/web -n emojivoto
```

### Exercise 7: Alerting with Prometheus

**Configure Alerts:**
```bash
kubectl apply -f 03-prometheus-alerts.yaml
```

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
  namespace: linkerd-viz
data:
  alerts.yml: |
    groups:
      - name: linkerd_alerts
        rules:
          - alert: HighErrorRate
            expr: |
              (sum(rate(response_total{classification!="success"}[5m])) /
               sum(rate(response_total[5m]))) > 0.05
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High error rate detected"

          - alert: HighLatency
            expr: |
              histogram_quantile(0.99,
                sum(rate(response_latency_ms_bucket[5m])) by (le)
              ) > 1000
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High latency detected"
```

### Exercise 8: Debug with Tap

**Debug Slow Requests:**
```bash
# Find slow requests (> 100ms)
linkerd viz tap deploy/web --path /api/vote \
  | awk '/latency=[0-9]+ms/ && $NF > 100'
```

**Debug Errors:**
```bash
# Show failed requests
linkerd viz tap deploy/web | grep status=500
```

**Debug Specific User Flow:**
```bash
# Follow request through services
linkerd viz tap deploy/web --to deploy/emoji
linkerd viz tap deploy/emoji --to deploy/voting
```

## Verification

```bash
# Check viz components
kubectl get pods -n linkerd-viz

# Test metrics collection
linkerd viz stat deploy -A

# Verify tap works
linkerd viz tap deploy/web -n emojivoto --timeout 10s
```

## Best Practices

1. **Use ServiceProfiles**: For per-route metrics
2. **Monitor Golden Metrics**: Success rate, RPS, latency
3. **Set Up Alerts**: On SLOs, not every metric
4. **Regular Dashboard Review**: Weekly service health checks
5. **Use Tap for Debugging**: Real-time request inspection
6. **Export Metrics**: To long-term storage
7. **Correlate Metrics and Traces**: Faster troubleshooting

## Troubleshooting

### No Metrics Showing

```bash
# Check Prometheus
kubectl logs -n linkerd-viz deploy/prometheus

# Verify scrape targets
kubectl port-forward -n linkerd-viz svc/prometheus 9090:9090
# Visit: http://localhost:9090/targets

# Check proxy metrics endpoint
kubectl exec -n emojivoto deploy/web -c linkerd-proxy -- \
  curl localhost:4191/metrics
```

### Dashboard Not Loading

```bash
# Check web pod
kubectl logs -n linkerd-viz deploy/web

# Restart viz
linkerd viz install | kubectl apply -f -
```

## Cleanup

```bash
# Viz is part of Linkerd, uninstall if needed
linkerd viz uninstall | kubectl delete -f -
```

## Next Steps

- [06_multi_cluster](../06_multi_cluster/): Multi-cluster observability
- Set up long-term metrics storage
- Integrate with external monitoring
- Configure SLO dashboards

## Resources

- [Linkerd Observability](https://linkerd.io/2/features/telemetry/)
- [Dashboard Guide](https://linkerd.io/2/reference/cli/viz/)
- [Grafana Dashboards](https://linkerd.io/2/tasks/grafana/)
