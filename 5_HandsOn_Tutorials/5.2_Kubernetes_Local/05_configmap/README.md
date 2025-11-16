# Kubernetes Tutorial 05: ConfigMaps

## 🎯 Learning Objectives

- Understand the need for externalizing configuration
- Create and manage ConfigMaps
- Consume ConfigMaps as environment variables
- Mount ConfigMaps as files/volumes
- Update configuration without rebuilding images
- Understand immutable ConfigMaps
- Best practices for configuration management

## 📋 Prerequisites

- Completed previous tutorials (especially 02-03)
- kind cluster "learning" is running
- kubectl configured to use kind-learning context
- Basic understanding of environment variables and configuration files

## 📝 What We're Building

```
ConfigMap (configuration data)
    ├── As Environment Variables → Pod Container (env vars)
    ├── As Volume Mount → Pod Container (files)
    └── Selective Keys → Pod Container (specific values)
```

## 🔍 Concepts Introduced

### 1. **What is a ConfigMap?**

**Purpose**:
- Store non-confidential configuration data
- Separate configuration from container images
- Make applications portable across environments

**Analogy**:
- ConfigMap = Settings file
- Pod = Application that reads settings
- No need to rebuild app when settings change

### 2. **Why ConfigMaps?**

**Without ConfigMaps** (hardcoded):
```dockerfile
ENV DATABASE_HOST=prod-db.example.com
ENV DATABASE_PORT=5432
```
Problem: Need different image for dev, staging, prod

**With ConfigMaps**:
```yaml
Same image + different ConfigMaps = different environments
```

### 3. **ConfigMap vs Secret**

| ConfigMap | Secret |
|-----------|--------|
| Non-sensitive data | Sensitive data |
| Not encoded | Base64 encoded |
| Visible in plain text | Obscured (not encrypted!) |
| App config, settings | Passwords, tokens, keys |

### 4. **Consumption Methods**

1. **Environment Variables**: Individual values or all keys
2. **Volume Mount**: Files in container filesystem
3. **Command Arguments**: Pass values to container command

## 📁 Step-by-Step Implementation

### Step 1: Create ConfigMap from Literals

```bash
# Create ConfigMap using kubectl
kubectl create configmap app-config \
  --from-literal=APP_ENV=development \
  --from-literal=LOG_LEVEL=debug \
  --from-literal=MAX_CONNECTIONS=100

# View ConfigMap
kubectl get configmap app-config

# Describe ConfigMap
kubectl describe configmap app-config

# Get ConfigMap in YAML
kubectl get configmap app-config -o yaml
```

**Expected Output**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: development
  LOG_LEVEL: debug
  MAX_CONNECTIONS: "100"  # Note: All values are strings
```

### Step 2: Create ConfigMap from YAML

```bash
# Apply ConfigMap manifest
kubectl apply -f manifests/01-basic-configmap.yaml

# View the data
kubectl get configmap database-config -o yaml
```

### Step 3: Use ConfigMap as Environment Variables (Individual Keys)

```bash
# Deploy app using ConfigMap env vars (method 1)
kubectl apply -f manifests/02-deployment-env-from-configmap.yaml

# Check pod environment
POD_NAME=$(kubectl get pods -l app=env-demo -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD_NAME -- env | grep -E 'DB_|APP_'
```

### Step 4: Use ConfigMap as Environment Variables (All Keys)

```bash
# Deploy app importing all ConfigMap keys (method 2)
kubectl apply -f manifests/03-deployment-envfrom-configmap.yaml

# Check pod environment
POD_NAME=$(kubectl get pods -l app=envfrom-demo -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD_NAME -- env | sort
```

**Difference**:
- `env.valueFrom`: Select specific keys
- `envFrom`: Import all keys from ConfigMap

### Step 5: Create ConfigMap from File

```bash
# Apply ConfigMap with file content
kubectl apply -f manifests/04-configmap-from-file.yaml

# View the configuration file content
kubectl get configmap nginx-config -o jsonpath='{.data.nginx\.conf}' | head -20
```

### Step 6: Mount ConfigMap as Volume

```bash
# Deploy with ConfigMap mounted as files
kubectl apply -f manifests/05-deployment-volume-configmap.yaml

# Check mounted files
POD_NAME=$(kubectl get pods -l app=volume-demo -o jsonpath='{.items[0].metadata.name}')

# List mounted config files
kubectl exec $POD_NAME -- ls -la /etc/config

# Read config file
kubectl exec $POD_NAME -- cat /etc/config/nginx.conf

# Test nginx with custom config
kubectl exec $POD_NAME -- nginx -t
```

### Step 7: Selective Volume Mount (Specific Keys)

```bash
# Deploy with selective key mounting
kubectl apply -f manifests/06-deployment-selective-mount.yaml

# Check what's mounted
POD_NAME=$(kubectl get pods -l app=selective-demo -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD_NAME -- ls -la /etc/config/
kubectl exec $POD_NAME -- cat /etc/config/app-env
```

### Step 8: Update ConfigMap and See Changes

```bash
# Deploy app that watches config file
kubectl apply -f manifests/07-configmap-watch-demo.yaml

# Get pod name
POD_NAME=$(kubectl get pods -l app=watch-demo -o jsonpath='{.items[0].metadata.name}')

# Check current config
kubectl exec $POD_NAME -- cat /etc/config/message.txt

# Update ConfigMap
kubectl patch configmap watch-config --type merge -p '{"data":{"message.txt":"Updated message at $(date)"}}'

# Wait a moment (60 seconds max for kubelet to sync)
sleep 70

# Check updated config (should show new value)
kubectl exec $POD_NAME -- cat /etc/config/message.txt
```

**Important**:
- Volume-mounted ConfigMaps are eventually consistent (can take up to 60s)
- Environment variables are NOT updated (pod restart required)

### Step 9: ConfigMap with Binary Data

```bash
# Apply ConfigMap with binary data
kubectl apply -f manifests/08-configmap-binary.yaml

# Deploy app using binary ConfigMap
kubectl apply -f manifests/09-deployment-binary-configmap.yaml

# Verify binary file
POD_NAME=$(kubectl get pods -l app=binary-demo -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD_NAME -- file /etc/config/logo.png
```

### Step 10: Immutable ConfigMap

```bash
# Apply immutable ConfigMap
kubectl apply -f manifests/10-immutable-configmap.yaml

# Try to update it (will fail)
kubectl patch configmap immutable-config --type merge -p '{"data":{"key":"new-value"}}' || echo "Update blocked - ConfigMap is immutable!"

# To update: Must delete and recreate
# kubectl delete configmap immutable-config
# kubectl apply -f manifests/10-immutable-configmap.yaml
```

## ✅ Verification

### 1. List All ConfigMaps

```bash
# Get all ConfigMaps
kubectl get configmaps

# With labels
kubectl get configmaps --show-labels

# In all namespaces
kubectl get configmaps --all-namespaces
```

### 2. Inspect ConfigMap Data

```bash
# Describe ConfigMap
kubectl describe configmap app-config

# Get data as YAML
kubectl get configmap app-config -o yaml

# Get specific key
kubectl get configmap app-config -o jsonpath='{.data.APP_ENV}'
```

### 3. Verify Environment Variables in Pods

```bash
# Get pod name
POD_NAME=$(kubectl get pods -l app=env-demo -o jsonpath='{.items[0].metadata.name}')

# Check all environment variables
kubectl exec $POD_NAME -- env

# Check specific variables
kubectl exec $POD_NAME -- sh -c 'echo "DB_HOST=$DB_HOST, LOG_LEVEL=$LOG_LEVEL"'
```

### 4. Verify Volume Mounts

```bash
# Get pod name
POD_NAME=$(kubectl get pods -l app=volume-demo -o jsonpath='{.items[0].metadata.name}')

# List mounted files
kubectl exec $POD_NAME -- ls -la /etc/config

# Read file content
kubectl exec $POD_NAME -- cat /etc/config/nginx.conf

# Check mount point
kubectl describe pod $POD_NAME | grep -A 5 "Mounts:"
```

## 🧪 Hands-On Exercises

### Exercise 1: Multi-Environment Configuration

Create ConfigMaps for different environments:

```bash
# Development
kubectl create configmap app-config-dev \
  --from-literal=ENV=development \
  --from-literal=DEBUG=true \
  --from-literal=API_URL=http://api-dev.local

# Staging
kubectl create configmap app-config-staging \
  --from-literal=ENV=staging \
  --from-literal=DEBUG=false \
  --from-literal=API_URL=https://api-staging.example.com

# Production
kubectl create configmap app-config-prod \
  --from-literal=ENV=production \
  --from-literal=DEBUG=false \
  --from-literal=API_URL=https://api.example.com

# Use in deployment (change configMapRef name based on environment)
```

### Exercise 2: Application Configuration File

Create a complete application config file:

```bash
# Create config file
cat > app-config.json <<EOF
{
  "server": {
    "port": 8080,
    "host": "0.0.0.0"
  },
  "database": {
    "host": "postgres.default.svc.cluster.local",
    "port": 5432,
    "name": "myapp"
  },
  "cache": {
    "host": "redis.default.svc.cluster.local",
    "port": 6379
  }
}
EOF

# Create ConfigMap from file
kubectl create configmap app-json-config --from-file=config.json=app-config.json

# Use in deployment (mount as /etc/app/config.json)
```

### Exercise 3: Hot Reload Configuration

Test configuration hot reload:

```bash
# Create ConfigMap
kubectl create configmap reload-test --from-literal=value=initial

# Deploy app that reads config periodically
# (See manifests/07-configmap-watch-demo.yaml)

# Update ConfigMap
kubectl patch configmap reload-test -p '{"data":{"value":"updated"}}'

# Watch pod logs or exec into pod to see change
```

## 🧹 Cleanup

```bash
# Delete all ConfigMaps
kubectl delete configmap app-config database-config nginx-config watch-config immutable-config

# Delete deployments
kubectl delete deployment --all

# Verify cleanup
kubectl get configmaps
kubectl get deployments
```

## 📚 What You Learned

✅ Created ConfigMaps using literals, YAML, and files
✅ Consumed ConfigMaps as environment variables (individual and all keys)
✅ Mounted ConfigMaps as volumes (full and selective)
✅ Updated ConfigMaps and observed changes
✅ Used binary data in ConfigMaps
✅ Created immutable ConfigMaps
✅ Best practices for configuration management

## 🎓 Key Concepts

### ConfigMap Size Limits
- Maximum size: 1 MiB per ConfigMap
- For larger data, use volumes or external config systems

### Update Behavior
| Method | Update Without Restart? |
|--------|------------------------|
| Environment variables | ❌ No - requires pod restart |
| Volume mount | ✅ Yes - eventually consistent (~60s) |
| Command args | ❌ No - requires pod restart |

### When to Use Immutable ConfigMaps
- Production configurations that shouldn't change
- Prevent accidental updates
- Better performance (kube-apiserver doesn't watch)
- Must delete and recreate to update

### ConfigMap Naming Best Practices
```
<app>-<component>-<environment>-config
Examples:
- myapp-frontend-prod-config
- myapp-backend-dev-config
- myapp-database-staging-config
```

### Key Naming Conventions
```
# Kubernetes-style (lowercase, hyphens)
app-name: myapp
log-level: debug

# Environment variable style (uppercase, underscores)
APP_NAME: myapp
LOG_LEVEL: debug
```

## 🔜 Next Steps

Move to [06_secrets](../06_secrets/) where you'll:
- Learn about Secrets for sensitive data
- Understand base64 encoding
- Create and use different types of Secrets
- Compare Secrets vs ConfigMaps
- Implement security best practices

## 💡 Pro Tips

1. **Create ConfigMap from multiple files**:
   ```bash
   kubectl create configmap my-config --from-file=./config-dir/
   ```

2. **Export ConfigMap to file**:
   ```bash
   kubectl get configmap my-config -o yaml > my-config.yaml
   ```

3. **Use ConfigMap in command args**:
   ```yaml
   command: ["/bin/sh", "-c", "echo $MESSAGE"]
   env:
   - name: MESSAGE
     valueFrom:
       configMapKeyRef:
         name: my-config
         key: message
   ```

4. **Validate ConfigMap exists before deploying**:
   ```bash
   kubectl get configmap my-config || echo "ConfigMap not found!"
   ```

5. **Use descriptive keys**:
   ```yaml
   # Good
   data:
     database-host: postgres
     cache-ttl: "3600"

   # Avoid
   data:
     host: postgres
     ttl: "3600"
   ```

## 🆘 Troubleshooting

**Problem**: Pod in `CreateContainerConfigError` state
**Solution**: ConfigMap doesn't exist or key not found:
```bash
kubectl describe pod <pod-name>
# Look for: "Error: configmap 'xxx' not found"
kubectl get configmaps
```

**Problem**: Environment variables not set
**Solution**: Check ConfigMap key names match:
```bash
kubectl get configmap my-config -o yaml
kubectl describe pod <pod-name>
```

**Problem**: Mounted config file empty or not found
**Solution**: Check volume mount path and ConfigMap keys:
```bash
kubectl exec <pod-name> -- ls -la /etc/config
kubectl get configmap <config-name> -o yaml
```

**Problem**: Configuration changes not reflected
**Solution**:
- For env vars: Restart pod
- For volumes: Wait up to 60s for kubelet sync
```bash
kubectl rollout restart deployment/<deployment-name>
```

**Problem**: Cannot update immutable ConfigMap
**Solution**: Delete and recreate:
```bash
kubectl delete configmap <config-name>
kubectl apply -f <config-file>.yaml
```

## 📖 Additional Reading

- [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Configure a Pod to Use a ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/)
- [Immutable ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/#configmap-immutable)

---

**Estimated Time**: 45-60 minutes
**Difficulty**: Beginner to Intermediate
**Prerequisites**: Tutorials 01-02 completed
