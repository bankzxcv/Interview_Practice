# Istio Tutorial 05: Observability

## Overview

Master Istio's observability stack including Kiali for service mesh visualization, Jaeger for distributed tracing, Prometheus for metrics, and Grafana for dashboards. Learn to monitor, trace, and debug microservices effectively.

## Learning Objectives

- Deploy and configure observability tools (Kiali, Jaeger, Prometheus, Grafana)
- Visualize service mesh topology with Kiali
- Implement distributed tracing with Jaeger
- Create custom metrics and dashboards
- Monitor service health and performance
- Debug latency and errors
- Configure telemetry collection

## Prerequisites

- Completed Tutorial 04 (mTLS)
- Understanding of metrics, traces, and logs
- Basic Prometheus and Grafana knowledge

## Observability Stack

```
┌───────────────────────────────────────────────┐
│            Service Mesh Traffic                │
│     (HTTP, gRPC, TCP with Envoy Proxies)      │
└───────────┬──────────────┬───────────────┬────┘
            │              │               │
            ↓              ↓               ↓
    ┌──────────┐   ┌─────────────┐  ┌─────────┐
    │ Metrics  │   │   Traces    │  │  Logs   │
    │(Envoy)   │   │  (Envoy)    │  │(Envoy)  │
    └────┬─────┘   └──────┬──────┘  └────┬────┘
         │                │              │
         ↓                ↓              ↓
    ┌──────────┐   ┌─────────────┐  ┌─────────┐
    │Prometheus│   │   Jaeger    │  │  Loki   │
    │(Storage) │   │  (Storage)  │  │(Storage)│
    └────┬─────┘   └──────┬──────┘  └────┬────┘
         │                │              │
         ↓                ↓              ↓
    ┌──────────┐   ┌─────────────┐  ┌─────────┐
    │ Grafana  │   │   Kiali     │  │ Grafana │
    │(Dashboards)  │(Visualization)  │  (Logs) │
    └──────────┘   └─────────────┘  └─────────┘
```

## Components

### Kiali
- Service mesh topology visualization
- Traffic flow and metrics
- Configuration validation
- Distributed tracing integration
- Health checks

### Jaeger
- Distributed tracing
- Request path visualization
- Latency analysis
- Root cause analysis
- Performance optimization

### Prometheus
- Metrics collection and storage
- Time-series database
- Query language (PromQL)
- Alerting rules
- Service discovery

### Grafana
- Metrics visualization
- Custom dashboards
- Alerting
- Multi-datasource support
- Template variables

## Installation

### Install Observability Add-ons

```bash
# Install all observability tools
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/grafana.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/jaeger.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/kiali.yaml

# Or use the comprehensive installation
kubectl apply -f 01-observability-stack.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod --all -n istio-system --timeout=300s
```

### Access Dashboards

```bash
# Kiali
kubectl port-forward -n istio-system svc/kiali 20001:20001
# URL: http://localhost:20001

# Jaeger
kubectl port-forward -n istio-system svc/tracing 16686:16686
# URL: http://localhost:16686

# Prometheus
kubectl port-forward -n istio-system svc/prometheus 9090:9090
# URL: http://localhost:9090

# Grafana
kubectl port-forward -n istio-system svc/grafana 3000:3000
# URL: http://localhost:3000
```

## Tutorial Exercises

### Exercise 1: Kiali - Service Mesh Visualization

**Deploy Application:**
```bash
kubectl apply -f 02-bookinfo-observability.yaml
```

**Generate Traffic:**
```bash
# Run load generator
kubectl apply -f 03-load-generator.yaml
```

**Explore Kiali:**
1. Open Kiali: http://localhost:20001
2. Navigate to Graph
3. Select namespace: bookinfo
4. Choose display options:
   - Traffic animation
   - Service nodes
   - Response time
   - Request rate
   - Error rate
5. Inspect service details
6. View traffic distribution

**Key Features to Explore:**
- Service graph with traffic flow
- Request rate and latency metrics
- Error rates and status codes
- mTLS indicators
- Virtual service and destination rule configs

### Exercise 2: Distributed Tracing with Jaeger

**Enable Tracing:**
```bash
kubectl apply -f 04-tracing-config.yaml
```

**Generate Traced Requests:**
```bash
# Send requests with trace headers
kubectl exec -n bookinfo deploy/curl-client -- \
  curl -H "x-b3-sampled: 1" http://productpage:9080/productpage
```

**Analyze Traces in Jaeger:**
1. Open Jaeger: http://localhost:16686
2. Select Service: productpage.bookinfo
3. Click "Find Traces"
4. Inspect trace:
   - Full request path
   - Timing for each service
   - Tags and logs
   - Error spans

**Debug Latency:**
```bash
# Inject delay
kubectl apply -f 05-fault-injection-delay.yaml

# Generate traffic and view traces
# Identify slow service in Jaeger
```

### Exercise 3: Prometheus Metrics

**Explore Metrics:**
```bash
# Open Prometheus: http://localhost:9090

# Key metrics to query:
# Request rate
istio_requests_total

# Request duration
istio_request_duration_milliseconds_bucket

# Request size
istio_request_bytes_bucket

# Response size
istio_response_bytes_bucket

# TCP connections
istio_tcp_connections_opened_total

# mTLS
istio_requests_total{security_policy="mutual_tls"}
```

**Create Queries:**
```promql
# Request rate per service
sum(rate(istio_requests_total[5m])) by (destination_service_name)

# Error rate
sum(rate(istio_requests_total{response_code=~"5.."}[5m])) by (destination_service_name)

# P95 latency
histogram_quantile(0.95,
  sum(rate(istio_request_duration_milliseconds_bucket[5m])) by (le, destination_service_name)
)

# Success rate
sum(rate(istio_requests_total{response_code!~"5.."}[5m]))
/
sum(rate(istio_requests_total[5m]))
```

### Exercise 4: Grafana Dashboards

**Open Grafana:**
```bash
# URL: http://localhost:3000
# Default: admin/admin
```

**Pre-built Istio Dashboards:**
1. Istio Mesh Dashboard
2. Istio Service Dashboard
3. Istio Workload Dashboard
4. Istio Performance Dashboard
5. Istio Control Plane Dashboard

**Create Custom Dashboard:**
```bash
kubectl apply -f 06-custom-dashboard.json
```

**Key Metrics to Display:**
- Request rate (RPS)
- Error rate
- P50, P90, P95, P99 latency
- Success rate
- Traffic volume
- Active connections

### Exercise 5: Custom Telemetry

**Configure Custom Metrics:**
```bash
kubectl apply -f 07-custom-metrics.yaml
```

**Example: Request Count by User:**
```yaml
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: custom-metrics
spec:
  metrics:
    - providers:
        - name: prometheus
      dimensions:
        user_id:
          value: request.headers["x-user-id"]
```

**Query Custom Metric:**
```promql
sum(rate(istio_requests_total[5m])) by (user_id)
```

### Exercise 6: Access Logs

**Enable Access Logs:**
```bash
kubectl apply -f 08-access-logs.yaml
```

**View Logs:**
```bash
# Stream access logs
kubectl logs -n bookinfo deploy/productpage-v1 -c istio-proxy -f

# JSON format logs
kubectl logs -n bookinfo deploy/productpage-v1 -c istio-proxy | jq
```

**Parse Access Logs:**
```bash
# Filter errors
kubectl logs -n bookinfo deploy/productpage-v1 -c istio-proxy | grep '"response_code":"5'

# Extract response times
kubectl logs -n bookinfo deploy/productpage-v1 -c istio-proxy | \
  jq -r '.duration' | awk '{sum+=$1; count++} END {print sum/count}'
```

### Exercise 7: Service Level Objectives (SLOs)

**Define SLOs:**
```bash
kubectl apply -f 09-slo-config.yaml
```

**Example SLO:**
- Availability: 99.9%
- Latency P99: < 200ms
- Error rate: < 0.1%

**Monitor SLO:**
```promql
# Availability (success rate)
sum(rate(istio_requests_total{response_code!~"5.."}[30d]))
/
sum(rate(istio_requests_total[30d]))

# P99 latency
histogram_quantile(0.99,
  sum(rate(istio_request_duration_milliseconds_bucket[5m])) by (le)
)

# Error rate
sum(rate(istio_requests_total{response_code=~"5.."}[5m]))
/
sum(rate(istio_requests_total[5m]))
```

### Exercise 8: Alerting

**Configure Prometheus Alerts:**
```bash
kubectl apply -f 10-prometheus-alerts.yaml
```

**Example Alerts:**
```yaml
groups:
  - name: istio_alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(istio_requests_total{response_code=~"5.."}[5m]))
          /
          sum(rate(istio_requests_total[5m]))
          > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: HighLatency
        expr: |
          histogram_quantile(0.99,
            sum(rate(istio_request_duration_milliseconds_bucket[5m])) by (le)
          ) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High latency detected
```

## Verification

### Check Observability Stack

```bash
# Verify all pods running
kubectl get pods -n istio-system

# Check services
kubectl get svc -n istio-system

# Test connectivity
curl -s http://localhost:9090/-/healthy  # Prometheus
curl -s http://localhost:3000/api/health  # Grafana
curl -s http://localhost:20001/kiali/api/health  # Kiali
```

### Validate Metrics Collection

```bash
# Query Prometheus for Istio metrics
curl -s 'http://localhost:9090/api/v1/query?query=istio_requests_total' | jq

# Check Jaeger for traces
curl -s 'http://localhost:16686/api/services' | jq
```

## Best Practices

1. **Sample Traces Appropriately**: 100% in dev, 1-5% in production
2. **Set Retention Policies**: Avoid storage bloat
3. **Use Labels Wisely**: For filtering and grouping
4. **Monitor the Monitors**: Observability stack health
5. **Create SLO Dashboards**: Focus on user impact
6. **Alert on SLOs**: Not on every metric
7. **Correlate Metrics and Traces**: For faster debugging
8. **Document Custom Metrics**: Why and how they're used

## Troubleshooting

### Kiali Not Showing Services

```bash
# Check Kiali configuration
kubectl get cm -n istio-system kiali -o yaml

# Verify prometheus is accessible
kubectl exec -n istio-system deploy/kiali -- \
  curl -s prometheus:9090/api/v1/query?query=up

# Restart Kiali
kubectl rollout restart deployment/kiali -n istio-system
```

### No Traces in Jaeger

```bash
# Check tracing configuration
istioctl proxy-config bootstrap deploy/productpage -n bookinfo | grep -A 10 tracing

# Verify Jaeger is receiving traces
kubectl logs -n istio-system deploy/jaeger

# Ensure trace headers are propagated
# Application must forward: x-request-id, x-b3-*, baggage, etc.
```

### Prometheus Not Scraping

```bash
# Check Prometheus targets
curl 'http://localhost:9090/api/v1/targets' | jq

# Verify service discovery
kubectl get servicemonitor -A

# Check Prometheus logs
kubectl logs -n istio-system deploy/prometheus
```

## Cleanup

```bash
kubectl delete -f 01-observability-stack.yaml
kubectl delete namespace bookinfo
```

## Next Steps

- [06_resilience](../06_resilience/): Implement retries, timeouts, and fault injection
- Set up long-term metrics storage
- Integrate with external APM tools
- Configure distributed tracing with sampling

## Resources

- [Istio Observability](https://istio.io/latest/docs/concepts/observability/)
- [Kiali Documentation](https://kiali.io/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
