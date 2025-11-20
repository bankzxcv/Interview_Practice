# 5.4 Security - Hands-On Tutorials

## Overview

Comprehensive security tutorials covering the complete security lifecycle - from identity and access management to zero-trust architectures. Build security into your infrastructure from the ground up with practical, hands-on examples.

## 📚 Tutorial Sections

### [5.4.1 IAM & RBAC](./5.4.1_IAM_RBAC/) - Identity and Access Management
Master access control across Linux, Kubernetes, AWS, Azure, and GCP. Learn policy-as-code with OPA and implement least privilege everywhere.

**Topics**: 10 tutorials covering Linux permissions, Kubernetes RBAC, cloud IAM, OPA, JIT access, best practices, multi-cloud, and compliance.

**Time**: 30-35 hours | **Difficulty**: Beginner to Advanced

---

### [5.4.2 Secrets Management](./5.4.2_Secrets_Management/) - Secure Credentials
Never hardcode secrets again! Learn industry-standard secrets management with Vault, cloud providers, and Kubernetes-native solutions.

**Topics**: 10 tutorials covering environment variables anti-patterns, Vault (basics, dynamic secrets, K8s integration), Sealed Secrets, External Secrets Operator, AWS/Azure/GCP secrets managers, and rotation strategies.

**Time**: 25-30 hours | **Difficulty**: Beginner to Advanced

---

### [5.4.3 Encryption](./5.4.3_Encryption/) - Data Protection
Protect data at rest and in transit. Master encryption algorithms, key management, and implement encryption across your entire stack.

**Topics**: 10 tutorials covering symmetric/asymmetric encryption, file encryption (GPG, age), database encryption, Kubernetes etcd encryption, app-level encryption, cloud KMS, envelope encryption, key rotation, HSM, and homomorphic encryption.

**Time**: 25-30 hours | **Difficulty**: Beginner to Advanced

---

### [5.4.4 SSL/TLS](./5.4.4_SSL_TLS/) - Secure Communication
Implement TLS everywhere. Learn certificate management, mutual TLS for service-to-service auth, and modern TLS configurations.

**Topics**: 10 tutorials covering TLS basics, self-signed certificates, Let's Encrypt with cert-manager, NGINX TLS, mTLS, certificate rotation, Kubernetes Ingress TLS, service mesh mTLS, certificate pinning, and TLS 1.3.

**Time**: 25-30 hours | **Difficulty**: Beginner to Advanced

---

### [5.4.5 Security Scanning](./5.4.5_Security_Scanning/) - Vulnerability Detection
Shift security left! Scan everything - containers, code, dependencies, infrastructure. Automate security in CI/CD pipelines.

**Topics**: 10 tutorials covering container scanning (Trivy), SAST, DAST, dependency scanning, IaC scanning, Kubernetes security scanning, secrets scanning, runtime security (Falco), CI/CD integration, and security gates.

**Time**: 25-30 hours | **Difficulty**: Beginner to Advanced

---

### [5.4.6 Zero Trust](./5.4.6_Zero_Trust/) - Never Trust, Always Verify
Implement modern Zero Trust architecture. No implicit trust, verify everything, limit blast radius.

**Topics**: 10 tutorials covering Zero Trust principles, network segmentation, microsegmentation, identity-based access, device trust, continuous verification, service mesh Zero Trust, BeyondCorp, SPIFFE/SPIRE, and complete architecture.

**Time**: 30-35 hours | **Difficulty**: Intermediate to Advanced

---

## 🚀 Quick Start Guides

### Vault for Secrets Management

```bash
# Start Vault in dev mode
docker run -d --name vault \
  -p 8200:8200 \
  -e VAULT_DEV_ROOT_TOKEN_ID=myroot \
  vault:latest

# Set environment
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='myroot'

# Store a secret
vault kv put secret/myapp \
  username=admin \
  password=supersecret

# Read secret
vault kv get secret/myapp
vault kv get -field=password secret/myapp
```

### Kubernetes RBAC

```yaml
# ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-reader
---
# Role
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
subjects:
- kind: ServiceAccount
  name: app-reader
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

```bash
# Test permissions
kubectl auth can-i list pods --as=system:serviceaccount:default:app-reader
```

### Security Scanning with Trivy

```bash
# Install
brew install trivy

# Scan Docker image
trivy image nginx:latest

# Scan with severity filter
trivy image --severity HIGH,CRITICAL nginx:latest

# Fail on critical vulnerabilities
trivy image --exit-code 1 --severity CRITICAL myapp:latest

# Scan filesystem
trivy fs .

# Scan Kubernetes manifests
trivy config k8s/

# Scan Terraform
trivy config terraform/
```

### Network Policies (Zero Trust)

```yaml
# Default deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress
---
# Allow only specific traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

## 📖 Recommended Learning Path

### Month 1: Identity and Secrets (Weeks 1-4)
**Week 1**: Linux permissions and Kubernetes RBAC
**Week 2**: AWS IAM, Azure AD, GCP IAM
**Week 3**: Vault basics and dynamic secrets
**Week 4**: Cloud secrets managers and rotation

**Outcome**: Implement proper access control and secrets management

---

### Month 2: Encryption and TLS (Weeks 5-8)
**Week 5**: Encryption fundamentals and file encryption
**Week 6**: Database and application encryption
**Week 7**: TLS basics and Let's Encrypt
**Week 8**: mTLS and certificate management

**Outcome**: Encrypt data at rest and in transit

---

### Month 3: Scanning and Zero Trust (Weeks 9-12)
**Week 9**: Container and dependency scanning
**Week 10**: SAST, DAST, and IaC scanning
**Week 11**: Network segmentation and microsegmentation
**Week 12**: Service mesh and complete Zero Trust

**Outcome**: Automated security scanning and Zero Trust architecture

---

## 🛡️ Security Best Practices

### Principle of Least Privilege
```
✅ Grant minimum permissions needed
✅ Use time-limited access (JIT)
✅ Separate read and write permissions
✅ Regular access reviews

❌ Don't use admin/root for everything
❌ Don't share credentials
❌ Don't grant wildcard permissions
```

### Defense in Depth
```
Layer 1: Network (Firewalls, Network Policies)
Layer 2: Host (OS hardening, patches)
Layer 3: Application (Input validation, auth)
Layer 4: Data (Encryption, access control)
Layer 5: Monitoring (Logging, alerting, SIEM)
```

### Secrets Management
```
❌ NEVER commit secrets to Git
❌ NEVER use plaintext environment variables in production
❌ NEVER hardcode credentials

✅ Use dedicated secrets managers (Vault, cloud providers)
✅ Rotate secrets regularly
✅ Use dynamic secrets when possible
✅ Encrypt secrets at rest and in transit
✅ Audit all secret access
```

### Container Security
```
✅ Scan images for vulnerabilities
✅ Use minimal base images (alpine, distroless)
✅ Run as non-root user
✅ Use read-only root filesystem
✅ Drop unnecessary capabilities
✅ Define resource limits
✅ Use security contexts
```

### Network Security
```
✅ Enable network policies (deny all by default)
✅ Use private networks for databases
✅ Implement mTLS between services
✅ Use Web Application Firewall (WAF)
✅ Rate limiting and DDoS protection
✅ Zero Trust architecture
```

## 🔧 Essential Tools

### Access Control
- `kubectl` - Kubernetes CLI
- `aws-cli` - AWS CLI
- `az-cli` - Azure CLI
- `gcloud` - Google Cloud CLI
- `opa` - Open Policy Agent

### Secrets Management
- `vault` - HashiCorp Vault
- `sealed-secrets` - Bitnami Sealed Secrets
- `external-secrets` - External Secrets Operator

### Encryption
- `openssl` - Cryptography toolkit
- `age` - Modern file encryption
- `gpg` - GNU Privacy Guard
- `step` - Step CA CLI

### TLS/Certificates
- `certbot` - Let's Encrypt client
- `cert-manager` - Kubernetes cert automation
- `cfssl` - CloudFlare PKI toolkit
- `mkcert` - Local development certs

### Security Scanning
- `trivy` - Container/IaC scanner
- `snyk` - Multi-purpose scanner
- `grype` - Container scanner
- `checkov` - IaC scanner
- `gitleaks` - Secrets scanner
- `semgrep` - SAST tool

### Monitoring
- `falco` - Runtime security
- `prometheus` - Metrics
- `grafana` - Visualization
- `elastic` - Log aggregation

## 📊 What You'll Master

After completing all tutorials:

- ✅ Implement RBAC across Linux, Kubernetes, AWS, Azure, GCP
- ✅ Securely manage secrets with Vault and cloud providers
- ✅ Encrypt data at rest and in transit
- ✅ Configure SSL/TLS and mutual TLS
- ✅ Scan for vulnerabilities in code, containers, and infrastructure
- ✅ Apply security policies as code (OPA)
- ✅ Implement Zero Trust architecture
- ✅ Secure Kubernetes clusters end-to-end
- ✅ Integrate security into CI/CD pipelines
- ✅ Conduct security audits and compliance checks
- ✅ Respond to security incidents
- ✅ Build security automation

## ⚠️ Common Security Mistakes

### ❌ Hardcoded Secrets
```javascript
// NEVER do this!
const password = "supersecret123";
const apiKey = "sk_live_123456789";
const dbUrl = "postgres://admin:password@db:5432/mydb";
```

### ✅ Use Secrets Manager
```javascript
// Good practice
const vault = require('node-vault')({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

const secret = await vault.read('secret/data/myapp/config');
const password = secret.data.data.db_password;
```

---

### ❌ Running as Root
```dockerfile
# NEVER do this!
FROM ubuntu
USER root
CMD ["./app"]
```

### ✅ Non-Root User
```dockerfile
# Good practice
FROM ubuntu
RUN useradd -m -u 1000 appuser
USER appuser
WORKDIR /app
CMD ["./app"]
```

---

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
  resources: ["pods", "services"]
  verbs: ["get", "list"]
```

---

### ❌ No Network Policies
```yaml
# By default, all pods can talk to all pods - BAD!
```

### ✅ Default Deny + Explicit Allow
```yaml
# Good practice
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

## 📈 Security Maturity Model

### Level 1: Ad-Hoc (Starting Point)
- Manual security processes
- Reactive security responses
- Limited tooling
- No consistent policies

### Level 2: Managed
- Some automation
- Basic scanning in place
- Documented policies
- Incident response plan

### Level 3: Defined
- Automated scanning in CI/CD
- Secrets management implemented
- Regular security training
- Compliance monitoring

### Level 4: Measured
- Metrics and KPIs tracked
- Security gates enforced
- Continuous monitoring
- Regular audits

### Level 5: Optimized
- Fully automated security
- Self-healing systems
- Predictive threat detection
- Security as culture

## 🎯 Assessment Questions

Test your knowledge:

1. **IAM**: Create a Kubernetes ServiceAccount with read-only pod access in the `dev` namespace
2. **Secrets**: Configure Vault to provide dynamic database credentials with 1-hour TTL
3. **Encryption**: Implement envelope encryption for sensitive data in your application
4. **TLS**: Set up automated Let's Encrypt certificates with cert-manager
5. **Scanning**: Configure CI/CD to fail builds on HIGH/CRITICAL vulnerabilities
6. **Zero Trust**: Implement network policies that deny all traffic except specific allowed flows
7. **Compliance**: Generate a security compliance report for your infrastructure

## 📚 Additional Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [Kubernetes Security](https://kubernetes.io/docs/concepts/security/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Vault Documentation](https://www.vaultproject.io/docs)
- [cert-manager](https://cert-manager.io/docs/)

### Training
- [Kubernetes Security Specialist (CKS)](https://www.cncf.io/certification/cks/)
- [AWS Security Specialty](https://aws.amazon.com/certification/certified-security-specialty/)
- [CISSP](https://www.isc2.org/Certifications/CISSP)

### Communities
- [Cloud Native Security](https://github.com/cncf/tag-security)
- [OWASP Community](https://owasp.org/)
- [r/netsec](https://www.reddit.com/r/netsec/)

## 🎓 Certification Paths

After completing these tutorials, you'll be prepared for:

- **Certified Kubernetes Security Specialist (CKS)**
- **AWS Certified Security - Specialty**
- **Microsoft Certified: Azure Security Engineer Associate**
- **Google Professional Cloud Security Engineer**
- **Certified Information Systems Security Professional (CISSP)**

## 🚦 Getting Started

### Prerequisites
- Basic Linux command line knowledge
- Understanding of networking concepts
- Familiarity with containers and Kubernetes
- Access to a cloud provider (for cloud-specific tutorials)
- Local development environment (Docker, kind/minikube)

### Installation
```bash
# Essential tools
brew install kubectl vault trivy age gpg opa

# Cloud CLIs
brew install awscli azure-cli google-cloud-sdk

# Kubernetes cluster (for local development)
brew install kind
kind create cluster --name security-lab
```

### Your First Tutorial
Start with [5.4.1 IAM & RBAC - Tutorial 01: Linux Permissions](./5.4.1_IAM_RBAC/01_linux_permissions/) to build a solid foundation.

## 📊 Summary

**Total Tutorials**: 60 (6 topics × 10 tutorials each)
**Total Time**: 160-180 hours (4-5 months part-time)
**Difficulty Range**: Beginner to Advanced
**Cost**: Free (mostly uses open source tools)

**Skills Gained**:
- Identity and Access Management
- Secrets Management
- Encryption (at rest and in transit)
- TLS/mTLS Implementation
- Security Scanning and Remediation
- Zero Trust Architecture

**Career Impact**:
- Security Engineer
- DevSecOps Engineer
- Cloud Security Architect
- Kubernetes Security Specialist
- Site Reliability Engineer (SRE) with security focus

---

**Ready to secure your infrastructure?** Start with [5.4.1 IAM & RBAC](./5.4.1_IAM_RBAC/) and build your security expertise step by step!

Security is not a feature—it's a foundation. Let's build it right! 🔒
