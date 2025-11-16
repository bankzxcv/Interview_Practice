# Tutorial 02: Auto-Instrumentation - Zero-Code Observability

## Topics
- Auto-instrumentation agents
- Java agent
- Python auto-instrumentation
- Node.js automatic instrumentation
- Environment variables configuration

## Java Auto-Instrumentation

```bash
# Download agent
wget https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar

# Run application with agent
java -javaagent:path/to/opentelemetry-javaagent.jar \
     -Dotel.service.name=my-service \
     -Dotel.traces.exporter=otlp \
     -Dotel.metrics.exporter=otlp \
     -Dotel.logs.exporter=otlp \
     -Dotel.exporter.otlp.endpoint=http://otel-collector:4317 \
     -jar myapp.jar
```

## Python Auto-Instrumentation

```bash
# Install packages
pip install opentelemetry-distro opentelemetry-exporter-otlp

# Auto-instrument
opentelemetry-bootstrap -a install

# Run with auto-instrumentation
opentelemetry-instrument \
    --traces_exporter otlp \
    --metrics_exporter otlp \
    --service_name my-python-service \
    --exporter_otlp_endpoint http://otel-collector:4317 \
    python app.py
```

## Node.js Auto-Instrumentation

```javascript
// tracing.js (load before app)
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: 'my-node-service',
});

sdk.start();
```

Complete examples for all major languages with Docker configurations.
