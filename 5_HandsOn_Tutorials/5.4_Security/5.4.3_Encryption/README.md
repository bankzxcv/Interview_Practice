# 5.4.3 Encryption - Data Protection at Rest and in Transit

## Overview

Master encryption techniques to protect sensitive data whether it's stored (at rest) or transmitted (in transit). Learn symmetric and asymmetric encryption, key management, and implement encryption across your infrastructure.

## Tutorials

### [01 - Symmetric vs Asymmetric Encryption](./01_symmetric_vs_asymmetric/)
- Encryption fundamentals
- AES, ChaCha20 (symmetric)
- RSA, ECC (asymmetric)
- When to use each
- Performance considerations

**Time**: 2 hours | **Difficulty**: Beginner

### [02 - File Encryption (GPG, age)](./02_file_encryption/)
- GPG basics and key management
- Age - modern file encryption
- Encrypting/decrypting files
- Sharing encrypted data
- Best practices

**Time**: 2-3 hours | **Difficulty**: Beginner

### [03 - Database Encryption at Rest](./03_database_encryption/)
- PostgreSQL encryption
- MySQL/MariaDB TDE
- MongoDB encryption
- Application-level vs database-level
- Performance impact

**Time**: 3 hours | **Difficulty**: Intermediate

### [04 - Kubernetes etcd Encryption](./04_kubernetes_etcd_encryption/)
- Encrypting Kubernetes secrets
- KMS provider integration
- Key rotation
- Verification and testing

**Time**: 2-3 hours | **Difficulty**: Intermediate

### [05 - Application-Level Encryption](./05_app_level_encryption/)
- Field-level encryption
- Transparent encryption
- Client-side encryption
- Search on encrypted data
- Libraries and SDKs

**Time**: 3-4 hours | **Difficulty**: Intermediate

### [06 - Cloud KMS (AWS, Azure, GCP)](./06_cloud_kms/)
- AWS KMS
- Azure Key Vault (keys)
- GCP Cloud KMS
- Cross-cloud considerations
- Cost optimization

**Time**: 3-4 hours | **Difficulty**: Intermediate

### [07 - Envelope Encryption](./07_envelope_encryption/)
- Concept and benefits
- Data Encryption Keys (DEK)
- Key Encryption Keys (KEK)
- Implementation patterns
- Performance optimization

**Time**: 2 hours | **Difficulty**: Intermediate

### [08 - Key Rotation](./08_key_rotation/)
- Why rotate keys?
- Zero-downtime rotation
- Automated rotation
- Backward compatibility
- Emergency key rotation

**Time**: 3 hours | **Difficulty**: Advanced

### [09 - Hardware Security Modules (HSM)](./09_hsm/)
- HSM fundamentals
- Cloud HSM (AWS, Azure)
- PKCS#11 interface
- Key generation in HSM
- Compliance requirements (FIPS 140-2)

**Time**: 3 hours | **Difficulty**: Advanced

### [10 - Homomorphic Encryption Basics](./10_homomorphic_encryption/)
- Computing on encrypted data
- Use cases and limitations
- Microsoft SEAL
- Practical examples
- Future of encrypted computation

**Time**: 3-4 hours | **Difficulty**: Advanced

## Quick Reference

### Symmetric Encryption (AES)

```bash
# OpenSSL AES-256-CBC
openssl enc -aes-256-cbc -salt \
  -in plaintext.txt \
  -out encrypted.bin \
  -pass pass:mypassword

# Decrypt
openssl enc -aes-256-cbc -d \
  -in encrypted.bin \
  -out decrypted.txt \
  -pass pass:mypassword
```

### Asymmetric Encryption (RSA)

```bash
# Generate keypair
openssl genrsa -out private.pem 4096
openssl rsa -in private.pem -pubout -out public.pem

# Encrypt with public key
openssl rsautl -encrypt \
  -pubin -inkey public.pem \
  -in message.txt \
  -out encrypted.bin

# Decrypt with private key
openssl rsautl -decrypt \
  -inkey private.pem \
  -in encrypted.bin \
  -out decrypted.txt
```

### Modern Encryption (age)

```bash
# Install age
brew install age

# Generate keypair
age-keygen -o key.txt
# public key: age1abc123...

# Encrypt
age -r age1abc123... -o file.age file.txt

# Decrypt
age -d -i key.txt -o file.txt file.age

# Encrypt with password
age -p -o file.age file.txt
```

## Encryption Hierarchy

```
Master Key (HSM/KMS)
    ↓
Key Encryption Key (KEK)
    ↓
Data Encryption Key (DEK)
    ↓
Encrypted Data
```

## Best Practices

### Key Management
- **Never hardcode keys**
- **Use KMS/HSM** for key storage
- **Rotate keys regularly**
- **Separate DEK from KEK**
- **Audit key usage**

### Algorithm Selection
- **AES-256-GCM** for symmetric (at rest)
- **ChaCha20-Poly1305** for symmetric (mobile)
- **RSA-4096** or **ECC P-384** for asymmetric
- **Avoid**: DES, 3DES, MD5, SHA1, RC4

### Implementation
- **Use established libraries** (don't roll your own crypto)
- **Encrypt in layers** (defense in depth)
- **Encrypt backups**
- **Test disaster recovery**
- **Monitor performance impact**

## Common Patterns

### Envelope Encryption

```python
from cryptography.fernet import Fernet
import boto3

# 1. Generate DEK (Data Encryption Key)
dek = Fernet.generate_key()

# 2. Encrypt data with DEK
f = Fernet(dek)
encrypted_data = f.encrypt(b"sensitive data")

# 3. Encrypt DEK with KMS (KEK)
kms = boto3.client('kms')
response = kms.encrypt(
    KeyId='alias/my-key',
    Plaintext=dek
)
encrypted_dek = response['CiphertextBlob']

# 4. Store: encrypted_data + encrypted_dek

# To decrypt:
# 1. Decrypt DEK with KMS
dek_response = kms.decrypt(CiphertextBlob=encrypted_dek)
dek = dek_response['Plaintext']

# 2. Decrypt data with DEK
f = Fernet(dek)
data = f.decrypt(encrypted_data)
```

### Database Column Encryption

```sql
-- PostgreSQL pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt
INSERT INTO users (email, encrypted_ssn)
VALUES (
  'user@example.com',
  pgp_sym_encrypt('123-45-6789', 'encryption-key')
);

-- Decrypt
SELECT
  email,
  pgp_sym_decrypt(encrypted_ssn, 'encryption-key') AS ssn
FROM users;
```

## Encryption Checklist

### At Rest
- [ ] Database encryption enabled
- [ ] File system encryption (LUKS, BitLocker)
- [ ] Backup encryption
- [ ] Log encryption (if contains sensitive data)
- [ ] Kubernetes secrets encryption
- [ ] Cloud storage encryption (S3, Blob Storage)

### In Transit
- [ ] TLS 1.2+ everywhere
- [ ] mTLS for service-to-service
- [ ] VPN for remote access
- [ ] Encrypted messaging (Signal protocol)
- [ ] SSH for remote administration

### Key Management
- [ ] Keys stored in KMS/HSM
- [ ] Key rotation policy
- [ ] Key backup and recovery
- [ ] Access logging
- [ ] Separate keys per environment

## Performance Considerations

| Operation | Relative Speed | Use Case |
|-----------|----------------|----------|
| Symmetric (AES-GCM) | Fast (1x) | Bulk data |
| Symmetric (ChaCha20) | Fast (0.9x) | Mobile/ARM |
| Asymmetric (RSA-2048) | Slow (1000x) | Key exchange |
| Asymmetric (ECC P-256) | Medium (100x) | Key exchange |
| Hashing (SHA-256) | Fast (10x) | Integrity |

## Compliance Requirements

| Standard | Encryption Requirement |
|----------|----------------------|
| **PCI DSS** | Encrypt cardholder data at rest and in transit |
| **HIPAA** | Addressable requirement for PHI |
| **GDPR** | Pseudonymization and encryption recommended |
| **SOC 2** | Encryption for sensitive data |
| **FIPS 140-2** | Validated cryptographic modules |

## Tools

```bash
# OpenSSL - Swiss army knife
openssl version

# Age - Modern encryption
age --version

# GPG - Email/file encryption
gpg --version

# HashiCorp Vault - Transit engine
vault secrets enable transit

# AWS KMS CLI
aws kms list-keys

# Azure Key Vault
az keyvault key list --vault-name myvault

# GCP KMS
gcloud kms keys list --location global --keyring my-keyring
```

## Key Takeaways

1. **Encryption is not optional** for sensitive data
2. **Use AES-256-GCM** for most encryption needs
3. **Never implement custom crypto** - use libraries
4. **Key management is harder than encryption**
5. **Encrypt in layers** (defense in depth)
6. **Rotate keys regularly**
7. **Test decryption regularly**
8. **Performance impact is usually minimal**

## Next Section

After mastering Encryption, proceed to:
- **5.4.4 SSL/TLS**: Secure communication over networks

---

**Total Time**: 25-30 hours
**Difficulty**: Beginner to Advanced
**Cost**: Free (open source tools) to paid (HSM)
