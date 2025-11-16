# NATS Tutorial 07: Kubernetes Deployment

## Overview
Deploy NATS to Kubernetes with Helm and NATS Operator.

## Quick Start
```bash
# Add Helm repo
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm repo update

# Install NATS
helm install my-nats nats/nats \
  --set cluster.enabled=true \
  --set cluster.replicas=3 \
  --set nats.jetstream.enabled=true

# Or use manifests
kubectl apply -f nats-cluster.yaml
```

## Components
- StatefulSet (3 replicas)
- Headless Service
- ConfigMap
- PersistentVolumeClaims (JetStream)

## Verification
```bash
kubectl get pods -l app.kubernetes.io/name=nats
kubectl port-forward svc/my-nats 4222:4222
```

Next: Tutorial 08 - Production
