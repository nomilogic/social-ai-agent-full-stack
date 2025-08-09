import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
}

export const serverSupabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Alternative client with anon key for less privileged operations
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
export const serverSupabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
