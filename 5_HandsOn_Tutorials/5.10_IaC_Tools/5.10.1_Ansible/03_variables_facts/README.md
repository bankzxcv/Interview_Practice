# Ansible Variables and Facts

## Overview
Master Ansible variables, facts, registered variables, and variable precedence for dynamic configurations.

## Prerequisites
- Completed Tutorials 01-02
- Understanding of YAML data structures
- Basic Jinja2 knowledge

## Key Concepts

### 1. Variables
- Define reusable values
- Can be defined at multiple levels
- Support different data types (strings, lists, dictionaries)

### 2. Facts
- Automatically gathered system information
- Available as variables in playbooks
- Can be custom facts

### 3. Variable Precedence
From lowest to highest:
1. Command line values (e.g., -u my_user)
2. Role defaults
3. Inventory file or script group vars
4. Inventory group_vars/all
5. Playbook group_vars/all
6. Inventory group_vars/*
7. Playbook group_vars/*
8. Inventory file or script host vars
9. Inventory host_vars/*
10. Playbook host_vars/*
11. Host facts
12. Play vars
13. Play vars_prompt
14. Play vars_files
15. Role vars
16. Block vars
17. Task vars
18. Include_vars
19. Set_facts / registered vars
20. Role (and include_role) params
21. Include params
22. Extra vars (-e in CLI)

## Hands-On Tutorial

### Setup
```bash
mkdir -p ansible-variables && cd ansible-variables

# Create directory structure
mkdir -p {group_vars,host_vars,files}

cat > inventory.ini << 'EOF'
[webservers]
web1 ansible_host=localhost ansible_connection=local
web2 ansible_host=localhost ansible_connection=local

[databases]
db1 ansible_host=localhost ansible_connection=local db_port=5432
db2 ansible_host=localhost ansible_connection=local db_port=5433

[production:children]
webservers
databases

[production:vars]
environment=production
region=us-east-1
EOF
```

### 1. Variable Definition

```bash
cat > vars-playbook.yml << 'EOF'
---
- name: Variable Examples
  hosts: all

  # Play-level variables
  vars:
    app_name: myapp
    app_version: "1.0.0"
    app_port: 8080

    # List variables
    packages:
      - nginx
      - postgresql
      - redis

    # Dictionary variables
    database:
      host: localhost
      port: 5432
      name: myapp_db
      user: dbuser

    # Nested dictionaries
    app_config:
      server:
        host: 0.0.0.0
        port: 8080
        workers: 4
      logging:
        level: INFO
        file: /var/log/myapp.log
      features:
        - authentication
        - caching
        - monitoring

  tasks:
    - name: Display simple variable
      debug:
        msg: "Application: {{ app_name }} version {{ app_version }}"

    - name: Display dictionary value
      debug:
        msg: "Database: {{ database.name }} on {{ database.host }}:{{ database.port }}"

    - name: Display nested value
      debug:
        msg: "Server will run on {{ app_config.server.host }}:{{ app_config.server.port }}"

    - name: Loop over list
      debug:
        msg: "Installing {{ item }}"
      loop: "{{ packages }}"

    - name: Loop over dictionary
      debug:
        msg: "{{ item.key }} = {{ item.value }}"
      loop: "{{ database | dict2items }}"

    - name: Access list by index
      debug:
        msg: "First feature: {{ app_config.features[0] }}"

    - name: Use default value
      debug:
        msg: "SSL enabled: {{ ssl_enabled | default('false') }}"
EOF
```

### 2. Variable Files

```bash
# Create variable files for different environments
cat > group_vars/all.yml << 'EOF'
---
# Global variables for all hosts
company_name: "ACME Corp"
timezone: "UTC"
ntp_servers:
  - 0.pool.ntp.org
  - 1.pool.ntp.org

common_packages:
  - curl
  - wget
  - git
  - vim
EOF

cat > group_vars/webservers.yml << 'EOF'
---
# Variables for webservers group
nginx_port: 80
nginx_worker_processes: auto
nginx_worker_connections: 1024

ssl_certificate: /etc/ssl/certs/server.crt
ssl_key: /etc/ssl/private/server.key

webserver_packages:
  - nginx
  - php-fpm
  - certbot
EOF

cat > group_vars/databases.yml << 'EOF'
---
# Variables for databases group
postgresql_version: "14"
postgresql_data_dir: /var/lib/postgresql/14/main
postgresql_max_connections: 100
postgresql_shared_buffers: 256MB

database_packages:
  - postgresql
  - postgresql-contrib
  - python3-psycopg2
EOF

cat > host_vars/web1.yml << 'EOF'
---
# Variables specific to web1
server_id: web1
datacenter: dc1
rack: rack-a1
EOF

cat > host_vars/db1.yml << 'EOF'
---
# Variables specific to db1
server_id: db1
db_role: primary
replication_enabled: true
EOF
```

### 3. Using Variable Files

```bash
cat > vars-files-playbook.yml << 'EOF'
---
- name: Variable Files Example
  hosts: all

  # Load additional variable files
  vars_files:
    - vars/app-config.yml
    - vars/secrets.yml

  tasks:
    - name: Display global variables
      debug:
        msg: "{{ company_name }} - Timezone: {{ timezone }}"

    - name: Display group variables (webservers)
      debug:
        msg: "Nginx port: {{ nginx_port | default('not a webserver') }}"

    - name: Display host variables
      debug:
        msg: "Server ID: {{ server_id | default('not set') }}"

    - name: Display environment variable
      debug:
        msg: "Environment: {{ environment }}"
      when: environment is defined
EOF

# Create additional variable files
mkdir -p vars

cat > vars/app-config.yml << 'EOF'
---
application:
  name: MyApp
  version: 2.0.0
  environment: "{{ environment | default('development') }}"

endpoints:
  api: /api/v1
  health: /health
  metrics: /metrics
EOF

cat > vars/secrets.yml << 'EOF'
---
# In production, encrypt this with ansible-vault
database_password: "changeme123"
api_key: "secret-api-key-123"
jwt_secret: "jwt-secret-key-456"
EOF
```

### 4. Facts

```bash
cat > facts-playbook.yml << 'EOF'
---
- name: Working with Facts
  hosts: all
  gather_facts: yes

  tasks:
    - name: Display all facts
      debug:
        var: ansible_facts
      when: false  # Set to true to see all facts

    - name: Display specific facts
      debug:
        msg: |
          Hostname: {{ ansible_hostname }}
          OS: {{ ansible_distribution }} {{ ansible_distribution_version }}
          Kernel: {{ ansible_kernel }}
          Architecture: {{ ansible_architecture }}
          CPU Cores: {{ ansible_processor_cores }}
          Total Memory: {{ ansible_memtotal_mb }} MB
          Python Version: {{ ansible_python_version }}

    - name: Display network facts
      debug:
        msg: |
          Default IPv4: {{ ansible_default_ipv4.address | default('N/A') }}
          All IPv4: {{ ansible_all_ipv4_addresses }}
          Hostname: {{ ansible_fqdn }}

    - name: Display disk facts
      debug:
        msg: "Mount: {{ item.mount }} - Size: {{ item.size_total }}"
      loop: "{{ ansible_mounts }}"
      when: item.mount == '/'

    - name: Conditional based on facts
      debug:
        msg: "This is a Debian-based system"
      when: ansible_os_family == "Debian"

    - name: Conditional based on memory
      debug:
        msg: "High memory system"
      when: ansible_memtotal_mb >= 8192

    # Custom facts
    - name: Create custom facts directory
      file:
        path: /etc/ansible/facts.d
        state: directory
        mode: '0755'
      become: yes

    - name: Create custom fact
      copy:
        content: |
          [app]
          name=MyApp
          version=1.0.0
          environment=production
        dest: /etc/ansible/facts.d/custom.fact
        mode: '0644'
      become: yes

    - name: Reload facts to include custom facts
      setup:
      register: facts_reload

    - name: Display custom facts
      debug:
        var: ansible_local.custom
      when: ansible_local.custom is defined
EOF
```

### 5. Registered Variables

```bash
cat > registered-vars-playbook.yml << 'EOF'
---
- name: Registered Variables
  hosts: all

  tasks:
    - name: Run command and register result
      command: date +%Y-%m-%d
      register: current_date
      changed_when: false

    - name: Display registered variable
      debug:
        var: current_date

    - name: Use registered variable
      debug:
        msg: "Today is {{ current_date.stdout }}"

    - name: Check if file exists
      stat:
        path: /etc/hosts
      register: hosts_file

    - name: Display file info
      debug:
        msg: "File exists: {{ hosts_file.stat.exists }}, Size: {{ hosts_file.stat.size }}"

    - name: Conditional based on registered variable
      debug:
        msg: "Hosts file is present"
      when: hosts_file.stat.exists

    - name: Get service status
      systemd:
        name: nginx
      register: nginx_service
      ignore_errors: yes

    - name: Check service state
      debug:
        msg: "Nginx is {{ nginx_service.status.ActiveState | default('not installed') }}"
      when: nginx_service.status is defined

    - name: Run command and check return code
      command: /bin/true
      register: command_result
      failed_when: command_result.rc != 0
      changed_when: false

    - name: Get directory contents
      find:
        paths: /tmp
        patterns: "*.txt"
      register: found_files

    - name: Process found files
      debug:
        msg: "Found: {{ item.path }}"
      loop: "{{ found_files.files }}"
      when: found_files.matched > 0
EOF
```

### 6. Set Facts

```bash
cat > set-facts-playbook.yml << 'EOF'
---
- name: Set Facts Examples
  hosts: all
  gather_facts: yes

  tasks:
    - name: Set simple fact
      set_fact:
        deployment_date: "{{ ansible_date_time.date }}"

    - name: Set complex fact
      set_fact:
        server_info:
          hostname: "{{ ansible_hostname }}"
          os: "{{ ansible_distribution }}"
          ip: "{{ ansible_default_ipv4.address | default('N/A') }}"
          memory_gb: "{{ (ansible_memtotal_mb / 1024) | round(1) }}"

    - name: Display set facts
      debug:
        var: server_info

    - name: Set fact based on condition
      set_fact:
        server_type: "{{ 'production' if ansible_memtotal_mb >= 8192 else 'development' }}"

    - name: Calculate and set fact
      set_fact:
        disk_usage_percent: "{{ (ansible_mounts[0].size_total - ansible_mounts[0].size_available) * 100 / ansible_mounts[0].size_total | round(2) }}"
      when: ansible_mounts | length > 0

    - name: Set fact from command
      shell: uname -r
      register: kernel_version_raw
      changed_when: false

    - name: Store kernel version as fact
      set_fact:
        kernel_version: "{{ kernel_version_raw.stdout }}"

    - name: Combine facts
      set_fact:
        system_summary: |
          Server: {{ server_info.hostname }}
          OS: {{ server_info.os }}
          Type: {{ server_type }}
          Kernel: {{ kernel_version }}
          Memory: {{ server_info.memory_gb }} GB

    - name: Display summary
      debug:
        msg: "{{ system_summary }}"

    # Facts persist across plays in the same playbook
    - name: Set fact for use in next play
      set_fact:
        configuration_complete: true
        cacheable: yes  # Makes it cacheable

- name: Use facts from previous play
  hosts: all
  gather_facts: no

  tasks:
    - name: Check if configuration was completed
      debug:
        msg: "Configuration status: {{ configuration_complete | default('not set') }}"
EOF
```

### 7. Variable Precedence

```bash
cat > precedence-playbook.yml << 'EOF'
---
- name: Variable Precedence Example
  hosts: all

  # Play vars (precedence 12)
  vars:
    my_var: "from_play_vars"
    test_var: "play_level"

  # Vars files (precedence 14)
  vars_files:
    - precedence-vars.yml

  tasks:
    - name: Display variable (will use highest precedence)
      debug:
        msg: "my_var = {{ my_var }}"

    - name: Set fact (precedence 19)
      set_fact:
        my_var: "from_set_fact"

    - name: Display after set_fact
      debug:
        msg: "my_var = {{ my_var }}"

    - name: Task vars (precedence 17)
      debug:
        msg: "my_var = {{ my_var }}"
      vars:
        my_var: "from_task_vars"

    - name: Include vars (precedence 18)
      include_vars:
        file: included-vars.yml

    - name: Display included var
      debug:
        msg: "included_var = {{ included_var | default('not set') }}"

    - name: Command line -e has highest precedence
      debug:
        msg: "cli_var = {{ cli_var | default('not provided') }}"
EOF

cat > precedence-vars.yml << 'EOF'
---
my_var: "from_vars_file"
file_var: "from_precedence_vars"
EOF

cat > included-vars.yml << 'EOF'
---
included_var: "from_included_file"
my_var: "from_included_vars"
EOF
```

### 8. Magic Variables

```bash
cat > magic-vars-playbook.yml << 'EOF'
---
- name: Magic Variables
  hosts: all
  gather_facts: yes

  tasks:
    - name: Display magic variables
      debug:
        msg: |
          Inventory hostname: {{ inventory_hostname }}
          Inventory hostname short: {{ inventory_hostname_short }}
          Group names: {{ group_names }}
          Groups: {{ groups }}
          Play hosts: {{ play_hosts }}
          Ansible play batch: {{ ansible_play_batch }}
          Ansible version: {{ ansible_version.full }}

    - name: Display hostvars for all hosts
      debug:
        msg: "Host {{ item }} has IP: {{ hostvars[item].ansible_default_ipv4.address | default('N/A') }}"
      loop: "{{ groups['all'] }}"

    - name: Display environment variables
      debug:
        var: ansible_env

    - name: Use environment variable
      debug:
        msg: "Home directory: {{ ansible_env.HOME }}"

    - name: Playbook directory
      debug:
        msg: "Playbook dir: {{ playbook_dir }}"

    - name: Role path (if in role)
      debug:
        msg: "Role path: {{ role_path | default('not in role') }}"
EOF
```

## Verification Steps

```bash
# Run basic variables playbook
ansible-playbook -i inventory.ini vars-playbook.yml

# Run with variable files
ansible-playbook -i inventory.ini vars-files-playbook.yml

# Run facts playbook
ansible-playbook -i inventory.ini facts-playbook.yml

# Run registered variables
ansible-playbook -i inventory.ini registered-vars-playbook.yml

# Run set facts
ansible-playbook -i inventory.ini set-facts-playbook.yml

# Test variable precedence
ansible-playbook -i inventory.ini precedence-playbook.yml

# Override with command line (highest precedence)
ansible-playbook -i inventory.ini precedence-playbook.yml -e "my_var=from_command_line cli_var=extra_var"

# Run magic variables
ansible-playbook -i inventory.ini magic-vars-playbook.yml

# Filter facts
ansible all -i inventory.ini -m setup -a "filter=ansible_distribution*"
ansible all -i inventory.ini -m setup -a "filter=ansible_memory_mb"
```

## Variable Filters

Common Jinja2 filters used with variables:

```yaml
# String filters
{{ my_var | upper }}
{{ my_var | lower }}
{{ my_var | capitalize }}
{{ my_var | replace('old', 'new') }}

# Default values
{{ my_var | default('default_value') }}
{{ my_var | default(omit) }}  # Omit parameter if undefined

# Type conversion
{{ my_var | int }}
{{ my_var | float }}
{{ my_var | string }}
{{ my_var | bool }}

# Lists
{{ my_list | length }}
{{ my_list | first }}
{{ my_list | last }}
{{ my_list | unique }}
{{ my_list | sort }}
{{ my_list | join(',') }}

# Dictionaries
{{ my_dict | dict2items }}
{{ my_list | items2dict }}

# Math
{{ my_num | abs }}
{{ my_num | round }}
{{ my_num | round(2) }}

# File paths
{{ my_path | basename }}
{{ my_path | dirname }}

# JSON/YAML
{{ my_var | to_json }}
{{ my_var | to_nice_json }}
{{ my_var | to_yaml }}
{{ my_var | from_json }}
{{ my_var | from_yaml }}
```

## Best Practices

1. **Naming Convention**: Use descriptive names with underscores
2. **Organization**: Use group_vars and host_vars for clarity
3. **Defaults**: Always provide defaults for optional variables
4. **Documentation**: Comment complex variable structures
5. **Sensitivity**: Use ansible-vault for sensitive data
6. **Type Safety**: Validate variable types where critical

## Exercise Tasks

1. Create an inventory with variables at different levels
2. Write a playbook that:
   - Uses group_vars and host_vars
   - Registers command output
   - Sets facts based on system information
   - Uses conditional logic based on facts
3. Test variable precedence by setting same variable at multiple levels

## Next Steps

- Tutorial 04: Jinja2 Templates
- Tutorial 05: Roles
- Tutorial 06: Ansible Vault
