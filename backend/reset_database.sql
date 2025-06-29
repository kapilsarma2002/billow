-- Reset Database Script for Billow
-- This script will drop all tables and recreate them with fresh mock data

-- Drop all tables in the correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS analytics_data CASCADE;
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create tables in the correct order

-- Users table
CREATE TABLE users (
    id VARCHAR(30) PRIMARY KEY,
    clerk_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    profile_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plans table
CREATE TABLE plans (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    interval VARCHAR(20) NOT NULL,
    invoice_limit INTEGER NOT NULL,
    client_limit INTEGER NOT NULL,
    messages_per_day INTEGER NOT NULL,
    image_generation BOOLEAN DEFAULT FALSE,
    custom_voice BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    advanced_analytics BOOLEAN DEFAULT FALSE,
    api_access BOOLEAN DEFAULT FALSE,
    white_label BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL,
    plan_id VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    trial_end TIMESTAMP,
    canceled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

-- User Preferences table
CREATE TABLE user_preferences (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) UNIQUE NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    weekly_reports BOOLEAN DEFAULT TRUE,
    security_alerts BOOLEAN DEFAULT TRUE,
    currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Clients table
CREATE TABLE clients (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invoices table
CREATE TABLE invoices (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL,
    client_id VARCHAR(30) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft',
    due_date DATE,
    issued_date DATE,
    paid_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Usage Logs table
CREATE TABLE usage_logs (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL,
    feature_type VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 1,
    metadata TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Analytics Data table
CREATE TABLE analytics_data (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL,
    date DATE NOT NULL,
    invoices_created INTEGER DEFAULT 0,
    clients_added INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    messages_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default plans
INSERT INTO plans (id, name, price, currency, interval, invoice_limit, client_limit, messages_per_day, image_generation, custom_voice, priority_support, advanced_analytics, api_access, white_label) VALUES
('PLN-STARTER', 'Starter', 10.00, 'USD', 'month', 50, 10, 100, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
('PLN-PRO', 'Pro', 29.00, 'USD', 'month', -1, -1, 500, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE),
('PLN-BUSINESS', 'Business', 99.00, 'USD', 'month', -1, -1, -1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE);

-- Insert mock users
INSERT INTO users (id, clerk_id, email, display_name, profile_image) VALUES
('USR-20241215-143052-1', 'user_2abc123def456', 'john.doe@example.com', 'John Doe', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
('USR-20241215-143052-2', 'user_2def456ghi789', 'jane.smith@example.com', 'Jane Smith', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'),
('USR-20241215-143052-3', 'user_2ghi789jkl012', 'mike.wilson@example.com', 'Mike Wilson', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face');

-- Insert user preferences
INSERT INTO user_preferences (id, user_id, theme, language, email_notifications, push_notifications, marketing_emails, weekly_reports, security_alerts, currency, timezone) VALUES
('PRF-20241215-143052-1', 'USR-20241215-143052-1', 'light', 'en', TRUE, TRUE, FALSE, TRUE, TRUE, 'USD', 'America/New_York'),
('PRF-20241215-143052-2', 'USR-20241215-143052-2', 'dark', 'en', TRUE, FALSE, TRUE, TRUE, TRUE, 'USD', 'America/Los_Angeles'),
('PRF-20241215-143052-3', 'USR-20241215-143052-3', 'auto', 'en', FALSE, TRUE, FALSE, FALSE, TRUE, 'USD', 'Europe/London');

-- Insert subscriptions
INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_end, trial_end) VALUES
('SUB-20241215-143052-1', 'USR-20241215-143052-1', 'PLN-PRO', 'active', '2024-02-15 14:30:52', '2024-01-15 14:30:52'),
('SUB-20241215-143052-2', 'USR-20241215-143052-2', 'PLN-STARTER', 'trialing', '2024-01-29 14:30:52', '2024-01-29 14:30:52'),
('SUB-20241215-143052-3', 'USR-20241215-143052-3', 'PLN-BUSINESS', 'active', '2024-02-15 14:30:52', NULL);

-- Insert mock clients
INSERT INTO clients (id, user_id, name, email, phone, company, address) VALUES
('CLI-20241215-143052-1', 'USR-20241215-143052-1', 'Acme Corporation', 'contact@acme.com', '+1-555-0123', 'Acme Corp', '123 Business St, New York, NY 10001'),
('CLI-20241215-143052-2', 'USR-20241215-143052-1', 'TechStart Inc', 'hello@techstart.com', '+1-555-0456', 'TechStart Inc', '456 Innovation Ave, San Francisco, CA 94102'),
('CLI-20241215-143052-3', 'USR-20241215-143052-2', 'Global Solutions', 'info@globalsolutions.com', '+1-555-0789', 'Global Solutions Ltd', '789 Corporate Blvd, Los Angeles, CA 90210'),
('CLI-20241215-143052-4', 'USR-20241215-143052-2', 'Creative Agency', 'hello@creativeagency.com', '+1-555-0321', 'Creative Agency', '321 Design St, Austin, TX 73301'),
('CLI-20241215-143052-5', 'USR-20241215-143052-3', 'Enterprise Corp', 'contact@enterprise.com', '+1-555-0654', 'Enterprise Corporation', '654 Enterprise Way, Chicago, IL 60601');

-- Insert mock invoices
INSERT INTO invoices (id, user_id, client_id, invoice_number, amount, currency, status, due_date, issued_date, paid_date, notes) VALUES
('INV-20241215-143052-1', 'USR-20241215-143052-1', 'CLI-20241215-143052-1', 'INV-001', 2500.00, 'USD', 'paid', '2024-01-15', '2024-01-01', '2024-01-10', 'Website development project'),
('INV-20241215-143052-2', 'USR-20241215-143052-1', 'CLI-20241215-143052-2', 'INV-002', 1800.00, 'USD', 'paid', '2024-01-20', '2024-01-05', '2024-01-18', 'Mobile app consultation'),
('INV-20241215-143052-3', 'USR-20241215-143052-1', 'CLI-20241215-143052-1', 'INV-003', 3200.00, 'USD', 'pending', '2024-02-01', '2024-01-15', NULL, 'E-commerce platform development'),
('INV-20241215-143052-4', 'USR-20241215-143052-2', 'CLI-20241215-143052-3', 'INV-004', 1500.00, 'USD', 'paid', '2024-01-25', '2024-01-10', '2024-01-22', 'Brand identity design'),
('INV-20241215-143052-5', 'USR-20241215-143052-2', 'CLI-20241215-143052-4', 'INV-005', 2200.00, 'USD', 'draft', '2024-02-10', '2024-01-20', NULL, 'Marketing campaign design'),
('INV-20241215-143052-6', 'USR-20241215-143052-3', 'CLI-20241215-143052-5', 'INV-006', 5000.00, 'USD', 'paid', '2024-01-30', '2024-01-15', '2024-01-28', 'Enterprise software development'),
('INV-20241215-143052-7', 'USR-20241215-143052-3', 'CLI-20241215-143052-5', 'INV-007', 3500.00, 'USD', 'pending', '2024-02-15', '2024-01-25', NULL, 'System integration project');

-- Insert mock usage logs
INSERT INTO usage_logs (id, user_id, feature_type, count, metadata, timestamp) VALUES
('ULG-20241215-143052-1', 'USR-20241215-143052-1', 'invoice_created', 1, '{"invoice_id":"INV-20241215-143052-1"}', '2024-01-01 10:00:00'),
('ULG-20241215-143052-2', 'USR-20241215-143052-1', 'client_created', 1, '{"client_id":"CLI-20241215-143052-1"}', '2024-01-01 09:00:00'),
('ULG-20241215-143052-3', 'USR-20241215-143052-1', 'message_sent', 1, '{"recipient":"client"}', '2024-01-02 14:30:00'),
('ULG-20241215-143052-4', 'USR-20241215-143052-2', 'invoice_created', 1, '{"invoice_id":"INV-20241215-143052-4"}', '2024-01-10 11:15:00'),
('ULG-20241215-143052-5', 'USR-20241215-143052-2', 'client_created', 1, '{"client_id":"CLI-20241215-143052-3"}', '2024-01-10 10:00:00'),
('ULG-20241215-143052-6', 'USR-20241215-143052-3', 'invoice_created', 1, '{"invoice_id":"INV-20241215-143052-6"}', '2024-01-15 16:45:00'),
('ULG-20241215-143052-7', 'USR-20241215-143052-3', 'image_generated', 1, '{"style":"professional"}', '2024-01-16 13:20:00');

-- Insert mock analytics data
INSERT INTO analytics_data (id, user_id, date, invoices_created, clients_added, revenue_generated, messages_count) VALUES
('ANL-20241215-143052-1', 'USR-20241215-143052-1', '2024-01-01', 1, 1, 2500.00, 2),
('ANL-20241215-143052-2', 'USR-20241215-143052-1', '2024-01-02', 0, 0, 0.00, 1),
('ANL-20241215-143052-3', 'USR-20241215-143052-1', '2024-01-03', 0, 0, 0.00, 0),
('ANL-20241215-143052-4', 'USR-20241215-143052-2', '2024-01-10', 1, 1, 1500.00, 1),
('ANL-20241215-143052-5', 'USR-20241215-143052-2', '2024-01-11', 0, 0, 0.00, 0),
('ANL-20241215-143052-6', 'USR-20241215-143052-3', '2024-01-15', 1, 0, 5000.00, 0),
('ANL-20241215-143052-7', 'USR-20241215-143052-3', '2024-01-16', 0, 0, 0.00, 0);

-- Create indexes for better performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_timestamp ON usage_logs(timestamp);
CREATE INDEX idx_analytics_data_user_id ON analytics_data(user_id);
CREATE INDEX idx_analytics_data_date ON analytics_data(date);

-- Display summary
SELECT 'Database reset completed successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_clients FROM clients;
SELECT COUNT(*) as total_invoices FROM invoices;
SELECT COUNT(*) as total_plans FROM plans; 