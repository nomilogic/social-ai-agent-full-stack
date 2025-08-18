-- Create oauth_states table for temporary state storage
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL,
    user_id TEXT NOT NULL,
    options TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);

-- Create a function to automatically clean up expired states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Set up automatic cleanup (runs every hour)
SELECT cron.schedule('cleanup-oauth-states', '0 * * * *', 'SELECT cleanup_expired_oauth_states();');

-- Grant necessary permissions (adjust as needed for your RLS policies)
-- ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE oauth_states IS 'Temporary storage for OAuth state parameters during the OAuth flow';
COMMENT ON COLUMN oauth_states.state IS 'Unique state parameter for OAuth security';
COMMENT ON COLUMN oauth_states.platform IS 'OAuth platform (facebook, linkedin, etc.)';
COMMENT ON COLUMN oauth_states.user_id IS 'User ID initiating the OAuth flow';
COMMENT ON COLUMN oauth_states.options IS 'JSON string of additional OAuth options';
COMMENT ON COLUMN oauth_states.expires_at IS 'When this state expires (typically 10 minutes)';
