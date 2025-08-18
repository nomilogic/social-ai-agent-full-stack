# Single-Server OAuth Integration Guide

## ✅ What We've Done

### 1. **Integrated OAuth Manager into S-AI Server**
- Created `server/lib/OAuthManager.ts` - Complete OAuth management system
- Uses **Supabase** instead of Redis for token storage
- Handles all 6 platforms: Facebook, Instagram, LinkedIn, Twitter, TikTok, YouTube

### 2. **Enhanced Server Routes**
- New file: `server/routes/oauth-enhanced-integrated.ts`
- Unified API endpoints for all OAuth operations
- Backward compatibility with existing routes

### 3. **Updated Client-Side Code**
- Modified `client/src/lib/oauthManagerClient.ts` to use main server
- Updated `client/src/hooks/useOAuthManager.ts` for single-server communication
- New component: `client/src/components/OAuthManagerNew.tsx`

### 4. **Supabase Integration**
- Created `supabase-oauth-states-table.sql` for OAuth state management
- Uses existing `oauth_tokens` table for token storage

## 🚀 Setup Instructions

### Step 1: Create OAuth States Table in Supabase

Run this SQL in your Supabase SQL editor:

```sql
-- Create oauth_states table for temporary state storage
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL,
    user_id TEXT NOT NULL,
    options TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
```

### Step 2: Update Your Server Routes

Replace your current OAuth route registration in `server/index.ts`:

```typescript
// Replace this:
import oauthRoutes from './routes/oauth';
app.use('/api/oauth', oauthRoutes);

// With this:
import enhancedOAuthRoutes from './routes/oauth-enhanced-integrated';
app.use('/api/oauth', enhancedOAuthRoutes);
```

### Step 3: Update Client Components

Replace your existing OAuth component usage:

```tsx
// Replace this:
import { OAuthManager } from './components/OAuthManager';

// With this:
import { OAuthManager } from './components/OAuthManagerNew';
```

### Step 4: Install Required Dependencies

Make sure you have the required packages:

```bash
npm install uuid @types/uuid
```

## 🔍 New API Endpoints

Your OAuth Manager now provides these unified endpoints:

### **OAuth Flow**
- `POST /api/oauth/:platform/connect` - Start OAuth flow
- `GET /api/oauth/:platform/callback` - Handle OAuth callback  
- `POST /api/oauth/:platform/disconnect` - Disconnect platform

### **Connection Management**
- `GET /api/oauth/connections/status/:userId` - Get all connections
- `GET /api/oauth/connections/:platform/:userId` - Get specific connection
- `GET /api/oauth/tokens/:platform/:userId` - Get access token

### **Configuration**
- `GET /api/oauth/config/platforms` - Get configured platforms
- `GET /api/oauth/health` - Health check

## 💪 Key Improvements

### ✅ **Single Server Architecture**
- No separate OAuth Manager service to run
- Everything integrated into your main S-AI server
- Simplified deployment and management

### ✅ **Supabase Storage**
- No Redis dependency
- All tokens stored securely in Supabase
- Automatic cleanup of expired OAuth states

### ✅ **Enhanced Features**
- **Automatic Token Refresh**: Tokens refresh automatically before expiring
- **Long-lived Tokens**: Facebook/Instagram tokens converted to long-lived
- **PKCE Support**: Secure Twitter OAuth with PKCE flow
- **Better Error Handling**: Comprehensive error recovery
- **Platform Detection**: Only configured platforms are shown

### ✅ **Production Ready**
- Proper error handling and logging
- Secure state parameter validation
- Token expiration management
- Profile data normalization

## 🧪 Testing Your Integration

### 1. Start Your S-AI Server
```bash
cd D:\S-AI
npm run dev
```

### 2. Test Health Check
Visit: http://localhost:5000/api/oauth/health

Should return:
```json
{
  "success": true,
  "status": "healthy",
  "storage": "supabase",
  "platforms": ["facebook", "linkedin", "youtube"]
}
```

### 3. Test Platform Configuration  
Visit: http://localhost:5000/api/oauth/config/platforms

### 4. Test OAuth Flow in Your App
- Go to your app's OAuth/connections page
- Try connecting to LinkedIn or Facebook
- OAuth popup should open and handle the flow

## 🔧 Platform Status

### ✅ **Ready to Test**
- **Facebook**: ✅ Configured with your credentials
- **LinkedIn**: ✅ Configured with your credentials  
- **YouTube**: ✅ Configured with your credentials

### ⚠️ **Needs Configuration**
- **Instagram**: Uses Facebook credentials but may need separate setup
- **Twitter**: Missing client ID/secret
- **TikTok**: Missing client ID/secret

## 🐛 Troubleshooting

### OAuth Popup Issues
- Ensure popups are allowed in your browser
- Check browser console for CORS errors
- Verify your app is running on localhost:5000

### Token Issues
- Check Supabase logs for storage errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Ensure `oauth_states` table exists

### Platform-Specific Issues
- Facebook: Update redirect URI to `http://localhost:5000/api/oauth/facebook/callback`
- LinkedIn: Update redirect URI to `http://localhost:5000/api/oauth/linkedin/callback`
- YouTube: Update redirect URI to `http://localhost:5000/api/oauth/youtube/callback`

## 🎉 Benefits You're Getting

✅ **Unified OAuth Management**: All platforms handled consistently  
✅ **Single Server**: No microservices complexity  
✅ **Supabase Integration**: Leverage your existing database  
✅ **Automatic Token Refresh**: No more expired token issues  
✅ **Production Ready**: Proper error handling, logging, security  
✅ **Better UX**: Consistent behavior across all platforms  
✅ **Easier Deployment**: One server to deploy and manage  

---

**🚀 You now have a production-ready, single-server OAuth system with Supabase storage!**
