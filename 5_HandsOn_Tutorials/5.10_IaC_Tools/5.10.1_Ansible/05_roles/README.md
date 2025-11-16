# Ansible Roles

## Overview
Learn to create reusable, modular Ansible roles for better organization and code reuse.

## Prerequisites
- Completed Tutorials 01-04
- Understanding of playbooks, variables, and templates

## Role Structure

```
roles/
└── role_name/
    ├── defaults/      # Default variables (lowest precedence)
    │   └── main.yml
    ├── vars/          # Role variables (higher precedence)
    │   └── main.yml
    ├── tasks/         # Main task list
    │   └── main.yml
    ├── handlers/      # Handlers
    │   └── main.yml
    ├── templates/     # Jinja2 templates
    ├── files/         # Static files
    ├── meta/          # Role dependencies and metadata
    │   └── main.yml
    ├── tests/         # Test playbooks
    │   ├── inventory
    │   └── test.yml
    └── README.md      # Documentation
```

## Hands-On Tutorial

### Setup
```bash
mkdir -p ansible-roles && cd ansible-roles
ansible-galaxy init webserver
ansible-galaxy init database
ansible-galaxy init app

cat > inventory.ini << 'EOF'
[webservers]
web1 ansible_host=localhost ansible_connection=local

[databases]
db1 ansible_host=localhost ansible_connection=local
EOF
```

### 1. Create Basic Role - Webserver

```bash
# defaults/main.yml
cat > webserver/defaults/main.yml << 'EOF'
---
# Webserver role defaults
nginx_port: 80
nginx_user: www-data
nginx_worker_processes: auto
nginx_worker_connections: 1024
nginx_keepalive_timeout: 65
nginx_server_name: localhost
nginx_root: /var/www/html
enable_ssl: false
EOF

# vars/main.yml
cat > webserver/vars/main.yml << 'EOF'
---
# Webserver role variables
nginx_config_dir: /etc/nginx
nginx_log_dir: /var/log/nginx
nginx_pid_file: /var/run/nginx.pid
EOF

# tasks/main.yml
cat > webserver/tasks/main.yml << 'EOF'
---
# Webserver role tasks
- name: Install nginx
  apt:
    name: nginx
    state: present
    update_cache: yes
  when: ansible_os_family == "Debian"

- name: Create nginx directories
  file:
    path: "{{ item }}"
    state: directory
    mode: '0755'
  loop:
    - "{{ nginx_config_dir }}/sites-available"
    - "{{ nginx_config_dir }}/sites-enabled"
    - "{{ nginx_root }}"

- name: Generate nginx.conf
  template:
    src: nginx.conf.j2
    dest: "{{ nginx_config_dir }}/nginx.conf"
    mode: '0644'
    validate: 'nginx -t -c %s'
  notify: restart nginx

- name: Generate site config
  template:
    src: site.conf.j2
    dest: "{{ nginx_config_dir }}/sites-available/default"
    mode: '0644'
  notify: reload nginx

- name: Enable site
  file:
    src: "{{ nginx_config_dir }}/sites-available/default"
    dest: "{{ nginx_config_dir }}/sites-enabled/default"
    state: link
  notify: reload nginx

- name: Create index.html
  template:
    src: index.html.j2
    dest: "{{ nginx_root }}/index.html"
    mode: '0644'

- name: Start and enable nginx
  service:
    name: nginx
    state: started
    enabled: yes
EOF

# handlers/main.yml
cat > webserver/handlers/main.yml << 'EOF'
---
# Webserver handlers
- name: restart nginx
  service:
    name: nginx
    state: restarted

- name: reload nginx
  service:
    name: nginx
    state: reloaded

- name: test nginx config
  command: nginx -t
  changed_when: false
EOF

# templates/nginx.conf.j2
cat > webserver/templates/nginx.conf.j2 << 'EOF'
user {{ nginx_user }};
worker_processes {{ nginx_worker_processes }};
pid {{ nginx_pid_file }};

events {
    worker_connections {{ nginx_worker_connections }};
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log {{ nginx_log_dir }}/access.log;
    error_log {{ nginx_log_dir }}/error.log;

    sendfile on;
    keepalive_timeout {{ nginx_keepalive_timeout }};

    include {{ nginx_config_dir }}/sites-enabled/*;
}
EOF

# templates/site.conf.j2
cat > webserver/templates/site.conf.j2 << 'EOF'
server {
    listen {{ nginx_port }};
    server_name {{ nginx_server_name }};
    root {{ nginx_root }};
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

# templates/index.html.j2
cat > webserver/templates/index.html.j2 << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to {{ nginx_server_name }}</title>
</head>
<body>
    <h1>Nginx Server</h1>
    <p>Server: {{ ansible_hostname }}</p>
    <p>Environment: {{ environment | default('development') }}</p>
    <p>Deployed: {{ ansible_date_time.iso8601 }}</p>
</body>
</html>
EOF
```

### 2. Create Database Role

```bash
# database/defaults/main.yml
cat > database/defaults/main.yml << 'EOF'
---
postgres_version: "14"
postgres_port: 5432
postgres_listen_addresses: "localhost"
postgres_max_connections: 100
postgres_shared_buffers: "256MB"
databases: []
users: []
EOF

# database/tasks/main.yml
cat > database/tasks/main.yml << 'EOF'
---
- name: Install PostgreSQL
  apt:
    name:
      - postgresql
      - postgresql-contrib
      - python3-psycopg2
    state: present
    update_cache: yes
  when: ansible_os_family == "Debian"

- name: Ensure PostgreSQL is running
  service:
    name: postgresql
    state: started
    enabled: yes

- name: Configure PostgreSQL
  template:
    src: postgresql.conf.j2
    dest: /etc/postgresql/{{ postgres_version }}/main/postgresql.conf
    mode: '0644'
  notify: restart postgresql
  when: false  # Enable if postgres installed

- name: Create databases
  postgresql_db:
    name: "{{ item.name }}"
    encoding: "{{ item.encoding | default('UTF8') }}"
    state: present
  loop: "{{ databases }}"
  become: yes
  become_user: postgres
  when: databases | length > 0

- name: Create users
  postgresql_user:
    name: "{{ item.name }}"
    password: "{{ item.password }}"
    role_attr_flags: "{{ item.role_attr_flags | default('') }}"
    state: present
  loop: "{{ users }}"
  become: yes
  become_user: postgres
  when: users | length > 0
EOF

# database/handlers/main.yml
cat > database/handlers/main.yml << 'EOF'
---
- name: restart postgresql
  service:
    name: postgresql
    state: restarted
EOF
```

### 3. Create Application Role

```bash
# app/defaults/main.yml
cat > app/defaults/main.yml << 'EOF'
---
app_name: myapp
app_version: "1.0.0"
app_user: appuser
app_group: appgroup
app_dir: /opt/{{ app_name }}
app_port: 8080
environment: development
EOF

# app/tasks/main.yml
cat > app/tasks/main.yml << 'EOF'
---
- name: Include OS-specific variables
  include_vars: "{{ ansible_os_family }}.yml"
  ignore_errors: yes

- name: Create app group
  group:
    name: "{{ app_group }}"
    state: present

- name: Create app user
  user:
    name: "{{ app_user }}"
    group: "{{ app_group }}"
    home: "{{ app_dir }}"
    shell: /bin/bash
    system: yes
    state: present

- name: Create app directories
  file:
    path: "{{ item }}"
    state: directory
    owner: "{{ app_user }}"
    group: "{{ app_group }}"
    mode: '0755'
  loop:
    - "{{ app_dir }}"
    - "{{ app_dir }}/bin"
    - "{{ app_dir }}/config"
    - "{{ app_dir }}/logs"
    - "{{ app_dir }}/data"

- name: Generate app config
  template:
    src: app.conf.j2
    dest: "{{ app_dir }}/config/app.conf"
    owner: "{{ app_user }}"
    group: "{{ app_group }}"
    mode: '0644'
  notify: restart app

- name: Generate systemd service
  template:
    src: app.service.j2
    dest: /etc/systemd/system/{{ app_name }}.service
    mode: '0644'
  notify:
    - reload systemd
    - restart app
  when: ansible_service_mgr == "systemd"

- name: Install app dependencies
  package:
    name: "{{ app_dependencies }}"
    state: present
  when: app_dependencies is defined
EOF

# app/handlers/main.yml
cat > app/handlers/main.yml << 'EOF'
---
- name: reload systemd
  systemd:
    daemon_reload: yes

- name: restart app
  service:
    name: "{{ app_name }}"
    state: restarted

- name: start app
  service:
    name: "{{ app_name }}"
    state: started
EOF

# app/templates/app.conf.j2
cat > app/templates/app.conf.j2 << 'EOF'
# {{ app_name }} Configuration
[app]
name={{ app_name }}
version={{ app_version }}
environment={{ environment }}

[server]
host=0.0.0.0
port={{ app_port }}

[paths]
config={{ app_dir }}/config
logs={{ app_dir }}/logs
data={{ app_dir }}/data
EOF
```

### 4. Role Dependencies

```bash
# app/meta/main.yml
cat > app/meta/main.yml << 'EOF'
---
galaxy_info:
  author: Your Name
  description: Application deployment role
  company: Your Company
  license: MIT
  min_ansible_version: 2.9

  platforms:
    - name: Ubuntu
      versions:
        - focal
        - jammy
    - name: Debian
      versions:
        - buster
        - bullseye

  galaxy_tags:
    - application
    - deployment

dependencies:
  - role: webserver
    vars:
      nginx_port: 80
  # - role: database
  #   vars:
  #     postgres_port: 5432
EOF
```

### 5. Use Roles in Playbook

```bash
cat > site.yml << 'EOF'
---
- name: Deploy Full Stack
  hosts: all
  become: yes

  vars:
    environment: production

  roles:
    - role: webserver
      vars:
        nginx_port: 8080
        nginx_server_name: myapp.example.com

    - role: app
      vars:
        app_name: myapp
        app_version: "2.0.0"
        app_port: 8080
EOF

cat > webserver-only.yml << 'EOF'
---
- name: Deploy Webserver
  hosts: webservers
  become: yes

  roles:
    - webserver
EOF
```

### 6. Role with Tasks Organization

```bash
mkdir -p common/tasks

# common/tasks/main.yml
cat > common/tasks/main.yml << 'EOF'
---
- name: Include package installation
  include_tasks: packages.yml

- name: Include user setup
  include_tasks: users.yml

- name: Include security setup
  include_tasks: security.yml
  when: enable_security | default(false)
EOF

# common/tasks/packages.yml
cat > common/tasks/packages.yml << 'EOF'
---
- name: Update package cache
  apt:
    update_cache: yes
    cache_valid_time: 3600
  when: ansible_os_family == "Debian"

- name: Install common packages
  package:
    name:
      - curl
      - wget
      - git
      - vim
      - htop
      - net-tools
    state: present
EOF

# common/tasks/users.yml
cat > common/tasks/users.yml << 'EOF'
---
- name: Create admin group
  group:
    name: admin
    state: present

- name: Create users
  user:
    name: "{{ item.name }}"
    groups: "{{ item.groups | default([]) }}"
    shell: "{{ item.shell | default('/bin/bash') }}"
    state: present
  loop: "{{ admin_users | default([]) }}"
  when: admin_users is defined
EOF

# common/tasks/security.yml
cat > common/tasks/security.yml << 'EOF'
---
- name: Configure UFW
  ufw:
    rule: "{{ item.rule }}"
    port: "{{ item.port }}"
    proto: "{{ item.proto | default('tcp') }}"
  loop: "{{ firewall_rules | default([]) }}"
  when: ansible_os_family == "Debian"
EOF
```

### 7. Testing Roles

```bash
# webserver/tests/test.yml
cat > webserver/tests/test.yml << 'EOF'
---
- name: Test Webserver Role
  hosts: localhost
  connection: local
  become: yes

  roles:
    - webserver

  post_tasks:
    - name: Check nginx is running
      service:
        name: nginx
        state: started
      register: nginx_status
      ignore_errors: yes

    - name: Verify nginx config
      command: nginx -t
      changed_when: false
      ignore_errors: yes

    - name: Check nginx port is listening
      wait_for:
        port: "{{ nginx_port }}"
        timeout: 5
      ignore_errors: yes
EOF
```

## Verification Steps

```bash
# Test role syntax
ansible-playbook --syntax-check site.yml

# Check what will be changed (dry run)
ansible-playbook -i inventory.ini site.yml --check

# Run specific role
ansible-playbook -i inventory.ini webserver-only.yml

# Run full stack with tags
ansible-playbook -i inventory.ini site.yml --tags webserver

# List tasks
ansible-playbook -i inventory.ini site.yml --list-tasks

# List tags
ansible-playbook -i inventory.ini site.yml --list-tags

# Test role
cd webserver
ansible-playbook tests/test.yml
```

## Role Best Practices

1. **Naming**: Use descriptive role names (noun, not verb)
2. **Documentation**: Always include README.md
3. **Defaults**: Provide sensible defaults
4. **Variables**: Use role namespace for variables
5. **Dependencies**: Keep minimal and explicit
6. **Testing**: Include test playbooks
7. **Idempotency**: Ensure tasks are idempotent
8. **Tags**: Use tags for selective execution

## Using Ansible Galaxy

```bash
# Search for roles
ansible-galaxy search nginx

# Install role from Galaxy
ansible-galaxy install geerlingguy.nginx

# Install specific version
ansible-galaxy install geerlingguy.nginx,2.8.0

# Install from requirements file
cat > requirements.yml << 'EOF'
---
roles:
  - name: geerlingguy.nginx
    version: 2.8.0
  - name: geerlingguy.postgresql
    version: 3.2.0

collections:
  - name: community.general
    version: 3.8.0
EOF

ansible-galaxy install -r requirements.yml

# List installed roles
ansible-galaxy list

# Remove role
ansible-galaxy remove geerlingguy.nginx
```

## Exercise Tasks

1. Create a complete LAMP stack role with dependencies
2. Build a monitoring role that installs and configures Prometheus
3. Create a role with:
   - Multiple task files
   - Templates for configuration
   - Handlers for service management
   - Default variables
   - Meta dependencies

## Next Steps

- Tutorial 06: Ansible Vault
- Tutorial 07: Dynamic Inventory
- Tutorial 08: Production Playbooks
