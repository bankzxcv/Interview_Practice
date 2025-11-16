# Kubernetes Tutorial 08: StatefulSets

## 🎯 Learning Objectives

- Understand StatefulSets vs Deployments
- Deploy stateful applications with stable identities
- Use headless services for stable network IDs
- Implement ordered deployment and scaling
- Manage persistent storage with volumeClaimTemplates
- Learn about pod management policies
- Deploy databases and clustered applications

## 📋 Prerequisites

- Completed [07_persistent_volumes](../07_persistent_volumes/)
- kind cluster "learning" is running
- kubectl configured
- Understanding of PVCs and Services

## 📝 What We're Building

```
StatefulSet: database
├── Pod: database-0 (stable identity)
│   ├── Hostname: database-0
│   ├── DNS: database-0.database-service.default.svc.cluster.local
│   └── PVC: data-database-0
├── Pod: database-1
│   ├── Hostname: database-1
│   ├── DNS: database-1.database-service.default.svc.cluster.local
│   └── PVC: data-database-1
└── Pod: database-2
    ├── Hostname: database-2
    ├── DNS: database-2.database-service.default.svc.cluster.local
    └── PVC: data-database-2
```

## 🔍 Concepts Introduced

### 1. **StatefulSet vs Deployment**

| Feature | Deployment | StatefulSet |
|---------|------------|-------------|
| Pod names | Random hash | Ordered index (0, 1, 2...) |
| Pod identity | Ephemeral | Stable |
| Scaling order | Random | Ordered (0→1→2) |
| Storage | Shared or none | Dedicated per pod |
| Network ID | Random | Stable DNS |
| Use case | Stateless apps | Stateful apps |

### 2. **When to Use StatefulSets**

**Use StatefulSets for**:
- Databases (MySQL, PostgreSQL, MongoDB)
- Message queues (Kafka, RabbitMQ)
- Distributed systems (Elasticsearch, Cassandra)
- Applications requiring:
  - Stable network identifiers
  - Stable storage
  - Ordered deployment/scaling
  - Ordered rolling updates

**Use Deployments for**:
- Web servers
- Stateless APIs
- Microservices without state
- Applications where pod identity doesn't matter

### 3. **Headless Service**

```yaml
service.spec.clusterIP: None
```

**Purpose**:
- No load balancing (direct pod access)
- Each pod gets DNS entry
- DNS: `<pod-name>.<service-name>.<namespace>.svc.cluster.local`
- Used with StatefulSets for stable network IDs

### 4. **StatefulSet Guarantees**

1. **Stable Network Identity**: Pod name persists across restarts
2. **Stable Storage**: PVC persists even if pod deleted
3. **Ordered Deployment**: Pods created 0→1→2
4. **Ordered Scaling**: Scale up 0→1→2, scale down 2→1→0
5. **Ordered Updates**: Rolling updates in reverse order 2→1→0

## 📁 Step-by-Step Implementation

### Step 1: Create Headless Service

```bash
# Apply headless service
kubectl apply -f manifests/01-headless-service.yaml

# Verify service (ClusterIP should be None)
kubectl get service nginx-headless
kubectl describe service nginx-headless
```

### Step 2: Create Basic StatefulSet

```bash
# Apply StatefulSet
kubectl apply -f manifests/02-basic-statefulset.yaml

# Watch pods being created in order
kubectl get pods --watch
# Press Ctrl+C when done

# Notice:
# - nginx-0 created first
# - nginx-1 created after nginx-0 is Ready
# - nginx-2 created after nginx-1 is Ready
```

### Step 3: Explore Stable Network Identities

```bash
# Get pod names
kubectl get pods -l app=nginx

# Check pod hostnames
for i in 0 1 2; do
  echo "Pod nginx-$i hostname:"
  kubectl exec nginx-$i -- hostname
done

# Check DNS resolution
kubectl run -it --rm debug --image=busybox:1.36 --restart=Never -- sh

# Inside the debug pod, run:
nslookup nginx-0.nginx-headless
nslookup nginx-1.nginx-headless
nslookup nginx-2.nginx-headless
exit
```

### Step 4: StatefulSet with Persistent Storage

```bash
# Apply StatefulSet with volumeClaimTemplates
kubectl apply -f manifests/03-statefulset-with-storage.yaml

# Watch PVCs being created automatically
kubectl get pvc

# Notice: One PVC per pod
# - www-web-0
# - www-web-1
# - www-web-2
```

### Step 5: Write Data to Persistent Volumes

```bash
# Write unique data to each pod
for i in 0 1 2; do
  kubectl exec web-$i -- sh -c "echo 'Data from web-$i' > /usr/share/nginx/html/index.html"
done

# Read data from each pod
for i in 0 1 2; do
  echo "Pod web-$i serves:"
  kubectl exec web-$i -- cat /usr/share/nginx/html/index.html
done
```

### Step 6: Test Pod Recreation (Identity Persistence)

```bash
# Delete pod web-1
kubectl delete pod web-1

# Watch recreation
kubectl get pods --watch
# Press Ctrl+C when web-1 is ready

# Check data persisted
kubectl exec web-1 -- cat /usr/share/nginx/html/index.html
# Should still show "Data from web-1"

# Check DNS still works
kubectl run -it --rm debug --image=busybox:1.36 --restart=Never -- nslookup web-1.nginx-service
```

### Step 7: Scale StatefulSet

```bash
# Scale up to 5 replicas
kubectl scale statefulset web --replicas=5

# Watch ordered scaling
kubectl get pods --watch
# Pods created: web-3, then web-4

# Scale down to 3
kubectl scale statefulset web --replicas=3

# Watch ordered termination
kubectl get pods --watch
# Pods deleted: web-4, then web-3

# PVCs remain (not deleted)
kubectl get pvc
# web-3 and web-4 PVCs still exist
```

### Step 8: Deploy MongoDB Replica Set

```bash
# Apply MongoDB StatefulSet
kubectl apply -f manifests/04-mongodb-statefulset.yaml

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod -l app=mongodb --timeout=120s

# Initialize replica set
kubectl exec mongodb-0 -- mongosh --eval 'rs.initiate({
  _id: "rs0",
  members: [
    {_id: 0, host: "mongodb-0.mongodb-service:27017"},
    {_id: 1, host: "mongodb-1.mongodb-service:27017"},
    {_id: 2, host: "mongodb-service:27017"}
  ]
})'

# Check replica set status
kubectl exec mongodb-0 -- mongosh --eval 'rs.status()'
```

### Step 9: Rolling Update

```bash
# Update StatefulSet image
kubectl apply -f manifests/05-statefulset-updated.yaml

# Watch rolling update (reverse order)
kubectl rollout status statefulset/web

# Pods updated: web-2, then web-1, then web-0
kubectl get pods --watch
```

### Step 10: Partition Updates (Canary)

```bash
# Apply StatefulSet with partition
kubectl apply -f manifests/06-statefulset-partition.yaml

# Only pods >= partition are updated
# partition: 2 means only web-2, web-3, web-4... are updated
# web-0 and web-1 remain on old version
```

## ✅ Verification

### 1. Check StatefulSet Status

```bash
# Get StatefulSet
kubectl get statefulset

# Detailed view
kubectl get statefulset -o wide

# Describe StatefulSet
kubectl describe statefulset web

# Check rollout status
kubectl rollout status statefulset/web
```

### 2. Verify Pod Ordering

```bash
# Get pods with creation timestamp
kubectl get pods -l app=web -o custom-columns=NAME:.metadata.name,CREATED:.metadata.creationTimestamp --sort-by=.metadata.creationTimestamp
```

### 3. Check Persistent Storage

```bash
# List PVCs created by StatefulSet
kubectl get pvc -l app=web

# Verify each pod has its own PVC
kubectl get pods -l app=web -o custom-columns=NAME:.metadata.name,PVC:.spec.volumes[0].persistentVolumeClaim.claimName
```

### 4. Test DNS Resolution

```bash
# Resolve individual pods
kubectl run -it --rm debug --image=busybox:1.36 --restart=Never -- sh

# Inside pod:
nslookup web-0.nginx-service.default.svc.cluster.local
nslookup web-1.nginx-service.default.svc.cluster.local
exit
```

### 5. Verify Data Persistence

```bash
# Write data to pod
kubectl exec web-0 -- sh -c 'echo "test data" > /usr/share/nginx/html/test.txt'

# Delete pod
kubectl delete pod web-0

# Wait for recreation
kubectl wait --for=condition=ready pod/web-0 --timeout=60s

# Data should persist
kubectl exec web-0 -- cat /usr/share/nginx/html/test.txt
```

## 🧪 Hands-On Exercises

### Exercise 1: Deploy PostgreSQL Cluster

```bash
# Create StatefulSet with 3 PostgreSQL replicas
# Configure streaming replication
# Test failover
```

### Exercise 2: Elasticsearch Cluster

```bash
# Deploy 3-node Elasticsearch cluster
# Each node with dedicated storage
# Configure cluster discovery via DNS
```

### Exercise 3: Ordered Initialization

```bash
# Create StatefulSet with init containers
# Each pod waits for previous pod to be ready
# Implement chain initialization
```

## 🧹 Cleanup

```bash
# Delete StatefulSet
kubectl delete statefulset --all

# Delete headless services
kubectl delete service nginx-headless mongodb-service

# Delete PVCs (won't be auto-deleted)
kubectl delete pvc --all

# Verify cleanup
kubectl get statefulset,pvc,pods
```

## 📚 What You Learned

✅ Created StatefulSets with stable identities
✅ Used headless services for stable DNS
✅ Implemented persistent storage per pod
✅ Observed ordered deployment and scaling
✅ Deployed stateful applications (MongoDB)
✅ Performed rolling updates with partitions
✅ Understood StatefulSet guarantees

## 🎓 Key Concepts

### Pod Management Policies

**OrderedReady** (default):
```yaml
spec.podManagementPolicy: OrderedReady
```
- Pods created/deleted in order (0→1→2)
- Wait for pod to be Ready before next
- Safe for most stateful apps

**Parallel**:
```yaml
spec.podManagementPolicy: Parallel
```
- Pods created/deleted in parallel
- Faster but no ordering guarantees
- Use when order doesn't matter

### Update Strategies

**RollingUpdate** (default):
```yaml
spec.updateStrategy.type: RollingUpdate
spec.updateStrategy.rollingUpdate.partition: 0
```
- Update pods in reverse order (N→0)
- `partition`: Only pods >= partition are updated
- Canary deployments: Set partition to N-1

**OnDelete**:
```yaml
spec.updateStrategy.type: OnDelete
```
- Pods updated only when manually deleted
- Manual control over updates
- Good for critical stateful apps

### StatefulSet Naming

```
<statefulset-name>-<ordinal>

Examples:
- web-0, web-1, web-2
- mongodb-0, mongodb-1, mongodb-2
```

### PVC Naming (volumeClaimTemplates)

```
<volumeClaimTemplate-name>-<statefulset-name>-<ordinal>

Examples:
- www-web-0
- www-web-1
- data-mongodb-0
```

## 🔜 Next Steps

Move to [09_daemonset](../09_daemonset/) where you'll:
- Run pods on every node
- Deploy node-level services
- Implement logging and monitoring agents
- Use node selectors and taints/tolerations

## 💡 Pro Tips

1. **Force delete stuck StatefulSet**:
   ```bash
   kubectl delete statefulset <name> --grace-period=0 --force
   ```

2. **Scale to zero** (careful!):
   ```bash
   kubectl scale statefulset web --replicas=0
   # PVCs remain, data preserved
   ```

3. **Delete StatefulSet but keep pods**:
   ```bash
   kubectl delete statefulset web --cascade=orphan
   ```

4. **Access specific pod**:
   ```bash
   kubectl exec -it web-0 -- /bin/sh
   ```

5. **Watch scaling in real-time**:
   ```bash
   watch kubectl get pods -l app=web
   ```

## 🆘 Troubleshooting

**Problem**: Pods stuck in `Pending`
**Solution**: Check PVC binding:
```bash
kubectl describe pod <pod-name>
kubectl get pvc
```

**Problem**: Pod not starting after previous pod
**Solution**: Check previous pod is Ready:
```bash
kubectl get pods
kubectl describe pod <previous-pod>
```

**Problem**: Can't scale down
**Solution**: Check for errors in pods:
```bash
kubectl describe statefulset <name>
kubectl logs <pod-name>
```

**Problem**: DNS resolution fails
**Solution**: Check headless service:
```bash
kubectl get service <service-name>
# Ensure clusterIP: None
```

**Problem**: PVC not deleted with StatefulSet
**Solution**: This is by design (data preservation):
```bash
# Manually delete PVCs
kubectl delete pvc --all
```

## 📖 Additional Reading

- [StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Run Replicated Stateful Application](https://kubernetes.io/docs/tasks/run-application/run-replicated-stateful-application/)
- [StatefulSet Basics](https://kubernetes.io/docs/tutorials/stateful-application/basic-stateful-set/)

---

**Estimated Time**: 60-75 minutes
**Difficulty**: Intermediate to Advanced
**Prerequisites**: Tutorial 07 completed
