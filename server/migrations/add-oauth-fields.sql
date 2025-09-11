-- Migration: Add OAuth fields to users table
-- Run this to update your existing database schema

-- Add OAuth fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_provider TEXT,
ADD COLUMN IF NOT EXISTS oauth_id TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Make password optional for OAuth users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider);
CREATE INDEX IF NOT EXISTS idx_users_oauth_id ON users(oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Update existing users to have email_verified = true (backward compatibility)
UPDATE users SET email_verified = TRUE WHERE oauth_provider IS NULL;
