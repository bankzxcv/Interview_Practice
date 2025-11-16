# Linkerd Tutorial 06: Multi-Cluster

## Overview

Deploy Linkerd across multiple Kubernetes clusters for cross-cluster service communication, high availability, and disaster recovery.

## Learning Objectives

- Connect multiple clusters with Linkerd
- Configure service mirroring
- Implement cross-cluster traffic routing
- Set up failover between clusters
- Monitor multi-cluster mesh

## Multi-Cluster Architecture

```
┌───────────────────────────────┐    ┌───────────────────────────────┐
│      Cluster East              │    │      Cluster West             │
│                                │    │                               │
│  ┌──────────────────────────┐ │    │ ┌──────────────────────────┐ │
│  │  Linkerd Control Plane   │ │    │ │  Linkerd Control Plane   │ │
│  └──────────────────────────┘ │    │ └──────────────────────────┘ │
│  ┌──────────────────────────┐ │    │ ┌──────────────────────────┐ │
│  │  Gateway (multicluster)  │◄┼────┼─►  Gateway (multicluster)  │ │
│  └──────────────────────────┘ │    │ └──────────────────────────┘ │
│  ┌──────────────────────────┐ │    │ ┌──────────────────────────┐ │
│  │  Service: web            │ │    │ │  Service: web            │ │
│  │  Service: api (local)    │ │    │ │  Service: api (local)    │ │
│  │  Service: api-west       │ │    │ │  Service: api-east       │ │
│  │    (mirrored from West)  │ │    │ │    (mirrored from East)  │ │
│  └──────────────────────────┘ │    │ └──────────────────────────┘ │
└───────────────────────────────┘    └───────────────────────────────┘
```

## Prerequisites

- Two Kubernetes clusters
- kubectl configured for both
- Linkerd installed on both clusters
- Network connectivity between clusters

## Tutorial Exercises

### Exercise 1: Prepare Clusters

**Set Context Variables:**
```bash
export CTX_CLUSTER1=cluster1
export CTX_CLUSTER2=cluster2

# Verify connectivity
kubectl cluster-info --context=${CTX_CLUSTER1}
kubectl cluster-info --context=${CTX_CLUSTER2}
```

**Install Linkerd on Both Clusters:**
```bash
# Generate shared trust anchor
step certificate create root.linkerd.cluster.local ca.crt ca.key \
  --profile root-ca --no-password --insecure

# Cluster 1
step certificate create identity.linkerd.cluster.local issuer-1.crt issuer-1.key \
  --profile intermediate-ca --not-after 8760h --no-password --insecure \
  --ca ca.crt --ca-key ca.key

linkerd install --context=${CTX_CLUSTER1} \
  --identity-trust-anchors-file ca.crt \
  --identity-issuer-certificate-file issuer-1.crt \
  --identity-issuer-key-file issuer-1.key \
  | kubectl apply --context=${CTX_CLUSTER1} -f -

# Cluster 2
step certificate create identity.linkerd.cluster.local issuer-2.crt issuer-2.key \
  --profile intermediate-ca --not-after 8760h --no-password --insecure \
  --ca ca.crt --ca-key ca.key

linkerd install --context=${CTX_CLUSTER2} \
  --identity-trust-anchors-file ca.crt \
  --identity-issuer-certificate-file issuer-2.crt \
  --identity-issuer-key-file issuer-2.key \
  | kubectl apply --context=${CTX_CLUSTER2} -f -
```

### Exercise 2: Install Multicluster Extension

**Install on Both Clusters:**
```bash
# Cluster 1
linkerd multicluster install --context=${CTX_CLUSTER1} \
  | kubectl apply --context=${CTX_CLUSTER1} -f -

# Cluster 2
linkerd multicluster install --context=${CTX_CLUSTER2} \
  | kubectl apply --context=${CTX_CLUSTER2} -f -

# Verify
linkerd multicluster check --context=${CTX_CLUSTER1}
linkerd multicluster check --context=${CTX_CLUSTER2}
```

### Exercise 3: Link Clusters

**Link Cluster2 to Cluster1:**
```bash
linkerd multicluster link --context=${CTX_CLUSTER2} \
  --cluster-name cluster2 \
  | kubectl apply --context=${CTX_CLUSTER1} -f -
```

**Link Cluster1 to Cluster2:**
```bash
linkerd multicluster link --context=${CTX_CLUSTER1} \
  --cluster-name cluster1 \
  | kubectl apply --context=${CTX_CLUSTER2} -f -
```

**Verify Links:**
```bash
linkerd multicluster gateways --context=${CTX_CLUSTER1}
linkerd multicluster gateways --context=${CTX_CLUSTER2}
```

### Exercise 4: Export Services

**Export Service from Cluster2:**
```bash
# Deploy service in cluster2
kubectl apply --context=${CTX_CLUSTER2} -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: demo
  annotations:
    linkerd.io/inject: enabled
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: demo
  annotations:
    mirror.linkerd.io/exported: "true"  # Export this service
spec:
  ports:
    - port: 8080
  selector:
    app: backend
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: demo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: buoyantio/bb:v0.0.6
          args: ["-text", "Hello from cluster2"]
          ports:
            - containerPort: 8080
EOF
```

**Verify Mirror in Cluster1:**
```bash
# Check mirrored service
kubectl get svc -n demo --context=${CTX_CLUSTER1}

# Should see: backend-cluster2 (mirrored service)
```

### Exercise 5: Cross-Cluster Traffic

**Deploy Client in Cluster1:**
```bash
kubectl apply --context=${CTX_CLUSTER1} -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: demo
  annotations:
    linkerd.io/inject: enabled
---
apiVersion: v1
kind: Pod
metadata:
  name: curl-client
  namespace: demo
spec:
  containers:
    - name: curl
      image: curlimages/curl
      command: ["sleep", "3600"]
EOF
```

**Test Cross-Cluster Communication:**
```bash
# Call mirrored service
kubectl exec --context=${CTX_CLUSTER1} -n demo curl-client -- \
  curl -s backend-cluster2:8080

# Should return: "Hello from cluster2"
```

### Exercise 6: Traffic Split Across Clusters

**Deploy Local Backend in Cluster1:**
```bash
kubectl apply --context=${CTX_CLUSTER1} -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: demo
spec:
  ports:
    - port: 8080
  selector:
    app: backend
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: demo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: buoyantio/bb:v0.0.6
          args: ["-text", "Hello from cluster1"]
          ports:
            - containerPort: 8080
EOF
```

**Create TrafficSplit:**
```bash
kubectl apply --context=${CTX_CLUSTER1} -f - <<EOF
apiVersion: split.smi-spec.io/v1alpha2
kind: TrafficSplit
metadata:
  name: backend-split
  namespace: demo
spec:
  service: backend
  backends:
    - service: backend
      weight: 700m  # 70% local
    - service: backend-cluster2
      weight: 300m  # 30% remote
EOF
```

**Test Distribution:**
```bash
# Send 20 requests
kubectl exec --context=${CTX_CLUSTER1} -n demo curl-client -- sh -c \
  'for i in $(seq 1 20); do curl -s backend:8080; echo ""; done'

# Should see ~70% cluster1, ~30% cluster2
```

### Exercise 7: Failover Configuration

**Prefer Local, Failover to Remote:**
```bash
kubectl apply --context=${CTX_CLUSTER1} -f - <<EOF
apiVersion: split.smi-spec.io/v1alpha2
kind: TrafficSplit
metadata:
  name: backend-failover
  namespace: demo
spec:
  service: backend
  backends:
    - service: backend
      weight: 1000m  # 100% local when available
    - service: backend-cluster2
      weight: 0m     # Only use when local fails
EOF
```

**Test Failover:**
```bash
# Scale down local backend
kubectl scale deployment backend -n demo --replicas=0 --context=${CTX_CLUSTER1}

# Traffic should failover to cluster2
kubectl exec --context=${CTX_CLUSTER1} -n demo curl-client -- \
  curl -s backend:8080

# Should return: "Hello from cluster2"

# Restore
kubectl scale deployment backend -n demo --replicas=2 --context=${CTX_CLUSTER1}
```

### Exercise 8: Monitor Multi-Cluster

**View Cross-Cluster Traffic:**
```bash
# Dashboard
linkerd viz dashboard --context=${CTX_CLUSTER1}

# CLI stats
linkerd viz stat deploy -n demo --context=${CTX_CLUSTER1}

# Tap cross-cluster
linkerd viz tap deploy/backend -n demo --to svc/backend-cluster2 --context=${CTX_CLUSTER1}
```

**Check Gateway Health:**
```bash
linkerd multicluster gateways --context=${CTX_CLUSTER1}

# Shows: CLUSTER, ALIVE, NUM_SVC, LATENCY
```

## Verification

```bash
# Check multicluster extension
linkerd multicluster check --context=${CTX_CLUSTER1}

# List linked clusters
kubectl get link -A --context=${CTX_CLUSTER1}

# Verify service mirrors
kubectl get svc -A --context=${CTX_CLUSTER1} | grep mirror
```

## Troubleshooting

### Gateway Not Reachable

```bash
# Check gateway pod
kubectl get pods -n linkerd-multicluster --context=${CTX_CLUSTER2}

# Test gateway endpoint
kubectl get svc -n linkerd-multicluster --context=${CTX_CLUSTER2}

# Verify network connectivity
```

### Service Not Mirrored

```bash
# Check export annotation
kubectl get svc backend -n demo -o yaml --context=${CTX_CLUSTER2} | grep exported

# Check service mirror logs
kubectl logs -n linkerd-multicluster deploy/linkerd-service-mirror-cluster2 --context=${CTX_CLUSTER1}
```

## Best Practices

1. **Same Trust Root**: Use shared CA for all clusters
2. **Network Latency**: Monitor cross-cluster latency
3. **Locality Preference**: Prefer local services
4. **Selective Export**: Only export necessary services
5. **Monitor Gateways**: Ensure high availability
6. **Test Failover**: Regularly test disaster recovery

## Cleanup

```bash
# Unlink clusters
linkerd multicluster unlink --cluster-name cluster2 --context=${CTX_CLUSTER1}
linkerd multicluster unlink --cluster-name cluster1 --context=${CTX_CLUSTER2}

# Uninstall multicluster
linkerd multicluster uninstall --context=${CTX_CLUSTER1} | kubectl delete -f -
linkerd multicluster uninstall --context=${CTX_CLUSTER2} | kubectl delete -f -
```

## Next Steps

- [07_security_policies](../07_security_policies/): Implement authorization policies
- Configure global load balancing
- Set up multi-region deployments
- Implement geo-routing

## Resources

- [Linkerd Multi-Cluster](https://linkerd.io/2/features/multicluster/)
- [Multi-Cluster Communication](https://linkerd.io/2/tasks/multicluster/)
- [Service Mirroring](https://linkerd.io/2/reference/multicluster/)
