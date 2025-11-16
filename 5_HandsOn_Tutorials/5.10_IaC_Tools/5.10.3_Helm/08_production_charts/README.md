# Production Helm Charts

## Overview
Best practices for production-ready Helm charts.

## Production Values

```yaml
# values-production.yaml
replicaCount: 3

image:
  repository: myapp
  tag: "1.2.3"
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: myapp-tls
      hosts:
        - myapp.example.com

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80

monitoring:
  enabled: true
  serviceMonitor:
    enabled: true

securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000

podSecurityContext:
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true

livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5

persistence:
  enabled: true
  size: 10Gi
  storageClass: gp3

backup:
  enabled: true
  schedule: "0 2 * * *"
  retention: 30
```

## Production Deployment

```bash
# Test chart
helm lint my-app
helm template my-app -f values-production.yaml | kubectl apply --dry-run=client -f -

# Deploy to production
helm upgrade --install my-app ./my-app \
  -f values-production.yaml \
  --namespace production \
  --create-namespace \
  --wait \
  --timeout 10m \
  --atomic

# Verify
helm list -n production
helm status my-app -n production
kubectl get all -n production
```

## Best Practices

1. **Versioning**: Use semantic versioning
2. **Documentation**: Include comprehensive README
3. **Values Schema**: Define JSON schema for values
4. **Security**: Run as non-root, read-only filesystem
5. **Health Checks**: Implement liveness/readiness probes
6. **Resource Limits**: Set appropriate limits/requests
7. **Monitoring**: Include ServiceMonitor for Prometheus
8. **Secrets**: Use external secrets operator
9. **Backup**: Implement backup strategy
10. **Testing**: Use helm test for validation

## Production Checklist

- [x] Chart validated with helm lint
- [x] All templates tested
- [x] Documentation complete
- [x] Security contexts configured
- [x] Resource limits set
- [x] Health checks implemented
- [x] Monitoring configured
- [x] Backup strategy defined
- [x] Tested in staging
- [x] Rollback plan ready
