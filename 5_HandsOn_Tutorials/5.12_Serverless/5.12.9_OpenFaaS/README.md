# OpenFaaS - Serverless Functions Made Simple

OpenFaaS makes it easy to deploy serverless functions on Kubernetes or Docker Swarm with auto-scaling and metrics.

## Overview

- **Platform**: Kubernetes, Docker Swarm, or standalone
- **Languages**: Any language with Docker support
- **Templates**: Go, Python, Node.js, Java, C#, Ruby, PHP, and more
- **Scaling**: Auto-scaling with Prometheus metrics
- **Community**: Large template library and active community

## Key Features

- Auto-scaling (including scale-to-zero)
- Built-in UI (Portal)
- Prometheus metrics
- Async function invocation
- Function marketplace
- REST API and CLI
- Secrets management
- Multiple triggers (HTTP, cron, Kafka, NATS, etc.)

## Architecture

```
┌──────────────┐
│  API Gateway │  (Routing, scaling, metrics)
└──────────────┘
       ↓
┌──────────────┐
│  Functions   │  (Your serverless functions)
└──────────────┘
       ↓
┌──────────────┐
│  Prometheus  │  (Metrics & auto-scaling)
└──────────────┘
```

## Prerequisites

```bash
# Install faas-cli
curl -sSL https://cli.openfaas.com | sudo sh

# Verify installation
faas-cli version
```

## Install OpenFaaS on Kubernetes

```bash
# Add OpenFaaS Helm repo
helm repo add openfaas https://openfaas.github.io/faas-netes/
helm repo update

# Create namespaces
kubectl create namespace openfaas
kubectl create namespace openfaas-fn

# Install OpenFaaS
helm upgrade openfaas \
  --install openfaas/openfaas \
  --namespace openfaas \
  --set functionNamespace=openfaas-fn \
  --set generateBasicAuth=true

# Get password
PASSWORD=$(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode)
echo "Password: $PASSWORD"

# Port forward gateway
kubectl port-forward -n openfaas svc/gateway 8080:8080 &

# Login
echo -n $PASSWORD | faas-cli login --password-stdin
```

## Install OpenFaaS on Docker (arkade)

```bash
# Install arkade
curl -sLS https://get.arkade.dev | sudo sh

# Install OpenFaaS
arkade install openfaas

# Follow instructions to access OpenFaaS
```

## Create Your First Function (Python)

```bash
# Create function from template
faas-cli new hello-python --lang python3

# This creates:
# - hello-python.yml (function definition)
# - hello-python/handler.py (function code)
# - hello-python/requirements.txt (dependencies)
```

```python
# hello-python/handler.py
def handle(req):
    """
    Handle a request to the function
    Args:
        req (str): request body
    """
    return f"Hello from OpenFaaS! You said: {req}"
```

```yaml
# hello-python.yml
version: 1.0
provider:
  name: openfaas
  gateway: http://127.0.0.1:8080

functions:
  hello-python:
    lang: python3
    handler: ./hello-python
    image: your-username/hello-python:latest
```

```bash
# Build, push, and deploy
faas-cli build -f hello-python.yml
faas-cli push -f hello-python.yml
faas-cli deploy -f hello-python.yml

# Or all at once
faas-cli up -f hello-python.yml

# Invoke function
echo "OpenFaaS" | faas-cli invoke hello-python

# Or via HTTP
curl http://127.0.0.1:8080/function/hello-python -d "OpenFaaS"
```

## REST API Function (Go)

```bash
# Create Go function
faas-cli new rest-api --lang golang-http
```

```go
// rest-api/handler.go
package function

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type User struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

var users = map[string]User{
	"1": {ID: "1", Name: "John Doe", Email: "john@example.com"},
	"2": {ID: "2", Name: "Jane Smith", Email: "jane@example.com"},
}

func Handle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		getUsersHandler(w, r)
	case http.MethodPost:
		createUserHandler(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method not allowed"})
	}
}

func getUsersHandler(w http.ResponseWriter, r *http.Request) {
	userList := make([]User, 0, len(users))
	for _, user := range users {
		userList = append(userList, user)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"users": userList,
	})
}

func createUserHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON"})
		return
	}

	user.ID = fmt.Sprintf("%d", len(users)+1)
	users[user.ID] = user

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}
```

## TypeScript/Node.js Function

```bash
# Create Node.js function
faas-cli new api-handler --lang node18
```

```typescript
// api-handler/handler.ts
interface User {
  id: string
  name: string
  email: string
}

const users = new Map<string, User>([
  ['1', { id: '1', name: 'John Doe', email: 'john@example.com' }],
  ['2', { id: '2', name: 'Jane Smith', email: 'jane@example.com' }],
])

export async function handle(context: any) {
  const { method, body, query } = context

  try {
    if (method === 'GET') {
      return {
        status: 200,
        body: { users: Array.from(users.values()) },
      }
    }

    if (method === 'POST') {
      const { name, email } = JSON.parse(body)

      if (!name || !email) {
        return {
          status: 400,
          body: { error: 'Name and email required' },
        }
      }

      const id = String(users.size + 1)
      const user: User = { id, name, email }
      users.set(id, user)

      return {
        status: 201,
        body: user,
      }
    }

    return {
      status: 405,
      body: { error: 'Method not allowed' },
    }
  } catch (error: any) {
    return {
      status: 500,
      body: { error: error.message },
    }
  }
}
```

## Function with Dependencies

```yaml
# database-function.yml
version: 1.0
provider:
  name: openfaas
  gateway: http://127.0.0.1:8080

functions:
  database-function:
    lang: python3
    handler: ./database-function
    image: your-username/database-function:latest
    environment:
      DB_HOST: postgres
      DB_NAME: mydb
    secrets:
      - db-password
```

```python
# database-function/handler.py
import os
import psycopg2

def handle(req):
    # Get secret
    with open('/var/openfaas/secrets/db-password', 'r') as f:
        password = f.read().strip()

    # Connect to database
    conn = psycopg2.connect(
        host=os.environ['DB_HOST'],
        database=os.environ['DB_NAME'],
        user='postgres',
        password=password
    )

    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM users')
    count = cursor.fetchone()[0]

    conn.close()

    return f"Total users: {count}"
```

```bash
# Create secret
faas-cli secret create db-password --from-literal="mysecretpassword"
```

## Auto-Scaling Configuration

```yaml
# scaling-function.yml
version: 1.0
provider:
  name: openfaas
  gateway: http://127.0.0.1:8080

functions:
  scaling-function:
    lang: python3
    handler: ./scaling-function
    image: your-username/scaling-function:latest
    labels:
      # Minimum replicas (including 0 for scale-to-zero)
      com.openfaas.scale.min: "1"

      # Maximum replicas
      com.openfaas.scale.max: "20"

      # Target load for scaling (requests per second per replica)
      com.openfaas.scale.target: "5"

      # Scale down delay
      com.openfaas.scale.zero-duration: "5m"

      # Requests per second
      com.openfaas.scale.type: "rps"
```

## Async Functions

```bash
# Deploy async function
faas-cli deploy -f function.yml

# Invoke asynchronously
curl http://127.0.0.1:8080/async-function/my-function -d "data"

# Check queue length
faas-cli list
```

```yaml
# async-function.yml
version: 1.0
provider:
  name: openfaas
  gateway: http://127.0.0.1:8080

functions:
  async-processor:
    lang: python3
    handler: ./async-processor
    image: your-username/async-processor:latest
    environment:
      max_inflight: "10"
      write_timeout: "5m"
      read_timeout: "5m"
```

## Cron/Scheduled Functions

```yaml
# cron-function.yml
version: 1.0
provider:
  name: openfaas
  gateway: http://127.0.0.1:8080

functions:
  daily-report:
    lang: python3
    handler: ./daily-report
    image: your-username/daily-report:latest
    annotations:
      # Run every day at 9 AM
      topic: cron-function
      schedule: "0 9 * * *"
```

```bash
# Install cron-connector
arkade install cron-connector

# Or with kubectl
kubectl apply -f https://raw.githubusercontent.com/openfaas/faas-netes/master/yaml/cron-connector-dep.yaml
```

## Function Chaining

```python
# function1/handler.py
import requests
import os

def handle(req):
    # Process data
    result = process_data(req)

    # Call next function
    gateway_url = os.environ.get('GATEWAY_URL', 'http://gateway.openfaas:8080')
    response = requests.post(
        f"{gateway_url}/function/function2",
        data=result
    )

    return response.text

def process_data(data):
    return f"Processed: {data}"
```

## Monitoring and Metrics

```bash
# View function metrics
faas-cli describe hello-python

# View logs
faas-cli logs hello-python

# Follow logs
faas-cli logs hello-python --follow

# Access Prometheus metrics
curl http://127.0.0.1:8080/metrics

# Access Grafana dashboard (if installed)
kubectl port-forward -n openfaas deploy/grafana 3000:3000
```

## CLI Commands

```bash
# List functions
faas-cli list

# Describe function
faas-cli describe function-name

# Remove function
faas-cli remove function-name

# Store (function marketplace)
faas-cli store list
faas-cli store deploy figlet

# Get available templates
faas-cli template store list

# Pull template
faas-cli template store pull node18

# Generate function
faas-cli generate --lang python3 --name my-function

# Scale function
faas-cli scale function-name --replicas=5

# Create secret
faas-cli secret create api-key --from-literal="my-secret-key"

# List secrets
faas-cli secret list
```

## Stack File (Multiple Functions)

```yaml
# stack.yml
version: 1.0
provider:
  name: openfaas
  gateway: http://127.0.0.1:8080

functions:
  auth:
    lang: golang-http
    handler: ./auth
    image: your-username/auth:latest
    secrets:
      - jwt-secret

  users:
    lang: python3
    handler: ./users
    image: your-username/users:latest
    environment:
      DB_HOST: postgres
    secrets:
      - db-password

  notifications:
    lang: node18
    handler: ./notifications
    image: your-username/notifications:latest
    environment:
      SMTP_HOST: smtp.gmail.com
```

```bash
# Deploy all functions
faas-cli deploy -f stack.yml

# Or build, push, deploy
faas-cli up -f stack.yml
```

## Best Practices

1. **Use templates** for consistent function structure
2. **Set resource limits** to prevent resource exhaustion
3. **Implement health checks** for reliability
4. **Use secrets** for sensitive data
5. **Enable auto-scaling** based on metrics
6. **Monitor metrics** with Prometheus/Grafana
7. **Use async invocation** for long-running tasks
8. **Version your functions** with image tags
9. **Test locally** before deploying
10. **Use function store** for common functions

## Use Cases

- Microservices and APIs
- Event processing (Kafka, NATS, AWS SNS)
- Scheduled tasks (cron jobs)
- Webhooks and integrations
- Data transformation pipelines
- Machine learning inference
- Batch processing
- IoT data processing
- Image/video processing
- CI/CD automation

## Comparison with Other Platforms

| Feature | OpenFaaS | AWS Lambda | Knative |
|---------|----------|------------|---------|
| Platform | K8s/Swarm | AWS | Kubernetes |
| Vendor Lock-in | None | High | Low |
| Languages | Any (Docker) | Limited | Any (Docker) |
| Local Dev | Excellent | Limited | Good |
| Cost | Infrastructure | Per-use | Infrastructure |
| UI | Built-in | Console | None |
| Async | Built-in | SQS | Manual |

## Resources

- **Documentation**: https://docs.openfaas.com
- **Templates**: https://github.com/openfaas/templates
- **Function Store**: https://github.com/openfaas/store
- **Community**: https://slack.openfaas.io
