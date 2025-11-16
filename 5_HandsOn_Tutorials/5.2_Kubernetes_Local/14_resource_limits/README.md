# Kubernetes Tutorial 14: Resource Limits and Quotas

## 🎯 Learning Objectives

- Understand resource requests and limits
- Implement ResourceQuotas for namespace limits
- Create LimitRanges for default constraints
- Monitor resource usage
- Prevent resource exhaustion
- Implement QoS (Quality of Service) classes
- Handle resource pressure scenarios

## 📋 Prerequisites

- Completed tutorials 01-13
- kind cluster "learning" is running
- kubectl configured
- Understanding of CPU and memory concepts

## 📝 What We're Building

```
Resource Management:
├── Pod Resource Requests/Limits
│   ├── CPU requests and limits
│   └── Memory requests and limits
├── LimitRange (namespace defaults)
│   ├── Default requests
│   ├── Default limits
│   └── Min/max constraints
├── ResourceQuota (namespace total)
│   ├── Total CPU/memory
│   ├── Object counts
│   └── Storage limits
└── QoS Classes
    ├── Guaranteed (requests = limits)
    ├── Burstable (requests < limits)
    └── BestEffort (no requests/limits)
```

## 🔍 Concepts Deep Dive

### 1. **Resource Types**

**CPU**:
- Measured in cores (1 core = 1000 millicores)
- 100m = 0.1 core, 500m = 0.5 core
- Compressible resource (throttled when limit reached)

**Memory**:
- Measured in bytes (Ki, Mi, Gi)
- 128Mi = 128 mebibytes
- Non-compressible resource (OOMKilled when limit exceeded)

### 2. **Requests vs Limits**

**Request**: Guaranteed resources
- Scheduler uses for placement
- Pod gets at least this much
- Can use more if available

**Limit**: Maximum resources
- Hard cap on usage
- CPU: Throttled when exceeded
- Memory: OOMKilled when exceeded

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "200m"
```

### 3. **QoS Classes**

**Guaranteed** (highest priority):
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"  # Same as request
    cpu: "100m"      # Same as request
```

**Burstable** (medium priority):
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"  # Higher than request
    cpu: "200m"      # Higher than request
```

**BestEffort** (lowest priority):
```yaml
# No resources specified
```

### 4. **LimitRange**

Sets defaults and constraints for namespace:
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: mem-cpu-limits
spec:
  limits:
  - default:        # Default limits
      memory: 512Mi
      cpu: 200m
    defaultRequest: # Default requests
      memory: 256Mi
      cpu: 100m
    max:           # Maximum allowed
      memory: 1Gi
      cpu: 500m
    min:           # Minimum required
      memory: 128Mi
      cpu: 50m
    type: Container
```

### 5. **ResourceQuota**

Sets total limits for namespace:
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: namespace-quota
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    pods: "50"
    services: "20"
    persistentvolumeclaims: "10"
```

## 📁 Step-by-Step Implementation

### Step 1: Create Pod with Resource Requests/Limits

```bash
# Create namespace
kubectl create namespace resources-demo

# Deploy pod with resources
kubectl apply -f manifests/01-pod-with-resources.yaml

# Check pod QoS class
kubectl get pod resource-demo -n resources-demo -o jsonpath='{.status.qosClass}'

# Describe pod to see resources
kubectl describe pod resource-demo -n resources-demo
```

### Step 2: Test Memory Limit (OOMKill)

```bash
# Deploy pod that exceeds memory limit
kubectl apply -f manifests/02-memory-stress-pod.yaml

# Watch pod get OOMKilled
kubectl get pods -n resources-demo --watch

# Check why it was killed
kubectl describe pod memory-stress -n resources-demo | grep -A 5 "Last State"
```

### Step 3: Test CPU Limit (Throttling)

```bash
# Deploy CPU stress pod
kubectl apply -f manifests/03-cpu-stress-pod.yaml

# Monitor CPU usage
kubectl top pod cpu-stress -n resources-demo

# Pod stays running but CPU is throttled
```

### Step 4: Create LimitRange

```bash
# Apply LimitRange
kubectl apply -f manifests/04-limitrange.yaml

# View LimitRange
kubectl describe limitrange mem-cpu-limits -n resources-demo

# Deploy pod without resources (gets defaults from LimitRange)
kubectl apply -f manifests/05-pod-no-resources.yaml

# Check that defaults were applied
kubectl describe pod default-resources -n resources-demo | grep -A 10 "Limits\|Requests"
```

### Step 5: Create ResourceQuota

```bash
# Apply ResourceQuota
kubectl apply -f manifests/06-resourcequota.yaml

# View quota
kubectl describe resourcequota namespace-quota -n resources-demo

# Check current usage
kubectl get resourcequota namespace-quota -n resources-demo -o yaml
```

### Step 6: Test Quota Enforcement

```bash
# Try to exceed quota by deploying many pods
kubectl apply -f manifests/07-quota-test-deployment.yaml

# Some pods will fail to schedule
kubectl get pods -n resources-demo

# Check quota status
kubectl describe resourcequota namespace-quota -n resources-demo
```

### Step 7: QoS Classes

```bash
# Deploy pods with different QoS classes
kubectl apply -f manifests/08-qos-examples.yaml

# Check QoS class for each pod
kubectl get pods -n resources-demo -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass
```

### Step 8: Monitor Resource Usage

```bash
# Install metrics-server (if not already installed)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Wait for metrics-server
kubectl wait --for=condition=ready pod -l k8s-app=metrics-server -n kube-system --timeout=60s

# View node resources
kubectl top nodes

# View pod resources
kubectl top pods -n resources-demo

# View pod resources sorted by memory
kubectl top pods -n resources-demo --sort-by=memory

# View pod resources sorted by CPU
kubectl top pods -n resources-demo --sort-by=cpu
```

### Step 9: Storage Limits

```bash
# Apply storage quota
kubectl apply -f manifests/09-storage-quota.yaml

# Try to create PVC
kubectl apply -f manifests/10-pvc-test.yaml

# Check storage quota usage
kubectl describe resourcequota storage-quota -n resources-demo
```

### Step 10: Priority Classes

```bash
# Create priority classes
kubectl apply -f manifests/11-priority-classes.yaml

# Deploy pods with different priorities
kubectl apply -f manifests/12-priority-pods.yaml

# High priority pods evict low priority when resources scarce
```

## ✅ Verification

### 1. Check Pod Resources

```bash
# View pod resources
kubectl get pod -n resources-demo -o custom-columns=\
NAME:.metadata.name,\
CPU-REQ:.spec.containers[0].resources.requests.cpu,\
CPU-LIM:.spec.containers[0].resources.limits.cpu,\
MEM-REQ:.spec.containers[0].resources.requests.memory,\
MEM-LIM:.spec.containers[0].resources.limits.memory

# Check QoS class
kubectl get pods -n resources-demo -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass
```

### 2. Monitor Resource Usage

```bash
# Top pods
kubectl top pods -n resources-demo

# Watch resource usage
watch kubectl top pods -n resources-demo

# Check node capacity
kubectl describe node | grep -A 5 "Allocated resources"
```

### 3. Verify LimitRange

```bash
# Describe LimitRange
kubectl describe limitrange -n resources-demo

# Create test pod and verify defaults applied
kubectl run test --image=nginx -n resources-demo
kubectl get pod test -n resources-demo -o yaml | grep -A 10 resources
kubectl delete pod test -n resources-demo
```

### 4. Check ResourceQuota

```bash
# View quota usage
kubectl get resourcequota -n resources-demo

# Describe quota
kubectl describe resourcequota -n resources-demo

# Check if quota is exceeded
kubectl get events -n resources-demo | grep quota
```

## 🧪 Hands-On Exercises

### Exercise 1: Implement Resource Strategy

**Task**: Create resource strategy for a namespace:
- LimitRange with defaults: 256Mi/100m request, 512Mi/200m limit
- ResourceQuota: Max 10 pods, 4 CPU, 8Gi memory
- Deploy 5 nginx pods and verify quota

### Exercise 2: Test QoS Eviction

**Task**: Create resource pressure and observe eviction:
- Deploy BestEffort pod
- Deploy Guaranteed pod
- Create memory pressure
- Observe which pod gets evicted first

### Exercise 3: Storage Quotas

**Task**: Implement storage limits:
- Quota: Max 5 PVCs, 10Gi total storage
- Create PVCs until quota exceeded
- Verify enforcement

## 🧹 Cleanup

```bash
# Delete namespace (removes all resources)
kubectl delete namespace resources-demo

# Verify cleanup
kubectl get namespace resources-demo
```

## 📚 What You Learned

✅ Set resource requests and limits
✅ Implemented LimitRanges for defaults
✅ Created ResourceQuotas for namespace limits
✅ Understood QoS classes
✅ Monitored resource usage
✅ Handled resource pressure
✅ Prevented resource exhaustion

## 🎓 Key Concepts

### Resource Best Practices

1. **Always set requests**: For proper scheduling
2. **Set limits cautiously**: Too low = OOMKilled, too high = waste
3. **Use QoS wisely**: Guaranteed for critical, BestEffort for batch
4. **Monitor actual usage**: Adjust based on real metrics
5. **Use LimitRange**: Prevent runaway containers

### Sizing Guidelines

**Starter template**:
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

**Web server**:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

**Database**:
```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1"
```

## 🔜 Next Steps

**Tutorial 15**: Horizontal Pod Autoscaler - Auto-scale based on metrics
- Configure HPA
- Set up metrics server
- Auto-scale deployments

## 💡 Pro Tips

1. **Start conservative**: Begin with low limits, increase based on monitoring
2. **Request < Limit**: Allow bursting but have safety cap
3. **Monitor OOMKills**: `kubectl describe pod` shows Last State
4. **Use VPA**: Vertical Pod Autoscaler can recommend resources
5. **Namespace quotas**: Prevent noisy neighbor problem

## 🆘 Troubleshooting

**Problem**: Pod OOMKilled repeatedly
**Solution**: Increase memory limit or fix memory leak:
```bash
kubectl describe pod <pod> | grep -A 5 "Last State"
# Increase memory limit or fix application
```

**Problem**: Pod stuck in Pending (quota exceeded)
**Solution**: Check quota:
```bash
kubectl describe resourcequota -n <namespace>
# Either delete pods or increase quota
```

**Problem**: CPU throttling
**Solution**: Monitor and adjust:
```bash
kubectl top pod <pod>
# If consistently hitting limit, increase CPU limit
```

## 📖 Additional Reading

- [Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [LimitRange](https://kubernetes.io/docs/concepts/policy/limit-range/)
- [ResourceQuota](https://kubernetes.io/docs/concepts/policy/resource-quotas/)
- [QoS Classes](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/)

---

**Estimated Time**: 60 minutes
**Difficulty**: Intermediate
**Prerequisites**: Tutorials 01-13 completed

**Next**: Tutorial 15 - Horizontal Pod Autoscaler
