# OAuth Manager Integration Testing Guide

## 🚀 How to Test the Integration

### Step 1: Start OAuth Manager Service
```bash
cd c:\dev\digital-cube\apis\oauth-manager
npm start
```

The OAuth Manager should start on **port 5001** and show:
```
✓ OAuth Manager Server running on http://localhost:5001
✓ Redis connection: Connected (or "Fallback to in-memory storage")
✓ Platforms configured: facebook, instagram, linkedin, youtube
```

### Step 2: Start Your S-AI App
```bash
cd D:\S-AI
npm run dev
```

Your app should start on **port 5173**.

### Step 3: Test the Integration

#### 3.1 Health Check
Visit: http://localhost:5001/health
You should see:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-18T...",
  "redis": "connected"
}
```

#### 3.2 Test Platform Configuration
Visit: http://localhost:5001/api/config/platforms
You should see the available platforms and their scopes.

#### 3.3 Test OAuth Flow in Your App
1. Go to your S-AI app (http://localhost:5173)
2. Navigate to the OAuth settings/connections page
3. Try connecting to LinkedIn or Facebook (which have valid credentials)
4. The OAuth popup should:
   - Open to the OAuth Manager URL (localhost:5001)
   - Redirect to the platform's OAuth page
   - Return with connection success

## 🔧 What's Changed

### ✅ Client Side (React)
- **New OAuth Manager Client**: `client/src/lib/oauthManagerClient.ts`
- **New React Hook**: `client/src/hooks/useOAuthManager.ts` 
- **Updated Component**: `client/src/components/OAuthManagerNew.tsx`
- **Environment Variable**: `VITE_OAUTH_MANAGER_URL=http://localhost:5001`

### ✅ Server Side
- **OAuth Manager Config**: `c:\dev\digital-cube\apis\oauth-manager\config.json`
- **Proxy Routes** (optional): `server/routes/oauth-proxy.ts`
- **Server Client**: `server/lib/oauthManagerClient.ts`

### ✅ OAuth Manager Service
- **Port**: 5001 (to avoid conflict with your app on 5000)
- **CORS**: Configured for localhost:5173 and localhost:5000
- **Credentials**: Using your existing Facebook, LinkedIn, and YouTube credentials

## 🔍 Troubleshooting

### OAuth Manager Not Starting
1. Check if port 5001 is available
2. Verify config.json has valid credentials
3. Check the logs: `c:\dev\digital-cube\apis\oauth-manager\oauth-manager.log`

### Redis Connection Issues
- OAuth Manager can work without Redis (falls back to in-memory storage)
- To install Redis: `docker run -d -p 6379:6379 redis:alpine`

### OAuth Popup Issues
- Ensure popups are allowed in your browser
- Check browser developer tools for CORS errors
- Verify the OAuth Manager is accessible at localhost:5001

### Platform-Specific Issues

#### LinkedIn
- ✅ Credentials configured
- Should work immediately

#### Facebook 
- ✅ Credentials configured  
- Should work immediately

#### YouTube
- ✅ Credentials configured
- Should work immediately

#### Twitter, TikTok, Instagram
- ❌ No credentials configured yet
- Will show "OAuth not configured" error

## 🎯 Next Steps After Testing

1. **Update Your Components**: Replace the old `OAuthManager.tsx` with `OAuthManagerNew.tsx`
2. **Update Import Statements**: Change imports to use the new hook
3. **Configure Missing Platforms**: Add Twitter, TikTok credentials when available
4. **Production Setup**: Configure production URLs and Redis

## 🔐 Benefits You're Getting

✅ **Automatic Token Refresh**: No more expired token issues
✅ **Unified Platform Handling**: Consistent behavior across all platforms  
✅ **Better Security**: PKCE, state validation, secure token storage
✅ **Production Ready**: Rate limiting, logging, monitoring
✅ **Centralized Management**: All OAuth logic in one service
✅ **Better Error Handling**: Comprehensive error recovery

---

**🎉 Once this is working, you'll have a much more robust and scalable OAuth system!**
