# Production-Ready Ansible Playbooks

## Overview
Learn production best practices for creating robust, maintainable, and secure Ansible playbooks.

## Prerequisites
- Completed Tutorials 01-07
- Understanding of all previous concepts
- Production environment experience

## Production Principles

1. **Idempotency**: Safe to run multiple times
2. **Error Handling**: Graceful failure recovery
3. **Security**: Vault, no_log, least privilege
4. **Testing**: Validation and dry-runs
5. **Documentation**: Clear, comprehensive docs
6. **Monitoring**: Logging and alerting
7. **Rollback**: Ability to revert changes

## Hands-On Tutorial

### Setup
```bash
mkdir -p production-ansible/{roles,group_vars,host_vars,files,templates,tasks,handlers} && cd production-ansible

cat > inventory/production.ini << 'EOF'
[loadbalancers]
lb1 ansible_host=10.0.1.10
lb2 ansible_host=10.0.1.11

[webservers]
web1 ansible_host=10.0.2.10
web2 ansible_host=10.0.2.11
web3 ansible_host=10.0.2.12

[appservers]
app1 ansible_host=10.0.3.10
app2 ansible_host=10.0.3.11

[databases]
db1 ansible_host=10.0.4.10 db_role=primary
db2 ansible_host=10.0.4.11 db_role=replica

[cache]
cache1 ansible_host=10.0.5.10

[monitoring]
monitor1 ansible_host=10.0.6.10

[production:children]
loadbalancers
webservers
appservers
databases
cache
monitoring

[production:vars]
environment=production
domain=example.com
ansible_user=deploy
ansible_become=yes
EOF
```

### 1. Production ansible.cfg

```bash
cat > ansible.cfg << 'EOF'
[defaults]
# Inventory
inventory = ./inventory/production.ini

# Connection
host_key_checking = False
timeout = 30
forks = 10

# Performance
gathering = smart
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_facts_cache
fact_caching_timeout = 86400
pipelining = True

# Logging
log_path = ./logs/ansible.log
display_skipped_hosts = False
display_ok_hosts = True

# Vault
vault_password_file = ./.vault_pass

# Callbacks
callbacks_enabled = profile_tasks, timer
stdout_callback = yaml

# Retry
retry_files_enabled = True
retry_files_save_path = ./logs/retry

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False

[ssh_connection]
ssh_args = -o ControlMaster=auto -o ControlPersist=60s -o StrictHostKeyChecking=no
pipelining = True
control_path = /tmp/ansible-ssh-%%h-%%p-%%r

[colors]
highlight = white
verbose = blue
warn = bright purple
error = red
debug = dark gray
EOF
```

### 2. Production Deployment Playbook

```bash
cat > deploy-app.yml << 'EOF'
---
- name: Pre-deployment Checks
  hosts: all
  gather_facts: yes
  tags: [always, preflight]

  tasks:
    - name: Verify minimum Ansible version
      assert:
        that:
          - ansible_version.full is version('2.9', '>=')
        fail_msg: "Ansible version must be 2.9 or higher"
      run_once: yes
      delegate_to: localhost

    - name: Check required variables are defined
      assert:
        that:
          - app_version is defined
          - environment is defined
        fail_msg: "Required variables not defined"
      run_once: yes

    - name: Verify disk space
      assert:
        that:
          - ansible_mounts | selectattr('mount', 'equalto', '/') | map(attribute='size_available') | first > 10737418240
        fail_msg: "Insufficient disk space (< 10GB available)"

    - name: Check connectivity to all hosts
      ping:

    - name: Verify required packages are installed
      package_facts:
        manager: auto

    - name: Create deployment log
      copy:
        content: |
          Deployment Started
          Date: {{ ansible_date_time.iso8601 }}
          Version: {{ app_version }}
          Environment: {{ environment }}
          User: {{ ansible_user }}
        dest: /tmp/deployment-{{ ansible_date_time.epoch }}.log
      delegate_to: localhost
      run_once: yes

- name: Maintenance Mode
  hosts: loadbalancers
  serial: 1
  tags: [maintenance]

  tasks:
    - name: Enable maintenance mode
      copy:
        content: |
          server {
              listen 80 default_server;
              root /var/www/maintenance;
              index index.html;
          }
        dest: /etc/nginx/sites-enabled/maintenance
      notify: reload nginx

    - name: Wait for maintenance page to be active
      wait_for:
        port: 80
        timeout: 30

  handlers:
    - name: reload nginx
      service:
        name: nginx
        state: reloaded

- name: Backup Current Version
  hosts: appservers
  serial: 1
  tags: [backup]

  vars:
    backup_dir: /opt/backups
    app_dir: /opt/myapp

  tasks:
    - name: Create backup directory
      file:
        path: "{{ backup_dir }}/{{ ansible_date_time.date }}"
        state: directory
        mode: '0755'

    - name: Backup current application
      archive:
        path: "{{ app_dir }}"
        dest: "{{ backup_dir }}/{{ ansible_date_time.date }}/app-{{ ansible_date_time.epoch }}.tar.gz"
        format: gz
      when: app_dir is directory
      register: backup_result

    - name: Save backup metadata
      copy:
        content: |
          Backup Date: {{ ansible_date_time.iso8601 }}
          Server: {{ inventory_hostname }}
          Path: {{ backup_result.dest | default('N/A') }}
          Version: {{ current_version | default('unknown') }}
        dest: "{{ backup_dir }}/{{ ansible_date_time.date }}/backup-meta.txt"
      when: backup_result is succeeded

    - name: Cleanup old backups (keep last 5)
      shell: |
        cd {{ backup_dir }}
        ls -t | tail -n +6 | xargs -r rm -rf
      args:
        executable: /bin/bash

- name: Deploy Application
  hosts: appservers
  serial: "{{ serial | default('50%') }}"
  tags: [deploy]

  vars:
    app_name: myapp
    app_dir: /opt/{{ app_name }}
    app_user: appuser
    systemd_service: "{{ app_name }}.service"

  tasks:
    - name: Stop application
      systemd:
        name: "{{ systemd_service }}"
        state: stopped
      ignore_errors: yes

    - name: Create application directory
      file:
        path: "{{ app_dir }}"
        state: directory
        owner: "{{ app_user }}"
        mode: '0755'

    - name: Deploy application files
      synchronize:
        src: "files/app/"
        dest: "{{ app_dir }}/"
        delete: yes
        recursive: yes
      become: yes
      become_user: "{{ app_user }}"

    - name: Install dependencies
      pip:
        requirements: "{{ app_dir }}/requirements.txt"
        virtualenv: "{{ app_dir }}/venv"
        virtualenv_command: python3 -m venv
      become: yes
      become_user: "{{ app_user }}"
      when: false  # Enable if using Python

    - name: Update configuration
      template:
        src: templates/app-config.j2
        dest: "{{ app_dir }}/config/production.yml"
        owner: "{{ app_user }}"
        mode: '0640'
      no_log: true

    - name: Run database migrations
      command: "{{ app_dir }}/venv/bin/python manage.py migrate"
      args:
        chdir: "{{ app_dir }}"
      become: yes
      become_user: "{{ app_user }}"
      when: inventory_hostname == groups['appservers'][0]
      register: migration_result
      failed_when:
        - migration_result.rc != 0
        - "'No migrations to apply' not in migration_result.stdout"

    - name: Start application
      systemd:
        name: "{{ systemd_service }}"
        state: started
        enabled: yes
      register: service_start

    - name: Wait for application to start
      wait_for:
        port: 8080
        host: "{{ ansible_host }}"
        timeout: 60
        delay: 5

    - name: Health check
      uri:
        url: "http://{{ ansible_host }}:8080/health"
        status_code: 200
        timeout: 10
      retries: 5
      delay: 10
      register: health_check
      until: health_check is succeeded

- name: Update Load Balancers
  hosts: loadbalancers
  serial: 1
  tags: [loadbalancer]

  tasks:
    - name: Update backend servers list
      template:
        src: templates/nginx-backends.j2
        dest: /etc/nginx/conf.d/backends.conf
      notify: reload nginx

    - name: Disable maintenance mode
      file:
        path: /etc/nginx/sites-enabled/maintenance
        state: absent
      notify: reload nginx

  handlers:
    - name: reload nginx
      service:
        name: nginx
        state: reloaded

- name: Post-deployment Validation
  hosts: loadbalancers
  tags: [validation]

  tasks:
    - name: Test application through load balancer
      uri:
        url: "http://{{ ansible_host }}/health"
        status_code: 200
      register: lb_health_check

    - name: Run smoke tests
      uri:
        url: "http://{{ ansible_host }}/{{ item }}"
        status_code: 200
      loop:
        - api/v1/status
        - api/v1/version
      when: false  # Enable based on your API

    - name: Verify all backend servers are healthy
      uri:
        url: "http://{{ item }}:8080/health"
        status_code: 200
      loop: "{{ groups['appservers'] }}"
      delegate_to: localhost

- name: Deployment Report
  hosts: localhost
  connection: local
  tags: [always, report]

  tasks:
    - name: Generate deployment report
      copy:
        content: |
          ====================================
          DEPLOYMENT REPORT
          ====================================
          Date: {{ ansible_date_time.iso8601 }}
          Version: {{ app_version }}
          Environment: {{ environment }}

          Deployed to:
          {% for host in groups['appservers'] %}
          - {{ host }}
          {% endfor %}

          Status: SUCCESS
          ====================================
        dest: /tmp/deployment-report-{{ ansible_date_time.epoch }}.txt

    - name: Send notification (Slack/Email)
      debug:
        msg: "Deployment completed successfully"

    - name: Update deployment tracking
      lineinfile:
        path: /tmp/deployment-history.log
        line: "{{ ansible_date_time.iso8601 }} | {{ app_version }} | {{ environment }} | SUCCESS"
        create: yes
EOF
```

### 3. Error Handling and Rollback

```bash
cat > deploy-with-rollback.yml << 'EOF'
---
- name: Deploy with Automatic Rollback
  hosts: appservers
  serial: 1
  tags: [deploy]

  vars:
    app_dir: /opt/myapp
    backup_dir: /opt/backups
    max_failures: 1

  tasks:
    - name: Create rollback point
      block:
        - name: Save current version
          command: cat {{ app_dir }}/VERSION
          register: current_version
          ignore_errors: yes
          changed_when: false

        - name: Set rollback version
          set_fact:
            rollback_version: "{{ current_version.stdout | default('unknown') }}"
            cacheable: yes

    - name: Deploy new version
      block:
        - name: Stop application
          systemd:
            name: myapp
            state: stopped

        - name: Deploy new files
          copy:
            src: "files/app-{{ app_version }}/"
            dest: "{{ app_dir }}/"
          register: deploy_files

        - name: Update version file
          copy:
            content: "{{ app_version }}"
            dest: "{{ app_dir }}/VERSION"

        - name: Start application
          systemd:
            name: myapp
            state: started

        - name: Verify deployment
          uri:
            url: "http://{{ ansible_host }}:8080/health"
            status_code: 200
          retries: 3
          delay: 5

      rescue:
        - name: Deployment failed, initiating rollback
          debug:
            msg: "Deployment failed on {{ inventory_hostname }}, rolling back..."

        - name: Stop failed version
          systemd:
            name: myapp
            state: stopped
          ignore_errors: yes

        - name: Restore from backup
          unarchive:
            src: "{{ backup_dir }}/latest/app.tar.gz"
            dest: "{{ app_dir }}"
            remote_src: yes

        - name: Restore version file
          copy:
            content: "{{ rollback_version }}"
            dest: "{{ app_dir }}/VERSION"

        - name: Start previous version
          systemd:
            name: myapp
            state: started

        - name: Verify rollback
          uri:
            url: "http://{{ ansible_host }}:8080/health"
            status_code: 200
          retries: 3
          delay: 5

        - name: Fail the play
          fail:
            msg: "Deployment failed and rolled back to {{ rollback_version }}"

      always:
        - name: Log deployment attempt
          lineinfile:
            path: /var/log/deployments.log
            line: "{{ ansible_date_time.iso8601 }} | {{ inventory_hostname }} | {{ app_version }} | {{ 'SUCCESS' if deploy_files is succeeded else 'FAILED' }}"
            create: yes
          delegate_to: localhost
EOF
```

### 4. Monitoring and Validation

```bash
cat > tasks/validation.yml << 'EOF'
---
- name: System validation tasks
  block:
    - name: Check system load
      shell: uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ','
      register: load_avg
      changed_when: false

    - name: Verify load is acceptable
      assert:
        that:
          - load_avg.stdout | float < 10.0
        fail_msg: "System load too high: {{ load_avg.stdout }}"

    - name: Check memory usage
      shell: free | grep Mem | awk '{print ($3/$2) * 100.0}'
      register: mem_usage
      changed_when: false

    - name: Verify memory usage
      assert:
        that:
          - mem_usage.stdout | float < 90.0
        fail_msg: "Memory usage too high: {{ mem_usage.stdout }}%"

    - name: Check disk usage
      shell: df -h / | tail -1 | awk '{print $5}' | tr -d '%'
      register: disk_usage
      changed_when: false

    - name: Verify disk space
      assert:
        that:
          - disk_usage.stdout | int < 85
        fail_msg: "Disk usage too high: {{ disk_usage.stdout }}%"

    - name: Check critical services
      systemd:
        name: "{{ item }}"
        state: started
      register: service_status
      failed_when: service_status is failed
      loop:
        - nginx
        - myapp
      when: false  # Enable for actual services
EOF
```

### 5. Security Hardening Playbook

```bash
cat > security-hardening.yml << 'EOF'
---
- name: Security Hardening
  hosts: all
  become: yes
  tags: [security]

  tasks:
    - name: Ensure system packages are updated
      apt:
        upgrade: dist
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"

    - name: Install security packages
      package:
        name:
          - fail2ban
          - ufw
          - aide
          - auditd
        state: present

    - name: Configure UFW firewall
      ufw:
        rule: "{{ item.rule }}"
        port: "{{ item.port }}"
        proto: "{{ item.proto | default('tcp') }}"
      loop:
        - { rule: 'allow', port: '22' }
        - { rule: 'allow', port: '80' }
        - { rule: 'allow', port: '443' }

    - name: Enable UFW
      ufw:
        state: enabled
        policy: deny

    - name: Configure fail2ban
      template:
        src: templates/jail.local.j2
        dest: /etc/fail2ban/jail.local
      notify: restart fail2ban

    - name: Disable root login
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: '^PermitRootLogin'
        line: 'PermitRootLogin no'
      notify: restart sshd

    - name: Disable password authentication
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: '^PasswordAuthentication'
        line: 'PasswordAuthentication no'
      notify: restart sshd

    - name: Set password policies
      lineinfile:
        path: /etc/security/pwquality.conf
        regexp: "{{ item.regexp }}"
        line: "{{ item.line }}"
      loop:
        - { regexp: '^minlen', line: 'minlen = 12' }
        - { regexp: '^dcredit', line: 'dcredit = -1' }
        - { regexp: '^ucredit', line: 'ucredit = -1' }
        - { regexp: '^lcredit', line: 'lcredit = -1' }

  handlers:
    - name: restart fail2ban
      service:
        name: fail2ban
        state: restarted

    - name: restart sshd
      service:
        name: sshd
        state: restarted
EOF
```

### 6. Blue-Green Deployment

```bash
cat > blue-green-deploy.yml << 'EOF'
---
- name: Blue-Green Deployment
  hosts: loadbalancers
  become: yes

  vars:
    blue_servers: "{{ groups['webservers'][:groups['webservers']|length//2] }}"
    green_servers: "{{ groups['webservers'][groups['webservers']|length//2:] }}"
    active_color: blue  # or green

  tasks:
    - name: Determine inactive environment
      set_fact:
        inactive_color: "{{ 'green' if active_color == 'blue' else 'blue' }}"
        inactive_servers: "{{ green_servers if active_color == 'blue' else blue_servers }}"

    - name: Deploy to inactive environment
      include_tasks: tasks/deploy-app.yml
      vars:
        target_servers: "{{ inactive_servers }}"

    - name: Test inactive environment
      uri:
        url: "http://{{ item }}:8080/health"
        status_code: 200
      loop: "{{ inactive_servers }}"

    - name: Switch traffic to new environment
      template:
        src: templates/nginx-{{ inactive_color }}.j2
        dest: /etc/nginx/sites-enabled/default
      notify: reload nginx

    - name: Verify traffic switch
      wait_for:
        timeout: 30

    - name: Monitor error rates
      debug:
        msg: "Monitor application metrics for {{ monitoring_period | default(300) }} seconds"

    - name: Update active color
      set_fact:
        active_color: "{{ inactive_color }}"

  handlers:
    - name: reload nginx
      service:
        name: nginx
        state: reloaded
EOF
```

### 7. Compliance and Audit

```bash
cat > compliance-check.yml << 'EOF'
---
- name: Compliance Audit
  hosts: all
  gather_facts: yes

  tasks:
    - name: Check for required packages
      package_facts:
        manager: auto

    - name: Verify security packages installed
      assert:
        that:
          - "'fail2ban' in ansible_facts.packages"
          - "'ufw' in ansible_facts.packages"
        fail_msg: "Required security packages not installed"

    - name: Check file permissions
      stat:
        path: "{{ item }}"
      register: file_perms
      failed_when: file_perms.stat.mode != '0600'
      loop:
        - /etc/ssl/private/server.key
      when: false  # Enable for actual checks

    - name: Verify no default passwords
      command: grep -E "admin|password|changeme" /etc/shadow
      register: default_pass
      failed_when: default_pass.rc == 0
      changed_when: false
      ignore_errors: yes

    - name: Generate compliance report
      template:
        src: templates/compliance-report.j2
        dest: /tmp/compliance-{{ inventory_hostname }}.txt
      delegate_to: localhost
EOF
```

## Best Practices Summary

1. **Use Check Mode**: Always test with `--check` first
2. **Serial Execution**: Deploy incrementally
3. **Health Checks**: Verify after each step
4. **Backups**: Always backup before changes
5. **Rollback Plan**: Automated rollback on failure
6. **Notifications**: Alert team of deployments
7. **Audit Trail**: Log all changes
8. **Version Control**: Track all playbook changes
9. **Testing**: Test in staging first
10. **Documentation**: Keep playbooks documented

## Running Production Playbooks

```bash
# Pre-flight check
ansible-playbook deploy-app.yml --check --diff -e "app_version=2.0.0"

# Dry run
ansible-playbook deploy-app.yml --check -e "app_version=2.0.0"

# Deploy to one host first
ansible-playbook deploy-app.yml --limit web1 -e "app_version=2.0.0"

# Deploy to all (canary - 1 at a time)
ansible-playbook deploy-app.yml -e "app_version=2.0.0 serial=1"

# Deploy with 50% concurrency
ansible-playbook deploy-app.yml -e "app_version=2.0.0 serial=50%"

# Full deployment
ansible-playbook deploy-app.yml -e "app_version=2.0.0"

# With rollback capability
ansible-playbook deploy-with-rollback.yml -e "app_version=2.0.0"
```

## Exercise Tasks

1. Create a complete production deployment playbook with:
   - Pre-flight checks
   - Backup and rollback capability
   - Health checks and validation
   - Error handling
   - Deployment notifications

2. Implement blue-green deployment
3. Build compliance checking playbook
4. Create automated rollback mechanism

## Production Checklist

- [ ] All variables in vault
- [ ] Error handling implemented
- [ ] Rollback plan tested
- [ ] Health checks configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy in place
- [ ] Documentation complete
- [ ] Tested in staging
- [ ] Team notified
- [ ] Rollback tested

## Resources

- [Ansible Best Practices](https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html)
- [Production Patterns](https://www.ansible.com/blog/ansible-performance-tuning)
- [Security Hardening](https://docs.ansible.com/ansible/latest/tips_tricks/ansible_tips_tricks.html)
