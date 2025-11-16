# Kubernetes Tutorial 18: Monitoring with Prometheus and Grafana

## 🎯 Learning Objectives

- Install Prometheus using Helm
- Configure ServiceMonitors for scraping
- Deploy Grafana for visualization
- Create custom dashboards
- Set up AlertManager for notifications
- Monitor cluster and application metrics
- Implement recording rules
- Use PromQL for queries

## 📋 Prerequisites

- Completed tutorials 01-17
- Helm installed
- kind cluster running
- 8GB RAM recommended

## 📝 What We're Building

```
Monitoring Stack:
├── Prometheus (metrics collection)
│   ├── ServiceMonitors (scrape configs)
│   ├── PrometheusRules (alerts)
│   └── Recording Rules
├── Grafana (visualization)
│   ├── Dashboards
│   ├── Data sources
│   └── Alerts
├── AlertManager (notifications)
└── kube-state-metrics (cluster metrics)
```

## 🔍 Concepts Deep Dive

### 1. **Prometheus Architecture**

**Components**:
- **Prometheus Server**: Scrapes and stores metrics
- **Pushgateway**: For short-lived jobs
- **Exporters**: Expose metrics (node-exporter, kube-state-metrics)
- **AlertManager**: Handles alerts

**Data Model**:
```
metric_name{label1="value1", label2="value2"} value timestamp

Example:
http_requests_total{method="GET", status="200"} 1234 1609459200
```

### 2. **ServiceMonitor**

Defines how Prometheus scrapes services:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app-monitor
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
  - port: metrics
    path: /metrics
    interval: 30s
```

### 3. **PromQL Queries**

**Basic Queries**:
```promql
# Current value
http_requests_total

# Filter by label
http_requests_total{method="GET"}

# Rate (per second)
rate(http_requests_total[5m])

# Sum by label
sum by (method) (rate(http_requests_total[5m]))

# CPU usage percentage
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

## 📁 Step-by-Step Implementation

### Step 1: Install Prometheus Stack

```bash
# Add Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create namespace
kubectl create namespace monitoring

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set grafana.adminPassword=admin123

# Wait for deployment
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=prometheus -n monitoring --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=grafana -n monitoring --timeout=300s
```

### Step 2: Access Prometheus UI

```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090 &

# Access at http://localhost:9090
# Try queries:
# - up
# - node_cpu_seconds_total
# - container_memory_usage_bytes
```

### Step 3: Access Grafana

```bash
# Port-forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80 &

# Access at http://localhost:3000
# Username: admin
# Password: admin123 (from install)

# Browse pre-installed dashboards:
# - Kubernetes / Compute Resources / Cluster
# - Kubernetes / Compute Resources / Namespace
# - Kubernetes / Compute Resources / Pod
```

### Step 4: Deploy Sample Application with Metrics

```bash
# Create app namespace
kubectl create namespace app-demo

# Deploy app that exposes metrics
kubectl apply -f manifests/01-sample-app.yaml -n app-demo

# Create ServiceMonitor for app
kubectl apply -f manifests/02-servicemonitor.yaml -n app-demo

# Wait for app
kubectl wait --for=condition=ready pod -l app=metrics-app -n app-demo --timeout=60s

# Check if Prometheus is scraping
# In Prometheus UI: Status -> Targets
```

### Step 5: Create Custom Grafana Dashboard

```bash
# Import dashboard JSON
kubectl apply -f manifests/03-grafana-dashboard.yaml -n monitoring

# Or create via UI:
# 1. Click "+" -> Create -> Dashboard
# 2. Add Panel
# 3. Add PromQL query
# 4. Save dashboard
```

### Step 6: Create AlertManager Rules

```bash
# Create PrometheusRule for alerts
kubectl apply -f manifests/04-prometheus-rules.yaml -n monitoring

# Check rules in Prometheus UI:
# Status -> Rules

# View active alerts:
# Alerts tab
```

### Step 7: Configure AlertManager

```bash
# Create AlertManager config
kubectl apply -f manifests/05-alertmanager-config.yaml -n monitoring

# Access AlertManager
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093 &

# View at http://localhost:9093
```

### Step 8: Monitor Application Metrics

```bash
# Generate traffic to app
kubectl run -it --rm load-generator \
  --image=busybox:1.36 \
  --restart=Never \
  -n app-demo \
  -- /bin/sh -c "while true; do wget -q -O- http://metrics-app:8080/metrics; sleep 1; done"

# In Grafana, query:
# rate(http_requests_total[5m])
# http_request_duration_seconds
```

### Step 9: Create Recording Rules

```bash
# Apply recording rules
kubectl apply -f manifests/06-recording-rules.yaml -n monitoring

# Recording rules pre-compute expensive queries
# View in Prometheus: graph -> enter rule name
```

### Step 10: Monitor Cluster Resources

```bash
# Node CPU usage
kubectl top nodes

# Pod resource usage
kubectl top pods -A

# In Prometheus:
# node_cpu_seconds_total
# node_memory_MemAvailable_bytes
# kube_pod_container_resource_requests

# In Grafana:
# Use pre-installed "Kubernetes / Compute Resources / Cluster" dashboard
```

## ✅ Verification

### 1. Check Prometheus Targets

```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Browse to http://localhost:9090/targets
# All targets should show "UP"
```

### 2. Query Metrics

```bash
# Example queries in Prometheus UI

# All pods
up{job="kubernetes-pods"}

# Container CPU usage
rate(container_cpu_usage_seconds_total[5m])

# Memory usage by namespace
sum by (namespace) (container_memory_usage_bytes)

# Request rate
sum(rate(http_requests_total[5m])) by (method, status)
```

### 3. Verify Grafana Dashboards

```bash
# Port-forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Login and check:
# - Dashboards load without errors
# - Metrics are displayed
# - Time ranges work
```

### 4. Test Alerts

```bash
# Create high CPU load to trigger alert
kubectl run cpu-stress \
  --image=containerstack/cpustress \
  --restart=Never \
  -n app-demo \
  -- --cpus 2

# Wait 1-2 minutes
# Check Prometheus -> Alerts
# Check AlertManager for notification
```

## 🧪 Hands-On Exercises

### Exercise 1: Custom Application Metrics

**Task**: Instrument application with custom metrics:
- Counter: request_total
- Histogram: request_duration_seconds
- Gauge: active_connections

### Exercise 2: Dashboard Creation

**Task**: Create Grafana dashboard showing:
- CPU usage by namespace
- Memory usage trend
- Request rate and error rate
- Active pod count

### Exercise 3: Alert Rules

**Task**: Create alerts for:
- Pod crash looping
- High memory usage (>80%)
- Disk space low (<10%)
- Service down

## 🧹 Cleanup

```bash
# Uninstall Prometheus stack
helm uninstall prometheus -n monitoring

# Delete namespaces
kubectl delete namespace monitoring
kubectl delete namespace app-demo

# Verify cleanup
kubectl get all -n monitoring
```

## 📚 What You Learned

✅ Installed Prometheus and Grafana
✅ Created ServiceMonitors
✅ Queried metrics with PromQL
✅ Built Grafana dashboards
✅ Configured AlertManager
✅ Created alert rules
✅ Monitored cluster resources

## 🎓 Key Concepts

### Metric Types

**Counter**: Only increases
```promql
http_requests_total
rate(http_requests_total[5m])  # Requests per second
```

**Gauge**: Can go up and down
```promql
memory_usage_bytes
current_temperature
```

**Histogram**: Distribution of values
```promql
http_request_duration_seconds_bucket
histogram_quantile(0.95, http_request_duration_seconds_bucket)  # 95th percentile
```

**Summary**: Similar to histogram
```promql
http_request_duration_seconds{quantile="0.95"}
```

### Common PromQL Patterns

**CPU Usage**:
```promql
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

**Memory Usage**:
```promql
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100
```

**Request Rate**:
```promql
sum(rate(http_requests_total[5m])) by (method)
```

**Error Rate**:
```promql
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

## 🔜 Next Steps

**Tutorial 19**: Logging with Loki - Centralized log aggregation
- Install Loki
- Configure Promtail
- Query logs in Grafana

## 💡 Pro Tips

1. **Quick metric check**:
   ```bash
   kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
   ```

2. **Export Grafana dashboard**:
   ```bash
   # Dashboard settings -> JSON Model -> Copy
   ```

3. **Common Grafana data sources**:
   - Prometheus: metrics
   - Loki: logs
   - Jaeger: traces

4. **Alert rule best practices**:
   - Use "for" duration to avoid flapping
   - Include helpful annotations
   - Test alerts in development

5. **Resource requests for Prometheus**:
   ```yaml
   resources:
     requests:
       memory: 2Gi
       cpu: 500m
   ```

## 🆘 Troubleshooting

**Problem**: Targets not being scraped
**Solution**: Check ServiceMonitor labels:
```bash
kubectl get servicemonitor -n monitoring
kubectl describe servicemonitor <name> -n monitoring
```

**Problem**: Grafana dashboard shows no data
**Solution**: Check data source:
```bash
# Grafana -> Configuration -> Data Sources -> Test
```

**Problem**: Prometheus OOM
**Solution**: Increase retention and resources:
```yaml
prometheus:
  prometheusSpec:
    retention: 15d
    resources:
      requests:
        memory: 4Gi
```

## 📖 Additional Reading

- [Prometheus Official Docs](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [AlertManager](https://prometheus.io/docs/alerting/latest/alertmanager/)

---

**Estimated Time**: 90-120 minutes
**Difficulty**: Intermediate to Advanced
**Prerequisites**: Tutorials 01-17 completed

**Next**: Tutorial 19 - Logging with Loki
