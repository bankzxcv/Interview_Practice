# Helm Lifecycle Hooks

## Overview
Use Helm hooks for pre/post install, upgrade, and delete operations.

## Hook Types

```yaml
# Pre-install hook (run before install)
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "my-app.fullname" . }}-pre-install
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      containers:
      - name: pre-install
        image: busybox
        command: ['sh', '-c', 'echo Pre-install hook']
      restartPolicy: Never
```

## Available Hooks

- `pre-install`: Before any resources created
- `post-install`: After all resources created
- `pre-delete`: Before any deletion
- `post-delete`: After all deletions
- `pre-upgrade`: Before upgrade
- `post-upgrade`: After upgrade
- `pre-rollback`: Before rollback
- `post-rollback`: After rollback
- `test`: When helm test runs

## Hook Weights

```yaml
annotations:
  "helm.sh/hook-weight": "-5"  # Run early
  "helm.sh/hook-weight": "0"   # Default
  "helm.sh/hook-weight": "5"   # Run late
```

## Delete Policies

```yaml
"helm.sh/hook-delete-policy": before-hook-creation
"helm.sh/hook-delete-policy": hook-succeeded
"helm.sh/hook-delete-policy": hook-failed
```

## Next Steps
- Tutorial 06: Dependencies
