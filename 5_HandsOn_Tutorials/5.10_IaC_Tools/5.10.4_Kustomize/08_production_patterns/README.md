# Kustomize Production Patterns

## Overview
Best practices and patterns for production-ready Kustomize configurations.

## Production Directory Structure

```
my-app/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── hpa.yaml
│   └── kustomization.yaml
├── components/
│   ├── monitoring/
│   │   ├── servicemonitor.yaml
│   │   └── kustomization.yaml
│   ├── security/
│   │   ├── networkpolicy.yaml
│   │   ├── podsecuritypolicy.yaml
│   │   └── kustomization.yaml
│   └── backup/
│       ├── cronjob.yaml
│       └── kustomization.yaml
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   └── patches/
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patches/
    └── prod/
        ├── kustomization.yaml
        ├── patches/
        │   ├── replicas.yaml
        │   ├── resources.yaml
        │   └── ingress.yaml
        └── secrets/
            └── .gitkeep
```

## Production Kustomization

```yaml
# overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

namespace: production

namePrefix: prod-

commonLabels:
  environment: production
  app: my-app
  managed-by: kustomize

commonAnnotations:
  team: platform
  cost-center: engineering
  compliance: pci-dss

components:
  - ../../components/monitoring
  - ../../components/security
  - ../../components/backup

images:
  - name: nginx
    newName: registry.example.com/nginx
    newTag: 1.21-alpine
    digest: sha256:...

replicas:
  - name: my-app
    count: 5

patchesStrategicMerge:
  - patches/replicas.yaml
  - patches/resources.yaml
  - patches/ingress.yaml

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - ENVIRONMENT=production
      - LOG_LEVEL=INFO
      - ENABLE_METRICS=true

secretGenerator:
  - name: app-secrets
    envs:
      - secrets/.env.production

generatorOptions:
  disableNameSuffixHash: false
  labels:
    environment: production
```

## Production Patches

```yaml
# overlays/prod/patches/resources.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
      - name: app
        resources:
          limits:
            cpu: 1000m
            memory: 1Gi
          requests:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
```

## Best Practices

1. **Base Configuration**: Keep base minimal and generic
2. **Overlays**: Use overlays for environment-specific config
3. **Components**: Reusable features as components
4. **Generators**: Generate ConfigMaps/Secrets
5. **Patches**: Strategic merge for complex changes
6. **Validation**: Use kubectl dry-run and kustomize build
7. **Version Control**: Track all kustomizations
8. **Documentation**: Document overlay purposes
9. **Security**: Never commit secrets to git
10. **Testing**: Test kustomizations before apply

## Validation Script

```bash
#!/bin/bash
# validate-kustomize.sh

set -e

echo "Validating Kustomize configurations..."

for env in dev staging prod; do
  echo "Checking $env overlay..."
  
  # Build kustomization
  kubectl kustomize overlays/$env > /tmp/manifest-$env.yaml
  
  # Validate with kubectl
  kubectl apply --dry-run=client -f /tmp/manifest-$env.yaml
  
  # Lint with kubeval (if installed)
  if command -v kubeval &> /dev/null; then
    kubeval /tmp/manifest-$env.yaml
  fi
  
  echo "$env validation successful!"
done

echo "All validations passed!"
```

## Production Deployment

```bash
# Validate
kubectl kustomize overlays/prod | kubectl apply --dry-run=server -f -

# Preview changes
kubectl diff -k overlays/prod

# Deploy
kubectl apply -k overlays/prod

# Verify
kubectl get all -n production
kubectl rollout status deployment/prod-my-app -n production

# Rollback if needed
kubectl rollout undo deployment/prod-my-app -n production
```

## Production Checklist

- [x] Base configuration validated
- [x] All overlays tested
- [x] Security contexts configured
- [x] Resource limits set
- [x] Health checks implemented
- [x] Monitoring enabled
- [x] Backup configured
- [x] Secrets managed securely
- [x] Documentation complete
- [x] CI/CD integration tested
- [x] Rollback plan ready
