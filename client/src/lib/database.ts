// Using API calls instead of Supabase client
import { CompanyInfo, PostContent, GeneratedPost } from '../types';
import { apiRequest } from './api';

// Company operations
export async function saveCompany(companyInfo: CompanyInfo, userId: string) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('/api/companies', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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

export const getCompanies = async (userId: string) => {
  try {
    console.log('Fetching companies for userId:', userId);
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/companies?userId=${userId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    })
    const result = await response.json()

    console.log('Companies API response:', response.status, result);

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch companies')
    }

    return result.data
  } catch (error) {
    console.error('Error fetching companies:', error)
    throw error
  }
}

export async function updateCompany(companyId: string, updates: Partial<CompanyInfo>, userId: string) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/companies/${companyId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/companies/${companyId}?userId=${userId}`, {
    method: 'DELETE',
    headers: { 
      'Authorization': `Bearer ${token}`
    }
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
    const response = await apiRequest('/posts', {
      method: 'POST',
      body: JSON.stringify({
        companyId,
        prompt: contentData.prompt,
        tags: contentData.tags,
        campaignId: contentData.campaignId,
        generatedContent: generatedPosts,
        userId,
        created_at: new Date().toISOString()
      })
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

    const response = await apiRequest(`/posts?${params.toString()}`);

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
    const response = await apiRequest(`/posts/${postId}?userId=${userId}`, {
      method: 'DELETE'
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

    const userData = await response.json();
    return {
      user: userData,
      session: { access_token: token },
      error: null
    };
  } catch (error) {
    console.error('Error initializing auth:', error);
    localStorage.removeItem('auth_token');
    return null;
  }
}

export async function signInAnonymously() {
  try {
    // Import auth service for authentication operations
    const { authService } = await import('./auth');
    return await authService.signInAnonymously();
  } catch (error) {
    console.error('Error in signInAnonymously:', error);
    throw error;
  }
}

// Campaign operations
export async function saveCampaign(campaignData: any, companyId: string, userId: string) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('/api/campaigns', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...campaignData,
      companyId,
      userId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error saving campaign:', error);
    throw new Error(error.message || 'Failed to save campaign');
  }

  const result = await response.json();
  return result.data;
}

export async function getCampaigns(companyId: string, userId: string) {
  try {
    console.log('Fetching campaigns for companyId:', companyId, 'userId:', userId);
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/campaigns?companyId=${companyId}&userId=${userId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();

    console.log('Campaigns API response:', response.status, result);

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch campaigns');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

export async function updateCampaign(campaignId: string, updates: any, userId: string) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/campaigns/${campaignId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...updates,
      userId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error updating campaign:', error);
    throw new Error(error.message || 'Failed to update campaign');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteCampaign(campaignId: string, userId: string) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/campaigns/${campaignId}?userId=${userId}`, {
    method: 'DELETE',
    headers: { 
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error deleting campaign:', error);
    throw new Error(error.message || 'Failed to delete campaign');
  }
}