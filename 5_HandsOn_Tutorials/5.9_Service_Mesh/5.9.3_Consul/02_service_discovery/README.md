# Consul Tutorial 02: Service Discovery

## Overview

Master Consul's service discovery features including automatic service registration, health checks, DNS interface, and HTTP API for dynamic service discovery.

## Learning Objectives

- Register services automatically and manually
- Configure health checks
- Use Consul DNS for service discovery
- Query services via HTTP API
- Implement service tags and metadata
- Configure prepared queries
- Monitor service health

## Service Registration

### Automatic Registration (Kubernetes)

**With Connect Inject:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  template:
    metadata:
      annotations:
        "consul.hashicorp.com/connect-inject": "true"
        "consul.hashicorp.com/service-tags": "v1,production"
        "consul.hashicorp.com/service-meta-version": "1.0.0"
```

### Manual Registration

**Register via API:**
```bash
curl -X PUT http://localhost:8500/v1/agent/service/register \
  -d '{
    "Name": "my-service",
    "Port": 8080,
    "Tags": ["v1", "api"],
    "Meta": {
      "version": "1.0.0",
      "environment": "production"
    },
    "Check": {
      "HTTP": "http://localhost:8080/health",
      "Interval": "10s",
      "Timeout": "1s"
    }
  }'
```

## Health Checks

**Configure Health Checks:**
```yaml
annotations:
  "consul.hashicorp.com/connect-inject": "true"
  "consul.hashicorp.com/service-checks": |
    [
      {
        "HTTP": "http://localhost:8080/health",
        "Interval": "10s",
        "Timeout": "1s"
      },
      {
        "TCP": "localhost:8080",
        "Interval": "30s"
      }
    ]
```

**Check Service Health:**
```bash
# Via API
curl http://localhost:8500/v1/health/service/web?passing | jq

# Via CLI
consul catalog nodes -service=web -detailed
```

## DNS Discovery

**Query Format:**
```bash
# Service: <service>.service[.tag].<datacenter>.consul
dig @localhost -p 8600 web.service.dc1.consul

# Prepared query: <query>.query.consul
dig @localhost -p 8600 prod-web.query.consul

# Node: <node>.node.<datacenter>.consul
dig @localhost -p 8600 server-1.node.dc1.consul
```

## HTTP API Discovery

**Service Catalog:**
```bash
# List all services
curl http://localhost:8500/v1/catalog/services | jq

# Service nodes
curl http://localhost:8500/v1/catalog/service/web | jq

# Filter by tag
curl http://localhost:8500/v1/catalog/service/web?tag=v1 | jq
```

## Best Practices

1. **Always Add Health Checks**: Monitor service health
2. **Use Service Tags**: For versioning and routing
3. **Add Metadata**: For additional context
4. **Deregister Properly**: Clean up on shutdown
5. **Monitor DNS Queries**: Track discovery patterns

## Next Steps

- [03_consul_connect](../03_consul_connect/): Enable Consul Connect service mesh
- Implement prepared queries
- Configure service watches
- Set up health alerting
