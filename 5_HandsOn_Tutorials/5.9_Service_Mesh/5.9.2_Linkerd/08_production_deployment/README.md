# Linkerd Tutorial 08: Production Deployment

## Overview

Deploy Linkerd in production with best practices for high availability, security, performance, and operational excellence.

## Learning Objectives

- Configure production-ready Linkerd
- Implement high availability
- Set up proper security
- Configure resource limits
- Plan upgrade strategies
- Implement monitoring and alerting
- Create operational runbooks

## Production Architecture

```
┌─────────────────────────────────────────────┐
│       Production Cluster                     │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │   Linkerd Control Plane (HA)           │ │
│  │  ┌────────────┐  ┌────────────┐       │ │
│  │  │destination │  │destination │       │ │
│  │  │    (1)     │  │    (2)     │       │ │
│  │  └────────────┘  └────────────┘       │ │
│  │  ┌────────────┐  ┌────────────┐       │ │
│  │  │  identity  │  │  identity  │       │ │
│  │  │    (1)     │  │    (2)     │       │ │
│  │  └────────────┘  └────────────┘       │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │   Data Plane (with limits)             │ │
│  │  Proxies: CPU 100m-2000m, Mem 128Mi-1Gi│ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │   Observability (HA)                   │ │
│  │  Prometheus (HA), Grafana              │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Production Installation

### Step 1: Generate Production Certificates

**Using step CLI:**
```bash
# Install step
brew install step  # or download from https://smallstep.com/docs/step-cli/installation

# Generate root CA (30-year validity)
step certificate create root.linkerd.cluster.local ca.crt ca.key \
  --profile root-ca \
  --no-password \
  --insecure \
  --not-after=262800h

# Generate issuer certificate (1-year validity, rotate annually)
step certificate create identity.linkerd.cluster.local issuer.crt issuer.key \
  --profile intermediate-ca \
  --not-after=8760h \
  --no-password \
  --insecure \
  --ca ca.crt \
  --ca-key ca.key

# Store certificates securely
# Production: Use HashiCorp Vault or AWS Secrets Manager
kubectl create secret generic linkerd-trust-anchor \
  -n linkerd \
  --from-file=ca.crt=ca.crt

kubectl create secret tls linkerd-identity-issuer \
  -n linkerd \
  --cert=issuer.crt \
  --key=issuer.key
```

### Step 2: Production Linkerd Configuration

**Install with Production Settings:**
```bash
linkerd install \
  --identity-trust-anchors-file ca.crt \
  --identity-issuer-certificate-file issuer.crt \
  --identity-issuer-key-file issuer.key \
  --set controlPlaneTracing=true \
  --set controllerReplicas=3 \
  --set identityReplicas=3 \
  --set proxyInjector.replicas=3 \
  --set policyController.defaultAllowPolicy=deny \
  | kubectl apply -f -
```

**Or use Helm for more control:**
```bash
helm repo add linkerd https://helm.linkerd.io/stable
helm repo update

# Install CRDs
helm install linkerd-crds linkerd/linkerd-crds \
  -n linkerd --create-namespace

# Install control plane
helm install linkerd-control-plane \
  -n linkerd \
  --set-file identityTrustAnchorsPEM=ca.crt \
  --set-file identity.issuer.tls.crtPEM=issuer.crt \
  --set-file identity.issuer.tls.keyPEM=issuer.key \
  linkerd/linkerd-control-plane \
  -f 01-production-values.yaml
```

**Production values.yaml:**
```yaml
# 01-production-values.yaml
controllerReplicas: 3
identityReplicas: 3

policyController:
  defaultAllowPolicy: deny  # Secure by default

proxyInit:
  resources:
    cpu:
      limit: 100m
      request: 10m
    memory:
      limit: 50Mi
      request: 10Mi

proxy:
  resources:
    cpu:
      limit: 2000m
      request: 100m
    memory:
      limit: 1024Mi
      request: 128Mi

  # Enable slow-start
  await: true

  # Logging
  logLevel: warn

controllerLogLevel: info
controllerLogFormat: json

# High availability
podAntiAffinity: true

# Resource limits for control plane
resources:
  cpu:
    limit: 1000m
    request: 250m
  memory:
    limit: 2Gi
    request: 512Mi
```

### Step 3: Install Production Viz

```bash
linkerd viz install \
  --set prometheus.replicas=2 \
  --set prometheusUrl=http://prometheus.monitoring:9090 \
  --set jaeger.enabled=true \
  | kubectl apply -f -
```

### Step 4: Configure Pod Disruption Budgets

```bash
kubectl apply -f - <<EOF
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: linkerd-destination
  namespace: linkerd
spec:
  minAvailable: 2
  selector:
    matchLabels:
      linkerd.io/control-plane-component: destination
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: linkerd-identity
  namespace: linkerd
spec:
  minAvailable: 2
  selector:
    matchLabels:
      linkerd.io/control-plane-component: identity
EOF
```

## Resource Management

### Proxy Resource Limits

**Set via annotation:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    metadata:
      annotations:
        config.linkerd.io/proxy-cpu-request: "100m"
        config.linkerd.io/proxy-cpu-limit: "1000m"
        config.linkerd.io/proxy-memory-request: "128Mi"
        config.linkerd.io/proxy-memory-limit: "512Mi"
```

**Or set defaults in config:**
```yaml
proxy:
  resources:
    cpu:
      limit: "1000m"
      request: "100m"
    memory:
      limit: "512Mi"
      request: "128Mi"
```

## Monitoring and Alerting

### Prometheus Alerts

```yaml
# 02-linkerd-alerts.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: linkerd-alerts
  namespace: linkerd-viz
data:
  alerts.yml: |
    groups:
      - name: linkerd_control_plane
        rules:
          - alert: LinkerdControlPlaneDown
            expr: up{job="linkerd-controller"} == 0
            for: 1m
            labels:
              severity: critical
            annotations:
              summary: "Linkerd control plane is down"

          - alert: LinkerdHighMemoryUsage
            expr: |
              (container_memory_working_set_bytes{namespace="linkerd"} /
               container_spec_memory_limit_bytes{namespace="linkerd"}) > 0.9
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "Linkerd component using >90% memory"

      - name: linkerd_data_plane
        rules:
          - alert: LinkerdHighErrorRate
            expr: |
              (sum(rate(response_total{classification!="success"}[5m])) /
               sum(rate(response_total[5m]))) > 0.05
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "Error rate >5%"

          - alert: LinkerdHighLatency
            expr: |
              histogram_quantile(0.99,
                sum(rate(response_latency_ms_bucket[5m])) by (le)
              ) > 1000
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "P99 latency >1000ms"
```

### Grafana Dashboards

```bash
# Import pre-built dashboards
kubectl apply -f 03-production-dashboards.yaml
```

## Upgrade Strategy

### Zero-Downtime Upgrade

**Step 1: Backup Current Configuration:**
```bash
linkerd install > linkerd-backup-$(date +%Y%m%d).yaml
kubectl get -n linkerd secret linkerd-identity-issuer -o yaml > identity-backup.yaml
```

**Step 2: Upgrade Control Plane:**
```bash
# Check upgrade compatibility
linkerd check --pre

# Upgrade
linkerd upgrade \
  --identity-trust-anchors-file ca.crt \
  --identity-issuer-certificate-file issuer.crt \
  --identity-issuer-key-file issuer.key \
  | kubectl apply -f -

# Verify
linkerd check
```

**Step 3: Upgrade Data Plane (Rolling):**
```bash
# Restart deployments one namespace at a time
kubectl rollout restart deployment -n production
kubectl rollout restart deployment -n staging

# Monitor
linkerd viz stat deploy -n production
```

## Security Hardening

### Enable Default-Deny

```bash
linkerd upgrade --set policyController.defaultAllowPolicy=deny | kubectl apply -f -
```

### Rotate Certificates

```bash
# Generate new issuer certificate
step certificate create identity.linkerd.cluster.local new-issuer.crt new-issuer.key \
  --profile intermediate-ca \
  --not-after=8760h \
  --no-password \
  --insecure \
  --ca ca.crt \
  --ca-key ca.key

# Update secret
kubectl create secret tls linkerd-identity-issuer \
  -n linkerd \
  --cert=new-issuer.crt \
  --key=new-issuer.key \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart identity
kubectl rollout restart deployment/linkerd-identity -n linkerd
```

## Operational Runbook

### Daily Checks

```bash
# Health check
linkerd check

# Control plane status
kubectl get pods -n linkerd

# Error rates
linkerd viz stat deploy -A | awk '$4 < 95 {print $0}'
```

### Weekly Tasks

```bash
# Review metrics
linkerd viz top deploy -n production

# Check certificate expiry
kubectl get secret linkerd-identity-issuer -n linkerd -o jsonpath='{.data.tls\.crt}' | \
  base64 -d | openssl x509 -noout -dates

# Review logs for errors
kubectl logs -n linkerd deploy/linkerd-destination --tail=100 | grep -i error
```

### Monthly Tasks

```bash
# Review resource usage
kubectl top pods -n linkerd
kubectl top pods -A -l linkerd.io/control-plane-ns=linkerd

# Update Linkerd
linkerd upgrade | kubectl apply -f -

# Review and update policies
kubectl get serverauthorization -A
```

## Production Checklist

- [ ] Custom certificates (not default)
- [ ] High availability (3+ replicas)
- [ ] Resource limits set
- [ ] Pod disruption budgets configured
- [ ] Default-deny policy enabled
- [ ] Monitoring and alerting configured
- [ ] Backup strategy in place
- [ ] Upgrade plan documented
- [ ] Disaster recovery tested
- [ ] Security policies defined
- [ ] Documentation updated
- [ ] Team trained

## Best Practices

1. **High Availability**: Min 3 replicas for control plane
2. **Resource Limits**: Set on all components
3. **Default-Deny**: Secure by default
4. **Monitor Everything**: Control plane and data plane
5. **Regular Upgrades**: Stay current with releases
6. **Certificate Management**: Rotate annually
7. **Test Upgrades**: In staging first
8. **Document Procedures**: Runbooks for common tasks
9. **Backup Configuration**: Before any changes
10. **Monitor Resource Usage**: Prevent resource exhaustion

## Troubleshooting

### High CPU Usage

```bash
# Check which pods
kubectl top pods -A | sort -k3 -nr | head -20

# Adjust proxy resources
config.linkerd.io/proxy-cpu-limit: "500m"
```

### Certificate Issues

```bash
# Check expiry
kubectl get secret linkerd-identity-issuer -n linkerd -o jsonpath='{.data.tls\.crt}' | \
  base64 -d | openssl x509 -noout -dates

# Rotate if needed (see Security Hardening section)
```

### Control Plane Issues

```bash
# Check logs
kubectl logs -n linkerd deploy/linkerd-destination
kubectl logs -n linkerd deploy/linkerd-identity

# Restart if needed
kubectl rollout restart deployment -n linkerd
```

## Cleanup

```bash
# Production cleanup not recommended!
# If needed:
linkerd viz uninstall | kubectl delete -f -
linkerd uninstall | kubectl delete -f -
```

## Resources

- [Linkerd Production Best Practices](https://linkerd.io/2/tasks/production/)
- [Upgrade Guide](https://linkerd.io/2/tasks/upgrade/)
- [Certificate Management](https://linkerd.io/2/tasks/automatically-rotating-control-plane-tls-credentials/)
- [High Availability](https://linkerd.io/2/tasks/configuring-high-availability/)
