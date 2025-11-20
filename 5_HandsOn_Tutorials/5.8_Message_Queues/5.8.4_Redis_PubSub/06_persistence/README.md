# Tutorial 06: Persistence and Reliability

Configure Redis persistence with RDB snapshots, AOF (Append-Only File) logs, durability settings, backup strategies, and Docker configurations for production-ready messaging systems.

## Table of Contents
- [Introduction](#introduction)
- [Redis Persistence Options](#redis-persistence-options)
- [RDB Snapshots](#rdb-snapshots)
- [AOF - Append Only File](#aof---append-only-file)
- [Hybrid Persistence](#hybrid-persistence)
- [Docker Configuration](#docker-configuration)
- [Backup and Restore](#backup-and-restore)
- [Testing Persistence](#testing-persistence)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Best Practices](#best-practices)

## Introduction

While Redis Pub/Sub is ephemeral, Redis Streams and other data structures require persistence to prevent data loss. Understanding Redis persistence options is critical for reliable messaging systems.

### Persistence Comparison

| Feature | RDB | AOF | Hybrid |
|---------|-----|-----|--------|
| Snapshot frequency | Periodic | Every write/second/none | Both |
| Recovery speed | Fast | Slow | Medium |
| Data loss risk | Minutes | Seconds or none | Minimal |
| File size | Compact | Large | Both files |
| CPU overhead | Low (periodic) | Low-Medium | Medium |
| Durability | Low | High | Highest |

### Use Cases

**RDB Snapshots:**
- Backups and disaster recovery
- Replica initialization
- Minimal performance impact
- Can tolerate some data loss

**AOF Logs:**
- Maximum durability
- Point-in-time recovery
- Audit trail
- Cannot tolerate data loss

**Hybrid (RDB + AOF):**
- Production systems
- Best of both worlds
- Fast recovery + high durability

## Redis Persistence Options

### No Persistence (Default in some configs)

```bash
# Disable all persistence
save ""
appendonly no
```

**Use when:**
- Using Redis as pure cache
- Data can be regenerated
- Pub/Sub only (ephemeral anyway)

### Persistence Decision Matrix

```
Can lose data? ──Yes──▶ RDB (or no persistence)
     │
     No
     │
     ▼
Recovery speed critical? ──Yes──▶ Hybrid (RDB + AOF)
     │
     No
     │
     ▼
Maximum durability? ──Yes──▶ AOF (appendfsync always)
```

## RDB Snapshots

### How RDB Works

1. Fork child process
2. Child writes snapshot to temp file
3. Rename temp file to dump.rdb
4. Parent continues serving requests

**Advantages:**
- Compact single file
- Fast recovery
- Minimal performance impact
- Perfect for backups

**Disadvantages:**
- Data loss between snapshots
- Fork can be expensive
- Not suitable for write-heavy workloads

### RDB Configuration

**redis.conf:**
```conf
# Save snapshot if:
save 900 1      # 1 change in 900 seconds (15 minutes)
save 300 10     # 10 changes in 300 seconds (5 minutes)
save 60 10000   # 10000 changes in 60 seconds

# Snapshot file
dbfilename dump.rdb
dir /data

# Compression
rdbcompression yes
rdbchecksum yes

# Behavior on save errors
stop-writes-on-bgsave-error yes
```

### Manual Snapshots

**SAVE (blocking):**
```bash
# Synchronous save (blocks all clients)
redis-cli SAVE
```

**BGSAVE (background):**
```bash
# Asynchronous save (non-blocking)
redis-cli BGSAVE
```

**Check last save:**
```bash
redis-cli LASTSAVE
# Returns Unix timestamp of last successful save
```

### Example Configuration

Create `redis-rdb.conf`:

```conf
# RDB Persistence Configuration

# Save conditions
save 900 1
save 300 10
save 60 10000

# File settings
dir /data
dbfilename dump.rdb

# Compression and verification
rdbcompression yes
rdbchecksum yes

# Error handling
stop-writes-on-bgsave-error yes

# Logging
loglevel notice
logfile /data/redis.log
```

### Docker Compose with RDB

Create `docker-compose-rdb.yml`:

```yaml
version: '3.8'

services:
  redis-rdb:
    image: redis:7.2-alpine
    container_name: redis-rdb
    ports:
      - "6379:6379"
    volumes:
      - ./redis-rdb.conf:/usr/local/etc/redis/redis.conf
      - redis-rdb-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redis-rdb-data:
    driver: local
```

## AOF - Append Only File

### How AOF Works

1. Every write command appended to AOF buffer
2. Buffer flushed to disk (fsync) based on policy
3. AOF rewritten periodically to compact
4. On restart, replay all commands

**Advantages:**
- More durable (minimal data loss)
- Human-readable (Redis protocol)
- Automatic rewrite/compaction
- Better for write-heavy workloads

**Disadvantages:**
- Larger file size
- Slower recovery
- Higher I/O overhead
- Potential rewrite issues

### AOF Configuration

**redis.conf:**
```conf
# Enable AOF
appendonly yes
appendfilename "appendonly.aof"
dir /data

# Fsync policies
# always  - fsync after every write (slowest, most durable)
# everysec - fsync every second (default, good balance)
# no      - let OS decide (fastest, least durable)
appendfsync everysec

# Rewrite configuration
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Behavior during rewrite
no-appendfsync-on-rewrite no

# Load truncated AOF
aof-load-truncated yes

# Use RDB preamble in AOF rewrite (hybrid format)
aof-use-rdb-preamble yes
```

### Fsync Policies

**appendfsync always:**
```conf
appendfsync always
```
- Every write fsynced immediately
- Safest (minimal data loss)
- Slowest (significant performance impact)
- Use for critical financial data

**appendfsync everysec (recommended):**
```conf
appendfsync everysec
```
- Fsync every second
- Good balance of performance and durability
- Maximum 1 second of data loss
- Default and recommended for most cases

**appendfsync no:**
```conf
appendfsync no
```
- OS decides when to fsync (typically 30 seconds)
- Fastest performance
- Potential 30+ seconds of data loss
- Use only if data loss is acceptable

### AOF Rewrite

Compact AOF file by removing redundant commands:

**Manual rewrite:**
```bash
redis-cli BGREWRITEAOF
```

**Automatic rewrite:**
```conf
# Rewrite when file is 100% larger than last rewrite
auto-aof-rewrite-percentage 100

# Minimum file size to trigger rewrite
auto-aof-rewrite-min-size 64mb
```

### Example Configuration

Create `redis-aof.conf`:

```conf
# AOF Persistence Configuration

# Enable AOF
appendonly yes
appendfilename "appendonly.aof"
dir /data

# Fsync policy (balance of durability and performance)
appendfsync everysec

# AOF Rewrite
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
no-appendfsync-on-rewrite no

# Hybrid format (RDB + AOF)
aof-use-rdb-preamble yes

# Error handling
aof-load-truncated yes

# Logging
loglevel notice
logfile /data/redis.log
```

### Docker Compose with AOF

Create `docker-compose-aof.yml`:

```yaml
version: '3.8'

services:
  redis-aof:
    image: redis:7.2-alpine
    container_name: redis-aof
    ports:
      - "6379:6379"
    volumes:
      - ./redis-aof.conf:/usr/local/etc/redis/redis.conf
      - redis-aof-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redis-aof-data:
    driver: local
```

## Hybrid Persistence

### Best of Both Worlds

Combine RDB and AOF for optimal durability and recovery speed:

**Benefits:**
- Fast recovery (RDB snapshot)
- Minimal data loss (AOF log)
- Automatic failover
- Recommended for production

### Hybrid Configuration

Create `redis-hybrid.conf`:

```conf
# Hybrid Persistence Configuration (RDB + AOF)

# ===== RDB Configuration =====
save 900 1
save 300 10
save 60 10000

dbfilename dump.rdb
dir /data
rdbcompression yes
rdbchecksum yes
stop-writes-on-bgsave-error yes

# ===== AOF Configuration =====
appendonly yes
appendfilename "appendonly.aof"

# Fsync every second (good balance)
appendfsync everysec

# AOF Rewrite
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
no-appendfsync-on-rewrite no

# Hybrid format: Use RDB preamble in AOF
# This makes AOF files smaller and recovery faster
aof-use-rdb-preamble yes

# Error handling
aof-load-truncated yes

# ===== General Settings =====
loglevel notice
logfile /data/redis.log

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Networking
bind 0.0.0.0
protected-mode yes
requirepass changeme123

# Clients
timeout 300
tcp-keepalive 300
```

### Docker Compose with Hybrid Persistence

Create `docker-compose-hybrid.yml`:

```yaml
version: '3.8'

services:
  redis-hybrid:
    image: redis:7.2-alpine
    container_name: redis-hybrid
    ports:
      - "6379:6379"
    environment:
      - REDIS_PASSWORD=changeme123
    volumes:
      - ./redis-hybrid.conf:/usr/local/etc/redis/redis.conf
      - redis-hybrid-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "changeme123", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - redis-network

volumes:
  redis-hybrid-data:
    driver: local

networks:
  redis-network:
    driver: bridge
```

**Start:**
```bash
docker-compose -f docker-compose-hybrid.yml up -d
```

## Docker Configuration

### Production-Ready Docker Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7.2-alpine
    container_name: redis-production
    ports:
      - "6379:6379"
    environment:
      - TZ=UTC
    volumes:
      # Configuration
      - ./redis.conf:/usr/local/etc/redis/redis.conf:ro
      # Persistent data
      - redis-data:/data
      # Logs
      - ./logs:/logs
    command: >
      redis-server /usr/local/etc/redis/redis.conf
      --loglevel notice
      --logfile /logs/redis.log
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a $${REDIS_PASSWORD} ping | grep PONG"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 30s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 512M
        reservations:
          cpus: '1'
          memory: 256M
    networks:
      - redis-network
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - SETGID
      - SETUID

  # Redis exporter for monitoring
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://redis:6379
      - REDIS_PASSWORD=${REDIS_PASSWORD:-changeme123}
    depends_on:
      - redis
    networks:
      - redis-network
    restart: unless-stopped

volumes:
  redis-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data

networks:
  redis-network:
    driver: bridge
```

### Volume Backup Configuration

Create `backup.sh`:

```bash
#!/bin/bash

# Redis Backup Script

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="redis-production"

echo "Starting Redis backup at $TIMESTAMP"

# Trigger BGSAVE
docker exec $CONTAINER_NAME redis-cli -a "$REDIS_PASSWORD" BGSAVE

# Wait for save to complete
while [ $(docker exec $CONTAINER_NAME redis-cli -a "$REDIS_PASSWORD" LASTSAVE) -eq $LAST_SAVE ]; do
    sleep 1
done

# Copy RDB file
docker cp $CONTAINER_NAME:/data/dump.rdb "$BACKUP_DIR/dump_$TIMESTAMP.rdb"

# Copy AOF file
docker cp $CONTAINER_NAME:/data/appendonly.aof "$BACKUP_DIR/aof_$TIMESTAMP.aof"

# Compress backups
gzip "$BACKUP_DIR/dump_$TIMESTAMP.rdb"
gzip "$BACKUP_DIR/aof_$TIMESTAMP.aof"

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
```

## Backup and Restore

### Manual Backup

**Save current state:**
```bash
# Trigger background save
docker exec redis-production redis-cli -a changeme123 BGSAVE

# Wait for completion
docker exec redis-production redis-cli -a changeme123 LASTSAVE

# Copy files
docker cp redis-production:/data/dump.rdb ./backups/
docker cp redis-production:/data/appendonly.aof ./backups/
```

### Automated Backups

Create `docker-compose-backup.yml`:

```yaml
version: '3.8'

services:
  redis:
    # ... redis configuration ...

  backup:
    image: alpine:latest
    container_name: redis-backup
    volumes:
      - redis-data:/data:ro
      - ./backups:/backups
    command: >
      sh -c "
        apk add --no-cache redis
        while true; do
          date
          cp /data/dump.rdb /backups/dump_$$(date +%Y%m%d_%H%M%S).rdb
          cp /data/appendonly.aof /backups/aof_$$(date +%Y%m%d_%H%M%S).aof
          find /backups -name '*.rdb' -mtime +7 -delete
          find /backups -name '*.aof' -mtime +7 -delete
          sleep 3600
        done
      "
    depends_on:
      - redis
    restart: unless-stopped
```

### Restore from Backup

**Stop Redis:**
```bash
docker-compose down
```

**Restore files:**
```bash
# Copy backup files
cp backups/dump_20251119_120000.rdb ./data/dump.rdb
cp backups/aof_20251119_120000.aof ./data/appendonly.aof

# Set permissions
chmod 644 ./data/dump.rdb
chmod 644 ./data/appendonly.aof
```

**Start Redis:**
```bash
docker-compose up -d

# Verify data
docker exec redis-production redis-cli -a changeme123 DBSIZE
```

### Point-in-Time Recovery

**Using AOF:**
```bash
# 1. Stop Redis
docker-compose down

# 2. Truncate AOF to specific timestamp
# (This requires manual editing or tools)

# 3. Start Redis
docker-compose up -d
```

## Testing Persistence

### Test RDB Persistence

Create `test_rdb_persistence.py`:

```python
#!/usr/bin/env python3
import redis
import subprocess
import time

def test_rdb_persistence():
    """Test RDB snapshot persistence."""
    print("Testing RDB Persistence\n")

    r = redis.Redis(host='localhost', port=6379, password='changeme123', decode_responses=True)

    # Add test data
    print("1. Adding test data...")
    r.xadd('test:stream', {'message': 'test1', 'timestamp': str(time.time())})
    r.xadd('test:stream', {'message': 'test2', 'timestamp': str(time.time())})
    r.set('test:key', 'test_value')

    initial_count = r.xlen('test:stream')
    print(f"   Stream length: {initial_count}")
    print(f"   Key value: {r.get('test:key')}")

    # Trigger save
    print("\n2. Triggering BGSAVE...")
    r.bgsave()
    time.sleep(2)  # Wait for save

    # Restart Redis
    print("\n3. Restarting Redis...")
    subprocess.run(['docker-compose', 'restart', 'redis-hybrid'])
    time.sleep(5)  # Wait for restart

    # Verify data
    print("\n4. Verifying data after restart...")
    r = redis.Redis(host='localhost', port=6379, password='changeme123', decode_responses=True)

    restored_count = r.xlen('test:stream')
    restored_value = r.get('test:key')

    print(f"   Stream length: {restored_count}")
    print(f"   Key value: {restored_value}")

    # Cleanup
    r.delete('test:stream', 'test:key')

    # Results
    if initial_count == restored_count and restored_value == 'test_value':
        print("\n✓ RDB persistence test PASSED")
    else:
        print("\n✗ RDB persistence test FAILED")

if __name__ == "__main__":
    test_rdb_persistence()
```

### Test AOF Persistence

Create `test_aof_persistence.py`:

```python
#!/usr/bin/env python3
import redis
import subprocess
import time
import os

def test_aof_persistence():
    """Test AOF persistence."""
    print("Testing AOF Persistence\n")

    r = redis.Redis(host='localhost', port=6379, password='changeme123', decode_responses=True)

    # Add test data
    print("1. Adding test data...")
    test_data = []
    for i in range(10):
        entry_id = r.xadd('test:aof', {'message': f'msg{i}', 'value': str(i)})
        test_data.append(entry_id)
        time.sleep(0.1)

    initial_count = r.xlen('test:aof')
    print(f"   Stream length: {initial_count}")

    # Wait for AOF sync (appendfsync everysec)
    print("\n2. Waiting for AOF sync...")
    time.sleep(2)

    # Kill Redis (simulate crash)
    print("\n3. Simulating Redis crash...")
    subprocess.run(['docker-compose', 'kill', 'redis-hybrid'])
    time.sleep(1)

    # Start Redis
    print("\n4. Starting Redis...")
    subprocess.run(['docker-compose', 'up', '-d', 'redis-hybrid'])
    time.sleep(5)

    # Verify data
    print("\n5. Verifying data after crash...")
    r = redis.Redis(host='localhost', port=6379, password='changeme123', decode_responses=True)

    restored_count = r.xlen('test:aof')
    print(f"   Stream length: {restored_count}")

    # Read data
    messages = r.xrange('test:aof', '-', '+')
    print(f"   Messages recovered: {len(messages)}")

    # Cleanup
    r.delete('test:aof')

    # Results
    data_loss = initial_count - restored_count
    print(f"\n   Data loss: {data_loss} entries")

    if data_loss == 0:
        print("✓ AOF persistence test PASSED (no data loss)")
    elif data_loss <= 1:
        print("✓ AOF persistence test PASSED (acceptable loss)")
    else:
        print("✗ AOF persistence test FAILED (too much data loss)")

if __name__ == "__main__":
    test_aof_persistence()
```

## Monitoring and Maintenance

### Monitoring Script

Create `monitor_persistence.py`:

```python
#!/usr/bin/env python3
import redis
import time

def monitor_persistence():
    """Monitor Redis persistence status."""
    r = redis.Redis(host='localhost', port=6379, password='changeme123', decode_responses=True)

    while True:
        print("\n" + "="*60)
        print(f"Redis Persistence Status - {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)

        info = r.info('persistence')

        # RDB Status
        print("\nRDB Snapshot:")
        print(f"  Last save time: {time.ctime(info['rdb_last_save_time'])}")
        print(f"  Last save status: {info.get('rdb_last_bgsave_status', 'unknown')}")
        print(f"  Current save: {'Yes' if info.get('rdb_bgsave_in_progress', 0) else 'No'}")
        print(f"  Last save duration: {info.get('rdb_last_bgsave_time_sec', 0)}s")

        # AOF Status
        if info.get('aof_enabled'):
            print("\nAOF Log:")
            print(f"  Current size: {info.get('aof_current_size', 0) / 1024 / 1024:.2f} MB")
            print(f"  Base size: {info.get('aof_base_size', 0) / 1024 / 1024:.2f} MB")
            print(f"  Rewrite in progress: {'Yes' if info.get('aof_rewrite_in_progress', 0) else 'No'}")
            print(f"  Last rewrite status: {info.get('aof_last_rewrite_time_sec', 'N/A')}")
            print(f"  Pending rewrites: {info.get('aof_rewrite_scheduled', 0)}")

        # Memory
        mem_info = r.info('memory')
        print("\nMemory:")
        print(f"  Used: {mem_info['used_memory_human']}")
        print(f"  Peak: {mem_info['used_memory_peak_human']}")

        time.sleep(10)

if __name__ == "__main__":
    monitor_persistence()
```

## Best Practices

### 1. Choose Appropriate Fsync Policy

```conf
# Production (balanced)
appendfsync everysec

# Critical data (maximum durability)
appendfsync always

# Cache (performance over durability)
appendfsync no
```

### 2. Monitor Disk Space

```python
import shutil

def check_disk_space(path='/data'):
    """Check available disk space."""
    usage = shutil.disk_usage(path)
    percent_used = (usage.used / usage.total) * 100

    if percent_used > 80:
        print(f"WARNING: Disk {percent_used:.1f}% full")
```

### 3. Regular Backups

```bash
# Cron job: Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### 4. Test Restore Procedures

```bash
# Regularly test restores
./restore_test.sh
```

### 5. Monitor Performance Impact

```python
def check_performance_impact(r):
    """Monitor persistence impact on performance."""
    info = r.info()

    # Check if saves are blocking
    if info.get('rdb_bgsave_in_progress'):
        print("RDB save in progress, may impact performance")

    # Check AOF rewrite
    if info.get('aof_rewrite_in_progress'):
        print("AOF rewrite in progress, may impact performance")
```

## Summary

In this tutorial, you learned:

1. Redis persistence options (RDB, AOF, Hybrid)
2. RDB snapshot configuration and usage
3. AOF append-only file configuration
4. Hybrid persistence for production
5. Docker and Docker Compose setup
6. Backup and restore procedures
7. Testing persistence mechanisms
8. Monitoring and maintenance
9. Production best practices

**Key Takeaways:**
- Hybrid (RDB + AOF) recommended for production
- AOF with everysec fsync balances durability and performance
- Regular backups are essential
- Test restore procedures regularly
- Monitor persistence impact on performance
- Configure appropriate disk space

**Next Steps:**
- [Tutorial 07: Sentinel and Cluster](../07_sentinel_cluster/README.md) for high availability
- [Tutorial 08: Kubernetes Deployment](../08_kubernetes_deployment/README.md) for container orchestration
