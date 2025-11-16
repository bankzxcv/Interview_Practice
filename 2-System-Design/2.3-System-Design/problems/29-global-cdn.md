# Design Global CDN (Content Delivery Network)

## Problem Statement

Design a global CDN like CloudFlare/Akamai that caches and serves content from edge servers worldwide with intelligent routing, DDoS protection, and 99.99% availability.

## Requirements

- Serve content from nearest edge server
- Cache static assets (images, CSS, JS, videos)
- Intelligent routing (lowest latency path)
- DDoS protection
- SSL/TLS termination
- Cache invalidation
- Analytics (bandwidth, hits, errors)

## Architecture

```
User → DNS (Anycast) → Nearest Edge Server → Origin Shield → Origin Server
                              ↓
                        Edge Cache (Redis)
```

## Key Designs

### 1. Anycast DNS Routing

```
Same IP (e.g., 1.1.1.1) announced from multiple locations worldwide
User's DNS resolver routes to nearest PoP (Point of Presence)

Example:
- User in Tokyo → Routes to Tokyo PoP (10ms)
- User in NYC → Routes to NYC PoP (5ms)
```

### 2. Cache Hierarchy

```
L1: Edge Cache (200+ locations)
  ↓ (miss)
L2: Origin Shield (10 regional hubs)
  ↓ (miss)
L3: Origin Server
```

### 3. Cache Invalidation

```python
# Option 1: TTL-based
Cache-Control: max-age=3600  # 1 hour

# Option 2: Purge API
POST /api/purge
{
  "urls": ["https://example.com/style.css"],
  "purge_type": "instant"  # or "lazy"
}

# Broadcast to all edge servers
for edge in edge_servers:
    redis.delete(f"cache:{url_hash}")
```

### 4. DDoS Protection

```python
# Rate limiting at edge
@edge_server.middleware
def ddos_protection(request):
    ip = request.client_ip

    # Track requests per IP
    count = redis.incr(f"rate:{ip}")
    if count == 1:
        redis.expire(f"rate:{ip}", 10)  # 10 sec window

    if count > 100:  # 100 req/10sec = 10 req/sec
        return Response("Rate limited", status=429)

    # Challenge-response for suspicious traffic
    if is_suspicious(request):
        return captcha_challenge()
```

## Advanced Features

### Smart Routing

```python
def route_request(user_ip):
    # Find nearest PoPs
    candidates = get_nearest_pops(user_ip, count=5)

    # Score by: latency + load + cache hit rate
    scores = []
    for pop in candidates:
        latency = measure_latency(user_ip, pop)
        load = get_cpu_usage(pop)
        hit_rate = get_cache_hit_rate(pop)

        score = (
            -latency * 1.0 +      # Minimize latency
            -(load / 100) * 0.3 + # Minimize load
            hit_rate * 0.2        # Maximize hit rate
        )

        scores.append((pop, score))

    # Route to best PoP
    best_pop = max(scores, key=lambda x: x[1])[0]
    return best_pop
```

### Bandwidth Optimization

```python
# Brotli compression (better than gzip)
@edge_server.middleware
def compress_response(response):
    if 'text/' in response.content_type or 'application/json' in response.content_type:
        if 'br' in request.headers.get('Accept-Encoding', ''):
            response.body = brotli.compress(response.body)
            response.headers['Content-Encoding'] = 'br'
            # 20-30% smaller than gzip!

# Image optimization
def optimize_image(image_url):
    # Convert to WebP (30% smaller)
    # Resize based on client device
    # Lazy load (serve placeholder first)
    pass
```

## Monitoring

```
Performance:
- Cache hit rate: > 90%
- Edge latency: p50 < 50ms, p99 < 200ms
- Origin offload: > 95%

Availability:
- Uptime: 99.99% (52 min/year)
- DDoS mitigation: Block > 100 Gbps attacks

Business:
- Bandwidth served: 10 PB/day
- Requests: 100B/day
- Cost savings: 80% (vs origin-only)
```

## Interview Talking Points

"CDN key challenge is global distribution with low latency. Use Anycast DNS to route to nearest PoP. Implement 3-tier cache (edge → shield → origin) with 90%+ hit rate. For DDoS protection, rate limit at edge + challenge-response. Smart routing considers latency + load + hit rate. Origin shield reduces origin load 95%. Monitor cache hit rate and offload percentage."
