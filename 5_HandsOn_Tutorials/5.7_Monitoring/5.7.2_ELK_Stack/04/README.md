# Tutorial 04: Beats - Lightweight Data Shippers

## Learning Objectives
- Install and configure Filebeat
- Use Metricbeat for system metrics
- Set up Heartbeat for uptime monitoring
- Configure Packetbeat for network analysis
- Integrate Beats with Elasticsearch and Logstash

## Beats Overview

```
Filebeat → Logs
Metricbeat → Metrics
Heartbeat → Uptime
Packetbeat → Network
Auditbeat → Audit data
Winlogbeat → Windows events
Functionbeat → Serverless
```

## Step 1: Filebeat Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    networks:
      - elk

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    networks:
      - elk
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    container_name: filebeat
    user: root
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./logs:/logs:ro
    command: filebeat -e -strict.perms=false
    networks:
      - elk
    depends_on:
      - elasticsearch

  metricbeat:
    image: docker.elastic.co/beats/metricbeat:8.11.0
    container_name: metricbeat
    user: root
    volumes:
      - ./metricbeat/metricbeat.yml:/usr/share/metricbeat/metricbeat.yml:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /sys/fs/cgroup:/hostfs/sys/fs/cgroup:ro
      - /proc:/hostfs/proc:ro
      - /:/hostfs:ro
    command: metricbeat -e -system.hostfs=/hostfs -strict.perms=false
    networks:
      - elk
    depends_on:
      - elasticsearch

  heartbeat:
    image: docker.elastic.co/beats/heartbeat:8.11.0
    container_name: heartbeat
    volumes:
      - ./heartbeat/heartbeat.yml:/usr/share/heartbeat/heartbeat.yml:ro
    command: heartbeat -e -strict.perms=false
    networks:
      - elk
    depends_on:
      - elasticsearch

networks:
  elk:
    driver: bridge
```

## Step 2: Filebeat Configuration

```yaml
# filebeat/filebeat.yml
filebeat.inputs:
  # Log files input
  - type: log
    enabled: true
    paths:
      - /logs/*.log
    fields:
      log_type: application
    fields_under_root: true
    multiline:
      pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
      negate: true
      match: after

  # Container logs
  - type: container
    enabled: true
    paths:
      - '/var/lib/docker/containers/*/*.log'
    processors:
      - add_docker_metadata:
          host: "unix:///var/run/docker.sock"

  # JSON logs
  - type: log
    enabled: true
    paths:
      - /logs/app-*.json
    json:
      keys_under_root: true
      add_error_key: true
      message_key: message

# Processors
processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_cloud_metadata: ~
  - add_docker_metadata: ~
  - add_kubernetes_metadata: ~

# Elasticsearch output
output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "filebeat-%{+yyyy.MM.dd}"

# Kibana configuration
setup.kibana:
  host: "kibana:5601"

# Enable index template
setup.template:
  name: "filebeat"
  pattern: "filebeat-*"
  enabled: true

# Load Kibana dashboards
setup.dashboards:
  enabled: true

# Logging
logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
```

## Step 3: Metricbeat Configuration

```yaml
# metricbeat/metricbeat.yml
metricbeat.config.modules:
  path: ${path.config}/modules.d/*.yml
  reload.enabled: false

metricbeat.modules:
  # System metrics
  - module: system
    period: 10s
    metricsets:
      - cpu
      - load
      - memory
      - network
      - process
      - process_summary
      - socket_summary
      - filesystem
      - fsstat
    process.include_top_n:
      by_cpu: 5
      by_memory: 5

  # Docker metrics
  - module: docker
    period: 10s
    hosts: ["unix:///var/run/docker.sock"]
    metricsets:
      - container
      - cpu
      - diskio
      - healthcheck
      - info
      - memory
      - network

  # Kubernetes metrics (if applicable)
  - module: kubernetes
    period: 10s
    host: ${NODE_NAME}
    hosts: ["https://${KUBERNETES_SERVICE_HOST}:${KUBERNETES_SERVICE_PORT}"]
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    ssl.certificate_authorities:
      - /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    metricsets:
      - node
      - system
      - pod
      - container
      - volume

# Processors
processors:
  - add_host_metadata: ~
  - add_cloud_metadata: ~
  - add_docker_metadata: ~

# Output
output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "metricbeat-%{+yyyy.MM.dd}"

# Kibana
setup.kibana:
  host: "kibana:5601"

# Dashboards
setup.dashboards:
  enabled: true

# Template
setup.template:
  name: "metricbeat"
  pattern: "metricbeat-*"
```

## Step 4: Heartbeat Configuration

```yaml
# heartbeat/heartbeat.yml
heartbeat.monitors:
  # HTTP monitoring
  - type: http
    id: api-health
    name: API Health Check
    urls: ["http://api:8080/health"]
    schedule: '@every 30s'
    timeout: 16s
    check.response:
      status: [200]
      body:
        - "healthy"

  # HTTPS with certificate check
  - type: http
    id: website-check
    name: Website Check
    urls: ["https://example.com"]
    schedule: '@every 1m'
    ssl:
      verification_mode: full
      supported_protocols: ["TLSv1.2", "TLSv1.3"]
    check.response:
      status: [200, 201]

  # TCP monitoring
  - type: tcp
    id: db-tcp
    name: Database TCP Check
    hosts: ["postgres:5432"]
    schedule: '@every 30s'

  # ICMP ping
  - type: icmp
    id: host-ping
    name: Host Ping
    hosts: ["8.8.8.8"]
    schedule: '@every 10s'

# Processors
processors:
  - add_observer_metadata:
      geo:
        name: us-west-2

# Output
output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "heartbeat-%{+yyyy.MM.dd}"

# Kibana
setup.kibana:
  host: "kibana:5601"

# Dashboards
setup.dashboards:
  enabled: true
```

## Step 5: Filebeat Modules

```bash
# List available modules
filebeat modules list

# Enable modules
filebeat modules enable nginx apache mysql system

# Configure module
# modules.d/nginx.yml
- module: nginx
  access:
    enabled: true
    var.paths: ["/var/log/nginx/access.log*"]
  error:
    enabled: true
    var.paths: ["/var/log/nginx/error.log*"]

# modules.d/system.yml
- module: system
  syslog:
    enabled: true
    var.paths: ["/var/log/syslog*"]
  auth:
    enabled: true
    var.paths: ["/var/log/auth.log*"]
```

## Step 6: Advanced Filebeat Processing

```yaml
filebeat.inputs:
  - type: log
    paths:
      - /logs/app.log
    processors:
      # Parse JSON
      - decode_json_fields:
          fields: ["message"]
          target: ""
          overwrite_keys: true

      # Extract fields
      - dissect:
          tokenizer: "%{timestamp} %{level} %{message}"
          field: "message"
          target_prefix: ""

      # Drop events
      - drop_event:
          when:
            equals:
              level: "DEBUG"

      # Add fields
      - add_fields:
          target: ''
          fields:
            environment: production
            team: platform

      # Rename fields
      - rename:
          fields:
            - from: "log_level"
              to: "level"

      # Convert types
      - convert:
          fields:
            - {from: "response_time", type: "float"}
            - {from: "status_code", type: "integer"}
```

## Step 7: Output to Logstash

```yaml
# filebeat.yml with Logstash output
output.logstash:
  hosts: ["logstash:5044"]
  loadbalance: true
  worker: 2
  compression_level: 3
  ssl:
    enabled: false
```

```ruby
# logstash/pipeline/beats.conf
input {
  beats {
    port => 5044
    ssl => false
  }
}

filter {
  # Process beat data
  if [agent][type] == "filebeat" {
    # Additional processing
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][beat]}-%{+YYYY.MM.dd}"
  }
}
```

## Step 8: Metricbeat System Dashboard Queries

```
# CPU Usage
system.cpu.user.pct + system.cpu.system.pct

# Memory Usage
system.memory.actual.used.bytes / system.memory.total * 100

# Disk I/O
system.diskio.read.bytes
system.diskio.write.bytes

# Network Traffic
system.network.in.bytes
system.network.out.bytes

# Load Average
system.load.1
system.load.5
system.load.15

# Top Processes by CPU
system.process.cpu.total.pct

# Top Processes by Memory
system.process.memory.rss.bytes
```

## Step 9: Kubernetes Deployment

```yaml
# filebeat-kubernetes.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: filebeat-config
  namespace: kube-system
data:
  filebeat.yml: |-
    filebeat.inputs:
    - type: container
      paths:
        - /var/log/containers/*.log
      processors:
      - add_kubernetes_metadata:
          host: ${NODE_NAME}
          matchers:
          - logs_path:
              logs_path: "/var/log/containers/"

    output.elasticsearch:
      hosts: ['${ELASTICSEARCH_HOST:elasticsearch}:${ELASTICSEARCH_PORT:9200}']
      index: "filebeat-%{+yyyy.MM.dd}"
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: filebeat
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: filebeat
  template:
    metadata:
      labels:
        app: filebeat
    spec:
      serviceAccountName: filebeat
      containers:
      - name: filebeat
        image: docker.elastic.co/beats/filebeat:8.11.0
        args: ["-c", "/etc/filebeat.yml", "-e"]
        env:
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        volumeMounts:
        - name: config
          mountPath: /etc/filebeat.yml
          subPath: filebeat.yml
        - name: data
          mountPath: /usr/share/filebeat/data
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
        - name: varlog
          mountPath: /var/log
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: filebeat-config
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
      - name: varlog
        hostPath:
          path: /var/log
      - name: data
        hostPath:
          path: /var/lib/filebeat-data
          type: DirectoryOrCreate
```

## Step 10: Performance Tuning

```yaml
# Filebeat performance settings
filebeat.inputs:
  - type: log
    paths: ["/var/log/*.log"]
    harvester_buffer_size: 16384  # Default 16KB
    max_bytes: 10485760  # Max 10MB per message
    close_inactive: 5m
    close_renamed: true
    close_removed: true
    clean_inactive: 72h
    scan_frequency: 10s

# Queue settings
queue.mem:
  events: 4096
  flush.min_events: 512
  flush.timeout: 1s

# Output workers
output.elasticsearch:
  workers: 2
  bulk_max_size: 50
  compression_level: 1
```

## Exercises

1. **Configure Filebeat**: Ship application logs to Elasticsearch
2. **Enable Modules**: Use nginx and system modules
3. **Metricbeat Setup**: Collect system and Docker metrics
4. **Heartbeat Monitoring**: Monitor HTTP endpoints
5. **Advanced Processors**: Parse and enrich log data

## Key Takeaways

- ✅ Beats are lightweight data shippers
- ✅ Filebeat for log collection
- ✅ Metricbeat for metrics
- ✅ Heartbeat for uptime monitoring
- ✅ Modules provide pre-configured inputs
- ✅ Processors enable data transformation

## Next Steps

Continue to **Tutorial 05: Log Parsing** to learn about:
- Advanced Grok patterns
- Dissect processor
- JSON parsing
- Data enrichment techniques

## Additional Resources

- [Filebeat Reference](https://www.elastic.co/guide/en/beats/filebeat/current/index.html)
- [Metricbeat Reference](https://www.elastic.co/guide/en/beats/metricbeat/current/index.html)
- [Heartbeat Reference](https://www.elastic.co/guide/en/beats/heartbeat/current/index.html)
- [Beats Processors](https://www.elastic.co/guide/en/beats/filebeat/current/filtering-and-enhancing-data.html)
