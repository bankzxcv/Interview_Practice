# Tutorial 09: Advanced Pipeline Patterns

## Objectives

By the end of this tutorial, you will:
- Implement parent-child pipelines
- Use DAG (Directed Acyclic Graph) pipelines
- Create dynamic child pipelines
- Implement multi-project pipelines
- Use pipeline triggers effectively
- Implement conditional pipelines
- Create reusable pipeline templates

## Prerequisites

- Completed Tutorial 08: Auto DevOps
- Advanced understanding of GitLab CI/CD
- Experience with complex workflows
- Knowledge of YAML and scripting

## What are Advanced Pipeline Patterns?

Advanced patterns enable complex workflows, parallel execution, and modular pipeline design for large-scale projects and monorepos.

## Key Concepts

### Parent-Child Pipelines
Parent pipeline triggers child pipelines, useful for monorepos and modular projects.

### DAG Pipelines
Define explicit dependencies between jobs, allowing parallel execution without waiting for entire stages.

### Dynamic Pipelines
Generate pipeline configuration dynamically based on conditions or file changes.

### Multi-Project Pipelines
Trigger pipelines in other projects, enabling cross-project workflows.

## Step-by-Step Instructions

### Step 1: Parent-Child Pipelines

Create `.gitlab-ci.yml` with parent pipeline:

```yaml
stages:
  - trigger

# Parent pipeline triggers children
trigger-microservices:
  stage: trigger
  trigger:
    include:
      - local: '.gitlab-ci-microservices.yml'
    strategy: depend # Wait for child to complete
  rules:
    - changes:
        - microservices/**/*

trigger-frontend:
  stage: trigger
  trigger:
    include:
      - local: '.gitlab-ci-frontend.yml'
    strategy: depend
  rules:
    - changes:
        - frontend/**/*

trigger-backend:
  stage: trigger
  trigger:
    include:
      - local: '.gitlab-ci-backend.yml'
    strategy: depend
  rules:
    - changes:
        - backend/**/*
```

**File: `.gitlab-ci-microservices.yml`**

```yaml
stages:
  - build
  - test
  - deploy

build-service-a:
  stage: build
  script:
    - cd microservices/service-a
    - docker build -t service-a .

build-service-b:
  stage: build
  script:
    - cd microservices/service-b
    - docker build -t service-b .

test-services:
  stage: test
  script:
    - pytest microservices/tests/

deploy-services:
  stage: deploy
  script:
    - kubectl apply -f microservices/k8s/
```

### Step 2: DAG Pipelines with Needs

Create `.gitlab-ci.yml` with DAG:

```yaml
stages:
  - build
  - test
  - deploy

# Build jobs run in parallel
build-backend:
  stage: build
  script:
    - echo "Building backend..."
    - docker build -t backend .
  artifacts:
    paths:
      - backend/dist/

build-frontend:
  stage: build
  script:
    - echo "Building frontend..."
    - npm run build
  artifacts:
    paths:
      - frontend/dist/

# Tests run immediately after their builds (DAG)
test-backend:
  stage: test
  needs: [build-backend] # Only needs build-backend
  script:
    - pytest backend/tests/

test-frontend:
  stage: test
  needs: [build-frontend] # Only needs build-frontend
  script:
    - npm test

# Integration test needs both
integration-test:
  stage: test
  needs: 
    - build-backend
    - build-frontend
  script:
    - ./run-integration-tests.sh

# Deploy needs all tests
deploy:
  stage: deploy
  needs:
    - test-backend
    - test-frontend
    - integration-test
  script:
    - ./deploy.sh
```

### Step 3: Dynamic Child Pipelines

Create `.gitlab-ci.yml` that generates child pipeline:

```yaml
stages:
  - generate
  - trigger

# Generate dynamic child pipeline
generate-pipeline:
  stage: generate
  image: ruby:3.0
  script:
    - |
      cat > generated-pipeline.yml << EOF
      stages:
        - build
        - test

      EOF

      # Dynamically add jobs based on changed files
      for dir in services/*/; do
        service=$(basename "$dir")
        cat >> generated-pipeline.yml << EOF
      build-${service}:
        stage: build
        script:
          - echo "Building ${service}"
          - cd services/${service}
          - docker build -t ${service} .

      test-${service}:
        stage: test
        needs: [build-${service}]
        script:
          - echo "Testing ${service}"
          - pytest services/${service}/tests/

      EOF
      done
      
      cat generated-pipeline.yml
  artifacts:
    paths:
      - generated-pipeline.yml
    expire_in: 1 hour

# Trigger dynamic pipeline
trigger-dynamic:
  stage: trigger
  trigger:
    include:
      - artifact: generated-pipeline.yml
        job: generate-pipeline
    strategy: depend
  needs: [generate-pipeline]
```

### Step 4: Multi-Project Pipelines

Create `.gitlab-ci.yml` with cross-project triggers:

```yaml
stages:
  - build
  - trigger-downstream
  - verify

build-library:
  stage: build
  script:
    - npm run build
    - npm publish
  only:
    - main

# Trigger pipeline in dependent project
trigger-app1:
  stage: trigger-downstream
  trigger:
    project: mygroup/app1
    branch: main
    strategy: depend
  variables:
    LIBRARY_VERSION: ${CI_COMMIT_TAG}
  needs: [build-library]

trigger-app2:
  stage: trigger-downstream
  trigger:
    project: mygroup/app2
    branch: develop
  variables:
    LIBRARY_VERSION: ${CI_COMMIT_TAG}
  needs: [build-library]

# Verify all downstream builds passed
verify-downstream:
  stage: verify
  script:
    - echo "All downstream builds completed"
  needs:
    - trigger-app1
    - trigger-app2
```

### Step 5: Advanced Conditional Pipelines

Create `.gitlab-ci.yml` with complex rules:

```yaml
workflow:
  rules:
    # Run pipeline for merge requests
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    # Run for main and develop branches
    - if: '$CI_COMMIT_BRANCH == "main" || $CI_COMMIT_BRANCH == "develop"'
    # Run for tags
    - if: '$CI_COMMIT_TAG'
    # Don't run otherwise
    - when: never

stages:
  - build
  - test
  - deploy

# Job with complex rules
build:
  stage: build
  script:
    - npm run build
  rules:
    # Always run on MRs
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      when: always
    # Run on main if files changed
    - if: '$CI_COMMIT_BRANCH == "main"'
      changes:
        - src/**/*
        - package.json
      when: always
    # Manual on develop
    - if: '$CI_COMMIT_BRANCH == "develop"'
      when: manual
    # Never run otherwise
    - when: never

# Deploy only on tags matching pattern
deploy-prod:
  stage: deploy
  script:
    - ./deploy-production.sh
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v[0-9]+\.[0-9]+\.[0-9]+$/'
      when: manual
  environment:
    name: production
```

### Step 6: Reusable Pipeline Templates

Create reusable templates:

**File: `.gitlab-ci-templates/build-template.yml`**

```yaml
.build-template:
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - docker build -t ${CI_REGISTRY_IMAGE}/${SERVICE_NAME}:${CI_COMMIT_SHORT_SHA} ./${SERVICE_PATH}
    - docker push ${CI_REGISTRY_IMAGE}/${SERVICE_NAME}:${CI_COMMIT_SHORT_SHA}
```

**File: `.gitlab-ci-templates/test-template.yml`**

```yaml
.test-template:
  image: python:3.11
  before_script:
    - pip install pytest pytest-cov
    - cd ${SERVICE_PATH}
  script:
    - pytest tests/ --cov=${SERVICE_NAME} --junitxml=report.xml
  artifacts:
    reports:
      junit: ${SERVICE_PATH}/report.xml
```

**File: `.gitlab-ci.yml`** (using templates)

```yaml
include:
  - local: '.gitlab-ci-templates/build-template.yml'
  - local: '.gitlab-ci-templates/test-template.yml'

stages:
  - build
  - test

# Use template for service A
build-service-a:
  extends: .build-template
  stage: build
  variables:
    SERVICE_NAME: service-a
    SERVICE_PATH: services/service-a

test-service-a:
  extends: .test-template
  stage: test
  variables:
    SERVICE_NAME: service-a
    SERVICE_PATH: services/service-a
  needs: [build-service-a]

# Use template for service B
build-service-b:
  extends: .build-template
  stage: build
  variables:
    SERVICE_NAME: service-b
    SERVICE_PATH: services/service-b

test-service-b:
  extends: .test-template
  stage: test
  variables:
    SERVICE_NAME: service-b
    SERVICE_PATH: services/service-b
  needs: [build-service-b]
```

### Step 7: Monorepo with Change Detection

Create `.gitlab-ci.yml` for monorepo:

```yaml
stages:
  - detect
  - build
  - test
  - deploy

# Detect changed services
detect-changes:
  stage: detect
  script:
    - |
      # Detect which services changed
      CHANGED_SERVICES=""
      for dir in services/*/; do
        service=$(basename "$dir")
        if git diff --name-only $CI_COMMIT_BEFORE_SHA $CI_COMMIT_SHA | grep -q "services/$service/"; then
          CHANGED_SERVICES="$CHANGED_SERVICES $service"
        fi
      done
      echo "CHANGED_SERVICES=$CHANGED_SERVICES" >> changes.env
      cat changes.env
  artifacts:
    reports:
      dotenv: changes.env

# Build only changed services
.build-service:
  stage: build
  script:
    - cd services/${SERVICE}
    - docker build -t ${SERVICE} .
  rules:
    - if: '$CHANGED_SERVICES =~ /$SERVICE/'

build-auth:
  extends: .build-service
  variables:
    SERVICE: auth
  needs: [detect-changes]

build-api:
  extends: .build-service
  variables:
    SERVICE: api
  needs: [detect-changes]

build-frontend:
  extends: .build-service
  variables:
    SERVICE: frontend
  needs: [detect-changes]
```

### Step 8: Complex Multi-Environment Pipeline

Create `.gitlab-ci.yml` with sophisticated deployment:

```yaml
stages:
  - build
  - test
  - deploy-dev
  - deploy-staging
  - deploy-prod
  - smoke-test

variables:
  DOCKER_IMAGE: ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHORT_SHA}

workflow:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'
    - if: '$CI_COMMIT_TAG'

# Build once
build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker build -t ${DOCKER_IMAGE} .
    - docker push ${DOCKER_IMAGE}

# Test in parallel
.test-template: &test-template
  stage: test
  image: ${DOCKER_IMAGE}
  needs: [build]

unit-tests:
  <<: *test-template
  script:
    - npm run test:unit

integration-tests:
  <<: *test-template
  script:
    - npm run test:integration

e2e-tests:
  <<: *test-template
  script:
    - npm run test:e2e

# Deploy to dev (automatic on MR)
deploy-dev:
  stage: deploy-dev
  script:
    - kubectl set image deployment/app app=${DOCKER_IMAGE} -n dev
    - kubectl rollout status deployment/app -n dev
  environment:
    name: dev-$CI_MERGE_REQUEST_IID
    url: https://dev-$CI_MERGE_REQUEST_IID.example.com
    on_stop: cleanup-dev
    auto_stop_in: 1 day
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  needs: [unit-tests, integration-tests]

# Deploy to staging (automatic on main)
deploy-staging:
  stage: deploy-staging
  script:
    - kubectl set image deployment/app app=${DOCKER_IMAGE} -n staging
    - kubectl rollout status deployment/app -n staging
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
  needs: [unit-tests, integration-tests, e2e-tests]

# Smoke test staging
smoke-test-staging:
  stage: smoke-test
  script:
    - curl -f https://staging.example.com/health
    - ./run-smoke-tests.sh staging
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
  needs: [deploy-staging]

# Canary deployment to prod
deploy-prod-canary:
  stage: deploy-prod
  script:
    - kubectl set image deployment/app-canary app=${DOCKER_IMAGE} -n production
    - kubectl patch svc app -n production -p '{"spec":{"selector":{"version":"canary","weight":"10"}}}'
  environment:
    name: production-canary
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v[0-9]+\.[0-9]+\.[0-9]+$/'
  when: manual
  needs: [smoke-test-staging]

# Full production deployment
deploy-prod:
  stage: deploy-prod
  script:
    - kubectl set image deployment/app app=${DOCKER_IMAGE} -n production
    - kubectl rollout status deployment/app -n production
  environment:
    name: production
    url: https://example.com
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v[0-9]+\.[0-9]+\.[0-9]+$/'
  when: manual
  needs: [deploy-prod-canary]

# Smoke test production
smoke-test-prod:
  stage: smoke-test
  script:
    - curl -f https://example.com/health
    - ./run-smoke-tests.sh production
  rules:
    - if: '$CI_COMMIT_TAG'
  needs: [deploy-prod]

# Cleanup dev environment
cleanup-dev:
  stage: deploy-dev
  script:
    - kubectl delete namespace dev-$CI_MERGE_REQUEST_IID
  environment:
    name: dev-$CI_MERGE_REQUEST_IID
    action: stop
  when: manual
```

## Verification Steps

### Local Testing

1. **Validate YAML:**
   ```bash
   python -c "import yaml; yaml.safe_load(open('.gitlab-ci.yml'))"
   ```

2. **Test dynamic generation:**
   ```bash
   ruby generate-pipeline.rb
   cat generated-pipeline.yml
   ```

### GitLab CI Verification

1. **View pipeline graph:**
   - Go to CI/CD > Pipelines
   - Click on pipeline
   - View DAG visualization
   - Check parallel execution

2. **Check child pipelines:**
   - See parent-child relationship
   - View child pipeline details
   - Check strategy (depend/independent)

3. **Verify multi-project triggers:**
   - Check triggered pipelines
   - View cross-project dependencies

## Troubleshooting

### Issue: Child pipeline not triggering

**Problem:** Parent doesn't trigger child.

**Solutions:**
1. Check include path is correct
2. Verify child YAML is valid
3. Check rules/conditions
4. Review permissions

### Issue: Circular dependencies

**Problem:** DAG has circular dependencies.

**Solutions:**
1. Review needs: relationships
2. Remove circular references
3. Restructure pipeline stages
4. Use proper dependency order

### Issue: Dynamic pipeline fails

**Problem:** Generated pipeline is invalid.

**Solutions:**
1. Validate generated YAML
2. Check script for errors
3. Review artifact path
4. Test generation locally

## Best Practices

### 1. Use Needs for Performance
```yaml
test:
  needs: [build] # Don't wait for entire stage
```

### 2. Organize with Templates
```yaml
include:
  - local: '.gitlab-ci-templates/build.yml'
  - local: '.gitlab-ci-templates/test.yml'
```

### 3. Use Change Detection
```yaml
rules:
  - changes:
      - services/api/**/*
```

### 4. Implement Proper Error Handling
```yaml
trigger:
  include: child.yml
  strategy: depend # Fail if child fails
```

### 5. Document Complex Pipelines
```yaml
# This pipeline implements:
# 1. Parent-child pattern for monorepo
# 2. DAG for parallel execution
# 3. Dynamic generation for services
```

## Additional Resources

- [Parent-Child Pipelines](https://docs.gitlab.com/ee/ci/pipelines/downstream_pipelines.html)
- [DAG Pipelines](https://docs.gitlab.com/ee/ci/directed_acyclic_graph/)
- [Dynamic Child Pipelines](https://docs.gitlab.com/ee/ci/pipelines/downstream_pipelines.html#dynamic-child-pipelines)
- [Multi-Project Pipelines](https://docs.gitlab.com/ee/ci/pipelines/downstream_pipelines.html#multi-project-pipelines)

## Next Steps

After completing this tutorial:
1. Implement complex workflows
2. Optimize pipeline performance
3. Create reusable templates
4. Move on to Tutorial 10: Production Pipeline

## Summary

You've learned:
- Implementing parent-child pipelines
- Using DAG for parallel execution
- Creating dynamic pipelines
- Multi-project pipeline triggers
- Advanced conditional logic
- Reusable templates
- Monorepo strategies
- Complex multi-environment deployments

This knowledge enables you to build sophisticated, efficient CI/CD pipelines for complex projects.
