# Consul Tutorial 08: Production Deployment

## Overview

Deploy Consul in production with best practices for security, high availability, performance, and operational excellence.

## Learning Objectives

- Configure production Consul installation
- Implement security hardening
- Set up high availability
- Configure ACLs and encryption
- Plan backup and disaster recovery
- Implement monitoring and alerting
- Create operational runbooks

## Production Architecture

```
┌─────────────────────────────────────────────┐
│      Production Consul Cluster               │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Consul Servers (5 for HA)             │ │
│  │  • Raft quorum                         │ │
│  │  • Persistent storage (SSD)            │ │
│  │  • Resource limits set                  │ │
│  │  • Anti-affinity rules                 │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Consul Clients (DaemonSet)            │ │
│  │  • On every node                       │ │
│  │  • Local service discovery             │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Mesh Gateways (HA)                    │ │
│  │  • Min 2 replicas                      │ │
│  │  • LoadBalancer service                │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Ingress Gateways                      │ │
│  │  • External traffic entry              │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Production Installation

### Production Helm Values

```yaml
# production-values.yaml
global:
  name: consul
  datacenter: dc1

  # Image
  image: hashicorp/consul-enterprise:1.17.0-ent

  # Encryption
  gossipEncryption:
    secretName: consul-gossip-encryption-key
    secretKey: key

  # TLS
  tls:
    enabled: true
    httpsOnly: true
    verify: true
    serverAdditionalDNSSANs:
      - "consul.company.com"
    caCert:
      secretName: consul-ca-cert
    caKey:
      secretName: consul-ca-key

  # ACLs
  acls:
    manageSystemACLs: true
    bootstrapToken:
      secretName: consul-bootstrap-token

  # Metrics
  metrics:
    enabled: true
    enableAgentMetrics: true
    enableHostMetrics: true

# Server configuration
server:
  replicas: 5
  bootstrapExpect: 5

  # Storage
  storageClass: fast-ssd
  storage: 50Gi

  # Resources
  resources:
    requests:
      memory: "2Gi"
      cpu: "1000m"
    limits:
      memory: "4Gi"
      cpu: "2000m"

  # Affinity
  affinity: |
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: {{ template "consul.name" . }}
              release: "{{ .Release.Name }}"
              component: server
          topologyKey: kubernetes.io/hostname

  # Pod Disruption Budget
  disruptionBudget:
    enabled: true
    maxUnavailable: 1

  # Snapshots
  snapshotAgent:
    enabled: true
    interval: "1h"
    retain: 168  # 7 days
    configSecret:
      secretName: consul-snapshot-config

# Client configuration
client:
  enabled: true
  grpc: true
  resources:
    requests:
      memory: "256Mi"
      cpu: "200m"
    limits:
      memory: "512Mi"
      cpu: "500m"

# Connect Inject
connectInject:
  enabled: true
  default: false  # Explicit opt-in

  # Resources for sidecars
  sidecarProxy:
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "512Mi"
        cpu: "1000m"

  # Central config
  centralConfig:
    enabled: true
    defaultProtocol: "http"
    proxyDefaults: |
      {
        "envoy_prometheus_bind_addr": "0.0.0.0:9102"
      }

# Mesh Gateway
meshGateway:
  enabled: true
  replicas: 3

  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: "nlb"

  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"

  affinity: |
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: {{ template "consul.name" . }}
                component: mesh-gateway
            topologyKey: kubernetes.io/hostname

# Ingress Gateway
ingressGateways:
  enabled: true
  defaults:
    replicas: 2
  gateways:
    - name: public-ingress
      service:
        type: LoadBalancer

# UI
ui:
  enabled: true
  service:
    type: ClusterIP  # Use ingress for external access
```

### Security Configuration

**Generate Secrets:**
```bash
# Gossip encryption key
kubectl create secret generic consul-gossip-encryption-key \
  --from-literal=key=$(consul keygen) \
  -n consul

# Bootstrap ACL token
kubectl create secret generic consul-bootstrap-token \
  --from-literal=token=$(uuidgen | tr '[:upper:]' '[:lower:]') \
  -n consul

# TLS certificates
consul tls ca create
kubectl create secret generic consul-ca-cert \
  --from-file=tls.crt=consul-agent-ca.pem \
  -n consul
kubectl create secret generic consul-ca-key \
  --from-file=tls.key=consul-agent-ca-key.pem \
  -n consul
```

**Install Production Consul:**
```bash
helm install consul hashicorp/consul \
  -n consul \
  --create-namespace \
  --values production-values.yaml \
  --wait
```

## High Availability

**Server Quorum:**
- 3 servers: Tolerates 1 failure
- 5 servers: Tolerates 2 failures (recommended)
- 7 servers: Tolerates 3 failures (large deployments)

**Client Agents:**
- DaemonSet on every node
- Local service discovery
- Health checking

**Mesh Gateways:**
- Min 2 replicas per datacenter
- LoadBalancer service
- Anti-affinity rules

## Backup and Recovery

**Enable Snapshots:**
```yaml
server:
  snapshotAgent:
    enabled: true
    interval: "1h"
    retain: 168
    configSecret:
      secretName: consul-snapshot-config
```

**Snapshot Configuration:**
```json
{
  "snapshot_agent": {
    "http_addr": "127.0.0.1:8500",
    "token": "bootstrap-token",
    "datacenter": "dc1",
    "snapshot": {
      "interval": "1h",
      "retain": 168,
      "stale": false,
      "service": "consul-snapshot",
      "deregister_after": "72h",
      "local_scratch_path": "/tmp",
      "local_path": "/consul/snapshots"
    }
  }
}
```

**Manual Backup:**
```bash
# Take snapshot
consul snapshot save backup.snap

# Restore snapshot
consul snapshot restore backup.snap
```

## Monitoring

**Prometheus Scrape Config:**
```yaml
scrape_configs:
  - job_name: 'consul-servers'
    consul_sd_configs:
      - server: 'consul-server.consul:8500'
        datacenter: 'dc1'
        services: ['consul']

  - job_name: 'consul-services'
    metrics_path: '/metrics'
    consul_sd_configs:
      - server: 'consul-server.consul:8500'
```

**Critical Alerts:**
```yaml
groups:
  - name: consul_critical
    rules:
      - alert: ConsulServerQuorumLost
        expr: consul_raft_peers < 3
        for: 1m
        labels:
          severity: critical

      - alert: ConsulLeadershipFlapping
        expr: changes(consul_raft_leader[1h]) > 5
        labels:
          severity: critical
```

## Operational Runbook

### Daily Checks
```bash
# Cluster health
consul members
consul operator raft list-peers

# Service health
consul catalog services
consul health state critical
```

### Weekly Tasks
```bash
# Review snapshots
ls -lh /consul/snapshots/

# Check resource usage
kubectl top pods -n consul

# Review metrics
# Check Grafana dashboards
```

### Monthly Tasks
```bash
# Rotate ACL tokens
consul acl token update -id=<token-id> -policy-name=<new-policy>

# Update Consul version
helm upgrade consul hashicorp/consul -n consul -f production-values.yaml

# Review and update intentions
consul intention list
```

## Production Checklist

- [ ] 5 server replicas for HA
- [ ] Persistent SSD storage
- [ ] Gossip encryption enabled
- [ ] TLS enabled (httpsOnly)
- [ ] ACLs configured
- [ ] Resource limits set
- [ ] Pod disruption budgets
- [ ] Anti-affinity rules
- [ ] Automated snapshots
- [ ] Monitoring and alerting
- [ ] Disaster recovery tested
- [ ] Documentation complete
- [ ] Team trained

## Best Practices

1. **High Availability**: Min 5 servers
2. **Security First**: TLS + ACLs + Encryption
3. **Regular Backups**: Automated snapshots
4. **Monitor Everything**: Servers, services, gateways
5. **Resource Limits**: Prevent resource exhaustion
6. **Test DR**: Regular failover drills
7. **Document Procedures**: Runbooks for operations
8. **Version Control**: Configuration in Git
9. **Gradual Rollouts**: Test in staging first
10. **Stay Updated**: Regular Consul upgrades

## Disaster Recovery

**Scenario 1: Server Failure**
- Quorum maintained with 5 servers
- Failed server automatically replaced
- No manual intervention needed

**Scenario 2: Data Corruption**
```bash
# Stop affected servers
# Restore from snapshot
consul snapshot restore backup.snap
# Restart servers
```

**Scenario 3: Complete Cluster Loss**
```bash
# Restore from latest snapshot in new cluster
# Reconfigure clients to point to new servers
# Verify all services registered
```

## Cleanup

```bash
# Production cleanup not recommended!
# Only for decommissioning
helm uninstall consul -n consul
kubectl delete namespace consul
```

## Resources

- [Consul Production Deployment](https://learn.hashicorp.com/tutorials/consul/kubernetes-production-deploy)
- [Consul Enterprise](https://www.consul.io/docs/enterprise)
- [Security Model](https://www.consul.io/docs/security)
- [Operations Guide](https://www.consul.io/docs/k8s/operations)
