# Helm Basics

## Overview
Learn Helm package manager for Kubernetes including installation and creating your first chart.

## Installation

```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify
helm version

# Add repositories
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

## First Chart

```bash
# Create new chart
helm create my-app

# Chart structure:
my-app/
├── Chart.yaml       # Chart metadata
├── values.yaml      # Default values
├── charts/          # Dependencies
└── templates/       # Kubernetes manifests
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    └── _helpers.tpl

# Install chart
helm install my-release my-app

# List releases
helm list

# Get status
helm status my-release

# Upgrade
helm upgrade my-release my-app

# Uninstall
helm uninstall my-release
```

## Basic Chart.yaml

```yaml
apiVersion: v2
name: my-app
description: My Application Helm Chart
type: application
version: 0.1.0
appVersion: "1.0"
```

## Basic values.yaml

```yaml
replicaCount: 2

image:
  repository: nginx
  tag: "1.21"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

## Verification

```bash
# Test chart
helm lint my-app

# Dry run
helm install --dry-run --debug my-release my-app

# Template rendering
helm template my-release my-app
```

## Next Steps
- Tutorial 02: Chart Structure
