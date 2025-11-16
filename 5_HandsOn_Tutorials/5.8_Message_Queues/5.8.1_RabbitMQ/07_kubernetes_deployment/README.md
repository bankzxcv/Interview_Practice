# RabbitMQ Tutorial 07: Kubernetes Deployment

## Overview
Deploy RabbitMQ to Kubernetes using the official operator.

## Learning Objectives
- Deploy RabbitMQ Cluster Operator
- Create RabbitMQ cluster on K8s
- Configure persistence with PVCs
- Expose RabbitMQ services
- Scale cluster nodes

## Architecture

```
K8s Cluster
├── RabbitMQ Operator
├── RabbitMQ StatefulSet (3 pods)
├── Headless Service
├── Management Service
└── PersistentVolumeClaims
```

## Quick Start

```bash
# Install RabbitMQ Cluster Operator
kubectl apply -f operator.yaml

# Deploy RabbitMQ cluster
kubectl apply -f rabbitmq-cluster.yaml

# Check status
kubectl get rabbitmqclusters
kubectl get pods -l app.kubernetes.io/name=rabbitmq

# Access Management UI
kubectl port-forward svc/rabbitmq-cluster 15672:15672
# http://localhost:15672
```

## Scaling

```bash
# Scale to 5 nodes
kubectl patch rabbitmqcluster rabbitmq-cluster \
  --type='merge' \
  -p '{"spec":{"replicas":5}}'
```

## Verification

```bash
# Check cluster status
kubectl exec rabbitmq-cluster-server-0 -- rabbitmqctl cluster_status

# List queues
kubectl exec rabbitmq-cluster-server-0 -- \
  rabbitmqadmin -u admin -p admin123 list queues
```

## Best Practices

1. Use PersistentVolumes for data
2. Configure resource limits
3. Use node affinity for distribution
4. Set up monitoring (Prometheus)
5. Configure backup strategy

## Next Steps
- Tutorial 08: Production best practices
