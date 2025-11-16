# Tutorial 02: Promtail Advanced - Pipeline Stages and Label Extraction

## Topics Covered
- Promtail pipeline stages
- Label extraction and manipulation
- JSON and logfmt parsing
- Multiline log handling
- Timestamp extraction
- Service discovery

## Pipeline Stages Overview

```
Input → Match → Extract → Transform → Output
  ↓       ↓        ↓          ↓         ↓
 Logs   Regex   Labels   Metadata   Loki
```

## Key Configurations

```yaml
# Advanced Promtail with all stages
pipeline_stages:
  # 1. Docker labels
  - docker: {}

  # 2. JSON parsing
  - json:
      expressions:
        level: level
        message: msg
        timestamp: ts

  # 3. Label extraction
  - labels:
      level:
      service:

  # 4. Timestamp parsing
  - timestamp:
      source: timestamp
      format: RFC3339

  # 5. Regex extraction
  - regex:
      expression: '^(?P<ip>\S+) .* "(?P<method>\w+) (?P<path>\S+)'

  # 6. Drop unwanted logs
  - drop:
      source: level
      value: DEBUG

  # 7. Template for output
  - template:
      source: message
      template: '{{ .level }}: {{ .message }}'
```

See full tutorial with examples, docker-compose setup, and advanced pipeline configurations.
