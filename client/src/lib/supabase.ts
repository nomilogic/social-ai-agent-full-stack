
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password: string;
          name: string;
          avatar_url: string | null;
          phone: string | null;
          bio: string | null;
          timezone: string;
          language: string;
          plan: string;
          role: string;
          subscription_status: string | null;
          subscription_id: string | null;
          trial_ends_at: string | null;
          plan_limits: any;
          profile_completed: boolean;
          onboarding_completed: boolean;
          setup_step: number;
          preferences: any;
          last_login: string | null;
          total_posts_created: number;
          total_campaigns_created: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password: string;
          name: string;
          avatar_url?: string | null;
          phone?: string | null;
          bio?: string | null;
          timezone?: string;
          language?: string;
          plan?: string;
          role?: string;
          subscription_status?: string | null;
          subscription_id?: string | null;
          trial_ends_at?: string | null;
          plan_limits?: any;
          profile_completed?: boolean;
          onboarding_completed?: boolean;
          setup_step?: number;
          preferences?: any;
          last_login?: string | null;
          total_posts_created?: number;
          total_campaigns_created?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          [key: string]: any;
        };
      };
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          website: string | null;
          industry: string | null;
          description: string | null;
          logo_url: string | null;
          banner_url: string | null;
          target_audience: string | null;
          brand_tone: string;
          brand_voice: string | null;
          brand_colors: any;
          brand_fonts: any;
          goals: string[];
          platforms: string[];
          business_type: string | null;
          company_size: string | null;
          location: string | null;
          content_style_preferences: string | null;
          posting_frequency: string | null;
          content_categories: string[];
          hashtag_strategy: string | null;
          content_themes: string[];
          competitor_analysis: string | null;
          auto_schedule: boolean;
          default_posting_times: any;
          content_approval_required: boolean;
          total_posts: number;
          total_campaigns: number;
          engagement_score: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          [key: string]: any;
        };
        Update: {
          [key: string]: any;
        };
      };
      posts: {
        Row: {
          id: string;
          company_id: string;
          campaign_id: string | null;
          user_id: string;
          prompt: string;
          generated_content: any;
          final_content: string | null;
          media_urls: string[];
          media_types: string[];
          thumbnail_url: string | null;
          tags: string[];
          category: string;
          content_type: string;
          ai_model_used: string | null;
          generation_prompt: string | null;
          generation_settings: any;
          ai_confidence_score: string | null;
          platforms: string[];
          status: string;
          scheduled_for: string | null;
          published_at: string | null;
          platform_post_ids: any;
          publishing_errors: any;
          impressions: number;
          engagement: number;
          clicks: number;
          shares: number;
          comments: number;
          likes: number;
          is_live_content: boolean;
          priority: string;
          approval_status: string;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          [key: string]: any;
        };
        Update: {
          [key: string]: any;
        };
      };
      campaigns: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          name: string;
          description: string | null;
          objective: string | null;
          target_audience: string | null;
          brand_voice: string | null;
          content_themes: string[];
          start_date: string | null;
          end_date: string | null;
          posting_schedule: any;
          platforms: string[];
          content_types: string[];
          hashtags: string[];
          keywords: string[];
          budget: string | null;
          target_metrics: any;
          status: string;
          progress: string;
          total_posts: number;
          published_posts: number;
          scheduled_posts: number;
          draft_posts: number;
          total_impressions: number;
          total_engagement: number;
          total_clicks: number;
          engagement_rate: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          [key: string]: any;
        };
        Update: {
          [key: string]: any;
        };
      };
      scheduled_posts: {
        Row: {
          id: string;
          company_id: string;
          campaign_id: string | null;
          post_id: string | null;
          user_id: string;
          scheduled_date: string;
          scheduled_time: string;
          timezone: string;
          content: string;
          image_url: string | null;
          image_prompt: string | null;
          platforms: string[];
          category: string;
          status: string;
          is_live: boolean;
          reasoning: string | null;
          ai_generated: boolean;
          generation_context: string | null;
          error_message: string | null;
          retry_count: number;
          max_retries: number;
          published_urls: any;
          platform_responses: any;
          expected_reach: number | null;
          actual_reach: number | null;
          engagement_prediction: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          [key: string]: any;
        };
        Update: {
          [key: string]: any;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          priority: string;
          category: string | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
          read: boolean;
          read_at: string | null;
          dismissed: boolean;
          dismissed_at: string | null;
          action_url: string | null;
          action_label: string | null;
          metadata: any;
          scheduled_for: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          [key: string]: any;
        };
        Update: {
          [key: string]: any;
        };
      };
      media: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          filename: string;
          original_name: string;
          file_path: string;
          file_url: string | null;
          mime_type: string;
          file_size: number;
          media_type: string;
          dimensions: any;
          duration: number | null;
          processing_status: string;
          thumbnail_url: string | null;
          compressed_url: string | null;
          is_ai_generated: boolean;
          generation_prompt: string | null;
          ai_model_used: string | null;
          usage_count: number;
          last_used_at: string | null;
          tags: string[];
          folder: string;
          alt_text: string | null;
          caption: string | null;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          [key: string]: any;
        };
        Update: {
          [key: string]: any;
        };
      };
      oauth_tokens: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          platform: string;
          platform_user_id: string | null;
          platform_username: string | null;
          access_token: string;
          refresh_token: string | null;
          expires_at: string | null;
          token_type: string;
          scope: string | null;
          platform_data: any;
          status: string;
          last_used_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          [key: string]: any;
        };
        Update: {
          [key: string]: any;
        };
      };
      ai_training_data: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          training_type: string;
          prompt: string;
          response: string;
          user_rating: number | null;
          used_as_final: boolean;
          effectiveness_score: string | null;
          context_data: any;
          platform: string | null;
          content_category: string | null;
          confidence_score: string | null;
          model_version: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          [key: string]: any;
        };
        Update: {
          [key: string]: any;
        };
      };
      analytics_summary: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          campaign_id: string | null;
          period_start: string;
          period_end: string;
          period_type: string;
          total_posts: number;
          total_impressions: number;
          total_engagement: number;
          total_clicks: number;
          total_shares: number;
          engagement_rate: string;
          click_through_rate: string;
          conversion_rate: string;
          platform_metrics: any;
          top_performing_content: any;
          content_category_performance: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          [key: string]: any;
        };
        Update: {
          [key: string]: any;
        };
      };
    };
  };
}
