# NATS Tutorial 06: Monitoring

## Overview
Monitor NATS with HTTP endpoints, Prometheus, and observability tools.

## Monitoring Endpoints
- HTTP: http://localhost:8222
- Metrics: http://localhost:8222/metrics
- Streaming: http://localhost:8222/streaming

## Key Metrics
- Connections
- Subscriptions
- Message rates (in/out)
- Slow consumers
- Memory usage

## Quick Start
```bash
docker-compose up -d

# Access dashboards
# NATS Monitor: http://localhost:8222
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000
```

## Prometheus Integration
```yaml
scrape_configs:
  - job_name: 'nats'
    static_configs:
      - targets: ['nats:8222']
```

Next: Tutorial 07 - Kubernetes
