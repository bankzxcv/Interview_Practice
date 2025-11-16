# Tutorial 07: PostgreSQL Security - Users, Roles, SSL & Auditing

## Objectives

- Configure users and roles with proper permissions
- Implement Row-Level Security (RLS)
- Set up SSL/TLS encrypted connections
- Configure audit logging
- Implement password policies
- Secure PostgreSQL configuration
- Understand and prevent SQL injection

## Prerequisites

- Completed Tutorials 01-06
- Understanding of security concepts
- OpenSSL installed (for certificate generation)
- 45-60 minutes

## Security Layers

```
1. Network Security (SSL/TLS, pg_hba.conf)
2. Authentication (Password policies, MD5/SCRAM)
3. Authorization (Roles, privileges, RLS)
4. Auditing (pgAudit, log analysis)
5. Data Encryption (at-rest, in-transit)
```

## Step-by-Step Instructions

### Step 1: User and Role Management

**Create roles**:
```sql
-- Create role hierarchy
CREATE ROLE readonly;
CREATE ROLE readwrite;
CREATE ROLE admin;

-- Grant privileges to roles
GRANT CONNECT ON DATABASE postgres TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO readonly;

GRANT readonly TO readwrite;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO readwrite;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO readwrite;

GRANT readwrite TO admin;
GRANT CREATE ON SCHEMA public TO admin;

-- Create users and assign roles
CREATE USER app_user WITH PASSWORD 'AppSecure123!' IN ROLE readwrite;
CREATE USER report_user WITH PASSWORD 'ReportSecure123!' IN ROLE readonly;
CREATE USER db_admin WITH PASSWORD 'AdminSecure123!' IN ROLE admin;

-- Set password expiration
ALTER ROLE app_user VALID UNTIL '2025-12-31';

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO readwrite;
```

**View permissions**:
```sql
-- List all users and roles
\du

-- Check user's privileges
SELECT
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'app_user';

-- Check role membership
SELECT
    r.rolname,
    r.rolsuper,
    r.rolinherit,
    r.rolcreaterole,
    r.rolcreatedb,
    ARRAY(
        SELECT b.rolname
        FROM pg_catalog.pg_auth_members m
        JOIN pg_catalog.pg_roles b ON (m.roleid = b.oid)
        WHERE m.member = r.oid
    ) as memberof
FROM pg_catalog.pg_roles r
WHERE r.rolname NOT LIKE 'pg_%'
ORDER BY 1;
```

### Step 2: Row-Level Security (RLS)

**Enable RLS on table**:
```sql
-- Create sample table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    content TEXT,
    owner VARCHAR(50),
    department VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their own documents
CREATE POLICY user_documents ON documents
    FOR SELECT
    USING (owner = current_user);

-- Create policy: users can insert only with their username as owner
CREATE POLICY user_insert ON documents
    FOR INSERT
    WITH CHECK (owner = current_user);

-- Create policy: admins can see everything
CREATE POLICY admin_all ON documents
    FOR ALL
    TO admin
    USING (true);

-- Test RLS
INSERT INTO documents (title, content, owner, department) VALUES
    ('Doc 1', 'Content 1', 'app_user', 'engineering'),
    ('Doc 2', 'Content 2', 'report_user', 'finance'),
    ('Doc 3', 'Content 3', 'app_user', 'engineering');

-- Connect as app_user
SET ROLE app_user;
SELECT * FROM documents;  -- Only sees documents where owner = 'app_user'

-- Connect as admin
SET ROLE admin;
SELECT * FROM documents;  -- Sees all documents

-- Reset
RESET ROLE;
```

**Advanced RLS policies**:
```sql
-- Multi-tenant isolation
CREATE POLICY tenant_isolation ON documents
    FOR ALL
    USING (department = current_setting('app.current_tenant', true));

-- Set tenant context
SET app.current_tenant = 'engineering';
SELECT * FROM documents;  -- Only engineering documents

-- Time-based access
CREATE POLICY business_hours ON documents
    FOR SELECT
    USING (EXTRACT(HOUR FROM NOW()) BETWEEN 9 AND 17);

-- Combine policies with AND
CREATE POLICY combined ON documents
    FOR SELECT
    USING (
        owner = current_user
        AND department = current_setting('app.current_tenant', true)
    );
```

### Step 3: SSL/TLS Configuration

**Generate SSL certificates**:
```bash
# Create certificates directory
mkdir -p certs && cd certs

# Generate CA private key
openssl genrsa -out ca-key.pem 4096

# Generate CA certificate
openssl req -new -x509 -days 3650 -key ca-key.pem -out ca-cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=PostgreSQL CA"

# Generate server private key
openssl genrsa -out server-key.pem 4096

# Generate server certificate signing request
openssl req -new -key server-key.pem -out server-req.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=postgres"

# Sign server certificate
openssl x509 -req -in server-req.pem -days 3650 \
    -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial \
    -out server-cert.pem

# Set permissions
chmod 600 server-key.pem ca-key.pem
chmod 644 server-cert.pem ca-cert.pem
```

**Configure PostgreSQL for SSL**:
```bash
# Copy certificates to PostgreSQL data directory
docker-compose exec postgres mkdir -p /var/lib/postgresql/data/certs
docker cp certs/* postgres-secure:/var/lib/postgresql/data/certs/

# Update postgresql.conf
docker-compose exec postgres psql -U postgres <<EOF
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/var/lib/postgresql/data/certs/server-cert.pem';
ALTER SYSTEM SET ssl_key_file = '/var/lib/postgresql/data/certs/server-key.pem';
ALTER SYSTEM SET ssl_ca_file = '/var/lib/postgresql/data/certs/ca-cert.pem';
SELECT pg_reload_conf();
EOF

# Restart PostgreSQL
docker-compose restart postgres
```

**Configure pg_hba.conf for SSL**:
```bash
# Require SSL for all connections except localhost
cat > pg_hba_ssl.conf <<EOF
# TYPE  DATABASE    USER        ADDRESS         METHOD
local   all         all                         peer
hostssl all         all         0.0.0.0/0       scram-sha-256
host    all         all         127.0.0.1/32    scram-sha-256
EOF

# Apply configuration
docker cp pg_hba_ssl.conf postgres-secure:/var/lib/postgresql/data/pg_hba.conf
docker-compose exec postgres psql -U postgres -c "SELECT pg_reload_conf();"
```

**Test SSL connection**:
```bash
# Connect with SSL
psql "postgresql://postgres:postgres123@localhost:5432/postgres?sslmode=require"

# Verify SSL
psql -h localhost -U postgres -d postgres -c "SELECT ssl_is_used();"

# Check SSL version
psql -h localhost -U postgres -d postgres -c "SHOW ssl;"
```

### Step 4: Password Policies

**Configure password authentication**:
```sql
-- Use SCRAM-SHA-256 (more secure than MD5)
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

-- Create password check function
CREATE OR REPLACE FUNCTION check_password_strength(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Minimum 12 characters
    IF LENGTH(password) < 12 THEN
        RAISE EXCEPTION 'Password must be at least 12 characters';
    END IF;

    -- Must contain uppercase
    IF password !~ '[A-Z]' THEN
        RAISE EXCEPTION 'Password must contain uppercase letters';
    END IF;

    -- Must contain lowercase
    IF password !~ '[a-z]' THEN
        RAISE EXCEPTION 'Password must contain lowercase letters';
    END IF;

    -- Must contain numbers
    IF password !~ '[0-9]' THEN
        RAISE EXCEPTION 'Password must contain numbers';
    END IF;

    -- Must contain special characters
    IF password !~ '[!@#$%^&*()]' THEN
        RAISE EXCEPTION 'Password must contain special characters';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Test password strength
SELECT check_password_strength('Weak');  -- Should fail
SELECT check_password_strength('StrongP@ssw0rd123!');  -- Should succeed
```

**Password expiration**:
```sql
-- Set password expiration
ALTER ROLE app_user VALID UNTIL '2024-12-31';

-- Check expiration
SELECT
    rolname,
    rolvaliduntil
FROM pg_roles
WHERE rolname = 'app_user';

-- Disable login
ALTER ROLE app_user NOLOGIN;

-- Re-enable
ALTER ROLE app_user LOGIN;
```

### Step 5: Audit Logging with pgAudit

**Install pgAudit**:
```sql
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Configure audit logging
ALTER SYSTEM SET pgaudit.log = 'read, write, ddl';
ALTER SYSTEM SET pgaudit.log_catalog = off;
ALTER SYSTEM SET pgaudit.log_parameter = on;
ALTER SYSTEM SET pgaudit.log_relation = on;
SELECT pg_reload_conf();
```

**Configure audit for specific objects**:
```sql
-- Audit all operations on sensitive table
ALTER TABLE documents SET (pgaudit.log = 'all');

-- Audit specific user
ALTER ROLE app_user SET pgaudit.log = 'all';

-- Test audit logging
INSERT INTO documents (title, content, owner) VALUES
    ('Sensitive', 'Secret content', 'app_user');

-- Check logs
-- docker-compose logs postgres | grep AUDIT
```

### Step 6: Connection Security (pg_hba.conf)

```bash
# Comprehensive pg_hba.conf
cat > pg_hba.conf <<EOF
# TYPE  DATABASE    USER            ADDRESS             METHOD

# Local connections (Unix socket)
local   all         postgres                            peer
local   all         all                                 scram-sha-256

# IPv4 localhost
host    all         all             127.0.0.1/32        scram-sha-256

# IPv6 localhost
host    all         all             ::1/128             scram-sha-256

# Require SSL for remote connections
hostssl all         all             0.0.0.0/0           scram-sha-256

# Reject non-SSL remote connections
hostnossl all       all             0.0.0.0/0           reject

# Specific network with cert authentication
hostssl all         all             10.0.0.0/8          cert

# Replication connections
hostssl replication replicator      0.0.0.0/0           scram-sha-256
EOF
```

### Step 7: SQL Injection Prevention

**Parameterized queries (safe)**:
```python
# Python example
import psycopg2

# BAD - vulnerable to SQL injection
def get_user_bad(username):
    query = f"SELECT * FROM users WHERE username = '{username}'"
    # Attacker can use: ' OR '1'='1
    cursor.execute(query)

# GOOD - use parameterized queries
def get_user_good(username):
    query = "SELECT * FROM users WHERE username = %s"
    cursor.execute(query, (username,))
```

**Input validation in PostgreSQL**:
```sql
-- Create validation function
CREATE OR REPLACE FUNCTION validate_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Use in constraint
ALTER TABLE users ADD CONSTRAINT valid_email
    CHECK (validate_email(email));
```

### Step 8: Database Hardening

**Secure PostgreSQL configuration**:
```sql
-- Disable dangerous functions for non-superusers
REVOKE EXECUTE ON FUNCTION pg_read_file(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION pg_ls_dir(text) FROM PUBLIC;

-- Limit connection attempts
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_failed_login_attempts = on;

-- Set connection limits
ALTER ROLE app_user CONNECTION LIMIT 10;

-- Disable TRUST authentication
-- Edit pg_hba.conf to remove any TRUST methods

-- Require SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_min_protocol_version = 'TLSv1.2';

-- Set strong cipher suites
ALTER SYSTEM SET ssl_ciphers = 'HIGH:!aNULL:!MD5';

SELECT pg_reload_conf();
```

### Step 9: Security Monitoring

**Monitor failed login attempts**:
```sql
-- Create monitoring view
CREATE OR REPLACE VIEW failed_logins AS
SELECT
    usename,
    client_addr,
    COUNT(*) as failed_attempts,
    MAX(backend_start) as last_attempt
FROM pg_stat_activity
WHERE state = 'failed'
GROUP BY usename, client_addr
HAVING COUNT(*) > 3;
```

**Monitor privilege escalation**:
```sql
-- Log role changes
CREATE TABLE role_audit (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(50),
    action VARCHAR(20),
    details TEXT
);

-- Trigger on role grants
CREATE OR REPLACE FUNCTION audit_role_grant()
RETURNS EVENT_TRIGGER AS $$
BEGIN
    INSERT INTO role_audit (username, action, details)
    VALUES (current_user, 'GRANT', 'Role privilege changed');
END;
$$ LANGUAGE plpgsql;

CREATE EVENT TRIGGER audit_grants ON ddl_command_end
    WHEN TAG IN ('GRANT')
    EXECUTE FUNCTION audit_role_grant();
```

### Step 10: Security Checklist

**Regular security audit**:
```bash
#!/bin/bash
# security_audit.sh

echo "=== PostgreSQL Security Audit ==="

echo "1. Checking SSL status..."
docker-compose exec -T postgres psql -U postgres -c "SHOW ssl;"

echo "2. Checking password encryption..."
docker-compose exec -T postgres psql -U postgres -c "SHOW password_encryption;"

echo "3. Checking superusers..."
docker-compose exec -T postgres psql -U postgres -c "
    SELECT rolname FROM pg_roles WHERE rolsuper = true;
"

echo "4. Checking users without passwords..."
docker-compose exec -T postgres psql -U postgres -c "
    SELECT rolname FROM pg_roles WHERE rolpassword IS NULL AND rolcanlogin = true;
"

echo "5. Checking public schema permissions..."
docker-compose exec -T postgres psql -U postgres -c "
    SELECT * FROM information_schema.table_privileges
    WHERE grantee = 'PUBLIC';
"

echo "6. Checking authentication methods..."
docker-compose exec postgres cat /var/lib/postgresql/data/pg_hba.conf | grep -v "^#"

echo "=== Audit Complete ==="
```

## Security Best Practices

### 1. Principle of Least Privilege
- Grant minimum necessary permissions
- Use roles, not direct user grants
- Review permissions regularly

### 2. Defense in Depth
- Network security (firewall, VPN)
- Application security (parameterized queries)
- Database security (RLS, encryption)

### 3. Regular Updates
- Keep PostgreSQL updated
- Apply security patches
- Monitor CVEs

### 4. Audit and Monitor
- Enable audit logging
- Monitor failed logins
- Alert on suspicious activity

### 5. Backup and Recovery
- Encrypt backups
- Test restore procedures
- Secure backup storage

## Verification Steps

```bash
# Test SSL
psql "sslmode=require host=localhost user=postgres"

# Test RLS
docker-compose exec postgres psql -U app_user -c "SELECT * FROM documents;"

# Test password policy
docker-compose exec postgres psql -U postgres -c "CREATE USER test WITH PASSWORD 'weak';"

# Check audit logs
docker-compose logs postgres | grep AUDIT | tail -20
```

## Cleanup

```bash
docker-compose down -v
rm -rf certs/
```

## Next Steps

In **Tutorial 08: Performance Tuning**, you will:
- Optimize query performance
- Use EXPLAIN ANALYZE
- Create efficient indexes
- Configure autovacuum
- Tune PostgreSQL parameters

---

**Congratulations!** Your PostgreSQL deployment is now secure with multiple layers of protection.
