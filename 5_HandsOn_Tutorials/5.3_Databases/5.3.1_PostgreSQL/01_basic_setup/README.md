# Tutorial 01: PostgreSQL Basic Setup

## Objectives

By the end of this tutorial, you will:
- Understand what PostgreSQL is and when to use it
- Set up PostgreSQL in a Docker container
- Connect to PostgreSQL using `psql` CLI
- Create your first database and tables
- Perform basic CRUD operations (Create, Read, Update, Delete)
- Understand PostgreSQL data types
- Learn basic SQL queries

## Prerequisites

- Docker installed and running
- Basic command line knowledge
- Text editor (VS Code, vim, nano, etc.)
- 15-30 minutes of time

## What is PostgreSQL?

PostgreSQL (often called "Postgres") is a powerful, open-source object-relational database system with over 35 years of active development. It's known for:

- **ACID Compliance**: Guarantees data integrity
- **Advanced Features**: JSON support, full-text search, geospatial queries
- **Extensibility**: Custom functions, data types, and operators
- **Standards Compliance**: Strong SQL standard adherence
- **Reliability**: Battle-tested in production environments

## When to Use PostgreSQL

✅ **Good Use Cases**:
- Applications requiring complex queries and joins
- Systems needing ACID compliance
- Projects with evolving schema requirements
- Applications using JSON data alongside relational data
- Data warehousing and analytics
- Geospatial applications (PostGIS extension)

❌ **Not Ideal For**:
- Simple key-value storage (use Redis)
- Extremely high write throughput (consider Cassandra)
- Pure document storage (MongoDB might be better)

## Step-by-Step Instructions

### Step 1: Create Project Structure

```bash
# Navigate to tutorial directory
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.1_PostgreSQL/01_basic_setup

# Create subdirectories
mkdir -p scripts examples
```

### Step 2: Review the Docker Compose Configuration

The `docker-compose.yml` file defines our PostgreSQL container:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: postgres-basic
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: learning
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

**Key Components**:
- **Image**: `postgres:15-alpine` - PostgreSQL 15 on Alpine Linux (smaller image)
- **Environment Variables**: Database credentials and default database
- **Port Mapping**: `5432:5432` - PostgreSQL default port
- **Volumes**: Persists data between container restarts
- **Healthcheck**: Ensures database is ready before accepting connections

### Step 3: Start PostgreSQL

```bash
# Start the container
docker-compose up -d

# Verify it's running
docker-compose ps

# Check logs to ensure it started successfully
docker-compose logs postgres
```

**Expected Output**:
```
postgres-basic  | PostgreSQL init process complete; ready for start up.
postgres-basic  | LOG:  database system is ready to accept connections
```

### Step 4: Connect to PostgreSQL

There are multiple ways to connect:

**Method 1: Using docker-compose exec**
```bash
docker-compose exec postgres psql -U postgres -d learning
```

**Method 2: Using psql from host (if installed)**
```bash
psql -h localhost -p 5432 -U postgres -d learning
# Password: postgres123
```

**Method 3: Using Docker run**
```bash
docker exec -it postgres-basic psql -U postgres -d learning
```

### Step 5: Basic psql Commands

Once connected, try these meta-commands:

```sql
-- List all databases
\l

-- Connect to a database
\c learning

-- List all tables
\dt

-- List all schemas
\dn

-- Describe a table
\d table_name

-- Show current database
SELECT current_database();

-- Show current user
SELECT current_user;

-- Show PostgreSQL version
SELECT version();

-- Get help
\?

-- Exit psql
\q
```

### Step 6: Create Your First Table

```sql
-- Create a simple users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    age INTEGER CHECK (age >= 0 AND age <= 150),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verify table was created
\d users

-- View table structure
\d+ users
```

**Explanation of Data Types**:
- `SERIAL`: Auto-incrementing integer (1, 2, 3, ...)
- `VARCHAR(n)`: Variable-length string with max length
- `INTEGER`: Whole numbers
- `BOOLEAN`: true/false values
- `TIMESTAMP`: Date and time

**Constraints Explained**:
- `PRIMARY KEY`: Unique identifier for each row
- `UNIQUE`: No duplicate values allowed
- `NOT NULL`: Value must be provided
- `CHECK`: Custom validation rule
- `DEFAULT`: Default value if none provided

### Step 7: Insert Data (CREATE)

```sql
-- Insert single row
INSERT INTO users (username, email, full_name, age)
VALUES ('john_doe', 'john@example.com', 'John Doe', 30);

-- Insert multiple rows
INSERT INTO users (username, email, full_name, age) VALUES
    ('jane_smith', 'jane@example.com', 'Jane Smith', 28),
    ('bob_jones', 'bob@example.com', 'Bob Jones', 35),
    ('alice_wong', 'alice@example.com', 'Alice Wong', 25),
    ('charlie_brown', 'charlie@example.com', 'Charlie Brown', 40);

-- Insert with RETURNING clause (get the created record)
INSERT INTO users (username, email, full_name, age)
VALUES ('david_miller', 'david@example.com', 'David Miller', 32)
RETURNING *;
```

### Step 8: Query Data (READ)

```sql
-- Select all users
SELECT * FROM users;

-- Select specific columns
SELECT username, email, age FROM users;

-- Filter with WHERE clause
SELECT * FROM users WHERE age > 30;

-- Multiple conditions
SELECT * FROM users WHERE age > 25 AND is_active = true;

-- Pattern matching
SELECT * FROM users WHERE email LIKE '%@example.com';

-- Order results
SELECT * FROM users ORDER BY age DESC;

-- Limit results
SELECT * FROM users ORDER BY created_at DESC LIMIT 3;

-- Count records
SELECT COUNT(*) FROM users;

-- Average age
SELECT AVG(age) AS average_age FROM users;

-- Group by with aggregate
SELECT is_active, COUNT(*) as user_count
FROM users
GROUP BY is_active;
```

### Step 9: Update Data (UPDATE)

```sql
-- Update single record
UPDATE users
SET age = 31
WHERE username = 'john_doe';

-- Update multiple fields
UPDATE users
SET age = 26, full_name = 'Alice Wong (Updated)'
WHERE username = 'alice_wong';

-- Update with calculation
UPDATE users
SET age = age + 1
WHERE age < 30;

-- Update with RETURNING
UPDATE users
SET is_active = false
WHERE age > 35
RETURNING username, is_active;
```

### Step 10: Delete Data (DELETE)

```sql
-- Delete specific record
DELETE FROM users WHERE username = 'charlie_brown';

-- Delete with condition
DELETE FROM users WHERE age < 25;

-- Delete with RETURNING
DELETE FROM users
WHERE is_active = false
RETURNING *;

-- CAUTION: Delete all records (use with care!)
-- DELETE FROM users;
```

### Step 11: Working with More Data Types

```sql
-- Create a products table demonstrating various types
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) CHECK (price >= 0),
    quantity INTEGER DEFAULT 0,
    in_stock BOOLEAN DEFAULT true,
    tags TEXT[],  -- Array of text
    metadata JSONB,  -- JSON data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert with different data types
INSERT INTO products (name, description, price, quantity, tags, metadata)
VALUES (
    'Laptop',
    'High-performance laptop for developers',
    1299.99,
    50,
    ARRAY['electronics', 'computers', 'programming'],
    '{"brand": "TechCorp", "warranty_years": 2, "specs": {"ram": "16GB", "storage": "512GB SSD"}}'::jsonb
);

-- Query JSONB data
SELECT name, metadata->>'brand' AS brand
FROM products;

-- Query array data
SELECT name, tags
FROM products
WHERE 'electronics' = ANY(tags);
```

### Step 12: Understanding Transactions

```sql
-- Start a transaction
BEGIN;

-- Perform operations
INSERT INTO users (username, email, full_name)
VALUES ('test_user', 'test@example.com', 'Test User');

UPDATE users SET age = 99 WHERE username = 'test_user';

-- Check the data (only visible in this transaction)
SELECT * FROM users WHERE username = 'test_user';

-- Rollback (undo all changes)
ROLLBACK;

-- Verify user was not created
SELECT * FROM users WHERE username = 'test_user';

-- Now with COMMIT
BEGIN;
INSERT INTO users (username, email, full_name, age)
VALUES ('final_user', 'final@example.com', 'Final User', 50);
COMMIT;

-- Verify user was created
SELECT * FROM users WHERE username = 'final_user';
```

## Verification Steps

### 1. Verify Container is Running

```bash
docker-compose ps
```

Expected output:
```
NAME              COMMAND                  SERVICE    STATUS         PORTS
postgres-basic    "docker-entrypoint.s…"   postgres   Up (healthy)   0.0.0.0:5432->5432/tcp
```

### 2. Verify Database Connection

```bash
docker-compose exec postgres psql -U postgres -c "SELECT version();"
```

### 3. Verify Tables Exist

```bash
docker-compose exec postgres psql -U postgres -d learning -c "\dt"
```

Expected output:
```
           List of relations
 Schema |   Name   | Type  |  Owner
--------+----------+-------+----------
 public | products | table | postgres
 public | users    | table | postgres
```

### 4. Verify Data

```bash
docker-compose exec postgres psql -U postgres -d learning -c "SELECT COUNT(*) FROM users;"
```

## Common Issues and Troubleshooting

### Issue 1: Container Won't Start

**Symptoms**: `docker-compose up` fails or container exits immediately

**Solutions**:
```bash
# Check logs
docker-compose logs postgres

# Remove old volumes
docker-compose down -v
docker-compose up -d

# Check port is not in use
sudo lsof -i :5432
# or
netstat -an | grep 5432
```

### Issue 2: Connection Refused

**Symptoms**: Cannot connect to database

**Solutions**:
```bash
# Wait for healthcheck to pass
docker-compose ps

# Ensure container is healthy
docker inspect postgres-basic | grep Health

# Check environment variables
docker-compose exec postgres env | grep POSTGRES
```

### Issue 3: Password Authentication Failed

**Symptoms**: "FATAL: password authentication failed"

**Solutions**:
```bash
# Verify credentials in docker-compose.yml
cat docker-compose.yml | grep POSTGRES_PASSWORD

# Reset the database
docker-compose down -v
docker-compose up -d
```

### Issue 4: Data Persists After "down -v"

**Symptoms**: Old data remains after volume removal

**Solutions**:
```bash
# List all volumes
docker volume ls

# Remove specific volume
docker volume rm 01_basic_setup_postgres-data

# Force remove
docker volume prune
```

## Cleanup

### Temporary Cleanup (keeps data)
```bash
# Stop container but keep data
docker-compose stop

# Start again with existing data
docker-compose start
```

### Full Cleanup (removes everything)
```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Verify removal
docker-compose ps
docker volume ls | grep postgres
```

## Best Practices

### 1. **Use Strong Passwords**
```yaml
# BAD - in production
POSTGRES_PASSWORD: postgres123

# GOOD - in production, use secrets
POSTGRES_PASSWORD: ${DB_PASSWORD}  # From environment variable
```

### 2. **Always Use Transactions for Related Operations**
```sql
-- GOOD
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- BAD - if second update fails, first one still happens
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
```

### 3. **Use Appropriate Data Types**
```sql
-- GOOD
price NUMERIC(10, 2)  -- Exact decimal arithmetic

-- BAD - for money
price FLOAT  -- Floating point precision issues
```

### 4. **Add Indexes for Frequently Queried Columns**
```sql
-- Will learn more in performance tuning tutorial
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 5. **Use NOT NULL When Appropriate**
```sql
-- GOOD - enforces data integrity
email VARCHAR(100) NOT NULL

-- BAD - allows NULL emails
email VARCHAR(100)
```

## Key Takeaways

1. PostgreSQL is a powerful, ACID-compliant relational database
2. Docker makes it easy to run PostgreSQL locally
3. `psql` is the PostgreSQL command-line client
4. Basic CRUD operations: INSERT, SELECT, UPDATE, DELETE
5. Transactions ensure data consistency
6. Use appropriate data types and constraints
7. JSONB support makes PostgreSQL flexible

## Next Steps

In **Tutorial 02: Docker Compose**, you will:
- Add pgAdmin for GUI management
- Configure multiple services
- Use environment files for configuration
- Set up networking between containers
- Learn docker-compose best practices

## Additional Resources

- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/15/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [SQL Cheat Sheet](https://www.postgresqltutorial.com/postgresql-cheat-sheet/)
- [psql Command Reference](https://www.postgresql.org/docs/15/app-psql.html)

## Quick Reference

### Common psql Commands
```sql
\l              -- List databases
\c dbname       -- Connect to database
\dt             -- List tables
\d table_name   -- Describe table
\du             -- List users
\q              -- Quit
\?              -- Help
\h SQL_COMMAND  -- Help on SQL command
```

### Common SQL Commands
```sql
-- CREATE
CREATE TABLE name (columns);
CREATE DATABASE name;

-- INSERT
INSERT INTO table (cols) VALUES (vals);

-- SELECT
SELECT * FROM table;
SELECT * FROM table WHERE condition;

-- UPDATE
UPDATE table SET col = val WHERE condition;

-- DELETE
DELETE FROM table WHERE condition;

-- DROP
DROP TABLE table_name;
```

### Docker Compose Commands
```bash
docker-compose up -d         # Start services
docker-compose down          # Stop services
docker-compose down -v       # Stop and remove volumes
docker-compose logs -f       # View logs
docker-compose ps            # List services
docker-compose exec postgres psql -U postgres  # Execute command
docker-compose restart       # Restart services
```

---

**Congratulations!** You've completed Tutorial 01. You now have a solid foundation in PostgreSQL basics. Continue to Tutorial 02 to add pgAdmin and learn more about docker-compose configurations.
