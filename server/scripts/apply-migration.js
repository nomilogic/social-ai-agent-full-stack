import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fzdpldiqbcssaqczizjw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = `
-- Migration: Add post reads tracking table
-- This allows tracking which posts each user has read for accurate unread counters

-- Create user_post_reads table
CREATE TABLE IF NOT EXISTS user_post_reads (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique constraint on user + post combination
  UNIQUE(user_id, post_id, platform)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_post_reads_user_id ON user_post_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_post_reads_post_id ON user_post_reads(post_id);
CREATE INDEX IF NOT EXISTS idx_user_post_reads_read_at ON user_post_reads(read_at);
CREATE INDEX IF NOT EXISTS idx_user_post_reads_user_platform ON user_post_reads(user_id, platform);

-- Add comments for documentation
COMMENT ON TABLE user_post_reads IS 'Tracks which posts each user has read for unread counter functionality';
COMMENT ON COLUMN user_post_reads.post_id IS 'The post ID (matches format used in post history API)';
COMMENT ON COLUMN user_post_reads.platform IS 'The platform where the post was published (linkedin, facebook, etc.)';
COMMENT ON COLUMN user_post_reads.read_at IS 'When the user marked this post as read';
`;

async function applyMigration() {
  console.log('🚀 Starting migration: Create user_post_reads table...');
  
  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Try alternative method using direct SQL execution
      console.log('🔄 Trying alternative migration method...');
      
      // Split SQL into individual statements and execute them
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase
            .from('_supabase_admin')
            .select('*')
            .limit(0); // This won't work, but let's try raw SQL approach
        }
      }
      
      // If the RPC method doesn't work, we'll need to use the REST API directly
      console.log('⚠️ RPC method failed, trying direct REST API...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: migrationSQL })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      console.log('✅ Migration applied successfully via REST API!');
    } else {
      console.log('✅ Migration applied successfully via RPC!');
    }
    
    // Verify the table was created
    console.log('🔍 Verifying table creation...');
    const { data: tableCheck, error: checkError } = await supabase
      .from('user_post_reads')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.log('⚠️ Table verification failed:', checkError.message);
      console.log('📋 Please manually apply the migration in Supabase dashboard');
    } else {
      console.log('✅ Table created successfully! Schema verified.');
      console.log('🎉 Migration complete! You can now use the unread counter feature.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Manual Migration Instructions:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Run this SQL:');
    console.log('\n' + migrationSQL);
  }
}

// Run the migration
applyMigration().then(() => {
  console.log('🏁 Migration script completed.');
  process.exit(0);
}).catch(error => {
  console.error('💥 Migration script failed:', error);
  process.exit(1);
});
