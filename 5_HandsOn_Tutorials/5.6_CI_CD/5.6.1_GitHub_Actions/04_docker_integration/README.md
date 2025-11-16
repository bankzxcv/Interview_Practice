# Tutorial 04: Docker Integration with GitHub Actions

## Objectives

By the end of this tutorial, you will:
- Build Docker images in GitHub Actions workflows
- Tag images with version numbers, commit SHAs, and branch names
- Push images to Docker Hub and GitHub Container Registry (GHCR)
- Test Docker containers in CI/CD pipeline
- Implement multi-stage Docker builds
- Use Docker layer caching for faster builds
- Scan images for vulnerabilities
- Build multi-platform images (ARM64, AMD64)

## Prerequisites

- Completion of Tutorials 01-03
- Docker account (Docker Hub or GitHub Container Registry)
- Basic understanding of Docker and Dockerfiles
- Understanding of container concepts

## What is Docker Integration in CI/CD?

Docker integration allows you to build, test, and deploy containerized applications automatically. GitHub Actions provides excellent Docker support with built-in actions and optimized runners.

## Key Concepts

### Docker Image
A lightweight, standalone executable package that includes everything needed to run software.

### Docker Registry
A storage and distribution system for Docker images (Docker Hub, GHCR, ECR, etc.).

### Multi-Stage Build
A Dockerfile pattern that uses multiple FROM statements to create smaller final images.

### Image Tagging
Strategy for versioning and identifying Docker images.

### Layer Caching
Reusing previously built layers to speed up builds.

## Step-by-Step Instructions

### Step 1: Create a Dockerized Application

**File: `app/server.py`**

```python
"""
Simple Flask web server for Docker demo.
"""

from flask import Flask, jsonify
import os
import sys

app = Flask(__name__)

VERSION = os.environ.get("APP_VERSION", "1.0.0")


@app.route("/")
def home():
    """Home endpoint."""
    return jsonify({
        "message": "Hello from Docker!",
        "version": VERSION,
        "python_version": sys.version
    })


@app.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"}), 200


@app.route("/version")
def version():
    """Version endpoint."""
    return jsonify({"version": VERSION})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
```

**File: `app/requirements.txt`**

```
Flask==3.0.0
gunicorn==21.2.0
```

**File: `app/test_server.py`**

```python
"""Tests for Flask server."""

import pytest
from server import app


@pytest.fixture
def client():
    """Create test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_home(client):
    """Test home endpoint."""
    response = client.get('/')
    assert response.status_code == 200
    assert b"Hello from Docker" in response.data


def test_health(client):
    """Test health endpoint."""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'


def test_version(client):
    """Test version endpoint."""
    response = client.get('/version')
    assert response.status_code == 200
    assert 'version' in response.get_json()
```

### Step 2: Create Dockerfile

**File: `Dockerfile`**

```dockerfile
# Multi-stage build for smaller final image

# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install dependencies
COPY app/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY app/*.py .

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Set application version from build arg
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')"

# Run with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "server:app"]
```

**File: `.dockerignore`**

```
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
htmlcov/
*.cover
*.log
.git
.gitignore
.dockerignore
.github
Dockerfile
docker-compose.yml
README.md
*.md
.pytest_cache
.mypy_cache
```

### Step 3: Create Docker Build Workflow

**File: `.github/workflows/docker-build.yml`**

```yaml
name: Docker Build

on:
  push:
    branches: [ main, develop ]
    tags:
      - 'v*'
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to GitHub Container Registry
      if: github.event_name != 'pull_request'
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha,prefix={{branch}}-

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: ${{ github.event_name != 'pull_request' }}
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        build-args: |
          APP_VERSION=${{ github.sha }}

    - name: Generate artifact attestation
      if: github.event_name != 'pull_request'
      uses: actions/attest-build-provenance@v1
      with:
        subject-name: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        subject-digest: ${{ steps.meta.outputs.digest }}
        push-to-registry: true
```

**File: `.github/workflows/docker-test.yml`**

```yaml
name: Docker Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Build Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        load: true
        tags: test-image:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Run tests in container
      run: |
        docker run --rm test-image:latest \
          python -m pytest test_server.py -v

    - name: Start container
      run: |
        docker run -d --name test-container \
          -p 5000:5000 \
          test-image:latest

    - name: Wait for container to be ready
      run: |
        timeout 30 sh -c 'until docker exec test-container curl -f http://localhost:5000/health; do sleep 1; done'

    - name: Test endpoints
      run: |
        # Test home endpoint
        curl -f http://localhost:5000/

        # Test health endpoint
        curl -f http://localhost:5000/health

        # Test version endpoint
        curl -f http://localhost:5000/version

    - name: Check container logs
      if: always()
      run: docker logs test-container

    - name: Stop container
      if: always()
      run: docker stop test-container || true
```

### Step 4: Multi-Platform Builds

**File: `.github/workflows/docker-multiplatform.yml`**

```yaml
name: Docker Multi-Platform Build

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up QEMU
      uses: docker/setup-qemu-action@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to GitHub Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=semver,pattern={{major}}
          type=sha

    - name: Build and push multi-platform image
      uses: docker/build-push-action@v5
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        build-args: |
          APP_VERSION=${{ github.ref_name }}
```

### Step 5: Docker Security Scanning

**File: `.github/workflows/docker-security.yml`**

```yaml
name: Docker Security Scan

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0'  # Weekly scan

jobs:
  scan:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Build Docker image
      run: docker build -t scan-image:latest .

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'scan-image:latest'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy results to GitHub Security
      uses: github/codeql-action/upload-sarif@v2
      if: always()
      with:
        sarif_file: 'trivy-results.sarif'

    - name: Run Trivy with table output
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'scan-image:latest'
        format: 'table'
        exit-code: '1'
        ignore-unfixed: true
        vuln-type: 'os,library'
        severity: 'CRITICAL,HIGH'

    - name: Run Hadolint (Dockerfile linter)
      uses: hadolint/hadolint-action@v3.1.0
      with:
        dockerfile: Dockerfile
        failure-threshold: warning
```

## Docker Compose for Local Testing

**File: `docker-compose.yml`**

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      args:
        APP_VERSION: local-dev
    ports:
      - "5000:5000"
    environment:
      - APP_VERSION=local-dev
    volumes:
      - ./app:/app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Verification Steps

### Local Testing

1. **Build Docker image:**
   ```bash
   docker build -t myapp:latest .
   ```

2. **Run container:**
   ```bash
   docker run -p 5000:5000 myapp:latest
   ```

3. **Test endpoints:**
   ```bash
   curl http://localhost:5000/
   curl http://localhost:5000/health
   ```

4. **Use Docker Compose:**
   ```bash
   docker-compose up
   docker-compose down
   ```

### GitHub Actions Testing

1. **Push and verify builds:**
   ```bash
   git add .
   git commit -m "Add Docker integration"
   git push
   ```

2. **Check workflow runs:**
   - View Docker Build workflow
   - Check image is pushed to GHCR
   - Verify multi-platform builds (if triggered)

3. **Verify image in registry:**
   - Go to repository "Packages" section
   - View published container images

## Troubleshooting

### Issue: Permission denied pushing to registry

**Solutions:**
```yaml
permissions:
  contents: read
  packages: write  # Required for GHCR
```

### Issue: Build fails with layer caching

**Solutions:**
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max  # Use max mode
```

### Issue: Multi-platform build slow

**Solutions:**
- Use QEMU for cross-platform builds
- Consider building on native runners
- Cache base images

### Issue: Image size too large

**Solutions:**
- Use multi-stage builds
- Use slim/alpine base images
- Remove unnecessary files
- Use .dockerignore

## Best Practices

### 1. Use Multi-Stage Builds
```dockerfile
FROM python:3.11 as builder
# Build dependencies
FROM python:3.11-slim
# Production runtime
```

### 2. Leverage Build Cache
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

### 3. Tag Images Properly
```yaml
tags: |
  type=semver,pattern={{version}}
  type=sha,prefix={{branch}}-
```

### 4. Scan for Vulnerabilities
```yaml
- uses: aquasecurity/trivy-action@master
```

### 5. Use Official Actions
```yaml
- uses: docker/build-push-action@v5
- uses: docker/metadata-action@v5
```

### 6. Minimize Layers
```dockerfile
RUN apt-get update && apt-get install -y \
    package1 \
    package2 \
    && rm -rf /var/lib/apt/lists/*
```

### 7. Don't Run as Root
```dockerfile
RUN useradd -m -u 1000 appuser
USER appuser
```

## Summary

You've learned:
- Building Docker images in GitHub Actions
- Pushing to GitHub Container Registry
- Multi-platform image builds
- Container testing in CI/CD
- Security scanning with Trivy
- Docker layer caching
- Best practices for Docker in CI/CD

## Next Steps

Proceed to Tutorial 05: Kubernetes Deployment to learn about deploying containers to Kubernetes clusters.
