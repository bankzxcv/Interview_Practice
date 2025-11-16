# Tutorial 08: MySQL Performance Tuning

## Objectives

- Optimize MySQL configuration for performance
- Tune InnoDB buffer pool and caches
- Optimize queries and indexes
- Use EXPLAIN for query analysis
- Implement query caching strategies
- Monitor and improve slow queries

## Key Performance Parameters

### InnoDB Buffer Pool
```ini
# my.cnf
[mysqld]
# Set to 70-80% of available RAM for dedicated DB server
innodb_buffer_pool_size = 4G

# Multiple instances for better concurrency (1GB per instance recommended)
innodb_buffer_pool_instances = 4

# Monitor with:
# SHOW STATUS LIKE 'Innodb_buffer_pool%';
```

### Connection Management
```ini
max_connections = 200          # Max simultaneous connections
max_connect_errors = 100        # Block hosts after errors
thread_cache_size = 50          # Cache threads for reuse
table_open_cache = 4000         # Cache open table definitions
```

### Query Cache (Deprecated in MySQL 8.0)
```ini
# For MySQL 5.7 and earlier
query_cache_type = 1
query_cache_size = 128M
query_cache_limit = 2M
```

### InnoDB Settings
```ini
innodb_log_file_size = 512M          # Larger = better write performance
innodb_log_buffer_size = 16M         # Transaction log buffer
innodb_flush_log_at_trx_commit = 2   # 2 = write every second (faster, less safe)
innodb_flush_method = O_DIRECT       # Avoid double buffering
innodb_file_per_table = 1            # Separate file per table
innodb_stats_on_metadata = 0         # Don't update stats on metadata queries
```

### Temporary Tables
```ini
tmp_table_size = 128M
max_heap_table_size = 128M
```

## Query Optimization

### Using EXPLAIN
```sql
-- Analyze query execution plan
EXPLAIN SELECT * FROM users WHERE email = 'john@example.com';

-- Extended EXPLAIN with more details
EXPLAIN FORMAT=JSON SELECT * FROM orders WHERE user_id = 123;

-- Key columns to check:
-- type: ALL (bad), index (ok), range (good), ref (good), const (best)
-- key: Which index is used
-- rows: Estimated rows examined
-- Extra: Additional information (Using where, Using index, etc.)
```

### Good vs Bad Queries

**Bad - Full table scan**:
```sql
SELECT * FROM users WHERE YEAR(created_at) = 2024;
-- Creates function on indexed column, prevents index use
```

**Good - Uses index**:
```sql
SELECT * FROM users WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
-- Allows index use on created_at
```

**Bad - Leading wildcard**:
```sql
SELECT * FROM users WHERE email LIKE '%@gmail.com';
-- Cannot use index
```

**Good - No leading wildcard**:
```sql
SELECT * FROM users WHERE email LIKE 'john%';
-- Can use index
```

### Index Optimization

```sql
-- Create composite index with proper order
CREATE INDEX idx_user_status_created ON orders(user_id, status, created_at);

-- Good for:
WHERE user_id = 123
WHERE user_id = 123 AND status = 'active'
WHERE user_id = 123 AND status = 'active' AND created_at > '2024-01-01'

-- Not optimal for:
WHERE status = 'active'  -- user_id not in WHERE
WHERE created_at > '2024-01-01'  -- user_id not in WHERE

-- Remove unused indexes
SELECT * FROM sys.schema_unused_indexes;
DROP INDEX idx_unused ON table_name;

-- Find duplicate indexes
SELECT * FROM sys.schema_redundant_indexes;
```

### Query Patterns

**Use SELECT specific columns**:
```sql
-- Bad
SELECT * FROM users;

-- Good
SELECT id, username, email FROM users;
```

**Use EXISTS instead of COUNT**:
```sql
-- Bad - counts all rows
SELECT COUNT(*) FROM orders WHERE user_id = 123;
IF count > 0 THEN ...

-- Good - stops at first match
SELECT EXISTS(SELECT 1 FROM orders WHERE user_id = 123);
```

**Use LIMIT**:
```sql
-- Always limit results when possible
SELECT * FROM users ORDER BY created_at DESC LIMIT 100;
```

**Batch inserts**:
```sql
-- Bad - multiple queries
INSERT INTO users (name) VALUES ('User1');
INSERT INTO users (name) VALUES ('User2');

-- Good - single query
INSERT INTO users (name) VALUES ('User1'), ('User2'), ('User3');
```

## Performance Schema Analysis

```sql
-- Enable performance schema
SET GLOBAL performance_schema = ON;

-- Top 10 slowest queries
SELECT DIGEST_TEXT AS query,
       COUNT_STAR AS exec_count,
       AVG_TIMER_WAIT / 1000000000 AS avg_seconds,
       SUM_TIMER_WAIT / 1000000000 AS total_seconds
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;

-- Table I/O wait times
SELECT OBJECT_NAME,
       COUNT_STAR,
       SUM_TIMER_WAIT / 1000000000 AS total_seconds
FROM performance_schema.table_io_waits_summary_by_table
WHERE OBJECT_SCHEMA = 'mydb'
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;

-- Index usage
SELECT OBJECT_NAME, INDEX_NAME, COUNT_STAR
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE OBJECT_SCHEMA = 'mydb'
ORDER BY COUNT_STAR DESC;
```

## Partitioning for Large Tables

```sql
-- Partition by date range
CREATE TABLE orders (
    id INT,
    user_id INT,
    created_at DATE,
    total DECIMAL(10,2)
)
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Query specific partition
SELECT * FROM orders PARTITION (p2024) WHERE user_id = 123;

-- Drop old partitions
ALTER TABLE orders DROP PARTITION p2022;
```

## Benchmark and Load Testing

```bash
# Using mysqlslap
mysqlslap \
  --user=root \
  --password=rootpass \
  --host=localhost \
  --concurrency=50 \
  --iterations=10 \
  --auto-generate-sql \
  --auto-generate-sql-load-type=mixed \
  --number-of-queries=1000

# Using sysbench
sysbench /usr/share/sysbench/oltp_read_write.lua \
  --mysql-host=localhost \
  --mysql-user=root \
  --mysql-password=rootpass \
  --mysql-db=testdb \
  --tables=10 \
  --table-size=10000 \
  prepare

sysbench /usr/share/sysbench/oltp_read_write.lua \
  --mysql-host=localhost \
  --mysql-user=root \
  --mysql-password=rootpass \
  --mysql-db=testdb \
  --tables=10 \
  --table-size=10000 \
  --threads=10 \
  --time=60 \
  run
```

## Monitoring Key Metrics

```sql
-- Buffer pool hit ratio (should be > 99%)
SHOW STATUS LIKE 'Innodb_buffer_pool_read%';
-- Calculate: (1 - (Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests)) * 100

-- Thread usage
SHOW STATUS LIKE 'Threads%';

-- Table lock waits (should be low)
SHOW STATUS LIKE 'Table_locks_waited';

-- Slow queries
SHOW STATUS LIKE 'Slow_queries';

-- Temporary tables created on disk (should be < 25% of total)
SHOW STATUS LIKE 'Created_tmp%';

-- Sort operations
SHOW STATUS LIKE 'Sort%';
```

## Configuration Tuning Tool

```bash
# MySQLTuner - analyzes configuration and suggests improvements
wget https://raw.githubusercontent.com/major/MySQLTuner-perl/master/mysqltuner.pl
chmod +x mysqltuner.pl
./mysqltuner.pl --host 127.0.0.1 --user root --pass rootpass
```

## Best Practices

1. **Index appropriately** - not too many, not too few
2. **Use EXPLAIN** before deploying queries
3. **Monitor slow query log** continuously
4. **Optimize InnoDB buffer pool** size
5. **Use appropriate data types**
6. **Avoid SELECT *** - select only needed columns
7. **Use batch operations** for bulk inserts/updates
8. **Partition large tables** (>100M rows)
9. **Regular ANALYZE TABLE** to update statistics
10. **Keep MySQL updated** for performance improvements

## Performance Checklist

- [ ] innodb_buffer_pool_size optimized (70-80% RAM)
- [ ] Slow query log enabled and monitored
- [ ] All foreign keys are indexed
- [ ] No queries doing full table scans (check EXPLAIN)
- [ ] Query cache configured (MySQL < 8.0)
- [ ] Table maintenance scheduled (OPTIMIZE TABLE)
- [ ] Connection pooling in application
- [ ] Appropriate indexes on WHERE/JOIN columns
- [ ] No N+1 query problems
- [ ] Partitioning implemented for large tables
- [ ] Performance schema enabled
- [ ] Regular backups don't impact performance

## Next Steps

**Tutorial 09: Clustering** - Learn MySQL clustering with Galera for high availability and scale.

---

**Congratulations!** You can now tune MySQL for optimal performance!
