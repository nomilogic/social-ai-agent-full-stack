// Debug script for TikTok PKCE localStorage issues
// Run this in your browser console to check PKCE state

console.log('🔍 TikTok PKCE Debug Information');
console.log('================================');

// Check localStorage values
const codeVerifier = localStorage.getItem('tiktok_code_verifier');
const oauthState = localStorage.getItem('tiktok_oauth_state');
const userInfo = localStorage.getItem('user');
const authToken = localStorage.getItem('auth_token');

console.log('📋 localStorage Status:');
console.log('- tiktok_code_verifier:', codeVerifier ? `Present (${codeVerifier.length} chars)` : 'MISSING');
console.log('- tiktok_oauth_state:', oauthState ? `Present (${oauthState.length} chars)` : 'MISSING');
console.log('- user:', userInfo ? 'Present' : 'MISSING');
console.log('- auth_token:', authToken ? 'Present' : 'MISSING');

console.log('\n🔐 PKCE Parameter Details:');
if (codeVerifier) {
  console.log('Code Verifier:', codeVerifier);
  console.log('Code Verifier Length:', codeVerifier.length);
  console.log('Code Verifier Valid:', /^[A-Za-z0-9\-._~]+$/.test(codeVerifier) && codeVerifier.length >= 43 && codeVerifier.length <= 128);
} else {
  console.log('❌ Code Verifier is missing!');
}

if (oauthState) {
  console.log('OAuth State:', oauthState);
  console.log('OAuth State Length:', oauthState.length);
} else {
  console.log('❌ OAuth State is missing!');
}

console.log('\n🚪 Popup Window Check:');
console.log('Window opener:', window.opener ? 'Present (in popup)' : 'Not present (main window)');
console.log('Window location:', window.location.href);

console.log('\n⚠️ Common Issues:');
if (!codeVerifier) {
  console.log('❌ Missing code_verifier - this will cause "Missing code_verifier for PKCE" error');
  console.log('💡 Solution: Ensure PKCE parameters are stored before opening popup');
}

if (!oauthState) {
  console.log('❌ Missing OAuth state - this will cause state mismatch errors');
}

if (!userInfo) {
  console.log('❌ User not logged in - TikTok connection will fail');
  console.log('💡 Solution: Login to your app first');
}

console.log('\n🔧 Manual Fix (if needed):');
console.log('If you need to manually set PKCE parameters for testing:');
console.log(`
// Generate test parameters
const testCodeVerifier = 'test_' + Array(120).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[Math.floor(Math.random() * 66)]).join('');
const testState = 'test_' + Math.random().toString(36).substring(2, 18);

localStorage.setItem('tiktok_code_verifier', testCodeVerifier);
localStorage.setItem('tiktok_oauth_state', testState);

console.log('✅ Test PKCE parameters set');
`);

// If we're in the callback page, check URL parameters
if (window.location.pathname.includes('/oauth/tiktok/callback')) {
  console.log('\n🔍 Callback URL Analysis:');
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  console.log('- Authorization Code:', code ? `Present (${code.substring(0, 20)}...)` : 'MISSING');
  console.log('- State Parameter:', state ? `Present (${state})` : 'MISSING');
  
  if (state && oauthState) {
    console.log('- State Match:', state === oauthState ? '✅ Match' : '❌ Mismatch');
  }
  
  console.log('\n🔄 Callback Process Status:');
  if (!code) {
    console.log('❌ No authorization code - OAuth flow failed');
  }
  if (!codeVerifier) {
    console.log('❌ No code_verifier - PKCE validation will fail');
  }
  if (state && oauthState && state !== oauthState) {
    console.log('❌ State mismatch - potential security issue');
  }
  if (code && codeVerifier && state && oauthState && state === oauthState) {
    console.log('✅ All parameters present - callback should work');
  }
}
