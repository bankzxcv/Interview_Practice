# 5.3.4 Redis - Complete Tutorial Series

## Overview

Master Redis, the in-memory data structure store used as database, cache, and message broker. Learn from basic operations to production clustering on Kubernetes.

## Tutorial Structure

| # | Tutorial | Duration | Topics |
|---|----------|----------|--------|
| 01 | [Basic Setup](./01_basic_setup/) | 15-20 min | Docker, data types, basic commands |
| 02 | [Docker Compose](./02_docker_compose/) | 20-25 min | Redis Commander, configuration |
| 03 | [Data Structures](./03_data_structures/) | 30-40 min | Strings, Lists, Sets, Hashes, Sorted Sets, Streams |
| 04 | [Replication](./04_replication/) | 25-35 min | Master-replica, sentinel for HA |
| 05 | [Persistence](./05_persistence/) | 25-30 min | RDB snapshots, AOF logs |
| 06 | [Monitoring](./06_monitoring/) | 30-35 min | Redis metrics, Prometheus, Grafana |
| 07 | [Security](./07_security/) | 25-30 min | AUTH, ACLs, SSL/TLS, network security |
| 08 | [Clustering](./08_clustering/) | 35-45 min | Redis Cluster, sharding, hash slots |
| 09 | [Performance](./09_performance/) | 30-40 min | Pipelining, Lua scripts, optimization |
| 10 | [Kubernetes](./10_kubernetes_deployment/) | 40-50 min | StatefulSets, operators, cloud deployment |

## Quick Start

```bash
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.4_Redis/01_basic_setup
docker-compose up -d
docker-compose exec redis redis-cli
```

## What is Redis?

Redis (REmote DIctionary Server) is an open-source, in-memory data structure store.

**Key Features**:
- In-memory storage (microsecond latency)
- Rich data structures (strings, lists, sets, hashes, streams)
- Built-in replication
- Lua scripting
- Pub/Sub messaging
- Automatic failover with Sentinel
- Clustering for horizontal scaling

**Common Use Cases**:
- ✅ Caching layer
- ✅ Session storage
- ✅ Real-time analytics
- ✅ Message queues
- ✅ Leaderboards / counters
- ✅ Rate limiting
- ✅ Pub/Sub messaging

Start with [Tutorial 01: Basic Setup](./01_basic_setup/) →
