# Security Tutorial 01: Basic Secrets Management

## 🎯 Learning Objectives

- Understand secrets management fundamentals
- Use environment variables securely
- Manage .env files properly
- Implement basic secret rotation
- Understand common security pitfalls
- Use secret scanning tools

## 📋 Prerequisites

- Basic Linux/Unix knowledge
- Understanding of environment variables
- Git installed (for secret scanning)

## 📝 What We're Building

```
Secrets Management
├── Environment Variables
├── .env Files (gitignored)
├── Configuration Management
├── Secret Rotation Scripts
└── Security Best Practices
```

## 🔍 Concepts Introduced

1. **Secrets**: Sensitive data (passwords, API keys, tokens)
2. **Environment Variables**: OS-level key-value pairs
3. **.env Files**: Configuration files with secrets
4. **Secret Rotation**: Regularly changing secrets
5. **Principle of Least Privilege**: Minimal access
6. **Defense in Depth**: Multiple security layers

## 📁 Step-by-Step Implementation

### Step 1: Understanding Environment Variables

```bash
# Set environment variable
export DATABASE_PASSWORD="my-secret-password"

# View environment variable
echo $DATABASE_PASSWORD

# Use in application
cat > app.sh <<'EOF'
#!/bin/bash
echo "Connecting to database with password: $DATABASE_PASSWORD"
EOF

chmod +x app.sh
./app.sh

# Unset when done
unset DATABASE_PASSWORD
```

**Security Issue**: Environment variables visible in process list!

```bash
# DO NOT DO THIS - visible to all users
ps aux | grep DATABASE_PASSWORD
```

### Step 2: Create .env File Structure

Create `.env.example` (template, safe to commit):

```bash
# .env.example - Template for environment variables
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp
DATABASE_USER=appuser
DATABASE_PASSWORD=CHANGEME

API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
```

Create actual `.env` file (NEVER commit):

```bash
# .env - Actual secrets (ADD TO .gitignore!)
DATABASE_HOST=prod-db.example.com
DATABASE_PORT=5432
DATABASE_NAME=production_db
DATABASE_USER=prod_user
DATABASE_PASSWORD=SuperSecretPassword123!

API_KEY=sk-1234567890abcdef
SECRET_KEY=abcdef1234567890

AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
```

### Step 3: Proper .gitignore Configuration

Create/update `.gitignore`:

```bash
cat > .gitignore <<'EOF'
# Environment files
.env
.env.local
.env.*.local
.env.production
.env.development

# Secrets and credentials
*.key
*.pem
*.p12
*.pfx
secrets/
credentials/

# Cloud provider configs
.aws/credentials
.gcp/credentials.json
.azure/credentials

# Database
*.sql
*.db

# Logs (may contain sensitive data)
*.log
logs/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF
```

Verify `.env` is ignored:

```bash
# Initialize git if needed
git init

# Add .gitignore
git add .gitignore
git commit -m "Add .gitignore"

# Verify .env is ignored
git status  # Should NOT show .env file
```

### Step 4: Load Environment Variables from .env

Create `load-env.sh`:

```bash
#!/bin/bash
# load-env.sh - Safely load environment variables from .env file

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file $ENV_FILE not found"
    exit 1
fi

# Check file permissions (should be 600 or 640)
PERMS=$(stat -c "%a" "$ENV_FILE")
if [ "$PERMS" != "600" ] && [ "$PERMS" != "640" ]; then
    echo "⚠️  Warning: $ENV_FILE has insecure permissions: $PERMS"
    echo "   Run: chmod 600 $ENV_FILE"
fi

# Load variables
set -a  # Automatically export all variables
source "$ENV_FILE"
set +a

echo "✅ Environment variables loaded from $ENV_FILE"

# Optional: Validate required variables
REQUIRED_VARS=(
    "DATABASE_PASSWORD"
    "API_KEY"
    "SECRET_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required variable $var is not set"
        exit 1
    fi
done

echo "✅ All required variables are set"
```

Use it:

```bash
chmod +x load-env.sh

# Load environment variables
source load-env.sh

# Verify
echo "Database: $DATABASE_NAME"
echo "API Key present: ${API_KEY:+YES}"  # Don't print actual value!
```

### Step 5: Create Application Using Secrets

Create `app.py` (Python example):

```python
#!/usr/bin/env python3
# app.py - Application using environment variables

import os
import sys

def get_secret(name, required=True):
    """Get secret from environment with error handling"""
    value = os.environ.get(name)

    if required and not value:
        print(f"❌ Required environment variable {name} is not set")
        sys.exit(1)

    # Log that we have the secret (but not the value!)
    if value:
        print(f"✅ {name} loaded (length: {len(value)})")
    else:
        print(f"⚠️  {name} is optional and not set")

    return value

def main():
    print("🔐 Loading secrets...")

    # Required secrets
    db_password = get_secret("DATABASE_PASSWORD")
    api_key = get_secret("API_KEY")
    secret_key = get_secret("SECRET_KEY")

    # Optional secrets
    aws_key = get_secret("AWS_ACCESS_KEY_ID", required=False)

    print("\n✅ All secrets loaded successfully")

    # Use secrets in your application
    # NEVER log the actual secret values!
    print(f"\n🔗 Connecting to database...")
    print(f"   Host: {os.environ.get('DATABASE_HOST')}")
    print(f"   Port: {os.environ.get('DATABASE_PORT')}")
    print(f"   Database: {os.environ.get('DATABASE_NAME')}")
    print(f"   User: {os.environ.get('DATABASE_USER')}")
    # print(f"   Password: {db_password}")  # NEVER DO THIS!

if __name__ == "__main__":
    main()
```

Run it:

```bash
chmod +x app.py

# Load environment and run
source load-env.sh && ./app.py
```

### Step 6: Implement Secret Rotation

Create `rotate-secret.sh`:

```bash
#!/bin/bash
# rotate-secret.sh - Rotate a secret and update .env file

SECRET_NAME=$1
ENV_FILE="${2:-.env}"

if [ -z "$SECRET_NAME" ]; then
    echo "Usage: $0 SECRET_NAME [ENV_FILE]"
    echo "Example: $0 DATABASE_PASSWORD"
    exit 1
fi

# Generate new secret (32 characters)
NEW_SECRET=$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-32)

# Create backup
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d%H%M%S)"

# Update .env file
if grep -q "^${SECRET_NAME}=" "$ENV_FILE"; then
    # Update existing
    sed -i "s/^${SECRET_NAME}=.*/${SECRET_NAME}=${NEW_SECRET}/" "$ENV_FILE"
    echo "✅ Updated $SECRET_NAME in $ENV_FILE"
else
    # Add new
    echo "${SECRET_NAME}=${NEW_SECRET}" >> "$ENV_FILE"
    echo "✅ Added $SECRET_NAME to $ENV_FILE"
fi

echo "🔑 New secret: $NEW_SECRET"
echo "⚠️  Update this in your production systems!"
echo "📦 Backup saved: ${ENV_FILE}.backup.*"
```

Use it:

```bash
chmod +x rotate-secret.sh

# Rotate a secret
./rotate-secret.sh SECRET_KEY

# Reload environment
source load-env.sh
```

### Step 7: Secret Scanning with TruffleHog

```bash
# Install TruffleHog
pip3 install truffleHog

# Scan git repository for secrets
trufflehog --regex --entropy=True .

# Scan specific file
trufflehog --regex --entropy=True file://path/to/file

# Use gitleaks (alternative)
# docker run --rm -v $(pwd):/path zricethezav/gitleaks:latest detect --source="/path" -v
```

### Step 8: Create Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# pre-commit hook - Prevent committing secrets

echo "🔍 Checking for secrets..."

# Check for common secret patterns
PATTERNS=(
    "password.*=.*['\"]"
    "api.?key.*=.*['\"]"
    "secret.*=.*['\"]"
    "token.*=.*['\"]"
    "BEGIN.*PRIVATE.*KEY"
    "aws_access_key_id"
    "AKIA[0-9A-Z]{16}"
)

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

for file in $STAGED_FILES; do
    for pattern in "${PATTERNS[@]}"; do
        if grep -iE "$pattern" "$file" &>/dev/null; then
            echo "❌ Potential secret found in $file"
            echo "   Pattern: $pattern"
            echo ""
            echo "If this is a false positive, you can:"
            echo "  1. Review and remove the secret"
            echo "  2. Use git commit --no-verify (NOT RECOMMENDED)"
            exit 1
        fi
    done
done

# Check if .env files are being committed
for file in $STAGED_FILES; do
    if [[ "$file" =~ \.env$ ]] && [[ ! "$file" =~ \.env\.example$ ]]; then
        echo "❌ Attempting to commit .env file: $file"
        echo "   Add it to .gitignore instead!"
        exit 1
    fi
done

echo "✅ No secrets detected"
exit 0
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit

# Test it
echo "password=secret123" > test.txt
git add test.txt
git commit -m "test"  # Should fail

rm test.txt
```

## ✅ Verification

### 1. Check File Permissions

```bash
# .env should be 600 (owner read/write only)
chmod 600 .env
ls -la .env

# Verify not in git
git status | grep -q ".env" && echo "❌ .env in git!" || echo "✅ .env not tracked"
```

### 2. Test Environment Loading

```bash
# Source environment
source load-env.sh

# Verify variables are set (don't print values!)
env | grep -E "(DATABASE|API|SECRET)" | sed 's/=.*/=***/'
```

### 3. Test Secret Rotation

```bash
# Rotate secret
./rotate-secret.sh TEST_SECRET

# Verify update
grep TEST_SECRET .env
```

## 🧪 Exploration Commands

```bash
# Generate random passwords
openssl rand -base64 32
openssl rand -hex 32

# Encrypt .env file
openssl enc -aes-256-cbc -salt -in .env -out .env.enc -k "your-encryption-password"

# Decrypt .env file
openssl enc -d -aes-256-cbc -in .env.enc -out .env -k "your-encryption-password"

# Find potential secrets in codebase
grep -r -i "password\|api.key\|secret" . --exclude-dir=".git" --exclude="*.md"
```

## 🧹 Cleanup

```bash
# Unset all environment variables
while IFS= read -r line; do
    var=$(echo "$line" | cut -d'=' -f1)
    unset "$var"
done < .env

# Remove test files
rm -f .env .env.backup.* test.txt

echo "✅ Cleanup completed"
```

## 📚 What You Learned

✅ Managing secrets with environment variables
✅ Creating and using .env files securely
✅ Implementing proper .gitignore
✅ Loading secrets in applications
✅ Rotating secrets
✅ Scanning for leaked secrets
✅ Preventing secret commits with hooks

## 🎓 Key Concepts

**Secret Management Best Practices**:
1. **Never commit secrets to version control**
2. **Use environment variables for secrets**
3. **Rotate secrets regularly**
4. **Use different secrets for each environment**
5. **Principle of least privilege**
6. **Encrypt secrets at rest**
7. **Audit secret access**

**Common Mistakes to Avoid**:
- Hardcoding secrets in code
- Committing .env files
- Logging secret values
- Sharing secrets via email/chat
- Using weak secrets
- Never rotating secrets

## 🔜 Next Steps

Move to [02_kubernetes_secrets](../02_kubernetes_secrets/) where you'll:
- Create Kubernetes secrets
- Use secrets in pods
- Implement sealed secrets
- Encrypt secrets at rest

## 💡 Pro Tips

1. **Use dotenv libraries**:
   ```python
   # Python
   from dotenv import load_dotenv
   load_dotenv()
   ```

2. **Generate strong secrets**:
   ```bash
   # 32-character alphanumeric
   openssl rand -base64 32 | tr -d '=+/' | cut -c1-32
   ```

3. **Template .env files**:
   ```bash
   cp .env.example .env
   # Then fill in actual values
   ```

4. **Encrypt backups**:
   ```bash
   tar czf - .env | gpg -c > env-backup.tar.gz.gpg
   ```

## 🆘 Troubleshooting

**Problem**: Environment variables not loading
**Solution**: Source the script
```bash
source load-env.sh  # Not ./load-env.sh
```

**Problem**: Secrets visible in process list
**Solution**: Use files instead of command line args
```bash
# Bad: ./app --password=secret
# Good: ./app --password-file=.env
```

**Problem**: Accidentally committed secrets
**Solution**: Remove from Git history
```bash
# Use BFG Repo-Cleaner or git-filter-branch
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all
```

## 📖 Additional Reading

- [12 Factor App - Config](https://12factor.net/config)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitGuardian - Secret Detection](https://www.gitguardian.com/)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog)

---

**Estimated Time**: 30-40 minutes
**Difficulty**: Beginner
**Cost**: Free
