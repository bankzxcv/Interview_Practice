# Design API Gateway

## Problem Statement
Design an API Gateway that acts as a single entry point for microservices, providing routing, authentication, rate limiting, caching, and request aggregation.

## Architecture
```
Client → API Gateway → [Auth, Rate Limit, Cache, Transform] → Microservices
```

## Key Features

### 1. Request Routing
```python
routes = {
    '/users/*': 'user-service.internal:8080',
    '/orders/*': 'order-service.internal:8081',
    '/products/*': 'product-service.internal:8082'
}

def route_request(request):
    for pattern, backend in routes.items():
        if matches(request.path, pattern):
            return proxy_to(backend, request)

    return Response("Not Found", 404)
```

### 2. Authentication & Authorization
```python
def authenticate(request):
    token = request.headers.get('Authorization')

    # Verify JWT
    try:
        payload = jwt.decode(token, secret_key)
        user_id = payload['user_id']
        roles = payload['roles']

        # Check permissions
        if not has_permission(request.path, roles):
            return Response("Forbidden", 403)

        # Add user context to request
        request.headers['X-User-ID'] = user_id

    except jwt.InvalidTokenError:
        return Response("Unauthorized", 401)
```

### 3. Rate Limiting
```python
# Per-user rate limit
@rate_limit(requests=1000, window=3600)  # 1000 req/hour
def api_endpoint(request):
    user_id = request.headers['X-User-ID']

    key = f"rate_limit:{user_id}:{int(time.time() // 3600)}"
    count = redis.incr(key)

    if count == 1:
        redis.expire(key, 3600)

    if count > 1000:
        return Response("Rate Limit Exceeded", 429)
```

### 4. Response Aggregation
```python
# BFF pattern (Backend for Frontend)
async def get_user_dashboard(user_id):
    # Parallel requests to multiple services
    user, orders, recommendations = await asyncio.gather(
        user_service.get_profile(user_id),
        order_service.get_recent_orders(user_id),
        recommendation_service.get_recommendations(user_id)
    )

    # Combine into single response
    return {
        'user': user,
        'recent_orders': orders,
        'recommendations': recommendations
    }
```

### 5. Caching
```python
@cache(ttl=300)  # 5 minutes
def get_product_list():
    # Check cache
    cached = redis.get('product_list')
    if cached:
        return cached

    # Fetch from service
    response = product_service.list_products()

    # Cache response
    redis.setex('product_list', 300, response)

    return response
```

### 6. Request/Response Transformation
```python
# Transform legacy API to modern format
def transform_response(old_format):
    new_format = {
        'id': old_format['userId'],
        'name': old_format['userName'],
        'email': old_format['userEmail']
    }
    return new_format
```

## Advanced Features

### Circuit Breaker
```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failures = 0
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
        self.last_failure = None

    def call(self, func):
        if self.state == 'OPEN':
            if time.time() - self.last_failure > self.timeout:
                self.state = 'HALF_OPEN'
            else:
                raise CircuitBreakerError("Circuit is OPEN")

        try:
            result = func()
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise

    def on_failure(self):
        self.failures += 1
        self.last_failure = time.time()

        if self.failures >= self.failure_threshold:
            self.state = 'OPEN'

    def on_success(self):
        self.failures = 0
        self.state = 'CLOSED'
```

### Load Balancing
```python
# Round-robin
class LoadBalancer:
    def __init__(self, backends):
        self.backends = backends
        self.current = 0

    def get_backend(self):
        backend = self.backends[self.current]
        self.current = (self.current + 1) % len(self.backends)
        return backend

# Health checking
def health_check():
    for backend in backends:
        try:
            response = requests.get(f"{backend}/health", timeout=2)
            if response.status_code == 200:
                mark_healthy(backend)
            else:
                mark_unhealthy(backend)
        except:
            mark_unhealthy(backend)
```

## Performance Optimizations
- **HTTP/2**: Multiplexing, server push
- **Connection pooling**: Reuse connections to backends
- **Compression**: gzip/brotli responses
- **Async I/O**: Non-blocking request handling

## Monitoring
```
Performance:
- Latency: p50 < 10ms, p99 < 50ms
- Throughput: 100K req/sec
- Error rate: < 0.1%

Security:
- Auth failure rate: 5%
- Rate limit hit rate: 2%

Backend Health:
- Circuit breaker open: 0
- Unhealthy backends: 0
```

## Interview Talking Points
"API Gateway provides single entry point for microservices. Key features: routing (path-based), authentication (JWT), rate limiting (Redis), caching (TTL), and response aggregation (BFF pattern). Circuit breaker prevents cascading failures. Use HTTP/2 and connection pooling for performance. Monitor latency (p99 <50ms), auth failures, and backend health. Consider Kong, AWS API Gateway, or custom Nginx/Envoy."
