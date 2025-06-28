-- Billow Database Setup Script
-- This script will create all necessary tables and insert initial data

-- Connect to the database (you'll need to run this manually)
-- psql -h localhost -U postgres -d billow -f setup_database.sql

-- Drop existing tables if they exist (BE CAREFUL - this will delete all data)
DROP TABLE IF EXISTS analytics_data CASCADE;
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id VARCHAR(30) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    profile_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create plans table
CREATE TABLE plans (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    interval VARCHAR(10) NOT NULL, -- 'month' or 'year'
    invoice_limit INTEGER NOT NULL, -- -1 for unlimited
    client_limit INTEGER NOT NULL, -- -1 for unlimited
    messages_per_day INTEGER NOT NULL, -- -1 for unlimited
    image_generation BOOLEAN DEFAULT FALSE,
    custom_voice BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    advanced_analytics BOOLEAN DEFAULT FALSE,
    api_access BOOLEAN DEFAULT FALSE,
    white_label BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscriptions table
CREATE TABLE subscriptions (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(30) NOT NULL REFERENCES plans(id),
    status VARCHAR(20) NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
    current_period_end TIMESTAMP NOT NULL,
    trial_end TIMESTAMP,
    canceled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_preferences table
CREATE TABLE user_preferences (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(10) DEFAULT 'light', -- 'light', 'dark', 'auto'
    language VARCHAR(5) DEFAULT 'en',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    weekly_reports BOOLEAN DEFAULT TRUE,
    security_alerts BOOLEAN DEFAULT TRUE,
    currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create usage_logs table
CREATE TABLE usage_logs (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL, -- 'invoice_created', 'client_created', 'message_sent', 'image_generated'
    count INTEGER DEFAULT 1,
    metadata TEXT, -- JSON string for additional data
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analytics_data table
CREATE TABLE analytics_data (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    invoices_created INTEGER DEFAULT 0,
    clients_added INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    messages_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create clients table (if not exists)
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table (if not exists)
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id VARCHAR(30) REFERENCES clients(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'canceled'
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_timestamp ON usage_logs(timestamp);
CREATE INDEX idx_analytics_data_user_id ON analytics_data(user_id);
CREATE INDEX idx_analytics_data_date ON analytics_data(date);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);

-- Insert default plans
INSERT INTO plans (id, name, price, currency, interval, invoice_limit, client_limit, messages_per_day, image_generation, custom_voice, priority_support, advanced_analytics, api_access, white_label) VALUES
('PLN-STARTER', 'Starter', 10.00, 'USD', 'month', 50, 10, 100, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
('PLN-PRO', 'Pro', 29.00, 'USD', 'month', -1, -1, 1000, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE),
('PLN-BUSINESS', 'Business', 99.00, 'USD', 'month', -1, -1, -1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE);

-- Insert a sample user (you can modify this or create your own)
INSERT INTO users (id, email, display_name, profile_image) VALUES
('USR-20241215-143052-123456', 'john.doe@example.com', 'John Doe', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face');

-- Insert a subscription for the sample user
INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_end) VALUES
('SUB-20241215-143052-123456', 'USR-20241215-143052-123456', 'PLN-PRO', 'active', CURRENT_TIMESTAMP + INTERVAL '1 month');

-- Insert default preferences for the sample user
INSERT INTO user_preferences (id, user_id, theme, language, email_notifications, push_notifications, marketing_emails, weekly_reports, security_alerts, currency, timezone) VALUES
('PRF-20241215-143052-123456', 'USR-20241215-143052-123456', 'light', 'en', TRUE, TRUE, FALSE, TRUE, TRUE, 'USD', 'UTC');

-- Insert some sample usage logs
INSERT INTO usage_logs (id, user_id, feature_type, count, metadata) VALUES
('ULG-20241215-143052-001', 'USR-20241215-143052-123456', 'message_sent', 50, '{"feature": "chat"}'),
('ULG-20241215-143052-002', 'USR-20241215-143052-123456', 'image_generated', 5, '{"feature": "ai_image"}');

-- Insert some sample analytics data for the last 7 days
INSERT INTO analytics_data (id, user_id, date, invoices_created, clients_added, revenue_generated, messages_count) VALUES
('ANL-20241215-143052-001', 'USR-20241215-143052-123456', CURRENT_DATE - INTERVAL '6 days', 2, 1, 1500.00, 25),
('ANL-20241215-143052-002', 'USR-20241215-143052-123456', CURRENT_DATE - INTERVAL '5 days', 1, 0, 750.00, 30),
('ANL-20241215-143052-003', 'USR-20241215-143052-123456', CURRENT_DATE - INTERVAL '4 days', 3, 2, 2200.00, 45),
('ANL-20241215-143052-004', 'USR-20241215-143052-123456', CURRENT_DATE - INTERVAL '3 days', 0, 1, 0.00, 15),
('ANL-20241215-143052-005', 'USR-20241215-143052-123456', CURRENT_DATE - INTERVAL '2 days', 4, 0, 3200.00, 60),
('ANL-20241215-143052-006', 'USR-20241215-143052-123456', CURRENT_DATE - INTERVAL '1 day', 2, 1, 1800.00, 35),
('ANL-20241215-143052-007', 'USR-20241215-143052-123456', CURRENT_DATE, 1, 0, 950.00, 20);

-- Insert some sample clients
INSERT INTO clients (id, user_id, name, email, phone, address) VALUES
('CLI-20241215-143052-001', 'USR-20241215-143052-123456', 'Acme Corporation', 'contact@acme.com', '+1-555-0123', '123 Business St, City, State 12345'),
('CLI-20241215-143052-002', 'USR-20241215-143052-123456', 'TechStart Inc', 'hello@techstart.com', '+1-555-0456', '456 Innovation Ave, Tech City, TC 67890'),
('CLI-20241215-143052-003', 'USR-20241215-143052-123456', 'Global Solutions', 'info@globalsolutions.com', '+1-555-0789', '789 Enterprise Blvd, Metro, MT 11111');

-- Insert some sample invoices
INSERT INTO invoices (id, user_id, client_id, invoice_number, status, issue_date, due_date, subtotal, tax_amount, total_amount, notes) VALUES
('INV-20241215-143052-001', 'USR-20241215-143052-123456', 'CLI-20241215-143052-001', 'INV-001', 'paid', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '3 days', 1500.00, 150.00, 1650.00, 'Web development services'),
('INV-20241215-143052-002', 'USR-20241215-143052-123456', 'CLI-20241215-143052-002', 'INV-002', 'sent', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', 750.00, 75.00, 825.00, 'Consulting services'),
('INV-20241215-143052-003', 'USR-20241215-143052-123456', 'CLI-20241215-143052-003', 'INV-003', 'draft', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 2200.00, 220.00, 2420.00, 'Project management services');

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;

-- Show summary of created data
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Plans', COUNT(*) FROM plans
UNION ALL
SELECT 'Subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'User Preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'Usage Logs', COUNT(*) FROM usage_logs
UNION ALL
SELECT 'Analytics Data', COUNT(*) FROM analytics_data
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices; 