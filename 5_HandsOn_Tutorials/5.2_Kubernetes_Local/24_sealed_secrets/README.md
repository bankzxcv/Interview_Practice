# Kubernetes Tutorial 24: Sealed Secrets for GitOps

## 🎯 Learning Objectives

- Understand secret management challenges in GitOps
- Install Sealed Secrets controller
- Seal secrets for safe Git storage
- Integrate with ArgoCD
- Rotate encryption keys
- Manage secrets across environments
- Implement secret scope (cluster-wide, namespace, strict)
- Automate secret sealing in CI/CD

## 📋 Prerequisites

- Completed tutorials 01-23
- ArgoCD installed (Tutorial 23)
- kubectl and kubeseal CLI
- Git repository

## 📝 What We're Building

```
Sealed Secrets Workflow:
├── Developer
│   ├── Create plain Secret
│   ├── Seal with kubeseal CLI
│   └── Commit SealedSecret to Git
├── Git Repository
│   └── SealedSecret (encrypted, safe to store)
├── ArgoCD
│   └── Syncs SealedSecret to cluster
└── Sealed Secrets Controller
    ├── Decrypts SealedSecret
    └── Creates plain Secret in cluster
```

## 🔍 Concepts Deep Dive

### 1. **Why Sealed Secrets?**

**Problem**: Can't store Secrets in Git
- Base64 is not encryption
- Secrets visible to anyone with repo access
- Against GitOps principles

**Solution**: Sealed Secrets
- Encrypt secrets with public key
- Only controller can decrypt (private key)
- Safe to store in Git
- Decrypted only in cluster

### 2. **How It Works**

```
1. Generate key pair (done by controller)
   - Private key: stays in cluster
   - Public key: used by kubeseal CLI

2. Seal secret (client-side)
   kubeseal < secret.yaml > sealed-secret.yaml

3. Commit to Git
   git add sealed-secret.yaml
   git commit -m "Add sealed secret"

4. ArgoCD syncs SealedSecret to cluster

5. Controller decrypts and creates Secret
```

### 3. **Secret Scopes**

**Strict** (default):
- Bound to namespace and name
- Can't rename or move

**Namespace-wide**:
- Any name in same namespace
- Can rename

**Cluster-wide**:
- Any namespace, any name
- Maximum flexibility, less security

## 📁 Step-by-Step Implementation

### Step 1: Install Sealed Secrets Controller

```bash
# Install controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Wait for controller
kubectl wait --for=condition=ready pod -l name=sealed-secrets-controller -n kube-system --timeout=120s

# Verify installation
kubectl get pods -n kube-system -l name=sealed-secrets-controller

# Check logs
kubectl logs -n kube-system deployment/sealed-secrets-controller
```

### Step 2: Install kubeseal CLI

```bash
# Download kubeseal (Linux)
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-0.24.0-linux-amd64.tar.gz

# Extract
tar xfz kubeseal-0.24.0-linux-amd64.tar.gz

# Install
sudo install -m 755 kubeseal /usr/local/bin/kubeseal

# Verify
kubeseal --version

# Fetch public key (for offline sealing)
kubeseal --fetch-cert > pub-cert.pem
```

### Step 3: Create and Seal a Secret

```bash
# Create regular Secret manifest (DO NOT apply)
cat > secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
  namespace: default
type: Opaque
stringData:
  username: admin
  password: supersecret123
EOF

# Seal the secret
kubeseal < secret.yaml > sealed-secret.yaml

# View sealed secret
cat sealed-secret.yaml

# The encrypted data is safe to commit to Git!
```

### Step 4: Deploy Sealed Secret

```bash
# Apply SealedSecret to cluster
kubectl apply -f sealed-secret.yaml

# Wait a moment for controller to process

# Check SealedSecret
kubectl get sealedsecrets

# Check that Secret was created
kubectl get secret mysecret

# View secret (decrypted)
kubectl get secret mysecret -o jsonpath='{.data.username}' | base64 -d
kubectl get secret mysecret -o jsonpath='{.data.password}' | base64 -d
```

### Step 5: Use Different Scopes

```bash
# Strict scope (default) - bound to namespace and name
kubeseal < secret.yaml > sealed-secret-strict.yaml

# Namespace-wide scope - can rename
kubeseal --scope namespace-wide < secret.yaml > sealed-secret-ns.yaml

# Cluster-wide scope - any namespace, any name
kubeseal --scope cluster-wide < secret.yaml > sealed-secret-cluster.yaml

# Test moving namespace-wide secret
kubectl apply -f sealed-secret-ns.yaml
# Can rename the SealedSecret, Secret will still be created
```

### Step 6: Integrate with ArgoCD

```bash
# Create Git repo structure
mkdir -p ~/sealed-secrets-demo/{base,environments/{dev,prod}}

# Create SealedSecret for dev
cat > ~/sealed-secrets-demo/environments/dev/secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: dev
type: Opaque
stringData:
  database-url: "postgres://dev-db:5432/myapp"
  api-key: "dev-api-key-12345"
EOF

kubeseal < ~/sealed-secrets-demo/environments/dev/secret.yaml \
  > ~/sealed-secrets-demo/environments/dev/sealed-secret.yaml

# Create SealedSecret for prod
cat > ~/sealed-secrets-demo/environments/prod/secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: prod
type: Opaque
stringData:
  database-url: "postgres://prod-db:5432/myapp"
  api-key: "prod-api-key-67890"
EOF

kubeseal < ~/sealed-secrets-demo/environments/prod/secret.yaml \
  > ~/sealed-secrets-demo/environments/prod/sealed-secret.yaml

# Commit to Git (only sealed secrets)
cd ~/sealed-secrets-demo
git init
git add environments/*/sealed-secret.yaml
git commit -m "Add sealed secrets"
git push

# Create ArgoCD applications
argocd app create app-dev \
  --repo <repo-url> \
  --path environments/dev \
  --dest-namespace dev \
  --dest-server https://kubernetes.default.svc \
  --sync-policy automated

argocd app create app-prod \
  --repo <repo-url> \
  --path environments/prod \
  --dest-namespace prod \
  --dest-server https://kubernetes.default.svc \
  --sync-policy automated
```

### Step 7: Rotate Sealed Secret

```bash
# Update the secret content
cat > secret-updated.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
  namespace: default
type: Opaque
stringData:
  username: admin
  password: newsecret456  # New password
EOF

# Seal updated secret
kubeseal < secret-updated.yaml > sealed-secret-updated.yaml

# Apply updated SealedSecret
kubectl apply -f sealed-secret-updated.yaml

# Verify secret was updated
kubectl get secret mysecret -o jsonpath='{.data.password}' | base64 -d
# Should show: newsecret456
```

### Step 8: Backup and Restore Encryption Keys

```bash
# Backup encryption key (KEEP SECURE!)
kubectl get secret -n kube-system \
  -l sealedsecrets.bitnami.com/sealed-secrets-key=active \
  -o yaml > sealed-secrets-key.yaml

# Store in secure location (NOT in Git!)
# Use password manager, vault, or encrypted storage

# To restore (in disaster recovery):
# kubectl apply -f sealed-secrets-key.yaml -n kube-system
# kubectl delete pod -n kube-system -l name=sealed-secrets-controller
```

### Step 9: Seal Secret from Literal Values

```bash
# Create and seal in one command
kubectl create secret generic mysecret \
  --from-literal=username=admin \
  --from-literal=password=secret123 \
  --dry-run=client -o yaml | \
  kubeseal > sealed-secret.yaml

# Or from file
kubectl create secret generic tls-secret \
  --from-file=tls.crt \
  --from-file=tls.key \
  --dry-run=client -o yaml | \
  kubeseal > sealed-tls-secret.yaml
```

### Step 10: CI/CD Integration

```bash
# Example GitHub Actions workflow
cat > .github/workflows/seal-secrets.yml <<'EOF'
name: Seal Secrets
on:
  push:
    paths:
    - 'secrets/*.yaml'

jobs:
  seal:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Install kubeseal
      run: |
        wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-0.24.0-linux-amd64.tar.gz
        tar xfz kubeseal-0.24.0-linux-amd64.tar.gz
        sudo install -m 755 kubeseal /usr/local/bin/kubeseal

    - name: Seal secrets
      run: |
        for secret in secrets/*.yaml; do
          kubeseal --cert pub-cert.pem < $secret > "sealed-${secret}"
        done

    - name: Commit sealed secrets
      run: |
        git config user.name "GitHub Actions"
        git config user.email "actions@github.com"
        git add sealed-*.yaml
        git commit -m "Seal secrets"
        git push
EOF
```

## ✅ Verification

### 1. Check Controller Status

```bash
# Verify controller running
kubectl get pods -n kube-system -l name=sealed-secrets-controller

# Check controller logs
kubectl logs -n kube-system deployment/sealed-secrets-controller

# Verify public key exists
kubeseal --fetch-cert
```

### 2. Verify SealedSecret

```bash
# List SealedSecrets
kubectl get sealedsecrets

# Describe SealedSecret
kubectl describe sealedsecret mysecret

# Check corresponding Secret exists
kubectl get secret mysecret

# Verify decryption
kubectl get secret mysecret -o yaml
```

### 3. Test Secret Updates

```bash
# Modify and reseal
echo "new-value" | kubectl create secret generic test \
  --from-literal=key=value \
  --dry-run=client -o yaml | \
  kubeseal | kubectl apply -f -

# Verify update
kubectl get secret test -o jsonpath='{.data.key}' | base64 -d
```

## 🧪 Hands-On Exercises

### Exercise 1: Multi-Environment Secrets

**Task**: Create sealed secrets for multiple environments:
- Dev: low-security values
- Staging: medium-security
- Prod: high-security values
- Store all in Git safely

### Exercise 2: Secret Rotation Policy

**Task**: Implement secret rotation:
- Create script to rotate secrets monthly
- Seal new secrets
- Update Git
- Verify ArgoCD syncs

### Exercise 3: Vault Integration

**Task**: Combine with HashiCorp Vault:
- Use Vault for secret storage
- Seal Vault credentials
- Deploy via ArgoCD

## 🧹 Cleanup

```bash
# Delete SealedSecrets
kubectl delete sealedsecrets --all

# Uninstall controller
kubectl delete -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Remove kubeseal CLI
sudo rm /usr/local/bin/kubeseal
```

## 📚 What You Learned

✅ Installed Sealed Secrets controller
✅ Sealed secrets with kubeseal
✅ Stored encrypted secrets in Git
✅ Integrated with ArgoCD
✅ Managed secret scopes
✅ Rotated secrets
✅ Backed up encryption keys

## 🎓 Key Concepts

### Secret Scope Comparison

| Scope | Rename | Move Namespace | Security | Use Case |
|-------|--------|----------------|----------|----------|
| strict | ✗ | ✗ | Highest | Production |
| namespace-wide | ✓ | ✗ | Medium | Multiple apps in NS |
| cluster-wide | ✓ | ✓ | Lowest | Dev/Test |

### Best Practices

1. **Never commit unsealed secrets** to Git
2. **Backup encryption keys** securely
3. **Use strict scope** in production
4. **Rotate secrets** regularly
5. **Audit secret access** via Git history
6. **Use separate keys** per cluster/environment
7. **Document emergency procedures** for key loss

### Encryption Key Management

```bash
# List encryption keys
kubectl get secrets -n kube-system \
  -l sealedsecrets.bitnami.com/sealed-secrets-key=active

# Rotate encryption key (new secrets use new key, old secrets still work)
kubectl label secret -n kube-system sealed-secrets-key \
  sealedsecrets.bitnami.com/sealed-secrets-key=compromised

# Force controller to generate new key
kubectl delete pod -n kube-system -l name=sealed-secrets-controller
```

## 🔜 Next Steps

**Tutorial 25**: Complete Application Stack - Putting it all together
- Deploy full production application
- Use all concepts from tutorials 11-24
- Complete GitOps workflow

## 💡 Pro Tips

1. **Offline sealing** (for CI/CD):
   ```bash
   kubeseal --cert pub-cert.pem < secret.yaml > sealed.yaml
   ```

2. **Re-encrypt for different namespace**:
   ```bash
   kubeseal --re-encrypt --namespace newns < sealed.yaml > sealed-new.yaml
   ```

3. **Verify sealed secret**:
   ```bash
   kubeseal --validate < sealed-secret.yaml
   ```

4. **Get raw secret value** (for debugging):
   ```bash
   kubectl get sealedsecret mysecret -o json | \
     jq -r '.spec.encryptedData.password' | base64 -d
   ```

5. **Seal multiple secrets at once**:
   ```bash
   for f in secrets/*.yaml; do kubeseal < $f > "sealed-$f"; done
   ```

## 🆘 Troubleshooting

**Problem**: Secret not created after applying SealedSecret
**Solution**: Check controller logs:
```bash
kubectl logs -n kube-system deployment/sealed-secrets-controller
# Look for decryption errors
```

**Problem**: Can't seal secret (certificate not found)
**Solution**: Fetch certificate:
```bash
kubeseal --fetch-cert > pub-cert.pem
kubeseal --cert pub-cert.pem < secret.yaml > sealed.yaml
```

**Problem**: Lost encryption key
**Solution**: If backed up:
```bash
kubectl apply -f sealed-secrets-key-backup.yaml -n kube-system
kubectl delete pod -n kube-system -l name=sealed-secrets-controller
```
If not backed up: Must re-seal all secrets with new key.

**Problem**: SealedSecret doesn't update Secret
**Solution**: Check scope and namespace:
```bash
kubectl describe sealedsecret <name>
# Verify namespace matches
```

## 📖 Additional Reading

- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [GitOps Secret Management](https://www.weave.works/blog/managing-secrets-in-flux)
- [SOPS Alternative](https://github.com/mozilla/sops)

---

**Estimated Time**: 60-90 minutes
**Difficulty**: Intermediate
**Prerequisites**: Tutorials 01-23 completed

**Next**: Tutorial 25 - Complete Application Stack
