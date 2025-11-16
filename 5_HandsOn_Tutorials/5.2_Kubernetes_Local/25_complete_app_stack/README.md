# Kubernetes Tutorial 25: Complete Production Application Stack

## 🎯 Learning Objectives

- Deploy a complete production-ready application
- Apply all concepts from tutorials 11-24
- Implement multi-tier architecture
- Configure GitOps workflow
- Set up observability stack
- Implement security best practices
- Configure autoscaling and resilience
- Deploy to multiple environments

## 📋 Prerequisites

- Completed tutorials 01-24
- All tools installed (Helm, ArgoCD, etc.)
- Git repository available
- kind cluster with 8GB+ RAM

## 📝 What We're Building

```
Complete E-Commerce Application:
├── Frontend (React)
│   ├── Deployment (HPA enabled)
│   ├── Service
│   ├── Ingress (TLS with cert-manager)
│   └── ConfigMap
├── Backend API (Node.js)
│   ├── Deployment (multiple replicas)
│   ├── Service
│   ├── ConfigMap
│   ├── Sealed Secrets
│   └── ServiceAccount (RBAC)
├── Database (PostgreSQL)
│   ├── StatefulSet
│   ├── Service (headless)
│   ├── PVC
│   └── Sealed Secrets
├── Cache (Redis)
│   ├── StatefulSet
│   ├── Service
│   └── ConfigMap
├── Background Jobs
│   ├── CronJob (cleanup)
│   ├── Jobs (migrations)
│   └── ServiceAccount
├── Observability
│   ├── Prometheus (metrics)
│   ├── Grafana (dashboards)
│   ├── Loki (logs)
│   └── Jaeger (tracing)
├── Security
│   ├── NetworkPolicies
│   ├── RBAC (ServiceAccounts, Roles)
│   ├── Pod Security Standards
│   └── Resource Limits
└── GitOps
    ├── ArgoCD Applications
    ├── Sealed Secrets
    ├── Environments (dev, staging, prod)
    └── Helm Charts
```

## 🔍 Architecture Overview

### 1. **Application Tiers**

**Frontend Tier**:
- React SPA served by NGINX
- HPA: scales 2-10 pods based on CPU
- Ingress: TLS termination, path routing
- ConfigMap: environment config

**Backend Tier**:
- REST API (Node.js/Express)
- 3 replicas minimum
- Service mesh ready (Istio sidecar)
- Secrets: DB credentials, API keys

**Data Tier**:
- PostgreSQL StatefulSet
- Redis for caching and sessions
- Persistent storage (PVC)
- NetworkPolicy: only backend can access

**Job Tier**:
- Database migrations (Job)
- Daily cleanup (CronJob)
- Email notifications (CronJob)

### 2. **Cross-Cutting Concerns**

**Observability**:
- Metrics: Prometheus + ServiceMonitors
- Logs: Loki + Promtail
- Traces: Jaeger
- Dashboards: Grafana

**Security**:
- RBAC: Least privilege ServiceAccounts
- NetworkPolicies: Tier isolation
- Secrets: Sealed Secrets in Git
- Resource limits: All pods

**Resilience**:
- Readiness/Liveness probes
- PodDisruptionBudgets
- Resource requests/limits
- Circuit breakers (Istio)

## 📁 Step-by-Step Implementation

### Step 1: Prepare Git Repository

```bash
# Create repository structure
mkdir -p ~/ecommerce-app/{base,environments/{dev,staging,prod},charts}
cd ~/ecommerce-app

# Base structure
mkdir -p base/{frontend,backend,database,redis,jobs,monitoring,security}

# Create README
cat > README.md <<EOF
# E-Commerce Application - Production Kubernetes Deployment

Complete production-ready e-commerce application demonstrating:
- Multi-tier architecture
- GitOps with ArgoCD
- Observability with Prometheus/Grafana/Loki
- Security with RBAC, NetworkPolicies, Sealed Secrets
- High availability and autoscaling

## Structure
- base/: Base Kubernetes manifests
- environments/: Environment-specific overlays
- charts/: Helm charts
EOF

# Initialize Git
git init
git add README.md
git commit -m "Initial commit"
```

### Step 2: Deploy Database Tier

```bash
# Create PostgreSQL StatefulSet
cat > base/database/statefulset.yaml <<'EOF'
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
      tier: database
  template:
    metadata:
      labels:
        app: postgres
        tier: database
    spec:
      serviceAccountName: database-sa
      securityContext:
        fsGroup: 999
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_DB
          value: ecommerce
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 30
          periodSeconds: 10
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 5Gi
EOF

# Create Service
cat > base/database/service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  selector:
    app: postgres
    tier: database
  ports:
  - port: 5432
    targetPort: 5432
  clusterIP: None  # Headless service for StatefulSet
EOF

# Create sealed secret
kubectl create secret generic postgres-secret \
  --from-literal=username=admin \
  --from-literal=password=securepassword123 \
  --dry-run=client -o yaml | \
  kubeseal > base/database/sealed-secret.yaml

# Create ServiceAccount and RBAC
cat > base/database/rbac.yaml <<'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: database-sa
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: database-role
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: database-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: database-role
subjects:
- kind: ServiceAccount
  name: database-sa
EOF

# Apply
kubectl apply -f base/database/
```

### Step 3: Deploy Redis Cache

```bash
# Create Redis StatefulSet
cat > base/redis/statefulset.yaml <<'EOF'
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
spec:
  serviceName: redis
  replicas: 1
  selector:
    matchLabels:
      app: redis
      tier: cache
  template:
    metadata:
      labels:
        app: redis
        tier: cache
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
          name: redis
        command:
        - redis-server
        - --appendonly
        - "yes"
        - --requirepass
        - $(REDIS_PASSWORD)
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password
        volumeMounts:
        - name: redis-storage
          mountPath: /data
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "200m"
  volumeClaimTemplates:
  - metadata:
      name: redis-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 2Gi
EOF

# Create Service and Secret
cat > base/redis/service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: redis
spec:
  selector:
    app: redis
    tier: cache
  ports:
  - port: 6379
    targetPort: 6379
  clusterIP: None
EOF

kubectl create secret generic redis-secret \
  --from-literal=password=redissecret123 \
  --dry-run=client -o yaml | \
  kubeseal > base/redis/sealed-secret.yaml
```

### Step 4: Deploy Backend API

```bash
# Create Backend Deployment with full production config
cat > base/backend/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
      tier: api
  template:
    metadata:
      labels:
        app: backend
        tier: api
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: backend-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
      - name: api
        image: your-registry/ecommerce-backend:v1.0.0
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: "8080"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: backend-secret
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: backend-secret
              key: redis-url
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: backend-config
              key: log-level
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 10"]
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: backend
EOF

# Service, ConfigMap, Secrets, RBAC
cat > base/backend/service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: backend
  labels:
    app: backend
spec:
  selector:
    app: backend
  ports:
  - port: 8080
    targetPort: 8080
    name: http
  - port: 9090
    targetPort: 9090
    name: metrics
EOF

cat > base/backend/configmap.yaml <<'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
data:
  log-level: "info"
  max-connections: "100"
  timeout: "30s"
EOF

# Create sealed secrets with DB and Redis URLs
kubectl create secret generic backend-secret \
  --from-literal=database-url='postgresql://admin:securepassword123@postgres:5432/ecommerce' \
  --from-literal=redis-url='redis://:redissecret123@redis:6379/0' \
  --from-literal=jwt-secret='your-jwt-secret-key-here' \
  --dry-run=client -o yaml | \
  kubeseal > base/backend/sealed-secret.yaml

# HPA
cat > base/backend/hpa.yaml <<'EOF'
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF

# ServiceMonitor for Prometheus
cat > base/backend/servicemonitor.yaml <<'EOF'
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: backend-metrics
spec:
  selector:
    matchLabels:
      app: backend
  endpoints:
  - port: metrics
    path: /metrics
    interval: 30s
EOF
```

### Step 5: Deploy Frontend

```bash
# Frontend with all production features
# Similar structure to backend but serves static files
# (Deployment, Service, ConfigMap, HPA, Ingress with TLS)

# Create Ingress with cert-manager
cat > base/frontend/ingress.yaml <<'EOF'
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: frontend-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - ecommerce.example.com
    secretName: frontend-tls
  rules:
  - host: ecommerce.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 8080
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
EOF
```

### Step 6: Deploy Background Jobs

```bash
# Database migration Job
cat > base/jobs/db-migration.yaml <<'EOF'
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
spec:
  ttlSecondsAfterFinished: 3600
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: migrate
        image: your-registry/ecommerce-backend:v1.0.0
        command: ["npm", "run", "migrate"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: backend-secret
              key: database-url
EOF

# Cleanup CronJob
cat > base/jobs/cleanup-cronjob.yaml <<'EOF'
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup-old-data
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      ttlSecondsAfterFinished: 86400
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: cleanup
            image: your-registry/ecommerce-backend:v1.0.0
            command: ["npm", "run", "cleanup"]
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: database-url
EOF
```

### Step 7: Implement Security (NetworkPolicies)

```bash
# Network policy for database isolation
cat > base/security/network-policy-database.yaml <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-policy
spec:
  podSelector:
    matchLabels:
      tier: database
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Only backend can access database
  - from:
    - podSelector:
        matchLabels:
          tier: api
    ports:
    - protocol: TCP
      port: 5432
  egress:
  # Database can access DNS only
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - protocol: UDP
      port: 53
EOF

# Network policy for backend
cat > base/security/network-policy-backend.yaml <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
spec:
  podSelector:
    matchLabels:
      tier: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Allow from frontend and ingress
  - from:
    - podSelector:
        matchLabels:
          tier: frontend
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  # Allow to database, redis, and external APIs
  - to:
    - podSelector:
        matchLabels:
          tier: database
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          tier: cache
    ports:
    - protocol: TCP
      port: 6379
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - protocol: UDP
      port: 53
EOF
```

### Step 8: Set up ArgoCD Applications

```bash
# Create ArgoCD Application for production
cat > argocd/production.yaml <<'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ecommerce-prod
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/yourusername/ecommerce-app
    targetRevision: main
    path: environments/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
    - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
EOF

kubectl apply -f argocd/production.yaml
```

### Step 9: Configure Monitoring Dashboards

```bash
# Create Grafana dashboard ConfigMap
# (Dashboard JSON for complete application monitoring)

# Create PrometheusRule for alerts
cat > base/monitoring/prometheus-rules.yaml <<'EOF'
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ecommerce-alerts
spec:
  groups:
  - name: ecommerce
    interval: 30s
    rules:
    - alert: HighErrorRate
      expr: |
        sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
        / sum(rate(http_requests_total[5m])) by (service) > 0.05
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High error rate on {{ $labels.service }}"
        description: "Error rate is {{ $value | humanizePercentage }}"

    - alert: PodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"

    - alert: DatabaseDown
      expr: up{job="postgres"} == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "PostgreSQL database is down"
EOF
```

### Step 10: Deploy Everything with ArgoCD

```bash
# Commit all changes to Git
cd ~/ecommerce-app
git add .
git commit -m "Complete production application stack"
git push origin main

# ArgoCD will automatically deploy based on Application spec

# Monitor deployment
argocd app get ecommerce-prod
argocd app sync ecommerce-prod
argocd app wait ecommerce-prod --health

# Verify all components
kubectl get all -n production
kubectl get pvc -n production
kubectl get networkpolicies -n production
kubectl get sealedsecrets -n production
```

## ✅ Verification Checklist

### 1. Application Health

```bash
# Check all deployments
kubectl get deployments -n production

# Verify all pods running
kubectl get pods -n production

# Check HPA status
kubectl get hpa -n production

# Test endpoints
curl https://ecommerce.example.com/api/health
```

### 2. Database and Storage

```bash
# Check StatefulSets
kubectl get statefulsets -n production

# Verify PVCs
kubectl get pvc -n production

# Test database connection
kubectl exec -it postgres-0 -n production -- psql -U admin -d ecommerce -c "SELECT version();"
```

### 3. Security

```bash
# Verify NetworkPolicies
kubectl get networkpolicies -n production

# Check RBAC
kubectl get serviceaccounts,roles,rolebindings -n production

# Verify sealed secrets decrypted
kubectl get secrets -n production
```

### 4. Monitoring

```bash
# Check ServiceMonitors
kubectl get servicemonitors -n production

# Verify metrics in Prometheus
# Query: up{namespace="production"}

# Check Grafana dashboards
# Import dashboard for complete application overview
```

### 5. GitOps

```bash
# Check ArgoCD sync status
argocd app get ecommerce-prod

# Verify all resources tracked
argocd app resources ecommerce-prod

# Check sync history
argocd app history ecommerce-prod
```

## 📚 What You Accomplished

✅ Deployed complete multi-tier application
✅ Implemented GitOps with ArgoCD
✅ Configured autoscaling (HPA)
✅ Set up observability (Prometheus, Grafana, Loki)
✅ Implemented security (RBAC, NetworkPolicies, Sealed Secrets)
✅ Configured high availability (PDB, replicas)
✅ Deployed background jobs (CronJobs)
✅ Set up TLS with cert-manager
✅ Implemented resource limits
✅ Configured multi-environment deployments

## 🎓 Production Best Practices Applied

1. **High Availability**: Multiple replicas, PodDisruptionBudgets
2. **Autoscaling**: HPA for variable load
3. **Security**: RBAC, NetworkPolicies, Sealed Secrets, non-root containers
4. **Observability**: Metrics, logs, traces, alerts
5. **GitOps**: Infrastructure as Code, versioned, auditable
6. **Resource Management**: Requests/limits, quotas
7. **Resilience**: Probes, graceful shutdown, circuit breakers
8. **Data Persistence**: StatefulSets, PVCs
9. **Secrets Management**: Sealed Secrets, not in plain text
10. **CI/CD**: Automated deployments via ArgoCD

## 🔜 Next Steps

Congratulations! You've completed all 25 Kubernetes tutorials and deployed a production-ready application!

**Continue Learning**:
- Advanced Istio features
- Multi-cluster deployments
- Advanced Helm patterns
- Kubernetes operators
- Custom controllers
- Production troubleshooting
- Performance optimization
- Cost optimization
- Disaster recovery planning

## 📖 References

This complete application demonstrates concepts from:
- Tutorial 11: CronJobs for background tasks
- Tutorial 12: RBAC for security
- Tutorial 13: NetworkPolicies for isolation
- Tutorial 14: Resource limits for stability
- Tutorial 15: HPA for autoscaling
- Tutorial 16-17: Helm for package management
- Tutorial 18: Prometheus for metrics
- Tutorial 19: Loki for logs
- Tutorial 20: Service mesh patterns
- Tutorial 21: Cert-manager for TLS
- Tutorial 22: Ingress for routing
- Tutorial 23: ArgoCD for GitOps
- Tutorial 24: Sealed Secrets for security

---

**Estimated Time**: 3-4 hours
**Difficulty**: Advanced
**Prerequisites**: Tutorials 01-24 completed

**Congratulations on completing all 25 Kubernetes tutorials!**
