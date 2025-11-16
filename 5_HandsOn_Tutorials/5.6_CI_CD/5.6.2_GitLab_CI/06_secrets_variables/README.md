# Tutorial 06: Secrets and Variables Management

## Objectives

By the end of this tutorial, you will:
- Manage CI/CD variables in GitLab
- Implement secure secrets management
- Use protected and masked variables
- Integrate with HashiCorp Vault
- Implement file-based variables
- Use environment-specific variables
- Manage variable precedence

## Prerequisites

- Completed Tutorial 05: Kubernetes Deployment
- Understanding of environment variables
- Basic knowledge of secrets management
- GitLab project with CI/CD enabled

## What are CI/CD Variables?

CI/CD variables are key-value pairs that store configuration and secrets. GitLab provides multiple ways to define and protect these variables.

## Key Concepts

### Variable Types
- **CI/CD Variables**: Defined in project/group settings
- **File Variables**: Content written to temporary files
- **Protected Variables**: Only available in protected branches/tags
- **Masked Variables**: Values hidden in job logs

### Variable Scope
- **Instance**: Available to all projects
- **Group**: Available to group projects
- **Project**: Available to specific project
- **Environment**: Available to specific environment

### Variable Precedence
1. Trigger variables
2. Scheduled pipeline variables
3. Manual pipeline variables
4. Project variables
5. Group variables
6. Instance variables
7. Deployment variables
8. Predefined variables

## Step-by-Step Instructions

### Step 1: Basic Variable Usage

Create `.gitlab-ci.yml` using variables:

```yaml
stages:
  - build
  - deploy

variables:
  # Global variables
  APP_NAME: "myapp"
  APP_VERSION: "1.0.0"
  ENVIRONMENT: "development"

# Job-level variables
build-job:
  stage: build
  variables:
    BUILD_TYPE: "release"
    OPTIMIZATION: "speed"
  script:
    - echo "Building ${APP_NAME} version ${APP_VERSION}"
    - echo "Build type: ${BUILD_TYPE}"
    - echo "Environment: ${ENVIRONMENT}"
    - echo "Optimization: ${OPTIMIZATION}"
    - echo "Pipeline ID: ${CI_PIPELINE_ID}"
    - echo "Commit SHA: ${CI_COMMIT_SHORT_SHA}"

# Using masked variables
deploy-job:
  stage: deploy
  script:
    - echo "Deploying to ${DEPLOY_ENV}"
    - echo "Using API key: ${API_KEY}" # Will be masked in logs
    - echo "Database URL: ${DATABASE_URL}" # Will be masked
  environment:
    name: ${DEPLOY_ENV}
```

### Step 2: Protected and Masked Variables

Set up in GitLab UI:
- Go to Settings > CI/CD > Variables
- Add variable with options:
  - **Protect variable**: Only available on protected branches
  - **Mask variable**: Hide value in job logs
  - **Expand variable reference**: Allow variable expansion

Example usage:

```yaml
deploy-production:
  stage: deploy
  script:
    - echo "Deploying to production..."
    - |
      curl -X POST https://api.example.com/deploy \
        -H "Authorization: Bearer ${PROD_API_TOKEN}" \
        -d "version=${CI_COMMIT_TAG}"
  only:
    - tags
  environment:
    name: production
```

### Step 3: File-Based Variables

Create `.gitlab-ci.yml` using file variables:

```yaml
stages:
  - deploy

variables:
  KUBECONFIG: /tmp/kubeconfig

deploy-with-file-vars:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - echo "Using kubeconfig from file variable..."
    - cat ${KUBECONFIG}
    - kubectl config view
    - kubectl get nodes
    - |
      # Use service account key from file
      gcloud auth activate-service-account --key-file=${GCP_SERVICE_KEY}
      gcloud container clusters get-credentials my-cluster
  environment:
    name: production
```

### Step 4: Environment-Specific Variables

Create `.gitlab-ci.yml` with environment variables:

```yaml
stages:
  - deploy

# Deploy to dev
deploy-dev:
  stage: deploy
  variables:
    API_URL: "https://api.dev.example.com"
    DB_HOST: "db.dev.example.com"
    LOG_LEVEL: "debug"
  script:
    - echo "Deploying to development..."
    - echo "API URL: ${API_URL}"
    - echo "DB Host: ${DB_HOST}"
    - echo "Log Level: ${LOG_LEVEL}"
    - ./deploy.sh
  environment:
    name: development
  only:
    - develop

# Deploy to staging
deploy-staging:
  stage: deploy
  variables:
    API_URL: "https://api.staging.example.com"
    DB_HOST: "db.staging.example.com"
    LOG_LEVEL: "info"
  script:
    - echo "Deploying to staging..."
    - echo "API URL: ${API_URL}"
    - echo "DB Host: ${DB_HOST}"
    - ./deploy.sh
  environment:
    name: staging
  only:
    - main

# Deploy to production
deploy-prod:
  stage: deploy
  variables:
    API_URL: "https://api.example.com"
    DB_HOST: "db.example.com"
    LOG_LEVEL: "warn"
  script:
    - echo "Deploying to production..."
    - echo "API URL: ${API_URL}"
    - ./deploy.sh
  environment:
    name: production
  when: manual
  only:
    - main
```

### Step 5: HashiCorp Vault Integration

Create `.gitlab-ci.yml` with Vault:

```yaml
stages:
  - deploy

variables:
  VAULT_ADDR: "https://vault.example.com"
  VAULT_NAMESPACE: "admin"

deploy-with-vault:
  stage: deploy
  id_tokens:
    VAULT_ID_TOKEN:
      aud: https://vault.example.com
  before_script:
    - apt-get update && apt-get install -y curl jq
    - |
      # Authenticate to Vault using JWT
      export VAULT_TOKEN=$(curl --request POST \
        --data "{\"role\":\"gitlab-ci\",\"jwt\":\"${VAULT_ID_TOKEN}\"}" \
        ${VAULT_ADDR}/v1/auth/jwt/login | jq -r '.auth.client_token')
  script:
    - |
      # Fetch secrets from Vault
      export DB_PASSWORD=$(curl -H "X-Vault-Token: ${VAULT_TOKEN}" \
        ${VAULT_ADDR}/v1/secret/data/database | jq -r '.data.data.password')

      export API_KEY=$(curl -H "X-Vault-Token: ${VAULT_TOKEN}" \
        ${VAULT_ADDR}/v1/secret/data/api | jq -r '.data.data.key')

      # Use secrets in deployment
      echo "Deploying with secrets from Vault..."
      ./deploy.sh
  environment:
    name: production
```

### Step 6: Dynamic Variable Generation

Create `.gitlab-ci.yml` with dynamic variables:

```yaml
stages:
  - prepare
  - deploy

# Generate variables
generate-vars:
  stage: prepare
  script:
    - |
      # Generate deployment ID
      DEPLOY_ID="deploy-$(date +%Y%m%d-%H%M%S)-${CI_COMMIT_SHORT_SHA}"
      echo "DEPLOY_ID=${DEPLOY_ID}" >> deploy.env

      # Generate version string
      VERSION="${CI_COMMIT_TAG:-${CI_COMMIT_SHORT_SHA}}"
      echo "VERSION=${VERSION}" >> deploy.env

      # Generate build metadata
      BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
      echo "BUILD_DATE=${BUILD_DATE}" >> deploy.env

      # Display generated variables
      cat deploy.env
  artifacts:
    reports:
      dotenv: deploy.env

# Use generated variables
deploy-app:
  stage: deploy
  script:
    - echo "Deployment ID: ${DEPLOY_ID}"
    - echo "Version: ${VERSION}"
    - echo "Build Date: ${BUILD_DATE}"
    - |
      # Use in deployment
      kubectl set image deployment/myapp \
        myapp=${CI_REGISTRY_IMAGE}:${VERSION} \
        --record \
        --namespace=production
      kubectl annotate deployment/myapp \
        deployment-id="${DEPLOY_ID}" \
        build-date="${BUILD_DATE}"
  needs:
    - generate-vars
  environment:
    name: production
```

### Step 7: Secure Secrets Handling

Create `.gitlab-ci.yml` with secure practices:

```yaml
stages:
  - validate
  - deploy

# Validate secrets exist
validate-secrets:
  stage: validate
  script:
    - |
      echo "Validating required secrets..."
      REQUIRED_VARS=(
        "DATABASE_URL"
        "API_KEY"
        "ENCRYPTION_KEY"
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
      )

      for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
          echo "ERROR: Required variable $var is not set!"
          exit 1
        else
          echo "✓ $var is set"
        fi
      done
  only:
    - main

# Deploy with secrets
deploy-secure:
  stage: deploy
  before_script:
    # Write secrets to files (more secure than env vars)
    - echo "${DATABASE_CREDENTIALS}" > /tmp/db-creds.json
    - echo "${TLS_CERT}" > /tmp/tls.crt
    - echo "${TLS_KEY}" > /tmp/tls.key
    - chmod 600 /tmp/db-creds.json /tmp/tls.key
  script:
    - |
      # Use secrets from files
      export DB_URL=$(jq -r '.url' /tmp/db-creds.json)
      export DB_USER=$(jq -r '.username' /tmp/db-creds.json)
      export DB_PASS=$(jq -r '.password' /tmp/db-creds.json)

      # Deploy application
      ./deploy.sh --db-url "${DB_URL}" \
                  --tls-cert /tmp/tls.crt \
                  --tls-key /tmp/tls.key
  after_script:
    # Clean up secrets
    - rm -f /tmp/db-creds.json /tmp/tls.crt /tmp/tls.key
  environment:
    name: production
  needs:
    - validate-secrets
```

### Step 8: Variable Groups and Inheritance

Create `.gitlab-ci.yml` showing inheritance:

```yaml
# Global variables
variables:
  APP_NAME: "myapp"
  DOCKER_DRIVER: "overlay2"

# Include external variables
include:
  - local: '/ci/variables.yml'

stages:
  - test
  - build
  - deploy

# Job inheriting global variables
test:
  stage: test
  script:
    - echo "Testing ${APP_NAME}"
    - echo "Docker driver: ${DOCKER_DRIVER}"

# Job with additional variables
build:
  stage: build
  variables:
    BUILD_ENV: "production"
    OPTIMIZATION_LEVEL: "3"
  script:
    - echo "Building ${APP_NAME} for ${BUILD_ENV}"
    - echo "Optimization: ${OPTIMIZATION_LEVEL}"

# Job overriding global variable
deploy:
  stage: deploy
  variables:
    APP_NAME: "myapp-prod" # Overrides global
  script:
    - echo "Deploying ${APP_NAME}" # Uses overridden value
```

**File: `ci/variables.yml`**

```yaml
variables:
  REGISTRY_URL: "registry.gitlab.com"
  IMAGE_PREFIX: "mycompany"
  DEFAULT_REGION: "us-east-1"
```

## Sample Scripts

**File: `scripts/deploy.sh`**

```bash
#!/bin/bash

set -e

echo "=== Deployment Script ==="
echo "App: ${APP_NAME}"
echo "Version: ${VERSION}"
echo "Environment: ${ENVIRONMENT}"

# Validate required variables
: ${API_URL:?API_URL not set}
: ${DB_HOST:?DB_HOST not set}

# Perform deployment
echo "Deploying application..."
echo "API URL: ${API_URL}"
echo "DB Host: ${DB_HOST}"

# Deployment logic here
echo "Deployment successful!"
```

## Verification Steps

### Local Testing

1. **Export variables locally:**
   ```bash
   export APP_NAME="myapp"
   export APP_VERSION="1.0.0"
   export ENVIRONMENT="development"
   ```

2. **Test variable expansion:**
   ```bash
   echo "Building ${APP_NAME} version ${APP_VERSION}"
   ```

3. **Validate required variables:**
   ```bash
   : ${DATABASE_URL:?DATABASE_URL not set}
   ```

### GitLab CI Verification

1. **Add CI/CD variables:**
   - Go to Settings > CI/CD > Variables
   - Add variable (e.g., API_KEY)
   - Enable "Protect variable" for production
   - Enable "Mask variable" to hide in logs

2. **View variable usage:**
   - Run pipeline
   - Check job logs
   - Verify masked variables show `[masked]`

3. **Test variable precedence:**
   - Set same variable at different levels
   - Verify correct value is used

## Troubleshooting

### Issue: Variable not found

**Problem:** Variable shows as empty in job.

**Solutions:**
1. Check variable is defined at correct scope
2. Verify spelling (case-sensitive)
3. Check if variable is protected/branch matches
4. Review variable precedence

### Issue: Masked variable visible

**Problem:** Secret appears in logs.

**Solutions:**
1. Enable "Mask variable" in settings
2. Ensure value meets masking requirements (8+ chars)
3. Use base64 encoding for complex values
4. Write to file instead of echo

### Issue: Variable expansion not working

**Problem:** Variable shows as literal string.

**Solutions:**
1. Use ${VAR} syntax, not $VAR
2. Enable "Expand variable reference"
3. Check for proper quoting
4. Verify variable exists in scope

## Best Practices

### 1. Use Protected Variables
```yaml
# Only available on protected branches
deploy-prod:
  only:
    - main # protected branch
  script:
    - echo "${PROD_API_KEY}" # protected variable
```

### 2. Mask Sensitive Values
- Always mask passwords, tokens, keys
- Use file variables for large secrets
- Never echo secrets directly

### 3. Validate Variables
```yaml
before_script:
  - : ${DATABASE_URL:?DATABASE_URL not set}
  - : ${API_KEY:?API_KEY not set}
```

### 4. Use Environment-Specific Variables
```yaml
environment:
  name: production
# Variables scoped to production environment
```

### 5. Clean Up Secrets
```yaml
after_script:
  - rm -f /tmp/secrets/*
  - unset SECRET_VAR
```

### 6. Group Related Variables
- Use naming conventions: `PROD_DB_URL`, `STAGING_DB_URL`
- Store in Vault/external secret manager
- Document variable purpose

## Security Considerations

### DO:
- Use masked variables for secrets
- Implement least privilege
- Rotate secrets regularly
- Use external secret managers (Vault)
- Validate variable values
- Clean up after use

### DON'T:
- Commit secrets to repository
- Echo secrets in logs
- Use secrets in unprotected branches
- Share secrets across projects unnecessarily
- Use weak/predictable values

## Additional Resources

- [GitLab CI/CD Variables](https://docs.gitlab.com/ee/ci/variables/)
- [Protected Variables](https://docs.gitlab.com/ee/ci/variables/#protected-cicd-variables)
- [Vault Integration](https://docs.gitlab.com/ee/ci/secrets/)
- [External Secrets](https://docs.gitlab.com/ee/ci/secrets/index.html)

## Next Steps

After completing this tutorial:
1. Implement Vault integration
2. Audit secret usage
3. Set up secret rotation
4. Move on to Tutorial 07: Artifacts and Caching

## Summary

You've learned:
- Managing CI/CD variables in GitLab
- Implementing protected and masked variables
- Using file-based variables
- Integrating with HashiCorp Vault
- Environment-specific variable management
- Variable precedence and inheritance
- Security best practices for secrets
- Dynamic variable generation

This knowledge enables you to manage secrets and configuration securely in CI/CD pipelines.
