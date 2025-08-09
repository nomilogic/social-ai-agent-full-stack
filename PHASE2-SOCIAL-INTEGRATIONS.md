# Phase 2: Complete Social Media Platform Integrations

## Overview

Phase 2 of the Social Agent AI project focuses on comprehensive social media platform integrations, providing full OAuth authentication flows and posting capabilities for all major social media platforms.

## 🚀 New Features

### Supported Platforms

#### LinkedIn
- ✅ Professional posts with text and images
- ✅ Personal profile access and validation
- ✅ OAuth 2.0 flow with proper scopes
- ✅ Token refresh mechanism

#### Facebook
- ✅ Page management and posting
- ✅ Personal profile and page selection
- ✅ Image and text posts
- ✅ Long-lived token exchange

#### Instagram
- ✅ Business account integration
- ✅ Single image posts
- ✅ Carousel posts (multiple images)
- ✅ Automatic business account discovery

#### Twitter/X
- ✅ Tweet creation with text and images
- ✅ Thread creation for long-form content
- ✅ Media upload and attachment
- ✅ API v2 integration with proper authentication

#### TikTok
- ✅ Video upload workflow
- ✅ Content publishing with metadata
- ✅ Upload status tracking
- ✅ User profile access

#### YouTube
- ✅ Video upload with resumable uploads
- ✅ Channel management
- ✅ Video metadata and privacy settings
- ✅ Upload status monitoring

## 🔧 Technical Architecture

### Server-Side Components

#### API Routes Structure
```
/api/
├── oauth/               # Universal OAuth management
├── social/             # Centralized social router
├── facebook/           # Facebook-specific endpoints
├── instagram/          # Instagram business account endpoints
├── twitter/            # Twitter API v2 endpoints
├── tiktok/             # TikTok content creation endpoints
├── youtube/            # YouTube upload and management endpoints
└── linkedin/           # LinkedIn professional endpoints
```

#### Key Server Files
- `server/src/routes/facebook.ts` - Facebook Graph API integration
- `server/src/routes/instagram.ts` - Instagram Business API
- `server/src/routes/twitter.ts` - Twitter API v2 with media upload
- `server/src/routes/tiktok.ts` - TikTok Creator API
- `server/src/routes/youtube.ts` - YouTube Data API v3
- `server/src/routes/oauth-enhanced.ts` - Universal OAuth handler
- `server/src/routes/social.ts` - Unified social media router

### Client-Side Components

#### Enhanced Services
- `client/src/lib/socialMediaApi.ts` - Centralized API service
- `client/src/lib/oauth.ts` - OAuth management (existing)
- `client/src/lib/socialPoster.ts` - Legacy posting service

#### UI Components
- `client/src/components/SocialMediaManager.tsx` - New comprehensive connection manager
- `client/src/components/OAuthManager.tsx` - Legacy OAuth component
- `client/src/components/PublishPosts.tsx` - Enhanced publishing interface

## 🔐 OAuth Configuration

### Environment Variables Required

```env
# LinkedIn OAuth
VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
VITE_LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Facebook/Meta OAuth (also used for Instagram)
VITE_FACEBOOK_CLIENT_ID=your_facebook_client_id
VITE_FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

# Twitter/X OAuth (API v2)
VITE_TWITTER_CLIENT_ID=your_twitter_client_id
VITE_TWITTER_CLIENT_SECRET=your_twitter_client_secret
VITE_TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# TikTok OAuth
VITE_TIKTOK_CLIENT_ID=your_tiktok_client_id
VITE_TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# YouTube/Google OAuth
VITE_YOUTUBE_CLIENT_ID=your_youtube_client_id
VITE_YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
VITE_GOOGLE_API_KEY=your_google_api_key

# Instagram (uses Facebook OAuth but separate business account)
VITE_INSTAGRAM_CLIENT_ID=your_facebook_client_id
VITE_INSTAGRAM_CLIENT_SECRET=your_facebook_client_secret

# App URLs
VITE_APP_URL=http://localhost:5173
FRONTEND_URL=https://your-domain.com
```

### OAuth Redirect URIs

Each platform requires specific redirect URIs to be configured:

- **LinkedIn**: `http://localhost:5173/oauth/linkedin/callback`
- **Facebook**: `http://localhost:5173/oauth/facebook/callback`
- **Instagram**: `http://localhost:5173/oauth/instagram/callback`
- **Twitter**: `http://localhost:5173/oauth/twitter/callback`
- **TikTok**: `http://localhost:5173/oauth/tiktok/callback`
- **YouTube**: `http://localhost:5173/oauth/youtube/callback`

## 📱 Platform-Specific Setup

### LinkedIn
1. Create app at [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Configure OAuth redirect URI
3. Request required permissions:
   - `openid`
   - `profile`
   - `email`
   - `w_member_social`

### Facebook & Instagram
1. Create app at [Facebook Developer Portal](https://developers.facebook.com/)
2. Add Facebook Login product
3. Configure OAuth redirect URI
4. Request permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`

### Twitter/X
1. Create app at [Twitter Developer Portal](https://developer.twitter.com/)
2. Enable OAuth 2.0 with PKCE
3. Configure redirect URI
4. Request scopes:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access`

### TikTok
1. Apply at [TikTok Developer Portal](https://developers.tiktok.com/)
2. Create app and get approval
3. Configure webhook and redirect URI
4. Request scopes:
   - `user.info.basic`
   - `video.upload`

### YouTube
1. Create project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Configure redirect URI
5. Request scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube`

## 🎯 Usage Examples

### Basic Platform Connection
```typescript
import { socialMediaAPI } from '../lib/socialMediaApi';

// Connect to a platform
const connectPlatform = async (platform: Platform, userId: string) => {
  try {
    const authUrl = await socialMediaAPI.initiateOAuth(platform, userId);
    window.open(authUrl, '_blank');
  } catch (error) {
    console.error('Connection failed:', error);
  }
};
```

### Publishing Content
```typescript
// Post to all connected platforms
const publishToAll = async (posts: GeneratedPost[], accessTokens: Record<Platform, string>) => {
  const results = await socialMediaAPI.postToAllPlatforms(
    userId,
    posts,
    accessTokens,
    (platform, status) => {
      console.log(`${platform}: ${status}`);
    }
  );
  
  return results;
};
```

### Platform-Specific Posting
```typescript
// Post to LinkedIn specifically
const postToLinkedIn = async (accessToken: string, post: GeneratedPost) => {
  try {
    const result = await socialMediaAPI.postToLinkedIn(accessToken, post);
    console.log('LinkedIn post created:', result.postId);
  } catch (error) {
    console.error('LinkedIn post failed:', error);
  }
};
```

## 🔄 API Endpoints

### OAuth Management
- `GET /api/oauth/:platform` - Initiate OAuth flow
- `POST /api/oauth/:platform/callback` - Handle OAuth callback
- `POST /api/oauth/:platform/refresh` - Refresh access token
- `GET /api/oauth/:platform/validate` - Validate access token

### Platform-Specific Endpoints

#### Facebook
- `GET /api/facebook/pages` - Get user's Facebook pages
- `POST /api/facebook/post` - Create Facebook post
- `GET /api/facebook/me` - Get Facebook profile

#### Instagram
- `GET /api/instagram/business-accounts` - Get Instagram business accounts
- `POST /api/instagram/post` - Create Instagram post
- `POST /api/instagram/carousel` - Create carousel post

#### Twitter
- `GET /api/twitter/me` - Get Twitter profile
- `POST /api/twitter/post` - Create tweet
- `POST /api/twitter/thread` - Create tweet thread

#### TikTok
- `GET /api/tiktok/me` - Get TikTok profile
- `POST /api/tiktok/upload-init` - Initialize video upload
- `POST /api/tiktok/upload-video` - Upload video file
- `GET /api/tiktok/publish-status` - Check publish status

#### YouTube
- `GET /api/youtube/channels` - Get YouTube channels
- `GET /api/youtube/me` - Get YouTube profile
- `POST /api/youtube/upload-init` - Initialize video upload
- `POST /api/youtube/upload-video` - Upload video file

## 🎨 UI Components

### SocialMediaManager Component
- Grid layout with platform cards
- Real-time connection status
- Platform-specific icons and colors
- Feature tags for each platform
- One-click connection and disconnection

### Features
- **Connection Management**: Easy connect/disconnect for all platforms
- **Profile Display**: Shows connected account information
- **Status Indicators**: Visual feedback for connection status
- **Error Handling**: Clear error messages and retry options
- **Responsive Design**: Works on desktop and mobile

## 🔍 Testing

### Development Testing
1. Set up development OAuth apps for each platform
2. Configure localhost redirect URIs
3. Test OAuth flows in development environment
4. Verify posting functionality with test content

### Production Deployment
1. Update OAuth redirect URIs for production domain
2. Configure production environment variables
3. Test OAuth flows in production environment
4. Monitor API usage and rate limits

## 📊 Rate Limits & Best Practices

### Platform-Specific Limits
- **LinkedIn**: 500 requests per person per day
- **Facebook**: 200 calls per hour per user
- **Instagram**: Tied to Facebook Graph API limits
- **Twitter**: 300 requests per 15-minute window
- **TikTok**: 1000 requests per day
- **YouTube**: 10,000 units per day

### Best Practices
1. Implement proper error handling and retry logic
2. Cache access tokens securely
3. Monitor API usage to avoid rate limits
4. Use refresh tokens when available
5. Implement exponential backoff for failures

## 🚀 Deployment

### Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in all required OAuth credentials
3. Update redirect URIs for your domain
4. Test all OAuth flows before production

### Production Considerations
- Use HTTPS for all OAuth callbacks
- Implement proper CORS policies
- Monitor OAuth token expiration
- Set up error logging and monitoring
- Consider implementing webhook handlers for real-time updates

## 📝 Next Steps

1. **Enhanced Analytics**: Add posting analytics and engagement metrics
2. **Scheduling**: Implement post scheduling functionality
3. **Content Templates**: Create platform-specific content templates
4. **Bulk Operations**: Add bulk posting and management features
5. **Webhook Integration**: Real-time updates from platforms
6. **Advanced Media**: Support for more media types (GIFs, polls, etc.)

## 🤝 Contributing

1. Follow the established API patterns for new platforms
2. Add proper error handling and validation
3. Include comprehensive tests for new features
4. Update documentation for any changes
5. Follow the existing code style and conventions

---

This phase provides a solid foundation for multi-platform social media management with comprehensive OAuth integration and posting capabilities across all major social media platforms.
