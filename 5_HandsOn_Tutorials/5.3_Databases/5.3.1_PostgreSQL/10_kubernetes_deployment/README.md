# Tutorial 10: PostgreSQL on Kubernetes - StatefulSets & Production Deployment

## Objectives

- Deploy PostgreSQL on Kubernetes
- Use StatefulSets for stateful applications
- Configure PersistentVolumeClaims (PVCs)
- Implement ConfigMaps and Secrets
- Set up PostgreSQL Operator (Zalando)
- Configure backup automation in Kubernetes
- Implement monitoring with Prometheus
- Understand Kubernetes-specific challenges

## Prerequisites

- Completed Tutorials 01-09
- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl installed and configured
- Helm 3 installed
- Understanding of Kubernetes concepts
- 60-90 minutes

## Kubernetes PostgreSQL Challenges

### Why StatefulSets?
- Stable network identity
- Persistent storage
- Ordered deployment and scaling
- Ordered rolling updates

### Why Not Just Deployments?
- Deployments are for stateless apps
- No stable identity
- No ordered operations
- Not suitable for databases

## Step-by-Step Instructions

### Step 1: Verify Kubernetes Cluster

```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes

# Create namespace for PostgreSQL
kubectl create namespace postgres

# Set default namespace
kubectl config set-context --current --namespace=postgres
```

### Step 2: Simple PostgreSQL StatefulSet

**Create ConfigMap**:
```bash
cat > postgres-configmap.yaml <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: postgres
data:
  POSTGRES_DB: mydb
  POSTGRES_USER: postgres
  # PostgreSQL configuration
  postgresql.conf: |
    max_connections = 100
    shared_buffers = 256MB
    effective_cache_size = 1GB
    maintenance_work_mem = 64MB
    checkpoint_completion_target = 0.9
    wal_buffers = 16MB
    default_statistics_target = 100
    random_page_cost = 1.1
    effective_io_concurrency = 200
    work_mem = 4MB
    min_wal_size = 1GB
    max_wal_size = 4GB
EOF

kubectl apply -f postgres-configmap.yaml
```

**Create Secret**:
```bash
# Create secret for password
kubectl create secret generic postgres-secret \
    --from-literal=POSTGRES_PASSWORD=SecureP@ssw0rd123! \
    --namespace=postgres

# Verify secret
kubectl get secret postgres-secret -o yaml
```

**Create PersistentVolumeClaim**:
```bash
cat > postgres-pvc.yaml <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: postgres
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard  # Use your cluster's storage class
EOF

kubectl apply -f postgres-pvc.yaml
kubectl get pvc
```

**Create StatefulSet**:
```bash
cat > postgres-statefulset.yaml <<EOF
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: postgres
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: postgres-config
              key: POSTGRES_DB
        - name: POSTGRES_USER
          valueFrom:
            configMapKeyRef:
              name: postgres-config
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: POSTGRES_PASSWORD
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        - name: postgres-config-volume
          mountPath: /etc/postgresql/postgresql.conf
          subPath: postgresql.conf
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U postgres
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U postgres
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
      volumes:
      - name: postgres-config-volume
        configMap:
          name: postgres-config
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: standard
      resources:
        requests:
          storage: 10Gi
EOF

kubectl apply -f postgres-statefulset.yaml
kubectl get statefulset
kubectl get pods -w  # Watch until Running
```

**Create Service**:
```bash
cat > postgres-service.yaml <<EOF
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: postgres
spec:
  type: ClusterIP
  ports:
  - port: 5432
    targetPort: 5432
    protocol: TCP
  selector:
    app: postgres
  clusterIP: None  # Headless service for StatefulSet
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-lb
  namespace: postgres
spec:
  type: LoadBalancer  # or NodePort for local clusters
  ports:
  - port: 5432
    targetPort: 5432
    protocol: TCP
  selector:
    app: postgres
EOF

kubectl apply -f postgres-service.yaml
kubectl get services
```

### Step 3: Test PostgreSQL Deployment

```bash
# Connect to PostgreSQL pod
kubectl exec -it postgres-0 -- psql -U postgres

# Create test database
CREATE DATABASE k8s_test;
\c k8s_test

CREATE TABLE deployments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    version VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO deployments (name, version) VALUES
    ('PostgreSQL on K8s', '15.0'),
    ('StatefulSet Demo', '1.0');

SELECT * FROM deployments;
\q
```

### Step 4: Deploy PostgreSQL Operator (Zalando)

**Install Postgres Operator**:
```bash
# Add Helm repository
helm repo add postgres-operator-charts https://opensource.zalando.com/postgres-operator/charts/postgres-operator
helm repo update

# Install operator
helm install postgres-operator postgres-operator-charts/postgres-operator \
    --namespace postgres

# Verify installation
kubectl get pods -n postgres
kubectl get crd | grep postgres
```

**Create PostgreSQL Cluster with Operator**:
```bash
cat > postgres-cluster.yaml <<EOF
apiVersion: "acid.zalan.do/v1"
kind: postgresql
metadata:
  name: postgres-cluster
  namespace: postgres
spec:
  teamId: "postgres"
  volume:
    size: 10Gi
    storageClass: standard
  numberOfInstances: 3
  users:
    myapp:
    - superuser
    - createdb
  databases:
    myapp: myapp
  postgresql:
    version: "15"
    parameters:
      shared_buffers: "256MB"
      max_connections: "100"
      log_statement: "all"
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: "1"
      memory: 1Gi
  patroni:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 33554432  # 32MB
  enableConnectionPooler: true
  enableReplicaConnectionPooler: true
  connectionPooler:
    numberOfInstances: 2
    mode: "transaction"
    schema: "myapp"
    user: "myapp"
    resources:
      requests:
        cpu: 100m
        memory: 100Mi
      limits:
        cpu: 500m
        memory: 500Mi
EOF

kubectl apply -f postgres-cluster.yaml

# Watch cluster creation
kubectl get postgresql -w
kubectl get pods -l cluster-name=postgres-cluster -w
```

### Step 5: Access Operator-Managed Cluster

```bash
# Get cluster information
kubectl get postgresql postgres-cluster -o yaml

# List services
kubectl get svc -l cluster-name=postgres-cluster

# Get credentials
kubectl get secret myapp.postgres-cluster.credentials.postgresql.acid.zalan.do -o 'jsonpath={.data.password}' | base64 -d

# Connect to primary
kubectl port-forward postgres-cluster-0 5432:5432 &
psql -h localhost -U myapp -d myapp

# Test failover
kubectl delete pod postgres-cluster-0
# Watch automatic recovery
kubectl get pods -l cluster-name=postgres-cluster -w
```

### Step 6: Backup Configuration

**Create Backup CronJob**:
```bash
cat > postgres-backup-cronjob.yaml <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: postgres
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            env:
            - name: PGHOST
              value: "postgres-service"
            - name: PGUSER
              value: "postgres"
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD
            command:
            - /bin/sh
            - -c
            - |
              DATE=\$(date +%Y%m%d_%H%M%S)
              pg_dumpall -h \$PGHOST -U \$PGUSER | gzip > /backup/backup_\$DATE.sql.gz
              find /backup -name "backup_*.sql.gz" -mtime +7 -delete
              echo "Backup completed: backup_\$DATE.sql.gz"
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          restartPolicy: OnFailure
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: backup-pvc
  namespace: postgres
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: standard
EOF

kubectl apply -f postgres-backup-cronjob.yaml

# Manually trigger backup job
kubectl create job --from=cronjob/postgres-backup manual-backup-1
kubectl logs job/manual-backup-1
```

### Step 7: Monitoring with Prometheus

**Create ServiceMonitor**:
```bash
cat > postgres-servicemonitor.yaml <<EOF
apiVersion: v1
kind: Service
metadata:
  name: postgres-metrics
  namespace: postgres
  labels:
    app: postgres
spec:
  type: ClusterIP
  ports:
  - name: metrics
    port: 9187
    targetPort: 9187
  selector:
    app: postgres
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: postgres-metrics
  namespace: postgres
  labels:
    app: postgres
spec:
  selector:
    matchLabels:
      app: postgres
  endpoints:
  - port: metrics
    interval: 30s
EOF

kubectl apply -f postgres-servicemonitor.yaml
```

**Add postgres_exporter sidecar**:
```yaml
# Add to StatefulSet containers:
- name: postgres-exporter
  image: prometheuscommunity/postgres-exporter
  ports:
  - containerPort: 9187
    name: metrics
  env:
  - name: DATA_SOURCE_NAME
    value: "postgresql://postgres:$(POSTGRES_PASSWORD)@localhost:5432/postgres?sslmode=disable"
```

### Step 8: Scaling and Updates

**Scale StatefulSet**:
```bash
# Scale to 3 replicas
kubectl scale statefulset postgres --replicas=3

# Watch pods being created
kubectl get pods -w

# Verify all replicas
kubectl get pods -l app=postgres
```

**Rolling Update**:
```bash
# Update PostgreSQL version
kubectl patch statefulset postgres -p '{"spec":{"template":{"spec":{"containers":[{"name":"postgres","image":"postgres:15.2-alpine"}]}}}}'

# Watch rolling update
kubectl rollout status statefulset postgres

# Check rollout history
kubectl rollout history statefulset postgres
```

**Rollback if needed**:
```bash
# Rollback to previous version
kubectl rollout undo statefulset postgres

# Rollback to specific revision
kubectl rollout undo statefulset postgres --to-revision=1
```

### Step 9: High Availability Configuration

**Multi-AZ Deployment**:
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-ha
spec:
  podManagementPolicy: Parallel
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - postgres
            topologyKey: kubernetes.io/hostname
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: topology.kubernetes.io/zone
                operator: In
                values:
                - us-east-1a
                - us-east-1b
                - us-east-1c
```

### Step 10: Production Checklist

**Verify Production Readiness**:
```bash
#!/bin/bash
# production-check.sh

echo "=== PostgreSQL on Kubernetes - Production Readiness ==="

# 1. Check pods are running
echo "1. Pod Status:"
kubectl get pods -l app=postgres

# 2. Check PVCs are bound
echo "2. Persistent Volume Claims:"
kubectl get pvc

# 3. Check resource limits
echo "3. Resource Configuration:"
kubectl get pods -l app=postgres -o jsonpath='{.items[*].spec.containers[*].resources}'

# 4. Check backup job
echo "4. Backup Job Status:"
kubectl get cronjob postgres-backup

# 5. Check monitoring
echo "5. Monitoring Endpoints:"
kubectl get servicemonitor

# 6. Test connection
echo "6. Connection Test:"
kubectl exec postgres-0 -- psql -U postgres -c "SELECT version();"

# 7. Check replication (if multiple replicas)
echo "7. Replication Status:"
kubectl exec postgres-0 -- psql -U postgres -c "SELECT * FROM pg_stat_replication;"

# 8. Storage usage
echo "8. Storage Usage:"
kubectl exec postgres-0 -- df -h /var/lib/postgresql/data

echo ""
echo "=== Production Check Complete ==="
```

## Best Practices for Kubernetes

### 1. Storage
- Use `storageClass` with proper IOPS
- Enable volume snapshots for backups
- Monitor disk usage
- Test restore procedures

### 2. Resource Management
- Set realistic resource limits
- Use QoS classes appropriately
- Monitor resource usage

### 3. High Availability
- Use multiple replicas
- Anti-affinity rules
- Multi-zone deployment
- Regular failover testing

### 4. Security
- Use Secrets for sensitive data
- Network policies
- Pod security policies
- RBAC configuration

### 5. Monitoring
- Prometheus metrics
- Grafana dashboards
- Alert rules
- Log aggregation

## Common Issues

### Issue: Pod Stuck in Pending
**Solution**: Check PVC status, storage class availability

### Issue: Data Loss After Restart
**Solution**: Ensure PVC is properly configured and bound

### Issue: Slow Performance
**Solution**: Check resource limits, storage IOPS, tune PostgreSQL config

### Issue: Connection Refused
**Solution**: Verify service configuration, check pod logs

## Cleanup

```bash
# Delete PostgreSQL resources
kubectl delete statefulset postgres
kubectl delete service postgres-service postgres-lb
kubectl delete pvc postgres-pvc backup-pvc
kubectl delete configmap postgres-config
kubectl delete secret postgres-secret
kubectl delete cronjob postgres-backup

# Delete operator-managed cluster
kubectl delete postgresql postgres-cluster

# Delete namespace
kubectl delete namespace postgres
```

## Next Steps

**Congratulations!** You've completed all 10 PostgreSQL tutorials!

You now have the skills to:
- ✅ Set up PostgreSQL from scratch
- ✅ Configure multi-container environments
- ✅ Design complex database schemas
- ✅ Implement replication for HA
- ✅ Manage backups and recovery
- ✅ Monitor database performance
- ✅ Secure PostgreSQL deployments
- ✅ Optimize query performance
- ✅ Deploy PostgreSQL clusters
- ✅ Run PostgreSQL on Kubernetes

**Suggested Projects**:
1. Build a multi-tenant SaaS application
2. Implement a data pipeline with PostgreSQL
3. Create a monitoring dashboard
4. Deploy a production PostgreSQL cluster on cloud (AWS RDS, GCP Cloud SQL, Azure Database)
5. Contribute to PostgreSQL extensions

## Additional Resources

- [Kubernetes PostgreSQL Operator](https://github.com/zalando/postgres-operator)
- [CrunchyData PostgreSQL Operator](https://github.com/CrunchyData/postgres-operator)
- [CloudNativePG](https://cloudnative-pg.io/)
- [Kubernetes StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [PostgreSQL on Kubernetes Best Practices](https://www.postgresql.org/docs/15/kubernetes.html)

---

**🎉 Congratulations on completing the PostgreSQL Tutorial Series! 🎉**

You're now ready to deploy and manage PostgreSQL in production environments with confidence.
