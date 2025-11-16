# Kubernetes Cheatsheet - Quick Reference

> **Official Documentation:**
> - [Kubernetes Docs](https://kubernetes.io/docs/) | [kubectl Reference](https://kubernetes.io/docs/reference/kubectl/)
> - [Kubernetes Tutorials](https://kubernetes.io/docs/tutorials/) | [Kubernetes Patterns](https://kubernetes.io/docs/concepts/)

Container orchestration, scaling, and management with Kubernetes (K8s).

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [kubectl Commands](#kubectl-commands)
3. [Pods](#pods)
4. [Deployments & Services](#deployments--services)
5. [ConfigMaps & Secrets](#configmaps--secrets)
6. [Volumes & Storage](#volumes--storage)
7. [Scaling & Rolling Updates](#scaling--rolling-updates)
8. [Networking](#networking)

---

## Core Concepts

```
ARCHITECTURE:

┌──────────────── CONTROL PLANE ────────────────┐
│                                               │
│  ┌──────────────┐  ┌────────────────────┐    │
│  │  API Server  │  │  Controller Manager│    │
│  └──────┬───────┘  └──────────┬─────────┘    │
│         │                     │              │
│  ┌──────▼───────┐  ┌──────────▼─────────┐    │
│  │   Scheduler  │  │        etcd        │    │
│  └──────────────┘  └────────────────────┘    │
└───────────────────────────────────────────────┘

┌──────────────── WORKER NODES ─────────────────┐
│                                               │
│  ┌──────────────┐  ┌──────────────┐          │
│  │   kubelet    │  │ kube-proxy   │          │
│  └──────┬───────┘  └──────────────┘          │
│         │                                     │
│  ┌──────▼───────────────────────┐            │
│  │   Container Runtime (Docker) │            │
│  └──────────────────────────────┘            │
│                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │  Pod 1  │  │  Pod 2  │  │  Pod 3  │      │
│  └─────────┘  └─────────┘  └─────────┘      │
└───────────────────────────────────────────────┘

KEY COMPONENTS:
- API Server: Frontend to control plane
- etcd: Key-value store for cluster data
- Scheduler: Assigns pods to nodes
- Controller Manager: Maintains desired state
- kubelet: Agent on each node
- kube-proxy: Network proxy on each node
```

---

## kubectl Commands

```bash
# Cluster info
kubectl cluster-info
kubectl get nodes
kubectl describe node node-name

# Contexts (clusters)
kubectl config get-contexts
kubectl config use-context context-name
kubectl config current-context

# Resources
kubectl get pods
kubectl get pods -A  # All namespaces
kubectl get pods -n namespace-name
kubectl get pods -o wide  # More details
kubectl get pods -o yaml  # YAML output
kubectl get pods --watch  # Watch for changes

kubectl get deployments
kubectl get services
kubectl get all  # All resources

# Describe (detailed info)
kubectl describe pod pod-name
kubectl describe deployment deploy-name

# Create/Apply
kubectl apply -f manifest.yaml
kubectl apply -f directory/
kubectl apply -f https://example.com/manifest.yaml

# Delete
kubectl delete pod pod-name
kubectl delete -f manifest.yaml
kubectl delete deployment deploy-name

# Logs
kubectl logs pod-name
kubectl logs -f pod-name  # Follow
kubectl logs pod-name -c container-name  # Specific container
kubectl logs --tail=100 pod-name

# Execute commands
kubectl exec -it pod-name -- bash
kubectl exec pod-name -- ls -la
kubectl exec -it pod-name -c container-name -- sh

# Port forwarding
kubectl port-forward pod/pod-name 8080:80
kubectl port-forward service/service-name 8080:80

# Copy files
kubectl cp pod-name:/path/file.txt ./local/
kubectl cp ./local/file.txt pod-name:/path/

# Debugging
kubectl debug pod-name -it --image=busybox
kubectl top nodes  # Resource usage
kubectl top pods

# Labels & Selectors
kubectl get pods -l app=nginx
kubectl get pods -l 'environment in (production,staging)'
kubectl label pods pod-name env=production
```

---

## Pods

```yaml
# pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
    environment: production
spec:
  containers:
  - name: nginx
    image: nginx:1.21
    ports:
    - containerPort: 80
    env:
    - name: ENV_VAR
      value: "value"
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
    livenessProbe:
      httpGet:
        path: /health
        port: 80
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 80
      initialDelaySeconds: 5
      periodSeconds: 5
  restartPolicy: Always
```

```bash
kubectl apply -f pod.yaml
kubectl get pods
kubectl logs nginx-pod
kubectl exec -it nginx-pod -- bash
kubectl delete pod nginx-pod
```

---

## Deployments & Services

### Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80
```

### Service (Load Balancer)

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  type: LoadBalancer  # ClusterIP, NodePort, LoadBalancer
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
    nodePort: 30080  # For NodePort only
```

```bash
# Apply
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Check
kubectl get deployments
kubectl get services
kubectl get endpoints

# Access service
kubectl get svc nginx-service
# Use EXTERNAL-IP or localhost:nodePort
```

### Service Types

```
CLUSTER IP (default):
- Internal cluster IP
- Accessible only within cluster
- Default type

NODE PORT:
- Exposes on each node's IP at static port
- Accessible from outside cluster
- Port range: 30000-32767

LOAD BALANCER:
- Exposes externally using cloud provider LB
- Creates external IP
- Most common for production

EXTERNAL NAME:
- Maps to external DNS name
- Returns CNAME record
```

---

## ConfigMaps & Secrets

### ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database_url: "postgres://db:5432/mydb"
  log_level: "info"
  config.json: |
    {
      "key": "value"
    }
```

```yaml
# Use in pod
spec:
  containers:
  - name: app
    image: myapp:latest
    envFrom:
    - configMapRef:
        name: app-config
    # OR specific env vars
    env:
    - name: DATABASE_URL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: database_url
    # OR as volume
    volumeMounts:
    - name: config
      mountPath: /etc/config
  volumes:
  - name: config
    configMap:
      name: app-config
```

### Secret

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
data:
  # Base64 encoded
  password: cGFzc3dvcmQxMjM=
  api-key: YXBpa2V5MTIz
stringData:
  # Plain text (will be encoded)
  username: admin
```

```bash
# Create from literal
kubectl create secret generic app-secret \
  --from-literal=password=password123 \
  --from-literal=api-key=apikey123

# Create from file
kubectl create secret generic app-secret \
  --from-file=ssh-key=~/.ssh/id_rsa

# Use in pod (same as ConfigMap)
```

---

## Volumes & Storage

```yaml
# PersistentVolume (cluster resource)
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-storage
spec:
  capacity:
    storage: 10Gi
  accessModes:
  - ReadWriteOnce  # RWO, ROX, RWX
  persistentVolumeReclaimPolicy: Retain  # Delete, Recycle, Retain
  storageClassName: standard
  hostPath:
    path: /mnt/data

---
# PersistentVolumeClaim (user request)
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pv-claim
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard

---
# Use in pod
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:latest
    volumeMounts:
    - mountPath: /data
      name: storage
  volumes:
  - name: storage
    persistentVolumeClaim:
      claimName: pv-claim
```

---

## Scaling & Rolling Updates

```bash
# Scale deployment
kubectl scale deployment nginx-deployment --replicas=5

# Autoscaling (HPA)
kubectl autoscale deployment nginx-deployment \
  --min=2 --max=10 --cpu-percent=80

# Check HPA
kubectl get hpa

# Rolling update
kubectl set image deployment/nginx-deployment \
  nginx=nginx:1.22

# Check rollout status
kubectl rollout status deployment/nginx-deployment

# Rollout history
kubectl rollout history deployment/nginx-deployment

# Rollback
kubectl rollout undo deployment/nginx-deployment
kubectl rollout undo deployment/nginx-deployment --to-revision=2

# Pause/Resume rollout
kubectl rollout pause deployment/nginx-deployment
kubectl rollout resume deployment/nginx-deployment
```

### Rolling Update Strategy

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max pods above desired count
      maxUnavailable: 0  # Max pods unavailable during update
```

---

## Networking

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 8080
  tls:
  - hosts:
    - example.com
    secretName: tls-secret
```

### NetworkPolicy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 80
```

---

**Last updated:** 2025-11-15
