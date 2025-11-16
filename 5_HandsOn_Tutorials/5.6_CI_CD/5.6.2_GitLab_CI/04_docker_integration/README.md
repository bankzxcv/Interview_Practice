# Tutorial 04: Docker Integration in GitLab CI

## Objectives

By the end of this tutorial, you will:
- Build Docker images in GitLab CI pipelines
- Push images to GitLab Container Registry
- Use Docker-in-Docker (DinD) and Kaniko
- Implement multi-stage Docker builds
- Tag and version images properly
- Scan images for vulnerabilities
- Optimize Docker layer caching

## Prerequisites

- Completed Tutorial 03: Matrix Builds
- Understanding of Docker basics
- Docker installed locally (for testing)
- GitLab repository with Container Registry enabled
- Basic knowledge of Dockerfiles

## What is Docker Integration in CI/CD?

Docker integration allows you to build, test, and publish container images as part of your CI/CD pipeline. GitLab provides a built-in Container Registry for storing images.

## Key Concepts

### Docker-in-Docker (DinD)
Running Docker daemon inside a Docker container. Useful for building images in CI.

### Kaniko
Build container images without requiring privileged Docker daemon access.

### Container Registry
GitLab's built-in Docker registry for storing images. Available at `registry.gitlab.com/username/project`.

### Image Tagging
Versioning strategy for Docker images (e.g., `latest`, `v1.0.0`, commit SHA).

## Step-by-Step Instructions

### Step 1: Basic Docker Build with DinD

Create `.gitlab-ci.yml` using Docker-in-Docker:

```yaml
stages:
  - build
  - test
  - push

variables:
  DOCKER_HOST: tcp://docker:2376
  DOCKER_TLS_CERTDIR: "/certs"
  DOCKER_TLS_VERIFY: 1
  DOCKER_CERT_PATH: "$DOCKER_TLS_CERTDIR/client"
  IMAGE_NAME: $CI_REGISTRY_IMAGE
  IMAGE_TAG: $CI_COMMIT_SHORT_SHA

# Build Docker image
build-image:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker info
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - echo "Building Docker image..."
    - docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
    - docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest
    - docker images
  after_script:
    - docker logout "$CI_REGISTRY"

# Test Docker image
test-image:
  stage: test
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
    - docker pull ${IMAGE_NAME}:${IMAGE_TAG} || docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
  script:
    - echo "Testing Docker image..."
    - docker run --rm ${IMAGE_NAME}:${IMAGE_TAG} python --version
    - docker run --rm ${IMAGE_NAME}:${IMAGE_TAG} pytest tests/ || true
  needs:
    - build-image

# Push to registry
push-image:
  stage: push
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - docker pull ${IMAGE_NAME}:${IMAGE_TAG} || docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
    - docker push ${IMAGE_NAME}:${IMAGE_TAG}
    - docker push ${IMAGE_NAME}:latest
    - echo "Image pushed successfully!"
  only:
    - main
    - develop
  needs:
    - test-image
```

### Step 2: Build with Kaniko (No Privileged Mode)

Create `.gitlab-ci.yml` using Kaniko:

```yaml
stages:
  - build
  - push

variables:
  IMAGE_NAME: $CI_REGISTRY_IMAGE
  IMAGE_TAG: $CI_COMMIT_SHORT_SHA

# Build with Kaniko
build-kaniko:
  stage: build
  image:
    name: gcr.io/kaniko-project/executor:latest
    entrypoint: [""]
  script:
    - echo "Building with Kaniko..."
    - |
      cat > /kaniko/.docker/config.json <<EOF
      {
        "auths": {
          "$CI_REGISTRY": {
            "auth": "$(echo -n ${CI_REGISTRY_USER}:${CI_REGISTRY_PASSWORD} | base64)"
          }
        }
      }
      EOF
    - >
      /kaniko/executor
      --context ${CI_PROJECT_DIR}
      --dockerfile ${CI_PROJECT_DIR}/Dockerfile
      --destination ${IMAGE_NAME}:${IMAGE_TAG}
      --destination ${IMAGE_NAME}:latest
      --cache=true
      --cache-ttl=24h
    - echo "Image built and pushed with Kaniko!"
  only:
    - main
    - develop
```

### Step 3: Multi-Stage Build

Create `Dockerfile` with multi-stage build:

```dockerfile
# Build stage
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app ./

# Add local bin to PATH
ENV PATH=/root/.local/bin:$PATH

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import sys; sys.exit(0)"

# Run application
CMD ["python", "-m", "app.main"]
```

Create `.gitlab-ci.yml` for multi-stage build:

```yaml
stages:
  - build
  - test
  - scan
  - push

variables:
  IMAGE_NAME: $CI_REGISTRY_IMAGE
  IMAGE_TAG: $CI_COMMIT_SHORT_SHA

build-multistage:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - echo "Building multi-stage Docker image..."
    - |
      docker build \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VCS_REF=$CI_COMMIT_SHORT_SHA \
        --build-arg VERSION=$CI_COMMIT_TAG \
        -t ${IMAGE_NAME}:${IMAGE_TAG} \
        -t ${IMAGE_NAME}:latest \
        .
    - echo "Image size:"
    - docker images ${IMAGE_NAME}:${IMAGE_TAG}

# Test image
test-container:
  stage: test
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - docker pull ${IMAGE_NAME}:${IMAGE_TAG} || docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
    - echo "Running container tests..."
    - docker run --rm ${IMAGE_NAME}:${IMAGE_TAG} python --version
    - docker run --rm ${IMAGE_NAME}:${IMAGE_TAG} python -c "import app; print('App imported successfully')"
    - |
      # Test health check
      CONTAINER_ID=$(docker run -d ${IMAGE_NAME}:${IMAGE_TAG})
      sleep 10
      docker inspect --format='{{.State.Health.Status}}' $CONTAINER_ID
      docker stop $CONTAINER_ID
  needs:
    - build-multistage

# Scan for vulnerabilities
scan-image:
  stage: scan
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
    - wget -qO /tmp/grype.tar.gz https://github.com/anchore/grype/releases/latest/download/grype_0.74.0_linux_amd64.tar.gz
    - tar -xzf /tmp/grype.tar.gz -C /usr/local/bin grype
  script:
    - docker pull ${IMAGE_NAME}:${IMAGE_TAG} || docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
    - echo "Scanning image for vulnerabilities..."
    - grype ${IMAGE_NAME}:${IMAGE_TAG} -o json > vulnerability-report.json
    - grype ${IMAGE_NAME}:${IMAGE_TAG} -o table
  artifacts:
    paths:
      - vulnerability-report.json
    expire_in: 30 days
  allow_failure: true
  needs:
    - build-multistage

# Push to registry
push-to-registry:
  stage: push
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - docker pull ${IMAGE_NAME}:${IMAGE_TAG} || docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
    - docker push ${IMAGE_NAME}:${IMAGE_TAG}
    - docker push ${IMAGE_NAME}:latest
    - |
      if [ -n "$CI_COMMIT_TAG" ]; then
        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:${CI_COMMIT_TAG}
        docker push ${IMAGE_NAME}:${CI_COMMIT_TAG}
      fi
    - echo "Image pushed to registry!"
  only:
    - main
    - tags
  needs:
    - test-container
    - scan-image
```

### Step 4: Build Matrix for Multiple Architectures

Create `.gitlab-ci.yml` for multi-arch builds:

```yaml
stages:
  - build
  - manifest

# Build for different architectures
build-multiarch:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  parallel:
    matrix:
      - ARCH: ["amd64", "arm64"]
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
    - docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
  script:
    - echo "Building for ${ARCH}..."
    - |
      docker build \
        --platform linux/${ARCH} \
        -t ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHORT_SHA}-${ARCH} \
        .
    - docker push ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHORT_SHA}-${ARCH}

# Create multi-arch manifest
create-manifest:
  stage: manifest
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - echo "Creating multi-arch manifest..."
    - |
      docker manifest create ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHORT_SHA} \
        ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHORT_SHA}-amd64 \
        ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHORT_SHA}-arm64
    - docker manifest push ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHORT_SHA}
    - |
      docker manifest create ${CI_REGISTRY_IMAGE}:latest \
        ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHORT_SHA}-amd64 \
        ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHORT_SHA}-arm64
    - docker manifest push ${CI_REGISTRY_IMAGE}:latest
  needs:
    - build-multiarch
  only:
    - main
```

### Step 5: Docker Layer Caching

Create `.gitlab-ci.yml` with effective caching:

```yaml
stages:
  - build

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_BUILDKIT: 1
  IMAGE_NAME: $CI_REGISTRY_IMAGE
  CACHE_IMAGE: ${CI_REGISTRY_IMAGE}/cache

build-with-cache:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - echo "Building with layer caching..."
    - docker pull ${CACHE_IMAGE}:latest || true
    - |
      docker build \
        --cache-from ${CACHE_IMAGE}:latest \
        --tag ${IMAGE_NAME}:${CI_COMMIT_SHORT_SHA} \
        --tag ${IMAGE_NAME}:latest \
        --tag ${CACHE_IMAGE}:latest \
        .
    - docker push ${IMAGE_NAME}:${CI_COMMIT_SHORT_SHA}
    - docker push ${IMAGE_NAME}:latest
    - docker push ${CACHE_IMAGE}:latest
```

## Sample Application Files

**File: `app/__init__.py`**
```python
"""Application package."""
__version__ = "1.0.0"
```

**File: `app/main.py`**
```python
"""Main application entry point."""

def main():
    print("Application starting...")
    print("Version: 1.0.0")
    print("Application running successfully!")

if __name__ == "__main__":
    main()
```

**File: `requirements.txt`**
```txt
flask==2.3.0
requests==2.31.0
pytest==7.4.0
gunicorn==21.2.0
```

**File: `.dockerignore`**
```
__pycache__
*.pyc
*.pyo
*.pyd
.Python
.git
.gitignore
.dockerignore
.env
.venv
venv/
*.log
.pytest_cache/
.coverage
htmlcov/
dist/
build/
*.egg-info/
.DS_Store
```

## Verification Steps

### Local Testing

1. **Build image locally:**
   ```bash
   docker build -t my-app:latest .
   ```

2. **Test the image:**
   ```bash
   docker run --rm my-app:latest python --version
   docker run --rm my-app:latest python -m app.main
   ```

3. **Check image size:**
   ```bash
   docker images my-app:latest
   ```

4. **Scan for vulnerabilities:**
   ```bash
   docker scan my-app:latest
   ```

### GitLab CI Verification

1. **View build logs:**
   - Go to CI/CD > Pipelines
   - Click on pipeline
   - View build job logs

2. **Check Container Registry:**
   - Go to Packages & Registries > Container Registry
   - Verify images are pushed
   - Check tags and sizes

3. **Pull and test image:**
   ```bash
   docker login registry.gitlab.com
   docker pull registry.gitlab.com/username/project:latest
   docker run --rm registry.gitlab.com/username/project:latest
   ```

## Troubleshooting

### Issue: Docker daemon not available

**Problem:** "Cannot connect to Docker daemon" error.

**Solutions:**
1. Ensure `docker:dind` service is configured
2. Check DOCKER_HOST variable
3. Verify TLS settings
4. Try Kaniko instead

### Issue: Permission denied

**Problem:** "permission denied while trying to connect to Docker daemon"

**Solutions:**
1. Use docker:dind service
2. Check runner is configured for Docker
3. Consider using Kaniko
4. Verify privileged mode if needed

### Issue: Build timeout

**Problem:** Docker build takes too long.

**Solutions:**
1. Implement layer caching
2. Use multi-stage builds
3. Optimize Dockerfile
4. Increase job timeout
5. Use smaller base images

### Issue: Large image size

**Problem:** Docker image is too large.

**Solutions:**
1. Use slim/alpine base images
2. Implement multi-stage builds
3. Clean up in same layer
4. Use .dockerignore
5. Remove build dependencies

## Best Practices

### 1. Use Specific Image Tags
```dockerfile
# Good
FROM python:3.11-slim

# Bad
FROM python:latest
```

### 2. Minimize Layers
```dockerfile
# Good - single layer
RUN apt-get update && \
    apt-get install -y package && \
    rm -rf /var/lib/apt/lists/*

# Bad - multiple layers
RUN apt-get update
RUN apt-get install -y package
RUN rm -rf /var/lib/apt/lists/*
```

### 3. Use .dockerignore
```
.git
.gitignore
*.md
tests/
.pytest_cache/
```

### 4. Add Labels
```dockerfile
LABEL maintainer="team@example.com"
LABEL version="1.0.0"
LABEL description="Application container"
```

### 5. Run as Non-Root
```dockerfile
RUN useradd -m appuser
USER appuser
```

### 6. Use Health Checks
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost/ || exit 1
```

## Additional Resources

- [GitLab Docker Integration](https://docs.gitlab.com/ee/ci/docker/)
- [GitLab Container Registry](https://docs.gitlab.com/ee/user/packages/container_registry/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kaniko Documentation](https://github.com/GoogleContainerTools/kaniko)

## Next Steps

After completing this tutorial:
1. Optimize your Dockerfiles
2. Implement security scanning
3. Build multi-architecture images
4. Move on to Tutorial 05: Kubernetes Deployment

## Summary

You've learned:
- Building Docker images in GitLab CI
- Using Docker-in-Docker and Kaniko
- Multi-stage build optimization
- Image tagging and versioning
- Container Registry integration
- Vulnerability scanning
- Layer caching strategies
- Multi-architecture builds

This knowledge enables you to build and deploy containerized applications efficiently.
