# Tutorial 11: Health Checks

## Objectives
- Implement container health checks
- Understand HEALTHCHECK directive
- Create custom health check scripts
- Monitor container health status
- Implement health-based orchestration

## Prerequisites
- Completed Tutorial 10 (Full-Stack App)
- Understanding of HTTP endpoints
- Basic shell scripting knowledge

## What are Health Checks?

Health checks determine if a container is functioning correctly. They tell Docker:
- **Is the container healthy?**
- **Should traffic be routed to it?**
- **Should it be restarted?**

## HEALTHCHECK Instruction

### Dockerfile Syntax

```dockerfile
HEALTHCHECK [OPTIONS] CMD command

Options:
  --interval=DURATION (default: 30s)
  --timeout=DURATION (default: 30s)
  --start-period=DURATION (default: 0s)
  --retries=N (default: 3)
```

### Basic Example

```dockerfile
FROM nginx:alpine

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1
```

## Health Check Examples

### Example 1: Web Server

```dockerfile
FROM nginx:alpine

COPY index.html /usr/share/nginx/html/

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Or using wget
HEALTHCHECK CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
```

### Example 2: Node.js API

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node healthcheck.js || exit 1

CMD ["node", "server.js"]
```

`healthcheck.js`:
```javascript
const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/health',
  timeout: 2000
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.log('ERROR:', err);
  process.exit(1);
});

req.end();
```

### Example 3: Python Flask App

```dockerfile
FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

### Example 4: Database Health Check

```dockerfile
FROM postgres:15-alpine

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD pg_isready -U postgres -d mydb || exit 1
```

### Example 5: Redis Health Check

```dockerfile
FROM redis:7-alpine

HEALTHCHECK --interval=5s --timeout=3s --retries=3 \
    CMD redis-cli ping || exit 1

# With authentication
HEALTHCHECK CMD redis-cli -a "$REDIS_PASSWORD" ping || exit 1
```

## Docker Compose Health Checks

```yaml
version: '3.8'

services:
  web:
    build: ./web
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  api:
    build: ./api
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
```

## Advanced Health Checks

### Multi-Step Health Check

```bash
#!/bin/sh
# healthcheck.sh

set -e

# Check 1: Service responding
curl -f http://localhost:3000/health || exit 1

# Check 2: Database connection
curl -f http://localhost:3000/health/db || exit 1

# Check 3: Redis connection
curl -f http://localhost:3000/health/redis || exit 1

# Check 4: Disk space
df -h | awk '$NF=="/"{if($5+0 > 90) exit 1}'

echo "All health checks passed"
exit 0
```

```dockerfile
COPY healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh
```

### Detailed Health Endpoint

`app.js`:
```javascript
const express = require('express');
const app = express();

// Simple health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Detailed health check
app.get('/health/detailed', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'healthy',
    checks: {}
  };

  // Check database
  try {
    await db.query('SELECT 1');
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'unhealthy';
  }

  // Check Redis
  try {
    await redis.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    health.checks.redis = 'unhealthy';
    health.status = 'unhealthy';
  }

  // Check memory
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    rss: memUsage.rss
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.listen(3000);
```

## Complete Example

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  nginx:
    build: ./nginx
    ports:
      - "80:80"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    depends_on:
      api:
        condition: service_healthy

  api:
    build: ./api
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=mydb
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - db_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    volumes:
      - redis_data:/data

volumes:
  db_data:
  redis_data:
```

## Monitoring Health Status

```bash
# Check container health
docker ps

# Inspect health status
docker inspect --format='{{.State.Health.Status}}' container-name

# View health check logs
docker inspect --format='{{json .State.Health}}' container-name | jq

# Watch health status
watch -n 1 'docker ps --format "table {{.Names}}\t{{.Status}}"'

# Filter only unhealthy containers
docker ps --filter health=unhealthy

# Docker Compose
docker-compose ps
```

## Health Check Best Practices

1. **Start Period**: Allow time for app initialization
2. **Appropriate Intervals**: Not too frequent (resource waste)
3. **Quick Checks**: Health checks should be fast (< 1s)
4. **Dependency Checks**: Verify database, cache connections
5. **Graceful Degradation**: Return 503 when unhealthy
6. **Logging**: Log health check failures
7. **Multiple Checks**: Check all critical dependencies
8. **Proper Exit Codes**: 0 = healthy, 1 = unhealthy

## Troubleshooting

### Health Check Always Failing

```bash
# Debug health check command
docker exec container-name curl -f http://localhost/health

# Check logs
docker logs container-name

# Inspect health details
docker inspect container-name | jq '.[0].State.Health'
```

### Container Keeps Restarting

```yaml
# Increase start period
healthcheck:
  start_period: 120s  # Give more time to initialize
```

### False Positives

```bash
# Increase retries
healthcheck:
  retries: 5  # More retries before marking unhealthy
```

## Next Steps

- **Tutorial 12**: Resource limits
- **Tutorial 13**: Security best practices
- **Tutorial 14**: Multi-arch builds

## Key Takeaways

1. Health checks monitor container health
2. Use HEALTHCHECK in Dockerfile
3. Implement /health endpoint in applications
4. Set appropriate intervals and timeouts
5. Check all critical dependencies
6. Use depends_on with condition: service_healthy
7. Start period prevents false failures
8. Health checks enable automated recovery
9. Monitor health status regularly
10. Essential for production deployments
