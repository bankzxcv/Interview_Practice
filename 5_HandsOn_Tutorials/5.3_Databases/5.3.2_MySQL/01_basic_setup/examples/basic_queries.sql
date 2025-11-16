-- MySQL Basic Queries Examples
-- Run these queries to practice basic MySQL operations

-- ============================================================================
-- 1. SELECT QUERIES
-- ============================================================================

-- Select all users
SELECT * FROM users;

-- Select specific columns
SELECT username, email, age FROM users;

-- Select with alias
SELECT username AS 'User Name', email AS 'Email Address' FROM users;

-- ============================================================================
-- 2. WHERE CLAUSE
-- ============================================================================

-- Simple condition
SELECT * FROM users WHERE age > 30;

-- Multiple conditions with AND
SELECT * FROM users WHERE age > 25 AND is_active = TRUE;

-- Multiple conditions with OR
SELECT * FROM users WHERE age < 25 OR age > 40;

-- Pattern matching with LIKE
SELECT * FROM users WHERE email LIKE '%@example.com';

-- IN operator
SELECT * FROM users WHERE username IN ('john_doe', 'jane_smith', 'admin');

-- BETWEEN operator
SELECT * FROM users WHERE age BETWEEN 25 AND 35;

-- IS NULL / IS NOT NULL
SELECT * FROM users WHERE full_name IS NOT NULL;

-- ============================================================================
-- 3. ORDERING AND LIMITING
-- ============================================================================

-- Order by ascending
SELECT * FROM users ORDER BY age ASC;

-- Order by descending
SELECT * FROM users ORDER BY age DESC;

-- Multiple order columns
SELECT * FROM users ORDER BY is_active DESC, age ASC;

-- Limit results
SELECT * FROM users LIMIT 5;

-- Limit with offset (pagination)
SELECT * FROM users LIMIT 5 OFFSET 10;

-- Alternative pagination syntax
SELECT * FROM users LIMIT 10, 5;  -- Skip 10, return 5

-- ============================================================================
-- 4. AGGREGATE FUNCTIONS
-- ============================================================================

-- Count all users
SELECT COUNT(*) AS total_users FROM users;

-- Count non-null values
SELECT COUNT(age) AS users_with_age FROM users;

-- Average age
SELECT AVG(age) AS average_age FROM users;

-- Min and Max
SELECT MIN(age) AS youngest, MAX(age) AS oldest FROM users;

-- Sum
SELECT SUM(age) AS total_age FROM users;

-- ============================================================================
-- 5. GROUP BY
-- ============================================================================

-- Group by single column
SELECT is_active, COUNT(*) as user_count
FROM users
GROUP BY is_active;

-- Group by with average
SELECT is_active, AVG(age) as avg_age
FROM users
GROUP BY is_active;

-- Group by with HAVING clause
SELECT is_active, AVG(age) as avg_age
FROM users
GROUP BY is_active
HAVING avg_age > 30;

-- ============================================================================
-- 6. INSERT OPERATIONS
-- ============================================================================

-- Insert single row
INSERT INTO users (username, email, full_name, age)
VALUES ('new_user', 'new@example.com', 'New User', 27);

-- Insert multiple rows
INSERT INTO users (username, email, full_name, age) VALUES
    ('user1', 'user1@example.com', 'User One', 24),
    ('user2', 'user2@example.com', 'User Two', 26),
    ('user3', 'user3@example.com', 'User Three', 29);

-- Insert with ON DUPLICATE KEY UPDATE
INSERT INTO users (username, email, full_name, age)
VALUES ('admin', 'admin@example.com', 'Updated Admin', 36)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), age = VALUES(age);

-- Insert and get last ID
INSERT INTO users (username, email, full_name, age)
VALUES ('last_user', 'last@example.com', 'Last User', 30);
SELECT LAST_INSERT_ID();

-- ============================================================================
-- 7. UPDATE OPERATIONS
-- ============================================================================

-- Update single field
UPDATE users SET age = 28 WHERE username = 'new_user';

-- Update multiple fields
UPDATE users
SET age = 25, full_name = 'Updated Name'
WHERE username = 'user1';

-- Update with calculation
UPDATE users SET age = age + 1 WHERE age < 30;

-- Update all rows (use with caution!)
-- UPDATE users SET is_active = TRUE;

-- ============================================================================
-- 8. DELETE OPERATIONS
-- ============================================================================

-- Delete specific row
DELETE FROM users WHERE username = 'user3';

-- Delete with condition
DELETE FROM users WHERE age < 20;

-- Delete with LIMIT
DELETE FROM users WHERE is_active = FALSE LIMIT 5;

-- ============================================================================
-- 9. JSON OPERATIONS (MySQL 5.7+)
-- ============================================================================

-- Select JSON field
SELECT name, tags, metadata FROM products;

-- Extract JSON values
SELECT
    name,
    JSON_EXTRACT(metadata, '$.brand') AS brand,
    JSON_EXTRACT(metadata, '$.warranty_years') AS warranty
FROM products;

-- Using -> operator (MySQL 5.7+)
SELECT
    name,
    metadata->'$.brand' AS brand_quoted,
    metadata->>'$.brand' AS brand_clean
FROM products;

-- Check if JSON contains value
SELECT name FROM products
WHERE JSON_CONTAINS(tags, '"electronics"');

-- Search in JSON array
SELECT name FROM products
WHERE JSON_SEARCH(tags, 'one', 'demo') IS NOT NULL;

-- ============================================================================
-- 10. JOINS (for when you have related tables)
-- ============================================================================

-- Create a sample orders table for join examples
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    quantity INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- Inner join
SELECT u.username, o.quantity, o.order_date
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- Left join
SELECT u.username, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username;

-- ============================================================================
-- 11. SUBQUERIES
-- ============================================================================

-- Subquery in WHERE
SELECT * FROM users
WHERE age > (SELECT AVG(age) FROM users);

-- Subquery in FROM
SELECT avg_age_group.is_active, avg_age_group.avg_age
FROM (
    SELECT is_active, AVG(age) as avg_age
    FROM users
    GROUP BY is_active
) AS avg_age_group;

-- ============================================================================
-- 12. TRANSACTIONS
-- ============================================================================

-- Start transaction
START TRANSACTION;

-- Make changes
INSERT INTO users (username, email, full_name, age)
VALUES ('tx_user', 'tx@example.com', 'Transaction User', 30);

UPDATE users SET age = age + 1 WHERE username = 'tx_user';

-- Rollback (undo all changes)
ROLLBACK;

-- Commit (save all changes)
-- COMMIT;

-- ============================================================================
-- 13. UTILITY QUERIES
-- ============================================================================

-- Show table structure
DESCRIBE users;

-- Show create table statement
SHOW CREATE TABLE users;

-- Show indexes
SHOW INDEX FROM users;

-- Show table status
SHOW TABLE STATUS LIKE 'users';

-- Show MySQL version
SELECT VERSION();

-- Show current database
SELECT DATABASE();

-- Show current user
SELECT USER();

-- Show server status
SHOW STATUS LIKE 'Threads_connected';

-- Show variables
SHOW VARIABLES LIKE 'max_connections';
