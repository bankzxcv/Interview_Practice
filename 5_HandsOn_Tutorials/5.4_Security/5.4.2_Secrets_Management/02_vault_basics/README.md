# Tutorial 02: HashiCorp Vault Basics

## Objectives

By the end of this tutorial, you will:
- Understand Vault architecture and concepts
- Install and initialize Vault
- Use the Key/Value (KV) secrets engine
- Implement authentication methods
- Create and manage Vault policies
- Integrate Vault with applications
- Backup and restore Vault data
- Implement basic high availability

## Prerequisites

- Docker installed
- Basic command line knowledge
- Understanding of secrets management concepts
- Terminal/command line access

## What is HashiCorp Vault?

Vault is a tool for securely accessing secrets. A secret is anything that you want to tightly control access to, such as API keys, passwords, certificates, or encryption keys. Vault provides a unified interface to any secret while providing tight access control and recording a detailed audit log.

### Key Features

- **Secure Secret Storage**: Encrypted at rest
- **Dynamic Secrets**: Generated on-demand
- **Data Encryption**: Encrypt/decrypt data without storing it
- **Leasing and Renewal**: Secrets have TTLs
- **Revocation**: Immediate secret invalidation
- **Audit Logging**: Detailed logs of all access
- **Multiple Auth Methods**: Flexible authentication

### Architecture

```
Client → Vault API → Storage Backend (encrypted)
           ↓
    Auth Methods, Secret Engines, Audit Devices
           ↓
    Policies, Tokens, Leases
```

## Step-by-Step Instructions

### Step 1: Install and Start Vault

```bash
# Install Vault on macOS
brew install vault

# Install on Linux
wget https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
unzip vault_1.15.0_linux_amd64.zip
sudo mv vault /usr/local/bin/
rm vault_1.15.0_linux_amd64.zip

# Verify installation
vault version

# Start Vault in dev mode (NOT for production!)
vault server -dev

# Output shows:
# Root Token: hvs.xxxxxxxxxxxxx
# Unseal Key: xxxxxxxxxxxxx
# Note: Save these! (In dev mode, server is already initialized and unsealed)

# In a new terminal, set environment variables
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='hvs.xxxxxxxxxxxxx'  # Use token from output

# Verify connection
vault status
```

### Step 2: Using Docker (Alternative)

```bash
# Run Vault in dev mode with Docker
docker run -d \
  --name vault \
  --cap-add=IPC_LOCK \
  -e VAULT_DEV_ROOT_TOKEN_ID=myroot \
  -e VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200 \
  -p 8200:8200 \
  vault:latest

# Set environment
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='myroot'

# Verify
vault status

# View logs
docker logs vault
```

### Step 3: Key/Value Secrets Engine

```bash
# Enable KV v2 secrets engine (if not already enabled)
vault secrets enable -path=secret kv-v2

# Write a secret
vault kv put secret/myapp/config \
  username=admin \
  password=supersecret123 \
  api_key=sk_live_abc123xyz

# Read secret
vault kv get secret/myapp/config

# Get specific field
vault kv get -field=password secret/myapp/config

# Get JSON output
vault kv get -format=json secret/myapp/config

# List secrets
vault kv list secret/
vault kv list secret/myapp/

# Update secret (creates new version)
vault kv put secret/myapp/config \
  username=admin \
  password=newsecret456 \
  api_key=sk_live_abc123xyz \
  db_host=localhost

# Delete latest version
vault kv delete secret/myapp/config

# Undelete
vault kv undelete -versions=2 secret/myapp/config

# Destroy (permanent delete)
vault kv destroy -versions=1 secret/myapp/config

# View secret metadata
vault kv metadata get secret/myapp/config

# View specific version
vault kv get -version=1 secret/myapp/config
```

### Step 4: Authentication Methods

```bash
# List auth methods
vault auth list

# Enable userpass authentication
vault auth enable userpass

# Create a user
vault write auth/userpass/users/alice \
  password=alice123 \
  policies=default,developer

vault write auth/userpass/users/bob \
  password=bob456 \
  policies=admin

# Login as user
vault login -method=userpass username=alice password=alice123

# Login returns a token - save it
# Token: hvs.CAESIJ...

# Use the new token
export VAULT_TOKEN='hvs.CAESIJ...'

# Verify current token
vault token lookup

# Enable AppRole (for applications)
vault auth enable approle

# Create AppRole
vault write auth/approle/role/webapp \
  secret_id_ttl=1h \
  token_num_uses=10 \
  token_ttl=20m \
  token_max_ttl=30m \
  secret_id_num_uses=40

# Get role ID
vault read auth/approle/role/webapp/role-id
# role_id: 1234-5678-9012

# Generate secret ID
vault write -f auth/approle/role/webapp/secret-id
# secret_id: abcd-efgh-ijkl

# Login with AppRole
vault write auth/approle/login \
  role_id=1234-5678-9012 \
  secret_id=abcd-efgh-ijkl
```

### Step 5: Policies

```bash
# Create a policy file
cat > developer-policy.hcl << 'EOF'
# Allow full access to secret/data/myapp/*
path "secret/data/myapp/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Allow read-only to secret/data/shared/*
path "secret/data/shared/*" {
  capabilities = ["read", "list"]
}

# Deny access to secret/data/admin/*
path "secret/data/admin/*" {
  capabilities = ["deny"]
}

# Allow token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}
EOF

# Write policy to Vault
vault policy write developer developer-policy.hcl

# List policies
vault policy list

# Read policy
vault policy read developer

# Create admin policy
cat > admin-policy.hcl << 'EOF'
# Full access to everything
path "*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
EOF

vault policy write admin admin-policy.hcl

# Create readonly policy
cat > readonly-policy.hcl << 'EOF'
# Read-only access to all secrets
path "secret/data/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/*" {
  capabilities = ["read", "list"]
}
EOF

vault policy write readonly readonly-policy.hcl

# Attach policy to user
vault write auth/userpass/users/alice policies=developer,readonly
```

### Step 6: Application Integration

```javascript
// Node.js example
// npm install node-vault

const vault = require('node-vault')({
  endpoint: 'http://localhost:8200',
  token: process.env.VAULT_TOKEN
});

async function getSecrets() {
  try {
    // Read secret
    const result = await vault.read('secret/data/myapp/config');
    const secrets = result.data.data;

    console.log('Username:', secrets.username);
    console.log('Password:', secrets.password);

    // Use secrets to connect to database
    const dbConfig = {
      host: secrets.db_host,
      user: secrets.username,
      password: secrets.password
    };

    return dbConfig;
  } catch (err) {
    console.error('Error reading secret:', err);
    throw err;
  }
}

// Using AppRole authentication
async function loginWithAppRole() {
  const vaultClient = require('node-vault')({
    endpoint: 'http://localhost:8200'
  });

  // Login
  const result = await vaultClient.approleLogin({
    role_id: process.env.VAULT_ROLE_ID,
    secret_id: process.env.VAULT_SECRET_ID
  });

  // Create new client with token
  const authenticatedVault = require('node-vault')({
    endpoint: 'http://localhost:8200',
    token: result.auth.client_token
  });

  return authenticatedVault;
}

module.exports = { getSecrets, loginWithAppRole };
```

```python
# Python example
# pip install hvac

import hvac
import os

# Initialize client
client = hvac.Client(
    url='http://localhost:8200',
    token=os.environ.get('VAULT_TOKEN')
)

# Verify authentication
assert client.is_authenticated()

# Read secret
secret = client.secrets.kv.v2.read_secret_version(
    path='myapp/config',
    mount_point='secret'
)

data = secret['data']['data']
print(f"Username: {data['username']}")
print(f"Password: {data['password']}")

# Write secret
client.secrets.kv.v2.create_or_update_secret(
    path='myapp/database',
    secret={
        'host': 'localhost',
        'port': 5432,
        'database': 'myapp'
    },
    mount_point='secret'
)

# AppRole authentication
def login_with_approle(role_id, secret_id):
    client = hvac.Client(url='http://localhost:8200')

    response = client.auth.approle.login(
        role_id=role_id,
        secret_id=secret_id
    )

    client.token = response['auth']['client_token']
    return client

# Usage
vault_client = login_with_approle(
    os.environ['VAULT_ROLE_ID'],
    os.environ['VAULT_SECRET_ID']
)
```

### Step 7: Token Management

```bash
# Create a token with specific policy
vault token create -policy=developer -ttl=1h

# Create a periodic token (renewable indefinitely)
vault token create -policy=developer -period=24h

# Create orphan token (survives parent revocation)
vault token create -policy=developer -orphan

# Lookup current token
vault token lookup

# Lookup specific token
vault token lookup hvs.CAESIJ...

# Renew token
vault token renew

# Renew with specific increment
vault token renew -increment=2h

# Revoke token
vault token revoke hvs.CAESIJ...

# Revoke all tokens under a parent
vault token revoke -mode=path auth/approle

# List token accessors
vault list auth/token/accessors
```

### Step 8: Audit Logging

```bash
# Enable file audit device
vault audit enable file file_path=/var/log/vault/audit.log

# Enable syslog audit
vault audit enable syslog

# List audit devices
vault audit list

# View audit logs (JSONL format)
tail -f /var/log/vault/audit.log

# Disable audit device
vault audit disable file/

# Example audit log entry
cat /var/log/vault/audit.log | jq
# {
#   "time": "2024-11-20T10:30:00Z",
#   "type": "request",
#   "auth": {
#     "client_token": "hmac-sha256:...",
#     "policies": ["default", "developer"]
#   },
#   "request": {
#     "operation": "read",
#     "path": "secret/data/myapp/config"
#   }
# }
```

### Step 9: Production Setup

```bash
# Create Vault configuration
cat > vault-config.hcl << 'EOF'
storage "file" {
  path = "/opt/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 0
  tls_cert_file = "/opt/vault/tls/vault.crt"
  tls_key_file  = "/opt/vault/tls/vault.key"
}

api_addr = "https://vault.example.com:8200"
cluster_addr = "https://127.0.0.1:8201"
ui = true
log_level = "Info"
EOF

# Start Vault server
vault server -config=vault-config.hcl

# Initialize Vault (first time only)
vault operator init

# Output:
# Unseal Key 1: abc123...
# Unseal Key 2: def456...
# Unseal Key 3: ghi789...
# Unseal Key 4: jkl012...
# Unseal Key 5: mno345...
# Initial Root Token: hvs.xxxxx
#
# ⚠️ SAVE THESE SECURELY! You cannot retrieve them later.

# Unseal Vault (requires 3 of 5 keys)
vault operator unseal abc123...
vault operator unseal def456...
vault operator unseal ghi789...

# Check status
vault status
# Sealed: false

# Login with root token
vault login hvs.xxxxx

# Seal Vault (lock it)
vault operator seal
```

### Step 10: Backup and Restore

```bash
# Take a snapshot (Enterprise/Raft only)
vault operator raft snapshot save backup.snap

# Restore from snapshot
vault operator raft snapshot restore backup.snap

# For file backend (simple backup)
# Stop Vault
systemctl stop vault

# Backup data directory
tar -czf vault-backup-$(date +%Y%m%d).tar.gz /opt/vault/data/

# Restore
tar -xzf vault-backup-20241120.tar.gz -C /

# Start Vault
systemctl start vault

# Export secrets (for migration)
vault kv get -format=json secret/myapp/config > myapp-config.json

# Import secrets
cat myapp-config.json | vault kv put secret/myapp/config -
```

## Docker Compose for Production-Like Setup

```yaml
version: '3.8'

services:
  vault:
    image: vault:latest
    container_name: vault-server
    ports:
      - "8200:8200"
    environment:
      VAULT_ADDR: 'http://0.0.0.0:8200'
    cap_add:
      - IPC_LOCK
    volumes:
      - ./vault/config:/vault/config
      - ./vault/data:/vault/data
      - ./vault/logs:/vault/logs
    command: server
    networks:
      - vault-network

  vault-ui:
    image: djenriquez/vault-ui:latest
    container_name: vault-ui
    ports:
      - "8000:8000"
    environment:
      VAULT_URL_DEFAULT: http://vault:8200
      VAULT_AUTH_DEFAULT: TOKEN
    depends_on:
      - vault
    networks:
      - vault-network

networks:
  vault-network:
    driver: bridge

volumes:
  vault-data:
  vault-logs:
```

## Security Best Practices

1. **Never use dev mode in production**
2. **Always enable TLS**
3. **Secure unseal keys** (use auto-unseal if possible)
4. **Rotate root token** immediately after setup
5. **Enable audit logging**
6. **Use short-lived tokens**
7. **Implement least privilege policies**
8. **Regular backups**
9. **Monitor and alert** on Vault events
10. **Use namespaces** (Enterprise) for multi-tenancy

## Key Takeaways

1. **Vault centralizes secret management**
2. **Everything is encrypted at rest**
3. **Policies control access**
4. **Tokens have TTLs and can be revoked**
5. **Audit logs track all access**
6. **Multiple auth methods for flexibility**
7. **Production requires careful setup and unsealing**
8. **Regular backups are critical**

## Additional Resources

- [Vault Documentation](https://www.vaultproject.io/docs)
- [Vault Tutorials](https://learn.hashicorp.com/vault)
- [Vault API](https://www.vaultproject.io/api-docs)
- [Best Practices](https://www.vaultproject.io/docs/internals/security)

## Next Steps

- Tutorial 03: Vault Dynamic Secrets
- Tutorial 04: Vault Kubernetes Integration
- Implement Vault in your applications
- Set up high availability Vault cluster

---

**Difficulty**: Intermediate
**Estimated Time**: 3-4 hours
**Cost**: Free (open source)
**Practice**: Replace hardcoded secrets with Vault
