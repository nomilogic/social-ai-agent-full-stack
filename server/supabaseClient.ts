// Server-side Supabase client with service role key for admin operations
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fzdpldiqbcssaqczizjw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Use service role key if available, otherwise fallback to anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
} else {
  console.log('Supabase client initialized with:', supabaseServiceKey ? 'Service Role Key' : 'Anon Key');
}

// Admin client for server-side operations
export const serverSupabaseAnon = createClient(supabaseUrl!, supabaseKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Also export as serverSupabase for backward compatibility
export const serverSupabase = serverSupabaseAnon;
