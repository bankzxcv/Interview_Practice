# 5.4.5 Security Scanning - Vulnerability Detection

## Overview

Learn to identify and remediate security vulnerabilities across your entire stack - from container images to infrastructure code. Implement automated security scanning in CI/CD pipelines to shift security left.

## Tutorials

### [01 - Container Image Scanning (Trivy)](./01_container_scanning_trivy/)
- Trivy installation and usage
- Scanning Docker images
- CVE detection and severity levels
- CI/CD integration
- Remediation strategies

**Time**: 2-3 hours | **Difficulty**: Beginner

### [02 - SAST (Static Application Security Testing)](./02_sast/)
- Source code security analysis
- SonarQube, Semgrep, CodeQL
- Finding vulnerabilities before runtime
- False positive management
- IDE integration

**Time**: 3-4 hours | **Difficulty**: Intermediate

### [03 - DAST (Dynamic Application Security Testing)](./03_dast/)
- Runtime security testing
- OWASP ZAP, Burp Suite
- Web application scanning
- API security testing
- Authenticated scanning

**Time**: 3-4 hours | **Difficulty**: Intermediate

### [04 - Dependency Scanning (Snyk, Dependabot)](./04_dependency_scanning/)
- Third-party library vulnerabilities
- Snyk integration
- GitHub Dependabot
- Automatic PRs for fixes
- License compliance

**Time**: 2-3 hours | **Difficulty**: Beginner

### [05 - Infrastructure Scanning (Checkov, tfsec)](./05_iac_scanning/)
- Terraform security scanning
- CloudFormation validation
- Kubernetes manifest scanning
- Policy as code
- Custom rules

**Time**: 3 hours | **Difficulty**: Intermediate

### [06 - Kubernetes Security Scanning](./06_kubernetes_security_scanning/)
- kubesec - pod security scoring
- kube-bench - CIS benchmarks
- kube-hunter - penetration testing
- Polaris - best practices
- Admission controllers

**Time**: 3 hours | **Difficulty**: Intermediate

### [07 - Secrets Scanning (gitleaks, trufflehog)](./07_secrets_scanning/)
- Detecting committed secrets
- Pre-commit hooks
- Repository scanning
- Historical secret detection
- Remediation workflow

**Time**: 2 hours | **Difficulty**: Beginner

### [08 - Runtime Security (Falco)](./08_runtime_security_falco/)
- Falco installation
- Runtime threat detection
- Custom rules
- Integration with SIEM
- Response automation

**Time**: 3-4 hours | **Difficulty**: Advanced

### [09 - CI/CD Integration](./09_cicd_integration/)
- GitHub Actions security scanning
- GitLab CI security templates
- Jenkins security plugins
- Fail builds on critical CVEs
- Security dashboards

**Time**: 3 hours | **Difficulty**: Intermediate

### [10 - Security Policies and Gates](./10_security_gates/)
- Defining security gates
- Automated policy enforcement
- Exception management
- Metrics and KPIs
- Continuous improvement

**Time**: 2-3 hours | **Difficulty**: Intermediate

## Quick Start: Trivy

```bash
# Install Trivy
brew install trivy

# Scan Docker image
trivy image nginx:latest

# Scan with severity filter
trivy image --severity HIGH,CRITICAL nginx:latest

# Fail on critical vulnerabilities
trivy image --exit-code 1 --severity CRITICAL nginx:latest

# Scan filesystem
trivy fs .

# Scan Kubernetes manifests
trivy config k8s/

# Scan Terraform
trivy config terraform/

# Output as JSON
trivy image --format json -o results.json nginx:latest

# Generate SARIF for GitHub
trivy image --format sarif -o results.sarif nginx:latest
```

## Quick Start: Snyk

```bash
# Install Snyk
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor project
snyk monitor

# Test Docker image
snyk container test nginx:latest

# Test IaC
snyk iac test terraform/

# Fix vulnerabilities
snyk fix
```

## Scanning Workflow

```
1. Developer writes code
   ↓
2. Pre-commit: Secret scanning
   ↓
3. Git push
   ↓
4. CI: SAST (static analysis)
   ↓
5. CI: Dependency scanning
   ↓
6. CI: Container image scanning
   ↓
7. CI: IaC scanning
   ↓
8. Deploy to staging
   ↓
9. DAST (dynamic testing)
   ↓
10. Deploy to production
   ↓
11. Runtime security monitoring
```

## CI/CD Integration Example

### GitHub Actions

```yaml
name: Security Scanning

on: [push, pull_request]

jobs:
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - name: Gitleaks Scan
        uses: gitleaks/gitleaks-action@v2

  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1

  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build image
        run: docker build -t myapp:${{ github.sha }} .
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          format: sarif
          output: trivy-results.sarif
      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: trivy-results.sarif

  iac-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Checkov
        uses: bridgecrewio/checkov-action@master
        with:
          directory: terraform/
          framework: terraform
```

## Vulnerability Severity

| Level | Description | Action |
|-------|-------------|--------|
| **CRITICAL** | Actively exploited, easy to exploit | Fix immediately |
| **HIGH** | Significant risk, needs attention | Fix within 7 days |
| **MEDIUM** | Moderate risk | Fix within 30 days |
| **LOW** | Minor risk | Fix when convenient |
| **INFO** | No direct risk | Optional |

## Tool Comparison

| Tool | Type | Best For | Cost |
|------|------|----------|------|
| **Trivy** | Container/IaC | General purpose | Free |
| **Snyk** | Multi-purpose | Comprehensive | Free tier + paid |
| **Grype** | Container | Images | Free |
| **Checkov** | IaC | Terraform/K8s | Free |
| **SonarQube** | SAST | Code quality | Free tier + paid |
| **OWASP ZAP** | DAST | Web apps | Free |
| **Falco** | Runtime | K8s runtime | Free |
| **gitleaks** | Secrets | Git repos | Free |

## Common Vulnerability Types

### Application Code
- SQL Injection
- Cross-Site Scripting (XSS)
- Authentication flaws
- Sensitive data exposure
- XML External Entities (XXE)
- Insecure deserialization
- Using components with known vulnerabilities

### Infrastructure
- Unencrypted storage
- Overly permissive IAM
- Open security groups
- Unpatched systems
- Missing encryption in transit
- Weak password policies
- Exposed secrets

### Containers
- Outdated base images
- Running as root
- Vulnerable dependencies
- Secrets in layers
- Unnecessary packages
- Missing health checks

## Remediation Strategies

### 1. Update Dependencies
```bash
# Check for updates
npm outdated
pip list --outdated

# Update package
npm update package-name
pip install --upgrade package-name

# Automated updates
# Dependabot (GitHub)
# Renovate (multi-platform)
```

### 2. Patch Containers
```dockerfile
# Update base image
FROM node:18-alpine  # Use specific, updated version

# Update packages
RUN apk update && apk upgrade

# Remove unnecessary packages
RUN apk del apk-tools
```

### 3. Fix IaC Issues
```hcl
# Bad: Public S3 bucket
resource "aws_s3_bucket" "bad" {
  bucket = "my-bucket"
  acl    = "public-read"  # ❌
}

# Good: Private with encryption
resource "aws_s3_bucket" "good" {
  bucket = "my-bucket"
  acl    = "private"  # ✅
}

resource "aws_s3_bucket_server_side_encryption_configuration" "good" {
  bucket = aws_s3_bucket.good.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

## Best Practices

### Shift Left Security
- **Scan early** in development
- **Pre-commit hooks** for secrets
- **IDE plugins** for real-time feedback
- **Fast feedback** to developers

### Automated Scanning
- **Every commit** scanned
- **Nightly full scans**
- **Container registry** scanning
- **Production monitoring**

### Vulnerability Management
- **Prioritize** by severity and exploitability
- **Track remediation** progress
- **Set SLAs** for fixes
- **Exceptions** documented and approved
- **Retest** after fixes

### Developer Experience
- **Clear messages** on what to fix
- **Provide guidance** on remediation
- **Reduce false positives**
- **Don't break builds** unnecessarily
- **Security champions** in teams

## Compliance and Reporting

```bash
# Generate compliance report
trivy image --compliance docker-cis nginx:latest

# SBOM (Software Bill of Materials)
syft packages nginx:latest -o spdx-json

# Export results
trivy image --format json nginx:latest | \
  jq '.Results[].Vulnerabilities | length'

# Aggregate metrics
# - Total vulnerabilities found
# - By severity
# - Mean time to remediate
# - Coverage (% of code scanned)
# - Trend over time
```

## Falco Runtime Detection

```yaml
# /etc/falco/falco_rules.local.yaml
- rule: Unauthorized Process in Container
  desc: Detect unexpected processes
  condition: >
    spawned_process and
    container and not
    proc.name in (allowed_processes)
  output: >
    Unauthorized process started
    (user=%user.name command=%proc.cmdline container=%container.name)
  priority: WARNING

- rule: Write to System Directory
  desc: Detect writes to system paths
  condition: >
    open_write and
    container and
    fd.name startswith /etc
  output: >
    Write to system directory
    (file=%fd.name container=%container.name)
  priority: ERROR
```

## Key Takeaways

1. **Scan everything** - code, dependencies, containers, IaC
2. **Automate scanning** in CI/CD
3. **Shift left** - catch issues early
4. **Prioritize** by severity and exploitability
5. **Fast feedback** to developers
6. **Track and measure** remediation
7. **Runtime monitoring** for production
8. **Continuous improvement** process

## Next Section

After mastering Security Scanning, proceed to:
- **5.4.6 Zero Trust**: Never trust, always verify architecture

---

**Total Time**: 25-30 hours
**Difficulty**: Beginner to Advanced
**Cost**: Free (open source) to paid (commercial)
