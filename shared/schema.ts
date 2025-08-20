import { pgTable, uuid, text, timestamp, boolean, jsonb, decimal, integer, date, time, pgView } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// OAuth tokens table
export const oauth_tokens = pgTable('oauth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(), // 'linkedin', 'facebook', 'twitter', etc.
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token'),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  token_type: text('token_type'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Campaigns table (renamed from companies with merged campaign fields)
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  name: text('name').notNull(),
  website: text('website'),
  industry: text('industry'),
  description: text('description'),
  logo_url: text('logo_url'),
  banner_url: text('banner_url'),
  target_audience: text('target_audience'),
  brand_tone: text('brand_tone'),
  brand_voice: text('brand_voice'),
  brand_colors: jsonb('brand_colors'),
  brand_fonts: jsonb('brand_fonts'),
  goals: text('goals').array(),
  platforms: text('platforms').array(),
  business_type: text('business_type'),
  company_size: text('company_size'),
  location: text('location'),
  content_style_preferences: text('content_style_preferences'),
  posting_frequency: text('posting_frequency'),
  content_categories: text('content_categories').array(),
  hashtag_strategy: text('hashtag_strategy'),
  content_themes: text('content_themes').array(),
  competitor_analysis: text('competitor_analysis'),
  auto_schedule: boolean('auto_schedule'),
  default_posting_times: jsonb('default_posting_times'),
  content_approval_required: boolean('content_approval_required'),
  total_posts: integer('total_posts'),
  total_campaigns: integer('total_campaigns'),
  engagement_score: decimal('engagement_score'),
  created_at: timestamp('created_at', { withTimezone: true }),
  updated_at: timestamp('updated_at', { withTimezone: true }),
  // Merged campaign-specific fields
  objective: text('objective'),
  start_date: date('start_date'),
  end_date: date('end_date'),
  budget: decimal('budget'),
  status: text('status'),
  keywords: text('keywords').array(),
  hashtags: text('hashtags').array(),
  published_posts: integer('published_posts'),
  scheduled_posts: integer('scheduled_posts'),
});

// Posts table
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaign_id: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  media_url: text('media_url'),
  generated_content: jsonb('generated_content'),
  user_id: uuid('user_id').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Profiles table (for user profiles/brands)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().default('individual'), // 'individual' | 'business'
  industry: text('industry'),
  description: text('description'),
  tone: text('tone'),
  target_audience: text('target_audience'),
  plan: text('plan').notNull().default('free'), // 'free' | 'ipro' | 'business'
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});


// Scheduled posts table
export const scheduled_posts = pgTable('scheduled_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  time: time('time').notNull(),
  content: text('content').notNull(),
  image_url: text('image_url'),
  image_prompt: text('image_prompt'),
  platforms: text('platforms').array().default(sql`'{}'::text[]`),
  category: text('category').default('General'),
  status: text('status').default('scheduled'),
  is_live: boolean('is_live').default(false),
  reasoning: text('reasoning'),
  error_message: text('error_message'),
  published_urls: jsonb('published_urls'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});



// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  read: boolean('read').default(false),
  read_at: timestamp('read_at', { withTimezone: true }),
  action_url: text('action_url'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Media table
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  company_id: uuid('company_id'),
  filename: text('filename').notNull(),
  original_name: text('original_name').notNull(),
  file_path: text('file_path').notNull(),
  file_url: text('file_url'),
  mime_type: text('mime_type').notNull(),
  file_size: integer('file_size').notNull(),
  media_type: text('media_type').notNull(),
  dimensions: jsonb('dimensions'),
  duration: integer('duration'),
  processing_status: text('processing_status').default('completed'),
  thumbnail_url: text('thumbnail_url'),
  compressed_url: text('compressed_url'),
  is_ai_generated: boolean('is_ai_generated').default(false),
  generation_prompt: text('generation_prompt'),
  ai_model_used: text('ai_model_used'),
  usage_count: integer('usage_count').default(0),
  last_used_at: timestamp('last_used_at', { withTimezone: true }),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  folder: text('folder').default('general'),
  alt_text: text('alt_text'),
  caption: text('caption'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// OAuth states table
export const oauth_states = pgTable('oauth_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  state: text('state').notNull().unique(),
  platform: text('platform').notNull(),
  user_id: uuid('user_id').notNull(),
  options: jsonb('options').default(sql`'{}'::jsonb`),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
});

// Type definitions for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type ScheduledPost = typeof scheduled_posts.$inferSelect;
export type NewScheduledPost = typeof scheduled_posts.$inferInsert;
export type OAuthToken = typeof oauth_tokens.$inferSelect;
export type NewOAuthToken = typeof oauth_tokens.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type OAuthState = typeof oauth_states.$inferSelect;
export type NewOAuthState = typeof oauth_states.$inferInsert;
