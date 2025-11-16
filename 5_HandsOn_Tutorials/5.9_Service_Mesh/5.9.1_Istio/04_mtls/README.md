# Istio Tutorial 04: Mutual TLS (mTLS)

## Overview

Learn to secure service-to-service communication with mutual TLS (mTLS) in Istio. Implement automatic certificate management, authentication, and encrypted communication between microservices.

## Learning Objectives

- Understand mTLS and zero-trust networking
- Enable automatic mTLS in Istio
- Configure PeerAuthentication policies
- Implement strict vs permissive mTLS modes
- Manage certificates and identities
- Troubleshoot mTLS issues
- Migrate from plaintext to mTLS

## Prerequisites

- Completed Tutorial 03 (Circuit Breaking)
- Understanding of TLS/SSL basics
- Knowledge of PKI and certificates

## Key Concepts

### Mutual TLS (mTLS)

Traditional TLS: Client verifies server identity
Mutual TLS: Both client AND server verify each other's identity

**Benefits:**
- Encrypted communication between services
- Service identity verification
- Zero-trust security model
- Automatic certificate rotation
- Defense against man-in-the-middle attacks

### Istio mTLS Architecture

```
┌──────────────────────────────────────────┐
│         Istio Control Plane              │
│           (Citadel/Istiod)               │
│    • Certificate Authority (CA)          │
│    • Certificate Signing                 │
│    • Certificate Distribution            │
│    • Automatic Rotation                  │
└──────────────┬───────────────────────────┘
               │ Certificates & Keys
               ↓
┌──────────────────────────────────────────┐
│         Service A Pod                     │
│  ┌─────────────┐   ┌──────────────┐     │
│  │ App         │   │ Envoy Proxy  │     │
│  │ Container   │←──│ • Client Cert│     │
│  └─────────────┘   │ • Server Cert│     │
│                    │ • CA Cert    │     │
│                    └──────┬───────┘     │
└───────────────────────────┼─────────────┘
                            │ mTLS
                            ↓
┌──────────────────────────────────────────┐
│         Service B Pod                     │
│  ┌─────────────┐   ┌──────────────┐     │
│  │ Envoy Proxy │───│ App          │     │
│  │ • Validates │   │ Container    │     │
│  │ • Encrypts  │   └──────────────┘     │
│  │ • Decrypts  │                        │
│  └─────────────┘                        │
└──────────────────────────────────────────┘
```

### PeerAuthentication

Defines how services verify peer identities:
- **STRICT**: Only accept mTLS traffic
- **PERMISSIVE**: Accept both mTLS and plaintext (migration mode)
- **DISABLE**: No mTLS (not recommended)

## Tutorial Exercises

### Exercise 1: Verify Auto mTLS

By default, Istio enables auto mTLS when both services have sidecars.

**Deploy Test Services:**
```bash
kubectl apply -f 01-test-services.yaml
```

**Check mTLS Status:**
```bash
# Check if mTLS is being used
istioctl authn tls-check deploy/httpbin -n mtls-test

# Expected output: STRICT or PERMISSIVE
```

**Test Connection:**
```bash
# This should work (auto mTLS)
kubectl exec -n mtls-test deploy/curl-client -- \
  curl -s http://httpbin:8000/headers
```

### Exercise 2: Enable Strict mTLS Globally

**Apply Global Strict mTLS:**
```bash
kubectl apply -f 02-strict-mtls-global.yaml
```

This requires all mesh traffic to use mTLS.

**Verify:**
```bash
# Check policy
kubectl get peerauthentication -A

# Test connection (should still work)
kubectl exec -n mtls-test deploy/curl-client -- \
  curl -s http://httpbin:8000/headers
```

**Test from Non-Mesh Pod:**
```bash
# Deploy pod without sidecar
kubectl apply -f 03-non-mesh-pod.yaml

# This should fail (no mTLS capability)
kubectl exec -n mtls-test plain-pod -- \
  curl -s http://httpbin:8000/headers
```

### Exercise 3: Namespace-Specific mTLS

**Enable Strict mTLS for Specific Namespace:**
```bash
kubectl apply -f 04-namespace-mtls.yaml
```

**Test:**
```bash
# Within namespace: works
kubectl exec -n mtls-test deploy/curl-client -- \
  curl -s http://httpbin:8000/headers

# From different namespace: may fail depending on policy
kubectl exec -n default deploy/curl -- \
  curl -s http://httpbin.mtls-test:8000/headers
```

### Exercise 4: Service-Specific mTLS

**Configure mTLS for Specific Service:**
```bash
kubectl apply -f 05-service-mtls.yaml
```

Override namespace policy for a specific service.

**Test:**
```bash
# Service with STRICT policy
kubectl exec -n mtls-test deploy/curl-client -- \
  curl -s http://httpbin-strict:8000/headers

# Service with PERMISSIVE policy
kubectl exec -n mtls-test deploy/curl-client -- \
  curl -s http://httpbin-permissive:8000/headers
```

### Exercise 5: Port-Specific mTLS

**Configure mTLS for Specific Ports:**
```bash
kubectl apply -f 06-port-specific-mtls.yaml
```

Different policies for different ports:
- Port 8080: STRICT mTLS
- Port 8081: PERMISSIVE (legacy support)

**Test:**
```bash
# STRICT port
kubectl exec -n mtls-test deploy/curl-client -- \
  curl -s http://httpbin:8080/headers

# PERMISSIVE port
kubectl exec -n mtls-test plain-pod -- \
  curl -s http://httpbin:8081/headers
```

### Exercise 6: Migration from Plaintext to mTLS

**Step 1: Start with PERMISSIVE:**
```bash
kubectl apply -f 07-migration-step1-permissive.yaml
```

Both mTLS and plaintext work.

**Step 2: Monitor Traffic:**
```bash
# Check mTLS usage
istioctl proxy-config secret deploy/httpbin -n mtls-test

# Monitor metrics
kubectl exec -n mtls-test deploy/httpbin -c istio-proxy -- \
  curl localhost:15000/stats | grep ssl
```

**Step 3: Switch to STRICT:**
```bash
kubectl apply -f 08-migration-step2-strict.yaml
```

**Step 4: Verify All Traffic Uses mTLS:**
```bash
istioctl authn tls-check deploy/httpbin -n mtls-test
```

### Exercise 7: Certificate Inspection

**View Certificates:**
```bash
# Get certificate details
istioctl proxy-config secret deploy/httpbin -n mtls-test -o json

# Extract certificate
kubectl exec -n mtls-test deploy/httpbin -c istio-proxy -- \
  cat /etc/certs/cert-chain.pem | openssl x509 -text -noout
```

**Verify Certificate Chain:**
```bash
# Check CA certificate
kubectl exec -n mtls-test deploy/httpbin -c istio-proxy -- \
  ls -la /etc/certs/

# Files:
# - cert-chain.pem: Certificate chain
# - key.pem: Private key
# - root-cert.pem: Root CA certificate
```

### Exercise 8: Custom CA Certificate

**Use Custom CA:**
```bash
# Create custom CA certificate
./create-custom-ca.sh

# Install Istio with custom CA
kubectl create secret generic cacerts -n istio-system \
  --from-file=ca-cert.pem \
  --from-file=ca-key.pem \
  --from-file=root-cert.pem \
  --from-file=cert-chain.pem

# Restart istiod to pick up new certificates
kubectl rollout restart deployment/istiod -n istio-system
```

**Verify:**
```bash
# Check certificate issuer
kubectl exec -n mtls-test deploy/httpbin -c istio-proxy -- \
  cat /etc/certs/cert-chain.pem | openssl x509 -text -noout | grep Issuer
```

## Verification

### Check mTLS Status

```bash
# Overall mesh mTLS status
istioctl x describe pod deploy/httpbin -n mtls-test

# Specific service mTLS check
istioctl authn tls-check deploy/curl-client.mtls-test deploy/httpbin.mtls-test

# Expected output shows mTLS mode and status
```

### Monitor mTLS Metrics

```bash
# Prometheus query
kubectl port-forward -n istio-system svc/prometheus 9090:9090

# Queries:
# - istio_requests_total{security_policy="mutual_tls"}
# - istio_tcp_connections_opened_total
```

### Verify Certificate Rotation

```bash
# Check certificate validity
istioctl proxy-config secret deploy/httpbin -n mtls-test -o json | \
  jq -r '.dynamicActiveSecrets[0].secret.tlsCertificate.certificateChain.inlineBytes' | \
  base64 -d | openssl x509 -text -noout

# Default rotation: 24 hours
# Default TTL: 90 days
```

## Troubleshooting

### Connection Refused Errors

```bash
# Check PeerAuthentication policy
kubectl get peerauthentication -A

# Verify both services have sidecars
kubectl get pods -n mtls-test -o wide

# Check mTLS mode
istioctl authn tls-check deploy/curl-client -n mtls-test
```

### Certificate Errors

```bash
# Verify certificates exist
kubectl exec -n mtls-test deploy/httpbin -c istio-proxy -- \
  ls -la /etc/certs/

# Check certificate validity
kubectl exec -n mtls-test deploy/httpbin -c istio-proxy -- \
  cat /etc/certs/cert-chain.pem | openssl x509 -text -noout

# Restart pod to get new certificate
kubectl rollout restart deployment/httpbin -n mtls-test
```

### Mixed mTLS and Plaintext

```bash
# Check policy conflicts
istioctl analyze -n mtls-test

# List all PeerAuthentication policies
kubectl get peerauthentication -A -o yaml

# Check DestinationRule TLS settings
kubectl get destinationrule -A -o yaml
```

### Debugging mTLS

```bash
# Enable debug logging
istioctl proxy-config log deploy/httpbin -n mtls-test --level debug

# Check Envoy configuration
kubectl exec -n mtls-test deploy/httpbin -c istio-proxy -- \
  curl localhost:15000/config_dump | jq '.configs[].dynamic_listeners'

# View secret configuration
istioctl proxy-config secret deploy/httpbin -n mtls-test
```

## Best Practices

1. **Start with PERMISSIVE**: Easier migration
2. **Move to STRICT Gradually**: Namespace by namespace
3. **Monitor Metrics**: Track mTLS adoption
4. **Use Auto mTLS**: Let Istio handle TLS
5. **Rotate Certificates Regularly**: Default 24h is good
6. **Test Thoroughly**: Before enforcing STRICT
7. **Document Exceptions**: If PERMISSIVE is needed
8. **Use Custom CA**: For enterprise PKI integration

## Security Considerations

### Zero-Trust Networking

```yaml
# Deny all by default
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: mtls-test
spec:
  {}

# Allow specific services
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-frontend
spec:
  selector:
    matchLabels:
      app: backend
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/mtls-test/sa/frontend"]
```

### Defense in Depth

- mTLS for encryption in transit
- AuthorizationPolicy for access control
- NetworkPolicy for network segmentation
- PodSecurityPolicy for pod security
- OPA/Gatekeeper for policy enforcement

## Cleanup

```bash
kubectl delete namespace mtls-test
kubectl delete peerauthentication --all -A
```

## Next Steps

- [05_observability](../05_observability/): Monitor mTLS with Kiali and Jaeger
- Implement AuthorizationPolicy with mTLS
- Integrate with external CA (Vault, cert-manager)
- Configure mTLS for ingress gateway

## Resources

- [Istio Security](https://istio.io/latest/docs/concepts/security/)
- [Mutual TLS](https://istio.io/latest/docs/tasks/security/authentication/authn-policy/)
- [Certificate Management](https://istio.io/latest/docs/tasks/security/cert-management/)
- [PKI Best Practices](https://istio.io/latest/docs/ops/best-practices/security/)
