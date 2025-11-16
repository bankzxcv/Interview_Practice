# NATS Tutorial 05: Security

## Overview
Implement authentication, authorization, and TLS encryption.

## Security Features
- **Authentication**: User/password, tokens, JWT
- **Authorization**: Subject-level permissions
- **TLS**: Encrypted connections
- **Accounts**: Multi-tenancy

## Quick Start
```bash
# Generate config with auth
docker-compose up -d

# Connect with credentials
python secure_client.py
```

## Auth Methods

**1. User/Password**
```
authorization {
  users = [
    {user: admin, password: secret}
  ]
}
```

**2. Token**
```
authorization {
  token: "mytoken123"
}
```

**3. JWT (Recommended)**
- Decentralized auth
- Fine-grained permissions

Next: Tutorial 06 - Monitoring
