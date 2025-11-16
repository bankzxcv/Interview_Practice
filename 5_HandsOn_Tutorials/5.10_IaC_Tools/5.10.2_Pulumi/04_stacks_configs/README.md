# Pulumi Stacks and Configuration

## Overview
Master multi-stack deployments and configuration management for different environments.

## Stack Management

```bash
# Create stacks
pulumi stack init dev
pulumi stack init staging  
pulumi stack init prod

# Configure each stack
pulumi stack select dev
pulumi config set aws:region us-east-1
pulumi config set app:size small

pulumi stack select prod
pulumi config set aws:region us-west-2
pulumi config set app:size large
```

## Configuration in Code

```python
import pulumi

config = pulumi.Config()
app_size = config.get('app:size') or 'medium'
region = config.get('aws:region')

# Use config
instance_type_map = {
    'small': 't3.micro',
    'medium': 't3.small',
    'large': 't3.medium'
}

instance_type = instance_type_map[app_size]
```

## Best Practices
1. One stack per environment
2. Use config for environment-specific values
3. Document configuration requirements
4. Version control stack configs

## Next Steps
- Tutorial 05: Secrets Management
