# Tutorial 08: GitLab Auto DevOps

## Objectives

By the end of this tutorial, you will:
- Understand GitLab Auto DevOps
- Enable and configure Auto DevOps
- Customize Auto DevOps templates
- Use Auto Build, Test, and Deploy
- Configure Auto Review Apps
- Implement Auto Monitoring
- Customize deployment strategies

## Prerequisites

- Completed Tutorial 07: Artifacts and Caching
- Understanding of GitLab CI/CD
- Access to Kubernetes cluster (for deployments)
- Basic knowledge of Docker and Kubernetes

## What is Auto DevOps?

Auto DevOps is a pre-configured CI/CD configuration that automatically detects, builds, tests, and deploys applications with minimal configuration required.

## Key Concepts

### Auto DevOps Stages
1. **Auto Build**: Builds Docker images
2. **Auto Test**: Runs automated tests
3. **Auto Code Quality**: Analyzes code quality
4. **Auto SAST**: Security scanning
5. **Auto Dependency Scanning**: Checks dependencies
6. **Auto Container Scanning**: Scans Docker images
7. **Auto Review Apps**: Deploy to temporary environments
8. **Auto Deploy**: Deploy to environments
9. **Auto Monitoring**: Set up monitoring

### Detection
Auto DevOps detects application type based on files:
- `Dockerfile` - Docker application
- `package.json` - Node.js
- `requirements.txt` - Python
- `Gemfile` - Ruby
- `pom.xml` - Java Maven
- `build.gradle` - Java Gradle

## Step-by-Step Instructions

### Step 1: Enable Auto DevOps

Enable Auto DevOps in GitLab:
1. Go to Settings > CI/CD
2. Expand "Auto DevOps"
3. Check "Default to Auto DevOps pipeline"
4. Set deployment strategy
5. Set domain for deployments
6. Save changes

### Step 2: Basic Auto DevOps Configuration

Create `.gitlab-ci.yml` with Auto DevOps:

```yaml
# Use Auto DevOps template
include:
  - template: Auto-DevOps.gitlab-ci.yml

# Customize variables
variables:
  AUTO_DEVOPS_DOMAIN: example.com
  POSTGRES_ENABLED: "true"
  POSTGRES_VERSION: "13"
  KUBERNETES_VERSION: "1.27"
```

### Step 3: Customize Auto Build

Create `.gitlab-ci.yml` with custom build:

```yaml
include:
  - template: Auto-DevOps.gitlab-ci.yml

# Override build job
build:
  extends: .auto-build
  variables:
    DOCKER_BUILD_ARGS: "--build-arg NODE_ENV=production"
  before_script:
    - echo "Custom pre-build steps"
  after_script:
    - echo "Custom post-build steps"
```

### Step 4: Customize Auto Test

Create `.gitlab-ci.yml` with custom tests:

```yaml
include:
  - template: Auto-DevOps.gitlab-ci.yml

# Add custom test jobs
test-custom:
  stage: test
  image: node:18
  script:
    - npm install
    - npm run test:custom
  only:
    - merge_requests

# Override code quality
code_quality:
  extends: .auto-code-quality
  variables:
    CODE_QUALITY_IMAGE: "registry.gitlab.com/gitlab-org/ci-cd/codequality:latest"
  allow_failure: true
```

### Step 5: Configure Review Apps

Create `.gitlab-ci.yml` with Review Apps:

```yaml
include:
  - template: Auto-DevOps.gitlab-ci.yml

variables:
  AUTO_DEVOPS_DOMAIN: example.com
  REVIEW_APPS_ENABLED: "true"

# Customize review app deployment
review:
  extends: .auto-deploy
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: https://$CI_COMMIT_REF_SLUG.$AUTO_DEVOPS_DOMAIN
    on_stop: stop_review
    auto_stop_in: 1 day

stop_review:
  extends: .auto-deploy
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    action: stop
  script:
    - auto-deploy destroy
  when: manual
```

### Step 6: Custom Deployment Strategy

Create `.gitlab-ci.yml` with deployment customization:

```yaml
include:
  - template: Auto-DevOps.gitlab-ci.yml

variables:
  AUTO_DEVOPS_DOMAIN: example.com
  STAGING_ENABLED: "true"
  CANARY_ENABLED: "true"
  INCREMENTAL_ROLLOUT_MODE: "manual"

# Staging deployment
staging:
  extends: .auto-deploy
  environment:
    name: staging
    url: https://staging.$AUTO_DEVOPS_DOMAIN
  only:
    - main

# Production with canary
canary:
  extends: .auto-deploy
  environment:
    name: production
  variables:
    CANARY_WEIGHT: "25"
  only:
    - main
  when: manual

production:
  extends: .auto-deploy
  environment:
    name: production
    url: https://$AUTO_DEVOPS_DOMAIN
  only:
    - main
  when: manual
```

### Step 7: Disable Specific Auto DevOps Jobs

Create `.gitlab-ci.yml` to disable jobs:

```yaml
include:
  - template: Auto-DevOps.gitlab-ci.yml

# Disable specific jobs
container_scanning:
  rules:
    - when: never

dependency_scanning:
  rules:
    - when: never

license_scanning:
  rules:
    - when: never
```

### Step 8: Full Custom Auto DevOps Configuration

Create `.gitlab-ci.yml` with comprehensive customization:

```yaml
include:
  - template: Auto-DevOps.gitlab-ci.yml

variables:
  # Auto DevOps configuration
  AUTO_DEVOPS_DOMAIN: myapp.example.com
  AUTO_DEVOPS_CHART: gitlab/auto-deploy-app
  AUTO_DEVOPS_CHART_REPOSITORY: https://charts.gitlab.io
  
  # Features
  POSTGRES_ENABLED: "true"
  POSTGRES_VERSION: "13"
  POSTGRES_DB: myapp_production
  
  # Build configuration
  DOCKER_BUILD_ARGS: >
    --build-arg NODE_ENV=production
    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
  
  # Kubernetes configuration
  KUBE_NAMESPACE: production
  KUBERNETES_VERSION: "1.27"
  
  # Security scanning
  SAST_EXCLUDED_PATHS: "spec,test,tests,tmp"
  CODE_QUALITY_DISABLED: "false"
  
  # Performance
  PERFORMANCE_DISABLED: "false"
  
  # Deployment
  STAGING_ENABLED: "true"
  CANARY_ENABLED: "true"
  INCREMENTAL_ROLLOUT_MODE: "manual"
  ROLLOUT_RESOURCE_TYPE: "deployment"
  
  # Review apps
  REVIEW_APPS_ENABLED: "true"
  REVIEW_APPS_AUTO_STOP_ENABLED: "true"
  
  # Monitoring
  AUTO_MONITORING_ENABLED: "true"

# Custom build steps
build:
  extends: .auto-build
  before_script:
    - echo "Running custom pre-build steps..."
    - ./scripts/pre-build.sh
  script:
    - auto-build
  after_script:
    - echo "Running custom post-build steps..."
    - ./scripts/post-build.sh

# Custom test configuration
test:
  extends: .auto-test
  variables:
    TEST_ENV: "ci"
    COVERAGE_THRESHOLD: "80"
  script:
    - auto-test
    - ./scripts/custom-tests.sh

# Custom staging deployment
staging:
  extends: .auto-deploy
  environment:
    name: staging
    url: https://staging.$AUTO_DEVOPS_DOMAIN
    on_stop: stop_staging
  before_script:
    - ./scripts/pre-deploy-staging.sh
  only:
    - main

# Custom production deployment with approval
production:
  extends: .auto-deploy
  environment:
    name: production
    url: https://$AUTO_DEVOPS_DOMAIN
  before_script:
    - echo "Deploying to production..."
    - ./scripts/pre-deploy-production.sh
  script:
    - auto-deploy
  after_script:
    - ./scripts/post-deploy-production.sh
    - ./scripts/notify-deployment.sh
  only:
    - main
  when: manual

# Cleanup review apps
stop_review:
  extends: .auto-deploy
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    action: stop
  script:
    - auto-deploy destroy
  when: manual
```

## Sample Application Files

**File: `Dockerfile`**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**File: `package.json`**
```json
{
  "name": "auto-devops-app",
  "version": "1.0.0",
  "description": "Auto DevOps example application",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "jest",
    "test:custom": "jest --coverage"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

**File: `index.js`**
```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Auto DevOps Application', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

## Verification Steps

### Local Testing

1. **Test Docker build:**
   ```bash
   docker build -t myapp:latest .
   docker run -p 3000:3000 myapp:latest
   curl http://localhost:3000
   ```

2. **Validate configuration:**
   ```bash
   # Check if Auto DevOps detects your app
   ls -la Dockerfile package.json requirements.txt
   ```

### GitLab CI Verification

1. **View Auto DevOps pipeline:**
   - Go to CI/CD > Pipelines
   - See all Auto DevOps stages
   - Review automated jobs

2. **Check deployments:**
   - Go to Deployments > Environments
   - View review apps
   - Check staging/production

3. **Monitor application:**
   - Go to Deployments > Environments
   - Click "Monitoring"
   - View metrics

## Troubleshooting

### Issue: Auto DevOps not detecting application

**Problem:** Auto DevOps doesn't recognize app type.

**Solutions:**
1. Add language-specific file (package.json, etc.)
2. Create custom Dockerfile
3. Check file is in repository root
4. Verify Auto DevOps is enabled

### Issue: Build failing

**Problem:** Auto Build job fails.

**Solutions:**
1. Check Dockerfile syntax
2. Verify dependencies install correctly
3. Review build logs
4. Test build locally

### Issue: Deployment failing

**Problem:** Cannot deploy to Kubernetes.

**Solutions:**
1. Verify Kubernetes integration
2. Check cluster credentials
3. Ensure namespace exists
4. Review deployment logs

## Best Practices

### 1. Customize for Your Needs
```yaml
# Don't use all default jobs
container_scanning:
  rules:
    - when: never # Disable if not needed
```

### 2. Use Environment-Specific Variables
```yaml
variables:
  POSTGRES_ENABLED: "true" # Enable for production
  POSTGRES_VERSION: "13" # Specific version
```

### 3. Implement Security Scanning
```yaml
variables:
  SAST_EXCLUDED_PATHS: "spec,test"
  CODE_QUALITY_DISABLED: "false"
```

### 4. Configure Review Apps
```yaml
variables:
  REVIEW_APPS_ENABLED: "true"
  REVIEW_APPS_AUTO_STOP_ENABLED: "true"
```

### 5. Use Canary Deployments
```yaml
variables:
  CANARY_ENABLED: "true"
  CANARY_WEIGHT: "25"
```

## Additional Resources

- [GitLab Auto DevOps](https://docs.gitlab.com/ee/topics/autodevops/)
- [Auto DevOps Customization](https://docs.gitlab.com/ee/topics/autodevops/customize.html)
- [Auto DevOps Variables](https://docs.gitlab.com/ee/topics/autodevops/cicd_variables.html)
- [Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/stages.html#auto-deploy)

## Next Steps

After completing this tutorial:
1. Fine-tune Auto DevOps for your project
2. Implement custom security policies
3. Set up monitoring and alerting
4. Move on to Tutorial 09: Advanced Pipelines

## Summary

You've learned:
- Understanding GitLab Auto DevOps
- Enabling and configuring Auto DevOps
- Customizing Auto DevOps templates
- Using Auto Build, Test, and Deploy
- Implementing Review Apps
- Configuring deployment strategies
- Security scanning integration
- Best practices for Auto DevOps

This knowledge enables you to rapidly set up CI/CD for applications with minimal configuration.
