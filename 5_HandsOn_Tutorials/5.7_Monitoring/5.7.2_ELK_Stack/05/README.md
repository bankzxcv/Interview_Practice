# Tutorial 05: Log Parsing - Grok Patterns and Data Enrichment

## Learning Objectives
- Master Grok pattern syntax
- Use Dissect for structured parsing
- Parse JSON and CSV logs
- Enrich data with GeoIP and user agents
- Handle multiline logs

## Grok Pattern Basics

Syntax: `%{PATTERN:field_name}`

```ruby
# Basic pattern
%{WORD:log_level}

# With data type
%{NUMBER:response_time:float}

# Optional field
(?:%{IP:client_ip})?

# Custom pattern
(?<duration>[0-9]+)ms
```

## Common Log Formats

### Apache Combined Log

```
127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08"
```

```ruby
filter {
  grok {
    match => {
      "message" => "%{COMBINEDAPACHELOG}"
    }
  }
}
```

### Custom Application Log

```
2024-01-15 10:30:45.123 [INFO] user123 GET /api/users 200 45ms
```

```ruby
filter {
  grok {
    match => {
      "message" => "%{TIMESTAMP_ISO8601:timestamp} \[%{LOGLEVEL:level}\] %{USERNAME:user} %{WORD:method} %{URIPATH:endpoint} %{NUMBER:status_code:int} %{NUMBER:duration:int}ms"
    }
  }
}
```

### JSON Logs

```json
{"timestamp":"2024-01-15T10:30:45Z","level":"ERROR","service":"api","message":"Connection timeout"}
```

```ruby
filter {
  json {
    source => "message"
    target => "parsed"
  }

  mutate {
    copy => {
      "[parsed][timestamp]" => "timestamp"
      "[parsed][level]" => "level"
    }
    remove_field => ["parsed"]
  }
}
```

### Multiline Logs (Stack Traces)

```ruby
input {
  file {
    path => "/logs/app.log"
    codec => multiline {
      pattern => "^%{TIMESTAMP_ISO8601}"
      negate => true
      what => "previous"
      max_lines => 500
    }
  }
}

filter {
  grok {
    match => {
      "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{JAVACLASS:class} - %{GREEDYDATA:log_message}"
    }
  }
}
```

## Dissect vs Grok

### Dissect (Faster, No Regex)

```ruby
filter {
  dissect {
    mapping => {
      "message" => "%{timestamp} [%{level}] %{user} %{method} %{endpoint} %{status_code} %{duration}ms"
    }
  }

  mutate {
    convert => {
      "status_code" => "integer"
      "duration" => "integer"
    }
  }
}
```

### When to Use Each

- **Dissect**: Fixed structure, known delimiter, performance critical
- **Grok**: Variable structure, need pattern matching, complex formats

## GeoIP Enrichment

```ruby
filter {
  grok {
    match => {
      "message" => "%{COMBINEDAPACHELOG}"
    }
  }

  geoip {
    source => "clientip"
    target => "geoip"
    database => "/usr/share/GeoIP/GeoLite2-City.mmdb"
    fields => ["city_name", "country_name", "latitude", "longitude", "location"]
  }
}

# Query in Kibana
GET /logs/_search
{
  "query": {
    "geo_distance": {
      "distance": "200km",
      "geoip.location": {
        "lat": 40.7128,
        "lon": -74.0060
      }
    }
  }
}
```

## User Agent Parsing

```ruby
filter {
  useragent {
    source => "agent"
    target => "user_agent"
  }
}

# Result
{
  "user_agent": {
    "name": "Chrome",
    "os": "Mac OS X 10.15.7",
    "device": "Mac",
    "major": "91",
    "minor": "0",
    "patch": "4472"
  }
}
```

## Custom Patterns

```ruby
# patterns/custom
EMAIL %{USERNAME}@%{HOSTNAME}
PHONE (?:\+?1[-.●]?)?\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})
CREDIT_CARD \d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}

# Use in filter
filter {
  grok {
    patterns_dir => ["/etc/logstash/patterns"]
    match => {
      "message" => "User %{EMAIL:email} called from %{PHONE:phone}"
    }
  }
}
```

## Data Type Conversion

```ruby
filter {
  mutate {
    convert => {
      "status_code" => "integer"
      "response_time" => "float"
      "is_error" => "boolean"
      "timestamp_unix" => "integer"
    }
  }
}
```

## Field Manipulation

```ruby
filter {
  mutate {
    # Rename fields
    rename => {
      "old_name" => "new_name"
    }

    # Add fields
    add_field => {
      "environment" => "production"
      "[@metadata][index_prefix]" => "logs"
    }

    # Remove fields
    remove_field => ["temp_field", "unwanted_data"]

    # Copy fields
    copy => {
      "message" => "original_message"
    }

    # Replace values
    gsub => [
      "message", "/", "_",
      "path", "\\", "/"
    ]

    # Split string to array
    split => {
      "tags" => ","
    }

    # Join array to string
    join => {
      "tags" => ", "
    }

    # Strip whitespace
    strip => ["message", "user"]

    # Merge hashes
    merge => {
      "metadata" => "additional_metadata"
    }
  }
}
```

## Date Parsing

```ruby
filter {
  date {
    match => [
      "timestamp",
      "ISO8601",
      "yyyy-MM-dd HH:mm:ss",
      "dd/MMM/yyyy:HH:mm:ss Z",
      "UNIX",
      "UNIX_MS"
    ]
    target => "@timestamp"
    timezone => "UTC"
  }
}
```

## Conditional Processing

```ruby
filter {
  if [type] == "apache" {
    grok {
      match => { "message" => "%{COMBINEDAPACHELOG}" }
    }
  } else if [type] == "nginx" {
    grok {
      match => { "message" => "%{NGINXACCESS}" }
    }
  }

  if [status_code] >= 500 {
    mutate {
      add_tag => ["error"]
      add_field => { "severity" => "critical" }
    }
  } else if [status_code] >= 400 {
    mutate {
      add_tag => ["warning"]
      add_field => { "severity" => "warning" }
    }
  }

  if [level] == "DEBUG" and [environment] == "production" {
    drop {}
  }
}
```

## Ruby Filter for Complex Logic

```ruby
filter {
  ruby {
    code => '
      duration = event.get("duration_ms")
      if duration
        if duration > 5000
          event.set("performance_tier", "slow")
        elsif duration > 1000
          event.set("performance_tier", "medium")
        else
          event.set("performance_tier", "fast")
        end
      end
    '
  }
}
```

## Elasticsearch Filter for Enrichment

```ruby
filter {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "users"
    query => "user_id:%{user_id}"
    fields => {
      "email" => "user_email"
      "name" => "user_name"
      "tier" => "account_tier"
    }
  }
}
```

## Complete Example: E-commerce Logs

```ruby
# Sample log:
# 2024-01-15T10:30:45Z api.example.com 192.168.1.100 user@example.com POST /api/orders 201 124ms order_123 49.99 USD

filter {
  # Parse log line
  grok {
    match => {
      "message" => "%{TIMESTAMP_ISO8601:timestamp} %{HOSTNAME:host} %{IP:client_ip} %{EMAIL:user_email} %{WORD:method} %{URIPATH:endpoint} %{NUMBER:status_code:int} %{NUMBER:duration:int}ms %{WORD:order_id} %{NUMBER:amount:float} %{WORD:currency}"
    }
  }

  # Parse timestamp
  date {
    match => ["timestamp", "ISO8601"]
    target => "@timestamp"
  }

  # Add GeoIP
  geoip {
    source => "client_ip"
    target => "geo"
  }

  # Categorize status
  if [status_code] >= 200 and [status_code] < 300 {
    mutate { add_field => { "status_category" => "success" } }
  } else if [status_code] >= 400 {
    mutate { add_field => { "status_category" => "error" } }
  }

  # Performance tier
  if [duration] > 1000 {
    mutate { add_field => { "slow_request" => "true" } }
  }

  # Extract user domain
  mutate {
    add_field => {
      "user_domain" => "%{user_email}"
    }
    gsub => [
      "user_domain", "^.*@", ""
    ]
  }

  # Add business logic
  if [endpoint] =~ /^\/api\/orders/ {
    mutate {
      add_field => { "business_function" => "checkout" }
      add_tag => ["revenue"]
    }
  }

  # Cleanup
  mutate {
    remove_field => ["timestamp", "message"]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "ecommerce-%{+YYYY.MM.dd}"
  }
}
```

## Performance Tips

1. **Use Dissect when possible** - 3-5x faster than Grok
2. **Limit patterns** - Specific patterns faster than generic
3. **Use conditionals** - Skip unnecessary processing
4. **Drop early** - Drop unwanted logs ASAP
5. **Batch size** - Increase `pipeline.batch.size`
6. **Workers** - Match `pipeline.workers` to CPU cores

## Testing Grok Patterns

```bash
# Test pattern in Kibana Dev Tools
POST _logstash/pipeline/_simulate
{
  "pipeline": {
    "description": "test",
    "processors": [
      {
        "grok": {
          "field": "message",
          "patterns": ["%{COMBINEDAPACHELOG}"]
        }
      }
    ]
  },
  "docs": [
    {
      "_source": {
        "message": "127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] \"GET /apache_pb.gif HTTP/1.0\" 200 2326"
      }
    }
  ]
}

# Or use Grok Debugger in Kibana
# Dev Tools → Grok Debugger
```

## Exercises

1. **Parse Custom Format**: Create Grok pattern for your application logs
2. **GeoIP Mapping**: Add geo-location to access logs
3. **Conditional Processing**: Route different log types
4. **Data Enrichment**: Look up user data from Elasticsearch
5. **Performance Test**: Compare Dissect vs Grok speed

## Key Takeaways

- ✅ Grok for pattern matching, Dissect for speed
- ✅ GeoIP and User-agent for enrichment
- ✅ Date filter for timestamp normalization
- ✅ Conditionals for complex routing
- ✅ Test patterns before production
- ✅ Optimize for performance

## Next Steps

Continue to **Tutorial 06: Index Management** to learn about:
- Index lifecycle management (ILM)
- Index templates
- Retention policies
- Performance optimization

## Additional Resources

- [Grok Patterns](https://github.com/logstash-plugins/logstash-patterns-core)
- [Grok Debugger](https://www.elastic.co/guide/en/kibana/current/xpack-grokdebugger.html)
- [Dissect Filter](https://www.elastic.co/guide/en/logstash/current/plugins-filters-dissect.html)
- [Date Filter](https://www.elastic.co/guide/en/logstash/current/plugins-filters-date.html)
