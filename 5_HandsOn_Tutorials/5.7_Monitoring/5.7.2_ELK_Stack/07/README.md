# Tutorial 07: Alerting - ElastAlert and Kibana Alerts

## Learning Objectives
- Configure ElastAlert for alerting
- Set up Kibana alerting
- Create alert rules
- Configure notification channels
- Implement alert throttling

## ElastAlert Setup

```yaml
# docker-compose.yml (add to existing ELK stack)
  elastalert:
    image: jertel/elastalert2:latest
    container_name: elastalert
    volumes:
      - ./elastalert/config.yaml:/opt/elastalert/config.yaml
      - ./elastalert/rules:/opt/elastalert/rules
    networks:
      - elk
    depends_on:
      - elasticsearch
```

```yaml
# elastalert/config.yaml
rules_folder: /opt/elastalert/rules
run_every:
  minutes: 1

buffer_time:
  minutes: 15

es_host: elasticsearch
es_port: 9200

writeback_index: elastalert_status
writeback_alias: elastalert_alerts

alert_time_limit:
  days: 2
```

## Alert Rule Types

### 1. Frequency - Count Threshold

```yaml
# rules/high_error_rate.yaml
name: High Error Rate
type: frequency
index: logs-*
num_events: 50
timeframe:
  minutes: 5

filter:
- term:
    level: "ERROR"

alert:
  - slack

slack_webhook_url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
slack_username_override: "ElastAlert"
slack_channel_override: "#alerts"
slack_emoji_override: ":warning:"
```

### 2. Spike - Sudden Increase

```yaml
# rules/traffic_spike.yaml
name: Traffic Spike Alert
type: spike
index: logs-*
threshold_ref: 2
threshold_cur: 2
spike_height: 3
spike_type: "both"
timeframe:
  minutes: 10

query_key: "service"

filter:
- range:
    status_code:
      gte: 200
      lt: 300

alert:
  - email

email:
  - "ops@example.com"
smtp_host: "smtp.gmail.com"
smtp_port: 587
smtp_ssl: true
from_addr: "alerts@example.com"
email_reply_to: "noreply@example.com"
```

### 3. Flatline - Absence of Events

```yaml
# rules/no_heartbeat.yaml
name: Service Heartbeat Missing
type: flatline
index: heartbeat-*
threshold: 1
timeframe:
  minutes: 5

filter:
- term:
    service: "critical-service"

alert:
  - pagerduty

pagerduty_service_key: "YOUR_PAGERDUTY_KEY"
pagerduty_client_name: "ElastAlert"
```

### 4. Any - Match Any Event

```yaml
# rules/critical_error.yaml
name: Critical Error Alert
type: any
index: logs-*

filter:
- query_string:
    query: 'level:CRITICAL OR (level:ERROR AND message:"database connection failed")'

alert:
  - slack
  - email

alert_subject: "CRITICAL: {}"
alert_subject_args:
  - message

alert_text: |
  Alert: {}
  Service: {}
  Time: {}
  Message: {}

alert_text_args:
  - rule_name
  - service
  - "@timestamp"
  - message
```

### 5. Cardinality - Unique Value Count

```yaml
# rules/too_many_users.yaml
name: Too Many Failed Logins
type: cardinality
index: logs-*
cardinality_field: "user_id"
timeframe:
  minutes: 10
max_cardinality: 100

filter:
- term:
    event_type: "login_failed"

alert:
  - slack
```

### 6. Metric Aggregation

```yaml
# rules/slow_responses.yaml
name: Slow Response Times
type: metric_aggregation
index: logs-*
metric_agg_key: "duration_ms"
metric_agg_type: "avg"
max_threshold: 5000
timeframe:
  minutes: 5

query_key: "endpoint"

filter:
- exists:
    field: "duration_ms"

alert:
  - slack

alert_text: |
  Endpoint {} has average response time of {} ms
alert_text_args:
  - endpoint
  - metric_duration_ms_avg
```

## Kibana Alerting

### Create Alert in Kibana

```json
{
  "name": "High CPU Usage",
  "tags": ["system", "performance"],
  "alertTypeId": ".index-threshold",
  "schedule": {
    "interval": "1m"
  },
  "params": {
    "index": ["metricbeat-*"],
    "timeField": "@timestamp",
    "aggType": "avg",
    "aggField": "system.cpu.user.pct",
    "groupBy": "all",
    "threshold": [0.8],
    "thresholdComparator": ">",
    "timeWindowSize": 5,
    "timeWindowUnit": "m"
  },
  "actions": [
    {
      "group": "threshold met",
      "id": "slack-connector",
      "params": {
        "message": "CPU usage is {{context.value}}%"
      }
    }
  ]
}
```

### Connectors

```json
// Slack Connector
POST /api/actions/connector
{
  "connector_type_id": ".slack",
  "name": "Slack Alerts",
  "config": {
    "webhookUrl": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
  }
}

// Email Connector
POST /api/actions/connector
{
  "connector_type_id": ".email",
  "name": "Email Alerts",
  "config": {
    "service": "gmail",
    "from": "alerts@example.com",
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false
  },
  "secrets": {
    "user": "alerts@example.com",
    "password": "app_password"
  }
}

// PagerDuty Connector
POST /api/actions/connector
{
  "connector_type_id": ".pagerduty",
  "name": "PagerDuty",
  "config": {
    "apiUrl": "https://events.pagerduty.com/v2/enqueue"
  },
  "secrets": {
    "routingKey": "YOUR_PAGERDUTY_INTEGRATION_KEY"
  }
}
```

## Advanced Alert Configurations

### Aggregation Query Alert

```yaml
# rules/revenue_drop.yaml
name: Revenue Drop Alert
type: metric_aggregation
index: orders-*
metric_agg_key: "amount"
metric_agg_type: "sum"
metric_agg_script: |
  return doc['amount'].value * doc['quantity'].value;
timeframe:
  hours: 1
buffer_time:
  hours: 1

# Compare to baseline
use_count_query: false
use_terms_query: false

# Alert if revenue drops below $10,000/hour
min_threshold: 10000

alert:
  - email
  - slack

alert_text: |
  Revenue Alert!
  Current hour revenue: ${}
  This is below threshold of $10,000
alert_text_args:
  - metric_amount_sum
```

### Percentage Match Alert

```yaml
# rules/error_percentage.yaml
name: High Error Percentage
type: percentage_match
index: logs-*
timeframe:
  minutes: 10

match_bucket_filter:
- term:
    status_code: 500

min_percentage: 10  # Alert if >10% are errors

alert:
  - slack
```

### Change Alert

```yaml
# rules/config_change.yaml
name: Configuration Changed
type: change
index: audit-*
query_key: "config_key"
compare_key: "config_value"
ignore_null: true
timeframe:
  minutes: 5

filter:
- term:
    event_type: "config_change"

alert:
  - slack

alert_text: |
  Configuration changed!
  Key: {}
  Old Value: {}
  New Value: {}
alert_text_args:
  - config_key
  - old_value
  - new_value
```

## Alert Throttling and Silencing

```yaml
# Exponential realert
realert:
  minutes: 5
exponential_realert:
  hours: 1

# Suppress alerts during maintenance
filter:
- bool:
    must_not:
    - term:
        maintenance_mode: true

# Limit alerts per timeframe
max_query_size: 10000
aggregation_key: "service"
realert:
  minutes: 30

# Summary alerts (group multiple)
aggregation:
  schedule: "*/30 * * * *"
  summary_table_fields:
    - service
    - level
    - count
```

## Alert Templates

```yaml
# rules/template_error_alert.yaml
name: Error Alert - {}
name_args:
  - service

alert_text: |
  Service: {{service}}
  Level: {{level}}
  Message: {{message}}
  Count: {{num_hits}}
  Time: {{@timestamp}}

  Query: {{query_string}}
  Match: {{match_body}}
```

## Webhook Integration

```yaml
# rules/webhook_alert.yaml
name: Webhook Alert
type: frequency
index: logs-*
num_events: 10
timeframe:
  minutes: 5

alert:
  - post

http_post_url: "https://api.example.com/alerts"
http_post_static_payload:
  alert_type: "elasticsearch"
http_post_all_values: true
http_post_headers:
  Authorization: "Bearer YOUR_TOKEN"
  Content-Type: "application/json"
```

## Custom Alert Scripts

```yaml
# rules/custom_script.yaml
name: Custom Alert Script
type: any
index: logs-*

alert:
  - command

command: ["/usr/local/bin/alert.sh", "--level", "critical"]

# alert.sh
#!/bin/bash
LEVEL=$2
MESSAGE=$(cat)
curl -X POST https://api.example.com/alert \
  -H "Content-Type: application/json" \
  -d "{\"level\":\"$LEVEL\",\"message\":\"$MESSAGE\"}"
```

## Monitoring ElastAlert

```bash
# Check status index
GET /elastalert_status/_search
{
  "sort": [{"@timestamp": "desc"}],
  "size": 10
}

# View recent alerts
GET /elastalert_alerts/_search
{
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-1h"
      }
    }
  }
}

# Check for errors
GET /elastalert_error/_search
```

## Testing Alerts

```bash
# Test rule syntax
elastalert-test-rule --config config.yaml --rule rules/high_error_rate.yaml

# Test with recent data
elastalert-test-rule --config config.yaml --rule rules/high_error_rate.yaml --days 2

# Show counts only
elastalert-test-rule --config config.yaml --rule rules/high_error_rate.yaml --counts-only
```

## Complete Example

```yaml
# rules/comprehensive_alert.yaml
name: Comprehensive Service Alert
type: frequency
index: logs-*
num_events: 100
timeframe:
  minutes: 10

filter:
- query_string:
    query: '(level:ERROR OR level:CRITICAL) AND service:api'

query_key: "endpoint"
realert:
  minutes: 30

include:
  - service
  - level
  - message
  - endpoint
  - "@timestamp"

top_count_keys:
  - endpoint
top_count_number: 5

alert:
  - slack
  - email

slack_webhook_url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
slack_username_override: "API Alerts"

email:
  - "oncall@example.com"

alert_subject: "API Alert: {} errors in {}"
alert_subject_args:
  - num_hits
  - timeframe

alert_text_type: alert_text_only
alert_text: |
  Alert: API Service Errors

  Count: {{num_hits}} errors in {{minutes}} minutes
  Service: {{service}}
  Top Endpoints:
  {% for endpoint in top_events_endpoint %}
  - {{endpoint.key}}: {{endpoint.doc_count}}
  {% endfor %}

  Recent Errors:
  {% for hit in hits %}
  [{{hit['@timestamp']}}] {{hit.level}} - {{hit.message}}
  {% endfor %}
```

## Key Takeaways

- ✅ ElastAlert provides flexible alerting
- ✅ Multiple alert types for different scenarios
- ✅ Kibana native alerting available
- ✅ Throttling prevents alert fatigue
- ✅ Multiple notification channels supported
- ✅ Test rules before production

## Next Steps

Continue to **Tutorial 08: Production ELK Stack** to learn about:
- Cluster setup and scaling
- Security and authentication
- High availability
- Performance optimization
- Production best practices

## Additional Resources

- [ElastAlert Documentation](https://elastalert2.readthedocs.io/)
- [Kibana Alerting](https://www.elastic.co/guide/en/kibana/current/alerting-getting-started.html)
- [Alert Rule Examples](https://github.com/jertel/elastalert2/tree/master/examples/rules)
