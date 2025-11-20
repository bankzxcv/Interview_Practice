# 5.4.2 Secrets Management - Secure Credential Storage

## Overview

Learn to securely store, distribute, and manage secrets (passwords, API keys, certificates) using industry-standard tools and practices. Never hardcode secrets again!

## Tutorials

### [01 - Environment Variables Anti-pattern](./01_env_vars_antipattern/)
**Why environment variables aren't enough**
- Security risks of plaintext env vars
- Better alternatives
- When env vars are acceptable
- Migration strategies

**Time**: 1 hour | **Difficulty**: Beginner

### [02 - HashiCorp Vault Basics](./02_vault_basics/)
**Industry-standard secrets management**
- Vault installation and setup
- KV secrets engine
- Authentication methods and policies
- Application integration
- Production deployment

**Time**: 3-4 hours | **Difficulty**: Intermediate

### [03 - Vault Dynamic Secrets](./03_vault_dynamic_secrets/)
**On-demand credential generation**
- Database dynamic secrets
- AWS dynamic credentials
- SSH OTP and dynamic keys
- Automatic credential rotation

**Time**: 3 hours | **Difficulty**: Intermediate

### [04 - Vault Kubernetes Integration](./04_vault_kubernetes/)
**Secrets in Kubernetes**
- Vault Agent injector
- CSI driver integration
- Vault Secrets Operator
- Best practices for K8s + Vault

**Time**: 3 hours | **Difficulty**: Intermediate

### [05 - Sealed Secrets](./05_sealed_secrets/)
**GitOps-friendly encrypted secrets**
- Bitnami Sealed Secrets controller
- Encrypting secrets for Git
- Key management
- Rotation and recovery

**Time**: 2 hours | **Difficulty**: Intermediate

### [06 - External Secrets Operator](./06_external_secrets_operator/)
**Sync secrets from external sources**
- ESO installation and configuration
- Integration with Vault, AWS, Azure, GCP
- SecretStore and ClusterSecretStore
- Refresh and rotation strategies

**Time**: 2-3 hours | **Difficulty**: Intermediate

### [07 - AWS Secrets Manager](./07_aws_secrets_manager/)
**AWS-native secrets management**
- Creating and retrieving secrets
- Automatic rotation
- IAM integration
- Cost optimization

**Time**: 2-3 hours | **Difficulty**: Intermediate

### [08 - Azure Key Vault](./08_azure_key_vault/)
**Azure secrets and key management**
- Key Vault basics
- Managed identities
- Secrets, keys, and certificates
- Integration with Azure services

**Time**: 2-3 hours | **Difficulty**: Intermediate

### [09 - GCP Secret Manager](./09_gcp_secret_manager/)
**Google Cloud secret storage**
- Secret Manager API
- Service account integration
- Versioning and rotation
- Access control with IAM

**Time**: 2 hours | **Difficulty**: Intermediate

### [10 - Secret Rotation Strategies](./10_secret_rotation/)
**Automated credential rotation**
- Why rotate secrets?
- Zero-downtime rotation patterns
- Automation with Vault/cloud providers
- Monitoring and alerting

**Time**: 3 hours | **Difficulty**: Advanced

## Quick Start: Vault

```bash
# Start Vault in dev mode
docker run -d --name vault -p 8200:8200 \
  -e VAULT_DEV_ROOT_TOKEN_ID=myroot \
  vault:latest

# Set environment
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='myroot'

# Store a secret
vault kv put secret/myapp/config \
  db_password=supersecret \
  api_key=abc123

# Retrieve secret
vault kv get secret/myapp/config
vault kv get -field=db_password secret/myapp/config
```

## Quick Start: AWS Secrets Manager

```bash
# Create secret
aws secretsmanager create-secret \
  --name myapp/database \
  --secret-string '{"username":"admin","password":"secret123"}'

# Retrieve secret
aws secretsmanager get-secret-value \
  --secret-id myapp/database \
  --query SecretString \
  --output text | jq .password

# Update secret
aws secretsmanager update-secret \
  --secret-id myapp/database \
  --secret-string '{"username":"admin","password":"newsecret456"}'
```

## Security Best Practices

### ✅ Do's
- Use dedicated secrets management tools
- Rotate secrets regularly
- Use dynamic secrets when possible
- Encrypt secrets at rest
- Audit secret access
- Use short TTLs
- Implement least privilege
- Never commit secrets to Git

### ❌ Don'ts
- Hardcode secrets in code
- Use long-lived credentials
- Share secrets between environments
- Store secrets in plaintext
- Skip audit logs
- Use the same secret everywhere
- Ignore secret sprawl

## Comparison Matrix

| Solution | Best For | Pros | Cons |
|----------|----------|------|------|
| **Vault** | Multi-cloud, complex | Feature-rich, dynamic secrets | Complex setup |
| **AWS Secrets Manager** | AWS-only | Managed, auto-rotation | AWS-locked |
| **Azure Key Vault** | Azure-only | Managed, HSM support | Azure-locked |
| **GCP Secret Manager** | GCP-only | Simple, managed | Limited features |
| **Sealed Secrets** | Kubernetes GitOps | Git-friendly | K8s-only |
| **External Secrets** | Multi-cloud K8s | Flexible sources | Extra component |

## Common Patterns

### Application Retrieval

```python
# Direct Vault access
import hvac
client = hvac.Client(url='http://localhost:8200', token='mytoken')
secret = client.secrets.kv.v2.read_secret_version(path='myapp/config')
password = secret['data']['data']['db_password']
```

```javascript
// AWS Secrets Manager
const AWS = require('aws-sdk');
const sm = new AWS.SecretsManager();
const data = await sm.getSecretValue({SecretId: 'myapp/database'}).promise();
const secrets = JSON.parse(data.SecretString);
```

### Environment Injection

```yaml
# Kubernetes with Vault Agent Injector
apiVersion: v1
kind: Pod
metadata:
  annotations:
    vault.hashicorp.com/agent-inject: "true"
    vault.hashicorp.com/agent-inject-secret-config: "secret/data/myapp/config"
    vault.hashicorp.com/role: "myapp"
spec:
  serviceAccountName: myapp
  containers:
  - name: app
    image: myapp:latest
```

## Key Takeaways

1. **Never hardcode secrets** - Use secrets managers
2. **Rotate regularly** - Limit blast radius
3. **Use dynamic secrets** - Better than static
4. **Audit everything** - Know who accessed what
5. **Encrypt at rest** - Even in secrets managers
6. **Least privilege** - Minimum necessary access
7. **Short TTLs** - Reduce exposure window
8. **Automate** - Manual rotation fails

## Next Section

After mastering Secrets Management, proceed to:
- **5.4.3 Encryption**: Data protection at rest and in transit

---

**Total Time**: 25-30 hours
**Difficulty**: Beginner to Advanced
**Cost**: Varies (Vault is free, cloud providers charge)
