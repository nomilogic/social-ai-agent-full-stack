
-- Enhanced schema migration
-- Add new columns to existing tables

-- Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Update oauth_tokens table
ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS scope TEXT;
ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS account_id TEXT;
ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'business';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS brand_voice TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '{}'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS content_guidelines TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_model_used TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}'::jsonb;

-- Update campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'marketing';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS content_themes TEXT[];
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS posting_schedule JSONB DEFAULT '{}'::jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}'::jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Update scheduled_posts table
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS platform_specific_content JSONB DEFAULT '{}'::jsonb;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT true;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS performance_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Rename scheduled_posts columns
ALTER TABLE scheduled_posts RENAME COLUMN date TO scheduled_date_old;
ALTER TABLE scheduled_posts RENAME COLUMN time TO scheduled_time_old;

-- Update notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_label TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE media ADD COLUMN IF NOT EXISTS fileUrl TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS fileSize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS dimensions JSONB;
ALTER TABLE media ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE media ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE media ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE media ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create new tables
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(15,2),
  date DATE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  input_data TEXT,
  output_data TEXT,
  feedback_score INTEGER,
  feedback_text TEXT,
  ai_model TEXT,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb,
  platforms TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'ai-revolution',
  dashboard_layout JSONB DEFAULT '{}'::jsonb,
  notification_settings JSONB DEFAULT '{}'::jsonb,
  auto_publish_settings JSONB DEFAULT '{}'::jsonb,
  ai_preferences JSONB DEFAULT '{}'::jsonb,
  content_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_platform ON analytics(platform);
CREATE INDEX IF NOT EXISTS idx_ai_training_user ON ai_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user ON content_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON content_templates(category);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_date ON scheduled_posts(scheduled_date);
