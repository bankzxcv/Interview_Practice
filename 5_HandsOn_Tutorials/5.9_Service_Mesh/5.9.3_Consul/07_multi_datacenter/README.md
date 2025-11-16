# Consul Tutorial 07: Multi-Datacenter

## Overview

Deploy Consul across multiple datacenters for high availability, disaster recovery, and global service mesh. Learn WAN federation and mesh gateways.

## Learning Objectives

- Configure WAN federation
- Deploy mesh gateways
- Enable cross-DC service discovery
- Implement failover between DCs
- Configure replication
- Monitor multi-DC mesh

## Multi-DC Architecture

```
┌──────────────────────────────────┐    ┌──────────────────────────────────┐
│    Datacenter 1 (dc1)             │    │    Datacenter 2 (dc2)             │
│                                   │    │                                   │
│  ┌─────────────────────────────┐ │    │ ┌─────────────────────────────┐ │
│  │  Consul Servers (3)         │◄┼────┼─►  Consul Servers (3)         │ │
│  │  • Raft consensus (local)   │ │WAN │ │  • Raft consensus (local)   │ │
│  │  • Service catalog          │ │Fed │ │  • Service catalog          │ │
│  └─────────────────────────────┘ │    │ └─────────────────────────────┘ │
│                                   │    │                                   │
│  ┌─────────────────────────────┐ │    │ ┌─────────────────────────────┐ │
│  │  Mesh Gateway               │◄┼────┼─►  Mesh Gateway               │ │
│  │  • Cross-DC traffic         │ │    │ │  • Cross-DC traffic         │ │
│  └─────────────────────────────┘ │    │ └─────────────────────────────┘ │
│                                   │    │                                   │
│  ┌─────────────────────────────┐ │    │ ┌─────────────────────────────┐ │
│  │  Services                   │ │    │ │  Services                   │ │
│  │  • web, api, db             │ │    │ │  • web, api, db             │ │
│  └─────────────────────────────┘ │    │ └─────────────────────────────┘ │
└──────────────────────────────────┘    └──────────────────────────────────┘
```

## WAN Federation

### Primary Datacenter (dc1)

**Install Consul:**
```yaml
# dc1-values.yaml
global:
  name: consul
  datacenter: dc1
  federation:
    enabled: true
    createFederationSecret: true
  tls:
    enabled: true

server:
  replicas: 3

connectInject:
  enabled: true

meshGateway:
  enabled: true
  replicas: 2
```

```bash
helm install consul-dc1 hashicorp/consul \
  -n consul \
  --values dc1-values.yaml
```

**Get Federation Secret:**
```bash
# Export federation secret
kubectl get secret consul-federation -n consul -o yaml > federation-secret.yaml
```

### Secondary Datacenter (dc2)

**Install with Federation:**
```yaml
# dc2-values.yaml
global:
  name: consul
  datacenter: dc2
  federation:
    enabled: true
    primaryDatacenter: dc1
    primaryGateways:
      - <dc1-mesh-gateway-ip>:443
  tls:
    enabled: true

server:
  replicas: 3

connectInject:
  enabled: true

meshGateway:
  enabled: true
  replicas: 2
```

**Apply Federation Secret:**
```bash
# In dc2 cluster
kubectl apply -f federation-secret.yaml -n consul
```

**Install dc2:**
```bash
helm install consul-dc2 hashicorp/consul \
  -n consul \
  --values dc2-values.yaml
```

## Mesh Gateways

**Purpose:**
- Route traffic between datacenters
- Maintain mTLS across DCs
- Service-to-service communication

**Configuration:**
```yaml
meshGateway:
  enabled: true
  replicas: 2
  service:
    type: LoadBalancer
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
```

**Verify Mesh Gateways:**
```bash
# Check gateway pods
kubectl get pods -n consul -l component=mesh-gateway

# Check gateway service
kubectl get svc -n consul consul-mesh-gateway
```

## Cross-DC Service Discovery

**Deploy Service in dc1:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: default
spec:
  template:
    metadata:
      annotations:
        "consul.hashicorp.com/connect-inject": "true"
```

**Query from dc2:**
```bash
# DNS query
dig api.service.dc1.consul

# Via Consul API
consul catalog services -datacenter=dc1

# HTTP query
curl http://localhost:8500/v1/catalog/service/api?dc=dc1
```

## Cross-DC Service Communication

**Configure Upstream to Remote DC:**
```yaml
annotations:
  "consul.hashicorp.com/connect-inject": "true"
  "consul.hashicorp.com/connect-service-upstreams": "api:8080:dc1"
```

**Traffic flows:**
```
Service (dc2) → Envoy → Mesh Gateway (dc2) → Mesh Gateway (dc1) → Service (dc1)
```

## Replication

**Enable ACL Replication:**
```yaml
global:
  acls:
    manageSystemACLs: true
    replicationToken:
      secretName: consul-replication-acl-token
```

**Enable Config Replication:**
```yaml
server:
  enableConfigReplication: true
```

## Failover Configuration

**Prepared Query for Failover:**
```bash
consul query create \
  -name api-failover \
  -service api \
  -failover-datacenters dc2

# Query will try dc1 first, failover to dc2 if unavailable
```

**Service Resolver:**
```yaml
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceResolver
metadata:
  name: api
spec:
  connectTimeout: 5s
  failover:
    "*":
      datacenters:
        - dc2
        - dc3
```

## Monitoring Multi-DC

**Mesh Gateway Health:**
```bash
# Check gateway status
consul catalog service mesh-gateway

# Monitor cross-DC traffic
kubectl exec -n consul <mesh-gateway-pod> -- \
  curl -s localhost:19000/stats | grep upstream
```

**WAN Federation Status:**
```bash
# View federated datacenters
consul catalog datacenters

# WAN gossip pool
kubectl exec -n consul consul-server-0 -- consul members -wan
```

## Best Practices

1. **Multiple Mesh Gateways**: HA per DC
2. **Monitor WAN Latency**: Cross-DC performance
3. **Use Failover**: Automatic disaster recovery
4. **Secure WAN**: TLS and ACLs
5. **Test Failover**: Regular DR drills
6. **Plan for Latency**: Cross-DC is slower
7. **Replicate Config**: Consistent policies

## Troubleshooting

**Mesh Gateway Connection Issues:**
```bash
# Check gateway logs
kubectl logs -n consul <mesh-gateway-pod>

# Verify gateway endpoint
kubectl get svc -n consul consul-mesh-gateway

# Test connectivity
telnet <gateway-ip> 443
```

**Federation Not Working:**
```bash
# Check federation secret
kubectl get secret consul-federation -n consul

# Verify WAN members
kubectl exec -n consul consul-server-0 -- consul members -wan

# Check server logs
kubectl logs -n consul consul-server-0 | grep -i federation
```

## Next Steps

- [08_production_deployment](../08_production_deployment/): Production Consul
- Configure geo-routing
- Implement global load balancing
- Set up cross-DC observability
