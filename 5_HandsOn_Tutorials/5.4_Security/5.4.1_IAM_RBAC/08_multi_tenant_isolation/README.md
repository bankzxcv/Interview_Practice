# Security Tutorial 08: Multi-Tenant Isolation in Kubernetes

## 🎯 Learning Objectives

- Implement namespace-based multi-tenancy
- Configure resource quotas and limit ranges
- Set up network policies for tenant isolation
- Implement RBAC for tenant separation
- Use Pod Security Standards
- Monitor and audit tenant resources

## 📋 Prerequisites

- Kubernetes cluster (kind with Calico or cloud cluster)
- kubectl installed
- Basic understanding of Kubernetes resources

## 📝 What We're Building

```
Multi-Tenant Cluster
├── Tenant A (namespace: tenant-a)
│   ├── ResourceQuota
│   ├── LimitRange
│   ├── NetworkPolicy
│   ├── RBAC (tenant-a-admin, tenant-a-developer)
│   └── PodSecurityStandard (restricted)
├── Tenant B (namespace: tenant-b)
│   ├── ResourceQuota
│   ├── LimitRange
│   ├── NetworkPolicy
│   ├── RBAC (tenant-b-admin, tenant-b-developer)
│   └── PodSecurityStandard (restricted)
└── Shared Services (namespace: shared)
    └── Allowed access from all tenants
```

## 🔍 Concepts Introduced

1. **Namespace Isolation**: Logical separation of resources
2. **ResourceQuota**: Limit total resource consumption
3. **LimitRange**: Default and limit values for resources
4. **NetworkPolicy**: Control pod-to-pod communication
5. **RBAC**: Namespace-scoped permissions
6. **Pod Security Standards**: Enforce security policies

## 📁 Step-by-Step Implementation

### Step 1: Create Tenant Namespaces

```bash
# Create namespaces for tenants
kubectl create namespace tenant-a
kubectl create namespace tenant-b
kubectl create namespace shared

# Label namespaces
kubectl label namespace tenant-a tenant=tenant-a environment=production
kubectl label namespace tenant-b tenant=tenant-b environment=production
kubectl label namespace shared tenant=shared environment=shared

# Verify
kubectl get namespaces --show-labels
```

### Step 2: Configure Resource Quotas

Create `tenant-a-quota.yaml`:

```yaml
# tenant-a-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-a-quota
  namespace: tenant-a
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    requests.storage: 100Gi
    persistentvolumeclaims: "10"
    pods: "50"
    services: "20"
    configmaps: "50"
    secrets: "50"
    services.loadbalancers: "2"
    services.nodeports: "5"
```

Create `tenant-b-quota.yaml`:

```yaml
# tenant-b-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-b-quota
  namespace: tenant-b
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    requests.storage: 50Gi
    persistentvolumeclaims: "5"
    pods: "25"
    services: "10"
    configmaps: "25"
    secrets: "25"
    services.loadbalancers: "1"
    services.nodeports: "2"
```

Apply quotas:

```bash
kubectl apply -f tenant-a-quota.yaml
kubectl apply -f tenant-b-quota.yaml

# Verify quotas
kubectl get resourcequota -n tenant-a
kubectl describe resourcequota tenant-a-quota -n tenant-a

kubectl get resourcequota -n tenant-b
kubectl describe resourcequota tenant-b-quota -n tenant-b
```

### Step 3: Configure Limit Ranges

Create `tenant-a-limits.yaml`:

```yaml
# tenant-a-limits.yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: tenant-a-limits
  namespace: tenant-a
spec:
  limits:
    # Pod limits
    - type: Pod
      max:
        cpu: "2"
        memory: 4Gi
      min:
        cpu: "10m"
        memory: 10Mi

    # Container limits
    - type: Container
      max:
        cpu: "1"
        memory: 2Gi
      min:
        cpu: "10m"
        memory: 10Mi
      default:
        cpu: "200m"
        memory: 256Mi
      defaultRequest:
        cpu: "100m"
        memory: 128Mi
      maxLimitRequestRatio:
        cpu: "4"
        memory: "4"

    # PVC limits
    - type: PersistentVolumeClaim
      max:
        storage: 10Gi
      min:
        storage: 1Gi
```

Create similar for tenant-b:

```yaml
# tenant-b-limits.yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: tenant-b-limits
  namespace: tenant-b
spec:
  limits:
    - type: Pod
      max:
        cpu: "1"
        memory: 2Gi
      min:
        cpu: "10m"
        memory: 10Mi

    - type: Container
      max:
        cpu: "500m"
        memory: 1Gi
      min:
        cpu: "10m"
        memory: 10Mi
      default:
        cpu: "100m"
        memory: 128Mi
      defaultRequest:
        cpu: "50m"
        memory: 64Mi
      maxLimitRequestRatio:
        cpu: "4"
        memory: "4"

    - type: PersistentVolumeClaim
      max:
        storage: 5Gi
      min:
        storage: 1Gi
```

Apply:

```bash
kubectl apply -f tenant-a-limits.yaml
kubectl apply -f tenant-b-limits.yaml

# Verify
kubectl describe limitrange -n tenant-a
kubectl describe limitrange -n tenant-b
```

### Step 4: Implement Network Policies

Create `tenant-a-network-policy.yaml`:

```yaml
# tenant-a-network-policy.yaml
---
# Default deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
    - Ingress

---
# Default deny all egress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
    - Egress

---
# Allow intra-namespace communication
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector: {}
  egress:
    - to:
        - podSelector: {}

---
# Allow DNS
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
      ports:
        - protocol: UDP
          port: 53

---
# Allow access to shared services
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-shared-services
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              tenant: shared
      ports:
        - protocol: TCP
          port: 80
        - protocol: TCP
          port: 443
```

Create similar for tenant-b and apply:

```bash
kubectl apply -f tenant-a-network-policy.yaml
# Create and apply tenant-b-network-policy.yaml

# Verify
kubectl get networkpolicies -n tenant-a
kubectl describe networkpolicy default-deny-ingress -n tenant-a
```

### Step 5: Configure RBAC for Tenants

Create `tenant-a-rbac.yaml`:

```yaml
# tenant-a-rbac.yaml
---
# ServiceAccount for tenant-a admin
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tenant-a-admin
  namespace: tenant-a

---
# Role for tenant admin (full access in namespace)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tenant-admin
  namespace: tenant-a
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]

---
# RoleBinding for tenant admin
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-a-admin-binding
  namespace: tenant-a
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: tenant-admin
subjects:
  - kind: ServiceAccount
    name: tenant-a-admin
    namespace: tenant-a
  - kind: User
    name: tenant-a-admin@example.com
    apiGroup: rbac.authorization.k8s.io

---
# ServiceAccount for tenant-a developer
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tenant-a-developer
  namespace: tenant-a

---
# Role for developer (limited access)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tenant-developer
  namespace: tenant-a
rules:
  - apiGroups: ["", "apps", "batch"]
    resources: ["pods", "pods/log", "deployments", "services", "configmaps", "jobs", "cronjobs"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list"]

---
# RoleBinding for developer
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-a-developer-binding
  namespace: tenant-a
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: tenant-developer
subjects:
  - kind: ServiceAccount
    name: tenant-a-developer
    namespace: tenant-a
  - kind: Group
    name: tenant-a-developers
    apiGroup: rbac.authorization.k8s.io
```

Apply RBAC:

```bash
kubectl apply -f tenant-a-rbac.yaml
# Create and apply similar for tenant-b

# Verify
kubectl get serviceaccounts -n tenant-a
kubectl get roles -n tenant-a
kubectl get rolebindings -n tenant-a
```

### Step 6: Apply Pod Security Standards

```bash
# Apply Pod Security Standards labels to namespaces
kubectl label namespace tenant-a \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted

kubectl label namespace tenant-b \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted

kubectl label namespace shared \
  pod-security.kubernetes.io/enforce=baseline \
  pod-security.kubernetes.io/audit=baseline \
  pod-security.kubernetes.io/warn=baseline

# Verify
kubectl get namespace tenant-a -o yaml | grep pod-security
```

### Step 7: Deploy Test Applications

Create `tenant-a-app.yaml`:

```yaml
# tenant-a-app.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tenant-a-app
  namespace: tenant-a
  labels:
    app: tenant-a-app
    tenant: tenant-a
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tenant-a-app
  template:
    metadata:
      labels:
        app: tenant-a-app
    spec:
      serviceAccountName: tenant-a-developer
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: app
          image: nginx:alpine
          ports:
            - containerPort: 80
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop:
                - ALL
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: tenant-a-app
  namespace: tenant-a
spec:
  selector:
    app: tenant-a-app
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
```

Deploy:

```bash
kubectl apply -f tenant-a-app.yaml

# Verify
kubectl get all -n tenant-a
kubectl get resourcequota -n tenant-a
kubectl describe resourcequota tenant-a-quota -n tenant-a
```

## ✅ Verification

### 1. Test Resource Quotas

```bash
# Check current usage
kubectl describe resourcequota -n tenant-a

# Try to exceed quota (should fail)
kubectl run test-pod-{1..60} --image=nginx -n tenant-a --dry-run=client -o yaml | kubectl apply -f -

# Check quota status
kubectl get resourcequota -n tenant-a
```

### 2. Test Network Isolation

```bash
# Deploy test pod in tenant-a
kubectl run test-pod -n tenant-a --image=nicolaka/netshoot -- sleep 3600

# Test same-namespace connectivity (should work)
kubectl exec -it test-pod -n tenant-a -- curl tenant-a-app

# Test cross-namespace connectivity (should fail)
kubectl run test-pod-b -n tenant-b --image=nginx --dry-run=client -o yaml | kubectl apply -f -
kubectl exec -it test-pod -n tenant-a -- curl test-pod-b.tenant-b

# Test DNS (should work)
kubectl exec -it test-pod -n tenant-a -- nslookup kubernetes.default
```

### 3. Test RBAC Isolation

```bash
# Test tenant-a-developer permissions
kubectl auth can-i create pods -n tenant-a --as=system:serviceaccount:tenant-a:tenant-a-developer
kubectl auth can-i delete pods -n tenant-a --as=system:serviceaccount:tenant-a:tenant-a-developer
kubectl auth can-i create pods -n tenant-b --as=system:serviceaccount:tenant-a:tenant-a-developer

# List what tenant-a-developer can do
kubectl auth can-i --list -n tenant-a --as=system:serviceaccount:tenant-a:tenant-a-developer
```

### 4. Test Pod Security Standards

```bash
# Try to create non-compliant pod (should fail)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: bad-pod
  namespace: tenant-a
spec:
  containers:
    - name: app
      image: nginx
      securityContext:
        privileged: true
EOF

# Create compliant pod (should succeed)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: good-pod
  namespace: tenant-a
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: nginx:alpine
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop: ["ALL"]
      resources:
        limits:
          cpu: 100m
          memory: 128Mi
EOF
```

## 🧪 Exploration Commands

```bash
# Monitor resource usage per tenant
kubectl top pods -n tenant-a
kubectl top pods -n tenant-b

# Get resource consumption
kubectl describe resourcequota -n tenant-a
kubectl describe resourcequota -n tenant-b

# List all resources per tenant
kubectl get all -n tenant-a
kubectl api-resources --verbs=list --namespaced -o name | xargs -n 1 kubectl get --show-kind --ignore-not-found -n tenant-a

# Check network policies
kubectl get networkpolicies --all-namespaces

# Audit RBAC
kubectl get rolebindings --all-namespaces -o wide
```

## 🧹 Cleanup

```bash
# Delete tenant namespaces (removes all resources)
kubectl delete namespace tenant-a
kubectl delete namespace tenant-b
kubectl delete namespace shared

echo "✅ Cleanup completed"
```

## 📚 What You Learned

✅ Implementing namespace-based multi-tenancy
✅ Configuring resource quotas and limits
✅ Setting up network isolation
✅ Implementing RBAC for tenant separation
✅ Applying Pod Security Standards
✅ Monitoring tenant resource usage

## 🎓 Key Concepts

**Multi-Tenancy Models**:
1. **Soft Multi-Tenancy**: Namespace isolation (this tutorial)
2. **Hard Multi-Tenancy**: Separate clusters per tenant
3. **Virtual Clusters**: vcluster, Loft, etc.

**Isolation Layers**:
- **Compute**: ResourceQuota, LimitRange
- **Network**: NetworkPolicy
- **Access**: RBAC, ServiceAccounts
- **Security**: Pod Security Standards
- **Storage**: StorageClass, PVC quotas

## 🔜 Next Steps

Move to [09_audit_logging](../09_audit_logging/) where you'll:
- Enable Kubernetes audit logging
- Configure audit policies
- Integrate with log aggregation
- Analyze audit logs for security

## 💡 Pro Tips

1. **Use Hierarchical Namespaces** (HNC):
   ```bash
   kubectl create namespace parent-tenant
   kubectl create namespace parent-tenant-dev --dry-run=client -o yaml | \
     kubectl annotate -f - hnc.x-k8s.io/subnamespace-of=parent-tenant
   ```

2. **Monitor quota usage**:
   ```bash
   kubectl get resourcequota --all-namespaces -o json | \
     jq -r '.items[] | "\(.metadata.namespace): \(.status.used.pods)/\(.spec.hard.pods)"'
   ```

3. **Test network policies**:
   ```bash
   # Use netshoot for debugging
   kubectl run netshoot --rm -it --image=nicolaka/netshoot -n tenant-a -- bash
   ```

## 🆘 Troubleshooting

**Problem**: Pods not starting due to quota
**Solution**: Check quota usage
```bash
kubectl describe resourcequota -n NAMESPACE
kubectl get pods -n NAMESPACE -o json | jq '.items[].spec.containers[].resources'
```

**Problem**: Network policy blocking DNS
**Solution**: Ensure DNS egress is allowed
```bash
kubectl get networkpolicy -n NAMESPACE
```

**Problem**: RBAC denying access
**Solution**: Check permissions
```bash
kubectl auth can-i ACTION RESOURCE -n NAMESPACE --as=USER
```

## 📖 Additional Reading

- [Kubernetes Multi-Tenancy](https://kubernetes.io/docs/concepts/security/multi-tenancy/)
- [Resource Quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/)
- [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)

---

**Estimated Time**: 60-75 minutes
**Difficulty**: Intermediate to Advanced
**Cost**: Free (local cluster) or minimal (cloud)
