# Tutorial 04: PostgreSQL Replication - Master-Slave Setup

## Objectives

By the end of this tutorial, you will:
- Understand PostgreSQL replication concepts
- Set up streaming replication (master-slave)
- Configure primary and replica servers
- Test failover scenarios
- Monitor replication lag
- Implement read replica scaling
- Understand synchronous vs asynchronous replication

## Prerequisites

- Completed Tutorials 01-03
- Docker and Docker Compose
- Understanding of PostgreSQL architecture
- 45-60 minutes of time

## Replication Concepts

### What is Replication?

Replication creates and maintains copies of your database on multiple servers:

- **High Availability**: If primary fails, replica can take over
- **Read Scaling**: Distribute read queries across multiple replicas
- **Disaster Recovery**: Geographic distribution of data
- **Zero-Downtime Upgrades**: Upgrade replicas first, then failover

### Replication Methods

**Streaming Replication (WAL-based)**:
- Primary streams Write-Ahead Log (WAL) to replicas
- Near real-time replication
- Binary replication (exact copy)

**Logical Replication**:
- Replicates data changes at row level
- Can replicate subset of tables
- Allows different PostgreSQL versions

### Synchronous vs Asynchronous

**Asynchronous** (default):
- Primary doesn't wait for replica confirmation
- Better performance
- Risk of data loss if primary fails

**Synchronous**:
- Primary waits for replica confirmation
- Guaranteed consistency
- Slightly slower writes

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Application Layer                  │
├─────────────────────────────────────────────────┤
│  Writes ──────────────────► Primary (Master)    │
│                                   │             │
│                      WAL Streaming │            │
│                                   ▼             │
│  Reads  ────────────► Replica 1 (Slave 1)       │
│  Reads  ────────────► Replica 2 (Slave 2)       │
└─────────────────────────────────────────────────┘
```

## Step-by-Step Instructions

### Step 1: Review Docker Compose Configuration

The setup includes:
- 1 Primary (read/write)
- 2 Replicas (read-only)
- Automatic replication configuration

### Step 2: Start the Cluster

```bash
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.1_PostgreSQL/04_replication

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# Wait for all services to be healthy
docker-compose logs -f
```

### Step 3: Verify Primary Server

```bash
# Connect to primary
docker-compose exec primary psql -U postgres

-- Check if primary
SELECT pg_is_in_recovery();  -- Should return false (not in recovery)

-- Check replication status
SELECT * FROM pg_stat_replication;

-- Should show 2 replicas connected
```

Expected output:
```
 application_name | state     | sync_state
------------------+-----------+------------
 replica1         | streaming | async
 replica2         | streaming | async
```

### Step 4: Verify Replica Servers

```bash
# Connect to replica1
docker-compose exec replica1 psql -U postgres

-- Check if replica
SELECT pg_is_in_recovery();  -- Should return true (in recovery mode)

-- Check replication lag
SELECT
    pg_last_wal_receive_lsn() AS receive,
    pg_last_wal_replay_lsn() AS replay,
    pg_last_wal_receive_lsn() - pg_last_wal_replay_lsn() AS lag;
```

### Step 5: Test Replication

```bash
# On PRIMARY: Create test database and table
docker-compose exec primary psql -U postgres -c "CREATE DATABASE replication_test;"

docker-compose exec primary psql -U postgres -d replication_test <<EOF
CREATE TABLE test_data (
    id SERIAL PRIMARY KEY,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_data (message) VALUES
    ('Message from primary'),
    ('Replication test data'),
    ('This should appear on replicas');
EOF

# Wait a moment for replication
sleep 2

# On REPLICA1: Verify data
docker-compose exec replica1 psql -U postgres -d replication_test -c "SELECT * FROM test_data;"

# On REPLICA2: Verify data
docker-compose exec replica2 psql -U postgres -d replication_test -c "SELECT * FROM test_data;"
```

### Step 6: Test Read-Only Replicas

```bash
# Try to write to replica (should fail)
docker-compose exec replica1 psql -U postgres -d replication_test <<EOF
INSERT INTO test_data (message) VALUES ('This should fail');
EOF
```

Expected error:
```
ERROR: cannot execute INSERT in a read-only transaction
```

### Step 7: Monitor Replication Lag

```sql
-- On PRIMARY
SELECT
    client_addr,
    application_name,
    state,
    sync_state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    sync_priority,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replication_lag_bytes
FROM pg_stat_replication;
```

### Step 8: Configure Synchronous Replication

**Modify Primary Configuration** (for production scenarios):

```bash
# Edit postgresql.conf on primary
cat > config/primary/postgresql.conf <<EOF
# Synchronous replication
synchronous_commit = on
synchronous_standby_names = 'replica1'  # Require confirmation from replica1
EOF

# Restart primary
docker-compose restart primary
```

### Step 9: Test Failover Scenario

```bash
# Simulate primary failure
docker-compose stop primary

# Promote replica1 to primary
docker-compose exec replica1 psql -U postgres -c "SELECT pg_promote();"

# Verify replica1 is now primary
docker-compose exec replica1 psql -U postgres -c "SELECT pg_is_in_recovery();"
# Should return false

# Test writing to new primary
docker-compose exec replica1 psql -U postgres -d replication_test <<EOF
INSERT INTO test_data (message) VALUES ('Written to new primary after failover');
SELECT * FROM test_data ORDER BY id DESC LIMIT 1;
EOF
```

### Step 10: Monitor Replication Health

Create monitoring queries:

```sql
-- Replication lag in seconds
SELECT
    application_name,
    client_addr,
    state,
    EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds
FROM pg_stat_replication;

-- WAL segments
SELECT
    slot_name,
    slot_type,
    database,
    active,
    pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) AS retained_bytes
FROM pg_replication_slots;

-- Connection count
SELECT count(*) FROM pg_stat_replication;
```

## Configuration Files Explained

### Primary Server (postgresql.conf)

```conf
# Replication settings
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
hot_standby = on

# WAL archiving
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'

# Performance
shared_buffers = 256MB
max_connections = 100
```

### Replica Server (postgresql.conf)

```conf
# Replication settings
hot_standby = on
max_standby_streaming_delay = 30s
wal_receiver_status_interval = 10s
hot_standby_feedback = on
```

### pg_hba.conf (Access Control)

```conf
# Allow replication connections
host    replication     replicator      172.20.0.0/16           md5
host    all             all             172.20.0.0/16           md5
```

## Load Balancing Read Queries

### Using pgBouncer

```yaml
# Add to docker-compose.yml
pgbouncer:
  image: pgbouncer/pgbouncer
  environment:
    DATABASES: postgres=host=primary port=5432 dbname=postgres
  ports:
    - "6432:6432"
```

### Application-Level Load Balancing

```python
# Python example with connection pooling
from sqlalchemy import create_engine

# Write connection
write_engine = create_engine('postgresql://postgres@primary:5432/mydb')

# Read connections (round-robin)
read_engines = [
    create_engine('postgresql://postgres@replica1:5432/mydb'),
    create_engine('postgresql://postgres@replica2:5432/mydb'),
]

# Use appropriate connection based on operation
def get_read_connection():
    return random.choice(read_engines)

def get_write_connection():
    return write_engine
```

## Verification Steps

### 1. All Services Running

```bash
docker-compose ps
# Should show: primary, replica1, replica2 all healthy
```

### 2. Replication Active

```bash
docker-compose exec primary psql -U postgres -c "SELECT count(*) FROM pg_stat_replication;"
# Should return 2
```

### 3. Data Consistency

```bash
# Write on primary
docker-compose exec primary psql -U postgres -c "SELECT pg_database_size('postgres');"

# Read from replicas
docker-compose exec replica1 psql -U postgres -c "SELECT pg_database_size('postgres');"
docker-compose exec replica2 psql -U postgres -c "SELECT pg_database_size('postgres');"

# Sizes should be identical (or very close)
```

### 4. Replication Lag

```bash
docker-compose exec primary psql -U postgres -c "
SELECT
    application_name,
    pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes
FROM pg_stat_replication;
"

# Lag should be 0 or very small (< 1MB under normal conditions)
```

## Best Practices

### 1. Monitor Replication Lag

Set up alerts for lag > 10 seconds:

```sql
SELECT
    application_name,
    EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds
FROM pg_stat_replication
WHERE EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) > 10;
```

### 2. Use Replication Slots

Prevents WAL removal if replica is down:

```sql
-- On primary
SELECT pg_create_physical_replication_slot('replica1_slot');
```

### 3. Regular Backups

Don't rely solely on replication:
- Replication replicates mistakes too
- Use separate backup strategy

### 4. Test Failover Regularly

Practice failover procedures:
- Simulate failures
- Document recovery steps
- Automate when possible

### 5. Separate Read/Write Traffic

```python
# Application code pattern
def execute_query(query, write=False):
    if write:
        return primary_db.execute(query)
    else:
        return random.choice(replicas).execute(query)
```

## Troubleshooting

### Issue 1: Replica Not Connecting

```bash
# Check logs
docker-compose logs replica1

# Common issues:
# 1. Wrong password in replication user
# 2. pg_hba.conf not allowing replication
# 3. Network connectivity

# Test connection
docker-compose exec replica1 psql -h primary -U replicator -d postgres
```

### Issue 2: Replication Lag Increasing

```sql
-- Check for long-running queries on primary
SELECT pid, usename, state, query, now() - query_start AS duration
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Kill long-running query if needed
SELECT pg_terminate_backend(pid);
```

### Issue 3: WAL Files Filling Disk

```bash
# Check WAL directory size
docker-compose exec primary du -sh /var/lib/postgresql/data/pg_wal

# Clean up old WAL (use carefully!)
SELECT pg_switch_wal();
SELECT pg_start_backup('cleanup', false, false);
SELECT pg_stop_backup(false);
```

## Cleanup

```bash
# Stop all services
docker-compose down -v

# Verify cleanup
docker-compose ps
docker volume ls | grep replication
```

## Next Steps

In **Tutorial 05: Backup & Restore**, you will:
- Implement backup strategies (pg_dump, pg_basebackup)
- Configure point-in-time recovery (PITR)
- Test restore procedures
- Automate backups with cron
- Set up WAL archiving

## Additional Resources

- [PostgreSQL Replication Documentation](https://www.postgresql.org/docs/15/high-availability.html)
- [Streaming Replication](https://www.postgresql.org/docs/15/warm-standby.html)
- [pg_stat_replication View](https://www.postgresql.org/docs/15/monitoring-stats.html#MONITORING-PG-STAT-REPLICATION-VIEW)

---

**Congratulations!** You now have a working PostgreSQL replication cluster with automatic failover capabilities.
