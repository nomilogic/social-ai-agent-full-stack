-- Create scheduled_posts table for post scheduling functionality
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Post timing
    date DATE NOT NULL,
    time TIME NOT NULL,
    
    -- Post content
    content TEXT NOT NULL,
    image_url TEXT,
    image_prompt TEXT, -- AI image generation prompt
    
    -- Platform configuration
    platforms TEXT[] DEFAULT '{}'::TEXT[], -- Array of platform names
    category TEXT DEFAULT 'General',
    
    -- Status tracking
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'draft', 'published', 'failed')),
    is_live BOOLEAN DEFAULT FALSE, -- Whether this post uses live content generation
    
    -- Metadata
    reasoning TEXT, -- AI reasoning for the schedule
    error_message TEXT, -- If status is 'failed', store error details
    published_urls JSONB, -- URLs of published posts per platform
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_company_date ON scheduled_posts(company_id, date);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_live ON scheduled_posts(is_live) WHERE is_live = TRUE;
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_datetime ON scheduled_posts(date, time);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_scheduled_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_posts_updated_at
    BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_posts_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see posts for companies they have access to
-- For now, we'll make it permissive - you may want to restrict this based on your auth system
CREATE POLICY "scheduled_posts_select_policy" ON scheduled_posts
    FOR SELECT USING (true);

CREATE POLICY "scheduled_posts_insert_policy" ON scheduled_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "scheduled_posts_update_policy" ON scheduled_posts
    FOR UPDATE USING (true);

CREATE POLICY "scheduled_posts_delete_policy" ON scheduled_posts
    FOR DELETE USING (true);

-- Create a view for upcoming posts (next 30 days)
CREATE OR REPLACE VIEW upcoming_scheduled_posts AS
SELECT 
    sp.*,
    c.name as company_name,
    c.industry as company_industry,
    EXTRACT(EPOCH FROM (sp.date::timestamp + sp.time::interval - NOW())) as seconds_until_post
FROM scheduled_posts sp
JOIN companies c ON sp.company_id = c.id
WHERE sp.date >= CURRENT_DATE 
  AND sp.date <= CURRENT_DATE + INTERVAL '30 days'
  AND sp.status = 'scheduled'
ORDER BY sp.date, sp.time;

-- Create a function to get posts due for publishing (for cron job)
CREATE OR REPLACE FUNCTION get_posts_due_for_publishing(tolerance_minutes INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    company_id UUID,
    content TEXT,
    image_url TEXT,
    platforms TEXT[],
    category TEXT,
    is_live BOOLEAN,
    company_name TEXT,
    scheduled_datetime TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.company_id,
        sp.content,
        sp.image_url,
        sp.platforms,
        sp.category,
        sp.is_live,
        c.name as company_name,
        (sp.date::timestamp + sp.time::interval) as scheduled_datetime
    FROM scheduled_posts sp
    JOIN companies c ON sp.company_id = c.id
    WHERE sp.status = 'scheduled'
      AND (sp.date::timestamp + sp.time::interval) <= (NOW() + INTERVAL '1 minute' * tolerance_minutes)
      AND (sp.date::timestamp + sp.time::interval) >= (NOW() - INTERVAL '1 minute' * tolerance_minutes)
    ORDER BY scheduled_datetime;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark post as published with URLs
CREATE OR REPLACE FUNCTION mark_post_published(
    post_id UUID,
    urls JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE scheduled_posts
    SET 
        status = 'published',
        published_urls = urls,
        updated_at = NOW()
    WHERE id = post_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark post as failed with error message
CREATE OR REPLACE FUNCTION mark_post_failed(
    post_id UUID,
    error_msg TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE scheduled_posts
    SET 
        status = 'failed',
        error_message = error_msg,
        updated_at = NOW()
    WHERE id = post_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing (optional)
-- Uncomment this section if you want test data
/*
INSERT INTO scheduled_posts (
    company_id,
    date,
    time,
    content,
    platforms,
    category,
    status,
    reasoning
)
SELECT 
    c.id,
    CURRENT_DATE + INTERVAL '1 day' * (ROW_NUMBER() OVER ()),
    '09:00'::TIME,
    'Sample scheduled post #' || ROW_NUMBER() OVER () || ' for ' || c.name,
    ARRAY['linkedin']::TEXT[],
    'Sample',
    'scheduled',
    'Test post for development'
FROM companies c
LIMIT 5;
*/

COMMENT ON TABLE scheduled_posts IS 'Stores scheduled social media posts with AI-generated content and timing';
COMMENT ON COLUMN scheduled_posts.is_live IS 'When true, content will be regenerated on the day of posting based on current events';
COMMENT ON COLUMN scheduled_posts.reasoning IS 'AI-generated explanation for why this post was scheduled at this time';
COMMENT ON COLUMN scheduled_posts.published_urls IS 'JSON object containing URLs of published posts per platform';
