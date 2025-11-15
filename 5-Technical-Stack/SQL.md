# SQL Cheatsheet - Quick Reference

Comprehensive SQL guide covering queries, indexing, clustering, optimization, and best practices.

---

## Table of Contents

1. [Basic Queries](#basic-queries)
2. [Joins](#joins)
3. [Aggregations & Grouping](#aggregations--grouping)
4. [Subqueries & CTEs](#subqueries--ctes)
5. [Window Functions](#window-functions)
6. [Indexes](#indexes)
7. [Query Optimization](#query-optimization)
8. [Transactions & ACID](#transactions--acid)
9. [Normalization](#normalization)
10. [Advanced Topics](#advanced-topics)

---

## Basic Queries

```sql
-- SELECT
SELECT column1, column2 FROM table_name;
SELECT * FROM table_name;
SELECT DISTINCT column1 FROM table_name;

-- WHERE
SELECT * FROM users WHERE age > 25;
SELECT * FROM users WHERE age >= 18 AND city = 'NYC';
SELECT * FROM users WHERE age BETWEEN 18 AND 65;
SELECT * FROM users WHERE city IN ('NYC', 'LA', 'SF');
SELECT * FROM users WHERE name LIKE 'John%';  -- Starts with John
SELECT * FROM users WHERE name LIKE '%son';   -- Ends with son
SELECT * FROM users WHERE name LIKE '%oh%';   -- Contains oh
SELECT * FROM users WHERE email IS NULL;
SELECT * FROM users WHERE email IS NOT NULL;

-- ORDER BY
SELECT * FROM users ORDER BY age;              -- ASC (default)
SELECT * FROM users ORDER BY age DESC;
SELECT * FROM users ORDER BY age DESC, name ASC;

-- LIMIT / OFFSET (pagination)
SELECT * FROM users LIMIT 10;                  -- First 10 rows
SELECT * FROM users LIMIT 10 OFFSET 20;        -- Rows 21-30
SELECT * FROM users OFFSET 20 FETCH FIRST 10 ROWS ONLY;  -- SQL standard

-- INSERT
INSERT INTO users (name, email, age) VALUES ('John', 'john@example.com', 30);

INSERT INTO users (name, email, age) VALUES
    ('Alice', 'alice@example.com', 25),
    ('Bob', 'bob@example.com', 35);

-- INSERT from SELECT
INSERT INTO users_backup SELECT * FROM users;

-- UPDATE
UPDATE users SET age = 31 WHERE id = 1;
UPDATE users SET age = age + 1 WHERE city = 'NYC';
UPDATE users SET active = true, updated_at = NOW() WHERE id = 1;

-- DELETE
DELETE FROM users WHERE id = 1;
DELETE FROM users WHERE age < 18;
TRUNCATE TABLE users;                          -- Faster, can't rollback

-- CREATE TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    age INTEGER CHECK (age >= 0 AND age <= 150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- ALTER TABLE
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users RENAME COLUMN name TO full_name;
ALTER TABLE users ALTER COLUMN email TYPE TEXT;

-- DROP TABLE
DROP TABLE users;
DROP TABLE IF EXISTS users;
```

---

## Joins

```sql
-- INNER JOIN (only matching rows)
SELECT users.name, orders.total
FROM users
INNER JOIN orders ON users.id = orders.user_id;

-- LEFT JOIN (all from left, matching from right)
SELECT users.name, orders.total
FROM users
LEFT JOIN orders ON users.id = orders.user_id;

-- RIGHT JOIN (all from right, matching from left)
SELECT users.name, orders.total
FROM users
RIGHT JOIN orders ON users.id = orders.user_id;

-- FULL OUTER JOIN (all from both)
SELECT users.name, orders.total
FROM users
FULL OUTER JOIN orders ON users.id = orders.user_id;

-- CROSS JOIN (cartesian product)
SELECT * FROM table1 CROSS JOIN table2;
SELECT * FROM table1, table2;                  -- Implicit cross join

-- SELF JOIN
SELECT e1.name AS employee, e2.name AS manager
FROM employees e1
LEFT JOIN employees e2 ON e1.manager_id = e2.id;

-- Multiple joins
SELECT u.name, o.total, p.name AS product_name
FROM users u
INNER JOIN orders o ON u.id = o.user_id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id;

-- Using USING (when column names match)
SELECT * FROM users
INNER JOIN orders USING (user_id);

-- Natural join (auto-join on same column names - avoid in production!)
SELECT * FROM users NATURAL JOIN orders;
```

### Visual: Join Types

```
TABLES:
users:           orders:
┌────┬──────┐   ┌────┬─────────┬──────┐
│ id │ name │   │ id │ user_id │total │
├────┼──────┤   ├────┼─────────┼──────┤
│  1 │ Alice│   │  1 │    1    │ 100  │
│  2 │ Bob  │   │  2 │    1    │ 200  │
│  3 │ Carol│   │  3 │    3    │ 150  │
└────┴──────┘   └────┴─────────┴──────┘

INNER JOIN (users.id = orders.user_id):
┌────┬───────┬──────┐
│ id │ name  │total │
├────┼───────┼──────┤
│  1 │ Alice │ 100  │
│  1 │ Alice │ 200  │
│  3 │ Carol │ 150  │
└────┴───────┴──────┘

LEFT JOIN:
┌────┬───────┬──────┐
│ id │ name  │total │
├────┼───────┼──────┤
│  1 │ Alice │ 100  │
│  1 │ Alice │ 200  │
│  2 │ Bob   │ NULL │  ← No orders
│  3 │ Carol │ 150  │
└────┴───────┴──────┘

RIGHT JOIN:
Same as LEFT but from orders perspective

FULL OUTER JOIN:
All rows from both, NULL where no match
```

---

## Aggregations & Grouping

```sql
-- Aggregate functions
SELECT COUNT(*) FROM users;
SELECT COUNT(DISTINCT city) FROM users;
SELECT SUM(total) FROM orders;
SELECT AVG(age) FROM users;
SELECT MIN(age), MAX(age) FROM users;

-- GROUP BY
SELECT city, COUNT(*) AS user_count
FROM users
GROUP BY city;

SELECT city, AVG(age) AS avg_age
FROM users
GROUP BY city
ORDER BY avg_age DESC;

-- Multiple columns in GROUP BY
SELECT city, gender, COUNT(*) AS count
FROM users
GROUP BY city, gender;

-- HAVING (filter after grouping)
SELECT city, COUNT(*) AS user_count
FROM users
GROUP BY city
HAVING COUNT(*) > 100;

SELECT city, AVG(age) AS avg_age
FROM users
GROUP BY city
HAVING AVG(age) > 30;

-- WHERE vs HAVING
SELECT city, COUNT(*) AS active_users
FROM users
WHERE active = true           -- Filter before grouping
GROUP BY city
HAVING COUNT(*) > 50;         -- Filter after grouping

-- String aggregation
SELECT department,
       STRING_AGG(name, ', ' ORDER BY name) AS employees
FROM employees
GROUP BY department;

-- GROUPING SETS (multiple groupings in one query)
SELECT city, gender, COUNT(*)
FROM users
GROUP BY GROUPING SETS (
    (city),
    (gender),
    (city, gender),
    ()                        -- Grand total
);

-- ROLLUP (hierarchical aggregation)
SELECT city, gender, COUNT(*)
FROM users
GROUP BY ROLLUP(city, gender);

-- CUBE (all combinations)
SELECT city, gender, COUNT(*)
FROM users
GROUP BY CUBE(city, gender);
```

---

## Subqueries & CTEs

```sql
-- Subquery in WHERE
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Subquery with IN
SELECT name
FROM employees
WHERE department_id IN (
    SELECT id FROM departments WHERE location = 'NYC'
);

-- Subquery with EXISTS
SELECT name
FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- Correlated subquery (references outer query)
SELECT name, salary,
       (SELECT AVG(salary) FROM employees e2 WHERE e2.department_id = e1.department_id) AS dept_avg
FROM employees e1;

-- Subquery in FROM (derived table)
SELECT dept_name, avg_salary
FROM (
    SELECT department_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
) AS dept_salaries
JOIN departments ON departments.id = dept_salaries.department_id;

-- CTE (Common Table Expression) - more readable than subqueries
WITH high_earners AS (
    SELECT * FROM employees WHERE salary > 100000
)
SELECT department_id, COUNT(*) AS count
FROM high_earners
GROUP BY department_id;

-- Multiple CTEs
WITH
    high_earners AS (
        SELECT * FROM employees WHERE salary > 100000
    ),
    dept_counts AS (
        SELECT department_id, COUNT(*) AS count
        FROM high_earners
        GROUP BY department_id
    )
SELECT d.name, dc.count
FROM dept_counts dc
JOIN departments d ON d.id = dc.department_id;

-- Recursive CTE (hierarchies, graphs)
WITH RECURSIVE subordinates AS (
    -- Base case
    SELECT id, name, manager_id, 1 AS level
    FROM employees
    WHERE id = 1                         -- CEO

    UNION ALL

    -- Recursive case
    SELECT e.id, e.name, e.manager_id, s.level + 1
    FROM employees e
    INNER JOIN subordinates s ON e.manager_id = s.id
)
SELECT * FROM subordinates;
```

---

## Window Functions

```sql
-- ROW_NUMBER (unique sequential number)
SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num
FROM employees;

-- RANK (gaps after ties)
SELECT name, salary,
       RANK() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- DENSE_RANK (no gaps after ties)
SELECT name, salary,
       DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank
FROM employees;

-- NTILE (divide into N buckets)
SELECT name, salary,
       NTILE(4) OVER (ORDER BY salary DESC) AS quartile
FROM employees;

-- PARTITION BY (window per group)
SELECT name, department, salary,
       ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
FROM employees;

-- Aggregate window functions
SELECT name, salary,
       AVG(salary) OVER (PARTITION BY department) AS dept_avg,
       salary - AVG(salary) OVER (PARTITION BY department) AS diff_from_avg
FROM employees;

-- Running total
SELECT date, amount,
       SUM(amount) OVER (ORDER BY date) AS running_total
FROM transactions;

-- Moving average (last 7 days)
SELECT date, amount,
       AVG(amount) OVER (
           ORDER BY date
           ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
       ) AS moving_avg_7day
FROM daily_sales;

-- LAG / LEAD (access previous/next row)
SELECT date, amount,
       LAG(amount, 1) OVER (ORDER BY date) AS prev_day,
       LEAD(amount, 1) OVER (ORDER BY date) AS next_day,
       amount - LAG(amount, 1) OVER (ORDER BY date) AS change
FROM daily_sales;

-- FIRST_VALUE / LAST_VALUE
SELECT name, salary,
       FIRST_VALUE(salary) OVER (PARTITION BY department ORDER BY salary DESC) AS highest_in_dept,
       LAST_VALUE(salary) OVER (PARTITION BY department ORDER BY salary DESC
                                 ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS lowest_in_dept
FROM employees;

-- Frame clause options
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW      -- From start to current
ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING      -- From current to end
ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING              -- 3-row window
RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW
```

### Visual: Window Functions

```
PARTITION BY department ORDER BY salary DESC:

Department A:
┌──────┬────────┬─────────────┬──────┐
│ name │ salary │ RANK()      │ SUM()│
├──────┼────────┼─────────────┼──────┤
│ Alice│ 150000 │ 1           │150000│
│ Bob  │ 120000 │ 2           │270000│
│ Carol│ 100000 │ 3           │370000│
└──────┴────────┴─────────────┴──────┘

Department B:
┌──────┬────────┬─────────────┬──────┐
│ name │ salary │ RANK()      │ SUM()│
├──────┼────────┼─────────────┼──────┤
│ David│ 140000 │ 1           │140000│
│ Eve  │ 110000 │ 2           │250000│
└──────┴────────┴─────────────┴──────┘

Each partition has independent ranking and aggregation.


MOVING AVERAGE (3-row window):
┌──────┬────────┬─────────────────────┐
│ date │ amount │ ROWS BETWEEN...     │
├──────┼────────┼─────────────────────┤
│ Day1 │    100 │ [100] avg=100       │
│ Day2 │    150 │ [100,150] avg=125   │
│ Day3 │    120 │ [100,150,120] avg=123│
│ Day4 │    180 │ [150,120,180] avg=150│ ← 3-row window
│ Day5 │    140 │ [120,180,140] avg=147│
└──────┴────────┴─────────────────────┘
```

---

## Indexes

Indexes speed up SELECT queries but slow down INSERT/UPDATE/DELETE.

```sql
-- CREATE INDEX
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_age ON users(age);

-- Composite index (multi-column)
CREATE INDEX idx_users_city_age ON users(city, age);

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Partial index (condition-based)
CREATE INDEX idx_active_users ON users(city) WHERE active = true;

-- Expression index (function-based)
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Covering index (includes extra columns)
CREATE INDEX idx_users_email_covering ON users(email) INCLUDE (name, age);

-- DROP INDEX
DROP INDEX idx_users_email;

-- Index types

-- B-Tree (default, most common)
CREATE INDEX idx_users_age ON users USING btree (age);
-- Use for: =, <, <=, >, >=, BETWEEN, IN, IS NULL
-- Good for: Most queries, range scans, sorting

-- Hash index (equality only)
CREATE INDEX idx_users_email ON users USING hash (email);
-- Use for: = only
-- Good for: Exact matches
-- Not good for: Range queries, sorting

-- GIN (Generalized Inverted Index) - for arrays, JSONB, full-text
CREATE INDEX idx_tags ON posts USING gin (tags);
CREATE INDEX idx_metadata ON products USING gin (metadata jsonb_path_ops);
-- Use for: Array/JSONB contains, full-text search
-- Good for: Multi-value columns

-- GiST (Generalized Search Tree) - for geometric, full-text
CREATE INDEX idx_location ON stores USING gist (location);
-- Use for: Geometric queries, ranges, full-text
-- Good for: PostGIS, ranges, exclusion constraints

-- BRIN (Block Range Index) - for large, sorted tables
CREATE INDEX idx_created_at ON logs USING brin (created_at);
-- Use for: Very large tables with natural ordering
-- Good for: Time-series data, append-only tables
-- Pros: Very small index size
```

### Index Strategies

```sql
-- Query using index
SELECT * FROM users WHERE email = 'john@example.com';
-- Uses: idx_users_email

-- Composite index usage (left-to-right)
CREATE INDEX idx_users_city_age_name ON users(city, age, name);

-- Uses index efficiently:
SELECT * FROM users WHERE city = 'NYC';                      -- Uses index
SELECT * FROM users WHERE city = 'NYC' AND age = 30;         -- Uses index
SELECT * FROM users WHERE city = 'NYC' AND age > 25;         -- Uses index
SELECT * FROM users WHERE city = 'NYC' AND age = 30 AND name = 'John';  -- Uses index

-- Does NOT use index efficiently:
SELECT * FROM users WHERE age = 30;                          -- Skips first column
SELECT * FROM users WHERE name = 'John';                     -- Skips first columns
SELECT * FROM users WHERE age = 30 AND name = 'John';        -- Skips first column

-- EXPLAIN to see query plan
EXPLAIN SELECT * FROM users WHERE email = 'john@example.com';
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'john@example.com';  -- With execution

-- Index maintenance
REINDEX INDEX idx_users_email;
REINDEX TABLE users;
REINDEX DATABASE mydb;

-- Check index usage (PostgreSQL)
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Unused indexes (consider dropping)
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexrelname NOT LIKE 'pg_%';
```

### Visual: B-Tree Index

```
B-TREE INDEX STRUCTURE:

                    [50, 100]
                   /    |    \
              /         |         \
         /              |              \
   [10, 20, 30]   [60, 70, 80]   [110, 120, 130]
    /  |  |  \      /  |  |  \      /   |   |   \
   5  15 25 35    55  65 75 85    105 115 125 135

Leaf nodes contain actual data pointers.
Search for 75: Start at root → go middle → find 75
Time complexity: O(log n)


COMPOSITE INDEX (city, age):
Index on (city, age) can optimize:
  ✓ WHERE city = 'NYC'
  ✓ WHERE city = 'NYC' AND age = 30
  ✓ WHERE city = 'NYC' AND age > 25
  ✗ WHERE age = 30                      (skips first column)
```

---

## Query Optimization

```sql
-- 1. Use indexes appropriately
-- Bad: Full table scan
SELECT * FROM users WHERE UPPER(email) = 'JOHN@EXAMPLE.COM';

-- Good: Use expression index or lowercase
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'john@example.com';

-- 2. Avoid SELECT *
-- Bad: Fetches unnecessary columns
SELECT * FROM users;

-- Good: Select only needed columns
SELECT id, name, email FROM users;

-- 3. Use LIMIT
-- Bad: Fetches all rows
SELECT * FROM users ORDER BY created_at DESC;

-- Good: Limit results
SELECT * FROM users ORDER BY created_at DESC LIMIT 100;

-- 4. Avoid correlated subqueries
-- Bad: Subquery executes for each row
SELECT name,
       (SELECT COUNT(*) FROM orders WHERE user_id = users.id) AS order_count
FROM users;

-- Good: Use JOIN
SELECT users.name, COUNT(orders.id) AS order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
GROUP BY users.id, users.name;

-- 5. Use EXISTS instead of IN for subqueries
-- Bad: IN with large subquery
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);

-- Good: EXISTS (stops at first match)
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total > 1000);

-- 6. Avoid functions on indexed columns in WHERE
-- Bad: Can't use index
SELECT * FROM users WHERE YEAR(created_at) = 2024;

-- Good: Use range
SELECT * FROM users WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';

-- 7. Use UNION ALL instead of UNION when possible
-- Bad: UNION removes duplicates (expensive)
SELECT name FROM users_2023
UNION
SELECT name FROM users_2024;

-- Good: UNION ALL (no deduplication)
SELECT name FROM users_2023
UNION ALL
SELECT name FROM users_2024;

-- 8. Optimize JOINs
-- Put smallest table first
-- Index foreign keys
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- 9. Partition large tables
-- Partition by range (e.g., date)
CREATE TABLE logs (
    id BIGSERIAL,
    created_at TIMESTAMP,
    message TEXT
) PARTITION BY RANGE (created_at);

CREATE TABLE logs_2024_01 PARTITION OF logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE logs_2024_02 PARTITION OF logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- 10. Use prepared statements (prevents SQL injection, faster)
PREPARE get_user (integer) AS
    SELECT * FROM users WHERE id = $1;

EXECUTE get_user(123);

-- 11. Batch operations
-- Bad: Multiple individual inserts
INSERT INTO users (name) VALUES ('Alice');
INSERT INTO users (name) VALUES ('Bob');
INSERT INTO users (name) VALUES ('Carol');

-- Good: Single batch insert
INSERT INTO users (name) VALUES ('Alice'), ('Bob'), ('Carol');

-- 12. Analyze query plans
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'john@example.com';

-- Look for:
-- - Index Scan (good)
-- - Sequential Scan (bad for large tables)
-- - High cost values
-- - Nested Loop vs Hash Join vs Merge Join
```

---

## Transactions & ACID

```sql
-- Transaction basics
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- Rollback on error
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    -- Something goes wrong
ROLLBACK;

-- Savepoints
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    SAVEPOINT sp1;

    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
    SAVEPOINT sp2;

    -- Oops, rollback to sp1
    ROLLBACK TO sp1;

    UPDATE accounts SET balance = balance + 100 WHERE id = 3;  -- Retry
COMMIT;

-- Isolation levels
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;   -- Dirty reads possible
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;     -- Default in PostgreSQL
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;    -- Prevents non-repeatable reads
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;       -- Strictest

-- Locking
-- Row-level locks
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;     -- Exclusive lock
SELECT * FROM accounts WHERE id = 1 FOR SHARE;      -- Shared lock

-- Table-level locks
LOCK TABLE accounts IN ACCESS EXCLUSIVE MODE;

-- Deadlock handling
-- PostgreSQL automatically detects and breaks deadlocks
```

### ACID Properties

```
ATOMICITY:
    All or nothing. Transaction fully completes or fully rolls back.
    Example: Transfer money - both debit and credit must succeed.

CONSISTENCY:
    Database remains in valid state.
    Constraints are enforced.
    Example: Balance cannot be negative.

ISOLATION:
    Concurrent transactions don't interfere.
    Example: Two transfers don't see intermediate state.

DURABILITY:
    Committed data persists even if system crashes.
    Example: Transaction log ensures recovery.


ISOLATION PROBLEMS:
┌─────────────────────────┬─────┬────────┬───────────┬──────────────┐
│ Problem                 │ RU  │ RC     │ RR        │ Serializable │
├─────────────────────────┼─────┼────────┼───────────┼──────────────┤
│ Dirty Read              │ Yes │ No     │ No        │ No           │
│ Non-Repeatable Read     │ Yes │ Yes    │ No        │ No           │
│ Phantom Read            │ Yes │ Yes    │ Yes (PG:No)│ No          │
└─────────────────────────┴─────┴────────┴───────────┴──────────────┘

RU = READ UNCOMMITTED
RC = READ COMMITTED
RR = REPEATABLE READ
```

---

## Normalization

```sql
-- 1NF (First Normal Form):
-- - Atomic values (no arrays, no multiple values in one column)
-- - Each row is unique
-- - Each column has unique name

-- Bad:
CREATE TABLE orders (
    id INT,
    items VARCHAR(255)  -- "apple, orange, banana" ❌
);

-- Good:
CREATE TABLE orders (
    id INT PRIMARY KEY
);
CREATE TABLE order_items (
    order_id INT REFERENCES orders(id),
    item VARCHAR(255),
    PRIMARY KEY (order_id, item)
);

-- 2NF (Second Normal Form):
-- - Must be in 1NF
-- - No partial dependencies (all non-key columns depend on entire primary key)

-- Bad:
CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    product_name VARCHAR(255),  -- Depends only on product_id, not both ❌
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);

-- Good:
CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    quantity INT,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(255)
);

-- 3NF (Third Normal Form):
-- - Must be in 2NF
-- - No transitive dependencies (non-key columns depend only on primary key)

-- Bad:
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    department_id INT,
    department_name VARCHAR(255),  -- Depends on department_id, not id ❌
    department_location VARCHAR(255)  -- Depends on department_id, not id ❌
);

-- Good:
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    department_id INT REFERENCES departments(id)
);

CREATE TABLE departments (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    location VARCHAR(255)
);

-- Denormalization (trade-off for performance)
-- Sometimes intentionally violate normalization for speed

-- Example: Store aggregated data
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    order_count INT DEFAULT 0,  -- Denormalized
    total_spent DECIMAL(10,2) DEFAULT 0  -- Denormalized
);

-- Update with trigger or application code
CREATE TRIGGER update_user_stats AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION update_user_order_stats();
```

---

## Advanced Topics

### Clustering

```sql
-- Clustering (PostgreSQL)
-- Reorder table data to match index order

CREATE INDEX idx_users_city ON users(city);
CLUSTER users USING idx_users_city;

-- Future inserts won't maintain clustering
-- Re-cluster periodically

-- Check clustering
SELECT tablename, attname
FROM pg_stats
WHERE schemaname = 'public' AND correlation > 0.9;

-- Clustered index (SQL Server)
-- Only one per table, defines physical order
CREATE CLUSTERED INDEX idx_users_id ON users(id);
```

### Partitioning

```sql
-- Range partitioning (PostgreSQL)
CREATE TABLE logs (
    id BIGSERIAL,
    created_at TIMESTAMP NOT NULL,
    level VARCHAR(10),
    message TEXT
) PARTITION BY RANGE (created_at);

CREATE TABLE logs_2024_q1 PARTITION OF logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE logs_2024_q2 PARTITION OF logs
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- List partitioning
CREATE TABLE sales (
    id BIGSERIAL,
    region VARCHAR(50),
    amount DECIMAL
) PARTITION BY LIST (region);

CREATE TABLE sales_north PARTITION OF sales
    FOR VALUES IN ('US-NORTH', 'CANADA');

CREATE TABLE sales_south PARTITION OF sales
    FOR VALUES IN ('US-SOUTH', 'MEXICO');

-- Hash partitioning
CREATE TABLE users (
    id BIGSERIAL,
    email VARCHAR(255)
) PARTITION BY HASH (id);

CREATE TABLE users_p0 PARTITION OF users
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE users_p1 PARTITION OF users
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);
```

### Full-Text Search

```sql
-- PostgreSQL full-text search
CREATE INDEX idx_posts_content ON posts USING gin(to_tsvector('english', content));

SELECT * FROM posts
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'postgresql & performance');

-- With ranking
SELECT title,
       ts_rank(to_tsvector('english', content), to_tsquery('english', 'postgresql')) AS rank
FROM posts
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'postgresql')
ORDER BY rank DESC;

-- Materialized tsvector column (faster)
ALTER TABLE posts ADD COLUMN content_tsv tsvector;
UPDATE posts SET content_tsv = to_tsvector('english', content);
CREATE INDEX idx_posts_content_tsv ON posts USING gin(content_tsv);

-- Trigger to auto-update
CREATE TRIGGER tsvector_update BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(content_tsv, 'pg_catalog.english', content);
```

### Materialized Views

```sql
-- Create materialized view
CREATE MATERIALIZED VIEW user_stats AS
SELECT user_id,
       COUNT(*) AS order_count,
       SUM(total) AS total_spent,
       AVG(total) AS avg_order_value
FROM orders
GROUP BY user_id;

-- Create index on materialized view
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- Refresh (blocking)
REFRESH MATERIALIZED VIEW user_stats;

-- Refresh concurrently (non-blocking, requires unique index)
CREATE UNIQUE INDEX idx_user_stats_user_id_unique ON user_stats(user_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;

-- Auto-refresh with cron or application code
```

### JSON/JSONB (PostgreSQL)

```sql
-- JSONB (binary JSON, faster, indexable)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    metadata JSONB
);

INSERT INTO products (name, metadata) VALUES
('Product 1', '{"color": "red", "size": "large", "tags": ["new", "sale"]}');

-- Query JSONB
SELECT * FROM products WHERE metadata->>'color' = 'red';
SELECT * FROM products WHERE metadata @> '{"color": "red"}';  -- Contains
SELECT * FROM products WHERE metadata ? 'size';                -- Key exists
SELECT * FROM products WHERE metadata->'tags' @> '["sale"]';  -- Array contains

-- Index JSONB
CREATE INDEX idx_products_metadata ON products USING gin(metadata);
CREATE INDEX idx_products_metadata_path ON products USING gin(metadata jsonb_path_ops);

-- Update JSONB
UPDATE products SET metadata = jsonb_set(metadata, '{color}', '"blue"') WHERE id = 1;
```

---

**Last updated:** 2025-11-15
