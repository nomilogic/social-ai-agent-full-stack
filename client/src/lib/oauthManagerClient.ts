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
    // Normalize base URL by removing trailing slash
    console.log('OAuth Manager Base URL:', import.meta.env.VITE_APP_URL, baseURL);
    const rawBaseURL = baseURL || import.meta.env.VITE_APP_URL || 'http://localhost:5000';
    this.baseURL = rawBaseURL.endsWith('/') ? rawBaseURL.slice(0, -1) : rawBaseURL;
    this.userId = options.userId;
    this.authToken = options.authToken || localStorage.getItem('auth_token') || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.authToken) {
      this.defaultHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }
  }

  // Set user ID (for backwards compatibility, but JWT auth is preferred)
  setUserId(userId: string) {
    this.userId = userId;
    // Don't set X-User-ID header anymore as we use JWT authentication
  }

  // Set auth token for all requests
  setAuthToken(token: string) {
    this.authToken = token;
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Ensure we have a valid auth token
  private ensureAuthenticated() {
    const token = this.authToken || localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication token required. Please log in.');
    }
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
  async getConnectionStatus(): Promise<Record<string, OAuthConnection>> {
    this.ensureAuthenticated();
    return this.request(`/api/oauth/connections/status`);
  }

  // Get connection status for specific platform
  async getPlatformConnection(platform: string): Promise<OAuthConnection> {
    this.ensureAuthenticated();
    return this.request(`/api/oauth/connections/${platform}`);
  }

  // Start OAuth flow for platform
  async startOAuthFlow(platform: string, options: any = {}): Promise<{ authUrl: string; state: string }> {
    this.ensureAuthenticated();
    return this.request(`/api/oauth/${platform}/connect`, {
      method: 'POST',
      body: JSON.stringify({ options })
    });
  }

  // Disconnect platform
  async disconnectPlatform(platform: string): Promise<{ success: boolean }> {
    this.ensureAuthenticated();
    return this.request(`/api/oauth/${platform}/disconnect`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  // Check if token exists for platform
  async hasToken(platform: string): Promise<{ success: boolean; data: { hasToken: boolean } }> {
    try {
      this.ensureAuthenticated();
      return await this.request(`/api/oauth/tokens/${platform}`);
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
  async getAccessToken(platform: string): Promise<{ access_token: string }> {
    this.ensureAuthenticated();
    return this.request(`/api/oauth/tokens/${platform}`);
  }

  // Handle OAuth callback
  async handleCallback(platform: string, code: string, state: string): Promise<any> {
    try {
      // Make a POST request to the platform-specific access token endpoint
      const response = await fetch(`${this.baseURL}/api/${platform}/access-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.defaultHeaders
        },
        body: JSON.stringify({
          code,
          state,
          redirect_uri: `${window.location.origin}/oauth/${platform}/callback`,
          user_id: this.userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const tokenData = await response.json();
      
      // Return connection data compatible with the UI expectations
      return {
        platform,
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        refreshToken: tokenData.refresh_token,
        userProfile: {
          username: tokenData.username,
          name: tokenData.name,
          profile_picture_url: tokenData.profile_picture_url
        },
        connectedAt: Date.now()
      };
    } catch (error) {
      console.error(`OAuth callback error for ${platform}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
export const oauthManagerClient = new OAuthManagerClient();
