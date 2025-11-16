# Redis Tutorial 07: Kubernetes Deployment

## Overview
Deploy Redis with Sentinel or Cluster on Kubernetes.

## Options

### 1. Redis Sentinel (Simpler HA)
- Master-slave replication
- Automatic failover
- Sentinel monitors health

### 2. Redis Cluster (Horizontal Scaling)
- Sharding
- Multiple masters
- Built-in HA

## Quick Start

**Using Helm:**
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami

# Redis Sentinel
helm install my-redis bitnami/redis \
  --set sentinel.enabled=true \
  --set sentinel.quorum=2

# Redis Cluster
helm install my-redis-cluster bitnami/redis-cluster

# Or use manifests
kubectl apply -f redis-sentinel.yaml
```

## Verification
```bash
kubectl get pods
kubectl logs redis-master-0
```

Next: Tutorial 08 - Production patterns
