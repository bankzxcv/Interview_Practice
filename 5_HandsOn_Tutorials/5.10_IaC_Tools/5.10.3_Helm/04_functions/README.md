# Helm Template Functions

## Overview
Master Helm template functions and pipelines for advanced templating.

## Common Functions

```yaml
# String functions
{{ .Values.name | upper }}
{{ .Values.name | lower }}
{{ .Values.name | quote }}
{{ .Values.name | trunc 63 }}

# Default values
{{ .Values.port | default 8080 }}

# Logic
{{- if eq .Values.environment "production" }}
  replicas: 5
{{- else }}
  replicas: 2
{{- end }}

# Lists
{{- range .Values.hosts }}
- {{ . }}
{{- end }}

# YAML formatting
{{- toYaml .Values.resources | nindent 10 }}

# Include other templates
{{- include "my-app.labels" . | nindent 4 }}
```

## Pipelines

```yaml
# Chain functions
{{ .Values.name | upper | quote }}

# Complex pipeline
{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}
```

## Flow Control

```yaml
# If/Else
{{- if .Values.ingress.enabled }}
kind: Ingress
{{- else }}
# No ingress
{{- end }}

# Range
{{- range $key, $value := .Values.env }}
- name: {{ $key }}
  value: {{ $value | quote }}
{{- end }}

# With
{{- with .Values.nodeSelector }}
nodeSelector:
  {{- toYaml . | nindent 2 }}
{{- end }}
```

## Next Steps
- Tutorial 05: Hooks
