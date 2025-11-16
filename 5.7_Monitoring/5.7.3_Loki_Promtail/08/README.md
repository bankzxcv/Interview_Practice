# Tutorial 08: Production Stack - HA and Microservices Mode

## Topics Covered
- High availability deployment
- Microservices mode (read/write paths)
- Scaling strategies
- Security and authentication
- Production best practices

## Microservices Architecture

```
┌──────────────────────────────────────┐
│         Query Frontend               │
└─────────┬────────────────────────────┘
          │
    ┌─────▼─────┬────────────┐
    │  Querier  │  Querier   │
    └─────┬─────┴────┬───────┘
          │          │
    ┌─────▼──────────▼───────┐
    │     Ingester           │
    └─────┬──────────────────┘
          │
    ┌─────▼──────┐
    │ Distributor│
    └────────────┘
```

## HA Configuration

```yaml
# 3x ingesters for HA
ingester:
  lifecycler:
    ring:
      replication_factor: 3

# Load balancing
query_frontend:
  max_outstanding_per_tenant: 2048
```

Complete production setup with Kubernetes manifests, security config, and monitoring.
