/**
 * Server-side OAuth Manager Client
 */

interface OAuthConnection {
  connected: boolean;
  username?: string;
  profilePicture?: string;
  connectedAt?: number;
  expiresAt?: number;
  scopes?: string[];
  needsRefresh?: boolean;
}

class OAuthManagerClient {
  private baseURL: string;
  private userId?: string;
  private authToken?: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL?: string, options: { userId?: string; authToken?: string; headers?: Record<string, string> } = {}) {
    this.baseURL = baseURL || process.env.VITE_OAUTH_MANAGER_URL || 'http://localhost:5001';
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

    return this.request(`/api/connections/status/${userIdToUse}`);
  }

  // Get connection status for specific platform
  async getPlatformConnection(platform: string, userId?: string): Promise<OAuthConnection> {
    const userIdToUse = userId || this.userId;
    if (!userIdToUse) {
      throw new Error('User ID is required');
    }

    return this.request(`/api/connections/${platform}/${userIdToUse}`);
  }

  // Disconnect platform
  async disconnectPlatform(platform: string): Promise<{ success: boolean }> {
    const userIdToUse = this.userId;
    if (!userIdToUse) {
      throw new Error('User ID is required');
    }

    return this.request(`/api/auth/${platform}/disconnect`, {
      method: 'POST'
    });
  }

  // Health check
  async healthCheck(): Promise<{ success: boolean; status: string; timestamp: string; redis?: string }> {
    return this.request('/health');
  }

  // Get access token for API calls
  async getAccessToken(platform: string, userId?: string): Promise<{ access_token: string }> {
    const userIdToUse = userId || this.userId;
    if (!userIdToUse) {
      throw new Error('User ID is required');
    }

    return this.request(`/api/tokens/${platform}/${userIdToUse}`);
  }

  // Create a new client instance
  createClient(options?: { userId?: string; authToken?: string }): OAuthManagerClient {
    return new OAuthManagerClient(this.baseURL, {
      userId: options?.userId || this.userId,
      authToken: options?.authToken || this.authToken,
      headers: this.defaultHeaders
    });
  }
}

// Create and export singleton instance
export const oauthManagerClient = new OAuthManagerClient();
