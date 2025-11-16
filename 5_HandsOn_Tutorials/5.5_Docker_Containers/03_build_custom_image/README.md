# Tutorial 03: Build Custom Image

## Objectives
- Master the `docker build` command and its options
- Learn image tagging strategies and best practices
- Understand build context and optimization
- Use build arguments for flexible image builds
- Implement caching strategies for faster builds
- Create production-ready custom images

## Prerequisites
- Completed Tutorial 02 (Dockerfile Basics)
- Understanding of Dockerfile instructions
- Basic knowledge of version control

## The Build Process

### Understanding `docker build`

The `docker build` command creates an image from a Dockerfile:

```bash
docker build [OPTIONS] PATH
```

**Key Concepts:**
- **Build Context**: Directory containing Dockerfile and related files
- **Image Layers**: Each Dockerfile instruction creates a layer
- **Build Cache**: Docker caches layers to speed up builds
- **Tags**: Labels to identify image versions

## Step-by-Step Instructions

### Example 1: Basic Build with Tagging

**Create a simple Python API:**

`app.py`:
```python
from flask import Flask, jsonify
import os
import datetime

app = Flask(__name__)

VERSION = os.getenv('APP_VERSION', '1.0.0')
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

@app.route('/')
def home():
    return jsonify({
        'service': 'Custom Image Demo',
        'version': VERSION,
        'environment': ENVIRONMENT,
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
```

`Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

ARG APP_VERSION=1.0.0
ENV APP_VERSION=${APP_VERSION}
ENV ENVIRONMENT=production

EXPOSE 5000

CMD ["python", "app.py"]
```

**Build with different tags:**

```bash
# Build with default tag (latest)
docker build -t myapi .

# Build with specific version tag
docker build -t myapi:1.0.0 .

# Build with multiple tags
docker build -t myapi:1.0.0 -t myapi:latest .

# Build with organization/repository naming
docker build -t myorg/myapi:1.0.0 .

# Build with build argument
docker build --build-arg APP_VERSION=2.0.0 -t myapi:2.0.0 .
```

**Verify the builds:**

```bash
# List images
docker images myapi

# Run different versions
docker run -d -p 5001:5000 --name api-v1 myapi:1.0.0
docker run -d -p 5002:5000 --name api-v2 myapi:2.0.0

# Test
curl http://localhost:5001
curl http://localhost:5002

# Cleanup
docker stop api-v1 api-v2
docker rm api-v1 api-v2
```

### Example 2: Advanced Build Options

**Using Build Arguments for Flexibility:**

`Dockerfile.advanced`:
```dockerfile
FROM python:3.9-slim

# Build arguments
ARG DEBIAN_FRONTEND=noninteractive
ARG APP_VERSION=1.0.0
ARG BUILD_DATE
ARG VCS_REF

# Labels (metadata)
LABEL maintainer="devops@example.com" \
      version="${APP_VERSION}" \
      description="Advanced custom image example" \
      build-date="${BUILD_DATE}" \
      vcs-ref="${VCS_REF}"

# Environment variables
ENV APP_VERSION=${APP_VERSION} \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies if needed
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["python", "app.py"]
```

**Build with all metadata:**

```bash
# Build with full metadata
docker build \
  -f Dockerfile.advanced \
  --build-arg APP_VERSION=1.2.0 \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  -t myapi:1.2.0 \
  .

# Inspect the metadata
docker inspect myapi:1.2.0 | grep -A 10 Labels
```

### Example 3: Optimizing Build Context

**Bad Practice - Large Build Context:**

```
my-project/
├── Dockerfile
├── app.py
├── requirements.txt
├── node_modules/          # 200MB - shouldn't be in context!
├── .git/                  # 50MB - not needed!
├── large-dataset/         # 1GB - not needed!
└── logs/                  # 100MB - not needed!
```

Without `.dockerignore`, all files are sent to Docker daemon:
```bash
docker build -t myapp .
# Sending build context to Docker daemon: 1.35GB
```

**Good Practice - Optimized Build Context:**

Create `.dockerignore`:
```text
# Version control
.git
.gitignore

# Dependencies (installed during build)
node_modules
__pycache__
*.pyc

# Development
.vscode
.idea

# Documentation
*.md
docs/

# Data and logs
large-dataset/
logs/
*.log

# Environment
.env
.env.local

# Testing
.pytest_cache
coverage/
*.test
```

Now the build is much faster:
```bash
docker build -t myapp .
# Sending build context to Docker daemon: 15kB
```

### Example 4: Layer Caching Strategy

**Understanding Cache:**

Docker caches each layer. If nothing changed, it reuses the cached layer.

**Poor Caching (rebuilds everything on code change):**

```dockerfile
FROM python:3.9-slim
WORKDIR /app

# This invalidates cache whenever ANY file changes
COPY . .
RUN pip install -r requirements.txt  # Always reinstalls!

CMD ["python", "app.py"]
```

**Good Caching (only rebuilds what changed):**

```dockerfile
FROM python:3.9-slim
WORKDIR /app

# Dependencies change rarely - good for caching
COPY requirements.txt .
RUN pip install -r requirements.txt  # Cached unless requirements change!

# Code changes frequently - put last
COPY . .

CMD ["python", "app.py"]
```

**Demonstration:**

```bash
# First build - downloads everything
docker build -t caching-demo .

# Second build - uses cache
docker build -t caching-demo .
# All steps show "Using cache"

# Change app.py (not requirements.txt)
echo "# comment" >> app.py

# Third build - only rebuilds from COPY . .
docker build -t caching-demo .
# Uses cache for pip install!
```

**Force rebuild without cache:**

```bash
# Ignore cache and rebuild everything
docker build --no-cache -t myapp .

# Pull latest base image
docker build --pull -t myapp .
```

### Example 5: Complete Real-World Application

Let's build a complete REST API with database models:

**Project Structure:**
```
my-api/
├── Dockerfile
├── .dockerignore
├── requirements.txt
├── app.py
├── models.py
├── config.py
└── utils.py
```

`config.py`:
```python
import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    PORT = int(os.getenv('PORT', 5000))
```

`models.py`:
```python
from dataclasses import dataclass
from datetime import datetime

@dataclass
class User:
    id: int
    username: str
    email: str
    created_at: datetime = datetime.now()
```

`utils.py`:
```python
import logging

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger(__name__)
```

`app.py`:
```python
from flask import Flask, jsonify, request
from config import Config
from models import User
from utils import setup_logging
import os

app = Flask(__name__)
app.config.from_object(Config)
logger = setup_logging()

# In-memory storage (for demo)
users = []
user_id_counter = 1

@app.route('/')
def home():
    return jsonify({
        'service': 'User API',
        'version': os.getenv('APP_VERSION', '1.0.0'),
        'endpoints': ['/users', '/users/<id>', '/health']
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

@app.route('/users', methods=['GET', 'POST'])
def users_handler():
    global user_id_counter

    if request.method == 'GET':
        return jsonify([vars(u) for u in users])

    elif request.method == 'POST':
        data = request.get_json()
        user = User(
            id=user_id_counter,
            username=data['username'],
            email=data['email']
        )
        users.append(user)
        user_id_counter += 1
        logger.info(f"Created user: {user.username}")
        return jsonify(vars(user)), 201

@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = next((u for u in users if u.id == user_id), None)
    if user:
        return jsonify(vars(user))
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )
```

`requirements.txt`:
```text
Flask==3.0.0
gunicorn==21.2.0
```

`Dockerfile`:
```dockerfile
FROM python:3.9-slim

# Build arguments
ARG APP_VERSION=1.0.0

# Metadata
LABEL maintainer="devops@example.com" \
      version="${APP_VERSION}" \
      description="User Management API"

# Environment setup
ENV APP_VERSION=${APP_VERSION} \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=5000

WORKDIR /app

# Install dependencies (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY *.py ./

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD python -c "import requests; requests.get('http://localhost:5000/health')" || exit 1

# Use gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]
```

`.dockerignore`:
```text
__pycache__
*.pyc
.pytest_cache
.venv
venv/
*.log
.git
.gitignore
*.md
.env
.DS_Store
```

**Build and test:**

```bash
# Build the image
docker build -t user-api:1.0.0 .

# Run the container
docker run -d \
  -p 5000:5000 \
  --name user-api \
  -e DEBUG=false \
  user-api:1.0.0

# Test the API
curl http://localhost:5000

# Create a user
curl -X POST http://localhost:5000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com"}'

# Get users
curl http://localhost:5000/users

# Check health
curl http://localhost:5000/health

# View logs
docker logs user-api

# Cleanup
docker stop user-api && docker rm user-api
```

## Tagging Strategies

### Semantic Versioning

```bash
# Major.Minor.Patch
docker build -t myapp:1.0.0 .
docker build -t myapp:1.0.1 .
docker build -t myapp:1.1.0 .
docker build -t myapp:2.0.0 .
```

### Environment-Based Tagging

```bash
docker build -t myapp:dev .
docker build -t myapp:staging .
docker build -t myapp:prod .
```

### Git-Based Tagging

```bash
# Using git commit hash
docker build -t myapp:$(git rev-parse --short HEAD) .

# Using git branch
docker build -t myapp:$(git branch --show-current) .

# Using git tag
docker build -t myapp:$(git describe --tags) .
```

### Multi-Tag Strategy

```bash
# Tag with version, latest, and commit
VERSION=1.2.3
COMMIT=$(git rev-parse --short HEAD)

docker build \
  -t myapp:${VERSION} \
  -t myapp:latest \
  -t myapp:${COMMIT} \
  .
```

## Build Optimization Techniques

### 1. Multi-Stage Builds (Preview)

More in Tutorial 04, but here's a quick example:

```dockerfile
# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

### 2. Using BuildKit

```bash
# Enable BuildKit for better caching and performance
DOCKER_BUILDKIT=1 docker build -t myapp .

# BuildKit features:
# - Better caching
# - Parallel building
# - Build secrets
# - SSH forwarding
```

### 3. Caching npm/pip Packages

**For Node.js:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
```

**For Python:**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

## Verification

Build a complete application with all best practices:

```bash
# 1. Create project structure
mkdir -p ~/docker-builds/optimized-app
cd ~/docker-builds/optimized-app

# 2. Create files (use the User API example above)

# 3. Build with version
docker build -t optimized-app:1.0.0 .

# 4. Verify image size
docker images optimized-app

# 5. Inspect layers
docker history optimized-app:1.0.0

# 6. Test the application
docker run -d -p 5000:5000 optimized-app:1.0.0

# 7. Verify it works
curl http://localhost:5000/health

# 8. Check build cache (rebuild)
docker build -t optimized-app:1.0.0 .
# Should use cache for most steps
```

## Common Build Patterns

### Pattern 1: Development vs Production

`Dockerfile.dev`:
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt requirements-dev.txt ./
RUN pip install -r requirements-dev.txt
COPY . .
CMD ["flask", "run", "--debug"]
```

`Dockerfile.prod`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
USER nobody
CMD ["gunicorn", "app:app"]
```

### Pattern 2: Using Build Secrets

```dockerfile
# syntax=docker/dockerfile:1.4
FROM python:3.9-slim

WORKDIR /app

# Use secret during build (doesn't persist in image)
RUN --mount=type=secret,id=pip_config \
    pip install --no-cache-dir -r requirements.txt

COPY . .
```

Build with secret:
```bash
DOCKER_BUILDKIT=1 docker build \
  --secret id=pip_config,src=$HOME/.pip/pip.conf \
  -t myapp .
```

## Troubleshooting

### Problem: Build is Slow

```bash
# Check what's being sent to build context
docker build --progress=plain -t myapp .

# Solution: Use .dockerignore
# Solution: Order instructions properly
# Solution: Use smaller base images
```

### Problem: Cache Not Working

```bash
# Ensure consistent file ordering
COPY requirements.txt .  # First
RUN pip install -r requirements.txt
COPY . .  # Last

# Check if files changed
git status
```

### Problem: Image Too Large

```bash
# Check image size
docker images myapp

# View layer sizes
docker history myapp

# Solutions:
# - Use alpine base images
# - Clean up in same RUN command
# - Use multi-stage builds (Tutorial 04)
# - Remove build dependencies
```

## Practice Exercises

### Exercise 1: Build Matrix

Build the same app for different versions:

```bash
# Python 3.8, 3.9, 3.10
for version in 3.8 3.9 3.10; do
  docker build \
    --build-arg PYTHON_VERSION=$version \
    -t myapp:py$version \
    -f Dockerfile.matrix \
    .
done
```

### Exercise 2: Build Pipeline

Create a script that:
1. Runs tests
2. Builds image if tests pass
3. Tags with version and latest
4. Saves build metadata

### Exercise 3: Optimize Existing Image

Take any existing Dockerfile and:
1. Add .dockerignore
2. Optimize layer order
3. Reduce final image size by 50%

## Best Practices Summary

1. **Always use .dockerignore**
2. **Order instructions from least to most frequently changed**
3. **Use specific base image tags**
4. **Combine RUN commands to reduce layers**
5. **Clean up in the same RUN layer**
6. **Use build arguments for flexibility**
7. **Add metadata with LABEL**
8. **Implement health checks**
9. **Run as non-root user**
10. **Use semantic versioning for tags**

## Build Command Cheat Sheet

```bash
# Basic build
docker build -t name:tag .

# Specify Dockerfile
docker build -f Dockerfile.custom -t name:tag .

# Build with arguments
docker build --build-arg VERSION=1.0 -t name:tag .

# No cache
docker build --no-cache -t name:tag .

# Pull latest base image
docker build --pull -t name:tag .

# Target specific stage (multi-stage)
docker build --target production -t name:tag .

# Set build context
docker build -t name:tag /path/to/context

# Multiple tags
docker build -t name:1.0 -t name:latest .

# Show all build output
docker build --progress=plain -t name:tag .

# BuildKit enabled
DOCKER_BUILDKIT=1 docker build -t name:tag .
```

## Next Steps

You've mastered building custom Docker images! Continue to:
- **Tutorial 04**: Learn multi-stage builds for dramatically smaller images
- **Tutorial 05**: Use docker-compose for multi-container applications
- **Tutorial 06**: Build a complete multi-service application

## Key Takeaways

1. `docker build` creates images from Dockerfiles
2. Tags identify and version your images
3. Build context should be minimal (use .dockerignore)
4. Layer caching speeds up builds significantly
5. Build arguments enable flexible, parameterized builds
6. Proper instruction ordering is critical for cache efficiency
7. Add metadata with LABEL for better management
8. Always verify your builds work correctly
9. Use BuildKit for enhanced build features
10. Follow semantic versioning for production images
