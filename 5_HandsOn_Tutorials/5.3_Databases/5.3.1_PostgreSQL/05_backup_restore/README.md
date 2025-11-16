# Tutorial 05: Backup & Restore - pg_dump, pg_restore, PITR

## Objectives

- Master multiple backup strategies (logical & physical)
- Use pg_dump and pg_restore effectively
- Implement Point-in-Time Recovery (PITR)
- Configure WAL archiving
- Automate backups
- Test restore procedures
- Understand backup best practices

## Prerequisites

- Completed Tutorials 01-04
- Understanding of WAL and replication
- 45-60 minutes

## Backup Strategies Overview

### Logical Backups (pg_dump)
**Pros**: Portable, selective, version-independent
**Cons**: Slower, requires more resources
**Use**: Dev/test, migrations, selective backups

### Physical Backups (pg_basebackup)
**Pros**: Fast, consistent, full cluster
**Cons**: Large size, version-specific
**Use**: Production, PITR, replication

### Continuous Archiving (WAL)
**Pros**: Point-in-time recovery, minimal data loss
**Cons**: Complex setup, storage intensive
**Use**: Critical production systems

## Step-by-Step Instructions

### Step 1: Setup Environment

```bash
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.1_PostgreSQL/05_backup_restore

docker-compose up -d
docker-compose ps
```

### Step 2: Create Sample Database

```bash
docker-compose exec postgres psql -U postgres <<EOF
CREATE DATABASE backup_demo;
\c backup_demo

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    amount NUMERIC(10,2),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO customers (name, email) VALUES
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com'),
    ('Bob Johnson', 'bob@example.com');

INSERT INTO orders (customer_id, amount) VALUES
    (1, 100.50),
    (1, 250.00),
    (2, 75.25);

SELECT 'Sample data created' AS status;
EOF
```

### Step 3: Logical Backup with pg_dump

**Single Database Backup**:
```bash
# Backup to SQL file
docker-compose exec postgres pg_dump -U postgres backup_demo > backup_demo.sql

# Backup in custom format (compressed, selective restore)
docker-compose exec postgres pg_dump -U postgres -Fc backup_demo > backup_demo.dump

# Backup in directory format (parallel restore)
docker-compose exec postgres pg_dump -U postgres -Fd backup_demo -f /backups/backup_demo_dir

# Verify backup
ls -lh backup_demo.*
```

**All Databases**:
```bash
# Backup all databases
docker-compose exec postgres pg_dumpall -U postgres > all_databases.sql

# Backup only globals (users, roles)
docker-compose exec postgres pg_dumpall -U postgres --globals-only > globals.sql
```

**Selective Backup**:
```bash
# Backup specific tables
docker-compose exec postgres pg_dump -U postgres -t customers backup_demo > customers_only.sql

# Backup specific schema
docker-compose exec postgres pg_dump -U postgres -n public backup_demo > public_schema.sql

# Exclude specific tables
docker-compose exec postgres pg_dump -U postgres -T orders backup_demo > without_orders.sql
```

### Step 4: Restore from Logical Backup

**Restore SQL Format**:
```bash
# Create new database
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE restore_test;"

# Restore from SQL
docker-compose exec -T postgres psql -U postgres restore_test < backup_demo.sql

# Verify restoration
docker-compose exec postgres psql -U postgres restore_test -c "SELECT COUNT(*) FROM customers;"
```

**Restore Custom Format**:
```bash
# Restore with pg_restore
docker-compose exec -T postgres pg_restore -U postgres -d restore_test backup_demo.dump

# Selective restore (specific tables)
docker-compose exec -T postgres pg_restore -U postgres -d restore_test -t customers backup_demo.dump

# Parallel restore (faster)
docker-compose exec -T postgres pg_restore -U postgres -d restore_test -j 4 backup_demo.dump
```

### Step 5: Physical Backup with pg_basebackup

```bash
# Create base backup
docker-compose exec postgres pg_basebackup -U postgres -D /backups/basebackup -Ft -z -P

# Verify backup files
docker-compose exec postgres ls -lh /backups/basebackup/

# Create backup with WAL files
docker-compose exec postgres pg_basebackup -U postgres -D /backups/basebackup_wal -Ft -z -X fetch -P
```

### Step 6: Configure WAL Archiving for PITR

**Enable WAL Archiving**:

```bash
# Update postgresql.conf
docker-compose exec postgres bash -c "cat >> /var/lib/postgresql/data/postgresql.conf <<EOF
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /backups/wal_archive/%f && cp %p /backups/wal_archive/%f'
archive_timeout = 300
max_wal_senders = 3
EOF"

# Create WAL archive directory
docker-compose exec postgres mkdir -p /backups/wal_archive

# Restart PostgreSQL
docker-compose restart postgres
docker-compose logs -f postgres
```

**Verify WAL Archiving**:
```bash
# Check archive status
docker-compose exec postgres psql -U postgres -c "SHOW archive_mode;"
docker-compose exec postgres psql -U postgres -c "SHOW archive_command;"

# Force WAL switch to test archiving
docker-compose exec postgres psql -U postgres -c "SELECT pg_switch_wal();"

# Check archived WAL files
docker-compose exec postgres ls -lh /backups/wal_archive/
```

### Step 7: Perform Base Backup for PITR

```bash
# Start backup
docker-compose exec postgres psql -U postgres <<EOF
SELECT pg_start_backup('pitr_backup', false, false);
EOF

# Create backup (while database is online)
docker-compose exec postgres tar czf /backups/pitr_base.tar.gz -C /var/lib/postgresql/data .

# Stop backup
docker-compose exec postgres psql -U postgres <<EOF
SELECT pg_stop_backup(false);
EOF

echo "PITR base backup created"
```

### Step 8: Test Point-in-Time Recovery

**Create Test Scenario**:
```bash
# Note current time
docker-compose exec postgres psql -U postgres -c "SELECT now() AS before_disaster;"

# Insert more data
docker-compose exec postgres psql -U postgres backup_demo <<EOF
INSERT INTO customers (name, email) VALUES ('Before Disaster', 'before@example.com');
INSERT INTO orders (customer_id, amount) VALUES (1, 500.00);
SELECT pg_sleep(2);
EOF

# Note time before "disaster"
RECOVERY_TIME=$(docker-compose exec postgres psql -U postgres -t -c "SELECT now();" | xargs)
echo "Recovery target time: $RECOVERY_TIME"

docker-compose exec postgres psql -U postgres -c "SELECT pg_sleep(2);"

# Simulate disaster: drop table
docker-compose exec postgres psql -U postgres backup_demo <<EOF
DROP TABLE orders;
SELECT 'Disaster: orders table dropped!' AS status;
EOF
```

**Perform PITR**:
```bash
# Stop PostgreSQL
docker-compose stop postgres

# Restore base backup
docker-compose exec postgres bash -c "
    rm -rf /var/lib/postgresql/data/*
    cd /var/lib/postgresql/data
    tar xzf /backups/pitr_base.tar.gz
"

# Create recovery.signal file
docker-compose exec postgres bash -c "touch /var/lib/postgresql/data/recovery.signal"

# Configure recovery target
docker-compose exec postgres bash -c "cat > /var/lib/postgresql/data/postgresql.auto.conf <<EOF
restore_command = 'cp /backups/wal_archive/%f %p'
recovery_target_time = '$RECOVERY_TIME'
recovery_target_action = 'promote'
EOF"

# Start PostgreSQL
docker-compose start postgres
docker-compose logs -f postgres

# Verify recovery
docker-compose exec postgres psql -U postgres backup_demo <<EOF
SELECT * FROM orders;  -- Should have data before disaster
SELECT COUNT(*) FROM customers;  -- Should match before disaster
EOF
```

### Step 9: Automated Backup Script

Create `/scripts/backup.sh`:

```bash
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p "$BACKUP_DIR/daily"

# Perform backup
echo "Starting backup: $DATE"
pg_dumpall -U postgres | gzip > "$BACKUP_DIR/daily/backup_$DATE.sql.gz"

# Verify backup
if [ -f "$BACKUP_DIR/daily/backup_$DATE.sql.gz" ]; then
    echo "Backup completed: backup_$DATE.sql.gz"
    ls -lh "$BACKUP_DIR/daily/backup_$DATE.sql.gz"
else
    echo "ERROR: Backup failed!"
    exit 1
fi

# Clean old backups
find "$BACKUP_DIR/daily" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Removed backups older than $RETENTION_DAYS days"

# Create verification report
echo "=== Backup Report ===" >> "$BACKUP_DIR/backup.log"
echo "Date: $DATE" >> "$BACKUP_DIR/backup.log"
echo "Size: $(du -h $BACKUP_DIR/daily/backup_$DATE.sql.gz | cut -f1)" >> "$BACKUP_DIR/backup.log"
echo "===================" >> "$BACKUP_DIR/backup.log"
```

**Schedule with Cron**:
```bash
# Add to crontab
0 2 * * * /path/to/backup.sh  # Daily at 2 AM
0 */6 * * * /path/to/backup.sh  # Every 6 hours
```

### Step 10: Backup Best Practices

**3-2-1 Rule**:
- 3 copies of data
- 2 different media types
- 1 offsite backup

**Testing**:
```bash
# Always test restores
# Create test restore procedure
cat > /scripts/test_restore.sh <<'EOF'
#!/bin/bash
set -e

BACKUP_FILE=$1
TEST_DB="restore_test_$(date +%s)"

echo "Testing restore of: $BACKUP_FILE"
createdb -U postgres $TEST_DB
pg_restore -U postgres -d $TEST_DB $BACKUP_FILE

# Verify table count
TABLE_COUNT=$(psql -U postgres -d $TEST_DB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
echo "Restored $TABLE_COUNT tables"

# Cleanup
dropdb -U postgres $TEST_DB
echo "Restore test successful!"
EOF

chmod +x /scripts/test_restore.sh
```

**Encryption**:
```bash
# Encrypt backup
pg_dump -U postgres backup_demo | gzip | gpg -e -r admin@example.com > backup_encrypted.sql.gz.gpg

# Decrypt and restore
gpg -d backup_encrypted.sql.gz.gpg | gunzip | psql -U postgres restore_db
```

**Offsite Backup**:
```bash
# Upload to S3
aws s3 cp backup_demo.sql.gz s3://my-backups/postgres/$(date +%Y%m%d)/

# Upload to remote server
rsync -avz /backups/ backup-server:/postgres-backups/
```

## Verification Steps

### 1. Test Backup Creation
```bash
docker-compose exec postgres pg_dump -U postgres postgres > test_backup.sql
test -f test_backup.sql && echo "✓ Backup created" || echo "✗ Backup failed"
```

### 2. Test Restore
```bash
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE verify_restore;"
docker-compose exec -T postgres psql -U postgres verify_restore < test_backup.sql
docker-compose exec postgres psql -U postgres verify_restore -c "\dt"
```

### 3. Verify WAL Archiving
```bash
docker-compose exec postgres psql -U postgres -c "SELECT pg_switch_wal();"
sleep 2
docker-compose exec postgres ls /backups/wal_archive/ | wc -l
# Should show archived WAL files
```

## Troubleshooting

**Backup Too Large**:
```bash
# Use compression
pg_dump -U postgres -Fc database > backup.dump  # Custom format (compressed)

# Split large files
pg_dump -U postgres database | split -b 1G - backup.sql.part_
```

**Slow Restore**:
```bash
# Disable constraints temporarily
pg_restore --disable-triggers -U postgres -d database backup.dump

# Use parallel restore
pg_restore -j 4 -U postgres -d database backup.dump
```

**Out of Disk Space**:
```bash
# Stream to remote location
pg_dump -U postgres database | ssh remote-server "cat > /backups/database.sql"

# Compress on the fly
pg_dump -U postgres database | gzip | ssh remote-server "cat > /backups/database.sql.gz"
```

## Cleanup

```bash
docker-compose down -v
rm -f *.sql *.dump *.tar.gz
```

## Next Steps

In **Tutorial 06: Monitoring**, you will:
- Set up pg_stat views monitoring
- Configure slow query logging
- Implement Prometheus + Grafana
- Monitor connection pooling
- Set up alerting

## Additional Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/15/backup.html)
- [pg_dump Reference](https://www.postgresql.org/docs/15/app-pgdump.html)
- [Point-in-Time Recovery](https://www.postgresql.org/docs/15/continuous-archiving.html)

---

**Congratulations!** You now have comprehensive backup and recovery strategies for production PostgreSQL systems.
