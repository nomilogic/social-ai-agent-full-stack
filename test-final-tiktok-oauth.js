import dotenv from 'dotenv'
import crypto from 'crypto'

// Load environment variables
dotenv.config()

console.log('🎯 Final TikTok OAuth Test\n')

// Generate real OAuth URL for manual testing
console.log('📋 Manual Test Instructions:\n')

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
const clientId = process.env.VITE_TIKTOK_CLIENT_ID || process.env.TIKTOK_CLIENT_ID

const oauthUrl = `https://www.tiktok.com/v2/auth/authorize?${new URLSearchParams({
  client_key: clientId,
  response_type: 'code',
  scope: 'user.info.basic,video.publish',
  redirect_uri: 'http://localhost:5173/oauth/tiktok/callback',
  state: state,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256'
}).toString()}`

console.log('1. 🔐 Store these values in browser localStorage before testing:')
console.log(`   localStorage.setItem('tiktok_code_verifier', '${codeVerifier}')`)
console.log(`   localStorage.setItem('tiktok_oauth_state', '${state}')`)
console.log('')
console.log('2. 🔗 Open this URL in your browser:')
console.log(oauthUrl)
console.log('')
console.log('3. ✅ If successful, TikTok will redirect to:')
console.log('   http://localhost:5173/oauth/tiktok/callback?code=...&state=...')
console.log('')
console.log('4. 🔍 Check browser console and server logs for errors')
console.log('')

// Common issues checklist
console.log('🔧 Troubleshooting Checklist:')
console.log('')
console.log('If you get "Failed to connect TikTok" errors, check:')
console.log('')
console.log('✅ TikTok Developer Portal:')
console.log('   - App status: Should be "Live" or approved')
console.log('   - Redirect URI: Must exactly match http://localhost:5173/oauth/tiktok/callback')
console.log('   - Scopes: Enable "user.info.basic" and "video.publish"')
console.log('   - Rate limits: Not exceeded')
console.log('')
console.log('✅ Environment:')
console.log('   - Client ID configured:', !!clientId)
console.log('   - Server running on port 5000')
console.log('   - Client running on port 5173')
console.log('')
console.log('✅ Browser:')
console.log('   - Popups allowed')
console.log('   - localStorage accessible')
console.log('   - User logged in to your app')
console.log('')

// Specific error meanings
console.log('📋 Common Error Messages:')
console.log('')
console.log('❌ "Missing code_verifier for PKCE"')
console.log('   → localStorage was cleared or PKCE params not stored')
console.log('')
console.log('❌ "OAuth state mismatch"') 
console.log('   → State parameter doesn\'t match stored value')
console.log('')
console.log('❌ "User not logged in"')
console.log('   → No user data in localStorage - login to your app first')
console.log('')
console.log('❌ "Invalid authorization code"')
console.log('   → Code expired (10 min limit) or already used')
console.log('')
console.log('❌ "Invalid redirect URI"')
console.log('   → TikTok Developer Portal redirect URI mismatch')
console.log('')

console.log('🎉 If everything works, you should see:')
console.log('   - "TikTok OAuth success" in browser console')
console.log('   - "TikTok token stored successfully" in server logs')
console.log('   - Access token saved in your database')
