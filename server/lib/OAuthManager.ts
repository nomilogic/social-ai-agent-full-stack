import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface OAuthConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  api_version?: string;
}

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

interface ConnectionData {
  platform: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: number;
  scopes: string[];
  userProfile: any;
  connectedAt: number;
  lastRefreshed: number;
}

class OAuthManager {
  private config: Record<string, OAuthConfig>;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.VITE_APP_URL || 'http://localhost:5000';
    
    // Platform configurations
    this.config = {
      facebook: {
        client_id: process.env.VITE_FACEBOOK_CLIENT_ID!,
        client_secret: process.env.VITE_FACEBOOK_CLIENT_SECRET!,
        redirect_uri: `${this.baseUrl}/api/oauth/facebook/callback`,
        scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'business_management', 'public_profile'],
        authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
        api_version: 'v19.0'
      },
      instagram: {
        client_id: process.env.VITE_FACEBOOK_CLIENT_ID!, // Instagram uses Facebook App ID
        client_secret: process.env.VITE_FACEBOOK_CLIENT_SECRET!,
        redirect_uri: `${this.baseUrl}/api/oauth/instagram/callback`,
        scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights', 'pages_show_list', 'pages_read_engagement'],
        authUrl: 'https://api.instagram.com/oauth/authorize',
        tokenUrl: 'https://api.instagram.com/oauth/access_token'
      },
      linkedin: {
        client_id: process.env.VITE_LINKEDIN_CLIENT_ID!,
        client_secret: process.env.VITE_LINKEDIN_CLIENT_SECRET!,
        redirect_uri: `${this.baseUrl}/api/oauth/linkedin/callback`,
        scopes: ['openid', 'profile', 'email', 'w_member_social'],
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken'
      },
      twitter: {
        client_id: process.env.VITE_TWITTER_CLIENT_ID!,
        client_secret: process.env.VITE_TWITTER_CLIENT_SECRET!,
        redirect_uri: `${this.baseUrl}/api/oauth/twitter/callback`,
        scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token'
      },
      tiktok: {
        client_id: process.env.VITE_TIKTOK_CLIENT_ID!,
        client_secret: process.env.VITE_TIKTOK_CLIENT_SECRET!,
        redirect_uri: `${this.baseUrl}/api/oauth/tiktok/callback`,
        scopes: ['user.info.basic', 'video.upload'],
        authUrl: 'https://www.tiktok.com/v2/auth/authorize',
        tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token'
      },
      youtube: {
        client_id: process.env.VITE_YOUTUBE_CLIENT_ID!,
        client_secret: process.env.VITE_YOUTUBE_CLIENT_SECRET!,
        redirect_uri: `${this.baseUrl}/api/oauth/youtube/callback`,
        scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube'],
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token'
      }
    };
  }

  // Generate authorization URL for any platform
  async getAuthURL(platform: string, userId: string, options: any = {}): Promise<{ authUrl: string; state: string }> {
    if (!this.config[platform]) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const config = this.config[platform];
    const state = this.generateState(platform, userId);

    // Store state in Supabase with expiration
    const expiresAt = new Date(Date.now() + 600000); // 10 minutes
    await supabase.from('oauth_states').insert({
      state,
      platform,
      user_id: userId,
      options: JSON.stringify(options),
      expires_at: expiresAt.toISOString()
    });

    const params = new URLSearchParams({
      client_id: config.client_id,
      redirect_uri: config.redirect_uri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state,
      access_type: 'offline',
      prompt: 'consent',
      ...options
    });

    // Platform-specific parameters
    if (platform === 'twitter') {
      params.set('code_challenge', 'challenge');
      params.set('code_challenge_method', 'plain');
    }

    const authUrl = `${config.authUrl}?${params.toString()}`;
    console.log(`Generated auth URL for ${platform}:`, authUrl);
    return { authUrl, state };
  }

  // Handle OAuth callback for any platform
  async handleCallback(platform: string, code: string, state: string, additionalParams: any = {}): Promise<ConnectionData> {
    if (!this.config[platform]) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Validate and get state data from Supabase
    const { data: stateData } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .single();

    if (!stateData) {
      throw new Error('Invalid or expired state parameter');
    }

    // Check state expiration
    if (new Date() > new Date(stateData.expires_at)) {
      throw new Error('OAuth state has expired');
    }

    const { user_id: userId, options } = stateData;

    // Exchange code for tokens
    const tokenData = await this.exchangeCodeForTokens(platform, code, additionalParams);
    
    // Get user profile information
    const userProfile = await this.getUserProfile(platform, tokenData.access_token);
    
    // Store tokens and user data
    const connectionData: ConnectionData = {
      platform,
      userId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
      scopes: tokenData.scope ? tokenData.scope.split(' ') : this.config[platform].scopes,
      userProfile,
      connectedAt: Date.now(),
      lastRefreshed: Date.now()
    };

    await this.storeConnection(userId, platform, connectionData);
    
    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', state);

    console.log(`OAuth connection successful for ${platform}:`, { userId, platform, username: userProfile.username || userProfile.name });
    return connectionData;
  }

  // Exchange authorization code for access token
  private async exchangeCodeForTokens(platform: string, code: string, additionalParams: any = {}): Promise<TokenData> {
    const config = this.config[platform];
    
    const tokenData: any = {
      client_id: config.client_id,
      client_secret: config.client_secret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirect_uri
    };

    // Platform-specific modifications
    if (platform === 'twitter') {
      tokenData.code_verifier = 'challenge';
    }

    try {
      const response = await axios.post(config.tokenUrl, 
        new URLSearchParams(tokenData).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      let tokenResponse = response.data;

      // For Facebook/Instagram, exchange for long-lived token
      if ((platform === 'facebook' || platform === 'instagram') && tokenResponse.access_token) {
        try {
          const longLivedResponse = await axios.get(config.tokenUrl, {
            params: {
              grant_type: 'fb_exchange_token',
              client_id: config.client_id,
              client_secret: config.client_secret,
              fb_exchange_token: tokenResponse.access_token
            }
          });
          
          if (longLivedResponse.data.access_token) {
            tokenResponse = longLivedResponse.data;
          }
        } catch (exchangeError) {
          console.warn('Failed to exchange for long-lived token:', exchangeError);
        }
      }

      return tokenResponse;
    } catch (error) {
      console.error(`Token exchange failed for ${platform}:`, error);
      throw new Error(`Token exchange failed for ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user profile for platform
  private async getUserProfile(platform: string, accessToken: string): Promise<any> {
    try {
      let profileUrl: string;
      let headers: any = {};

      switch (platform) {
        case 'facebook':
          profileUrl = `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture&access_token=${accessToken}`;
          break;
        case 'linkedin':
          profileUrl = 'https://api.linkedin.com/v2/userinfo';
          headers['Authorization'] = `Bearer ${accessToken}`;
          break;
        case 'twitter':
          profileUrl = 'https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url,public_metrics,verified';
          headers['Authorization'] = `Bearer ${accessToken}`;
          break;
        case 'youtube':
          profileUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
          headers['Authorization'] = `Bearer ${accessToken}`;
          break;
        case 'tiktok':
          profileUrl = 'https://open.tiktokapis.com/v2/user/info/';
          headers['Authorization'] = `Bearer ${accessToken}`;
          break;
        default:
          return { id: 'unknown', name: 'Unknown User' };
      }

      const response = await axios.get(profileUrl, { headers });
      
      // Normalize profile data
      const profileData = response.data;
      return {
        id: profileData.id,
        name: profileData.name || profileData.display_name,
        username: profileData.username || profileData.email,
        profile_picture_url: profileData.picture || profileData.profile_image_url || profileData.avatar_url
      };
    } catch (error) {
      console.warn(`Failed to get user profile for ${platform}:`, error);
      return { id: 'unknown', name: 'Unknown User' };
    }
  }

  // Get connection status for user across all platforms
  async getConnectionStatus(userId: string): Promise<Record<string, any>> {
    const { data: connections } = await supabase
      .from('oauth_tokens')
      .select('platform, expires_at, profile_data')
      .eq('user_id', userId);

    const status: Record<string, any> = {};

    // Initialize all platforms as disconnected
    const allPlatforms = Object.keys(this.config);
    allPlatforms.forEach(platform => {
      status[platform] = {
        connected: false,
        expired: false,
        profile: null
      };
    });

    // Update with actual connection status
    connections?.forEach(connection => {
      const isExpired = connection.expires_at ? new Date() > new Date(connection.expires_at) : false;
      status[connection.platform] = {
        connected: !isExpired,
        expired: isExpired,
        profile: connection.profile_data,
        username: connection.profile_data?.username || connection.profile_data?.name
      };
    });

    return status;
  }

  // Get valid access token for platform (with auto-refresh)
  async getAccessToken(userId: string, platform: string): Promise<string> {
    const { data: connection } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (!connection) {
      throw new Error(`No connection found for ${platform}`);
    }

    // Check if token needs refresh
    const needsRefresh = connection.expires_at ? new Date() >= new Date(connection.expires_at - 300000) : false; // 5 min buffer
    
    if (needsRefresh && connection.refresh_token) {
      try {
        const newTokenData = await this.refreshToken(platform, connection.refresh_token);
        
        // Update stored connection
        const updatedConnection = {
          access_token: newTokenData.access_token,
          refresh_token: newTokenData.refresh_token || connection.refresh_token,
          expires_at: newTokenData.expires_in ? new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString() : null,
          updated_at: new Date().toISOString()
        };

        await supabase
          .from('oauth_tokens')
          .update(updatedConnection)
          .eq('user_id', userId)
          .eq('platform', platform);

        console.log(`Token refreshed for ${platform}`);
        return newTokenData.access_token;
      } catch (error) {
        console.error(`Token refresh failed for ${platform}:`, error);
        throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return connection.access_token;
  }

  // Refresh expired token
  private async refreshToken(platform: string, refreshToken: string): Promise<TokenData> {
    const config = this.config[platform];
    
    const refreshData = {
      client_id: config.client_id,
      client_secret: config.client_secret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    };

    const response = await axios.post(config.tokenUrl,
      new URLSearchParams(refreshData).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    return response.data;
  }

  // Disconnect platform for user
  async disconnect(userId: string, platform: string): Promise<boolean> {
    const { data: connection } = await supabase
      .from('oauth_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (connection) {
      // Try to revoke tokens if platform supports it
      try {
        await this.revokeToken(platform, connection.access_token);
      } catch (error) {
        console.warn(`Token revocation failed for ${platform}:`, error);
      }
      
      // Delete from database
      await supabase
        .from('oauth_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('platform', platform);

      console.log(`Platform disconnected:`, { userId, platform });
      return true;
    }
    
    return false;
  }

  // Revoke token (platform-specific)
  private async revokeToken(platform: string, accessToken: string): Promise<void> {
    try {
      switch (platform) {
        case 'facebook':
        case 'instagram':
          await axios.delete(`https://graph.facebook.com/me/permissions?access_token=${accessToken}`);
          break;
        case 'linkedin':
          // LinkedIn doesn't have a revoke endpoint
          break;
        case 'twitter':
          await axios.post('https://api.twitter.com/2/oauth2/revoke', {
            token: accessToken,
            client_id: this.config[platform].client_id
          }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            auth: {
              username: this.config[platform].client_id,
              password: this.config[platform].client_secret
            }
          });
          break;
        case 'youtube':
          await axios.post(`https://oauth2.googleapis.com/revoke?token=${accessToken}`);
          break;
      }
    } catch (error) {
      console.warn(`Token revocation failed for ${platform}:`, error);
      throw error;
    }
  }

  // Store connection data in Supabase
  private async storeConnection(userId: string, platform: string, connectionData: ConnectionData): Promise<void> {
    const connectionRecord = {
      user_id: userId,
      platform,
      access_token: connectionData.accessToken,
      refresh_token: connectionData.refreshToken,
      expires_at: connectionData.expiresAt ? new Date(connectionData.expiresAt).toISOString() : null,
      scope: connectionData.scopes.join(' '),
      profile_data: connectionData.userProfile,
      updated_at: new Date().toISOString()
    };

    // Upsert the connection
    const { error } = await supabase
      .from('oauth_tokens')
      .upsert(connectionRecord, { 
        onConflict: 'user_id,platform'
      });

    if (error) {
      console.error('Failed to store connection:', error);
      throw new Error(`Failed to store connection: ${error.message}`);
    }
  }

  // Generate secure state parameter
  private generateState(platform: string, userId: string): string {
    const data = `${platform}:${userId}:${Date.now()}:${uuidv4()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Check if platform is configured
  isPlatformConfigured(platform: string): boolean {
    const config = this.config[platform];
    return !!(config && config.client_id && config.client_secret);
  }

  // Get all configured platforms
  getConfiguredPlatforms(): string[] {
    return Object.keys(this.config).filter(platform => this.isPlatformConfigured(platform));
  }
}

// Export singleton instance
export const oauthManager = new OAuthManager();
