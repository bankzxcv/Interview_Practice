# Tutorial 06: Logs Integration - Correlated Logging

## Topics
- Structured logging
- Log-trace correlation
- LogRecord API
- Log appenders
- Multi-signal correlation

## Correlated Logging Example

```python
import logging
from opentelemetry import trace
from opentelemetry._logs import set_logger_provider
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter

# Setup logging
logger_provider = LoggerProvider()
set_logger_provider(logger_provider)

exporter = OTLPLogExporter(endpoint="http://otel-collector:4317")
logger_provider.add_log_record_processor(BatchLogRecordProcessor(exporter))

handler = LoggingHandler(level=logging.NOTSET, logger_provider=logger_provider)
logging.getLogger().addHandler(handler)

logger = logging.getLogger(__name__)

# Use correlated logging
def process_request():
    with trace.get_tracer(__name__).start_as_current_span("process-request") as span:
        span_context = span.get_span_context()

        # Log with trace context
        logger.info(
            "Processing request",
            extra={
                "trace_id": format(span_context.trace_id, '032x'),
                "span_id": format(span_context.span_id, '016x'),
                "user_id": "12345",
            }
        )
```

Complete integration guide with log aggregation and visualization.
