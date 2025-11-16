# Tutorial 03: Service Discovery - Kubernetes Service Discovery

## Learning Objectives
- Understand Prometheus service discovery mechanisms
- Configure Kubernetes service discovery
- Use file-based service discovery
- Implement relabeling
- Dynamic target management

## Service Discovery Types

```
┌─────────────────────┐
│ Service Discovery   │
└─────────┬───────────┘
          │
          ├─→ Static Configs (manual)
          ├─→ Kubernetes (pods, services, endpoints)
          ├─→ Consul
          ├─→ EC2/Azure/GCP
          ├─→ File-based
          └─→ DNS
```

## Step 1: Kubernetes Service Discovery

Create a complete Kubernetes monitoring setup:

```yaml
# k8s-prometheus.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    scrape_configs:
      # Scrape Prometheus itself
      - job_name: 'prometheus'
        static_configs:
          - targets: ['localhost:9090']

      # Discover Kubernetes pods
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          # Only scrape pods with annotation prometheus.io/scrape=true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true

          # Use the prometheus.io/path annotation for metrics path
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)

          # Use the prometheus.io/port annotation for metrics port
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__

          # Add pod name as label
          - source_labels: [__meta_kubernetes_pod_name]
            action: replace
            target_label: kubernetes_pod_name

          # Add namespace as label
          - source_labels: [__meta_kubernetes_namespace]
            action: replace
            target_label: kubernetes_namespace

          # Add container name as label
          - source_labels: [__meta_kubernetes_pod_container_name]
            action: replace
            target_label: kubernetes_container_name

      # Discover Kubernetes services
      - job_name: 'kubernetes-services'
        kubernetes_sd_configs:
          - role: service
        metrics_path: /probe
        params:
          module: [http_2xx]
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_probe]
            action: keep
            regex: true
          - source_labels: [__address__]
            target_label: __param_target
          - target_label: __address__
            replacement: blackbox-exporter:9115
          - source_labels: [__param_target]
            target_label: instance
          - source_labels: [__meta_kubernetes_service_name]
            target_label: kubernetes_service_name

      # Discover Kubernetes endpoints
      - job_name: 'kubernetes-endpoints'
        kubernetes_sd_configs:
          - role: endpoints
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scheme]
            action: replace
            target_label: __scheme__
            regex: (https?)
          - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
            action: replace
            target_label: __address__
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2

      # Discover Kubernetes nodes
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
        relabel_configs:
          - source_labels: [__address__]
            regex: '(.*):10250'
            replacement: '${1}:9100'
            target_label: __address__
          - source_labels: [__meta_kubernetes_node_name]
            target_label: node

      # cAdvisor metrics
      - job_name: 'kubernetes-cadvisor'
        kubernetes_sd_configs:
          - role: node
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - action: labelmap
            regex: __meta_kubernetes_node_label_(.+)
          - target_label: __address__
            replacement: kubernetes.default.svc:443
          - source_labels: [__meta_kubernetes_node_name]
            regex: (.+)
            target_label: __metrics_path__
            replacement: /api/v1/nodes/${1}/proxy/metrics/cadvisor
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      serviceAccountName: prometheus
      containers:
      - name: prometheus
        image: prom/prometheus:v2.48.0
        args:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
          - '--storage.tsdb.retention.time=15d'
          - '--web.enable-lifecycle'
        ports:
        - containerPort: 9090
          name: web
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: storage
          mountPath: /prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: storage
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
spec:
  selector:
    app: prometheus
  ports:
    - port: 9090
      targetPort: 9090
  type: LoadBalancer
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus
  namespace: monitoring
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus
rules:
- apiGroups: [""]
  resources:
  - nodes
  - nodes/proxy
  - services
  - endpoints
  - pods
  verbs: ["get", "list", "watch"]
- apiGroups:
  - extensions
  resources:
  - ingresses
  verbs: ["get", "list", "watch"]
- nonResourceURLs: ["/metrics"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus
subjects:
- kind: ServiceAccount
  name: prometheus
  namespace: monitoring
```

## Step 2: Sample Application with Annotations

```yaml
# sample-app.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-app
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sample-app
  template:
    metadata:
      labels:
        app: sample-app
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: app
        image: your-app:latest
        ports:
        - containerPort: 8080
          name: metrics
---
apiVersion: v1
kind: Service
metadata:
  name: sample-app
  namespace: default
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8080"
spec:
  selector:
    app: sample-app
  ports:
    - port: 8080
      targetPort: 8080
```

## Step 3: File-Based Service Discovery

Useful for non-Kubernetes environments or dynamic updates:

```yaml
# prometheus.yml (with file_sd)
scrape_configs:
  - job_name: 'file-sd-apps'
    file_sd_configs:
      - files:
        - '/etc/prometheus/targets/*.json'
        - '/etc/prometheus/targets/*.yaml'
        refresh_interval: 30s
```

```json
// targets/app-servers.json
[
  {
    "targets": ["app1.example.com:9090", "app2.example.com:9090"],
    "labels": {
      "job": "web-app",
      "environment": "production",
      "region": "us-west"
    }
  },
  {
    "targets": ["db1.example.com:9187", "db2.example.com:9187"],
    "labels": {
      "job": "postgres",
      "environment": "production",
      "region": "us-west"
    }
  }
]
```

```yaml
# targets/cache-servers.yaml
- targets:
  - redis1.example.com:9121
  - redis2.example.com:9121
  labels:
    job: redis
    environment: production
    cluster: cache-cluster-1
```

## Step 4: Relabeling Deep Dive

### Common Relabeling Use Cases

```yaml
# 1. Keep only specific targets
relabel_configs:
  - source_labels: [__meta_kubernetes_pod_label_app]
    action: keep
    regex: myapp

# 2. Drop specific targets
relabel_configs:
  - source_labels: [__meta_kubernetes_namespace]
    action: drop
    regex: kube-system

# 3. Replace labels
relabel_configs:
  - source_labels: [__meta_kubernetes_pod_label_version]
    target_label: version
    action: replace

# 4. Create new labels from multiple sources
relabel_configs:
  - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_pod_name]
    separator: '/'
    target_label: kubernetes_pod
    action: replace

# 5. Use hashmod for sharding
relabel_configs:
  - source_labels: [__address__]
    modulus: 4
    target_label: __tmp_hash
    action: hashmod
  - source_labels: [__tmp_hash]
    regex: ^1$
    action: keep

# 6. Extract values with regex
relabel_configs:
  - source_labels: [__meta_kubernetes_pod_name]
    regex: '(.*)-\d+'
    target_label: app_name
    action: replace
```

## Step 5: Docker Compose with File SD

```yaml
# docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--web.enable-lifecycle'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./targets:/etc/prometheus/targets
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - monitoring

  # File SD generator (updates targets dynamically)
  target-generator:
    build:
      context: .
      dockerfile: Dockerfile.generator
    container_name: target-generator
    volumes:
      - ./targets:/targets
    networks:
      - monitoring

volumes:
  prometheus-data:

networks:
  monitoring:
    driver: bridge
```

```python
# target_generator.py
import json
import time
import random

def generate_targets():
    targets = []

    # Simulate discovering services
    num_apps = random.randint(1, 5)
    for i in range(num_apps):
        targets.append({
            "targets": [f"app{i+1}:8080"],
            "labels": {
                "job": "web-app",
                "environment": "development",
                "instance": f"app{i+1}"
            }
        })

    return targets

while True:
    targets = generate_targets()

    with open('/targets/dynamic-targets.json', 'w') as f:
        json.dump(targets, f, indent=2)

    print(f"Updated targets: {len(targets)} services")
    time.sleep(30)  # Update every 30 seconds
```

## Step 6: Consul Service Discovery

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'consul-services'
    consul_sd_configs:
      - server: 'consul:8500'
        services: []  # Discover all services
    relabel_configs:
      # Use service name as job label
      - source_labels: [__meta_consul_service]
        target_label: job

      # Use node name as instance
      - source_labels: [__meta_consul_node]
        target_label: instance

      # Add all service tags as labels
      - source_labels: [__meta_consul_tags]
        regex: ',(.+),'
        target_label: tags
```

## Step 7: Deploy to Kubernetes

```bash
# Create namespace and deploy
kubectl apply -f k8s-prometheus.yaml

# Deploy sample app
kubectl apply -f sample-app.yaml

# Check Prometheus pods
kubectl get pods -n monitoring

# Port forward to access Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Check service discovery targets
# Visit http://localhost:9090/service-discovery
```

## Step 8: Advanced Queries with Service Discovery

```promql
# All metrics from pods in production namespace
{kubernetes_namespace="production"}

# CPU usage by pod
rate(container_cpu_usage_seconds_total{pod=~"myapp-.*"}[5m])

# Memory usage by container
container_memory_usage_bytes{container!="POD",namespace="default"}

# Request rate grouped by pod
sum by (kubernetes_pod_name) (rate(http_requests_total[5m]))

# Network traffic by namespace
sum by (kubernetes_namespace) (rate(container_network_receive_bytes_total[5m]))
```

## Exercises

1. **Set up Kubernetes monitoring**: Deploy Prometheus with service discovery
2. **Create annotated app**: Deploy app with Prometheus annotations
3. **Implement file SD**: Create dynamic target discovery
4. **Advanced relabeling**: Extract app name from pod name
5. **Multi-environment**: Separate prod/dev targets using labels

## Troubleshooting

### No targets discovered
```bash
# Check Prometheus logs
kubectl logs -n monitoring deployment/prometheus

# Verify RBAC permissions
kubectl get clusterrolebinding prometheus

# Check service account
kubectl get serviceaccount -n monitoring prometheus
```

### Incorrect labels
```bash
# View relabeling in Prometheus UI
# Go to http://localhost:9090/service-discovery
# Shows before/after relabeling
```

## Key Takeaways

- ✅ Service discovery automatically finds targets
- ✅ Kubernetes SD is most common for K8s deployments
- ✅ File-based SD works for dynamic non-K8s environments
- ✅ Relabeling is powerful for customizing labels
- ✅ Annotations control which pods to scrape
- ✅ RBAC permissions required for K8s discovery

## Next Steps

Continue to **Tutorial 04: Recording Rules** to learn about:
- Pre-computing expensive queries
- Aggregation rules
- Performance optimization
- Rule management

## Additional Resources

- [Kubernetes Service Discovery](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#kubernetes_sd_config)
- [Relabeling](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#relabel_config)
- [File SD](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#file_sd_config)
