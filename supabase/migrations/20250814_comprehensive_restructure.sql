
-- Drop existing tables if they exist (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS scheduled_posts CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS oauth_tokens CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with comprehensive profile and subscription management
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  name text NOT NULL,
  avatar_url text,
  phone text,
  bio text,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  
  -- Subscription & Plan Management
  plan text NOT NULL DEFAULT 'free', -- free, pro, business
  role text NOT NULL DEFAULT 'user', -- user, admin, moderator
  subscription_status text DEFAULT 'inactive', -- active, inactive, cancelled, past_due, trial
  subscription_id text, -- External payment provider subscription ID
  trial_ends_at timestamptz,
  plan_limits jsonb DEFAULT '{
    "companies": 1,
    "posts_per_month": 10,
    "campaigns": 1,
    "scheduled_posts": 5,
    "ai_generations": 50,
    "social_accounts": 2
  }'::jsonb,
  
  -- Profile completion tracking
  profile_completed boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  setup_step integer DEFAULT 0,
  
  -- Preferences
  preferences jsonb DEFAULT '{
    "theme": "light",
    "notifications": true,
    "email_notifications": true,
    "push_notifications": false,
    "auto_publish": false,
    "ai_suggestions": true
  }'::jsonb,
  
  -- Analytics
  last_login timestamptz,
  total_posts_created integer DEFAULT 0,
  total_campaigns_created integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Companies table with enhanced branding and AI training data
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  
  -- Basic Info
  website text,
  industry text,
  description text,
  logo_url text,
  banner_url text,
  
  -- Branding & Voice
  target_audience text,
  brand_tone text DEFAULT 'professional',
  brand_voice text,
  brand_colors jsonb DEFAULT '[]'::jsonb, -- Array of hex colors
  brand_fonts jsonb DEFAULT '[]'::jsonb,
  
  -- Business Details
  goals text[] DEFAULT '{}',
  platforms text[] DEFAULT '{}', -- ['linkedin', 'facebook', 'twitter', 'instagram']
  business_type text, -- B2B, B2C, etc.
  company_size text, -- startup, small, medium, large, enterprise
  location text,
  
  -- AI Training Data
  content_style_preferences text,
  posting_frequency text,
  content_categories text[] DEFAULT '{}',
  hashtag_strategy text,
  content_themes text[] DEFAULT '{}',
  competitor_analysis text,
  
  -- Settings
  auto_schedule boolean DEFAULT false,
  default_posting_times jsonb DEFAULT '[]'::jsonb,
  content_approval_required boolean DEFAULT true,
  
  -- Analytics
  total_posts integer DEFAULT 0,
  total_campaigns integer DEFAULT 0,
  engagement_score decimal(3,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- OAuth tokens table for social media platform connections
CREATE TABLE oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  
  platform text NOT NULL, -- 'linkedin', 'facebook', 'twitter', 'instagram', 'tiktok', 'youtube'
  platform_user_id text,
  platform_username text,
  
  -- Token data
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  token_type text DEFAULT 'Bearer',
  scope text,
  
  -- Platform specific data
  platform_data jsonb DEFAULT '{}'::jsonb,
  
  -- Connection status
  status text DEFAULT 'active', -- active, expired, revoked, error
  last_used_at timestamptz,
  error_message text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, platform, platform_user_id)
);

-- Campaigns table with comprehensive campaign management
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Info
  name text NOT NULL,
  description text,
  
  -- Campaign Strategy
  objective text, -- awareness, engagement, leads, sales, etc.
  target_audience text,
  brand_voice text,
  content_themes text[] DEFAULT '{}',
  
  -- Scheduling
  start_date date,
  end_date date,
  posting_schedule jsonb DEFAULT '{}'::jsonb, -- Day/time preferences
  
  -- Content Strategy
  platforms text[] DEFAULT '{}',
  content_types text[] DEFAULT '{}', -- text, image, video, carousel
  hashtags text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  
  -- Budget & Goals
  budget decimal(10, 2),
  target_metrics jsonb DEFAULT '{}'::jsonb,
  
  -- Status & Progress
  status text DEFAULT 'active', -- active, paused, completed, archived
  progress decimal(3,2) DEFAULT 0,
  
  -- Analytics
  total_posts integer DEFAULT 0,
  published_posts integer DEFAULT 0,
  scheduled_posts integer DEFAULT 0,
  draft_posts integer DEFAULT 0,
  
  -- Performance Metrics
  total_impressions bigint DEFAULT 0,
  total_engagement bigint DEFAULT 0,
  total_clicks bigint DEFAULT 0,
  engagement_rate decimal(5,4) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Posts table with comprehensive content management
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  prompt text NOT NULL,
  generated_content jsonb, -- Platform-specific content variations
  final_content text,
  
  -- Media
  media_urls text[] DEFAULT '{}',
  media_types text[] DEFAULT '{}', -- image, video, gif, document
  thumbnail_url text,
  
  -- Categorization
  tags text[] DEFAULT '{}',
  category text DEFAULT 'general',
  content_type text DEFAULT 'text', -- text, image, video, carousel, story
  
  -- AI Generation Data
  ai_model_used text,
  generation_prompt text,
  generation_settings jsonb DEFAULT '{}'::jsonb,
  ai_confidence_score decimal(3,2),
  
  -- Publishing
  platforms text[] DEFAULT '{}',
  status text DEFAULT 'draft', -- draft, scheduled, published, failed, archived
  
  -- Scheduling
  scheduled_for timestamptz,
  published_at timestamptz,
  
  -- Platform Publishing Data
  platform_post_ids jsonb DEFAULT '{}'::jsonb, -- Store platform-specific post IDs
  publishing_errors jsonb DEFAULT '{}'::jsonb,
  
  -- Performance Metrics
  impressions bigint DEFAULT 0,
  engagement bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  shares bigint DEFAULT 0,
  comments bigint DEFAULT 0,
  likes bigint DEFAULT 0,
  
  -- Metadata
  is_live_content boolean DEFAULT false, -- For time-sensitive content
  priority text DEFAULT 'normal', -- low, normal, high, urgent
  approval_status text DEFAULT 'pending', -- pending, approved, rejected
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Scheduled posts table for calendar management
CREATE TABLE scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Scheduling Details
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  timezone text DEFAULT 'UTC',
  
  -- Content (can override post content)
  content text NOT NULL,
  image_url text,
  image_prompt text,
  
  -- Publishing
  platforms text[] DEFAULT '{}',
  category text DEFAULT 'General',
  
  -- Status Management
  status text DEFAULT 'scheduled', -- scheduled, publishing, published, failed, cancelled
  is_live boolean DEFAULT false,
  
  -- AI Generation
  reasoning text, -- Why this post was scheduled for this time
  ai_generated boolean DEFAULT false,
  generation_context text,
  
  -- Error Handling
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  
  -- Publishing Results
  published_urls jsonb DEFAULT '{}'::jsonb,
  platform_responses jsonb DEFAULT '{}'::jsonb,
  
  -- Performance Tracking
  expected_reach integer,
  actual_reach integer,
  engagement_prediction decimal(3,2),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table for comprehensive notification system
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Content
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- info, success, warning, error, reminder, campaign, post, system
  priority text DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Categorization
  category text, -- post_published, campaign_reminder, oauth_expired, etc.
  related_entity_type text, -- post, campaign, company, user
  related_entity_id uuid,
  
  -- Status
  read boolean DEFAULT false,
  read_at timestamptz,
  dismissed boolean DEFAULT false,
  dismissed_at timestamptz,
  
  -- Actions
  action_url text,
  action_label text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Scheduling
  scheduled_for timestamptz,
  expires_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Media table for comprehensive media management
CREATE TABLE media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  
  -- File Information
  filename text NOT NULL,
  original_name text NOT NULL,
  file_path text NOT NULL,
  file_url text,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  
  -- Media Details
  media_type text NOT NULL, -- image, video, audio, document, gif
  dimensions jsonb, -- {width: 1920, height: 1080}
  duration integer, -- For video/audio in seconds
  
  -- Processing Status
  processing_status text DEFAULT 'completed', -- uploading, processing, completed, failed
  thumbnail_url text,
  compressed_url text,
  
  -- AI Generated Content
  is_ai_generated boolean DEFAULT false,
  generation_prompt text,
  ai_model_used text,
  
  -- Usage Tracking
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  
  -- Organization
  tags text[] DEFAULT '{}',
  folder text DEFAULT 'general',
  
  -- Metadata
  alt_text text,
  caption text,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Training Data table for improving AI responses
CREATE TABLE ai_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Training Context
  training_type text NOT NULL, -- content_generation, scheduling, engagement_prediction
  prompt text NOT NULL,
  response text NOT NULL,
  
  -- Quality Metrics
  user_rating integer CHECK (user_rating >= 1 AND user_rating <= 5),
  used_as_final boolean DEFAULT false,
  effectiveness_score decimal(3,2),
  
  -- Context Data
  context_data jsonb DEFAULT '{}'::jsonb,
  platform text,
  content_category text,
  
  -- Learning Metrics
  confidence_score decimal(3,2),
  model_version text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Analytics summary table for performance tracking
CREATE TABLE analytics_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Time Period
  period_start date NOT NULL,
  period_end date NOT NULL,
  period_type text NOT NULL, -- daily, weekly, monthly, quarterly, yearly
  
  -- Metrics
  total_posts integer DEFAULT 0,
  total_impressions bigint DEFAULT 0,
  total_engagement bigint DEFAULT 0,
  total_clicks bigint DEFAULT 0,
  total_shares bigint DEFAULT 0,
  
  -- Rates
  engagement_rate decimal(5,4) DEFAULT 0,
  click_through_rate decimal(5,4) DEFAULT 0,
  conversion_rate decimal(5,4) DEFAULT 0,
  
  -- Platform Breakdown
  platform_metrics jsonb DEFAULT '{}'::jsonb,
  
  -- Content Performance
  top_performing_content jsonb DEFAULT '{}'::jsonb,
  content_category_performance jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, company_id, campaign_id, period_start, period_type)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create RLS Policies for companies table
CREATE POLICY "Users can manage their own companies"
  ON companies FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for oauth_tokens table
CREATE POLICY "Users can manage their own oauth tokens"
  ON oauth_tokens FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for campaigns table
CREATE POLICY "Users can manage their own campaigns"
  ON campaigns FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for posts table
CREATE POLICY "Users can manage their own posts"
  ON posts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for scheduled_posts table
CREATE POLICY "Users can manage their own scheduled posts"
  ON scheduled_posts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for notifications table
CREATE POLICY "Users can manage their own notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for media table
CREATE POLICY "Users can manage their own media"
  ON media FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for ai_training_data table
CREATE POLICY "Users can manage their own training data"
  ON ai_training_data FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for analytics_summary table
CREATE POLICY "Users can view their own analytics"
  ON analytics_summary FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_platform ON oauth_tokens(platform);
CREATE INDEX idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_posts_company_id ON posts(company_id);
CREATE INDEX idx_posts_campaign_id ON posts(campaign_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_scheduled_posts_company_id ON scheduled_posts(company_id);
CREATE INDEX idx_scheduled_posts_scheduled_date ON scheduled_posts(scheduled_date);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_media_user_id ON media(user_id);
CREATE INDEX idx_media_company_id ON media(company_id);
CREATE INDEX idx_ai_training_user_id ON ai_training_data(user_id);
CREATE INDEX idx_analytics_summary_user_id ON analytics_summary(user_id);
CREATE INDEX idx_analytics_summary_period ON analytics_summary(period_start, period_type);

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert business account for nomilogic@gmail.com
INSERT INTO users (
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
  'nomilogic@gmail.com',
  '$2a$10$rQzxHVSPTYUcJWgS.2AEu.K7V9fTjL6qR8Zv5WzQpEk1sB2CdGhXW', -- hashed "business123"
  'Nomi Logic',
  'business',
  'user',
  'active',
  true,
  true,
  '{
    "companies": 50,
    "posts_per_month": 1000,
    "campaigns": 100,
    "scheduled_posts": 500,
    "ai_generations": 5000,
    "social_accounts": 20
  }',
  '{
    "theme": "dark",
    "notifications": true,
    "email_notifications": true,
    "push_notifications": true,
    "auto_publish": true,
    "ai_suggestions": true
  }'
) ON CONFLICT (email) DO UPDATE SET
  plan = 'business',
  subscription_status = 'active',
  plan_limits = EXCLUDED.plan_limits,
  preferences = EXCLUDED.preferences;
