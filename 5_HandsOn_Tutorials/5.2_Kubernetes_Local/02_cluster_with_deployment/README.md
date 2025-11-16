# Kubernetes Tutorial 02: Cluster with Deployment

## 🎯 Learning Objectives

- Understand Pods, Deployments, and ReplicaSets
- Deploy your first application to Kubernetes
- Learn how to scale applications
- Explore the relationship between Deployments, ReplicaSets, and Pods
- Update and rollback deployments

## 📋 Prerequisites

- Completed [01_basic_cluster](../01_basic_cluster/)
- kind cluster "learning" is running
- kubectl configured to use kind-learning context

## 📝 What We're Building

```
Deployment: nginx-deployment (3 replicas)
    └── ReplicaSet: nginx-deployment-xxxxx
        ├── Pod: nginx-deployment-xxxxx-aaaaa
        ├── Pod: nginx-deployment-xxxxx-bbbbb
        └── Pod: nginx-deployment-xxxxx-ccccc
```

## 🔍 Concepts Introduced

### 1. **Pod**
- Smallest deployable unit in Kubernetes
- Contains one or more containers
- Shares network namespace (same IP)
- Ephemeral by nature

### 2. **ReplicaSet**
- Ensures a specified number of pod replicas are running
- Maintains desired state
- Usually managed by Deployments (not created directly)

### 3. **Deployment**
- Declarative updates for Pods and ReplicaSets
- Manages rolling updates and rollbacks
- Maintains desired number of replicas
- Recommended way to deploy applications

### 4. **Labels and Selectors**
- Labels: Key-value pairs attached to objects
- Selectors: Query objects by labels
- Core grouping primitive in Kubernetes

## 📁 Step-by-Step Implementation

### Step 1: Verify Cluster is Running

```bash
# Check cluster status
kubectl cluster-info --context kind-learning

# Verify nodes are ready
kubectl get nodes

# If cluster doesn't exist, create it
# cd ../01_basic_cluster
# kind create cluster --config cluster-config.yaml
```

### Step 2: Create Your First Pod (The Hard Way)

Let's first create a standalone pod to understand the concept:

```bash
# Apply the pod manifest
kubectl apply -f manifests/01-standalone-pod.yaml

# Watch pod creation
kubectl get pods --watch
# Press Ctrl+C to stop watching
```

**Examine the pod**:

```bash
# Get pod details
kubectl get pods

# Describe the pod
kubectl describe pod nginx-pod

# Get pod with more details
kubectl get pod nginx-pod -o wide

# See pod logs
kubectl logs nginx-pod

# Execute command in pod
kubectl exec nginx-pod -- nginx -v

# Interactive shell (try it!)
kubectl exec -it nginx-pod -- /bin/bash
# Type 'exit' to leave the shell
```

**Problem with standalone Pods**:

```bash
# Delete the pod
kubectl delete pod nginx-pod

# Try to get it again
kubectl get pods
# It's gone! No automatic restart
```

This is why we use Deployments instead of creating Pods directly.

### Step 3: Create a Deployment

```bash
# Apply deployment manifest
kubectl apply -f manifests/02-nginx-deployment.yaml

# Watch the rollout
kubectl rollout status deployment/nginx-deployment
```

**Expected Output**:
```
deployment.apps/nginx-deployment created
Waiting for deployment "nginx-deployment" rollout to finish: 0 of 3 updated replicas are available...
Waiting for deployment "nginx-deployment" rollout to finish: 1 of 3 updated replicas are available...
Waiting for deployment "nginx-deployment" rollout to finish: 2 of 3 updated replicas are available...
deployment "nginx-deployment" successfully rolled out
```

### Step 4: Explore the Deployment Hierarchy

```bash
# Get deployment
kubectl get deployments
# or
kubectl get deploy

# Get ReplicaSet (created automatically by Deployment)
kubectl get replicasets
# or
kubectl get rs

# Get pods (created automatically by ReplicaSet)
kubectl get pods

# See the full hierarchy with labels
kubectl get all --show-labels
```

**Understanding the relationship**:

```bash
# Deployment creates and manages ReplicaSet
kubectl describe deployment nginx-deployment

# ReplicaSet creates and manages Pods
kubectl describe rs $(kubectl get rs -o name | grep nginx-deployment)

# Pods are the actual running containers
kubectl describe pod $(kubectl get pods -o name | grep nginx-deployment | head -1)
```

### Step 5: Test Self-Healing

```bash
# Get current pods
kubectl get pods

# Delete one pod (copy a pod name from above)
kubectl delete pod <pod-name>

# Immediately check pods again
kubectl get pods

# Notice: A new pod is automatically created!
# The ReplicaSet ensures 3 replicas are always running
```

### Step 6: Scale the Deployment

**Method 1: Using kubectl scale**

```bash
# Scale to 5 replicas
kubectl scale deployment nginx-deployment --replicas=5

# Watch the scaling
kubectl get pods --watch
# Press Ctrl+C to stop

# Verify
kubectl get deployment nginx-deployment
kubectl get pods
```

**Method 2: Edit the deployment**

```bash
# Edit live deployment
kubectl edit deployment nginx-deployment

# Find 'replicas: 5' and change to 'replicas: 3'
# Save and exit

# Watch the scale down
kubectl get pods --watch
```

**Method 3: Apply updated manifest**

```bash
# Apply with updated replicas (already set to 3 in manifest)
kubectl apply -f manifests/02-nginx-deployment.yaml

# Verify
kubectl get deployment nginx-deployment
```

### Step 7: Update the Deployment (Rolling Update)

```bash
# Apply updated deployment with new image version
kubectl apply -f manifests/03-nginx-deployment-updated.yaml

# Watch the rolling update
kubectl rollout status deployment/nginx-deployment

# See rollout history
kubectl rollout history deployment/nginx-deployment
```

**What happened**:
1. New ReplicaSet created with updated image
2. Old pods terminated one by one
3. New pods created one by one
4. Zero downtime update!

```bash
# See both ReplicaSets (old and new)
kubectl get rs

# The old ReplicaSet has 0 desired pods
# The new ReplicaSet has 3 desired pods
```

### Step 8: Rollback a Deployment

```bash
# Rollback to previous version
kubectl rollout undo deployment/nginx-deployment

# Watch the rollback
kubectl rollout status deployment/nginx-deployment

# Check history
kubectl rollout history deployment/nginx-deployment

# See ReplicaSets again
kubectl get rs
# The old ReplicaSet is now active again!
```

**Rollback to specific revision**:

```bash
# See revisions with details
kubectl rollout history deployment/nginx-deployment --revision=1
kubectl rollout history deployment/nginx-deployment --revision=2

# Rollback to specific revision
kubectl rollout undo deployment/nginx-deployment --to-revision=2
```

### Step 9: Advanced Deployment Strategies

Apply deployment with more advanced settings:

```bash
# Apply deployment with update strategy configuration
kubectl apply -f manifests/04-nginx-deployment-advanced.yaml

# See the strategy
kubectl describe deployment nginx-deployment | grep -A 5 "StrategyType"
```

## ✅ Verification

### 1. Check All Resources

```bash
# Get all resources
kubectl get all

# Get with labels
kubectl get all --show-labels

# Get pods with custom columns
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName,IP:.status.podIP
```

**Expected Output**:
```
NAME                                    READY   STATUS    RESTARTS   AGE
pod/nginx-deployment-xxxxx-aaaaa        1/1     Running   0          5m
pod/nginx-deployment-xxxxx-bbbbb        1/1     Running   0          5m
pod/nginx-deployment-xxxxx-ccccc        1/1     Running   0          5m

NAME                               READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/nginx-deployment   3/3     3            3           5m

NAME                                          DESIRED   CURRENT   READY   AGE
replicaset.apps/nginx-deployment-xxxxx        3         3         3       5m
```

### 2. Verify Pod Details

```bash
# Describe a pod
kubectl describe pod $(kubectl get pods -o name | grep nginx-deployment | head -1)

# Check pod logs
kubectl logs $(kubectl get pods -o name | grep nginx-deployment | head -1)

# Get pod YAML
kubectl get pod $(kubectl get pods -o name | grep nginx-deployment | head -1) -o yaml
```

### 3. Test Label Selectors

```bash
# Get pods by label
kubectl get pods -l app=nginx

# Get pods NOT matching label
kubectl get pods -l app!=nginx

# Multiple labels
kubectl get pods -l 'app=nginx,environment=dev'

# Label existence
kubectl get pods -l app
```

### 4. Check Deployment Status

```bash
# Get deployment status
kubectl get deployment nginx-deployment

# Detailed status
kubectl describe deployment nginx-deployment

# Rollout status
kubectl rollout status deployment/nginx-deployment

# Rollout history
kubectl rollout history deployment/nginx-deployment
```

## 🧪 Hands-On Exercises

### Exercise 1: Create Your Own Deployment

Create a deployment for Redis:

```bash
kubectl create deployment redis-deployment --image=redis:7-alpine --replicas=2

# Verify
kubectl get deployments
kubectl get pods
```

### Exercise 2: Scale and Test

```bash
# Scale to 4 replicas
kubectl scale deployment redis-deployment --replicas=4

# Delete 2 pods and watch them recreate
kubectl delete pod <pod-name-1> <pod-name-2>
kubectl get pods --watch
```

### Exercise 3: Update and Rollback

```bash
# Update to different version
kubectl set image deployment/redis-deployment redis=redis:6-alpine

# Watch the update
kubectl rollout status deployment/redis-deployment

# Check history
kubectl rollout history deployment/redis-deployment

# Rollback
kubectl rollout undo deployment/redis-deployment
```

## 🧹 Cleanup

```bash
# Delete nginx deployment
kubectl delete -f manifests/02-nginx-deployment.yaml

# Delete redis deployment
kubectl delete deployment redis-deployment

# Verify all deleted
kubectl get deployments
kubectl get pods

# Keep the cluster running for the next tutorial
```

## 📚 What You Learned

✅ Created and managed Pods directly
✅ Created Deployments to manage Pods automatically
✅ Understood the Deployment → ReplicaSet → Pod hierarchy
✅ Scaled applications up and down
✅ Performed rolling updates with zero downtime
✅ Rolled back to previous versions
✅ Used labels and selectors to query resources
✅ Experienced self-healing capabilities

## 🎓 Key Concepts

### Pod Lifecycle
1. **Pending**: Pod accepted but container not created yet
2. **Running**: Pod bound to node, containers created
3. **Succeeded**: All containers terminated successfully
4. **Failed**: All containers terminated, at least one failed
5. **Unknown**: Pod state cannot be determined

### Deployment Strategy
- **RollingUpdate** (default): Gradually replace old pods with new ones
  - `maxSurge`: Max pods above desired count during update
  - `maxUnavailable`: Max pods below desired count during update
- **Recreate**: Kill all pods, then create new ones (downtime!)

### Labels Best Practices
Common labels:
- `app`: Application name
- `version`: Application version
- `environment`: dev, staging, prod
- `tier`: frontend, backend, database
- `owner`: team name

## 🔜 Next Steps

Move to [03_deployment_service](../03_deployment_service/) where you'll:
- Keep your deployment running
- Expose applications using Services
- Learn about ClusterIP and NodePort
- Access your application from outside the cluster
- Understand service discovery

## 💡 Pro Tips

1. **Quick deployment creation**:
   ```bash
   kubectl create deployment myapp --image=nginx:1.25 --replicas=3 --dry-run=client -o yaml > myapp.yaml
   ```

2. **Watch resources continuously**:
   ```bash
   watch kubectl get pods
   # or
   kubectl get pods --watch
   ```

3. **Get pod names programmatically**:
   ```bash
   kubectl get pods -l app=nginx -o jsonpath='{.items[*].metadata.name}'
   ```

4. **Rollout pause and resume**:
   ```bash
   kubectl rollout pause deployment/nginx-deployment
   # Make multiple changes...
   kubectl rollout resume deployment/nginx-deployment
   ```

5. **Set resource limits in deployment**:
   ```bash
   kubectl set resources deployment nginx-deployment -c=nginx --limits=cpu=200m,memory=512Mi
   ```

## 🆘 Troubleshooting

**Problem**: Pods stuck in `Pending` state
**Solution**: Check events and node resources:
```bash
kubectl describe pod <pod-name>
kubectl get nodes
kubectl describe node <node-name>
```

**Problem**: Pods in `CrashLoopBackOff`
**Solution**: Check logs:
```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # Previous container logs
```

**Problem**: Pods in `ImagePullBackOff`
**Solution**: Check image name and ensure it exists:
```bash
kubectl describe pod <pod-name>
# Look for image pull errors in events
```

**Problem**: Deployment not updating
**Solution**: Check rollout status:
```bash
kubectl rollout status deployment/<deployment-name>
kubectl describe deployment <deployment-name>
```

**Problem**: Can't delete pod
**Solution**: Pods are managed by ReplicaSet. Delete the deployment instead:
```bash
kubectl delete deployment <deployment-name>
```

## 📖 Additional Reading

- [Pods](https://kubernetes.io/docs/concepts/workloads/pods/)
- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [ReplicaSets](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/)
- [Labels and Selectors](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

---

**Estimated Time**: 30-45 minutes
**Difficulty**: Beginner
**Prerequisites**: Tutorial 01 completed
