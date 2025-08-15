import { createClient } from '@supabase/supabase-js';

// Supabase configuration for database operations only
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceRoleKey
  });
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

// Create Supabase client for database operations (using service role key for full access)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export { supabase as db };
export default supabase;