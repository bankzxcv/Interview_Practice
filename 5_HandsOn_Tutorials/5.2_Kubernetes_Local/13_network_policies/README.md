# Kubernetes Tutorial 13: Network Policies

## 🎯 Learning Objectives

- Understand Kubernetes Network Policies
- Implement pod-to-pod isolation
- Create ingress (incoming) traffic rules
- Create egress (outgoing) traffic rules
- Use label selectors for policy targets
- Implement namespace isolation
- Create default deny policies
- Debug network policy issues

## 📋 Prerequisites

- Completed tutorials 01-12
- kind cluster "learning" is running (with CNI that supports NetworkPolicy)
- kubectl configured
- Understanding of labels and selectors

## 📝 What We're Building

```
Network Security Architecture:
├── Frontend Tier
│   ├── Can receive from: Ingress
│   └── Can send to: Backend
├── Backend Tier
│   ├── Can receive from: Frontend
│   └── Can send to: Database
├── Database Tier
│   ├── Can receive from: Backend only
│   └── Can send to: Nothing (no egress)
└── Monitoring
    ├── Can receive from: Nothing
    └── Can send to: All (scrape metrics)
```

## 🔍 Concepts Deep Dive

### 1. **What are Network Policies?**

**Purpose**:
- Control traffic between pods
- Firewall rules for Kubernetes
- Namespace-scoped resources
- Implemented by CNI plugin (Calico, Cilium, etc.)

**Default Behavior**:
- Without NetworkPolicy: All traffic allowed
- With NetworkPolicy: Only allowed traffic permitted
- Policies are additive (any policy allowing == allowed)

**Important**: kind uses kindnet by default, which doesn't support NetworkPolicy. For this tutorial, policies are demonstrated but may require Calico or another CNI.

### 2. **NetworkPolicy Types**

**Ingress** (incoming traffic):
- Who can connect TO this pod?
- Control incoming connections

**Egress** (outgoing traffic):
- Where can this pod connect TO?
- Control outgoing connections

**Both**:
```yaml
policyTypes:
- Ingress
- Egress
```

### 3. **Selectors**

**podSelector**:
- Select which pods this policy applies to
- Empty selector = all pods in namespace

**namespaceSelector**:
- Select which namespaces can connect
- Allows cross-namespace communication

**podSelector + namespaceSelector**:
- Both must match (AND operation)
- Pods with label X in namespaces with label Y

### 4. **Policy Structure**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: my-policy
  namespace: default
spec:
  # Which pods does this apply to?
  podSelector:
    matchLabels:
      app: myapp

  # What types of traffic?
  policyTypes:
  - Ingress
  - Egress

  # Ingress rules (who can connect to these pods?)
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 8080

  # Egress rules (where can these pods connect?)
  egress:
  - to:
    - podSelector:
        matchLabels:
          role: database
    ports:
    - protocol: TCP
      port: 5432
```

### 5. **Common Patterns**

**Default Deny All**:
```yaml
# Deny all ingress
podSelector: {}  # All pods
policyTypes:
- Ingress
# No ingress rules = deny all
```

**Allow Specific**:
```yaml
# After default deny, allow specific traffic
podSelector:
  matchLabels:
    app: web
ingress:
- from:
  - podSelector:
      matchLabels:
        app: frontend
```

**Allow from Namespace**:
```yaml
ingress:
- from:
  - namespaceSelector:
      matchLabels:
        name: production
```

## 📁 Step-by-Step Implementation

### Step 1: Create Test Applications

```bash
# Create namespace
kubectl create namespace netpol-demo

# Deploy frontend, backend, database
kubectl apply -f manifests/01-test-apps.yaml

# Wait for pods
kubectl wait --for=condition=ready pod -l tier=frontend -n netpol-demo --timeout=60s
kubectl wait --for=condition=ready pod -l tier=backend -n netpol-demo --timeout=60s
kubectl wait --for=condition=ready pod -l tier=database -n netpol-demo --timeout=60s

# List all pods
kubectl get pods -n netpol-demo --show-labels
```

### Step 2: Test Initial Connectivity (Before Policies)

```bash
# Frontend to Backend (should work)
kubectl exec -n netpol-demo deployment/frontend -- \
  wget -qO- --timeout=2 http://backend:8080

# Backend to Database (should work)
kubectl exec -n netpol-demo deployment/backend -- \
  wget -qO- --timeout=2 http://database:8080

# Frontend to Database (should work - no restrictions yet)
kubectl exec -n netpol-demo deployment/frontend -- \
  wget -qO- --timeout=2 http://database:8080
```

### Step 3: Create Default Deny Policy

```bash
# Apply default deny all ingress
kubectl apply -f manifests/02-default-deny-ingress.yaml

# Test connectivity (all should fail now)
kubectl exec -n netpol-demo deployment/frontend -- \
  wget -qO- --timeout=2 http://backend:8080

# Even backend to database fails
kubectl exec -n netpol-demo deployment/backend -- \
  wget -qO- --timeout=2 http://database:8080
```

### Step 4: Allow Frontend to Backend

```bash
# Allow frontend to connect to backend
kubectl apply -f manifests/03-allow-frontend-to-backend.yaml

# Test: Frontend to Backend (should work now)
kubectl exec -n netpol-demo deployment/frontend -- \
  wget -qO- --timeout=2 http://backend:8080

# Test: Backend to Database (still fails)
kubectl exec -n netpol-demo deployment/backend -- \
  wget -qO- --timeout=2 http://database:8080
```

### Step 5: Allow Backend to Database

```bash
# Allow backend to connect to database
kubectl apply -f manifests/04-allow-backend-to-database.yaml

# Test: Backend to Database (should work now)
kubectl exec -n netpol-demo deployment/backend -- \
  wget -qO- --timeout=2 http://database:8080

# Test: Frontend to Database (should still fail)
kubectl exec -n netpol-demo deployment/frontend -- \
  wget -qO- --timeout=2 http://database:8080
```

### Step 6: Add Egress Policies

```bash
# Restrict outgoing traffic from database
kubectl apply -f manifests/05-database-egress-policy.yaml

# Database can only do DNS lookups, nothing else
kubectl exec -n netpol-demo deployment/database -- \
  nslookup kubernetes.default
```

### Step 7: Allow External Traffic (Ingress from Internet)

```bash
# Allow ingress controller to reach frontend
kubectl apply -f manifests/06-allow-external-to-frontend.yaml

# This typically uses namespaceSelector or CIDR blocks
```

### Step 8: Namespace Isolation

```bash
# Create isolated namespace
kubectl create namespace isolated

# Apply namespace isolation policy
kubectl apply -f manifests/07-namespace-isolation.yaml

# Pods in isolated namespace can't talk to netpol-demo
```

### Step 9: Allow DNS

```bash
# Allow all pods to access DNS
kubectl apply -f manifests/08-allow-dns.yaml

# Critical: DNS is usually needed for all pods
```

### Step 10: Monitor and Debug

```bash
# List all network policies
kubectl get networkpolicies -n netpol-demo

# Describe specific policy
kubectl describe networkpolicy deny-all-ingress -n netpol-demo

# Check which policies apply to a pod
kubectl get networkpolicies -n netpol-demo -o json | \
  jq -r '.items[] | select(.spec.podSelector.matchLabels.tier=="backend") | .metadata.name'
```

## ✅ Verification

### 1. List Network Policies

```bash
# All policies in namespace
kubectl get networkpolicies -n netpol-demo

# Wide output
kubectl get networkpolicies -n netpol-demo -o wide

# All namespaces
kubectl get networkpolicies --all-namespaces
```

### 2. Describe Policy

```bash
# See policy details
kubectl describe networkpolicy allow-frontend-to-backend -n netpol-demo

# Get YAML
kubectl get networkpolicy allow-frontend-to-backend -n netpol-demo -o yaml
```

### 3. Test Connectivity

```bash
# Helper function for testing
test_connection() {
  FROM=$1
  TO=$2
  PORT=$3

  echo "Testing: $FROM -> $TO:$PORT"
  kubectl exec -n netpol-demo deployment/$FROM -- \
    wget -qO- --timeout=2 http://$TO:$PORT && echo "✓ Success" || echo "✗ Failed"
}

# Run tests
test_connection frontend backend 8080
test_connection frontend database 8080
test_connection backend database 8080
```

### 4. Check Policy Application

```bash
# Which policies apply to backend pods?
kubectl get networkpolicies -n netpol-demo -o json | \
  jq -r '.items[] | select(.spec.podSelector.matchLabels.tier=="backend")'

# Check ingress rules
kubectl get networkpolicies -n netpol-demo -o json | \
  jq -r '.items[] | select(.spec.ingress != null) | .metadata.name'

# Check egress rules
kubectl get networkpolicies -n netpol-demo -o json | \
  jq -r '.items[] | select(.spec.egress != null) | .metadata.name'
```

## 🧪 Hands-On Exercises

### Exercise 1: Three-Tier Application Security

**Task**: Secure a three-tier app:
- Frontend: Accessible from anywhere on port 80
- Backend: Only from frontend on port 8080
- Database: Only from backend on port 5432

**Verification**:
```bash
# Frontend should reach backend
# Backend should reach database
# Frontend should NOT reach database directly
```

### Exercise 2: Microservices Mesh

**Task**: Create policies for microservice architecture:
- Service A can talk to Service B
- Service B can talk to Service C and D
- Service C can only be accessed by B
- All services can access external APIs

### Exercise 3: Namespace Isolation

**Task**: Create two namespaces:
- prod: Isolated, no incoming from other namespaces
- dev: Can access external, but not prod

### Exercise 4: Monitoring Access

**Task**: Allow monitoring pods to scrape metrics from all pods, but pods can't talk to monitoring

## 🧹 Cleanup

```bash
# Delete namespace (removes all policies and pods)
kubectl delete namespace netpol-demo

# Or delete policies individually
kubectl delete networkpolicies --all -n netpol-demo

# Delete pods
kubectl delete deployments --all -n netpol-demo
kubectl delete services --all -n netpol-demo

# Verify cleanup
kubectl get networkpolicies -n netpol-demo
```

## 📚 What You Learned

✅ Created NetworkPolicies for pod isolation
✅ Implemented ingress (incoming) traffic rules
✅ Implemented egress (outgoing) traffic rules
✅ Used label selectors for targeting
✅ Created default deny policies
✅ Allowed specific traffic patterns
✅ Implemented namespace isolation
✅ Debugged network policy issues

## 🎓 Key Concepts

### Default Deny Pattern

**Step 1**: Deny all traffic
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

**Step 2**: Allow specific traffic
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-app-traffic
spec:
  podSelector:
    matchLabels:
      app: web
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
```

### Selector Combinations

**OR Operation** (multiple from clauses):
```yaml
ingress:
- from:
  - podSelector:
      matchLabels:
        app: frontend
  - podSelector:
      matchLabels:
        app: admin
```

**AND Operation** (single from clause):
```yaml
ingress:
- from:
  - namespaceSelector:
      matchLabels:
        env: prod
    podSelector:
      matchLabels:
        app: frontend
```

### CIDR Blocks

```yaml
# Allow from specific IP ranges
ingress:
- from:
  - ipBlock:
      cidr: 10.0.0.0/16
      except:
      - 10.0.1.0/24
```

## 🔜 Next Steps

**Tutorial 14**: Resource Limits - ResourceQuotas and LimitRanges
- Control resource usage
- Prevent resource exhaustion
- Set namespace limits

## 💡 Pro Tips

1. **Allow DNS by default**:
   ```yaml
   egress:
   - to:
     - namespaceSelector:
         matchLabels:
           name: kube-system
     ports:
     - protocol: UDP
       port: 53
   ```

2. **Test before applying**:
   ```bash
   kubectl apply -f policy.yaml --dry-run=server
   ```

3. **Verify CNI support**:
   ```bash
   kubectl get nodes -o wide
   # Check CNI plugin supports NetworkPolicy
   ```

4. **Debug with temporary policy**:
   ```yaml
   # Temporarily allow all to debug
   ingress:
   - {}
   ```

5. **Check pod labels**:
   ```bash
   kubectl get pods --show-labels -n netpol-demo
   ```

## 🆘 Troubleshooting

**Problem**: Policies not working
**Solution**: Check if CNI supports NetworkPolicy:
```bash
# kind uses kindnet (doesn't support NetworkPolicy)
# Install Calico:
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml
```

**Problem**: Can't connect after applying policy
**Solution**:
```bash
# Check policy selectors match pod labels
kubectl get pod -n netpol-demo --show-labels
kubectl get networkpolicy -n netpol-demo -o yaml

# Temporarily remove policy to test
kubectl delete networkpolicy <policy-name> -n netpol-demo
```

**Problem**: DNS not working
**Solution**: Add DNS egress rule:
```yaml
egress:
- to:
  - namespaceSelector:
      matchLabels:
        kubernetes.io/metadata.name: kube-system
  ports:
  - protocol: UDP
    port: 53
```

## 📖 Additional Reading

- [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Declare Network Policy](https://kubernetes.io/docs/tasks/administer-cluster/declare-network-policy/)
- [Calico Network Policies](https://docs.projectcalico.org/security/calico-network-policy)

---

**Estimated Time**: 60-90 minutes
**Difficulty**: Intermediate
**Prerequisites**: Tutorials 01-12 completed

**Next**: Tutorial 14 - Resource Limits
