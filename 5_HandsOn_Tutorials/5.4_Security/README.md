# 5.4 Security - Comprehensive Security Tutorials

## Overview

**60 hands-on security tutorials** covering IAM, secrets management, encryption, SSL/TLS, scanning, and zero-trust architectures. Build security into your infrastructure from the ground up with production-ready practices.

### 📊 Current Progress
```
[████████████████████░░░░░░░░░░░░░░░░░░░░] 18% Complete (11/60 tutorials)

✅ 5.4.1 IAM & RBAC: 10/10 COMPLETE
⏳ 5.4.2 Secrets Management: 1/10
📋 5.4.3 Encryption: 0/10
📋 5.4.4 SSL/TLS: 0/10
📋 5.4.5 Security Scanning: 0/10
📋 5.4.6 Zero Trust: 0/10
```

## Security Topics Covered

### [5.4.1 IAM & RBAC](./5.4.1_IAM_RBAC/)
**Focus**: Identity and Access Management, Role-Based Access Control
- **Tutorial 01**: Linux users and permissions
- **Tutorial 02**: Kubernetes RBAC (ServiceAccounts, Roles, RoleBindings)
- **Tutorial 03**: AWS IAM (Users, Groups, Policies)
- **Tutorial 04**: Azure AD and RBAC
- **Tutorial 05**: GCP IAM
- **Tutorial 06**: Policy as Code (OPA/Open Policy Agent)
- **Tutorial 07**: Just-in-Time access
- **Tutorial 08**: RBAC best practices
- **Tutorial 09**: Multi-cloud IAM
- **Tutorial 10**: Audit and compliance

### [5.4.2 Secrets Management](./5.4.2_Secrets_Management/)
**Focus**: Secure storage and distribution of credentials
- **Tutorial 01**: Environment variables (DON'T do this in prod!)
- **Tutorial 02**: HashiCorp Vault basics
- **Tutorial 03**: Vault dynamic secrets
- **Tutorial 04**: Vault Kubernetes integration
- **Tutorial 05**: Sealed Secrets (Bitnami)
- **Tutorial 06**: External Secrets Operator
- **Tutorial 07**: AWS Secrets Manager
- **Tutorial 08**: Azure Key Vault
- **Tutorial 09**: GCP Secret Manager
- **Tutorial 10**: Secret rotation strategies

### [5.4.3 Encryption](./5.4.3_Encryption/)
**Focus**: Data protection at rest and in transit
- **Tutorial 01**: Symmetric vs asymmetric encryption
- **Tutorial 02**: Encrypting files (GPG, age)
- **Tutorial 03**: Database encryption at rest
- **Tutorial 04**: Kubernetes encryption at rest (etcd)
- **Tutorial 05**: Application-level encryption
- **Tutorial 06**: Cloud KMS (AWS, Azure, GCP)
- **Tutorial 07**: Envelope encryption
- **Tutorial 08**: Key rotation
- **Tutorial 09**: Hardware Security Modules (HSM)
- **Tutorial 10**: Homomorphic encryption basics

### [5.4.4 SSL/TLS](./5.4.4_SSL_TLS/)
**Focus**: Secure communication over networks
- **Tutorial 01**: TLS basics and certificates
- **Tutorial 02**: Self-signed certificates
- **Tutorial 03**: Let's Encrypt with cert-manager
- **Tutorial 04**: NGINX with TLS
- **Tutorial 05**: Mutual TLS (mTLS)
- **Tutorial 06**: Certificate rotation
- **Tutorial 07**: TLS in Kubernetes (Ingress)
- **Tutorial 08**: Service mesh mTLS (Istio)
- **Tutorial 09**: Certificate pinning
- **Tutorial 10**: TLS 1.3 and modern ciphers

### [5.4.5 Security Scanning](./5.4.5_Security_Scanning/)
**Focus**: Vulnerability detection and remediation
- **Tutorial 01**: Container image scanning (Trivy)
- **Tutorial 02**: SAST - Static Application Security Testing
- **Tutorial 03**: DAST - Dynamic Application Security Testing
- **Tutorial 04**: Dependency scanning (Snyk, Dependabot)
- **Tutorial 05**: Infrastructure scanning (Checkov, tfsec)
- **Tutorial 06**: Kubernetes security scanning (kubesec, kube-bench)
- **Tutorial 07**: Secrets scanning (gitleaks, trufflehog)
- **Tutorial 08**: Container runtime security (Falco)
- **Tutorial 09**: CI/CD integration
- **Tutorial 10**: Security policies and gates

### [5.4.6 Zero Trust](./5.4.6_Zero_Trust/)
**Focus**: Never trust, always verify
- **Tutorial 01**: Zero trust principles
- **Tutorial 02**: Network segmentation
- **Tutorial 03**: Microsegmentation with network policies
- **Tutorial 04**: Identity-based access
- **Tutorial 05**: Device trust
- **Tutorial 06**: Continuous verification
- **Tutorial 07**: Zero trust with service mesh
- **Tutorial 08**: BeyondCorp implementation
- **Tutorial 09**: SPIFFE/SPIRE
- **Tutorial 10**: Complete zero trust architecture

## Quick Start: Vault for Secrets Management

### Setup with Docker

```bash
# Start Vault in dev mode
docker run -d --name vault \
  -p 8200:8200 \
  -e VAULT_DEV_ROOT_TOKEN_ID=myroot \
  vault:latest

# Set environment
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='myroot'

# Install Vault CLI
brew install vault
```

### Basic Operations

```bash
# Write a secret
vault kv put secret/myapp \
  username=admin \
  password=supersecret

# Read a secret
vault kv get secret/myapp

# Get specific field
vault kv get -field=password secret/myapp

# List secrets
vault kv list secret/

# Delete secret
vault kv delete secret/myapp
```

### Application Integration (Node.js)

```javascript
const vault = require('node-vault')({
  endpoint: 'http://localhost:8200',
  token: 'myroot'
});

async function getSecret() {
  try {
    const result = await vault.read('secret/data/myapp');
    const { username, password } = result.data.data;

    console.log('Username:', username);
    console.log('Password:', password);

    // Use credentials
    connectToDatabase(username, password);
  } catch (err) {
    console.error('Error reading secret:', err);
  }
}

getSecret();
```

## Quick Start: Kubernetes RBAC

### Create ServiceAccount and Role

```yaml
# serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-reader
  namespace: default
---
# role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
---
# rolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: ServiceAccount
  name: app-reader
  namespace: default
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

```bash
# Apply
kubectl apply -f serviceaccount.yaml

# Test permissions
kubectl auth can-i list pods --as=system:serviceaccount:default:app-reader
# yes

kubectl auth can-i delete pods --as=system:serviceaccount:default:app-reader
# no
```

## Security Best Practices

### Principle of Least Privilege
```
✅ Grant minimum permissions needed
❌ Don't use admin/root for everything
✅ Separate read and write permissions
❌ Don't share credentials
✅ Use service-specific accounts
```

### Defense in Depth
```
Layer 1: Network (Firewalls, Network Policies)
Layer 2: Host (OS hardening, patches)
Layer 3: Application (Input validation, auth)
Layer 4: Data (Encryption, access control)
Layer 5: Monitoring (Logging, alerting)
```

### Secrets Management
```
❌ NEVER commit secrets to Git
❌ NEVER use plaintext environment variables
✅ Use dedicated secrets managers (Vault, cloud providers)
✅ Rotate secrets regularly
✅ Use dynamic secrets when possible
✅ Encrypt secrets at rest
```

### Container Security
```
✅ Scan images for vulnerabilities
✅ Use minimal base images (alpine, distroless)
✅ Run as non-root user
✅ Use read-only root filesystem
✅ Drop capabilities
✅ Use security contexts
```

### Network Security
```
✅ Enable network policies (deny all by default)
✅ Use private networks for databases
✅ Implement mTLS between services
✅ Use Web Application Firewall (WAF)
✅ Rate limiting and DDoS protection
```

## Security Scanning Example (Trivy)

```bash
# Install Trivy
brew install trivy

# Scan Docker image
trivy image nginx:latest

# Scan filesystem
trivy fs .

# Scan Kubernetes manifests
trivy config k8s/

# Scan IaC (Terraform)
trivy config terraform/

# CI/CD integration
trivy image --severity HIGH,CRITICAL \
  --exit-code 1 \
  myapp:latest
```

## Example Security Policies (OPA)

```rego
# policy.rego - Deny containers running as root
package kubernetes.admission

deny[msg] {
  input.request.kind.kind == "Pod"
  container := input.request.object.spec.containers[_]
  not container.securityContext.runAsNonRoot

  msg := sprintf("Container %s must run as non-root", [container.name])
}

deny[msg] {
  input.request.kind.kind == "Pod"
  container := input.request.object.spec.containers[_]
  container.securityContext.runAsUser == 0

  msg := sprintf("Container %s cannot run as UID 0", [container.name])
}
```

## Prerequisites

```bash
# Vault
brew install vault

# Security scanning
brew install trivy
brew install grype

# Kubernetes tools
brew install kubectl
brew install helm

# Encryption tools
brew install gnupg
brew install age

# Policy tools
brew install opa

# Git security
brew install gitleaks
brew install trufflehog
```

## Recommended Study Path

### Week 1: Foundations
- Days 1-3: IAM & RBAC (tutorials 1-6)
- Days 4-5: Secrets Management (tutorials 1-3)
- Weekend: Review and practice

### Week 2: Data Protection
- Days 1-3: Secrets Management (tutorials 4-10)
- Days 4-5: Encryption (tutorials 1-5)
- Weekend: Implement in a project

### Week 3: Communication Security
- Days 1-5: SSL/TLS (all 10 tutorials)
- Weekend: Set up mTLS for microservices

### Week 4: Scanning & Zero Trust
- Days 1-3: Security Scanning (tutorials 1-7)
- Days 4-5: Zero Trust (tutorials 1-5)
- Weekend: Build secure CI/CD pipeline

### Week 5: Advanced
- Days 1-2: Complete remaining tutorials
- Days 3-5: Build complete secure architecture
- Weekend: Security audit of personal projects

## What You'll Master

After completing all tutorials:
- ✅ Implement RBAC across platforms
- ✅ Securely manage secrets
- ✅ Encrypt data at rest and in transit
- ✅ Configure SSL/TLS and mTLS
- ✅ Scan for vulnerabilities
- ✅ Apply security policies
- ✅ Implement zero trust architecture
- ✅ Secure Kubernetes clusters
- ✅ Integrate security into CI/CD
- ✅ Conduct security audits

## Common Security Mistakes

### ❌ Hardcoded Secrets
```javascript
// NEVER do this!
const password = "supersecret123";
const apiKey = "sk_live_123456789";
```

### ✅ Use Environment Variables + Secrets Manager
```javascript
// Better
const password = process.env.DB_PASSWORD; // from Vault

// Even better - fetch directly
const vault = require('node-vault');
const secret = await vault.read('secret/data/db');
```

### ❌ Running as Root
```dockerfile
# NEVER do this!
FROM ubuntu
USER root
RUN apt-get update
```

### ✅ Non-Root User
```dockerfile
# Good practice
FROM ubuntu
RUN useradd -m -u 1000 appuser
USER appuser
```

### ❌ Overly Permissive RBAC
```yaml
# NEVER do this!
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
```

### ✅ Least Privilege
```yaml
# Good practice
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
```

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [Kubernetes Security](https://kubernetes.io/docs/concepts/security/)
- [Vault Documentation](https://www.vaultproject.io/docs)
- [cert-manager](https://cert-manager.io/docs/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Next Steps

1. Start with IAM & RBAC fundamentals
2. Master secrets management with Vault
3. Implement encryption everywhere
4. Set up automated security scanning
5. Build zero trust architecture
6. Conduct regular security audits

---

**Total Tutorials**: 60 (6 topics × 10 tutorials)
**Estimated Time**: 100-120 hours
**Difficulty**: Intermediate to Advanced
**Cost**: Free (mostly runs locally)
