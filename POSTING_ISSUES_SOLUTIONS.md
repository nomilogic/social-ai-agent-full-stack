# 🔧 Social Media Posting Issues - Solutions Guide

## 📋 Issues Summary

Your YouTube and Facebook are showing "Connected" but "Failed" due to three main issues:

### ✅ **FIXED: Database Schema Issue** 
- **Problem**: `column "file_name" of relation "media" does not exist`
- **Impact**: Video uploads failed, preventing YouTube posting
- **Solution**: ✅ **COMPLETED** - Updated schema and media routes to use snake_case

### ❌ **TO FIX: Facebook Permissions Issue**
- **Problem**: Error Code 200 - Missing posting permissions
- **Impact**: Facebook posting fails with OAuth exception
- **Solution**: Update Facebook app permissions

### ⚠️ **TO FIX: YouTube Token Expiration**
- **Problem**: YouTube token expires every hour
- **Impact**: YouTube posting fails after token expires
- **Solution**: Implement automatic token refresh

---

## 🔍 **Issue 1: Database Schema (FIXED ✅)**

### What was wrong:
```
Error: column "file_name" of relation "media" does not exist
```

### What I fixed:
1. **Updated schema.ts**: Changed camelCase to snake_case field names
2. **Updated media routes**: Fixed all database queries to use correct field names

### Files changed:
- `shared/schema.ts` - Fixed media table schema
- `server/routes/media.ts` - Fixed all database operations

---

## 🔧 **Issue 2: Facebook Permissions (NEEDS FIX ❌)**

### Error Details:
```
Error Code: 200 - OAuthException
Message: requires both pages_read_engagement and pages_manage_posts permission
```

### **SOLUTION STEPS:**

#### Option A: Request Additional Permissions (Recommended)
1. **Go to Facebook Developer Console**: https://developers.facebook.com/apps
2. **Select your app**
3. **Go to "App Review" section**
4. **Request these permissions:**
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_read_user_content`

#### Option B: Use Basic User Permissions (Quick Fix)
For personal posting only, you can modify the Facebook route to handle personal profile posts better.

### **Code Fix for Personal Posts:**
```javascript
// In facebook.ts - Add better handling for personal vs page posting
const targetId = pageId || 'me' // This already exists
// Add better error handling for personal account limitations
```

---

## ⏰ **Issue 3: YouTube Token Expiration (NEEDS FIX ⚠️)**

### Problem:
YouTube tokens expire after 1 hour: `expires_at: 2025-08-20T12:10:13.400Z`

### **SOLUTION STEPS:**

#### Option A: Implement Auto Token Refresh (Recommended)
Add this to your YouTube routes:

```javascript
// Add to youtube.ts before any API call
async function ensureValidToken(accessToken, refreshToken) {
  // Check if token is expired
  // If expired, use refresh token to get new access token
  // Update database with new token
  // Return valid access token
}
```

#### Option B: Increase Token Validity
Request offline access in your OAuth flow to get longer-lived tokens.

---

## 🚀 **Quick Test Solutions**

### **1. Test Media Upload (Should work now ✅)**
```bash
# Start server
npm run dev

# Try uploading a video file in the UI
# Should now work without database errors
```

### **2. Test Facebook Posting**
For immediate testing with personal account:
- Try posting to your personal timeline
- If it fails, the app needs Facebook app review for page permissions

### **3. Test YouTube Posting**
- Should work for ~1 hour after connecting
- After 1 hour, will need token refresh

---

## 📋 **Implementation Priority**

### **High Priority (Immediate):**
1. ✅ **DONE**: Database schema fix
2. 🔄 **NEXT**: Implement YouTube token refresh
3. 🔄 **NEXT**: Submit Facebook app for review

### **Medium Priority:**
4. Add better error messages in UI
5. Add retry logic for expired tokens
6. Add token expiration warnings

---

## 🧪 **Testing Your Fixes**

### **Test Media Upload:**
```bash
# Should work now - try uploading a video
curl -X POST http://localhost:5000/api/media/upload \
  -F "file=@test-video.mp4" \
  -F "userId=763fac3c-ea7c-42c3-8a20-b3c968cb5265"
```

### **Test Facebook Posting:**
```bash
# Run the diagnostic script
node diagnose-posting.js
```

### **Test YouTube Posting:**
```bash
# Will work until token expires
# Then needs refresh token implementation
```

---

## 💡 **Next Steps**

1. **Start the server**: `npm run dev`
2. **Test video upload**: Should work now ✅
3. **For Facebook**: Submit app for review or test with personal posts
4. **For YouTube**: Implement token refresh logic
5. **Test everything**: Use the diagnostic script to verify fixes

---

## 🎯 **Expected Results After Fixes**

- ✅ **Media Upload**: Working
- 🔄 **Facebook**: Will work after permissions approval
- 🔄 **YouTube**: Will work reliably after token refresh implementation

The database schema fix was the critical blocker - now you can upload videos which enables YouTube posting! 🚀
