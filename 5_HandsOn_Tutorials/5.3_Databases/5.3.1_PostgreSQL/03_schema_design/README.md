# Tutorial 03: Schema Design - Tables, Relationships, Constraints & Indexes

## Objectives

By the end of this tutorial, you will:
- Understand database normalization (1NF, 2NF, 3NF, BCNF)
- Design complex relational database schemas
- Create and manage foreign key relationships
- Implement various types of constraints
- Design and create effective indexes
- Understand different relationship types (1:1, 1:N, N:M)
- Learn best practices for schema design
- Build a complete e-commerce database from scratch

## Prerequisites

- Completed Tutorials 01 and 02
- Understanding of basic SQL
- Docker and Docker Compose running
- pgAdmin access (from Tutorial 02)
- 45-60 minutes of time

## Database Design Fundamentals

### The Three Schema Approach

1. **Conceptual Schema**: High-level business requirements
2. **Logical Schema**: Tables, relationships, constraints
3. **Physical Schema**: Implementation with indexes, partitioning

### Normalization

**Purpose**: Eliminate data redundancy and ensure data integrity

#### First Normal Form (1NF)
- Atomic values (no arrays or composite values in single column)
- Each row is unique
- No repeating groups

#### Second Normal Form (2NF)
- Must be in 1NF
- No partial dependencies (all non-key columns depend on entire primary key)

#### Third Normal Form (3NF)
- Must be in 2NF
- No transitive dependencies (non-key columns don't depend on other non-key columns)

#### Boyce-Codd Normal Form (BCNF)
- Must be in 3NF
- Every determinant is a candidate key

### Relationship Types

```
One-to-One (1:1):     User ←→ UserProfile
One-to-Many (1:N):    Customer ←→ Orders
Many-to-Many (N:M):   Students ←→ Courses (via enrollment table)
```

## Real-World Project: E-Commerce Platform

We'll build a complete e-commerce database schema with:
- Users and authentication
- Products and categories
- Shopping cart
- Orders and order items
- Inventory management
- Reviews and ratings
- Payment processing
- Shipping information

### Entity-Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────┐      ┌──────────────┐
│   addresses │      │ user_profiles│
└─────────────┘      └──────────────┘

┌─────────────┐
│    users    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────┐
│   orders    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────────┐
│  order_items    │
└──────┬──────────┘
       │ N
       │
       │ 1
┌──────┴──────┐
│  products   │
└──────┬──────┘
       │ N
       │
       │ 1
┌──────┴──────────┐
│   categories    │
└─────────────────┘
```

## Step-by-Step Instructions

### Step 1: Start the Environment

```bash
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.1_PostgreSQL/03_schema_design

# Start PostgreSQL
docker-compose up -d

# Verify it's running
docker-compose ps
```

### Step 2: Core Tables - Users and Authentication

```sql
-- Users table (core entity)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- Never store plain passwords!
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT username_length CHECK (length(username) >= 3),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- User profiles (1:1 relationship with users)
CREATE TABLE user_profiles (
    user_id BIGINT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone_number VARCHAR(20),
    date_of_birth DATE,
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key relationship
    CONSTRAINT fk_user_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Constraints
    CONSTRAINT age_check CHECK (date_of_birth < CURRENT_DATE - INTERVAL '13 years')
);

-- Addresses (1:N relationship with users)
CREATE TABLE addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    address_type VARCHAR(20) DEFAULT 'shipping',  -- 'shipping' or 'billing'
    is_default BOOLEAN DEFAULT false,
    street_address VARCHAR(255) NOT NULL,
    apartment VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT fk_addresses_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT address_type_check CHECK (address_type IN ('shipping', 'billing'))
);
```

### Step 3: Product Catalog

```sql
-- Categories (hierarchical structure)
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id BIGINT,  -- For nested categories
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Self-referential foreign key for hierarchy
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
);

-- Products
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    sku VARCHAR(50) UNIQUE NOT NULL,  -- Stock Keeping Unit
    price NUMERIC(10, 2) NOT NULL,
    compare_at_price NUMERIC(10, 2),  -- Original price for discounts
    cost_price NUMERIC(10, 2),  -- Cost from supplier
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,  -- Don't allow deleting category with products

    -- Constraints
    CONSTRAINT price_positive CHECK (price >= 0),
    CONSTRAINT compare_price_check CHECK (compare_at_price IS NULL OR compare_at_price >= price),
    CONSTRAINT cost_price_positive CHECK (cost_price IS NULL OR cost_price >= 0)
);

-- Product images (1:N relationship)
CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);

-- Product variants (e.g., size, color)
CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,  -- e.g., "Large / Red"
    price NUMERIC(10, 2),  -- Override product price if set
    attributes JSONB,  -- Store variant attributes flexibly
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT fk_product_variants_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);

-- Inventory management
CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT,
    variant_id BIGINT,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,  -- In carts but not ordered
    warehouse_location VARCHAR(100),
    reorder_level INTEGER DEFAULT 10,  -- When to reorder
    reorder_quantity INTEGER DEFAULT 50,  -- How many to reorder
    last_restocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Either product_id or variant_id must be set, not both
    CONSTRAINT inventory_product_xor_variant
        CHECK ((product_id IS NOT NULL AND variant_id IS NULL) OR
               (product_id IS NULL AND variant_id IS NOT NULL)),

    -- Foreign keys
    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_variant
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT quantity_non_negative CHECK (quantity >= 0),
    CONSTRAINT reserved_non_negative CHECK (reserved_quantity >= 0),
    CONSTRAINT reserved_not_exceeds_quantity CHECK (reserved_quantity <= quantity)
);
```

### Step 4: Shopping Cart

```sql
-- Shopping carts
CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,  -- NULL for guest users
    session_id VARCHAR(100),  -- For guest users
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days',

    -- Foreign key
    CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Either user_id or session_id must be set
    CONSTRAINT cart_user_or_session
        CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Cart items
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT,
    variant_id BIGINT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL,  -- Snapshot of price when added
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id)
        REFERENCES carts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cart_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cart_items_variant
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT quantity_positive CHECK (quantity > 0),
    CONSTRAINT cart_item_product_or_variant
        CHECK ((product_id IS NOT NULL AND variant_id IS NULL) OR
               (product_id IS NULL AND variant_id IS NOT NULL)),

    -- Unique constraint: one product/variant per cart
    CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id),
    CONSTRAINT unique_cart_variant UNIQUE (cart_id, variant_id)
);
```

### Step 5: Orders and Payments

```sql
-- Orders
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,  -- Human-readable order number
    status VARCHAR(20) DEFAULT 'pending',

    -- Pricing
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    shipping_amount NUMERIC(10, 2) DEFAULT 0,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,

    -- Shipping address (denormalized for historical record)
    shipping_name VARCHAR(100),
    shipping_street VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100),

    -- Billing address
    billing_name VARCHAR(100),
    billing_street VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),

    -- Tracking
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,  -- Don't delete users with orders

    -- Constraints
    CONSTRAINT order_status_check
        CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    CONSTRAINT amounts_non_negative
        CHECK (subtotal >= 0 AND tax_amount >= 0 AND shipping_amount >= 0 AND discount_amount >= 0),
    CONSTRAINT total_calculation
        CHECK (total = subtotal + tax_amount + shipping_amount - discount_amount)
);

-- Order items (snapshot of products at time of order)
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT,  -- May be null if product deleted
    variant_id BIGINT,

    -- Snapshot data (preserve even if product changes/deleted)
    product_name VARCHAR(200) NOT NULL,
    product_sku VARCHAR(50) NOT NULL,
    variant_name VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE SET NULL,  -- Keep order history even if product deleted

    CONSTRAINT fk_order_items_variant
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT quantity_positive CHECK (quantity > 0),
    CONSTRAINT prices_positive CHECK (unit_price >= 0 AND total_price >= 0),
    CONSTRAINT total_price_calc CHECK (total_price = unit_price * quantity)
);

-- Payments
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,  -- 'credit_card', 'paypal', 'stripe', etc.
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    transaction_id VARCHAR(255),  -- From payment gateway
    payment_gateway_response JSONB,  -- Store full response
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT,

    -- Constraints
    CONSTRAINT payment_status_check
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    CONSTRAINT amount_positive CHECK (amount > 0)
);
```

### Step 6: Reviews and Ratings

```sql
-- Product reviews
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    order_id BIGINT,  -- Optional: verify purchase
    rating INTEGER NOT NULL,
    title VARCHAR(200),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_reviews_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reviews_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT one_review_per_product UNIQUE (product_id, user_id)
);

-- Review images
CREATE TABLE review_images (
    id BIGSERIAL PRIMARY KEY,
    review_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_images_review
        FOREIGN KEY (review_id)
        REFERENCES reviews(id)
        ON DELETE CASCADE
);
```

### Step 7: Create Indexes for Performance

```sql
-- Users and authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Addresses
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default) WHERE is_default = true;

-- Categories
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Products
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_price ON products(price);

-- Product images
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id) WHERE is_primary = true;

-- Inventory
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_variant_id ON inventory(variant_id);
CREATE INDEX idx_inventory_low_stock ON inventory(quantity) WHERE quantity <= reorder_level;

-- Carts
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_carts_expires_at ON carts(expires_at);

-- Cart items
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Order items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Payments
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- Reviews
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_approved ON reviews(is_approved) WHERE is_approved = true;
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_reviews_product_approved ON reviews(product_id, is_approved) WHERE is_approved = true;
```

### Step 8: Create Useful Views

```sql
-- Product catalog view with category info
CREATE OR REPLACE VIEW product_catalog AS
SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.compare_at_price,
    CASE
        WHEN p.compare_at_price IS NOT NULL AND p.compare_at_price > p.price
        THEN ROUND((1 - p.price / p.compare_at_price) * 100)
        ELSE 0
    END AS discount_percentage,
    p.is_featured,
    c.name AS category_name,
    c.slug AS category_slug,
    COALESCE(i.quantity - i.reserved_quantity, 0) AS available_quantity,
    COALESCE(AVG(r.rating), 0) AS avg_rating,
    COUNT(DISTINCT r.id) AS review_count,
    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS primary_image
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory i ON i.product_id = p.id
LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
WHERE p.is_active = true
GROUP BY p.id, c.id, i.quantity, i.reserved_quantity;

-- Order summary view
CREATE OR REPLACE VIEW order_summary AS
SELECT
    o.id AS order_id,
    o.order_number,
    o.user_id,
    u.email AS user_email,
    u.username,
    o.status,
    o.total,
    o.created_at,
    o.shipped_at,
    o.delivered_at,
    COUNT(oi.id) AS item_count,
    SUM(oi.quantity) AS total_quantity,
    p.status AS payment_status
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN payments p ON p.order_id = o.id
GROUP BY o.id, u.id, p.status;

-- User purchase history
CREATE OR REPLACE VIEW user_purchase_stats AS
SELECT
    u.id AS user_id,
    u.username,
    u.email,
    COUNT(DISTINCT o.id) AS total_orders,
    COALESCE(SUM(o.total), 0) AS lifetime_value,
    COALESCE(AVG(o.total), 0) AS avg_order_value,
    MAX(o.created_at) AS last_order_date,
    MIN(o.created_at) AS first_order_date
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id;

-- Category performance
CREATE OR REPLACE VIEW category_performance AS
SELECT
    c.id AS category_id,
    c.name AS category_name,
    COUNT(DISTINCT p.id) AS product_count,
    COUNT(DISTINCT oi.order_id) AS orders_count,
    COALESCE(SUM(oi.quantity), 0) AS units_sold,
    COALESCE(SUM(oi.total_price), 0) AS total_revenue,
    COALESCE(AVG(r.rating), 0) AS avg_rating
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
GROUP BY c.id;
```

### Step 9: Create Triggers and Functions

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Function to update inventory when order is placed
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.product_id IS NOT NULL THEN
        UPDATE inventory
        SET quantity = quantity - NEW.quantity
        WHERE product_id = NEW.product_id;
    ELSIF NEW.variant_id IS NOT NULL THEN
        UPDATE inventory
        SET quantity = quantity - NEW.variant_id
        WHERE variant_id = NEW.variant_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_inventory AFTER INSERT ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_inventory_on_order();

-- Function to ensure only one primary image per product
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE product_images
        SET is_primary = false
        WHERE product_id = NEW.product_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_primary_image BEFORE INSERT OR UPDATE ON product_images
    FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_image();
```

## Verification Steps

### 1. Verify All Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected: 16+ tables

### 2. Verify Foreign Keys

```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

### 3. Verify Indexes

```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 4. Test Data Integrity

```sql
-- Try to insert invalid data (should fail)
INSERT INTO users (username, email, password_hash)
VALUES ('ab', 'invalid-email', 'hash123');  -- Should fail: username too short

-- Try to delete category with products (should fail)
INSERT INTO categories (name, slug) VALUES ('Test', 'test');
INSERT INTO products (category_id, name, slug, sku, price)
VALUES (1, 'Test Product', 'test-product', 'TEST-001', 99.99);

DELETE FROM categories WHERE id = 1;  -- Should fail: RESTRICT constraint
```

## Best Practices

### 1. Use Appropriate Data Types

```sql
-- GOOD
price NUMERIC(10, 2)  -- Exact decimal for money
created_at TIMESTAMP WITH TIME ZONE  -- Include timezone

-- BAD
price FLOAT  -- Precision issues with money
created_at VARCHAR(50)  -- Dates as strings
```

### 2. Name Constraints Explicitly

```sql
-- GOOD
CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)

-- BAD (auto-generated name)
FOREIGN KEY (user_id) REFERENCES users(id)
```

### 3. Choose CASCADE Carefully

```sql
-- Safe: Delete user profile when user deleted
ON DELETE CASCADE

-- Risky: Don't delete users who have orders
ON DELETE RESTRICT

-- Moderate: Keep order history but null the reference
ON DELETE SET NULL
```

### 4. Index Foreign Keys

Always index foreign key columns for join performance.

### 5. Denormalize When Necessary

Order items store product name/price snapshot (denormalized) to preserve historical accuracy.

## Performance Considerations

### 1. Composite Indexes

```sql
-- For query: WHERE category_id = X AND is_active = true
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
```

### 2. Partial Indexes

```sql
-- Only index active products
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
```

### 3. Use EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT * FROM product_catalog
WHERE category_name = 'Electronics'
ORDER BY avg_rating DESC
LIMIT 10;
```

## Next Steps

In **Tutorial 04: Replication**, you will:
- Set up master-slave replication
- Configure streaming replication
- Implement read replicas for scaling
- Test failover scenarios
- Monitor replication lag

## Additional Resources

- [PostgreSQL Data Types](https://www.postgresql.org/docs/15/datatype.html)
- [Database Normalization](https://en.wikipedia.org/wiki/Database_normalization)
- [PostgreSQL Constraints](https://www.postgresql.org/docs/15/ddl-constraints.html)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/15/indexes.html)

---

**Congratulations!** You've designed a production-ready e-commerce database schema with proper relationships, constraints, and indexes.
