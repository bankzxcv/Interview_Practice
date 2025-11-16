# 5.2 Kubernetes - Local Hands-On Tutorials

## Overview

25 incremental tutorials for mastering Kubernetes **locally** using kind (Kubernetes in Docker) or k3s. Each tutorial builds on the previous one, adding 1-2 new concepts to build strong muscle memory.

## Why Local Kubernetes?

- ✅ **Free**: No cloud costs
- ✅ **Fast**: Quick cluster creation/destruction
- ✅ **Safe**: Experiment without cloud consequences
- ✅ **Complete**: Full Kubernetes experience locally

## Prerequisites

### Required Tools

```bash
# macOS installation
brew install kubectl
brew install kind      # or: brew install k3s
brew install helm
brew install docker    # Docker Desktop

# Verify installations
kubectl version --client
kind version
helm version
```

### Alternative: k3d (k3s in Docker)

```bash
brew install k3d
```

## Learning Path

### Foundation (Tutorials 1-7) - Core Kubernetes
Build from empty cluster to persistent storage

| # | Tutorial | New Concepts | Time |
|---|----------|--------------|------|
| 01 | [Basic Cluster](./01_basic_cluster/) | kind, kubectl, nodes | 10 min |
| 02 | [Deployment](./02_cluster_with_deployment/) | Deployments, Pods, ReplicaSets | 15 min |
| 03 | [Service](./03_deployment_service/) | + Services, ClusterIP, NodePort | 20 min |
| 04 | [Ingress](./04_deployment_service_ingress/) | + Ingress, Ingress Controller | 25 min |
| 05 | [ConfigMap](./05_configmap/) | + ConfigMaps, Environment Variables | 20 min |
| 06 | [Secrets](./06_secrets/) | + Secrets, Base64 encoding | 20 min |
| 07 | [Persistent Volumes](./07_persistent_volumes/) | + PV, PVC, StorageClass | 30 min |

### Stateful Applications (Tutorials 8-11)
Advanced workload types

| # | Tutorial | New Concepts | Time |
|---|----------|--------------|------|
| 08 | [StatefulSet](./08_statefulset/) | StatefulSets, Headless Services | 30 min |
| 09 | [DaemonSet](./09_daemonset/) | DaemonSets, Node affinity | 20 min |
| 10 | [Jobs](./10_jobs/) | Jobs, Batch processing | 20 min |
| 11 | [CronJobs](./11_cronjobs/) | CronJobs, Scheduling | 25 min |

### Security & Policies (Tutorials 12-14)
RBAC, networking, resource management

| # | Tutorial | New Concepts | Time |
|---|----------|--------------|------|
| 12 | [RBAC](./12_rbac/) | ServiceAccounts, Roles, RoleBindings | 30 min |
| 13 | [Network Policies](./13_network_policies/) | NetworkPolicies, Pod isolation | 30 min |
| 14 | [Resource Limits](./14_resource_limits/) | Requests, Limits, LimitRanges | 25 min |

### Auto-Scaling & Package Management (Tutorials 15-17)
Scaling and Helm

| # | Tutorial | New Concepts | Time |
|---|----------|--------------|------|
| 15 | [HPA](./15_horizontal_pod_autoscaler/) | HPA, Metrics Server | 30 min |
| 16 | [Helm Basics](./16_helm_basics/) | Helm, Charts, Releases | 25 min |
| 17 | [Custom Helm Chart](./17_helm_custom_chart/) | Creating Charts, Templates | 35 min |

### Observability (Tutorials 18-19)
Monitoring and logging

| # | Tutorial | New Concepts | Time |
|---|----------|--------------|------|
| 18 | [Prometheus](./18_monitoring_prometheus/) | Prometheus, Grafana, ServiceMonitor | 40 min |
| 19 | [Logging](./19_logging_loki/) | Loki, Promtail, Log aggregation | 35 min |

### Advanced Topics (Tutorials 20-25)
Service mesh, GitOps, and complete applications

| # | Tutorial | New Concepts | Time |
|---|----------|--------------|------|
| 20 | [Istio](./20_service_mesh_istio/) | Service Mesh, mTLS, Traffic Management | 50 min |
| 21 | [Cert Manager](./21_cert_manager/) | TLS Certificates, Let's Encrypt | 30 min |
| 22 | [NGINX Ingress](./22_ingress_nginx/) | Advanced Ingress, SSL termination | 30 min |
| 23 | [ArgoCD](./23_argocd/) | GitOps, Continuous Deployment | 40 min |
| 24 | [Sealed Secrets](./24_sealed_secrets/) | Encrypted Secrets, GitOps-friendly | 30 min |
| 25 | [Complete Stack](./25_complete_app_stack/) | Full application with all concepts | 60 min |

## Incremental Learning Pattern

Each tutorial follows: **Previous Components + 1-2 New Concepts**

```
Tutorial 01: Cluster
Tutorial 02: Cluster + Deployment
Tutorial 03: Cluster + Deployment + Service
Tutorial 04: Cluster + Deployment + Service + Ingress
Tutorial 05: Cluster + Deployment + Service + Ingress + ConfigMap
...and so on
```

## Structure of Each Tutorial

```
XX_topic_name/
├── README.md              # Detailed instructions and explanations
├── cluster-config.yaml    # kind cluster configuration (if needed)
├── manifests/             # Kubernetes YAML files
│   ├── 01-namespace.yaml
│   ├── 02-deployment.yaml
│   ├── 03-service.yaml
│   └── ...
├── scripts/
│   ├── setup.sh          # Automated setup script
│   └── cleanup.sh        # Cleanup script
└── examples/             # Example applications (if needed)
```

## Common kubectl Commands

```bash
# Cluster info
kubectl cluster-info
kubectl get nodes

# Working with resources
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get all

# Describe (detailed info)
kubectl describe pod <pod-name>
kubectl describe deployment <deployment-name>

# Logs
kubectl logs <pod-name>
kubectl logs -f <pod-name>  # Follow

# Execute commands in pod
kubectl exec -it <pod-name> -- /bin/sh

# Apply manifests
kubectl apply -f manifest.yaml
kubectl apply -f manifests/  # Apply directory

# Delete resources
kubectl delete -f manifest.yaml
kubectl delete pod <pod-name>

# Port forwarding (access services locally)
kubectl port-forward svc/<service-name> 8080:80
```

## Quick Start

### Create Your First Cluster

```bash
# Navigate to Tutorial 01
cd 01_basic_cluster

# Create kind cluster
kind create cluster --name learning --config cluster-config.yaml

# Verify
kubectl cluster-info
kubectl get nodes

# When done
kind delete cluster --name learning
```

## Best Practices Covered

Throughout these tutorials, you'll learn:

**Configuration Management**
- Using ConfigMaps for non-sensitive config
- Using Secrets for sensitive data
- Environment variable injection
- Volume mounting for configs

**Resource Management**
- Setting resource requests and limits
- Using LimitRanges and ResourceQuotas
- Horizontal Pod Autoscaling
- Efficient resource utilization

**Security**
- RBAC for access control
- Network Policies for pod isolation
- Pod Security Standards
- Secrets management with Sealed Secrets
- Service mesh security with mTLS

**High Availability**
- Multi-replica deployments
- Pod Disruption Budgets
- Health checks (liveness/readiness probes)
- Rolling updates and rollbacks

**Observability**
- Prometheus for metrics
- Grafana for visualization
- Loki for log aggregation
- Distributed tracing with Istio

## Recommended Study Schedule

### Week 1: Foundation
- **Day 1-2**: Tutorials 1-4 (Cluster → Ingress)
- **Day 3-4**: Tutorials 5-7 (ConfigMaps → PV)
- **Day 5**: Review and repeat

### Week 2: Stateful & Jobs
- **Day 1-2**: Tutorials 8-9 (StatefulSet, DaemonSet)
- **Day 3**: Tutorials 10-11 (Jobs, CronJobs)
- **Day 4-5**: Review and experiment

### Week 3: Security & Scaling
- **Day 1-2**: Tutorials 12-14 (RBAC, Network Policies, Limits)
- **Day 3-4**: Tutorials 15-17 (HPA, Helm)
- **Day 5**: Build a custom project

### Week 4: Advanced
- **Day 1-2**: Tutorials 18-19 (Monitoring, Logging)
- **Day 3-4**: Tutorials 20-22 (Istio, Cert Manager, Ingress)
- **Day 5**: Tutorials 23-25 (GitOps, Complete Stack)

## Tips for Success

1. **Type, Don't Copy**: Build muscle memory by typing YAML
2. **Use Autocomplete**: Configure kubectl autocomplete
3. **Understand Before Moving**: Don't rush through tutorials
4. **Break Things**: Experiment with changes to see what breaks
5. **Read Error Messages**: Kubernetes errors are usually helpful
6. **Use `-o yaml`**: Learn by inspecting existing resources
7. **Repeat**: Come back and redo tutorials

## Troubleshooting

### Common Issues

**kind cluster creation fails**
```bash
# Ensure Docker is running
docker ps

# Delete and recreate
kind delete cluster --name learning
kind create cluster --name learning
```

**Pods stuck in Pending**
```bash
# Check pod status
kubectl describe pod <pod-name>

# Common causes:
# - Insufficient resources
# - Image pull errors
# - PVC not bound
```

**Can't access services**
```bash
# Use port-forward to debug
kubectl port-forward svc/<service-name> 8080:80

# Check service endpoints
kubectl get endpoints
```

### Helpful Aliases

```bash
# Add to ~/.bashrc or ~/.zshrc
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kgd='kubectl get deployments'
alias kga='kubectl get all'
alias kdp='kubectl describe pod'
alias kl='kubectl logs'
alias kex='kubectl exec -it'
```

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kind Documentation](https://kind.sigs.k8s.io/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Helm Documentation](https://helm.sh/docs/)

## What You'll Master

After completing all 25 tutorials:
- ✅ Deploy and manage Kubernetes clusters
- ✅ Create and manage all workload types
- ✅ Implement service discovery and load balancing
- ✅ Configure applications with ConfigMaps and Secrets
- ✅ Manage persistent storage
- ✅ Implement RBAC and network security
- ✅ Set up auto-scaling
- ✅ Use Helm for package management
- ✅ Implement monitoring and logging
- ✅ Deploy service meshes
- ✅ Practice GitOps with ArgoCD
- ✅ Build production-ready applications

## Next Steps

1. Install prerequisites (Docker, kind, kubectl, helm)
2. Start with [01_basic_cluster](./01_basic_cluster/)
3. Work through sequentially
4. After completing all, build a multi-tier application
5. Move to cloud-managed Kubernetes (AKS, EKS, GKE)

---

**Remember**: Kubernetes is complex. Take your time, repeat tutorials, and focus on understanding over speed. Build that muscle memory! 💪
