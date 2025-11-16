# Istio Tutorial 01: Installation

## Overview

Learn how to install Istio on Kubernetes using multiple methods: `istioctl`, Helm, and the Istio Operator. This tutorial covers installation profiles, customization, and verification.

## Learning Objectives

- Understand Istio architecture and components
- Install Istio using different methods
- Configure installation profiles
- Enable automatic sidecar injection
- Verify Istio installation
- Troubleshoot common installation issues

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- At least 4GB RAM available
- Helm 3.x (for Helm installation)
- curl or wget

## Istio Architecture

```
┌─────────────────────────────────────────┐
│         Control Plane (istiod)          │
│  ┌──────────┬──────────┬──────────────┐ │
│  │  Pilot   │  Citadel │  Galley      │ │
│  │(Traffic) │(Security)│(Config)      │ │
│  └──────────┴──────────┴──────────────┘ │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Data Plane (Envoy)             │
│  ┌────────────┐      ┌────────────┐    │
│  │   Pod      │      │   Pod      │    │
│  │ ┌────────┐ │      │ ┌────────┐ │    │
│  │ │  App   │ │      │ │  App   │ │    │
│  │ └────────┘ │      │ └────────┘ │    │
│  │ ┌────────┐ │      │ ┌────────┐ │    │
│  │ │ Envoy  │ │      │ │ Envoy  │ │    │
│  │ │ Proxy  │ │      │ │ Proxy  │ │    │
│  │ └────────┘ │      │ └────────┘ │    │
│  └────────────┘      └────────────┘    │
└─────────────────────────────────────────┘
```

## Installation Methods

### Method 1: istioctl (Recommended)

**Step 1: Download istioctl**

```bash
# Download latest Istio
curl -L https://istio.io/downloadIstio | sh -

# Move to Istio directory
cd istio-*

# Add istioctl to PATH
export PATH=$PWD/bin:$PATH

# Verify installation
istioctl version
```

**Step 2: Install Istio**

```bash
# Install with demo profile (for learning)
istioctl install --set profile=demo -y

# For production, use default profile
istioctl install --set profile=default -y
```

**Available Profiles:**
- `default`: Production, minimal resources
- `demo`: Full features, higher resources
- `minimal`: Just control plane
- `remote`: Remote cluster in multi-cluster setup
- `empty`: Base for customization
- `preview`: Experimental features

### Method 2: Helm

**Step 1: Add Istio Helm Repository**

```bash
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update
```

**Step 2: Create Namespace**

```bash
kubectl create namespace istio-system
```

**Step 3: Install Istio Base**

```bash
helm install istio-base istio/base -n istio-system
```

**Step 4: Install Istio Discovery (istiod)**

```bash
helm install istiod istio/istiod -n istio-system --wait
```

**Step 5: Install Istio Ingress Gateway (Optional)**

```bash
kubectl create namespace istio-ingress
kubectl label namespace istio-ingress istio-injection=enabled

helm install istio-ingress istio/gateway \
  -n istio-ingress \
  --wait
```

### Method 3: Istio Operator

```bash
# Install Istio operator
istioctl operator init

# Create IstioOperator resource
kubectl apply -f - <<EOF
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  namespace: istio-system
  name: istio-controlplane
spec:
  profile: demo
  meshConfig:
    accessLogFile: /dev/stdout
EOF
```

## Installation Configurations

### Custom Installation with istioctl

See `custom-install.yaml` for advanced configuration.

```bash
# Install with custom config
istioctl install -f custom-install.yaml
```

### Resource Requirements

**Minimum (Demo Profile):**
- CPU: 2 cores
- Memory: 4GB
- Nodes: 1

**Production (Default Profile):**
- CPU: 4 cores
- Memory: 8GB
- Nodes: 3+

## Enable Sidecar Injection

### Automatic Injection (Recommended)

```bash
# Label namespace for automatic injection
kubectl label namespace default istio-injection=enabled

# Verify label
kubectl get namespace -L istio-injection

# All new pods in this namespace will get sidecars
```

### Manual Injection

```bash
# Inject sidecar into deployment manifest
istioctl kube-inject -f app.yaml | kubectl apply -f -
```

## Verification Steps

### 1. Check Control Plane

```bash
# Check istio-system namespace
kubectl get pods -n istio-system

# Expected output:
# NAME                                    READY   STATUS
# istiod-xxxxx                           1/1     Running
# istio-ingressgateway-xxxxx             1/1     Running
# istio-egressgateway-xxxxx              1/1     Running
```

### 2. Verify Installation

```bash
# Analyze installation
istioctl analyze

# Check version
istioctl version

# Verify configuration
istioctl verify-install
```

### 3. Deploy Test Application

```bash
# Deploy sample app
kubectl apply -f sample-app.yaml

# Check sidecar injection
kubectl get pods
# Should show 2/2 READY (app + istio-proxy)

# Describe pod to see sidecar
kubectl describe pod <pod-name>
```

## Configuration Files

All configuration files are in this directory.

## Troubleshooting

### Issue: Pods Not Getting Sidecars

```bash
# Check namespace label
kubectl get namespace default -o yaml | grep istio-injection

# If missing, add label
kubectl label namespace default istio-injection=enabled

# Delete and recreate pods
kubectl delete pod --all
```

### Issue: Control Plane Not Running

```bash
# Check logs
kubectl logs -n istio-system -l app=istiod

# Check resources
kubectl describe pod -n istio-system -l app=istiod

# Reinstall if necessary
istioctl uninstall --purge -y
istioctl install --set profile=demo -y
```

### Issue: High Resource Usage

```bash
# Switch to minimal profile
istioctl install --set profile=minimal -y

# Or set resource limits
kubectl set resources deployment/istiod -n istio-system \
  --limits=cpu=500m,memory=1Gi \
  --requests=cpu=250m,memory=512Mi
```

### Debug Commands

```bash
# Get proxy configuration
istioctl proxy-config cluster <pod-name>

# Get proxy status
istioctl proxy-status

# Enable debug logging
istioctl proxy-config log <pod-name> --level debug

# Analyze mesh
istioctl analyze -A
```

## Uninstallation

```bash
# Remove Istio
istioctl uninstall --purge -y

# Remove namespace labels
kubectl label namespace default istio-injection-

# Delete CRDs (optional)
kubectl delete crd $(kubectl get crd | grep istio.io | awk '{print $1}')
```

## Best Practices

1. **Use istioctl for Production**: More control and validation
2. **Start with Default Profile**: Demo profile uses too many resources
3. **Enable Auto-Injection**: Easier than manual injection
4. **Monitor Resources**: Istio adds significant overhead
5. **Version Compatibility**: Match Istio version with Kubernetes version
6. **Test Before Production**: Always test in staging environment
7. **Use Namespaces**: Separate mesh-enabled and non-mesh workloads

## Next Steps

- [02_traffic_management](../02_traffic_management/): Learn VirtualServices and DestinationRules
- Deploy a multi-service application
- Explore Istio observability tools
- Configure ingress gateway

## Resources

- [Istio Installation Guide](https://istio.io/latest/docs/setup/install/)
- [Installation Profiles](https://istio.io/latest/docs/setup/additional-setup/config-profiles/)
- [Sidecar Injection](https://istio.io/latest/docs/setup/additional-setup/sidecar-injection/)
