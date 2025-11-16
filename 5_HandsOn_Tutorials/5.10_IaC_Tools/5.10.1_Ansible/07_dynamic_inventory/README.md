# Ansible Dynamic Inventory

## Overview
Learn to use dynamic inventory to automatically discover and manage infrastructure from cloud providers (AWS, Azure, GCP) and other sources.

## Prerequisites
- Completed Tutorials 01-06
- Cloud provider account (AWS, Azure, or GCP)
- Cloud provider credentials configured

## Key Concepts

### Dynamic Inventory
- Automatically discovers hosts from external sources
- Real-time infrastructure state
- No manual inventory maintenance
- Supports multiple cloud providers

### Inventory Sources
- AWS EC2
- Azure
- Google Cloud
- DigitalOcean
- VMware
- Custom scripts

## Hands-On Tutorial

### Setup
```bash
mkdir -p ansible-dynamic-inventory/{scripts,configs} && cd ansible-dynamic-inventory

# Install required collections
ansible-galaxy collection install amazon.aws
ansible-galaxy collection install azure.azcollection
ansible-galaxy collection install google.cloud
ansible-galaxy collection install community.general
```

### 1. Custom Dynamic Inventory Script

```bash
cat > scripts/simple_inventory.py << 'PYTHON'
#!/usr/bin/env python3
"""
Simple dynamic inventory script example
"""
import json
import argparse

def get_inventory():
    """Return inventory dictionary"""
    inventory = {
        '_meta': {
            'hostvars': {
                'host1': {
                    'ansible_host': '192.168.1.10',
                    'ansible_user': 'ubuntu',
                    'role': 'webserver'
                },
                'host2': {
                    'ansible_host': '192.168.1.11',
                    'ansible_user': 'ubuntu',
                    'role': 'database'
                },
                'host3': {
                    'ansible_host': '192.168.1.12',
                    'ansible_user': 'ubuntu',
                    'role': 'webserver'
                }
            }
        },
        'webservers': {
            'hosts': ['host1', 'host3'],
            'vars': {
                'http_port': 80,
                'app_name': 'webapp'
            }
        },
        'databases': {
            'hosts': ['host2'],
            'vars': {
                'db_port': 5432
            }
        },
        'production': {
            'children': ['webservers', 'databases'],
            'vars': {
                'environment': 'production',
                'region': 'us-east-1'
            }
        }
    }
    return inventory

def get_host(hostname):
    """Return empty dict for host variables (already in _meta)"""
    return {}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--list', action='store_true', help='List all hosts')
    parser.add_argument('--host', help='Get variables for specific host')
    args = parser.parse_args()

    if args.list:
        print(json.dumps(get_inventory(), indent=2))
    elif args.host:
        print(json.dumps(get_host(args.host), indent=2))
    else:
        parser.print_help()
PYTHON

chmod +x scripts/simple_inventory.py

# Test the script
./scripts/simple_inventory.py --list
ansible-inventory -i scripts/simple_inventory.py --list
ansible-inventory -i scripts/simple_inventory.py --graph
```

### 2. Advanced Dynamic Inventory Script

```bash
cat > scripts/cloud_inventory.py << 'PYTHON'
#!/usr/bin/env python3
"""
Advanced dynamic inventory with external data
Simulates reading from cloud provider API
"""
import json
import argparse
import os

# Simulated cloud instances
CLOUD_INSTANCES = [
    {
        'id': 'i-001',
        'name': 'web-server-1',
        'ip': '10.0.1.10',
        'private_ip': '172.31.1.10',
        'type': 't3.medium',
        'tags': {
            'Environment': 'production',
            'Role': 'webserver',
            'Application': 'frontend'
        },
        'state': 'running'
    },
    {
        'id': 'i-002',
        'name': 'web-server-2',
        'ip': '10.0.1.11',
        'private_ip': '172.31.1.11',
        'type': 't3.medium',
        'tags': {
            'Environment': 'production',
            'Role': 'webserver',
            'Application': 'frontend'
        },
        'state': 'running'
    },
    {
        'id': 'i-003',
        'name': 'db-server-1',
        'ip': '10.0.2.10',
        'private_ip': '172.31.2.10',
        'type': 't3.large',
        'tags': {
            'Environment': 'production',
            'Role': 'database',
            'Application': 'postgresql'
        },
        'state': 'running'
    },
    {
        'id': 'i-004',
        'name': 'cache-server-1',
        'ip': '10.0.3.10',
        'private_ip': '172.31.3.10',
        'type': 't3.small',
        'tags': {
            'Environment': 'production',
            'Role': 'cache',
            'Application': 'redis'
        },
        'state': 'running'
    }
]

def build_inventory():
    """Build inventory from cloud instances"""
    inventory = {
        '_meta': {
            'hostvars': {}
        }
    }

    # Track groups
    groups = {}

    for instance in CLOUD_INSTANCES:
        if instance['state'] != 'running':
            continue

        hostname = instance['name']

        # Add host variables
        inventory['_meta']['hostvars'][hostname] = {
            'ansible_host': instance['ip'],
            'private_ip': instance['private_ip'],
            'instance_id': instance['id'],
            'instance_type': instance['type'],
            'tags': instance['tags']
        }

        # Group by role
        role = instance['tags'].get('Role', 'ungrouped')
        if role not in groups:
            groups[role] = {'hosts': [], 'vars': {}}
        groups[role]['hosts'].append(hostname)

        # Group by environment
        env = instance['tags'].get('Environment', 'unknown')
        env_group = f"env_{env}"
        if env_group not in groups:
            groups[env_group] = {'hosts': [], 'vars': {'environment': env}}
        groups[env_group]['hosts'].append(hostname)

        # Group by application
        app = instance['tags'].get('Application', 'unknown')
        app_group = f"app_{app}"
        if app_group not in groups:
            groups[app_group] = {'hosts': [], 'vars': {'application': app}}
        groups[app_group]['hosts'].append(hostname)

    # Add groups to inventory
    inventory.update(groups)

    return inventory

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--list', action='store_true')
    parser.add_argument('--host')
    args = parser.parse_args()

    if args.list:
        print(json.dumps(build_inventory(), indent=2))
    elif args.host:
        # Host variables are in _meta, so return empty dict
        print(json.dumps({}, indent=2))
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
PYTHON

chmod +x scripts/cloud_inventory.py
./scripts/cloud_inventory.py --list
```

### 3. AWS EC2 Dynamic Inventory

```bash
# Create AWS inventory configuration
cat > configs/aws_ec2.yml << 'EOF'
---
plugin: amazon.aws.aws_ec2

# AWS credentials (can use environment variables or IAM roles)
# aws_access_key_id: YOUR_ACCESS_KEY
# aws_secret_access_key: YOUR_SECRET_KEY

regions:
  - us-east-1
  - us-west-2

filters:
  instance-state-name: running
  # tag:Environment: production

# Organize hosts into groups
keyed_groups:
  # Group by instance type
  - key: instance_type
    prefix: instance_type

  # Group by tags
  - key: tags.Environment
    prefix: env

  - key: tags.Role
    prefix: role

  - key: tags.Application
    prefix: app

# Host variables to include
hostnames:
  - ip-address  # Use public IP as hostname
  - dns-name    # Or use DNS name
  - tag:Name    # Or use Name tag

compose:
  ansible_host: public_ip_address
  ansible_user: "'ubuntu'"  # Default user for Ubuntu AMIs
  private_ip: private_ip_address
  availability_zone: placement.availability_zone
  instance_name: tags.Name

# Include/exclude hosts
# exclude_filters:
#   - tag:Managed: false
EOF

# Test AWS inventory (requires AWS credentials)
# ansible-inventory -i configs/aws_ec2.yml --list
# ansible-inventory -i configs/aws_ec2.yml --graph
```

### 4. Azure Dynamic Inventory

```bash
cat > configs/azure_rm.yml << 'EOF'
---
plugin: azure.azcollection.azure_rm

# Authentication
# auth_source: auto  # Uses Azure CLI, environment variables, or managed identity

# Filter VMs
include_vm_resource_groups:
  - production-rg
  - staging-rg

# Conditional groups
conditional_groups:
  linux: "'linux' in image.offer.lower()"
  windows: "'windows' in image.offer.lower()"
  webserver: "'webserver' in tags.Role"
  database: "'database' in tags.Role"

# Group by tags
keyed_groups:
  - key: tags.Environment
    prefix: env

  - key: tags.Role
    prefix: role

  - key: tags.Application
    prefix: app

  - key: location
    prefix: location

# Host variables
compose:
  ansible_host: public_ipv4_addresses[0] | default(private_ipv4_addresses[0])
  ansible_user: "'azureuser'"
  location: location
  vm_size: vm_size
  resource_group: resource_group

# Exclude stopped VMs
exclude_host_filters:
  - powerstate != 'running'
EOF

# Test Azure inventory (requires Azure credentials)
# ansible-inventory -i configs/azure_rm.yml --list
# ansible-inventory -i configs/azure_rm.yml --graph
```

### 5. GCP Dynamic Inventory

```bash
cat > configs/gcp_compute.yml << 'EOF'
---
plugin: google.cloud.gcp_compute

# GCP Project
projects:
  - my-project-id

# Authentication
# auth_kind: serviceaccount
# service_account_file: /path/to/credentials.json

# Filters
filters:
  - status = RUNNING
  # - labels.environment = production

# Groups
keyed_groups:
  # Group by zone
  - key: zone
    prefix: zone

  # Group by machine type
  - key: machineType
    prefix: machine_type

  # Group by labels
  - key: labels.environment
    prefix: env

  - key: labels.role
    prefix: role

  - key: labels.app
    prefix: app

# Host variables
compose:
  ansible_host: networkInterfaces[0].accessConfigs[0].natIP | default(networkInterfaces[0].networkIP)
  ansible_user: "'ubuntu'"
  instance_name: name
  machine_type: machineType.split('/')[-1]
  zone_name: zone.split('/')[-1]
EOF

# Test GCP inventory (requires GCP credentials)
# ansible-inventory -i configs/gcp_compute.yml --list
```

### 6. Multiple Inventory Sources

```bash
mkdir -p inventory

# Create inventory directory structure
cat > inventory/01_static.yml << 'EOF'
---
all:
  children:
    localhost_group:
      hosts:
        localhost:
          ansible_connection: local
EOF

cat > inventory/02_dynamic.yml << 'EOF'
---
# This could point to dynamic inventory plugin
plugin: auto
EOF

# Create ansible.cfg to use inventory directory
cat > ansible.cfg << 'EOF'
[defaults]
inventory = ./inventory
host_key_checking = False

[inventory]
enable_plugins = host_list, script, auto, yaml, ini, toml
EOF
```

### 7. Using Dynamic Inventory in Playbooks

```bash
cat > dynamic-inventory-demo.yml << 'EOF'
---
- name: Demo with Dynamic Inventory
  hosts: all
  gather_facts: yes

  tasks:
    - name: Display host information
      debug:
        msg: |
          Hostname: {{ inventory_hostname }}
          Groups: {{ group_names }}
          IP: {{ ansible_host | default('N/A') }}

    - name: Group-specific task for webservers
      debug:
        msg: "This is a webserver"
      when: "'webserver' in group_names"

    - name: Group-specific task for databases
      debug:
        msg: "This is a database server"
      when: "'database' in group_names"

    - name: Display all groups
      debug:
        var: groups
      run_once: true

    - name: Display hostvars
      debug:
        var: hostvars[inventory_hostname]
EOF

# Run with different inventories
# ansible-playbook -i scripts/simple_inventory.py dynamic-inventory-demo.yml
# ansible-playbook -i scripts/cloud_inventory.py dynamic-inventory-demo.yml
```

### 8. Inventory Cache

```bash
cat > ansible.cfg << 'EOF'
[defaults]
inventory = ./inventory

[inventory]
enable_plugins = host_list, script, auto, yaml, ini
cache = yes
cache_plugin = jsonfile
cache_timeout = 3600
cache_connection = /tmp/ansible_inventory_cache
EOF
```

### 9. Custom Inventory Plugin

```bash
mkdir -p inventory_plugins

cat > inventory_plugins/my_custom_inventory.py << 'PYTHON'
#!/usr/bin/env python3
"""
Custom Ansible inventory plugin
"""
from ansible.plugins.inventory import BaseInventoryPlugin, Constructable
from ansible.errors import AnsibleError

DOCUMENTATION = '''
    name: my_custom_inventory
    plugin_type: inventory
    short_description: Custom inventory plugin
    description: Custom inventory plugin example
    options:
      plugin:
        description: Token to ensure this is a source file for this plugin
        required: True
        choices: ['my_custom_inventory']
'''

class InventoryModule(BaseInventoryPlugin, Constructable):
    NAME = 'my_custom_inventory'

    def verify_file(self, path):
        """Verify this is a valid inventory file"""
        if super(InventoryModule, self).verify_file(path):
            if path.endswith(('.yml', '.yaml')):
                return True
        return False

    def parse(self, inventory, loader, path, cache=True):
        """Parse inventory"""
        super(InventoryModule, self).parse(inventory, loader, path, cache)

        # Read configuration
        self._read_config_data(path)

        # Add hosts and groups
        # This is a simple example
        group = 'custom_group'
        self.inventory.add_group(group)

        hosts = ['host1', 'host2', 'host3']
        for host in hosts:
            self.inventory.add_host(host, group=group)
            self.inventory.set_variable(host, 'ansible_host', '127.0.0.1')
            self.inventory.set_variable(host, 'ansible_connection', 'local')
PYTHON

cat > ansible.cfg << 'EOF'
[defaults]
inventory_plugins = ./inventory_plugins
EOF
```

## Verification Steps

```bash
# Test simple inventory
ansible-inventory -i scripts/simple_inventory.py --list
ansible-inventory -i scripts/simple_inventory.py --graph
ansible all -i scripts/simple_inventory.py -m ping

# Test cloud inventory
ansible-inventory -i scripts/cloud_inventory.py --list
ansible webserver -i scripts/cloud_inventory.py --list-hosts

# Test with playbook
ansible-playbook -i scripts/cloud_inventory.py dynamic-inventory-demo.yml

# Show specific group
ansible-inventory -i scripts/cloud_inventory.py --graph webserver

# Export to static format
ansible-inventory -i scripts/cloud_inventory.py --list --yaml > static_inventory.yml
```

## Best Practices

1. **Cache Results**: Use inventory caching for large infrastructures
2. **Filter Early**: Apply filters in inventory to reduce processing
3. **Group Logically**: Use consistent grouping strategies
4. **Security**: Store credentials securely (not in scripts)
5. **Performance**: Optimize API calls, use pagination
6. **Testing**: Test inventory scripts thoroughly
7. **Documentation**: Document group naming conventions

## Real-World Example

```bash
cat > scripts/production_inventory.py << 'PYTHON'
#!/usr/bin/env python3
"""
Production-ready dynamic inventory
Combines multiple sources and applies business logic
"""
import json
import argparse
import os
import requests
from datetime import datetime

def get_cmdb_servers():
    """Fetch servers from CMDB API"""
    # In production, this would call actual CMDB API
    return [
        {
            'hostname': 'prod-web-01',
            'ip': '10.0.1.10',
            'role': 'webserver',
            'environment': 'production',
            'application': 'ecommerce',
            'owner': 'team-platform',
            'monitored': True
        },
        {
            'hostname': 'prod-db-01',
            'ip': '10.0.2.10',
            'role': 'database',
            'environment': 'production',
            'application': 'ecommerce',
            'owner': 'team-data',
            'monitored': True
        }
    ]

def build_inventory():
    servers = get_cmdb_servers()

    inventory = {
        '_meta': {
            'hostvars': {}
        }
    }

    groups = {}

    for server in servers:
        hostname = server['hostname']

        # Add host variables
        inventory['_meta']['hostvars'][hostname] = {
            'ansible_host': server['ip'],
            'server_role': server['role'],
            'environment': server['environment'],
            'application': server['application'],
            'owner': server['owner'],
            'monitored': server['monitored']
        }

        # Create groups
        for group_type in ['role', 'environment', 'application', 'owner']:
            group_value = server.get(group_type)
            if group_value:
                group_name = f"{group_type}_{group_value}"
                if group_name not in groups:
                    groups[group_name] = {'hosts': [], 'vars': {}}
                groups[group_name]['hosts'].append(hostname)

    inventory.update(groups)
    return inventory

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--list', action='store_true')
    parser.add_argument('--host')
    args = parser.parse_args()

    if args.list:
        print(json.dumps(build_inventory(), indent=2))
    elif args.host:
        print(json.dumps({}, indent=2))
PYTHON

chmod +x scripts/production_inventory.py
```

## Exercise Tasks

1. Create a dynamic inventory script that:
   - Reads from a JSON/YAML file
   - Groups hosts by multiple criteria
   - Includes comprehensive host variables

2. Set up AWS EC2 dynamic inventory
3. Build a multi-source inventory combining static and dynamic
4. Implement inventory caching

## Next Steps

- Tutorial 08: Production Playbooks
