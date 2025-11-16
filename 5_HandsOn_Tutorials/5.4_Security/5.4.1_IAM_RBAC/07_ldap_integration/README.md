# Security Tutorial 07: LDAP/Active Directory Integration

## 🎯 Learning Objectives

- Set up OpenLDAP server
- Configure LDAP authentication
- Integrate LDAP with Kubernetes
- Implement group-based access control
- Configure LDAP for applications
- Test and troubleshoot LDAP authentication

## 📋 Prerequisites

- Linux server or VM
- Docker installed
- Kubernetes cluster
- Basic understanding of LDAP concepts

## 📝 What We're Building

```
LDAP Infrastructure
├── OpenLDAP Server
│   ├── Base DN: dc=example,dc=com
│   ├── Users (ou=users)
│   ├── Groups (ou=groups)
│   └── Service Accounts
├── phpLDAPadmin (Web UI)
├── Kubernetes LDAP Auth
└── Application LDAP Integration
```

## 🔍 Concepts Introduced

1. **LDAP**: Lightweight Directory Access Protocol
2. **DN**: Distinguished Name (unique identifier)
3. **OU**: Organizational Unit
4. **Bind**: LDAP authentication
5. **Search**: Query LDAP directory
6. **Schema**: LDAP object structure

## 📁 Step-by-Step Implementation

### Step 1: Deploy OpenLDAP with Docker

Create `docker-compose.yaml`:

```yaml
version: '3'
services:
  openldap:
    image: osixia/openldap:1.5.0
    container_name: openldap
    environment:
      LDAP_ORGANISATION: "Example Inc"
      LDAP_DOMAIN: "example.com"
      LDAP_ADMIN_PASSWORD: "admin_password"
      LDAP_CONFIG_PASSWORD: "config_password"
      LDAP_RFC2307BIS_SCHEMA: "true"
      LDAP_REMOVE_CONFIG_AFTER_SETUP: "true"
      LDAP_TLS_VERIFY_CLIENT: "never"
    ports:
      - "389:389"
      - "636:636"
    volumes:
      - ldap_data:/var/lib/ldap
      - ldap_config:/etc/ldap/slapd.d
    networks:
      - ldap_network

  phpldapadmin:
    image: osixia/phpldapadmin:0.9.0
    container_name: phpldapadmin
    environment:
      PHPLDAPADMIN_LDAP_HOSTS: "openldap"
      PHPLDAPADMIN_HTTPS: "false"
    ports:
      - "8080:80"
    depends_on:
      - openldap
    networks:
      - ldap_network

volumes:
  ldap_data:
  ldap_config:

networks:
  ldap_network:
```

Start services:

```bash
# Start LDAP and phpLDAPadmin
docker-compose up -d

# Check status
docker-compose ps

# Wait for services
sleep 10

# Access phpLDAPadmin at http://localhost:8080
# Login: cn=admin,dc=example,dc=com / admin_password
```

### Step 2: Create LDAP Structure

Create `ldap-structure.ldif`:

```ldif
# ldap-structure.ldif

# Organizational Units
dn: ou=users,dc=example,dc=com
objectClass: organizationalUnit
ou: users

dn: ou=groups,dc=example,dc=com
objectClass: organizationalUnit
ou: groups

# Users
dn: uid=alice,ou=users,dc=example,dc=com
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: alice
cn: Alice Developer
sn: Developer
mail: alice@example.com
userPassword: {SSHA}encrypted_password
uidNumber: 10001
gidNumber: 10001
homeDirectory: /home/alice
loginShell: /bin/bash

dn: uid=bob,ou=users,dc=example,dc=com
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: bob
cn: Bob Operator
sn: Operator
mail: bob@example.com
userPassword: {SSHA}encrypted_password
uidNumber: 10002
gidNumber: 10002
homeDirectory: /home/bob
loginShell: /bin/bash

dn: uid=carol,ou=users,dc=example,dc=com
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: carol
cn: Carol Auditor
sn: Auditor
mail: carol@example.com
userPassword: {SSHA}encrypted_password
uidNumber: 10003
gidNumber: 10003
homeDirectory: /home/carol
loginShell: /bin/bash

# Groups
dn: cn=developers,ou=groups,dc=example,dc=com
objectClass: groupOfNames
cn: developers
description: Development team
member: uid=alice,ou=users,dc=example,dc=com

dn: cn=operators,ou=groups,dc=example,dc=com
objectClass: groupOfNames
cn: operators
description: Operations team
member: uid=bob,ou=users,dc=example,dc=com

dn: cn=auditors,ou=groups,dc=example,dc=com
objectClass: groupOfNames
cn: auditors
description: Audit team
member: uid=carol,ou=users,dc=example,dc=com
```

Apply LDIF:

```bash
# Copy LDIF to container
docker cp ldap-structure.ldif openldap:/tmp/

# Apply LDIF
docker exec openldap ldapadd -x -D "cn=admin,dc=example,dc=com" -w admin_password -f /tmp/ldap-structure.ldif

# Verify
docker exec openldap ldapsearch -x -b "dc=example,dc=com" -D "cn=admin,dc=example,dc=com" -w admin_password
```

### Step 3: Test LDAP Authentication

```bash
# Install LDAP utilities
sudo apt-get install -y ldap-utils

# Search for all users
ldapsearch -x -H ldap://localhost:389 -D "cn=admin,dc=example,dc=com" -w admin_password -b "ou=users,dc=example,dc=com"

# Search for specific user
ldapsearch -x -H ldap://localhost:389 -D "cn=admin,dc=example,dc=com" -w admin_password -b "ou=users,dc=example,dc=com" "(uid=alice)"

# Test user bind (authentication)
ldapwhoami -x -H ldap://localhost:389 -D "uid=alice,ou=users,dc=example,dc=com" -w alice_password

# Search groups
ldapsearch -x -H ldap://localhost:389 -D "cn=admin,dc=example,dc=com" -w admin_password -b "ou=groups,dc=example,dc=com"

# Find user's groups
ldapsearch -x -H ldap://localhost:389 -D "cn=admin,dc=example,dc=com" -w admin_password -b "ou=groups,dc=example,dc=com" "(member=uid=alice,ou=users,dc=example,dc=com)"
```

### Step 4: Integrate LDAP with Linux PAM

```bash
# Install LDAP client
sudo apt-get install -y libnss-ldapd libpam-ldapd ldap-utils

# Configure /etc/ldap/ldap.conf
cat <<EOF | sudo tee /etc/ldap/ldap.conf
BASE dc=example,dc=com
URI ldap://localhost:389
BINDDN cn=admin,dc=example,dc=com
BINDPW admin_password
EOF

# Configure /etc/ldap.conf for nslcd
cat <<EOF | sudo tee /etc/nslcd.conf
uid nslcd
gid nslcd
uri ldap://localhost:389
base dc=example,dc=com
binddn cn=admin,dc=example,dc=com
bindpw admin_password
EOF

# Restart nslcd
sudo systemctl restart nslcd

# Test user lookup
getent passwd alice
id alice

# Configure PAM for LDAP authentication
sudo pam-auth-update --enable ldap
```

### Step 5: Configure Kubernetes LDAP Authentication

Create `dex-ldap-config.yaml` (using Dex as OIDC bridge):

```yaml
# dex-ldap-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dex
  namespace: auth
data:
  config.yaml: |
    issuer: https://dex.example.com:32000
    storage:
      type: kubernetes
      config:
        inCluster: true
    web:
      http: 0.0.0.0:5556
    connectors:
      - type: ldap
        id: ldap
        name: LDAP
        config:
          host: openldap.ldap:389
          insecureNoSSL: true
          insecureSkipVerify: true
          bindDN: cn=admin,dc=example,dc=com
          bindPW: admin_password
          usernamePrompt: Email Address
          userSearch:
            baseDN: ou=users,dc=example,dc=com
            filter: "(objectClass=inetOrgPerson)"
            username: uid
            idAttr: uid
            emailAttr: mail
            nameAttr: cn
          groupSearch:
            baseDN: ou=groups,dc=example,dc=com
            filter: "(objectClass=groupOfNames)"
            userAttr: DN
            groupAttr: member
            nameAttr: cn
    oauth2:
      skipApprovalScreen: true
    staticClients:
      - id: kubernetes
        redirectURIs:
          - 'http://localhost:8000'
          - 'http://localhost:18000'
        name: 'Kubernetes'
        secret: kubernetes-client-secret
```

Deploy Dex:

```bash
# Create namespace
kubectl create namespace auth

# Apply Dex configuration
kubectl apply -f dex-ldap-config.yaml -n auth

# Deploy Dex
kubectl apply -f https://raw.githubusercontent.com/dexidp/dex/master/examples/k8s/dex.yaml -n auth

# Verify
kubectl get pods -n auth
```

### Step 6: Create LDAP Authentication Script

Create `ldap-auth.sh`:

```bash
#!/bin/bash
# ldap-auth.sh - LDAP authentication helper

LDAP_HOST="localhost"
LDAP_PORT="389"
LDAP_BASE_DN="dc=example,dc=com"
LDAP_BIND_DN="cn=admin,dc=example,dc=com"
LDAP_BIND_PW="admin_password"

authenticate_user() {
    local username=$1
    local password=$2

    # Try to bind as user
    ldapwhoami -x -H ldap://$LDAP_HOST:$LDAP_PORT \
        -D "uid=$username,ou=users,$LDAP_BASE_DN" \
        -w "$password" &>/dev/null

    if [ $? -eq 0 ]; then
        echo "✅ Authentication successful for $username"
        return 0
    else
        echo "❌ Authentication failed for $username"
        return 1
    fi
}

get_user_groups() {
    local username=$1

    ldapsearch -x -H ldap://$LDAP_HOST:$LDAP_PORT \
        -D "$LDAP_BIND_DN" -w "$LDAP_BIND_PW" \
        -b "ou=groups,$LDAP_BASE_DN" \
        "(member=uid=$username,ou=users,$LDAP_BASE_DN)" cn | \
        grep "^cn:" | cut -d' ' -f2
}

check_group_membership() {
    local username=$1
    local groupname=$2

    groups=$(get_user_groups $username)

    if echo "$groups" | grep -q "^$groupname$"; then
        echo "✅ $username is member of $groupname"
        return 0
    else
        echo "❌ $username is NOT member of $groupname"
        return 1
    fi
}

# Main
case "$1" in
    auth)
        authenticate_user "$2" "$3"
        ;;
    groups)
        get_user_groups "$2"
        ;;
    check-group)
        check_group_membership "$2" "$3"
        ;;
    *)
        echo "Usage:"
        echo "  $0 auth <username> <password>"
        echo "  $0 groups <username>"
        echo "  $0 check-group <username> <groupname>"
        ;;
esac
```

Test:

```bash
chmod +x ldap-auth.sh

# Test authentication
./ldap-auth.sh auth alice alice_password

# Get user groups
./ldap-auth.sh groups alice

# Check group membership
./ldap-auth.sh check-group alice developers
```

### Step 7: Application LDAP Integration (Python Example)

Create `ldap-app.py`:

```python
#!/usr/bin/env python3
# ldap-app.py - Python LDAP integration example

import ldap
from ldap.filter import filter_format

class LDAPAuth:
    def __init__(self, server, base_dn, bind_dn, bind_password):
        self.server = server
        self.base_dn = base_dn
        self.bind_dn = bind_dn
        self.bind_password = bind_password
        self.conn = None

    def connect(self):
        """Connect and bind to LDAP server"""
        try:
            self.conn = ldap.initialize(f'ldap://{self.server}')
            self.conn.simple_bind_s(self.bind_dn, self.bind_password)
            print(f"✅ Connected to LDAP server: {self.server}")
            return True
        except ldap.LDAPError as e:
            print(f"❌ LDAP connection failed: {e}")
            return False

    def authenticate(self, username, password):
        """Authenticate user"""
        try:
            user_dn = f"uid={username},ou=users,{self.base_dn}"
            conn = ldap.initialize(f'ldap://{self.server}')
            conn.simple_bind_s(user_dn, password)
            conn.unbind_s()
            print(f"✅ Authentication successful: {username}")
            return True
        except ldap.INVALID_CREDENTIALS:
            print(f"❌ Invalid credentials: {username}")
            return False
        except ldap.LDAPError as e:
            print(f"❌ LDAP error: {e}")
            return False

    def get_user_info(self, username):
        """Get user information"""
        try:
            search_filter = filter_format("(uid=%s)", [username])
            result = self.conn.search_s(
                f"ou=users,{self.base_dn}",
                ldap.SCOPE_SUBTREE,
                search_filter,
                ['cn', 'mail', 'uid']
            )

            if result:
                dn, attrs = result[0]
                return {
                    'dn': dn,
                    'cn': attrs.get('cn', [b''])[0].decode(),
                    'mail': attrs.get('mail', [b''])[0].decode(),
                    'uid': attrs.get('uid', [b''])[0].decode()
                }
        except ldap.LDAPError as e:
            print(f"❌ Search error: {e}")
        return None

    def get_user_groups(self, username):
        """Get user's groups"""
        try:
            user_dn = f"uid={username},ou=users,{self.base_dn}"
            search_filter = filter_format("(member=%s)", [user_dn])
            result = self.conn.search_s(
                f"ou=groups,{self.base_dn}",
                ldap.SCOPE_SUBTREE,
                search_filter,
                ['cn']
            )

            groups = [attrs.get('cn', [b''])[0].decode() for dn, attrs in result]
            return groups
        except ldap.LDAPError as e:
            print(f"❌ Group search error: {e}")
        return []

    def disconnect(self):
        """Disconnect from LDAP"""
        if self.conn:
            self.conn.unbind_s()
            print("✅ Disconnected from LDAP")

# Main
if __name__ == "__main__":
    # Initialize
    ldap_auth = LDAPAuth(
        server="localhost:389",
        base_dn="dc=example,dc=com",
        bind_dn="cn=admin,dc=example,dc=com",
        bind_password="admin_password"
    )

    # Connect
    if ldap_auth.connect():
        # Test authentication
        ldap_auth.authenticate("alice", "alice_password")

        # Get user info
        user_info = ldap_auth.get_user_info("alice")
        print(f"User info: {user_info}")

        # Get groups
        groups = ldap_auth.get_user_groups("alice")
        print(f"Groups: {groups}")

        # Disconnect
        ldap_auth.disconnect()
```

Run:

```bash
# Install dependencies
pip3 install python-ldap

# Run script
python3 ldap-app.py
```

## ✅ Verification

### 1. Verify LDAP Server

```bash
# Check Docker containers
docker-compose ps

# Test LDAP bind
ldapwhoami -x -H ldap://localhost:389 -D "cn=admin,dc=example,dc=com" -w admin_password

# Browse directory
ldapsearch -x -H ldap://localhost:389 -D "cn=admin,dc=example,dc=com" -w admin_password -b "dc=example,dc=com"
```

### 2. Test User Authentication

```bash
# Test each user
for user in alice bob carol; do
    echo "Testing $user..."
    ldapwhoami -x -H ldap://localhost:389 -D "uid=$user,ou=users,dc=example,dc=com" -w ${user}_password
done
```

### 3. Verify Group Memberships

```bash
# Check all groups
ldapsearch -x -H ldap://localhost:389 -D "cn=admin,dc=example,dc=com" -w admin_password -b "ou=groups,dc=example,dc=com" member

# Use helper script
./ldap-auth.sh groups alice
./ldap-auth.sh groups bob
```

## 🧪 Exploration Commands

```bash
# Add new user
cat <<EOF | ldapadd -x -D "cn=admin,dc=example,dc=com" -w admin_password
dn: uid=dave,ou=users,dc=example,dc=com
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: dave
cn: Dave Admin
sn: Admin
mail: dave@example.com
userPassword: dave_password
uidNumber: 10004
gidNumber: 10004
homeDirectory: /home/dave
loginShell: /bin/bash
EOF

# Modify user
ldapmodify -x -D "cn=admin,dc=example,dc=com" -w admin_password <<EOF
dn: uid=alice,ou=users,dc=example,dc=com
changetype: modify
replace: mail
mail: alice.new@example.com
EOF

# Delete user
ldapdelete -x -D "cn=admin,dc=example,dc=com" -w admin_password "uid=dave,ou=users,dc=example,dc=com"

# Change password
ldappasswd -x -D "cn=admin,dc=example,dc=com" -w admin_password -S "uid=alice,ou=users,dc=example,dc=com"
```

## 🧹 Cleanup

```bash
# Stop Docker services
docker-compose down

# Remove volumes
docker volume rm $(docker volume ls -q | grep ldap)

# Remove PAM configuration
sudo pam-auth-update --remove ldap

echo "✅ Cleanup completed"
```

## 📚 What You Learned

✅ Setting up OpenLDAP server
✅ Creating LDAP directory structure
✅ Implementing LDAP authentication
✅ Integrating LDAP with Linux PAM
✅ Configuring Kubernetes LDAP auth with Dex
✅ Building LDAP-enabled applications
✅ Managing users and groups in LDAP

## 🎓 Key Concepts

**LDAP Distinguished Names**:
- `dc`: Domain Component
- `ou`: Organizational Unit
- `cn`: Common Name
- `uid`: User ID

**LDAP Operations**:
- `bind`: Authenticate
- `search`: Query
- `add`: Create entry
- `modify`: Update entry
- `delete`: Remove entry

## 🔜 Next Steps

Move to [08_multi_tenant_isolation](../08_multi_tenant_isolation/) where you'll:
- Implement namespace isolation
- Configure resource quotas
- Set up network policies
- Implement tenant-specific RBAC

## 💡 Pro Tips

1. **Use LDAPS for production**:
   ```bash
   ldapsearch -H ldaps://localhost:636 -D "cn=admin,dc=example,dc=com" -w password
   ```

2. **Monitor LDAP queries**:
   ```bash
   docker exec openldap tail -f /var/log/slapd.log
   ```

3. **Backup LDAP**:
   ```bash
   ldapsearch -x -D "cn=admin,dc=example,dc=com" -w password -b "dc=example,dc=com" > backup.ldif
   ```

## 🆘 Troubleshooting

**Problem**: `ldap_bind: Invalid credentials`
**Solution**: Check DN and password
```bash
ldapwhoami -x -H ldap://localhost:389 -D "uid=alice,ou=users,dc=example,dc=com" -w correct_password
```

**Problem**: `Can't contact LDAP server`
**Solution**: Check LDAP service is running
```bash
docker-compose ps
netstat -tuln | grep 389
```

## 📖 Additional Reading

- [OpenLDAP Documentation](https://www.openldap.org/doc/)
- [LDAP for Rocket Scientists](http://www.zytrax.com/books/ldap/)
- [Kubernetes LDAP Auth](https://kubernetes.io/docs/reference/access-authn-authz/authentication/)

---

**Estimated Time**: 60 minutes
**Difficulty**: Intermediate
**Cost**: Free (local setup)
