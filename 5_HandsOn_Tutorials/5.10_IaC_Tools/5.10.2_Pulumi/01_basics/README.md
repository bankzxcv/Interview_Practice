# Pulumi Basics

## Overview
Learn Pulumi fundamentals including installation, creating your first stack, and basic infrastructure as code with real programming languages.

## Prerequisites
- Basic programming knowledge (Python, TypeScript, or Go)
- Cloud provider account (AWS, Azure, or GCP)
- Node.js or Python installed

## Key Concepts

### What is Pulumi?
- Modern Infrastructure as Code (IaC) tool
- Use real programming languages (Python, TypeScript, Go, C#, Java)
- Cloud-native and cloud-agnostic
- State management and preview/update workflow

### Core Concepts
1. **Project**: Collection of IaC files
2. **Stack**: Isolated instance of infrastructure (dev, staging, prod)
3. **Resources**: Cloud infrastructure components
4. **Outputs**: Values exported from your stack
5. **State**: Current infrastructure state

## Hands-On Tutorial

### 1. Install Pulumi

```bash
# Install Pulumi CLI
curl -fsSL https://get.pulumi.com | sh

# Add to PATH
export PATH=$PATH:$HOME/.pulumi/bin

# Verify installation
pulumi version

# Login to Pulumi (use local backend for learning)
pulumi login --local
# Or use Pulumi Cloud
# pulumi login
```

### 2. Create Your First Project (Python)

```bash
mkdir pulumi-basics && cd pulumi-basics

# Create new project
pulumi new python --name my-first-project --description "My First Pulumi Project"

# This creates:
# - Pulumi.yaml: Project metadata
# - __main__.py: Infrastructure code
# - requirements.txt: Python dependencies
# - .gitignore
# - Pulumi.dev.yaml: Stack configuration

# Install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Examine Project Structure

```bash
# View project file
cat Pulumi.yaml

# View main infrastructure code
cat __main__.py

# Default __main__.py content (creates S3 bucket example)
cat > __main__.py << 'PYTHON'
"""A Python Pulumi program"""

import pulumi
from pulumi_aws import s3

# Create an AWS S3 bucket
bucket = s3.Bucket('my-bucket',
    tags={
        "Environment": "Dev",
        "Name": "My Bucket"
    })

# Export the name of the bucket
pulumi.export('bucket_name', bucket.id)
pulumi.export('bucket_arn', bucket.arn)
PYTHON
```

### 4. Configure AWS Credentials

```bash
# Configure AWS credentials (if using AWS)
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_REGION="us-east-1"

# Or use AWS CLI configuration
aws configure

# Set Pulumi AWS region
pulumi config set aws:region us-east-1
```

### 5. Preview and Deploy

```bash
# Preview changes (dry run)
pulumi preview

# Deploy infrastructure
pulumi up

# Review the changes and confirm
# Type 'yes' to deploy

# Check stack outputs
pulumi stack output

# View all resources
pulumi stack

# Get specific output
pulumi stack output bucket_name
```

### 6. Update Infrastructure

```bash
# Modify __main__.py to add versioning
cat > __main__.py << 'PYTHON'
"""Enhanced Pulumi program with more features"""

import pulumi
from pulumi_aws import s3

# Create S3 bucket with versioning and encryption
bucket = s3.Bucket('my-bucket',
    tags={
        "Environment": "Dev",
        "Name": "My Bucket",
        "ManagedBy": "Pulumi"
    },
    versioning=s3.BucketVersioningArgs(
        enabled=True,
    ),
    server_side_encryption_configuration=s3.BucketServerSideEncryptionConfigurationArgs(
        rule=s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            ),
        ),
    ),
)

# Create a bucket object
example_object = s3.BucketObject('index.html',
    bucket=bucket.id,
    content='<h1>Hello, Pulumi!</h1>',
    content_type='text/html',
    acl='private',
)

# Export outputs
pulumi.export('bucket_name', bucket.id)
pulumi.export('bucket_arn', bucket.arn)
pulumi.export('bucket_url', pulumi.Output.concat('https://', bucket.bucket, '.s3.amazonaws.com'))
pulumi.export('object_key', example_object.key)
PYTHON

# Preview changes
pulumi preview

# Apply changes
pulumi up
```

### 7. Multiple Stacks

```bash
# Create new stack for staging
pulumi stack init staging

# List all stacks
pulumi stack ls

# Switch between stacks
pulumi stack select dev
pulumi stack select staging

# Deploy to staging stack
pulumi up

# Compare stacks
pulumi stack --stack dev
pulumi stack --stack staging
```

### 8. Configuration Management

```bash
# Set configuration values
pulumi config set app:name "my-app"
pulumi config set app:environment "development"

# Set secrets (encrypted)
pulumi config set --secret db:password "super-secret-password"

# Get configuration
pulumi config get app:name
pulumi config get db:password --show-secrets

# View all config
pulumi config

# Use config in code
cat > __main__.py << 'PYTHON'
import pulumi
from pulumi_aws import s3

# Get configuration
config = pulumi.Config()
app_name = config.require('app:name')
environment = config.get('app:environment', 'development')

# Use config in resource names
bucket = s3.Bucket(f'{app_name}-{environment}-bucket',
    tags={
        "Environment": environment,
        "Name": f"{app_name} Bucket",
        "ManagedBy": "Pulumi"
    })

pulumi.export('bucket_name', bucket.id)
pulumi.export('environment', environment)
PYTHON

pulumi up
```

### 9. TypeScript Example

```bash
# Create TypeScript project
mkdir ../pulumi-typescript && cd ../pulumi-typescript
pulumi new typescript --name my-typescript-project

# Install dependencies
npm install

# View index.ts
cat > index.ts << 'TYPESCRIPT'
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Create an S3 bucket
const bucket = new aws.s3.Bucket("my-bucket", {
    tags: {
        Environment: "Dev",
        Name: "My Bucket",
        ManagedBy: "Pulumi"
    },
    versioning: {
        enabled: true,
    },
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        },
    },
});

// Create bucket object
const indexHtml = new aws.s3.BucketObject("index.html", {
    bucket: bucket.id,
    content: "<h1>Hello from TypeScript!</h1>",
    contentType: "text/html",
    acl: "private",
});

// Export outputs
export const bucketName = bucket.id;
export const bucketArn = bucket.arn;
export const bucketUrl = pulumi.interpolate`https://${bucket.bucket}.s3.amazonaws.com`;
TYPESCRIPT

# Deploy
pulumi up
```

### 10. Common Operations

```bash
# View stack outputs
pulumi stack output

# Refresh state
pulumi refresh

# View stack resources
pulumi stack --show-urns

# Export stack state
pulumi stack export > stack-state.json

# Import stack state
pulumi stack import < stack-state.json

# View update history
pulumi stack history

# Rollback to previous deployment
pulumi stack history
pulumi up --target <update-id>

# Cancel update
pulumi cancel

# Destroy all resources
pulumi destroy

# Remove stack
pulumi stack rm dev
```

## Project Structure Best Practices

```
my-pulumi-project/
├── Pulumi.yaml              # Project configuration
├── Pulumi.dev.yaml          # Dev stack config
├── Pulumi.staging.yaml      # Staging stack config
├── Pulumi.prod.yaml         # Prod stack config
├── __main__.py              # Main infrastructure code
├── requirements.txt         # Python dependencies
├── infra/                   # Infrastructure modules
│   ├── __init__.py
│   ├── network.py           # Network resources
│   ├── compute.py           # Compute resources
│   └── storage.py           # Storage resources
├── config/                  # Configuration files
│   ├── dev.py
│   ├── staging.py
│   └── prod.py
└── tests/                   # Tests
    └── test_infra.py
```

## Working with Outputs

```python
import pulumi
from pulumi_aws import s3

# Create resource
bucket = s3.Bucket('my-bucket')

# Simple export
pulumi.export('bucket_name', bucket.id)

# Computed export (Output)
pulumi.export('bucket_url', pulumi.Output.concat('https://', bucket.bucket, '.s3.amazonaws.com'))

# Export object
pulumi.export('bucket_info', {
    'name': bucket.id,
    'arn': bucket.arn,
    'region': bucket.region,
})

# Use outputs from another stack
other_stack = pulumi.StackReference('organization/project/stack')
other_bucket = other_stack.get_output('bucket_name')
```

## Verification Steps

```bash
# Verify installation
pulumi version

# Check stack status
pulumi stack

# Preview changes
pulumi preview

# View outputs
pulumi stack output

# List all stacks
pulumi stack ls

# View resources
pulumi stack --show-urns

# Verify in AWS Console
aws s3 ls | grep my-bucket
```

## Best Practices

1. **Version Control**: Always use git for your Pulumi code
2. **Stack Per Environment**: Separate dev, staging, prod stacks
3. **Configuration**: Use Pulumi config for environment-specific values
4. **Secrets**: Use `--secret` flag for sensitive data
5. **Outputs**: Export important values for reference
6. **Preview**: Always run `pulumi preview` before `up`
7. **State Backup**: Regularly backup stack state
8. **CI/CD**: Integrate with CI/CD pipelines

## Common Commands Reference

```bash
# Project management
pulumi new [template]        # Create new project
pulumi destroy              # Destroy all resources
pulumi preview              # Preview changes
pulumi up                   # Deploy changes
pulumi refresh              # Refresh state

# Stack management
pulumi stack init [name]    # Create new stack
pulumi stack select [name]  # Switch stack
pulumi stack ls             # List stacks
pulumi stack rm [name]      # Remove stack
pulumi stack output         # Show outputs

# Configuration
pulumi config set [key] [value]           # Set config
pulumi config set --secret [key] [value]  # Set secret
pulumi config get [key]                   # Get config
pulumi config rm [key]                    # Remove config

# State management
pulumi stack export         # Export state
pulumi stack import         # Import state
pulumi stack history        # View history
pulumi cancel              # Cancel update
```

## Exercise Tasks

1. Create a Pulumi project that:
   - Creates an S3 bucket with encryption
   - Adds tags for environment and cost center
   - Exports bucket name and URL

2. Create multiple stacks (dev, staging, prod)
3. Use configuration for stack-specific values
4. Add and remove resources, observe the update process

## Common Issues

### Issue: Pulumi login fails
```bash
# Solution: Use local backend
pulumi login --local
```

### Issue: AWS credentials not found
```bash
# Solution: Set environment variables
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
```

### Issue: State conflicts
```bash
# Solution: Refresh state
pulumi refresh
# Or cancel pending operations
pulumi cancel
```

## Next Steps

- Tutorial 02: Creating Resources (AWS, Azure, K8s)
- Tutorial 03: Component Resources
- Tutorial 04: Stacks and Configs
