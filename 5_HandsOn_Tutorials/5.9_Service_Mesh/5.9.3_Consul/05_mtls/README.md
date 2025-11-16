# Consul Tutorial 05: Automatic mTLS

## Overview

Learn how Consul Connect provides automatic mutual TLS for service-to-service communication with built-in certificate management and rotation.

## Learning Objectives

- Understand Consul Connect mTLS
- Configure automatic certificate rotation
- Inspect certificates
- Configure custom CA
- Verify mTLS enforcement
- Troubleshoot certificate issues

## Consul Connect mTLS

**Automatic Features:**
- Certificate issuance for each service
- Automatic certificate rotation
- Service identity based on ServiceAccount
- Zero-configuration mTLS

## Architecture

```
┌────────────────────────────────────┐
│  Consul Server (Built-in CA)       │
│  • Generates root certificate      │
│  • Issues service certificates     │
│  • Rotates certificates (TTL)      │
└──────────────┬─────────────────────┘
               │ Issues certificates
               ↓
┌────────────────────────────────────┐
│  Service Pod with Connect          │
│  ┌──────────────────────────────┐  │
│  │  Envoy Sidecar               │  │
│  │  • Client cert (identity)    │  │
│  │  • Server cert (listening)   │  │
│  │  • CA cert (validation)      │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

## Enable mTLS

**Via Helm (enabled by default with Connect):**
```yaml
global:
  name: consul
  tls:
    enabled: true
  connectInject:
    enabled: true
    default: true
```

**Verify mTLS:**
```bash
# Deploy Connect-enabled service
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  template:
    metadata:
      annotations:
        "consul.hashicorp.com/connect-inject": "true"
    spec:
      containers:
        - name: web
          image: hashicorp/http-echo
          args: ["-text=Hello", "-listen=:8080"]
EOF

# Check mTLS in effect
kubectl exec deploy/web -c consul-connect-envoy-sidecar -- \
  curl -s localhost:19000/config_dump | grep -i tls
```

## Certificate Inspection

**View Certificates:**
```bash
# Get certificate from Envoy
kubectl exec deploy/web -c consul-connect-envoy-sidecar -- \
  curl -s localhost:19000/certs | jq

# Shows:
# - Certificate chain
# - Expiration
# - Subject (service identity)
```

**Certificate Format:**
```
Subject: CN=<service-name>
SAN: spiffe://dc1.consul/ns/default/dc/dc1/svc/<service-name>
```

## Certificate Rotation

**Automatic Rotation:**
- Default TTL: 72 hours
- Auto-rotation at 50% TTL (36 hours)
- Zero-downtime rotation

**Configure TTL:**
```yaml
global:
  connectInject:
    enabled: true
  tls:
    enabled: true
    ttl: "24h"  # Shorter rotation period
```

**Monitor Rotation:**
```bash
# Watch certificate changes
kubectl exec -n consul consul-server-0 -- \
  consul monitor -log-level=debug | grep -i cert
```

## Custom CA

**Use External CA (Vault):**
```yaml
global:
  secretsBackend:
    vault:
      enabled: true
      connectCA:
        address: "https://vault:8200"
        rootPKIPath: "connect-root"
        intermediatePKIPath: "connect-intermediate"
```

**Or provide custom certificates:**
```bash
# Generate custom CA
consul tls ca create

# Update Consul with custom CA
kubectl create secret generic consul-ca \
  -n consul \
  --from-file=tls.crt=consul-agent-ca.pem \
  --from-file=tls.key=consul-agent-ca-key.pem
```

## Verify mTLS Enforcement

**Test Encrypted Communication:**
```bash
# Deploy two services
kubectl apply -f web-service.yaml
kubectl apply -f api-service.yaml

# Check connection uses mTLS
kubectl exec deploy/web -c consul-connect-envoy-sidecar -- \
  curl -s localhost:19000/stats | grep ssl

# Should show:
# - ssl.handshake
# - ssl.connection_error (should be 0)
```

**View mTLS Metrics:**
```bash
# Envoy metrics
kubectl exec deploy/web -c consul-connect-envoy-sidecar -- \
  curl -s localhost:19000/stats | grep -E "ssl|tls"
```

## Best Practices

1. **Use Built-in CA**: Simplest for most cases
2. **Vault for Production**: Enterprise-grade PKI
3. **Monitor Certificate Expiry**: Set alerts
4. **Short TTL**: Better security, more rotation
5. **Test Rotation**: Ensure zero-downtime
6. **Backup CA Keys**: Critical for recovery

## Troubleshooting

**Certificate Not Issued:**
```bash
# Check Connect CA status
kubectl exec -n consul consul-server-0 -- consul operator autopilot get-config

# View CA configuration
kubectl exec -n consul consul-server-0 -- \
  consul connect ca get-config
```

**TLS Handshake Failures:**
```bash
# Check Envoy logs
kubectl logs deploy/web -c consul-connect-envoy-sidecar | grep -i tls

# Common issues:
# - Expired certificates
# - CA mismatch
# - Clock skew
```

**Certificate Rotation Failed:**
```bash
# Force certificate refresh
kubectl rollout restart deployment/web

# Check Consul logs
kubectl logs -n consul consul-server-0 | grep -i cert
```

## Next Steps

- [06_observability](../06_observability/): Monitor Consul mesh
- Integrate with Vault
- Configure certificate monitoring
- Implement cert rotation alerts
