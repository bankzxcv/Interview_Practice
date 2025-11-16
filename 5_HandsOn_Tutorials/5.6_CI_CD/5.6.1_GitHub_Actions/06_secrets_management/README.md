# Tutorial 06: Secrets Management in GitHub Actions

## Objectives

By the end of this tutorial, you will:
- Securely manage secrets in GitHub Actions
- Use GitHub Secrets for sensitive data
- Implement environment-specific secrets
- Work with encrypted secrets
- Use OIDC for cloud provider authentication
- Manage API keys, tokens, and credentials
- Implement secret rotation strategies
- Use HashiCorp Vault integration

## Prerequisites

- Completion of Tutorials 01-05
- Understanding of security best practices
- Basic knowledge of encryption concepts

## Key Concepts

### GitHub Secrets
Encrypted environment variables stored in GitHub repository or organization settings.

### Environment Secrets
Secrets scoped to specific deployment environments (dev, staging, prod).

### OIDC (OpenID Connect)
Modern authentication method that eliminates the need for long-lived credentials.

### Secret Rotation
Regular updating of credentials to minimize security risks.

## Step-by-Step Instructions

### Step 1: Basic Secrets Usage

**File: `.github/workflows/secrets-demo.yml`**

```yaml
name: Secrets Demo

on:
  workflow_dispatch:

jobs:
  use-secrets:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Use secret in environment variable
      env:
        API_KEY: ${{ secrets.API_KEY }}
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
      run: |
        echo "API key is set: ${API_KEY:+yes}"
        echo "Database URL is set: ${DATABASE_URL:+yes}"
        # Never echo the actual secret values!

    - name: Use secret in command
      run: |
        # Example: authenticate to a service
        echo "Authenticating..."
        # curl -H "Authorization: Bearer ${{ secrets.API_TOKEN }}" api.example.com

    - name: Conditional secret usage
      if: github.event_name == 'push' && github.ref == 'refs/heads/main'
      env:
        PROD_SECRET: ${{ secrets.PRODUCTION_API_KEY }}
      run: |
        echo "Using production secrets"
```

### Step 2: Environment-Specific Secrets

**File: `.github/workflows/environment-secrets.yml`**

```yaml
name: Environment Secrets

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Deploy to environment
      env:
        API_URL: ${{ secrets.API_URL }}
        API_KEY: ${{ secrets.API_KEY }}
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
      run: |
        echo "Deploying to ${{ inputs.environment }}"
        echo "API URL is set: ${API_URL:+yes}"
        echo "API key is set: ${API_KEY:+yes}"

        # Deployment logic here
        # The secrets will automatically use environment-specific values

    - name: Verify deployment
      run: |
        echo "Deployment to ${{ inputs.environment }} complete"
```

### Step 3: OIDC with AWS

**File: `.github/workflows/aws-oidc.yml`**

```yaml
name: AWS OIDC Authentication

on:
  push:
    branches: [ main ]

permissions:
  id-token: write  # Required for OIDC
  contents: read

jobs:
  deploy-to-aws:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure AWS credentials with OIDC
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
        aws-region: us-east-1

    - name: Verify AWS authentication
      run: |
        aws sts get-caller-identity
        aws s3 ls

    - name: Deploy to S3
      run: |
        aws s3 sync ./build s3://${{ secrets.S3_BUCKET_NAME }}
```

### Step 4: HashiCorp Vault Integration

**File: `.github/workflows/vault-integration.yml`**

```yaml
name: Vault Secrets

on:
  workflow_dispatch:

jobs:
  use-vault-secrets:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Import secrets from Vault
      uses: hashicorp/vault-action@v2
      with:
        url: ${{ secrets.VAULT_URL }}
        token: ${{ secrets.VAULT_TOKEN }}
        secrets: |
          secret/data/myapp database_url | DATABASE_URL ;
          secret/data/myapp api_key | API_KEY ;
          secret/data/myapp api_secret | API_SECRET

    - name: Use Vault secrets
      run: |
        echo "Database URL is set: ${DATABASE_URL:+yes}"
        echo "API key is set: ${API_KEY:+yes}"
        # Use secrets in your application
```

### Step 5: Secure Secret Handling

**File: `app/config.py`**

```python
"""
Secure configuration management.
"""

import os
from typing import Optional


class Config:
    """Application configuration from environment variables."""

    def __init__(self):
        self.api_key = self._get_secret("API_KEY")
        self.database_url = self._get_secret("DATABASE_URL")
        self.secret_key = self._get_secret("SECRET_KEY")

    @staticmethod
    def _get_secret(key: str, default: Optional[str] = None) -> str:
        """
        Get secret from environment variable.

        Args:
            key: Environment variable name
            default: Default value if not found

        Returns:
            Secret value

        Raises:
            ValueError: If required secret is missing
        """
        value = os.environ.get(key, default)
        if value is None:
            raise ValueError(f"Required secret {key} not found")
        return value

    def __repr__(self):
        """Safe representation that doesn't expose secrets."""
        return f"Config(api_key=*****, database_url=*****, secret_key=*****)"


# Example usage
def main():
    try:
        config = Config()
        print("Configuration loaded successfully")
        print(config)  # Safe to print
    except ValueError as e:
        print(f"Configuration error: {e}")
        raise


if __name__ == "__main__":
    main()
```

**File: `.github/workflows/secrets-validation.yml`**

```yaml
name: Secrets Validation

on:
  workflow_dispatch:

jobs:
  validate-secrets:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'

    - name: Validate secrets are set
      env:
        API_KEY: ${{ secrets.API_KEY }}
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        SECRET_KEY: ${{ secrets.SECRET_KEY }}
      run: |
        python app/config.py

    - name: Check for leaked secrets
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: ${{ github.event.repository.default_branch }}
        head: HEAD
```

## Setting Up Secrets

### Repository Secrets

1. **Navigate to repository settings:**
   - Go to Settings > Secrets and variables > Actions
   - Click "New repository secret"

2. **Add secrets:**
   ```
   Name: API_KEY
   Value: your-secret-api-key
   ```

3. **Access in workflows:**
   ```yaml
   env:
     API_KEY: ${{ secrets.API_KEY }}
   ```

### Environment Secrets

1. **Create environment:**
   - Go to Settings > Environments
   - Click "New environment"
   - Name it (e.g., "production")

2. **Add environment secrets:**
   - Click on environment name
   - Add secrets specific to that environment

3. **Use in workflows:**
   ```yaml
   jobs:
     deploy:
       environment: production
   ```

### Organization Secrets

1. **For organization admins:**
   - Go to Organization settings
   - Secrets and variables > Actions
   - Can be shared across multiple repositories

## Best Practices

### 1. Never Hardcode Secrets
```yaml
# BAD - Don't do this
env:
  API_KEY: "hardcoded-key-123"

# GOOD - Use secrets
env:
  API_KEY: ${{ secrets.API_KEY }}
```

### 2. Minimal Secret Exposure
```yaml
# Only expose secrets to steps that need them
- name: Step that doesn't need secrets
  run: echo "No secrets here"

- name: Step that needs secrets
  env:
    API_KEY: ${{ secrets.API_KEY }}
  run: ./script-using-api.sh
```

### 3. Use Environment Protection
```yaml
jobs:
  deploy:
    environment:
      name: production
      url: https://prod.example.com
    # Environment can have required reviewers
```

### 4. Rotate Secrets Regularly
```yaml
# Set up automated secret rotation
- name: Rotate API key
  run: |
    # Call API to generate new key
    # Update secret in GitHub via API
```

### 5. Use OIDC When Possible
```yaml
# Prefer OIDC over long-lived credentials
permissions:
  id-token: write
```

### 6. Mask Secrets in Logs
```yaml
- name: Ensure secrets are masked
  run: |
    # GitHub automatically masks secrets in logs
    echo ${{ secrets.API_KEY }}  # Will appear as ***
```

## Security Checklist

- [ ] All secrets use GitHub Secrets (not hardcoded)
- [ ] Production secrets in environment (not repository)
- [ ] OIDC used for cloud providers where possible
- [ ] Secret scanning enabled
- [ ] No secrets in code or configuration files
- [ ] Secrets rotated regularly
- [ ] Least privilege access (only necessary jobs have access)
- [ ] Required reviewers for production deployments

## Troubleshooting

### Issue: Secret not found

**Solutions:**
```yaml
# Check if secret exists in correct scope
- name: Debug secret existence
  run: |
    if [ -z "${{ secrets.API_KEY }}" ]; then
      echo "API_KEY secret not found"
      exit 1
    fi
```

### Issue: Secret not updating

**Solutions:**
- Clear GitHub Actions cache
- Check secret name matches exactly (case-sensitive)
- Verify secret is in correct environment/repository

### Issue: Secret exposed in logs

**Solutions:**
- GitHub auto-masks registered secrets
- Use `::add-mask::` for dynamic secrets:
  ```yaml
  - name: Mask dynamic secret
    run: |
      SECRET_VALUE=$(generate-secret)
      echo "::add-mask::$SECRET_VALUE"
  ```

## Summary

You've learned:
- Managing secrets securely in GitHub Actions
- Using environment-specific secrets
- OIDC authentication with cloud providers
- Vault integration for secret management
- Best practices for secret handling
- Security validation and scanning

## Next Steps

Proceed to Tutorial 07: Artifacts & Caching to learn about managing build artifacts and optimizing workflow performance.
