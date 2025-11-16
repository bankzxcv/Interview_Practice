# Kafka Tutorial 07: Kubernetes Deployment

## Overview
Deploy Kafka to Kubernetes using Strimzi operator.

## Architecture
```
K8s Cluster
├── Strimzi Operator
├── Kafka StatefulSet
├── ZooKeeper StatefulSet
└── Services
```

## Quick Start
```bash
# Install Strimzi operator
kubectl create namespace kafka
kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka

# Deploy Kafka cluster
kubectl apply -f kafka-cluster.yaml -n kafka

# Check status
kubectl get kafka -n kafka
kubectl get pods -n kafka
```

## Scaling
```bash
kubectl patch kafka my-cluster \
  --type='merge' \
  -p '{"spec":{"kafka":{"replicas":5}}}' \
  -n kafka
```

## Best Practices
- Use persistent volumes
- Configure resource limits
- Enable metrics (Prometheus)
- Use pod disruption budgets
- Configure rack awareness

Next: Tutorial 08 - Production cluster
