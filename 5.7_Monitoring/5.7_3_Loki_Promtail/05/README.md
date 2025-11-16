# Tutorial 05: Kubernetes Logs - DaemonSet and Pod Logs

## Topics Covered
- Promtail DaemonSet deployment
- Kubernetes metadata extraction
- Namespace and pod labeling
- Container log collection
- Service discovery in Kubernetes

## Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: promtail
spec:
  template:
    spec:
      containers:
      - name: promtail
        image: grafana/promtail:latest
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: pods
          mountPath: /var/lib/docker/containers
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: pods
        hostPath:
          path: /var/lib/docker/containers
```

Complete K8s setup with RBAC, ConfigMap, and query examples included.
