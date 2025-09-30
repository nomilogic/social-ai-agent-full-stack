-- Migration: Add post reads tracking table
-- This allows tracking which posts each user has read for accurate unread counters

-- Create user_post_reads table
CREATE TABLE IF NOT EXISTS user_post_reads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  post_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique constraint on user + post combination
  UNIQUE(user_id, post_id, platform)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_post_reads_user_id ON user_post_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_post_reads_post_id ON user_post_reads(post_id);
CREATE INDEX IF NOT EXISTS idx_user_post_reads_read_at ON user_post_reads(read_at);
CREATE INDEX IF NOT EXISTS idx_user_post_reads_user_platform ON user_post_reads(user_id, platform);

-- Add foreign key constraint to users table (if users table exists)
-- Note: This assumes the users table has an id column
-- ALTER TABLE user_post_reads ADD CONSTRAINT fk_user_post_reads_user_id 
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

COMMENT ON TABLE user_post_reads IS 'Tracks which posts each user has read for unread counter functionality';
COMMENT ON COLUMN user_post_reads.post_id IS 'The post ID (matches format used in post history API)';
COMMENT ON COLUMN user_post_reads.platform IS 'The platform where the post was published (linkedin, facebook, etc.)';
COMMENT ON COLUMN user_post_reads.read_at IS 'When the user marked this post as read';
