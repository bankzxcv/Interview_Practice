# Istio Tutorial 07: Multi-Cluster Service Mesh

## Overview

Deploy Istio across multiple Kubernetes clusters to create a unified service mesh. Learn to configure cluster discovery, cross-cluster load balancing, and failover strategies.

## Learning Objectives

- Understand multi-cluster mesh architectures
- Deploy Istio in multi-cluster mode
- Configure cluster discovery
- Implement cross-cluster traffic routing
- Set up multi-cluster failover
- Monitor multi-cluster mesh
- Troubleshoot cross-cluster connectivity

## Multi-Cluster Architectures

### Primary-Remote Model
One primary cluster with control plane, remote clusters connect to it.

```
┌────────────────────────────────┐
│      Primary Cluster            │
│  ┌──────────────────────┐      │
│  │   Istio Control      │      │
│  │   Plane (istiod)     │      │
│  └─────────┬────────────┘      │
│            │                    │
│  ┌─────────▼────────────┐      │
│  │   Data Plane         │      │
│  │   (Services)         │      │
│  └──────────────────────┘      │
└────────┬───────────────────────┘
         │ Remote Access
         │
         ↓
┌────────────────────────────────┐
│      Remote Cluster             │
│  ┌──────────────────────┐      │
│  │   Data Plane         │      │
│  │   (Services)         │      │
│  │   + Eastwest Gateway │      │
│  └──────────────────────┘      │
└────────────────────────────────┘
```

### Multi-Primary Model
Multiple clusters each with their own control plane.

```
┌────────────────────────┐       ┌────────────────────────┐
│   Cluster 1 (Primary)  │       │   Cluster 2 (Primary)  │
│  ┌──────────────┐      │       │  ┌──────────────┐      │
│  │   istiod     │◄─────┼───────┼──►   istiod     │      │
│  └──────────────┘      │       │  └──────────────┘      │
│  ┌──────────────┐      │       │  ┌──────────────┐      │
│  │   Services   │◄─────┼───────┼──►   Services   │      │
│  └──────────────┘      │       │  └──────────────┘      │
└────────────────────────┘       └────────────────────────┘
```

## Prerequisites

- Two or more Kubernetes clusters
- kubectl configured for all clusters
- Cluster network connectivity
- Istio 1.18+ installed
- Load balancer support

## Tutorial Exercises

### Exercise 1: Prepare Clusters

**Label Clusters:**
```bash
# Context for cluster1
kubectl config use-context cluster1
export CTX_CLUSTER1=cluster1
export CLUSTER1_NAME=cluster1

# Context for cluster2
kubectl config use-context cluster2
export CTX_CLUSTER2=cluster2
export CLUSTER2_NAME=cluster2

# Create istio-system namespace on both
kubectl create namespace istio-system --context=${CTX_CLUSTER1}
kubectl create namespace istio-system --context=${CTX_CLUSTER2}
```

**Install CA Certificates:**
```bash
# Generate root CA
make -f tools/certs/Makefile.selfsigned.mk root-ca

# Generate intermediate certificates for each cluster
make -f tools/certs/Makefile.selfsigned.mk cluster1-cacerts
make -f tools/certs/Makefile.selfsigned.mk cluster2-cacerts

# Create secrets
kubectl create secret generic cacerts -n istio-system \
  --from-file=cluster1/ca-cert.pem \
  --from-file=cluster1/ca-key.pem \
  --from-file=cluster1/root-cert.pem \
  --from-file=cluster1/cert-chain.pem \
  --context=${CTX_CLUSTER1}

kubectl create secret generic cacerts -n istio-system \
  --from-file=cluster2/ca-cert.pem \
  --from-file=cluster2/ca-key.pem \
  --from-file=cluster2/root-cert.pem \
  --from-file=cluster2/cert-chain.pem \
  --context=${CTX_CLUSTER2}
```

### Exercise 2: Install Istio Multi-Primary

**Configure Cluster 1:**
```bash
istioctl install --context=${CTX_CLUSTER1} -f 01-cluster1-config.yaml
```

```yaml
# 01-cluster1-config.yaml
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  values:
    global:
      meshID: mesh1
      multiCluster:
        clusterName: cluster1
      network: network1
```

**Configure Cluster 2:**
```bash
istioctl install --context=${CTX_CLUSTER2} -f 02-cluster2-config.yaml
```

```yaml
# 02-cluster2-config.yaml
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  values:
    global:
      meshID: mesh1
      multiCluster:
        clusterName: cluster2
      network: network2
```

**Install East-West Gateways:**
```bash
kubectl apply --context=${CTX_CLUSTER1} -f 03-eastwest-gateway.yaml
kubectl apply --context=${CTX_CLUSTER2} -f 03-eastwest-gateway.yaml
```

### Exercise 3: Enable Endpoint Discovery

**Expose Services:**
```bash
kubectl apply --context=${CTX_CLUSTER1} -f 04-expose-services.yaml
kubectl apply --context=${CTX_CLUSTER2} -f 04-expose-services.yaml
```

**Create Remote Secrets:**
```bash
# Create secret for cluster2 to access cluster1
istioctl x create-remote-secret \
  --context=${CTX_CLUSTER1} \
  --name=cluster1 | \
  kubectl apply -f - --context=${CTX_CLUSTER2}

# Create secret for cluster1 to access cluster2
istioctl x create-remote-secret \
  --context=${CTX_CLUSTER2} \
  --name=cluster2 | \
  kubectl apply -f - --context=${CTX_CLUSTER1}
```

**Verify:**
```bash
# Check endpoints
kubectl get endpoints -A --context=${CTX_CLUSTER1}
kubectl get endpoints -A --context=${CTX_CLUSTER2}
```

### Exercise 4: Deploy Multi-Cluster Application

**Deploy to Cluster 1:**
```bash
kubectl create ns sample --context=${CTX_CLUSTER1}
kubectl label namespace sample istio-injection=enabled --context=${CTX_CLUSTER1}
kubectl apply -f 05-helloworld-v1.yaml --context=${CTX_CLUSTER1}
```

**Deploy to Cluster 2:**
```bash
kubectl create ns sample --context=${CTX_CLUSTER2}
kubectl label namespace sample istio-injection=enabled --context=${CTX_CLUSTER2}
kubectl apply -f 06-helloworld-v2.yaml --context=${CTX_CLUSTER2}
```

**Deploy Client:**
```bash
kubectl apply -f 07-sleep.yaml --context=${CTX_CLUSTER1}
```

### Exercise 5: Test Cross-Cluster Traffic

**Send Requests:**
```bash
# From cluster1 to both versions
kubectl exec --context=${CTX_CLUSTER1} -n sample -c sleep \
  $(kubectl get pod --context=${CTX_CLUSTER1} -n sample -l app=sleep -o jsonpath='{.items[0].metadata.name}') \
  -- sh -c 'for i in $(seq 1 10); do curl -s helloworld:5000/hello; done'
```

Expected output shows both v1 (from cluster1) and v2 (from cluster2):
```
Hello version: v1, instance: helloworld-v1-xxx
Hello version: v2, instance: helloworld-v2-xxx
```

### Exercise 6: Configure Locality Load Balancing

**Prefer Local Cluster:**
```bash
kubectl apply -f 08-locality-lb.yaml --context=${CTX_CLUSTER1}
```

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: helloworld
spec:
  host: helloworld.sample.svc.cluster.local
  trafficPolicy:
    loadBalancer:
      localityLbSetting:
        enabled: true
    outlierDetection:
      consecutiveErrors: 1
      interval: 1s
      baseEjectionTime: 3m
```

**Test:**
```bash
# Most traffic should go to local cluster
kubectl exec --context=${CTX_CLUSTER1} -n sample -c sleep \
  $(kubectl get pod --context=${CTX_CLUSTER1} -n sample -l app=sleep -o jsonpath='{.items[0].metadata.name}') \
  -- sh -c 'for i in $(seq 1 50); do curl -s helloworld:5000/hello; done | sort | uniq -c'
```

### Exercise 7: Multi-Cluster Failover

**Simulate Cluster Failure:**
```bash
# Scale down service in cluster1
kubectl scale deployment helloworld-v1 --replicas=0 -n sample --context=${CTX_CLUSTER1}
```

**Verify Failover:**
```bash
# All traffic should now go to cluster2
kubectl exec --context=${CTX_CLUSTER1} -n sample -c sleep \
  $(kubectl get pod --context=${CTX_CLUSTER1} -n sample -l app=sleep -o jsonpath='{.items[0].metadata.name}') \
  -- sh -c 'for i in $(seq 1 10); do curl -s helloworld:5000/hello; done'
```

**Restore:**
```bash
kubectl scale deployment helloworld-v1 --replicas=1 -n sample --context=${CTX_CLUSTER1}
```

### Exercise 8: Monitor Multi-Cluster Mesh

**Deploy Observability:**
```bash
kubectl apply -f 09-multi-cluster-observability.yaml --context=${CTX_CLUSTER1}
```

**Access Kiali:**
```bash
kubectl port-forward -n istio-system svc/kiali 20001:20001 --context=${CTX_CLUSTER1}
```

Navigate to Kiali and observe:
- Services across clusters
- Cross-cluster traffic
- Multi-cluster topology
- Failover behavior

## Verification

```bash
# Check multi-cluster status
istioctl proxy-status --context=${CTX_CLUSTER1}
istioctl proxy-status --context=${CTX_CLUSTER2}

# Verify remote secrets
kubectl get secrets -n istio-system --context=${CTX_CLUSTER1} | grep istio-remote-secret
kubectl get secrets -n istio-system --context=${CTX_CLUSTER2} | grep istio-remote-secret

# Check endpoint discovery
kubectl exec -n sample --context=${CTX_CLUSTER1} \
  $(kubectl get pod -n sample -l app=sleep --context=${CTX_CLUSTER1} -o jsonpath='{.items[0].metadata.name}') \
  -c istio-proxy -- pilot-agent request GET clusters | grep helloworld
```

## Troubleshooting

### Cross-Cluster Traffic Not Working

```bash
# Verify east-west gateway
kubectl get svc -n istio-system --context=${CTX_CLUSTER1} | grep eastwest
kubectl get svc -n istio-system --context=${CTX_CLUSTER2} | grep eastwest

# Check connectivity
kubectl run -it --rm debug --image=curlimages/curl --context=${CTX_CLUSTER1} -- \
  curl -v http://<eastwest-gateway-ip>:15021/healthz/ready

# Verify remote secret
kubectl get secret -n istio-system --context=${CTX_CLUSTER1} -o yaml
```

### Certificate Issues

```bash
# Verify certificates match
kubectl get secret cacerts -n istio-system --context=${CTX_CLUSTER1} -o jsonpath='{.data.root-cert\.pem}' | base64 -d | openssl x509 -text -noout

kubectl get secret cacerts -n istio-system --context=${CTX_CLUSTER2} -o jsonpath='{.data.root-cert\.pem}' | base64 -d | openssl x509 -text -noout
```

## Best Practices

1. **Use Same Root CA**: For all clusters
2. **Plan Network Topology**: Consider latency and costs
3. **Configure Locality LB**: Reduce cross-cluster traffic
4. **Monitor Cross-Cluster Latency**: Set appropriate timeouts
5. **Test Failover**: Regularly test disaster recovery
6. **Secure East-West Traffic**: Use mTLS
7. **Version Control**: Keep clusters at same Istio version

## Cleanup

```bash
kubectl delete ns sample --context=${CTX_CLUSTER1}
kubectl delete ns sample --context=${CTX_CLUSTER2}
istioctl uninstall --purge --context=${CTX_CLUSTER1}
istioctl uninstall --purge --context=${CTX_CLUSTER2}
```

## Next Steps

- [08_production_deployment](../08_production_deployment/): Production-ready Istio configuration
- Implement global load balancing
- Configure multi-region failover
- Set up centralized observability

## Resources

- [Istio Multi-Cluster](https://istio.io/latest/docs/setup/install/multicluster/)
- [Multi-Cluster Service Mesh](https://istio.io/latest/docs/ops/deployment/deployment-models/)
- [Best Practices](https://istio.io/latest/docs/ops/best-practices/deployment/)
