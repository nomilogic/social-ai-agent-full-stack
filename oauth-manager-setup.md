# OAuth Manager Integration Guide

## Step 1: Set up OAuth Manager Service

### Prerequisites
- Node.js 16+ installed
- Redis server (optional but recommended)

### 1. Install OAuth Manager Dependencies
```bash
cd c:\dev\digital-cube\apis\oauth-manager
npm install
```

### 2. Create Configuration
```bash
cp config.template.json config.json
```

### 3. Update config.json
Edit the config file with your credentials:
```json
{
  "server": {
    "port": 5001,
    "jwt_secret": "your-super-secure-jwt-secret-key",
    "session_secret": "your-super-secure-session-secret",
    "base_url": "http://localhost:5001",
    "cors_origins": ["http://localhost:5173", "http://localhost:5000"]
  },
  "platforms": {
    "facebook": {
      "client_id": "YOUR_FACEBOOK_CLIENT_ID",
      "client_secret": "YOUR_FACEBOOK_CLIENT_SECRET",
      "redirect_uri": "http://localhost:5001/auth/facebook/callback"
    },
    "linkedin": {
      "client_id": "YOUR_LINKEDIN_CLIENT_ID", 
      "client_secret": "YOUR_LINKEDIN_CLIENT_SECRET",
      "redirect_uri": "http://localhost:5001/auth/linkedin/callback"
    }
    // ... other platforms
  }
}
```

### 4. Start Redis (Optional)
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install Redis locally and start
redis-server
```

### 5. Start OAuth Manager
```bash
npm start
```

The OAuth Manager will run on http://localhost:5001

## Step 2: Update Your S-AI App

### Environment Variables
Add to your .env file:
```
VITE_OAUTH_MANAGER_URL=http://localhost:5001
```

### Client Integration
Replace your current OAuth implementation with the OAuth Manager client.

## Step 3: Test Integration

1. Start OAuth Manager: `cd c:\dev\digital-cube\apis\oauth-manager && npm start`
2. Start your S-AI app: `npm run dev` 
3. Test OAuth connections in your app

## Benefits You'll Get

✅ **Unified OAuth Management**: All platforms handled consistently
✅ **Automatic Token Refresh**: Built-in refresh logic
✅ **Production Features**: Rate limiting, security, logging
✅ **Better Error Handling**: Comprehensive error recovery
✅ **PKCE Support**: Secure Twitter OAuth 2.0
✅ **Redis Caching**: Fast token retrieval
✅ **Health Monitoring**: Built-in health checks

