# Production Infrastructure with Pulumi

## Overview
Build production-ready infrastructure following best practices and enterprise patterns.

## Production Architecture

```python
import pulumi
import pulumi_aws as aws
from components.vpc import VpcComponent
from components.eks import EksComponent

config = pulumi.Config()
environment = config.get('environment') or 'prod'

# Multi-AZ VPC
vpc = VpcComponent('production-vpc',
    cidr='10.0.0.0/16',
    availability_zones=['us-east-1a', 'us-east-1b', 'us-east-1c'])

# EKS Cluster
eks = EksComponent('production-eks',
    vpc_id=vpc.vpc.id,
    subnet_ids=vpc.private_subnet_ids,
    node_instance_type='t3.large',
    desired_capacity=3,
    min_capacity=2,
    max_capacity=10)

# RDS Multi-AZ
db = aws.rds.Instance('production-db',
    engine='postgres',
    instance_class='db.r5.xlarge',
    multi_az=True,
    backup_retention_period=30,
    storage_encrypted=True)

# CloudFront Distribution
cdn = aws.cloudfront.Distribution('production-cdn',
    enabled=True,
    origins=[...],
    default_cache_behavior=[...])

pulumi.export('cluster_endpoint', eks.cluster.endpoint)
pulumi.export('db_endpoint', db.endpoint)
```

## Production Checklist
- [x] High availability (multi-AZ)
- [x] Disaster recovery (backups)
- [x] Security (encryption, IAM)
- [x] Monitoring (CloudWatch, metrics)
- [x] Auto-scaling
- [x] Cost optimization
- [x] Documentation

## Best Practices
1. Use components for reusability
2. Implement proper tagging
3. Enable monitoring and logging
4. Automate deployments
5. Regular backup and testing
6. Security scanning
7. Cost monitoring

## Deployment

```bash
# Preview changes
pulumi preview --stack prod

# Deploy with approval
pulumi up --stack prod

# Monitor deployment
pulumi stack history --stack prod
```
