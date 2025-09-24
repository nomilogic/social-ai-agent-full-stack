-- Fix schema permissions for service role
-- Run this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/fzdpldiqbcssaqczizjw/sql

-- Grant service_role access to public schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Make sure future tables also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- Specific grants for your main tables
GRANT ALL PRIVILEGES ON TABLE media TO service_role;
GRANT ALL PRIVILEGES ON TABLE campaigns TO service_role; 
GRANT ALL PRIVILEGES ON TABLE posts TO service_role;
GRANT ALL PRIVILEGES ON TABLE users TO service_role;
GRANT ALL PRIVILEGES ON TABLE profiles TO service_role;
GRANT ALL PRIVILEGES ON TABLE scheduled_posts TO service_role;
GRANT ALL PRIVILEGES ON TABLE notifications TO service_role;
GRANT ALL PRIVILEGES ON TABLE oauth_tokens TO service_role;
GRANT ALL PRIVILEGES ON TABLE oauth_states TO service_role;

-- Also grant permissions on sequences (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
