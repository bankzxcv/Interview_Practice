# Tutorial 10: Complete Production CI/CD Pipeline

## Objectives

By the end of this tutorial, you will:
- Build a complete production-ready CI/CD pipeline
- Implement multi-environment deployments (dev, staging, production)
- Integrate all previous tutorial concepts
- Implement deployment gates and approvals
- Set up monitoring and rollback capabilities
- Handle database migrations
- Implement blue-green and canary deployments
- Create a comprehensive pipeline with all best practices

## Prerequisites

- Completion of Tutorials 01-09
- Understanding of all previous concepts
- Production environment access
- Cloud provider account (AWS, GCP, or Azure)

## Architecture Overview

This tutorial implements a complete pipeline:
```
Code Push → Lint → Test → Build → Security Scan → Dev Deploy →
Integration Tests → Staging Deploy → Approval → Production Deploy →
Smoke Tests → Monitoring
```

## Complete Production Pipeline

**File: `.github/workflows/production-pipeline.yml`**

```yaml
name: Production CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  release:
    types: [published]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ============================================
  # Stage 1: Code Quality and Validation
  # ============================================

  lint:
    name: Code Linting
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'
        cache: 'pip'

    - name: Install linting tools
      run: |
        pip install flake8 black isort mypy

    - name: Run linters
      run: |
        flake8 app/ --max-line-length=100
        black --check app/
        isort --check-only app/
        mypy app/

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install and run ESLint
      run: |
        npm ci
        npm run lint

  # ============================================
  # Stage 2: Testing
  # ============================================

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint

    strategy:
      matrix:
        python-version: ['3.10', '3.11']

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: ${{ matrix.python-version }}
        cache: 'pip'

    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov pytest-xdist

    - name: Run unit tests
      run: |
        pytest tests/unit -v --cov=app --cov-report=xml --cov-report=html

    - name: Run integration tests
      run: |
        pytest tests/integration -v

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage.xml
        flags: python-${{ matrix.python-version }}

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: test-results-py${{ matrix.python-version }}
        path: htmlcov/

  # ============================================
  # Stage 3: Security Scanning
  # ============================================

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: lint
    permissions:
      security-events: write

    steps:
    - uses: actions/checkout@v4

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload to GitHub Security
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

    - name: Run dependency check
      run: |
        pip install safety
        safety check --json

  # ============================================
  # Stage 4: Build Docker Image
  # ============================================

  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    permissions:
      contents: read
      packages: write

    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}

    steps:
    - uses: actions/checkout@v4

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
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push
      id: build
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        build-args: |
          VERSION=${{ github.sha }}

    - name: Scan Docker image
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ steps.meta.outputs.tags }}
        format: 'table'
        exit-code: '1'
        severity: 'CRITICAL,HIGH'

  # ============================================
  # Stage 5: Deploy to Development
  # ============================================

  deploy-dev:
    name: Deploy to Development
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment:
      name: development
      url: https://dev.example.com

    steps:
    - uses: actions/checkout@v4

    - name: Configure kubectl
      run: |
        mkdir -p $HOME/.kube
        echo "${{ secrets.DEV_KUBECONFIG }}" | base64 -d > $HOME/.kube/config

    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/app \
          app=${{ needs.build.outputs.image-tag }} \
          -n development

        kubectl rollout status deployment/app -n development --timeout=5m

    - name: Run smoke tests
      run: |
        curl -f https://dev.example.com/health || exit 1
        curl -f https://dev.example.com/version || exit 1

  # ============================================
  # Stage 6: Deploy to Staging
  # ============================================

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment:
      name: staging
      url: https://staging.example.com

    steps:
    - uses: actions/checkout@v4

    - name: Run database migrations (dry-run)
      run: |
        echo "Running database migration dry-run..."
        # python manage.py migrate --dry-run

    - name: Deploy to staging
      run: |
        echo "Deploying to staging..."
        # Deployment commands here

    - name: Run integration tests
      run: |
        echo "Running integration tests on staging..."
        # Integration test commands

    - name: Performance tests
      run: |
        echo "Running performance tests..."
        # Load testing commands

  # ============================================
  # Stage 7: Deploy to Production
  # ============================================

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [deploy-staging]
    if: github.event_name == 'release'
    environment:
      name: production
      url: https://example.com

    steps:
    - uses: actions/checkout@v4

    - name: Create deployment snapshot
      run: |
        echo "Creating pre-deployment snapshot..."
        # Snapshot commands

    - name: Blue-Green Deployment
      run: |
        echo "Deploying to blue environment..."
        # Deploy to blue environment
        # Switch traffic gradually
        # Monitor metrics

    - name: Run smoke tests
      run: |
        curl -f https://example.com/health || exit 1

    - name: Monitor deployment
      run: |
        echo "Monitoring deployment for 5 minutes..."
        # Monitor error rates, latency, etc.

    - name: Rollback on failure
      if: failure()
      run: |
        echo "Deployment failed, rolling back..."
        # Rollback commands

  # ============================================
  # Stage 8: Post-Deployment
  # ============================================

  post-deployment:
    name: Post-Deployment Tasks
    runs-on: ubuntu-latest
    needs: deploy-production
    if: success()

    steps:
    - name: Update documentation
      run: |
        echo "Updating deployment documentation..."

    - name: Notify team
      run: |
        echo "Sending deployment notifications..."
        # Slack/Teams notification

    - name: Update status page
      run: |
        echo "Updating status page..."

    - name: Create deployment record
      run: |
        echo "Recording deployment in system..."
```

## Database Migration Workflow

**File: `.github/workflows/database-migration.yml`**

```yaml
name: Database Migration

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      migration-command:
        required: true
        type: string

jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: pip install -r requirements.txt

    - name: Backup database
      run: |
        echo "Creating database backup..."
        # pg_dump commands or similar

    - name: Run migration (dry-run)
      run: |
        ${{ inputs.migration-command }} --dry-run

    - name: Run migration
      run: |
        ${{ inputs.migration-command }}

    - name: Verify migration
      run: |
        echo "Verifying migration success..."
        # Verification commands
```

## Application Code

**File: `app/main.py`**

```python
"""
Production application with health checks and monitoring.
"""

from flask import Flask, jsonify
import os
import sys
from datetime import datetime

app = Flask(__name__)

VERSION = os.environ.get("VERSION", "dev")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")


@app.route("/")
def home():
    """Home endpoint."""
    return jsonify({
        "message": "Production application",
        "version": VERSION,
        "environment": ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat()
    })


@app.route("/health")
def health():
    """Health check endpoint for load balancers."""
    # Add actual health checks here
    # - Database connectivity
    # - Cache connectivity
    # - Disk space
    # - Memory usage

    health_status = {
        "status": "healthy",
        "version": VERSION,
        "environment": ENVIRONMENT,
        "checks": {
            "database": "ok",
            "cache": "ok",
            "disk": "ok"
        }
    }

    return jsonify(health_status), 200


@app.route("/ready")
def ready():
    """Readiness check for Kubernetes."""
    # Check if application is ready to serve traffic
    return jsonify({"status": "ready"}), 200


@app.route("/version")
def version():
    """Version information."""
    return jsonify({
        "version": VERSION,
        "environment": ENVIRONMENT,
        "python_version": sys.version,
        "deployed_at": os.environ.get("DEPLOYED_AT", "unknown")
    })


@app.route("/metrics")
def metrics():
    """Prometheus metrics endpoint."""
    # Return Prometheus-formatted metrics
    return """
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total 100
"""


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

## Kubernetes Manifests

**File: `k8s/production/deployment.yml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-production
  namespace: production
  labels:
    app: myapp
    environment: production
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 2
  selector:
    matchLabels:
      app: myapp
      environment: production
  template:
    metadata:
      labels:
        app: myapp
        environment: production
        version: "1.0.0"
    spec:
      containers:
      - name: app
        image: ghcr.io/org/app:latest
        ports:
        - containerPort: 5000
        env:
        - name: ENVIRONMENT
          value: "production"
        - name: VERSION
          valueFrom:
            fieldRef:
              fieldPath: metadata.labels['version']
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 3
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - myapp
              topologyKey: kubernetes.io/hostname
```

## Infrastructure as Code

**File: `terraform/main.tf`**

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# EKS Cluster
module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = "production-cluster"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    production = {
      desired_size = 3
      min_size     = 3
      max_size     = 10

      instance_types = ["t3.large"]
    }
  }
}

# RDS Database
resource "aws_db_instance" "production" {
  identifier     = "production-db"
  engine         = "postgres"
  engine_version = "15"
  instance_class = "db.t3.medium"

  allocated_storage     = 100
  storage_encrypted     = true
  backup_retention_period = 30

  multi_az = true

  tags = {
    Environment = "production"
  }
}
```

## Monitoring and Alerting

**File: `.github/workflows/monitoring.yml`**

```yaml
name: Production Monitoring

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest

    steps:
    - name: Check production health
      run: |
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://example.com/health)

        if [ "$STATUS" != "200" ]; then
          echo "Health check failed with status: $STATUS"
          exit 1
        fi

    - name: Check performance
      run: |
        RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s https://example.com/)

        if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
          echo "Response time too high: ${RESPONSE_TIME}s"
          exit 1
        fi

    - name: Alert on failure
      if: failure()
      run: |
        # Send alert to Slack, PagerDuty, etc.
        echo "Sending alert..."
```

## Summary

This tutorial demonstrates a complete production CI/CD pipeline with:
- Multi-stage validation (lint, test, security)
- Artifact building and caching
- Multi-environment deployments
- Database migrations
- Health checks and monitoring
- Rollback capabilities
- Infrastructure as code
- Best practices throughout

You now have a production-ready CI/CD system!

## Next Steps

- Implement the pipeline in your projects
- Customize for your specific needs
- Add more monitoring and alerting
- Implement feature flags
- Add A/B testing capabilities
- Enhance security scanning
- Implement chaos engineering

Congratulations on completing all 10 GitHub Actions tutorials!
