# 5.3.5 Cassandra - Complete Tutorial Series

## Overview

Master Apache Cassandra, the highly scalable distributed NoSQL database. Learn from basics to multi-datacenter deployments on Kubernetes.

## Tutorial Structure

| # | Tutorial | Duration | Topics |
|---|----------|----------|--------|
| 01 | [Basic Setup](./01_basic_setup/) | 20-30 min | Docker, CQL basics, keyspaces |
| 02 | [Docker Compose](./02_docker_compose/) | 25-30 min | Multi-node setup, cqlsh |
| 03 | [Data Modeling](./03_data_modeling/) | 40-50 min | Query-first design, partition keys, clustering |
| 04 | [Replication](./04_replication/) | 30-40 min | Replication strategies, consistency levels |
| 05 | [Backup & Restore](./05_backup_restore/) | 30-35 min | Snapshots, incremental backups |
| 06 | [Monitoring](./06_monitoring/) | 35-40 min | Metrics, nodetool, Prometheus |
| 07 | [Security](./07_security/) | 30-35 min | Authentication, authorization, encryption |
| 08 | [Performance](./08_performance/) | 40-45 min | Compaction, caching, tuning |
| 09 | [Multi-Datacenter](./09_multi_datacenter/) | 40-50 min | Geographic distribution, NetworkTopologyStrategy |
| 10 | [Kubernetes](./10_kubernetes_deployment/) | 45-55 min | StatefulSets, operators, K8ssandra |

## Quick Start

```bash
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.5_Cassandra/01_basic_setup
docker-compose up -d
docker-compose exec cassandra cqlsh
```

## What is Cassandra?

Apache Cassandra is a highly scalable, distributed NoSQL database designed for handling large amounts of data across commodity servers.

**Key Features**:
- Masterless architecture (no single point of failure)
- Linear scalability
- Multi-datacenter replication
- Tunable consistency
- High write throughput
- Column-family data model

**Use Cases**:
- ✅ Time-series data
- ✅ IoT sensor data
- ✅ User activity tracking
- ✅ Messaging platforms
- ✅ Product catalogs
- ✅ Recommendation engines

Start with [Tutorial 01: Basic Setup](./01_basic_setup/) →
