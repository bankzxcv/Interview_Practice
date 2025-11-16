# Tutorial 05: Alerting Rules - Alertmanager and Notifications

## Learning Objectives
- Create alert rules
- Configure Alertmanager
- Set up notification channels (Slack, email, PagerDuty)
- Implement alert routing and grouping
- Manage alert lifecycle

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Prometheus  │────>│ Alertmanager │────>│ Slack/Email  │
│ (evaluates)  │     │  (routes)    │     │ PagerDuty    │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Step 1: Create Alert Rules

```yaml
# rules/alert-rules.yml
groups:
  - name: instance_alerts
    interval: 30s
    rules:
      # High CPU usage
      - alert: HighCPUUsage
        expr: instance:cpu_usage:rate5m > 80
        for: 5m
        labels:
          severity: warning
          component: system
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}% on {{ $labels.instance }}"

      # Critical CPU usage
      - alert: CriticalCPUUsage
        expr: instance:cpu_usage:rate5m > 95
        for: 2m
        labels:
          severity: critical
          component: system
        annotations:
          summary: "CRITICAL: CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}% on {{ $labels.instance }}"
          runbook: "https://wiki.company.com/runbooks/high-cpu"

      # High memory usage
      - alert: HighMemoryUsage
        expr: instance:memory_usage:percentage > 85
        for: 5m
        labels:
          severity: warning
          component: system
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value }}%"

      # Disk space low
      - alert: DiskSpaceLow
        expr: instance:disk_usage:percentage > 80
        for: 10m
        labels:
          severity: warning
          component: storage
        annotations:
          summary: "Disk space low on {{ $labels.instance }}"
          description: "Disk usage is {{ $value }}%"

      # Disk space critical
      - alert: DiskSpaceCritical
        expr: instance:disk_usage:percentage > 90
        for: 5m
        labels:
          severity: critical
          component: storage
        annotations:
          summary: "CRITICAL: Disk space on {{ $labels.instance }}"
          description: "Only {{ 100 - $value }}% space remaining"

  - name: application_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: job:http_errors:rate5m > 5
        for: 5m
        labels:
          severity: warning
          component: application
        annotations:
          summary: "High error rate for {{ $labels.job }}"
          description: "Error rate is {{ $value }}%"

      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
          component: availability
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.instance }} has been down for more than 1 minute"
          runbook: "https://wiki.company.com/runbooks/service-down"

      # High latency
      - alert: HighLatency
        expr: job:http_latency:p95 > 1
        for: 5m
        labels:
          severity: warning
          component: performance
        annotations:
          summary: "High latency for {{ $labels.job }}"
          description: "P95 latency is {{ $value }}s"

      # Critical latency
      - alert: CriticalLatency
        expr: job:http_latency:p95 > 5
        for: 2m
        labels:
          severity: critical
          component: performance
        annotations:
          summary: "CRITICAL latency for {{ $labels.job }}"
          description: "P95 latency is {{ $value }}s"

  - name: database_alerts
    interval: 30s
    rules:
      # Too many database connections
      - alert: HighDatabaseConnections
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
          component: database
        annotations:
          summary: "High database connections"
          description: "{{ $value }} active connections"

      # Database replication lag
      - alert: DatabaseReplicationLag
        expr: pg_replication_lag > 60
        for: 5m
        labels:
          severity: warning
          component: database
        annotations:
          summary: "Database replication lag"
          description: "Replication lag is {{ $value }} seconds"

      # Low cache hit ratio
      - alert: LowCacheHitRatio
        expr: |
          sum(pg_stat_database_blks_hit) /
          (sum(pg_stat_database_blks_hit) + sum(pg_stat_database_blks_read))
          < 0.9
        for: 10m
        labels:
          severity: warning
          component: database
        annotations:
          summary: "Low database cache hit ratio"
          description: "Cache hit ratio is {{ $value }}"

  - name: slo_alerts
    interval: 1m
    rules:
      # SLO: 99.9% availability
      - alert: SLOAvailabilityBreach
        expr: sli:availability:ratio < 0.999
        for: 5m
        labels:
          severity: critical
          component: slo
          slo: availability
        annotations:
          summary: "SLO breach: Availability"
          description: "Availability is {{ $value }}, SLO is 99.9%"

      # Error budget burn rate
      - alert: HighErrorBudgetBurnRate
        expr: sli:error_budget:burn_rate > 10
        for: 5m
        labels:
          severity: warning
          component: slo
        annotations:
          summary: "High error budget burn rate"
          description: "Consuming error budget {{ $value }}x faster than allowed"

      # Latency SLO breach
      - alert: SLOLatencyBreach
        expr: sli:latency:good_ratio < 0.95
        for: 5m
        labels:
          severity: warning
          component: slo
          slo: latency
        annotations:
          summary: "SLO breach: Latency"
          description: "Only {{ $value }}% requests under 500ms"

  - name: business_alerts
    interval: 1m
    rules:
      # Low conversion rate
      - alert: LowConversionRate
        expr: business:conversion:rate < 2
        for: 30m
        labels:
          severity: warning
          component: business
        annotations:
          summary: "Low conversion rate"
          description: "Conversion rate is {{ $value }}%"

      # Revenue drop
      - alert: RevenueDrop
        expr: |
          (business:revenue:rate5m -
           business:revenue:rate5m offset 1d) /
          business:revenue:rate5m offset 1d * 100 < -20
        for: 15m
        labels:
          severity: critical
          component: business
        annotations:
          summary: "Significant revenue drop"
          description: "Revenue down {{ $value }}% vs yesterday"

  - name: prometheus_alerts
    interval: 30s
    rules:
      # Prometheus scrape failures
      - alert: PrometheusScrapeFailing
        expr: up == 0
        for: 5m
        labels:
          severity: warning
          component: monitoring
        annotations:
          summary: "Prometheus scrape failing"
          description: "Prometheus failed to scrape {{ $labels.job }}"

      # Prometheus rule evaluation failures
      - alert: PrometheusRuleEvaluationFailures
        expr: increase(prometheus_rule_evaluation_failures_total[5m]) > 0
        for: 5m
        labels:
          severity: warning
          component: monitoring
        annotations:
          summary: "Prometheus rule evaluation failures"
          description: "{{ $value }} rule evaluation failures"

      # Prometheus TSDB compaction failures
      - alert: PrometheusTSDBCompactionsFailing
        expr: increase(prometheus_tsdb_compactions_failed_total[5m]) > 0
        for: 5m
        labels:
          severity: warning
          component: monitoring
        annotations:
          summary: "Prometheus TSDB compactions failing"
```

## Step 2: Alertmanager Configuration

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

# Templates for notifications
templates:
  - '/etc/alertmanager/templates/*.tmpl'

# Route alerts to different receivers
route:
  # Default receiver
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h

  # Child routes
  routes:
    # Critical alerts go to PagerDuty
    - match:
        severity: critical
      receiver: 'pagerduty'
      group_wait: 10s
      repeat_interval: 1h

    # Warning alerts go to Slack
    - match:
        severity: warning
      receiver: 'slack-warnings'
      group_wait: 30s
      repeat_interval: 4h

    # Database alerts
    - match:
        component: database
      receiver: 'database-team'
      group_by: ['alertname', 'database']

    # Business alerts
    - match:
        component: business
      receiver: 'business-team'
      group_wait: 5m

    # SLO alerts (high priority)
    - match:
        component: slo
      receiver: 'sre-team'
      repeat_interval: 30m

# Inhibition rules (suppress alerts)
inhibit_rules:
  # Suppress warning if critical is firing
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']

  # Suppress all alerts if service is down
  - source_match:
      alertname: 'ServiceDown'
    target_match_re:
      severity: '.*'
    equal: ['instance']

# Notification receivers
receivers:
  - name: 'default'
    email_configs:
      - to: 'team@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alertmanager@example.com'
        auth_password: 'password'
        headers:
          Subject: '{{ .GroupLabels.alertname }}'

  - name: 'slack-warnings'
    slack_configs:
      - channel: '#alerts-warning'
        title: '{{ .GroupLabels.alertname }}'
        text: >-
          {{ range .Alerts }}
            *Alert:* {{ .Annotations.summary }}
            *Description:* {{ .Annotations.description }}
            *Severity:* {{ .Labels.severity }}
          {{ end }}
        send_resolved: true

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
        description: '{{ .GroupLabels.alertname }}'
        details:
          firing: '{{ .Alerts.Firing | len }}'
          resolved: '{{ .Alerts.Resolved | len }}'

  - name: 'database-team'
    slack_configs:
      - channel: '#database-alerts'
        title: 'Database Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: 'business-team'
    slack_configs:
      - channel: '#business-alerts'
        title: 'Business Metrics Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: 'sre-team'
    slack_configs:
      - channel: '#sre-oncall'
        title: 'SLO Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    pagerduty_configs:
      - service_key: 'SRE_PAGERDUTY_KEY'
```

## Step 3: Alert Templates

```gotmpl
# templates/slack.tmpl
{{ define "slack.default.title" }}
[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .GroupLabels.alertname }}
{{ end }}

{{ define "slack.default.text" }}
{{ range .Alerts }}
*Alert:* {{ .Labels.alertname }}
*Severity:* {{ .Labels.severity }}
*Summary:* {{ .Annotations.summary }}
*Description:* {{ .Annotations.description }}
{{ if .Annotations.runbook }}*Runbook:* {{ .Annotations.runbook }}{{ end }}
*Labels:*
  {{ range .Labels.SortedPairs }}• {{ .Name }}: {{ .Value }}
  {{ end }}
{{ end }}
{{ end }}
```

## Step 4: Docker Compose with Alertmanager

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
      - '--web.enable-lifecycle'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./rules:/etc/prometheus/rules
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - monitoring
    depends_on:
      - alertmanager

  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - ./templates:/etc/alertmanager/templates
      - alertmanager-data:/alertmanager
    ports:
      - "9093:9093"
    networks:
      - monitoring

  sample-app:
    build: .
    container_name: sample-app
    ports:
      - "8080:8080"
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: node-exporter
    ports:
      - "9100:9100"
    networks:
      - monitoring

volumes:
  prometheus-data:
  alertmanager-data:

networks:
  monitoring:
    driver: bridge
```

## Step 5: Update Prometheus Configuration

```yaml
# prometheus.yml (add alerting section)
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - 'alertmanager:9093'

rule_files:
  - '/etc/prometheus/rules/*.yml'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'alertmanager'
    static_configs:
      - targets: ['alertmanager:9093']

  - job_name: 'sample-app'
    static_configs:
      - targets: ['sample-app:8080']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

## Step 6: Test Alerts

```bash
# Start the stack
docker-compose up -d

# Trigger a test alert (simulate high CPU)
docker exec prometheus curl -X POST http://localhost:9090/api/v1/admin/tsdb/snapshot

# Check alerts in Prometheus UI
open http://localhost:9090/alerts

# Check Alertmanager UI
open http://localhost:9093

# Send test alert to Alertmanager
curl -H "Content-Type: application/json" -d '[{
  "labels": {
    "alertname": "TestAlert",
    "severity": "warning"
  },
  "annotations": {
    "summary": "Test alert",
    "description": "This is a test"
  }
}]' http://localhost:9093/api/v1/alerts
```

## Step 7: Silence Alerts

```bash
# Create silence via API
curl -X POST http://localhost:9093/api/v1/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [
      {
        "name": "alertname",
        "value": "HighCPUUsage",
        "isRegex": false
      }
    ],
    "startsAt": "2024-01-01T00:00:00Z",
    "endsAt": "2024-01-01T02:00:00Z",
    "createdBy": "admin",
    "comment": "Maintenance window"
  }'

# Or create via Alertmanager UI
open http://localhost:9093/#/silences
```

## Step 8: Alert Best Practices

### 1. Make Alerts Actionable

```yaml
# ❌ Bad: Not actionable
- alert: SomethingBad
  expr: thing_metric > 100

# ✅ Good: Clear, actionable
- alert: HighAPILatency
  expr: api_latency_p95 > 1
  annotations:
    summary: "API latency exceeded SLO"
    description: "P95 latency is {{ $value }}s (SLO: 1s)"
    runbook: "https://wiki.company.com/runbooks/high-latency"
    action: "1. Check recent deployments 2. Review error logs 3. Check database performance"
```

### 2. Use Appropriate `for` Duration

```yaml
# Transient spikes: use longer duration
- alert: HighCPU
  expr: cpu_usage > 80
  for: 10m  # Don't alert on brief spikes

# Critical issues: use shorter duration
- alert: ServiceDown
  expr: up == 0
  for: 1m  # Alert quickly for outages
```

### 3. Multi-window Alerts (SLO-based)

```yaml
# Fast burn: 5% error budget in 1 hour
- alert: ErrorBudgetBurnRateFast
  expr: |
    (1 - sli:availability:ratio) / (1 - 0.999) > 14.4
  for: 2m

# Slow burn: 10% error budget in 24 hours
- alert: ErrorBudgetBurnRateSlow
  expr: |
    (1 - sli:availability:ratio) / (1 - 0.999) > 1
  for: 1h
```

## Step 9: Notification Channels

### Slack Configuration

```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts'
        title: '{{ template "slack.default.title" . }}'
        text: '{{ template "slack.default.text" . }}'
        color: '{{ if eq .Status "firing" }}danger{{ else }}good{{ end }}'
        send_resolved: true
```

### Email Configuration

```yaml
receivers:
  - name: 'email'
    email_configs:
      - to: 'team@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alertmanager@example.com'
        auth_password: 'app_password'
        require_tls: true
        headers:
          Subject: '[{{ .Status | toUpper }}] {{ .GroupLabels.alertname }}'
        html: '{{ template "email.default.html" . }}'
```

### PagerDuty Configuration

```yaml
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - routing_key: 'YOUR_PAGERDUTY_INTEGRATION_KEY'
        description: '{{ .GroupLabels.alertname }}'
        severity: '{{ .CommonLabels.severity }}'
        details:
          firing: '{{ .Alerts.Firing | len }}'
          num_firing: '{{ .Alerts.Firing | len }}'
          num_resolved: '{{ .Alerts.Resolved | len }}'
```

### Webhook Configuration

```yaml
receivers:
  - name: 'webhook'
    webhook_configs:
      - url: 'http://example.com/webhook'
        send_resolved: true
        http_config:
          basic_auth:
            username: 'user'
            password: 'pass'
```

## Exercises

1. **Create Custom Alerts**: Add alerts for your specific services
2. **Configure Slack**: Set up Slack notifications
3. **Test Alert Routing**: Verify alerts go to correct channels
4. **Create Runbooks**: Write runbooks for common alerts
5. **Silence Management**: Practice creating and managing silences

## Key Takeaways

- ✅ Alerts should be actionable and clear
- ✅ Use appropriate `for` duration to avoid noise
- ✅ Route different severities to different channels
- ✅ Include runbooks in alert annotations
- ✅ Use inhibition to reduce alert fatigue
- ✅ Test alerts regularly

## Next Steps

Continue to **Tutorial 06: Grafana Dashboards** to learn about:
- Installing Grafana
- Creating dashboards
- Visualization types
- Dashboard variables
- Alert visualization

## Additional Resources

- [Alerting Rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
- [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Alert Best Practices](https://prometheus.io/docs/practices/alerting/)
