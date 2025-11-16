# Tutorial 14: Multi-Architecture Builds

## Objectives
- Build images for multiple architectures
- Support amd64, arm64, and other platforms
- Use Docker Buildx for multi-platform builds
- Create manifest lists for unified image distribution
- Optimize builds for different architectures

## Prerequisites
- Completed Tutorial 13 (Security)
- Docker Desktop or Docker with Buildx
- Understanding of CPU architectures

## Why Multi-Architecture?

Modern applications run on:
- **amd64 (x86_64)**: Traditional servers, most cloud VMs
- **arm64 (aarch64)**: Apple Silicon, AWS Graviton, Raspberry Pi
- **arm/v7**: Older Raspberry Pi, IoT devices
- **arm/v6**: Raspberry Pi Zero
- **ppc64le**: IBM Power Systems
- **s390x**: IBM Z mainframes

## Setup Docker Buildx

```bash
# Check if buildx is available
docker buildx version

# Create new builder
docker buildx create --name multiarch --driver docker-container --use

# Start the builder
docker buildx inspect --bootstrap

# List available platforms
docker buildx ls

# Inspect builder
docker buildx inspect multiarch
```

## Basic Multi-Arch Build

### Simple Example

```bash
# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t myapp:latest \
  --push \
  .
```

### Dockerfile for Multi-Arch

```dockerfile
FROM --platform=$BUILDPLATFORM golang:1.21-alpine AS builder

# Build arguments for cross-compilation
ARG TARGETOS
ARG TARGETARCH
ARG TARGETVARIANT

WORKDIR /app

COPY go.* ./
RUN go mod download

COPY . .

# Cross-compile for target platform
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -o app .

# Final minimal image
FROM alpine:latest

COPY --from=builder /app/app /app

CMD ["/app"]
```

## Platform-Specific Builds

### Using Build Arguments

```dockerfile
FROM --platform=$BUILDPLATFORM node:18 AS builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM

RUN echo "Building on $BUILDPLATFORM for $TARGETPLATFORM"

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

CMD ["node", "dist/server.js"]
```

### Platform-Specific Logic

```dockerfile
FROM --platform=$BUILDPLATFORM ubuntu:22.04 AS builder

ARG TARGETARCH

WORKDIR /app

# Install platform-specific dependencies
RUN if [ "$TARGETARCH" = "amd64" ]; then \
      apt-get update && apt-get install -y special-tool-amd64; \
    elif [ "$TARGETARCH" = "arm64" ]; then \
      apt-get update && apt-get install -y special-tool-arm64; \
    fi

COPY . .

RUN make build

FROM ubuntu:22.04-slim

COPY --from=builder /app/output /app

CMD ["/app"]
```

## Go Multi-Arch Example

```dockerfile
# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM golang:1.21-alpine AS builder

ARG TARGETOS
ARG TARGETARCH
ARG TARGETVARIANT

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build for target platform
RUN CGO_ENABLED=0 \
    GOOS=${TARGETOS} \
    GOARCH=${TARGETARCH} \
    GOARM=${TARGETVARIANT#v} \
    go build -ldflags="-w -s" -o app .

# Minimal final image
FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/app /app

EXPOSE 8080

ENTRYPOINT ["/app"]
```

Build:
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t username/myapp:latest \
  --push \
  .
```

## Python Multi-Arch Example

```dockerfile
FROM --platform=$BUILDPLATFORM python:3.9-alpine AS builder

ARG TARGETPLATFORM

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev linux-headers

COPY requirements.txt .

# Create wheel packages for faster installation
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# Final image
FROM python:3.9-alpine

WORKDIR /app

# Copy wheels and install
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/* && \
    rm -rf /wheels

COPY . .

CMD ["python", "app.py"]
```

## Node.js Multi-Arch Example

```dockerfile
FROM --platform=$BUILDPLATFORM node:18 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Production image
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src ./src

USER node

CMD ["node", "src/server.js"]
```

## Docker Compose with Multi-Arch

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      platforms:
        - linux/amd64
        - linux/arm64
        - linux/arm/v7
    image: myapp:latest
    ports:
      - "3000:3000"
```

Build:
```bash
docker buildx bake --push
```

## Building Strategies

### 1. Build and Push

```bash
# Build for multiple platforms and push
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t username/myapp:latest \
  --push \
  .
```

### 2. Build and Load (Single Platform)

```bash
# Build for current platform and load to docker
docker buildx build \
  --platform linux/amd64 \
  -t myapp:latest \
  --load \
  .
```

### 3. Build to Registry

```bash
# Build and push to custom registry
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t registry.example.com/myapp:latest \
  --push \
  .
```

### 4. Build to File

```bash
# Export to tar file
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myapp:latest \
  --output type=docker,dest=myapp.tar \
  .
```

## Manifest Inspection

```bash
# View manifest list
docker buildx imagetools inspect username/myapp:latest

# View specific platform
docker buildx imagetools inspect username/myapp:latest --format '{{json .Manifest}}'

# Pull specific platform
docker pull --platform linux/arm64 username/myapp:latest
```

## Advanced: QEMU for Emulation

```bash
# Install QEMU emulators
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes

# Verify available platforms
docker buildx ls

# Now can build for any platform
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7,linux/ppc64le \
  -t myapp:latest \
  --push \
  .
```

## Optimization Tips

### 1. Cache Mounts

```dockerfile
FROM --platform=$BUILDPLATFORM golang:1.21 AS builder

ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

# Use cache mounts for go modules
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download

COPY . .

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -o app .
```

### 2. Parallel Builds

```bash
# Use multiple builders for parallel builds
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --builder multiarch \
  --jobs 4 \
  -t myapp:latest \
  --push \
  .
```

### 3. Platform-Specific Base Images

```dockerfile
ARG TARGETARCH

FROM node:18-alpine AS base-amd64
# amd64 specific setup

FROM node:18-alpine AS base-arm64
# arm64 specific setup

FROM base-${TARGETARCH} AS final
WORKDIR /app
COPY . .
CMD ["node", "server.js"]
```

## Complete Example: Multi-Arch Web App

```dockerfile
# syntax=docker/dockerfile:1

# Build stage
FROM --platform=$BUILDPLATFORM node:18 AS builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM

RUN echo "Building on $BUILDPLATFORM for $TARGETPLATFORM"

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Copy source
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

# Add labels
LABEL org.opencontainers.image.source="https://github.com/username/myapp"
LABEL org.opencontainers.image.description="Multi-arch web application"

WORKDIR /app

# Copy from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:3000/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

CMD ["node", "dist/server.js"]
```

Build and push:
```bash
# Create and use builder
docker buildx create --name multiarch --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t username/webapp:latest \
  -t username/webapp:1.0.0 \
  --push \
  --cache-from type=registry,ref=username/webapp:cache \
  --cache-to type=registry,ref=username/webapp:cache,mode=max \
  .
```

## Testing Multi-Arch Images

```bash
# Test amd64
docker run --rm --platform linux/amd64 username/myapp:latest

# Test arm64
docker run --rm --platform linux/arm64 username/myapp:latest

# Test arm/v7
docker run --rm --platform linux/arm/v7 username/myapp:latest
```

## GitHub Actions Multi-Arch Build

```yaml
name: Multi-Arch Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          platforms: linux/amd64,linux/arm64,linux/arm/v7
          push: true
          tags: |
            username/myapp:latest
            username/myapp:${{ github.sha }}
          cache-from: type=registry,ref=username/myapp:cache
          cache-to: type=registry,ref=username/myapp:cache,mode=max
```

## Best Practices

1. **Use BuildKit**: Always use `docker buildx`
2. **Cache Layers**: Use `--cache-from` and `--cache-to`
3. **Test All Platforms**: Don't assume cross-platform compatibility
4. **Optimize Base Images**: Use platform-specific base images when needed
5. **Document Requirements**: Note platform-specific dependencies
6. **CI/CD Integration**: Automate multi-arch builds
7. **Manifest Lists**: Create unified images with manifest lists
8. **Resource Consideration**: arm builds may be slower

## Next Steps

- **Tutorial 15**: Registry operations

## Key Takeaways

1. Docker Buildx enables multi-platform builds
2. Use --platform flag for target architectures
3. ARG TARGETARCH for platform-specific logic
4. Test all target platforms
5. Manifest lists unify multi-arch images
6. QEMU enables cross-platform building
7. Cache optimization critical for speed
8. Automate with CI/CD
9. Support amd64 and arm64 at minimum
10. Multi-arch essential for modern deployments
