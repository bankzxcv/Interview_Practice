# Tutorial 07: RabbitMQ Monitoring and Management

## Objectives

By the end of this tutorial, you will:
- Master the RabbitMQ Management UI
- Use the HTTP Management API with curl and Python
- Set up Prometheus metrics exporter for RabbitMQ
- Configure Grafana dashboards for visualization
- Understand key metrics: queue depth, consumer lag, throughput
- Implement alerting strategies with Prometheus Alertmanager
- Monitor cluster health and performance
- Set up logging and tracing
- Build production-grade monitoring stack

## Prerequisites

- Docker and Docker Compose installed
- Python 3.8+ installed
- Completed Tutorial 01 (Basic Setup)
- Basic understanding of monitoring concepts
- Familiarity with Prometheus and Grafana (helpful)
- 4GB RAM minimum for monitoring stack

## Why Monitor RabbitMQ?

Proper monitoring prevents:
- **Message Loss**: Detect queue depth explosions
- **Performance Degradation**: Identify bottlenecks early
- **Outages**: Alert on node failures
- **Consumer Issues**: Track consumer lag and disconnections
- **Resource Exhaustion**: Monitor memory and disk usage

### Monitoring Architecture

```
┌─────────────────────────────────────────────────────┐
│                  RabbitMQ Cluster                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ rabbit1  │  │ rabbit2  │  │ rabbit3  │          │
│  │  :9419   │  │  :9419   │  │  :9419   │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │             │             │                 │
│       └─────────────┼─────────────┘                 │
│                     │ Metrics                       │
└─────────────────────┼───────────────────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │  Prometheus  │  (Metrics Collection)
              │    :9090     │
              └──────┬───────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
  ┌──────────────┐      ┌─────────────┐
  │   Grafana    │      │ Alertmanager│
  │    :3000     │      │    :9093    │
  └──────────────┘      └─────────────┘
  (Visualization)       (Alerting)
```

## Step-by-Step Instructions

### Step 1: Create Monitoring Stack Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # RabbitMQ with Prometheus plugin
  rabbitmq:
    image: rabbitmq:3.12-management
    container_name: rabbitmq
    hostname: rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
    ports:
      - "5672:5672"
      - "15672:15672"
      - "15692:15692"  # Prometheus metrics (legacy)
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
      - ./rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
      - ./enabled_plugins:/etc/rabbitmq/enabled_plugins:ro
    networks:
      - monitoring
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Prometheus Exporter for RabbitMQ
  rabbitmq-exporter:
    image: kbudde/rabbitmq-exporter:latest
    container_name: rabbitmq-exporter
    environment:
      RABBIT_URL: http://rabbitmq:15672
      RABBIT_USER: admin
      RABBIT_PASSWORD: password
      PUBLISH_PORT: "9419"
      LOG_LEVEL: info
      RABBIT_CAPABILITIES: "bert,no_sort"
    ports:
      - "9419:9419"
    networks:
      - monitoring
    depends_on:
      rabbitmq:
        condition: service_healthy

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./alerts.yml:/etc/prometheus/alerts.yml:ro
      - prometheus_data:/prometheus
    networks:
      - monitoring
    depends_on:
      - rabbitmq-exporter

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_INSTALL_PLUGINS: grafana-piechart-panel
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    networks:
      - monitoring
    depends_on:
      - prometheus

  # Alertmanager
  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager_data:/alertmanager
    networks:
      - monitoring

volumes:
  rabbitmq_data:
  prometheus_data:
  grafana_data:
  alertmanager_data:

networks:
  monitoring:
    driver: bridge
```

### Step 2: Configure RabbitMQ

Create `rabbitmq.conf`:

```ini
# Management
management.tcp.port = 15672

# Prometheus metrics
prometheus.return_per_object_metrics = true

# Logging
log.console.level = info
log.file.level = info

# Memory
vm_memory_high_watermark.relative = 0.6

# Disk
disk_free_limit.absolute = 2GB
```

Create `enabled_plugins`:

```erlang
[rabbitmq_management,rabbitmq_prometheus].
```

### Step 3: Configure Prometheus

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'rabbitmq-monitoring'
    environment: 'production'

# Alerting
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

# Load rules
rule_files:
  - 'alerts.yml'

# Scrape configs
scrape_configs:
  # RabbitMQ Exporter
  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq-exporter:9419']
        labels:
          instance: 'rabbitmq-main'
          service: 'rabbitmq'

  # RabbitMQ Built-in Prometheus Endpoint
  - job_name: 'rabbitmq-prometheus'
    static_configs:
      - targets: ['rabbitmq:15692']
        labels:
          instance: 'rabbitmq-builtin'

  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

### Step 4: Create Prometheus Alert Rules

Create `alerts.yml`:

```yaml
groups:
  - name: rabbitmq_alerts
    interval: 30s
    rules:
      # Node down
      - alert: RabbitMQNodeDown
        expr: up{job="rabbitmq"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "RabbitMQ node {{ $labels.instance }} is down"
          description: "RabbitMQ node has been down for more than 1 minute"

      # High memory usage
      - alert: RabbitMQHighMemoryUsage
        expr: (rabbitmq_process_resident_memory_bytes / rabbitmq_resident_memory_limit_bytes) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "RabbitMQ {{ $labels.instance }} high memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }} (threshold: 80%)"

      # Disk space low
      - alert: RabbitMQDiskSpaceLow
        expr: rabbitmq_disk_space_available_bytes < 2147483648
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "RabbitMQ {{ $labels.instance }} low disk space"
          description: "Available disk space is {{ $value | humanize1024 }} (threshold: 2GB)"

      # Queue growing
      - alert: RabbitMQQueueGrowing
        expr: rate(rabbitmq_queue_messages_ready[5m]) > 100
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "RabbitMQ queue {{ $labels.queue }} is growing"
          description: "Queue depth increasing at {{ $value }} msgs/sec for 10 minutes"

      # No consumers
      - alert: RabbitMQNoConsumers
        expr: rabbitmq_queue_consumers{queue!~"amq.*"} == 0 and rabbitmq_queue_messages > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "RabbitMQ queue {{ $labels.queue }} has no consumers"
          description: "Queue has {{ $value }} messages but no consumers"

      # High unacked messages
      - alert: RabbitMQHighUnackedMessages
        expr: rabbitmq_queue_messages_unacknowledged > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "RabbitMQ queue {{ $labels.queue }} has high unacked messages"
          description: "Queue has {{ $value }} unacknowledged messages for 10 minutes"

      # Connection count high
      - alert: RabbitMQTooManyConnections
        expr: rabbitmq_connections > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "RabbitMQ {{ $labels.instance }} has too many connections"
          description: "Connection count is {{ $value }} (threshold: 1000)"

      # File descriptors usage high
      - alert: RabbitMQFileDescriptorsUsage
        expr: (rabbitmq_process_open_fds / rabbitmq_process_max_fds) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "RabbitMQ {{ $labels.instance }} high file descriptor usage"
          description: "File descriptor usage is {{ $value | humanizePercentage }}"

      # Channel count high per connection
      - alert: RabbitMQTooManyChannels
        expr: rabbitmq_channels > 2000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "RabbitMQ {{ $labels.instance }} has too many channels"
          description: "Channel count is {{ $value }}"

      # Publisher blocked
      - alert: RabbitMQPublishersBlocked
        expr: rabbitmq_connection_channels_blocked > 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "RabbitMQ publishers are blocked"
          description: "{{ $value }} channels are blocked from publishing"
```

### Step 5: Configure Alertmanager

Create `alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m
  smtp_from: 'alertmanager@example.com'
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_auth_username: 'your-email@gmail.com'
  smtp_auth_password: 'your-app-password'
  smtp_require_tls: true

# Templates for notifications
templates:
  - '/etc/alertmanager/*.tmpl'

# Route tree
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'

  routes:
    - match:
        severity: critical
      receiver: 'critical'
      continue: true

    - match:
        severity: warning
      receiver: 'warning'

# Receivers
receivers:
  - name: 'default'
    webhook_configs:
      - url: 'http://localhost:5001/webhook'
        send_resolved: true

  - name: 'critical'
    email_configs:
      - to: 'oncall@example.com'
        headers:
          Subject: '[CRITICAL] RabbitMQ Alert'
        html: |
          <h2>Critical Alert</h2>
          <p><b>Alert:</b> {{ .GroupLabels.alertname }}</p>
          <p><b>Instance:</b> {{ .GroupLabels.instance }}</p>
          <p><b>Description:</b> {{ .CommonAnnotations.description }}</p>

    # Slack notification (optional)
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#rabbitmq-alerts'
        title: 'RabbitMQ Critical Alert'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'warning'
    email_configs:
      - to: 'team@example.com'
        headers:
          Subject: '[WARNING] RabbitMQ Alert'

# Inhibition rules
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

### Step 6: Create Grafana Provisioning

Create directory structure:
```bash
mkdir -p grafana/provisioning/datasources
mkdir -p grafana/provisioning/dashboards
mkdir -p grafana/dashboards
```

Create `grafana/provisioning/datasources/prometheus.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: "15s"
```

Create `grafana/provisioning/dashboards/rabbitmq.yml`:

```yaml
apiVersion: 1

providers:
  - name: 'RabbitMQ Dashboards'
    orgId: 1
    folder: 'RabbitMQ'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
```

### Step 7: Create Grafana Dashboard

Create `grafana/dashboards/rabbitmq-overview.json`:

```json
{
  "dashboard": {
    "title": "RabbitMQ Overview",
    "tags": ["rabbitmq", "messaging"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Node Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"rabbitmq\"}",
            "legendFormat": "{{ instance }}"
          }
        ],
        "gridPos": {"h": 4, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Messages Ready",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rabbitmq_queue_messages_ready) by (queue)",
            "legendFormat": "{{ queue }}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 4}
      },
      {
        "id": 3,
        "title": "Message Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(rabbitmq_queue_messages_published_total[5m])",
            "legendFormat": "Published"
          },
          {
            "expr": "rate(rabbitmq_queue_messages_acked_total[5m])",
            "legendFormat": "Acknowledged"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 4}
      },
      {
        "id": 4,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rabbitmq_process_resident_memory_bytes",
            "legendFormat": "{{ instance }}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 12}
      },
      {
        "id": 5,
        "title": "Connection Count",
        "type": "graph",
        "targets": [
          {
            "expr": "rabbitmq_connections",
            "legendFormat": "{{ instance }}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 12}
      },
      {
        "id": 6,
        "title": "Consumer Count by Queue",
        "type": "graph",
        "targets": [
          {
            "expr": "rabbitmq_queue_consumers",
            "legendFormat": "{{ queue }}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 20}
      },
      {
        "id": 7,
        "title": "Unacknowledged Messages",
        "type": "graph",
        "targets": [
          {
            "expr": "rabbitmq_queue_messages_unacknowledged",
            "legendFormat": "{{ queue }}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 20}
      }
    ],
    "refresh": "10s",
    "time": {"from": "now-1h", "to": "now"}
  }
}
```

### Step 8: Create Management API Client

Create `management_api_client.py`:

```python
#!/usr/bin/env python3
import requests
from requests.auth import HTTPBasicAuth
import json
from typing import Dict, List
import time

class RabbitMQManagementAPI:
    """RabbitMQ Management API Client"""

    def __init__(self, host='localhost', port=15672, username='admin', password='password'):
        self.base_url = f'http://{host}:{port}/api'
        self.auth = HTTPBasicAuth(username, password)
        self.headers = {'content-type': 'application/json'}

    def get_overview(self) -> Dict:
        """Get cluster overview"""
        response = requests.get(f'{self.base_url}/overview', auth=self.auth)
        response.raise_for_status()
        return response.json()

    def get_nodes(self) -> List[Dict]:
        """Get all nodes"""
        response = requests.get(f'{self.base_url}/nodes', auth=self.auth)
        response.raise_for_status()
        return response.json()

    def get_queues(self, vhost='/') -> List[Dict]:
        """Get all queues in vhost"""
        vhost_encoded = vhost.replace('/', '%2F')
        response = requests.get(f'{self.base_url}/queues/{vhost_encoded}', auth=self.auth)
        response.raise_for_status()
        return response.json()

    def get_queue(self, queue_name: str, vhost='/') -> Dict:
        """Get specific queue details"""
        vhost_encoded = vhost.replace('/', '%2F')
        response = requests.get(
            f'{self.base_url}/queues/{vhost_encoded}/{queue_name}',
            auth=self.auth
        )
        response.raise_for_status()
        return response.json()

    def get_connections(self) -> List[Dict]:
        """Get all connections"""
        response = requests.get(f'{self.base_url}/connections', auth=self.auth)
        response.raise_for_status()
        return response.json()

    def get_channels(self) -> List[Dict]:
        """Get all channels"""
        response = requests.get(f'{self.base_url}/channels', auth=self.auth)
        response.raise_for_status()
        return response.json()

    def get_exchanges(self, vhost='/') -> List[Dict]:
        """Get all exchanges"""
        vhost_encoded = vhost.replace('/', '%2F')
        response = requests.get(f'{self.base_url}/exchanges/{vhost_encoded}', auth=self.auth)
        response.raise_for_status()
        return response.json()

    def purge_queue(self, queue_name: str, vhost='/') -> bool:
        """Purge all messages from queue"""
        vhost_encoded = vhost.replace('/', '%2F')
        response = requests.delete(
            f'{self.base_url}/queues/{vhost_encoded}/{queue_name}/contents',
            auth=self.auth
        )
        return response.status_code == 204

    def get_messages(self, queue_name: str, count=10, vhost='/') -> List[Dict]:
        """Get messages from queue (non-destructive)"""
        vhost_encoded = vhost.replace('/', '%2F')
        payload = {
            'count': count,
            'ackmode': 'ack_requeue_true',
            'encoding': 'auto'
        }
        response = requests.post(
            f'{self.base_url}/queues/{vhost_encoded}/{queue_name}/get',
            json=payload,
            auth=self.auth,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def health_check(self) -> Dict:
        """Check node health"""
        response = requests.get(f'{self.base_url}/health/checks/alarms', auth=self.auth)
        return {
            'status': 'healthy' if response.status_code == 200 else 'unhealthy',
            'status_code': response.status_code
        }

def print_cluster_status():
    """Print comprehensive cluster status"""
    api = RabbitMQManagementAPI()

    print("=" * 80)
    print("RabbitMQ Cluster Status Report")
    print("=" * 80)
    print()

    # Overview
    overview = api.get_overview()
    print(f"Cluster Name: {overview.get('cluster_name', 'N/A')}")
    print(f"RabbitMQ Version: {overview.get('rabbitmq_version', 'N/A')}")
    print(f"Erlang Version: {overview.get('erlang_version', 'N/A')}")
    print()

    # Message rates
    msg_stats = overview.get('message_stats', {})
    print("Message Rates (global):")
    print(f"  Publish rate: {msg_stats.get('publish_details', {}).get('rate', 0):.2f} msg/s")
    print(f"  Deliver rate: {msg_stats.get('deliver_get_details', {}).get('rate', 0):.2f} msg/s")
    print(f"  Ack rate: {msg_stats.get('ack_details', {}).get('rate', 0):.2f} msg/s")
    print()

    # Nodes
    nodes = api.get_nodes()
    print(f"Nodes ({len(nodes)}):")
    for node in nodes:
        status = "✓" if node.get('running') else "✗"
        mem_used = node.get('mem_used', 0) / (1024**3)
        mem_limit = node.get('mem_limit', 1) / (1024**3)
        mem_pct = (mem_used / mem_limit * 100) if mem_limit > 0 else 0

        print(f"  {status} {node['name']}")
        print(f"    Memory: {mem_used:.2f}GB / {mem_limit:.2f}GB ({mem_pct:.1f}%)")
        print(f"    Disk Free: {node.get('disk_free', 0) / (1024**3):.2f}GB")
        print(f"    Uptime: {node.get('uptime', 0) / 1000:.0f}s")
    print()

    # Queues
    queues = api.get_queues()
    print(f"Queues ({len(queues)}):")
    for queue in queues[:10]:  # Show first 10
        msgs = queue.get('messages', 0)
        consumers = queue.get('consumers', 0)
        ready = queue.get('messages_ready', 0)
        unacked = queue.get('messages_unacknowledged', 0)

        status = "⚠" if consumers == 0 and msgs > 0 else "✓"
        print(f"  {status} {queue['name']}")
        print(f"    Messages: {msgs} (Ready: {ready}, Unacked: {unacked})")
        print(f"    Consumers: {consumers}")
        print(f"    State: {queue.get('state', 'unknown')}")
    print()

    # Connections
    connections = api.get_connections()
    print(f"Connections: {len(connections)}")
    print(f"Channels: {len(api.get_channels())}")
    print()

    # Health check
    health = api.health_check()
    print(f"Health Status: {health['status']}")
    print()

if __name__ == '__main__':
    print_cluster_status()
```

### Step 9: Create Monitoring Dashboard Script

Create `monitoring_dashboard.py`:

```python
#!/usr/bin/env python3
import curses
import time
from management_api_client import RabbitMQManagementAPI

def draw_dashboard(stdscr, api):
    """Draw real-time monitoring dashboard"""
    curses.curs_set(0)  # Hide cursor
    stdscr.nodelay(1)   # Non-blocking input
    stdscr.timeout(1000)  # Refresh every second

    while True:
        stdscr.clear()
        height, width = stdscr.getmaxyx()

        # Title
        title = "RabbitMQ Real-Time Monitoring Dashboard"
        stdscr.addstr(0, (width - len(title)) // 2, title, curses.A_BOLD)

        try:
            # Get data
            overview = api.get_overview()
            queues = api.get_queues()
            connections = api.get_connections()
            nodes = api.get_nodes()

            # Overview
            row = 2
            stdscr.addstr(row, 2, "=" * (width - 4))
            row += 1
            stdscr.addstr(row, 2, "OVERVIEW", curses.A_BOLD)
            row += 1

            msg_stats = overview.get('message_stats', {})
            pub_rate = msg_stats.get('publish_details', {}).get('rate', 0)
            del_rate = msg_stats.get('deliver_get_details', {}).get('rate', 0)

            stdscr.addstr(row, 4, f"Publish Rate: {pub_rate:>10.2f} msg/s")
            stdscr.addstr(row, 40, f"Deliver Rate: {del_rate:>10.2f} msg/s")
            row += 1

            stdscr.addstr(row, 4, f"Connections:  {len(connections):>10}")
            stdscr.addstr(row, 40, f"Queues:       {len(queues):>10}")
            row += 2

            # Nodes
            stdscr.addstr(row, 2, "NODES", curses.A_BOLD)
            row += 1

            for node in nodes[:3]:
                status = "UP  " if node.get('running') else "DOWN"
                mem_used = node.get('mem_used', 0) / (1024**2)
                mem_limit = node.get('mem_limit', 1) / (1024**2)

                stdscr.addstr(row, 4, f"{status} {node['name'][:30]:<30} Mem: {mem_used:>8.0f}MB / {mem_limit:>8.0f}MB")
                row += 1
            row += 1

            # Queues
            stdscr.addstr(row, 2, "TOP QUEUES BY MESSAGE COUNT", curses.A_BOLD)
            row += 1

            sorted_queues = sorted(queues, key=lambda q: q.get('messages', 0), reverse=True)

            header = f"{'Name':<30} {'Messages':>10} {'Ready':>10} {'Unacked':>10} {'Consumers':>10}"
            stdscr.addstr(row, 4, header)
            row += 1

            for queue in sorted_queues[:10]:
                if row >= height - 2:
                    break

                name = queue['name'][:28]
                msgs = queue.get('messages', 0)
                ready = queue.get('messages_ready', 0)
                unacked = queue.get('messages_unacknowledged', 0)
                consumers = queue.get('consumers', 0)

                line = f"{name:<30} {msgs:>10} {ready:>10} {unacked:>10} {consumers:>10}"

                attr = curses.A_NORMAL
                if consumers == 0 and msgs > 0:
                    attr = curses.A_REVERSE  # Highlight queues with no consumers

                stdscr.addstr(row, 4, line, attr)
                row += 1

        except Exception as e:
            stdscr.addstr(height - 2, 2, f"Error: {str(e)}", curses.A_BOLD)

        # Footer
        stdscr.addstr(height - 1, 2, "Press 'q' to quit | Refreshing every 1s", curses.A_DIM)

        stdscr.refresh()

        # Check for quit
        key = stdscr.getch()
        if key == ord('q'):
            break

def main():
    api = RabbitMQManagementAPI()
    curses.wrapper(draw_dashboard, api)

if __name__ == '__main__':
    main()
```

### Step 10: Start Monitoring Stack

```bash
# Start all services
docker-compose up -d

# Wait for services to start
sleep 30

# Check services
docker-compose ps

# Access UIs
echo "RabbitMQ Management: http://localhost:15672"
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3000"
echo "Alertmanager: http://localhost:9093"
```

## Verification and Testing

### Access Monitoring UIs

1. **RabbitMQ Management UI**
   - URL: http://localhost:15672
   - Credentials: admin/password

2. **Prometheus**
   - URL: http://localhost:9090
   - Query: `rabbitmq_queue_messages_ready`

3. **Grafana**
   - URL: http://localhost:3000
   - Credentials: admin/admin
   - Navigate to Dashboards → RabbitMQ → RabbitMQ Overview

4. **Alertmanager**
   - URL: http://localhost:9093

### Test Alerts

Create `test_alerts.py`:

```python
#!/usr/bin/env python3
import pika
import time

# Create messages to trigger queue growing alert
credentials = pika.PlainCredentials('admin', 'password')
connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost', 5672, '/', credentials)
)
channel = connection.channel()

channel.queue_declare(queue='test_queue', durable=True)

print("Sending messages to trigger alerts...")
for i in range(10000):
    channel.basic_publish(
        exchange='',
        routing_key='test_queue',
        body=f'Message {i}',
        properties=pika.BasicProperties(delivery_mode=2)
    )

    if i % 1000 == 0:
        print(f"Sent {i} messages...")

connection.close()
print("Done! Check Alertmanager for alerts.")
```

## Key Metrics to Monitor

### 1. Queue Metrics
- `rabbitmq_queue_messages_ready` - Messages ready for delivery
- `rabbitmq_queue_messages_unacknowledged` - Unacked messages
- `rabbitmq_queue_consumers` - Consumer count
- `rabbitmq_queue_messages_published_total` - Total published
- `rabbitmq_queue_messages_acked_total` - Total acknowledged

### 2. Node Metrics
- `rabbitmq_process_resident_memory_bytes` - Memory usage
- `rabbitmq_disk_space_available_bytes` - Disk space
- `rabbitmq_process_open_fds` - File descriptors
- `up` - Node up/down status

### 3. Connection Metrics
- `rabbitmq_connections` - Active connections
- `rabbitmq_channels` - Active channels
- `rabbitmq_connection_channels_blocked` - Blocked channels

### 4. Message Rates
- `rate(rabbitmq_queue_messages_published_total[5m])` - Publish rate
- `rate(rabbitmq_queue_messages_acked_total[5m])` - Ack rate
- `rate(rabbitmq_queue_messages_delivered_total[5m])` - Delivery rate

## Troubleshooting

### Issue 1: Prometheus Not Scraping Metrics

**Solution:**
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check RabbitMQ exporter
curl http://localhost:9419/metrics

# View Prometheus logs
docker logs prometheus
```

### Issue 2: Grafana Dashboard Not Loading

**Solution:**
```bash
# Check Grafana datasource
curl -u admin:admin http://localhost:3000/api/datasources

# Check provisioning
docker exec grafana ls -la /etc/grafana/provisioning/datasources/

# Restart Grafana
docker-compose restart grafana
```

### Issue 3: Alerts Not Firing

**Solution:**
```bash
# Check alert rules in Prometheus
curl http://localhost:9090/api/v1/rules

# Check Alertmanager status
curl http://localhost:9093/api/v2/status

# View Alertmanager logs
docker logs alertmanager
```

## Best Practices

1. ✅ Monitor **queue depth** and set alerts
2. ✅ Track **consumer lag** continuously
3. ✅ Alert on **memory and disk** thresholds
4. ✅ Monitor **connection and channel counts**
5. ✅ Set up **multi-level alerting** (warning/critical)
6. ✅ Use **Grafana dashboards** for visualization
7. ✅ Retain metrics for **at least 30 days**
8. ✅ Test **alert rules** regularly

## Key Takeaways

1. ✅ Use **Prometheus** for metrics collection
2. ✅ Use **Grafana** for visualization
3. ✅ Set up **Alertmanager** for notifications
4. ✅ Monitor **queue depth, consumer lag, memory, disk**
5. ✅ Use **Management API** for automation
6. ✅ Create **custom dashboards** for your use case
7. ✅ Test **alerts** before production deployment

## Next Steps

1. Customize Grafana dashboards for your metrics
2. Configure Alertmanager for your notification channels
3. Set up log aggregation (ELK/Loki)
4. Explore **Tutorial 08: Kubernetes Deployment** for cloud deployments

## Additional Resources

- [RabbitMQ Monitoring Guide](https://www.rabbitmq.com/monitoring.html)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [RabbitMQ Management API](https://www.rabbitmq.com/management.html)

---

**Congratulations!** You've built a production-grade monitoring stack for RabbitMQ!
