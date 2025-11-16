# Tutorial 06: MySQL Monitoring

## Objectives

- Monitor MySQL performance metrics
- Set up Prometheus and Grafana
- Track slow queries
- Monitor resource usage
- Implement alerting
- Use MySQL performance schema

## Key Metrics to Monitor

### Server Metrics
- **Connections**: Current, max, aborted
- **Threads**: Running, connected, cached
- **Queries**: Questions per second, slow queries
- **Buffer Pool**: Hit rate, dirty pages
- **Network**: Bytes sent/received

### Query Metrics
- **Slow queries**: Queries taking > threshold time
- **Query cache**: Hit rate (if enabled)
- **Table locks**: Wait time
- **Temporary tables**: Created on disk vs memory

### Replication Metrics
- **Replication lag**: Seconds behind master
- **Slave status**: IO/SQL thread status
- **Binlog position**: Master vs slave position

## Performance Schema

```sql
-- Enable performance schema (in my.cnf)
performance_schema = ON

-- Top queries by execution time
SELECT DIGEST_TEXT, COUNT_STAR, AVG_TIMER_WAIT/1000000000 AS avg_ms
FROM performance_schema.events_statements_summary_by_digest
ORDER BY AVG_TIMER_WAIT DESC LIMIT 10;

-- Table I/O statistics
SELECT OBJECT_NAME, COUNT_READ, COUNT_WRITE
FROM performance_schema.table_io_waits_summary_by_table
WHERE OBJECT_SCHEMA = 'mydb'
ORDER BY COUNT_READ + COUNT_WRITE DESC LIMIT 10;

-- Connection statistics
SELECT USER, HOST, CURRENT_CONNECTIONS, TOTAL_CONNECTIONS
FROM performance_schema.accounts
ORDER BY TOTAL_CONNECTIONS DESC;
```

## Slow Query Log

```ini
# my.cnf
[mysqld]
slow_query_log = 1
slow_query_log_file = /var/lib/mysql/slow-query.log
long_query_time = 2
log_queries_not_using_indexes = 1
```

```bash
# Analyze slow queries
docker-compose exec mysql mysqldumpslow /var/lib/mysql/slow-query.log
```

## Prometheus + Grafana Setup

**docker-compose.yml**:
```yaml
services:
  mysql:
    # ... existing mysql config

  mysql-exporter:
    image: prom/mysqld-exporter:latest
    container_name: mysql-exporter
    environment:
      DATA_SOURCE_NAME: "exporter:exporter_pass@(mysql:3306)/"
    ports:
      - "9104:9104"
    depends_on:
      - mysql

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

## Essential Monitoring Queries

```sql
-- Current connections
SHOW STATUS LIKE 'Threads_connected';

-- Max connections
SHOW VARIABLES LIKE 'max_connections';

-- Buffer pool hit ratio
SHOW STATUS LIKE 'Innodb_buffer_pool_read%';

-- Slow queries count
SHOW GLOBAL STATUS LIKE 'Slow_queries';

-- Table lock waits
SHOW STATUS LIKE 'Table_locks_waited';

-- Current queries
SHOW FULL PROCESSLIST;
```

## Alerting Rules

```yaml
# prometheus alerts
groups:
  - name: mysql
    rules:
      - alert: MySQLDown
        expr: mysql_up == 0
        for: 1m
        annotations:
          summary: "MySQL instance down"

      - alert: MySQLSlowQueries
        expr: rate(mysql_global_status_slow_queries[5m]) > 0.1
        annotations:
          summary: "High slow query rate"
```

## Best Practices

1. **Monitor continuously**, not just when problems occur
2. **Set up alerts** before issues become critical
3. **Track trends** over time
4. **Monitor replication lag** in real-time
5. **Use Grafana dashboards** for visualization
6. **Enable slow query log** in production
7. **Review performance schema** regularly

## Next Steps

**Tutorial 07: Security** - Learn MySQL security hardening, user management, and SSL/TLS configuration.

---

**Congratulations!** You can now monitor MySQL effectively with industry-standard tools!
