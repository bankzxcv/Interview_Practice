# Kubernetes Tutorial 23: GitOps with ArgoCD

## 🎯 Learning Objectives

- Understand GitOps principles
- Install ArgoCD
- Deploy applications from Git
- Implement automated sync
- Configure multi-environment deployments
- Use ArgoCD CLI and UI
- Implement ApplicationSets
- Handle secrets with GitOps
- Set up webhooks for auto-sync

## 📋 Prerequisites

- Completed tutorials 01-22
- Git repository (GitHub, GitLab, etc.)
- Helm installed
- kubectl configured

## 📝 What We're Building

```
GitOps Workflow:
├── Git Repository (source of truth)
│   ├── Kubernetes manifests
│   ├── Helm charts
│   └── Kustomize overlays
├── ArgoCD (continuous deployment)
│   ├── Application Controller
│   ├── Repo Server
│   └── UI/API Server
└── Kubernetes Cluster (target)
    └── Applications deployed by ArgoCD
```

## 🔍 Concepts Deep Dive

### 1. **GitOps Principles**

**Declarative**:
- Entire system state in Git
- Infrastructure as Code

**Versioned and Immutable**:
- Git commits are immutable
- Full audit trail

**Pulled Automatically**:
- ArgoCD pulls from Git
- No push access to cluster needed

**Continuously Reconciled**:
- Actual state → Desired state
- Auto-sync or manual approval

### 2. **ArgoCD Components**

**API Server**:
- Web UI and API
- Application management

**Repository Server**:
- Clones Git repos
- Generates manifests

**Application Controller**:
- Monitors applications
- Reconciles desired vs actual state

### 3. **Application Structure**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/user/repo
    targetRevision: HEAD
    path: manifests/production
  destination:
    server: https://kubernetes.default.svc
    namespace: myapp
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## 📁 Step-by-Step Implementation

### Step 1: Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d; echo

# Port-forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443 &

# Access UI: https://localhost:8080
# Username: admin
# Password: (from command above)
```

### Step 2: Install ArgoCD CLI

```bash
# Download ArgoCD CLI (Linux)
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd
sudo mv argocd /usr/local/bin/

# Login via CLI
argocd login localhost:8080 --insecure

# Change password
argocd account update-password

# Check version
argocd version
```

### Step 3: Create Git Repository

```bash
# Create sample app repository structure
mkdir -p ~/argocd-demo/apps/guestbook
cd ~/argocd-demo

# Create Kubernetes manifests
cat > apps/guestbook/deployment.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: guestbook
spec:
  replicas: 2
  selector:
    matchLabels:
      app: guestbook
  template:
    metadata:
      labels:
        app: guestbook
    spec:
      containers:
      - name: guestbook
        image: gcr.io/heptio-images/ks-guestbook-demo:0.2
        ports:
        - containerPort: 80
EOF

cat > apps/guestbook/service.yaml <<EOF
apiVersion: v1
kind: Service
metadata:
  name: guestbook
spec:
  selector:
    app: guestbook
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
EOF

# Initialize Git and push
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-git-repo-url>
git push -u origin main
```

### Step 4: Create Application via UI

```bash
# In ArgoCD UI (https://localhost:8080):
# 1. Click "+ NEW APP"
# 2. Fill in:
#    - Application Name: guestbook
#    - Project: default
#    - Sync Policy: Manual
#    - Repository URL: <your-git-repo-url>
#    - Path: apps/guestbook
#    - Cluster: in-cluster
#    - Namespace: default
# 3. Click "CREATE"
```

### Step 5: Create Application via CLI

```bash
# Create application
argocd app create guestbook \
  --repo <your-git-repo-url> \
  --path apps/guestbook \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace default

# List applications
argocd app list

# Get application details
argocd app get guestbook

# View application in UI
# https://localhost:8080/applications/guestbook
```

### Step 6: Sync Application

```bash
# Manual sync via CLI
argocd app sync guestbook

# Check sync status
argocd app get guestbook

# View resources
kubectl get all -n default -l app=guestbook

# Or sync via UI:
# Click application → SYNC → SYNCHRONIZE
```

### Step 7: Enable Auto-Sync

```bash
# Enable auto-sync
argocd app set guestbook --sync-policy automated

# Enable auto-prune (delete resources not in Git)
argocd app set guestbook --auto-prune

# Enable self-heal (auto-sync when changes detected)
argocd app set guestbook --self-heal

# Or via manifest:
cat > application.yaml <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: guestbook
  namespace: argocd
spec:
  destination:
    namespace: default
    server: https://kubernetes.default.svc
  source:
    path: apps/guestbook
    repoURL: <your-git-repo-url>
    targetRevision: HEAD
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
    - CreateNamespace=true
EOF

kubectl apply -f application.yaml -n argocd
```

### Step 8: Test GitOps Workflow

```bash
# Make change in Git
cd ~/argocd-demo/apps/guestbook
sed -i 's/replicas: 2/replicas: 3/' deployment.yaml
git add .
git commit -m "Scale to 3 replicas"
git push

# ArgoCD detects change (auto-sync)
# Or manually sync:
argocd app sync guestbook

# Verify change
kubectl get deployment guestbook -o jsonpath='{.spec.replicas}'
# Should show: 3
```

### Step 9: Multi-Environment Setup

```bash
# Create environment structure
mkdir -p apps/myapp/{base,overlays/{dev,staging,prod}}

# Base manifests
cat > apps/myapp/base/kustomization.yaml <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
EOF

# Dev overlay
cat > apps/myapp/overlays/dev/kustomization.yaml <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
- ../../base
namePrefix: dev-
replicas:
- name: myapp
  count: 1
EOF

# Prod overlay
cat > apps/myapp/overlays/prod/kustomization.yaml <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
- ../../base
namePrefix: prod-
replicas:
- name: myapp
  count: 5
EOF

# Create ArgoCD applications for each environment
argocd app create myapp-dev \
  --repo <repo-url> \
  --path apps/myapp/overlays/dev \
  --dest-namespace dev \
  --dest-server https://kubernetes.default.svc

argocd app create myapp-prod \
  --repo <repo-url> \
  --path apps/myapp/overlays/prod \
  --dest-namespace prod \
  --dest-server https://kubernetes.default.svc
```

### Step 10: ApplicationSet for Multiple Clusters

```bash
# Create ApplicationSet
cat > applicationset.yaml <<EOF
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: guestbook
  namespace: argocd
spec:
  generators:
  - list:
      elements:
      - cluster: dev
        url: https://dev.cluster.local
      - cluster: staging
        url: https://staging.cluster.local
      - cluster: prod
        url: https://prod.cluster.local
  template:
    metadata:
      name: '{{cluster}}-guestbook'
    spec:
      project: default
      source:
        repoURL: <repo-url>
        targetRevision: HEAD
        path: apps/guestbook
      destination:
        server: '{{url}}'
        namespace: guestbook
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
EOF

kubectl apply -f applicationset.yaml -n argocd
```

## ✅ Verification

### 1. Check ArgoCD Status

```bash
# Check pods
kubectl get pods -n argocd

# Check applications
argocd app list

# Get application details
argocd app get guestbook
```

### 2. Verify Sync Status

```bash
# Check if synced
argocd app get guestbook | grep "Sync Status"

# View sync history
argocd app history guestbook

# Check last sync result
argocd app get guestbook -o json | jq '.status.sync'
```

### 3. Validate Deployed Resources

```bash
# List resources managed by ArgoCD
kubectl get all -l app.kubernetes.io/instance=guestbook

# Compare with Git
argocd app diff guestbook

# Should show no differences if in sync
```

## 🧪 Hands-On Exercises

### Exercise 1: Helm Chart Deployment

**Task**: Deploy Helm chart via ArgoCD:
- Create Application pointing to Helm chart
- Override values
- Upgrade chart version

### Exercise 2: Multi-Cluster Deployment

**Task**: Deploy to multiple clusters:
- Register multiple clusters
- Use ApplicationSet
- Deploy same app to all clusters

### Exercise 3: Progressive Delivery

**Task**: Implement canary with Argo Rollouts:
- Install Argo Rollouts
- Create Rollout resource
- Configure traffic splitting

## 🧹 Cleanup

```bash
# Delete applications
argocd app delete guestbook --yes

# Uninstall ArgoCD
kubectl delete -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Delete namespace
kubectl delete namespace argocd
```

## 📚 What You Learned

✅ Installed ArgoCD
✅ Deployed applications from Git
✅ Implemented GitOps workflow
✅ Configured auto-sync
✅ Set up multi-environment deployments
✅ Used ArgoCD CLI and UI
✅ Created ApplicationSets

## 🎓 Key Concepts

### GitOps Benefits

1. **Single Source of Truth**: Git contains all configuration
2. **Version Control**: Full history and rollback
3. **Automated Deployment**: Push to Git → auto-deploy
4. **Improved Security**: No direct cluster access needed
5. **Audit Trail**: Git log shows all changes
6. **Disaster Recovery**: Recreate cluster from Git

### Sync Strategies

**Manual**:
- Review changes before sync
- Explicit approval

**Automated**:
- Auto-sync on Git changes
- Optional: prune, selfHeal

**Sync Waves**:
```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"
```

## 🔜 Next Steps

**Tutorial 24**: Sealed Secrets - Encrypted secrets for GitOps
- Install Sealed Secrets
- Encrypt secrets
- Store in Git safely

## 💡 Pro Tips

1. **View app tree**:
   ```bash
   argocd app get guestbook --show-operation
   ```

2. **Force refresh**:
   ```bash
   argocd app get guestbook --refresh
   ```

3. **Set target revision**:
   ```bash
   argocd app set guestbook --revision main
   ```

4. **Rollback**:
   ```bash
   argocd app history guestbook
   argocd app rollback guestbook <history-id>
   ```

5. **Export app manifest**:
   ```bash
   argocd app get guestbook -o yaml > app-backup.yaml
   ```

## 🆘 Troubleshooting

**Problem**: Application stuck in "Progressing"
**Solution**: Check sync status:
```bash
argocd app get guestbook
kubectl logs -n argocd deployment/argocd-application-controller
```

**Problem**: Sync fails
**Solution**: Check application events:
```bash
argocd app get guestbook
kubectl describe application guestbook -n argocd
```

**Problem**: Can't access private repository
**Solution**: Add repository credentials:
```bash
argocd repo add <repo-url> --username <user> --password <pass>
```

## 📖 Additional Reading

- [ArgoCD Official Docs](https://argo-cd.readthedocs.io/)
- [GitOps Principles](https://opengitops.dev/)
- [ArgoCD Best Practices](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/)

---

**Estimated Time**: 90-120 minutes
**Difficulty**: Intermediate to Advanced
**Prerequisites**: Tutorials 01-22 completed

**Next**: Tutorial 24 - Sealed Secrets
