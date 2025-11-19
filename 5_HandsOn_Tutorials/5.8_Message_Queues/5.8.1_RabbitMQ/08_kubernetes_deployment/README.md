# Tutorial 08: RabbitMQ Kubernetes Deployment

## Objectives

By the end of this tutorial, you will:
- Install and configure the RabbitMQ Cluster Operator
- Deploy RabbitMQ cluster using StatefulSets
- Configure persistent storage with PersistentVolumeClaims
- Set up Services and Ingress for cluster access
- Integrate Prometheus monitoring with ServiceMonitor
- Implement backup and restore procedures
- Configure pod disruption budgets and resource limits
- Handle rolling updates and cluster scaling
- Deploy production-ready RabbitMQ on Kubernetes

## Prerequisites

- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl configured and working
- Helm 3.x installed
- Basic understanding of Kubernetes resources
- Storage class available in your cluster
- 8GB RAM minimum for cluster testing
- Completed Tutorial 05 (Clustering) recommended

## RabbitMQ on Kubernetes Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           RabbitMQ Cluster Operator                  │  │
│  │  (Manages RabbitMQ cluster lifecycle)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              StatefulSet: rabbitmq                   │  │
│  │                                                       │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │  │
│  │  │ rabbitmq-0  │ │ rabbitmq-1  │ │ rabbitmq-2  │   │  │
│  │  │             │ │             │ │             │   │  │
│  │  │  PVC: 10Gi  │ │  PVC: 10Gi  │ │  PVC: 10Gi  │   │  │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │  │
│  └─────────┼───────────────┼───────────────┼──────────┘  │
│            │               │               │              │
│  ┌─────────┼───────────────┼───────────────┼──────────┐  │
│  │         ▼               ▼               ▼          │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │        Service: rabbitmq (Headless)          │  │  │
│  │  │         - rabbitmq-0.rabbitmq                │  │  │
│  │  │         - rabbitmq-1.rabbitmq                │  │  │
│  │  │         - rabbitmq-2.rabbitmq                │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │      Service: rabbitmq-client (ClusterIP)    │  │  │
│  │  │         Port: 5672 (AMQP)                    │  │  │
│  │  │         Port: 15672 (Management)             │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Ingress: rabbitmq.example.com                │  │
│  │         (External access to management UI)           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Prometheus ServiceMonitor                    │  │
│  │         (Scrapes metrics from RabbitMQ pods)         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## Step-by-Step Instructions

### Step 1: Install RabbitMQ Cluster Operator

Create `00-namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: rabbitmq-system
  labels:
    name: rabbitmq-system
```

Install using kubectl:

```bash
# Create namespace
kubectl apply -f 00-namespace.yaml

# Install the cluster operator
kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml

# Verify operator is running
kubectl get pods -n rabbitmq-system

# Wait for operator to be ready
kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=rabbitmq-cluster-operator -n rabbitmq-system --timeout=300s
```

### Step 2: Create Storage Class (if needed)

Create `01-storage-class.yaml`:

```yaml
# For local development (minikube/kind)
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: rabbitmq-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true

---
# For AWS EKS
# apiVersion: storage.k8s.io/v1
# kind: StorageClass
# metadata:
#   name: rabbitmq-storage
# provisioner: kubernetes.io/aws-ebs
# parameters:
#   type: gp3
#   encrypted: "true"
# allowVolumeExpansion: true
# volumeBindingMode: WaitForFirstConsumer

---
# For GKE
# apiVersion: storage.k8s.io/v1
# kind: StorageClass
# metadata:
#   name: rabbitmq-storage
# provisioner: kubernetes.io/gce-pd
# parameters:
#   type: pd-ssd
#   replication-type: regional-pd
# allowVolumeExpansion: true
```

### Step 3: Create ConfigMap for RabbitMQ Configuration

Create `02-configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rabbitmq-config
  namespace: default
data:
  rabbitmq.conf: |
    # Clustering
    cluster_formation.peer_discovery_backend = kubernetes
    cluster_formation.k8s.host = kubernetes.default.svc.cluster.local
    cluster_formation.k8s.address_type = hostname
    cluster_partition_handling = autoheal

    # Queue defaults
    queue_master_locator = min-masters

    # Memory and disk
    vm_memory_high_watermark.relative = 0.6
    vm_memory_high_watermark_paging_ratio = 0.75
    disk_free_limit.absolute = 2GB

    # Networking
    heartbeat = 60
    frame_max = 131072
    channel_max = 2047

    # Management
    management.tcp.port = 15672
    management.load_definitions = /etc/rabbitmq/definitions.json

    # Prometheus
    prometheus.return_per_object_metrics = true

    # Logging
    log.console.level = info
    log.file.level = info

  enabled_plugins: |
    [rabbitmq_management,rabbitmq_peer_discovery_k8s,rabbitmq_prometheus,rabbitmq_federation,rabbitmq_shovel].

  definitions.json: |
    {
      "users": [
        {
          "name": "admin",
          "password": "changeme",
          "tags": "administrator"
        }
      ],
      "vhosts": [
        {
          "name": "/"
        }
      ],
      "permissions": [
        {
          "user": "admin",
          "vhost": "/",
          "configure": ".*",
          "write": ".*",
          "read": ".*"
        }
      ],
      "policies": [
        {
          "name": "ha-all",
          "pattern": ".*",
          "vhost": "/",
          "definition": {
            "ha-mode": "all",
            "ha-sync-mode": "automatic"
          }
        }
      ]
    }
```

### Step 4: Create Secret for RabbitMQ Credentials

Create `03-secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: rabbitmq-secret
  namespace: default
type: Opaque
stringData:
  default-user: "admin"
  default-password: "changeme"
  erlang-cookie: "RABBITMQ_ERLANG_COOKIE_SECRET_CHANGE_ME"
```

### Step 5: Deploy RabbitMQ Cluster using Operator

Create `04-rabbitmq-cluster.yaml`:

```yaml
apiVersion: rabbitmq.com/v1beta1
kind: RabbitmqCluster
metadata:
  name: rabbitmq
  namespace: default
spec:
  replicas: 3
  image: rabbitmq:3.12-management

  # Resource limits
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 2000m
      memory: 2Gi

  # Persistence
  persistence:
    storageClassName: rabbitmq-storage
    storage: 10Gi

  # RabbitMQ configuration
  rabbitmq:
    additionalConfig: |
      cluster_partition_handling = autoheal
      vm_memory_high_watermark.relative = 0.6
      disk_free_limit.absolute = 2GB
      queue_master_locator = min-masters

    additionalPlugins:
      - rabbitmq_federation
      - rabbitmq_shovel
      - rabbitmq_prometheus

    envConfig: |
      RABBITMQ_LOGS=-

  # Service configuration
  service:
    type: ClusterIP

  # Override StatefulSet configuration
  override:
    statefulSet:
      spec:
        template:
          spec:
            containers:
              - name: rabbitmq
                ports:
                  - containerPort: 5672
                    name: amqp
                    protocol: TCP
                  - containerPort: 15672
                    name: management
                    protocol: TCP
                  - containerPort: 15692
                    name: prometheus
                    protocol: TCP
                livenessProbe:
                  exec:
                    command:
                      - rabbitmq-diagnostics
                      - ping
                  initialDelaySeconds: 30
                  periodSeconds: 10
                  timeoutSeconds: 5
                  failureThreshold: 6
                readinessProbe:
                  exec:
                    command:
                      - rabbitmq-diagnostics
                      - check_running
                  initialDelaySeconds: 10
                  periodSeconds: 10
                  timeoutSeconds: 5
                  failureThreshold: 3

            # Pod anti-affinity for high availability
            affinity:
              podAntiAffinity:
                preferredDuringSchedulingIgnoredDuringExecution:
                  - weight: 100
                    podAffinityTerm:
                      labelSelector:
                        matchExpressions:
                          - key: app.kubernetes.io/name
                            operator: In
                            values:
                              - rabbitmq
                      topologyKey: kubernetes.io/hostname

  # TLS configuration (optional)
  # tls:
  #   secretName: rabbitmq-tls
  #   caSecretName: rabbitmq-ca
```

### Step 6: Create Services

Create `05-services.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: rabbitmq-client
  namespace: default
  labels:
    app: rabbitmq
spec:
  type: ClusterIP
  ports:
    - port: 5672
      targetPort: 5672
      protocol: TCP
      name: amqp
    - port: 15672
      targetPort: 15672
      protocol: TCP
      name: management
    - port: 15692
      targetPort: 15692
      protocol: TCP
      name: prometheus
  selector:
    app.kubernetes.io/name: rabbitmq

---
apiVersion: v1
kind: Service
metadata:
  name: rabbitmq-headless
  namespace: default
  labels:
    app: rabbitmq
spec:
  clusterIP: None
  publishNotReadyAddresses: true
  ports:
    - port: 4369
      targetPort: 4369
      protocol: TCP
      name: epmd
    - port: 25672
      targetPort: 25672
      protocol: TCP
      name: cluster
  selector:
    app.kubernetes.io/name: rabbitmq

---
# LoadBalancer service for external access (optional)
# apiVersion: v1
# kind: Service
# metadata:
#   name: rabbitmq-external
#   namespace: default
# spec:
#   type: LoadBalancer
#   ports:
#     - port: 5672
#       targetPort: 5672
#       protocol: TCP
#       name: amqp
#     - port: 15672
#       targetPort: 15672
#       protocol: TCP
#       name: management
#   selector:
#     app.kubernetes.io/name: rabbitmq
```

### Step 7: Create Ingress

Create `06-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: rabbitmq-management
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod"  # If using cert-manager
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - rabbitmq.example.com
      secretName: rabbitmq-tls
  rules:
    - host: rabbitmq.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: rabbitmq-client
                port:
                  number: 15672
```

### Step 8: Create PodDisruptionBudget

Create `07-pdb.yaml`:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: rabbitmq-pdb
  namespace: default
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: rabbitmq
```

### Step 9: Create ServiceMonitor for Prometheus

Create `08-servicemonitor.yaml`:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: rabbitmq-metrics
  namespace: default
  labels:
    app: rabbitmq
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: rabbitmq
  endpoints:
    - port: prometheus
      interval: 15s
      path: /metrics
      scheme: http
```

### Step 10: Deploy Everything

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Deploying RabbitMQ cluster to Kubernetes..."

# Apply all manifests
kubectl apply -f 00-namespace.yaml
echo "✓ Namespace created"

# Wait for operator
kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=rabbitmq-cluster-operator -n rabbitmq-system --timeout=300s
echo "✓ Cluster operator ready"

# Apply storage class (if using local storage)
# kubectl apply -f 01-storage-class.yaml

# Apply configuration
kubectl apply -f 02-configmap.yaml
echo "✓ ConfigMap created"

kubectl apply -f 03-secret.yaml
echo "✓ Secret created"

# Deploy RabbitMQ cluster
kubectl apply -f 04-rabbitmq-cluster.yaml
echo "✓ RabbitMQ cluster resource created"

# Wait for RabbitMQ pods
echo "Waiting for RabbitMQ pods to be ready..."
kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=rabbitmq --timeout=600s
echo "✓ RabbitMQ cluster ready"

# Apply services
kubectl apply -f 05-services.yaml
echo "✓ Services created"

# Apply ingress
kubectl apply -f 06-ingress.yaml
echo "✓ Ingress created"

# Apply PDB
kubectl apply -f 07-pdb.yaml
echo "✓ PodDisruptionBudget created"

# Apply ServiceMonitor (if Prometheus operator is installed)
# kubectl apply -f 08-servicemonitor.yaml

echo ""
echo "Deployment complete!"
echo ""
echo "Access RabbitMQ Management UI:"
echo "  kubectl port-forward svc/rabbitmq-client 15672:15672"
echo "  Then open: http://localhost:15672"
echo ""
echo "Access RabbitMQ AMQP:"
echo "  kubectl port-forward svc/rabbitmq-client 5672:5672"
echo ""
echo "Cluster status:"
kubectl get rabbitmqclusters
echo ""
kubectl get pods -l app.kubernetes.io/name=rabbitmq
```

### Step 11: Create Backup Script

Create `backup-rabbitmq.sh`:

```bash
#!/bin/bash
set -e

NAMESPACE=${NAMESPACE:-default}
POD_NAME=${POD_NAME:-rabbitmq-0}
BACKUP_DIR=${BACKUP_DIR:-./backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Creating RabbitMQ backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Export definitions
echo "Exporting definitions..."
kubectl exec -n "$NAMESPACE" "$POD_NAME" -- \
  rabbitmqctl export_definitions /tmp/definitions.json

kubectl cp "$NAMESPACE/$POD_NAME:/tmp/definitions.json" \
  "$BACKUP_DIR/definitions_$TIMESTAMP.json"

echo "✓ Definitions exported to $BACKUP_DIR/definitions_$TIMESTAMP.json"

# Backup messages (optional, for specific queues)
echo "Backing up queue messages..."
kubectl exec -n "$NAMESPACE" "$POD_NAME" -- \
  rabbitmqctl list_queues name messages -q > "$BACKUP_DIR/queue_stats_$TIMESTAMP.txt"

echo "✓ Queue stats saved to $BACKUP_DIR/queue_stats_$TIMESTAMP.txt"

# Create PVC snapshot (if supported by storage class)
echo "Creating PVC snapshots..."
for pvc in $(kubectl get pvc -n "$NAMESPACE" -l app.kubernetes.io/name=rabbitmq -o name); do
  pvc_name=$(basename "$pvc")
  cat <<EOF | kubectl apply -f -
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: ${pvc_name}-snapshot-${TIMESTAMP}
  namespace: $NAMESPACE
spec:
  source:
    persistentVolumeClaimName: $pvc_name
EOF
  echo "✓ Snapshot created for $pvc_name"
done

echo ""
echo "Backup complete!"
echo "Backup location: $BACKUP_DIR"
```

### Step 12: Create Restore Script

Create `restore-rabbitmq.sh`:

```bash
#!/bin/bash
set -e

NAMESPACE=${NAMESPACE:-default}
POD_NAME=${POD_NAME:-rabbitmq-0}
DEFINITIONS_FILE=$1

if [ -z "$DEFINITIONS_FILE" ]; then
  echo "Usage: $0 <definitions-file>"
  exit 1
fi

if [ ! -f "$DEFINITIONS_FILE" ]; then
  echo "Error: File $DEFINITIONS_FILE not found"
  exit 1
fi

echo "Restoring RabbitMQ from backup..."

# Copy definitions file to pod
kubectl cp "$DEFINITIONS_FILE" "$NAMESPACE/$POD_NAME:/tmp/definitions.json"

# Import definitions
echo "Importing definitions..."
kubectl exec -n "$NAMESPACE" "$POD_NAME" -- \
  rabbitmqctl import_definitions /tmp/definitions.json

echo "✓ Definitions imported successfully"

# Restart to ensure all changes take effect
echo "Restarting RabbitMQ pods..."
kubectl rollout restart statefulset/rabbitmq -n "$NAMESPACE"
kubectl rollout status statefulset/rabbitmq -n "$NAMESPACE"

echo ""
echo "Restore complete!"
```

### Step 13: Create Management Scripts

Create `manage-cluster.sh`:

```bash
#!/bin/bash

NAMESPACE=${NAMESPACE:-default}
POD_PREFIX="rabbitmq"

function cluster_status() {
  echo "=== Cluster Status ==="
  kubectl exec -n "$NAMESPACE" "${POD_PREFIX}-0" -- rabbitmqctl cluster_status
}

function list_queues() {
  echo "=== Queues ==="
  kubectl exec -n "$NAMESPACE" "${POD_PREFIX}-0" -- \
    rabbitmqctl list_queues name type durable auto_delete messages consumers
}

function list_connections() {
  echo "=== Connections ==="
  kubectl exec -n "$NAMESPACE" "${POD_PREFIX}-0" -- \
    rabbitmqctl list_connections name peer_host peer_port state
}

function scale_cluster() {
  REPLICAS=$1
  if [ -z "$REPLICAS" ]; then
    echo "Usage: $0 scale <replicas>"
    exit 1
  fi

  echo "Scaling RabbitMQ cluster to $REPLICAS replicas..."
  kubectl patch rabbitmqcluster rabbitmq -n "$NAMESPACE" \
    --type='json' -p="[{'op': 'replace', 'path': '/spec/replicas', 'value': $REPLICAS}]"

  kubectl rollout status statefulset/rabbitmq -n "$NAMESPACE"
  echo "✓ Cluster scaled to $REPLICAS replicas"
}

function reset_node() {
  NODE=$1
  if [ -z "$NODE" ]; then
    echo "Usage: $0 reset <node-number>"
    exit 1
  fi

  POD_NAME="${POD_PREFIX}-${NODE}"

  echo "Resetting node $POD_NAME..."
  kubectl exec -n "$NAMESPACE" "$POD_NAME" -- rabbitmqctl stop_app
  kubectl exec -n "$NAMESPACE" "$POD_NAME" -- rabbitmqctl reset
  kubectl exec -n "$NAMESPACE" "$POD_NAME" -- rabbitmqctl start_app

  echo "✓ Node $POD_NAME reset complete"
}

case "$1" in
  status)
    cluster_status
    ;;
  queues)
    list_queues
    ;;
  connections)
    list_connections
    ;;
  scale)
    scale_cluster "$2"
    ;;
  reset)
    reset_node "$2"
    ;;
  *)
    echo "Usage: $0 {status|queues|connections|scale|reset}"
    exit 1
    ;;
esac
```

## Testing and Verification

### Verify Cluster Formation

```bash
# Check RabbitMQ cluster resource
kubectl get rabbitmqclusters

# Check pods
kubectl get pods -l app.kubernetes.io/name=rabbitmq

# Check cluster status
kubectl exec rabbitmq-0 -- rabbitmqctl cluster_status

# Check node health
kubectl exec rabbitmq-0 -- rabbitmq-diagnostics check_running
kubectl exec rabbitmq-0 -- rabbitmq-diagnostics check_local_alarms
```

### Test High Availability

```bash
# Create test queue
kubectl exec rabbitmq-0 -- rabbitmqctl eval 'rabbit_amqqueue:declare({resource, <<"/">>, queue, <<"test">>}, true, false, [], none, <<"admin">>).'

# Delete a pod
kubectl delete pod rabbitmq-1

# Watch pod recreation
kubectl get pods -w

# Verify cluster is still healthy
kubectl exec rabbitmq-0 -- rabbitmqctl cluster_status
```

### Test Rolling Update

```bash
# Trigger rolling update
kubectl patch rabbitmqcluster rabbitmq \
  --type='json' -p='[{"op": "replace", "path": "/spec/image", "value": "rabbitmq:3.12-management"}]'

# Watch rolling update
kubectl rollout status statefulset/rabbitmq
```

## Production Best Practices

### 1. Resource Limits

```yaml
resources:
  requests:
    cpu: 1000m
    memory: 2Gi
  limits:
    cpu: 2000m
    memory: 4Gi
```

### 2. Pod Anti-Affinity

```yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
            - key: app.kubernetes.io/name
              operator: In
              values:
                - rabbitmq
        topologyKey: kubernetes.io/hostname
```

### 3. Persistent Storage

```yaml
persistence:
  storageClassName: fast-ssd  # Use SSD for better performance
  storage: 50Gi  # Size based on message retention needs
```

### 4. Monitoring

```bash
# Enable Prometheus ServiceMonitor
kubectl apply -f 08-servicemonitor.yaml

# Verify metrics
kubectl port-forward svc/rabbitmq-client 15692:15692
curl http://localhost:15692/metrics
```

### 5. Backup Strategy

```bash
# Schedule daily backups
kubectl create cronjob rabbitmq-backup \
  --image=bitnami/kubectl \
  --schedule="0 2 * * *" \
  -- /backup/backup-rabbitmq.sh
```

## Troubleshooting

### Issue 1: Pods Not Starting

```bash
# Check pod events
kubectl describe pod rabbitmq-0

# Check logs
kubectl logs rabbitmq-0

# Check PVC status
kubectl get pvc

# Check storage class
kubectl get storageclass
```

### Issue 2: Cluster Formation Failed

```bash
# Check Erlang cookie
kubectl exec rabbitmq-0 -- cat /var/lib/rabbitmq/.erlang.cookie
kubectl exec rabbitmq-1 -- cat /var/lib/rabbitmq/.erlang.cookie

# Check DNS resolution
kubectl exec rabbitmq-0 -- nslookup rabbitmq-headless

# Manually join cluster
kubectl exec rabbitmq-1 -- rabbitmqctl stop_app
kubectl exec rabbitmq-1 -- rabbitmqctl join_cluster rabbit@rabbitmq-0
kubectl exec rabbitmq-1 -- rabbitmqctl start_app
```

### Issue 3: Performance Issues

```bash
# Check resource usage
kubectl top pods -l app.kubernetes.io/name=rabbitmq

# Check node memory
kubectl exec rabbitmq-0 -- rabbitmq-diagnostics memory_breakdown

# Check disk I/O
kubectl exec rabbitmq-0 -- rabbitmq-diagnostics status | grep -A 5 disk
```

## Key Takeaways

1. ✅ Use **RabbitMQ Cluster Operator** for easy management
2. ✅ Deploy with **StatefulSets** for stable network identity
3. ✅ Configure **persistent storage** for durability
4. ✅ Set **pod anti-affinity** for high availability
5. ✅ Implement **PodDisruptionBudget** for safe updates
6. ✅ Monitor with **Prometheus and ServiceMonitor**
7. ✅ Schedule **regular backups**
8. ✅ Test **failure scenarios** before production

## Next Steps

1. Set up monitoring and alerting
2. Configure TLS for secure communication
3. Implement backup automation
4. Test disaster recovery procedures
5. Optimize resource limits for your workload
6. Set up multi-region federation (if needed)

## Additional Resources

- [RabbitMQ Cluster Operator Documentation](https://www.rabbitmq.com/kubernetes/operator/operator-overview.html)
- [Kubernetes StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [RabbitMQ Production Checklist](https://www.rabbitmq.com/production-checklist.html)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

---

**Congratulations!** You've deployed production-ready RabbitMQ on Kubernetes!
