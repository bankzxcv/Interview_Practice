-- Initialize the learning database with sample data

USE learning;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    age INT CHECK (age >= 0 AND age <= 150),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
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

-- Insert sample users
INSERT INTO users (username, email, full_name, age) VALUES
    ('admin', 'admin@example.com', 'System Administrator', 35),
    ('demo_user', 'demo@example.com', 'Demo User', 28);

-- Insert sample products
INSERT INTO products (name, description, price, quantity, tags, metadata) VALUES
    (
        'Sample Laptop',
        'Demo laptop for testing',
        999.99,
        10,
        JSON_ARRAY('electronics', 'demo'),
        JSON_OBJECT('brand', 'DemoBrand', 'warranty_years', 1)
    );

-- Log initialization
SELECT 'Database initialized successfully!' AS status;
