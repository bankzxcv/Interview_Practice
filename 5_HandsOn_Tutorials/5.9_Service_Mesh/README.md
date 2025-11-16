# 5.9 Service Mesh - Hands-On Tutorials

## Overview

Master service mesh technology with the three leading platforms. Learn traffic management, security, observability, and resilience for microservices.

## What is a Service Mesh?

A dedicated infrastructure layer for handling service-to-service communication in microservices architectures.

**Core Features**:
- 🔒 **Security**: mTLS, authentication, authorization
- 🔀 **Traffic Management**: Load balancing, routing, retries, timeouts
- 📊 **Observability**: Metrics, logs, traces
- 🛡️ **Resilience**: Circuit breakers, fault injection, rate limiting

## Service Meshes Covered

### [5.9.1 Istio](./5.9.1_Istio/)
**Most Popular**: Feature-rich, enterprise-grade
- **Tutorial 01**: Installation and setup (istioctl, Helm)
- **Tutorial 02**: Traffic management (VirtualService, DestinationRule)
- **Tutorial 03**: Gateway and ingress
- **Tutorial 04**: Mutual TLS (mTLS)
- **Tutorial 05**: Authorization policies
- **Tutorial 06**: Observability (Kiali, Prometheus, Jaeger)
- **Tutorial 07**: Fault injection and resilience
- **Tutorial 08**: Multi-cluster federation

### [5.9.2 Linkerd](./5.9.2_Linkerd/)
**Lightest**: Simple, fast, Kubernetes-native
- **Tutorial 01**: Installation and auto-injection
- **Tutorial 02**: Traffic splitting and canary deployments
- **Tutorial 03**: Automatic mTLS
- **Tutorial 04**: Traffic policies
- **Tutorial 05**: Observability dashboard
- **Tutorial 06**: Multi-cluster communication
- **Tutorial 07**: Distributed tracing
- **Tutorial 08**: Production best practices

### [5.9.3 Consul](./5.9.3_Consul/)
**Most Flexible**: Multi-platform (K8s, VMs, cloud)
- **Tutorial 01**: Consul setup and service discovery
- **Tutorial 02**: Consul Connect (service mesh)
- **Tutorial 03**: Intentions and security
- **Tutorial 04**: Traffic management
- **Tutorial 05**: Service mesh gateways
- **Tutorial 06**: Multi-datacenter setup
- **Tutorial 07**: Observability and monitoring
- **Tutorial 08**: Vault integration

## Quick Start: Istio

### Installation

```bash
# Install istioctl
brew install istioctl

# Create Kubernetes cluster with kind
kind create cluster --name istio-demo

# Install Istio
istioctl install --set profile=demo -y

# Enable automatic sidecar injection
kubectl label namespace default istio-injection=enabled
```

### Deploy Sample Application

```yaml
# app.yaml
apiVersion: v1
kind: Service
metadata:
  name: hello
  labels:
    app: hello
spec:
  ports:
  - port: 8080
    name: http
  selector:
    app: hello
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-v1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hello
      version: v1
  template:
    metadata:
      labels:
        app: hello
        version: v1
    spec:
      containers:
      - name: hello
        image: hashicorp/http-echo
        args:
        - "-text=Hello from v1"
        ports:
        - containerPort: 8080
```

```bash
# Deploy
kubectl apply -f app.yaml

# Check sidecars injected
kubectl get pods
# Should see 2/2 READY (app + istio-proxy)
```

### Traffic Management

```yaml
# virtual-service.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: hello
spec:
  hosts:
  - hello
  http:
  - route:
    - destination:
        host: hello
        subset: v1
      weight: 90
    - destination:
        host: hello
        subset: v2
      weight: 10
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: hello
spec:
  host: hello
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

## Service Mesh Comparison

| Feature | Istio | Linkerd | Consul |
|---------|-------|---------|--------|
| **Architecture** | Envoy proxy | Custom proxy (Rust) | Envoy proxy |
| **Resource Usage** | High | Low | Medium |
| **Learning Curve** | Steep | Gentle | Medium |
| **Features** | Most complete | Essential only | Flexible |
| **Platform** | Kubernetes | Kubernetes | Multi-platform |
| **Protocol** | HTTP, gRPC, TCP | HTTP, gRPC, TCP | HTTP, gRPC, TCP |
| **Observability** | Excellent | Good | Good |
| **Multi-cluster** | ✅ | ✅ | ✅ |
| **Community** | Largest | Growing | Established |
| **Best For** | Enterprises | Simplicity | Hybrid cloud |

## Core Concepts

### 1. Sidecar Pattern

```
[Pod]
├── Application Container
└── Proxy Sidecar (Envoy/Linkerd)
    ├── Intercepts all traffic
    ├── Applies policies
    └── Collects metrics
```

### 2. Control Plane vs Data Plane

**Control Plane**: Management layer (Istiod, Linkerd controller)
- Service discovery
- Configuration distribution
- Certificate management

**Data Plane**: Traffic layer (Envoy proxies, Linkerd proxies)
- Request routing
- Load balancing
- Health checks
- Telemetry collection

### 3. Traffic Management Hierarchy

```
Gateway (Ingress)
  ↓
VirtualService (Routing rules)
  ↓
DestinationRule (Load balancing, subsets)
  ↓
Service
  ↓
Pods
```

## Common Patterns

### 1. Canary Deployment

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
  - reviews
  http:
  - match:
    - headers:
        user-agent:
          regex: ".*Chrome.*"
    route:
    - destination:
        host: reviews
        subset: v2
  - route:
    - destination:
        host: reviews
        subset: v1
      weight: 95
    - destination:
        host: reviews
        subset: v2
      weight: 5
```

### 2. Circuit Breaker

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: backend
spec:
  host: backend
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

### 3. Retry Logic

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: api
spec:
  hosts:
  - api
  http:
  - route:
    - destination:
        host: api
    retries:
      attempts: 3
      perTryTimeout: 2s
      retryOn: 5xx,reset,connect-failure,refused-stream
```

### 4. Timeout

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: slow-service
spec:
  hosts:
  - slow-service
  http:
  - route:
    - destination:
        host: slow-service
    timeout: 3s
```

### 5. Rate Limiting

```yaml
apiVersion: networking.istio.io/v1beta1
kind: EnvoyFilter
metadata:
  name: filter-ratelimit
spec:
  workloadSelector:
    labels:
      app: api
  configPatches:
  - applyTo: HTTP_FILTER
    match:
      context: SIDECAR_INBOUND
    patch:
      operation: INSERT_BEFORE
      value:
        name: envoy.filters.http.ratelimit
        typed_config:
          "@type": type.googleapis.com/udpa.type.v1.TypedStruct
          type_url: type.googleapis.com/envoy.extensions.filters.http.ratelimit.v3.RateLimit
```

### 6. mTLS Enforcement

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT
```

### 7. Authorization Policy

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: frontend-policy
spec:
  selector:
    matchLabels:
      app: frontend
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/api-gateway"]
    to:
    - operation:
        methods: ["GET", "POST"]
```

## Best Practices Covered

### Security
- ✅ Automatic mTLS between services
- ✅ Fine-grained authorization policies
- ✅ Certificate rotation
- ✅ Workload identity
- ✅ Zero-trust networking

### Traffic Management
- ✅ Progressive deployments (canary, blue-green)
- ✅ A/B testing
- ✅ Traffic mirroring
- ✅ Fault injection for testing
- ✅ Request routing by headers

### Resilience
- ✅ Automatic retries
- ✅ Circuit breakers
- ✅ Timeouts
- ✅ Rate limiting
- ✅ Bulkheading

### Observability
- ✅ Distributed tracing
- ✅ Service-to-service metrics
- ✅ Access logging
- ✅ Service graph visualization
- ✅ SLO monitoring

## Prerequisites

```bash
# Kubernetes cluster (kind/k3s/minikube)
kind create cluster --name service-mesh

# kubectl
brew install kubectl

# Service mesh CLI tools
brew install istioctl          # Istio
brew install linkerd           # Linkerd
brew install consul            # Consul

# Optional: Observability tools
brew install k9s              # Kubernetes TUI
```

## Recommended Study Path

### Week 1: Istio Fundamentals
- Days 1-2: Installation and basic traffic management
- Days 3-4: Security (mTLS, authorization)
- Day 5: Observability
- Weekend: Build a multi-service app

### Week 2: Istio Advanced
- Days 1-2: Resilience patterns
- Days 3-4: Advanced routing
- Day 5: Multi-cluster
- Weekend: Review and practice

### Week 3: Linkerd
- Days 1-3: Complete all Linkerd tutorials
- Days 4-5: Compare with Istio
- Weekend: Choose for use cases

### Week 4: Consul
- Days 1-3: Complete Consul tutorials
- Days 4-5: Multi-platform exploration
- Weekend: Build comparison matrix

## What You'll Master

After completing all tutorials:
- ✅ Deploy and configure service meshes
- ✅ Implement progressive deployments
- ✅ Secure microservices with mTLS
- ✅ Apply fine-grained authorization
- ✅ Implement resilience patterns
- ✅ Monitor service-to-service communication
- ✅ Troubleshoot mesh issues
- ✅ Choose the right mesh for your needs
- ✅ Deploy multi-cluster meshes
- ✅ Integrate with CI/CD

## Common Issues & Solutions

**High resource usage**
- Use resource limits on sidecars
- Consider Linkerd for lighter footprint
- Profile and optimize

**Complex debugging**
- Use `istioctl analyze` for Istio
- Enable debug logging selectively
- Use service mesh dashboards (Kiali)

**Breaking changes on upgrade**
- Use canary upgrades for control plane
- Test in staging first
- Follow upgrade guides carefully

## Additional Resources

- [Istio Documentation](https://istio.io/latest/docs/)
- [Linkerd Documentation](https://linkerd.io/2/overview/)
- [Consul Documentation](https://www.consul.io/docs)
- [Service Mesh Comparison](https://servicemesh.es/)
- [Envoy Proxy](https://www.envoyproxy.io/)

## Next Steps

1. Start with Linkerd (easiest to learn)
2. Move to Istio (most features)
3. Explore Consul (multi-platform)
4. Apply to production microservices
5. Contribute to open source

---

**Total Tutorials**: 24 (3 meshes × 8 tutorials)
**Estimated Time**: 40-60 hours
**Difficulty**: Advanced
**Cost**: Free (runs locally on Kubernetes)
