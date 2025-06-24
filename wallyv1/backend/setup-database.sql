-- Basic user table structure for Wally
-- Run this in your PostgreSQL database

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    address VARCHAR(255),
    custody VARCHAR(255),
    email VARCHAR(255),
    telegram VARCHAR(255),
    farcaster_user JSONB,
    preferences JSONB DEFAULT '{}',
    auth_provider VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);
CREATE INDEX IF NOT EXISTS idx_users_custody ON users(custody);
