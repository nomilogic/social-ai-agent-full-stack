import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createOAuthStatesTable() {
  console.log('Creating oauth_states table...');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create oauth_states table for temporary state storage
      CREATE TABLE IF NOT EXISTS oauth_states (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          state TEXT UNIQUE NOT NULL,
          platform TEXT NOT NULL,
          user_id TEXT NOT NULL,
          options TEXT,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
      CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
    `
  });

  if (error) {
    console.error('Error creating table:', error);
    
    // Try direct SQL execution
    console.log('Trying alternative approach...');
    try {
      // Create table using direct query
      const { error: createError } = await supabase
        .from('oauth_states')
        .select('*')
        .limit(1);
        
      if (createError && createError.message.includes('does not exist')) {
        console.log('Table does not exist. Please run the SQL manually in Supabase:');
        console.log(`
CREATE TABLE oauth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL,
    user_id TEXT NOT NULL,
    options TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_oauth_states_state ON oauth_states(state);
CREATE INDEX idx_oauth_states_expires_at ON oauth_states(expires_at);
        `);
      }
    } catch (err) {
      console.error('Alternative approach failed:', err);
    }
  } else {
    console.log('OAuth states table created successfully!');
  }
}

// Test the connection and create table
async function main() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('oauth_tokens')  // Assuming this table exists
      .select('count')
      .limit(1);
      
    if (error) {
      console.log('Connection test result:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
    
    await createOAuthStatesTable();
    
  } catch (error) {
    console.error('Script failed:', error);
  }
}

main();
