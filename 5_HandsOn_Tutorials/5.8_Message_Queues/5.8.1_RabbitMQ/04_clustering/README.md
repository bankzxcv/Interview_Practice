# RabbitMQ Tutorial 04: Clustering

## Overview
Set up a RabbitMQ cluster for high availability and load distribution.

## Learning Objectives
- Create a multi-node RabbitMQ cluster
- Understand cluster networking
- Join and remove nodes
- Monitor cluster health

## Architecture

```
           Load Balancer
          /      |      \
    Node1      Node2    Node3
      \          |        /
       \----- Cluster ----/
```

## Quick Start

```bash
# Start 3-node cluster
docker-compose up -d

# Verify cluster status
docker exec rabbitmq1 rabbitmqctl cluster_status

# Join nodes to cluster (if needed)
docker exec rabbitmq2 rabbitmqctl stop_app
docker exec rabbitmq2 rabbitmqctl join_cluster rabbit@rabbitmq1
docker exec rabbitmq2 rabbitmqctl start_app
```

## Key Concepts

- **Cluster Nodes**: Distributed RabbitMQ instances
- **Erlang Cookie**: Shared secret for node authentication
- **Metadata**: Queue/exchange definitions replicated across cluster
- **Message Data**: Optional replication (see HA tutorial)

## Verification

Access any node: http://localhost:15672, 15673, 15674
- Username: admin
- Password: admin123

Check cluster in Admin panel → Nodes section

## Next Steps
- Tutorial 05: High Availability with queue mirroring
