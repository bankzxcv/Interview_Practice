# Kubernetes Tutorial 12: RBAC (Role-Based Access Control)

## 🎯 Learning Objectives

- Understand Kubernetes RBAC fundamentals
- Create and manage ServiceAccounts
- Implement Roles and RoleBindings (namespace-scoped)
- Implement ClusterRoles and ClusterRoleBindings (cluster-wide)
- Apply principle of least privilege
- Debug RBAC permission issues
- Implement pod-level security with ServiceAccounts
- Use RBAC for automation and CI/CD

## 📋 Prerequisites

- Completed tutorials 01-11
- kind cluster "learning" is running
- kubectl configured
- Understanding of Kubernetes resources

## 📝 What We're Building

```
RBAC Security Model:
├── ServiceAccount: app-reader
│   └── RoleBinding → Role: pod-reader
│       └── Permissions: get, list pods
├── ServiceAccount: app-deployer
│   └── RoleBinding → Role: deployment-manager
│       └── Permissions: create, update, delete deployments
├── ServiceAccount: cluster-viewer
│   └── ClusterRoleBinding → ClusterRole: view
│       └── Permissions: read-only cluster-wide
└── ServiceAccount: namespace-admin
    └── RoleBinding → ClusterRole: admin
        └── Permissions: full control in namespace
```

## 🔍 Concepts Deep Dive

### 1. **RBAC Components**

**ServiceAccount**:
- Identity for pods
- Represented by tokens
- Scoped to namespace
- Auto-mounted to pods

**Role** (namespace-scoped):
- Set of permissions
- What actions allowed on which resources
- Only in one namespace

**RoleBinding** (namespace-scoped):
- Links Role to subjects (users, groups, ServiceAccounts)
- Grants permissions in namespace

**ClusterRole** (cluster-scoped):
- Like Role but cluster-wide
- Can access all namespaces
- Can access cluster-scoped resources (nodes, PVs)

**ClusterRoleBinding** (cluster-scoped):
- Links ClusterRole to subjects
- Grants cluster-wide permissions

### 2. **How RBAC Works**

```
Request Flow:
User/ServiceAccount → API Server → RBAC Authorization
                                    ├── Check Roles
                                    ├── Check RoleBindings
                                    ├── Check ClusterRoles
                                    └── Check ClusterRoleBindings
                                    → Allow or Deny
```

**Authorization Check**:
1. Who is making the request? (Authentication)
2. What are they trying to do? (Verb: get, list, create, etc.)
3. On what resource? (pods, services, etc.)
4. In which namespace? (namespace-scoped) or cluster-wide?
5. Do any Roles/RoleBindings grant this permission?

### 3. **RBAC Rules**

**Verbs** (actions):
```
- get: Read single resource
- list: Read multiple resources
- watch: Watch for changes
- create: Create new resource
- update: Modify existing resource
- patch: Partially modify resource
- delete: Delete resource
- deletecollection: Delete multiple resources
```

**API Groups**:
```
- "": Core API group (pods, services, configmaps)
- "apps": apps/v1 (deployments, statefulsets)
- "batch": batch/v1 (jobs, cronjobs)
- "rbac.authorization.k8s.io": RBAC resources
```

**Resources**:
```
- pods, services, configmaps, secrets
- deployments, statefulsets, daemonsets
- jobs, cronjobs
- roles, rolebindings, clusterroles, clusterrolebindings
```

### 4. **ServiceAccount Usage**

**Default ServiceAccount**:
- Every namespace has "default" ServiceAccount
- Automatically mounted to pods
- Minimal permissions

**Custom ServiceAccount**:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app
---
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  serviceAccountName: my-app  # Use custom SA
  containers:
  - name: app
    image: myapp
```

**Token Location in Pod**:
```
/var/run/secrets/kubernetes.io/serviceaccount/
├── ca.crt        # CA certificate
├── namespace     # Namespace name
└── token         # JWT token for authentication
```

### 5. **Best Practices**

**Principle of Least Privilege**:
- Grant minimum permissions needed
- Start with no permissions, add as needed
- Use namespace-scoped Roles when possible
- Avoid wildcard permissions (*)

**ServiceAccount Strategy**:
- One ServiceAccount per application
- Don't reuse default ServiceAccount
- Disable auto-mounting if not needed
- Rotate tokens regularly

**RBAC Patterns**:
```
Read-only: get, list, watch
Read-write: get, list, watch, create, update, patch
Full control: * (all verbs)
```

## 📁 Step-by-Step Implementation

### Step 1: Create ServiceAccount

```bash
# Create namespace for RBAC demo
kubectl create namespace rbac-demo

# Create ServiceAccount
kubectl apply -f manifests/01-serviceaccount.yaml

# List ServiceAccounts
kubectl get serviceaccounts -n rbac-demo

# Describe ServiceAccount
kubectl describe sa app-reader -n rbac-demo

# Get ServiceAccount token secret
kubectl get secrets -n rbac-demo | grep app-reader
```

### Step 2: Create Role for Reading Pods

```bash
# Create Role that can read pods
kubectl apply -f manifests/02-pod-reader-role.yaml

# View Role
kubectl get role pod-reader -n rbac-demo

# Describe Role to see permissions
kubectl describe role pod-reader -n rbac-demo

# Get Role in YAML
kubectl get role pod-reader -n rbac-demo -o yaml
```

### Step 3: Create RoleBinding

```bash
# Bind Role to ServiceAccount
kubectl apply -f manifests/03-pod-reader-binding.yaml

# View RoleBinding
kubectl get rolebinding pod-reader-binding -n rbac-demo

# Describe RoleBinding
kubectl describe rolebinding pod-reader-binding -n rbac-demo
```

### Step 4: Test Permissions

```bash
# Create test pod using ServiceAccount
kubectl apply -f manifests/04-test-pod.yaml

# Wait for pod to be ready
kubectl wait --for=condition=ready pod/rbac-test -n rbac-demo --timeout=60s

# Test: List pods (should work - granted permission)
kubectl exec -n rbac-demo rbac-test -- \
  kubectl get pods -n rbac-demo

# Test: Get specific pod (should work)
kubectl exec -n rbac-demo rbac-test -- \
  kubectl get pod rbac-test -n rbac-demo

# Test: Create pod (should fail - no permission)
kubectl exec -n rbac-demo rbac-test -- \
  kubectl run test-nginx --image=nginx -n rbac-demo

# Test: List services (should fail - no permission)
kubectl exec -n rbac-demo rbac-test -- \
  kubectl get services -n rbac-demo
```

### Step 5: Create Role for Managing Deployments

```bash
# Create Role with deployment management permissions
kubectl apply -f manifests/05-deployment-manager-role.yaml

# Create ServiceAccount
kubectl create sa deployment-manager -n rbac-demo

# Create RoleBinding
kubectl apply -f manifests/06-deployment-manager-binding.yaml

# Test deployment management
kubectl apply -f manifests/07-deployment-test-pod.yaml

# Wait for pod
kubectl wait --for=condition=ready pod/deployment-manager-test -n rbac-demo --timeout=60s

# Test: Create deployment (should work)
kubectl exec -n rbac-demo deployment-manager-test -- \
  kubectl create deployment test-nginx --image=nginx -n rbac-demo

# Test: List deployments (should work)
kubectl exec -n rbac-demo deployment-manager-test -- \
  kubectl get deployments -n rbac-demo

# Test: Delete deployment (should work)
kubectl exec -n rbac-demo deployment-manager-test -- \
  kubectl delete deployment test-nginx -n rbac-demo
```

### Step 6: Create ClusterRole for Cluster-Wide Read

```bash
# Create ClusterRole for viewing all namespaces
kubectl apply -f manifests/08-cluster-viewer-role.yaml

# View ClusterRole
kubectl get clusterrole cluster-viewer

# Describe ClusterRole
kubectl describe clusterrole cluster-viewer
```

### Step 7: Create ClusterRoleBinding

```bash
# Create ServiceAccount
kubectl create sa cluster-viewer -n rbac-demo

# Create ClusterRoleBinding
kubectl apply -f manifests/09-cluster-viewer-binding.yaml

# Test cluster-wide viewing
kubectl apply -f manifests/10-cluster-viewer-test-pod.yaml

# Wait for pod
kubectl wait --for=condition=ready pod/cluster-viewer-test -n rbac-demo --timeout=60s

# Test: List pods in all namespaces (should work)
kubectl exec -n rbac-demo cluster-viewer-test -- \
  kubectl get pods --all-namespaces

# Test: List nodes (should work)
kubectl exec -n rbac-demo cluster-viewer-test -- \
  kubectl get nodes

# Test: Delete pod (should fail - read-only)
kubectl exec -n rbac-demo cluster-viewer-test -- \
  kubectl delete pod rbac-test -n rbac-demo
```

### Step 8: Use Built-in ClusterRoles

```bash
# List built-in ClusterRoles
kubectl get clusterroles | grep -E "^(view|edit|admin|cluster-admin)"

# Describe built-in roles
kubectl describe clusterrole view
kubectl describe clusterrole edit
kubectl describe clusterrole admin
kubectl describe clusterrole cluster-admin

# Grant namespace admin using built-in ClusterRole
kubectl apply -f manifests/11-namespace-admin.yaml

# Test namespace admin
kubectl apply -f manifests/12-namespace-admin-test-pod.yaml

# This ServiceAccount can do anything in rbac-demo namespace
kubectl exec -n rbac-demo namespace-admin-test -- \
  kubectl get all -n rbac-demo
```

### Step 9: Create Role for Secret Access

```bash
# Create secret
kubectl create secret generic app-secret \
  --from-literal=api-key=secret123 \
  -n rbac-demo

# Create Role for reading secrets
kubectl apply -f manifests/13-secret-reader-role.yaml

# Create ServiceAccount and RoleBinding
kubectl create sa secret-reader -n rbac-demo
kubectl apply -f manifests/14-secret-reader-binding.yaml

# Test secret access
kubectl apply -f manifests/15-secret-reader-test-pod.yaml

# Should be able to read secrets
kubectl exec -n rbac-demo secret-reader-test -- \
  kubectl get secrets -n rbac-demo

# Should be able to view secret content
kubectl exec -n rbac-demo secret-reader-test -- \
  kubectl get secret app-secret -n rbac-demo -o yaml
```

### Step 10: Debug RBAC Issues

```bash
# Check if user/SA can perform action
kubectl auth can-i get pods -n rbac-demo \
  --as=system:serviceaccount:rbac-demo:app-reader

# Check specific resource
kubectl auth can-i delete deployments -n rbac-demo \
  --as=system:serviceaccount:rbac-demo:app-reader

# Check all permissions
kubectl auth can-i --list -n rbac-demo \
  --as=system:serviceaccount:rbac-demo:app-reader

# View what a ServiceAccount can do
kubectl auth can-i --list -n rbac-demo \
  --as=system:serviceaccount:rbac-demo:deployment-manager
```

## ✅ Verification

### 1. List RBAC Resources

```bash
# ServiceAccounts
kubectl get serviceaccounts -n rbac-demo

# Roles
kubectl get roles -n rbac-demo

# RoleBindings
kubectl get rolebindings -n rbac-demo

# ClusterRoles (built-in + custom)
kubectl get clusterroles

# ClusterRoleBindings
kubectl get clusterrolebindings
```

### 2. Check ServiceAccount Permissions

```bash
# What can this ServiceAccount do?
SA_NAME="app-reader"
NAMESPACE="rbac-demo"

# Check specific permission
kubectl auth can-i get pods -n $NAMESPACE \
  --as=system:serviceaccount:$NAMESPACE:$SA_NAME

# List all permissions
kubectl auth can-i --list -n $NAMESPACE \
  --as=system:serviceaccount:$NAMESPACE:$SA_NAME
```

### 3. View Role Details

```bash
# Describe Role
kubectl describe role pod-reader -n rbac-demo

# Get Role YAML
kubectl get role pod-reader -n rbac-demo -o yaml

# See what resources a Role grants access to
kubectl get role pod-reader -n rbac-demo -o jsonpath='{.rules[*].resources}'

# See what verbs a Role allows
kubectl get role pod-reader -n rbac-demo -o jsonpath='{.rules[*].verbs}'
```

### 4. Check RoleBindings

```bash
# Who has this Role?
kubectl get rolebinding -n rbac-demo -o wide

# What Role does this ServiceAccount have?
kubectl get rolebinding -n rbac-demo -o json | \
  jq -r '.items[] | select(.subjects[].name=="app-reader") | .metadata.name'
```

### 5. Test Permissions from Pod

```bash
# Exec into pod with ServiceAccount
kubectl exec -it -n rbac-demo rbac-test -- sh

# Inside pod:
# Check token exists
cat /var/run/secrets/kubernetes.io/serviceaccount/token

# Try kubectl commands
kubectl get pods -n rbac-demo  # Should work
kubectl get services -n rbac-demo  # Should fail
```

## 🧪 Hands-On Exercises

### Exercise 1: Create Read-Only User

**Task**: Create ServiceAccount with read-only access to all resources in namespace

```bash
# Create ServiceAccount
# Create Role with get, list, watch on all resources
# Create RoleBinding
# Test permissions
```

**Verification**:
```bash
kubectl auth can-i get pods -n rbac-demo --as=system:serviceaccount:rbac-demo:read-only
kubectl auth can-i delete pods -n rbac-demo --as=system:serviceaccount:rbac-demo:read-only
```

### Exercise 2: Create CI/CD ServiceAccount

**Task**: Create ServiceAccount for CI/CD with these permissions:
- Create/update/delete: Deployments, Services, ConfigMaps
- Read: Pods, Events
- No access: Secrets

**Test**: Deploy application using this ServiceAccount

### Exercise 3: Create Namespace Admin

**Task**: Create ServiceAccount with full control in one namespace but no access to others

**Hint**: Use built-in `admin` ClusterRole with RoleBinding

### Exercise 4: Debug Permission Denied

**Task**: Given a failing pod, diagnose and fix RBAC issues

```bash
# Pod fails to list secrets
# Determine what permissions are missing
# Create appropriate Role and RoleBinding
```

## 🧹 Cleanup

```bash
# Delete namespace (removes all RBAC resources)
kubectl delete namespace rbac-demo

# Or delete resources individually
kubectl delete sa --all -n rbac-demo
kubectl delete role --all -n rbac-demo
kubectl delete rolebinding --all -n rbac-demo

# Delete cluster-wide resources
kubectl delete clusterrole cluster-viewer
kubectl delete clusterrolebinding cluster-viewer-binding

# Verify cleanup
kubectl get sa,role,rolebinding -n rbac-demo
kubectl get clusterrole cluster-viewer
```

## 📚 What You Learned

✅ Created and managed ServiceAccounts
✅ Implemented Roles with specific permissions
✅ Bound Roles to ServiceAccounts with RoleBindings
✅ Created ClusterRoles for cluster-wide access
✅ Used ClusterRoleBindings for cluster-wide permissions
✅ Applied principle of least privilege
✅ Tested and debugged RBAC permissions
✅ Used built-in ClusterRoles

## 🎓 Key Concepts

### RBAC Decision Tree

```
Need permissions?
├── Cluster-wide access needed?
│   ├── Yes → Use ClusterRole + ClusterRoleBinding
│   └── No → Use Role + RoleBinding
├── Read-only access?
│   ├── Yes → Use built-in 'view' ClusterRole
│   └── No → Continue...
├── Full namespace control?
│   ├── Yes → Use built-in 'admin' ClusterRole
│   └── No → Create custom Role
└── Multiple namespaces?
    ├── Yes → ClusterRole + multiple RoleBindings
    └── No → Role + RoleBinding
```

### Built-in ClusterRoles

**view**: Read-only access
```bash
kubectl create rolebinding viewer \
  --clusterrole=view \
  --serviceaccount=default:viewer \
  -n my-namespace
```

**edit**: Read-write access (no RBAC changes)
```bash
kubectl create rolebinding editor \
  --clusterrole=edit \
  --serviceaccount=default:editor \
  -n my-namespace
```

**admin**: Full namespace control (including RBAC)
```bash
kubectl create rolebinding admin \
  --clusterrole=admin \
  --serviceaccount=default:admin \
  -n my-namespace
```

**cluster-admin**: God mode (full cluster control)
```bash
# BE VERY CAREFUL
kubectl create clusterrolebinding cluster-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=default:cluster-admin
```

### RBAC Anti-Patterns

**DON'T**:
```yaml
# Too permissive
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]

# Using cluster-admin unnecessarily
- clusterrole: cluster-admin

# Reusing default ServiceAccount
serviceAccountName: default
```

**DO**:
```yaml
# Specific permissions
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]

# Appropriate ClusterRole
- clusterrole: view

# Custom ServiceAccount
serviceAccountName: my-app
```

### Common RBAC Patterns

**Pattern 1: Application Pod**
```yaml
# Read ConfigMaps, Secrets
# No other permissions
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-config-reader
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
```

**Pattern 2: Monitoring**
```yaml
# Read-only all resources, all namespaces
kind: ClusterRole
metadata:
  name: monitoring
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["get", "list", "watch"]
```

**Pattern 3: CI/CD**
```yaml
# Deploy applications, update config
# No secret access
kind: Role
metadata:
  name: deployer
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["services", "configmaps"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
```

## 🔜 Next Steps

**Tutorial 13**: Network Policies - Control pod-to-pod communication
- Implement network segmentation
- Create ingress and egress rules
- Secure application traffic

## 💡 Pro Tips

1. **Quick permission check**:
   ```bash
   kubectl auth can-i <verb> <resource> --as=<user/serviceaccount>
   ```

2. **List all permissions**:
   ```bash
   kubectl auth can-i --list --as=system:serviceaccount:default:my-sa
   ```

3. **Create RoleBinding quickly**:
   ```bash
   kubectl create rolebinding my-binding \
     --role=my-role \
     --serviceaccount=default:my-sa
   ```

4. **Create ClusterRoleBinding quickly**:
   ```bash
   kubectl create clusterrolebinding my-binding \
     --clusterrole=view \
     --serviceaccount=default:my-sa
   ```

5. **Find which RoleBindings use a ServiceAccount**:
   ```bash
   kubectl get rolebindings -A -o json | \
     jq -r '.items[] | select(.subjects[]?.name=="my-sa") |
     "\(.metadata.namespace)/\(.metadata.name)"'
   ```

6. **Disable ServiceAccount auto-mount**:
   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: no-token
   automountServiceAccountToken: false
   ```

## 🆘 Troubleshooting

**Problem**: Permission denied errors
**Solution**:
```bash
# Check what ServiceAccount pod is using
kubectl get pod my-pod -o jsonpath='{.spec.serviceAccountName}'

# Check permissions
kubectl auth can-i <verb> <resource> -n <namespace> \
  --as=system:serviceaccount:<namespace>:<sa-name>

# List all permissions
kubectl auth can-i --list -n <namespace> \
  --as=system:serviceaccount:<namespace>:<sa-name>
```

**Problem**: RoleBinding not working
**Solution**:
```bash
# Verify RoleBinding exists
kubectl get rolebinding <name> -n <namespace>

# Check if it references correct Role and ServiceAccount
kubectl describe rolebinding <name> -n <namespace>

# Verify Role has required permissions
kubectl describe role <role-name> -n <namespace>
```

**Problem**: Can't determine what ClusterRole to use
**Solution**:
```bash
# List built-in ClusterRoles
kubectl get clusterroles | grep -v "system:"

# Describe to see permissions
kubectl describe clusterrole view
kubectl describe clusterrole edit
kubectl describe clusterrole admin
```

**Problem**: ServiceAccount token not mounted
**Solution**:
```bash
# Check if auto-mount is disabled
kubectl get sa <sa-name> -o jsonpath='{.automountServiceAccountToken}'

# Check pod spec
kubectl get pod <pod-name> -o yaml | grep -A 5 serviceAccount

# Manually enable in pod
spec:
  serviceAccountName: my-sa
  automountServiceAccountToken: true
```

## 📖 Additional Reading

- [RBAC Official Docs](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Using RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Service Accounts](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)
- [Authorization Modes](https://kubernetes.io/docs/reference/access-authn-authz/authorization/)

---

**Estimated Time**: 90-120 minutes
**Difficulty**: Intermediate to Advanced
**Prerequisites**: Tutorials 01-11 completed

**Next**: Tutorial 13 - Network Policies
