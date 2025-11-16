# Security Tutorial 03: AWS IAM (Identity and Access Management)

## 🎯 Learning Objectives

- Understand AWS IAM users, groups, and roles
- Create and manage IAM policies
- Implement least privilege access
- Use IAM roles for EC2 and Lambda
- Configure cross-account access
- Implement MFA (Multi-Factor Authentication)
- Audit IAM permissions

## 📋 Prerequisites

- AWS account with admin access
- AWS CLI installed and configured
- Basic understanding of AWS services
- jq installed (for JSON parsing)

## 📝 What We're Building

```
AWS Account
├── IAM Users
│   ├── developer (with MFA)
│   ├── operator
│   └── auditor (read-only)
├── IAM Groups
│   ├── Developers (full dev access)
│   ├── Operators (limited production)
│   └── Auditors (read-only)
├── IAM Roles
│   ├── EC2-S3-Access-Role
│   ├── Lambda-Execution-Role
│   └── Cross-Account-Role
└── IAM Policies
    ├── S3-Read-Write
    ├── EC2-Start-Stop
    └── CloudWatch-Logs-Read
```

## 🔍 Concepts Introduced

1. **IAM Users**: Permanent named identities
2. **IAM Groups**: Collections of users with shared permissions
3. **IAM Roles**: Assumable identities for AWS services or cross-account access
4. **IAM Policies**: JSON documents defining permissions
5. **Trust Policies**: Define who can assume a role
6. **MFA**: Multi-factor authentication for enhanced security

## 📁 Step-by-Step Implementation

### Step 1: Create IAM Groups

Create `create-groups.sh`:

```bash
#!/bin/bash
# create-groups.sh - Create IAM groups

set -e

# Create Developers group
aws iam create-group --group-name Developers

# Create Operators group
aws iam create-group --group-name Operators

# Create Auditors group
aws iam create-group --group-name Auditors

echo "✅ Groups created successfully"

# List groups
aws iam list-groups
```

Run:

```bash
chmod +x create-groups.sh
./create-groups.sh
```

### Step 2: Create IAM Policies

Create `developer-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2FullAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ec2:ResourceTag/Environment": "development"
        }
      }
    },
    {
      "Sid": "S3DevBucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::dev-*",
        "arn:aws:s3:::dev-*/*"
      ]
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/dev/*"
    },
    {
      "Sid": "IAMReadOnly",
      "Effect": "Allow",
      "Action": [
        "iam:GetUser",
        "iam:ListUsers",
        "iam:ListGroups",
        "iam:GetPolicy",
        "iam:ListPolicies"
      ],
      "Resource": "*"
    }
  ]
}
```

Create `operator-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2StartStop",
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:RebootInstances",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ec2:ResourceTag/Environment": ["production", "staging"]
        }
      }
    },
    {
      "Sid": "S3ReadOnly",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::prod-*",
        "arn:aws:s3:::prod-*/*"
      ]
    },
    {
      "Sid": "CloudWatchMetrics",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:DescribeAlarms"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LogsReadOnly",
      "Effect": "Allow",
      "Action": [
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents",
        "logs:FilterLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

Create `auditor-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOnlyAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "s3:ListBucket",
        "iam:List*",
        "iam:Get*",
        "cloudwatch:Describe*",
        "cloudwatch:Get*",
        "cloudwatch:List*",
        "logs:Describe*",
        "logs:Get*",
        "logs:FilterLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DenyDestructiveActions",
      "Effect": "Deny",
      "Action": [
        "*:Delete*",
        "*:Terminate*",
        "*:Remove*"
      ],
      "Resource": "*"
    }
  ]
}
```

Create policies:

```bash
# Create and attach Developer policy
aws iam create-policy \
  --policy-name DeveloperAccess \
  --policy-document file://developer-policy.json

DEV_POLICY_ARN=$(aws iam list-policies --query 'Policies[?PolicyName==`DeveloperAccess`].Arn' --output text)

aws iam attach-group-policy \
  --group-name Developers \
  --policy-arn $DEV_POLICY_ARN

# Create and attach Operator policy
aws iam create-policy \
  --policy-name OperatorAccess \
  --policy-document file://operator-policy.json

OP_POLICY_ARN=$(aws iam list-policies --query 'Policies[?PolicyName==`OperatorAccess`].Arn' --output text)

aws iam attach-group-policy \
  --group-name Operators \
  --policy-arn $OP_POLICY_ARN

# Create and attach Auditor policy
aws iam create-policy \
  --policy-name AuditorAccess \
  --policy-document file://auditor-policy.json

AUDIT_POLICY_ARN=$(aws iam list-policies --query 'Policies[?PolicyName==`AuditorAccess`].Arn' --output text)

aws iam attach-group-policy \
  --group-name Auditors \
  --policy-arn $AUDIT_POLICY_ARN
```

### Step 3: Create IAM Users

Create `create-users.sh`:

```bash
#!/bin/bash
# create-users.sh - Create IAM users

set -e

# Create developer user
aws iam create-user --user-name developer
aws iam add-user-to-group --user-name developer --group-name Developers
aws iam create-login-profile --user-name developer --password 'TempPassword123!' --password-reset-required

# Create operator user
aws iam create-user --user-name operator
aws iam add-user-to-group --user-name operator --group-name Operators
aws iam create-login-profile --user-name operator --password 'TempPassword123!' --password-reset-required

# Create auditor user
aws iam create-user --user-name auditor
aws iam add-user-to-group --user-name auditor --group-name Auditors
aws iam create-login-profile --user-name auditor --password 'TempPassword123!' --password-reset-required

echo "✅ Users created successfully"

# List users
aws iam list-users
```

Run:

```bash
chmod +x create-users.sh
./create-users.sh
```

### Step 4: Enable MFA for Users

Create `enable-mfa.sh`:

```bash
#!/bin/bash
# enable-mfa.sh - Enable virtual MFA for a user

USER_NAME=${1:-developer}

# Create virtual MFA device
MFA_SERIAL=$(aws iam create-virtual-mfa-device \
  --virtual-mfa-device-name ${USER_NAME}-mfa \
  --outfile /tmp/${USER_NAME}-qr.png \
  --bootstrap-method QRCodePNG \
  --query 'VirtualMFADevice.SerialNumber' \
  --output text)

echo "✅ MFA device created: $MFA_SERIAL"
echo "📱 QR code saved to: /tmp/${USER_NAME}-qr.png"
echo ""
echo "To enable MFA:"
echo "1. Scan QR code with authenticator app"
echo "2. Enter two consecutive codes:"
read -p "Code 1: " CODE1
read -p "Code 2: " CODE2

# Enable MFA device
aws iam enable-mfa-device \
  --user-name $USER_NAME \
  --serial-number $MFA_SERIAL \
  --authentication-code1 $CODE1 \
  --authentication-code2 $CODE2

echo "✅ MFA enabled for $USER_NAME"
```

### Step 5: Create IAM Roles

Create `ec2-role-trust-policy.json`:

```json
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
```

Create `ec2-s3-access-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ReadWrite",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::my-app-bucket",
        "arn:aws:s3:::my-app-bucket/*"
      ]
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

Create the role:

```bash
# Create EC2 role
aws iam create-role \
  --role-name EC2-S3-Access-Role \
  --assume-role-policy-document file://ec2-role-trust-policy.json

# Attach inline policy
aws iam put-role-policy \
  --role-name EC2-S3-Access-Role \
  --policy-name S3AccessPolicy \
  --policy-document file://ec2-s3-access-policy.json

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name EC2-S3-Access-Profile

# Add role to instance profile
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-S3-Access-Profile \
  --role-name EC2-S3-Access-Role

echo "✅ EC2 role created"
```

### Step 6: Create Lambda Execution Role

Create `lambda-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create role:

```bash
# Create Lambda role
aws iam create-role \
  --role-name Lambda-Execution-Role \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach AWS managed policy
aws iam attach-role-policy \
  --role-name Lambda-Execution-Role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Attach custom S3 access
aws iam attach-role-policy \
  --role-name Lambda-Execution-Role \
  --policy-arn $(aws iam list-policies --query 'Policies[?PolicyName==`DeveloperAccess`].Arn' --output text)
```

### Step 7: Create Cross-Account Role

Create `cross-account-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:root"
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
```

**Note**: Replace `123456789012` with the trusted account ID.

Create role:

```bash
# Create cross-account role
aws iam create-role \
  --role-name Cross-Account-S3-Access \
  --assume-role-policy-document file://cross-account-trust-policy.json

# Attach S3 read-only policy
aws iam attach-role-policy \
  --role-name Cross-Account-S3-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
```

## ✅ Verification

### 1. List IAM Resources

```bash
# List users
aws iam list-users

# List groups
aws iam list-groups

# List roles
aws iam list-roles --query 'Roles[?contains(RoleName, `EC2`) || contains(RoleName, `Lambda`) || contains(RoleName, `Cross`)]'

# List policies
aws iam list-policies --scope Local
```

### 2. Check User Group Membership

```bash
# Check developer's groups
aws iam list-groups-for-user --user-name developer

# Check attached group policies
aws iam list-attached-group-policies --group-name Developers
```

### 3. Simulate IAM Policy

```bash
# Test if developer can list S3 buckets
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT_ID:user/developer \
  --action-names s3:ListAllMyBuckets \
  --query 'EvaluationResults[0].EvalDecision'

# Test if operator can terminate EC2
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT_ID:user/operator \
  --action-names ec2:TerminateInstances \
  --query 'EvaluationResults[0].EvalDecision'
```

### 4. Test Role Assumption

```bash
# Assume EC2 role (from EC2 instance)
aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT_ID:role/EC2-S3-Access-Role \
  --role-session-name test-session

# Assume cross-account role
aws sts assume-role \
  --role-arn arn:aws:iam::TARGET_ACCOUNT:role/Cross-Account-S3-Access \
  --role-session-name cross-account-session \
  --external-id unique-external-id-12345
```

### 5. Check MFA Status

```bash
# List MFA devices for user
aws iam list-mfa-devices --user-name developer

# Get user details including MFA
aws iam get-user --user-name developer
```

## 🧪 Exploration Commands

### IAM Analysis

```bash
# Get policy document
aws iam get-policy-version \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/DeveloperAccess \
  --version-id v1 \
  --query 'PolicyVersion.Document'

# List all attached policies for a user
aws iam list-attached-user-policies --user-name developer

# List inline policies for a role
aws iam list-role-policies --role-name EC2-S3-Access-Role

# Get role's trust policy
aws iam get-role --role-name EC2-S3-Access-Role --query 'Role.AssumeRolePolicyDocument'

# List entities attached to a policy
aws iam list-entities-for-policy \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/DeveloperAccess
```

### Access Analyzer

```bash
# Create access analyzer
aws accessanalyzer create-analyzer \
  --analyzer-name my-account-analyzer \
  --type ACCOUNT

# List findings
aws accessanalyzer list-findings \
  --analyzer-arn arn:aws:access-analyzer:region:account-id:analyzer/my-account-analyzer

# Get credential report
aws iam generate-credential-report
aws iam get-credential-report --output text | base64 -d > credential-report.csv
```

### IAM Policy Simulator

```bash
# Test multiple actions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT_ID:user/developer \
  --action-names s3:PutObject ec2:RunInstances rds:CreateDBInstance \
  --resource-arns arn:aws:s3:::dev-bucket/* \
  --output table
```

## 🧹 Cleanup

Create `cleanup.sh`:

```bash
#!/bin/bash
# cleanup.sh - Clean up IAM resources

set -e

# Detach and delete user policies
for USER in developer operator auditor; do
  # Remove from groups
  for GROUP in $(aws iam list-groups-for-user --user-name $USER --query 'Groups[].GroupName' --output text); do
    aws iam remove-user-from-group --user-name $USER --group-name $GROUP
  done

  # Delete login profile
  aws iam delete-login-profile --user-name $USER 2>/dev/null || true

  # Delete MFA devices
  for MFA in $(aws iam list-mfa-devices --user-name $USER --query 'MFADevices[].SerialNumber' --output text); do
    aws iam deactivate-mfa-device --user-name $USER --serial-number $MFA
    aws iam delete-virtual-mfa-device --serial-number $MFA
  done

  # Delete user
  aws iam delete-user --user-name $USER
done

# Detach and delete group policies
for GROUP in Developers Operators Auditors; do
  for POLICY in $(aws iam list-attached-group-policies --group-name $GROUP --query 'AttachedPolicies[].PolicyArn' --output text); do
    aws iam detach-group-policy --group-name $GROUP --policy-arn $POLICY
  done
  aws iam delete-group --group-name $GROUP
done

# Delete custom policies
for POLICY_NAME in DeveloperAccess OperatorAccess AuditorAccess; do
  POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text)
  if [ ! -z "$POLICY_ARN" ]; then
    aws iam delete-policy --policy-arn $POLICY_ARN
  fi
done

# Delete roles
for ROLE in EC2-S3-Access-Role Lambda-Execution-Role Cross-Account-S3-Access; do
  # Detach managed policies
  for POLICY in $(aws iam list-attached-role-policies --role-name $ROLE --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null); do
    aws iam detach-role-policy --role-name $ROLE --policy-arn $POLICY
  done

  # Delete inline policies
  for POLICY_NAME in $(aws iam list-role-policies --role-name $ROLE --query 'PolicyNames[]' --output text 2>/dev/null); do
    aws iam delete-role-policy --role-name $ROLE --policy-name $POLICY_NAME
  done

  # Remove from instance profiles
  for PROFILE in $(aws iam list-instance-profiles-for-role --role-name $ROLE --query 'InstanceProfiles[].InstanceProfileName' --output text 2>/dev/null); do
    aws iam remove-role-from-instance-profile --instance-profile-name $PROFILE --role-name $ROLE
    aws iam delete-instance-profile --instance-profile-name $PROFILE
  done

  # Delete role
  aws iam delete-role --role-name $ROLE 2>/dev/null || true
done

echo "✅ Cleanup completed"
```

Run:

```bash
chmod +x cleanup.sh
./cleanup.sh
```

## 📚 What You Learned

✅ Creating and managing IAM users, groups, and roles
✅ Writing IAM policies with conditions and permissions
✅ Implementing MFA for enhanced security
✅ Creating service roles for EC2 and Lambda
✅ Setting up cross-account access
✅ Using IAM policy simulator
✅ Implementing least privilege principle

## 🎓 Key Concepts

**IAM Best Practices**:
1. **Least Privilege**: Grant minimum permissions needed
2. **Use Groups**: Assign permissions to groups, not users
3. **Enable MFA**: Especially for privileged users
4. **Rotate Credentials**: Regularly rotate access keys
5. **Use Roles**: For AWS services and cross-account access
6. **Monitor Activity**: Use CloudTrail and Access Analyzer
7. **Strong Passwords**: Enforce password policy

**Policy Structure**:
- **Effect**: Allow or Deny
- **Action**: AWS API actions
- **Resource**: ARNs of resources
- **Condition**: Additional constraints (tags, IP, MFA, etc.)

**Role vs User**:
- **Users**: Permanent identities with credentials
- **Roles**: Temporary assumable identities
- **Services use roles**: EC2, Lambda, ECS, etc.
- **Cross-account uses roles**: More secure than sharing keys

## 🔜 Next Steps

Move to [04_azure_rbac](../04_azure_rbac/) where you'll:
- Learn Azure Active Directory and RBAC
- Create Azure role assignments
- Implement managed identities
- Configure conditional access

## 💡 Pro Tips

1. **Use AWS managed policies when possible**:
   ```bash
   aws iam attach-group-policy \
     --group-name Developers \
     --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
   ```

2. **Tag IAM resources**:
   ```bash
   aws iam tag-user \
     --user-name developer \
     --tags Key=Team,Value=Engineering Key=Environment,Value=Dev
   ```

3. **Create policy from AWS CLI command**:
   ```bash
   # Use --dry-run to see required permissions
   aws ec2 run-instances --dry-run ...
   ```

4. **Export IAM configuration**:
   ```bash
   # Backup all IAM users
   aws iam list-users | jq -r '.Users[] | @json' > iam-users-backup.json
   ```

## 🆘 Troubleshooting

**Problem**: `Access Denied` when creating resources
**Solution**: Check IAM permissions
```bash
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT_ID:user/USERNAME \
  --action-names ACTION_NAME
```

**Problem**: Cannot assume role
**Solution**: Check trust policy allows your principal
```bash
aws iam get-role --role-name ROLE_NAME --query 'Role.AssumeRolePolicyDocument'
```

**Problem**: MFA token keeps failing
**Solution**: Check time synchronization
```bash
sudo ntpdate pool.ntp.org
```

**Problem**: Policy too large
**Solution**: Use multiple policies or managed policies
```bash
# Policies have 6144 character limit for users, 10240 for roles
```

## 📖 Additional Reading

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [IAM Policy Reference](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies.html)
- [IAM Roles for EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)

---

**Estimated Time**: 60-75 minutes
**Difficulty**: Intermediate
**Cost**: Free tier eligible (minimal cost for advanced features)
