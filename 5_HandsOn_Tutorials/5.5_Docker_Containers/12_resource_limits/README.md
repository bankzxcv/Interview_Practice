# Tutorial 12: Resource Limits

## Objectives
- Understand container resource management
- Set CPU and memory limits
- Implement resource reservations
- Monitor resource usage
- Prevent resource exhaustion

## Prerequisites
- Completed Tutorial 11 (Health Checks)
- Understanding of system resources
- Basic performance concepts

## Why Resource Limits?

Without limits, a single container can:
- **Consume all CPU** → Starve other containers
- **Use all memory** → Crash the host
- **Fill up disk** → System failure
- **Monopolize I/O** → Slow everything down

## Setting Resource Limits

### Docker Run

```bash
# Memory limit
docker run -m 512m nginx

# Memory + swap limit
docker run -m 512m --memory-swap 1g nginx

# Memory reservation (soft limit)
docker run --memory-reservation 256m nginx

# CPU shares (relative weight)
docker run --cpu-shares 512 nginx

# CPU limit (percentage)
docker run --cpus 0.5 nginx

# Specific CPUs
docker run --cpuset-cpus 0,1 nginx

# All limits
docker run \
  --memory 512m \
  --memory-reservation 256m \
  --cpus 0.5 \
  --pids-limit 100 \
  nginx
```

### Docker Compose

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Memory Limits

### Basic Memory Limit

```yaml
services:
  app:
    image: myapp
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### Memory with Swap

```bash
# Memory: 512MB, Swap: 512MB (total 1GB)
docker run -m 512m --memory-swap 1g myapp

# No swap
docker run -m 512m --memory-swap 512m myapp

# Unlimited swap
docker run -m 512m --memory-swap -1 myapp
```

### OOM Killer Behavior

```bash
# Disable OOM killer for this container
docker run --oom-kill-disable myapp

# Set OOM score adjustment (-1000 to 1000)
docker run --oom-score-adj -500 myapp
```

## CPU Limits

### CPU Shares (Relative Weight)

```yaml
services:
  # Gets more CPU when contested
  high-priority:
    image: myapp
    deploy:
      resources:
        limits:
          cpus: '2.0'
    cpu_shares: 2048  # Default is 1024

  # Gets less CPU when contested
  low-priority:
    image: worker
    cpu_shares: 512
```

### CPU Quota

```yaml
services:
  app:
    image: myapp
    deploy:
      resources:
        limits:
          cpus: '1.5'  # 1.5 CPU cores max
```

### CPU Affinity

```bash
# Pin to specific CPUs
docker run --cpuset-cpus 0,1 nginx

# Use first 2 CPUs
docker run --cpuset-cpus 0-1 nginx
```

## Complete Example: Resource-Managed Application

```yaml
version: '3.8'

services:
  # Frontend - Light resource usage
  frontend:
    build: ./frontend
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 128M
      replicas: 2
    restart: unless-stopped

  # Backend API - Medium resource usage
  backend:
    build: ./backend
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      replicas: 3
    environment:
      - NODE_ENV=production
      - MAX_OLD_SPACE_SIZE=896  # Leave some for overhead

  # Database - High resource priority
  database:
    image: postgres:15-alpine
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
    environment:
      - POSTGRES_SHARED_BUFFERS=512MB
      - POSTGRES_EFFECTIVE_CACHE_SIZE=1536MB
    volumes:
      - db_data:/var/lib/postgresql/data
    shm_size: 256m  # Shared memory for PostgreSQL

  # Redis - Fast, limited resources
  redis:
    image: redis:7-alpine
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    command: redis-server --maxmemory 450mb --maxmemory-policy allkeys-lru

  # Worker - CPU intensive
  worker:
    build: ./worker
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '1.0'
          memory: 512M
      replicas: 2

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    volumes:
      - prometheus_data:/prometheus

volumes:
  db_data:
  prometheus_data:
```

## Monitoring Resource Usage

### Real-time Monitoring

```bash
# Monitor all containers
docker stats

# Monitor specific container
docker stats container-name

# No stream (single output)
docker stats --no-stream

# Format output
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Docker Compose
docker-compose stats
```

### Inspect Limits

```bash
# View container limits
docker inspect container-name | jq '.[0].HostConfig | {Memory, NanoCpus, CpuShares}'

# Check current resource usage
docker stats --no-stream container-name
```

## Advanced Resource Management

### I/O Limits

```bash
# Block IO weight (10-1000)
docker run --blkio-weight 500 myapp

# Read/write rate limits
docker run \
  --device-read-bps /dev/sda:1mb \
  --device-write-bps /dev/sda:1mb \
  myapp

# IOPS limits
docker run \
  --device-read-iops /dev/sda:1000 \
  --device-write-iops /dev/sda:1000 \
  myapp
```

### PID Limits

```bash
# Limit number of processes
docker run --pids-limit 100 myapp
```

```yaml
services:
  app:
    image: myapp
    pids_limit: 100
```

### Ulimits

```bash
# File descriptor limits
docker run --ulimit nofile=1024:2048 myapp
```

```yaml
services:
  app:
    image: myapp
    ulimits:
      nofile:
        soft: 1024
        hard: 2048
      nproc: 512
```

## Application-Specific Limits

### Node.js

```dockerfile
# Set heap size
ENV NODE_OPTIONS="--max-old-space-size=896"

# Or in package.json
"scripts": {
  "start": "node --max-old-space-size=896 server.js"
}
```

### Java

```dockerfile
# JVM heap settings
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:MaxMetaspaceSize=256m"
```

### Python

```dockerfile
# Environment variable
ENV PYTHONMALLOC=malloc
```

### PostgreSQL

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_SHARED_BUFFERS=256MB
      - POSTGRES_EFFECTIVE_CACHE_SIZE=1GB
      - POSTGRES_WORK_MEM=16MB
      - POSTGRES_MAINTENANCE_WORK_MEM=128MB
    deploy:
      resources:
        limits:
          memory: 2G
    shm_size: 256m
```

## Best Practices

### 1. Always Set Limits

```yaml
# Good
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

# Bad - no limits
services:
  app:
    image: myapp
```

### 2. Set Reservations

```yaml
# Ensures minimum resources
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '1.0'
      memory: 1G
```

### 3. Leave Overhead

```yaml
# If container limit is 1GB
# Set app heap to ~896MB (leaving ~128MB overhead)
environment:
  - MAX_MEMORY=896m
deploy:
  resources:
    limits:
      memory: 1G
```

### 4. Monitor and Adjust

```bash
# Monitor for a period
docker stats --no-stream > stats.log

# Adjust based on actual usage
# Peak usage + 20-30% buffer
```

## Troubleshooting

### OOM (Out of Memory) Killed

```bash
# Check logs
docker logs container-name

# Look for OOM in system logs
dmesg | grep -i oom

# Increase memory limit
deploy:
  resources:
    limits:
      memory: 2G  # Increase from 1G
```

### High CPU Usage

```bash
# Check what's consuming CPU
docker exec container-name top

# Profile the application
# Use language-specific profilers

# Increase CPU limit or optimize code
deploy:
  resources:
    limits:
      cpus: '2.0'
```

### Container Throttled

```bash
# Check throttling stats
docker stats --no-stream container-name

# If CPU usage at 100% of limit, increase it
```

## Resource Planning

### Calculate Requirements

1. **Baseline Testing**
   ```bash
   # Run app under normal load
   docker stats --no-stream myapp
   ```

2. **Load Testing**
   ```bash
   # Stress test
   ab -n 10000 -c 100 http://localhost/
   docker stats --no-stream myapp
   ```

3. **Add Buffer**
   ```
   Peak Usage + 30% = Limit
   Average Usage = Reservation
   ```

### Example Calculation

```
Observed Memory Usage:
- Idle: 200MB
- Normal: 400MB
- Peak: 700MB

Settings:
limits:
  memory: 1G      # Peak (700MB) + 30% buffer
reservations:
  memory: 512M    # Slightly above normal (400MB)
```

## Production Recommendations

```yaml
version: '3.8'

services:
  # Stateless services - can be killed/restarted
  web:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
      restart_policy:
        condition: on-failure
        max_attempts: 3

  # Stateful services - higher priority
  database:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.5'
          memory: 2G
      restart_policy:
        condition: on-failure
        delay: 10s
    oom_score_adj: -500  # Lower chance of being killed
```

## Next Steps

- **Tutorial 13**: Security best practices
- **Tutorial 14**: Multi-arch builds
- **Tutorial 15**: Registry operations

## Key Takeaways

1. Always set resource limits in production
2. Memory limits prevent OOM situations
3. CPU limits prevent resource starvation
4. Use reservations for guaranteed resources
5. Monitor resource usage regularly
6. Leave overhead for application runtime
7. Set application-specific limits
8. Test under load before production
9. Plan for peak usage + buffer
10. Resource limits are critical for stability
