# 5.4.1 IAM & RBAC - Identity and Access Management

## Overview

Master Identity and Access Management (IAM) and Role-Based Access Control (RBAC) across multiple platforms. Learn to implement least privilege access, manage identities, and secure your infrastructure from the identity layer up.

## Tutorials

### [01 - Linux Permissions](./01_linux_permissions/)
**Foundation of system security**
- Linux users, groups, and file permissions
- chmod, chown, and ACLs
- sudo configuration
- Special permissions (setuid, setgid, sticky bit)
- Real-world application deployment examples

**Time**: 2-3 hours | **Difficulty**: Beginner

### [02 - Kubernetes RBAC](./02_kubernetes_rbac/)
**Kubernetes access control**
- ServiceAccounts, Roles, and RoleBindings
- ClusterRoles and ClusterRoleBindings
- Testing and debugging RBAC
- Real-world CI/CD and monitoring examples

**Time**: 3-4 hours | **Difficulty**: Intermediate

### [03 - AWS IAM](./03_aws_iam/)
**AWS identity management**
- Users, Groups, and Policies
- IAM Roles and cross-account access
- MFA and credential management
- Policy simulator and best practices

**Time**: 3-4 hours | **Difficulty**: Intermediate

### [04 - Azure AD and RBAC](./04_azure_ad_rbac/)
**Microsoft cloud identity**
- Azure Active Directory fundamentals
- Azure RBAC roles and assignments
- Managed identities for Azure resources
- Conditional access policies

**Time**: 3-4 hours | **Difficulty**: Intermediate

### [05 - GCP IAM](./05_gcp_iam/)
**Google Cloud identity**
- GCP IAM members and roles
- Service accounts and keys
- Organization policies
- Resource hierarchy and inheritance

**Time**: 3 hours | **Difficulty**: Intermediate

### [06 - Policy as Code (OPA)](./06_policy_as_code_opa/)
**Declarative policy enforcement**
- Open Policy Agent (OPA) basics
- Writing Rego policies
- Kubernetes admission control with Gatekeeper
- CI/CD integration and testing

**Time**: 4-5 hours | **Difficulty**: Intermediate to Advanced

### [07 - Just-in-Time Access](./07_jit_access/)
**Temporary privilege escalation**
- JIT access concepts and benefits
- Implementation with approval workflows
- Integration with existing IAM
- Audit and compliance

**Time**: 3 hours | **Difficulty**: Intermediate

### [08 - RBAC Best Practices](./08_rbac_best_practices/)
**Security patterns and anti-patterns**
- Least privilege implementation
- Role design strategies
- Periodic access reviews
- Common mistakes to avoid

**Time**: 2 hours | **Difficulty**: Intermediate

### [09 - Multi-Cloud IAM](./09_multicloud_iam/)
**Unified identity across clouds**
- Identity federation
- SSO implementation
- Cross-cloud access patterns
- Centralized IAM management

**Time**: 4 hours | **Difficulty**: Advanced

### [10 - Audit and Compliance](./10_audit_compliance/)
**Tracking and reporting**
- Logging IAM events
- Compliance frameworks (SOC2, PCI-DSS)
- Automated compliance checking
- Remediation workflows

**Time**: 3 hours | **Difficulty**: Intermediate

## Learning Path

### Week 1: Foundations
- **Day 1-2**: Linux Permissions (Tutorial 01)
- **Day 3-5**: Kubernetes RBAC (Tutorial 02)
- **Weekend**: Practice exercises

### Week 2: Cloud IAM
- **Day 1-2**: AWS IAM (Tutorial 03)
- **Day 3**: Azure AD (Tutorial 04)
- **Day 4**: GCP IAM (Tutorial 05)
- **Day 5**: Review and comparison
- **Weekend**: Set up IAM in your cloud project

### Week 3: Advanced Topics
- **Day 1-3**: Policy as Code (Tutorial 06)
- **Day 4**: JIT Access (Tutorial 07)
- **Day 5**: Best Practices (Tutorial 08)
- **Weekend**: Implement OPA policies

### Week 4: Enterprise Patterns
- **Day 1-3**: Multi-Cloud IAM (Tutorial 09)
- **Day 4-5**: Audit and Compliance (Tutorial 10)
- **Weekend**: Build comprehensive IAM strategy

## Quick Reference

### Kubernetes RBAC Cheat Sheet

```yaml
# ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-sa
  namespace: default

---
# Role (namespace-scoped)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]

---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: ServiceAccount
  name: my-sa
  namespace: default
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### AWS IAM Policy Example

```json
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
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": "10.0.0.0/8"
        }
      }
    }
  ]
}
```

### OPA/Rego Policy Example

```rego
package kubernetes.admission

deny[msg] {
    input.request.kind.kind == "Pod"
    container := input.request.object.spec.containers[_]
    not container.securityContext.runAsNonRoot
    msg := sprintf("Container %s must run as non-root", [container.name])
}
```

## Common Commands

```bash
# Linux
sudo useradd -m -s /bin/bash username
chmod 750 /path/to/directory
chown user:group /path/to/file

# Kubernetes
kubectl auth can-i list pods --as=system:serviceaccount:ns:sa
kubectl create serviceaccount my-sa
kubectl create rolebinding my-binding --role=my-role --serviceaccount=default:my-sa

# AWS
aws iam create-user --user-name username
aws iam attach-user-policy --user-name username --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess
aws iam create-role --role-name my-role --assume-role-policy-document file://trust-policy.json

# OPA
opa eval --data policy.rego --input input.json "data.example.allow"
opa test policies/ -v
```

## Security Best Practices

### ✅ Do's
- Apply least privilege principle
- Use groups/roles, not individual permissions
- Enable MFA for privileged accounts
- Rotate credentials regularly
- Use service accounts for applications
- Audit access regularly
- Document permission decisions
- Test before deploying

### ❌ Don'ts
- Grant admin/root access unnecessarily
- Share credentials between users
- Use long-lived credentials when temporary ones work
- Hard-code credentials
- Skip audit logs
- Use wildcard permissions (*, **)
- Trust without verification

## Key Concepts

### Least Privilege
Grant minimum permissions necessary to perform a task. Nothing more.

### Separation of Duties
No single person should have complete control over critical processes.

### Defense in Depth
Multiple layers of security controls.

### Zero Trust
Verify every access request, regardless of source.

### Just-in-Time Access
Grant temporary elevated permissions only when needed.

## Troubleshooting

### Permission Denied
```bash
# Check user/group
id username

# Check file permissions
ls -la /path/to/file

# Check effective permissions (K8s)
kubectl auth can-i <verb> <resource> --as=<user>

# Check AWS permissions
aws iam simulate-principal-policy \
  --policy-source-arn <user-arn> \
  --action-names <action>
```

### Cannot Assume Role
```bash
# Check trust policy
aws iam get-role --role-name <role-name>

# Verify credentials
aws sts get-caller-identity

# Check external ID (if required)
```

## Tools and Resources

### Essential Tools
- **kubectl**: Kubernetes CLI
- **aws-cli**: AWS CLI
- **az-cli**: Azure CLI
- **gcloud**: Google Cloud CLI
- **opa**: Open Policy Agent
- **rbac-lookup**: Kubernetes RBAC tool
- **PolicySim**: AWS IAM policy simulator

### Documentation
- [Kubernetes RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [AWS IAM](https://docs.aws.amazon.com/IAM/)
- [Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/)
- [GCP IAM](https://cloud.google.com/iam/docs)
- [OPA](https://www.openpolicyagent.org/docs/)

## Assessment

Test your knowledge:

1. Create a Kubernetes ServiceAccount with read-only access to pods
2. Write an AWS IAM policy that allows S3 access only from specific IP
3. Implement an OPA policy to require resource labels
4. Set up cross-account access in AWS
5. Configure MFA for privileged accounts
6. Implement JIT access for production environment
7. Audit and report all admin access in the last 30 days

## Next Section

After completing IAM & RBAC, proceed to:
- **5.4.2 Secrets Management**: Secure credential storage and distribution

---

**Total Time**: 30-35 hours
**Difficulty**: Beginner to Advanced
**Prerequisites**: Basic command line, cloud accounts
