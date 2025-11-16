# Ansible Modules

## Overview
Master commonly used Ansible modules for package management, file operations, and system configuration.

## Prerequisites
- Completed Tutorial 01 (Basics)
- Ansible installed
- Understanding of YAML syntax

## Key Modules Covered

1. **Package Management**: apt, yum, package
2. **File Operations**: copy, template, file, lineinfile
3. **Service Management**: service, systemd
4. **Command Execution**: command, shell, script
5. **User Management**: user, group
6. **Archive Operations**: archive, unarchive

## Hands-On Tutorial

### Setup
```bash
mkdir -p ansible-modules && cd ansible-modules

cat > inventory.ini << 'EOF'
[local]
localhost ansible_connection=local

[servers]
server1 ansible_host=localhost ansible_connection=local
EOF
```

### 1. Package Management Modules

```bash
cat > packages-playbook.yml << 'EOF'
---
- name: Package Management Examples
  hosts: all
  become: yes

  tasks:
    # APT module (Debian/Ubuntu)
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"

    - name: Install packages with apt
      apt:
        name:
          - nginx
          - python3-pip
          - git
          - curl
          - htop
        state: present
      when: ansible_os_family == "Debian"

    - name: Remove package with apt
      apt:
        name: apache2
        state: absent
      when: ansible_os_family == "Debian"

    # YUM module (RHEL/CentOS)
    - name: Install packages with yum
      yum:
        name:
          - nginx
          - python3-pip
          - git
          - curl
          - htop
        state: present
      when: ansible_os_family == "RedHat"

    # Generic package module (works across distros)
    - name: Install with generic package module
      package:
        name:
          - wget
          - vim
        state: present

    # Install specific version
    - name: Install specific package version
      apt:
        name: nginx=1.18.*
        state: present
      when: ansible_os_family == "Debian"
      ignore_errors: yes

    # Upgrade all packages
    - name: Upgrade all packages (apt)
      apt:
        upgrade: dist
        update_cache: yes
      when: ansible_os_family == "Debian" and environment == "maintenance"
      tags: upgrade
EOF
```

### 2. File Operations Modules

```bash
cat > files-playbook.yml << 'EOF'
---
- name: File Operations Examples
  hosts: all
  become: yes

  vars:
    app_dir: /opt/myapp
    config_dir: "{{ app_dir }}/config"

  tasks:
    # FILE module - directories and file properties
    - name: Create directory structure
      file:
        path: "{{ item }}"
        state: directory
        mode: '0755'
        owner: root
        group: root
      loop:
        - "{{ app_dir }}"
        - "{{ config_dir }}"
        - "{{ app_dir }}/logs"
        - "{{ app_dir }}/data"

    - name: Create empty file
      file:
        path: "{{ app_dir }}/app.log"
        state: touch
        mode: '0644'

    - name: Create symbolic link
      file:
        src: "{{ app_dir }}/app.log"
        dest: /var/log/myapp.log
        state: link

    - name: Set directory permissions recursively
      file:
        path: "{{ app_dir }}"
        mode: '0755'
        recurse: yes

    # COPY module - copy files from control node to hosts
    - name: Copy single file
      copy:
        src: /etc/hosts
        dest: "{{ app_dir }}/hosts.backup"
        mode: '0644'
        backup: yes

    - name: Copy with content inline
      copy:
        content: |
          # Application Configuration
          APP_NAME=MyApp
          APP_VERSION=1.0.0
          LOG_LEVEL=INFO
          DATABASE_URL=postgresql://localhost/myapp
        dest: "{{ config_dir }}/app.env"
        mode: '0600'

    - name: Copy directory recursively
      copy:
        src: /etc/nginx/
        dest: "{{ config_dir }}/nginx/"
        mode: '0644'
      when: false  # Set to true if nginx is installed

    # LINEINFILE module - modify file contents
    - name: Ensure line exists in file
      lineinfile:
        path: "{{ config_dir }}/app.env"
        line: "ENVIRONMENT=production"
        state: present
        create: yes

    - name: Replace or add line using regexp
      lineinfile:
        path: "{{ config_dir }}/app.env"
        regexp: '^LOG_LEVEL='
        line: 'LOG_LEVEL=DEBUG'
        backrefs: yes

    - name: Remove line from file
      lineinfile:
        path: "{{ config_dir }}/app.env"
        regexp: '^TEMP_VAR='
        state: absent

    # BLOCKINFILE module - insert/update block of lines
    - name: Add block of configuration
      blockinfile:
        path: "{{ config_dir }}/app.env"
        block: |
          # Database Configuration
          DB_HOST=localhost
          DB_PORT=5432
          DB_NAME=myapp
          DB_USER=appuser
        marker: "# {mark} ANSIBLE MANAGED BLOCK - DATABASE"
        create: yes

    # FETCH module - copy files from hosts to control node
    - name: Fetch config file from remote
      fetch:
        src: "{{ config_dir }}/app.env"
        dest: /tmp/fetched-configs/
        flat: no
EOF
```

### 3. Service Management Modules

```bash
cat > services-playbook.yml << 'EOF'
---
- name: Service Management Examples
  hosts: all
  become: yes

  tasks:
    # SERVICE module - manage services
    - name: Start and enable nginx
      service:
        name: nginx
        state: started
        enabled: yes
      when: ansible_os_family == "Debian"
      ignore_errors: yes

    - name: Restart nginx
      service:
        name: nginx
        state: restarted
      when: ansible_os_family == "Debian"
      ignore_errors: yes

    - name: Stop and disable service
      service:
        name: apache2
        state: stopped
        enabled: no
      when: ansible_os_family == "Debian"
      ignore_errors: yes

    # SYSTEMD module - systemd specific operations
    - name: Reload systemd daemon
      systemd:
        daemon_reload: yes

    - name: Enable and start with systemd
      systemd:
        name: nginx
        state: started
        enabled: yes
        daemon_reload: yes
      when: ansible_os_family == "Debian"
      ignore_errors: yes

    - name: Check service status
      systemd:
        name: nginx
      register: nginx_status
      ignore_errors: yes

    - name: Display service status
      debug:
        var: nginx_status
      when: nginx_status is defined
EOF
```

### 4. Command Execution Modules

```bash
cat > commands-playbook.yml << 'EOF'
---
- name: Command Execution Examples
  hosts: all
  become: yes

  tasks:
    # COMMAND module - simple commands (no shell features)
    - name: Run simple command
      command: whoami
      register: whoami_result

    - name: Display command result
      debug:
        var: whoami_result.stdout

    - name: Command with arguments
      command: ls -la /tmp
      register: ls_result

    - name: Run command in specific directory
      command: pwd
      args:
        chdir: /opt
      register: pwd_result

    - name: Command with creates (skip if file exists)
      command: touch /tmp/marker.txt
      args:
        creates: /tmp/marker.txt

    - name: Command with removes (skip if file doesn't exist)
      command: cat /tmp/marker.txt
      args:
        removes: /tmp/marker.txt

    # SHELL module - commands with shell features (pipes, redirects)
    - name: Run shell command with pipe
      shell: ps aux | grep nginx | wc -l
      register: nginx_processes

    - name: Shell with environment variables
      shell: echo $HOME
      environment:
        HOME: /custom/home

    - name: Complex shell command
      shell: |
        if [ -d /opt/myapp ]; then
          echo "Directory exists"
        else
          echo "Directory not found"
        fi
      register: check_dir

    - name: Shell with redirection
      shell: echo "Hello" > /tmp/hello.txt

    # SCRIPT module - run script from control node
    - name: Create a script
      copy:
        content: |
          #!/bin/bash
          echo "Running custom script"
          date
          hostname
          df -h
        dest: /tmp/custom-script.sh
        mode: '0755'

    - name: Execute script
      script: /tmp/custom-script.sh
      register: script_output

    - name: Display script output
      debug:
        var: script_output.stdout_lines

    # RAW module - run without python (useful for bootstrapping)
    - name: Raw command (no python required)
      raw: echo "This works without Python"
      register: raw_result
EOF
```

### 5. User and Group Management

```bash
cat > users-playbook.yml << 'EOF'
---
- name: User and Group Management
  hosts: all
  become: yes

  tasks:
    # GROUP module
    - name: Create group
      group:
        name: appgroup
        state: present
        gid: 2000

    - name: Create system group
      group:
        name: sysgroup
        system: yes
        state: present

    # USER module
    - name: Create user
      user:
        name: appuser
        comment: "Application User"
        uid: 2000
        group: appgroup
        groups: sudo,www-data
        append: yes
        shell: /bin/bash
        home: /home/appuser
        create_home: yes
        state: present

    - name: Create system user
      user:
        name: sysuser
        system: yes
        shell: /bin/false
        home: /opt/sysuser
        create_home: no
        state: present

    - name: Set user password
      user:
        name: appuser
        password: "{{ 'mypassword' | password_hash('sha512') }}"
        update_password: always

    - name: Add SSH key for user
      authorized_key:
        user: appuser
        state: present
        key: "{{ lookup('file', '~/.ssh/id_rsa.pub') }}"
      ignore_errors: yes

    - name: Remove user
      user:
        name: olduser
        state: absent
        remove: yes
      ignore_errors: yes

    - name: Lock user account
      user:
        name: appuser
        password_lock: yes
      when: false  # Set to true to lock

    - name: Set user expiry
      user:
        name: appuser
        expires: 1735689600  # Unix timestamp
      when: false
EOF
```

### 6. Archive Operations

```bash
cat > archive-playbook.yml << 'EOF'
---
- name: Archive Operations
  hosts: all
  become: yes

  vars:
    backup_dir: /opt/backups

  tasks:
    # ARCHIVE module - create archives
    - name: Create backup directory
      file:
        path: "{{ backup_dir }}"
        state: directory
        mode: '0755'

    - name: Create tar.gz archive
      archive:
        path:
          - /opt/myapp/config
          - /opt/myapp/data
        dest: "{{ backup_dir }}/myapp-backup-{{ ansible_date_time.date }}.tar.gz"
        format: gz
        mode: '0644'
      when: false  # Set to true if /opt/myapp exists

    - name: Create zip archive
      archive:
        path: /etc/nginx
        dest: "{{ backup_dir }}/nginx-config.zip"
        format: zip
        mode: '0644'
      when: false  # Set to true if nginx is installed

    # UNARCHIVE module - extract archives
    - name: Create test archive
      archive:
        path: /etc/hosts
        dest: /tmp/test.tar.gz
        format: gz

    - name: Extract archive
      unarchive:
        src: /tmp/test.tar.gz
        dest: /tmp/extracted
        remote_src: yes
        creates: /tmp/extracted

    - name: Download and extract from URL
      unarchive:
        src: https://github.com/prometheus/prometheus/releases/download/v2.30.3/prometheus-2.30.3.linux-amd64.tar.gz
        dest: /tmp
        remote_src: yes
        creates: /tmp/prometheus-2.30.3.linux-amd64
      when: false  # Set to true to actually download
EOF
```

## Verification Steps

### Run Each Playbook
```bash
# Test package management
sudo ansible-playbook -i inventory.ini packages-playbook.yml --tags=packages -v

# Test file operations
sudo ansible-playbook -i inventory.ini files-playbook.yml -v
cat /opt/myapp/config/app.env

# Test services
sudo ansible-playbook -i inventory.ini services-playbook.yml -v

# Test commands
ansible-playbook -i inventory.ini commands-playbook.yml -v

# Test user management
sudo ansible-playbook -i inventory.ini users-playbook.yml -v
id appuser
getent group appgroup

# Test archives
sudo ansible-playbook -i inventory.ini archive-playbook.yml -v
ls -la /opt/backups/
```

### Verify Results
```bash
# Check installed packages
dpkg -l | grep nginx
which git curl wget

# Check files
ls -la /opt/myapp/
cat /opt/myapp/config/app.env

# Check services
systemctl status nginx
systemctl is-enabled nginx

# Check users
id appuser
groups appuser

# Check archives
ls -la /opt/backups/
```

## Module Documentation

### Get Module Help
```bash
# List all modules
ansible-doc -l

# Get module documentation
ansible-doc apt
ansible-doc copy
ansible-doc service
ansible-doc user

# Get examples
ansible-doc -s copy
```

## Best Practices

1. **Use Appropriate Modules**: Prefer modules over shell/command
2. **Check Mode**: Always support check mode (`--check`)
3. **Idempotency**: Ensure modules can run multiple times safely
4. **Return Values**: Register and check return values
5. **Error Handling**: Use `failed_when`, `ignore_errors` appropriately
6. **State Parameter**: Always specify desired state explicitly

## Common Module Parameters

Most modules support these common parameters:
- `state`: desired state (present, absent, started, stopped, etc.)
- `mode`: file permissions
- `owner`: file owner
- `group`: file group
- `creates`: skip if file exists
- `removes`: skip if file doesn't exist

## Exercise Tasks

1. Create a playbook that:
   - Installs nginx, postgresql, and redis
   - Creates /var/www/myapp directory structure
   - Copies configuration files
   - Creates an appuser and appgroup
   - Starts and enables all services

2. Write a backup playbook that:
   - Archives /etc directory
   - Creates timestamped backups
   - Keeps only last 5 backups
   - Sends backup to remote location

## Next Steps

- Tutorial 03: Variables and Facts
- Tutorial 04: Jinja2 Templates
- Tutorial 05: Roles
