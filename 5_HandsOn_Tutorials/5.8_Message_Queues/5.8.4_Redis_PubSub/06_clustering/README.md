# Redis Tutorial 06: Redis Cluster for Pub/Sub

## Overview
Deploy Redis Cluster for horizontal scaling and high availability.

## Architecture
```
         Redis Cluster (6 nodes)
    Master1  Master2  Master3
       |        |        |
    Slave1   Slave2   Slave3
```

## Features
- Automatic sharding
- High availability
- Horizontal scaling
- Pub/Sub works across cluster

## Quick Start
```bash
docker-compose up -d
./create_cluster.sh

python cluster_pubsub.py
```

## Pub/Sub in Cluster
- Messages published to all nodes
- Subscribers on any node receive messages
- No sharding for pub/sub

## Best Practices
- 6+ nodes (3 masters, 3 slaves)
- Monitor cluster health
- Plan shard key distribution
- Use Redis Sentinel for simpler HA

Next: Tutorial 07 - Kubernetes
