# RabbitMQ Tutorial 06: Monitoring

## Overview
Monitor RabbitMQ using Management UI, Prometheus, and custom metrics.

## Learning Objectives
- Use Management UI effectively
- Export metrics to Prometheus
- Set up alerting
- Monitor queue depths and rates

## Monitoring Stack

```
RabbitMQ --> Prometheus --> Grafana --> Alerts
            Management UI
```

## Quick Start

```bash
# Start full monitoring stack
docker-compose up -d

# Access interfaces
# RabbitMQ UI: http://localhost:15672
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
```

## Key Metrics

- **Message Rates**: Publish, deliver, ack rates
- **Queue Depth**: Messages ready/unacked
- **Consumer Count**: Active consumers per queue
- **Connection Count**: Active connections
- **Memory Usage**: Per-node memory consumption

## Verification

```bash
# CLI metrics
docker exec rabbitmq rabbitmqctl list_queues name messages consumers

# HTTP API
curl -u admin:admin123 http://localhost:15672/api/overview
```

## Best Practices

1. Monitor queue depth trends
2. Alert on high unacked message count
3. Track consumer count per queue
4. Monitor node memory/disk usage
5. Set up dead letter queue monitoring

## Next Steps
- Tutorial 07: Kubernetes deployment
