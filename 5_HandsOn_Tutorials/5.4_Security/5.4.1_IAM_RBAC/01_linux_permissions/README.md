# Tutorial 01: Linux Users and Permissions

## Objectives

By the end of this tutorial, you will:
- Understand Linux user and group management
- Master file permissions (read, write, execute)
- Work with ownership and chmod/chown commands
- Implement sudo access control
- Configure user quotas and limits
- Apply the principle of least privilege
- Set up ACLs (Access Control Lists)
- Understand setuid, setgid, and sticky bits

## Prerequisites

- Linux system (Ubuntu 20.04+ recommended) or Docker
- Basic command line knowledge
- Root or sudo access
- Terminal/command line access

## What are Linux Permissions?

Linux is a multi-user operating system where security is enforced through a permissions system. Every file and directory has an owner (user), a group, and a set of permissions that determine who can read, write, or execute them.

### Key Concepts

- **Users**: Individual accounts that can log in and perform actions
- **Groups**: Collections of users that share permissions
- **Permissions**: Read (r), Write (w), Execute (x) rights
- **Ownership**: Every file belongs to a user and a group
- **Sudo**: Mechanism for granting administrative privileges
- **ACLs**: Extended permissions beyond basic user/group/others

## Why Linux Permissions Matter

Proper permission management is the foundation of system security:
- **Prevent Unauthorized Access**: Users can only access what they need
- **Protect System Files**: Critical files can't be modified by regular users
- **Isolation**: Users are isolated from each other's data
- **Audit Trail**: Ownership tracking for accountability
- **Defense in Depth**: First layer of security in any system

## Step-by-Step Instructions

### Step 1: Understanding Permission Structure

Every file/directory has permissions displayed like: `-rwxr-xr--`

```bash
# View file permissions
ls -l /etc/passwd

# Output breakdown:
# -rw-r--r-- 1 root root 1234 Nov 20 10:00 /etc/passwd
# │││││││││
# │└┬┘└┬┘└┬┘
# │ │  │  └─── Others permissions (r--)
# │ │  └────── Group permissions (r--)
# │ └───────── Owner permissions (rw-)
# └─────────── File type (- = file, d = directory, l = link)
```

**Permission Values:**
- `r` (read) = 4: View file contents or list directory
- `w` (write) = 2: Modify file or create/delete files in directory
- `x` (execute) = 1: Run file or enter directory

```bash
# Permission examples
-rwxr-xr-x  # 755: Owner full, Group/Others read+execute
-rw-r--r--  # 644: Owner read+write, Group/Others read only
-rwx------  # 700: Owner full, no access for others
drwxr-xr-x  # Directory with 755 permissions
```

### Step 2: Create Users and Groups

```bash
# Create a new user
sudo useradd -m -s /bin/bash developer
# -m: Create home directory
# -s: Set shell

# Set password
sudo passwd developer
# Enter password twice

# Create user with more options
sudo useradd -m -s /bin/bash -c "Application Developer" -G sudo,docker developer2
# -c: Comment/description
# -G: Additional groups

# Create a group
sudo groupadd devteam

# Add user to group
sudo usermod -aG devteam developer
# -a: Append (don't remove from other groups)
# -G: Groups to add

# View user information
id developer
# Output: uid=1001(developer) gid=1001(developer) groups=1001(developer),1002(devteam)

# View all users
cat /etc/passwd | grep developer

# View all groups
cat /etc/group | grep dev

# Switch to user
su - developer
# Enter password, then exit
exit
```

### Step 3: File Ownership and Permissions

```bash
# Create a test directory structure
sudo mkdir -p /opt/myapp/{bin,config,data,logs}

# Change owner
sudo chown developer:devteam /opt/myapp
# Format: chown user:group

# Change ownership recursively
sudo chown -R developer:devteam /opt/myapp/*

# Change group only
sudo chgrp devteam /opt/myapp/data

# View permissions
ls -la /opt/myapp

# Change permissions using symbolic mode
chmod u+x /opt/myapp/bin/script.sh    # Add execute for owner
chmod g-w /opt/myapp/config/app.conf  # Remove write for group
chmod o-r /opt/myapp/data/            # Remove read for others
chmod a+r /opt/myapp/logs/            # Add read for all

# Change permissions using numeric mode
chmod 755 /opt/myapp/bin/             # rwxr-xr-x
chmod 644 /opt/myapp/config/app.conf  # rw-r--r--
chmod 700 /opt/myapp/data/            # rwx------
chmod 750 /opt/myapp                  # rwxr-x---

# Recursive permission change
chmod -R 755 /opt/myapp/bin/
```

### Step 4: Practical Example - Application Deployment

```bash
# Scenario: Deploy an application with proper security

# 1. Create application user (no login)
sudo useradd -r -s /bin/false -d /opt/webapp webapp
# -r: System account
# -s /bin/false: No shell access
# -d: Home directory

# 2. Create directory structure
sudo mkdir -p /opt/webapp/{app,config,data,logs}

# 3. Set ownership
sudo chown -R webapp:webapp /opt/webapp

# 4. Set permissions
sudo chmod 750 /opt/webapp                   # Only webapp user can access
sudo chmod 755 /opt/webapp/app               # Application code readable
sudo chmod 750 /opt/webapp/config            # Config files protected
sudo chmod 700 /opt/webapp/data              # Data only for webapp user
sudo chmod 755 /opt/webapp/logs              # Logs readable by admins group

# 5. Create a startup script
sudo tee /opt/webapp/app/start.sh > /dev/null << 'EOF'
#!/bin/bash
cd /opt/webapp/app
exec ./webapp-server --config /opt/webapp/config/app.conf
EOF

# 6. Make script executable
sudo chmod 750 /opt/webapp/app/start.sh

# 7. Create a sensitive config file
sudo tee /opt/webapp/config/app.conf > /dev/null << 'EOF'
database_password=supersecret123
api_key=sk_live_abc123xyz
EOF

# 8. Protect sensitive file
sudo chmod 600 /opt/webapp/config/app.conf
sudo chown webapp:webapp /opt/webapp/config/app.conf

# 9. Verify permissions
ls -la /opt/webapp/
ls -la /opt/webapp/config/
```

### Step 5: Sudo Configuration

```bash
# Edit sudoers file (ALWAYS use visudo)
sudo visudo

# Add these lines at the end:
# Allow developer to restart web service without password
developer ALL=(ALL) NOPASSWD: /bin/systemctl restart webapp

# Allow devteam group to run app commands
%devteam ALL=(webapp) /opt/webapp/app/*

# Allow user to run specific commands
developer ALL=(ALL) /usr/bin/docker, /usr/bin/kubectl

# Test sudo access
sudo -l
# Shows what commands user can run

# Run command as specific user
sudo -u webapp /opt/webapp/app/start.sh
```

### Step 6: Advanced - ACLs (Access Control Lists)

ACLs provide more fine-grained permissions beyond user/group/others.

```bash
# Install ACL tools (if not installed)
sudo apt-get update && sudo apt-get install -y acl

# Set ACL to give specific user access
sudo setfacl -m u:developer:rwx /opt/webapp/logs
# -m: Modify ACL
# u:developer:rwx: Give developer user rwx permissions

# Give specific group access
sudo setfacl -m g:devteam:rx /opt/webapp/logs

# View ACLs
getfacl /opt/webapp/logs

# Remove ACL for user
sudo setfacl -x u:developer /opt/webapp/logs

# Set default ACL (for new files in directory)
sudo setfacl -d -m u:developer:rw /opt/webapp/data
# New files will automatically give developer rw access

# Remove all ACLs
sudo setfacl -b /opt/webapp/logs
```

### Step 7: Special Permissions

```bash
# Setuid (Set User ID)
# File executes with owner's permissions
sudo chmod u+s /usr/bin/passwd
# passwd needs root to modify /etc/shadow

# Setgid (Set Group ID)
# File executes with group's permissions
# Directory: New files inherit directory's group
sudo chmod g+s /opt/webapp/data
chmod 2755 /opt/webapp/data  # Numeric: 2 = setgid

# Sticky bit
# Only file owner can delete their files in directory
sudo chmod +t /tmp
chmod 1777 /tmp  # Numeric: 1 = sticky bit

# View special permissions
ls -la /usr/bin/passwd
# -rwsr-xr-x (s = setuid)

ls -la /opt/webapp/data
# drwxr-sr-x (s = setgid)

ls -la /tmp
# drwxrwxrwt (t = sticky bit)
```

### Step 8: User Limits and Quotas

```bash
# Edit limits configuration
sudo nano /etc/security/limits.conf

# Add limits:
developer hard nproc 50          # Max 50 processes
developer hard nofile 1000       # Max 1000 open files
@devteam hard cpu 60             # Max 60 CPU minutes
@devteam hard maxlogins 3        # Max 3 concurrent logins

# View current limits
ulimit -a

# Set soft limit for current session
ulimit -n 500  # Max 500 open files
```

### Step 9: Auditing and Monitoring

```bash
# View login history
last
last developer

# View failed login attempts
sudo lastb

# View currently logged in users
w
who

# View user's active processes
ps aux | grep developer

# Monitor file access (install auditd)
sudo apt-get install -y auditd

# Add audit rule to monitor directory
sudo auditctl -w /opt/webapp/config -p war -k webapp_config_access
# -w: Watch path
# -p: Permissions (w=write, a=attribute, r=read)
# -k: Key name for searching

# Search audit logs
sudo ausearch -k webapp_config_access

# View audit rules
sudo auditctl -l
```

### Step 10: Docker Example with User Permissions

```bash
# Create a Dockerfile with non-root user
cat > Dockerfile << 'EOF'
FROM ubuntu:22.04

# Create application user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Create app directory
RUN mkdir -p /app && chown -R appuser:appuser /app

# Switch to app user
USER appuser

# Set working directory
WORKDIR /app

# Copy application (will be owned by appuser)
COPY --chown=appuser:appuser . /app

# Run application as non-root
CMD ["./app"]
EOF

# Build and run
docker build -t secure-app .
docker run --rm secure-app id
# Output: uid=999(appuser) gid=999(appuser) groups=999(appuser)
```

## Common Security Patterns

### 1. Web Application User

```bash
# Create dedicated user for web app
sudo useradd -r -s /bin/false -d /var/www/myapp www-myapp
sudo mkdir -p /var/www/myapp
sudo chown www-myapp:www-myapp /var/www/myapp
sudo chmod 750 /var/www/myapp
```

### 2. Database Files

```bash
# Protect database files
sudo chown postgres:postgres /var/lib/postgresql
sudo chmod 700 /var/lib/postgresql
```

### 3. SSH Keys

```bash
# Protect private keys
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
chmod 700 ~/.ssh
```

### 4. Shared Directory

```bash
# Shared directory with setgid
sudo mkdir /shared
sudo chgrp devteam /shared
sudo chmod 2775 /shared  # setgid + rwxrwxr-x
# New files will belong to devteam group
```

## Security Best Practices

### Principle of Least Privilege

```bash
✅ Create service accounts with minimum permissions
✅ Use specific sudo rules instead of full root
✅ Remove unnecessary permissions
✅ Regular audit of user permissions
✅ Disable accounts instead of deleting

❌ Running applications as root
❌ Using chmod 777
❌ Sharing user accounts
❌ Leaving default permissions
```

### Permission Checklist

```bash
# Application files
755 for directories (rwxr-xr-x)
644 for regular files (rw-r--r--)
755 for executables (rwxr-xr-x)

# Configuration files
750 for config directories (rwxr-x---)
640 for config files (rw-r-----)
600 for sensitive files (rw-------)

# Data directories
700 for user data (rwx------)
750 for shared data (rwxr-x---)

# Log files
755 for log directories
644 for log files (readable by monitoring)
```

## Troubleshooting

### Permission Denied Errors

```bash
# Check file permissions
ls -la file.txt

# Check file ownership
stat file.txt

# Check effective user
whoami
id

# Check process user
ps aux | grep process_name

# Check directory permissions (entire path)
namei -l /path/to/file
```

### Cannot Execute Script

```bash
# Add execute permission
chmod +x script.sh

# Check shebang
head -1 script.sh  # Should be #!/bin/bash

# Check file system mount options
mount | grep /partition
# Look for 'noexec' flag
```

## Verification

Test your understanding:

```bash
# 1. Create a user that can read but not write logs
sudo useradd -r -s /bin/false logviewer
sudo chown root:logviewer /var/log/myapp
sudo chmod 750 /var/log/myapp
# Files: sudo chmod 640

# 2. Verify user cannot write
sudo -u logviewer touch /var/log/myapp/test.log
# Should fail with permission denied

# 3. Verify user can read
sudo -u logviewer cat /var/log/myapp/app.log
# Should succeed
```

## Real-World Example: Multi-Tier App

```bash
#!/bin/bash
# Setup permissions for a 3-tier application

# 1. Web tier user
sudo useradd -r -s /bin/false -d /opt/web webserver
sudo mkdir -p /opt/web/{app,config,logs}
sudo chown -R webserver:webserver /opt/web
sudo chmod 750 /opt/web/{app,config}
sudo chmod 755 /opt/web/logs

# 2. App tier user
sudo useradd -r -s /bin/false -d /opt/app appserver
sudo mkdir -p /opt/app/{app,config,data,logs}
sudo chown -R appserver:appserver /opt/app
sudo chmod 750 /opt/app/{app,config,data}
sudo chmod 755 /opt/app/logs

# 3. Database tier user
sudo useradd -r -s /bin/false -d /opt/db dbserver
sudo mkdir -p /opt/db/{data,config,backups,logs}
sudo chown -R dbserver:dbserver /opt/db
sudo chmod 700 /opt/db/{data,config,backups}
sudo chmod 755 /opt/db/logs

# 4. Admin group with read access to all logs
sudo groupadd appadmins
sudo usermod -aG appadmins $USER
sudo setfacl -R -m g:appadmins:r /opt/{web,app,db}/logs

# 5. Verify
sudo -u webserver touch /opt/web/app/test.html
sudo -u appserver touch /opt/app/data/session.dat
sudo -u dbserver touch /opt/db/data/database.db

ls -la /opt/*/
```

## Key Takeaways

1. **Always use least privilege**: Give only necessary permissions
2. **Service accounts**: Create dedicated users for applications
3. **No shared accounts**: Each person should have their own account
4. **Protect sensitive files**: Use 600 or 640 for configs with secrets
5. **Regular audits**: Review permissions periodically
6. **Use ACLs**: When basic permissions aren't enough
7. **Document**: Keep track of permission decisions
8. **Test**: Verify permissions work as intended

## Additional Resources

- [Linux Permissions Documentation](https://www.linux.org/docs/)
- [Understanding UNIX Permissions](https://www.redhat.com/sysadmin/understanding-unix-permissions)
- [ACL Tutorial](https://www.redhat.com/sysadmin/linux-access-control-lists)
- [Sudo Best Practices](https://www.sudo.ws/docs/man/sudoers.man/)

## Next Steps

- Tutorial 02: Kubernetes RBAC (ServiceAccounts, Roles)
- Tutorial 03: AWS IAM (Users, Groups, Policies)
- Apply these concepts to container security

---

**Difficulty**: Beginner
**Estimated Time**: 2-3 hours
**Practice**: Set up proper permissions for your next project
