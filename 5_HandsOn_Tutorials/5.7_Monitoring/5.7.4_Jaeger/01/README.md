# Tutorial 01: Jaeger Setup - Distributed Tracing Basics

## Learning Objectives
- Install Jaeger all-in-one
- Understand traces, spans, and context
- Instrument a simple application
- View traces in Jaeger UI

## Architecture
```
App → Jaeger Agent → Jaeger Collector → Storage → Jaeger Query → UI
```

## Quick Start

```yaml
# docker-compose.yml
version: '3.8'
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
    ports:
      - "5775:5775/udp"  # Agent zipkin compact
      - "6831:6831/udp"  # Agent jaeger compact
      - "6832:6832/udp"  # Agent jaeger binary
      - "5778:5778"      # Agent config
      - "16686:16686"    # UI
      - "14268:14268"    # Collector HTTP
      - "14250:14250"    # Collector gRPC
      - "9411:9411"      # Zipkin compatible

  sample-app:
    build: .
    environment:
      - JAEGER_AGENT_HOST=jaeger
      - JAEGER_AGENT_PORT=6831
    ports:
      - "8080:8080"
```

## Sample Application (Node.js)

```javascript
const { initTracer } = require('jaeger-client');
const express = require('express');

// Initialize tracer
const tracer = initTracer({
  serviceName: 'sample-service',
  sampler: {
    type: 'const',
    param: 1,
  },
  reporter: {
    agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
  },
}, {});

const app = express();

app.get('/api/hello', (req, res) => {
  const span = tracer.startSpan('hello-handler');

  // Add tags
  span.setTag('http.method', 'GET');
  span.setTag('http.url', '/api/hello');

  // Simulate work
  setTimeout(() => {
    span.log({ event: 'processing', value: 'Hello World' });
    span.finish();
    res.json({ message: 'Hello World' });
  }, Math.random() * 100);
});

app.listen(8080, () => {
  console.log('Server running on :8080');
  console.log('Jaeger UI: http://localhost:16686');
});
```

Access Jaeger UI at http://localhost:16686 to view traces.
