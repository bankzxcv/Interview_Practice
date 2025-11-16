# 5.10 Infrastructure as Code Tools - Hands-On Tutorials

## Overview

Master additional IaC tools beyond Terraform. Learn configuration management, Kubernetes packaging, and declarative deployment strategies.

## Tools Covered

### [5.10.1 Ansible](./5.10.1_Ansible/)
**Category**: Configuration Management
**Best For**: Server provisioning, configuration, application deployment
- **Tutorial 01**: Ansible basics, inventory, ad-hoc commands
- **Tutorial 02**: Playbooks and tasks
- **Tutorial 03**: Variables and facts
- **Tutorial 04**: Handlers and notifications
- **Tutorial 05**: Roles and galaxy
- **Tutorial 06**: Templates (Jinja2)
- **Tutorial 07**: Ansible Vault for secrets
- **Tutorial 08**: Dynamic inventory, cloud integration

### [5.10.2 Pulumi](./5.10.2_Pulumi/)
**Category**: Infrastructure as Code
**Best For**: Using real programming languages (Python, TypeScript, Go)
- **Tutorial 01**: Pulumi basics, first project
- **Tutorial 02**: Resources and stacks
- **Tutorial 03**: Component resources
- **Tutorial 04**: Multi-cloud deployment
- **Tutorial 05**: Pulumi with AWS
- **Tutorial 06**: Pulumi with Kubernetes
- **Tutorial 07**: Testing infrastructure code
- **Tutorial 08**: CI/CD integration

### [5.10.3 Helm](./5.10.3_Helm/)
**Category**: Kubernetes Package Manager
**Best For**: Deploying and managing Kubernetes applications
- **Tutorial 01**: Helm basics, charts, releases
- **Tutorial 02**: Installing charts from repos
- **Tutorial 03**: Creating custom charts
- **Tutorial 04**: Templates and values
- **Tutorial 05**: Chart dependencies
- **Tutorial 06**: Helm hooks and tests
- **Tutorial 07**: Chart repositories
- **Tutorial 08**: Helm with CI/CD

### [5.10.4 Kustomize](./5.10.4_Kustomize/)
**Category**: Kubernetes Native Configuration Management
**Best For**: Template-free Kubernetes manifests, GitOps
- **Tutorial 01**: Kustomize basics, kustomization.yaml
- **Tutorial 02**: Overlays and bases
- **Tutorial 03**: Patches and transformers
- **Tutorial 04**: ConfigMap and Secret generators
- **Tutorial 05**: Multi-environment deployments
- **Tutorial 06**: Helm vs Kustomize
- **Tutorial 07**: Kustomize with ArgoCD
- **Tutorial 08**: Advanced composition patterns

## Quick Start: Ansible

### Installation

```bash
# Install Ansible
brew install ansible

# Verify
ansible --version
```

### Inventory File

```ini
# inventory.ini
[webservers]
web1 ansible_host=192.168.1.10 ansible_user=ubuntu
web2 ansible_host=192.168.1.11 ansible_user=ubuntu

[databases]
db1 ansible_host=192.168.1.20 ansible_user=ubuntu

[all:vars]
ansible_python_interpreter=/usr/bin/python3
```

### Simple Playbook

```yaml
# playbook.yml
---
- name: Configure web servers
  hosts: webservers
  become: yes

  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600

    - name: Install nginx
      apt:
        name: nginx
        state: present

    - name: Start nginx
      service:
        name: nginx
        state: started
        enabled: yes

    - name: Copy nginx config
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: Restart nginx

  handlers:
    - name: Restart nginx
      service:
        name: nginx
        state: restarted
```

```bash
# Run playbook
ansible-playbook -i inventory.ini playbook.yml

# Check syntax
ansible-playbook --syntax-check playbook.yml

# Dry run
ansible-playbook -i inventory.ini playbook.yml --check
```

## Quick Start: Pulumi

### Installation & Setup

```bash
# Install Pulumi
brew install pulumi

# Login (local backend)
pulumi login --local

# Create new project
mkdir my-infra && cd my-infra
pulumi new aws-typescript
```

### Simple AWS S3 Bucket (TypeScript)

```typescript
// index.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Create an S3 bucket
const bucket = new aws.s3.Bucket("my-bucket", {
    website: {
        indexDocument: "index.html",
    },
    acl: "public-read",
});

// Upload index.html
const indexHtml = new aws.s3.BucketObject("index.html", {
    bucket: bucket.id,
    content: "<h1>Hello, Pulumi!</h1>",
    contentType: "text/html",
    acl: "public-read",
});

// Export the bucket URL
export const bucketUrl = pulumi.interpolate`http://${bucket.websiteEndpoint}`;
```

```bash
# Preview changes
pulumi preview

# Deploy
pulumi up

# Destroy
pulumi destroy
```

## Quick Start: Helm

### Installation

```bash
# Install Helm
brew install helm

# Add a chart repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

### Install a Chart

```bash
# Install nginx
helm install my-nginx bitnami/nginx

# List releases
helm list

# Get status
helm status my-nginx

# Upgrade
helm upgrade my-nginx bitnami/nginx --set replicaCount=3

# Uninstall
helm uninstall my-nginx
```

### Create Custom Chart

```bash
# Create new chart
helm create myapp

# Chart structure
myapp/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default values
├── templates/          # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
└── charts/            # Chart dependencies
```

```yaml
# values.yaml
replicaCount: 2

image:
  repository: nginx
  tag: "1.21"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
```

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: 80
```

```bash
# Install your chart
helm install myapp ./myapp

# Install with custom values
helm install myapp ./myapp --set replicaCount=5

# Or use values file
helm install myapp ./myapp -f custom-values.yaml
```

## Quick Start: Kustomize

### Installation

```bash
# Kustomize is built into kubectl
kubectl version

# Or install standalone
brew install kustomize
```

### Directory Structure

```
k8s/
├── base/
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   └── service.yaml
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   └── replica-patch.yaml
    ├── staging/
    │   └── kustomization.yaml
    └── production/
        └── kustomization.yaml
```

### Base Configuration

```yaml
# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml

commonLabels:
  app: myapp
```

```yaml
# base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:latest
        ports:
        - containerPort: 8080
```

### Dev Overlay

```yaml
# overlays/dev/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

namePrefix: dev-

replicas:
  - name: myapp
    count: 1

images:
  - name: myapp
    newTag: dev-latest
```

### Production Overlay

```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

namePrefix: prod-

replicas:
  - name: myapp
    count: 5

images:
  - name: myapp
    newTag: v1.2.3

patches:
  - path: resource-limits.yaml
```

```bash
# Build and view (dev)
kubectl kustomize overlays/dev

# Apply directly (dev)
kubectl apply -k overlays/dev

# Apply production
kubectl apply -k overlays/production
```

## Tool Comparison

| Feature | Ansible | Pulumi | Helm | Kustomize |
|---------|---------|--------|------|-----------|
| **Language** | YAML | Real code | YAML+Templates | YAML |
| **Learning Curve** | Medium | Medium | Medium | Easy |
| **Target** | VMs, config | Multi-cloud | Kubernetes | Kubernetes |
| **State** | None | Yes | Releases | None |
| **Templating** | Jinja2 | Native | Go templates | Patches |
| **Testing** | Limited | Full | Limited | None |
| **Best For** | CM | Cloud IaC | K8s packages | K8s GitOps |

## Best Practices Covered

### Ansible
- ✅ Idempotent playbooks
- ✅ Role-based organization
- ✅ Vault for secrets
- ✅ Dynamic inventory
- ✅ Testing with Molecule

### Pulumi
- ✅ Type safety
- ✅ Unit testing infrastructure
- ✅ Component resources
- ✅ Stack references
- ✅ Policy as code

### Helm
- ✅ Semantic versioning
- ✅ Chart dependencies
- ✅ Hooks for lifecycle
- ✅ Values validation
- ✅ Chart testing

### Kustomize
- ✅ Base and overlays pattern
- ✅ No templating (pure YAML)
- ✅ Strategic merge patches
- ✅ ConfigMap/Secret generators
- ✅ GitOps friendly

## Prerequisites

```bash
# Ansible
brew install ansible

# Pulumi
brew install pulumi

# Helm (if not included with kubectl)
brew install helm

# Kustomize (built into kubectl)
kubectl version

# Cloud CLIs (for Pulumi/Ansible)
brew install awscli
brew install azure-cli
```

## Recommended Study Path

### Week 1: Configuration Management
- Days 1-5: Ansible (all 8 tutorials)
- Weekend: Automate server setup

### Week 2: Modern IaC
- Days 1-5: Pulumi (all 8 tutorials)
- Weekend: Compare with Terraform

### Week 3: Kubernetes Packaging
- Days 1-3: Helm (all 8 tutorials)
- Days 4-5: Kustomize (tutorials 1-5)
- Weekend: Package an application

### Week 4: Advanced Topics
- Days 1-2: Complete Kustomize
- Days 3-5: Integrate all tools
- Weekend: Build complete IaC stack

## What You'll Master

After completing all tutorials:
- ✅ Automate configuration with Ansible
- ✅ Write infrastructure code in real languages
- ✅ Package Kubernetes applications with Helm
- ✅ Manage K8s configs with Kustomize
- ✅ Choose the right tool for the job
- ✅ Implement GitOps workflows
- ✅ Test infrastructure code
- ✅ Integrate IaC with CI/CD

## Common Patterns

### Ansible Role Structure
```
roles/
└── webserver/
    ├── tasks/
    │   └── main.yml
    ├── handlers/
    │   └── main.yml
    ├── templates/
    │   └── nginx.conf.j2
    ├── files/
    ├── vars/
    │   └── main.yml
    └── defaults/
        └── main.yml
```

### Helm Release Strategy
```bash
# Dev
helm upgrade --install myapp ./chart \
  -f values-dev.yaml \
  --namespace dev

# Staging
helm upgrade --install myapp ./chart \
  -f values-staging.yaml \
  --namespace staging

# Production
helm upgrade --install myapp ./chart \
  -f values-prod.yaml \
  --namespace production \
  --wait \
  --timeout 10m
```

## Additional Resources

- [Ansible Documentation](https://docs.ansible.com/)
- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [Ansible Galaxy](https://galaxy.ansible.com/)
- [Artifact Hub](https://artifacthub.io/)

## Next Steps

1. Learn Ansible for configuration management
2. Explore Pulumi if you prefer real code
3. Master Helm for Kubernetes deployments
4. Use Kustomize for GitOps
5. Integrate all tools in your workflow

---

**Total Tutorials**: 32 (4 tools × 8 tutorials)
**Estimated Time**: 50-70 hours
**Difficulty**: Intermediate to Advanced
**Cost**: Free (mostly runs locally)
