import dotenv from 'dotenv'
import axios from 'axios'

// Load environment variables
dotenv.config()

console.log('🔍 TikTok OAuth Callback Debug Test\n')

// Simulate the exact request that the client is making
async function testCallbackFlow() {
  // Generate test PKCE parameters
  function generateCodeVerifier(length = 128) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    let result = ''
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      result += charset[randomIndex]
    }
    return result
  }

  const testCodeVerifier = generateCodeVerifier(128)
  console.log('Generated test code_verifier:', testCodeVerifier.length, 'chars')

  // Test the exact request structure the client is sending
  const testBody = {
    code: 'test_authorization_code_123',
    state: 'test_state_123',
    redirect_uri: 'http://localhost:5173/oauth/tiktok/callback',
    user_id: 'test_user_123',
    code_verifier: testCodeVerifier
  }

  console.log('Test request body structure:')
  console.log('- code:', testBody.code ? 'present' : 'missing')
  console.log('- state:', testBody.state ? 'present' : 'missing')
  console.log('- redirect_uri:', testBody.redirect_uri)
  console.log('- user_id:', testBody.user_id ? 'present' : 'missing')
  console.log('- code_verifier length:', testBody.code_verifier?.length || 0)
  console.log('')

  // Test server endpoint
  try {
    console.log('🔄 Testing TikTok access-token endpoint...')
    const response = await axios.post('http://localhost:5000/api/tiktok/access-token', testBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
    
    console.log('✅ Unexpected success response:', response.data)
  } catch (error) {
    if (error.response) {
      console.log('📋 Expected error response:')
      console.log('Status:', error.response.status)
      console.log('Error:', error.response.data)
      
      // Check if it's the expected TikTok API error or a parameter validation error
      const errorData = error.response.data
      if (errorData.error && errorData.error.includes('code_verifier')) {
        console.log('❌ PKCE parameter issue detected')
      } else if (errorData.error && errorData.error.includes('Invalid authorization code')) {
        console.log('✅ Code verifier is being passed correctly (TikTok returned expected invalid code error)')
      } else if (errorData.tiktok_error) {
        console.log('✅ Request reached TikTok API successfully (got TikTok error response)')
      } else {
        console.log('⚠️ Unexpected error type')
      }
    } else {
      console.log('❌ Network/connection error:', error.message)
    }
  }
}

// Test the unified OAuth route too
async function testUnifiedRoute() {
  console.log('\n🔄 Testing Unified OAuth callback route...')
  
  const testCodeVerifier = 'test_code_verifier_12345678901234567890123456789012345678901234567890'
  const testUserId = 'test_user_123'
  
  try {
    const callbackUrl = `/api/oauth/tiktok/callback?code=test_code&state=test_state&code_verifier=${encodeURIComponent(testCodeVerifier)}&user_id=${encodeURIComponent(testUserId)}&redirect_uri=${encodeURIComponent('http://localhost:5173/oauth/tiktok/callback')}`
    
    const response = await axios.get(`http://localhost:5000${callbackUrl}`, {
      timeout: 10000
    })
    
    console.log('📄 Unified route response (HTML):', response.data.substring(0, 200) + '...')
    
    // Check if it contains the expected postMessage script
    if (response.data.includes('postMessage')) {
      console.log('✅ Unified route returns postMessage script as expected')
    } else {
      console.log('❌ Unified route response doesn\'t contain postMessage script')
    }
    
  } catch (error) {
    if (error.response) {
      console.log('📋 Unified route error:')
      console.log('Status:', error.response.status)
      if (error.response.data.includes && error.response.data.includes('postMessage')) {
        console.log('✅ Error response contains postMessage script (expected for invalid code)')
      } else {
        console.log('Response preview:', error.response.data.substring(0, 200))
      }
    } else {
      console.log('❌ Network error:', error.message)
    }
  }
}

// Run both tests
await testCallbackFlow()
await testUnifiedRoute()

console.log('\n📋 Summary:')
console.log('If you see "Code verifier is being passed correctly" or "Request reached TikTok API successfully",')
console.log('then the PKCE parameters are working and the issue is likely:')
console.log('1. Invalid authorization code (expired/already used)')
console.log('2. TikTok Developer Portal configuration')
console.log('3. Redirect URI mismatch')
console.log('')
console.log('Next steps:')
console.log('1. Try the actual OAuth flow in your app with real codes')
console.log('2. Check browser network tab for the actual error')
console.log('3. Verify TikTok Developer Portal settings')
