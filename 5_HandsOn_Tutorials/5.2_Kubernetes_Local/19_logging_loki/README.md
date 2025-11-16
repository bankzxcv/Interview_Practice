# Kubernetes Tutorial 19: Logging with Loki and Promtail

## 🎯 Learning Objectives

- Install Loki for log aggregation
- Deploy Promtail as log collector
- Query logs in Grafana
- Create log-based alerts
- Implement log retention policies
- Parse and label logs
- Integrate with existing monitoring

## 📋 Prerequisites

- Completed tutorials 01-18
- Prometheus and Grafana installed (Tutorial 18)
- Helm installed

## 📝 What We're Building

```
Logging Stack:
├── Promtail (DaemonSet - collects logs)
│   └── Runs on every node
├── Loki (stores and indexes logs)
│   ├── Ingester
│   ├── Distributor
│   └── Querier
└── Grafana (visualize and query)
    ├── Loki data source
    └── Explore logs
```

## 🔍 Concepts Deep Dive

### 1. **Loki vs Traditional Logging**

**Traditional** (ELK stack):
- Indexes full log content
- High resource usage
- Complex to operate

**Loki**:
- Indexes only metadata (labels)
- Lower resource usage
- Simple, Prometheus-like

### 2. **Log Labels**

```
{namespace="default", pod="nginx-123", container="nginx"}
```

Labels are indexed, log content is not. Query by labels, filter by content.

### 3. **LogQL Queries**

```logql
# Simple filter
{namespace="default"}

# Multiple labels
{namespace="default", pod=~"nginx.*"}

# Filter by content
{namespace="default"} |= "error"

# Exclude
{namespace="default"} != "debug"

# Rate
rate({namespace="default"}[5m])

# Count errors
count_over_time({namespace="default"} |= "error" [1h])
```

## 📁 Step-by-Step Implementation

### Step 1: Install Loki Stack

```bash
# Add Grafana Helm repository
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Loki stack (Loki + Promtail)
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false \
  --set prometheus.enabled=false \
  --set loki.persistence.enabled=false

# Wait for Loki and Promtail
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=loki -n monitoring --timeout=120s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=promtail -n monitoring --timeout=120s

# Check Promtail DaemonSet (should be on every node)
kubectl get daemonset -n monitoring
kubectl get pods -n monitoring -l app.kubernetes.io/name=promtail
```

### Step 2: Configure Loki Data Source in Grafana

```bash
# Create Loki data source
kubectl apply -f manifests/01-loki-datasource.yaml -n monitoring

# Or add manually in Grafana UI:
# Configuration -> Data Sources -> Add Loki
# URL: http://loki:3100
```

### Step 3: Query Logs in Grafana

```bash
# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# In Grafana:
# 1. Go to Explore (compass icon)
# 2. Select Loki data source
# 3. Try queries:

# All logs from default namespace
{namespace="default"}

# Logs from specific pod
{namespace="default", pod="nginx-xxx"}

# Filter for errors
{namespace="default"} |= "error"

# nginx access logs
{namespace="default", container="nginx"} |= "GET"
```

### Step 4: Deploy Log-Generating Application

```bash
# Create namespace
kubectl create namespace log-demo

# Deploy application
kubectl apply -f manifests/02-log-app.yaml -n log-demo

# Generate logs
kubectl logs -n log-demo deployment/log-generator -f

# Query in Loki
{namespace="log-demo"}
```

### Step 5: Create Log Dashboard

```bash
# Create dashboard
kubectl apply -f manifests/03-logs-dashboard.yaml -n monitoring

# Dashboard shows:
# - Log rate by namespace
# - Error count
# - Recent logs
# - Log volume

# Or create in Grafana UI:
# Dashboards -> New -> Add Panel -> Loki query
```

### Step 6: Log-Based Alerts

```bash
# Create alert rules for logs
kubectl apply -f manifests/04-log-alerts.yaml -n monitoring

# Alerts for:
# - High error rate
# - OOMKilled pods
# - CrashLoopBackOff
# - Authentication failures
```

### Step 7: Parse and Label Logs

```bash
# Configure Promtail to parse logs
kubectl apply -f manifests/05-promtail-config.yaml -n monitoring

# Example: Parse JSON logs
# Extract fields as labels
# Add custom labels based on content
```

### Step 8: Query Logs with Filters

```bash
# In Grafana Explore:

# Error logs only
{namespace="default"} |= "error" or "Error" or "ERROR"

# HTTP 5xx errors
{container="nginx"} |= "status=5"

# Rate of errors
rate({namespace="default"} |= "error" [5m])

# Count by pod
sum by (pod) (count_over_time({namespace="default"}[1h]))

# Pattern matching
{namespace="default"} |~ "failed to .* database"
```

### Step 9: Aggregate Log Metrics

```bash
# Extract metrics from logs

# Count log lines
count_over_time({namespace="default"}[5m])

# Rate
rate({namespace="default"}[5m])

# Bytes processed
sum(rate({namespace="default"}[1m])) by (namespace)

# Error rate
sum(rate({namespace="default"} |= "error" [5m])) by (pod)
/ sum(rate({namespace="default"}[5m])) by (pod)
```

### Step 10: Retention and Storage

```bash
# Configure retention in Loki
# Edit Loki config:
kubectl edit configmap loki -n monitoring

# Add retention:
limits_config:
  retention_period: 168h  # 7 days

# For production, enable persistence:
# helm upgrade loki grafana/loki-stack \
#   --set loki.persistence.enabled=true \
#   --set loki.persistence.size=10Gi
```

## ✅ Verification

### 1. Check Promtail Collection

```bash
# Check Promtail pods
kubectl get pods -n monitoring -l app.kubernetes.io/name=promtail

# Check Promtail logs
kubectl logs -n monitoring -l app.kubernetes.io/name=promtail --tail=50

# Should see: "Successfully sent batch"
```

### 2. Verify Loki Storage

```bash
# Check Loki pod
kubectl get pods -n monitoring -l app.kubernetes.io/name=loki

# Check Loki logs
kubectl logs -n monitoring -l app.kubernetes.io/name=loki --tail=50

# Query Loki API
kubectl port-forward -n monitoring svc/loki 3100:3100
curl http://localhost:3100/loki/api/v1/labels
```

### 3. Test Queries

```bash
# In Grafana Explore:

# Test 1: Basic query
{namespace="kube-system"}

# Test 2: Time range
{namespace="kube-system"} [5m]

# Test 3: Filter
{namespace="kube-system"} |= "error"

# Test 4: Metrics
count_over_time({namespace="kube-system"}[1m])
```

## 🧪 Hands-On Exercises

### Exercise 1: Multi-Line Log Parsing

**Task**: Configure Promtail to handle stack traces:
- Combine multi-line Java exceptions
- Label by exception type

### Exercise 2: Custom Labels

**Task**: Add custom labels from log content:
- Extract HTTP status codes
- Parse request duration
- Label by severity level

### Exercise 3: Log-Based SLOs

**Task**: Create dashboard showing:
- Request success rate from logs
- P99 latency from logs
- Error budget remaining

## 🧹 Cleanup

```bash
# Uninstall Loki stack
helm uninstall loki -n monitoring

# Delete log demo namespace
kubectl delete namespace log-demo

# Verify cleanup
kubectl get pods -n monitoring -l app.kubernetes.io/name=loki
kubectl get pods -n monitoring -l app.kubernetes.io/name=promtail
```

## 📚 What You Learned

✅ Installed Loki and Promtail
✅ Queried logs with LogQL
✅ Created log dashboards
✅ Set up log-based alerts
✅ Parsed and labeled logs
✅ Configured retention policies

## 🎓 Key Concepts

### LogQL Cheat Sheet

```logql
# Stream selector (must have)
{namespace="default"}

# Filter (|=, !=, |~, !~)
{namespace="default"} |= "error"
{namespace="default"} |~ "error|fail"

# Parser (json, logfmt, regexp, pattern)
{namespace="default"} | json
{namespace="default"} | logfmt
{namespace="default"} | regexp `(?P<level>\w+)`

# Label filter
{namespace="default"} | json | level="error"

# Line format
{namespace="default"} | line_format "{{.pod}}: {{.message}}"

# Aggregation
sum by (pod) (rate({namespace="default"}[5m]))
count_over_time({namespace="default"} |= "error" [1h])
```

### Best Practices

1. **Use appropriate labels**: Index frequently queried fields
2. **Don't over-label**: Too many labels = high cardinality
3. **Filter early**: Use stream selectors before parsing
4. **Set retention**: Balance storage vs query needs
5. **Monitor Loki**: Watch ingestion rate, query performance

## 🔜 Next Steps

**Tutorial 20**: Service Mesh with Istio - Advanced traffic management
- Install Istio
- Configure traffic routing
- Implement mTLS

## 💡 Pro Tips

1. **Quick log tail**:
   ```bash
   kubectl port-forward -n monitoring svc/loki 3100:3100
   logcli query '{namespace="default"}' --tail
   ```

2. **Export logs**:
   ```bash
   logcli query '{namespace="default"}' --from=1h --output=jsonl > logs.json
   ```

3. **Live tail in Grafana**:
   ```
   {namespace="default"} # Then click "Live" button
   ```

4. **Combine with metrics**:
   ```
   Use same labels in Loki and Prometheus for correlation
   ```

## 🆘 Troubleshooting

**Problem**: No logs appearing in Loki
**Solution**: Check Promtail:
```bash
kubectl logs -n monitoring daemonset/loki-promtail
# Look for "Successfully sent batch"
```

**Problem**: High cardinality warning
**Solution**: Reduce labels:
```yaml
# Promtail config - drop high cardinality labels
pipeline_stages:
  - labeldrop:
      - pod_id
      - container_id
```

**Problem**: Query timeout
**Solution**: Narrow time range or add more filters:
```logql
# Instead of:
{namespace="default"} [24h]

# Use:
{namespace="default"} [1h] or add more labels
```

## 📖 Additional Reading

- [Loki Official Docs](https://grafana.com/docs/loki/latest/)
- [LogQL Guide](https://grafana.com/docs/loki/latest/logql/)
- [Promtail Configuration](https://grafana.com/docs/loki/latest/clients/promtail/configuration/)

---

**Estimated Time**: 60-90 minutes
**Difficulty**: Intermediate
**Prerequisites**: Tutorials 01-18 completed

**Next**: Tutorial 20 - Service Mesh with Istio
