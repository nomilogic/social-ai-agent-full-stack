import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

// Create Supabase client for auth operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Extract PostgreSQL connection string from Supabase URL
// Convert supabase URL to direct postgres connection
const postgresUrl = supabaseUrl.replace('https://', 'postgresql://postgres:[YOUR-PASSWORD]@')
  .replace('.supabase.co', '.supabase.co:5432')
  + '/postgres';

// For direct database access with Drizzle, we need the DATABASE_URL or construct it
const databaseUrl = process.env.DATABASE_URL || postgresUrl;

// Create PostgreSQL connection for Drizzle
const client = postgres(databaseUrl);

// Create Drizzle database instance
export const db = drizzle(client);

export default supabase;