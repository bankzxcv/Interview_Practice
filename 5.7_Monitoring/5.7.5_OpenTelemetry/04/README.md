# Tutorial 04: Distributed Tracing - Context Propagation

## Topics
- Trace context propagation
- W3C Trace Context standard
- Baggage
- Parent-child span relationships
- Cross-service tracing

## Manual Span Creation

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# Setup
provider = TracerProvider()
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://otel-collector:4317"))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

tracer = trace.get_tracer(__name__)

# Create spans
with tracer.start_as_current_span("parent-operation") as parent:
    parent.set_attribute("user.id", "12345")

    # Child span
    with tracer.start_as_current_span("child-operation") as child:
        child.set_attribute("db.query", "SELECT * FROM users")
        # Do work
        result = database_call()

    # Another child
    with tracer.start_as_current_span("api-call") as api:
        api.set_attribute("http.url", "https://api.example.com")
        response = requests.get("https://api.example.com")
```

Complete guide with context propagation across HTTP, gRPC, messaging.
