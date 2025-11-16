# Consul Tutorial 03: Consul Connect

## Overview

Enable Consul Connect for service mesh capabilities including automatic mTLS, service-to-service authorization, and traffic management.

## Learning Objectives

- Enable Consul Connect
- Configure Connect-enabled services
- Understand Connect proxies (Envoy)
- Implement upstream services
- Configure Connect intentions
- Monitor Connect traffic

## Enabling Connect

**Via Helm Values:**
```yaml
global:
  name: consul
  connectInject:
    enabled: true
    default: true  # Auto-inject all pods
```

**Per-Service Injection:**
```yaml
annotations:
  "consul.hashicorp.com/connect-inject": "true"
  "consul.hashicorp.com/connect-service-upstreams": "backend:8080"
```

## Connect Architecture

```
┌─────────────────────────────────────┐
│      Frontend Pod                    │
│  ┌─────────────────────────────────┐│
│  │  Frontend App                   ││
│  │  Connects to: localhost:8080    ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │  Envoy Sidecar                  ││
│  │  • Intercepts traffic           ││
│  │  • Enforces mTLS                ││
│  │  • Applies intentions           ││
│  │  • Connects to backend          ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
              ↓ mTLS
┌─────────────────────────────────────┐
│      Backend Pod                     │
│  ┌─────────────────────────────────┐│
│  │  Envoy Sidecar                  ││
│  │  • Terminates mTLS              ││
│  │  • Validates identity           ││
│  │  • Forwards to app              ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │  Backend App                    ││
│  │  Receives on: localhost:8080    ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Connect-Enabled Services

**Deploy with Connect:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend
  ports:
    - port: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  template:
    metadata:
      annotations:
        "consul.hashicorp.com/connect-inject": "true"
    spec:
      containers:
        - name: backend
          image: hashicorp/http-echo
          args: ["-text=Backend", "-listen=:8080"]
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  template:
    metadata:
      annotations:
        "consul.hashicorp.com/connect-inject": "true"
        "consul.hashicorp.com/connect-service-upstreams": "backend:8080"
    spec:
      containers:
        - name: frontend
          image: curlimages/curl
          command: ["sh", "-c", "while true; do curl http://localhost:8080; sleep 5; done"]
```

**Test Connect:**
```bash
kubectl apply -f connect-demo.yaml

# Frontend connects to backend via localhost:8080
# Envoy handles mTLS and routing
kubectl logs -f deploy/frontend -c frontend
```

## Verify Connect

```bash
# Check Connect status
kubectl exec -n consul consul-server-0 -- consul catalog services

# View Connect-enabled services
kubectl get pods -o yaml | grep consul.hashicorp.com/connect-inject

# Check Envoy sidecar
kubectl exec deploy/backend -c consul-connect-envoy-sidecar -- \
  curl localhost:19000/stats
```

## Best Practices

1. **Use Envoy Proxy**: Default and most feature-rich
2. **Configure Upstreams**: Explicit dependencies
3. **Enable Intentions**: Control service communication
4. **Monitor Envoy Metrics**: Track proxy health
5. **Test mTLS**: Verify encryption

## Next Steps

- [04_intentions](../04_intentions/): Configure service intentions
- Implement transparent proxy
- Configure Connect gateways
- Add custom Envoy configuration
