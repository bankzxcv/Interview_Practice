# Istio Tutorial 08: Production Deployment

## Overview

Deploy Istio in production with best practices for security, reliability, performance, and maintainability. Learn production-grade configurations, upgrade strategies, and operational procedures.

## Learning Objectives

- Configure production-ready Istio installation
- Implement security hardening
- Set up high availability
- Configure resource limits and autoscaling
- Implement monitoring and alerting
- Plan upgrade strategies
- Troubleshoot production issues
- Optimize performance

## Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Production Cluster                          │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Control Plane (HA Configuration)               │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │ istiod-1 │  │ istiod-2 │  │ istiod-3 │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Ingress Gateway (HA)                         │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │ │
│  │  │Gateway 1│  │Gateway 2│  │Gateway 3│  │Gateway 4│  │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Application Services                      │ │
│  │         (with sidecars, resource limits)               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Observability Stack                            │ │
│  │  Prometheus | Grafana | Jaeger | Kiali                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Production Installation

### Exercise 1: Production IstioOperator Configuration

**Complete Production Config:**
```bash
kubectl apply -f 01-production-istio.yaml
```

```yaml
# 01-production-istio.yaml
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: production-istio
  namespace: istio-system
spec:
  profile: default

  components:
    pilot:
      enabled: true
      k8s:
        # High Availability
        replicaCount: 3

        # Resource limits
        resources:
          requests:
            cpu: 500m
            memory: 2048Mi
          limits:
            cpu: 2000m
            memory: 4096Mi

        # Horizontal Pod Autoscaling
        hpaSpec:
          minReplicas: 3
          maxReplicas: 10
          metrics:
            - type: Resource
              resource:
                name: cpu
                targetAverageUtilization: 80

        # Pod Disruption Budget
        podDisruptionBudget:
          minAvailable: 2

        # Pod Anti-Affinity
        affinity:
          podAntiAffinity:
            preferredDuringSchedulingIgnoredDuringExecution:
              - weight: 100
                podAffinityTerm:
                  labelSelector:
                    matchLabels:
                      app: istiod
                  topologyKey: kubernetes.io/hostname

        # Environment variables
        env:
          - name: PILOT_ENABLE_PROTOCOL_SNIFFING_FOR_OUTBOUND
            value: "true"
          - name: PILOT_ENABLE_PROTOCOL_SNIFFING_FOR_INBOUND
            value: "true"
          - name: INJECTION_WEBHOOK_CONFIG_NAME
            value: "istio-sidecar-injector"

    ingressGateways:
      - name: istio-ingressgateway
        enabled: true
        k8s:
          # High Availability
          replicaCount: 4

          # Resource limits
          resources:
            requests:
              cpu: 1000m
              memory: 1024Mi
            limits:
              cpu: 2000m
              memory: 2048Mi

          # HPA
          hpaSpec:
            minReplicas: 4
            maxReplicas: 20
            metrics:
              - type: Resource
                resource:
                  name: cpu
                  targetAverageUtilization: 80
              - type: Resource
                resource:
                  name: memory
                  targetAverageUtilization: 80

          # PDB
          podDisruptionBudget:
            minAvailable: 2

          # Service configuration
          service:
            type: LoadBalancer
            ports:
              - port: 15021
                targetPort: 15021
                name: status-port
              - port: 80
                targetPort: 8080
                name: http2
              - port: 443
                targetPort: 8443
                name: https
            annotations:
              service.beta.kubernetes.io/aws-load-balancer-type: "nlb"

          # Pod Anti-Affinity
          affinity:
            podAntiAffinity:
              requiredDuringSchedulingIgnoredDuringExecution:
                - labelSelector:
                    matchLabels:
                      app: istio-ingressgateway
                  topologyKey: kubernetes.io/hostname

  meshConfig:
    # Access logs
    accessLogFile: /dev/stdout
    accessLogEncoding: JSON
    accessLogFormat: |
      {
        "start_time": "%START_TIME%",
        "method": "%REQ(:METHOD)%",
        "path": "%REQ(X-ENVOY-ORIGINAL-PATH?:PATH)%",
        "protocol": "%PROTOCOL%",
        "response_code": "%RESPONSE_CODE%",
        "duration": "%DURATION%",
        "upstream_service_time": "%RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)%",
        "user_agent": "%REQ(USER-AGENT)%",
        "request_id": "%REQ(X-REQUEST-ID)%",
        "authority": "%REQ(:AUTHORITY)%",
        "upstream_host": "%UPSTREAM_HOST%"
      }

    # Enable automatic mTLS
    enableAutoMtls: true

    # Default config for all proxies
    defaultConfig:
      # Concurrency
      concurrency: 2

      # Tracing
      tracing:
        sampling: 1.0  # 1% sampling in production
        zipkin:
          address: zipkin.istio-system:9411

      # Proxy metadata
      proxyMetadata:
        ISTIO_META_DNS_CAPTURE: "true"
        ISTIO_META_DNS_AUTO_ALLOCATE: "true"

      # Hold application until proxy is ready
      holdApplicationUntilProxyStarts: true

    # Outbound traffic policy
    outboundTrafficPolicy:
      mode: REGISTRY_ONLY

    # Protocol detection timeout
    protocolDetectionTimeout: 5s

    # Enable Envoy access log service
    enableEnvoyAccessLogService: true

  values:
    global:
      # Logging level
      logging:
        level: "default:info"

      # Proxy configuration
      proxy:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 2000m
            memory: 1024Mi

        # Lifecycle
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]

        # Log level
        logLevel: warning
        componentLogLevel: "misc:error"

      # Proxy init
      proxy_init:
        resources:
          limits:
            cpu: 2000m
            memory: 1024Mi
          requests:
            cpu: 10m
            memory: 10Mi

      # Image pull policy
      imagePullPolicy: IfNotPresent

      # Pod DNS policy
      podDNSSearchNamespaces:
        - global
        - "{{ valueOrDefault .DeploymentMeta.Namespace \"default\" }}.global"

    # Pilot-specific values
    pilot:
      autoscaleEnabled: true
      autoscaleMin: 3
      autoscaleMax: 10
      cpu:
        targetAverageUtilization: 80
      memory:
        targetAverageUtilization: 80

      # Enable pod disruption budget
      podDisruptionBudget:
        enabled: true
        minAvailable: 2

      # Resource management
      resources:
        requests:
          cpu: 500m
          memory: 2048Mi

    # Telemetry
    telemetry:
      enabled: true
      v2:
        enabled: true
        prometheus:
          enabled: true

    # Sidecar injector webhook
    sidecarInjectorWebhook:
      enableNamespacesByDefault: false
      rewriteAppHTTPProbe: true
```

### Exercise 2: Security Hardening

**Enable Strict mTLS:**
```bash
kubectl apply -f 02-strict-mtls-production.yaml
```

**Configure Authorization Policies:**
```bash
kubectl apply -f 03-authz-policies.yaml
```

```yaml
# Deny all by default
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: production
spec:
  {}

# Allow specific services
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  selector:
    matchLabels:
      app: backend
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/production/sa/frontend"]
      to:
        - operation:
            methods: ["GET", "POST"]
```

**Pod Security:**
```bash
kubectl apply -f 04-pod-security.yaml
```

### Exercise 3: Monitoring and Alerting

**Deploy Production Observability:**
```bash
kubectl apply -f 05-production-observability.yaml
```

**Configure Prometheus Alerts:**
```bash
kubectl apply -f 06-prometheus-alerts.yaml
```

```yaml
groups:
  - name: istio_production_alerts
    rules:
      - alert: IstioHighRequestLatency
        expr: |
          histogram_quantile(0.99,
            sum(rate(istio_request_duration_milliseconds_bucket[5m])) by (le, destination_service_name)
          ) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High request latency"
          description: "99th percentile latency is above 1000ms"

      - alert: IstioHighErrorRate
        expr: |
          (sum(rate(istio_requests_total{response_code=~"5.."}[5m])) by (destination_service_name)
          /
          sum(rate(istio_requests_total[5m])) by (destination_service_name))
          > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate"
          description: "Error rate is above 5%"

      - alert: IstioControlPlaneDown
        expr: up{job="istiod"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Istio control plane is down"
```

### Exercise 4: Resource Management

**Configure Resource Quotas:**
```bash
kubectl apply -f 07-resource-quotas.yaml
```

**Set Sidecar Resource Limits:**
```bash
kubectl apply -f 08-sidecar-resources.yaml
```

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio-sidecar-injector
  namespace: istio-system
data:
  values: |
    global:
      proxy:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

### Exercise 5: Upgrade Strategy

**Canary Upgrade of Control Plane:**
```bash
# Install new version alongside old
istioctl install --set revision=1-20-0 -f 09-canary-upgrade.yaml

# Label namespace for canary
kubectl label namespace staging istio.io/rev=1-20-0 --overwrite

# Restart pods to get new sidecar
kubectl rollout restart deployment -n staging

# Verify
istioctl proxy-status | grep staging

# Promote to production
kubectl label namespace production istio.io/rev=1-20-0 --overwrite
kubectl rollout restart deployment -n production

# Remove old version
istioctl uninstall --revision=1-19-0
```

**In-Place Upgrade:**
```bash
# Download new version
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.20.0 sh -

# Upgrade
istioctl upgrade -f 01-production-istio.yaml

# Restart workloads
kubectl rollout restart deployment -n production
```

### Exercise 6: Disaster Recovery

**Backup Configuration:**
```bash
# Backup all Istio resources
kubectl get istiooperator,gateway,virtualservice,destinationrule,serviceentry,peerauthentication,requestauthentication,authorizationpolicy -A -o yaml > istio-backup.yaml

# Backup secrets
kubectl get secret -n istio-system -o yaml > istio-secrets-backup.yaml
```

**Restore:**
```bash
kubectl apply -f istio-backup.yaml
kubectl apply -f istio-secrets-backup.yaml
```

### Exercise 7: Performance Optimization

**Configure Connection Pools:**
```bash
kubectl apply -f 10-connection-pools.yaml
```

**Enable HTTP/2:**
```bash
kubectl apply -f 11-http2-config.yaml
```

**Optimize Proxy:**
```bash
kubectl apply -f 12-proxy-optimization.yaml
```

### Exercise 8: Operations Runbook

**Health Checks:**
```bash
# Check control plane
kubectl get pods -n istio-system
istioctl version
istioctl analyze -A

# Check data plane
istioctl proxy-status
kubectl get pods -A -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[?(@.name=="istio-proxy")].ready}{"\n"}{end}'

# Check configuration
istioctl analyze -A
```

**Troubleshooting:**
```bash
# Debug specific pod
istioctl x describe pod <pod-name> -n <namespace>

# Get proxy logs
kubectl logs -n <namespace> <pod-name> -c istio-proxy

# Enable debug logging
istioctl proxy-config log <pod-name> --level debug

# Get proxy configuration
istioctl proxy-config all <pod-name> -n <namespace>

# Dump Envoy configuration
kubectl exec -n <namespace> <pod-name> -c istio-proxy -- curl localhost:15000/config_dump
```

## Production Checklist

### Pre-Deployment
- [ ] Resource limits configured
- [ ] HPA configured for control plane and gateways
- [ ] PodDisruptionBudget set
- [ ] High availability (min 3 replicas)
- [ ] Monitoring and alerting configured
- [ ] Backup strategy in place
- [ ] Disaster recovery plan documented
- [ ] Security policies defined
- [ ] mTLS enabled (STRICT mode)
- [ ] Authorization policies configured
- [ ] Network policies in place
- [ ] Upgrade strategy planned

### Post-Deployment
- [ ] Verify all components running
- [ ] Test service connectivity
- [ ] Validate mTLS working
- [ ] Check metrics collection
- [ ] Test alerting
- [ ] Verify logging
- [ ] Performance testing completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Team trained

## Best Practices

1. **High Availability**: Min 3 replicas for control plane
2. **Resource Limits**: Set on all components
3. **Auto-Scaling**: Configure HPA based on CPU/memory
4. **Pod Disruption Budgets**: Prevent complete outages
5. **Security**: STRICT mTLS + AuthorizationPolicy
6. **Monitoring**: Comprehensive metrics and alerts
7. **Logging**: Structured JSON logs
8. **Upgrades**: Use canary upgrades
9. **Disaster Recovery**: Regular backups
10. **Performance**: Tune connection pools and timeouts

## Troubleshooting Guide

### High Latency
```bash
# Check proxy overhead
istioctl experimental metrics <pod-name>

# Verify connection pool settings
kubectl get destinationrule -A -o yaml
```

### Certificate Issues
```bash
# Check certificate validity
istioctl proxy-config secret <pod-name> -o json

# Restart to get new cert
kubectl rollout restart deployment <deployment>
```

### Control Plane Issues
```bash
# Check istiod logs
kubectl logs -n istio-system deploy/istiod

# Verify webhook
kubectl get validatingwebhookconfiguration istio-validator-istio-system -o yaml
```

## Cleanup

```bash
istioctl uninstall --purge -y
kubectl delete namespace istio-system
```

## Next Steps

- Implement GitOps for Istio configuration
- Set up centralized logging with ELK/Loki
- Configure external certificate management (cert-manager, Vault)
- Implement service mesh federation

## Resources

- [Istio Production Best Practices](https://istio.io/latest/docs/ops/best-practices/)
- [Istio Performance and Scalability](https://istio.io/latest/docs/ops/deployment/performance-and-scalability/)
- [Istio FAQ](https://istio.io/latest/about/faq/)
- [Troubleshooting Guide](https://istio.io/latest/docs/ops/diagnostic-tools/)
