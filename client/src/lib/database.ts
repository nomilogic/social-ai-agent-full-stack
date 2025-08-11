// Using API calls instead of Supabase client
import { CompanyInfo, PostContent, GeneratedPost } from '../types';
import { supabaseClient } from './supabase'; // Corrected import
import api from './api'; // Assuming 'api' is configured to use Axios or similar for API calls

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
  try {
    const response = await api.post('/posts', {
      companyId,
      prompt: contentData.prompt,
      tags: contentData.tags,
      campaignId: contentData.campaignId,
      generatedContent: generatedPosts,
      userId,
      created_at: new Date().toISOString()
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to save post');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error saving post:', error);
    throw error;
  }
}

export async function getPosts(userId: string, companyId?: string) {
  try {
    const params = new URLSearchParams({ userId });
    if (companyId) params.append('companyId', companyId);

    const response = await api.get(`/posts?${params.toString()}`);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch posts');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

export async function deletePost(postId: string, userId: string) {
  try {
    const response = await api.delete(`/posts/${postId}`, {
      params: { userId }
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete post');
    }

    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// Media upload
export async function uploadMedia(file: File, userId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  const token = localStorage.getItem('auth_token');
  const response = await fetch('/api/media/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error uploading media:', error);
    throw new Error(error.error || 'Failed to upload media');
  }

  const result = await response.json();
  return result.data.url;
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
  try {
    const { data, error } = await supabaseClient.auth.signInAnonymously();

    if (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in signInAnonymously:', error);
    throw error;
  }
}