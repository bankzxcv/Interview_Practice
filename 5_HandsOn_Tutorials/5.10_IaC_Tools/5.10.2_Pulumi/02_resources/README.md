# Pulumi Resources

## Overview
Learn to create and manage cloud resources across AWS, Azure, and Kubernetes using Pulumi.

## Prerequisites
- Completed Tutorial 01 (Basics)
- Cloud provider credentials configured
- Pulumi CLI installed

## Creating Resources

### AWS Resources

```python
# __main__.py - AWS Infrastructure
import pulumi
import pulumi_aws as aws

# VPC and Networking
vpc = aws.ec2.Vpc('my-vpc',
    cidr_block='10.0.0.0/16',
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={'Name': 'my-vpc'})

# Subnets
public_subnet = aws.ec2.Subnet('public-subnet',
    vpc_id=vpc.id,
    cidr_block='10.0.1.0/24',
    availability_zone='us-east-1a',
    map_public_ip_on_launch=True,
    tags={'Name': 'public-subnet'})

private_subnet = aws.ec2.Subnet('private-subnet',
    vpc_id=vpc.id,
    cidr_block='10.0.2.0/24',
    availability_zone='us-east-1a',
    tags={'Name': 'private-subnet'})

# Internet Gateway
igw = aws.ec2.InternetGateway('internet-gateway',
    vpc_id=vpc.id,
    tags={'Name': 'igw'})

# Route Table
public_route_table = aws.ec2.RouteTable('public-rt',
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block='0.0.0.0/0',
            gateway_id=igw.id,
        )
    ],
    tags={'Name': 'public-rt'})

# Route Table Association
rta = aws.ec2.RouteTableAssociation('public-rta',
    subnet_id=public_subnet.id,
    route_table_id=public_route_table.id)

# Security Group
security_group = aws.ec2.SecurityGroup('web-sg',
    vpc_id=vpc.id,
    description='Allow HTTP and SSH',
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol='tcp',
            from_port=80,
            to_port=80,
            cidr_blocks=['0.0.0.0/0'],
        ),
        aws.ec2.SecurityGroupIngressArgs(
            protocol='tcp',
            from_port=22,
            to_port=22,
            cidr_blocks=['0.0.0.0/0'],
        ),
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol='-1',
            from_port=0,
            to_port=0,
            cidr_blocks=['0.0.0.0/0'],
        ),
    ])

# EC2 Instance
instance = aws.ec2.Instance('web-server',
    instance_type='t3.micro',
    ami='ami-0c55b159cbfafe1f0',  # Amazon Linux 2
    subnet_id=public_subnet.id,
    vpc_security_group_ids=[security_group.id],
    user_data="""#!/bin/bash
echo "Hello, World!" > index.html
nohup python -m SimpleHTTPServer 80 &
""",
    tags={'Name': 'web-server'})

# RDS Database
db_subnet_group = aws.rds.SubnetGroup('db-subnet-group',
    subnet_ids=[private_subnet.id])

database = aws.rds.Instance('my-database',
    engine='postgres',
    engine_version='13.7',
    instance_class='db.t3.micro',
    allocated_storage=20,
    db_name='mydb',
    username='admin',
    password=pulumi.Config().require_secret('db_password'),
    db_subnet_group_name=db_subnet_group.name,
    skip_final_snapshot=True)

pulumi.export('instance_ip', instance.public_ip)
pulumi.export('db_endpoint', database.endpoint)
```

### Azure Resources

```python
# __main__.py - Azure Infrastructure
import pulumi
from pulumi_azure_native import resources, network, compute, storage

# Resource Group
resource_group = resources.ResourceGroup('my-rg',
    location='EastUS')

# Virtual Network
vnet = network.VirtualNetwork('my-vnet',
    resource_group_name=resource_group.name,
    address_space=network.AddressSpaceArgs(
        address_prefixes=['10.0.0.0/16']
    ),
    location=resource_group.location)

# Subnet
subnet = network.Subnet('my-subnet',
    resource_group_name=resource_group.name,
    virtual_network_name=vnet.name,
    address_prefix='10.0.1.0/24')

# Public IP
public_ip = network.PublicIPAddress('my-ip',
    resource_group_name=resource_group.name,
    location=resource_group.location,
    public_ip_allocation_method=network.IPAllocationMethod.STATIC)

# Network Interface
nic = network.NetworkInterface('my-nic',
    resource_group_name=resource_group.name,
    location=resource_group.location,
    ip_configurations=[network.NetworkInterfaceIPConfigurationArgs(
        name='ipconfig',
        subnet=network.SubnetArgs(id=subnet.id),
        public_ip_address=network.PublicIPAddressArgs(id=public_ip.id),
    )])

# Virtual Machine
vm = compute.VirtualMachine('my-vm',
    resource_group_name=resource_group.name,
    location=resource_group.location,
    network_profile=compute.NetworkProfileArgs(
        network_interfaces=[compute.NetworkInterfaceReferenceArgs(
            id=nic.id,
            primary=True,
        )],
    ),
    hardware_profile=compute.HardwareProfileArgs(
        vm_size=compute.VirtualMachineSizeTypes.STANDARD_B1_S,
    ),
    os_profile=compute.OSProfileArgs(
        computer_name='myvm',
        admin_username='azureuser',
        admin_password='Password1234!',
    ),
    storage_profile=compute.StorageProfileArgs(
        os_disk=compute.OSDiskArgs(
            create_option=compute.DiskCreateOptionTypes.FROM_IMAGE,
        ),
        image_reference=compute.ImageReferenceArgs(
            publisher='Canonical',
            offer='UbuntuServer',
            sku='18.04-LTS',
            version='latest',
        ),
    ))

# Storage Account
storage_account = storage.StorageAccount('mystorage',
    resource_group_name=resource_group.name,
    location=resource_group.location,
    sku=storage.SkuArgs(
        name=storage.SkuName.STANDARD_LRS,
    ),
    kind=storage.Kind.STORAGE_V2)

pulumi.export('vm_ip', public_ip.ip_address)
pulumi.export('storage_account', storage_account.name)
```

### Kubernetes Resources

```python
# __main__.py - Kubernetes Infrastructure
import pulumi
import pulumi_kubernetes as k8s

# Namespace
namespace = k8s.core.v1.Namespace('app-namespace',
    metadata=k8s.meta.v1.ObjectMetaArgs(
        name='my-app',
    ))

# ConfigMap
configmap = k8s.core.v1.ConfigMap('app-config',
    metadata=k8s.meta.v1.ObjectMetaArgs(
        namespace=namespace.metadata['name'],
    ),
    data={
        'config.json': pulumi.Output.json_dumps({
            'app_name': 'my-app',
            'environment': 'production',
        })
    })

# Secret
secret = k8s.core.v1.Secret('app-secret',
    metadata=k8s.meta.v1.ObjectMetaArgs(
        namespace=namespace.metadata['name'],
    ),
    string_data={
        'db_password': pulumi.Config().require_secret('db_password'),
        'api_key': pulumi.Config().require_secret('api_key'),
    })

# Deployment
deployment = k8s.apps.v1.Deployment('app-deployment',
    metadata=k8s.meta.v1.ObjectMetaArgs(
        namespace=namespace.metadata['name'],
    ),
    spec=k8s.apps.v1.DeploymentSpecArgs(
        replicas=3,
        selector=k8s.meta.v1.LabelSelectorArgs(
            match_labels={'app': 'my-app'},
        ),
        template=k8s.core.v1.PodTemplateSpecArgs(
            metadata=k8s.meta.v1.ObjectMetaArgs(
                labels={'app': 'my-app'},
            ),
            spec=k8s.core.v1.PodSpecArgs(
                containers=[k8s.core.v1.ContainerArgs(
                    name='app',
                    image='nginx:latest',
                    ports=[k8s.core.v1.ContainerPortArgs(
                        container_port=80,
                    )],
                    env_from=[
                        k8s.core.v1.EnvFromSourceArgs(
                            config_map_ref=k8s.core.v1.ConfigMapEnvSourceArgs(
                                name=configmap.metadata['name'],
                            ),
                        ),
                    ],
                    env=[
                        k8s.core.v1.EnvVarArgs(
                            name='DB_PASSWORD',
                            value_from=k8s.core.v1.EnvVarSourceArgs(
                                secret_key_ref=k8s.core.v1.SecretKeySelectorArgs(
                                    name=secret.metadata['name'],
                                    key='db_password',
                                ),
                            ),
                        ),
                    ],
                )],
            ),
        ),
    ))

# Service
service = k8s.core.v1.Service('app-service',
    metadata=k8s.meta.v1.ObjectMetaArgs(
        namespace=namespace.metadata['name'],
    ),
    spec=k8s.core.v1.ServiceSpecArgs(
        selector={'app': 'my-app'},
        ports=[k8s.core.v1.ServicePortArgs(
            port=80,
            target_port=80,
        )],
        type='LoadBalancer',
    ))

# Ingress
ingress = k8s.networking.v1.Ingress('app-ingress',
    metadata=k8s.meta.v1.ObjectMetaArgs(
        namespace=namespace.metadata['name'],
        annotations={
            'kubernetes.io/ingress.class': 'nginx',
        },
    ),
    spec=k8s.networking.v1.IngressSpecArgs(
        rules=[k8s.networking.v1.IngressRuleArgs(
            host='myapp.example.com',
            http=k8s.networking.v1.HTTPIngressRuleValueArgs(
                paths=[k8s.networking.v1.HTTPIngressPathArgs(
                    path='/',
                    path_type='Prefix',
                    backend=k8s.networking.v1.IngressBackendArgs(
                        service=k8s.networking.v1.IngressServiceBackendArgs(
                            name=service.metadata['name'],
                            port=k8s.networking.v1.ServiceBackendPortArgs(
                                number=80,
                            ),
                        ),
                    ),
                )],
            ),
        )],
    ))

pulumi.export('service_ip', service.status.apply(
    lambda status: status.load_balancer.ingress[0].ip if status else None))
```

## Multi-Cloud Example

```python
# __main__.py - Multi-cloud deployment
import pulumi
import pulumi_aws as aws
import pulumi_azure_native as azure
import pulumi_gcp as gcp

config = pulumi.Config()
cloud_provider = config.get('cloud_provider') or 'aws'

if cloud_provider == 'aws':
    # AWS S3 bucket
    bucket = aws.s3.Bucket('my-bucket',
        acl='private',
        tags={'Cloud': 'AWS'})
    pulumi.export('bucket_name', bucket.id)

elif cloud_provider == 'azure':
    # Azure Storage Account
    rg = azure.resources.ResourceGroup('my-rg')
    storage = azure.storage.StorageAccount('mystorage',
        resource_group_name=rg.name,
        sku=azure.storage.SkuArgs(
            name=azure.storage.SkuName.STANDARD_LRS))
    pulumi.export('storage_name', storage.name)

elif cloud_provider == 'gcp':
    # GCP Storage Bucket
    bucket = gcp.storage.Bucket('my-bucket',
        location='US',
        labels={'cloud': 'gcp'})
    pulumi.export('bucket_name', bucket.name)
```

## Verification

```bash
# Deploy resources
pulumi up

# Check outputs
pulumi stack output

# View resource details
pulumi stack --show-urns

# Verify in cloud console
aws ec2 describe-instances
az vm list
kubectl get all -n my-app
```

## Exercise Tasks

1. Create a complete AWS VPC with public/private subnets
2. Deploy an Azure VM with networking
3. Create a Kubernetes deployment with service and ingress
4. Build a multi-cloud storage solution

## Next Steps

- Tutorial 03: Component Resources
- Tutorial 04: Stacks and Configs
