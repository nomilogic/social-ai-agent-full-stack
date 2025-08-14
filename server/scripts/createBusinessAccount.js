
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBusinessAccount() {
  try {
    const hashedPassword = await bcrypt.hash('BusinessUser2024!', 10);
    
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: 'nomilogic@gmail.com',
        password: hashedPassword,
        name: 'Nomilogic Business',
        plan: 'business',
        role: 'user',
        subscription_status: 'active',
        profile_completed: true,
        onboarding_completed: true,
        plan_limits: {
          companies: 50,
          posts_per_month: 1000,
          campaigns: 100,
          scheduled_posts: 500,
          ai_generations: 5000,
          social_accounts: 20
        },
        preferences: {
          theme: 'dark',
          notifications: true,
          email_notifications: true,
          push_notifications: true,
          auto_publish: true,
          ai_suggestions: true
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating business account:', error);
    } else {
      console.log('Business account created successfully:', newUser);
    }
  } catch (error) {
    console.error('Error creating business account:', error);
  }
}

createBusinessAccount();
