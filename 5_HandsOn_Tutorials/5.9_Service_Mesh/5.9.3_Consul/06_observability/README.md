# Consul Tutorial 06: Observability

## Overview

Monitor Consul service mesh with built-in UI, metrics integration with Prometheus, and distributed tracing with Jaeger/Zipkin.

## Learning Objectives

- Use Consul UI for visualization
- Export metrics to Prometheus
- Configure distributed tracing
- Monitor service health
- Create custom dashboards
- Set up alerting

## Consul UI

**Access UI:**
```bash
kubectl port-forward -n consul svc/consul-ui 8500:80
# Open: http://localhost:8500
```

**UI Features:**
- Service topology
- Health checks status
- Intentions visualization
- KV store browser
- ACL management
- Node list

## Metrics Collection

**Enable Metrics:**
```yaml
global:
  metrics:
    enabled: true
    enableAgentMetrics: true
    enableGatewayMetrics: true
connectInject:
  metrics:
    defaultEnabled: true
    defaultEnableMerging: true
```

**Prometheus Integration:**
```yaml
global:
  metrics:
    enabled: true
    enableAgentMetrics: true
prometheus:
  enabled: true
```

**Access Metrics:**
```bash
# Consul server metrics
kubectl port-forward -n consul consul-server-0 8500:8500
curl http://localhost:8500/v1/agent/metrics?format=prometheus

# Envoy sidecar metrics
kubectl exec deploy/web -c consul-connect-envoy-sidecar -- \
  curl -s localhost:19000/stats/prometheus
```

## Key Metrics

**Consul Metrics:**
```promql
# Server health
consul_health_service_status

# Service registrations
consul_catalog_service_count

# RPC requests
consul_rpc_request_total

# Raft commits
consul_raft_commitTime
```

**Envoy Metrics:**
```promql
# Request rate
envoy_cluster_upstream_rq_total

# Response codes
envoy_cluster_upstream_rq_xx{envoy_response_code_class="5"}

# Latency
envoy_cluster_upstream_rq_time_bucket
```

## Distributed Tracing

**Enable Tracing:**
```yaml
connectInject:
  enabled: true
  envoyExtraArgs: "--log-level debug"
  centralConfig:
    enabled: true
    defaultProtocol: "http"
    proxyDefaults: |
      {
        "envoy_tracing_json": {
          "http": {
            "name": "envoy.tracers.zipkin",
            "typedConfig": {
              "@type": "type.googleapis.com/envoy.config.trace.v3.ZipkinConfig",
              "collector_cluster": "jaeger",
              "collector_endpoint": "/api/v2/spans",
              "shared_span_context": false
            }
          }
        }
      }
```

**Deploy Jaeger:**
```bash
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
spec:
  template:
    spec:
      containers:
        - name: jaeger
          image: jaegertracing/all-in-one:latest
          ports:
            - containerPort: 16686  # UI
            - containerPort: 9411   # Zipkin
EOF

# Access Jaeger UI
kubectl port-forward deploy/jaeger 16686:16686
# Open: http://localhost:16686
```

## Grafana Dashboards

**Install Grafana:**
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana -n consul

# Get admin password
kubectl get secret --namespace consul grafana -o jsonpath="{.data.admin-password}" | base64 --decode

# Access Grafana
kubectl port-forward -n consul svc/grafana 3000:80
```

**Import Consul Dashboards:**
- Consul Server Metrics
- Consul Client Metrics
- Service Mesh Overview
- Envoy Proxy Metrics

## Health Monitoring

**Service Health Checks:**
```yaml
annotations:
  "consul.hashicorp.com/service-checks": |
    [
      {
        "HTTP": "http://localhost:8080/health",
        "Interval": "10s",
        "Timeout": "1s"
      }
    ]
```

**Monitor Health:**
```bash
# Via CLI
consul watch -type=service -service=web

# Via API
curl http://localhost:8500/v1/health/state/critical | jq
```

## Alerting

**Prometheus Alerts:**
```yaml
groups:
  - name: consul_alerts
    rules:
      - alert: ConsulServerDown
        expr: up{job="consul-server"} == 0
        for: 1m
        labels:
          severity: critical

      - alert: ServiceUnhealthy
        expr: consul_health_service_status{status="critical"} > 0
        for: 5m
        labels:
          severity: warning

      - alert: HighServiceLatency
        expr: |
          histogram_quantile(0.99,
            rate(envoy_cluster_upstream_rq_time_bucket[5m])
          ) > 1000
        for: 5m
```

## Best Practices

1. **Enable Metrics**: On all services
2. **Use Prometheus**: For long-term storage
3. **Set Up Alerting**: On critical metrics
4. **Monitor Health Checks**: Track failures
5. **Review UI Regularly**: Spot issues early
6. **Distributed Tracing**: For debugging

## Next Steps

- [07_multi_datacenter](../07_multi_datacenter/): Multi-DC Consul
- Configure long-term metrics storage
- Implement SLO dashboards
- Set up on-call rotation
