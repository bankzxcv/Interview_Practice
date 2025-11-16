# Linkerd Tutorial 07: Security Policies

## Overview

Implement Linkerd's authorization policies for fine-grained access control. Learn to secure service-to-service communication beyond mTLS encryption.

## Learning Objectives

- Understand Linkerd authorization policies
- Configure Server and ServerAuthorization resources
- Implement default-deny policies
- Create fine-grained access rules
- Debug authorization issues
- Migrate from open to secure mesh

## Authorization Architecture

```
┌────────────────────────────────────────┐
│         Client Service                  │
│  Identity: web.default.sa               │
└──────────────┬─────────────────────────┘
               │ Request
               ↓
┌────────────────────────────────────────┐
│    Authorization Check (Server)         │
│  1. Which Server applies?               │
│  2. Check ServerAuthorization rules     │
│  3. Allow or Deny                       │
└──────────────┬─────────────────────────┘
               ↓
┌────────────────────────────────────────┐
│         Backend Service                 │
│  Identity: backend.default.sa           │
└────────────────────────────────────────┘
```

## Key Resources

### Server
Defines which pods/ports to protect:
```yaml
apiVersion: policy.linkerd.io/v1beta1
kind: Server
metadata:
  name: backend-http
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: backend
  port: http
  proxyProtocol: HTTP/1
```

### ServerAuthorization
Defines who can access the Server:
```yaml
apiVersion: policy.linkerd.io/v1beta1
kind: ServerAuthorization
metadata:
  name: backend-auth
  namespace: default
spec:
  server:
    name: backend-http
  client:
    meshTLS:
      serviceAccounts:
        - name: web
          namespace: default
```

## Tutorial Exercises

### Exercise 1: Enable Policy (Deny by Default)

**Install Linkerd with Policy Enforcement:**
```bash
# Uninstall existing Linkerd first
linkerd uninstall | kubectl delete -f -

# Install with default policy: deny
linkerd install \
  --set policyController.defaultAllowPolicy=deny \
  | kubectl apply -f -

# Verify
linkerd check
```

**Now all traffic is blocked by default!**

### Exercise 2: Allow Specific Service Access

**Deploy Application:**
```bash
kubectl apply -f 01-demo-app.yaml
# Includes: frontend, backend, database
```

**Test - Should Fail:**
```bash
kubectl exec deploy/frontend -- curl -s backend:8080
# Connection refused or unauthorized
```

**Create Server for Backend:**
```bash
kubectl apply -f - <<EOF
apiVersion: policy.linkerd.io/v1beta1
kind: Server
metadata:
  name: backend-http
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: backend
  port: http
  proxyProtocol: HTTP/1
EOF
```

**Allow Frontend to Access Backend:**
```bash
kubectl apply -f - <<EOF
apiVersion: policy.linkerd.io/v1beta1
kind: ServerAuthorization
metadata:
  name: backend-from-frontend
  namespace: default
spec:
  server:
    name: backend-http
  client:
    meshTLS:
      serviceAccounts:
        - name: frontend
          namespace: default
EOF
```

**Test - Should Succeed:**
```bash
kubectl exec deploy/frontend -- curl -s backend:8080
# Now works!
```

### Exercise 3: Port-Specific Policies

**Backend with Multiple Ports:**
```yaml
apiVersion: policy.linkerd.io/v1beta1
kind: Server
metadata:
  name: backend-http
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: backend
  port: 8080  # HTTP port
  proxyProtocol: HTTP/1
---
apiVersion: policy.linkerd.io/v1beta1
kind: Server
metadata:
  name: backend-admin
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: backend
  port: 9090  # Admin port
  proxyProtocol: HTTP/1
```

**Different Authorization:**
```yaml
# Anyone can access HTTP port
apiVersion: policy.linkerd.io/v1beta1
kind: ServerAuthorization
metadata:
  name: backend-http-auth
  namespace: default
spec:
  server:
    name: backend-http
  client:
    meshTLS:
      unauthenticatedTLS: true  # Any meshed service
---
# Only admin can access admin port
apiVersion: policy.linkerd.io/v1beta1
kind: ServerAuthorization
metadata:
  name: backend-admin-auth
  namespace: default
spec:
  server:
    name: backend-admin
  client:
    meshTLS:
      serviceAccounts:
        - name: admin
          namespace: default
```

### Exercise 4: Route-Level Authorization

**HTTP Route-Specific Policies:**
```yaml
apiVersion: policy.linkerd.io/v1beta1
kind: HTTPRoute
metadata:
  name: backend-routes
  namespace: default
spec:
  parentRefs:
    - name: backend-http
      kind: Server
      group: policy.linkerd.io
  rules:
    # Public route
    - matches:
        - path:
            value: "/health"
      backendRefs:
        - name: backend
          port: 8080
    # Protected route
    - matches:
        - path:
            value: "/api"
      backendRefs:
        - name: backend
          port: 8080
---
# Different auth for different routes
apiVersion: policy.linkerd.io/v1beta1
kind: ServerAuthorization
metadata:
  name: backend-api-auth
  namespace: default
spec:
  server:
    name: backend-http
  client:
    meshTLS:
      serviceAccounts:
        - name: frontend
          namespace: default
```

### Exercise 5: Namespace-Based Policies

**Allow All Services in Namespace:**
```yaml
apiVersion: policy.linkerd.io/v1beta1
kind: ServerAuthorization
metadata:
  name: backend-from-namespace
  namespace: default
spec:
  server:
    name: backend-http
  client:
    meshTLS:
      serviceAccounts:
        - name: "*"  # All service accounts
          namespace: production  # But only from production namespace
```

### Exercise 6: Audit Mode (Logging)

**Enable Audit Logging:**
```yaml
apiVersion: policy.linkerd.io/v1beta1
kind: ServerAuthorization
metadata:
  name: backend-audit
  namespace: default
  annotations:
    linkerd.io/policy-mode: "audit"  # Log violations, don't block
spec:
  server:
    name: backend-http
  client:
    meshTLS:
      serviceAccounts:
        - name: frontend
          namespace: default
```

**View Audit Logs:**
```bash
kubectl logs -n default deploy/backend -c linkerd-proxy | grep -i policy
```

### Exercise 7: Migration Strategy

**Step 1: Start with Allow-All (Current State):**
```bash
# Default policy: allow
linkerd install | kubectl apply -f -
```

**Step 2: Create Servers (No Enforcement Yet):**
```bash
kubectl apply -f 02-all-servers.yaml
```

**Step 3: Create Authorizations:**
```bash
kubectl apply -f 03-all-authorizations.yaml
```

**Step 4: Enable Audit Mode:**
```yaml
annotations:
  linkerd.io/policy-mode: "audit"
```

**Step 5: Monitor Logs:**
```bash
# Check for unexpected denials
kubectl logs -l app=backend -c linkerd-proxy | grep -i unauthorized
```

**Step 6: Switch to Enforce Mode:**
```bash
# Remove audit annotation
kubectl annotate serverauthorization --all linkerd.io/policy-mode-
```

**Step 7: Enable Default-Deny:**
```bash
linkerd upgrade --set policyController.defaultAllowPolicy=deny | kubectl apply -f -
```

### Exercise 8: Debugging Policies

**Check Which Policies Apply:**
```bash
# View effective policy for a pod
linkerd diagnostics policy -n default backend-pod-name

# Shows:
# - Which Server applies
# - Which ServerAuthorizations apply
# - Effective permissions
```

**Test Connection:**
```bash
# Try connection
kubectl exec deploy/frontend -- curl -v backend:8080

# Check proxy logs
kubectl logs deploy/backend -c linkerd-proxy | tail -20
```

**Common Issues:**
```bash
# No Server defined
# Solution: Create Server resource

# ServerAuthorization doesn't match
# Solution: Check serviceAccount names

# Wrong port in Server
# Solution: Verify port names/numbers
```

## Verification

```bash
# List all Servers
kubectl get servers -A

# List all ServerAuthorizations
kubectl get serverauthorizations -A

# Check policy status
linkerd diagnostics policy -n default <pod-name>

# Test access
kubectl exec deploy/frontend -- curl -s backend:8080
```

## Best Practices

1. **Start with Audit Mode**: Don't break existing traffic
2. **Use ServiceAccounts**: For service identity
3. **Principle of Least Privilege**: Only allow necessary access
4. **Document Policies**: Why each rule exists
5. **Test Thoroughly**: Before enforcing
6. **Monitor Continuously**: Watch for unauthorized attempts
7. **Version Control**: Store policies in Git

## Common Patterns

### Allow All in Namespace
```yaml
client:
  meshTLS:
    serviceAccounts:
      - name: "*"
        namespace: production
```

### Allow Specific Services
```yaml
client:
  meshTLS:
    serviceAccounts:
      - name: web
        namespace: default
      - name: api
        namespace: default
```

### Allow Unauthenticated (Public)
```yaml
client:
  meshTLS:
    unauthenticatedTLS: true
```

## Cleanup

```bash
kubectl delete server --all -A
kubectl delete serverauthorization --all -A
```

## Next Steps

- [08_production_deployment](../08_production_deployment/): Production Linkerd setup
- Integrate with OPA/Gatekeeper
- Implement dynamic policies
- Add external authorization

## Resources

- [Linkerd Policy](https://linkerd.io/2/features/server-policy/)
- [Authorization Policy](https://linkerd.io/2/tasks/authorization-policy/)
- [Policy Reference](https://linkerd.io/2/reference/authorization-policy/)
