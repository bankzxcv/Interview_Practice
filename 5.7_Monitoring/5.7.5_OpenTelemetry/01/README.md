# Tutorial 01: OpenTelemetry Basics - Unified Observability

## Learning Objectives
- Understand OpenTelemetry concepts
- Learn about signals (traces, metrics, logs)
- SDK architecture
- Semantic conventions
- Vendor neutrality

## The Three Signals

```
OpenTelemetry provides unified instrumentation for:

1. TRACES  → Distributed request flow
2. METRICS → Time-series measurements
3. LOGS    → Discrete events

All correlated through context propagation!
```

## Quick Start

```yaml
# docker-compose.yml
version: '3.8'
services:
  # OTEL Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8888:8888"   # Metrics
      - "13133:13133" # Health check

  # Backends
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
```

## OTEL Collector Configuration

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

exporters:
  # Traces to Jaeger
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

  # Metrics to Prometheus
  prometheus:
    endpoint: "0.0.0.0:8889"

  # Logs to Loki
  loki:
    endpoint: http://loki:3100/loki/api/v1/push

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger]

    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]

    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [loki]
```

Complete tutorial with multi-language SDKs and semantic conventions.
