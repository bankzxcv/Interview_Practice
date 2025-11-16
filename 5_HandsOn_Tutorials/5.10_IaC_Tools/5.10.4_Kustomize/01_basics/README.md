# Kustomize Basics

## Overview
Learn Kustomize for template-free customization of Kubernetes configurations.

## Installation

```bash
# Kustomize is built into kubectl
kubectl version --client

# Or install standalone
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash

# Verify
kustomize version
```

## First Kustomization

```bash
# Create base configuration
mkdir -p my-app/base && cd my-app/base

# deployment.yaml
cat > deployment.yaml << 'YAML'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: nginx:1.21
        ports:
        - containerPort: 80
YAML

# service.yaml
cat > service.yaml << 'YAML'
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 80
YAML

# kustomization.yaml
cat > kustomization.yaml << 'YAML'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml

commonLabels:
  app: my-app
  managed-by: kustomize

namePrefix: dev-
namespace: default

images:
  - name: nginx
    newTag: 1.21-alpine
YAML
```

## Build and Apply

```bash
# Build (preview)
kubectl kustomize base/
# Or
kustomize build base/

# Apply
kubectl apply -k base/

# Verify
kubectl get deployments
kubectl get services
```

## Directory Structure

```
my-app/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    │   └── kustomization.yaml
    ├── staging/
    │   └── kustomization.yaml
    └── prod/
        └── kustomization.yaml
```

## Next Steps
- Tutorial 02: Patches
