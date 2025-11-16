# Tutorial 07: Multi-Backend Export - Unified Observability

## Topics
- Exporting to multiple backends
- Jaeger + Prometheus + Loki
- Data correlation
- Grafana unified view
- Cost optimization

## Complete OTEL Collector Config

```yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:

processors:
  batch:
  memory_limiter:
    limit_mib: 1000
  attributes:
    actions:
      - key: environment
        value: production
        action: insert

exporters:
  # Traces → Jaeger
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

  # Metrics → Prometheus
  prometheus:
    endpoint: "0.0.0.0:8889"
    namespace: otel

  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write

  # Logs → Loki
  loki:
    endpoint: http://loki:3100/loki/api/v1/push
    labels:
      resource:
        service.name: "service_name"
      attributes:
        level: "severity"

  # Logs → Elasticsearch
  elasticsearch:
    endpoints: [http://elasticsearch:9200]
    index: otel-logs

  # Multi-backend OTLP
  otlp/backend1:
    endpoint: backend1:4317
  otlp/backend2:
    endpoint: backend2:4317

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [jaeger, otlp/backend1]

    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus, prometheusremotewrite]

    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch, attributes]
      exporters: [loki, elasticsearch]
```

Complete multi-backend setup with Grafana dashboards.
