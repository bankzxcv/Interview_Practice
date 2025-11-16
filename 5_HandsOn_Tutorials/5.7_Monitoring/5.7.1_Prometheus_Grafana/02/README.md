# Tutorial 02: Exporters - Node Exporter and Application Exporters

## Learning Objectives
- Understand Prometheus exporters
- Set up Node Exporter for system metrics
- Configure process exporters
- Use MySQL and PostgreSQL exporters
- Create custom exporters

## What are Exporters?

Exporters are services that:
- Collect metrics from third-party systems
- Expose metrics in Prometheus format
- Act as a bridge between Prometheus and services that don't natively expose metrics

## Architecture

```
┌─────────────┐
│ Prometheus  │
└──────┬──────┘
       │
       ├─→ Node Exporter (system metrics)
       ├─→ PostgreSQL Exporter (DB metrics)
       ├─→ MySQL Exporter (DB metrics)
       ├─→ Custom Exporter (your metrics)
       └─→ Process Exporter (process metrics)
```

## Step 1: Node Exporter Setup

Node Exporter exposes hardware and OS metrics (CPU, memory, disk, network).

```yaml
# docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: node-exporter
    command:
      - '--path.rootfs=/host'
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    ports:
      - "9100:9100"
    networks:
      - monitoring
    restart: unless-stopped

  # PostgreSQL with metrics
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - monitoring

  # PostgreSQL Exporter
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:v0.15.0
    container_name: postgres-exporter
    environment:
      DATA_SOURCE_NAME: "postgresql://admin:secret@postgres:5432/myapp?sslmode=disable"
    ports:
      - "9187:9187"
    networks:
      - monitoring
    depends_on:
      - postgres

  # MySQL database
  mysql:
    image: mysql:8.0
    container_name: mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: myapp
      MYSQL_USER: admin
      MYSQL_PASSWORD: secret
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - monitoring

  # MySQL Exporter
  mysql-exporter:
    image: prom/mysqld-exporter:v0.15.1
    container_name: mysql-exporter
    environment:
      DATA_SOURCE_NAME: "admin:secret@(mysql:3306)/myapp"
    ports:
      - "9104:9104"
    networks:
      - monitoring
    depends_on:
      - mysql

  # Redis
  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    networks:
      - monitoring

  # Redis Exporter
  redis-exporter:
    image: oliver006/redis_exporter:v1.55.0
    container_name: redis-exporter
    environment:
      REDIS_ADDR: "redis:6379"
    ports:
      - "9121:9121"
    networks:
      - monitoring
    depends_on:
      - redis

volumes:
  prometheus-data:
  postgres-data:
  mysql-data:

networks:
  monitoring:
    driver: bridge
```

## Step 2: Update Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter - System metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
        labels:
          instance: 'docker-host'
          environment: 'development'

  # PostgreSQL Exporter
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
        labels:
          database: 'postgres'
          environment: 'development'

  # MySQL Exporter
  - job_name: 'mysql-exporter'
    static_configs:
      - targets: ['mysql-exporter:9104']
        labels:
          database: 'mysql'
          environment: 'development'

  # Redis Exporter
  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
        labels:
          cache: 'redis'
          environment: 'development'
```

## Step 3: Start the Stack

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f node-exporter
docker-compose logs -f postgres-exporter
```

## Step 4: Explore Node Exporter Metrics

```bash
# View raw metrics
curl http://localhost:9100/metrics

# Key metrics available:
# - node_cpu_seconds_total - CPU time
# - node_memory_MemAvailable_bytes - Available memory
# - node_disk_io_time_seconds_total - Disk I/O
# - node_network_receive_bytes_total - Network RX
# - node_filesystem_avail_bytes - Filesystem space
```

### Useful Node Exporter Queries

```promql
# CPU usage percentage
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage percentage
100 - ((node_filesystem_avail_bytes{mountpoint="/",fstype!="rootfs"} / node_filesystem_size_bytes{mountpoint="/",fstype!="rootfs"}) * 100)

# Network traffic (bytes received per second)
rate(node_network_receive_bytes_total[5m])

# Network traffic (bytes transmitted per second)
rate(node_network_transmit_bytes_total[5m])

# Disk read IOPS
rate(node_disk_reads_completed_total[5m])

# Disk write IOPS
rate(node_disk_writes_completed_total[5m])

# System load average (1 minute)
node_load1

# Number of CPU cores
count(node_cpu_seconds_total{mode="idle"})

# Filesystem usage by mount point
(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes
```

## Step 5: PostgreSQL Exporter Metrics

```bash
# View PostgreSQL metrics
curl http://localhost:9187/metrics
```

### Useful PostgreSQL Queries

```promql
# Active connections
pg_stat_activity_count{state="active"}

# Database size
pg_database_size_bytes{datname="myapp"}

# Transaction rate
rate(pg_stat_database_xact_commit{datname="myapp"}[5m])

# Rollback rate
rate(pg_stat_database_xact_rollback{datname="myapp"}[5m])

# Cache hit ratio (should be > 90%)
sum(pg_stat_database_blks_hit{datname="myapp"}) / (sum(pg_stat_database_blks_hit{datname="myapp"}) + sum(pg_stat_database_blks_read{datname="myapp"})) * 100

# Deadlocks
rate(pg_stat_database_deadlocks{datname="myapp"}[5m])

# Replication lag (if applicable)
pg_replication_lag
```

## Step 6: MySQL Exporter Metrics

```bash
# View MySQL metrics
curl http://localhost:9104/metrics
```

### Useful MySQL Queries

```promql
# Connections
mysql_global_status_threads_connected

# Queries per second
rate(mysql_global_status_queries[5m])

# Slow queries
rate(mysql_global_status_slow_queries[5m])

# InnoDB buffer pool usage
mysql_global_status_innodb_buffer_pool_bytes_data / mysql_global_variables_innodb_buffer_pool_size

# Table locks
rate(mysql_global_status_table_locks_immediate[5m])

# Replication lag
mysql_slave_status_seconds_behind_master
```

## Step 7: Custom Python Exporter

Create a custom exporter for application-specific metrics:

```python
# custom_exporter.py
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
```

```dockerfile
# Dockerfile.custom-exporter
FROM python:3.11-slim

WORKDIR /app

RUN pip install prometheus-client

COPY custom_exporter.py .

EXPOSE 8000

CMD ["python", "custom_exporter.py"]
```

Add to docker-compose.yml:

```yaml
  custom-exporter:
    build:
      context: .
      dockerfile: Dockerfile.custom-exporter
    container_name: custom-exporter
    ports:
      - "8000:8000"
    networks:
      - monitoring
```

Update prometheus.yml:

```yaml
  - job_name: 'custom-exporter'
    static_configs:
      - targets: ['custom-exporter:8000']
        labels:
          application: 'custom-app'
```

## Step 8: Process Exporter

Monitor specific processes:

```yaml
# process-exporter.yml
process_names:
  - name: "{{.Comm}}"
    cmdline:
    - '.+'

# Add to docker-compose.yml
  process-exporter:
    image: ncabatoff/process-exporter:0.7.10
    container_name: process-exporter
    volumes:
      - /proc:/host/proc:ro
      - ./process-exporter.yml:/config/process-exporter.yml
    command:
      - '--procfs=/host/proc'
      - '--config.path=/config/process-exporter.yml'
    ports:
      - "9256:9256"
    networks:
      - monitoring
    privileged: true
```

## Step 9: Blackbox Exporter (Probe Endpoints)

Monitor HTTP endpoints, DNS, TCP, ICMP:

```yaml
# blackbox.yml
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: []  # Defaults to 2xx
      method: GET
      fail_if_not_ssl: false

  http_post_2xx:
    prober: http
    http:
      method: POST
      headers:
        Content-Type: application/json
      body: '{"test": "data"}'

  tcp_connect:
    prober: tcp
    timeout: 5s

  icmp:
    prober: icmp
    timeout: 5s

# Add to docker-compose.yml
  blackbox-exporter:
    image: prom/blackbox-exporter:v0.24.0
    container_name: blackbox-exporter
    volumes:
      - ./blackbox.yml:/etc/blackbox_exporter/config.yml
    ports:
      - "9115:9115"
    networks:
      - monitoring
    command:
      - '--config.file=/etc/blackbox_exporter/config.yml'
```

Update prometheus.yml:

```yaml
  - job_name: 'blackbox-http'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - http://google.com
        - http://github.com
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

### Blackbox Exporter Queries

```promql
# Probe success (1 = up, 0 = down)
probe_success

# HTTP response time
probe_http_duration_seconds

# SSL certificate expiry (days)
(probe_ssl_earliest_cert_expiry - time()) / 86400

# DNS lookup duration
probe_dns_lookup_time_seconds
```

## Step 10: Dashboard Queries for Exporters

### System Health Dashboard

```promql
# CPU Usage
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory Usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk I/O
rate(node_disk_read_bytes_total[5m])
rate(node_disk_written_bytes_total[5m])

# Network I/O
rate(node_network_receive_bytes_total[5m])
rate(node_network_transmit_bytes_total[5m])
```

### Database Health Dashboard

```promql
# PostgreSQL connections
pg_stat_activity_count

# MySQL queries/sec
rate(mysql_global_status_queries[5m])

# Database sizes
pg_database_size_bytes
```

## Exercises

1. **Add NGINX Exporter**: Monitor NGINX metrics
2. **Create Custom Metrics**: Build a Python script that exposes business metrics
3. **Monitor Docker**: Add cAdvisor to monitor container metrics
4. **Alert on Disk**: Create alert when disk usage > 80%
5. **Endpoint Monitoring**: Use Blackbox to monitor your APIs

## Common Exporters Reference

| Exporter | Port | Purpose |
|----------|------|---------|
| Node Exporter | 9100 | System metrics |
| cAdvisor | 8080 | Container metrics |
| MySQL Exporter | 9104 | MySQL metrics |
| PostgreSQL Exporter | 9187 | PostgreSQL metrics |
| MongoDB Exporter | 9216 | MongoDB metrics |
| Redis Exporter | 9121 | Redis metrics |
| Elasticsearch Exporter | 9114 | Elasticsearch metrics |
| RabbitMQ Exporter | 9419 | RabbitMQ metrics |
| NGINX Exporter | 9113 | NGINX metrics |
| Blackbox Exporter | 9115 | Endpoint probing |
| Process Exporter | 9256 | Process metrics |

## Cleanup

```bash
docker-compose down -v
```

## Key Takeaways

- ✅ Exporters bridge Prometheus with third-party systems
- ✅ Node Exporter provides comprehensive system metrics
- ✅ Database exporters monitor DB performance
- ✅ Custom exporters can expose any metrics
- ✅ Blackbox exporter probes endpoints externally
- ✅ One exporter instance can monitor multiple targets

## Next Steps

Continue to **Tutorial 03: Service Discovery** to learn about:
- Kubernetes service discovery
- Consul service discovery
- Dynamic target discovery
- File-based service discovery

## Additional Resources

- [Exporters List](https://prometheus.io/docs/instrumenting/exporters/)
- [Node Exporter](https://github.com/prometheus/node_exporter)
- [Blackbox Exporter](https://github.com/prometheus/blackbox_exporter)
- [Writing Exporters](https://prometheus.io/docs/instrumenting/writing_exporters/)
