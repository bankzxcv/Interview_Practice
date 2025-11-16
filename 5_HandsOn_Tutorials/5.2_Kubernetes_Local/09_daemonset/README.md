# Kubernetes Tutorial 09: DaemonSets

## 🎯 Learning Objectives

- Understand DaemonSets and their use cases
- Deploy pods on every node automatically
- Implement node-level services (logging, monitoring)
- Use node selectors and affinity
- Work with taints and tolerations
- Update DaemonSets with rolling updates

## 📋 Prerequisites

- Completed previous tutorials
- kind cluster "learning" is running
- kubectl configured
- Understanding of Deployments and Pods

## 📝 What We're Building

```
DaemonSet: node-agent
    ├── Node: learning-control-plane
    │   └── Pod: node-agent-xxxxx (1 pod per node)
    ├── Node: worker-1 (if multi-node)
    │   └── Pod: node-agent-yyyyy
    └── Node: worker-2 (if multi-node)
        └── Pod: node-agent-zzzzz
```

## 🔍 Concepts Introduced

### 1. **What is a DaemonSet?**

**Purpose**:
- Runs exactly one pod per node
- Automatically adds pod to new nodes
- Removes pod when node is removed
- Ensures all (or some) nodes run a copy of a pod

**Not affected by**:
- Node cordoning
- Manual scaling (replicas field ignored)
- Normal scheduling constraints (mostly)

### 2. **DaemonSet vs Deployment**

| Feature | Deployment | DaemonSet |
|---------|------------|-----------|
| Replicas | Fixed number | One per node |
| Scheduling | Random nodes | All nodes |
| Scaling | Manual/HPA | Auto (follows nodes) |
| Node affinity | Optional | Built-in |
| Use case | Apps | Node services |

### 3. **Common Use Cases**

**Node-level services**:
- **Log collectors**: Fluentd, Filebeat, Logstash
- **Monitoring agents**: Node Exporter, Datadog agent
- **Network plugins**: CNI plugins, kube-proxy
- **Storage plugins**: Ceph, GlusterFS daemons
- **Security**: Intrusion detection, vulnerability scanning
- **Performance**: cAdvisor, Performance monitoring

### 4. **DaemonSet Scheduling**

**Default**: Runs on all nodes

**Selective**: Use node selectors/affinity
- Run only on specific nodes
- Skip control plane nodes
- Target nodes with certain hardware (GPU)

## 📁 Step-by-Step Implementation

### Step 1: Create Basic DaemonSet

```bash
# Apply basic DaemonSet
kubectl apply -f manifests/01-basic-daemonset.yaml

# Get DaemonSet
kubectl get daemonset

# Check pods (one per node)
kubectl get pods -o wide

# In kind (single node), you'll see 1 pod
# In multi-node cluster, one pod per node
```

### Step 2: Explore DaemonSet Behavior

```bash
# Describe DaemonSet
kubectl describe daemonset node-agent

# Check which nodes have pods
kubectl get pods -l app=node-agent -o wide

# See DaemonSet status
kubectl get daemonset node-agent -o wide
```

**Output shows**:
- DESIRED: Number of nodes
- CURRENT: Number of pods running
- READY: Number of ready pods
- UP-TO-DATE: Pods with latest template
- AVAILABLE: Pods passing readiness checks

### Step 3: Deploy Log Collector (Fluentd Example)

```bash
# Apply Fluentd DaemonSet
kubectl apply -f manifests/02-fluentd-daemonset.yaml

# Check pods
kubectl get pods -l app=fluentd

# Check logs
kubectl logs -l app=fluentd --tail=20
```

### Step 4: Deploy Monitoring Agent

```bash
# Apply Node Exporter (Prometheus metrics)
kubectl apply -f manifests/03-node-exporter-daemonset.yaml

# Check metrics endpoint
POD=$(kubectl get pods -l app=node-exporter -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD -- wget -q -O- http://localhost:9100/metrics | head -20
```

### Step 5: Use Node Selector

```bash
# Label a node
kubectl label nodes learning-control-plane disktype=ssd

# Apply DaemonSet with node selector
kubectl apply -f manifests/04-daemonset-node-selector.yaml

# Verify pods only on labeled nodes
kubectl get pods -l app=ssd-agent -o wide
```

### Step 6: Tolerations for Control Plane

```bash
# Apply DaemonSet that tolerates control plane taint
kubectl apply -f manifests/05-daemonset-tolerations.yaml

# Check if pod runs on control plane node
kubectl get pods -l app=system-agent -o wide
```

### Step 7: Update DaemonSet (Rolling Update)

```bash
# Check current image
kubectl get daemonset node-agent -o jsonpath='{.spec.template.spec.containers[0].image}'

# Apply updated DaemonSet
kubectl apply -f manifests/06-daemonset-updated.yaml

# Watch rollout
kubectl rollout status daemonset/node-agent

# Check update strategy
kubectl get daemonset node-agent -o jsonpath='{.spec.updateStrategy}'
```

### Step 8: OnDelete Update Strategy

```bash
# Apply DaemonSet with OnDelete strategy
kubectl apply -f manifests/07-daemonset-ondelete.yaml

# Update the image (won't auto-update)
# Pods updated only when manually deleted

# Delete pod to trigger update
kubectl delete pod -l app=manual-update-agent
```

### Step 9: Priority and Resource Limits

```bash
# Apply DaemonSet with resource constraints
kubectl apply -f manifests/08-daemonset-resources.yaml

# Check resource usage
kubectl top pods -l app=resource-agent
```

### Step 10: Simulate Multi-node Behavior

```bash
# In single-node kind, we can observe DaemonSet
# In production multi-node:

# Add worker node → DaemonSet auto-creates pod
# Remove worker node → DaemonSet auto-deletes pod
# Drain node → DaemonSet pod evicted
# Label node → DaemonSet respects node selector
```

## ✅ Verification

### 1. Check DaemonSet Status

```bash
# List all DaemonSets
kubectl get daemonsets

# Detailed view
kubectl get daemonsets -o wide

# Describe DaemonSet
kubectl describe daemonset node-agent

# Get pods created by DaemonSet
kubectl get pods -l app=node-agent -o wide
```

### 2. Verify One Pod Per Node

```bash
# Count nodes
NODE_COUNT=$(kubectl get nodes --no-headers | wc -l)

# Count DaemonSet pods
POD_COUNT=$(kubectl get pods -l app=node-agent --no-headers | wc -l)

echo "Nodes: $NODE_COUNT, Pods: $POD_COUNT"
# Should be equal (unless node selectors used)
```

### 3. Check Update Strategy

```bash
# Get update strategy
kubectl get daemonset node-agent -o jsonpath='{.spec.updateStrategy.type}'

# RollingUpdate parameters
kubectl get daemonset node-agent -o jsonpath='{.spec.updateStrategy.rollingUpdate}'
```

### 4. Test Node Selector

```bash
# Get nodes with specific label
kubectl get nodes -l disktype=ssd

# Get DaemonSet pods on those nodes
kubectl get pods -l app=ssd-agent -o wide

# Should match
```

### 5. Check Tolerations

```bash
# Get control plane taints
kubectl describe node learning-control-plane | grep Taints

# Check if DaemonSet pods tolerate them
kubectl get pods -l app=system-agent -o wide
```

## 🧪 Hands-On Exercises

### Exercise 1: Create Custom Monitoring DaemonSet

```bash
# Deploy your own monitoring agent
# Collect node metrics
# Export to central location
```

### Exercise 2: Log Aggregation

```bash
# Deploy log collector DaemonSet
# Read logs from /var/log on host
# Forward to centralized logging system
```

### Exercise 3: Node Maintenance

```bash
# Create DaemonSet for node maintenance tasks
# Run periodic cleanup
# Report node health
```

## 🧹 Cleanup

```bash
# Delete all DaemonSets
kubectl delete daemonset --all

# Remove node labels
kubectl label nodes learning-control-plane disktype-

# Verify cleanup
kubectl get daemonsets
kubectl get pods
```

## 📚 What You Learned

✅ Created and managed DaemonSets
✅ Deployed node-level services
✅ Used node selectors for targeted deployment
✅ Implemented tolerations for control plane
✅ Performed rolling updates on DaemonSets
✅ Configured resource limits
✅ Understood DaemonSet use cases

## 🎓 Key Concepts

### Update Strategies

**RollingUpdate** (default):
```yaml
spec:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1  # Max pods unavailable during update
```
- Updates pods gradually
- One node at a time (default)
- Respects maxUnavailable

**OnDelete**:
```yaml
spec:
  updateStrategy:
    type: OnDelete
```
- Updates only when pod manually deleted
- Full control over update timing
- Good for critical system components

### Node Selectors vs Affinity

**Node Selector** (simple):
```yaml
nodeSelector:
  disktype: ssd
```

**Node Affinity** (advanced):
```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: disktype
          operator: In
          values:
          - ssd
          - nvme
```

### Common Tolerations

**Control Plane**:
```yaml
tolerations:
- key: node-role.kubernetes.io/control-plane
  effect: NoSchedule
```

**Master** (deprecated but still used):
```yaml
tolerations:
- key: node-role.kubernetes.io/master
  effect: NoSchedule
```

**Not Ready Node**:
```yaml
tolerations:
- key: node.kubernetes.io/not-ready
  effect: NoExecute
```

## 🔜 Next Steps

Move to [10_jobs](../10_jobs/) where you'll:
- Run batch processing workloads
- Create one-time Jobs
- Schedule recurring CronJobs
- Handle job completion and failures
- Implement parallelism

## 💡 Pro Tips

1. **Get DaemonSet pod on specific node**:
   ```bash
   kubectl get pods -l app=node-agent --field-selector spec.nodeName=learning-control-plane
   ```

2. **Force update all pods**:
   ```bash
   kubectl rollout restart daemonset/node-agent
   ```

3. **Check if DaemonSet is fully updated**:
   ```bash
   kubectl rollout status daemonset/node-agent
   ```

4. **Debug DaemonSet pod**:
   ```bash
   kubectl describe daemonset node-agent
   kubectl logs -l app=node-agent
   ```

5. **Temporarily stop DaemonSet** (delete pods):
   ```bash
   kubectl delete daemonset node-agent
   # Pods will be deleted, can recreate later
   ```

## 🆘 Troubleshooting

**Problem**: No pods created
**Solution**: Check node taints and tolerations:
```bash
kubectl describe nodes
kubectl describe daemonset <name>
```

**Problem**: Pods pending
**Solution**: Check node selectors and resources:
```bash
kubectl describe pod <pod-name>
kubectl get nodes --show-labels
```

**Problem**: Update not rolling out
**Solution**: Check update strategy:
```bash
kubectl get daemonset <name> -o yaml | grep -A 5 updateStrategy
```

**Problem**: Pod on wrong node
**Solution**: DaemonSets ignore some scheduling constraints. Check:
```bash
kubectl describe daemonset <name>
```

**Problem**: Can't delete DaemonSet
**Solution**: Force delete:
```bash
kubectl delete daemonset <name> --grace-period=0 --force
```

## 📖 Additional Reading

- [DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)
- [Taints and Tolerations](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
- [Assigning Pods to Nodes](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/)

---

**Estimated Time**: 30-45 minutes
**Difficulty**: Intermediate
**Prerequisites**: Tutorials 01-08 completed
