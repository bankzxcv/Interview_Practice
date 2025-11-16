# Tutorial 09: PostgreSQL Clustering with Patroni for High Availability

## Objectives

- Understand PostgreSQL high availability architectures
- Set up Patroni for automatic failover
- Configure etcd for distributed consensus
- Implement HAProxy for load balancing
- Test failover scenarios
- Monitor cluster health
- Handle split-brain situations

## Prerequisites

- Completed Tutorials 01-08
- Understanding of distributed systems
- Docker and Docker Compose
- 60-75 minutes

## High Availability Architecture

```
                    ┌─────────────┐
                    │   HAProxy   │  (Load Balancer)
                    │  :5000/:5001│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐        ┌────▼────┐       ┌────▼────┐
   │Patroni 1│        │Patroni 2│       │Patroni 3│
   │(Primary)│        │(Replica)│       │(Replica)│
   └────┬────┘        └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │  etcd cluster│
                    │ (Consensus)  │
                    └──────────────┘
```

## Key Components

- **Patroni**: Template for PostgreSQL HA
- **etcd**: Distributed key-value store for consensus
- **HAProxy**: Load balancer and connection router
- **PostgreSQL**: Database instances

## Step-by-Step Instructions

### Step 1: Start the Cluster

```bash
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.1_PostgreSQL/09_clustering

# Start all services
docker-compose up -d

# Wait for cluster to stabilize (30-60 seconds)
sleep 60

# Check status
docker-compose ps
```

Services:
- etcd1, etcd2, etcd3: Consensus cluster
- patroni1, patroni2, patroni3: PostgreSQL + Patroni
- haproxy: Load balancer

### Step 2: Verify Cluster Status

**Check Patroni cluster**:
```bash
# From patroni1
docker-compose exec patroni1 patronictl -c /etc/patroni/patroni.yml list

# Expected output:
# + Cluster: postgres-cluster (7234567890123456789) -----+----+-----------+
# | Member   | Host        | Role    | State   | TL | Lag in MB |
# +----------+-------------+---------+---------+----+-----------+
# | patroni1 | 172.20.0.4  | Leader  | running | 1  |           |
# | patroni2 | 172.20.0.5  | Replica | running | 1  |         0 |
# | patroni3 | 172.20.0.6  | Replica | running | 1  |         0 |
# +----------+-------------+---------+---------+----+-----------+
```

**Check etcd cluster**:
```bash
# Check etcd health
docker-compose exec etcd1 etcdctl endpoint health \
    --endpoints=etcd1:2379,etcd2:2379,etcd3:2379

# Check cluster members
docker-compose exec etcd1 etcdctl member list
```

**Check HAProxy stats**:
```bash
# Access HAProxy statistics
curl http://localhost:7000/stats

# Or open in browser: http://localhost:7000/stats
# Username: admin
# Password: admin
```

### Step 3: Connect to Cluster

**Write connections** (primary only):
```bash
# Connect to primary through HAProxy
psql -h localhost -p 5000 -U postgres

# Verify you're on primary
SELECT pg_is_in_recovery();  -- Should return false
```

**Read connections** (load balanced across all):
```bash
# Connect to read pool
psql -h localhost -p 5001 -U postgres

# May connect to any node (primary or replica)
SELECT pg_is_in_recovery();
```

### Step 4: Test Automatic Failover

**Simulate primary failure**:
```bash
# Check current leader
docker-compose exec patroni1 patronictl -c /etc/patroni/patroni.yml list

# Stop current primary (assuming patroni1 is leader)
docker-compose stop patroni1

# Wait for failover (10-30 seconds)
sleep 30

# Check new leader
docker-compose exec patroni2 patronictl -c /etc/patroni/patroni.yml list

# Should show patroni2 or patroni3 as new leader
```

**Verify application connectivity**:
```bash
# Connection should still work through HAProxy
psql -h localhost -p 5000 -U postgres -c "SELECT current_timestamp;"

# Check which node we're connected to
psql -h localhost -p 5000 -U postgres -c "SELECT inet_server_addr();"
```

**Restore failed node**:
```bash
# Restart patroni1
docker-compose start patroni1

# Wait for it to rejoin as replica
sleep 20

# Check cluster status
docker-compose exec patroni2 patronictl -c /etc/patroni/patroni.yml list

# patroni1 should now be a replica
```

### Step 5: Manual Switchover

**Switchover to specific node**:
```bash
# Switch primary to patroni2
docker-compose exec patroni1 patronictl -c /etc/patroni/patroni.yml switchover \
    --master patroni1 \
    --candidate patroni2 \
    --force

# Verify switchover
docker-compose exec patroni2 patronictl -c /etc/patroni/patroni.yml list
```

### Step 6: Test Data Replication

```bash
# Connect to primary
psql -h localhost -p 5000 -U postgres <<EOF
CREATE DATABASE cluster_test;
\c cluster_test

CREATE TABLE failover_test (
    id SERIAL PRIMARY KEY,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO failover_test (data) VALUES
    ('Before failover'),
    ('Test data 1'),
    ('Test data 2');
EOF

# Wait for replication
sleep 2

# Connect to replica and verify data
psql -h localhost -p 5001 -U postgres cluster_test -c \
    "SELECT * FROM failover_test;"

# Should see all 3 rows
```

### Step 7: Monitor Cluster Health

**Create monitoring script**:
```bash
#!/bin/bash
# cluster_health.sh

echo "=== Patroni Cluster Health Check ==="
echo ""

# Cluster status
echo "Cluster Status:"
docker-compose exec -T patroni1 patronictl -c /etc/patroni/patroni.yml list 2>/dev/null || \
docker-compose exec -T patroni2 patronictl -c /etc/patroni/patroni.yml list

echo ""
echo "etcd Cluster Health:"
docker-compose exec -T etcd1 etcdctl endpoint health \
    --endpoints=etcd1:2379,etcd2:2379,etcd3:2379

echo ""
echo "Replication Lag:"
for node in patroni1 patroni2 patroni3; do
    echo -n "$node: "
    docker-compose exec -T $node psql -U postgres -t -c \
        "SELECT CASE WHEN pg_is_in_recovery()
         THEN pg_wal_lsn_diff(pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn())::bigint
         ELSE 0 END;" 2>/dev/null || echo "Down"
done

echo ""
echo "=== Health Check Complete ==="
```

### Step 8: Configure Patroni Parameters

**View Patroni configuration**:
```bash
docker-compose exec patroni1 cat /etc/patroni/patroni.yml
```

**Key configuration sections**:
```yaml
# DCS (etcd) configuration
dcs:
  ttl: 30
  loop_wait: 10
  retry_timeout: 10
  maximum_lag_on_failover: 1048576

# PostgreSQL configuration
postgresql:
  parameters:
    max_connections: 100
    shared_buffers: 256MB
    effective_cache_size: 1GB
    wal_level: replica
    hot_standby: on
    max_wal_senders: 10
    max_replication_slots: 10

# Watchdog (optional, for extra safety)
watchdog:
  mode: automatic
  device: /dev/watchdog
  safety_margin: 5
```

### Step 9: HAProxy Configuration

**Review HAProxy config**:
```bash
cat haproxy/haproxy.cfg
```

**Key sections**:
```cfg
# Frontend for write connections (primary only)
frontend postgres_write
    bind *:5000
    default_backend postgres_primary

# Backend for primary
backend postgres_primary
    option httpchk
    http-check expect status 200
    default-server inter 3s fall 3 rise 2
    server patroni1 patroni1:5432 check port 8008
    server patroni2 patroni2:5432 check port 8008
    server patroni3 patroni3:5432 check port 8008

# Frontend for read connections (all nodes)
frontend postgres_read
    bind *:5001
    default_backend postgres_replicas

# Backend for replicas
backend postgres_replicas
    balance roundrobin
    option httpchk
    http-check expect status 200
    server patroni1 patroni1:5432 check port 8008
    server patroni2 patroni2:5432 check port 8008
    server patroni3 patroni3:5432 check port 8008
```

### Step 10: Advanced Scenarios

**Split-brain prevention**:
```bash
# etcd provides distributed consensus
# Even if network partitions, only one leader exists

# Test: Isolate one node
docker network disconnect 09_clustering_default patroni3

# Check cluster
docker-compose exec patroni1 patronictl -c /etc/patroni/patroni.yml list

# patroni3 should be marked as unavailable
# Reconnect
docker network connect 09_clustering_default patroni3
```

**Cascading replication**:
```yaml
# In patroni.yml for patroni3
postgresql:
  parameters:
    wal_retrieve_retry_interval: 1s
  replica:
    replicatefrom: patroni2  # Replicate from patroni2 instead of primary
```

**Synchronous replication**:
```yaml
# In patroni.yml
postgresql:
  parameters:
    synchronous_commit: on
    synchronous_standby_names: 'patroni2'
```

## Patroni Commands Reference

```bash
# List cluster members
patronictl -c /etc/patroni/patroni.yml list

# Show cluster history
patronictl -c /etc/patroni/patroni.yml history

# Perform switchover
patronictl -c /etc/patroni/patroni.yml switchover

# Reload configuration
patronictl -c /etc/patroni/patroni.yml reload

# Reinitialize a member
patronictl -c /etc/patroni/patroni.yml reinit

# Restart a member
patronictl -c /etc/patroni/patroni.yml restart patroni1

# Pause/resume automatic failover
patronictl -c /etc/patroni/patroni.yml pause
patronictl -c /etc/patroni/patroni.yml resume
```

## Best Practices

### 1. Monitoring
- Monitor Patroni health endpoints
- Track replication lag
- Alert on failovers
- Monitor etcd cluster health

### 2. Capacity Planning
- Ensure replicas can handle primary load
- Size etcd cluster appropriately (3 or 5 nodes)
- Configure appropriate timeouts

### 3. Disaster Recovery
- Regular backups (independent of HA)
- Test failover procedures
- Document recovery steps
- Geographic distribution of nodes

### 4. Maintenance
- Rolling restarts for upgrades
- Regular VACUUM on all nodes
- Monitor disk space
- Test backup restores

## Troubleshooting

### Issue: Split-Brain
**Solution**: etcd prevents this, but ensure proper network configuration

### Issue: Frequent Failovers
**Solution**: Increase `ttl` and `retry_timeout` in Patroni config

### Issue: Replication Lag
**Solution**: Check network, increase WAL senders, optimize queries

### Issue: etcd Cluster Unhealthy
**Solution**: Ensure odd number of etcd nodes (3 or 5), check network

## Verification Steps

```bash
# 1. Cluster is running
docker-compose ps | grep Up

# 2. Leader exists
docker-compose exec patroni1 patronictl -c /etc/patroni/patroni.yml list | grep Leader

# 3. Replicas are streaming
docker-compose exec patroni1 psql -U postgres -c "SELECT * FROM pg_stat_replication;"

# 4. HAProxy is routing correctly
curl http://localhost:7000/stats | grep UP

# 5. Can connect and write
psql -h localhost -p 5000 -U postgres -c "CREATE TABLE test (id int); DROP TABLE test;"
```

## Cleanup

```bash
docker-compose down -v
```

## Next Steps

In **Tutorial 10: Kubernetes Deployment**, you will:
- Deploy PostgreSQL on Kubernetes
- Use StatefulSets for persistent storage
- Configure PersistentVolumeClaims
- Implement PostgreSQL Operator
- Set up backup automation
- Monitor in Kubernetes environment

---

**Congratulations!** You now have a production-ready PostgreSQL high availability cluster with automatic failover.
