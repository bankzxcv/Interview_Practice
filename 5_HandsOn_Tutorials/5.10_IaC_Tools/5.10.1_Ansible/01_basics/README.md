# Ansible Basics

## Overview
Learn Ansible fundamentals including installation, inventory management, and creating your first playbook.

## Prerequisites
- Linux/macOS system
- Python 3.8+
- SSH access to target systems (or localhost)

## Installation

### Install Ansible
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ansible -y

# macOS
brew install ansible

# pip (any OS)
pip install ansible

# Verify installation
ansible --version
```

## Key Concepts

### 1. Inventory
- List of managed hosts
- Can be static (INI/YAML) or dynamic
- Organizes hosts into groups

### 2. Playbooks
- YAML files describing automation tasks
- Declarative configuration
- Idempotent operations

### 3. Modules
- Reusable units of work
- Handle specific tasks (install packages, copy files, etc.)

## Hands-On Tutorial

### Step 1: Create Inventory File
```bash
# Create inventory directory
mkdir -p ansible-basics && cd ansible-basics

# Create inventory file
cat > inventory.ini << 'EOF'
[local]
localhost ansible_connection=local

[webservers]
web1 ansible_host=localhost ansible_connection=local
web2 ansible_host=localhost ansible_connection=local

[databases]
db1 ansible_host=localhost ansible_connection=local

[production:children]
webservers
databases
EOF
```

### Step 2: Test Connectivity
```bash
# Ping all hosts
ansible all -i inventory.ini -m ping

# Ping specific group
ansible webservers -i inventory.ini -m ping
```

### Step 3: Ad-hoc Commands
```bash
# Get system information
ansible all -i inventory.ini -m setup -a "filter=ansible_distribution*"

# Check disk space
ansible all -i inventory.ini -m shell -a "df -h"

# Create directory
ansible all -i inventory.ini -m file -a "path=/tmp/ansible-test state=directory mode=0755"
```

### Step 4: Create Your First Playbook
```bash
cat > playbook.yml << 'EOF'
---
- name: My First Ansible Playbook
  hosts: all
  gather_facts: yes

  tasks:
    - name: Print hostname
      debug:
        msg: "Hostname is {{ ansible_hostname }}"

    - name: Print distribution
      debug:
        msg: "Running on {{ ansible_distribution }} {{ ansible_distribution_version }}"

    - name: Create a file
      file:
        path: /tmp/ansible-created.txt
        state: touch
        mode: '0644'

    - name: Write content to file
      copy:
        content: |
          This file was created by Ansible
          Date: {{ ansible_date_time.iso8601 }}
          Host: {{ ansible_hostname }}
        dest: /tmp/ansible-created.txt

    - name: Ensure directory exists
      file:
        path: /tmp/ansible-demo
        state: directory
        mode: '0755'
EOF
```

### Step 5: Run the Playbook
```bash
# Run playbook with verbose output
ansible-playbook -i inventory.ini playbook.yml -v

# Check result
cat /tmp/ansible-created.txt
ls -la /tmp/ansible-demo
```

### Step 6: Advanced Playbook with Conditions
```bash
cat > advanced-playbook.yml << 'EOF'
---
- name: Advanced Playbook Example
  hosts: all
  gather_facts: yes

  vars:
    app_name: myapp
    app_version: "1.0.0"
    environment: development

  tasks:
    - name: Print welcome message
      debug:
        msg: "Deploying {{ app_name }} version {{ app_version }} to {{ environment }}"

    - name: Install packages (Debian/Ubuntu)
      apt:
        name:
          - curl
          - wget
          - git
        state: present
        update_cache: yes
      when: ansible_os_family == "Debian"
      become: yes

    - name: Install packages (RedHat/CentOS)
      yum:
        name:
          - curl
          - wget
          - git
        state: present
      when: ansible_os_family == "RedHat"
      become: yes

    - name: Create application directory
      file:
        path: "/opt/{{ app_name }}"
        state: directory
        mode: '0755'
      become: yes

    - name: Create config file
      copy:
        content: |
          APP_NAME={{ app_name }}
          APP_VERSION={{ app_version }}
          ENVIRONMENT={{ environment }}
          DEPLOYED_AT={{ ansible_date_time.iso8601 }}
        dest: "/opt/{{ app_name }}/config.env"
        mode: '0644'
      become: yes

    - name: Display success message
      debug:
        msg: "Application {{ app_name }} deployed successfully!"
EOF
```

### Step 7: Run with Different Variables
```bash
# Run with default variables
ansible-playbook -i inventory.ini advanced-playbook.yml

# Run with custom variables
ansible-playbook -i inventory.ini advanced-playbook.yml \
  -e "app_version=2.0.0 environment=production"

# Verify deployment
sudo cat /opt/myapp/config.env
```

## Ansible Configuration

### Create ansible.cfg
```bash
cat > ansible.cfg << 'EOF'
[defaults]
inventory = ./inventory.ini
host_key_checking = False
retry_files_enabled = False
gathering = smart
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_facts
fact_caching_timeout = 86400

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False

[ssh_connection]
pipelining = True
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
EOF
```

## Verification Steps

### 1. Verify Ansible Installation
```bash
ansible --version
ansible-playbook --version
ansible-galaxy --version
```

### 2. Test Inventory
```bash
# List all hosts
ansible all -i inventory.ini --list-hosts

# List specific group
ansible webservers -i inventory.ini --list-hosts

# Show inventory graph
ansible-inventory -i inventory.ini --graph
```

### 3. Verify Playbook Syntax
```bash
# Check syntax
ansible-playbook -i inventory.ini playbook.yml --syntax-check

# Dry run (check mode)
ansible-playbook -i inventory.ini playbook.yml --check

# Show tasks
ansible-playbook -i inventory.ini playbook.yml --list-tasks
```

### 4. Run and Verify
```bash
# Run playbook
ansible-playbook -i inventory.ini playbook.yml

# Verify files created
ls -la /tmp/ansible-created.txt
ls -la /tmp/ansible-demo
sudo ls -la /opt/myapp/
```

## Common Use Cases

### 1. System Information
```bash
cat > system-info.yml << 'EOF'
---
- name: Gather System Information
  hosts: all
  gather_facts: yes

  tasks:
    - name: Display all facts
      debug:
        var: ansible_facts

    - name: Create system report
      copy:
        content: |
          System Report
          =============
          Hostname: {{ ansible_hostname }}
          OS: {{ ansible_distribution }} {{ ansible_distribution_version }}
          Kernel: {{ ansible_kernel }}
          Architecture: {{ ansible_architecture }}
          CPU Cores: {{ ansible_processor_cores }}
          Memory: {{ ansible_memtotal_mb }} MB
          IP Address: {{ ansible_default_ipv4.address | default('N/A') }}
        dest: /tmp/system-report.txt
EOF

ansible-playbook -i inventory.ini system-info.yml
cat /tmp/system-report.txt
```

### 2. File Management
```bash
cat > file-management.yml << 'EOF'
---
- name: File Management Tasks
  hosts: all

  tasks:
    - name: Create multiple directories
      file:
        path: "{{ item }}"
        state: directory
        mode: '0755'
      loop:
        - /tmp/app/logs
        - /tmp/app/data
        - /tmp/app/config

    - name: Create multiple files
      file:
        path: "/tmp/app/{{ item }}"
        state: touch
        mode: '0644'
      loop:
        - README.md
        - LICENSE
        - .gitignore

    - name: Set permissions
      file:
        path: /tmp/app
        state: directory
        mode: '0755'
        recurse: yes
EOF

ansible-playbook -i inventory.ini file-management.yml
ls -laR /tmp/app/
```

## Best Practices

1. **Use Meaningful Names**: Task names should clearly describe what they do
2. **Idempotency**: Playbooks should be safe to run multiple times
3. **Use Variables**: Don't hardcode values
4. **Group Related Tasks**: Organize tasks logically
5. **Error Handling**: Use `failed_when`, `changed_when`, `ignore_errors`
6. **Documentation**: Comment complex tasks

## Common Issues and Solutions

### Issue 1: SSH Connection Failed
```bash
# Solution: Use local connection for localhost
ansible_connection=local

# Or disable host key checking
export ANSIBLE_HOST_KEY_CHECKING=False
```

### Issue 2: Permission Denied
```bash
# Solution: Use become (sudo)
become: yes

# Or run with --become
ansible-playbook playbook.yml --become
```

### Issue 3: Module Not Found
```bash
# Solution: Update Ansible
pip install --upgrade ansible

# Or install specific collection
ansible-galaxy collection install community.general
```

## Exercise Tasks

1. Create an inventory with 3 groups: web, db, cache
2. Write a playbook that:
   - Creates a user called 'appuser'
   - Creates /opt/myapp directory structure
   - Installs basic packages (curl, wget, git)
   - Creates a simple configuration file
3. Run the playbook on all hosts
4. Verify all tasks completed successfully

## Additional Resources

- [Ansible Documentation](https://docs.ansible.com/)
- [Ansible Galaxy](https://galaxy.ansible.com/)
- [Best Practices](https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html)

## Next Steps

- Tutorial 02: Learn about Ansible modules
- Tutorial 03: Master variables and facts
- Tutorial 04: Work with Jinja2 templates
