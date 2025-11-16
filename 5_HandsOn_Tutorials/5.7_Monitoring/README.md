# 5.7 Monitoring & Observability - Hands-On Tutorials

## Overview

Master monitoring and observability with 5 comprehensive stacks. Learn metrics, logging, tracing, and visualization from basic setups to production-ready implementations.

## The Three Pillars of Observability

1. **Metrics**: Numerical data over time (CPU, memory, request rates)
2. **Logs**: Discrete events and messages
3. **Traces**: Request flow through distributed systems

## Stacks Covered

### [5.7.1 Prometheus & Grafana](./5.7.1_Prometheus_Grafana/)
**Focus**: Metrics collection and visualization
- **Tutorial 01**: Prometheus basics, PromQL
- **Tutorial 02**: Node Exporter, system metrics
- **Tutorial 03**: Application instrumentation
- **Tutorial 04**: Grafana dashboards
- **Tutorial 05**: Alertmanager setup
- **Tutorial 06**: Recording rules, federation
- **Tutorial 07**: Kubernetes monitoring
- **Tutorial 08**: Production deployment

### [5.7.2 ELK Stack](./5.7.2_ELK_Stack/)
**Focus**: Log aggregation and analysis (Elasticsearch, Logstash, Kibana)
- **Tutorial 01**: Elasticsearch basics
- **Tutorial 02**: Logstash pipelines
- **Tutorial 03**: Kibana visualizations
- **Tutorial 04**: Filebeat log shipping
- **Tutorial 05**: Index management
- **Tutorial 06**: Advanced queries
- **Tutorial 07**: Kubernetes logging
- **Tutorial 08**: Production setup

### [5.7.3 Loki & Promtail](./5.7.3_Loki_Promtail/)
**Focus**: Lightweight log aggregation (like Prometheus, but for logs)
- **Tutorial 01**: Loki basics, LogQL
- **Tutorial 02**: Promtail configuration
- **Tutorial 03**: Grafana integration
- **Tutorial 04**: Label strategies
- **Tutorial 05**: Multi-tenancy
- **Tutorial 06**: Kubernetes deployment
- **Tutorial 07**: Alert rules
- **Tutorial 08**: Production setup

### [5.7.4 Jaeger](./5.7.4_Jaeger/)
**Focus**: Distributed tracing
- **Tutorial 01**: Jaeger basics, traces, spans
- **Tutorial 02**: Application instrumentation (OpenTelemetry)
- **Tutorial 03**: Microservices tracing
- **Tutorial 04**: Performance analysis
- **Tutorial 05**: Kubernetes deployment
- **Tutorial 06**: Sampling strategies
- **Tutorial 07**: Service dependencies
- **Tutorial 08**: Production setup

### [5.7.5 OpenTelemetry](./5.7.5_OpenTelemetry/)
**Focus**: Unified observability (metrics + logs + traces)
- **Tutorial 01**: OpenTelemetry basics
- **Tutorial 02**: Auto-instrumentation
- **Tutorial 03**: Collector setup
- **Tutorial 04**: Exporters (Prometheus, Jaeger, Loki)
- **Tutorial 05**: Custom metrics
- **Tutorial 06**: Distributed context
- **Tutorial 07**: Kubernetes operator
- **Tutorial 08**: Complete observability stack

## Quick Start: Prometheus & Grafana

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"

volumes:
  prometheus-data:
  grafana-data:
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

```bash
# Start stack
docker-compose up -d

# Access:
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
```

## Common Monitoring Patterns

### 1. Application Metrics (Node.js Example)

```javascript
// app.js
const express = require('express');
const client = require('prom-client');

const app = express();

// Create metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.route?.path || req.path, res.statusCode).observe(duration);
  });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(3000);
```

### 2. Structured Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('User logged in', {
  userId: '12345',
  username: 'john',
  ip: '192.168.1.1'
});
```

### 3. Distributed Tracing

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: 'http://localhost:14268/api/traces',
  }),
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
});

sdk.start();
```

### 4. Kubernetes Pod Monitoring

```yaml
# ServiceMonitor for Prometheus Operator
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
    - port: metrics
      interval: 30s
```

## Essential PromQL Queries

```promql
# CPU usage rate
rate(process_cpu_seconds_total[5m])

# Memory usage
process_resident_memory_bytes / 1024 / 1024

# HTTP request rate
rate(http_requests_total[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Availability (SLI)
sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

## Essential LogQL Queries (Loki)

```logql
# All logs from app
{app="myapp"}

# Error logs
{app="myapp"} |= "error"

# JSON parsing
{app="myapp"} | json | level="error"

# Rate of errors
rate({app="myapp"} |= "error" [5m])

# Top 10 error messages
topk(10, sum by (message) (rate({app="myapp"} | json | level="error" [5m])))
```

## Best Practices Covered

### Metrics
- ✅ The Four Golden Signals (latency, traffic, errors, saturation)
- ✅ RED method (Rate, Errors, Duration)
- ✅ USE method (Utilization, Saturation, Errors)
- ✅ Prometheus naming conventions
- ✅ Label cardinality management
- ✅ Recording rules for expensive queries

### Logging
- ✅ Structured logging (JSON)
- ✅ Log levels (DEBUG, INFO, WARN, ERROR)
- ✅ Contextual information (request ID, user ID)
- ✅ Don't log sensitive data
- ✅ Centralized log aggregation
- ✅ Log retention policies

### Tracing
- ✅ Sampling strategies
- ✅ Trace context propagation
- ✅ Span attributes and tags
- ✅ Performance impact minimization
- ✅ Service dependency graphs
- ✅ Root cause analysis

### Alerting
- ✅ Alert on symptoms, not causes
- ✅ Clear, actionable alerts
- ✅ Alert routing and escalation
- ✅ Runbooks for common issues
- ✅ Alert fatigue prevention
- ✅ SLO-based alerting

## Stack Comparison

| Feature | Prometheus/Grafana | ELK | Loki | Jaeger | OpenTelemetry |
|---------|-------------------|-----|------|--------|---------------|
| **Type** | Metrics | Logs | Logs | Traces | All |
| **Storage** | Time-series | Index | Labels | Traces | Pluggable |
| **Query** | PromQL | KQL | LogQL | UI | N/A |
| **Cost** | Low | High | Low | Medium | Low |
| **Resource Usage** | Low | High | Low | Medium | Medium |
| **Learning Curve** | Medium | High | Medium | Medium | High |
| **Best For** | Metrics | Full-text search | Simple logs | Microservices | Unified |

## Prerequisites

```bash
# Docker and Docker Compose
brew install --cask docker

# kubectl (for Kubernetes tutorials)
brew install kubectl

# helm (for easy deployments)
brew install helm

# Optional: CLIs for each tool
brew install prometheus
brew install grafana
```

## Recommended Study Path

### Week 1: Metrics
- Days 1-5: Prometheus & Grafana (8 tutorials)
- Weekend: Instrument a real application

### Week 2: Logging
- Days 1-3: Loki & Promtail (8 tutorials) OR
- Days 1-5: ELK Stack (8 tutorials)
- Weekend: Set up centralized logging

### Week 3: Tracing
- Days 1-4: Jaeger (8 tutorials)
- Day 5: Review and integration
- Weekend: Add tracing to microservices

### Week 4: Complete Observability
- Days 1-5: OpenTelemetry (8 tutorials)
- Weekend: Build complete observability stack

## What You'll Master

After completing all tutorials:
- ✅ Set up Prometheus and write PromQL queries
- ✅ Create Grafana dashboards
- ✅ Configure alerting and notifications
- ✅ Implement centralized logging
- ✅ Search and analyze logs efficiently
- ✅ Instrument applications for tracing
- ✅ Analyze distributed traces
- ✅ Build complete observability stack
- ✅ Monitor Kubernetes clusters
- ✅ Implement SLO-based monitoring

## Common Issues & Solutions

**High cardinality labels**
```promql
# Bad: user_id as label (millions of values)
http_requests_total{user_id="12345"}

# Good: aggregate by service
http_requests_total{service="api"}
```

**Log storage costs**
- Use sampling for debug logs
- Implement retention policies
- Filter unnecessary logs at source

**Missing traces**
- Check sampling configuration
- Verify context propagation
- Ensure all services instrumented

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Elastic Documentation](https://www.elastic.co/guide/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Google SRE Books](https://sre.google/books/)

## Next Steps

1. Start with Prometheus & Grafana
2. Add structured logging with Loki
3. Implement tracing with Jaeger
4. Unify with OpenTelemetry
5. Apply to production systems

---

**Total Tutorials**: 40 (5 stacks × 8 tutorials)
**Estimated Time**: 60-80 hours
**Difficulty**: Intermediate to Advanced
**Cost**: Free (runs locally)
