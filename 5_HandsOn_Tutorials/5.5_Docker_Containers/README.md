# 5.5 Docker & Containers - Comprehensive Tutorials

## Overview

15 comprehensive, production-ready tutorials covering Docker from fundamentals to advanced concepts. Each tutorial includes detailed explanations, working code examples, and practical exercises that build upon previous lessons.

## Prerequisites

```bash
# Install Docker Desktop (includes docker-compose)
# macOS: Download from docker.com
brew install --cask docker

# Linux: Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify installation
docker --version
docker-compose --version

# Test Docker
docker run hello-world
```

## Tutorial Progression

### Foundation (Tutorials 1-4)
| # | Tutorial | Concepts | Files |
|---|----------|----------|-------|
| 01 | [Hello Docker](./01_hello_docker/) | Containers, docker run, docker ps, basic commands | README |
| 02 | [Dockerfile Basics](./02_dockerfile_basics/) | FROM, RUN, CMD, COPY, WORKDIR, ENV | README, Dockerfiles, Code |
| 03 | [Build Custom Image](./03_build_custom_image/) | docker build, tagging, .dockerignore, optimization | README, Complete API |
| 04 | [Multi-Stage Builds](./04_multi_stage_builds/) | Build optimization, size reduction, security | README, Go/Node/Python examples |

### Docker Compose & Multi-Container Apps (Tutorials 5-6)
| # | Tutorial | Concepts | Files |
|---|----------|----------|-------|
| 05 | [Docker Compose Intro](./05_docker_compose_intro/) | docker-compose.yml, services, basic orchestration | README, docker-compose.yml, Flask+Redis |
| 06 | [Multi-Service App](./06_multi_service_app/) | Full-stack: Frontend + Backend + DB + Cache | README, Complete Task Manager App |

### Data & Infrastructure (Tutorials 7-9)
| # | Tutorial | Concepts | Files |
|---|----------|----------|-------|
| 07 | [Volumes & Data Persistence](./07_volumes_data_persistence/) | Named volumes, bind mounts, tmpfs, backups | README, docker-compose.yml |
| 08 | [Networks](./08_networks/) | Bridge, internal, network isolation, DNS | README, Multi-network architecture |
| 09 | [Environment Variables](./09_environment_variables/) | .env files, secrets, configuration management | README, .env examples |

### Production-Ready Patterns (Tutorials 10-15)
| # | Tutorial | Concepts | Files |
|---|----------|----------|-------|
| 10 | [Full-Stack Application](./10_full_stack_app/) | Complete production app with all best practices | README, docker-compose.yml |
| 11 | [Health Checks](./11_health_checks/) | HEALTHCHECK directive, monitoring, dependencies | README, Examples |
| 12 | [Resource Limits](./12_resource_limits/) | CPU, memory, I/O limits, resource management | README, Examples |
| 13 | [Security Best Practices](./13_security_best_practices/) | Non-root users, scanning, secrets, hardening | README, Secure examples |
| 14 | [Multi-Architecture Builds](./14_multi_arch_builds/) | amd64, arm64, Docker Buildx, cross-platform | README, Multi-arch Dockerfiles |
| 15 | [Registry Operations](./15_registry_operations/) | Docker Hub, private registries, push/pull | README, Registry setup |

## What Makes These Tutorials Comprehensive?

### 1. Real Working Code
Every tutorial includes:
- ✅ Complete, tested code examples
- ✅ Production-ready Dockerfiles
- ✅ Working docker-compose.yml files
- ✅ Helper scripts for common operations

### 2. Incremental Learning
```
01: Run existing images                    → docker run
02: Create images from Dockerfiles         → docker build
03: Build optimized custom images          → Best practices
04: Multi-stage builds                     → Size optimization
05: Multiple containers                    → docker-compose
06: Complete multi-service app             → Full architecture
07: Data persistence                       → Volumes
08: Network isolation                      → Security
09: Configuration management               → Environment vars
10: Full production app                    → Everything combined
11-15: Production patterns                 → Enterprise-ready
```

### 3. Multiple Languages & Frameworks
Examples include:
- **Python**: Flask APIs, web applications
- **Node.js**: Express servers, React apps
- **Go**: High-performance services
- **Static Sites**: Nginx configurations

### 4. Production Patterns
Each tutorial emphasizes:
- Security best practices
- Resource optimization
- Monitoring and health checks
- Multi-environment support
- CI/CD integration

## Structure of Each Tutorial

```
XX_topic_name/
├── README.md                    # Comprehensive guide with:
│                                  - Objectives
│                                  - Prerequisites
│                                  - Step-by-step instructions
│                                  - Code explanations
│                                  - Verification steps
│                                  - Troubleshooting
│                                  - Best practices
│                                  - Key takeaways
├── Dockerfile                   # Production-ready Dockerfile
├── docker-compose.yml           # Multi-service orchestration
├── .dockerignore                # Build optimization
├── .env.example                 # Configuration template
├── app/                         # Application code
│   ├── app.py / server.js       # Main application
│   ├── requirements.txt         # Dependencies
│   └── ...
└── scripts/                     # Helper scripts
    ├── build.sh
    └── test.sh
```

## Quick Start

### Tutorial 01 - First Steps
```bash
# Pull and run your first container
docker run -d -p 8080:80 --name web nginx
curl http://localhost:8080

# View running containers
docker ps

# Stop and remove
docker stop web && docker rm web
```

### Tutorial 05 - First Multi-Container App
```bash
cd 05_docker_compose_intro

# Start services (web + redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Test the application
curl http://localhost:5000

# Stop everything
docker-compose down
```

### Tutorial 06 - Full Application
```bash
cd 06_multi_service_app

# Start complete stack (Frontend + Backend + DB + Cache + Admin)
docker-compose up -d

# Access application
open http://localhost        # Frontend
open http://localhost:5000   # Backend API
open http://localhost:5050   # pgAdmin

# Stop and cleanup
docker-compose down -v
```

## Essential Commands Reference

### Images
```bash
docker images                           # List all images
docker build -t myapp:1.0 .            # Build image
docker build --no-cache -t myapp .     # Build without cache
docker tag myapp:1.0 myapp:latest      # Tag image
docker rmi myapp:1.0                   # Remove image
docker image prune -a                   # Remove unused images
```

### Containers
```bash
docker run -d -p 8080:80 --name web nginx     # Run container
docker ps                                      # List running
docker ps -a                                   # List all
docker stop web                                # Stop container
docker start web                               # Start stopped container
docker restart web                             # Restart container
docker rm web                                  # Remove container
docker logs -f web                            # Follow logs
docker exec -it web bash                      # Execute command
docker inspect web                            # Detailed info
docker stats                                  # Resource usage
```

### Docker Compose
```bash
docker-compose up -d                    # Start services (detached)
docker-compose up --build              # Rebuild and start
docker-compose down                     # Stop and remove
docker-compose down -v                  # Stop and remove volumes
docker-compose logs -f                  # Follow logs
docker-compose ps                       # List services
docker-compose exec web bash            # Execute in service
docker-compose restart web              # Restart service
docker-compose scale web=3              # Scale service
```

### Cleanup
```bash
docker system prune                     # Remove unused data
docker system prune -a                  # Remove all unused
docker system prune -a --volumes        # Remove everything unused
docker container prune                  # Remove stopped containers
docker image prune -a                   # Remove unused images
docker volume prune                     # Remove unused volumes
docker network prune                    # Remove unused networks
```

## Best Practices Covered

### Image Optimization
- ✅ Multi-stage builds (Tutorial 04)
- ✅ Minimal base images (alpine, distroless)
- ✅ Layer caching strategies
- ✅ .dockerignore for build context
- ✅ Combining RUN commands
- ✅ Proper instruction ordering

### Security
- ✅ Non-root users (Tutorial 13)
- ✅ Vulnerability scanning
- ✅ Secrets management
- ✅ Read-only filesystems
- ✅ Capability dropping
- ✅ Image signing and verification

### Networking
- ✅ Network isolation (Tutorial 08)
- ✅ Internal vs external networks
- ✅ Service discovery
- ✅ Multi-network architectures
- ✅ Port mapping best practices

### Storage
- ✅ Named volumes for persistence (Tutorial 07)
- ✅ Bind mounts for development
- ✅ tmpfs for sensitive data
- ✅ Backup strategies
- ✅ Volume drivers

### Production Readiness
- ✅ Health checks (Tutorial 11)
- ✅ Resource limits (Tutorial 12)
- ✅ Restart policies
- ✅ Logging configuration
- ✅ Monitoring integration
- ✅ Multi-architecture support (Tutorial 14)

## Common Patterns

### Pattern 1: Web Application with Database
```yaml
version: '3.8'
services:
  web:
    build: .
    ports: ["3000:3000"]
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:15-alpine
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
volumes:
  db_data:
```

### Pattern 2: Development with Hot Reload
```yaml
services:
  app:
    build:
      context: .
      target: development
    volumes:
      - ./src:/app/src           # Hot reload
      - /app/node_modules         # Preserve modules
    command: npm run dev
```

### Pattern 3: Production Multi-Stage
```dockerfile
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
RUN addgroup -g 1001 nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
USER nodejs
CMD ["node", "dist/server.js"]
```

## Troubleshooting Guide

### Port Already in Use
```bash
# Find process
lsof -i :3000

# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Container Exits Immediately
```bash
# Check logs
docker logs <container-name>

# Run interactively
docker run -it <image> /bin/sh
```

### Build Context Too Large
```bash
# Create .dockerignore
cat > .dockerignore << EOF
node_modules
.git
*.log
dist
build
EOF
```

### Cannot Connect to Docker Daemon
```bash
# macOS: Ensure Docker Desktop is running
# Linux: Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

### Out of Disk Space
```bash
# Clean up everything
docker system prune -a --volumes

# Check disk usage
docker system df
```

## Learning Path

### Beginner (Week 1)
- **Days 1-2**: Tutorials 1-2 (Basics, Dockerfiles)
- **Days 3-4**: Tutorial 3 (Building images)
- **Day 5**: Tutorial 4 (Multi-stage builds)
- **Weekend**: Practice building simple apps

### Intermediate (Week 2)
- **Days 1-2**: Tutorial 5 (Docker Compose)
- **Days 3-4**: Tutorial 6 (Multi-service apps)
- **Day 5**: Tutorials 7-8 (Volumes, Networks)
- **Weekend**: Build a full-stack application

### Advanced (Week 3)
- **Days 1-2**: Tutorials 9-10 (Config, Full-stack)
- **Days 3-4**: Tutorials 11-13 (Health, Resources, Security)
- **Day 5**: Tutorials 14-15 (Multi-arch, Registry)
- **Weekend**: Containerize a real project

## What You'll Master

After completing all 15 tutorials, you will:

✅ **Understand Docker Fundamentals**
- Container lifecycle and operations
- Image creation and management
- Dockerfile syntax and best practices

✅ **Build Production-Ready Images**
- Multi-stage builds for optimization
- Security hardening
- Multi-architecture support

✅ **Orchestrate Multi-Container Applications**
- Docker Compose for local development
- Service dependencies and health checks
- Network and volume management

✅ **Implement Best Practices**
- Security scanning and hardening
- Resource limits and monitoring
- Secrets and configuration management

✅ **Deploy with Confidence**
- Registry operations
- CI/CD integration
- Production deployment patterns

## Real-World Applications

These tutorials prepare you for:
- **Microservices Development**
- **Local Development Environments**
- **CI/CD Pipelines**
- **Cloud Deployments** (AWS, GCP, Azure)
- **Kubernetes Migration**
- **DevOps Practices**

## Next Steps After Completion

1. **Kubernetes** → Tutorial 5.2: Container orchestration at scale
2. **CI/CD** → Tutorial 5.6: Automated Docker builds and deployments
3. **Cloud** → Tutorial 5.1: Deploy containers to cloud platforms
4. **Monitoring** → Tutorial 5.7: Prometheus, Grafana for containers
5. **Service Mesh** → Tutorial 5.9: Istio, Linkerd

## Additional Resources

### Official Documentation
- [Docker Documentation](https://docs.docker.com/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)

### Interactive Learning
- [Play with Docker](https://labs.play-with-docker.com/)
- [Docker Playground](https://www.docker.com/play-with-docker/)

### Security
- [Docker Security](https://docs.docker.com/engine/security/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)

## Getting Help

### Common Questions
1. **Which tutorial should I start with?**
   - Start with Tutorial 01 if you're new to Docker
   - Skip to Tutorial 05 if you know Dockerfile basics

2. **Do I need to complete all tutorials?**
   - Tutorials 1-6 cover essentials
   - Tutorials 7-10 are for production readiness
   - Tutorials 11-15 are advanced topics

3. **How long does each tutorial take?**
   - Basic tutorials: 15-30 minutes
   - Intermediate: 30-45 minutes
   - Advanced: 45-60 minutes

4. **Can I use Windows?**
   - Yes! Docker Desktop works on Windows, Mac, and Linux
   - All commands work the same

## Contributing

Found an issue or want to improve a tutorial?
- Report issues in the repository
- Suggest improvements
- Share your experience

---

**Total Tutorials**: 15 comprehensive modules
**Total Time**: 30-40 hours hands-on practice
**Difficulty**: Beginner to Advanced
**Cost**: Free (runs locally)
**Prerequisites**: Basic command-line knowledge

**Start your journey**: [Tutorial 01: Hello Docker](./01_hello_docker/)
