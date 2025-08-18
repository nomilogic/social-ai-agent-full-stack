/**
 * OAuth Manager Client - React Integration
 * 
 * This client communicates with the centralized OAuth Manager service
 * running on a separate port (typically 5001).
 */

export interface OAuthConnection {
  connected: boolean;
  username?: string;
  profilePicture?: string;
  connectedAt?: number;
  expiresAt?: number;
  scopes?: string[];
  needsRefresh?: boolean;
}

export interface OAuthManagerResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class OAuthManagerClient {
  private baseURL: string;
  private userId?: string;
  private authToken?: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL?: string, options: { userId?: string; authToken?: string; headers?: HeadersInit } = {}) {
    this.baseURL = baseURL || import.meta.env.VITE_APP_URL || 'http://localhost:5000';
    this.userId = options.userId;
    this.authToken = options.authToken;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.userId) {
      this.defaultHeaders['X-User-ID'] = this.userId;
    }

    if (this.authToken) {
      this.defaultHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }
  }

  // Set user ID for all requests
  setUserId(userId: string) {
    this.userId = userId;
    this.defaultHeaders['X-User-ID'] = userId;
  }

  // Set auth token for all requests
  setAuthToken(token: string) {
    this.authToken = token;
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Internal request method
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`OAuth Manager API Error:`, error);
      throw new Error(`OAuth Manager API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get connection status for all platforms
  async getConnectionStatus(userId?: string): Promise<Record<string, OAuthConnection>> {
    const userIdToUse = userId || this.userId;
    if (!userIdToUse) {
      throw new Error('User ID is required');
    }

    return this.request(`/api/oauth/connections/status/${userIdToUse}`);
  }

  // Get connection status for specific platform
  async getPlatformConnection(platform: string, userId?: string): Promise<OAuthConnection> {
    const userIdToUse = userId || this.userId;
    if (!userIdToUse) {
      throw new Error('User ID is required');
    }

    return this.request(`/api/oauth/connections/${platform}/${userIdToUse}`);
  }

  // Start OAuth flow for platform
  async startOAuthFlow(platform: string, options: any = {}): Promise<{ authUrl: string; state: string }> {
    const userIdToUse = this.userId;
    if (!userIdToUse) {
      throw new Error('User ID is required');
    }

    return this.request(`/api/oauth/${platform}/connect`, {
      method: 'POST',
      body: JSON.stringify({ options, userId: userIdToUse })
    });
  }

  // Disconnect platform
  async disconnectPlatform(platform: string): Promise<{ success: boolean }> {
    const userIdToUse = this.userId;
    if (!userIdToUse) {
      throw new Error('User ID is required');
    }

    return this.request(`/api/oauth/${platform}/disconnect`, {
      method: 'POST',
      body: JSON.stringify({ userId: userIdToUse })
    });
  }

  // Check if token exists for platform
  async hasToken(platform: string, userId?: string): Promise<{ success: boolean; data: { hasToken: boolean } }> {
    const userIdToUse = userId || this.userId;
    if (!userIdToUse) {
      throw new Error('User ID is required');
    }

    try {
      return await this.request(`/api/oauth/tokens/${platform}/${userIdToUse}`);
    } catch (error) {
      return { success: false, data: { hasToken: false } };
    }
  }

  // Get bulk connection status for multiple users
  async getBulkConnectionStatus(userIds: string[]): Promise<Record<string, Record<string, OAuthConnection>>> {
    return this.request('/api/connections/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ userIds })
    });
  }

  // Get platform configuration
  async getPlatformConfig(): Promise<any> {
    return this.request('/api/oauth/config/platforms');
  }

  // Health check
  async healthCheck(): Promise<{ success: boolean; status: string; timestamp: string; redis?: string }> {
    return this.request('/api/oauth/health');
  }

  // Get access token for API calls
  async getAccessToken(platform: string, userId?: string): Promise<{ access_token: string }> {
    const userIdToUse = userId || this.userId;
    if (!userIdToUse) {
      throw new Error('User ID is required');
    }

    return this.request(`/api/oauth/tokens/${platform}/${userIdToUse}`);
  }
}

// Create a singleton instance
export const oauthManagerClient = new OAuthManagerClient();
