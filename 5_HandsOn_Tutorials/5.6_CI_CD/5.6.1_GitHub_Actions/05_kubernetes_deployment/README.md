# Tutorial 05: Kubernetes Deployment with GitHub Actions

## Objectives

By the end of this tutorial, you will:
- Deploy applications to Kubernetes clusters from GitHub Actions
- Manage Kubernetes manifests (Deployments, Services, ConfigMaps)
- Use kubectl in CI/CD workflows
- Implement rolling updates and blue-green deployments
- Manage multiple environments (dev, staging, production)
- Use Helm for package management
- Implement deployment health checks and rollbacks
- Secure Kubernetes credentials

## Prerequisites

- Completion of Tutorials 01-04
- Basic understanding of Kubernetes concepts
- Access to a Kubernetes cluster (minikube, GKE, EKS, AKS, or kind)
- kubectl installed locally for testing
- Understanding of Docker and containers

## Key Concepts

### Kubernetes Deployment
A declarative way to manage application updates and rollouts.

### kubectl
Command-line tool for interacting with Kubernetes clusters.

### Helm
Package manager for Kubernetes applications.

### Rolling Update
Gradually replacing old pods with new ones to achieve zero-downtime deployments.

### ConfigMap/Secret
Kubernetes objects for managing configuration and sensitive data.

## Step-by-Step Instructions

### Step 1: Create Kubernetes Manifests

**File: `k8s/deployment.yml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flask-app
  labels:
    app: flask-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flask-app
  template:
    metadata:
      labels:
        app: flask-app
        version: "1.0"
    spec:
      containers:
      - name: flask-app
        image: ghcr.io/your-org/your-repo:latest
        ports:
        - containerPort: 5000
          name: http
        env:
        - name: APP_VERSION
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: version
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
      imagePullSecrets:
      - name: ghcr-secret
```

**File: `k8s/service.yml`**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: flask-app-service
  labels:
    app: flask-app
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 5000
    protocol: TCP
    name: http
  selector:
    app: flask-app
```

**File: `k8s/configmap.yml`**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  version: "1.0.0"
  log_level: "INFO"
  environment: "production"
```

**File: `k8s/ingress.yml`**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: flask-app-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - app.example.com
    secretName: flask-app-tls
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: flask-app-service
            port:
              number: 80
```

### Step 2: Create Deployment Workflow

**File: `.github/workflows/k8s-deploy.yml`**

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [ main ]
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        type: choice
        options:
          - development
          - staging
          - production

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

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
          type=sha,prefix={{branch}}-
          type=ref,event=tag

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: ${{ inputs.environment || 'production' }}

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.28.0'

    - name: Configure kubectl
      run: |
        mkdir -p $HOME/.kube
        echo "${{ secrets.KUBECONFIG }}" | base64 -d > $HOME/.kube/config
        chmod 600 $HOME/.kube/config

    - name: Verify cluster connection
      run: kubectl cluster-info

    - name: Update deployment image
      run: |
        kubectl set image deployment/flask-app \
          flask-app=${{ needs.build.outputs.image-tag }} \
          --record

    - name: Wait for rollout
      run: |
        kubectl rollout status deployment/flask-app --timeout=5m

    - name: Verify deployment
      run: |
        kubectl get deployments
        kubectl get pods
        kubectl get services

    - name: Run smoke tests
      run: |
        # Get service external IP
        SERVICE_IP=$(kubectl get service flask-app-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

        # Test health endpoint
        curl -f http://$SERVICE_IP/health || exit 1

        # Test version endpoint
        curl -f http://$SERVICE_IP/version || exit 1
```

### Step 3: Advanced Deployment with Helm

**File: `k8s/helm/Chart.yaml`**

```yaml
apiVersion: v2
name: flask-app
description: A Helm chart for Flask application
type: application
version: 1.0.0
appVersion: "1.0"
```

**File: `k8s/helm/values.yaml`**

```yaml
replicaCount: 3

image:
  repository: ghcr.io/your-org/your-repo
  pullPolicy: IfNotPresent
  tag: "latest"

imagePullSecrets:
  - name: ghcr-secret

service:
  type: LoadBalancer
  port: 80
  targetPort: 5000

ingress:
  enabled: false
  className: nginx
  annotations: {}
  hosts:
    - host: app.example.com
      paths:
        - path: /
          pathType: Prefix
  tls: []

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80

config:
  version: "1.0.0"
  logLevel: "INFO"
  environment: "production"
```

**File: `.github/workflows/helm-deploy.yml`**

```yaml
name: Helm Deploy

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Helm
      uses: azure/setup-helm@v3
      with:
        version: 'v3.13.0'

    - name: Set up kubectl
      uses: azure/setup-kubectl@v3

    - name: Configure kubectl
      run: |
        mkdir -p $HOME/.kube
        echo "${{ secrets.KUBECONFIG }}" | base64 -d > $HOME/.kube/config

    - name: Deploy with Helm
      run: |
        helm upgrade --install flask-app ./k8s/helm \
          --set image.tag=${{ github.sha }} \
          --set config.version=${{ github.sha }} \
          --wait \
          --timeout 5m \
          --atomic

    - name: Verify deployment
      run: |
        helm list
        kubectl get all -l app.kubernetes.io/name=flask-app
```

## Application Code

**File: `app/server.py`** (Updated for K8s)

```python
"""Flask server with Kubernetes-ready health checks."""

from flask import Flask, jsonify
import os
import sys

app = Flask(__name__)

VERSION = os.environ.get("APP_VERSION", "1.0.0")

@app.route("/")
def home():
    return jsonify({
        "message": "Hello from Kubernetes!",
        "version": VERSION,
        "python_version": sys.version
    })

@app.route("/health")
def health():
    """Kubernetes health check endpoint."""
    return jsonify({"status": "healthy"}), 200

@app.route("/ready")
def ready():
    """Kubernetes readiness check endpoint."""
    # Add actual readiness checks here (database, cache, etc.)
    return jsonify({"status": "ready"}), 200

@app.route("/version")
def version():
    return jsonify({"version": VERSION})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

## Verification Steps

### Local Testing with Minikube

1. **Start minikube:**
   ```bash
   minikube start
   ```

2. **Apply manifests:**
   ```bash
   kubectl apply -f k8s/
   ```

3. **Check deployment:**
   ```bash
   kubectl get deployments
   kubectl get pods
   kubectl get services
   ```

4. **Test locally:**
   ```bash
   minikube service flask-app-service
   ```

### GitHub Actions Testing

1. **Set up secrets:**
   - Go to repository Settings > Secrets
   - Add `KUBECONFIG` (base64 encoded kubeconfig file)

2. **Push and deploy:**
   ```bash
   git add .
   git commit -m "Add Kubernetes deployment"
   git push
   ```

3. **Monitor deployment:**
   - Check workflow logs
   - Verify pods are running
   - Test endpoints

## Troubleshooting

### Issue: ImagePullBackOff

**Solutions:**
```bash
# Check image pull secret
kubectl get secrets

# Create image pull secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_TOKEN
```

### Issue: CrashLoopBackOff

**Solutions:**
```bash
# Check pod logs
kubectl logs deployment/flask-app

# Check events
kubectl describe pod POD_NAME

# Check resource limits
kubectl describe deployment flask-app
```

### Issue: Service not accessible

**Solutions:**
```bash
# Check service
kubectl get svc

# Check endpoints
kubectl get endpoints

# Port forward for testing
kubectl port-forward deployment/flask-app 5000:5000
```

## Best Practices

### 1. Use Resource Limits
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

### 2. Implement Health Checks
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5000
readinessProbe:
  httpGet:
    path: /ready
    port: 5000
```

### 3. Use ConfigMaps for Configuration
```yaml
env:
- name: APP_VERSION
  valueFrom:
    configMapKeyRef:
      name: app-config
      key: version
```

### 4. Implement Rolling Updates
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1
    maxSurge: 1
```

### 5. Use Namespaces
```bash
kubectl create namespace production
kubectl apply -f k8s/ -n production
```

### 6. Tag Images Properly
```bash
# Use SHA tags for immutability
image: ghcr.io/org/app:sha-abc123

# Or semantic versions
image: ghcr.io/org/app:v1.2.3
```

## Summary

You've learned:
- Deploying to Kubernetes from GitHub Actions
- Managing Kubernetes manifests
- Using Helm for deployments
- Implementing health checks
- Rolling updates and deployments
- Best practices for K8s CI/CD

## Next Steps

Proceed to Tutorial 06: Secrets Management to learn about securely handling sensitive data in GitHub Actions.
