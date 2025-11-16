# Tutorial 01: MySQL Basic Setup

## Objectives

By the end of this tutorial, you will:
- Understand what MySQL is and when to use it
- Set up MySQL in a Docker container
- Connect to MySQL using the `mysql` CLI
- Create your first database and tables
- Perform basic CRUD operations (Create, Read, Update, Delete)
- Understand MySQL data types and storage engines
- Learn basic SQL queries and MySQL-specific features

## Prerequisites

- Docker installed and running
- Basic command line knowledge
- Text editor (VS Code, vim, nano, etc.)
- 15-30 minutes of time

## What is MySQL?

MySQL is the world's most popular open-source relational database management system. Key characteristics:

- **Performance**: Optimized for read-heavy workloads
- **Reliability**: Battle-tested by major companies (Facebook, Twitter, YouTube)
- **Ease of Use**: Simple setup and administration
- **Replication**: Built-in master-slave replication
- **Community**: Large ecosystem and extensive documentation
- **Storage Engines**: Multiple engines (InnoDB, MyISAM, etc.)

## When to Use MySQL

✅ **Good Use Cases**:
- Web applications (WordPress, Drupal, Joomla)
- E-commerce platforms
- Read-heavy workloads
- Applications requiring master-slave replication
- LAMP/LEMP stack applications
- Content Management Systems
- Data warehousing with read replicas

❌ **Not Ideal For**:
- Applications requiring complex transactions (PostgreSQL might be better)
- Document-oriented storage (use MongoDB)
- Time-series data (use InfluxDB)
- Graph relationships (use Neo4j)

## Step-by-Step Instructions

### Step 1: Create Project Structure

```bash
# Navigate to tutorial directory
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.2_MySQL/01_basic_setup

# Verify directories exist
ls -la
```

### Step 2: Review the Docker Compose Configuration

The `docker-compose.yml` file defines our MySQL container:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: mysql-basic
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123
      MYSQL_DATABASE: learning
      MYSQL_USER: appuser
      MYSQL_PASSWORD: apppass123
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./scripts:/docker-entrypoint-initdb.d
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-prootpass123"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql-data:
```

**Key Components**:
- **Image**: `mysql:8.0` - MySQL 8.0 (latest stable version)
- **Environment Variables**: Root password, default database, and application user
- **Port Mapping**: `3306:3306` - MySQL default port
- **Volumes**: Persists data between container restarts
- **Command**: Uses native password authentication (compatible with older clients)
- **Healthcheck**: Ensures MySQL is ready before accepting connections

### Step 3: Start MySQL

```bash
# Start the container
docker-compose up -d

# Verify it's running
docker-compose ps

# Check logs to ensure it started successfully
docker-compose logs mysql

# Wait for healthy status
docker-compose ps
```

**Expected Output**:
```
mysql-basic  | MySQL init process done. Ready for start up.
mysql-basic  | mysqld: ready for connections.
```

### Step 4: Connect to MySQL

There are multiple ways to connect:

**Method 1: Using docker-compose exec**
```bash
docker-compose exec mysql mysql -u root -prootpass123 learning
```

**Method 2: Using application user**
```bash
docker-compose exec mysql mysql -u appuser -papppass123 learning
```

**Method 3: Using mysql client from host (if installed)**
```bash
mysql -h 127.0.0.1 -P 3306 -u root -prootpass123 learning
```

**Method 4: Using Docker exec**
```bash
docker exec -it mysql-basic mysql -u root -prootpass123 learning
```

### Step 5: Basic MySQL Commands

Once connected, try these commands:

```sql
-- Show all databases
SHOW DATABASES;

-- Use a specific database
USE learning;

-- Show all tables
SHOW TABLES;

-- Show table structure
DESCRIBE table_name;

-- Show current database
SELECT DATABASE();

-- Show current user
SELECT USER();

-- Show MySQL version
SELECT VERSION();

-- Show server status
STATUS;

-- Get help
HELP;

-- Exit MySQL
EXIT;
-- or
\q
```

### Step 6: Create Your First Table

```sql
-- Create a users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    age INT CHECK (age >= 0 AND age <= 150),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table was created
SHOW TABLES;

-- View table structure
DESCRIBE users;

-- View detailed table information
SHOW CREATE TABLE users;
```

**Explanation of Data Types**:
- `INT AUTO_INCREMENT`: Auto-incrementing integer (1, 2, 3, ...)
- `VARCHAR(n)`: Variable-length string with max length
- `INT`: Integer numbers
- `BOOLEAN`: True/false values (stored as TINYINT)
- `TIMESTAMP`: Date and time with automatic timezone handling

**Constraints Explained**:
- `PRIMARY KEY`: Unique identifier for each row
- `UNIQUE`: No duplicate values allowed
- `NOT NULL`: Value must be provided
- `CHECK`: Custom validation rule (MySQL 8.0+)
- `DEFAULT`: Default value if none provided
- `ON UPDATE CURRENT_TIMESTAMP`: Auto-update timestamp on row modification

**Storage Engine & Charset**:
- `ENGINE=InnoDB`: Default transactional storage engine with foreign key support
- `CHARSET=utf8mb4`: Full Unicode support (including emojis)
- `COLLATE=utf8mb4_unicode_ci`: Case-insensitive Unicode collation

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

-- Insert and get the last inserted ID
INSERT INTO users (username, email, full_name, age)
VALUES ('david_miller', 'david@example.com', 'David Miller', 32);

SELECT LAST_INSERT_ID();

-- Insert with ON DUPLICATE KEY UPDATE
INSERT INTO users (username, email, full_name, age)
VALUES ('john_doe', 'john@example.com', 'John Updated', 31)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), age = VALUES(age);
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
SELECT * FROM users WHERE age > 25 AND is_active = TRUE;

-- Pattern matching
SELECT * FROM users WHERE email LIKE '%@example.com';

-- IN operator
SELECT * FROM users WHERE username IN ('john_doe', 'jane_smith');

-- BETWEEN operator
SELECT * FROM users WHERE age BETWEEN 25 AND 35;

-- Order results
SELECT * FROM users ORDER BY age DESC;

-- Limit results
SELECT * FROM users ORDER BY created_at DESC LIMIT 3;

-- Limit with offset (pagination)
SELECT * FROM users LIMIT 3 OFFSET 2;

-- Count records
SELECT COUNT(*) AS total_users FROM users;

-- Average age
SELECT AVG(age) AS average_age FROM users;

-- Min and Max
SELECT MIN(age) AS youngest, MAX(age) AS oldest FROM users;

-- Group by with aggregate
SELECT is_active, COUNT(*) as user_count
FROM users
GROUP BY is_active;

-- Group by with HAVING
SELECT is_active, AVG(age) as avg_age
FROM users
GROUP BY is_active
HAVING avg_age > 30;
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

-- Update all records (use with caution!)
UPDATE users
SET is_active = TRUE;

-- Update with LIMIT
UPDATE users
SET age = age + 1
WHERE age < 30
ORDER BY age
LIMIT 2;
```

### Step 10: Delete Data (DELETE)

```sql
-- Delete specific record
DELETE FROM users WHERE username = 'charlie_brown';

-- Delete with condition
DELETE FROM users WHERE age < 25;

-- Delete with LIMIT
DELETE FROM users
WHERE is_active = FALSE
ORDER BY created_at
LIMIT 5;

-- CAUTION: Delete all records (use with care!)
-- DELETE FROM users;

-- Truncate table (faster than DELETE, resets AUTO_INCREMENT)
-- TRUNCATE TABLE users;
```

### Step 11: Working with More Data Types

```sql
-- Create a products table demonstrating various types
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) CHECK (price >= 0),
    quantity INT DEFAULT 0,
    in_stock BOOLEAN DEFAULT TRUE,
    tags JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert with JSON data
INSERT INTO products (name, description, price, quantity, tags, metadata)
VALUES (
    'Laptop',
    'High-performance laptop for developers',
    1299.99,
    50,
    JSON_ARRAY('electronics', 'computers', 'programming'),
    JSON_OBJECT(
        'brand', 'TechCorp',
        'warranty_years', 2,
        'specs', JSON_OBJECT('ram', '16GB', 'storage', '512GB SSD')
    )
);

-- Query JSON data
SELECT
    name,
    JSON_EXTRACT(metadata, '$.brand') AS brand,
    JSON_EXTRACT(metadata, '$.specs.ram') AS ram
FROM products;

-- Using JSON_UNQUOTE for cleaner output
SELECT
    name,
    JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.brand')) AS brand
FROM products;

-- Using -> and ->> operators (MySQL 8.0+)
SELECT
    name,
    metadata->'$.brand' AS brand_quoted,
    metadata->>'$.brand' AS brand_clean
FROM products;

-- Query JSON array
SELECT name, tags
FROM products
WHERE JSON_CONTAINS(tags, '"electronics"');
```

### Step 12: Understanding Transactions

```sql
-- Start a transaction
START TRANSACTION;
-- or
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
START TRANSACTION;
INSERT INTO users (username, email, full_name, age)
VALUES ('final_user', 'final@example.com', 'Final User', 50);
COMMIT;

-- Verify user was created
SELECT * FROM users WHERE username = 'final_user';
```

### Step 13: MySQL-Specific Features

```sql
-- REPLACE (INSERT or UPDATE)
REPLACE INTO users (username, email, full_name, age)
VALUES ('john_doe', 'john@example.com', 'John Replaced', 33);

-- INSERT IGNORE (skip if exists)
INSERT IGNORE INTO users (username, email, full_name)
VALUES ('john_doe', 'john@example.com', 'Should be Ignored');

-- Multiple table UPDATE
UPDATE users u, products p
SET u.is_active = FALSE
WHERE u.username = 'john_doe' AND p.name = 'Laptop';

-- SHOW engines
SHOW ENGINES;

-- SHOW variables
SHOW VARIABLES LIKE 'max_connections';

-- SHOW processlist
SHOW PROCESSLIST;
```

## Verification Steps

### 1. Verify Container is Running

```bash
docker-compose ps
```

Expected output:
```
NAME          COMMAND                  SERVICE   STATUS         PORTS
mysql-basic   "docker-entrypoint.s…"   mysql     Up (healthy)   0.0.0.0:3306->3306/tcp, 33060/tcp
```

### 2. Verify Database Connection

```bash
docker-compose exec mysql mysql -u root -prootpass123 -e "SELECT VERSION();"
```

### 3. Verify Tables Exist

```bash
docker-compose exec mysql mysql -u root -prootpass123 learning -e "SHOW TABLES;"
```

Expected output:
```
+--------------------+
| Tables_in_learning |
+--------------------+
| products           |
| users              |
+--------------------+
```

### 4. Verify Data

```bash
docker-compose exec mysql mysql -u root -prootpass123 learning -e "SELECT COUNT(*) AS total FROM users;"
```

## Common Issues and Troubleshooting

### Issue 1: Container Won't Start

**Symptoms**: `docker-compose up` fails or container exits immediately

**Solutions**:
```bash
# Check logs
docker-compose logs mysql

# Remove old volumes
docker-compose down -v
docker-compose up -d

# Check port is not in use
sudo lsof -i :3306
# or
netstat -an | grep 3306
```

### Issue 2: Access Denied Error

**Symptoms**: "ERROR 1045 (28000): Access denied for user"

**Solutions**:
```bash
# Verify credentials in docker-compose.yml
cat docker-compose.yml | grep MYSQL

# Reset the database
docker-compose down -v
docker-compose up -d

# Check user privileges
docker-compose exec mysql mysql -u root -prootpass123 -e "SELECT user, host FROM mysql.user;"
```

### Issue 3: Character Set Issues

**Symptoms**: Cannot store special characters or emojis

**Solutions**:
```sql
-- Check current charset
SHOW VARIABLES LIKE 'character_set%';

-- Set to utf8mb4
ALTER DATABASE learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Convert table
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Issue 4: Connection Timeout

**Symptoms**: "ERROR 2003 (HY000): Can't connect to MySQL server"

**Solutions**:
```bash
# Wait for healthcheck to pass
docker-compose ps

# Check container logs
docker-compose logs -f mysql

# Verify MySQL is listening
docker-compose exec mysql netstat -tuln | grep 3306
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
docker volume ls | grep mysql
```

## Best Practices

### 1. **Use Strong Passwords**
```yaml
# BAD - in production
MYSQL_ROOT_PASSWORD: rootpass123

# GOOD - in production, use secrets
MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}  # From environment variable
```

### 2. **Always Use InnoDB Engine**
```sql
-- GOOD - supports transactions and foreign keys
CREATE TABLE orders (...) ENGINE=InnoDB;

-- BAD - no transaction support
CREATE TABLE orders (...) ENGINE=MyISAM;
```

### 3. **Use Appropriate Data Types**
```sql
-- GOOD
price DECIMAL(10, 2)  -- Exact decimal arithmetic

-- BAD - for money
price FLOAT  -- Floating point precision issues
```

### 4. **Use utf8mb4 Character Set**
```sql
-- GOOD - supports all Unicode including emojis
DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci

-- BAD - limited Unicode support
DEFAULT CHARSET=utf8
```

### 5. **Add Indexes for Performance**
```sql
-- Will learn more in performance tuning tutorial
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 6. **Use Transactions for Related Operations**
```sql
-- GOOD
START TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- BAD - if second update fails, first one still happens
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
```

## Key Takeaways

1. MySQL is the world's most popular open-source relational database
2. InnoDB is the default storage engine with transaction support
3. Docker makes it easy to run MySQL locally
4. `mysql` CLI is the MySQL command-line client
5. Basic CRUD operations: INSERT, SELECT, UPDATE, DELETE
6. Use utf8mb4 for full Unicode support
7. Transactions ensure data consistency
8. JSON support makes MySQL flexible (MySQL 5.7+)

## Next Steps

In **Tutorial 02: Docker Compose**, you will:
- Add phpMyAdmin for GUI management
- Configure multiple MySQL instances
- Use environment files for configuration
- Set up networking between containers
- Learn docker-compose best practices

## Additional Resources

- [MySQL Official Documentation](https://dev.mysql.com/doc/)
- [MySQL Tutorial](https://www.mysqltutorial.org/)
- [MySQL Performance Blog](https://www.percona.com/blog/)
- [MySQL Workbench](https://www.mysql.com/products/workbench/)

## Quick Reference

### Common MySQL Commands
```sql
SHOW DATABASES;               -- List databases
USE dbname;                   -- Switch to database
SHOW TABLES;                  -- List tables
DESCRIBE table_name;          -- Show table structure
SHOW CREATE TABLE name;       -- Show CREATE statement
SHOW PROCESSLIST;             -- Show running queries
SHOW VARIABLES;               -- Show server variables
EXIT;                         -- Quit MySQL
```

### Common SQL Commands
```sql
-- CREATE
CREATE TABLE name (columns) ENGINE=InnoDB;
CREATE DATABASE name CHARACTER SET utf8mb4;

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
docker-compose up -d                           # Start services
docker-compose down                            # Stop services
docker-compose down -v                         # Stop and remove volumes
docker-compose logs -f mysql                   # View logs
docker-compose ps                              # List services
docker-compose exec mysql mysql -u root -p     # Execute command
docker-compose restart                         # Restart services
```

---

**Congratulations!** You've completed Tutorial 01. You now have a solid foundation in MySQL basics. Continue to Tutorial 02 to add phpMyAdmin and learn more about docker-compose configurations.
