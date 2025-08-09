-- Create campaigns table for organizing posts under campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Campaign details
    name TEXT NOT NULL,
    description TEXT,
    objective TEXT, -- awareness, engagement, conversions, leads, etc.
    
    -- Campaign timeline
    start_date DATE,
    end_date DATE,
    
    -- Campaign targeting
    target_audience TEXT,
    platforms TEXT[] DEFAULT '{}'::TEXT[], -- Array of platform names
    
    -- Campaign settings
    budget DECIMAL(10,2), -- Optional budget tracking
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'draft')),
    
    -- Campaign branding
    brand_voice TEXT, -- specific voice for this campaign
    keywords TEXT[], -- campaign-specific keywords
    hashtags TEXT[], -- campaign hashtags
    
    -- Analytics tracking
    total_posts INTEGER DEFAULT 0,
    published_posts INTEGER DEFAULT 0,
    scheduled_posts INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_platforms ON campaigns USING GIN(platforms);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_campaigns_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access campaigns for companies they own
CREATE POLICY "campaigns_select_policy" ON campaigns
    FOR SELECT USING (true);

CREATE POLICY "campaigns_insert_policy" ON campaigns
    FOR INSERT WITH CHECK (true);

CREATE POLICY "campaigns_update_policy" ON campaigns
    FOR UPDATE USING (true);

CREATE POLICY "campaigns_delete_policy" ON campaigns
    FOR DELETE USING (true);

-- Update scheduled_posts table to include campaign_id
ALTER TABLE scheduled_posts ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_campaign_id ON scheduled_posts(campaign_id);

-- Update posts table if it exists to include campaign_id
ALTER TABLE posts ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_posts_campaign_id ON posts(campaign_id);

-- Create function to update campaign post counts
CREATE OR REPLACE FUNCTION update_campaign_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' AND NEW.campaign_id IS NOT NULL THEN
        UPDATE campaigns 
        SET 
            total_posts = total_posts + 1,
            scheduled_posts = CASE WHEN NEW.status = 'scheduled' THEN scheduled_posts + 1 ELSE scheduled_posts END,
            published_posts = CASE WHEN NEW.status = 'published' THEN published_posts + 1 ELSE published_posts END
        WHERE id = NEW.campaign_id;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Update old campaign counts
        IF OLD.campaign_id IS NOT NULL THEN
            UPDATE campaigns 
            SET 
                scheduled_posts = CASE WHEN OLD.status = 'scheduled' THEN scheduled_posts - 1 ELSE scheduled_posts END,
                published_posts = CASE WHEN OLD.status = 'published' THEN published_posts - 1 ELSE published_posts END
            WHERE id = OLD.campaign_id;
        END IF;
        
        -- Update new campaign counts
        IF NEW.campaign_id IS NOT NULL THEN
            UPDATE campaigns 
            SET 
                scheduled_posts = CASE WHEN NEW.status = 'scheduled' THEN scheduled_posts + 1 ELSE scheduled_posts END,
                published_posts = CASE WHEN NEW.status = 'published' THEN published_posts + 1 ELSE published_posts END
            WHERE id = NEW.campaign_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' AND OLD.campaign_id IS NOT NULL THEN
        UPDATE campaigns 
        SET 
            total_posts = total_posts - 1,
            scheduled_posts = CASE WHEN OLD.status = 'scheduled' THEN scheduled_posts - 1 ELSE scheduled_posts END,
            published_posts = CASE WHEN OLD.status = 'published' THEN published_posts - 1 ELSE published_posts END
        WHERE id = OLD.campaign_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for scheduled_posts
CREATE TRIGGER update_campaign_counts_scheduled_posts
    AFTER INSERT OR UPDATE OR DELETE ON scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_post_counts();

-- Create triggers for posts if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        CREATE TRIGGER update_campaign_counts_posts
            AFTER INSERT OR UPDATE OR DELETE ON posts
            FOR EACH ROW
            EXECUTE FUNCTION update_campaign_post_counts();
    END IF;
END $$;

-- Create view for campaign analytics
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT 
    c.*,
    co.name as company_name,
    co.industry as company_industry,
    COALESCE(sp.scheduled_count, 0) as scheduled_posts_count,
    COALESCE(sp.published_count, 0) as published_posts_count,
    COALESCE(sp.failed_count, 0) as failed_posts_count,
    COALESCE(sp.total_count, 0) as total_posts_count,
    CASE 
        WHEN COALESCE(sp.total_count, 0) > 0 
        THEN ROUND((COALESCE(sp.published_count, 0)::DECIMAL / sp.total_count) * 100, 2)
        ELSE 0 
    END as success_rate_percent
FROM campaigns c
JOIN companies co ON c.company_id = co.id
LEFT JOIN (
    SELECT 
        campaign_id,
        COUNT(*) as total_count,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_count,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
    FROM scheduled_posts 
    WHERE campaign_id IS NOT NULL
    GROUP BY campaign_id
) sp ON c.id = sp.campaign_id;

-- Insert some sample campaigns for testing (optional)
-- Uncomment this section if you want test data
/*
INSERT INTO campaigns (
    company_id,
    name,
    description,
    objective,
    start_date,
    end_date,
    platforms,
    status,
    brand_voice,
    keywords
)
SELECT 
    c.id,
    'Launch Campaign 2025',
    'Product launch campaign for new features',
    'awareness',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    ARRAY['linkedin', 'twitter']::TEXT[],
    'active',
    'professional',
    ARRAY['launch', 'product', 'innovation']::TEXT[]
FROM companies c
LIMIT 3;
*/

COMMENT ON TABLE campaigns IS 'Campaigns organize posts under specific marketing objectives for companies';
COMMENT ON COLUMN campaigns.objective IS 'Marketing objective: awareness, engagement, conversions, leads, etc.';
COMMENT ON COLUMN campaigns.brand_voice IS 'Campaign-specific brand voice that may differ from company default';
COMMENT ON COLUMN campaigns.status IS 'Campaign status: active, paused, completed, draft';
