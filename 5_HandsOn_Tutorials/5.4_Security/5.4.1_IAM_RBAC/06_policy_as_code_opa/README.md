# Tutorial 06: Policy as Code with Open Policy Agent (OPA)

## Objectives

By the end of this tutorial, you will:
- Understand Policy as Code concepts
- Install and configure Open Policy Agent (OPA)
- Write policies in Rego language
- Implement Kubernetes admission control with OPA Gatekeeper
- Create reusable policy libraries
- Test and debug policies
- Integrate OPA into CI/CD pipelines
- Apply policy-driven security across infrastructure

## Prerequisites

- Docker installed
- Kubernetes cluster (minikube or kind)
- kubectl installed
- Basic understanding of JSON/YAML
- Terminal/command line access

## What is Open Policy Agent (OPA)?

OPA is an open-source, general-purpose policy engine that enables unified, context-aware policy enforcement across your stack. Instead of hardcoding policies in applications, OPA allows you to define policies as code using the Rego language.

### Key Concepts

- **Policy as Code**: Policies defined in version-controlled files
- **Rego**: OPA's declarative policy language
- **Decoupling**: Policy logic separated from application logic
- **Unified Enforcement**: Same policy engine for different systems
- **Context-Aware**: Policies can consider external data
- **Gatekeeper**: OPA's Kubernetes admission controller

### Architecture

```
Application/Service → OPA → Policy Decision (Allow/Deny)
                       ↓
                   Rego Policies
                       ↓
                   External Data
```

## Why Policy as Code?

1. **Version Control**: Track policy changes like code
2. **Testing**: Automated policy validation
3. **Consistency**: Same policies across environments
4. **Auditability**: Clear policy history
5. **Collaboration**: Review policies like code
6. **Automation**: Integrate into CI/CD

## Step-by-Step Instructions

### Step 1: Install OPA

```bash
# Install OPA on macOS
brew install opa

# Install on Linux
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
chmod +x opa
sudo mv opa /usr/local/bin/

# Verify installation
opa version

# Run OPA in server mode
opa run --server --addr :8181

# In another terminal, test OPA
curl http://localhost:8181/health
```

### Step 2: First Rego Policy

```bash
# Create a simple policy file
cat > example.rego << 'EOF'
package example

# Default deny
default allow = false

# Allow if user is admin
allow {
    input.user == "admin"
}

# Allow if user has correct role
allow {
    input.role == "developer"
    input.action == "read"
}
EOF

# Test the policy
cat > input.json << 'EOF'
{
  "user": "alice",
  "role": "developer",
  "action": "read"
}
EOF

# Evaluate policy
opa eval --data example.rego --input input.json "data.example.allow"

# Output: true
```

### Step 3: Advanced Rego Policies

```bash
# Create comprehensive RBAC policy
cat > rbac.rego << 'EOF'
package rbac

import future.keywords.if
import future.keywords.in

# User-role assignments
user_roles := {
    "alice": ["developer", "viewer"],
    "bob": ["admin"],
    "charlie": ["viewer"]
}

# Role permissions
role_permissions := {
    "admin": [
        {"action": "read", "resource": "*"},
        {"action": "write", "resource": "*"},
        {"action": "delete", "resource": "*"}
    ],
    "developer": [
        {"action": "read", "resource": "*"},
        {"action": "write", "resource": "deployments"}
    ],
    "viewer": [
        {"action": "read", "resource": "*"}
    ]
}

# Default deny
default allow = false

# Allow if user has permission
allow if {
    some role in user_roles[input.user]
    some permission in role_permissions[role]
    permission.action == input.action
    glob.match(permission.resource, [], input.resource)
}

# Deny if explicitly blocked
deny if {
    input.user == "blocked_user"
}
EOF

# Test RBAC policy
cat > rbac_input.json << 'EOF'
{
  "user": "alice",
  "action": "write",
  "resource": "deployments"
}
EOF

opa eval --data rbac.rego --input rbac_input.json "data.rbac.allow"
```

### Step 4: Kubernetes Policy

```bash
# Create policy to deny privileged containers
cat > k8s_deny_privileged.rego << 'EOF'
package kubernetes.admission

import future.keywords.if

deny[msg] if {
    input.request.kind.kind == "Pod"
    container := input.request.object.spec.containers[_]
    container.securityContext.privileged == true
    msg := sprintf("Privileged container is not allowed: %s", [container.name])
}

deny[msg] if {
    input.request.kind.kind == "Pod"
    not input.request.object.spec.securityContext.runAsNonRoot
    msg := "Containers must run as non-root user"
}

deny[msg] if {
    input.request.kind.kind == "Pod"
    container := input.request.object.spec.containers[_]
    not container.resources.limits.memory
    msg := sprintf("Container %s must have memory limit", [container.name])
}
EOF

# Test with a pod manifest
cat > test_pod.json << 'EOF'
{
  "request": {
    "kind": {"kind": "Pod"},
    "object": {
      "spec": {
        "containers": [{
          "name": "nginx",
          "image": "nginx",
          "securityContext": {
            "privileged": true
          }
        }]
      }
    }
  }
}
EOF

opa eval --data k8s_deny_privileged.rego --input test_pod.json "data.kubernetes.admission.deny"
```

### Step 5: Install OPA Gatekeeper

```bash
# Install Gatekeeper in Kubernetes
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml

# Verify installation
kubectl get pods -n gatekeeper-system

# Wait for pods to be ready
kubectl wait --for=condition=Ready pods --all -n gatekeeper-system --timeout=300s
```

### Step 6: Create ConstraintTemplate

```yaml
# Create constraint-template.yaml
cat > constraint-template.yaml << 'EOF'
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          type: object
          properties:
            labels:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels

        violation[{"msg": msg, "details": {"missing_labels": missing}}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_]}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("You must provide labels: %v", [missing])
        }
EOF

kubectl apply -f constraint-template.yaml

# Verify template
kubectl get constrainttemplates
```

### Step 7: Create Constraints

```yaml
# Create constraint to require labels
cat > require-labels-constraint.yaml << 'EOF'
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: must-have-owner
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
  parameters:
    labels: ["owner", "environment"]
EOF

kubectl apply -f require-labels-constraint.yaml

# Test the constraint
cat > test-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-app
  # Missing required labels!
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test
  template:
    metadata:
      labels:
        app: test
    spec:
      containers:
      - name: nginx
        image: nginx
EOF

# This should be denied
kubectl apply -f test-deployment.yaml
# Error: admission webhook denied the request

# Fix by adding labels
cat > test-deployment-fixed.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-app
  labels:
    owner: alice
    environment: dev
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test
  template:
    metadata:
      labels:
        app: test
        owner: alice
        environment: dev
    spec:
      containers:
      - name: nginx
        image: nginx
EOF

kubectl apply -f test-deployment-fixed.yaml
# Success!
```

### Step 8: Container Security Policies

```yaml
# Create template for container security
cat > container-security-template.yaml << 'EOF'
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8scontainerlimits
spec:
  crd:
    spec:
      names:
        kind: K8sContainerLimits
      validation:
        openAPIV3Schema:
          type: object
          properties:
            cpu:
              type: string
            memory:
              type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8scontainerlimits

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.cpu
          msg := sprintf("Container %v must have CPU limit", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.memory
          msg := sprintf("Container %v must have memory limit", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          container.securityContext.privileged == true
          msg := sprintf("Container %v cannot be privileged", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.runAsNonRoot
          msg := sprintf("Container %v must run as non-root", [container.name])
        }
EOF

kubectl apply -f container-security-template.yaml

# Create constraint
cat > container-security-constraint.yaml << 'EOF'
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sContainerLimits
metadata:
  name: container-must-have-limits
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
  parameters:
    cpu: "1"
    memory: "1Gi"
EOF

kubectl apply -f container-security-constraint.yaml
```

### Step 9: Policy Testing

```bash
# Create test file for policies
cat > policy_test.rego << 'EOF'
package rbac_test

import data.rbac

test_alice_can_read {
    rbac.allow with input as {
        "user": "alice",
        "action": "read",
        "resource": "pods"
    }
}

test_alice_can_write_deployments {
    rbac.allow with input as {
        "user": "alice",
        "action": "write",
        "resource": "deployments"
    }
}

test_alice_cannot_delete {
    not rbac.allow with input as {
        "user": "alice",
        "action": "delete",
        "resource": "pods"
    }
}

test_bob_is_admin {
    rbac.allow with input as {
        "user": "bob",
        "action": "delete",
        "resource": "anything"
    }
}
EOF

# Run tests
opa test rbac.rego policy_test.rego -v

# Run tests with coverage
opa test --coverage rbac.rego policy_test.rego
```

### Step 10: CI/CD Integration

```yaml
# GitHub Actions workflow
cat > .github/workflows/opa-validation.yml << 'EOF'
name: OPA Policy Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install OPA
        run: |
          curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
          chmod +x opa
          sudo mv opa /usr/local/bin/

      - name: Run OPA Tests
        run: |
          opa test policies/ -v

      - name: Check Policy Format
        run: |
          opa fmt -d policies/

      - name: Validate Kubernetes Manifests
        run: |
          for manifest in k8s/*.yaml; do
            opa eval --data policies/ --input $manifest "data.kubernetes.admission.deny"
          done
EOF
```

## Real-World Policy Examples

### Example 1: Terraform Policy

```bash
cat > terraform_policy.rego << 'EOF'
package terraform

# Deny S3 buckets without encryption
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_s3_bucket"
    not resource.change.after.server_side_encryption_configuration
    msg := sprintf("S3 bucket %s must have encryption enabled", [resource.name])
}

# Deny publicly accessible RDS
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_db_instance"
    resource.change.after.publicly_accessible == true
    msg := sprintf("RDS instance %s cannot be publicly accessible", [resource.name])
}

# Require tags on all resources
deny[msg] {
    resource := input.resource_changes[_]
    not resource.change.after.tags.Environment
    msg := sprintf("Resource %s must have Environment tag", [resource.name])
}
EOF
```

### Example 2: Docker Image Policy

```bash
cat > docker_policy.rego << 'EOF'
package docker

# Deny images from untrusted registries
deny[msg] {
    input.request.kind.kind == "Pod"
    container := input.request.object.spec.containers[_]
    not startswith(container.image, "myregistry.io/")
    not startswith(container.image, "gcr.io/")
    msg := sprintf("Image %s is from untrusted registry", [container.image])
}

# Deny latest tag
deny[msg] {
    input.request.kind.kind == "Pod"
    container := input.request.object.spec.containers[_]
    endswith(container.image, ":latest")
    msg := sprintf("Image %s cannot use 'latest' tag", [container.image])
}
EOF
```

## Policy Library

```bash
# Create reusable policy library
mkdir -p policies/lib

cat > policies/lib/kubernetes.rego << 'EOF'
package lib.kubernetes

is_deployment {
    input.request.kind.kind == "Deployment"
}

is_pod {
    input.request.kind.kind == "Pod"
}

has_label(label_key) {
    input.request.object.metadata.labels[label_key]
}

container_images[image] {
    container := input.request.object.spec.containers[_]
    image := container.image
}
EOF
```

## Monitoring and Debugging

```bash
# Check constraint status
kubectl get constraints

# Describe constraint violations
kubectl describe k8srequiredlabels must-have-owner

# View Gatekeeper logs
kubectl logs -n gatekeeper-system -l control-plane=controller-manager

# Audit mode (warn but don't block)
cat > audit-constraint.yaml << 'EOF'
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: audit-labels
spec:
  enforcementAction: dryrun  # or "warn"
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
  parameters:
    labels: ["team"]
EOF
```

## Best Practices

1. **Start with Audit Mode**: Use `enforcementAction: dryrun` initially
2. **Test Policies**: Write comprehensive tests before deployment
3. **Version Control**: Store policies in Git
4. **Document Policies**: Add comments explaining policy intent
5. **Gradual Rollout**: Deploy to dev → staging → prod
6. **Monitor Violations**: Track policy denials
7. **Keep Policies Simple**: One concern per policy
8. **Reuse Libraries**: Create shared policy functions

## Key Takeaways

1. **Policy as Code enables version-controlled security**
2. **OPA separates policy from application logic**
3. **Rego is powerful but requires practice**
4. **Gatekeeper integrates OPA with Kubernetes**
5. **Test policies like code**
6. **Start with audit mode before enforcing**
7. **Build reusable policy libraries**
8. **Integrate into CI/CD for shift-left security**

## Additional Resources

- [OPA Documentation](https://www.openpolicyagent.org/docs/)
- [Rego Playground](https://play.openpolicyagent.org/)
- [Gatekeeper Library](https://github.com/open-policy-agent/gatekeeper-library)
- [Policy Examples](https://github.com/open-policy-agent/opa/tree/master/examples)

## Next Steps

- Tutorial 07: Just-in-Time Access
- Tutorial 08: RBAC Best Practices
- Implement OPA for your infrastructure
- Build custom policy library

---

**Difficulty**: Intermediate to Advanced
**Estimated Time**: 4-5 hours
**Practice**: Write policies for your Kubernetes clusters
