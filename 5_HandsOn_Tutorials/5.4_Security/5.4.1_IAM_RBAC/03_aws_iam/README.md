# Tutorial 03: AWS IAM (Users, Groups, Policies)

## Objectives

By the end of this tutorial, you will:
- Understand AWS IAM architecture and components
- Create and manage IAM users and groups
- Write and attach IAM policies (managed and inline)
- Implement IAM roles for services and cross-account access
- Configure MFA (Multi-Factor Authentication)
- Apply security best practices
- Use IAM policy simulator
- Implement least privilege access

## Prerequisites

- AWS account (Free tier is sufficient)
- AWS CLI installed and configured
- Basic understanding of AWS services
- JSON knowledge for policies
- Terminal/command line access

## What is AWS IAM?

AWS Identity and Access Management (IAM) enables you to manage access to AWS services and resources securely. Using IAM, you can create and manage AWS users and groups, and use permissions to allow and deny their access to AWS resources.

### Key Components

- **Users**: Individual identities with credentials
- **Groups**: Collections of users with shared permissions
- **Roles**: Identities that services/apps can assume
- **Policies**: JSON documents defining permissions
- **MFA**: Multi-Factor Authentication for enhanced security
- **Identity Federation**: External identity integration

### IAM Architecture

```
Root Account (Avoid using!)
    ├── IAM Users (people/applications)
    ├── IAM Groups (collection of users)
    │   └── Attached Policies
    ├── IAM Roles (for services/cross-account)
    │   └── Trust Policy + Permission Policy
    └── Policies (JSON documents)
        ├── AWS Managed (created by AWS)
        ├── Customer Managed (created by you)
        └── Inline (directly attached)
```

## Why AWS IAM Matters

1. **Security**: Control who can access what
2. **Granular Permissions**: Fine-grained access control
3. **Free**: No cost for IAM usage
4. **Scalable**: Manages thousands of users
5. **Compliance**: Meets security standards
6. **Integration**: Works with all AWS services

## Step-by-Step Instructions

### Step 1: Setup AWS CLI

```bash
# Install AWS CLI (if not installed)
# macOS
brew install awscli

# Linux
pip3 install awscli

# Configure AWS CLI
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)

# Verify configuration
aws sts get-caller-identity

# Output shows your account ID and user ARN
```

### Step 2: Create IAM Users

```bash
# Create a user
aws iam create-user --user-name developer1

# Create multiple users
aws iam create-user --user-name developer2
aws iam create-user --user-name ops-engineer
aws iam create-user --user-name readonly-auditor

# List users
aws iam list-users

# Get user details
aws iam get-user --user-name developer1

# Create user with tags
aws iam create-user \
  --user-name developer3 \
  --tags Key=Department,Value=Engineering Key=Project,Value=WebApp

# Delete user
aws iam delete-user --user-name developer3
```

### Step 3: Create Access Keys

```bash
# Create access key for programmatic access
aws iam create-access-key --user-name developer1

# Output:
# {
#     "AccessKey": {
#         "UserName": "developer1",
#         "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
#         "Status": "Active",
#         "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
#         "CreateDate": "2024-11-20T10:00:00Z"
#     }
# }

# ⚠️ IMPORTANT: Save SecretAccessKey immediately - it won't be shown again

# List access keys
aws iam list-access-keys --user-name developer1

# Deactivate access key
aws iam update-access-key \
  --user-name developer1 \
  --access-key-id AKIAIOSFODNN7EXAMPLE \
  --status Inactive

# Delete access key
aws iam delete-access-key \
  --user-name developer1 \
  --access-key-id AKIAIOSFODNN7EXAMPLE
```

### Step 4: Create IAM Groups

```bash
# Create groups
aws iam create-group --group-name Developers
aws iam create-group --group-name Operations
aws iam create-group --group-name Admins

# List groups
aws iam list-groups

# Add user to group
aws iam add-user-to-group --user-name developer1 --group-name Developers
aws iam add-user-to-group --user-name developer2 --group-name Developers
aws iam add-user-to-group --user-name ops-engineer --group-name Operations

# List users in group
aws iam get-group --group-name Developers

# List groups for user
aws iam list-groups-for-user --user-name developer1

# Remove user from group
aws iam remove-user-from-group --user-name developer1 --group-name Developers
```

### Step 5: Create and Attach Policies

```bash
# Create a simple policy file
cat > s3-readonly-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-app-bucket",
        "arn:aws:s3:::my-app-bucket/*"
      ]
    }
  ]
}
EOF

# Create customer-managed policy
aws iam create-policy \
  --policy-name S3ReadOnlyMyApp \
  --policy-document file://s3-readonly-policy.json

# Attach AWS managed policy to group
aws iam attach-group-policy \
  --group-name Developers \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess

# Attach customer-managed policy to group
aws iam attach-group-policy \
  --group-name Developers \
  --policy-arn arn:aws:iam::123456789012:policy/S3ReadOnlyMyApp

# List attached group policies
aws iam list-attached-group-policies --group-name Developers

# Detach policy from group
aws iam detach-group-policy \
  --group-name Developers \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess
```

### Step 6: Advanced Policy Examples

```bash
# Policy 1: EC2 with conditions
cat > ec2-dev-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "ec2:StartInstances",
        "ec2:StopInstances"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ec2:InstanceType": ["t2.micro", "t2.small"],
          "aws:RequestedRegion": "us-east-1"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": "ec2:Describe*",
      "Resource": "*"
    }
  ]
}
EOF

# Policy 2: S3 with MFA delete
cat > s3-mfa-delete-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::production-bucket",
        "arn:aws:s3:::production-bucket/*"
      ]
    },
    {
      "Effect": "Deny",
      "Action": "s3:DeleteObject",
      "Resource": "arn:aws:s3:::production-bucket/*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
EOF

# Policy 3: Time-based access
cat > business-hours-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ec2:*",
      "Resource": "*",
      "Condition": {
        "DateGreaterThan": {"aws:CurrentTime": "2024-01-01T08:00:00Z"},
        "DateLessThan": {"aws:CurrentTime": "2024-12-31T18:00:00Z"}
      }
    }
  ]
}
EOF

# Policy 4: Tag-based access
cat > tag-based-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ec2:*",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ec2:ResourceTag/Environment": "Development"
        }
      }
    }
  ]
}
EOF

# Create all policies
aws iam create-policy --policy-name EC2DevPolicy --policy-document file://ec2-dev-policy.json
aws iam create-policy --policy-name S3MFADeletePolicy --policy-document file://s3-mfa-delete-policy.json
aws iam create-policy --policy-name BusinessHoursPolicy --policy-document file://business-hours-policy.json
aws iam create-policy --policy-name TagBasedPolicy --policy-document file://tag-based-policy.json
```

### Step 7: Create and Use IAM Roles

```bash
# Create trust policy for EC2
cat > ec2-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name EC2-S3-Access-Role \
  --assume-role-policy-document file://ec2-trust-policy.json

# Attach policy to role
aws iam attach-role-policy \
  --role-name EC2-S3-Access-Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# Create instance profile (needed for EC2)
aws iam create-instance-profile \
  --instance-profile-name EC2-S3-Access-Profile

# Add role to instance profile
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-S3-Access-Profile \
  --role-name EC2-S3-Access-Role

# List roles
aws iam list-roles

# Get role details
aws iam get-role --role-name EC2-S3-Access-Role
```

### Step 8: Cross-Account Access Role

```bash
# Trust policy for cross-account access
cat > cross-account-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::987654321098:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "unique-external-id-12345"
        }
      }
    }
  ]
}
EOF

# Create cross-account role
aws iam create-role \
  --role-name CrossAccountRole \
  --assume-role-policy-document file://cross-account-trust-policy.json

# Attach permissions
aws iam attach-role-policy \
  --role-name CrossAccountRole \
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess

# Assume role from another account
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/CrossAccountRole \
  --role-session-name my-session \
  --external-id unique-external-id-12345

# Use temporary credentials from output
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
```

### Step 9: Enable MFA

```bash
# Create virtual MFA device
aws iam create-virtual-mfa-device \
  --virtual-mfa-device-name developer1-mfa \
  --outfile /tmp/QRCode.png \
  --bootstrap-method QRCodePNG

# Scan QR code with Google Authenticator or similar app
# Get two consecutive codes

# Enable MFA for user
aws iam enable-mfa-device \
  --user-name developer1 \
  --serial-number arn:aws:iam::123456789012:mfa/developer1-mfa \
  --authentication-code-1 123456 \
  --authentication-code-2 789012

# List MFA devices
aws iam list-mfa-devices --user-name developer1

# Deactivate MFA
aws iam deactivate-mfa-device \
  --user-name developer1 \
  --serial-number arn:aws:iam::123456789012:mfa/developer1-mfa
```

### Step 10: IAM Policy Simulator

```bash
# Simulate policy via CLI
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:user/developer1 \
  --action-names s3:GetObject s3:PutObject \
  --resource-arns arn:aws:s3:::my-app-bucket/file.txt

# Simulate custom policy
aws iam simulate-custom-policy \
  --policy-input-list file://s3-readonly-policy.json \
  --action-names s3:GetObject s3:DeleteObject \
  --resource-arns arn:aws:s3:::my-app-bucket/file.txt

# Use web console: https://console.aws.amazon.com/iam/home#/policies/simulator
```

## Real-World Examples

### Example 1: Development Team Setup

```bash
#!/bin/bash
# setup-dev-team.sh

# Create developers group
aws iam create-group --group-name Developers

# Attach necessary policies
aws iam attach-group-policy \
  --group-name Developers \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess

aws iam attach-group-policy \
  --group-name Developers \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create custom policy for RDS read-only
cat > rds-readonly.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:Describe*",
        "rds:ListTagsForResource"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name RDSReadOnly \
  --policy-document file://rds-readonly.json

aws iam attach-group-policy \
  --group-name Developers \
  --policy-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/RDSReadOnly

# Create developers
for dev in alice bob charlie; do
  aws iam create-user --user-name $dev
  aws iam add-user-to-group --user-name $dev --group-name Developers
  aws iam create-login-profile \
    --user-name $dev \
    --password "TempPassword123!" \
    --password-reset-required
done
```

### Example 2: CI/CD Pipeline Role

```bash
# Trust policy for CodeBuild
cat > codebuild-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Permission policy for CI/CD
cat > cicd-permissions.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-artifacts-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create role and attach policy
aws iam create-role \
  --role-name CodeBuildServiceRole \
  --assume-role-policy-document file://codebuild-trust-policy.json

aws iam create-policy \
  --policy-name CICDPermissions \
  --policy-document file://cicd-permissions.json

aws iam attach-role-policy \
  --role-name CodeBuildServiceRole \
  --policy-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/CICDPermissions
```

## Security Best Practices

### 1. Root Account Security

```bash
# ✅ Do's
- Enable MFA on root account
- Don't use root for daily tasks
- Create IAM users instead
- Use root only for billing/account closure

# ❌ Don'ts
- Never create access keys for root
- Never share root credentials
- Never embed root credentials in code
```

### 2. Least Privilege

```json
// ✅ Good: Specific permissions
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:ListBucket"],
  "Resource": "arn:aws:s3:::specific-bucket/*"
}

// ❌ Bad: Wildcard permissions
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}
```

### 3. Credential Management

```bash
# Rotate access keys regularly
aws iam list-access-keys --user-name developer1

# Check key age
aws iam get-access-key-last-used \
  --access-key-id AKIAIOSFODNN7EXAMPLE

# Use IAM roles instead of access keys when possible
# For EC2, Lambda, ECS - use IAM roles
```

### 4. Policy Validation

```bash
# Validate policy syntax
aws iam simulate-custom-policy \
  --policy-input-list file://my-policy.json \
  --action-names ec2:DescribeInstances

# Use Access Analyzer
aws accessanalyzer create-analyzer \
  --analyzer-name my-analyzer \
  --type ACCOUNT
```

## Monitoring and Auditing

```bash
# Enable CloudTrail for IAM events
aws cloudtrail create-trail \
  --name iam-audit-trail \
  --s3-bucket-name my-cloudtrail-bucket

aws cloudtrail start-logging --name iam-audit-trail

# Generate IAM credential report
aws iam generate-credential-report
aws iam get-credential-report > credential-report.csv

# View policy versions
aws iam list-policy-versions \
  --policy-arn arn:aws:iam::123456789012:policy/MyPolicy

# Get specific policy version
aws iam get-policy-version \
  --policy-arn arn:aws:iam::123456789012:policy/MyPolicy \
  --version-id v1
```

## Troubleshooting

```bash
# Check effective permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:user/developer1 \
  --action-names s3:GetObject

# View policy document
aws iam get-policy \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

aws iam get-policy-version \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess \
  --version-id v1

# List all permissions for user
aws iam list-attached-user-policies --user-name developer1
aws iam list-user-policies --user-name developer1
aws iam list-groups-for-user --user-name developer1
```

## Key Takeaways

1. **Never use root account** for day-to-day operations
2. **Enable MFA** for all users, especially admins
3. **Apply least privilege** - grant minimum necessary permissions
4. **Use groups** to manage permissions, not individual users
5. **Rotate credentials** regularly
6. **Use IAM roles** for applications instead of access keys
7. **Audit regularly** with credential reports and CloudTrail
8. **Document policies** with clear descriptions

## Additional Resources

- [AWS IAM Documentation](https://docs.aws.amazon.com/IAM/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [IAM Policy Simulator](https://policysim.aws.amazon.com/)
- [IAM Access Analyzer](https://aws.amazon.com/iam/features/analyze-access/)

## Next Steps

- Tutorial 04: Azure AD and RBAC
- Tutorial 05: GCP IAM
- Integrate IAM with CI/CD pipelines
- Implement cross-account access strategies

---

**Difficulty**: Intermediate
**Estimated Time**: 3-4 hours
**Cost**: Free (IAM has no cost)
**Practice**: Set up IAM for your AWS projects
