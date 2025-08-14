
import { pgTable, uuid, text, timestamp, boolean, jsonb, decimal, integer, date, time, pgView } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table with enhanced features
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('free'), // free, ipro, business
  role: text('role').notNull().default('user'), // user, admin, moderator
  subscription_status: text('subscription_status').default('inactive'), // active, inactive, cancelled, past_due
  subscription_id: text('subscription_id'),
  trial_ends_at: timestamp('trial_ends_at', { withTimezone: true }),
  profile_picture: text('profile_picture'),
  timezone: text('timezone').default('UTC'),
  language: text('language').default('en'),
  notification_preferences: jsonb('notification_preferences').default(sql`'{}'::jsonb`),
  onboarding_completed: boolean('onboarding_completed').default(false),
  last_login: timestamp('last_login', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Enhanced OAuth tokens table
export const oauth_tokens = pgTable('oauth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(), // 'linkedin', 'facebook', 'twitter', 'instagram', 'tiktok', 'youtube'
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token'),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  token_type: text('token_type'),
  scope: text('scope'),
  profile_data: jsonb('profile_data'),
  account_id: text('account_id'), // Platform-specific account ID
  account_name: text('account_name'), // Display name/username
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Enhanced Companies/Profiles table
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type').default('business'), // business, personal, brand
  website: text('website'),
  industry: text('industry'),
  description: text('description'),
  target_audience: text('target_audience'),
  brand_tone: text('brand_tone').default('professional'),
  brand_voice: text('brand_voice'),
  goals: text('goals').array().default(sql`'{}'::text[]`),
  platforms: text('platforms').array().default(sql`'{}'::text[]`),
  logo_url: text('logo_url'),
  cover_image_url: text('cover_image_url'),
  brand_colors: jsonb('brand_colors').default(sql`'{}'::jsonb`),
  content_guidelines: text('content_guidelines'),
  hashtags: text('hashtags').array().default(sql`'{}'::text[]`),
  keywords: text('keywords').array().default(sql`'{}'::text[]`),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Enhanced Posts table
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  title: text('title'),
  prompt: text('prompt').notNull(),
  content: text('content'),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  hashtags: text('hashtags').array().default(sql`'{}'::text[]`),
  media_urls: text('media_urls').array().default(sql`'{}'::text[]`),
  media_type: text('media_type'), // image, video, carousel, story
  platforms: text('platforms').array().default(sql`'{}'::text[]`),
  generated_content: jsonb('generated_content'),
  ai_model_used: text('ai_model_used'),
  status: text('status').default('draft'), // draft, scheduled, published, failed
  performance_metrics: jsonb('performance_metrics').default(sql`'{}'::jsonb`),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Enhanced Campaigns table
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').default('marketing'), // marketing, awareness, engagement, conversion
  objective: text('objective'),
  start_date: date('start_date'),
  end_date: date('end_date'),
  target_audience: text('target_audience'),
  platforms: text('platforms').array().default(sql`'{}'::text[]`),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  status: text('status').default('active'), // active, paused, completed, draft
  priority: text('priority').default('medium'), // low, medium, high, urgent
  brand_voice: text('brand_voice'),
  keywords: text('keywords').array(),
  hashtags: text('hashtags').array(),
  content_themes: text('content_themes').array(),
  posting_schedule: jsonb('posting_schedule').default(sql`'{}'::jsonb`),
  total_posts: integer('total_posts').default(0),
  published_posts: integer('published_posts').default(0),
  scheduled_posts: integer('scheduled_posts').default(0),
  performance_metrics: jsonb('performance_metrics').default(sql`'{}'::jsonb`),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Enhanced Scheduled posts table
export const scheduled_posts = pgTable('scheduled_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  post_id: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  scheduled_date: timestamp('scheduled_date', { withTimezone: true }).notNull(),
  content: text('content').notNull(),
  media_urls: text('media_urls').array().default(sql`'{}'::text[]`),
  platforms: text('platforms').array().default(sql`'{}'::text[]`),
  platform_specific_content: jsonb('platform_specific_content').default(sql`'{}'::jsonb`),
  category: text('category').default('General'),
  priority: text('priority').default('normal'), // low, normal, high
  status: text('status').default('scheduled'), // scheduled, publishing, published, failed, cancelled
  auto_publish: boolean('auto_publish').default(true),
  approval_required: boolean('approval_required').default(false),
  approved_by: uuid('approved_by').references(() => users.id),
  approved_at: timestamp('approved_at', { withTimezone: true }),
  published_at: timestamp('published_at', { withTimezone: true }),
  reasoning: text('reasoning'),
  error_message: text('error_message'),
  retry_count: integer('retry_count').default(0),
  published_urls: jsonb('published_urls'),
  performance_data: jsonb('performance_data').default(sql`'{}'::jsonb`),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Analytics table
export const analytics = pgTable('analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  post_id: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  metric_type: text('metric_type').notNull(), // impressions, engagement, clicks, shares, etc.
  metric_value: decimal('metric_value', { precision: 15, scale: 2 }),
  date: date('date').notNull(),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// AI Training data table
export const ai_training_data = pgTable('ai_training_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  content_type: text('content_type').notNull(), // prompt, response, feedback
  input_data: text('input_data'),
  output_data: text('output_data'),
  feedback_score: integer('feedback_score'), // 1-5 rating
  feedback_text: text('feedback_text'),
  ai_model: text('ai_model'),
  performance_metrics: jsonb('performance_metrics').default(sql`'{}'::jsonb`),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Content templates table
export const content_templates = pgTable('content_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'), // promotional, educational, entertainment, etc.
  template_content: text('template_content').notNull(),
  variables: jsonb('variables').default(sql`'{}'::jsonb`), // placeholder variables
  platforms: text('platforms').array().default(sql`'{}'::text[]`),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  usage_count: integer('usage_count').default(0),
  is_public: boolean('is_public').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Enhanced Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // info, success, warning, error, system
  category: text('category'), // post_published, campaign_completed, system_update, etc.
  priority: text('priority').default('normal'), // low, normal, high, urgent
  read: boolean('read').default(false),
  read_at: timestamp('read_at', { withTimezone: true }),
  action_url: text('action_url'),
  action_label: text('action_label'),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Enhanced Media table
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  originalName: text('original_name').notNull(),
  filePath: text('file_path').notNull(),
  fileUrl: text('file_url'),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  dimensions: jsonb('dimensions'), // width, height for images/videos
  duration: integer('duration'), // for videos/audio in seconds
  category: text('category'), // profile, post, campaign, template
  tags: text('tags').array().default(sql`'{}'::text[]`),
  alt_text: text('alt_text'), // accessibility
  usage_count: integer('usage_count').default(0),
  is_public: boolean('is_public').default(false),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// User preferences table
export const user_preferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  theme: text('theme').default('ai-revolution'),
  dashboard_layout: jsonb('dashboard_layout').default(sql`'{}'::jsonb`),
  notification_settings: jsonb('notification_settings').default(sql`'{}'::jsonb`),
  auto_publish_settings: jsonb('auto_publish_settings').default(sql`'{}'::jsonb`),
  ai_preferences: jsonb('ai_preferences').default(sql`'{}'::jsonb`),
  content_preferences: jsonb('content_preferences').default(sql`'{}'::jsonb`),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type ScheduledPost = typeof scheduled_posts.$inferSelect;
export type NewScheduledPost = typeof scheduled_posts.$inferInsert;
export type OAuthToken = typeof oauth_tokens.$inferSelect;
export type NewOAuthToken = typeof oauth_tokens.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
export type NewAnalytics = typeof analytics.$inferInsert;
export type AITrainingData = typeof ai_training_data.$inferSelect;
export type NewAITrainingData = typeof ai_training_data.$inferInsert;
export type ContentTemplate = typeof content_templates.$inferSelect;
export type NewContentTemplate = typeof content_templates.$inferInsert;
export type UserPreferences = typeof user_preferences.$inferSelect;
export type NewUserPreferences = typeof user_preferences.$inferInsert;
