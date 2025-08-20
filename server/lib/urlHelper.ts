/**
 * Get base URLs for server and frontend based on environment
 */
export function getBaseUrls(): { serverUrl: string; frontendUrl: string } {
  const isProduction = process.env.NODE_ENV === 'production';
  
  let serverUrl: string;
  let frontendUrl: string;
  
  if (isProduction) {
    // Production URLs
    serverUrl = process.env.SERVER_URL || process.env.VITE_APP_URL || 'https://your-api-domain.com';
    frontendUrl = process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || 'https://your-frontend-domain.com';
  } else {
    // Development URLs
    serverUrl = process.env.VITE_APP_URL || 'http://localhost:5000';
    frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
  }
  
  return { serverUrl, frontendUrl };
}

/**
 * Get OAuth redirect URI for a platform
 * This should match exactly what's configured in the platform's developer console
 */
export function getOAuthRedirectUri(platform: string): string {
  const { frontendUrl } = getBaseUrls();
  return `${frontendUrl}/oauth/${platform}/callback`;
}

/**
 * Get OAuth callback URL for server-side handling
 */
export function getOAuthCallbackUrl(platform: string): string {
  const { serverUrl } = getBaseUrls();
  return `${serverUrl}/api/oauth/${platform}/callback`;
}

/**
 * Get platform-specific configuration with correct URLs
 */
export function getPlatformConfig(platform: string) {
  const { serverUrl, frontendUrl } = getBaseUrls();
  
  const configs: Record<string, any> = {
    facebook: {
      client_id: process.env.FACEBOOK_CLIENT_ID || process.env.VITE_FACEBOOK_CLIENT_ID,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET || process.env.VITE_FACEBOOK_CLIENT_SECRET,
      redirect_uri: getOAuthRedirectUri('facebook'),
      scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'business_management', 'public_profile'],
      auth_url: 'https://www.facebook.com/v19.0/dialog/oauth',
      token_url: 'https://graph.facebook.com/v19.0/oauth/access_token',
      api_version: 'v19.0'
    },
    instagram: {
      client_id: process.env.INSTAGRAM_CLIENT_ID || process.env.VITE_INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID || process.env.VITE_FACEBOOK_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET || process.env.VITE_INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_CLIENT_SECRET || process.env.VITE_FACEBOOK_CLIENT_SECRET,
      redirect_uri: getOAuthRedirectUri('instagram'),
      scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights', 'pages_show_list', 'pages_read_engagement'],
      auth_url: 'https://api.instagram.com/oauth/authorize',
      token_url: 'https://api.instagram.com/oauth/access_token'
    },
    linkedin: {
      client_id: process.env.LINKEDIN_CLIENT_ID || process.env.VITE_LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || process.env.VITE_LINKEDIN_CLIENT_SECRET,
      redirect_uri: getOAuthRedirectUri('linkedin'),
      scopes: ['openid', 'profile', 'email', 'w_member_social'],
      auth_url: 'https://www.linkedin.com/oauth/v2/authorization',
      token_url: 'https://www.linkedin.com/oauth/v2/accessToken'
    },
    twitter: {
      client_id: process.env.TWITTER_CLIENT_ID || process.env.VITE_TWITTER_CLIENT_ID,
      client_secret: process.env.TWITTER_CLIENT_SECRET || process.env.VITE_TWITTER_CLIENT_SECRET,
      redirect_uri: getOAuthRedirectUri('twitter'),
      scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      auth_url: 'https://twitter.com/i/oauth2/authorize',
      token_url: 'https://api.twitter.com/2/oauth2/token'
    },
    tiktok: {
      client_id: process.env.TIKTOK_CLIENT_ID || process.env.VITE_TIKTOK_CLIENT_ID,
      client_secret: process.env.TIKTOK_CLIENT_SECRET || process.env.VITE_TIKTOK_CLIENT_SECRET,
      redirect_uri: getOAuthRedirectUri('tiktok'),
      scopes: ['user.info.basic', 'video.upload'],
      auth_url: 'https://www.tiktok.com/v2/auth/authorize',
      token_url: 'https://open.tiktokapis.com/v2/oauth/token'
    },
    youtube: {
      client_id: process.env.YOUTUBE_CLIENT_ID || process.env.VITE_YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET || process.env.VITE_YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET,
      redirect_uri: getOAuthRedirectUri('youtube'),
      scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube'],
      auth_url: 'https://accounts.google.com/o/oauth2/v2/auth',
      token_url: 'https://oauth2.googleapis.com/token'
    }
  };
  
  const config = configs[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  
  // Validate that required credentials are present
  if (!config.client_id || !config.client_secret) {
    throw new Error(`Missing credentials for platform: ${platform}. Please check your environment variables.`);
  }
  
  return config;
}

/**
 * Generate a secure state parameter for OAuth flow
 */
export function generateOAuthState(platform: string, userId: string, additionalData?: any): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const data = { platform, userId, timestamp, ...additionalData };
  
  // In production, you might want to encrypt this or store it in a database
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

/**
 * Parse OAuth state parameter
 */
export function parseOAuthState(state: string): { platform: string; userId: string; timestamp: number; [key: string]: any } | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf-8');
    const data = JSON.parse(decoded);
    
    // Validate state is not too old (10 minutes max)
    if (Date.now() - data.timestamp > 10 * 60 * 1000) {
      throw new Error('OAuth state has expired');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to parse OAuth state:', error);
    return null;
  }
}
