
-- Add profile_data column to oauth_tokens table
ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS profile_data TEXT;
