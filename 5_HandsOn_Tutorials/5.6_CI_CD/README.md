# 5.6 CI/CD Pipelines - Hands-On Tutorials

## Overview

Master Continuous Integration and Continuous Deployment across 5 major platforms. Each platform has 10 incremental tutorials from basic pipelines to advanced GitOps workflows.

## Platforms Covered

### [5.6.1 GitHub Actions](./5.6.1_GitHub_Actions/)
**Best For**: GitHub repositories, cloud-native, free for public repos
- 10 tutorials: Basic workflow → Matrix builds → Docker → Kubernetes → Secrets → Artifacts → Release automation

### [5.6.2 GitLab CI](./5.6.2_GitLab_CI/)
**Best For**: Complete DevOps platform, built-in container registry, self-hosted option
- 10 tutorials: .gitlab-ci.yml → Stages → Docker → Auto DevOps → Security scanning → Pages deployment

### [5.6.3 Jenkins](./5.6.3_Jenkins/)
**Best For**: Enterprise, plugins, self-hosted, maximum flexibility
- 10 tutorials: Freestyle → Pipeline → Jenkinsfile → Docker → Kubernetes → Blue Ocean

### [5.6.4 ArgoCD](./5.6.4_ArgoCD/)
**Best For**: GitOps, Kubernetes deployments, declarative continuous delivery
- 10 tutorials: Basic app → Sync policies → Helm → Kustomize → Multi-cluster → App of Apps pattern

### [5.6.5 Flux](./5.6.5_Flux/)
**Best For**: GitOps, Kubernetes native, pull-based deployment
- 10 tutorials: Bootstrap → Kustomize → Helm → Image automation → Multi-tenancy → Notifications

## Tutorial Progression (Example: GitHub Actions)

| # | Tutorial | Concepts | Time |
|---|----------|----------|------|
| 01 | Basic Workflow | Triggers, jobs, steps | 20 min |
| 02 | Test Automation | Unit tests, linting, code coverage | 25 min |
| 03 | Matrix Builds | Multiple versions, OS, environments | 25 min |
| 04 | Docker Build & Push | Build images, push to registry | 30 min |
| 05 | Deploy to Kubernetes | kubectl, kubeconfig, deployments | 35 min |
| 06 | Secrets Management | GitHub Secrets, environment variables | 20 min |
| 07 | Artifacts & Caching | Build caching, artifact sharing | 25 min |
| 08 | Release Automation | Semantic versioning, GitHub releases | 30 min |
| 09 | Reusable Workflows | Composite actions, workflow templates | 30 min |
| 10 | Complete Pipeline | Full CI/CD with tests, build, deploy | 45 min |

## Quick Start: GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
```

## Best Practices Covered

### Pipeline Design
- ✅ Fail fast (run tests before builds)
- ✅ Parallel execution
- ✅ Stage separation (build, test, deploy)
- ✅ Manual approval gates
- ✅ Rollback strategies

### Security
- ✅ Secrets management
- ✅ Least privilege service accounts
- ✅ Image scanning
- ✅ Dependency scanning
- ✅ SAST/DAST integration

### Performance
- ✅ Build caching
- ✅ Artifact reuse
- ✅ Parallel jobs
- ✅ Conditional execution
- ✅ Resource optimization

### GitOps Principles
- ✅ Git as source of truth
- ✅ Declarative configuration
- ✅ Automated synchronization
- ✅ Self-healing deployments
- ✅ Audit trail

## Platform Comparison

| Feature | GitHub Actions | GitLab CI | Jenkins | ArgoCD | Flux |
|---------|---------------|-----------|---------|--------|------|
| **Hosting** | Cloud | Cloud/Self | Self | Self | Self |
| **Language** | YAML | YAML | Groovy/YAML | YAML | YAML |
| **Best For** | GitHub repos | All-in-one | Enterprise | K8s GitOps | K8s GitOps |
| **Free Tier** | ✅ (public) | ✅ (limited) | ✅ (OSS) | ✅ | ✅ |
| **UI** | Good | Excellent | Good | Excellent | Minimal |
| **Ecosystem** | Actions | Templates | Plugins | Apps | Controllers |
| **Learning Curve** | Easy | Easy | Moderate | Moderate | Moderate |

## Common CI/CD Patterns

### 1. Build → Test → Deploy

```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - npm run build

test:
  stage: test
  script:
    - npm test

deploy:
  stage: deploy
  script:
    - kubectl apply -f k8s/
  only:
    - main
```

### 2. Multi-Environment Deployment

```yaml
deploy_dev:
  stage: deploy
  script:
    - deploy.sh dev
  only:
    - develop

deploy_staging:
  stage: deploy
  script:
    - deploy.sh staging
  only:
    - main

deploy_prod:
  stage: deploy
  script:
    - deploy.sh prod
  when: manual
  only:
    - tags
```

### 3. Docker Build & Push

```yaml
docker_build:
  stage: build
  script:
    - docker build -t myapp:$CI_COMMIT_SHA .
    - docker tag myapp:$CI_COMMIT_SHA myapp:latest
    - docker push myapp:$CI_COMMIT_SHA
    - docker push myapp:latest
```

### 4. GitOps with ArgoCD

```yaml
# ArgoCD Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
spec:
  project: default
  source:
    repoURL: https://github.com/user/repo
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Prerequisites

### For All Tutorials
```bash
# Git
brew install git

# GitHub CLI (for GitHub Actions)
brew install gh

# GitLab CLI (for GitLab CI)
brew install glab

# kubectl (for K8s deployments)
brew install kubectl

# ArgoCD CLI
brew install argocd

# Flux CLI
brew install fluxcd/tap/flux
```

### For Jenkins
```bash
# Docker (Jenkins runs in container)
brew install --cask docker

# Or install Jenkins locally
brew install jenkins-lts
```

## Recommended Study Path

### Week 1: GitHub Actions
- Days 1-5: Complete all 10 GitHub Actions tutorials
- Weekend: Build a real project pipeline

### Week 2: GitLab CI or Jenkins
- Days 1-5: Complete 10 tutorials for chosen platform
- Weekend: Compare with GitHub Actions

### Week 3: GitOps Fundamentals
- Days 1-3: ArgoCD tutorials 1-6
- Days 4-5: Flux tutorials 1-4
- Weekend: Set up GitOps for a project

### Week 4: Advanced & Integration
- Days 1-2: Complete remaining ArgoCD tutorials
- Days 3-4: Complete remaining Flux tutorials
- Day 5: Build multi-pipeline project
- Weekend: Implement full GitOps workflow

## What You'll Master

After completing all tutorials:
- ✅ Design and implement CI/CD pipelines
- ✅ Automate testing and deployment
- ✅ Implement GitOps workflows
- ✅ Manage secrets securely
- ✅ Build and push Docker images
- ✅ Deploy to Kubernetes
- ✅ Implement release automation
- ✅ Create reusable pipeline components
- ✅ Set up multi-environment deployments
- ✅ Monitor and debug pipelines

## Tips for Success

1. **Start Simple**: Begin with basic pipelines, add complexity gradually
2. **Version Control**: Store pipeline configs in Git
3. **Test Locally**: Use tools like `act` (GitHub Actions) to test locally
4. **Fail Fast**: Run quick checks (lint, format) before expensive operations
5. **Cache Wisely**: Cache dependencies, not generated artifacts
6. **Secure Secrets**: Never commit secrets to Git
7. **Monitor Pipelines**: Set up notifications for failures

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Flux Documentation](https://fluxcd.io/docs/)

## Next Steps

1. Choose a platform (recommend GitHub Actions for beginners)
2. Start with tutorial 01
3. Work through all 10 tutorials
4. Apply to a real project
5. Learn other platforms to compare

---

**Total Tutorials**: 50 (5 platforms × 10 tutorials)
**Estimated Time**: 80-100 hours
**Difficulty**: Intermediate to Advanced
**Cost**: Free (most have free tiers)
