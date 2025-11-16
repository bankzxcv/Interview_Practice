# Tutorial 02: Docker Compose - PostgreSQL + pgAdmin

## Objectives

By the end of this tutorial, you will:
- Understand multi-container Docker Compose setups
- Configure PostgreSQL with pgAdmin web interface
- Use environment files for configuration management
- Set up container networking
- Manage multiple services with docker-compose
- Use pgAdmin for database management
- Understand volumes and data persistence
- Learn docker-compose best practices

## Prerequisites

- Completed Tutorial 01 (Basic Setup)
- Docker and Docker Compose installed
- Basic understanding of PostgreSQL
- Web browser for pgAdmin
- 30-45 minutes of time

## What is pgAdmin?

pgAdmin is the most popular open-source administration and development platform for PostgreSQL. It provides:

- **Web-based Interface**: Access from any browser
- **Query Tool**: Write and execute SQL queries
- **Visual Schema Designer**: Create tables visually
- **Data Viewer**: Browse and edit data
- **Backup/Restore Tools**: Built-in database management
- **Performance Monitoring**: Track query performance

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Docker Compose Network          │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │              │    │              │  │
│  │  PostgreSQL  │◄───┤   pgAdmin    │  │
│  │   :5432      │    │   :5050      │  │
│  │              │    │              │  │
│  └──────┬───────┘    └──────┬───────┘  │
│         │                   │          │
└─────────┼───────────────────┼──────────┘
          │                   │
          ▼                   ▼
    postgres-data      pgadmin-data
     (volume)           (volume)
```

## Step-by-Step Instructions

### Step 1: Create Project Structure

```bash
# Navigate to tutorial directory
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.1_PostgreSQL/02_docker_compose

# Create subdirectories
mkdir -p scripts config pgadmin-config
```

### Step 2: Review the Docker Compose Configuration

The `docker-compose.yml` file now includes both PostgreSQL and pgAdmin:

**Key Improvements**:
- Multiple services (postgres + pgadmin)
- Environment file for configuration
- Named volumes for persistence
- Custom network for service communication
- Resource limits (optional but recommended)
- Dependency management

### Step 3: Create Environment File

Create a `.env` file for configuration:

```bash
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SecurePassword123!
POSTGRES_DB=learning

# pgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=AdminPassword123!

# Network Configuration
POSTGRES_PORT=5432
PGADMIN_PORT=5050
```

**Best Practice**: Never commit `.env` files with real credentials to version control!

### Step 4: Start the Services

```bash
# Start all services
docker-compose up -d

# Verify both services are running
docker-compose ps

# Check logs
docker-compose logs -f

# Wait for services to be healthy
watch docker-compose ps
```

**Expected Output**:
```
NAME                SERVICE     STATUS         PORTS
postgres-main       postgres    Up (healthy)   0.0.0.0:5432->5432/tcp
pgadmin-web         pgadmin     Up (healthy)   0.0.0.0:5050->80/tcp
```

### Step 5: Access pgAdmin Web Interface

1. **Open your browser** to: http://localhost:5050

2. **Login with credentials** from `.env` file:
   - Email: `admin@example.com`
   - Password: `AdminPassword123!`

3. **Register PostgreSQL Server**:
   - Right-click "Servers" → "Register" → "Server"

   **General Tab**:
   - Name: `Local PostgreSQL`

   **Connection Tab**:
   - Host: `postgres` (the service name from docker-compose)
   - Port: `5432`
   - Maintenance database: `postgres`
   - Username: `postgres`
   - Password: `SecurePassword123!`
   - Save password: ✓ (checked)

   Click "Save"

### Step 6: Explore pgAdmin Interface

#### 6.1 Query Tool

```sql
-- Open Query Tool: Right-click database → Query Tool

-- Create a sample table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50),
    salary NUMERIC(10, 2),
    hire_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true
);

-- Insert sample data
INSERT INTO employees (first_name, last_name, email, department, salary) VALUES
    ('John', 'Doe', 'john.doe@company.com', 'Engineering', 85000.00),
    ('Jane', 'Smith', 'jane.smith@company.com', 'Marketing', 72000.00),
    ('Bob', 'Johnson', 'bob.johnson@company.com', 'Engineering', 95000.00),
    ('Alice', 'Williams', 'alice.williams@company.com', 'Sales', 68000.00),
    ('Charlie', 'Brown', 'charlie.brown@company.com', 'HR', 65000.00);

-- Query the data
SELECT * FROM employees;

-- Department statistics
SELECT
    department,
    COUNT(*) as employee_count,
    AVG(salary) as avg_salary,
    MIN(salary) as min_salary,
    MAX(salary) as max_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;
```

#### 6.2 Visual Data Viewer

1. Navigate to: Servers → Local PostgreSQL → Databases → learning → Schemas → public → Tables → employees
2. Right-click → View/Edit Data → All Rows
3. You can now edit data directly in the grid!

#### 6.3 Schema Visualization

1. Click on "employees" table
2. Go to "Columns" tab to see structure
3. Go to "Constraints" tab to see primary key, unique constraints
4. Use "Dependencies" tab to see relationships

### Step 7: Working with Multiple Databases

```sql
-- Create additional databases
CREATE DATABASE development;
CREATE DATABASE testing;
CREATE DATABASE production_backup;

-- List all databases
\l

-- Or in pgAdmin: Right-click "Databases" → Create → Database
```

In pgAdmin:
1. Right-click "Databases"
2. Create → Database
3. Database: `development`
4. Owner: `postgres`
5. Save

### Step 8: Import/Export Data

#### Export Data (Backup)

**Using pgAdmin**:
1. Right-click database → Backup
2. Filename: `/tmp/learning_backup.sql`
3. Format: Plain
4. Click "Backup"

**Using Command Line**:
```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres learning > backup.sql

# Verify backup
ls -lh backup.sql
```

#### Import Data (Restore)

**Using pgAdmin**:
1. Right-click database → Restore
2. Select backup file
3. Click "Restore"

**Using Command Line**:
```bash
# Restore database
docker-compose exec -T postgres psql -U postgres learning < backup.sql
```

### Step 9: User Management in pgAdmin

```sql
-- Create a new user
CREATE USER app_user WITH PASSWORD 'AppPassword123!';

-- Create a read-only user
CREATE USER readonly_user WITH PASSWORD 'ReadPassword123!';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE learning TO app_user;
GRANT CONNECT ON DATABASE learning TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- List users
\du
```

In pgAdmin:
1. Navigate to: Servers → Local PostgreSQL → Login/Group Roles
2. Right-click → Create → Login/Group Role
3. Fill in details
4. Go to "Privileges" tab to set permissions

### Step 10: Query History and Explain

```sql
-- Run a complex query
SELECT
    e.first_name,
    e.last_name,
    e.department,
    e.salary,
    AVG(e.salary) OVER (PARTITION BY e.department) as dept_avg_salary,
    e.salary - AVG(e.salary) OVER (PARTITION BY e.department) as salary_diff
FROM employees e
WHERE e.is_active = true
ORDER BY e.department, e.salary DESC;

-- In pgAdmin Query Tool, click "Explain" button to see query plan
-- Click "Explain Analyze" to see actual execution statistics
```

### Step 11: Dashboard and Monitoring

In pgAdmin:
1. Click on server "Local PostgreSQL"
2. Navigate to "Dashboard" tab
3. View real-time statistics:
   - Server Activity
   - Database Statistics
   - Session Statistics
   - Lock Statistics

### Step 12: Scheduled Jobs (pgAgent)

```sql
-- Create a simple maintenance job
-- This would be configured in pgAdmin's pgAgent extension
-- For now, we'll create a function that could be scheduled

CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    DELETE FROM employees WHERE hire_date < NOW() - INTERVAL '5 years' AND is_active = false;
    RAISE NOTICE 'Cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT cleanup_old_data();
```

## Docker Compose Best Practices

### 1. Use Environment Variables

```yaml
# BAD - hardcoded values
environment:
  POSTGRES_PASSWORD: postgres123

# GOOD - using env vars
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

### 2. Named Volumes for Persistence

```yaml
# GOOD - named volume
volumes:
  - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
    driver: local
```

### 3. Health Checks

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### 4. Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
    reservations:
      memory: 512M
```

### 5. Proper Networking

```yaml
networks:
  postgres-network:
    driver: bridge
```

### 6. Dependency Management

```yaml
depends_on:
  postgres:
    condition: service_healthy
```

## Verification Steps

### 1. Verify Services are Running

```bash
docker-compose ps
```

Expected: Both services show "Up (healthy)"

### 2. Verify PostgreSQL Connection

```bash
docker-compose exec postgres psql -U postgres -c "SELECT version();"
```

### 3. Verify pgAdmin Access

```bash
curl -I http://localhost:5050
```

Expected: HTTP 200 OK

### 4. Verify Network Connectivity

```bash
# From pgAdmin container, ping postgres
docker-compose exec pgadmin ping -c 3 postgres
```

### 5. Verify Data Persistence

```bash
# Create test data
docker-compose exec postgres psql -U postgres learning -c \
  "CREATE TABLE test (id serial, data text);"

# Restart services
docker-compose restart

# Verify data still exists
docker-compose exec postgres psql -U postgres learning -c \
  "SELECT * FROM test;"
```

## Common Issues and Troubleshooting

### Issue 1: pgAdmin Login Loop

**Symptoms**: Can't login, keeps returning to login page

**Solutions**:
```bash
# Clear pgAdmin data
docker-compose down -v
docker-compose up -d

# Check logs
docker-compose logs pgadmin
```

### Issue 2: Can't Connect to PostgreSQL from pgAdmin

**Symptoms**: "Could not connect to server"

**Solutions**:
- Use service name `postgres`, not `localhost`
- Verify both containers are on same network
- Check PostgreSQL is healthy: `docker-compose ps`

```bash
# Test network connectivity
docker-compose exec pgadmin ping postgres
```

### Issue 3: Port Already in Use

**Symptoms**: "Bind for 0.0.0.0:5432 failed: port is already allocated"

**Solutions**:
```bash
# Find what's using the port
sudo lsof -i :5432

# Change port in .env file
POSTGRES_PORT=5433
PGADMIN_PORT=5051

# Restart
docker-compose down
docker-compose up -d
```

### Issue 4: Permission Denied on Volumes

**Symptoms**: "permission denied" errors in logs

**Solutions**:
```bash
# Fix volume permissions
docker-compose down
docker volume rm 02_docker_compose_postgres-data
docker-compose up -d
```

### Issue 5: pgAdmin Too Slow

**Symptoms**: pgAdmin interface is sluggish

**Solutions**:
```yaml
# Increase memory in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

## Cleanup

### Temporary Cleanup (keeps data)

```bash
# Stop services
docker-compose stop

# Start again
docker-compose start
```

### Full Cleanup (removes all data)

```bash
# Stop and remove everything
docker-compose down -v

# Verify cleanup
docker-compose ps
docker volume ls | grep 02_docker_compose
```

## Advanced Configuration

### Custom PostgreSQL Configuration

Create `config/postgresql.conf`:

```conf
# Connection Settings
max_connections = 100
shared_buffers = 128MB

# Logging
log_statement = 'all'
log_duration = on
log_min_duration_statement = 100  # Log queries taking > 100ms

# Performance
effective_cache_size = 4GB
maintenance_work_mem = 64MB
```

Mount it in docker-compose.yml:

```yaml
volumes:
  - ./config/postgresql.conf:/etc/postgresql/postgresql.conf
command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

### pgAdmin Server Configuration

Create `pgadmin-config/servers.json`:

```json
{
  "Servers": {
    "1": {
      "Name": "Local PostgreSQL",
      "Group": "Servers",
      "Host": "postgres",
      "Port": 5432,
      "MaintenanceDB": "postgres",
      "Username": "postgres",
      "SSLMode": "prefer"
    }
  }
}
```

Mount it:

```yaml
volumes:
  - ./pgadmin-config/servers.json:/pgadmin4/servers.json
```

## Security Best Practices

### 1. Strong Passwords

```bash
# Generate strong password
openssl rand -base64 32
```

### 2. Don't Expose Ports Unnecessarily

```yaml
# Development - expose ports
ports:
  - "5432:5432"

# Production - no port exposure (use internal network)
# ports:
#   - "5432:5432"
```

### 3. Use Secrets (Docker Swarm)

```yaml
secrets:
  postgres_password:
    external: true

services:
  postgres:
    secrets:
      - postgres_password
```

### 4. Regular Updates

```bash
# Pull latest images
docker-compose pull

# Recreate containers
docker-compose up -d --force-recreate
```

## Performance Tips

### 1. Use Connection Pooling

Will cover in detail in later tutorials, but consider using PgBouncer:

```yaml
pgbouncer:
  image: pgbouncer/pgbouncer
  environment:
    DATABASES: postgres=host=postgres port=5432 dbname=learning
```

### 2. Monitor Resource Usage

```bash
# Check container stats
docker stats

# Specific to postgres
docker stats postgres-main
```

### 3. Optimize Queries

Use pgAdmin's "Explain Analyze" feature to optimize queries.

## Key Takeaways

1. Docker Compose manages multi-container applications easily
2. pgAdmin provides powerful web-based database management
3. Environment files keep configuration separate from code
4. Named volumes ensure data persistence
5. Container networking enables service communication
6. Health checks ensure services are ready
7. Resource limits prevent resource exhaustion

## Next Steps

In **Tutorial 03: Schema Design**, you will:
- Design complex database schemas
- Create relationships between tables (foreign keys)
- Implement constraints and validations
- Create indexes for performance
- Learn normalization techniques
- Design for real-world applications

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [pgAdmin Docker Hub](https://hub.docker.com/r/dpage/pgadmin4)
- [Docker Compose Best Practices](https://docs.docker.com/compose/production/)

## Quick Reference

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose stop

# Restart services
docker-compose restart

# View logs
docker-compose logs -f [service]

# Execute command
docker-compose exec [service] [command]

# Scale service
docker-compose up -d --scale pgadmin=2

# Remove everything
docker-compose down -v

# Pull latest images
docker-compose pull

# Build images
docker-compose build
```

### pgAdmin Quick Access

- URL: http://localhost:5050
- Default Email: admin@example.com
- Default Password: AdminPassword123!
- Server Host: postgres (not localhost!)
- Server Port: 5432

### Useful SQL from pgAdmin

```sql
-- Active connections
SELECT * FROM pg_stat_activity;

-- Database sizes
SELECT
    datname,
    pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;

-- Table sizes
SELECT
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(relid)) as size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

---

**Congratulations!** You now have a complete development environment with PostgreSQL and pgAdmin. This setup will serve as the foundation for all remaining tutorials.
