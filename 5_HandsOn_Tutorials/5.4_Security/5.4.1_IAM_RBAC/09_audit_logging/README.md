# Security Tutorial 09: Audit Logging and Monitoring Access

## 🎯 Learning Objectives

- Enable Kubernetes audit logging
- Configure audit policies
- Analyze audit logs
- Integrate with log aggregation systems
- Implement security monitoring
- Detect suspicious activities

## 📋 Prerequisites

- Kubernetes cluster with API server access
- kubectl installed
- Basic understanding of Kubernetes architecture

## 📝 What We're Building

```
Audit Infrastructure
├── Kubernetes API Server
│   ├── Audit Policy
│   └── Audit Backend (webhook/log file)
├── Log Storage
│   ├── File-based logging
│   └── Webhook to aggregator
├── Log Analysis
│   ├── Falco (runtime security)
│   └── Custom analyzers
└── Alerts
    └── Suspicious activity detection
```

## 🔍 Concepts Introduced

1. **Audit Logging**: Record all API server requests
2. **Audit Levels**: None, Metadata, Request, RequestResponse
3. **Audit Stages**: RequestReceived, ResponseStarted, ResponseComplete, Panic
4. **Audit Policy**: Define what to log
5. **Backends**: Where logs go (file, webhook)

## 📁 Step-by-Step Implementation

### Step 1: Create Audit Policy

Create `audit-policy.yaml`:

```yaml
# audit-policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # Don't log read requests to certain resources
  - level: None
    resources:
      - group: ""
        resources: ["events"]

  # Don't log watch requests
  - level: None
    verbs: ["watch"]

  # Don't log requests to system namespaces
  - level: None
    namespaces: ["kube-system", "kube-public", "kube-node-lease"]
    verbs: ["get", "list"]

  # Log Secret access at metadata level
  - level: Metadata
    resources:
      - group: ""
        resources: ["secrets"]

  # Log ConfigMap access at metadata level
  - level: Metadata
    resources:
      - group: ""
        resources: ["configmaps"]

  # Log pod exec/attach at metadata level
  - level: Metadata
    resources:
      - group: ""
        resources: ["pods/exec", "pods/attach", "pods/portforward"]

  # Log authentication and authorization
  - level: Metadata
    omitStages:
      - RequestReceived
    userGroups:
      - "system:authenticated"
      - "system:unauthenticated"

  # Log service account token creation
  - level: Request
    resources:
      - group: ""
        resources: ["serviceaccounts/token"]
    verbs: ["create"]

  # Log RBAC changes at Request level
  - level: Request
    resources:
      - group: "rbac.authorization.k8s.io"
        resources: ["roles", "rolebindings", "clusterroles", "clusterrolebindings"]
    verbs: ["create", "update", "patch", "delete"]

  # Log namespace changes
  - level: Request
    resources:
      - group: ""
        resources: ["namespaces"]
    verbs: ["create", "update", "patch", "delete"]

  # Log pod deletions at Request level
  - level: Request
    resources:
      - group: ""
        resources: ["pods"]
    verbs: ["delete", "deletecollection"]

  # Log admission webhook failures
  - level: Request
    omitStages:
      - RequestReceived
    resources:
      - group: "admissionregistration.k8s.io"

  # Catch-all rule - log everything else at Metadata level
  - level: Metadata
    omitStages:
      - RequestReceived
```

### Step 2: Configure API Server for Audit (kind cluster)

Create `kind-audit-config.yaml`:

```yaml
# kind-audit-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraMounts:
      - hostPath: ./audit-policy.yaml
        containerPath: /etc/kubernetes/audit-policy.yaml
        readOnly: true
      - hostPath: ./audit-logs
        containerPath: /var/log/kubernetes/audit
    kubeadmConfigPatches:
      - |
        kind: ClusterConfiguration
        apiServer:
          extraArgs:
            audit-policy-file: /etc/kubernetes/audit-policy.yaml
            audit-log-path: /var/log/kubernetes/audit/audit.log
            audit-log-maxage: "30"
            audit-log-maxbackup: "10"
            audit-log-maxsize: "100"
            audit-log-mode: "batch"
          extraVolumes:
            - name: audit-policy
              hostPath: /etc/kubernetes/audit-policy.yaml
              mountPath: /etc/kubernetes/audit-policy.yaml
              readOnly: true
            - name: audit-logs
              hostPath: /var/log/kubernetes/audit
              mountPath: /var/log/kubernetes/audit
```

Create cluster with audit:

```bash
# Create audit logs directory
mkdir -p audit-logs

# Create cluster with audit enabled
kind create cluster --name audit-demo --config kind-audit-config.yaml

# Wait for cluster to be ready
kubectl wait --for=condition=Ready nodes --all --timeout=300s
```

### Step 3: Verify Audit Logging

```bash
# Get control plane container name
CONTROL_PLANE=$(docker ps --filter name=audit-demo-control-plane --format "{{.Names}}")

# View audit logs
docker exec $CONTROL_PLANE tail -f /var/log/kubernetes/audit/audit.log | jq .

# Generate some activity
kubectl create namespace test-audit
kubectl create deployment nginx --image=nginx -n test-audit
kubectl get secrets -n kube-system
kubectl delete namespace test-audit

# Search audit logs for namespace creation
docker exec $CONTROL_PLANE cat /var/log/kubernetes/audit/audit.log | \
  jq 'select(.verb=="create" and .objectRef.resource=="namespaces")'
```

### Step 4: Create Audit Log Analyzer

Create `audit-analyzer.sh`:

```bash
#!/bin/bash
# audit-analyzer.sh - Analyze Kubernetes audit logs

AUDIT_LOG="/var/log/kubernetes/audit/audit.log"
CONTROL_PLANE=$(docker ps --filter name=control-plane --format "{{.Names}}")

# Extract audit log from kind
extract_logs() {
    docker exec $CONTROL_PLANE cat $AUDIT_LOG
}

# Find failed authentication attempts
find_auth_failures() {
    echo "=== Failed Authentication Attempts ==="
    extract_logs | jq -r 'select(.responseStatus.code >= 401 and .responseStatus.code <= 403) | "\(.timestamp) - User: \(.user.username) - Verb: \(.verb) - Resource: \(.objectRef.resource) - Status: \(.responseStatus.code)"'
}

# Find secret access
find_secret_access() {
    echo "=== Secret Access ==="
    extract_logs | jq -r 'select(.objectRef.resource=="secrets") | "\(.timestamp) - User: \(.user.username) - Verb: \(.verb) - Namespace: \(.objectRef.namespace) - Name: \(.objectRef.name)"'
}

# Find pod exec/attach
find_pod_exec() {
    echo "=== Pod Exec/Attach Events ==="
    extract_logs | jq -r 'select(.objectRef.subresource=="exec" or .objectRef.subresource=="attach") | "\(.timestamp) - User: \(.user.username) - Pod: \(.objectRef.namespace)/\(.objectRef.name)"'
}

# Find RBAC changes
find_rbac_changes() {
    echo "=== RBAC Changes ==="
    extract_logs | jq -r 'select(.objectRef.apiGroup=="rbac.authorization.k8s.io") | "\(.timestamp) - User: \(.user.username) - Verb: \(.verb) - Resource: \(.objectRef.resource)/\(.objectRef.name)"'
}

# Find deletions
find_deletions() {
    echo "=== Resource Deletions ==="
    extract_logs | jq -r 'select(.verb=="delete") | "\(.timestamp) - User: \(.user.username) - Resource: \(.objectRef.resource)/\(.objectRef.name) - Namespace: \(.objectRef.namespace)"'
}

# Find service account token requests
find_sa_token_requests() {
    echo "=== ServiceAccount Token Requests ==="
    extract_logs | jq -r 'select(.objectRef.subresource=="token") | "\(.timestamp) - User: \(.user.username) - ServiceAccount: \(.objectRef.namespace)/\(.objectRef.name)"'
}

# User activity summary
user_activity() {
    local username=$1
    echo "=== Activity for user: $username ==="
    extract_logs | jq -r --arg user "$username" 'select(.user.username==$user) | "\(.timestamp) - Verb: \(.verb) - Resource: \(.objectRef.resource)/\(.objectRef.name)"'
}

# Suspicious activities
find_suspicious() {
    echo "=== Suspicious Activities ==="

    echo "--- Unusual hours access (outside 6am-10pm) ---"
    extract_logs | jq -r 'select(.timestamp | strptime("%Y-%m-%dT%H:%M:%S") | .hour < 6 or .hour > 22) | "\(.timestamp) - User: \(.user.username) - Verb: \(.verb)"' | head -20

    echo "--- Failed requests ---"
    extract_logs | jq -r 'select(.responseStatus.code >= 400) | "\(.timestamp) - User: \(.user.username) - Status: \(.responseStatus.code) - Resource: \(.objectRef.resource)"' | head -20

    echo "--- Privileged pod creation attempts ---"
    extract_logs | jq -r 'select(.verb=="create" and .objectRef.resource=="pods" and (.requestObject.spec.containers[]?.securityContext.privileged==true)) | "\(.timestamp) - User: \(.user.username) - Namespace: \(.objectRef.namespace)"'
}

# Statistics
show_stats() {
    echo "=== Audit Log Statistics ==="

    total=$(extract_logs | wc -l)
    echo "Total events: $total"

    echo ""
    echo "Top users:"
    extract_logs | jq -r '.user.username' | sort | uniq -c | sort -rn | head -10

    echo ""
    echo "Top verbs:"
    extract_logs | jq -r '.verb' | sort | uniq -c | sort -rn | head -10

    echo ""
    echo "Top resources:"
    extract_logs | jq -r '.objectRef.resource' | sort | uniq -c | sort -rn | head -10

    echo ""
    echo "Response codes:"
    extract_logs | jq -r '.responseStatus.code' | sort | uniq -c | sort -rn
}

# Main menu
case "$1" in
    auth-failures)
        find_auth_failures
        ;;
    secrets)
        find_secret_access
        ;;
    exec)
        find_pod_exec
        ;;
    rbac)
        find_rbac_changes
        ;;
    deletions)
        find_deletions
        ;;
    tokens)
        find_sa_token_requests
        ;;
    user)
        user_activity "$2"
        ;;
    suspicious)
        find_suspicious
        ;;
    stats)
        show_stats
        ;;
    *)
        echo "Usage: $0 {auth-failures|secrets|exec|rbac|deletions|tokens|user USERNAME|suspicious|stats}"
        exit 1
        ;;
esac
```

Make it executable and run:

```bash
chmod +x audit-analyzer.sh

# Show statistics
./audit-analyzer.sh stats

# Find secret access
./audit-analyzer.sh secrets

# Find RBAC changes
./audit-analyzer.sh rbac

# Find suspicious activities
./audit-analyzer.sh suspicious
```

### Step 5: Create Real-time Monitoring

Create `audit-monitor.sh`:

```bash
#!/bin/bash
# audit-monitor.sh - Real-time audit log monitoring

CONTROL_PLANE=$(docker ps --filter name=control-plane --format "{{.Names}}")

echo "🔍 Monitoring Kubernetes audit logs in real-time..."
echo "Press Ctrl+C to stop"
echo ""

docker exec $CONTROL_PLANE tail -f /var/log/kubernetes/audit/audit.log | \
  jq -r --unbuffered '
    select(.verb != "list" and .verb != "get" and .verb != "watch") |
    "\u001b[36m[\(.timestamp)]\u001b[0m \u001b[33m\(.user.username)\u001b[0m \u001b[32m\(.verb)\u001b[0m \u001b[35m\(.objectRef.resource)\u001b[0m/\(.objectRef.name) in \u001b[34m\(.objectRef.namespace)\u001b[0m"
  '
```

Run monitor:

```bash
chmod +x audit-monitor.sh
./audit-monitor.sh

# In another terminal, generate activity
kubectl create namespace test-monitor
kubectl create deployment test --image=nginx -n test-monitor
```

### Step 6: Create Audit Webhook (Optional)

Create `audit-webhook-server.py`:

```python
#!/usr/bin/env python3
# audit-webhook-server.py - Receive audit events via webhook

from flask import Flask, request, jsonify
import json
from datetime import datetime

app = Flask(__name__)

@app.route('/audit', methods=['POST'])
def audit_webhook():
    """Receive audit events"""
    events = request.json

    if not events:
        return jsonify({"status": "error"}), 400

    for event in events.get('items', []):
        process_audit_event(event)

    return jsonify({"status": "ok"}), 200

def process_audit_event(event):
    """Process individual audit event"""
    timestamp = event.get('timestamp', '')
    user = event.get('user', {}).get('username', 'unknown')
    verb = event.get('verb', '')
    resource = event.get('objectRef', {}).get('resource', '')
    namespace = event.get('objectRef', {}).get('namespace', '')
    name = event.get('objectRef', {}).get('name', '')
    status = event.get('responseStatus', {}).get('code', 0)

    # Log event
    print(f"[{timestamp}] {user} {verb} {resource}/{name} in {namespace} - Status: {status}")

    # Detect suspicious activities
    if status >= 403:
        print(f"⚠️  ALERT: Forbidden access - {user} tried to {verb} {resource}")

    if resource == "secrets" and verb in ["get", "list"]:
        print(f"🔐 ALERT: Secret access - {user} {verb} secrets in {namespace}")

    if resource == "pods" and "exec" in event.get('objectRef', {}).get('subresource', ''):
        print(f"💻 ALERT: Pod exec - {user} executed command in pod {namespace}/{name}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8443, debug=True)
```

## ✅ Verification

### 1. Generate Audit Events

```bash
# Create namespace
kubectl create namespace audit-test

# Create deployment
kubectl create deployment nginx --image=nginx -n audit-test

# Access secrets
kubectl get secrets -n kube-system

# Execute in pod
kubectl run test --image=nginx -n audit-test
kubectl exec -it test -n audit-test -- ls /

# Delete resources
kubectl delete deployment nginx -n audit-test
kubectl delete namespace audit-test
```

### 2. Analyze Audit Logs

```bash
# Check audit logs
./audit-analyzer.sh stats
./audit-analyzer.sh deletions
./audit-analyzer.sh exec
```

### 3. Search Specific Events

```bash
CONTROL_PLANE=$(docker ps --filter name=control-plane --format "{{.Names}}")

# Find all events by user
docker exec $CONTROL_PLANE cat /var/log/kubernetes/audit/audit.log | \
  jq 'select(.user.username=="kubernetes-admin")'

# Find create events
docker exec $CONTROL_PLANE cat /var/log/kubernetes/audit/audit.log | \
  jq 'select(.verb=="create")'

# Find events in specific namespace
docker exec $CONTROL_PLANE cat /var/log/kubernetes/audit/audit.log | \
  jq 'select(.objectRef.namespace=="audit-test")'
```

## 🧪 Exploration Commands

```bash
# Count events by user
docker exec $CONTROL_PLANE cat /var/log/kubernetes/audit/audit.log | \
  jq -r '.user.username' | sort | uniq -c | sort -rn

# Find all failed requests
docker exec $CONTROL_PLANE cat /var/log/kubernetes/audit/audit.log | \
  jq 'select(.responseStatus.code >= 400)'

# Export audit logs
docker exec $CONTROL_PLANE cat /var/log/kubernetes/audit/audit.log > audit-export.json

# Analyze with different tools
cat audit-export.json | jq -r '[.timestamp, .user.username, .verb, .objectRef.resource] | @tsv' > audit.tsv
```

## 🧹 Cleanup

```bash
# Delete kind cluster
kind delete cluster --name audit-demo

# Remove logs
rm -rf audit-logs/
rm -f audit-export.json audit.tsv

echo "✅ Cleanup completed"
```

## 📚 What You Learned

✅ Enabling Kubernetes audit logging
✅ Creating audit policies
✅ Analyzing audit logs
✅ Detecting suspicious activities
✅ Building audit log analyzers
✅ Implementing real-time monitoring

## 🎓 Key Concepts

**Audit Levels**:
- **None**: Don't log
- **Metadata**: Log request metadata only
- **Request**: Log metadata and request body
- **RequestResponse**: Log everything including response

**Audit Stages**:
- **RequestReceived**: Audit handler received request
- **ResponseStarted**: Response headers sent
- **ResponseComplete**: Response body sent
- **Panic**: Events generated when panic occurred

**Best Practices**:
1. Don't log everything (performance impact)
2. Log security-sensitive operations
3. Rotate audit logs regularly
4. Secure audit log storage
5. Monitor audit logs for anomalies
6. Integrate with SIEM systems

## 🔜 Next Steps

Move to [10_zero_trust_foundations](../10_zero_trust_foundations/) where you'll:
- Learn zero trust principles
- Implement never trust, always verify
- Set up continuous verification
- Build zero trust architecture

## 💡 Pro Tips

1. **Integrate with Elasticsearch/Fluentd**:
   ```yaml
   # Use audit webhook to send to log aggregator
   --audit-webhook-config-file=/etc/kubernetes/webhook-config.yaml
   ```

2. **Filter sensitive data**:
   ```yaml
   omitStages: ["RequestReceived"]
   omitManagedFields: true
   ```

3. **Performance tuning**:
   ```
   --audit-log-mode=batch
   --audit-log-batch-max-size=1000
   --audit-log-batch-max-wait=5s
   ```

## 🆘 Troubleshooting

**Problem**: Audit logs not generated
**Solution**: Check API server configuration
```bash
docker exec $CONTROL_PLANE ps aux | grep kube-apiserver | grep audit
```

**Problem**: Audit logs too large
**Solution**: Refine audit policy to log less
```yaml
# Add more None rules for non-security events
```

**Problem**: Missing events
**Solution**: Check audit policy rules and levels

## 📖 Additional Reading

- [Kubernetes Auditing](https://kubernetes.io/docs/tasks/debug-application-cluster/audit/)
- [Audit Policy](https://kubernetes.io/docs/tasks/debug-application-cluster/audit/#audit-policy)
- [Falco Runtime Security](https://falco.org/)

---

**Estimated Time**: 45-60 minutes
**Difficulty**: Intermediate
**Cost**: Free (kind cluster)
