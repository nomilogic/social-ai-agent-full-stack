// Using API calls instead of Supabase client
import { CompanyInfo, PostContent, GeneratedPost } from '../types';

// Company operations
export async function saveCompany(companyInfo: CompanyInfo, userId: string) {
  const response = await fetch('/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...companyInfo,
      userId: userId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error saving company:', error);
    throw new Error(error.message || 'Failed to save company');
  }

  const result = await response.json();
  return result.data;
}

export async function getCompanies(userId: string) {
  try {
    const response = await fetch(`/api/companies?userId=${userId}`);

    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching companies:', error);
      throw new Error(error.error || error.message || 'Failed to fetch companies');
    }

    const result = await response.json();
    
    // Ensure we return an array even if data is null/undefined
    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error('Error in getCompanies:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
}

export async function updateCompany(companyId: string, updates: Partial<CompanyInfo>, userId: string) {
  const response = await fetch(`/api/companies/${companyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...updates,
      userId: userId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error updating company:', error);
    throw new Error(error.message || 'Failed to update company');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteCompany(companyId: string, userId: string) {
  const response = await fetch(`/api/companies/${companyId}?userId=${userId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error deleting company:', error);
    throw new Error(error.message || 'Failed to delete company');
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