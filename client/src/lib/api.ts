import axios from 'axios';
import { CompanyInfo, PostContent, GeneratedPost } from '../types';

// Base API configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response wrapper interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Company operations
export const companiesApi = {
  // Get all companies for a user
  async getAll(userId: string): Promise<any[]> {
    const response = await api.get<ApiResponse<any[]>>('/companies', {
      params: { userId }
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch companies');
    }

    return response.data.data || [];
  },

  // Create a new company
  async create(companyInfo: CompanyInfo, userId: string): Promise<any> {
    const response = await api.post<ApiResponse>('/companies', {
      ...companyInfo,
      userId
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create company');
    }

    return response.data.data;
  },

  // Update an existing company
  async update(companyId: string, updates: Partial<CompanyInfo>, userId: string): Promise<any> {
    const response = await api.put<ApiResponse>(`/companies/${companyId}`, {
      ...updates,
      userId
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update company');
    }

    return response.data.data;
  },

  // Delete a company
  async delete(companyId: string, userId: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/companies/${companyId}`, {
      params: { userId }
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete company');
    }
  }
};

// Post operations
export const postsApi = {
  // Get all posts for a user (optionally filtered by company)
  async getAll(userId: string, companyId?: string): Promise<any[]> {
    const params: any = { userId };
    if (companyId) params.companyId = companyId;

    const response = await api.get<ApiResponse<any[]>>('/posts', { params });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch posts');
    }

    return response.data.data || [];
  },

  // Create a new post
  async create(
    companyId: string,
    contentData: PostContent,
    generatedPosts: GeneratedPost[],
    userId: string
  ): Promise<any> {
    const response = await api.post<ApiResponse>('/posts', {
      companyId,
      prompt: contentData.prompt,
      tags: contentData.tags,
      campaignId: contentData.campaignId,
      generatedContent: generatedPosts,
      userId
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create post');
    }

    return response.data.data;
  },

  // Update a post
  async update(
    postId: string,
    updates: {
      prompt?: string;
      tags?: string[];
      campaignId?: string;
      generatedContent?: GeneratedPost[];
    },
    userId: string
  ): Promise<any> {
    const response = await api.put<ApiResponse>(`/posts/${postId}`, {
      ...updates,
      userId
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update post');
    }

    return response.data.data;
  },

  // Delete a post
  async delete(postId: string, userId: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/posts/${postId}`, {
      params: { userId }
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete post');
    }
  },

  // Mark a post as published
  async markPublished(postId: string, publishedPlatforms: string[], userId: string): Promise<any> {
    const response = await api.post<ApiResponse>(`/posts/${postId}/publish`, {
      publishedPlatforms,
      userId
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to mark post as published');
    }

    return response.data.data;
  }
};

// Media operations
export const mediaApi = {
  // Upload a file
  async upload(file: File, userId: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await api.post<ApiResponse<{url: string}>>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to upload file');
    }

    return response.data.data?.url || '';
  },

  // Get all media files for a user
  async getAll(userId: string): Promise<any[]> {
    const response = await api.get<ApiResponse<any[]>>(`/media/${userId}`);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch media files');
    }

    return response.data.data || [];
  },

  // Delete a media file
  async delete(userId: string, fileName: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/media/${userId}/${fileName}`, {
      params: { userId }
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete media file');
    }
  }
};

// AI content generation (using existing route)
export const aiApi = {
  async generateContent(company: any, content: any, platforms: string[]): Promise<any[]> {
    const response = await api.post<ApiResponse<{posts: any[]}>>('/ai/generate', {
      company,
      content,
      platforms
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate content');
    }

    return response.data.data?.posts || [];
  }
};

// Export the main API object
export const apiService = {
  companies: companiesApi,
  posts: postsApi,
  media: mediaApi,
  ai: aiApi
};

// API utility functions
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const url = `${baseUrl}/api${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Default export for compatibility
export default { apiRequest };