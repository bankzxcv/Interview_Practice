# Tutorial 08: NATS on Kubernetes

## Overview

NATS is designed for cloud-native environments and has first-class Kubernetes support. This tutorial covers deploying production-ready NATS clusters on Kubernetes using StatefulSets, Helm charts, and the NATS Operator. You'll learn to configure JetStream with persistent storage, set up monitoring, and implement best practices for Kubernetes deployments.

## Learning Objectives

- Deploy NATS using Helm charts
- Use NATS Operator for advanced management
- Configure StatefulSet for clustered deployments
- Set up JetStream with persistent volumes
- Implement service discovery and load balancing
- Configure monitoring with Prometheus
- Implement production best practices
- Handle upgrades and scaling

## Prerequisites

- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl configured
- Helm 3.x installed
- Basic Kubernetes knowledge (pods, services, deployments)
- 8GB RAM for local clusters

## Architecture

```
┌─────────────────────────────────────────────┐
│         Kubernetes Cluster                  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Namespace: nats-system              │  │
│  │                                      │  │
│  │  StatefulSet: nats                   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ │  │
│  │  │ nats-0  │ │ nats-1  │ │ nats-2  │ │  │
│  │  │  (Pod)  │ │  (Pod)  │ │  (Pod)  │ │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ │  │
│  │       │           │           │      │  │
│  │  ┌────┴───────────┴───────────┴───┐  │  │
│  │  │   Service: nats (ClusterIP)    │  │  │
│  │  └────────────────────────────────┘  │  │
│  │                                      │  │
│  │  PersistentVolumeClaims (JetStream) │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐  │  │
│  │  │ PVC-0  │ │ PVC-1  │ │ PVC-2  │  │  │
│  │  └────────┘ └────────┘ └────────┘  │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Step 1: Simple Deployment (StatefulSet)

Create `nats-namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: nats-system
```

Create `nats-statefulset.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nats
  namespace: nats-system
  labels:
    app: nats
spec:
  selector:
    app: nats
  clusterIP: None  # Headless service for StatefulSet
  ports:
  - name: client
    port: 4222
  - name: cluster
    port: 6222
  - name: monitor
    port: 8222
  - name: metrics
    port: 7777
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: nats
  namespace: nats-system
spec:
  serviceName: nats
  replicas: 3
  selector:
    matchLabels:
      app: nats
  template:
    metadata:
      labels:
        app: nats
    spec:
      containers:
      - name: nats
        image: nats:2.10-alpine
        ports:
        - containerPort: 4222
          name: client
        - containerPort: 6222
          name: cluster
        - containerPort: 8222
          name: monitor
        - containerPort: 7777
          name: metrics
        command:
        - nats-server
        - --config
        - /etc/nats-config/nats.conf
        volumeMounts:
        - name: config
          mountPath: /etc/nats-config
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8222
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /healthz
            port: 8222
          initialDelaySeconds: 10
          periodSeconds: 10
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
      volumes:
      - name: config
        configMap:
          name: nats-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: nats-config
  namespace: nats-system
data:
  nats.conf: |
    port: 4222
    http: 8222

    cluster {
      name: nats-cluster
      port: 6222

      routes = [
        nats://nats-0.nats.nats-system.svc.cluster.local:6222
        nats://nats-1.nats.nats-system.svc.cluster.local:6222
        nats://nats-2.nats.nats-system.svc.cluster.local:6222
      ]

      cluster_advertise: $CLUSTER_ADVERTISE
      connect_retries: 30
    }

    # Monitoring
    server_name: $POD_NAME
```

Deploy:

```bash
kubectl apply -f nats-namespace.yaml
kubectl apply -f nats-statefulset.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=nats -n nats-system --timeout=300s

# Check pods
kubectl get pods -n nats-system

# Check cluster status
kubectl exec -n nats-system nats-0 -- nats-server --version
```

## Step 2: Helm Deployment

Add NATS Helm repository:

```bash
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm repo update
```

Create `values.yaml`:

```yaml
# NATS Helm values
config:
  cluster:
    enabled: true
    replicas: 3

  jetstream:
    enabled: true
    fileStore:
      pvc:
        size: 10Gi
        storageClassName: standard  # Change based on your cluster
    memStore:
      enabled: true
      size: 2Gi

natsBox:
  enabled: true  # Deploy nats-box for debugging

# Resource limits
container:
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi

# Monitoring
exporter:
  enabled: true
  serviceMonitor:
    enabled: true
    namespace: nats-system

# Service configuration
service:
  enabled: true
  type: ClusterIP
```

Install NATS:

```bash
# Install in nats-system namespace
helm install nats nats/nats \
  --namespace nats-system \
  --create-namespace \
  --values values.yaml

# Wait for deployment
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=nats -n nats-system --timeout=300s

# Check status
helm status nats -n nats-system
kubectl get all -n nats-system
```

## Step 3: JetStream with Persistent Storage

Create `nats-jetstream.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nats-js
  namespace: nats-system
spec:
  selector:
    app: nats-js
  clusterIP: None
  ports:
  - name: client
    port: 4222
  - name: cluster
    port: 6222
  - name: monitor
    port: 8222
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: nats-js
  namespace: nats-system
spec:
  serviceName: nats-js
  replicas: 3
  selector:
    matchLabels:
      app: nats-js
  volumeClaimTemplates:
  - metadata:
      name: js-pvc
    spec:
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 10Gi
  template:
    metadata:
      labels:
        app: nats-js
    spec:
      containers:
      - name: nats
        image: nats:2.10-alpine
        ports:
        - containerPort: 4222
        - containerPort: 6222
        - containerPort: 8222
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: CLUSTER_ADVERTISE
          value: $(POD_NAME).nats-js.$(POD_NAMESPACE).svc.cluster.local
        command:
        - nats-server
        - --config
        - /etc/nats-config/nats.conf
        volumeMounts:
        - name: config
          mountPath: /etc/nats-config
        - name: js-pvc
          mountPath: /data
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8222
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /healthz
            port: 8222
          initialDelaySeconds: 10
          periodSeconds: 10
      volumes:
      - name: config
        configMap:
          name: nats-js-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: nats-js-config
  namespace: nats-system
data:
  nats.conf: |
    port: 4222
    http: 8222
    server_name: $POD_NAME

    cluster {
      name: nats-cluster
      port: 6222
      routes = [
        nats://nats-js-0.nats-js.nats-system.svc.cluster.local:6222
        nats://nats-js-1.nats-js.nats-system.svc.cluster.local:6222
        nats://nats-js-2.nats-js.nats-system.svc.cluster.local:6222
      ]
    }

    jetstream {
      store_dir: /data
      max_memory_store: 1GB
      max_file_store: 10GB
    }
```

Deploy:

```bash
kubectl apply -f nats-jetstream.yaml

# Check PVCs
kubectl get pvc -n nats-system

# Verify JetStream
kubectl exec -n nats-system nats-js-0 -- nats-server --version
```

## Step 4: Client Access

Create `nats-client-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nats-client
  namespace: nats-system
spec:
  type: ClusterIP
  selector:
    app: nats-js
  ports:
  - name: client
    port: 4222
    targetPort: 4222
---
# For external access (LoadBalancer)
apiVersion: v1
kind: Service
metadata:
  name: nats-external
  namespace: nats-system
spec:
  type: LoadBalancer  # Or NodePort for local clusters
  selector:
    app: nats-js
  ports:
  - name: client
    port: 4222
    targetPort: 4222
```

Test connection:

```bash
# Deploy test pod
kubectl run -it --rm nats-box \
  --image=natsio/nats-box:latest \
  --namespace=nats-system \
  --restart=Never -- /bin/sh

# Inside the pod
nats pub -s nats://nats-client:4222 test.subject "Hello from K8s"
nats sub -s nats://nats-client:4222 test.subject
```

## Step 5: Python Client Example

Create `k8s_client.py`:

```python
import asyncio
import nats
import os

async def main():
    # In-cluster: use service DNS
    # nats://nats-client.nats-system.svc.cluster.local:4222

    # From outside: use LoadBalancer IP or NodePort
    nats_url = os.getenv("NATS_URL", "nats://localhost:4222")

    nc = await nats.connect(nats_url)

    print(f"Connected to NATS: {nc.connected_url}")

    # Test pub/sub
    async def handler(msg):
        print(f"Received: {msg.data.decode()}")

    await nc.subscribe("k8s.test", cb=handler)

    for i in range(10):
        await nc.publish("k8s.test", f"Message {i} from Python".encode())
        await asyncio.sleep(0.5)

    await asyncio.sleep(2)
    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Create Kubernetes Job:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: nats-client-job
  namespace: nats-system
spec:
  template:
    spec:
      containers:
      - name: python-client
        image: python:3.11
        command: ["sh", "-c"]
        args:
        - |
          pip install nats-py
          cat > /tmp/client.py << 'EOF'
          import asyncio
          import nats

          async def main():
              nc = await nats.connect("nats://nats-client:4222")
              print(f"Connected: {nc.connected_url}")
              await nc.publish("test", b"Hello from K8s Job")
              await nc.close()

          asyncio.run(main())
          EOF
          python /tmp/client.py
        env:
        - name: NATS_URL
          value: "nats://nats-client:4222"
      restartPolicy: Never
```

## Step 6: Monitoring with Prometheus

Create `servicemonitor.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nats-metrics
  namespace: nats-system
  labels:
    app: nats-js
spec:
  selector:
    app: nats-js
  ports:
  - name: metrics
    port: 7777
    targetPort: 7777
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: nats-metrics
  namespace: nats-system
  labels:
    release: prometheus  # Match your Prometheus label selector
spec:
  selector:
    matchLabels:
      app: nats-js
  endpoints:
  - port: metrics
    interval: 15s
```

Enable Prometheus exporter in NATS config:

```yaml
# Add to nats.conf ConfigMap
http: 8222

# Prometheus exporter
server_tags: [
  "cluster:nats-k8s",
  "environment:production"
]
```

## Step 7: Auto-Scaling (Optional)

Create `hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nats-hpa
  namespace: nats-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: nats-js
  minReplicas: 3
  maxReplicas: 10
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

## Step 8: NATS Operator (Advanced)

Install NATS Operator:

```bash
# Add operator repo
helm repo add nats https://nats-io.github.io/k8s/helm/charts/

# Install operator
helm install nats-operator nats/nats-operator \
  --namespace nats-system \
  --create-namespace
```

Create NatsCluster CRD:

```yaml
apiVersion: nats.io/v1alpha2
kind: NatsCluster
metadata:
  name: nats-cluster
  namespace: nats-system
spec:
  size: 3
  version: "2.10.0"

  pod:
    resources:
      requests:
        cpu: 200m
        memory: 256Mi
      limits:
        cpu: 1000m
        memory: 1Gi

  natsConfig:
    debug: false
    trace: false
    jetstream:
      enabled: true
      memoryStore:
        maxSize: 2Gi
      fileStore:
        maxSize: 10Gi
        storageDirectory: /data/jetstream

  # Persistent storage
  volumeClaimTemplates:
  - metadata:
      name: nats-js-storage
    spec:
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 10Gi
```

## Production Best Practices

### 1. Resource Limits

```yaml
resources:
  requests:
    cpu: 200m      # Minimum CPU
    memory: 256Mi  # Minimum memory
  limits:
    cpu: 1000m     # Max CPU
    memory: 1Gi    # Max memory
```

### 2. Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: nats-pdb
  namespace: nats-system
spec:
  minAvailable: 2  # Keep at least 2 pods during disruptions
  selector:
    matchLabels:
      app: nats-js
```

### 3. Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: nats-network-policy
  namespace: nats-system
spec:
  podSelector:
    matchLabels:
      app: nats-js
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: default  # Allow from default namespace
    ports:
    - protocol: TCP
      port: 4222
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: nats-js
    ports:
    - protocol: TCP
      port: 6222  # Cluster communication
```

### 4. Backup Strategy

```bash
# Backup JetStream data
kubectl exec -n nats-system nats-js-0 -- tar czf /tmp/backup.tar.gz /data

# Copy backup
kubectl cp nats-system/nats-js-0:/tmp/backup.tar.gz ./nats-backup.tar.gz
```

## Upgrading NATS

### Helm Upgrade

```bash
# Update Helm repo
helm repo update

# Upgrade NATS
helm upgrade nats nats/nats \
  --namespace nats-system \
  --values values.yaml \
  --reuse-values

# Rollback if needed
helm rollback nats -n nats-system
```

### StatefulSet Rolling Update

```bash
# Update image
kubectl set image statefulset/nats-js nats=nats:2.10.1-alpine -n nats-system

# Watch rollout
kubectl rollout status statefulset/nats-js -n nats-system
```

## Troubleshooting

### Check Logs

```bash
# Pod logs
kubectl logs -n nats-system nats-js-0

# Follow logs
kubectl logs -n nats-system nats-js-0 -f

# Previous container logs
kubectl logs -n nats-system nats-js-0 --previous
```

### Debug Pod

```bash
# Exec into pod
kubectl exec -it -n nats-system nats-js-0 -- sh

# Check cluster status
kubectl exec -n nats-system nats-js-0 -- nats-server --signal=reopen
```

### Common Issues

**Pods not starting:**
```bash
# Check events
kubectl describe pod nats-js-0 -n nats-system

# Check PVC
kubectl get pvc -n nats-system
```

**Cluster not forming:**
```bash
# Check routes
kubectl exec -n nats-system nats-js-0 -- nats-server --signal=stats
```

## Summary

You've learned:
- ✅ StatefulSet deployment for NATS
- ✅ Helm chart installation
- ✅ JetStream with persistent volumes
- ✅ Service configuration and discovery
- ✅ Monitoring with Prometheus
- ✅ NATS Operator for advanced management
- ✅ Production best practices
- ✅ Upgrading and troubleshooting

## Next Steps

1. Deploy to production Kubernetes cluster
2. Implement GitOps with ArgoCD or Flux
3. Set up multi-region clusters with gateways
4. Integrate with service mesh (Istio, Linkerd)
5. Build microservices using NATS on K8s
6. Implement disaster recovery procedures

---

**Estimated Time**: 3-4 hours
**Difficulty**: Advanced
**Prerequisite**: Kubernetes knowledge, completed previous tutorials
