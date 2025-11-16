# Tutorial 02: Instrumentation - OpenTracing and OpenTelemetry

## Topics
- Manual vs auto-instrumentation
- OpenTracing API
- Span creation and propagation
- Tags, logs, and baggage
- Context propagation

## Manual Instrumentation Example

```python
from jaeger_client import Config
from flask import Flask, request

app = Flask(__name__)

# Initialize tracer
config = Config(
    config={
        'sampler': {'type': 'const', 'param': 1},
        'local_agent': {
            'reporting_host': 'localhost',
            'reporting_port': 6831,
        },
    },
    service_name='python-service',
)
tracer = config.initialize_tracer()

@app.route('/api/users/<user_id>')
def get_user(user_id):
    with tracer.start_span('get-user') as span:
        span.set_tag('user.id', user_id)
        span.set_tag('http.method', 'GET')

        # Child span for database call
        with tracer.start_span('db-query', child_of=span) as db_span:
            db_span.set_tag('db.type', 'postgresql')
            db_span.log_kv({'event': 'query', 'sql': 'SELECT * FROM users'})
            # Simulate DB query
            user = {'id': user_id, 'name': 'John'}

        return user
```

Complete examples for Java, Python, Go, Node.js with best practices.
