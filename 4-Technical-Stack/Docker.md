# Docker Cheatsheet - Quick Reference

> **Official Documentation:**
> - [Docker Docs](https://docs.docker.com/) | [Docker Hub](https://hub.docker.com/)
> - [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/) | [Docker Compose](https://docs.docker.com/compose/)

Comprehensive Docker guide for containerization, images, networking, and orchestration.

---

## Table of Contents

1. [Docker Basics](#docker-basics)
2. [Images](#images)
3. [Containers](#containers)
4. [Dockerfile](#dockerfile)
5. [Volumes & Networking](#volumes--networking)
6. [Docker Compose](#docker-compose)
7. [Best Practices](#best-practices)

---

## Docker Basics

```bash
# Installation (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Version
docker --version
docker version
docker info

# Help
docker --help
docker run --help
```

---

## Images

```bash
# Pull image from Docker Hub
docker pull ubuntu:22.04
docker pull nginx:latest
docker pull postgres:15-alpine

# List images
docker images
docker image ls

# Remove image
docker rmi image_name
docker rmi image_id
docker image rm nginx:latest

# Remove unused images
docker image prune
docker image prune -a  # All unused

# Search images
docker search nginx

# Image history
docker history nginx:latest

# Inspect image
docker inspect nginx:latest

# Tag image
docker tag nginx:latest myregistry/nginx:v1.0

# Push to registry
docker login
docker push myregistry/nginx:v1.0

# Save/Load images (offline transfer)
docker save nginx:latest > nginx.tar
docker load < nginx.tar

# Export/Import containers
docker export container_name > container.tar
docker import container.tar
```

---

## Containers

```bash
# Run container
docker run nginx
docker run -d nginx                    # Detached mode
docker run -d --name my-nginx nginx    # Named container
docker run -d -p 8080:80 nginx         # Port mapping
docker run -d -p 8080:80 -p 443:443 nginx  # Multiple ports
docker run -d -e ENV_VAR=value nginx   # Environment variable
docker run -d -v /host/path:/container/path nginx  # Volume mount

# Interactive mode
docker run -it ubuntu bash             # Interactive terminal
docker run -it --rm ubuntu bash        # Remove after exit

# Run with resource limits
docker run -d --memory="512m" --cpus="1.5" nginx

# List containers
docker ps                              # Running only
docker ps -a                           # All (including stopped)
docker ps -q                           # IDs only

# Start/Stop/Restart
docker start container_name
docker stop container_name
docker restart container_name
docker pause container_name
docker unpause container_name

# Remove container
docker rm container_name
docker rm -f container_name            # Force remove running
docker container prune                 # Remove all stopped

# Execute command in running container
docker exec -it container_name bash
docker exec container_name ls -la
docker exec -it container_name sh      # For alpine-based

# View logs
docker logs container_name
docker logs -f container_name          # Follow (tail)
docker logs --tail 100 container_name  # Last 100 lines
docker logs --since 1h container_name  # Last hour

# Container stats
docker stats
docker stats container_name

# Inspect container
docker inspect container_name
docker inspect --format '{{.NetworkSettings.IPAddress}}' container_name

# Copy files
docker cp container_name:/path/file.txt ./local/
docker cp ./local/file.txt container_name:/path/

# Commit container to image
docker commit container_name my-image:v1.0
```

### Visual: Container Lifecycle

```
LIFECYCLE:

Created ──> Running ──> Paused ──> Running ──> Stopped ──> Removed
   ↑           │          ↑           │           │
   │           └──────────┘           │           │
   └──────────────────────────────────┘           │
                  restart                         │
                                                  │
                                               docker rm
```

---

## Dockerfile

```dockerfile
# Base image
FROM ubuntu:22.04
FROM node:18-alpine AS builder      # Multi-stage build

# Metadata
LABEL maintainer="dev@example.com"
LABEL version="1.0"

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Working directory
WORKDIR /app

# Copy files
COPY package.json package-lock.json ./
COPY . .

# Run commands
RUN apt-get update && apt-get install -y curl
RUN npm install --production
RUN npm run build

# Expose ports
EXPOSE 3000
EXPOSE 80 443

# Volume mount points
VOLUME ["/data"]

# User (security)
USER node

# Entrypoint (fixed command)
ENTRYPOINT ["node"]

# CMD (default arguments, can override)
CMD ["server.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Multi-Stage Build

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
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

```bash
# Build image
docker build -t my-app:latest .
docker build -t my-app:v1.0 -f Dockerfile.prod .
docker build --no-cache -t my-app:latest .

# Build with build args
docker build --build-arg NODE_VERSION=18 -t my-app .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t my-app .
```

### Visual: Multi-Stage Build

```
SINGLE STAGE (Large image):
┌─────────────────────────────────┐
│ FROM node:18                    │
│                                 │
│ - node_modules (dev + prod)     │
│ - source files                  │
│ - build tools                   │
│ - Final app                     │
│                                 │
│ Size: 1.2GB                     │
└─────────────────────────────────┘

MULTI-STAGE (Optimized):
┌─────────────────┐    ┌──────────────────┐
│ Stage 1: Build  │    │ Stage 2: Runtime │
│                 │    │                  │
│ - Build tools   │───>│ - Only runtime   │
│ - Dependencies  │    │ - Production deps│
│ - Compile       │    │ - Final app only │
│                 │    │                  │
│ Size: 1.2GB     │    │ Size: 200MB      │
└─────────────────┘    └──────────────────┘
                         (This is deployed)
```

---

## Volumes & Networking

### Volumes

```bash
# Create volume
docker volume create my-vol

# List volumes
docker volume ls

# Inspect volume
docker volume inspect my-vol

# Remove volume
docker volume rm my-vol
docker volume prune  # Remove unused

# Use volume
docker run -d -v my-vol:/data nginx
docker run -d --mount source=my-vol,target=/data nginx

# Bind mount (host directory)
docker run -d -v /host/path:/container/path nginx
docker run -d -v $(pwd):/app node:18

# Read-only volume
docker run -d -v my-vol:/data:ro nginx

# tmpfs mount (memory)
docker run -d --tmpfs /tmp nginx
```

### Networking

```bash
# List networks
docker network ls

# Create network
docker network create my-network
docker network create --driver bridge my-bridge

# Inspect network
docker network inspect my-network

# Connect container to network
docker network connect my-network container_name

# Disconnect
docker network disconnect my-network container_name

# Run container on network
docker run -d --network my-network nginx

# Remove network
docker network rm my-network
docker network prune  # Remove unused
```

### Network Drivers

```
BRIDGE (default):
┌─────────────────────────────────┐
│        Docker Host              │
│  ┌────────┐      ┌────────┐    │
│  │ Cont 1 │──────│ Cont 2 │    │
│  └────┬───┘      └────┬───┘    │
│       └──────┬────────┘         │
│              │                  │
│       ┌──────▼──────┐           │
│       │   Bridge    │           │
│       └──────┬──────┘           │
└──────────────┼──────────────────┘
               │
          ┌────▼────┐
          │ Network │
          └─────────┘

HOST:
Container uses host's network directly
No network isolation

NONE:
No network access

OVERLAY:
Multi-host communication (Swarm)

MACVLAN:
Container gets own MAC address
```

```bash
# Bridge network (default)
docker run -d --network bridge nginx

# Host network
docker run -d --network host nginx

# Container network
docker run -d --network container:container_name nginx

# Custom bridge
docker network create --driver bridge --subnet 172.18.0.0/16 my-bridge
docker run -d --network my-bridge --ip 172.18.0.10 nginx
```

---

## Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://db:5432/mydb
    depends_on:
      - db
      - redis
    volumes:
      - ./src:/app/src
    networks:
      - app-network
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    networks:
      - app-network
    volumes:
      - redis-data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
    networks:
      - app-network

volumes:
  postgres-data:
  redis-data:

networks:
  app-network:
    driver: bridge
```

```bash
# Start services
docker-compose up
docker-compose up -d                 # Detached
docker-compose up --build            # Rebuild images
docker-compose up --scale web=3      # Scale service

# Stop services
docker-compose stop
docker-compose down                  # Stop and remove
docker-compose down -v               # Remove volumes too

# View logs
docker-compose logs
docker-compose logs -f web           # Follow web service
docker-compose logs --tail 100

# Execute commands
docker-compose exec web bash
docker-compose exec db psql -U user mydb

# List services
docker-compose ps

# Restart services
docker-compose restart
docker-compose restart web

# Build
docker-compose build
docker-compose build --no-cache
```

---

## Best Practices

### 1. Use Specific Tags

```dockerfile
# Bad
FROM node:latest

# Good
FROM node:18.19.0-alpine
```

### 2. Minimize Layers

```dockerfile
# Bad - 3 layers
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y vim

# Good - 1 layer
RUN apt-get update && \
    apt-get install -y curl vim && \
    rm -rf /var/lib/apt/lists/*
```

### 3. Use .dockerignore

```
# .dockerignore
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
.env
*.md
```

### 4. Don't Run as Root

```dockerfile
# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Switch to user
USER appuser

# Run as non-root
WORKDIR /app
COPY --chown=appuser:appgroup . .
```

### 5. Use Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1
```

### 6. Optimize Caching

```dockerfile
# Copy dependencies first (cached if unchanged)
COPY package*.json ./
RUN npm install

# Then copy source code
COPY . .
```

### 7. Security Scanning

```bash
# Scan image for vulnerabilities
docker scan my-image:latest

# Use minimal base images
FROM alpine:3.19
FROM node:18-alpine
FROM python:3.11-slim
```

---

**Last updated:** 2025-11-15
