-- Basic PostgreSQL Queries Example
-- Run these interactively to learn SQL

-- ================================
-- 1. SELECT QUERIES
-- ================================

-- Select all users
SELECT * FROM users;

-- Select specific columns
SELECT username, email FROM users;

-- Count all users
SELECT COUNT(*) AS total_users FROM users;

-- Select with WHERE clause
SELECT * FROM users WHERE age > 30;

-- Multiple conditions with AND
SELECT * FROM users WHERE age > 25 AND is_active = true;

-- Multiple conditions with OR
SELECT * FROM users WHERE age < 25 OR age > 35;

-- Pattern matching with LIKE
SELECT * FROM users WHERE email LIKE '%@example.com';
SELECT * FROM users WHERE username LIKE 'j%';  -- Starts with 'j'

-- IN clause
SELECT * FROM users WHERE username IN ('john_doe', 'jane_smith');

-- BETWEEN clause
SELECT * FROM users WHERE age BETWEEN 25 AND 35;

-- IS NULL / IS NOT NULL
SELECT * FROM users WHERE full_name IS NOT NULL;

-- ORDER BY
SELECT * FROM users ORDER BY age DESC;
SELECT * FROM users ORDER BY created_at ASC;
SELECT * FROM users ORDER BY age DESC, username ASC;

-- LIMIT and OFFSET (pagination)
SELECT * FROM users LIMIT 2;
SELECT * FROM users OFFSET 2 LIMIT 2;

-- DISTINCT
SELECT DISTINCT is_active FROM users;

-- ================================
-- 2. AGGREGATE FUNCTIONS
-- ================================

-- Count
SELECT COUNT(*) FROM users;
SELECT COUNT(DISTINCT age) FROM users;

-- Average
SELECT AVG(age) AS average_age FROM users;

-- Sum
SELECT SUM(age) AS total_age FROM users;

-- Min and Max
SELECT MIN(age) AS youngest, MAX(age) AS oldest FROM users;

-- Multiple aggregates
SELECT
    COUNT(*) AS total_users,
    AVG(age) AS avg_age,
    MIN(age) AS min_age,
    MAX(age) AS max_age
FROM users;

-- ================================
-- 3. GROUP BY
-- ================================

-- Count users by active status
SELECT is_active, COUNT(*) AS count
FROM users
GROUP BY is_active;

-- Average age by active status
SELECT is_active, AVG(age) AS avg_age
FROM users
GROUP BY is_active;

-- HAVING clause (filter groups)
SELECT is_active, COUNT(*) AS count
FROM users
GROUP BY is_active
HAVING COUNT(*) > 2;

-- ================================
-- 4. WORKING WITH JSONB
-- ================================

-- Select JSONB field
SELECT name, metadata->>'brand' AS brand FROM products;

-- Select nested JSONB
SELECT name, metadata->'specs'->>'ram' AS ram FROM products;

-- Filter by JSONB field
SELECT * FROM products WHERE metadata->>'brand' = 'TechCorp';

-- Check if JSONB key exists
SELECT * FROM products WHERE metadata ? 'warranty_years';

-- JSONB contains
SELECT * FROM products WHERE metadata @> '{"brand": "Logitech"}';

-- ================================
-- 5. WORKING WITH ARRAYS
-- ================================

-- Select array field
SELECT name, tags FROM products;

-- Check if array contains element
SELECT name FROM products WHERE 'electronics' = ANY(tags);

-- Array length
SELECT name, array_length(tags, 1) AS tag_count FROM products;

-- Unnest array (convert to rows)
SELECT name, unnest(tags) AS tag FROM products;

-- ================================
-- 6. INSERT STATEMENTS
-- ================================

-- Insert single row
INSERT INTO users (username, email, full_name, age)
VALUES ('new_user', 'new@example.com', 'New User', 27);

-- Insert multiple rows
INSERT INTO users (username, email, full_name, age) VALUES
    ('user1', 'user1@example.com', 'User One', 22),
    ('user2', 'user2@example.com', 'User Two', 24);

-- Insert with RETURNING
INSERT INTO users (username, email, full_name, age)
VALUES ('return_user', 'return@example.com', 'Return User', 29)
RETURNING id, username, created_at;

-- Insert from SELECT
INSERT INTO users (username, email, full_name, age)
SELECT 'copied_' || username, 'copy_' || email, full_name, age
FROM users
WHERE age > 30
LIMIT 1;

-- ================================
-- 7. UPDATE STATEMENTS
-- ================================

-- Update single field
UPDATE users SET age = 31 WHERE username = 'john_doe';

-- Update multiple fields
UPDATE users
SET age = 29, full_name = 'Jane Smith Updated'
WHERE username = 'jane_smith';

-- Update with calculation
UPDATE users SET age = age + 1 WHERE age < 30;

-- Update all rows (use carefully!)
-- UPDATE users SET is_active = true;

-- Update with RETURNING
UPDATE users
SET is_active = false
WHERE age > 40
RETURNING username, is_active;

-- Update from another table (will learn in joins tutorial)
-- UPDATE users u SET full_name = o.name FROM other_table o WHERE u.id = o.user_id;

-- ================================
-- 8. DELETE STATEMENTS
-- ================================

-- Delete specific row
DELETE FROM users WHERE username = 'new_user';

-- Delete with condition
DELETE FROM users WHERE username LIKE 'user%';

-- Delete with RETURNING
DELETE FROM users
WHERE username = 'return_user'
RETURNING *;

-- Delete all rows (use very carefully!)
-- DELETE FROM users;

-- ================================
-- 9. TRANSACTIONS
-- ================================

-- Basic transaction
BEGIN;
    INSERT INTO users (username, email, full_name)
    VALUES ('trans_user', 'trans@example.com', 'Transaction User');
    UPDATE users SET age = 100 WHERE username = 'trans_user';
COMMIT;

-- Transaction with rollback
BEGIN;
    INSERT INTO users (username, email, full_name)
    VALUES ('rollback_user', 'rollback@example.com', 'Rollback User');
    -- Oops, changed our mind
ROLLBACK;

-- Check rollback worked
SELECT * FROM users WHERE username = 'rollback_user';  -- Should return nothing

-- ================================
-- 10. USEFUL UTILITY QUERIES
-- ================================

-- Current database
SELECT current_database();

-- Current user
SELECT current_user;

-- PostgreSQL version
SELECT version();

-- Current timestamp
SELECT NOW();
SELECT CURRENT_TIMESTAMP;

-- Date/time functions
SELECT CURRENT_DATE;
SELECT CURRENT_TIME;
SELECT NOW() + INTERVAL '1 day' AS tomorrow;
SELECT NOW() - INTERVAL '1 week' AS last_week;

-- Extract parts from timestamp
SELECT
    EXTRACT(YEAR FROM created_at) AS year,
    EXTRACT(MONTH FROM created_at) AS month,
    EXTRACT(DAY FROM created_at) AS day
FROM users
LIMIT 1;

-- String functions
SELECT
    UPPER(username) AS upper_name,
    LOWER(username) AS lower_name,
    LENGTH(username) AS name_length,
    SUBSTRING(username, 1, 4) AS first_4_chars
FROM users
LIMIT 3;

-- Concatenation
SELECT username || ' (' || email || ')' AS user_info FROM users;
SELECT CONCAT(username, ' - ', email) AS user_info FROM users;

-- COALESCE (return first non-null value)
SELECT username, COALESCE(full_name, username) AS display_name FROM users;

-- CASE statement
SELECT
    username,
    age,
    CASE
        WHEN age < 25 THEN 'Young'
        WHEN age BETWEEN 25 AND 35 THEN 'Adult'
        ELSE 'Senior'
    END AS age_group
FROM users;

-- ================================
-- 11. SUBQUERIES
-- ================================

-- Subquery in WHERE clause
SELECT * FROM users
WHERE age > (SELECT AVG(age) FROM users);

-- Subquery in SELECT clause
SELECT
    username,
    age,
    (SELECT AVG(age) FROM users) AS avg_age,
    age - (SELECT AVG(age) FROM users) AS age_difference
FROM users;

-- Subquery with IN
SELECT * FROM users
WHERE age IN (SELECT DISTINCT age FROM users WHERE age > 30);

-- ================================
-- 12. Common Table Expressions (CTE)
-- ================================

-- Basic CTE
WITH adult_users AS (
    SELECT * FROM users WHERE age >= 25
)
SELECT * FROM adult_users WHERE is_active = true;

-- Multiple CTEs
WITH
    young_users AS (SELECT * FROM users WHERE age < 30),
    active_users AS (SELECT * FROM users WHERE is_active = true)
SELECT * FROM young_users WHERE username IN (SELECT username FROM active_users);

-- CTE with aggregation
WITH user_stats AS (
    SELECT
        is_active,
        COUNT(*) AS count,
        AVG(age) AS avg_age
    FROM users
    GROUP BY is_active
)
SELECT * FROM user_stats;

-- ================================
-- 13. WINDOW FUNCTIONS (Advanced)
-- ================================

-- Row number
SELECT
    username,
    age,
    ROW_NUMBER() OVER (ORDER BY age DESC) AS age_rank
FROM users;

-- Rank with ties
SELECT
    username,
    age,
    RANK() OVER (ORDER BY age DESC) AS rank
FROM users;

-- Running total
SELECT
    username,
    age,
    SUM(age) OVER (ORDER BY created_at) AS running_age_total
FROM users;

-- ================================
-- 14. EXPLAIN (Query Planning)
-- ================================

-- See query execution plan
EXPLAIN SELECT * FROM users WHERE age > 30;

-- More detailed analysis
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 30;

-- ================================
-- 15. DATABASE INTROSPECTION
-- ================================

-- List all tables in current database
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- List all columns in a table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users';

-- Table sizes
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Active connections
SELECT count(*) FROM pg_stat_activity;
