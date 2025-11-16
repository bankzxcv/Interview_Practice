# Tutorial 08: Performance Tuning - Query Optimization, EXPLAIN & Indexes

## Objectives

- Master EXPLAIN and EXPLAIN ANALYZE
- Optimize slow queries
- Create effective indexes
- Configure autovacuum
- Tune PostgreSQL parameters for performance
- Understand query planner
- Implement connection pooling
- Optimize for different workloads

## Prerequisites

- Completed Tutorials 01-07
- Understanding of SQL and database internals
- 60 minutes

## Performance Tuning Hierarchy

```
1. Hardware (CPU, RAM, SSD)
2. PostgreSQL Configuration
3. Schema Design (normalization, indexes)
4. Query Optimization (EXPLAIN, indexes)
5. Application Design (connection pooling, caching)
```

## Step-by-Step Instructions

### Step 1: Setup Performance Lab

```bash
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.1_PostgreSQL/08_performance_tuning

docker-compose up -d

# Create large dataset for testing
docker-compose exec postgres psql -U postgres <<EOF
CREATE DATABASE perftest;
\c perftest

-- Create test table with 1 million rows
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price NUMERIC(10,2),
    order_date TIMESTAMP,
    status VARCHAR(20),
    notes TEXT
);

-- Generate test data
INSERT INTO orders (customer_id, product_id, quantity, price, order_date, status)
SELECT
    floor(random() * 10000 + 1)::int as customer_id,
    floor(random() * 1000 + 1)::int as product_id,
    floor(random() * 10 + 1)::int as quantity,
    (random() * 1000)::numeric(10,2) as price,
    timestamp '2020-01-01' + random() * (timestamp '2024-01-01' - timestamp '2020-01-01') as order_date,
    (ARRAY['pending','shipped','delivered','cancelled'])[floor(random() * 4 + 1)] as status
FROM generate_series(1, 1000000);

SELECT 'Created ' || COUNT(*) || ' orders' FROM orders;
EOF
```

### Step 2: Understanding EXPLAIN

**Basic EXPLAIN**:
```sql
-- Show query plan
EXPLAIN
SELECT * FROM orders WHERE customer_id = 5000;

-- Output explanation:
-- Seq Scan: Sequential scan (reads entire table)
-- Index Scan: Uses index
-- Bitmap Heap Scan: Uses bitmap index
-- cost=0.00..25.50: Estimated startup..total cost
-- rows=100: Estimated rows returned
-- width=50: Average row width in bytes
```

**EXPLAIN ANALYZE (Actually runs query)**:
```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 5000;

-- Shows actual vs estimated:
-- Planning Time: Time to create plan
-- Execution Time: Actual execution time
-- Buffers: Shared blocks read
```

**Detailed EXPLAIN**:
```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM orders WHERE customer_id = 5000 AND status = 'delivered';
```

### Step 3: Index Optimization

**Identify missing indexes**:
```sql
-- Find sequential scans
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / NULLIF(seq_scan, 0) as avg_seq_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC;

-- Create index
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- Re-run query
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 5000;
-- Now uses Index Scan instead of Seq Scan!
```

**Composite indexes**:
```sql
-- For queries with multiple conditions
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE customer_id = 5000 AND status = 'delivered';

-- Create composite index (order matters!)
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);

-- More efficient than two separate indexes
```

**Partial indexes** (for filtered queries):
```sql
-- Index only delivered orders
CREATE INDEX idx_orders_delivered ON orders(customer_id)
WHERE status = 'delivered';

-- Much smaller than full index
SELECT pg_size_pretty(pg_relation_size('idx_orders_delivered'));
```

**Expression indexes**:
```sql
-- For queries on computed values
CREATE INDEX idx_orders_year ON orders(EXTRACT(YEAR FROM order_date));

-- Efficient query
SELECT * FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2023;
```

**Covering indexes** (include columns):
```sql
-- Avoid table lookup
CREATE INDEX idx_orders_covering ON orders(customer_id)
INCLUDE (order_date, price, status);

-- Index-only scan (faster!)
EXPLAIN ANALYZE
SELECT order_date, price, status
FROM orders
WHERE customer_id = 5000;
```

### Step 4: Query Optimization Techniques

**Use WHERE instead of HAVING**:
```sql
-- SLOW
SELECT customer_id, COUNT(*)
FROM orders
GROUP BY customer_id
HAVING customer_id > 5000;

-- FAST
SELECT customer_id, COUNT(*)
FROM orders
WHERE customer_id > 5000
GROUP BY customer_id;
```

**EXISTS vs IN**:
```sql
-- Create customers table
CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100));
INSERT INTO customers SELECT i, 'Customer ' || i FROM generate_series(1, 10000) i;

-- SLOW (IN with subquery)
SELECT * FROM customers
WHERE id IN (SELECT customer_id FROM orders WHERE status = 'delivered');

-- FAST (EXISTS)
SELECT * FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.id AND o.status = 'delivered'
);
```

**LIMIT with ORDER BY**:
```sql
-- Slow without index on order_date
SELECT * FROM orders ORDER BY order_date DESC LIMIT 10;

-- Create index
CREATE INDEX idx_orders_date ON orders(order_date DESC);

-- Now fast!
EXPLAIN ANALYZE
SELECT * FROM orders ORDER BY order_date DESC LIMIT 10;
```

**Avoid SELECT ***:
```sql
-- SLOW (retrieves all columns)
SELECT * FROM orders WHERE customer_id = 5000;

-- FAST (only needed columns)
SELECT id, order_date, price FROM orders WHERE customer_id = 5000;
```

### Step 5: Join Optimization

**Nested Loop vs Hash Join**:
```sql
-- Create products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(50)
);
INSERT INTO products SELECT i, 'Product ' || i, 'Category' FROM generate_series(1, 1000) i;

-- Analyze join strategy
EXPLAIN ANALYZE
SELECT o.*, p.name
FROM orders o
JOIN products p ON o.product_id = p.id
WHERE o.customer_id = 5000;

-- Index foreign key
CREATE INDEX idx_orders_product_id ON orders(product_id);
```

**JOIN order matters**:
```sql
-- Statistics help optimizer
ANALYZE orders;
ANALYZE products;
ANALYZE customers;

-- Check table statistics
SELECT
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables;
```

### Step 6: Autovacuum Tuning

**Understanding VACUUM**:
```sql
-- Show dead tuples
SELECT
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Manual VACUUM
VACUUM VERBOSE orders;

-- VACUUM FULL (locks table, reclaims space)
VACUUM FULL orders;

-- ANALYZE (update statistics)
ANALYZE orders;

-- VACUUM ANALYZE (both)
VACUUM ANALYZE orders;
```

**Configure autovacuum**:
```sql
-- Tune autovacuum parameters
ALTER SYSTEM SET autovacuum = on;
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;  -- Vacuum when 10% of rows are dead
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;  -- Analyze when 5% changed
ALTER SYSTEM SET autovacuum_naptime = '1min';  -- Check every minute
ALTER SYSTEM SET autovacuum_max_workers = 3;

-- Per-table autovacuum settings
ALTER TABLE orders SET (autovacuum_vacuum_scale_factor = 0.05);

SELECT pg_reload_conf();
```

**Monitor autovacuum**:
```sql
-- Check autovacuum progress
SELECT
    pid,
    datname,
    usename,
    state,
    query,
    query_start
FROM pg_stat_activity
WHERE query LIKE '%autovacuum%';
```

### Step 7: PostgreSQL Configuration Tuning

**Memory settings**:
```sql
-- Calculate based on available RAM (example: 16GB server)

-- Shared buffers (25% of RAM)
ALTER SYSTEM SET shared_buffers = '4GB';

-- Effective cache size (50-75% of RAM)
ALTER SYSTEM SET effective_cache_size = '12GB';

-- Work mem (RAM / max_connections / 2-4)
ALTER SYSTEM SET work_mem = '64MB';

-- Maintenance work mem (5-10% of RAM)
ALTER SYSTEM SET maintenance_work_mem = '1GB';

-- WAL buffers
ALTER SYSTEM SET wal_buffers = '16MB';

-- Restart required for shared_buffers
-- docker-compose restart postgres
```

**Query planner settings**:
```sql
-- Random page cost (SSD: 1.0-1.5, HDD: 4.0)
ALTER SYSTEM SET random_page_cost = 1.1;

-- Effective I/O concurrency (SSD: 200, HDD: 2)
ALTER SYSTEM SET effective_io_concurrency = 200;

SELECT pg_reload_conf();
```

**Checkpoint tuning**:
```sql
-- Reduce checkpoint frequency
ALTER SYSTEM SET checkpoint_timeout = '15min';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET max_wal_size = '4GB';

SELECT pg_reload_conf();
```

### Step 8: Connection Pooling with PgBouncer

**Add to docker-compose.yml**:
```yaml
pgbouncer:
  image: pgbouncer/pgbouncer
  container_name: pgbouncer
  environment:
    DATABASES: "perftest=host=postgres port=5432 dbname=perftest"
    PGBOUNCER_POOL_MODE: transaction
    PGBOUNCER_MAX_CLIENT_CONN: 1000
    PGBOUNCER_DEFAULT_POOL_SIZE: 25
  ports:
    - "6432:6432"
```

**Connect through PgBouncer**:
```bash
# Direct connection (slow with many connections)
psql -h localhost -p 5432 -U postgres perftest

# Through PgBouncer (fast, connection pooling)
psql -h localhost -p 6432 -U postgres perftest
```

### Step 9: Query Performance Monitoring

**pg_stat_statements (installed earlier)**:
```sql
-- Top 10 slowest queries by average time
SELECT
    queryid,
    LEFT(query, 60) as query_snippet,
    calls,
    ROUND(mean_exec_time::numeric, 2) as avg_ms,
    ROUND(total_exec_time::numeric, 2) as total_ms,
    ROUND(stddev_exec_time::numeric, 2) as stddev_ms
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Most frequently called queries
SELECT
    queryid,
    LEFT(query, 60) as query_snippet,
    calls,
    ROUND(total_exec_time / 1000::numeric, 2) as total_seconds
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;

-- Queries consuming most total time
SELECT
    queryid,
    LEFT(query, 60) as query_snippet,
    calls,
    ROUND(total_exec_time / 1000::numeric, 2) as total_seconds,
    ROUND(100.0 * total_exec_time / SUM(total_exec_time) OVER(), 2) as percent_total
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

**Create performance report**:
```sql
-- Comprehensive performance view
CREATE OR REPLACE VIEW performance_report AS
SELECT
    'Top Tables by Size' as category,
    tablename as name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as value
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 5;

-- Run report
SELECT * FROM performance_report;
```

### Step 10: Performance Testing Script

```bash
#!/bin/bash
# benchmark.sh - Performance testing

echo "=== PostgreSQL Performance Benchmark ==="

# 1. Test sequential scan
echo "1. Sequential Scan Test..."
time docker-compose exec -T postgres psql -U postgres perftest -c \
    "SELECT COUNT(*) FROM orders WHERE status = 'delivered';" > /dev/null

# 2. Test index scan
echo "2. Index Scan Test..."
time docker-compose exec -T postgres psql -U postgres perftest -c \
    "SELECT * FROM orders WHERE customer_id = 5000;" > /dev/null

# 3. Test join
echo "3. Join Performance..."
time docker-compose exec -T postgres psql -U postgres perftest -c \
    "SELECT o.*, p.name FROM orders o JOIN products p ON o.product_id = p.id LIMIT 1000;" > /dev/null

# 4. Test aggregation
echo "4. Aggregation Performance..."
time docker-compose exec -T postgres psql -U postgres perftest -c \
    "SELECT customer_id, COUNT(*), AVG(price) FROM orders GROUP BY customer_id;" > /dev/null

# 5. Connection pool test
echo "5. Connection Pool Test..."
for i in {1..100}; do
    docker-compose exec -T postgres psql -U postgres perftest -c "SELECT 1;" > /dev/null &
done
wait

echo "=== Benchmark Complete ==="
```

## Optimization Checklist

### Schema Level
- [ ] Appropriate data types
- [ ] Proper normalization
- [ ] Constraints defined
- [ ] Foreign keys indexed
- [ ] Partitioning for large tables

### Index Level
- [ ] Index on foreign keys
- [ ] Index on WHERE columns
- [ ] Index on ORDER BY columns
- [ ] Composite indexes for multi-column queries
- [ ] Partial indexes where applicable
- [ ] Remove unused indexes

### Query Level
- [ ] Use EXPLAIN ANALYZE
- [ ] Avoid SELECT *
- [ ] Use appropriate JOIN types
- [ ] Limit result sets
- [ ] Use prepared statements
- [ ] Batch operations

### Configuration Level
- [ ] shared_buffers tuned
- [ ] work_mem appropriate
- [ ] effective_cache_size set
- [ ] Autovacuum configured
- [ ] Connection pooling implemented

## Common Performance Issues

### 1. Sequential Scans
**Problem**: Full table scans are slow
**Solution**: Create indexes

### 2. Index Bloat
**Problem**: Indexes become large and slow
**Solution**: REINDEX, VACUUM FULL

### 3. Missing Statistics
**Problem**: Query planner makes poor choices
**Solution**: Regular ANALYZE

### 4. Too Many Connections
**Problem**: Connection overhead
**Solution**: PgBouncer

### 5. Slow Queries
**Problem**: Complex queries are slow
**Solution**: EXPLAIN ANALYZE, optimize, add indexes

## Verification Steps

```bash
# Test query performance
time docker-compose exec -T postgres psql -U postgres perftest -c \
    "SELECT COUNT(*) FROM orders WHERE customer_id > 5000;"

# Check index usage
docker-compose exec postgres psql -U postgres perftest -c \
    "SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan DESC;"

# Verify configuration
docker-compose exec postgres psql -U postgres -c \
    "SHOW shared_buffers; SHOW work_mem; SHOW effective_cache_size;"
```

## Cleanup

```bash
docker-compose down -v
```

## Next Steps

In **Tutorial 09: Clustering with Patroni**, you will:
- Set up PostgreSQL cluster with Patroni
- Configure automatic failover
- Implement distributed consensus with etcd
- Handle split-brain scenarios
- Load balance across replicas

---

**Congratulations!** You can now optimize PostgreSQL for production workloads with confidence.
