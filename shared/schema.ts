
import { pgTable, uuid, text, timestamp, boolean, jsonb, decimal, integer, date, time, bigint } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table with comprehensive profile and subscription management
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  bio: text('bio'),
  timezone: text('timezone').default('UTC'),
  language: text('language').default('en'),
  
  // Subscription & Plan Management
  plan: text('plan').notNull().default('free'), // free, pro, business
  role: text('role').notNull().default('user'), // user, admin, moderator
  subscription_status: text('subscription_status').default('inactive'), // active, inactive, cancelled, past_due, trial
  subscription_id: text('subscription_id'), // External payment provider subscription ID
  trial_ends_at: timestamp('trial_ends_at', { withTimezone: true }),
  plan_limits: jsonb('plan_limits').default(sql`'{
    "companies": 1,
    "posts_per_month": 10,
    "campaigns": 1,
    "scheduled_posts": 5,
    "ai_generations": 50,
    "social_accounts": 2
  }'::jsonb`),
  
  // Profile completion tracking
  profile_completed: boolean('profile_completed').default(false),
  onboarding_completed: boolean('onboarding_completed').default(false),
  setup_step: integer('setup_step').default(0),
  
  // Preferences
  preferences: jsonb('preferences').default(sql`'{
    "theme": "light",
    "notifications": true,
    "email_notifications": true,
    "push_notifications": false,
    "auto_publish": false,
    "ai_suggestions": true
  }'::jsonb`),
  
  // Analytics
  last_login: timestamp('last_login', { withTimezone: true }),
  total_posts_created: integer('total_posts_created').default(0),
  total_campaigns_created: integer('total_campaigns_created').default(0),
  
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Companies table with enhanced branding and AI training data
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  
  // Basic Info
  website: text('website'),
  industry: text('industry'),
  description: text('description'),
  logo_url: text('logo_url'),
  banner_url: text('banner_url'),
  
  // Branding & Voice
  target_audience: text('target_audience'),
  brand_tone: text('brand_tone').default('professional'),
  brand_voice: text('brand_voice'),
  brand_colors: jsonb('brand_colors').default(sql`'[]'::jsonb`), // Array of hex colors
  brand_fonts: jsonb('brand_fonts').default(sql`'[]'::jsonb`),
  
  // Business Details
  goals: text('goals').array().default(sql`'{}'::text[]`),
  platforms: text('platforms').array().default(sql`'{}'::text[]`), // ['linkedin', 'facebook', 'twitter', 'instagram']
  business_type: text('business_type'), // B2B, B2C, etc.
  company_size: text('company_size'), // startup, small, medium, large, enterprise
  location: text('location'),
  
  // AI Training Data
  content_style_preferences: text('content_style_preferences'),
  posting_frequency: text('posting_frequency'),
  content_categories: text('content_categories').array().default(sql`'{}'::text[]`),
  hashtag_strategy: text('hashtag_strategy'),
  content_themes: text('content_themes').array().default(sql`'{}'::text[]`),
  competitor_analysis: text('competitor_analysis'),
  
  // Settings
  auto_schedule: boolean('auto_schedule').default(false),
  default_posting_times: jsonb('default_posting_times').default(sql`'[]'::jsonb`),
  content_approval_required: boolean('content_approval_required').default(true),
  
  // Analytics
  total_posts: integer('total_posts').default(0),
  total_campaigns: integer('total_campaigns').default(0),
  engagement_score: decimal('engagement_score', { precision: 3, scale: 2 }).default('0'),
  
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// OAuth tokens table for social media platform connections
export const oauth_tokens = pgTable('oauth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  
  platform: text('platform').notNull(), // 'linkedin', 'facebook', 'twitter', 'instagram', 'tiktok', 'youtube'
  platform_user_id: text('platform_user_id'),
  platform_username: text('platform_username'),
  
  // Token data
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token'),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  token_type: text('token_type').default('Bearer'),
  scope: text('scope'),
  
  // Platform specific data
  platform_data: jsonb('platform_data').default(sql`'{}'::jsonb`),
  
  // Connection status
  status: text('status').default('active'), // active, expired, revoked, error
  last_used_at: timestamp('last_used_at', { withTimezone: true }),
  error_message: text('error_message'),
  
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Campaigns table with comprehensive campaign management
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Basic Info
  name: text('name').notNull(),
  description: text('description'),
  
  // Campaign Strategy
  objective: text('objective'), // awareness, engagement, leads, sales, etc.
  target_audience: text('target_audience'),
  brand_voice: text('brand_voice'),
  content_themes: text('content_themes').array().default(sql`'{}'::text[]`),
  
  // Scheduling
  start_date: date('start_date'),
  end_date: date('end_date'),
  posting_schedule: jsonb('posting_schedule').default(sql`'{}'::jsonb`), // Day/time preferences
  
  // Content Strategy
  platforms: text('platforms').array().default(sql`'{}'::text[]`),
  content_types: text('content_types').array().default(sql`'{}'::text[]`), // text, image, video, carousel
  hashtags: text('hashtags').array().default(sql`'{}'::text[]`),
  keywords: text('keywords').array().default(sql`'{}'::text[]`),
  
  // Budget & Goals
  budget: decimal('budget', { precision: 10, scale: 2 }),
  target_metrics: jsonb('target_metrics').default(sql`'{}'::jsonb`),
  
  // Status & Progress
  status: text('status').default('active'), // active, paused, completed, archived
  progress: decimal('progress', { precision: 3, scale: 2 }).default('0'),
  
  // Analytics
  total_posts: integer('total_posts').default(0),
  published_posts: integer('published_posts').default(0),
  scheduled_posts: integer('scheduled_posts').default(0),
  draft_posts: integer('draft_posts').default(0),
  
  // Performance Metrics
  total_impressions: bigint('total_impressions', { mode: 'number' }).default(0),
  total_engagement: bigint('total_engagement', { mode: 'number' }).default(0),
  total_clicks: bigint('total_clicks', { mode: 'number' }).default(0),
  engagement_rate: decimal('engagement_rate', { precision: 5, scale: 4 }).default('0'),
  
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Posts table with comprehensive content management
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Content
  prompt: text('prompt').notNull(),
  generated_content: jsonb('generated_content'), // Platform-specific content variations
  final_content: text('final_content'),
  
  // Media
  media_urls: text('media_urls').array().default(sql`'{}'::text[]`),
  media_types: text('media_types').array().default(sql`'{}'::text[]`), // image, video, gif, document
  thumbnail_url: text('thumbnail_url'),
  
  // Categorization
  tags: text('tags').array().default(sql`'{}'::text[]`),
  category: text('category').default('general'),
  content_type: text('content_type').default('text'), // text, image, video, carousel, story
  
  // AI Generation Data
  ai_model_used: text('ai_model_used'),
  generation_prompt: text('generation_prompt'),
  generation_settings: jsonb('generation_settings').default(sql`'{}'::jsonb`),
  ai_confidence_score: decimal('ai_confidence_score', { precision: 3, scale: 2 }),
  
  // Publishing
  platforms: text('platforms').array().default(sql`'{}'::text[]`),
  status: text('status').default('draft'), // draft, scheduled, published, failed, archived
  
  // Scheduling
  scheduled_for: timestamp('scheduled_for', { withTimezone: true }),
  published_at: timestamp('published_at', { withTimezone: true }),
  
  // Platform Publishing Data
  platform_post_ids: jsonb('platform_post_ids').default(sql`'{}'::jsonb`), // Store platform-specific post IDs
  publishing_errors: jsonb('publishing_errors').default(sql`'{}'::jsonb`),
  
  // Performance Metrics
  impressions: bigint('impressions', { mode: 'number' }).default(0),
  engagement: bigint('engagement', { mode: 'number' }).default(0),
  clicks: bigint('clicks', { mode: 'number' }).default(0),
  shares: bigint('shares', { mode: 'number' }).default(0),
  comments: bigint('comments', { mode: 'number' }).default(0),
  likes: bigint('likes', { mode: 'number' }).default(0),
  
  // Metadata
  is_live_content: boolean('is_live_content').default(false), // For time-sensitive content
  priority: text('priority').default('normal'), // low, normal, high, urgent
  approval_status: text('approval_status').default('pending'), // pending, approved, rejected
  approved_by: uuid('approved_by').references(() => users.id),
  approved_at: timestamp('approved_at', { withTimezone: true }),
  
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Scheduled posts table for calendar management
export const scheduled_posts = pgTable('scheduled_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  post_id: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Scheduling Details
  scheduled_date: date('scheduled_date').notNull(),
  scheduled_time: time('scheduled_time').notNull(),
  timezone: text('timezone').default('UTC'),
  
  // Content (can override post content)
  content: text('content').notNull(),
  image_url: text('image_url'),
  image_prompt: text('image_prompt'),
  
  // Publishing
  platforms: text('platforms').array().default(sql`'{}'::text[]`),
  category: text('category').default('General'),
  
  // Status Management
  status: text('status').default('scheduled'), // scheduled, publishing, published, failed, cancelled
  is_live: boolean('is_live').default(false),
  
  // AI Generation
  reasoning: text('reasoning'), // Why this post was scheduled for this time
  ai_generated: boolean('ai_generated').default(false),
  generation_context: text('generation_context'),
  
  // Error Handling
  error_message: text('error_message'),
  retry_count: integer('retry_count').default(0),
  max_retries: integer('max_retries').default(3),
  
  // Publishing Results
  published_urls: jsonb('published_urls').default(sql`'{}'::jsonb`),
  platform_responses: jsonb('platform_responses').default(sql`'{}'::jsonb`),
  
  // Performance Tracking
  expected_reach: integer('expected_reach'),
  actual_reach: integer('actual_reach'),
  engagement_prediction: decimal('engagement_prediction', { precision: 3, scale: 2 }),
  
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Notifications table for comprehensive notification system
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Notification Content
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // info, success, warning, error, reminder, campaign, post, system
  priority: text('priority').default('normal'), // low, normal, high, urgent
  
  // Categorization
  category: text('category'), // post_published, campaign_reminder, oauth_expired, etc.
  related_entity_type: text('related_entity_type'), // post, campaign, company, user
  related_entity_id: uuid('related_entity_id'),
  
  // Status
  read: boolean('read').default(false),
  read_at: timestamp('read_at', { withTimezone: true }),
  dismissed: boolean('dismissed').default(false),
  dismissed_at: timestamp('dismissed_at', { withTimezone: true }),
  
  // Actions
  action_url: text('action_url'),
  action_label: text('action_label'),
  
  // Metadata
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  
  // Scheduling
  scheduled_for: timestamp('scheduled_for', { withTimezone: true }),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Media table for comprehensive media management
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  
  // File Information
  filename: text('filename').notNull(),
  original_name: text('original_name').notNull(),
  file_path: text('file_path').notNull(),
  file_url: text('file_url'),
  mime_type: text('mime_type').notNull(),
  file_size: bigint('file_size', { mode: 'number' }).notNull(),
  
  // Media Details
  media_type: text('media_type').notNull(), // image, video, audio, document, gif
  dimensions: jsonb('dimensions'), // {width: 1920, height: 1080}
  duration: integer('duration'), // For video/audio in seconds
  
  // Processing Status
  processing_status: text('processing_status').default('completed'), // uploading, processing, completed, failed
  thumbnail_url: text('thumbnail_url'),
  compressed_url: text('compressed_url'),
  
  // AI Generated Content
  is_ai_generated: boolean('is_ai_generated').default(false),
  generation_prompt: text('generation_prompt'),
  ai_model_used: text('ai_model_used'),
  
  // Usage Tracking
  usage_count: integer('usage_count').default(0),
  last_used_at: timestamp('last_used_at', { withTimezone: true }),
  
  // Organization
  tags: text('tags').array().default(sql`'{}'::text[]`),
  folder: text('folder').default('general'),
  
  // Metadata
  alt_text: text('alt_text'),
  caption: text('caption'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// AI Training Data table for improving AI responses
export const ai_training_data = pgTable('ai_training_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  
  // Training Context
  training_type: text('training_type').notNull(), // content_generation, scheduling, engagement_prediction
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  
  // Quality Metrics
  user_rating: integer('user_rating'), // 1-5 rating
  used_as_final: boolean('used_as_final').default(false),
  effectiveness_score: decimal('effectiveness_score', { precision: 3, scale: 2 }),
  
  // Context Data
  context_data: jsonb('context_data').default(sql`'{}'::jsonb`),
  platform: text('platform'),
  content_category: text('content_category'),
  
  // Learning Metrics
  confidence_score: decimal('confidence_score', { precision: 3, scale: 2 }),
  model_version: text('model_version'),
  
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Analytics summary table for performance tracking
export const analytics_summary = pgTable('analytics_summary', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  
  // Time Period
  period_start: date('period_start').notNull(),
  period_end: date('period_end').notNull(),
  period_type: text('period_type').notNull(), // daily, weekly, monthly, quarterly, yearly
  
  // Metrics
  total_posts: integer('total_posts').default(0),
  total_impressions: bigint('total_impressions', { mode: 'number' }).default(0),
  total_engagement: bigint('total_engagement', { mode: 'number' }).default(0),
  total_clicks: bigint('total_clicks', { mode: 'number' }).default(0),
  total_shares: bigint('total_shares', { mode: 'number' }).default(0),
  
  // Rates
  engagement_rate: decimal('engagement_rate', { precision: 5, scale: 4 }).default('0'),
  click_through_rate: decimal('click_through_rate', { precision: 5, scale: 4 }).default('0'),
  conversion_rate: decimal('conversion_rate', { precision: 5, scale: 4 }).default('0'),
  
  // Platform Breakdown
  platform_metrics: jsonb('platform_metrics').default(sql`'{}'::jsonb`),
  
  // Content Performance
  top_performing_content: jsonb('top_performing_content').default(sql`'{}'::jsonb`),
  content_category_performance: jsonb('content_category_performance').default(sql`'{}'::jsonb`),
  
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Type definitions for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type OAuthToken = typeof oauth_tokens.$inferSelect;
export type NewOAuthToken = typeof oauth_tokens.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type ScheduledPost = typeof scheduled_posts.$inferSelect;
export type NewScheduledPost = typeof scheduled_posts.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type AITrainingData = typeof ai_training_data.$inferSelect;
export type NewAITrainingData = typeof ai_training_data.$inferInsert;
export type AnalyticsSummary = typeof analytics_summary.$inferSelect;
export type NewAnalyticsSummary = typeof analytics_summary.$inferInsert;
