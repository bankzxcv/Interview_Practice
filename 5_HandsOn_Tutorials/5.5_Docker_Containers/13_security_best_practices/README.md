# Tutorial 13: Security Best Practices

## Objectives
- Implement Docker security best practices
- Use non-root users in containers
- Scan images for vulnerabilities
- Manage secrets securely
- Harden container configurations

## Prerequisites
- Completed Tutorial 12 (Resource Limits)
- Understanding of security concepts
- Basic cryptography knowledge

## Security Principles

1. **Least Privilege**: Minimal permissions needed
2. **Defense in Depth**: Multiple security layers
3. **Minimize Attack Surface**: Reduce exposed components
4. **Regular Updates**: Keep images and dependencies current
5. **Secrets Management**: Never hardcode credentials

## 1. Use Non-Root Users

### Bad Practice

```dockerfile
FROM ubuntu:22.04
COPY app /app
CMD ["/app"]
# Runs as root! ❌
```

### Good Practice

```dockerfile
FROM ubuntu:22.04

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set ownership
COPY --chown=appuser:appuser app /app

# Switch to non-root user
USER appuser

CMD ["/app"]
```

### Complete Example

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies as root
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

CMD ["node", "server.js"]
```

## 2. Use Minimal Base Images

### Image Size Comparison

```dockerfile
# ❌ Large, many vulnerabilities
FROM ubuntu:22.04        # ~77MB

# ✅ Better
FROM ubuntu:22.04-slim   # ~28MB

# ✅ Even better
FROM node:18-alpine      # ~170MB vs 1GB

# ✅ Best for static binaries
FROM scratch             # ~0MB + your app
FROM distroless          # ~20MB, no shell
```

### Example with Alpine

```dockerfile
# Multi-stage build with Alpine
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o app

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/app /app
USER nobody
CMD ["/app"]
```

### Example with Distroless

```dockerfile
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o app

FROM gcr.io/distroless/static-debian11
COPY --from=builder /app/app /app
USER nonroot:nonroot
CMD ["/app"]
```

## 3. Scan for Vulnerabilities

### Using Docker Scout

```bash
# Enable Docker Scout
docker scout quickview

# Scan image
docker scout cves myapp:latest

# Scan and get recommendations
docker scout recommendations myapp:latest

# Compare with base image
docker scout compare myapp:latest --to node:18-alpine
```

### Using Trivy

```bash
# Install Trivy
docker run aquasec/trivy image myapp:latest

# Scan for critical vulnerabilities
docker run aquasec/trivy image --severity CRITICAL,HIGH myapp:latest

# Scan filesystem
trivy fs .

# Output as JSON
trivy image -f json -o results.json myapp:latest
```

### Using Snyk

```bash
# Scan image
snyk container test myapp:latest

# Monitor image
snyk container monitor myapp:latest

# Scan Dockerfile
snyk iac test Dockerfile
```

### Automated Scanning in CI/CD

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
```

## 4. Secure Secrets Management

### ❌ Never Do This

```dockerfile
# DON'T hardcode secrets!
ENV API_KEY=sk_live_abc123
ENV DATABASE_PASSWORD=secret123
```

```yaml
# DON'T commit secrets!
services:
  app:
    environment:
      - DB_PASSWORD=mysecret
```

### ✅ Use Docker Secrets

```yaml
version: '3.8'

services:
  app:
    image: myapp
    secrets:
      - db_password
      - api_key
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
      - API_KEY_FILE=/run/secrets/api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    external: true
```

### ✅ Use BuildKit Secrets

```dockerfile
# syntax=docker/dockerfile:1

FROM python:3.9

WORKDIR /app

# Use secret during build (not stored in image)
RUN --mount=type=secret,id=pip_token \
    pip config set global.extra-index-url \
    https://$(cat /run/secrets/pip_token)@pypi.example.com/simple
```

Build:
```bash
DOCKER_BUILDKIT=1 docker build \
  --secret id=pip_token,src=token.txt \
  -t myapp .
```

### ✅ Environment Files

```bash
# .env (gitignored)
DB_PASSWORD=actual-secret
API_KEY=actual-key
```

```yaml
services:
  app:
    env_file:
      - .env  # Never commit this file!
```

## 5. Read-Only Filesystem

```yaml
services:
  app:
    image: myapp
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
```

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN chmod -R 755 /app
USER node

# App must not write to filesystem except /tmp
CMD ["node", "server.js"]
```

## 6. Drop Capabilities

```yaml
services:
  app:
    image: myapp
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # Only if needed for port < 1024
```

```bash
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp
```

## 7. Secure Dockerfile Practices

```dockerfile
# ✅ Use specific versions
FROM node:18.17.0-alpine3.18

# ✅ Verify checksums
ADD --checksum=sha256:abc123... https://example.com/file.tar.gz /tmp/

# ✅ Don't run unnecessary services
# No SSH, no cron, no syslog

# ✅ Remove package manager caches
RUN apt-get update && \
    apt-get install -y package && \
    rm -rf /var/lib/apt/lists/*

# ✅ Use COPY instead of ADD
COPY app.py /app/

# ✅ Set file permissions explicitly
COPY --chmod=755 script.sh /usr/local/bin/

# ✅ Create dedicated user
RUN useradd -r -u 1000 -m appuser
USER appuser

# ✅ Use HEALTHCHECK
HEALTHCHECK CMD curl -f http://localhost/ || exit 1

# ✅ Minimize layers
RUN apt-get update && \
    apt-get install -y curl vim && \
    rm -rf /var/lib/apt/lists/*
```

## 8. Network Security

```yaml
version: '3.8'

services:
  web:
    networks:
      - public

  api:
    networks:
      - public
      - internal

  db:
    networks:
      - internal  # Not accessible from public

networks:
  public:
    driver: bridge

  internal:
    driver: bridge
    internal: true  # No external access
```

## 9. Resource Limits (Security Aspect)

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
          pids: 100
    ulimits:
      nofile:
        soft: 1024
        hard: 2048
    security_opt:
      - no-new-privileges:true
```

## 10. Content Trust

```bash
# Enable Docker Content Trust
export DOCKER_CONTENT_TRUST=1

# Only pull signed images
docker pull myimage:latest

# Sign and push images
docker trust sign myimage:latest
docker push myimage:latest
```

## Complete Secure Example

```dockerfile
# syntax=docker/dockerfile:1

# Use specific version
FROM node:18.17.0-alpine3.18 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with audit
RUN npm ci --only=production && \
    npm audit --audit-level=high && \
    npm cache clean --force

# Copy application
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18.17.0-alpine3.18

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy only necessary files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Run application
CMD ["node", "dist/server.js"]
```

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: myapp:${VERSION}
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
          pids: 100
    environment:
      - NODE_ENV=production
    secrets:
      - db_password
    networks:
      - internal
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3

secrets:
  db_password:
    external: true

networks:
  internal:
    driver: bridge
```

## Security Checklist

- [ ] Use non-root user
- [ ] Use minimal base images (Alpine/Distroless)
- [ ] Scan for vulnerabilities regularly
- [ ] Never hardcode secrets
- [ ] Use specific image versions
- [ ] Implement read-only filesystem
- [ ] Drop unnecessary capabilities
- [ ] Set resource limits
- [ ] Enable health checks
- [ ] Use internal networks
- [ ] Regular security updates
- [ ] Enable Content Trust
- [ ] Implement proper logging
- [ ] Use security scanning in CI/CD
- [ ] Follow CIS Docker Benchmark

## Security Tools

```bash
# Docker Bench Security
docker run --rm --net host --pid host --userns host --cap-add audit_control \
  -v /var/lib:/var/lib \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /etc:/etc \
  docker/docker-bench-security

# Hadolint (Dockerfile linter)
docker run --rm -i hadolint/hadolint < Dockerfile

# Dockle (Container linter)
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  goodwithtech/dockle myapp:latest
```

## Next Steps

- **Tutorial 14**: Multi-arch builds
- **Tutorial 15**: Registry operations

## Key Takeaways

1. Always run as non-root user
2. Use minimal base images
3. Scan for vulnerabilities regularly
4. Never commit secrets
5. Use read-only filesystems
6. Drop unnecessary capabilities
7. Implement resource limits
8. Use network isolation
9. Regular security updates
10. Automate security scanning
