# Helm Values

## Overview
Learn to use values files and overrides for configuration management.

## Values Hierarchy

```bash
# Default values.yaml
helm install my-release my-app

# Override with file
helm install my-release my-app -f custom-values.yaml

# Override with --set
helm install my-release my-app --set replicaCount=3

# Multiple overrides (later takes precedence)
helm install my-release my-app \
  -f values.yaml \
  -f values-prod.yaml \
  --set image.tag=2.0
```

## Environment-Specific Values

```yaml
# values-dev.yaml
replicaCount: 1
resources:
  limits:
    cpu: 100m
    memory: 128Mi

# values-prod.yaml
replicaCount: 3
resources:
  limits:
    cpu: 500m
    memory: 512Mi
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
```

## Using Values in Templates

```yaml
# Access nested values
{{ .Values.image.repository }}:{{ .Values.image.tag }}

# With default
{{ .Values.image.tag | default "latest" }}

# Conditional
{{- if .Values.ingress.enabled }}
# ingress config
{{- end }}
```

## Next Steps
- Tutorial 04: Functions
