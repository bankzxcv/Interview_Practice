# Tutorial 08: Kubernetes Deployment

Deploy production-ready Redis on Kubernetes with operators, StatefulSets, persistent volumes, Redis Cluster setup, Sentinel configuration, monitoring with Prometheus, and complete manifests.

## Table of Contents
- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Simple Redis Deployment](#simple-redis-deployment)
- [StatefulSet with Persistence](#statefulset-with-persistence)
- [Redis Operator](#redis-operator)
- [Redis Cluster on Kubernetes](#redis-cluster-on-kubernetes)
- [Redis Sentinel on Kubernetes](#redis-sentinel-on-kubernetes)
- [Monitoring and Metrics](#monitoring-and-metrics)
- [Backup and Recovery](#backup-and-recovery)
- [Best Practices](#best-practices)

## Introduction

Running Redis on Kubernetes provides container orchestration, automatic scaling, self-healing, and declarative configuration. This tutorial covers multiple deployment patterns from simple to production-grade.

### Deployment Options

| Option | Complexity | Use Case | HA | Persistence |
|--------|------------|----------|-----|-------------|
| Single Pod | Low | Development | No | Optional |
| StatefulSet | Medium | Single-node production | No | Yes |
| Redis Operator | Medium | Managed HA | Yes | Yes |
| Manual Cluster | High | Custom cluster setup | Yes | Yes |
| Helm Charts | Low-Medium | Quick production setup | Yes | Yes |

## Prerequisites

### Required Tools

```bash
# Kubernetes cluster (minikube, kind, or cloud)
kubectl version

# Helm (for operators)
helm version

# Optional: k9s for cluster management
k9s version
```

### Create Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: redis-system
  labels:
    name: redis-system
```

```bash
kubectl apply -f namespace.yaml
```

## Simple Redis Deployment

### Single Pod Deployment

Create `redis-simple.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-config
  namespace: redis-system
data:
  redis.conf: |
    appendonly yes
    appendfsync everysec
    save 900 1
    save 300 10
    save 60 10000

---
apiVersion: v1
kind: Secret
metadata:
  name: redis-secret
  namespace: redis-system
type: Opaque
stringData:
  password: "changeme123"

---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: redis-system
spec:
  type: ClusterIP
  ports:
  - port: 6379
    targetPort: 6379
    name: redis
  selector:
    app: redis

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: redis-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7.2-alpine
        ports:
        - containerPort: 6379
          name: redis
        command:
        - redis-server
        - /etc/redis/redis.conf
        - --requirepass
        - $(REDIS_PASSWORD)
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password
        volumeMounts:
        - name: config
          mountPath: /etc/redis
        - name: data
          mountPath: /data
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - redis-cli
            - -a
            - $(REDIS_PASSWORD)
            - ping
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - redis-cli
            - -a
            - $(REDIS_PASSWORD)
            - ping
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: config
        configMap:
          name: redis-config
      - name: data
        emptyDir: {}
```

**Deploy:**
```bash
kubectl apply -f redis-simple.yaml

# Check status
kubectl get pods -n redis-system

# Test connection
kubectl exec -it -n redis-system deployment/redis -- redis-cli -a changeme123 ping
```

## StatefulSet with Persistence

### StatefulSet Configuration

Create `redis-statefulset.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-config
  namespace: redis-system
data:
  redis.conf: |
    # Persistence
    appendonly yes
    appendfilename "appendonly.aof"
    appendfsync everysec
    save 900 1
    save 300 10
    save 60 10000

    # RDB
    dbfilename dump.rdb
    dir /data

    # AOF
    aof-use-rdb-preamble yes
    auto-aof-rewrite-percentage 100
    auto-aof-rewrite-min-size 64mb

    # Memory
    maxmemory 512mb
    maxmemory-policy allkeys-lru

    # Networking
    bind 0.0.0.0
    protected-mode yes
    port 6379

    # Logging
    loglevel notice

---
apiVersion: v1
kind: Service
metadata:
  name: redis-headless
  namespace: redis-system
spec:
  clusterIP: None
  ports:
  - port: 6379
    targetPort: 6379
    name: redis
  selector:
    app: redis-statefulset

---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: redis-system
spec:
  type: ClusterIP
  ports:
  - port: 6379
    targetPort: 6379
    name: redis
  selector:
    app: redis-statefulset

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: redis-system
spec:
  serviceName: redis-headless
  replicas: 1
  selector:
    matchLabels:
      app: redis-statefulset
  template:
    metadata:
      labels:
        app: redis-statefulset
    spec:
      containers:
      - name: redis
        image: redis:7.2-alpine
        ports:
        - containerPort: 6379
          name: redis
        command:
        - redis-server
        - /etc/redis/redis.conf
        - --requirepass
        - $(REDIS_PASSWORD)
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password
        volumeMounts:
        - name: config
          mountPath: /etc/redis
        - name: data
          mountPath: /data
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          exec:
            command:
            - sh
            - -c
            - redis-cli -a $REDIS_PASSWORD ping
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
        readinessProbe:
          exec:
            command:
            - sh
            - -c
            - redis-cli -a $REDIS_PASSWORD ping
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
      volumes:
      - name: config
        configMap:
          name: redis-config
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: standard  # Change based on your cluster
      resources:
        requests:
          storage: 10Gi
```

**Deploy:**
```bash
kubectl apply -f redis-statefulset.yaml

# Check StatefulSet
kubectl get statefulset -n redis-system

# Check PVCs
kubectl get pvc -n redis-system

# Check PVs
kubectl get pv
```

## Redis Operator

### Install Redis Operator

**Using Helm:**
```bash
# Add Spotahome Redis Operator repo
helm repo add redis-operator https://spotahome.github.io/redis-operator
helm repo update

# Install operator
helm install redis-operator redis-operator/redis-operator \
  --namespace redis-system \
  --create-namespace

# Verify installation
kubectl get pods -n redis-system -l app.kubernetes.io/name=redis-operator
```

### Deploy Redis with Operator

Create `redis-operator-instance.yaml`:

```yaml
apiVersion: databases.spotahome.com/v1
kind: RedisFailover
metadata:
  name: redis-cluster
  namespace: redis-system
spec:
  sentinel:
    replicas: 3
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 512Mi
    customConfig:
      - "down-after-milliseconds 5000"
      - "failover-timeout 10000"
  redis:
    replicas: 3
    resources:
      requests:
        cpu: 200m
        memory: 256Mi
      limits:
        cpu: 1000m
        memory: 1Gi
    storage:
      persistentVolumeClaim:
        metadata:
          name: redis-data
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 10Gi
          storageClassName: standard
    customConfig:
      - "appendonly yes"
      - "appendfsync everysec"
      - "save 900 1"
      - "save 300 10"
      - "save 60 10000"
      - "maxmemory 512mb"
      - "maxmemory-policy allkeys-lru"
  auth:
    secretPath: redis-secret
```

**Deploy:**
```bash
kubectl apply -f redis-operator-instance.yaml

# Watch deployment
kubectl get redisfailover -n redis-system -w

# Check pods
kubectl get pods -n redis-system -l app.kubernetes.io/component=redis
kubectl get pods -n redis-system -l app.kubernetes.io/component=sentinel
```

### Test Operator Deployment

```bash
# Get service
kubectl get svc -n redis-system

# Connect to Redis
kubectl run redis-client --rm -it --restart=Never \
  --image=redis:7.2-alpine \
  --namespace=redis-system \
  -- redis-cli -h rfr-redis-cluster -a $(kubectl get secret -n redis-system redis-secret -o jsonpath="{.data.password}" | base64 -d) ping

# Test failover
kubectl delete pod -n redis-system rfr-redis-cluster-0

# Watch automatic recovery
kubectl get pods -n redis-system -w
```

## Redis Cluster on Kubernetes

### Redis Cluster Setup

Create `redis-cluster.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-cluster-config
  namespace: redis-system
data:
  redis.conf: |
    cluster-enabled yes
    cluster-config-file /data/nodes.conf
    cluster-node-timeout 5000
    appendonly yes
    appendfsync everysec
    protected-mode no

---
apiVersion: v1
kind: Service
metadata:
  name: redis-cluster
  namespace: redis-system
spec:
  clusterIP: None
  ports:
  - port: 6379
    targetPort: 6379
    name: client
  - port: 16379
    targetPort: 16379
    name: gossip
  selector:
    app: redis-cluster

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
  namespace: redis-system
spec:
  serviceName: redis-cluster
  replicas: 6
  selector:
    matchLabels:
      app: redis-cluster
  template:
    metadata:
      labels:
        app: redis-cluster
    spec:
      containers:
      - name: redis
        image: redis:7.2-alpine
        ports:
        - containerPort: 6379
          name: client
        - containerPort: 16379
          name: gossip
        command:
        - redis-server
        - /etc/redis/redis.conf
        - --requirepass
        - $(REDIS_PASSWORD)
        - --masterauth
        - $(REDIS_PASSWORD)
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password
        volumeMounts:
        - name: config
          mountPath: /etc/redis
        - name: data
          mountPath: /data
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
      volumes:
      - name: config
        configMap:
          name: redis-cluster-config
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi

---
apiVersion: batch/v1
kind: Job
metadata:
  name: redis-cluster-init
  namespace: redis-system
spec:
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: redis-cluster-init
        image: redis:7.2-alpine
        command:
        - sh
        - -c
        - |
          until redis-cli -h redis-cluster-0.redis-cluster -a $REDIS_PASSWORD ping; do
            echo "Waiting for pods..."
            sleep 2
          done

          redis-cli -a $REDIS_PASSWORD --cluster create \
            redis-cluster-0.redis-cluster:6379 \
            redis-cluster-1.redis-cluster:6379 \
            redis-cluster-2.redis-cluster:6379 \
            redis-cluster-3.redis-cluster:6379 \
            redis-cluster-4.redis-cluster:6379 \
            redis-cluster-5.redis-cluster:6379 \
            --cluster-replicas 1 \
            --cluster-yes
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password
```

**Deploy:**
```bash
kubectl apply -f redis-cluster.yaml

# Wait for pods
kubectl wait --for=condition=ready pod -l app=redis-cluster -n redis-system --timeout=300s

# Check cluster status
kubectl exec -it redis-cluster-0 -n redis-system -- redis-cli -a changeme123 cluster info
```

## Redis Sentinel on Kubernetes

### Sentinel Configuration

Create `redis-sentinel.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-config
  namespace: redis-system
data:
  redis.conf: |
    appendonly yes
    appendfsync everysec

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: sentinel-config
  namespace: redis-system
data:
  sentinel.conf: |
    port 26379
    dir /data
    sentinel monitor mymaster redis-0.redis-headless 6379 2
    sentinel auth-pass mymaster changeme123
    sentinel down-after-milliseconds mymaster 5000
    sentinel parallel-syncs mymaster 1
    sentinel failover-timeout mymaster 10000

---
apiVersion: v1
kind: Service
metadata:
  name: redis-headless
  namespace: redis-system
spec:
  clusterIP: None
  ports:
  - port: 6379
    name: redis
  selector:
    app: redis

---
apiVersion: v1
kind: Service
metadata:
  name: sentinel
  namespace: redis-system
spec:
  ports:
  - port: 26379
    name: sentinel
  selector:
    app: sentinel

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: redis-system
spec:
  serviceName: redis-headless
  replicas: 3
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7.2-alpine
        ports:
        - containerPort: 6379
        command:
        - sh
        - -c
        - |
          if [ "$(hostname)" = "redis-0" ]; then
            redis-server /etc/redis/redis.conf --requirepass changeme123
          else
            redis-server /etc/redis/redis.conf --requirepass changeme123 --masterauth changeme123 --replicaof redis-0.redis-headless 6379
          fi
        volumeMounts:
        - name: config
          mountPath: /etc/redis
        - name: data
          mountPath: /data
      volumes:
      - name: config
        configMap:
          name: redis-config
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 5Gi

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sentinel
  namespace: redis-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sentinel
  template:
    metadata:
      labels:
        app: sentinel
    spec:
      containers:
      - name: sentinel
        image: redis:7.2-alpine
        ports:
        - containerPort: 26379
        command:
        - redis-sentinel
        - /etc/redis/sentinel.conf
        volumeMounts:
        - name: config
          mountPath: /etc/redis
        - name: data
          mountPath: /data
      volumes:
      - name: config
        configMap:
          name: sentinel-config
      - name: data
        emptyDir: {}
```

## Monitoring and Metrics

### Redis Exporter

Create `redis-exporter.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: redis-exporter
  namespace: redis-system
  labels:
    app: redis-exporter
spec:
  ports:
  - port: 9121
    name: metrics
  selector:
    app: redis-exporter

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-exporter
  namespace: redis-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis-exporter
  template:
    metadata:
      labels:
        app: redis-exporter
    spec:
      containers:
      - name: redis-exporter
        image: oliver006/redis_exporter:latest
        ports:
        - containerPort: 9121
          name: metrics
        env:
        - name: REDIS_ADDR
          value: "redis://redis-service:6379"
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "200m"

---
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: redis-exporter
  namespace: redis-system
spec:
  selector:
    matchLabels:
      app: redis-exporter
  endpoints:
  - port: metrics
    interval: 30s
```

### Grafana Dashboard

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-dashboard
  namespace: redis-system
data:
  redis-dashboard.json: |
    {
      "dashboard": {
        "title": "Redis Metrics",
        "panels": [
          {
            "title": "Connected Clients",
            "targets": [
              {
                "expr": "redis_connected_clients"
              }
            ]
          },
          {
            "title": "Memory Usage",
            "targets": [
              {
                "expr": "redis_memory_used_bytes"
              }
            ]
          },
          {
            "title": "Commands Per Second",
            "targets": [
              {
                "expr": "rate(redis_commands_processed_total[1m])"
              }
            ]
          }
        ]
      }
    }
```

## Backup and Recovery

### Backup CronJob

Create `backup-cronjob.yaml`:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: redis-backup
  namespace: redis-system
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: redis:7.2-alpine
            command:
            - sh
            - -c
            - |
              # Trigger BGSAVE
              redis-cli -h redis-service -a $REDIS_PASSWORD BGSAVE

              # Wait for save to complete
              while [ $(redis-cli -h redis-service -a $REDIS_PASSWORD LASTSAVE) -le $LAST_SAVE ]; do
                sleep 1
              done

              # Copy to backup location (S3, NFS, etc.)
              # This example uses a PVC
              kubectl cp redis-system/redis-0:/data/dump.rdb /backups/dump-$(date +%Y%m%d-%H%M%S).rdb
            env:
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: redis-secret
                  key: password
            volumeMounts:
            - name: backups
              mountPath: /backups
          restartPolicy: OnFailure
          volumes:
          - name: backups
            persistentVolumeClaim:
              claimName: redis-backups
```

## Best Practices

### 1. Resource Limits

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "200m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### 2. Pod Anti-Affinity

```yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchExpressions:
        - key: app
          operator: In
          values:
          - redis
      topologyKey: kubernetes.io/hostname
```

### 3. Security Context

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 999
  fsGroup: 999
  capabilities:
    drop:
    - ALL
```

### 4. Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: redis-network-policy
  namespace: redis-system
spec:
  podSelector:
    matchLabels:
      app: redis
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: app
    ports:
    - protocol: TCP
      port: 6379
```

### 5. ConfigMap Updates

```yaml
# Use checksum annotation to trigger rolling update on config change
template:
  metadata:
    annotations:
      checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
```

## Summary

In this tutorial, you learned:

1. Simple Redis deployment on Kubernetes
2. StatefulSet with persistent volumes
3. Redis Operator installation and usage
4. Redis Cluster deployment (6 nodes)
5. Redis Sentinel setup for HA
6. Monitoring with Prometheus and Grafana
7. Automated backups with CronJobs
8. Production best practices (resources, security, networking)

**Key Takeaways:**
- Use StatefulSets for stateful Redis deployments
- Operators simplify HA deployment and management
- Always configure persistent volumes
- Implement monitoring and alerting
- Use resource limits and security contexts
- Test backup and recovery procedures
- Apply pod anti-affinity for HA

**Complete Tutorial Series:**
- You've mastered Redis Pub/Sub and Streams from basics to production deployment!
- Apply these patterns to build scalable messaging systems
- Combine with other tutorials for comprehensive message queue knowledge

## Additional Resources

- [Redis on Kubernetes](https://redis.io/docs/getting-started/install-stack/kubernetes/)
- [Kubernetes StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Redis Operator Documentation](https://github.com/spotahome/redis-operator)
- [Prometheus Redis Exporter](https://github.com/oliver006/redis_exporter)
