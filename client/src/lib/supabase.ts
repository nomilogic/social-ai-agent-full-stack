// Migrated from Supabase to PostgreSQL with Drizzle
// Database operations are now handled server-side via API calls
// Example: Use fetch('/api/companies') instead of supabase.from('companies')

export const supabase = null; // Deprecated - use API calls instead

// Helper function for API calls to replace Supabase client
export const apiClient = {
  from: (table: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: any) => 
        fetch(`/api/${table}?${column}=${value}`).then(res => res.json()),
    }),
    insert: (data: any) =>
      fetch(`/api/${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    update: (data: any) => ({
      eq: (column: string, value: any) =>
        fetch(`/api/${table}/${value}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(res => res.json())
    }),
    delete: () => ({
      eq: (column: string, value: any) =>
        fetch(`/api/${table}/${value}`, { method: 'DELETE' }).then(res => res.json())
    })
  })
};

// Database types
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          website: string | null;
          industry: string | null;
          target_audience: string | null;
          brand_tone: string;
          goals: string[];
          platforms: string[];
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          industry?: string | null;
          target_audience?: string | null;
          brand_tone?: string;
          goals?: string[];
          platforms?: string[];
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website?: string | null;
          industry?: string | null;
          target_audience?: string | null;
          brand_tone?: string;
          goals?: string[];
          platforms?: string[];
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          company_id: string;
          prompt: string;
          tags: string[];
          campaign_id: string | null;
          media_url: string | null;
          generated_content: any;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          prompt: string;
          tags?: string[];
          campaign_id?: string | null;
          media_url?: string | null;
          generated_content?: any;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          prompt?: string;
          tags?: string[];
          campaign_id?: string | null;
          media_url?: string | null;
          generated_content?: any;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}