# Helm Chart Dependencies

## Overview
Manage chart dependencies and subcharts for complex applications.

## Chart.yaml Dependencies

```yaml
apiVersion: v2
name: my-app
version: 1.0.0
dependencies:
  - name: postgresql
    version: 11.x.x
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
  - name: redis
    version: 17.x.x
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
```

## Installing Dependencies

```bash
# Download dependencies
helm dependency update my-app

# List dependencies
helm dependency list my-app

# Build dependencies
helm dependency build my-app
```

## Overriding Subchart Values

```yaml
# values.yaml
postgresql:
  enabled: true
  auth:
    database: myapp
    username: appuser
  primary:
    persistence:
      size: 10Gi

redis:
  enabled: true
  master:
    persistence:
      size: 8Gi
```

## Accessing Subchart Values

```yaml
# In parent chart templates
{{- if .Values.postgresql.enabled }}
database: {{ .Values.postgresql.auth.database }}
{{- end }}
```

## Next Steps
- Tutorial 07: Repository
