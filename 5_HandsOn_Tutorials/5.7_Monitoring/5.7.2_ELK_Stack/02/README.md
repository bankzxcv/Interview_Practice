# Tutorial 02: Logstash - Pipelines and Log Processing

## Learning Objectives
- Understand Logstash pipeline architecture
- Configure input, filter, and output plugins
- Parse logs with Grok patterns
- Transform and enrich data
- Handle multiple pipelines

## Logstash Architecture

```
Input → Filter → Output
  ↓       ↓        ↓
File   Grok    Elasticsearch
Beats  JSON    Kafka
HTTP   Mutate  File
TCP    GeoIP   S3
```

## Step 1: Basic Logstash Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    networks:
      - elk

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config:/usr/share/logstash/config
      - ./logs:/logs
    ports:
      - "5000:5000/tcp"
      - "5000:5000/udp"
      - "9600:9600"
    environment:
      - "LS_JAVA_OPTS=-Xms256m -Xmx256m"
    networks:
      - elk
    depends_on:
      - elasticsearch

networks:
  elk:
    driver: bridge
```

## Step 2: Simple Pipeline Configuration

```ruby
# logstash/pipeline/simple.conf
input {
  # Read from stdin
  stdin {
    codec => json
  }
}

filter {
  # Add timestamp if not present
  if ![timestamp] {
    mutate {
      add_field => { "timestamp" => "%{@timestamp}" }
    }
  }
}

output {
  # Output to Elasticsearch
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{+YYYY.MM.dd}"
  }

  # Also output to stdout for debugging
  stdout {
    codec => rubydebug
  }
}
```

## Step 3: File Input Pipeline

```ruby
# logstash/pipeline/file-input.conf
input {
  file {
    path => "/logs/application.log"
    start_position => "beginning"
    sincedb_path => "/dev/null"  # Reread from start each time
    codec => multiline {
      pattern => "^%{TIMESTAMP_ISO8601}"
      negate => true
      what => "previous"
    }
  }
}

filter {
  grok {
    match => {
      "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}"
    }
  }

  date {
    match => ["timestamp", "ISO8601"]
    target => "@timestamp"
  }

  mutate {
    remove_field => ["timestamp"]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
}
```

## Step 4: Grok Patterns for Common Logs

### Apache Access Logs

```ruby
# logstash/pipeline/apache.conf
input {
  file {
    path => "/logs/apache/access.log"
    start_position => "beginning"
  }
}

filter {
  grok {
    match => {
      "message" => "%{COMBINEDAPACHELOG}"
    }
  }

  # Parse user agent
  useragent {
    source => "agent"
    target => "user_agent"
  }

  # Add GeoIP information
  geoip {
    source => "clientip"
    target => "geoip"
  }

  # Convert fields to proper types
  mutate {
    convert => {
      "response" => "integer"
      "bytes" => "integer"
    }
  }

  date {
    match => ["timestamp", "dd/MMM/yyyy:HH:mm:ss Z"]
    target => "@timestamp"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "apache-logs-%{+YYYY.MM.dd}"
  }
}
```

### Application Logs (JSON)

```ruby
# logstash/pipeline/json-app.conf
input {
  tcp {
    port => 5000
    codec => json_lines
  }
}

filter {
  # Parse JSON automatically
  json {
    source => "message"
  }

  # Add calculated fields
  if [duration_ms] {
    ruby {
      code => "event.set('duration_seconds', event.get('duration_ms') / 1000.0)"
    }
  }

  # Classify response codes
  if [status_code] {
    if [status_code] >= 500 {
      mutate { add_field => { "severity" => "error" } }
    } else if [status_code] >= 400 {
      mutate { add_field => { "severity" => "warning" } }
    } else {
      mutate { add_field => { "severity" => "info" } }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "app-%{+YYYY.MM.dd}"
  }
}
```

### Nginx Access Logs

```ruby
# logstash/pipeline/nginx.conf
input {
  file {
    path => "/logs/nginx/access.log"
    start_position => "beginning"
  }
}

filter {
  grok {
    match => {
      "message" => "%{IPORHOST:clientip} - %{USER:user} \[%{HTTPDATE:timestamp}\] \"%{WORD:method} %{URIPATHPARAM:request} HTTP/%{NUMBER:httpversion}\" %{NUMBER:response:int} %{NUMBER:bytes:int} \"%{DATA:referrer}\" \"%{DATA:agent}\" \"%{DATA:x_forwarded_for}\""
    }
  }

  date {
    match => ["timestamp", "dd/MMM/yyyy:HH:mm:ss Z"]
  }

  useragent {
    source => "agent"
  }

  geoip {
    source => "clientip"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "nginx-%{+YYYY.MM.dd}"
  }
}
```

### Syslog

```ruby
# logstash/pipeline/syslog.conf
input {
  udp {
    port => 514
    type => "syslog"
  }

  tcp {
    port => 514
    type => "syslog"
  }
}

filter {
  if [type] == "syslog" {
    grok {
      match => {
        "message" => "%{SYSLOGLINE}"
      }
    }

    date {
      match => ["timestamp", "MMM  d HH:mm:ss", "MMM dd HH:mm:ss"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "syslog-%{+YYYY.MM.dd}"
  }
}
```

## Step 5: Custom Grok Patterns

```ruby
# logstash/patterns/custom
# Define custom patterns
USERNAME [a-zA-Z0-9._-]+
EMAIL %{USERNAME}@%{HOSTNAME}
CUSTOM_TIMESTAMP %{YEAR}-%{MONTHNUM}-%{MONTHDAY} %{TIME}

# Use in pipeline
filter {
  grok {
    patterns_dir => ["/usr/share/logstash/patterns"]
    match => {
      "message" => "%{CUSTOM_TIMESTAMP:timestamp} \[%{LOGLEVEL:level}\] %{EMAIL:user} %{GREEDYDATA:msg}"
    }
  }
}
```

## Step 6: Advanced Filters

### Conditionals

```ruby
filter {
  if [level] == "ERROR" {
    mutate {
      add_tag => ["error"]
      add_field => { "alert" => "true" }
    }
  } else if [level] == "WARN" {
    mutate {
      add_tag => ["warning"]
    }
  }

  if [service] == "payment" {
    mutate {
      add_field => { "team" => "payments" }
    }
  }

  # Drop debug logs in production
  if [level] == "DEBUG" and [environment] == "production" {
    drop {}
  }
}
```

### Data Enrichment

```ruby
filter {
  # Add static fields
  mutate {
    add_field => {
      "environment" => "production"
      "region" => "us-west-2"
    }
  }

  # Lookup from dictionary
  translate {
    field => "service_id"
    destination => "service_name"
    dictionary => {
      "1" => "api"
      "2" => "web"
      "3" => "worker"
    }
  }

  # Elasticsearch filter for enrichment
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "users"
    query => "user_id:%{user_id}"
    fields => {
      "email" => "user_email"
      "name" => "user_name"
    }
  }
}
```

### Field Manipulation

```ruby
filter {
  mutate {
    # Rename fields
    rename => {
      "oldfield" => "newfield"
    }

    # Remove fields
    remove_field => ["unwanted", "also_unwanted"]

    # Convert types
    convert => {
      "duration" => "integer"
      "price" => "float"
      "active" => "boolean"
    }

    # Split strings
    split => {
      "tags" => ","
    }

    # Join arrays
    join => {
      "tags" => ","
    }

    # Replace values
    gsub => [
      "message", "/", "_"
    ]

    # Lowercase/Uppercase
    lowercase => ["user"]
    uppercase => ["level"]
  }
}
```

## Step 7: Multiple Pipelines

```yaml
# logstash/config/pipelines.yml
- pipeline.id: apache
  path.config: "/usr/share/logstash/pipeline/apache.conf"
  pipeline.workers: 2

- pipeline.id: application
  path.config: "/usr/share/logstash/pipeline/app.conf"
  pipeline.workers: 4

- pipeline.id: metrics
  path.config: "/usr/share/logstash/pipeline/metrics.conf"
  pipeline.workers: 1
```

## Step 8: Output to Multiple Destinations

```ruby
output {
  # All logs to Elasticsearch
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{+YYYY.MM.dd}"
  }

  # Errors to separate index
  if [level] == "ERROR" {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "errors-%{+YYYY.MM.dd}"
    }
  }

  # Critical alerts to Kafka
  if [severity] == "critical" {
    kafka {
      bootstrap_servers => "kafka:9092"
      topic_id => "critical-alerts"
    }
  }

  # Backup to S3
  s3 {
    region => "us-west-2"
    bucket => "logs-backup"
    size_file => 2048
    time_file => 5
  }

  # Debug output
  if [debug] {
    stdout {
      codec => rubydebug
    }
  }
}
```

## Step 9: Performance Tuning

```yaml
# logstash/config/logstash.yml
pipeline.workers: 4
pipeline.batch.size: 125
pipeline.batch.delay: 50

# JVM settings
# logstash/config/jvm.options
-Xms1g
-Xmx1g

# Pipeline config
filter {
  metrics {
    meter => "events"
    add_tag => "metric"
    flush_interval => 30
  }
}
```

## Step 10: Sample Application Log Generator

```python
# log_generator.py
import json
import socket
import time
import random
from datetime import datetime

def send_log(message):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(('localhost', 5000))
    sock.send((json.dumps(message) + '\n').encode())
    sock.close()

services = ['api', 'web', 'worker', 'db']
levels = ['INFO', 'WARN', 'ERROR']
users = [f'user{i}' for i in range(1, 101)]

while True:
    log = {
        'timestamp': datetime.utcnow().isoformat(),
        'level': random.choice(levels),
        'service': random.choice(services),
        'user_id': random.choice(users),
        'message': f'Request processed',
        'duration_ms': random.randint(10, 5000),
        'status_code': random.choice([200, 200, 200, 400, 500])
    }

    send_log(log)
    print(f"Sent: {log}")
    time.sleep(1)
```

## Exercises

1. **Parse Custom Format**: Write Grok pattern for your app logs
2. **Multi-Input**: Combine file and TCP inputs
3. **Enrich Data**: Add GeoIP and user agent parsing
4. **Conditional Routing**: Route to different indices by severity
5. **Performance Test**: Process 10,000+ events/second

## Common Grok Patterns

```
%{TIMESTAMP_ISO8601} - ISO timestamp
%{LOGLEVEL} - Log level (INFO, ERROR, etc.)
%{IP} - IP address
%{HOSTNAME} - Hostname
%{USERNAME} - Username
%{NUMBER} - Number
%{WORD} - Single word
%{GREEDYDATA} - Everything
%{QUOTEDSTRING} - Quoted string
```

## Key Takeaways

- ✅ Logstash processes data in Input → Filter → Output pipeline
- ✅ Grok patterns parse unstructured logs
- ✅ Filters transform and enrich data
- ✅ Multiple outputs for routing
- ✅ Use conditionals for complex logic
- ✅ Monitor pipeline performance

## Next Steps

Continue to **Tutorial 03: Kibana** to learn about:
- Kibana installation and setup
- Creating visualizations
- Building dashboards
- Discover interface for log exploration

## Additional Resources

- [Logstash Reference](https://www.elastic.co/guide/en/logstash/current/index.html)
- [Grok Patterns](https://github.com/logstash-plugins/logstash-patterns-core/tree/main/patterns)
- [Filter Plugins](https://www.elastic.co/guide/en/logstash/current/filter-plugins.html)
- [Logstash Performance](https://www.elastic.co/guide/en/logstash/current/performance-tuning.html)
