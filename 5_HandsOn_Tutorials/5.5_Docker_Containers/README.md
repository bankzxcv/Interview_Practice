# 5.5 Docker & Containers - Hands-On Tutorials

## Overview

15 incremental tutorials covering Docker from basics to advanced concepts. Learn containerization, Docker Compose, networking, volumes, security, and production best practices.

## Prerequisites

```bash
# Install Docker Desktop (includes docker-compose)
# macOS: Download from docker.com
brew install --cask docker

# Verify installation
docker --version
docker-compose --version

# Test Docker
docker run hello-world
```

## Tutorial Progression

### Foundation (Tutorials 1-3)
| # | Tutorial | Concepts | Time |
|---|----------|----------|------|
| 01 | [Basic Container](./01_basic_container/) | Images, containers, run, exec | 15 min |
| 02 | [Dockerfile](./02_dockerfile/) | Building images, layers, Dockerfile commands | 20 min |
| 03 | [Multi-Stage Builds](./03_multi_stage_builds/) | Optimization, smaller images, security | 25 min |

### Docker Compose (Tutorials 4-9)
| # | Tutorial | Concepts | Time |
|---|----------|----------|------|
| 04 | [Compose Basic](./04_docker_compose_basic/) | docker-compose.yml, services | 20 min |
| 05 | [Multi-Service](./05_docker_compose_multi_service/) | Frontend, backend, database | 30 min |
| 06 | [Volumes](./06_docker_compose_volumes/) | Persistence, bind mounts, named volumes | 25 min |
| 07 | [Networks](./07_docker_compose_networks/) | Network isolation, inter-service communication | 25 min |
| 08 | [Environment Variables](./08_docker_compose_env_vars/) | .env files, secrets, configuration | 20 min |
| 09 | [Full Stack App](./09_docker_compose_full_stack/) | Complete MERN/PERN stack | 45 min |

### Advanced Topics (Tutorials 10-15)
| # | Tutorial | Concepts | Time |
|---|----------|----------|------|
| 10 | [Health Checks](./10_healthchecks/) | Container health, dependencies | 20 min |
| 11 | [Networking Deep Dive](./11_container_networking/) | Bridge, host, overlay networks | 30 min |
| 12 | [Volumes & Bind Mounts](./12_volumes_bind_mounts/) | Storage drivers, volume drivers | 25 min |
| 13 | [Docker Registry](./13_docker_registry/) | Private registry, pushing/pulling | 30 min |
| 14 | [BuildX & Multi-Arch](./14_buildx_multiarch/) | Cross-platform builds, BuildKit | 35 min |
| 15 | [Security Best Practices](./15_security_best_practices/) | Scanning, non-root, secrets | 40 min |

## Incremental Learning Pattern

```
Tutorial 01: Simple container
Tutorial 02: Container + Custom image
Tutorial 03: Container + Optimized image
Tutorial 04: Multi-container app (Compose)
Tutorial 05: Multi-container + Multiple services
Tutorial 06: Multi-container + Persistence
Tutorial 07: Multi-container + Network isolation
Tutorial 08: Multi-container + Configuration
Tutorial 09: Complete production-like stack
Tutorial 10-15: Production-ready patterns
```

## Structure of Each Tutorial

```
XX_topic_name/
├── README.md           # Instructions and explanations
├── Dockerfile          # Docker image definition
├── docker-compose.yml  # Multi-container setup
├── .dockerignore       # Files to exclude
├── .env.example        # Example environment variables
├── app/                # Application code
│   ├── server.js
│   └── package.json
└── scripts/
    ├── build.sh       # Build helper
    └── cleanup.sh     # Cleanup helper
```

## Essential Docker Commands

### Images
```bash
# List images
docker images

# Pull image
docker pull <image>:<tag>

# Build image
docker build -t <name>:<tag> .

# Remove image
docker rmi <image-id>

# Remove unused images
docker image prune -a
```

### Containers
```bash
# Run container
docker run -d -p 8080:80 --name myapp nginx

# List running containers
docker ps

# List all containers
docker ps -a

# Stop container
docker stop <container-id>

# Remove container
docker rm <container-id>

# View logs
docker logs -f <container-id>

# Execute command in container
docker exec -it <container-id> /bin/bash

# Inspect container
docker inspect <container-id>
```

### Docker Compose
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild and start
docker-compose up -d --build

# Scale services
docker-compose up -d --scale web=3

# View service status
docker-compose ps
```

### Cleanup
```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Remove all unused networks
docker network prune

# Remove everything
docker system prune -a --volumes
```

## Best Practices Covered

### Image Optimization
- ✅ Multi-stage builds for smaller images
- ✅ Layer caching strategies
- ✅ .dockerignore for build context
- ✅ Minimal base images (alpine, distroless)
- ✅ Combining RUN commands
- ✅ Ordering layers by change frequency

### Security
- ✅ Non-root users in containers
- ✅ Scanning images for vulnerabilities
- ✅ Secrets management (not in images!)
- ✅ Read-only root filesystems
- ✅ Limiting capabilities
- ✅ Using trusted base images

### Networking
- ✅ Network isolation between services
- ✅ Service discovery by name
- ✅ Port mapping best practices
- ✅ Bridge vs host vs overlay networks
- ✅ Internal vs external networks

### Storage
- ✅ Named volumes for data persistence
- ✅ Bind mounts for development
- ✅ tmpfs mounts for sensitive data
- ✅ Volume drivers for cloud storage
- ✅ Backup and restore strategies

### Development Workflow
- ✅ Hot reload with bind mounts
- ✅ Environment-specific configs
- ✅ Debug containers
- ✅ Development vs production images
- ✅ CI/CD integration

## Example: Simple Web Application

### Tutorial 01 - Basic Container

```bash
# Run nginx
docker run -d -p 8080:80 --name web nginx

# Access at http://localhost:8080

# View logs
docker logs -f web

# Stop and remove
docker stop web && docker rm web
```

### Tutorial 02 - Custom Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

```bash
# Build
docker build -t myapp:1.0 .

# Run
docker run -d -p 3000:3000 --name myapp myapp:1.0
```

### Tutorial 04 - Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./app:/app
      - /app/node_modules
```

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop
docker-compose down
```

## Common Patterns

### 1. Full-Stack Application (MERN)

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  backend:
    build: ./backend
    depends_on:
      - mongo
    environment:
      MONGO_URL: mongodb://admin:password@mongo:27017

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mongo-data:
```

### 2. Development with Hot Reload

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: development
    volumes:
      - ./src:/app/src      # Bind mount for hot reload
      - /app/node_modules    # Anonymous volume to preserve node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```

### 3. Production Build

```dockerfile
# Multi-stage Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
USER nodejs
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## Troubleshooting

### Common Issues

**Port already in use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port in docker-compose
```

**Container exits immediately**
```bash
# Check logs
docker logs <container-id>

# Run interactively to debug
docker run -it <image> /bin/sh
```

**Build context too large**
```bash
# Create .dockerignore
echo "node_modules" >> .dockerignore
echo ".git" >> .dockerignore
echo "*.log" >> .dockerignore
```

**Cannot connect to Docker daemon**
```bash
# Ensure Docker Desktop is running
# macOS: Check Docker Desktop app

# Linux: Start Docker service
sudo systemctl start docker
```

## Tips for Success

1. **Read Dockerfile Best Practices**: Official Docker docs are excellent
2. **Use .dockerignore**: Speed up builds and reduce image size
3. **Layer Caching**: Order Dockerfile commands from least to most frequently changing
4. **Name Everything**: Containers, volumes, networks - easier to manage
5. **Use Tags**: Always tag images with version numbers
6. **Clean Up Regularly**: Run `docker system prune` periodically
7. **Learn docker-compose**: Essential for multi-container apps

## Recommended Study Path

### Week 1: Basics
- Days 1-2: Tutorials 1-3 (Containers and images)
- Days 3-5: Tutorials 4-6 (Docker Compose basics)
- Weekend: Build a simple web app

### Week 2: Intermediate
- Days 1-3: Tutorials 7-9 (Advanced Compose)
- Days 4-5: Tutorial 10-12 (Health checks, networking, volumes)
- Weekend: Build a full-stack app

### Week 3: Advanced
- Days 1-3: Tutorials 13-15 (Registry, multi-arch, security)
- Days 4-5: Review and practice
- Weekend: Containerize a real project

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Play with Docker](https://labs.play-with-docker.com/)

## What You'll Master

After completing all tutorials:
- ✅ Build and run containers
- ✅ Write optimized Dockerfiles
- ✅ Use multi-stage builds
- ✅ Orchestrate multi-container applications
- ✅ Manage volumes and networks
- ✅ Implement health checks
- ✅ Follow security best practices
- ✅ Build cross-platform images
- ✅ Set up private registries
- ✅ Containerize any application

## Next Steps

1. Start with [01_basic_container](./01_basic_container/)
2. Work through sequentially
3. Build real projects between tutorials
4. Move to Kubernetes (Topic 5.2) for orchestration
5. Learn CI/CD (Topic 5.6) for automated builds

---

**Total Tutorials**: 15
**Estimated Time**: 30-40 hours
**Difficulty**: Beginner to Advanced
**Cost**: Free (runs locally)
