# Pulumi Secrets Management

## Overview
Secure sensitive data with Pulumi's built-in secrets management.

## Using Secrets

```bash
# Set secret
pulumi config set --secret dbPassword superSecret123

# Use in code
config = pulumi.Config()
db_password = config.require_secret('dbPassword')

# Access secret
pulumi config get dbPassword --show-secrets
```

## Integration with Secret Managers

```python
import pulumi
import pulumi_aws as aws

# AWS Secrets Manager
secret = aws.secretsmanager.Secret('app-secret')
secret_version = aws.secretsmanager.SecretVersion('app-secret-version',
    secret_id=secret.id,
    secret_string=pulumi.Config().require_secret('api_key'))
```

## Best Practices
1. Never commit secrets to version control
2. Use --secret flag for sensitive config
3. Rotate secrets regularly
4. Use cloud provider secret managers

## Next Steps
- Tutorial 06: Testing
