# Tutorial 10: Complete Production Pipeline

## Objectives

By the end of this tutorial, you will:
- Build a production-ready CI/CD pipeline
- Implement comprehensive testing and security
- Configure multi-environment deployments
- Set up monitoring and notifications
- Implement rollback strategies
- Configure approval gates
- Document and maintain the pipeline

## Prerequisites

- Completed all previous tutorials (01-09)
- Production Kubernetes cluster
- Monitoring infrastructure (Prometheus, Grafana)
- Security scanning tools configured
- Notification services (Slack, email)

## What is a Production Pipeline?

A production pipeline is a comprehensive CI/CD workflow that includes all necessary steps for safely and reliably deploying applications to production environments.

## Key Components

### Build & Test
- Code compilation
- Unit, integration, and E2E tests
- Code coverage requirements
- Performance testing

### Security
- SAST (Static Analysis)
- DAST (Dynamic Analysis)
- Dependency scanning
- Container scanning
- Secret detection

### Quality Gates
- Code quality checks
- Test coverage thresholds
- Security vulnerability limits
- Performance benchmarks

### Deployment
- Multi-environment strategy
- Blue-green/Canary deployments
- Automated rollbacks
- Database migrations

### Monitoring
- Application metrics
- Error tracking
- Log aggregation
- Alerting

## Complete Production Pipeline

Create `.gitlab-ci.yml`:

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Container-Scanning.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml

stages:
  - validate
  - build
  - test
  - security
  - quality
  - package
  - deploy-dev
  - deploy-staging
  - deploy-canary
  - deploy-prod
  - verify
  - monitor

variables:
  # Application
  APP_NAME: "production-app"
  APP_VERSION: "${CI_COMMIT_TAG:-${CI_COMMIT_SHORT_SHA}}"
  
  # Docker
  DOCKER_IMAGE: "${CI_REGISTRY_IMAGE}:${APP_VERSION}"
  DOCKER_DRIVER: "overlay2"
  DOCKER_BUILDKIT: "1"
  
  # Kubernetes
  KUBE_NAMESPACE_DEV: "development"
  KUBE_NAMESPACE_STAGING: "staging"
  KUBE_NAMESPACE_PROD: "production"
  
  # Testing
  COVERAGE_THRESHOLD: "80"
  PERFORMANCE_BUDGET: "3000"
  
  # Security
  SAST_EXCLUDED_PATHS: "spec,test,tests,tmp"
  
  # Notifications
  SLACK_WEBHOOK: "${SLACK_WEBHOOK_URL}"

workflow:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'
    - if: '$CI_COMMIT_TAG =~ /^v[0-9]+\.[0-9]+\.[0-9]+$/'
    - when: never

# ==================== VALIDATE STAGE ====================

validate-code:
  stage: validate
  image: python:3.11
  script:
    - echo "Validating code structure..."
    - pip install flake8 black isort
    - black --check app/
    - isort --check-only app/
    - flake8 app/ --max-line-length=100
  cache:
    key: ${CI_COMMIT_REF_SLUG}-lint
    paths:
      - .cache/pip

validate-manifests:
  stage: validate
  image: bitnami/kubectl:latest
  script:
    - echo "Validating Kubernetes manifests..."
    - kubectl apply --dry-run=client -f k8s/
    - kubectl apply --dry-run=server -f k8s/

validate-helm:
  stage: validate
  image: alpine/helm:latest
  script:
    - echo "Validating Helm chart..."
    - helm lint helm/app/
    - helm template app helm/app/ --debug

# ==================== BUILD STAGE ====================

build-app:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - echo "Building Docker image..."
    - |
      docker build \
        --cache-from ${CI_REGISTRY_IMAGE}:latest \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VCS_REF=${CI_COMMIT_SHA} \
        --build-arg VERSION=${APP_VERSION} \
        -t ${DOCKER_IMAGE} \
        -t ${CI_REGISTRY_IMAGE}:latest \
        .
    - docker push ${DOCKER_IMAGE}
    - docker push ${CI_REGISTRY_IMAGE}:latest
    - echo "Image size:"
    - docker images ${DOCKER_IMAGE} --format "{{.Size}}"
  artifacts:
    reports:
      dotenv: build.env
  rules:
    - if: '$CI_COMMIT_BRANCH == "main" || $CI_COMMIT_TAG'

# ==================== TEST STAGE ====================

unit-tests:
  stage: test
  image: ${DOCKER_IMAGE}
  script:
    - echo "Running unit tests..."
    - pytest tests/unit/ \
        --junitxml=report.xml \
        --cov=app \
        --cov-report=xml \
        --cov-report=term \
        --cov-fail-under=${COVERAGE_THRESHOLD}
  artifacts:
    when: always
    reports:
      junit: report.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
    paths:
      - htmlcov/
    expire_in: 30 days
  coverage: '/(?i)total.*? (100(?:\.0+)?\%|[1-9]?\d(?:\.\d+)?\%)$/'
  needs: [build-app]

integration-tests:
  stage: test
  image: ${DOCKER_IMAGE}
  services:
    - postgres:13
    - redis:7
  variables:
    POSTGRES_DB: test_db
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_password
    DATABASE_URL: "postgresql://test_user:test_password@postgres:5432/test_db"
    REDIS_URL: "redis://redis:6379"
  script:
    - echo "Running integration tests..."
    - pytest tests/integration/ --junitxml=integration-report.xml
  artifacts:
    when: always
    reports:
      junit: integration-report.xml
    expire_in: 7 days
  needs: [build-app]

e2e-tests:
  stage: test
  image: cypress/base:18
  services:
    - name: ${DOCKER_IMAGE}
      alias: app
  script:
    - echo "Running E2E tests..."
    - npm ci
    - npx cypress run --config baseUrl=http://app:3000
  artifacts:
    when: always
    paths:
      - cypress/screenshots/
      - cypress/videos/
    expire_in: 7 days
  needs: [build-app]
  allow_failure: true

performance-tests:
  stage: test
  image: grafana/k6:latest
  script:
    - echo "Running performance tests..."
    - k6 run --out json=performance.json tests/performance/load-test.js
    - |
      # Check performance budget
      AVG_RESPONSE_TIME=$(jq '.metrics.http_req_duration.values.avg' performance.json)
      if (( $(echo "$AVG_RESPONSE_TIME > $PERFORMANCE_BUDGET" | bc -l) )); then
        echo "Performance budget exceeded: ${AVG_RESPONSE_TIME}ms > ${PERFORMANCE_BUDGET}ms"
        exit 1
      fi
  artifacts:
    reports:
      performance: performance.json
    expire_in: 30 days
  needs: [build-app]
  allow_failure: true

# ==================== SECURITY STAGE ====================

sast:
  stage: security
  variables:
    SAST_EXCLUDED_ANALYZERS: "bandit, brakeman, eslint, flawfinder, gosec, kubesec, phpcs-security-audit, pmd-apex, security-code-scan, semgrep, sobelow, spotbugs"

dependency-scanning:
  stage: security

container-scanning:
  stage: security
  variables:
    CS_IMAGE: ${DOCKER_IMAGE}
  needs: [build-app]

secret-detection:
  stage: security

trivy-scan:
  stage: security
  image: aquasec/trivy:latest
  script:
    - echo "Scanning image with Trivy..."
    - trivy image --severity HIGH,CRITICAL --exit-code 1 ${DOCKER_IMAGE}
  needs: [build-app]
  allow_failure: true

# ==================== QUALITY STAGE ====================

code-quality:
  stage: quality
  image: python:3.11
  script:
    - echo "Running code quality checks..."
    - pip install pylint radon
    - pylint app/ --exit-zero --output-format=json > codequality.json
    - radon cc app/ --json > complexity.json
  artifacts:
    paths:
      - codequality.json
      - complexity.json
    expire_in: 30 days

license-check:
  stage: quality
  image: python:3.11
  script:
    - echo "Checking licenses..."
    - pip install pip-licenses
    - pip-licenses --format=json --output-file=licenses.json
    - pip-licenses --fail-on="GPL"
  artifacts:
    paths:
      - licenses.json
    expire_in: 30 days

# ==================== PACKAGE STAGE ====================

package-helm:
  stage: package
  image: alpine/helm:latest
  script:
    - echo "Packaging Helm chart..."
    - |
      helm package helm/app/ \
        --version ${APP_VERSION} \
        --app-version ${APP_VERSION}
    - helm push app-${APP_VERSION}.tgz oci://${CI_REGISTRY}/${CI_PROJECT_PATH}/charts
  artifacts:
    paths:
      - app-${APP_VERSION}.tgz
    expire_in: 1 year
  only:
    - tags

# ==================== DEPLOY DEV STAGE ====================

deploy-dev:
  stage: deploy-dev
  image: bitnami/kubectl:latest
  script:
    - echo "Deploying to development..."
    - kubectl config use-context ${KUBE_CONTEXT_DEV}
    - |
      helm upgrade --install ${APP_NAME} helm/app/ \
        --namespace ${KUBE_NAMESPACE_DEV} \
        --create-namespace \
        --set image.repository=${CI_REGISTRY_IMAGE} \
        --set image.tag=${APP_VERSION} \
        --set environment=development \
        --wait \
        --timeout 5m
    - kubectl rollout status deployment/${APP_NAME} -n ${KUBE_NAMESPACE_DEV}
  environment:
    name: development
    url: https://dev.example.com
    on_stop: stop-dev
    auto_stop_in: 7 days
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  needs:
    - unit-tests
    - integration-tests

stop-dev:
  stage: deploy-dev
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context ${KUBE_CONTEXT_DEV}
    - helm uninstall ${APP_NAME} -n ${KUBE_NAMESPACE_DEV}
  environment:
    name: development
    action: stop
  when: manual

# ==================== DEPLOY STAGING STAGE ====================

deploy-staging:
  stage: deploy-staging
  image: bitnami/kubectl:latest
  script:
    - echo "Deploying to staging..."
    - kubectl config use-context ${KUBE_CONTEXT_STAGING}
    - |
      helm upgrade --install ${APP_NAME} helm/app/ \
        --namespace ${KUBE_NAMESPACE_STAGING} \
        --create-namespace \
        --set image.repository=${CI_REGISTRY_IMAGE} \
        --set image.tag=${APP_VERSION} \
        --set environment=staging \
        --set replicas=2 \
        --wait \
        --timeout 5m
    - kubectl rollout status deployment/${APP_NAME} -n ${KUBE_NAMESPACE_STAGING}
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
  needs:
    - unit-tests
    - integration-tests
    - e2e-tests
    - sast
    - container-scanning

smoke-test-staging:
  stage: deploy-staging
  image: curlimages/curl:latest
  script:
    - echo "Running smoke tests on staging..."
    - curl -f https://staging.example.com/health || exit 1
    - curl -f https://staging.example.com/api/status || exit 1
  needs: [deploy-staging]

# ==================== DEPLOY CANARY STAGE ====================

deploy-canary:
  stage: deploy-canary
  image: bitnami/kubectl:latest
  script:
    - echo "Deploying canary release..."
    - kubectl config use-context ${KUBE_CONTEXT_PROD}
    - |
      helm upgrade --install ${APP_NAME}-canary helm/app/ \
        --namespace ${KUBE_NAMESPACE_PROD} \
        --create-namespace \
        --set image.repository=${CI_REGISTRY_IMAGE} \
        --set image.tag=${APP_VERSION} \
        --set environment=production \
        --set canary.enabled=true \
        --set canary.weight=10 \
        --set replicas=1 \
        --wait
  environment:
    name: production-canary
    url: https://canary.example.com
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v[0-9]+\.[0-9]+\.[0-9]+$/'
  when: manual
  needs:
    - smoke-test-staging

monitor-canary:
  stage: deploy-canary
  script:
    - echo "Monitoring canary deployment..."
    - sleep 300 # Monitor for 5 minutes
    - |
      # Check error rate
      ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~'5..'}[5m])" | jq '.data.result[0].value[1]')
      if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
        echo "Error rate too high: ${ERROR_RATE}"
        exit 1
      fi
  needs: [deploy-canary]
  allow_failure: true

# ==================== DEPLOY PROD STAGE ====================

deploy-prod:
  stage: deploy-prod
  image: bitnami/kubectl:latest
  before_script:
    - echo "Preparing production deployment..."
    - kubectl config use-context ${KUBE_CONTEXT_PROD}
  script:
    - echo "Deploying to production..."
    - |
      # Create backup
      kubectl get deployment ${APP_NAME} -n ${KUBE_NAMESPACE_PROD} -o yaml > backup-deployment.yaml || true
      
      # Deploy new version
      helm upgrade --install ${APP_NAME} helm/app/ \
        --namespace ${KUBE_NAMESPACE_PROD} \
        --create-namespace \
        --set image.repository=${CI_REGISTRY_IMAGE} \
        --set image.tag=${APP_VERSION} \
        --set environment=production \
        --set replicas=3 \
        --set autoscaling.enabled=true \
        --set autoscaling.minReplicas=3 \
        --set autoscaling.maxReplicas=10 \
        --wait \
        --timeout 10m
      
      # Verify deployment
      kubectl rollout status deployment/${APP_NAME} -n ${KUBE_NAMESPACE_PROD}
      kubectl get pods -n ${KUBE_NAMESPACE_PROD} -l app=${APP_NAME}
  artifacts:
    paths:
      - backup-deployment.yaml
    expire_in: 90 days
  environment:
    name: production
    url: https://example.com
    on_stop: rollback-prod
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v[0-9]+\.[0-9]+\.[0-9]+$/'
  when: manual
  needs:
    - deploy-canary
    - monitor-canary

rollback-prod:
  stage: deploy-prod
  image: bitnami/kubectl:latest
  script:
    - echo "Rolling back production deployment..."
    - kubectl config use-context ${KUBE_CONTEXT_PROD}
    - kubectl rollout undo deployment/${APP_NAME} -n ${KUBE_NAMESPACE_PROD}
    - kubectl rollout status deployment/${APP_NAME} -n ${KUBE_NAMESPACE_PROD}
  environment:
    name: production
    action: rollback
  when: manual

# ==================== VERIFY STAGE ====================

verify-deployment:
  stage: verify
  image: curlimages/curl:latest
  script:
    - echo "Verifying production deployment..."
    - curl -f https://example.com/health || exit 1
    - curl -f https://example.com/api/status || exit 1
    - |
      # Check version
      VERSION=$(curl -s https://example.com/api/version | jq -r '.version')
      if [ "$VERSION" != "${APP_VERSION}" ]; then
        echo "Version mismatch: expected ${APP_VERSION}, got ${VERSION}"
        exit 1
      fi
    - echo "Deployment verified successfully!"
  needs: [deploy-prod]

# ==================== MONITOR STAGE ====================

setup-monitoring:
  stage: monitor
  image: bitnami/kubectl:latest
  script:
    - echo "Setting up monitoring..."
    - kubectl config use-context ${KUBE_CONTEXT_PROD}
    - |
      # Create ServiceMonitor for Prometheus
      kubectl apply -f - <<EOF
      apiVersion: monitoring.coreos.com/v1
      kind: ServiceMonitor
      metadata:
        name: ${APP_NAME}
        namespace: ${KUBE_NAMESPACE_PROD}
      spec:
        selector:
          matchLabels:
            app: ${APP_NAME}
        endpoints:
        - port: metrics
          interval: 30s
      EOF
  needs: [deploy-prod]

notify-deployment:
  stage: monitor
  image: curlimages/curl:latest
  script:
    - |
      # Send Slack notification
      curl -X POST ${SLACK_WEBHOOK} \
        -H 'Content-Type: application/json' \
        -d "{
          \"text\": \"✅ Production deployment successful!\",
          \"blocks\": [
            {
              \"type\": \"section\",
              \"text\": {
                \"type\": \"mrkdwn\",
                \"text\": \"*Production Deployment*\n\n*Version:* ${APP_VERSION}\n*Environment:* Production\n*URL:* https://example.com\n*Deployed by:* ${GITLAB_USER_NAME}\"
              }
            }
          ]
        }"
  needs: [verify-deployment]
  when: on_success

notify-failure:
  stage: monitor
  image: curlimages/curl:latest
  script:
    - |
      # Send failure notification
      curl -X POST ${SLACK_WEBHOOK} \
        -H 'Content-Type: application/json' \
        -d "{
          \"text\": \"❌ Pipeline failed!\",
          \"blocks\": [
            {
              \"type\": \"section\",
              \"text\": {
                \"type\": \"mrkdwn\",
                \"text\": \"*Pipeline Failed*\n\n*Branch:* ${CI_COMMIT_BRANCH}\n*Stage:* ${CI_JOB_STAGE}\n*Job:* ${CI_JOB_NAME}\n*URL:* ${CI_PIPELINE_URL}\"
              }
            }
          ]
        }"
  when: on_failure
```

This comprehensive production pipeline includes all essential components for safely deploying to production with proper testing, security, quality gates, and monitoring.

## Summary

You've learned:
- Building production-ready CI/CD pipelines
- Comprehensive testing strategies
- Security scanning integration
- Multi-environment deployment
- Canary releases
- Rollback procedures
- Monitoring and notifications
- Quality gates and approvals

This completes the GitLab CI/CD tutorial series, providing you with enterprise-grade pipeline knowledge.
