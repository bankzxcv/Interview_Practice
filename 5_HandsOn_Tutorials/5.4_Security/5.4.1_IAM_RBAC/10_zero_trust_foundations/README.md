# Security Tutorial 10: Zero Trust Foundations

## 🎯 Learning Objectives

- Understand zero trust security principles
- Implement "never trust, always verify"
- Set up identity-based access control
- Implement continuous verification
- Use micro-segmentation
- Build least privilege architecture

## 📋 Prerequisites

- Kubernetes cluster
- Basic understanding of security concepts
- Completed previous IAM/RBAC tutorials

## 📝 What We're Building

```
Zero Trust Architecture
├── Identity Verification
│   ├── Strong Authentication (MFA)
│   ├── ServiceAccount per workload
│   └── Short-lived credentials
├── Least Privilege Access
│   ├── Granular RBAC
│   ├── NetworkPolicies
│   └── Pod Security Standards
├── Micro-Segmentation
│   ├── Namespace isolation
│   ├── Network policies
│   └── Service mesh (mTLS)
└── Continuous Verification
    ├── Audit logging
    ├── Runtime monitoring
    └── Policy enforcement
```

## 🔍 Concepts Introduced

1. **Zero Trust**: Never trust, always verify
2. **Identity-First Security**: Verify who/what before granting access
3. **Least Privilege**: Minimum necessary permissions
4. **Micro-Segmentation**: Isolate workloads
5. **Continuous Verification**: Ongoing trust evaluation
6. **Assume Breach**: Design for compromised environment

## 📁 Step-by-Step Implementation

### Step 1: Implement Strong Identity

Create `zero-trust-namespace.yaml`:

```yaml
# zero-trust-namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: zero-trust-demo
  labels:
    security: zero-trust
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

Create service accounts with minimal permissions:

```yaml
# service-accounts.yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: frontend-sa
  namespace: zero-trust-demo
automountServiceAccountToken: false  # Explicit mounting only

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend-sa
  namespace: zero-trust-demo
automountServiceAccountToken: false

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: database-sa
  namespace: zero-trust-demo
automountServiceAccountToken: false
```

Apply:

```bash
kubectl apply -f zero-trust-namespace.yaml
kubectl apply -f service-accounts.yaml
```

### Step 2: Implement Granular RBAC

Create `zero-trust-rbac.yaml`:

```yaml
# zero-trust-rbac.yaml
---
# Frontend can only read ConfigMaps
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: frontend-role
  namespace: zero-trust-demo
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list"]
    resourceNames: ["frontend-config"]  # Specific resource only

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: frontend-binding
  namespace: zero-trust-demo
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: frontend-role
subjects:
  - kind: ServiceAccount
    name: frontend-sa
    namespace: zero-trust-demo

---
# Backend can read ConfigMaps and Secrets
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: backend-role
  namespace: zero-trust-demo
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list"]
    resourceNames: ["backend-config"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]
    resourceNames: ["backend-secret"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: backend-binding
  namespace: zero-trust-demo
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: backend-role
subjects:
  - kind: ServiceAccount
    name: backend-sa
    namespace: zero-trust-demo
```

Apply:

```bash
kubectl apply -f zero-trust-rbac.yaml
```

### Step 3: Implement Network Segmentation

Create `network-policies.yaml`:

```yaml
# network-policies.yaml
---
# Default deny all traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: zero-trust-demo
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress

---
# Frontend can receive from ingress only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-policy
  namespace: zero-trust-demo
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
  egress:
    # Can call backend only
    - to:
        - podSelector:
            matchLabels:
              app: backend
      ports:
        - protocol: TCP
          port: 8080
    # DNS
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
        - podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53

---
# Backend can receive from frontend only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: zero-trust-demo
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
  egress:
    # Can call database only
    - to:
        - podSelector:
            matchLabels:
              app: database
      ports:
        - protocol: TCP
          port: 5432
    # DNS
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
      ports:
        - protocol: UDP
          port: 53

---
# Database accepts from backend only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-policy
  namespace: zero-trust-demo
spec:
  podSelector:
    matchLabels:
      app: database
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: backend
      ports:
        - protocol: TCP
          port: 5432
```

Apply:

```bash
kubectl apply -f network-policies.yaml
```

### Step 4: Deploy Zero Trust Applications

Create `applications.yaml`:

```yaml
# applications.yaml
---
# Frontend Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: zero-trust-demo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      serviceAccountName: frontend-sa
      automountServiceAccountToken: true
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: frontend
          image: nginx:alpine
          ports:
            - containerPort: 8080
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 256Mi
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: cache
              mountPath: /var/cache/nginx
      volumes:
        - name: tmp
          emptyDir: {}
        - name: cache
          emptyDir: {}

---
# Backend Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: zero-trust-demo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      serviceAccountName: backend-sa
      automountServiceAccountToken: true
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: backend
          image: nginx:alpine
          ports:
            - containerPort: 8080
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 256Mi

---
# Services
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: zero-trust-demo
spec:
  selector:
    app: frontend
  ports:
    - port: 8080
      targetPort: 8080

---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: zero-trust-demo
spec:
  selector:
    app: backend
  ports:
    - port: 8080
      targetPort: 8080
```

Apply:

```bash
kubectl apply -f applications.yaml

# Wait for pods
kubectl wait --for=condition=Ready pods --all -n zero-trust-demo --timeout=120s
```

### Step 5: Implement Policy Enforcement with OPA/Gatekeeper

Create `gatekeeper-constraints.yaml`:

```yaml
# gatekeeper-constraints.yaml
---
# Require specific labels
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: zero-trust-required-labels
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaces: ["zero-trust-demo"]
  parameters:
    labels: ["app", "security"]

---
# Block privileged containers
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPPrivileged
metadata:
  name: zero-trust-no-privileged
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaces: ["zero-trust-demo"]

---
# Require resource limits
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sContainerLimits
metadata:
  name: zero-trust-resource-limits
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaces: ["zero-trust-demo"]
```

### Step 6: Create Zero Trust Checklist

Create `zero-trust-checklist.sh`:

```bash
#!/bin/bash
# zero-trust-checklist.sh - Verify zero trust implementation

NAMESPACE="zero-trust-demo"

echo "🔐 Zero Trust Security Checklist"
echo "================================"

# 1. Check namespace isolation
echo ""
echo "1️⃣  Namespace Isolation"
if kubectl get namespace $NAMESPACE -o jsonpath='{.metadata.labels.pod-security\.kubernetes\.io/enforce}' | grep -q restricted; then
    echo "✅ Pod Security Standards: restricted"
else
    echo "❌ Pod Security Standards: NOT restricted"
fi

# 2. Check ServiceAccounts
echo ""
echo "2️⃣  ServiceAccount Configuration"
SA_COUNT=$(kubectl get sa -n $NAMESPACE --no-headers | grep -v default | wc -l)
if [ "$SA_COUNT" -gt 0 ]; then
    echo "✅ Dedicated ServiceAccounts: $SA_COUNT found"
else
    echo "❌ No dedicated ServiceAccounts"
fi

# 3. Check RBAC
echo ""
echo "3️⃣  RBAC Configuration"
ROLE_COUNT=$(kubectl get roles -n $NAMESPACE --no-headers | wc -l)
BINDING_COUNT=$(kubectl get rolebindings -n $NAMESPACE --no-headers | wc -l)
echo "✅ Roles: $ROLE_COUNT"
echo "✅ RoleBindings: $BINDING_COUNT"

# 4. Check Network Policies
echo ""
echo "4️⃣  Network Segmentation"
NP_COUNT=$(kubectl get networkpolicies -n $NAMESPACE --no-headers | wc -l)
if [ "$NP_COUNT" -gt 0 ]; then
    echo "✅ NetworkPolicies: $NP_COUNT configured"
else
    echo "❌ No NetworkPolicies found"
fi

# 5. Check Pod Security
echo ""
echo "5️⃣  Pod Security Configuration"
PODS=$(kubectl get pods -n $NAMESPACE -o json)

# Check runAsNonRoot
if echo "$PODS" | jq -e '.items[].spec.securityContext.runAsNonRoot' &>/dev/null; then
    echo "✅ Pods run as non-root"
else
    echo "❌ Some pods may run as root"
fi

# Check read-only filesystem
if echo "$PODS" | jq -e '.items[].spec.containers[].securityContext.readOnlyRootFilesystem' &>/dev/null; then
    echo "✅ Read-only root filesystem enabled"
else
    echo "⚠️  Read-only root filesystem not fully enforced"
fi

# 6. Check Resource Limits
echo ""
echo "6️⃣  Resource Limits"
PODS_WITHOUT_LIMITS=$(echo "$PODS" | jq -r '.items[] | select(.spec.containers[].resources.limits == null) | .metadata.name')
if [ -z "$PODS_WITHOUT_LIMITS" ]; then
    echo "✅ All pods have resource limits"
else
    echo "❌ Pods without limits: $PODS_WITHOUT_LIMITS"
fi

# 7. Check automountServiceAccountToken
echo ""
echo "7️⃣  ServiceAccount Token Auto-mount"
AUTO_MOUNT=$(kubectl get sa -n $NAMESPACE -o json | jq -r '.items[] | select(.automountServiceAccountToken==true) | .metadata.name')
if [ -z "$AUTO_MOUNT" ]; then
    echo "✅ Auto-mount disabled (explicit mounting)"
else
    echo "⚠️  ServiceAccounts with auto-mount: $AUTO_MOUNT"
fi

# 8. Summary
echo ""
echo "================================"
echo "📊 Zero Trust Score"
echo "================================"
```

Run checklist:

```bash
chmod +x zero-trust-checklist.sh
./zero-trust-checklist.sh
```

## ✅ Verification

### 1. Test Network Isolation

```bash
# Try to access backend from frontend (should work)
FRONTEND_POD=$(kubectl get pod -n zero-trust-demo -l app=frontend -o name | head -1)
kubectl exec -it $FRONTEND_POD -n zero-trust-demo -- wget -O- --timeout=5 http://backend:8080

# Try to access database from frontend (should fail)
kubectl exec -it $FRONTEND_POD -n zero-trust-demo -- nc -zv database 5432 -w 5 || echo "❌ Blocked (expected)"
```

### 2. Test RBAC

```bash
# Test frontend SA permissions
kubectl auth can-i get configmaps --as=system:serviceaccount:zero-trust-demo:frontend-sa -n zero-trust-demo

# Test backend SA permissions
kubectl auth can-i get secrets --as=system:serviceaccount:zero-trust-demo:backend-sa -n zero-trust-demo

# Test unauthorized access (should fail)
kubectl auth can-i delete pods --as=system:serviceaccount:zero-trust-demo:frontend-sa -n zero-trust-demo
```

### 3. Test Pod Security

```bash
# Try to create non-compliant pod (should fail)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: bad-pod
  namespace: zero-trust-demo
  labels:
    app: test
    security: test
spec:
  containers:
    - name: nginx
      image: nginx
      securityContext:
        privileged: true
EOF

# Expected: Error due to Pod Security Standards
```

### 4. Verify Zero Trust Implementation

```bash
# Run checklist
./zero-trust-checklist.sh

# Check all components
kubectl get all,networkpolicies,roles,rolebindings -n zero-trust-demo
```

## 🧪 Exploration Commands

```bash
# Visualize network policies
kubectl get networkpolicies -n zero-trust-demo -o yaml

# Check effective permissions
kubectl auth can-i --list --as=system:serviceaccount:zero-trust-demo:backend-sa -n zero-trust-demo

# Audit security configuration
kubectl get pods -n zero-trust-demo -o json | \
  jq '.items[] | {name: .metadata.name, securityContext: .spec.securityContext}'
```

## 🧹 Cleanup

```bash
# Delete namespace (removes all resources)
kubectl delete namespace zero-trust-demo

echo "✅ Cleanup completed"
```

## 📚 What You Learned

✅ Implementing zero trust principles
✅ Strong identity verification
✅ Granular RBAC permissions
✅ Network micro-segmentation
✅ Pod security hardening
✅ Continuous verification practices

## 🎓 Key Concepts

**Zero Trust Pillars**:
1. **Verify explicitly**: Always authenticate and authorize
2. **Least privilege**: Minimum necessary access
3. **Assume breach**: Design for compromised environment

**Implementation Layers**:
- **Identity**: ServiceAccounts, RBAC
- **Network**: NetworkPolicies, service mesh
- **Workload**: Pod Security Standards, security contexts
- **Data**: Encryption, secrets management
- **Visibility**: Audit logs, monitoring

**Zero Trust vs Traditional**:
- Traditional: Trust internal, protect perimeter
- Zero Trust: Never trust, always verify

## 🔜 Next Steps

Move to [5.4.2_Secrets_Management](../../5.4.2_Secrets_Management/01_basic_secrets/) where you'll:
- Manage sensitive data securely
- Use Kubernetes secrets
- Implement HashiCorp Vault
- Rotate secrets automatically

## 💡 Pro Tips

1. **Implement gradually**:
   - Start with one namespace
   - Add controls incrementally
   - Monitor and adjust

2. **Use service mesh for mTLS**:
   ```bash
   # Istio automatically encrypts pod-to-pod traffic
   kubectl label namespace zero-trust-demo istio-injection=enabled
   ```

3. **Automate verification**:
   ```bash
   # Run security checks in CI/CD
   ./zero-trust-checklist.sh
   ```

4. **Monitor continuously**:
   ```bash
   # Use Falco for runtime security
   kubectl apply -f falco-daemonset.yaml
   ```

## 🆘 Troubleshooting

**Problem**: Pods can't communicate
**Solution**: Check NetworkPolicies
```bash
kubectl describe networkpolicy -n zero-trust-demo
kubectl get networkpolicies -n zero-trust-demo -o yaml
```

**Problem**: RBAC blocking legitimate access
**Solution**: Review and adjust roles
```bash
kubectl auth can-i --list --as=system:serviceaccount:NAMESPACE:SA
```

**Problem**: Pods failing security policies
**Solution**: Check Pod Security Standards
```bash
kubectl get pod POD -n NAMESPACE -o yaml | grep -A 10 securityContext
```

## 📖 Additional Reading

- [NIST Zero Trust Architecture](https://www.nist.gov/publications/zero-trust-architecture)
- [Google BeyondCorp](https://cloud.google.com/beyondcorp)
- [Zero Trust Kubernetes](https://kubernetes.io/docs/concepts/security/)
- [CNCF Security Whitepaper](https://www.cncf.io/security/)

---

**Estimated Time**: 75-90 minutes
**Difficulty**: Advanced
**Cost**: Free (local cluster)
