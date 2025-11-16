# Tutorial 08: Production Stack - HA, Scaling, and Best Practices

## Learning Objectives
- Deploy highly available Prometheus
- Implement federation and sharding
- Configure long-term storage (Thanos/Cortex)
- Set up security and authentication
- Apply production best practices
- Monitor the monitoring stack

## Production Architecture

```
┌─────────────────────────────────────────────┐
│              Load Balancer                  │
└──────────┬──────────────┬───────────────────┘
           │              │
    ┌──────▼─────┐  ┌────▼──────┐
    │ Prometheus │  │Prometheus │  (HA Pair)
    │  Instance1 │  │ Instance2 │
    └──────┬─────┘  └────┬──────┘
           │              │
           └──────┬───────┘
                  │
         ┌────────▼─────────┐
         │     Thanos       │  (Long-term storage)
         │   Query/Store    │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │     Grafana      │  (Visualization)
         └──────────────────┘
```

## Step 1: High Availability Setup

### Kubernetes Deployment with HA

```yaml
# prometheus-ha.yaml
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
      external_labels:
        cluster: 'prod-us-west'
        replica: '$(POD_NAME)'

    alerting:
      alert_relabel_configs:
        # Remove replica label from alerts to deduplicate
        - regex: replica
          action: labeldrop
      alertmanagers:
        - kubernetes_sd_configs:
            - role: pod
              namespaces:
                names:
                  - monitoring
          relabel_configs:
            - source_labels: [__meta_kubernetes_pod_label_app]
              action: keep
              regex: alertmanager

    rule_files:
      - '/etc/prometheus/rules/*.yml'

    scrape_configs:
      - job_name: 'prometheus'
        static_configs:
          - targets: ['localhost:9090']

      # Kubernetes service discovery
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
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
      name: web
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus-headless
  namespace: monitoring
spec:
  selector:
    app: prometheus
  clusterIP: None
  ports:
    - port: 9090
      targetPort: 9090
      name: web
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: prometheus
  namespace: monitoring
spec:
  serviceName: prometheus-headless
  replicas: 2
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
          - '--storage.tsdb.retention.time=24h'  # Short retention with Thanos
          - '--web.enable-lifecycle'
          - '--web.enable-admin-api'
          - '--storage.tsdb.min-block-duration=2h'
          - '--storage.tsdb.max-block-duration=2h'
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        ports:
        - containerPort: 9090
          name: web
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: rules
          mountPath: /etc/prometheus/rules
        - name: storage
          mountPath: /prometheus
        resources:
          requests:
            cpu: 500m
            memory: 2Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        livenessProbe:
          httpGet:
            path: /-/healthy
            port: 9090
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /-/ready
            port: 9090
          initialDelaySeconds: 5
          periodSeconds: 5

      # Thanos Sidecar for long-term storage
      - name: thanos-sidecar
        image: thanosio/thanos:v0.33.0
        args:
          - sidecar
          - --tsdb.path=/prometheus
          - --prometheus.url=http://localhost:9090
          - --objstore.config-file=/etc/thanos/objstore.yml
          - --grpc-address=0.0.0.0:10901
          - --http-address=0.0.0.0:10902
        ports:
        - containerPort: 10901
          name: grpc
        - containerPort: 10902
          name: http
        volumeMounts:
        - name: storage
          mountPath: /prometheus
        - name: thanos-config
          mountPath: /etc/thanos
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi

      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: rules
        configMap:
          name: prometheus-rules
      - name: thanos-config
        secret:
          secretName: thanos-objstore-config

  volumeClaimTemplates:
  - metadata:
      name: storage
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 100Gi
```

## Step 2: Thanos for Long-Term Storage

### Object Storage Configuration

```yaml
# thanos-objstore-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: thanos-objstore-config
  namespace: monitoring
type: Opaque
stringData:
  objstore.yml: |
    type: S3
    config:
      bucket: "prometheus-metrics"
      endpoint: "s3.amazonaws.com"
      access_key: "YOUR_ACCESS_KEY"
      secret_key: "YOUR_SECRET_KEY"
      region: "us-west-2"
```

### Thanos Query

```yaml
# thanos-query.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: thanos-query
  namespace: monitoring
spec:
  replicas: 2
  selector:
    matchLabels:
      app: thanos-query
  template:
    metadata:
      labels:
        app: thanos-query
    spec:
      containers:
      - name: thanos-query
        image: thanosio/thanos:v0.33.0
        args:
          - query
          - --http-address=0.0.0.0:10902
          - --grpc-address=0.0.0.0:10901
          - --store=prometheus-0.prometheus-headless.monitoring.svc.cluster.local:10901
          - --store=prometheus-1.prometheus-headless.monitoring.svc.cluster.local:10901
          - --store=thanos-store.monitoring.svc.cluster.local:10901
          - --query.replica-label=replica
        ports:
        - containerPort: 10902
          name: http
        - containerPort: 10901
          name: grpc
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 1000m
            memory: 2Gi
---
apiVersion: v1
kind: Service
metadata:
  name: thanos-query
  namespace: monitoring
spec:
  selector:
    app: thanos-query
  ports:
    - port: 10902
      targetPort: 10902
      name: http
    - port: 10901
      targetPort: 10901
      name: grpc
  type: LoadBalancer
```

### Thanos Store Gateway

```yaml
# thanos-store.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: thanos-store
  namespace: monitoring
spec:
  serviceName: thanos-store
  replicas: 2
  selector:
    matchLabels:
      app: thanos-store
  template:
    metadata:
      labels:
        app: thanos-store
    spec:
      containers:
      - name: thanos-store
        image: thanosio/thanos:v0.33.0
        args:
          - store
          - --data-dir=/var/thanos/store
          - --objstore.config-file=/etc/thanos/objstore.yml
          - --http-address=0.0.0.0:10902
          - --grpc-address=0.0.0.0:10901
        ports:
        - containerPort: 10902
          name: http
        - containerPort: 10901
          name: grpc
        volumeMounts:
        - name: storage
          mountPath: /var/thanos/store
        - name: thanos-config
          mountPath: /etc/thanos
        resources:
          requests:
            cpu: 500m
            memory: 2Gi
          limits:
            cpu: 1000m
            memory: 4Gi
      volumes:
      - name: thanos-config
        secret:
          secretName: thanos-objstore-config
  volumeClaimTemplates:
  - metadata:
      name: storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 50Gi
---
apiVersion: v1
kind: Service
metadata:
  name: thanos-store
  namespace: monitoring
spec:
  selector:
    app: thanos-store
  clusterIP: None
  ports:
    - port: 10901
      name: grpc
    - port: 10902
      name: http
```

### Thanos Compactor

```yaml
# thanos-compactor.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: thanos-compactor
  namespace: monitoring
spec:
  serviceName: thanos-compactor
  replicas: 1
  selector:
    matchLabels:
      app: thanos-compactor
  template:
    metadata:
      labels:
        app: thanos-compactor
    spec:
      containers:
      - name: thanos-compactor
        image: thanosio/thanos:v0.33.0
        args:
          - compact
          - --data-dir=/var/thanos/compactor
          - --objstore.config-file=/etc/thanos/objstore.yml
          - --http-address=0.0.0.0:10902
          - --retention.resolution-raw=30d
          - --retention.resolution-5m=90d
          - --retention.resolution-1h=365d
          - --wait
        ports:
        - containerPort: 10902
          name: http
        volumeMounts:
        - name: storage
          mountPath: /var/thanos/compactor
        - name: thanos-config
          mountPath: /etc/thanos
        resources:
          requests:
            cpu: 500m
            memory: 2Gi
          limits:
            cpu: 1000m
            memory: 4Gi
      volumes:
      - name: thanos-config
        secret:
          secretName: thanos-objstore-config
  volumeClaimTemplates:
  - metadata:
      name: storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
```

## Step 3: Security and Authentication

### Enable TLS

```yaml
# prometheus-tls.yaml
apiVersion: v1
kind: Secret
metadata:
  name: prometheus-tls
  namespace: monitoring
type: kubernetes.io/tls
data:
  tls.crt: BASE64_ENCODED_CERT
  tls.key: BASE64_ENCODED_KEY
---
# Add to Prometheus container args:
args:
  - '--web.config.file=/etc/prometheus/web-config.yml'

volumeMounts:
  - name: tls
    mountPath: /etc/prometheus/tls
    readOnly: true
  - name: web-config
    mountPath: /etc/prometheus/web-config.yml
    subPath: web-config.yml

volumes:
  - name: tls
    secret:
      secretName: prometheus-tls
```

```yaml
# web-config.yml
tls_server_config:
  cert_file: /etc/prometheus/tls/tls.crt
  key_file: /etc/prometheus/tls/tls.key

basic_auth_users:
  admin: $2y$10$HASHED_PASSWORD
```

### Grafana with OAuth

```yaml
# grafana-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-config
  namespace: monitoring
data:
  grafana.ini: |
    [server]
    root_url = https://grafana.company.com

    [auth.generic_oauth]
    enabled = true
    name = OAuth
    allow_sign_up = true
    client_id = YOUR_CLIENT_ID
    client_secret = YOUR_CLIENT_SECRET
    scopes = openid email profile
    auth_url = https://oauth.company.com/authorize
    token_url = https://oauth.company.com/token
    api_url = https://oauth.company.com/userinfo
    role_attribute_path = contains(groups[*], 'grafana-admin') && 'Admin' || 'Viewer'

    [security]
    admin_user = admin
    admin_password = CHANGE_ME
    secret_key = RANDOM_SECRET_KEY
```

## Step 4: Alertmanager HA

```yaml
# alertmanager-ha.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: alertmanager
  namespace: monitoring
spec:
  serviceName: alertmanager
  replicas: 3
  selector:
    matchLabels:
      app: alertmanager
  template:
    metadata:
      labels:
        app: alertmanager
    spec:
      containers:
      - name: alertmanager
        image: prom/alertmanager:v0.26.0
        args:
          - --config.file=/etc/alertmanager/alertmanager.yml
          - --storage.path=/alertmanager
          - --cluster.advertise-address=$(POD_IP):9094
          - --cluster.peer=alertmanager-0.alertmanager.monitoring.svc:9094
          - --cluster.peer=alertmanager-1.alertmanager.monitoring.svc:9094
          - --cluster.peer=alertmanager-2.alertmanager.monitoring.svc:9094
        env:
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        ports:
        - containerPort: 9093
          name: web
        - containerPort: 9094
          name: cluster
        volumeMounts:
        - name: config
          mountPath: /etc/alertmanager
        - name: storage
          mountPath: /alertmanager
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
      volumes:
      - name: config
        configMap:
          name: alertmanager-config
  volumeClaimTemplates:
  - metadata:
      name: storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: alertmanager
  namespace: monitoring
spec:
  selector:
    app: alertmanager
  clusterIP: None
  ports:
    - port: 9093
      name: web
    - port: 9094
      name: cluster
```

## Step 5: Production Best Practices

### Resource Limits and Requests

```yaml
resources:
  requests:
    cpu: "1000m"      # 1 CPU core
    memory: "2Gi"     # 2 GB RAM
  limits:
    cpu: "2000m"      # 2 CPU cores
    memory: "4Gi"     # 4 GB RAM
```

### Retention and Storage

```yaml
# Prometheus args
args:
  - '--storage.tsdb.retention.time=15d'
  - '--storage.tsdb.retention.size=50GB'
  - '--storage.tsdb.min-block-duration=2h'
  - '--storage.tsdb.max-block-duration=2h'
```

### Health Checks

```yaml
livenessProbe:
  httpGet:
    path: /-/healthy
    port: 9090
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /-/ready
    port: 9090
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### Pod Disruption Budget

```yaml
# pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: prometheus-pdb
  namespace: monitoring
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: prometheus
```

### Horizontal Pod Autoscaling

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: prometheus-hpa
  namespace: monitoring
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: prometheus
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Step 6: Monitoring the Monitoring Stack

```promql
# Prometheus is up
up{job="prometheus"}

# Scrape duration
scrape_duration_seconds

# Samples ingested rate
rate(prometheus_tsdb_head_samples_appended_total[5m])

# Time series count
prometheus_tsdb_symbol_table_size_bytes

# WAL corruptions
rate(prometheus_tsdb_wal_corruptions_total[5m])

# Rule evaluation duration
prometheus_rule_evaluation_duration_seconds

# Query duration
rate(prometheus_engine_query_duration_seconds_sum[5m])
/
rate(prometheus_engine_query_duration_seconds_count[5m])

# Alertmanager notifications
rate(alertmanager_notifications_total[5m])

# Grafana active sessions
grafana_stat_active_users
```

## Step 7: Backup and Disaster Recovery

```bash
# Snapshot Prometheus data
curl -X POST http://prometheus:9090/api/v1/admin/tsdb/snapshot

# Backup to S3
aws s3 sync /prometheus/snapshots s3://backup-bucket/prometheus/

# Restore from snapshot
cp -r /backup/snapshot/* /prometheus/
```

### Automated Backups

```yaml
# backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: prometheus-backup
  namespace: monitoring
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: amazon/aws-cli:latest
            command:
            - /bin/sh
            - -c
            - |
              SNAPSHOT=$(curl -X POST http://prometheus:9090/api/v1/admin/tsdb/snapshot | jq -r .data.name)
              aws s3 sync /prometheus/snapshots/$SNAPSHOT s3://backup-bucket/prometheus/$(date +%Y%m%d)/
            volumeMounts:
            - name: prometheus-storage
              mountPath: /prometheus
          volumes:
          - name: prometheus-storage
            persistentVolumeClaim:
              claimName: prometheus-storage
          restartPolicy: OnFailure
```

## Step 8: Production Checklist

### Pre-deployment
- [ ] Configure resource requests and limits
- [ ] Set up persistent storage
- [ ] Enable TLS/HTTPS
- [ ] Configure authentication
- [ ] Set retention policies
- [ ] Create backup strategy
- [ ] Test disaster recovery
- [ ] Set up monitoring for monitoring
- [ ] Configure high availability
- [ ] Document runbooks

### Post-deployment
- [ ] Verify all targets are scraped
- [ ] Check alert routing
- [ ] Test alert notifications
- [ ] Verify Grafana dashboards
- [ ] Monitor resource usage
- [ ] Check for errors in logs
- [ ] Validate backup process
- [ ] Test failover scenarios
- [ ] Review query performance
- [ ] Update documentation

## Step 9: Scaling Strategies

### Vertical Scaling
```yaml
# Increase resources
resources:
  requests:
    cpu: "4000m"
    memory: "8Gi"
  limits:
    cpu: "8000m"
    memory: "16Gi"
```

### Horizontal Scaling (Federation)
```yaml
# Global Prometheus federates from local
scrape_configs:
  - job_name: 'federate'
    honor_labels: true
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job=~".+"}'
    static_configs:
      - targets:
        - 'prometheus-us-west:9090'
        - 'prometheus-us-east:9090'
        - 'prometheus-eu-west:9090'
```

### Sharding
```yaml
# Shard by modulo
relabel_configs:
  - source_labels: [__address__]
    modulus: 3
    target_label: __tmp_hash
    action: hashmod
  - source_labels: [__tmp_hash]
    regex: "0"  # This instance handles shard 0
    action: keep
```

## Key Takeaways

- ✅ Deploy HA Prometheus with StatefulSets
- ✅ Use Thanos for long-term storage
- ✅ Implement proper security (TLS, auth)
- ✅ Set resource limits and health checks
- ✅ Monitor the monitoring stack
- ✅ Plan for disaster recovery
- ✅ Scale horizontally with federation
- ✅ Follow production best practices

## Next Steps

You've completed the Prometheus & Grafana tutorial series! Consider:
- Exploring other monitoring stacks (ELK, Loki, Jaeger)
- Implementing OpenTelemetry for unified observability
- Building custom exporters for your applications
- Contributing to community dashboards

## Additional Resources

- [Prometheus Operator](https://github.com/prometheus-operator/prometheus-operator)
- [Thanos Documentation](https://thanos.io/tip/thanos/getting-started.md/)
- [Production Best Practices](https://prometheus.io/docs/practices/)
- [Scaling Prometheus](https://prometheus.io/docs/prometheus/latest/federation/)
