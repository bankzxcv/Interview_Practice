# Tutorial 02: MySQL Docker Compose Advanced Setup

## Objectives

By the end of this tutorial, you will:
- Set up MySQL with phpMyAdmin GUI
- Configure multiple services with docker-compose
- Use environment variables and .env files
- Understand docker networking
- Configure persistent storage properly
- Set up container dependencies and health checks
- Learn docker-compose best practices

## Prerequisites

- Completed Tutorial 01 (Basic Setup)
- Docker and Docker Compose installed
- Basic understanding of MySQL
- 20-30 minutes of time

## What You'll Build

A complete MySQL development environment with:
- MySQL 8.0 database server
- phpMyAdmin web interface
- Proper networking and volume management
- Environment-based configuration
- Health checks and dependencies

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Docker Compose Network          │
│                                         │
│  ┌─────────────┐    ┌──────────────┐  │
│  │   MySQL     │◄───│  phpMyAdmin  │  │
│  │  Port 3306  │    │  Port 8080   │  │
│  └─────────────┘    └──────────────┘  │
│        │                                │
│   Named Volume                          │
│   (Persistent)                          │
└─────────────────────────────────────────┘
```

## Step-by-Step Instructions

### Step 1: Project Structure

```bash
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.2_MySQL/02_docker_compose

# View structure
tree .
```

Expected structure:
```
02_docker_compose/
├── docker-compose.yml
├── .env.example
├── scripts/
│   ├── 01-init-schema.sql
│   ├── cleanup.sh
│   └── verify.sh
└── README.md
```

### Step 2: Review Docker Compose Configuration

The `docker-compose.yml` orchestrates multiple services:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:${MYSQL_VERSION:-8.0}
    container_name: ${COMPOSE_PROJECT_NAME:-mysql}-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "${MYSQL_PORT:-3306}:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./scripts:/docker-entrypoint-initdb.d
      - ./config/my.cnf:/etc/mysql/conf.d/custom.cnf:ro
    networks:
      - mysql-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    command:
      - --default-authentication-plugin=mysql_native_password
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci

  phpmyadmin:
    image: phpmyadmin:${PHPMYADMIN_VERSION:-latest}
    container_name: ${COMPOSE_PROJECT_NAME:-mysql}-phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_USER: ${MYSQL_USER}
      PMA_PASSWORD: ${MYSQL_PASSWORD}
      UPLOAD_LIMIT: 100M
    ports:
      - "${PHPMYADMIN_PORT:-8080}:80"
    networks:
      - mysql-network
    depends_on:
      mysql:
        condition: service_healthy

networks:
  mysql-network:
    driver: bridge
    name: ${COMPOSE_PROJECT_NAME:-mysql}-network

volumes:
  mysql-data:
    name: ${COMPOSE_PROJECT_NAME:-mysql}-data
```

**Key Features**:
1. **Environment Variables**: All configurations externalized
2. **Health Checks**: Ensures MySQL is ready before starting phpMyAdmin
3. **Custom Network**: Isolated network for services
4. **Named Volumes**: Explicit volume naming for easier management
5. **Restart Policies**: Containers restart on failure
6. **Custom Configuration**: MySQL config file mounted as read-only

### Step 3: Create Environment File

```bash
# Copy example to .env
cp .env.example .env

# Edit if needed
nano .env
```

The `.env` file contains:
```properties
# Project Configuration
COMPOSE_PROJECT_NAME=mysql-dev

# MySQL Configuration
MYSQL_VERSION=8.0
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=myapp
MYSQL_USER=appuser
MYSQL_PASSWORD=your_secure_app_password

# phpMyAdmin Configuration
PHPMYADMIN_VERSION=latest
PHPMYADMIN_PORT=8080
```

### Step 4: Create Custom MySQL Configuration

Create `config/my.cnf`:
```bash
mkdir -p config
```

```ini
[mysqld]
# Character Set Configuration
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Connection Configuration
max_connections = 200
connect_timeout = 10

# Cache Configuration
query_cache_type = 1
query_cache_size = 32M

# InnoDB Configuration
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Logging
slow_query_log = 1
slow_query_log_file = /var/lib/mysql/slow-query.log
long_query_time = 2

# Binary Logging (for replication)
log_bin = mysql-bin
binlog_format = ROW
expire_logs_days = 7

[client]
default-character-set = utf8mb4
```

### Step 5: Start the Stack

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service logs
docker-compose logs mysql
docker-compose logs phpmyadmin
```

Expected output:
```
NAME                STATUS         PORTS
mysql-dev-db        Up (healthy)   0.0.0.0:3306->3306/tcp
mysql-dev-phpmyadmin Up            0.0.0.0:8080->80/tcp
```

### Step 6: Access phpMyAdmin

1. Open browser: http://localhost:8080
2. Login with credentials from `.env` file:
   - Server: `mysql`
   - Username: `appuser` (or `root`)
   - Password: from `.env` file

### Step 7: Test Database Operations

**Via Command Line**:
```bash
# Connect to MySQL
docker-compose exec mysql mysql -u appuser -p myapp

# Run test query
SELECT VERSION();
SHOW DATABASES;
```

**Via phpMyAdmin**:
1. Navigate to SQL tab
2. Run queries
3. Create tables
4. Import/Export data

### Step 8: Working with Multiple Databases

```sql
-- Create additional databases
CREATE DATABASE IF NOT EXISTS app_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS app_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges
GRANT ALL PRIVILEGES ON app_test.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON app_staging.* TO 'appuser'@'%';
FLUSH PRIVILEGES;

-- List all databases
SHOW DATABASES;
```

### Step 9: Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect mysql-dev-data

# Backup volume (while running)
docker-compose exec mysql mysqldump -u root -p --all-databases > backup.sql

# Restore from backup
docker-compose exec -T mysql mysql -u root -p < backup.sql
```

### Step 10: Network Inspection

```bash
# List networks
docker network ls

# Inspect network
docker network inspect mysql-dev-network

# Check connectivity
docker-compose exec mysql ping -c 3 phpmyadmin
docker-compose exec phpmyadmin ping -c 3 mysql
```

## Verification Steps

### 1. Verify Services Are Running

```bash
# Check all services are up
docker-compose ps

# All should show "Up" or "Up (healthy)"
```

### 2. Verify MySQL Connectivity

```bash
# From host
docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SELECT 1;"

# Check user permissions
docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW GRANTS FOR 'appuser'@'%';"
```

### 3. Verify phpMyAdmin Access

```bash
# Check phpMyAdmin is accessible
curl -I http://localhost:8080

# Should return HTTP/1.1 200 OK
```

### 4. Run Verification Script

```bash
./scripts/verify.sh
```

## Common Issues and Solutions

### Issue 1: phpMyAdmin Can't Connect to MySQL

**Symptoms**: "mysqli::real_connect(): (HY000/2002): Connection refused"

**Solutions**:
```bash
# Check if MySQL is healthy
docker-compose ps

# Wait for health check to pass
docker-compose logs mysql | grep "ready for connections"

# Restart phpMyAdmin
docker-compose restart phpmyadmin
```

### Issue 2: Port Already in Use

**Symptoms**: "Bind for 0.0.0.0:3306 failed: port is already allocated"

**Solutions**:
```bash
# Check what's using the port
sudo lsof -i :3306

# Option 1: Stop conflicting service
sudo systemctl stop mysql

# Option 2: Change port in .env
# MYSQL_PORT=3307
```

### Issue 3: Environment Variables Not Loading

**Symptoms**: Containers use default values instead of .env values

**Solutions**:
```bash
# Ensure .env is in the same directory as docker-compose.yml
ls -la .env

# Restart with fresh read
docker-compose down
docker-compose up -d

# Verify environment
docker-compose config
```

### Issue 4: Permission Denied on Volumes

**Symptoms**: MySQL fails to start with permission errors

**Solutions**:
```bash
# Check volume ownership
docker volume inspect mysql-dev-data

# Remove and recreate volume
docker-compose down -v
docker-compose up -d

# Or fix permissions
docker-compose exec mysql chown -R mysql:mysql /var/lib/mysql
```

## Advanced Configurations

### Multi-Environment Setup

Create separate compose files:

**docker-compose.dev.yml**:
```yaml
version: '3.8'
services:
  mysql:
    environment:
      MYSQL_DATABASE: myapp_dev
    ports:
      - "3306:3306"
```

**docker-compose.prod.yml**:
```yaml
version: '3.8'
services:
  mysql:
    environment:
      MYSQL_DATABASE: myapp_prod
    ports:
      - "3307:3306"  # Different port
    restart: always
```

Usage:
```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Resource Limits

Add resource constraints:
```yaml
services:
  mysql:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### Secrets Management

For production, use Docker secrets instead of environment variables:

```yaml
services:
  mysql:
    secrets:
      - db_root_password
      - db_password
    environment:
      MYSQL_ROOT_PASSWORD_FILE: /run/secrets/db_root_password
      MYSQL_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_root_password:
    file: ./secrets/db_root_password.txt
  db_password:
    file: ./secrets/db_password.txt
```

## Cleanup

### Stop Services (Keep Data)
```bash
docker-compose stop
```

### Remove Services (Keep Data)
```bash
docker-compose down
```

### Full Cleanup (Remove Everything)
```bash
# Using cleanup script
./scripts/cleanup.sh

# Or manually
docker-compose down -v
docker network rm mysql-dev-network 2>/dev/null
```

## Best Practices

### 1. **Always Use Environment Files**
```yaml
# GOOD
environment:
  MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}

# BAD - hardcoded credentials
environment:
  MYSQL_ROOT_PASSWORD: password123
```

### 2. **Use Named Volumes**
```yaml
# GOOD - explicit naming
volumes:
  mysql-data:
    name: myapp-mysql-data

# OK but harder to manage
volumes:
  mysql-data:
```

### 3. **Implement Health Checks**
```yaml
# GOOD - services wait for dependencies
depends_on:
  mysql:
    condition: service_healthy

# BAD - might start before MySQL is ready
depends_on:
  - mysql
```

### 4. **Use Restart Policies**
```yaml
# GOOD for production
restart: unless-stopped

# GOOD for development
restart: "no"

# AVOID
restart: always  # Restarts even if manually stopped
```

### 5. **Version Pin Images**
```yaml
# GOOD
image: mysql:8.0.32

# RISKY - might break on updates
image: mysql:latest
```

## Key Takeaways

1. Docker Compose orchestrates multi-container applications
2. Environment files (.env) externalize configuration
3. Health checks ensure proper startup order
4. Named volumes make data management easier
5. phpMyAdmin provides GUI management
6. Custom networks isolate services
7. Proper resource limits prevent issues

## Next Steps

In **Tutorial 03: Schema Design**, you will:
- Design normalized database schemas
- Implement foreign keys and relationships
- Create indexes for performance
- Use migrations for schema versioning
- Learn MySQL best practices for schema design

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [phpMyAdmin Documentation](https://docs.phpmyadmin.net/)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)
- [Docker Networking](https://docs.docker.com/network/)

## Quick Reference

### Docker Compose Commands
```bash
docker-compose up -d              # Start services
docker-compose down               # Stop and remove services
docker-compose down -v            # Stop and remove volumes
docker-compose ps                 # List services
docker-compose logs -f            # Follow logs
docker-compose exec mysql bash    # Enter container shell
docker-compose restart mysql      # Restart service
docker-compose config             # Validate and view config
```

### Environment Variables
```bash
# View all environment variables
docker-compose config

# Override single variable
MYSQL_PORT=3307 docker-compose up -d

# Use different env file
docker-compose --env-file .env.prod up -d
```

---

**Congratulations!** You've mastered docker-compose for MySQL. You now have a production-ready development environment with GUI management and proper orchestration.
