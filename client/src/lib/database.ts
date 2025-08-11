// Using API calls instead of Supabase client
import { CompanyInfo, PostContent, GeneratedPost } from '../types';

// Company operations
export async function saveCompany(companyInfo: CompanyInfo, userId: string) {
  const response = await fetch('/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...companyInfo,
      user_id: userId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error saving company:', error);
    throw new Error(error.message || 'Failed to save company');
  }

  return response.json();
}

export async function getCompanies(userId: string) {
  const response = await fetch(`/api/companies?user_id=${userId}`);

  if (!response.ok) {
    const error = await response.json();
    console.error('Error fetching companies:', error);
    throw new Error(error.message || 'Failed to fetch companies');
  }

  return response.json();
}

export async function updateCompany(companyId: string, updates: Partial<CompanyInfo>, userId: string) {
  const { data, error } = await supabase
    .from('companies')
    .update({
      name: updates.name,
      website: updates.website,
      industry: updates.industry,
      target_audience: updates.targetAudience,
      brand_tone: updates.brandTone,
      goals: updates.goals,
      platforms: updates.platforms,
      updated_at: new Date().toISOString()
    })
    .eq('id', companyId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    throw error;
  }

  return data;
}

export async function deleteCompany(companyId: string, userId: string) {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
}

// Post operations
export async function savePost(
  companyId: string,
  contentData: PostContent,
  generatedPosts: GeneratedPost[],
  userId: string
) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      company_id: companyId,
      prompt: contentData.prompt,
      tags: contentData.tags,
      campaign_id: contentData.campaignId,
      generated_content: generatedPosts,
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving post:', error);
    throw error;
  }

  return data;
}

export async function getPosts(userId: string, companyId?: string) {
  let query = supabase
    .from('posts')
    .select(`
      *,
      companies (
        name,
        brand_tone
      )
    `)
    .eq('user_id', userId);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }

  return data;
}

export async function deletePost(postId: string, userId: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// Media upload
export async function uploadMedia(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('media')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading media:', error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(fileName);

  return publicUrl;
}

// Authentication helpers
export async function getCurrentUser() {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      localStorage.removeItem('auth_token');
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error initializing auth:', error);
    // Return a default user structure to prevent app crashes
    return { 
      user: null, 
      session: null,
      error: error instanceof Error ? error.message : 'Auth initialization failed'
    };
  }
}

export async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }

  return data;
}