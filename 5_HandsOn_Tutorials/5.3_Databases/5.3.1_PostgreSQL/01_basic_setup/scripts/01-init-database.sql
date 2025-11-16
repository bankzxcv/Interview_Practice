-- Initial database setup script
-- This runs automatically when the container first starts

-- Create the learning database (if not exists via env var)
-- Already created by POSTGRES_DB environment variable

-- Connect to learning database
\c learning;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    age INTEGER CHECK (age >= 0 AND age <= 150),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) CHECK (price >= 0),
    quantity INTEGER DEFAULT 0,
    in_stock BOOLEAN DEFAULT true,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample users
INSERT INTO users (username, email, full_name, age) VALUES
    ('john_doe', 'john@example.com', 'John Doe', 30),
    ('jane_smith', 'jane@example.com', 'Jane Smith', 28),
    ('bob_jones', 'bob@example.com', 'Bob Jones', 35),
    ('alice_wong', 'alice@example.com', 'Alice Wong', 25)
ON CONFLICT (username) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, quantity, tags, metadata) VALUES
    (
        'Laptop',
        'High-performance laptop for developers',
        1299.99,
        50,
        ARRAY['electronics', 'computers', 'programming'],
        '{"brand": "TechCorp", "warranty_years": 2, "specs": {"ram": "16GB", "storage": "512GB SSD"}}'::jsonb
    ),
    (
        'Wireless Mouse',
        'Ergonomic wireless mouse',
        29.99,
        200,
        ARRAY['electronics', 'accessories'],
        '{"brand": "Logitech", "warranty_years": 1, "color": "black"}'::jsonb
    ),
    (
        'USB-C Cable',
        'High-speed USB-C charging cable',
        14.99,
        500,
        ARRAY['electronics', 'cables', 'accessories'],
        '{"brand": "Anker", "length_meters": 2, "warranty_years": 1}'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Grant permissions (good practice)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Display confirmation
SELECT 'Database initialization complete!' AS status;
SELECT 'Users table has ' || COUNT(*) || ' records' AS users_count FROM users;
SELECT 'Products table has ' || COUNT(*) || ' records' AS products_count FROM products;
