# Tutorial 04: Multi-Stage Builds

## Objectives
- Understand multi-stage Docker builds and their benefits
- Reduce image size by 50-90%
- Separate build-time and runtime dependencies
- Create optimized production images
- Learn advanced multi-stage patterns

## Prerequisites
- Completed Tutorial 03 (Build Custom Image)
- Understanding of Dockerfile instructions
- Knowledge of build vs runtime dependencies

## What are Multi-Stage Builds?

Multi-stage builds allow you to use multiple FROM statements in a Dockerfile. Each FROM instruction starts a new build stage. You can selectively copy artifacts from one stage to another, leaving behind everything you don't need in the final image.

**Benefits:**
- **Smaller Images**: Only include runtime dependencies
- **Security**: Fewer packages = smaller attack surface
- **Cleaner Separation**: Build tools separate from runtime
- **Single Dockerfile**: One file for development and production

## The Problem: Large Images

**Without Multi-Stage (Traditional Approach):**

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install  # Installs ALL dependencies including dev
COPY . .
RUN npm run build  # Build tools included in final image
CMD ["node", "dist/index.js"]
```

Result: **1.2GB image** (includes node_modules with dev dependencies, build tools, source code)

**With Multi-Stage:**

```dockerfile
# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

Result: **200MB image** (only production files, no build tools)

## Step-by-Step Instructions

### Example 1: Node.js Application

**Project Structure:**
```
my-node-app/
├── src/
│   └── index.js
├── package.json
├── package-lock.json
└── Dockerfile
```

`package.json`:
```json
{
  "name": "multi-stage-demo",
  "version": "1.0.0",
  "scripts": {
    "build": "mkdir -p dist && cp src/*.js dist/",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

`src/index.js`:
```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Multi-stage build demo',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Multi-Stage Dockerfile:**

```dockerfile
# Stage 1: Dependencies and Build
FROM node:18 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev)
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

**Build and compare:**

```bash
# Build multi-stage
docker build -t node-multistage .

# Check image size
docker images node-multistage

# Run it
docker run -d -p 3000:3000 node-multistage
curl http://localhost:3000
```

### Example 2: Go Application (Maximum Optimization)

Go can compile to a single binary, perfect for multi-stage builds!

`main.go`:
```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "time"
)

type Response struct {
    Message   string    `json:"message"`
    Timestamp time.Time `json:"timestamp"`
    Version   string    `json:"version"`
}

func handler(w http.ResponseWriter, r *http.Request) {
    response := Response{
        Message:   "Hello from Go Multi-Stage Build!",
        Timestamp: time.Now(),
        Version:   "1.0.0",
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

func main() {
    http.HandleFunc("/", handler)
    log.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

**Dockerfile:**

```dockerfile
# Stage 1: Build
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.* ./
RUN go mod download || true

# Copy source code
COPY *.go ./

# Build the binary
# CGO_ENABLED=0 for static linking
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Stage 2: Final image
FROM scratch

# Copy the binary from builder
COPY --from=builder /app/main /main

# Copy CA certificates for HTTPS
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080

CMD ["/main"]
```

**Build and see the magic:**

```bash
# Build
docker build -t go-multistage .

# Check size - should be ~10-20MB!
docker images go-multistage

# Compare to single-stage Go image (~800MB)
```

### Example 3: Python Application

`app.py`:
```python
from flask import Flask, jsonify
import datetime

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        'message': 'Python Multi-Stage Build',
        'timestamp': datetime.datetime.now().isoformat()
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

`requirements.txt`:
```text
Flask==3.0.0
gunicorn==21.2.0
```

**Dockerfile:**

```dockerfile
# Stage 1: Build dependencies
FROM python:3.9 AS builder

WORKDIR /app

# Install dependencies in a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Production
FROM python:3.9-slim

WORKDIR /app

# Copy the virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Set PATH to use the venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application
COPY app.py .

# Create non-root user
RUN useradd -m appuser
USER appuser

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

### Example 4: React Application

**Complete React build example:**

`Dockerfile`:
```dockerfile
# Stage 1: Build React app
FROM node:18 AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY public ./public
COPY src ./src
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx config (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Result**: 2GB+ build image → 25MB final image!

### Example 5: Multiple Named Stages

Use named stages for complex builds:

```dockerfile
# Stage 1: Base dependencies
FROM node:18 AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Development
FROM base AS development
RUN npm ci --include=dev
COPY . .
CMD ["npm", "run", "dev"]

# Stage 3: Build
FROM base AS builder
COPY . .
RUN npm run build
RUN npm run test

# Stage 4: Production
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
USER node
CMD ["npm", "start"]
```

**Build specific stage:**

```bash
# Build development image
docker build --target development -t myapp:dev .

# Build production image
docker build --target production -t myapp:prod .
```

## Advanced Patterns

### Pattern 1: Testing in Multi-Stage

```dockerfile
# Stage 1: Dependencies
FROM python:3.9 AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

# Stage 2: Testing
FROM base AS testing
COPY requirements-test.txt .
RUN pip install -r requirements-test.txt
COPY . .
RUN pytest tests/ --cov

# Stage 3: Production (only if tests pass)
FROM python:3.9-slim AS production
COPY --from=base /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=testing /app /app
WORKDIR /app
CMD ["gunicorn", "app:app"]
```

### Pattern 2: External Image as Stage

```dockerfile
# Use external image as a stage
FROM alpine:latest AS certificates
RUN apk --no-cache add ca-certificates

# Use another image as stage
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN go build -o app

# Final image
FROM scratch
COPY --from=certificates /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/app /app
CMD ["/app"]
```

### Pattern 3: Build Cache Optimization

```dockerfile
# Stage 1: Download dependencies (cached)
FROM golang:1.21 AS modules
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

# Stage 2: Build
FROM golang:1.21 AS builder
WORKDIR /app
COPY --from=modules /go/pkg /go/pkg
COPY . .
RUN go build -o app

# Stage 3: Final
FROM alpine:latest
COPY --from=builder /app/app /app
CMD ["/app"]
```

## Real-World Example: Full-Stack Application

**Dockerfile for React + Node.js:**

```dockerfile
# Stage 1: Build Frontend
FROM node:18 AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:18 AS backend-builder
WORKDIR /backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Stage 3: Production
FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-builder /backend ./

# Copy frontend build
COPY --from=frontend-builder /frontend/build ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "server.js"]
```

## Verification and Comparison

**Create comparison test:**

```bash
# Create a test app
mkdir -p ~/multi-stage-test
cd ~/multi-stage-test

# Create single-stage Dockerfile
cat > Dockerfile.single <<EOF
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]
EOF

# Create multi-stage Dockerfile
cat > Dockerfile.multi <<EOF
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/*.js ./
CMD ["node", "index.js"]
EOF

# Build both
docker build -f Dockerfile.single -t app:single .
docker build -f Dockerfile.multi -t app:multi .

# Compare sizes
docker images | grep app

# You'll see multi-stage is significantly smaller!
```

## Best Practices

### 1. Name Your Stages

```dockerfile
FROM node:18 AS dependencies  # Clear purpose
FROM node:18 AS builder       # Clear purpose
FROM node:18-alpine AS production  # Clear purpose
```

### 2. Use Specific Base Images

```dockerfile
# Good - specific versions
FROM golang:1.21-alpine AS builder
FROM alpine:3.18 AS final

# Bad - unversioned
FROM golang AS builder
FROM alpine AS final
```

### 3. Minimize Final Stage

```dockerfile
# Only copy what's absolutely necessary
COPY --from=builder /app/binary /app/binary
# Don't copy: source code, build tools, test files
```

### 4. Use .dockerignore

```text
node_modules
.git
*.md
tests/
docs/
```

### 5. Layer Caching

```dockerfile
# Copy dependencies first (cached)
COPY package*.json ./
RUN npm ci

# Copy code later (changes frequently)
COPY . .
```

## Common Patterns Summary

### Compiled Languages (Go, Rust, C++)
```dockerfile
FROM builder-image AS builder
# Build binary

FROM scratch or alpine
COPY --from=builder /binary
```

### Interpreted Languages (Node, Python)
```dockerfile
FROM full-image AS builder
# Install all dependencies

FROM slim-image
COPY --from=builder /dependencies
COPY code
```

### Frontend Applications
```dockerfile
FROM node AS builder
# Build static files

FROM nginx:alpine
COPY --from=builder /build /usr/share/nginx/html
```

## Troubleshooting

### Issue: COPY --from failed

```dockerfile
# Error: COPY failed: stat /app/dist: no such file or directory

# Solution: Check the path exists in the builder stage
FROM node:18 AS builder
RUN npm run build  # Ensure this creates /app/dist
```

### Issue: Missing Dependencies in Final Stage

```dockerfile
# Error: Module not found

# Solution: Copy all necessary dependencies
COPY --from=builder /app/node_modules ./node_modules
```

### Issue: Binary Won't Run (Go)

```dockerfile
# Error: exec format error

# Solution: Match target architecture
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build
```

## Practice Exercises

### Exercise 1: Optimize Existing Dockerfile

Convert a single-stage Dockerfile to multi-stage and measure size reduction.

### Exercise 2: Create Test Stage

Add a testing stage that runs before production build.

### Exercise 3: Multiple Targets

Create a Dockerfile with development, testing, and production targets.

## Image Size Comparison

| Language   | Single-Stage | Multi-Stage | Reduction |
|------------|--------------|-------------|-----------|
| Node.js    | 1.2 GB       | 200 MB      | 83%       |
| Go         | 800 MB       | 10 MB       | 99%       |
| Python     | 900 MB       | 150 MB      | 83%       |
| React      | 2.5 GB       | 25 MB       | 99%       |

## Next Steps

You've mastered multi-stage builds! Continue to:
- **Tutorial 05**: Docker Compose for multi-container applications
- **Tutorial 06**: Build a complete multi-service application
- **Tutorial 07**: Persistent data with volumes

## Key Takeaways

1. Multi-stage builds drastically reduce image size
2. Use builder stages for compilation and dependencies
3. Final stage should only contain runtime requirements
4. Named stages improve readability
5. `--target` flag builds specific stages
6. Perfect for separating build and runtime environments
7. Significantly improves security (smaller attack surface)
8. Single Dockerfile for all environments
9. Faster deployment and scaling
10. Essential for production containerization
