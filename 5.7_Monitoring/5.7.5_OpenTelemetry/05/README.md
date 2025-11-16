# Tutorial 05: Metrics Collection - OTLP and Prometheus

## Topics
- Metric instruments (Counter, Gauge, Histogram)
- Metric aggregation
- Prometheus exporter
- Custom metrics
- Performance considerations

## Metrics Instrumentation

```javascript
const { MeterProvider } = require('@opentelemetry/sdk-metrics');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { Resource } = require('@opentelemetry/resources');

// Setup meter provider
const meterProvider = new MeterProvider({
  resource: Resource.default().merge(
    new Resource({
      'service.name': 'my-service',
    })
  ),
});

const exporter = new OTLPMetricExporter({
  url: 'http://otel-collector:4318/v1/metrics',
});

meterProvider.addMetricReader(new PeriodicExportingMetricReader({
  exporter,
  exportIntervalMillis: 10000,
}));

const meter = meterProvider.getMeter('my-meter');

// Counter
const requestCounter = meter.createCounter('http_requests_total', {
  description: 'Total HTTP requests',
});

// Histogram
const requestDuration = meter.createHistogram('http_request_duration_seconds', {
  description: 'HTTP request duration',
  unit: 'seconds',
});

// Gauge (via observable)
meter.createObservableGauge('memory_usage_bytes', {
  description: 'Memory usage in bytes',
}, (result) => {
  result.observe(process.memoryUsage().heapUsed);
});

// Use metrics
app.use((req, res, next) => {
  const start = Date.now();
  requestCounter.add(1, { method: req.method, route: req.path });

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    requestDuration.record(duration, {
      method: req.method,
      route: req.path,
      status: res.statusCode,
    });
  });

  next();
});
```

Full tutorial with all metric types and Prometheus compatibility.
