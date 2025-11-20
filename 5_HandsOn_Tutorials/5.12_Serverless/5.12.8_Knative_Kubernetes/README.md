# Knative - Kubernetes-Based Serverless

Knative extends Kubernetes to provide serverless capabilities, enabling auto-scaling, event-driven applications, and simplified deployment.

## Overview

- **Platform**: Kubernetes extension
- **Components**: Knative Serving, Knative Eventing
- **Scale-to-zero**: Automatic scaling including to zero
- **Languages**: Any containerized application
- **Traffic splitting**: Blue-green, canary deployments

## Key Features

- Automatic scaling (0 to N)
- Revision management and rollbacks
- Traffic splitting for progressive delivery
- Event-driven architecture
- Request-based autoscaling
- Kubernetes-native (CRDs)
- Portable across clouds

## Architecture

```
┌─────────────────────────────────────────┐
│         Knative Serving                 │
│  (HTTP request handling & autoscaling)  │
└─────────────────────────────────────────┘
                   ↕
┌─────────────────────────────────────────┐
│         Knative Eventing                │
│  (Event delivery & event sources)       │
└─────────────────────────────────────────┘
                   ↕
┌─────────────────────────────────────────┐
│           Kubernetes                     │
└─────────────────────────────────────────┘
```

## Prerequisites

```bash
# Install kubectl
kubectl version

# Install Knative CLI
curl -L https://github.com/knative/client/releases/download/knative-v1.11.0/kn-linux-amd64 \
  -o /usr/local/bin/kn
chmod +x /usr/local/bin/kn

# Verify installation
kn version
```

## Install Knative on Kubernetes

```bash
# Install Knative Serving
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.11.0/serving-crds.yaml
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.11.0/serving-core.yaml

# Install networking layer (Kourier)
kubectl apply -f https://github.com/knative/net-kourier/releases/download/knative-v1.11.0/kourier.yaml

kubectl patch configmap/config-network \
  --namespace knative-serving \
  --type merge \
  --patch '{"data":{"ingress-class":"kourier.ingress.networking.knative.dev"}}'

# Configure DNS (Magic DNS for development)
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.11.0/serving-default-domain.yaml

# Install Knative Eventing (optional)
kubectl apply -f https://github.com/knative/eventing/releases/download/knative-v1.11.0/eventing-crds.yaml
kubectl apply -f https://github.com/knative/eventing/releases/download/knative-v1.11.0/eventing-core.yaml
```

## Basic Knative Service (Node.js)

```yaml
# service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: hello-world
spec:
  template:
    spec:
      containers:
        - image: gcr.io/knative-samples/helloworld-nodejs
          ports:
            - containerPort: 8080
          env:
            - name: TARGET
              value: "World"
```

```bash
# Deploy
kubectl apply -f service.yaml

# Get URL
kn service describe hello-world

# Test
curl https://hello-world.default.example.com
```

## Custom Application (Go)

```dockerfile
# Dockerfile
FROM golang:1.21 AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/server .
CMD ["./server"]
```

```go
// main.go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

type Response struct {
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	Hostname  string `json:"hostname"`
}

func handler(w http.ResponseWriter, r *http.Request) {
	hostname, _ := os.Hostname()

	response := Response{
		Message:   "Hello from Knative!",
		Timestamp: time.Now().Format(time.RFC3339),
		Hostname:  hostname,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	http.HandleFunc("/", handler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
```

```yaml
# knative-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: go-service
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/target: "10"
        autoscaling.knative.dev/minScale: "0"
        autoscaling.knative.dev/maxScale: "100"
    spec:
      containers:
        - image: your-registry/go-service:latest
          ports:
            - containerPort: 8080
          env:
            - name: APP_ENV
              value: "production"
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
```

## Autoscaling Configuration

```yaml
# autoscaling-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: autoscale-demo
spec:
  template:
    metadata:
      annotations:
        # Target concurrent requests per pod
        autoscaling.knative.dev/target: "50"

        # Minimum replicas (0 for scale-to-zero)
        autoscaling.knative.dev/minScale: "1"

        # Maximum replicas
        autoscaling.knative.dev/maxScale: "10"

        # Autoscaling class (kpa or hpa)
        autoscaling.knative.dev/class: "kpa"

        # Metric for scaling (concurrency or rps)
        autoscaling.knative.dev/metric: "concurrency"

        # Scale down delay
        autoscaling.knative.dev/scale-down-delay: "30s"

        # Stable window
        autoscaling.knative.dev/window: "60s"
    spec:
      containers:
        - image: your-image:latest
```

## Traffic Splitting (Blue-Green, Canary)

```yaml
# traffic-split.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: traffic-split-demo
spec:
  template:
    metadata:
      name: v2  # New version
    spec:
      containers:
        - image: your-image:v2
  traffic:
    - tag: v1
      revisionName: traffic-split-demo-v1
      percent: 90  # 90% to old version
    - tag: v2
      revisionName: traffic-split-demo-v2
      percent: 10  # 10% to new version (canary)
    - tag: latest
      latestRevision: true
      percent: 0  # No traffic to latest by default
```

```bash
# Gradually shift traffic
kn service update traffic-split-demo \
  --traffic v1=50,v2=50

# Full rollout to v2
kn service update traffic-split-demo \
  --traffic v2=100
```

## Event-Driven with Knative Eventing

```yaml
# event-source.yaml (PingSource)
apiVersion: sources.knative.dev/v1
kind: PingSource
metadata:
  name: ping-source
spec:
  schedule: "*/1 * * * *"  # Every minute
  data: '{"message": "Hello from PingSource"}'
  sink:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: event-handler
```

```yaml
# event-handler.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: event-handler
spec:
  template:
    spec:
      containers:
        - image: your-event-handler:latest
          env:
            - name: EVENT_TYPE
              value: "ping"
```

## Broker and Trigger Pattern

```yaml
# broker.yaml
apiVersion: eventing.knative.dev/v1
kind: Broker
metadata:
  name: default
  namespace: default
```

```yaml
# trigger.yaml
apiVersion: eventing.knative.dev/v1
kind: Trigger
metadata:
  name: order-trigger
spec:
  broker: default
  filter:
    attributes:
      type: order.created
  subscriber:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: order-processor
```

```bash
# Send event to broker
curl -v "http://broker-ingress.knative-eventing.svc.cluster.local/default/default" \
  -X POST \
  -H "Ce-Id: 123" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: order.created" \
  -H "Ce-Source: /orders/api" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "12345", "amount": 100.00}'
```

## Private Services (Cluster-Local)

```yaml
# private-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: private-service
  labels:
    networking.knative.dev/visibility: cluster-local
spec:
  template:
    spec:
      containers:
        - image: your-private-service:latest
```

## Deploy with kn CLI

```bash
# Create service
kn service create hello \
  --image gcr.io/knative-samples/helloworld-go \
  --port 8080 \
  --env TARGET=World

# Update service
kn service update hello --env TARGET=Knative

# Scale service
kn service update hello \
  --scale-min 1 \
  --scale-max 10 \
  --scale-target 50

# List services
kn service list

# Describe service
kn service describe hello

# Delete service
kn service delete hello

# View revisions
kn revision list

# View logs
kubectl logs -l serving.knative.dev/service=hello -c user-container --tail=100
```

## Monitoring and Observability

```bash
# Install Knative monitoring (Prometheus + Grafana)
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.11.0/monitoring-core.yaml

# Access Grafana
kubectl port-forward -n knative-monitoring \
  $(kubectl get pods -n knative-monitoring -l app=grafana -o name) \
  3000:3000

# View metrics
kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1/namespaces/default/services/hello/autoscaling.knative.dev|queue_average_concurrent_requests
```

## Best Practices

1. **Set appropriate resource limits** to prevent over-provisioning
2. **Use minScale > 0** for latency-sensitive services
3. **Implement health checks** (readiness/liveness probes)
4. **Use revisions** for version control
5. **Implement traffic splitting** for safe rollouts
6. **Monitor autoscaling metrics** and adjust targets
7. **Use cluster-local** for internal services
8. **Implement retry logic** in event handlers
9. **Use Knative Eventing** for decoupled architecture
10. **Tag revisions** for easier management

## Use Cases

- HTTP APIs and microservices
- Event-driven applications
- Batch processing jobs
- CI/CD pipelines
- Machine learning inference
- Webhook handlers
- Scheduled tasks
- Data processing pipelines
- Multi-tenant SaaS platforms
- Hybrid and multi-cloud deployments

## Comparison with Traditional Kubernetes

| Feature | Traditional K8s | Knative |
|---------|----------------|---------|
| Deployment | Deployment/Service | Knative Service |
| Scaling | Manual/HPA | Automatic (0 to N) |
| Revisions | Manual versioning | Automatic |
| Traffic Split | Complex setup | Built-in |
| Cold Start | N/A | Supported |
| Event-Driven | Manual setup | Native support |
