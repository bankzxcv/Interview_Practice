# Tutorial 03: Collector Setup - Pipelines and Processors

## Topics
- Collector architecture
- Receivers, processors, exporters
- Pipeline configuration
- Sampling and filtering
- Data transformation

## Collector Pipeline

```
Receivers → Processors → Exporters
    ↓           ↓            ↓
  OTLP      Batch        Jaeger
  Zipkin    Filter       Prometheus
  Jaeger    Transform    Loki
  Prometheus Sampling    OTLP
```

## Advanced Configuration

```yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:
  prometheus:
    config:
      scrape_configs:
        - job_name: 'otel-collector'
          scrape_interval: 10s
          static_configs:
            - targets: ['localhost:8888']

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

  # Memory limit
  memory_limiter:
    check_interval: 1s
    limit_mib: 4000

  # Attribute manipulation
  attributes:
    actions:
      - key: environment
        value: production
        action: insert

  # Filtering
  filter:
    traces:
      span:
        - 'attributes["http.url"] == "/health"'

  # Sampling
  probabilistic_sampler:
    sampling_percentage: 10

exporters:
  jaeger:
    endpoint: jaeger:14250
  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write
  loki:
    endpoint: http://loki:3100/loki/api/v1/push

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, filter, probabilistic_sampler]
      exporters: [jaeger]
```

Full tutorial with processor chains and troubleshooting.
