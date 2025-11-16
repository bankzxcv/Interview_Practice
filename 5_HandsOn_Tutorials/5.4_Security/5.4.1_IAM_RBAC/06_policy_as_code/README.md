# Security Tutorial 06: Policy as Code with OPA (Open Policy Agent)

## 🎯 Learning Objectives

- Understand Policy as Code concepts
- Install and configure Open Policy Agent (OPA)
- Write Rego policies for various use cases
- Integrate OPA with Kubernetes
- Use Gatekeeper for admission control
- Implement policy testing and CI/CD integration

## 📋 Prerequisites

- Kubernetes cluster (kind, minikube, or cloud)
- kubectl installed
- Basic understanding of YAML and JSON
- Docker installed (for local OPA testing)

## 📝 What We're Building

```
Policy as Code Infrastructure
├── OPA Server
│   ├── Rego Policies
│   ├── Data Store
│   └── REST API
├── Gatekeeper (Kubernetes)
│   ├── ConstraintTemplates
│   ├── Constraints
│   └── Config
└── Policy Tests
    ├── Unit Tests
    └── Integration Tests
```

## 🔍 Concepts Introduced

1. **Policy as Code**: Define policies in code, version controlled
2. **OPA**: General-purpose policy engine
3. **Rego**: OPA's policy language
4. **Gatekeeper**: Kubernetes-native policy controller
5. **Admission Control**: Validate/mutate resources before creation
6. **Constraint Framework**: Template + Constraint pattern

## 📁 Step-by-Step Implementation

### Step 1: Install OPA Locally

```bash
# Download OPA
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
chmod +x opa
sudo mv opa /usr/local/bin/

# Verify installation
opa version

# Start OPA server
opa run --server &
OPA_PID=$!

# Test OPA
curl http://localhost:8181/health
```

### Step 2: Write First Rego Policy

Create `example.rego`:

```rego
# example.rego - Simple authorization policy
package httpapi.authz

# Default deny all requests
default allow := false

# Allow GET requests
allow {
    input.method == "GET"
}

# Allow users with admin role
allow {
    input.user.role == "admin"
}

# Allow specific paths for authenticated users
allow {
    input.path == ["/api", "users"]
    input.user.authenticated == true
}
```

Test the policy:

```bash
# Load policy
curl -X PUT http://localhost:8181/v1/policies/authz \
  --data-binary @example.rego

# Test: Should deny (POST request)
curl -X POST http://localhost:8181/v1/data/httpapi/authz/allow \
  -H 'Content-Type: application/json' \
  -d '{
    "input": {
      "method": "POST",
      "path": ["/api", "users"],
      "user": {"role": "user", "authenticated": true}
    }
  }'

# Test: Should allow (GET request)
curl -X POST http://localhost:8181/v1/data/httpapi/authz/allow \
  -H 'Content-Type: application/json' \
  -d '{
    "input": {
      "method": "GET",
      "path": ["/api", "users"],
      "user": {"role": "user", "authenticated": true}
    }
  }'

# Test: Should allow (admin user)
curl -X POST http://localhost:8181/v1/data/httpapi/authz/allow \
  -H 'Content-Type: application/json' \
  -d '{
    "input": {
      "method": "DELETE",
      "path": ["/api", "users"],
      "user": {"role": "admin", "authenticated": true}
    }
  }'
```

### Step 3: Create Kubernetes RBAC Policy

Create `k8s-rbac.rego`:

```rego
# k8s-rbac.rego - Kubernetes RBAC policy
package kubernetes.admission

import future.keywords.if
import future.keywords.in

# Deny pods running as root
deny[msg] {
    input.request.kind.kind == "Pod"
    some container in input.request.object.spec.containers
    not container.securityContext.runAsNonRoot
    msg := sprintf("Container '%s' must not run as root", [container.name])
}

# Deny privileged containers
deny[msg] {
    input.request.kind.kind == "Pod"
    some container in input.request.object.spec.containers
    container.securityContext.privileged
    msg := sprintf("Container '%s' cannot run in privileged mode", [container.name])
}

# Require specific labels
deny[msg] {
    input.request.kind.kind == "Pod"
    not input.request.object.metadata.labels.team
    msg := "Pod must have 'team' label"
}

# Deny pulling images from unauthorized registries
deny[msg] {
    input.request.kind.kind == "Pod"
    some container in input.request.object.spec.containers
    image := container.image
    not startswith(image, "myregistry.io/")
    not startswith(image, "gcr.io/")
    msg := sprintf("Container '%s' uses unauthorized registry: %s", [container.name, image])
}

# Require resource limits
deny[msg] {
    input.request.kind.kind == "Pod"
    some container in input.request.object.spec.containers
    not container.resources.limits
    msg := sprintf("Container '%s' must have resource limits", [container.name])
}
```

### Step 4: Install Gatekeeper on Kubernetes

```bash
# Install Gatekeeper
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/release-3.14/deploy/gatekeeper.yaml

# Wait for Gatekeeper pods
kubectl wait --for=condition=Ready pods --all -n gatekeeper-system --timeout=300s

# Verify installation
kubectl get pods -n gatekeeper-system
kubectl get crd | grep gatekeeper

# Check Gatekeeper webhook
kubectl get validatingwebhookconfigurations | grep gatekeeper
```

### Step 5: Create ConstraintTemplate

Create `constraint-template-required-labels.yaml`:

```yaml
# constraint-template-required-labels.yaml
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
          msg := sprintf("Missing required labels: %v", [missing])
        }
```

Apply and create constraint:

```bash
# Apply ConstraintTemplate
kubectl apply -f constraint-template-required-labels.yaml

# Verify
kubectl get constrainttemplates
kubectl describe constrainttemplate k8srequiredlabels

# Create Constraint
cat <<EOF | kubectl apply -f -
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: pod-must-have-team-label
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
  parameters:
    labels: ["team", "environment"]
EOF

# Verify constraint
kubectl get k8srequiredlabels
kubectl describe k8srequiredlabels pod-must-have-team-label
```

### Step 6: Create More ConstraintTemplates

Create `constraint-template-no-privileged.yaml`:

```yaml
# constraint-template-no-privileged.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8spspprivileged
spec:
  crd:
    spec:
      names:
        kind: K8sPSPPrivileged
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8spspprivileged

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          container.securityContext.privileged
          msg := sprintf("Privileged container not allowed: %v", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.initContainers[_]
          container.securityContext.privileged
          msg := sprintf("Privileged init container not allowed: %v", [container.name])
        }
```

Create `constraint-template-resource-limits.yaml`:

```yaml
# constraint-template-resource-limits.yaml
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

        missing_cpu_limit[container] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.cpu
        }

        missing_memory_limit[container] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.memory
        }

        violation[{"msg": msg}] {
          container := missing_cpu_limit[_]
          msg := sprintf("Container %v has no CPU limit", [container.name])
        }

        violation[{"msg": msg}] {
          container := missing_memory_limit[_]
          msg := sprintf("Container %v has no memory limit", [container.name])
        }
```

Apply all:

```bash
kubectl apply -f constraint-template-no-privileged.yaml
kubectl apply -f constraint-template-resource-limits.yaml

# Create constraints
cat <<EOF | kubectl apply -f -
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPPrivileged
metadata:
  name: no-privileged-containers
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sContainerLimits
metadata:
  name: container-must-have-limits
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
EOF
```

### Step 7: Create Policy for Image Registry

Create `constraint-template-allowed-repos.yaml`:

```yaml
# constraint-template-allowed-repos.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sallowedrepos
spec:
  crd:
    spec:
      names:
        kind: K8sAllowedRepos
      validation:
        openAPIV3Schema:
          type: object
          properties:
            repos:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sallowedrepos

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          satisfied := [good | repo = input.parameters.repos[_] ; good = startswith(container.image, repo)]
          not any(satisfied)
          msg := sprintf("Container %v uses unauthorized image: %v", [container.name, container.image])
        }
```

Apply and constrain:

```bash
kubectl apply -f constraint-template-allowed-repos.yaml

# Create constraint
cat <<EOF | kubectl apply -f -
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sAllowedRepos
metadata:
  name: allowed-image-repos
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
  parameters:
    repos:
      - "gcr.io/"
      - "docker.io/library/"
      - "registry.k8s.io/"
EOF
```

### Step 8: Write Policy Tests

Create `policy_test.rego`:

```rego
# policy_test.rego
package kubernetes.admission_test

import data.kubernetes.admission

# Test: Pod without team label should be denied
test_pod_without_team_label {
    result := admission.deny with input as {
        "request": {
            "kind": {"kind": "Pod"},
            "object": {
                "metadata": {"labels": {}},
                "spec": {"containers": [{"name": "test"}]}
            }
        }
    }
    count(result) > 0
}

# Test: Privileged pod should be denied
test_privileged_pod_denied {
    result := admission.deny with input as {
        "request": {
            "kind": {"kind": "Pod"},
            "object": {
                "metadata": {"labels": {"team": "eng"}},
                "spec": {
                    "containers": [{
                        "name": "test",
                        "securityContext": {"privileged": true}
                    }]
                }
            }
        }
    }
    count(result) > 0
}

# Test: Valid pod should be allowed
test_valid_pod_allowed {
    result := admission.deny with input as {
        "request": {
            "kind": {"kind": "Pod"},
            "object": {
                "metadata": {"labels": {"team": "eng"}},
                "spec": {
                    "containers": [{
                        "name": "test",
                        "image": "gcr.io/test:latest",
                        "securityContext": {"runAsNonRoot": true},
                        "resources": {"limits": {"cpu": "100m", "memory": "128Mi"}}
                    }]
                }
            }
        }
    }
    count(result) == 0
}
```

Run tests:

```bash
# Run OPA tests
opa test policy_test.rego k8s-rbac.rego -v

# Run with coverage
opa test --coverage policy_test.rego k8s-rbac.rego
```

## ✅ Verification

### 1. Test Constraint Violations

```bash
# Try to create pod without required labels (should fail)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: test-no-labels
spec:
  containers:
    - name: nginx
      image: nginx
EOF

# Try to create privileged pod (should fail)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: test-privileged
  labels:
    team: engineering
    environment: dev
spec:
  containers:
    - name: nginx
      image: nginx
      securityContext:
        privileged: true
EOF

# Try pod without resource limits (should fail)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: test-no-limits
  labels:
    team: engineering
    environment: dev
spec:
  containers:
    - name: nginx
      image: nginx
EOF
```

### 2. Test Valid Pod Creation

```bash
# Create compliant pod (should succeed)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: test-compliant
  labels:
    team: engineering
    environment: dev
spec:
  containers:
    - name: nginx
      image: gcr.io/test/nginx:latest
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      resources:
        limits:
          cpu: "200m"
          memory: "256Mi"
        requests:
          cpu: "100m"
          memory: "128Mi"
EOF

# Verify
kubectl get pods test-compliant
kubectl delete pod test-compliant
```

### 3. View Constraint Status

```bash
# List all constraints
kubectl get constraints

# Describe specific constraint
kubectl describe k8srequiredlabels pod-must-have-team-label

# Check constraint violations
kubectl get k8srequiredlabels pod-must-have-team-label -o yaml

# View audit results
kubectl get k8srequiredlabels pod-must-have-team-label -o jsonpath='{.status.violations}'
```

### 4. Check Gatekeeper Metrics

```bash
# Get Gatekeeper audit pod
AUDIT_POD=$(kubectl get pod -n gatekeeper-system -l control-plane=audit-controller -o name)

# View audit logs
kubectl logs -n gatekeeper-system $AUDIT_POD

# Check webhook logs
WEBHOOK_POD=$(kubectl get pod -n gatekeeper-system -l control-plane=controller-manager -o name | head -1)
kubectl logs -n gatekeeper-system $WEBHOOK_POD
```

## 🧪 Exploration Commands

### OPA Evaluation

```bash
# Evaluate policy with data
opa eval -d k8s-rbac.rego -i pod.json 'data.kubernetes.admission.deny'

# Explain policy decision
opa eval -d k8s-rbac.rego -i pod.json --explain=notes 'data.kubernetes.admission.deny'

# Profile policy performance
opa eval -d k8s-rbac.rego -i pod.json --profile 'data.kubernetes.admission.deny'

# Format Rego code
opa fmt -w k8s-rbac.rego

# Check Rego syntax
opa check k8s-rbac.rego
```

### Gatekeeper Utilities

```bash
# Dry run mode - audit without enforcement
kubectl patch constrainttemplate k8srequiredlabels --type=json -p='[{"op":"add","path":"/spec/enforcementAction","value":"dryrun"}]'

# View Gatekeeper config
kubectl get config config -n gatekeeper-system -o yaml

# Export all constraints
kubectl get constraints --all-namespaces -o yaml > constraints-backup.yaml

# Test constraint against existing resources
kubectl get pods --all-namespaces -o json | \
  opa eval -I -d constraint.rego 'data.k8srequiredlabels.violation' --stdin-input
```

## 🧹 Cleanup

```bash
# Delete constraints
kubectl delete k8srequiredlabels --all
kubectl delete k8spspprivileged --all
kubectl delete k8scontainerlimits --all
kubectl delete k8sallowedrepos --all

# Delete constraint templates
kubectl delete constrainttemplates --all

# Uninstall Gatekeeper
kubectl delete -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/release-3.14/deploy/gatekeeper.yaml

# Stop local OPA
kill $OPA_PID

echo "✅ Cleanup completed"
```

## 📚 What You Learned

✅ Understanding Policy as Code principles
✅ Writing Rego policies for various use cases
✅ Installing and configuring Gatekeeper
✅ Creating ConstraintTemplates and Constraints
✅ Testing policies with OPA
✅ Implementing admission control in Kubernetes
✅ Debugging and troubleshooting policies

## 🎓 Key Concepts

**Policy as Code Benefits**:
- Version controlled policies
- Automated enforcement
- Consistent compliance
- Testable and auditable
- Separation of concerns

**OPA Architecture**:
- **Policy**: Rego code defining rules
- **Data**: JSON/YAML input and context
- **Query**: Request for policy decision
- **Decision**: Allow/deny with reasons

**Gatekeeper Components**:
- **ConstraintTemplate**: Reusable policy template (Rego)
- **Constraint**: Instance of template with parameters
- **Config**: Gatekeeper configuration
- **Audit**: Periodic compliance scanning

## 🔜 Next Steps

Move to [07_ldap_integration](../07_ldap_integration/) where you'll:
- Set up LDAP/Active Directory
- Integrate LDAP with Kubernetes
- Configure LDAP authentication
- Implement group-based access control

## 💡 Pro Tips

1. **Use existing Gatekeeper library**:
   ```bash
   # Community constraint templates
   git clone https://github.com/open-policy-agent/gatekeeper-library.git
   kubectl apply -f gatekeeper-library/library/
   ```

2. **Enable audit logging**:
   ```yaml
   apiVersion: config.gatekeeper.sh/v1alpha1
   kind: Config
   metadata:
     name: config
     namespace: gatekeeper-system
   spec:
     match:
       - excludedNamespaces: ["kube-system", "gatekeeper-system"]
         processes: ["audit", "webhook"]
   ```

3. **Test policies locally**:
   ```bash
   opa test -v *.rego
   ```

## 🆘 Troubleshooting

**Problem**: Constraint not enforcing
**Solution**: Check constraint status and Gatekeeper logs
```bash
kubectl describe constraint CONSTRAINT_NAME
kubectl logs -n gatekeeper-system deployment/gatekeeper-controller-manager
```

**Problem**: Rego policy syntax error
**Solution**: Use OPA check and test
```bash
opa check policy.rego
opa test -v policy.rego test.rego
```

**Problem**: Policy blocking everything
**Solution**: Use dryrun mode first
```bash
kubectl patch constraint NAME --type=json -p='[{"op":"add","path":"/spec/enforcementAction","value":"dryrun"}]'
```

## 📖 Additional Reading

- [Open Policy Agent Documentation](https://www.openpolicyagent.org/docs/latest/)
- [Gatekeeper Documentation](https://open-policy-agent.github.io/gatekeeper/website/)
- [Rego Playground](https://play.openpolicyagent.org/)
- [Policy Library](https://github.com/open-policy-agent/gatekeeper-library)

---

**Estimated Time**: 60-75 minutes
**Difficulty**: Intermediate to Advanced
**Cost**: Free (local cluster)
