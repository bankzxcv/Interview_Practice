# Kustomize Transformers

## Overview
Use transformers to modify resources (name prefix, namespace, labels, annotations).

## Name Transformers

```yaml
# kustomization.yaml
namePrefix: dev-
nameSuffix: -v1

# Results in: dev-my-app-v1
```

## Namespace Transformer

```yaml
namespace: production
```

## Common Labels/Annotations

```yaml
commonLabels:
  app: my-app
  environment: production
  managed-by: kustomize

commonAnnotations:
  owner: platform-team
  version: "1.0.0"
```

## Images Transformer

```yaml
images:
  - name: nginx
    newName: nginx
    newTag: 1.21-alpine

  - name: myapp
    newName: registry.example.com/myapp
    newTag: v2.0.0
    digest: sha256:abc123...
```

## Replicas Transformer

```yaml
replicas:
  - name: my-app
    count: 5

  - name: worker
    count: 3
```

## Custom Transformers

```yaml
# transformer-config.yaml
apiVersion: builtin
kind: PrefixSuffixTransformer
metadata:
  name: customTransformer
prefix: custom-
fieldSpecs:
  - path: metadata/name
```

```yaml
# kustomization.yaml
transformers:
  - transformer-config.yaml
```

## Next Steps
- Tutorial 07: CI/CD Integration
