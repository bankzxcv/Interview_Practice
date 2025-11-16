# Security Tutorial 01: Basic Users and Roles (Linux)

## 🎯 Learning Objectives

- Understand Linux user and group management
- Configure sudo access with different permission levels
- Implement the principle of least privilege
- Create service accounts for applications
- Manage password policies and user permissions
- Audit user access and activities

## 📋 Prerequisites

- Linux machine (Ubuntu/Debian recommended)
- Root or sudo access
- Basic understanding of Linux commands

## 📝 What We're Building

```
Linux System
├── Regular Users
│   ├── developer (sudo access to specific commands)
│   ├── operator (limited sudo for services)
│   └── auditor (read-only access)
├── Service Accounts
│   ├── webapp (for web application)
│   └── dbuser (for database access)
└── Groups
    ├── developers
    ├── operators
    └── auditors
```

## 🔍 Concepts Introduced

1. **User Management**: Creating and managing system users
2. **Group Management**: Organizing users with groups
3. **sudo Configuration**: Granular permission control
4. **Service Accounts**: Non-human users for applications
5. **Password Policies**: Enforcing security standards
6. **File Permissions**: Controlling access to resources

## 📁 Step-by-Step Implementation

### Step 1: Create User Groups

```bash
# Create groups for different roles
sudo groupadd developers
sudo groupadd operators
sudo groupadd auditors

# Verify groups created
cat /etc/group | grep -E 'developers|operators|auditors'
```

**Expected Output**:
```
developers:x:1001:
operators:x:1002:
auditors:x:1003:
```

### Step 2: Create Regular Users

Create `create-users.sh`:

```bash
#!/bin/bash
# create-users.sh - Create users with appropriate groups

set -e

# Create developer user
sudo useradd -m -s /bin/bash -G developers -c "Developer User" developer
echo "developer:dev_password123" | sudo chpasswd

# Create operator user
sudo useradd -m -s /bin/bash -G operators -c "Operator User" operator
echo "operator:op_password123" | sudo chpasswd

# Create auditor user (read-only)
sudo useradd -m -s /bin/bash -G auditors -c "Auditor User" auditor
echo "auditor:audit_password123" | sudo chpasswd

echo "✅ Users created successfully"
```

**Explanation**:
- `-m`: Create home directory
- `-s /bin/bash`: Set default shell
- `-G`: Add user to supplementary group
- `-c`: Comment/description for the user
- `chpasswd`: Set password (change these in production!)

Run the script:

```bash
chmod +x create-users.sh
sudo ./create-users.sh
```

### Step 3: Create Service Accounts

```bash
# Create service account for web application (no login)
sudo useradd -r -s /bin/false -c "Web Application Service Account" webapp

# Create service account for database
sudo useradd -r -s /bin/false -c "Database Service Account" dbuser

# Verify service accounts
grep -E 'webapp|dbuser' /etc/passwd
```

**Explanation**:
- `-r`: Create system account (UID < 1000)
- `-s /bin/false`: No shell login (security best practice)
- Service accounts should never have interactive login

### Step 4: Configure sudo Access

Create `/etc/sudoers.d/custom-permissions`:

```bash
sudo visudo -f /etc/sudoers.d/custom-permissions
```

Add these configurations:

```sudoers
# /etc/sudoers.d/custom-permissions
# Developers can run all commands with password
%developers ALL=(ALL:ALL) ALL

# Operators can manage services without password
%operators ALL=(ALL) NOPASSWD: /bin/systemctl restart *, /bin/systemctl start *, /bin/systemctl stop *, /bin/systemctl status *

# Operators can view logs
%operators ALL=(ALL) NOPASSWD: /usr/bin/journalctl, /usr/bin/tail /var/log/*

# Auditors can only read logs (no sudo needed, just group permissions)
# We'll handle this with file permissions

# Specific developer commands
developer ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/kubectl

# Operator can't run dangerous commands
Cmnd_Alias DANGEROUS = /bin/rm -rf /, /sbin/reboot, /sbin/shutdown
%operators ALL=(ALL) !DANGEROUS
```

**Explanation**:
- `%groupname`: Applies to all users in group
- `ALL=(ALL:ALL)`: Can run as any user/group
- `NOPASSWD`: No password required
- `!DANGEROUS`: Explicitly deny commands
- `Cmnd_Alias`: Create command groups

### Step 5: Set Up File Permissions for Auditors

```bash
# Create a logs directory with appropriate permissions
sudo mkdir -p /var/log/app

# Set group ownership to auditors
sudo chgrp auditors /var/log/app

# Set permissions: owner rwx, group rx, others none
sudo chmod 750 /var/log/app

# Create sample log file
echo "Sample log entry" | sudo tee /var/log/app/application.log

# Set group ownership and permissions
sudo chgrp auditors /var/log/app/application.log
sudo chmod 640 /var/log/app/application.log
```

### Step 6: Configure Password Policies

Edit `/etc/login.defs`:

```bash
sudo nano /etc/login.defs
```

Update these settings:

```conf
# Password aging controls
PASS_MAX_DAYS   90      # Password expires after 90 days
PASS_MIN_DAYS   1       # Minimum 1 day between password changes
PASS_MIN_LEN    12      # Minimum password length
PASS_WARN_AGE   7       # Warn 7 days before expiration

# Additional security
FAILLOG_ENAB    yes     # Enable failed login logging
LOG_OK_LOGINS   yes     # Log successful logins
```

Install and configure password quality checker:

```bash
# Install password quality checker
sudo apt-get install -y libpam-pwquality

# Configure password complexity
sudo nano /etc/security/pwquality.conf
```

Add/update:

```conf
# /etc/security/pwquality.conf
minlen = 12              # Minimum length
minclass = 3             # At least 3 character classes
maxrepeat = 2            # Max 2 repeated characters
dcredit = -1             # At least 1 digit
ucredit = -1             # At least 1 uppercase
lcredit = -1             # At least 1 lowercase
ocredit = -1             # At least 1 special character
```

### Step 7: Create Application Directory Structure

```bash
# Create directory for web application
sudo mkdir -p /opt/webapp/{config,data,logs}

# Set ownership to webapp service account
sudo chown -R webapp:webapp /opt/webapp

# Set appropriate permissions
sudo chmod 750 /opt/webapp
sudo chmod 700 /opt/webapp/config    # Strict for configs
sudo chmod 755 /opt/webapp/data      # Readable by others
sudo chmod 770 /opt/webapp/logs      # Writable by group

# Allow developers group to read
sudo chgrp -R developers /opt/webapp/logs
```

## ✅ Verification

### 1. Verify Users and Groups

```bash
# List all created users
grep -E 'developer|operator|auditor|webapp|dbuser' /etc/passwd

# Check user's groups
groups developer
groups operator
groups auditor

# Verify sudo access
sudo -l -U developer
sudo -l -U operator
```

**Expected Output for developer**:
```
User developer may run the following commands on this host:
    (ALL : ALL) ALL
    (ALL) NOPASSWD: /usr/bin/docker, /usr/bin/kubectl
```

### 2. Test sudo Permissions

```bash
# Test as developer (should work)
sudo -u developer sudo ls /root

# Test as operator (should work for systemctl)
sudo -u operator sudo systemctl status ssh

# Test as operator without password
sudo -u operator sudo journalctl -n 10

# Test as auditor (should fail - no sudo access)
sudo -u auditor sudo ls /root
```

### 3. Test File Permissions

```bash
# As auditor, should be able to read logs
sudo -u auditor cat /var/log/app/application.log

# As auditor, should NOT be able to write
sudo -u auditor bash -c 'echo "test" >> /var/log/app/application.log' 2>&1

# As webapp, should be able to write to its directory
sudo -u webapp touch /opt/webapp/data/test.txt
ls -l /opt/webapp/data/test.txt
```

### 4. Verify Service Account Restrictions

```bash
# Service accounts should not be able to login
sudo -u webapp -s  # Should fail

# Verify no shell
grep webapp /etc/passwd | grep "/bin/false"
```

## 🧪 Exploration Commands

### User Management Commands

```bash
# List all users
cat /etc/passwd

# List all groups
cat /etc/group

# Show user information
id developer
finger developer

# Show user's login history
last developer

# Show failed login attempts
sudo lastb

# Lock a user account
sudo usermod -L developer

# Unlock a user account
sudo usermod -U developer

# Set account expiration
sudo chage -E 2024-12-31 developer

# View password aging info
sudo chage -l developer
```

### Permission Management

```bash
# Find all files owned by webapp
sudo find / -user webapp 2>/dev/null

# Find all files owned by developers group
sudo find / -group developers 2>/dev/null

# Find files with SUID bit (security audit)
sudo find / -perm -4000 2>/dev/null

# Find files with SGID bit
sudo find / -perm -2000 2>/dev/null

# Find world-writable files
sudo find / -perm -002 2>/dev/null
```

### Audit Commands

```bash
# View sudo usage logs
sudo grep sudo /var/log/auth.log

# View user login history
sudo grep "Accepted" /var/log/auth.log

# View failed login attempts
sudo grep "Failed password" /var/log/auth.log

# Show currently logged in users
who
w

# Show last logins
lastlog
```

## 🧹 Cleanup

```bash
# Delete users (be careful!)
sudo userdel -r developer  # -r removes home directory
sudo userdel -r operator
sudo userdel -r auditor
sudo userdel webapp
sudo userdel dbuser

# Delete groups
sudo groupdel developers
sudo groupdel operators
sudo groupdel auditors

# Remove sudo configuration
sudo rm /etc/sudoers.d/custom-permissions

# Remove application directory
sudo rm -rf /opt/webapp
sudo rm -rf /var/log/app
```

## 📚 What You Learned

✅ Creating and managing Linux users and groups
✅ Implementing granular sudo permissions
✅ Creating service accounts with restricted access
✅ Configuring password policies and complexity requirements
✅ Setting up file permissions based on roles
✅ Auditing user access and activities
✅ Following principle of least privilege

## 🎓 Key Concepts

**Principle of Least Privilege**:
- Users should have minimum permissions needed
- Service accounts should never have interactive login
- Use groups to manage permissions collectively
- Deny by default, allow specifically

**sudo Best Practices**:
- Never use `NOPASSWD` for destructive commands
- Use command aliases for groups of commands
- Always use `visudo` to edit sudoers files
- Keep sudoers configurations in `/etc/sudoers.d/`

**Service Account Security**:
- Use system accounts (UID < 1000)
- Set shell to `/bin/false` or `/sbin/nologin`
- Never set passwords for service accounts
- Use filesystem permissions for access control

**Password Security**:
- Enforce minimum length (12+ characters)
- Require complexity (uppercase, lowercase, numbers, symbols)
- Set password expiration policies
- Enable failed login logging

## 🔜 Next Steps

Move to [02_kubernetes_rbac](../02_kubernetes_rbac/) where you'll:
- Apply RBAC concepts to Kubernetes
- Create ServiceAccounts
- Define Roles and RoleBindings
- Implement namespace isolation

## 💡 Pro Tips

1. **SSH Key Authentication**:
   ```bash
   # Disable password authentication
   sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
   sudo systemctl restart sshd
   ```

2. **Monitor sudo usage in real-time**:
   ```bash
   sudo tail -f /var/log/auth.log | grep sudo
   ```

3. **Create user template**:
   ```bash
   # Set default skeleton directory for new users
   sudo cp -r /etc/skel /etc/skel.custom
   # Add custom files to /etc/skel.custom
   sudo useradd -m -k /etc/skel.custom newuser
   ```

4. **Bulk user creation from CSV**:
   ```bash
   # users.csv format: username,fullname,group
   while IFS=, read -r username fullname group; do
     sudo useradd -m -c "$fullname" -G "$group" "$username"
   done < users.csv
   ```

## 🆘 Troubleshooting

**Problem**: `sudo: /etc/sudoers.d/custom-permissions: syntax error`
**Solution**: Always use `visudo` which checks syntax before saving
```bash
sudo visudo -c  # Check syntax
sudo visudo -f /etc/sudoers.d/custom-permissions
```

**Problem**: User cannot sudo even after adding to sudo group
**Solution**: User needs to logout and login again for group changes to take effect
```bash
# Or start new login session
su - developer
```

**Problem**: Password policy not enforced
**Solution**: PAM configuration needs to be updated
```bash
# Check PAM configuration
cat /etc/pam.d/common-password | grep pam_pwquality
```

**Problem**: Cannot delete user - user still running processes
**Solution**: Kill user processes first
```bash
sudo pkill -u username
sudo userdel username
```

## 📖 Additional Reading

- [Linux Users and Groups Guide](https://www.linux.com/training-tutorials/how-manage-users-groups-linux/)
- [sudo Documentation](https://www.sudo.ws/docs/man/sudoers.man/)
- [PAM Configuration Guide](https://linux.die.net/man/5/pam.d)
- [Linux Security Best Practices](https://www.cisecurity.org/cis-benchmarks)

---

**Estimated Time**: 30-40 minutes
**Difficulty**: Beginner to Intermediate
**Cost**: Free (local Linux system)
