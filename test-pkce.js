// Quick test script to verify PKCE implementation
// Run this with: node test-pkce.js

import crypto from 'crypto';

// Base64url encode function (no padding, URL-safe)
function base64urlEncode(bytes) {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate code verifier (server-side version)
function generateCodeVerifier(length = 64) {
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

// Test the PKCE implementation
function testPKCE() {
  console.log('🔐 Testing TikTok PKCE Implementation\n');
  
  try {
    // Test 1: Generate code verifier
    console.log('1. Generating code verifier...');
    const verifier = generateCodeVerifier(64);
    console.log(`   ✅ Generated verifier (${verifier.length} chars): ${verifier.substring(0, 20)}...`);
    
    // Validate verifier length
    if (verifier.length < 43 || verifier.length > 128) {
      throw new Error(`Invalid verifier length: ${verifier.length}`);
    }
    
    // Validate verifier characters
    const validChars = /^[A-Za-z0-9\-._~]+$/;
    if (!validChars.test(verifier)) {
      throw new Error('Invalid characters in verifier');
    }
    
    // Test 2: Generate code challenge
    console.log('\n2. Generating code challenge...');
    const challenge = generateCodeChallenge(verifier);
    console.log(`   ✅ Generated challenge (${challenge.length} chars): ${challenge}`);
    
    // Validate challenge
    if (challenge.includes('+') || challenge.includes('/') || challenge.includes('=')) {
      throw new Error('Challenge contains invalid base64url characters');
    }
    
    // Test 3: Multiple generations should be unique
    console.log('\n3. Testing uniqueness...');
    const verifier2 = generateCodeVerifier(64);
    const challenge2 = generateCodeChallenge(verifier2);
    
    if (verifier === verifier2 || challenge === challenge2) {
      throw new Error('Generated values are not unique');
    }
    console.log('   ✅ Generated values are unique');
    
    // Test 4: Different length verifiers
    console.log('\n4. Testing different lengths...');
    const shortVerifier = generateCodeVerifier(43);  // minimum
    const longVerifier = generateCodeVerifier(128); // maximum
    
    console.log(`   ✅ Short verifier (${shortVerifier.length} chars): ${shortVerifier.substring(0, 20)}...`);
    console.log(`   ✅ Long verifier (${longVerifier.length} chars): ${longVerifier.substring(0, 20)}...`);
    
    // Test 5: Verify challenge is consistent for same verifier
    console.log('\n5. Testing consistency...');
    const challenge1a = generateCodeChallenge(verifier);
    const challenge1b = generateCodeChallenge(verifier);
    
    if (challenge1a !== challenge1b) {
      throw new Error('Challenge generation is not consistent');
    }
    console.log('   ✅ Challenge generation is consistent');
    
    console.log('\n🎉 All PKCE tests passed!');
    console.log('\nExample TikTok OAuth URL parameters:');
    console.log(`client_key=YOUR_TIKTOK_CLIENT_ID`);
    console.log(`response_type=code`);
    console.log(`scope=user.info.basic video.upload video.list`);
    console.log(`redirect_uri=https://your-app.com/oauth/tiktok/callback`);
    console.log(`state=random_state_value`);
    console.log(`code_challenge=${challenge}`);
    console.log(`code_challenge_method=S256`);
    
    console.log('\nFor token exchange, use:');
    console.log(`code_verifier=${verifier}`);
    
  } catch (error) {
    console.error('❌ PKCE test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testPKCE();
