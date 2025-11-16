# Kubernetes Tutorial 17: Creating Custom Helm Charts

## 🎯 Learning Objectives

- Create custom Helm charts from scratch
- Understand chart templates
- Use Helm template functions
- Implement template helpers
- Add chart dependencies
- Package and share charts
- Test charts locally
- Implement best practices

## 📋 Prerequisites

- Completed tutorials 01-16
- Helm installed
- Understanding of Kubernetes resources
- Familiarity with Go templates

## 📝 What We're Building

```
Custom Chart: myapp
├── Chart.yaml (metadata)
├── values.yaml (default config)
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── _helpers.tpl (reusable templates)
│   └── NOTES.txt (post-install info)
└── charts/ (dependencies)
```

## 🔍 Concepts Deep Dive

### 1. **Chart Structure**

**Chart.yaml**: Chart metadata
```yaml
apiVersion: v2
name: myapp
description: A Helm chart for my application
type: application
version: 0.1.0
appVersion: "1.0"
```

**values.yaml**: Default configuration
```yaml
replicaCount: 2
image:
  repository: nginx
  tag: "1.25"
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 80
```

**templates/**: Kubernetes manifests with Go templating
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

### 2. **Template Directives**

**Values Access**:
```
{{ .Values.replicaCount }}      # From values.yaml
{{ .Chart.Name }}                # From Chart.yaml
{{ .Release.Name }}              # Release name
{{ .Release.Namespace }}         # Release namespace
```

**Functions**:
```
{{ upper .Values.name }}         # UPPERCASE
{{ lower .Values.name }}         # lowercase
{{ quote .Values.name }}         # "value"
{{ default "nginx" .Values.image }}  # default value
```

**Conditionals**:
```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
# ...
{{- end }}
```

**Loops**:
```yaml
{{- range .Values.extraEnvVars }}
- name: {{ .name }}
  value: {{ .value }}
{{- end }}
```

### 3. **Template Helpers**

**_helpers.tpl**: Reusable template snippets
```yaml
{{/* Generate fullname */}}
{{- define "myapp.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 }}
{{- end }}

{{/* Common labels */}}
{{- define "myapp.labels" -}}
app: {{ include "myapp.name" . }}
chart: {{ .Chart.Name }}-{{ .Chart.Version }}
release: {{ .Release.Name }}
heritage: {{ .Release.Service }}
{{- end }}
```

## 📁 Step-by-Step Implementation

### Step 1: Create New Chart

```bash
# Create chart skeleton
helm create myapp

# View structure
tree myapp/

# Files created:
# myapp/
# ├── Chart.yaml
# ├── charts/
# ├── templates/
# │   ├── NOTES.txt
# │   ├── _helpers.tpl
# │   ├── deployment.yaml
# │   ├── hpa.yaml
# │   ├── ingress.yaml
# │   ├── service.yaml
# │   ├── serviceaccount.yaml
# │   └── tests/
# └── values.yaml
```

### Step 2: Customize Chart.yaml

```bash
# Edit Chart.yaml
cat > myapp/Chart.yaml <<EOF
apiVersion: v2
name: myapp
description: My custom application Helm chart
type: application
version: 1.0.0
appVersion: "1.0.0"
maintainers:
  - name: Your Name
    email: you@example.com
EOF
```

### Step 3: Define Values

```bash
# Edit values.yaml
cat > myapp/values.yaml <<EOF
replicaCount: 2

image:
  repository: nginx
  tag: "1.25-alpine"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
EOF
```

### Step 4: Test Chart Rendering

```bash
# Lint chart
helm lint myapp/

# Render templates (dry-run)
helm template myapp ./myapp/

# Render with custom values
helm template myapp ./myapp/ --set replicaCount=3

# Debug template
helm template myapp ./myapp/ --debug
```

### Step 5: Install Chart Locally

```bash
# Create namespace
kubectl create namespace chart-demo

# Install from local path
helm install myrelease ./myapp/ -n chart-demo

# Check installation
helm list -n chart-demo
kubectl get all -n chart-demo
```

### Step 6: Add ConfigMap Template

```bash
# Create templates/configmap.yaml
cat > myapp/templates/configmap.yaml <<'EOF'
{{- if .Values.config }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
data:
  {{- range $key, $value := .Values.config }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
{{- end }}
EOF

# Add config to values.yaml
cat >> myapp/values.yaml <<EOF

config:
  APP_ENV: production
  LOG_LEVEL: info
  MAX_CONNECTIONS: "100"
EOF

# Test rendering
helm template myrelease ./myapp/ | grep -A 10 ConfigMap
```

### Step 7: Use Template Helpers

```bash
# View existing helpers
cat myapp/templates/_helpers.tpl

# Add custom helper
cat >> myapp/templates/_helpers.tpl <<'EOF'

{{/*
Create image name
*/}}
{{- define "myapp.image" -}}
{{- printf "%s:%s" .Values.image.repository (.Values.image.tag | default .Chart.AppVersion) }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "myapp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "myapp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
EOF

# Use helper in deployment
# Update templates/deployment.yaml to use:
# image: {{ include "myapp.image" . }}
```

### Step 8: Add Dependencies

```bash
# Add dependency to Chart.yaml
cat >> myapp/Chart.yaml <<EOF

dependencies:
  - name: redis
    version: 17.x.x
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
EOF

# Update dependencies
helm dependency update ./myapp/

# This downloads charts to myapp/charts/
ls myapp/charts/
```

### Step 9: Package Chart

```bash
# Package chart into .tgz
helm package myapp/

# This creates myapp-1.0.0.tgz

# Install from package
helm install myrelease2 ./myapp-1.0.0.tgz -n chart-demo
```

### Step 10: Create Chart Repository

```bash
# Create index file
helm repo index . --url https://myrepo.example.com/charts

# This creates index.yaml

# Host files (can use GitHub Pages, S3, etc.)
# Users can add repo:
# helm repo add myrepo https://myrepo.example.com/charts
# helm repo update
# helm install myapp myrepo/myapp
```

## ✅ Verification

### 1. Validate Chart

```bash
# Lint chart
helm lint ./myapp/

# Should show no errors

# Lint with values
helm lint ./myapp/ --values custom-values.yaml
```

### 2. Test Template Rendering

```bash
# Render all templates
helm template test ./myapp/

# Render specific template
helm template test ./myapp/ -s templates/deployment.yaml

# Test with different values
helm template test ./myapp/ --set replicaCount=5
```

### 3. Install and Verify

```bash
# Install chart
helm install test ./myapp/ -n chart-demo

# Verify installation
helm status test -n chart-demo

# Check resources
kubectl get all -n chart-demo -l "app.kubernetes.io/instance=test"

# Uninstall
helm uninstall test -n chart-demo
```

## 🧪 Hands-On Exercises

### Exercise 1: Add Secret Template

**Task**: Create template for Secret:
- Include database credentials
- Use base64 encoding
- Make it optional via values

### Exercise 2: Multi-Environment Values

**Task**: Create values files:
- values-dev.yaml (1 replica, small resources)
- values-prod.yaml (3 replicas, large resources)
- Test both configurations

### Exercise 3: Add Horizontal Pod Autoscaler

**Task**: Create HPA template:
- Conditional (enabled via values)
- Configure min/max replicas
- Set CPU target

## 🧹 Cleanup

```bash
# Uninstall all releases
helm uninstall --all -n chart-demo

# Delete namespace
kubectl delete namespace chart-demo

# Remove chart directory
rm -rf myapp/
rm -f myapp-1.0.0.tgz
```

## 📚 What You Learned

✅ Created custom Helm chart from scratch
✅ Used Go template syntax
✅ Implemented template helpers
✅ Added chart dependencies
✅ Packaged charts
✅ Tested chart rendering
✅ Followed Helm best practices

## 🎓 Key Concepts

### Template Best Practices

1. **Use helpers for common values**:
   ```yaml
   name: {{ include "myapp.fullname" . }}
   ```

2. **Provide sensible defaults**:
   ```yaml
   replicas: {{ .Values.replicaCount | default 2 }}
   ```

3. **Make resources conditional**:
   ```yaml
   {{- if .Values.ingress.enabled }}
   # ingress definition
   {{- end }}
   ```

4. **Quote strings**:
   ```yaml
   value: {{ .Values.config.value | quote }}
   ```

5. **Use named templates**:
   ```yaml
   {{- define "myapp.labels" -}}
   # label definitions
   {{- end }}
   ```

## 🔜 Next Steps

**Tutorial 18**: Monitoring with Prometheus - Set up observability
- Install Prometheus
- Configure Grafana
- Create dashboards

## 💡 Pro Tips

1. **Quick template test**:
   ```bash
   helm template myapp ./myapp/ | kubectl apply -f - --dry-run=client
   ```

2. **Get template output for specific resource**:
   ```bash
   helm template myapp ./myapp/ -s templates/deployment.yaml
   ```

3. **Include files in ConfigMap**:
   ```yaml
   data:
     config.json: |-
       {{ .Files.Get "config.json" | indent 4 }}
   ```

4. **Default values with required**:
   ```yaml
   {{ required "A valid image.repository is required!" .Values.image.repository }}
   ```

## 🆘 Troubleshooting

**Problem**: Template syntax error
**Solution**:
```bash
helm template myapp ./myapp/ --debug
# Shows line where error occurred
```

**Problem**: Values not being applied
**Solution**:
```bash
# Check values precedence
helm template myapp ./myapp/ --debug --set key=value
```

**Problem**: Helper not found
**Solution**: Ensure _helpers.tpl has correct syntax:
```yaml
{{- define "myapp.name" -}}
{{ .Chart.Name }}
{{- end }}
```

## 📖 Additional Reading

- [Chart Development Guide](https://helm.sh/docs/chart_template_guide/)
- [Chart Best Practices](https://helm.sh/docs/chart_best_practices/)
- [Template Functions](https://helm.sh/docs/chart_template_guide/functions_and_pipelines/)

---

**Estimated Time**: 90 minutes
**Difficulty**: Intermediate to Advanced
**Prerequisites**: Tutorials 01-16 completed

**Next**: Tutorial 18 - Monitoring with Prometheus
