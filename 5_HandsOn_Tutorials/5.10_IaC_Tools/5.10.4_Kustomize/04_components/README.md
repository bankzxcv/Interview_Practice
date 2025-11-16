# Kustomize Components

## Overview
Create reusable components that can be included in multiple kustomizations.

## Component Example

```yaml
# components/monitoring/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1alpha1
kind: Component

resources:
  - servicemonitor.yaml

patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: not-used
      spec:
        template:
          metadata:
            annotations:
              prometheus.io/scrape: "true"
              prometheus.io/port: "9090"
```

## Using Components

```yaml
# overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

components:
  - ../../components/monitoring
  - ../../components/security
```

## Common Components

```bash
components/
├── monitoring/
│   ├── kustomization.yaml
│   └── servicemonitor.yaml
├── security/
│   ├── kustomization.yaml
│   └── networkpolicy.yaml
└── backup/
    ├── kustomization.yaml
    └── cronjob.yaml
```

## Next Steps
- Tutorial 05: Generators
