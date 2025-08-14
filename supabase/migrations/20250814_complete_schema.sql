
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with comprehensive profile and subscription management
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  
  -- Subscription & Plan Management
  plan TEXT NOT NULL DEFAULT 'free', -- free, pro, business
  role TEXT NOT NULL DEFAULT 'user', -- user, admin, moderator
  subscription_status TEXT DEFAULT 'inactive', -- active, inactive, cancelled, past_due, trial
  subscription_id TEXT, -- External payment provider subscription ID
  trial_ends_at TIMESTAMPTZ,
  plan_limits JSONB DEFAULT '{
    "companies": 1,
    "posts_per_month": 10,
    "campaigns": 1,
    "scheduled_posts": 5,
    "ai_generations": 50,
    "social_accounts": 2
  }'::jsonb,
  
  -- Profile completion tracking
  profile_completed BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  setup_step INTEGER DEFAULT 0,
  
  -- Preferences
  preferences JSONB DEFAULT '{
    "theme": "light",
    "notifications": true,
    "email_notifications": true,
    "push_notifications": false,
    "auto_publish": false,
    "ai_suggestions": true
  }'::jsonb,
  
  -- Analytics
  last_login TIMESTAMPTZ,
  total_posts_created INTEGER DEFAULT 0,
  total_campaigns_created INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table with enhanced branding and AI training data
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  
  -- Basic Info
  website TEXT,
  industry TEXT,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  
  -- Branding & Voice
  target_audience TEXT,
  brand_tone TEXT DEFAULT 'professional',
  brand_voice TEXT,
  brand_colors JSONB DEFAULT '[]'::jsonb, -- Array of hex colors
  brand_fonts JSONB DEFAULT '[]'::jsonb,
  
  -- Business Details
  goals TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}', -- ['linkedin', 'facebook', 'twitter', 'instagram']
  business_type TEXT, -- B2B, B2C, etc.
  company_size TEXT, -- startup, small, medium, large, enterprise
  location TEXT,
  
  -- AI Training Data
  content_style_preferences TEXT,
  posting_frequency TEXT,
  content_categories TEXT[] DEFAULT '{}',
  hashtag_strategy TEXT,
  content_themes TEXT[] DEFAULT '{}',
  competitor_analysis TEXT,
  
  -- Settings
  auto_schedule BOOLEAN DEFAULT false,
  default_posting_times JSONB DEFAULT '[]'::jsonb,
  content_approval_required BOOLEAN DEFAULT true,
  
  -- Analytics
  total_posts INTEGER DEFAULT 0,
  total_campaigns INTEGER DEFAULT 0,
  engagement_score DECIMAL(3,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth tokens table for social media platform connections
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  platform TEXT NOT NULL, -- 'linkedin', 'facebook', 'twitter', 'instagram', 'tiktok', 'youtube'
  platform_user_id TEXT,
  platform_username TEXT,
  
  -- Token data
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  
  -- Platform specific data
  platform_data JSONB DEFAULT '{}'::jsonb,
  
  -- Connection status
  status TEXT DEFAULT 'active', -- active, expired, revoked, error
  last_used_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table with comprehensive campaign management
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Campaign Strategy
  objective TEXT, -- awareness, engagement, leads, sales, etc.
  target_audience TEXT,
  brand_voice TEXT,
  content_themes TEXT[] DEFAULT '{}',
  
  -- Scheduling
  start_date DATE,
  end_date DATE,
  posting_schedule JSONB DEFAULT '{}'::jsonb, -- Day/time preferences
  
  -- Content Strategy
  platforms TEXT[] DEFAULT '{}',
  content_types TEXT[] DEFAULT '{}', -- text, image, video, carousel
  hashtags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  
  -- Budget & Goals
  budget DECIMAL(10,2),
  target_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Status & Progress
  status TEXT DEFAULT 'active', -- active, paused, completed, archived
  progress DECIMAL(3,2) DEFAULT 0,
  
  -- Analytics
  total_posts INTEGER DEFAULT 0,
  published_posts INTEGER DEFAULT 0,
  scheduled_posts INTEGER DEFAULT 0,
  draft_posts INTEGER DEFAULT 0,
  
  -- Performance Metrics
  total_impressions BIGINT DEFAULT 0,
  total_engagement BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table with comprehensive content management
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  prompt TEXT NOT NULL,
  generated_content JSONB, -- Platform-specific content variations
  final_content TEXT,
  
  -- Media
  media_urls TEXT[] DEFAULT '{}',
  media_types TEXT[] DEFAULT '{}', -- image, video, gif, document
  thumbnail_url TEXT,
  
  -- Categorization
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  content_type TEXT DEFAULT 'text', -- text, image, video, carousel, story
  
  -- AI Generation Data
  ai_model_used TEXT,
  generation_prompt TEXT,
  generation_settings JSONB DEFAULT '{}'::jsonb,
  ai_confidence_score DECIMAL(3,2),
  
  -- Publishing
  platforms TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft', -- draft, scheduled, published, failed, archived
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Platform Publishing Data
  platform_post_ids JSONB DEFAULT '{}'::jsonb, -- Store platform-specific post IDs
  publishing_errors JSONB DEFAULT '{}'::jsonb,
  
  -- Performance Metrics
  impressions BIGINT DEFAULT 0,
  engagement BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  
  -- Metadata
  is_live_content BOOLEAN DEFAULT false, -- For time-sensitive content
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  approval_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled posts table for calendar management
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Scheduling Details
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  
  -- Content (can override post content)
  content TEXT NOT NULL,
  image_url TEXT,
  image_prompt TEXT,
  
  -- Publishing
  platforms TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'General',
  
  -- Status Management
  status TEXT DEFAULT 'scheduled', -- scheduled, publishing, published, failed, cancelled
  is_live BOOLEAN DEFAULT false,
  
  -- AI Generation
  reasoning TEXT, -- Why this post was scheduled for this time
  ai_generated BOOLEAN DEFAULT false,
  generation_context TEXT,
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Publishing Results
  published_urls JSONB DEFAULT '{}'::jsonb,
  platform_responses JSONB DEFAULT '{}'::jsonb,
  
  -- Performance Tracking
  expected_reach INTEGER,
  actual_reach INTEGER,
  engagement_prediction DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table for comprehensive notification system
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- info, success, warning, error, reminder, campaign, post, system
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Categorization
  category TEXT, -- post_published, campaign_reminder, oauth_expired, etc.
  related_entity_type TEXT, -- post, campaign, company, user
  related_entity_id UUID,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  
  -- Actions
  action_url TEXT,
  action_label TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media table for comprehensive media management
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- File Information
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  
  -- Media Details
  media_type TEXT NOT NULL, -- image, video, audio, document, gif
  dimensions JSONB, -- {width: 1920, height: 1080}
  duration INTEGER, -- For video/audio in seconds
  
  -- Processing Status
  processing_status TEXT DEFAULT 'completed', -- uploading, processing, completed, failed
  thumbnail_url TEXT,
  compressed_url TEXT,
  
  -- AI Generated Content
  is_ai_generated BOOLEAN DEFAULT false,
  generation_prompt TEXT,
  ai_model_used TEXT,
  
  -- Usage Tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  folder TEXT DEFAULT 'general',
  
  -- Metadata
  alt_text TEXT,
  caption TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Training Data table for improving AI responses
CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Training Context
  training_type TEXT NOT NULL, -- content_generation, scheduling, engagement_prediction
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  
  -- Quality Metrics
  user_rating INTEGER, -- 1-5 rating
  used_as_final BOOLEAN DEFAULT false,
  effectiveness_score DECIMAL(3,2),
  
  -- Context Data
  context_data JSONB DEFAULT '{}'::jsonb,
  platform TEXT,
  content_category TEXT,
  
  -- Learning Metrics
  confidence_score DECIMAL(3,2),
  model_version TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics summary table for performance tracking
CREATE TABLE IF NOT EXISTS analytics_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Time Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL, -- daily, weekly, monthly, quarterly, yearly
  
  -- Metrics
  total_posts INTEGER DEFAULT 0,
  total_impressions BIGINT DEFAULT 0,
  total_engagement BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  total_shares BIGINT DEFAULT 0,
  
  -- Rates
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  click_through_rate DECIMAL(5,4) DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Platform Breakdown
  platform_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Content Performance
  top_performing_content JSONB DEFAULT '{}'::jsonb,
  content_category_performance JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_company_id ON posts(company_id);
CREATE INDEX IF NOT EXISTS idx_posts_campaign_id ON posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_company_id ON scheduled_posts(company_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_date ON scheduled_posts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_company_id ON media(company_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_platform ON oauth_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_ai_training_user_id ON ai_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON analytics_summary(user_id, period_start);

-- Create business account for nomilogic@gmail.com
INSERT INTO users (
  id,
  email,
  password,
  name,
  plan,
  role,
  subscription_status,
  profile_completed,
  onboarding_completed,
  plan_limits,
  preferences
) VALUES (
  'f5643ed0-5c7b-45f9-b42f-5ce7c48df6b5',
  'nomilogic@gmail.com',
  '$2b$10$hashedpassword', -- You'll need to hash this properly
  'Nomilogic Business',
  'business',
  'user',
  'active',
  true,
  true,
  '{
    "companies": 10,
    "posts_per_month": 1000,
    "campaigns": 50,
    "scheduled_posts": 500,
    "ai_generations": 10000,
    "social_accounts": 20
  }'::jsonb,
  '{
    "theme": "ai-revolution",
    "notifications": true,
    "email_notifications": true,
    "push_notifications": true,
    "auto_publish": true,
    "ai_suggestions": true
  }'::jsonb
) ON CONFLICT (email) DO UPDATE SET
  plan = EXCLUDED.plan,
  role = EXCLUDED.role,
  subscription_status = EXCLUDED.subscription_status,
  plan_limits = EXCLUDED.plan_limits,
  preferences = EXCLUDED.preferences;
