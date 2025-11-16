# Kustomize Overlays

## Overview
Use base and overlay pattern for environment-specific configurations.

## Base Configuration

```yaml
# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml

commonLabels:
  app: my-app
```

## Dev Overlay

```yaml
# overlays/dev/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

namePrefix: dev-
namespace: dev

replicas:
  - name: my-app
    count: 1

images:
  - name: nginx
    newTag: latest

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - ENVIRONMENT=development
      - DEBUG=true
```

## Prod Overlay

```yaml
# overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

namePrefix: prod-
namespace: production

replicas:
  - name: my-app
    count: 5

images:
  - name: nginx
    newName: nginx
    newTag: 1.21-alpine

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - ENVIRONMENT=production
      - DEBUG=false

patchesStrategicMerge:
  - resources-patch.yaml

commonAnnotations:
  environment: production
  team: platform
```

## Apply Overlays

```bash
# Dev
kubectl apply -k overlays/dev/

# Prod
kubectl apply -k overlays/prod/
```

## Next Steps
- Tutorial 04: Components
