-- Initialize database schema for Tutorial 02
-- This script runs automatically when container first starts

\c learning;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50),
    salary NUMERIC(10, 2) CHECK (salary >= 0),
    hire_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    manager_id INTEGER,
    budget NUMERIC(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'planning',
    budget NUMERIC(12, 2),
    department_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO departments (name, description, budget) VALUES
    ('Engineering', 'Software development and infrastructure', 500000.00),
    ('Marketing', 'Marketing and brand management', 300000.00),
    ('Sales', 'Sales and business development', 250000.00),
    ('HR', 'Human resources and recruitment', 150000.00),
    ('Operations', 'Business operations and support', 200000.00)
ON CONFLICT (name) DO NOTHING;

INSERT INTO employees (first_name, last_name, email, department, salary, hire_date) VALUES
    ('John', 'Doe', 'john.doe@company.com', 'Engineering', 85000.00, '2020-01-15'),
    ('Jane', 'Smith', 'jane.smith@company.com', 'Marketing', 72000.00, '2019-03-22'),
    ('Bob', 'Johnson', 'bob.johnson@company.com', 'Engineering', 95000.00, '2018-07-10'),
    ('Alice', 'Williams', 'alice.williams@company.com', 'Sales', 68000.00, '2021-05-18'),
    ('Charlie', 'Brown', 'charlie.brown@company.com', 'HR', 65000.00, '2020-11-03'),
    ('Diana', 'Davis', 'diana.davis@company.com', 'Engineering', 78000.00, '2021-02-14'),
    ('Eve', 'Miller', 'eve.miller@company.com', 'Marketing', 70000.00, '2020-08-25'),
    ('Frank', 'Wilson', 'frank.wilson@company.com', 'Operations', 72000.00, '2019-12-01'),
    ('Grace', 'Moore', 'grace.moore@company.com', 'Sales', 75000.00, '2021-01-20'),
    ('Henry', 'Taylor', 'henry.taylor@company.com', 'Engineering', 92000.00, '2018-04-15')
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (name, description, start_date, end_date, status, budget, department_id) VALUES
    ('Website Redesign', 'Complete redesign of company website', '2023-01-01', '2023-06-30', 'completed', 150000.00, 1),
    ('Mobile App Development', 'Native mobile app for iOS and Android', '2023-03-15', '2023-12-31', 'in_progress', 300000.00, 1),
    ('Marketing Campaign Q4', 'Q4 marketing campaign for new product launch', '2023-10-01', '2023-12-31', 'planning', 100000.00, 2),
    ('CRM Implementation', 'Implement new CRM system', '2023-05-01', '2023-11-30', 'in_progress', 200000.00, 5),
    ('Sales Training Program', 'Comprehensive sales training for all sales staff', '2023-09-01', '2023-10-31', 'planning', 50000.00, 3)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_department_id ON projects(department_id);

-- Create a view for department statistics
CREATE OR REPLACE VIEW department_stats AS
SELECT
    d.name AS department,
    COUNT(e.id) AS employee_count,
    COALESCE(AVG(e.salary), 0)::NUMERIC(10,2) AS avg_salary,
    COALESCE(SUM(e.salary), 0)::NUMERIC(12,2) AS total_salary,
    d.budget,
    (d.budget - COALESCE(SUM(e.salary), 0))::NUMERIC(12,2) AS remaining_budget
FROM departments d
LEFT JOIN employees e ON d.name = e.department
GROUP BY d.id, d.name, d.budget;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Log completion
SELECT 'Schema initialization complete!' AS status;
SELECT 'Created ' || COUNT(*) || ' employees' AS info FROM employees;
SELECT 'Created ' || COUNT(*) || ' departments' AS info FROM departments;
SELECT 'Created ' || COUNT(*) || ' projects' AS info FROM projects;
