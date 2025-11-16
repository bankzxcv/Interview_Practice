# Tutorial 03: MySQL Schema Design

## Objectives

By the end of this tutorial, you will:
- Master database normalization (1NF, 2NF, 3NF, BCNF)
- Design efficient relational schemas
- Implement foreign keys and relationships
- Create and manage indexes for performance
- Use constraints for data integrity
- Learn schema migration strategies
- Apply MySQL schema best practices

## Prerequisites

- Completed Tutorial 01 & 02
- Understanding of SQL basics
- Familiarity with relational database concepts
- 30-45 minutes of time

## What is Schema Design?

Schema design is the process of defining the structure of your database including:
- Tables and their columns
- Data types
- Relationships between tables
- Constraints and validations
- Indexes for performance
- Partitioning strategies

**Good schema design**:
- Reduces data redundancy
- Ensures data integrity
- Improves query performance
- Makes the system maintainable

## Database Normalization

### First Normal Form (1NF)
- Each column contains atomic (indivisible) values
- Each column contains values of a single type
- Each column has a unique name
- No repeating groups

**Bad Example** (violates 1NF):
```sql
CREATE TABLE orders (
    id INT,
    customer_name VARCHAR(100),
    products VARCHAR(500)  -- "Laptop, Mouse, Keyboard"
);
```

**Good Example** (1NF compliant):
```sql
CREATE TABLE orders (
    id INT PRIMARY KEY,
    customer_name VARCHAR(100)
);

CREATE TABLE order_items (
    id INT PRIMARY KEY,
    order_id INT,
    product_name VARCHAR(100),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### Second Normal Form (2NF)
- Must be in 1NF
- No partial dependencies (all non-key attributes depend on the entire primary key)

**Bad Example** (violates 2NF):
```sql
CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    product_name VARCHAR(100),  -- Depends only on product_id, not the whole key
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);
```

**Good Example** (2NF compliant):
```sql
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10, 2)
);

CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    quantity INT,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### Third Normal Form (3NF)
- Must be in 2NF
- No transitive dependencies (non-key attributes don't depend on other non-key attributes)

**Bad Example** (violates 3NF):
```sql
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    department_id INT,
    department_name VARCHAR(100),  -- Depends on department_id, not employee id
    department_location VARCHAR(100)  -- Transitive dependency
);
```

**Good Example** (3NF compliant):
```sql
CREATE TABLE departments (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100)
);

CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

## Complete E-Commerce Schema Example

Let's design a complete e-commerce database:

```sql
-- Users and Authentication
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Addresses
CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address_type ENUM('shipping', 'billing') NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent_id (parent_id),
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    cost DECIMAL(10, 2) CHECK (cost >= 0),
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INT DEFAULT 10,
    weight DECIMAL(10, 2),
    dimensions JSON,  -- {"length": 10, "width": 5, "height": 3}
    is_active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_category_id (category_id),
    INDEX idx_sku (sku),
    INDEX idx_price (price),
    INDEX idx_active (is_active),
    INDEX idx_featured (featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Images
CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    shipping_address_id INT,
    billing_address_id INT,
    payment_method ENUM('credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'),
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(id),
    FOREIGN KEY (billing_address_id) REFERENCES addresses(id),
    INDEX idx_user_id (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shopping Cart
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Reviews
CREATE TABLE product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    review TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product_review (user_id, product_id),
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Index Design Best Practices

### 1. Primary Key Indexes
Always use primary keys:
```sql
-- GOOD
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY
);

-- BAD - no primary key
CREATE TABLE users (
    email VARCHAR(255) UNIQUE
);
```

### 2. Foreign Key Indexes
MySQL doesn't auto-index foreign keys in all cases:
```sql
-- Create explicit indexes on foreign keys
CREATE INDEX idx_order_user_id ON orders(user_id);
CREATE INDEX idx_order_item_order_id ON order_items(order_id);
```

### 3. Composite Indexes
Order matters for composite indexes:
```sql
-- Good for queries: WHERE user_id = ? AND status = ?
CREATE INDEX idx_user_status ON orders(user_id, status);

-- Also good for: WHERE user_id = ?
-- But NOT optimal for: WHERE status = ?

-- Create separate index if you query status alone frequently
CREATE INDEX idx_status ON orders(status);
```

### 4. Covering Indexes
Include all columns needed by common queries:
```sql
-- Query: SELECT username, email FROM users WHERE created_at > ?
CREATE INDEX idx_created_username_email ON users(created_at, username, email);
-- This covering index allows the query without accessing the table
```

### 5. Prefix Indexes for Long Strings
```sql
-- For VARCHAR(500) or TEXT columns
CREATE INDEX idx_description_prefix ON products(description(100));
```

## Migration Strategies

### Method 1: Version-Based Migrations

Create migration files:

**migrations/001_create_users.sql**:
```sql
-- UP
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL
);

-- DOWN
DROP TABLE IF EXISTS users;
```

**migrations/002_add_username.sql**:
```sql
-- UP
ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;

-- DOWN
ALTER TABLE users DROP COLUMN username;
```

### Method 2: ALTER TABLE Commands

```sql
-- Add column
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Modify column
ALTER TABLE users MODIFY COLUMN phone VARCHAR(30);

-- Rename column
ALTER TABLE users CHANGE phone phone_number VARCHAR(30);

-- Drop column
ALTER TABLE users DROP COLUMN phone_number;

-- Add index
ALTER TABLE users ADD INDEX idx_email (email);

-- Drop index
ALTER TABLE users DROP INDEX idx_email;

-- Add foreign key
ALTER TABLE orders
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id) REFERENCES users(id);

-- Drop foreign key
ALTER TABLE orders DROP FOREIGN KEY fk_user;
```

## Data Types Best Practices

### Numeric Types
```sql
-- Use appropriate sizes
INT            -- -2,147,483,648 to 2,147,483,647
BIGINT         -- Very large numbers
TINYINT        -- -128 to 127 (or 0 to 255 UNSIGNED)
DECIMAL(10,2)  -- Exact decimal (for money)
FLOAT/DOUBLE   -- Approximate (for scientific calculations)
```

### String Types
```sql
-- Fixed vs Variable length
CHAR(10)       -- Fixed length, faster for short fixed strings
VARCHAR(255)   -- Variable length, more flexible
TEXT           -- Large text (up to 65,535 bytes)
MEDIUMTEXT     -- Up to 16MB
LONGTEXT       -- Up to 4GB

-- Use utf8mb4 for full Unicode
DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### Date/Time Types
```sql
DATE           -- YYYY-MM-DD
DATETIME       -- YYYY-MM-DD HH:MM:SS (doesn't handle timezone)
TIMESTAMP      -- Auto-converts to UTC, handles timezone
TIME           -- HH:MM:SS
YEAR           -- YYYY
```

### JSON Type
```sql
-- Efficient JSON storage (MySQL 5.7+)
metadata JSON  -- Validated JSON, can be indexed with generated columns
```

## Practical Schema Design Exercise

Design a blog system with these requirements:
- Users can write posts
- Posts belong to categories
- Posts can have multiple tags
- Users can comment on posts
- Comments can be nested (replies)

<details>
<summary>Click to see solution</summary>

```sql
-- Users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Posts
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image VARCHAR(500),
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status_published (status, published_at),
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tags
CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Post-Tag relationship (many-to-many)
CREATE TABLE post_tags (
    post_id INT,
    tag_id INT,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Comments (with self-referencing for nested comments)
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT NULL,  -- NULL for top-level comments
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'spam') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
</details>

## Verification Steps

```bash
# Start the environment
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.2_MySQL/03_schema_design
docker-compose up -d

# Execute the schema creation
docker-compose exec mysql mysql -u root -p < scripts/create_schema.sql

# Verify tables
docker-compose exec mysql mysql -u root -p ecommerce -e "SHOW TABLES;"

# Check foreign keys
docker-compose exec mysql mysql -u root -p ecommerce -e "
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'ecommerce' AND REFERENCED_TABLE_NAME IS NOT NULL;
"

# Check indexes
docker-compose exec mysql mysql -u root -p ecommerce -e "SHOW INDEX FROM products;"
```

## Best Practices Summary

1. **Normalize your data** to 3NF for transactional systems
2. **Use appropriate data types** - don't over-allocate
3. **Index wisely** - not too few, not too many
4. **Use foreign keys** for referential integrity
5. **Use InnoDB** for transaction support
6. **Use utf8mb4** for full Unicode support
7. **Plan for growth** - use INT for IDs (or BIGINT for very large tables)
8. **Use ENUM sparingly** - consider lookup tables for flexibility
9. **Add created_at/updated_at** to most tables
10. **Version your schema** with migrations

## Next Steps

In **Tutorial 04: Replication**, you will:
- Set up master-slave replication
- Configure read replicas
- Implement failover strategies
- Monitor replication lag
- Learn replication best practices

## Additional Resources

- [MySQL Data Types](https://dev.mysql.com/doc/refman/8.0/en/data-types.html)
- [MySQL Indexes](https://dev.mysql.com/doc/refman/8.0/en/optimization-indexes.html)
- [Database Normalization](https://en.wikipedia.org/wiki/Database_normalization)
- [Schema Design Best Practices](https://www.percona.com/blog/2021/09/16/mysql-database-schema-design/)

---

**Congratulations!** You now understand how to design efficient, normalized MySQL schemas with proper relationships, indexes, and constraints.
