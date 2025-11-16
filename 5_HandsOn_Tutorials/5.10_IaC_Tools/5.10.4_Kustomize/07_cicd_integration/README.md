# Kustomize CI/CD Integration

## Overview
Integrate Kustomize with CI/CD pipelines for automated deployments.

## GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy with Kustomize

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup kubectl
        uses: azure/setup-kubectl@v1

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG }}" > kubeconfig
          export KUBECONFIG=kubeconfig

      - name: Deploy to dev
        run: |
          kubectl apply -k overlays/dev/

      - name: Verify deployment
        run: |
          kubectl rollout status deployment/dev-my-app -n dev
```

## GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy

build:
  stage: build
  script:
    - kubectl kustomize overlays/$CI_ENVIRONMENT_NAME > manifest.yaml
  artifacts:
    paths:
      - manifest.yaml

deploy:
  stage: deploy
  script:
    - kubectl apply -f manifest.yaml
  environment:
    name: production
  only:
    - main
```

## ArgoCD

```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/user/repo
    targetRevision: main
    path: overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Flux

```yaml
# kustomization.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1beta2
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 5m
  path: ./overlays/prod
  prune: true
  sourceRef:
    kind: GitRepository
    name: my-app
```

## Next Steps
- Tutorial 08: Production Patterns
