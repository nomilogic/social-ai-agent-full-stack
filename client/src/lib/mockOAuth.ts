import { Platform } from '../types';

export interface MockOAuthCredentials {
  accessToken: string;
  platform: Platform;
  expiresAt: number;
  userId: string;
}

export class MockOAuthManager {
  private static instance: MockOAuthManager;
  
  static getInstance(): MockOAuthManager {
    if (!MockOAuthManager.instance) {
      MockOAuthManager.instance = new MockOAuthManager();
    }
    return MockOAuthManager.instance;
  }

  // Simulate OAuth connection for demo purposes
  async connectPlatform(platform: Platform, userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate OAuth popup and connection process
      const shouldSuccess = Math.random() > 0.1; // 90% success rate for demo
      
      // Show demo popup
      const confirmed = window.confirm(
        `Demo Mode: Connect to ${platform}?\n\n` +
        `This is a demonstration. In production, this would open the real ${platform} OAuth popup.\n\n` +
        'Click OK to simulate successful connection, Cancel to simulate failure.'
      );

      setTimeout(() => {
        if (confirmed && shouldSuccess) {
          // Store mock credentials
          const credentials: MockOAuthCredentials = {
            accessToken: `mock_token_${platform}_${Date.now()}`,
            platform,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            userId
          };
          
          localStorage.setItem(`mock_oauth_${platform}_${userId}`, JSON.stringify(credentials));
          console.log(`Mock OAuth connection successful for ${platform}`);
          resolve(true);
        } else {
          console.log(`Mock OAuth connection failed for ${platform}`);
          resolve(false);
        }
      }, 1000); // Simulate network delay
    });
  }

  // Check if platform is connected
  async isConnected(platform: Platform, userId: string): Promise<boolean> {
    const stored = localStorage.getItem(`mock_oauth_${platform}_${userId}`);
    if (!stored) return false;

    try {
      const credentials: MockOAuthCredentials = JSON.parse(stored);
      return credentials.expiresAt > Date.now();
    } catch {
      return false;
    }
  }

  // Disconnect platform
  async disconnectPlatform(platform: Platform, userId: string): Promise<void> {
    localStorage.removeItem(`mock_oauth_${platform}_${userId}`);
    console.log(`Disconnected ${platform} for user ${userId}`);
  }

  // Get credentials
  async getCredentials(platform: Platform, userId: string): Promise<MockOAuthCredentials | null> {
    const stored = localStorage.getItem(`mock_oauth_${platform}_${userId}`);
    if (!stored) return null;

    try {
      const credentials: MockOAuthCredentials = JSON.parse(stored);
      if (credentials.expiresAt > Date.now()) {
        return credentials;
      } else {
        // Remove expired credentials
        localStorage.removeItem(`mock_oauth_${platform}_${userId}`);
        return null;
      }
    } catch {
      return null;
    }
  }

  // Simulate publishing to platform
  async publishPost(platform: Platform, userId: string, content: any): Promise<{ success: boolean; message: string; postId?: string }> {
    const credentials = await this.getCredentials(platform, userId);
    if (!credentials) {
      return { success: false, message: `Not connected to ${platform}` };
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    // Simulate success/failure
    const success = Math.random() > 0.2; // 80% success rate
    
    if (success) {
      return {
        success: true,
        message: `Successfully published to ${platform}`,
        postId: `mock_post_${Date.now()}`
      };
    } else {
      return {
        success: false,
        message: `Failed to publish to ${platform}: Simulated API error`
      };
    }
  }
}

export const mockOAuth = MockOAuthManager.getInstance();