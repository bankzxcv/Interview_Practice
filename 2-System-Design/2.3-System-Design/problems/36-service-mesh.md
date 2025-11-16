# Design Service Mesh (Istio)

## Problem Statement
Design a service mesh that provides service-to-service communication with load balancing, retries, circuit breaking, observability, and mutual TLS.

## Architecture
```
Service A → Sidecar Proxy (Envoy) → Sidecar Proxy → Service B
                ↓
         Control Plane (Istio)
```

## Key Features
```yaml
# Circuit breaker
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: reviews
spec:
  host: reviews
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s

# Retry policy
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
    - reviews
  http:
    - retries:
        attempts: 3
        perTryTimeout: 2s
        retryOn: 5xx,reset,connect-failure
```

## Interview Talking Points
"Service mesh uses sidecar proxies (Envoy) for all service traffic. Provides retry logic, circuit breaking (eject unhealthy instances), load balancing (round-robin, least conn), and mutual TLS (automatic). Control plane (Istio) manages config. Observability with distributed tracing (spans for each service call). Alternative to implementing these features in every service."
