# Kubernetes Tutorial 16: Helm Basics

## 🎯 Learning Objectives

- Understand Helm and package management
- Install and configure Helm
- Search and install Helm charts
- Manage Helm releases
- Use Helm repositories
- Upgrade and rollback releases
- Customize charts with values
- Understand chart structure

## 📋 Prerequisites

- Completed tutorials 01-15
- kind cluster running
- kubectl configured

## 📝 What We're Building

```
Helm Ecosystem:
├── Helm CLI (client tool)
├── Chart Repository (chart storage)
├── Charts (Kubernetes packages)
│   ├── Chart.yaml (metadata)
│   ├── values.yaml (configuration)
│   └── templates/ (K8s manifests)
└── Releases (deployed instances)
```

## 🔍 Concepts Deep Dive

### 1. **What is Helm?**

**Package Manager** for Kubernetes:
- Like apt/yum for Linux
- Like npm for Node.js
- Packages called "Charts"
- Installed instances called "Releases"

**Benefits**:
- Simplified deployment
- Versioned packages
- Easy upgrades and rollbacks
- Templating and customization
- Dependency management

### 2. **Helm Architecture**

**Helm 3** (current version):
```
Helm CLI → Kubernetes API Server
- No Tiller (removed in v3)
- Direct interaction with K8s API
- Release info stored as Secrets
```

### 3. **Chart Structure**

```
mychart/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default configuration values
├── charts/             # Chart dependencies
├── templates/          # Kubernetes manifest templates
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── _helpers.tpl   # Template helpers
│   └── NOTES.txt      # Post-install notes
└── .helmignore        # Files to ignore
```

### 4. **Key Commands**

```bash
helm repo add          # Add chart repository
helm repo update       # Update repo index
helm search            # Search for charts
helm install           # Install a chart
helm upgrade           # Upgrade a release
helm rollback          # Rollback to previous version
helm uninstall         # Delete a release
helm list              # List releases
helm get               # Get release info
helm status            # Display status of release
```

## 📁 Step-by-Step Implementation

### Step 1: Install Helm

```bash
# Install Helm (Linux)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Or download from https://github.com/helm/helm/releases

# Verify installation
helm version

# Check Helm is working
helm list
```

### Step 2: Add Chart Repositories

```bash
# Add official charts repository
helm repo add bitnami https://charts.bitnami.com/bitnami

# Add other popular repos
helm repo add nginx-stable https://helm.nginx.com/stable
helm repo add jetstack https://charts.jetstack.io
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Update repository index
helm repo update

# List repositories
helm repo list

# Search for charts
helm search repo nginx
helm search repo postgresql
```

### Step 3: Install First Chart (nginx)

```bash
# Create namespace
kubectl create namespace helm-demo

# Install nginx chart
helm install my-nginx bitnami/nginx \
  --namespace helm-demo

# List releases
helm list -n helm-demo

# Check what was created
kubectl get all -n helm-demo
```

### Step 4: Check Release Status

```bash
# Get release status
helm status my-nginx -n helm-demo

# Get release values
helm get values my-nginx -n helm-demo

# Get all values (including defaults)
helm get values my-nginx -n helm-demo --all

# Get release manifest
helm get manifest my-nginx -n helm-demo
```

### Step 5: Customize Chart with Values

```bash
# Create custom values file
cat > custom-values.yaml <<EOF
replicaCount: 3
service:
  type: NodePort
  nodePorts:
    http: 30080
image:
  tag: 1.25.3-alpine
EOF

# Install with custom values
helm install my-custom-nginx bitnami/nginx \
  --namespace helm-demo \
  --values custom-values.yaml

# Or use --set for individual values
helm install my-nginx2 bitnami/nginx \
  --namespace helm-demo \
  --set replicaCount=2 \
  --set service.type=ClusterIP
```

### Step 6: Upgrade Release

```bash
# Modify values
cat > updated-values.yaml <<EOF
replicaCount: 5
service:
  type: LoadBalancer
EOF

# Upgrade release
helm upgrade my-nginx bitnami/nginx \
  --namespace helm-demo \
  --values updated-values.yaml

# Check revision
helm list -n helm-demo

# See release history
helm history my-nginx -n helm-demo
```

### Step 7: Rollback Release

```bash
# Rollback to previous revision
helm rollback my-nginx -n helm-demo

# Rollback to specific revision
helm rollback my-nginx 1 -n helm-demo

# Check history
helm history my-nginx -n helm-demo
```

### Step 8: Install PostgreSQL Database

```bash
# Install PostgreSQL
helm install my-postgres bitnami/postgresql \
  --namespace helm-demo \
  --set auth.postgresPassword=mysecretpassword \
  --set auth.database=myapp \
  --set primary.persistence.size=1Gi

# Get connection info
helm status my-postgres -n helm-demo

# Connect to database
kubectl run psql-client --rm -it --restart=Never \
  --namespace helm-demo \
  --image bitnami/postgresql:latest \
  --env="PGPASSWORD=mysecretpassword" \
  --command -- psql -h my-postgres-postgresql -U postgres -d myapp
```

### Step 9: Chart Information and Search

```bash
# Show chart info
helm show chart bitnami/nginx

# Show chart values
helm show values bitnami/nginx

# Show all chart info
helm show all bitnami/nginx

# Search for specific chart
helm search repo postgresql

# Search Artifact Hub (public charts)
helm search hub prometheus
```

### Step 10: Manage Repositories

```bash
# List repos
helm repo list

# Remove repo
helm repo remove nginx-stable

# Add repo back
helm repo add nginx-stable https://helm.nginx.com/stable

# Update all repos
helm repo update
```

## ✅ Verification

### 1. List Releases

```bash
# All releases in namespace
helm list -n helm-demo

# All releases in all namespaces
helm list --all-namespaces

# Include uninstalled
helm list --all -n helm-demo
```

### 2. Check Release Details

```bash
# Status
helm status my-nginx -n helm-demo

# History
helm history my-nginx -n helm-demo

# Get values
helm get values my-nginx -n helm-demo

# Get manifest
helm get manifest my-nginx -n helm-demo
```

### 3. Verify Kubernetes Resources

```bash
# Check pods created by helm
kubectl get pods -n helm-demo

# Check services
kubectl get svc -n helm-demo

# Check all resources
kubectl get all -n helm-demo
```

## 🧪 Hands-On Exercises

### Exercise 1: Install MySQL

**Task**: Install MySQL with custom values:
- Root password: mypassword
- Database name: testdb
- Storage: 2Gi

```bash
helm install my-mysql bitnami/mysql \
  --set auth.rootPassword=mypassword \
  --set auth.database=testdb \
  --set primary.persistence.size=2Gi
```

### Exercise 2: Upgrade and Rollback

**Task**:
1. Install nginx with 1 replica
2. Upgrade to 3 replicas
3. Verify upgrade
4. Rollback to 1 replica

### Exercise 3: Use Values File

**Task**: Create values.yaml for Redis:
- Enable persistence
- Set password
- Configure resources

## 🧹 Cleanup

```bash
# Uninstall all releases
helm uninstall my-nginx -n helm-demo
helm uninstall my-custom-nginx -n helm-demo
helm uninstall my-postgres -n helm-demo

# Delete namespace
kubectl delete namespace helm-demo

# Verify cleanup
helm list -n helm-demo
```

## 📚 What You Learned

✅ Installed Helm
✅ Added chart repositories
✅ Searched for charts
✅ Installed releases
✅ Customized with values
✅ Upgraded releases
✅ Rolled back releases
✅ Managed repositories

## 🎓 Key Concepts

### Release Naming

```bash
# Auto-generated name
helm install bitnami/nginx --generate-name

# Specific name
helm install my-release bitnami/nginx

# With namespace
helm install my-release bitnami/nginx -n my-namespace
```

### Values Priority

```
Priority (highest to lowest):
1. --set flags
2. --values files (last file wins)
3. Chart's values.yaml (defaults)
```

### Example:
```bash
helm install myapp ./chart \
  --values values-prod.yaml \
  --values values-override.yaml \
  --set image.tag=v2.0
```

## 🔜 Next Steps

**Tutorial 17**: Helm Custom Charts - Create your own charts
- Build custom Helm charts
- Use templates
- Package and share charts

## 💡 Pro Tips

1. **Dry run before install**:
   ```bash
   helm install my-release bitnami/nginx --dry-run --debug
   ```

2. **Template rendering**:
   ```bash
   helm template my-release bitnami/nginx
   ```

3. **Show computed values**:
   ```bash
   helm get values my-release --all
   ```

4. **Install from local chart**:
   ```bash
   helm install my-release ./mychart/
   ```

5. **Lint chart**:
   ```bash
   helm lint ./mychart/
   ```

## 🆘 Troubleshooting

**Problem**: Repository not found
**Solution**:
```bash
helm repo update
helm search repo <chart-name>
```

**Problem**: Release already exists
**Solution**:
```bash
helm list --all-namespaces | grep <release-name>
helm uninstall <release-name> -n <namespace>
```

**Problem**: Can't connect to repository
**Solution**:
```bash
# Check internet connection
# Verify repository URL
helm repo list
```

## 📖 Additional Reading

- [Helm Official Docs](https://helm.sh/docs/)
- [Artifact Hub](https://artifacthub.io/) - Chart repository
- [Helm Charts GitHub](https://github.com/helm/charts)
- [Bitnami Charts](https://github.com/bitnami/charts)

---

**Estimated Time**: 60 minutes
**Difficulty**: Beginner to Intermediate
**Prerequisites**: Tutorials 01-15 completed

**Next**: Tutorial 17 - Helm Custom Charts
