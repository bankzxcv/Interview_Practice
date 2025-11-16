# Tutorial 09: MySQL Clustering (Galera)

## Objectives

- Understand MySQL clustering concepts
- Set up Galera Cluster for high availability
- Configure multi-master replication
- Implement automatic failover
- Monitor cluster health
- Handle split-brain scenarios

## What is Galera Cluster?

Galera Cluster is a synchronous multi-master cluster for MySQL/MariaDB providing:
- **Multi-master replication**: Write to any node
- **Synchronous replication**: Data replicated in real-time
- **Automatic failover**: No manual intervention needed
- **Automatic node provisioning**: New nodes sync automatically
- **Read/write scalability**: Distribute load across nodes

## Architecture

```
        Application Layer
              |
    ┌─────────┴─────────┐
    ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Node 1 │◄►│ Node 2 │◄►│ Node 3 │
│ (R/W)  │ │ (R/W)  │ │ (R/W)  │
└────────┘ └────────┘ └────────┘
     All nodes can read/write
     Synchronous replication
```

## Docker Compose Setup

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  galera-node1:
    image: mariadb:10.11
    container_name: galera-node1
    hostname: galera-node1
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123
      MYSQL_DATABASE: clusterdb
    command:
      - --wsrep-new-cluster
      - --wsrep-cluster-name=galera-cluster
      - --wsrep-cluster-address=gcomm://galera-node1,galera-node2,galera-node3
      - --wsrep-node-address=galera-node1
      - --wsrep-node-name=node1
      - --wsrep-sst-method=rsync
      - --wsrep-provider=/usr/lib/galera/libgalera_smm.so
      - --binlog-format=ROW
    ports:
      - "3306:3306"
    volumes:
      - node1-data:/var/lib/mysql
    networks:
      - galera-network

  galera-node2:
    image: mariadb:10.11
    container_name: galera-node2
    hostname: galera-node2
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123
      MYSQL_DATABASE: clusterdb
    command:
      - --wsrep-cluster-name=galera-cluster
      - --wsrep-cluster-address=gcomm://galera-node1,galera-node2,galera-node3
      - --wsrep-node-address=galera-node2
      - --wsrep-node-name=node2
      - --wsrep-sst-method=rsync
      - --wsrep-provider=/usr/lib/galera/libgalera_smm.so
      - --binlog-format=ROW
    ports:
      - "3307:3306"
    volumes:
      - node2-data:/var/lib/mysql
    networks:
      - galera-network
    depends_on:
      - galera-node1

  galera-node3:
    image: mariadb:10.11
    container_name: galera-node3
    hostname: galera-node3
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123
      MYSQL_DATABASE: clusterdb
    command:
      - --wsrep-cluster-name=galera-cluster
      - --wsrep-cluster-address=gcomm://galera-node1,galera-node2,galera-node3
      - --wsrep-node-address=galera-node3
      - --wsrep-node-name=node3
      - --wsrep-sst-method=rsync
      - --wsrep-provider=/usr/lib/galera/libgalera_smm.so
      - --binlog-format=ROW
    ports:
      - "3308:3306"
    volumes:
      - node3-data:/var/lib/mysql
    networks:
      - galera-network
    depends_on:
      - galera-node1

  haproxy:
    image: haproxy:2.8
    container_name: galera-haproxy
    ports:
      - "3309:3306"
      - "8404:8404"
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
    networks:
      - galera-network
    depends_on:
      - galera-node1
      - galera-node2
      - galera-node3

networks:
  galera-network:
    driver: bridge

volumes:
  node1-data:
  node2-data:
  node3-data:
```

## HAProxy Configuration

**haproxy.cfg**:
```
global
    maxconn 4096
    log stdout format raw local0

defaults
    log global
    mode tcp
    option tcplog
    option dontlognull
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

listen mysql-cluster
    bind *:3306
    mode tcp
    balance leastconn
    option mysql-check user haproxy
    server node1 galera-node1:3306 check
    server node2 galera-node2:3306 check backup
    server node3 galera-node3:3306 check backup

listen stats
    bind *:8404
    stats enable
    stats uri /
    stats refresh 10s
    stats admin if TRUE
```

## Start Cluster

```bash
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.2_MySQL/09_clustering

# Start all nodes
docker-compose up -d

# Check cluster status
docker-compose exec galera-node1 mysql -u root -prootpass123 -e "
SHOW STATUS LIKE 'wsrep_cluster_size';
SHOW STATUS LIKE 'wsrep_cluster_status';
SHOW STATUS LIKE 'wsrep_connected';
"
```

## Monitor Cluster

```sql
-- Cluster size (should be 3)
SHOW STATUS LIKE 'wsrep_cluster_size';

-- Cluster status (should be 'Primary')
SHOW STATUS LIKE 'wsrep_cluster_status';

-- Local state (should be 'Synced')
SHOW STATUS LIKE 'wsrep_local_state_comment';

-- Check if node is ready
SHOW STATUS LIKE 'wsrep_ready';

-- Number of nodes in cluster
SHOW STATUS LIKE 'wsrep_incoming_addresses';

-- Replication health
SHOW STATUS LIKE 'wsrep_flow_control_paused';
SHOW STATUS LIKE 'wsrep_cert_deps_distance';
```

## Test Multi-Master Writes

```bash
# Write to node 1
docker-compose exec galera-node1 mysql -u root -prootpass123 clusterdb -e "
CREATE TABLE test (id INT PRIMARY KEY, node VARCHAR(10));
INSERT INTO test VALUES (1, 'node1');
"

# Write to node 2
docker-compose exec galera-node2 mysql -u root -prootpass123 clusterdb -e "
INSERT INTO test VALUES (2, 'node2');
"

# Write to node 3
docker-compose exec galera-node3 mysql -u root -prootpass123 clusterdb -e "
INSERT INTO test VALUES (3, 'node3');
"

# Verify all nodes have all data
for node in galera-node1 galera-node2 galera-node3; do
  echo "=== $node ==="
  docker-compose exec $node mysql -u root -prootpass123 clusterdb -e "SELECT * FROM test;"
done
```

## Handling Node Failures

```bash
# Simulate node failure
docker-compose stop galera-node2

# Check cluster still works
docker-compose exec galera-node1 mysql -u root -prootpass123 -e "
SHOW STATUS LIKE 'wsrep_cluster_size';
INSERT INTO clusterdb.test VALUES (4, 'after-failure');
"

# Restart failed node - it will auto-sync
docker-compose start galera-node2

# Verify it caught up
docker-compose exec galera-node2 mysql -u root -prootpass123 clusterdb -e "SELECT * FROM test;"
```

## Split-Brain Prevention

```sql
-- Configure quorum
-- Minimum cluster size to remain operational
SET GLOBAL wsrep_provider_options='pc.ignore_quorum=false';
SET GLOBAL wsrep_provider_options='pc.weight=1';

-- View current quorum status
SHOW STATUS LIKE 'wsrep_cluster_conf_id';
```

## Best Practices

1. **Odd number of nodes** (3, 5, 7) to prevent split-brain
2. **Use HAProxy** for load balancing
3. **Monitor cluster size** constantly
4. **Use SST method wisely** (rsync vs xtrabackup)
5. **Limit transaction size** to avoid flow control
6. **Keep nodes in same datacenter** for low latency
7. **Use synchronous replication** for critical data
8. **Regular backups** even with clustering
9. **Test failover scenarios** regularly
10. **Monitor wsrep stats** for performance

## Performance Tuning

```ini
# my.cnf for Galera
[mysqld]
wsrep_provider_options="gcache.size=1G"
wsrep_slave_threads=4
innodb_flush_log_at_trx_commit=2
innodb_autoinc_lock_mode=2
```

## Troubleshooting

### Node Won't Join Cluster
```bash
# Check cluster address
docker-compose exec galera-node2 mysql -u root -prootpass123 -e "
SHOW VARIABLES LIKE 'wsrep_cluster_address';
"

# Check logs
docker-compose logs galera-node2 | grep -i wsrep
```

### Cluster Fails to Start
```bash
# Bootstrap from most advanced node
# 1. Check seqno on all nodes
grep seqno /var/lib/mysql/grastate.dat

# 2. Bootstrap from node with highest seqno
docker-compose exec galera-node1 mysqld --wsrep-new-cluster
```

## Next Steps

**Tutorial 10: Kubernetes Deployment** - Deploy MySQL on Kubernetes with StatefulSets, persistent volumes, and operators.

---

**Congratulations!** You can now run a highly available MySQL cluster!
