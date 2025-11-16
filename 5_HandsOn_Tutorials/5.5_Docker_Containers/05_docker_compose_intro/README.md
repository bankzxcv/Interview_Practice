# Tutorial 05: Docker Compose Introduction

## Objectives
- Understand Docker Compose and its benefits
- Learn docker-compose.yml syntax and structure
- Define and run multi-container applications
- Master docker-compose commands
- Implement service dependencies and networking

## Prerequisites
- Completed Tutorial 04 (Multi-Stage Builds)
- Docker Compose installed (`docker-compose --version`)
- Understanding of YAML syntax

## What is Docker Compose?

Docker Compose is a tool for defining and running multi-container Docker applications. With Compose, you use a YAML file to configure your application's services, networks, and volumes.

**Benefits:**
- **Single Configuration File**: Define entire stack in one place
- **Easy Service Management**: Start/stop all services with one command
- **Automatic Networking**: Services can communicate by name
- **Volume Management**: Persistent data handling
- **Environment Consistency**: Same setup for dev, test, and prod

## Basic Concepts

### docker-compose.yml Structure

```yaml
version: '3.8'

services:
  # Service definitions
  service-name:
    image: image-name
    # or
    build: ./path

networks:
  # Network definitions

volumes:
  # Volume definitions
```

## Step-by-Step Instructions

### Example 1: Simple Web Service

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html:ro
```

Create content:

```bash
mkdir html
echo "<h1>Hello from Docker Compose!</h1>" > html/index.html
```

Run it:

```bash
# Start services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs

# Stop services
docker-compose down
```

### Example 2: Web + Redis

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

`app.py`:

```python
from flask import Flask, jsonify
import redis
import os

app = Flask(__name__)

# Connect to Redis
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    decode_responses=True
)

@app.route('/')
def home():
    # Increment visit counter
    visits = redis_client.incr('visits')
    return jsonify({
        'message': 'Hello from Docker Compose!',
        'visits': visits
    })

@app.route('/health')
def health():
    try:
        redis_client.ping()
        return jsonify({'status': 'healthy', 'redis': 'connected'})
    except:
        return jsonify({'status': 'unhealthy', 'redis': 'disconnected'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

`Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

CMD ["python", "app.py"]
```

`requirements.txt`:

```text
Flask==3.0.0
redis==5.0.1
```

**Run the stack:**

```bash
docker-compose up -d
curl http://localhost:5000
curl http://localhost:5000/health
docker-compose logs -f web
docker-compose down
```

### Example 3: Complete Service Configuration

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - APP_VERSION=1.0.0
    image: myapp:latest
    container_name: web-app
    ports:
      - "8000:8000"
      - "8443:443"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://db:5432/myapp
    env_file:
      - .env
    volumes:
      - ./app:/app
      - uploads:/app/uploads
    networks:
      - frontend
      - backend
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend
    restart: unless-stopped

  redis:
    image: redis:alpine
    networks:
      - backend
    restart: unless-stopped

networks:
  frontend:
  backend:

volumes:
  uploads:
  postgres_data:
```

## Docker Compose Commands

### Basic Commands

```bash
# Start services
docker-compose up                  # Foreground
docker-compose up -d               # Detached (background)
docker-compose up --build          # Rebuild images

# Stop services
docker-compose stop                # Stop containers
docker-compose down                # Stop and remove containers
docker-compose down -v             # Also remove volumes

# View status
docker-compose ps                  # List containers
docker-compose logs                # View logs
docker-compose logs -f web         # Follow logs for specific service
docker-compose top                 # Display running processes

# Execute commands
docker-compose exec web bash       # Open shell in running container
docker-compose run web python test.py  # Run one-off command

# Build
docker-compose build               # Build all services
docker-compose build web           # Build specific service
docker-compose build --no-cache    # Build without cache

# Scaling
docker-compose up -d --scale web=3  # Run 3 instances of web service
```

### Advanced Commands

```bash
# Configuration
docker-compose config              # Validate and view configuration
docker-compose config --services   # List services

# Images
docker-compose images              # List images
docker-compose pull                # Pull service images

# Restart services
docker-compose restart             # Restart all
docker-compose restart web         # Restart specific service

# Pause/Unpause
docker-compose pause web           # Pause service
docker-compose unpause web         # Unpause service

# Remove
docker-compose rm                  # Remove stopped containers
docker-compose rm -f -v            # Force remove with volumes
```

## Service Configuration Options

### Image vs Build

```yaml
services:
  # Using pre-built image
  nginx:
    image: nginx:alpine

  # Building from Dockerfile
  app:
    build: ./app

  # Building with options
  api:
    build:
      context: ./api
      dockerfile: Dockerfile.prod
      args:
        - VERSION=1.0.0
```

### Ports

```yaml
services:
  web:
    ports:
      - "8080:80"        # HOST:CONTAINER
      - "443:443"
      - "127.0.0.1:3000:3000"  # Bind to specific interface
```

### Environment Variables

```yaml
services:
  app:
    environment:
      - DEBUG=true
      - DATABASE_URL=postgresql://db/myapp
    env_file:
      - .env
      - .env.local
```

### Volumes

```yaml
services:
  app:
    volumes:
      - ./app:/app                    # Bind mount
      - node_modules:/app/node_modules  # Named volume
      - /app/tmp                       # Anonymous volume

volumes:
  node_modules:  # Named volume definition
```

### Networks

```yaml
services:
  web:
    networks:
      - frontend
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
```

### Dependencies

```yaml
services:
  web:
    depends_on:
      - db
      - redis

  # Advanced: Wait for healthy state
  app:
    depends_on:
      db:
        condition: service_healthy
```

## Practical Examples

### Example 4: Node.js + MongoDB

`docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGO_URL=mongodb://mongo:27017/myapp
    depends_on:
      - mongo
    volumes:
      - ./src:/app/src
    restart: unless-stopped

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=myapp
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  mongo-express:
    image: mongo-express:latest
    ports:
      - "8081:8081"
    environment:
      - ME_CONFIG_MONGODB_URL=mongodb://mongo:27017/
    depends_on:
      - mongo
    restart: unless-stopped

volumes:
  mongo_data:
```

### Example 5: Development Environment

`docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      target: development
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js debugger
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=dev_password
```

Use it:

```bash
docker-compose -f docker-compose.dev.yml up
```

## Environment Files

`.env`:

```bash
# Database
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=myapp

# Application
APP_PORT=3000
NODE_ENV=production
SECRET_KEY=your-secret-key

# Redis
REDIS_PORT=6379
```

**Access in compose file:**

```yaml
services:
  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
```

## Networks

### Default Network

Docker Compose automatically creates a default network. Services can reach each other using service names.

### Custom Networks

```yaml
version: '3.8'

services:
  web:
    networks:
      - frontend

  api:
    networks:
      - frontend
      - backend

  db:
    networks:
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access
```

## Volumes

### Types of Volumes

```yaml
version: '3.8'

services:
  app:
    volumes:
      # Bind mount (host path:container path)
      - ./app:/app

      # Named volume
      - uploads:/app/uploads

      # Anonymous volume
      - /app/temp

volumes:
  uploads:  # Named volume
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/on/host
```

## Best Practices

1. **Use version 3.8+** for latest features
2. **Named volumes** for data persistence
3. **Environment files** for configuration
4. **Health checks** for service readiness
5. **Restart policies** for reliability
6. **Resource limits** to prevent resource exhaustion
7. **Networks** to isolate services
8. **.dockerignore** to reduce build context

## Verification

Create a complete stack:

```bash
# Create project directory
mkdir compose-test && cd compose-test

# Create docker-compose.yml (use Example 2)
# Create required files

# Start the stack
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs

# Test the application
curl http://localhost:5000

# Scale a service
docker-compose up -d --scale web=3

# Stop everything
docker-compose down
```

## Troubleshooting

### Services Can't Communicate

```yaml
# Ensure they're on the same network
services:
  web:
    networks:
      - mynetwork
  db:
    networks:
      - mynetwork

networks:
  mynetwork:
```

### Port Already in Use

```bash
# Error: port is already allocated
# Solution: Change the host port
ports:
  - "8081:80"  # Instead of 8080
```

### Volume Permission Issues

```bash
# Solution: Set proper ownership
RUN chown -R appuser:appuser /app
USER appuser
```

## Next Steps

Continue to:
- **Tutorial 06**: Build a complete multi-service application
- **Tutorial 07**: Persistent data with volumes
- **Tutorial 08**: Advanced networking

## Key Takeaways

1. Docker Compose simplifies multi-container applications
2. YAML file defines entire application stack
3. Services communicate using service names
4. Automatic network creation and DNS resolution
5. `docker-compose up/down` for easy management
6. Environment files for configuration
7. Named volumes for data persistence
8. `depends_on` for service orchestration
9. Override files for different environments
10. Essential tool for development and testing
