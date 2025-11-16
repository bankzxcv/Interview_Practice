# Pulumi CI/CD Integration

## Overview
Integrate Pulumi with CI/CD pipelines for automated infrastructure deployments.

## GitHub Actions

```yaml
# .github/workflows/pulumi.yml
name: Pulumi
on:
  push:
    branches: [main]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: pulumi/actions@v3
        with:
          command: preview
          stack-name: dev
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
  
  deploy:
    runs-on: ubuntu-latest
    needs: preview
    steps:
      - uses: actions/checkout@v2
      - uses: pulumi/actions@v3
        with:
          command: up
          stack-name: dev
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

## GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - preview
  - deploy

preview:
  stage: preview
  script:
    - pulumi login
    - pulumi stack select dev
    - pulumi preview

deploy:
  stage: deploy
  script:
    - pulumi login
    - pulumi stack select dev
    - pulumi up --yes
  only:
    - main
```

## Best Practices
1. Use preview before deploy
2. Store access tokens securely
3. Implement approval gates
4. Monitor deployments

## Next Steps
- Tutorial 08: Production Infrastructure
