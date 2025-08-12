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
  scope: text('scope'),
  profile_data: jsonb('profile_data'), // Store profile info from the platform
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Companies table
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  website: text('website'),
  industry: text('industry'),
  description: text('description'),
  target_audience: text('target_audience'),
  brand_tone: text('brand_tone').default('professional'),
  goals: text('goals').array().default(sql`'{}'::text[]`),
  platforms: text('platforms').array().default(sql`'{}'::text[]`),
  user_id: uuid('user_id').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Posts table
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  media_url: text('media_url'),
  generated_content: jsonb('generated_content'),
  user_id: uuid('user_id').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Campaigns table
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  objective: text('objective'),
  start_date: date('start_date'),
  end_date: date('end_date'),
  target_audience: text('target_audience'),
  platforms: text('platforms').array().default(sql`'{}'::text[]`),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  status: text('status').default('active'),
  brand_voice: text('brand_voice'),
  keywords: text('keywords').array(),
  hashtags: text('hashtags').array(),
  total_posts: integer('total_posts').default(0),
  published_posts: integer('published_posts').default(0),
  scheduled_posts: integer('scheduled_posts').default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Scheduled posts table
export const scheduled_posts = pgTable('scheduled_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
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
  userId: uuid('user_id').notNull(),
  fileName: text('file_name').notNull(),
  originalName: text('original_name').notNull(),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Type definitions for TypeScript
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