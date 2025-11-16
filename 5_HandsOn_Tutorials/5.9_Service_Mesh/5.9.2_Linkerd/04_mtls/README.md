# Linkerd Tutorial 04: Automatic mTLS

## Overview

Linkerd provides automatic mutual TLS (mTLS) by default with zero configuration. Learn how Linkerd handles certificate management, identity verification, and encryption.

## Learning Objectives

- Understand Linkerd's automatic mTLS
- Verify encrypted connections
- Manage certificate lifecycle
- Configure custom trust anchors
- Troubleshoot mTLS issues

## Linkerd mTLS Features

**Automatic by Default:**
- No configuration required
- Enabled when both services have Linkerd proxies
- Automatic certificate rotation
- Identity-based authentication

**Certificate Lifecycle:**
- Issuance: Automatic on pod startup
- Rotation: Every 24 hours by default
- Trust: Based on Kubernetes ServiceAccount

## Architecture

```
┌────────────────────────────────────────┐
│     linkerd-identity (CA)              │
│   • Issues certificates                 │
│   • Validates identities                │
│   • Manages trust anchors               │
└───────────┬────────────────────────────┘
            │ Issues certs
            ↓
┌─────────────────────────────────────────┐
│         Service A Pod                    │
│  ┌───────────────────────────────┐     │
│  │  linkerd-proxy                │     │
│  │  • Client cert: A's identity  │     │
│  │  • Server cert: A's identity  │     │
│  │  • CA cert: Trust anchor      │     │
│  └──────────┬────────────────────┘     │
└─────────────┼───────────────────────────┘
              │ mTLS
              ↓
┌─────────────────────────────────────────┐
│         Service B Pod                    │
│  ┌───────────────────────────────┐     │
│  │  linkerd-proxy                │     │
│  │  • Validates A's cert         │     │
│  │  • Presents B's cert          │     │
│  └───────────────────────────────┘     │
└─────────────────────────────────────────┘
```

## Tutorial Exercises

### Exercise 1: Verify Automatic mTLS

**Check mTLS Status:**
```bash
# List all edges (connections)
linkerd viz edges deployment

# Output shows:
# SRC          DST          SECURED
# frontend     backend      √
```

**View Traffic:**
```bash
# Tap shows mTLS status
linkerd viz tap deploy/frontend

# Look for: tls=true
```

### Exercise 2: Certificate Inspection

**View Certificates:**
```bash
# Get pod name
POD=$(kubectl get pod -l app=frontend -o jsonpath='{.items[0].metadata.name}')

# Extract certificate
kubectl exec $POD -c linkerd-proxy -- \
  cat /var/run/linkerd/identity/end-entity/crt.pem | \
  openssl x509 -text -noout

# Shows:
# - Issuer: identity.linkerd.cluster.local
# - Subject: ServiceAccount identity
# - Validity: 24 hours
```

**Check Identity:**
```bash
# Certificate includes ServiceAccount as identity
# Format: <sa-name>.<namespace>.serviceaccount.identity.linkerd.cluster.local
```

### Exercise 3: Monitor Certificate Rotation

**Watch Certificate Refresh:**
```bash
# Certificates rotate every 24h
# Pods automatically get new certificates

# Check certificate age
kubectl exec $POD -c linkerd-proxy -- \
  stat /var/run/linkerd/identity/end-entity/crt.pem

# View identity logs
kubectl logs -n linkerd deploy/linkerd-identity -f
```

### Exercise 4: Custom Trust Anchor

**Generate Custom CA:**
```bash
# Generate root CA
step certificate create root.linkerd.cluster.local ca.crt ca.key \
  --profile root-ca --no-password --insecure

# Generate issuer certificate
step certificate create identity.linkerd.cluster.local issuer.crt issuer.key \
  --profile intermediate-ca --not-after 8760h --no-password --insecure \
  --ca ca.crt --ca-key ca.key
```

**Install Linkerd with Custom CA:**
```bash
linkerd install \
  --identity-trust-anchors-file ca.crt \
  --identity-issuer-certificate-file issuer.crt \
  --identity-issuer-key-file issuer.key \
  | kubectl apply -f -
```

### Exercise 5: Per-Namespace Identities

**Deploy with Different ServiceAccounts:**
```bash
# Frontend in namespace-a with sa-frontend
kubectl apply -f 01-frontend-ns-a.yaml

# Backend in namespace-b with sa-backend
kubectl apply -f 02-backend-ns-b.yaml
```

**Verify Different Identities:**
```bash
# Frontend identity
# sa-frontend.namespace-a.serviceaccount.identity.linkerd.cluster.local

# Backend identity
# sa-backend.namespace-b.serviceaccount.identity.linkerd.cluster.local
```

## Verification

### Check All Connections are Secured

```bash
# View edges
linkerd viz edges deployment -A

# All should show SECURED = √
```

### Monitor mTLS Metrics

```bash
# Check Prometheus metrics
kubectl port-forward -n linkerd-viz svc/prometheus 9090:9090

# Query:
# request_total{tls="true"}
# Shows all mTLS traffic
```

### Test mTLS Enforcement

```bash
# Deploy pod without Linkerd proxy
kubectl run plain-pod --image=curlimages/curl -- sleep 3600

# Try to connect (will work - Linkerd is permissive)
kubectl exec plain-pod -- curl http://backend:8080

# But won't be encrypted
linkerd viz tap deploy/backend | grep plain-pod
# Shows: tls=no_tls_from_remote
```

## Troubleshooting

### Certificate Not Issued

```bash
# Check identity logs
kubectl logs -n linkerd deploy/linkerd-identity

# Verify proxy can reach identity service
kubectl exec $POD -c linkerd-proxy -- \
  curl -k https://linkerd-identity.linkerd.svc.cluster.local:8080/metrics
```

### mTLS Not Working

```bash
# Ensure both pods have proxies
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}'

# Check edges
linkerd viz edges deployment

# Verify identity is running
kubectl get pods -n linkerd -l linkerd.io/control-plane-component=identity
```

### Certificate Expired

```bash
# Check certificate validity
kubectl exec $POD -c linkerd-proxy -- \
  cat /var/run/linkerd/identity/end-entity/crt.pem | \
  openssl x509 -noout -dates

# Restart pod to get new cert
kubectl delete pod $POD
```

## Best Practices

1. **Let Linkerd Handle It**: No manual configuration needed
2. **Use ServiceAccounts**: For fine-grained identity
3. **Monitor Certificate Rotation**: Ensure it's working
4. **Custom CA for Production**: Better than default
5. **Integrate with Cert-Manager**: For enterprise PKI
6. **Regular Backups**: Of trust anchors and issuers

## Comparison with Istio

| Feature | Linkerd | Istio |
|---------|---------|-------|
| **Configuration** | Automatic | Manual or automatic |
| **Certificate Rotation** | 24h default | 24h default |
| **Custom CA** | Easy | Medium |
| **Performance** | Faster | Slower |
| **Resource Usage** | Lower | Higher |

## Advanced Configuration

### Change Certificate Lifetime

```bash
linkerd install \
  --identity-issuance-lifetime=48h \
  | kubectl apply -f -
```

### External Certificate Management

```bash
# Use cert-manager for certificate issuance
kubectl apply -f 03-cert-manager-integration.yaml
```

## Cleanup

```bash
# mTLS is automatic, nothing to clean up
# Uninstall Linkerd if needed
linkerd uninstall | kubectl delete -f -
```

## Next Steps

- [05_observability](../05_observability/): Monitor mTLS connections
- Implement authorization policies
- Integrate with external PKI
- Configure audit logging

## Resources

- [Linkerd mTLS](https://linkerd.io/2/features/automatic-mtls/)
- [Identity and Certificates](https://linkerd.io/2/tasks/generate-certificates/)
- [Rotating Certificates](https://linkerd.io/2/tasks/manually-rotating-control-plane-tls-credentials/)
