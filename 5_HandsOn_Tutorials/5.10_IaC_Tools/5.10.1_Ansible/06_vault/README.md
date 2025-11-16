# Ansible Vault

## Overview
Secure sensitive data in Ansible with Ansible Vault for encryption of passwords, keys, and secrets.

## Prerequisites
- Completed Tutorials 01-05
- Understanding of variables and playbooks

## Key Concepts

### Ansible Vault
- Encrypts files and variables
- Uses AES256 encryption
- Password or key file for decryption
- Can encrypt entire files or specific variables

## Hands-On Tutorial

### Setup
```bash
mkdir -p ansible-vault/{vars,files,group_vars,host_vars} && cd ansible-vault

cat > inventory.ini << 'EOF'
[production]
prod1 ansible_host=localhost ansible_connection=local

[staging]
stage1 ansible_host=localhost ansible_connection=local
EOF
```

### 1. Create and Encrypt Files

```bash
# Create a vault password file
echo "MyVaultPassword123" > .vault_pass
chmod 600 .vault_pass

# Create unencrypted secrets file
cat > vars/secrets.yml << 'EOF'
---
# Database credentials
db_password: "super_secret_password"
db_root_password: "root_secret_123"

# API keys
api_key: "sk-1234567890abcdef"
api_secret: "secret_api_key_xyz"

# SSL certificates (in production, use actual paths)
ssl_key_password: "ssl_password_123"

# Application secrets
jwt_secret: "jwt_secret_key_456"
encryption_key: "32-char-encryption-key-here!"
EOF

# Encrypt the file
ansible-vault encrypt vars/secrets.yml --vault-password-file .vault_pass

# View encrypted file
cat vars/secrets.yml

# View decrypted content
ansible-vault view vars/secrets.yml --vault-password-file .vault_pass

# Edit encrypted file
ansible-vault edit vars/secrets.yml --vault-password-file .vault_pass

# Decrypt file (for editing)
ansible-vault decrypt vars/secrets.yml --vault-password-file .vault_pass

# Re-encrypt
ansible-vault encrypt vars/secrets.yml --vault-password-file .vault_pass

# Change vault password
ansible-vault rekey vars/secrets.yml --vault-password-file .vault_pass --new-vault-password-file .vault_pass_new
```

### 2. Encrypt Specific Variables

```bash
# Create file with encrypted strings
cat > group_vars/production.yml << 'EOF'
---
# Regular variables
app_name: myapp
environment: production

# Encrypted variables (will encrypt below)
db_password: supersecret
api_key: secret_key_123
EOF

# Encrypt specific variable
ansible-vault encrypt_string 'supersecret' --name 'db_password' --vault-password-file .vault_pass

# Manual creation with encrypted string
cat > group_vars/production_encrypted.yml << 'EOF'
---
app_name: myapp
environment: production

db_password: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          # This will be generated when you run encrypt_string

api_key: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          # This will be generated when you run encrypt_string
EOF

# Better way: Create and encrypt inline
cat > create_encrypted_vars.sh << 'SCRIPT'
#!/bin/bash
VAULT_PASS_FILE=".vault_pass"

echo "---" > group_vars/production_secure.yml
echo "app_name: myapp" >> group_vars/production_secure.yml
echo "environment: production" >> group_vars/production_secure.yml
echo "" >> group_vars/production_secure.yml

echo "# Encrypted variables" >> group_vars/production_secure.yml
ansible-vault encrypt_string 'supersecret123' --name 'db_password' --vault-password-file "$VAULT_PASS_FILE" >> group_vars/production_secure.yml
ansible-vault encrypt_string 'api_key_xyz789' --name 'api_key' --vault-password-file "$VAULT_PASS_FILE" >> group_vars/production_secure.yml
ansible-vault encrypt_string 'jwt_secret_abc' --name 'jwt_secret' --vault-password-file "$VAULT_PASS_FILE" >> group_vars/production_secure.yml
SCRIPT

chmod +x create_encrypted_vars.sh
./create_encrypted_vars.sh
```

### 3. Using Encrypted Variables in Playbooks

```bash
# Re-create unencrypted secrets for demo
cat > vars/secrets.yml << 'EOF'
---
db_password: "super_secret_password"
db_root_password: "root_secret_123"
api_key: "sk-1234567890abcdef"
api_secret: "secret_api_key_xyz"
jwt_secret: "jwt_secret_key_456"
EOF

ansible-vault encrypt vars/secrets.yml --vault-password-file .vault_pass

cat > vault-demo.yml << 'EOF'
---
- name: Using Vault Encrypted Variables
  hosts: localhost
  connection: local

  vars_files:
    - vars/secrets.yml

  vars:
    db_host: localhost
    db_name: myapp
    db_user: dbuser

  tasks:
    - name: Display non-sensitive info
      debug:
        msg: "Connecting to {{ db_name }} at {{ db_host }}"

    - name: Show that password is available (but don't display it!)
      debug:
        msg: "Password is set: {{ 'Yes' if db_password is defined else 'No' }}"

    - name: Use encrypted variables
      copy:
        content: |
          [database]
          host={{ db_host }}
          port=5432
          database={{ db_name }}
          user={{ db_user }}
          password={{ db_password }}

          [api]
          key={{ api_key }}
          secret={{ api_secret }}

          [security]
          jwt_secret={{ jwt_secret }}
        dest: /tmp/app-config.conf
        mode: '0600'

    - name: Verify file was created
      stat:
        path: /tmp/app-config.conf
      register: config_file

    - name: Config file status
      debug:
        msg: "Config file created: {{ config_file.stat.exists }}"
EOF
```

### 4. Multiple Vault IDs

```bash
# Create different vault password files
echo "DevVaultPass123" > .vault_pass_dev
echo "ProdVaultPass456" > .vault_pass_prod
chmod 600 .vault_pass_*

# Create dev secrets
cat > vars/dev_secrets.yml << 'EOF'
---
db_password: "dev_password"
api_key: "dev_api_key"
EOF

# Create prod secrets
cat > vars/prod_secrets.yml << 'EOF'
---
db_password: "prod_password"
api_key: "prod_api_key"
EOF

# Encrypt with different vault IDs
ansible-vault encrypt vars/dev_secrets.yml --vault-id dev@.vault_pass_dev
ansible-vault encrypt vars/prod_secrets.yml --vault-id prod@.vault_pass_prod

# Playbook using multiple vault IDs
cat > multi-vault.yml << 'EOF'
---
- name: Multiple Vault IDs
  hosts: localhost
  connection: local

  vars_files:
    - "vars/{{ environment }}_secrets.yml"

  tasks:
    - name: Show environment
      debug:
        msg: "Running in {{ environment }} with password: {{ db_password }}"
EOF

# Run with specific vault ID
# ansible-playbook multi-vault.yml -e "environment=dev" --vault-id dev@.vault_pass_dev
# ansible-playbook multi-vault.yml -e "environment=prod" --vault-id prod@.vault_pass_prod
```

### 5. Vault in Role

```bash
# Create role with vault
ansible-galaxy init secure_app

cat > secure_app/defaults/main.yml << 'EOF'
---
app_name: secure_app
app_port: 8080
# Sensitive defaults should be in vault
EOF

cat > secure_app/vars/main.yml << 'EOF'
---
app_config_dir: /etc/{{ app_name }}
app_data_dir: /var/lib/{{ app_name }}
EOF

# Create encrypted vars for role
cat > secure_app/vars/vault.yml << 'EOF'
---
admin_password: "admin_secret"
database_url: "postgresql://user:pass@localhost/db"
secret_key: "secret_key_for_app"
EOF

ansible-vault encrypt secure_app/vars/vault.yml --vault-password-file .vault_pass

cat > secure_app/tasks/main.yml << 'EOF'
---
- name: Include vault variables
  include_vars: vault.yml
  no_log: true

- name: Create app config directory
  file:
    path: "{{ app_config_dir }}"
    state: directory
    mode: '0755'
  become: yes

- name: Generate secure config
  template:
    src: app-config.j2
    dest: "{{ app_config_dir }}/config.yml"
    mode: '0600'
  become: yes
  no_log: true

- name: Verify config created
  stat:
    path: "{{ app_config_dir }}/config.yml"
  register: app_config
  become: yes

- name: Config status
  debug:
    msg: "Config created: {{ app_config.stat.exists }}"
EOF

mkdir -p secure_app/templates
cat > secure_app/templates/app-config.j2 << 'EOF'
# Secure Application Configuration
app_name: {{ app_name }}
app_port: {{ app_port }}

# Sensitive configuration
admin_password: {{ admin_password }}
database_url: {{ database_url }}
secret_key: {{ secret_key }}
EOF

cat > use-secure-role.yml << 'EOF'
---
- name: Use Secure Role
  hosts: localhost
  connection: local

  roles:
    - secure_app
EOF
```

### 6. Best Practices Example

```bash
cat > best-practices.yml << 'EOF'
---
- name: Vault Best Practices
  hosts: all
  become: yes

  vars_files:
    - vars/common.yml
    - vars/secrets.yml  # Encrypted

  vars:
    # Never log sensitive data
    no_log_items:
      - password
      - secret
      - key
      - token

  tasks:
    - name: Task with sensitive data
      user:
        name: dbuser
        password: "{{ db_password | password_hash('sha512') }}"
      no_log: true  # Don't log this task

    - name: Set fact with sensitive data
      set_fact:
        db_conn_string: "postgresql://{{ db_user }}:{{ db_password }}@{{ db_host }}/{{ db_name }}"
      no_log: true

    - name: Use sensitive data in template
      template:
        src: templates/database.conf.j2
        dest: /etc/myapp/database.conf
        mode: '0600'
        owner: root
        group: root
      no_log: true

    - name: API call with secret (don't log)
      uri:
        url: "https://api.example.com/endpoint"
        method: POST
        headers:
          Authorization: "Bearer {{ api_key }}"
        body_format: json
        body:
          data: "some data"
      no_log: true
      when: false  # Set to true for actual use

    - name: Debug without exposing secrets
      debug:
        msg: "API key is {{ 'set' if api_key is defined else 'not set' }}"
EOF
```

### 7. Automation Scripts

```bash
cat > vault-helpers.sh << 'BASH'
#!/bin/bash

VAULT_PASS_FILE=".vault_pass"

# Encrypt a new file
encrypt_file() {
    local file=$1
    ansible-vault encrypt "$file" --vault-password-file "$VAULT_PASS_FILE"
}

# Decrypt a file
decrypt_file() {
    local file=$1
    ansible-vault decrypt "$file" --vault-password-file "$VAULT_PASS_FILE"
}

# View encrypted file
view_file() {
    local file=$1
    ansible-vault view "$file" --vault-password-file "$VAULT_PASS_FILE"
}

# Edit encrypted file
edit_file() {
    local file=$1
    ansible-vault edit "$file" --vault-password-file "$VAULT_PASS_FILE"
}

# Create encrypted string
create_encrypted_string() {
    local var_name=$1
    local var_value=$2
    ansible-vault encrypt_string "$var_value" --name "$var_name" --vault-password-file "$VAULT_PASS_FILE"
}

# Main
case "$1" in
    encrypt)
        encrypt_file "$2"
        ;;
    decrypt)
        decrypt_file "$2"
        ;;
    view)
        view_file "$2"
        ;;
    edit)
        edit_file "$2"
        ;;
    string)
        create_encrypted_string "$2" "$3"
        ;;
    *)
        echo "Usage: $0 {encrypt|decrypt|view|edit|string} <file|name value>"
        exit 1
esac
BASH

chmod +x vault-helpers.sh
```

## Verification Steps

```bash
# Run playbook with vault
ansible-playbook vault-demo.yml --vault-password-file .vault_pass

# Run with prompt for password
ansible-playbook vault-demo.yml --ask-vault-pass

# Run with multiple vault IDs
ansible-playbook multi-vault.yml -e "environment=dev" --vault-id dev@.vault_pass_dev

# Run role with vault
ansible-playbook use-secure-role.yml --vault-password-file .vault_pass

# Verify encrypted files
cat vars/secrets.yml
ansible-vault view vars/secrets.yml --vault-password-file .vault_pass

# Check config was created
sudo cat /etc/secure_app/config.yml
```

## Configuration

```bash
# Add to ansible.cfg
cat > ansible.cfg << 'EOF'
[defaults]
vault_password_file = .vault_pass
# vault_identity_list = dev@.vault_pass_dev, prod@.vault_pass_prod

[privilege_escalation]
become = True
EOF
```

## Security Best Practices

1. **Never Commit Passwords**
   - Add `.vault_pass` to `.gitignore`
   - Use environment variables or secret managers in CI/CD

2. **Use `no_log`**
   - Always use `no_log: true` for sensitive tasks
   - Prevents secrets in logs

3. **Minimal Decryption**
   - Only decrypt when needed
   - Use specific vault IDs for different environments

4. **Rotate Secrets**
   - Regularly change vault passwords
   - Use `rekey` to update encryption

5. **File Permissions**
   - Vault password files: 0600
   - Config files with secrets: 0600 or more restrictive

6. **Audit Access**
   - Track who has vault passwords
   - Use different passwords for different environments

## Common Commands Reference

```bash
# Create encrypted file
ansible-vault create secrets.yml

# Encrypt existing file
ansible-vault encrypt secrets.yml

# Decrypt file
ansible-vault decrypt secrets.yml

# View encrypted file
ansible-vault view secrets.yml

# Edit encrypted file
ansible-vault edit secrets.yml

# Change vault password
ansible-vault rekey secrets.yml

# Encrypt string
ansible-vault encrypt_string 'secret_value' --name 'variable_name'

# Run playbook with vault
ansible-playbook playbook.yml --ask-vault-pass
ansible-playbook playbook.yml --vault-password-file .vault_pass
ansible-playbook playbook.yml --vault-id label@vault_file
```

## Exercise Tasks

1. Create encrypted variable files for dev, staging, and production
2. Build a playbook that:
   - Uses encrypted database credentials
   - Creates users with encrypted passwords
   - Generates config files with API keys
   - Uses `no_log` appropriately
3. Set up multiple vault IDs for different environments
4. Create a role that securely manages secrets

## Next Steps

- Tutorial 07: Dynamic Inventory
- Tutorial 08: Production Playbooks
