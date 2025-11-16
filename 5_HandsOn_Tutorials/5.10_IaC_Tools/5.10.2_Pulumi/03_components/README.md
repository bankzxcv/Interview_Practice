# Pulumi Component Resources

## Overview
Learn to create reusable component resources to encapsulate and abstract infrastructure patterns.

## Component Resource Pattern

```python
# components/vpc.py
import pulumi
import pulumi_aws as aws
from typing import Optional

class VpcComponent(pulumi.ComponentResource):
    def __init__(self, name: str, cidr_block: str = "10.0.0.0/16", opts: Optional[pulumi.ResourceOptions] = None):
        super().__init__('custom:network:VPC', name, {}, opts)
        
        # VPC
        self.vpc = aws.ec2.Vpc(f'{name}-vpc',
            cidr_block=cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={'Name': f'{name}-vpc'},
            opts=pulumi.ResourceOptions(parent=self))
        
        # Public Subnet
        self.public_subnet = aws.ec2.Subnet(f'{name}-public',
            vpc_id=self.vpc.id,
            cidr_block='10.0.1.0/24',
            map_public_ip_on_launch=True,
            opts=pulumi.ResourceOptions(parent=self))
        
        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(f'{name}-igw',
            vpc_id=self.vpc.id,
            opts=pulumi.ResourceOptions(parent=self))
        
        # Route Table
        self.route_table = aws.ec2.RouteTable(f'{name}-rt',
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(
                cidr_block='0.0.0.0/0',
                gateway_id=self.igw.id)],
            opts=pulumi.ResourceOptions(parent=self))
        
        # Route Table Association
        self.rta = aws.ec2.RouteTableAssociation(f'{name}-rta',
            subnet_id=self.public_subnet.id,
            route_table_id=self.route_table.id,
            opts=pulumi.ResourceOptions(parent=self))
        
        self.register_outputs({
            'vpc_id': self.vpc.id,
            'public_subnet_id': self.public_subnet.id
        })

# __main__.py
from components.vpc import VpcComponent

# Use component
vpc = VpcComponent('my-network', cidr_block='10.0.0.0/16')
pulumi.export('vpc_id', vpc.vpc.id)
```

## Exercise
Create component resources for common patterns (web server, database, Kubernetes cluster).

## Next Steps
- Tutorial 04: Stacks and Configs
