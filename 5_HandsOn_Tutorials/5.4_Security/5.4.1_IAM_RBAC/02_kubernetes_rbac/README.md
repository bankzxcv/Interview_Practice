# Security Tutorial 02: Kubernetes RBAC

## 🎯 Learning Objectives

- Understand Kubernetes Role-Based Access Control (RBAC)
- Create and manage ServiceAccounts
- Define Roles and ClusterRoles
- Create RoleBindings and ClusterRoleBindings
- Implement namespace-level access control
- Test and verify RBAC permissions

## 📋 Prerequisites

- Kubernetes cluster (kind, minikube, or cloud)
- kubectl installed and configured
- Basic understanding of Kubernetes resources

## 📝 What We're Building

```
Kubernetes Cluster
├── Namespace: development
│   ├── ServiceAccount: dev-sa
│   ├── Role: pod-reader
│   └── RoleBinding: dev-sa → pod-reader
├── Namespace: production
│   ├── ServiceAccount: prod-deployer
│   ├── Role: deployment-manager
│   └── RoleBinding: prod-deployer → deployment-manager
└── Cluster Level
    ├── ClusterRole: namespace-viewer
    └── ClusterRoleBinding: readonly-user → namespace-viewer
```

## 🔍 Concepts Introduced

1. **ServiceAccount**: Identity for pods and applications
2. **Role**: Namespace-scoped permissions
3. **ClusterRole**: Cluster-wide permissions
4. **RoleBinding**: Binds Role to subjects in namespace
5. **ClusterRoleBinding**: Binds ClusterRole to subjects cluster-wide
6. **RBAC Subjects**: Users, Groups, ServiceAccounts

## 📁 Step-by-Step Implementation

### Step 1: Create Namespaces

Create `namespaces.yaml`:

```yaml
# namespaces.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: development
---
apiVersion: v1
kind: Namespace
metadata:
  name: production
---
apiVersion: v1
kind: Namespace
metadata:
  name: testing
```

Apply the configuration:

```bash
kubectl apply -f namespaces.yaml
kubectl get namespaces
```

### Step 2: Create ServiceAccounts

Create `serviceaccounts.yaml`:

```yaml
# serviceaccounts.yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dev-sa
  namespace: development
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prod-deployer
  namespace: production
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: readonly-sa
  namespace: testing
```

**Explanation**:
- ServiceAccounts provide identity for pods
- Each ServiceAccount is namespace-scoped
- Pods use ServiceAccounts to authenticate to API server

Apply:

```bash
kubectl apply -f serviceaccounts.yaml

# Verify
kubectl get sa -n development
kubectl get sa -n production
kubectl get sa -n testing
```

### Step 3: Create Roles (Namespace-Scoped)

Create `roles.yaml`:

```yaml
# roles.yaml
---
# Role for reading pods
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: development
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["services"]
    verbs: ["get", "list"]

---
# Role for managing deployments
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployment-manager
  namespace: production
rules:
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["services"]
    verbs: ["get", "list", "watch", "create", "update"]

---
# Role for read-only access
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: readonly
  namespace: testing
rules:
  - apiGroups: ["", "apps", "batch"]
    resources: ["*"]
    verbs: ["get", "list", "watch"]
```

**Explanation**:
- `apiGroups`: API group ("" = core API)
- `resources`: Kubernetes resources (pods, deployments, etc.)
- `verbs`: Actions (get, list, create, delete, etc.)
- Roles are namespace-scoped

Apply:

```bash
kubectl apply -f roles.yaml

# Verify
kubectl get roles -n development
kubectl get roles -n production
kubectl describe role pod-reader -n development
```

### Step 4: Create RoleBindings

Create `rolebindings.yaml`:

```yaml
# rolebindings.yaml
---
# Bind dev-sa to pod-reader role
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-sa-pod-reader
  namespace: development
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pod-reader
subjects:
  - kind: ServiceAccount
    name: dev-sa
    namespace: development

---
# Bind prod-deployer to deployment-manager role
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: prod-deployer-binding
  namespace: production
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: deployment-manager
subjects:
  - kind: ServiceAccount
    name: prod-deployer
    namespace: production

---
# Bind readonly-sa to readonly role
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: readonly-binding
  namespace: testing
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: readonly
subjects:
  - kind: ServiceAccount
    name: readonly-sa
    namespace: testing
```

**Explanation**:
- `roleRef`: References the Role to bind
- `subjects`: Who gets the permissions (ServiceAccount, User, Group)
- RoleBinding connects subjects to Roles

Apply:

```bash
kubectl apply -f rolebindings.yaml

# Verify
kubectl get rolebindings -n development
kubectl describe rolebinding dev-sa-pod-reader -n development
```

### Step 5: Create ClusterRoles (Cluster-Wide)

Create `clusterroles.yaml`:

```yaml
# clusterroles.yaml
---
# ClusterRole for viewing namespaces and nodes
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: namespace-viewer
rules:
  - apiGroups: [""]
    resources: ["namespaces", "nodes"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]

---
# ClusterRole for viewing cluster resources
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cluster-viewer
rules:
  - apiGroups: [""]
    resources: ["namespaces", "nodes", "persistentvolumes"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get", "list", "watch"]

---
# ClusterRole for secret reader across namespaces
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secret-reader
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch"]
```

**Explanation**:
- ClusterRoles define permissions cluster-wide
- Can be used for cluster-scoped resources (nodes, namespaces)
- Can be bound at namespace level via RoleBinding
- Can be bound cluster-wide via ClusterRoleBinding

Apply:

```bash
kubectl apply -f clusterroles.yaml

# Verify
kubectl get clusterroles | grep -E 'namespace-viewer|cluster-viewer|secret-reader'
kubectl describe clusterrole namespace-viewer
```

### Step 6: Create ClusterRoleBindings

Create `clusterrolebindings.yaml`:

```yaml
# clusterrolebindings.yaml
---
# Bind readonly-sa to namespace-viewer (cluster-wide)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: readonly-cluster-viewer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: namespace-viewer
subjects:
  - kind: ServiceAccount
    name: readonly-sa
    namespace: testing
```

**Explanation**:
- ClusterRoleBinding grants permissions cluster-wide
- Subject can be from any namespace
- Use carefully - grants broad access

Apply:

```bash
kubectl apply -f clusterrolebindings.yaml

# Verify
kubectl get clusterrolebindings | grep readonly-cluster-viewer
kubectl describe clusterrolebinding readonly-cluster-viewer
```

### Step 7: Create Test Pods Using ServiceAccounts

Create `test-pods.yaml`:

```yaml
# test-pods.yaml
---
apiVersion: v1
kind: Pod
metadata:
  name: dev-pod
  namespace: development
spec:
  serviceAccountName: dev-sa
  containers:
    - name: kubectl
      image: bitnami/kubectl:latest
      command: ["sleep", "3600"]

---
apiVersion: v1
kind: Pod
metadata:
  name: prod-pod
  namespace: production
spec:
  serviceAccountName: prod-deployer
  containers:
    - name: kubectl
      image: bitnami/kubectl:latest
      command: ["sleep", "3600"]
```

Apply:

```bash
kubectl apply -f test-pods.yaml

# Wait for pods to be ready
kubectl wait --for=condition=Ready pod/dev-pod -n development --timeout=60s
kubectl wait --for=condition=Ready pod/prod-pod -n production --timeout=60s
```

## ✅ Verification

### 1. Test dev-sa Permissions (Should Work)

```bash
# dev-sa can read pods in development namespace
kubectl exec -it dev-pod -n development -- kubectl get pods -n development

# dev-sa can read services
kubectl exec -it dev-pod -n development -- kubectl get services -n development

# dev-sa can view pod logs
kubectl exec -it dev-pod -n development -- kubectl logs dev-pod -n development
```

### 2. Test dev-sa Restrictions (Should Fail)

```bash
# dev-sa CANNOT create deployments
kubectl exec -it dev-pod -n development -- kubectl create deployment nginx --image=nginx -n development

# dev-sa CANNOT access other namespaces
kubectl exec -it dev-pod -n development -- kubectl get pods -n production

# dev-sa CANNOT delete pods
kubectl exec -it dev-pod -n development -- kubectl delete pod dev-pod -n development
```

**Expected Output**: Error messages like:
```
Error from server (Forbidden): deployments.apps is forbidden: User "system:serviceaccount:development:dev-sa" cannot create resource "deployments"
```

### 3. Test prod-deployer Permissions

```bash
# Create a test deployment in production
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:latest
          ports:
            - containerPort: 80
EOF

# prod-deployer CAN manage deployments
kubectl exec -it prod-pod -n production -- kubectl get deployments -n production

# prod-deployer CAN scale deployments
kubectl exec -it prod-pod -n production -- kubectl scale deployment nginx --replicas=3 -n production
```

### 4. Check Effective Permissions

```bash
# Check what dev-sa can do
kubectl auth can-i --list --as=system:serviceaccount:development:dev-sa -n development

# Check specific permission
kubectl auth can-i get pods --as=system:serviceaccount:development:dev-sa -n development
kubectl auth can-i delete pods --as=system:serviceaccount:development:dev-sa -n development

# Check prod-deployer permissions
kubectl auth can-i create deployments --as=system:serviceaccount:production:prod-deployer -n production
kubectl auth can-i delete namespaces --as=system:serviceaccount:production:prod-deployer
```

### 5. View RBAC Configuration

```bash
# Get all roles
kubectl get roles --all-namespaces

# Get all rolebindings
kubectl get rolebindings --all-namespaces

# Get cluster roles
kubectl get clusterroles

# Get cluster role bindings
kubectl get clusterrolebindings

# Describe specific binding
kubectl describe rolebinding dev-sa-pod-reader -n development
```

## 🧪 Exploration Commands

### RBAC Discovery

```bash
# Find all ServiceAccounts in cluster
kubectl get sa --all-namespaces

# Find roles that can delete pods
kubectl get roles --all-namespaces -o json | \
  jq -r '.items[] | select(.rules[].verbs[] | contains("delete")) | "\(.metadata.namespace)/\(.metadata.name)"'

# List all subjects with cluster-admin role
kubectl get clusterrolebindings -o json | \
  jq -r '.items[] | select(.roleRef.name=="cluster-admin") | .subjects[].name'

# Find what a ServiceAccount can do
kubectl auth can-i --list --as=system:serviceaccount:development:dev-sa

# Check access for specific resource
kubectl auth can-i create secrets --as=system:serviceaccount:development:dev-sa -n development
```

### Advanced RBAC Queries

```bash
# Get all resources a user can access
kubectl auth can-i --list --as=myuser

# Aggregate multiple ClusterRoles
kubectl get clusterrole view -o yaml
kubectl get clusterrole edit -o yaml
kubectl get clusterrole admin -o yaml

# Export ServiceAccount token
kubectl create token dev-sa -n development

# Use ServiceAccount token for authentication
TOKEN=$(kubectl create token dev-sa -n development)
kubectl --token=$TOKEN get pods -n development
```

## 🧹 Cleanup

```bash
# Delete test pods
kubectl delete -f test-pods.yaml

# Delete RBAC resources
kubectl delete -f rolebindings.yaml
kubectl delete -f clusterrolebindings.yaml
kubectl delete -f roles.yaml
kubectl delete -f clusterroles.yaml
kubectl delete -f serviceaccounts.yaml

# Delete namespaces (this deletes everything in them)
kubectl delete -f namespaces.yaml

# Or delete individually
kubectl delete namespace development production testing
```

## 📚 What You Learned

✅ Creating and managing Kubernetes ServiceAccounts
✅ Defining namespace-scoped Roles
✅ Creating cluster-wide ClusterRoles
✅ Binding permissions with RoleBindings and ClusterRoleBindings
✅ Testing and verifying RBAC permissions
✅ Using kubectl auth can-i for permission checks
✅ Implementing least privilege in Kubernetes

## 🎓 Key Concepts

**RBAC Components**:
- **ServiceAccount**: Identity for pods/apps
- **Role**: Permissions within a namespace
- **ClusterRole**: Permissions cluster-wide or for cluster resources
- **RoleBinding**: Grants Role to subjects in namespace
- **ClusterRoleBinding**: Grants ClusterRole to subjects cluster-wide

**RBAC Best Practices**:
1. Use ServiceAccounts for pod identities
2. Apply principle of least privilege
3. Use Roles for namespace isolation
4. Use ClusterRoles sparingly
5. Regularly audit permissions
6. Document RBAC decisions
7. Use groups for user management

**Common Verbs**:
- `get`: Retrieve individual resource
- `list`: List resources
- `watch`: Watch for changes
- `create`: Create new resources
- `update`: Update existing resources
- `patch`: Partially update resources
- `delete`: Delete resources
- `deletecollection`: Delete multiple resources

## 🔜 Next Steps

Move to [03_aws_iam](../03_aws_iam/) where you'll:
- Learn AWS IAM users, roles, and policies
- Create IAM policies for S3, EC2, and other services
- Implement cross-account access
- Use IAM roles for EKS pods

## 💡 Pro Tips

1. **Use built-in ClusterRoles**:
   ```bash
   # Kubernetes provides default roles
   kubectl get clusterroles | grep -E 'view|edit|admin'

   # Bind default role instead of creating custom
   kubectl create rolebinding dev-view --clusterrole=view --serviceaccount=dev:dev-sa -n dev
   ```

2. **Aggregate ClusterRoles**:
   ```yaml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: ClusterRole
   metadata:
     name: monitoring
     labels:
       rbac.example.com/aggregate-to-monitoring: "true"
   rules:
     - apiGroups: [""]
       resources: ["pods", "services"]
       verbs: ["get", "list"]
   ```

3. **Use kubectl auth reconcile**:
   ```bash
   # Apply RBAC and reconcile
   kubectl auth reconcile -f rbac.yaml
   ```

4. **Create kubeconfig for ServiceAccount**:
   ```bash
   # Generate kubeconfig for a ServiceAccount
   ./generate-kubeconfig.sh dev-sa development
   ```

## 🆘 Troubleshooting

**Problem**: `Error from server (Forbidden): pods is forbidden`
**Solution**: Check RBAC permissions
```bash
kubectl auth can-i get pods --as=system:serviceaccount:namespace:sa-name -n namespace
kubectl describe role role-name -n namespace
```

**Problem**: RoleBinding not working
**Solution**: Verify ServiceAccount, Role, and namespace match
```bash
kubectl get rolebinding binding-name -n namespace -o yaml
```

**Problem**: ServiceAccount token not found
**Solution**: Kubernetes 1.24+ requires manual token creation
```bash
kubectl create token sa-name -n namespace --duration=8760h
```

**Problem**: Cannot see resources in other namespaces
**Solution**: Need ClusterRole + ClusterRoleBinding, not just Role
```bash
kubectl create clusterrolebinding name --clusterrole=view --serviceaccount=ns:sa
```

## 📖 Additional Reading

- [Kubernetes RBAC Documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [RBAC Best Practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/)
- [kubectl auth can-i](https://kubernetes.io/docs/reference/access-authn-authz/authorization/)
- [ServiceAccount Tokens](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)

---

**Estimated Time**: 45-60 minutes
**Difficulty**: Intermediate
**Cost**: Free (local cluster) or minimal (cloud cluster)
