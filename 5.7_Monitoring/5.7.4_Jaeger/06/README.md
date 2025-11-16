# Tutorial 06: Kubernetes Integration - Operator and Sidecars

## Topics
- Jaeger Operator installation
- Sidecar injection
- Service mesh integration
- Kubernetes service discovery

## Jaeger Operator Setup

```yaml
# Install operator
kubectl create namespace observability
kubectl create -f https://github.com/jaegertracing/jaeger-operator/releases/download/v1.50.0/jaeger-operator.yaml -n observability

# Create Jaeger instance
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger
spec:
  strategy: production
  storage:
    type: elasticsearch
    elasticsearch:
      nodeCount: 3
      storage:
        size: 100Gi
  ingress:
    enabled: true
```

Complete Kubernetes deployment with best practices and monitoring.
