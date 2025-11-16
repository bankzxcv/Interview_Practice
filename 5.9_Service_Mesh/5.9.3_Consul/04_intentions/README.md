# Consul Tutorial 04: Service Intentions

## Overview

Configure Consul service intentions for service-to-service authorization. Learn to implement allow/deny rules, L7 permissions, and intention precedence.

## Learning Objectives

- Create service intentions
- Configure allow and deny rules
- Implement L7 (HTTP) permissions
- Understand intention precedence
- Monitor intention enforcement
- Migrate to intention CRDs

## What are Intentions?

Intentions control which services can communicate in the mesh:
- **Allow**: Permit service communication
- **Deny**: Block service communication
- **L4 (default)**: TCP-level control
- **L7**: HTTP method/path control

## Creating Intentions

### Via UI

1. Open Consul UI: `kubectl port-forward -n consul svc/consul-ui 8500:80`
2. Navigate to "Intentions"
3. Click "Create"
4. Set Source and Destination
5. Choose Allow/Deny

### Via CLI

```bash
# Allow frontend -> backend
consul intention create frontend backend

# Deny all -> backend
consul intention create -deny "*" backend

# Check intentions
consul intention list
consul intention get frontend backend
```

### Via API

```bash
# Create intention
curl -X PUT http://localhost:8500/v1/connect/intentions/exact \
  -d '{
    "SourceName": "frontend",
    "DestinationName": "backend",
    "Action": "allow"
  }'
```

### Via CRD (Recommended for Kubernetes)

```yaml
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceIntentions
metadata:
  name: backend
spec:
  destination:
    name: backend
  sources:
    - name: frontend
      action: allow
    - name: "*"
      action: deny
```

## L7 Permissions

**HTTP Method/Path Control:**
```yaml
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceIntentions
metadata:
  name: api
spec:
  destination:
    name: api
  sources:
    - name: web
      permissions:
        - action: allow
          http:
            pathPrefix: "/public"
            methods: ["GET"]
        - action: allow
          http:
            pathExact: "/api/users"
            methods: ["GET", "POST"]
        - action: deny
          http:
            pathPrefix: "/admin"
```

## Intention Precedence

**Order (highest to lowest):**
1. Exact source + exact destination
2. Exact source + wildcard destination
3. Wildcard source + exact destination
4. Wildcard source + wildcard destination

**Example:**
```bash
# Highest precedence
consul intention create frontend backend

# Lower precedence
consul intention create frontend "*"
consul intention create "*" backend

# Lowest precedence
consul intention create "*" "*"
```

## Default Deny

**Secure by Default:**
```yaml
global:
  acls:
    manageSystemACLs: true
connectInject:
  default: true
  aclBindingRuleSelector: "serviceaccount.name!=default"
```

**Create default deny:**
```bash
consul intention create -deny "*" "*"
```

**Then allow specific services:**
```bash
consul intention create frontend backend
consul intention create backend database
```

## Verify Intentions

**Test Allow:**
```bash
kubectl exec deploy/frontend -- curl -s backend:8080
# Should work if allowed
```

**Test Deny:**
```bash
kubectl exec deploy/unauthorized-app -- curl -s backend:8080
# Should fail with connection error
```

**View Logs:**
```bash
# Check Envoy access logs
kubectl logs deploy/backend -c consul-connect-envoy-sidecar | grep -i rbac
```

## Best Practices

1. **Default Deny**: Secure by default
2. **Least Privilege**: Only allow necessary communication
3. **Use CRDs**: For Kubernetes native management
4. **Document Intentions**: Why each exists
5. **Regular Audit**: Review and remove unused
6. **Test Thoroughly**: Before enforcing
7. **Use L7 Permissions**: For fine-grained control

## Troubleshooting

```bash
# Check intention enforcement
kubectl logs deploy/backend -c consul-connect-envoy-sidecar | grep intention

# Verify intention exists
consul intention list
consul intention check frontend backend

# Debug connection failures
kubectl exec deploy/frontend -c consul-connect-envoy-sidecar -- \
  curl localhost:19000/config_dump | jq '.configs[].dynamic_listeners'
```

## Next Steps

- [05_mtls](../05_mtls/): Automatic mTLS configuration
- Implement JWT authentication
- Configure external authorization
- Add service identity with ACLs
