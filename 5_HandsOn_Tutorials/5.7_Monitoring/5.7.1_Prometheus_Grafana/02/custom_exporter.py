from prometheus_client import start_http_server, Gauge, Counter, Histogram
import random
import time

# Define metrics
cpu_temp = Gauge('custom_cpu_temperature_celsius', 'CPU temperature in Celsius')
api_requests = Counter('custom_api_requests_total', 'Total API requests', ['endpoint', 'method'])
request_duration = Histogram('custom_request_duration_seconds', 'Request duration', ['endpoint'])
queue_size = Gauge('custom_queue_size', 'Current queue size')
db_connections = Gauge('custom_db_connections', 'Database connections', ['state'])

def collect_metrics():
    """Simulate collecting metrics"""
    while True:
        # Simulate CPU temperature
        cpu_temp.set(random.uniform(40, 80))

        # Simulate API requests
        endpoints = ['/api/users', '/api/orders', '/api/products']
        methods = ['GET', 'POST', 'PUT', 'DELETE']
        api_requests.labels(endpoint=random.choice(endpoints), method=random.choice(methods)).inc()

        # Simulate request duration
        with request_duration.labels(endpoint=random.choice(endpoints)).time():
            time.sleep(random.uniform(0.01, 0.5))

        # Simulate queue size
        queue_size.set(random.randint(0, 100))

        # Simulate DB connections
        db_connections.labels(state='active').set(random.randint(5, 50))
        db_connections.labels(state='idle').set(random.randint(10, 100))

        time.sleep(5)

if __name__ == '__main__':
    # Start HTTP server on port 8000
    start_http_server(8000)
    print("Custom exporter running on :8000")
    collect_metrics()
