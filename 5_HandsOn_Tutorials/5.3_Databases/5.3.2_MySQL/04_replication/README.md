# Tutorial 04: MySQL Replication

## Objectives

- Set up master-slave (primary-replica) replication
- Configure read replicas for scalability
- Understand replication lag and monitoring
- Implement failover strategies
- Learn replication best practices

## Prerequisites

- Completed Tutorials 01-03
- Understanding of MySQL basics
- Docker Compose knowledge
- 30-45 minutes

## What is MySQL Replication?

Replication enables data from one MySQL server (master/primary) to be copied automatically to one or more MySQL servers (slaves/replicas).

**Benefits**:
- **Scalability**: Read operations distributed across replicas
- **Data backup**: Live backup on replicas
- **High availability**: Failover to replica if master fails
- **Analytics**: Run heavy queries on replicas without affecting master

**Use Cases**:
- Read-heavy applications (90% reads, 10% writes)
- Disaster recovery
- Geographic distribution
- Separating OLTP from OLAP workloads

## Replication Architecture

```
┌─────────────────┐
│     Master      │  Write operations
│   (Primary)     │  Logs to binary log
└────────┬────────┘
         │ Binary Log
         ├─────────────┬─────────────┐
         │             │             │
         ▼             ▼             ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Replica 1│  │ Replica 2│  │ Replica 3│
  │  (Read)  │  │  (Read)  │  │  (Read)  │
  └──────────┘  └──────────┘  └──────────┘
```

## Step-by-Step Setup

### Step 1: Review Docker Compose Configuration

```yaml
version: '3.8'

services:
  mysql-master:
    image: mysql:8.0
    container_name: mysql-master
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123
      MYSQL_DATABASE: repl_db
      MYSQL_USER: repl_user
      MYSQL_PASSWORD: repl_pass123
    ports:
      - "3306:3306"
    volumes:
      - master-data:/var/lib/mysql
      - ./config/master.cnf:/etc/mysql/conf.d/master.cnf:ro
      - ./scripts/master-init.sql:/docker-entrypoint-initdb.d/master-init.sql
    networks:
      - repl-network
    command:
      - --server-id=1
      - --log-bin=mysql-bin
      - --binlog-format=ROW

  mysql-replica-1:
    image: mysql:8.0
    container_name: mysql-replica-1
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123
      MYSQL_DATABASE: repl_db
    ports:
      - "3307:3306"
    volumes:
      - replica1-data:/var/lib/mysql
      - ./config/replica.cnf:/etc/mysql/conf.d/replica.cnf:ro
    networks:
      - repl-network
    depends_on:
      - mysql-master
    command:
      - --server-id=2
      - --relay-log=mysql-relay-bin
      - --read-only=1

  mysql-replica-2:
    image: mysql:8.0
    container_name: mysql-replica-2
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123
      MYSQL_DATABASE: repl_db
    ports:
      - "3308:3306"
    volumes:
      - replica2-data:/var/lib/mysql
      - ./config/replica.cnf:/etc/mysql/conf.d/replica.cnf:ro
    networks:
      - repl-network
    depends_on:
      - mysql-master
    command:
      - --server-id=3
      - --relay-log=mysql-relay-bin
      - --read-only=1

networks:
  repl-network:
    driver: bridge

volumes:
  master-data:
  replica1-data:
  replica2-data:
```

### Step 2: Configure Master

**config/master.cnf**:
```ini
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
binlog-do-db = repl_db
max_binlog_size = 100M
expire_logs_days = 7
```

**scripts/master-init.sql**:
```sql
-- Create replication user
CREATE USER 'replicator'@'%' IDENTIFIED BY 'replicator_pass123';
GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';
FLUSH PRIVILEGES;

-- Create sample database
CREATE DATABASE IF NOT EXISTS repl_db;
USE repl_db;

-- Create sample table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert sample data
INSERT INTO users (name, email) VALUES
    ('Alice', 'alice@example.com'),
    ('Bob', 'bob@example.com');
```

### Step 3: Start Services

```bash
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.2_MySQL/04_replication

# Start all services
docker-compose up -d

# Check all services are running
docker-compose ps
```

### Step 4: Get Master Status

```bash
# Connect to master
docker-compose exec mysql-master mysql -u root -prootpass123 -e "SHOW MASTER STATUS\G"
```

Output will show:
```
*************************** 1. row ***************************
             File: mysql-bin.000001
         Position: 1234
     Binlog_Do_DB: repl_db
 Binlog_Ignore_DB:
Executed_Gtid_Set:
```

**Note the File and Position values!**

### Step 5: Configure Replicas

```bash
# Configure replica 1
docker-compose exec mysql-replica-1 mysql -u root -prootpass123 << EOF
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='replicator',
  MASTER_PASSWORD='replicator_pass123',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=1234;
START SLAVE;
EOF

# Configure replica 2
docker-compose exec mysql-replica-2 mysql -u root -prootpass123 << EOF
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='replicator',
  MASTER_PASSWORD='replicator_pass123',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=1234;
START SLAVE;
EOF
```

### Step 6: Verify Replication

```bash
# Check replica 1 status
docker-compose exec mysql-replica-1 mysql -u root -prootpass123 -e "SHOW SLAVE STATUS\G"

# Check replica 2 status
docker-compose exec mysql-replica-2 mysql -u root -prootpass123 -e "SHOW SLAVE STATUS\G"
```

Look for:
```
Slave_IO_Running: Yes
Slave_SQL_Running: Yes
Seconds_Behind_Master: 0
```

### Step 7: Test Replication

**Insert data on master**:
```bash
docker-compose exec mysql-master mysql -u root -prootpass123 repl_db -e "
INSERT INTO users (name, email) VALUES ('Charlie', 'charlie@example.com');
SELECT * FROM users;
"
```

**Verify on replica 1**:
```bash
docker-compose exec mysql-replica-1 mysql -u root -prootpass123 repl_db -e "SELECT * FROM users;"
```

**Verify on replica 2**:
```bash
docker-compose exec mysql-replica-2 mysql -u root -prootpass123 repl_db -e "SELECT * FROM users;"
```

All should show the same data including Charlie!

## Monitoring Replication

### Check Replication Lag

```bash
# On replica
docker-compose exec mysql-replica-1 mysql -u root -prootpass123 -e "
SELECT
    IF(Slave_IO_Running='Yes' AND Slave_SQL_Running='Yes', 'OK', 'ERROR') AS Status,
    Seconds_Behind_Master AS Lag
FROM (SHOW SLAVE STATUS\G) AS slave_status;
"
```

### Monitor Binary Logs

```bash
# On master - show binary logs
docker-compose exec mysql-master mysql -u root -prootpass123 -e "SHOW BINARY LOGS;"

# Show binlog events
docker-compose exec mysql-master mysql -u root -prootpass123 -e "
SHOW BINLOG EVENTS IN 'mysql-bin.000001' LIMIT 10;
"
```

## Failover Procedures

### Manual Failover to Replica

```bash
# 1. Stop writes to master (in application)

# 2. Wait for replicas to catch up
docker-compose exec mysql-replica-1 mysql -u root -prootpass123 -e "SHOW SLAVE STATUS\G" | grep Seconds_Behind_Master

# 3. Stop replication on chosen new master (replica-1)
docker-compose exec mysql-replica-1 mysql -u root -prootpass123 -e "STOP SLAVE;"

# 4. Make replica-1 writable
docker-compose exec mysql-replica-1 mysql -u root -prootpass123 -e "SET GLOBAL read_only = 0;"

# 5. Point other replicas to new master
# 6. Update application to point to new master
```

## Common Issues

### Issue 1: Replication Not Starting

```bash
# Check slave status
SHOW SLAVE STATUS\G

# Common fixes:
STOP SLAVE;
RESET SLAVE;
-- Then reconfigure with CHANGE MASTER TO
START SLAVE;
```

### Issue 2: Replication Lag

**Causes**:
- Heavy write load on master
- Slow network
- Long-running queries on replica

**Solutions**:
```sql
-- Use parallel replication (MySQL 5.7+)
SET GLOBAL slave_parallel_workers = 4;
SET GLOBAL slave_parallel_type = 'LOGICAL_CLOCK';

-- Optimize queries on replica
-- Add indexes for replication
```

### Issue 3: Duplicate Key Errors

```bash
# Skip one error
STOP SLAVE;
SET GLOBAL sql_slave_skip_counter = 1;
START SLAVE;

# Or skip all duplicate errors (use carefully)
SET GLOBAL slave_skip_errors = 1062;
```

## Best Practices

1. **Use GTIDs** (Global Transaction Identifiers) for easier failover
2. **Monitor replication lag** continuously
3. **Use semi-synchronous replication** for better consistency
4. **Test failover procedures** regularly
5. **Keep replicas identical** to master in configuration
6. **Use read-only on replicas** to prevent accidental writes
7. **Monitor disk space** for binary logs
8. **Set up alerts** for replication errors

## Verification Script

```bash
./scripts/verify-replication.sh
```

## Cleanup

```bash
./scripts/cleanup.sh
# or
docker-compose down -v
```

## Key Takeaways

1. Replication provides scalability and high availability
2. Master handles writes, replicas handle reads
3. Monitor replication lag carefully
4. Test failover procedures before you need them
5. Use GTIDs for easier management
6. Binary logging is essential for replication

## Next Steps

**Tutorial 05: Backup & Restore** - Learn backup strategies, point-in-time recovery, and disaster recovery procedures.

## Additional Resources

- [MySQL Replication](https://dev.mysql.com/doc/refman/8.0/en/replication.html)
- [GTID Replication](https://dev.mysql.com/doc/refman/8.0/en/replication-gtids.html)
- [Replication Best Practices](https://www.percona.com/blog/)

---

**Congratulations!** You've set up MySQL replication with master and multiple replicas!
