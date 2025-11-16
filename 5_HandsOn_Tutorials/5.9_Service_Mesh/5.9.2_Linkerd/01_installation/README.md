# Linkerd Tutorial 01: Installation

## Overview

Install Linkerd, the lightweight and simple service mesh for Kubernetes. Learn to deploy Linkerd's control plane, enable automatic proxy injection, and verify the installation.

## Learning Objectives

- Understand Linkerd architecture
- Install Linkerd CLI
- Deploy Linkerd control plane
- Enable automatic proxy injection
- Verify installation and health
- Deploy sample applications
- Compare with Istio

## Why Linkerd?

**Advantages:**
- **Ultra-lightweight**: Minimal resource overhead
- **Simple**: Easy to install and operate
- **Fast**: Rust-based proxy (Linkerd2-proxy)
- **Secure**: Automatic mTLS by default
- **Observable**: Built-in dashboard and metrics
- **Kubernetes-native**: Designed specifically for K8s

## Architecture

```
┌────────────────────────────────────────┐
│      Linkerd Control Plane              │
│  ┌──────────────────────────────────┐  │
│  │  linkerd-destination             │  │
│  │  (Service discovery, routing)    │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  linkerd-identity                │  │
│  │  (Certificate authority)         │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  linkerd-proxy-injector          │  │
│  │  (Automatic sidecar injection)   │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│         Data Plane                      │
│  ┌────────┐        ┌────────┐         │
│  │  Pod   │        │  Pod   │         │
│  │ ┌────┐ │        │ ┌────┐ │         │
│  │ │App │ │        │ │App │ │         │
│  │ └────┘ │        │ └────┘ │         │
│  │ ┌────┐ │        │ ┌────┐ │         │
│  │ │Proxy│ │        │ │Proxy│ │         │
│  │ └────┘ │        │ └────┘ │         │
│  └────────┘        └────────┘         │
└────────────────────────────────────────┘
```

## Installation Steps

### Step 1: Install Linkerd CLI

**MacOS:**
```bash
brew install linkerd
```

**Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSfL https://run.linkerd.io/install | sh
export PATH=$PATH:$HOME/.linkerd2/bin
```

**Verify:**
```bash
linkerd version
# Expected: Client version only (control plane not yet installed)
```

### Step 2: Pre-Installation Check

```bash
# Validate Kubernetes cluster
linkerd check --pre

# Expected output:
# ✔ can initialize the client
# ✔ can query the Kubernetes API
# ✔ is running the minimum Kubernetes API version
# ✔ can query the control plane API
```

If any checks fail, fix issues before proceeding.

### Step 3: Install Control Plane

**Generate Installation Manifest:**
```bash
linkerd install --crds | kubectl apply -f -
linkerd install | kubectl apply -f -
```

**Or use Helm:**
```bash
# Add Linkerd Helm repo
helm repo add linkerd https://helm.linkerd.io/stable
helm repo update

# Install CRDs
helm install linkerd-crds linkerd/linkerd-crds -n linkerd --create-namespace

# Install control plane
helm install linkerd-control-plane linkerd/linkerd-control-plane \
  -n linkerd \
  --set-file identityTrustAnchorsPEM=ca.crt \
  --set-file identity.issuer.tls.crtPEM=issuer.crt \
  --set-file identity.issuer.tls.keyPEM=issuer.key
```

**Wait for Installation:**
```bash
kubectl wait --for=condition=ready pod --all -n linkerd --timeout=300s
```

### Step 4: Verify Installation

```bash
# Run comprehensive check
linkerd check

# Expected output: All checks passing ✔
```

### Step 5: Install Linkerd Viz (Observability)

```bash
linkerd viz install | kubectl apply -f -

# Verify
linkerd check --proxy
```

### Step 6: Access Dashboard

```bash
# Open Linkerd dashboard
linkerd viz dashboard

# Opens browser at http://localhost:50750
```

## Enable Automatic Injection

### Method 1: Namespace Annotation (Recommended)

```bash
# Label namespace for auto-injection
kubectl annotate namespace default linkerd.io/inject=enabled

# Verify annotation
kubectl get namespace default -o yaml | grep linkerd
```

### Method 2: Pod Annotation

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    linkerd.io/inject: enabled
spec:
  containers:
    - name: myapp
      image: myapp:latest
```

### Method 3: Manual Injection

```bash
# Inject proxy into manifest
kubectl get deployment myapp -o yaml | linkerd inject - | kubectl apply -f -
```

## Deploy Sample Application

### Emojivoto Demo App

```bash
# Install sample app
curl --proto '=https' --tlsv1.2 -sSfL https://run.linkerd.io/emojivoto.yml | kubectl apply -f -

# Add Linkerd proxy
kubectl get -n emojivoto deploy -o yaml | linkerd inject - | kubectl apply -f -

# Verify proxies injected
kubectl get pods -n emojivoto

# Expected: 2/2 containers (app + linkerd-proxy)
```

### Access Application

```bash
# Port-forward to app
kubectl port-forward -n emojivoto svc/web-svc 8080:80

# Open browser: http://localhost:8080
```

### View in Dashboard

```bash
linkerd viz dashboard
# Navigate to emojivoto namespace
```

## Verification Steps

### 1. Check Control Plane

```bash
# All control plane pods
kubectl get pods -n linkerd

# Should see:
# - linkerd-destination
# - linkerd-identity
# - linkerd-proxy-injector
```

### 2. Check Data Plane

```bash
# Check meshed pods
linkerd viz stat deployments -n emojivoto

# Shows success rate, RPS, and latency
```

### 3. Verify mTLS

```bash
# Check mTLS status
linkerd viz edges deployment -n emojivoto

# Should show secured connections
```

### 4. Test Service Communication

```bash
# Tap live traffic
linkerd viz tap deployment/web -n emojivoto

# Shows real-time requests
```

## Configuration Files

### Sample Deployment with Linkerd

See `sample-app.yaml` for complete example.

## Troubleshooting

### Pods Not Getting Proxies

```bash
# Check namespace annotation
kubectl get namespace default -o yaml | grep linkerd

# If missing, add it
kubectl annotate namespace default linkerd.io/inject=enabled

# Restart pods
kubectl rollout restart deployment -n default
```

### Control Plane Issues

```bash
# Check logs
kubectl logs -n linkerd deploy/linkerd-destination
kubectl logs -n linkerd deploy/linkerd-identity

# Re-run check
linkerd check
```

### Dashboard Not Accessible

```bash
# Verify viz components
kubectl get pods -n linkerd-viz

# Restart viz
linkerd viz install | kubectl apply -f -
```

## Linkerd vs Istio

| Feature | Linkerd | Istio |
|---------|---------|-------|
| **Complexity** | Simple | Complex |
| **Resource Usage** | 10-20MB per proxy | 50-100MB per proxy |
| **Installation** | < 1 minute | 5-10 minutes |
| **Learning Curve** | Easy | Steep |
| **Proxy** | Rust (custom) | Envoy (C++) |
| **Auto mTLS** | Yes, default | Yes, configurable |
| **Traffic Split** | Basic | Advanced |
| **Multi-cluster** | Yes | Yes |
| **Protocols** | HTTP, gRPC, TCP | HTTP, gRPC, TCP, MongoDB |
| **Best For** | Simplicity | Feature richness |

## Best Practices

1. **Use Auto-Injection**: Simpler than manual
2. **Monitor Resource Usage**: Linkerd is lightweight
3. **Enable mTLS**: It's automatic!
4. **Start Small**: Add mesh to one namespace first
5. **Use Viz Dashboard**: Great for troubleshooting
6. **Update Regularly**: Linkerd releases frequently
7. **Test Before Prod**: Always validate in staging

## Cleanup

```bash
# Remove sample app
kubectl delete namespace emojivoto

# Uninstall Linkerd
linkerd viz uninstall | kubectl delete -f -
linkerd uninstall | kubectl delete -f -
```

## Next Steps

- [02_traffic_management](../02_traffic_management/): Traffic splitting and routing
- Explore Linkerd dashboard features
- Configure service profiles
- Implement retries and timeouts

## Resources

- [Linkerd Documentation](https://linkerd.io/2/overview/)
- [Getting Started Guide](https://linkerd.io/2/getting-started/)
- [Architecture](https://linkerd.io/2/reference/architecture/)
- [Linkerd vs Istio](https://linkerd.io/2021/05/27/linkerd-vs-istio/)
