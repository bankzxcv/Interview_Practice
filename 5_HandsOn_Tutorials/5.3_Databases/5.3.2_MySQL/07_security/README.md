# Tutorial 07: MySQL Security

## Objectives

- Implement MySQL security best practices
- Configure user authentication and authorization
- Set up SSL/TLS encryption
- Harden MySQL configuration
- Implement audit logging
- Secure MySQL in production

## Security Checklist

### 1. Strong Passwords
```sql
-- Create users with strong passwords
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'Strong#Pass123!';

-- Force password expiration
ALTER USER 'appuser'@'localhost' PASSWORD EXPIRE INTERVAL 90 DAY;

-- Check password strength
SHOW VARIABLES LIKE 'validate_password%';
```

### 2. Principle of Least Privilege
```sql
-- Grant only necessary privileges
GRANT SELECT, INSERT, UPDATE ON mydb.* TO 'appuser'@'localhost';

-- Revoke unnecessary privileges
REVOKE DELETE ON mydb.* FROM 'appuser'@'localhost';

-- Never grant ALL on production
-- BAD: GRANT ALL PRIVILEGES ON *.* TO 'user'@'%';
```

### 3. Network Security
```sql
-- Restrict access by host
CREATE USER 'appuser'@'192.168.1.%' IDENTIFIED BY 'password';

-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Remove remote root access
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1');

FLUSH PRIVILEGES;
```

### 4. SSL/TLS Configuration

**Generate certificates**:
```bash
# Create CA certificate
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3650 -key ca-key.pem -out ca-cert.pem

# Create server certificate
openssl req -newkey rsa:2048 -days 3650 -nodes -keyout server-key.pem -out server-req.pem
openssl x509 -req -in server-req.pem -days 3650 -CA ca-cert.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# Create client certificate
openssl req -newkey rsa:2048 -days 3650 -nodes -keyout client-key.pem -out client-req.pem
openssl x509 -req -in client-req.pem -days 3650 -CA ca-cert.pem -CAkey ca-key.pem -set_serial 01 -out client-cert.pem
```

**Configure MySQL**:
```ini
# my.cnf
[mysqld]
require_secure_transport = ON
ssl-ca = /etc/mysql/certs/ca-cert.pem
ssl-cert = /etc/mysql/certs/server-cert.pem
ssl-key = /etc/mysql/certs/server-key.pem

[client]
ssl-ca = /etc/mysql/certs/ca-cert.pem
ssl-cert = /etc/mysql/certs/client-cert.pem
ssl-key = /etc/mysql/certs/client-key.pem
```

**Require SSL for users**:
```sql
ALTER USER 'appuser'@'%' REQUIRE SSL;

-- Or require specific certificate
ALTER USER 'appuser'@'%' REQUIRE X509;
```

### 5. Audit Logging

```ini
# my.cnf - Enable audit plugin
plugin-load-add = audit_log.so
audit_log_file = /var/lib/mysql/audit.log
audit_log_policy = ALL
audit_log_format = JSON
```

```sql
-- Query audit log
SELECT * FROM mysql.audit_log WHERE EVENT_TIME > NOW() - INTERVAL 1 HOUR;
```

### 6. Configuration Hardening

```ini
# my.cnf
[mysqld]
# Disable LOCAL INFILE (security risk)
local_infile = 0

# Disable LOAD DATA LOCAL
local-infile = 0

# Restrict file privileges
secure_file_priv = /var/lib/mysql-files/

# Disable symbolic links
symbolic-links = 0

# Skip DNS hostname lookup
skip-name-resolve

# Lower max connections to prevent DoS
max_connections = 200

# Limit query size
max_allowed_packet = 16M

# Enable binary logging (for recovery)
log_bin = mysql-bin
```

### 7. Remove Test Database
```sql
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
FLUSH PRIVILEGES;
```

### 8. Secure Root Account
```bash
# Run mysql_secure_installation
mysql_secure_installation

# Or manually:
# - Set root password
# - Remove anonymous users
# - Disallow root login remotely
# - Remove test database
# - Reload privilege tables
```

### 9. File System Security
```bash
# Set proper ownership
chown -R mysql:mysql /var/lib/mysql

# Restrict permissions
chmod 700 /var/lib/mysql
chmod 600 /etc/mysql/my.cnf

# Secure backup files
chmod 600 /backups/*.sql
```

### 10. Application Security
```sql
-- Use prepared statements (prevents SQL injection)
-- In application code:
-- GOOD: $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
-- BAD:  $query = "SELECT * FROM users WHERE id = " . $_GET['id'];

-- Limit query execution time
SET max_execution_time = 5000;  -- 5 seconds

-- Disable dangerous functions if not needed
-- Remove SUPER privilege from application users
REVOKE SUPER ON *.* FROM 'appuser'@'%';
```

## Security Audit Queries

```sql
-- List all users and hosts
SELECT user, host, authentication_string, password_expired
FROM mysql.user ORDER BY user, host;

-- Check for users with ALL privileges
SELECT user, host FROM mysql.user WHERE Super_priv='Y';

-- Find users without passwords
SELECT user, host FROM mysql.user WHERE authentication_string='';

-- Check SSL requirements
SELECT user, host, ssl_type FROM mysql.user;

-- View current grants for user
SHOW GRANTS FOR 'appuser'@'localhost';

-- List all databases and access
SELECT user, host, db FROM mysql.db;
```

## Docker Security

**docker-compose.yml**:
```yaml
services:
  mysql:
    image: mysql:8.0
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/run/mysqld
    volumes:
      - mysql-data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD_FILE: /run/secrets/mysql_root_password
    secrets:
      - mysql_root_password

secrets:
  mysql_root_password:
    file: ./secrets/mysql_root_password.txt
```

## Compliance & Standards

### PCI DSS Requirements
- Encrypt data in transit (SSL/TLS)
- Restrict access by IP
- Strong password policies
- Audit logging enabled
- Regular security updates

### GDPR Considerations
- Data encryption
- Access controls
- Audit trails
- Right to deletion (CASCADE DELETE)
- Data retention policies

## Security Best Practices

1. **Never use root** for application connections
2. **Always use SSL/TLS** in production
3. **Rotate passwords** regularly
4. **Monitor audit logs** for suspicious activity
5. **Keep MySQL updated** with security patches
6. **Use firewall rules** to restrict access
7. **Backup encryption keys** separately from data
8. **Test security** regularly (penetration testing)
9. **Principle of least privilege** for all users
10. **Document security procedures**

## Security Checklist

- [ ] Root password is strong and secure
- [ ] No anonymous users exist
- [ ] No remote root access
- [ ] Test database removed
- [ ] All users have strong passwords
- [ ] Users have minimum required privileges
- [ ] SSL/TLS enabled for connections
- [ ] Audit logging enabled
- [ ] File permissions properly set
- [ ] Binary logging enabled
- [ ] Firewall configured
- [ ] Regular security audits scheduled
- [ ] Backup files encrypted
- [ ] Password expiration enabled
- [ ] Network access restricted by IP

## Verification

```bash
# Run security audit script
./scripts/security-audit.sh

# Check SSL connections
mysql -u root -p -e "SHOW STATUS LIKE 'Ssl_cipher';"

# Review audit log
tail -f /var/lib/mysql/audit.log
```

## Next Steps

**Tutorial 08: Performance Tuning** - Optimize MySQL for maximum performance with proper configuration and query optimization.

---

**Congratulations!** Your MySQL instance is now hardened and secure!
