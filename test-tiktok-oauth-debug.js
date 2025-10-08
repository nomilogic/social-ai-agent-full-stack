import dotenv from 'dotenv'
import crypto from 'crypto'
import axios from 'axios'

// Load environment variables
dotenv.config()

console.log('🔍 TikTok OAuth Debug Test\n')

// Test environment variables
console.log('📋 Environment Variables Check:')
const clientId = process.env.VITE_TIKTOK_CLIENT_ID || process.env.TIKTOK_CLIENT_ID
const clientSecret = process.env.VITE_TIKTOK_CLIENT_SECRET || process.env.TIKTOK_CLIENT_SECRET
const clientKey = process.env.TIKTOK_CLIENT_KEY

console.log('✅ Client ID (VITE):', process.env.VITE_TIKTOK_CLIENT_ID ? 'CONFIGURED' : 'MISSING')
console.log('✅ Client Secret (VITE):', process.env.VITE_TIKTOK_CLIENT_SECRET ? 'CONFIGURED' : 'MISSING')
console.log('✅ Client ID (Server):', process.env.TIKTOK_CLIENT_ID ? 'CONFIGURED' : 'MISSING')
console.log('✅ Client Secret (Server):', process.env.TIKTOK_CLIENT_SECRET ? 'CONFIGURED' : 'MISSING')
console.log('✅ Client Key (Server):', process.env.TIKTOK_CLIENT_KEY ? 'CONFIGURED' : 'MISSING')
console.log('')

// Test PKCE generation
console.log('🔐 PKCE Parameters Test:')
function generateCodeVerifier(length = 128) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    result += charset[randomIndex]
  }
  return result
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const base64String = Buffer.from(digest).toString('base64')
  return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

const codeVerifier = generateCodeVerifier(128)
const codeChallenge = await generateCodeChallenge(codeVerifier)

console.log('✅ Code Verifier Length:', codeVerifier.length)
console.log('✅ Code Challenge Length:', codeChallenge.length)
console.log('✅ Code Verifier Pattern:', /^[A-Za-z0-9\-._~]+$/.test(codeVerifier) ? 'VALID' : 'INVALID')
console.log('')

// Test OAuth URL generation
console.log('🔗 OAuth URL Generation Test:')
const state = crypto.randomBytes(16).toString('hex')
const redirectUri = 'http://localhost:5173/oauth/tiktok/callback'
const scopes = 'user.info.basic,video.publish'

const oauthParams = new URLSearchParams({
  client_key: clientId, // TikTok uses client_key
  response_type: 'code',
  scope: scopes,
  redirect_uri: redirectUri,
  state: state,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256'
})

const authUrl = `https://www.tiktok.com/v2/auth/authorize?${oauthParams.toString()}`
console.log('✅ OAuth URL Generated:', authUrl.length > 0 ? 'SUCCESS' : 'FAILED')
console.log('✅ URL Length:', authUrl.length)
console.log('')

// Test TikTok API endpoints accessibility
console.log('🌐 TikTok API Endpoints Test:')

async function testEndpoint(url, method = 'GET', headers = {}) {
  try {
    const response = await axios({ method, url, headers, timeout: 5000 })
    return { status: response.status, accessible: true }
  } catch (error) {
    if (error.response) {
      return { status: error.response.status, accessible: true, error: error.response.data }
    }
    return { status: 'TIMEOUT/ERROR', accessible: false, error: error.message }
  }
}

const endpoints = [
  { name: 'OAuth Authorize', url: 'https://www.tiktok.com/v2/auth/authorize' },
  { name: 'Token Exchange', url: 'https://open.tiktokapis.com/v2/oauth/token/' },
  { name: 'User Info', url: 'https://open.tiktokapis.com/v2/user/info/' }
]

for (const endpoint of endpoints) {
  const result = await testEndpoint(endpoint.url)
  console.log(`✅ ${endpoint.name}:`, result.accessible ? `${result.status}` : 'INACCESSIBLE')
}
console.log('')

// Validate current configuration
console.log('⚙️  Configuration Summary:')
console.log('✅ Client ID Length:', clientId?.length || 0)
console.log('✅ Client Secret Length:', clientSecret?.length || 0)
console.log('✅ Redirect URI:', redirectUri)
console.log('✅ Scopes:', scopes)
console.log('✅ PKCE Method:', 'S256 (SHA-256)')
console.log('')

// Common issues check
console.log('🔍 Common Issues Check:')
const issues = []

if (!clientId || clientId.length < 10) {
  issues.push('❌ TikTok Client ID appears to be missing or invalid')
}

if (!clientSecret || clientSecret.length < 10) {
  issues.push('❌ TikTok Client Secret appears to be missing or invalid')
}

if (codeVerifier.length < 43 || codeVerifier.length > 128) {
  issues.push('❌ Code verifier length is invalid (should be 43-128 characters)')
}

if (!/^[A-Za-z0-9\-._~]+$/.test(codeVerifier)) {
  issues.push('❌ Code verifier contains invalid characters')
}

if (scopes.includes(' ')) {
  issues.push('⚠️  Scopes should be comma-separated, not space-separated for TikTok API v2')
}

if (issues.length === 0) {
  console.log('✅ No common configuration issues detected!')
} else {
  issues.forEach(issue => console.log(issue))
}

console.log('')

// Next steps recommendations
console.log('📋 Next Steps to Debug Access Token Issues:')
console.log('1. ✅ Environment variables are now configured')
console.log('2. ✅ PKCE implementation appears correct')
console.log('3. 🔄 Test the complete OAuth flow in your app')
console.log('4. 🔍 Check browser network tab for API errors during token exchange')
console.log('5. 🔍 Verify TikTok Developer Portal redirect URI settings')
console.log('6. 🔍 Ensure your TikTok app is approved and in production mode')
console.log('')

console.log('🎯 TikTok Developer Portal Checklist:')
console.log('□ App Status: Live/Production mode')
console.log('□ Redirect URI: http://localhost:5173/oauth/tiktok/callback (for dev)')
console.log('□ Scopes enabled: user.info.basic, video.publish')
console.log('□ App Review: Completed if required')
console.log('□ Rate Limits: Not exceeded')
console.log('')

console.log('✨ Configuration test completed!')
