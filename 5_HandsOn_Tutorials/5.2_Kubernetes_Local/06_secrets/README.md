# Kubernetes Tutorial 06: Secrets

## 🎯 Learning Objectives

- Understand Kubernetes Secrets for sensitive data
- Create and manage different types of Secrets
- Use Secrets as environment variables and volumes
- Understand base64 encoding (not encryption!)
- Compare Secrets vs ConfigMaps
- Implement security best practices
- Learn about Secret encryption at rest

## 📋 Prerequisites

- Completed [05_configmap](../05_configmap/)
- kind cluster "learning" is running
- kubectl configured to use kind-learning context
- Understanding of ConfigMaps

## 📝 What We're Building

```
Secret (base64-encoded sensitive data)
    ├── Type: Opaque (generic)
    ├── Type: kubernetes.io/tls (certificates)
    ├── Type: kubernetes.io/dockerconfigjson (registry auth)
    └── Type: kubernetes.io/basic-auth (username/password)
        ↓
    Consumed by Pods
    ├── As Environment Variables
    ├── As Volume Mounts
    └── By imagePullSecrets
```

## 🔍 Concepts Introduced

### 1. **What is a Secret?**

**Purpose**:
- Store sensitive information (passwords, tokens, keys)
- Similar to ConfigMap but for confidential data
- Base64 encoded (NOT encrypted by default)
- Access can be controlled with RBAC

**IMPORTANT**:
- Base64 encoding is NOT encryption
- Secrets are not inherently secure
- Anyone with API access can decode them
- Use encryption at rest for real security

### 2. **Secrets vs ConfigMaps**

| Feature | Secret | ConfigMap |
|---------|--------|-----------|
| Purpose | Sensitive data | Configuration |
| Encoding | Base64 | Plain text |
| Size limit | ~1MB | ~1MB |
| Mounted as | Read-only | Read-only or RW |
| Use for | Passwords, tokens | Settings, configs |

### 3. **Secret Types**

1. **Opaque** (default): Generic key-value secrets
2. **kubernetes.io/tls**: TLS certificates
3. **kubernetes.io/dockerconfigjson**: Docker registry auth
4. **kubernetes.io/basic-auth**: Username and password
5. **kubernetes.io/ssh-auth**: SSH keys
6. **kubernetes.io/service-account-token**: Service account tokens

### 4. **Security Considerations**

⚠️ **Important Security Notes**:
- Secrets are base64 encoded, NOT encrypted
- Stored in etcd (should enable encryption at rest)
- Accessible to anyone with namespace access
- Visible in pod specs
- Consider external secret management (Vault, AWS Secrets Manager)

## 📁 Step-by-Step Implementation

### Step 1: Create Opaque Secret (Generic)

```bash
# Method 1: From literals
kubectl create secret generic db-credentials \
  --from-literal=username=admin \
  --from-literal=password='P@ssw0rd123!'

# View secret (encoded)
kubectl get secret db-credentials -o yaml

# Decode secret
kubectl get secret db-credentials -o jsonpath='{.data.username}' | base64 --decode
kubectl get secret db-credentials -o jsonpath='{.data.password}' | base64 --decode
```

### Step 2: Create Secret from YAML

```bash
# Apply secret manifest
kubectl apply -f manifests/01-basic-secret.yaml

# Verify
kubectl describe secret app-secrets
```

### Step 3: Use Secret as Environment Variables

```bash
# Deploy app with secret env vars
kubectl apply -f manifests/02-deployment-env-from-secret.yaml

# Verify environment variables
POD_NAME=$(kubectl get pods -l app=secret-env-demo -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD_NAME -- sh -c 'echo "User: $DB_USER"'
kubectl exec $POD_NAME -- sh -c 'echo "Pass: $DB_PASSWORD"'
```

### Step 4: Mount Secret as Volume

```bash
# Deploy app with secret mounted as files
kubectl apply -f manifests/03-deployment-volume-secret.yaml

# Check mounted files
POD_NAME=$(kubectl get pods -l app=secret-volume-demo -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD_NAME -- ls -la /etc/secrets
kubectl exec $POD_NAME -- cat /etc/secrets/username
kubectl exec $POD_NAME -- cat /etc/secrets/password
```

### Step 5: Create TLS Secret

```bash
# Apply TLS secret (or create manually)
kubectl apply -f manifests/04-tls-secret.yaml

# Or create from files:
# openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#   -keyout tls.key -out tls.crt -subj "/CN=myapp.local"
# kubectl create secret tls tls-secret --cert=tls.crt --key=tls.key

# Verify
kubectl describe secret tls-secret
```

### Step 6: Create Docker Registry Secret

```bash
# Create docker registry secret
kubectl create secret docker-registry my-registry-secret \
  --docker-server=registry.example.com \
  --docker-username=myuser \
  --docker-password=mypassword \
  --docker-email=user@example.com

# Or apply manifest
kubectl apply -f manifests/05-dockerconfig-secret.yaml

# Use in pod spec (see manifests/06-deployment-with-imagepull.yaml)
kubectl apply -f manifests/06-deployment-with-imagepull.yaml
```

### Step 7: Create Basic Auth Secret

```bash
# Apply basic auth secret
kubectl apply -f manifests/07-basic-auth-secret.yaml

# Deploy app using it
kubectl apply -f manifests/08-deployment-basic-auth.yaml
```

### Step 8: Secret with Specific Keys

```bash
# Apply secret with selective key mounting
kubectl apply -f manifests/09-secret-selective-mount.yaml

# Verify only selected keys are mounted
POD_NAME=$(kubectl get pods -l app=selective-secret-demo -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD_NAME -- ls -la /etc/app-secrets
```

### Step 9: Update Secret (Rolling Update)

```bash
# Create initial secret
kubectl apply -f manifests/10-updatable-secret.yaml

# Deploy app using it
kubectl apply -f manifests/11-deployment-watching-secret.yaml

# Update secret
kubectl create secret generic updatable-secret \
  --from-literal=config-value='updated-value' \
  --dry-run=client -o yaml | kubectl apply -f -

# For env vars: Restart deployment
kubectl rollout restart deployment secret-watch-demo

# For volumes: Wait ~60s for kubelet to sync
```

### Step 10: External Secrets (Concept)

```bash
# View external secrets operator example
cat manifests/12-external-secret-example.yaml

# This shows how to use external secret managers
# Requires installing External Secrets Operator or similar tools
```

## ✅ Verification

### 1. List All Secrets

```bash
# Get all secrets
kubectl get secrets

# With more details
kubectl get secrets -o wide

# Exclude service account tokens
kubectl get secrets | grep -v "kubernetes.io/service-account-token"
```

### 2. Inspect Secret Data

```bash
# Describe secret (doesn't show values)
kubectl describe secret db-credentials

# Get encoded data
kubectl get secret db-credentials -o yaml

# Decode specific key
kubectl get secret db-credentials -o jsonpath='{.data.password}' | base64 --decode
echo  # Newline

# Decode all keys
kubectl get secret db-credentials -o json | jq '.data | map_values(@base64d)'
```

### 3. Verify in Pods

```bash
# Environment variables
POD=$(kubectl get pods -l app=secret-env-demo -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD -- env | grep DB_

# Mounted files
POD=$(kubectl get pods -l app=secret-volume-demo -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD -- ls -la /etc/secrets
kubectl exec $POD -- cat /etc/secrets/username
```

### 4. Check Secret Type

```bash
# Get secret type
kubectl get secret tls-secret -o jsonpath='{.type}'

# List secrets by type
kubectl get secrets -o json | jq -r '.items[] | "\(.metadata.name): \(.type)"'
```

## 🧪 Hands-On Exercises

### Exercise 1: Create Multi-Secret Deployment

```bash
# Create multiple secrets
kubectl create secret generic db-secret \
  --from-literal=host=postgres.default.svc.cluster.local \
  --from-literal=password=dbpass123

kubectl create secret generic api-secret \
  --from-literal=key=api-key-xyz \
  --from-literal=endpoint=https://api.example.com

# Use both in one deployment (mix env vars and volumes)
```

### Exercise 2: Encode and Decode Manually

```bash
# Encode value
echo -n 'mypassword' | base64
# Output: bXlwYXNzd29yZA==

# Decode value
echo 'bXlwYXNzd29yZA==' | base64 --decode
# Output: mypassword

# Create secret with manual encoding
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: manual-secret
type: Opaque
data:
  key1: $(echo -n 'value1' | base64)
  key2: $(echo -n 'value2' | base64)
EOF
```

### Exercise 3: Secret Rotation

```bash
# Create version 1
kubectl create secret generic app-secret-v1 --from-literal=token=token-v1

# Use in deployment
kubectl create deployment app --image=nginx:alpine
kubectl set env deployment/app --from=secret/app-secret-v1

# Create version 2
kubectl create secret generic app-secret-v2 --from-literal=token=token-v2

# Update deployment to use v2
kubectl set env deployment/app --from=secret/app-secret-v2 --overwrite

# Rollback if needed
kubectl set env deployment/app --from=secret/app-secret-v1 --overwrite
```

## 🧹 Cleanup

```bash
# Delete all secrets (except system secrets)
kubectl delete secret db-credentials app-secrets tls-secret my-registry-secret

# Delete deployments
kubectl delete deployment --all

# Verify
kubectl get secrets | grep -v "kubernetes.io/service-account-token"
```

## 📚 What You Learned

✅ Created different types of Secrets (Opaque, TLS, Docker, Basic Auth)
✅ Used Secrets as environment variables
✅ Mounted Secrets as volumes
✅ Understood base64 encoding vs encryption
✅ Compared Secrets vs ConfigMaps
✅ Learned security best practices
✅ Implemented imagePullSecrets for private registries
✅ Updated and rotated secrets

## 🎓 Key Concepts

### Base64 Encoding is NOT Encryption

```bash
# Anyone can decode
echo 'cGFzc3dvcmQ=' | base64 --decode
# Output: password
```

**Real Security Requires**:
- Encryption at rest (etcd encryption)
- RBAC (limit who can read secrets)
- Network policies (limit pod access)
- External secret management (Vault, AWS Secrets Manager)
- Secret scanning (prevent commits to git)

### Secret Best Practices

1. **Enable encryption at rest**:
   ```yaml
   # kube-apiserver flag
   --encryption-provider-config=/path/to/encryption-config.yaml
   ```

2. **Use RBAC**:
   ```yaml
   # Only allow specific service accounts to read secrets
   apiVersion: rbac.authorization.k8s.io/v1
   kind: Role
   rules:
   - apiGroups: [""]
     resources: ["secrets"]
     verbs: ["get"]
     resourceNames: ["specific-secret"]
   ```

3. **Use external secrets**:
   - HashiCorp Vault
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager
   - External Secrets Operator

4. **Never commit secrets to git**:
   - Use `.gitignore`
   - Use tools like git-secrets, gitleaks
   - Scan repositories regularly

5. **Rotate secrets regularly**:
   - Automated rotation
   - Track expiration dates
   - Have rollback plan

6. **Limit secret scope**:
   - One secret per application/component
   - Don't share secrets across unrelated apps
   - Use namespaces for isolation

### Secret Update Behavior

| Method | Updates Without Restart? |
|--------|-------------------------|
| Environment variables | ❌ No |
| Volume mount | ✅ Yes (~60s delay) |
| imagePullSecrets | ❌ No (used during pod creation) |

### Secret Size and Performance

- Max size: ~1MB
- Large secrets impact performance
- Secrets loaded into memory for all pods
- Consider splitting large secrets
- Use external storage for large files

## 🔜 Next Steps

Move to [07_persistent_volumes](../07_persistent_volumes/) where you'll:
- Learn about persistent storage
- Create PersistentVolumes and PersistentVolumeClaims
- Understand StorageClasses
- Use dynamic provisioning
- Store stateful data

## 💡 Pro Tips

1. **Quick secret creation from file**:
   ```bash
   kubectl create secret generic my-secret --from-file=ssh-key=~/.ssh/id_rsa
   ```

2. **Create secret from env file**:
   ```bash
   echo "DB_HOST=postgres" > .env
   echo "DB_PASSWORD=secret" >> .env
   kubectl create secret generic env-secret --from-env-file=.env
   ```

3. **Copy secret between namespaces**:
   ```bash
   kubectl get secret my-secret -o yaml | \
     sed 's/namespace: default/namespace: other/' | \
     kubectl apply -f -
   ```

4. **Check secret size**:
   ```bash
   kubectl get secret my-secret -o json | jq '.data | map_values(@base64d) | length'
   ```

5. **Seal secrets for git** (using sealed-secrets):
   ```bash
   kubeseal --format yaml < secret.yaml > sealed-secret.yaml
   # Safe to commit sealed-secret.yaml
   ```

## 🆘 Troubleshooting

**Problem**: Pod in `CreateContainerConfigError`
**Solution**: Secret doesn't exist or key not found:
```bash
kubectl describe pod <pod-name>
kubectl get secrets
```

**Problem**: Can't decode secret
**Solution**: Use proper base64 decode:
```bash
# Correct
kubectl get secret my-secret -o jsonpath='{.data.key}' | base64 --decode

# Incorrect (includes newline)
kubectl get secret my-secret -o yaml | grep key:
```

**Problem**: ImagePullBackOff with private registry
**Solution**: Check imagePullSecrets:
```bash
kubectl describe pod <pod-name>
kubectl get secret my-registry-secret -o yaml
# Ensure secret type is kubernetes.io/dockerconfigjson
```

**Problem**: Secret changes not reflected
**Solution**:
- Env vars: Restart pod
- Volumes: Wait ~60s
```bash
kubectl rollout restart deployment/<deployment-name>
```

**Problem**: Accidentally exposed secret in git
**Solution**:
1. Rotate the secret immediately
2. Remove from git history
3. Use git-secrets or gitleaks to prevent future commits

## 📖 Additional Reading

- [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Secrets Good Practices](https://kubernetes.io/docs/concepts/security/secrets-good-practices/)
- [Encrypting Secret Data at Rest](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/)
- [External Secrets Operator](https://external-secrets.io/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)

---

**Estimated Time**: 45-60 minutes
**Difficulty**: Intermediate
**Prerequisites**: Tutorial 05 completed
