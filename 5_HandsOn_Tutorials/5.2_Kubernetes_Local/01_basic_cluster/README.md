# Kubernetes Tutorial 01: Basic Cluster

## 🎯 Learning Objectives

- Install and configure kind (Kubernetes in Docker)
- Create your first local Kubernetes cluster
- Understand cluster components
- Learn basic kubectl commands
- Explore nodes and system pods

## 📋 Prerequisites

- Docker Desktop installed and running
- kubectl installed
- kind installed

## 📝 What We're Building

```
Local Machine
└── kind cluster "learning"
    ├── Control Plane Node (master)
    │   ├── API Server
    │   ├── Scheduler
    │   ├── Controller Manager
    │   └── etcd
    └── Worker Node (optional)
```

## 🔍 Concepts Introduced

1. **Cluster**: Collection of nodes running Kubernetes
2. **Control Plane**: Brain of Kubernetes (API server, scheduler, etc.)
3. **Node**: Worker machine (physical or virtual)
4. **kubectl**: Command-line tool to interact with Kubernetes
5. **kind**: Tool to run Kubernetes in Docker containers

## 📁 Step-by-Step Implementation

### Step 1: Verify Prerequisites

```bash
# Check Docker is running
docker ps

# Check kubectl is installed
kubectl version --client

# Check kind is installed
kind version
```

### Step 2: Create Cluster Configuration

Create `cluster-config.yaml`:

```yaml
# cluster-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: learning
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
        protocol: TCP
      - containerPort: 443
        hostPort: 443
        protocol: TCP
```

**Explanation**:
- `kind: Cluster`: kind cluster configuration
- `nodes`: Defines cluster nodes
- `control-plane`: Master node running Kubernetes control plane
- `extraPortMappings`: Maps container ports to host (for Ingress later)
- `node-labels`: Labels for node selection (useful for Ingress)

### Step 3: Create the Cluster

```bash
kind create cluster --config cluster-config.yaml
```

**Expected Output**:
```
Creating cluster "learning" ...
 ✓ Ensuring node image (kindest/node:v1.27.3) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-learning"
You can now use your cluster with:

kubectl cluster-info --context kind-learning
```

## ✅ Verification

### 1. Check Cluster Info

```bash
kubectl cluster-info --context kind-learning
```

**Expected Output**:
```
Kubernetes control plane is running at https://127.0.0.1:XXXXX
CoreDNS is running at https://127.0.0.1:XXXXX/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

### 2. List Nodes

```bash
kubectl get nodes
```

**Expected Output**:
```
NAME                     STATUS   ROLES           AGE   VERSION
learning-control-plane   Ready    control-plane   1m    v1.27.3
```

**Explanation**:
- `NAME`: Node name
- `STATUS`: Ready means node is healthy
- `ROLES`: control-plane means this is the master node
- `AGE`: How long the node has been running
- `VERSION`: Kubernetes version

### 3. View Node Details

```bash
kubectl describe node learning-control-plane
```

This shows detailed information about the node:
- Capacity (CPU, memory)
- Allocatable resources
- Conditions (disk pressure, memory pressure, etc.)
- System info
- Running pods

### 4. List System Pods

```bash
kubectl get pods --all-namespaces
```

Or:

```bash
kubectl get pods -A
```

**Expected Output**:
```
NAMESPACE            NAME                                             READY   STATUS    RESTARTS   AGE
kube-system          coredns-5d78c9869d-abc12                        1/1     Running   0          2m
kube-system          coredns-5d78c9869d-xyz34                        1/1     Running   0          2m
kube-system          etcd-learning-control-plane                     1/1     Running   0          2m
kube-system          kindnet-abcde                                   1/1     Running   0          2m
kube-system          kube-apiserver-learning-control-plane           1/1     Running   0          2m
kube-system          kube-controller-manager-learning-control-plane  1/1     Running   0          2m
kube-system          kube-proxy-fghij                                1/1     Running   0          2m
kube-system          kube-scheduler-learning-control-plane           1/1     Running   0          2m
local-path-storage   local-path-provisioner-6bc4bddd6b-klmno         1/1     Running   0          2m
```

**Core Components**:
- **coredns**: DNS server for service discovery
- **etcd**: Key-value store for cluster state
- **kube-apiserver**: API server (handles all REST requests)
- **kube-controller-manager**: Manages controllers (replication, endpoints, etc.)
- **kube-scheduler**: Assigns pods to nodes
- **kube-proxy**: Network proxy on each node
- **kindnet**: CNI (Container Network Interface) for pod networking
- **local-path-provisioner**: Dynamic volume provisioning

### 5. Check Contexts

```bash
kubectl config get-contexts
```

**Expected Output**:
```
CURRENT   NAME            CLUSTER         AUTHINFO        NAMESPACE
*         kind-learning   kind-learning   kind-learning
```

The `*` indicates the current active context.

## 🧪 Exploration Commands

### Get Cluster Info

```bash
# Cluster information
kubectl cluster-info

# Cluster component statuses
kubectl get componentstatuses

# or (deprecated but still useful)
kubectl get cs
```

### Explore Nodes

```bash
# List nodes
kubectl get nodes

# Wide output (more columns)
kubectl get nodes -o wide

# JSON output
kubectl get nodes -o json

# YAML output
kubectl get nodes -o yaml

# Custom columns
kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.capacity.cpu,MEMORY:.status.capacity.memory
```

### Explore Pods

```bash
# All pods in all namespaces
kubectl get pods -A

# Pods in specific namespace
kubectl get pods -n kube-system

# Wide output
kubectl get pods -A -o wide

# Watch for changes
kubectl get pods -A --watch
```

### Get API Resources

```bash
# List all available resources
kubectl api-resources

# List with short names
kubectl api-resources | grep deployment
```

## 🧹 Cleanup

When you're done exploring:

```bash
# Delete the cluster
kind delete cluster --name learning
```

**Verify deletion**:

```bash
# Should show no kind clusters
kind get clusters

# Should show no kind-learning context
kubectl config get-contexts
```

## 📚 What You Learned

✅ How to create a local Kubernetes cluster with kind
✅ Understanding of Kubernetes architecture
✅ Basic kubectl commands for exploring clusters
✅ Kubernetes system components and their roles
✅ How to view and describe nodes
✅ How to list pods across namespaces
✅ Different output formats (wide, json, yaml, custom)

## 🎓 Key Concepts

**Control Plane Components**:
- **kube-apiserver**: Front-end for Kubernetes; all interactions go through it
- **etcd**: Reliable distributed data store; stores cluster state
- **kube-scheduler**: Watches for new pods and assigns them to nodes
- **kube-controller-manager**: Runs controllers (replica, endpoint, service account)

**Node Components** (on every node):
- **kubelet**: Agent that ensures containers are running (not visible as a pod in kind)
- **kube-proxy**: Network proxy maintaining network rules
- **container runtime**: Docker/containerd runs the containers

**Add-ons**:
- **CoreDNS**: Cluster DNS
- **CNI**: Container network interface (kindnet in our case)

## 🔜 Next Steps

Move to [02_cluster_with_deployment](../02_cluster_with_deployment/) where you'll:
- Keep this cluster running
- Deploy your first application
- Learn about Pods, Deployments, and ReplicaSets
- Scale applications

## 💡 Pro Tips

1. **kubectl autocomplete**:
   ```bash
   # bash
   source <(kubectl completion bash)
   echo "source <(kubectl completion bash)" >> ~/.bashrc

   # zsh
   source <(kubectl completion zsh)
   echo "source <(kubectl completion zsh)" >> ~/.zshrc
   ```

2. **Useful aliases**:
   ```bash
   alias k='kubectl'
   alias kgp='kubectl get pods'
   alias kgn='kubectl get nodes'
   alias kga='kubectl get all'
   ```

3. **View all resources**:
   ```bash
   kubectl get all --all-namespaces
   ```

4. **Continuously watch resources**:
   ```bash
   watch kubectl get pods -A
   ```

## 🆘 Troubleshooting

**Problem**: `kind: command not found`
**Solution**: Install kind:
```bash
brew install kind  # macOS
# or from: https://kind.sigs.k8s.io/docs/user/quick-start/
```

**Problem**: `Cannot connect to Docker`
**Solution**: Start Docker Desktop and wait for it to be ready

**Problem**: `Cluster creation fails`
**Solution**:
```bash
# Remove any existing cluster with same name
kind delete cluster --name learning

# Try again
kind create cluster --config cluster-config.yaml
```

**Problem**: `kubectl: connection refused`
**Solution**: Cluster might not be fully started. Wait a minute and try again.

## 📖 Additional Reading

- [kind Quick Start](https://kind.sigs.k8s.io/docs/user/quick-start/)
- [Kubernetes Components](https://kubernetes.io/docs/concepts/overview/components/)
- [kubectl Overview](https://kubernetes.io/docs/reference/kubectl/)

---

**Estimated Time**: 10-15 minutes
**Difficulty**: Beginner
**Cost**: Free (runs locally)
