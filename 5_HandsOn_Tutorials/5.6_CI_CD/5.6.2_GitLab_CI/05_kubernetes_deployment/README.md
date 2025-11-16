# Tutorial 05: Kubernetes Deployment with GitLab CI

## Objectives

By the end of this tutorial, you will:
- Deploy applications to Kubernetes from GitLab CI
- Use kubectl in CI pipelines
- Implement GitLab Kubernetes Agent integration
- Deploy with Helm charts
- Manage multiple environments (dev, staging, prod)
- Implement rolling updates and rollbacks
- Use GitLab environment tracking

## Prerequisites

- Completed Tutorial 04: Docker Integration
- Basic Kubernetes knowledge
- Access to a Kubernetes cluster
- kubectl installed locally
- Understanding of Kubernetes manifests

## What is Kubernetes Deployment in CI/CD?

Kubernetes deployment in CI/CD automates the process of deploying containerized applications to Kubernetes clusters, ensuring consistent and reliable deployments across environments.

## Key Concepts

### kubectl
Command-line tool for interacting with Kubernetes clusters.

### Kubernetes Agent
GitLab's recommended way to connect GitLab with Kubernetes clusters securely.

### Helm
Package manager for Kubernetes that simplifies application deployment.

### GitLab Environments
Track deployments and provide rollback capabilities through GitLab UI.

### Namespaces
Kubernetes mechanism for isolating resources for different environments.

## Step-by-Step Instructions

### Step 1: Basic Kubernetes Deployment

Create `.gitlab-ci.yml` for basic K8s deployment:

```yaml
stages:
  - build
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
  KUBE_NAMESPACE: default
  APP_NAME: myapp

# Build and push Docker image
build-image:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - docker build -t ${DOCKER_IMAGE} .
    - docker push ${DOCKER_IMAGE}
  only:
    - main
    - develop

# Deploy to Kubernetes
deploy-k8s:
  stage: deploy
  image: bitnami/kubectl:latest
  before_script:
    - kubectl version --client
    - kubectl config use-context ${KUBE_CONTEXT}
  script:
    - echo "Deploying to Kubernetes..."
    - envsubst < k8s/deployment.yaml | kubectl apply -f -
    - envsubst < k8s/service.yaml | kubectl apply -f -
    - kubectl rollout status deployment/${APP_NAME} -n ${KUBE_NAMESPACE}
    - kubectl get pods -n ${KUBE_NAMESPACE} -l app=${APP_NAME}
  environment:
    name: production
    url: https://myapp.example.com
    kubernetes:
      namespace: ${KUBE_NAMESPACE}
  only:
    - main
  needs:
    - build-image
```

### Step 2: Kubernetes Manifests

**File: `k8s/deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${APP_NAME}
  namespace: ${KUBE_NAMESPACE}
  labels:
    app: ${APP_NAME}
    version: ${CI_COMMIT_SHORT_SHA}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${APP_NAME}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: ${APP_NAME}
        version: ${CI_COMMIT_SHORT_SHA}
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      containers:
      - name: ${APP_NAME}
        image: ${DOCKER_IMAGE}
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
          protocol: TCP
        env:
        - name: APP_VERSION
          value: "${CI_COMMIT_SHORT_SHA}"
        - name: ENVIRONMENT
          value: "${CI_ENVIRONMENT_NAME}"
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
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
      imagePullSecrets:
      - name: gitlab-registry
```

**File: `k8s/service.yaml`**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ${APP_NAME}
  namespace: ${KUBE_NAMESPACE}
  labels:
    app: ${APP_NAME}
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: ${APP_NAME}
```

**File: `k8s/ingress.yaml`**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${APP_NAME}
  namespace: ${KUBE_NAMESPACE}
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - ${APP_URL}
    secretName: ${APP_NAME}-tls
  rules:
  - host: ${APP_URL}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${APP_NAME}
            port:
              number: 80
```

### Step 3: Multi-Environment Deployment

Create `.gitlab-ci.yml` for multiple environments:

```yaml
stages:
  - build
  - deploy-dev
  - deploy-staging
  - deploy-prod

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE
  APP_NAME: myapp

# Build once, deploy many
build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - docker build -t ${DOCKER_IMAGE}:${CI_COMMIT_SHORT_SHA} .
    - docker push ${DOCKER_IMAGE}:${CI_COMMIT_SHORT_SHA}
  only:
    - main
    - develop

# Deploy to dev (automatic)
.deploy-template: &deploy-template
  image: bitnami/kubectl:latest
  before_script:
    - kubectl version --client
    - kubectl config use-context ${KUBE_CONTEXT}
  script:
    - export DOCKER_IMAGE_TAG=${DOCKER_IMAGE}:${CI_COMMIT_SHORT_SHA}
    - envsubst < k8s/deployment.yaml | kubectl apply -f -
    - envsubst < k8s/service.yaml | kubectl apply -f -
    - kubectl rollout status deployment/${APP_NAME} -n ${KUBE_NAMESPACE}
    - kubectl get all -n ${KUBE_NAMESPACE} -l app=${APP_NAME}

deploy-dev:
  <<: *deploy-template
  stage: deploy-dev
  variables:
    KUBE_NAMESPACE: dev
    KUBE_CONTEXT: dev-cluster
  environment:
    name: development
    url: https://dev.myapp.example.com
    on_stop: stop-dev
    kubernetes:
      namespace: dev
  only:
    - develop
  needs:
    - build

# Deploy to staging (automatic on main)
deploy-staging:
  <<: *deploy-template
  stage: deploy-staging
  variables:
    KUBE_NAMESPACE: staging
    KUBE_CONTEXT: staging-cluster
  environment:
    name: staging
    url: https://staging.myapp.example.com
    on_stop: stop-staging
    kubernetes:
      namespace: staging
  only:
    - main
  needs:
    - build

# Deploy to production (manual)
deploy-prod:
  <<: *deploy-template
  stage: deploy-prod
  variables:
    KUBE_NAMESPACE: production
    KUBE_CONTEXT: prod-cluster
  environment:
    name: production
    url: https://myapp.example.com
    on_stop: stop-prod
    kubernetes:
      namespace: production
  when: manual
  only:
    - main
  needs:
    - build
    - deploy-staging

# Stop environments
.stop-template: &stop-template
  image: bitnami/kubectl:latest
  before_script:
    - kubectl config use-context ${KUBE_CONTEXT}
  script:
    - kubectl delete all -l app=${APP_NAME} -n ${KUBE_NAMESPACE}
  when: manual

stop-dev:
  <<: *stop-template
  stage: deploy-dev
  variables:
    KUBE_NAMESPACE: dev
    KUBE_CONTEXT: dev-cluster
  environment:
    name: development
    action: stop

stop-staging:
  <<: *stop-template
  stage: deploy-staging
  variables:
    KUBE_NAMESPACE: staging
    KUBE_CONTEXT: staging-cluster
  environment:
    name: staging
    action: stop

stop-prod:
  <<: *stop-template
  stage: deploy-prod
  variables:
    KUBE_NAMESPACE: production
    KUBE_CONTEXT: prod-cluster
  environment:
    name: production
    action: stop
```

### Step 4: Helm Chart Deployment

Create `.gitlab-ci.yml` using Helm:

```yaml
stages:
  - build
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
  HELM_CHART: ./helm/myapp
  RELEASE_NAME: myapp

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - docker build -t ${DOCKER_IMAGE} .
    - docker push ${DOCKER_IMAGE}

# Deploy with Helm
deploy-helm:
  stage: deploy
  image: alpine/helm:latest
  before_script:
    - kubectl config use-context ${KUBE_CONTEXT}
    - helm version
  script:
    - echo "Deploying with Helm..."
    - |
      helm upgrade --install ${RELEASE_NAME} ${HELM_CHART} \
        --namespace ${KUBE_NAMESPACE} \
        --create-namespace \
        --set image.repository=${CI_REGISTRY_IMAGE} \
        --set image.tag=${CI_COMMIT_SHORT_SHA} \
        --set ingress.host=${APP_URL} \
        --set environment=${CI_ENVIRONMENT_NAME} \
        --wait \
        --timeout 5m
    - helm status ${RELEASE_NAME} -n ${KUBE_NAMESPACE}
    - kubectl get all -n ${KUBE_NAMESPACE} -l app.kubernetes.io/instance=${RELEASE_NAME}
  environment:
    name: ${CI_COMMIT_REF_NAME}
    url: https://${APP_URL}
    kubernetes:
      namespace: ${KUBE_NAMESPACE}
  needs:
    - build
```

**File: `helm/myapp/Chart.yaml`**

```yaml
apiVersion: v2
name: myapp
description: My Application Helm Chart
type: application
version: 1.0.0
appVersion: "1.0.0"
```

**File: `helm/myapp/values.yaml`**

```yaml
replicaCount: 3

image:
  repository: registry.gitlab.com/username/project
  pullPolicy: Always
  tag: "latest"

imagePullSecrets:
  - name: gitlab-registry

nameOverride: ""
fullnameOverride: ""

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  host: myapp.example.com
  tls:
    enabled: true

resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"

autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80

env:
  - name: ENVIRONMENT
    value: "production"

livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
```

**File: `helm/myapp/templates/deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.service.targetPort }}
          protocol: TCP
        {{- with .Values.env }}
        env:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.livenessProbe }}
        livenessProbe:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.readinessProbe }}
        readinessProbe:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
```

### Step 5: GitLab Kubernetes Agent

Create `.gitlab-ci.yml` using GitLab Agent:

```yaml
deploy:
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context <path-to>/agent:<agent-name>
    - kubectl apply -f k8s/
    - kubectl rollout status deployment/myapp
  environment:
    name: production
    kubernetes:
      namespace: production
```

### Step 6: Blue-Green Deployment

Create `.gitlab-ci.yml` for blue-green deployment:

```yaml
stages:
  - build
  - deploy-green
  - switch-traffic
  - cleanup

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
  APP_NAME: myapp
  KUBE_NAMESPACE: production

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - docker build -t ${DOCKER_IMAGE} .
    - docker push ${DOCKER_IMAGE}

# Deploy green version
deploy-green:
  stage: deploy-green
  image: bitnami/kubectl:latest
  before_script:
    - kubectl config use-context ${KUBE_CONTEXT}
  script:
    - |
      # Deploy green version
      export DEPLOYMENT_COLOR=green
      export DOCKER_IMAGE_TAG=${DOCKER_IMAGE}
      envsubst < k8s/deployment-blue-green.yaml | kubectl apply -f -
      kubectl rollout status deployment/${APP_NAME}-green -n ${KUBE_NAMESPACE}

      # Test green deployment
      kubectl port-forward svc/${APP_NAME}-green 8080:80 -n ${KUBE_NAMESPACE} &
      sleep 5
      curl -f http://localhost:8080/health || exit 1
  needs:
    - build

# Switch traffic to green
switch-traffic:
  stage: switch-traffic
  image: bitnami/kubectl:latest
  before_script:
    - kubectl config use-context ${KUBE_CONTEXT}
  script:
    - |
      echo "Switching traffic to green deployment..."
      kubectl patch service ${APP_NAME} -n ${KUBE_NAMESPACE} -p '{"spec":{"selector":{"color":"green"}}}'
      echo "Traffic switched to green!"
  when: manual
  needs:
    - deploy-green

# Remove blue deployment
cleanup-blue:
  stage: cleanup
  image: bitnami/kubectl:latest
  before_script:
    - kubectl config use-context ${KUBE_CONTEXT}
  script:
    - kubectl delete deployment ${APP_NAME}-blue -n ${KUBE_NAMESPACE} || true
  when: manual
  needs:
    - switch-traffic
```

## Verification Steps

### Local Testing

1. **Test kubectl connection:**
   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```

2. **Validate manifests:**
   ```bash
   kubectl apply --dry-run=client -f k8s/
   kubectl apply --dry-run=server -f k8s/
   ```

3. **Test Helm chart:**
   ```bash
   helm lint helm/myapp
   helm template myapp helm/myapp --debug
   helm install --dry-run myapp helm/myapp
   ```

### GitLab CI Verification

1. **View deployment logs:**
   - Go to CI/CD > Pipelines
   - Check deploy job logs
   - Verify kubectl commands executed

2. **Check environments:**
   - Go to Deployments > Environments
   - View environment details
   - Check deployment history

3. **Verify application:**
   ```bash
   kubectl get pods -n production
   kubectl logs -n production -l app=myapp
   curl https://myapp.example.com/health
   ```

## Troubleshooting

### Issue: Connection refused to cluster

**Problem:** Cannot connect to Kubernetes cluster.

**Solutions:**
1. Verify KUBECONFIG is set correctly
2. Check cluster credentials
3. Ensure GitLab Agent is connected
4. Test with `kubectl cluster-info`

### Issue: Image pull failed

**Problem:** Kubernetes cannot pull Docker image.

**Solutions:**
1. Create image pull secret
2. Verify registry credentials
3. Check image name and tag
4. Ensure image exists in registry

### Issue: Deployment timeout

**Problem:** Deployment doesn't complete in time.

**Solutions:**
1. Check pod logs: `kubectl logs -n namespace pod-name`
2. Describe pod: `kubectl describe pod -n namespace pod-name`
3. Check resource limits
4. Verify image pull secrets
5. Check liveness/readiness probes

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
    port: 8080
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
```

### 3. Use Namespaces
```bash
kubectl create namespace production
kubectl apply -f manifests/ -n production
```

### 4. Tag Images Properly
```bash
docker tag app:latest app:${CI_COMMIT_SHORT_SHA}
docker tag app:latest app:${CI_COMMIT_TAG}
```

### 5. Implement Rollback Strategy
```bash
kubectl rollout undo deployment/myapp
kubectl rollout history deployment/myapp
```

## Additional Resources

- [GitLab Kubernetes Integration](https://docs.gitlab.com/ee/user/infrastructure/clusters/)
- [GitLab Kubernetes Agent](https://docs.gitlab.com/ee/user/clusters/agent/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)

## Next Steps

After completing this tutorial:
1. Implement auto-scaling
2. Add monitoring and logging
3. Set up disaster recovery
4. Move on to Tutorial 06: Secrets and Variables

## Summary

You've learned:
- Deploying applications to Kubernetes from GitLab CI
- Using kubectl and Helm in pipelines
- Multi-environment deployment strategies
- GitLab environment tracking
- Blue-green deployments
- Health checks and rollouts
- Best practices for K8s deployments

This knowledge enables you to deploy containerized applications to Kubernetes reliably.
