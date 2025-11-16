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
