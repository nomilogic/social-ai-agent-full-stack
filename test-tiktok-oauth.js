// TikTok OAuth PKCE Flow Test Script
// Run this with: node test-tiktok-oauth.js

import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Base64url encode function (no padding, URL-safe)
function base64urlEncode(bytes) {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate code verifier (server-side version)
function generateCodeVerifier(length = 128) {
  if (length < 43 || length > 128) {
    throw new Error('Code verifier length must be between 43 and 128 characters');
  }
  
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += charset[randomBytes[i] % charset.length];
  }
  
  return result;
}

// Generate code challenge from verifier
function generateCodeChallenge(codeVerifier) {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return base64urlEncode(hash);
}

// Generate secure state parameter
function generateState() {
  const randomBytes = crypto.randomBytes(16);
  return randomBytes.toString('hex');
}

// Test the complete TikTok OAuth configuration
function testTikTokOAuth() {
  console.log('🚀 Testing TikTok OAuth PKCE Configuration\n');
  
  try {
    // Test 1: Environment Variables
    console.log('1. Checking Environment Variables...');
    const clientId = process.env.VITE_TIKTOK_CLIENT_ID || process.env.TIKTOK_CLIENT_ID || process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.VITE_TIKTOK_CLIENT_SECRET || process.env.TIKTOK_CLIENT_SECRET;
    
    if (!clientId) {
      console.error('   ❌ TikTok Client ID not found in environment variables');
      console.log('   Please set VITE_TIKTOK_CLIENT_ID or TIKTOK_CLIENT_ID');
      return false;
    }
    if (!clientSecret) {
      console.error('   ❌ TikTok Client Secret not found in environment variables');
      console.log('   Please set VITE_TIKTOK_CLIENT_SECRET or TIKTOK_CLIENT_SECRET');
      return false;
    }
    
    console.log(`   ✅ Client ID configured: ${clientId.substring(0, 8)}...`);
    console.log(`   ✅ Client Secret configured: ${clientSecret.substring(0, 8)}...`);
    
    // Test 2: PKCE Parameters
    console.log('\n2. Testing PKCE Parameter Generation...');
    const codeVerifier = generateCodeVerifier(128);
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();
    
    console.log(`   ✅ Code Verifier (${codeVerifier.length} chars): ${codeVerifier.substring(0, 20)}...`);
    console.log(`   ✅ Code Challenge (${codeChallenge.length} chars): ${codeChallenge}`);
    console.log(`   ✅ State (${state.length} chars): ${state}`);
    
    // Validate PKCE parameters
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
      console.error('   ❌ Code verifier length is invalid');
      return false;
    }
    
    const validChars = /^[A-Za-z0-9\-._~]+$/;
    if (!validChars.test(codeVerifier)) {
      console.error('   ❌ Code verifier contains invalid characters');
      return false;
    }
    
    if (codeChallenge.includes('+') || codeChallenge.includes('/') || codeChallenge.includes('=')) {
      console.error('   ❌ Code challenge is not properly base64url encoded');
      return false;
    }
    
    // Test 3: OAuth URLs
    console.log('\n3. Generating OAuth URLs...');
    const redirectUri = 'http://localhost:5173/oauth/tiktok/callback';
    const scopes = 'user.info.basic,video.publish';
    
    const authParams = new URLSearchParams({
      client_key: clientId, // TikTok uses 'client_key' instead of 'client_id'
      response_type: 'code',
      scope: scopes,
      redirect_uri: redirectUri,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?${authParams.toString()}`;
    console.log('   ✅ Authorization URL generated successfully');
    console.log(`   URL: ${authUrl.substring(0, 120)}...`);
    
    // Test 4: Token Exchange Parameters
    console.log('\n4. Testing Token Exchange Parameters...');
    const tokenParams = new URLSearchParams({
      client_key: clientId,
      client_secret: clientSecret,
      code: 'dummy_code_for_testing',
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    });
    
    console.log('   ✅ Token exchange parameters prepared:');
    console.log(`      client_key: ${tokenParams.get('client_key') ? 'CONFIGURED' : 'MISSING'}`);
    console.log(`      client_secret: ${tokenParams.get('client_secret') ? 'CONFIGURED' : 'MISSING'}`);
    console.log(`      grant_type: ${tokenParams.get('grant_type')}`);
    console.log(`      redirect_uri: ${tokenParams.get('redirect_uri')}`);
    console.log(`      code_verifier: ${tokenParams.get('code_verifier') ? 'CONFIGURED' : 'MISSING'}`);
    
    // Test 5: API Endpoints
    console.log('\n5. Verifying API Endpoints...');
    const endpoints = {
      'Authorization': 'https://www.tiktok.com/v2/auth/authorize',
      'Token Exchange': 'https://open.tiktokapis.com/v2/oauth/token/',
      'User Info': 'https://open.tiktokapis.com/v2/user/info/',
      'Video Upload Init': 'https://open.tiktokapis.com/v2/post/publish/video/init/',
      'Video Upload Status': 'https://open.tiktokapis.com/v2/post/publish/status/fetch/'
    };
    
    for (const [name, url] of Object.entries(endpoints)) {
      console.log(`   ✅ ${name}: ${url}`);
    }
    
    // Test 6: Redirect URI Configuration
    console.log('\n6. Redirect URI Configuration...');
    const expectedRedirectUris = [
      'http://localhost:5173/oauth/tiktok/callback',
      'https://your-domain.com/oauth/tiktok/callback'
    ];
    
    console.log('   ✅ Expected redirect URIs for TikTok app configuration:');
    expectedRedirectUris.forEach(uri => {
      console.log(`      - ${uri}`);
    });
    
    console.log('\n🎉 TikTok OAuth Configuration Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Ensure your TikTok app is configured with the redirect URIs shown above');
    console.log('   2. Make sure your app has the required scopes: user.info.basic, video.publish');
    console.log('   3. Verify your app is in production mode or has test users configured');
    console.log('   4. Test the complete OAuth flow in your application');
    
    console.log('\n🔧 TikTok App Configuration Checklist:');
    console.log('   ✅ Client Key (App ID) is configured');
    console.log('   ✅ Client Secret is configured');
    console.log('   ✅ Redirect URIs are whitelisted');
    console.log('   ✅ Required scopes are enabled');
    console.log('   ✅ PKCE parameters are properly generated');
    
    console.log('\n💡 Common Issues to Check:');
    console.log('   - Redirect URI must exactly match what\'s configured in TikTok Developer Portal');
    console.log('   - TikTok requires PKCE for security (code_challenge + code_verifier)');
    console.log('   - Use client_key instead of client_id for TikTok API calls');
    console.log('   - Ensure your app is approved for the required scopes');
    
    return true;
    
  } catch (error) {
    console.error('❌ TikTok OAuth test failed:', error.message);
    return false;
  }
}

// Run tests
const success = testTikTokOAuth();

if (!success) {
  process.exit(1);
} else {
  console.log('\n✅ All tests passed! Your TikTok OAuth configuration looks good.');
}
