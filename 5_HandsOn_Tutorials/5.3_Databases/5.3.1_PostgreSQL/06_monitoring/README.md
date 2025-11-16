# Tutorial 06: PostgreSQL Monitoring - pg_stat, Prometheus & Grafana

## Objectives

- Monitor PostgreSQL with pg_stat views
- Configure slow query logging
- Set up Prometheus exporters
- Build Grafana dashboards
- Implement alerting rules
- Track key performance metrics
- Monitor connection pools

## Prerequisites

- Completed Tutorials 01-05
- Docker and Docker Compose
- Basic understanding of metrics and monitoring
- 60 minutes

## Monitoring Stack

```
PostgreSQL → postgres_exporter → Prometheus → Grafana
     ↓
  pg_stat views
     ↓
  Slow query log
```

## Step-by-Step Instructions

### Step 1: Start Monitoring Stack

```bash
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.1_PostgreSQL/06_monitoring

docker-compose up -d
docker-compose ps
```

Services:
- PostgreSQL: 5432
- Prometheus: 9090
- Grafana: 3000
- postgres_exporter: 9187

### Step 2: Built-in PostgreSQL Statistics

**pg_stat_activity** - Current connections:
```sql
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query,
    query_start,
    state_change
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
```

**pg_stat_database** - Database statistics:
```sql
SELECT
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    tup_returned,
    tup_fetched,
    tup_inserted,
    tup_updated,
    tup_deleted
FROM pg_stat_database
WHERE datname = 'postgres';
```

**pg_stat_user_tables** - Table statistics:
```sql
SELECT
    schemaname,
    relname,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum,
    last_analyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

**pg_stat_user_indexes** - Index usage:
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

**pg_statio_user_tables** - Table I/O:
```sql
SELECT
    relname,
    heap_blks_read,
    heap_blks_hit,
    idx_blks_read,
    idx_blks_hit,
    toast_blks_read,
    toast_blks_hit
FROM pg_statio_user_tables;
```

### Step 3: Configure Slow Query Logging

```bash
# Update postgresql.conf
docker-compose exec postgres psql -U postgres <<EOF
ALTER SYSTEM SET log_min_duration_statement = 100;  -- Log queries > 100ms
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET log_temp_files = 0;
ALTER SYSTEM SET log_autovacuum_min_duration = 0;
SELECT pg_reload_conf();
EOF

# Verify settings
docker-compose exec postgres psql -U postgres -c "SHOW log_min_duration_statement;"
```

**View logs**:
```bash
# Real-time log monitoring
docker-compose logs -f postgres | grep "duration:"

# Analyze slow queries
docker-compose logs postgres | grep "duration:" | sort -t: -k3 -rn | head -20
```

### Step 4: Create Monitoring Views

```sql
-- Active connections by state
CREATE OR REPLACE VIEW active_connections AS
SELECT
    state,
    COUNT(*) as count,
    MAX(EXTRACT(EPOCH FROM (now() - query_start))) as max_duration_seconds
FROM pg_stat_activity
WHERE state IS NOT NULL
GROUP BY state;

-- Table bloat estimation
CREATE OR REPLACE VIEW table_bloat AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    n_dead_tup,
    n_live_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_tuple_percent
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY n_dead_tup DESC;

-- Index usage statistics
CREATE OR REPLACE VIEW index_usage AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE WHEN idx_scan = 0 THEN 'UNUSED' ELSE 'USED' END as status
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- Cache hit ratio
CREATE OR REPLACE VIEW cache_hit_ratio AS
SELECT
    'index hit rate' as metric,
    ROUND(
        SUM(idx_blks_hit)::numeric / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0) * 100,
        2
    ) as ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT
    'table hit rate' as metric,
    ROUND(
        SUM(heap_blks_hit)::numeric / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0) * 100,
        2
    ) as ratio
FROM pg_statio_user_tables;

-- Long running queries
CREATE OR REPLACE VIEW long_running_queries AS
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    ROUND(EXTRACT(EPOCH FROM (now() - query_start))::numeric, 2) as duration_seconds,
    state,
    query
FROM pg_stat_activity
WHERE state != 'idle'
    AND query_start < now() - INTERVAL '1 minute'
ORDER BY query_start;
```

### Step 5: Access Prometheus

Open http://localhost:9090

**Useful Queries**:

```promql
# Database connections
pg_stat_database_numbackends{datname="postgres"}

# Transactions per second
rate(pg_stat_database_xact_commit{datname="postgres"}[5m])

# Cache hit ratio
pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read)

# Replication lag (if using replication)
pg_replication_lag

# Database size
pg_database_size_bytes{datname="postgres"}

# Active connections
pg_stat_activity_count{state="active"}

# Slow queries
rate(pg_stat_statements_mean_time_seconds[5m])
```

### Step 6: Configure Grafana Dashboard

1. **Access Grafana**: http://localhost:3000
   - Username: admin
   - Password: admin

2. **Add Prometheus Data Source**:
   - Settings → Data Sources → Add data source
   - Type: Prometheus
   - URL: http://prometheus:9090
   - Save & Test

3. **Import PostgreSQL Dashboard**:
   - Create → Import
   - Dashboard ID: 9628 (PostgreSQL Database)
   - Select Prometheus data source
   - Import

4. **Create Custom Panel**:

**Connection Count**:
```json
{
  "targets": [
    {
      "expr": "pg_stat_database_numbackends{datname=\"postgres\"}",
      "legendFormat": "Connections"
    }
  ],
  "title": "Active Connections"
}
```

**Query Duration**:
```json
{
  "targets": [
    {
      "expr": "rate(pg_stat_database_xact_commit[5m])",
      "legendFormat": "Commits/sec"
    }
  ],
  "title": "Transaction Rate"
}
```

### Step 7: Set Up Alerting

**Create alert rules in Prometheus** (`prometheus/alerts.yml`):

```yaml
groups:
  - name: postgresql
    interval: 30s
    rules:
      # Too many connections
      - alert: PostgreSQLTooManyConnections
        expr: pg_stat_database_numbackends{datname="postgres"} > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Too many connections"
          description: "{{ $value }} connections to postgres database"

      # Replication lag
      - alert: PostgreSQLReplicationLag
        expr: pg_replication_lag > 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High replication lag"
          description: "Replication lag is {{ $value }} seconds"

      # Low cache hit ratio
      - alert: PostgreSQLLowCacheHitRatio
        expr: |
          pg_stat_database_blks_hit /
          (pg_stat_database_blks_hit + pg_stat_database_blks_read) < 0.90
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Low cache hit ratio"
          description: "Cache hit ratio is {{ $value }}"

      # Database down
      - alert: PostgreSQLDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL is down"
          description: "PostgreSQL instance is down"

      # Disk usage high
      - alert: PostgreSQLHighDiskUsage
        expr: |
          (pg_database_size_bytes / 1024 / 1024 / 1024) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High disk usage"
          description: "Database size is {{ $value }}GB"

      # Too many dead tuples
      - alert: PostgreSQLDeadTuples
        expr: |
          (pg_stat_user_tables_n_dead_tup /
           (pg_stat_user_tables_n_live_tup + pg_stat_user_tables_n_dead_tup)) > 0.1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High dead tuple ratio"
          description: "Table has {{ $value }}% dead tuples"
```

### Step 8: pg_stat_statements Extension

**Enable extension**:
```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Configure
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Restart required
-- docker-compose restart postgres
```

**Query statistics**:
```sql
-- Top 10 slowest queries
SELECT
    query,
    calls,
    ROUND(total_exec_time::numeric, 2) as total_time_ms,
    ROUND(mean_exec_time::numeric, 2) as mean_time_ms,
    ROUND(max_exec_time::numeric, 2) as max_time_ms,
    ROUND(stddev_exec_time::numeric, 2) as stddev_time_ms
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Most frequently executed queries
SELECT
    query,
    calls,
    ROUND(total_exec_time::numeric, 2) as total_time_ms,
    ROUND(100.0 * total_exec_time / SUM(total_exec_time) OVER(), 2) as percent_total
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

### Step 9: Connection Pooling Monitoring (pgBouncer)

```yaml
# Add to docker-compose.yml
pgbouncer:
  image: pgbouncer/pgbouncer
  environment:
    DATABASES: "postgres=host=postgres port=5432 dbname=postgres"
  ports:
    - "6432:6432"
```

**Monitor pgBouncer**:
```bash
# Connect to pgBouncer admin console
psql -h localhost -p 6432 -U postgres pgbouncer

# Show pools
SHOW POOLS;

# Show stats
SHOW STATS;

# Show active connections
SHOW CLIENTS;
```

### Step 10: Create Monitoring Dashboard Script

```bash
#!/bin/bash
# monitor.sh - Quick PostgreSQL health check

echo "=== PostgreSQL Health Check ==="
echo ""

# Connection count
echo "Active Connections:"
docker-compose exec -T postgres psql -U postgres -t -c "
SELECT COUNT(*) FROM pg_stat_activity WHERE state != 'idle';
"

# Database size
echo "Database Sizes:"
docker-compose exec -T postgres psql -U postgres -t -c "
SELECT datname, pg_size_pretty(pg_database_size(datname))
FROM pg_database
WHERE datname NOT IN ('template0', 'template1')
ORDER BY pg_database_size(datname) DESC;
"

# Cache hit ratio
echo "Cache Hit Ratio:"
docker-compose exec -T postgres psql -U postgres -t -c "
SELECT ROUND(
    100.0 * SUM(blks_hit) / NULLIF(SUM(blks_hit + blks_read), 0), 2
) || '%' as cache_hit_ratio
FROM pg_stat_database;
"

# Long running queries
echo "Long Running Queries (> 1 min):"
docker-compose exec -T postgres psql -U postgres -t -c "
SELECT COUNT(*) FROM pg_stat_activity
WHERE state != 'idle' AND query_start < now() - INTERVAL '1 minute';
"

# Replication status (if configured)
echo "Replication Status:"
docker-compose exec -T postgres psql -U postgres -t -c "
SELECT application_name, state, sync_state
FROM pg_stat_replication;
" 2>/dev/null || echo "No replication configured"

echo ""
echo "=== End Health Check ==="
```

## Key Metrics to Monitor

### Performance Metrics
- Transactions per second (TPS)
- Query execution time
- Connection count
- Cache hit ratio (should be > 90%)
- Buffer usage

### Resource Metrics
- CPU usage
- Memory usage
- Disk I/O
- Network I/O
- Database size

### Availability Metrics
- Uptime
- Replication lag (if using replication)
- Failed connections
- Deadlocks

### Capacity Metrics
- Table sizes
- Index sizes
- WAL size
- Connection limits

## Best Practices

1. **Set appropriate thresholds**
   - Don't alert on every spike
   - Use rate of change alerts

2. **Regular statistics resets**
   ```sql
   SELECT pg_stat_reset();
   ```

3. **Monitor trends, not just values**
   - Compare week-over-week
   - Look for patterns

4. **Document baseline metrics**
   - Know your normal
   - Recognize anomalies

5. **Test alerting**
   - Verify alerts fire
   - Reduce alert fatigue

## Cleanup

```bash
docker-compose down -v
```

## Next Steps

In **Tutorial 07: Security**, you will:
- Configure users and roles
- Implement row-level security
- Set up SSL/TLS connections
- Audit logging
- Password policies

## Additional Resources

- [PostgreSQL Statistics Views](https://www.postgresql.org/docs/15/monitoring-stats.html)
- [Prometheus PostgreSQL Exporter](https://github.com/prometheus-community/postgres_exporter)
- [Grafana PostgreSQL Dashboard](https://grafana.com/grafana/dashboards/9628)

---

**Congratulations!** You now have comprehensive monitoring for your PostgreSQL deployment.
