import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

// Use Supabase PostgreSQL database with pooler
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.fzdpldiqbcssaqczizjw:fultum-2@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

if (!connectionString.includes("pooler.supabase.com")) {
  console.error(`
🚨 Please set up your Supabase DATABASE_URL!

Your DATABASE_URL should look like:
postgresql://postgres.kdaxthclqiodvetumxpn:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres

Get your password from: https://supabase.com/dashboard/project/kdaxthclqiodvetumxpn/settings/database
  `);
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000
});

export const db = drizzle(pool, { schema });

// Initialize the database tables
export async function initializeDatabase() {
  try {
    // Check if users table exists
    const usersTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!usersTableExists.rows[0].exists) {
      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("Users table created successfully");
    } else {
      console.log("Users table already exists.");
    }

    // Check if campaigns table exists
    const campaignsTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'campaigns'
      );
    `);

    if (!campaignsTableExists.rows[0].exists) {
      // Create campaigns table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS campaigns (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          website VARCHAR(255),
          industry VARCHAR(255),
          description TEXT,
          logo_url VARCHAR(255),
          banner_url VARCHAR(255),
          target_audience TEXT,
          brand_tone VARCHAR(100),
          brand_voice VARCHAR(100),
          brand_colors JSONB,
          brand_fonts JSONB,
          goals TEXT[] DEFAULT '{}',
          platforms TEXT[] DEFAULT '{}',
          business_type VARCHAR(100),
          campaign_size VARCHAR(100),
          location VARCHAR(255),
          content_style_preferences TEXT,
          posting_frequency VARCHAR(100),
          content_categories TEXT[] DEFAULT '{}',
          hashtag_strategy TEXT,
          content_themes TEXT[] DEFAULT '{}',
          competitor_analysis TEXT,
          auto_schedule BOOLEAN DEFAULT false,
          default_posting_times JSONB,
          content_approval_required BOOLEAN DEFAULT false,
          total_posts INTEGER DEFAULT 0,
          total_campaigns INTEGER DEFAULT 0,
          engagement_score DECIMAL(10,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          objective VARCHAR(100),
          start_date DATE,
          end_date DATE,
          budget DECIMAL(10,2),
          status VARCHAR(50) DEFAULT 'active',
          keywords TEXT[] DEFAULT '{}',
          hashtags TEXT[] DEFAULT '{}',
          published_posts INTEGER DEFAULT 0,
          scheduled_posts INTEGER DEFAULT 0
        );
      `);
      console.log("Campaigns table created successfully");
    } else {
      console.log("Campaigns table already exists.");
    }

    // Check if posts table exists
    const postsTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'posts'
      );
    `);

    if (!postsTableExists.rows[0].exists) {
      // Create posts table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
          prompt TEXT NOT NULL,
          tags TEXT[] DEFAULT '{}',
          media_url VARCHAR(255),
          generated_content JSONB,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("Posts table created successfully");
    } else {
      console.log("Posts table already exists.");
    }

    console.log("Database initialization complete.");
    return true;
  } catch (error) {
    console.error("Database initialization error:", error);
    return false;
  }
}