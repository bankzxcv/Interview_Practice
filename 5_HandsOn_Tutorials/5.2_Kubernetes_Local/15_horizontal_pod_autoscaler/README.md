# Kubernetes Tutorial 15: Horizontal Pod Autoscaler (HPA)

## 🎯 Learning Objectives

- Understand Horizontal Pod Autoscaling
- Install and configure Metrics Server
- Create HPA based on CPU metrics
- Create HPA based on memory metrics
- Use custom metrics for autoscaling
- Monitor autoscaling behavior
- Implement autoscaling best practices

## 📋 Prerequisites

- Completed tutorials 01-14
- kind cluster running
- kubectl configured
- Understanding of resource requests/limits

## 📝 What We're Building

```
Autoscaling Architecture:
├── Metrics Server (collects resource metrics)
├── HPA (makes scaling decisions)
├── Deployment (target to scale)
└── Load Generator (creates demand)

Flow:
Metrics Server → HPA → Check metrics → Scale Deployment
```

## 🔍 Concepts Deep Dive

### 1. **How HPA Works**

```
1. Metrics Server collects pod metrics (CPU, memory)
2. HPA controller queries Metrics Server every 15 seconds
3. HPA calculates desired replicas:
   desiredReplicas = ceil(currentReplicas * (currentMetric / targetMetric))
4. HPA updates Deployment replica count
5. Deployment creates/deletes pods
```

### 2. **HPA Metrics Types**

**Resource Metrics** (built-in):
- CPU utilization (percentage of request)
- Memory utilization

**Custom Metrics** (requires adapter):
- Application metrics (requests/sec, queue length)
- External metrics (cloud provider metrics)

### 3. **Scaling Behavior**

**Scale Up**:
- Calculated every 15 seconds
- Applied immediately when needed
- No delay for aggressive growth

**Scale Down**:
- Calculated every 15 seconds
- Stabilization window (default 5 minutes)
- Gradual scale down to prevent flapping

**Min/Max Replicas**:
```yaml
minReplicas: 2   # Never scale below
maxReplicas: 10  # Never scale above
```

## 📁 Step-by-Step Implementation

### Step 1: Install Metrics Server

```bash
# Install Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# For kind, patch to disable TLS verification
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# Wait for metrics-server
kubectl wait --for=condition=ready pod -l k8s-app=metrics-server -n kube-system --timeout=120s

# Test metrics
kubectl top nodes
kubectl top pods -A
```

### Step 2: Deploy Application

```bash
# Create namespace
kubectl create namespace hpa-demo

# Deploy application
kubectl apply -f manifests/01-deployment.yaml

# Wait for deployment
kubectl wait --for=condition=available deployment/php-apache -n hpa-demo --timeout=60s

# Check current resources
kubectl get deployment php-apache -n hpa-demo
```

### Step 3: Create HPA (CPU-based)

```bash
# Create HPA via manifest
kubectl apply -f manifests/02-hpa-cpu.yaml

# Or create via command
# kubectl autoscale deployment php-apache -n hpa-demo --cpu-percent=50 --min=1 --max=10

# View HPA
kubectl get hpa -n hpa-demo

# Describe HPA
kubectl describe hpa php-apache -n hpa-demo

# Watch HPA
kubectl get hpa php-apache -n hpa-demo --watch
```

### Step 4: Generate Load

```bash
# Start load generator
kubectl apply -f manifests/03-load-generator.yaml

# Watch HPA scale up
kubectl get hpa php-apache -n hpa-demo --watch

# Watch pods increase
kubectl get pods -n hpa-demo --watch

# Check current CPU usage
kubectl top pods -n hpa-demo
```

### Step 5: Observe Scale Up

```bash
# Monitor scaling
watch -n 1 'kubectl get hpa,deployment,pods -n hpa-demo'

# HPA will scale up when CPU > 50% of request
# Should see replicas increase from 1 to multiple

# Check HPA events
kubectl describe hpa php-apache -n hpa-demo | grep -A 10 Events
```

### Step 6: Stop Load and Observe Scale Down

```bash
# Delete load generator
kubectl delete pod load-generator -n hpa-demo

# Watch HPA scale down (takes ~5 minutes)
kubectl get hpa php-apache -n hpa-demo --watch

# Scale down is gradual to prevent flapping
```

### Step 7: HPA with Memory

```bash
# Create HPA based on memory
kubectl apply -f manifests/04-hpa-memory.yaml

# Generate memory pressure
kubectl apply -f manifests/05-memory-load-generator.yaml

# Watch memory-based scaling
kubectl get hpa memory-hpa -n hpa-demo --watch
```

### Step 8: HPA with Multiple Metrics

```bash
# Create HPA with both CPU and memory
kubectl apply -f manifests/06-hpa-multi-metric.yaml

# HPA will scale on whichever metric is higher
kubectl describe hpa multi-metric-hpa -n hpa-demo
```

### Step 9: Advanced HPA Behavior

```bash
# Create HPA with custom scaling behavior
kubectl apply -f manifests/07-hpa-advanced.yaml

# This controls:
# - Scale up: how fast to add pods
# - Scale down: how gradual to remove pods
# - Stabilization windows
```

### Step 10: Monitor HPA

```bash
# Get HPA status
kubectl get hpa -n hpa-demo

# Detailed HPA info
kubectl describe hpa -n hpa-demo

# HPA metrics
kubectl get hpa -n hpa-demo -o yaml

# Check events
kubectl get events -n hpa-demo --sort-by=.metadata.creationTimestamp
```

## ✅ Verification

### 1. Check HPA Status

```bash
# List HPAs
kubectl get hpa -n hpa-demo

# Output shows:
# NAME         REFERENCE               TARGETS   MINPODS   MAXPODS   REPLICAS
# php-apache   Deployment/php-apache   0%/50%    1         10        1

# Describe HPA
kubectl describe hpa php-apache -n hpa-demo
```

### 2. Monitor Metrics

```bash
# Current pod metrics
kubectl top pods -n hpa-demo

# Node metrics
kubectl top nodes

# Watch in real-time
watch kubectl top pods -n hpa-demo
```

### 3. Test Scaling

```bash
# Generate load
kubectl run -it --rm load-generator --image=busybox -n hpa-demo \
  -- /bin/sh -c "while true; do wget -q -O- http://php-apache; done"

# In another terminal, watch scaling
kubectl get hpa php-apache -n hpa-demo --watch

# Should see TARGETS increase and REPLICAS scale up
```

## 🧪 Hands-On Exercises

### Exercise 1: Scale Web Application

**Task**: Create auto-scaling web app:
- Min 2 replicas, max 10
- Scale up at 70% CPU
- Test with load generator

### Exercise 2: Memory-Based Scaling

**Task**: Create HPA based on memory:
- Scale when memory > 80% of request
- Test with memory-intensive workload

### Exercise 3: Combined Metrics

**Task**: Create HPA with CPU and memory:
- Scale on CPU > 60% OR memory > 75%
- Test both scenarios

## 🧹 Cleanup

```bash
# Delete namespace
kubectl delete namespace hpa-demo

# Verify cleanup
kubectl get hpa -n hpa-demo
```

## 📚 What You Learned

✅ Installed and configured Metrics Server
✅ Created CPU-based HPA
✅ Created memory-based HPA
✅ Implemented multi-metric HPA
✅ Monitored autoscaling behavior
✅ Generated load for testing
✅ Understood scaling algorithms

## 🎓 Key Concepts

### HPA Algorithm

```
desiredReplicas = ceil(currentReplicas * (currentMetric / targetMetric))

Example:
- Current replicas: 3
- Current CPU: 75%
- Target CPU: 50%
- Desired replicas: ceil(3 * (75 / 50)) = ceil(4.5) = 5
```

### Best Practices

1. **Set resource requests**: HPA needs them for percentage calculations
2. **Start conservative**: Begin with higher thresholds, tune down
3. **Use appropriate min**: Prevent scaling to zero
4. **Set reasonable max**: Prevent runaway scaling
5. **Monitor behavior**: Adjust based on real traffic patterns

## 🔜 Next Steps

**Tutorial 16**: Helm Basics - Package manager for Kubernetes
- Install Helm
- Use Helm charts
- Manage releases

## 💡 Pro Tips

1. **Quick HPA creation**:
   ```bash
   kubectl autoscale deployment myapp --cpu-percent=50 --min=1 --max=10
   ```

2. **Check HPA calculation**:
   ```bash
   kubectl get hpa myapp -o yaml | grep -A 5 currentMetrics
   ```

3. **Disable HPA temporarily**:
   ```bash
   kubectl patch hpa myapp -p '{"spec":{"minReplicas":0,"maxReplicas":0}}'
   ```

4. **Force scale down immediately**:
   ```bash
   kubectl patch hpa myapp --type='json' -p='[{"op":"add","path":"/spec/behavior/scaleDown/stabilizationWindowSeconds","value":0}]'
   ```

## 🆘 Troubleshooting

**Problem**: HPA shows "unknown" for metrics
**Solution**: Check Metrics Server:
```bash
kubectl get apiservice v1beta1.metrics.k8s.io
kubectl logs -n kube-system deployment/metrics-server
```

**Problem**: HPA not scaling
**Solution**: Verify resource requests are set:
```bash
kubectl get deployment php-apache -n hpa-demo -o yaml | grep -A 5 resources
```

**Problem**: Excessive flapping
**Solution**: Increase stabilization window:
```yaml
behavior:
  scaleDown:
    stabilizationWindowSeconds: 300
```

## 📖 Additional Reading

- [HPA Official Docs](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [HPA Walkthrough](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/)
- [Metrics Server](https://github.com/kubernetes-sigs/metrics-server)

---

**Estimated Time**: 45-60 minutes
**Difficulty**: Intermediate
**Prerequisites**: Tutorials 01-14 completed

**Next**: Tutorial 16 - Helm Basics
