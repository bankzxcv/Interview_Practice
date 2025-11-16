# NATS Tutorial 04: Clustering

## Overview
Set up a NATS cluster for high availability and fault tolerance.

## Architecture
```
Client --> Load Balancer
            |
    Node1 - Node2 - Node3
      (Full mesh cluster)
```

## Quick Start
```bash
docker-compose up -d

# Test connectivity to any node
nats pub --server=nats://localhost:4222 test "Hello"
nats pub --server=nats://localhost:4223 test "Hello"
```

## Cluster Features
- Full mesh topology
- Automatic route discovery
- Client failover
- Subject interest propagation

## Verification
```bash
nats --server=nats://localhost:4222 server report
```

## Best Practices
- 3+ nodes for HA
- Use same cluster name
- Configure route ports
- Monitor cluster health

Next: Tutorial 05 - Security
