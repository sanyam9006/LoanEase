-- LoanEase Database Schema Dump
-- Generated from SQLAlchemy models
-- Database: SQLite (compatible with PostgreSQL/MySQL with minor type changes)

-- Users table (admin accounts)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    is_admin BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- BRE Rules table (business rules for eligibility)
CREATE TABLE IF NOT EXISTS bre_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name VARCHAR(100) NOT NULL,
    field VARCHAR(50) NOT NULL,
    operator VARCHAR(10) NOT NULL,
    value FLOAT NOT NULL,
    value_type VARCHAR(20) DEFAULT 'numeric',
    reference_field VARCHAR(50),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leads table (loan applications)
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    dob VARCHAR(10) NOT NULL,
    city VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    loan_type VARCHAR(30) NOT NULL,
    employment_type VARCHAR(30) NOT NULL,
    monthly_income FLOAT NOT NULL,
    loan_amount FLOAT NOT NULL,
    property_value FLOAT NOT NULL,
    credit_score INTEGER,
    credit_score_status VARCHAR(20) DEFAULT 'pending',
    bre_status VARCHAR(20) DEFAULT 'pending',
    rejection_reasons JSON,
    consent BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);
CREATE INDEX IF NOT EXISTS ix_leads_mobile ON leads(mobile);
CREATE INDEX IF NOT EXISTS ix_bre_rules_id ON bre_rules(id);

-- Default admin user (password: admin123)
-- bcrypt hash will differ on each generation, use the seed script instead
-- INSERT INTO users (username, email, hashed_password, full_name, is_active, is_admin)
-- VALUES ('admin', 'admin@loanmanagement.com', '<bcrypt_hash>', 'System Admin', 1, 1);

-- Default BRE Rules
INSERT OR IGNORE INTO bre_rules (rule_name, field, operator, value, value_type, reference_field, is_active)
VALUES
    ('Minimum Age', 'age', '>=', 21, 'numeric', NULL, 1),
    ('Maximum Age', 'age', '<=', 60, 'numeric', NULL, 1),
    ('Minimum Monthly Income', 'monthly_income', '>=', 30000, 'numeric', NULL, 1),
    ('Minimum Credit Score', 'credit_score', '>=', 700, 'numeric', NULL, 1),
    ('Loan to Property Value Ratio', 'loan_amount', '<=', 80, 'percentage', 'property_value', 1);
