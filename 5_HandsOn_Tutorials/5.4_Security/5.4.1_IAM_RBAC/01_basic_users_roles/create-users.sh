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
