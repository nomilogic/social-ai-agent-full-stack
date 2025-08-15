import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

// Use Supabase PostgreSQL database
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.kdaxthclqiodvetumxpn:Taz9ABMZH0L9TBvb@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

if (!connectionString.includes('pooler.supabase.com')) {
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
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

// Initialize the database tables
export async function initializeDatabase() {
  try {
    // Check if users table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!result.rows[0].exists) {
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

      // Create companies table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          website VARCHAR(255),
          industry VARCHAR(255),
          target_audience TEXT,
          brand_tone VARCHAR(100) DEFAULT 'professional',
          goals TEXT[],
          platforms TEXT[],
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create posts table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          prompt TEXT NOT NULL,
          tags TEXT[],
          campaign_id UUID,
          media_url VARCHAR(255),
          generated_content JSONB,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('Database tables created successfully');
    }

    console.log('Users table exists or was created successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}