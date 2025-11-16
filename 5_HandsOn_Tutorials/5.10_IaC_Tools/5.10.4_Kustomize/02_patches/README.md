# Kustomize Patches

## Overview
Learn strategic merge patches and JSON patches for configuration customization.

## Strategic Merge Patch

```yaml
# overlays/prod/replica-patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 5
  template:
    spec:
      containers:
      - name: app
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 250m
            memory: 256Mi
```

```yaml
# overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

patchesStrategicMerge:
  - replica-patch.yaml
```

## JSON Patch

```yaml
# overlays/prod/json-patch.yaml
- op: replace
  path: /spec/replicas
  value: 5

- op: add
  path: /spec/template/spec/containers/0/env
  value:
    - name: ENVIRONMENT
      value: production
```

```yaml
# overlays/prod/kustomization.yaml
patchesJson6902:
  - target:
      group: apps
      version: v1
      kind: Deployment
      name: my-app
    path: json-patch.yaml
```

## Inline Patches

```yaml
# kustomization.yaml
patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: my-app
      spec:
        replicas: 3
```

## Next Steps
- Tutorial 03: Overlays
