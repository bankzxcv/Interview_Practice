# Kustomize Generators

## Overview
Generate ConfigMaps and Secrets from files, literals, and environment files.

## ConfigMap Generator

```yaml
# kustomization.yaml
configMapGenerator:
  # From literals
  - name: app-config
    literals:
      - DATABASE_URL=postgresql://localhost/mydb
      - API_ENDPOINT=https://api.example.com

  # From files
  - name: app-files
    files:
      - config/application.properties
      - config/logging.conf

  # From env file
  - name: env-config
    envs:
      - config/app.env

  # Behavior: create, replace, merge
  - name: existing-config
    behavior: merge
    literals:
      - NEW_KEY=value
```

## Secret Generator

```yaml
secretGenerator:
  # From literals
  - name: db-credentials
    literals:
      - username=admin
      - password=secret123

  # From files
  - name: tls-secret
    files:
      - tls.crt
      - tls.key
    type: kubernetes.io/tls

  # From env file
  - name: api-keys
    envs:
      - secrets.env
```

## Generator Options

```yaml
generatorOptions:
  # Disable name suffix hash
  disableNameSuffixHash: false
  
  # Add labels to generated resources
  labels:
    app: my-app
  
  # Add annotations
  annotations:
    generated-by: kustomize
```

## Next Steps
- Tutorial 06: Transformers
