# Tutorial 02: Kubernetes RBAC (ServiceAccounts, Roles, RoleBindings)

## Objectives

By the end of this tutorial, you will:
- Understand Kubernetes RBAC architecture
- Create and manage ServiceAccounts
- Define Roles and ClusterRoles
- Create RoleBindings and ClusterRoleBindings
- Implement least privilege access control
- Test and verify RBAC permissions
- Debug permission issues
- Apply RBAC to real-world scenarios

## Prerequisites

- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl installed and configured
- Basic Kubernetes knowledge (pods, deployments)
- Understanding of YAML
- Terminal/command line access

## What is Kubernetes RBAC?

Role-Based Access Control (RBAC) in Kubernetes is a method of regulating access to resources based on the roles of individual users or ServiceAccounts. It's a critical security feature that controls who can perform what actions on which resources.

### Key Components

- **ServiceAccount**: Identity for pods and processes
- **Role**: Set of permissions within a namespace
- **ClusterRole**: Set of permissions cluster-wide
- **RoleBinding**: Grants Role permissions to users/ServiceAccounts in a namespace
- **ClusterRoleBinding**: Grants ClusterRole permissions cluster-wide
- **User**: Human user (managed outside Kubernetes)
- **Group**: Collection of users

### RBAC Model

```
Subject (Who?)          Verb (What?)        Resource (Where?)
├─ User                 ├─ get              ├─ pods
├─ Group                ├─ list             ├─ services
└─ ServiceAccount       ├─ watch            ├─ deployments
                        ├─ create           ├─ configmaps
                        ├─ update           ├─ secrets
                        ├─ patch            ├─ namespaces
                        ├─ delete           └─ nodes
                        └─ deletecollection
```

## Why Kubernetes RBAC is Important

1. **Security**: Prevents unauthorized access to resources
2. **Isolation**: Separates concerns between teams/applications
3. **Compliance**: Meets regulatory requirements
4. **Auditability**: Track who did what and when
5. **Least Privilege**: Grant minimum necessary permissions
6. **Defense in Depth**: Additional security layer

## Step-by-Step Instructions

### Step 1: Enable RBAC (if not enabled)

```bash
# Check if RBAC is enabled
kubectl api-versions | grep rbac
# Should see: rbac.authorization.k8s.io/v1

# For minikube (usually enabled by default)
minikube start --extra-config=apiserver.authorization-mode=RBAC

# Verify current context
kubectl config current-context

# View current permissions
kubectl auth can-i --list
```

### Step 2: Create a Namespace

```bash
# Create a namespace for our examples
kubectl create namespace dev-team

# Verify
kubectl get namespaces
```

### Step 3: Create ServiceAccounts

ServiceAccounts are identities for pods. Each pod runs with a ServiceAccount.

```yaml
# serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-reader
  namespace: dev-team
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-deployer
  namespace: dev-team
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-admin
  namespace: dev-team
```

```bash
# Apply ServiceAccounts
kubectl apply -f serviceaccount.yaml

# View ServiceAccounts
kubectl get serviceaccounts -n dev-team

# Describe ServiceAccount
kubectl describe sa app-reader -n dev-team
# Note the Tokens and Mountable secrets
```

### Step 4: Create Roles

Roles define what actions can be performed on which resources.

```yaml
# roles.yaml
---
# Read-only role for pods
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: dev-team
rules:
- apiGroups: [""]  # "" indicates core API group
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
---
# Role to manage deployments
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployment-manager
  namespace: dev-team
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
---
# Role for full namespace access
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: namespace-admin
  namespace: dev-team
rules:
- apiGroups: ["", "apps", "batch"]
  resources: ["*"]
  verbs: ["*"]
```

```bash
# Apply Roles
kubectl apply -f roles.yaml

# View Roles
kubectl get roles -n dev-team

# Describe Role
kubectl describe role pod-reader -n dev-team
```

### Step 5: Create RoleBindings

RoleBindings grant the permissions defined in a Role to users or ServiceAccounts.

```yaml
# rolebindings.yaml
---
# Bind pod-reader role to app-reader ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: dev-team
subjects:
- kind: ServiceAccount
  name: app-reader
  namespace: dev-team
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
---
# Bind deployment-manager to app-deployer ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: manage-deployments
  namespace: dev-team
subjects:
- kind: ServiceAccount
  name: app-deployer
  namespace: dev-team
roleRef:
  kind: Role
  name: deployment-manager
  apiGroup: rbac.authorization.k8s.io
---
# Bind namespace-admin to app-admin ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: admin-access
  namespace: dev-team
subjects:
- kind: ServiceAccount
  name: app-admin
  namespace: dev-team
roleRef:
  kind: Role
  name: namespace-admin
  apiGroup: rbac.authorization.k8s.io
```

```bash
# Apply RoleBindings
kubectl apply -f rolebindings.yaml

# View RoleBindings
kubectl get rolebindings -n dev-team

# Describe RoleBinding
kubectl describe rolebinding read-pods -n dev-team
```

### Step 6: Test RBAC Permissions

```bash
# Test pod-reader permissions
kubectl auth can-i list pods \
  --as=system:serviceaccount:dev-team:app-reader \
  -n dev-team
# Output: yes

kubectl auth can-i delete pods \
  --as=system:serviceaccount:dev-team:app-reader \
  -n dev-team
# Output: no

kubectl auth can-i create deployments \
  --as=system:serviceaccount:dev-team:app-reader \
  -n dev-team
# Output: no

# Test deployment-manager permissions
kubectl auth can-i create deployments \
  --as=system:serviceaccount:dev-team:app-deployer \
  -n dev-team
# Output: yes

kubectl auth can-i delete pods \
  --as=system:serviceaccount:dev-team:app-deployer \
  -n dev-team
# Output: no

# Test admin permissions
kubectl auth can-i delete pods \
  --as=system:serviceaccount:dev-team:app-admin \
  -n dev-team
# Output: yes

# List all permissions for ServiceAccount
kubectl auth can-i --list \
  --as=system:serviceaccount:dev-team:app-reader \
  -n dev-team
```

### Step 7: ClusterRoles and ClusterRoleBindings

ClusterRoles work across all namespaces and can grant access to cluster-scoped resources.

```yaml
# clusterrole.yaml
---
# ClusterRole to view nodes
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: node-reader
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["persistentvolumes"]
  verbs: ["get", "list", "watch"]
---
# ClusterRole to view all pods across all namespaces
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: global-pod-reader
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["namespaces"]
  verbs: ["get", "list"]
```

```yaml
# clusterrolebinding.yaml
---
# Grant node-reader to specific ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-nodes
subjects:
- kind: ServiceAccount
  name: app-admin
  namespace: dev-team
roleRef:
  kind: ClusterRole
  name: node-reader
  apiGroup: rbac.authorization.k8s.io
---
# Grant global-pod-reader to ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-all-pods
subjects:
- kind: ServiceAccount
  name: app-admin
  namespace: dev-team
roleRef:
  kind: ClusterRole
  name: global-pod-reader
  apiGroup: rbac.authorization.k8s.io
```

```bash
# Apply ClusterRole and ClusterRoleBinding
kubectl apply -f clusterrole.yaml
kubectl apply -f clusterrolebinding.yaml

# Test cluster-level permissions
kubectl auth can-i list nodes \
  --as=system:serviceaccount:dev-team:app-admin
# Output: yes

kubectl auth can-i list pods --all-namespaces \
  --as=system:serviceaccount:dev-team:app-admin
# Output: yes
```

### Step 8: Using ServiceAccount in Pods

```yaml
# pod-with-sa.yaml
---
# Pod using app-reader ServiceAccount
apiVersion: v1
kind: Pod
metadata:
  name: reader-pod
  namespace: dev-team
spec:
  serviceAccountName: app-reader
  containers:
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ["sleep", "3600"]
---
# Deployment using app-deployer ServiceAccount
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployer-app
  namespace: dev-team
spec:
  replicas: 1
  selector:
    matchLabels:
      app: deployer
  template:
    metadata:
      labels:
        app: deployer
    spec:
      serviceAccountName: app-deployer
      containers:
      - name: app
        image: nginx:alpine
        ports:
        - containerPort: 80
```

```bash
# Apply pods
kubectl apply -f pod-with-sa.yaml

# Exec into reader-pod and test permissions
kubectl exec -it reader-pod -n dev-team -- /bin/bash

# Inside the pod:
# List pods (should work)
kubectl get pods -n dev-team

# Try to delete a pod (should fail)
kubectl delete pod deployer-app-xxx -n dev-team
# Error: pods "deployer-app-xxx" is forbidden: User "system:serviceaccount:dev-team:app-reader" cannot delete resource "pods"

exit
```

### Step 9: Resource-Specific Permissions

```yaml
# specific-resource-role.yaml
---
# Role to access only specific ConfigMaps
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: specific-config-reader
  namespace: dev-team
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["app-config", "app-settings"]  # Only these ConfigMaps
  verbs: ["get", "list"]
---
# Role to access secrets with specific prefix
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-secrets-reader
  namespace: dev-team
rules:
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["app-db-secret", "app-api-secret"]
  verbs: ["get"]
```

```bash
# Apply specific resource roles
kubectl apply -f specific-resource-role.yaml

# Test access to specific ConfigMap
kubectl auth can-i get configmap/app-config \
  --as=system:serviceaccount:dev-team:app-reader \
  -n dev-team
```

### Step 10: Aggregated ClusterRoles

```yaml
# aggregated-clusterrole.yaml
---
# Base ClusterRole with aggregation
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-aggregate
aggregationRule:
  clusterRoleSelectors:
  - matchLabels:
      rbac.example.com/aggregate-to-monitoring: "true"
rules: []  # Rules are automatically filled
---
# Partial ClusterRole 1
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-pods
  labels:
    rbac.example.com/aggregate-to-monitoring: "true"
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
---
# Partial ClusterRole 2
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-metrics
  labels:
    rbac.example.com/aggregate-to-monitoring: "true"
rules:
- apiGroups: ["metrics.k8s.io"]
  resources: ["pods", "nodes"]
  verbs: ["get", "list"]
```

```bash
# Apply aggregated ClusterRoles
kubectl apply -f aggregated-clusterrole.yaml

# View aggregated permissions
kubectl describe clusterrole monitoring-aggregate
```

## Real-World Examples

### Example 1: CI/CD Pipeline ServiceAccount

```yaml
# cicd-rbac.yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cicd-deployer
  namespace: production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: cicd-deploy
  namespace: production
rules:
# Manage deployments
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
# Manage services
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get", "list", "create", "update", "patch"]
# Read ConfigMaps and Secrets (not create/delete)
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
# View pods for verification
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: cicd-deploy-binding
  namespace: production
subjects:
- kind: ServiceAccount
  name: cicd-deployer
  namespace: production
roleRef:
  kind: Role
  name: cicd-deploy
  apiGroup: rbac.authorization.k8s.io
```

### Example 2: Monitoring ServiceAccount

```yaml
# monitoring-rbac.yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus
  namespace: monitoring
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus-metrics
rules:
- apiGroups: [""]
  resources: ["nodes", "nodes/metrics", "services", "endpoints", "pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get"]
- nonResourceURLs: ["/metrics", "/metrics/cadvisor"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus-metrics
subjects:
- kind: ServiceAccount
  name: prometheus
  namespace: monitoring
roleRef:
  kind: ClusterRole
  name: prometheus-metrics
  apiGroup: rbac.authorization.k8s.io
```

### Example 3: Developer Access

```yaml
# developer-rbac.yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: developer
  namespace: dev
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: developer-role
  namespace: dev
rules:
# Full access to most resources in dev namespace
- apiGroups: ["", "apps", "batch"]
  resources: ["*"]
  verbs: ["*"]
# Cannot manage RBAC
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["*"]
  verbs: ["get", "list"]
# Cannot manage ResourceQuotas
- apiGroups: [""]
  resources: ["resourcequotas", "limitranges"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: dev
subjects:
- kind: ServiceAccount
  name: developer
  namespace: dev
roleRef:
  kind: Role
  name: developer-role
  apiGroup: rbac.authorization.k8s.io
```

## Troubleshooting RBAC

### Debug Permission Issues

```bash
# Check if user/SA can perform action
kubectl auth can-i create deployments --as=system:serviceaccount:dev-team:app-reader -n dev-team

# List all permissions
kubectl auth can-i --list --as=system:serviceaccount:dev-team:app-reader -n dev-team

# Describe role to see rules
kubectl describe role pod-reader -n dev-team

# Describe rolebinding to see subjects
kubectl describe rolebinding read-pods -n dev-team

# View ServiceAccount token
kubectl get secret -n dev-team
kubectl describe secret <sa-token-name> -n dev-team
```

### Common RBAC Errors

```bash
# Error: forbidden
# Cause: Missing permission
# Solution: Check Role/ClusterRole rules, verify RoleBinding

# Error: unknown user
# Cause: ServiceAccount doesn't exist
# Solution: Create ServiceAccount

# Error: cannot get resource
# Cause: Missing 'get' verb in Role
# Solution: Add 'get' to rules

# Enable audit logging to debug
# Add to API server: --audit-log-path=/var/log/audit.log
```

## Security Best Practices

### Principle of Least Privilege

```yaml
# ✅ Good: Specific permissions
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch"]

# ❌ Bad: Overly broad permissions
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
```

### Namespace Isolation

```bash
# Use Roles instead of ClusterRoles when possible
# Grant permissions per namespace
# Separate dev/staging/prod namespaces with different RBAC
```

### Regular Audits

```bash
# List all ClusterRoleBindings
kubectl get clusterrolebindings

# Find ClusterRoleBindings with cluster-admin
kubectl get clusterrolebindings -o json | \
  jq '.items[] | select(.roleRef.name=="cluster-admin") | .metadata.name'

# List all ServiceAccounts with ClusterRoleBindings
kubectl get clusterrolebindings -o json | \
  jq -r '.items[] | select(.subjects[]?.kind=="ServiceAccount") |
  "\(.metadata.name): \(.subjects[].namespace):\(.subjects[].name)"'
```

## Verification Tasks

Test your RBAC knowledge:

```bash
# 1. Create a ServiceAccount that can only read ConfigMaps
# 2. Create a Role that allows pod execution (kubectl exec)
# 3. Create a ServiceAccount for log viewing only
# 4. Set up RBAC for a developer with full access except secrets
# 5. Create a ClusterRole for viewing all namespaces
```

## Key Takeaways

1. **ServiceAccounts are pod identities** - Every pod needs one
2. **Roles are namespaced, ClusterRoles are cluster-wide**
3. **RoleBindings link subjects to roles**
4. **Test permissions with `kubectl auth can-i`**
5. **Use least privilege principle**
6. **Audit RBAC regularly**
7. **Separate concerns with different ServiceAccounts**
8. **Document RBAC decisions**

## Additional Resources

- [Kubernetes RBAC Documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [RBAC Best Practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/)
- [kubectl auth can-i](https://kubernetes.io/docs/reference/access-authn-authz/authorization/#checking-api-access)
- [Audit RBAC with rbac-tool](https://github.com/alcideio/rbac-tool)

## Next Steps

- Tutorial 03: AWS IAM (Users, Groups, Policies)
- Tutorial 04: Azure AD and RBAC
- Integrate RBAC with CI/CD pipelines
- Implement Pod Security Standards with RBAC

---

**Difficulty**: Intermediate
**Estimated Time**: 3-4 hours
**Practice**: Implement RBAC for your microservices
