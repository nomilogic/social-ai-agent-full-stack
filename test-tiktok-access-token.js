import dotenv from 'dotenv'
import axios from 'axios'
import crypto from 'crypto'

// Load environment variables
dotenv.config()

console.log('🚀 TikTok Access Token Test\n')

// Test if we can make a token exchange request (without valid code)
console.log('🔐 Testing Token Exchange Endpoint...')

const clientKey = process.env.TIKTOK_CLIENT_ID || process.env.VITE_TIKTOK_CLIENT_ID
const clientSecret = process.env.TIKTOK_CLIENT_SECRET || process.env.VITE_TIKTOK_CLIENT_SECRET

// Simulate a token exchange request to see what kind of error we get
const testTokenExchange = async () => {
  try {
    const params = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code: 'test_code', // This will be invalid, but we can see the error format
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:5173/oauth/tiktok/callback',
      code_verifier: 'test_code_verifier'
    })

    console.log('Making test request to TikTok token endpoint...')
    const response = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        },
        timeout: 10000
      }
    )
    
    console.log('✅ Unexpected success:', response.data)
  } catch (error) {
    if (error.response) {
      console.log('📋 Expected Error Response:')
      console.log('Status:', error.response.status)
      console.log('Data:', error.response.data)
      
      // Analyze the error to understand what TikTok expects
      const errorData = error.response.data
      if (errorData.error === 'invalid_grant') {
        console.log('✅ Token endpoint is working (invalid_grant is expected for test code)')
      } else if (errorData.error === 'invalid_client') {
        console.log('❌ Client credentials issue - check your TikTok Developer Portal')
      } else if (errorData.error === 'invalid_request') {
        console.log('❌ Request format issue - PKCE or parameter problem')
      } else {
        console.log('⚠️ Unexpected error type:', errorData.error)
      }
    } else {
      console.log('❌ Network or timeout error:', error.message)
    }
  }
}

await testTokenExchange()
console.log('')

// Test server endpoint
console.log('🖥️ Testing Local Server Endpoint...')
try {
  console.log('Checking if your server is running...')
  const serverCheck = await axios.get('http://localhost:5000/api/oauth/health', { timeout: 3000 })
  console.log('✅ Server is running:', serverCheck.data.status)
  
  // Test the server-side token exchange endpoint
  console.log('Testing server-side token exchange...')
  const serverResponse = await axios.post('http://localhost:5000/api/tiktok/access-token', {
    code: 'test_code',
    redirect_uri: 'http://localhost:5173/oauth/tiktok/callback',
    code_verifier: 'test_code_verifier_that_is_long_enough_to_pass_validation_checks',
    user_id: 'test_user'
  }, { timeout: 10000 })
  
  console.log('Server response:', serverResponse.data)
} catch (error) {
  if (error.response) {
    console.log('📋 Server Error Response:')
    console.log('Status:', error.response.status)
    console.log('Data:', error.response.data)
  } else if (error.code === 'ECONNREFUSED') {
    console.log('❌ Server is not running. Start your server with: npm run dev')
  } else {
    console.log('❌ Server error:', error.message)
  }
}

console.log('')

// Check if OAuth manager is working
console.log('🔧 Testing OAuth Manager...')
try {
  const healthCheck = await axios.get('http://localhost:5000/api/oauth/health', { timeout: 3000 })
  console.log('✅ OAuth Manager Health:', healthCheck.data.status)
  console.log('✅ Configured Platforms:', healthCheck.data.platforms)
  
  if (healthCheck.data.platforms.includes('tiktok')) {
    console.log('✅ TikTok is configured in OAuth Manager')
  } else {
    console.log('❌ TikTok is NOT configured in OAuth Manager')
  }
} catch (error) {
  console.log('❌ OAuth Manager not accessible')
}

console.log('')

// Generate a real OAuth URL for manual testing
console.log('🔗 Manual Test OAuth URL:')
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
const state = crypto.randomBytes(16).toString('hex')

const oauthUrl = `https://www.tiktok.com/v2/auth/authorize?${new URLSearchParams({
  client_key: clientKey,
  response_type: 'code',
  scope: 'user.info.basic,video.publish',
  redirect_uri: 'http://localhost:5173/oauth/tiktok/callback',
  state: state,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256'
}).toString()}`

console.log('Manual test URL (copy and paste in browser):')
console.log(oauthUrl)
console.log('')
console.log('Store these values for manual testing:')
console.log('Code Verifier:', codeVerifier)
console.log('State:', state)
console.log('')

console.log('🎯 Troubleshooting Guide:')
console.log('')
console.log('If you\'re still having issues getting access tokens:')
console.log('')
console.log('1. 🏗️  TikTok Developer Portal Issues:')
console.log('   - Your app might not be approved for production')
console.log('   - Wrong redirect URIs configured')
console.log('   - Missing required scopes')
console.log('   - App might be in sandbox mode')
console.log('')
console.log('2. 🔐 PKCE Issues:')
console.log('   - Code verifier not matching code challenge')
console.log('   - Using wrong PKCE method')
console.log('   - Code verifier too short/long')
console.log('')
console.log('3. 🌐 Network Issues:')
console.log('   - Rate limiting from TikTok')
console.log('   - Firewall blocking requests')
console.log('   - Wrong API endpoints')
console.log('')
console.log('4. ⏰ Timing Issues:')
console.log('   - Authorization code expired (10 minutes)')
console.log('   - State parameter mismatch')
console.log('   - PKCE parameters not matching')
console.log('')
console.log('Next: Test the OAuth flow manually or check your TikTok Developer Portal settings!')
