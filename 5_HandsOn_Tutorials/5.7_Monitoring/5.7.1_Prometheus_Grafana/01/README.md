# Tutorial 01: Prometheus Setup - Installation and First Metrics

## Learning Objectives
- Install and configure Prometheus
- Understand the Prometheus architecture
- Scrape first metrics
- Explore the Prometheus UI
- Write basic PromQL queries

## Architecture Overview

```
┌─────────────┐
│ Prometheus  │ ←─ Scrapes metrics from targets
│   Server    │
└──────┬──────┘
       │
       ├─→ [Prometheus itself :9090]
       ├─→ [Sample App :8080/metrics]
       └─→ [Future exporters...]
```

## Step 1: Prometheus Configuration

Create `prometheus.yml`:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s      # How often to scrape targets
  evaluation_interval: 15s  # How often to evaluate rules
  external_labels:
    cluster: 'docker-localhost'
    monitor: 'tutorial-monitor'

# Scrape configurations
scrape_configs:
  # Prometheus monitors itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
        labels:
          environment: 'development'

  # Sample application
  - job_name: 'sample-app'
    static_configs:
      - targets: ['sample-app:8080']
        labels:
          environment: 'development'
          team: 'platform'
```

## Step 2: Sample Application with Metrics

Create a simple Node.js app that exposes metrics:

```javascript
// app.js
const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = 8080;

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
});

// Custom counter metric
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Custom histogram metric
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Custom gauge metric
const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();

  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal.labels(req.method, route, res.statusCode).inc();
    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);
    activeConnections.dec();
  });

  next();
});

// Application routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello from monitored app!' });
});

app.get('/slow', async (req, res) => {
  // Simulate slow endpoint
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
  res.json({ message: 'Slow response' });
});

app.get('/error', (req, res) => {
  res.status(500).json({ error: 'Intentional error' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Metrics available at http://localhost:${PORT}/metrics`);
});
```

```json
// package.json
{
  "name": "prometheus-sample-app",
  "version": "1.0.0",
  "description": "Sample app with Prometheus metrics",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "prom-client": "^15.0.0"
  }
}
```

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY app.js ./

EXPOSE 8080

CMD ["npm", "start"]
```

## Step 3: Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped
    networks:
      - monitoring

  sample-app:
    build: .
    container_name: sample-app
    ports:
      - "8080:8080"
    restart: unless-stopped
    networks:
      - monitoring
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  prometheus-data:

networks:
  monitoring:
    driver: bridge
```

## Step 4: Start the Stack

```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f prometheus
docker-compose logs -f sample-app

# Verify services are running
docker-compose ps
```

## Step 5: Explore Prometheus UI

1. **Access Prometheus**: http://localhost:9090

2. **Check Targets**: http://localhost:9090/targets
   - Both `prometheus` and `sample-app` should be UP

3. **Check Configuration**: http://localhost:9090/config

4. **Service Discovery**: http://localhost:9090/service-discovery

## Step 6: Generate Traffic

Create a load generator script:

```bash
#!/bin/bash
# load-generator.sh

echo "Generating traffic to sample app..."

while true; do
  # Regular requests
  curl -s http://localhost:8080/ > /dev/null

  # Slow requests
  curl -s http://localhost:8080/slow > /dev/null

  # Error requests (20% chance)
  if [ $((RANDOM % 5)) -eq 0 ]; then
    curl -s http://localhost:8080/error > /dev/null
  fi

  sleep 0.5
done
```

```bash
chmod +x load-generator.sh
./load-generator.sh
```

## Step 7: Basic PromQL Queries

Open Prometheus UI (http://localhost:9090/graph) and try these queries:

### 1. Simple Metric Selection
```promql
# All HTTP requests
http_requests_total

# Requests for specific route
http_requests_total{route="/"}

# Requests with 500 status code
http_requests_total{status_code="500"}
```

### 2. Rate of Requests
```promql
# Requests per second (averaged over 1 minute)
rate(http_requests_total[1m])

# Requests per second by route
sum by (route) (rate(http_requests_total[1m]))

# Requests per second by status code
sum by (status_code) (rate(http_requests_total[1m]))
```

### 3. Error Rate
```promql
# Error rate (percentage)
sum(rate(http_requests_total{status_code="500"}[1m])) / sum(rate(http_requests_total[1m])) * 100
```

### 4. Request Duration (Latency)
```promql
# Average request duration
rate(http_request_duration_seconds_sum[1m]) / rate(http_request_duration_seconds_count[1m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 99th percentile latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### 5. System Metrics
```promql
# Memory usage
nodejs_heap_size_used_bytes / 1024 / 1024

# CPU usage
rate(nodejs_process_cpu_seconds_total[1m])

# Active connections
active_connections
```

### 6. Aggregations
```promql
# Total requests across all routes
sum(http_requests_total)

# Requests per minute by route
sum by (route) (rate(http_requests_total[1m])) * 60

# Top 3 routes by traffic
topk(3, sum by (route) (rate(http_requests_total[1m])))
```

## Step 8: Understand Metric Types

### Counter
- Always increases (or resets to 0)
- Use `rate()` or `increase()` to get meaningful values
- Example: `http_requests_total`

```promql
# Requests in last 5 minutes
increase(http_requests_total[5m])

# Requests per second
rate(http_requests_total[1m])
```

### Gauge
- Can go up or down
- Represents current value
- Example: `active_connections`

```promql
# Current active connections
active_connections

# Max connections in last hour
max_over_time(active_connections[1h])
```

### Histogram
- Buckets of observations
- Used for percentiles
- Example: `http_request_duration_seconds`

```promql
# 95th percentile
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Average duration
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

## Step 9: Explore Metrics Endpoint

```bash
# View raw metrics
curl http://localhost:8080/metrics

# Example output:
# # HELP http_requests_total Total number of HTTP requests
# # TYPE http_requests_total counter
# http_requests_total{method="GET",route="/",status_code="200"} 150
# http_requests_total{method="GET",route="/slow",status_code="200"} 45
```

## Step 10: Common Issues & Solutions

### Issue: Targets are DOWN
```bash
# Check if app is running
docker-compose ps

# Check app logs
docker-compose logs sample-app

# Test metrics endpoint
curl http://localhost:8080/metrics
```

### Issue: No data in graphs
```bash
# Generate traffic
curl http://localhost:8080/

# Check scrape interval (wait 15 seconds)
# Verify target is being scraped: http://localhost:9090/targets
```

### Issue: Metrics not appearing
```bash
# Check Prometheus logs
docker-compose logs prometheus

# Verify prometheus.yml syntax
docker-compose exec prometheus promtool check config /etc/prometheus/prometheus.yml
```

## Exercises

1. **Add Custom Metric**: Add a counter for database queries
2. **New Endpoint**: Create `/api/users` endpoint and track its metrics
3. **Business Metric**: Add a gauge for "items in shopping cart"
4. **Query Practice**: Calculate the 50th, 95th, and 99th percentile latencies
5. **Explore**: Find the busiest endpoint by request count

## Cleanup

```bash
# Stop services
docker-compose down

# Remove volumes (deletes metrics data)
docker-compose down -v
```

## Key Takeaways

- ✅ Prometheus scrapes metrics via HTTP
- ✅ Metrics exposed at `/metrics` endpoint
- ✅ Four metric types: Counter, Gauge, Histogram, Summary
- ✅ PromQL is powerful for querying time-series data
- ✅ Labels provide dimensionality to metrics
- ✅ Use `rate()` for counters, direct access for gauges

## Next Steps

Continue to **Tutorial 02: Exporters** to learn about:
- Node Exporter for system metrics
- Process Exporter
- Custom exporters
- Service discovery

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Metric Types](https://prometheus.io/docs/concepts/metric_types/)
- [Best Practices](https://prometheus.io/docs/practices/naming/)
