# Consul Tutorial 01: Installation

## Overview

Install HashiCorp Consul on Kubernetes for service discovery and service mesh capabilities. Learn to deploy Consul servers, agents, and configure basic service registration.

## Learning Objectives

- Understand Consul architecture
- Install Consul on Kubernetes using Helm
- Configure Consul servers and clients
- Register services with Consul
- Use Consul DNS and HTTP API
- Access Consul UI
- Verify installation

## Consul Architecture

```
┌────────────────────────────────────────────┐
│         Consul Control Plane                │
│  ┌──────────────────────────────────────┐  │
│  │  Consul Servers (3+ for HA)          │  │
│  │  • Service Catalog                    │  │
│  │  • Health Checks                      │  │
│  │  • KV Store                           │  │
│  │  • ACL Management                     │  │
│  └──────────────────────────────────────┘  │
└────────────────┬───────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────┐
│         Consul Client Agents                │
│  (DaemonSet on each K8s node)              │
│  • Local service discovery                  │
│  • Health checking                          │
│  • Service registration                     │
└────────────────┬───────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────┐
│         Application Pods                    │
│  ┌──────────────────────────────────────┐  │
│  │  App Container                        │  │
│  │  + Consul Connect Sidecar (Envoy)    │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

## Prerequisites

- Kubernetes cluster
- Helm 3.x
- kubectl configured
- At least 3GB RAM available

## Installation Methods

### Method 1: Helm (Recommended)

**Step 1: Add Consul Helm Repository:**
```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update
```

**Step 2: Create Values File:**
```bash
cat > consul-values.yaml <<EOF
global:
  name: consul
  datacenter: dc1

  # Enable Consul Connect (service mesh)
  connectInject:
    enabled: true
    default: false  # Don't inject by default

# Consul servers
server:
  replicas: 3
  bootstrapExpect: 3
  storage: 10Gi
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"

# Consul client agents
client:
  enabled: true
  grpc: true
  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "256Mi"
      cpu: "500m"

# Consul UI
ui:
  enabled: true
  service:
    type: LoadBalancer  # or ClusterIP with port-forward

# DNS
dns:
  enabled: true
EOF
```

**Step 3: Install Consul:**
```bash
helm install consul hashicorp/consul \
  --create-namespace \
  --namespace consul \
  --values consul-values.yaml

# Wait for installation
kubectl wait --for=condition=ready pod \
  --all \
  --namespace=consul \
  --timeout=300s
```

### Method 2: Consul K8s CLI

```bash
# Install consul-k8s CLI
brew install consul-k8s

# Install Consul
consul-k8s install \
  -set global.name=consul \
  -set server.replicas=3 \
  -set connectInject.enabled=true
```

## Verify Installation

**Check Pods:**
```bash
kubectl get pods -n consul

# Expected:
# - consul-server-0, consul-server-1, consul-server-2
# - consul-client-xxxxx (DaemonSet on each node)
# - consul-connect-injector
# - consul-controller
# - consul-webhook-cert-manager
```

**Check Consul Cluster:**
```bash
# Get a shell in consul server
kubectl exec -n consul consul-server-0 -- consul members

# Should show all servers and clients
```

**Access Consul UI:**
```bash
# Port-forward to UI
kubectl port-forward -n consul svc/consul-ui 8500:80

# Open browser: http://localhost:8500
```

## Service Discovery

### Automatic Service Registration

**Deploy Application with Consul Injection:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - port: 8080
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
      annotations:
        "consul.hashicorp.com/connect-inject": "true"
    spec:
      containers:
        - name: web
          image: hashicorp/http-echo
          args:
            - "-text=Hello from Consul"
            - "-listen=:8080"
          ports:
            - containerPort: 8080
```

**Apply:**
```bash
kubectl apply -f web-service.yaml

# Check sidecars injected (2/2 containers)
kubectl get pods
```

### Query Services via DNS

```bash
# Deploy test pod
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- sh

# Inside pod - Query via Consul DNS
# Format: <service>.service.<datacenter>.consul
nslookup web.service.dc1.consul
curl http://web.service.dc1.consul:8080
```

### Query Services via HTTP API

```bash
# Port-forward Consul API
kubectl port-forward -n consul svc/consul-server 8500:8500

# List all services
curl http://localhost:8500/v1/catalog/services | jq

# Get service details
curl http://localhost:8500/v1/catalog/service/web | jq

# Health check
curl http://localhost:8500/v1/health/service/web | jq
```

## Consul CLI Usage

**Install Consul CLI:**
```bash
brew install consul
```

**Configure Environment:**
```bash
export CONSUL_HTTP_ADDR=localhost:8500

# Or with ACLs enabled
export CONSUL_HTTP_TOKEN=<your-token>
```

**Common Commands:**
```bash
# List services
consul catalog services

# Service details
consul catalog nodes -service=web

# KV store
consul kv put myapp/config/debug true
consul kv get myapp/config/debug

# Health checks
consul watch -type=service -service=web
```

## Configuration Files

All configuration files are in this directory:
- `consul-values.yaml` - Helm values
- `web-service.yaml` - Sample application
- `verify.sh` - Verification script

## Troubleshooting

### Pods Not Starting

```bash
# Check logs
kubectl logs -n consul consul-server-0

# Check PVC (if using persistent storage)
kubectl get pvc -n consul

# Describe pods
kubectl describe pod -n consul consul-server-0
```

### Sidecar Not Injected

```bash
# Check annotation
kubectl get pod <pod-name> -o yaml | grep consul.hashicorp.com

# Verify connect-injector running
kubectl get pods -n consul -l app=consul-connect-injector

# Check webhook
kubectl get mutatingwebhookconfiguration | grep consul
```

### Service Not Registered

```bash
# Check Consul catalog
kubectl exec -n consul consul-server-0 -- consul catalog services

# Check pod annotations
kubectl describe pod <pod-name> | grep -A 10 Annotations

# View sidecar logs
kubectl logs <pod-name> -c consul-connect-envoy-sidecar
```

## Best Practices

1. **Run 3+ Servers**: For high availability
2. **Use Persistent Storage**: For servers
3. **Enable ACLs**: In production
4. **Resource Limits**: Set on all components
5. **Monitor Health**: Use health checks
6. **Backup Regularly**: Consul state and config
7. **Use DNS**: For service discovery
8. **Enable TLS**: For security

## Consul vs Other Service Meshes

| Feature | Consul | Istio | Linkerd |
|---------|--------|-------|---------|
| **Complexity** | Medium | High | Low |
| **Installation** | Medium | Complex | Easy |
| **Multi-Platform** | Yes (K8s + VMs) | K8s only | K8s only |
| **Service Discovery** | Excellent | Good | Good |
| **Multi-DC** | Excellent | Good | Good |
| **HashiCorp Integration** | Native | None | None |

## Cleanup

```bash
# Uninstall Consul
helm uninstall consul -n consul

# Delete namespace
kubectl delete namespace consul

# Delete CRDs
kubectl delete crd $(kubectl get crd | grep consul | awk '{print $1}')
```

## Next Steps

- [02_service_discovery](../02_service_discovery/): Advanced service discovery
- Configure health checks
- Explore Consul KV store
- Set up service intentions

## Resources

- [Consul Documentation](https://www.consul.io/docs)
- [Consul on Kubernetes](https://www.consul.io/docs/k8s)
- [Helm Chart Values](https://www.consul.io/docs/k8s/helm)
- [Service Discovery Guide](https://learn.hashicorp.com/tutorials/consul/get-started-service-discovery)
