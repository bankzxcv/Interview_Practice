# Tutorial 07: Volumes and Data Persistence

## Objectives
- Understand Docker volumes and data persistence
- Learn different types of mounts: volumes, bind mounts, tmpfs
- Manage volume lifecycle and backups
- Share data between containers
- Implement best practices for production data storage

## Prerequisites
- Completed Tutorial 06 (Multi-Service App)
- Understanding of file systems
- Docker Compose knowledge

## The Problem: Container Data is Ephemeral

When a container is deleted, all data inside it is lost. Volumes solve this problem by storing data outside the container lifecycle.

```bash
# Without volumes - data is lost!
docker run --name mydb postgres:15
# Add data...
docker rm mydb
# Data is gone! 💀
```

## Types of Mounts

### 1. Volumes (Recommended)
- Managed by Docker
- Stored in `/var/lib/docker/volumes/`
- Best for production
- Portable across hosts

### 2. Bind Mounts
- Map host directory to container
- Full path required
- Good for development
- Direct access to files

### 3. tmpfs Mounts
- Stored in memory
- Never written to disk
- Fast but temporary
- Good for secrets/temp data

## Working with Volumes

### Creating and Using Volumes

```bash
# Create a volume
docker volume create my-volume

# List volumes
docker volume ls

# Inspect volume
docker volume inspect my-volume

# Use volume in container
docker run -d \
  --name db \
  -v my-volume:/var/lib/postgresql/data \
  postgres:15

# Remove volume
docker volume rm my-volume

# Remove all unused volumes
docker volume prune
```

### Volume Syntax

```bash
# Named volume
-v volume-name:/path/in/container

# Bind mount (absolute path)
-v /host/path:/container/path

# Anonymous volume
-v /container/path

# Read-only volume
-v volume-name:/path:ro
```

## Docker Compose with Volumes

### Example 1: Database with Persistent Storage

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    volumes:
      # Named volume for data
      - postgres_data:/var/lib/postgresql/data

      # Bind mount for initialization scripts
      - ./init-scripts:/docker-entrypoint-initdb.d

      # Read-only bind mount for config
      - ./postgres.conf:/etc/postgresql/postgresql.conf:ro
    environment:
      - POSTGRES_PASSWORD=secret

volumes:
  # Named volume definition
  postgres_data:
    driver: local
```

### Example 2: Development Environment

```yaml
version: '3.8'

services:
  app:
    build: .
    volumes:
      # Bind mount source code (hot reload)
      - ./src:/app/src

      # Named volume for dependencies (faster)
      - node_modules:/app/node_modules

      # Anonymous volume for temp files
      - /app/tmp

volumes:
  node_modules:
```

### Example 3: Multi-Container Data Sharing

```yaml
version: '3.8'

services:
  app:
    build: .
    volumes:
      - shared_data:/data

  worker:
    build: ./worker
    volumes:
      - shared_data:/data

  backup:
    image: alpine
    volumes:
      - shared_data:/data:ro  # Read-only
      - ./backups:/backups
    command: tar czf /backups/data.tar.gz /data

volumes:
  shared_data:
```

## Complete Example: Blog Application

`docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Web Application
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://blog:secret@db:5432/blogdb
    volumes:
      # Application logs
      - app_logs:/app/logs

      # Uploaded media files
      - media_files:/app/public/uploads

      # Development: hot reload
      - ./src:/app/src

    depends_on:
      - db

  # Database
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=blogdb
      - POSTGRES_USER=blog
      - POSTGRES_PASSWORD=secret
    volumes:
      # Persistent database storage
      - db_data:/var/lib/postgresql/data

      # Custom configuration
      - ./postgres.conf:/etc/postgresql/postgresql.conf

      # Initialization scripts
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U blog -d blogdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backup service
  backup:
    image: postgres:15-alpine
    volumes:
      - db_data:/var/lib/postgresql/data:ro
      - ./backups:/backups
    environment:
      - PGPASSWORD=secret
    command: >
      sh -c "while true; do
        pg_dump -h db -U blog blogdb > /backups/backup_$$(date +%Y%m%d_%H%M%S).sql;
        sleep 86400;
      done"
    depends_on:
      - db

  # Log aggregator
  logs:
    image: busybox
    volumes:
      - app_logs:/logs:ro
    command: tail -f /logs/app.log

volumes:
  db_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/docker/volumes/blog_db

  app_logs:
  media_files:
```

## Volume Management Commands

```bash
# Create volume with specific driver
docker volume create \
  --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.1,rw \
  --opt device=:/path/to/dir \
  my-nfs-volume

# Copy files to volume
docker run --rm \
  -v my-volume:/data \
  -v $(pwd):/backup \
  alpine cp -r /backup/* /data/

# Backup volume
docker run --rm \
  -v my-volume:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backup.tar.gz /data

# Restore volume
docker run --rm \
  -v my-volume:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/backup.tar.gz -C /

# Clone volume
docker volume create new-volume
docker run --rm \
  -v old-volume:/from \
  -v new-volume:/to \
  alpine sh -c "cp -av /from/* /to/"
```

## Practical Exercises

### Exercise 1: PostgreSQL with Persistent Data

```bash
# Create volume
docker volume create postgres_data

# Run PostgreSQL
docker run -d \
  --name mydb \
  -e POSTGRES_PASSWORD=secret \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15

# Create data
docker exec -it mydb psql -U postgres -c "CREATE DATABASE testdb;"
docker exec -it mydb psql -U postgres testdb -c "CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);"
docker exec -it mydb psql -U postgres testdb -c "INSERT INTO users (name) VALUES ('Alice'), ('Bob');"

# Check data
docker exec -it mydb psql -U postgres testdb -c "SELECT * FROM users;"

# Remove container
docker rm -f mydb

# Run new container with same volume
docker run -d \
  --name mydb2 \
  -e POSTGRES_PASSWORD=secret \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15

# Data persists!
docker exec -it mydb2 psql -U postgres testdb -c "SELECT * FROM users;"

# Cleanup
docker rm -f mydb2
docker volume rm postgres_data
```

### Exercise 2: Bind Mount for Development

```bash
# Create app directory
mkdir -p ~/docker-dev/app
cd ~/docker-dev/app

# Create simple app
cat > index.js << 'EOF'
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Hello Docker!'));
app.listen(3000, () => console.log('Server running on port 3000'));
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "dev-app",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
EOF

# Run with bind mount
docker build -t dev-app .
docker run -d \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  --name dev-app \
  dev-app

# Edit index.js - changes reflect immediately!
echo "console.log('Hot reload works!');" >> index.js
docker logs -f dev-app

# Cleanup
docker rm -f dev-app
```

## Volume Backup Strategies

### Strategy 1: Tar Archive

```bash
# Backup
docker run --rm \
  -v my-volume:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz /data

# Restore
docker run --rm \
  -v my-volume:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/backup-20231201.tar.gz -C /
```

### Strategy 2: Database Dump

```bash
# PostgreSQL backup
docker exec mydb pg_dump -U postgres mydb > backup.sql

# Restore
docker exec -i mydb psql -U postgres mydb < backup.sql
```

### Strategy 3: Rsync

```bash
# Backup with rsync
docker run --rm \
  -v my-volume:/data \
  -v $(pwd)/backups:/backup \
  instrumentisto/rsync \
  rsync -avz /data/ /backup/
```

## Best Practices

1. **Use Named Volumes** for databases and persistent data
2. **Use Bind Mounts** for development and configuration
3. **Never store data** in container writable layer
4. **Regular backups** of important volumes
5. **Read-only mounts** when write access isn't needed
6. **Volume drivers** for cloud/network storage
7. **Prune unused volumes** regularly
8. **Test restore procedures** before disasters

## Troubleshooting

### Permission Issues

```dockerfile
# Set correct ownership
RUN mkdir -p /app/data && \
    chown -R appuser:appuser /app/data

USER appuser

VOLUME /app/data
```

### Volume Not Updating

```bash
# Check if using anonymous volume
# Use named volumes instead
docker run -v named-volume:/data ...

# For bind mounts, ensure path is correct
docker run -v $(pwd)/data:/data ...
```

### Volume Full

```bash
# Check volume usage
docker system df -v

# Cleanup
docker volume prune

# For specific volume, backup and recreate
```

## Next Steps

- **Tutorial 08**: Docker networks
- **Tutorial 09**: Environment variables and secrets
- **Tutorial 10**: Full-stack application

## Key Takeaways

1. Volumes persist data beyond container lifecycle
2. Named volumes are best for production
3. Bind mounts are perfect for development
4. tmpfs mounts for sensitive temporary data
5. Regular backups are essential
6. Volume drivers enable cloud storage
7. Read-only mounts improve security
8. Docker manages volume lifecycle
9. Volumes can be shared between containers
10. Always test restore procedures
